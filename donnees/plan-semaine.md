# Plan semaine + liste de courses (spec Claude)

À porter dans `outilNutrition` (`index.html`). **Grok ne touche pas `index.html`.**
Inspiration : process Azeoo (structure seulement). **Pas un clone.** UI **française**. Catalogues **MHX** uniquement (`donnees/recettes.json`, `aliments.json`, `rayons.json`). Ne pas importer recettes/plans du dump.

Formules inchangées : P 2,2 g/kg, L 1,0 g/kg, G = reste. Macros = somme `aliment × grammes / 100`. Jamais stockées comme source de vérité.

---

## Déjà dans l’app (ne pas jeter, à étendre)

`outilNutrition` (clé Store `repas`) gère **une journée type**, pas une semaine :

- Composer / **Générer une journée** (4 créneaux : `petit_dejeuner` 25 %, `dejeuner` 35 %, `diner` 30 %, `collation` 10 %).
- Recettes **figées** (grammes copiés) pour que le client ne suive pas une recette qui change au catalogue.
- **Liste de courses** actuelle : `courses(R, jours)` agrège les ingrédients de **cette seule journée** × `jours_courses` (1–31), groupe par `CONFIG.nutrition.rayons` (= `rayons.json`), cases à cocher, rayon **Divers** si la `categorie` n’est dans aucun rayon.
- Couverture rayons (29 août) : **0 ingrédient de recette hors rayon**. 8 rayons FR.

**Le trou :** ce n’est pas un plan Jour 1…N, pas d’assignation client, et les courses ne viennent pas d’une **semaine réelle** (elles recopient N fois le même jour).

---

## Cible produit (Lucas)

### Coach — plan alimentaire

- Un **plan** a une durée en jours (7, 14, 28…). **Pas d’objet Semaine** : les jours défilent. Jour 1 = **lundi**, Jour 2 = mardi, … Jour 7 = dimanche, Jour 8 = lundi semaine 2.
- Grille scrollable de **cartes Jour n + jour de semaine**. Sur chaque carte : **anneau kcal** du jour + barres **Protéines / Glucides / Lipides** (libellés FR, **pas** F/C/P ni Energy/Carbs).
- **+ Ajouter** ouvre les créneaux MHX seulement (pas les 8 slots Azeoo, pas de Questionnaire) :
  1. Petit-déjeuner
  2. Collation
  3. Déjeuner
  4. Dîner
  Une 2ᵉ collation = un 2ᵉ item `moment: "collation"` (ou `collation_2` si tu as besoin de les distinguer à l’écran). Suffisant.
- Contenu d’un créneau, un des trois :
  - **Note** (texte coach)
  - **Recette** (picker `recettes.json`, moment filtré, macros calculées)
  - **Aliment** (picker `aliments.json` + grammes)
- **Assigner** le plan à un client : **copie** dans les données du client (comme un programme sport), pas une référence vivante. Même schéma que `outilProgramme` / bibliothèque.

### Client — liste de courses

- Générée **automatiquement** depuis le **plan assigné**, sur la **semaine affichée** (jours 1–7, 8–14, … ou plage de dates du bandeau).
- Agréger les `aliment_id` identiques, **sommer les grammes**.
- Grouper avec `donnees/rayons.json` (`aliment.categorie` ∈ `rayon.categories`). Hors liste → **Divers**.
- Cases à cocher pendant les courses. **Extras** manuels (ligne libre : nom + grammes optionnel + rayon), stockés côté client seulement.
- La liste **n’est pas un catalogue** : elle est **calculée**. On ne stocke que : cases cochées + extras.

---

## Données à stocker (Store, pas une nouvelle table SQL inventée ici)

```
plan (outil=nutrition, ou entrée bibliothèque puis copie client)
  nom, duree_jours, regime, allergenes[],
  cible: { kcal, proteines, glucides, lipides }   // du profil, pas des totaux repas
  jours: [
    {
      n: 1,                          // 1 = lundi
      repas: [
        {
          moment: "petit_dejeuner" | "collation" | "dejeuner" | "diner",
          moment_nom: "Petit-déjeuner",
          type: "recette" | "aliment" | "note",
          recette_id?: "...",        // si type recette
          aliment_id?: "...",        // si type aliment
          grammes?: 150,             // si type aliment
          note?: "...",              // si type note
          nom: "...",
          ingredients: [             // TOUJOURS figés si recette/aliment
            { aliment_id, nom, categorie, grammes }
          ]
        }
      ]
    }
  ]
```

kcal / P / G / L du jour = somme des `ingredients` via `aliments.json`. Recalculer à l’affichage.

Suivi client (déjà `repas_suivi` à étendre) :

```
{ mange: { "jour-n|aliment_id": true }, courses: { aliment_id: true }, extras: [{ nom, grammes, rayon_id }] }
```

Le plan (recettes / grammes) ne bouge pas quand le client coche « mangé » ou une course.

---

## Courses — algo (remplacer le × journée type dès qu’il y a des `jours[]`)

```
pour chaque jour dans la fenêtre (ex. n=1..7)
  pour chaque repas.ingredients[]
    somme[aliment_id] += grammes
grouper par rayon.json selon categorie
afficher nom, round(grammes) g, checkbox
```

Si le plan n’a encore **qu’une** journée type (données actuelles) : garder le comportement `× jours_courses` pour ne pas casser l’existant, et afficher la mention « quantités de la journée type × N jours ». Dès que `jours.length > 1`, ne plus multiplier : sommer les jours de la fenêtre.

Poids crus (viande, poisson, féculents) — garder la note actuelle.

---

## Génération IA 7 / 14 / 28 jours

Réutiliser `donnees/generateur.md` + preuve `plans-exemple.json`. `|kcal_jour − cible| < 6 %`. Pas la même recette J et J−1. Filtre régimes = **intersection des ingrédients** (pas `recette.regimes`).

Bouton coach : **Générer la semaine** (N jours = durée du plan), puis il édite à la main.

---

## Tests (après import catalogue)

Reprendre `azeoo-dump/claude/TESTS_CREATION.md` **test 3** et **test 7** (ne pas copier le dump dans `donnees/`) :

3. Plan vide 7 jours. Jour 1 : PD + déj + dîner + collation (recettes MHX). Anneau + barres bougent si on change les grammes. Courses : quantités sommées, groupées `rayons.json`, cases.
7. Assigner. Client ouvre Nutrition : 7 jours, pas de bouton Générer. Coche « mangé » → log, le plan ne bouge pas.

---

## Interdits

- Recettes / photos / textes Azeoo. Pas d’appel `app.azeoo.com`.
- Libellés anglais Energy / Carbs / Proteins / Fats / Breakfast / Shopping list.
- Créneau Questionnaire, monétisation, « Enable sharing » Stripe.
- Fusionner `aliments-off.json` / `aliments-usda.json` dans `aliments.json`.
- Clé `service_role`. API payante.
