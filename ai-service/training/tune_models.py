"""
LumiChain AI Layer - Step 6
============================
Hyperparameter Tuning for Decision Tree and Random Forest

Performs controlled hyperparameter optimization:
    1. Decision Tree: GridSearchCV over criterion, max_depth, min_samples_split, min_samples_leaf
    2. Random Forest: RandomizedSearchCV (n_iter=40, random_state=42) over n_estimators,
       max_depth, min_samples_split, min_samples_leaf, max_features, class_weight

Validation & Safety:
    - StratifiedKFold (n_splits=5, shuffle=True, random_state=42)
    - Optimization objective: f1_macro
    - Fit & tuned strictly on X_train/y_train (no test set leakage)
    - Final evaluation on untouched X_test/y_test
    - Direct side-by-side comparison with baseline models
    - Priority on failure detection recall (minimizing missed streetlight failures)

Outputs:
    - models/tuned/tuned_decision_tree.pkl
    - models/tuned/tuned_random_forest.pkl
    - models/tuning_results.csv
    - notebooks/eda_outputs/tuned_confusion_matrices/cm_tuned_*.png

Author  : LumiChain AI Team
Purpose : Step 6 Hyperparameter Tuning and Model Selection
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

from sklearn.tree            import DecisionTreeClassifier
from sklearn.ensemble        import RandomForestClassifier
from sklearn.preprocessing   import LabelEncoder
from sklearn.metrics         import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix,
)
from sklearn.model_selection import (
    StratifiedKFold, GridSearchCV, RandomizedSearchCV, cross_val_score
)

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
CV_FOLDS    = 5

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR   = os.path.join(BASE_DIR, "..", "data", "processed")
MODELS_DIR      = os.path.join(BASE_DIR, "..", "models")
CANDIDATES_DIR  = os.path.join(MODELS_DIR, "candidates")
TUNED_DIR       = os.path.join(MODELS_DIR, "tuned")
ENCODER_PATH    = os.path.join(MODELS_DIR, "label_encoder.pkl")
RESULTS_CSV     = os.path.join(MODELS_DIR, "tuning_results.csv")
CM_TUNED_DIR    = os.path.join(BASE_DIR, "..", "notebooks", "eda_outputs",
                               "tuned_confusion_matrices")

os.makedirs(TUNED_DIR, exist_ok=True)
os.makedirs(CM_TUNED_DIR, exist_ok=True)

SEP  = "=" * 80
SEP2 = "-" * 80


# ---------------------------------------------------------------------------
# Data Loading & Validation
# ---------------------------------------------------------------------------
def load_data():
    """Load train/test splits and fitted label encoder with precondition checks."""
    print(f"  Loading preprocessed splits from: {os.path.abspath(PROCESSED_DIR)}")

    x_train_path = os.path.join(PROCESSED_DIR, "X_train.csv")
    x_test_path  = os.path.join(PROCESSED_DIR, "X_test.csv")
    y_train_path = os.path.join(PROCESSED_DIR, "y_train.csv")
    y_test_path  = os.path.join(PROCESSED_DIR, "y_test.csv")

    for path in [x_train_path, x_test_path, y_train_path, y_test_path, ENCODER_PATH]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required artifact not found: {path}")

    X_train = pd.read_csv(x_train_path)
    X_test  = pd.read_csv(x_test_path)
    y_train = pd.read_csv(y_train_path).squeeze()
    y_test  = pd.read_csv(y_test_path).squeeze()
    le: LabelEncoder = joblib.load(ENCODER_PATH)

    # Precondition assertions
    assert X_train.shape[1] == X_test.shape[1], "Mismatch in feature count between train and test"
    assert len(X_train) == len(y_train), "Mismatch in training sample and label counts"
    assert len(X_test) == len(y_test), "Mismatch in testing sample and label counts"
    assert not X_train.isnull().any().any(), "X_train contains missing values"
    assert not X_test.isnull().any().any(), "X_test contains missing values"

    print(f"  X_train: {X_train.shape} | y_train: {y_train.shape}")
    print(f"  X_test : {X_test.shape}  | y_test : {y_test.shape}")
    print(f"  Classes: {dict(enumerate(le.classes_))}")

    return X_train, X_test, y_train, y_test, le


# ---------------------------------------------------------------------------
# Visualization Helper
# ---------------------------------------------------------------------------
def plot_and_save_cm(cm: np.ndarray, class_names: list, model_name: str, out_dir: str) -> str:
    """Plot and save labeled confusion matrix heatmap."""
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

    safe_name = model_name.lower().replace(" ", "_").replace("-", "_")
    path = os.path.join(out_dir, f"cm_{safe_name}.png")
    plt.savefig(path, bbox_inches="tight", dpi=300)
    plt.close()
    return path


# ---------------------------------------------------------------------------
# Evaluation Routine
# ---------------------------------------------------------------------------
def evaluate_model(
    model_name: str,
    estimator,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    le: LabelEncoder,
    cv_macro_f1: float = None,
    best_params: dict = None,
    save_cm: bool = True,
    cm_dir: str = CM_TUNED_DIR,
) -> dict:
    """
    Evaluates an estimator on untouched X_test/y_test.
    Computes all standard metrics, per-class precision/recall/F1,
    and failure-specific recall indicators.
    """
    print(f"\n{SEP2}")
    print(f"  Evaluation: {model_name}")
    print(SEP2)

    # Predictions
    t0 = time.perf_counter()
    y_pred = estimator.predict(X_test.values)
    pred_time = time.perf_counter() - t0

    # Overall metrics
    acc      = accuracy_score(y_test, y_pred)
    prec_mac = precision_score(y_test, y_pred, average="macro", zero_division=0)
    rec_mac  = recall_score(y_test, y_pred, average="macro", zero_division=0)
    f1_mac   = f1_score(y_test, y_pred, average="macro", zero_division=0)
    prec_wt  = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec_wt   = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1_wt    = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    # Per-class metrics
    class_p = precision_score(y_test, y_pred, average=None, zero_division=0)
    class_r = recall_score(y_test, y_pred, average=None, zero_division=0)
    class_f = f1_score(y_test, y_pred, average=None, zero_division=0)

    per_class_metrics = {}
    for i, cls in enumerate(le.classes_):
        per_class_metrics[f"precision_{cls.lower()}"] = round(float(class_p[i]), 4)
        per_class_metrics[f"recall_{cls.lower()}"]    = round(float(class_r[i]), 4)
        per_class_metrics[f"f1_{cls.lower()}"]        = round(float(class_f[i]), 4)

    # Calculate overall failure recall (classes other than WORKING)
    failure_indices = [i for i, c in enumerate(le.classes_) if c != "WORKING"]
    failure_recalls = [class_r[i] for i in failure_indices]
    avg_failure_recall = float(np.mean(failure_recalls))
    sensor_recall = round(float(per_class_metrics.get("recall_sensor_failure", 0.0)), 4)

    print(f"  Test Accuracy          : {acc:.4f}")
    print(f"  Macro Precision        : {prec_mac:.4f}")
    print(f"  Macro Recall           : {rec_mac:.4f}")
    print(f"  Macro F1               : {f1_mac:.4f}")
    print(f"  Weighted F1            : {f1_wt:.4f}")
    if cv_macro_f1 is not None:
        print(f"  CV Macro F1 (5-Fold)   : {cv_macro_f1:.4f}")
    print(f"  SENSOR_FAILURE Recall  : {sensor_recall:.4f}")
    print(f"  Avg Failure Recall     : {avg_failure_recall:.4f}")
    print(f"  Prediction Time        : {pred_time:.4f}s")

    # Classification Report
    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("  Confusion Matrix:")
    print(cm)

    if save_cm:
        cm_path = plot_and_save_cm(cm, list(le.classes_), model_name, cm_dir)
        print(f"  Saved confusion matrix -> {cm_path}")

    return {
        "model"              : model_name,
        "accuracy"           : round(acc, 4),
        "macro_precision"    : round(prec_mac, 4),
        "macro_recall"       : round(rec_mac, 4),
        "macro_f1"           : round(f1_mac, 4),
        "weighted_precision" : round(prec_wt, 4),
        "weighted_recall"    : round(rec_wt, 4),
        "weighted_f1"        : round(f1_wt, 4),
        "cv_macro_f1"        : round(cv_macro_f1, 4) if cv_macro_f1 is not None else np.nan,
        "sensor_recall"      : sensor_recall,
        "avg_failure_recall" : round(avg_failure_recall, 4),
        "pred_time_s"        : round(pred_time, 5),
        "best_params"        : str(best_params) if best_params else "Baseline defaults",
        **per_class_metrics,
    }


# ---------------------------------------------------------------------------
# Decision Tree Tuning
# ---------------------------------------------------------------------------
def tune_decision_tree(X_train: pd.DataFrame, y_train: pd.Series, cv: StratifiedKFold):
    """
    GridSearchCV optimization for DecisionTreeClassifier.
    Grid search is computationally feasible and guarantees finding the best combination.
    """
    print(f"\n{SEP}")
    print("[1/2] HYPERPARAMETER TUNING: Decision Tree")
    print(SEP)

    param_grid = {
        "max_depth"        : [None, 5, 8, 10, 12, 15, 20],
        "min_samples_split": [2, 5, 10, 20],
        "min_samples_leaf" : [1, 2, 4, 8],
        "criterion"        : ["gini", "entropy"],
    }

    base_dt = DecisionTreeClassifier(random_state=RANDOM_SEED)

    grid_search = GridSearchCV(
        estimator=base_dt,
        param_grid=param_grid,
        scoring="f1_macro",
        cv=cv,
        n_jobs=-1,
        verbose=1,
    )

    t0 = time.perf_counter()
    grid_search.fit(X_train.values, y_train.values)
    tune_time = time.perf_counter() - t0

    print(f"  Tuning time: {tune_time:.2f}s")
    print(f"  Best 5-Fold CV Macro F1: {grid_search.best_score_:.4f}")
    print(f"  Best Parameters: {grid_search.best_params_}")

    best_model = grid_search.best_estimator_
    save_path = os.path.join(TUNED_DIR, "tuned_decision_tree.pkl")
    joblib.dump(best_model, save_path)
    print(f"  Saved tuned model -> {save_path}")

    return best_model, grid_search.best_score_, grid_search.best_params_


# ---------------------------------------------------------------------------
# Random Forest Tuning
# ---------------------------------------------------------------------------
def tune_random_forest(X_train: pd.DataFrame, y_train: pd.Series, cv: StratifiedKFold):
    """
    RandomizedSearchCV optimization for RandomForestClassifier.
    Uses n_iter=40, random_state=42 for controlled and thorough exploration.
    """
    print(f"\n{SEP}")
    print("[2/2] HYPERPARAMETER TUNING: Random Forest")
    print(SEP)

    param_dist = {
        "n_estimators"     : [100, 200, 300],
        "max_depth"        : [None, 10, 15, 20],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf" : [1, 2, 4],
        "max_features"     : ["sqrt", "log2"],
        "class_weight"     : [None, "balanced"],
    }

    base_rf = RandomForestClassifier(random_state=RANDOM_SEED, n_jobs=-1)

    random_search = RandomizedSearchCV(
        estimator=base_rf,
        param_distributions=param_dist,
        n_iter=40,
        scoring="f1_macro",
        cv=cv,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        verbose=1,
    )

    t0 = time.perf_counter()
    random_search.fit(X_train.values, y_train.values)
    tune_time = time.perf_counter() - t0

    print(f"  Tuning time: {tune_time:.2f}s")
    print(f"  Best 5-Fold CV Macro F1: {random_search.best_score_:.4f}")
    print(f"  Best Parameters: {random_search.best_params_}")

    best_model = random_search.best_estimator_
    save_path = os.path.join(TUNED_DIR, "tuned_random_forest.pkl")
    joblib.dump(best_model, save_path)
    print(f"  Saved tuned model -> {save_path}")

    return best_model, random_search.best_score_, random_search.best_params_


# ---------------------------------------------------------------------------
# Baseline Loader & Evaluator
# ---------------------------------------------------------------------------
def get_or_train_baseline_dt(X_train, y_train, cv):
    """Load candidate baseline Decision Tree or instantiate Step 5 baseline."""
    dt_cand_path = os.path.join(CANDIDATES_DIR, "decision_tree.pkl")
    if os.path.exists(dt_cand_path):
        model = joblib.load(dt_cand_path)
    else:
        model = DecisionTreeClassifier(max_depth=10, min_samples_leaf=5, random_state=RANDOM_SEED)
        model.fit(X_train.values, y_train.values)

    cv_scores = cross_val_score(model, X_train.values, y_train.values, cv=cv, scoring="f1_macro", n_jobs=-1)
    return model, float(cv_scores.mean())


def get_or_train_baseline_rf(X_train, y_train, cv):
    """Load candidate baseline Random Forest or instantiate Step 5 baseline."""
    rf_cand_path = os.path.join(CANDIDATES_DIR, "random_forest.pkl")
    if os.path.exists(rf_cand_path):
        model = joblib.load(rf_cand_path)
    else:
        model = RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=RANDOM_SEED, n_jobs=-1)
        model.fit(X_train.values, y_train.values)

    cv_scores = cross_val_score(model, X_train.values, y_train.values, cv=cv, scoring="f1_macro", n_jobs=-1)
    return model, float(cv_scores.mean())


# ---------------------------------------------------------------------------
# Comparison, Ranking & Reporting
# ---------------------------------------------------------------------------
def print_and_rank_results(all_results: list[dict], le: LabelEncoder):
    """
    Rank models by:
      1. Macro F1
      2. Macro Recall
      3. Failure-class recall (avg_failure_recall)
      4. Weighted F1
      5. Accuracy
    """
    ranked = sorted(all_results, key=lambda r: (
        -r["macro_f1"],
        -r["macro_recall"],
        -r["avg_failure_recall"],
        -r["weighted_f1"],
        -r["accuracy"],
    ))

    print(f"\n{SEP}")
    print("FOUR-WAY MODEL COMPARISON TABLE (BASELINE VS TUNED)")
    print("Ranking Criteria: Macro F1 > Macro Recall > Failure Recall > Weighted F1 > Accuracy")
    print(SEP)

    header = (
        f"{'Model':<25} | {'Accuracy':>8} | {'Macro F1':>8} | {'Macro Rec':>9} | "
        f"{'CV F1':>8} | {'Fail Rec':>8} | {'Sensor Rec':>10}"
    )
    divider = "-" * len(header)
    print(header)
    print(divider)

    for r in ranked:
        cv_str = f"{r['cv_macro_f1']:.4f}" if not np.isnan(r['cv_macro_f1']) else "N/A"
        print(
            f"{r['model']:<25} | "
            f"{r['accuracy']:>8.4f} | "
            f"{r['macro_f1']:>8.4f} | "
            f"{r['macro_recall']:>9.4f} | "
            f"{cv_str:>8} | "
            f"{r['avg_failure_recall']:>8.4f} | "
            f"{r['sensor_recall']:>10.4f}"
        )
    print(divider)

    # Per-failure recall table
    failure_classes = [c for c in le.classes_ if c != "WORKING"]
    print(f"\n{SEP}")
    print("FAILURE DETECTION RECALL BREAKDOWN (Crucial for LumiChain Reliability)")
    print(SEP)
    col_w = 18
    f_header = f"{'Model':<25}" + "".join(f"{c:>{col_w}}" for c in failure_classes)
    print(f_header)
    print("-" * len(f_header))
    for r in ranked:
        row = f"{r['model']:<25}"
        for c in failure_classes:
            val = r.get(f"recall_{c.lower()}", 0.0)
            row += f"{val:>{col_w}.4f}"
        print(row)
    print("-" * len(f_header))

    # Final Recommendation
    best = ranked[0]
    print(f"\n{SEP}")
    print(f"BEST TUNED MODEL: {best['model']}")
    print(f"  Test Macro F1          : {best['macro_f1']:.4f}")
    print(f"  Test Macro Recall      : {best['macro_recall']:.4f}")
    print(f"  Test Accuracy          : {best['accuracy']:.4f}")
    print(f"  SENSOR_FAILURE Recall  : {best['sensor_recall']:.4f}")
    print(f"  Overall Failure Recall : {best['avg_failure_recall']:.4f}")
    print(f"  5-Fold CV Macro F1     : {best['cv_macro_f1']:.4f}")
    print(f"  Best Hyperparameters   : {best['best_params']}")
    print(SEP)

    return ranked


def save_results_csv(results: list[dict], path: str):
    """Save ranked comparison table to CSV."""
    df = pd.DataFrame(results)
    df = df.sort_values(
        by=["macro_f1", "macro_recall", "avg_failure_recall", "weighted_f1", "accuracy"],
        ascending=[False, False, False, False, False]
    ).reset_index(drop=True)
    df.to_csv(path, index=False)
    print(f"  Saved tuning results CSV -> {os.path.abspath(path)}")


# ---------------------------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------------------------
def main():
    print(SEP)
    print("LumiChain AI Layer - Step 6: Hyperparameter Tuning Pipeline")
    print(SEP)

    # 1. Load Data
    X_train, X_test, y_train, y_test, le = load_data()

    # 2. Stratified 5-Fold CV setup
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)

    # 3. Tune Decision Tree
    best_dt, dt_cv_f1, dt_best_params = tune_decision_tree(X_train, y_train, cv)

    # 4. Tune Random Forest
    best_rf, rf_cv_f1, rf_best_params = tune_random_forest(X_train, y_train, cv)

    # 5. Evaluate Baselines for comparison
    print(f"\n{SEP}")
    print("Loading Baseline Models for Comparison...")
    print(SEP)
    base_dt, base_dt_cv_f1 = get_or_train_baseline_dt(X_train, y_train, cv)
    base_rf, base_rf_cv_f1 = get_or_train_baseline_rf(X_train, y_train, cv)

    res_base_dt = evaluate_model(
        "Baseline Decision Tree", base_dt, X_test, y_test, le,
        cv_macro_f1=base_dt_cv_f1, best_params={"max_depth": 10, "min_samples_leaf": 5},
        save_cm=False
    )
    res_base_rf = evaluate_model(
        "Baseline Random Forest", base_rf, X_test, y_test, le,
        cv_macro_f1=base_rf_cv_f1, best_params={"n_estimators": 300, "class_weight": "balanced"},
        save_cm=False
    )

    # 6. Evaluate Tuned Models on untouched X_test
    print(f"\n{SEP}")
    print("Evaluating Tuned Models on Untouched Test Set...")
    print(SEP)
    res_tuned_dt = evaluate_model(
        "Tuned Decision Tree", best_dt, X_test, y_test, le,
        cv_macro_f1=dt_cv_f1, best_params=dt_best_params,
        save_cm=True, cm_dir=CM_TUNED_DIR
    )
    res_tuned_rf = evaluate_model(
        "Tuned Random Forest", best_rf, X_test, y_test, le,
        cv_macro_f1=rf_cv_f1, best_params=rf_best_params,
        save_cm=True, cm_dir=CM_TUNED_DIR
    )

    all_results = [res_base_dt, res_tuned_dt, res_base_rf, res_tuned_rf]

    # 7. Rank and print comparison
    ranked_results = print_and_rank_results(all_results, le)

    # 8. Save CSV and artifacts
    save_results_csv(ranked_results, RESULTS_CSV)

    print(f"\n{SEP}")
    print("MODEL HYPERPARAMETER TUNING AND EVALUATION COMPLETE")
    print(SEP)


if __name__ == "__main__":
    main()
