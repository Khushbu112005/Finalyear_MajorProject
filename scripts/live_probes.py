import urllib.request
import urllib.error
import json
import datetime

endpoints = [
    ('Backend Health', 'https://civicsphere-backend.vercel.app/health', 'GET', None),
    ('Backend Readiness', 'https://civicsphere-backend.vercel.app/api/v1/health/ready', 'GET', None),
    ('Government Services', 'https://civicsphere-backend.vercel.app/api/v1/government/services', 'GET', None),
    ('Legal Acts', 'https://civicsphere-backend.vercel.app/api/v1/legal/acts', 'GET', None),
    ('Legal Query - Empty', 'https://civicsphere-backend.vercel.app/api/v1/legal/query', 'POST', {'query': '', 'jurisdiction': 'IN'}),
    ('Legal Query - Supported', 'https://civicsphere-backend.vercel.app/api/v1/legal/query', 'POST', {'query': 'What is the penalty for failure to protect personal data under DPDP Act?', 'jurisdiction': 'IN'}),
    ('Legal Query - Unsupported', 'https://civicsphere-backend.vercel.app/api/v1/legal/query', 'POST', {'query': 'What are the Martian mining license regulations under Section 42 of the Asteroid Act?', 'jurisdiction': 'IN'}),
    ('Graph Neighborhood', 'https://civicsphere-backend.vercel.app/api/v1/knowledge/graph/neighborhood/test_entity?depth=1', 'GET', None),
    ('Frontend Home', 'https://civicsphere-web.vercel.app/', 'GET', None),
    ('Frontend Robots', 'https://civicsphere-web.vercel.app/robots.txt', 'GET', None),
    ('Frontend Sitemap', 'https://civicsphere-web.vercel.app/sitemap.xml', 'GET', None),
    ('Frontend Acts', 'https://civicsphere-web.vercel.app/legal/acts', 'GET', None),
]

for name, url, method, body in endpoints:
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    req = urllib.request.Request(url, method=method)
    if body:
        req.data = json.dumps(body).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            headers = dict(resp.headers)
            raw = resp.read()
            body_preview = raw[:200].decode('utf-8', errors='replace').replace('\n', ' ')
            csp = headers.get('content-security-policy') is not None
            x_frame = headers.get('x-frame-options')
            hsts = headers.get('strict-transport-security') is not None
            print(f"[{ts}] {name} ({url}) -> Status {resp.status}")
            print(f"   Headers: CSP={csp}, X-Frame={x_frame}, HSTS={hsts}")
            print(f"   Body: {body_preview[:120]}...\n")
    except urllib.error.HTTPError as e:
        body_preview = e.read()[:200].decode('utf-8', errors='replace').replace('\n', ' ')
        print(f"[{ts}] {name} ({url}) -> HTTPError {e.code}")
        print(f"   Body: {body_preview[:120]}...\n")
    except Exception as e:
        print(f"[{ts}] {name} ({url}) -> Failed: {e}\n")
