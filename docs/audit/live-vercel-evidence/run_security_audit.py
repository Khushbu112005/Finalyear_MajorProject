import urllib.request
import urllib.error
import http.cookiejar
import json

BASE_URL = "https://civicsphere-backend.vercel.app"
WEB_URL = "https://civicsphere-web.vercel.app"

sec_report = {}

# 1. Inspect Frontend Headers
print("=== Inspecting Frontend Headers ===")
req = urllib.request.Request(WEB_URL, method="HEAD")
with urllib.request.urlopen(req) as resp:
    fe_headers = dict(resp.headers)
    sec_report["frontend_headers"] = fe_headers
    print("Frontend Headers:")
    for k in ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "access-control-allow-origin"]:
        print(f"  {k:28}: {fe_headers.get(k, 'MISSING')}")

# 2. Inspect Backend Headers
print("\n=== Inspecting Backend Headers ===")
req = urllib.request.Request(f"{BASE_URL}/api/v1/health", method="GET")
with urllib.request.urlopen(req) as resp:
    be_headers = dict(resp.headers)
    sec_report["backend_headers"] = be_headers
    print("Backend Headers:")
    for k in ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "access-control-allow-origin"]:
        print(f"  {k:28}: {be_headers.get(k, 'MISSING')}")

# 3. Test CORS with Arbitrary Origin
print("\n=== Testing CORS with Untrusted Origin ===")
cors_req = urllib.request.Request(
    f"{BASE_URL}/api/v1/health",
    headers={"Origin": "https://malicious-attacker.com"},
    method="GET"
)
try:
    with urllib.request.urlopen(cors_req) as resp:
        cors_headers = dict(resp.headers)
        print("ACAO header:", cors_headers.get("access-control-allow-origin", "None"))
        print("ACAC header:", cors_headers.get("access-control-allow-credentials", "None"))
        sec_report["cors_test"] = {
            "origin_tested": "https://malicious-attacker.com",
            "access_control_allow_origin": cors_headers.get("access-control-allow-origin"),
            "access_control_allow_credentials": cors_headers.get("access-control-allow-credentials")
        }
except Exception as e:
    print("CORS error:", e)

# 4. Test CSRF Protection Enforcement
print("\n=== Testing CSRF Enforcement on Protected POST ===")
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# Login first to get cookie
login_payload = {
    "email": "audit_test_citizen_20261028@example.com",
    "password": "SecurePassword123!"
}
req = urllib.request.Request(
    f"{BASE_URL}/api/v1/auth/login",
    data=json.dumps(login_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)
with opener.open(req) as resp:
    login_data = json.loads(resp.read().decode('utf-8'))
    valid_csrf = login_data.get('data', {}).get('csrf_token')

case_payload = {
    "title": "CSRF Bypass Test Case",
    "description": "Testing if state-changing POST succeeds without CSRF header",
    "category": "Property & Land",
    "priority": "LOW",
    "location": "Mumbai"
}

# Test 4a: POST with NO CSRF header
print("Testing Case Creation WITHOUT CSRF header...", end=" ")
req_no_csrf = urllib.request.Request(
    f"{BASE_URL}/api/v1/cases",
    data=json.dumps(case_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with opener.open(req_no_csrf) as resp:
        print(f"Status: {resp.status} (VULNERABLE if 200 - CSRF Missing)")
        res_data = json.loads(resp.read().decode('utf-8'))
        sec_report["csrf_missing_result"] = {"status": resp.status, "body": res_data}
        # cleanup if created
        if res_data.get('data', {}).get('id'):
            cid = res_data['data']['id']
            del_req = urllib.request.Request(f"{BASE_URL}/api/v1/cases/{cid}", headers={"Content-Type": "application/json", "X-CSRF-Token": valid_csrf}, method="DELETE")
            opener.open(del_req)
except urllib.error.HTTPError as e:
    print(f"Blocked! Status: {e.code} (PROPER CSRF ENFORCEMENT)")
    sec_report["csrf_missing_result"] = {"status": e.code, "body": e.read().decode('utf-8')}

# Test 4b: POST with INVALID CSRF header
print("Testing Case Creation with FAKE CSRF header...", end=" ")
req_fake_csrf = urllib.request.Request(
    f"{BASE_URL}/api/v1/cases",
    data=json.dumps(case_payload).encode('utf-8'),
    headers={"Content-Type": "application/json", "X-CSRF-Token": "fake_invalid_csrf_token_12345"},
    method="POST"
)
try:
    with opener.open(req_fake_csrf) as resp:
        print(f"Status: {resp.status} (VULNERABLE if 200 - Invalid CSRF Accepted)")
        res_data = json.loads(resp.read().decode('utf-8'))
        sec_report["csrf_invalid_result"] = {"status": resp.status, "body": res_data}
        if res_data.get('data', {}).get('id'):
            cid = res_data['data']['id']
            del_req = urllib.request.Request(f"{BASE_URL}/api/v1/cases/{cid}", headers={"Content-Type": "application/json", "X-CSRF-Token": valid_csrf}, method="DELETE")
            opener.open(del_req)
except urllib.error.HTTPError as e:
    print(f"Blocked! Status: {e.code} (PROPER CSRF ENFORCEMENT)")
    sec_report["csrf_invalid_result"] = {"status": e.code, "body": e.read().decode('utf-8')}

with open("docs/audit/live-vercel-evidence/security_audit_results.json", "w", encoding="utf-8") as f:
    json.dump(sec_report, f, indent=2)

print("\nSecurity results saved to docs/audit/live-vercel-evidence/security_audit_results.json")
