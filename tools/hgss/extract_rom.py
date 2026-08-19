#!/usr/bin/env python3
"""Extract real HGSS NitroFS map data from a local SoulSilver ROM.

The ROM is never committed. For each requested map this also decodes the
32x32 movement-permission grid and the BDHC header/counts into JSON so the web
client can use the real map collision/terrain metadata.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, sys
from pathlib import Path

def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
    return h.hexdigest()

def read_fnt(fnt):
    paths=[]
    def walk(did,prefix=''):
        idx=did-0xF000; base=idx*8
        suboff=u32(fnt,base); first=u16(fnt,base+4); pos=suboff; files=[]; dirs=[]
        while True:
            n=fnt[pos]; pos+=1
            if n==0: break
            isdir=n&0x80; ln=n&0x7f; name=fnt[pos:pos+ln].decode('ascii','replace'); pos+=ln
            if isdir:
                child=u16(fnt,pos); pos+=2; dirs.append((name,child))
            else: files.append(name)
        for i,name in enumerate(files): paths.append((first+i,prefix+name))
        for name,child in dirs: walk(child,prefix+name+'/')
    walk(0xF000); return paths

def extract_nitrofs(rom,out):
    b=rom.read_bytes(); fnt_off=u32(b,0x40); fnt_size=u32(b,0x44); fat_off=u32(b,0x48); fat_size=u32(b,0x4c)
    fnt=b[fnt_off:fnt_off+fnt_size]; fat=b[fat_off:fat_off+fat_size]; files=[]
    for fid,path in read_fnt(fnt):
        s,e=struct.unpack_from('<II',fat,fid*8); dst=out/'nitrofs'/path; dst.parent.mkdir(parents=True,exist_ok=True); dst.write_bytes(b[s:e]); files.append(path)
    return files

def narc_entries(path):
    b=path.read_bytes(); blocks=[]; pos=u16(b,0x0c)
    while pos<len(b):
        magic=b[pos:pos+4]; ln=u32(b,pos+4); blocks.append((magic,pos,ln)); pos+=ln
    btaf=next(x for x in blocks if x[0]==b'BTAF'); gmif=next(x for x in blocks if x[0]==b'GMIF'); n=u16(b,btaf[1]+8); base=gmif[1]+8
    return [b[base+s:base+e] for s,e in [struct.unpack_from('<II',b,btaf[1]+12+i*8) for i in range(n)]]

def decode_per(raw):
    if len(raw)<2048: raise ValueError(f'PER trop court: {len(raw)}')
    cells=[]
    for i in range(1024):
        v=u16(raw,i*2); cells.append({'x':i%32,'y':31-i//32,'value':v,'blocked':bool(v&0x80),'special':v&0x7f})
    return cells

def decode_bdhc(raw):
    if len(raw)<16 or raw[:4] != b'BDHC': return {'present':False}
    counts=struct.unpack_from('<6H',raw,4)
    return {'present':True,'points':counts[0],'inclines':counts[1],'heights':counts[2],'plates':counts[3],'strips':counts[4],'accessLists':counts[5]}

def unpack_mapbin(data,out):
    if len(data)<20: raise ValueError('map container trop court')
    per,bld,nsbmd,bdhc,unknown=struct.unpack_from('<IIIII',data,0); off=20
    bgs_len=len(data)-off-unknown-per-bld-nsbmd-bdhc
    if bgs_len<0: raise ValueError('longueurs map invalides')
    # HGSS order is header, unknown/BGS area, PER, BLD, NSBMD, BDHC.
    parts={'unknown':unknown,'per':per,'bld':bld,'nsbmd':nsbmd,'bdhc':bdhc,'bgs':bgs_len}
    out.mkdir(parents=True,exist_ok=True); meta={'lengths':parts,'total':len(data)}
    for name,ln in [('bgs',bgs_len),('unknown',unknown),('per',per),('bld',bld),('nsbmd',nsbmd),('bdhc',bdhc)]:
        (out/f'{name}.bin').write_bytes(data[off:off+ln]); off+=ln
    perraw=(out/'per.bin').read_bytes(); bdhcraw=(out/'bdhc.bin').read_bytes()
    (out/'permissions.json').write_text(json.dumps({'width':32,'height':32,'cells':decode_per(perraw)},indent=2),encoding='utf-8')
    (out/'terrain.json').write_text(json.dumps(decode_bdhc(bdhcraw),indent=2),encoding='utf-8')
    (out/'manifest.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    return meta

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('rom',type=Path); ap.add_argument('--out',type=Path,default=Path('apps/web/public/assets/hgss/generated')); ap.add_argument('--maps',default='30,57')
    a=ap.parse_args(); rom=a.rom.expanduser().resolve()
    if not rom.is_file() or rom.suffix.lower()!='.nds': print(f'ROM introuvable: {rom}',file=sys.stderr); return 2
    a.out.mkdir(parents=True,exist_ok=True); meta={'source':rom.name,'size':rom.stat().st_size,'sha256':sha256(rom)}
    files=extract_nitrofs(rom,a.out); meta['file_count']=len(files); maps=narc_entries(a.out/'nitrofs/a/0/6/5'); selected={}
    for s in [int(x) for x in a.maps.split(',') if x.strip()]: selected[str(s)]=unpack_mapbin(maps[s],a.out/f'maps/{s}')
    meta['maps']=selected; (a.out/'rom-info.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    print(f'Extraction HGSS terminée: {len(files)} fichiers NitroFS, maps {", ".join(selected)}'); return 0
if __name__=='__main__': raise SystemExit(main())
