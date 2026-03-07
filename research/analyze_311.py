#!/usr/bin/env python3
"""Analyze 311 open data CSV for hackathon planning."""
import csv
import sys

def main():
    with open("311_open.csv") as f:
        r = csv.DictReader(f)
        rows = list(r)

    print(f"Total rows: {len(rows)}")
    print(f"Fields: {list(rows[0].keys())}")

    # Unique service names
    svc = {}
    for row in rows:
        s = row["service_name"]
        svc[s] = svc.get(s, 0) + 1
    print("\nTop 15 service names:")
    for name, count in sorted(svc.items(), key=lambda x: -x[1])[:15]:
        print(f"  {name}: {count}")

    # Unique neighborhoods
    nbr = set()
    for row in rows:
        if row["comm_plan_name"]:
            nbr.add(row["comm_plan_name"])
    print(f"\nUnique comm_plan_name values: {len(nbr)}")
    for n in sorted(nbr):
        print(f"  {n}")

    # How many have lat/lng?
    with_geo = sum(1 for r in rows if r["lat"] and r["lng"])
    print(f"\nWith lat/lng: {with_geo}/{len(rows)} ({100*with_geo/len(rows):.1f}%)")

    # Status values
    statuses = {}
    for row in rows:
        s = row["status"]
        statuses[s] = statuses.get(s, 0) + 1
    print(f"\nStatus values: {statuses}")

    # Date range
    dates = [row["date_requested"] for row in rows if row["date_requested"]]
    dates.sort()
    print(f"\nDate range: {dates[0]} to {dates[-1]}")

    # Estimate trimmed JSON size (keeping only essential fields)
    import json
    trimmed = []
    for row in rows:
        if row["lat"] and row["lng"]:
            trimmed.append({
                "id": int(row["service_request_id"]),
                "svc": row["service_name"],
                "st": row["status"],
                "lat": round(float(row["lat"]), 6),
                "lng": round(float(row["lng"]), 6),
                "dt": row["date_requested"][:10],
                "nb": row["comm_plan_name"],
            })
    size_bytes = len(json.dumps(trimmed))
    print(f"\nTrimmed JSON size estimate (with geo only): {size_bytes/1024/1024:.1f}MB ({len(trimmed)} items)")

if __name__ == "__main__":
    main()
