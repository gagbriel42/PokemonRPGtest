#!/usr/bin/env python3
from __future__ import annotations
import argparse,math,struct,zlib
from pathlib import Path

def png(w,h,pix):
 raw=b''.join(b'\0'+bytes(pix[y*w*3:(y+1)*w*3]) for y in range(h))
 def ch(t,d):
  import struct,zlib
  return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 return b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b'')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--assets',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
 # This generator deliberately does not invent geography. It creates a clear non-white
 # diagnostic overview from the actual extracted map set until a tile-level renderer is available.
 maps=sorted((Path(a.assets)/'maps').glob('*'),key=lambda p:int(p.name) if p.name.isdigit() else 99999)
 cols=8; cell=128; rows=max(1,math.ceil(len(maps)/cols));w=cols*cell;h=rows*cell
 pix=bytearray([0]*(w*h*3))
 for i,p in enumerate(maps):
  x=(i%cols)*cell;y=(i//cols)*cell
  seed=sum(p.name.encode())
  # visible, deterministic map cards derived from real map IDs; never pretend these are geography.
  for yy in range(cell):
   for xx in range(cell):
    q=(seed+xx//16*7+yy//16*11)%64
    k=((y+yy)*w+(x+xx))*3; pix[k:k+3]=bytes((48+q,72+q,48+q//2))
 out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(png(w,h,pix))
 print(f'[HGSS] Diagnostic map overview: {len(maps)} extracted maps -> {out}')
if __name__=='__main__':main()
