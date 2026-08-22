#!/usr/bin/env python3
"""Extract the HGSS battle/UI NARC archives into web-readable raw assets.

The ROM itself is never committed. Run this script against the locally rebuilt
SoulSilver .nds produced from rom-parts. NARC members are emitted with a useful
extension based on their Nitro header, plus a manifest describing every member.
"""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path

ARCHIVES = {
    "batt_bg": "nitrofs/pbr/batt_bg.narc",
    "batt_obj": "nitrofs/pbr/batt_obj.narc",
    "bag_gra": "nitrofs/pbr/bag_gra.narc",
    "pokegra": "nitrofs/pbr/pokegra.narc",
    "poke_icon": "nitrofs/pbr/poke_icon.narc",
    "poke_anm": "nitrofs/pbr/poke_anm.narc",
    "pokeanm": "nitrofs/pbr/pokeanm.narc",
    "pst_gra": "nitrofs/pbr/pst_gra.narc",
    "plist_gra": "nitrofs/pbr/plist_gra.narc",
    "b_plist_gra": "nitrofs/pbr/b_plist_gra.narc",
    "font": "nitrofs/pbr/font.narc",
    "msg": "nitrofs/pbr/msg.narc",
    "ugeffect_obj_graphic": "nitrofs/data/ugeffect_obj_graphic.narc",
    "field_cutin": "nitrofs/data/field_cutin.narc",
}

MAGICS = {
    b"RGCN": ".NCGR",
    b"RLCN": ".NCLR",
    b"RCSN": ".NSCR",
    b"RBCN": ".NCER",
    b"BMD0": ".NSBMD",
    b"BTX0": ".NSBTX",
    b"BCA0": ".NSBCA",
    b"BTP0": ".NSBTP",
    b"BTA0": ".NSBTA",
    b"BMA0": ".NSBMA",
    b"NARC": ".NARC",
}


def u16(data: bytes, off: int) -> int:
    return struct.unpack_from("<H", data, off)[0]


def u32(data: bytes, off: int) -> int:
    return struct.unpack_from("<I", data, off)[0]


def narc_entries(path: Path) -> list[bytes]:
    data = path.read_bytes()
    if data[:4] != b"NARC":
        raise ValueError(f"{path} n'est pas un NARC valide")
    header_size = u16(data, 0x0C)
    pos = header_size
    blocks = []
    while pos + 8 <= len(data):
        magic = data[pos:pos + 4]
        length = u32(data, pos + 4)
        if length < 8 or pos + length > len(data):
            raise ValueError(f"bloc NARC invalide dans {path} à 0x{pos:X}")
        blocks.append((magic, pos, length))
        pos += length
    btaf = next(x for x in blocks if x[0] == b"BTAF")
    gmif = next(x for x in blocks if x[0] == b"GMIF")
    count = u16(data, btaf[1] + 8)
    base = gmif[1] + 8
    out = []
    for i in range(count):
        start, end = struct.unpack_from("<II", data, btaf[1] + 12 + i * 8)
        out.append(data[base + start:base + end])
    return out


def extension(raw: bytes) -> str:
    return MAGICS.get(raw[:4], ".bin")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("apps/web/public/assets/hgss/generated"))
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    root = args.root.resolve()
    out = (args.out or root / "battle-assets").resolve()
    out.mkdir(parents=True, exist_ok=True)

    manifest = {"source_root": str(root), "archives": {}}
    for name, rel in ARCHIVES.items():
        src = root / rel
        if not src.is_file():
            continue
        entries = narc_entries(src)
        archive_out = out / name
        archive_out.mkdir(parents=True, exist_ok=True)
        members = []
        for idx, raw in enumerate(entries):
            ext = extension(raw)
            dst = archive_out / f"{idx:04d}{ext}"
            dst.write_bytes(raw)
            members.append({"index": idx, "extension": ext, "size": len(raw), "file": str(dst.relative_to(out))})
        manifest["archives"][name] = {"source": rel, "count": len(entries), "members": members}
        print(f"{name}: {len(entries)} entrées")

    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Extraction battle HGSS terminée: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
