# Rapport — mission « bloc 3 » : l'espace coach (13/10/2026)

## 1. Ce qui est en ligne
- **v83 — bloc 3, espace coach réorganisé** : en ligne (`main` cd7a163 ; banc GitHub de la branche `v2/bloc-3` vert, passage 38387284296, puis banc de `main` vert sur les 10 parties, WebKit compris, et publication réussie, passage 38388841529 ; site vérifié : `MHX_FICHIERS = "83"` et version « 2026-10-13 · 83 »).
- Lien : https://lcsmhx.github.io/mhx-plateforme/ (connecte-toi avec ton compte coach).
- Captures avant / après à 390 px (comptes fictifs) : `docs/maj-bloc-3/rapport/`.

## 2. Ce qui n'est pas fait, et pourquoi
- **« Générer un mot de passe » dans l'onglet Compte d'une fiche** : aujourd'hui, on ne peut générer un mot de passe qu'en créant
  un accès. Changer le mot de passe d'un compte qui existe déjà demanderait un nouveau service côté serveur, ce que la mission
  interdit. Le bouton reste donc dans « Créer un accès », comme avant.
- Rien d'autre : les 8 écrans, l'archivage, la fiche à onglets, le bouton WhatsApp, Créer un accès, les textes FR + EN, le retrait
  des polices Oswald et IBM Plex Mono, la nouvelle suite de tests verif86 et les captures sont faits.

## 3. Où l'archivage est rangé
- **Sans migration**, dans la clé `suivi_prospect` de la personne : celle du suivi commercial, que seul le coach peut lire et
  écrire (règles de la base). Un champ `archive_le` y prend la date de l'archivage ; « Restaurer » le remet à vide (`null`).
- Écrit avec l'écriture conditionnelle existante (`Commercial.modifier` → `CleCoach.ecrireSi`), qui relit la clé et garde tout le
  reste (Bilan réservé, issue, relances, historique). Jamais de DELETE.
- **Pourquoi pas `notes_coach`** (proposé par la mission) : tes notes privées réécrivent toute cette clé à chaque frappe ; une note
  tapée après un archivage l'aurait effacé sans prévenir. Et les listes ne lisent pas cette clé (il aurait fallu une lecture de
  plus pour chaque page). `suivi_prospect` est déjà lue pour tous les comptes : rien de plus à charger.
- Archiver = la personne disparaît des listes, des compteurs, de « À traiter », des Nouveautés et de « Nouveaux depuis ta dernière
  visite ». Rien ne change pour elle (compte, connexion, données). Les statistiques d'historique (compteur Inscrits → clients,
  Mesure, Signés / Perdus / Absents des 30 jours, Inscrits par source) la comptent toujours.

## 4. Avant / après : les infos et actions coach (rien de perdu)
**Barre du bas** : avant Tableau de bord · Mes clients · Mes séances · Bibliothèque · Plus → après **Tableau · Clients · Prospects ·
Plus**. Mes séances, Bibliothèque, Catalogue, Entraînement… sont dans « Plus » (et dans les Raccourcis du Tableau de bord).

**Tableau de bord**
- « Bonjour {prénom} » + « N urgences aujourd'hui » → titre « Tableau de bord », « Ce qui demande ton attention aujourd'hui. » et
  le compteur **À traiter** (le nombre d'urgences).
- 2 tuiles Clients / Prospects (avec « N urgences ») → **3 compteurs** Clients · À traiter · Prospects (les badges « N urgences »
  restent dans Clients et Prospects).
- « À traiter maintenant » (5 lignes, bouton Ouvrir) → même liste, même raison ; toute la ligne ouvre la bonne fiche ; la section
  reste quand elle est vide : « Rien à traiter pour l'instant. »
- Nouveaux depuis ta dernière visite (Appeler, WhatsApp), Inscrits par source, Raccourcis → **inchangés**, en dessous.

**Mes clients**
- Nouveau en haut : titre, nombre, recherche par nom, filtres Tous · À traiter · Inactifs · Archivés, « + », « Sélectionner » ;
  chaque ligne : initiales, nom, raison, évolution du poids.
- Le lien « Les prospects sont dans Prospects → (N comptes gratuits) » → retiré (décision 7) : on passe à Prospects par la barre du
  bas ; le nombre de prospects est sur le Tableau de bord et la page Prospects.
- Tableau complet (18 colonnes), alertes, Préparer le call, Ouvrir, Appeler, WhatsApp → **inchangés**, en dessous.
- Comptes : Ouvrir sa fiche, Passer client / Repasser prospect, Donner / Retirer l'accès complet → **inchangés** (et aussi dans
  l'onglet Compte de la fiche). **Supprimer** d'un client ou d'un prospect → onglet **Compte** de sa fiche, zone rouge « Supprimer
  définitivement » (même double confirmation, même effet) ; il reste dans Comptes pour un compte de ton équipe (qui n'a pas de fiche).
- Créer un accès (3e panneau) → **écran à part**, ouvert par « + » (mêmes champs, mêmes rôles, Générer un mot de passe).

**Prospects**
- Nouveau en haut : la même liste (Tous · À traiter · Archivés), avec SIGNÉ / PERDU / ABSENT et « bilan réservé » sur la ligne.
- Tout le reste de la page → **inchangé**, en dessous : nombre de comptes gratuits et à traiter, compteur Inscrits → clients,
  Nouveautés, chiffres des 30 jours, Mesure, filtres détaillés (À traiter / Appel fait / Tous, recherche nom ou email, période,
  bilan, newsletter, tri), cartes avec leurs boutons (J'ai relancé, Signé, Perdu, Absent…), export CSV, liste newsletter.

**Fiche d'un client ou d'un prospect**
- En-tête : croix (retour là d'où tu viens), initiales, nom, pastille Client ou Prospect, pastille du programme ; **Préparer le
  call** (client) ou **WhatsApp** pré-rempli (prospect) ; bouton rond **Appeler**.
- Onglet **Suivi** : (prospect : « Ses réponses », puis le Suivi commercial complet) ; retour de la semaine (Lire), poids et sa
  courbe, régularité sur 30 jours, questionnaire / programme / diète ; puis le **bandeau d'avant** (tous ses outils : Préparer le
  call, Son suivi, Son questionnaire, Son programme, Ses repas, Ses calories, Ses courbes, Ses séances, son journal alimentaire,
  « Revenir … ») ; puis **toute la fiche d'avant** (En bref, Découverte, Réponses, Chronologie, Contacter, notes privées, Profil,
  Objectifs, Programme, Nutrition, Poids, Bilan hebdo, Le reste).
- Onglet **Compte** : email, téléphone (Appeler, WhatsApp), source, rôle (« Changer » = Passer client / Repasser prospect), dernière
  connexion, nombre de connexions ; Donner l'accès complet ; Archiver / Restaurer ce compte ; Supprimer définitivement.

## 5. À tester sur ton téléphone (lien : https://lcsmhx.github.io/mhx-plateforme/)
1. La barre du bas (Tableau · Clients · Prospects · Plus) et le Tableau de bord : les 3 compteurs, « À traiter maintenant ».
2. Clients : cherche un client en tapant son nom sans accent ni majuscule, essaie les filtres, ouvre une fiche puis la croix : tu
   reviens au même endroit, recherche gardée.
3. Sélectionner → coche ton compte de test → Archiver → confirme : il passe dans « Archivés » ; Restaurer le fait revenir.
4. La fiche d'un prospect : « Ses réponses », puis le bouton WhatsApp : le message s'ouvre pré-rempli dans WhatsApp (tu peux le
   modifier, rien ne part tout seul).
5. L'onglet Compte d'une fiche : rôle, dernière connexion, Archiver, et la zone rouge (tu peux l'ouvrir puis Annuler).

## 6. Les choix que j'ai faits seul
- **Archivage dans `suivi_prospect`** plutôt que dans `notes_coach` (voir §3) ; aucune migration, rien écrit dans la vraie base.
- **Rien n'est retiré des pages** : les nouvelles listes de la maquette sont en haut ; le tableau complet de Mes clients, Comptes,
  et toute l'ancienne page Prospects (cartes, filtres détaillés, CSV, newsletter…) restent dessous. Sur la fiche, le bandeau
  d'avant (tous ses outils) est dans l'onglet Suivi, et toute la fiche d'avant suit les cartes de la maquette.
- **« Inactifs »** = 10 jours ou plus sans saisie (la même règle que l'alerte « Inactif depuis N j ») ; « Jamais rien saisi » n'y
  est pas (il reste dans les alertes de Mes clients).
- **Archiver** demande toujours une confirmation (même pour 1 compte) ; **Restaurer** se fait sans fenêtre (rien n'est perdu, on
  peut réarchiver), avec le message « N … restaurés ». Le bouton « Archiver » est rouge comme sur la maquette.
- **Ce qui garde les archivés** : les statistiques (compteur Inscrits → clients, Mesure, Signés / Perdus / Absents des 30 jours,
  Inscrits par source) et la **liste newsletter** (elle suit l'accord de la personne : « rien ne change pour elle »). L'export
  CSV des prospects suit la liste : sans les archivés.
- **Supprimer définitivement** : pour un client ou un prospect, seulement dans l'onglet Compte ; il reste dans « Comptes » pour un
  compte de ton équipe (accès complet), qui n'a pas de fiche — sinon cette action aurait disparu.
- **Rôle « Changer »** = Passer client / Repasser prospect (comme aujourd'hui) ; « Donner l'accès complet » est un bouton à part.
- **WhatsApp en anglais** seulement si le prospect a choisi l'anglais dans l'app (`prefs.langue`) : la langue choisie pendant le
  parcours n'est pas enregistrée en base (le changer toucherait au bloc 2). Le nom de la marque vient de la configuration
  (« MHX Coaching »). Une ancienne réponse libre à « ce qui a coincé » est reprise dans « Tu m'as aussi écrit ».
- **Tableau de bord** : le titre de la maquette remplace « Bonjour {prénom} » ; les petits sous-titres des tuiles (« accompagnements
  en cours », « comptes gratuits ») sont retirés ; la loupe en haut ouvre la recherche de la liste Clients.
- **Message après une action** : le message habituel de l'app, en bas de l'écran (pas en haut comme la maquette).
- **Pendant une sélection**, la barre de sélection remplace la barre du bas (comme la maquette).
- Les listes s'affichent par **50** (« Afficher N de plus ») : une longue liste de prospects n'enterre pas le reste de la page.
- La fiche lit en plus la **dernière connexion** de la personne (1 petite lecture).
- **Créer un accès** garde ses champs et son menu (Client / Équipe), sans les 3 rôles de la maquette (mission : mêmes rôles).
- Tests : **verif86** dans la partie 6 du banc, qui installe aussi WebKit (moteur de Safari) ; 18 suites de l'ancien espace coach
  adaptées sans retirer ni ajouter de vérification ; en local, tout le banc a tourné, deux suites à la fois.
