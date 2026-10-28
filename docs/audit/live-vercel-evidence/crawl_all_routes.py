import urllib.request
import urllib.error
import re
import os
import json

BASE_WEB = "https://civicsphere-web.vercel.app"
ROUTES = [
    "/",
    "/legal",
    "/legal/acts",
    "/government",
    "/cases",
    "/documents",
    "/knowledge",
    "/agents",
    "/admin",
    "/admin/audit",
    "/admin/evaluation",
    "/admin/knowledge",
    "/admin/security",
    "/admin/sources",
    "/auth/login",
    "/auth/register",
    "/profile",
    "/settings"
]

out_dir = "docs/audit/live-vercel-evidence/routes"
chunks_dir = "docs/audit/live-vercel-evidence/chunks"
os.makedirs(out_dir, exist_ok=True)
os.makedirs(chunks_dir, exist_ok=True)

route_results = []
all_scripts = set()

for route in ROUTES:
    url = BASE_WEB + route
    print(f"Crawling {route} ({url})...", end=" ", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (CivicSphere-Audit-Agent/1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            content = resp.read().decode('utf-8', errors='ignore')
            safe_name = route.strip("/").replace("/", "_") or "homepage"
            fpath = os.path.join(out_dir, f"{safe_name}.html")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            
            # extract title
            title_m = re.search(r'<title[^>]*>([^<]+)</title>', content)
            title = title_m.group(1) if title_m else "N/A"
            
            # extract scripts
            scripts = re.findall(r'src="([^"]+\.js)"', content)
            for s in scripts:
                all_scripts.add(s)
            
            # check if 404 text is in title
            is_404 = "404" in title or "could not be found" in content
            
            print(f"Status: {status} | Title: {title} | 404: {is_404}")
            route_results.append({
                "route": route,
                "url": url,
                "status": 404 if is_404 else status,
                "title": title,
                "html_file": fpath,
                "is_404": is_404,
                "scripts_count": len(scripts)
            })
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code}")
        route_results.append({
            "route": route,
            "url": url,
            "status": e.code,
            "title": f"HTTP {e.code}",
            "html_file": None,
            "is_404": True if e.code == 404 else False,
            "scripts_count": 0
        })
    except Exception as e:
        print(f"Error: {e}")
        route_results.append({
            "route": route,
            "url": url,
            "status": 0,
            "title": "Error",
            "html_file": None,
            "is_404": False,
            "scripts_count": 0
        })

print(f"\nDownloading newly discovered JS chunks ({len(all_scripts)} total)...")
for s in sorted(all_scripts):
    fname = os.path.basename(s)
    target = os.path.join(chunks_dir, fname)
    if not os.path.exists(target):
        url = BASE_WEB + s
        try:
            urllib.request.urlretrieve(url, target)
            print(f" + Downloaded {fname}")
        except Exception as e:
            print(f" ! Failed {fname}: {e}")

with open("docs/audit/live-vercel-evidence/crawl_results.json", "w", encoding="utf-8") as f:
    json.dump(route_results, f, indent=2)

print("\nCrawl complete! Saved to docs/audit/live-vercel-evidence/crawl_results.json")
