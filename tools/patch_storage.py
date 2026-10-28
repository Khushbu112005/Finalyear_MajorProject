# Update storage.py
with open("backend/app/documents/services/storage.py", "rb") as f:
    content = f.read()

target = b'''    def __init__(
        self,
        supabase_url: Optional[str] = None,
        service_role_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.supabase_url = (supabase_url or getattr(settings, "SUPABASE_URL", "") or "").rstrip("/")
        self.service_role_key = service_role_key or getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "") or ""
        self.bucket_name = bucket_name or getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")
        self.timeout = timeout
        self.is_configured = bool(self.supabase_url and self.service_role_key)
        self._fallback_backend = LocalStorageBackend()'''

replacement = b'''    def __init__(
        self,
        supabase_url: Optional[str] = None,
        service_role_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
        timeout: float = 30.0,
    ):
        raw_url = supabase_url if supabase_url is not None else getattr(settings, "SUPABASE_URL", "")
        raw_key = service_role_key if service_role_key is not None else getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        if not raw_url:
            raise ValueError("SUPABASE_URL is required for SupabaseStorageBackend")
        if not raw_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY is required for SupabaseStorageBackend")
        self.supabase_url = raw_url.rstrip("/")
        self.service_role_key = raw_key
        self.bucket_name = bucket_name or getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")
        self.timeout = timeout'''

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target init not found in storage.py"
content = content.replace(target, replacement, 1)

target_save = b'''        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(upload_url, headers=headers, content=file_bytes)
                if resp.status_code >= 400:
                    logger.warning(f"Supabase storage upload returned HTTP {resp.status_code}; falling back to serverless local storage.")
                    return await self._fallback_backend.save_file(file_bytes, original_filename)
        except Exception as exc:
            logger.warning(f"Supabase storage error ({type(exc).__name__}); falling back to serverless local storage.")
            return await self._fallback_backend.save_file(file_bytes, original_filename)'''

replacement_save = b'''        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(upload_url, headers=headers, content=file_bytes)
                if resp.status_code >= 400:
                    raise CivicSphereException(
                        code="STORAGE_UPLOAD_ERROR",
                        message=f"Failed to upload document to Supabase Storage: HTTP {resp.status_code}",
                        status_code=502
                    )
        except CivicSphereException:
            raise
        except Exception as exc:
            raise CivicSphereException(
                code="STORAGE_UPLOAD_ERROR",
                message=f"Supabase storage connection failed: {type(exc).__name__}",
                status_code=502
            )'''

if b"\r\n" in content:
    target_save = target_save.replace(b"\n", b"\r\n")
    replacement_save = replacement_save.replace(b"\n", b"\r\n")

assert target_save in content, "Target save not found in storage.py"
content = content.replace(target_save, replacement_save, 1)

with open("backend/app/documents/services/storage.py", "wb") as f:
    f.write(content)

print("Updated storage.py successfully.")

# Update pipeline.py to handle fallback
with open("backend/app/documents/services/pipeline.py", "rb") as f:
    p_content = f.read()

p_target = b'''        # Save to storage
        storage_path, generated_filename = await storage.save_file(file_bytes, original_filename)'''

p_replacement = b'''        # Save to storage (with serverless fallback)
        try:
            storage_path, generated_filename = await storage.save_file(file_bytes, original_filename)
        except Exception as e:
            logger.warning(f"Primary storage backend failed ({e}); falling back to local serverless temp storage.")
            from backend.app.documents.services.storage import LocalStorageBackend
            storage_path, generated_filename = await LocalStorageBackend().save_file(file_bytes, original_filename)'''

if b"\r\n" in p_content:
    p_target = p_target.replace(b"\n", b"\r\n")
    p_replacement = p_replacement.replace(b"\n", b"\r\n")

assert p_target in p_content, "p_target not found in pipeline.py"
p_content = p_content.replace(p_target, p_replacement, 1)

with open("backend/app/documents/services/pipeline.py", "wb") as f:
    f.write(p_content)

print("Updated pipeline.py successfully.")
