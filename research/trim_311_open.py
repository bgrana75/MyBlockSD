#!/usr/bin/env python3
"""
Trim 311 open requests CSV into a compact JSON file for the hackathon backend.
Keeps only: id, service_name, status, lat, lng, date_requested (date only), comm_plan_name
Filters: only rows with lat/lng
Output: 311_open_trimmed.json
"""
import csv
import json
from datetime import datetime

INPUT_FILE = "311_open.csv"
OUTPUT_FILE = "311_open_trimmed.json"

items = []
skipped_no_geo = 0
skipped_old = 0

# Only keep items from last 3 years (for a manageable file size)
cutoff_date = "2023-01-01"

with open(INPUT_FILE) as f:
    for row in csv.DictReader(f):
        lat = row.get("lat", "").strip()
        lng = row.get("lng", "").strip()
        
        if not lat or not lng:
            skipped_no_geo += 1
            continue
        
        try:
            lat_f = float(lat)
            lng_f = float(lng)
        except ValueError:
            skipped_no_geo += 1
            continue
        
        # Filter old items
        date_req = row.get("date_requested", "").strip()
        if date_req and date_req < cutoff_date:
            skipped_old += 1
            continue
        
        items.append({
            "id": row.get("service_request_id", "").strip(),
            "svc": row.get("service_name", "").strip(),
            "st": row.get("status", "").strip()[:1],  # "I" for In Process, "N" for New
            "lat": round(lat_f, 5),  # ~1m precision, saves bytes
            "lng": round(lng_f, 5),
            "dt": date_req[:10] if date_req else "",  # date only, no time
            "nbr": row.get("comm_plan_name", "").strip(),
            "age": int(row.get("case_age_days", "0") or "0"),
        })

# Sort by date descending (newest first)
items.sort(key=lambda x: x["dt"], reverse=True)

with open(OUTPUT_FILE, "w") as f:
    json.dump(items, f, separators=(",", ":"))  # compact, no spaces

file_size_mb = len(json.dumps(items, separators=(",", ":"))) / (1024 * 1024)

print(f"=== 311 Open Data Trimming Results ===")
print(f"Input rows total: {len(items) + skipped_no_geo + skipped_old}")
print(f"Kept (with geo, after {cutoff_date}): {len(items)}")
print(f"Skipped (no geo): {skipped_no_geo}")
print(f"Skipped (before {cutoff_date}): {skipped_old}")
print(f"Output file: {OUTPUT_FILE}")
print(f"Output size: {file_size_mb:.1f} MB")
print(f"Sample item: {json.dumps(items[0], indent=2) if items else 'none'}")
