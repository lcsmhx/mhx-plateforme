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
node verif39.js ../index.html              # statut prospect / client, création d'accès, inscription libre (34)
node verif40.js ../index.html              # mode gratuit : cadenas, pages verrouillées, Calendly, aucun prix, pas de débordement (26)
```
Attendu sur la v40 : 64 pages, 0 erreur, 0 écriture ; 19 + 13 + 14 + 13 + 15 + 67 vérifications ; verif39 34/34 ; verif40 26/26 ; verif-xss 5/5 (sur la v37, verif-xss détecte 15 exécutions : c'est ce qui prouve qu'il teste vraiment).

## Sans Chromium Playwright : le Chrome de la machine
Si `npx playwright install chromium` n'a pas été fait, le préchargement `chrome-systeme.js` fait tourner tous les scripts avec Google Chrome installé (canal « chrome »), sans toucher aux tests :
```
NODE_OPTIONS="--require ./chrome-systeme.js" node rig.js --html ../index.html --out captures/v38
```

## Règle d'or des simulations
Chaque script intercepte Supabase et **ne doit jamais laisser partir une requête vers la vraie base**. Router par nom d'hôte (`new URL(u).hostname === "localhost"`, `.endsWith(".supabase.co")`), jamais par sous-chaîne de l'URL : les appels d'authentification portent `redirect_to=http://localhost…` et seraient sinon envoyés à la vraie base (incident du 25/09/2026, sans conséquence : inscriptions refusées par Supabase, aucune donnée créée).
