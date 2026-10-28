import json

with open('docs/audit/live-vercel-evidence/backend_openapi.json', encoding='utf-8') as f:
    data = json.load(f)

print('Title:', data.get('info', {}).get('title'))
print('Version:', data.get('info', {}).get('version'))
print('Description:', data.get('info', {}).get('description'))
paths = data.get('paths', {})
print(f'Total endpoints: {len(paths)}')
for p, methods in sorted(paths.items()):
    for m, details in methods.items():
        summary = details.get('summary', '')
        op_id = details.get('operationId', '')
        tags = ','.join(details.get('tags', []))
        print(f'{m.upper():6} {p:45} [{tags}] {summary}')
