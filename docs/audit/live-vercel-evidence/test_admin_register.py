import urllib.request
import urllib.error
import json

url = "https://civicsphere-backend.vercel.app/api/v1/auth/register"
payload = {
    "name": "Audit Test Admin",
    "email": "audit_test_admin_20261028@example.com",
    "password": "SecurePassword123!",
    "role": "ADMIN",
    "phone": "+919876543210"
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        print("Status:", resp.status)
        body = json.loads(resp.read().decode('utf-8'))
        print("Role returned:", body.get('data', {}).get('user', {}).get('role'))
        print("User data:", body.get('data', {}).get('user'))
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    body = e.read().decode('utf-8')
    print("Body:", body)
except Exception as e:
    print("Error:", e)
