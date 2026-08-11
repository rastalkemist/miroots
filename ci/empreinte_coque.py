#!/usr/bin/env python3
"""Regenere la version de la coque a partir du contenu qu'elle sert.

A lancer depuis la racine du depot apres toute modification d'un fichier de
COQUE_FICHIERS. Le controle F refuse une poussee ou la valeur inscrite dans
sw.js ne correspond plus aux fichiers.
"""
import pathlib, re, hashlib, sys

def fichiers(sw):
    bloc = re.search(r"COQUE_FICHIERS = \[(.*?)\]", sw, re.S)
    return sorted(re.findall(r"'([^']+)'", bloc.group(1))) if bloc else []

def empreinte(racine, noms):
    h = hashlib.sha256()
    for n in noms:
        f = racine / n
        h.update(n.encode())
        h.update(f.read_bytes() if f.exists() else b"")
    return h.hexdigest()[:16]

def main():
    racine = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    p = racine / "sw.js"
    s = p.read_text(encoding="utf-8")
    noms = fichiers(s)
    attendue = empreinte(racine, noms)
    actuelle = re.search(r"VERSION\s*=\s*'([^']*)'", s).group(1)
    if attendue == actuelle:
        print("coque a jour :", actuelle); return 0
    p.write_text(re.sub(r"VERSION\s*=\s*'[^']*'",
                        "VERSION   = '%s'" % attendue, s, count=1), encoding="utf-8")
    print("coque regeneree :", actuelle, "->", attendue)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
