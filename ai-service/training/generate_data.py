"""
LumiChain AI Layer — Step 2
============================
Synthetic Streetlight Sensor Dataset Generator

Generates ~8,000 realistic synthetic records for training a
streetlight failure classification model.

Failure classes:
    WORKING | LAMP_FAILURE | POWER_FAILURE | SENSOR_FAILURE | VOLTAGE_ANOMALY

Author  : LumiChain AI Team
Purpose : Dataset generation only — no model training here.
"""

import os
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RANDOM_SEED   = 42
TOTAL_RECORDS = 8000
OUTPUT_PATH   = os.path.join(os.path.dirname(__file__), "..", "data", "streetlight_sensor_data.csv")

# Approximate share per class (5 classes, kept balanced with slight variation)
CLASS_SHARES = {
    "WORKING"        : 0.22,
    "LAMP_FAILURE"   : 0.20,
    "POWER_FAILURE"  : 0.20,
    "SENSOR_FAILURE" : 0.19,
    "VOLTAGE_ANOMALY": 0.19,
}

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _clip_pos(arr: np.ndarray) -> np.ndarray:
    """Clip an array to be non-negative (physical constraint)."""
    return np.clip(arr, 0, None)


def _noisy(base: float, sigma: float, size: int, rng: np.random.Generator) -> np.ndarray:
    """Return Gaussian noise around a base value."""
    return rng.normal(loc=base, scale=sigma, size=size)


def _uniform(low: float, high: float, size: int, rng: np.random.Generator) -> np.ndarray:
    """Uniform random draw."""
    return rng.uniform(low=low, high=high, size=size)


def _randint(low: int, high: int, size: int, rng: np.random.Generator) -> np.ndarray:
    """Integer random draw (inclusive on both ends)."""
    return rng.integers(low=low, high=high + 1, size=size)


# ---------------------------------------------------------------------------
# Per-class generators
# ---------------------------------------------------------------------------

def generate_working(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    WORKING — streetlight is functioning normally.
    - current  : 0.35–0.50 A  (tight range)
    - voltage  : 220–240 V
    - intensity: 600–1000 lux
    - temp     : 25–50 C  (ambient + minor heating)
    - neighbor : mostly 0, occasionally 1
    - op_hours : 500–50,000 h  (varied lifetimes)
    - prev_fail: 0–2 (usually low)
    """
    current   = _uniform(0.35, 0.50, n, rng)
    voltage   = _noisy(230, 3, n, rng)                   # centred 230 V
    intensity = _uniform(600, 1000, n, rng)
    temp      = _noisy(35, 5, n, rng)
    neighbor  = rng.choice([0, 1], size=n, p=[0.90, 0.10])
    op_hours  = _uniform(500, 50_000, n, rng)
    prev_fail = _randint(0, 2, n, rng)

    # Add tiny noise to intensity correlated with voltage (physical realism)
    intensity += (voltage - 230) * 2 + rng.normal(0, 10, n)
    intensity  = _clip_pos(intensity)

    return _assemble(current, voltage, intensity, temp, neighbor, op_hours, prev_fail, "WORKING")


def generate_lamp_failure(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    LAMP_FAILURE — lamp has burnt out or is failing.
    - current  : very low (0.00–0.08 A), sometimes a brief spike (borderline)
    - voltage  : mostly normal (210–245 V) — supply still present
    - intensity: near zero (0–30 lux), some noise
    - temp     : slightly lower (no lamp heat: 20–40 C)
    - neighbor : 1 or 2 (adjacent poles confirm the dark pole)
    - prev_fail: slightly elevated
    """
    # ~15% borderline examples: current slightly higher to create class overlap
    borderline = rng.random(n) < 0.15

    current   = np.where(
        borderline,
        _uniform(0.08, 0.18, n, rng),   # borderline — ambiguous
        _uniform(0.00, 0.06, n, rng),   # clear failure
    )
    voltage   = _noisy(228, 5, n, rng)
    intensity = _clip_pos(_noisy(10, 12, n, rng))        # near zero, noisy
    temp      = _noisy(28, 6, n, rng)
    neighbor  = rng.choice([0, 1, 2], size=n, p=[0.10, 0.55, 0.35])
    op_hours  = _uniform(5_000, 60_000, n, rng)          # older lamps fail more
    prev_fail = _randint(1, 5, n, rng)

    # Some borderline intensity
    intensity = np.where(borderline, _uniform(20, 80, n, rng), intensity)

    return _assemble(current, voltage, intensity, temp, neighbor, op_hours, prev_fail, "LAMP_FAILURE")


def generate_power_failure(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    POWER_FAILURE — supply line is dead or severely disrupted.
    - voltage  : near zero (0–15 V) or sharply dropping
    - current  : near zero (0–0.05 A)
    - intensity: near zero
    - temp     : ambient, no heating
    - neighbor : 1 or 2 (whole segment dark)
    - prev_fail: moderate
    """
    voltage   = _clip_pos(_noisy(5, 8, n, rng))          # 0–~25 V
    current   = _clip_pos(_noisy(0.01, 0.02, n, rng))
    intensity = _clip_pos(_noisy(3, 5, n, rng))
    temp      = _noisy(25, 5, n, rng)
    neighbor  = rng.choice([0, 1, 2], size=n, p=[0.05, 0.40, 0.55])
    op_hours  = _uniform(500, 50_000, n, rng)
    prev_fail = _randint(0, 4, n, rng)

    return _assemble(current, voltage, intensity, temp, neighbor, op_hours, prev_fail, "POWER_FAILURE")


def generate_sensor_failure(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    SENSOR_FAILURE — electronics mostly fine, but sensor readings are erratic.
    - current  : normal-ish (0.30–0.52 A)
    - voltage  : normal-ish (215–245 V)
    - intensity: inconsistent with electrical — can be wildly high, near-zero,
                 or random (sensor is lying)
    - temp     : may show erratic spikes
    - neighbor : varies (0–2, no clear pattern)
    - prev_fail: low to moderate
    """
    current   = _noisy(0.42, 0.06, n, rng)
    voltage   = _noisy(229, 6, n, rng)

    # Three sensor-failure intensity modes: stuck-low, stuck-high, random noise
    mode = rng.choice([0, 1, 2], size=n, p=[0.40, 0.30, 0.30])
    intensity_low  = _clip_pos(_noisy(5, 15, n, rng))     # stuck near zero
    intensity_high = _uniform(1100, 2000, n, rng)          # implausibly high
    intensity_rand = _uniform(0, 1500, n, rng)             # random garbage
    intensity = np.where(mode == 0, intensity_low,
                np.where(mode == 1, intensity_high, intensity_rand))

    # Temperature may also be glitchy
    temp     = _noisy(35, 10, n, rng)
    temp_add = rng.uniform(20, 40, n)
    temp     = np.where(rng.random(n) < 0.20, temp + temp_add, temp)

    neighbor  = rng.choice([0, 1, 2], size=n, p=[0.40, 0.35, 0.25])
    op_hours  = _uniform(500, 50_000, n, rng)
    prev_fail = _randint(0, 3, n, rng)

    return _assemble(current, voltage, intensity, temp, neighbor, op_hours, prev_fail, "SENSOR_FAILURE")


def generate_voltage_anomaly(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    VOLTAGE_ANOMALY — supply voltage is outside safe operating range.
    Two sub-cases: LOW voltage and HIGH voltage.
    - voltage (low) : 100–180 V  — under-voltage
    - voltage (high): 260–310 V  — over-voltage
    - current : inversely/directly affected (Ohm's law approximation)
    - intensity: reduced (low-V) or blown/flicker (high-V)
    - temp    : elevated under high-V
    - neighbor: 0–1 (anomaly may be pole-specific)
    - prev_fail: moderate
    """
    low_v  = rng.random(n) < 0.50   # 50% low-voltage, 50% high-voltage

    voltage_low  = _uniform(100, 180, n, rng)
    voltage_high = _uniform(260, 310, n, rng)
    voltage = np.where(low_v, voltage_low, voltage_high)

    # Current: I ~ P/V; lower V -> lower I; higher V -> higher I
    base_power = 80  # watts (approximate lamp power)
    current = np.clip(base_power / (voltage + 1e-6) + rng.normal(0, 0.05, n), 0, None)

    # Intensity: low-V -> dim; high-V -> erratic/bright
    intensity_low  = _clip_pos(_uniform(50, 350, n, rng))
    intensity_high = _clip_pos(_uniform(200, 900, n, rng))
    intensity = np.where(low_v, intensity_low, intensity_high)
    intensity += rng.normal(0, 30, n)
    intensity  = _clip_pos(intensity)

    # Temperature: over-voltage heats up components
    temp_low  = _noisy(30, 6, n, rng)
    temp_high = _noisy(55, 10, n, rng)
    temp = np.where(low_v, temp_low, temp_high)

    neighbor  = rng.choice([0, 1, 2], size=n, p=[0.50, 0.35, 0.15])
    op_hours  = _uniform(500, 50_000, n, rng)
    prev_fail = _randint(0, 4, n, rng)

    return _assemble(current, voltage, intensity, temp, neighbor, op_hours, prev_fail, "VOLTAGE_ANOMALY")


# ---------------------------------------------------------------------------
# Assembly helper
# ---------------------------------------------------------------------------

def _assemble(current, voltage, intensity, temp,
              neighbor, op_hours, prev_fail, label: str) -> pd.DataFrame:
    """Package raw arrays into a DataFrame with proper rounding and clipping."""
    return pd.DataFrame({
        "current"              : np.round(_clip_pos(current), 4),
        "voltage"              : np.round(_clip_pos(voltage), 2),
        "light_intensity"      : np.round(_clip_pos(intensity), 1),
        "temperature"          : np.round(_clip_pos(temp), 1),
        "neighbor_confirmation": neighbor.astype(int),
        "operating_hours"      : np.round(_clip_pos(op_hours), 1),
        "previous_failures"    : _clip_pos(prev_fail).astype(int),
        "failure_type"         : label,
    })


# ---------------------------------------------------------------------------
# Main generation pipeline
# ---------------------------------------------------------------------------

def generate_dataset(total: int, seed: int) -> pd.DataFrame:
    """
    Generate the full synthetic dataset.

    Parameters
    ----------
    total : int   -- approximate total number of records.
    seed  : int   -- random seed for reproducibility.

    Returns
    -------
    pd.DataFrame  -- shuffled dataset with pole_id prepended.
    """
    rng = np.random.default_rng(seed)

    # Compute per-class counts (adjust last class to hit exact total)
    counts = {}
    allocated = 0
    items = list(CLASS_SHARES.items())
    for i, (cls, share) in enumerate(items):
        if i < len(items) - 1:
            cnt = int(total * share)
        else:
            cnt = total - allocated       # absorb rounding remainder
        counts[cls] = cnt
        allocated  += cnt

    print("Planned class counts:", counts)

    # Generate each class
    generators = {
        "WORKING"        : generate_working,
        "LAMP_FAILURE"   : generate_lamp_failure,
        "POWER_FAILURE"  : generate_power_failure,
        "SENSOR_FAILURE" : generate_sensor_failure,
        "VOLTAGE_ANOMALY": generate_voltage_anomaly,
    }

    frames = []
    for cls, gen_fn in generators.items():
        df = gen_fn(counts[cls], rng)
        frames.append(df)

    # Concatenate and shuffle
    combined = pd.concat(frames, ignore_index=True)
    combined = combined.sample(frac=1, random_state=seed).reset_index(drop=True)

    # Assign unique pole IDs  (SL-0001 ... SL-XXXX)
    combined.insert(0, "pole_id", [f"SL-{i+1:04d}" for i in range(len(combined))])

    return combined


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

EXPECTED_CLASSES = {"WORKING", "LAMP_FAILURE", "POWER_FAILURE", "SENSOR_FAILURE", "VOLTAGE_ANOMALY"}


def validate_dataset(df: pd.DataFrame) -> bool:
    """
    Run data quality checks.

    Returns True only when ALL checks pass; prints individual results.
    """
    print("\n" + "=" * 60)
    print("DATA VALIDATION CHECKS")
    print("=" * 60)

    passed = True

    def check(condition: bool, msg_pass: str, msg_fail: str) -> bool:
        if condition:
            print(f"  [PASS] {msg_pass}")
        else:
            print(f"  [FAIL] {msg_fail}")
        return condition

    # 1. No missing values
    missing = df.isnull().sum().sum()
    passed &= check(missing == 0,
                    "No missing values.",
                    f"Missing values found: {missing}")

    # 2. No duplicate rows
    dupes = df.duplicated().sum()
    passed &= check(dupes == 0,
                    "No duplicate rows.",
                    f"Duplicate rows found: {dupes}")

    # 3. Correct target classes
    actual_classes = set(df["failure_type"].unique())
    passed &= check(actual_classes == EXPECTED_CLASSES,
                    f"All 5 expected classes present: {sorted(actual_classes)}",
                    f"Class mismatch -- expected {EXPECTED_CLASSES}, got {actual_classes}")

    # 4. neighbor_confirmation in {0, 1, 2}
    nc_valid = df["neighbor_confirmation"].between(0, 2).all()
    passed &= check(nc_valid,
                    "neighbor_confirmation values in [0, 2].",
                    "neighbor_confirmation has out-of-range values.")

    # 5. No negative current
    passed &= check((df["current"] >= 0).all(),
                    "No negative current values.",
                    "Negative current values detected.")

    # 6. No negative voltage
    passed &= check((df["voltage"] >= 0).all(),
                    "No negative voltage values.",
                    "Negative voltage values detected.")

    # 7. No negative light_intensity
    passed &= check((df["light_intensity"] >= 0).all(),
                    "No negative light_intensity values.",
                    "Negative light_intensity values detected.")

    # 8. No negative temperature
    passed &= check((df["temperature"] >= 0).all(),
                    "No negative temperature values.",
                    "Negative temperature values detected.")

    # 9. No negative operating_hours
    passed &= check((df["operating_hours"] >= 0).all(),
                    "No negative operating_hours values.",
                    "Negative operating_hours values detected.")

    # 10. No negative previous_failures
    passed &= check((df["previous_failures"] >= 0).all(),
                    "No negative previous_failures values.",
                    "Negative previous_failures values detected.")

    print("=" * 60)
    return passed


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_report(df: pd.DataFrame) -> None:
    """Print a concise dataset summary report."""
    sep = "=" * 60

    print(f"\n{sep}")
    print("DATASET REPORT")
    print(sep)

    # 1. Shape
    print(f"\n[1] Dataset Shape      : {df.shape[0]} rows x {df.shape[1]} columns")

    # 2. Columns
    print(f"\n[2] Column Names       :\n    {list(df.columns)}")

    # 3. First 10 records
    print(f"\n[3] First 10 Records   :")
    print(df.head(10).to_string(index=False))

    # 4. Missing values
    print(f"\n[4] Missing Value Count: {df.isnull().sum().sum()}")

    # 5. Duplicate count
    print(f"\n[5] Duplicate Row Count: {df.duplicated().sum()}")

    # 6. Class distribution
    print(f"\n[6] Class Distribution :")
    dist = df["failure_type"].value_counts()
    for cls, cnt in dist.items():
        print(f"    {cls:<20s} : {cnt:5d}  ({cnt/len(df)*100:.1f}%)")

    # 7. Descriptive statistics (numeric columns only)
    print(f"\n[7] Basic Descriptive Statistics:")
    print(df.describe(include="number").to_string())
    print(sep)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    print("LumiChain -- Synthetic Streetlight Sensor Data Generator")
    print(f"Random seed : {RANDOM_SEED}")
    print(f"Target size : {TOTAL_RECORDS} records")
    print(f"Output path : {os.path.abspath(OUTPUT_PATH)}\n")

    # Generate
    df = generate_dataset(TOTAL_RECORDS, RANDOM_SEED)

    # Save CSV
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"CSV saved --> {os.path.abspath(OUTPUT_PATH)}")

    # Report
    print_report(df)

    # Validate
    all_passed = validate_dataset(df)

    print()
    if all_passed:
        print("DATASET GENERATION SUCCESSFUL")
    else:
        print("DATASET GENERATION FAILED -- see validation errors above.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
