#!/usr/bin/env python3
"""Convert extracted HGSS NSBMD map models to glTF/GLB with Apicula.

Apicula is an external open-source Nintendo DS model converter. It supports
NSBMD -> glTF conversion. The converter is deliberately not vendored here.
"""
from __future__ import annotations
import argparse, shutil, subprocess, sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, default=Path('apps/web/public/assets/hgss/generated'))
    ap.add_argument('--maps', default='30,57')
    ap.add_argument('--apicula', default='apicula')
    a = ap.parse_args()
    exe = shutil.which(a.apicula) or (Path(a.apicula) if Path(a.apicula).exists() else None)
    if not exe:
        print('Apicula introuvable. Installez Apicula puis relancez cette commande.', file=sys.stderr)
        print('Exemple: apicula convert -f=glb MAP.nsbmd -o OUT', file=sys.stderr)
        return 2
    for raw in a.maps.split(','):
        mid = raw.strip()
        if not mid:
            continue
        src = a.root / 'maps' / mid / 'nsbmd.bin'
        out = a.root / 'maps' / mid / 'rendered'
        if not src.is_file():
            print(f'Map {mid}: NSBMD absent: {src}', file=sys.stderr)
            continue
        out.mkdir(parents=True, exist_ok=True)
        cmd = [str(exe), 'convert', '-f=glb', str(src), '-o', str(out)]
        print('+', ' '.join(map(str, cmd)))
        result = subprocess.run(cmd)
        if result.returncode:
            return result.returncode
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
