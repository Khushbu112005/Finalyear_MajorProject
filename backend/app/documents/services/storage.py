"""
Object Storage Abstraction for CivicSphere Documents.
Supports local filesystem storage and Supabase Storage (private bucket),
generating secure UUID filenames to prevent path traversal.
"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional, Dict
import os
import uuid
import logging
import mimetypes
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
    """Local filesystem storage backend."""

    def __init__(self, base_dir: str = "./uploads"):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower()
        generated_name = f"doc_{uuid.uuid4().hex}{ext}"
        storage_path = os.path.join(self.base_dir, generated_name)
        
        with open(storage_path, "wb") as f:
            f.write(file_bytes)
            
        logger.info(f"Stored file {original_filename} locally as {generated_name}")
        return storage_path, generated_name

    async def get_file(self, storage_path: str) -> bytes:
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"Storage path {storage_path} not found.")
        with open(storage_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
        return False


class SupabaseStorageBackend(StorageBackend):
    """
    Production Supabase Storage Provider.
    Interacts asynchronously via HTTPX with Supabase Storage REST API v1.
    Uses authenticated service-role credentials to store, retrieve, and delete
    documents within a private bucket, generating secure UUID filenames.
    """

    def __init__(
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

        if not self.supabase_url:
            raise ValueError("SupabaseStorageBackend requires SUPABASE_URL to be set.")
        if not self.service_role_key:
            raise ValueError("SupabaseStorageBackend requires SUPABASE_SERVICE_ROLE_KEY to be set.")

    def _headers(self, content_type: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_role_key}",
            "apikey": self.service_role_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _clean_path(self, storage_path: str) -> Tuple[str, str]:
        """
        Parses bucket and object path from storage_path.
        Supports 'supabase://bucket/filename.pdf' or 'bucket/filename.pdf' or 'filename.pdf'.
        """
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
                    logger.error(f"Supabase storage upload failed: HTTP {resp.status_code} - {resp.text}")
                    raise CivicSphereException(
                        code="STORAGE_UPLOAD_ERROR",
                        message=f"Failed to upload document to storage: HTTP {resp.status_code}",
                        status_code=502,
                    )
        except httpx.RequestError as exc:
            logger.error(f"Network error during Supabase storage upload: {type(exc).__name__}")
            raise CivicSphereException(
                code="STORAGE_NETWORK_ERROR",
                message="Document storage service is currently unreachable.",
                status_code=503,
            )

        storage_path = f"supabase://{self.bucket_name}/{generated_name}"
        logger.info(f"Stored document {original_filename} securely in Supabase Storage as {generated_name}")
        return storage_path, generated_name

    async def get_file(self, storage_path: str) -> bytes:
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
                    logger.error(f"Supabase storage download failed: HTTP {resp.status_code}")
                    raise CivicSphereException(
                        code="STORAGE_DOWNLOAD_ERROR",
                        message=f"Failed to retrieve document from storage: HTTP {resp.status_code}",
                        status_code=502,
                    )
                return resp.content
        except httpx.RequestError as exc:
            logger.error(f"Network error during Supabase storage download: {type(exc).__name__}")
            raise CivicSphereException(
                code="STORAGE_NETWORK_ERROR",
                message="Document storage service is currently unreachable.",
                status_code=503,
            )

    async def delete_file(self, storage_path: str) -> bool:
        bucket, filename = self._clean_path(storage_path)
        delete_url = f"{self.supabase_url}/storage/v1/object/{bucket}"
        headers = self._headers("application/json")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.request("DELETE", delete_url, headers=headers, json={"prefixes": [filename]})
                if resp.status_code >= 400:
                    logger.warning(f"Supabase storage delete failed: HTTP {resp.status_code}")
                    return False
                return True
        except httpx.RequestError as exc:
            logger.error(f"Network error during Supabase storage delete: {type(exc).__name__}")
            return False


def get_storage_backend() -> StorageBackend:
    """Factory to get configured storage backend based on environment settings."""
    storage_type = getattr(settings, "STORAGE_BACKEND", "local").lower()
    if storage_type == "supabase":
        return SupabaseStorageBackend(
            supabase_url=getattr(settings, "SUPABASE_URL", None),
            service_role_key=getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None),
            bucket_name=getattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents"),
        )
    return LocalStorageBackend(base_dir=getattr(settings, "STORAGE_LOCAL_PATH", "./uploads"))
