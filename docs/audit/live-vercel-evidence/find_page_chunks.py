import os, re

chunks_dir = "docs/audit/live-vercel-evidence/chunks"

pages = {
    "legal": ["Legal Guidance Engine", "statutory", "acts"],
    "government": ["Government Scheme", "eligibility", "citizen"],
    "cases": ["Civic Case Workspace", "createCase", "case_id"],
    "documents": ["Intelligent Document Processing", "upload", "Drag and drop"],
    "knowledge": ["Knowledge & Graph Explorer", "graph", "neighborhood"],
    "agents": ["CivicSphere Multi-Agent Assistant", "system_prompt", "agent"],
    "admin": ["Admin Control Center", "Tamper-Evident", "reindex"],
    "login": ["Sign in to CivicSphere", "login", "password"],
    "register": ["Create an Account", "register", "confirmPassword"],
}

found = {}
for p_name, terms in pages.items():
    found[p_name] = []
    for fname in os.listdir(chunks_dir):
        if not fname.endswith('.js'): continue
        path = os.path.join(chunks_dir, fname)
        with open(path, encoding='utf-8', errors='ignore') as f:
            content = f.read()
        score = sum(1 for t in terms if t.lower() in content.lower())
        if score >= 1:
            found[p_name].append((fname, score))

for p_name, files in found.items():
    sorted_files = sorted(files, key=lambda x: x[1], reverse=True)
    print(f"\n=== Page: {p_name} ===")
    for fname, score in sorted_files[:3]:
        print(f"  Matched {fname} (score {score})")
