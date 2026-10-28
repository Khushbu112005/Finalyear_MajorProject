with open('packages/schemas/contracts.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace LegalQuery query field
target1 = "class LegalQuery(BaseModel):\n    query: str\n    jurisdiction: str = \"IN\""
replacement1 = "class LegalQuery(BaseModel):\n    query: str = Field(..., min_length=3, max_length=2000, description=\"Plain language citizen legal query\")\n    jurisdiction: str = \"IN\""

if target1 in text:
    text = text.replace(target1, replacement1)
else:
    # Try CRLF
    target1_crlf = "class LegalQuery(BaseModel):\r\n    query: str\r\n    jurisdiction: str = \"IN\""
    replacement1_crlf = "class LegalQuery(BaseModel):\r\n    query: str = Field(..., min_length=3, max_length=2000, description=\"Plain language citizen legal query\")\r\n    jurisdiction: str = \"IN\""
    text = text.replace(target1_crlf, replacement1_crlf)

# Add how_it_may_help_or_steps to LegalAnswer
target2 = "what_you_may_consider_doing: List[str] = Field(default_factory=list, description=\"Actionable options to consider\")"
replacement2 = "what_you_may_consider_doing: List[str] = Field(default_factory=list, description=\"Actionable options to consider\")\n    how_it_may_help_or_steps: str = Field(default=\"\", description=\"Procedural action steps or procedural guidance\")"

if target2 in text:
    text = text.replace(target2, replacement2)

with open('packages/schemas/contracts.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated contracts.py successfully")
