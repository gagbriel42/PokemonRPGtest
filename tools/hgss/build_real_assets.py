#!/usr/bin/env python3
"""Build real HGSS map assets for the web app."""
from __future__ import annotations
import hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PARTS=ROOT/'rom-parts'; PUBLIC=ROOT/'apps/web/public/assets/hgss/generated'
TMP=Path('/tmp/pokemon-rpg-hgss'); ROM=TMP/'SoulSilver.nds'
MAPS=os.environ.get('HGSS_MAPS','30,57')
def run(*args):
    cmd=[str(x) for x in args]; print('[HGSS]',' '.join(cmd),flush=True); subprocess.run(cmd,cwd=ROOT,check=True)
def sha256(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda:f.read(8*1024*1024),b''): h.update(c)
    return h.hexdigest()
def get_rom():
    env=os.environ.get('HGSS_ROM')
    if env and Path(env).is_file(): return Path(env)
    for p in (ROOT/'SoulSilver.nds',ROOT/'soulsilver.nds',ROOT/'soulSilver.nds'):
        if p.is_file(): return p
    parts=sorted(PARTS.glob('soulSilver.part*'))
    if not parts: raise SystemExit('[HGSS] ROM/parts introuvables')
    TMP.mkdir(parents=True,exist_ok=True)
    run(sys.executable,ROOT/'tools/hgss/reassemble_rom_parts.py','--out',ROM)
    return ROM
def copy_any(src,dst):
    if src.is_dir(): dst.parent.mkdir(parents=True,exist_ok=True); shutil.copytree(src,dst,dirs_exist_ok=True)
    elif src.is_file(): dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
def main():
    rom=get_rom(); stamp=PUBLIC/'.build-stamp.json'; fp={'sha256':sha256(rom),'maps':MAPS}
    if stamp.is_file():
        try:
            if json.loads(stamp.read_text())==fp: print('[HGSS] Assets déjà à jour'); return 0
        except Exception: pass
    raw=TMP/'raw'
    if raw.exists(): shutil.rmtree(raw)
    run(sys.executable,ROOT/'tools/hgss/extract_rom.py',str(rom),'--out',str(raw),'--maps',MAPS)
    if PUBLIC.exists():
        for c in PUBLIC.iterdir(): shutil.rmtree(c) if c.is_dir() else c.unlink()
    PUBLIC.mkdir(parents=True,exist_ok=True)
    copy_any(raw/'maps',PUBLIC/'maps')
    # Keep the extracted NitroFS tree available to future renderers.
    copy_any(raw/'nitrofs',PUBLIC/'nitrofs')
    stamp.write_text(json.dumps(fp,indent=2)+'\n')
    print('[HGSS] Build terminé:',PUBLIC); return 0
if __name__=='__main__': raise SystemExit(main())
