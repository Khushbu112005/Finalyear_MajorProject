import urllib.request
import urllib.error
import http.cookiejar
import json

BASE_URL = "https://civicsphere-backend.vercel.app"

# Setup cookie jar
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

print("=== 1. Logging in with synthetic test user ===")
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

csrf_token = None
try:
    with opener.open(req) as resp:
        print("Login Status:", resp.status)
        data = json.loads(resp.read().decode('utf-8'))
        csrf_token = data.get('data', {}).get('csrf_token')
        print("CSRF Token obtained:", csrf_token[:16] + "..." if csrf_token else "None")
        print("Cookies stored in jar:", [c.name for c in cj])
except Exception as e:
    print("Login failed:", e)

def auth_call(name, method, path, body=None):
    headers = {"Content-Type": "application/json"}
    if csrf_token and method in ["POST", "PUT", "DELETE"]:
        headers["X-CSRF-Token"] = csrf_token
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with opener.open(req) as resp:
            content = resp.read().decode('utf-8')
            try:
                parsed = json.loads(content)
            except:
                parsed = content[:200]
            print(f"[{method}] {name:30} -> Status {resp.status}")
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            parsed = json.loads(content)
        except:
            parsed = content[:200]
        print(f"[{method}] {name:30} -> Status {e.code} | {parsed.get('error', parsed)}")
        return e.code, parsed

print("\n=== 2. Testing Authenticated Endpoints ===")
auth_call("Auth Me", "GET", "/api/v1/auth/me")
auth_call("Cases List", "GET", "/api/v1/cases")

# Try to create a case
case_payload = {
    "title": "Audit Test Citizen Case 1",
    "description": "Synthetic case created during live black-box audit for persistence verification",
    "category": "Property & Land",
    "priority": "MEDIUM",
    "location": "Mumbai, Maharashtra"
}
status, created_case = auth_call("Create Case", "POST", "/api/v1/cases", case_payload)
case_id = None
if status == 200 and isinstance(created_case, dict) and created_case.get('success'):
    case_id = created_case.get('data', {}).get('case_id') or created_case.get('data', {}).get('id')
    print("Created Case ID:", case_id)

auth_call("Documents List", "GET", "/api/v1/documents")
auth_call("Knowledge Sources", "GET", "/api/v1/knowledge/sources")
auth_call("Knowledge Search", "POST", "/api/v1/knowledge/search", {"query": "consumer rights"})
auth_call("Knowledge Graph Query", "POST", "/api/v1/knowledge/graph/query", {"cypher_query": "MATCH (n) RETURN n LIMIT 5"})

print("\n=== 3. Testing RBAC on Admin Routes as Citizen (Must be 403 Forbidden) ===")
auth_call("Admin Overview (as Citizen)", "GET", "/api/v1/knowledge/admin/overview")
auth_call("Admin Security Status (as Citizen)", "GET", "/api/v1/knowledge/admin/security-status")
auth_call("Admin Audit Logs (as Citizen)", "GET", "/api/v1/knowledge/admin/audit-logs")
auth_call("Admin Reindex (as Citizen)", "POST", "/api/v1/knowledge/admin/reindex", {})
auth_call("Audit Events (as Citizen)", "GET", "/api/v1/audit/events")

print("\n=== 4. Cleaning up Created Case (if created) ===")
if case_id:
    auth_call("Delete Case", "DELETE", f"/api/v1/cases/{case_id}")
