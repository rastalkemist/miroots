#!/usr/bin/env python3
"""Tient la VERSION de la coque alignee sur le contenu qu'elle sert.

La coque nomme ses caches d'apres la VERSION inscrite dans sw.js. Servir un
fichier modifie sans changer cette valeur laisse tout appareil deja equipe
sur l'ancienne copie, sans signal. Cet outil recalcule l'empreinte attendue
et reecrit la valeur si elle ne repond plus.

L'EMPREINTE : sha256 du nom puis des octets de chaque fichier de
COQUE_FICHIERS, dans l'ordre ou la liste les nomme, identifiants resolus en
dernier, tronque a seize caracteres. sw.js en est exclu — il porte la valeur
et ne peut pas se mesurer lui-meme. Modifier l'un de ces choix change toutes
les empreintes a la fois : la valeur servie et celle attendue divergeraient
chez quiconque calcule avec l'autre recette.

UN FICHIER LISTE MAIS ABSENT ARRETE L'OUTIL : le prechargement de la coque
echoue en bloc sur une seule adresse morte, et une empreinte posee sur cet
etat scellerait une installation qui ne peut pas reussir.

MODES : sans option, reecrit sw.js si necessaire et rend 0. Avec --verifier,
ne touche a rien et rend 1 si la valeur inscrite ne repond pas — c'est la
forme qui sert de barriere. Le chemin du depot se donne en premier argument
libre, racine courante par defaut.
"""
import pathlib, re, hashlib, sys

LONGUEUR = 16


def fichiers(sw):
    """Les noms servis par la coque : les litteraux dans leur ordre, puis les
    identifiants, resolus sur leur declaration dans le meme fichier. Un
    identifiant qui ne se resout pas arrete l'outil — une empreinte calculee
    sur un ensemble incomplet vaut moins que pas d'empreinte."""
    bloc = re.search(r"COQUE_FICHIERS\s*=\s*\[(.*?)\]", sw, re.S)
    if not bloc:
        raise SystemExit("ARRET — aucune liste COQUE_FICHIERS dans sw.js.")
    corps = bloc.group(1)
    noms = re.findall(r"'([^']+)'", corps)
    for ident in re.findall(r"(?<![\w'])([A-Z_][A-Z0-9_]*)(?![\w'])", corps):
        decl = re.search(r"var\s+" + ident + r"\s*=\s*'([^']+)'", sw)
        if not decl:
            raise SystemExit("ARRET — " + ident + " est servi par la coque et ne "
                             "se resout sur aucune declaration.")
        noms.append(decl.group(1))
    return noms


def empreinte(racine, noms):
    h = hashlib.sha256()
    absents = [n for n in noms if not (racine / n).exists()]
    if absents:
        raise SystemExit("ARRET — liste(s) sans fichier : " + ", ".join(absents)
                         + ". Le prechargement echouerait en bloc.")
    for n in noms:
        h.update(n.encode("utf-8"))
        h.update((racine / n).read_bytes())
    return h.hexdigest()[:LONGUEUR]


def main():
    args = [a for a in sys.argv[1:] if a != "--verifier"]
    verifier = "--verifier" in sys.argv[1:]
    racine = pathlib.Path(args[0] if args else ".")
    p = racine / "sw.js"
    s = p.read_text(encoding="utf-8")
    # La coque doit porter UNE declaration, et une seule. Un marqueur de fusion
    # laisse deux versions l'une sous l'autre : le fichier cesse d'etre
    # analysable, la SECONDE declaration est celle qui s'execute, et reecrire la
    # premiere revient a poser une valeur que la machine n'emploie pas.
    if re.search(r"^<{7} |^>{7} ", s, re.M):
        raise SystemExit("ARRET — sw.js porte un marqueur de fusion non resolu. "
                         "Le resoudre avant de reposer la VERSION.")
    if len(re.findall(r"^var\s+VERSION\s*=", s, re.M)) != 1:
        raise SystemExit("ARRET — sw.js ne porte pas exactement une declaration "
                         "de VERSION. La derniere est celle qui s'execute.")
    attendue = empreinte(racine, fichiers(s))
    actuelle = re.search(r"VERSION\s*=\s*'([^']*)'", s).group(1)
    if attendue == actuelle:
        print("coque a jour :", actuelle)
        return 0
    if verifier:
        print("coque perimee :", actuelle, "attendue :", attendue)
        return 1
    p.write_text(re.sub(r"VERSION\s*=\s*'[^']*'",
                        "VERSION   = '%s'" % attendue, s, count=1),
                 encoding="utf-8")
    print("coque regeneree :", actuelle, "->", attendue)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
