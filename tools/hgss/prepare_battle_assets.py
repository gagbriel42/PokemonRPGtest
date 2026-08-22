#!/usr/bin/env python3
"""Prepare an index of the HGSS battle resources extracted from the ROM.

The ROM itself is never touched by the web app. This script reads the existing
NitroFS extraction and writes a small JSON manifest consumed by the battle UI.
It deliberately keeps NARC/NCGR/NCLR files as source assets: a later graphics
converter can replace individual entries with browser-ready PNGs without
changing the frontend.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "apps/web/public/assets/hgss/generated/nitrofs"
OUT = ROOT / "apps/web/public/assets/hgss/battle"
MANIFEST = OUT / "manifest.json"

GROUPS = {
    "battle_backgrounds": ["pbr/batt_bg.narc"],
    "battle_objects": ["pbr/batt_obj.narc"],
    "pokemon_graphics": ["pbr/pokegra.narc", "pbr/pokeanm.narc", "pbr/poke_anm.narc"],
    "pokemon_icons": ["pbr/poke_icon.narc"],
    "battle_ui": ["data/battle_win.NSCR", "pbr/b_plist_gra.narc", "pbr/plist_gra.narc"],
    "bag_ui": ["pbr/bag_gra.narc"],
    "messages": ["pbr/msg.narc", "msgdata/scenario/scr_msg.narc"],
    "fonts": ["pbr/font.narc", "data/nfont.NCGR", "data/nfont.NCLR"],
}


def main() -> int:
    if not SRC.is_dir():
        raise SystemExit(f"Extraction HGSS absente: {SRC}")

    OUT.mkdir(parents=True, exist_ok=True)
    resources = {}
    for group, candidates in GROUPS.items():
        found = []
        for rel in candidates:
            path = SRC / rel
            if path.is_file():
                found.append({"path": f"/assets/hgss/generated/nitrofs/{rel}", "size": path.stat().st_size})
        resources[group] = found

    # Any browser-ready PNGs produced by a converter are automatically exposed.
    pngs = sorted(str(p.relative_to(ROOT / "apps/web/public/assets/hgss")).replace("\\", "/")
                  for p in (ROOT / "apps/web/public/assets/hgss").rglob("*.png")
                  if p.is_file())
    resources["browser_pngs"] = [f"/assets/hgss/{p}" for p in pngs]

    manifest = {
        "format": 1,
        "source": "Pokemon HeartGold/SoulSilver extracted NitroFS",
        "resources": resources,
        "preferred": {
            "background": resources["battle_backgrounds"][0]["path"] if resources["battle_backgrounds"] else None,
            "ui": resources["battle_ui"][0]["path"] if resources["battle_ui"] else None,
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Battle HGSS manifest: {MANIFEST}")
    print(f"Ressources indexées: {sum(len(v) for k, v in resources.items() if k != 'browser_pngs')} groupes")
    print(f"PNG navigateur disponibles: {len(pngs)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
