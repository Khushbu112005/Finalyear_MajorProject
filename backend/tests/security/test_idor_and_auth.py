"""
Security Tests: Authorization & IDOR Defenses.
"""

import pytest
from backend.app.common.security import AuthContext, check_object_ownership
from backend.app.common.errors import ForbiddenException


def test_idor_protection_blocks_other_user_resource():
    citizen_auth = AuthContext(user_id="usr_citizen_1", email="c1@test.org", role="citizen")

    # Accessing own resource -> PASS
    check_object_ownership(citizen_auth, resource_owner_id="usr_citizen_1", resource_type="document")

    # Accessing another user's private resource -> FORBIDDEN
    with pytest.raises(ForbiddenException):
        check_object_ownership(citizen_auth, resource_owner_id="usr_victim_2", resource_type="document")


def test_admin_bypass_for_maintenance():
    admin_auth = AuthContext(user_id="usr_admin_1", email="admin@test.org", role="admin")
    # Admin can inspect any resource
    check_object_ownership(admin_auth, resource_owner_id="usr_victim_2", resource_type="document")


def test_restricted_agent_tool_denies_unauthenticated_invocation():
    """Verify that an unauthenticated caller (auth=None) cannot invoke tools with required_roles."""
    import asyncio
    from backend.app.agents.core.tools import ToolRegistry, AgentTool
    from backend.app.common.errors import SecurityBlockedException

    async def _run():
        registry = ToolRegistry()
        called = False

        async def sensitive_handler(params, auth):
            nonlocal called
            called = True
            return {"status": "executed"}

        registry.register(AgentTool(
            name="admin_purge_records",
            description="Admin-only database purging tool.",
            parameters_schema={"scope": "string"},
            handler=sensitive_handler,
            required_roles=["ADMIN"]
        ))

        # Calling without auth must be blocked
        with pytest.raises(SecurityBlockedException, match="Authentication required"):
            await registry.execute_tool("admin_purge_records", {"scope": "all"}, auth=None)

        assert called is False

    asyncio.run(_run())


def test_public_registration_blocks_admin_role_escalation_in_production(monkeypatch):
    """Verify that attempting to self-assign ADMIN role during public registration in production is blocked."""
    import asyncio
    import uuid
    from backend.app.common.config import settings
    from backend.app.auth.services import register_user
    from backend.app.common.database import get_db_session
    from backend.app.common.errors import CivicSphereException

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    async def _run():
        async for session in get_db_session():
            with pytest.raises(CivicSphereException) as exc_info:
                await register_user(
                    session=session,
                    email=f"attacker_{uuid.uuid4().hex[:6]}@malicious.org",
                    name="Malicious Actor",
                    password="AttackerPassword_2026!",
                    role="ADMIN"
                )
            assert exc_info.value.code == "PRIVILEGE_ESCALATION_BLOCKED"
            assert exc_info.value.status_code == 403
            break

    asyncio.run(_run())


def test_security_context_blocks_spoofed_headers_in_production(monkeypatch):
    """Verify that get_current_user_context rejects spoofed headers when ENVIRONMENT is production."""
    from unittest.mock import MagicMock
    from backend.app.common.config import settings
    from backend.app.common.security import get_current_user_context
    from backend.app.common.errors import UnauthorizedException

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    mock_request = MagicMock()
    mock_request.headers = {
        "X-User-Id": "usr_fake_admin",
        "X-User-Role": "admin"
    }
    mock_request.cookies = {}

    with pytest.raises(UnauthorizedException, match="Authentication credentials required"):
        get_current_user_context(mock_request)


def test_security_context_authenticates_signed_jwt():
    """Verify that get_current_user_context extracts cryptographically signed user and role from JWT."""
    from unittest.mock import MagicMock
    from backend.app.common.security import get_current_user_context
    from backend.app.auth.services import create_access_token

    token = create_access_token(user_id="usr_verified_42", role="RESEARCHER")

    mock_request = MagicMock()
    mock_request.headers = {"Authorization": f"Bearer {token}"}
    mock_request.cookies = {}

    context = get_current_user_context(mock_request)
    assert context.user_id == "usr_verified_42"
    assert context.role == "researcher"

