/* ------------------------------------------------------------------
   « Ajoute l'application à ton écran d'accueil »
   Le mode d'emploi n'est pas le meme selon le telephone, et il n'y a
   aucun moyen fiable de le detecter : on montre celui qui correspond,
   et on laisse le choix de voir l'autre. Une fois que la personne a
   clique sur « C'est fait », la banniere ne revient plus — le reglage
   reste sur son appareil, puisqu'il ne concerne QUE cet appareil.
   ------------------------------------------------------------------ */
const CLE_INSTALL = "mhx_installe";

/* v78 (tâche 2) — NAVIGATEUR D'UNE APPLICATION : Instagram, TikTok, Facebook / Messenger (iPhone et Android), repéré par son
   user agent seul (rien d'autre : Snapchat, LinkedIn, WhatsApp, une WebView quelconque restent comme avant). Sa mémoire est
   séparée de Safari et de Chrome : un compte créé là y reste coincé. Rien ne bloque ni ne retarde l'inscription (une simple
   lecture de navigator.userAgent, aucune attente, aucun écran de plus).
   - Inscription réussie dans un de ces navigateurs : le drapeau de l'appareil « mhx_integre|<id du compte> » = { app,
     sys, inscrit, ferme } (rien de personnel ; pas dans Auth.CLES_APPAREIL : il part à la déconnexion).
   - Carte « Dernière étape : mets l'app sur ton téléphone » (outilDecouverte.rendre, branche accueil : jamais avant la page
     « Ton plan d'action ») pour ce prospect, tant qu'il est dans un de ces navigateurs, à chaque affichage de l'accueil
     jusqu'à « Plus tard » (écrit en haut à droite, et en bas) ; ensuite plus jamais (mémoire de l'appareil) : la bannière prend le relais aux
     visites suivantes. Carte affichée : ni invitation (v62) ni bannière.
   - Adresse : session d'un compte inscrit dans ce navigateur (drapeau), toujours dedans : « ?ouvrir=connexion » (ancre
     gardée, sauf une ancre d'inscription ou de connexion, qui n'y sert à rien) : la page ouverte ensuite dans Safari ou
     Chrome (appareil neuf pour l'app) mène à #/connexion, pas à l'inscription ; retiré à la connexion
     (Provenance.adresseSans). Jamais pour un autre compte (coach, client) : un lien copié puis partagé ouvre l'écran
     d'entrée habituel. Connexion arrivée ainsi dans un navigateur normal : la bannière normale dès cette visite, en haut de
     la page, avec les étapes de DECOUVERTE.integre (sans la connexion, déjà faite).
   - Bannière d'installation dans ces navigateurs : les étapes de l'app (iPhone), ou le bouton Chrome (Android).
   Textes : DECOUVERTE.integre (et .en). Aucune écriture en base. CONFIG.marque.navigateur_integre !== true : exactement
   comme avant (rien de tout ceci). Rien ne s'exécute au chargement de ce fichier. */
const Integre = {
  CLE: "mhx_integre|", PARAM: "ouvrir", FERME: "mhx_integre_ferme", SUITE: "mhx_integre_suite",
  NOMS: { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" },
  allume(){ try { return !!(CONFIG.marque && CONFIG.marque.navigateur_integre === true); } catch(e){ return false; } },
  ua(ua){ try { return String(ua == null ? (navigator.userAgent || "") : ua); } catch(e){ return ""; } },
  /* Instagram avant Facebook (même éditeur) ; Facebook et Messenger ensemble, ancien format (FBAN, FBAV, FB_IAB) ou nouveau
     (MetaIAB) ; jamais « facebookexternalhit » (le robot d'aperçu des liens) */
  app(ua){
    const s = this.ua(ua);
    if (/\bInstagram\b/.test(s)) return "instagram";
    if (/FBAN\/|FBAV\/|FB_IAB\/|\bMetaIAB\b/.test(s)) return "facebook";
    if (/musical_ly|\btrill_|BytedanceWebview/.test(s)) return "tiktok";
    return "";
  },
  systeme(ua){ const s = this.ua(ua); return /iPhone|iPad|iPod/.test(s) ? "ios" : /Android/.test(s) ? "android" : ""; },
  /* le nom affiché : Messenger quand il se dit (FBAN/Messenger…, FB_IAB/MESSENGER, Orca-Android), sinon celui de l'app */
  nom(app, ua){ const s = this.ua(ua); return app === "facebook" && /FBAN\/Messenger|FB_IAB\/(MESSENGER|Orca-Android)/.test(s) ? "Messenger" : (this.NOMS[app] || ""); },
  /* { app, sys } dans un de ces navigateurs (interrupteur allumé), sinon null */
  ici(ua){ try { if (!this.allume()) return null; const a = this.app(ua), y = this.systeme(ua); return a && y ? { app: a, sys: y } : null; } catch(e){ return null; } },
  /* sans session : l'adresse demande la connexion (lien ouvert depuis un de ces navigateurs) */
  versConnexion(){ if (!this.allume()) return false; try { return new URLSearchParams(location.search).get(this.PARAM) === "connexion"; } catch(e){ return false; } },
  /* avec une session dans un de ces navigateurs, compte inscrit ici (drapeau) : ?ouvrir=connexion dans l'adresse (seulement
     si elle change ; reste de la requête gardé). L'ancre est gardée, sauf une ancre d'inscription ou de connexion (lien
     « …/#/inscription?ref=… » touché de nouveau) : avec une session elle ne sert à rien, et ouverte ensuite dans Safari ou
     Chrome elle mènerait à l'inscription (#/inscription garde la priorité, demarrage.js) ; retirée, l'app ouvre sa page
     d'arrivée. Ailleurs, ou un autre compte (coach, client sans drapeau) : rien. */
  adresse(){
    if (!this.ici()) return;
    try {
      const u = Auth.utilisateur(); if (!u || !u.id || !this.lire(u.id)) return;
      const q = new URLSearchParams(location.search), ancre = /inscription|connexion/.test(location.hash) ? "" : location.hash;
      if (q.get(this.PARAM) === "connexion" && ancre === location.hash) return;
      q.set(this.PARAM, "connexion");
      history.replaceState(null, "", location.pathname + "?" + q.toString() + ancre);
    } catch(e){}
  },
  /* Android : le lien qui ouvre la page dans Chrome (format documenté par Chrome ; adresse de secours si Chrome manque),
     sur un vrai toucher seulement ; rien d'autre que ?ouvrir=connexion (ni le code ?ref=, ni les traceurs ajoutés par
     Instagram ou Facebook : fbclid, utm_…, igsh) : aucune donnée personnelle */
  lienChrome(){
    const cible = location.host + location.pathname + "?" + this.PARAM + "=connexion";
    return "intent://" + cible + "#Intent;scheme=" + String(location.protocol).replace(/:$/, "") + ";package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(location.protocol + "//" + cible) + ";end";
  },
  /* le drapeau du compte : la copie de la visite d'abord (toujours la dernière écriture, même si l'appareil l'a refusée :
     stockage plein ou bloqué), sinon l'appareil */
  _memo: {},
  lire(uid){
    if (!uid) return null;
    let x = this._memo[uid] || null;
    if (!x) try { x = JSON.parse(localStorage.getItem(this.CLE + uid) || "null"); } catch(e){ x = null; }
    if (!x || typeof x !== "object" || Array.isArray(x) || typeof x.inscrit !== "string" || !x.inscrit) return null;
    return { app: this.NOMS[x.app] ? x.app : "", sys: x.sys === "android" ? "android" : x.sys === "ios" ? "ios" : "", inscrit: x.inscrit.slice(0, 40), ferme: typeof x.ferme === "string" ? x.ferme.slice(0, 40) : "" };
  },
  ecrire(uid, m){ this._memo[uid] = JSON.parse(JSON.stringify(m)); try { localStorage.setItem(this.CLE + uid, JSON.stringify(m)); } catch(e){} },
  /* connexion.js, juste après une inscription réussie (synchrone, rien n'attend) */
  noterInscription(){
    const ici = this.ici(); if (!ici) return;
    const u = Auth.utilisateur(); if (!u || !u.id) return;
    this.ecrire(u.id, { app: ici.app, sys: ici.sys, inscrit: new Date().toISOString(), ferme: "" });
  },
  /* connexion.js, juste après une connexion réussie arrivée par ?ouvrir=connexion dans un navigateur normal : la bannière
     normale dès cette visite (drapeau d'onglet) */
  noterConnexion(){ if (!this.versConnexion() || this.ici()) return; try { sessionStorage.setItem(this.SUITE, "1"); } catch(e){} },
  suiteConnexion(){ if (!this.allume() || this.ici()) return false; try { return sessionStorage.getItem(this.SUITE) === "1"; } catch(e){ return false; } },
  /* la carte est due : prospect (lui-même) inscrit dans ce navigateur, toujours dedans, « Plus tard » pas encore touché */
  carteDue(){
    if (!this.ici()) return false;
    const u = Auth.utilisateur(); if (!u || !u.id || !Auth.estProspect() || Store.idConsulte) return false;
    const m = this.lire(u.id); return !!(m && !m.ferme);
  },
  /* la bannière se tait tant que la carte est due, et pendant la visite où « Plus tard » a été touché */
  retientBandeau(){
    if (this.carteDue()) return true;
    const u = Auth.utilisateur(); if (!this.ici() || !u || !u.id) return false;
    try { return sessionStorage.getItem(this.FERME) === u.id; } catch(e){ return false; }
  },
  textes(){ return (typeof DECOUVERTE !== "undefined" && DECOUVERTE.integre) || {}; },
  /* un texte de DECOUVERTE.integre : traduit, typographie française, échappé ; **…** en gras ; les valeurs échappées
     ensuite (un email avec ** ou { } reste tel quel) */
  html(fr, vars){
    let s = esc(typoFr(trad(String(fr || "")))).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    if (vars) Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(esc(vars[k])); });
    return s;
  },
  /* les étapes (contenu du bloc .integre-etapes) ; p : préfixe des id (integre : la carte, inst : la bannière). Android : le
     bouton Chrome, juste dessous ce qu'il faut faire s'il n'ouvre rien (à lire avant de toucher), puis les étapes de tous */
  etapesHTML(sys, app, p){
    const T = this.textes(), li = x => `<li>${this.html(x)}</li>`;
    if (sys === "android") return `<div class="actions integre-ouvrir"><a class="btn" id="${p}-chrome" data-integre-chrome href="${esc(this.lienChrome())}">${esc(typoFr(trad(T.chrome || "")))}</a></div>`
      + `<p class="note integre-secours">${this.html(T.secours)}</p><ol>${(T.android || []).map(li).join("")}</ol>`;
    const o = T.ios_ouvrir || {};
    return `<ol>${[o[app] || o.instagram].concat(T.ios || []).map(li).join("")}</ol>`;
  },
  /* la bannière normale après une connexion arrivée par ?ouvrir=connexion (suiteConnexion) : les étapes de la carte qui
     restent (Safari : Partager, Sur l'écran d'accueil, ouvrir l'icône ; Chrome : ⋮ puis Installer), sans la connexion */
  etapesSuite(ios){ const T = this.textes(); return ((ios ? T.ios : T.android) || []).slice(1).map(x => `<li>${this.html(x)}</li>`).join(""); },
  carteHTML(){
    const ici = this.ici(), T = this.textes(), u = Auth.utilisateur() || {};
    const email = typeof u.email === "string" ? u.email.trim().slice(0, 254) : "";
    const tard = esc(typoFr(trad(T.plus_tard || "Plus tard")));
    return `<section class="panel integre-carte" id="integre-carte" aria-labelledby="integre-titre">
      <button type="button" class="fermer" id="integre-fermer">${tard}</button>
      <h2 id="integre-titre">${esc(typoFr(trad(T.titre || "")))}</h2>
      <p class="integre-ids" id="integre-ids">${email ? this.html(T.identifiants, { e: email }) : this.html(T.identifiants_sans)}</p>
      <div class="integre-etapes" id="integre-etapes">${this.etapesHTML(ici.sys, ici.app, "integre")}</div>
      <div class="actions"><button type="button" class="btn ghost" id="integre-plus-tard">${tard}</button></div>
    </section>`;
  },
  /* sur l'accueil du prospect (après la page du plan d'action), sous l'en-tête ; null si elle n'est pas due */
  montrerCarte(zone){
    try {
      if (!this.carteDue()) return null;
      const h = zone && zone.querySelector(".masthead"); if (!h) return null;
      const d = document.createElement("div"); d.innerHTML = this.carteHTML();
      const carte = d.firstElementChild; if (!carte) return null;
      h.after(carte);
      const uid = Auth.utilisateur().id;
      const fermer = () => {
        const m = this.lire(uid) || { app: "", sys: "", inscrit: new Date().toISOString(), ferme: "" };
        m.ferme = new Date().toISOString(); this.ecrire(uid, m);
        try { sessionStorage.setItem(this.FERME, uid); } catch(e){}
        carte.remove();
      };
      ["integre-fermer", "integre-plus-tard"].forEach(id => { const b = carte.querySelector("#" + id); if (b) b.addEventListener("click", fermer); });
      return carte;
    } catch(e){ console.warn("[MHX] carte du navigateur intégré", e); return null; }
  },
  /* la bannière d'installation dans un de ces navigateurs (mêmes id que la bannière normale) */
  bandeauHTML(ici){
    const ios = ici.sys === "ios";
    return `<div class="installe installe-integre" id="installe">
    <button type="button" class="fermer" id="inst-plus-tard" aria-label="Plus tard">×</button>
    <h3>Mets ${esc(CONFIG.marque.nom)} sur ton écran d'accueil</h3>
    <p>Tu l'ouvres d'un doigt, elle s'affiche en plein écran, et tu n'as plus à retenir l'adresse.</p>
    <p class="integre-ici" id="inst-ici">${this.iciHTML(ici, ios)}</p>
    <div class="integre-etapes" id="inst-etapes">${this.etapesHTML(ici.sys, ici.app, "inst")}</div>
    <p class="note" style="margin:0 0 12px">
      <button type="button" class="lien-bouton" id="inst-bascule">${ios ? "Je suis sur Android" : "Je suis sur iPhone"}</button>
    </p>
    <div class="actions">
      <button class="btn" id="inst-fait">C'est fait</button>
      <button class="btn ghost" id="inst-plus-tard-2">Plus tard</button>
    </div>
  </div>`;
  },
  iciHTML(ici, ios){ return this.html(this.textes().bandeau, { a: this.nom(ici.app), n: ios ? "Safari" : "Chrome" }); },
  /* « Je suis sur iPhone / Android » dans la bannière de ces navigateurs */
  basculer(ici, ios){
    const e = $("inst-etapes"), l = $("inst-ici");
    if (e) e.innerHTML = this.etapesHTML(ios ? "ios" : "android", ici.app, "inst");
    if (l) l.innerHTML = this.iciHTML(ici, ios);
  }
};

/* Le manifeste est embarque dans le fichier, donc sans adresse de base : sans
   start_url ni scope, « ajouter a l'ecran d'accueil » ouvrirait la racine du
   domaine au lieu de l'application. On les recalcule au demarrage depuis
   l'adresse reelle — l'application tourne ainsi sur n'importe quel
   hebergement, y compris dans un sous-dossier, sans etre retouchee. */
function ancrerManifeste(){
  const lien = document.getElementById("manifeste");
  if (!lien || !lien.href || lien.href.indexOf("data:") !== 0) return;
  try {
    const brut = decodeURIComponent(lien.href.replace(/^data:application\/manifest\+json,/, ""));
    const m = JSON.parse(brut);
    const ici = location.origin + location.pathname;
    m.start_url = ici;
    m.scope = ici.replace(/[^/]*$/, "");     // le dossier qui contient la page
    const blob = new Blob([JSON.stringify(m)], { type: "application/manifest+json" });
    lien.href = URL.createObjectURL(blob);
  } catch(e){ /* le manifeste reste tel quel : l'application fonctionne quand meme */ }
}

function dejaInstalle(){
  /* lancee depuis l'ecran d'accueil : la question ne se pose plus */
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.navigator && window.navigator.standalone) return true;
  try {
    if (sessionStorage.getItem(CLE_INSTALL) === "1") return true;   // « plus tard »
    return localStorage.getItem(CLE_INSTALL) === "1";               // « c'est fait »
  } catch(e){ return false; }
}

/* La banniere n'apparait qu'a partir de la 2e visite. A la toute premiere,
   le nouveau client doit voir son espace et remplir son profil : une grande
   fenetre qui masque tout, c'est la pire premiere impression (retour QA de
   GROK, 22/09). Une visite = une ouverture de l'application, comptee une
   seule fois meme si on change d'onglet. */
function visiteSuivante(){
  try {
    if (!sessionStorage.getItem("mhx_visite_comptee")){
      sessionStorage.setItem("mhx_visite_comptee", "1");
      localStorage.setItem("mhx_visites", String((parseInt(localStorage.getItem("mhx_visites"), 10) || 0) + 1));
    }
    return (parseInt(localStorage.getItem("mhx_visites"), 10) || 0) >= 2;
  } catch(e){ return true; }
}

function bandeauInstallation(){
  /* v78 (tâche 2) : après une connexion arrivée par ?ouvrir=connexion (navigateur normal), dès cette visite, avec les étapes
     de DECOUVERTE.integre (data-integre-suite ; navigation.js la pose en haut de la page) ; dans le navigateur d'Instagram,
     de TikTok ou de Facebook, les étapes de l'app (Integre) ; sinon exactement comme avant */
  const I = typeof Integre !== "undefined" ? Integre : null, suite = !!(I && I.suiteConnexion());
  if (!Auth.connecte() || Store.idConsulte || dejaInstalle() || (!visiteSuivante() && !suite)) return "";
  const ici = I && I.ici();
  if (ici) return I.retientBandeau() ? "" : I.bandeauHTML(ici);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
  return `<div class="installe" id="installe"${suite ? " data-integre-suite" : ""}>
    <button type="button" class="fermer" id="inst-plus-tard" aria-label="Plus tard">×</button>
    <h3>Mets ${esc(CONFIG.marque.nom)} sur ton écran d'accueil</h3>
    <p>Tu l'ouvres d'un doigt, elle s'affiche en plein écran, et tu n'as plus à retenir l'adresse.</p>
    <ol id="inst-etapes">${suite ? I.etapesSuite(ios) : ios ? etapesIOS() : etapesAndroid()}</ol>
    <p class="note" style="margin:0 0 12px">
      <button type="button" class="lien-bouton" id="inst-bascule">${ios ? "Je suis sur Android ou ordinateur" : "Je suis sur iPhone"}</button>
    </p>
    <div class="actions">
      <button class="btn" id="inst-fait">C'est fait</button>
      <button class="btn ghost" id="inst-plus-tard-2">Plus tard</button>
    </div>
  </div>`;
}

function etapesIOS(){
  return `<li>Touche le bouton <b>Partager</b> en bas de Safari — le carré avec une flèche vers le haut.</li>
          <li>Fais défiler et choisis <b>« Sur l'écran d'accueil »</b>.</li>
          <li>Touche <b>Ajouter</b> en haut à droite.</li>`;
}
function etapesAndroid(){
  return `<li>Ouvre le menu de ton navigateur — les trois points en haut à droite.</li>
          <li>Choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</li>
          <li>Confirme.</li>`;
}

function brancherInstallation(){
  const boite = $("installe");
  if (!boite) return;
  /* v78 (tâche 2) : la bannière du navigateur d'Instagram, de TikTok ou de Facebook (Integre.bandeauHTML) */
  const ici = boite.classList.contains("installe-integre") && typeof Integre !== "undefined" ? Integre.ici() : null;
  const suite = !ici && boite.hasAttribute("data-integre-suite") && typeof Integre !== "undefined";   // après ?ouvrir=connexion
  let ios = ici ? ici.sys === "ios" : /iphone|ipad|ipod/i.test(navigator.userAgent || "");

  const bascule = $("inst-bascule");
  if (bascule) bascule.addEventListener("click", () => {
    ios = !ios;
    if (ici){ Integre.basculer(ici, ios); bascule.textContent = ios ? "Je suis sur Android" : "Je suis sur iPhone"; return; }
    $("inst-etapes").innerHTML = suite ? Integre.etapesSuite(ios) : ios ? etapesIOS() : etapesAndroid();
    bascule.textContent = ios ? "Je suis sur Android ou ordinateur" : "Je suis sur iPhone";
  });

  const fait = $("inst-fait");
  if (fait) fait.addEventListener("click", () => {
    try { localStorage.setItem(CLE_INSTALL, "1"); } catch(e){}
    boite.remove();
  });

  /* « Plus tard » ne ferme que pour cette visite : la banniere reviendra
     a la prochaine ouverture, mais pas dans cette session. */
  const plusTard = () => { boite.remove(); sessionStorage.setItem(CLE_INSTALL, "1"); };
  const b1 = $("inst-plus-tard"), b2 = $("inst-plus-tard-2");
  if (b1) b1.addEventListener("click", plusTard);
  if (b2) b2.addEventListener("click", plusTard);
}

