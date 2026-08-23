#!/usr/bin/env python3
"""Extract Nintendo DS G3D vertex streams from an HGSS map BMD0.

This first pass decodes the geometry opcodes used by Nitro G3D and writes
OBJ files. It intentionally keeps material/texture handling separate.
"""
from __future__ import annotations

import argparse
import struct
from pathlib import Path

# Nitro G3D command opcodes.
OP = {
    0x14: ("MTX_MODE", 1),
    0x15: ("MTX_PUSH", 0),
    0x16: ("MTX_POP", 1),
    0x17: ("MTX_STORE", 1),
    0x18: ("MTX_RESTORE", 1),
    0x19: ("MTX_IDENTITY", 0),
    0x1A: ("MTX_LOAD_4x4", 16),
    0x1B: ("MTX_LOAD_4x3", 12),
    0x1C: ("MTX_MULT_4x4", 16),
    0x1D: ("MTX_MULT_4x3", 12),
    0x1E: ("MTX_MULT_3x3", 9),
    0x1F: ("MTX_SCALE", 3),
    0x20: ("COLOR", 1),
    0x21: ("NORMAL", 1),
    0x22: ("TEXCOORD", 1),
    0x23: ("VTX_16", 2),
    0x24: ("VTX_10", 1),
    0x25: ("VTX_XY", 1),
    0x26: ("VTX_XZ", 1),
    0x27: ("VTX_YZ", 1),
    0x28: ("VTX_DIFF", 1),
    0x29: ("POLYGON_ATTR", 1),
    0x2A: ("TEXIMAGE_PARAM", 1),
    0x2B: ("PLTT_BASE", 1),
    0x40: ("BEGIN", 1),
    0x41: ("END", 0),
}


def s10(v: int) -> int:
    return v - 1024 if v & 0x200 else v


def fx(v: int, frac: int = 12) -> float:
    return v / float(1 << frac)


def decode_vtx16(params: bytes) -> tuple[float, float, float]:
    x, y, z = struct.unpack_from("<hhh", params, 0)
    return fx(x), fx(y), fx(z)


def decode_vtx10(word: int) -> tuple[float, float, float]:
    x = s10(word & 0x3FF)
    y = s10((word >> 10) & 0x3FF)
    z = s10((word >> 20) & 0x3FF)
    return fx(x, 9), fx(y, 9), fx(z, 9)


def decode_stream(data: bytes) -> tuple[list[tuple[float, float, float]], list[tuple[int, int, int]], list[str]]:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    log: list[str] = []
    cursor = 0
    primitive: int | None = None
    pending: list[int] = []

    while cursor + 4 <= len(data):
        cmd = data[cursor]
        cursor += 4
        if cmd == 0:
            continue
        if cmd not in OP:
            log.append(f"unknown 0x{cmd:02x} @0x{cursor - 4:x}")
            break
        name, words = OP[cmd]
        payload_len = words * 4
        if cursor + payload_len > len(data):
            log.append(f"truncated {name} @0x{cursor - 4:x}")
            break
        payload = data[cursor:cursor + payload_len]
        cursor += payload_len

        if name == "BEGIN":
            primitive = struct.unpack_from("<I", payload)[0] & 3
            pending.clear()
        elif name == "END":
            primitive = None
            pending.clear()
        elif name == "VTX_16":
            v = decode_vtx16(payload)
            vertices.append(v)
            if primitive in (0, 1):
                pending.append(len(vertices) - 1)
                if primitive == 0 and len(pending) >= 3:
                    faces.append(tuple(pending[-3:]))
                elif primitive == 1 and len(pending) >= 4:
                    a, b, c, d = pending[-4:]
                    faces.extend(((a, b, c), (a, c, d)))
        elif name == "VTX_10":
            word = struct.unpack_from("<I", payload)[0]
            vertices.append(decode_vtx10(word))
        elif name in ("VTX_XY", "VTX_XZ", "VTX_YZ", "VTX_DIFF"):
            # Keep these commands visible for the next parser pass; they are
            # stateful and need the previous vertex to reconstruct positions.
            log.append(f"stateful {name} @0x{cursor - payload_len - 4:x}")

    return vertices, faces, log


def find_bmd0(data: bytes) -> int:
    p = data.find(b"BMD0")
    if p < 0:
        raise ValueError("BMD0 introuvable")
    return p


def write_obj(path: Path, vertices: list[tuple[float, float, float]], faces: list[tuple[int, int, int]]) -> None:
    with path.open("w", encoding="utf-8") as f:
        f.write("# HGSS Nitro G3D geometry\n")
        for x, y, z in vertices:
            f.write(f"v {x:.6f} {y:.6f} {z:.6f}\n")
        for a, b, c in faces:
            f.write(f"f {a + 1} {b + 1} {c + 1}\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("map_bin", type=Path)
    ap.add_argument("--out", type=Path, default=Path("hgss_geometry"))
    ap.add_argument("--offset", type=lambda x: int(x, 0), help="offset relatif au BMD0")
    ap.add_argument("--length", type=lambda x: int(x, 0), help="taille du flux de commandes")
    args = ap.parse_args()

    raw = args.map_bin.read_bytes()
    bmd = find_bmd0(raw)
    if args.offset is None or args.length is None:
        raise SystemExit("Indiquer --offset et --length du flux de commandes du mesh.")
    stream = raw[bmd + args.offset:bmd + args.offset + args.length]
    vertices, faces, log = decode_stream(stream)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    write_obj(args.out.with_suffix(".obj"), vertices, faces)
    print(f"vertices={len(vertices)} faces={len(faces)}")
    for line in log[:20]:
        print(line)


if __name__ == "__main__":
    main()
