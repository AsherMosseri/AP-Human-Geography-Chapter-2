"""Add a content-hash version to every local .css/.js link in the site's HTML.

Browsers and Cloudflare cache stylesheets and scripts for hours. Changing the
?v= value whenever a file changes forces them to fetch the new copy.

Run from the repo root after editing anything in assets/:
    python3 tools/version-assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
LINK = re.compile(r'((?:href|src)="([^"?#]+\.(?:css|js)))(?:\?v=[0-9a-f]+)?"')


def file_hash(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:10]


for page in ROOT.rglob("*.html"):
    if ".git" in page.parts or "tools" in page.parts:
        continue
    text = page.read_text()

    def add_version(match):
        ref = match.group(2)
        # Root paths (/assets/...) resolve from the repo root, which is the site root.
        target = (ROOT / ref.lstrip("/")) if ref.startswith("/") else (page.parent / ref).resolve()
        if not target.is_file():
            return match.group(0)
        return f'{match.group(1)}?v={file_hash(target)}"'

    new = LINK.sub(add_version, text)
    if new != text:
        page.write_text(new)
        print("updated", page.relative_to(ROOT))
