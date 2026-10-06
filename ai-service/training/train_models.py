"""
LumiChain AI Layer - Step 5
============================
Model Training and Comparison

Trains four baseline classifiers:
    1. Logistic Regression  (with StandardScaler, max_iter=2000, random_state=42)
    2. Decision Tree        (random_state=42, reasonable max_depth)
    3. Random Forest        (n_estimators=300, random_state=42, class_weight="balanced")
    4. Gradient Boosting    (n_estimators=200, random_state=42)

Evaluation metrics per model:
    1. Accuracy
    2. Precision macro
    3. Recall macro
    4. F1 macro
    5. Weighted precision
    6. Weighted recall
    7. Weighted F1
    8. 5-fold stratified cross-validation F1 macro
    9. Training time
    10. Prediction time

Artifacts generated:
    - models/candidates/                        -- candidate model & scaler files (.pkl)
    - models/model_comparison.csv               -- ranked comparison table
    - notebooks/eda_outputs/model_confusion_matrices/ -- confusion matrix visualizations

CRITICAL SAFETY & BEST PRACTICES:
    - StandardScaler fit ONLY on X_train (applied to X_test via transform)
    - No scaling on tree-based models
    - Cross-validation on Logistic Regression uses Pipeline to prevent fold leakage
    - Model ranking prioritized by: Macro F1 > Macro Recall > Weighted F1 > Accuracy
    - Special attention to recall on critical failure classes:
      LAMP_FAILURE, POWER_FAILURE, SENSOR_FAILURE, VOLTAGE_ANOMALY
    - Test set is never used during training or CV
    - No dataset modification, no SMOTE, no hyperparameter search

Author  : LumiChain AI Team
Purpose : Step 5 Baseline model training and comparison
"""

import os
import sys
import time
import warnings
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model    import LogisticRegression
from sklearn.tree            import DecisionTreeClassifier
from sklearn.ensemble        import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing   import StandardScaler, LabelEncoder
from sklearn.pipeline        import Pipeline
from sklearn.metrics         import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
CV_FOLDS    = 5

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR   = os.path.join(BASE_DIR, "..", "data", "processed")
MODELS_DIR      = os.path.join(BASE_DIR, "..", "models")
CANDIDATES_DIR  = os.path.join(MODELS_DIR, "candidates")
ENCODER_PATH    = os.path.join(MODELS_DIR, "label_encoder.pkl")
COMPARISON_PATH = os.path.join(MODELS_DIR, "model_comparison.csv")
CM_DIR          = os.path.join(BASE_DIR, "..", "notebooks", "eda_outputs",
                               "model_confusion_matrices")

os.makedirs(CANDIDATES_DIR, exist_ok=True)
os.makedirs(CM_DIR, exist_ok=True)

SEP  = "=" * 80
SEP2 = "-" * 80

# ---------------------------------------------------------------------------
# Model Registry
# ---------------------------------------------------------------------------
# Format: (display_name, sklearn_estimator, needs_scaling)
MODEL_REGISTRY = [
    (
        "Logistic Regression",
        LogisticRegression(
            max_iter=2000,
            random_state=RANDOM_SEED,
            solver="lbfgs",
        ),
        True,   # StandardScaler required, fit ONLY on X_train
    ),
    (
        "Decision Tree",
        DecisionTreeClassifier(
            max_depth=10,
            min_samples_leaf=5,
            random_state=RANDOM_SEED,
        ),
        False,  # No scaling for tree-based models
    ),
    (
        "Random Forest",
        RandomForestClassifier(
            n_estimators=300,
            random_state=RANDOM_SEED,
            class_weight="balanced",
            n_jobs=-1,
        ),
        False,  # No scaling for tree-based models
    ),
    (
        "Gradient Boosting",
        GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=RANDOM_SEED,
        ),
        False,  # No scaling for tree-based models
    ),
]


# ---------------------------------------------------------------------------
# Data Loading
# ---------------------------------------------------------------------------
def load_splits():
    """Load the four processed CSV splits and fitted label encoder."""
    print(f"  Loading processed splits from: {os.path.abspath(PROCESSED_DIR)}")

    x_train_path = os.path.join(PROCESSED_DIR, "X_train.csv")
    x_test_path  = os.path.join(PROCESSED_DIR, "X_test.csv")
    y_train_path = os.path.join(PROCESSED_DIR, "y_train.csv")
    y_test_path  = os.path.join(PROCESSED_DIR, "y_test.csv")

    for p in [x_train_path, x_test_path, y_train_path, y_test_path]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing required file: {p}. Run preprocessing first.")

    X_train = pd.read_csv(x_train_path)
    X_test  = pd.read_csv(x_test_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    y_test  = pd.read_csv(y_test_path).squeeze()

    if not os.path.exists(ENCODER_PATH):
        raise FileNotFoundError(f"Missing label encoder: {ENCODER_PATH}")
    le = joblib.load(ENCODER_PATH)

    print(f"  X_train : {X_train.shape}   y_train : {y_train.shape}")
    print(f"  X_test  : {X_test.shape}    y_test  : {y_test.shape}")
    print(f"  Classes : {dict(enumerate(le.classes_))}")
    return X_train, X_test, y_train, y_test, le


# ---------------------------------------------------------------------------
# Scaling Helper (Logistic Regression only)
# ---------------------------------------------------------------------------
def fit_and_apply_scaler(X_train: pd.DataFrame, X_test: pd.DataFrame):
    """
    Fit StandardScaler ONLY on X_train.
    Transform X_train and X_test without fitting on X_test.
    """
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)
    return scaler, X_train_scaled, X_test_scaled


# ---------------------------------------------------------------------------
# Confusion Matrix Plotting
# ---------------------------------------------------------------------------
def plot_confusion_matrix(
    cm: np.ndarray,
    class_names: list,
    model_name: str,
    out_dir: str,
) -> str:
    """Save a clean, formatted confusion matrix heatmap."""
    fig, ax = plt.subplots(figsize=(8, 6.5))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=class_names, yticklabels=class_names,
        linewidths=0.5, linecolor="white",
        cbar_kws={"shrink": 0.8}, ax=ax,
    )
    ax.set_title(f"Confusion Matrix - {model_name}", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted Label", fontsize=11, labelpad=8)
    ax.set_ylabel("True Label", fontsize=11, labelpad=8)
    ax.tick_params(axis="x", rotation=30, labelsize=9)
    ax.tick_params(axis="y", rotation=0,  labelsize=9)
    plt.tight_layout()

    safe_name = model_name.lower().replace(" ", "_")
    path = os.path.join(out_dir, f"cm_{safe_name}.png")
    plt.savefig(path, bbox_inches="tight", dpi=300)
    plt.close()
    return path


# ---------------------------------------------------------------------------
# Per-class Recall Helper
# ---------------------------------------------------------------------------
def calculate_per_class_recall(y_true, y_pred, le: LabelEncoder) -> dict:
    """Calculate recall for each class individually."""
    recalls = recall_score(y_true, y_pred, average=None, zero_division=0)
    return {cls: round(float(r), 4) for cls, r in zip(le.classes_, recalls)}


# ---------------------------------------------------------------------------
# Train and Evaluate Single Model
# ---------------------------------------------------------------------------
def train_and_evaluate(
    name: str,
    estimator,
    needs_scaling: bool,
    X_train: pd.DataFrame,
    X_test:  pd.DataFrame,
    y_train: pd.Series,
    y_test:  pd.Series,
    le: LabelEncoder,
) -> dict:
    """
    Train model, evaluate all required metrics, run 5-fold CV,
    save artifacts, and return results dict.
    """
    print(f"\n{SEP2}")
    print(f"  Training Model: {name}")
    print(SEP2)

    # 1. Feature scaling if needed
    scaler = None
    if needs_scaling:
        scaler, X_train_arr, X_test_arr = fit_and_apply_scaler(X_train, X_test)
        print("  StandardScaler fitted ONLY on X_train and applied to X_train & X_test.")
    else:
        X_train_arr = X_train.values
        X_test_arr  = X_test.values
        print("  Tree-based model: No feature scaling applied.")

    # 2. 5-fold Stratified Cross-Validation on Training Set
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    if needs_scaling:
        # Wrap in Pipeline so scaler is fit only on training folds within CV
        cv_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", estimator),
        ])
        cv_scores = cross_val_score(
            cv_pipeline, X_train, y_train,
            cv=cv, scoring="f1_macro", n_jobs=-1,
        )
    else:
        cv_scores = cross_val_score(
            estimator, X_train, y_train,
            cv=cv, scoring="f1_macro", n_jobs=-1,
        )

    cv_mean = float(cv_scores.mean())
    cv_std  = float(cv_scores.std())
    print(f"  5-fold CV Macro F1 : {cv_mean:.4f} (+/- {cv_std:.4f})")
    print(f"  CV Fold Scores     : {[round(s, 4) for s in cv_scores]}")

    # 3. Fit on full training set and measure training time
    t_start = time.perf_counter()
    estimator.fit(X_train_arr, y_train)
    train_time = time.perf_counter() - t_start
    print(f"  Training Time      : {train_time:.4f}s")

    # 4. Predict on test set and measure prediction time
    t_start = time.perf_counter()
    y_pred = estimator.predict(X_test_arr)
    pred_time = time.perf_counter() - t_start
    print(f"  Prediction Time    : {pred_time:.4f}s")

    # 5. Calculate all required metrics
    acc      = accuracy_score(y_test, y_pred)
    prec_mac = precision_score(y_test, y_pred, average="macro",    zero_division=0)
    rec_mac  = recall_score(   y_test, y_pred, average="macro",    zero_division=0)
    f1_mac   = f1_score(       y_test, y_pred, average="macro",    zero_division=0)
    prec_wt  = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec_wt   = recall_score(   y_test, y_pred, average="weighted", zero_division=0)
    f1_wt    = f1_score(       y_test, y_pred, average="weighted", zero_division=0)

    print(f"  Test Accuracy      : {acc:.4f}")
    print(f"  Macro Precision    : {prec_mac:.4f}")
    print(f"  Macro Recall       : {rec_mac:.4f}")
    print(f"  Macro F1           : {f1_mac:.4f}")
    print(f"  Weighted Precision : {prec_wt:.4f}")
    print(f"  Weighted Recall    : {rec_wt:.4f}")
    print(f"  Weighted F1        : {f1_wt:.4f}")

    # 6. Classification Report
    print("\n  Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=le.classes_,
        zero_division=0,
    ))

    # 7. Confusion Matrix & Visualization
    cm = confusion_matrix(y_test, y_pred)
    print("  Confusion Matrix:")
    print(cm)
    cm_path = plot_confusion_matrix(cm, list(le.classes_), name, CM_DIR)
    print(f"  Confusion Matrix Plot saved -> {cm_path}")

    # 8. Per-class Recall
    pc_recall = calculate_per_class_recall(y_test, y_pred, le)
    print("  Per-class Recall:")
    for cls, r in pc_recall.items():
        flag = " [!] REVIEW (LOW RECALL)" if (cls != "WORKING" and r < 0.85) else ""
        print(f"    {cls:<22s}: {r:.4f}{flag}")

    # 9. Save candidate model and scaler
    safe_name = name.lower().replace(" ", "_")
    model_path = os.path.join(CANDIDATES_DIR, f"{safe_name}.pkl")
    joblib.dump(estimator, model_path)
    print(f"  Candidate Model saved      -> {model_path}")

    if scaler is not None:
        scaler_path = os.path.join(CANDIDATES_DIR, f"{safe_name}_scaler.pkl")
        joblib.dump(scaler, scaler_path)
        joblib.dump(scaler, os.path.join(CANDIDATES_DIR, "scaler.pkl"))
        print(f"  Candidate Scaler saved     -> {scaler_path}")

    return {
        "model"              : name,
        "accuracy"           : round(acc,      4),
        "macro_precision"    : round(prec_mac, 4),
        "macro_recall"       : round(rec_mac,  4),
        "macro_f1"           : round(f1_mac,   4),
        "weighted_precision" : round(prec_wt,  4),
        "weighted_recall"    : round(rec_wt,   4),
        "weighted_f1"        : round(f1_wt,    4),
        "cv_macro_f1_mean"   : round(cv_mean,  4),
        "cv_macro_f1_std"    : round(cv_std,   4),
        "train_time_s"       : round(train_time, 4),
        "pred_time_s"        : round(pred_time,  5),
        **{f"recall_{c.lower()}": r for c, r in pc_recall.items()},
    }


# ---------------------------------------------------------------------------
# Model Comparison & Ranking
# ---------------------------------------------------------------------------
def print_comparison_table(results: list[dict]) -> list[dict]:
    """
    Rank models by:
      1. Macro F1
      2. Macro Recall
      3. Weighted F1
      4. Accuracy
    and print comparison table matching requested layout.
    """
    ranked = sorted(results, key=lambda r: (
        -r["macro_f1"],
        -r["macro_recall"],
        -r["weighted_f1"],
        -r["accuracy"],
    ))

    print(f"\n{SEP}")
    print("MODEL COMPARISON TABLE")
    print("Ranking Criteria: Macro F1 > Macro Recall > Weighted F1 > Accuracy")
    print(SEP)

    header = "Model                  | Accuracy | Macro Precision | Macro Recall | Macro F1 | CV Macro F1 | Training Time"
    divider = "-" * len(header)
    print(header)
    print(divider)

    for r in ranked:
        train_time_str = f"{r['train_time_s']:.4f}s"
        print(
            f"{r['model']:<22} | "
            f"{r['accuracy']:>8.4f} | "
            f"{r['macro_precision']:>15.4f} | "
            f"{r['macro_recall']:>12.4f} | "
            f"{r['macro_f1']:>8.4f} | "
            f"{r['cv_macro_f1_mean']:>11.4f} | "
            f"{train_time_str:>13}"
        )
    print(divider)

    best = ranked[0]
    print(f"\n{SEP}")
    print(f"BEST BASELINE MODEL: {best['model']}")
    print(f"  Test Macro F1       : {best['macro_f1']:.4f}")
    print(f"  Test Macro Recall   : {best['macro_recall']:.4f}")
    print(f"  5-Fold CV Macro F1  : {best['cv_macro_f1_mean']:.4f} (+/- {best['cv_macro_f1_std']:.4f})")
    print(f"  Test Accuracy       : {best['accuracy']:.4f}")
    print(f"  Training Time       : {best['train_time_s']:.4f}s")
    print(f"  Status              : Saved in models/candidates/ for further hyperparameter tuning.")
    print(SEP)

    return ranked


def print_failure_recall_summary(results: list[dict], le: LabelEncoder):
    """
    Display recall breakdown specifically for failure classes to minimize
    missed streetlight failures:
      - LAMP_FAILURE
      - POWER_FAILURE
      - SENSOR_FAILURE
      - VOLTAGE_ANOMALY
    """
    failure_classes = [c for c in le.classes_ if c != "WORKING"]

    print(f"\n{SEP}")
    print("CRITICAL FAILURE DETECTION RECALL (Minimizing Missed Failures)")
    print(SEP)

    col_w = 18
    header = f"{'Model':<22}" + "".join(f"{c:>{col_w}}" for c in failure_classes)
    print(header)
    print("-" * len(header))

    for r in sorted(results, key=lambda x: -x["macro_recall"]):
        row = f"{r['model']:<22}"
        for c in failure_classes:
            val = r.get(f"recall_{c.lower()}", 0.0)
            row += f"{val:>{col_w}.4f}"
        print(row)
    print(SEP)


def save_comparison_csv(results: list[dict], path: str):
    """Save ranked model comparison results to CSV."""
    df = pd.DataFrame(results)
    df = df.sort_values(
        by=["macro_f1", "macro_recall", "weighted_f1", "accuracy"],
        ascending=[False, False, False, False]
    ).reset_index(drop=True)
    df.to_csv(path, index=False)
    print(f"  Model comparison CSV saved -> {os.path.abspath(path)}")


# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
def main():
    print(SEP)
    print("LumiChain AI Layer - Step 5: Model Training and Comparison")
    print(SEP)

    # 1. Load splits
    print("\n[Step 1/4] Loading preprocessed training and test data...")
    X_train, X_test, y_train, y_test, le = load_splits()

    # 2. Train and evaluate
    print("\n[Step 2/4] Training and evaluating baseline classification models...")
    results = []
    for name, estimator, needs_scaling in MODEL_REGISTRY:
        row = train_and_evaluate(
            name, estimator, needs_scaling,
            X_train, X_test, y_train, y_test, le,
        )
        results.append(row)

    # 3. Model comparison and ranking
    print("\n[Step 3/4] Ranking and comparing baseline models...")
    ranked = print_comparison_table(results)
    print_failure_recall_summary(results, le)

    # 4. Save results
    print("\n[Step 4/4] Saving model comparison artifacts...")
    save_comparison_csv(results, COMPARISON_PATH)

    print(f"  Confusion matrix plots -> {os.path.abspath(CM_DIR)}")
    print(f"  Candidate models saved -> {os.path.abspath(CANDIDATES_DIR)}")

    print(f"\n{SEP}")
    print("MODEL TRAINING AND COMPARISON COMPLETE")
    print(SEP)


if __name__ == "__main__":
    main()
