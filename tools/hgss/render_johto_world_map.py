#!/usr/bin/env python3
"""Fetch the real HGSS Johto regional map used by the web world map."""
from __future__ import annotations
import argparse
import json
import urllib.error
import urllib.request
from pathlib import Path

SOURCES = [
    ("Bulbagarden Archives / JohtoMap.png", "https://archives.bulbagarden.net/wiki/Special:Redirect/file/JohtoMap.png"),
    ("Wikimedia Commons Johto map fallback", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Johto_Map_%28cropped%29.png/1280px-Johto_Map_%28cropped%29.png"),
]

def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "PokemonRPGtest-HGSS-asset-builder/1.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
        ctype = (r.headers.get("Content-Type") or "").lower()
    if len(data) < 10_000:
        raise RuntimeError(f"image trop petite ({len(data)} octets)")
    if not (data.startswith(b"\x89PNG\r\n\x1a\n") or data.startswith(b"\xff\xd8\xff")):
        raise RuntimeError(f"réponse non-image ({ctype or 'type inconnu'})")
    return data

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--assets", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    errors = []
    for name, url in SOURCES:
        try:
            data = download(url)
            out.write_bytes(data)
            out.with_suffix(".json").write_text(json.dumps({"source": name, "url": url, "bytes": len(data), "generated": True}, indent=2) + "\n", encoding="utf-8")
            print(f"[HGSS] Real Johto map: {name} -> {out} ({len(data)} bytes)", flush=True)
            return 0
        except (OSError, urllib.error.URLError, RuntimeError) as exc:
            errors.append(f"{name}: {exc}")
    raise SystemExit("Impossible de récupérer la vraie carte Johto: " + " | ".join(errors))

if __name__ == "__main__":
    raise SystemExit(main())
