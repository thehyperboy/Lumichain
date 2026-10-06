"""
LumiChain AI Layer - Step 10 Tests
====================================
FastAPI Endpoint Test Suite

Tests all REST endpoints without requiring a live server process:
    1. GET  /health - Status code and metadata schema
    2. POST /predict - Normal working lamp (SL-001)
    3. POST /predict - Clear lamp failure (SL-002)
    4. POST /predict - Clear power failure (SL-003)
    5. POST /predict - Voltage anomaly (SL-004)
    6. POST /predict - Invalid neighborConfirmation (validation rejection)
    7. POST /predict - Missing required fields (validation rejection)
    8. POST /predict - Negative operating hours (validation rejection)
    9. POST /predict - Empty poleId (validation rejection)

Author  : LumiChain AI Team
Purpose : Automated API verification using FastAPI TestClient
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

SEP = "=" * 80


def run_api_tests():
    print(SEP)
    print("Running LumiChain FastAPI AI Service Test Suite")
    print(SEP)

    tests_run = 0
    tests_passed = 0
    tests_failed = 0

    # -----------------------------------------------------------------------
    # TEST 1: Health Check Endpoint
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 1] GET /health")
    response = client.get("/health")
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "LumiChain AI Service"
        assert data["model"] == "Tuned Decision Tree"
        assert data["version"] == "1.0.0"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 2: Normal Working Lamp
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 2] POST /predict - Normal Working Lamp")
    payload_normal = {
        "poleId": "SL-001",
        "current": 0.42,
        "voltage": 230.5,
        "lightIntensity": 780.0,
        "temperature": 32.0,
        "neighborConfirmation": 0,
        "operatingHours": 4500.0,
        "previousFailures": 0,
    }
    response = client.post("/predict", json=payload_normal)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 200
        res = response.json()
        assert res["poleId"] == "SL-001"
        assert res["failureDetected"] is False
        assert res["failureType"] == "WORKING"
        assert res["verificationStatus"] == "NORMAL"
        assert res["recommendation"] == "NO_ACTION"
        assert 0.0 <= res["confidence"] <= 1.0
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 3: Clear Lamp Failure
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 3] POST /predict - Clear Lamp Failure")
    payload_lamp = {
        "poleId": "SL-002",
        "current": 0.01,
        "voltage": 229.0,
        "lightIntensity": 0.0,
        "temperature": 28.0,
        "neighborConfirmation": 2,
        "operatingHours": 8500.0,
        "previousFailures": 1,
    }
    response = client.post("/predict", json=payload_lamp)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 200
        res = response.json()
        assert res["poleId"] == "SL-002"
        assert res["failureDetected"] is True
        assert res["failureType"] == "LAMP_FAILURE"
        assert res["verificationStatus"] == "CONFIRMED"
        assert res["priority"] == "HIGH"
        assert res["recommendation"] == "CREATE_MAINTENANCE_COMPLAINT"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 4: Clear Power Failure
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 4] POST /predict - Clear Power Failure")
    payload_power = {
        "poleId": "SL-003",
        "current": 0.0,
        "voltage": 2.1,
        "lightIntensity": 0.0,
        "temperature": 26.0,
        "neighborConfirmation": 2,
        "operatingHours": 3200.0,
        "previousFailures": 0,
    }
    response = client.post("/predict", json=payload_power)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 200
        res = response.json()
        assert res["poleId"] == "SL-003"
        assert res["failureDetected"] is True
        assert res["failureType"] == "POWER_FAILURE"
        assert res["verificationStatus"] == "CONFIRMED"
        assert res["priority"] == "CRITICAL"
        assert res["recommendation"] == "CREATE_MAINTENANCE_COMPLAINT"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 5: Voltage Anomaly
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 5] POST /predict - Voltage Anomaly")
    payload_voltage = {
        "poleId": "SL-004",
        "current": 0.26,
        "voltage": 145.0,
        "lightIntensity": 420.0,
        "temperature": 35.0,
        "neighborConfirmation": 1,
        "operatingHours": 6100.0,
        "previousFailures": 1,
    }
    response = client.post("/predict", json=payload_voltage)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 200
        res = response.json()
        assert res["poleId"] == "SL-004"
        assert res["failureDetected"] is True
        assert res["failureType"] == "VOLTAGE_ANOMALY"
        assert res["verificationStatus"] == "CONFIRMED"
        assert res["priority"] == "HIGH"
        assert res["recommendation"] == "CREATE_MAINTENANCE_COMPLAINT"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 6: Invalid neighborConfirmation (e.g. 5 -> HTTP 422)
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 6] POST /predict - Invalid neighborConfirmation (out of range)")
    payload_invalid_neighbor = dict(payload_normal, neighborConfirmation=5)
    response = client.post("/predict", json=payload_invalid_neighbor)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 7: Missing Required Fields
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 7] POST /predict - Missing Required Fields")
    payload_missing = {"poleId": "SL-001", "current": 0.42}  # Missing voltage, lightIntensity, etc.
    response = client.post("/predict", json=payload_missing)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 8: Negative operatingHours
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 8] POST /predict - Negative operatingHours")
    payload_negative_hours = dict(payload_normal, operatingHours=-50.0)
    response = client.post("/predict", json=payload_negative_hours)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # TEST 9: Empty poleId
    # -----------------------------------------------------------------------
    tests_run += 1
    print("\n[TEST 9] POST /predict - Empty poleId")
    payload_empty_pole = dict(payload_normal, poleId="")
    response = client.post("/predict", json=payload_empty_pole)
    print(f"  Status: {response.status_code}")
    print(f"  Body  : {response.json()}")

    try:
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        tests_passed += 1
        print("  -> PASS")
    except AssertionError as err:
        tests_failed += 1
        print(f"  -> FAIL: {err}")

    # -----------------------------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------------------------
    print(f"\n{SEP}")
    print("FASTAPI TEST SUITE SUMMARY")
    print(SEP)
    print(f"Tests executed : {tests_run}")
    print(f"Tests passed   : {tests_passed}")
    print(f"Tests failed   : {tests_failed}")
    print(SEP)

    assert tests_failed == 0, f"{tests_failed} API tests failed."


if __name__ == "__main__":
    run_api_tests()
    print("\nFASTAPI AI SERVICE IMPLEMENTATION COMPLETE")
