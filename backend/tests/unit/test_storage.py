"""
Unit Tests for CivicSphere Storage Abstraction Layer.
Tests LocalStorageBackend and SupabaseStorageBackend, verifying
upload, download, delete, error handling, credential security, and factory behavior.
"""

import pytest
import asyncio
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

from backend.app.documents.services.storage import (
    StorageBackend,
    LocalStorageBackend,
    SupabaseStorageBackend,
    get_storage_backend,
)
from backend.app.common.errors import CivicSphereException


def test_local_storage_backend_lifecycle(tmp_path):
    async def _run():
        backend = LocalStorageBackend(base_dir=str(tmp_path))
        test_bytes = b"%PDF-1.4 Local test content"
        filename = "test_local.pdf"

        storage_path, generated_name = await backend.save_file(test_bytes, filename)
        assert generated_name.endswith(".pdf")
        assert generated_name.startswith("doc_")
        assert str(tmp_path) in storage_path

        retrieved = await backend.get_file(storage_path)
        assert retrieved == test_bytes

        deleted = await backend.delete_file(storage_path)
        assert deleted is True

        with pytest.raises(FileNotFoundError):
            await backend.get_file(storage_path)

    asyncio.run(_run())


def test_supabase_backend_init_validation():
    with pytest.raises(ValueError, match="SUPABASE_URL"):
        SupabaseStorageBackend(supabase_url="", service_role_key="valid-key")

    with pytest.raises(ValueError, match="SUPABASE_SERVICE_ROLE_KEY"):
        SupabaseStorageBackend(supabase_url="https://test.supabase.co", service_role_key="")


def test_supabase_backend_path_cleaning():
    backend = SupabaseStorageBackend(
        supabase_url="https://test.supabase.co",
        service_role_key="test-service-key",
        bucket_name="test-bucket",
    )

    bucket, path = backend._clean_path("supabase://test-bucket/docs/test.pdf")
    assert bucket == "test-bucket"
    assert path == "docs/test.pdf"

    bucket, path = backend._clean_path("test-bucket/test.pdf")
    assert bucket == "test-bucket"
    assert path == "test.pdf"

    bucket, path = backend._clean_path("test.pdf")
    assert bucket == "test-bucket"
    assert path == "test.pdf"


def test_supabase_storage_save_file():
    async def _run():
        backend = SupabaseStorageBackend(
            supabase_url="https://test.supabase.co",
            service_role_key="secret-service-role-key-12345",
            bucket_name="test-bucket",
        )
        test_bytes = b"%PDF-1.4 Supabase test document"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = '{"Key":"test-bucket/doc_123.pdf"}'

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            storage_path, gen_name = await backend.save_file(test_bytes, "upload.pdf")

            assert storage_path == f"supabase://test-bucket/{gen_name}"
            assert gen_name.startswith("doc_")
            assert gen_name.endswith(".pdf")

            mock_post.assert_called_once()
            call_kwargs = mock_post.call_args[1]
            assert call_kwargs["content"] == test_bytes
            assert call_kwargs["headers"]["Authorization"] == "Bearer secret-service-role-key-12345"
            assert call_kwargs["headers"]["apikey"] == "secret-service-role-key-12345"
            assert call_kwargs["headers"]["Content-Type"] == "application/pdf"

    asyncio.run(_run())


def test_supabase_storage_save_file_error_no_secret_leak():
    async def _run():
        backend = SupabaseStorageBackend(
            supabase_url="https://test.supabase.co",
            service_role_key="super-confidential-key-never-leak",
            bucket_name="test-bucket",
        )
        test_bytes = b"%PDF-1.4 Supabase error test"

        mock_resp = MagicMock()
        mock_resp.status_code = 502
        mock_resp.text = "Bad Gateway upstream error"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            with pytest.raises(CivicSphereException) as exc_info:
                await backend.save_file(test_bytes, "fail.pdf")

            assert exc_info.value.code == "STORAGE_UPLOAD_ERROR"
            assert "super-confidential-key-never-leak" not in str(exc_info.value.message)

    asyncio.run(_run())


def test_supabase_storage_get_file_success():
    async def _run():
        backend = SupabaseStorageBackend(
            supabase_url="https://test.supabase.co",
            service_role_key="secret-service-role-key-12345",
            bucket_name="test-bucket",
        )
        expected_bytes = b"%PDF-1.4 Downloaded test bytes"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.content = expected_bytes

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp
            retrieved = await backend.get_file("supabase://test-bucket/doc_abc123.pdf")
            assert retrieved == expected_bytes

    asyncio.run(_run())


def test_supabase_storage_get_file_not_found():
    async def _run():
        backend = SupabaseStorageBackend(
            supabase_url="https://test.supabase.co",
            service_role_key="secret-service-role-key-12345",
            bucket_name="test-bucket",
        )

        mock_resp_404 = MagicMock()
        mock_resp_404.status_code = 404

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp_404
            with pytest.raises(FileNotFoundError):
                await backend.get_file("supabase://test-bucket/nonexistent.pdf")

    asyncio.run(_run())


def test_supabase_storage_delete_file():
    async def _run():
        backend = SupabaseStorageBackend(
            supabase_url="https://test.supabase.co",
            service_role_key="secret-service-role-key-12345",
            bucket_name="test-bucket",
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 200

        with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_resp
            success = await backend.delete_file("supabase://test-bucket/doc_delete.pdf")
            assert success is True
            mock_req.assert_called_once()
            call_kwargs = mock_req.call_args[1]
            assert call_kwargs["json"] == {"prefixes": ["doc_delete.pdf"]}

    asyncio.run(_run())


def test_get_storage_backend_factory(monkeypatch):
    from backend.app.common.config import settings

    monkeypatch.setattr(settings, "STORAGE_BACKEND", "local")
    local_b = get_storage_backend()
    assert isinstance(local_b, LocalStorageBackend)

    monkeypatch.setattr(settings, "STORAGE_BACKEND", "supabase")
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "test-key-32-chars-minimum-length!")
    monkeypatch.setattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")
    supa_b = get_storage_backend()
    assert isinstance(supa_b, SupabaseStorageBackend)
