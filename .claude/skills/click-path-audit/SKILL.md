---
name: click-path-audit
description: Suit chaque bouton de la plateforme MHX, du clic à l'état final (Store, programme P, localStorage, navigation, Supabase), pour trouver les boutons « qui ne font rien » — deux fonctions justes qui s'annulent, une course entre appels, une page rechargée qui efface la saisie. Quand un bouton est signalé cassé sans erreur visible, ou après un changement de Store, de navigation.js ou d'un objet partagé.
metadata:
  origin: ECC (https://github.com/affaan-m/ECC, v2.2.2, licence MIT — .claude/LICENCE-ECC.txt), adapté pour MHX
---

# Audit des parcours de clic — plateforme MHX

Réponds en français simple (Lucas n'est pas développeur). **Les règles de `CLAUDE.md` priment** (zéro perte de données, lecture avant d'agir). Cet audit est **en lecture seule** : il rapporte, il ne corrige rien sans la demande de Lucas.

Il trouve ce qu'une relecture ligne à ligne rate : chaque fonction marche seule, mais **l'enchaînement** laisse un état faux — le bouton existe, rien ne plante, et pourtant rien ne se passe, ou la saisie repart à zéro.

## Pourquoi c'est un risque ici

Tous les fichiers `js/` partagent la **même portée globale** : un appel à `afficher()`, `Store.oublier()` ou un changement de `location.hash` peut défaire, en passant, ce qu'une autre fonction vient de poser. Exemple réel de l'app : un outil oublié dans `MODIFIABLES` (`js/navigation.js`) passe la page du coach en lecture seule — **tous ses boutons deviennent inertes, sans message**.

## Étape 1 — Carte des objets partagés (à faire d'abord)

Pour chaque objet ou fonction partagé touché par la zone auditée, noter ce qu'il **pose** et ce qu'il **remet à zéro en passant** :

```
Store (js/auth-store.js)
  ecrire(cle, v)      → pose : boite[uid][cle], copie mhx_attente|uid|cle, envoi dans 700 ms
                        refuse (renvoie false) : clé du coach seul, Sante.bloque, fiche changée,
                        lecture ratée, coach en lecture seule hors programme/repas/calc/complements
  lire(cle, defaut)   → pose : boite[uid][cle], charge[k] ; lecture ratée → nonLus (plus jamais écrit)
  oublier(uid)        → REMET À ZÉRO : la boîte de ce compte
  annuler(cle)        → REMET À ZÉRO : l'envoi en attente et sa copie sur l'appareil
  idConsulte / nomConsulte → changent la cible de TOUTES les lectures et écritures
afficher(id, …) (js/navigation.js)
  → REMET À ZÉRO : #vue (innerHTML), nettoyage() de la page précédente, Store.idConsulte si l'outil est « coach »
  → jeton d'affichage : un init() plus ancien qui finit après est ignoré
location.hash / hashchange → routeDepuisAdresse (js/demarrage.js) → afficher()
P (document « programme » lu par Store.lire, variable locale des outils : programme, suivi, accueil, bilan)
  → objet partagé par référence : le modifier puis relire écrase la modification ; l'objet d'un autre compte est refusé (origines)
localStorage / Auth.magasin() : mhx_session, mhx_attente|…, mhx_activite_attente|…, mhx_invitations|…, mhx_theme, mhx_langue…
UI (js/interface.js) : confirmer() / toast() — une fenêtre ouverte en remplace une autre (UI._ouverte)
Autres selon la zone : Sante, CleCoach, Checkin._file, Decouverte, Activite, Theme, Traduction
```

Lister à part les **remises à zéro dangereuses** : une fonction qui efface un état qu'elle ne possède pas (ex. `afficher()` qui vide `#vue` pendant qu'une saisie attend ; `Store.oublier()` avant un envoi ; `annuler()` d'une clé qu'un autre bouton vient d'écrire).

## Étape 2 — Suivre chaque bouton

Pour chaque bouton, case, sélecteur ou formulaire de la zone (écouteurs posés dans `init()` des `outil*.js`, `data-…` délégués, liens `#/…`) :

```
BOUTON (exemple fictif) : « Enregistrer le programme » — js/outilProgramme.js
  ÉCOUTEUR : click → {
    1. P.semaines[i] = …          → pose P
    2. Store.ecrire("programme", P) → renvoie false (lecture ratée)   ← refus
    3. flash("pg-ok", "Enregistré")                                  ← annonce un succès
  }
  ATTENDU : le programme est enregistré, ou un message dit pourquoi non
  RÉEL : « Enregistré » affiché, rien n'est parti
  VERDICT : BOGUE — faux succès
```

Motifs à chercher :

1. **Annulation en chaîne** : un appel pose un état, le suivant l'efface en passant (`Store.ecrire` puis `afficher()` / `location.hash = …` qui recharge la page avant les 700 ms, `Store.oublier()` puis lecture).
2. **Course asynchrone** : deux `await` (ou `.then`) dont l'ordre d'arrivée décide du résultat — double clic, changement de fiche pendant une lecture, `Checkin` relu pendant qu'un bilan écrit, `jeton !== affichage` oublié.
3. **Objet périmé** : un `P` (ou autre document) lu avant un changement de fiche, de langue ou de page, puis écrit après ; une variable capturée par un écouteur posé à l'ancien affichage.
4. **Transition manquante** : le bouton dit « Enregistrer » / « Envoyer » / « Supprimer » mais ne fait que valider, ou appelle une route Supabase que la RLS refuse (403 non affiché).
5. **Chemin mort** : la condition qui mène à l'action est toujours fausse à ce moment (`Store.lectureSeule()`, `Auth.estProspect()`, interrupteur `Interrupteurs` sur « test », `Sante.aDemander()`, page verrouillée `estVerrouille`).
6. **Écouteur perdu** : `#vue` réécrit par `innerHTML` après le branchement, écouteur posé deux fois (action doublée), `nettoyage()` qui retire l'écouteur d'une page encore affichée.
7. **Retour ignoré** : `Store.ecrire(...)` renvoie `false`, `UI.confirmer` renvoie `false` / `undefined` (fermeture par Échap), et la suite agit comme si c'était oui.

## Étape 3 — Rapport

```
CLICK-PATH-001 [CRITIQUE / HAUTE / MOYENNE / BASSE]
  Bouton : « … » — js/fichier.js:ligne (côté client / prospect / coach)
  Motif : annulation en chaîne / course / objet périmé / transition manquante / chemin mort / écouteur perdu / retour ignoré
  Déroulé :
    1. appel → pose {…}
    2. appel → REMET À ZÉRO {…}   ← conflit
  Attendu : ce que promet le libellé du bouton
  Réel : ce qui se passe
  Correction proposée : (sans l'appliquer) + le test à ajouter dans tests-locaux/ (suite verifNN.js, agent e2e-runner)
```

CRITIQUE = une saisie peut être perdue ou écrite chez le mauvais compte ; HAUTE = bouton sans effet ou faux succès ; MOYENNE = effet obtenu après un détour ; BASSE = détail. **Zéro bogue est un résultat normal.**

## Portée

L'audit coûte cher : le limiter.

- **Une page** : après une nouvelle page ou un bouton signalé cassé.
- **Un objet partagé** : après un changement de `Store`, `afficher()`, `Sante`, `CleCoach` ou `Checkin` — suivre tous ses appelants (`grep` dans `js/`).
- **Toute l'app** (avant une grosse version) : d'abord l'étape 1 seule (carte des objets), puis un agent par groupe, en lui donnant la carte :
  - prospect : `outilDecouverte`, `outilFormation`, `outilAccueil`, pages verrouillées (`navigation.js`), accord santé ;
  - client : `outilProgramme`, `outilEntrainement`, `outilNutrition`, `outilSuivi` (Checkin, bilan), `outilMensurations`, `outilJournal`, `outilCalculateur`, `outilProfil` ;
  - coach : `outilClients`, `outilProspects`, `outilTableau`, fiche client (`idConsulte`, `CleCoach`, notes privées), `outilAtelier`, `outilBibliotheque`, `outilCatalogue` ;
  - commun : connexion, inscription, déconnexion (`js/connexion.js`, `js/demarrage.js`), thème, langue, installation.

## Quand ne pas l'utiliser

- Réponse de Supabase mal formée, RLS, SQL : agent `database-reviewer`.
- Échec d'écriture sans message, en général : agent `silent-failure-hunter`.
- Mise en page, couleurs : skill `make-interfaces-feel-better`.
- Lenteur : mesurer d'abord.
