"""
Tests for Unified Authentication API (Module Auth).
Verifies registration, login, cookie setting, CSRF tokens, profile management,
and TOTP Multi-Factor Authentication (MFA) lifecycle for privileged and citizen accounts.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.auth.totp import TOTPManager

client = TestClient(app)


def test_register_and_login_flow():
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    # 1. Register a new citizen
    reg_payload = {
        "name": "Ananya Sen",
        "email": unique_email,
        "password": "SecurePassword_2026!",
        "role": "CITIZEN",
        "phone": "+919876543210",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert reg_data["data"]["user"]["email"] == unique_email
    assert "access_token" in reg_resp.cookies
    assert "csrf_token" in reg_resp.cookies

    # 2. Login with valid credentials
    login_payload = {
        "email": unique_email,
        "password": "SecurePassword_2026!",
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert login_data["data"]["user"]["name"] == "Ananya Sen"
    assert "access_token" in login_resp.cookies

    # 3. Test duplicate registration rejection
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert dup_resp.json()["error"]["code"] == "USER_ALREADY_EXISTS"

    # 4. Test wrong password rejection
    bad_login = client.post("/api/v1/auth/login", json={"email": unique_email, "password": "WrongPassword!"})
    assert bad_login.status_code == 401
    assert bad_login.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_totp_mfa_lifecycle():
    unique_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "name": "Admin Officer",
        "email": unique_email,
        "password": "AdminMasterKey_2026!",
        "role": "ADMIN",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    cookies = reg_resp.cookies

    # 1. Setup MFA
    setup_resp = client.post("/api/v1/auth/mfa/setup", cookies=cookies)
    assert setup_resp.status_code == 200
    setup_data = setup_resp.json()["data"]
    secret = setup_data["secret"]
    provisioning_uri = setup_data["provisioning_uri"]
    assert "otpauth://totp/" in provisioning_uri
    assert secret != ""

    # 2. Verify invalid code rejected
    bad_verify = client.post(
        "/api/v1/auth/mfa/verify",
        json={"secret": secret, "code": "000000"},
        cookies=cookies
    )
    assert bad_verify.status_code == 400
    assert bad_verify.json()["error"]["code"] == "INVALID_MFA_CODE"

    # 3. Verify valid code activates MFA
    valid_code = TOTPManager.generate_token(secret)
    verify_resp = client.post(
        "/api/v1/auth/mfa/verify",
        json={"secret": secret, "code": valid_code},
        cookies=cookies
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["data"]["mfa_enabled"] is True

    # 4. Attempt login without MFA code -> returns mfa_required
    login_attempt = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "AdminMasterKey_2026!"}
    )
    assert login_attempt.status_code == 200
    assert login_attempt.json()["data"]["mfa_required"] is True

    # 5. Attempt login with invalid MFA code -> rejected
    bad_mfa_login = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "AdminMasterKey_2026!", "mfa_code": "999999"}
    )
    assert bad_mfa_login.status_code == 401
    assert bad_mfa_login.json()["error"]["code"] == "INVALID_MFA_CODE"

    # 6. Attempt login with valid MFA code -> authenticated successfully
    current_mfa_code = TOTPManager.generate_token(secret)
    good_mfa_login = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "AdminMasterKey_2026!", "mfa_code": current_mfa_code}
    )
    assert good_mfa_login.status_code == 200
    assert good_mfa_login.json()["data"]["mfa_required"] is False
    assert "access_token" in good_mfa_login.cookies
    # Verify no MFA secret in returned user object
    assert "mfa_secret" not in good_mfa_login.json()["data"]["user"]


def test_logout():
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
