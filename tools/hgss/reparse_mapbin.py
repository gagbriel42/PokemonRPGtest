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
    # HGSS mapbin: 20-byte header. The first four uint32 are section
    # lengths (PER, BLD, NSBMD, BDHC). The fifth uint32 is metadata,
    # NOT another section length. Older code incorrectly summed all five.
    if len(data) < 20:
        raise ValueError('map trop court')

    per, bld, nsbmd, bdhc, metadata = struct.unpack_from('<5I', data, 0)
    section_lengths = (per, bld, nsbmd, bdhc)
    p = 20
    sections_end = p + sum(section_lengths)

    if sections_end > len(data):
        raise ValueError(
            f'sections invalides: PER={per}, BLD={bld}, NSBMD={nsbmd}, '
            f'BDHC={bdhc}, metadata={metadata}, taille={len(data)}'
        )

    parts = {}
    for name, n in zip(('per', 'bld', 'nsbmd', 'bdhc'), section_lengths):
        parts[name] = data[p:p + n]
        p += n

    # Preserve bytes after the four declared sections. They are not part
    # of the four map sections but must not be silently discarded.
    parts['tail'] = data[p:]

    out.mkdir(parents=True, exist_ok=True)
    for name, raw in parts.items():
        (out / f'{name}.bin').write_bytes(raw)

    if len(parts['per']) != 2048:
        raise ValueError(f'PER != 2048 ({len(parts["per"])})')
    if parts['nsbmd'][:4] != b'BMD0':
        raise ValueError('NSBMD BMD0 absent')

    cells = []
    for i in range(1024):
        cells.append({
            'x': i % 32,
            'y': i // 32,
            'type': parts['per'][2 * i],
            'collision': parts['per'][2 * i + 1],
            'blocked': parts['per'][2 * i + 1] == 0x80,
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
                'metadata': metadata,
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
