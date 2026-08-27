# Générateur de plan alimentaire MHX

Spec courte pour **Claude**. À porter en **JavaScript dans `index.html`**.  
**Grok ne touche pas `index.html`.** Ne pas introduire d’API payante, de solveur MILP, ni copier AZEOO. Heuristique simple, tout tient dans le HTML unique, données déjà là (`donnees/aliments.json`, `donnees/recettes.json`).

Preuve : `donnees/plans-exemple.json` (3 profils × 7 jours, `json.tool` OK, 0 id manquant).

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
2. **Variété** : pas la même recette deux jours de suite. Préférer une recette pas encore vue cette semaine. Tourner dans le haut du classement (macros proches du slot + densité protéines), pas un tirage uniforme.
3. Macros de la recette = somme `aliment × grammes/100`.
4. Mettre à l’échelle **tous** les grammes par  
   `ratio = clamp(kcal_slot / kcal_recette, 0.6, 1.8)`.
5. Arrondir chaque quantité à **5 g**, minimum **5 g**.
6. Recalculer les macros après arrondi (toujours via CIQUAL).

**Si aucune recette** pour ce moment : composer un **repas ancre** (ids CIQUAL réels, filtrés régimes / allergènes) :

- protéine maigre : `poulet-blanc-cru` | `thon-au-naturel-appertise` | `escalope-de-dinde-crue` | `tofu-nature` | `lentilles-vertes-cuites` | `fromage-blanc-0-mg` | `oeuf-cru`
- féculent : `riz-blanc-cuit` | `pomme-de-terre-bouillie-cuite-a-leau`
- légume : `brocoli-cru` | `courgette-crue` | `haricot-vert-cru` | `epinard-cru`
- matière grasse : `huile-olive`

Base type : 150 g / 180 g / 200 g / 10 g, puis **même** échelle 0,6–1,8 + arrondi 5 g. `recette_id` = `null`.

### 4. Écart restant sur la journée

Après les 4 repas, recalculer les totaux. Plafond souple : **kcal ≤ cible × 1,075** (viser écart jour **< 8 %**).

1. Si **protéines < cible − 8 g** : ajouter un aliment riche en P, en **collation** (ou sur le repas le plus léger si la collation est déjà lourde). Quantité = manque / (P pour 100 g) × 100, arrondi 5 g, bornée par le plafond kcal. Ids CIQUAL, dans cet ordre de la spec, **filtrés** par régime :
   - poulet : `poulet-blanc-grille`
   - skyr : `specialite-laitiere-riche-en-proteines-nature` *(CIQUAL n’a pas de ligne « skyr »)*
   - blanc d’œuf : `blanc-doeuf-cru`
   - thon : `thon-au-naturel-appertise`
   - repli végétarien : `fromage-blanc-0-mg`, `tofu-nature`, `lentilles-vertes-cuites`
   Si le budget kcal est serré, prendre d’abord le plus efficace (kcal / g de P) : blanc d’œuf, puis poulet grillé.
2. Si **lipides < cible − 5 g** : ajouter `huile-olive` (dîner), max ~15 g, seulement s’il reste de la place kcal.
3. Si **glucides < cible − 15 g** : ajouter `riz-blanc-cuit` / `pates-cuites` (ou `pates-seches-sans-gluten-cuites` si gluten interdit) / `banane-crue` / `pomme-crue`, sur le repas le plus léger. Pas si ça fait sauter le plafond kcal.

Ne **jamais** inventer de kcal : chaque gramme vient d’un `aliment_id` existant.

Si malgré ça les kcal dépassent ~8 % : réduire d’abord féculents / fruits / huile (pas les ajouts P), recalculer. Si P redescend sous cible − 8 g et qu’il reste de la place, rerattraper le P.

### 5. Répéter 7 jours

Varier les recettes. Si le pool d’un moment est épuisé, on peut reboucler, **sans** répéter le jour précédent.

---

## Sortie d’un jour (pour l’UI)

```
date_index 1..7
repas[] : { moment, recette_id | null, nom, items[{aliment_id, nom, grammes}], kcal, proteines, glucides, lipides }
totaux, cibles, ecart_pct  ( (réel − cible) / cible × 100 )
```

Liste de courses plus tard : sommer `aliment_id × grammes` sur la période, grouper avec `rayons.json`.

---

## Limites (heuristique, assumées)

- 2,2 g P/kg dans 1650–1900 kcal est tendu : le rattrapage P se fait au blanc d’œuf / poulet grillé, pas en gonflant les féculents.
- Pool **végétarien + sans gluten** aujourd’hui : 11 PD / 8 déj / 13 dîners / 30 collations. Les omelettes du pool font dériver L/G certains jours ; les kcal restent < 8 %. Plus de recettes maigres SG = meilleur plan.
- Bornes d’échelle 0,6–1,8 : on ne dénature pas une recette. Ce n’est pas un solveur d’optimalité.

---

## Fichiers

| Fichier | Rôle |
|---------|------|
| `donnees/aliments.json` | CIQUAL 2025, lecture seule |
| `donnees/recettes.json` | 140 recettes, lecture seule |
| `donnees/plans-exemple.json` | 3 plans générés (preuve) |
| `donnees/generateur.md` | cette spec |

**Interdit ici :** modifier `index.html`, `aliments.json`, `aliments-off.json`, `aliments-usda.json` ; `git commit` / `git push`.
