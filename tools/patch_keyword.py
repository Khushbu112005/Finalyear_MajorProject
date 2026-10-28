with open("backend/app/knowledge/retrieval/keyword.py", "rb") as f:
    content = f.read()

target = b'''            # Score calculation
            score = 0.0
            for t in query_tokens:
                tf = token_counts.get(t, 0)
                if tf > 0:
                    score += 1.0 + math.log(1.0 + tf)

            # Exact section number boost
            if section_matches and chunk.section_number:
                for sm in section_matches:
                    if chunk.section_number.lower() == sm.lower():
                        score += 8.0  # Strong boost for exact statutory section hit

            # Act title boost
            if chunk.act_title and chunk.act_title.lower() in query_clean:
                score += 5.0'''

replacement = b'''            # Score calculation
            score = 0.0
            matched_tokens = 0
            for t in query_tokens:
                tf = token_counts.get(t, 0)
                if tf > 0:
                    matched_tokens += 1
                    score += 1.0 + math.log(1.0 + tf)

            has_section_hit = False
            # Exact section number boost
            if section_matches and chunk.section_number:
                for sm in section_matches:
                    if chunk.section_number.lower() == sm.lower():
                        score += 8.0  # Strong boost for exact statutory section hit
                        has_section_hit = True

            has_act_hit = False
            # Act title boost
            if chunk.act_title and chunk.act_title.lower() in query_clean:
                score += 5.0
                has_act_hit = True

            # If multi-word query has only 1 accidental token match and neither section nor act hit, discount
            if len(query_tokens) >= 3 and matched_tokens < 2 and not has_section_hit and not has_act_hit:
                score *= 0.25'''

if b"\r\n" in content:
    target = target.replace(b"\n", b"\r\n")
    replacement = replacement.replace(b"\n", b"\r\n")

assert target in content, "Target not found in keyword.py"
new_content = content.replace(target, replacement, 1)

with open("backend/app/knowledge/retrieval/keyword.py", "wb") as f:
    f.write(new_content)

print("Updated keyword.py successfully.")
