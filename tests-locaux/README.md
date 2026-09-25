# Banc de test local — plateforme MHX

Tests automatisés de `index.html` avec Playwright + Chromium. **Supabase est simulé** : aucun appel ne part vers la vraie base, toute écriture est interceptée et journalisée. Les données sont **fictives** (`fixtures.js` : 1 coach « Coach Démo », 3 clients « Thomas / Sarah / Julien Démo ») ; le catalogue vient des fichiers `donnees/` du dépôt. Ce dossier ne contient aucune clé ni aucune donnée client.

## Installation
```
npm install -g playwright            # une fois
npx playwright install chromium      # une fois
export NODE_PATH=$(npm root -g)
```

## Lancer (depuis ce dossier, à la racine du dépôt)
```
node rig.js --html ../index.html --out captures/vNN [--theme light] [--only client|coach|anon] [--lang en]
      # ~64 pages (client, coach, fiche client, connexion) en mobile et desktop : captures + erreurs console
node flux.js ../index.html captures/flux   # 19 tests : fenêtres UI (annuler = aucune écriture), thème, anglais
node verif34.js ../index.html              # navigation, accueil, bloc Mes données, alias (13)
node verif35.js ../index.html              # programme, nutrition, suivi, progression (14)
node verif36.js ../index.html              # bilan hebdo, statuts d'objectifs, Préparer le call (13)
node verif37.js ../index.html              # tableau de bord, fiche, Mes clients en cartes (15)
```
Attendu sur la v37 : 0 erreur, 19 + 13 + 14 + 13 + 15 vérifications réussies. Le dossier `captures/` est un résultat : ne pas le versionner.

## Ajouter un test pour une nouvelle version
Copier `verif37.js` en `verifNN.js`, garder la simulation Supabase telle quelle, ajouter les vérifications de la phase (présence des éléments, écritures attendues sur les bonnes clés `donnees`, aucune écriture inattendue). Enrichir `fixtures.js` si une nouvelle clé apparaît (respecter exactement la forme écrite par `index.html`).

## v38 — feedback du coach et notes privées
```
node verif38.js ../index.html              # feedback, notes privées, RLS simulée, conflits, réponse perdue, refus 403, restauration, anglais, mobile (67)
node verif-xss.js ../index.html            # données client piégées : aucune injection dans les écrans coach et client (5)
node verif39.js ../index.html              # statut prospect / client, création d'accès, inscription libre (35)
node verif40.js ../index.html              # mode gratuit : cadenas, pages verrouillées, Calendly, aucun prix, pas de débordement (26)
node verif41.js ../index.html              # photos de progression (Storage simulé avec ses règles) : envoi, comparaison, retrait, coach, index piégé, fichier disparu, index illisible (25)
node verif42.js ../index.html              # robustesse : clients aux données piégées (types faux, contenus bruts, listes piégées), filet de sécurité, page quittée pendant son chargement, changement de fiche, lecture ratée (20)
node verif43.js ../index.html              # affichage coach : compte sans prénom ni nom → « Sans nom » partout (avatar neutre, jamais l'identifiant) ; « Jamais rien saisi » classé à part de « Sans nouvelles depuis 10 jours » (34)
node verif44.js ../index.html              # funnel v44 : inscription simplifiée, démarrage prospect, jour 1 (écritures intake + challenge), déblocage / rattrapage / ordre, mode test, challenge terminé, clé piégée, anglais, mobile, client et coach inchangés (81)
node verif45.js ../index.html              # jours 2, 3, 4 du challenge : choix et actions, mini-séance et vidéos, habitude, relecture avant écriture (jeton, onglets, panne), lecture seule, anglais, mobile, accessibilité, deux appareils (54)
node verif46.js ../index.html              # jours 5, 6, 7 du challenge : personnalisation, projection, conversion, clics Calendly, hub, anglais, mobile, relecture ratée, écritures simultanées, mode test (74)
node verif47.js ../index.html              # retour du lien de confirmation, « Vérifie ta boîte mail », pastilles et bloc « Challenge 7 jours » côté coach, prospect piégé, messages Supabase, anglais, mobile (46)
```
Attendu sur la v44 : 78 pages (dont la prospecte « Léa » et l'écran d'inscription), 0 erreur, 0 écriture (aussi avec `--lang en` et `--theme light`) ; 19 + 13 + 14 + 13 + 15 + 67 vérifications ; verif39 35/35 ; verif40 26/26 ; verif41 25/25 ; verif42 20/20 ; verif43 34/34 ; verif44 81/81 (sur la v43, verif44 tombe à 0/4 puis interruption : c'est ce qui prouve qu'il teste vraiment) ; verif45 54/54 (sur la v44 : 0/2 puis interruption) ; verif46 74/74 (sur la v45 : 0/9 puis interruption) ; verif47 46/46 (sur la v46 : 10/47 (dont une erreur JS sur une adresse mal encodée, corrigée en v47)) ; verif-xss 5/5 (sur la v37, verif-xss détecte 15 exécutions). `rig.js --only prospect` ne rend que les pages de la prospecte. Une seule suite à la fois (ports fixes).

## Sans Chromium Playwright : le Chrome de la machine
Si `npx playwright install chromium` n'a pas été fait, le préchargement `chrome-systeme.js` fait tourner tous les scripts avec Google Chrome installé (canal « chrome »), sans toucher aux tests :
```
NODE_OPTIONS="--require ./chrome-systeme.js" node rig.js --html ../index.html --out captures/v38
```

## Règle d'or des simulations
Chaque script intercepte Supabase et **ne doit jamais laisser partir une requête vers la vraie base**. Router par nom d'hôte (`new URL(u).hostname === "localhost"`, `.endsWith(".supabase.co")`), jamais par sous-chaîne de l'URL : les appels d'authentification portent `redirect_to=http://localhost…` et seraient sinon envoyés à la vraie base (incident du 25/09/2026, sans conséquence : inscriptions refusées par Supabase, aucune donnée créée).
