"""
LumiChain AI Layer - Step 8
============================
Deterministic Decision Engine

A deterministic post-processing layer that sits between the ML classification
model and the API response (FastAPI).

Architecture:
    Sensor Input
        ↓
    ML Model
        ↓
    predicted_failure_type + model_confidence
        ↓
    Decision Engine
        ├── Sensor sanity checks
        ├── Neighbor verification
        ├── Confidence assessment
        ├── Failure confirmation
        ├── Priority assignment
        └── Recommended action

Design Principles:
    - Combines statistical ML classification with deterministic domain business rules.
    - Prevents raw model overconfidence from triggering false maintenance dispatch.
    - Distributed neighbor confirmation acts as supporting evidence, NOT a blind override.
    - Reusable by future FastAPI service endpoints (api/main.py).

Author  : LumiChain AI Team
Purpose : Step 8 Deterministic Post-ML Decision Engine
"""

from typing import Dict, List, Any, Union


# ---------------------------------------------------------------------------
# Enums / Constants
# ---------------------------------------------------------------------------
VERIFICATION_CONFIRMED = "CONFIRMED"
VERIFICATION_PROBABLE  = "PROBABLE"
VERIFICATION_UNCERTAIN = "UNCERTAIN"
VERIFICATION_NORMAL    = "NORMAL"

VALID_VERIFICATION_STATUSES = {
    VERIFICATION_CONFIRMED,
    VERIFICATION_PROBABLE,
    VERIFICATION_UNCERTAIN,
    VERIFICATION_NORMAL,
}

REC_CREATE_COMPLAINT = "CREATE_MAINTENANCE_COMPLAINT"
REC_REQUEST_RECHECK  = "REQUEST_RECHECK"
REC_NO_ACTION        = "NO_ACTION"

VALID_RECOMMENDATIONS = {
    REC_CREATE_COMPLAINT,
    REC_REQUEST_RECHECK,
    REC_NO_ACTION,
}

PRIORITY_CRITICAL = "CRITICAL"
PRIORITY_HIGH     = "HIGH"
PRIORITY_MEDIUM   = "MEDIUM"
PRIORITY_LOW      = "LOW"

VALID_PRIORITIES = {
    PRIORITY_CRITICAL,
    PRIORITY_HIGH,
    PRIORITY_MEDIUM,
    PRIORITY_LOW,
}


# ---------------------------------------------------------------------------
# Decision Engine Implementation
# ---------------------------------------------------------------------------
class LumiChainDecisionEngine:
    """
    Deterministic decision engine enforcing LumiChain governance rules,
    sensor sanity checks, neighbor consensus verification, and priority assignment.
    """

    @staticmethod
    def check_sensor_sanity(
        current: float,
        voltage: float,
        light_intensity: float,
        temperature: float,
        operating_hours: float,
        previous_failures: int,
    ) -> List[str]:
        """
        Detects physical anomalies or corrupted sensor telemetry.
        Alerts serve as domain evidence without blindly overriding the ML model.
        """
        alerts: List[str] = []

        # Voltage boundaries
        if voltage <= 10.0:
            alerts.append("CRITICAL_LOW_VOLTAGE")
        elif voltage < 180.0:
            alerts.append("LOW_VOLTAGE")
        elif voltage > 280.0:
            alerts.append("OVER_VOLTAGE")

        # Physical impossibility checks
        if current < 0.0:
            alerts.append("INVALID_CURRENT")
        if light_intensity < 0.0:
            alerts.append("INVALID_LIGHT_INTENSITY")
        if temperature > 70.0:
            alerts.append("HIGH_TEMPERATURE")
        if operating_hours < 0.0:
            alerts.append("INVALID_OPERATING_HOURS")
        if previous_failures < 0:
            alerts.append("INVALID_PREVIOUS_FAILURE_COUNT")

        return alerts

    @staticmethod
    def assess_confidence_tier(confidence: float) -> str:
        """Categorize model prediction confidence into actionable tiers."""
        if confidence >= 0.90:
            return "HIGH"
        elif confidence >= 0.70:
            return "MEDIUM"
        else:
            return "LOW"

    @classmethod
    def evaluate(
        cls,
        pole_id: Union[str, int],
        current: float,
        voltage: float,
        light_intensity: float,
        temperature: float,
        neighbor_confirmation: int,
        operating_hours: float,
        previous_failures: int,
        predicted_failure_type: str,
        model_confidence: float,
    ) -> Dict[str, Any]:
        """
        Evaluate full sensor telemetry along with ML predictions to generate
        a verified operational decision.
        """
        pole_str = str(pole_id)
        conf_val = float(model_confidence)
        neighbor_int = int(neighbor_confirmation)
        predicted_type = str(predicted_failure_type).strip().upper()

        # 1. Run sensor sanity checks
        sensor_alerts = cls.check_sensor_sanity(
            current=current,
            voltage=voltage,
            light_intensity=light_intensity,
            temperature=temperature,
            operating_hours=operating_hours,
            previous_failures=previous_failures,
        )

        conf_tier = cls.assess_confidence_tier(conf_val)

        # 2. Failure Verification Logic
        if predicted_type == "WORKING":
            failure_detected = False
            if len(sensor_alerts) == 0:
                verification_status = VERIFICATION_NORMAL
                recommendation = REC_NO_ACTION
                priority = PRIORITY_LOW
                reason = "Healthy operation confirmed by ML classifier and normal sensor telemetry."
            else:
                verification_status = VERIFICATION_UNCERTAIN
                recommendation = REC_REQUEST_RECHECK
                priority = PRIORITY_MEDIUM
                reason = (
                    f"ML classified pole as WORKING, but telemetry triggered sensor alerts: "
                    f"[{', '.join(sensor_alerts)}]. Immediate sensor recheck requested."
                )

        else:
            # Genuine failure type predicted: LAMP_FAILURE, POWER_FAILURE, SENSOR_FAILURE, VOLTAGE_ANOMALY
            failure_detected = True

            # Standard confidence & neighbor verification matrix
            if conf_val >= 0.90 and neighbor_int >= 1:
                verification_status = VERIFICATION_CONFIRMED
            elif conf_val >= 0.90 and neighbor_int == 0:
                verification_status = VERIFICATION_PROBABLE
            elif conf_val >= 0.70 and neighbor_int >= 1:
                verification_status = VERIFICATION_PROBABLE
            else:
                verification_status = VERIFICATION_UNCERTAIN

            # 3. Critical Failure Override
            # POWER_FAILURE with physical voltage collapse must always be treated as CRITICAL CONFIRMED
            is_critical_power_loss = (predicted_type == "POWER_FAILURE" and voltage <= 15.0)

            if is_critical_power_loss:
                verification_status = VERIFICATION_CONFIRMED
                priority = PRIORITY_CRITICAL
                recommendation = REC_CREATE_COMPLAINT
                reason = (
                    f"CRITICAL POWER LOSS: Verified power failure with severe voltage drop ({voltage:.1f}V <= 15V). "
                    f"Immediate electrical grid dispatch required."
                )
            else:
                # 4. Priority Assignment Rules
                if predicted_type == "POWER_FAILURE":
                    priority = PRIORITY_CRITICAL if verification_status == VERIFICATION_CONFIRMED else PRIORITY_HIGH
                elif predicted_type == "LAMP_FAILURE":
                    priority = PRIORITY_HIGH if verification_status == VERIFICATION_CONFIRMED else PRIORITY_MEDIUM
                elif predicted_type == "VOLTAGE_ANOMALY":
                    priority = PRIORITY_HIGH if verification_status == VERIFICATION_CONFIRMED else PRIORITY_MEDIUM
                elif predicted_type == "SENSOR_FAILURE":
                    priority = PRIORITY_MEDIUM if verification_status == VERIFICATION_CONFIRMED else PRIORITY_LOW
                else:
                    priority = PRIORITY_MEDIUM

                # 5. Maintenance Recommendation
                if verification_status in {VERIFICATION_CONFIRMED, VERIFICATION_PROBABLE}:
                    recommendation = REC_CREATE_COMPLAINT
                else:
                    recommendation = REC_REQUEST_RECHECK

                # 6. Detailed reasoning
                evidence = [
                    f"ML model predicted {predicted_type} with {conf_tier} confidence ({conf_val:.1%})",
                    f"{neighbor_int} neighboring streetlight(s) confirming fault",
                    f"status categorized as {verification_status}",
                ]
                if sensor_alerts:
                    evidence.append(f"sensor alerts: [{', '.join(sensor_alerts)}]")

                reason = ". ".join(evidence) + f". Recommended action: {recommendation}."

        result = {
            "poleId": pole_str,
            "failureDetected": failure_detected,
            "failureType": predicted_type,
            "confidence": round(conf_val, 4),
            "verificationStatus": verification_status,
            "priority": priority,
            "recommendation": recommendation,
            "reason": reason,
            "sensorAlerts": sensor_alerts,
        }

        # Validate result schema integrity
        assert result["verificationStatus"] in VALID_VERIFICATION_STATUSES, "Invalid verificationStatus"
        assert result["recommendation"] in VALID_RECOMMENDATIONS, "Invalid recommendation"
        assert result["priority"] in VALID_PRIORITIES, "Invalid priority"

        return result


# Reusable functional alias for clean imports
evaluate_decision = LumiChainDecisionEngine.evaluate


# ===========================================================================
# Test Cases & Self-Verification
# ===========================================================================
def run_test_suite():
    """Execute required test scenarios and validate all schema contracts."""
    sep = "=" * 80
    print(sep)
    print("LumiChain Decision Engine - Test Suite Execution")
    print(sep)

    test_cases = [
        {
            "title": "Case 1: Normal working lamp",
            "input": {
                "pole_id": "POLE-101",
                "current": 0.42,
                "voltage": 230.5,
                "light_intensity": 780.0,
                "temperature": 32.0,
                "neighbor_confirmation": 0,
                "operating_hours": 4500.0,
                "previous_failures": 0,
                "predicted_failure_type": "WORKING",
                "model_confidence": 0.99,
            },
            "expected_status": VERIFICATION_NORMAL,
            "expected_rec": REC_NO_ACTION,
        },
        {
            "title": "Case 2: Confirmed lamp failure",
            "input": {
                "pole_id": "POLE-102",
                "current": 0.01,
                "voltage": 229.0,
                "light_intensity": 0.0,
                "temperature": 28.0,
                "neighbor_confirmation": 2,
                "operating_hours": 8500.0,
                "previous_failures": 1,
                "predicted_failure_type": "LAMP_FAILURE",
                "model_confidence": 0.99,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 3: Confirmed power failure (Critical Override)",
            "input": {
                "pole_id": "POLE-103",
                "current": 0.00,
                "voltage": 2.1,
                "light_intensity": 0.0,
                "temperature": 26.0,
                "neighbor_confirmation": 2,
                "operating_hours": 3200.0,
                "previous_failures": 0,
                "predicted_failure_type": "POWER_FAILURE",
                "model_confidence": 0.98,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 4: Sensor failure",
            "input": {
                "pole_id": "POLE-104",
                "current": 0.44,
                "voltage": 231.0,
                "light_intensity": 1650.0,
                "temperature": 35.0,
                "neighbor_confirmation": 1,
                "operating_hours": 5200.0,
                "previous_failures": 2,
                "predicted_failure_type": "SENSOR_FAILURE",
                "model_confidence": 0.94,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 5: Voltage anomaly",
            "input": {
                "pole_id": "POLE-105",
                "current": 0.26,
                "voltage": 145.0,
                "light_intensity": 420.0,
                "temperature": 35.0,
                "neighbor_confirmation": 1,
                "operating_hours": 6100.0,
                "previous_failures": 1,
                "predicted_failure_type": "VOLTAGE_ANOMALY",
                "model_confidence": 0.93,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 6: Low-confidence failure",
            "input": {
                "pole_id": "POLE-106",
                "current": 0.18,
                "voltage": 225.0,
                "light_intensity": 250.0,
                "temperature": 30.0,
                "neighbor_confirmation": 0,
                "operating_hours": 7000.0,
                "previous_failures": 1,
                "predicted_failure_type": "LAMP_FAILURE",
                "model_confidence": 0.58,
            },
            "expected_status": VERIFICATION_UNCERTAIN,
            "expected_rec": REC_REQUEST_RECHECK,
        },
        {
            "title": "Case 7: High-confidence failure without neighbor confirmation",
            "input": {
                "pole_id": "POLE-107",
                "current": 0.02,
                "voltage": 228.0,
                "light_intensity": 5.0,
                "temperature": 29.0,
                "neighbor_confirmation": 0,
                "operating_hours": 9200.0,
                "previous_failures": 0,
                "predicted_failure_type": "LAMP_FAILURE",
                "model_confidence": 0.95,
            },
            "expected_status": VERIFICATION_PROBABLE,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 8: High-confidence failure with one neighbor",
            "input": {
                "pole_id": "POLE-108",
                "current": 0.02,
                "voltage": 228.0,
                "light_intensity": 5.0,
                "temperature": 29.0,
                "neighbor_confirmation": 1,
                "operating_hours": 9200.0,
                "previous_failures": 0,
                "predicted_failure_type": "LAMP_FAILURE",
                "model_confidence": 0.95,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 9: High-confidence failure with two neighbors",
            "input": {
                "pole_id": "POLE-109",
                "current": 0.02,
                "voltage": 228.0,
                "light_intensity": 5.0,
                "temperature": 29.0,
                "neighbor_confirmation": 2,
                "operating_hours": 9200.0,
                "previous_failures": 0,
                "predicted_failure_type": "LAMP_FAILURE",
                "model_confidence": 0.95,
            },
            "expected_status": VERIFICATION_CONFIRMED,
            "expected_rec": REC_CREATE_COMPLAINT,
        },
        {
            "title": "Case 10: Working lamp with suspicious voltage",
            "input": {
                "pole_id": "POLE-110",
                "current": 0.40,
                "voltage": 165.0,
                "light_intensity": 720.0,
                "temperature": 30.0,
                "neighbor_confirmation": 0,
                "operating_hours": 4000.0,
                "previous_failures": 0,
                "predicted_failure_type": "WORKING",
                "model_confidence": 0.91,
            },
            "expected_status": VERIFICATION_UNCERTAIN,
            "expected_rec": REC_REQUEST_RECHECK,
        },
        {
            "title": "Case 11: Working lamp with high temperature",
            "input": {
                "pole_id": "POLE-111",
                "current": 0.42,
                "voltage": 230.0,
                "light_intensity": 760.0,
                "temperature": 78.5,
                "neighbor_confirmation": 0,
                "operating_hours": 4200.0,
                "previous_failures": 0,
                "predicted_failure_type": "WORKING",
                "model_confidence": 0.92,
            },
            "expected_status": VERIFICATION_UNCERTAIN,
            "expected_rec": REC_REQUEST_RECHECK,
        },
        {
            "title": "Case 12: Conflicting ML prediction and sensor sanity alert",
            "input": {
                "pole_id": "POLE-112",
                "current": -0.05,
                "voltage": 8.0,
                "light_intensity": -10.0,
                "temperature": 85.0,
                "neighbor_confirmation": 0,
                "operating_hours": -50.0,
                "previous_failures": -1,
                "predicted_failure_type": "WORKING",
                "model_confidence": 0.72,
            },
            "expected_status": VERIFICATION_UNCERTAIN,
            "expected_rec": REC_REQUEST_RECHECK,
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

    for idx, case in enumerate(test_cases, 1):
        print(f"\n--- [{idx}/{len(test_cases)}] {case['title']} ---")
        inp = case["input"]
        print(f"  Input: {inp}")

        result = LumiChainDecisionEngine.evaluate(**inp)

        print("  Decision Output:")
        for k in sorted(result.keys()):
            print(f"    {k:<19s}: {result[k]}")

        # Assert schema keys
        assert required_keys.issubset(result.keys()), f"Missing keys in output: {required_keys - set(result.keys())}"
        assert result["poleId"] == str(inp["pole_id"]), "poleId mismatch"
        assert result["verificationStatus"] == case["expected_status"], (
            f"Expected {case['expected_status']}, got {result['verificationStatus']}"
        )
        assert result["recommendation"] == case["expected_rec"], (
            f"Expected {case['expected_rec']}, got {result['recommendation']}"
        )

    print(f"\n{sep}")
    print("ALL 12 TEST SCENARIOS PASSED ALL ASSERTIONS SUCCESSFULLY.")
    print(sep)


if __name__ == "__main__":
    run_test_suite()
    print("\nDECISION ENGINE IMPLEMENTATION COMPLETE")
