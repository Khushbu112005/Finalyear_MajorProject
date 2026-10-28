with open("backend/app/legal/services/legal_engine.py", "rb") as f:
    content = f.read()

target = b'warnings=parsed.get("warnings", evidence_pack.warnings),'
replacement = b'warnings=parsed.get("warnings") or evidence_pack.warnings or ["Statutory limitation periods apply to appeals and grievance petitions.", "Consult official gazette notifications or legal counsel for court proceedings."],'

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in legal_engine.py"
new_content = content.replace(target, replacement, 1)

with open("backend/app/legal/services/legal_engine.py", "wb") as f:
    f.write(new_content)

print("Updated legal_engine.py successfully.")
