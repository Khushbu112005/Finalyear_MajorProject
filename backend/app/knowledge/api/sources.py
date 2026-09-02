"""
Source Registry APIs.
Exposes endpoints to query verified sources, historical versions, and freshness metadata.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query

from packages.schemas.contracts import ApiResponse, VerificationStatus
from backend.app.common.security import AuthContext, get_current_user_context
from backend.app.knowledge.sources.registry import source_registry
from backend.app.knowledge.sources.freshness import FreshnessTracker

router = APIRouter(prefix="/knowledge", tags=["Source Registry"])


@router.get("/sources", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_sources(
    jurisdiction: Optional[str] = Query(default=None),
    status: Optional[VerificationStatus] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[List[Dict[str, Any]]]:
    """Lists registered civic knowledge sources."""
    sources = source_registry.list_sources(
        jurisdiction=jurisdiction,
        verification_status=status,
        limit=limit
    )

    data = []
    for s in sources:
        is_fresh, label, freshness_meta = FreshnessTracker.evaluate_freshness(s)
        s_dict = s.model_dump()
        s_dict["freshness_label"] = label
        s_dict["is_fresh"] = is_fresh
        data.append(s_dict)

    return ApiResponse(
        success=True,
        data=data
    )


@router.get("/sources/{source_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_source(
    source_id: str,
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[Dict[str, Any]]:
    """Retrieves detailed metadata, freshness, and verification status for a specific source."""
    source = source_registry.get_source(source_id)
    is_fresh, label, freshness_meta = FreshnessTracker.evaluate_freshness(source)
    
    data = source.model_dump()
    data["freshness"] = freshness_meta
    data["freshness_label"] = label

    return ApiResponse(
        success=True,
        data=data,
        sources=[{"source_id": source.source_id, "title": source.title, "url": source.official_url}]
    )


@router.get("/sources/{source_id}/versions", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_source_versions(
    source_id: str,
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[List[Dict[str, Any]]]:
    """Retrieves full immutable version history of a source."""
    versions = source_registry.get_versions(source_id)
    return ApiResponse(
        success=True,
        data=[v.model_dump() for v in versions]
    )


@router.post("/sources/{source_id}/refresh", response_model=ApiResponse[Dict[str, Any]])
async def refresh_source_endpoint(
    source_id: str,
    force: bool = Query(default=False),
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[Dict[str, Any]]:
    """Admin-only: On-demand live refresh of a specific knowledge source."""
    if auth.role not in ("admin", "knowledge_editor"):
        from backend.app.common.errors import ForbiddenException
        raise ForbiddenException("Live source refresh requires ADMIN or KNOWLEDGE_EDITOR privileges.")

    from backend.app.knowledge.sources.sync_worker import source_sync_worker
    result = await source_sync_worker.refresh_source(
        source_id=source_id,
        force=force,
        actor_id=auth.user_id
    )
    return ApiResponse(
        success=True,
        data=result
    )


@router.post("/sources/sync-all", response_model=ApiResponse[Dict[str, Any]])
async def sync_all_sources_endpoint(
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[Dict[str, Any]]:
    """Admin-only: Triggers a complete synchronization cycle across all registered sources."""
    if auth.role not in ("admin", "knowledge_editor"):
        from backend.app.common.errors import ForbiddenException
        raise ForbiddenException("Full source sync requires ADMIN or KNOWLEDGE_EDITOR privileges.")

    from backend.app.knowledge.sources.sync_worker import source_sync_worker
    summary = await source_sync_worker.refresh_all_sources(actor_id=auth.user_id)
    return ApiResponse(
        success=True,
        data=summary
    )


@router.get("/sources/sync/status", response_model=ApiResponse[Dict[str, Any]])
async def get_sync_status_endpoint(
    auth: AuthContext = Depends(get_current_user_context)
) -> ApiResponse[Dict[str, Any]]:
    """Retrieves live status and metrics for the continuous synchronization engine."""
    from backend.app.knowledge.sources.sync_worker import source_sync_worker
    status_data = source_sync_worker.get_sync_status()
    return ApiResponse(
        success=True,
        data=status_data
    )
