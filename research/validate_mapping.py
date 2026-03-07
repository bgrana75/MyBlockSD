#!/usr/bin/env python3
"""Validate neighborhood_mapping.json — check all SDPD neighborhoods are covered."""
import json

with open("neighborhood_mapping.json") as f:
    mapping = json.load(f)

# All SDPD neighborhoods from dispatch page
SDPD_ALL = {
    "ADAMS NORTH", "ALLIED GARDENS", "ALTA VISTA", "AZALEA/HOLLYWOOD PARK",
    "BALBOA PARK", "BARRIO LOGAN", "BAY HO", "BAY PARK", "BAY TERRACES",
    "BIRDLAND", "BLACK MOUNTAIN RANCH", "BORDER", "BROADWAY HEIGHTS",
    "BURLINGAME", "CARMEL MOUNTAIN", "CARMEL VALLEY", "CASTLE",
    "CHEROKEE POINT", "CHOLLAS CREEK", "CHOLLAS VIEW", "COLINA DEL SOL",
    "COLLEGE EAST", "COLLEGE WEST", "CORE-COLUMBIA", "CORRIDOR", "CORTEZ",
    "DEL CERRO", "DEL MAR HEIGHTS", "EAST VILLAGE", "EGGER HIGHLANDS",
    "EL CERRITO", "EMERALD HILLS", "ENCANTO", "FAIRMOUNT PARK",
    "FAIRMOUNT VILLAGE", "GASLAMP", "GOLDEN HILL", "GRANT HILL", "GRANTVILLE",
    "HARBORVIEW", "HILLCREST", "ISLENAIR", "JAMACHA LOMITA", "KEARNY MESA",
    "LA JOLLA", "LA PLAYA", "LAKE MURRAY", "LINCOLN PARK", "LINDA VISTA",
    "LITTLE ITALY", "LOGAN HEIGHTS", "LOMA PORTAL", "MARINA",
    "MIDTOWN", "MIDWAY DISTRICT", "MIRA MESA", "MIRAMAR",
    "MIRAMAR RANCH NORTH", "MORENA", "MOUNTAIN VIEW", "MT HOPE", "NESTOR",
    "NORMAL HEIGHTS", "NORTH CITY", "NORTH PARK",
    "O'FARRELL", "OAK PARK", "OCEAN BEACH", "OCEAN CREST", "OLD TOWN",
    "OTAY MESA", "OTAY MESA WEST", "PACIFIC BEACH", "PALM CITY",
    "PARADISE HILLS", "PARK WEST", "POINT LOMA HEIGHTS",
    "RANCHO BERNARDO", "RANCHO ENCANTADA", "RANCHO PENASQUITOS",
    "REDWOOD VILLAGE", "RIDGEVIEW/WEBSTER", "ROLANDO", "ROLANDO PARK",
    "ROSEVILLE / FLEET RIDGE", "SABRE SPRINGS", "SAN CARLOS", "SAN PASQUAL",
    "SAN YSIDRO", "SCRIPPS RANCH", "SERRA MESA", "SHELLTOWN",
    "SHERMAN HEIGHTS", "SKYLINE", "SORRENTO VALLEY", "SOUTH PARK",
    "SOUTHCREST", "SUNSET CLIFFS", "TALMADGE",
    "TERALTA EAST", "TERALTA WEST", "TIERRASANTA", "TIJUANA RIVER VALLEY",
    "TORREY HIGHLANDS", "TORREY PINES", "TORREY PRESERVE", "UNIVERSITY CITY",
    "UNIVERSITY HEIGHTS", "VALENCIA PARK", "WOODED AREA",
    "PETCO PARK", "QUALCOMM",
}

# Build reverse: SDPD neighborhood -> community plan
mapped_sdpd = set()
reverse = {}
for plan_name, sdpd_list in mapping.items():
    if plan_name.startswith("_"):
        continue
    for nbr in sdpd_list:
        if nbr in mapped_sdpd:
            print(f"  WARNING: '{nbr}' mapped to multiple plans! (duplicate in '{plan_name}')")
        mapped_sdpd.add(nbr)
        reverse[nbr] = plan_name

# SDPD neighborhoods not mapped to any community plan
unmapped = SDPD_ALL - mapped_sdpd
print(f"=== SDPD NEIGHBORHOODS NOT MAPPED ({len(unmapped)}) ===")
for n in sorted(unmapped):
    print(f"  {n}")

# Mapped neighborhoods not in SDPD list (typos?)
extra = mapped_sdpd - SDPD_ALL
print(f"\n=== IN MAPPING BUT NOT IN SDPD LIST ({len(extra)}) ===")
for n in sorted(extra):
    print(f"  {n}")

# Summary
print(f"\n=== SUMMARY ===")
print(f"Total SDPD neighborhoods: {len(SDPD_ALL)}")
print(f"Mapped to a community plan: {len(mapped_sdpd & SDPD_ALL)}")
print(f"Unmapped: {len(unmapped)}")
print(f"Community plans with no SDPD neighborhoods: ", end="")
empty_plans = [k for k, v in mapping.items() if not k.startswith("_") and len(v) == 0]
print(f"{len(empty_plans)}: {', '.join(sorted(empty_plans))}")

# Print the reverse lookup for reference
print(f"\n=== REVERSE LOOKUP (SDPD → 311 Community Plan) ===")
for nbr in sorted(reverse.keys()):
    print(f"  {nbr} → {reverse[nbr]}")
