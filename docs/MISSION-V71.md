# Mission v71 — corrections « code pur » (décision de Lucas du 04/10/2026)

Mission autonome pour Claude Code : les sujets A à I ci-dessous, dans l'ordre, **sans s'arrêter entre les sujets**, puis un rapport unique. Rien côté base Supabase, rien dans `donnees/`, aucun push pendant la mission (Lucas pousse le lendemain). Les numéros de lignes sont ceux de la v70 (commit `732ecb7`) ; relire le fichier avant de modifier, ils ont pu bouger.

## Règles de la mission (complètent `CLAUDE.md` ; en cas de doute, `CLAUDE.md` prime)

- **Branche** : `v2/v71`, dans une copie `git worktree` hors du dépôt (scratchpad de la session), depuis `main` à jour. Un **commit par sujet** (message en français : `v71 (A) : …`), jamais un commit qui mélange deux sujets : Lucas doit pouvoir retirer un sujet sans toucher aux autres.
- **Aucun push** pendant la mission (ni `main`, ni `v2/v71`). Le matin, Lucas pousse la branche pour le banc GitHub, puis `main` après son « ok ».
- **Tests pendant la mission** : après chaque sujet, lancer en local les suites listées pour ce sujet (depuis `tests-locaux/`, commande dans `CLAUDE.md` → « Une suite en local » ; une suite à la fois, deux au plus). Une suite rouge = corriger, jamais retirer ni affaiblir une vérification. Une suite qui affirmait l'ancien comportement voulu (ex. texte exact « Non respecté ») est **adaptée** au nouveau, même nombre de vérifications ; une vérification ajoutée = `attendu()` de `banc.sh` monté d'autant.
- **`verif52`** compare les écrans du client Thomas au commit précédent de `main` : tout changement visible côté client est une « différence voulue » à déclarer dans la suite, sur le modèle de `PARTAGE_V70` (commit `732ecb7`).
- **À la fin** : `MHX_FICHIERS = "71"` et `CONFIG.marque.version = "2026-10-05 · 71"` (une seule fois, dernier commit), une ligne dans `docs/HISTORIQUE.md`, une note courte pour Grok Bot dans `NOTESCLAUDE.md`, puis **le banc complet en local** (`bash tests-locaux/banc.sh`, ~35 min). `CLAUDE.md` → « État actuel » ne change qu'une fois la v71 en ligne (Lucas le dit).
- **Rapport final** (langage simple, court) : par sujet, ce qui a été fait, fichiers, numéro du commit, comment le tester sur le téléphone ; les suites lancées et leur résultat ; les questions notées ; ce qui n'a pas été fait et pourquoi.
- **Tu t'arrêtes** (tu notes et tu passes au sujet suivant, sans deviner) si : un sujet demanderait une écriture dans la base ou une migration ; une suite reste rouge après trois corrections ; une règle de `CLAUDE.md` serait contredite ; tu ne comprends pas ce que Lucas veut. Tu notes la question dans « Questions pour Lucas » en bas de ce fichier et tu choisis l'option la plus prudente (souvent : ne pas faire ce point).
- **Invariants** : toute nouvelle phrase visible côté client a son entrée `I18N.en` ; pas de `alert`/`confirm`/`prompt` natifs (objet `UI`) ; aucune nouvelle dépendance ; ne jamais commiter le dossier `Claude outputs/` (non suivi) ; `git add` par fichier, jamais `-A`.

---

## A. Régularité « — » tant qu'il n'y a rien à mesurer (petit)

**Aujourd'hui** : `Regularite.calculer` (`js/outilProgramme.js:341-345`) compte toujours la part « mesure », donc `score` n'est jamais `null` : un client sans programme ni diète voit « 0/100 » en rouge dès le premier jour (`js/outilAccueil.js:319`) et cinq barres à 0 dans Mon suivi, alors que le commentaire du code promet qu'une partie sans objet sort du calcul.

**À faire** : ne compter la part « mesure » que s'il existe au moins une autre part (séances ou repas) ou au moins une mesure enregistrée ; sinon `score: null` (l'accueil affiche déjà « — » dans ce cas). Vérifier `Regularite.niveau(null)`, la tuile de l'accueil (`:319`), Mon suivi (`js/outilProgramme.js:404-410`), les barres d'évolution (`monterClient`), « Mes clients » (`js/outilClients.js`, colonne Régularité : `l.reg == null` est déjà géré, `:577`) et « Préparer le call ».

**Ne change pas** : le calcul quand il y a un programme ou une diète ; les pondérations `CONFIG.regularite`.

**Suites** : `verif35`, `verif36`, `verif42`, `verif60`, `verif37` ; si une suite comptait un « 0/100 » pour un client sans programme, l'adapter.

## B. Déconnexion : ne retirer que ce qui appartient au compte (petit)

**Aujourd'hui** : `Auth.deconnecter` (`js/auth-store.js:285-288`) efface toutes les clés `mhx_*` : `mhx_theme`, `mhx_langue`, `mhx_installe`, `mhx_visites` (la bannière d'installation revient après chaque reconnexion, `js/installation.js:30-53`) et **`mhx_refus|…`**, alors que la v67 promet qu'une modification refusée « reste gardée » ; l'avertissement avant déconnexion (`:281-282`) ne compte que `mhx_attente`.

**À faire** : à la déconnexion, retirer `mhx_session`, et les clés liées à un compte (`mhx_attente|…`, `mhx_refus|…`, `mhx_invitations|…`, `mhx_activite_attente|…`, `mhx_tracking`, et les brouillons du sujet G) ; **garder** `mhx_theme`, `mhx_langue`, `mhx_installe`, `mhx_visites`, `mhx_decouverte_jour`. L'avertissement compte aussi les refus gardés (texte à adapter, FR + EN). Sur un appareil partagé, rien d'un compte ne doit rester : c'est le critère.

**Suites** : `verif48`, `verif74`, `flux`.

## C. Fiche d'un client : questionnaire lisible, boutons d'affichage vivants (petit)

**Aujourd'hui** : en consultation, `css/communs.css:282-283` met `pointer-events:none` sur tous les champs, boutons et liens `.btn` des panneaux ; les réponses longues du questionnaire sont des `<textarea rows="2">` qu'on ne peut ni dérouler ni agrandir (`js/outilProfil.js:148`) : le coach lit 2 lignes sur 10. Les commandes **d'affichage pur** sont mortes aussi : chips des zones et de la composition dans « Ses courbes » (`js/outilMensurations.js:379-391`, « affichage seul, rien n'est écrit »), « Afficher les séances plus anciennes » (`js/outilJournal.js:63`).

**À faire** : (1) en consultation (`Store.idConsulte`), rendre chaque réponse du questionnaire en texte (`<p class="checkin-rep">` ou équivalent existant), pas en champ désactivé ; une réponse vide = « — » ; (2) un attribut `data-lecture-ok` sur les commandes d'affichage pur (chips de Ma progression, bouton du journal, et tout autre bouton qui n'écrit rien), exclu de la règle CSS (`:not([data-lecture-ok])`). Vérifier qu'aucune de ces commandes n'écrit (grep `Store.ecrire` dans leurs gestionnaires).

**Ne change pas** : la lecture seule des vrais champs ; les outils `MODIFIABLES`.

**Suites** : `verif37`, `verif38`, `verif42`, `verif60`, `verif-xss` (les réponses sont rendues en HTML : `esc()` obligatoire).

## D. « Mes clients » = les clients (petit)

**Aujourd'hui** : le tableau de Mes clients (`js/outilClients.js:88` : `filter(p => p.role !== "coach")`, `:123`) inclut les prospects, et le score d'urgence (`:574-582`) les classe devant les clients sains (un prospect sans questionnaire, programme ni diète = 80 points). Avec l'inscription ouverte, des dizaines de cartes de prospects s'intercalent. La page Prospects existe depuis la v51.

**À faire** : le tableau « Suivi de mes clients » ne liste que `statut !== "prospect"` (un compte sans colonne `statut` reste un client, comme partout) ; une ligne sous le titre « Les prospects sont dans Prospects » avec le lien `#/prospects` et leur nombre. La section « Comptes » garde tout le monde (c'est là qu'on passe un prospect client). Les encadrés d'alertes (« Sans nouvelles… », « Il manque quelque chose… ») ne parlent que des clients.

**Ne change pas** : `Clients.charger`, `Clients.resumer` (le tableau de bord et Prospects s'en servent) ; la section Comptes.

**Suites** : `verif37`, `verif39`, `verif43`, `verif55`, `verif58`, `verif61`, `verif62`.

## E. Nutrition : « Respecté ? » et panier (petit)

**Aujourd'hui** : chaque repas pas encore coché porte un bouton « Non respecté » (`js/outilNutrition.js:575`) : le client est jugé avant d'avoir mangé. La liste de courses n'est jamais remise à zéro (`:730-734`) : la semaine suivante, tout est déjà coché.

**À faire** : (1) libellé « Respecté ? » tant que le repas n'est pas coché, « ✓ Respecté » après (FR + EN ; la classe `on` et la clé `mange` ne changent pas) ; (2) un bouton « Vider la liste » au-dessus de la liste de courses (confirmation `UI.confirmer`), et vidage automatique quand la diète change (mémoriser dans `repas_suivi` le `R.maj` pour lequel les courses ont été cochées, ex. `courses_pour`, et repartir à vide quand il diffère ; ancien document sans `courses_pour` : rien ne change jusqu'au prochain changement de diète).

**Ne change pas** : le comptage de la régularité ; la forme des autres champs de `repas_suivi`.

**Suites** : `verif35`, `verif42`, `verif52` (différence voulue : textes de la page Nutrition de Thomas), `verif56`, `verif60`.

## F. Réseau faible : plus jamais un écran faux (moyen)

**Aujourd'hui** : (1) `Auth.appel` (`js/auth-store.js:84-116`) n'a aucun délai : une requête figée = « Chargement… » sans fin ; (2) `js/demarrage.js:218` avale l'échec de `Auth.chargerProfil()` : un prospect voit alors l'app client sans cadenas, le coach voit « Bienvenue ! Commence par remplir ton profil » ; (3) une lecture ratée (`Store.lire`, `:646-653` ; `Store.lireTout`, `:676-685`) renvoie les défauts, donc « Ton coach n'a pas encore déposé ton programme » (`js/outilProgramme.js:545-547`), « pas encore validé tes repas » (`js/outilNutrition.js:520-521`) et un accueil vide ; (4) quand le renouvellement du jeton échoue pour le réseau ou un 5xx (`js/auth-store.js:139-142`), `js/demarrage.js:210` affiche l'écran de connexion sans un mot, puis la connexion renvoie « Erreur 5xx » brut (`js/connexion.js:168`).

**À faire** :
1. Dans `Auth.appel`, un délai de 15 s (`AbortController` + `setTimeout`, ou `AbortSignal.timeout` si disponible), **sauf** pour les envois `keepalive` ; l'erreur de délai est une erreur réseau (même traitement que `TypeError: Failed to fetch`).
2. `demarrage.js` : si `chargerProfil` échoue pour une raison réseau/5xx (pas un 401/403), afficher une page « Impossible de charger ton compte pour le moment » avec un bouton « Réessayer » (qui relance `demarrer()` ou recharge), et ne rien afficher de l'app ; relancer aussi au retour du réseau (`online`).
3. `Store.lire` / `lireTout` : garder le comportement (défauts, écriture interdite) mais exposer l'échec (`Store.charge[uid|cle] === false` existe déjà ; `lireTout` renvoie en plus `erreur: true`). Les écrans qui affichent un état vide (« pas encore de programme », « pas encore de repas », accueil, Mon suivi, Ma progression, Speed Formation) affichent à la place « Pas de connexion : tes données n'ont pas pu être chargées. » + bouton « Réessayer » (relance `afficher(courant)`). Texte en `UI`/`.flag`, jamais `alert`.
4. Écran de connexion : quand on y arrive à cause d'un échec réseau/5xx du renouvellement (session gardée), afficher « Service momentanément indisponible, réessaie dans une minute » plutôt que rien ; une connexion qui échoue avec un 5xx ou une erreur réseau affiche ce même message, jamais « Erreur 540 ».
Toutes les phrases : FR + `I18N.en`.

**Ne change pas** : la règle « une lecture ratée interdit l'écriture » ; `rafraichir` ; les copies locales.

**Suites** : `verif48`, `verif63`, `verif66`, `verif72`, `verif73`, `verif74`, `verif34`, `verif42`, `verif52` (différence voulue si un texte de Thomas change — normalement non : Thomas a du réseau dans le banc). Ajouter des vérifications (dans une suite existante ou `verif79`) : lecture figée → « Pas de connexion » après le délai ; profil en 500 → page « Impossible de charger » ; `attendu()` mis à jour.

## G. Noter une séance : brouillon et confirmation (moyen)

**Aujourd'hui** : le formulaire de séance (`js/outilProgramme.js:239-268`, champs `:209-212`) ne garde rien avant « Séance terminée » : l'app tuée par iOS entre deux séries, ou un tap sur « Annuler », efface 45 minutes de saisie.

**À faire** : (1) brouillon local `mhx_brouillon|<uid>|<si>` (localStorage, `try/catch`) écrit à chaque `input` (reps, charges, date si elle existe) ; (2) à l'ouverture du programme, si un brouillon existe pour une séance : le formulaire s'ouvre pré-rempli avec une ligne « Séance en cours reprise » et un lien « Effacer le brouillon » ; (3) « Annuler » avec des chiffres saisis demande confirmation (`UI.confirmer`) ; (4) le brouillon est effacé après un « Séance terminée » qui a réussi (`Store.ecrire` a renvoyé `true`), jamais avant. Brouillon = par compte (jamais lu chez un autre compte, jamais en consultation coach). FR + EN.

**Ne change pas** : la forme de `journal` ; le calcul de la charge proposée.

**Suites** : `verif35`, `verif42`, `verif60`, `verif63`, `verif74`, `verif52` (différence voulue si l'écran de Thomas change) ; ajouter : saisie → rechargement → formulaire pré-rempli ; « Séance terminée » → brouillon effacé ; « Annuler » demande confirmation.

## H. Prospect : une action dorée, et plus de « Récupérer » après réservation (moyen)

**Aujourd'hui** : (1) après calcul + pesée, `etape()` renvoie `""` (`js/outilDecouverte.js:979-991`) : l'accueil du prospect le plus engagé n'a plus aucune action mise en avant, le CTA est un `btn ghost petit` en haut (`:891-895`) ; (2) après « J'ai déjà choisi mon créneau » (`Decouverte.reserve(C)`), les boutons « Récupérer mon plan d'action » restent sur l'accueil (en-tête `:891-895`, carte accomp `:1276-1280`), sur chaque page verrouillée (`js/navigation.js:62-67`, `pageVerrouillee`) et sur « Modifier mes réponses ».

**À faire** : (1) troisième carte d'étape quand calcul et pesée sont faits et qu'aucune réservation n'est cochée : titre « Ta prochaine étape », texte court, bouton doré « Récupérer mon plan d'action » + sous-ligne `DECOUVERTE.cta.sous`, origine `accueil_etape` ajoutée à `Decouverte.ORIGINES` (et son libellé côté coach : chronologie de la fiche, bloc « Mesure », CSV — regarder comment `declic_calculateur` est libellé et faire pareil) ; (2) quand `Decouverte.reserve(C)` est posé : plus aucun « Récupérer mon plan d'action » côté prospect ; à la place, dans l'en-tête de l'accueil, une ligne « Créneau choisi le {d} — Lucas t'appelle à l'heure réservée » et, sur les pages verrouillées, le texte d'appel sans bouton (la pastille `reserve_ok` existe déjà, s'en servir). `navigation.js` lit déjà `Store.cache[Decouverte.cle]` (`:404`) : pas de lecture de plus. Textes dans `DECOUVERTE` (FR) et `DECOUVERTE.en`.

**Ne change pas** : la page « Ton plan d'action » ; `Decouverte.clic` / `reserver` ; les invitations.

**Suites** : `verif50`, `verif51`, `verif56`, `verif65`, `verif67`, `verif68`, `verif69`, `verif62`, `verif55` (coach) ; ajouter : prospect avec calcul + pesée → carte dorée présente, origine `accueil_etape` notée au clic ; prospect réservé → aucun bouton « Récupérer » sur accueil et pages verrouillées.

## I. Consultation : le client consulté dans l'adresse (moyen, dernier)

**Aujourd'hui** : `Store.idConsulte` vit en mémoire (`js/auth-store.js:609`). Un rechargement (ou la PWA tuée) sur `#/programme` pendant la consultation de Marie rouvre **le propre programme du coach**, titre « Mon programme », sans bandeau (`js/navigation.js:311-312`, `:18-21`) : un modèle chargé là part chez lui. « Revenir à mes clients » (`:432-435`) renvoie toujours dans Mes clients, même en venant du tableau de bord ou de Prospects.

**À faire** : (1) adresse canonique `#/client/<uuid>/<outil>` posée par `Clients.ouvrir` et par le bandeau ; `routeDepuisAdresse` (`js/connexion.js`) et le routage (`navigation.js`) la reconnaissent : si le coach arrive sur une telle adresse sans `Store.idConsulte`, relire `profils?id=eq.<uuid>` (nom via `Clients.nom`) et poser `idConsulte`/`nomConsulte` **avant** d'afficher ; un uuid inconnu ou un compte non coach → `#/clients` ; (2) les anciennes adresses `#/programme` etc. continuent de marcher **à l'intérieur** d'une consultation déjà ouverte (les suites en dépendent) ; hors consultation, elles restent les pages du coach ; (3) `Store.retourVers` = écran d'origine (`tableau`, `clients`, `prospects`) mémorisé par `Clients.ouvrir`, libellé du bouton « Revenir au tableau de bord / à mes clients / aux prospects » ; (4) l'onglet « Entraînement » (journal perso du coach, `js/outilEntrainement.js:7`) n'apparaît plus pendant une consultation.

**Ne change pas** : `Store.origines` et les garde-fous d'écriture ; le contenu du bandeau.

**Suites** : `verif37`, `verif38`, `verif41`, `verif42`, `verif55`, `verif60`, `verif61`, `verif62`, `verif76`, `verif77`, `rig` ; ajouter : rechargement sur `#/client/<uuid>/programme` → bandeau présent, programme du client ; retour vers l'écran d'origine.

---

## Fin de mission
1. Version 71 (`MHX_FICHIERS`, `CONFIG.marque.version`), `docs/HISTORIQUE.md`, `NOTESCLAUDE.md` (note courte pour Grok Bot : rien à faire côté `donnees/`, tests en lecture seule à faire une fois en ligne).
2. `bash tests-locaux/banc.sh` complet, en local. Rouge = corriger puis relancer la suite concernée ; si le banc complet n'a pas pu être vert, le dire dans le rapport (ne jamais ajuster `attendu()` pour masquer un rouge).
3. Rapport final dans la conversation **et** copié dans `.claude/session-notes/` (non commité).
4. STOP. Le matin, Lucas : `git push origin v2/v71` (banc GitHub), puis « ok » → fusion dans `main` et push, puis vérification sur son téléphone, puis « État actuel » de `CLAUDE.md` et retrait de la ligne « Mission v71 » du « Mode de travail ».

## Questions pour Lucas
*(notées pendant la mission ; option prudente prise en attendant)*

- **Démarrage** : le dossier de travail de la session était `MHX-Code` (pas `mhx-plateforme`) : les réglages `.claude/` du dépôt n'ont pas été chargés automatiquement ; la mission a été faite par chemins absolus dans la copie `v2/v71`. À vérifier au lancement des prochaines sessions.
- **A** : un client avec une diète posée mais aucun repas encore coché garde « 0/100 » (comme aujourd'hui ; « ne change pas le calcul quand il y a une diète ») — « — » serait possible, à trancher. Un programme sans exercice nommé ou une diète à l'ancien format donnent « — ».
- **B** : les choix d'affichage par compte (`mhx_aff|<compte>|…`, courbes et semaine de la diète) sont effacés à la déconnexion (ils portent l'identifiant du compte : appareil partagé) ; `mhx_visite_comptee` (drapeau d'onglet) est gardé ; la suppression de compte garde son effacement complet d'avant ; le brouillon de séance (G) part à la déconnexion sans être compté dans l'avertissement ; un refus écrit après une session perdue (`a: null`) n'est pas compté. La langue de l'appareil (`mhx_langue`) reste : un compte sans langue enregistrée qui se connecte ensuite sur le même appareil voit la dernière langue choisie.
- **C** : le `select` de la semaine dans « Sa formation » (`#fo-sem`) reste mort en consultation (ce n'est pas un bouton) ; toutes les réponses du questionnaire portent `data-notr` (jamais traduites, même les choix) ; verif44 (hors banc, obsolète) lisait `#q-poids` comme un champ.
- **D** : la ligne « Les prospects sont dans Prospects → (0 compte gratuit). » s'affiche aussi à zéro ; la branche « pastille prospect » de la ligne du tableau (`outilClients.js`, ligne de `tableau()`) est devenue morte et a été laissée ; 17 suites adaptées (ouverture d'un prospect par `Clients.ouvrir`, lectures sur la carte Prospects), nombres inchangés.
- **E** : le panier est vidé à chaque changement de `R.maj` (lettre du sujet) : « Générer la semaine » (`maj` vide) puis « Valider et envoyer » (`maj` posé) font deux remises à zéro ; `R.debut` donnerait une seule remise à zéro par diète. Le bouton « Vider la liste » est toujours affiché (grisé tant qu'aucun article n'est coché). La page Nutrition de Thomas n'est pas comparée par verif52 (seuls l'accueil et le Profil le sont) : aucune différence voulue à déclarer. `docs/HANDOFF-CLAUDE-CODE.md` (forme de `repas_suivi`) n'a pas été retouché.
- **F** : non traités (hors liste du sujet) : « Mon journal » (« pas encore déposé ton programme ») et la fiche coach vide sur lecture ratée ; l'inscription (`connexion.js`) et le changement de mot de passe (« Ton mot de passe actuel n'est pas le bon ») affichent encore un message brut sur un 5xx ou une coupure. Ajouté dans l'esprit du sujet : « Bienvenue ! » n'est plus affiché quand le questionnaire est illisible ; Ma progression affiche « Chargement… » (et non « Pas encore de mesure ») pendant la lecture. « Réessayer » relit la page sur place sans retour en haut. Le mécanisme v56 « profil relu au retour au premier plan » ne joue plus au démarrage (la page « Impossible de charger » remplace l'app) : verif61 B adaptée ; verif68 (bloc I : « mens » et « formation » illisibles affichent « Pas de connexion » au lieu du formulaire dont l'écriture était refusée) et verif66 adaptées, même nombre ; l'accueil du prospect n'affiche « Pas de connexion » que si `intake` est illisible (`challenge` illisible seule : accueil sans carte, comme avant, verif68 l'affirme).
- **G** : le formulaire n'a pas de champ date (rien à mémoriser) ; le brouillon est aussi effacé par « Annuler » confirmé et par « Effacer le brouillon » (sinon il se rouvrirait aussitôt) ; un brouillon est lié à l'index de la séance : si le coach remplace le programme, le brouillon de la séance 3 pré-remplirait la nouvelle séance 3 (mémoriser le nom ou `P.maj` serait une amélioration, non codée). Libellés de la confirmation : « Continuer » / « Abandonner ».
- **H** : sur une page verrouillée rechargée directement, la réservation faite sur un AUTRE appareil n'est pas connue (pas de lecture de plus, conformément au sujet ; la case cochée sur cet appareil est connue par `mhx_invitations`) ; une invitation du jour (carte dorée) peut cohabiter avec la carte « plan » (deux boutons dorés : gardé) ; la note « 15 min avec Lucas pour faire le point… » reste sur la carte d'un prospect réservé ; la pastille `#dc-reserve-ok` (nowrap) peut déborder à 320 px (préexistant).
- **I** : les adresses nues (`#/programme`) tapées dans une fiche restent telles quelles (acceptées, pas réécrites : des suites les affirment) ; les onglets, la barre du bas et le volet « Plus » posent l'adresse canonique en consultation ; un rechargement sans origine connue donne « Revenir à mes clients » ; un uuid de coach ou inconnu, ou une lecture ratée du profil → Mes clients ; une adresse `#/client/…` ouverte déconnecté est perdue à la connexion (comme toute adresse). Les libellés « Revenir … » ne sont pas traduits (écran du coach).
- **Suites** : verif38 est rouge en local sur ce Mac ce dimanche (1 ✗ « bilan = date d'envoi du bilan »), AVANT la mission aussi (v70) : la classe `Date` remplacée côté Node (verif36/38) n'est plus prise en compte par `clock.install` de Playwright 1.63 pour un nouveau document (l'horloge du navigateur reste réelle), donc la date écrite n'est pas le samedi attendu ; expériences dans le scratchpad de la session. Rien n'a été modifié dans verif38 : à décider (sur GitHub, le banc de la v70 était vert).
