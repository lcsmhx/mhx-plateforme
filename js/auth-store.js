/* --- AUTHENTIFICATION -------------------------------------------------
   Petit client maison : aucune librairie externe, tout passe par les
   points d'entree officiels de Supabase. La session est gardee dans le
   navigateur et rafraichie automatiquement. --------------------------- */
const Auth = {
  cleSession: "mhx_session",
  session: null,

  /* « Rester connecte » decide seulement d'OU la session est rangee :
     localStorage survit a la fermeture du navigateur, sessionStorage
     s'efface avec l'onglet. Sur un ordinateur partage, la case decochee
     est la seule chose qui empeche le suivant d'ouvrir la fiche. */
  persistant: true,
  magasin(){ return this.persistant ? localStorage : sessionStorage; },

  charger(){
    this.session = null;
    /* on regarde les deux : on ne sait pas ce que la personne avait choisi */
    for (const m of [localStorage, sessionStorage]){
      try {
        const brut = m.getItem(this.cleSession);
        if (brut){ this.session = JSON.parse(brut); this.persistant = (m === localStorage); break; }
      } catch(e){}
    }
    return this.session;
  },
  memoriser(s){
    if (s && s.access_token){
      s.expire_le = Date.now() + (s.expires_in || 3600) * 1000;
      this.session = s;
      /* on ecrit dans un seul des deux, et on nettoie l'autre : sinon une
         ancienne session tramerait et « rester connecte » ne voudrait
         plus rien dire */
      try { this.magasin().setItem(this.cleSession, JSON.stringify(s)); } catch(e){}
      try { (this.persistant ? sessionStorage : localStorage).removeItem(this.cleSession); } catch(e){}
    }
    return s;
  },
  oublier(){
    this.session = null;
    try { localStorage.removeItem(this.cleSession); } catch(e){}
    try { sessionStorage.removeItem(this.cleSession); } catch(e){}
  },
  connecte(){ return !!(this.session && this.session.access_token); },
  utilisateur(){ return this.session ? this.session.user : null; },

  /* v48 — plusieurs onglets (ou l'app installee + le navigateur) partagent la meme session.
     Supabase fait tourner le jeton de renouvellement : le premier onglet qui renouvelle range la
     nouvelle session ; les autres doivent la REPRENDRE, pas presenter l'ancien jeton (refuse,
     « deja utilise ») puis tout effacer — ce qui deconnectait tout le monde. */
  stockee(){
    for (const m of [localStorage, sessionStorage]){
      try { const brut = m.getItem(this.cleSession); if (brut){ const s = JSON.parse(brut); if (s && s.access_token) return s; } } catch(e){}
    }
    return null;
  },
  plusRecente(){
    const s = this.stockee(), c = this.session;
    if (!s || !c || !s.user || !c.user || s.user.id !== c.user.id) return null;   // jamais la session d'un autre compte
    if (s.refresh_token === c.refresh_token) return null;
    if (!(s.expire_le > Date.now() + 60000)) return null;
    if (c.expire_le && s.expire_le <= c.expire_le) return null;
    return s;
  },
  /* un autre onglet vient de ranger une session : meme compte → on la prend (evenement « storage ») */
  depuisAutreOnglet(e){
    if (!e || e.key !== this.cleSession || !e.newValue || !this.session || !this.session.user) return;
    try { const s = JSON.parse(e.newValue); if (s && s.access_token && s.user && s.user.id === this.session.user.id) this.session = s; } catch(err){}
  },

  async appel(chemin, options){
    options = options || {};
    const entetes = Object.assign({
      "apikey": CONFIG.supabase.cle,
      "Content-Type": "application/json"
    }, options.headers || {});
    if (options.avecJeton !== false && this.session && this.session.access_token){
      entetes["Authorization"] = "Bearer " + this.session.access_token;
    }
    const corps = options.body ? JSON.stringify(options.body) : undefined;
    const r = await fetch(CONFIG.supabase.url + chemin, {
      method: options.method || "GET",
      headers: entetes,
      body: corps,
      /* v48 : envoi qui doit survivre a la fermeture de l'onglet (limite du navigateur : 64 Ko) */
      keepalive: !!(options.keepalive && (!corps || corps.length < 60000))
    });
    const texte = await r.text();
    let data = null;
    try { data = texte ? JSON.parse(texte) : null; } catch(e){ data = texte; }
    if (!r.ok){
      /* v48 — jeton expire ou revoque en cours de route (onglet reste ouvert, telephone en veille) :
         un renouvellement, puis UN seul nouvel essai. Refuse = rien n'a ete applique : reessayer est sans risque. */
      if (r.status === 401 && options.avecJeton !== false && !options._reessai && this.session && this.session.refresh_token && !/^\/auth\/v1\/(token|logout)/.test(chemin)){
        if (await this.rafraichir()) return this.appel(chemin, Object.assign({}, options, { _reessai: true }));
      }
      const err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("Erreur " + r.status));
      err.statut = r.status;
      if (data && typeof data === "object" && data.code) err.code = data.code;
      throw err;
    }
    return data;
  },

  async rafraichir(){
    /* v48 : un seul renouvellement a la fois dans l'onglet (plusieurs enregistrements simultanes n'en lancent qu'un) */
    if (this._renouvellement) return this._renouvellement;
    this._renouvellement = (async () => {
      if (!this.session || !this.session.refresh_token) return false;
      const autre = this.plusRecente(); if (autre){ this.session = autre; return true; }   // un autre onglet l'a deja fait
      const jeton = this.session.refresh_token;
      try {
        const s = await this.appel("/auth/v1/token?grant_type=refresh_token", {
          method: "POST", avecJeton: false, body: { refresh_token: jeton }
        });
        this.memoriser(s); return true;
      } catch(e){
        /* renouvele ailleurs pendant ce temps : soit la session en memoire a deja ete remplacee (evenement
           « storage » d'un autre onglet), soit une plus recente est rangee */
        const reprise = () => {
          if (this.session && this.session.refresh_token !== jeton && this.session.expire_le > Date.now() + 60000) return true;
          const a = this.plusRecente(); if (a){ this.session = a; return true; }
          return false;
        };
        if (reprise()) return true;
        /* reseau coupe ou serveur indisponible : la session est gardee, on reessaiera (avant : tout etait efface,
           et un simple passage hors ligne deconnectait) */
        const rejete = e && e.statut >= 400 && e.statut < 500 && e.statut !== 408 && e.statut !== 429;
        if (!rejete) return false;
        /* jeton vraiment refuse. Un autre onglet est peut-etre en train de le renouveler (il l'a presente
           juste avant nous) : on lui laisse un instant, puis on reprend sa session s'il l'a rangee */
        let st = this.stockee();
        if (st && st.refresh_token === jeton){ await new Promise(r => setTimeout(r, 1500)); if (reprise()) return true; st = this.stockee(); }
        /* on n'efface que NOTRE session, jamais celle qu'un autre onglet vient de ranger */
        if (!st || st.refresh_token === jeton) this.oublier(); else this.session = null;
        if (typeof sessionPerdue === "function") setTimeout(sessionPerdue, 0);   // l'app tournait : retour a la connexion, avec un mot
        return false;
      }
    })();
    try { return await this._renouvellement; } finally { this._renouvellement = null; }
  },
  async assurer(){
    if (!this.connecte()) return false;
    if (this.session.expire_le && Date.now() > this.session.expire_le - 60000) return await this.rafraichir();
    return true;
  },

  /* La creation de comptes ne passe plus par /auth/v1/signup : cette route
     accepte la cle publique, qui est dans le fichier que tout le monde
     telecharge. N'importe qui pouvait donc se creer un compte et entrer dans
     l'espace, formation comprise. Elle passe par une fonction serveur qui
     verifie d'abord que l'appelant est bien un coach. */
  async creerAcces(email, motdepasse, prenom, nom, role){
    const r = await fetch(CONFIG.supabase.url + "/functions/v1/creer-acces", {
      method: "POST",
      headers: {
        "apikey": CONFIG.supabase.cle,
        "Authorization": "Bearer " + ((this.session && this.session.access_token) || ""),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, motdepasse, prenom, nom, role: role || "client" })
    });
    let d = null;
    try { d = await r.json(); } catch(e){}
    if (!r.ok) throw new Error((d && d.erreur) || "Création impossible.");
    return d;
  },

  async connecter(email, motdepasse){
    const s = await this.appel("/auth/v1/token?grant_type=password", {
      method: "POST", avecJeton: false, body: { email, password: motdepasse }
    });
    return this.memoriser(s);
  },
  /* Supabase ne redemande pas l'ancien mot de passe. On le verifie nous-memes :
     sinon un telephone laisse deverrouille suffit a se faire voler le compte. */
  async changerMotDePasse(actuel, nouveau){
    const u = this.utilisateur();
    if (!u || !u.email) throw new Error("Session expirée. Reconnecte-toi.");
    try {
      await this.appel("/auth/v1/token?grant_type=password", {
        method: "POST", avecJeton: false, body: { email: u.email, password: actuel }
      });
    } catch(e){ throw new Error("Ton mot de passe actuel n'est pas le bon."); }
    await this.appel("/auth/v1/user", { method: "PUT", body: { password: nouveau } });
  },

  /* Le changement d'email n'est effectif qu'apres confirmation sur la nouvelle
     adresse : c'est ce qui empeche d'enfermer quelqu'un hors de son compte. */
  async changerEmail(nouveau){
    return this.appel("/auth/v1/user?redirect_to=" + encodeURIComponent(this.retour()),
                      { method: "PUT", body: { email: nouveau } });
  },

  /* L'adresse ou revenir apres un lien recu par email. Supabase ne retient
     que le DOMAINE du « Site URL » de son tableau de bord et jette le chemin :
     un hebergement en sous-dossier renvoyait donc le client sur une page 404.
     On impose l'adresse exacte de l'application a chaque envoi — ce qui la
     rend aussi indifferente a l'hebergeur. */
  retour(){
    return location.origin + location.pathname;
  },

  /* Suppression definitive. Sans identifiant, on supprime SON propre compte —
     c'est le droit a l'effacement. Avec un identifiant, il faut etre coach.
     Le serveur reverifie tout, y compris le mot « SUPPRIMER » : l'ecran ne
     protege que ceux qui passent par l'ecran. */
  async supprimerCompte(id, confirmation){
    const r = await fetch(CONFIG.supabase.url + "/functions/v1/supprimer-acces", {
      method: "POST",
      headers: {
        "apikey": CONFIG.supabase.cle,
        "Authorization": "Bearer " + ((this.session && this.session.access_token) || ""),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: id || undefined, confirmation: confirmation })
    });
    let d = null;
    try { d = await r.json(); } catch(e){}
    if (!r.ok) throw new Error((d && d.erreur) || "Suppression impossible.");
    return d;
  },

  async motDePasseOublie(email){
    return this.appel("/auth/v1/recover?redirect_to=" + encodeURIComponent(this.retour()),
                      { method: "POST", avecJeton: false, body: { email } });
  },
  async deconnecter(){
    /* v51 : un double clic ne lance pas deux deconnexions (la 2e effacerait tout pendant que la 1re envoie encore) */
    if (this._deconnexion) return;
    this._deconnexion = true;
    try { await this.deconnecterUneFois(); } finally { this._deconnexion = false; }
  },
  async deconnecterUneFois(){
    /* v48 : ce qui attend part d'abord, avec le jeton ; s'il reste des modifications non envoyees (hors ligne),
       on le dit avant de tout effacer de l'appareil */
    /* v51 : l'activite du prospect part d'abord (sa copie locale est effacee avec le reste) */
    try { if (typeof Activite !== "undefined") await Promise.race([Activite.vider(), new Promise(r => setTimeout(r, 3000))]); } catch(e){}
    /* v59 (remarque 17) : l'écriture de checkins en cours (la file de Checkin : relecture, écriture, envoi) finit d'abord,
       8 s au plus — sinon sa copie sur l'appareil était comptée « non envoyée » alors que rien n'est hors ligne */
    try { if (typeof Checkin !== "undefined" && Checkin._file) await Promise.race([Checkin._file, new Promise(r => setTimeout(r, 8000))]); } catch(e){}
    try { await Promise.race([Store.toutEnvoyer(false), new Promise(r => setTimeout(r, 4000))]); } catch(e){}
    const moi = this.utilisateur();
    const nonEnvoyees = moi ? Object.values(Store.attenteLire()).filter(e => e && e.a === moi.id).length : 0;
    if (nonEnvoyees && !(await UI.confirmer(trad("Des modifications n'ont pas encore pu être envoyées (hors ligne). Si tu te déconnectes maintenant, elles seront perdues."), { ok: trad("Me déconnecter quand même"), danger: true }))) return;
    try { await this.appel("/auth/v1/logout", { method: "POST" }); } catch(e){}
    this.oublier();
    [localStorage, sessionStorage].forEach(m => {
      Object.keys(m).forEach(k => { if (k.indexOf("mhx_") === 0) m.removeItem(k); });
    });
    location.hash = "";
    location.reload();
  },

  /* Profil (prenom, nom, role) de la personne connectee */
  profil: null,
  async chargerProfil(){
    const u = this.utilisateur(); if (!u) return null;
    const r = await Auth.appel("/rest/v1/profils?id=eq." + u.id + "&select=*");
    this.profil = (r && r[0]) || null;
    return this.profil;
  },
  estCoach(){ return !!(this.profil && this.profil.role === "coach"); },
  /* v39 — compte gratuit : seulement si la base porte la colonne statut
     (sans elle, personne n'est prospect et rien ne change) */
  estProspect(){ return !!(this.profil && this.profil.role !== "coach" && this.profil.statut === "prospect"); },

  /* v39 — inscription libre (voir CONFIG.marque.inscription_libre). Le
     declencheur de la base cree le profil avec prenom et nom ; le statut
     « prospect » est la valeur par defaut de la colonne. Renvoie true si la
     personne est connectee tout de suite, false si un email de confirmation
     lui a ete envoye. */
  async inscrire(email, motdepasse, prenom, nom, extra){
    /* v44 : extra (date d'acceptation des conditions, version) reste dans les
       metadonnees du compte (raw_user_meta_data) : preuve horodatee, sans migration.
       v52 : le nom saisi a l'inscription part ici (le declencheur creer_profil le range dans profils.nom) */
    const s = await this.appel("/auth/v1/signup?redirect_to=" + encodeURIComponent(this.retour()), {
      method: "POST", avecJeton: false,
      body: { email: email, password: motdepasse, data: Object.assign({ prenom: prenom, nom: nom || "" }, extra || {}) }
    });
    if (s && s.access_token){ this.memoriser(s); return true; }
    return false;
  }
};

/* --- v52 : INTERRUPTEURS des nouveautés (CONFIG.nouveautes) -------------
   Une nouveauté qui remplace une habitude des clients se demande ici avant de s'afficher :
   Interrupteurs.visible("feedback_dimanche") pour la personne connectée, pourCompte(nom, uid) pour un
   compte donné (fiche du coach, par ex.). Toute valeur inconnue vaut "off" : une faute de frappe dans
   CONFIG ne montre jamais une nouveauté à tout le monde. (À ne pas confondre avec l'objet Nouveautes :
   les notifications du coach, clé coach_notifs.) ---------------------------- */
const Interrupteurs = {
  etat(nom){
    const v = (CONFIG.nouveautes || {})[nom];
    return v === "tous" || v === "test" ? v : "off";
  },
  estTest(uid){
    const l = (CONFIG.nouveautes || {}).comptes_test;
    return !!uid && Array.isArray(l) && l.indexOf(String(uid)) > -1;
  },
  pourCompte(nom, uid){
    const e = this.etat(nom);
    return e === "tous" || (e === "test" && this.estTest(uid));
  },
  visible(nom){
    const u = Auth.utilisateur();
    if (!u) return false;
    const e = this.etat(nom);
    if (e === "tous") return true;
    if (e === "test") return Auth.estCoach() || this.estTest(u.id);
    return false;
  }
};

/* --- v52 : ACCORDS donnés à l'inscription ---------------------------------
   Posés une fois dans les métadonnées du compte (Auth.inscrire → user_metadata) : consentement +
   conditions_version, consentement_sante + sante_version, newsletter (instant ou null) + newsletter_version
   (versions : DECOUVERTE.accords). Le coach ne lit pas ces métadonnées : à la première ouverture connectée
   d'un prospect, le choix de la newsletter est recopié dans la clé « emails » (table donnees), qu'il lit.
   L'ancien accord « emails de suivi » (emails_suivi, emails.suivi) ne vaut jamais accord newsletter. ------ */
const Accords = {
  meta(){
    const u = Auth.utilisateur(), m = u && u.user_metadata;
    return m && typeof m === "object" && !Array.isArray(m) ? m : {};
  },
  /* le choix de la case newsletter à l'inscription : true / false ; null si le compte ne l'a jamais vue
     (inscrit avant la v52, compte créé par le coach) */
  newsletterInscription(meta){
    meta = meta || this.meta();
    if (!Object.prototype.hasOwnProperty.call(meta, "newsletter")) return null;
    return typeof meta.newsletter === "string" && meta.newsletter.trim() !== "";
  },
  /* première ouverture d'un prospect : écrit la clé emails { newsletter, maj, version, source: "inscription" }
     SEULEMENT si elle n'existe pas encore. Lecture ratée → rien. Insertion simple (sans fusion) : si la clé est
     apparue entre-temps (autre onglet, Profil), la base refuse (409) et rien n'est écrasé. Jamais bloquant. */
  async copierEmails(){
    try {
      if (!Auth.estProspect() || Store.idConsulte) return false;
      const u = Auth.utilisateur(); if (!u || !u.id) return false;
      const meta = this.meta(), choix = this.newsletterInscription(meta);
      if (choix === null) return false;
      if (Store.aUneCopie(u.id, "emails")) return false;   // un choix fait sur cet appareil attend son envoi : c'est lui qui compte
      const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + u.id + "&outil=eq.emails&select=outil");
      if (!Array.isArray(r) || r.length) return false;      // déjà là (ou réponse inattendue) : rien à faire
      const iso = v => typeof v === "string" && !isNaN(Date.parse(v)) ? v : "";
      const contenu = { newsletter: choix, maj: (choix && iso(meta.newsletter)) || iso(meta.consentement) || new Date().toISOString(),
        version: typeof meta.newsletter_version === "string" ? meta.newsletter_version : null, source: "inscription" };
      await Auth.appel("/rest/v1/donnees", { method: "POST", headers: { "Prefer": "return=minimal" },
        body: [{ user_id: u.id, outil: "emails", contenu: contenu, maj_le: new Date().toISOString() }] });
      return true;
    } catch(e){ return false; }
  },
  /* v52 (lot G) : la newsletter vue par le coach, d'après la clé emails (fiche, export CSV). « oui » seulement si
     emails.newsletter vaut true ; clé absente ou illisible, ou ancien accord « emails de suivi » seul (suivi) : « non ».
     depuis : l'instant du dernier choix (maj), s'il est lisible. Lecture seule. */
  newsletterCoach(E){
    const oui = !!E && typeof E === "object" && !Array.isArray(E) && E.newsletter === true;
    const depuis = oui && typeof E.maj === "string" && /^\d{4}-\d{2}-\d{2}/.test(E.maj) && !isNaN(Date.parse(E.maj)) ? E.maj : null;
    return { oui, depuis };
  }
};

/* --- STOCKAGE ---------------------------------------------------------
   Meme interface qu'avant (lire / ecrire) : les outils n'ont pas
   conscience du changement. Les donnees vivent maintenant dans la base,
   donc elles suivent le client d'un appareil a l'autre. ---------------- */
/* ------------------------------------------------------------------
   FORME (v42) — un client peut ecrire n'importe quoi dans ses propres
   cles par l'API (la base le lui permet : ce sont ses donnees). A la
   lecture, on remet la STRUCTURE d'aplomb : un conteneur du mauvais type
   devient vide, une liste d'objets perd ses elements qui n'en sont pas.
   Les valeurs simples ne sont jamais touchees. Sur une donnee ecrite par
   l'application, c'est sans effet (verifie sur les donnees reelles).
   Modele : {} = objet (cles decrites), [] = liste, [modele] = liste d'objets.
   ------------------------------------------------------------------ */
const Forme = {
  modeles: {
    programme: { seances: [{ exercices: [{}] }], objectifs: { liste: [], statuts: [] } },
    journal: { seances: [{ exos: [{ series: [{}] }] }] },
    repas: { cible: {}, jours: [{ repas: [{}] }], repas: [{}], allergenes: [] },
    repas_suivi: { mange: {}, courses: {}, joursCourses: {}, hist: {} },
    mens: { mesures: [{ compo: {} }], zones: [], affichees: [] },   // vals : objet OU tableau selon l'age de la mesure (les deux sont lus)
    objectifs_faits: { faits: [] },
    checkins: { liste: [{ reponses: {} }] },
    complements: { liste: [{}] },
    hist_programme: { liste: [{}] },
    hist_repas: { liste: [{}] },
    photos: { liste: [{ vues: {} }] },
    challenge: { jours: {}, cta: { clics: [] } },   // cle lue par la Decouverte : cta.clics = liste (jours = ancien challenge, objet par numero)
    activite: { jours: [], pages: {} }              // v51 : activite du prospect (jours, pages vues, temps)
  },
  objet(v){ return !!v && typeof v === "object" && !Array.isArray(v); },
  appliquer(m, v){
    if (Array.isArray(m)){
      if (!Array.isArray(v)) return [];
      if (!m.length) return v;
      let change = false;
      const l = [];
      v.forEach(x => {
        if (!this.objet(x)){ change = true; return; }
        const y = this.appliquer(m[0], x); if (y !== x) change = true; l.push(y);
      });
      return change ? l : v;
    }
    if (!this.objet(v)) return {};
    let sortie = v;
    Object.keys(m).forEach(k => {
      if (!(k in v)) return;
      if (v[k] == null && !Array.isArray(m[k])) return;   // objet vide ou absent : le code sait faire
      const n = this.appliquer(m[k], v[k]);
      if (n !== v[k]){ if (sortie === v) sortie = Object.assign({}, v); sortie[k] = n; }
    });
    return sortie;
  },
  /* le contenu d'une cle : null s'il n'est pas un objet (comme absent) */
  cle(cle, v){
    if (!this.objet(v)) return null;
    const m = this.modeles[cle];
    return m ? this.appliquer(m, v) : v;
  }
};

const Store = {
  /* Le cache est range PAR UTILISATEUR. Avant, il etait commun : ouvrir la
     fiche de Marie apres celle de Jean pouvait afficher — et reenregistrer —
     les donnees de Jean chez Marie. */
  boites: {},
  attente: {},
  valeursEnAttente: {},   // v45 : la valeur qui attend son envoi (700 ms), par cle ; effacee quand l'envoi part
  charge: {},          // le GET a-t-il reussi ? on n'ecrase pas ce qu'on n'a pas pu lire
  idConsulte: null,    // quand le coach consulte la fiche d'un client
  /* v38 — cles rangees chez le client mais ecrites par le coach seul, par
     leur propre chemin (Feedback, NotesCoach) : jamais par ecrire(), envoyer()
     ni une restauration de sauvegarde. La base le refuse de toute facon. */
  clesCoachSeul: ["feedbacks", "notes_coach", "suivi_prospect"],   // v49 : + suivi commercial (jamais ecrit par Store.ecrire)
  /* v42 — objet lu -> compte pour lequel il a ete lu. Une page perimee (lecture
     finie apres un changement de fiche) ne doit jamais ecrire chez le compte
     affiche ce qu'elle a lu pour un autre. */
  origines: new WeakMap(),
  /* objets rendus apres une lecture RATEE : jamais ecrits, quel que soit le drapeau
     (une lecture plus ancienne qui reussit apres coup remet charge[k] a true) */
  nonLus: new WeakSet(),

  cible(){ return this.idConsulte || (Auth.utilisateur() && Auth.utilisateur().id); },
  lectureSeule(){ return !!this.idConsulte; },
  boite(uid){ const k = uid || "_"; return this.boites[k] || (this.boites[k] = {}); },
  /* les outils ecrivent Store.cache[cle] : on leur sert la boite du moment */
  get cache(){ return this.boite(this.cible()); },

  async lire(cle, defaut){
    const uid = this.cible(); if (!uid) return defaut;
    const k = uid + "|" + cle;
    try {
      const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(cle) + "&select=contenu");
      const contenu = Forme.cle(cle, r && r[0] && r[0].contenu);   // v42 : structure remise d'aplomb
      const val = contenu ? Object.assign({}, defaut, contenu) : defaut;
      if (val && typeof val === "object"){ this.origines.set(val, uid); this.nonLus.delete(val); }
      this.boite(uid)[cle] = val;
      this.charge[k] = true;
      return val;
    } catch(e){
      /* lecture ratee : on rend le defaut pour l'affichage, mais on interdit
         l'ecriture — sinon un simple probleme de reseau ecraserait la vraie
         fiche du client par un formulaire vide. */
      this.charge[k] = false;
      if (defaut && typeof defaut === "object"){ this.origines.set(defaut, uid); this.nonLus.add(defaut); }
      return defaut;
    }
  },

  /* Plusieurs cles en UNE seule requete (l'accueil en lit sept). Renvoie
     { cle: contenu | null }. Ne touche ni au cache ni aux drapeaux de
     lecture : chaque outil continue de faire son propre lire() avec ses
     valeurs par defaut. */
  async lireTout(cles, opts){
    const uid = this.cible(); const out = {}, dates = {};
    cles.forEach(k => { out[k] = null; });
    if (!uid) return (opts && opts.dates) ? { valeurs: out, dates } : out;
    try {
      const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=in.(" + cles.map(encodeURIComponent).join(",") + ")&select=outil,contenu,maj_le");
      (r || []).forEach(l => { if (l && l.outil in out){ out[l.outil] = Forme.cle(l.outil, l.contenu); dates[l.outil] = l.maj_le || null; } });
    } catch(e){}
    return (opts && opts.dates) ? { valeurs: out, dates } : out;
  },

  /* une operation commencee sur une fiche s'est terminee sur une autre : rien n'est ecrit, on le dit */
  ficheChangee(){ try { UI.toast("Modification non enregistrée : la fiche a changé pendant l'opération.", "attention"); } catch(e){} },
  /* la lecture de cette cle a echoue : on n'ecrit pas (sinon on ecraserait la vraie fiche), et on le dit */
  avis: {},
  lectureRatee(k){
    const t = Date.now(); if (this.avis[k] && t - this.avis[k] < 10000) return; this.avis[k] = t;
    try { UI.toast(this.idConsulte ? "Non enregistré : les données de ce client n'ont pas pu être chargées. Recharge la page." : trad("Non enregistré : tes données n'ont pas pu être chargées. Recharge la page."), "mauvais"); } catch(e){}
  },

  /* renvoie true si l'ecriture part (dans 700 ms), false si elle est refusee */
  ecrire(cle, valeur){
    const uid = this.cible(); if (!uid) return false;
    if (this.clesCoachSeul.indexOf(cle) > -1) return false;
    const origine = valeur && typeof valeur === "object" ? this.origines.get(valeur) : undefined;
    if (origine && origine !== uid){ console.warn("[MHX] écriture refusée : « " + cle + " » a été lu pour un autre compte (page quittée entre-temps)"); this.ficheChangee(); return false; }
    this.boite(uid)[cle] = valeur;
    /* seule exception a la lecture seule : le coach ecrit le programme et les repas */
    /* Ce que le coach a le droit d'ecrire dans la fiche d'un client. Doit
       rester aligne sur MODIFIABLES (plus bas) ET sur les regles de la base :
       les complements y manquaient, donc ce que le coach saisissait pour un
       client disparaissait a la fermeture, sans aucun message. */
    if (this.lectureSeule() && !(Auth.estCoach() && ["programme", "repas", "calc", "complements"].indexOf(cle) > -1)) return false;
    const k = uid + "|" + cle;
    if (this.charge[k] === false || this.nonLus.has(valeur)){ this.lectureRatee(k); return false; }   // on n'a pas pu lire : on n'ecrit pas, et on le dit
    clearTimeout(this.attente[k]);
    /* l'identifiant est fige ici : si le coach change de fiche pendant les
       700 ms d'attente, l'enregistrement part quand meme chez le bon client */
    this.valeursEnAttente[k] = valeur;
    const t = this.garder(uid, cle, valeur);   // v48 : une copie reste sur l'appareil jusqu'a l'arrivee au serveur
    this.tEnAttente[k] = t;
    this.attente[k] = setTimeout(() => { delete this.attente[k]; delete this.valeursEnAttente[k]; delete this.tEnAttente[k]; this.envoyer(cle, valeur, uid, t); }, 700);
    return true;
  },

  /* ---------- v48 : ce qui n'est pas encore arrive au serveur reste sur l'appareil ----------
     Fermer l'app dans la seconde, perdre le reseau ou la session ne perd plus une saisie : une copie
     (rangee au meme endroit que la session : « Rester connecte » decoche = elle disparait avec
     l'onglet ; une cle par copie, « mhx_attente|compte|cle », pour que deux onglets ne s'ecrasent
     jamais) repart d'elle-meme — retour du reseau, retour sur l'onglet, nouvel essai toutes les 30 s,
     demarrage suivant — UNIQUEMENT si le serveur n'a rien de plus recent, et jamais apres une
     saisie plus recente de ce meme onglet. Une copie ecartee (plus recent ailleurs) est signalee. */
  PREFIXE_ATTENTE: "mhx_attente|",
  tEnAttente: {},
  dernierT: {},   // « compte|cle » → instant de la saisie la plus recente deja partie de cet onglet
  retenues: new Set(),   // v59 : « compte|cle » dont la copie attend une ecriture en cours dans cet onglet (Checkin : relecture avant d'ecrire)
  attenteLire(){
    const out = {}, P = this.PREFIXE_ATTENTE;
    try {
      const m = Auth.magasin();
      for (let i = 0; i < m.length; i++){
        const c = m.key(i); if (!c || c.indexOf(P) !== 0) continue;
        let e = null; try { e = JSON.parse(m.getItem(c)); } catch(err){ e = null; }
        out[c.slice(P.length)] = (e && typeof e === "object") ? e : null;
      }
    } catch(e){}
    return out;
  },
  garder(uid, cle, valeur){
    const u = Auth.utilisateur(), t = new Date().toISOString();
    if (!u || !u.id) return t;
    try { Auth.magasin().setItem(this.PREFIXE_ATTENTE + uid + "|" + cle, JSON.stringify({ a: u.id, t: t, v: valeur })); } catch(e){}   // appareil plein ou stockage interdit : comme avant la v48
    return t;
  },
  aUneCopie(uid, cle){ try { return !!Auth.magasin().getItem(this.PREFIXE_ATTENTE + uid + "|" + cle); } catch(e){ return false; } },
  /* retire la copie une fois la modification arrivee — seulement si c'est bien elle (pas une plus recente) */
  lacher(uid, cle, t, valeur){
    const c = this.PREFIXE_ATTENTE + uid + "|" + cle;
    try {
      const brut = Auth.magasin().getItem(c); if (!brut) return;
      let e = null; try { e = JSON.parse(brut); } catch(err){ e = null; }
      const meme = !e || (t ? e.t === t : (valeur === undefined || JSON.stringify(e.v) === JSON.stringify(valeur)));
      if (meme) Auth.magasin().removeItem(c);
    } catch(e){}
  },
  /* « Rester connecte » a change depuis la derniere fois : les copies du meme compte restees dans l'autre
     rangement sont rapatriees (sinon elles resteraient orphelines) */
  rapatrier(uid){
    try {
      const ici = Auth.magasin(), autre = ici === localStorage ? sessionStorage : localStorage, P = this.PREFIXE_ATTENTE, cles = [];
      for (let i = 0; i < autre.length; i++){ const c = autre.key(i); if (c && c.indexOf(P) === 0) cles.push(c); }
      cles.forEach(c => {
        let e = null; try { e = JSON.parse(autre.getItem(c)); } catch(err){}
        if (!e || e.a !== uid) return;
        let x = null; try { x = JSON.parse(ici.getItem(c)); } catch(err){}
        if (!x || !(typeof x.t === "string" && x.t >= e.t)) ici.setItem(c, JSON.stringify(e));
        autre.removeItem(c);
      });
    } catch(e){}
  },
  /* l'onglet se cache ou se ferme (vite : keepalive, sans renouvellement) ou la personne se deconnecte
     (vite === false : avec le jeton, on attend les reponses) : ce qui attendait ses 700 ms part tout de suite */
  /* v52 : annule l'ecriture en attente (700 ms) d'une cle et retire sa copie de l'appareil : elle ne partira pas
     (garde-fou 18 ans du calculateur : rien de ce qu'une personne mineure a saisi ne doit rester) */
  annuler(cle){
    const uid = this.cible(); if (!uid) return;
    const k = uid + "|" + cle;
    if (this.attente[k]) clearTimeout(this.attente[k]);
    delete this.attente[k]; delete this.valeursEnAttente[k]; delete this.tEnAttente[k];
    try { Auth.magasin().removeItem(this.PREFIXE_ATTENTE + uid + "|" + cle); } catch(e){}
  },
  /* v51 : envoie tout de suite la valeur en attente d'une cle (sans attendre les 700 ms) et attend la reponse */
  envoyerCle(cle){
    const uid = this.cible(); if (!uid) return Promise.resolve();
    const k = uid + "|" + cle, v = this.valeursEnAttente[k];
    if (v === undefined || !this.attente[k]) return Promise.resolve();
    const t = this.tEnAttente[k];
    clearTimeout(this.attente[k]); delete this.attente[k]; delete this.valeursEnAttente[k]; delete this.tEnAttente[k];
    return Promise.resolve(this.envoyer(cle, v, uid, t, false)).catch(() => {});
  },
  toutEnvoyer(vite){
    const envois = [];
    Object.keys(this.attente).forEach(k => {
      const v = this.valeursEnAttente[k]; if (v === undefined) return;
      const t = this.tEnAttente[k];
      clearTimeout(this.attente[k]); delete this.attente[k]; delete this.valeursEnAttente[k]; delete this.tEnAttente[k];
      const i = k.indexOf("|");
      envois.push(this.envoyer(k.slice(i + 1), v, k.slice(0, i), t, vite !== false));
    });
    return Promise.all(envois);
  },
  /* v59 (remarque 3) : la page se ferme (pagehide, écouté par Checkin) pendant une relecture : la copie des saisies
     retenues (Store.retenues : la copie affichée et les saisies qui attendent, à l'instant de la saisie) part tout de suite,
     avec keepalive — ce que la v58 envoyait à la fermeture ; seulement celle du compte connecté */
  envoyerRetenues(){
    const u = Auth.utilisateur(), envois = [];
    if (!u || !u.id || !this.retenues.size) return Promise.resolve();
    const o = this.attenteLire();
    this.retenues.forEach(k => {
      const e = o[k], i = k.indexOf("|"), uid = k.slice(0, i);
      if (!e || e.a !== u.id || uid !== u.id || typeof e.t !== "string") return;
      envois.push(this.envoyer(k.slice(i + 1), e.v, uid, e.t, true));
    });
    return Promise.all(envois);
  },
  planifierReprise(){
    if (this._reprise) return;
    this._reprise = setTimeout(() => { this._reprise = null; this.reprendre(); }, 30000);
  },
  /* renvoie ce qui attend pour le compte connecte, si le serveur n'a rien de plus recent */
  async reprendre(auDemarrage){
    if (this._reprend) return;
    const u = Auth.utilisateur(); if (!u || !u.id) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (auDemarrage) this.rapatrier(u.id);
    const o = this.attenteLire(), cles = Object.keys(o); if (!cles.length) return;
    this._reprend = true;
    let reste = false; const ecartees = [];
    try {
      for (const k of cles){
        const e = o[k], i = k.indexOf("|"), uid = k.slice(0, i), cle = k.slice(i + 1);
        if (this.attente[k] || this.retenues.has(k)) continue;   // une saisie en cours : son propre envoi part dans la seconde (v59 : ou apres sa relecture)
        if (!e || typeof e.t !== "string" || !uid || !cle || this.clesCoachSeul.indexOf(cle) > -1){ this.lacher(uid, cle); continue; }
        /* ecrite par un autre compte sur cet appareil : jamais envoyee ; retiree seulement au demarrage */
        if (e.a !== u.id){ if (auDemarrage) this.lacher(uid, cle); continue; }
        try {
          const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(cle) + "&select=maj_le");
          const m = r && r[0] && r[0].maj_le;
          /* relue apres la lecture (lente quand le reseau revient) : une saisie plus recente a pu arriver */
          const cur = this.attenteLire()[k];
          if (!cur || cur.t !== e.t || this.attente[k]){ if (cur && cur.t !== e.t) reste = true; continue; }
          const ms = m ? new Date(m).getTime() : NaN, ts = new Date(e.t).getTime();
          /* meme instant : la copie etait deja arrivee (envoi a la fermeture de l'onglet) → retiree sans rien dire ;
             serveur strictement plus recent : on ne l'ecrase pas, et on le dit */
          if (m && !(ms < ts)){
            /* v51 : l'activite du prospect n'est pas une saisie : sans message, la copie reste sur l'appareil et Activite
               la fusionne (maximum) au prochain envoi, qui la remplace ; elle n'est retiree que s'il n'y a plus de suivi */
            if (cle === "activite" && ms > ts && typeof Activite !== "undefined" && Activite.suivi() && uid === u.id){ Activite.rattraper(e.v, uid); continue; }
            this.lacher(uid, cle, e.t);
            if (cle === "activite") continue;
            if (ms > ts) ecartees.push({ cle: cle, t: e.t, autre: uid !== u.id }); continue;
          }
          await this.envoyer(cle, e.v, uid, e.t, false, true);
          if (this.attenteLire()[k]) reste = true;
        } catch(err){ reste = true; }
      }
    } finally { this._reprend = false; }
    if (ecartees.length){
      const nom = c => { const x = (typeof OUTILS !== "undefined" ? OUTILS : []).find(y => y.cle === c); return x ? trad(nomOnglet(x)) : c === "emails" ? trad(DECOUVERTE.emails.titre) : c; };   // v52 : « Newsletter »
      const jourLocal = t => { const d = new Date(t); return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      try { UI.toast(trad("Une modification faite hors ligne n'a pas été envoyée ({o}, {d}) : une version plus récente existe déjà.", { o: ecartees.map(x => nom(x.cle) + (x.autre ? " · " + trad("fiche d'un client") : "")).join(", "), d: dateFr(jourLocal(ecartees[0].t)) }), "attention", 9000); } catch(e){}
    }
    if (reste) this.planifierReprise();
  },
  async envoyer(cle, valeur, uidFige, t, vite, repris){
    const uid = uidFige || this.cible(); if (!uid) return;
    if (this.clesCoachSeul.indexOf(cle) > -1) return;
    const k = uid + "|" + cle, tt = t || new Date().toISOString();
    /* une copie REPRISE ne passe jamais apres une saisie plus recente de cet onglet (reprise lente, retour sur
       l'onglet) ; une saisie fraiche passe toujours (une horloge qui recule ne doit rien faire perdre) */
    if (repris && this.dernierT[k] && tt < this.dernierT[k]){ this.lacher(uid, cle, t); return; }
    if (!this.dernierT[k] || tt > this.dernierT[k]) this.dernierT[k] = tt;
    majEtat("enregistrement");
    try {
      if (!vite) await Auth.assurer();   // en quittant la page : pas le temps d'un renouvellement (la copie gardee prend le relais)
      await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        /* v48 : maj_le = l'instant de la saisie (un envoi repris plus tard garde sa vraie date) */
        body: [{ user_id: uid, outil: cle, contenu: valeur, maj_le: tt }],
        keepalive: !!vite
      });
      this.lacher(uid, cle, t, valeur);
      majEtat("enregistre");
    } catch(e){
      /* refus definitif (droits, requete invalide) : un nouvel essai n'y changerait rien, la copie est retiree, on le dit */
      if (e && e.statut >= 400 && e.statut < 500 && [401, 408, 429].indexOf(e.statut) === -1){ console.warn("[MHX] enregistrement refusé", cle, e.statut); this.lacher(uid, cle, t, valeur); majEtat("refuse"); return; }
      this.planifierReprise();
      majEtat(this.aUneCopie(uid, cle) ? "erreur" : "perdu");   // « gardé sur cet appareil » seulement s'il l'est vraiment
    }
  },

  /* Vide le cache d'un client : appele quand on change de fiche. */
  oublier(uid){
    const k = uid || "_";
    /* v42 : les envois en attente partent quand meme (compte fige dans ecrire) :
       les annuler perdait un « Programme envoyé » suivi d'un retour rapide */
    delete this.boites[k];
    Object.keys(this.charge).forEach(x => { if (x.indexOf(k + "|") === 0) delete this.charge[x]; });
  },

  /* cles ecrites par la personne sans outil a elles (v51 : activite du prospect, choix des emails de suivi ;
     v52 : calc_perso, le calcul du prospect lui-meme — le calculateur garde « calc », la cle du coach) */
  clesSansOutil: ["activite", "emails", "calc_perso"],
  /* Sauvegarde manuelle : toujours disponible, en plus de la base */
  exporter(){
    const out = {};
    OUTILS.map(o => o.cle).concat(this.clesSansOutil).forEach(k => {
      if (!k || !this.cache[k]) return;
      /* v59 : garde-fou 18 ans, comme importer — un calcul fait avec un age sous le minimum (tape, jamais enregistre :
         le cache suit le formulaire) ne part pas dans la copie */
      if (k === "calc_perso" && outilCalculateur.mineur(this.cache[k])) return;
      out[k] = this.cache[k];
    });
    return JSON.stringify({ plateforme:"mhx", version:2, donnees: out });
  },

  /* L'export ci-dessus ne contient que ce que la personne a ouvert pendant sa
     visite. Pour le droit d'acces (RGPD art. 15), il faut TOUT : on relit la
     base, pas le cache. */
  async exportComplet(){
    const u = Auth.utilisateur();
    const uid = this.cible();
    const lignes = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&select=outil,contenu,maj_le");
    const profil = await Auth.appel("/rest/v1/profils?id=eq." + uid + "&select=*");
    const donnees = {};
    (lignes || []).forEach(l => { donnees[l.outil] = { contenu: l.contenu, modifie_le: l.maj_le }; });
    return {
      plateforme: "MHX Coaching",
      export_du: new Date().toISOString(),
      compte: {
        identifiant: uid,
        email: (u && u.email) || null,
        prenom: (profil && profil[0] && profil[0].prenom) || null,
        nom: (profil && profil[0] && profil[0].nom) || null,
        cree_le: (profil && profil[0] && profil[0].cree_le) || null
      },
      donnees: donnees
    };
  },
  async importer(texte){
    const p = JSON.parse(texte);
    const d = (p && p.donnees) ? p.donnees : p;
    if (!d || typeof d !== "object") throw new Error("format");
    /* On ne restaure que des outils qui existent. Et un client ne peut pas
       ecraser ce que le coach a prepare pour lui (programme, repas,
       calories) avec une vieille copie : ca, c'est le coach qui le decide. */
    const connues = OUTILS.map(o => o.cle).filter(Boolean).concat(this.clesSansOutil);
    const duCoach = ["programme", "repas", "calc"];
    let n = 0;
    for (const cle in d){
      /* v38 : une vieille copie (ou une copie retouchee) ne remplace jamais
         un feedback ou une note du coach, pas meme depuis le compte coach */
      if (this.clesCoachSeul.indexOf(cle) > -1) continue;
      if (connues.indexOf(cle) === -1) continue;
      if (!Auth.estCoach() && duCoach.indexOf(cle) > -1) continue;
      /* v51 : une vieille sauvegarde ne rallume pas les emails de suivi apres une desinscription, et ne remplace pas
         la mesure d'activite (elles restent dans l'export, droit d'acces) */
      if (cle === "emails" || cle === "activite") continue;
      if (!d[cle] || typeof d[cle] !== "object") continue;
      /* v52 : garde-fou 18 ans du calculateur — un calcul fait avec un age sous le minimum n'est jamais restaure */
      if (cle === "calc_perso" && outilCalculateur.mineur(d[cle])) continue;
      this.cache[cle] = d[cle]; await this.envoyer(cle, d[cle]); n++;
    }
    if (!n) throw new Error("vide");
    return true;
  }
};

/* ------------------------------------------------------------------
   CATALOGUE PARTAGE — aliments, recettes et programmes prets a l'emploi.
   Ces trois tables vivent dans Supabase : tu peux y ajouter une recette
   ou un programme sans jamais retoucher a ce fichier.
   Tout le monde les lit ; seul le coach peut les modifier.
   ------------------------------------------------------------------ */
const Catalogue = {
  _c: {},
  /* Une requete PostgREST renvoie au maximum 1 000 lignes. Sans pagination,
     on ne recevait que le premier millier d'aliments par ordre alphabetique :
     tout ce qui vient apres — du skyr au yaourt — etait introuvable, et les
     recettes qui les utilisent s'affichaient a 0 kcal avec un avertissement
     « ingredients absents ». Le secours GitHub ne se declenchait pas, puisque
     la table n'etait pas vide. On lit donc page par page jusqu'au bout. */
  async lire(table){
    if (this._c[table]) return this._c[table];
    const PAGE = 1000;
    const tout = [];
    try {
      for (let debut = 0; ; debut += PAGE){
        const lot = await Auth.appel("/rest/v1/" + table + "?select=*&order=id.asc", {
          headers: { "Range-Unit": "items", "Range": debut + "-" + (debut + PAGE - 1) }
        });
        if (!lot || !lot.length) break;
        tout.push.apply(tout, lot);
        /* si le serveur renvoie plus que la page demandee, c'est qu'il ignore
           l'en-tete Range : il nous a deja tout donne, inutile d'insister */
        if (lot.length !== PAGE) break;
        if (debut > 50000) break;          // garde-fou
      }
      this._c[table] = tout;
    } catch(e){ this._c[table] = tout.length ? tout : []; }
    /* Secours : si la table est vide — base en pause, import jamais lancé —
       on lit directement le dépôt. Les aliments passent par la MEME
       normalisation que l'import : sans elle, on servirait des plans batis
       sur des etiquettes de regime non verifiees, ce qui est precisement
       le risque que l'import existe pour ecarter. */
    if (!this._c[table].length){
      const fichier = { aliments:"aliments.json", recettes:"recettes.json", programmes_types:"programmes.json", exercices:"exercices.json" }[table];
      if (fichier){
        try {
          const f = await fetch(CONFIG.nutrition.source_donnees + fichier, { cache: "no-store" });
          if (f.ok){
            const brut = await f.json();
            this._c[table] = (table === "aliments") ? brut.map(a => Normaliser.aliment(a)) : brut;
            this.secours = true;
          }
        } catch(e){}
      }
    }
    return this._c[table];
  },
  aliments(){ return this.lire("aliments"); },
  async recettes(){
    const l = await this.lire("recettes");
    const idx = await this.indexAliments();
    return l.map(r => {
      if ((r.regimes && r.regimes.length) || (r.allergenes && r.allergenes.length)) return r;
      const n = Normaliser.recette(r, idx).fiche;
      return Object.assign({}, r, { allergenes: n.allergenes, regimes: n.regimes });
    });
  },
  programmes(){ return this.lire("programmes_types"); },
  exercices(){ return this.lire("exercices"); },

  /* Les programmes designent leurs exercices par leur NOM. On indexe donc
     sur le nom aplati, et on garde l'identifiant en secours. */
  async indexExercices(){
    if (this._idxEx) return this._idxEx;
    const l = await this.exercices();
    this._idxEx = {};
    l.forEach(e => { this._idxEx[Normaliser.aplatir(e.nom)] = e; this._idxEx[e.id] = e; });
    return this._idxEx;
  },
  async fiche(nom){
    const idx = await this.indexExercices();
    return idx[Normaliser.aplatir(nom || "")] || null;
  },

  /* L'identifiant d'une video YouTube, quelle que soit la forme du lien
     colle : watch?v=, youtu.be/, /embed/, /shorts/. */
  idYouTube(url){
    const m = String(url || "").match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  },

  /* Le coach ajoute un exercice absent de sa base, sans quitter le programme.
     Il devient disponible partout, avec sa video, des la prochaine fois. */
  async ajouterExercice(nom, lien, groupe){
    const propre = String(nom || "").trim();
    if (!propre) throw new Error("Il faut un nom.");
    const id = Normaliser.aplatir(propre).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    if (!id) throw new Error("Ce nom ne donne pas d'identifiant valable.");
    const video = this.idYouTube(lien);
    const ligne = {
      id: id, nom: propre, groupe: groupe || "Autre",
      lien: lien || "", video_id: video || null
    };
    await Auth.appel("/rest/v1/exercices", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: [ligne]
    });
    /* on rafraichit les caches pour que la fiche soit trouvee tout de suite */
    if (this._c["exercices"]){
      const i = this._c["exercices"].findIndex(x => x.id === id);
      if (i > -1) this._c["exercices"][i] = Object.assign({}, this._c["exercices"][i], ligne);
      else this._c["exercices"].push(ligne);
    }
    if (this._idxEx){ this._idxEx[Normaliser.aplatir(propre)] = ligne; this._idxEx[id] = ligne; }
    return ligne;
  },

  /* index id -> aliment, pour calculer les macros d'une recette */
  async indexAliments(){
    if (this._idx) return this._idx;
    const l = await this.aliments();
    this._idx = {}; l.forEach(a => { this._idx[a.id] = a; });
    return this._idx;
  },

  /* Macros d'une recette, calculees a partir de ses ingredients.
     facteur = 1 -> portion telle qu'ecrite. */
  async macros(recette, facteur){
    const idx = await this.indexAliments();
    const f = facteur || 1;
    const t = { kcal:0, proteines:0, glucides:0, lipides:0, manquants:0 };
    (recette.ingredients || []).forEach(i => {
      const a = idx[i.aliment_id];
      if (!a){ t.manquants++; return; }
      const k = (i.grammes * f) / 100;
      t.kcal      += (+a.kcal      || 0) * k;
      t.proteines += (+a.proteines || 0) * k;
      t.glucides  += (+a.glucides  || 0) * k;
      t.lipides   += (+a.lipides   || 0) * k;
    });
    return t;
  }
};

/* ------------------------------------------------------------------
   NORMALISATION DES DONNEES IMPORTEES
   Les tables nutritionnelles sont fiables sur les chiffres, beaucoup
   moins sur les etiquettes "vegan", "sans gluten" ou les allergenes.
   On ne fait donc jamais confiance aux etiquettes fournies :
   - pour les ALLERGENES, on garde ceux du fichier ET on ajoute ceux
     que le nom trahit (on n'en retire jamais : le doute protege) ;
   - pour les REGIMES, on recalcule tout depuis zero, et en cas de
     doute on refuse le regime plutot que de l'accorder.
   Une erreur ici se traduit par une assiette qu'un client ne peut pas
   manger : c'est le point le plus sensible de toute l'application.
   ------------------------------------------------------------------ */
const Normaliser = {
  /* Les tables officielles melangent les encodages : "pates" peut s'ecrire
     avec un accent circonflexe combinant, "oeufs" avec la ligature œ.
     Un filtre naif passe alors a cote et laisse des pates aux oeufs
     etiquetees vegetaliennes. On aplatit donc tout avant de chercher :
     minuscules, accents retires, ligatures separees. */
  aplatir(t){
    return String(t || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/œ/g, "oe").replace(/æ/g, "ae");
  },

  mots: {
    viande:  /(poulet|poule|boeuf|porc|agneau|mouton|veau|dinde|canard|\boie\b|lapin|cheval|jambon|saucis|lardon|bacon|chorizo|andouill|boudin|rillette|\bfoie gras\b|gesier|merguez|viande|volaille|charcuterie|steak|escalope|brochette|kebab|nugget|cordon.?bleu|saindoux|gelatine|graisse (de|d')\s?(dinde|poulet|canard|oie|porc|mouton|boeuf)|bouillon de (boeuf|poule|volaille|viande))/,
    /* « pate » sans accent, c'est aussi bien le pâté que la pâte d'arachide
       ou la pâte à tartiner : on n'accuse qu'avec le contexte. */
    pate_animale: /pate (de (foie|campagne|tete|lapin|canard|porc|volaille)|en croute|imperial)/,
    poisson: /(poisson|thon|saumon|cabillaud|colin|merlu|\blieu\b|sardine|maquereau|anchois|truite|hareng|\bsole\b|dorade|\bbar\b|\braie\b|lotte|espadon|surimi|tarama|caviar|crevette|crabe|homard|langoustine|ecrevisse|langouste|tourteau|moule|huitre|coquille|calamar|calmar|poulpe|seiche|bulot|palourde|saint.?jacques|escargot|anguille|carpe|perche|brochet|bigorneau)/,
    laitier: /(\blait\b|laitier|laitiere|fromage|yaourt|yoghourt|beurre|\bcreme\b|petit.suisse|skyr|mascarpone|ricotta|mozzarella|parmesan|emmental|comte\b|gruyere|camembert|roquefort|\bchevre\b|brebis|kefir|faisselle|babeurre|lactose|caseine|petit.lait|\bfeta\b|cheddar|raclette|reblochon|munster|brie\b|bleu d)/,
    oeuf:    /(\boeuf|omelette|mayonnaise|meringue|quiche|\bflan\b|aux oeufs)/,
    miel:    /(\bmiel\b|gelee royale|propolis)/,
    cereale: /(\bble\b|\bpain\b|\bpates\b|\bpate\b|\briz\b|avoine|\borge\b|seigle|epeautre|\bmais\b|semoule|couscous|boulgour|quinoa|sarrasin|millet|farine|biscuit|gateau|cereale|corn.?flakes|muesli|brioche|croissant|pizza|\btarte\b|crepe|gaufre|chapelure|panure|galette|biscotte|viennoiserie|sandwich|burger|wrap\b)/,
    legumineuse: /(lentille|\bpois\b|pois chiche|haricot|\bfeve\b|\bsoja\b|\btofu\b|tempeh|edamame|lupin|arachide|cacahuete)/,
    sucre:   /(\bsucre|sirop|bonbon|confiserie|confiture|chocolat|pate a tartiner|\bsoda\b|\bcola\b|limonade)/,
    porc:    /(\bporc\b|porcin|jambon|lardon|\blard\b|bacon|chorizo|andouill|boudin|rillette|saucisson|saindoux|charcuterie|coppa|pancetta|gelatine|choucroute garnie|cassoulet|hot.?dog|knack|strasbourg|francfort|cervelas|mortadelle|salami|pate de (campagne|tete|porc)|museau|couenne)/,

    /* Un plat porte rarement le mot « viande » dans son nom : le cassoulet,
       le hot-dog, le coq au vin et les tripes passaient pour vegetaliens.
       On reconnait donc les plats eux-memes. */
    plats_animaux: /(cassoulet|choucroute garnie|pot.?au.?feu|coq au vin|hachis parmentier|\btripes\b|paupiette|nugget|cordon.?bleu|hot.?dog|chili con carne|tajine|blanquette|bourguignon|osso.?buco|quenelle|terrine|foie gras|pate en croute|feuillete a la viande|friand a la viande|bolognaise|carbonara|kebab|gyros|gibier|pot.?au.?feu|fricassee|parmentier|bouillon de (volaille|viande|poule|boeuf|pot.?au.?feu)|fond de volaille|graisse (de|d')\s?(canard|oie|dinde|poulet|porc|boeuf|mouton)|\blard\b)/,
    plats_marins:  /(nuoc.?mam|surimi|tarama|huile de (foie de morue|hareng|sardine|poisson|krill)|bouillabaisse|paella|brandade|rillettes de (thon|saumon|maquereau))/,

    /* Fromages et derives laitiers qui ne portent ni « lait » ni « fromage ». */
    fromages: /(maroilles|\btomme\b|cantal|morbier|gouda|edam|mimolette|\bbrie\b|coulommiers|livarot|epoisses|beaufort|abondance|ossau|pecorino|gorgonzola|stilton|halloumi|burrata|chocolat blanc|aligot|tartiflette|gratin dauphinois|croque.?monsieur)/,

    /* Faux positifs a proteger : ces produits sont bien vegetaux. */
    ex_viande: /(pain pour|\bbun\b|pour burger|pour hot.?dog|legumes pour couscous|couscous (cuit|de legumes|aux legumes)|vegetarien|vegetal|vegan|sans viande|substitut|steak de soja|galette de cereales)/,
    ex_lait:   /(lait de (soja|coco|amande|riz|avoine|noisette|noix)|boisson (au soja|vegetale|d'amande|d'avoine|de riz|de coco|au riz)|creme de (soja|coco|riz|avoine|marron)|beurre de (cacahuete|arachide|amande|noisette|cajou|karite|coco|sesame)|fromage vegetal|yaourt (au soja|vegetal|de soja)|dessert (au soja|vegetal))/,
    alcool:  /(\bvin\b|\bbiere\b|alcool|\brhum\b|whisky|vodka|liqueur|\bcidre\b|champagne|kirsch|cognac|armagnac|\bporto\b)/,

    /* --- paleo ---
       Le paleo etait ecrit en negatif : tout ce qui n'etait ni cereale, ni
       laitage, ni legumineuse, ni sucre passait. La biere, le chorizo, le
       hot-dog et les plats prepares y entraient. On l'ecrit en positif :
       un aliment brut d'une vraie categorie, et rien de transforme. */
    transforme: /(preemball|\bpane\b|\bpanee\b|panure|chapelure|beignet|\bfrit\b|\bfrite|nugget|cordon.?bleu|en sauce|\bsauce\b|charcuterie|saucis|chorizo|\bjambon|lardon|bacon|salami|mortadelle|rillette|boudin|andouill|merguez|surimi|tarama|plat cuisine|aperitif|apero|biscuit|barre |margarine|sorbet|\bglace\b|creme glacee|bouillon|cube |\bpizza\b|sandwich|\bburger\b|kebab|quiche|\btarte\b|feuillete|friand|\bpate\b|pate a |\bsirop\b|\bsoda\b|limonade|boisson|\bjus\b|nectar|\bchips\b|croute|croûton|crouton|conserve au sirop)/,

    /* Les seules choses de la categorie fourre-tout « Produits de base »
       qu'un paleo mange : les aromates, le sel, le vinaigre et l'eau. */
    aromate: /(\bpoivre|\bsel\b|fleur de sel|gros sel|epice|aromate|curcuma|\bcumin|paprika|cannelle|muscade|gingembre|\bcurry\b|origan|basilic|romarin|laurier|estragon|coriandre|\baneth\b|safran|vanille|girofle|cardamome|\bpiment\b|herbes de provence|herbe aromatique|\bmenthe\b|\bsauge\b|\bcerfeuil\b|\bciboulette\b|vinaigre|eau du robinet|eau de source|eau minerale|eau de coco|eau gazeuse)/
  },

  allergenesMots: {
    /* Liste elargie le 22/09 : beignets, croutons, cookies, feuilletes,
       panes, nuggets, cereales du petit-dejeuner et vermicelles passaient
       pour « sans gluten » (82 aliments). « panne » etait une coquille. */
    gluten:        /(\bble\b|\bpain\b|\bpates\b|semoule|couscous|boulgour|\borge\b|seigle|epeautre|avoine|farine|biscuit|brioche|croissant|gateau|chapelure|panure|\bpanee?s?\b|pizza|\btarte\b|crepe|gaufre|biscotte|\bbiere\b|\bmalt\b|viennoiserie|sandwich|burger|(nouille|vermicelle)s?\b(?! de (riz|soja|haricot|sarrasin))|raviol|lasagne|tortilla|pita\b|beignet|donut|crouton|cookie|madeleine|feuillete|friand|nugget|croquette|cordon.?bleu|hot.?dog|cereales|\bfrik\b|bouchee a la (reine|vapeur)|a la romaine|galette des rois|muesli|seitan|cracker|\bwrap\b)/,
    crustaces:     /(crevette|crabe|homard|langoustine|ecrevisse|langouste|tourteau)/,
    mollusques:    /(moule|huitre|coquille|calamar|calmar|poulpe|seiche|bulot|palourde|saint.?jacques|escargot|bigorneau|\bcoque\b|petoncle|peigne du perou|praire|couteau de mer|ormeau)/,
    soja:          /(\bsoja\b|\btofu\b|tempeh|edamame|\bmiso\b|tamari)/,
    /* « noix de pétoncle » et « noix de Saint-Jacques » sont des mollusques */
    fruits_a_coque:/(amande|\bnoix\b(?! de (petoncle|saint.?jacques|st.?jacques))|noisette|pistache|\bcajou\b|pecan|macadamia|chataigne|\bmarron\b)/,
    arachides:     /(arachide|cacahuete)/,
    sesame:        /(sesame|tahin)/,
    celeri:        /(celeri)/,
    moutarde:      /(moutarde)/,
    lupin:         /(lupin)/
  },

  /* Une mention "sans gluten" sur l'etiquette prime sur le mot "pates" */
  sansGluten: /(sans gluten|sans.?ble)/,

  aliment(a){
    const t = this.aplatir((a.nom || "") + " " + (a.categorie || ""));
    const m = this.mots, cat = a.categorie || "";
    /* CIQUAL precise parfois « ne convient pas aux veganes » dans le nom :
       cette mention prime sur tout le reste, y compris sur le mot « vegetal ». */
    const refuse = /ne convient pas aux (veganes|vegetaliens|vegetariens)/.test(t);
    const exV = m.ex_viande.test(t) && !refuse, exL = m.ex_lait.test(t) && !refuse;
    const viande  = ((m.viande.test(t) || m.plats_animaux.test(t) || m.pate_animale.test(t)) && !exV) || cat === "Viandes";
    const poisson = ((m.poisson.test(t) || m.plats_marins.test(t)) && !exV) || cat === "Poissons";
    const laitier = ((m.laitier.test(t) || m.fromages.test(t)) || cat === "Laitages") && !exL;
    const oeuf    = m.oeuf.test(t)    || cat === "Oeufs";
    /* « Melon miel » est un melon, pas du miel : sans cette garde il
       sortait du vegetalien. */
    const miel    = m.miel.test(t) && !/melon (miel|d'eau)/.test(t);
    const cereale = m.cereale.test(t) || cat === "Féculents";
    const legum   = m.legumineuse.test(t) || cat === "Légumineuses";
    const sucre   = m.sucre.test(t);
    /* le pain a hot-dog n'est pas du porc : la meme protection que pour la viande */
    const porc    = m.porc.test(t) && !exV;
    const alcool  = m.alcool.test(t);

    /* --- allergenes : on garde ceux du fichier ET on ajoute ceux que le
       nom trahit. On n'en retire jamais : le doute protege. --- */
    const al = {};
    (a.allergenes || []).forEach(x => { al[x] = true; });
    if (laitier) al.lait = true;
    if (oeuf)    al.oeufs = true;
    if (poisson && !this.allergenesMots.crustaces.test(t) && !this.allergenesMots.mollusques.test(t)) al.poissons = true;
    for (const cle in this.allergenesMots){
      if (this.allergenesMots[cle].test(t)) al[cle] = true;
    }
    if (this.sansGluten.test(t)) delete al.gluten;   // seule exception : l'etiquette le dit
    if (/sans soja/.test(t) && !/(tofu|tempeh|edamame|miso|tamari)/.test(t)) delete al.soja;   // idem : « sans soja » sur l'etiquette
    /* Les vrais poissons, cherches dans le NOM seul (la categorie CIQUAL
       « Poissons » couvre aussi crevettes et coquillages) : un plat « poisson
       a la mariniere, moules » doit porter les deux allergenes. */
    if (/(poisson|\bthon\b|saumon|cabillaud|\bcolin\b|merlu|\blieu\b|sardine|maquereau|anchois|truite|hareng|\bsole\b|dorade|\bbar\b|\braie\b|lotte|espadon|tarama|caviar|anguille|carpe|perche|brochet|morue|limande|flétan|fletan|merlan|haddock|tilapia|panga|rouget|turbot|eglefin|surimi|nuoc.?mam)/.test(this.aplatir(a.nom))) al.poissons = true;
    /* « noix » de petoncle ou de Saint-Jacques : c'est la chair du coquillage,
       pas un fruit a coque. Seul cas ou le mot trompe le filtre. */
    if (/(petoncle|saint.?jacques|st.?jacques)/.test(t) && !/(amande|noisette|pistache|cajou|pecan|macadamia|chataigne|marron|noix de (coco|grenoble))/.test(t)) delete al.fruits_a_coque;
    const allergenes = Object.keys(al).filter(x => CONFIG.nutrition.allergenes.some(z => z.id === x));

    /* --- regimes : entierement recalcules, restrictifs en cas de doute --- */
    const a_lait = allergenes.indexOf("lait") > -1, a_oeuf = allergenes.indexOf("oeufs") > -1;
    const a_mer  = ["poissons","crustaces","mollusques"].some(x => allergenes.indexOf(x) > -1);
    const animal = viande || poisson || laitier || oeuf || miel || a_lait || a_oeuf || a_mer;
    const r = ["omnivore"];
    if (!viande && !poisson && !a_mer && !refuse) r.push("vegetarien");
    if (!animal && !refuse) r.push("vegan");
    if (!viande) r.push("pescetarien");
    const tubercule = /(patate douce|igname|manioc|topinambour|panais|potimarron|courge|butternut|betterave)/.test(t);
    /* Le paleo se decide d'abord sur ce que l'aliment EST, pas sur ce qu'il
       n'est pas : une vraie categorie d'aliment brut (ou un aromate), et
       aucune trace de transformation industrielle. */
    const catPaleo = ["Viandes","Poissons","Légumes","Fruits","Oléagineux","Oeufs","Matières grasses"].indexOf(cat) > -1;
    const brut = (catPaleo || tubercule || m.aromate.test(t)) && !m.transforme.test(t) && !alcool;
    if (brut && (!cereale || tubercule) && !laitier && !a_lait && !legum && !sucre) r.push("paleo");
    if (allergenes.indexOf("gluten") === -1) r.push("sans_gluten");
    if (!laitier && !a_lait) r.push("sans_lactose");
    if (!porc && !alcool) r.push("sans_porc");

    return {
      id: a.id, nom: a.nom, categorie: a.categorie || null,
      kcal: +a.kcal || 0, proteines: +a.proteines || 0, glucides: +a.glucides || 0,
      lipides: +a.lipides || 0, fibres: +a.fibres || 0,
      portion_g: a.portion_g || null, portion_nom: a.portion_nom || null,
      allergenes: allergenes, regimes: r, source: a.source || null
    };
  },

  /* Les etiquettes d'une recette ne sont jamais reprises du fichier :
     elles se deduisent de ses ingredients. Union des allergenes,
     intersection des regimes. */
  recette(r, idx){
    const al = {}; let reg = null; const manquants = [];
    (r.ingredients || []).forEach(i => {
      const a = idx[i.aliment_id];
      if (!a){ manquants.push(i.aliment_id); return; }
      (a.allergenes || []).forEach(x => { al[x] = true; });
      const s = a.regimes || [];
      reg = reg === null ? s.slice() : reg.filter(x => s.indexOf(x) > -1);
    });
    return {
      fiche: {
        id: r.id, nom: r.nom, moment: r.moment || null, temps_min: r.temps_min || null,
        portions: r.portions || 1, ingredients: r.ingredients || [], etapes: r.etapes || [],
        allergenes: Object.keys(al), regimes: reg || [], source: r.source || null
      },
      manquants: manquants
    };
  }
};

/* ------------------------------------------------------------------
   IMPORT DU CATALOGUE depuis le depot public.
   Le coach declenche, l'application telecharge, normalise et enregistre.
   ------------------------------------------------------------------ */
const Import = {
  async fichier(nom){
    const r = await fetch(CONFIG.nutrition.source_donnees + nom, { cache: "no-store" });
    if (!r.ok) throw new Error("Fichier introuvable : " + nom + " (" + r.status + ")");
    return r.json();
  },
  async envoyer(table, lignes, journal){
    const paquet = 300;
    for (let i = 0; i < lignes.length; i += paquet){
      await Auth.assurer();
      await Auth.appel("/rest/v1/" + table + "?on_conflict=id", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: lignes.slice(i, i + paquet)
      });
      if (journal) journal(table, Math.min(i + paquet, lignes.length), lignes.length);
    }
  }
};

/* Petit temoin d'enregistrement dans la barre du haut */
function majEtat(etat){
  const e = document.getElementById("etat"); if (!e) return;
  const libelles = { enregistrement:"Enregistrement…", enregistre:"Enregistré", erreur:"Hors ligne — gardé sur cet appareil, renvoi automatique",
                     refuse:"Non enregistré — modification refusée", perdu:"Hors ligne — modification non enregistrée" };
  e.textContent = libelles[etat] || "";
  e.className = "etat " + etat;
  if (etat === "enregistre") setTimeout(() => { if (e.className.indexOf("enregistre") > -1) e.textContent = ""; }, 2000);
}

/* --- Bloc de sauvegarde, identique en bas de chaque outil --- */
function blocSauvegarde(){
  return `
  <section class="panel">
    <h2>Mes données</h2>
    <p class="note">Tout est enregistré dans ton compte : tu retrouves tes données sur n'importe quel appareil en te connectant. Tu peux en récupérer une copie complète quand tu veux, et demander leur effacement.</p>
    <div class="actions">
      <button class="btn ghost" id="sv-export">Télécharger toutes mes données</button>
      <button class="btn ghost" id="sv-copy">Copier ma sauvegarde</button>
      <button class="btn ghost" id="sv-paste">Restaurer une sauvegarde</button>
      <span class="msg" id="sv-msg"></span>
    </div>

    <div class="zone-danger">
      <h3>Supprimer mon compte</h3>
      <p>Ton profil, tes mensurations, ton programme, tes repas et ta progression de formation seront effacés. Ton coach n'y aura plus accès non plus. <b>C'est définitif : il n'y a pas de corbeille.</b></p>
      <p class="note" style="margin:8px 0 0">Pense à télécharger tes données avant, si tu veux les garder.</p>
      <div class="actions">
        <button class="btn danger" id="sv-suppr">Supprimer mon compte</button>
        <span class="msg" id="sv-suppr-msg"></span>
      </div>
    </div>
  </section>`;
}
/* Propose un fichier au telechargement. L'application est un site normal :
   le navigateur sait faire, il suffit de lui donner un lien et de le cliquer. */
function telecharger(nomFichier, texte){
  const blob = new Blob([texte], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomFichier;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function initSauvegarde(){
  if (!$("sv-copy")) return;

  const ex = $("sv-export");
  if (ex) ex.addEventListener("click", async () => {
    ex.disabled = true; flash("sv-msg", "Préparation…");
    try {
      const tout = await Store.exportComplet();
      const qui = (tout.compte.prenom || "mes") + "-" + (tout.compte.nom || "donnees");
      telecharger("mhx-" + Normaliser.aplatir(qui).replace(/[^a-z0-9]+/g, "-") + "-" + aujourdhui() + ".json",
                  JSON.stringify(tout, null, 2));
      flash("sv-msg", "Fichier téléchargé.");
    } catch(e){ flash("sv-msg", "Export impossible pour le moment."); }
    ex.disabled = false;
  });

  const sup = $("sv-suppr");
  if (sup) sup.addEventListener("click", async () => {
    if (!(await UI.confirmer(trad("Supprimer définitivement ton compte et toutes tes données ?\n\nCette action ne peut pas être annulée."), { titre: trad("Supprimer mon compte"), ok: trad("Continuer"), danger: true }))) return;
    const mot = await UI.demander(trad("Pour confirmer, écris SUPPRIMER en majuscules :"), "", { titre: trad("Supprimer mon compte"), ok: trad("Supprimer définitivement"), danger: true });
    if (mot === null) return;
    if (["SUPPRIMER", "DELETE"].indexOf(String(mot).trim().toUpperCase()) === -1){
      flash("sv-suppr-msg", "Ce n'est pas le mot attendu : rien n'a été supprimé.");
      return;
    }
    sup.disabled = true; flash("sv-suppr-msg", "Suppression…");
    try {
      await Auth.supprimerCompte(null, "SUPPRIMER");
      Auth.oublier();
      [localStorage, sessionStorage].forEach(m => {
        try { Object.keys(m).forEach(k => { if (k.indexOf("mhx_") === 0) m.removeItem(k); }); } catch(e){}
      });
      await UI.alerte(trad("Ton compte est supprimé. Merci d'avoir utilisé l'application."));
      location.hash = ""; location.reload();
    } catch(e){
      sup.disabled = false;
      flash("sv-suppr-msg", e.message || "Suppression impossible.");
    }
  });

  $("sv-copy").addEventListener("click", () => {
    const t = Store.exporter();
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(
        () => flash("sv-msg","Sauvegarde copiée. Colle-la dans une note."),
        () => flash("sv-msg","Copie impossible sur ce navigateur.")
      );
    } else flash("sv-msg","Copie impossible sur ce navigateur.");
  });
  $("sv-paste").addEventListener("click", async () => {
    const t = await UI.demander(trad("Colle ici la sauvegarde que tu avais copiée :"), "", { titre: trad("Restaurer une sauvegarde"), ok: trad("Restaurer") });
    if (!t) return;
    Store.importer(t)
      .then(() => { flash("sv-msg","Sauvegarde restaurée."); setTimeout(() => afficher(courant, true), 500); })
      .catch(() => flash("sv-msg","Cette sauvegarde n'est pas lisible."));
  });
}

