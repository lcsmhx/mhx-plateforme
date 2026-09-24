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
