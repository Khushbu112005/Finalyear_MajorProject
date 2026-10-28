with open('apps/web/src/app/documents/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add import
old_import = 'import { api } from "@/lib/api-client";'
new_import = 'import { api } from "@/lib/api-client";\nimport { AuthGuard } from "@/components/AuthGuard";'
text = text.replace(old_import, new_import)

# Wrap return
old_return = '  return (\n    <div className="flex-1 max-w-7xl'
new_return = '  return (\n    <AuthGuard>\n    <div className="flex-1 max-w-7xl'
text = text.replace(old_return, new_return)

old_close = '    </div>\n  );\n}'
new_close = '    </div>\n    </AuthGuard>\n  );\n}'
text = text.replace(old_close, new_close)

with open('apps/web/src/app/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Wrapped documents page in AuthGuard")
