#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PARTS=ROOT/'rom-parts';PUBLIC=ROOT/'apps/web/public/assets/hgss/generated';TMP=Path('/tmp/pokemon-rpg-hgss');ROM=TMP/'SoulSilver.nds';APICULA_DIR=TMP/'apicula';MAPS_ENV=os.environ.get('HGSS_MAPS','auto')
def run(*args):
 cmd=[str(x) for x in args];print('[HGSS]',' '.join(cmd),flush=True);subprocess.run(cmd,cwd=ROOT,check=True)
def sha256(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(8*1024*1024),b''):h.update(c)
 return h.hexdigest()
def get_rom():
 env=os.environ.get('HGSS_ROM')
 if env and Path(env).is_file():return Path(env)
 for p in (ROOT/'SoulSilver.nds',ROOT/'soulsilver.nds',ROOT/'soulSilver.nds'):
  if p.is_file():return p
 parts=sorted(PARTS.glob('soulSilver.part*'))
 if not parts:raise SystemExit('[HGSS] ROM/parts introuvables')
 TMP.mkdir(parents=True,exist_ok=True);run('python3',ROOT/'tools/hgss/reassemble_rom_parts.py','--out',ROM);return ROM
def copy_any(src,dst):
 if src.is_dir():dst.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(src,dst,dirs_exist_ok=True)
 elif src.is_file():dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
def resolve_maps():
 if MAPS_ENV.strip().lower()!='auto':return ','.join(x.strip() for x in MAPS_ENV.split(',') if x.strip())
 p=ROOT/'apps/web/public/assets/hgss/johto-matrix.json'
 d=json.loads(p.read_text(encoding='utf-8'));ids=sorted({int(r[2]) for r in d.get('nonZero',[])})
 if not ids:raise RuntimeError('Matrice Johto vide')
 return ','.join(map(str,ids))
def ensure_apicula():
 binary=APICULA_DIR/'target'/'release'/'apicula'
 if binary.is_file():return binary
 APICULA_DIR.parent.mkdir(parents=True,exist_ok=True)
 if not (APICULA_DIR/'.git').exists():run('git','clone','--depth','1','https://github.com/scurest/apicula.git',APICULA_DIR)
 cargo=Path.home()/'.cargo'/'bin'/'cargo'
 if not cargo.is_file():
  if shutil.which('cargo'):cargo=Path('cargo')
  elif shutil.which('rustup'):run('bash','-lc','rustup toolchain install stable')
  else:run('bash','-lc','curl https://sh.rustup.rs -sSf | sh -s -- -y')
  if not cargo.is_file():cargo=Path.home()/'.cargo'/'bin'/'cargo'
 subprocess.run([str(cargo),'build','--release','--locked'],cwd=APICULA_DIR,check=True);return binary
def find_external_btx(root):
 out=[]
 for p in root.rglob('*'):
  if p.is_file():
   try:
    with p.open('rb') as f: magic=f.read(4)
    if magic==b'BTX0':out.append(p)
   except OSError:pass
 return sorted(out)
def convert_map_models(maps):
 apicula=ensure_apicula();external=find_external_btx(PUBLIC/'nitrofs');built=[];missing=[]
 print(f'[HGSS] Textures NSBTX externes détectées: {len(external)}',flush=True)
 for raw_id in maps.split(','):
  map_id=raw_id.strip();src=PUBLIC/'maps'/map_id/'nsbmd.bin';outdir=PUBLIC/'maps'/map_id/'rendered'
  if not src.is_file():missing.append(map_id);continue
  shutil.rmtree(outdir,ignore_errors=True)
  args=[apicula,'convert','-f=glb','--more-textures',src,*external[:96],'-o',outdir]
  run(*args)
  candidates=sorted(outdir.glob('*.glb'))
  if not candidates:missing.append(map_id);continue
  preferred=outdir/'nsbmd.glb'
  if candidates[0]!=preferred:
   if preferred.exists():preferred.unlink()
   candidates[0].rename(preferred)
  if preferred.is_file() and preferred.stat().st_size>=1024:built.append({'id':int(map_id),'glb':f'maps/{map_id}/rendered/nsbmd.glb','bytes':preferred.stat().st_size})
  else:missing.append(map_id)
 manifest={'mapsBuilt':built,'mapsMissing':[int(x) for x in missing],'countBuilt':len(built),'countMissing':len(missing)}
 (PUBLIC/'map-render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 print(f'[HGSS] Rendus valides: {len(built)} / {len(maps.split(","))}',flush=True)
 if missing:print(f'[HGSS] Rendus manquants: {len(missing)} / {len(maps.split(","))}: {",".join(missing)}',flush=True)
def main():
 rom=get_rom();maps=resolve_maps();raw=TMP/'raw';shutil.rmtree(raw,ignore_errors=True);run('python3',ROOT/'tools/hgss/extract_rom.py',str(rom),'--out',str(raw),'--maps',maps);shutil.rmtree(PUBLIC,ignore_errors=True);PUBLIC.mkdir(parents=True,exist_ok=True);copy_any(raw/'maps',PUBLIC/'maps');copy_any(raw/'nitrofs',PUBLIC/'nitrofs');convert_map_models(maps);(PUBLIC/'.build-stamp.json').write_text(json.dumps({'sha256':sha256(rom),'maps':maps,'converter':'apicula-with-external-btx'},indent=2)+'\n');print(f'[HGSS] Build terminé: {len(maps.split(","))} maps Johto',flush=True)
if __name__=='__main__':raise SystemExit(main())
