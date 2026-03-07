#!/usr/bin/env python3
"""Profile the development permits CSV to understand data shape for trimming."""
import csv
import sys
from collections import Counter
from datetime import datetime

fname = sys.argv[1] if len(sys.argv) > 1 else 'permits_set2_active.csv'

rows = 0
types = Counter()
statuses = Counter()
years = Counter()
has_lat = 0
has_addr = 0
min_date = None
max_date = None

with open(fname, 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows += 1
        types[row.get('APPROVAL_TYPE', '')] += 1
        statuses[row.get('APPROVAL_STATUS', '')] += 1
        
        dt = row.get('DATE_APPROVAL_CREATE', '')
        if dt:
            yr = dt[:4]
            years[yr] += 1
            if min_date is None or dt < min_date:
                min_date = dt
            if max_date is None or dt > max_date:
                max_date = dt
        
        lat = row.get('LAT_JOB', '')
        if lat and lat.strip():
            has_lat += 1
        addr = row.get('ADDRESS_JOB', '')
        if addr and addr.strip():
            has_addr += 1

print(f"Total rows: {rows:,}")
print(f"Has lat/lng: {has_lat:,} ({100*has_lat/rows:.1f}%)")
print(f"Has address: {has_addr:,} ({100*has_addr/rows:.1f}%)")
print(f"\nDate range: {min_date} to {max_date}")
print(f"\nTop 20 approval types:")
for t, c in types.most_common(20):
    print(f"  {c:>6,}  {t}")
print(f"\nStatuses:")
for s, c in statuses.most_common():
    print(f"  {c:>6,}  {s}")
print(f"\nRows by year (recent):")
for yr in sorted(years.keys()):
    if yr >= '2022':
        print(f"  {yr}: {years[yr]:,}")
