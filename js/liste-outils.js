/* v52 : le calculateur juste apres Ma progression ; le journal d'entrainement (vitrine du prospect) apres le programme ;
   v84 : apres Prospects, les 4 pages du coach qui ont recu l'ecran d'avant de Clients et de Prospects (menu Plus) */
const OUTILS = [outilAccueil, outilDecouverte, outilProgramme, outilJournal, outilNutrition, outilJournalAlimentaire, outilMensurations, outilCalculateur, outilSuivi, outilBilan, outilFormation, outilComplements, outilProfil, outilTableau, outilClients, outilProspects, outilSuiviClients, outilComptes, outilSuiviCommercial, outilNewsletter, outilAtelier, outilBibliotheque, outilCatalogue, outilEntrainement];

/* Adresses d'hier et de demain : #/progression ouvre « Ma progression »,
   #/suivi ouvre le bilan (puis « Mon suivi » quand il existera). */
const ALIAS_ROUTES = { progression: "mensurations", repas: "nutrition", home: "accueil" };

