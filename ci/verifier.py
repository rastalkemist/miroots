#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verifier — les controles du depot, sans rien a installer.

Ce fichier vit DANS le depot public et ne porte aucune reference : il ne
compare pas a une liste de valeurs attendues, il verifie des proprietes
structurelles. Un controle qui porte sa propre copie de la reference finit par
mesurer contre elle.

  A  JETONS      tout `var(--x)` employe est declare quelque part            REFUS
  B  COULEURS    la feuille de style n'ecrit aucune couleur en dur           REFUS
  C  TAILLES     la feuille de style n'ecrit aucune taille de police en dur  REFUS
  D  COMMENTAIRES  un commentaire ne porte que ce qui sert a intervenir      REFUS

Sens de l'echec : le refus. Sortie 1 des qu'un controle refuse.
Usage : python3 verifier.py [dossier]
"""
import pathlib
import re
import sys

# La feuille qui EMPLOIE les jetons, et celle qui les DECLARE.
FEUILLE = "roots.css"
JETONS = "roots-tokens.css"

# Ce qu'un commentaire ne doit pas porter. Categories generiques : aucune
# valeur propre au projet n'est inscrite ici.
MOTIFS = [
    ("premiere personne",
     r"\b(nous|notre|nos|moi|je|j'ai|mon|ma|mes)\b"),
    ("aveu qu'un dispositif n'est pas en place",
     r"n'est (?:pas|plus) (?:encore )?(?:tenue?|branch|pos|appliqu|impl)"),
    # Une plage numerique (« 5-12 % ») n'est pas une date : le jour sur deux
    # chiffres et la barre oblique sont exiges pour la forme courte.
    ("date",
     r"\b[0-3]\d/[01]\d(?:/(?:20)?\d\d)?\b|\b20\d\d-[01]\d-[0-3]\d\b"),
    ("note a faire",
     r"\b(TODO|FIXME|(?:à|a) faire\b|reste (?:à|a) faire\b|pas encore\b|"
     r"non branch)"),
    ("renvoi vers un instrument ou un document interne",
     r"\b\w+\.(py|sh|sql|md)\b|\bvoir (la note|le document|le carnet)"),
    ("recit d'un evenement de travail",
     r"\b(l'audit|la contre-épreuve|le défaut|le relevé|"
     r"la version antérieure|jusqu'au|corrigé le|posé le|relevé le|"
     r"avait perdu|n'aurait pas dû|a été corrigé)\b"),
    ("reference a une decision",
     r"tranch[ée]_(par|le)|act[ée]_(par|le)|\b(acté par|tranché par|"
     r"décision de|validé par|arbitr(é|age) du)\b"),
]
# Vocabulaire technique legitime, qui ne doit pas faire rougir.
TEMOINS = [
    r"par défaut", r"par defaut", r"valeur par défaut",
    r"\bpx\b", r"\bem\b", r"navigateur",
]


def commentaires(txt, suffixe):
    """Rend (numero de ligne, texte) pour chaque ligne de commentaire."""
    out = []
    if suffixe == ".css":
        for m in re.finditer(r"/\*.*?\*/", txt, re.S):
            depart = txt[:m.start()].count("\n") + 1
            for i, l in enumerate(m.group(0).splitlines()):
                out.append((depart + i, l))
    else:
        for i, l in enumerate(txt.splitlines(), 1):
            m = re.search(r"//(.*)$|/\*(.*?)\*/", l)
            if m:
                out.append((i, m.group(0)))
    return out


def controle_a(d, dire, mal):
    """Tout jeton employe est declare."""
    css = "".join((d / f).read_text(encoding="utf-8")
                  for f in (FEUILLE, JETONS) if (d / f).exists())
    if not css:
        return mal(f"A · ni {FEUILLE} ni {JETONS} ne sont lisibles.")
    # Un jeton cite en exemple dans un commentaire n'est pas un jeton employe.
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    employes = set(re.findall(r"var\(\s*(--[\w-]+)", css))
    declares = set(re.findall(r"(--[\w-]+)\s*:", css))
    manque = sorted(employes - declares)
    dire(f"A · jetons employés {len(employes)} · déclarés {len(declares)} · "
         f"manquants {len(manque)}")
    for j in manque[:12]:
        mal(f"A · `{j}` est employé et n'est déclaré nulle part.")
    if len(manque) > 12:
        mal(f"A · … et {len(manque) - 12} autres.")


def controle_b(d, dire, mal):
    """La feuille de style n'ecrit aucune couleur."""
    f = d / FEUILLE
    if not f.exists():
        return
    txt = re.sub(r"/\*.*?\*/", "", f.read_text(encoding="utf-8"), flags=re.S)
    # L'hexadecimal ne suffit PAS : une couleur employee sous transparence
    # s'ecrit `rgba(10, 51, 46, .06)` et echappe alors a toute recherche de `#`.
    # Une valeur retiree survit ainsi indefiniment. La forme admise sous
    # transparence est `rgba(var(--jeton-rgb), alpha)`.
    durs = sorted(set(re.findall(r"#[0-9A-Fa-f]{3,8}\b", txt)))
    durs += sorted(set(re.findall(r"(?:rgba?|hsla?)\(\s*[\d.]+[\s,]", txt)))
    dire(f"B · couleurs écrites en dur dans {FEUILLE} : {len(durs)}")
    for c in durs:
        mal(f"B · `{c.strip()}` est écrit en dur. Une couleur passe par son jeton — "
            f"sous transparence, `rgba(var(--jeton-rgb), alpha)`.")


def controle_c(d, dire, mal):
    """La feuille de style n'ecrit aucune taille de police."""
    f = d / FEUILLE
    if not f.exists():
        return
    txt = re.sub(r"/\*.*?\*/", "", f.read_text(encoding="utf-8"), flags=re.S)
    durs = re.findall(r"font-size:\s*([0-9.]+)px", txt)
    dire(f"C · tailles de police écrites en dur dans {FEUILLE} : {len(durs)}")
    for t in sorted(set(durs)):
        mal(f"C · `font-size: {t}px` est écrit en dur. Une taille prend un jeton.")


def controle_d(d, dire, mal):
    """Un commentaire ne porte que ce qui sert a intervenir."""
    n = 0
    for f in sorted(d.glob("*.css")) + sorted(d.glob("*.js")):
        txt = f.read_text(encoding="utf-8")
        for ligne, contenu in commentaires(txt, f.suffix):
            if any(re.search(t, contenu, re.I) for t in TEMOINS) and \
               not re.search(r"\b(nous|notre|nos)\b", contenu, re.I):
                continue
            for nom, motif in MOTIFS:
                if re.search(motif, contenu, re.I):
                    mal(f"D · {f.name}:{ligne} · {nom} · "
                        f"{contenu.strip()[:70]}")
                    n += 1
                    break
    dire(f"D · commentaires refusés : {n}")


DEFAUTS = [
    ("A", {FEUILLE: "a { color: var(--jeton-absent); }", JETONS: ":root{--x:1;}"}),
    ("B", {FEUILLE: "a { color: #C1502A; }", JETONS: ":root{--x:1;}"}),
    ("B", {FEUILLE: "a { box-shadow: 0 1px 2px rgba(10, 51, 46, .06); }",
           JETONS: ":root{--x:1;}"}),
    ("C", {FEUILLE: "a { font-size: 19px; }", JETONS: ":root{--x:1;}"}),
    ("D", {FEUILLE: "/* nous gardons cette regle */\na{color:var(--x);}",
           JETONS: ":root{--x:1;}"}),
]
SAIN = {FEUILLE: "/* La pilule ne descend pas sous 44 px : cible tactile. */\n"
                 "a { color: var(--encre); font-size: var(--t-corps); }",
        JETONS: ":root { --encre: #1A1A1A; --t-corps: 16px; }"}


def epreuve():
    """Pose des defauts volontaires et verifie qu'ils sont vus."""
    import tempfile
    vus = 0
    print("=== ÉPREUVE — le contrôle voit-il ce qu'il prétend voir ? ===\n")
    for lettre, fichiers in DEFAUTS:
        with tempfile.TemporaryDirectory() as t:
            d = pathlib.Path(t)
            for nom, txt in fichiers.items():
                (d / nom).write_text(txt, encoding="utf-8")
            pris = []
            for c in (controle_a, controle_b, controle_c, controle_d):
                c(d, lambda _: None, pris.append)
            ok = any(p.startswith(lettre + " ") for p in pris)
            vus += ok
            print(f"  {'✓' if ok else '✗'} défaut {lettre} · "
                  f"{'vu' if ok else 'PASSÉ INAPERÇU'} · {len(pris)} refus levé(s)")
    with tempfile.TemporaryDirectory() as t:
        d = pathlib.Path(t)
        for nom, txt in SAIN.items():
            (d / nom).write_text(txt, encoding="utf-8")
        pris = []
        for c in (controle_a, controle_b, controle_c, controle_d):
            c(d, lambda _: None, pris.append)
        ok = not pris
        vus += ok
        print(f"  {'✓' if ok else '✗'} cas sain · "
              f"{'aucun refus' if ok else 'FAUX REFUS : ' + ' | '.join(pris)}")
    print(f"\n=== {vus} / {len(DEFAUTS) + 1} ===")
    return 0 if vus == len(DEFAUTS) + 1 else 1


def main(argv):
    if len(argv) > 1 and argv[1] == "--epreuve":
        return epreuve()
    d = pathlib.Path(argv[1] if len(argv) > 1 else ".").resolve()
    lignes, refus = [], []
    dire = lignes.append

    def mal(t):
        lignes.append("  REFUS — " + t)
        refus.append(t)

    print(f"=== CONTRÔLES DU DÉPÔT — {d.name} ===\n")
    for c in (controle_a, controle_b, controle_c, controle_d):
        c(d, dire, mal)
    for l in lignes:
        print(("  " + l) if not l.startswith("  ") else l)
    print()
    if refus:
        print(f"REFUS — {len(refus)} écart(s). Rien ne part tant qu'ils tiennent.")
        return 1
    print("VERT — les quatre contrôles passent.")
    print("ⓘ Ces contrôles vérifient des propriétés, pas du sens. La relecture reste due.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
