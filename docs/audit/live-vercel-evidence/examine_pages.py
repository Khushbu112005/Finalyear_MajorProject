import os

def examine(fname, title, search_terms):
    path = os.path.join("docs/audit/live-vercel-evidence/chunks", fname)
    if not os.path.exists(path):
        print(f"File not found: {fname}")
        return
    with open(path, encoding='utf-8', errors='ignore') as f:
        text = f.read()
    print(f"\n=================== {title} ({fname}) ===================")
    for term in search_terms:
        idx = text.find(term)
        if idx != -1:
            start = max(0, idx - 100)
            end = min(len(text), idx + 350)
            print(f"--- Term: '{term}' at {idx} ---")
            print(text[start:end])
            print("...")

examine("3tsvfnr2rqszk.js", "Auth Forms (Login / Register)", ["handleSubmit", "login", "register", "token", "localStorage"])
examine("1b9i1m7rrmj49.js", "Admin Page", ["reindex", "admin", "sources", "audit", "security"])
examine("0w8xn-fy2qdwv.js", "Agents Page", ["chat", "messages", "sendMessage", "tools"])
examine("3-68p_wi-agcs.js", "Knowledge Page", ["graph", "nodes", "edges", "neighborhood", "sources"])
examine("0jrg-hbks7hvf.js", "Government Page", ["services", "analyze", "eligibility", "citizen", "problem"])
examine("3fmm9-0711g-f.js", "Cases Page", ["cases", "createCase", "title", "status", "unauthorized"])
examine("0j_37n32zpywz.js", "Documents Page", ["upload", "documents", "drop", "file"])
examine("2rniq8s3jci1j.js", "Legal Page", ["query", "acts", "confidence", "citations"])
