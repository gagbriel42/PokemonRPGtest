#!/usr/bin/env python3
import argparse
import json
import struct
from pathlib import Path


def u16(b, o):
    return struct.unpack_from('<H', b, o)[0]


def u32(b, o):
    return struct.unpack_from('<I', b, o)[0]


def narc_entries(path):
    d = path.read_bytes()
    if d[:4] != b'NARC':
        raise ValueError('NARC invalide')
    p = u16(d, 0x0c)
    blocks = []
    while p < len(d):
        magic = d[p:p + 4]
        n = u32(d, p + 4)
        if n < 8 or p + n > len(d):
            raise ValueError(f'bloc NARC invalide: offset={p}, taille={n}')
        blocks.append((magic, p, n))
        p += n
    btaf = next(x for x in blocks if x[0] == b'BTAF')
    gmif = next(x for x in blocks if x[0] == b'GMIF')
    base = gmif[1] + 8
    count = u16(d, btaf[1] + 8)
    out = []
    for i in range(count):
        a, b = struct.unpack_from('<II', d, btaf[1] + 12 + i * 8)
        if a > b or base + b > len(d):
            raise ValueError(f'entree NARC invalide: {i}, {a}:{b}')
        out.append(d[base + a:base + b])
    return out


def parse(data, out):
    # Real HGSS map-BIN layout:
    #   u32 PER length
    #   u32 BLD length
    #   u32 NSBMD length
    #   u32 BDHC length
    #   optional BGS block (starts with 0x1234 + u16 length)
    #   PER, BLD, NSBMD, BDHC
    #
    # The previous parser incorrectly treated the first 20 bytes as a
    # five-u32 header. That shifted every section by four bytes and caused
    # the NSBMD parser to report a missing BMD0 signature.
    if len(data) < 16:
        raise ValueError(f'map trop court: {len(data)} octets')

    per, bld, nsbmd, bdhc = struct.unpack_from('<4I', data, 0)
    p = 16

    # HGSS stores a BGS block before the four main sections. Its first word
    # is 0x1234 (bytes 34 12), followed by a u16 payload length.
    bgs = b''
    bgs_len = 0
    if p + 4 <= len(data) and u16(data, p) == 0x1234:
        declared = u16(data, p + 2)
        total = declared + 4
        if total < 4 or p + total > len(data):
            raise ValueError(
                f'BGS invalide: payload={declared}, offset={p}, taille={len(data)}'
            )
        bgs = data[p:p + total]
        bgs_len = total
        p += total

    section_lengths = (per, bld, nsbmd, bdhc)
    sections_end = p + sum(section_lengths)
    if sections_end > len(data):
        raise ValueError(
            'sections invalides: '
            f'PER={per}, BLD={bld}, NSBMD={nsbmd}, BDHC={bdhc}, '
            f'BGS={bgs_len}, offset={p}, taille={len(data)}'
        )

    parts = {'bgs': bgs}
    for name, n in zip(('per', 'bld', 'nsbmd', 'bdhc'), section_lengths):
        parts[name] = data[p:p + n]
        p += n

    parts['tail'] = data[p:]

    out.mkdir(parents=True, exist_ok=True)
    for name, raw in parts.items():
        (out / f'{name}.bin').write_bytes(raw)

    if len(parts['per']) != 2048:
        raise ValueError(f'PER != 2048 ({len(parts["per"])})')
    if len(parts['bld']) % 48:
        raise ValueError(f'BLD longueur inattendue: {len(parts["bld"])} (pas multiple de 48)')
    if parts['nsbmd'][:4] != b'BMD0':
        # Give enough structural information to diagnose a genuinely
        # different map variant without dumping binary data into the log.
        sig = parts['nsbmd'][:16].hex(' ')
        raise ValueError(
            f'NSBMD BMD0 absent: longueur={len(parts["nsbmd"])}, '
            f'premiers_octets={sig}'
        )

    cells = []
    for i in range(1024):
        cells.append({
            'x': i % 32,
            'y': i // 32,
            'type': parts['per'][2 * i],
            'collision': parts['per'][2 * i + 1],
            'blocked': bool(parts['per'][2 * i + 1] & 0x80),
        })

    (out / 'permissions.json').write_text(
        json.dumps({'width': 32, 'height': 32, 'cells': cells}, indent=2),
        encoding='utf-8',
    )
    (out / 'manifest.json').write_text(
        json.dumps({
            'header': {
                'per': per,
                'bld': bld,
                'nsbmd': nsbmd,
                'bdhc': bdhc,
                'bgs': bgs_len,
            },
            'sectionsEnd': sections_end,
            'tail': len(parts['tail']),
            'total': len(data),
        }, indent=2),
        encoding='utf-8',
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('narc', type=Path)
    ap.add_argument('--maps', default='30,57')
    ap.add_argument('--out', type=Path, required=True)
    a = ap.parse_args()
    entries = narc_entries(a.narc)
    for s in a.maps.split(','):
        i = int(s)
        parse(entries[i], a.out / 'maps' / s)


if __name__ == '__main__':
    main()
