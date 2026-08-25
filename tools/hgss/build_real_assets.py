#!/usr/bin/env python3
"""One-click local HGSS asset build for Codespaces.

The ROM is intentionally kept outside Git. The builder automatically:
1. finds SoulSilver.nds if present;
2. otherwise reassembles rom-parts/soulSilver.part000...;
3. extracts NitroFS and the selected maps;
4. reparses HGSS map containers with the corrected 20-byte header parser;
5. copies the useful generated assets into the web public directory.

No command-line arguments are required.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTS = ROOT / "rom-parts"
PUBLIC = ROOT / "apps/web/public/assets/hgss/generated"
TMP = Path("/tmp/pokemon-rpg-hgss")
ROM = TMP / "SoulSilver.nds"
MAPS = os.environ.get("HGSS_MAPS", "30,57")


def run(*args: object) -> None:
    cmd = [str(x) for x in args]
    print("[HGSS]", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def find_rom() -> Path | None:
    env = os.environ.get("HGSS_ROM")
    if env and Path(env).is_file():
        return Path(env).resolve()
    candidates = [ROOT / "SoulSilver.nds", ROOT / "soulsilver.nds", ROOT / "soulSilver.nds"]
    candidates += list(ROOT.glob("*.nds"))
    return next((p.resolve() for p in candidates if p.is_file()), None)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def get_rom() -> Path:
    direct = find_rom()
    if direct:
        print(f"[HGSS] ROM trouvée: {direct}")
        return direct
    parts = sorted(PARTS.glob("soulSilver.part*"))
    if parts:
        print(f"[HGSS] {len(parts)} morceaux trouvés: reconstitution automatique")
        TMP.mkdir(parents=True, exist_ok=True)
        run(sys.executable, ROOT / "tools/hgss/reassemble_rom_parts.py", "--out", ROM)
        return ROM
    raise SystemExit(
        "[HGSS] Aucune ROM SoulSilver trouvée. Placez les fichiers soulSilver.part000... "
        "dans rom-parts/ ou définissez HGSS_ROM."
    )


def main() -> int:
    rom = get_rom()
    fingerprint = {"sha256": sha256(rom), "maps": MAPS}
    stamp = PUBLIC / ".build-stamp.json"
    if stamp.is_file():
        try:
            if json.loads(stamp.read_text(encoding="utf-8")) == fingerprint:
                print("[HGSS] Assets déjà à jour — aucune reconstruction nécessaire.")
                return 0
        except Exception:
            pass

    raw = TMP / "raw"
    corrected = TMP / "corrected"
    if raw.exists(): shutil.rmtree(raw)
    if corrected.exists(): shutil.rmtree(corrected)
    raw.mkdir(parents=True, exist_ok=True)
    corrected.mkdir(parents=True, exist_ok=True)

    run(sys.executable, ROOT / "tools/hgss/extract_rom.py", str(rom), "--out", str(raw), "--maps", MAPS)
    run(
        sys.executable,
        ROOT / "tools/hgss/reparse_mapbin.py",
        str(raw / "nitrofs/a/0/6/5"),
        "--maps",
        MAPS,
        "--out",
        str(corrected),
    )

    if PUBLIC.exists():
        for child in PUBLIC.iterdir():
            if child.name != ".gitkeep":
                shutil.rmtree(child) if child.is_dir() else child.unlink()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copytree(corrected / "maps", PUBLIC / "maps", dirs_exist_ok=True)

    # Keep the extracted NitroFS graphics needed by the map renderer.
    for rel in ("a/0/4/1", "a/0/4/2", "a/0/4/3", "a/0/4/4", "a/0/5/8", "a/0/6/5"):
        src = raw / "nitrofs" / rel
        if src.exists():
            shutil.copytree(src, PUBLIC / "nitrofs" / rel, dirs_exist_ok=True)

    (PUBLIC / ".build-stamp.json").write_text(json.dumps(fingerprint, indent=2) + "\n", encoding="utf-8")
    print(f"[HGSS] Build terminé. Assets disponibles dans {PUBLIC}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
