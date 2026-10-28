with open('backend/app/knowledge/retrieval/evidence_pack.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace threshold line
old_threshold = "if lex_score < 2.0 and vec_score < 0.12 and grp_score == 0.0:"
new_threshold = "if lex_score < 1.0 and vec_score < 0.60 and grp_score == 0.0:"
text = text.replace(old_threshold, new_threshold)

# In _compute_confidence
old_calc = """        # Factors:
        # 1. Authority level of top item
        top_item = items[0]
        base_score = 0.50"""

new_calc = """        top_item = items[0]
        # LIVE-005: If top item has negligible relevance, fail safe to Insufficient
        if top_item.vector_score < 0.55 and top_item.lexical_score < 1.0 and top_item.graph_score == 0.0:
            return 0.0, "Insufficient"

        # Factors: Authority level and relevance
        base_score = 0.35 + (0.25 * min(1.0, max(top_item.vector_score, top_item.lexical_score / 5.0)))"""

text = text.replace(old_calc, new_calc)

with open('backend/app/knowledge/retrieval/evidence_pack.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated evidence_pack.py successfully")
