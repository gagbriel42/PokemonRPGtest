#!/usr/bin/env python3
"""Extract the HGSS map texture resource archive without committing the ROM.

HGSS keeps map graphics separately from the map NSBMD.  The archive at
NitroFS a/0/4/4 contains the texture resources used by the map models.
This tool copies the NARC entries locally and emits an index so the web
renderer can consume the exact ROM resources instead of invented colours.
"""
from __future__ import annotations
import argparse, json, struct
from pathlib import Path


def u16(b, o): return struct.unpack_from('<H', b, o)[0]
def u32(b, o): return struct.unpack_from('<I', b, o)[0]

def read_fnt(fnt):
    paths=[]
    def walk(did, prefix=''):
        idx=did-0xF000; base=idx*8
        suboff=u32(fnt,base); first=u16(fnt,base+4); pos=suboff; files=[]; dirs=[]
        while True:
            n=fnt[pos]; pos+=1
            if not n: break
            isdir=n&0x80; ln=n&0x7f
            name=fnt[pos:pos+ln].decode('ascii','replace'); pos+=ln
            if isdir: child=u16(fnt,pos); pos+=2; dirs.append((name,child))
            else: files.append(name)
        for i,name in enumerate(files): paths.append((first+i,prefix+name))
        for name,child in dirs: walk(child,prefix+name+'/')
    walk(0xF000); return paths

def extract_nitrofs(rom, out):
    data=rom.read_bytes(); fnt_off=u32(data,0x40); fnt_size=u32(data,0x44); fat_off=u32(data,0x48); fat_size=u32(data,0x4c)
    fnt=data[fnt_off:fnt_off+fnt_size]; fat=data[fat_off:fat_off+fat_size]; root=out/'nitrofs'
    for fid,path in read_fnt(fnt):
        start,end=struct.unpack_from('<II',fat,fid*8); p=root/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data[start:end])

def narc_entries(path):
    data=path.read_bytes()
    if data[:4]!=b'NARC': raise ValueError(f'{path} is not NARC')
    pos=u16(data,0x0c); blocks=[]
    while pos<len(data):
        magic=data[pos:pos+4]; length=u32(data,pos+4)
        if length<8 or pos+length>len(data): raise ValueError('invalid NARC block')
        blocks.append((magic,pos,length)); pos+=length
    btaf=next(x for x in blocks if x[0]==b'BTAF'); gmif=next(x for x in blocks if x[0]==b'GMIF')
    count=u16(data,btaf[1]+8); base=gmif[1]+8; out=[]
    for i in range(count):
        s,e=struct.unpack_from('<II',data,btaf[1]+12+i*8); out.append(data[base+s:base+e])
    return out

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('rom',type=Path); ap.add_argument('--out',type=Path,default=Path('apps/web/public/assets/hgss/generated')); ap.add_argument('--maps',default='30')
    a=ap.parse_args(); rom=a.rom.expanduser().resolve()
    if not rom.is_file(): raise SystemExit(f'ROM introuvable: {rom}')
    # Reuse the normal extractor so the exact ROM NitroFS is available.
    extract_nitrofs(rom,a.out)
    src=a.out/'nitrofs/a/0/4/4'
    if not src.is_file(): raise SystemExit(f'ressource texture introuvable: {src}')
    entries=narc_entries(src); root=a.out/'map-textures'; root.mkdir(parents=True,exist_ok=True)
    index={'source':'a/0/4/4','entry_count':len(entries),'entries':[],'maps':[int(x) for x in a.maps.split(',') if x.strip()]}
    for i,data in enumerate(entries):
        # Keep every resource verbatim.  A later decoder can therefore use the
        # original NCGR/NCLR/NSCR/NSBTX bytes without another ROM extraction.
        p=root/f'{i:04d}.bin'; p.write_bytes(data)
        sig=data[:4].decode('ascii','replace') if len(data)>=4 else ''
        index['entries'].append({'id':i,'file':p.relative_to(a.out).as_posix(),'size':len(data),'signature':sig})
    (root/'index.json').write_text(json.dumps(index,indent=2),encoding='utf-8')
    print(f'Textures HGSS extraites: {len(entries)} ressources depuis a/0/4/4')
    print(f'Index: {root / "index.json"}')

if __name__=='__main__': main()
