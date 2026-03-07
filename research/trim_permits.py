#!/usr/bin/env python3
"""Trim development permits CSV to compact JSON for MCP server.

Keeps only 2024+ permits with lat/lng.
Outputs compact JSON array with short field names.
"""
import csv
import json
import sys
from collections import Counter

INPUT = 'permits_set2_active.csv'
OUTPUT = 'permits_trimmed.json'

# Map long field names to short ones
FIELD_MAP = {
    'APPROVAL_ID': 'id',
    'APPROVAL_TYPE': 'type',
    'APPROVAL_STATUS': 'status',
    'ADDRESS_JOB': 'addr',
    'LAT_JOB': 'lat',
    'LNG_JOB': 'lng',
    'DATE_APPROVAL_CREATE': 'created',
    'DATE_APPROVAL_ISSUE': 'issued',
    'PROJECT_TITLE': 'title',
    'APPROVAL_SCOPE': 'scope',
    'APPROVAL_VALUATION': 'val',
}

# Simplify approval types for display
TYPE_MAP = {
    'Traffic Control Permit': 'Traffic Control',
    'No-Plan - Residential - Combination Mech/Elec/Plum': 'Residential MEP',
    'Transportation Permit': 'Transportation',
    'Combination Building Permit': 'Building (Combo)',
    'Approval - Construction - Electrical Pmt - PV Combo': 'Solar PV',
    'Traffic Control Plan-Permit': 'Traffic Control Plan',
    'Electrical Pmt': 'Electrical',
    'Building Permit': 'Building',
    'Approval - Construction - Right Of Way Pmt-Const Plan': 'Right-of-Way',
    'Approval - Construction - Electrical Pmt-PV Combo': 'Solar PV',
    'No-Plan - Nonresidential/Multifamily - Electrical': 'Commercial Electrical',
    'Photovoltaic - SB 379': 'Solar PV',
    'Approval - Process - Agreement': 'Agreement',
    'Mechanical Pmt': 'Mechanical',
    'Plumbing Pmt': 'Plumbing',
    'Construction Noise Permit': 'Construction Noise',
    'No-Plan - Nonresidential/Multifamily - Plumbing': 'Commercial Plumbing',
    'No-Plan - Nonresidential/Multifamily - Mechanical': 'Commercial Mechanical',
    'Approval - Construction - Sign Pmt': 'Sign',
    'Approval - Construction - Fire Pmt - Alarm': 'Fire Alarm',
}

# Simplify status
STATUS_MAP = {
    'Issued': 'I',
    'Cancelled': 'X',
    'Opened': 'O',
    'Inspection Followup': 'IF',
    'Cancelled Application Expired': 'XE',
    'Approved Upon Final Payment': 'AP',
    'Pending Invoice Payment': 'PI',
    'Closed': 'C',
    'Cancelled Utilization Not Met': 'XU',
    'Open': 'O',
    'Withdrawn': 'W',
}

results = []
skipped_no_geo = 0
skipped_old = 0

with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for row in reader:
        lat = row.get('LAT_JOB', '').strip()
        lng = row.get('LNG_JOB', '').strip()
        if not lat or not lng:
            skipped_no_geo += 1
            continue
        
        created = row.get('DATE_APPROVAL_CREATE', '')
        if not created or created < '2024':
            skipped_old += 1
            continue
        
        rec = {
            'id': row['APPROVAL_ID'],
            'type': TYPE_MAP.get(row['APPROVAL_TYPE'], row['APPROVAL_TYPE']),
            'st': STATUS_MAP.get(row['APPROVAL_STATUS'], row['APPROVAL_STATUS'][:2]),
            'addr': row['ADDRESS_JOB'],
            'lat': round(float(lat), 5),
            'lng': round(float(lng), 5),
            'dt': created[:10],  # just YYYY-MM-DD
        }
        
        # Optional fields (only include if non-empty)
        issued = row.get('DATE_APPROVAL_ISSUE', '')
        if issued:
            rec['iss'] = issued[:10]
        
        title = row.get('PROJECT_TITLE', '').strip()
        if title:
            rec['ttl'] = title[:100]  # cap at 100 chars
        
        val = row.get('APPROVAL_VALUATION', '').strip()
        if val and val != '0' and val != '0.00':
            try:
                rec['val'] = int(float(val))
            except:
                pass
        
        results.append(rec)

with open(OUTPUT, 'w') as f:
    json.dump(results, f, separators=(',', ':'))

print(f"Total kept: {len(results):,}")
print(f"Skipped (no geo): {skipped_no_geo:,}")
print(f"Skipped (pre-2024): {skipped_old:,}")

# File size
import os
size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
print(f"Output size: {size_mb:.1f} MB")

# Quick stats on output
types = Counter(r['type'] for r in results)
print(f"\nTop 10 types in trimmed data:")
for t, c in types.most_common(10):
    print(f"  {c:>6,}  {t}")
