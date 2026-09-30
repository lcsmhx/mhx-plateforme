/* ==================================================================
   DONNEES DE LA FORMATION — SpeedFormation 1.0
   Le contenu est rapatrie ici depuis Notion : le client n'a plus a
   sortir de l'application, et les cases cochees sont enregistrees
   sur son compte.
   ================================================================== */
const FORMATION = {
  titre: "SpeedFormation 1.0",
  video: "Bsinn0muMF4",
  /* v60 (brief V2, I1) : duree de la video de bienvenue, en minutes. Vide : l'etiquette « Commence ici » s'affiche sans
     duree ; sinon « Commence ici · X min » avec X = 2 + 1 + cette duree (calcul 2 min, pesee 1 min). */
  video_minutes: 0,
  /* v60 (brief V2, I) : les deux cartes du haut, pour un PROSPECT seulement (anglais : I18N.en) */
  depart: {
    etiquette: "Commence ici", etiquette_min: "Commence ici · {x} min",
    titre: "3 actions pour bien démarrer aujourd'hui",
    video: "Regarde la vidéo de bienvenue", calcul: "Calcule tes calories (2 min)", pesee: "Note ton poids de départ (1 min)",
    fait: "fait", fini: "Départ lancé ✓"
  },
  apercu: {
    titre: "Ce qui t'attend dans ta formation",
    modules: "modules", videos: "vidéos avec Lucas", documents: "guides et documents", defis: "défis",
    dont: "Dont 3 programmes d'entraînement (12 semaines femme, 12 semaines homme, full body maison) et 3 plans alimentaires (sans restriction, sans gluten, vegan).",
    outils: "Plus tes outils : organisation de la diète, priorités, notes et objectifs. Gratuit, sans limite de temps."
  },
  intro:"Une méthode simple pour poser les bases en 14 jours : ton alimentation, ton entraînement et tes habitudes, sans programme complexe ni séance interminable. Conçue pour les personnes occupées : le plan s'intègre dans ta routine, entre le travail et la famille.",

  /* --- le processus, coche par coche --- */
  processus: [
    { titre: "Étape 1 — Poser les bases de ta transformation", taches: [
      ["p1a", "Regarder la vidéo de présentation et valider le module 0"],
      ["p1b", "Valider toutes les étapes du module 1 sur le mindset"],
      ["p1c", "Comprendre et valider les étapes du module 2"],
      ["p1d", "Comprendre, valider les étapes et choisir son entraînement dans le module 3"],
      ["p1e", "Remplir toutes les informations du module 4"],
      ["p1f", "Choisir un défi dans le module 5"],
      ["p1g", "Comprendre et utiliser les outils pour ta transformation"]
    ]},
    { titre: "Étape 2 — Passer à l'action", taches: [
      ["p2a", "Prendre ton poids, tes mensurations et tes photos (face, dos, profil)"],
      ["p2b", "Lancer ta première séance"],
      ["p2c", "Commencer ton rééquilibrage alimentaire"],
      ["p2d", "Commencer ton défi"],
      ["p2e", "Noter ta progression tous les 7 jours, et ton ressenti de fin de semaine"]
    ]},
    { titre: "Étape 3 — Renforcer tes habitudes", taches: [
      ["p3a", "Reprendre poids et mensurations chaque semaine"],
      ["p3b", "Prendre des photos toutes les 4 semaines (face, dos, profil)"],
      ["p3c", "Noter ta progression tous les 7 jours"],
      ["p3d", "Réviser le module concerné en cas de difficulté"],
      ["p3e", "Faire un bilan écrit toutes les 4 semaines : discipline, performances, points forts et points faibles"]
    ]},
    { titre: "Étape 4 — Continuer", taches: [
      ["p4a", "Tes habitudes et ta routine sont installées"],
      ["p4b", "Tu fais des points réguliers et tu observes des résultats"]
    ]},
    { titre: "Étape 5 — Célébrer tes succès", taches: [
      ["p5a", "Envoyer tes photos avant / après (premier et dernier jour)"],
      ["p5b", "Envoyer ton tableau de mensurations"],
      ["p5c", "Envoyer ton retour d'expérience"]
    ]}
  ],

  modules: [
    /* ---------------- Module 0 ---------------- */
    { id:"m0", titre:"Module 0 — Introduction", icone:"🚀",
      objectif:"Poser les bases et définir les attentes.",
      contenu:[
        "Des objectifs réalistes : ce qu'on peut viser en 14 jours, et ce qui demande plus de temps.",
        "La structure de la formation et les résultats attendus.",
        "L'évaluation initiale : mesurer ton point de départ."
      ],
      video:"NSdx73OG9U0",
      taches:[
        ["m0a","Regarder la vidéo d'introduction"],
        ["m0b","Faire ta première prise de mensurations"],
        ["m0c","Prendre tes photos de départ (face, dos, profil)"]
      ],
      interne:[{t:"Ton suivi de mensurations", id:"mensurations"}]
    },

    /* ---------------- Module 1 ---------------- */
    { id:"m1", titre:"Module 1 — Mindset", icone:"🧠",
      objectif:"Travailler l'état d'esprit qui fait tenir une transformation dans la durée.",
      contenu:[
        "L'importance du mindset dans la réussite de tes objectifs.",
        "Rester motivé, même pendant les moments difficiles.",
        "Des exercices de réflexion pour ancrer la détermination et lever les blocages."
      ],
      video:"uLBsZQ5E-tE",
      taches:[
        ["m1a","Regarder la vidéo"],
        ["m1b","Définir les choses IMPORTANTES pour toi"],
        ["m1c","Écrire ton POURQUOI en une seule phrase"],
        ["m1d","Identifier la source de ton manque de confiance"],
        ["m1e","Formuler ton objectif au format S.M.A.R.T"],
        ["m1f","Faire ton plan de visualisation"],
        ["m1g","Choisir UNE action hors de ta zone de confort"]
      ],
      lecons:[ "mindset" ]
    },

    /* ---------------- Module 2 ---------------- */
    { id:"m2", titre:"Module 2 — L'alimentation", icone:"🥗",
      objectif:"Simplifier l'alimentation pour obtenir des résultats sans frustration.",
      contenu:[
        "Les principes de la nutrition : macronutriments, habitudes à adopter.",
        "Des plans de repas simples et pratiques.",
        "Éviter les pièges alimentaires courants."
      ],
      video:"9JV8RCOctjg",
      taches:[
        ["m2a","Lire la ressource « Comprendre l'alimentation »"],
        ["m2b","Prendre en main « Organise ta diète »"],
        ["m2c","Remplir ton tableau de suivi et faire ton calcul"],
        ["m2d","Regarder ton plan de repas et ta liste de courses"],
        ["m2e","Lire le guide d'astuces pour gérer les fringales"]
      ],
      lecons:[ "alimentation" ],
      widgets:[ "diete" ],
      interne:[{t:"Tes repas et ta liste de courses", id:"nutrition"}],
      ressources:[
        {t:"Organise ta diète (PDF)", u:"https://drive.google.com/file/d/13mgHbjBg65AoHNsf04X5Hj-BNyyfJM5h/view?usp=drive_link"},
        {t:"Plan alimentaire sans restriction", u:"https://drive.google.com/file/d/1BGtdJ5bK-kH1WuGZayNSbxnj1qFIJXLA/view?usp=sharing"},
        {t:"Plan alimentaire sans gluten", u:"https://drive.google.com/file/d/1g0DCGNe_MmorfUvUhleaP2mWFWQnj9P8/view?usp=drive_link"},
        {t:"Plan alimentaire vegan", u:"https://drive.google.com/file/d/14v8BBGNFjwzyXUHzqybuImxHQ0kM2LvQ/view?usp=drive_link"},
        {t:"Guide d'astuces (fringales et excès)", u:"https://drive.google.com/file/d/13CaG8T6PKYsEPT6Sou-BgfiFM--pmkAp/view?usp=sharing"}
      ]
    },

    /* ---------------- Module 3 ---------------- */
    { id:"m3", titre:"Module 3 — L'entraînement", icone:"🏋️",
      objectif:"Te fournir un entraînement adapté, quel que soit ton niveau.",
      contenu:[
        "Le guide START 1.0.",
        "L'échauffement et les étirements, pour éviter les blessures.",
        "Les niveaux de difficulté et ta programmation sur 12 semaines.",
        "Ton programme full body à la maison et ta séance de HIIT express.",
        "Les exercices, expliqués étape par étape."
      ],
      video:"UsxeGjhG-7M",
      taches:[
        ["m3a","Lire le guide « START 1.0 »"],
        ["m3b","Choisir ton programme"],
        ["m3c","Adapter ta routine d'entraînement"]
      ],
      interne:[{t:"Ton programme d'entraînement", id:"programme"}],
      ressources:[
        {t:"Guide START 1.0", u:"https://drive.google.com/file/d/1ilSWfNUE516VSx7lUKX4TV8K-WjsgdtY/view?usp=sharing"},
        {t:"Training 12 semaines — Femme", u:"https://drive.google.com/file/d/1X5KcFQf-euB8bLjDfcv9TqbVniqMzzZ7/view?usp=drive_link"},
        {t:"Training 12 semaines — Homme", u:"https://drive.google.com/file/d/1csUSlfliebu6JTz0wUssZkpHb8X9MGD_/view?usp=drive_link"},
        {t:"Full body à la maison", u:"https://drive.google.com/file/d/197E2YJaa7jORdykUkFuQYQjOGFydgDV5/view?usp=sharing"}
      ],
      note:"Les démonstrations vidéo de chaque mouvement sont directement dans ton programme : ouvre « Comment faire ? » sous un exercice."
    },

    /* ---------------- Module 4 ---------------- */
    { id:"m4", titre:"Module 4 — L'organisation", icone:"🗓️",
      objectif:"Organiser tes journées pour maximiser ta progression.",
      contenu:[
        "Inclure l'entraînement et l'alimentation dans ta routine.",
        "Des outils de planification et de suivi des progrès.",
        "Gérer ton emploi du temps sans stress."
      ],
      video:"y7TtPEllxew",
      taches:[
        ["m4a","Prioriser tes tâches"],
        ["m4b","Prendre des notes pour t'aider"],
        ["m4c","Noter tes objectifs"]
      ],
      widgets:[ "priorites", "notes", "objectifs" ]
    },

    /* ---------------- Module 5 ---------------- */
    { id:"m5", titre:"Module 5 — Les challenges", icone:"🎯",
      objectif:"Dépasser tes limites pour progresser plus vite.",
      contenu:[
        "Des challenges hebdomadaires avec des objectifs précis.",
        "Le suivi des résultats de chaque défi.",
        "Te fixer tes propres objectifs."
      ],
      video:"l891puGN8mM",
      taches:[
        ["m5a","Regarder la vidéo de présentation"],
        ["m5b","Choisir ton challenge"],
        ["m5c","Le valider"]
      ],
      widgets:[ "challenges" ]
    },

    /* ---------------- Module 6 ---------------- */
    { id:"m6", titre:"Module 6 — Accélérateurs et ressources", icone:"⚡",
      objectif:"Des ressources additionnelles pour booster tes résultats.",
      contenu:[
        "Guides et outils de suivi.",
        "Des astuces avancées pour l'entraînement et l'alimentation.",
        "Des ressources exclusives."
      ],
      taches:[
        ["m6a","Prendre en main toutes tes ressources"],
        ["m6b","Lire tous les guides"],
        ["m6c","Valider ici quand tu as tout lu"]
      ],
      interne:[
        {t:"Ton suivi de mensurations", id:"mensurations"},
        {t:"Tes repas et ta liste de courses", id:"nutrition"}
      ],
      ressources:[
        {t:"Guide des compléments alimentaires", u:"https://drive.google.com/file/d/1_QsmBzVPmp20Jbrkf-P0ei6tVLdhIxaj/view?usp=sharing"},
        {t:"Les 9 lois d'un mindset incassable", u:"https://drive.google.com/file/d/1-XdZr5rUdp6HT9DB3k4aHh30eRr6L6Gv/view?usp=sharing"},
        {t:"Méthode 90 jours — discipline de fer", u:"https://drive.google.com/file/d/1Ky_17zcG7VHOkWzzcPCtmhNVgLg6h8d0/view?usp=drive_link"},
        {t:"Guide circuit abdos", u:"https://drive.google.com/file/d/1fRS8cJhxCqiyy0geE6pW6OXfcClWEhcn/view?usp=sharing"}
      ]
    }
  ],

  /* --- les defis hebdomadaires, un par semaine --- */
  challenges: [
    { id:"c1", titre:"Semaine 1 — Découverte et mise en place", axes:[
      { nom:"Perte de gras", objectif:"Introduire un déficit calorique léger.",
        defi:"Suivre un plan alimentaire basique : réduire les portions de sucre, augmenter les légumes dans chaque repas." },
      { nom:"Discipline", objectif:"Développer une routine matinale.",
        defi:"Un rituel de 10 minutes chaque matin, sans te lever plus tôt : un grand verre d'eau, 5 minutes de respiration, relire ton objectif." },
      { nom:"Séances de sport", objectif:"Augmenter la fréquence d'entraînement.",
        defi:"Ajouter une séance légère dans la semaine : marche rapide ou 15 minutes de cardio léger." }
    ]},
    { id:"c2", titre:"Semaine 2 — Intensification", axes:[
      { nom:"Perte de gras", objectif:"Garder la faim sous contrôle.",
        defi:"Une source de protéines à chaque repas (œufs, poisson, viande, laitages, tofu ou légumineuses) et la moitié de l'assiette en légumes, le midi et le soir." },
      { nom:"Discipline", objectif:"Renforcer la gestion du temps.",
        defi:"Planifier la journée la veille au soir, repas et entraînements compris." },
      { nom:"Séances de sport", objectif:"Augmenter le volume d'entraînement.",
        defi:"Ajouter une deuxième séance : un circuit rapide au poids de corps." }
    ]},
    { id:"c3", titre:"Semaine 3 — Structuration et progression", axes:[
      { nom:"Perte de gras", objectif:"Profiter sans tout dérégler.",
        defi:"Prévoir à l'avance ton repas plaisir de la semaine et le savourer, sans compenser le lendemain : pas de repas sauté, pas de séance punition." },
      { nom:"Discipline", objectif:"Suivre une routine stricte.",
        defi:"Réduire une mauvaise habitude : limiter les distractions numériques pendant les repas ou le travail." },
      { nom:"Séances de sport", objectif:"Ajouter de la diversité.",
        defi:"Intégrer une séance de renforcement sur un groupe musculaire précis : jambes, dos…" }
    ]},
    { id:"c4", titre:"Semaine 4 — Finale intensification", axes:[
      { nom:"Perte de gras", objectif:"Bouger plus au quotidien.",
        defi:"Ajouter 2\u00a0000 pas par jour à ta moyenne habituelle : escaliers, trajets à pied, marche après le repas." },
      { nom:"Discipline", objectif:"Rehausser la résilience mentale.",
        defi:"Se fixer un mini-objectif quotidien : méditer 10 minutes, lire 10 pages d'un livre de développement personnel." },
      { nom:"Séances de sport", objectif:"Tenir le rythme de 3 séances.",
        defi:"Faire 3 séances dans la semaine (20 minutes suffisent), avec au moins un jour de repos entre deux séances intenses." }
    ]},
    { id:"c5", titre:"Semaine 5 — Évaluation et ajustement", axes:[
      { nom:"Perte de gras", objectif:"Évaluer les progrès.",
        defi:"Faire un bilan complet des habitudes alimentaires et des performances, puis ajuster." },
      { nom:"Discipline", objectif:"Consolider les habitudes créées.",
        defi:"Se donner une récompense en fin de semaine : un repas plaisir équilibré." },
      { nom:"Séances de sport", objectif:"Ajuster et faire évoluer.",
        defi:"Revoir le programme pour l'adapter aux progrès : plus de poids ou plus de répétitions." }
    ]}
  ],

  /* --- les 10 defis sur une semaine --- */
  defis: [
    ["d1","7 jours sans sucres ajoutés","Éliminer les sucres ajoutés dans les boissons, desserts et en-cas industriels. Les fruits restent au menu."],
    ["d2","1,5 litre d'eau par jour","Garder une bouteille à portée de main et boire au moins 1,5 litre d'eau par jour."],
    ["d3","5 séances de circuit abdos","Réaliser un circuit abdos 5 fois dans la semaine : 3 à 5 exercices (crunch, gainage, relevés de jambes, obliques), 3 séries de 15 répétitions."],
    ["d4","Une portion de légumes à chaque repas","Inclure des légumes, crus ou cuits, dans chacun de tes repas."],
    ["d5","30 minutes de marche rapide, 3 fois","Marche rapide ou vélo, au moment de la journée qui te va le mieux."],
    ["d6","Des collations prévues, pas subies","Pendant 3 jours, prévoir tes collations à l'avance (un fruit, un yaourt, une poignée d'oléagineux) au lieu de grignoter au hasard."],
    ["d7","10 minutes de respiration ou de méditation par jour","Réduire le stress aide à tenir tes bonnes habitudes."],
    ["d8","Aucune boisson calorique de la semaine","Éviter jus de fruits, sodas, alcool et café sucré : les calories liquides sont les plus souvent oubliées."],
    ["d9","30 minutes de sommeil en plus chaque nuit","Se coucher 30 minutes plus tôt : bien dormir aide à récupérer et à mieux gérer la faim."],
    ["d10","Écrire ses objectifs chaque matin","Quelques minutes chaque matin pour écrire ou relire tes objectifs, et rester concentré toute la journée."]
  ]
};

/* ==================================================================
   LES LECONS — le contenu des pages rapatriees depuis Notion.
   Elles s'ouvrent dans l'application, sans lien exterieur.
   ================================================================== */
const LECONS = {

  mindset: {
    titre: "Mindset — le guide visuel",
    duree: "12 minutes de lecture · 15 minutes de pratique par jour",
    html: `
      <p class="fo-chapo">Ce document est ta carte du module Mindset. Avant les séances, avant les compléments, avant le programme : c'est ici que tout commence. Lis-le une fois en entier, puis reviens-y chaque semaine.</p>

      <h4>La carte en un coup d'œil</h4>
      <p>Le module repose sur 4 piliers, dans cet ordre précis — chacun prépare le suivant.</p>
      <ol class="fo-piliers">
        <li><b>La force de l'esprit</b> — conscient et subconscient, loi de polarité, visualisation</li>
        <li><b>Motivation et discipline</b> — le carburant et le moteur, la règle des 10</li>
        <li><b>L'objectif</b> — un objectif concret, le filtre S.M.A.R.T, l'action</li>
        <li><b>La confiance</b> — la zone de confort, en sortir, évoluer</li>
      </ol>
      <p class="fo-cle"><b>La logique du parcours :</b> tu comprends comment ton esprit fonctionne → tu installes la discipline qui ne dépend pas de l'humeur → tu poses un objectif clair et mesurable → tu passes à l'action, et c'est l'action qui construit la confiance. Puis tu recommences un cran plus haut.</p>

      <h4>Pilier 1 — La force de l'esprit</h4>
      <p class="fo-def"><b>L'esprit :</b> l'ensemble des facultés mentales — pensée, conscience, imagination, perception, émotions — qui te permettent de comprendre, d'analyser et d'interagir avec toi-même et le monde.</p>
      <div class="fo-duo">
        <div><b>L'esprit conscient</b><br>Il a la capacité de choisir. Il perçoit, analyse et décide à partir des informations présentes. Il agit de façon intentionnelle et rationnelle.<br><i>→ C'est ton pilote.</i></div>
        <div><b>L'esprit subconscient</b><br>Il n'a pas la capacité de choisir. Il traite l'information automatiquement, hors de ta conscience : souvenirs, habitudes, croyances, réactions instinctives.<br><i>→ C'est ton automatisme.</i></div>
      </div>
      <p class="fo-alerte"><b>Ce que ça change pour toi :</b> ton subconscient exécute ce qu'on lui a donné, sans filtre. Si tu ne le reprogrammes pas volontairement — répétition, visualisation, nouvelles habitudes — il rejouera indéfiniment les anciens schémas, même quand ton esprit conscient veut autre chose.</p>

      <h5>La loi de la polarité</h5>
      <p><b>La polarité :</b> la présence de deux éléments opposés ou complémentaires dans un même système. La loi de la polarité décrète que tout a un opposé. Pas de hauteur sans bas, pas de chaud sans froid. Et surtout :</p>
      <table class="fo-tab">
        <tr><th>Le pôle qui bloque</th><th>Son opposé</th><th>Ce que tu fais</th></tr>
        <tr><td>L'ignorance</td><td>La connaissance</td><td>Tu étudies</td></tr>
        <tr><td>Le doute</td><td>La preuve</td><td>Tu agis et tu mesures</td></tr>
        <tr><td>La peur</td><td>L'habitude</td><td>Tu répètes jusqu'à ce que ce soit banal</td></tr>
      </table>
      <p class="fo-cle">Pour éliminer l'ignorance il faut de la compréhension. <b>Tu peux arriver à tout faire si tu étudies.</b></p>

      <h5>La visualisation</h5>
      <p>Le cerveau ne fait pas toujours la différence entre une expérience réellement vécue et une expérience imaginée de manière intense. Une image mentale vive active les mêmes circuits neuronaux que l'expérience réelle. Tu prépares donc ton esprit — et parfois ton corps — à accomplir l'action dans la réalité.</p>
      <ol class="fo-etapes">
        <li><b>Établis un objectif précis.</b> Réussir une performance, parler devant un public avec facilité, atteindre un objectif de santé. Plus l'objectif est précis, plus la visualisation est puissante.</li>
        <li><b>Crée une image mentale détaillée.</b> Ferme les yeux et imagine chaque détail. Ressens les émotions que tu éprouveras : joie, satisfaction, confiance. Intègre ce que tu vois, ce que tu entends, ce que tu ressens physiquement.</li>
        <li><b>Pratique régulièrement.</b> Quelques minutes chaque jour. La répétition renforce les connexions neuronales et ancre l'image. C'est ce qui augmente la probabilité que tu passes réellement à l'action.</li>
      </ol>
      <p><b>Ce que ça te rapporte :</b> de la confiance (en te voyant réussir, tu crées une croyance en tes capacités), moins de stress (tu as déjà « vécu » la situation, la peur de l'inconnu tombe), et le passage à l'action (l'objectif devient clair, ton engagement se renforce).</p>

      <h4>Pilier 2 — Motivation et discipline</h4>
      <div class="fo-duo">
        <div><b>La motivation</b><br>La force qui te pousse à agir, qu'elle vienne de désirs internes ou d'influences externes. <b>Elle va et vient.</b> C'est le carburant.</div>
        <div><b>La discipline</b><br>La capacité à te contrôler et à maintenir une régularité dans tes actions — <b>même sans motivation</b>, face aux distractions et aux obstacles. <b>Elle reste.</b> C'est le moteur.</div>
      </div>
      <p class="fo-alerte"><b>La phrase à retenir :</b> la motivation te fait commencer, la discipline te fait finir. Tu ne peux pas contrôler ton niveau de motivation du jour. Tu peux contrôler si tu y vas quand même.</p>
      <h5>La règle des 10</h5>
      <p>Les 10 leviers à installer, dans l'ordre.</p>
      <ol class="fo-etapes">
        <li><b>Définis un pourquoi fort</b> — la raison profonde, pas la raison de surface</li>
        <li><b>Établis des objectifs clairs et réalistes</b> — voir le pilier 3</li>
        <li><b>Crée une routine</b> — mêmes jours, mêmes heures, moins de décisions à prendre</li>
        <li><b>Utilise les petites victoires</b> — un gain visible chaque semaine</li>
        <li><b>Gère les moments de faiblesse</b> — anticipe-les, ils arriveront</li>
        <li><b>Entoure-toi de soutien</b> — coach, partenaire, groupe</li>
        <li><b>Sois bienveillant envers toi-même</b> — un écart n'est pas un échec</li>
        <li><b>Visualise le succès quotidiennement</b> — voir le pilier 1</li>
        <li><b>Utilise des moyens de suivi</b> — poids, photos, charges, sensations</li>
        <li><b>Développe la patience et la persévérance</b> — les résultats arrivent après, pas pendant</li>
      </ol>

      <h4>Pilier 3 — L'objectif</h4>
      <p class="fo-flux">Un objectif concret et réalisable → on le passe au filtre S.M.A.R.T → ACTION</p>
      <table class="fo-tab">
        <tr><th>Lettre</th><th>Ce que ça veut dire</th><th>Exemple concret</th></tr>
        <tr><td><b>S</b> — Spécifique</td><td>L'objectif doit être précis et clair.</td><td>Pas « je veux perdre du poids » mais « je veux perdre 5 kg de graisse ».</td></tr>
        <tr><td><b>M</b> — Mesurable</td><td>Tu dois pouvoir mesurer tes progrès.</td><td>Le poids, mais aussi le tour de taille et la progression des performances.</td></tr>
        <tr><td><b>A</b> — Atteignable</td><td>Réaliste par rapport à tes capacités et ton mode de vie.</td><td>3 séances par semaine si tu travailles 50 h, pas 6.</td></tr>
        <tr><td><b>R</b> — Réaliste et pertinent</td><td>Important pour toi, en accord avec tes valeurs.</td><td>Si perdre du poids améliore ton bien-être, il devient pertinent — donc motivant.</td></tr>
        <tr><td><b>T</b> — Temporellement défini</td><td>Fixe une échéance.</td><td>« Je souhaite perdre 5 kg en 10 semaines. »</td></tr>
      </table>
      <p class="fo-cle"><b>À faire maintenant</b> — écris ton objectif dans « Mes objectifs », module 4 :<br>
      Je veux …………………… (spécifique) · Je le mesurerai avec …………………… (mesurable) · C'est atteignable parce que …………………… · C'est important pour moi parce que …………………… · Échéance : …… / …… / ……</p>
      <p class="fo-alerte"><b>Étape 3 : action.</b> Un objectif écrit et jamais exécuté ne vaut rien. La première action doit être posée dans les 48 h.</p>

      <h4>Pilier 4 — La confiance</h4>
      <p class="fo-cle"><b>La confiance vient par l'action.</b> Pas avant. On n'attend pas de se sentir prêt pour agir — on agit, et le sentiment d'être prêt arrive ensuite.</p>
      <div class="fo-trio">
        <div><b>Rester dans la zone de confort</b><br>Pas d'évolution. Ennui. Perte d'objectifs. Peurs qui grandissent. Perte de confiance. Et surtout : progression inversée — ne pas avancer, c'est reculer.</div>
        <div><b>Comment en sortir</b><br>Comprendre sa zone de confort. Se fixer des objectifs progressifs. Accepter la peur et l'incertitude. Trouver un mentor ou un partenaire. Pratiquer la visualisation.</div>
        <div><b>Une fois dehors</b><br>Évolution. Tu te sens plus fort. Tu écrases les peurs. Ton estime de toi augmente. Plus d'ennui.</div>
      </div>
      <p class="fo-alerte"><b>Priorité absolue :</b> commence par identifier la source de ton manque de confiance. Tant que tu ne sais pas d'où il vient, tu traites le symptôme et pas la cause.</p>

      <h4>Ton plan de démarrage — 4 semaines</h4>
      <div class="fo-plan">
        <div><b>Semaine 1 — Comprendre</b><ul><li>Lire ce document en entier, une fois</li><li>Écrire mon pourquoi fort, en une phrase</li><li>Identifier la source de mon manque de confiance</li><li>Repérer une croyance qui me freine</li></ul></div>
        <div><b>Semaine 2 — Cadrer</b><ul><li>Écrire mon objectif au format S.M.A.R.T</li><li>Fixer mon échéance précise</li><li>Choisir mes 2 ou 3 indicateurs de suivi</li><li>Poser ma première action dans les 48 h</li></ul></div>
        <div><b>Semaine 3 — Installer</b><ul><li>Construire ma routine, jours et heures fixes</li><li>Démarrer la visualisation, 5 minutes par jour</li><li>Noter ma première petite victoire</li><li>Prévenir mon entourage ou mon partenaire de suivi</li></ul></div>
        <div><b>Semaine 4 — Sortir de la zone</b><ul><li>Identifier UNE chose hors de ma zone de confort</li><li>La faire</li><li>Relire mes notes des 3 semaines précédentes</li><li>Ajuster l'objectif si besoin, et repartir un cran plus haut</li></ul></div>
      </div>

      <h4>Les réponses rapides</h4>
      <details class="fo-faq"><summary>« Je n'ai jamais la motivation »</summary><p>Normal. La motivation est une émotion, elle fluctue. C'est exactement pour ça que le pilier 2 existe : la discipline est la capacité à agir <b>en l'absence</b> de motivation. Tu n'as pas un problème de motivation, tu as un problème de routine. Repars du point 3 de la règle des 10.</p></details>
      <details class="fo-faq"><summary>« Je me fixe des objectifs et je les abandonne »</summary><p>Ton objectif n'a probablement pas passé le filtre S.M.A.R.T. Les deux lettres qui font échouer le plus souvent : <b>A</b> (l'objectif était trop gros) et <b>T</b> (pas d'échéance, donc pas d'urgence).</p></details>
      <details class="fo-faq"><summary>« Je n'ai pas confiance en moi »</summary><p>La confiance ne se décide pas, elle se construit par l'action. Commence par identifier la source du manque, puis fixe-toi un objectif volontairement petit, assez petit pour le réussir. Une réussite, puis une autre. C'est la seule mécanique qui fonctionne.</p></details>
      <details class="fo-faq"><summary>« La visualisation, ça marche vraiment ? »</summary><p>Le principe est neurologique : une image mentale intense active les mêmes circuits que l'expérience réelle. Ce n'est pas de la pensée magique, c'est de la préparation. Elle ne remplace pas l'action, elle la rend plus probable et plus fluide.</p></details>
      <details class="fo-faq"><summary>« Par où je commence, concrètement ? »</summary><p>Par l'étape 1 de la semaine 1 : écris ton pourquoi fort. Une phrase. Aujourd'hui.</p></details>

      <p class="fo-legal">Ce document a un but informatif et pédagogique. Il ne remplace pas un accompagnement psychologique ou un avis médical. En cas de difficulté personnelle importante, adresse-toi à un professionnel de santé.</p>
    `
  },

  alimentation: {
    titre: "Comprendre l'alimentation",
    duree: "10 minutes de lecture",
    html: `
      <h4>Chapitre 1 — Les bases</h4>
      <p>Les macronutriments sont les nutriments qui nous donnent des calories et de l'énergie. Ils nous sont vitaux pour vivre, grandir et faire fonctionner notre métabolisme. Ils se rangent en 3 grandes catégories : les glucides, les protéines et les lipides.</p>
      <p>Sans ces 3 macronutriments, le corps peut souffrir de carences et de fatigue, et il commence lentement à s'éteindre — comme ta voiture quand elle n'a plus d'essence. C'est pourquoi il est impératif d'en consommer tous les jours. Toutes les catégories apportent des calories, mais pas dans les mêmes proportions :</p>
      <table class="fo-tab">
        <tr><th>Macronutriment</th><th>Par gramme</th></tr>
        <tr><td>Glucides</td><td>4 calories</td></tr>
        <tr><td>Protéines</td><td>4 calories</td></tr>
        <tr><td>Lipides</td><td>9 calories</td></tr>
      </table>

      <h4>Chapitre 2 — Les lipides</h4>
      <p>Imagine que ton corps est une voiture. Les lipides, c'est l'huile et le carburant.</p>
      <ol class="fo-etapes">
        <li><b>Source d'énergie.</b> Avocats, noix, beurre, huile : ton corps les transforme en énergie, comme une voiture brûle de l'essence. Cette énergie te sert à courir, à jouer, et même à penser.</li>
        <li><b>Stockage d'énergie.</b> Les lipides peuvent être mis en réserve. Si tu n'as pas mangé depuis un moment, ton corps y puise pour continuer à fonctionner.</li>
        <li><b>Protection et isolation.</b> Ils protègent tes organes et gardent ton corps au chaud. Cela prévient les blessures et maintient une température stable.</li>
        <li><b>Constitution des cellules.</b> Ils forment les membranes de toutes tes cellules — les murs protecteurs qui leur permettent de fonctionner.</li>
        <li><b>Transport des nutriments.</b> Les vitamines A, D, E et K ont besoin de lipides pour circuler. Elles sont cruciales pour ta vision, ta peau, tes os et ton sang.</li>
      </ol>
      <p class="fo-cle"><b>En résumé :</b> les lipides sont le carburant et les pièces de ta voiture. Ils te donnent de l'énergie, te protègent, construisent tes cellules et transportent des nutriments importants.</p>

      <h4>Chapitre 3 — Les protéines</h4>
      <p>Cette fois, les protéines sont les pièces et les mécaniciens de la voiture.</p>
      <ol class="fo-etapes">
        <li><b>Construction et réparation.</b> Muscles, os, peau, cheveux : si tu te blesses ou si tu grandis, ton corps utilise des protéines pour guérir et devenir plus fort.</li>
        <li><b>Enzymes.</b> Ce sont de petites machines qui accélèrent les réactions chimiques, comme la digestion. Sans elles, transformer les aliments en énergie serait beaucoup plus lent.</li>
        <li><b>Hormones.</b> Certaines protéines sont des messages envoyés dans ton corps — l'insuline, par exemple, régule le sucre dans le sang.</li>
        <li><b>Transport et stockage.</b> L'hémoglobine transporte l'oxygène dans le sang, comme un camion transporte des marchandises.</li>
        <li><b>Structure.</b> Le collagène donne de la force à ta peau et à tes os. Sans protéines structurelles, ton corps serait fragile.</li>
        <li><b>Système immunitaire.</b> Les anticorps sont des protéines : ils combattent les infections, comme des soldats qui protègent un château.</li>
      </ol>
      <p class="fo-cle"><b>En résumé :</b> les protéines construisent et réparent ton corps, facilitent les réactions chimiques, envoient des messages, transportent des substances, soutiennent la structure et te protègent des maladies.</p>

      <h4>Chapitre 4 — Les glucides</h4>
      <p>Les glucides sont le carburant principal.</p>
      <ol class="fo-etapes">
        <li><b>Source d'énergie rapide.</b> Pâtes, pain, fruits, légumes : ton corps les transforme en glucose, l'essence de ta voiture.</li>
        <li><b>Stockage d'énergie.</b> L'excès est stocké sous forme de glycogène dans les muscles et le foie, un réservoir supplémentaire pour les efforts intenses ou entre les repas.</li>
        <li><b>Fonctionnement du cerveau.</b> Ton cerveau consomme beaucoup de glucose : il t'aide à penser clairement, à apprendre et à mémoriser.</li>
        <li><b>Fonctionnement des muscles.</b> Sans assez de glucides, tes muscles fatiguent plus vite et tu te sens faible.</li>
        <li><b>Stabilité de la glycémie.</b> Les glucides à libération lente — grains entiers, légumes, fruits — évitent les pics et les chutes de sucre dans le sang.</li>
        <li><b>Préservation des protéines.</b> Avec assez de glucides, ton corps n'a pas besoin de décomposer les protéines de tes muscles pour trouver de l'énergie.</li>
      </ol>
      <p class="fo-cle"><b>En résumé :</b> les glucides te donnent de l'énergie rapide, alimentent ton cerveau et tes muscles, stabilisent ta glycémie et préservent tes muscles.</p>

      <h4>Le calcul, en pratique</h4>
      <p>Si tu consommes 50 g de glucides, 30 g de protéines et 20 g de lipides :</p>
      <ul class="fo-calc">
        <li>Glucides : 50 × 4 = <b>200 calories</b></li>
        <li>Protéines : 30 × 4 = <b>120 calories</b></li>
        <li>Lipides : 20 × 9 = <b>180 calories</b></li>
      </ul>
      <p class="fo-cle">Total = 200 + 120 + 180 = <b>500 calories</b></p>
    `
  }
};

/* ------------------------------------------------------------------
   OUTIL — Formation
   La formation SpeedFormation 1.0, rapatriee dans l'application :
   les videos, les lecons, les cases a cocher et les outils de suivi.
   Tout ce que le client coche est enregistre sur son compte.
   ------------------------------------------------------------------ */
const JOURS_SEM = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const REPAS_SEM = ["Petit-déjeuner","Collation matin","Déjeuner","Collation après-midi","Dîner","Collation soir"];

const outilFormation = {
  id: "formation",
  cle: "formation",
  nom: "Speed Formation",
  icone: "🎓",
  titre: FORMATION.titre,
  accroche: "Ta formation complète : les vidéos, les guides et tes outils de suivi. Ce que tu coches ici reste enregistré.",

  vide(){
    return { coches:{}, ouvert:"", lecon:"", challenge:"", defis:{},
             diete:{}, semaine:1, jour:0,
             priorites:{ semaine:[], demain:[] }, notes:[], objectifs:[] };
  },

  migrer(D){
    const v = this.vide();
    if (!D || typeof D !== "object") return v;
    Object.keys(v).forEach(k => { if (D[k] == null) D[k] = v[k]; });
    if (!D.priorites.semaine) D.priorites.semaine = [];
    if (!D.priorites.demain)  D.priorites.demain  = [];
    return D;
  },

  /* ---------- petites briques d'affichage ---------- */
  video(id, legende, ancre){   // v60 : ancre = id de la boite (la video de bienvenue du prospect, « Commence ici »)
    if (!idVideo(id)) return "";
    return `<div class="video-boite"${ancre ? ` id="${esc(ancre)}"` : ""}>
      <button type="button" class="video-vignette" data-yt="${esc(id)}" aria-label="Lire la vidéo">
        <img src="https://img.youtube.com/vi/${esc(id)}/hqdefault.jpg" alt="" loading="lazy">
        <span class="jouer">▶ ${esc(legende || "Regarder la vidéo")}</span>
      </button>
    </div>`;
  },

  caseHTML(id, texte, coche){
    return `<li><label class="fo-case"><input type="checkbox" data-coche="${esc(id)}"${coche ? " checked" : ""}><span>${esc(texte)}</span></label></li>`;
  },

  /* combien de cases cochees sur combien, tous modules confondus */
  compte(D){
    let tot = 0, faits = 0;
    FORMATION.processus.forEach(s => s.taches.forEach(t => { tot++; if (D.coches[t[0]]) faits++; }));
    FORMATION.modules.forEach(m => (m.taches || []).forEach(t => { tot++; if (D.coches[t[0]]) faits++; }));
    return { tot, faits, pct: tot ? Math.round(faits * 100 / tot) : 0 };
  },

  compteModule(D, m){
    const t = (m.taches || []);
    return { tot: t.length, faits: t.filter(x => D.coches[x[0]]).length };
  },

  /* ---------- v60 (brief V2, I) : les deux cartes du haut, prospect seulement ----------
     « Commence ici » : 3 actions qui se cochent toutes seules — la video de bienvenue lancee (D.depart.video, un instant,
     ecrit au clic seulement : une visite n'ecrit rien), un calcul enregistre (calc_perso valide, pas mineur), une pesee
     (mens) — lus par init() en lecture seule. Elles ne comptent pas dans les 49 etapes. Les 3 faites : une seule ligne.
     « Ce qui t'attend dans ta formation » : chiffres comptes dans FORMATION et LECONS, jamais ecrits en dur. */
  pourProspect(){ return Auth.estProspect() && !Store.idConsulte; },
  departEtat(D, R){
    const dep = D && D.depart && typeof D.depart === "object" && !Array.isArray(D.depart) ? D.depart : {}, P = R && R[outilCalculateur.cle_perso];
    return { video: typeof dep.video === "string" && !!dep.video, calcul: !!(outilCalculateur.valide(P) && !outilCalculateur.mineur(P)), pesee: Decouverte.peseeFaite(R && R.mens) };
  },
  departFini(e){ return !!(e && e.video && e.calcul && e.pesee); },
  departHTML(e){
    const L = FORMATION.depart;
    if (this.departFini(e)) return `<section class="panel fo-depart fo-depart-fini" id="fo-depart"><p class="fo-depart-ligne">${esc(trad(L.fini))}</p></section>`;
    const min = +FORMATION.video_minutes > 0 ? 3 + Math.round(+FORMATION.video_minutes) : 0;
    const act = [["video", "#fo-presentation", L.video], ["calcul", "#/calculateur", L.calcul], ["pesee", "#/mensurations", L.pesee]];
    return `<section class="panel fo-depart" id="fo-depart"><span class="eyebrow">${esc(min ? trad(L.etiquette_min, { x: min }) : trad(L.etiquette))}</span>
      <h2>${esc(typoFr(trad(L.titre)))}</h2>
      <ol class="fo-depart-l">${act.map(a => { const f = !!e[a[0]]; return `<li${f ? ' class="fait"' : ""}><a href="${a[1]}" data-depart="${a[0]}"><span class="fo-depart-c" aria-hidden="true">${f ? "✓" : ""}</span><span class="fo-depart-t">${esc(trad(a[2]))}</span>${f ? `<span class="sr-only"> (${esc(trad(L.fait))})</span>` : ""}</a></li>`; }).join("")}</ol></section>`;
  },
  chiffres(){
    const F = FORMATION, mods = F.modules || [];
    return { modules: mods.length,
      videos: [F.video].concat(mods.map(m => m.video)).filter(v => idVideo(v)).length,
      documents: mods.reduce((n, m) => n + (m.ressources || []).length + (m.lecons || []).filter(k => LECONS[k]).length, 0),
      defis: (F.challenges || []).reduce((n, c) => n + (c.axes || []).length, 0) + (F.defis || []).length };
  },
  apercuHTML(){
    const L = FORMATION.apercu, n = this.chiffres();
    const tuile = (v, l) => `<div class="tile"><div class="t-val readout">${esc(String(v))}</div><div class="t-sub">${esc(trad(l))}</div></div>`;
    return `<section class="panel fo-apercu" id="fo-apercu"><h2>${esc(typoFr(trad(L.titre)))}</h2>
      <div class="tiles">${tuile(n.modules, L.modules)}${tuile(n.videos, L.videos)}${tuile(n.documents, L.documents)}${tuile(n.defis, L.defis)}</div>
      <p style="margin:14px 0 0">${esc(typoFr(trad(L.dont)))}</p><p class="note" style="margin:8px 0 0">${esc(typoFr(trad(L.outils)))}</p></section>`;
  },

  /* ---------- la page ---------- */
  vue(D, visibles, depart){
    const c = this.compte(D);
    let h = "";
    /* v60 (brief V2, I) : sous l'en-tete, au-dessus de « Ton parcours », pour un prospect seulement */
    if (depart && this.pourProspect()) h += this.departHTML(depart) + this.apercuHTML();

    /* en-tete : progression + video de presentation (v36 : bibliotheque) */
    const nbModules = FORMATION.modules.length, modulesFinis = FORMATION.modules.filter(m => { const cm = this.compteModule(D, m); return cm.tot && cm.faits === cm.tot; }).length;
    h += `<section class="panel">
      <div class="prog-tete-haut">
        <div>
          <span class="eyebrow">${esc(trad("Bibliothèque"))} · ${nbModules} ${esc(trad("modules"))}</span>
          <h2 style="margin:4px 0 8px">Ton parcours</h2>
          <p style="margin:0">${esc(typoFr(FORMATION.intro))}</p>
        </div>
        <div class="tile prog-compteur"><div class="t-lbl">Progression</div><div class="t-val readout${c.pct >= 100 ? " pos" : ""}">${c.pct}<small>%</small></div><div class="t-sub">${c.faits} / ${c.tot} ${esc(trad("étapes"))}</div></div>
      </div>
      <div class="fo-jauge" style="margin-top:14px"><div class="fo-jauge-in" style="width:${c.pct}%"></div></div>
      <p class="note" style="margin:8px 0 16px">${modulesFinis} ${esc(trad(modulesFinis > 1 ? "modules terminés" : "module terminé"))} ${esc(trad("sur"))} ${nbModules}</p>
      ${this.video(FORMATION.video, "Voir la présentation de la formation", depart && this.pourProspect() ? "fo-presentation" : "")}
    </section>`;

    /* le processus */
    h += `<section class="panel"><h2>Le processus, étape par étape</h2>`;
    FORMATION.processus.forEach(s => {
      h += `<div class="fo-step"><h3>${esc(s.titre)}</h3><ul class="fo-liste">
        ${s.taches.map(t => this.caseHTML(t[0], t[1], D.coches[t[0]])).join("")}
      </ul></div>`;
    });
    h += `</section>`;

    /* les modules : une carte numerotee, sa barre, et son contenu quand on l'ouvre */
    FORMATION.modules.forEach((m, idx) => {
      const cm = this.compteModule(D, m);
      const ouvert = D.ouvert === m.id;
      const pct = cm.tot ? Math.round(cm.faits / cm.tot * 100) : 0;
      const titre = String(m.titre || "").replace(/^Module \d+\s*[—-]\s*/, "");
      h += `<section class="panel fo-mod${ouvert ? " ouvert" : ""}${cm.tot && cm.faits === cm.tot ? " fini" : ""}">
        <button type="button" class="fo-tete" data-mod="${esc(m.id)}" aria-expanded="${ouvert}">
          <span class="fo-num" aria-hidden="true">${String(idx).padStart(2, "0")}</span>
          <span class="fo-corps-tete"><span class="fo-nom">${esc(titre)}</span><span class="fo-obj-court">${esc(typoFr(m.objectif || ""))}</span>
            ${cm.tot ? `<span class="fo-jauge fo-jauge-mod"><span class="fo-jauge-in" style="width:${pct}%"></span></span>` : ""}</span>
          ${cm.tot ? `<span class="pastille${cm.faits === cm.tot ? " fo-ok" : ""}">${cm.faits}/${cm.tot}</span>` : ""}
          <span class="fo-fleche">${ouvert ? "▾" : "▸"}</span>
        </button>`;
      if (ouvert){
        h += `<div class="fo-corps">
          <p class="fo-obj"><b>${esc(typoFr("Objectif :"))}</b> ${esc(typoFr(m.objectif))}</p>
          ${(m.contenu || []).length ? `<ul class="fo-contenu">${m.contenu.map(x => `<li>${esc(typoFr(x))}</li>`).join("")}</ul>` : ""}
          ${this.video(m.video)}
          ${(m.taches || []).length ? `<h3>Ta to-do list</h3><ul class="fo-liste">${m.taches.map(t => this.caseHTML(t[0], t[1], D.coches[t[0]])).join("")}</ul>` : ""}`;

        /* lecons rapatriees */
        (m.lecons || []).forEach(cle => {
          const L = LECONS[cle]; if (!L) return;
          const on = D.lecon === cle;
          h += `<div class="fo-lecon">
            <button type="button" class="fo-lecon-tete" data-lecon="${esc(cle)}" aria-expanded="${on}">
              <span>📄 ${esc(L.titre)}</span><span class="meta">${esc(L.duree || "")}</span>
            </button>
            ${on ? `<div class="fo-lecon-corps">${L.html}</div>` : ""}
          </div>`;
        });

        /* outils interactifs */
        (m.widgets || []).forEach(w => { h += this.widget(w, D); });

        /* liens internes */
        const internes = (m.interne || []).filter(x => visibles.indexOf(x.id) >= 0);
        if (internes.length){
          h += `<h3>Dans ton espace</h3><ul class="fo-ress">${internes.map(x =>
            `<li><a class="link-a" href="#/${esc(x.id)}">${esc(x.t)} →</a></li>`).join("")}</ul>`;
        }
        if ((m.ressources || []).length){
          h += `<h3>Tes ressources à télécharger</h3><ul class="fo-ress">${m.ressources.map(r =>
            (lienSur(r.u) ? `<li><a class="link-a" href="${esc(lienSur(r.u))}" target="_blank" rel="noopener">${esc(r.t)} ↗</a></li>` : `<li>${esc(r.t)}</li>`)).join("")}</ul>`;
        }
        if (m.note) h += `<p class="note">${esc(m.note)}</p>`;
        h += `</div>`;
      }
      h += `</section>`;
    });

    h += `<section class="panel"><h2>Une question ?</h2>
      <p style="margin:0">Écris directement à ton coach : <a class="link-a" href="mailto:${esc(CONFIG.marque.email)}">${esc(CONFIG.marque.email)}</a></p></section>`;
    return h;
  },

  /* ================= les outils interactifs ================= */
  widget(nom, D){
    if (nom === "diete")      return this.wDiete(D);
    if (nom === "priorites")  return this.wPriorites(D);
    if (nom === "notes")      return this.wNotes(D);
    if (nom === "objectifs")  return this.wObjectifs(D);
    if (nom === "challenges") return this.wChallenges(D);
    return "";
  },

  /* --- Organise ta diete : 12 semaines x 7 jours x 6 repas --- */
  ligneDiete(D){
    const s = String(D.semaine), j = String(D.jour);
    const sem = D.diete[s] || (D.diete[s] = {});
    if (!sem[j]) sem[j] = REPAS_SEM.map(() => ({ f:false, p:"", g:"", l:"" }));
    return sem[j];
  },
  kcal(r){ return (+r.p || 0) * 4 + (+r.g || 0) * 4 + (+r.l || 0) * 9; },

  wDiete(D){
    const lignes = this.ligneDiete(D);
    let tp = 0, tg = 0, tl = 0;
    lignes.forEach(r => { tp += +r.p || 0; tg += +r.g || 0; tl += +r.l || 0; });
    const tot = tp * 4 + tg * 4 + tl * 9;
    let sem = "";
    for (let i = 1; i <= 12; i++) sem += `<option value="${i}"${D.semaine === i ? " selected" : ""}>Semaine ${i}</option>`;

    return `<div class="fo-outil">
      <h3>Organise ta diète</h3>
      <p class="note" style="margin:0 0 12px">Note tes grammes, les calories se calculent toutes seules. Coche les repas que tu as réellement pris.</p>
      <div class="fo-barre">
        <select id="fo-sem" aria-label="Semaine">${sem}</select>
        <div class="tabs" style="margin:0">${JOURS_SEM.map((n, i) =>
          `<button type="button" class="tab" data-fj="${i}" aria-pressed="${D.jour === i}">${n.slice(0,3)}</button>`).join("")}</div>
      </div>
      <div class="fo-scroll"><table class="fo-tab fo-diete">
        <tr><th>Repas</th><th>Fait</th><th>Prot. (g)</th><th>Gluc. (g)</th><th>Lip. (g)</th><th>Calories</th></tr>
        ${lignes.map((r, i) => `<tr>
          <td>${REPAS_SEM[i]}</td>
          <td><input type="checkbox" data-df="${i}"${r.f ? " checked" : ""} aria-label="Repas pris"></td>
          <td><input type="number" min="0" step="1" data-dm="${i}.p" value="${esc(r.p)}" aria-label="Protéines"></td>
          <td><input type="number" min="0" step="1" data-dm="${i}.g" value="${esc(r.g)}" aria-label="Glucides"></td>
          <td><input type="number" min="0" step="1" data-dm="${i}.l" value="${esc(r.l)}" aria-label="Lipides"></td>
          <td class="fo-kcal" data-kcal="${i}">${this.kcal(r) || ""}</td>
        </tr>`).join("")}
        <tr class="fo-total"><td><b>Total du jour</b></td><td></td>
          <td id="fo-tp">${tp || ""}</td><td id="fo-tg">${tg || ""}</td><td id="fo-tl">${tl || ""}</td>
          <td id="fo-tk"><b>${tot || ""}</b></td></tr>
      </table></div>
      <p class="note" style="margin:10px 0 0">Rappel : 1 g de protéines = 4 kcal, 1 g de glucides = 4 kcal, 1 g de lipides = 9 kcal.</p>
    </div>`;
  },

  /* --- Outils de gestion de priorite --- */
  wPriorites(D){
    const liste = (cle, titre) => {
      const items = D.priorites[cle];
      return `<div class="fo-colonne">
        <h4>${titre}</h4>
        <ul class="fo-liste">${items.length ? items.map(t =>
          `<li><label class="fo-case"><input type="checkbox" data-pf="${cle}.${esc(t.id)}"${t.fait ? " checked" : ""}><span${t.fait ? ' class="fo-barre-txt"' : ""}>${esc(t.texte)}</span></label>
           <button type="button" class="fo-x" data-px="${cle}.${esc(t.id)}" aria-label="Supprimer">×</button></li>`).join("")
          : `<li class="note">Rien pour l'instant.</li>`}</ul>
        <div class="fo-ajout"><input type="text" data-pa="${cle}" placeholder="Ajouter une tâche…" aria-label="Nouvelle tâche">
          <button type="button" class="btn ghost" data-pb="${cle}">+</button></div>
      </div>`;
    };
    return `<div class="fo-outil"><h3>Priorise tes tâches</h3>
      <div class="fo-duo">${liste("semaine", "Cette semaine")}${liste("demain", "Demain")}</div></div>`;
  },

  /* --- Mes notes --- */
  wNotes(D){
    return `<div class="fo-outil"><h3>Mes notes</h3>
      ${D.notes.length ? D.notes.map(n => `<div class="fo-note">
        <div class="fo-note-tete">
          <input type="text" data-nt="${esc(n.id)}" value="${esc(n.titre)}" placeholder="Titre" aria-label="Titre de la note">
          <span class="meta">${esc(dateFr(n.date) || "")}</span>
          <button type="button" class="fo-x" data-nx="${esc(n.id)}" aria-label="Supprimer">×</button>
        </div>
        <textarea rows="4" data-nc="${esc(n.id)}" placeholder="Ta note…" aria-label="Contenu">${esc(n.texte)}</textarea>
      </div>`).join("") : `<p class="note">Aucune note. Écris ce qui t'aide : un déclic, une difficulté, une idée de repas.</p>`}
      <div class="actions"><button type="button" class="btn ghost" id="fo-note-add">+ Ajouter une note</button></div></div>`;
  },

  /* --- Mes objectifs --- */
  wObjectifs(D){
    const carte = o => `<div class="fo-obj-carte${o.fait ? " fo-fait" : ""}">
      <label class="fo-case"><input type="checkbox" data-of="${esc(o.id)}"${o.fait ? " checked" : ""}><span class="sr-only">Atteint</span></label>
      <div class="fo-obj-champs">
        <input type="text" data-ot="${esc(o.id)}" value="${esc(o.titre)}" placeholder="Mon objectif (spécifique)" aria-label="Objectif">
        <div class="fo-obj-bas">
          <input type="text" data-om="${esc(o.id)}" value="${esc(o.mesure)}" placeholder="Je le mesure avec…" aria-label="Mesure">
          <input type="date" data-oe="${esc(o.id)}" value="${esc(o.echeance)}" aria-label="Échéance">
        </div>
      </div>
      <button type="button" class="fo-x" data-ox="${esc(o.id)}" aria-label="Supprimer">×</button>
    </div>`;
    const encours = D.objectifs.filter(o => !o.fait), atteints = D.objectifs.filter(o => o.fait);
    return `<div class="fo-outil"><h3>Mes objectifs</h3>
      <p class="note" style="margin:0 0 12px">Un objectif par ligne, au format S.M.A.R.T : ce que tu veux, comment tu le mesures, pour quand.</p>
      <h4>Suivi des objectifs</h4>
      ${encours.length ? encours.map(carte).join("") : `<p class="note">Aucun objectif en cours.</p>`}
      <div class="actions"><button type="button" class="btn ghost" id="fo-obj-add">+ Ajouter un objectif</button></div>
      ${atteints.length ? `<h4>Atteints</h4>${atteints.map(carte).join("")}` : ""}
    </div>`;
  },

  /* --- Les challenges --- */
  /* v59 : les challenges ne sont pas encore traduits : leur etiquette « Objectif : » reste en francais (data-notr), sinon
     l'anglais affichait « Goal: » devant un objectif en francais (la cle sert a l'objectif de chaque module)
     v60 (brief V2, J5) : un objectif qui a sa traduction (defis remplaces) garde l'etiquette traduisible (« Goal: ») */
  wChallenges(D){
    const traduit = t => Object.prototype.hasOwnProperty.call(I18N.en, Traduction.norm(t));
    let h = `<div class="fo-outil"><h3>Choisis ton challenge</h3>
      <p class="note" style="margin:0 0 12px">Un challenge par semaine, sur trois axes. Choisis-en un et tiens-le sept jours.</p>`;
    FORMATION.challenges.forEach(c => {
      const on = D.challenge === c.id;
      h += `<div class="fo-chal${on ? " fo-chal-on" : ""}">
        <button type="button" class="fo-chal-tete" data-chal="${esc(c.id)}" aria-pressed="${on}">
          <span>${esc(c.titre)}</span><span class="pastille">${on ? "Choisi" : "Choisir"}</span>
        </button>
        <div class="fo-chal-corps">${c.axes.map(a => `<div class="fo-axe">
          <b>${esc(a.nom)}</b>
          <p class="note" style="margin:2px 0 0"><i${traduit(a.objectif) ? "" : " data-notr"}>${esc(typoFr("Objectif :"))}</i> ${esc(typoFr(a.objectif))}</p>
          <p style="margin:4px 0 0">${esc(typoFr(a.defi))}</p>
        </div>`).join("")}</div>
      </div>`;
    });
    const faits = FORMATION.defis.filter(d => D.defis[d[0]]).length;
    h += `<h4>10 défis sur une semaine <span class="pastille">${faits}/10</span></h4>
      <ul class="fo-liste fo-defis">${FORMATION.defis.map(d =>
        `<li><label class="fo-case"><input type="checkbox" data-defi="${esc(d[0])}"${D.defis[d[0]] ? " checked" : ""}>
          <span><b>${esc(typoFr(d[1]))}</b><br><span class="note">${esc(typoFr(d[2]))}</span></span></label></li>`).join("")}</ul></div>`;
    return h;
  },

  /* ================= montage ================= */
  html(){ return `<div id="fo-vue"><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  async init(){
    const self = this;
    const D = this.migrer(await Store.lire(this.cle, this.vide()));
    const zone = $("fo-vue");
    if (!zone) return;
    const sauver = () => Store.ecrire(self.cle, D);
    const visibles = outilsVisibles().filter(o => !horsVitrine(o)).map(o => o.id);   // v50 : pas de lien vers un onglet cache au prospect
    const nouvelId = () => "x" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    /* v60 (brief V2, I) : prospect — son calcul et sa pesee, lus sans rien ecrire (comme son accueil : ce que cet onglet
       vient d'enregistrer et que le serveur n'a pas encore compte aussi, outilDecouverte.saisiesLocales) */
    let depart = null;
    if (self.pourProspect()){
      const cles = [outilCalculateur.cle_perso, "mens"], locales = outilDecouverte.saisiesLocales(cles);
      const { valeurs: R, dates } = await Store.lireTout(cles, { dates: true });
      Object.keys(locales).forEach(c => { const x = locales[c], m = dates[c]; if (x.t === null || !m || new Date(m).getTime() < new Date(x.t).getTime()) R[c] = Forme.cle(c, x.v); });
      if (!zone.isConnected) return;
      depart = self.departEtat(D, R);
    }

    const dessiner = () => {
      zone.innerHTML = self.vue(D, visibles, depart);
      brancher();
      reposer();
    };
    /* v60 : la carte « Commence ici » seule redessinee (la video qui vient de demarrer reste a l'ecran) */
    const majDepart = () => {
      const c = zone.querySelector("#fo-depart"); if (!c || !depart) return;
      const t = document.createElement("div"); t.innerHTML = self.departHTML(depart);
      const n = t.firstElementChild; if (n){ c.replaceWith(n); brancherDepart(); }
    };
    /* v62 (brief V2, H) : les invitations montrees pendant cette visite restent sous leur declencheur quand la page est
       redessinee (une case cochee redessine tout) ; « Plus tard » les retire pour de bon */
    const montrees = {};
    const ancres = { declic_mindset: () => { const b = zone.querySelector('[data-mod="m1"]'); return b && b.closest("section"); }, formation_commence_ici: () => zone.querySelector("#fo-depart") };
    const poser = code => carte => { const a = ancres[code](); if (!a || !zone.isConnected) return false; a.after(carte); montrees[code] = carte; return true; };
    const reposer = () => Object.keys(montrees).forEach(k => { const c = montrees[k]; if (c && !c.isConnected && c.dataset.ferme !== "1") poser(k)(c); });
    const mindsetFini = () => { const m = FORMATION.modules.find(x => x.id === "m1"), cm = m ? self.compteModule(D, m) : null; return !!(cm && cm.tot && cm.faits === cm.tot); };
    const departLance = () => { if (depart && self.departFini(depart)) Invitations.declencher("formation_commence_ici", poser("formation_commence_ici")); };
    /* la video de bienvenue lancee (prospect) : notee une fois dans sa cle formation, au clic */
    const videoLancee = () => {
      if (!depart || depart.video) return;
      if (!D.depart || typeof D.depart !== "object" || Array.isArray(D.depart)) D.depart = {};
      const avant = D.depart.video;
      if (!D.depart.video) D.depart.video = new Date().toISOString();
      if (sauver() === false){ if (avant === undefined) delete D.depart.video; return; }   // refusee (message deja affiche) : rien de coche
      depart.video = true;
      majDepart(); departLance();
    };
    function brancherDepart(){
      const a = zone.querySelector('[data-depart="video"]');
      if (a) a.addEventListener("click", ev => {
        ev.preventDefault();
        const boite = $("fo-presentation"), vg = boite && boite.querySelector(".video-vignette");
        if (boite) boite.scrollIntoView({ behavior: "smooth", block: "center" });
        if (vg) vg.click();   // la lance (compte comme lancee)
      });
    }

    function brancher(){
      brancherDepart();
      /* videos : on ne charge le lecteur qu'au clic */
      $$(".video-vignette", zone).forEach(v => v.addEventListener("click", () => {
        const cadre = document.createElement("div");
        cadre.className = "video-cadre";
        if (!idVideo(v.dataset.yt)) return;
        const bienvenue = !!v.closest("#fo-presentation");   // v60 : la video de bienvenue (prospect)
        cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${idVideo(v.dataset.yt)}?rel=0&autoplay=1" title="Vidéo de la formation" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        v.parentNode.replaceChild(cadre, v);
        if (bienvenue) videoLancee();
      }));

      /* ouverture des modules et des lecons */
      $$("[data-mod]", zone).forEach(b => b.addEventListener("click", () => {
        D.ouvert = (D.ouvert === b.dataset.mod) ? "" : b.dataset.mod;
        sauver(); dessiner();
        const t = zone.querySelector('[data-mod="' + D.ouvert + '"]');
        if (t) t.scrollIntoView({ block:"start", behavior:"smooth" });
      }));
      $$("[data-lecon]", zone).forEach(b => b.addEventListener("click", () => {
        D.lecon = (D.lecon === b.dataset.lecon) ? "" : b.dataset.lecon;
        sauver(); dessiner();
      }));

      /* cases a cocher du parcours */
      $$("[data-coche]", zone).forEach(c => c.addEventListener("change", () => {
        const avant = mindsetFini();
        D.coches[c.dataset.coche] = c.checked;
        if (!c.checked) delete D.coches[c.dataset.coche];
        sauver(); dessiner();
        /* v62 (H) : les 7 cases du module 01 Mindset viennent d'etre cochees (prospect) */
        if (!avant && mindsetFini() && self.pourProspect()) Invitations.declencher("declic_mindset", poser("declic_mindset"));
      }));

      /* --- diete --- */
      const selSem = $("fo-sem", zone);
      if (selSem) selSem.addEventListener("change", () => { D.semaine = +selSem.value; sauver(); dessiner(); });
      $$("[data-fj]", zone).forEach(b => b.addEventListener("click", () => { D.jour = +b.dataset.fj; sauver(); dessiner(); }));
      $$("[data-df]", zone).forEach(c => c.addEventListener("change", () => {
        self.ligneDiete(D)[+c.dataset.df].f = c.checked; sauver();
      }));
      const majTotaux = () => {
        const lignes = self.ligneDiete(D);
        let tp = 0, tg = 0, tl = 0;
        lignes.forEach((r, i) => {
          tp += +r.p || 0; tg += +r.g || 0; tl += +r.l || 0;
          const c = zone.querySelector('[data-kcal="' + i + '"]');
          if (c) c.textContent = self.kcal(r) || "";
        });
        const mettre = (id, v) => { const e = $(id, zone); if (e) e.textContent = v || ""; };
        mettre("fo-tp", tp); mettre("fo-tg", tg); mettre("fo-tl", tl);
        const k = $("fo-tk", zone); if (k) k.innerHTML = "<b>" + ((tp * 4 + tg * 4 + tl * 9) || "") + "</b>";
      };
      $$("[data-dm]", zone).forEach(e => e.addEventListener("input", () => {
        const p = e.dataset.dm.split(".");
        self.ligneDiete(D)[+p[0]][p[1]] = e.value;
        majTotaux(); sauver();
      }));

      /* --- priorites --- */
      const ajouter = cle => {
        const champ = zone.querySelector('[data-pa="' + cle + '"]');
        const t = (champ && champ.value || "").trim();
        if (!t) return;
        D.priorites[cle].push({ id: nouvelId(), texte: t, fait: false });
        sauver(); dessiner();
      };
      $$("[data-pb]", zone).forEach(b => b.addEventListener("click", () => ajouter(b.dataset.pb)));
      $$("[data-pa]", zone).forEach(e => e.addEventListener("keydown", ev => {
        if (ev.key === "Enter"){ ev.preventDefault(); ajouter(e.dataset.pa); }
      }));
      $$("[data-pf]", zone).forEach(c => c.addEventListener("change", () => {
        const p = c.dataset.pf.split("."), t = D.priorites[p[0]].find(x => x.id === p[1]);
        if (t) t.fait = c.checked;
        sauver(); dessiner();
      }));
      $$("[data-px]", zone).forEach(b => b.addEventListener("click", () => {
        const p = b.dataset.px.split(".");
        D.priorites[p[0]] = D.priorites[p[0]].filter(x => x.id !== p[1]);
        sauver(); dessiner();
      }));

      /* --- notes --- */
      const add = $("fo-note-add", zone);
      if (add) add.addEventListener("click", () => {
        D.notes.unshift({ id: nouvelId(), date: aujourdhui(), titre:"", texte:"" });
        sauver(); dessiner();
      });
      $$("[data-nt]", zone).forEach(e => e.addEventListener("input", () => {
        const n = D.notes.find(x => x.id === e.dataset.nt); if (n){ n.titre = e.value; sauver(); }
      }));
      $$("[data-nc]", zone).forEach(e => e.addEventListener("input", () => {
        const n = D.notes.find(x => x.id === e.dataset.nc); if (n){ n.texte = e.value; sauver(); }
      }));
      $$("[data-nx]", zone).forEach(b => b.addEventListener("click", () => {
        D.notes = D.notes.filter(x => x.id !== b.dataset.nx); sauver(); dessiner();
      }));

      /* --- objectifs --- */
      const addO = $("fo-obj-add", zone);
      if (addO) addO.addEventListener("click", () => {
        D.objectifs.push({ id: nouvelId(), titre:"", mesure:"", echeance:"", fait:false });
        sauver(); dessiner();
      });
      const champObj = (attr, prop) => $$("[data-" + attr + "]", zone).forEach(e => e.addEventListener("input", () => {
        const o = D.objectifs.find(x => x.id === e.dataset[attr]); if (o){ o[prop] = e.value; sauver(); }
      }));
      champObj("ot", "titre"); champObj("om", "mesure"); champObj("oe", "echeance");
      $$("[data-of]", zone).forEach(c => c.addEventListener("change", () => {
        const o = D.objectifs.find(x => x.id === c.dataset.of); if (o) o.fait = c.checked;
        sauver(); dessiner();
      }));
      $$("[data-ox]", zone).forEach(b => b.addEventListener("click", () => {
        D.objectifs = D.objectifs.filter(x => x.id !== b.dataset.ox); sauver(); dessiner();
      }));

      /* --- challenges --- */
      $$("[data-chal]", zone).forEach(b => b.addEventListener("click", () => {
        D.challenge = (D.challenge === b.dataset.chal) ? "" : b.dataset.chal;
        sauver(); dessiner();
      }));
      $$("[data-defi]", zone).forEach(c => c.addEventListener("change", () => {
        D.defis[c.dataset.defi] = c.checked;
        if (!c.checked) delete D.defis[c.dataset.defi];
        sauver(); dessiner();
      }));
    }

    dessiner();
    departLance();   // v62 (H) : les 3 actions faites (dont 2 ailleurs) : l'invitation, une seule fois
  }
};


