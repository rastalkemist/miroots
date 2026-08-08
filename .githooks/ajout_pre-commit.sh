# ── N. Commentaires : rien que le necessaire a un intervenant ──
# A inserer dans .githooks/pre-commit, avant le bilan final.
CTRL="${ROOTS_OUTILS:-../roots-interne/outils}/controle_commentaire.py"
CODE=$(git diff --cached --name-only --diff-filter=ACMR \
        | grep -E '\.(sql|ts|js|mjs|py|sh|css)$' || true)
if [ -n "$CODE" ]; then
  if [ ! -f "$CTRL" ]; then
    rouge "═══ COMMIT BLOQUÉ ═══"
    echo "Controle de commentaire introuvable : $CTRL"
    FAIL=1
  elif ! python3 "$CTRL" $CODE; then
    rouge "═══ COMMIT BLOQUÉ ═══"
    echo "Un commentaire porte autre chose que le necessaire a un intervenant."
    FAIL=1
  fi
fi
