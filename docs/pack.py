"""Packs the docs into self-contained HTML files (images embedded) for sharing.

Run:  python3 docs/pack.py
Output (docs/):  client-feedback-v2.html · design-recommendation.html · yoga-zen-tonic-wireframe.html
"""
import base64
import mimetypes
import re
import shutil
from pathlib import Path

DOCS = Path(__file__).parent

LINKS = {  # folder links -> standalone siblings
    "../client-feedback-v2/index.html": "client-feedback-v2.html",
    "../design-recommendation/index.html": "design-recommendation.html",
    "../wireframe/index.html": "yoga-zen-tonic-wireframe.html",
}


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def pack(folder, out):
    src = DOCS / folder / "index.html"
    html = src.read_text(encoding="utf-8")
    # links that only open a local image full-size would duplicate it: drop the href
    html = re.sub(r'<a href="img/[^"]+">', "<a>", html)
    html = re.sub(
        r'src="(img/[^"]+)"',
        lambda m: f'src="{data_uri(DOCS / folder / m.group(1))}"',
        html,
    )
    # embedded images are already in the file; lazy-loading them only delays rendering
    html = re.sub(r'(<img src="data:[^"]+"[^>]*?) loading="lazy"', r"\1", html)
    for a, b in LINKS.items():
        html = html.replace(f'href="{a}', f'href="{b}')
    (DOCS / out).write_text(html, encoding="utf-8")
    print(f"{out}: {(DOCS / out).stat().st_size / 1e6:.1f} MB")


pack("client-feedback-v2", "client-feedback-v2.html")
pack("design-recommendation", "design-recommendation.html")
shutil.copy(DOCS / "wireframe" / "yoga-zen-tonic-wireframe.html", DOCS / "yoga-zen-tonic-wireframe.html")
print("yoga-zen-tonic-wireframe.html: copied")
