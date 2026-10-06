"""
LumiChain AI Layer - Step 4
============================
ML Preprocessing Pipeline

Steps performed:
    1. Load CSV dataset
    2. Validate columns, missing values, and target classes
    3. Drop identifier column (pole_id)
    4. Split into 80/20 train/test (stratified)
    5. Encode target labels with LabelEncoder
    6. Save label encoder to models/label_encoder.pkl
    7. Save processed splits to data/processed/
    8. Run assertions and print summary

IMPORTANT:
    - No scaling applied (will be done per-model in training)
    - No outlier removal (extreme values are genuine failure signals)
    - No SMOTE (classes are already reasonably balanced)
    - Original CSV is never modified

Author  : LumiChain AI Team
Purpose : Preprocessing only -- no model training.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED = 42

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(BASE_DIR, "..", "data", "streetlight_sensor_data.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "..", "data", "processed")
MODELS_DIR   = os.path.join(BASE_DIR, "..", "models")
ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.pkl")

# Feature columns (pole_id excluded -- identifier only)
FEATURE_COLS = [
    "current",
    "voltage",
    "light_intensity",
    "temperature",
    "neighbor_confirmation",
    "operating_hours",
    "previous_failures",
]

TARGET_COL = "failure_type"

EXPECTED_CLASSES = {
    "WORKING",
    "LAMP_FAILURE",
    "POWER_FAILURE",
    "SENSOR_FAILURE",
    "VOLTAGE_ANOMALY",
}

TRAIN_RATIO = 0.80
TEST_RATIO  = 0.20

SEP = "=" * 65


# ---------------------------------------------------------------------------
# Step 1 — Load Dataset
# ---------------------------------------------------------------------------

def load_dataset(path: str) -> pd.DataFrame:
    """Load the CSV dataset and return a DataFrame."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found: {path}\n"
            "Run training/generate_data.py first."
        )
    df = pd.read_csv(path)
    print(f"  Loaded {len(df):,} records from: {os.path.abspath(path)}")
    return df


# ---------------------------------------------------------------------------
# Step 2 — Validate Dataset
# ---------------------------------------------------------------------------

def validate_dataset(df: pd.DataFrame) -> None:
    """
    Assert that the dataset meets all preconditions before preprocessing.
    Raises ValueError with a descriptive message on any failure.
    """
    print("\n  Running pre-processing validations...")

    # 2a. Required columns present
    required = FEATURE_COLS + [TARGET_COL, "pole_id"]
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    print("  [PASS] All required columns present.")

    # 2b. No missing values
    missing_vals = df[FEATURE_COLS + [TARGET_COL]].isnull().sum().sum()
    if missing_vals > 0:
        raise ValueError(f"Dataset contains {missing_vals} missing value(s). Fix before preprocessing.")
    print("  [PASS] No missing values.")

    # 2c. Target classes are exactly the expected set
    actual_classes = set(df[TARGET_COL].unique())
    unexpected = actual_classes - EXPECTED_CLASSES
    missing_cls = EXPECTED_CLASSES - actual_classes
    if unexpected or missing_cls:
        raise ValueError(
            f"Unexpected classes: {unexpected}  |  Missing classes: {missing_cls}"
        )
    print(f"  [PASS] Target classes validated: {sorted(actual_classes)}")


# ---------------------------------------------------------------------------
# Step 3 — Extract Features and Target
# ---------------------------------------------------------------------------

def extract_features_target(df: pd.DataFrame):
    """
    Drop pole_id and return (X, y) where:
        X  -- DataFrame of feature columns only
        y  -- Series of raw target labels (strings)
    """
    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].copy()
    print(f"\n  Features selected : {FEATURE_COLS}")
    print(f"  Target column     : {TARGET_COL}")
    print(f"  pole_id dropped   : NOT included in X")
    return X, y


# ---------------------------------------------------------------------------
# Step 4 — Train / Test Split
# ---------------------------------------------------------------------------

def split_data(X: pd.DataFrame, y: pd.Series):
    """
    Stratified 80/20 train-test split.

    Returns
    -------
    X_train, X_test, y_train_raw, y_test_raw
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_RATIO,
        random_state=RANDOM_SEED,
        stratify=y,
    )
    print(f"\n  Train size : {len(X_train):,} records ({TRAIN_RATIO*100:.0f}%)")
    print(f"  Test  size : {len(X_test):,}  records ({TEST_RATIO*100:.0f}%)")
    return X_train, X_test, y_train, y_test


# ---------------------------------------------------------------------------
# Step 5 — Label Encoding
# ---------------------------------------------------------------------------

def encode_labels(y_train: pd.Series, y_test: pd.Series):
    """
    Fit a LabelEncoder on y_train, then transform both splits.

    Returns
    -------
    le        : fitted LabelEncoder
    y_train_enc : encoded training labels (numpy array)
    y_test_enc  : encoded test labels     (numpy array)
    """
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc  = le.transform(y_test)

    print("\n  Label Encoding:")
    for idx, cls in enumerate(le.classes_):
        print(f"    {idx}  ->  {cls}")

    return le, y_train_enc, y_test_enc


# ---------------------------------------------------------------------------
# Step 6 — Save Label Encoder
# ---------------------------------------------------------------------------

def save_encoder(le: LabelEncoder, path: str) -> None:
    """Persist the fitted LabelEncoder with Joblib."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(le, path)
    print(f"\n  Label encoder saved -> {os.path.abspath(path)}")


# ---------------------------------------------------------------------------
# Step 7 — Save Processed Splits
# ---------------------------------------------------------------------------

def save_processed_splits(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train_enc: np.ndarray,
    y_test_enc: np.ndarray,
    out_dir: str,
) -> None:
    """
    Save the four processed splits as CSV files.

    Files produced:
        data/processed/X_train.csv
        data/processed/X_test.csv
        data/processed/y_train.csv
        data/processed/y_test.csv

    y files contain a single column 'failure_type' with encoded integer labels.
    """
    os.makedirs(out_dir, exist_ok=True)

    X_train.to_csv(os.path.join(out_dir, "X_train.csv"), index=False)
    X_test.to_csv(os.path.join(out_dir,  "X_test.csv"),  index=False)

    pd.DataFrame(y_train_enc, columns=[TARGET_COL]).to_csv(
        os.path.join(out_dir, "y_train.csv"), index=False
    )
    pd.DataFrame(y_test_enc, columns=[TARGET_COL]).to_csv(
        os.path.join(out_dir, "y_test.csv"), index=False
    )

    print(f"\n  Processed splits saved to: {os.path.abspath(out_dir)}")
    print(f"    X_train.csv  -> {len(X_train):,} rows x {len(FEATURE_COLS)} cols")
    print(f"    X_test.csv   -> {len(X_test):,}  rows x {len(FEATURE_COLS)} cols")
    print(f"    y_train.csv  -> {len(y_train_enc):,} rows")
    print(f"    y_test.csv   -> {len(y_test_enc):,}  rows")


# ---------------------------------------------------------------------------
# Step 8 — Print Summary
# ---------------------------------------------------------------------------

def print_summary(
    df: pd.DataFrame,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train_raw: pd.Series,
    y_test_raw: pd.Series,
    le: LabelEncoder,
) -> None:
    """Print a structured preprocessing summary."""
    print(f"\n{SEP}")
    print("PREPROCESSING SUMMARY")
    print(SEP)

    print(f"\n  Dataset Shape     : {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"  Feature Names     : {FEATURE_COLS}")
    print(f"  Target Classes    : {sorted(EXPECTED_CLASSES)}")
    print(f"  Encoded Mapping   : { {i: c for i, c in enumerate(le.classes_)} }")
    print(f"\n  Training Size     : {len(X_train):,} records")
    print(f"  Testing  Size     : {len(X_test):,}  records")

    print("\n  Training Class Distribution:")
    train_dist = y_train_raw.value_counts().reindex(sorted(EXPECTED_CLASSES))
    for cls, cnt in train_dist.items():
        print(f"    {cls:<22s}: {cnt:>5,d}  ({cnt/len(y_train_raw)*100:.1f}%)")

    print("\n  Testing Class Distribution:")
    test_dist = y_test_raw.value_counts().reindex(sorted(EXPECTED_CLASSES))
    for cls, cnt in test_dist.items():
        print(f"    {cls:<22s}: {cnt:>5,d}  ({cnt/len(y_test_raw)*100:.1f}%)")


# ---------------------------------------------------------------------------
# Step 9 — Assertions
# ---------------------------------------------------------------------------

def run_assertions(
    df: pd.DataFrame,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train_raw: pd.Series,
    y_test_raw: pd.Series,
) -> None:
    """Hard assertions that must all pass before declaring success."""
    print(f"\n{SEP}")
    print("POST-PROCESSING ASSERTIONS")
    print(SEP)

    passed = True

    def check(condition: bool, msg_pass: str, msg_fail: str) -> bool:
        if condition:
            print(f"  [PASS] {msg_pass}")
        else:
            print(f"  [FAIL] {msg_fail}")
        return condition

    # 9a. Train + test size equals original record count
    total = len(X_train) + len(X_test)
    passed &= check(
        total == len(df),
        f"Train ({len(X_train):,}) + Test ({len(X_test):,}) = {total:,} == original {len(df):,}",
        f"Size mismatch: {total} != {len(df)}"
    )

    # 9b. All five classes in training set
    train_classes = set(y_train_raw.unique())
    passed &= check(
        train_classes == EXPECTED_CLASSES,
        f"All 5 classes present in training set.",
        f"Training set missing classes: {EXPECTED_CLASSES - train_classes}"
    )

    # 9c. All five classes in test set
    test_classes = set(y_test_raw.unique())
    passed &= check(
        test_classes == EXPECTED_CLASSES,
        f"All 5 classes present in test set.",
        f"Test set missing classes: {EXPECTED_CLASSES - test_classes}"
    )

    # 9d. No missing values in X_train
    missing_train = X_train.isnull().sum().sum()
    passed &= check(
        missing_train == 0,
        f"No missing values in X_train.",
        f"X_train has {missing_train} missing values."
    )

    # 9e. No missing values in X_test
    missing_test = X_test.isnull().sum().sum()
    passed &= check(
        missing_test == 0,
        f"No missing values in X_test.",
        f"X_test has {missing_test} missing values."
    )

    # 9f. pole_id NOT in X_train columns
    passed &= check(
        "pole_id" not in X_train.columns,
        "pole_id is NOT present in X_train.",
        "pole_id found in X_train -- must be removed."
    )

    # 9g. pole_id NOT in X_test columns
    passed &= check(
        "pole_id" not in X_test.columns,
        "pole_id is NOT present in X_test.",
        "pole_id found in X_test -- must be removed."
    )

    # 9h. X columns match FEATURE_COLS exactly
    passed &= check(
        list(X_train.columns) == FEATURE_COLS,
        f"X_train columns match FEATURE_COLS exactly.",
        f"Column mismatch: {list(X_train.columns)} != {FEATURE_COLS}"
    )

    print(SEP)

    if not passed:
        print("\n  PREPROCESSING FAILED -- see assertion errors above.")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(SEP)
    print("LumiChain AI Layer - Step 4: ML Preprocessing")
    print(SEP)
    print(f"  Random seed  : {RANDOM_SEED}")
    print(f"  Train / Test : {int(TRAIN_RATIO*100)}% / {int(TEST_RATIO*100)}%")
    print(f"  Stratify     : yes")
    print(f"  Scaling      : NOT applied (model-specific, applied in training)")
    print(f"  SMOTE        : NOT applied (classes already balanced)")
    print(f"  Outlier removal: NOT applied (extreme values are genuine signals)")

    # 1. Load
    df = load_dataset(DATA_PATH)

    # 2. Validate
    validate_dataset(df)

    # 3. Extract features and target
    X, y = extract_features_target(df)

    # 4. Split
    X_train, X_test, y_train_raw, y_test_raw = split_data(X, y)

    # Reset indices so they are clean and contiguous
    X_train = X_train.reset_index(drop=True)
    X_test  = X_test.reset_index(drop=True)
    y_train_raw = y_train_raw.reset_index(drop=True)
    y_test_raw  = y_test_raw.reset_index(drop=True)

    # 5. Encode labels
    le, y_train_enc, y_test_enc = encode_labels(y_train_raw, y_test_raw)

    # 6. Save encoder
    save_encoder(le, ENCODER_PATH)

    # 7. Save processed splits
    save_processed_splits(X_train, X_test, y_train_enc, y_test_enc, PROCESSED_DIR)

    # 8. Print summary
    print_summary(df, X_train, X_test, y_train_raw, y_test_raw, le)

    # 9. Assertions
    run_assertions(df, X_train, X_test, y_train_raw, y_test_raw)

    print()
    print("PREPROCESSING SUCCESSFUL")
    print()


if __name__ == "__main__":
    main()
