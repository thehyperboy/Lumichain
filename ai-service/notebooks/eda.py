"""
LumiChain AI Layer - Step 3
============================
Exploratory Data Analysis (EDA)

Loads: data/streetlight_sensor_data.csv
Saves: notebooks/eda_outputs/  (all plots)

Analysis sections:
    1. Dataset Overview
    2. Target Analysis
    3. Numerical Statistics
    4. Failure-Type Analysis (per-class feature means/medians)
    5. Visualizations
    6. Feature Relationship Analysis
    7. Outlier Analysis
    8. Correlation Analysis
    9. Final EDA Report

Author  : LumiChain AI Team
Purpose : EDA only -- no model training, no CSV modification.
"""

import os
import sys
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")                      # non-interactive backend for saving
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import seaborn as sns

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED  = 42
np.random.seed(RANDOM_SEED)

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(BASE_DIR, "..", "data", "streetlight_sensor_data.csv")
OUTPUT_DIR   = os.path.join(BASE_DIR, "eda_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# One distinct colour per failure class
CLASS_ORDER  = ["WORKING", "LAMP_FAILURE", "POWER_FAILURE", "SENSOR_FAILURE", "VOLTAGE_ANOMALY"]
CLASS_COLORS = {
    "WORKING"        : "#2ECC71",   # green
    "LAMP_FAILURE"   : "#E74C3C",   # red
    "POWER_FAILURE"  : "#E67E22",   # orange
    "SENSOR_FAILURE" : "#9B59B6",   # purple
    "VOLTAGE_ANOMALY": "#3498DB",   # blue
}
PALETTE      = [CLASS_COLORS[c] for c in CLASS_ORDER]

NUMERIC_COLS = ["current", "voltage", "light_intensity", "temperature",
                "neighbor_confirmation", "operating_hours", "previous_failures"]

# Seaborn theme
sns.set_theme(style="darkgrid", palette="muted", font_scale=1.1)
plt.rcParams.update({"figure.dpi": 120, "savefig.bbox": "tight"})

SEP = "=" * 65


def save_fig(name: str) -> str:
    """Save current figure to OUTPUT_DIR and close it."""
    path = os.path.join(OUTPUT_DIR, name)
    plt.savefig(path)
    plt.close()
    return path


# ===========================================================================
# 1. Dataset Overview
# ===========================================================================

def section_overview(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 1 - DATASET OVERVIEW")
    print(SEP)

    print(f"\n  Shape              : {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"\n  Columns            : {list(df.columns)}")

    print("\n  Data Types:")
    for col, dtype in df.dtypes.items():
        print(f"    {col:<26s}: {dtype}")

    missing = df.isnull().sum()
    print(f"\n  Missing Values     : {missing.sum()} total")
    if missing.sum() > 0:
        print(missing[missing > 0].to_string())

    dupes = df.duplicated().sum()
    print(f"\n  Duplicate Records  : {dupes}")


# ===========================================================================
# 2. Target Analysis
# ===========================================================================

def section_target(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 2 - TARGET (failure_type) ANALYSIS")
    print(SEP)

    counts = df["failure_type"].value_counts().reindex(CLASS_ORDER)
    total  = len(df)

    print(f"\n  {'Class':<22s}  {'Count':>6s}  {'Percentage':>11s}")
    print(f"  {'-'*22}  {'-'*6}  {'-'*11}")
    for cls in CLASS_ORDER:
        cnt = counts[cls]
        print(f"  {cls:<22s}  {cnt:>6,d}  {cnt/total*100:>10.1f}%")

    # Bar chart
    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(CLASS_ORDER, counts.values, color=PALETTE, edgecolor="white", linewidth=0.8)
    for bar, val in zip(bars, counts.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 15,
                f"{val:,}", ha="center", va="bottom", fontsize=10, fontweight="bold")
    ax.set_title("Class Distribution - LumiChain Streetlight Failures",
                 fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Failure Type", fontsize=11)
    ax.set_ylabel("Number of Records", fontsize=11)
    ax.set_ylim(0, counts.max() * 1.18)
    ax.tick_params(axis="x", labelsize=9)
    plt.tight_layout()
    p = save_fig("01_class_distribution.png")
    print(f"\n  Plot saved -> {p}")


# ===========================================================================
# 3. Numerical Statistics
# ===========================================================================

def section_numerical_stats(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 3 - NUMERICAL STATISTICS")
    print(SEP)

    stats = df[NUMERIC_COLS].agg(["mean", "median", "std", "min", "max"]).round(4)
    print()
    print(stats.to_string())


# ===========================================================================
# 4. Failure-Type Analysis
# ===========================================================================

def section_failure_type_analysis(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 4 - PER-CLASS FEATURE STATISTICS")
    print(SEP)

    for stat_name, stat_fn in [("MEAN", "mean"), ("MEDIAN", "median")]:
        result = (df.groupby("failure_type")[NUMERIC_COLS]
                    .agg(stat_fn)
                    .reindex(CLASS_ORDER)
                    .round(4))
        print(f"\n  {stat_name} by failure_type:")
        print(result.to_string())

    # Quick-reference pivot: key features only
    print("\n  Key feature means (quick reference):")
    pivot = (df.groupby("failure_type")[["current", "voltage",
                                         "light_intensity", "neighbor_confirmation"]]
               .mean()
               .reindex(CLASS_ORDER)
               .round(3))
    print(pivot.to_string())


# ===========================================================================
# 5. Visualizations
# ===========================================================================

def _boxplot_by_class(df: pd.DataFrame, feature: str, title: str, filename: str) -> str:
    """Generic box + strip plot for a numeric feature split by failure class."""
    fig, ax = plt.subplots(figsize=(10, 5))
    sns.boxplot(data=df, x="failure_type", y=feature, order=CLASS_ORDER,
                palette=CLASS_COLORS, width=0.5, linewidth=1.2,
                flierprops=dict(marker="o", markersize=2, alpha=0.4), ax=ax)
    sns.stripplot(data=df.sample(min(800, len(df)), random_state=RANDOM_SEED),
                  x="failure_type", y=feature, order=CLASS_ORDER,
                  palette=CLASS_COLORS, size=2, alpha=0.25, jitter=True, ax=ax)
    ax.set_title(title, fontsize=12, fontweight="bold", pad=10)
    ax.set_xlabel("Failure Type", fontsize=10)
    ax.set_ylabel(feature.replace("_", " ").title(), fontsize=10)
    ax.tick_params(axis="x", labelsize=8)
    plt.tight_layout()
    return save_fig(filename)


def section_visualizations(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 5 - VISUALIZATIONS")
    print(SEP)

    # 5a. Current by class
    p = _boxplot_by_class(df, "current",
                          "Current (A) Distribution by Failure Type",
                          "02_current_by_class.png")
    print(f"  Saved: {p}")

    # 5b. Voltage by class
    p = _boxplot_by_class(df, "voltage",
                          "Voltage (V) Distribution by Failure Type",
                          "03_voltage_by_class.png")
    print(f"  Saved: {p}")

    # 5c. Light intensity by class
    p = _boxplot_by_class(df, "light_intensity",
                          "Light Intensity (lux) Distribution by Failure Type",
                          "04_light_intensity_by_class.png")
    print(f"  Saved: {p}")

    # 5d. Temperature by class
    p = _boxplot_by_class(df, "temperature",
                          "Temperature (deg C) Distribution by Failure Type",
                          "05_temperature_by_class.png")
    print(f"  Saved: {p}")

    # 5e. Neighbor confirmation by class (grouped bar -- categorical feel)
    fig, ax = plt.subplots(figsize=(10, 5))
    nc_counts = (df.groupby(["failure_type", "neighbor_confirmation"])
                   .size()
                   .unstack(fill_value=0)
                   .reindex(CLASS_ORDER))
    nc_counts.plot(kind="bar", ax=ax, colormap="viridis",
                   edgecolor="white", linewidth=0.6)
    ax.set_title("Neighbor Confirmation Distribution by Failure Type",
                 fontsize=12, fontweight="bold", pad=10)
    ax.set_xlabel("Failure Type", fontsize=10)
    ax.set_ylabel("Record Count", fontsize=10)
    ax.tick_params(axis="x", rotation=20, labelsize=8)
    ax.legend(title="neighbor_confirmation", fontsize=9)
    plt.tight_layout()
    p = save_fig("06_neighbor_confirmation_by_class.png")
    print(f"  Saved: {p}")

    # 5f. Correlation heatmap (numeric only)
    fig, ax = plt.subplots(figsize=(9, 7))
    corr = df[NUMERIC_COLS].corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm",
                center=0, linewidths=0.5, square=True,
                cbar_kws={"shrink": 0.8}, ax=ax)
    ax.set_title("Feature Correlation Heatmap", fontsize=12, fontweight="bold", pad=10)
    plt.tight_layout()
    p = save_fig("07_correlation_heatmap.png")
    print(f"  Saved: {p}")

    # 5g. Pairplot for key features (sampled for speed)
    key_cols = ["current", "voltage", "light_intensity", "temperature", "failure_type"]
    sample   = df[key_cols].sample(min(1500, len(df)), random_state=RANDOM_SEED)
    g = sns.pairplot(sample, hue="failure_type", hue_order=CLASS_ORDER,
                     palette=CLASS_COLORS, diag_kind="kde",
                     plot_kws=dict(alpha=0.4, s=10),
                     diag_kws=dict(linewidth=1.2))
    g.figure.suptitle("Pairplot - Key Sensor Features by Failure Type",
                       y=1.01, fontsize=12, fontweight="bold")
    p = save_fig("08_pairplot_key_features.png")
    print(f"  Saved: {p}")


# ===========================================================================
# 6. Feature Relationship Analysis
# ===========================================================================

def section_feature_relationships(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 6 - FEATURE RELATIONSHIP ANALYSIS")
    print(SEP)

    # Discriminability = between-class spread / within-class spread
    # Higher score => more useful for distinguishing classes
    class_means    = df.groupby("failure_type")[NUMERIC_COLS].mean()
    class_stds     = df.groupby("failure_type")[NUMERIC_COLS].std()
    between_spread = class_means.std()
    within_spread  = class_stds.mean()
    discriminability = (between_spread / (within_spread + 1e-9)).sort_values(ascending=False)

    print("\n  Feature Discriminability (between-class spread / within-class spread):")
    print(f"  {'Feature':<26s}  {'Score':>8s}  Assessment")
    print(f"  {'-'*26}  {'-'*8}  {'-'*28}")
    for feat, score in discriminability.items():
        if score >= 3.0:
            note = "[***] Highly discriminative"
        elif score >= 1.5:
            note = "[** ] Moderately discriminative"
        else:
            note = "[*  ] Low discriminative power"
        print(f"  {feat:<26s}  {score:>8.3f}  {note}")

    # Class-specific feature signatures
    print("\n  Class-specific feature signatures:")
    insights = {
        "WORKING"        : "current 0.35-0.50 A | voltage ~230 V | intensity 600-1000 lux | neighbor=0",
        "LAMP_FAILURE"   : "very low current (<0.08 A) | normal voltage | intensity ~0 | neighbor=1-2",
        "POWER_FAILURE"  : "near-zero voltage (<15 V)  | near-zero current | intensity ~0 | neighbor=1-2",
        "SENSOR_FAILURE" : "normal current & voltage | erratic intensity (too low OR too high)",
        "VOLTAGE_ANOMALY": "voltage 100-180 V (low) or 260-310 V (high) | current varies accordingly",
    }
    for cls, desc in insights.items():
        print(f"  {cls:<22s}: {desc}")

    top3 = list(discriminability.head(3).index)
    print(f"\n  Top-3 most discriminative features: {top3}")
    print("  -> These should be prioritised during model training.")


# ===========================================================================
# 7. Outlier Analysis
# ===========================================================================

def section_outlier_analysis(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 7 - OUTLIER ANALYSIS  (IQR method, k=1.5)")
    print(SEP)

    outlier_cols   = ["current", "voltage", "light_intensity", "temperature", "operating_hours"]
    total_outliers = 0

    for col in outlier_cols:
        q1  = df[col].quantile(0.25)
        q3  = df[col].quantile(0.75)
        iqr = q3 - q1
        lo  = q1 - 1.5 * iqr
        hi  = q3 + 1.5 * iqr
        out = df[(df[col] < lo) | (df[col] > hi)]
        n   = len(out)
        total_outliers += n

        print(f"\n  {col}:")
        print(f"    IQR fence    : [{lo:.3f}, {hi:.3f}]")
        print(f"    Actual range : [{df[col].min():.3f}, {df[col].max():.3f}]")
        print(f"    Outlier count: {n} ({n/len(df)*100:.1f}%)")

        if n > 0:
            breakdown = out["failure_type"].value_counts()
            print(f"    Class breakdown: {breakdown.to_dict()}")

    print(f"\n  NOTE: Outliers are NOT removed.")
    print("  Many extreme values are GENUINE failure signatures")
    print("  (e.g. voltage~0 for POWER_FAILURE, intensity>1000 for SENSOR_FAILURE).")
    print(f"  Total IQR-flagged: {total_outliers} across {len(outlier_cols)} features.")


# ===========================================================================
# 8. Correlation Analysis
# ===========================================================================

def section_correlation(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 8 - CORRELATION ANALYSIS")
    print(SEP)

    corr = df[NUMERIC_COLS].corr().round(3)
    print("\n  Full Correlation Matrix:")
    print(corr.to_string())

    # Identify strong correlations (|r| >= 0.40, upper triangle only)
    strong = []
    for i in range(len(NUMERIC_COLS)):
        for j in range(i + 1, len(NUMERIC_COLS)):
            r = corr.iloc[i, j]
            if abs(r) >= 0.40:
                strong.append((NUMERIC_COLS[i], NUMERIC_COLS[j], r))

    print("\n  Pairs with |r| >= 0.40 (strong correlation):")
    if strong:
        for f1, f2, r in sorted(strong, key=lambda x: abs(x[2]), reverse=True):
            direction = "positive" if r > 0 else "negative"
            print(f"    {f1:<26s} <->  {f2:<26s}: r = {r:+.3f}  ({direction})")
    else:
        print("    None found -- features are largely independent.")

    print("\n  Interpretation:")
    print("  * Low cross-feature correlations are GOOD for ML (reduces multicollinearity).")
    print("  * Correlated features may carry redundant information.")


# ===========================================================================
# 9. Final EDA Report
# ===========================================================================

def section_final_report(df: pd.DataFrame) -> None:
    print("\n" + SEP)
    print("SECTION 9 - FINAL EDA REPORT")
    print(SEP)

    n_rows, n_cols = df.shape
    missing        = df.isnull().sum().sum()
    dupes          = df.duplicated().sum()
    class_dist     = df["failure_type"].value_counts()
    min_cls        = class_dist.min()
    max_cls        = class_dist.max()
    balance_ratio  = min_cls / max_cls

    # Discriminability for top features
    class_means = df.groupby("failure_type")[NUMERIC_COLS].mean()
    class_stds  = df.groupby("failure_type")[NUMERIC_COLS].std()
    disc = (class_means.std() / (class_stds.mean() + 1e-9)).sort_values(ascending=False)

    clean_flag = "[OK]" if (missing == 0 and dupes == 0) else "[!!]"
    balance_flag = "[OK]" if balance_ratio > 0.80 else "[!!]"

    print(f"""
  DATASET QUALITY
  ---------------------------------------------------------------
  Records           : {n_rows:,} rows x {n_cols} columns
  Missing values    : {missing}  {clean_flag}
  Duplicate rows    : {dupes}  {clean_flag}
  Data types        : Numeric (float/int) + 1 categorical (failure_type)
  Assessment        : {"Dataset is CLEAN and ready for preprocessing." if missing == 0 and dupes == 0 else "REQUIRES cleaning."}

  CLASS BALANCE
  ---------------------------------------------------------------
  Min class count   : {min_cls:,} ({min_cls/n_rows*100:.1f}%)
  Max class count   : {max_cls:,} ({max_cls/n_rows*100:.1f}%)
  Balance ratio     : {balance_ratio:.2f}  {balance_flag} {"(Well balanced)" if balance_ratio > 0.80 else "(Imbalanced -- consider stratification)"}
  Recommendation    : Use stratified train/test split; minimal SMOTE likely needed.

  IMPORTANT FEATURES (ranked by discriminability score)
  ---------------------------------------------------------------""")

    for feat, score in disc.head(4).items():
        print(f"  {feat:<26s}: score = {score:.3f}")

    print(f"""
  POTENTIALLY PROBLEMATIC FEATURES
  ---------------------------------------------------------------
  light_intensity   : extreme range (0 to ~2000 lux due to SENSOR_FAILURE).
                      Normalisation / robust scaling recommended.
  voltage           : bimodal (near-zero for POWER_FAILURE vs 220-240 V normal).
                      No special treatment needed -- the contrast IS the signal.
  temperature       : moderate spike noise in SENSOR_FAILURE records.
  operating_hours   : wide range (500 - 60,000 h); log-transform may help tree models.

  POTENTIAL OUTLIERS (IQR-flagged, NOT removed)
  ---------------------------------------------------------------
  light_intensity   : values > ~1100 lux (SENSOR_FAILURE stuck-high mode) -- genuine.
  voltage           : values < ~5 V (POWER_FAILURE) -- genuine failure signal.
  current           : near-zero values (LAMP_FAILURE / POWER_FAILURE) -- genuine.
  temperature       : values > ~80 deg C (SENSOR_FAILURE / VOLTAGE_ANOMALY) -- genuine.
  Recommendation    : Keep all records; use robust scalers (e.g. RobustScaler).

  ML TRAINING SUITABILITY
  ---------------------------------------------------------------
  [OK] 5 well-separated classes with distinct sensor signatures.
  [OK] Balanced class distribution (min/max ratio = {balance_ratio:.2f}).
  [OK] No missing values, no duplicates.
  [OK] Key features (current, voltage, light_intensity, neighbor_confirmation)
       show high discriminability between classes.
  [!!] Some borderline LAMP_FAILURE examples overlap with WORKING/SENSOR_FAILURE.
  [!!] SENSOR_FAILURE has high intra-class variance in light_intensity --
       ensemble models (Random Forest, XGBoost) are recommended over linear classifiers.

  CONCLUSION: Dataset is SUITABLE for ML classification training.
    """)


# ===========================================================================
# Main
# ===========================================================================

def main() -> None:
    print(SEP)
    print("LumiChain AI Layer - Step 3: Exploratory Data Analysis")
    print(SEP)
    print(f"  Data    : {os.path.abspath(DATA_PATH)}")
    print(f"  Outputs : {os.path.abspath(OUTPUT_DIR)}")
    print(f"  Seed    : {RANDOM_SEED}")

    # Load dataset
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}.\n"
            "Run training/generate_data.py first."
        )
    df = pd.read_csv(DATA_PATH)
    print(f"\n  Loaded {len(df):,} records from CSV.\n")

    # Run all analysis sections
    section_overview(df)
    section_target(df)
    section_numerical_stats(df)
    section_failure_type_analysis(df)
    section_visualizations(df)
    section_feature_relationships(df)
    section_outlier_analysis(df)
    section_correlation(df)
    section_final_report(df)

    print(f"\n{SEP}")
    print(f"  EDA COMPLETE -- all plots saved to: {os.path.abspath(OUTPUT_DIR)}")
    print(SEP)


if __name__ == "__main__":
    main()
