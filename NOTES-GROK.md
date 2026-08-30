# Audit QA — 30 août 2026

Lecture seule. **Aucun patch** (sauf le commit `2135ac1` déjà poussé plus tôt : 12 régimes + 5 `lait`). Formules Mifflin / 2,2 / 1,0 **intouchées**. Pas de `service_role` dans `index.html`.

Scan **intégral** `donnees/aliments.json` : **3111** fiches. Recettes **217** (0 `aliment_id` cassé). Programmes **18**.

Sans session, GET anon sur `aliments` / `recettes` / `programmes_types` → **0 lignes** (RLS). L’audit catalogue porte donc sur le JSON d’import (source de vérité). En session coach, l’UI n’en montrait que **1000** (cap PostgREST, B1).

---

## Bugs bloquants

### C1. Encore 59 aliments animaux étiquetés vegan **et** végétarien
**Où :** `donnees/aliments.json` (catégories Produits de base / Matières grasses / Légumineuses — **pas** Viandes/Poissons : le tagger par catégorie est propre).
**Pourquoi :** un client vegan/végétarien peut se voir proposer lard, cassoulet, hot-dog, huile de foie de morue, gélatine, etc. Le patch `2135ac1` (12 fiches) **tient**. `graisse-de-dinde` était dans le hunk git mais **n’avait pas été modifié**.
**Fix proposé (à valider) :** retirer `vegan` et `vegetarien` (et `pescetarien` si ce n’est pas du poisson). Garder `omnivore`. Pour les huiles de poisson : retirer vegan/vegetarien, **garder** `pescetarien`. Liste :

`lard-gras-cru`, `graisse-doie`, `graisse-de-dinde`, `huile-de-foie-de-morue`, `huile-de-hareng`, `huile-de-sardine`, `gelatine-seche`, `saucisse-de-volaille-type-knack-contenant-du-soja-preemballee`, `olives-vertes-fourrees-ou-farcies-anchois-poivrons-etc`, `bouchee-a-la-reine-a-la-viande-volaille-quenelle`, `bouillon-de-viande-et-legumes-type-pot-au-feu-degraisse-deshydrate`, `bouillon-de-viande-et-legumes-type-pot-au-feu-non-degraisse-deshydrate`, `bouillon-de-viande-et-legumes-type-pot-au-feu-pret-a-consommer`, `bouillon-de-volaille-deshydrate`, `bouillon-de-volaille-deshydrate-reconstitue`, `brochette-de-crevettes`, `brochette-de-volaille-cuite`, `brochette-mixte-de-viande`, `cassoulet-appertise`, `chili-con-carne-preemballe`, `choucroute-garnie-preemballee`, `coq-au-vin`, `cordon-bleu-de-volaille-preemballe`, `couscous-a-la-viande-preemballe`, `couscous-au-mouton`, `couscous-royal-avec-plusieurs-viandes-preemballe`, `feuillete-ou-friand-a-la-viande-preemballe`, `fond-de-volaille-pour-sauces-et-cuisson-deshydrate`, `hachis-parmentier-a-la-viande-preemballe`, `hot-dog-preemballe`, `lapin-a-la-moutarde-preemballe`, `lasagnes-ou-canellonis-a-la-viande-bolognaise-preemballes`, `moules-farcies-matiere-grasse-persillade-preemballees-crues`, `moules-marinieres-oignons-et-vin-blanc-preemballees`, `nouilles-aux-crevettes-preemballees-sautees-poelees`, `nuggets-ou-croquette-panee-de-volaille-preemballe`, `paupiette-de-volaille`, `pates-a-la-bolognaise-spaghetti-tagliatelles-preemballees`, `pizza-a-la-viande-type-bolognaise-preemballee`, `pizza-au-chorizo-ou-salami-preemballee`, `pot-au-feu-preemballe`, `salade-alaska-au-surimi-ananas-carottes-avec-sauce-preemballee`, `salade-composee-a-base-de-crudites-charcuterie-et-fromage-avec-sauce-preemballee`, `salade-de-cervelas-avec-sauce-preemballee`, `salade-de-pates-au-surimi-avec-sauce-preemballee`, `sandwich-baguette-merguez-ketchup-moutarde`, `sandwich-pain-de-mie-complet-bacon-crudites-preemballe`, `sandwich-pain-de-mie-complet-saucisson-ou-rosette-preemballe`, `sauce-pour-nems-a-base-de-nuoc-mam-dilue-preemballee`, `sauce-tomate-a-la-viande-ou-sauce-bolognaise-preemballee`, `soupe-a-la-volaille-et-aux-legumes-deshydratee-reconstituee`, `soupe-a-la-volaille-et-aux-legumes-preemballee-a-rechauffer`, `soupe-a-la-volaille-et-aux-vermicelles-deshydratee-reconstituee`, `soupe-a-la-volaille-et-aux-vermicelles-preemballee-a-rechauffer`, `soupe-chorba-frik-a-base-de-viande-et-de-frik`, `soupe-de-poissons-et-ou-crustaces-deshydratee-reconstituee`, `soupe-de-poissons-et-ou-crustaces-preemballee-a-rechauffer`, `tajine-de-mouton-preemballe`, `tripes-a-la-tomate-ou-a-la-provencale-preemballees`

### C2. 126 aliments laitiers encore `vegan` (végétarien OK)
**Où :** surtout Produits de base (chocolat au lait, glaces, pains au lait, pizzas fromage, crèmes…). Catégorie Laitages réellement laitière encore vegan : **1** (`boisson-au-x-fruit-s-et-au-lait` — allergène `lait` déjà ajouté).
**Pourquoi :** un plan vegan peut coller du chocolat au lait / de la crème.
**Fix proposé :** retirer `vegan` seulement. Les 31 Laitages vegan restants sont des boissons végétales — **les garder**.

### C3. 7 produits laitiers évidents sans allergène `lait`
**Où :**
- `tartiflette-pommes-de-terre-reblochon-lardons-preemballee` (régimes OK, encore `sans_lactose`)
- `aligot-puree-de-pomme-de-terre-a-la-tomme-fraiche-preemballe`
- `tarte-au-maroilles-ou-flamiche-au-maroilles-preemballee`
- `matiere-grasse-laitiere-a-15-25-mg-legere-a-tartiner-doux-enrichie-en-vitamine-s` (vegan + sans_lactose + allergenes [])
- `chocolat-blanc-tablette`
- `chocolat-blanc-aux-fruits-secs-noisettes-amandes-raisins-praline-tablette`
- `cookie-aux-cranberries-et-au-chocolat-blanc-preemballe`
**Fix proposé :** ajouter `lait` ; retirer `sans_lactose` / `vegan` si présents. Tous les **Laitages** vraiment laitiers ont déjà `lait` (0 miss dans cette catégorie).

### C4. `Catalogue.lire` — cap PostgREST 1000
**Où :** `index.html` `Catalogue.lire` (~L708). Un GET sans `Range`. Secours GitHub seulement si table **vide**.
**Pourquoi :** 9 repas à 0 kcal en live, Divers en ids bruts, kiwi/faisselle/miel « absents » alors qu’ils sont dans les 3111.
**Fix :** paginer Range 0-999, 1000-1999… jusqu’à page courte, pour **toute** table > 1000 (y compris `donnees` de la liste clients). Réimporter **sans** pagination ne change rien.

### C5. Calculateur POST 80 kg / H / 25 / 178 dès l’ouverture
**Où :** `outilCalculateur.init` / `rendre` → `sauver()`. `intake` jamais recopié. Nutrition coach lit `calc.poids`.
**Pourquoi :** diète test à 3288 kcal / 220 P pour un profil 72 kg.
**Fix :** ne pas `ecrire` avant édition ; seed depuis `intake`.

### C6. `Store.lire` en erreur → défaut éditable → écrase la vraie ligne
**Où :** `Store.lire` catch `return defaut`.
**Fix :** distinguer 404 (vraiment vide) et réseau/401 ; `ecrire` no-op tant que le GET n’a pas réussi.

### C7. Debounce 700 ms : `cible()` lu trop tard
**Où :** `Store.ecrire` / `envoyer`. Switch de fiche ou « Revenir aux clients » avant 700 ms → UPSERT sur B ou sur le **coach**.
**Fix :** capturer `uid` au moment de `ecrire`. Flush/clear timers + cache au switch.

### C8. Cache Store non keyé par uid + même hash ne recharge pas
**Où :** `Store.cache[cle]` ; ouvrir B depuis `#/profil` déjà ouvert.
**Fix :** `cache[uid][cle]` ; forcer `afficher` même si le hash ne change pas.

### C9. Questionnaire non bloquant + `complet` sur `change`
**Où :** `demarrer`, `outilProfil.enregistrer`.
**Fix :** `complet` seulement sur Enregistrer ; nav forcée profil tant que `!complet`.

---

## Bugs gênants

- **G1** Flag diète lit `c.repas.repas` au lieu de `c.repas.jours` → « à faire » à tort. `outilClients.tableau`.
- **G2** Bibliothèque « 0 repas » : lit `contenu.repas` au lieu de `jours`.
- **G3** Graphique : un seul cercle (le dernier point) ; 1 point ≠ empty state ; dates `type=date` en MM/DD/YYYY.
- **G4** « Restaurer une sauvegarde » côté client peut POST `programme` / `repas`.
- **G5** Select programmes prêts : rebuild remet `value=""`.
- **G6** « kcal aujourd'hui » = onglet, pas le jour calendaire.
- **G7** Cases mangé vidées si `suivi.date !== toISOString()` → reset **08:00 WITA**, toute la semaine.
- **G8** `fmt(undefined)` → `"NaN"`.
- **G9** Mensurations : 0 / valeurs énormes acceptées (HTML min/max seulement).
- **G10** `keydown` Enter empilé sur l’écran login à chaque bascule mot de passe oublié.
- **G11** Pas de `<!DOCTYPE html>` / `lang="fr"` ; Netlify `/signup` → 404 (pas de `/* /index.html 200`).
- **G12** Nav et `.j-onglet` (min-width 104px) scrollables sans barre visible, 390 px.
- **G13** `#/catalogue` / `#/clients` en client : silencieux, pas de « accès refusé ».
- **G14** Allergènes haute confiance encore manquants (noms) : gluten 19, oeufs 23, fruits_a_coque 24, poissons 23, crustaces 4, mollusques 6, arachides 1. Soja/sésame 0 miss. Vegan+œuf 19, vegan+miel 8 (strict).
- **G15** 19 vegan+œuf, 8 vegan+miel. Questionnable : `biscuit-…-gout-bacon`, `sauce-bourguignonne-preemballee`.

Doublons aliments/recettes/programmes : **0**. Recettes sans `regimes`/`allergenes` : **OK**.

---

## Points de sécurité

1. **RLS non vérifiable à fond sans dashboard.** Anon : catalogues = 0 lignes (bon : pas de fuite publique). `profils` → 401 `permission denied for function est_coach`. `donnees` n’a pas de colonne `id` (requête `?select=id` 400). **Question :** un JWT client peut-il GET/UPSERT `donnees?user_id=eq.<autre>` ? Le code coach GET `donnees?select=user_id,outil,contenu,maj_le` **sans filtre** — si la policy « auth.uid() = user_id » est en place, le coach ne verrait que **ses** lignes, pas les clients. Si une policy `est_coach()` SELECT all existe, c’est voulu. **À confirmer dans le dashboard.**
2. **`javascript:` dans `href`** : `esc()` n’échappe pas `javascript:`. Champs `lien` exercice (client entraînement + coach programme).
3. Clé **anon** dans le HTML (normal). Pas de `service_role`.
4. Hash `#inscription` : signup public caché si on connaît l’URL.
5. Mot de passe oublié : body `{ email }` sans `redirect_to`.
6. Inscription coach `n-creer` : « Compte créé » même si confirm-email encore on ; pas de PATCH `profils` explicite → « Sans nom » possible.
7. Texte libre : la plupart des notes passent par `esc()`. Apostrophes/emojis OK via `esc`. Liens URL non validés.

---

## Suggestions d’amélioration (ne pas faire maintenant)

- Pagination catalogue + compteur Catalogue = longueur réelle.
- Source de vérité macros = profil, calculateur optionnel.
- Clamp mensurations côté JS.
- Cercles sur tous les points de la courbe ; empty si < 2.
- Affordance de scroll (flèche) sur nav et jours.
- Import `exercices` : si la table n’existe pas, ne pas interrompre aliments/recettes déjà écrits (pas de transaction aujourd’hui).
- `fmt` → `"—"` si non fini.

---

## Parcours simulés (code)

| Parcours | Résultat |
|---|---|
| Client profil vide | Empty repas/programme OK. Nav **pas** bloquée. Calculateur crée 80 kg. |
| Mensurations 0 / énormes | Pas de crash. Courbe 1 point dégénérée. |
| Diète 7 j + beaucoup d’allergènes | Pool vide → flash, semaine non écrite. Pool maigre → compléments peu crédibles. 0 kcal si ids hors cap 1000. |
| Coach 0 client | Tableau vide, pas de throw. |
| Coach beaucoup de clients | 2 GET (pas N+1). `donnees` aussi cap 1000 → tableau tronqué vers ~170 clients. |
| Deux clients / switch | Debounce + cache = mélange possible (C7/C8). |

---

## Questions (voulu vs bug)

- Faut-il retirer `pescetarien` sur les plats terre (cassoulet, hot-dog) ? (proposé : oui)
- Miel en vegan : strict non, beaucoup de gens l’acceptent. **8** fiches.
- `biscuit goût bacon` / sauce bourguignonne : arôme vs vraie viande ?
- Signup public via `#inscription` : voulu pour le coach seulement ?
- Confirm-email : NOTESCLAUDE dit off — à reconfirmer dashboard.

---

## Journal antérieur

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

## 30 août 2026 — QA client live + code (pour Claude)

Compte test : `mhx.client.test@gmail.com` (créé par Lucas). Site : https://lcsmhxcoaching.netlify.app
Grok **n’a pas touché** `index.html`. Formules 2,2 / 1,0 / Mifflin OK. Pas de `service_role` dans le HTML.

### Vu en live (rôle client)

Nav client : Profil, Programme, Repas, Calculateur, Mensurations, Entraînement. Pas Catalogue / Clients / Bibliothèque. Logout OK, garde de route OK. 0 erreur JS. États vides programme/repas OK (rien d’assigné). Pas de bouton Générer côté client. 100 % français (sauf label login « Email »).

### Bugs à corriger (priorité)

1. **Calculateur écrit 80 kg / Homme / 25 ans / 178 cm dès le premier affichage** (`outilCalculateur.init` + `rendre` → `sauver`). Après le questionnaire, redirect `#/calculateur` publie ces défauts. Le poids du profil n’est pas recopié. Vu en live : 2 958 kcal maintien, 176 P. **Fix :** ne pas `Store.ecrire` tant que le client n’a pas édité ; initialiser depuis `intake` (poids, taille, âge, sexe) si `calc` est vide.
2. **Questionnaire pas bloquant.** Les 10 champs requis ne ferment pas la nav. Autosave `change` peut poser `complet:true` sans Enregistrer. Course `hashchange` vs `location.hash = "#/profil"`. **Fix :** enregistrer le listener hash **après** le hash profil, garder la nav sur profil tant que `!complet`.
3. **« Restaurer une sauvegarde »** visible pour le client (profil, et `blocSauvegarde` sur chaque outil avec `cle`). `Store.importer` peut POST `programme` et `repas` du client. **Fix :** pas de Restaurer sur programme/nutrition en client ; `Store.ecrire` refuse `programme` et `repas` si `!estCoach()`.
4. **Cases « mangé »** (code, pas testable sans plan) : `suivi.mange = {}` dès que `suivi.date !== aujourdhui()`. `aujourdhui()` = `toISOString().slice(0,10)` → reset à 08:00 WITA. **Fix :** ne pas vider les autres jours ; aujourd’hui en local, pas UTC.
5. **Coach `diete` flag** lit `c.repas.repas` alors que `migrer()` a `jours[]` et `delete R.repas` → client avec semaine = « à faire ». Lire `c.repas.jours`.
6. **« il te reste X kcal aujourd'hui »** utilise le jour de l’onglet, pas le jour calendaire.
7. **Pas de `<!DOCTYPE html>` ni `lang="fr"`** → quirks mode. Ajouter.
8. **Netlify :** chemins `/dashboard`, `/signup` → 404. Ajouter redirect `/* /index.html 200`.
9. **`#/catalogue` et `#/clients` en client** : silencieux, affichent Profil, URL inchangée. Message « accès réservé au coach » ou rester sur l’outil précédent.
10. **Nav mobile 390 px** : pastilles scrollables, Entraînement hors écran, pas de flèche. Affordance ou nav compacte.
11. **Champs date** natifs en `mm/dd/yyyy` (locale navigateur) sur UI FR.
12. **Mot de passe oublié** : body `{ email }` sans `redirect_to`. Vérifier Site URL + hash recovery.
13. Inscription cachée si le hash contient `inscription`.

### Pas des bugs (spec)

Pas d’extras courses, pas de type note par créneau, pas d’anneau kcal (barres FR), pas de thème clair/sombre (absent du live). Questionnaire 68 champs / 10 requis (plus 49).

### Encore à tester (besoin d’un plan + programme assignés au compte test)

Courses sur une vraie semaine, cases mangé J+1, rendu Jour 1…N, graphique mensurations ≥ 2 semaines, RLS `repas` / `repas_suivi`.


## 30 août 2026 — envoi live coach → client test

Compte coach `lucasmahauxpro@gmail.com` → client `mhx.client.test` (Test Grok).

Envoyé :
- Programme catalogue **Haut / Bas — 4 séances** (intermédiaire, salle).
- Semaine 7 jours omnivore, « Valider et envoyer au client » OK.

Bugs vus à l’envoi (à corriger) :
1. **Macros de génération = calculateur, pas le profil.** Profil 72 kg / 175 cm / 28 ans ; le formulaire repas était à **3288 kcal / ~220 g P** (trace d’un poids ~100 kg dans `calc`). La diète envoyée n’est pas celle du questionnaire.
2. **Liste de courses « Divers »** : beaucoup de lignes en **id brut** (`faisselle-0-mg`, `oeuf-cru`, `pain-complet-ou-integral-a-la-farine-t150`…) alors que d’autres rayons ont le `nom`. `courses()` utilise `i.nom || aliment_id` et `i.categorie` pour le rayon — les ingrédients figés n’ont pas toujours nom/catégorie.
3. **En-tête recette à 0 kcal** alors que les ingrédients ont des grammes (ex. « Faisselle 0 %, kiwi et miel »).
4. Compléments générateur peu crédibles (ex. biscuit apéritif 300 g, blanc de poulet cru seul) pour coller aux macros trop hautes.
5. Select « Programmes prêts à l’emploi » : 2 essais avant que la valeur reste (re-render).
6. `Restaurer une sauvegarde` toujours visible sur la fiche client côté coach (et côté client).

RLS repas : l’envoi a marché (pas de 401).


## 30 août 2026 — QA complète live (client + coach)

Cause des 0 kcal : **PostgREST cap 1000**. `Catalogue.lire` fait un seul `GET /rest/v1/aliments?select=*&order=nom.asc` **sans** `Range` / pagination. La table a (ou l’UI montre) **1000** lignes ; GitHub en a **3111**. Le secours GitHub ne part **que si la table est vide**, donc jamais ici. `faisselle-0-mg`, `kiwi-cru`, `miel`, `skyr`, `whey` existent dans `aliments.json` mais pas dans les 1000 premiers `order=nom.asc`.

**Fix Claude :** paginer `lire()` (Range 0-999, 1000-1999, … jusqu’à page courte) pour aliments **et** toute table > 1000. Ne pas se fier à un réimport seul : sans pagination l’UI restera à 1000. Compteur Catalogue = longueur après pagination.

Autre vu en live :
- Table clients : test grok questionnaire ✅ programme ✅ **diète à faire** (faux, 7 jours envoyés).
- 9 repas à 0 kcal, 6 warnings « ingrédients absents ».
- Dates mensurations `MM/DD/YYYY`.
- Courbe : 2 points presque plats, point de départ non tracé.
- Entraînement client : exo ajouté persiste (OK).
- Toutes les fiches « Comment faire ? » du programme test OK (172).
- Cases mangé + courses persistent dans la session (OK). Le reset UTC n’a pas pu être rejoué J+1.
- Bibliothèque vide : normal si on n’a pas cliqué « Enregistrer dans ma bibliothèque » (on a chargé un programme prêt). Le résumé « 0 repas » pour un plan `jours[]` reste un bug de libellé si on enregistre un plan repas.
- Calculateur laissé à 72 kg après le test (autosave).

`index.html` non touché.


## G3 — graphique de poids : ce que j’attends

`Graphique.dessiner` / mensurations. Ne pas toucher aux formules.

1. **0 ou 1 point** (y compris seulement le point de départ) : **pas** d’axe ni de trait fantôme. Texte seul : « Enregistre au moins deux semaines pour voir la courbe. »
2. **2 points ou plus** : une polyligne **et un cercle sur CHAQUE point** (départ + chaque semaine), pas seulement le dernier.
3. Le **point de départ** (poids du jour J0) est le **premier** point, à sa date. Les semaines ensuite.
4. Axe X : dates en `JJ/MM`. Axe Y : kg, avec unité « kg » visible. Si les deux y sont très proches, garder une marge verticale (ne pas coller la ligne au bord).
5. Survol (ou tap) d’un point : date + poids (ex. `29/08 · 72,0 kg`).
6. Ne pas forcer `x1 = x0+1` quand il n’y a qu’un point — ça produit la barre verticale / aire bizarre vue en live.

Référence live 30 août : 2 points 72 → 71,5, un seul disque, départ absent, copie « deux semaines » alors que ça dessinait déjà.


## Recontrôle live 30 août (après normalisation + pagination)

Site `lcsmhxcoaching.netlify.app`, session coach. **Ne plus scanner `aliments.json` pour les régimes** : les tags viennent de `Normaliser` à l’import.

- Catalogue : **3111** aliments, 217 recettes, 18 programmes, 172 exercices. Cap 1000 **levé**.
- Cassoulet, hot-dog, pot-au-feu, coq au vin, lard gras, graisse d’oie, nuoc-mâm : **plus vegan/végétarien**. Tartiflette / aligot / chocolat blanc : allergène **lait**. Kiwi, faisselle, miel, skyr, whey : **trouvés**. Pain hot-dog : **reste vegan**. Beurre de cacahuète : **pas** d’allergène lait (OK). Boisson soja : vegan, allergène soja seulement.
- Calculateur test grok : **72 kg**. Petit-déj lundi : **440 kcal** (plus 0). Drapeau diète : **envoyée**.

Couverture recettes **après** normalisation (table Catalogue) :

| Régime | PD | Déj | Dîner | Collation |
|---|---|---|---|---|
| Végétalien | 14 | **9** | 19 | 14 |
| Paléo | 12 | 19 | 14 | 15 |

Le trou le plus maigre n’est plus paléo déjeuner (19) : c’est **végétalien déjeuner (9)**. Vegan petit-déj 14 (cible ~15).

### Restes pour le normaliseur (pas le JSON)

1. **`beurre-de-cacahuete`** : planté, donc vegan/végétarien. Le motif `beurre` le sort encore. Exclure `beurre de cacahuète` / `beurre de…` végétal comme `ex_lait` le fait pour lait de soja.
2. **`hot-dog-preemballe`** porte encore `sans_porc` (un hot-dog FR est en général du porc). Question : retirer `sans_porc` ?
3. Calculateur : poids 72 OK, mais **âge 25 / taille 178** encore les défauts (le profil test est 28 ans / 175 cm). Seed incomplet ?
4. Recherche « lait de soja » : 0 hit ; le nom CIQUAL est **Boisson au soja**. Rien à faire côté données, éventuellement un alias plus tard.

G3 graphique : spec déjà dans ce fichier. C9 questionnaire bloquant : **écarté**, compris.

## 30 août — +6 déjeuners vegan
`tempeh-sarrasin-betterave`, `houmous-quinoa-crudites`, `haricots-rouges-riz-avocat`, `tofu-fume-lentilles-fenouil`, `falafel-roquette-tomate`, `flageolets-patate-douce-epinards`. Recettes **223**. Vegan déjeuner brut **15**. À réimporter.

## 30 août — liens YouTube sur les exercices

Fichier source : 1067 démos (pas importées dans le catalogue). Champ `lien` = URL watch YouTube. Pas d’embed Azeoo.

- **95 / 172** fiches (`exercices.json`) ont un lien.
- **345** occurrences renseignées dans `programmes.json`.
- **77** noms laissés vides (bande, chaise, tempo, variante trop loin du nom EN).

Table des correspondances : `donnees/liens-youtube.md`. Claude n’a rien à faire côté `index.html` si `outilEntrainement` lit déjà `exercice.lien`.


## 30 août — MAJ 6 Claude (Formation)

Reçu. **Je ne touche pas à `index.html`.**

### Formation / DOCTYPE
Après `git pull` (`e7b70ca`), le `index.html` GitHub **n’a pas** `outilFormation`, **pas** de `#/formation`, **pas** de `<!DOCTYPE html>` (le fichier commence encore par `<meta charset>`). Les 4 commits « Add files via upload » après les liens YouTube touchent surtout le player / `liensexercices.json`. Si Formation est en prod Netlify, le dépôt n’est pas à jour.

### G3 — spec déjà écrite
La spec est plus haut (« G3 — graphique de poids : ce que j’attends »). Rien à réécrire. Tu peux coder.

### Cohérence calc vs intake (fiches avant le 30 août)
Le bug qui POSTait 80 kg / 178 cm / 25 ans à l’ouverture est corrigé, mais les fiches **créées avant** peuvent encore porter ces défauts. Contrôle à faire un jour sur `donnees` :

- comparer `calc.poids` / `calc.taille` / `calc.age` avec `intake.poids` / `intake.taille` / `intake.age`
- signaler un écart ≥ 2 kg, 2 cm ou 2 ans
- ne pas écraser sans confirmation coach

### Vegan déjeuner
JSON (intersection des `regimes` ingrédients) : **24** / 232 recettes. Live Normaliser avant réimport : **9**. Neuf ajouts (tous vegan à l’intersection) :

`seitan-poivrons-riz`, `tofu-kale-quinoa`, `pois-casses-carottes-cumin`, `haricots-blancs-courgette-tomate`, `pave-soja-patate-brocoli`, `lentilles-corail-coco-epinards`, `mungo-riz-poivron`, `pois-chiches-chou-fleur-curcuma`, `pst-champignons-sarrasin`.

Réimporter `recettes.json`. Index.html non touché.


## 30 août — MAJ 8 (brief Supabase)

Lu `briefs` id 1 après `git pull` (`6558aff`). `index.html` non touché.

### A. Ordre

Le tien : 1) cohérence 2) mdp+email 3) version+cache 4) PWA 5) légal.

Ce que je changerais :

1. **Fermer l’inscription publique.** Avant tout le reste, y compris la cohérence. Voir B1 : n’importe qui crée un compte, est confirmé tout de suite, et a la formation (elle est dans `index.html`). PWA et version n’ont aucun sens tant que la porte est ouverte.
2. **Cohérence calc/intake** — d’accord, c’est ta n°1 actuelle, et Clio le justifie. Alerte coach, ne pas écraser.
3. **Email vérifié à la création + changement de mot de passe dans l’app.** La copie coach (l.3750) dit déjà que le client peut changer son mot de passe « depuis l’écran de connexion ». La récupération par lien existe ; le changement *connecté* manque. La faute de frappe sur l’email est plus grave que le PWA : compte perdu, formation injoignable.
4. **Version affichée + cache** (1 h) — oui, après la porte fermée. `index (1).html` est un problème de dépôt Netlify, pas d’app.
5. **Mentions + suppression de compte.** Clients en France : export à moitié et suppression absente, c’est du RGPD, pas du cosmétique. La case contre-indication existe déjà dans `intake` (`contre_ind`, `contre_ind_detail`) — ce qui manque, c’est la **date** et le **blocage** avant d’envoyer un programme.
6. **PWA : sors-le de cette liste.** 3 h pour 6 clients, zéro urgence. Ça empile un second cache par-dessus celui qui vous a déjà coûté 2 h.

À garder mais pas dans le top : journal d’entraînement vs module 3 (clients actuels, plus urgent que PWA), 2e compte coach pour la commerciale (décision déjà prise, 1 h), historique des programmes, photos.

### B. Sécurité (jeton réel, pas le code)

**B1. Inscription ouverte : vrai.** `portail("inscription")` si le hash contient `inscription` (l.4936). L’écran de login n’affiche pas le lien, l’URL `#/inscription` suffit. `POST /auth/v1/signup` avec la clé publique → **200, `access_token`, email confirmé à la seconde.** Un profil `role=client` est créé. J’ai laissé un compte sonde : `grok.inscription.probe.20260830@gmail.com` (id `3ef9207d-…`). **Supprime-le.** Tant que Supabase accepte les signups, cacher le hash ne suffit pas.

**B2. Isolation `donnees` / `profils` : tient.** Jeton client `mhx.client.test` :
- `GET /donnees` (sans filtre) → 7 lignes, toutes `user_id` = lui
- `GET /donnees?user_id=neq.<lui>` → 0
- `POST /donnees` vers l’uid coach → **403** RLS
- `GET /profils` → 1 ligne, la sienne
Catalogue `aliments` / `recettes` lisible en client : voulu (catalogue partagé). Je n’ai pas cassé l’isolation des fiches. Pas la priorité absolue.

### C. Audit cohérence

Fichier : `donnees/audit-coherence.md`. Rien corrigé.

- **clio clio** : calc 80/178/25 vs intake 62/158/37 → **+602 kcal/j** (même activité que le calc). C’est le cas ~950 selon l’activité qu’on colle ; avec 10 h d’entraînement restées en défaut vs 3 séances, l’écart gonfle encore.
- **test grok** : 72 kg ok, taille 178 vs 175, âge 25 vs 28 → **+56 kcal/j**. Reliquat du seed âge/taille.
- paul verzele, aissa lelover : alignés.
- Lucas (coach) : calc encore à 80/178/25, pas d’intake.

Lucas tranche. Je ne touche pas aux fiches.

### D. Dix petit-déj paléo

Ajoutés, validés contre le filtre **positif** live (`catPaleo || tubercule || aromate`, moins `transforme`, moins alcool, moins céréale/lait/légumineuse/sucre). Aucun préemballé.

`omelette-roquette-tomate`, `oeufs-plat-brocoli-ail`, `oeuf-dur-fraise-amandes`, `saumon-cru-avocat-citron`, `oeufs-poivron-ciboulette`, `bol-kiwi-myrtille-amandes`, `oeufs-brouilles-asperges`, `omelette-champignons-thym`, `banane-noix-cannelle`, `oeuf-dur-pomme-noisettes`.

Recettes **242**. Paléo petit-déj **21** (les 11 live + 10). Réimporter.

### E. Ce que tu n’as pas listé

- **Couper les signups côté Supabase**, pas seulement l’UI. Sinon un `curl` suffit.
- **Confirmer l’email du client à la création** (lien magique). Ça tue la faute de frappe et ça ferme l’inscription fantôme.
- **`intake.sexe` est vide** sur toutes les fiches lues. Le calculateur a un sexe ; le questionnaire ne le recopie pas sous `sexe`. À vérifier dans `QUESTIONS`.
- Formation dans `index.html` = tout compte = tout le cours. Fermer l’inscription, c’est aussi protéger le contenu.
- Module 0/2 demandent des photos : pas de stockage. Enlève la tâche ou ajoute un bucket, pas les deux.
- Netlify : ignorer `index (*).html`, afficher un hash de version dans le pied. Avant le PWA.
- La commerciale en 2e coach : plus simple qu’un rôle. Plus tard, un log « qui a ouvert quelle fiche ».
- Rate-limit signup le temps de fermer.


## 30 août — Feu vert Lucas (binôme) + MAJ 10

`git pull` → `f27d8ae`. Le brief dit v16 ; **ce dépôt a encore `CONFIG.marque.version = "2026-08-30 · 15"`** (l.548), titre « Créer un accès client » (l.3922), pas de `#n-type`. Si v16 est en prod Netlify, elle n’est pas sur GitHub. Je spécifie ici ; tu codes dans `index.html`. Je ne le touche pas.

### Sécu (MAJ 10 A) — jeton client réel `mhx.client.test`

- `PATCH profils` `role=coach` sur soi → **400 P0001** « Seul un coach peut changer un rôle. » Trigger tient.
- `POST upsert` merge-duplicates → **403** RLS.
- `PATCH` le profil d’un autre (Clio) avec `return=representation` → **200 []** (0 ligne). Prénom Clio inchangé.
- `PATCH donnees` calc d’un autre → **200 []**.
- `PATCH` son propre `prenom` → **204** (autorisé, hors rôle).

Je n’ai pas contourné. Deux coaches en base : Lucas + Ines Temmar (voulu).

« Mon compte » : `outilProfil.compteHTML` retourne `""` si `Store.idConsulte` (l.2185). OK sur cette copie.

Je n’ai pas rejoué le parcours client live (création d’accès masquée) faute de v16 dans le fichier GitHub. À retester dès que v16 est push.

Audit cohérence + 10 paléo PD : déjà livrés (733c558). Clio a été recalé de ton côté.

---

### Répartition du feu vert Lucas

#### 1. Alimentation — MOI données / TOI app

**Shakers en collation.** Recettes `moment: collation` avec `whey` 30 g (ids `shaker-whey-*`). Le générateur doit les accepter comme collation, pas comme repas. Si le client a une collation dans `repas_horaires`, un shaker peut remplir le créneau (protéines 2,2 g/kg : le shaker compte).

**Nombre de repas = `intake.repas_horaires`.** Champ texte libre aujourd’hui. Parse un entier 2–5 (regex `(\d)\s*repas` ou le premier nombre 2–5). Sinon défaut 4 (PD/déj/dîner/collation actuel).

Parts actuelles (l.593) : 0.25 / 0.35 / 0.30 / 0.10.

| nb | créneaux | parts |
|---|---|---|
| 2 | déjeuner, dîner | 0.45 / 0.55 |
| 3 | petit-déj, déjeuner, dîner | 0.25 / 0.40 / 0.35 |
| 4 | + 1 collation | comme aujourd’hui |
| 5 | + 2 collations (dont 1 shaker si whey ok) | 0.20 / 0.30 / 0.30 / 0.10 / 0.10 |

Ne change pas les formules kcal/macros. Tu répartis seulement les repas.

**Onglet alimentaire.** Aujourd’hui Nutrition est un outil coach (`masque_client` à vérifier). Lucas veut un onglet **client** : sa diète du jour, ses créneaux (2–5), liste de courses, shaker. Le coach garde l’édition. Nom d’onglet : « Alimentation ».

#### 2. Sport — MOI données / TOI app

**Programmes enregistrés en base.** `bibliotheque` existe déjà (l.2422). Quand Lucas crée/modifie un programme type, `POST bibliotheque` (pas seulement `programmes_types` GitHub). Catalogue.programmes() = `programmes_types` + bibliothèque du coach.

**Programme auto selon questionnaire.**

```
seances = nombre intake.seances (2–6)
lieu    = intake.lieu (salle / maison haltères / sans matériel)
objectif= intake.objectif (perte / prise / recomp / perf / santé)
duree   = intake.duree (minutes, pour la note d’échauffement)
```

Table (ids déjà dans `programmes.json`) :

| séances | lieu | objectif | id |
|---|---|---|---|
| 2 | salle | (défaut) | `corps-entier-2j-debutant` ou `corps-entier-2j-intermediaire` si niveau ≠ débutant |
| 3 | salle | prise / perf | `recomp-3j-intermediaire` |
| 3 | maison sans matos | sèche / santé | `perte-gras-3j-debutant-poids-corps` |
| 3 | maison haltères | (défaut) | `corps-entier-3j-debutant-halteres` |
| 3 | élastiques / maison | (défaut) | `elastiques-3j-maison` |
| 4 | salle | sèche | `perte-gras-4j-intermediaire` |
| 4 | salle | prise / force | `haut-bas-4j-intermediaire` ou `ppl-4j-intermediaire` |
| 4 | haltères | (défaut) | `haut-bas-4j-halteres` |
| 5 | salle | (défaut) | `ppl-5j-avance` |
| 5 | poids du corps | (défaut) | `poids-corps-5j-intermediaire` |
| 6 | salle | (défaut) | `ppl-6j-avance` |
| 3 | sénior / équilibre | | `seniors-3j-equilibre` |
| 3 | blessure | | `reprise-blessure-3j` |

Si rien ne matche : `corps-entier-3j-debutant-poids-corps`. Le coach peut changer après. Ne pas envoyer sans qu’il clique.

**Échauffement en tête de séance.** Fichier `donnees/echauffements.json` (ostéo-articulaire, cardio léger, activation fessiers, activation épaules, mobilité hanches). Champ optionnel `seance.echauffement_id`. Case coach : « Ajouter un échauffement » + select. Si vide, rien.

**Créer ma séance.** Onglet coach « Séance » : liste d’exos, séries/reps/repos, enregistrer dans `bibliotheque` `{type:"seance", exercices:[...]}`. Réutilisable dans un programme.

**Lien YouTube auto.** Join `exercices.json` : `slug(nom) == id`, copier `fiche.lien` dès que le nom matche (accents compris). Si l’exo n’existe pas : fiche minimale, `lien=""`, Lucas colle l’URL une fois.

**Gainage latéral sans vidéo.** Pas de « Side Plank » simple dans la bibliothèque YouTube (1067). Seulement des variantes (Up Down, TRX, Band Pull). Je n’avais pas voulu coller une variante. Je mets **Side Plank Up Down** sur Gainage latéral (même motif, plus dur). Genou au sol : toujours vide.

#### 3. Interface — TOI

Bannière écran d’accueil (le manifeste v16 n’est pas dans ce GitHub). `localStorage.mhx_accueil_ok`.

iOS : Partager → Sur l’écran d’accueil.
Android Chrome : menu → Ajouter à l’écran d’accueil.

Bouton « C’est fait ». Plus jamais après. Pas de service worker.

---

Données poussées :
- 6 shakers collation : `shaker-whey-eau`, `shaker-whey-lait`, `shaker-whey-banane`, `shaker-whey-cacahuete`, `shaker-whey-fruits-rouges`, `shaker-whey-soja`. Recettes **248**.
- `donnees/echauffements.json` : `osteo-articulaire`, `cardio-leger`, `activation-fessiers`, `activation-epaules`, `mobilite-hanches-genoux`.
- `donnees/programme-auto.json` : table questionnaire → programme.
Lien Gainage latéral : dans le lot YouTube qui suit. Réimporter recettes + échauffements.
