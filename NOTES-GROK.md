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
