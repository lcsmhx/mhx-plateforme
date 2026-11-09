/* v52 : le calculateur juste apres Ma progression ; le journal d'entrainement (vitrine du prospect) apres le programme ;
   v84 : apres Prospects, les 4 pages du coach qui ont recu l'ecran d'avant de Clients et de Prospects (menu Plus) */
const OUTILS = [outilAccueil, outilDecouverte, outilProgramme, outilJournal, outilNutrition, outilJournalAlimentaire, outilMensurations, outilCalculateur, outilSuivi, outilBilan, outilFormation, outilComplements, outilProfil, outilTableau, outilClients, outilProspects, outilMesProgrammes, outilSuiviClients, outilComptes, outilSuiviCommercial, outilNewsletter, outilAtelier, outilBibliotheque, outilCatalogue, outilEntrainement];

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

