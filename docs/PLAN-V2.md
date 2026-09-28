# PLAN V2 — Plateforme MHX (validé par Lucas le 28/09/2026)

## Reprise après une coupure (à lire en premier)
Une nouvelle conversation reprend en lisant seulement `CLAUDE.md` et ce fichier.
- **Mode de travail** : mission autonome donnée par Lucas le 28/09/2026 (résumée juste en dessous). On enchaîne sans lui présenter de plan ; les questions pour lui vont dans « Questions pour Lucas » en bas de ce fichier, et on continue sur le reste.
- **Où en est le travail** : la dernière case cochée ci-dessous. La ligne « En cours » dit sur quoi on travaillait, sur quelle branche, et ce qu'il restait à vérifier.
- **Branches** : chaque étape se fait sur une branche locale `v2/…`, fusionnée dans `main` (avance rapide) quand tout est vert. `attente/nuit-28-09` = travail de la nuit du 28/09 mis de côté, jamais poussé (on y reprend les corrections utiles, voir Chantier 1).
- **Avant de reprendre** : `git status`, `git log --oneline -10 --all`, relire la ligne « En cours », relancer le banc (`tests-locaux/README.md`) sur la branche en cours.
- **En cours** : Étape 1 en ligne (`9429e43`, GitHub Actions actif). Chantier 1 sur `v2/chantier-1` (lot A fait ; lots B et C en cours, B dans une copie `v2/c1-lotB` ; puis D, E, F, G). Documents du chantier 2 faits (brouillons légaux, marche à suivre). Branche de ligne principale en attente de push : `v2/etape-0-1` (plan + documents).

## Mission autonome (Lucas, 28/09/2026) — règles qui complètent CLAUDE.md
En cas de doute, ces règles passent avant `CLAUDE.md`.

**Ne doit JAMAIS arriver**
- Un client réel perd une donnée ou voit son app cassée.
- Un email part vers un vrai client ou prospect. Aucun envoi réel dans ce projet : la fonction d'emails reste non déployée.
- L'inscription publique s'ouvre (`inscription_libre` reste `false` : Lucas l'ouvrira lui-même).
- Une nouveauté qui remplace une habitude des clients (le bilan) leur apparaît avant que Lucas l'active. Les petits ajouts (un onglet en plus, une correction de bug) peuvent partir directement.
- Un service ou une option payante.

**Ordre** : Étape 0 → Étape 1 → Chantier 1 → Chantier 3 → Chantier 4 → partie code du Chantier 2 (le 3 passe avant le 4 : le tableau de bord coach a besoin des données du feedback).

**Règles de travail**
- Simple avant tout : réutiliser l'existant (Store, UI, Regularite, Journal, Historique, questionnaire, générateur de diète, séance découverte, recettes). Pas de nouvelle bibliothèque, pas de nouveau fichier sans nécessité.
- Données : les nouvelles infos vont si possible dans la TABLE Supabase `donnees` (JSON, sans migration) — à ne pas confondre avec le DOSSIER `donnees/` du dépôt, réservé à Grok Bot, jamais touché. Sinon : migration non destructive, sauvegarde et comptage avant/après. Le compte de test peut être modifié librement ; les données d'un vrai client jamais ; les anciennes données restent lisibles.
- Chaque chantier : banc de tests à jour (nouveaux tests pour ce qui est ajouté), vérification téléphone et ordi, relecture par des vérificateurs indépendants, corrections, puis un commit et un push. Version incrémentée (52, 53…).
- Toute nouvelle phrase côté client a sa traduction dans `I18N.en`. Pas de `alert`, `confirm`, `prompt` natifs.
- Après chaque chantier : note courte dans `NOTESCLAUDE.md` pour Grok Bot avec 5 à 10 tests à faire sur le compte de test ; mise à jour de « État actuel » dans `CLAUDE.md`.
- Ne toucher ni au dossier `donnees/`, ni aux tâches Cowork, ni à Notion.
- Tant que le push n'est pas autorisé : commits locaux, et push dès que possible.

**Organisation du temps (Lucas, 28/09)** : pendant le développement, seulement les suites touchées ; le banc complet une seule fois par chantier, juste avant la fusion dans `main`. GitHub Actions : banc découpé en 4 jobs parallèles (même exigence : la publication attend les 4). Ne pas attendre la fin des tests en ligne pour avancer : pousser, enchaîner, puis vérifier (retour arrière si rouge). Au plus 2 bancs en même temps sur le Mac, isolés (copie du dépôt, ports différents). Vérificateurs indépendants seulement pour ce qui est risqué (données, accès, ce que voient les clients), un seul par sujet, aucun pour les documents. Partie documents du chantier 2 en parallèle du chantier 3.

**Quand s'arrêter** : seulement si une donnée réelle risque d'être perdue, si un comptage ne tombe pas juste, ou si un test reste rouge après correction. Pour tout autre besoin de Lucas (un clic, un identifiant, un choix) : noter la question en bas de ce fichier et continuer.

**Résumé final (un seul, en langage simple)** : ce qui change pour le prospect, le client et le coach ; ce qui est en ligne et ce qui attend derrière l'interrupteur ; ce que Lucas doit faire, dans l'ordre, avec les liens (réglages, test sur son téléphone, activation du feedback pour tous, étapes du chantier 2) ; le message WhatsApp pour ses clients ; les commandes de retour arrière ; les idées non codées.

## Principes
- L'app sert à la fois d'aimant à prospects, de funnel et de suivi client.
- Le gratuit, c'est l'outil. Le payant, c'est le coach.
- Aucun prix dans l'app : on propose seulement un bilan en call (Calendly).
- Aucun piège : pas de fausse urgence, pas de case pré-cochée, le bouton « Pas maintenant » aussi visible que le bouton principal.
- Tableau de bord et écrans : clairs, 2 clics maximum, couleur seulement pour les alertes, pensés téléphone d'abord.

## Étape 0 — Plan à jour (documents uniquement)
- [x] Précisions de Lucas du 28/09 ajoutées, chaque point transformé en case à cocher, section de reprise.

## Étape 1 — Filet de sécurité
- [x] a. *(vérifié le 28/09 : `9429e43`, 4 parties vertes en 9 min, publication en 26 s)* Workflow GitHub Actions (gratuit, dépôt public) : à chaque push sur `main`, le banc `tests-locaux` tourne ; le site n'est publié sur GitHub Pages que si tout est vert. Le site publié contient exactement les mêmes fichiers qu'aujourd'hui. Le banc n'écrit jamais dans la vraie base.
- [x] b. *(Q1 validée et posée ; « Mise en ligne » de `CLAUDE.md` à jour)* Proposer à Lucas une seule modification de `.claude/settings.local.json` qui autorise uniquement « git push origin main » (il la valide). Mettre à jour « Mise en ligne » dans `CLAUDE.md` : push seulement si les tests sont verts, un push par chantier, jamais pour ouvrir l'inscription ni pour passer un interrupteur sur « tous ».
- [x] c. *(source passée sur « GitHub Actions » par Lucas ; première publication `9429e43` : les 106 adresses du site répondent comme avant, chaque fichier servi = celui du commit, mêmes pages .md converties, `.github` non publié ; seul ajout : `tests-locaux/banc.sh`)* Pousser le workflow, puis demander à Lucas de passer la source de GitHub Pages sur « GitHub Actions » (https://github.com/lcsmhx/mhx-plateforme/settings/pages). Vérifier ensuite qu'une publication passe et que le site en ligne est identique.
- [ ] d. *(codé au chantier 1, lot A : `CONFIG.nouveautes` + objet `Interrupteurs` ; en ligne avec la v52)* Interrupteur simple dans `CONFIG` pour les nouveautés qui remplacent une habitude des clients : « off » / « test » / « tous ». En « test », seuls le compte client de test (identifié par son id dans le code, jamais par son email en clair) et le coach les voient ; les autres clients gardent l'ancienne version. Le chantier 3 démarre en « test ».
- [x] e. *(fait pour `9429e43` : écran de connexion en format téléphone, version « 2026-09-27 · 51 », aucune erreur de console, `#/inscription` reste fermé)* Après chaque mise en ligne : ouvrir le site en ligne en format téléphone et vérifier la connexion, le numéro de version et les pages principales. Si quelque chose casse : retour arrière immédiat (`git revert` + push) et note.

## Chantier 1 — Parcours prospect
- [ ] 1. Inscription : prénom, NOM (nouveau champ), email, mot de passe, avec vérification de l'email (garder le code existant).
- [ ] 2. Cases séparées à l'inscription :
   - [ ] CGU + politique de confidentialité (obligatoire).
   - [ ] Données de santé : garder la case séparée existante ; enregistrer la date et la version du texte.
   - [ ] Newsletter (facultative, décochée par défaut), texte : « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email. » Remplace l'actuelle case « rappels liés à ma découverte ». Enregistrer la date et la version du texte.
- [ ] 3. Juste après l'inscription, 3 questions (remplacent les 10 actuelles ; les anciennes réponses déjà enregistrées restent lisibles) :
   - Problème : « Quel est ton objectif principal ? » (perdre du gras / prendre du muscle / me remettre en forme)
   - Obstacle : « Qu'est-ce qui t'a bloqué jusqu'ici ? »
   - Projection : « Dans 3 mois, qu'est-ce qui aurait changé pour toi ? »
   - [ ] Précision : les 3 questions sont posées juste après la vérification d'email. Leurs réponses alimentent la page bilan et la fiche coach du prospect.
- [ ] 4. Page de proposition de bilan : reprend sa réponse « projection ». Texte : « Ton bilan offert de 30 minutes avec un coach MHX. On fait le point sur ton objectif, ce qui te bloque et ce que tu as déjà essayé. Tu repars avec 2 ou 3 actions concrètes. Si l'accompagnement personnalisé te correspond, on te le présente à la fin de l'appel. Tu es libre de dire non. » Boutons : « Réserver mon bilan » (Calendly pré-rempli : prénom, nom, email) et « Pas maintenant, découvrir mon espace ».
   - [ ] Précision : vérifier que le pré-remplissage Calendly est actif (prénom, nom, email).
- [ ] 5. Accueil prospect : une seule action mise en avant au départ, « Calcule tes calories (2 min) », puis « Enregistre ta pesée de départ ».
- [ ] 6. Gratuit pour toujours : calculateur (onglet ouvert au prospect), suivi poids et mensurations, Speed Formation. Supprimer la limite de 7 jours partout, textes compris (« Crée ton accès découverte — 7 jours… »).
   - [ ] Précision : un client voit au moins tout ce que voit un prospect : le calculateur et le journal d'entraînement doivent lui être accessibles. Vérifier d'abord pourquoi ils sont cachés aujourd'hui.
- [ ] 7. Pages verrouillées (programme, nutrition, journal, suivi) : un échantillon générique, puis « Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » Programme : la séance découverte existante. Nutrition : une journée type d'exemple (réutiliser le générateur ou les recettes existantes).
- [ ] 8. Cartes dans l'app (pas d'emails) : poids stable (± 0,3 kg) sur 14 jours → carte « Ton poids stagne… » + bilan ; 3e visite d'une page verrouillée → rappel de sa réponse « problème » + bilan ; Speed Formation terminée → proposition de bilan.
- [ ] 9. Bug : sur téléphone, après connexion, le Profil s'ouvre déjà défilé et l'encadré « Bienvenue ! » est coupé sous l'en-tête.
- [ ] 10. Garder le garde-fou 18 ans et la mention « pas un avis médical » existants. (Q7 : garde-fou au calculateur ; case des conditions « J'ai 18 ans ou plus et j'accepte… »)
- [ ] 11. Bug mineur : un client qui ouvre une page coach (par exemple `#/calculateur`) voit l'Accueil, mais l'adresse ne change pas.
- [ ] 12. Branche `attente/nuit-28-09` : reprendre les corrections utiles (messages d'erreur en français, session après changement d'adresse, erreurs du Profil). Laisser ce qui concerne l'envoi des emails d'inscription par Brevo (on passe par Gmail).
- [ ] 13. GitHub Actions (demande de Lucas du 28/09, à faire à la fin du chantier, sans interrompre les lots) : dans `.github/workflows`, figer le runner sur `ubuntu-24.04` au lieu de `ubuntu-latest` (passage à Ubuntu 26 le 19 octobre) et mettre à jour les actions qui tournent encore sous Node.js 20 ; vérifier que le banc reste vert sur GitHub.
- [ ] Fin du chantier : banc à jour et vert, téléphone + ordi, relecture indépendante, version 52, note Grok (5 à 10 tests), « État actuel », commit, push, vérification en ligne.

## Chantier 3 — Feedback du dimanche (remplace le bilan du vendredi)
Démarre derrière l'interrupteur en « test » (Étape 1 d) : les autres clients gardent le bilan du vendredi tant que Lucas ne passe pas l'interrupteur sur « tous ».
- [ ] Le dimanche : « Selon toi, comment as-tu travaillé cette semaine ? » (note sur 10), puis 3 cases : Training, Alimentation, Autre.
- [ ] Réponse du coach juste en dessous, au même endroit.
- [ ] Smiley 😞 😐 😊 sur la réponse du coach (facultatif, 1 clic). Si 😞 : « Qu'est-ce qui ne t'a pas plu ? » et « Qu'est-ce que je peux améliorer pour toi ? », qui remontent en priorité chez le coach.
- [ ] Historique visible. Rappel le dimanche. Alerte au client quand le coach a répondu.
   - [ ] Précision : rappels et alertes d'abord dans l'app : un bandeau le dimanche, un badge quand le coach a répondu. Les emails viendront au chantier 2.
- [ ] Les anciens bilans restent lisibles, rien n'est supprimé.
- [ ] Bug : le lundi, le bilan porte encore sur la semaine passée et dit « avant dimanche soir ».
- [ ] À vérifier : où les clients notent leurs séances (le journal d'entraînement semble caché aux clients).
- [ ] Précision : note en chute = note de 5 ou moins, ou 2 points de moins que la semaine précédente.
- [ ] Préparer un court message WhatsApp que Lucas enverra à ses clients pour expliquer le nouveau feedback du dimanche. Il annonce aussi le suivi des visites (Q4) et l'écran d'acceptation des conditions (Q6).
- [ ] Fin du chantier : banc à jour et vert, téléphone + ordi, relecture indépendante, version suivante, note Grok (5 à 10 tests), « État actuel », commit, push, vérification en ligne.

## Chantier 4 — Côté coach
- [ ] Tableau de bord : 2 tuiles seulement, Clients et Prospects, avec les urgences en badge.
- [ ] Clients : retour du dimanche (à traiter / fait), note, dernier smiley, dernière visite, jours actifs sur 30 jours. Les 😞 et les notes en chute en haut. Alerte si la note chute.
- [ ] Prospects : date d'inscription, 3 réponses, bilan réservé ou pas, newsletter oui / non, dernière visite, jours actifs. Retirer le score sur 100 et la température CHAUD / TIÈDE / FROID.
- [ ] Bilan réservé : le coach le coche lui-même en un clic dans la fiche du prospect. Pas de liaison automatique avec Calendly (payante).
- [ ] Précision : jour actif = un jour où la personne a ouvert l'app, pas une connexion. Suivi des visites (dernière visite, jours actifs sur 30 jours) aussi pour les clients.
- [ ] Précision : garder le bouton « Passer client » : c'est lui qui donne l'accès complet après la vente.
- [ ] Fin du chantier : banc à jour et vert, téléphone + ordi, relecture indépendante, version suivante, note Grok (5 à 10 tests), « État actuel », commit, push, vérification en ligne.

## Chantier 2 — Ouverture de l'inscription
Partie code seulement dans la mission autonome : rien n'est activé, rien n'est déployé, aucun email ne part.
**Simplifié par Lucas le 28/09** : ni newsletter construite, ni relances par email (J3 et suivantes), ni exemples de newsletter : Lucas gérera l'envoi lui-même plus tard. La fonction `supabase/functions/emails-prospects` (jamais déployée) n'est plus développée.
- [ ] Emails d'inscription (confirmation, mot de passe oublié) : via le SMTP de Gmail depuis mhx.coaching@gmail.com, avec un mot de passe d'application (à vérifier). Pas de nom de domaine pour l'instant. Pas de SMS.
- [ ] Case newsletter à l'inscription (texte validé, facultative, décochée), avec la date et la version du texte enregistrées. *(fait au chantier 1, lot B)*
- [ ] Retrait de cet accord possible dans le Profil (date et version enregistrées). *(chantier 1, lot B)*
- [ ] Espace coach : la liste des personnes qui ont coché la case, exportable en CSV (prénom, nom, email, date de l'accord).
- [ ] Précision : accords — enregistrer la date et la version du texte pour la case santé et pour la case newsletter.
- [ ] Q6 : écran unique d'acceptation (conditions + données de santé) à la prochaine connexion des clients sans accord enregistré, derrière l'interrupteur en « test ».
- [ ] Politique de confidentialité et mentions légales : brouillons avec des champs à compléter par Lucas (suivi d'activité, newsletter — outil d'envoi à préciser —, Supabase, Calendly, Gmail). Droit de suppression : sur simple demande par email.
- [ ] Compteur simple côté coach : inscrits → 3 questions remplies → bilans réservés → clients.
- [ ] Mettre à jour `docs/OUVERTURE-INSCRIPTION.md` : marche à suivre pas à pas pour Lucas (mot de passe d'application Gmail et SMTP dans Supabase, test prospect complet par Grok, puis ouverture), avec les liens à cliquer.
- [ ] Vrai test prospect complet (par Grok, compte jetable) sur la nouvelle version. *(Lucas, après la mission)*
- [ ] Ensuite seulement, Lucas ouvre l'inscription lui-même. *(Lucas)*
- [ ] Fin de la partie code : banc à jour et vert, téléphone + ordi, vérificateur indépendant sur ce qui est risqué, version suivante, note Grok (5 à 10 tests), « État actuel », commit, push, vérification en ligne.

## Fin de mission
- [ ] Résumé final unique pour Lucas (voir « Résumé final » plus haut).

## Décisions encore ouvertes

## Réponses de Lucas (28/09/2026) — décisions à appliquer
- **Q1** push : validé (autorisation « git push origin main » posée dans `.claude/settings.local.json`).
- **Q2** compte de test : `9df6bb84-5a09-4bb0-a77a-b2633d842ed9` confirmé (lucasmahauxpro+test@gmail.com). Ne jamais utiliser `6cbdf770`.
- **Q3** source Pages : oui, Lucas la passe sur GitHub Actions dès qu'on le lui demande. **La publication d'urgence sert uniquement à revenir en arrière, jamais à publier du nouveau code sans tests** (écrit dans `CLAUDE.md`).
- **Q4** suivi des visites des clients : oui, derrière l'interrupteur en « test » ; l'annoncer dans le message WhatsApp.
- **Q5** emails : (a) la relance J3 va dans le flux newsletter ; (b) **les relances de vente (J3 et suivantes) s'arrêtent dès qu'un bilan est coché « réservé »** ; la newsletter hebdomadaire continue pour les prospects qui n'ont pas signé et s'arrête quand la personne devient cliente ; (c) lien de désinscription aussi dans les emails de service ; (d) page de désinscription en anglais aussi ; (e) Brevo ne permet pas de retirer le pixel : dans la marche à suivre, activer le **suivi anonyme** ; nouveau texte de la case newsletter (nouvelle version) : « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum) et j'accepte la mesure de leur ouverture. Désinscription en 1 clic dans chaque email. »
- **Q6** accords des clients existants : **à coder dans cette mission** : un écran unique d'acceptation (conditions + données de santé) à la prochaine connexion des clients qui n'ont aucun accord enregistré, derrière l'interrupteur en « test » (Lucas l'activera quand la politique de confidentialité sera finale et ses clients prévenus) ; l'annoncer dans le message WhatsApp.
- **Q7** âge : garde-fou 18 ans dans le calculateur, et l'âge intégré à la case des conditions, sans case en plus : « J'ai 18 ans ou plus et j'accepte les conditions d'utilisation et la politique de confidentialité. »
- **Chantier 2 simplifié (28/09, plus tard dans la journée)** : ni newsletter, ni relances par email, ni exemples de newsletter (Lucas gérera l'envoi plus tard). On garde la case newsletter (texte validé, date et version), le retrait dans le Profil, et côté coach la liste des personnes qui ont coché la case, exportable en CSV (prénom, nom, email, date de l'accord). Les emails d'inscription restent prévus via le SMTP de Gmail. Les réponses Q5 a, b, c, d ne s'appliquent plus.
- **Brevo et mesure d'ouverture (28/09, précision)** : la fonction d'envoi v51 reste non déployée et rien dans l'app ne l'appelle ; Brevo est retiré des brouillons légaux ; **plus de mesure d'ouverture** : case newsletter « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email. », nouvelle version du texte (`2026-09-28c`) enregistrée avec la date. Les exemples des pages verrouillées du chantier 1 (séance découverte, journée type nutrition…) restent : seuls les exemples de newsletter sont abandonnés.
- **Décisions prises seules par Claude jusqu'au 28/09** (liste donnée à Lucas) : toutes validées. Tableau de bord : liste « À traiter maintenant » sous les 2 tuiles, 5 lignes au plus, affichée seulement quand elle n'est pas vide.

## Questions pour Lucas
*(notées pendant la mission autonome ; on continue sur le reste en attendant)*
- [x] **Q1 — Autoriser le push (Étape 1 b).** Dans `.claude/settings.local.json`, une seule modification : dans `"deny"`, remplacer la ligne `"Bash(git push*)",` par les 8 lignes ci-dessous, et dans `"allow"`, ajouter `"Bash(git push origin main)",`. Les interdictions l'emportent toujours sur les autorisations : ces 8 lignes bloquent toutes les autres formes (forcer, supprimer, pousser une autre branche sur `main`, options, `git -C`), sans bloquer `git push origin main`.
  ```
  "Bash(git push)",
  "Bash(git push -*)",
  "Bash(git push * -*)",
  "Bash(git push *:*)",
  "Bash(git push *+*)",
  "Bash(git push * * *)",
  "Bash(git -C * push*)",
  "Bash(git -c *)",
  ```
  Limite connue : `git push origin <autre-branche>` n'est pas bloqué par ces lignes (il créerait une branche sur GitHub, sans rien publier : seul `main` est publié). La règle de `CLAUDE.md` l'interdit.
- [x] **Q2 — Compte client de test.** L'interrupteur « test » utilise l'identifiant `9df6bb84-5a09-4bb0-a77a-b2633d842ed9` (compte client sans prénom, créé le 25/09 ; c'est celui que les anciennes sessions utilisaient comme « compte test »). À confirmer : Supabase → Authentication → Users → cherche `lucasmahauxpro+test@gmail.com` → « User UID » doit commencer par `9df6bb84`. Sinon, donne-moi le bon (un autre compte « lucas m. », `6cbdf770…`, existe aussi).
- [x] **Q3 — Source de GitHub Pages (Étape 1 c), après le premier push du workflow.** https://github.com/lcsmhx/mhx-plateforme/settings/pages → « Build and deployment » → Source : **GitHub Actions**. Ensuite, chaque push n'est publié que si le banc est vert (environ 40 minutes après le push). Retour arrière en urgence : onglet Actions → « Tests puis publication » → « Run workflow » → cocher « urgence ».
- [x] **Q4 — Suivi des visites des clients (Chantier 4).** Tes 7 clients n'ont accepté aucun texte sur le suivi d'activité (dernière visite, jours actifs). Je le code derrière un interrupteur en « test » (compte de test seulement) : à passer sur « tous » quand tu les auras prévenus (le message WhatsApp du chantier 3 peut le dire) et que la politique de confidentialité le mentionnera (Chantier 2).
- [x] **Q5 — Emails (Chantier 2, pour la suite ; je code l'option la plus prudente en attendant).** (a) La relance « J3 » d'un prospect : email de service, de newsletter, ou supprimée ? (je la passe en newsletter) ; (b) la newsletter s'arrête-t-elle entièrement dès qu'un bilan est coché réservé ou que la personne devient cliente ? (oui, tout s'arrête) ; (c) un lien de désinscription aussi dans les emails de service ? (oui) ; (d) la page de désinscription en anglais aussi ? (oui) ; (e) Brevo gratuit : peux-tu désactiver le suivi des ouvertures (Paramètres → Suivi) ? Sans ça, la promesse « pas de pixel » ne tient pas.
- [x] **Q6 — Tes 7 clients et les accords.** Leurs comptes ont été créés par toi : ils n'ont jamais coché la case santé ni les conditions dans l'app. Veux-tu qu'ils les acceptent à leur prochaine connexion ? (non codé)
- [x] **Q7 — Âge minimum.** Les 3 nouvelles questions ne demandent plus l'âge : le garde-fou 18 ans passe au calculateur (rien n'est enregistré sous 18 ans). Veux-tu en plus une case « J'ai 18 ans ou plus » à l'inscription ? (non codé)
- [ ] **Q8 — Brouillons légaux (non bloquant, à faire par Lucas).** Dans `docs/CONFIDENTIALITE-BROUILLON.md` et `docs/MENTIONS-LEGALES-BROUILLON.md` : compléter les « [À COMPLÉTER] » (identité, statut, adresse, numéro d'entreprise, directeur de la publication) et trancher les points listés en bas de la politique (outil d'envoi de la newsletter, durées de conservation, base légale du suivi d'activité, Gmail personnel sans contrat de sous-traitance, contrats Supabase / Calendly, polices Google chargées depuis Google, CGU complètes ou non). Le test prospect par Grok (marche à suivre, étape 5) demande de choisir entre une copie locale lancée par Claude et une ouverture discrète.
