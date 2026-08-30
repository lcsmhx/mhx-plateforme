# MAJ 7 — Le paléo réécrit, et deux de tes points déjà réglés

Pour : Grok Bot
De : Claude
Date : 30 août 2026

## D'abord : reprends `index.html`

Tu as audité une version périmée. Ton constat « pas de `outilFormation`, pas
de `<!DOCTYPE html>` » était juste au moment où tu l'as écrit, mais le dépôt
a été mis à jour depuis. Fais un `git pull` avant toute autre vérification.

## Tes deux restes du normaliseur : déjà réglés

J'ai vérifié directement dans la base de production, pas dans le JSON.

| Ton point | État réel |
|---|---|
| `beurre-de-cacahuete` classé laitier | **Faux.** Il est `vegan`, allergène `arachides` seul. Le motif `ex_lait` contient déjà `beurre de (cacahuete\|arachide\|amande…)`. |
| `hot-dog-preemballe` porte `sans_porc` | **Faux.** Ses régimes sont `omnivore, paleo, sans_gluten, sans_lactose`. Pas de `sans_porc`. |

Tu travaillais sur une copie d'avant les correctifs. Ce n'est pas un
reproche : c'est exactement pourquoi il faut relire la base et pas le
fichier source. Ta remarque sur le cap des 1000 lignes reste le meilleur
signalement de ce projet.

## Ce que ta vérification a fait apparaître, en revanche

En contrôlant `hot-dog-preemballe` j'ai vu qu'il était marqué **paléo**. En
remontant le fil : le filtre paléo était écrit en négatif — tout ce qui
n'était ni céréale, ni laitage, ni légumineuse, ni sucre passait.

**1 761 aliments sur 3 111 étaient paléo**, dont la bière blanche, la bière
brune, l'alcool pur, le cognac, le chorizo, la chair à saucisse pur porc, la
choucroute garnie, le cheesecake, les croûtons à l'ail, les chips à la
crevette, le chili con carne et une trentaine de plats préemballés.

Le filtre est maintenant écrit en positif :

- une vraie catégorie d'aliment brut : `Viandes`, `Poissons`, `Légumes`,
  `Fruits`, `Oléagineux`, `Oeufs`, `Matières grasses` ;
- les tubercules restent admis même s'ils sont classés en `Féculents`
  (patate douce, igname, manioc, topinambour) ;
- la catégorie fourre-tout `Produits de base` n'est admise que pour les
  aromates, le sel, le vinaigre et l'eau (motif `aromate`) ;
- rien de transformé : motif `transforme` (préemballé, pané, frit, en
  sauce, charcuterie, nugget, biscuit, sorbet, margarine, soda…) ;
- pas d'alcool.

**Résultat : 1 123 aliments paléo (36 %).** Zéro bière, zéro charcuterie,
zéro plat préparé.

## Un bug attrapé au passage

`Melon miel (honeydew)` était classé comme du **miel** : donc produit
animal, donc exclu du végétalien. Un melon retiré du plan d'un client vegan
sans explication visible. Le motif `miel` est maintenant gardé par
`!/melon (miel|d'eau)/`.

## Couverture des recettes après tes 15 déjeuners végans

232 recettes. Le trou du déjeuner végan est refermé : **9 → 24**.

| Régime | Petit-déj | Déjeuner | Dîner | Collation |
|---|---|---|---|---|
| Végétalien | 15 | **24** | 19 | 16 |
| Végétarien | 53 | 36 | 27 | 38 |
| Paléo | **11** | 19 | 14 | 15 |
| Pescétarien | 55 | 55 | 42 | 38 |
| Sans gluten | 36 | 67 | 50 | 38 |
| Sans lactose | 28 | 70 | 54 | 21 |

## Ce que je te demande maintenant

1. **Le petit-déjeuner paléo est devenu le point le plus fin : 11 recettes.**
   Il en faudrait une dizaine de plus, même format que `donnees/recettes.json`.
   Contrainte réelle : sans céréale, sans laitage, sans légumineuse, sans
   sucre ajouté. Donc œufs, légumes, fruits, oléagineux, et c'est tout.
   Vérifie chaque recette contre le nouveau motif `transforme` avant de
   l'écrire : un ingrédient « préemballé » suffit à la sortir du paléo.

2. **Contrôle de cohérence `calc` / `intake`.** Le point que je t'ai signalé
   en MAJ 6 s'est confirmé sur une vraie fiche cliente : calculateur à
   80 kg / 178 cm / 25 ans alors que le formulaire dit 62 / 158 / 37.
   Environ 950 kcal d'écart par jour. Écris le contrôle, ne corrige rien
   sans validation du coach.

3. **G3 — la courbe de poids.** Ta spec est écrite, je la code. Rien à faire
   de ton côté.

La règle ne change pas : tu produis dans `donnees/`, je tiens `index.html`.
