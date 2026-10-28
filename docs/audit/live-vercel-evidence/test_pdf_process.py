import urllib.request
import urllib.error
import io

# Minimal valid PDF content
pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"

boundary = "----WebKitFormBoundaryAuditProbe123456"
body = io.BytesIO()
body.write(f"--{boundary}\r\n".encode('utf-8'))
body.write(b'Content-Disposition: form-data; name="file"; filename="test_audit_notice.pdf"\r\n')
body.write(b"Content-Type: application/pdf\r\n\r\n")
body.write(pdf_content)
body.write(f"\r\n--{boundary}--\r\n".encode('utf-8'))

data = body.getvalue()

url = "https://civicsphere-backend.vercel.app/api/v1/document-processing/process"
req = urllib.request.Request(
    url,
    data=data,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    },
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=25) as resp:
        print("Status:", resp.status)
        print("Body:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
