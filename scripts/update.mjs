#!/usr/bin/env node
/* ============================================================
   TagViral Pro — Script de build & mise à jour automatique
   ------------------------------------------------------------
   Exécuté :
     • automatiquement par GitHub Actions tous les 15 jours
     • ou manuellement :  node scripts/update.mjs

   1. Incrémente le cycle de mise à jour + la version
   2. Calcule les tags SAISONNIERS actifs selon la date du jour
      (Noël, Halloween, rentrée, Coupe du monde…)
   3. Fusionne le tout dans data/tags.json
   4. Génère data/tags.js + data/version.json (consommés par l'app)
   ============================================================ */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

/* ---------- Registre des saisons / événements (éditable) ---------- */
/* mois de 1 à 12, jours inclusifs. "tag" = tag à injecter, "score" = viralité */
const SEASONS = [
  {
    id: 'newyear', label: 'Nouvel An', emoji: '🎆',
    start: [12, 26], end: [1, 12],
    tags: [['#NewYear2026', 92], ['#BonneAnnee', 88], ['#NouvelAn2026', 90],
           ['#NewYearShorts', 89], ['#Resolutions2026', 86], ['#NouvelleAnnee', 85]]
  },
  {
    id: 'valentine', label: 'Saint-Valentin', emoji: '💘',
    start: [2, 5], end: [2, 16],
    tags: [['#SaintValentin', 90], ['#ValentinesDay', 91], ['#ValentineShorts', 87],
           ['#Amour', 86], ['#CoupleGoals', 88]]
  },
  {
    id: 'spring', label: 'Printemps', emoji: '🌸',
    start: [3, 15], end: [5, 5],
    tags: [['#Printemps2026', 84], ['#SpringVibes', 85], ['#Spring2026', 86]]
  },
  {
    id: 'easter', label: 'Pâques', emoji: '🐣',
    start: [3, 25], end: [4, 20],
    tags: [['#Paques2026', 86], ['#EasterShorts', 85], ['#ChasseAuxOeufs', 83]]
  },
  {
    id: 'summer', label: 'Été / vacances', emoji: '🏖️',
    start: [6, 15], end: [8, 31],
    tags: [['#SummerShorts', 92], ['#Ete2026', 89], ['#Vacances', 87],
           ['#SummerVibes', 90], ['#BeachVibes', 86]]
  },
  {
    id: 'backtoschool', label: 'Rentrée', emoji: '🎒',
    start: [8, 20], end: [9, 15],
    tags: [['#Rentree2026', 90], ['#BackToSchool', 92], ['#RentreeScolaire', 86],
           ['#Etudiant', 84]]
  },
  {
    id: 'worldcup', label: 'Coupe du monde / football', emoji: '⚽',
    start: [6, 1], end: [7, 31],
    tags: [['#WorldCup2026', 94], ['#CoupeDuMonde', 90], ['#FootShorts', 87],
           ['#Football2026', 89]]
  },
  {
    id: 'halloween', label: 'Halloween', emoji: '🎃',
    start: [10, 5], end: [11, 5],
    tags: [['#Halloween2026', 94], ['#HalloweenShorts', 92], ['#SpookySeason', 90],
           ['#HalloweenMakeup', 88], ['#Horreur', 85]]
  },
  {
    id: 'blackfriday', label: 'Black Friday', emoji: '🛍️',
    start: [11, 20], end: [12, 2],
    tags: [['#BlackFriday2026', 93], ['#BlackFriday', 91], ['#BonnesAffaires', 86],
           ['#Deals', 88]]
  },
  {
    id: 'christmas', label: 'Noël', emoji: '🎄',
    start: [11, 25], end: [12, 26],
    tags: [['#Noel2026', 94], ['#ChristmasShorts', 93], ['#ChristmasVibes', 91],
           ['#Noel', 90], ['#CadeauxNoel', 86], ['#IdeesCadeaux', 88]]
  },
  {
    id: 'spring_sale', label: 'Soldes', emoji: '🏷️',
    start: [1, 8], end: [2, 10],
    tags: [['#Soldes2026', 87], ['#Soldes', 85], ['#BonPlan', 84]]
  }
];

/* Renvoie true si la date tombe dans la fenêtre (gère le passage d'année) */
function inWindow(date, start, end) {
  const m = date.getMonth() + 1, d = date.getDate();
  const v = m * 100 + d, s = start[0] * 100 + start[1], e = end[0] * 100 + end[1];
  return s <= e ? (v >= s && v <= e) : (v >= s || v <= e);
}

/* ---------- 1. Chargement ---------- */
const file = join(DATA, 'tags.json');
if (!existsSync(file)) {
  console.error('❌ data/tags.json introuvable');
  process.exit(1);
}
const db = readJson(file);

/* ---------- 2. Version & cycle ---------- */
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
db.meta = db.meta || {};
db.meta.cycle = (db.meta.cycle || 0) + 1;
db.meta.githubRun = process.env.GITHUB_RUN_NUMBER || null;
db.meta.version = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-c${db.meta.cycle}`;
db.meta.lastUpdate = today;
db.meta.nextUpdate = new Date(now.getTime() + 15 * 86400000).toISOString().slice(0, 10);
db.meta.autoSeasonal = true;

/* ---------- 3. Saisons actives ---------- */
const active = SEASONS.filter((s) => inWindow(now, s.start, s.end));
const seasonalTags = [];
const seen = new Set();
active.forEach((s) => s.tags.forEach(([t, sc]) => {
  const k = t.toLowerCase();
  if (!seen.has(k)) { seen.add(k); seasonalTags.push([t, sc]); }
}));

db.seasonal = {
  generatedAt: today,
  active: active.map((s) => ({ id: s.id, label: s.label, emoji: s.emoji })),
  label: active.length ? active.map((s) => `${s.emoji} ${s.label}`).join(' · ') : 'Aucun événement saisonnier en cours',
  tags: seasonalTags
};

/* ---------- 4. Stats ---------- */
db.meta.stats = {
  categories: Object.keys(db.categories).length,
  tags: Object.values(db.categories).reduce((a, b) => a + b.length, 0),
  seasonalTags: seasonalTags.length,
  trends: (db.trends || []).length,
  formulas: (db.formulas || []).length,
  tips: (db.tips || []).length
};

/* ---------- 5. Écriture ---------- */
writeJson(file, db);

/* data/tags.js : permet à l'app de charger la base même en local (file://) */
writeFileSync(
  join(DATA, 'tags.js'),
  '/* Généré automatiquement par scripts/update.mjs — ne pas éditer à la main */\n' +
  'window.TAGVIRAL_DATA = ' + JSON.stringify(db) + ';\n'
);

/* data/version.json : utilisé par l'app pour détecter une nouvelle version */
writeJson(join(DATA, 'version.json'), {
  version: db.meta.version,
  lastUpdate: db.meta.lastUpdate,
  nextUpdate: db.meta.nextUpdate,
  cycle: db.meta.cycle,
  stats: db.meta.stats,
  seasonal: db.seasonal.label
});

console.log(`✅ TagViral Pro ${db.meta.version}`);
console.log(`   ${db.meta.stats.tags} tags · ${db.meta.stats.seasonalTags} saisonniers · ${db.meta.stats.trends} tendances`);
console.log(`   Saison active : ${db.seasonal.label}`);
console.log(`   Prochaine mise à jour prévue : ${db.meta.nextUpdate}`);
