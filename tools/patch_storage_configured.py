with open("backend/app/documents/services/storage.py", "rb") as f:
    content = f.read()

target = b'''        self.bucket_name = bucket_name or getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")
        self.timeout = timeout'''

replacement = b'''        self.bucket_name = bucket_name or getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")
        self.timeout = timeout
        self.is_configured = True
        self._fallback_backend = LocalStorageBackend()'''

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in storage.py"
new_content = content.replace(target, replacement, 1)

with open("backend/app/documents/services/storage.py", "wb") as f:
    f.write(new_content)

print("Updated storage.py successfully.")
