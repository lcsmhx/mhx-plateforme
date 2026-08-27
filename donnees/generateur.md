# Générateur de plan alimentaire MHX

Spec courte pour **Claude**. À porter en **JavaScript dans `index.html`**.  
**Grok ne touche pas `index.html`.** Ne pas introduire d’API payante, de solveur MILP, ni copier AZEOO. Heuristique simple, tout tient dans le HTML unique, données déjà là (`donnees/aliments.json`, `donnees/recettes.json`, `donnees/rayons.json`).

Preuve : `donnees/plans-exemple.json` (3 profils × 7 jours, `json.tool` OK, 0 id manquant). Générateur Python de référence : `/tmp/gen_plans_mhx.py` (preuve seulement, le runtime app est le JS).

---

## Formules MHX (ne pas changer, ne pas « corriger »)

```
proteines_g = 2.2 * poids_kg
lipides_g   = 1.0 * poids_kg
glucides_g  = (kcal_cibles - proteines_g * 4 - lipides_g * 9) / 4
kcal_aliment = valeurs_pour_100g * grammes / 100
```

Les kcal / P / L / G d’un repas = **somme** des ingrédients via `aliments.json`. Ne jamais inventer une kcal.

---

## Entrées

Profil : `poids_kg`, `kcal_cibles`, `regimes[]`, `allergenes[]`, `nb_jours` (7).

- `regimes` : tags CIQUAL (`omnivore`, `vegetarien`, `vegan`, `pescetarien`, `sans_gluten`, …).
- `allergenes` : tags à exclure (`gluten`, `lait`, `oeufs`, `poissons`, …).
- Végétarien sans gluten = `regimes: ["vegetarien","sans_gluten"]` **et** `allergenes: ["gluten"]`.

---

## Étapes (ordre)

### 1. Filtrer les recettes

Garder une recette si :

1. **Intersection des régimes** : chaque tag du profil est dans `recette.regimes`.
2. **Allergènes** : aucun `recette.allergenes` n’est dans la liste interdite du profil.

Même règle sur un aliment isolé (`aliment.regimes` / `aliment.allergenes`) pour les compléments et le repas ancre.

Pool **végétarien + sans gluten** (preuve actuelle, 165 recettes au total) : **18 PD / 16 déj / 20 dîners / 33 collations** (87 recettes). Cuisine maigre : ancre = blanc d’œuf, fromage blanc 0 %, spécialité laitière riche en protéines, tofu, lentilles cuites, pois chiches cuits. Pas de noix comme ancre.

### 2. Répartition kcal du jour (fixe)

| Moment            | Part |
|-------------------|------|
| `petit_dejeuner`  | 25 % |
| `dejeuner`        | 35 % |
| `diner`           | 30 % |
| `collation`       | 10 % |

Laisser ~6 % de chaque slot pour les rattrapages du §4 (échelle vers `0.94 * slot`).

### 3. Un repas par moment

Pour chaque moment :

1. Tirer une recette de ce moment parmi les filtrées.
2. **Score** (plus haut = mieux), **sans** pénaliser « déjà vue cette semaine » dans le classement qualité :
   - proximité **kcal et macros** du slot après échelle `clamp(kcal_slot / kcal_recette, 0.6, 1.8)` ;
   - **bonus densité P/kcal** ;
   - **malus lipides** si `L/kcal` de la recette est élevé (seuil ~0,055 g L / kcal : omelettes, noix, avocat). Un déficit de L par rapport au slot est aussi pénalisé, pour ne pas ne garder que du fromage blanc 0 %.
3. **Variété** : jamais la même recette **J et J-1**. Tourner dans le **haut du classement** (top ~8), en préférant une recette pas encore vue cette semaine **parmi ce top** — on ne descend pas vers les recettes grasses juste pour varier. Éviter deux repas du même jour ancrés sur la même protéine (blanc d’œuf, tofu, poulet, …).
4. Macros de la recette = somme `aliment × grammes/100`.
5. Mettre à l’échelle **tous** les grammes par  
   `ratio = clamp(kcal_slot / kcal_recette, 0.6, 1.8)`, **plafonné** pour ne pas dépasser ~1,12 × P du slot (le reste du slot se comble avec des glucides, pas en gonflant le blanc d’œuf).
6. Arrondir chaque quantité à **5 g**, minimum **5 g**.
7. Recalculer les macros après arrondi (toujours via CIQUAL).

**Si aucune recette** pour ce moment : composer un **repas ancre maigre** (ids CIQUAL réels, filtrés régimes / allergènes) :

- protéine **maigre** : `blanc-doeuf-cru` | `fromage-blanc-0-mg` | `specialite-laitiere-riche-en-proteines-nature` | `tofu-nature` | `lentilles-vertes-cuites` | `pois-chiche-bouilli-cuit-a-leau` | (omnivore) `poulet-blanc-cru` | `thon-au-naturel-appertise` | `escalope-de-dinde-crue`
- féculent : `riz-blanc-cuit` | `pomme-de-terre-bouillie-cuite-a-leau`
- légume : `brocoli-cru` | `courgette-crue` | `haricot-vert-cru` | `epinard-cru`
- matière grasse : `huile-olive` (**5 g**, pas 10)

Base type : 150 g / 180 g / 200 g / 5 g, puis **même** échelle 0,6–1,8 + arrondi 5 g. `recette_id` = `null`. **Pas d’œuf entier** comme ancre.

### 4. Écart restant sur la journée

Après les 4 repas, recalculer les totaux. Plafond souple : **kcal ≤ cible × 1,05** (viser écart jour **< 6 %**).

Ids **P_KEEP** (ne jamais réduire au trim kcal / trim lipides) :  
`poulet-blanc-grille`, `specialite-laitiere-riche-en-proteines-nature`, `blanc-doeuf-cru`, `thon-au-naturel-appertise`, `fromage-blanc-0-mg`, `tofu-nature`, `lentilles-vertes-cuites`.

1. Si **protéines < cible − 8 g** : ajouter un aliment **maigre** riche en P (filtrés régime / allergène), en collation (ou repas le plus léger si la collation est déjà lourde). Quantité = manque / (P pour 100 g) × 100, arrondi 5 g, bornée par le plafond kcal. Ordre :
   - blanc d’œuf : `blanc-doeuf-cru`
   - fromage blanc 0 % : `fromage-blanc-0-mg`
   - tofu : `tofu-nature` *(sauf si L déjà ≥ cible : trop de lipides)*
   - skyr : `specialite-laitiere-riche-en-proteines-nature`
   - omnivore en plus : `poulet-blanc-grille`, `thon-au-naturel-appertise`
   Si le budget kcal est serré : **libérer des kcal** en réduisant féculents / fruits (pas P_KEEP), puis ajouter le plus efficace (kcal / g de P) : blanc d’œuf, puis fromage blanc 0 %. **Pas des amandes.**
2. Si **lipides < cible − 5 g** : ajouter `huile-olive` (dîner, max ~15 g). Si L reste < cible − 8 g : +10 g au déjeuner. Si le plafond kcal bloque : d’abord retirer des féculents / fruits, **pas** la protéine.
3. Si **glucides < cible − 15 g** et budget kcal OK : ajouter `riz-blanc-cuit` / `pomme-de-terre-bouillie-cuite-a-leau` / fruit (`banane-crue`, `pomme-crue`) / `pates-cuites` — ou `pates-seches-sans-gluten-cuites` si gluten interdit. Sur le repas le plus léger.

Ne **jamais** inventer de kcal : chaque gramme vient d’un `aliment_id` existant.

**Trim après assemblage** (dans cet ordre, 2–3 passes) :

1. **Trim lipides** — si L > cible + 5 g : réduire de **5 g en 5 g** (jamais sous 5 g, **jamais P_KEEP**) les items gras : huile, avocat, fromage **non 0 %**, oléagineux, œuf entier (`oeuf-cru`). Catégories `Matières grasses` / `Oléagineux`, ou `Laitages` avec L ≥ 2 g/100 g, ou L ≥ 15 g/100 g.
2. **Trim kcal** — si kcal > cible × 1,05 : réduire féculents / fruits / huile, **pas P_KEEP**. Ne pas retirer l’huile si L est déjà ≤ cible + 5 g.
3. Si P redescend sous cible − 8 g : rerattraper le P (blanc d’œuf / fromage blanc 0 %, pas des noix).
4. Si P > cible + 8 g : réduire de 5 g en 5 g les ajouts P maigres (`blanc-doeuf-cru`, `fromage-blanc-0-mg`, poulet grillé, …), min 5 g — pour coller au ±8 g sans toucher aux lipides.

Si kcal ou lipides trop hauts : baisser **huile, noix, fromage gras, avocat, œuf entier AVANT** de toucher la protéine.

### 5. Répéter 7 jours

Varier les recettes. Si le pool d’un moment est épuisé (ou le top 8 a tourné), on peut reboucler, **sans** répéter le jour précédent.

### 6. Liste de courses

Pour chaque plan, sommer `aliment_id × grammes` sur les 7 jours. Grouper via `donnees/rayons.json` : `aliment.categorie` → rayon (`categories[]`).

```
liste_courses[] : {
  rayon_id,
  rayon_nom,
  items[{ aliment_id, nom, grammes }]
}
```

Rayons dans l’ordre de `rayons.json`. Items triés par nom, `grammes` = somme arrondie à l’entier. Ne pas omettre un aliment dont la catégorie n’est pas listée : repli rayon `epicerie`.

---

## Sortie d’un jour (pour l’UI)

```
date_index 1..7
repas[] : { moment, recette_id | null, nom, items[{aliment_id, nom, grammes}], kcal, proteines, glucides, lipides }
totaux, cibles, ecart_pct  ( (réel − cible) / cible × 100 )
```

Le plan porte aussi `liste_courses` (§6).

---

## Limites (heuristique, assumées)

- 2,2 g P/kg dans 1650–1900 kcal est tendu : le rattrapage P se fait au blanc d’œuf / fromage blanc 0 % / poulet grillé, **pas** en gonflant les féculents ni les oléagineux.
- Pool **végétarien + sans gluten** agrandi (18 / 16 / 20 / 33). Les omelettes / huile / fruits secs du vieux pool faisaient dériver L ; le score + trim lipides + ancre maigre calent L et P dans ±8 g sur la preuve.
- Bornes d’échelle 0,6–1,8 : on ne dénature pas une recette. Ce n’est pas un solveur d’optimalité.
- Objectif preuve : |écart kcal| < 6 % si possible, P ±8 g, L ±8 g. Si un profil ne peut pas y coller (plafond kcal vs P 2,2 g/kg), le documenter plutôt que d’inventer des macros.

---

## Fichiers

| Fichier | Rôle |
|---------|------|
| `donnees/aliments.json` | CIQUAL 2025, lecture seule |
| `donnees/recettes.json` | 165 recettes, lecture seule côté app |
| `donnees/rayons.json` | catégories CIQUAL → rayons magasin |
| `donnees/plans-exemple.json` | 3 plans générés (preuve) |
| `donnees/generateur.md` | cette spec |

**Interdit ici :** modifier `index.html`, `aliments.json`, `aliments-off.json`, `aliments-usda.json` ; `git commit` / `git push`.

**Toujours : porter en JS, Grok ne touche pas `index.html`.**
