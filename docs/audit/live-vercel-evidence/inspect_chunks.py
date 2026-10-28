import os
import re

chunks_dir = "docs/audit/live-vercel-evidence/chunks"
print(f"Total chunks: {len(os.listdir(chunks_dir))}")

# Check for mock embeddings, mock LLM, mock data
keywords = ["mock", "dummy", "fallback", "simulation", "openai", "gemini", "anthropic", "groq", "supabase", "postgres"]
found_keywords = {k: [] for k in keywords}

for fname in os.listdir(chunks_dir):
    if not fname.endswith('.js'): continue
    path = os.path.join(chunks_dir, fname)
    with open(path, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for kw in keywords:
        matches = re.findall(rf'(\b[a-zA-Z0-9_]*{kw}[a-zA-Z0-9_]*\b)', content, re.IGNORECASE)
        if matches:
            unique_matches = set(matches)
            found_keywords[kw].append((fname, list(unique_matches)[:5]))

print("\n--- Keyword occurrences in chunks ---")
for kw, occurrences in found_keywords.items():
    print(f"\nKeyword [{kw}]: ({len(occurrences)} files)")
    for fname, sample in occurrences[:3]:
        print(f"  {fname}: {sample}")
