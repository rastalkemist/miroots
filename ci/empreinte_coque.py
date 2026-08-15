#!/usr/bin/env python3
"""Regenere la version de la coque a partir du contenu qu'elle sert.

A lancer depuis la racine du depot apres toute modification d'un fichier de
COQUE_FICHIERS. Le controle F refuse une poussee ou la valeur inscrite dans
sw.js ne correspond plus aux fichiers.
"""
import pathlib, re, hashlib, sys

def fichiers(sw):
    """Les noms servis par la coque, litteraux ET portes par une variable.

    Un nom ecrit en clair se lit directement. Un nom porte par une variable — la
    page de repli l'est — se resout sur sa declaration dans le meme fichier :
    sans cette lecture il sort de l'empreinte, la version ne bouge jamais quand
    ce fichier change, et le cache sert indefiniment une page perimee.
    Un identifiant qui ne se resout pas ARRETE l'outil : une empreinte calculee
    sur un ensemble incomplet vaut moins que pas d'empreinte.
    """
    bloc = re.search(r"COQUE_FICHIERS = \[(.*?)\]", sw, re.S)
    if not bloc:
        return []
    corps = bloc.group(1)
    noms = re.findall(r"'([^']+)'", corps)
    for ident in re.findall(r"(?<![\w'])([A-Z_][A-Z0-9_]*)(?![\w'])", corps):
        decl = re.search(r"var\s+" + ident + r"\s*=\s*'([^']+)'", sw)
        if not decl:
            raise SystemExit("ARRET — " + ident + " est servi par la coque et ne se "
                             "resout sur aucune declaration : l'empreinte porterait "
                             "sur un ensemble incomplet.")
        noms.append(decl.group(1))
    return sorted(set(noms))

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
