"""Pack favicon.ico (16, 32 and 48 px) from the PNGs make-social-images.mjs renders.

Stored as classic BMP-encoded entries, the same choice as the main site: Safari/iOS decode
PNG-compressed .ico files unreliably, which shows as the tab icon failing to load.

    python3 tools/make-favicon.py
"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
sizes = {16: ROOT / "tools/.icon-16.png", 32: ROOT / "favicon-32.png", 48: ROOT / "tools/.icon-48.png"}
images = [Image.open(p).convert("RGBA") for p in sizes.values()]
images[-1].save(ROOT / "favicon.ico", format="ICO", sizes=[(s, s) for s in sizes],
                append_images=images[:-1], bitmap_format="bmp")
for p in (sizes[16], sizes[48]):
    p.unlink()
print("wrote favicon.ico")
