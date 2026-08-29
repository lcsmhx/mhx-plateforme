# NOTES — Grok Bot

## 28 août 2026

- Mission nuit : dossier `donnees/` seulement. `index.html` non touché (évite le conflit avec Claude).
- Push GitHub avec jeton `public_repo` (dépôt public). Pas de clé service_role.

### Fait
- `donnees/aliments.json` : 510 aliments, CIQUAL 2025, json.tool OK, ids uniques.
- `donnees/programmes.json` : 14 programmes originaux, structure seance/exo de l’app.
- `donnees/README.md` : sources et trous.

### En cours
- `donnees/recettes.json` : 60 recettes originales, 124 aliments, tous les ids existent.
- `aliments.json` réaligné (502 lignes CIQUAL 2025) pour coller aux ids des recettes (`huile-olive`, `lentilles-vertes-cuites`, `pates-crues`, `yaourt-nature`).

### Questions pour Claude
- Féculents : 11 lignes (riz/pâtes/pain/pomme de terre regroupés dans Produits de base, 78 lignes). Suffisant ?
- Recettes : je les pousse ensuite. Tu peux déjà brancher aliments + programmes.

## 28 août 2026 — suite

- `aliments.json` : **3109** lignes CIQUAL 2025 (table quasi complète, ids recettes inchangés).
- Demande Lucas : **deux modes diète** dans l’app (côté `index.html`, Claude) :
  1. **Manuel** — il compose lui-même (aliments + recettes, macros calculées en live).
  2. **IA auto** — génération seule à partir des macros (kcal / P / L / G, régimes, allergènes).
- Screens d’exemple à venir de Lucas.
- OFF + USDA encore en cours, fichiers séparés à fusionner.

## 28 août 2026 — UI Nutrition (screens Lucas, ancienne app)

À brancher dans `index.html` (Claude). Grok ne touche pas à ce fichier.

### Deux modes diète
1. **Manuel** — le coach (ou le client) compose repas par repas.
2. **IA auto** — génération à partir des macros (kcal, P 2,2 g/kg, L, G), régimes, allergènes. Formules inchangées.

### Écran type (d’après les 6 screens)
- Onglet Nutrition, bandeau de dates (semaine).
- Raccourcis en haut : **Liste de courses** | **Plans alimentaires**.
- Carte du jour : kcal restantes (anneau), glucides / protéines / lipides (barres).
- Plan en cours (nom, période, badge En cours).
- Repas en cartes : petit-déj, collations, déjeuner, dîner, collation entraînement.
- Chaque aliment : nom, quantité (g / ml / c. à c. / portion), kcal, case « mangé », notes coach dans le repas.
- Bouton + pour ajouter un aliment / une recette.

### Liste de courses
- Générée depuis le plan (somme des `aliment_id` × grammes sur la période).
- Grouper avec `donnees/rayons.json` (catégorie CIQUAL → rayon magasin).
- Cases à cocher rayon par rayon. Pas de macros à inventer : tout vient des JSON.

### Données déjà là
- `aliments.json` 3109 CIQUAL, `aliments-usda.json` 8160, `recettes.json` 60, `rayons.json`.
- Open Food Facts FR encore en conversion.

- Lucas : **toute l’UI Nutrition en français** (l’ancienne app est en anglais : Energy/Carbs/Proteins/Fats, Shopping list, Diet plans, In progress). Traduire les libellés, pas copier l’anglais.
- Lucas : l’ancienne app = **inspiration seulement**, pas un clone. Écran MHX original, français. Fonctions à reprendre : vue jour / repas, diète manuelle, diète IA, liste de courses.
- Lucas : **juste fonctionnel**, pas une copie ni un polish. Composer / générer une diète + liste de courses.

## 28 août 2026 — vidéo ancienne app (inspiration, pas clone)

Lucas : **juste fonctionnel**, français, pas la même app.

Vu dans la vidéo (vue client) :
- Nutrition jour : petit-déj / collations / déjeuner / dîner, aliments + notes, case mangé → macros du repas.
- Liste de courses : choisir début/fin, additionner les quantités. Chez eux c’est une liste plate ; **nous** on peut grouper avec `rayons.json`.
- Plan : on assigne un plan existant (durée, recettes), pas de création from scratch à l’écran.

Pas dans la vidéo (demandé à part par Lucas) :
- Mode **manuel** : composer la diète.
- Mode **IA** : générer depuis macros / régimes / allergènes.

Ne pas recopier : accueil, boutique, questionnaires, libellés anglais.

## 28 août 2026 — régimes / recettes / programmes (après-midi)

- `aliments.json` : régimes recalculés. Plus de `halal`/`casher`. Ajout `sans_porc` si l’aliment n’est pas du porc (doute = pas de tag). Macros / ids / noms / source / allergènes inchangés. 3109 aliments, json.tool OK.
- `recettes.json` : champs `allergenes` et `regimes` retirés partout. Schéma : id, nom, moment, temps_min, portions, ingredients, etapes. 198 recettes, 0 aliment_id manquant. Trous vegan+SG PD, vegan dîner, paleo PD/déj (et dîner/collation) bouchés. Claude calcule l’intersection à l’import.
- `programmes.json` : +4 (pas de doublon, pas femme enceinte) : `seniors-3j-equilibre`, `reprise-blessure-3j`, `ppl-6j-avance`, `elastiques-3j-maison`.
- `donnees/generateur.md` : liste des régimes à jour, recettes sans allergenes/regimes.
- Import Supabase = côté Claude. Pas de commit / push. `index.html` non touché.
- QA 28 août : générateur filtre par ingrédients (plus recette.regimes). Plans d’exemple régénérés, |kcal|<6 %.

## 28 août 2026 — fin d’après-midi (recettes paléo/vegan + correspondances)

- `aliments.json` : **3111** lignes (3109 CIQUAL 2025 + `skyr` + `whey`). Skyr / whey = étiquettes, **pas CIQUAL** :
  - `skyr` — Étiquette Yoplait Skyr Nature (100 g), yoplait.fr, 2026
  - `whey` — Étiquette Nutripure Whey Isolate Native nature (100 g), nutripure.fr
- `recettes.json` : **212** recettes (+14 originales FR, portions 1, 0 champ allergenes/regimes, 0 aliment_id manquant, json.tool OK).
  - paléo × déjeuner : **+7** (viande/poisson/œuf + légumes + huile, ids CIQUAL réels). Intersection : **13** déj paléo.
  - vegan × petit-déj : **+7** dont **6 aussi sans gluten** (sarrasin, riz, tofu, lait soja `boisson-au-soja-nature-non-enrichie`). `flocons-davoine` = gluten. Intersection : **20** vegan PD / **14** vegan+SG PD.
- `donnees/correspondances-ids.json` : 44 mappings `{ancien,nouveau,note}` pour le tableau Claude. 3 corrections :
  - `amandes` → `amande-avec-peau` (pas d’id `amandes`)
  - `boeuf-hache-5` → `boeuf-steak-hache-5-mg-cru` (pas `steak-hache-de-boeuf-5-mg-cru`)
  - `saumon` → `saumon-elevage-cru` (pas `saumon-cru`)
  Les autres mappings Claude sont bons (ids vérifiés dans aliments.json).
- Pas de commit / push. `index.html`, `aliments-off.json`, `aliments-usda.json` non touchés.

## 29 août 2026 — exercices.json

- `donnees/exercices.json` : **172** fiches (une par nom distinct de `programmes.json`). Fichier nouveau demandé, **pas** une table SQL inventée ici — Claude / l’app brancheront l’import.
- Join : `slug(nom du programme) == id`. Aucune collision de slug. `lien` vide. Cues originales MHX.
- `index.html` non touché. Poussé sur `main`.

## 29 août 2026 — plan semaine + courses (pour Claude)

Lucas veut les deux mécaniques : **plan alimentaire Jour 1…N** + **liste de courses** depuis le plan assigné.

- Spec : `donnees/plan-semaine.md`. Catalogues MHX only. Pas d’import dump.
- `index.html` **non touché** (règle). À brancher dans `outilNutrition`.
- Déjà là : journée type + `courses()` × N jours + rayons (0 ingrédient hors rayon).
- À faire : cartes Jour 1 = lundi …, créneau = note | recette | aliment, macros calculées, assignation par copie, courses = somme des jours de la semaine (plus « journée × 7 » dès que le plan a plusieurs jours), extras cochés côté client.
- Preuve génération 7 jours : `plans-exemple.json`. Recettes **217**. Exercices **172** dans `exercices.json`.
