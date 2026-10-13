# Rapport — mission « blocs 1 et 2 » (13/10/2026)

## 1. Ce qui est en ligne
- **v80 — bloc 1, style commun** : en ligne (`main` e44407c ; banc GitHub 10/10 vert, publication réussie ; site vérifié : « 2026-10-13 · 80 »).
- **v81 — bloc 2, nouveau parcours prospect** : en ligne (`main` 224c85a ; banc GitHub 10/10 vert, dont le parcours rejoué dans WebKit, le moteur de Safari ; publication réussie ; site vérifié : « 2026-10-13 · 81 », et l'accueil du parcours, son compte à rebours et l'écran Objectif ouverts sur le vrai site, sans erreur).
- Lien : https://lcsmhx.github.io/mhx-plateforme/ — le parcours s'ouvre sur un téléphone jamais venu, ou directement par https://lcsmhx.github.io/mhx-plateforme/#/inscription
- Captures : `docs/maj-blocs-1-2/rapport/` (bloc 1 : 9 écrans avant / après à 390 px ; bloc 2 : les 13 écrans du parcours).

## 2. Ce qui n'est pas fait, et pourquoi
- **Polices IBM Plex Sans gras (700) et Instrument Serif** : elles ne sont pas dans le dépôt (seulement Plex Sans 400, 500 et 600) et je n'ai pas le droit de télécharger un fichier sans ton accord. En attendant, le gras s'affiche en Plex Sans 600 et le grand titre de l'accueil dans la police à empattements du téléphone (Georgia sur iPhone). Pour les ajouter, dis « oui pour les polices » : je télécharge 4 fichiers woff2 (environ 20 Ko chacun : Plex Sans 700 et Instrument Serif 400, jeux latin et latin étendu) et la licence OFL d'Instrument Serif, depuis jsDelivr (paquets Fontsource 5), puis je les déclare.
- Les anciennes polices Oswald et IBM Plex Mono ne servent plus nulle part ; leurs fichiers restent dans `polices/` (jamais téléchargés par les téléphones, et un test vérifie la liste exacte). À retirer plus tard si tu veux.
- **Texte de confidentialité** : il parle des « réponses aux 3 questions de départ » ; le parcours demande aussi « Tu es ? » (homme / femme). À aligner avec toi (texte de l'app et PDF du Drive).
- Rien d'autre : les 11 écrans, la carte cadeau, le compte à rebours, le FR + EN et les tests demandés sont faits.

## 3. La migration
- **Aucune migration, rien d'écrit dans la base.** L'étape 0 a montré que tout a déjà sa place : les réponses vont dans `intake` (même format que les 3 questions d'aujourd'hui, plus `sexe` et `parcours_le`), que le coach lit déjà (fiche, carte Prospects, CSV) ; les accords (18 ans + CGU, newsletter et leurs dates) dans les métadonnées du compte, comme avant ; le clic sur le cadeau, avec sa date, dans `challenge`. Pas de comptage à faire.

## 4. Les comptes de test créés
- **Aucun.** Tous les tests tournent sur une base simulée (comptes fictifs @exemple.fr) ; aucun vrai compte, aucune écriture dans Supabase.

## 5. À tester sur ton téléphone (lien : https://lcsmhx.github.io/mhx-plateforme/)
1. En navigation privée sur l'iPhone : l'accueil animé, « La bêta ferme le 15 novembre · plus que … jours », « Créer mon espace gratuit ».
2. Le parcours complet avec ton adresse de test en « +parcours1 » : réactions sous les réponses, chargement, compte, numéro, « Débloquer mon espace ».
3. « Ton espace », puis le cadeau avec ta photo : « Je réserve mon créneau offert » ouvre Calendly avec ton prénom, ton email et ton numéro ; revenu dans l'app, la carte cadeau a disparu (avec « Plus tard », elle reste sur l'accueil).
4. Côté coach : la fiche de ce prospect montre ses réponses (objectif, blocages, texte libre, dans 3 mois, sexe).
5. Ton espace coach et un compte client : tout en sombre, plus de bouton soleil, le logo ramène au Tableau de bord (coach) ou à l'Accueil (client), EN marche.

## 6. Les choix que j'ai faits seul
- **Pas de migration** : réponses dans `intake` au format existant (le coach les voit au même endroit, sans nouvel écran).
- **Flou** seulement sur l'en-tête, la barre du bas et le fond des fenêtres (3 au plus par écran) ; les cartes et les lignes ont le fond en verre sans flou. Les boutons secondaires (contour) restent sans fond.
- Sur téléphone, la carte de connexion est un peu resserrée pour que le bouton tienne sans défiler avec les champs de 60 px.
- Le **mot de passe n'est jamais gardé** dans l'onglet : page rechargée sur l'écran WhatsApp → retour à l'écran Compte (email et cases gardés).
- Le parcours **demande toujours le numéro** (écran WhatsApp) ; le réglage « téléphone obligatoire » ne gouverne plus que l'écran « Ajoute ton numéro » des comptes déjà inscrits sans numéro.
- La **carte cadeau** de l'accueil est pour les prospects arrivés par le nouveau parcours seulement (« rien ne change » pour les anciens) ; elle disparaît aussi si la case « J'ai déjà réservé » est cochée. Les prospects du parcours n'ont plus l'ancienne page « Ton plan d'action » (le cadeau la remplace).
- « Bientôt » sur **Programmes** et **Recettes** (non accessibles à un prospect aujourd'hui) ; la liste est `CONFIG.parcours.disponibles` (passer à `true` quand les blocs 4 et 5 sortent). Date de fin : `CONFIG.parcours.fin_beta`.
- Case des conditions : même texte qu'avant (même version des CGU acceptée). Case newsletter : nouveau texte de TEXTES.md, donc nouvelle version d'accord « 2026-10-13 ».
- Liste des **16 pays** partout (aussi dans le Profil et l'écran « Ajoute ton numéro ») ; « Autre (indicatif à saisir) » dans le parcours.
- Ta **photo** est intégrée dans le code (192 px, comme le logo : le site ne publie pas d'images).
- Bouton **EN** seulement sur l'accueil du parcours.
- Le banc GitHub installe **WebKit** (moteur de Safari) pour la partie qui rejoue le parcours (verif85).
- Le garde-fou des emails du dépôt accepte le texte d'exemple exact « ton@email.com » (TEXTES.md).
- Lancé en local en plus du banc GitHub : les suites touchées, deux à la fois.
