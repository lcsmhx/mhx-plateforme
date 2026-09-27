# PLAN V2 — Plateforme MHX (validé par Lucas le 28/09/2026)

## Principes
- L'app sert à la fois d'aimant à prospects, de funnel et de suivi client.
- Le gratuit, c'est l'outil. Le payant, c'est le coach.
- Aucun prix dans l'app : on propose seulement un bilan en call (Calendly).
- Aucun piège : pas de fausse urgence, pas de case pré-cochée, le bouton « Pas maintenant » aussi visible que le bouton principal.
- Tableau de bord et écrans : clairs, 2 clics maximum, couleur seulement pour les alertes, pensés téléphone d'abord.

## Chantier 1 — Parcours prospect
1. Inscription : prénom, NOM (nouveau champ), email, mot de passe, avec vérification de l'email (garder le code existant).
2. Cases séparées à l'inscription :
   - CGU + politique de confidentialité (obligatoire).
   - Données de santé : garder la case séparée existante ; enregistrer la date et la version du texte.
   - Newsletter (facultative, décochée par défaut), texte : « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email. » Remplace l'actuelle case « rappels liés à ma découverte ». Enregistrer la date et la version du texte.
3. Juste après l'inscription, 3 questions (remplacent les 10 actuelles ; les anciennes réponses déjà enregistrées restent lisibles) :
   - Problème : « Quel est ton objectif principal ? » (perdre du gras / prendre du muscle / me remettre en forme)
   - Obstacle : « Qu'est-ce qui t'a bloqué jusqu'ici ? »
   - Projection : « Dans 3 mois, qu'est-ce qui aurait changé pour toi ? »
4. Page de proposition de bilan : reprend sa réponse « projection ». Texte : « Ton bilan offert de 30 minutes avec un coach MHX. On fait le point sur ton objectif, ce qui te bloque et ce que tu as déjà essayé. Tu repars avec 2 ou 3 actions concrètes. Si l'accompagnement personnalisé te correspond, on te le présente à la fin de l'appel. Tu es libre de dire non. » Boutons : « Réserver mon bilan » (Calendly pré-rempli : prénom, nom, email) et « Pas maintenant, découvrir mon espace ».
5. Accueil prospect : une seule action mise en avant au départ, « Calcule tes calories (2 min) », puis « Enregistre ta pesée de départ ».
6. Gratuit pour toujours : calculateur (onglet ouvert au prospect), suivi poids et mensurations, Speed Formation. Supprimer la limite de 7 jours partout, textes compris (« Crée ton accès découverte — 7 jours… »).
7. Pages verrouillées (programme, nutrition, journal, suivi) : un échantillon générique, puis « Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » Programme : la séance découverte existante. Nutrition : une journée type d'exemple (réutiliser le générateur ou les recettes existantes).
8. Cartes dans l'app (pas d'emails) : poids stable (± 0,3 kg) sur 14 jours → carte « Ton poids stagne… » + bilan ; 3e visite d'une page verrouillée → rappel de sa réponse « problème » + bilan ; Speed Formation terminée → proposition de bilan.
9. Bug : sur téléphone, après connexion, le Profil s'ouvre déjà défilé et l'encadré « Bienvenue ! » est coupé sous l'en-tête.

## Chantier 2 — Ouverture de l'inscription
- Emails d'inscription (confirmation, mot de passe oublié) : via le SMTP de Gmail depuis mhx.coaching@gmail.com, avec un mot de passe d'application (à vérifier). Newsletter : Brevo en plan gratuit. Pas de nom de domaine pour l'instant. Pas de SMS.
- Deux flux séparés : « service » (tous les inscrits, aucune promotion, aucun lien vers le bilan) et « newsletter » (seulement ceux qui ont coché). Arrêt des emails de vente dès qu'un bilan est réservé. 2 emails par semaine maximum.
- Pas de pixel de suivi d'ouverture sur la newsletter. Lien de désinscription dans chaque email.
- Politique de confidentialité et mentions légales à jour (suivi d'activité, newsletter, Supabase, Brevo, Calendly).
- Compteur simple : inscrits → 3 questions remplies → bilans réservés → clients.
- Vrai test prospect complet (par Grok, compte jetable) sur la nouvelle version.
- Ensuite seulement, Lucas ouvre l'inscription lui-même.

## Chantier 3 — Feedback du dimanche (remplace le bilan du vendredi)
- Le dimanche : « Selon toi, comment as-tu travaillé cette semaine ? » (note sur 10), puis 3 cases : Training, Alimentation, Autre.
- Réponse du coach juste en dessous, au même endroit.
- Smiley 😞 😐 😊 sur la réponse du coach (facultatif, 1 clic). Si 😞 : « Qu'est-ce qui ne t'a pas plu ? » et « Qu'est-ce que je peux améliorer pour toi ? », qui remontent en priorité chez le coach.
- Historique visible. Rappel le dimanche. Alerte au client quand le coach a répondu.
- Les anciens bilans restent lisibles, rien n'est supprimé.
- Bug : le lundi, le bilan porte encore sur la semaine passée et dit « avant dimanche soir ».
- À vérifier : où les clients notent leurs séances (le journal d'entraînement semble caché aux clients).

## Chantier 4 — Côté coach
- Tableau de bord : 2 tuiles seulement, Clients et Prospects, avec les urgences en badge.
- Clients : retour du dimanche (à traiter / fait), note, dernier smiley, dernière visite, jours actifs sur 30 jours. Les 😞 et les notes en chute en haut. Alerte si la note chute.
- Prospects : date d'inscription, 3 réponses, bilan réservé ou pas, newsletter oui / non, dernière visite, jours actifs. Retirer le score sur 100 et la température CHAUD / TIÈDE / FROID.
- Bilan réservé : le coach le coche lui-même en un clic dans la fiche du prospect. Pas de liaison automatique avec Calendly (payante).

## Décisions encore ouvertes
