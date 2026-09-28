/* v34 — ordre de la navigation client : Accueil · Mon programme · Nutrition ·
   Ma progression · Mon bilan (devient « Mon suivi » en phase 8) · Speed
   Formation · Mes compléments · Profil. Les outils du coach suivent. Les ids
   (adresses #/…) ne changent pas : tous les liens existants restent valables. */

/* ------------------------------------------------------------------
   DÉCOUVERTE — le parcours gratuit du prospect (remplace le Challenge 7 jours).
   Jour 1 = le jour de l'inscription (profils.cree_le) ; les CONFIG.decouverte.jours
   premiers jours, la Speed Formation est ouverte, ensuite elle se verrouille.
   Le questionnaire court va dans la cle intake (court_le = instant de sa validation).
   Les clics « Réserver mon bilan » et la case « J'ai réservé mon bilan » restent dans la
   cle existante « challenge » (cta.clics, reserve) : aucune cle renommee, et l'historique
   des anciens prospects du challenge reste lu.
   ------------------------------------------------------------------ */
const Decouverte = {
  cle: "challenge",
  cfg(){ return CONFIG.decouverte || {}; },
  duree(){ const n = +this.cfg().jours; return n > 0 ? n : 7; },
  vide(){ return { version: 1, jours: {}, cta: { clics: [] } }; },
  /* date locale (AAAA-MM-JJ) d'une date ou d'un instant ; null si illisible */
  dateLocale(v){
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
    if (v.length <= 10) return v.slice(0, 10);
    const d = new Date(v); if (isNaN(d)) return null;
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },
  joursEcoules(debut){
    if (typeof debut !== "string") return null;
    const re = /^(\d{4})-(\d{2})-(\d{2})$/;
    const m = re.exec(debut), a = re.exec(aujourdhui());
    if (!m || !a) return null;
    return Math.round((Date.UTC(+a[1], +a[2] - 1, +a[3]) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000);
  },
  /* jour de decouverte (1 = jour de l'inscription) ; null si la date est illisible.
     v52 : plus rien n'est verrouille ni affiche au prospect selon ce jour (gratuit pour toujours) ; il sert au coach
     (« inscrit depuis n j », suivi commercial) et date les clics « Réserver mon bilan ».
     v53 : le mode test « jour n » (#/decouverte-jour/N, drapeau mhx_decouverte_jour sur l'appareil) est retire : c'est
     toujours le vrai jour, partout (un second argument encore passe par un appelant est sans effet). */
  jour(p){
    const n = this.joursEcoules(this.dateLocale(p && p.cree_le));
    return n == null ? null : Math.max(1, n + 1);
  },
  finie(p){ const j = this.jour(p); return j != null && j > this.duree(); },
  /* v52 : « inscrit aujourd'hui » / « inscrit depuis n j » (coach : pastilles, fiche, CSV, suivi) a partir du jour ;
     "" si la date d'inscription est illisible */
  depuisTexte(jour){ return typeof jour !== "number" || !isFinite(jour) ? "" : jour <= 1 ? "inscrit aujourd'hui" : "inscrit depuis " + (Math.floor(jour) - 1) + " j"; },
  /* v52 : une pesee existe dans Ma progression (une mesure avec un poids, ou un poids de depart) */
  peseeFaite(M){
    if (!M || typeof M !== "object" || Array.isArray(M)) return false;
    const n = v => { const x = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN; return isFinite(x) && x > 0; };
    return n(M.pstart) || (Array.isArray(M.mesures) && M.mesures.some(m => m && typeof m === "object" && n(m.poids)));
  },
  questionnaireFait(I){ return !!(I && typeof I.court_le === "string" && I.court_le); },
  /* une reponse non vide (chaine ou nombre) */
  repondu(I, id){ const v = I && typeof I === "object" ? I[id] : undefined; return (typeof v === "string" && v.trim() !== "") || (typeof v === "number" && isFinite(v)); },
  /* v52 : l'ancien questionnaire court (10 questions, affichage seulement) */
  avant(){ const a = this.cfg().questions_avant; return Array.isArray(a) ? a : []; },
  /* v52 : les reponses de ce prospect appartiennent-elles a l'ANCIEN questionnaire court ? Oui s'il n'a repondu a aucune
     question propre au nouveau (probleme, projection) mais a au moins une question propre a l'ancien (sexe, age, poids,
     motivation…). Un compte sans reponse est sur le nouveau. Sert aux compteurs « n / N réponses » et a l'affichage. */
  ancien(I){
    if (!I || typeof I !== "object") return false;
    const nv = this.cfg().questions || [], av = this.avant();
    if (nv.some(id => av.indexOf(id) === -1 && this.repondu(I, id))) return false;
    return av.some(id => nv.indexOf(id) === -1 && this.repondu(I, id));
  },
  /* v52 : les identifiants du questionnaire de ce prospect (le nouveau, ou l'ancien) */
  liste(I){ return this.ancien(I) ? this.avant() : (this.cfg().questions || []); },
  /* nombre de reponses non vides au questionnaire court (progression) — v52 : sur le questionnaire de ce prospect */
  repondues(I){
    if (!I || typeof I !== "object") return 0;
    return this.liste(I).filter(id => this.repondu(I, id)).length;
  },
  /* v52 : definitions des questions (QUESTIONS d'abord, puis DECOUVERTE.questions ; avant : les anciennes definitions) */
  definitions(ids, avant){
    const extra = (avant ? DECOUVERTE.questions_avant : DECOUVERTE.questions) || [], autre = (avant ? DECOUVERTE.questions : DECOUVERTE.questions_avant) || [];
    return (ids || []).map(id => QUESTIONS.find(q => q.id === id) || extra.find(q => q.id === id) || autre.find(q => q.id === id)).filter(Boolean);
  },
  /* v52 : les reponses a afficher (Profil du prospect, fiche du coach) : les questions de SON questionnaire (le nouveau, ou
     l'ancien), puis celles de l'autre qui ont une valeur — sauf l'objectif pose par l'app depuis la reponse « problème ».
     tous : aussi les questions sans reponse de son questionnaire (valeur ""). Rend [{ q, v }], v chaine (400 car. au plus). */
  reponses(I, tous){
    I = I && typeof I === "object" ? I : {};
    const ancien = this.ancien(I), nv = this.cfg().questions || [], av = this.avant();
    const siens = ancien ? av : nv, autres = (ancien ? nv : av).filter(id => siens.indexOf(id) === -1);
    const val = q => this.repondu(I, q.id) ? String(I[q.id]).trim().slice(0, 400) + (q.type === "echelle" ? " / 10" : "") : "";
    const pose = this.objectifDepuis(I.probleme);
    const out = this.definitions(siens, ancien).map(q => ({ q, v: val(q) })).filter(x => tous || x.v);
    this.definitions(autres, !ancien).forEach(q => { const v = val(q); if (v && !(q.id === "objectif" && !ancien && pose && v === pose)) out.push({ q, v }); });
    return out;
  },
  /* v52 (lot G) : les memes reponses pour le coach (fiche), avec des libelles courts : Problème, Ce qui l'a bloqué, Dans
     3 mois, puis les anciennes (l'obstacle d'un ancien prospect repondait a une autre question : « Obstacle principal »).
     Les autres gardent le libelle de la question (Sexe, Âge…). Ecrans du coach : francais seulement. Rend [[libelle, v]]. */
  LIBELLES_COACH: { probleme: "Problème", obstacle: "Ce qui l'a bloqué", projection: "Dans 3 mois", objectif: "Objectif", seances: "Séances par semaine", essaye: "Déjà essayé", pourquoi: "Pourquoi maintenant", motivation: "Motivation" },
  reponsesCoach(I, tous){
    const ancien = this.ancien(I);
    return this.reponses(I, tous).map(x => [x.q.id === "obstacle" && ancien ? "Obstacle principal" : this.LIBELLES_COACH[x.q.id] || x.q.label, x.v]);
  },
  /* v52 : la reponse « problème » traduite en option EXACTE de la question « objectif » (CONFIG.decouverte.objectif_depuis) ;
     "" si la reponse n'est pas dans la table ou si l'option n'existe pas (ou plus) dans QUESTIONS */
  objectifDepuis(v){
    const t = this.cfg().objectif_depuis || {};
    const o = typeof v === "string" && Object.prototype.hasOwnProperty.call(t, v) ? t[v] : "";
    const q = QUESTIONS.find(x => x.id === "objectif");
    return o && q && Array.isArray(q.options) && q.options.indexOf(o) > -1 ? o : "";
  },
  /* v52 : pose I.objectif depuis la reponse « problème » quand il est vide, ou quand c'est l'app elle-meme qui l'avait pose
     (marqueur I.objectif_auto = la valeur posee) : jamais par-dessus un objectif choisi par la personne. Ancien client
     (I.nom ou I.complet, par exemple repasse prospect par le coach) : seulement s'il est vide — ses donnees restent intactes
     (correction apres relecture : l'ancienne regle « venait de la table pour la reponse d'avant » pouvait remplacer un objectif
     choisi dans le questionnaire complet). Rend vrai si I change. */
  poserObjectif(I){
    if (!I || typeof I !== "object") return false;
    const o = this.objectifDepuis(I.probleme); if (!o || I.objectif === o) return false;
    const vide = !(typeof I.objectif === "string" && I.objectif.trim());
    const ancienClient = !!(I.nom || I.complet);
    const poseParLApp = typeof I.objectif_auto === "string" && I.objectif === I.objectif_auto;
    if (!vide && (ancienClient || !poseParLApp)) return false;
    I.objectif = o; I.objectif_auto = o; return true;
  },
  /* v52 : le choix fait sur la page de proposition de bilan ({ choix: "reserver" | "plus_tard", le }), ou null */
  bilanPropose(I){
    const b = I && typeof I === "object" ? I.bilan_propose : null;
    return b && typeof b === "object" && !Array.isArray(b) && (b.choix === "reserver" || b.choix === "plus_tard") ? b : null;
  },
  /* v52 : une reponse citee, tronquee proprement : n caracteres au plus (emojis entiers), coupee a un espace, « … » */
  extrait(v, n){
    if (typeof v !== "string" && !(typeof v === "number" && isFinite(v))) return "";
    const a = Array.from(String(v).replace(/\s+/g, " ").trim()), max = n || 160;
    if (a.length <= max) return a.join("");
    let s = a.slice(0, max).join(""); const i = s.lastIndexOf(" ");
    if (i > s.length * 0.6) s = s.slice(0, i);
    return s.replace(/[\s,;:.!?…'’-]+$/, "") + "…";
  },
  /* l'email du compte connecte (prospect seulement), s'il a une forme d'email */
  emailCompte(){
    const u = Auth.utilisateur(), m = u && typeof u.email === "string" ? u.email.trim() : "";
    return Auth.estProspect() && !Store.idConsulte && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(m) && m.length <= 254 ? m : "";
  },
  clics(C){
    return (C && typeof C === "object" && C.cta && typeof C.cta === "object" && Array.isArray(C.cta.clics))
      ? C.cta.clics.filter(x => x && typeof x === "object" && !Array.isArray(x)) : [];
  },
  /* la case « J'ai réservé » : C.reserve, ou celle du jour 7 d'un ancien prospect du challenge */
  reserve(C){
    if (!C || typeof C !== "object" || Array.isArray(C)) return null;
    if (typeof C.reserve === "string" && C.reserve) return C.reserve;
    const js = C.jours, j7 = js && typeof js === "object" && !Array.isArray(js) ? js["7"] : null;
    return (j7 && typeof j7 === "object" && typeof j7.reserve === "string" && j7.reserve) ? j7.reserve : null;
  },
  /* resume pour le coach (lecture seule) : seules des chaines et des nombres sortent d'ici */
  resume(p, C, I){
    const cl = this.clics(C), der = cl.length ? cl[cl.length - 1].date : null, j = this.jour(p);
    return { jour: j, duree: this.duree(), finie: j != null && j > this.duree(), questionnaire: this.questionnaireFait(I) ? I.court_le : null,
             clics: cl.length, dernierClic: typeof der === "string" ? der : null, reserve: this.reserve(C) };
  },
  /* pastilles « Découverte · inscrit depuis n j » (+ bilan) pour Mes clients : prospects seulement. l = une ligne de
     Clients.resumer. v52 : plus de « J n/7 » ni de « terminée » (gratuit pour toujours).
     v53 (chantier 4) : « bilan réservé » suit la coche du coach (Commercial.bilan : sa coche, sinon la case du prospect) */
  pastilleCoach(l){
    let r = null, B = null;
    try { r = this.resume(l && l.p, l && l.ch, l && l.dc); B = Commercial.bilan(l && l.suivi, l && l.ch, l && l.p); } catch(e){ return `<span class="pastille attention" title="Données de la découverte illisibles">Découverte illisible</span>`; }
    let h = r.jour == null ? `<span class="pastille">Découverte</span>`
          : `<span class="pastille" title="Jours depuis son inscription">Découverte · ${this.depuisTexte(r.jour)}</span>`;
    if (B.reserve) h += ` <span class="pastille ok" title="${B.coach ? "Bilan réservé : coché par toi" : "A coché « J'ai réservé mon bilan » (à vérifier, puis coche « Bilan réservé » dans sa fiche)"}">bilan réservé</span>`;
    else if (r.clics) h += ` <span class="pastille accent" title="A cliqué « Réserver mon bilan » ${r.clics} fois">a cliqué Réserver</span>`;
    return h;
  },

  /* la cle relue juste avant d'ecrire : un autre onglet n'efface pas un clic ou la case « J'ai réservé ».
     null si la relecture echoue (rien n'est ecrit) */
  async fraiche(C){
    const uid = Store.cible(); if (!uid) return null;
    const k = uid + "|" + this.cle;
    try { await Auth.assurer(); } catch(e){}
    const enAttente = Store.valeursEnAttente[k];
    if (Store.attente[k] && enAttente !== undefined){ clearTimeout(Store.attente[k]); delete Store.attente[k]; delete Store.valeursEnAttente[k]; try { await Store.envoyer(this.cle, enAttente, uid); } catch(e){} }
    let F = null;
    try { F = await Store.lire(this.cle, this.vide()); } catch(e){ F = null; }
    if (!F || typeof F !== "object" || Store.nonLus.has(F)){
      if (C && typeof C === "object") Store.boite(uid)[this.cle] = C;
      Store.lectureRatee(k);
      return null;
    }
    if (C && typeof C === "object" && C !== F){
      if (!F.cta || typeof F.cta !== "object" || Array.isArray(F.cta)) F.cta = { clics: [] };
      if (!Array.isArray(F.cta.clics)) F.cta.clics = [];
      this.clics(C).forEach(x => { if (!F.cta.clics.some(y => y && y.date === x.date)) F.cta.clics.push(x); });
      if (typeof C.reserve === "string" && C.reserve && !(typeof F.reserve === "string" && F.reserve)) F.reserve = C.reserve;
    }
    return F;
  },
  _file: Promise.resolve(),
  enFile(fn){
    const p = this._file.then(fn, fn);
    this._file = Promise.race([p.then(() => {}, () => {}), new Promise(r => setTimeout(r, 15000))]);
    return p;
  },
  /* un clic « Réserver mon bilan » : note pour le coach, jamais bloquant */
  clic(C, source){ return this.enFile(() => this._clic(C, source)); },
  async _clic(C, source){
    try {
      const F = await this.fraiche(C); if (!F) return;
      if (!F.cta || typeof F.cta !== "object" || Array.isArray(F.cta)) F.cta = { clics: [] };
      if (!Array.isArray(F.cta.clics)) F.cta.clics = [];
      F.cta.clics.push({ jour: this.jour(Auth.profil), source: typeof source === "string" ? source : null, date: new Date().toISOString() });
      if (F.cta.clics.length > 50) F.cta.clics = F.cta.clics.slice(-50);
      Store.ecrire(this.cle, F);
    } catch(e){}
  },
  /* « J'ai réservé mon bilan » : l'objet a jour, ou null si l'ecriture est refusee */
  reserver(C){
    return this.enFile(async () => {
      const F = await this.fraiche(C); if (!F) return null;
      if (!this.reserve(F)) F.reserve = new Date().toISOString();
      return Store.ecrire(this.cle, F) ? F : null;
    });
  }
};

/* ------------------------------------------------------------------
   ACTIVITÉ du prospect (v51) — cle prospect « activite » :
   { version: 1, jours: ["AAAA-MM-JJ", …] (60 derniers jours d'activite), pages: { "decouverte-questionnaire": n,
     "decouverte-resultat": n, formation: n, "verrou-programme": n, … }, temps_s (secondes page visible), derniere (instant) }.
   Ecrite par la personne seule, au plus une fois par minute et quand l'onglet passe en arriere-plan (relue et
   fusionnee avant l'ecriture : deux onglets ne s'effacent pas). Le coach la lit (derniere visite, jours actifs,
   chronologie). Jamais pour le coach, jamais pour une fiche consultee.
   v53 (chantier 4) : aussi pour un CLIENT, derriere l'interrupteur CONFIG.nouveautes.suivi_visites_clients (« test » :
   le compte de test seulement ; « tous » quand Lucas aura prevenu ses clients). Un jour actif = un jour ou la personne
   a ouvert l'app (une page affichee, ou l'onglet repris apres 10 min), pas une connexion.
   ------------------------------------------------------------------ */
const Activite = {
  cle: "activite",
  DELAI: 60000,
  /* _base : la derniere valeur connue de la base ; _delta : ce qui s'est passe depuis la derniere ecriture.
     Rien n'est lu a l'affichage d'une page (une page verrouillee ne lit aucune donnee) : la base est relue
     juste avant d'ecrire, et le delta s'y ajoute (deux onglets s'additionnent, ils ne s'effacent pas). */
  /* _enVol : le delta en cours d'envoi tant qu'il n'est pas confie au Store (onglet ferme pendant la relecture :
     il part dans la copie locale) ; _extra : une copie hors ligne ecartee par Store.reprendre, a fusionner.
     Copie locale « mhx_activite_attente|<uid> » : ce qu'un onglet ferme n'a pas pu envoyer, repris a la visite suivante. */
  _base: null, _delta: null, _uid: null, _vu: null, _minuteur: null, _ecoute: false, _envoi: false, _enVol: null, _extra: null, _dernier: 0, _ferme: false,
  LOCAL: "mhx_activite_attente|", _envoiP: null,
  /* la copie locale reste dans localStorage, meme sans « Rester connecte » : sessionStorage est efface avec l'onglet
     (la derniere visite serait perdue) et copie dans un onglet duplique (comptee deux fois). Ce ne sont que des
     compteurs de visite, effaces a la deconnexion. */
  magasin(){ return localStorage; },
  vide(){ return { version: 1, jours: [], pages: {}, temps_s: 0, derniere: null }; },
  /* v53 (chantier 4) : le prospect, et le client si l'interrupteur le permet pour SON compte (pourCompte, jamais
     visible() : en « test », visible() est vrai pour le coach, qui n'est jamais suivi) */
  suivi(){
    const u = Auth.utilisateur();
    if (Store.idConsulte || !u || !Auth.profil || Auth.estCoach()) return false;
    return Auth.estProspect() || Interrupteurs.pourCompte("suivi_visites_clients", u.id);
  },
  /* v53 (chantier 4) — suivi pour ce compte (lecture du coach) : un prospect toujours, un client selon l'interrupteur */
  suiviPour(p){ return !!(p && p.id && p.role !== "coach" && (p.statut === "prospect" || Interrupteurs.pourCompte("suivi_visites_clients", p.id))); },
  /* v53 (chantier 4) — ce que le coach lit : la derniere visite (derniere) et les jours actifs sur 30 jours (les jours de
     « jours » d'aujourd'hui a il y a 29 jours, calendrier local ; un jour dans le futur ne compte pas). Compte non suivi
     (client hors interrupteur) : rien, affiche « — » (jamais « 0 jour »), et jamais une alerte. */
  lecture(A, suivi){
    if (!suivi) return { suivi: false, derniere: null, jours30: null };
    const a = this.propre(A);
    const n = a.jours.filter(j => { const x = Decouverte.joursEcoules(j); return x != null && x >= 0 && x < 30; }).length;
    return { suivi: true, derniere: a.derniere, jours30: n };
  },
  /* la derniere visite en clair : « — » (non suivi), « aucune », « aujourd'hui », « hier », « il y a N j » */
  texteVisite(v){
    if (!v || !v.suivi) return "—";
    if (!v.derniere) return "aucune";
    const n = Decouverte.joursEcoules(Decouverte.dateLocale(v.derniere));
    return n == null ? "aucune" : n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " j";
  },
  texteJours(v){ return !v || !v.suivi ? "—" : String(v.jours30); },
  /* une valeur lue (le prospect ecrit ce qu'il veut dans sa cle) remise d'aplomb : jours = dates, pages = compteurs */
  propre(A){
    const o = (A && typeof A === "object" && !Array.isArray(A)) ? A : {};
    const jours = Array.isArray(o.jours) ? o.jours.filter(j => typeof j === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j)) : [];
    const pages = {};
    if (o.pages && typeof o.pages === "object" && !Array.isArray(o.pages)) Object.keys(o.pages).forEach(k => { const n = o.pages[k]; if (/^[a-z0-9-]{1,40}$/.test(k) && typeof n === "number" && n >= 0 && isFinite(n)) pages[k] = Math.floor(n); });
    return { version: 1, jours: Array.from(new Set(jours)).sort().slice(-60), pages,
             temps_s: typeof o.temps_s === "number" && o.temps_s >= 0 && isFinite(o.temps_s) ? Math.floor(o.temps_s) : 0,
             derniere: typeof o.derniere === "string" && !isNaN(Date.parse(o.derniere)) ? o.derniere : null };
  },
  deltaVide(){ const d = this._delta; return !d || (!d.jours.length && !Object.keys(d.pages).length && !d.temps_s); },
  /* base + delta : jours reunis, compteurs et temps additionnes, derniere activite la plus recente */
  combiner(base, d){
    const A = this.propre(base);
    A.jours = Array.from(new Set(A.jours.concat(d.jours))).sort().slice(-60);
    Object.keys(d.pages).forEach(k => { A.pages[k] = (A.pages[k] || 0) + d.pages[k]; });
    A.temps_s += d.temps_s;
    if (d.derniere && (!A.derniere || d.derniere > A.derniere)) A.derniere = d.derniere;
    return A;
  },
  /* deux valeurs completes (base connue, base relue, copie ecartee) : jours reunis, et pour chaque compteur le plus
     grand. Jamais d'addition ici : une meme visite presente des deux cotes n'est pas comptee deux fois */
  fusion(a, b){
    const A = this.propre(a); if (!b) return A;
    const B = this.propre(b);
    A.jours = Array.from(new Set(A.jours.concat(B.jours))).sort().slice(-60);
    Object.keys(B.pages).forEach(k => { A.pages[k] = Math.max(A.pages[k] || 0, B.pages[k]); });
    A.temps_s = Math.max(A.temps_s, B.temps_s);
    if (B.derniere && (!A.derniere || B.derniere > A.derniere)) A.derniere = B.derniere;
    return A;
  },
  /* un delta qui n'a pas pu partir revient dans le delta courant (rien n'est perdu, rien n'est compte deux fois) */
  remettre(d){ this._delta = this._delta ? this.combiner(d, this._delta) : d; this._delta.version = 1; },
  /* onglet ferme : ce qui n'est pas parti va dans la copie locale (additionnee a celle d'un autre onglet ferme) */
  garderLocal(){
    const uid = this._uid, u = Auth.utilisateur();
    if (!uid || !u || u.id !== uid) return;
    let d = this._delta; if (this._enVol) d = d ? this.combiner(this._enVol, d) : this._enVol;
    if (!d || (!d.jours.length && !Object.keys(d.pages).length && !d.temps_s)) return;
    try {
      const m = this.magasin();
      let x = null; try { x = JSON.parse(m.getItem(this.LOCAL + uid) || "null"); } catch(e){ x = null; }
      const tot = (x && typeof x === "object") ? this.combiner(x, d) : this.combiner(this.vide(), d);
      tot.jours = tot.jours.slice(-60);
      m.setItem(this.LOCAL + uid, JSON.stringify(tot));
      this._delta = null; this._enVol = null;
    } catch(e){}
  },
  /* lecture de la copie locale (onglets fermes) SANS la retirer : elle reste sur l'appareil tant que le Store n'a pas
     pris l'ecriture qui la contient (une app tuee sans pagehide ne perd rien) ; { brut, d } ou null */
  lireLocal(uid){
    let brut = null, x = null;
    try { brut = this.magasin().getItem(this.LOCAL + uid); x = JSON.parse(brut || "null"); } catch(e){ x = null; }
    if (!x || typeof x !== "object") return null;
    const d = this.propre(x); d.derniere = typeof x.derniere === "string" && !isNaN(Date.parse(x.derniere)) && Date.parse(x.derniere) <= Date.now() + 300000 ? x.derniere : null;
    return (d.jours.length || Object.keys(d.pages).length || d.temps_s) ? { brut, d } : null;
  },
  /* la copie lue a ete confiee au Store : retiree ; si un onglet ferme entre-temps y a ajoute des visites, seul ce
     qui a ete envoye en est retire (les compteurs ne font que grossir entre deux lectures) */
  retirerLocal(uid, L){
    try {
      const m = this.magasin(), cur = m.getItem(this.LOCAL + uid);
      if (!cur) return;
      if (cur === L.brut){ m.removeItem(this.LOCAL + uid); return; }
      const x = this.propre(JSON.parse(cur)), r = this.vide();
      Object.keys(x.pages).forEach(k => { const n = x.pages[k] - (L.d.pages[k] || 0); if (n > 0) r.pages[k] = n; });
      r.temps_s = Math.max(0, x.temps_s - L.d.temps_s);
      r.jours = x.jours.filter(j => L.d.jours.indexOf(j) === -1);
      r.derniere = x.derniere && (!L.d.derniere || x.derniere > L.d.derniere) ? x.derniere : null;
      if (r.jours.length || Object.keys(r.pages).length || r.temps_s) m.setItem(this.LOCAL + uid, JSON.stringify(r)); else m.removeItem(this.LOCAL + uid);
    } catch(e){}
  },
  /* copie hors ligne ecartee par Store.reprendre (le serveur a plus recent) : fusionnee au prochain envoi, sans message */
  rattraper(v, uid){
    if (!this.suivi() || !uid || Store.cible() !== uid) return;
    if (this._uid && this._uid !== uid){ this._base = null; this._delta = null; this._extra = null; }
    this._uid = uid;
    this._extra = this.fusion(v, this._extra);
    this.planifier();
  },
  /* onglet repris sans changer de page : le jour et la derniere activite comptent (au plus une fois par 10 min) */
  reprise(){
    if (!this.suivi() || !this._uid || Store.cible() !== this._uid || Date.now() - this._dernier < 600000) return;
    if (!this._delta) this._delta = this.vide();
    const j = aujourdhui();
    if (this._delta.jours.indexOf(j) === -1) this._delta.jours.push(j);
    this._delta.derniere = new Date().toISOString(); this._dernier = Date.now();
    this.planifier();
  },
  /* avant la deconnexion (la copie locale est effacee avec le reste) : attend l'envoi en cours, puis envoie le reste */
  async vider(){
    this.compterTemps();
    if (this._envoiP){ try { await this._envoiP; } catch(e){} }
    await this.envoyer();
  },
  ecouter(){
    if (this._ecoute) return; this._ecoute = true;
    this._vu = document.visibilityState === "visible" ? Date.now() : null;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible"){ this._ferme = false; this._vu = Date.now(); this.reprise(); return; }
      this.compterTemps();
      /* la page se ferme (Chrome : pagehide passe AVANT « masque ») : rien d'asynchrone, tout reste dans la copie locale */
      if (this._ferme){ this.garderLocal(); return; }
      this.envoyer();
    });
    /* fermeture de l'onglet : pas le temps de relire la base, et une base connue peut etre perimee (autre onglet,
       autre appareil) : rien n'est ecrit, le delta part dans la copie locale, reprise au prochain envoi */
    window.addEventListener("pagehide", () => { this._ferme = true; this.compterTemps(); this.garderLocal(); });
    /* page revenue du cache du navigateur : elle vit de nouveau */
    window.addEventListener("pageshow", e => { if (e && e.persisted) this._ferme = false; });
  },
  compterTemps(){
    if (this._vu == null || !this.suivi()) return;
    const s = Math.round((Date.now() - this._vu) / 1000);
    this._vu = document.visibilityState === "visible" ? Date.now() : null;
    if (s > 0){ if (!this._delta) this._delta = this.vide(); this._delta.temps_s += Math.min(s, 1800); }   // un onglet oublie ouvert ne compte pas plus de 30 min d'affilee
  },
  /* une page vue (identifiant court : decouverte-resultat, formation, verrou-programme…) — aucune lecture ici */
  page(id){
    if (!this.suivi() || typeof id !== "string" || !/^[a-z0-9-]{1,40}$/.test(id)) return;
    const uid = Store.cible(); if (!uid) return;
    if (this._uid && this._uid !== uid){ this._base = null; this._delta = null; this._extra = null; }   // autre compte sur l'appareil
    this._uid = uid;
    this.ecouter();
    if (!this._delta) this._delta = this.vide();
    const j = aujourdhui();
    if (this._delta.jours.indexOf(j) === -1) this._delta.jours.push(j);
    this._delta.pages[id] = (this._delta.pages[id] || 0) + 1;
    this._delta.derniere = new Date().toISOString(); this._dernier = Date.now();
    this.planifier();
  },
  planifier(){
    if (this._minuteur) return;
    this._minuteur = setTimeout(() => { this._minuteur = null; this.compterTemps(); this.envoyer(false); }, this.DELAI);
  },
  /* la base est toujours relue juste avant d'ecrire, puis fusionnee avec la derniere valeur ecrite par cet onglet
     (une ecriture encore en attente ou ratee hors ligne n'est pas perdue) et avec une copie ecartee (_extra) */
  /* deux onglets du meme prospect ne relisent-ecrivent jamais en meme temps : verrou du navigateur (navigator.locks),
     et l'ecriture part tout de suite, avant de rendre le verrou — l'onglet suivant relit donc une base a jour.
     Sans navigator.locks (vieux navigateur) : comme avant, sans verrou. */
  envoyer(){
    if (this._envoiP) return this._envoiP;
    const uid = this._uid;
    const verrou = uid && typeof navigator !== "undefined" && navigator.locks && typeof navigator.locks.request === "function";
    let p;
    try { p = verrou ? navigator.locks.request("mhx-activite|" + uid, () => this.envoyerUneFois(true)) : this.envoyerUneFois(false); }
    catch(e){ p = this.envoyerUneFois(false); }
    p = Promise.resolve(p).catch(e => { console.warn("[MHX] activite non envoyee", e); });
    this._envoiP = p;
    return p.finally(() => { if (this._envoiP === p) this._envoiP = null; });
  },
  async envoyerUneFois(verrouille){
    if (this._envoi || this._ferme || !this.suivi() || !this._uid || Store.cible() !== this._uid) return;
    const uid = this._uid;
    /* ce qu'un onglet ferme (ou celui-ci, revenu du cache du navigateur) n'a pas envoye : lu ici seulement pour savoir
       s'il y a quelque chose a envoyer (relu apres la lecture reseau) */
    const L = this.lireLocal(uid);
    if (this.deltaVide() && !this._extra && !L) return;
    this._envoi = true;
    const extra = this._extra; let d = this._delta || this.vide(); this._delta = null; this._extra = null; this._enVol = d;
    const rendre = () => { const aMoi = this._enVol === d; this._enVol = null; if (this._uid === uid){ if (aMoi) this.remettre(d); if (extra) this._extra = this.fusion(extra, this._extra); } };
    try {
      let F = null; try { F = await Store.lire(this.cle, this.vide()); } catch(e){ F = null; }
      if (!this.suivi() || Store.cible() !== uid){ rendre(); return; }
      if (!F || typeof F !== "object" || Store.nonLus.has(F)){ rendre(); return; }   // lecture ratee : on reessaiera
      /* onglet masque puis repris pendant la relecture : le delta memoire est deja dans la copie locale, il n'est pas
         ecrit deux fois (la copie locale, elle, a pu changer : elle est relue) */
      /* la copie locale est TOUJOURS relue ici (apres la lecture reseau, puis tout est synchrone jusqu'a Store.ecrire) :
         un autre onglet a pu l'envoyer et la retirer entre-temps (elle arrive alors par sa copie Store, au maximum),
         ou un onglet ferme a pu y ajouter des visites */
      const L2 = this.lireLocal(uid);
      if (this._enVol !== d) d = this.vide();
      /* la base relue, fusionnee (maximum) avec la derniere valeur ecrite par cet onglet, une copie ecartee et la copie
         du Store restee sur l'appareil (visite precedente pas encore arrivee) : rien de tout cela n'est perdu */
      let base = this.fusion(this.fusion(F, this._base), extra);
      const copie = Store.attenteLire()[uid + "|" + this.cle];
      if (copie && copie.a === uid && copie.v && typeof copie.v === "object") base = this.fusion(base, copie.v);
      const A = this.combiner(L2 ? this.combiner(base, L2.d) : base, d);
      if (Store.ecrire(this.cle, A) === false){ rendre(); return; }
      this._enVol = null;   // confie au Store : sa copie gardee prend le relais (fermeture, hors ligne)
      if (L2) this.retirerLocal(uid, L2);
      this._base = A;
      /* sous verrou : l'ecriture part maintenant et on attend la reponse (5 s au plus) avant de rendre le verrou */
      if (verrouille) await Promise.race([Store.envoyerCle(this.cle), new Promise(r => setTimeout(r, 5000))]);
    } finally {
      this._envoi = false;
      if (!this.deltaVide() || this._extra) this.planifier();
    }
  }
};

/* ------------------------------------------------------------------
   OUTIL — Découverte (prospects seulement). C'est l'accueil du prospect :
   v52 : les 3 questions (problème, obstacle, projection), puis la page de
   proposition de bilan (tant qu'il n'a pas choisi : « Réserver mon bilan » ou
   « Pas maintenant »), puis son accueil : une seule action mise en avant
   (« Calcule tes calories (2 min) », puis « Enregistre ta pesée de départ »),
   la Speed Formation, les pages de l'accompagnement et « Réserver mon bilan »,
   discret. Gratuit pour toujours : aucune limite de durée. L'ancien écran
   « résultat » (calories calculées depuis le
   questionnaire, priorités, séance, recettes) n'est plus affiché : son code
   reste, repris par le calculateur, l'échantillon du programme et la journée
   type de la nutrition (lots D et E). Formules du calculateur intouchées.
   Adresses : #/decouverte/bilan (la page de proposition, à tout moment),
   #/decouverte/reponses (« Modifier mes réponses », depuis le Profil).
   ------------------------------------------------------------------ */
const outilDecouverte = {
  id: "decouverte",
  /* cle des traitements generiques (nom dans l'alerte hors ligne, sauvegarde et restauration de « Mes donnees ») :
     celle de l'ancien outil Challenge, lue par Decouverte. L'outil lit « intake » et Decouverte.cle en dur ;
     « intake » reste ainsi rattachee au Profil (sinon un client lirait « Découverte » dans l'alerte hors ligne) */
  cle: "challenge",
  nom: "Découverte",
  court: "Découverte",
  icone: "🧭",
  client_seul: true,
  prospect_seul: true,
  masque_nav: true,      // c'est l'accueil du prospect : pas d'onglet en double
  sans_entete: true,
  titre: "Découverte",
  accroche: "",
  _form: false,          // vrai pendant « Modifier mes réponses »
  _bilan: false,         // v52 : la page de proposition de bilan demandée par son adresse (#/decouverte/bilan)
  _choixFait: false,     // v52 : un choix a été fait sur la page bilan pendant cette visite
  _choisit: false,       // v52 : un choix est en cours d'enregistrement (double clic)

  html(){ return `<div id="dc-vue"><section class="panel"><div class="empty">${esc(trad("Chargement…"))}</div></section></div>`; },
  async init(){ const zone = $("dc-vue"); if (zone) return this.afficher(zone); },

  async afficher(zone){
    /* v52 : #/decouverte/reponses ouvre « Modifier mes réponses », #/decouverte/bilan la page de proposition de bilan */
    const sous = courant === "decouverte" ? sousRoute : "";
    this._form = sous === "reponses";
    this._bilan = sous === "bilan";
    const I = await Store.lire("intake", {});
    const C = await Store.lire(Decouverte.cle, Decouverte.vide());
    /* v52 : l'action mise en avant sur son accueil (son calcul, puis sa pesee de depart) : lecture seule, sans toucher
       au cache, et seulement une fois le questionnaire valide (avant, l'accueil ne s'affiche pas) */
    this._reperes = Decouverte.questionnaireFait(I) ? await Store.lireTout([outilCalculateur.cle_perso, "mens"]) : null;
    if (!zone.isConnected) return;
    this.majEmail(I);
    this.rendre(zone, I, C);
  },
  /* v51 : l'email du compte suit le compte (adresse changee dans le Profil) : recopie seulement si un email est deja
     enregistre et qu'il differe. Une simple visite n'ecrit rien d'autre : sans email enregistre (questionnaire
     d'avant la v51), il part avec la prochaine reponse ou la prochaine validation. */
  majEmail(I){
    if (!I || typeof I !== "object" || Store.nonLus.has(I) || typeof I.email_compte !== "string" || !I.email_compte) return;
    const mail = Decouverte.emailCompte();
    if (mail && I.email_compte !== mail){ const avant = I.email_compte; I.email_compte = mail; if (Store.ecrire("intake", I) === false){ if (avant === undefined) delete I.email_compte; else I.email_compte = avant; } }
  },
  questions(){ return Decouverte.definitions(Decouverte.cfg().questions || []); },
  bornes(){ return Decouverte.cfg().bornes || {}; },

  rendre(zone, I, C){
    const T = DECOUVERTE, p = Auth.profil || {};
    if (Store.nonLus.has(I)){ zone.innerHTML = `<section class="panel"><div class="empty">${esc(trad(T.charge_rate))}</div></section>`; return; }
    const fait = Decouverte.questionnaireFait(I), form = !fait || this._form;
    /* v52 : questionnaire valide et pas encore de choix (ou page demandee par son adresse) : la proposition de bilan */
    const bilan = !form && (this._bilan || (!Decouverte.bilanPropose(I) && !this._choixFait));
    /* v52 : gratuit pour toujours — ni « Jour n/7 », ni jours restants, ni fin de decouverte */
    const eyebrow = trad(T.nom);
    /* sur la page bilan, rien d'autre : rien qui presse, deux choix de meme poids */
    const lede = !fait ? trad(T.lede_questionnaire) : (bilan || form) ? "" : trad(T.lede_accueil);
    /* « Réserver mon bilan » : visible des la fin du questionnaire (accueil, « Modifier mes réponses ») ; v52 : discret,
       l'action mise en avant de l'accueil est son etape (calcul, puis pesee) */
    const cal = fait && !bilan ? lienCalendly("decouverte") : "";
    zone.innerHTML = `<header class="masthead"><span class="eyebrow">${esc(eyebrow)}</span>
        <h1>${esc(trad("Bonjour"))}${p.prenom ? " " + esc(p.prenom) : ""}</h1>${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
        ${cal ? `<div class="actions"><a class="btn ghost petit" href="${esc(cal)}" target="_blank" rel="noopener" data-dc-cal="decouverte">${esc(trad("Réserver mon bilan"))}</a></div>` : ""}</header>`
      + (form ? this.formulaireHTML(I) : bilan ? this.bilanHTML(I) : this.accueilHTML(I, C));
    /* chaque clic vers Calendly est note pour le coach, avec l'ecran d'origine (accueil, page bilan, « Modifier mes reponses ») */
    $$("[data-dc-cal]", zone).forEach(a => a.addEventListener("click", () => Decouverte.clic(C, a.dataset.dcCal)));
    Activite.page(form ? "decouverte-questionnaire" : bilan ? "decouverte-bilan" : "decouverte-accueil");
    if (form) this.brancherFormulaire(zone, I, C);
    else if (bilan){ Tracking.enregistrer("bilan_viewed"); this.brancherBilan(zone, I, C); }
    else this.brancherPage(zone, I, C);
  },
  /* v52 : l'adresse d'une sous-page (#/decouverte/bilan, #/decouverte/reponses) quittee : retour a #/decouverte, sans
     hashchange (un rechargement ne rouvre pas la sous-page) */
  quitterSousPage(){
    this._form = false; this._bilan = false;
    if (courant === "decouverte" && sousRoute){ sousRoute = ""; try { history.replaceState(null, "", "#/decouverte"); } catch(e){} }
  },

  /* ---------- v52 : la page de proposition de bilan ---------- */
  bilanHTML(I){
    const L = DECOUVERTE.bilan, cal = lienCalendly("bilan-propose"), pr = Decouverte.extrait(I && I.projection, 160);
    /* sa reponse « projection », echappee et tronquee ; une phrase neutre si elle est vide (ancien prospect) */
    return `<section class="panel" id="dc-bilan"><h2>${esc(trad(L.titre))}</h2>
      <p class="dc-projection" id="dc-projection">${esc(pr ? trad(L.projection, { p: pr }) : trad(L.sans_projection))}</p>
      <p id="dc-bilan-texte">${esc(trad(L.texte))}</p>
      <div class="dc-choix">${cal ? `<a class="btn" id="dc-bilan-reserver" href="${esc(cal)}" target="_blank" rel="noopener" data-dc-cal="bilan-propose">${esc(trad(L.reserver))}</a>` : ""}<button class="btn" type="button" id="dc-bilan-plus-tard">${esc(trad(L.plus_tard))}</button></div></section>`;
  },
  brancherBilan(zone, I, C){
    const self = this;
    const res = zone.querySelector("#dc-bilan-reserver"), tard = zone.querySelector("#dc-bilan-plus-tard");
    /* le lien s'ouvre dans un nouvel onglet (Calendly) ; ici, le choix est note puis l'accueil s'affiche */
    if (res) res.addEventListener("click", () => self.choisirBilan(zone, I, C, "reserver"));
    if (tard) tard.addEventListener("click", () => self.choisirBilan(zone, I, C, "plus_tard"));
  },
  /* le choix est memorise UNE fois (intake.bilan_propose = { choix, le }), apres relecture d'intake si le cache n'est
     pas charge ; une page rouverte par son adresse n'ecrit plus rien. Ensuite, l'accueil. */
  async choisirBilan(zone, I, C, choix){
    if (this._choisit) return;
    this._choisit = true;
    this._choixFait = true;   // meme si l'ecriture n'a pas pu partir : il n'est pas renvoye sur cette page pendant la visite
    try {
      let J = I;
      const uid = Store.cible();
      if (!J || typeof J !== "object" || Store.nonLus.has(J) || !uid || Store.charge[uid + "|intake"] !== true){
        try { J = await Store.lire("intake", {}); } catch(e){ J = null; }
      }
      if (J && typeof J === "object" && !Store.nonLus.has(J) && !Decouverte.bilanPropose(J)){
        const avant = J.bilan_propose;
        J.bilan_propose = { choix: choix === "reserver" ? "reserver" : "plus_tard", le: new Date().toISOString() };
        if (Store.ecrire("intake", J) === false){ if (avant === undefined) delete J.bilan_propose; else J.bilan_propose = avant; }   // refusee (message deja affiche)
      }
      if (J && typeof J === "object" && !Store.nonLus.has(J)) I = J;
    } finally { this._choisit = false; }
    /* apres la tache du clic : le lien vers Calendly (nouvel onglet) part avant que la page ne soit redessinee */
    setTimeout(() => {
      if (!zone.isConnected) return;
      this.quitterSousPage();
      this.rendre(zone, I, C);
      window.scrollTo(0, 0);
    }, 0);
  },

  /* ---------- v52 : l'accueil du prospect apres la page bilan ----------
     Une seule action mise en avant : « Calcule tes calories (2 min) » tant que son calcul n'est pas enregistre
     (calc_perso), puis « Enregistre ta pesée de départ » tant qu'il n'a aucune pesee (mens), puis l'accueil normal
     (Speed Formation, pages de l'accompagnement, « Réserver mon bilan » discret). Decide sur une lecture seule
     (afficher : Store.lireTout), aucune ecriture a l'affichage. */
  accueilHTML(I, C){ return this.etapeHTML() + this.formationHTML() + this.accompHTML(C); },
  etape(){
    const R = this._reperes || {};
    if (!outilCalculateur.valide(R[outilCalculateur.cle_perso]) || outilCalculateur.mineur(R[outilCalculateur.cle_perso])) return "calories";
    if (!Decouverte.peseeFaite(R.mens)) return "pesee";
    return "";
  },
  etapeHTML(){
    const e = this.etape(), L = e && DECOUVERTE.etapes ? DECOUVERTE.etapes[e] : null;
    if (!L) return "";
    return `<section class="panel dc-etape" id="dc-etape" data-etape="${e}"><h2>${esc(trad(L.titre))}</h2>
      <p class="note" style="margin:0 0 14px">${esc(trad(L.texte))}</p>
      <div class="actions"><a class="btn" id="dc-etape-go" href="${e === "calories" ? "#/calculateur" : "#/mensurations"}">${esc(trad(L.bouton))}</a></div></section>`;
  },

  /* ---------- le questionnaire court ---------- */
  formulaireHTML(I){
    const L = DECOUVERTE.questionnaire, B = this.bornes(), req = Decouverte.cfg().requis || [];
    const champs = this.questions().map(q => {
      const large = (q.type === "long" || q.grand) ? ' style="grid-column:1/-1"' : "";
      let aide = q.aide || "";
      if (q.id === "age" && B.age) aide = trad(L.age_aide, { n: B.age[0] }) + (aide ? " " + aide : "");
      /* libelle traduit avant l'etoile (le dictionnaire connait certains libelles avec leur etoile, d'autres sans) */
      const etoile = q.label + " *", lib = req.indexOf(q.id) > -1 ? (trad(etoile) !== etoile ? trad(etoile) : trad(q.label) + " *") : trad(q.label);
      return `<div${large}><label for="q-${q.id}">${esc(lib)}</label>${aide ? `<p class="note" style="margin:-2px 0 8px">${esc(aide)}</p>` : ""}${outilProfil.champ(q, I[q.id])}</div>`;
    }).join("");
    return `<section class="panel"><h2>${esc(trad(L.titre))}</h2><div class="grid g2">${champs}</div>
      <div class="actions"><button class="btn" id="dc-voir" type="button">${esc(trad(L.bouton))}</button>${Decouverte.questionnaireFait(I) ? `<button class="btn ghost" id="dc-annuler" type="button">${esc(trad(L.annuler))}</button>` : ""}<span class="msg" id="dc-msg" role="status" aria-live="polite"></span></div>
      <p class="note" style="margin-top:10px">${esc(trad(L.note))}</p></section>`;
  },
  brancherFormulaire(zone, I, C){
    const self = this, L = DECOUVERTE.questionnaire, qs = this.questions(), B = this.bornes(), req = Decouverte.cfg().requis || [];
    Tracking.enregistrer("diagnostic_started");
    /* une valeur hors bornes (taille en metres, age d'enfant) ne part jamais : la reponse precedente reste */
    const valide = (q, v) => { const b = B[q.id]; if (!b || String(v == null ? "" : v).trim() === "") return true; const x = num(v); return x >= b[0] && x <= b[1]; };
    const qAge = qs.find(q => q.id === "age"), ageMin = B.age ? B.age[0] : null;
    /* Premier remplissage : chaque reponse part pendant la saisie (cle intake), mais seulement une fois
       un age d'au moins 18 ans saisi. L'age n'est juge qu'a la sortie du champ (« 35 » passe par « 3 »,
       « 185 » par « 18 »). Un age sous le minimum saisi ensuite remet ce que ce formulaire avait envoye
       a son etat d'avant : les reponses d'une personne mineure ne restent jamais en base.
       v52 : les 3 questions ne demandent plus l'age (qAge absent : le brouillon part des la premiere reponse) ;
       cette garde reste, inerte, pour une liste de questions qui contiendrait « age ». Le garde-fou 18 ans des
       prospects passe au calculateur (lot D).
       En « Modifier mes reponses », rien ne part avant « Valider mes réponses », qui valide sur une copie :
       « Annuler les modifications » retrouve donc exactement les reponses d'avant. */
    const enModification = Decouverte.questionnaireFait(I);
    const ageSaisi = () => { if (!qAge) return true; const a = outilProfil.valeur(qAge); return String(a == null ? "" : a).trim() !== "" && valide(qAge, a); };
    let ageOk = ageSaisi();
    const avant = {};   // ce que ce formulaire a envoye : cle -> valeur d'avant
    const retirer = () => {
      const cles = Object.keys(avant); if (!cles.length) return;
      cles.forEach(k => { if (avant[k] === undefined) delete I[k]; else I[k] = avant[k]; delete avant[k]; });
      Store.ecrire("intake", I);
    };
    /* v51 : apres un rechargement de la page, « avant » est vide : au premier remplissage, un age mineur retire
       aussi ce qu'une visite precedente avait envoye (reponses du questionnaire court, debut, email du compte) */
    /* jamais sur le questionnaire complet d'un ancien client repasse prospect (nom ou « complet » : ses donnees restent
       intactes, comme le promet « Repasser prospect ») : seul ce que ce formulaire a envoye est retire (retirer) */
    const purger = () => {
      if (enModification || I.nom || I.complet) return;
      /* v52 : l'objectif pose par l'app depuis la reponse « problème » part avec elle */
      const pose = Decouverte.objectifDepuis(I.probleme) && I.objectif === Decouverte.objectifDepuis(I.probleme) ? ["objectif"] : [];
      const presents = qs.map(q => q.id).concat(["court_debut", "email_compte"], pose).filter(k => Object.prototype.hasOwnProperty.call(I, k));
      if (!presents.length) return;
      presents.forEach(k => { delete I[k]; delete avant[k]; });
      Store.ecrire("intake", I);
    };
    const brouillon = () => {
      if (enModification || !ageOk) return;
      let change = false;
      const probleme = I.probleme;
      qs.forEach(q => {
        if (!$("q-" + q.id)) return;
        const v = outilProfil.valeur(q);
        if (valide(q, v) && String(I[q.id] == null ? "" : I[q.id]) !== String(v)){ if (!(q.id in avant)) avant[q.id] = I[q.id]; I[q.id] = v; change = true; }
      });
      /* v52 : la reponse « problème » pose l'objectif du questionnaire complet s'il est vide (table CONFIG) */
      if (change && I.probleme !== probleme){ const o = I.objectif, oa = I.objectif_auto; if (Decouverte.poserObjectif(I) && !("objectif" in avant)){ avant.objectif = o; avant.objectif_auto = oa; } }
      if (change){
        /* v51 : le debut du questionnaire et l'email du compte (pour le coach) partent avec la premiere reponse ;
           comme elle, ils sont retires si un age mineur est saisi ensuite */
        const mail = Decouverte.emailCompte();
        if (!I.court_debut){ if (!("court_debut" in avant)) avant.court_debut = I.court_debut; I.court_debut = new Date().toISOString(); }
        if (mail && I.email_compte !== mail){ if (!("email_compte" in avant)) avant.email_compte = I.email_compte; I.email_compte = mail; }
        Tracking.enregistrer("diagnostic_question_answered"); Store.ecrire("intake", I);
      }
    };
    const surAge = () => {
      const a = num(outilProfil.valeur(qAge));
      ageOk = ageSaisi();
      if (ageMin != null && a > 0 && a < ageMin){ retirer(); purger(); }
      brouillon();
    };
    qs.forEach(q => {
      const el = $("q-" + q.id); if (!el) return;
      if (q === qAge){ el.addEventListener("change", surAge); return; }   // l'age : a la sortie du champ seulement
      el.addEventListener("change", brouillon);
      if (el.matches("textarea, input:not([type=checkbox]):not([type=radio])")) el.addEventListener("input", brouillon);
    });
    const annuler = zone.querySelector("#dc-annuler");
    if (annuler) annuler.addEventListener("click", () => { self.quitterSousPage(); self.rendre(zone, I, C); window.scrollTo(0, 0); });
    const voir = zone.querySelector("#dc-voir");
    if (voir) voir.addEventListener("click", () => {
      /* on verifie une COPIE : les reponses n'entrent dans le questionnaire que valides */
      const V = Object.assign({}, I);
      qs.forEach(q => { if ($("q-" + q.id)) V[q.id] = outilProfil.valeur(q); });
      /* v52 : une reponse faite d'espaces seulement ne compte pas */
      const manquants = qs.filter(q => req.indexOf(q.id) > -1 && (q.type === "nombre" ? !(num(V[q.id]) > 0) : !String(V[q.id] == null ? "" : V[q.id]).trim()));
      const hors = qs.filter(q => B[q.id] && String(V[q.id] || "").trim() !== "" && (num(V[q.id]) < B[q.id][0] || num(V[q.id]) > B[q.id][1]));
      const lib = q => trad(q.label);
      if (ageMin != null && num(V.age) > 0 && num(V.age) < ageMin){ retirer(); purger(); }   // age sous le minimum : rien de ce formulaire ne reste
      if (manquants.length || hors.length){
        const msg = manquants.length ? trad(L.manque, { l: manquants.map(lib).join(", ") })
                                     : trad(L.verifie, { l: hors.map(q => lib(q) + " (" + trad("{a} à {b}", { a: B[q.id][0], b: B[q.id][1] }) + ")").join(", ") });
        flash("dc-msg", msg);
        const premier = $("q-" + (manquants.length ? manquants[0] : hors[0]).id);
        if (premier){ premier.scrollIntoView({ behavior: "smooth", block: "center" }); premier.focus(); }
        $$(".manque", zone).forEach(el => el.classList.remove("manque"));
        manquants.concat(hors).forEach(q => { const el = $("q-" + q.id); if (el) el.classList.add("manque"); });
        return;
      }
      const garde = { court_le: I.court_le, court_debut: I.court_debut, email_compte: I.email_compte, objectif: I.objectif, objectif_auto: I.objectif_auto };
      const probleme = I.probleme;
      Object.assign(I, V);
      Decouverte.poserObjectif(I);   // v52 : l'objectif du questionnaire complet depuis la reponse « problème » (jamais par-dessus celui de la personne)
      if (!Decouverte.questionnaireFait(I)) I.court_le = new Date().toISOString();
      if (!I.court_debut) I.court_debut = I.court_le;
      const mail = Decouverte.emailCompte(); if (mail) I.email_compte = mail;
      if (Store.ecrire("intake", I) === false){ Object.keys(garde).forEach(k => { if (garde[k] === undefined) delete I[k]; else I[k] = garde[k]; }); return; }   // refusee (message deja affiche)
      Tracking.enregistrer("diagnostic_completed");
      self.quitterSousPage();
      self.rendre(zone, I, C);   // v52 : la page de proposition de bilan (tant qu'il n'a pas choisi), sinon son accueil
      window.scrollTo(0, 0);
    });
  },

  /* ---------- le resultat (vraiment calcule a partir des reponses) ----------
     v52 : cet ecran n'est plus affiche (les 3 questions ne donnent ni age, ni taille, ni poids). Le code reste : le
     garde-fou IMC de chiffres() passe au calculateur (lot D), seanceHTML devient l'echantillon du programme verrouille
     et les recettes la journee type de la nutrition verrouillee (lot E) ; calculHTML / resultatHTML peuvent partir
     quand plus rien ne s'en sert. */
  chiffres(I){
    const d = outilCalculateur.departDepuis(I);
    if (!(num(I.pas) > 0)) d.pas = Decouverte.cfg().pas_defaut || 6000;
    const c = CONFIG.calcul, poids = num(I.poids), obj = num(I.poids_obj), taille = num(I.taille);
    const imc = kg => (taille > 0 && kg > 0) ? kg / Math.pow(taille / 100, 2) : null;
    const sens = d.objectif;   // perte | prise | maintien
    /* garde-fou sante : viser une perte sous un poids de forme habituel (IMC < 18,5) n'est pas l'affaire de l'app */
    const veutPerdre = sens === "perte" || (poids > 0 && obj > 0 && obj < poids);
    const imcBas = veutPerdre && ((imc(poids) != null && imc(poids) < 18.5) || (imc(obj) != null && imc(obj) < 18.5));
    let T = null, cible = null, mac = null;
    if (poids > 0 && taille > 0 && num(I.age) > 0){
      T = outilCalculateur.metabolismeDeBase(d) * outilCalculateur.facteurActivite(d).total;
      cible = imcBas ? T : sens === "perte" ? T * (1 - c.deficit_perte) : sens === "prise" ? T * (1 + c.surplus_prise) : T;
      mac = outilCalculateur.macros(cible, poids);
    }
    const coherent = poids > 0 && obj > 0 && obj !== poids && ((sens === "perte" && obj < poids) || (sens === "prise" && obj > poids));
    return { sens, imcBas, T, cible, mac, ecart: (coherent && !imcBas) ? obj - poids : null, seances: num(I.seances), motivation: Math.round(num(I.motivation)) || 0 };
  },
  /* la troisieme priorite vient de l'obstacle ecrit par la personne (mots-cles simples) */
  prioriteObstacle(I, p){
    const L = DECOUVERTE.resultat;
    const o = String(typeof I.obstacle === "string" ? I.obstacle : "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/temps|horaire|boulot|travail|agenda|enfant|fatigu|dispo/.test(o)) return L.p_temps;
    if (/faim|grignot|sucre|fringale|craqu|manger|nourriture|alimentation|repas/.test(o)) return L.p_faim;
    if (/motiv|regular|tenir|lach|abandon|constan|discipline|flemme/.test(o)) return L.p_regularite;
    if (p.motivation > 0 && p.motivation <= 5) return L.p_regularite;
    return L.p_defaut;
  },
  resultatHTML(I){
    const L = DECOUVERTE.resultat, t = L.tuiles, p = this.chiffres(I), tuiles = [], phrases = [], prio = [];
    const txt = v => typeof v === "string" && v.trim() ? v.trim() : "";
    /* la reponse citee entre guillemets : 120 caracteres au plus, sans son point final (la phrase a le sien) */
    const court = v => { const a = Array.from(txt(v)); return a.length > 120 ? a.slice(0, 120).join("") + "…" : a.join("").replace(/[\s.!…]+$/, ""); };
    if (p.imcBas) phrases.push(trad(L.imc_bas));
    else if (p.ecart != null) tuiles.push({ lbl: t.ecart, val: n1(Math.abs(p.ecart)), unite: "kg", sub: p.ecart < 0 ? t.ecart_perdre : t.ecart_prendre });
    if (p.T != null) tuiles.push({ lbl: t.depense, val: fmt(p.T), unite: "kcal", sub: t.depense_sous });
    if (p.seances > 0) tuiles.push({ lbl: t.seances, val: String(p.seances), unite: "/ sem", sub: t.seances_sous });
    if (p.motivation > 0){
      tuiles.push({ lbl: t.motivation, val: String(p.motivation), unite: "/10", sub: t.motivation_sous, neg: p.motivation <= 4 });
      phrases.push(trad(p.motivation >= 8 ? L.motivation_haute : p.motivation >= 5 ? L.motivation_moyenne : L.motivation_basse, { x: p.motivation }));
    }
    if (txt(I.obstacle)) phrases.push(trad(L.obstacle, { o: court(I.obstacle) }));
    if (txt(I.essaye)) phrases.push(trad(L.essaye, { e: court(I.essaye) }));
    if (txt(I.pourquoi)) phrases.push(trad(L.pourquoi, { p: court(I.pourquoi) }));
    if (p.imcBas) prio.push(trad(L.p_sante));
    else if (p.cible != null) prio.push(trad(p.sens === "perte" ? L.p_perte : p.sens === "prise" ? L.p_prise : L.p_maintien, { c: fmt(p.cible), p: fmt(p.mac.prot) }));
    if (p.seances >= 4) prio.push(trad(L.p_seances_4, { n: p.seances })); else if (p.seances === 3) prio.push(trad(L.p_seances_3)); else if (p.seances > 0) prio.push(trad(L.p_seances_2));
    prio.push(trad(this.prioriteObstacle(I, p)));
    const tuile = x => `<div class="tile"><div class="t-lbl">${esc(trad(x.lbl || ""))}</div><div class="t-val readout${x.neg ? " neg" : ""}">${esc(x.val)}<small>${esc(x.unite || "")}</small></div><div class="t-sub">${esc(trad(x.sub || ""))}</div></div>`;
    return `<section class="panel" id="dc-resultat"><h2>${esc(trad(L.titre))}</h2>
      ${tuiles.length ? `<div class="tiles">${tuiles.map(tuile).join("")}</div>` : ""}
      <ul class="ch-lecture">${phrases.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <h3>${esc(trad(L.priorites_titre))}</h3><ol class="etapes">${prio.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
      <div class="actions"><button class="btn ghost" id="dc-modifier" type="button">${esc(trad(L.modifier))}</button></div></section>`;
  },
  calculHTML(I){
    const L = DECOUVERTE.calcul, p = this.chiffres(I);
    if (p.T == null) return `<section class="panel" id="dc-calcul"><h2>${esc(trad(L.titre))}</h2><p class="note" style="margin:0">${esc(trad(L.incomplet))}</p></section>`;
    const tuile = (lbl, val, unite, sub) => `<div class="tile"><div class="t-lbl">${esc(trad(lbl))}</div><div class="t-val readout">${esc(val)}<small>${esc(unite)}</small></div><div class="t-sub">${esc(trad(sub))}</div></div>`;
    return `<section class="panel" id="dc-calcul"><h2>${esc(trad(L.titre))}</h2><p class="note" style="margin:0 0 12px">${esc(trad(L.intro))}</p>
      <div class="tiles">${tuile(L.maintien, fmt(p.T), "kcal", L.kcal_sous)}${p.imcBas ? "" : tuile(L.cible, fmt(p.cible), "kcal", L.kcal_sous)}${tuile(L.prot, fmt(p.mac.prot), "g", L.g_sous)}${tuile(L.gluc, fmt(p.mac.gluc), "g", L.g_sous)}${tuile(L.lip, fmt(p.mac.lip), "g", L.g_sous)}</div>
      <p class="note" style="margin:12px 0 0">${esc(trad(L.note))}</p>${p.imcBas ? `<p class="flag" style="margin-top:12px">${esc(trad(DECOUVERTE.resultat.imc_bas))}</p>` : ""}</section>`;
  },
  seanceHTML(I){
    const L = DECOUVERTE.seance, t = L.tours || {}, niv = String(I.niveau || "");
    const ech = (typeof ECHAUFFEMENTS !== "undefined" ? ECHAUFFEMENTS : []).find(x => x.id === L.echauffement) || null;
    const tp = /avanc/i.test(niv) ? { n: t.avance || 4, niv: trad("Avancé") } : /interm/i.test(niv) ? { n: t.intermediaire || 3, niv: trad("Intermédiaire") } : { n: t.debutant || 2, niv: trad("Débutant") };
    const exos = `<ul class="ch-exos">${(L.exercices || []).map(x => `<li><b>${esc(trad(x.nom))}</b><span class="reps">${esc(trad(x.reps))}</span>${idVideo(x.video) ? `<button type="button" class="btn ghost petit" data-yt="${esc(x.video)}" aria-label="${esc(trad(L.demo) + " : " + trad(x.nom))}">${esc(trad(L.demo))}</button>` : ""}</li>`).join("")}</ul>`;
    return `<section class="panel" id="dc-seance"><h2>${esc(trad(L.titre))}</h2><p class="note" style="margin:0 0 12px">${esc(trad(L.intro))}</p>
      ${ech ? `<h3>${esc(trad(L.echauffement_titre))}</h3><ul class="ingr fiche-l">${(ech.exercices || []).map(x => `<li><span>${esc(trad(x.nom))}</span><b>${esc(x.series && x.series !== "1" ? x.series + " × " + x.reps : x.reps)}</b></li>`).join("")}</ul>` : ""}
      <h3>${esc(trad(L.circuit_titre))}</h3><p class="note" style="margin:0 0 10px">${esc(trad(L.circuit_note, { n: tp.n, niv: tp.niv }))}</p>${exos}
      <p class="flag" style="margin-top:14px">${esc(trad(L.securite))}</p></section>`;
  },
  recettesHTML(){
    const L = DECOUVERTE.recettes;
    return `<section class="panel" id="dc-recettes"><h2>${esc(trad(L.titre))}</h2><p class="note" style="margin:0 0 8px">${esc(trad(L.intro))}</p>
      <div id="dc-recettes-l"><div class="empty">${esc(trad("Chargement…"))}</div></div></section>`;
  },
  async chargerRecettes(zone){
    const boite = zone.querySelector("#dc-recettes-l"); if (!boite) return;
    const L = DECOUVERTE.recettes;
    try {
      const [liste, idx] = await Promise.all([Catalogue.recettes(), Catalogue.indexAliments()]);
      if (!boite.isConnected) return;
      const rs = (Decouverte.cfg().recettes || []).map(id => (liste || []).find(r => r && r.id === id)).filter(Boolean);
      if (!rs.length) throw new Error("recettes introuvables");
      boite.innerHTML = rs.map(r => `<details class="dc-recette"><summary><b>${esc(trad(r.nom || ""))}</b>${r.temps_min ? ` <span class="note">· ${esc(trad(L.minutes, { n: r.temps_min }))}</span>` : ""}</summary>
        <h4>${esc(trad(L.ingredients))}</h4><ul class="ingr fiche-l">${(r.ingredients || []).map(i => { const a = idx[i && i.aliment_id]; return `<li><span>${esc(trad(a ? a.nom : String((i && i.aliment_id) || "")))}</span><b>${esc(fmt(num(i && i.grammes)))} g</b></li>`; }).join("")}</ul>
        ${(r.etapes || []).length ? `<h4>${esc(trad(L.preparation))}</h4><ol class="etapes">${r.etapes.map(e => `<li>${esc(trad(String(e)))}</li>`).join("")}</ol>` : ""}</details>`).join("");
    } catch(e){ if (boite.isConnected) boite.innerHTML = `<p class="note" style="margin:0">${esc(trad(L.indispo))}</p>`; }
  },
  /* v52 : la Speed Formation est ouverte pour toujours */
  formationHTML(){
    const L = DECOUVERTE.formation;
    return `<section class="panel" id="dc-formation"><h2>${esc(trad(L.titre))}</h2><p class="note" style="margin:0">${esc(trad(L.ouverte))}</p>
      <div class="actions"><a class="btn ghost" href="#/formation">${esc(trad(L.ouvrir))}</a></div></section>`;
  },
  /* v52 : ce qu'apporte l'accompagnement = les pages verrouillees de sa vitrine (CONFIG.marque.gratuit_vitrine), chacune
     avec son lien ; « Réserver mon bilan » discret */
  accompHTML(C){
    const L = DECOUVERTE.accomp, cal = lienCalendly("decouverte-accompagnement"), r = Decouverte.reserve(C);
    const vitrine = ((CONFIG.marque && CONFIG.marque.gratuit_vitrine) || []).map(id => OUTILS.find(o => o.id === id)).filter(o => o && AVANTAGES[o.id]);
    return `<section class="panel" id="dc-accomp"><h2>${esc(trad(L.titre))}</h2>
      <ul class="liste-debloque">${vitrine.map(o => `<li><a href="#/${esc(o.id)}" data-dc-vitrine="${esc(o.id)}">${esc(trad(o.nom))}</a> — ${esc(trad(AVANTAGES[o.id]))}</li>`).join("")}</ul>
      ${cal ? `<div class="actions"><a class="btn ghost" href="${esc(cal)}" target="_blank" rel="noopener" data-dc-cal="decouverte-accompagnement">${esc(trad("Réserver mon bilan"))}</a></div>` : ""}
      <p class="note" style="margin:10px 0 0">${esc(trad(L.note))}</p>
      <div id="dc-reserve" style="margin-top:14px">${r ? this.reserveHTML(r) : `<label class="coche"><input type="checkbox" id="dc-reserve-case"> ${esc(trad(L.reserve_case))}</label>`}</div></section>`;
  },
  reserveHTML(r){ return `<span class="pastille ok" id="dc-reserve-ok" tabindex="-1">${esc(trad(DECOUVERTE.accomp.reserve_ok, { d: dateFr(Decouverte.dateLocale(r) || "") }))}</span>`; },
  brancherPage(zone, I, C){
    const self = this;
    const mod = zone.querySelector("#dc-modifier");
    if (mod) mod.addEventListener("click", () => { self._form = true; self.rendre(zone, I, C); window.scrollTo(0, 0); });
    $$("[data-yt]", zone).forEach(b => b.addEventListener("click", () => {
      const id = idVideo(b.dataset.yt); if (!id) return;
      /* une seule video a la fois : les autres lecteurs redeviennent des boutons */
      $$(".video-cadre", zone).forEach(cd => { if (cd._bouton && cd.parentNode) cd.parentNode.replaceChild(cd._bouton, cd); });
      const cadre = document.createElement("div"); cadre.className = "video-cadre"; cadre._bouton = b;
      cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1" title="${esc(trad("Démonstration de l'exercice"))}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      b.parentNode.replaceChild(cadre, b);
    }));
    const cs = zone.querySelector("#dc-reserve-case");
    if (cs) cs.addEventListener("change", async () => {
      if (!cs.checked) return;
      cs.disabled = true;
      const F = await Decouverte.reserver(C);
      if (!F){ cs.checked = false; cs.disabled = false; return; }   // ecriture refusee (message deja affiche)
      C = F;
      Tracking.enregistrer("call_booked");
      const boite = zone.querySelector("#dc-reserve");
      if (boite){ boite.innerHTML = self.reserveHTML(Decouverte.reserve(F)); const ok = boite.querySelector("#dc-reserve-ok"); if (ok) ok.focus(); }
    });
    this.chargerRecettes(zone);
  }
};

