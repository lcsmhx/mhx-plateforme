/* ==================================================================
   v81 (bloc 2 de la mission du 13/10/2026) — LE PARCOURS DU PROSPECT
   Remplace l'écran unique « Crée ton espace gratuit » (v72) par 11 écrans, sans changer ce qui marche : même création de
   compte (Auth.inscrire, mêmes métadonnées d'accord), même numéro obligatoire (clé contact), même code ?ref= (Provenance),
   même lien Calendly pré-rempli (lienCalendly), mêmes réponses rangées dans la clé intake (format des 3 questions de la v60,
   lu par le coach : fiche, carte Prospects, CSV).
   Ordre : Accueil → Objectif 10 % → Coincé 20 % → Dans 3 mois 30 % → Tu es 40 % → Prénom 50 % → Chargement 60 % → Compte
   70 % → WhatsApp 80 % (le compte est créé ici) → Ton espace 90 % → Cadeau 100 % → accueil de l'app.
   - Les réponses sont gardées dans sessionStorage (« mhx_parcours », lectures et écritures protégées) : la page rechargée
     reprend à l'écran où on était. Le mot de passe n'y est JAMAIS rangé (en mémoire seulement) : rechargée après l'écran
     Compte, la page y revient (email et cases gardés).
   - Le compte est créé au toucher de « Débloquer mon espace ». Ça marche parce que la confirmation d'email est DÉSACTIVÉE
     dans Supabase (la session arrive tout de suite ; voir CLAUDE.md, Repères). Si elle était rallumée : écran « Vérifie ta
     boîte mail », et les réponses restent dans l'onglet jusqu'à la première connexion (Parcours.suite).
   - Après la création, la page se recharge avec la session : les réponses partent dans intake (une seule écriture, après
     lecture), puis « Ton espace » et le cadeau, en plein écran (hors navigation : aucune bannière d'installation).
   - Écrans visibles sans session : ce fichier est dans MHX_SOCLE (index.html), comme config, i18n, auth-store, connexion.
   - Textes : docs/maj-blocs-1-2/TEXTES.md (font foi), en français ici ; l'anglais dans I18N.en (js/i18n.js, bloc v81).
   ================================================================== */
const PARCOURS_T = {
  retour: "Retour",
  accueil: {
    titre: "Combien de lundis tu as dit « je commence » ?",
    sous: "Séances prêtes, journal alimentaire, recettes, suivi. Gratuit à vie pour les inscrits.",
    bouton: "Créer mon espace gratuit",
    connexion: "Déjà un compte ? Se connecter",
    bientot: "Bientôt",
    /* les 5 scènes de l'animation, dans l'ordre (identifiants de CONFIG.parcours.disponibles) */
    scenes: [["journal", "Journal alimentaire"], ["programme", "Programmes homme ou femme"], ["recettes", "Recettes"], ["calculateur", "Calculateur de calories"], ["suivi", "Suivi de tes progrès"]],
    rebours_n: "La bêta ferme le 15 novembre · plus que {n} jours",
    rebours_un: "La bêta ferme le 15 novembre · plus qu’un jour",
    rebours_zero: "La bêta ferme le 15 novembre · dernier jour"
  },
  /* les mots de l'animation (petit écran de téléphone dessiné) */
  anim: { aujourdhui: "Aujourd’hui", repas: ["Petit-déjeuner", "Déjeuner", "Dîner", "Collations"], seance: "Ma séance", homme: "Homme", femme: "Femme",
    exos: ["Squat barre", "Presse à cuisses", "Fentes marchées", "Leg extension"], recettes: "Recettes", calculateur: "Calculateur",
    macros: ["Protéines", "Glucides", "Lipides"], progression: "Progression", poids: "Poids", mensurations: "Mensurations" },
  objectif: {
    titre: "Ton objectif ?",
    /* même ordre et mêmes valeurs que la question « probleme » (DECOUVERTE.questions) : la valeur rangée est l'option exacte */
    options: [["Perdre du gras", "Affiner ma silhouette"], ["Prendre du muscle", "Me dessiner et gagner en force"], ["Me remettre en forme", "Retrouver de l’énergie et une routine"]],
    bas: "Ça prend 1 minute."
  },
  coince: {
    titre: "Jusqu’ici, qu’est-ce qui a coincé ?",
    sous: "Jusqu’à 2 réponses.",
    /* clés de la question « obstacle » (DECOUVERTE.questions) : [clé, libellé, réaction] */
    options: [
      ["temps", "Le manque de temps", "On y a pensé. Ton programme avance par petites étapes, faciles à glisser dans une journée chargée."],
      ["craquages", "Je craque sur la nourriture", "Ça arrive, et ce n’est pas un manque de volonté. On commence par des bases simples pour reprendre la main."],
      ["quoi_faire", "Je ne sais pas quoi faire exactement", "Justement, c’est le rôle de ton programme : tu sauras quoi faire, et dans quel ordre."],
      ["motivation", "La motivation retombe vite", "Normal. Tu avances par petites étapes, pas besoin d’avoir la motivation tous les jours."],
      ["tout_essaye", "J’ai déjà tout essayé, rien ne dure", "Alors on change d’approche : des petites étapes qui durent, pas un énième programme extrême."],
      ["suivi", "Personne pour me suivre et me recadrer", "Ici, tu as du soutien : ton coach est là pour faire le point avec toi et t’aider à tenir le cap."]],
    autre: "Autre chose ? Dis-le avec tes mots",
    exemple: "Écris-le ici, en quelques mots",
    bouton: "Continuer"
  },
  projection: {
    titre: "Dans 3 mois, qu’est-ce qui changerait tout pour toi ?",
    /* clés de la question « projection » (DECOUVERTE.questions) */
    options: [
      ["vetements", "Rentrer à nouveau dans mes vêtements préférés", "Un repère très concret, c’est bien. On avance vers ça, étape par étape."],
      ["photos", "M’aimer sur les photos", "Se sentir bien dans son corps, ça se construit pas à pas. Ton programme est là pour ça."],
      ["energie", "Avoir de l’énergie toute la journée", "L’énergie, ça se travaille. On commence par les bases qui comptent le plus."],
      ["routine", "Tenir une routine sans me forcer", "C’est exactement ce que vise ton programme : des habitudes simples, qui s’installent sans bras de fer."],
      ["confiance", "Retrouver confiance en moi", "La confiance se reconstruit avec des petites victoires. On va t’en donner régulièrement."]],
    bouton: "Continuer"
  },
  sexe: { titre: "Tu es ?", sous: "Pour te proposer le bon programme.", options: [["Homme", "Un homme"], ["Femme", "Une femme"]] },
  prenom: { titre: "On t’appelle comment ?", etiquette: "Ton prénom", bouton: "Continuer" },
  chargement: {
    titre: "{p}, on prépare ton espace…",
    objectif: "Ton objectif", coince: "Ce qui a coincé", projection: "Dans 3 mois", profil: "Ton profil",
    suite: "Suite →"
  },
  compte: {
    titre: "Ton espace est prêt 🔒",
    sous: "Crée ton compte pour le débloquer et le garder.",
    email: "Email", exemple: "ton@email.com",
    mdp: "Mot de passe (8 caractères minimum)", afficher: "Afficher", masquer: "Masquer",
    newsletter: "Je veux recevoir les conseils et les offres de {m} par email.",
    bouton: "Continuer"
  },
  whatsapp: {
    surtitre: "Ton espace est prêt 🔒",
    titre: "Ton numéro WhatsApp ?",
    etiquette: "Ton numéro (WhatsApp)",
    aide: "Ton coach s’en sert pour t’appeler ou t’écrire sur WhatsApp. Jamais revendu.",
    autre: "Autre (indicatif à saisir)",
    note: "L’app ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel avant de commencer.",
    bouton: "Débloquer mon espace",
    attente: "Un instant…"
  },
  espace: {
    titre: "{p}, voici ce qui t’attend dans ton espace.",
    titre_sans: "Voici ce qui t’attend dans ton espace.",
    objectif: "Objectif : {o}", profil: "Profil : {s}",
    /* « Objectif : … » et « Profil : … » des pastilles */
    objectifs: { "Perdre du gras": "perdre du gras", "Prendre du muscle": "prendre du muscle", "Me remettre en forme": "remise en forme" },
    profils: { Homme: "homme", Femme: "femme" },
    /* les 5 cartes, dans l'ordre (identifiants de CONFIG.parcours.disponibles) */
    cartes: [["programme", "Ton programme", "Des séances toutes prêtes, avec la vidéo de chaque exercice."],
             ["journal", "Ton journal alimentaire", "Note tes repas et suis ta journée."],
             ["recettes", "Tes recettes", "Des recettes simples pour manger mieux."],
             ["calculateur", "Ton calculateur", "Combien manger pour ton objectif."],
             ["suivi", "Ton suivi", "Poids et mensurations, pour voir ce qui bouge."]],
    bilan: "Après ton bilan", bilan_suite: " : ton programme sur mesure, avec ton coach.",
    bouton: "Entrer dans mon espace"
  },
  cadeau: {
    surtitre: "🎁 Cadeau de bienvenue",
    titre: "Ton plan d’action sur mesure, offert",
    avec: "15 min avec ton coach pour construire ton plan selon ton objectif ({o}) et ce qui te bloque ({b}).",
    sans: "15 min avec ton coach pour construire ton plan selon ton objectif ({o}).",
    et: "{a} et {b}",
    reperes: ["15 min", "par téléphone", "sans engagement"],
    coach: "Ton coach",
    bouton: "Je réserve mon créneau offert",
    plus_tard: "Plus tard",
    /* versions courtes des choix, dans les phrases du cadeau */
    courts: { "Perdre du gras": "perdre du gras", "Prendre du muscle": "prendre du muscle", "Me remettre en forme": "te remettre en forme",
      temps: "le manque de temps", craquages: "les craquages", quoi_faire: "ne pas savoir quoi faire", motivation: "la motivation qui retombe",
      tout_essaye: "les efforts qui ne durent pas", suivi: "le manque de suivi" }
  },
  /* la carte de l'accueil de l'app (outilDecouverte) */
  carte: { titre: "🎁 Ton cadeau t’attend", texte: "15 min avec ton coach pour construire ton plan d’action.", bouton: "Je réserve mon créneau offert" },
  erreurs: {
    email: "Vérifie ton email.", mdp: "8 caractères minimum.", email_pris: "Cet email a déjà un compte.", connexion: "Se connecter",
    tel: "Vérifie ton numéro.", reseau: "Pas de connexion. Réessaie dans un instant."
  }
};

const Parcours = {
  CLE: "mhx_parcours",
  /* les écrans avant le compte, dans l'ordre ; puis ceux d'après (avec la session) */
  AVANT: ["accueil", "objectif", "coince", "projection", "sexe", "prenom", "chargement", "compte", "whatsapp"],
  APRES: ["espace", "cadeau"],
  PROGRES: { objectif: 10, coince: 20, projection: 30, sexe: 40, prenom: 50, chargement: 60, compte: 70, whatsapp: 80, espace: 90, cadeau: 100 },
  /* le bouton retour de chaque écran (le chargement, « Ton espace » et le cadeau n'en ont pas) */
  RETOUR: { objectif: "accueil", coince: "objectif", projection: "coince", sexe: "projection", prenom: "sexe", compte: "prenom", whatsapp: "compte" },
  COCHES: [600, 1400, 2200, 3000], SUITE: 3500,   // chargement : les 4 coches (ms), puis l'écran suivant
  LIBRE_MAX: 200, PRENOM_MAX: 60,
  _mdp: "",             // le mot de passe : en mémoire seulement, jamais rangé
  _minuteurs: [],
  _envoi: false,

  /* ---------- l'état, dans l'onglet (sessionStorage) : lu et nettoyé à chaque fois ---------- */
  lire(){
    let o = null;
    try { o = JSON.parse(sessionStorage.getItem(this.CLE) || "null"); } catch(e){ o = null; }
    if (!o || typeof o !== "object" || Array.isArray(o)) return {};
    const S = {}, T = PARCOURS_T, txt = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
    if (this.AVANT.concat(this.APRES).indexOf(o.etape) > -1) S.etape = o.etape;
    if (T.objectif.options.some(x => x[0] === o.objectif)) S.objectif = o.objectif;
    if (Array.isArray(o.obstacle)) S.obstacle = o.obstacle.filter((k, i, a) => T.coince.options.some(x => x[0] === k) && a.indexOf(k) === i).slice(-2);
    if (typeof o.libre === "string") S.libre = txt(o.libre, this.LIBRE_MAX);
    if (o.libre_ouvert === true) S.libre_ouvert = true;
    if (T.projection.options.some(x => x[0] === o.projection)) S.projection = o.projection;
    if (o.sexe === "Homme" || o.sexe === "Femme") S.sexe = o.sexe;
    if (typeof o.prenom === "string") S.prenom = txt(o.prenom, this.PRENOM_MAX);
    if (typeof o.email === "string") S.email = txt(o.email, 254);
    if (o.cgu === true) S.cgu = true;
    if (o.newsletter === true) S.newsletter = true;
    if (typeof o.tel === "string" && Telephone.valide(o.tel)) S.tel = o.tel;
    if (o.erreur === "email_pris" || o.erreur === "email") S.erreur = o.erreur;
    ["uid", "cree"].forEach(k => { if (typeof o[k] === "string" && o[k].length <= 64) S[k] = o[k]; });
    if (o.a_ecrire === true) S.a_ecrire = true;
    return S;
  },
  ecrire(S){ try { sessionStorage.setItem(this.CLE, JSON.stringify(S)); } catch(e){} },
  oublier(){ try { sessionStorage.removeItem(this.CLE); } catch(e){} this._mdp = ""; },
  maj(champs){ const S = Object.assign(this.lire(), champs); Object.keys(S).forEach(k => { if (S[k] === undefined) delete S[k]; }); this.ecrire(S); return S; },

  emailValide(m){ return typeof m === "string" && m.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(m); },
  /* l'écran le plus loin où l'on peut être, d'après les réponses déjà données */
  possible(e, S){
    const i = this.AVANT.indexOf(e); if (i < 0) return false;
    /* ce que chaque écran demande d'avoir répondu avant lui (accueil et objectif : rien) */
    const fait = {
      objectif: !!S.objectif,
      coince: !!((S.obstacle && S.obstacle.length) || (S.libre && S.libre.trim())),
      projection: !!S.projection,
      sexe: !!S.sexe,
      prenom: !!(S.prenom && S.prenom.trim()),
      compte: this.emailValide(S.email) && S.cgu === true && this._mdp.length >= 8
    };
    const avant = { accueil: [], objectif: [], coince: ["objectif"], projection: ["objectif", "coince"], sexe: ["objectif", "coince", "projection"],
      prenom: ["objectif", "coince", "projection", "sexe"], chargement: ["objectif", "coince", "projection", "sexe", "prenom"],
      compte: ["objectif", "coince", "projection", "sexe", "prenom"], whatsapp: ["objectif", "coince", "projection", "sexe", "prenom", "compte"] };
    return avant[e].every(k => fait[k]);
  },
  /* l'écran à ouvrir : celui demandé s'il est possible, sinon le dernier possible avant lui */
  cible(e, S){
    let i = Math.max(0, this.AVANT.indexOf(e));
    while (i > 0 && !this.possible(this.AVANT[i], S)) i--;
    return this.AVANT[i];
  },

  /* ---------- entrée (sans session) : l'écran gardé, sinon l'accueil ---------- */
  ouvrir(e){
    const S = this.lire();
    /* un compte déjà créé dans cet onglet (page de connexion revenue entre-temps) : on repart de zéro */
    if (this.APRES.indexOf(S.etape) > -1) this.oublier();
    try { history.replaceState(null, "", location.pathname + location.search + "#/inscription"); } catch(err){}
    this.afficher(this.cible(e || S.etape || "accueil", this.lire()));
  },

  /* ---------- le cadre commun : en-tête (retour + progression), puis l'écran ---------- */
  tete(e){
    const r = this.RETOUR[e], p = this.PROGRES[e];
    return `<div class="pc-tete">${r ? `<button type="button" class="pc-retour" data-retour="${r}" aria-label="${esc(trad(PARCOURS_T.retour))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>` : `<span class="pc-retour-vide" aria-hidden="true"></span>`}`
      + `<div class="pc-progres" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div></div>`;
  },
  /* un texte français → affiché (traduit en anglais, typographie française en français), échappé */
  t(fr, vars){ return esc(typoFr(trad(fr, vars))); },
  arreter(){ this._minuteurs.forEach(clearTimeout); this._minuteurs = []; },
  afficher(e){
    this.arreter();
    try { if (UI._ouverte) UI.fermer(); } catch(err){}
    try { Captcha.oublier(); } catch(err){}
    if (typeof portail !== "undefined" && portail._entree){ document.removeEventListener("keydown", portail._entree); portail._entree = null; }
    const S = this.lire();
    if (this.AVANT.indexOf(e) > -1) this.maj({ etape: e });
    const html = this["html_" + e] ? this["html_" + e](S) : "";
    document.body.innerHTML = `<div class="pc pc-${e}" id="pc" data-etape="${e}">${e === "accueil" ? "" : this.tete(e)}${html}</div>`;
    window.scrollTo(0, 0);
    $$("[data-retour]").forEach(b => b.addEventListener("click", () => this.afficher(b.dataset.retour)));
    if (this["brancher_" + e]) this["brancher_" + e](S);
    const h = document.querySelector("#pc h1"); if (h){ h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch(err){} }
  },

  /* ---------- 1. Accueil (animation en CSS et SVG seulement) ---------- */
  dispo(id){ const d = (CONFIG.parcours || {}).disponibles || {}; return d[id] === true; },
  badge(id){ return this.dispo(id) ? "" : ` <span class="pc-bientot">${this.t(PARCOURS_T.accueil.bientot)}</span>`; },
  /* le compte à rebours, à l'heure de Paris (CONFIG.parcours.fin_beta, une seule constante) ; "" après la fin ou si
     l'appareil ne connaît pas le fuseau. maintenant : un instant (tests) */
  rebours(maintenant){
    try {
      const C = CONFIG.parcours || {}, m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(C.fin_beta || "");
      if (!m) return "";
      const p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: C.fuseau || "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
        .formatToParts(maintenant || new Date()).forEach(x => { p[x.type] = x.value; });
      const ici = p.year + "-" + p.month + "-" + p.day + "T" + (p.hour === "24" ? "00" : p.hour) + ":" + p.minute + ":" + p.second;
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(ici) || ici > C.fin_beta) return "";
      const n = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(+p.year, +p.month - 1, +p.day)) / 86400000);
      const T = PARCOURS_T.accueil;
      return n >= 2 ? trad(T.rebours_n, { n }) : n === 1 ? trad(T.rebours_un) : n === 0 ? trad(T.rebours_zero) : "";
    } catch(e){ return ""; }
  },
  html_accueil(){
    const T = PARCOURS_T.accueil, r = this.rebours(), M = CONFIG.marque || {};
    return `<button type="button" class="pc-langue" id="pc-langue" data-notr>${I18N.langue === "en" ? "🇫🇷 FR" : "🇺🇸 EN"}</button>
      <div class="pc-scene" aria-hidden="true"><div class="pc-scene-in">${this.animationHTML()}</div></div>
      ${M.logo ? `<img class="pc-logo" src="${esc(M.logo)}" alt="${esc(M.nom || "")}">` : ""}
      <p class="pc-scene-lu">${PARCOURS_T.accueil.scenes.map(s => this.t(s[1]) + (this.dispo(s[0]) ? "" : " (" + this.t(T.bientot) + ")")).join(" · ")}</p>
      <div class="pc-accueil-bas">
        <h1 class="pc-titre-serif">${this.t(T.titre)}</h1>
        <p class="pc-sous">${this.t(T.sous)}</p>
        <button type="button" class="btn-or pc-bouton" id="pc-go">${this.t(T.bouton)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        ${r ? `<p class="pc-rebours" id="pc-rebours">${esc(r)}</p>` : ""}
        <button type="button" class="pc-lien pc-lien-or" id="pc-connexion">${this.t(T.connexion)}</button>
      </div>`;
  },
  /* le téléphone dessiné et ses 5 scènes (15 s, en boucle) ; immobile si l'appareil demande moins de mouvement (la 1re scène) */
  animationHTML(){
    const A = PARCOURS_T.anim, T = PARCOURS_T.accueil, d = s => `style="animation-delay:${s}s"`;
    const coche = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>', plus = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
    const flamme = '<path class="pc-trait-or" d="M42 28c1.4 5.6 7 7 7 14a7 7 0 0 1-14 0c0-2.8 1.4-4.2 2.8-5.6 0 2.8 1.4 4.2 2.8 4.2 0-4.2-1.4-8.4 1.4-12.6z"/>';
    const jauge = t => `<svg class="pc-jauge" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" class="pc-jauge-fond"/><circle cx="42" cy="42" r="34" class="pc-jauge-or" transform="rotate(-90 42 42)" ${d(t)}/>${flamme}</svg>`;
    const fourchette = '<svg viewBox="0 0 24 24"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/></svg>';
    const scene = (n, contenu) => `<div class="pc-sc${n ? "" : " pc-sc-1"}" ${d(n * 3)}>${contenu}</div>`;
    const s1 = `<div class="pc-sc-titre">${this.t(A.aujourdhui)}</div>${jauge(0)}
      <div class="pc-barres">${[80, 55, 40].map(w => `<div><i style="width:${w}%" ${d(0)}></i></div>`).join("")}</div>
      ${A.repas.map((r, i) => `<div class="pc-ligne" ${d(0.3 + i * 0.25)}><span>${this.t(r)}</span><span class="pc-rond">${i ? plus : coche}</span></div>`).join("")}`;
    const s2 = `<div class="pc-sc-titre">${this.t(A.seance)}</div>
      <div class="pc-seg"><div><span class="pc-seg-h" ${d(3)}></span><span>${this.t(A.homme)}</span></div><div><span class="pc-seg-f" ${d(3)}></span><span>${this.t(A.femme)}</span></div></div>
      ${A.exos.map((x, i) => `<div class="pc-ligne pc-exo" ${d(3.3 + i * 0.25)}><span class="pc-lecture"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><span class="pc-exo-nom">${this.t(x)}</span><span class="pc-anim-case"><span ${d(4 + i * 0.25)}>${coche}</span></span></div>`).join("")}`;
    const s3 = `<div class="pc-sc-titre">${this.t(A.recettes)}</div><div class="pc-recettes">${[6.3, 6.55, 6.8, 7.05].map(t => `<div ${d(t)}><span class="pc-recette-rond">${fourchette}</span><span class="pc-trait pc-trait-1"></span><span class="pc-trait pc-trait-2"></span></div>`).join("")}</div>`;
    const s4 = `<div class="pc-sc-titre">${this.t(A.calculateur)}</div>${jauge(9)}
      ${A.macros.map((m, i) => `<div class="pc-macro"><div>${this.t(m)}</div><div class="pc-macro-fond"><i style="width:${[80, 60, 45][i]}%" ${d(9)}></i></div></div>`).join("")}`;
    const s5 = `<div class="pc-sc-titre">${this.t(A.progression)}</div>
      <svg class="pc-courbe" viewBox="0 0 168 116"><path class="pc-courbe-grille" d="M4 28H164M4 58H164M4 88H164"/><path class="pc-courbe-or" pathLength="300" d="M6 96C34 90 52 80 78 64S126 40 160 20" ${d(12)}/></svg>
      <div class="pc-pastilles"><span>${this.t(A.poids)}</span><span>${this.t(A.mensurations)}</span></div>`;
    const parts = [[40, 420, 0, 0], [330, 380, 1.2, 1], [60, 280, 2.4, 1], [350, 230, 0.6, 0], [25, 170, 3.1, 0], [360, 140, 4, 1]];
    return `<div class="pc-halo-or"></div><div class="pc-grille"></div>
      <svg class="pc-cercle-1" viewBox="0 0 400 400"><circle cx="200" cy="200" r="198"/></svg>
      <svg class="pc-cercle-2" viewBox="0 0 330 330"><circle cx="165" cy="165" r="163"/><circle class="pc-point" cx="165" cy="2" r="3.5"/></svg>
      ${parts.map(p => `<span class="pc-particule${p[3] ? " pc-blanche" : ""}" style="left:${p[0]}px;top:${p[1]}px;animation-delay:${p[2]}s"></span>`).join("")}
      <div class="pc-tel"><div class="pc-tel-flotte"><div class="pc-tel-cadre"></div><div class="pc-tel-reflet"></div><div class="pc-tel-ecran"><div class="pc-tel-encoche"></div>
        ${[s1, s2, s3, s4, s5].map((s, i) => scene(i, s)).join("")}<div class="pc-scan"></div></div></div></div>
      <div class="pc-fondu"></div>
      <div class="pc-etiquette">${T.scenes.map((s, i) => `<span class="pc-et" ${d(i * 3)}>${this.t(s[1])}${this.badge(s[0])}</span>`).join("")}</div>`;
  },
  brancher_accueil(){
    $("pc-go").addEventListener("click", () => this.afficher("objectif"));
    $("pc-connexion").addEventListener("click", () => {
      try { history.replaceState(null, "", location.pathname + location.search + "#/connexion"); } catch(e){}
      portail("connexion");
    });
    $("pc-langue").addEventListener("click", () => {
      const ok = I18N.choisir(I18N.langue === "en" ? "fr" : "en");
      if (ok) location.reload(); else this.afficher("accueil");
    });
  },

  /* ---------- 2. Objectif : un toucher = écran suivant ---------- */
  html_objectif(){
    const T = PARCOURS_T.objectif;
    return `<h1 class="pc-titre">${this.t(T.titre)}</h1>
      <div class="pc-cartes">${T.options.map(o => `<button type="button" class="pc-carte-choix" data-objectif="${esc(o[0])}"><span><b>${this.t(o[0])}</b><small>${this.t(o[1])}</small></span>${this.chevron()}</button>`).join("")}</div>
      <p class="pc-bas">${this.t(T.bas)}</p>`;
  },
  chevron(){ return '<svg class="pc-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'; },
  brancher_objectif(){
    $$("[data-objectif]").forEach(b => b.addEventListener("click", () => { this.maj({ objectif: b.dataset.objectif }); this.afficher("coince"); }));
  },

  /* ---------- 3. Coincé : 2 cases au plus (la 3e décoche la plus ancienne), réaction de la dernière cochée ---------- */
  html_coince(S){
    const T = PARCOURS_T.coince, ch = S.obstacle || [], ouvert = S.libre_ouvert || !!(S.libre && S.libre.trim());
    return `<h1 class="pc-titre pc-titre-long">${this.t(T.titre)}</h1><p class="pc-sous-titre">${this.t(T.sous)}</p>
      <div class="pc-options">${T.options.map(o => `<button type="button" class="pc-opt" role="checkbox" aria-checked="${ch.indexOf(o[0]) > -1}" data-k="${o[0]}"><span>${this.t(o[1])}</span><span class="pc-case-opt" aria-hidden="true"></span></button>`).join("")}</div>
      <button type="button" class="pc-lien pc-autre" id="pc-autre" aria-expanded="${ouvert}"${ouvert ? " hidden" : ""}>${this.t(T.autre)}</button>
      <div class="pc-libre" id="pc-libre-cadre"${ouvert ? "" : " hidden"}><label for="pc-libre" class="pc-cache">${this.t(T.autre)}</label><textarea id="pc-libre" rows="2" maxlength="${this.LIBRE_MAX}" placeholder="${esc(trad(T.exemple))}">${esc(S.libre || "")}</textarea></div>
      <div class="pc-reaction" id="pc-reaction" role="status" aria-live="polite"></div>
      <div class="pc-pied"><button type="button" class="btn-or pc-bouton" id="pc-suivant">${this.t(T.bouton)}</button></div>`;
  },
  reactionHTML(txt){ return txt ? `<span class="pc-etoile" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg></span><span>${this.t(txt)}</span>` : ""; },
  /* le bouton a l'air inactif tant qu'il manque la réponse (aria-disabled : touché, il ne fait rien) */
  actif(b, ok){ if (!b) return; b.setAttribute("aria-disabled", String(!ok)); b.classList.toggle("inactif", !ok); },
  brancher_coince(){
    const T = PARCOURS_T.coince, zoneR = $("pc-reaction"), suivant = $("pc-suivant"), libre = $("pc-libre");
    const maj = () => {
      const S = this.lire(), ch = S.obstacle || [], der = ch[ch.length - 1], o = T.options.find(x => x[0] === der);
      $$(".pc-opt").forEach(b => b.setAttribute("aria-checked", String(ch.indexOf(b.dataset.k) > -1)));
      zoneR.innerHTML = this.reactionHTML(o ? o[2] : ""); zoneR.hidden = !o;
      this.actif(suivant, ch.length > 0 || !!(S.libre || "").trim());
    };
    $$(".pc-opt").forEach(b => b.addEventListener("click", () => {
      let ch = (this.lire().obstacle || []).slice(); const k = b.dataset.k;
      if (ch.indexOf(k) > -1) ch = ch.filter(x => x !== k); else { ch.push(k); if (ch.length > 2) ch.shift(); }
      this.maj({ obstacle: ch }); maj();
    }));
    $("pc-autre").addEventListener("click", () => {
      this.maj({ libre_ouvert: true }); $("pc-libre-cadre").hidden = false; $("pc-autre").hidden = true; libre.focus();
    });
    libre.addEventListener("input", () => { this.maj({ libre: libre.value.slice(0, this.LIBRE_MAX) }); maj(); });
    suivant.addEventListener("click", () => { if (suivant.getAttribute("aria-disabled") !== "true") this.afficher("projection"); });
    maj();
  },

  /* ---------- 4. Dans 3 mois : une seule réponse, rien de pré-coché ---------- */
  html_projection(S){
    const T = PARCOURS_T.projection;
    return `<h1 class="pc-titre pc-titre-long">${this.t(T.titre)}</h1>
      <div class="pc-options" role="radiogroup">${T.options.map(o => `<button type="button" class="pc-opt pc-radio" role="radio" aria-checked="${S.projection === o[0]}" data-k="${o[0]}"><span>${this.t(o[1])}</span><span class="pc-case-opt" aria-hidden="true"></span></button>`).join("")}</div>
      <div class="pc-reaction" id="pc-reaction" role="status" aria-live="polite"></div>
      <div class="pc-pied"><button type="button" class="btn-or pc-bouton" id="pc-suivant">${this.t(T.bouton)}</button></div>`;
  },
  brancher_projection(){
    const T = PARCOURS_T.projection, zoneR = $("pc-reaction"), suivant = $("pc-suivant");
    const maj = () => {
      const k = this.lire().projection, o = T.options.find(x => x[0] === k);
      $$(".pc-opt").forEach(b => b.setAttribute("aria-checked", String(b.dataset.k === k)));
      zoneR.innerHTML = this.reactionHTML(o ? o[2] : ""); zoneR.hidden = !o;
      this.actif(suivant, !!o);
    };
    $$(".pc-opt").forEach(b => b.addEventListener("click", () => { this.maj({ projection: b.dataset.k }); maj(); }));
    suivant.addEventListener("click", () => { if (suivant.getAttribute("aria-disabled") !== "true") this.afficher("sexe"); });
    maj();
  },

  /* ---------- 5. Tu es ? : un toucher = écran suivant ---------- */
  html_sexe(){
    const T = PARCOURS_T.sexe;
    return `<h1 class="pc-titre">${this.t(T.titre)}</h1><p class="pc-sous-titre">${this.t(T.sous)}</p>
      <div class="pc-cartes">${T.options.map(o => `<button type="button" class="pc-carte-choix" data-sexe="${o[0]}"><span><b>${this.t(o[1])}</b></span>${this.chevron()}</button>`).join("")}</div>`;
  },
  brancher_sexe(){ $$("[data-sexe]").forEach(b => b.addEventListener("click", () => { this.maj({ sexe: b.dataset.sexe }); this.afficher("prenom"); })); },

  /* ---------- 6. Prénom ---------- */
  html_prenom(S){
    const T = PARCOURS_T.prenom;
    return `<h1 class="pc-titre">${this.t(T.titre)}</h1>
      <div class="pc-champ"><label for="pc-prenom">${this.t(T.etiquette)}</label><input id="pc-prenom" type="text" autocomplete="given-name" autocapitalize="words" maxlength="${this.PRENOM_MAX}" enterkeyhint="go" value="${esc(S.prenom || "")}"></div>
      <div class="pc-pied"><button type="button" class="btn-or pc-bouton" id="pc-suivant">${this.t(T.bouton)}</button></div>`;
  },
  brancher_prenom(){
    const c = $("pc-prenom"), b = $("pc-suivant");
    const maj = () => { this.maj({ prenom: c.value.slice(0, this.PRENOM_MAX) }); this.actif(b, !!c.value.trim()); };
    const go = () => { if (!c.value.trim()) return; this.maj({ prenom: c.value.trim().slice(0, this.PRENOM_MAX) }); this.afficher("chargement"); };
    c.addEventListener("input", maj);
    c.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); go(); } });
    b.addEventListener("click", go);
    this.actif(b, !!c.value.trim());
  },

  /* ---------- 7. Chargement : 4 coches (0,6 / 1,4 / 2,2 / 3,0 s), puis seul à l'écran suivant ---------- */
  libelle(liste, k){ const o = liste.find(x => x[0] === k); return o ? o[1] : ""; },
  coinceTexte(S){
    const ch = PARCOURS_T.coince.options.filter(o => (S.obstacle || []).indexOf(o[0]) > -1).map(o => trad(o[1]));
    if (ch.length) return ch.join(" · ");
    const l = Array.from((S.libre || "").replace(/\s+/g, " ").trim());
    return l.length > 40 ? l.slice(0, 40).join("") + "…" : l.join("");
  },
  html_chargement(S){
    const T = PARCOURS_T.chargement, P = PARCOURS_T;
    const lignes = [[T.objectif, trad(S.objectif || "")], [T.coince, this.coinceTexte(S)], [T.projection, trad(this.libelle(P.projection.options, S.projection))], [T.profil, trad(this.libelle(P.sexe.options, S.sexe))]];
    return `<div class="pc-charge">
        <svg class="pc-anneau" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30"/><path d="M36 6a30 30 0 0 1 30 30"/></svg>
        <h1 class="pc-titre" data-notr>${esc(typoFr(trad(T.titre, { p: (S.prenom || "").trim() })))}</h1>
        <div class="pc-carte-charge">${lignes.map((l, i) => `<div class="pc-coche-ligne"><span class="pc-coche" aria-hidden="true"><span style="animation-delay:${this.COCHES[i] / 1000}s"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></span></span><span><small>${this.t(l[0])}</small><b data-notr>${esc(typoFr(l[1]))}</b></span></div>`).join("")}</div>
      </div>
      <button type="button" class="pc-lien pc-suite" id="pc-suite">${this.t(T.suite)}</button>`;
  },
  brancher_chargement(){
    const aller = () => { if ($("pc") && $("pc").dataset.etape === "chargement") this.afficher("compte"); };
    $("pc-suite").addEventListener("click", aller);
    this._minuteurs.push(setTimeout(aller, this.SUITE));
  },

  /* ---------- 8. Compte : email, mot de passe, conditions (obligatoire), newsletter (facultative) ---------- */
  html_compte(S){
    const T = PARCOURS_T.compte, I = DECOUVERTE.inscription, E = PARCOURS_T.erreurs;
    const pris = S.erreur === "email_pris";
    return `<h1 class="pc-titre">${this.t(T.titre)}</h1><p class="pc-sous-titre">${this.t(T.sous)}</p>
      <div class="pc-champ"><label for="c-email">${this.t(T.email)}</label><input id="c-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="${esc(trad(T.exemple))}" value="${esc(S.email || "")}" enterkeyhint="next"${pris || S.erreur === "email" ? ' aria-invalid="true" class="manque"' : ""}>
        <p class="pc-erreur" id="pc-err-email" role="alert">${pris ? `${this.t(E.email_pris)} <button type="button" class="pc-lien pc-lien-or" id="pc-se-connecter">${this.t(E.connexion)}</button>` : S.erreur === "email" ? this.t(E.email) : ""}</p></div>
      <div class="pc-champ"><label for="c-mdp">${this.t(T.mdp)}</label><div class="co-mdp pc-mdp"><input id="c-mdp" type="password" autocomplete="new-password" enterkeyhint="done" value="${esc(this._mdp)}"><button type="button" class="voir" id="c-voir" aria-pressed="false">${this.t(T.afficher)}</button></div>
        <p class="pc-erreur" id="pc-err-mdp" role="alert"></p></div>
      <label class="pc-case co-cgu"><input type="checkbox" id="c-cgu"${S.cgu ? " checked" : ""}><span>${esc(trad(I.cgu_avant))} ${lienLegal("c-cgu-lien", "cgu_pdf", trad(I.cgu_lien))} ${esc(trad(I.cgu_entre))} ${lienLegal("c-politique-lien", "confidentialite_pdf", trad(I.politique_lien))}${esc(I.cgu_apres || "")}</span></label>
      <p class="pc-erreur" id="pc-err-cgu" role="alert"></p>
      <label class="pc-case co-newsletter"><input type="checkbox" id="c-newsletter"${S.newsletter ? " checked" : ""}><span>${this.t(T.newsletter, { m: (CONFIG.marque && CONFIG.marque.nom) || "" })}</span></label>
      <div class="pc-pied"><button type="button" class="btn-or pc-bouton" id="pc-suivant">${this.t(T.bouton)}</button></div>`;
  },
  brancher_compte(){
    const E = PARCOURS_T.erreurs, T = PARCOURS_T.compte, em = $("c-email"), mdp = $("c-mdp"), cgu = $("c-cgu"), nl = $("c-newsletter"), b = $("pc-suivant");
    const ok = () => this.emailValide(em.value.trim()) && mdp.value.length >= 8 && cgu.checked;
    const montrer = (id, txt, champ) => { const z = $(id); if (z) z.textContent = txt ? trad(txt) : ""; if (champ){ champ.classList.toggle("manque", !!txt); if (txt) champ.setAttribute("aria-invalid", "true"); else champ.removeAttribute("aria-invalid"); } };
    const maj = () => { this.maj({ email: em.value.trim().slice(0, 254), cgu: cgu.checked || undefined, newsletter: nl.checked || undefined }); this._mdp = mdp.value; this.actif(b, ok()); };
    em.addEventListener("input", () => { if (this.lire().erreur) this.maj({ erreur: undefined }); montrer("pc-err-email", "", em); maj(); });
    em.addEventListener("blur", () => { const v = em.value.trim(); montrer("pc-err-email", v && !this.emailValide(v) ? E.email : "", em); });
    mdp.addEventListener("input", () => { if (mdp.value.length >= 8) montrer("pc-err-mdp", "", mdp); maj(); });
    mdp.addEventListener("blur", () => montrer("pc-err-mdp", mdp.value && mdp.value.length < 8 ? E.mdp : "", mdp));
    cgu.addEventListener("change", () => { if (cgu.checked) montrer("pc-err-cgu", ""); maj(); });
    nl.addEventListener("change", maj);
    const voir = $("c-voir");
    voir.addEventListener("click", () => { const m = mdp.type === "password"; mdp.type = m ? "text" : "password"; voir.textContent = trad(m ? T.masquer : T.afficher); voir.setAttribute("aria-pressed", String(m)); });
    const pc = $("pc-se-connecter");
    if (pc) pc.addEventListener("click", () => this.versConnexion(em.value.trim()));
    em.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); mdp.focus(); } });
    mdp.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); b.click(); } });
    b.addEventListener("click", () => {
      maj();
      if (!ok()){
        /* touché inactif : il dit ce qui manque, dans l'ordre de l'écran */
        const v = em.value.trim();
        montrer("pc-err-email", !this.emailValide(v) ? E.email : "", em);
        montrer("pc-err-mdp", mdp.value.length < 8 ? E.mdp : "", mdp);
        montrer("pc-err-cgu", !cgu.checked ? DECOUVERTE.inscription.cgu_manque : "");
        const f = !this.emailValide(v) ? em : mdp.value.length < 8 ? mdp : null; if (f) f.focus();
        return;
      }
      this.maj({ erreur: undefined });
      this.afficher("whatsapp");
    });
    this.actif(b, ok());
  },
  /* « Se connecter » (email déjà utilisé) : l'écran de connexion, l'email déjà tapé */
  versConnexion(email){
    try { history.replaceState(null, "", location.pathname + location.search + "#/connexion"); } catch(e){}
    portail("connexion");
    const c = $("c-email"); if (c && email) c.value = email;
  },

  /* ---------- 9. WhatsApp : le numéro, puis le compte est créé ---------- */
  html_whatsapp(S){
    const T = PARCOURS_T.whatsapp;
    return `<p class="pc-surtitre">${this.t(T.surtitre)}</p><h1 class="pc-titre">${this.t(T.titre)}</h1>
      <div class="pc-champ"><label for="c-tel">${this.t(T.etiquette)}</label>${Telephone.champHTML("c-tel", S.tel, T.autre)}
        <p class="pc-erreur" id="pc-err-tel" role="alert"></p></div>
      <p class="pc-aide">${this.t(T.aide)}</p>
      <div class="pc-pied"><div id="co-err" class="erreur" role="alert"></div><p class="pc-note">${this.t(T.note)}</p>
        <button type="button" class="btn-or pc-bouton" id="c-go">${this.t(T.bouton)}</button>${Captcha.html("inscription")}</div>`;
  },
  brancher_whatsapp(){
    const sel = $("c-tel-ind"), c = $("c-tel"), b = $("c-go");
    const nettoyer = () => { [sel, c].forEach(x => { x.classList.remove("manque"); x.removeAttribute("aria-invalid"); }); $("pc-err-tel").textContent = ""; };
    [sel, c].forEach(x => x.addEventListener(x === sel ? "change" : "input", nettoyer));
    c.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); this.creer(); } });
    b.addEventListener("click", () => this.creer());
    try { Captcha.monter("inscription"); } catch(e){}
  },
  /* la création du compte : celle de l'inscription v72 (mêmes métadonnées, même clé contact, même code ?ref=) */
  /* le parcours demande toujours le numéro (écran WhatsApp, mission du 13/10) ; le réglage CONFIG.marque.telephone_obligatoire
     ne gouverne plus que l'écran « Ajoute ton numéro » des comptes déjà inscrits sans numéro (demarrage.js) */
  async creer(){
    const b = $("c-go"); if (!b || b.disabled || this._envoi) return;
    const S = this.lire(), E = PARCOURS_T.erreurs, err = msg => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = msg; } };
    const libelle = b.textContent;
    const T = Telephone.lire("c-tel");
    if (T.erreur){ $("pc-err-tel").textContent = trad(E.tel); [$("c-tel-ind"), $("c-tel")].forEach(x => { x.classList.add("manque"); x.setAttribute("aria-invalid", "true"); }); $("c-tel").focus(); return; }
    if (!this.possible("whatsapp", S)){ this.afficher(this.cible("whatsapp", S)); return; }   // mot de passe perdu (page rechargée)
    this.maj({ tel: T.tel });
    this._envoi = true; b.disabled = true; b.textContent = trad(PARCOURS_T.whatsapp.attente); err("");
    try {
      const jeton = Captcha.actif() ? await Captcha.prendreJeton() : "";
      if (!b.isConnected) return;
      Auth.persistant = true;
      const A = DECOUVERTE.accords, maintenant = new Date().toISOString();
      const connecte = await Auth.inscrire(S.email, this._mdp, (S.prenom || "").trim(), "", {
        consentement: maintenant, conditions_version: A.conditions,
        newsletter: S.newsletter ? maintenant : null, newsletter_version: A.newsletter }, jeton);
      if (!connecte){ this.maj({ etape: "compte" }); this._mdp = ""; portail("connexion"); ecranVerifieEmail(S.email); return; }   // confirmation d'email rallumée
      try { if (typeof Integre !== "undefined") Integre.noterInscription(); } catch(e){}
      const uid = Auth.utilisateur() && Auth.utilisateur().id;
      /* la clé contact : le numéro (s'il est demandé) et le code du lien, avec la date d'inscription ; rien sans l'un ni l'autre */
      const champs = {};
      if (T && T.tel) champs.telephone = T.tel;
      const ref = Provenance.locale(); if (ref) champs.ref = ref;
      if (Object.keys(champs).length){
        champs.inscrit_le = maintenant;
        try { await Contact.borne(Contact.enregistrer(champs, uid)); } catch(e){ if (uid) Contact.garderAttente(uid, champs); }
      }
      Provenance.oublier();
      /* les réponses partent dans intake après le rechargement (Parcours.suite : la session et toute l'app chargées) */
      this.maj({ etape: "espace", uid: uid || undefined, cree: maintenant, a_ecrire: true, tel: undefined, erreur: undefined });
      this._mdp = "";
      try { history.replaceState(null, "", Provenance.adresseSans()); } catch(e){ location.hash = ""; }
      location.reload();
      return;
    } catch(e){
      const m = String((e && e.message) || "").toLowerCase();
      const cap = Captcha.erreur(e); Captcha.apresEssai();
      if (!cap && (m.indexOf("already") > -1 || m.indexOf("registered") > -1)){ this.maj({ erreur: "email_pris" }); this.afficher("compte"); return; }
      if (!cap && m.indexOf("email") > -1 && m.indexOf("invalid") > -1){ this.maj({ erreur: "email" }); this.afficher("compte"); return; }
      /* même ordre que l'inscription v72 : limites et serveur d'emails avant « Pas de connexion » (une panne SMTP répond en 500) */
      err(cap ? cap
        : /email rate limit/.test(m) ? trad(DECOUVERTE.inscription.trop_emails)
        : /error sending|sending .*email|smtp/.test(m) ? trad(DECOUVERTE.inscription.envoi_rate, { p: CONFIG.marque.pseudo || "" })
        : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(DECOUVERTE.inscription.trop_demandes)
        : Auth.indispo(e) ? trad(E.reseau)
        : m.indexOf("disabled") > -1 || m.indexOf("not allowed") > -1 ? trad("Les inscriptions ne sont pas encore ouvertes.")
        : trad("Inscription impossible pour le moment. Réessaie dans une minute."));
    } finally { this._envoi = false; }
    if (b.isConnected){ b.disabled = false; b.textContent = libelle; }
  },

  /* ---------- après la création (session ouverte, demarrage.js) : réponses rangées, « Ton espace », cadeau ---------- */
  suiteDue(){
    try {
      const S = this.lire(), u = Auth.utilisateur();
      return this.APRES.indexOf(S.etape) > -1 && !!u && S.uid === u.id && Auth.estProspect() && !Store.idConsulte;
    } catch(e){ return false; }
  },
  /* les réponses au format des 3 questions de la v60 (textes français lisibles + clés), plus le sexe */
  reponses(S){
    const qo = Decouverte.defQ("obstacle"), qp = Decouverte.defQ("projection");
    const ch = qo.choix.map(c => c[0]).filter(k => (S.obstacle || []).indexOf(k) > -1), libre = (S.libre || "").trim().slice(0, this.LIBRE_MAX);
    const R = { probleme: S.objectif, obstacle: Decouverte.texteFr(qo, ch, libre), projection: Decouverte.texteFr(qp, [S.projection], ""), projection_choix: [S.projection], sexe: S.sexe };
    if (ch.length) R.obstacle_choix = ch;
    if (libre) R.obstacle_precision = libre;
    return R;
  },
  /* une seule écriture d'intake, après sa lecture ; rien par-dessus un questionnaire déjà rempli (autre onglet) */
  async enregistrer(){
    const S = this.lire(); if (!S.a_ecrire) return true;
    if (!(S.objectif && S.projection && S.sexe && ((S.obstacle && S.obstacle.length) || (S.libre && S.libre.trim())))){ this.maj({ a_ecrire: undefined }); return false; }
    let I = null;
    try { I = await Store.lire("intake", {}); } catch(e){ I = null; }
    if (!I || typeof I !== "object" || Store.nonLus.has(I)) return false;
    if (Decouverte.questionnaireFait(I)){ this.maj({ a_ecrire: undefined }); return true; }
    const J = Object.assign({}, I, this.reponses(S)), n = new Date().toISOString();
    Decouverte.poserObjectif(J);
    J.court_debut = J.court_debut || S.cree || n;
    J.court_le = n;
    J.parcours_le = n;   // v81 : arrivé par le nouveau parcours (carte cadeau de l'accueil ; plus de page « Ton plan d'action »)
    const mail = Decouverte.emailCompte(); if (mail) J.email_compte = mail;
    if (Store.ecrire("intake", J) === false) return false;
    try { await Promise.race([Store.envoyerCle("intake"), new Promise(r => setTimeout(r, 6000))]); } catch(e){}
    this.maj({ a_ecrire: undefined });
    try { if (typeof Tracking !== "undefined") Tracking.enregistrer("diagnostic_completed"); } catch(e){}
    return true;
  },
  /* v84 (ménage du bloc 3) : un parcours fait en anglais range la langue sur le compte (prefs.langue = "en", la préférence que
     lisent déjà le démarrage, la fiche du coach et Comptes) : le message WhatsApp de sa fiche sort alors en anglais. Sans
     migration ; une lecture d'abord, tous les autres champs gardés ; jamais par-dessus un choix déjà rangé (« fr » ou « en ») ;
     le français n'est jamais écrit (sans préférence, tout reste en français, comme avant). Seulement pour le compte créé à
     l'instant dans cet onglet (suiteDue) : les comptes existants ne changent pas. */
  async noterLangue(){
    if (I18N.langue !== "en") return;
    let pr = null;
    try { pr = await Store.lire("prefs", {}); } catch(e){ pr = null; }
    if (!pr || typeof pr !== "object" || Store.nonLus.has(pr) || pr.langue === "en" || pr.langue === "fr") return;
    if (Store.ecrire("prefs", Object.assign({}, pr, { langue: "en" })) === false) return;
    try { await Promise.race([Store.envoyerCle("prefs"), new Promise(r => setTimeout(r, 6000))]); } catch(e){}
  },
  async suite(){
    await this.enregistrer();
    try { await this.noterLangue(); } catch(e){}
    const S = this.lire();
    this.afficher(S.etape === "cadeau" ? "cadeau" : "espace");
  },
  prenomCompte(S){ const p = (S.prenom || (Auth.profil && Auth.profil.prenom) || "").trim(); return p; },

  /* ---------- 10. Ton espace ---------- */
  html_espace(S){
    const T = PARCOURS_T.espace, p = this.prenomCompte(S);
    const ico = {
      programme: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
      journal: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h6"/>',
      recettes: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
      calculateur: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
      suivi: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>' };
    const o = T.objectifs[S.objectif], s = T.profils[S.sexe];
    return `<h1 class="pc-titre pc-titre-espace" data-notr>${esc(typoFr(p ? trad(T.titre, { p }) : trad(T.titre_sans)))}</h1>
      <div class="pc-pastilles-espace">${o ? `<span class="pastille">${this.t(T.objectif, { o: trad(o) })}</span>` : ""}${s ? `<span class="pastille">${this.t(T.profil, { s: trad(s) })}</span>` : ""}</div>
      <div class="pc-fonctions">${T.cartes.map(c => `<div class="pc-fonction${this.dispo(c[0]) ? "" : " pc-plus-tard"}" data-fonction="${c[0]}"><span class="pc-fonction-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ico[c[0]]}</svg></span><span><b>${this.t(c[1])}${this.badge(c[0])}</b><small>${this.t(c[2])}</small></span></div>`).join("")}
        <div class="pc-verrou">🔒 <strong>${this.t(T.bilan)}</strong>${this.t(T.bilan_suite)}</div></div>
      <div class="pc-pied"><button type="button" class="btn-or pc-bouton" id="pc-suivant">${this.t(T.bouton)}</button></div>`;
  },
  brancher_espace(){ $("pc-suivant").addEventListener("click", () => { this.maj({ etape: "cadeau" }); this.afficher("cadeau"); }); },

  /* ---------- 11. Cadeau : plein écran, sans croix, une seule fois ---------- */
  html_cadeau(S){
    const T = PARCOURS_T.cadeau, C = T.courts, gras = v => "<strong>" + esc(v) + "</strong>";
    const oc = C[S.objectif] ? trad(C[S.objectif]) : "";
    const bl = PARCOURS_T.coince.options.map(o => o[0]).filter(k => (S.obstacle || []).indexOf(k) > -1).map(k => trad(C[k]));
    const remplir = (gabarit, v) => esc(typoFr(trad(gabarit))).replace(/\{(\w)\}/g, (x, k) => v[k] !== undefined ? v[k] : x);
    const bloque = bl.length === 2 ? remplir(T.et, { a: gras(bl[0]), b: gras(bl[1]) }) : bl.length === 1 ? gras(bl[0]) : "";
    const texte = oc ? (bloque ? remplir(T.avec, { o: gras(oc), b: bloque }) : remplir(T.sans, { o: gras(oc) })) : "";
    const photo = typeof PHOTO_COACH === "string" && /^data:image\/jpeg;base64,/.test(PHOTO_COACH) ? PHOTO_COACH : "";
    const M = CONFIG.marque || {};
    const ico = ['<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'];
    const cal = lienCalendly("cadeau");
    return `<div class="pc-cadeau-corps">
        <p class="pc-surtitre pc-surtitre-cadeau">${this.t(T.surtitre)}</p>
        <h1 class="pc-titre pc-titre-cadeau">${this.t(T.titre)}</h1>
        ${texte ? `<p class="pc-cadeau-texte" data-notr>${texte}</p>` : ""}
        <div class="pc-reperes">${T.reperes.map((r, i) => `<div><span class="pc-repere-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ico[i]}</svg></span><span>${this.t(r)}</span></div>`).join("")}</div>
        <div class="pc-coach">${photo ? `<img class="pc-photo" src="${photo}" alt="">` : `<span class="pc-photo pc-photo-logo">${M.logo ? `<img src="${esc(M.logo)}" alt="">` : ""}</span>`}<span>${this.t(T.coach)}</span></div>
      </div>
      <div class="pc-pied pc-pied-cadeau">${cal ? `<a class="btn-or pc-bouton" id="pc-reserver" href="${esc(cal)}" target="_blank" rel="noopener">${this.t(T.bouton)}</a>` : ""}
        <button type="button" class="pc-lien pc-plus-tard-lien" id="pc-plus-tard">${this.t(T.plus_tard)}</button></div>`;
  },
  brancher_cadeau(){
    const r = $("pc-reserver"), t = $("pc-plus-tard");
    if (r) r.addEventListener("click", () => this.finir("reserver"));   // le lien s'ouvre (nouvel onglet) ; ici, le clic est noté
    t.addEventListener("click", () => this.finir("plus_tard"));
  },
  /* le choix du cadeau, noté comme ceux de la page « Ton plan d'action » : la date du clic (clé challenge, cta.clics, origine
     « cadeau ») ou le « Plus tard » (cta.plus_tard), et intake.bilan_propose ; puis l'accueil de l'app */
  async finir(choix){
    if (this._envoi) return; this._envoi = true;
    try {
      await this.enregistrer();   // les réponses, si leur écriture avait raté à l'arrivée (réseau) : un nouvel essai avant d'oublier l'onglet
      /* v86 (lot 1 de la mission de nuit) : toujours pas enregistrées (lecture d'intake ratée : réseau, délai, 5xx) — avant, l'onglet
         était oublié et la page rechargée : les réponses disparaissaient sans un mot. Elles restent dans l'onglet, un message le dit,
         et elles repartent au toucher suivant (rien n'est noté, rien n'est rechargé). */
      if (this.lire().a_ecrire){
        this._envoi = false;
        UI.toast(trad("Tes réponses n'ont pas pu être enregistrées : vérifie ta connexion, puis touche à nouveau le bouton."), "mauvais", 9000);
        return;
      }
      const C = await Store.lire(Decouverte.cle, Decouverte.vide()).catch(() => null);
      const C2 = C && !Store.nonLus.has(C) ? C : Decouverte.vide();
      const note = choix === "reserver" ? Decouverte.clic(C2, "cadeau") : Decouverte.plusTard(C2, "cadeau");
      let I = null; try { I = await Store.lire("intake", {}); } catch(e){ I = null; }
      if (I && typeof I === "object" && !Store.nonLus.has(I) && !Decouverte.bilanPropose(I)){
        I.bilan_propose = { choix: choix === "reserver" ? "reserver" : "plus_tard", le: new Date().toISOString() };
        Store.ecrire("intake", I);
      }
      await Promise.race([Promise.resolve(note).then(() => Promise.all([Store.envoyerCle(Decouverte.cle), Store.envoyerCle("intake")])), new Promise(r => setTimeout(r, 6000))]);
    } catch(e){}
    this.oublier();
    try { history.replaceState(null, "", location.pathname + location.search + "#/accueil"); } catch(e){}
    location.reload();
  }
};
