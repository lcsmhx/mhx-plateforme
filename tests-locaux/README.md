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
node verif39.js ../index.html              # statut prospect / client, création d'accès, tuile « Prospects en découverte » (jours 7 / 8), inscription « Crée ton accès découverte » (conditions + données de santé), arrivée sur la Découverte sans écriture (43)
node verif40.js ../index.html              # mode gratuit (Découverte) : questionnaire court sans Calendly tant que court_le manque (jours 1, 5, 21), cadenas, pages verrouillées sans lecture ni écriture, Calendly pré-rempli, Speed Formation verrouillée au jour 8 (date, mode test), jour = date locale, aucun prix (pages, volets, inscription, I18N.en), pas de débordement, client / coach inchangés (81)
node verif41.js ../index.html              # photos de progression (Storage simulé avec ses règles) : envoi, comparaison, retrait, coach, index piégé, fichier disparu, index illisible (25)
node verif42.js ../index.html              # robustesse : clients aux données piégées (types faux, contenus bruts, listes piégées), filet de sécurité, page quittée pendant son chargement, changement de fiche, lecture ratée (20)
node verif43.js ../index.html              # affichage coach : compte sans prénom ni nom → « Sans nom » partout (avatar neutre, jamais l'identifiant) ; « Jamais rien saisi » classé à part de « Sans nouvelles depuis 10 jours » (34)
node verif44.js ../index.html              # OBSOLÈTE (Challenge 7 jours supprimé le 27/09/2026, remplacé par verif51) — funnel v44 : inscription simplifiée, démarrage prospect, jour 1 (écritures intake + challenge), déblocage / rattrapage / ordre, mode test, challenge terminé, clé piégée, anglais, mobile, client et coach inchangés (81)
node verif45.js ../index.html              # OBSOLÈTE (Challenge 7 jours supprimé le 27/09/2026, remplacé par verif51) — jours 2, 3, 4 du challenge : choix et actions, mini-séance et vidéos, habitude, relecture avant écriture (jeton, onglets, panne), lecture seule, anglais, mobile, accessibilité, deux appareils (54)
node verif46.js ../index.html              # OBSOLÈTE (Challenge 7 jours supprimé le 27/09/2026, remplacé par verif51) — jours 5, 6, 7 du challenge : personnalisation, projection, conversion, clics Calendly, hub, anglais, mobile, relecture ratée, écritures simultanées, mode test (74)
node verif47.js ../index.html              # OBSOLÈTE (Challenge 7 jours supprimé le 27/09/2026, remplacé par verif51) — retour du lien de confirmation, « Vérifie ta boîte mail », pastilles et bloc « Challenge 7 jours » côté coach, prospect piégé, messages Supabase, anglais, mobile (46)
node verif48.js ../index.html              # sessions, saisies gardées sur l'appareil, questionnaire et diagnostic pendant la frappe (40)
node verif49.js ../index.html              # suivi commercial des prospects (Découverte) : température à partir du questionnaire court, des clics « Réserver mon bilan » et de la case « J'ai réservé mon bilan », seuils et cas limites, anciens choix du jour 6 du Challenge ignorés, relances / issues (écriture conditionnelle vérifiée, conflit, 409, 504, verrou), Mes clients, fiche, tableau de bord, mode test de l'appareil sans effet côté coach, données piégées, prospect et client inchangés (78)
node verif50.js ../index.html              # interface prospect de la Découverte : lien Calendly central (utm avec la source du clic, prénom et email pré-remplis, interrupteur), confidentialité « Prise de rendez-vous » (FR / EN, Profil, inscription), navigation (vitrine programme / nutrition / suivi avec cadenas, pages cachées verrouillées sans lecture, anciennes adresses du Challenge, mode test, jour 8), clics notés avec leur source, aucune écriture en naviguant, barre du bas et menu « Plus » sur téléphone, client et coach (fiche bien ouverte) inchangés (60)
node verif51.js ../index.html              # funnel Découverte : Jour n/7 (date locale, vérifiée en UTC+8 et UTC−5 avec horloge fixée), questionnaire court (manquants, bornes exactes, brouillon pendant la frappe, garde 18 ans à la sortie du champ âge), résultat vraiment calculé (kcal, priorités), recettes du catalogue, séance, « Modifier » / « Revenir » sans écriture, clics « Réserver mon bilan » et case « J'ai réservé », jour 8, anciennes adresses, pages verrouillées sans lecture, mode test, ancien prospect du challenge, données piégées, anglais, mobile, coach (tuile, pastilles, fiche, mode test sans effet sur son appareil), client inchangé ; chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») (121)
```
Attendu sur la v44 : 78 pages (dont la prospecte « Léa » et l'écran d'inscription), 0 erreur, 0 écriture (aussi avec `--lang en` et `--theme light`) ; 19 + 13 + 14 + 13 + 15 + 67 vérifications ; verif39 43/43 (sur main, avant la Découverte : 37/43, les 6 échecs portent sur la Découverte) ; verif40 81/81 (sur main, avant la Découverte : 33/81, les 33 réussites portent sur des comportements inchangés) ; verif41 25/25 ; verif42 20/20 ; verif43 34/34 ; verif44 81/81 (sur la v43, verif44 tombe à 0/4 puis interruption : c'est ce qui prouve qu'il teste vraiment) ; verif45 54/54 (sur la v44 : 0/2 puis interruption) ; verif46 74/74 (sur la v45 : 0/9 puis interruption) ; verif47 46/46 (sur la v46 : 10/47 (dont une erreur JS sur une adresse mal encodée, corrigée en v47)) ; verif48 40/40 (sur la v47 : 2/7 puis interruption) ; verif49 78/78 (sur main, avant la Découverte : 35/78, les 43 échecs portent tous sur le nouveau comportement ; les 35 réussites sont des comportements inchangés : relances, issues, écriture conditionnelle, conflit, 504, 409, verrou, ancien client, confidentialité, client) ; verif50 60/60 (sur main, avant la Découverte : 17/60, les 17 réussites portent sur des comportements inchangés) ; verif51 121/121 (sur main, avant la Découverte : 20/87, dont 11 blocs interrompus comptés chacun pour un ✗ ; les 20 réussites portent sur des comportements inchangés, dont le client Thomas 5/5) ; verif-xss 5/5 (sur la v37, verif-xss détecte 15 exécutions). `rig.js --only prospect` ne rend que les pages de la prospecte. Une seule suite à la fois (ports fixes). Depuis la Découverte (27/09/2026), verif44 à verif47 testent le Challenge supprimé : ils échouent et ne font plus partie du banc (fichiers gardés pour l'historique).

## Sans Chromium Playwright : le Chrome de la machine
Si `npx playwright install chromium` n'a pas été fait, le préchargement `chrome-systeme.js` fait tourner tous les scripts avec Google Chrome installé (canal « chrome »), sans toucher aux tests :
```
NODE_OPTIONS="--require ./chrome-systeme.js" node rig.js --html ../index.html --out captures/v38
```

## Règle d'or des simulations
Chaque script intercepte Supabase et **ne doit jamais laisser partir une requête vers la vraie base**. Router par nom d'hôte (`new URL(u).hostname === "localhost"`, `.endsWith(".supabase.co")`), jamais par sous-chaîne de l'URL : les appels d'authentification portent `redirect_to=http://localhost…` et seraient sinon envoyés à la vraie base (incident du 25/09/2026, sans conséquence : inscriptions refusées par Supabase, aucune donnée créée).
