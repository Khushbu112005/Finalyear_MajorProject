import csv

input_path = "docs/audit/LIVE_VERCEL_FINDINGS.csv"
output_path = "docs/audit/LIVE_VERCEL_FINDINGS.csv"

rows = []
with open(input_path, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    for row in reader:
        if row:
            # Change status (last column) to RESOLVED
            row[-1] = "RESOLVED"
            rows.append(row)

with open(output_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Updated {len(rows)-1} findings in {output_path} to RESOLVED.")
