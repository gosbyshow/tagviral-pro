# 🔥 TagViral Pro

Générateur & détecteur de **tags viraux pour YouTube Shorts et vidéos**, avec une base de données qui **se met à jour automatiquement tous les 15 jours**.

![Version](https://img.shields.io/badge/version-2026.11.16-red) ![MAJ](https://img.shields.io/badge/MAJ-auto%20%2F%2015j-green) ![Licence](https://img.shields.io/badge/licence-MIT-blue)

---

## ✨ Fonctionnalités

| Onglet | Ce qu'il fait |
|---|---|
| ⚡ **Générateur** | Applique la formule en 3 niveaux (large → niche → longue traîne) et note chaque tag sur 100 |
| 📈 **Tags Tendances** | 200+ tags classés par niche + tags saisonniers, recherche et tri par score |
| 🎬 **Tendances** | Formats viraux du moment (mini-vlogs, faceless IA, audio tendance…) |
| ✍️ **Titres** | 15 formules à fort taux de clic + analyseur de titre noté sur 100 |
| 💡 **Conseils SEO** | 10 règles appliquées par les créateurs à +1M de vues |
| 🧠 **Tags par IA** | Analyse locale d'un titre/description/transcription par Qwen2.5-0.5B, puis rapprochement avec la base de tags |
| 🔄 **Mises à jour** | Suivi de version, prochaine MAJ, tags saisonniers détectés |

## 🧠 Analyse IA (expérimentale)

L'onglet **Tags par IA** peut charger `onnx-community/Qwen2.5-0.5B-Instruct` dans le navigateur avec Transformers.js. Le modèle s'exécute sur l'appareil (WebGPU si possible, sinon WASM) et le premier chargement nécessite Internet ; les fichiers du modèle (~plusieurs centaines de Mo selon la quantification) sont ensuite mis en cache par le navigateur. L'usage du CDN et de Hugging Face est requis pour télécharger la bibliothèque/le modèle, donc ce module n'est pas hors ligne au premier usage. L'IA ne récupère pas les tags d'une URL YouTube et ne mesure pas leur popularité : elle extrait des mots-clés du texte saisi, puis les rapproche approximativement de `data/tags.json`. Vérifiez toujours les suggestions. La transcription et l'analyse d'images sont expérimentales et dépendent du navigateur, des codecs et des modèles téléchargés.

## 🔄 Comment fonctionne la mise à jour automatique (tous les 15 jours)

```
GitHub Actions (cron : 1er et 16 du mois, 06:00 UTC)
        │
        ├─► node scripts/update.mjs
        │     ├─ incrémente le cycle + la version (ex. 2026.12.01-c4)
        │     ├─ détecte les ÉVÉNEMENTS SAISONNIERS actifs
        │     │   Noël · Halloween · Nouvel An · été · rentrée ·
        │     │   Saint-Valentin · Pâques · Black Friday · soldes · Coupe du monde
        │     ├─ injecte les tags correspondants
        │     └─ recalcule les statistiques
        │
        ├─► commit  data/tags.json · data/tags.js · data/version.json
        └─► déploiement GitHub Pages (≈ 1 min)
```

Côté navigateur, l'application compare sa version à `data/version.json` **au démarrage puis toutes les 6 h** : si une nouvelle version existe, un badge **« 🔄 Nouvelle version disponible »** apparaît dans l'en-tête.

## 🚀 Mise en ligne (5 minutes)

### 1. Créer le dépôt
```bash
cd tagviral-pro
git init
git add .
git commit -m "feat: TagViral Pro v1"
git branch -M main
git remote add origin https://github.com/<VOTRE_COMPTE>/tagviral-pro.git
git push -u origin main
```

### 2. Activer les droits d'écriture
**Settings → Actions → General → Workflow permissions** → cocher **Read and write permissions** → *Save*.
*(Sans ça, le job ne pourra pas committer la mise à jour.)*

### 3. Activer GitHub Pages
**Settings → Pages → Build and deployment**
- Source : **Deploy from a branch**
- Branch : **gh-pages** / **(root)** → *Save*

Le workflow crée la branche `gh-pages` au premier passage.

### 4. Premier passage
**Actions → TagViral — Mise à jour 15 jours → Run workflow**.
Au bout d'une minute, le site est en ligne sur :
`https://<VOTRE_COMPTE>.github.io/tagviral-pro/`

## 🛠️ Mettre à jour la base à la main

Éditez simplement **`data/tags.json`**, puis :

```bash
node scripts/update.mjs          # régénère tags.js + version.json
git add . && git commit -m "data: nouveaux tags" && git push
```

Le déploiement est immédiat. Inutile de toucher à `index.html`.

### Structure d'une entrée de tag
```json
"Gaming": [ ["#GamingShorts", 92], ["#fortnite", 88] ]
```
Le second nombre est le **score de viralité** (0-100) : ≥ 88 = vert, ≥ 82 = jaune, en dessous = orange.

### Ajouter un événement saisonnier
Dans `scripts/update.mjs`, tableau `SEASONS` :
```js
{
  id: 'ramadan', label: 'Ramadan', emoji: '🌙',
  start: [2, 15], end: [3, 20],
  tags: [['#Ramadan2026', 91], ['#RamadanShorts', 88]]
}
```
Les tags n'apparaissent dans l'app **que pendant la fenêtre de dates** — et disparaissent tout seuls après.

## 📴 Utilisation hors-ligne

Le fichier `data/tags.js` embarque la base complète : ouvrez `index.html` par double-clic, tout fonctionne sans serveur ni connexion. Seule la détection de nouvelle version nécessite internet.

## ⏱️ Changer la fréquence

Dans `.github/workflows/update.yml` :

| Fréquence | cron |
|---|---|
| Tous les 15 jours (1er & 16) | `0 6 1,16 * *` ← actuel |
| 1 fois par mois | `0 6 1 * *` |
| Toutes les semaines | `0 6 * * 1` |
| Tous les 3 jours | `0 6 */3 * *` |

> ⚠️ GitHub peut décaler un cron de quelques minutes à quelques heures en cas de forte charge — sans conséquence ici.

## 📁 Structure

```
tagviral-pro/
├── index.html                     ← l'application (aucune dépendance)
├── data/
│   ├── tags.json                  ← LA SOURCE À ÉDITER (tags, tendances, formules, conseils)
│   ├── tags.js                    ← généré automatiquement
│   └── version.json               ← généré automatiquement
├── scripts/
│   └── update.mjs                 ← moteur de mise à jour + saisonnalité
└── .github/workflows/
    └── update.yml                 ← cron 15 jours + déploiement Pages
```

## Licence

MIT — usage personnel et commercial libre.
