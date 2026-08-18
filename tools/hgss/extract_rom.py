#!/usr/bin/env python3
"""HGSS ROM extractor bootstrap.

This tool intentionally does not contain or distribute a ROM. Give it a local
SoulSilver .nds file and it extracts the NitroFS archive when a compatible
extractor is available. It also records the locations needed by the web map
pipeline.
"""
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess, sys
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('rom', type=Path)
    ap.add_argument('--out', type=Path, default=Path('apps/web/public/assets/hgss/generated'))
    args = ap.parse_args()
    rom = args.rom.expanduser().resolve()
    if not rom.is_file() or rom.suffix.lower() != '.nds':
        print(f'ROM introuvable ou extension incorrecte: {rom}', file=sys.stderr)
        return 2
    args.out.mkdir(parents=True, exist_ok=True)
    meta = {
        'source': rom.name,
        'size': rom.stat().st_size,
        'sha256': sha256(rom),
        'nitrofs': 'a/0/4/1 (matrix), a/0/4/4 (textures), a/0/6/5 (maps)',
        'status': 'ROM detected; NitroFS extraction must be performed locally.'
    }
    (args.out / 'rom-info.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    extractor = shutil.which('ndstool')
    if extractor:
        proc = subprocess.run([extractor, '-x', str(rom), '-9', str(args.out / 'nitro')], text=True)
        if proc.returncode == 0:
            meta['status'] = 'NitroFS extracted with ndstool.'
            (args.out / 'rom-info.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
            print('Extraction HGSS terminée.')
            return 0
    print('ROM détectée. Installez ndstool puis relancez la commande pour extraire NitroFS.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
