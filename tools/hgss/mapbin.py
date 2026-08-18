#!/usr/bin/env python3
"""Small reader for the HGSS packed map container (PER/BLD/NSBMD/BDHC)."""
from __future__ import annotations
import json, struct, sys
from pathlib import Path

def unpack(path: Path, out: Path):
    data=path.read_bytes()
    if len(data)<16: raise ValueError('map container too short')
    per,bld,nsbmd,bdhc=struct.unpack_from('<IIII',data,0)
    bgs=len(data)-16-per-bld-nsbmd-bdhc
    if bgs<0: raise ValueError('invalid map lengths')
    lengths={'bgs':bgs,'per':per,'bld':bld,'nsbmd':nsbmd,'bdhc':bdhc}
    out.mkdir(parents=True,exist_ok=True); off=16
    for name,size in lengths.items():
        (out/f'{name}.bin').write_bytes(data[off:off+size]); off+=size
    (out/'manifest.json').write_text(json.dumps({'total':len(data),'lengths':lengths},indent=2),encoding='utf-8')
    return lengths

if __name__=='__main__':
    if len(sys.argv)!=3: raise SystemExit('usage: mapbin.py MAP.BIN OUT_DIR')
    print(json.dumps(unpack(Path(sys.argv[1]),Path(sys.argv[2])),indent=2))
