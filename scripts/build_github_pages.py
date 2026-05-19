"""
Render this Flask app to static HTML under docs/ for GitHub Pages.

Project sites are served from https://<user>.github.io/<repo>/, so pass the repo
path as the SCRIPT_NAME prefix (e.g. --base /OOD_Demo). In GitHub Actions,
GITHUB_PAGES_BASE is set to /${{ github.event.repository.name }} automatically.

Usage:
  python scripts/build_github_pages.py --base /OOD_Demo
  python scripts/build_github_pages.py   # uses GITHUB_PAGES_BASE env, or no prefix
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

# Repo root (parent of scripts/)
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.chdir(ROOT)

from app import app  # noqa: E402

# Flask route path -> output path under docs/
EXPORTED_ROUTES: list[tuple[str, Path]] = [
    ("/", Path("index.html")),
    ("/jupyter", Path("jupyter", "index.html")),
    ("/files", Path("files", "index.html")),
    ("/job-status", Path("job-status", "index.html")),
    ("/partition-usage", Path("partition-usage", "index.html")),
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build static site into docs/ for GitHub Pages.")
    p.add_argument(
        "--base",
        default=os.environ.get("GITHUB_PAGES_BASE", ""),
        help="Path prefix for project Pages, e.g. /OOD_Demo (leading slash, no trailing slash).",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    base = (args.base or "").strip()
    if base.endswith("/"):
        base = base.rstrip("/")
    if base and not base.startswith("/"):
        base = "/" + base

    docs = ROOT / "docs"
    if docs.exists():
        shutil.rmtree(docs)
    docs.mkdir(parents=True)

    static_src = ROOT / "static"
    static_dst = docs / "static"
    if static_src.is_dir():
        shutil.copytree(static_src, static_dst)

    (docs / ".nojekyll").write_text("", encoding="utf-8")

    overrides: dict[str, str] = {}
    if base:
        overrides["SCRIPT_NAME"] = base

    client = app.test_client()
    for path, rel_out in EXPORTED_ROUTES:
        resp = client.get(path, environ_overrides=overrides)
        if resp.status_code != 200:
            print(f"error: GET {path!r} -> {resp.status_code}", file=sys.stderr)
            sys.exit(1)
        out_path = docs / rel_out
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(resp.get_data(as_text=True), encoding="utf-8")
        print(f"wrote {out_path.relative_to(ROOT)}")

    print("done.")


if __name__ == "__main__":
    main()
