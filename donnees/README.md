# Données MHX Coaching

Aliments, programmes et recettes pour la plateforme. Rien ici n’est secret.

## aliments.json
**3111** aliments (valeurs pour 100 g). **3109** viennent de **CIQUAL 2025** (ANSES, table FR 2025_11_03, licence Etalab 2.0, fichier `Table Ciqual 2025_FR_2025_11_03.xlsx`, DOI 10.57745/RDMHWY). **Deux ajouts hors CIQUAL**, macros d’étiquettes FR (pas inventées) :
- `skyr` — Étiquette Yoplait Skyr Nature (100 g), yoplait.fr, 2026
- `whey` — Étiquette Nutripure Whey Isolate Native nature (100 g), nutripure.fr
Régimes : omnivore, vegetarien, vegan, pescetarien, paleo, sans_gluten, sans_lactose, sans_porc (plus de halal/casher). USDA et Open Food Facts non fusionnés ici. Fibres : traces / « < x » = 0. Portions = usage ménager FR, pas 100 g.

## programmes.json
18 programmes originaux (2 à 5 séances, salle / haltères / poids du corps, full-body, half-body, PPL, sèche). Structure identique à `outilProgramme` dans index.html. Pas de copie de bibliothèques commerciales.

## exercices.json
**172** fiches, une par nom d’exercice distinct dans `programmes.json` (18 programmes, 455 occurrences). Cues MHX originales (tutoiement), pas de copie Muscle & Strength / Bodybuilding.com / JEFIT / Alpha Progression / Azeoo. **104** fiches ont un `lien` YouTube watch (démo, pas un catalogue) ; **68** restent vides (match trop incertain). `Gainage latéral` pointe vers **Side Plank Up Down** (variante up-down ; pas de Side Plank simple dans la bibliothèque). Détail : `liens-youtube.md`.

**Join** : `slug(exercice.nom dans programmes.json) == exercices.id`. Le champ `nom` de la fiche est identique au `nom` du programme (accents, libellé).

**Slug** (Python) :

```python
import unicodedata, re
def slug(nom: str) -> str:
    s = unicodedata.normalize('NFD', nom)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')
```

Exemple : `"Développé couché"` → `"developpe-couche"`. Aucune collision de slug sur les 172 noms. Schéma : `id`, `nom`, `groupe`, `muscles`, `materiel`, `niveau`, `type`, `execution`, `erreurs`, `respiration`, `alternatives`, `lien`. Enums `groupe` / `materiel` / `niveau` / `type` documentés dans le fichier (valeurs FR). `alternatives` = 1–3 ids qui existent dans ce même fichier.

## recettes.json
**248** recettes du quotidien (petit-déj / déjeuner / dîner / collation). Paléo petit-déj : 21 (filtre positif). Paléo déjeuner : 18. Vegan petit-déj : 20. Vegan déjeuner : 24. Schéma : `id`, `nom`, `moment`, `temps_min`, `portions`, `ingredients`, `etapes` — **pas** de champs `allergenes` / `regimes` (Claude calcule l’intersection des ingrédients). `aliment_id` pointe vers aliments.json. Macros recalculées par l’app. 0 id manquant.

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

## plan-semaine.md
Spec Claude : plan Jour 1…N (lundi) + liste de courses depuis le plan, groupée par `rayons.json`. Grok ne touche pas `index.html`.
