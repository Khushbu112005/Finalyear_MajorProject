with open("backend/app/knowledge/api/graph.py", "rb") as f:
    content = f.read()

target = b'''    # Try direct lookup, or lookup by entity name
    entity = graph_repository.get_entity(entity_id)
    if not entity:
        matches = graph_repository.find_entities_by_name(entity_id, limit=1)
        if matches:
            entity_id = matches[0].entity_id'''

replacement = b'''    # Try direct lookup, or lookup by entity name
    try:
        graph_repository.get_entity(entity_id)
    except Exception:
        matches = graph_repository.find_entities_by_name(entity_id, limit=1)
        if matches:
            entity_id = matches[0].entity_id'''

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in graph.py"
new_content = content.replace(target, replacement, 1)

with open("backend/app/knowledge/api/graph.py", "wb") as f:
    f.write(new_content)

print("Updated graph.py successfully.")
