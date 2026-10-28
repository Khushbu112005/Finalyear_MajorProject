with open("backend/app/main.py", "rb") as f:
    content = f.read()

target = b'''        exempt_paths = {
            f"{settings.API_PREFIX}/auth/login",
            f"{settings.API_PREFIX}/auth/register",
            f"{settings.API_PREFIX}/auth/mfa/verify",
            "/auth/login",
            "/auth/register",
            "/docs",
            "/openapi.json",
        }'''

replacement = b'''        exempt_paths = {
            f"{settings.API_PREFIX}/auth/login",
            f"{settings.API_PREFIX}/auth/register",
            f"{settings.API_PREFIX}/auth/logout",
            f"{settings.API_PREFIX}/auth/mfa/verify",
            "/auth/login",
            "/auth/register",
            "/auth/logout",
            "/docs",
            "/openapi.json",
        }'''

# Normalize target to match file's newline style
if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in backend/app/main.py"
new_content = content.replace(target, replacement, 1)

with open("backend/app/main.py", "wb") as f:
    f.write(new_content)

print("Updated backend/app/main.py successfully.")
