/* v52 : le calculateur juste apres Ma progression ; le journal d'entrainement (vitrine du prospect) apres le programme ;
   v84 : apres Prospects, les 4 pages du coach qui ont recu l'ecran d'avant de Clients et de Prospects (menu Plus) */
/* v101 : les outils des fichiers de MHX_COACH (index.html) n'existent pas sur l'appareil d'un client : ils sont sautés ;
   CodeCoach.assurer (navigation.js) les ajoute quand le coach se connecte (OUTILS est refait dans le même ordre) */
function listeOutils(){ return [outilAccueil, outilDecouverte, outilProgramme, outilJournal, outilNutrition, outilJournalAlimentaire, outilMensurations, outilCalculateur, outilSuivi, outilBilan, outilFormation, outilComplements, outilProfil, (typeof outilTableau !== "undefined" ? outilTableau : null), outilClients, outilProspects, (typeof outilMesProgrammes !== "undefined" ? outilMesProgrammes : null), outilSuiviClients, outilComptes, outilSuiviCommercial, outilNewsletter, (typeof outilAtelier !== "undefined" ? outilAtelier : null), (typeof outilBibliotheque !== "undefined" ? outilBibliotheque : null), (typeof outilCatalogue !== "undefined" ? outilCatalogue : null), outilEntrainement].filter(Boolean); }
const OUTILS = listeOutils();

/* Adresses d'hier et de demain : #/progression ouvre « Ma progression »,
   #/suivi ouvre le bilan (puis « Mon suivi » quand il existera). */
const ALIAS_ROUTES = { progression: "mensurations", repas: "nutrition", home: "accueil" };

/* v98 (chantier 3 de la nuit du 10/11, plan-menu-coach) : le menu du coach hors fiche, 7 entrées dans cet ordre, et leur nom
   dans le menu (la page garde son titre). Les autres pages du coach (Suivi détaillé, Comptes, Suivi commercial, Newsletter,
   Mes séances, Bibliothèque) et ses propres onglets « client » quittent le menu, mais chaque adresse #/… ouvre toujours la
   même page qu'avant (outilsVisibles ne change pas) : Clients et Prospects y mènent par leurs boutons, Mes programmes réunit
   l'atelier, Ma base et la bibliothèque. Sur téléphone : Tableau · Clients · Prospects · Programmes · Plus. */
const MENU_COACH = ["tableau", "clients", "prospects", "mes-programmes", "catalogue", "entrainement", "profil"];
const NOMS_MENU_COACH = { clients: "Clients", entrainement: "Mon entraînement", profil: "Réglages" };
/* relecture : la page sortie du menu marque son entrée « parente » (là où l'on trouve son bouton) */
/* v100 (chantier 5 de la nuit du 10/11, audit §8) : le menu d'un CLIENT accompagné (ni prospect, ni coach, ni fiche) : barre du
   bas Accueil · Programme · Nutrition · Progression · Plus ; « Mon journal » vit dans Programme (l'historique des séances), « Mes
   compléments » sous Nutrition, le calculateur est caché quand il a une diète (gardé pour les prospects). Les adresses restent :
   #/journal, #/complements, #/calculateur ouvrent toujours leur page (et marquent leur entrée « parente »). */
const CACHES_CLIENT = ["journal", "complements"];
const PARENTS_CLIENT = { journal: "programme", complements: "nutrition", calculateur: "nutrition" };
const PARENTS_MENU_COACH = { "suivi-clients": "clients", comptes: "clients", "suivi-commercial": "prospects", newsletter: "prospects", atelier: "mes-programmes", bibliotheque: "mes-programmes" };

