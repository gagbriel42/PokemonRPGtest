#!/usr/bin/env python3
"""Prepare the extracted HGSS battle archives for the web client."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "apps/web/public/assets/hgss/generated"
BATTLE = GENERATED / "battle-assets"


def main() -> int:
    if not GENERATED.is_dir():
        raise SystemExit(f"Extraction HGSS absente: {GENERATED}")
    extractor = ROOT / "tools/hgss/extract_battle_assets.py"
    subprocess.run([sys.executable, str(extractor), "--root", str(GENERATED), "--out", str(BATTLE)], check=True)
    source_manifest = BATTLE / "manifest.json"
    manifest = json.loads(source_manifest.read_text(encoding="utf-8"))

    public = ROOT / "apps/web/public/assets/hgss/battle"
    public.mkdir(parents=True, exist_ok=True)
    compact = {
        "format": 2,
        "source": "HGSS NitroFS battle archives extracted locally",
        "rawRoot": "/assets/hgss/generated/battle-assets",
        "archives": {},
    }
    for name, info in manifest.get("archives", {}).items():
        compact["archives"][name] = {
            "source": info["source"],
            "count": info["count"],
            "members": [
                {**m, "url": f"/assets/hgss/generated/battle-assets/{m['file']}"}
                for m in info["members"]
            ],
        }
    (public / "manifest.json").write_text(json.dumps(compact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Manifest battle frontend: {public / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
