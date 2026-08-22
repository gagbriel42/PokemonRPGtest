#!/usr/bin/env python3
"""Extract real HGSS NitroFS map data from a local SoulSilver ROM.

The ROM is never committed. For each requested map this decodes the HGSS
map-BIN container used by DSPRE: BGS (HGSS), permissions, buildings, NSBMD
model and BDHC terrain data.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path


def u16(b: bytes, o: int) -> int:
    return struct.unpack_from('<H', b, o)[0]


def u32(b: bytes, o: int) -> int:
    return struct.unpack_from('<I', b, o)[0]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def read_fnt(fnt: bytes):
    paths = []

    def walk(did: int, prefix: str = ''):
        idx = did - 0xF000
        base = idx * 8
        suboff = u32(fnt, base)
        first = u16(fnt, base + 4)
        pos = suboff
        files = []
        dirs = []
        while True:
            n = fnt[pos]
            pos += 1
            if n == 0:
                break
            isdir = n & 0x80
            ln = n & 0x7F
            name = fnt[pos:pos + ln].decode('ascii', 'replace')
            pos += ln
            if isdir:
                child = u16(fnt, pos)
                pos += 2
                dirs.append((name, child))
            else:
                files.append(name)
        for i, name in enumerate(files):
            paths.append((first + i, prefix + name))
        for name, child in dirs:
            walk(child, prefix + name + '/')

    walk(0xF000)
    return paths


def extract_nitrofs(rom: Path, out: Path):
    data = rom.read_bytes()
    fnt_off = u32(data, 0x40)
    fnt_size = u32(data, 0x44)
    fat_off = u32(data, 0x48)
    fat_size = u32(data, 0x4C)
    fnt = data[fnt_off:fnt_off + fnt_size]
    fat = data[fat_off:fat_off + fat_size]
    files = []

    for fid, path in read_fnt(fnt):
        start, end = struct.unpack_from('<II', fat, fid * 8)
        dst = out / 'nitrofs' / path
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data[start:end])
        files.append(path)
    return files


def narc_entries(path: Path):
    data = path.read_bytes()
    if data[:4] != b'NARC':
        raise ValueError(f'{path} n\'est pas un NARC valide')
    pos = u16(data, 0x0C)
    blocks = []
    while pos < len(data):
        magic = data[pos:pos + 4]
        length = u32(data, pos + 4)
        if length < 8 or pos + length > len(data):
            raise ValueError(f'bloc NARC invalide à 0x{pos:X}')
        blocks.append((magic, pos, length))
        pos += length

    btaf = next(x for x in blocks if x[0] == b'BTAF')
    gmif = next(x for x in blocks if x[0] == b'GMIF')
    count = u16(data, btaf[1] + 8)
    base = gmif[1] + 8
    entries = []
    for i in range(count):
        start, end = struct.unpack_from('<II', data, btaf[1] + 12 + i * 8)
        entries.append(data[base + start:base + end])
    return entries


def decode_per(raw: bytes):
    if len(raw) < 2048:
        raise ValueError(f'PER trop court: {len(raw)} octets, attendu 2048')
    cells = []
    for i in range(1024):
        tile_type = raw[i * 2]
        collision = raw[i * 2 + 1]
        cells.append({
            'x': i % 32,
            'y': i // 32,
            'type': tile_type,
            'collision': collision,
            'blocked': bool(collision & 0x80),
        })
    return cells


def decode_bdhc(raw: bytes):
    if len(raw) < 16 or raw[:4] != b'BDHC':
        return {'present': False, 'size': len(raw)}
    counts = struct.unpack_from('<6H', raw, 4)
    return {
        'present': True,
        'points': counts[0],
        'inclines': counts[1],
        'heights': counts[2],
        'plates': counts[3],
        'strips': counts[4],
        'accessLists': counts[5],
        'size': len(raw),
    }


def unpack_mapbin(data: bytes, out: Path):
    """Parse the DPPt/HGSS map BIN format.

    Header (16 bytes): permissions, buildings, NSBMD, BDHC lengths.
    HGSS then stores a BGS block whose first four bytes are 0x1234 + length,
    followed by the four sections in that exact order.
    """
    if len(data) < 16:
        raise ValueError(f'map container trop court: {len(data)} octets')

    permissions_len, buildings_len, nsbmd_len, bdhc_len = struct.unpack_from('<4I', data, 0)
    pos = 16

    bgs_len = 0
    bgs = b''
    if pos + 4 <= len(data) and u16(data, pos) == 0x1234:
        declared = u16(data, pos + 2)
        bgs_len = declared + 4
        if pos + bgs_len > len(data):
            raise ValueError(
                f'BGS invalide: longueur {declared} (+4) dépasse le conteneur ({len(data)} octets)'
            )
        bgs = data[pos:pos + bgs_len]
        pos += bgs_len

    sections_total = permissions_len + buildings_len + nsbmd_len + bdhc_len
    if pos + sections_total > len(data):
        raise ValueError(
            'longueurs map invalides: '
            f'header={permissions_len}/{buildings_len}/{nsbmd_len}/{bdhc_len}, '
            f'bgs={bgs_len}, total={len(data)}, remaining={len(data) - pos}'
        )

    sections = {}
    for name, length in (
        ('per', permissions_len),
        ('bld', buildings_len),
        ('nsbmd', nsbmd_len),
        ('bdhc', bdhc_len),
    ):
        sections[name] = data[pos:pos + length]
        pos += length

    if pos != len(data):
        # Preserve any trailer instead of silently dropping it.
        sections['trailer'] = data[pos:]

    out.mkdir(parents=True, exist_ok=True)
    (out / 'bgs.bin').write_bytes(bgs)
    (out / 'per.bin').write_bytes(sections['per'])
    (out / 'bld.bin').write_bytes(sections['bld'])
    (out / 'nsbmd.bin').write_bytes(sections['nsbmd'])
    (out / 'bdhc.bin').write_bytes(sections['bdhc'])
    if 'trailer' in sections:
        (out / 'trailer.bin').write_bytes(sections['trailer'])

    if len(sections['per']) != 2048:
        raise ValueError(f'PER longueur inattendue: {len(sections["per"])} (attendu 2048)')
    if len(sections['bld']) % 48:
        raise ValueError(f'BLD longueur inattendue: {len(sections["bld"])} (pas multiple de 48)')
    if sections['nsbmd'][:4] != b'BMD0':
        raise ValueError('NSBMD extrait sans signature BMD0')

    meta = {
        'lengths': {
            'bgs': bgs_len,
            'per': permissions_len,
            'bld': buildings_len,
            'nsbmd': nsbmd_len,
            'bdhc': bdhc_len,
        },
        'buildings': buildings_len // 48,
        'total': len(data),
    }
    (out / 'permissions.json').write_text(
        json.dumps({'width': 32, 'height': 32, 'cells': decode_per(sections['per'])}, indent=2),
        encoding='utf-8',
    )
    (out / 'terrain.json').write_text(
        json.dumps(decode_bdhc(sections['bdhc']), indent=2),
        encoding='utf-8',
    )
    (out / 'manifest.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    return meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('rom', type=Path)
    ap.add_argument('--out', type=Path, default=Path('apps/web/public/assets/hgss/generated'))
    ap.add_argument('--maps', default='30,57')
    args = ap.parse_args()

    rom = args.rom.expanduser().resolve()
    if not rom.is_file() or rom.suffix.lower() != '.nds':
        print(f'ROM introuvable: {rom}', file=sys.stderr)
        return 2

    args.out.mkdir(parents=True, exist_ok=True)
    meta = {
        'source': rom.name,
        'size': rom.stat().st_size,
        'sha256': sha256(rom),
    }

    files = extract_nitrofs(rom, args.out)
    meta['file_count'] = len(files)
    map_narc = args.out / 'nitrofs/a/0/6/5'
    maps = narc_entries(map_narc)
    selected = {}
    for value in (int(x) for x in args.maps.split(',') if x.strip()):
        if value < 0 or value >= len(maps):
            raise ValueError(f'map ID hors limites: {value} (NARC contient {len(maps)} entrées)')
        selected[str(value)] = unpack_mapbin(maps[value], args.out / f'maps/{value}')

    meta['maps'] = selected
    (args.out / 'rom-info.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(f'Extraction HGSS terminée: {len(files)} fichiers NitroFS, maps {", ".join(selected)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
