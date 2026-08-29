# Données MHX Coaching

Aliments, programmes et recettes pour la plateforme. Rien ici n’est secret.

## aliments.json
**3111** aliments (valeurs pour 100 g). **3109** viennent de **CIQUAL 2025** (ANSES, table FR 2025_11_03, licence Etalab 2.0, fichier `Table Ciqual 2025_FR_2025_11_03.xlsx`, DOI 10.57745/RDMHWY). **Deux ajouts hors CIQUAL**, macros d’étiquettes FR (pas inventées) :
- `skyr` — Étiquette Yoplait Skyr Nature (100 g), yoplait.fr, 2026
- `whey` — Étiquette Nutripure Whey Isolate Native nature (100 g), nutripure.fr
Régimes : omnivore, vegetarien, vegan, pescetarien, paleo, sans_gluten, sans_lactose, sans_porc (plus de halal/casher). USDA et Open Food Facts non fusionnés ici. Fibres : traces / « < x » = 0. Portions = usage ménager FR, pas 100 g.

## programmes.json
18 programmes originaux (2 à 5 séances, salle / haltères / poids du corps, full-body, half-body, PPL, sèche). Structure identique à `outilProgramme` dans index.html. Pas de copie de bibliothèques commerciales.

## recettes.json
**217** recettes du quotidien (petit-déj / déjeuner / dîner / collation). Paléo déjeuner : 18. Vegan petit-déj : 20. Schéma : `id`, `nom`, `moment`, `temps_min`, `portions`, `ingredients`, `etapes` — **pas** de champs `allergenes` / `regimes` (Claude calcule l’intersection des ingrédients). `aliment_id` pointe vers aliments.json. Macros recalculées par l’app. 0 id manquant.

## correspondances-ids.json
Liste `{ancien, nouveau, note}` pour remplacer les ids courts du tableau Claude par les ids CIQUAL de `aliments.json`. Trois corrections Grok :
- `amandes` → `amande-avec-peau` (pas d’id `amandes`)
- `boeuf-hache-5` → `boeuf-steak-hache-5-mg-cru` (pas `steak-hache-de-boeuf-5-mg-cru`)
- `saumon` → `saumon-elevage-cru` (pas `saumon-cru`)
Les autres mappings Claude sont bons.

## Reste à faire
Brancher ces JSON dans l’app (côté Claude, `index.html`).

## aliments-usda.json
8160 aliments USDA FoodData Central (Foundation + SR Legacy), licence CC0. Complément, pas un remplacement de CIQUAL. Ids préfixés `usda-`.

## rayons.json
Rayons magasin pour la liste de courses. Chaque rayon liste les `categorie` de `aliments.json`. L’app additionne les ingrédients du plan et les range ici.

## aliments-off.json
12000 produits Open Food Facts vendus en France, macros complètes, ids `off-` + code-barres. Licence ODbL. Complément des 3109 CIQUAL (+ skyr/whey étiquettes), pas un remplacement.

## generateur.md + plans-exemple.json
Heuristique pour assembler un jour alimentaire à partir des macros MHX (2,2 g P/kg, 1 g L/kg, glucides = reste). Preuve : 3 plans × 7 jours. À porter en JS dans index.html. Pas de solveur, pas d’API payante.
