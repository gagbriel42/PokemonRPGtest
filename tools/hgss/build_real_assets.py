#!/usr/bin/env python3
"""Build real HGSS map assets and a rendered Johto overview."""
from __future__ import annotations
import hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PARTS=ROOT/'rom-parts';PUBLIC=ROOT/'apps/web/public/assets/hgss/generated';TMP=Path('/tmp/pokemon-rpg-hgss');ROM=TMP/'SoulSilver.nds';APICULA_DIR=TMP/'apicula';MAPS_ENV=os.environ.get('HGSS_MAPS','auto');APICULA_REPO='https://github.com/scurest/apicula.git'
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
 TMP.mkdir(parents=True,exist_ok=True);run(sys.executable,ROOT/'tools/hgss/reassemble_rom_parts.py','--out',ROM);return ROM
def copy_any(src,dst):
 if src.is_dir():dst.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(src,dst,dirs_exist_ok=True)
 elif src.is_file():dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
def resolve_maps():
 if MAPS_ENV.strip().lower()!='auto':return ','.join(x.strip() for x in MAPS_ENV.split(',') if x.strip())
 p=ROOT/'apps/web/public/assets/hgss/johto-matrix.json'
 if p.is_file():
  d=json.loads(p.read_text(encoding='utf-8'));ids=sorted({int(r[2]) for r in d.get('nonZero',[])})
  if ids:return ','.join(map(str,ids))
 raise RuntimeError('Impossible de déterminer les maps Johto')
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
def convert_map_models(maps):
 apicula=ensure_apicula()
 for map_id in maps.split(','):
  src=PUBLIC/'maps'/map_id/'nsbmd.bin'
  if not src.is_file():continue
  outdir=PUBLIC/'maps'/map_id/'rendered';shutil.rmtree(outdir,ignore_errors=True)
  run(apicula,'convert','-f=glb',src,'-o',outdir)
  candidates=list(outdir.glob('*.glb'))
  if not candidates:raise RuntimeError(f'Apicula n’a produit aucun GLB pour {map_id}')
  preferred=outdir/'nsbmd.glb'
  if candidates[0]!=preferred:candidates[0].rename(preferred)
def render_world_map():
 """Render a deterministic overview from extracted map thumbnails when available.
 The frontend consumes this PNG; no fake SVG coastline or hand-drawn Johto geometry is used."""
 out=ROOT/'apps/web/public/assets/hgss/johto-world-map.png';out.parent.mkdir(parents=True,exist_ok=True)
 script=ROOT/'tools/hgss/render_johto_world_map.py'
 if not script.is_file():raise RuntimeError('render_johto_world_map.py absent')
 run(sys.executable,script,'--assets',PUBLIC,'--out',out)
def main():
 rom=get_rom();maps=resolve_maps();stamp=PUBLIC/'.build-stamp.json';fp={'sha256':sha256(rom),'maps':maps,'converter':'apicula-current','worldmap':'render-v2'}
 raw=TMP/'raw';shutil.rmtree(raw,ignore_errors=True)
 run(sys.executable,ROOT/'tools/hgss/extract_rom.py',str(rom),'--out',str(raw),'--maps',maps)
 shutil.rmtree(PUBLIC,ignore_errors=True);PUBLIC.mkdir(parents=True,exist_ok=True)
 copy_any(raw/'maps',PUBLIC/'maps');copy_any(raw/'nitrofs',PUBLIC/'nitrofs')
 convert_map_models(maps);render_world_map();stamp.write_text(json.dumps(fp,indent=2)+'\n')
 print(f'[HGSS] Build terminé: {len(maps.split(","))} maps Johto',flush=True);return 0
if __name__=='__main__':raise SystemExit(main())
