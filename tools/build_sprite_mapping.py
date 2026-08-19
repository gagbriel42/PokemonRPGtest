#!/usr/bin/env python3
"""
Build a non-destructive index of the extracted Pokegra PNG assets.

IMPORTANT: this script NEVER opens PNGs for writing and NEVER modifies files
under tools/pokegra/png. It only reads metadata and writes generated JSON/
reports under apps/web/public/data/.

Usage:
    python tools/build_sprite_mapping.py

The first pass intentionally maps the raw extracted asset IDs exactly as they
exist. Semantic Pokemon/form assignment is kept explicit rather than guessed.
This prevents silently assigning the wrong sprite to a Pokemon.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = Path(__file__).resolve().parents[1]
PNG_DIR = ROOT / "tools" / "pokegra" / "png"
PAL_DIR = ROOT / "tools" / "pokegra" / "pal"
OUT_DIR = ROOT / "apps" / "web" / "public" / "data"
OUT_JSON = OUT_DIR / "sprite-assets.json"
OUT_REPORT = OUT_DIR / "sprite-assets-report.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def png_info(path: Path) -> dict[str, Any]:
    result: dict[str, Any] = {
        "width": None,
        "height": None,
        "mode": None,
    }
    if Image is None:
        return result
    try:
        with Image.open(path) as im:
            result["width"], result["height"], result["mode"] = im.size[0], im.size[1], im.mode
    except Exception as exc:
        result["error"] = str(exc)
    return result


def main() -> int:
    if not PNG_DIR.is_dir():
        raise SystemExit(f"PNG directory not found: {PNG_DIR}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(PNG_DIR.glob("*.png"), key=lambda p: int(p.stem) if p.stem.isdigit() else p.stem)

    assets: list[dict[str, Any]] = []
    ids: set[int] = set()
    invalid_names: list[str] = []
    duplicate_hashes: dict[str, list[str]] = {}

    for path in files:
        if not path.stem.isdigit():
            invalid_names.append(path.name)
            continue

        asset_id = int(path.stem)
        ids.add(asset_id)
        rel = path.relative_to(ROOT).as_posix()
        web_path = "/" + rel
        info = png_info(path)
        digest = sha256(path)
        duplicate_hashes.setdefault(digest, []).append(path.name)

        # Do not guess front/back/shiny/form here. The raw asset ID is the
        # authoritative identity until a verified archive-order mapping exists.
        assets.append({
            "assetId": asset_id,
            "file": rel,
            "url": web_path,
            "palette": f"tools/pokegra/pal/{asset_id:04d}.pal" if (PAL_DIR / f"{asset_id:04d}.pal").exists() else None,
            "sha256": digest,
            **info,
        })

    duplicate_groups = [v for v in duplicate_hashes.values() if len(v) > 1]

    # Safe structural clues. These are diagnostics, not Pokemon assignments.
    dimensions: dict[str, int] = {}
    modes: dict[str, int] = {}
    for a in assets:
        key = f"{a['width']}x{a['height']}"
        dimensions[key] = dimensions.get(key, 0) + 1
        if a["mode"]:
            modes[a["mode"]] = modes.get(a["mode"], 0) + 1

    payload = {
        "version": 1,
        "generatedBy": "tools/build_sprite_mapping.py",
        "source": "tools/pokegra/png",
        "sourceIsReadOnly": True,
        "count": len(assets),
        "assets": assets,
        "semanticMapping": {},
        "semanticMappingStatus": "pending_verified_archive_mapping",
    }

    report = {
        "version": 1,
        "pngCount": len(files),
        "indexedCount": len(assets),
        "invalidNames": invalid_names,
        "duplicateContentGroups": duplicate_groups,
        "dimensions": dimensions,
        "modes": modes,
        "pngDirectory": str(PNG_DIR.relative_to(ROOT)),
        "pngFilesModified": False,
        "note": "No Pokemon/form/front/back/shiny assignment is guessed. A verified archive-order table must be supplied before semantic mapping is generated.",
    }

    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("=== POKEGRA SPRITE MAPPING ===")
    print(f"PNG trouvés       : {len(files)}")
    print(f"PNG indexés       : {len(assets)}")
    print(f"Dimensions        : {dimensions}")
    print(f"Modes             : {modes}")
    print(f"Doublons contenu  : {len(duplicate_groups)} groupes")
    print(f"Index             : {OUT_JSON.relative_to(ROOT)}")
    print(f"Rapport           : {OUT_REPORT.relative_to(ROOT)}")
    print("PNG originaux     : INTACTS")
    print("Mapping Pokémon   : volontairement NON DEVINÉ")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
