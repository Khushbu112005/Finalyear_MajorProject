with open('apps/web/src/lib/types.ts', 'r', encoding='utf-8') as f:
    text = f.read()

target = """export interface LegalAct {
  id: string;
  act_id?: string;
  title: string;
  name?: string;
  year?: number;
  jurisdiction?: string;
  description?: string;
  sections_count?: number;
}"""

replacement = """export interface LegalAct {
  id?: string;
  act_id?: string;
  source_id?: string;
  title: string;
  name?: string;
  year?: number;
  jurisdiction?: string;
  description?: string;
  sections_count?: number;
  publisher?: string;
  official_url?: string;
  source_type?: string;
  verification_status?: string;
}"""

text = text.replace(target, replacement)

with open('apps/web/src/lib/types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated LegalAct in types.ts")
