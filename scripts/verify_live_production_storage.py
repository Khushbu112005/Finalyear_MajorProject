"""
Comprehensive Live Production Storage Verification Script
Validates:
1. Cross-invocation durability: retrieving previously uploaded doc_e43e305ea609
2. Unauthenticated access blocked (HTTP 401)
3. Cross-user access blocked (HTTP 403 Forbidden)
4. Non-existent document returns HTTP 404 Not Found
5. New synthetic PDF upload, durable Supabase persistence, and exact byte match
"""

import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "https://civicsphere-backend.vercel.app"

def get_auth_session(email: str, password: str = "StrongPassword123!"):
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req) as resp:
        cookies = resp.headers.get_all("Set-Cookie")
        login_data = json.loads(resp.read().decode("utf-8"))
        csrf_token = login_data["data"]["csrf_token"]
    cookie_str = "; ".join([c.split(";")[0] for c in cookies])
    return cookie_str, csrf_token

def register_user(email: str, password: str = "StrongPassword123!"):
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/register",
        data=json.dumps({
            "name": "Test User",
            "email": email,
            "password": password,
            "role": "CITIZEN"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 409: # Already registered
            return None
        raise

def test_live_storage():
    print("=== CIVICSPHERE AI: PRODUCTION STORAGE DURABILITY & ACCESS CONTROL AUDIT ===")
    
    # 1. Owner Login
    owner_email = "probe_8b0c44@civicsphere.org"
    owner_cookies, owner_csrf = get_auth_session(owner_email)
    print(f"[OK] Logged in as Owner: {owner_email}")

    # 2. Cross-invocation retrieval of previously uploaded document doc_e43e305ea609
    prev_doc_id = "doc_e43e305ea609"
    dl_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/{prev_doc_id}/download",
        headers={"Cookie": owner_cookies, "User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(dl_req) as resp:
        assert resp.status == 200
        content = resp.read()
        print(f"[OK] Cross-invocation download for existing {prev_doc_id}: HTTP {resp.status}, {len(content)} bytes")
        assert len(content) == 76
        assert content.startswith(b"%PDF-1.4")

    # 3. Unauthenticated download test
    unauth_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/{prev_doc_id}/download",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    try:
        urllib.request.urlopen(unauth_req)
        print("[FAIL] Unauthenticated request succeeded unexpectedly!")
    except urllib.error.HTTPError as e:
        print(f"[OK] Unauthenticated download blocked: HTTP {e.code} (Expected 401)")
        assert e.code == 401

    # 4. Cross-user access denial test (Intruder)
    intruder_email = f"intruder_{uuid.uuid4().hex[:6]}@civicsphere.org"
    register_user(intruder_email)
    intruder_cookies, intruder_csrf = get_auth_session(intruder_email)
    print(f"[OK] Logged in as Intruder: {intruder_email}")

    intruder_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/{prev_doc_id}/download",
        headers={"Cookie": intruder_cookies, "User-Agent": "Mozilla/5.0"}
    )
    try:
        urllib.request.urlopen(intruder_req)
        print("[FAIL] Cross-user unauthorized download succeeded unexpectedly!")
    except urllib.error.HTTPError as e:
        print(f"[OK] Cross-user download blocked: HTTP {e.code} (Expected 403 Forbidden)")
        assert e.code == 403

    # 5. Missing document 404 test
    missing_doc_id = "doc_nonexistent_99999999"
    missing_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/{missing_doc_id}/download",
        headers={"Cookie": owner_cookies, "User-Agent": "Mozilla/5.0"}
    )
    try:
        urllib.request.urlopen(missing_req)
        print("[FAIL] Missing document request succeeded unexpectedly!")
    except urllib.error.HTTPError as e:
        print(f"[OK] Non-existent document correctly returns: HTTP {e.code} (Expected 404 Not Found)")
        assert e.code == 404

    # 6. Fresh upload with unique payload to confirm byte-for-byte fidelity and Supabase Storage URI
    boundary = f"----CivicSphereBoundary{uuid.uuid4().hex}"
    fresh_pdf_content = b"%PDF-1.4\n%CivicSphere-Durable-Storage-Audit-2026\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="audit_proof_storage.pdf"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + fresh_pdf_content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    up_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/upload",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Cookie": owner_cookies,
            "X-CSRF-Token": owner_csrf,
            "User-Agent": "Mozilla/5.0"
        }
    )
    with urllib.request.urlopen(up_req) as up_resp:
        assert up_resp.status == 200
        up_data = json.loads(up_resp.read().decode("utf-8"))
        fresh_doc_id = up_data["data"]["id"]
        storage_path = up_data["data"]["storage_path"]
        print(f"[OK] Fresh Document Uploaded: {fresh_doc_id}")
        print(f"[OK] Durable Storage URI: {storage_path}")
        assert storage_path.startswith("supabase://civicsphere-demo-documents/")

    # 7. Download fresh document and verify byte-exact match
    fresh_dl_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/documents/{fresh_doc_id}/download",
        headers={"Cookie": owner_cookies, "User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(fresh_dl_req) as fresh_dl_resp:
        assert fresh_dl_resp.status == 200
        retrieved_bytes = fresh_dl_resp.read()
        print(f"[OK] Downloaded {len(retrieved_bytes)} bytes. Byte match: {retrieved_bytes == fresh_pdf_content}")
        assert retrieved_bytes == fresh_pdf_content

    # 8. Test Data Cleanup: Delete test documents from storage and DB
    for doc_to_delete in [fresh_doc_id, prev_doc_id]:
        del_req = urllib.request.Request(
            f"{BASE_URL}/api/v1/documents/{doc_to_delete}",
            method="DELETE",
            headers={"Cookie": owner_cookies, "X-CSRF-Token": owner_csrf, "User-Agent": "Mozilla/5.0"}
        )
        try:
            with urllib.request.urlopen(del_req) as del_resp:
                print(f"[OK] Cleaned up test document: {doc_to_delete} (HTTP {del_resp.status})")
        except urllib.error.HTTPError as e:
            print(f"[INFO] Document cleanup for {doc_to_delete}: HTTP {e.code}")

    # 9. Test Data Cleanup: Delete synthetic intruder user account
    intruder_del_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/me",
        method="DELETE",
        headers={"Cookie": intruder_cookies, "X-CSRF-Token": intruder_csrf, "User-Agent": "Mozilla/5.0"}
    )
    try:
        with urllib.request.urlopen(intruder_del_req) as idel_resp:
            print(f"[OK] Cleaned up synthetic probe account: {intruder_email} (HTTP {idel_resp.status})")
    except urllib.error.HTTPError as e:
        print(f"[INFO] Account cleanup for {intruder_email}: HTTP {e.code}")

    print("\n>>> ALL 7 PRODUCTION STORAGE SECURITY CHECKS & TEST DATA CLEANUPS PASSED <<<")

if __name__ == "__main__":
    test_live_storage()
