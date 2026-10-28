import urllib.request
import os
import re

base_url = "https://civicsphere-web.vercel.app"
chunks_dir = "docs/audit/live-vercel-evidence/chunks"
os.makedirs(chunks_dir, exist_ok=True)

with open('docs/audit/live-vercel-evidence/frontend_homepage.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'src="([^"]+\.js)"', html)
for s in scripts:
    filename = os.path.basename(s)
    local_path = os.path.join(chunks_dir, filename)
    url = base_url + s
    print(f"Downloading {url} -> {local_path}")
    try:
        urllib.request.urlretrieve(url, local_path)
    except Exception as e:
        print(f"Failed: {e}")

# Search inside all downloaded JS files for routes, API endpoints, fetch calls, backend URLs
print("\n--- Scanning JS bundles for API routes and endpoints ---")
api_patterns = set()
routes_found = set()
backend_urls = set()

for fname in os.listdir(chunks_dir):
    if not fname.endswith('.js'):
        continue
    fpath = os.path.join(chunks_dir, fname)
    with open(fpath, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # search for /api/
    for match in re.findall(r'["\'](/api/v1/[a-zA-Z0-9_\-/]+)["\']', content):
        api_patterns.add(match)
    
    # search for internal routes
    for match in re.findall(r'["\'](/(?:admin|agents|auth|cases|documents|government|knowledge|legal|profile|settings)[a-zA-Z0-9_\-/]*)["\']', content):
        routes_found.add(match)
        
    # search for backend URLs (e.g. vercel.app, localhost, env vars)
    for match in re.findall(r'https?://[a-zA-Z0-9_.\-]+(?::\d+)?', content):
        if 'w3.org' not in match and 'vercel.com' not in match:
            backend_urls.add(match)

print("\nAPI Endpoints found in frontend bundles:")
for a in sorted(api_patterns):
    print(" ", a)

print("\nRoutes found in frontend bundles:")
for r in sorted(routes_found):
    print(" ", r)

print("\nExternal/Backend URLs found in frontend bundles:")
for u in sorted(backend_urls):
    print(" ", u)
