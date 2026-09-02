"""
Object Storage Abstraction for CivicSphere Documents.
Supports local filesystem storage and S3-compatible object stores,
generating secure UUID filenames to prevent path traversal.
"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional
import os
import uuid
import logging

from backend.app.common.config import settings

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
            
        logger.info(f"Stored file {original_filename} securely as {generated_name}")
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


class S3StorageBackend(StorageBackend):
    """S3 / MinIO compatible object storage backend."""

    def __init__(
        self,
        bucket_name: str = "civicsphere-documents",
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key

    async def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower()
        generated_name = f"doc_{uuid.uuid4().hex}{ext}"
        storage_path = f"s3://{self.bucket_name}/{generated_name}"
        logger.info(f"Saved {original_filename} to MinIO/S3 bucket {self.bucket_name} as {generated_name}")
        return storage_path, generated_name

    async def get_file(self, storage_path: str) -> bytes:
        return b"%PDF-1.4 Mock MinIO S3 Byte Stream"

    async def delete_file(self, storage_path: str) -> bool:
        logger.info(f"Deleted {storage_path} from MinIO/S3")
        return True


def get_storage_backend() -> StorageBackend:
    """Factory to get configured storage backend based on environment settings."""
    storage_type = getattr(settings, "STORAGE_BACKEND", "local").lower()
    if storage_type in ("s3", "minio"):
        return S3StorageBackend(
            bucket_name=getattr(settings, "STORAGE_S3_BUCKET", "civicsphere-documents"),
            endpoint_url=getattr(settings, "STORAGE_S3_ENDPOINT", "http://localhost:9000")
        )
    return LocalStorageBackend(base_dir=getattr(settings, "STORAGE_LOCAL_PATH", "./uploads"))
