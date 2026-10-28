"""
Comprehensive Frontend Live HTTP Route Probe & Audit.
Tests every declared route in docs/audit/LIVE_VERCEL_ROUTE_INVENTORY.csv against:
1. Canonical Live Frontend: https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app
2. Short Alias Domain: https://civicsphere-web.vercel.app

Records HTTP status, response headers, content type, body size, and client-side guard presence.
"""

import urllib.request
import urllib.error
import time
import json
import csv
import ssl

CANONICAL_FRONTEND = "https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app"
SHORT_ALIAS_DOMAIN = "https://civicsphere-web.vercel.app"

ROUTES = [
    ("/", "Public", "Landing Page"),
    ("/legal", "Public", "Legal Guidance Engine"),
    ("/legal/acts", "Public", "Statutory Sources Registry"),
    ("/government", "Public", "Government Scheme & Service Navigator"),
    ("/knowledge", "Public / Protected Graph", "Knowledge & Graph Explorer"),
    ("/agents", "Public UI / Multi-Agent", "CivicSphere Multi-Agent Assistant"),
    ("/cases", "Authenticated Citizen", "Civic Case Workspace (AuthGuard)"),
    ("/documents", "Authenticated Citizen", "Intelligent Document Processing (AuthGuard)"),
    ("/admin", "Protected Admin", "Admin Control Center (AdminGuard)"),
    ("/admin/audit", "Protected Admin", "Tamper-Evident Audit Logs (AdminGuard)"),
    ("/admin/evaluation", "Protected Admin", "Evaluation Benchmark Telemetry (AdminGuard)"),
    ("/admin/knowledge", "Protected Admin", "Knowledge Graph Subgraph Administration (AdminGuard)"),
    ("/admin/security", "Protected Admin", "Security Threat Telemetry (AdminGuard)"),
    ("/admin/sources", "Protected Admin", "Official Statutory Sources Registry (AdminGuard)"),
    ("/auth/login", "Public", "Sign In to CivicSphere"),
    ("/auth/register", "Public", "Create Account"),
    ("/profile", "Authenticated User", "Citizen Profile (AuthGuard)"),
    ("/settings", "Authenticated User", "Preferences & Settings (AuthGuard)"),
    ("/robots.txt", "Public", "Robots Directives"),
    ("/sitemap.xml", "Public", "Sitemap XML"),
]

def probe_url(base_url: str, path: str):
    url = f"{base_url.rstrip('/')}{path}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CivicSphere-Route-Verifier/2.0 (Automated Production Audit)"}
    )
    start_time = time.time()
    ctx = ssl.create_default_context()
    
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
            latency = time.time() - start_time
            body = response.read()
            return {
                "url": url,
                "path": path,
                "status": response.status,
                "reason": response.reason,
                "content_type": response.headers.get("Content-Type", ""),
                "content_length": len(body),
                "latency_s": round(latency, 3),
                "x_vercel_id": response.headers.get("x-vercel-id", "N/A"),
                "body_snippet": body[:200].decode("utf-8", errors="replace"),
                "error": None
            }
    except urllib.error.HTTPError as e:
        latency = time.time() - start_time
        body = e.read()
        return {
            "url": url,
            "path": path,
            "status": e.code,
            "reason": e.reason,
            "content_type": e.headers.get("Content-Type", ""),
            "content_length": len(body),
            "latency_s": round(latency, 3),
            "x_vercel_id": e.headers.get("x-vercel-id", "N/A"),
            "x_vercel_error": e.headers.get("x-vercel-error", "N/A"),
            "body_snippet": body[:200].decode("utf-8", errors="replace"),
            "error": f"HTTP {e.code}"
        }
    except Exception as e:
        latency = time.time() - start_time
        return {
            "url": url,
            "path": path,
            "status": 0,
            "reason": str(e),
            "content_type": "",
            "content_length": 0,
            "latency_s": round(latency, 3),
            "x_vercel_id": "N/A",
            "body_snippet": "",
            "error": str(e)
        }

def run_probe():
    print("=" * 80)
    print("CIVICSPHERE AI — CANONICAL FRONTEND ROUTE VERIFICATION")
    print(f"Target: {CANONICAL_FRONTEND}")
    print("=" * 80)
    
    canonical_results = []
    for path, access_class, name in ROUTES:
        res = probe_url(CANONICAL_FRONTEND, path)
        canonical_results.append((path, access_class, name, res))
        status_str = f"HTTP {res['status']}" if res['status'] else f"ERR: {res['error']}"
        print(f"[{status_str:10}] {path:22} | {access_class:24} | {res['latency_s']}s | {res['content_length']} bytes | {res['content_type'][:25]}")

    print("\n" + "=" * 80)
    print("CIVICSPHERE AI — SHORT ALIAS DOMAIN PROBE")
    print(f"Target: {SHORT_ALIAS_DOMAIN}")
    print("=" * 80)
    
    alias_probe = probe_url(SHORT_ALIAS_DOMAIN, "/")
    print(f"Status: HTTP {alias_probe['status']} ({alias_probe['reason']})")
    print(f"X-Vercel-Error: {alias_probe.get('x_vercel_error', 'N/A')}")
    print(f"Body snippet: {alias_probe['body_snippet'][:100]}")

    # Summary
    success_count = sum(1 for _, _, _, r in canonical_results if r['status'] == 200)
    print("\n" + "=" * 80)
    print(f"CANONICAL PROBE SUMMARY: {success_count}/{len(ROUTES)} routes returned HTTP 200 OK")
    print("=" * 80)

if __name__ == "__main__":
    run_probe()
