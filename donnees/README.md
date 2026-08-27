# Données MHX Coaching

Aliments, programmes et recettes pour la plateforme. Rien ici n’est secret.

## aliments.json
510 aliments du quotidien, valeurs pour 100 g. Source unique : **CIQUAL 2025** (ANSES, table FR 2025_11_03, licence Etalab 2.0). Fichier : `Table Ciqual 2025_FR_2025_11_03.xlsx` (DOI 10.57745/RDMHWY). Aucune valeur inventée ; USDA et Open Food Facts non utilisés. Fibres : traces / « < x » = 0. Portions = usage ménager FR, pas 100 g.

## programmes.json
14 programmes originaux (2 à 5 séances, salle / haltères / poids du corps, full-body, half-body, PPL, sèche). Structure identique à `outilProgramme` dans index.html. Pas de copie de bibliothèques commerciales.

## recettes.json
À venir : 40–60 recettes du quotidien, `aliment_id` pointant vers aliments.json.

## Reste à faire
Recettes. Puis brancher ces JSON dans l’app (côté Claude, index.html).
