#!/usr/bin/env python3
"""
Aggregate closed 311 data into stats per neighborhood per category.
Output: { "NORTH PARK": { "Pothole": { "count": 150, "avgDays": 14 }, ... }, ... }
Much smaller than individual items.
"""
import json
from collections import defaultdict

with open("311_closed_trimmed.json") as f:
    items = json.load(f)

# Aggregate: neighborhood -> category -> { total_days, count }
stats = defaultdict(lambda: defaultdict(lambda: {"total_days": 0, "count": 0}))

for item in items:
    nbr = item.get("nbr", "").strip().upper()
    svc = item.get("svc", "").strip()
    days = item.get("days")
    
    if not nbr or not svc:
        continue
    
    stats[nbr][svc]["count"] += 1
    if days is not None:
        stats[nbr][svc]["total_days"] += days

# Convert to output format with avg days
output = {}
for nbr in sorted(stats.keys()):
    output[nbr] = {}
    for svc in sorted(stats[nbr].keys()):
        s = stats[nbr][svc]
        output[nbr][svc] = {
            "n": s["count"],
            "avg": round(s["total_days"] / s["count"]) if s["count"] > 0 else 0
        }

with open("311_closed_stats.json", "w") as f:
    json.dump(output, f, separators=(",", ":"))

file_size = len(json.dumps(output, separators=(",", ":"))) / 1024
print(f"Output: 311_closed_stats.json")
print(f"Size: {file_size:.0f} KB")
print(f"Neighborhoods: {len(output)}")
print(f"Total category entries: {sum(len(v) for v in output.values())}")

# Show a sample
sample_nbr = "NORTH PARK"
if sample_nbr in output:
    print(f"\nSample ({sample_nbr}):")
    for svc, data in sorted(output[sample_nbr].items(), key=lambda x: -x[1]["n"])[:10]:
        print(f"  {svc}: {data['n']} closed, avg {data['avg']} days")
