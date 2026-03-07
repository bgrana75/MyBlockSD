#!/usr/bin/env python3
"""Compare 311 neighborhood names (comm_plan_name) with SDPD neighborhood names."""

# SDPD neighborhoods from the dispatch page dropdown
SDPD_NEIGHBORHOODS = [
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
]

import csv

# Load 311 neighborhoods
with open("311_open.csv") as f:
    r = csv.DictReader(f)
    nbr_311 = set()
    for row in r:
        if row["comm_plan_name"]:
            nbr_311.add(row["comm_plan_name"].upper())

sdpd_set = set(n.upper() for n in SDPD_NEIGHBORHOODS)

# Exact matches
exact = nbr_311 & sdpd_set
print(f"=== EXACT MATCHES ({len(exact)}) ===")
for n in sorted(exact):
    print(f"  {n}")

# In 311 but not SDPD
only_311 = nbr_311 - sdpd_set
print(f"\n=== IN 311 BUT NOT SDPD ({len(only_311)}) ===")
for n in sorted(only_311):
    print(f"  {n}")

# In SDPD but not 311
only_sdpd = sdpd_set - nbr_311
print(f"\n=== IN SDPD BUT NOT 311 ({len(only_sdpd)}) ===")
for n in sorted(only_sdpd):
    print(f"  {n}")
