import urllib.request
import re

routes = ["/", "/legal", "/government", "/knowledge", "/agents", "/cases", "/documents", "/admin", "/auth/login", "/auth/register"]
base = "https://civicsphere-web.vercel.app"

print("=== Heading Hierarchy & Semantic Structure ===")
for r in routes:
    url = base + r
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
            h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
            h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.DOTALL)
            h3s = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.DOTALL)
            buttons_no_text = re.findall(r'<button[^>]*>\s*</button>', html)
            images_no_alt = re.findall(r'<img(?![^>]*alt=)[^>]*>', html)
            has_main = '<main' in html
            has_nav = '<nav' in html
            
            clean_h1s = [re.sub(r'<[^>]+>', '', h).strip() for h in h1s]
            print(f"\nRoute [{r}]:")
            print(f"  H1 count: {len(h1s)} ({clean_h1s[:1]})")
            print(f"  H2 count: {len(h2s)} | H3 count: {len(h3s)}")
            print(f"  <main> tag: {has_main} | <nav> tag: {has_nav}")
            if len(h1s) == 0:
                print("  [ACCESSIBILITY DEFECT]: Missing H1 heading!")
            elif len(h1s) > 1:
                print(f"  [ACCESSIBILITY WARNING]: Multiple H1 headings ({len(h1s)})!")
    except Exception as e:
        print(f"Error on {r}: {e}")
