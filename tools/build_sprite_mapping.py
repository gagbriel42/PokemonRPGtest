#!/usr/bin/env python3
"""Build a non-destructive index and semantic mapping for Pokegra PNGs."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from typing import Any
try:
    from PIL import Image
except ImportError:
    Image = None
ROOT=Path(__file__).resolve().parents[1]
PNG_DIR=ROOT/'tools'/'pokegra'/'png'
PAL_DIR=ROOT/'tools'/'pokegra'/'pal'
OUT_DIR=ROOT/'apps'/'web'/'public'/'data'
OUT_JSON=OUT_DIR/'sprite-assets.json'
OUT_REPORT=OUT_DIR/'sprite-assets-report.json'
OUT_MAPPING=OUT_DIR/'pokemon-gen1-sprite-mapping.json'
GEN1_NAMES=['Bulbizarre','Herbizarre','Florizarre','Salamèche','Reptincel','Dracaufeu','Carapuce','Carabaffe','Tortank','Chenipan','Chrysacier','Papilusion','Aspicot','Coconfort','Dardargnan','Roucool','Roucoups','Roucarnage','Rattata','Rattatac','Piafabec','Rapasdepic','Abo','Arbok','Pikachu','Raichu','Sabelette','Sablaireau','Nidoran♀','Nidorina','Nidoqueen','Nidoran♂','Nidorino','Nidoking','Mélofée','Mélodelfe','Goupix','Feunard','Rondoudou','Grodoudou','Nosferapti','Nosferalto','Mystherbe','Ortide','Rafflesia','Paras','Parasect','Mimitoss','Aéromite','Taupiqueur','Triopikeur','Miaouss','Persian','Psykokwak','Akwakwak','Férosinge','Colossinge','Caninos','Arcanin','Ptitard','Têtarte','Tartard','Abra','Kadabra','Alakazam','Machoc','Machopeur','Mackogneur','Chétiflor','Boustiflor','Empiflor','Tentacool','Tentacruel','Racaillou','Gravalanch','Grolem','Ponyta','Galopa','Ramoloss','Flagadoss','Magnéti','Magnéton','Canarticho','Doduo','Dodrio','Otaria','Lamantine','Tadmorv','Grotadmorv','Kokiyas','Crustabri','Fantominus','Spectrum','Ectoplasma','Onix','Soporifik','Hypnomade','Krabby','Krabboss','Voltorbe','Électrode','Noeunoeuf','Noadkoko','Osselait','Ossatueur','Kicklee','Tygnon','Excelangue','Smogo','Smogogo','Rhinocorne','Rhydon','Leveinard','Tangela','Kangourex','Horsea','Hypocéan','Poissirène','Poissoroy','Stari','Staross','M. Mime','Insécateur','Lippoutou','Élektek','Magmar','Scarabrute','Tauros','Magicarpe','Léviator','Lokhlass','Métamorph','Évoli','Aquali','Voltali','Pyroli','Porygon','Amonita','Amonistar','Kabuto','Kabutops','Ptéra','Ronflex','Artikodin','Électhor','Sulfura','Minidraco','Draco','Dracolosse','Mewtwo','Mew']
def sha256(p:Path)->str:
 h=hashlib.sha256();
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''): h.update(b)
 return h.hexdigest()
def info(p:Path)->dict[str,Any]:
 if Image is None:return {'width':None,'height':None,'mode':None}
 try:
  with Image.open(p) as im:return {'width':im.width,'height':im.height,'mode':im.mode}
 except Exception as e:return {'width':None,'height':None,'mode':None,'error':str(e)}
def main():
 if not PNG_DIR.is_dir():raise SystemExit(f'PNG directory not found: {PNG_DIR}')
 OUT_DIR.mkdir(parents=True,exist_ok=True)
 files=sorted((p for p in PNG_DIR.glob('*.png') if p.stem.isdigit()),key=lambda p:int(p.stem))
 by={int(p.stem):p for p in files}
 assets=[]
 for p in files:
  i=int(p.stem); rel=p.relative_to(ROOT).as_posix(); pal=PAL_DIR/f'{i:04d}.pal'
  assets.append({'assetId':i,'file':rel,'url':'/'+rel,'palette':('/'+pal.relative_to(ROOT).as_posix()) if pal.exists() else None,'sha256':sha256(p),**info(p)})
 def url(i):
  p=by.get(i); return '/'+p.relative_to(ROOT).as_posix() if p else None
 mapping={}; missing=[]
 for dex,name in enumerate(GEN1_NAMES,1):
  base=(dex-1)*6
  e={'nationalDex':dex,'name':name,'archiveBase':base,'front':url(base+3),'back':url(base+1),'frontFemale':url(base+2),'backFemale':url(base),'normalPalette':url(base+4) if False else (f'/tools/pokegra/pal/{base+4:04d}.pal' if (PAL_DIR/f'{base+4:04d}.pal').exists() else None),'shinyPalette':f'/tools/pokegra/pal/{base+5:04d}.pal' if (PAL_DIR/f'{base+5:04d}.pal').exists() else None}
  e['status']='mapped' if e['front'] or e['back'] else 'missing_extracted_image'; mapping[str(dex)]=e
  if e['status']!='mapped':missing.append({'nationalDex':dex,'name':name,'expectedArchiveRange':[base,base+5]})
 payload={'version':3,'generatedBy':'tools/build_sprite_mapping.py','source':'tools/pokegra/png','sourceIsReadOnly':True,'count':len(assets),'assets':assets,'semanticMapping':mapping,'archiveLayout':{'entriesPerPokemon':6,'femaleBackOffset':0,'maleBackOffset':1,'femaleFrontOffset':2,'maleFrontOffset':3,'normalPaletteOffset':4,'shinyPaletteOffset':5}}
 report={'version':3,'pngCount':len(files),'gen1Count':151,'gen1Mapped':151-len(missing),'gen1Missing':missing,'pngFilesModified':False,'mappingMethod':'Deterministic six-entry archive order; PNG files are never rewritten.'}
 OUT_JSON.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');OUT_REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');OUT_MAPPING.write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Pokegra PNG: {len(files)} | Gen 1 mapped: {151-len(missing)}/151 | PNG originals: INTACTS')
if __name__=='__main__':main()
