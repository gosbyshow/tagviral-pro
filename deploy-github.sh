#!/usr/bin/env bash
# ============================================================
#  TagViral Pro — mise en ligne sur GitHub en une commande
#  Usage :  ./deploy-github.sh <votre-compte-github> [nom-du-depot]
# ============================================================
set -e

ACCOUNT="${1:?Usage: ./deploy-github.sh <compte-github> [nom-du-depot]}"
REPO="${2:-tagviral-pro}"
cd "$(dirname "$0")"

echo "🔗 Dépôt cible : https://github.com/$ACCOUNT/$REPO"

if [ ! -d .git ]; then
  git init -q
  git branch -M main 2>/dev/null || true
fi

git add -A
git commit -q -m "feat: TagViral Pro — générateur de tags viraux + MAJ auto 15 jours" || echo "ℹ️  Rien de nouveau à committer"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$ACCOUNT/$REPO.git"
fi

echo "⬆️  Envoi vers GitHub…"
git push -u origin main

cat <<EOF

✅ Code poussé !

Il reste 3 clics sur GitHub (obligatoires, non automatisables sans token) :

  1. Settings → Actions → General → Workflow permissions
     → cocher « Read and write permissions » → Save

  2. Settings → Pages → Source : Deploy from a branch
     → Branch : gh-pages / (root) → Save

  3. Actions → « TagViral — Mise à jour 15 jours » → Run workflow

🌍 Site final : https://$ACCOUNT.github.io/$REPO/
EOF
