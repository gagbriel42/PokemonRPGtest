#!/usr/bin/env python3
import argparse,json,struct
from pathlib import Path

def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]

def narc_entries(path):
    d=path.read_bytes(); assert d[:4]==b'NARC'
    p=u16(d,0x0c); blocks=[]
    while p<len(d):
        magic=d[p:p+4]; n=u32(d,p+4); blocks.append((magic,p,n)); p+=n
    btaf=next(x for x in blocks if x[0]==b'BTAF'); gmif=next(x for x in blocks if x[0]==b'GMIF')
    base=gmif[1]+8; count=u16(d,btaf[1]+8); out=[]
    for i in range(count):
        a,b=struct.unpack_from('<II',d,btaf[1]+12+i*8); out.append(d[base+a:base+b])
    return out

def parse(data,out):
    if len(data)<20: raise ValueError('map trop court')
    lens=struct.unpack_from('<5I',data,0); unk,per,bld,nsbmd,bdhc=lens[4],lens[0],lens[1],lens[2],lens[3]
    p=20; end=p+sum(lens)
    if end>len(data): raise ValueError(f'sections invalides: {lens}, taille={len(data)}')
    parts={'unknown':data[p:p+unk]}; p+=unk
    for name,n in [('per',per),('bld',bld),('nsbmd',nsbmd),('bdhc',bdhc)]: parts[name]=data[p:p+n]; p+=n
    out.mkdir(parents=True,exist_ok=True)
    for name,raw in parts.items(): (out/(name+'.bin')).write_bytes(raw)
    if len(parts['per'])!=2048: raise ValueError('PER != 2048')
    if parts['nsbmd'][:4]!=b'BMD0': raise ValueError('NSBMD BMD0 absent')
    cells=[]
    for i in range(1024):
        cells.append({'x':i%32,'y':i//32,'type':parts['per'][2*i],'collision':parts['per'][2*i+1],'blocked':parts['per'][2*i+1]==0x80})
    (out/'permissions.json').write_text(json.dumps({'width':32,'height':32,'cells':cells},indent=2),encoding='utf-8')
    (out/'manifest.json').write_text(json.dumps({'header':{'unknown':unk,'per':per,'bld':bld,'nsbmd':nsbmd,'bdhc':bdhc},'total':len(data)},indent=2),encoding='utf-8')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('narc',type=Path); ap.add_argument('--maps',default='30,57'); ap.add_argument('--out',type=Path,required=True); a=ap.parse_args()
    entries=narc_entries(a.narc)
    for s in a.maps.split(','):
        i=int(s); parse(entries[i],a.out/'maps'/s)
if __name__=='__main__': main()
