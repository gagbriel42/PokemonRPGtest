#!/usr/bin/env python3
"""Inspect an HGSS embedded BMD0/MDL0 and expose model/mesh metadata."""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path

U8 = struct.Struct("<B")
U16 = struct.Struct("<H")
U32 = struct.Struct("<I")
S16 = struct.Struct("<h")


def u16(d: bytes, o: int) -> int:
    return U16.unpack_from(d, o)[0]


def u32(d: bytes, o: int) -> int:
    return U32.unpack_from(d, o)[0]


def fx12(v: int) -> float:
    if v & 0x80000000:
        v -= 1 << 32
    return v / 4096.0


def name16(d: bytes, o: int) -> str:
    return d[o:o + 16].split(b"\0", 1)[0].decode("ascii", "replace")


def namelist(d: bytes, o: int, value_size: int = 4) -> dict:
    if o + 4 > len(d):
        raise ValueError(f"NameList hors limites: 0x{o:x}")
    count = d[o + 1]
    size = u16(d, o + 2)
    if size < 4 or o + size > len(d):
        raise ValueError(f"NameList invalide @0x{o:x}: size=0x{size:x}")
    uh = o + 4
    subheader_size = u16(d, uh)
    unknown_size = u16(d, uh + 2)
    unknown = u32(d, uh + 4)
    p = uh + 8 + count * 4
    element_size = u16(d, p)
    data_section_size = u16(d, p + 2)
    p += 4
    values = []
    for i in range(count):
        if p + value_size > len(d):
            break
        values.append(u32(d, p) if value_size == 4 else u16(d, p))
        p += value_size
    names = [name16(d, p + i * 16) for i in range(count) if p + i * 16 + 16 <= len(d)]
    return {
        "offset": o,
        "count": count,
        "size": size,
        "subheader_size": subheader_size,
        "unknown_size": unknown_size,
        "unknown": unknown,
        "element_size": element_size,
        "data_section_size": data_section_size,
        "values": values,
        "names": names,
    }


def find_bmd0(d: bytes) -> int:
    p = d.find(b"BMD0")
    if p < 0:
        raise ValueError("BMD0 introuvable")
    return p


def parse_mesh_list(model: bytes, rel: int) -> dict:
    if not rel or rel + 4 > len(model):
        return {"offset": rel, "meshes": []}
    nl = namelist(model, rel)
    meshes = []
    for i, value in enumerate(nl["values"]):
        mo = rel + value
        if mo + 16 > len(model):
            continue
        dummy, size, unknown, cmds_off, cmds_len = struct.unpack_from("<HHIII", model, mo)
        meshes.append({
            "index": i,
            "name": nl["names"][i] if i < len(nl["names"]) else "",
            "offset": mo,
            "dummy": dummy,
            "header_size": size,
            "unknown": unknown,
            "commands_offset": cmds_off,
            "commands_length": cmds_len,
        })
    return {"offset": rel, "count": nl["count"], "meshes": meshes}


def parse_model(mdl: bytes, rel: int, model_name: str) -> dict:
    if rel + 56 > len(mdl):
        raise ValueError(f"Modèle trop court @0x{rel:x}")
    (
        filesize, render_cmds, materials, meshes, inv_binds,
        unknown0, bone_count, material_count, mesh_count, unknown1,
        up_scale, down_scale, num_verts, num_polys, num_tris, num_quads,
    ) = struct.unpack_from("<IIIII4BIIHHHH", mdl, rel)
    bbox = struct.unpack_from("<iiiiii", mdl, rel + 40)
    return {
        "name": model_name,
        "offset": rel,
        "filesize": filesize,
        "render_commands_offset": render_cmds,
        "materials_offset": materials,
        "meshes_offset": meshes,
        "inverse_binds_offset": inv_binds,
        "bone_matrices": bone_count,
        "materials": material_count,
        "meshes": mesh_count,
        "up_scale": fx12(up_scale),
        "down_scale": fx12(down_scale),
        "vertices": num_verts,
        "polygons": num_polys,
        "triangles": num_tris,
        "quads": num_quads,
        "bbox_fixed12": [fx12(x) for x in bbox],
        "mesh_list": parse_mesh_list(mdl[rel:rel + min(filesize, len(mdl) - rel)], meshes),
    }


def inspect(path: Path) -> dict:
    data = path.read_bytes()
    bmd = find_bmd0(data)
    if bmd + 16 > len(data):
        raise ValueError("BMD0 incomplet")
    bmd_size = u32(data, bmd + 8)
    bmd_end = min(len(data), bmd + bmd_size)
    bmd_data = data[bmd:bmd_end]

    if bmd_data[0:4] != b"BMD0":
        raise ValueError("BMD0 invalide")
    block_count = u16(bmd_data, 14)
    blocks = []
    for i in range(block_count):
        off = u32(bmd_data, 16 + i * 4)
        if off + 8 <= len(bmd_data):
            stamp = bmd_data[off:off + 4].decode("ascii", "replace")
            size = u32(bmd_data, off + 4)
            blocks.append({"index": i, "stamp": stamp, "offset": off, "size": size})

    mdl_off = next((x["offset"] for x in blocks if x["stamp"] == "MDL0"), None)
    result = {"file": str(path), "bmd0_offset": bmd, "bmd0_size": bmd_size, "blocks": blocks, "models": []}
    if mdl_off is None:
        return result

    mdl = bmd_data[mdl_off:]
    if mdl[:4] != b"MDL0":
        return result
    mdl_size = u32(mdl, 4)
    model_dict = namelist(mdl, 8)
    for i, value in enumerate(model_dict["values"]):
        model_rel = value
        if model_rel >= len(mdl):
            continue
        name = model_dict["names"][i] if i < len(model_dict["names"]) else f"model_{i}"
        result["models"].append(parse_model(mdl, model_rel, name))
    result["mdl0"] = {"offset": mdl_off, "size": mdl_size, "model_count": model_dict["count"], "model_names": model_dict["names"]}
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("map_bin", type=Path, help="fichier map .bin")
    ap.add_argument("--json", action="store_true", help="sortie JSON complète")
    args = ap.parse_args()
    result = inspect(args.map_bin)
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return
    print(f"BMD0 @ 0x{result['bmd0_offset']:x}  size=0x{result['bmd0_size']:x}")
    for block in result["blocks"]:
        print(f"  {block['stamp']} @ 0x{block['offset']:x}  size=0x{block['size']:x}")
    for i, model in enumerate(result["models"]):
        print(f"MODEL {i}: {model['name']}")
        print(f"  vertices={model['vertices']} polygons={model['polygons']} triangles={model['triangles']} quads={model['quads']}")
        print(f"  meshes={model['meshes']} materials={model['materials']} bones={model['bone_matrices']}")
        print(f"  bbox={model['bbox_fixed12']}")
        for mesh in model["mesh_list"]["meshes"]:
            print(f"    MESH {mesh['index']}: {mesh['name']} cmds=0x{mesh['commands_length']:x} @0x{mesh['commands_offset']:x}")


if __name__ == "__main__":
    main()
