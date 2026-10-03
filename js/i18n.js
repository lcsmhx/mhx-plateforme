/* --- LANGUE (v27) ---------------------------------------------------------
   L'app reste ecrite en francais. En anglais, une couche traduit ce qui
   s'affiche, a partir du dictionnaire I18N.en (texte francais exact ->
   anglais) et de quelques motifs pour les phrases qui contiennent un nombre.
   Une entree absente = le texte reste en francais : rien ne peut casser.
   Les ecrans du coach ne sont pas traduits (ils ne servent qu'a l'equipe).
   Ce que saisit l'utilisateur n'est jamais touche : seuls les textes qui
   correspondent EXACTEMENT a une entree du dictionnaire sont remplaces. */
const I18N = {
  cle: "mhx_langue",
  langue: "fr",
  en: {},
  motifs: [],
  charger(){
    try { this.langue = localStorage.getItem(this.cle) === "en" ? "en" : "fr"; } catch(e){ this.langue = "fr"; }
    document.documentElement.lang = this.langue;
    window.__langue = this.langue;
    if (typeof Contenus !== "undefined") Contenus.decouverte();
    return this.langue;
  },
  /* renvoie true si le choix a bien ete range sur l'appareil */
  choisir(l){
    this.langue = (l === "en") ? "en" : "fr";
    document.documentElement.lang = this.langue;
    window.__langue = this.langue;
    if (typeof Contenus !== "undefined") Contenus.decouverte();
    try { localStorage.setItem(this.cle, this.langue); return localStorage.getItem(this.cle) === this.langue; } catch(e){ return false; }
  }
};
/* Pour les textes qui ne passent pas par l'ecran (confirm, alert, prompt).
   Nom long expres : une variable locale « t » existe deja a plusieurs endroits. */
function trad(fr, vars){
  let s = (I18N.langue === "en" && I18N.en[fr]) || fr;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(String(vars[k]));
  return s;
}
const Traduction = {
  norm: (s) => String(s).replace(/\s+/g, " ").trim(),
  inlines: /^(B|STRONG|EM|I|BR|SMALL|CODE|SPAN|SUP|SUB|U)$/,
  blocs: "p,li,h1,h2,h3,h4,label,button,a,summary,th,td,option,legend,dt,dd,span,div,small,strong,b,em",
  exclu(el){ return !el || !!(el.closest && el.closest("[data-notr],textarea,script,style")); },
  /* un bloc « simple » ne contient que de la mise en forme : on peut le
     remplacer d'un coup sans detruire un champ ou un bouton branche */
  blocSimple(el){
    if (!el.children.length) return false;
    for (const d of el.querySelectorAll("*")){
      if (!this.inlines.test(d.tagName) || d.id) return false;
      for (const a of d.attributes) if (a.name.indexOf("data-") === 0 || a.name.indexOf("on") === 0) return false;
    }
    return true;
  },
  texte(s){
    const n = this.norm(s);
    if (!n || !/[a-zàâçéèêëîïôûùüœ]/i.test(n)) return null;
    if (Object.prototype.hasOwnProperty.call(I18N.en, n)) return I18N.en[n];
    for (const [re, r] of I18N.motifs) if (re.test(n)) return n.replace(re, r);
    return null;
  },
  tn(nd){
    const p = nd.parentElement;
    if (!p || this.exclu(p)) return;
    const v = nd.nodeValue, tr = this.texte(v);
    if (tr != null && tr !== this.norm(v)) nd.nodeValue = v.match(/^\s*/)[0] + tr + v.match(/\s*$/)[0];
  },
  attributs(el){
    for (const a of ["placeholder", "title", "aria-label"]){
      const v = el.getAttribute && el.getAttribute(a);
      if (v){ const tr = this.texte(v); if (tr != null && tr !== v) el.setAttribute(a, tr); }
    }
  },
  noeud(racine){
    if (I18N.langue !== "en" || !racine) return;
    if (racine.nodeType === 3){ this.tn(racine); return; }
    if (racine.nodeType !== 1 || this.exclu(racine)) return;
    const els = [racine].concat(Array.from(racine.querySelectorAll(this.blocs)));
    for (const el of els){
      if (!el.isConnected || this.exclu(el) || !this.blocSimple(el)) continue;
      const k = this.norm(el.innerHTML);
      if (Object.prototype.hasOwnProperty.call(I18N.en, k) && I18N.en[k] !== k) el.innerHTML = I18N.en[k];
    }
    this.attributs(racine);
    racine.querySelectorAll("[placeholder],[title],[aria-label]").forEach(el => { if (!this.exclu(el)) this.attributs(el); });
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    const liste = []; let n; while ((n = w.nextNode())) liste.push(n);
    liste.forEach(x => this.tn(x));
    if (racine === document.body){ const tt = this.texte(document.title); if (tt) document.title = tt; }
  },
  demarrer(){
    if (this.obs) return;
    this.obs = new MutationObserver(ms => {
      if (I18N.langue !== "en") return;
      for (const m of ms){
        if (m.type === "characterData") this.tn(m.target);
        else if (m.type === "attributes") { if (!this.exclu(m.target)) this.attributs(m.target); }
        else m.addedNodes.forEach(nd => this.noeud(nd));
      }
    });
    this.obs.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["placeholder","title","aria-label"] });
    this.noeud(document.body);
  }
};
async function basculerLangue(){
  const l = I18N.langue === "en" ? "fr" : "en";
  const range = I18N.choisir(l);
  /* le choix suit le client d'un appareil a l'autre */
  try {
    const u = Auth.utilisateur();
    if (u && !Store.idConsulte) await Store.envoyer("prefs", { langue: l }, u.id);
  } catch(e){}
  if (range) location.reload();
  else afficher(courant);
}
function libelleLangue(){ return I18N.langue === "en" ? "🇫🇷 FR" : "🇺🇸 EN"; }

/* --- CONTENUS TRADUITS (v28) ------------------------------------------------
   Les exercices et les programmes types portent leur traduction dans la base
   (colonne traductions = {"en": {...meme forme que le francais...}}). En
   anglais, on les charge une fois et on ajoute chaque paire francais ->
   anglais au dictionnaire : la couche de traduction s'occupe du reste,
   partout ou ces textes s'affichent (programme du client, fiches exercices).
   Les notes ecrites a la main par le coach n'ont pas de traduction : elles
   restent telles quelles. */
const Contenus = {
  fait: false,
  /* les textes de la Decouverte (DECOUVERTE.en) rejoignent le dictionnaire une seule fois, des que
     la langue passe en anglais (au demarrage, ou depuis la preference rangee en base) */
  _decouverte: false,
  decouverte(){
    if (this._decouverte || I18N.langue !== "en" || typeof DECOUVERTE === "undefined" || !DECOUVERTE.en) return;
    this._decouverte = true;
    this.zip(DECOUVERTE, DECOUVERTE.en);
  },
  /* v67 (B2) : une paire qui contient « < » est ignoree — Traduction.noeud insere les valeurs du dictionnaire en HTML
     (innerHTML) : un texte du catalogue ne doit jamais pouvoir y glisser une balise (pas de balise sans « < » ; « > »
     reste permis : « Qualité > vitesse », notes du catalogue) */
  ajouter(fr, en){
    if (typeof fr !== "string" || typeof en !== "string" || !fr.trim() || !en.trim()) return;
    if (/</.test(fr) || /</.test(en)) return;
    const k = Traduction.norm(fr);
    if (k && k !== en && !Object.prototype.hasOwnProperty.call(I18N.en, k)) I18N.en[k] = en;
  },
  /* parcourt le francais et l'anglais cote a cote, cle par cle, case par case */
  zip(fr, en){
    if (Array.isArray(fr) && Array.isArray(en)) fr.forEach((x, i) => this.zip(x, en[i]));
    else if (fr && en && typeof fr === "object" && typeof en === "object") Object.keys(en).forEach(k => this.zip(fr[k], en[k]));
    else this.ajouter(fr, en);
  },
  async charger(){
    if (I18N.langue !== "en" || this.fait) return;
    this.fait = true;
    try {
      const [ex, pt] = await Promise.all([
        Auth.appel("/rest/v1/exercices?select=nom,execution,erreurs,respiration,traductions&traductions=not.is.null"),
        Auth.appel("/rest/v1/programmes_types?select=nom,note,seances,traductions&traductions=not.is.null")
      ]);
      [].concat(ex || [], pt || []).forEach(r => { if (r && r.traductions && r.traductions.en) this.zip(r, r.traductions.en); });
      Traduction.noeud(document.body);
    } catch(e){ this.fait = false; }
  }
};

/* Dictionnaire anglais (US) — genere depuis i18n/en_data.py. Cle = texte francais exact. */
I18N.en = {
/* v59 — Speed Formation : titres courts des modules (la carte retire « Module n — »), objectifs, contenu, note du module 3,
   libellés « Objectif : », « Ta to-do list » et bouton de la vidéo (« ▶ » compris : un seul texte). « Introduction » et
   « Mindset » restent tels quels (même mot en anglais). Tâches, défis, challenges et les 2 leçons : pas encore traduits
   (l'étiquette « Objectif : » des challenges reste donc en français : data-notr dans outilFormation.wChallenges). */
"L'alimentation": "Nutrition",
"L'entraînement": "Training",
"L'organisation": "Organization",
"Les challenges": "Challenges",
"Accélérateurs et ressources": "Boosters and resources",
"Poser les bases et définir les attentes.": "Lay the foundations and set expectations.",
"Travailler l'état d'esprit qui fait tenir une transformation dans la durée.": "Build the mindset that makes a transformation last.",
"Simplifier l'alimentation pour obtenir des résultats sans frustration.": "Keep nutrition simple to get results without frustration.",
"Te fournir un entraînement adapté, quel que soit ton niveau.": "Get training that fits you, whatever your level.",
"Organiser tes journées pour maximiser ta progression.": "Organize your days to make the most progress.",
"Dépasser tes limites pour progresser plus vite.": "Push past your limits to progress faster.",
"Des ressources additionnelles pour booster tes résultats.": "Extra resources to boost your results.",
"Des objectifs réalistes : ce qu'on peut viser en 14 jours, et ce qui demande plus de temps.": "Realistic goals: what you can aim for in 14 days, and what takes longer.",
"La structure de la formation et les résultats attendus.": "How the course is structured and the results to expect.",
"L'évaluation initiale : mesurer ton point de départ.": "The initial assessment: measure your starting point.",
"L'importance du mindset dans la réussite de tes objectifs.": "Why mindset matters in reaching your goals.",
"Rester motivé, même pendant les moments difficiles.": "Staying motivated, even through tough times.",
"Des exercices de réflexion pour ancrer la détermination et lever les blocages.": "Reflection exercises to build your determination and clear your mental blocks.",
"Les principes de la nutrition : macronutriments, habitudes à adopter.": "Nutrition basics: macronutrients and habits to adopt.",
"Des plans de repas simples et pratiques.": "Simple, practical meal plans.",
"Éviter les pièges alimentaires courants.": "Avoiding common food traps.",
"Le guide START 1.0.": "The START 1.0 guide.",
"L'échauffement et les étirements, pour éviter les blessures.": "Warm-up and stretching, to avoid injuries.",
"Les niveaux de difficulté et ta programmation sur 12 semaines.": "Difficulty levels and your 12-week plan.",
"Ton programme full body à la maison et ta séance de HIIT express.": "Your full-body home workout and your express HIIT session.",
"Les exercices, expliqués étape par étape.": "The exercises, explained step by step.",
"Les démonstrations vidéo de chaque mouvement sont directement dans ton programme : ouvre « Comment faire ? » sous un exercice.": "Video demos of every move are right in your program: open “How to do it” under an exercise.",
"Inclure l'entraînement et l'alimentation dans ta routine.": "Fitting training and nutrition into your routine.",
"Des outils de planification et de suivi des progrès.": "Tools to plan ahead and track your progress.",
"Gérer ton emploi du temps sans stress.": "Managing your schedule without stress.",
"Des challenges hebdomadaires avec des objectifs précis.": "Weekly challenges with clear goals.",
"Le suivi des résultats de chaque défi.": "Tracking the results of each challenge.",
"Te fixer tes propres objectifs.": "Setting your own goals.",
"Guides et outils de suivi.": "Guides and tracking tools.",
"Des astuces avancées pour l'entraînement et l'alimentation.": "Advanced tips for training and nutrition.",
"Des ressources exclusives.": "Exclusive resources.",
"Objectif :": "Goal:",
/* v60 (brief V2, section J) — défis remplacés ou réécrits : leur version anglaise (les autres challenges et défis restent en
   français en anglais, comme en v59). Un challenge dont l'objectif est traduit affiche « Goal: » (outilFormation.wChallenges). */
"Développer une routine matinale.": "Build a morning routine.",
"Un rituel de 10 minutes chaque matin, sans te lever plus tôt : un grand verre d'eau, 5 minutes de respiration, relire ton objectif.": "A 10-minute ritual every morning, without getting up earlier: a big glass of water, 5 minutes of breathing, reread your goal.",
"Garder la faim sous contrôle.": "Keep hunger under control.",
"Une source de protéines à chaque repas (œufs, poisson, viande, laitages, tofu ou légumineuses) et la moitié de l'assiette en légumes, le midi et le soir.": "A protein source at every meal (eggs, fish, meat, dairy, tofu or legumes) and half your plate as vegetables, at lunch and dinner.",
"Profiter sans tout dérégler.": "Enjoy without derailing.",
"Prévoir à l'avance ton repas plaisir de la semaine et le savourer, sans compenser le lendemain : pas de repas sauté, pas de séance punition.": "Plan your treat meal of the week in advance and enjoy it, without compensating the next day: no skipped meals, no punishment workouts.",
"Bouger plus au quotidien.": "Move more every day.",
"Ajouter 2 000 pas par jour à ta moyenne habituelle : escaliers, trajets à pied, marche après le repas.": "Add 2,000 steps a day to your usual average: stairs, walking commutes, a walk after meals.",
"Tenir le rythme de 3 séances.": "Keep up 3 workouts a week.",
"Faire 3 séances dans la semaine (20 minutes suffisent), avec au moins un jour de repos entre deux séances intenses.": "Do 3 workouts this week (20 minutes is enough), with at least one rest day between two intense sessions.",
"7 jours sans sucres ajoutés": "7 days without added sugar",
"Éliminer les sucres ajoutés dans les boissons, desserts et en-cas industriels. Les fruits restent au menu.": "Cut added sugar from drinks, desserts and packaged snacks. Fruit stays on the menu.",
"1,5 litre d'eau par jour": "1.5 liters of water a day",
"Garder une bouteille à portée de main et boire au moins 1,5 litre d'eau par jour.": "Keep a bottle within reach and drink at least 1.5 liters of water a day.",
"30 minutes de marche rapide, 3 fois": "30 minutes of brisk walking, 3 times",
"Marche rapide ou vélo, au moment de la journée qui te va le mieux.": "Brisk walking or cycling, whenever suits you best.",
"Des collations prévues, pas subies": "Planned snacks, not random ones",
"Pendant 3 jours, prévoir tes collations à l'avance (un fruit, un yaourt, une poignée d'oléagineux) au lieu de grignoter au hasard.": "For 3 days, plan your snacks ahead (a piece of fruit, a yogurt, a handful of nuts) instead of grazing at random.",
"10 minutes de respiration ou de méditation par jour": "10 minutes of breathing or meditation a day",
"Réduire le stress aide à tenir tes bonnes habitudes.": "Lowering stress helps you stick to your good habits.",
"30 minutes de sommeil en plus chaque nuit": "30 more minutes of sleep every night",
"Se coucher 30 minutes plus tôt : bien dormir aide à récupérer et à mieux gérer la faim.": "Go to bed 30 minutes earlier: good sleep helps you recover and manage hunger.",
/* v60 (brief V2, I) — les deux cartes du haut de la Speed Formation (prospect) : FORMATION.depart et FORMATION.apercu */
"Commence ici": "Start here",
"Commence ici · {x} min": "Start here · {x} min",
"3 actions pour bien démarrer aujourd'hui": "3 actions to get started today",
"Regarde la vidéo de bienvenue": "Watch the welcome video",
"Calcule tes calories (2 min)": "Calculate your calories (2 min)",
"Note ton poids de départ (1 min)": "Log your starting weight (1 min)",
"Départ lancé ✓": "You're off ✓",
"Ce qui t'attend dans ta formation": "What's inside your course",
"vidéos avec Lucas": "videos with Lucas",
"guides et documents": "guides and documents",
"défis": "challenges",
"Dont 3 programmes d'entraînement (12 semaines femme, 12 semaines homme, full body maison) et 3 plans alimentaires (sans restriction, sans gluten, vegan).": "Including 3 workout programs (12 weeks for women, 12 weeks for men, full body at home) and 3 meal plans (no restrictions, gluten-free, vegan).",
"Plus tes outils : organisation de la diète, priorités, notes et objectifs. Gratuit, sans limite de temps.": "Plus your tools: meal organizer, priorities, notes and goals. Free, with no time limit.",
"Ta to-do list": "Your to-do list",
"▶ Regarder la vidéo": "▶ Watch the video",
/* v53 — lot D-clients (calculateur du client, « Mon journal ») : ses traductions ici */
"Mes séances du programme": "My program workouts",
"Choisis la séance que tu viens de faire et note tes répétitions et tes charges, série par série.": "Pick the workout you just did and log your reps and weights, set by set.",
"Mes séances notées": "My logged workouts",
"Les plus récentes d'abord.": "Most recent first.",
"Afficher les séances plus anciennes": "Show older workouts",
"Ton coach n'a pas encore déposé ton programme : dès qu'il sera prêt, tu pourras noter tes séances ici.": "Your coach hasn't added your program yet: once it's ready, you'll be able to log your workouts here.",
". C'est à cette adresse qu'arrive le lien si tu oublies ton mot de passe — garde-la à jour.": ". This is where the reset link goes if you forget your password — keep it up to date.",
". C'est avec elle que tu te connectes.": ". It's the address you sign in with.",   /* v52 : aucun email envoyé par l'app */
"<span class=\"ico\" aria-hidden=\"true\">🎓</span>Ma formation": "<span class=\"ico\" aria-hidden=\"true\">🎓</span>My course",
"<span class=\"ico\" aria-hidden=\"true\">💊</span>Mes compléments": "<span class=\"ico\" aria-hidden=\"true\">💊</span>My supplements",
"<span class=\"ico\" aria-hidden=\"true\">📋</span>Mon programme": "<span class=\"ico\" aria-hidden=\"true\">📋</span>My program",
"<span class=\"ico\" aria-hidden=\"true\">📏</span>Mensurations": "<span class=\"ico\" aria-hidden=\"true\">📏</span>Measurements",
"<span class=\"ico\" aria-hidden=\"true\">📝</span>Mon profil": "<span class=\"ico\" aria-hidden=\"true\">📝</span>My profile",
"<span class=\"ico\" aria-hidden=\"true\">🥗</span>Mes repas": "<span class=\"ico\" aria-hidden=\"true\">🥗</span>My meals",
"<strong>Bienvenue !</strong><span class=\"note\">Commence par remplir ton profil : c'est ce qui permet à ton coach de construire ton suivi.</span>": "<strong>Welcome!</strong><span class=\"note\">Start by filling in your profile: it's what lets your coach build your plan.</span>",
"Adresse actuelle :": "Current email:",
"Ajouter ma première mesure": "Add my first measurement",
"Alcool : fréquence et quantité": "Alcohol: how often and how much",
"Aliments dont tu ne veux surtout pas te passer": "Foods you really don't want to give up",
"Aliments que tu ne mangeras jamais, quoi qu'il arrive": "Foods you will never eat, no matter what",
"Allergies et intolérances": "Allergies and intolerances",
"Arachides": "Peanuts",
"As-tu des contraintes de budget alimentaire ?": "Do you have a food budget to stick to?",
"As-tu déjà suivi un régime ou compté tes calories ? Avec quel résultat ?": "Have you ever dieted or counted calories? How did it go?",
"As-tu une contre-indication médicale au sport ou à un changement alimentaire ?": "Do you have any medical reason not to exercise or change your diet?",
"Aucune mesure enregistrée pour le moment.": "No measurements saved yet.",
"Autres allergies, intolérances ou interdits alimentaires": "Other allergies, intolerances or foods you avoid",
"Bienvenue !": "Welcome!",
"Blessures actuelles ou passées": "Current or past injuries",
"Bras": "Arm",
"Bras droit": "Right arm",
"Bras gauche": "Left arm",
"C'est définitif : il n'y a pas de corbeille.": "This is permanent: there's no trash to restore from.",
"C'est fait": "Done",
"C'est sur cette réponse que ton plan alimentaire sera bâti. Compte les collations comme des repas.": "Your meal plan is built on this answer. Count snacks as meals.",
"Cafés par jour": "Coffees per day",
"Ce que tu prends": "What you take",
"Ce que tu prends, à quelle dose et à quel moment. Rien d'obligatoire : un complément complète une alimentation, il ne la remplace pas.": "What you take, how much and when. Nothing is mandatory: a supplement complements your diet, it doesn't replace it.",
"Centimètres perdus": "Centimeters lost",
"Changement impossible.": "The change could not be made.",
"Changer mon adresse": "Change my email",
"Changer mon adresse email": "Change my email address",
"Changer mon mot de passe": "Change my password",
"Chaque jour, à n'importe quelle heure": "Every day, at any time",
"Choisis": "Choose",
"Choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.": "Choose <b>“Install app”</b> or <b>“Add to Home Screen”</b>.",
"Coche tout ce qui te concerne. Les aliments correspondants seront écartés de tes repas. Signale aussi toute allergie qui ne figure pas dans cette liste dans le champ suivant.": "Check everything that applies to you. Those foods will be kept out of your meals. Also mention any allergy that isn't on this list in the next field.",
"Collation": "Snack",
"Collation ou après la séance": "Snack or after your workout",
"Combien de fois par semaine manges-tu à l'extérieur ou au restaurant ?": "How many times a week do you eat out or at a restaurant?",
"Combien de repas par jour ? *": "How many meals a day? *",
"Combien de séances par semaine peux-tu RÉELLEMENT tenir ? *": "How many workouts a week can you REALLY keep up? *",
"Commence cette semaine": "Start this week",
"Commence par remplir ton profil : c'est ce qui permet à ton coach de construire ton suivi.": "Start by filling in your profile: it's what lets your coach build your plan.",
"Commencer ton défi": "Start your challenge",
"Commencer ton rééquilibrage alimentaire": "Start rebalancing your diet",
"Comment faire ?": "How to do it",
"Compléments alimentaires actuels": "Supplements you currently take",
"Compléter mon profil": "Complete my profile",
"Comprendre et utiliser les outils pour ta transformation": "Understand and use the tools for your transformation",
"Confirme le nouveau": "Confirm the new one",
"Confirme.": "Confirm.",
"Connexion à ton espace": "Log in to your space",
"Copier ma sauvegarde": "Copy my backup",
"Courbe de poids": "Weight curve",
"Courbes de mensurations": "Measurement curves",
"Crustacés": "Crustaceans",
"Créatine monohydrate": "Creatine monohydrate",
"Cuisse": "Thigh",
"Cuisse droite": "Right thigh",
"Cuisse gauche": "Left thigh",
"Céleri": "Celery",
"Date de départ": "Start date",
"Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies.": "Meals built around your calories and macros, with everyday foods — and that respect your diet and your allergies.",
"Dimanche": "Sunday",
"Dos, genoux, épaules, hernies, opérations… précise l'année et l'état actuel.": "Back, knees, shoulders, hernias, surgeries… tell me the year and how it is now.",
"Douleurs ou limitations sur certains mouvements": "Pain or limits on certain movements",
"Durée maximum par séance": "Maximum time per workout",
"Décris ton objectif en une phrase, avec un chiffre si possible": "Describe your goal in one sentence, with a number if you can",
"Décris une journée type de repas *": "Describe a typical day of eating *",
"Déjeuner": "Lunch",
"Dîner": "Dinner",
"Eau par jour (L)": "Water per day (L)",
"Enfants, vie de couple, horaires imposés…": "Kids, relationship, fixed schedules…",
"Ennui, stress, fatigue, soir devant un écran, après le travail…": "Boredom, stress, tiredness, evenings in front of a screen, after work…",
"Enregistre au moins deux semaines pour voir la courbe.": "Save at least two weeks to see the curve.",
"Enregistrer la semaine": "Save this week",
"Enregistrer mon profil": "Save my profile",
"Envoyer tes photos avant / après (premier et dernier jour)": "Send your before / after photos (first and last day)",
"Envoyer ton retour d'expérience": "Send your feedback",
"Envoyer ton tableau de mensurations": "Send your measurement chart",
"Es-tu suivi actuellement par un professionnel de santé ?": "Are you currently seeing a health professional?",
"Exercices ou types de séances que tu détestes / que tu adores": "Exercises or types of workouts you hate / love",
"Extérieur": "Outdoors",
"Facultatif, et aucune obligation de détailler. Cela me permet simplement d'adapter mon approche et, si besoin, de t'orienter vers un professionnel de santé.": "Optional, and you don't have to go into detail. It just helps me adapt my approach and, if needed, point you to a health professional.",
"Fais-tu du cardio ? Lequel, combien de fois par semaine ?": "Do you do cardio? What kind, and how many times a week?",
"Femme": "Female",
"Frais / crèmerie": "Fresh / dairy",
"Fruits et légumes": "Produce",
"Fruits à coque": "Tree nuts",
"Fumes-tu ?": "Do you smoke?",
"Fuseau horaire": "Time zone",
"Féculents et pain": "Starches and bread",
"Glucides": "Carbs",
"Grignotage : quand et pourquoi ?": "Snacking: when and why?",
"Hanches": "Hips",
"Heure de coucher": "Bedtime",
"Heure de lever": "Wake-up time",
"Heures de sommeil / nuit": "Hours of sleep per night",
"Homme": "Male",
"Horaires, déplacements, poste sédentaire ou physique.": "Hours, commute, desk job or physical job.",
"Ingrédients": "Ingredients",
"Je suis sur iPhone": "I'm on iPhone",
"Jeudi": "Thursday",
"La journée type": "Your sample day",
"Lait": "Milk",
"Lancer ta première séance": "Start your first workout",
"Le matin à jeun, mètre bien à plat, sans serrer.": "In the morning on an empty stomach, tape flat, without pulling tight.",
"Le processus, étape par étape": "The process, step by step",
"Le programme": "Your program",
"Les compléments": "Your supplements",
"Les grammages sont donnés crus, sauf mention contraire. Si un plat ne te convient pas, dis-le à ton coach : il le remplacera sans changer tes macros.": "Weights are given raw unless stated otherwise. If a dish doesn't work for you, tell your coach: they'll swap it without changing your macros.",
"Les poids sont ceux qui entrent dans les recettes — crus pour la viande, le poisson et les féculents. Prévois un peu plus pour les pertes à la cuisson.": "These are the weights used in the recipes — raw for meat, fish and starches. Buy a little extra for cooking losses.",
"Les questions marquées d'une étoile sont indispensables. Tu peux revenir modifier tes réponses à tout moment.": "Questions marked with an asterisk are required. You can come back and change your answers at any time.",
"Les séances construites pour toi : les exercices, les séries, les répétitions et les temps de repos.": "Workouts built for you: the exercises, sets, reps and rest times.",
"Lipides": "Fat",
"Lire la vidéo": "Play the video",
"Liste de courses": "Grocery list",
"Lundi": "Monday",
"Ma formation": "My course",
"Mardi": "Tuesday",
"Mensurations": "Measurements",
"Mensurations (cm)": "Measurements (cm)",
"Mensurations du jour (cm)": "Today's measurements (cm)",
"Mercredi": "Wednesday",
"Mes compléments": "My supplements",
"Mes données": "My data",
"Mes repas": "My meals",
"Mesure toujours au même endroit, le matin, à jeun, sans tirer sur le mètre. La régularité compte plus que la précision absolue.": "Always measure at the same spot, in the morning, on an empty stomach, without pulling the tape. Consistency matters more than perfect precision.",
"Mets MHX Coaching sur ton écran d'accueil": "Add MHX Coaching to your home screen",
"Mollet": "Calf",
"Mollusques": "Mollusks",
"Mon compte": "My account",
"Mon profil": "My profile",
"Mon programme": "My program",
"Mot de passe": "Password",
"Mot de passe actuel": "Current password",
"Mot de passe oublié": "Forgot password",
"Mot de passe oublié ?": "Forgot your password?",
"Mot du coach": "Note from your coach",
"Médecin, kiné, nutritionniste, psychologue…": "Doctor, physical therapist, nutritionist, psychologist…",
"Niveau d'énergie dans la journée": "Energy level during the day",
"Niveau de stress au quotidien": "Day-to-day stress level",
"Nombre de pas moyen par jour (si tu le suis)": "Average steps per day (if you track them)",
"Non": "No",
"Nouveau mot de passe": "New password",
"Nouvelle adresse": "New email",
"Nouvelle mesure": "New measurement",
"Numéro WhatsApp (avec indicatif)": "WhatsApp number (with country code)",
"Occasionnellement": "Occasionally",
"Oui": "Yes",
"Oui, envoyées": "Yes, sent",
"Oui, quotidiennement": "Yes, daily",
"Outils": "Tools",
"Ouvre le menu de ton navigateur — les trois points en haut à droite.": "Open your browser menu — the three dots at the top right.",
"Où tu en es": "Where you're at",
"Où vas-tu t'entraîner ? *": "Where will you train? *",
"Paléo": "Paleo",
"Pas encore": "Not yet",
"Pas encore de mesure": "No measurement yet",
"Pense à télécharger tes données avant, si tu veux les garder.": "Remember to download your data first if you want to keep it.",
"Performance / condition physique": "Performance / fitness",
"Perte de poids / sèche": "Weight loss / cutting",
"Pescétarien": "Pescatarian",
"Petit-déjeuner": "Breakfast",
"Photos de départ envoyées ?": "Starting photos sent?",
"Plus tard": "Later",
"Poids": "Weight",
"Poids (kg)": "Weight (kg)",
"Poids actuel": "Current weight",
"Poids actuel (kg) *": "Current weight (kg) *",
"Poids de départ (kg)": "Starting weight (kg)",
"Poids objectif (kg)": "Goal weight (kg)",
"Poissons": "Fish",
"Poissons et fruits de mer": "Fish and seafood",
"Poitrine": "Chest",
"Pour les femmes : cycle régulier ? Grossesse, post-partum ou contraception à prendre en compte ?": "For women: regular cycle? Pregnancy, postpartum or birth control to take into account?",
"Pourquoi maintenant ? Qu'est-ce qui a déclenché ta décision ?": "Why now? What made you decide?",
"Prendre ton poids, tes mensurations et tes photos (face, dos, profil)": "Take your weight, measurements and photos (front, back, side)",
"Prise de muscle": "Muscle gain",
"Problèmes de santé, pathologies ou traitements médicaux en cours": "Health issues, conditions or current medical treatments",
"Protéine whey": "Whey protein",
"Protéines": "Protein",
"Prénom et nom *": "First and last name *",
"Préparation": "Prep",
"Qu'est-ce qui t'a fait échouer par le passé, selon toi ?": "What do you think made you fail in the past?",
"Qualité de ton sommeil": "Sleep quality",
"Que fais-tu comme activité physique actuellement ?": "What physical activity do you do right now?",
"Quel est ton niveau ? *": "What's your level? *",
"Quel est ton objectif principal ? *": "What's your main goal? *",
"Quels jours et à quel moment de la journée ?": "Which days and what time of day?",
"Qui cuisine ? Combien de temps peux-tu y consacrer par jour ?": "Who cooks? How much time can you spend on it each day?",
"Recevoir le lien": "Send me the link",
"Recomposition (perdre du gras + prendre du muscle)": "Recomp (lose fat + build muscle)",
"Renommer les zones que tu mesures": "Rename the areas you measure",
"Reprendre poids et mensurations chaque semaine": "Take your weight and measurements again every week",
"Restaurer une sauvegarde": "Restore a backup",
"Rester connecté": "Stay logged in",
"Retour à la connexion": "Back to login",
"Réviser le module concerné en cas de difficulté": "Review the related module if you get stuck",
"Salle basique": "Basic gym",
"Salle complète": "Full gym",
"Samedi": "Saturday",
"Sans gluten": "Gluten-free",
"Sans lactose": "Lactose-free",
"Sans porc ni alcool": "No pork, no alcohol",
"Santé & énergie au quotidien": "Everyday health & energy",
"Se connecter": "Log in",
"Se déconnecter": "Log out",
"Semaine": "Week",
"Semaines suivies": "Weeks tracked",
"Sert à composer tes repas : aucun plat proposé ne sortira de ce cadre.": "Used to build your meals: no dish will ever step outside these limits.",
"Sexe *": "Sex *",
"Si oui, précise": "If yes, please specify",
"Si à la maison : quel matériel as-tu ?": "If at home: what equipment do you have?",
"Situation familiale et contraintes horaires": "Family situation and schedule constraints",
"Sodas, jus par jour": "Sodas, juices per day",
"Soja": "Soy",
"Source principale de ce stress": "Main source of this stress",
"Squat, développé, tractions, course, amplitude d'épaule…": "Squat, bench press, pull-ups, running, shoulder mobility…",
"Suivi des mensurations": "Measurement tracking",
"Supprimer mon compte": "Delete my account",
"Sésame": "Sesame",
"Ta formation complète : les vidéos, les guides et tes outils de suivi. Ce que tu coches ici reste enregistré.": "Your full course: videos, guides and your tracking tools. What you check here stays saved.",
"Taille": "Waist",
"Taille (cm) *": "Height (cm) *",
"Tes habitudes et ta routine sont installées": "Your habits and routine are in place",
"Ton coach n'a pas encore déposé ton programme. Tu recevras un message quand il sera prêt.": "Your coach hasn't uploaded your program yet. You'll get a message when it's ready.",
"Ton coach n'a pas encore validé tes repas. Remplis ton profil — régime et allergies comprises — pour qu'il puisse les préparer.": "Your coach hasn't approved your meals yet. Fill in your profile — including your diet and allergies — so they can prepare them.",
"Ton coach ne t'a pas prescrit de complément. C'est une bonne nouvelle : rien ne remplace tes repas.": "Your coach hasn't prescribed any supplements. That's good news: nothing replaces your meals.",
"Ton entourage va-t-il soutenir ta démarche ou la compliquer ?": "Will the people around you support your journey or make it harder?",
"Ton métier et ton rythme de travail": "Your job and work schedule",
"Ton parcours": "Your journey",
"Ton poids et tes tours de taille semaine après semaine. Les courbes se tracent toutes seules à partir de ce que tu saisis.": "Your weight and measurements, week after week. The curves draw themselves from what you enter.",
"Ton point de départ": "Your starting point",
"Ton profil": "Your profile",
"Ton profil, tes mensurations, ton programme, tes repas et ta progression de formation seront effacés. Ton coach n'y aura plus accès non plus.": "Your profile, measurements, program, meals and course progress will be erased. Your coach won't have access to them anymore either.",
"Ton profil, tes mensurations, ton programme, tes repas et ta progression de formation seront effacés. Ton coach n'y aura plus accès non plus. <b>C'est définitif : il n'y a pas de corbeille.</b>": "Your profile, measurements, program, meals and course progress will be erased. Your coach won't have access to them anymore either. <b>This is permanent: there's no trash to restore from.</b>",
"Ton régime alimentaire *": "Your diet *",
"Tout ce que la liste ci-dessus ne couvre pas. Ton coach en tient compte avant de valider tes repas.": "Anything the list above doesn't cover. Your coach takes it into account before approving your meals.",
"Tout est enregistré dans ton compte : tu retrouves tes données sur n'importe quel appareil en te connectant. Tu peux récupérer quand tu veux une copie de tes saisies et de tes accords (tes photos et ton historique de connexion : sur demande à ton coach), et demander leur effacement.": "Everything is saved to your account: log in on any device to find your data. You can get a copy of your entries and your consents whenever you want (your photos and login history: on request to your coach), and ask for them to be deleted.",
"Toutes tes mesures": "All your measurements",
"Tu fais des points réguliers et tu observes des résultats": "You check in regularly and you're seeing results",
"Tu l'ouvres d'un doigt, elle s'affiche en plein écran, et tu n'as plus à retenir l'adresse.": "You open it with one tap, it goes full screen, and you don't have to remember the address.",
"Type, fréquence, depuis quand.": "Type, how often, since when.",
"Télécharger toutes mes données": "Download all my data",
"Un complément ne rattrape pas une alimentation qui ne va pas : commence toujours par tes repas. Si tu prends un traitement, si tu es enceinte ou si tu as une pathologie, demande à ton médecin avant d'en ajouter un — certains interagissent avec des médicaments. Ton coach n'est pas médecin.": "A supplement won't make up for a diet that isn't working: always start with your meals. If you take medication, are pregnant or have a health condition, ask your doctor before adding one — some interact with medications. Your coach is not a doctor.",
"Un lien de confirmation part sur la nouvelle adresse (et, par sécurité, un autre sur l'ancienne : clique les deux). Tant que ce n'est pas fait, tu continues de te connecter avec l'ancienne — c'est ce qui t'évite de perdre ton compte en cas de faute de frappe.": "A confirmation link is sent to the new address (and, for security, another one to the old address: click both). Until then, you keep signing in with the old one — that keeps you from losing your account because of a typo.",
"Un lien de confirmation part sur {e}, et par sécurité un autre sur ton adresse actuelle : clique les deux. Le changement est fait au dernier clic.": "A confirmation link is on its way to {e}, and for security another one to your current address: click both. The change is done on the last click.",
"Pour changer ton adresse email, écris-nous à {e}, on s'en occupe rapidement.": "To change your email address, write to us at {e}, we'll take care of it quickly.",   /* v52 : aucun email envoyé par l'app */
"Une question ?": "Questions?",
"Vacances, mariage, compétition, shooting.": "Vacation, wedding, competition, photo shoot.",
"Variation de poids": "Weight change",
"Vendredi": "Friday",
"Ventre": "Belly",
"Ville / Pays": "City / Country",
"Voir la démonstration →": "Watch the demo →",
"Végétalien (vegan)": "Vegan",
"Végétarien": "Vegetarian",
"Y a-t-il un antécédent de trouble du comportement alimentaire, ou une relation compliquée avec la nourriture, dont je dois tenir compte ?": "Is there any history of eating disorders, or a complicated relationship with food, that I should take into account?",
"Y a-t-il une échéance précise ?": "Is there a specific deadline?",
"aujourd'hui.": "today.",
"compté dans tes repas": "counted in your meals",
"depuis le départ": "since the start",
"g gluc.": "g carbs",
"g lip.": "g fat",
"g prot.": "g protein",
"kcal": "Cal",
"kcal prévus": "Cal planned",
"mangé": "eaten",
"ou": "or",
"repos": "rest",
"séries": "sets",
"toutes zones cumulées": "all areas combined",
"« Ajouter à l'écran d'accueil »": "“Add to Home Screen”",
"« Installer l'application »": "“Install app”",
"À envoyer par WhatsApp : face, profil, dos — tenue ajustée, même lumière, même endroit. Elles servent uniquement au suivi et ne sont jamais publiées sans ton accord écrit.": "Send them on WhatsApp: front, side, back — fitted clothes, same light, same spot. They're only used to track your progress and are never shared without your written consent.",
"À la maison": "At home",
"À quel moment de la journée as-tu tes coups de barre ?": "What time of day do you hit an energy slump?",
"À quel point es-tu prêt à changer tes habitudes ?": "How ready are you to change your habits?",
"À quels horaires ?": "At what times?",
"Âge *": "Age *",
"Écrire à mon coach": "Message my coach",
"Écris directement à ton coach :": "Message your coach directly:",
"Épicerie": "Pantry",
"Évolution des mensurations semaine par semaine": "Measurements week by week",
"Évolution du poids semaine par semaine": "Weight week by week",
/* v53 — chantier 3 (feedback du dimanche) : ses traductions ici */
"Ton bilan de la semaine du {a} au {b} n'est pas encore fait : tu as jusqu'à {j} soir.": "Your check-in for the week of {a} to {b} isn't done yet: you have until {j} evening.",
"Feedback de la semaine": "Weekly feedback",
"C'est dimanche : ton feedback de la semaine t'attend (2 minutes)": "It's Sunday: your weekly feedback is waiting for you (2 minutes)",
"Une note sur 10 et trois lignes : ton coach te répond au même endroit.": "A score out of 10 and three lines: your coach replies in the same place.",
"Ton feedback de la semaine du {a} au {b} n'a pas été fait.": "Your feedback for the week of {a} to {b} wasn't done.",
"Tu peux encore le faire aujourd'hui.": "You can still do it today.",
"Feedback de la semaine envoyé": "Weekly feedback sent",
"le {d} — ton coach te répond au même endroit, dans Mon suivi": "on {d} — your coach replies in the same place, in My follow-up",
"Prochain feedback : dimanche {d}": "Next feedback: Sunday {d}",
"Selon toi, comment as-tu travaillé cette semaine ?": "How well do you think you worked this week?",
"1 = très mal · 10 = parfaitement": "1 = very poorly · 10 = perfectly",
"{n} sur 10": "{n} out of 10",
"Alimentation": "Nutrition",
"Autre": "Other",
"Tes séances, ta forme, tes charges…": "Your workouts, how you felt, your weights…",
"Tes repas, tes écarts, ta faim…": "Your meals, your slip-ups, your hunger…",
"Sommeil, stress, moral, une question…": "Sleep, stress, mood, a question…",
"La note est obligatoire ; les trois cases sont facultatives.": "The score is required; the three boxes are optional.",
"Envoyer mon feedback": "Send my feedback",
"Mettre à jour mon feedback": "Update my feedback",
"Modifier mon feedback": "Edit my feedback",
"Choisis ta note, de 1 à 10.": "Pick your score, from 1 to 10.",
"Feedback envoyé. Ton coach te répond ici, juste en dessous.": "Feedback sent. Your coach replies here, right below.",
/* v59 — le mot affiché pendant l'envoi du feedback (celui du bilan du vendredi : avec ses textes ; pas « Envoi… », c'est celui des photos) */
"Envoi de ton feedback…": "Sending your feedback…",
"Réponds simplement, avec tes mots : ton coach te répond juste en dessous.": "Answer simply, in your own words: your coach replies right below.",
"Note de la semaine": "Score for the week",
"Aucune réponse lisible.": "No readable answer.",
"Réponse de ton coach": "Your coach's reply",
"Ton coach n'a pas encore répondu.": "Your coach hasn't replied yet.",
"Cette réponse t'a aidé ?": "Did this reply help you?",
"Pas vraiment": "Not really",
"Moyen": "So-so",
"Qu'est-ce qui ne t'a pas plu ?": "What didn't you like?",
"Qu'est-ce que je peux améliorer pour toi ?": "What can I improve for you?",
"Envoyer": "Send",
"Merci, c'est noté.": "Thanks, noted.",
"Merci, ton coach le verra.": "Thanks, your coach will see it.",
"Pas encore de feedback pour cette semaine.": "No feedback for this week yet.",
"Ton premier feedback arrive dimanche : une note sur 10 et trois lignes.": "Your first feedback is on Sunday: a score out of 10 and three lines.",
"en retard": "late",
"Mes feedbacks précédents": "My previous feedback",
"note {n}/10": "score {n}/10",
"pas de feedback envoyé": "no feedback sent",
"réponse du coach": "coach's reply",
"Ton coach a répondu": "Your coach replied",
"Semaine du {a} au {b} : sa réponse t'attend dans Mon suivi.": "Week of {a} to {b}: their reply is waiting in My follow-up.",
"Œufs": "Eggs",
"— choisis —": "— choose —",
"▶ Voir la présentation de la formation": "▶ Watch the course intro",
"1 = très faible · 10 = maximum": "1 = very low · 10 = maximum",
"1 · Identité & logistique": "1 · Identity & logistics",
"2 repas": "2 meals",
"3 repas": "3 meals",
"2 · Ton objectif": "2 · Your goal",
"3 · Santé & antécédents": "3 · Health & history",
"4 repas (3 + une collation)": "4 meals (3 + 1 snack)",
"4 zones maximum à l'écran — au-delà les courbes deviennent illisibles.": "4 areas max on screen — beyond that the curves become unreadable.",
"4 · Pratique sportive": "4 · Training",
"5 repas (3 + deux collations)": "5 meals (3 + 2 snacks)",
"5 · Alimentation": "5 · Nutrition",
"6 repas (3 + trois collations)": "6 meals (3 + 3 snacks)",
"6 · Mode de vie": "6 · Lifestyle",
"8-10/jambe": "8-10/leg",
"Avancé (2 ans et +)": "Advanced (2+ years)",
"Commence par ton poids du jour : c'est ta semaine 1, et la base de ta courbe.": "Start with today's weight: it's your week 1, and the base of your curve.",
"Demandé uniquement pour le calcul du métabolisme de base : la formule de référence donne un résultat différent d'environ 160 kcal par jour.": "Only used to calculate your basal metabolic rate: the reference formula gives a result about 160 Cal a day different.",
"Débutant (0 à 6 mois)": "Beginner (0 to 6 months)",
"Ex : perdre 8 kg d'ici décembre, tenir 10 tractions, retrouver de l'énergie l'après-midi.": "E.g.: lose 8 kg by December, do 10 pull-ups, get my afternoon energy back.",
"Intermédiaire (6 mois à 2 ans)": "Intermediate (6 months to 2 years)",
"Petit-déjeuner, déjeuner, dîner, collations, boissons — avec les quantités approximatives. C'est la question la plus importante du questionnaire : prends 5 minutes dessus.": "Breakfast, lunch, dinner, snacks, drinks — with rough amounts. This is the most important question in the questionnaire: take 5 minutes on it.",
"Plus tes réponses sont précises, plus ton programme sera adapté. Ne cherche pas la bonne réponse : cherche la vraie. Compte 10 à 15 minutes.": "The more precise your answers, the better your program will fit you. Don't look for the right answer: look for the true one. Allow 10 to 15 minutes.",
"Protéine, créatine, vitamines, oméga 3…": "Protein, creatine, vitamins, omega-3…",
"Sois réaliste : mieux vaut 3 séances tenues que 5 prévues et 2 faites.": "Be realistic: 3 workouts you actually do beat 5 planned and 2 done.",
"Choisir un défi dans le module 5": "Pick a challenge in module 5",
"Comprendre et valider les étapes du module 2": "Understand and complete the steps of module 2",
"Comprendre, valider les étapes et choisir son entraînement dans le module 3": "Understand, complete the steps and pick your workout plan in module 3",
"Faire un bilan écrit toutes les 4 semaines : discipline, performances, points forts et points faibles": "Write a check-in every 4 weeks: discipline, performance, strengths and weaknesses",
"Module 2 — L'alimentation": "Module 2 — Nutrition",
"Module 3 — L'entraînement": "Module 3 — Training",
"Module 4 — L'organisation": "Module 4 — Organization",
"Module 5 — Les challenges": "Module 5 — Challenges",
"Module 6 — Accélérateurs et ressources": "Module 6 — Boosters and resources",
"Noter ta progression tous les 7 jours": "Log your progress every 7 days",
"Noter ta progression tous les 7 jours, et ton ressenti de fin de semaine": "Log your progress every 7 days, and how you feel at the end of the week",
"Prendre des photos toutes les 4 semaines (face, dos, profil)": "Take photos every 4 weeks (front, back, side)",
"Regarder la vidéo de présentation et valider le module 0": "Watch the intro video and complete module 0",
"Remplir toutes les informations du module 4": "Fill in all the information in module 4",
"Une méthode simple pour poser les bases en 14 jours : ton alimentation, ton entraînement et tes habitudes, sans programme complexe ni séance interminable. Conçue pour les personnes occupées : le plan s'intègre dans ta routine, entre le travail et la famille.": "A simple method to lay the foundations in 14 days: your nutrition, your training and your habits, with no complicated program or endless workouts. Built for busy people: the plan fits into your routine, between work and family.",
"Valider toutes les étapes du module 1 sur le mindset": "Complete all the steps of module 1 on mindset",
"Étape 1 — Poser les bases de ta transformation": "Step 1 — Lay the foundations of your transformation",
"Étape 2 — Passer à l'action": "Step 2 — Take action",
"Étape 3 — Renforcer tes habitudes": "Step 3 — Strengthen your habits",
"Étape 4 — Continuer": "Step 4 — Keep going",
"Étape 5 — Célébrer tes succès": "Step 5 — Celebrate your wins",
"C'est déjà ton adresse actuelle.": "That's already your current email.",
"Ce n'est pas le mot attendu : rien n'a été supprimé.": "That's not the expected word: nothing was deleted.",
"Cette sauvegarde n'est pas lisible.": "This backup can't be read.",
"Copie impossible sur ce navigateur.": "Copying isn't possible in this browser.",
"Enregistrement impossible.": "Couldn't save.",
"Enregistrement…": "Saving…",
"Enregistrer": "Save",
"Export impossible pour le moment.": "Export isn't possible right now.",
"Fichier téléchargé.": "File downloaded.",
"Indique ton email.": "Enter your email.",
"Indique un numéro de semaine.": "Enter a week number.",
"Indique une adresse valide.": "Enter a valid email.",
"Le mot de passe doit faire au moins 6 caractères.": "Password must be at least 6 characters.",
"Le mot de passe doit faire au moins 8 caractères.": "Password must be at least 8 characters.",
"Le nouveau mot de passe doit faire au moins 6 caractères.": "The new password must be at least 6 characters.",
"Le nouveau mot de passe est le même que l'ancien.": "The new password is the same as the old one.",
"Les deux mots de passe ne sont pas identiques.": "The two passwords don't match.",
"Les deux nouveaux mots de passe ne sont pas identiques.": "The two new passwords don't match.",
"Masquer": "Hide",
"Mot de passe changé. Utilise le nouveau à ta prochaine connexion.": "Password changed. Use the new one next time you log in.",
"Mot de passe enregistré. Tu peux te connecter.": "Password saved. You can log in now.",
"Numéro de semaine invalide.": "Invalid week number.",
"Poids entre 30 et 300 kg, vérifie la virgule.": "Weight must be between 30 and 300 kg — check the decimal point.",
"Profil enregistré. Ton coach le voit de son côté.": "Profile saved. Your coach can see it on their side.",
"Remplis les trois champs.": "Fill in all three fields.",
"Renseigne au moins ton poids ou une mensuration.": "Enter at least your weight or one measurement.",
"Sauvegarde copiée. Colle-la dans une note.": "Backup copied. Paste it into a note.",
"Sauvegarde restaurée.": "Backup restored.",
"Restauration incomplète : vérifie ta connexion, puis recommence.": "Restore incomplete: check your connection, then try again.",
"Rien à restaurer dans cette sauvegarde : ces rubriques sont gérées par ton coach.": "Nothing to restore in this backup: these sections are managed by your coach.",
"Ces rubriques seront remplacées par la sauvegarde : {l}.": "These sections will be replaced by the backup: {l}.",
"Ce que tu as saisi depuis cette copie sera remplacé.": "What you entered since this copy will be replaced.",
"Si un compte existe pour cet email, tu vas recevoir un lien.": "If an account exists for this email, you'll receive a link.",
"Suppression…": "Deleting…",
"Supprimer": "Delete",
"Un instant…": "One moment…",
"Supprimer définitivement ton compte et toutes tes données ?\n\nCette action ne peut pas être annulée.": "Permanently delete your account and all your data?\n\nThis can't be undone.",
"Pour confirmer, écris SUPPRIMER en majuscules :": "To confirm, type DELETE in capital letters:",
"Ton compte est supprimé. Merci d'avoir utilisé l'application.": "Your account has been deleted. Thanks for using the app.",
"Colle ici la sauvegarde que tu avais copiée :": "Paste the backup you copied here:",
"La semaine {n} existe déjà. La remplacer ?": "Week {n} already exists. Replace it?",
/* v67 (audit du 01/10, D6) : la croix d'une ligne de « Toutes tes mesures » demande d'abord */
"Supprimer la semaine {n} ? Cette mesure sera effacée.": "Delete week {n}? This measurement will be erased.", "Oui, supprimer": "Yes, delete",
"Email ou mot de passe incorrect.": "Incorrect email or password.",
"Une erreur est survenue.": "Something went wrong.",
"Plateforme MHX Coaching": "MHX Coaching Platform",
"Hors ligne": "Offline",
"Hors ligne — gardé sur cet appareil, renvoi automatique": "Offline — kept on this device, will resend automatically",
"Non enregistré — modification refusée": "Not saved — change refused",
"Hors ligne — modification non enregistrée": "Offline — change not saved",
"Hors ligne — gardé dans cet onglet seulement : ne le ferme pas": "Offline — kept in this tab only: don't close it",
"Non enregistré : la base a refusé cette modification. Préviens ton coach.": "Not saved: the server refused this change. Let your coach know.",
"Une modification faite hors ligne n'a pas été envoyée ({o}, {d}) : une version plus récente existe déjà.": "A change made offline was not sent ({o}, {d}): a newer version already exists.",
"Des modifications n'ont pas encore pu être envoyées (hors ligne). Si tu te déconnectes maintenant, elles seront perdues.": "Some changes could not be sent yet (offline). If you log out now, they will be lost.",
"Me déconnecter quand même": "Log out anyway",
"Des modifications refusées par la base sont encore gardées sur cet appareil. Si tu te déconnectes maintenant, elles seront perdues.": "Some changes refused by the server are still kept on this device. If you log out now, they will be lost.",
"Des modifications n'ont pas encore pu être envoyées (hors ligne), et d'autres, refusées par la base, sont encore gardées sur cet appareil. Si tu te déconnectes maintenant, elles seront perdues.": "Some changes could not be sent yet (offline), and others, refused by the server, are still kept on this device. If you log out now, they will be lost.",
"Ta session a pris fin (déconnexion depuis un autre appareil ?). Ce qui est à l'écran reste là : copie ton texte si besoin, puis reconnecte-toi. Ce que tu avais saisi avant est gardé sur cet appareil et repartira ; ce que tu saisis maintenant n'est plus enregistré.": "Your session has ended (logged out from another device?). What is on screen stays there: copy your text if needed, then sign in again. What you entered before is kept on this device and will be sent; what you enter now is no longer saved.",
"Me reconnecter": "Sign in again",
"Reconnecte-toi : ce que tu avais saisi est gardé sur cet appareil et repartira.": "Sign in again: what you entered is kept on this device and will be sent.",
"fiche d'un client": "a client's file",
"Enregistré": "Saved",
"Voir": "Show",
"Exécution": "How to do it",
"Erreurs fréquentes": "Common mistakes",
"Respiration :": "Breathing:",
"Aucune fiche pour cet exercice. Demande à ton coach.": "No guide for this exercise yet. Ask your coach.",
"▶ Voir la démonstration": "▶ Watch the demo",
"Voir la démonstration": "Watch the demo",
"Démonstration": "Demo",
"Vidéo hébergée sur YouTube, d'une chaîne tierce. Elle s'ouvre ici, sans quitter ton espace.": "Video hosted on YouTube, from a third-party channel. It opens right here, without leaving your space.",
"Séance": "Workout",
"Abdominaux": "Abs",
"Dos": "Back",
"Fessiers": "Glutes",
"Ischios": "Hamstrings",
"Mobilité": "Mobility",
"Mollets": "Calves",
"Pectoraux": "Chest",
"Quadriceps": "Quads",
"Épaules": "Shoulders",
"Aucun": "None",
"Banc": "Bench",
"Barre": "Barbell",
"Barre de traction": "Pull-up bar",
"Barre et banc": "Barbell and bench",
"Haltères": "Dumbbells",
"Poulie": "Cable",
"Élastique": "Resistance band",
"Avancé": "Advanced",
"Débutant": "Beginner",
"Intermédiaire": "Intermediate",
"Abdominaux profonds": "Deep core",
"Adducteurs": "Adductors",
"Avant-bras": "Forearms",
"Biceps (longue portion)": "Biceps (long head)",
"Brachial": "Brachialis",
"Chaîne postérieure": "Posterior chain",
"Deltoïdes": "Delts",
"Deltoïdes latéraux": "Side delts",
"Deltoïdes postérieurs": "Rear delts",
"Diaphragme": "Diaphragm",
"Dorsaux": "Lats",
"Fléchisseurs de hanche": "Hip flexors",
"Gastrocnémiens": "Gastrocnemius",
"Grands droits": "Rectus abdominis",
"Haut des pectoraux": "Upper chest",
"Lombaires": "Lower back",
"Moyen fessier": "Glute medius",
"Pectoraux (haut)": "Upper chest",
"Petit fessier": "Glute minimus",
"Péroniers": "Peroneals",
"Rhomboïdes": "Rhomboids",
"Rotateurs": "Rotator cuff",
"Rotateurs du tronc": "Trunk rotators",
"Rotateurs externes": "External rotators",
"Soléaire": "Soleus",
"Trapèzes": "Traps",
"Trapèzes inférieurs": "Lower traps",
"Trapèzes moyens": "Middle traps",
"Trapèzes supérieurs": "Upper traps",
"Triceps (longue portion)": "Triceps (long head)",
"Épaules antérieures": "Front delts",
"regulier": "steady",
/* v33 — fenetres, theme, etats */
"Annuler": "Cancel",
"Confirmer": "Confirm",
"Valider": "Validate",
"OK": "OK",
"Continuer": "Continue",
"Supprimer définitivement": "Delete permanently",
"Restaurer": "Restore",
"Oui, remplacer": "Yes, replace",
"Remettre": "Restore",
"Charger": "Load",
"Ajouter": "Add",
"Effacer": "Clear",
"Fermer": "Close",
"Passer en sombre": "Switch to dark mode",
"Passer en clair": "Switch to light mode",
"Cette fonctionnalité est disponible avec l'accompagnement MHX.": "This feature is available with MHX coaching.",
"verrouillé": "locked", "Réserver mon bilan": "Book my assessment",
/* v34 — navigation et accueil */
"Accueil": "Home", "Nutrition": "Nutrition", "Ma progression": "My progress", "Sa progression": "Their progress",
"Speed Formation": "Speed Formation", "Profil": "Profile", "Plus": "More", "Tout mon espace": "My whole space", "Retour à l'accueil": "Back to home",
/* v70 : « Partager l'app » */
"Partager l'app": "Share the app", "Lien copié !": "Link copied!", "Copie ce lien :": "Copy this link:",
"Envoie le lien de l'app à un proche : l'espace gratuit est ouvert à tout le monde.": "Send the app link to someone you know: the free space is open to everyone.",
"Rejoins-moi sur l'app MHX Coaching : calculateur de calories, suivi du poids et Speed Formation, gratuit.": "Join me on the MHX Coaching app: calorie calculator, weight tracking and Speed Formation, free.",
"Programme": "Program", "Progression": "Progress", "Bilan": "Review", "Compléments": "Supplements", "Formation": "Course",
"Bonjour": "Hello", "Vue d'ensemble": "Overview", "Cette semaine": "This week", "Aujourd'hui": "Today",
"Sa semaine en un coup d'œil.": "Their week at a glance.",
"Ton coach prépare ton programme et tes repas. En attendant, ta formation t'attend.": "Your coach is preparing your program and your meals. In the meantime, your course is waiting for you.",
"{a} séance sur {b}": "{a} workout out of {b}", "{a} séances sur {b}": "{a} workouts out of {b}",
"{a} repas cochés sur {b}": "{a} meals checked out of {b}",
" : régularité {n}/100 cette semaine.": " — consistency {n}/100 this week.",
"Une nouvelle semaine commence : à toi de jouer.": "A new week starts: it's your move.",
"Régularité": "Consistency", "Entraînement": "Training", "Objectifs": "Goals",
"semaine dernière : {n}": "last week: {n}", "semaine {n}": "week {n}", "depuis la mesure d'avant": "since the previous entry",
"aucune mesure": "no entry yet", "séances notées": "workouts logged", "repas respectés": "meals on plan", "ce mois-ci": "this month",
"Séance {n}": "Workout {n}", "Toutes tes séances de la semaine sont notées": "All your workouts this week are logged",
"Bravo. Revoir mon programme": "Well done. Back to my program", "Mes repas du jour": "Today's meals",
"{a} sur {b} cochés aujourd'hui": "{a} of {b} checked today", "Mesure de la semaine faite": "This week's entry is done",
"Voir ma progression": "See my progress", "Ma mesure de la semaine": "My weekly entry", "Poids et tours de taille, à jeun": "Weight and measurements, fasted",
"C'est ce qui permet à ton coach de construire ton suivi": "This is what lets your coach build your follow-up",
"Commencer la Speed Formation": "Start the Speed Formation", "Les bases, à ton rythme": "The basics, at your pace",
"La régularité mesure ce que tu fais — séances, repas, mesure — pas ce que dit la balance.": "Consistency measures what you do — workouts, meals, weekly entry — not what the scale says.",
"Tes objectifs du mois": "Your goals this month", "Atteint": "Reached", "En cours": "In progress", "Cocher mes objectifs": "Tick my goals",
"Mon bilan": "My review", "Tes quatre dernières semaines : régularité, poids, ce qui a bougé et la progression de tes charges.": "Your last four weeks: consistency, weight, what changed and how your loads progressed.",
"Voir mon bilan du mois": "See my monthly review",
/* v35 — programme, nutrition, progression, suivi */
"Mon suivi": "My follow-up", "Son suivi": "Their follow-up", "Suivi": "Follow-up", "Ton suivi": "Your follow-up",
"Comment se passe ton accompagnement : ta régularité, tes objectifs du mois et ton bilan des quatre dernières semaines.": "How your coaching is going: your consistency, your goals for the month and your review of the last four weeks.",
"Ta régularité": "Your consistency", "Training": "Training", "dans Ma progression": "in My progress", "en cours": "current",
"Régularité des cinq dernières semaines": "Consistency over the last five weeks",
"Un indicateur de motivation, pas une mesure médicale : il compte ce que tu fais — séances, repas, mesure — pas ce que dit la balance.": "A motivation indicator, not a medical measure: it counts what you do — workouts, meals, weekly entry — not what the scale says.",
"Ton coach écrit tes trois objectifs après votre call. Ils apparaîtront ici.": "Your coach writes your three goals after your call. They will show up here.",
"Coche un objectif quand tu l'as atteint : ton coach le voit.": "Tick a goal once you've reached it: your coach sees it.",
"Ton bilan du mois": "Your monthly review",
"Cycle {n}": "Cycle {n}", "Semaine {a} sur {b}": "Week {a} of {b}", "Semaine {a} — cycle terminé": "Week {a} — cycle complete",
"Ce cycle est terminé : ton coach prépare la suite.": "This cycle is complete: your coach is preparing what comes next.",
"{n} séances par semaine. Note chaque séance : c'est ce qui fait avancer ta régularité.": "{n} workouts a week. Log every workout: that's what moves your consistency.",
"notée le {d}": "logged on {d}", "à faire": "to do",
"{a} / {b} repas respectés": "{a} / {b} meals on plan", "aujourd'hui": "today", "Respecté": "On plan", "Respecté ?": "On plan?", "Vider la liste": "Clear the list", "Vider la liste de courses ? Les articles cochés seront décochés.": "Clear the grocery list? Ticked items will be unticked.", "Oui, vider": "Yes, clear",
"Ta progression": "Your progress",
"Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte.": "Your weight, measurements and body composition, week after week. One entry a week, always in the same conditions: the trend is what matters.",
"Ajouter ma mesure": "Add my entry", "Poids de départ": "Starting weight", "à renseigner": "to fill in", "le {d}": "on {d}", "point de départ": "starting point", "première mesure": "first entry",
"Point de départ et réglages": "Starting point and settings",
/* v36 — bilan hebdomadaire, statuts d'objectifs */
"Bilan hebdomadaire": "Weekly check-in", "disponible": "available", "envoyé": "sent", "Non atteint": "Not reached",
"Ton bilan de la semaine est disponible": "Your weekly check-in is available",
"5 minutes, avant dimanche soir : c'est ce qui permet à ton coach d'ajuster": "5 minutes, before Sunday evening: it's what lets your coach adjust",
"Bilan de la semaine envoyé": "Weekly check-in sent",
"le {d} — merci, ton coach le lit avant votre prochain échange": "on {d} — thank you, your coach reads it before your next exchange",
"Semaine du {a} au {b}": "Week from {a} to {b}", "envoyé le {d}": "sent on {d}",
"Réponds simplement, avec tes mots. Rien n'est noté : ça sert à ajuster ton suivi.": "Answer simply, in your own words. Nothing is graded: it's there to adjust your follow-up.",
"Envoyer mon bilan": "Send my check-in", "Mettre à jour mon bilan": "Update my check-in", "Modifier mon bilan": "Edit my check-in",
"Il manque : {l}": "Missing: {l}", "Bilan envoyé. Ton coach le lira avant votre prochain échange.": "Check-in sent. Your coach will read it before your next exchange.",
/* v59 — le mot affiché pendant l'envoi du bilan */
"Envoi de ton bilan…": "Sending your check-in…",
"Mes bilans précédents": "My previous check-ins", "Pas encore de bilan pour cette semaine.": "No check-in for this week yet.",
"Comment s'est passée ta semaine ?": "How did your week go?", "Énergie": "Energy", "Motivation": "Motivation", "Sommeil": "Sleep", "Stress": "Stress",
"1 = très calme · 5 = très stressé": "1 = very calm · 5 = very stressed",
"Combien de séances as-tu réalisées ?": "How many workouts did you do?", "Comment s'est passée ton alimentation ?": "How did your nutrition go?",
"Quelle a été ta principale réussite ?": "What was your main win?", "Quelle a été ta principale difficulté ?": "What was your main difficulty?",
"As-tu besoin d'un ajustement ?": "Do you need an adjustment?",
"Oui — mon programme": "Yes — my program", "Oui — mon alimentation": "Yes — my nutrition", "Oui — les deux": "Yes — both",
"Bibliothèque": "Library", "modules": "modules", "étapes": "steps", "module terminé": "module completed", "modules terminés": "modules completed", "sur": "of",
/* v38 — feedback du coach */
"Feedback de ton coach": "Your coach's feedback", "Feedbacks précédents": "Previous feedback", "écrit le {d}": "written on {d}", "nouveau": "new",
"Ton feedback est disponible": "Your feedback is available", "Ton coach a répondu : {p}": "Your coach replied: {p}",
/* v39 — inscription libre */
"Crée ton compte": "Create your account", "Créer mon compte": "Create my account", "J'ai déjà un compte": "I already have an account",
"Ton prénom": "Your first name", "Ton nom": "Your last name", "Confirme ton mot de passe": "Confirm your password",
"Indique ton prénom.": "Enter your first name.", "Indique ton nom.": "Enter your last name.",   /* v52 : nom obligatoire a l'inscription */
"Compte créé. Ouvre le lien reçu par email pour le confirmer, puis connecte-toi.": "Account created. Open the link we emailed you to confirm it, then sign in.",
"Un compte existe déjà avec cet email : connecte-toi.": "An account already exists with this email: sign in.",
"Les inscriptions ne sont pas encore ouvertes.": "Sign-ups are not open yet.",
/* v40 — mode gratuit */
/* v61 (brief V2, E2) : ce que l'accompagnement ajoute (accueil du prospect et pages verrouillées) */
"Tes séances construites pour toi et ajustées par ton coach selon tes progrès.": "Workouts built for you and adjusted by your coach as you progress.",
"Tes repas calculés pour ton objectif, avec ta liste de courses.": "Meals calculated for your goal, with your shopping list.",
"Ton poids, tes mensurations et ta composition corporelle, semaine après semaine.": "Your weight, measurements and body composition, week after week.",
"Ta régularité, ta courbe et le retour de ton coach chaque semaine.": "Your consistency, your progress curve and your coach's feedback every week.",
"Ton bilan du mois, préparé avec ton coach.": "Your monthly review, prepared with your coach.",
"Tes compléments conseillés, avec les doses et les moments.": "Your recommended supplements, with doses and timing.",
"Bienvenue": "Welcome", "Ton espace gratuit MHX : commence par la Speed Formation, à ton rythme.": "Your free MHX space: start with the Speed Formation, at your own pace.",
"Ton espace gratuit": "Your free space", "Ce que l'accompagnement ajoute": "What coaching adds",
"Ton questionnaire et tes réglages": "Your questionnaire and settings",
"15 min avec Lucas pour faire le point sur ton objectif. Offert.": "15 min with Lucas to go over your goal. Free.",
/* v41 — photos de progression */
"Photos de progression": "Progress photos", "privées": "private",
"Visibles par toi et ton coach seulement. Même lumière, même tenue, même position : c'est ce qui rend la comparaison utile.": "Visible only to you and your coach. Same light, same outfit, same pose: that's what makes the comparison useful.",
"De face": "Front", "De profil": "Side", "De dos": "Back", "Choisir une photo": "Choose a photo", "Changer la photo": "Change the photo",
"Retirer": "Remove", "Comparer": "Compare", "Première semaine": "First week", "Seconde semaine": "Second week", "Semaine {n}": "Week {n}",
"Aucune photo pour le moment.": "No photos yet.", "Indique la semaine.": "Enter the week.", "Envoi…": "Uploading…",
"Photo enregistrée.": "Photo saved.", "Photo retirée.": "Photo removed.", "Retirer cette photo ?": "Remove this photo?", "Oui, retirer": "Yes, remove",
"Les photos ne sont pas encore activées.": "Photos are not enabled yet.", "Envoi refusé : reconnecte-toi puis réessaie.": "Upload refused: sign in again and retry.",
"Photo trop lourde.": "Photo too large.", "Non enregistré : tes données n'ont pas pu être chargées. Recharge la page.": "Not saved: your data couldn't be loaded. Reload the page.", "Cette page n'a pas pu s'afficher : une de tes données est illisible. Les autres pages fonctionnent ; préviens ton coach.": "This page couldn't be displayed: some of your data can't be read. The other pages work; let your coach know.", "Le retrait n'a pas abouti, réessaie.": "The removal failed, please try again.", "Tes photos n'ont pas pu être chargées : recharge la page pour en ajouter.": "Your photos couldn't be loaded: reload the page to add some.", "Cette image ne peut pas être lue : choisis une photo JPEG ou PNG.": "This image can't be read: choose a JPEG or PNG photo.", "L'envoi n'a pas abouti, réessaie.": "The upload failed, please try again.", "indisponible": "unavailable",
/* parcours du prospect (les textes de la Decouverte sont dans DECOUVERTE.en) */
"Jour {n}": "Day {n}", "Chargement…": "Loading…",
"Afficher": "Show", "Afficher le mot de passe": "Show the password",
"Ton questionnaire": "Your questionnaire",
"Ton compte et tes réglages.": "Your account and settings.",
"Bienvenue dans l'accompagnement !": "Welcome to your coaching!",
"Tes premières réponses sont déjà là : complète le reste du questionnaire et enregistre.": "Your first answers are already here: complete the rest of the questionnaire and save.",
/* v52 — encadré de première connexion d'un client : les variantes qui n'avaient pas d'anglais */
"Une réponse manque à ton profil.": "One answer is missing from your profile.",
"Complète-la et enregistre : ça prend dix secondes.": "Fill it in and save: it takes ten seconds.",
"Deux réponses manquent à ton profil.": "Two answers are missing from your profile.",
"Complète-les et enregistre : ça prend quelques secondes.": "Fill them in and save: it takes a few seconds.",
"Reprends ton profil là où tu t'es arrêté.": "Pick up your profile where you left off.",
"Tes premières réponses sont enregistrées : complète le reste et enregistre.": "Your first answers are saved: complete the rest and save.",
"Heures de sommeil / nuit *": "Hours of sleep per night *", "Niveau d'énergie dans la journée *": "Energy level during the day *", "/ sem": "/ wk", "Jour {n} : {e}": "Day {n}: {e}", "fait": "done", "À partir de {n} ans.": "From {n} years old.", "{a} à {b}": "{a} to {b}",
/* v45 — jours 2 a 4 */
"Démonstration de l'exercice": "Exercise demonstration", "Marche sur place": "March in place", "Marche sur place genoux hauts": "High-knee march in place", "Montées de genoux + squats": "High knees + squats", "Monter la température avant une séance intense ou un circuit.": "Raise your body temperature before an intense session or a circuit."
/* v53 — chantier 4 (coach) et liste newsletter : ses traductions ici, juste au-dessus de cette ligne si besoin */
};
I18N.motifs = [["^(\\d+) articles? sur (\\d+) dans le panier\\.$", "$1 of $2 items in your cart."], ["^(\\d+) étapes? validées? sur (\\d+) — (\\d+) %$", "$1 of $2 steps completed — $3%"], ["^([\\d\\s\\u202f\\u00a0.,−-]+?) kcal$", "$1 Cal"], ["^([\\d\\s\\u202f\\u00a0.,−-]+?) kcal · ([\\d\\s\\u202f\\u00a0.,−-]+?) g de protéines par dose$", "$1 Cal · $2 g protein per serving"], ["^([\\d\\s\\u202f\\u00a0.,−-]+?) kcal consommées sur ([\\d\\s\\u202f\\u00a0.,−-]+?) — il te reste$", "$1 Cal eaten out of $2 — you have"], ["^Objectif visé : ([\\d\\s\\u202f\\u00a0.,−-]+?) kcal · ([\\d\\s\\u202f\\u00a0.,−-]+?) g de protéines · ([\\d\\s\\u202f\\u00a0.,−-]+?) g de glucides · ([\\d\\s\\u202f\\u00a0.,−-]+?) g de lipides\\.$", "Target: $1 Cal · $2 g protein · $3 g carbs · $4 g fat."], ["^Coche les jours que tu veux acheter : la liste se recalcule\\. (\\d+) jours? sélectionnés?\\.$", "Check the days you want to shop for: the list updates automatically. $1 day(s) selected."], ["^Programme mis à jour le (\\d{1,2})/(\\d{1,2})/(\\d{4})$", "Program updated $2/$1/$3"], ["^Repas mis à jour le (\\d{1,2})/(\\d{1,2})/(\\d{4})$", "Meals updated $2/$1/$3"], ["^S(\\d+)$", "W$1"], ["^Supprimer la semaine (\\d+)$", "Delete week $1"], ["^dernière : semaine (\\d+)$", "latest: week $1"], ["^semaine (\\d+)$", "week $1"], ["^Semaine (\\d+) enregistrée\\.$", "Week $1 saved."], ["^(\\d+)/jambe$", "$1/leg"], ["^(\\d+)-(\\d+)/jambe$", "$1-$2/leg"], ["^(\\d+)/bras$", "$1/arm"], ["^(\\d+)-(\\d+)/bras$", "$1-$2/arm"], ["^(\\d+)-(\\d+) s/côté$", "$1-$2 s/side"], ["^protéines au-dessus de ([\\d\\s\\u202f\\u00a0.,−-]+?) g$", "protein over by $1 g"], ["^protéines en dessous de ([\\d\\s\\u202f\\u00a0.,−-]+?) g$", "protein under by $1 g"], ["^lipides au-dessus de ([\\d\\s\\u202f\\u00a0.,−-]+?) g — sur ce régime, les sources de protéines apportent beaucoup de gras$", "fat over by $1 g — on this diet, protein sources bring a lot of fat"], ["^lipides en dessous de ([\\d\\s\\u202f\\u00a0.,−-]+?) g — sur ce régime, les sources de protéines apportent beaucoup de gras$", "fat under by $1 g"], ["^calories au-dessus de ([\\d\\s\\u202f\\u00a0.,−-]+?) kcal$", "calories over by $1 Cal"], ["^calories en dessous de ([\\d\\s\\u202f\\u00a0.,−-]+?) kcal$", "calories under by $1 Cal"], ["^glucides en dessous de ([\\d\\s\\u202f\\u00a0.,−-]+?) g — ce régime offre peu de sources de glucides dans le catalogue$", "carbs under by $1 g — this diet has few carb sources in the catalog"], ["^(\\d+(?:-\\d+)?(?: s)?)/jambe$", "$1/leg"], ["^(\\d+(?:-\\d+)?(?: s)?)/bras$", "$1/arm"], ["^(\\d+(?:-\\d+)?(?: s)?)/côté$", "$1/side"], ["^(\\d+)/sens$", "$1/direction"], ["^(\\d+)/sens/cheville$", "$1/direction/ankle"], ["^(\\d+) souffles$", "$1 breaths"], ["^(\\d+) respirations$", "$1 breaths"], ["^(\\d+(?:-\\d+)?) pas$", "$1 steps"], ["^(\\d+) dans chaque sens$", "$1 each direction"], ["^(\\d+) par côté$", "$1 per side"], ["^(\\d+) par jambe$", "$1 per leg"], ["^(\\d+) par cheville$", "$1 per ankle"], ["^(\\d+) s par (côté)$", "$1 s per side"], ["^(\\d+) s par jambe$", "$1 s per leg"], ["^(\\d+) s \\+ (\\d+) squats$", "$1 s + $2 squats"]].map(([p, r]) => [new RegExp(p), r]);

/* v29 — composition corporelle + historique des plans */
Object.assign(I18N.en, {
  "Balance à impédancemètre (facultatif)": "Smart scale (optional)",
  "Pèse-toi toujours dans les mêmes conditions : le matin, à jeun, après être passé(e) aux toilettes et avant de boire. Ces balances ne sont pas précises au chiffre près : c'est l'évolution qui compte. Et compare-toi seulement à toi-même : deux marques de balance ne donnent pas les mêmes chiffres.": "Always weigh yourself under the same conditions: in the morning, on an empty stomach, after using the bathroom and before drinking. These scales aren't precise to the decimal: the trend is what matters. And only compare yourself to yourself: two scale brands won't give the same numbers.",
  "Composition corporelle": "Body composition",
  "Mesures de balance à impédancemètre : fie-toi à la tendance, pas au chiffre d'un jour.": "Smart scale readings: trust the trend, not a single day's number.",
  "Évolution de la composition corporelle semaine par semaine": "Body composition week by week",
  "Masse grasse": "Body fat", "Masse musculaire": "Muscle mass", "Eau corporelle": "Body water",
  "Graisse viscérale": "Visceral fat", "Masse osseuse": "Bone mass", "Métabolisme de base": "Basal metabolic rate", "Âge métabolique": "Metabolic age",
  "Masse grasse (%)": "Body fat (%)", "Masse musculaire (kg)": "Muscle mass (kg)", "Eau corporelle (%)": "Body water (%)",
  "Graisse viscérale (indice)": "Visceral fat (index)", "Masse osseuse (kg)": "Bone mass (kg)",
  "Métabolisme de base (kcal)": "Basal metabolic rate (Cal)", "Âge métabolique (ans)": "Metabolic age (years)",
  "depuis le début": "since the start",
  "Renseigne au moins ton poids, une mensuration ou une mesure de balance.": "Enter at least your weight, one measurement or one scale reading.",
  "{nom} : entre {bas} et {haut}, vérifie la saisie.": "{nom}: between {bas} and {haut}, check your entry.",
  "Mes anciens programmes": "My past programs", "Historique des programmes": "Program history",
  "Mes anciennes diètes": "My past meal plans", "Historique des diètes": "Meal plan history",
  "Chaque programme remplacé est rangé ici avec ses dates. Rien ne s'efface.": "Every replaced program is kept here with its dates. Nothing gets deleted.",
  "Chaque diète remplacée est rangée ici avec ses dates. Rien ne s'efface.": "Every replaced meal plan is kept here with its dates. Nothing gets deleted.",
  "Afficher l'historique": "Show history",
  "Aucun ancien programme pour le moment.": "No past programs yet.",
  "Aucune ancienne diète pour le moment.": "No past meal plans yet.",
  "Programme sans nom": "Untitled program", "Diète sans nom": "Untitled meal plan",
  "Programme vide.": "Empty program.", "Diète vide.": "Empty meal plan.",
  "Remettre ce programme": "Restore this program", "Remettre cette diète": "Restore this meal plan",
  "L'ancien programme n'a pas pu être rangé dans l'historique. Le remplacer quand même ?": "The old program couldn't be saved to history. Replace it anyway?",
  "L'ancienne diète n'a pas pu être rangée dans l'historique. La remplacer quand même ?": "The old meal plan couldn't be saved to history. Replace it anyway?",
  "Remettre « {nom} » ? Le programme actuel sera rangé dans l'historique.": "Restore “{nom}”? The current program will be moved to history.",
  "Remettre « {nom} » ? La diète actuelle sera rangée dans l'historique.": "Restore “{nom}”? The current meal plan will be moved to history.",
  "Programme remis en place. Relis-le, puis clique sur « Envoyer » pour le dater.": "Program restored. Review it, then click “Send” to date it.",
  "Diète remise en place. Relis-la, puis clique sur « Envoyer » pour la dater.": "Meal plan restored. Review it, then click “Send” to date it."
});
I18N.motifs.push(
  [/^du (.+) au (.+)$/, "from $1 to $2"],
  [/^jusqu'au (.+)$/, "until $1"],
  [/^([+−]?[\d\s\u202f\u00a0.,]+) (%|kg|indice|kcal|ans) depuis le début$/, "$1 $2 since the start"]
);

/* v30 — journal client, progression automatique, remplacement de repas */
Object.assign(I18N.en, {
  "Noter ma séance": "Log my workout", "Séance terminée": "Workout done", "Annuler": "Cancel",
  "Note tes répétitions et ta charge pour chaque série. La charge proposée vient de ta dernière séance : ajuste-la si besoin.": "Enter your reps and weight for each set. The suggested weight comes from your last workout: adjust it if needed.",
  "Note au moins une série pour enregistrer ta séance.": "Log at least one set to save your workout.",
  "Vérifie tes chiffres : jusqu'à 100 reps et 500 kg par série.": "Check your numbers: up to 100 reps and 500 kg per set.",
  "Séance enregistrée. Bravo !": "Workout saved. Well done!",
  "Toutes tes séries ont atteint {n} reps : passe à {kg} kg.": "All your sets hit {n} reps: move up to {kg} kg.",
  "Garde {kg} kg et vise {n} reps sur chaque série.": "Stay at {kg} kg and aim for {n} reps on every set.",
  "Toutes tes séries ont atteint {n} reps : ajoute 1 à 2 répétitions ou un peu de charge.": "All your sets hit {n} reps: add 1-2 reps or a little weight.",
  "Vise {n} reps sur chaque série.": "Aim for {n} reps on every set.",
  "Dernière fois ({date}) : {detail}": "Last time ({date}): {detail}",
  "Dernière séance notée le {date}": "Last workout logged on {date}",
  "Séances notées par ton client": "Workouts logged by your client",
  "Aucune séance notée pour le moment.": "No workouts logged yet.",
  "Exercices": "Exercises", "Séries": "Sets", "Répétitions": "Reps", "Charge en kg": "Weight in kg",
  "Remplacer": "Swap", "Changé par ton client": "Changed by your client",
  "Pas d'autre recette disponible pour ce repas pour le moment.": "No other recipe available for this meal right now.",
  /* v67 (D3) : « Remplacer » relit la base avant d'ecrire */
  "Tes repas ont changé entre-temps : voici la dernière version.": "Your meals changed in the meantime: here is the latest version.",
  "Pas de connexion : ton repas n'a pas été remplacé. Réessaie dans un instant.": "No connection: your meal wasn't swapped. Try again in a moment.",
  "Les grammages sont donnés crus, sauf mention contraire. Si un plat ne te convient pas, touche « Remplacer » : l'app t'en propose un autre avec les mêmes calories.": "Weights are given raw unless stated otherwise. If a dish doesn't work for you, tap “Swap”: the app suggests another one with the same calories."
});
I18N.motifs.push([/^Série (\d+)$/, "Set $1"]);

/* v31 — regularite, objectifs du mois */
Object.assign(I18N.en, {
  "Ta semaine": "Your week", "Score de régularité": "Consistency score", "remis à zéro chaque lundi": "resets every Monday",
  "Séances notées": "Workouts logged", "cette semaine": "this week", "Repas cochés": "Meals checked",
  "Mesure de la semaine": "This week's check-in", "c'est fait": "done", "dans Mensurations": "in Measurements",
  "Ton score mesure ta régularité, pas ton poids : tes séances, tes repas cochés et ta mesure de la semaine.": "Your score measures consistency, not your weight: your workouts, your checked meals and your weekly check-in.",
  "Tes 3 objectifs du mois": "Your 3 goals this month",
  "Les 3 objectifs du mois": "This month's 3 goals",
  "Remplis-les juste après ton call du mois : ils s'affichent en haut de son programme, et ton client peut les cocher.": "Fill them in right after your monthly call: they show at the top of their program, and your client can check them off.",
  "Dernière mise à jour : {mois}.": "Last updated: {mois}.",
  "Ex. 3 séances par semaine": "E.g. 3 workouts a week", "Ex. 2 L d'eau par jour": "E.g. 2 L of water a day", "Ex. 8 000 pas par jour": "E.g. 8,000 steps a day",
  "Régularité": "Consistency", "Régularité faible la semaine dernière :": "Low consistency last week:"
});
I18N.motifs.push([/^Objectif (\d)$/, "Goal $1"], [/^\(en cours : (\d+)\)$/, "(this week: $1)"]);

/* v32 — bilan du mois */
Object.assign(I18N.en, {
  "Mon bilan": "My review", "Ton bilan du mois": "Your monthly review",
  "Tes quatre dernières semaines en un coup d'œil : ce que tu as fait, ce qui a bougé et ce qu'on travaille ensuite.": "Your last four weeks at a glance: what you did, what changed and what we work on next.",
  "Les 4 dernières semaines": "The last 4 weeks", "Du {de} au {a}": "From {de} to {a}",
  "Régularité moyenne": "Average consistency", "4 semaines complètes": "4 full weeks", "sur 28 jours": "over 28 days",
  "Poids": "Weight", "pas assez de mesures": "not enough measurements", "{de} → {a} kg": "{de} → {a} kg",
  "des repas prévus": "of planned meals", "Régularité semaine par semaine : {l}": "Consistency week by week: {l}", "en cours {n}": "this week {n}",
  "Ce qui a bougé": "What changed", "Progression des charges": "Weight progression", "Exercice": "Exercise",
  "Début du mois": "Start of month", "Maintenant": "Now", "Objectifs du mois": "This month's goals",
  "Pas encore assez de données. Le bilan se remplit au fil des séances notées, des repas cochés et des mesures.": "Not enough data yet. Your review fills up as you log workouts, check meals and add measurements."
});

/* v52 — le calculateur (ouvert au prospect : tous ses textes), « Mon journal » (vitrine du prospect) */
Object.assign(I18N.en, {
  "Calculateur": "Calculator", "Calculateur métabolique": "Metabolic calculator",
  "Tes calories de maintenance et tes macros, calculées sur ta morphologie et ton niveau d'activité réel. Tout se met à jour en direct.": "Your maintenance calories and macros, calculated from your body and your real activity level. Everything updates live.",
  "Tes données": "Your details", "Sexe": "Sex", "Âge (ans)": "Age (years)", "Taille (cm)": "Height (cm)",
  "Pas par jour": "Steps per day", "Entraînement (h / semaine)": "Training (h / week)",
  "Ta maintenance": "Your maintenance", "kcal / jour": "Cal / day",
  "C'est ce que ton corps dépense sur une journée type. Manger ça, c'est rester au même poids.": "This is what your body burns on a typical day. Eating this much keeps your weight stable.",
  "Choisis ton objectif": "Choose your goal", "Perte de poids −10%": "Weight loss −10%", "Maintien": "Maintenance", "Prise de masse +10%": "Muscle gain +10%",
  "Tes macros": "Your macros", "perte de poids": "weight loss", "maintien": "maintenance", "prise de masse": "muscle gain",
  "Grammes par jour. Protéines fixées à {p} g par kg de poids de corps, lipides à {l} g par kg, les glucides complètent le total de calories de ton objectif.": "Grams per day. Protein set at {p} g per kg of body weight, fat at {l} g per kg, carbs make up the rest of your target calories.",
  "Comment ces chiffres sont calculés": "How these numbers are calculated",
  "1. Métabolisme de base": "1. Basal metabolic rate", "— formule de Mifflin-St Jeor, la référence actuelle :": "— Mifflin-St Jeor formula, the current reference:",
  "2. Facteur d'activité": "2. Activity factor", "— on part d'une base sédentaire de {b}, puis on ajoute ton activité réelle :": "— we start from a sedentary base of {b}, then add your real activity:",
  "= métabolisme de base × facteur d'activité =": "= basal metabolic rate × activity factor =",
  "Ces formules donnent une estimation solide, pas une vérité absolue. La vraie mesure, c'est la balance : garde le même apport pendant 2 semaines, et si ton poids ne bouge pas dans le sens voulu, ajuste de 150 à 200 kcal.": "These formulas give a solid estimate, not an absolute truth. The real measure is the scale: keep the same intake for 2 weeks, and if your weight doesn't move the way you want, adjust by 150 to 200 Cal.",
  "À ce niveau de calories, il ne reste presque plus de place pour les glucides. Baisse les protéines à 2 g/kg ou revois ton objectif à la hausse — s'entraîner dur sans glucides ne tient pas dans la durée.": "At this calorie level, there's almost no room left for carbs. Lower protein to 2 g/kg or raise your target — training hard without carbs doesn't last.",
  "(pas)": "(steps)", "(entraînement)": "(training)",
  "Le calculateur est réservé aux adultes ({n} ans et plus) : rien n'est enregistré.": "The calculator is for adults only ({n} and over): nothing is saved.",
  "Ce que tu avais enregistré ici a été retiré.": "What you had saved here has been removed.",
  "Enregistrer mes chiffres": "Save my numbers", "Tes chiffres sont enregistrés.": "Your numbers are saved.",
  "Ces chiffres sont une estimation générale, pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.": "These numbers are a general estimate, not medical advice. If you have any doubt about your health, talk to a professional.",
  "Mon journal": "My training log", "Ton journal d'entraînement": "Your training log",
  "Tes séances notées, tes charges et tes progrès, séance après séance.": "Your logged workouts, your weights and your progress, session after session.",
  "Chaque séance notée, et la charge à viser la fois suivante.": "Every workout logged, with the weight to aim for next time."   // v61 (brief V2, E2)
});


