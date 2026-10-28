with open("backend/tests/api/test_auth_api.py", "rb") as f:
    content = f.read()

target = b'''    # 1. Setup MFA
    setup_resp = client.post("/api/v1/auth/mfa/setup", cookies=cookies)'''

replacement = b'''    # 1. Setup MFA
    csrf_token = cookies.get("csrf_token")
    headers = {"X-CSRF-Token": csrf_token} if csrf_token else {}
    setup_resp = client.post("/api/v1/auth/mfa/setup", cookies=cookies, headers=headers)'''

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in test_auth_api.py"
new_content = content.replace(target, replacement, 1)

with open("backend/tests/api/test_auth_api.py", "wb") as f:
    f.write(new_content)

print("Updated test_auth_api.py successfully.")
