"""Document Processing API package."""

from backend.app.document_processing.api.upload import router as upload_router

__all__ = [
    "upload_router",
]
