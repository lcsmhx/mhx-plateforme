---
name: e2e-testing
description: Méthodes de test Playwright de la plateforme MHX (suites node de tests-locaux/, Supabase simulé) — structure d'une suite verifNN.js, attentes fiables, horloge, instabilités, rapport. Pour écrire, corriger ou lire une suite.
metadata:
  origin: ECC (https://github.com/affaan-m/ECC, v2.2.2, licence MIT — .claude/LICENCE-ECC.txt), adapté pour MHX
---

# Tests de bout en bout — plateforme MHX

Réponds en français. **Les règles de `CLAUDE.md` priment** (zéro perte de données : aucune suite ne joint la vraie base ; le banc de GitHub fait foi ; en local, une seule suite à la fois, jamais le banc complet). Pour lancer les suites et lire les résultats : agent `e2e-runner`.

## Organisation de `tests-locaux/`

```
tests-locaux/
├── banc.sh          # banc complet (GitHub : 10 parties) : SUITES, HORS_BANC, attendu() = nombre exact de ✓, partie()
├── fichiers.js      # servirFichier(req, res, HTML, retouche), source(HTML), listes()
├── fixtures.js      # données fictives : Coach Démo, Thomas (complet), Sarah, Julien
├── chrome-systeme.js# préchargement : Chrome du Mac au lieu du Chromium de Playwright
├── rig.js           # toutes les pages en téléphone et ordi : captures, console, écritures, fichiers ?v=
├── flux.js          # fenêtres UI, thème, anglais
├── niveau-haut.js   # ordre de chargement des js/ (sans navigateur)
├── verif34.js … verif60.js, verif-xss.js   # une suite par version ou par sujet
├── README.md        # mode d'emploi, nombres attendus
└── captures/        # résultats (non versionnés)
```

Pas de `@playwright/test`, pas de `playwright.config`, pas de `npm install` : chaque suite est un simple script `node` qui utilise la bibliothèque `playwright` installée en global (`NODE_PATH="$(npm root -g)"`).

## Anatomie d'une suite `verifNN.js`

Partir de la suite récente la plus proche (ex. `verif60.js`) et garder sa charpente :

- **En-tête** : ce que vérifie chaque bloc (A, B, C…), l'usage, les variables `VERIFNN_PORT` et `VERIFNN_BLOCS`.
- **Serveur local** sur un port fixe propre à la suite, qui sert la page **et** ses fichiers `css/` et `js/` via `servirFichier` (message clair si le port est déjà pris).
- **Supabase simulé** : requêtes routées par nom d'hôte (`new URL(u).hostname`), jamais par sous-chaîne ; règles RLS reproduites (HANDOFF §2.3) ; appelant reconnu à son jeton ; chaque écriture appliquée en mémoire et notée, chaque lecture de `donnees` aussi ; tout appel vers l'extérieur compté comme une erreur.
- **Vérifications** : `ok(nom, condition, détail)` affiche `✓` ou `✗` ; chaque bloc tourne à part (`✗ BLOC INTERROMPU` au lieu d'arrêter la suite) ; bilan final et code de sortie 1 dès qu'un `✗` apparaît.
- **Contexte par bloc** : un nouveau contexte de navigateur par scénario (pas d'état partagé), avec `viewport` ordi ou téléphone (390 px), langue, `timezoneId` et stockage local voulus.

Ce qu'une vérification doit prouver : ce que voit l'utilisateur **et** ce qui est écrit (bonne clé `donnees`, bonne forme, aucune écriture inattendue, ancien format toujours lu), en français et en anglais, sur téléphone et sur ordi, avec des données piégées (aucune injection).

Une nouvelle suite doit **échouer sur la version précédente** ; elle entre dans `SUITES`, `partie()`, `attendu()` et le `README.md` dans le même commit.

## Attentes fiables

```javascript
// Attendre que l'app soit prête, plutôt qu'un délai fixe
await page.waitForFunction(() => typeof appPrete !== 'undefined' && appPrete === true, null, { timeout: 10000 });

// Localisateur : attend tout seul que l'élément soit prêt
await page.locator('#jr-ok-3').click();

// Attendre une condition précise (une écriture notée par la simulation, un texte affiché)
await page.waitForFunction(() => document.querySelector('#jr-ok-3')?.textContent.includes('Bravo'));
```

- Préférer une condition (`waitForFunction`, `waitForResponse`, `locator(...).waitFor()`) à `waitForTimeout`. Un court délai reste légitime quand l'app attend elle-même (ex. `Store.ecrire` regroupe les écritures pendant 700 ms) : l'écrire avec sa raison.
- Sélecteurs : les `id` et classes existants de l'app ; ne pas ajouter d'attribut au HTML de l'app pour un test sans l'accord de Lucas.

## Horloge et dates

- `context.clock.install({ time })` ou `clock.setFixedTime(...)` pour un jour précis (ex. `verif36` et `verif38` se placent au samedi midi : le bilan du week-end est proposé, aucun passage de minuit pendant la suite).
- Dates des données fictives **relatives au lancement** : la suite doit donner le même résultat quel que soit le jour.
- Fuseaux : `timezoneId` (ex. Bali UTC+8 et UTC−5) pour tout ce qui dépend de la date locale.

## Tests instables

- Relancer la suite **seule** une fois ; si elle passe, c'est une instabilité à corriger dans la suite (attente, horloge, animation), pas dans l'app.
- Causes fréquentes : clic pendant une animation (attendre l'état visible), écriture pas encore partie (attendre la simulation), date qui change pendant la suite (horloge figée).
- Jamais de vérification retirée ou sautée pour obtenir du vert : le nombre exact de `✓` est vérifié par le banc.

## Captures et traces

```javascript
await page.screenshot({ path: 'captures/vNN/apres-envoi.png', fullPage: true });
await context.tracing.start({ screenshots: true, snapshots: true });   // en cas d'échec difficile à comprendre
await context.tracing.stop({ path: 'captures/vNN/trace.zip' });
```

`captures/` n'est pas versionné ; sur GitHub, les journaux du banc sont joints au passage en cas d'échec (données fictives seulement).

## Modèle de rapport

```markdown
# Tests — AAAA-MM-JJ HH:MM — commit abc1234
**Suites :** verif60 (locale) · **État :** VERT / ROUGE / INSTABLE
- verif60 : 60/60 ✓ (attendu 60)
## Échecs
### verif60, bloc G — « nom de la vérification »
**Message :** …  **Capture :** captures/…
**Cause probable :** …  **Correction proposée :** …
```
