import urllib.request
import urllib.error
import http.cookiejar
import json
import io

BASE_URL = "https://civicsphere-backend.vercel.app"

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# 1. Login
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
        data = json.loads(resp.read().decode('utf-8'))
        csrf_token = data.get('data', {}).get('csrf_token')
        print("Logged in successfully. CSRF:", csrf_token[:10] if csrf_token else None)
except Exception as e:
    print("Login failed:", e)

# 2. Upload to /api/v1/documents/upload
pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"

boundary = "----WebKitFormBoundaryAuditProbe123456"
body = io.BytesIO()
body.write(f"--{boundary}\r\n".encode('utf-8'))
body.write(b'Content-Disposition: form-data; name="file"; filename="test_audit_document.pdf"\r\n')
body.write(b"Content-Type: application/pdf\r\n\r\n")
body.write(pdf_content)
body.write(f"\r\n--{boundary}--\r\n".encode('utf-8'))
data = body.getvalue()

headers = {
    "Content-Type": f"multipart/form-data; boundary={boundary}"
}
if csrf_token:
    headers["X-CSRF-Token"] = csrf_token

req = urllib.request.Request(f"{BASE_URL}/api/v1/documents/upload", data=data, headers=headers, method="POST")
try:
    with opener.open(req) as resp:
        print("Upload Status:", resp.status)
        print("Upload Body:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Upload HTTPError Status:", e.code)
    print("Upload Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Upload Error:", e)

# 3. Test /api/v1/document-processing/process
req2 = urllib.request.Request(f"{BASE_URL}/api/v1/document-processing/process", data=data, headers=headers, method="POST")
try:
    with opener.open(req2) as resp:
        print("Process Status:", resp.status)
        print("Process Body:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Process HTTPError Status:", e.code)
    print("Process Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Process Error:", e)
