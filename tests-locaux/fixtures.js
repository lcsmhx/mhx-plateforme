/* Données FICTIVES pour le banc de test local. Aucune donnée réelle.
   Les formes suivent exactement celles écrites par index.html. */
const fs = require("fs");
const path = require("path");

/* Le dossier tests-locaux/ vit a la racine du depot : donnees/ est dans le
   dossier parent. On accepte aussi un depot clone a cote (../mhx-plateforme). */
const REPO = [path.resolve(__dirname, ".."), path.resolve(__dirname, "..", "mhx-plateforme")]
  .find(d => fs.existsSync(path.join(d, "donnees", "aliments.json"))) || path.resolve(__dirname, "..");
const lire = (f) => JSON.parse(fs.readFileSync(path.join(REPO, "donnees", f), "utf8"));

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const AUJ = ilYA(0);
const lundi = (() => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
const jourSem = (k) => { const d = new Date(lundi); d.setDate(lundi.getDate() + k); return iso(d); };
const MOIS = AUJ.slice(0, 7);

const IDS = {
  coach: "00000000-0000-4000-8000-00000000c0ac",
  c1: "00000000-0000-4000-8000-000000000c01",
  c2: "00000000-0000-4000-8000-000000000c02",
  c3: "00000000-0000-4000-8000-000000000c03"
};

const profils = [
  { id: IDS.coach, prenom: "Coach", nom: "Démo", role: "coach", cree_le: "2026-08-01T10:00:00Z" },
  { id: IDS.c1, prenom: "Thomas", nom: "Démo", role: "client", cree_le: "2026-09-01T10:00:00Z" },
  { id: IDS.c2, prenom: "Sarah", nom: "Démo", role: "client", cree_le: "2026-09-05T10:00:00Z" },
  { id: IDS.c3, prenom: "Julien", nom: "Démo", role: "client", cree_le: "2026-09-10T10:00:00Z" }
];

const intakeC1 = {
  nom: "Thomas Démo", age: 32, sexe: "Homme", ville: "Lyon", taille: 180, poids: 83, poids_obj: 78,
  m_taille: 88, m_hanches: 96, objectif: "Perte de poids / sèche", objectif_phrase: "Perdre 5 kg d'ici décembre",
  pret: "8", niveau: "Intermédiaire (6 mois à 2 ans)", lieu: "Salle complète", seances: "4", duree: "60 min",
  journee_type: "Petit-déj : tartines. Midi : sandwich. Soir : pâtes.", nb_repas: "4 repas (3 + une collation)",
  regime_type: "Omnivore", allergenes: "Gluten", sommeil_h: 7, stress: "6", energie: "5", fume: "Non", complet: true
};

const exo = (nom, series, reps, repos, note) => ({ nom, series, reps, repos, note: note || "", lien: "", id: "" });
const programmeC1 = {
  nom: "Bloc 1 — 4 semaines", note: "On installe la technique. Charge secondaire, amplitude complète.",
  debut: ilYA(24), maj: "01/09/2026",
  seances: [
    { nom: "Séance A — Haut du corps", note: "Échauffement 8 min avant.", exercices: [
      exo("Développé couché", "4", "8-10", "90 s", "Descente contrôlée"),
      exo("Tirage vertical", "4", "10-12", "90 s"),
      exo("Élévations latérales", "3", "12-15", "60 s"),
      exo("Curl haltères", "3", "10-12", "60 s") ] },
    { nom: "Séance B — Bas du corps", note: "", exercices: [
      exo("Squat barre", "4", "8-10", "150 s", "Talons au sol"),
      exo("Fentes marchées", "3", "10-12", "90 s"),
      exo("Leg curl", "3", "12-15", "60 s") ] },
    { nom: "Séance C — Corps entier", note: "", exercices: [
      exo("Soulevé de terre roumain", "4", "8-10", "120 s"),
      exo("Développé militaire", "3", "8-10", "90 s"),
      exo("Gainage latéral", "3", "30 s", "30 s") ] },
    { nom: "Séance D — Cardio / mobilité", note: "", exercices: [
      exo("Marche sur place", "1", "10 min", "—"),
      exo("Wall angels", "2", "10", "30 s") ] }
  ],
  objectifs: { mois: MOIS, liste: ["4 entraînements par semaine", "Respecter le plan alimentaire à 90 %", "Atteindre 80 kg"], statuts: ["", "", "non_atteint"] }
};
/* bilans hebdo : la semaine passee est faite, celle en cours non */
const lundiPrec = (() => { const d = new Date(lundi); d.setDate(lundi.getDate() - 7); return iso(d); })();
const dimPrec = (() => { const d = new Date(lundi); d.setDate(lundi.getDate() - 1); return iso(d); })();
const checkinsC1 = { liste: [ { semaine: lundiPrec, fin: dimPrec, envoye_le: dimPrec, reponses: { semaine: "Bonne semaine, un peu fatigué jeudi.", energie: 4, motivation: 4, sommeil: 3, stress: 2, seances: 4, alimentation: "Bien, sauf samedi soir.", reussite: "4 séances tenues", difficulte: "Le sommeil", ajustement: "Non", ajustement_detail: "" } } ] };

const serie = (r, c) => ({ r, c });
const seanceJ = (date, si, nom, exos) => ({ date, si, nom, exos });
const journalC1 = { seances: [
  seanceJ(ilYA(23), 0, "Séance A — Haut du corps", [{ nom: "Développé couché", series: [serie(10, 50), serie(9, 50), serie(8, 50), serie(8, 50)] }]),
  seanceJ(ilYA(21), 1, "Séance B — Bas du corps", [{ nom: "Squat barre", series: [serie(10, 60), serie(10, 60), serie(9, 60)] }]),
  seanceJ(ilYA(16), 0, "Séance A — Haut du corps", [{ nom: "Développé couché", series: [serie(10, 52.5), serie(10, 52.5), serie(9, 52.5), serie(8, 52.5)] }]),
  seanceJ(ilYA(14), 1, "Séance B — Bas du corps", [{ nom: "Squat barre", series: [serie(10, 62.5), serie(10, 62.5), serie(10, 62.5)] }]),
  seanceJ(ilYA(12), 2, "Séance C — Corps entier", [{ nom: "Soulevé de terre roumain", series: [serie(10, 60), serie(10, 60)] }]),
  seanceJ(ilYA(9), 0, "Séance A — Haut du corps", [{ nom: "Développé couché", series: [serie(10, 55), serie(10, 55), serie(10, 55), serie(9, 55)] }]),
  seanceJ(ilYA(7), 1, "Séance B — Bas du corps", [{ nom: "Squat barre", series: [serie(10, 65), serie(10, 65), serie(10, 65)] }]),
  seanceJ(jourSem(0), 0, "Séance A — Haut du corps", [{ nom: "Développé couché", series: [serie(10, 57.5), serie(10, 57.5), serie(9, 57.5), serie(8, 57.5)] }]),
  seanceJ(jourSem(1), 1, "Séance B — Bas du corps", [{ nom: "Squat barre", series: [serie(10, 67.5), serie(10, 67.5), serie(9, 67.5)] }]),
  seanceJ(jourSem(2), 2, "Séance C — Corps entier", [{ nom: "Soulevé de terre roumain", series: [serie(10, 62.5), serie(10, 62.5)] }])
] };

const repasCarte = (moment, moment_nom, ordre, id, nom, ingr, macros) => ({
  moment, moment_nom, ordre, recette_id: id, nom, temps_min: 10,
  etapes: ["Préparer les ingrédients.", "Cuire et assaisonner.", "Servir."],
  ingredients: ingr.map(([n, g]) => ({ aliment_id: "x-" + n.toLowerCase().replace(/[^a-z]+/g, "-"), nom: n, categorie: "Féculents", grammes: g })),
  macros, allergenes: [], inconnus: 0
});
const jourRepas = (nom, k) => ({ nom, manquants: [], complement: null, diagnostic: [], repas: [
  repasCarte("petit_dejeuner", "Petit-déjeuner", 0, "r-pdj-" + k, k % 2 ? "Porridge banane et beurre de cacahuète" : "Œufs brouillés, pain complet, fruit",
    [["Flocons d'avoine", 80], ["Lait demi-écrémé", 250], ["Banane", 120], ["Beurre de cacahuète", 20]], { kcal: 560, proteines: 24, glucides: 78, lipides: 16 }),
  repasCarte("dejeuner", "Déjeuner", 1, "r-dej-" + k, k % 2 ? "Poulet, riz basmati et brocolis" : "Saumon, patate douce et haricots verts",
    [["Blanc de poulet", 180], ["Riz basmati cru", 90], ["Brocoli", 200], ["Huile d'olive", 10]], { kcal: 760, proteines: 58, glucides: 82, lipides: 18 }),
  repasCarte("collation", "Collation", 2, "r-col-" + k, "Skyr, fruits rouges et amandes",
    [["Skyr", 200], ["Fruits rouges", 100], ["Amandes", 15]], { kcal: 280, proteines: 26, glucides: 22, lipides: 9 }),
  repasCarte("diner", "Dîner", 3, "r-din-" + k, k % 2 ? "Bœuf haché 5 %, pâtes complètes et courgettes" : "Omelette, pommes de terre et salade",
    [["Bœuf haché 5 %", 150], ["Pâtes complètes crues", 90], ["Courgette", 200], ["Parmesan", 15]], { kcal: 640, proteines: 52, glucides: 70, lipides: 16 })
] });
const repasC1 = {
  nom: "", note: "Bois 2 L d'eau par jour. Les grammages sont crus.",
  cible: { kcal: 2240, prot: 183, gluc: 231, lip: 83 }, regime: "Omnivore", allergenes: ["gluten"], nb_repas: 4, maj: "01/09/2026",
  jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(jourRepas)
};
const idxJour = (new Date().getDay() + 6) % 7;
const hist = {};
for (let n = 27; n >= 1; n--) hist[ilYA(n)] = { c: n % 5 === 0 ? 2 : n % 3 === 0 ? 3 : 4, p: 4 };
hist[AUJ] = { c: 2, p: 4 };
const repasSuiviC1 = { date: AUJ, mange: { [idxJour + ":0"]: true, [idxJour + ":1"]: true }, courses: {}, joursCourses: {}, hist };

const zones = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const mensC1 = {
  dstart: ilYA(28), pstart: 84.0, zones, affichees: [4, 5], compo_affichee: "mg",
  mesures: [
    { sem: 1, date: ilYA(21), poids: 83.4, vals: { 0: 101, 4: 88.5, 5: 93 }, compo: { mg: 22.8, mm: 61.5 } },
    { sem: 2, date: ilYA(14), poids: 83.0, vals: { 0: 101, 4: 88, 5: 92.5 }, compo: { mg: 22.4, mm: 61.8 } },
    { sem: 3, date: ilYA(7), poids: 82.6, vals: { 0: 100.5, 4: 87.5, 5: 92 }, compo: { mg: 22.0, mm: 62.0 } },
    { sem: 4, date: jourSem(1), poids: 82.4, vals: { 0: 100.5, 4: 87, 5: 91.5 }, compo: { mg: 21.7, mm: 62.2 } }
  ]
};

const complementsC1 = { note: "Whey seulement les jours d'entraînement, si le repas post-séance est loin.", liste: [
  { ref: "whey", nom: "Protéine whey", dose: 30, unite: "g", moment: "Collation ou après la séance", note: "Dans 250 ml d'eau", proteine: true, par100: { kcal: 390, prot: 80, gluc: 6, lip: 6 } },
  { ref: "creatine", nom: "Créatine monohydrate", dose: 3, unite: "g", moment: "Chaque jour, à n'importe quelle heure", note: "", proteine: false, par100: null },
  { ref: "omega3", nom: "Oméga 3", dose: 2, unite: "g", moment: "Pendant un repas", note: "", proteine: false, par100: null }
] };

const formationC1 = {
  coches: { p1a: true, p1b: true, p1c: true, p2a: true, p2b: true, m0a: true, m0b: true, m1a: true, m1b: true, m1c: true },
  ouvert: "m1", lecon: "", challenge: "c1", defis: {}, diete: {}, semaine: 1, jour: 0,
  priorites: { semaine: [{ id: "a1", t: "3 séances", fait: false }], demain: [] }, notes: [], objectifs: []
};

const histProgrammeC1 = { liste: [{ nom: "Bloc 0 — mise en route", du: ilYA(52), au: ilYA(24), contenu: { nom: "Bloc 0 — mise en route", note: "", seances: [
  { nom: "Séance A", note: "", exercices: [exo("Squat gobelet", "3", "12", "60 s"), exo("Pompes", "3", "10", "60 s")] } ] } }] };

const calcC1 = { sexe: "H", age: 32, taille: 180, poids: 83, pas: 8000, heures: 5, objectif: "perte" };

const donnees = [
  [IDS.c1, "intake", intakeC1, ilYA(2)], [IDS.c1, "programme", programmeC1, ilYA(24)], [IDS.c1, "journal", journalC1, jourSem(2)],
  [IDS.c1, "repas", repasC1, ilYA(24)], [IDS.c1, "repas_suivi", repasSuiviC1, AUJ], [IDS.c1, "mens", mensC1, jourSem(1)],
  [IDS.c1, "complements", complementsC1, ilYA(20)], [IDS.c1, "formation", formationC1, ilYA(3)],
  [IDS.c1, "objectifs_faits", { mois: MOIS, faits: [true, false, false] }, ilYA(1)], [IDS.c1, "prefs", { langue: "fr" }, ilYA(10)],
  [IDS.c1, "hist_programme", histProgrammeC1, ilYA(24)], [IDS.c1, "checkins", checkinsC1, ilYA(5)], [IDS.c1, "hist_repas", { liste: [] }, ilYA(24)], [IDS.c1, "calc", calcC1, ilYA(24)],
  /* Sarah : questionnaire fait, mesures, pas de programme ni de diète */
  [IDS.c2, "intake", Object.assign({}, intakeC1, { nom: "Sarah Démo", sexe: "Femme", age: 29, taille: 165, poids: 68.2, poids_obj: 62 }), ilYA(3)],
  [IDS.c2, "mens", { dstart: ilYA(20), pstart: 69.0, zones, affichees: [4, 5], compo_affichee: "mg", mesures: [
    { sem: 1, date: ilYA(13), poids: 68.6, vals: { 4: 74 } }, { sem: 2, date: ilYA(3), poids: 68.2, vals: { 4: 73.5 } }] }, ilYA(3)],
  [IDS.c2, "formation", { coches: { p1a: true }, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, ilYA(3)],
  /* Julien : questionnaire incomplet, inactif depuis 12 jours */
  [IDS.c3, "intake", { nom: "Julien Démo", age: 41, sexe: "Homme", taille: 176, poids: 91.2, complet: false }, ilYA(12)],
  [IDS.c3, "mens", { dstart: ilYA(30), pstart: 92.0, zones, affichees: [4, 5], compo_affichee: "mg", mesures: [{ sem: 1, date: ilYA(23), poids: 91.6, vals: {} }, { sem: 2, date: ilYA(12), poids: 91.2, vals: {} }] }, ilYA(12)],
  /* Coach : ses propres outils */
  [IDS.coach, "intake", { nom: "Coach Démo", complet: true, age: 35, sexe: "Homme", taille: 182, poids: 84, objectif: "Performance / condition physique", niveau: "Avancé (2 ans et +)", lieu: "Salle complète", seances: "5", journee_type: "-", nb_repas: "4 repas (3 + une collation)", regime_type: "Omnivore" }, ilYA(1)]
].map(([user_id, outil, contenu, d]) => ({ user_id, outil, contenu, maj_le: d + "T00:30:00+00:00" }));

const bibliotheque = [
  { id: "b1", coach_id: IDS.coach, nom: "Haut / Bas — 4 séances", note: "", contenu: { type: "entrainement", seances: programmeC1.seances.slice(0, 2) }, cree_le: ilYA(15) + "T09:00:00Z" },
  { id: "b2", coach_id: IDS.coach, nom: "Semaine 2 200 kcal omnivore", note: "", contenu: { type: "repas", jours: repasC1.jours.slice(0, 3) }, cree_le: ilYA(10) + "T09:00:00Z" }
];

/* Catalogue : les fichiers du dépôt (données publiques, pas des données clients). */
const catalogue = {
  aliments: lire("aliments.json").slice(0, 1200),
  recettes: lire("recettes.json").slice(0, 120),
  programmes_types: lire("programmes.json"),
  exercices: lire("exercices.json")
};

const session = (id, email) => ({ access_token: "faux-jeton-" + id.slice(-3), refresh_token: "faux-refresh", token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: { id, email, role: "authenticated" } });

module.exports = { IDS, profils, donnees, bibliotheque, catalogue, session, AUJ };
