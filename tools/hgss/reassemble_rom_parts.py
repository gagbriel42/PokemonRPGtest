#!/usr/bin/env python3
"""Reassemble the SoulSilver ROM from tracked split parts.

The source ROM stays in rom-parts/ and is never copied into the web bundle.
Parts are read in lexical order and written to a temporary .nds file.
"""
from pathlib import Path
import argparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--parts', type=Path, default=Path('rom-parts'))
    ap.add_argument('--out', type=Path, default=Path('/tmp/SoulSilver.nds'))
    args = ap.parse_args()

    parts = sorted(args.parts.glob('soulSilver.part*'))
    if not parts:
        raise SystemExit('Aucun morceau SoulSilver trouvé dans rom-parts/')

    expected = [f'soulSilver.part{i:03d}' for i in range(len(parts))]
    names = [p.name for p in parts]
    if names != expected:
        raise SystemExit(f'Morceaux incomplets ou mal nommés: {names}')

    args.out.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    with args.out.open('wb') as dst:
        for part in parts:
            with part.open('rb') as src:
                while True:
                    chunk = src.read(8 * 1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
                    total += len(chunk)
    print(f'ROM reconstituée: {args.out} ({total} octets)')


if __name__ == '__main__':
    main()
