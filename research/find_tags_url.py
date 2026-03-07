#!/usr/bin/env python3
import sys, json
d = json.load(sys.stdin)
for ds in d.get('dataset', []):
    title = ds.get('title', '')
    if 'tag' in title.lower() and 'permit' in title.lower():
        print('TITLE:', title)
        for dist in ds.get('distribution', []):
            print('  URL:', dist.get('downloadURL', ''))
    if 'tag' in title.lower() and 'development' in title.lower():
        print('TITLE:', title)
        for dist in ds.get('distribution', []):
            print('  URL:', dist.get('downloadURL', ''))
