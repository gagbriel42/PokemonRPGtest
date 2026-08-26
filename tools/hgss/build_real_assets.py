#!/usr/bin/env python3
"""One-click HGSS asset build."""
from __future__ import annotations
import hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PARTS=ROOT/'rom-parts'; PUBLIC=ROOT/'apps/web/public/assets/hgss/generated'; TMP=Path('/tmp/pokemon-rpg-hgss'); ROM=TMP/'SoulSilver.nds'; MAPS=os.environ.get('HGSS_MAPS','30,57')
def run(*args):
    cmd=[str(x) for x in args]; print('[HGSS]',' '.join(cmd),flush=True); subprocess.run(cmd,cwd=ROOT,check=True)
def find_rom():
    env=os.environ.get('HGSS_ROM')
    if env and Path(env).is_file(): return Path(env).resolve()
    return next((p.resolve() for p in [ROOT/'SoulSilver.nds',ROOT/'soulsilver.nds',ROOT/'soulSilver.nds']+list(ROOT.glob('*.nds')) if p.is_file()),None)
def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(8*1024*1024),b''): h.update(chunk)
    return h.hexdigest()
def get_rom():
    direct=find_rom()
    if direct: print(f'[HGSS] ROM trouvée: {direct}'); return direct
    parts=sorted(PARTS.glob('soulSilver.part*'))
    if not parts: raise SystemExit('[HGSS] Aucune ROM SoulSilver trouvée dans rom-parts/.')
    print(f'[HGSS] {len(parts)} morceaux trouvés: reconstitution automatique'); TMP.mkdir(parents=True,exist_ok=True)
    run(sys.executable,ROOT/'tools/hgss/reassemble_rom_parts.py','--out',ROM); return ROM
def copy_any(src,dst):
    if src.is_dir(): dst.parent.mkdir(parents=True,exist_ok=True); shutil.copytree(src,dst,dirs_exist_ok=True)
    elif src.is_file(): dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
    else: print(f'[HGSS] Ressource absente, ignorée: {src}')
def main():
    rom=get_rom(); fingerprint={'sha256':sha256(rom),'maps':MAPS}; stamp=PUBLIC/'.build-stamp.json'
    if stamp.is_file():
        try:
            if json.loads(stamp.read_text(encoding='utf-8'))==fingerprint: print('[HGSS] Assets déjà à jour — aucune reconstruction nécessaire.'); return 0
        except Exception: pass
    raw=TMP/'raw'
    if raw.exists(): shutil.rmtree(raw)
    raw.mkdir(parents=True,exist_ok=True)
    run(sys.executable,ROOT/'tools/hgss/extract_rom.py',str(rom),'--out',str(raw),'--maps',MAPS)
    if PUBLIC.exists():
        for child in PUBLIC.iterdir():
            if child.name!='.gitkeep': shutil.rmtree(child) if child.is_dir() else child.unlink()
    PUBLIC.mkdir(parents=True,exist_ok=True)
    maps_src=raw/'maps'
    if not maps_src.is_dir(): raise RuntimeError(f'[HGSS] Dossier maps absent après extraction: {maps_src}')
    copy_any(maps_src,PUBLIC/'maps')
    for rel in ('a/0/4/1','a/0/4/2','a/0/4/3','a/0/4/4','a/0/5/8','a/0/6/5'):
        copy_any(raw/'nitrofs'/rel,PUBLIC/'nitrofs'/rel)
    (PUBLIC/'.build-stamp.json').write_text(json.dumps(fingerprint,indent=2)+'\n',encoding='utf-8')
    print(f'[HGSS] Build terminé. Assets disponibles dans {PUBLIC}'); return 0
if __name__=='__main__': raise SystemExit(main())
