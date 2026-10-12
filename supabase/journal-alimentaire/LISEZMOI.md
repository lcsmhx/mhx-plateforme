# v79 — Journal alimentaire : la base

**État au 13/10/2026 : AUCUN CHANGEMENT EN BASE, et aucun n'est nécessaire.**

## Pourquoi rien à appliquer
- Les limites d'écriture v78 (`../v78-limites/`) **ne sont pas en base** : vérifié le 13/10/2026 en lecture seule (aucune
  fonction `v78_*`, aucun déclencheur sur `donnees`). Sans elles, chaque compte peut déjà écrire ses propres clés, quel que
  soit leur nom : `journal_alimentaire` passe telle quelle.
- La lecture par le coach, et seulement par lui, est déjà la règle : `donnees` SELECT =
  `(auth.uid() = user_id AND outil <> ALL('notes_coach','suivi_prospect')) OR est_coach()` (HANDOFF §2.3, inchangée depuis la
  v49). Un autre compte ne lit rien ; le coach lit mais n'écrit pas (la clé n'est pas dans la liste des clés du coach).

## Ce qui a changé (fichiers seulement)
- `journal_alimentaire` ajoutée à la liste des limites v78, **1 Mo** (prospect : 256 Ko, le plafond commun) :
  `02-migration.sql` (fonction `public.v78_limite`), ses copies `01`, `04` (test 3 : 28 clés), `05`, et
  `../releve-2026-09-30/INVENTAIRE-CLES.md` (taille réaliste et marge) ; `06-repetition.sql` refait par
  `node garde-cles.js ../index.html --refaire-06` ; `garde-cles.js` vert (28 clés). Le jour où la v78 est appliquée, la clé y
  est déjà : rien à faire de plus pour le journal.
- Si la v78 était appliquée AVANT cette version de `02` : `CREATE OR REPLACE FUNCTION public.v78_limite` avec le corps du `02`
  actuel (non destructif), avec l'« ok » de Lucas, puis `05-verifications.sql`.

## Retour arrière
- En base : rien à retirer (rien n'a été appliqué).
- Fichiers : `git revert` du commit de cette étape.

## Tests (lancés le 13/10/2026 sur la vraie base, transaction annulée)
`tests-rls.sql` : trois comptes fictifs créés et annulés dans la transaction (un client « de test », un coach, un prospect).
L'ancien compte client de test `9df6bb84…` **n'existe plus en base** (ni compte, ni profil, ni données) : signalé à Lucas,
qui crée un nouveau compte client de test.
Résultat : `v79 : 15 / 15 tests OK — aucun échec. Annulation forcée : rien n'est gardé.`
(le client écrit, relit et réécrit son journal ; il écrit toujours `mens` ; un autre compte ne lit, n'écrit ni ne modifie son
journal et tient le sien ; le coach lit le journal d'un client et d'un prospect, sans pouvoir le modifier ; l'anonyme ne lit rien).

## Sauvegarde et comptages (hors dépôt : `~/MHX-Code/sauvegardes/2026-10-13-avant-journal/`)
- `definitions-avant.json` : règles RLS (public, storage), fonctions, déclencheurs, droits, contraintes de `donnees` et `profils`.
- `comptage-avant.json` / `comptage-apres.json` : lignes, octets et empreinte md5 par clé, `profils` par rôle et statut
  (aucune donnée de client).
- Avant : `donnees` 266 lignes, `profils` 53. Après : `profils` 53 (même empreinte), `donnees` 267, toutes les clés identiques
  sauf `contact` (+1 ligne, écrite à 05:36 WITA par l'app au démarrage d'un compte) et `coach_visite` (même nombre, visite du
  coach à 05:44) : écritures normales de l'app pendant la séance (`ecart-explique.json`), aucune trace des tests (contrôles à 0 :
  comptes fictifs, profils fictifs, lignes `test_v79`).
