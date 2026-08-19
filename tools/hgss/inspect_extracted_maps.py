#!/usr/bin/env python3
"""Inspect an already extracted HGSS NitroFS tree without modifying any source asset.

The script is intentionally read-only for the ROM/extracted files. It parses NARC
containers, identifies map-like entries containing PER/BDHC data, and writes only
a JSON manifest under apps/web/public/data/.
"""
from __future__ import annotations
import json, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/web/public/data/hgss-map-source-manifest.json"
CANDIDATES = [
    ROOT / "soulSilver_extracted/fielddata/build_model/bm_field.narc",
    ROOT / "soulSilver_extracted/fielddata/build_model/bm_room.narc",
]

def u16(b,o): return struct.unpack_from('<H', b, o)[0]
def u32(b,o): return struct.unpack_from('<I', b, o)[0]

def narc_entries(path: Path):
    b = path.read_bytes()
    if b[:4] != b'NARC': return []
    pos = u16(b, 0x0c)
    blocks = {}
    while pos + 8 <= len(b):
        magic = b[pos:pos+4]
        ln = u32(b, pos+4)
        if ln < 8 or pos + ln > len(b): break
        blocks[magic] = (pos, ln)
        pos += ln
    if b'BTAF' not in blocks or b'GMIF' not in blocks: return []
    bp,_ = blocks[b'BTAF']; gp,_ = blocks[b'GMIF']
    count = u16(b, bp+8)
    base = gp+8
    out=[]
    for i in range(count):
        s,e = struct.unpack_from('<II', b, bp+12+i*8)
        out.append(b[base+s:base+e])
    return out

def inspect_entry(raw: bytes):
    sigs = {}
    for sig in (b'PER', b'BDHC', b'NSBMD', b'NSBTX', b'NSBCA', b'BMD0'):
        p = raw.find(sig)
        if p >= 0: sigs[sig.decode('ascii','ignore')] = p
    return sigs

def main():
    result = {'readOnly': True, 'sourceFiles': [], 'maps': []}
    for path in CANDIDATES:
        if not path.is_file(): continue
        entries = narc_entries(path)
        result['sourceFiles'].append({'path': str(path.relative_to(ROOT)), 'entries': len(entries)})
        for idx, raw in enumerate(entries):
            sigs = inspect_entry(raw)
            if not sigs: continue
            result['maps'].append({
                'source': str(path.relative_to(ROOT)),
                'index': idx,
                'size': len(raw),
                'signatures': sigs,
                'hasPermissions': 'PER' in sigs,
                'hasTerrain': 'BDHC' in sigs,
                'hasModel': 'NSBMD' in sigs or 'BMD0' in sigs,
            })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"HGSS map manifest: {len(result['maps'])} candidate entries -> {OUT}")

if __name__ == '__main__':
    main()
