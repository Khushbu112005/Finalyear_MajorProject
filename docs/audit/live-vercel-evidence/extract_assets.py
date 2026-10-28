import re
import urllib.request
import os

with open('docs/audit/live-vercel-evidence/frontend_homepage.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'src="([^"]+\.js)"', html)
print(f"Found {len(scripts)} scripts:")
for s in scripts:
    print(" -", s)

links = re.findall(r'href="([^"]+)"', html)
routes = set()
for l in links:
    if l.startswith('/') and not l.startswith('/_next'):
        routes.add(l)
print(f"Found {len(routes)} internal routes in homepage HTML:")
for r in sorted(routes):
    print(" -", r)
