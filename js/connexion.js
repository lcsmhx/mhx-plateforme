let routage = 0;   // v71 (I) : numero du dernier routage (une relecture de profil perimee n'affiche rien)
async function routeDepuisAdresse(){
  if (!$("vue") || $("session-perdue")) return;   // v48 : session terminee (bandeau ou ecran de connexion) : rien a router
  const mien = ++routage;
  let id = (location.hash || "").replace(/^#\/?/, "");
  if (id.indexOf("=") > -1 || id.indexOf("&") > -1) id = "";
  /* le Challenge 7 jours n'existe plus : ses anciennes adresses (liens partages, favoris) menent a la Decouverte */
  if (/^challenge(-libre|-rythme)?(\/.*)?$/.test(id)){ try { history.replaceState(null, "", "#/decouverte"); } catch(e){} id = "decouverte"; }
  /* v53 : le mode test « jour n » de la Decouverte n'existe plus : ses anciennes adresses (#/decouverte-jour/N) menent
     simplement a la Decouverte (un client ou le coach arrivent ensuite sur leur page d'arrivee, comme pour #/decouverte) */
  if (/^decouverte-jour(\/.*)?$/.test(id)){ try { history.replaceState(null, "", "#/decouverte"); } catch(e){} id = "decouverte"; }
  let parts = id.split("/");
  /* v71 (I) : #/client/<uuid>/<outil> : la fiche consultee est dans l'adresse (posee par Clients.ouvrir et le bandeau). Coach
     seulement : si ce n'est pas deja la fiche ouverte, relire le profil AVANT d'afficher (meme lecture que la fiche) ; uuid
     inconnu, compte coach, lecture ratee ou personne qui n'est pas le coach : Mes clients (ou la page d'arrivee). */
  let reecrire = false;   // v71 (I) : #/client/… refuse (uuid inconnu, coach, personne qui n'est pas le coach) : l'adresse le dit
  if (parts[0] === "client"){
    const uid = parts[1] || "";
    if (!Auth.estCoach() || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(uid)){ parts = ["clients"]; reecrire = true; }
    else {
      if (Store.idConsulte !== uid){
        let pr = null;
        try { const r = await Auth.appel("/rest/v1/profils?id=eq." + uid + "&select=*"); pr = (r && r[0]) || null; } catch(e){}
        if (mien !== routage || $("session-perdue")) return;
        if (!pr || pr.role === "coach"){ parts = ["clients"]; reecrire = true; }
        else { Store.oublier(Store.idConsulte); Store.idConsulte = uid; Store.nomConsulte = Clients.nom(pr); Store.retourVers = Store.retourVers || "clients"; }
      }
      if (parts[0] === "client") parts = parts.length > 2 ? parts.slice(2) : ["accueil"];
    }
  }
  id = parts[0]; sousRoute = parts.slice(1).join("/");
  if (ALIAS_ROUTES[id]) id = ALIAS_ROUTES[id];
  /* v52 : une page qui n'est pas pour cette personne (client sur #/calculateur, coach hors fiche sur #/accueil…)
     affiche la page d'arrivee ET l'adresse le dit. replaceState ne declenche pas hashchange : pas de boucle.
     Sans ce correctif, un « Ouvrir » du coach qui pose #/accueil (deja dans l'adresse) ne faisait rien.
     Adresse vide (page d'arrivee) : rien a reecrire. */
  const cible = outilsVisibles().some(o => o.id === id) ? id : outilParDefaut();
  if ((id && cible !== id) || reecrire){
    sousRoute = "";
    try { history.replaceState(null, "", lienOutil(cible)); } catch(e){}   // v71 (I) : en consultation, l'adresse canonique
  }
  afficher(cible);
}

/* ---------------------- v78 (tâche 3) : CAPTCHA CLOUDFLARE TURNSTILE ----------------------
   Allumé seulement si CONFIG.turnstile.cle_site est remplie. Vide (ou absent : config.js gardé en cache), l'app fait
   exactement comme avant : aucun élément ajouté, aucun script chargé, aucune attente, mêmes requêtes. Le script de
   Cloudflare n'est chargé qu'à l'ouverture de la connexion et de la création de compte (et du bloc « Changer mon mot de
   passe » du Profil si CONFIG.turnstile.profil vaut true), jamais ailleurs ni dans index.html. Widget en rendu explicite,
   langue et thème de l'app, « compact » sous 300 px utiles (320 px de large), hauteur réservée en CSS (.co-captcha),
   SOUS le bouton (le bouton reste à sa place, visible sans défiler). Le jeton est lu au clic, 4 s d'attente au plus, puis
   la requête part avec ou sans jeton : Supabase tranche, le bouton n'est jamais bloqué. Un jeton ne sert qu'une fois :
   remise à zéro après un envoi raté qui l'a emporté (erreur réseau comprise) ou d'un widget en échec ; widget retiré
   quand l'écran change (un envoi encore en attente du jeton ne part plus) ; « tour » ignore un script ou un rappel qui
   arrive après un changement d'écran. */
const Captcha = {
  SCRIPT: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=mhxTurnstilePret",
  ATTENTE: 4000, CHARGEMENT: 15000,
  id: null, zone: null, etat: "", tour: 0, envoye: false, _charge: null, _attentes: [], _veille: false,
  /* traduits dans I18N.en (i18n.js, bloc v78 tâche 3) ; {e} = CONFIG.marque.email */
  TEXTES: {
    attente: "La vérification anti-robot n'est pas encore terminée. Attends qu'elle soit validée (ou coche la case), puis réessaie. Si ça continue, écris à ton coach à {e}.",
    refus: "La vérification anti-robot n'a pas été acceptée. Elle vient d'être relancée : attends qu'elle soit validée, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    injoignable: "La vérification anti-robot n'a pas pu se charger. Vérifie ta connexion, recharge la page, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    echec: "La vérification anti-robot a échoué. Recharge la page, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    navigateur: "Ton navigateur ne permet pas la vérification anti-robot. Mets-le à jour ou ouvre l'app dans un autre navigateur (Safari, Chrome). Si ça continue, écris à ton coach à {e}.",
    indispo: "La vérification anti-robot est momentanément indisponible : réessaie dans une minute.",
    /* eteint : surtout une page chargée avant la mise en ligne de la clé, restée ouverte : la rouvrir suffit */
    eteint: "Impossible pour le moment (vérification de sécurité). Ferme et rouvre l'app (ou recharge la page), puis réessaie. Si ça continue, écris à ton coach à {e}.",
    profil: "Le changement de mot de passe n'est pas possible pour le moment (vérification anti-robot). Ferme et rouvre l'app (ou recharge la page), puis réessaie. Si ça continue, écris à ton coach à {e}."
  },
  cle(){ try { const c = CONFIG.turnstile && CONFIG.turnstile.cle_site; return typeof c === "string" ? c.trim() : ""; } catch(e){ return ""; } },
  actif(){ return !!this.cle(); },
  surProfil(){ try { return this.actif() && CONFIG.turnstile.profil === true; } catch(e){ return false; } },
  html(mode){ return this.actif() && (mode === "connexion" || mode === "inscription") ? '<div class="co-captcha" id="co-captcha" data-notr></div>' : ""; },
  htmlProfil(){ return this.surProfil() ? '<div class="co-captcha mc-captcha" id="mc-captcha" data-notr></div>' : ""; },
  /* le script, une fois par page ; raté (injoignable, 15 s) : rejet, et un écran suivant réessaiera */
  charger(){
    if (window.turnstile && typeof window.turnstile.render === "function") return Promise.resolve(window.turnstile);
    if (this._charge) return this._charge;
    this._charge = new Promise((ok, ko) => {
      const s = document.createElement("script");
      let fini = false, m = null;
      const fin = erreur => {
        if (fini) return; fini = true; clearTimeout(m);
        if (!erreur && window.turnstile && typeof window.turnstile.render === "function") return ok(window.turnstile);
        this._charge = null; try { s.remove(); } catch(e){}
        ko(erreur || new Error("turnstile absent"));
      };
      window.mhxTurnstilePret = () => fin(null);
      s.src = this.SCRIPT; s.async = true;
      s.onerror = () => fin(new Error("script injoignable"));
      /* ajouté après l'événement « load » de la page : il ne retarde jamais le reste de l'app (MHX_JS, index.html) */
      const ajouter = () => { m = setTimeout(() => fin(new Error("délai dépassé")), this.CHARGEMENT); document.head.appendChild(s); };
      if (document.readyState === "complete") ajouter(); else window.addEventListener("load", ajouter, { once: true });
    });
    return this._charge;
  },
  /* ecran : « connexion », « inscription » ou « profil » (action du widget) ; idZone : le conteneur (#co-captcha par défaut) */
  monter(ecran, idZone){
    if (!this.actif()) return;
    this.oublier();
    const z = $(idZone || "co-captcha"); if (!z) return;
    const n = this.tour; this.zone = z; this.etat = "charge";
    const compact = z.clientWidth > 0 && z.clientWidth < 300;
    z.classList.toggle("compact", compact);
    /* Profil : la page quittée (autre outil), le widget est retiré */
    if (!this._veille){ this._veille = true; window.addEventListener("hashchange", () => setTimeout(() => { if (this.zone && !this.zone.isConnected) this.oublier(); }, 800)); }
    this.charger().then(T => {
      if (n !== this.tour || !z.isConnected) return;
      try {
        this.id = T.render(z, {
          sitekey: this.cle(), action: ecran, language: I18N.langue === "en" ? "en" : "fr",
          theme: Theme.actuel === "light" ? "light" : "dark", size: compact ? "compact" : "normal", appearance: "always",
          "response-field": false, "refresh-expired": "auto",
          callback: t => { if (n === this.tour){ this.etat = "pret"; this.liberer(t); } },
          "error-callback": () => { if (n === this.tour){ this.etat = "echec"; this.liberer(""); } return true; },
          "expired-callback": () => { if (n === this.tour) this.etat = "charge"; },
          "timeout-callback": () => { if (n === this.tour) this.etat = "charge"; },
          "unsupported-callback": () => { if (n === this.tour){ this.etat = "navigateur"; this.liberer(""); } }
        });
      } catch(e){ this.etat = "echec"; this.liberer(""); }
    }, () => { if (n === this.tour){ this.etat = "injoignable"; this.liberer(""); } });
  },
  jeton(){
    try {
      if (this.id == null || !window.turnstile) return "";
      if (typeof turnstile.isExpired === "function" && turnstile.isExpired(this.id)) return "";
      const t = turnstile.getResponse(this.id);
      return typeof t === "string" ? t : "";
    } catch(e){ return ""; }
  },
  /* le jeton, ATTENTE ms au plus ; tout de suite si le widget a échoué. Ne rejette jamais. */
  attendreJeton(){
    const t = this.jeton();
    if (t || !this.zone || !this.zone.isConnected || ["echec", "injoignable", "navigateur"].includes(this.etat)) return Promise.resolve(t);
    return new Promise(ok => {
      let m = null;
      const fini = x => { clearTimeout(m); const i = this._attentes.indexOf(fini); if (i > -1) this._attentes.splice(i, 1); ok(x || ""); };
      m = setTimeout(() => fini(this.jeton()), this.ATTENTE);
      this._attentes.push(fini);
    });
  },
  liberer(t){ const l = this._attentes.slice(); this._attentes = []; l.forEach(f => { try { f(t); } catch(e){} }); },
  async prendreJeton(){ const t = await this.attendreJeton(); this.envoye = !!t; return t; },
  /* après un envoi qui n'a pas abouti : un nouveau jeton si celui-ci est parti (consommé, même si le mot de passe était
     faux) ou si le widget a échoué ; parti SANS jeton (vérification pas finie) : on la laisse finir, le clic suivant
     prendra son jeton tout de suite */
  apresEssai(){
    try { if (this.id != null && window.turnstile && (this.envoye || this.etat === "echec")){ turnstile.reset(this.id); this.etat = "charge"; } } catch(e){}
    this.envoye = false;
  },
  /* le cadre (sous le bouton) amené à l'écran : il reste peut-être une case à cocher */
  voir(){ try { if (this.zone && this.zone.isConnected) this.zone.scrollIntoView({ block: "nearest" }); } catch(e){} },
  oublier(){
    try { if (this.id != null && window.turnstile) turnstile.remove(this.id); } catch(e){}
    this.id = null; this.zone = null; this.etat = ""; this.envoye = false; this.tour++; this.liberer("");
  },
  /* le message d'un refus du CAPTCHA par Supabase (400 captcha_failed, 500 « captcha verification process failed »),
     "" pour toute autre erreur ; reconnu au mot « captcha » (Auth.appel ne garde pas error_code), AVANT Auth.indispo */
  erreur(e){
    if (!/captcha/i.test(String((e && e.message) || ""))) return "";
    const p = { e: String((CONFIG.marque && CONFIG.marque.email) || "") };
    if (!this.actif()) return trad(this.TEXTES.eteint, p);   // CAPTCHA allumé dans Supabase avant la clé : écrire au coach
    if (this.envoye) return trad(e && e.statut >= 500 ? this.TEXTES.indispo : this.TEXTES.refus, p);
    const k = ["injoignable", "echec", "navigateur"].includes(this.etat) ? this.etat : "attente";
    if (k === "attente") this.voir();
    return trad(this.TEXTES[k], p);
  },
  erreurProfil(e){
    if (!/captcha/i.test(String((e && e.message) || ""))) return "";
    return this.surProfil() ? this.erreur(e) : trad(this.TEXTES.profil, { e: String((CONFIG.marque && CONFIG.marque.email) || "") });
  }
};

/* ---------------------- ÉCRAN DE CONNEXION ---------------------- */
/* v64 (brief V2, A2) : un lien vers un PDF des textes legaux (CONFIG.textes_legaux) ; lien absent ou non valide (« à
   compléter », branche de travail : le banc de main refuse de publier) → le mot seul, sans lien */
function lienLegal(id, cle, texte){
  const u = lienSur((CONFIG.textes_legaux || {})[cle]);
  return u ? `<a class="lien" id="${id}" href="${esc(u)}" target="_blank" rel="noopener">${esc(texte)}</a>` : `<span class="lien lien-absent" id="${id}">${esc(texte)}</span>`;
}
/* v72 (B) : l'écran d'entrée sans session ni adresse particulière — la création de compte sur un appareil neuf, la
   connexion sur un appareil déjà venu (Auth.appareilConnu) ; inscription fermée : toujours la connexion */
function entreePortail(){ return (CONFIG.marque && CONFIG.marque.inscription_libre && !Auth.appareilConnu()) ? "inscription" : "connexion"; }
function portail(mode){
  if (UI._ouverte) UI.fermer();   // v44 : un volet (conditions) encore ouvert ne doit pas figer l'ecran reconstruit
  /* v39 : « inscription » n'existe que si l'inscription libre est ouverte */
  const libre = !!(CONFIG.marque && CONFIG.marque.inscription_libre);
  mode = (mode === "oubli") ? "oubli" : (mode === "inscription" && libre) ? "inscription" : "connexion";
  const titre = mode === "oubli" ? "Mot de passe oublié" : mode === "inscription" ? DECOUVERTE.inscription.titre : "Connexion à ton espace";
  const bouton = mode === "oubli" ? "Recevoir le lien" : mode === "inscription" ? DECOUVERTE.inscription.bouton : "Se connecter";
  Captcha.oublier();   // v78 (tâche 3) : l'ancien widget (autre écran) est retiré avant que la page soit remplacée
  document.body.innerHTML = `
  <div class="portail">
    <div class="carte-co">
      <button type="button" class="co-langue" id="co-langue" data-notr>${I18N.langue === "en" ? "🇫🇷 Français" : "🇺🇸 English"}</button>
      <button type="button" class="co-langue co-theme" data-theme-bouton data-notr></button>
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      ${CONFIG.marque.programme ? `<div class="sous">${esc(CONFIG.marque.programme)}</div>` : ""}
      <h2>${esc(titre)}</h2>
      ${mode === "inscription" ? `<p class="co-sous">${esc(DECOUVERTE.inscription.sous)}</p>` : ""}
      ${mode === "inscription" ? `<div class="champ"><label for="c-prenom">Ton prénom</label><input id="c-prenom" type="text" autocomplete="given-name" maxlength="60"></div>` : ""}
      ${mode === "oubli"
        /* v52 (décision de Lucas) : l'app n'envoie aucun email pour l'instant (ni lien de mot de passe, ni vérification) :
           « Mot de passe oublié ? » donne seulement l'adresse du coach, aucun appel à /auth/v1/recover */
        ? ecrisNous(DECOUVERTE.inscription.oubli, "co-oubli", "co-sous")
        : `<div class="champ"><label for="c-email">Email</label><input id="c-email" type="email" autocomplete="email"></div>`}
      ${mode === "inscription"
        /* v44 : prenom, email, mot de passe (un seul, avec « Afficher ») et la case des conditions.
           v52 : + le nom ; cases SEPAREES, aucune cochee d'avance. v64 (brief V2, A) : UNE seule case obligatoire, les
           conditions (deux liens distincts vers les PDF, CONFIG.textes_legaux ; aucun espace avant le point final, qui ne
           tombe plus seul sous le lien), et la newsletter (facultative) ; l'accord sante est demande au premier usage (Sante).
           v74 (décision de Lucas du 04/10) : plus de champ « Nom » (prénom seul).
           v76 (tâche 7) : le numéro (WhatsApp) après le mot de passe, avec à quoi il sert, juste avant les cases */
        ? `<div class="champ"><label for="c-mdp">${esc(DECOUVERTE.inscription.mdp)}</label><div class="co-mdp"><input id="c-mdp" type="password" autocomplete="new-password"><button type="button" class="voir" id="c-voir" aria-pressed="false" aria-label="Afficher le mot de passe">Afficher</button></div></div>
      ${Contact.obligatoire() ? `<div class="champ"><label for="c-tel">${esc(trad("Ton numéro (WhatsApp)"))}</label>${Telephone.champHTML("c-tel")}<p class="note" id="c-tel-note" style="margin:6px 0 0">${esc(trad("Ton coach s'en sert pour t'appeler ou t'écrire sur WhatsApp. Jamais revendu."))}</p></div>` : ""}
      <label class="co-rester co-cgu"><input type="checkbox" id="c-cgu"><span>${esc(DECOUVERTE.inscription.cgu_avant)} ${lienLegal("c-cgu-lien", "cgu_pdf", DECOUVERTE.inscription.cgu_lien)} ${esc(DECOUVERTE.inscription.cgu_entre)} ${lienLegal("c-politique-lien", "confidentialite_pdf", DECOUVERTE.inscription.politique_lien)}${esc(DECOUVERTE.inscription.cgu_apres || "")}</span></label>
      <label class="co-rester co-newsletter"><input type="checkbox" id="c-newsletter"><span>${esc(DECOUVERTE.inscription.newsletter)}</span></label>`
        : mode !== "oubli" ? `<div class="champ"><label for="c-mdp">Mot de passe</label><input id="c-mdp" type="password" autocomplete="current-password"></div>` : ""}
      ${mode === "connexion" ? `<label class="co-rester"><input type="checkbox" id="c-rester" checked><span>Rester connecté</span></label>` : ""}
      <div id="co-err" role="alert"></div>
      ${mode !== "oubli" ? `<button class="btn" id="c-go">${esc(bouton)}</button>` : ""}${Captcha.html(mode)}
      ${mode === "inscription" ? `<p class="co-note">${esc(DECOUVERTE.inscription.note)}</p>` : ""}
      ${CONFIG.marque.version && mode !== "inscription" ? `<p class="co-aide">v${esc(CONFIG.marque.version)}</p>` : ""}
      <div class="bascule">
        ${mode === "connexion"
          ? `<button type="button" data-mode="oubli">Mot de passe oublié ?</button>${libre ? `<button type="button" data-mode="inscription">${esc(typoFr("Pas encore de compte ? Créer mon compte"))}</button>` : ""}`
          : mode === "inscription"
          ? `<button type="button" data-mode="connexion">${esc(typoFr("Déjà un compte ? Se connecter"))}</button>`
          : `<button type="button" data-mode="connexion">Retour à la connexion</button>`}
      </div>
    </div>
  </div>`;

  const err = (msg, ok) => { const e = $("co-err"); e.className = "erreur" + (ok ? " ok" : ""); e.textContent = msg; };
  /* v76 (tâche 7) : le champ fautif est marqué (classe « manque », aria-invalid), amené au milieu de l'écran et sélectionné ; la
     marque part dès qu'il est corrigé (le numéro : son menu ou son champ) */
  const nettoyer = c => { c.classList.remove("manque"); c.removeAttribute("aria-invalid"); };
  const fautif = id => {
    const c = $(id); if (!c) return;
    c.classList.add("manque"); c.setAttribute("aria-invalid", "true");
    try { c.scrollIntoView({ block: "center" }); } catch(e){}
    try { c.focus({ preventScroll: true }); } catch(e){}
  };
  $$(".carte-co input, .carte-co select").forEach(c => c.addEventListener(c.type === "checkbox" || c.tagName === "SELECT" ? "change" : "input", () => {
    const ligne = c.closest(".tel-ligne"); (ligne ? $$("input, select", ligne) : [c]).forEach(nettoyer);
  }));

  $$("[data-mode]").forEach(b => b.addEventListener("click", () => portail(b.dataset.mode)));
  Theme.majBoutons();
  /* v44 — inscription : voir le mot de passe (v64 : les conditions sont des liens vers les PDF, plus de volet ici) */
  const voir = $("c-voir");
  if (voir) voir.addEventListener("click", () => {
    const c = $("c-mdp"); if (!c) return;
    const montre = c.type === "password";
    c.type = montre ? "text" : "password";
    voir.textContent = montre ? trad("Masquer") : trad("Afficher");
    voir.setAttribute("aria-pressed", String(montre));
  });
  $("co-langue").addEventListener("click", () => {
    const ok = I18N.choisir(I18N.langue === "en" ? "fr" : "en");
    /* v72 (B) : le rechargement rouvre le même écran (sur un appareil neuf, l'adresse vide rouvrirait la création de compte) */
    if (ok && (mode === "connexion" || mode === "inscription")){ try { history.replaceState(null, "", location.pathname + location.search + "#/" + mode); } catch(e){} }
    if (ok) location.reload(); else portail(mode);
  });

  const valider = async () => {
    if (mode === "oubli" || !$("c-go") || !$("c-email")) return;   // v52 : « Mot de passe oublié » n'envoie plus rien
    if ($("c-go") && $("c-go").disabled) return;   // v44 : un envoi est deja en cours
    $$(".carte-co .manque").forEach(nettoyer);
    const email = ($("c-email").value || "").trim();
    const mdp = $("c-mdp") ? $("c-mdp").value : "";
    /* v76 (tâche 7) : à l'inscription, la vérification suit l'ordre de l'écran : prénom, email, mot de passe, numéro, case */
    const prenom = mode === "inscription" ? ($("c-prenom").value || "").trim().slice(0, 60) : "";
    if (mode === "inscription" && !prenom){ err("Indique ton prénom."); fautif("c-prenom"); return; }
    if (!email){ err("Indique ton email."); fautif("c-email"); return; }
    /* le choix doit etre pris AVANT la connexion : c'est lui qui decide
       ou la session sera rangee */
    const rester = $("c-rester");
    Auth.persistant = rester ? rester.checked : true;
    const b = $("c-go");
    if (mode === "inscription"){
      if (mdp.length < 8){ err("Le mot de passe doit faire au moins 8 caractères."); fautif("c-mdp"); return; }
      /* v72 (A) : le numéro (WhatsApp), obligatoire si CONFIG.marque.telephone_obligatoire vaut true */
      let T = null;
      if (Contact.obligatoire()){ T = Telephone.lire("c-tel"); if (T.erreur){ err(typoFr(trad(T.erreur))); fautif("c-tel"); return; } }
      const cgu = $("c-cgu");
      if (!cgu || !cgu.checked){ err(trad(DECOUVERTE.inscription.cgu_manque)); fautif("c-cgu"); return; }
      b.disabled = true; b.textContent = "Un instant…";
      try {
        const jeton = Captcha.actif() ? await Captcha.prendreJeton() : "";   // v78 (tâche 3) : 4 s au plus, puis envoi avec ou sans jeton
        if (!b.isConnected) return;   // v78 (tâche 3) : écran quitté pendant l'attente du jeton : rien n'est envoyé
        /* v44 : l'acceptation des conditions est datee ; P0.5 : consentement sante separe, horodate.
           v52 : prenom ET nom ; chaque accord porte sa date et la version de son texte (DECOUVERTE.accords) ;
           la newsletter (facultative) remplace les « emails de suivi » : emails_suivi n'est plus envoye (il reste lu
           pour les comptes d'avant). Le choix de la newsletter est recopie dans la cle « emails » a la premiere
           ouverture (Accords.copierEmails), pour que le coach le voie.
           v64 (brief V2, A) : plus d'accord sante a l'inscription (consentement_sante / sante_version : au premier usage,
           Sante.donner) ; conditions_version = la version des CGU en PDF (CONFIG.textes_legaux.cgu_version).
           v74 : plus de nom demandé : nom "" (le declencheur creer_profil range '' dans profils.nom, comme avant la v52) */
        const A = DECOUVERTE.accords, maintenant = new Date().toISOString();
        const ok_news = !!($("c-newsletter") && $("c-newsletter").checked);
        const connecte = await Auth.inscrire(email, mdp, prenom, "", {
          consentement: maintenant, conditions_version: A.conditions,
          newsletter: ok_news ? maintenant : null, newsletter_version: A.newsletter }, jeton);
        if (connecte){
          /* v72 (A) : la clé « contact » du nouveau compte (la session existe déjà), 6 s au plus ; ratée : gardée sur
             l'appareil, elle repart à l'ouverture qui suit (Contact.preparer) */
          const champs = {};
          if (T && T.tel) champs.telephone = T.tel;
          const ref = Provenance.locale(); if (ref) champs.ref = ref;   // v72 (F) : le code du lien d'inscription
          if (Object.keys(champs).length){
            champs.inscrit_le = maintenant;
            const uid = Auth.utilisateur() && Auth.utilisateur().id;
            try { await Contact.borne(Contact.enregistrer(champs, uid)); } catch(e){ if (uid) Contact.garderAttente(uid, champs); }
          }
          Provenance.oublier();   // v72 (F) : enregistré (ou dans la copie de secours) : il ne sert plus sur cet appareil
          /* v72 (F) : rechargement sans le code dans l'adresse (sinon une déconnexion le relirait) */
          try { history.replaceState(null, "", Provenance.adresseSans()); } catch(e){ location.hash = ""; }
          location.reload(); return;
        }
        ecranVerifieEmail(email); return;   // v47 : un ecran dedie, pas une ligne de message
      } catch(e){
        const m = (e.message || "").toLowerCase();
        const invalide = m.indexOf("email") > -1 && m.indexOf("invalid") > -1;   // v76 (tâche 7) : adresse refusée par le serveur
        const cap = Captcha.erreur(e); Captcha.apresEssai();   // v78 (tâche 3) : refus du CAPTCHA d'abord ; jeton consommé : un nouveau
        err(cap ? cap
          : /email rate limit/.test(m) ? trad(DECOUVERTE.inscription.trop_emails)   // v52 : limite horaire d'emails du projet
          : /error sending|sending .*email|smtp/.test(m) ? trad(DECOUVERTE.inscription.envoi_rate, { p: CONFIG.marque.pseudo || "" })   // v52 : le serveur d'emails a refusé
          : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(DECOUVERTE.inscription.trop_demandes)   // v47
          : m.indexOf("already") > -1 || m.indexOf("registered") > -1 ? "Un compte existe déjà avec cet email : connecte-toi."
          : m.indexOf("disabled") > -1 || m.indexOf("not allowed") > -1 ? "Les inscriptions ne sont pas encore ouvertes."
          /* v76 (tâche 7) : jamais le message brut du serveur à l'inscription */
          : invalide ? trad("Cette adresse email ne semble pas valide. Vérifie-la.")
          : trad("Inscription impossible pour le moment. Réessaie dans une minute."));
        if (invalide) fautif("c-email");
      }
      b.disabled = false; b.textContent = bouton;
      return;
    }
    b.disabled = true; b.textContent = "Un instant…";
    try {
      if (mode === "oubli"){
        await Auth.motDePasseOublie(email);
        err("Si un compte existe pour cet email, tu vas recevoir un lien.", true);
      } else {
        const jeton = Captcha.actif() ? await Captcha.prendreJeton() : "";   // v78 (tâche 3) : 4 s au plus, puis envoi avec ou sans jeton
        if (!b.isConnected) return;   // v78 (tâche 3) : écran quitté pendant l'attente du jeton : rien n'est envoyé
        await Auth.connecter(email, mdp, jeton);
        /* v57 : une connexion ouvre la page d'arrivee (accueil ; tableau de bord du coach), comme apres « Se deconnecter ».
           L'adresse gardait la derniere page ouverte sur l'appareil quand la session avait pris fin sans deconnexion
           (session expiree, « Rester connecte » decoche, navigateur ferme) : on arrivait sur la Speed Formation.
           Sauf « Me reconnecter » (session perdue en cours d'utilisation) : retour sur la page qu'on avait sous les yeux. */
        if (!reconnexion){ try { history.replaceState(null, "", Provenance.adresseSans()); } catch(e){} }   // v72 (F) : sans le code ?ref=
        /* v72 (F) : une personne qui se connecte n'est pas un nouvel inscrit : un code de lien gardé sur l'appareil est oublié */
        try { Provenance.oublier(); } catch(e){}
        location.reload();
      }
    } catch(e){
      const m = (e.message || "").toLowerCase();
      /* v47 : les messages de Supabase qui arrivent sur le parcours du funnel, en francais */
      /* v71 (F) : service indisponible (5xx, coupure, delai) : une phrase claire, jamais « Erreur 540 » ni « Failed to fetch » */
      const cap = Captcha.erreur(e); Captcha.apresEssai();   // v78 (tâche 3) : refus du CAPTCHA avant « Service… indisponible » (500) ; un nouveau jeton
      err(cap ? cap
        : Auth.indispo(e) ? trad("Service momentanément indisponible, réessaie dans une minute.")
        : m.indexOf("not confirmed") > -1 ? trad(DECOUVERTE.inscription.non_confirme)
        : /email rate limit/.test(m) ? trad(DECOUVERTE.inscription.trop_emails_compte)   // v52 : limite horaire d'emails du projet (pas forcement des inscriptions)
        : /error sending|sending .*email|smtp/.test(m) ? trad(DECOUVERTE.inscription.envoi_rate, { p: CONFIG.marque.pseudo || "" })   // v52 : « Error sending recovery email »
        : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(DECOUVERTE.inscription.trop_demandes)
        : m.indexOf("invalid") > -1 ? "Email ou mot de passe incorrect."
        : m.indexOf("password") > -1 ? "Le mot de passe doit faire au moins 6 caractères."
        : e.message || "Une erreur est survenue.");
    }
    b.disabled = false;
    b.textContent = bouton;
  };

  if ($("c-go")) $("c-go").addEventListener("click", valider);
  /* Un seul ecouteur a la fois. Avant, chaque aller-retour « mot de passe
     oublie » en ajoutait un : Entree envoyait alors un email de
     reinitialisation EN PLUS de la connexion. */
  if (portail._entree) document.removeEventListener("keydown", portail._entree);
  /* v76 (tâche 7) : les champs à taper, dans l'ordre de l'écran : Entrée passe au suivant (« suivant » sur le clavier du
     téléphone), seul le dernier envoie (« OK ») */
  const champs = ["c-prenom", "c-email", "c-mdp", "c-tel"].map(id => $(id)).filter(Boolean);
  champs.forEach((c, i) => c.setAttribute("enterkeyhint", i < champs.length - 1 ? "next" : "go"));
  portail._entree = e => {
    if (e.key !== "Enter") return;
    /* v44 : pas d'envoi depuis un bouton ou un lien (« Afficher », conditions), ni fenetre ouverte, ni envoi deja en cours */
    const t = e.target, go = $("c-go");
    if (UI._ouverte || (t && /^(BUTTON|A)$/.test(t.tagName)) || (go && go.disabled)) return;
    const i = champs.indexOf(t);
    if (i > -1 && i < champs.length - 1){ e.preventDefault(); champs[i + 1].focus(); return; }
    valider();
  };
  document.addEventListener("keydown", portail._entree);
  Captcha.monter(mode);   // v78 (tâche 3) : rien si la clé est vide ou sur « Mot de passe oublié »
}

/* ---------------------- ADRESSE ----------------------
   Les parametres apres « # » (liens d'email de Supabase : changement d'adresse, lien perime). v66 : des jetons de
   connexion n'y ouvrent plus jamais de session (demarrage.js). */
function lireAdresse(){
  const h = (location.hash || "").replace(/^#\/?/, "");
  const p = {};
  h.split("&").forEach(kv => {
    const [k, v] = kv.split("=");
    const dec = x => { try { return decodeURIComponent(x); } catch(e){ return x; } };   // v47 : « #% » ne doit pas bloquer le demarrage
    if (k) p[dec(k)] = dec((v || "").replace(/\+/g, " "));
  });
  return p;
}

/* v47 — apres l'inscription, quand Supabase demande de confirmer l'email : la carte du portail
   devient « Verifie ta boite mail » (l'adresse, ou chercher, et un retour a la connexion) */
function ecranVerifieEmail(email){
  const carte = document.querySelector(".portail .carte-co"); if (!carte) return;
  const T = DECOUVERTE.inscription;
  /* le formulaire n'existe plus : la touche Entree ne doit plus chercher a l'envoyer */
  if (portail._entree){ document.removeEventListener("keydown", portail._entree); portail._entree = null; }
  Captcha.oublier();   // v78 (tâche 3) : le formulaire et son widget disparaissent
  carte.innerHTML = `
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      <h2 id="co-verif" tabindex="-1">${esc(trad(T.verif_titre))}</h2>
      <p class="co-sous">${esc(trad(T.verif_texte, { e: email }))}</p>
      <p class="co-note">${esc(trad(T.verif_note))}</p>
      <div class="bascule"><button type="button" data-mode="connexion">${esc(trad(T.verif_retour))}</button></div>`;
  $$("[data-mode]", carte).forEach(b => b.addEventListener("click", () => portail(b.dataset.mode)));
  const h2 = $("co-verif"); if (h2) h2.focus();
}

/* v72 (A) — téléphone obligatoire : un client ou un prospect sans numéro le donne ici, avant l'accueil (demarrage.js).
   Aucun moyen de passer : seulement enregistrer, ou se déconnecter (appareil partagé). Enregistré : la page se recharge
   et l'app s'ouvre normalement. Le numéro gardé sur l'appareil après une inscription ratée pré-remplit le champ. */
function ecranTelephone(){
  try { if (UI._ouverte) UI.fermer(); } catch(e){}
  if (portail._entree){ document.removeEventListener("keydown", portail._entree); portail._entree = null; }
  const u = Auth.utilisateur(), att = u && u.id ? Contact.lireAttente(u.id) : null;
  document.body.innerHTML = `
  <div class="portail"><div class="carte-co" id="co-tel-carte">
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      <h2 id="co-tel" tabindex="-1">${esc(trad("Ajoute ton numéro pour que ton coach puisse te joindre"))}</h2>
      <p class="co-sous">${esc(trad("Ton coach s'en sert pour t'appeler ou t'écrire sur WhatsApp."))}</p>
      <div id="co-err" role="alert"></div>
      <div class="champ"><label for="t-tel">${esc(trad("Ton numéro (WhatsApp)"))}</label>${Telephone.champHTML("t-tel", att && att.telephone)}</div>
      <button class="btn" id="t-go">${esc(trad("Enregistrer mon numéro"))}</button>
      ${CONFIG.marque.version ? `<p class="co-aide">v${esc(CONFIG.marque.version)}</p>` : ""}
      <div class="bascule"><button type="button" id="t-sortir">${esc(trad("Se déconnecter"))}</button></div>
  </div></div>`;
  const err = msg => { const e = $("co-err"); e.className = "erreur"; e.textContent = msg; };
  const go = $("t-go");
  const envoyer = async () => {
    if (go.disabled) return;
    const T = Telephone.lire("t-tel");
    if (T.erreur){ err(typoFr(trad(T.erreur))); return; }
    go.disabled = true; go.textContent = trad("Un instant…");
    try {
      await Contact.enregistrer({ telephone: T.tel });
      if (u && u.id) Contact.oublierAttente(u.id);
      location.reload();
      return;
    } catch(e){
      err(Auth.indispo(e) ? trad("Service momentanément indisponible, réessaie dans une minute.")
        : e && e.statut === 401 ? trad("Ta session a pris fin : reconnecte-toi.")
        : trad("Non enregistré : réessaie dans un instant."));
    }
    go.disabled = false; go.textContent = trad("Enregistrer mon numéro");
  };
  go.addEventListener("click", envoyer);
  $("t-sortir").addEventListener("click", () => Auth.deconnecter());
  portail._entree = e => { if (e.key === "Enter" && e.target && e.target.id === "t-tel") envoyer(); };
  document.addEventListener("keydown", portail._entree);
  const h2 = $("co-tel"); if (h2) h2.focus();
}

/* v71 (F) — le profil du compte n'a pas pu etre lu (reseau, 5xx) : rien de l'app ne s'affiche (un prospect verrait
   l'espace client sans cadenas, le coach « Bienvenue ! »). « Reessayer » et le retour du reseau rechargent la page
   (demarrer n'est pas rappelable) ; la session reste rangee sur l'appareil. */
function ecranIndisponible(){
  try { if (UI._ouverte) UI.fermer(); } catch(e){}
  document.body.innerHTML = `
  <div class="portail"><div class="carte-co">
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      <h2 id="co-indispo" tabindex="-1">${esc(trad("Impossible de charger ton compte pour le moment"))}</h2>
      <p class="co-sous">${esc(trad("Vérifie ta connexion, puis réessaie."))}</p>
      <div class="actions"><button type="button" class="btn" id="co-reessayer">${esc(trad("Réessayer"))}</button></div>
      ${CONFIG.marque.version ? `<p class="co-aide">v${esc(CONFIG.marque.version)}</p>` : ""}
  </div></div>`;
  $("co-reessayer").addEventListener("click", () => location.reload());
  window.addEventListener("online", () => location.reload(), { once: true });
  const h2 = $("co-indispo"); if (h2) h2.focus();
}

