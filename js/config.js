/* ==================================================================
   [D] CONFIG — tout ce qui se modifie sans toucher au code
   ================================================================== */
const CONFIG = {

  marque: {
    nom: "MHX Coaching",

    /* Logo : colle ici l'image encodee (data:image/png;base64,...) ou une
       adresse https. Laisse vide et seul le nom s'affiche. */
    logo: "data:image/png;base64,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",
    logo_hauteur: 34,     // hauteur du logo en pixels dans la barre du haut

    /* Nom du programme affiche sous la marque. Laisse vide si tu n'en veux pas. */
    programme: "",
    /* Affiche en pied de page. Sert a repondre en trois secondes a la seule
       question qui compte apres une mise en ligne : « est-ce que je regarde
       bien la nouvelle version ? » */
    version: "2026-10-04 · 72",
    instagram: "https://www.instagram.com/lucasmhxcoaching/",
    pseudo: "@lucasmhxcoaching",
    email: "mhx.coaching@gmail.com",

    /* v70 — « Partager l'app » (volet « Plus » et Profil) : le lien envoyé (vide = l'adresse de l'app elle-même)
       et la phrase qui l'accompagne quand le téléphone propose le partage (Messages, WhatsApp…). */
    partage: {
      lien: "",
      texte: "Rejoins-moi sur l'app MHX Coaching : calculateur de calories, suivi du poids et Speed Formation, gratuit."
    },

    /* Lien du formulaire de bilan Notion.
       Laisse vide tant qu'il n'existe pas : le bouton se contente alors
       de copier le récapitulatif dans le presse-papier. */
    formulaire_bilan: "",

    /* v39 — Inscription libre : « Créer mon compte » sur l'écran de connexion.
       Laisse false tant que l'inscription publique est coupée dans Supabase
       (Authentication → Sign In / Providers → Email). Un compte créé ainsi
       naît « prospect » (compte gratuit) : c'est la base qui le décide.
       v54 : ouverte le 28/09/2026 (décision de Lucas, Supabase réglé par lui). Pour refermer : false. */
    inscription_libre: true,

    /* v72 (A) — Téléphone obligatoire. true : le numéro (WhatsApp) est demandé à l'inscription, et un client ou un
       prospect qui n'en a pas encore le donne à sa prochaine ouverture de l'app (écran « Ajoute ton numéro… », avant
       l'accueil ; jamais le coach). false : plus aucune de ces deux demandes ; le numéro reste visible et modifiable
       dans Mon compte, et le coach voit ceux qui sont enregistrés. */
    telephone_obligatoire: true,

    /* v40 — Mode gratuit (prospects). Le lien de l'appel découverte, et les
       SEULS onglets ouverts à un prospect : tous les autres affichent un
       cadenas et « Réserver mon bilan ». Aucun prix dans l'application. */
    /* v61 (brief V2, F) : l'evenement de 15 min « Ton plan d'action offert », regle par Lucas dans Calendly (il remplace
       l'ancien événement du bilan). Chaque bouton ajoute utm_source=app, utm_medium=bouton et son code d'origine en utm_content. */
    calendly: "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas",
    /* v50 — true : le prenom et l'email du prospect connecte sont pre-remplis dans Calendly (parametres
       officiels name et email) : il n'a rien a retaper et sa reservation porte l'email de son compte.
       Allume le 26/09/2026 (decision de Lucas) ; la confidentialite mentionne Calendly et le pre-remplissage. */
    calendly_prerempli: true,
    /* v72 (C) — le paramètre Calendly qui reçoit le numéro du prospect (format international, +33612345678), avec le prénom,
       le nom et l'email : "a1" = la réponse à la 1re question de l'événement (a2 la 2e…) ; "location" = le champ du lieu
       quand l'événement est un appel au numéro du prospect ; "" = jamais de numéro.
       v73 (A) : "location" (décision de Lucas du 04/10/2026) : l'événement est un « appel téléphonique » ; vérifié sur la vraie
       page (lien pré-rempli ouvert sans réserver) : location=%2B33612345678 remplit le champ « Numéro de téléphone »
       (+33 6 12 34 56 78, drapeau du pays) et laisse vide le champ de notes. */
    calendly_tel: "location",
    /* v72 (D) — WhatsApp de Lucas (avec l'indicatif) : bouton « Écrire à ton coach sur WhatsApp » (v73 : « ton coach » au lieu
       de « Lucas ») sur l'accueil du prospect, ses pages verrouillées et (v73) « Ton plan d'action », avec un message déjà
       écrit (DECOUVERTE.whatsapp). Vide : pas de bouton. */
    whatsapp: "+61418876361",
    /* v52 — gratuit pour toujours : le calculateur (sa cle a lui, calc_perso), Ma progression (sans les
       photos) et la Speed Formation sont ouverts au prospect, sans limite de duree */
    gratuit_ouverts: ["accueil", "decouverte", "profil", "calculateur", "mensurations", "formation"],
    /* v50 — onglets verrouilles qu'un prospect voit quand meme (cadenas + ce qu'apporte l'accompagnement) :
       la vitrine de l'offre. Les autres onglets verrouilles sont caches de sa navigation (leur adresse
       montre toujours la page verrouillee). v52 : programme, nutrition, journal d'entrainement et suivi
       (bilan hebdo compris) ; la formation n'est plus verrouillee. Pour tout remontrer : ajouter
       "complements", "bilan". */
    gratuit_vitrine: ["programme", "nutrition", "journal", "suivi"],
    /* v52 — la barre du bas (telephone) du prospect, dans cet ordre ; le reste est derriere « Plus » */
    gratuit_barre: ["accueil", "calculateur", "mensurations", "formation"]
  },

  /* --- v64 (brief V2, A2 et K) — REMPLI PAR LUCAS LE 30/09 ------------------------------------------------------------
     cgu_pdf, confidentialite_pdf : les liens https des 2 PDF sur Google Drive (partage « Tous les utilisateurs qui ont
     le lien », lecture seule), ouverts par « CGU » et « politique de confidentialité » dans la case de l'inscription, et
     par « En savoir plus : politique de confidentialité » dans la carte de l'accord santé. Décision de Lucas du 30/09 :
     en attendant un lien par fichier (petite mise à jour à venir), le MÊME lien pour les deux, celui du dossier Drive
     public « MHX legal » qui contient les 2 PDF (vérifié sans connexion le 30/09).
     cgu_version : la date de mise en ligne, au format AAAA-MM-JJ (« 2026-10-01 » pour « Version du 1er octobre 2026 ») :
     version des CGU enregistrée à chaque nouvelle inscription (métadonnée conditions_version) ET version de la politique
     enregistrée avec l'accord santé (sante_version) — les deux textes portent la même date (brief K).
     Si une valeur vaut « à compléter » (ou n'est pas valide), le banc de main est rouge (verif70, bloc A0) : rien
     n'est publié. Les branches de travail v2/* restent vertes. --------------------------------------------------- */
  textes_legaux: {
    cgu_pdf: "https://drive.google.com/drive/folders/1ncw9lOmVtBijzAVxLL715zxLiyqxNW0m?usp=drive_link",
    confidentialite_pdf: "https://drive.google.com/drive/folders/1ncw9lOmVtBijzAVxLL715zxLiyqxNW0m?usp=drive_link",
    cgu_version: "2026-10-01"
  },

  /* --- Découverte (prospects) : les réglages ; les textes sont dans DECOUVERTE --- */
  decouverte: {
    /* v52 : plus aucune limite de durée pour le prospect (gratuit pour toujours). Ce nombre ne sert plus qu'au suivi
       commercial du coach (actions proposées après une semaine, chantier 4) */
    jours: 7,
    /* le questionnaire court : identifiants de QUESTIONS ou de DECOUVERTE.questions (réponses dans la clé intake).
       v52 : 3 questions (problème, obstacle, projection), posées juste après la vérification d'email. L'âge n'y est
       plus demandé : le garde-fou 18 ans passe au calculateur (Chantier 1, lot D). */
    questions: ["probleme", "obstacle", "projection"],
    requis: ["probleme", "obstacle", "projection"],
    /* v52 : l'ancien questionnaire court (10 questions, jusqu'à la v51), pour l'AFFICHAGE seulement : les réponses déjà
       enregistrées restent lisibles (Profil du prospect, fiche du coach) et comptées sur 10. Jamais reposé. */
    questions_avant: ["sexe", "age", "taille", "poids", "objectif", "seances", "essaye", "obstacle", "pourquoi", "motivation"],
    /* v52 : réponse « problème » → option EXACTE de la question « objectif » du questionnaire complet (QUESTIONS), posée
       quand l'objectif est vide : le calcul des calories et le questionnaire complet (passage client) en profitent.
       Une valeur qui n'est pas une option de QUESTIONS n'est jamais posée. */
    objectif_depuis: { "Perdre du gras": "Perte de poids / sèche", "Prendre du muscle": "Prise de muscle", "Me remettre en forme": "Santé & énergie au quotidien" },
    /* bornes de saisie d'une question du questionnaire court (aucune des 3 questions n'en a) ; l'âge minimum (18) se
       change ici, repris par le calculateur (lot D) */
    bornes: { age: [18, 90], taille: [120, 230], poids: [35, 250] },
    pas_defaut: 6000,              // pas par jour retenus pour la dépense estimée (le questionnaire court ne les demande pas)
    recettes: ["flocons-avoine-banane-miel", "poulet-riz-brocoli", "omelette-epinards"]   // identifiants de donnees/recettes.json
  },

  /* --- v52 : interrupteurs des nouveautés qui REMPLACENT une habitude des clients (ex. le bilan du vendredi).
     "off" : personne ; "test" : le coach et les comptes de test ci-dessous seulement ; "tous" : tout le monde.
     C'est Lucas qui passe un interrupteur sur "tous". Comptes de test : identifiant Supabase, jamais l'email (dépôt public). --- */
  nouveautes: {
    feedback_dimanche: "test",
    suivi_visites_clients: "test",   // v53 (chantier 4) : suivi des visites des CLIENTS (dernière visite, jours actifs) ; « tous » quand Lucas les aura prévenus
    comptes_test: ["9df6bb84-5a09-4bb0-a77a-b2633d842ed9"]   // compte client de test de Lucas
  },

  /* --- v49 : suivi commercial des prospects (page « Prospects » du coach). Les seuils en jours
     qui decident de la prochaine action et de ce qui est « à traiter » ; tout se change ici.
     v53 (chantier 4) : plus de temperature ni de score (seuils nouveau_heures, inactif_jours, motivation_forte retires). --- */
  suivi: {
    urgence_heures: 48,              // v53 : inscrit depuis moins de 48 h, sans bilan coché ni relance : à traiter (DM de bienvenue)
    clic_recent_jours: 3,            // après un « Perdu » / « Absent », un clic « Réserver » de moins de 3 jours le fait revenir
    relance_attente_jours: 3,        // après une relance, on attend 3 jours avant d'en proposer une autre
    perdu_relance_jours: 30,         // « Perdu » : relance proposée 30 jours après l'appel
    relances_max: 3,                 // 3 relances sans réponse : on arrête de proposer de relancer (« classe-le Perdu ? »)
    retour_jours: 14,                // « J'ai réservé » coché après un « Perdu » / « Absent » : il revient dans la course pendant 14 jours (v59 : première coche seulement, la case ne se coche qu'une fois)
    appel_jours: 7                   // bilan réservé il y a plus de 7 jours sans issue indiquée : « L'appel a-t-il eu lieu ? »
  },

  /* --- Connexion a la base Supabase (comptes + donnees) --- */
  supabase: {
    url: "https://nzynbuczmogifuidcjed.supabase.co",
    cle: "sb_publishable_bxhCWuzxgVyrmzIKlfOXhg_wGpNq-8n"
  },

  /* --- Calculateur métabolique : toutes les constantes du calcul --- */
  calcul: {
    proteines_g_par_kg: 2.2,   // grammes de protéines par kg de poids de corps
    lipides_g_par_kg:   1.0,   // grammes de lipides par kg de poids de corps
    deficit_perte:      0.10,  // -10 % des calories de maintenance
    surplus_prise:      0.10,  // +10 % des calories de maintenance
    facteur_base:       1.20,  // point de départ : sédentaire
    bonus_10000_pas:    0.15,  // ce qu'ajoutent 10 000 pas par jour
    plafond_pas:        16670, // au-delà, le bonus de pas ne monte plus
    bonus_par_heure:    0.03,  // ce qu'ajoute 1 h d'entraînement par semaine
    plafond_heures:     15,    // au-delà, le bonus d'entraînement ne monte plus
    seuil_alerte_glucides: 50, // en dessous de X g, on affiche l'avertissement
    valeurs_depart: { sexe:"H", age:25, taille:178, poids:80, pas:10000, heures:10 }
  },

  /* --- Suivi des mensurations --- */
  mensurations: {
    zones: ["Poitrine","Épaules","Bras gauche","Bras droit","Taille",
            "Ventre","Hanches","Cuisse gauche","Cuisse droite","Mollet"],
    zones_affichees_au_depart: [4, 5],  // index des zones tracées par défaut
    max_courbes: 4,                      // nombre max de courbes simultanées

    /* Balance a impedancemetre : champs FACULTATIFS, tout le monde n'en a pas.
       bas / haut = bornes de saisie (une faute de frappe ne doit pas casser
       la courbe). sens = ce qui est une bonne nouvelle : -1 si baisser est
       bien, +1 si monter est bien, 0 si c'est neutre. */
    composition: [
      { id:"mg",   nom:"Masse grasse",        unite:"%",      pas:0.1, bas:3,   haut:70,   sens:-1 },
      { id:"mm",   nom:"Masse musculaire",    unite:"kg",     pas:0.1, bas:10,  haut:150,  sens:1 },
      { id:"eau",  nom:"Eau corporelle",      unite:"%",      pas:0.1, bas:30,  haut:80,   sens:0 },
      { id:"visc", nom:"Graisse viscérale",   unite:"indice", pas:1,   bas:1,   haut:60,   sens:-1 },
      { id:"os",   nom:"Masse osseuse",       unite:"kg",     pas:0.1, bas:0.5, haut:10,   sens:0 },
      { id:"mb",   nom:"Métabolisme de base", unite:"kcal",   pas:1,   bas:800, haut:5000, sens:0 },
      { id:"age",  nom:"Âge métabolique",     unite:"ans",    pas:1,   bas:10,  haut:100,  sens:-1 }
    ]
  },

  /* --- Nutrition : generateur de journee type ---
     Change les parts ci-dessous pour repartir les calories autrement
     entre les repas. Le total doit faire 1. --- */
  nutrition: {
    repas: [
      { id:"petit_dejeuner", nom:"Petit-déjeuner", part:0.25 },
      { id:"dejeuner",       nom:"Déjeuner",       part:0.35 },
      { id:"diner",          nom:"Dîner",          part:0.30 },
      { id:"collation",      nom:"Collation",      part:0.10 }
    ],

    /* Tout le monde ne mange pas quatre fois par jour. Le client le declare
       dans son questionnaire, et la journee est batie sur SA structure : un
       plan a quatre repas donne a quelqu'un qui en fait deux, c'est un plan
       qu'il ne suivra pas. Les parts de chaque structure font toujours 1. */
    structures: {
      2: [ { id:"dejeuner", nom:"Déjeuner", part:0.50 },
           { id:"diner",    nom:"Dîner",    part:0.50 } ],
      3: [ { id:"petit_dejeuner", nom:"Petit-déjeuner", part:0.30 },
           { id:"dejeuner",       nom:"Déjeuner",       part:0.40 },
           { id:"diner",          nom:"Dîner",          part:0.30 } ],
      4: [ { id:"petit_dejeuner", nom:"Petit-déjeuner", part:0.25 },
           { id:"dejeuner",       nom:"Déjeuner",       part:0.35 },
           { id:"collation",      nom:"Collation",      part:0.10 },
           { id:"diner",          nom:"Dîner",          part:0.30 } ],
      5: [ { id:"petit_dejeuner", nom:"Petit-déjeuner", part:0.22 },
           { id:"dejeuner",       nom:"Déjeuner",       part:0.32 },
           { id:"collation",      nom:"Collation de l'après-midi", part:0.12 },
           { id:"diner",          nom:"Dîner",          part:0.26 },
           { id:"collation",      nom:"Collation du soir", part:0.08 } ],
      6: [ { id:"petit_dejeuner", nom:"Petit-déjeuner", part:0.20 },
           { id:"collation",      nom:"Collation du matin", part:0.08 },
           { id:"dejeuner",       nom:"Déjeuner",       part:0.30 },
           { id:"collation",      nom:"Collation de l'après-midi", part:0.10 },
           { id:"diner",          nom:"Dîner",          part:0.24 },
           { id:"collation",      nom:"Collation du soir", part:0.08 } ]
    },
    repas_defaut: 4,

    /* Les compléments les plus courants, avec des doses usuelles. Ce ne sont
       que des points de départ : le coach ajuste, et rien ici ne remplace
       l'avis d'un médecin — c'est ecrit sur la page. Les poudres proteinees
       portent leurs macros pour 100 g, parce qu'elles COMPTENT dans la
       journee : un shaker de 30 g, c'est 24 g de proteines qu'il serait
       absurde de faire manger deux fois. */
    complements: [
      { id:"whey",       nom:"Protéine whey",            dose:30, unite:"g", moment:"Collation ou après la séance",
        proteine:true,  par100:{ kcal:390, prot:80, gluc:6,  lip:6 } },
      { id:"vegetale",   nom:"Protéine végétale (pois, riz)", dose:30, unite:"g", moment:"Collation ou après la séance",
        proteine:true,  par100:{ kcal:380, prot:75, gluc:8,  lip:5 } },
      { id:"caseine",    nom:"Caséine",                  dose:30, unite:"g", moment:"Le soir",
        proteine:true,  par100:{ kcal:370, prot:78, gluc:5,  lip:3 } },
      { id:"creatine",   nom:"Créatine monohydrate",     dose:3,  unite:"g", moment:"Chaque jour, à n'importe quelle heure" },
      { id:"omega3",     nom:"Oméga 3",                  dose:2,  unite:"g", moment:"Pendant un repas" },
      { id:"vitamine_d", nom:"Vitamine D",               dose:1,  unite:"dose", moment:"Le matin, pendant un repas gras" },
      { id:"magnesium",  nom:"Magnésium",                dose:300,unite:"mg", moment:"Le soir" },
      { id:"multi",      nom:"Multivitamines",           dose:1,  unite:"dose", moment:"Le matin" },
      { id:"zinc",       nom:"Zinc",                     dose:15, unite:"mg", moment:"Le soir, à distance du calcium" },
      { id:"electrolytes", nom:"Électrolytes",           dose:1,  unite:"dose", moment:"Pendant l'effort" }
    ],
    facteur_min: 0.6,   // on ne descend pas une recette en dessous de 60 % de sa portion
    facteur_max: 2.0,   // ni au dessus du double

    /* Ajustement fin aux macros : on retouche les portions ingredient par
       ingredient. Ces bornes evitent les assiettes absurdes (400 g d'huile
       ou 15 g de riz) meme quand la cible est difficile a atteindre. */
    ajustement: {
      tours: 60,             // iterations de l'ajustement
      mult_min: 0.45,        // une portion ne descend pas sous 45 % de la recette
      mult_max: 2.60,        // ni au dessus de 260 %
      plafond_gras: 40,      // g maximum pour une matiere grasse pure (huile, beurre)
      plafond_solide: 450,   // g maximum pour tout le reste
      plancher: 5,           // g minimum : en dessous, l'ingredient n'a plus de sens
      pas_arrondi: 5,        // les grammages affiches sont arrondis a 5 g
      priorite: { proteines: 3, lipides: 1.5, glucides: 1 },  // ce qu'on refuse le plus de rater

      /* Quand une journee tombe sous la cible, on la complete avec un de ces
         aliments — dans cet ordre, le premier compatible gagne. C'est une
         liste ecrite a la main plutot qu'un choix automatique : un tri par
         "meilleur ratio proteines/calories" finit toujours par proposer du
         blanc d'oeuf en poudre ou de la gelatine. Ajoute ou retire ce que
         tu veux ici, en gardant des aliments du quotidien. */
      complements_proteines: ["fromage blanc", "skyr", "yaourt nature", "blanc de poulet",
        "thon", "oeuf", "tofu", "lentille", "proteine", "whey", "jambon", "sardine", "amande"],
      complements_glucides: ["riz", "patate douce", "pomme de terre", "flocons d'avoine",
        "banane", "pain complet", "quinoa", "semoule", "pates", "pois chiche"]
    },
    /* Les régimes que le filtre sait appliquer sur les ingrédients.
       Halal et casher ne figurent pas ici : ils dépendent du mode
       d'abattage et de la certification, pas de la composition — le
       filtre "sans porc ni alcool" en couvre la partie vérifiable,
       le reste relève de ta vérification. */
    regimes: ["Omnivore","Végétarien","Végétalien (vegan)","Pescétarien","Paléo","Sans gluten","Sans lactose","Sans porc ni alcool"],
    /* D'ou viennent les donnees importables (depot public GitHub).
       Change l'adresse ici si le depot change de nom. */
    source_donnees: "https://raw.githubusercontent.com/lcsmhx/mhx-plateforme/main/donnees/",

    /* Rayons du magasin, pour la liste de courses */
    rayons: [
      { id:"fruits-legumes",   nom:"Fruits et légumes",       categories:["Fruits","Légumes"] },
      { id:"viandes",          nom:"Viandes",                 categories:["Viandes"] },
      { id:"poissons",         nom:"Poissons et fruits de mer", categories:["Poissons"] },
      { id:"frais",            nom:"Frais / crèmerie",        categories:["Laitages","Oeufs"] },
      { id:"feculents",        nom:"Féculents et pain",       categories:["Féculents"] },
      { id:"legumineuses",     nom:"Légumineuses",            categories:["Légumineuses"] },
      { id:"epicerie",         nom:"Épicerie",                categories:["Produits de base","Oléagineux"] },
      { id:"matieres-grasses", nom:"Matières grasses",        categories:["Matières grasses"] }
    ],

    /* Les 14 allergenes a declaration obligatoire (reglement UE 1169/2011) */
    allergenes: [
      { id:"gluten",         nom:"Gluten" },
      { id:"crustaces",      nom:"Crustacés" },
      { id:"oeufs",          nom:"Œufs" },
      { id:"poissons",       nom:"Poissons" },
      { id:"arachides",      nom:"Arachides" },
      { id:"soja",           nom:"Soja" },
      { id:"lait",           nom:"Lait" },
      { id:"fruits_a_coque", nom:"Fruits à coque" },
      { id:"celeri",         nom:"Céleri" },
      { id:"moutarde",       nom:"Moutarde" },
      { id:"sesame",         nom:"Sésame" },
      { id:"sulfites",       nom:"Sulfites" },
      { id:"lupin",          nom:"Lupin" },
      { id:"mollusques",     nom:"Mollusques" }
    ]
  },

  /* --- Score de régularité (v36) --- un indicateur de motivation, pas une
     mesure médicale. Les parts se donnent en points : une partie sans objet
     (pas de programme, pas de diète) sort du calcul au lieu de faire baisser
     la note. Change les chiffres ici, rien d'autre. */
  regularite: {
    poids: { seances: 50, repas: 30, mesure: 20 },   // points par partie
    seuils: { bon: 70, moyen: 40 }                    // vert à partir de 70, orange à partir de 40, rouge en dessous
  },

  /* --- Bilan hebdomadaire (v36) --- le questionnaire que le client remplit
     chaque semaine. Ajoute, retire ou reformule une question ici : l'écran
     suit. Types : echelle5 (1 → 5), nombre, long (texte libre), select.
     v53 : ne retire aucune de ces 11 questions : elles servent aussi à relire les anciens bilans.
     Le bilan de la semaine s'ouvre le jour indiqué (1 = lundi … 7 = dimanche ; 0 ou 1 : toujours la semaine en cours)
     et reste ouvert jusqu'à la veille de ce jour la semaine suivante (vendredi : jusqu'au jeudi soir, sur la
     semaine passée : Checkin.semaineVisee). Il n'est jamais bloquant : seulement fortement recommandé.
     v53 (chantier 3) : les comptes du feedback du dimanche (CONFIG.nouveautes.feedback_dimanche) suivent la règle
     du dimanche (voir « dimanche » ci-dessous) ; tous les autres gardent ce bilan du vendredi. */
  bilan: {
    jour_ouverture: 5,
    /* v53 — feedback du dimanche : une note de 1 à 10 (obligatoire) et trois cases facultatives. Ouvert le dimanche
       sur la semaine en cours ; le lundi, encore possible s'il n'a pas été fait ; fermé du mardi au samedi. */
    dimanche: {
      note: { min: 1, max: 10 },
      questions: [
        { id: "training",     label: "Training",     aide: "Tes séances, ta forme, tes charges…" },
        { id: "alimentation", label: "Alimentation", aide: "Tes repas, tes écarts, ta faim…" },
        { id: "autre",        label: "Autre",        aide: "Sommeil, stress, moral, une question…" }
      ]
    },
    questions: [
      { id:"semaine",      label:"Comment s'est passée ta semaine ?", type:"long" },
      { id:"energie",      label:"Énergie",    type:"echelle5" },
      { id:"motivation",   label:"Motivation", type:"echelle5" },
      { id:"sommeil",      label:"Sommeil",    type:"echelle5" },
      { id:"stress",       label:"Stress",     type:"echelle5", aide:"1 = très calme · 5 = très stressé" },
      { id:"seances",      label:"Combien de séances as-tu réalisées ?", type:"nombre" },
      { id:"alimentation", label:"Comment s'est passée ton alimentation ?", type:"long" },
      { id:"reussite",     label:"Quelle a été ta principale réussite ?", type:"long" },
      { id:"difficulte",   label:"Quelle a été ta principale difficulté ?", type:"long" },
      { id:"ajustement",   label:"As-tu besoin d'un ajustement ?", type:"select", options:["Non", "Oui — mon programme", "Oui — mon alimentation", "Oui — les deux"] },
      { id:"ajustement_detail", label:"Si oui, précise", type:"long" }
    ]
  },

  /* --- Journal d'entraînement --- */
  entrainement: {
    nb_seances: 5,
    plages: { "6-8":[6,7,8], "8-10":[8,9,10], "10-12":[10,11,12], "12-15":[12,13,14,15] },
    modele_seance: ["6-8","8-10","10-12","8-10","10-12","10-12","10-12"], // 7 exercices
    nb_series: 4
  }
};

/* ------------------------------------------------------------------
   DÉCOUVERTE — les textes du parcours gratuit des prospects (remplace le
   Challenge 7 jours). Modifiables sans toucher au code. La version anglaise
   vit dans DECOUVERTE.en, avec la même forme. Aucun prix, nulle part.
   ------------------------------------------------------------------ */
const DECOUVERTE = {
  nom: "Découverte",
  /* v52 : gratuit pour toujours — plus de « Jour n/7 » ni de fin de découverte côté prospect */
  /* v60 (brief V2, C) : 30 secondes, des réponses à toucher */
  lede_questionnaire: "3 questions, 30 secondes : dis-nous où tu en es.",
  lede_accueil: "Ton espace gratuit, sans limite de temps : calculateur de calories, suivi de ton poids et Speed Formation.",
  charge_rate: "Tes réponses n'ont pas pu être chargées. Recharge la page.",
  /* v52 : l'action mise en avant sur l'accueil du prospect, une à la fois (d'abord le calcul, puis la pesée) */
  etapes: {
    calories: { titre: "Ta première étape", texte: "Ta maintenance et tes macros, calculées sur ta morphologie et ton activité réelle.", bouton: "Calcule tes calories (2 min)" },
    pesee: { titre: "Ta prochaine étape", texte: "Note ton poids d'aujourd'hui : c'est ton point de départ, et la base de ta courbe.", bouton: "Enregistre ta pesée de départ" },
    /* v71 (H) : calcul et pesée faits, aucun créneau coché : l'action dorée = le plan d'action (bouton et sous-ligne : cta) */
    plan: { titre: "Ta prochaine étape", texte: "Ton calcul et ta pesée de départ sont faits. Il reste à en faire un plan qui tient : 15 min avec Lucas, offert." }
  },
  /* questions du questionnaire court qui ne sont pas dans le questionnaire complet (celui des clients ne change pas).
     v52 : les 3 questions (même ordre en anglais). « probleme » a son propre identifiant (pas « objectif », dont les
     options sont celles du questionnaire complet) ; « obstacle » garde le sien : les anciennes réponses restent lues.
     v60 (brief V2, C) : des réponses à toucher. « cartes » : un seul choix, la valeur enregistrée est l'option française
     EXACTE (inchangée : « Perdre du gras »…), sous = petit texte de chaque carte. « choix » : des clés stables
     ([clé, libellé], même clé en anglais), max = nombre de choix, precision = la précision libre facultative ; dans
     intake : <id>_choix (les clés), <id>_precision (le texte) et <id> = le texte français lisible (libellés puis
     précision) que lisent le coach, le CSV et les anciens écrans. Une ancienne réponse en texte libre reste lue telle quelle. */
  questions: [
    { id: "probleme", label: "Ton objectif numéro 1 ?", type: "cartes", options: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme"],
      sous: ["Affiner ma silhouette", "Me dessiner et gagner en force", "Retrouver de l'énergie et une routine"] },
    { id: "obstacle", label: "Jusqu'ici, qu'est-ce qui a coincé ?", type: "choix", max: 2, aide: "Jusqu'à 2 réponses.",
      choix: [["temps", "Le manque de temps"], ["craquages", "Je craque sur la nourriture"], ["quoi_faire", "Je ne sais pas quoi faire exactement"],
              ["motivation", "La motivation retombe vite"], ["tout_essaye", "J'ai déjà tout essayé, rien ne dure"], ["suivi", "Personne pour me suivre et me recadrer"]],
      precision: "Autre chose ? Avec tes mots (facultatif, sans détail de santé)" },
    { id: "projection", label: "Dans 3 mois, qu'est-ce qui changerait tout pour toi ?", type: "choix", max: 1,
      choix: [["vetements", "Rentrer à nouveau dans mes vêtements préférés"], ["photos", "M'aimer sur les photos"], ["energie", "Avoir de l'énergie toute la journée"],
              ["routine", "Tenir une routine sans me forcer"], ["confiance", "Retrouver confiance en moi"]],
      precision: "Ou dis-le avec tes mots (facultatif)" }
  ],
  /* v52 : les définitions de l'ancien questionnaire court (CONFIG.decouverte.questions_avant) absentes de QUESTIONS, pour
     l'affichage seulement (anciennes réponses : Profil du prospect, fiche du coach) */
  questions_avant: [
    { id: "essaye", label: "Qu'as-tu déjà essayé pour atteindre cet objectif ?", type: "long" },
    { id: "obstacle", label: "Quel est ton principal obstacle aujourd'hui ?", type: "long" },
    { id: "motivation", label: "Ta motivation pour t'y mettre maintenant", type: "echelle", aide: "1 = très faible · 10 = à fond" }
  ],
  questionnaire: {
    titre: "Ton questionnaire",
    age_aide: "À partir de {n} ans.",
    bouton: "Voir ma prochaine étape",   // v60 (brief V2, C)
    annuler: "Annuler les modifications",
    manque_une: "Il manque une réponse",  // v60 : le bouton touché avant que les 3 questions aient leur réponse
    max: "{n} réponses max",              // v60 : un choix de trop (question à plusieurs choix)
    manque: "Il manque : {l}",
    verifie: "Vérifie : {l}",
    note: "Ce questionnaire ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel."
  },
  /* v52 : la page de proposition de bilan, juste après les 3 questions (tant que le prospect n'a pas choisi).
     v61 (brief V2, D) : le plan d'action offert — une seule action dorée, « Plus tard » en lien discret */
  bilan: {
    offert: "Offert",
    titre: "Ton plan d'action personnalisé",
    projection: "Ton objectif dans 3 mois : « {p} »",
    sans_projection: "Faisons le point ensemble sur ton objectif.",
    texte: "En 15 minutes au téléphone avec Lucas, on transforme cet objectif en plan concret : ce qui te freine vraiment, par quoi commencer, et les 3 actions à mettre en place en priorité.",
    garde: "Ton plan est à toi, quelle que soit la suite.",
    /* v70 : la phrase « Si l'accompagnement te correspond… Tu es libre de dire non. » est retirée (décision de Lucas, 03/10/2026) */
    reserver: "Récupérer mon plan d'action",
    sous: "15 min · par téléphone · offert",
    plus_tard: "Plus tard, je découvre mon espace"
  },
  /* v61 (brief V2, vocabulaire) : le bouton unique partout où le bilan est proposé au prospect, et sa petite ligne */
  cta: { bouton: "Récupérer mon plan d'action", sous: "15 min avec Lucas · offert" },
  /* v72 (D) : le bouton WhatsApp du prospect et son message ({p} : son prénom ; sans prénom, la seconde phrase)
     v73 (D) : « ton coach » au lieu de « Lucas » (décision de Lucas du 04/10/2026) */
  whatsapp: { bouton: "Écrire à ton coach sur WhatsApp", message: "Salut, c'est {p}, je viens de m'inscrire sur l'app MHX.",
    message_sans_prenom: "Salut, je viens de m'inscrire sur l'app MHX." },
  /* v62 (brief V2, H) : les invitations au bon moment (prospect seulement), une par déclencheur ; l'objet porte le code
     d'origine du bouton (Decouverte.ORIGINES). Aucune valeur saisie (poids, mesures, calories) dans ces textes. */
  invitations: {
    objectif: "Ton objectif : « {p} »",
    plus_tard: "Plus tard",
    declic_calculateur: { titre: "Tu as ton chiffre. Maintenant, le plan.", texte: "Savoir combien manger, c'est la base. Le tenir avec ton rythme, tes envies et tes semaines chargées, c'est là que tout se joue. En 15 min, Lucas t'aide à en faire un plan qui tient." },
    declic_premiere_pesee: { titre: "Ton point de départ est posé.", texte: "C'est à partir d'aujourd'hui qu'on mesure tes progrès. Pour que ta courbe aille dans le bon sens, il te faut un plan qui colle à ta vie : c'est ce que Lucas te prépare en 15 min." },
    declic_mindset: { titre: "Ton pourquoi est clair.", texte: "Reste le comment. En 15 min, Lucas t'aide à transformer ta motivation en plan concret pour tes prochaines semaines." },
    formation_commence_ici: { titre: "Bien joué, ton départ est lancé.", texte: "Prochaine étape : ton plan d'action personnalisé, offert, en 15 min avec Lucas." }
  },
  /* v64 (brief V2, B) : l'accord santé demandé au premier usage (calculateur, Ma progression, « Organise ta diète »),
     prospect sans accord enregistré seulement (Sante, auth-store.js). Textes du brief, mot pour mot, plus (décision de
     Lucas du 30/09) les repas prévus dans « Organise ta diète » dans le texte, la phrase d'accord et le message de refus. */
  sante: {
    titre: "Ton accord, une seule fois",
    texte: "Pour calculer tes calories et suivre ta progression, l'app enregistre ton poids, ta taille, tes mensurations, tes calculs et les repas prévus dans « Organise ta diète ». Ce sont des données de santé : elles restent privées, visibles seulement par toi et ton coach, et tu peux les supprimer à tout moment.",
    phrase: "J'accepte que mes données de santé (poids, taille, mensurations, calculs, repas prévus dans « Organise ta diète ») servent à mes calculs et à mon suivi.",
    oui: "J'accepte",
    non: "Pas maintenant",
    lien: "En savoir plus : politique de confidentialité",
    refus: "Pas de souci. Sans ton accord, le calculateur, le suivi et l'organisation de la diète restent en pause. Le reste de ton espace reste ouvert, et tu peux changer d'avis quand tu veux."
  },
  resultat: {
    titre: "Ton résultat",
    priorites_titre: "Tes 3 priorités",
    modifier: "Modifier mes réponses",
    tuiles: {
      ecart: "Ton écart", ecart_perdre: "à perdre, à ton rythme", ecart_prendre: "à prendre, en muscle",
      depense: "Dépense estimée", depense_sous: "kcal par jour, estimation",
      seances: "Tes séances", seances_sous: "par semaine, ton vrai rythme",
      motivation: "Motivation", motivation_sous: "ton point de départ"
    },
    imc_bas: "Ton poids est en dessous d'un poids de forme habituel pour ta taille. Viser une perte n'est pas l'objectif ici : parles-en d'abord à un professionnel de santé.",
    motivation_haute: "Motivation {x}/10 : c'est le bon moment. Ce qui fera la différence maintenant, c'est un plan que tu peux tenir.",
    motivation_moyenne: "Motivation {x}/10 : c'est normal. On ne compte pas sur la motivation : on pose des habitudes qui tiennent sans elle.",
    motivation_basse: "Motivation {x}/10 : commence petit. Une séance et des repas repères cette semaine valent mieux qu'un plan parfait abandonné.",
    obstacle: "Ton obstacle principal : « {o} ». C'est le premier point à régler dans ton plan, pas un détail.",
    essaye: "Tu as déjà essayé : « {e} ». On garde ce qui a marché, on corrige ce qui t'a fait lâcher.",
    pourquoi: "Ton déclic : « {p} ». Garde-le en tête les jours où c'est dur.",
    p_perte: "Viser environ {c} kcal par jour, avec {p} g de protéines : un déficit léger que tu peux tenir.",
    p_prise: "Viser environ {c} kcal par jour, avec {p} g de protéines : un surplus léger, pour du muscle et pas du gras.",
    p_maintien: "Rester autour de {c} kcal par jour, avec {p} g de protéines : la base de ta recomposition.",
    p_sante: "Manger à ta faim, à heures régulières, sans chercher de déficit : parles-en d'abord à un professionnel de santé.",
    p_seances_2: "2 séances corps entier par semaine, tenues chaque semaine : c'est la régularité qui compte.",
    p_seances_3: "3 séances corps entier par semaine, avec des charges qui progressent petit à petit.",
    p_seances_4: "{n} séances par semaine en alternant haut et bas du corps, pour récupérer entre deux.",
    p_temps: "Des séances de 30 à 45 minutes, calées dans ton agenda comme un rendez-vous.",
    p_faim: "Des repas repères riches en protéines, pour ne plus subir les fringales.",
    p_regularite: "Un point chaque semaine : c'est la régularité, pas la perfection, qui donne le résultat.",
    p_defaut: "Un plan simple, que tu peux tenir 12 semaines sans tout changer d'un coup."
  },
  calcul: {
    titre: "Tes calories et tes macros",
    intro: "Calculées à partir de tes réponses, avec les mêmes formules que ton coach.",
    maintien: "Maintien", cible: "Ton objectif", kcal_sous: "kcal par jour",
    prot: "Protéines", gluc: "Glucides", lip: "Lipides", g_sous: "g par jour",
    note: "Une estimation, pas une vérité : la vraie mesure, c'est la balance sur deux semaines.",
    incomplet: "Indique ton âge, ta taille et ton poids pour voir tes chiffres."
  },
  seance: {
    titre: "Ta séance découverte",
    intro: "15 à 20 minutes, chez toi, aucun matériel. Le but : faire, proprement.",
    echauffement_titre: "Échauffement · 5 minutes", echauffement: "cardio",
    circuit_titre: "Le circuit",
    circuit_note: "{n} tours (ton niveau : {niv}), 45 à 60 secondes de repos entre les tours.",
    tours: { debutant: 2, intermediaire: 3, avance: 4 },
    exercices: [
      { nom: "Squats", reps: "12 répétitions", video: "G9nGRJjQFXw" },
      { nom: "Pompes", reps: "8 à 12 (contre un mur ou sur les genoux si besoin)", video: "jdM0CTRKTKU" },
      { nom: "Fentes arrière", reps: "8 par jambe", video: "hYbhf31d49w" },
      { nom: "Pont fessier", reps: "15 répétitions", video: "bnKpYIMmvtw" },
      { nom: "Gainage", reps: "30 secondes", video: "R4FB7v-v6x0" }
    ],
    demo: "Démonstration",
    securite: "Une gêne musculaire, c'est normal. Une douleur vive, non : arrête l'exercice."
  },
  /* v52 (Chantier 1, lot E) : les exemples des pages verrouillées du prospect (objet Echantillons). Génériques, en
     lecture seule, marqués « Exemple » : jamais ses données. Même forme et même ordre dans DECOUVERTE.en.echantillons. */
  echantillons: {
    marque: "Exemple",
    note: "Un aperçu de cette page avec l'accompagnement : ce ne sont pas tes données.",
    /* v61 (brief V2, G) : un texte par page verrouillée, qui prolonge l'exemple affiché juste au-dessus */
    appels: {
      programme: "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.",
      journal: "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser.",
      nutrition: "Avec l'accompagnement, tes repas sont calculés sur tes calories et tes macros, en tenant compte de ton régime et de tes allergies, avec ta liste de courses.",
      suivi: "Avec l'accompagnement, ton coach lit ton bilan chaque semaine et te répond avec la suite du plan : tu sais toujours où tu en es et quoi faire ensuite."
    },
    nutrition: {
      titre: "Une journée type",
      intro: "Trois repas simples et riches en protéines, tirés du catalogue de recettes. Avec l'accompagnement, tes repas et leurs quantités sont calculés pour ton objectif.",
      moments: { petit_dejeuner: "Petit-déjeuner", dejeuner: "Déjeuner", collation: "Collation", diner: "Dîner" },
      macros: "{k} kcal · {p} g de protéines"
    },
    journal: {
      titre: "Séance A — Corps entier",
      notee: "Séance notée",
      intro: "Chaque série notée : répétitions et charge. À la séance suivante, l'app te propose la charge à viser.",
      resume: "{e} exercices · {s} séries",
      serie: "Série {n}", reps: "{r} reps", kg: "{c} kg", pdc: "poids du corps",
      /* séries : [répétitions, charge en kg] (0 = poids du corps) ; cible = répétitions visées (conseil de Journal.conseil) */
      exercices: [
        { nom: "Squat goblet", series: [[12, 16], [12, 16], [10, 16]] },
        { nom: "Pompes", series: [[10, 0], [9, 0], [8, 0]] },
        { nom: "Rowing haltère", series: [[12, 14], [11, 14], [10, 14]] },
        { nom: "Hip thrust", series: [[12, 40], [12, 40], [12, 40]], cible: "10-12" }
      ]
    },
    suivi: {
      titre: "Ton suivi de la semaine",
      semaine: "Semaine {n}",
      intro: "Chaque semaine : ta régularité, ta courbe de poids et un message de ton coach.",
      regularite: "Régularité", seances: "Séances notées", poids: "Poids",
      cette_semaine: "cette semaine", depuis: "depuis la semaine dernière",
      courbe: "Ta courbe de poids",
      courbe_alt: "Poids sur {n} semaines : de {a} kg à {b} kg.",
      court: "S{n}",
      /* le poids de chaque semaine (kg), la régularité sur 100, les séances notées et prévues de la dernière semaine */
      pesees: [82.0, 81.6, 81.5, 80.8, 80.4], score: 86, faites: 3, prevues: 3,
      message_titre: "Feedback de ton coach",
      message: "Belle semaine : 3 séances sur 3 et 400 g de moins sur la balance. On garde le même plan. Cette semaine, ajoute 10 minutes de marche après le dîner."
    }
  },
  recettes: {
    titre: "3 recettes pour commencer",
    intro: "Simples, rapides, riches en protéines.",
    minutes: "{n} min",
    ingredients: "Ingrédients", preparation: "Préparation",
    indispo: "Les recettes n'ont pas pu être chargées. Recharge la page."
  },
  formation: {
    titre: "Speed Formation",
    ouverte: "Les bases de la nutrition et de l'entraînement, à ton rythme.",   // v52 : ouverte pour toujours
    ouvrir: "Ouvrir la Speed Formation"
  },
  accomp: {
    titre: "Ce que l'accompagnement ajoute",   // v61 (brief V2, E2)
    note: "15 min avec Lucas pour faire le point sur ton objectif. Offert.",
    reserve_case: "J'ai déjà choisi mon créneau",
    reserve_ok: "Bilan réservé le {d}. Ton coach te retrouve à l'heure prévue.",
    /* v71 (H) : l'en-tête de l'accueil une fois le créneau coché (plus aucun « Récupérer mon plan d'action ») */
    reserve_haut: "Créneau choisi le {d} — Lucas t'appelle à l'heure réservée"
  },
  profil: {
    texte: "Tes réponses au questionnaire sont enregistrées : ton coach les verra. Le questionnaire complet s'ouvrira au démarrage de ton accompagnement.",
    lien: "Répondre aux 3 questions"
  },
  /* v51 : choix des emails, dans le Profil du prospect. v52 : c'est l'interrupteur de la NEWSLETTER (clé « emails » :
     newsletter, maj, version, source) ; l'ancien accord « emails de suivi » ne vaut pas accord newsletter */
  emails: {
    titre: "Newsletter",
    libelle: "Recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum)",
    note: "Tu peux changer d'avis à tout moment ; chaque email a aussi son lien de désinscription en 1 clic. Si tu t'es désabonné depuis ta messagerie, demande aussi à ton coach de te réinscrire.",
    oui: "C'est noté : tu recevras la newsletter.",
    non: "C'est noté : plus aucune newsletter.",
    refuse: "Non enregistré : réessaie dans un instant."
  },

  /* --- écran d'inscription (portail) et retour du lien de confirmation --- */
  inscription: {
    titre: "Crée ton espace gratuit",
    sous: "Gratuit, pour toujours : calculateur de calories, suivi de ton poids et de tes mensurations, et la Speed Formation avec ses vidéos, programmes et plans alimentaires.",
    bouton: "Créer mon espace gratuit",
    mdp: "Mot de passe (8 caractères minimum)",
    /* v52 (décision de Lucas) : l'âge est dans la case des conditions. v64 (brief V2, A2) : la SEULE case obligatoire,
       « J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité. », avec deux liens distincts vers les
       PDF de CONFIG.textes_legaux ; A3 : plus de case « données de santé » (accord demandé au premier usage, DECOUVERTE.sante) */
    cgu_avant: "J'ai 18 ans ou plus et j'accepte les",
    cgu_lien: "CGU",
    cgu_entre: "et la",
    politique_lien: "politique de confidentialité",
    cgu_apres: ".",
    cgu_manque: "Coche la case des conditions pour continuer.",
    /* v52 : case facultative, décochée, qui remplace les « emails de suivi ». v64 (A4) : texte court (version accords.newsletter changée) */
    newsletter: "Oui, je veux les conseils et les offres de Lucas par email (2 max par semaine, désinscription en 1 clic).",
    note: "L'app ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel avant de commencer.",
    verif_titre: "Vérifie ta boîte mail",
    verif_texte: "On vient d'envoyer un lien à {e}. Ouvre-le pour confirmer ton compte, puis connecte-toi ici avec ton email et ton mot de passe.",
    verif_note: "Rien reçu après quelques minutes ? Regarde dans les indésirables. Le lien ne sert qu'une fois. Déjà un compte avec cet email ? Connecte-toi directement.",
    verif_retour: "Retour à la connexion",
    lien_rate: "Ce lien n'est plus valable : connecte-toi avec ton email et ton mot de passe (si tu viens de confirmer ton email, c'est fait).",
    lien_rate_connecte: "Ce lien n'est plus valable ou n'a pas pu être vérifié, mais tu es déjà dans ton espace : rien à faire.",
    non_confirme: "Ton email n'est pas encore confirmé : ouvre le lien reçu (regarde dans les indésirables).",
    trop_demandes: "Trop de demandes d'un coup : réessaie dans une minute.",
    /* v52 : envoi d'email refusé par le serveur d'emails (SMTP), limite horaire du projet, changement d'adresse en deux liens */
    envoi_rate: "L'email n'a pas pu partir (souci de notre côté). Réessaie dans un moment ; si ça continue, écris-moi sur Instagram ({p}).",
    trop_emails: "Beaucoup d'inscriptions en ce moment : réessaie dans une heure.",
    premier_lien: "Premier lien accepté : clique maintenant celui reçu sur ton autre adresse. Le changement d'email est fait au deuxième clic.",
    email_change: "Ton adresse email est changée : utilise la nouvelle pour te connecter.",
    trop_emails_compte: "Trop d'emails envoyés en peu de temps : réessaie dans une heure.",
    /* v52 (décision de Lucas) : l'app n'envoie aucun email pour l'instant : « Mot de passe oublié ? » donne l'adresse du coach */
    oubli: "Écris-nous à {e}, on te débloque rapidement."
  },

  /* --- v52 : versions des textes acceptés à l'inscription, envoyées avec chaque accord (métadonnées du compte :
     conditions_version, sante_version, newsletter_version ; copie « version » de la clé emails). Un texte change
     (même une virgule) = sa version change ici. v64 (brief V2, A et K) : « conditions » = la version des CGU en PDF
     (CONFIG.textes_legaux.cgu_version, 2026-10-01) ; avant : confidentialite.version (le texte court). --- */
  accords: {
    get conditions(){ return CONFIG.textes_legaux.cgu_version; },
    /* sante : « 2026-09-28 » = texte coupé « …conformément à la politique » (v52-v53, inscription fermée : comptes de test
       seulement), puis complété « …de confidentialité. » (v54 ; anglais sans point final) ; « 2026-09-28b » (v55) : même
       texte français, anglais avec son point final. */
    sante: "2026-09-28b",       // ancienne case « données de santé » de l'inscription (v55 à v63) ; v64 : plus envoyée à l'inscription, l'accord au premier usage enregistre la version de la politique (Sante.version)
    newsletter: "2026-09-30",   // v64 (A4) : case newsletter de l'inscription, texte court (inscription.newsletter)
    newsletter_profil: "2026-09-28c"   // interrupteur du Profil (emails.libelle, texte inchangé) ; « c » : texte final de Lucas du 28/09 (distinct des brouillons « 2026-09-28 » et « 2026-09-28b », jamais publiés) ; c'était aussi la case de l'inscription jusqu'à la v63
  },

  /* --- conditions et confidentialité (volet ouvert depuis le Profil du prospect ; v64 : plus depuis l'inscription, dont la case ouvre les PDF).
     v52 : version 2026-09-28b (plus de limite de 7 jours, nom, 3 questions, newsletter ; aucun email du compte envoyé par
     l'app pour l'instant, décision de Lucas). v59 : version 2026-09-29, paragraphe « Contenus chargés depuis Google »
     (polices, images d'aperçu des vidéos ; vidéo au clic seulement) juste après « Hébergement ». Les comptes déjà
     inscrits gardent la version acceptée dans leurs métadonnées : rien ne la compare, personne n'est redemandé.
     v61 : version 2026-09-30 (décision de Lucas du 30/09) : « Réserver mon bilan » devient « Récupérer mon plan d'action » ;
     aucune durée de bilan dans ce texte ; rien d'autre ne change.
     v64 : version 2026-10-01 (celle des PDF, décision de Lucas du 30/09) : deux faits seulement — l'accord santé n'est plus
     une « case dédiée » mais demandé au premier usage d'un outil qui traite ces données (calculateur, suivi du poids et des
     mensurations, « Organise ta diète ») ; newsletter : « 2 emails par semaine au plus » (et plus « 1 à 2 »).
     Le texte change = la version change ; FR et EN gardent le même nombre de paragraphes, dans le même ordre
     (traduction par position) --- */
  confidentialite: {
    version: "2026-10-01",
    titre: "Conditions d'utilisation et confidentialité",
    paragraphes: [
      "L'espace gratuit de MHX Coaching donne des informations et un entraînement généraux, réservés aux adultes. Il ne remplace pas un avis médical : en cas de doute sur ta santé, parles-en à un professionnel avant de commencer.",
      "Données collectées : ton prénom, ton nom, ton email, tes réponses aux 3 questions de départ et ton activité dans l'app, dont tes clics sur « Récupérer mon plan d'action ». Données de santé : celles que tu saisis (poids, mensurations, âge, taille et activité dans le calculateur de calories), avec ton accord, demandé la première fois que tu utilises un outil qui les traite (calculateur, suivi du poids et des mensurations, outil « Organise ta diète »).",
      "Usage : adapter ce qui s'affiche à tes réponses, calculer tes calories, suivre ta progression et te proposer un bilan avec le coach. Aucune revente, aucune publicité.",
      "Suivi par le coach : il voit tes réponses et ton activité, et note, pour son suivi, l'issue de ton bilan et ses relances. Ces notes n'apparaissent pas dans l'app : tu peux en demander une copie ou la suppression en lui écrivant.",
      "Données de santé (RGPD article 9) : tu dois accepter explicitement le traitement de tes données concernant ta santé (poids, mensurations, données du calculateur de calories). Tu peux les consulter ou les supprimer à tout moment. Ces données sont conservées tant que ton compte existe.",
      "Hébergement : Supabase, serveurs en Europe (Irlande).",
      "Contenus chargés depuis Google : les polices de caractères de l'app (Google Fonts) et les images d'aperçu des vidéos (YouTube) sont chargées depuis les serveurs de Google, qui reçoivent alors ton adresse IP. Une vidéo intégrée à l'app ne démarre que si tu cliques dessus ; elle est alors lue depuis YouTube, en mode de confidentialité renforcée.",
      "Prise de rendez-vous : ton bilan se réserve sur Calendly (société américaine), qui enregistre ta réservation pour le compte du coach ; ces données peuvent être traitées aux États-Unis (cadre de protection des données UE–États-Unis). Ton prénom, ton nom et ton email y sont pré-remplis dès que tu ouvres la page de réservation, avec l'écran de l'app d'où tu viens.",
      "Newsletter (facultative) : si tu coches la case, tu reçois par email les conseils, témoignages et offres de coaching de MHX Coaching, 2 emails par semaine au plus. Désinscription en 1 clic dans chaque email, et retrait de ton accord possible à tout moment dans ton Profil.",
      "Tes droits : tu peux exporter ou supprimer ton compte et toutes tes données à tout moment depuis Profil, section « Mes données », ou en écrivant au coach.",
      "Conservation : tant que ton compte existe.",
      "En cochant la case, tu acceptes ces conditions."
    ]
  },

  en: {
    nom: "Discovery",
    lede_questionnaire: "3 questions, 30 seconds: tell us where you're at.",
    lede_accueil: "Your free space, with no time limit: calorie calculator, weight tracking and Speed Formation.",
    charge_rate: "Your answers could not be loaded. Reload the page.",
    etapes: {
      calories: { titre: "Your first step", texte: "Your maintenance calories and macros, calculated from your body and your real activity.", bouton: "Calculate your calories (2 min)" },
      pesee: { titre: "Your next step", texte: "Log today's weight: it's your starting point, and the base of your curve.", bouton: "Log your starting weight" },
      plan: { titre: "Your next step", texte: "Your calories and your starting weight are in. Now let's turn them into a plan that sticks: 15 min with Lucas, free." }
    },
    questions: [
      { id: "probleme", label: "Your #1 goal?", type: "cartes", options: ["Lose fat", "Build muscle", "Get back in shape"],
        sous: ["Get leaner", "Get toned and stronger", "Get my energy and routine back"] },
      { id: "obstacle", label: "What's held you back so far?", type: "choix", max: 2, aide: "Pick up to 2.",
        choix: [["temps", "Not enough time"], ["craquages", "I give in to cravings"], ["quoi_faire", "I don't know exactly what to do"],
                ["motivation", "My motivation fades fast"], ["tout_essaye", "I've tried everything, nothing lasts"], ["suivi", "No one to keep me on track"]],
        precision: "Anything else? In your own words (optional, no health details)" },
      { id: "projection", label: "In 3 months, what would change everything for you?", type: "choix", max: 1,
        choix: [["vetements", "Fitting into my favorite clothes again"], ["photos", "Loving how I look in photos"], ["energie", "Having energy all day long"],
                ["routine", "Sticking to a routine without forcing it"], ["confiance", "Feeling confident again"]],
        precision: "Or say it in your own words (optional)" }
    ],
    questions_avant: [
      { id: "essaye", label: "What have you already tried to reach this goal?", type: "long" },
      { id: "obstacle", label: "What is your main obstacle today?", type: "long" },
      { id: "motivation", label: "Your motivation to start now", type: "echelle", aide: "1 = very low · 10 = all in" }
    ],
    questionnaire: {
      titre: "Your questionnaire",
      age_aide: "From {n} years old.",
      bouton: "See my next step",
      annuler: "Discard changes",
      manque_une: "One answer is missing",
      max: "{n} answers max",
      manque: "Missing: {l}",
      verifie: "Check: {l}",
      note: "This questionnaire is not medical advice. If you have any doubt about your health, talk to a professional."
    },
    bilan: {
      offert: "Free",
      titre: "Your personalized action plan",
      projection: "Your goal in 3 months: “{p}”",
      sans_projection: "Let's review your goal together.",
      texte: "In a 15-minute call with Lucas, we turn this goal into a concrete plan: what's really holding you back, where to start, and the 3 actions to put in place first.",
      garde: "The plan is yours to keep, whatever you decide next.",
      reserver: "Get my action plan",
      sous: "15 min · phone call · free",
      plus_tard: "Later, let me explore my space"
    },
    cta: { bouton: "Get my action plan", sous: "15 min with Lucas · free" },
    whatsapp: { bouton: "Message your coach on WhatsApp", message: "Hi, it's {p}, I just signed up on the MHX app.",
      message_sans_prenom: "Hi, I just signed up on the MHX app." },
    invitations: {
      objectif: "Your goal: “{p}”",
      plus_tard: "Later",
      declic_calculateur: { titre: "You've got your number. Now, the plan.", texte: "Knowing how much to eat is the foundation. Sticking to it with your schedule, your cravings and your busy weeks is where it all happens. In 15 min, Lucas helps you turn it into a plan that sticks." },
      declic_premiere_pesee: { titre: "Your starting point is set.", texte: "From today, we measure your progress. To move your curve in the right direction, you need a plan that fits your life: that's what Lucas builds with you in 15 min." },
      declic_mindset: { titre: "Your why is clear.", texte: "Now for the how. In 15 min, Lucas helps you turn your motivation into a concrete plan for the weeks ahead." },
      formation_commence_ici: { titre: "Nice work, you're off to a start.", texte: "Next step: your personalized action plan, free, in 15 min with Lucas." }
    },
    sante: {
      titre: "Your consent, just once",
      texte: "To calculate your calories and track your progress, the app saves your weight, height, measurements, results and the meals you plan in “Organise ta diète”. This is health data: it stays private, visible only to you and your coach, and you can delete it at any time.",
      phrase: "I agree that my health data (weight, height, measurements, results, meals planned in “Organise ta diète”) is used for my calculations and tracking.",
      oui: "I agree",
      non: "Not now",
      lien: "Learn more: Privacy Policy",
      refus: "No problem. Without your consent, the calculator, tracking and diet planning stay paused. The rest of your space stays open, and you can change your mind anytime."
    },
    resultat: {
      titre: "Your result",
      priorites_titre: "Your 3 priorities",
      modifier: "Edit my answers",
      tuiles: {
        ecart: "Your gap", ecart_perdre: "to lose, at your pace", ecart_prendre: "to gain, as muscle",
        depense: "Estimated expenditure", depense_sous: "kcal per day, estimate",
        seances: "Your workouts", seances_sous: "per week, your real pace",
        motivation: "Motivation", motivation_sous: "your starting point"
      },
      imc_bas: "Your weight is below a usual healthy weight for your height. Losing weight is not the goal here: talk to a health professional first.",
      motivation_haute: "Motivation {x}/10: this is the right time. What makes the difference now is a plan you can stick to.",
      motivation_moyenne: "Motivation {x}/10: that's normal. We don't rely on motivation: we build habits that hold without it.",
      motivation_basse: "Motivation {x}/10: start small. One workout and a few anchor meals this week beat a perfect plan you drop.",
      obstacle: "Your main obstacle: “{o}”. It's the first thing your plan must solve, not a detail.",
      essaye: "You already tried: “{e}”. We keep what worked and fix what made you quit.",
      pourquoi: "Your trigger: “{p}”. Keep it in mind on the hard days.",
      p_perte: "Aim for about {c} kcal per day, with {p} g of protein: a small deficit you can keep.",
      p_prise: "Aim for about {c} kcal per day, with {p} g of protein: a small surplus, for muscle rather than fat.",
      p_maintien: "Stay around {c} kcal per day, with {p} g of protein: the base of your recomposition.",
      p_sante: "Eat to your hunger, at regular times, without chasing a deficit: talk to a health professional first.",
      p_seances_2: "2 full-body workouts per week, every week: consistency is what counts.",
      p_seances_3: "3 full-body workouts per week, with loads that go up little by little.",
      p_seances_4: "{n} workouts per week alternating upper and lower body, to recover in between.",
      p_temps: "30 to 45-minute workouts, booked in your calendar like an appointment.",
      p_faim: "Protein-rich anchor meals, so cravings stop running the show.",
      p_regularite: "A check-in every week: consistency, not perfection, brings the result.",
      p_defaut: "A simple plan you can keep for 12 weeks without changing everything at once."
    },
    calcul: {
      titre: "Your calories and macros",
      intro: "Calculated from your answers, with the same formulas as your coach.",
      maintien: "Maintenance", cible: "Your target", kcal_sous: "kcal per day",
      prot: "Protein", gluc: "Carbs", lip: "Fat", g_sous: "g per day",
      note: "An estimate, not the truth: the real measure is the scale over two weeks.",
      incomplet: "Enter your age, height and weight to see your numbers."
    },
    seance: {
      titre: "Your discovery workout",
      intro: "15 to 20 minutes, at home, no equipment. The goal: do it, and do it right.",
      echauffement_titre: "Warm-up · 5 minutes", echauffement: "cardio",
      circuit_titre: "The circuit",
      circuit_note: "{n} rounds (your level: {niv}), 45 to 60 seconds of rest between rounds.",
      tours: { debutant: 2, intermediaire: 3, avance: 4 },
      exercices: [
        { nom: "Squats", reps: "12 reps", video: "G9nGRJjQFXw" },
        { nom: "Push-ups", reps: "8 to 12 (against a wall or on your knees if needed)", video: "jdM0CTRKTKU" },
        { nom: "Reverse lunges", reps: "8 per leg", video: "hYbhf31d49w" },
        { nom: "Glute bridge", reps: "15 reps", video: "bnKpYIMmvtw" },
        { nom: "Plank", reps: "30 seconds", video: "R4FB7v-v6x0" }
      ],
      demo: "Demo",
      securite: "Muscle discomfort is normal. Sharp pain is not: stop the exercise."
    },
    echantillons: {
      marque: "Example",
      note: "A preview of this page with coaching: this isn't your data.",
      appels: {
        programme: "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress.",
        journal: "With coaching, every workout is logged and the app suggests the weight to aim for next time: you always know what to do to progress.",
        nutrition: "With coaching, your meals are calculated from your calories and macros, taking your diet and allergies into account, with your shopping list.",
        suivi: "With coaching, your coach reads your weekly check-in and replies with the next step: you always know where you stand and what to do next."
      },
      nutrition: {
        titre: "A sample day of eating",
        intro: "Three simple, high-protein meals from the recipe catalog. With coaching, your meals and portions are calculated for your goal.",
        moments: { petit_dejeuner: "Breakfast", dejeuner: "Lunch", collation: "Snack", diner: "Dinner" },
        macros: "{k} Cal · {p} g protein"
      },
      journal: {
        titre: "Workout A — Full body",
        notee: "Workout logged",
        intro: "Every set logged: reps and weight. At the next workout, the app suggests the weight to aim for.",
        resume: "{e} exercises · {s} sets",
        serie: "Set {n}", reps: "{r} reps", kg: "{c} kg", pdc: "bodyweight",
        exercices: [
          { nom: "Goblet squat", series: [[12, 16], [12, 16], [10, 16]] },
          { nom: "Push-ups", series: [[10, 0], [9, 0], [8, 0]] },
          { nom: "Dumbbell row", series: [[12, 14], [11, 14], [10, 14]] },
          { nom: "Hip thrust", series: [[12, 40], [12, 40], [12, 40]], cible: "10-12" }
        ]
      },
      suivi: {
        titre: "Your weekly follow-up",
        semaine: "Week {n}",
        intro: "Every week: your consistency, your weight curve and a message from your coach.",
        regularite: "Consistency", seances: "Workouts logged", poids: "Weight",
        cette_semaine: "this week", depuis: "since last week",
        courbe: "Your weight curve",
        courbe_alt: "Weight over {n} weeks: from {a} kg to {b} kg.",
        court: "W{n}",
        pesees: [82.0, 81.6, 81.5, 80.8, 80.4], score: 86, faites: 3, prevues: 3,
        message_titre: "Your coach's feedback",
        message: "Great week: 3 workouts out of 3 and 400 g down on the scale. We keep the same plan. This week, add a 10-minute walk after dinner."
      }
    },
    recettes: {
      titre: "3 recipes to get started",
      intro: "Simple, quick, high in protein.",
      minutes: "{n} min",
      ingredients: "Ingredients", preparation: "Method",
      indispo: "The recipes could not be loaded. Reload the page."
    },
    formation: {
      titre: "Speed Formation",
      ouverte: "The basics of nutrition and training, at your pace.",
      ouvrir: "Open the Speed Formation"
    },
    accomp: {
      titre: "What coaching adds",
      note: "15 min with Lucas to go over your goal. Free.",
      reserve_case: "I've already booked my slot",
      reserve_ok: "Assessment booked on {d}. Your coach will meet you at the scheduled time.",
      reserve_haut: "Slot booked on {d} — Lucas will call you at the reserved time"
    },
    profil: {
      texte: "Your questionnaire answers are saved: your coach will see them. The full questionnaire opens when your coaching starts.",
      lien: "Answer the 3 questions"
    },
    emails: {
      titre: "Newsletter",
      libelle: "Receive MHX Coaching's tips, testimonials and coaching offers by email (1 to 2 emails per week maximum)",
      note: "You can change your mind at any time; every email also has its one-click unsubscribe link. If you unsubscribed from your mailbox, also ask your coach to re-subscribe you.",
      oui: "Noted: you will receive the newsletter.",
      non: "Noted: no more newsletters.",
      refuse: "Not saved: try again in a moment."
    },
    inscription: {
      titre: "Create your free space",
      sous: "Free, forever: calorie calculator, weight and measurement tracking, and the Speed Formation course with its videos, workout programs and meal plans.",
      bouton: "Create my free account",
      mdp: "Password (8 characters minimum)",
      cgu_avant: "I'm 18 or older and I accept the",
      cgu_lien: "Terms of Use",
      cgu_entre: "and the",
      politique_lien: "Privacy Policy",
      cgu_apres: ".",
      cgu_manque: "Tick the terms box to continue.",
      newsletter: "Yes, send me Lucas's tips and offers by email (2 per week max, unsubscribe in 1 click).",
      note: "The app is not medical advice. If you have any doubt about your health, talk to a professional before starting.",
      verif_titre: "Check your inbox",
      verif_texte: "We've just sent a link to {e}. Open it to confirm your account, then sign in here with your email and password.",
      verif_note: "Nothing after a few minutes? Check your spam folder. The link works only once. Already have an account with this email? Just sign in.",
      verif_retour: "Back to sign in",
      lien_rate: "This link is no longer valid: sign in with your email and password (if you just confirmed your email, that's done).",
      lien_rate_connecte: "This link is no longer valid or could not be checked, but you're already in your space: nothing to do.",
      non_confirme: "Your email isn't confirmed yet: open the link we sent you (check your spam folder).",
      trop_demandes: "Too many requests at once: try again in a minute.",
      envoi_rate: "The email could not be sent (a problem on our side). Try again in a moment; if it keeps happening, message me on Instagram ({p}).",
      trop_emails: "Lots of sign-ups right now: try again in an hour.",
      premier_lien: "First link accepted: now click the one sent to your other address. The email change is done on the second click.",
      email_change: "Your email address has been changed: use the new one to sign in.",
      trop_emails_compte: "Too many emails sent in a short time: try again in an hour.",
      oubli: "Write to us at {e}, we'll get you back in quickly."
    },
    confidentialite: {
      titre: "Terms of use and privacy",
      paragraphes: [
        "MHX Coaching's free space gives you general information and training, for adults only. It is not medical advice: if you have any doubt about your health, talk to a professional before starting.",
        "Data collected: your first name, your last name, your email, your answers to the 3 starting questions and your activity in the app, including your clicks on “Get my action plan”. Health data: what you enter (weight, measurements, age, height and activity in the calorie calculator), with your consent, asked the first time you use a tool that processes it (calculator, weight and measurement tracking, “Organise ta diète” tool).",
        "Use: to adapt what you see to your answers, calculate your calories, track your progress and offer you an assessment with the coach. No resale, no advertising.",
        "Coach follow-up: the coach sees your answers and activity, and records, for their follow-up, the outcome of your assessment and their follow-up messages. These notes don't appear in the app: you can ask for a copy or their deletion by writing to the coach.",
        "Health data (GDPR article 9): you must explicitly accept the processing of your health data (weight, measurements, calorie calculator data). You can view or delete this data at any time. This data is kept as long as your account exists.",
        "Hosting: Supabase, servers in Europe (Ireland).",
        "Content loaded from Google: the app's fonts (Google Fonts) and video preview images (YouTube) are loaded from Google's servers, which then receive your IP address. A video embedded in the app only starts if you click it; it then plays from YouTube, in privacy-enhanced mode.",
        "Booking: your assessment is booked on Calendly (a US company), which records your booking on the coach's behalf; this data may be processed in the United States (EU–US Data Privacy Framework). Your first name, last name and email are pre-filled as soon as you open the booking page, along with the app screen you came from.",
        "Newsletter (optional): if you tick the box, you receive MHX Coaching's tips, testimonials and coaching offers by email, 2 emails per week at most. One-click unsubscribe in every email, and you can withdraw your consent at any time in your Profile.",
        "Your rights: you can export or delete your account and all your data at any time from Profile, section \"My data\", or by writing to the coach.",
        "Retention: as long as your account exists.",
        "By ticking the box, you accept these terms."
      ]
    }
  }
};

