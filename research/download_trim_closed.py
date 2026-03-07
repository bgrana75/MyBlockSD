#!/usr/bin/env python3
"""
Download and trim closed 311 data (2025+2026) for avg close time stats.
We only need: service_name, comm_plan_name, date_requested, date_closed, lat, lng
For computing: avg days to close per category per neighborhood
"""
import csv
import json
import io
import urllib.request
import sys

URLS = [
    ("Closed 2026", "https://seshat.datasd.org/get_it_done_reports/get_it_done_requests_closed_2026_datasd.csv"),
    ("Closed 2025", "https://seshat.datasd.org/get_it_done_reports/get_it_done_requests_closed_2025_datasd.csv"),
]

OUTPUT_FILE = "311_closed_trimmed.json"

all_items = []

for label, url in URLS:
    print(f"Downloading {label}...", flush=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MyBlock-Hackathon-Research/1.0"})
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            size_mb = len(raw) / (1024 * 1024)
            print(f"  Downloaded: {size_mb:.1f} MB", flush=True)
            
            text = raw.decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            
            count = 0
            skipped = 0
            for row in reader:
                lat = row.get("lat", "").strip()
                lng = row.get("lng", "").strip()
                date_req = row.get("date_requested", "").strip()
                date_closed = row.get("date_closed", "").strip()
                
                if not lat or not lng or not date_req or not date_closed:
                    skipped += 1
                    continue
                
                try:
                    lat_f = float(lat)
                    lng_f = float(lng)
                except ValueError:
                    skipped += 1
                    continue
                
                # Compute days to close
                try:
                    d_req = date_req[:10]
                    d_cls = date_closed[:10]
                    from datetime import datetime
                    days = (datetime.strptime(d_cls, "%Y-%m-%d") - datetime.strptime(d_req, "%Y-%m-%d")).days
                    if days < 0:
                        days = 0
                except:
                    days = None
                
                all_items.append({
                    "svc": row.get("service_name", "").strip(),
                    "lat": round(lat_f, 5),
                    "lng": round(lng_f, 5),
                    "nbr": row.get("comm_plan_name", "").strip(),
                    "days": days,
                })
                count += 1
            
            print(f"  Kept: {count}, Skipped: {skipped}", flush=True)
    except Exception as e:
        print(f"  ERROR downloading {label}: {e}", file=sys.stderr)

# Write output
with open(OUTPUT_FILE, "w") as f:
    json.dump(all_items, f, separators=(",", ":"))

file_size_mb = len(json.dumps(all_items, separators=(",", ":"))) / (1024 * 1024)

print(f"\n=== Closed Data Summary ===")
print(f"Total items: {len(all_items)}")
print(f"Output size: {file_size_mb:.1f} MB")

# Quick stats
if all_items:
    days_values = [i["days"] for i in all_items if i["days"] is not None]
    print(f"Avg days to close: {sum(days_values)/len(days_values):.1f}")
    print(f"Median days to close: {sorted(days_values)[len(days_values)//2]}")
    
    # Top categories
    from collections import Counter
    cats = Counter(i["svc"] for i in all_items)
    print(f"\nTop 10 categories in closed data:")
    for cat, cnt in cats.most_common(10):
        cat_days = [i["days"] for i in all_items if i["svc"] == cat and i["days"] is not None]
        avg = sum(cat_days)/len(cat_days) if cat_days else 0
        print(f"  {cat}: {cnt} items, avg {avg:.0f} days to close")
