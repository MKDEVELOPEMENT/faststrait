#!/usr/bin/env python3
"""Stamp CSS/JS links in the HTML pages with a hash of each file's contents (?v=1a2b3c4d).

GitHub Pages serves assets with max-age=600, so after a deploy a browser can pair new HTML with an
old cached stylesheet. A new ?v= on every content change gives browsers a new URL to fetch.
Run from the project root before committing:  python3 tools/stamp-assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "partners.html", "privacy.html", "404.html"]
LINK = re.compile(r'((?:href|src)=")(/?assets/(?:css|js)/[\w.-]+?)(?:\?v=\w+)?"')


def version(rel):
    return hashlib.md5((ROOT / rel).read_bytes()).hexdigest()[:8]


for page in PAGES:
    path = ROOT / page
    html = path.read_text()
    stamped = LINK.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={version(m.group(2).lstrip("/"))}"', html)
    if stamped != html:
        path.write_text(stamped)
        print(f"stamped {page}")
