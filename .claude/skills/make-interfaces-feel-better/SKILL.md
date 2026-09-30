---
name: make-interfaces-feel-better
description: Finitions d'interface de la plateforme MHX (espacements, rayons, bordures, ombres, mouvements, zones de toucher, textes, chiffres, états), alignées sur css/jetons.css — thème sombre, doré en accent, aucune couleur hors jetons. Quand Lucas trouve un écran « pas fini », « serré », « qui saute », ou pour relire une page avant sa mise en ligne.
metadata:
  origin: ECC (https://github.com/affaan-m/ECC, v2.2.2, licence MIT — .claude/LICENCE-ECC.txt), adapté pour MHX
---

# Finitions d'interface — plateforme MHX

Réponds en français simple (Lucas n'est pas développeur). **Les règles de `CLAUDE.md` priment** : pas de framework, pas de build, pas de nouvelle police ni de script externe ; une retouche visible = une nouvelle version (`CONFIG.marque.version` et `MHX_FICHIERS`), testée et relue comme le reste. Ce skill propose ; rien n'est appliqué sans la demande de Lucas.

## Le système en place (à respecter, pas à réinventer)

- **`css/jetons.css` fait foi.** Le **sombre** est le thème de l'app ; le clair (`:root[data-theme="light"]`, bouton de la barre du haut, clé `mhx_theme`) redéfinit les **mêmes** jetons. Toute retouche doit rester juste dans les deux thèmes.
- **Couleurs : uniquement `var(--…)`** — fonds `--ground`, `--surface`, `--sunken`, `--raised` ; textes `--ink`, `--ink-2`, `--ink-3` ; traits `--line`, `--line-strong` ; accent `--accent`, `--accent-ink`, `--accent-soft`, `--accent-line` ; états `--good`, `--warn`, `--bad` et leurs `-soft` ; séries des graphiques `--s1` à `--s4`, `--grid`, `--axis` ; `--nav-bg`, `--shadow`.
- **Jamais de nouvelle couleur** (hexadécimal, `rgb()`, nom de couleur) hors de `css/jetons.css`. S'il manque vraiment une teinte : proposer un **nouveau jeton**, défini dans les deux thèmes, et le faire valider par Lucas. Les quelques exceptions déjà présentes (blanc sur `--bad`, dégradé noir sur les photos, voile des fenêtres) ne sont pas un modèle.
- **Le doré est un accent** : bouton principal, état actif, chiffre clé. Jamais un fond de carte, jamais du texte courant, jamais plus d'un bouton doré par écran (règle du parcours prospect : « un seul bouton doré »).
- **Rayons** : `--r-sm` (6 px), `--r` (10 px), `--r-lg` (14 px) — pas d'autre valeur. **Durées** : `--vite` (.16 s) pour un état, `--doux` (.32 s) pour une apparition. **Ombre** : `--shadow`.
- **Polices** déjà chargées : IBM Plex Sans (texte), IBM Plex Mono (chiffres, surtitres `.eyebrow`, `.readout`), Oswald (marque seulement).
- Déjà en place, à réutiliser : `text-wrap:balance` sur `h1`, `font-variant-numeric:tabular-nums` sur les champs, tableaux, `.readout` et tuiles, `min-height:40px` sur les boutons, `prefers-reduced-motion` qui coupe tout mouvement (`css/communs.css`).
- Fichiers : `css/jetons.css` (jetons), `css/communs.css` (commun à tout le site), `css/outils.css` (par outil). Regarder d'abord si une classe existante fait déjà l'affaire.

## Les principes, version MHX

### Rayons emboîtés
Rayon extérieur ≈ rayon intérieur + marge intérieure, en restant sur les trois jetons : une carte `--r-lg` contient des boutons `--r` ou `--r-sm`, pas l'inverse. Marge intérieure large : traiter les deux surfaces comme séparées.

### Alignement optique
Une icône (`SVG` / `ICONES`, `js/interface.js`), une flèche ou un cadenas centrés géométriquement peuvent paraître décalés : corriger d'un pixel dans le SVG ou par une marge, sans changer la taille du bouton.

### Bordures et ombres
Bordure `--line` pour séparer, `--line-strong` pour un champ ou une carte cliquable, `--accent-line` pour l'état actif ou le focus. Relief : `--shadow`, et rien d'autre. En thème sombre, une surface plus haute passe par `--raised` plutôt que par une ombre plus forte.

### Textes et chiffres
- `text-wrap:balance` sur titres et intitulés courts ; `text-wrap:pretty` sur textes courts et moyens (aides, légendes, cartes). Jamais sur un long texte ni sur un tableau.
- `font-variant-numeric:tabular-nums` sur tout chiffre qui change : poids, kcal, macros, compteurs, dates courtes (`29/09 10:53`), minuteurs, colonnes de « Mes clients ».
- Penser au français **et** à l'anglais (`I18N.en`, `DECOUVERTE.en`) : un libellé plus long en anglais ne doit pas casser la ligne ; tester à **320 px** de large (téléphone le plus petit visé).

### Mouvement
- Transitions CSS pour les changements d'état (elles se reprennent si l'utilisateur change d'avis) ; `@keyframes` seulement pour une apparition unique (fenêtre `UI`, carte qui arrive).
- Apparition : opacité + petit `translateY`, durée `--doux` ; disparition plus courte (`--vite`) ; appui sur un bouton : `scale(.97)` discret au plus.
- **Jamais `transition:all`** : nommer les propriétés (`transition-property:background-color,border-color,transform`). `will-change` seulement sur `transform` / `opacity`, jamais `all`.
- Tout mouvement doit disparaître avec `prefers-reduced-motion` (la règle globale le fait déjà : ne pas la contourner avec `!important`).

### Zones de toucher
Au moins **40 × 40 px**, idéalement 44 × 44 px (l'app se sert surtout au téléphone, à la salle) : boutons, cases, pastilles cliquables, icônes de la barre du bas, liens discrets (« Plus tard »). Une petite icône s'agrandit par un pseudo-élément, sans chevaucher sa voisine.

### Photos
Contour neutre discret pour que le bord ne se fonde pas dans la surface : `outline:1px solid var(--line); outline-offset:-1px` — jamais un contour doré.

### États
Chaque élément interactif a ses états : survol, appui, focus clavier (`:focus-visible` visible, `--accent-line`), désactivé, chargement, vide (`ctaVide()` et les textes vides existants), erreur (`--bad` / `--bad-soft`).

## Rapport de relecture

Constats concrets, en lignes avant / après, avec fichier et propriété :

| Principe | Avant | Après | Fichier |
| --- | --- | --- | --- |
| Chiffres | le compteur bouge quand il change | `tabular-nums` | `css/outils.css` (`.x`) |
| Couleur | `#c9a14a` en dur | `var(--accent)` | `css/communs.css:120` |
| Transition | `transition:all .2s` | propriétés nommées, `var(--vite)` | … |

N'écrire que les principes où quelque chose change. Préciser pour chaque ligne : vérifié en **sombre** et en **clair**, à 320 px et sur ordinateur.

## Liste de contrôle

- Aucune couleur hors `var(--…)` ajoutée ; nouveau jeton seulement avec l'accord de Lucas, défini dans les deux thèmes.
- Doré réservé à l'accent ; un seul bouton doré par écran.
- Rayons, durées et ombre pris dans les jetons.
- Titres sans veuve ni coupure disgracieuse, en FR et en EN, à 320 px.
- Chiffres qui changent en `tabular-nums`.
- Pas de `transition:all` ni de `will-change:all` ; mouvements coupés par `prefers-reduced-motion`.
- Zones de toucher ≥ 40 px.
- Focus clavier visible ; états survol, appui, désactivé, vide, erreur présents.
- Rendu vérifié dans les deux thèmes.
