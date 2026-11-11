/* v52 : le calculateur juste apres Ma progression ; le journal d'entrainement (vitrine du prospect) apres le programme ;
   v84 : apres Prospects, les 4 pages du coach qui ont recu l'ecran d'avant de Clients et de Prospects (menu Plus) */
/* v101 : les outils des fichiers de MHX_COACH (index.html) n'existent pas sur l'appareil d'un client : ils sont sautés ;
   CodeCoach.assurer (navigation.js) les ajoute quand le coach se connecte (OUTILS est refait dans le même ordre) ;
   v104 (décision 10) : Clients, Prospects et leurs pages du menu Plus aussi */
function listeOutils(){ return [outilAccueil, outilDecouverte, outilProgramme, outilJournal, outilNutrition, outilJournalAlimentaire, outilMensurations, outilCalculateur, outilSuivi, outilBilan, outilFormation, outilComplements, outilProfil, (typeof outilTableau !== "undefined" ? outilTableau : null), (typeof outilClients !== "undefined" ? outilClients : null), (typeof outilProspects !== "undefined" ? outilProspects : null), (typeof outilMesProgrammes !== "undefined" ? outilMesProgrammes : null), (typeof outilSuiviClients !== "undefined" ? outilSuiviClients : null), (typeof outilComptes !== "undefined" ? outilComptes : null), (typeof outilSuiviCommercial !== "undefined" ? outilSuiviCommercial : null), (typeof outilNewsletter !== "undefined" ? outilNewsletter : null), (typeof outilAtelier !== "undefined" ? outilAtelier : null), (typeof outilBibliotheque !== "undefined" ? outilBibliotheque : null), (typeof outilCatalogue !== "undefined" ? outilCatalogue : null), outilEntrainement].filter(Boolean); }
const OUTILS = listeOutils();

/* Adresses d'hier et de demain : #/progression ouvre « Ma progression »,
   #/suivi ouvre le bilan (puis « Mon suivi » quand il existera). */
const ALIAS_ROUTES = { progression: "mensurations", repas: "nutrition", home: "accueil" };

/* v98 (chantier 3 de la nuit du 10/11, plan-menu-coach) : le menu du coach hors fiche, 7 entrées dans cet ordre, et leur nom
   dans le menu (la page garde son titre). Les autres pages du coach (Suivi détaillé, Comptes, Suivi commercial, Newsletter,
   Mes séances, Bibliothèque) et ses propres onglets « client » quittent le menu, mais chaque adresse #/… ouvre toujours la
   même page qu'avant (outilsVisibles ne change pas) : Clients et Prospects y mènent par leurs boutons, Mes programmes réunit
   l'atelier, Ma base et la bibliothèque. Sur téléphone : Tableau · Clients · Prospects · Programmes · Plus.
   v106 (lot 1) : remplacé par les 4 entrées ci-dessous (les pages sorties du menu s'ouvrent depuis le menu « ⋯ » des listes, les
   onglets de la Bibliothèque et le rond de profil). */
/* v106 (lot 1, refonte de l'ergonomie) : 4 entrées — Aujourd'hui (le tableau de bord), Clients, Prospects, Bibliothèque (Mes
   programmes et le Catalogue, en deux onglets). Réglages, Mon entraînement, la langue, « Partager l'app » et « Se déconnecter »
   passent derrière le rond de profil (MenuProfil, navigation.js). Plus de « Plus » : la barre du bas a 4 cases égales. Les
   adresses ne changent pas (#/catalogue, #/entrainement, #/profil… ouvrent toujours leur page). */
const MENU_COACH = ["tableau", "clients", "prospects", "mes-programmes"];
const NOMS_MENU_COACH = { tableau: "Aujourd'hui", clients: "Clients", prospects: "Prospects", "mes-programmes": "Bibliothèque", entrainement: "Mon entraînement", profil: "Réglages", catalogue: "Catalogue" };
/* v106 (lot 1) : l'atelier (« Mes séances ») et l'ancienne « Ma bibliothèque » (« Mes modèles ») sont des onglets de la
   Bibliothèque : leurs anciennes adresses y mènent (routeDepuisAdresse, connexion.js) */
const REDIRECTIONS_COACH = { atelier: "mes-programmes", bibliotheque: "mes-programmes/bibliotheque" };
/* v106 (lot 1) : les pages derrière le rond de profil (dans cet ordre) */
const MENU_PROFIL_COACH = ["profil", "entrainement"];
/* relecture : la page sortie du menu marque son entrée « parente » (là où l'on trouve son bouton) */
/* v100 (chantier 5 de la nuit du 10/11, audit §8) : le menu d'un CLIENT accompagné (ni prospect, ni coach, ni fiche) : barre du
   bas Accueil · Programme · Nutrition · Progression · Plus ; « Mon journal » vit dans Programme (l'historique des séances), « Mes
   compléments » sous Nutrition, le calculateur est caché quand il a une diète (gardé pour les prospects). Les adresses restent :
   #/journal, #/complements, #/calculateur ouvrent toujours leur page (et marquent leur entrée « parente »). */
const CACHES_CLIENT = ["journal"];
const CACHES_AVEC_DIETE = ["calculateur", "complements"];   // relecture : sans diète, le lien « Mes compléments » de Nutrition n'existe pas
const PARENTS_CLIENT = { journal: "programme", complements: "nutrition", calculateur: "nutrition" };
const PARENTS_MENU_COACH = { "suivi-clients": "clients", comptes: "clients", "suivi-commercial": "prospects", newsletter: "prospects", atelier: "mes-programmes", bibliotheque: "mes-programmes", catalogue: "mes-programmes" };   // v106 : + le Catalogue (onglet de la Bibliothèque)

