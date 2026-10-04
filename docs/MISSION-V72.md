# Mission v72 — téléphone obligatoire et parcours des inscrits (décision de Lucas du 04/10/2026)

Mission autonome pour Claude Code, lancée par Lucas après la mise en ligne de la v71 : les sujets A à F ci-dessous, dans l'ordre, sans s'arrêter entre les sujets, puis la mise en ligne si le banc est vert (« ok » de Lucas donné d'avance) et un rapport court.

## Cadre (message de Lucas)

- Branche `v2/v72` depuis `main` (v71 en ligne), dans un worktree hors du dépôt. Un commit par sujet : « v72 (A) : … ». Après chaque sujet, les suites concernées. `verif52` : chaque changement visible est déclaré en « différence voulue ». Une vérification ajoutée = `attendu()` de `banc.sh` monté dans le même commit.
- Toute phrase visible a sa traduction dans `I18N.en`. Pas d'`alert`/`confirm`/`prompt` natifs (objet `UI`). Aucun prix dans l'app. Rien de payant.
- Rien côté base : aucune migration, aucun changement de règles Supabase, jamais `donnees/`. Un sujet qui l'exigerait : question notée ici, sujet suivant.
- Jamais retirer ni affaiblir une vérification existante.
- Fin : version 72 (`MHX_FICHIERS`, `CONFIG.marque.version` « <date> · 72 »), ligne v72 dans `docs/HISTORIQUE.md`, banc complet en local, `git push origin v2/v72`, banc GitHub suivi (rouge : journal, correction, nouveau push), vert : fusion dans `main`, push, publication suivie jusqu'au vert, « · 72 » vérifié sur le site, « État actuel » de `CLAUDE.md` à jour, commit, push.
- STOP et explication si : 3 bancs rouges d'affilée, conflit de fusion, test à affaiblir. Jamais de push forcé.

## Les sujets (texte de Lucas)

**A — Téléphone obligatoire.** (1) Inscription (prospect) : champ « Ton numéro (WhatsApp) » obligatoire = menu d'indicatif (France +33 par défaut, Belgique +32, Suisse +41, Canada +1, Australie +61, Côte d'Ivoire +225, Sénégal +221, La Réunion +262) + numéro. « 06 12 34 56 78 » accepté (espaces, points, tirets ignorés, 0 initial retiré). Enregistré au format international sans espaces (+33612345678). Refus clair si moins de 6 ou plus de 14 chiffres. (2) Stockage : une clé dans la table donnees (outil « contact » : { telephone, ref, inscrit_le }) lisible par le compte lui-même et par le coach, comme les autres clés ; vérifier que les règles d'accès existantes couvrent ce cas sans changement. (3) Comptes existants (clients et prospects, jamais le coach) sans numéro : écran unique « Ajoute ton numéro pour que Lucas puisse te joindre » à la prochaine connexion, avant l'accueil, même champ, impossible à passer. (4) Mon compte : numéro affiché et modifiable. (5) Coach : numéro sur la fiche de chaque client et prospect et dans les tableaux Clients et Prospects, avec deux boutons « Appeler » (tel:+…) et « WhatsApp » (https://wa.me/ + chiffres sans le +). « — » si pas de numéro.

**B — L'inscription en premier.** (1) La page d'entrée s'ouvre sur « Créer mon compte » ; la connexion devient le lien « Déjà un compte ? Se connecter ». (2) Un appareil qui s'est déjà connecté au moins une fois (marqueur local `mhx_deja_venu` qui survit à la déconnexion) s'ouvre sur la connexion, avec le lien « Pas encore de compte ? Créer mon compte ». (3) Les liens d'invitation et de réinitialisation existants gardent leur comportement actuel.

**C — Calendly déjà rempli.** Partout où un prospect ouvre le lien de réservation (boutons bilan, pages verrouillées, accueil), ajouter au lien collé dans la config les paramètres Calendly name (prénom + nom), email et a1 (téléphone international), encodés, sans écraser les paramètres déjà présents dans le lien. Info manquante : pas de paramètre. Lien vide : comportement actuel inchangé.

**D — Bouton « Écrire à Lucas sur WhatsApp » (prospect).** (1) Nouveau réglage `CONFIG.marque.whatsapp = "+61418876361"`. (2) Sur l'accueil prospect et sur les pages verrouillées, sous le bouton de réservation, un bouton secondaire « Écrire à Lucas sur WhatsApp » qui ouvre `https://wa.me/61418876361?text=<message encodé>` avec « Salut Lucas, c'est [prénom], je viens de m'inscrire sur l'app MHX. » Réglage vide : pas de bouton.

**E — « Nouveaux depuis ta dernière visite » (coach).** En haut du tableau de bord coach : les prospects inscrits depuis la dernière visite du coach (date de la visite précédente gardée dans une clé donnees du coach lui-même, sinon en local si ce n'est pas possible sans changement de règles), avec prénom, date d'inscription, numéro et boutons Appeler / WhatsApp. Vide : « Aucun nouvel inscrit depuis ta dernière visite. » Dans le tableau Prospects, les plus récents en premier.

**F — Lien avec code (source des inscrits).** (1) Si l'adresse contient `?ref=xxx` (lettres minuscules, chiffres, tirets, 30 caractères au plus ; sinon ignoré), le garder en local jusqu'à l'inscription puis l'enregistrer dans la clé contact (champ ref). Le premier ref vu gagne. (2) Coach : colonne « Source » dans le tableau Prospects et sur la fiche (« — » si aucune), et dans le tableau de bord le nombre d'inscrits par source sur 30 jours.

## Ce qui a été vérifié avant de coder

- **Règles d'accès (sujet A.2, E)** : `docs/HANDOFF-CLAUDE-CODE.md` §2.3 (règles en place depuis la v49) : un compte lit, crée et modifie toutes ses lignes `donnees` sauf `feedbacks`, `notes_coach` et `suivi_prospect` ; le coach lit tout. La clé `contact` (écrite par le compte lui-même) et la clé de visite du coach (écrite par le coach chez lui-même) passent donc **sans aucun changement de règles**. Le coach ne peut pas écrire la clé `contact` d'un client (elle n'est pas dans sa liste) : il voit le numéro, il ne le corrige pas.
- Rien n'est écrit dans la base pendant la mission (suites locales et banc GitHub : Supabase simulé).

## Décisions prises (option prudente, à revoir par Lucas si besoin)

Remplies au fil des sujets ; le détail est dans chaque commit.

## Questions pour Lucas

Remplies au fil des sujets.
