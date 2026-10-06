"""
LumiChain AI Layer - Step 9
============================
Streetlight Prediction Service

Connects:
    Sensor Input
        ↓
    Trained ML Model (Tuned Decision Tree)
        ↓
    ML Prediction + Confidence
        ↓
    Deterministic Decision Engine
        ↓
    Final LumiChain Operational Decision

Design & Architecture:
    - Pre-loads model and label encoder once in StreetlightPredictionService
    - Validates telemetry input types, presence, and ranges strictly
    - Converts raw model predictions and confidence into structured JSON-friendly types
    - Integrates with LumiChainDecisionEngine without logic duplication
    - Provides a reusable service ready for FastAPI API integration

Author  : LumiChain AI Team
Purpose : Step 9 Pre-API Prediction Service Layer
"""

from pathlib import Path
from typing import Dict, Any, Union, Optional
import numbers
import joblib
import numpy as np
import pandas as pd

# Support both package-level and direct script execution
try:
    from prediction.decision_engine import LumiChainDecisionEngine
except ImportError:
    from decision_engine import LumiChainDecisionEngine

# ---------------------------------------------------------------------------
# Constants & Default Paths
# ---------------------------------------------------------------------------
FEATURE_COLUMNS = [
    "current",
    "voltage",
    "light_intensity",
    "temperature",
    "neighbor_confirmation",
    "operating_hours",
    "previous_failures",
]

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = BASE_DIR / "models" / "tuned" / "tuned_decision_tree.pkl"
DEFAULT_ENCODER_PATH = BASE_DIR / "models" / "label_encoder.pkl"


# ---------------------------------------------------------------------------
# Streetlight Prediction Service Class
# ---------------------------------------------------------------------------
class StreetlightPredictionService:
    """
    Production-oriented inference service that orchestrates ML classification
    and deterministic decision verification for LumiChain streetlights.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        label_encoder_path: Optional[Union[str, Path]] = None,
    ) -> None:
        """
        Loads the trained model and label encoder once during initialization.
        """
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.label_encoder_path = Path(label_encoder_path) if label_encoder_path else DEFAULT_ENCODER_PATH

        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads serialized model and encoder from disk with verification."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained model artifact not found at: {self.model_path}. "
                "Ensure training/tune_models.py has completed successfully."
            )

        if not self.label_encoder_path.exists():
            raise FileNotFoundError(
                f"Label encoder artifact not found at: {self.label_encoder_path}. "
                "Ensure preprocessing has been completed."
            )

        try:
            self.model = joblib.load(self.model_path)
        except Exception as exc:
            raise RuntimeError(f"Failed to load ML model from {self.model_path}: {exc}") from exc

        try:
            self.label_encoder = joblib.load(self.label_encoder_path)
        except Exception as exc:
            raise RuntimeError(f"Failed to load label encoder from {self.label_encoder_path}: {exc}") from exc

    @staticmethod
    def validate_input(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates input payload. Raises ValueError on missing or ill-typed fields.
        Does NOT silently correct invalid data.
        """
        if not isinstance(data, dict):
            raise ValueError(f"Input payload must be a dictionary, got {type(data).__name__}.")

        # 1. Check required fields
        required_fields = ["pole_id"] + FEATURE_COLUMNS
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            raise ValueError(f"Missing required input field(s): {', '.join(missing_fields)}")

        # 2. Validate pole_id
        pole_id = data["pole_id"]
        if not isinstance(pole_id, str) or not pole_id.strip():
            raise ValueError(f"'pole_id' must be a non-empty string, got: {pole_id!r}")

        # 3. Validate numeric sensor telemetry
        numeric_fields = [
            "current",
            "voltage",
            "light_intensity",
            "temperature",
            "operating_hours",
            "previous_failures",
        ]
        validated_data: Dict[str, Any] = {"pole_id": pole_id.strip()}

        for field in numeric_fields:
            val = data[field]
            if isinstance(val, bool) or not isinstance(val, (int, float, numbers.Number)):
                raise ValueError(
                    f"Field '{field}' must be numeric (int or float), got {type(val).__name__} ({val!r})."
                )
            if np.isnan(val) or np.isinf(val):
                raise ValueError(f"Field '{field}' contains invalid non-finite value: {val}.")
            validated_data[field] = float(val) if field != "previous_failures" else int(round(val))

        # 4. Validate neighbor_confirmation
        nc = data["neighbor_confirmation"]
        if isinstance(nc, bool) or not isinstance(nc, (int, np.integer)):
            raise ValueError(
                f"'neighbor_confirmation' must be an integer (0, 1, or 2), got {type(nc).__name__} ({nc!r})."
            )
        if nc not in {0, 1, 2}:
            raise ValueError(
                f"'neighbor_confirmation' must be strictly between 0 and 2, got: {nc}."
            )
        validated_data["neighbor_confirmation"] = int(nc)

        return validated_data

    def predict_streetlight(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        End-to-end pipeline:
            1. Validate input telemetry
            2. Build feature DataFrame in exact training column order
            3. Run model inference & calculate prediction confidence
            4. Execute LumiChain Decision Engine
            5. Return clean JSON-friendly dictionary
        """
        # Step 1: Input Validation
        validated = self.validate_input(data)

        # Step 2: Feature DataFrame assembly
        features_df = pd.DataFrame(
            [
                {
                    "current": validated["current"],
                    "voltage": validated["voltage"],
                    "light_intensity": validated["light_intensity"],
                    "temperature": validated["temperature"],
                    "neighbor_confirmation": validated["neighbor_confirmation"],
                    "operating_hours": validated["operating_hours"],
                    "previous_failures": validated["previous_failures"],
                }
            ],
            columns=FEATURE_COLUMNS,
        )

        # Step 3: ML Inference
        try:
            features_array = features_df.values
            pred_idx = self.model.predict(features_array)[0]
            pred_probs = self.model.predict_proba(features_array)[0]
        except Exception as exc:
            raise RuntimeError(f"Error during model prediction: {exc}") from exc

        # Decode class label
        predicted_failure_type = str(self.label_encoder.inverse_transform([pred_idx])[0])
        model_confidence = float(np.max(pred_probs))

        # Step 4: Decision Engine Integration
        decision = LumiChainDecisionEngine.evaluate(
            pole_id=validated["pole_id"],
            current=validated["current"],
            voltage=validated["voltage"],
            light_intensity=validated["light_intensity"],
            temperature=validated["temperature"],
            neighbor_confirmation=validated["neighbor_confirmation"],
            operating_hours=validated["operating_hours"],
            previous_failures=validated["previous_failures"],
            predicted_failure_type=predicted_failure_type,
            model_confidence=model_confidence,
        )

        # Step 5: Ensure strict JSON-serializable standard Python primitives
        output: Dict[str, Any] = {
            "poleId": str(decision["poleId"]),
            "failureDetected": bool(decision["failureDetected"]),
            "failureType": str(decision["failureType"]),
            "confidence": float(round(decision["confidence"], 4)),
            "verificationStatus": str(decision["verificationStatus"]),
            "priority": str(decision["priority"]),
            "recommendation": str(decision["recommendation"]),
            "reason": str(decision["reason"]),
            "sensorAlerts": [str(a) for a in decision["sensorAlerts"]],
        }

        # Validate output schema
        assert 0.0 <= output["confidence"] <= 1.0, f"Confidence out of range: {output['confidence']}"
        return output


# ---------------------------------------------------------------------------
# Module-Level Convenience Function (Uses Shared Service Instance)
# ---------------------------------------------------------------------------
_default_service: Optional[StreetlightPredictionService] = None


def get_prediction_service() -> StreetlightPredictionService:
    """Returns a singleton instance of StreetlightPredictionService."""
    global _default_service
    if _default_service is None:
        _default_service = StreetlightPredictionService()
    return _default_service


def predict_streetlight(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to predict streetlight health using the default service.
    """
    service = get_prediction_service()
    return service.predict_streetlight(data)


# ===========================================================================
# Standalone Test Suite
# ===========================================================================
def run_prediction_service_tests():
    """Executes validation test scenarios and prints structured summary."""
    sep = "=" * 80
    print(sep)
    print("LumiChain Streetlight Prediction Service - Test Suite")
    print(sep)

    service = StreetlightPredictionService()

    test_scenarios = [
        {
            "id": "TEST 1: Normal working lamp",
            "input": {
                "pole_id": "SL-001",
                "current": 0.42,
                "voltage": 230.5,
                "light_intensity": 780,
                "temperature": 32,
                "neighbor_confirmation": 0,
                "operating_hours": 4500,
                "previous_failures": 0,
            },
            "expected_failure_detected": False,
            "expected_type": "WORKING",
        },
        {
            "id": "TEST 2: Clear lamp failure",
            "input": {
                "pole_id": "SL-002",
                "current": 0.01,
                "voltage": 229,
                "light_intensity": 0,
                "temperature": 28,
                "neighbor_confirmation": 2,
                "operating_hours": 8500,
                "previous_failures": 1,
            },
            "expected_failure_detected": True,
            "expected_type": "LAMP_FAILURE",
        },
        {
            "id": "TEST 3: Clear power failure",
            "input": {
                "pole_id": "SL-003",
                "current": 0,
                "voltage": 2.1,
                "light_intensity": 0,
                "temperature": 26,
                "neighbor_confirmation": 2,
                "operating_hours": 3200,
                "previous_failures": 0,
            },
            "expected_failure_detected": True,
            "expected_type": "POWER_FAILURE",
        },
        {
            "id": "TEST 4: Voltage anomaly",
            "input": {
                "pole_id": "SL-004",
                "current": 0.26,
                "voltage": 145,
                "light_intensity": 420,
                "temperature": 35,
                "neighbor_confirmation": 1,
                "operating_hours": 6100,
                "previous_failures": 1,
            },
            "expected_failure_detected": True,
            "expected_type": "VOLTAGE_ANOMALY",
        },
        {
            "id": "TEST 5: Sensor failure scenario",
            "input": {
                "pole_id": "SL-005",
                "current": 0.44,
                "voltage": 231.0,
                "light_intensity": 1650.0,
                "temperature": 36.0,
                "neighbor_confirmation": 1,
                "operating_hours": 5200,
                "previous_failures": 2,
            },
            "expected_failure_detected": True,
            "expected_type": "SENSOR_FAILURE",
        },
    ]

    required_keys = {
        "poleId",
        "failureDetected",
        "failureType",
        "confidence",
        "verificationStatus",
        "priority",
        "recommendation",
        "reason",
        "sensorAlerts",
    }

    tests_executed = 0
    tests_passed = 0
    tests_failed = 0

    for test in test_scenarios:
        tests_executed += 1
        print(f"\n--- {test['id']} ---")
        payload = test["input"]

        try:
            # We also verify the standalone module-level function
            result = predict_streetlight(payload)

            # Extract details for printing
            print(f"  Pole ID                    : {result['poleId']}")
            print(f"  Final failure detected     : {result['failureDetected']}")
            print(f"  Final failure type         : {result['failureType']}")
            print(f"  ML confidence              : {result['confidence']:.4f}")
            print(f"  Verification status        : {result['verificationStatus']}")
            print(f"  Priority                   : {result['priority']}")
            print(f"  Recommendation             : {result['recommendation']}")
            print(f"  Reason                     : {result['reason']}")
            print(f"  Sensor alerts              : {result['sensorAlerts']}")

            # Assertions
            assert required_keys.issubset(result.keys()), f"Missing keys: {required_keys - set(result.keys())}"
            assert 0.0 <= result["confidence"] <= 1.0, f"Invalid confidence: {result['confidence']}"
            assert result["poleId"] == payload["pole_id"], "Pole ID mismatch"
            assert result["failureDetected"] == test["expected_failure_detected"], "Failure detected mismatch"
            assert result["failureType"] == test["expected_type"], (
                f"Expected {test['expected_type']}, got {result['failureType']}"
            )

            # JSON-types validation: ensure pure python primitives
            for k, val in result.items():
                assert not isinstance(val, (np.generic, np.ndarray, pd.Series, pd.DataFrame)), (
                    f"Field {k} contains numpy/pandas type: {type(val)}"
                )

            tests_passed += 1

        except Exception as exc:
            tests_failed += 1
            print(f"  [ERROR] Test failed with exception: {exc}")

    # Test error handling
    print("\n--- Additional Validation Checks (Negative Tests) ---")
    negative_cases = [
        ("Missing field", {"pole_id": "SL-999", "current": 0.4}),
        ("Empty pole_id", {"pole_id": "", "current": 0.4, "voltage": 230, "light_intensity": 700, "temperature": 30, "neighbor_confirmation": 0, "operating_hours": 100, "previous_failures": 0}),
        ("Invalid neighbor (out of range)", {"pole_id": "SL-999", "current": 0.4, "voltage": 230, "light_intensity": 700, "temperature": 30, "neighbor_confirmation": 5, "operating_hours": 100, "previous_failures": 0}),
        ("Invalid type (string current)", {"pole_id": "SL-999", "current": "invalid", "voltage": 230, "light_intensity": 700, "temperature": 30, "neighbor_confirmation": 0, "operating_hours": 100, "previous_failures": 0}),
    ]

    for label, invalid_input in negative_cases:
        tests_executed += 1
        try:
            service.predict_streetlight(invalid_input)
            print(f"  [FAIL] Expected ValueError for '{label}', but no exception was raised.")
            tests_failed += 1
        except ValueError as val_err:
            print(f"  [PASS] Correctly raised ValueError for '{label}': {val_err}")
            tests_passed += 1
        except Exception as other_err:
            print(f"  [FAIL] Unexpected exception type for '{label}': {other_err}")
            tests_failed += 1

    print(f"\n{sep}")
    print("PREDICTION SERVICE TEST SUMMARY")
    print(sep)
    print(f"Tests executed : {tests_executed}")
    print(f"Tests passed   : {tests_passed}")
    print(f"Tests failed   : {tests_failed}")
    print(sep)

    assert tests_failed == 0, f"{tests_failed} tests failed in prediction service suite."


if __name__ == "__main__":
    run_prediction_service_tests()
    print("\nPREDICTION SERVICE IMPLEMENTATION COMPLETE")
