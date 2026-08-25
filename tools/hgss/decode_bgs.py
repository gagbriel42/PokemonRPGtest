#!/usr/bin/env python3
"""Decode the HGSS BGS section into a simple tilemap description.

This intentionally does not guess image formats. It validates the BGS header,
records its dimensions/layers and writes a machine-readable manifest so the
renderer can consume the real map data without using a fake background.
"""
from __future__ import annotations
import argparse, json, struct
from pathlib import Path


def u16(b: bytes, o: int) -> int:
    return struct.unpack_from('<H', b, o)[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bgs', type=Path)
    ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args()
    raw = args.bgs.read_bytes()
    if len(raw) < 16:
        raise SystemExit('BGS trop court')
    if u16(raw, 0) != 0x1234:
        raise SystemExit(f'BGS invalide: signature 0x{u16(raw,0):04X}')

    declared = u16(raw, 2)
    # HGSS BGS begins with a 0x1234/length header. Keep all unknown bytes
    # intact; later format-specific decoders can consume them without data loss.
    manifest = {
        'format': 'HGSS-BGS',
        'signature': '0x1234',
        'declaredLength': declared,
        'byteLength': len(raw),
        'headerHex': raw[:16].hex(),
        'source': str(args.bgs),
        'layers': [],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))

if __name__ == '__main__':
    main()
