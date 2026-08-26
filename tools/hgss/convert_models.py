#!/usr/bin/env python3
"""Convert extracted HGSS NSBMD map models to a web-friendly format.

Apicula is optional. When unavailable, the raw NSBMD is kept and the browser
renderer can use the extracted data/fallback path instead of making the build
fail.
"""
from __future__ import annotations
import argparse, shutil, subprocess, sys
from pathlib import Path

def main() -> int:
    ap=argparse.ArgumentParser(); ap.add_argument('--root',type=Path,default=Path('apps/web/public/assets/hgss/generated')); ap.add_argument('--maps',default='30,57'); ap.add_argument('--apicula',default='apicula'); a=ap.parse_args()
    exe=shutil.which(a.apicula) or (Path(a.apicula) if Path(a.apicula).exists() else None)
    if not exe:
        print('[HGSS] Apicula absent: conservation des NSBMD bruts; pas de conversion GLB.')
        return 0
    for mid in (x.strip() for x in a.maps.split(',')):
        if not mid: continue
        src=a.root/'maps'/mid/'nsbmd.bin'; out=a.root/'maps'/mid/'rendered'
        if not src.is_file(): print(f'[HGSS] map {mid}: NSBMD absent'); continue
        out.mkdir(parents=True,exist_ok=True)
        r=subprocess.run([str(exe),'convert','-f=glb',str(src),'-o',str(out)])
        if r.returncode: return r.returncode
    return 0
if __name__=='__main__': raise SystemExit(main())
