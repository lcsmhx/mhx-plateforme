# Données MHX Coaching

Aliments, programmes et recettes pour la plateforme. Rien ici n’est secret.

## aliments.json
3109 aliments CIQUAL 2025 (table complète exploitable), valeurs pour 100 g. Source unique : **CIQUAL 2025** (ANSES, table FR 2025_11_03, licence Etalab 2.0). Fichier : `Table Ciqual 2025_FR_2025_11_03.xlsx` (DOI 10.57745/RDMHWY). Régimes : omnivore, vegetarien, vegan, pescetarien, paleo, sans_gluten, sans_lactose, sans_porc (plus de halal/casher). Aucune valeur inventée ; USDA et Open Food Facts non utilisés. Fibres : traces / « < x » = 0. Portions = usage ménager FR, pas 100 g.

## programmes.json
18 programmes originaux (2 à 5 séances, salle / haltères / poids du corps, full-body, half-body, PPL, sèche). Structure identique à `outilProgramme` dans index.html. Pas de copie de bibliothèques commerciales.

## recettes.json
198 recettes du quotidien (petit-déj / déjeuner / dîner / collation). `aliment_id` pointe vers aliments.json. Macros recalculées par l’app.

## Reste à faire
Brancher ces JSON dans l’app (côté Claude, `index.html`).

## aliments-usda.json
8160 aliments USDA FoodData Central (Foundation + SR Legacy), licence CC0. Complément, pas un remplacement de CIQUAL. Ids préfixés \`usda-\`.

## rayons.json
Rayons magasin pour la liste de courses. Chaque rayon liste les `categorie` de `aliments.json`. L’app additionne les ingrédients du plan et les range ici.

## aliments-off.json
12000 produits Open Food Facts vendus en France, macros complètes, ids `off-` + code-barres. Licence ODbL. Complément des 3109 CIQUAL, pas un remplacement.

## generateur.md + plans-exemple.json
Heuristique pour assembler un jour alimentaire à partir des macros MHX (2,2 g P/kg, 1 g L/kg, glucides = reste). Preuve : 3 plans × 7 jours. À porter en JS dans index.html. Pas de solveur, pas d’API payante.
