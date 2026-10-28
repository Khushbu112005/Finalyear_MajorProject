"""
Object Storage Abstraction for CivicSphere Documents.
Supports local filesystem storage (serverless-safe) and Supabase Storage (private bucket),
generating secure UUID filenames to prevent path traversal.
"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional, Dict
import os
import uuid
import logging
import mimetypes
import tempfile
import httpx

from backend.app.common.config import settings
from backend.app.common.errors import CivicSphereException

logger = logging.getLogger("civicsphere.documents.storage")


class StorageBackend(ABC):
    """Abstract interface for document file storage."""

    @abstractmethod
    async def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        """Saves file bytes and returns (storage_path, generated_filename)."""
        pass

    @abstractmethod
    async def get_file(self, storage_path: str) -> bytes:
        """Retrieves file bytes from storage path."""
        pass

    @abstractmethod
    async def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        pass


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend with automatic serverless writeable directory fallback."""

    def __init__(self, base_dir: Optional[str] = None):
        target = base_dir or getattr(settings, "STORAGE_LOCAL_PATH", "./uploads")
        try:
            abs_dir = os.path.abspath(target)
            os.makedirs(abs_dir, exist_ok=True)
            test_file = os.path.join(abs_dir, f".test_{uuid.uuid4().hex[:6]}")
            with open(test_file, "w") as f:
                f.write("ok")
            os.remove(test_file)
            self.base_dir = abs_dir
        except (OSError, PermissionError) as e:
            fallback_dir = os.path.join(tempfile.gettempdir(), "civicsphere_uploads")
            os.makedirs(fallback_dir, exist_ok=True)
            self.base_dir = fallback_dir
            logger.info(f"Target directory '{target}' is not writable ({e}); defaulted to '{fallback_dir}'")

    async def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower() or ".pdf"
        generated_name = f"doc_{uuid.uuid4().hex}{ext}"
        storage_path = os.path.join(self.base_dir, generated_name)

        try:
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        except (OSError, PermissionError):
            fallback_dir = os.path.join(tempfile.gettempdir(), "civicsphere_uploads")
            os.makedirs(fallback_dir, exist_ok=True)
            storage_path = os.path.join(fallback_dir, generated_name)
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
            self.base_dir = fallback_dir

        logger.info(f"Stored file {original_filename} locally as {generated_name}")
        return storage_path, generated_name

    async def get_file(self, storage_path: str) -> bytes:
        if not os.path.exists(storage_path):
            # Check temp fallback
            filename = os.path.basename(storage_path)
            temp_path = os.path.join(tempfile.gettempdir(), "civicsphere_uploads", filename)
            if os.path.exists(temp_path):
                storage_path = temp_path
            else:
                raise FileNotFoundError(f"Storage path {storage_path} not found.")
        with open(storage_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
        filename = os.path.basename(storage_path)
        temp_path = os.path.join(tempfile.gettempdir(), "civicsphere_uploads", filename)
        if os.path.exists(temp_path):
            os.remove(temp_path)
            return True
        return False


class SupabaseStorageBackend(StorageBackend):
    """
    Production Supabase Storage Provider.
    Interacts asynchronously via HTTPX with Supabase Storage REST API v1.
    Includes graceful serverless fallback if cloud storage is unconfigured or unavailable.
    """

    def __init__(
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
        self.timeout = timeout
        self.is_configured = True
        self._fallback_backend = LocalStorageBackend()

    def _headers(self, content_type: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_role_key}",
            "apikey": self.service_role_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _clean_path(self, storage_path: str) -> Tuple[str, str]:
        path = storage_path
        if path.startswith("supabase://"):
            path = path[len("supabase://"):]
        parts = path.split("/", 1)
        if len(parts) == 2 and parts[0] == self.bucket_name:
            return parts[0], parts[1]
        elif len(parts) == 2 and parts[0] != "":
            return parts[0], parts[1]
        return self.bucket_name, path.lstrip("/")

    async def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        if not self.is_configured:
            logger.warning("Supabase storage credentials unconfigured; storing in serverless temp directory.")
            return await self._fallback_backend.save_file(file_bytes, original_filename)

        ext = os.path.splitext(original_filename)[1].lower() or ".pdf"
        generated_name = f"doc_{uuid.uuid4().hex}{ext}"
        content_type, _ = mimetypes.guess_type(original_filename)
        if not content_type:
            content_type = "application/pdf" if ext == ".pdf" else "application/octet-stream"

        upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{generated_name}"
        headers = self._headers(content_type)
        headers["x-upsert"] = "true"

        try:
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
            )

        storage_path = f"supabase://{self.bucket_name}/{generated_name}"
        logger.info(f"Stored document {original_filename} securely in Supabase Storage as {generated_name}")
        return storage_path, generated_name

    async def get_file(self, storage_path: str) -> bytes:
        if not self.is_configured or not storage_path.startswith("supabase://"):
            return await self._fallback_backend.get_file(storage_path)

        bucket, filename = self._clean_path(storage_path)
        download_url = f"{self.supabase_url}/storage/v1/object/authenticated/{bucket}/{filename}"
        headers = self._headers()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(download_url, headers=headers)
                if resp.status_code == 404:
                    fallback_url = f"{self.supabase_url}/storage/v1/object/{bucket}/{filename}"
                    resp = await client.get(fallback_url, headers=headers)

                if resp.status_code == 404:
                    raise FileNotFoundError(f"Storage object {storage_path} not found.")
                if resp.status_code >= 400:
                    raise CivicSphereException(
                        code="STORAGE_DOWNLOAD_ERROR",
                        message=f"Failed to retrieve document from storage: HTTP {resp.status_code}",
                        status_code=502,
                    )
                return resp.content
        except (httpx.RequestError, FileNotFoundError):
            return await self._fallback_backend.get_file(storage_path)

    async def delete_file(self, storage_path: str) -> bool:
        if not self.is_configured or not storage_path.startswith("supabase://"):
            return await self._fallback_backend.delete_file(storage_path)

        bucket, filename = self._clean_path(storage_path)
        delete_url = f"{self.supabase_url}/storage/v1/object/{bucket}"
        headers = self._headers("application/json")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.request("DELETE", delete_url, headers=headers, json={"prefixes": [filename]})
                return resp.status_code < 400
        except Exception:
            return await self._fallback_backend.delete_file(storage_path)


def get_storage_backend() -> StorageBackend:
    """Factory to get configured storage backend based on environment settings."""
    storage_type = getattr(settings, "STORAGE_BACKEND", "local").lower()
    if storage_type == "supabase":
        supabase_url = getattr(settings, "SUPABASE_URL", None)
        service_role_key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
        if supabase_url and service_role_key:
            return SupabaseStorageBackend(
                supabase_url=supabase_url,
                service_role_key=service_role_key,
                bucket_name=getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents"),
            )
        logger.warning("STORAGE_BACKEND set to 'supabase' but credentials not configured; defaulting to serverless-safe local storage.")
    return LocalStorageBackend()
