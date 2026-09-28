/* ==================================================================
   [G] NAVIGATION, CONNEXION ET DEMARRAGE
   Chaque outil a sa propre adresse : #/calculateur, #/mensurations,
   #/entrainement. Le coach voit en plus #/clients.
   ================================================================== */
let courant = OUTILS[0].id;
let sousRoute = "";   // ce qui suit l'identifiant dans l'adresse (#/decouverte/reponses -> "reponses")
let nettoyage = null;
let affichage = 0;   // numero du dernier affichage demande

function outilsVisibles(){
  /* role: "coach"      -> outil du coach, quitte la fiche client quand on l'ouvre
     masque_client: true -> outil du coach, mais qui reste dans la fiche du client
     client_seul: true   -> outil du client ; le coach ne le voit qu'en consultant une fiche */
  /* prospect_seul: true -> outil du compte gratuit (la Decouverte) ; ni client accompagne, ni coach */
  /* v52 — ouvert_prospect: true -> un outil masque_client ouvert quand meme au prospect ; v53 : plus aucun outil ne
     le porte (le calculateur n'est plus masque_client : ouvert a tous, chacun sur sa cle, voir outilCalculateur) */
  return OUTILS.filter(o => (!o.role || (o.role === "coach" && Auth.estCoach()))
                         && (!o.masque_client || Auth.estCoach() || (o.ouvert_prospect && Auth.estProspect()))
                         && (!o.client_seul || !Auth.estCoach() || Store.idConsulte)
                         && (!o.prospect_seul || Auth.estProspect()));
}

/* v40 — MODE GRATUIT. Un prospect (Auth.estProspect) n'a d'ouverts que les
   onglets de CONFIG.marque.gratuit_ouverts ; tous les autres affichent un
   cadenas, ce que l'accompagnement apporte et « Réserver mon bilan ». Liste
   blanche : un onglet ajoute plus tard est verrouille par defaut. Le coach
   qui consulte une fiche voit tout. */
function estVerrouille(o){
  if (!o || o.role === "coach" || Store.idConsulte || !Auth.estProspect()) return false;
  const ouverts = (CONFIG.marque && CONFIG.marque.gratuit_ouverts) || ["accueil", "decouverte", "profil"];
  /* v52 : gratuit pour toujours — plus de verrou de la Speed Formation au 8e jour (elle est dans gratuit_ouverts) */
  return ouverts.indexOf(o.id) === -1;
}
/* v50 — un onglet verrouille hors de la vitrine (CONFIG.marque.gratuit_vitrine) n'encombre pas la navigation
   du prospect ; son adresse reste valable (page verrouillee). Rien ne change pour un client ni pour le coach. */
function horsVitrine(o){
  if (!o || !Auth.estProspect() || Store.idConsulte || !estVerrouille(o)) return false;
  const v = CONFIG.marque && CONFIG.marque.gratuit_vitrine;
  return Array.isArray(v) && v.indexOf(o.id) === -1;
}
function cadenasNav(o){ return estVerrouille(o) ? `<span class="nav-cadenas" aria-hidden="true">${SVG.cadenas}</span><span class="sr-only"> (${esc(trad("verrouillé"))})</span>` : ""; }
const AVANTAGES = {
  programme: "Ton programme d'entraînement sur mesure, construit et ajusté par ton coach.",
  nutrition: "Ta diète personnalisée, tes repas du jour et ta liste de courses.",
  mensurations: "Ton poids, tes mensurations et ta composition corporelle, semaine après semaine.",
  suivi: "Ta régularité, tes objectifs du mois, ton bilan de la semaine et les retours de ton coach.",
  bilan: "Ton bilan du mois, préparé avec ton coach.",
  complements: "Tes compléments conseillés, avec les doses et les moments.",
  journal: "Ton journal d'entraînement : chaque séance notée, tes charges et tes progrès, semaine après semaine."   // v52
};
function pageVerrouillee(o){
  /* v52 : plus de page spéciale pour la Speed Formation (ouverte pour toujours) */
  const plus = AVANTAGES[o.id];
  /* v52 (lot E) : pour un prospect, d'abord un exemple generique de la page (Echantillons : marque « Exemple », aucune de
     ses donnees), puis « Tu veux un programme construit pour toi… » et « Réserver mon bilan » — toujours un lien
     .verrou a[target=_blank] : afficher() compte le clic (source verrou-<id>). Les autres pages verrouillees : inchangees. */
  const ech = Echantillons.html(o.id);
  if (ech) return `${ech}<section class="panel ech-appel">${UI.verrou({ titre: trad(nomOnglet(o)), texte: trad(DECOUVERTE.echantillons.appel), lien: lienCalendly("verrou-" + o.id), cta: trad("Réserver mon bilan") })}
    ${plus ? `<p class="note verrou-plus">${esc(trad(plus))}</p>` : ""}</section>`;
  return `<section class="panel">${UI.verrou({ titre: trad(nomOnglet(o)), texte: trad("Cette fonctionnalité est disponible avec l'accompagnement MHX."), lien: lienCalendly("verrou-" + o.id), cta: trad("Réserver mon bilan") })}
    ${plus ? `<p class="note verrou-plus">${esc(trad(plus))}</p>` : ""}</section>`;
}

/* v52 (Chantier 1, lot E) — ECHANTILLONS : l'exemple GENERIQUE qu'un prospect voit sur une page verrouillee, avant
   « Réserver mon bilan ». Lecture seule, marque « Exemple », sans aucune de ses donnees : une page verrouillee ne lit
   toujours aucune cle « donnees » (pas d'init()). programme : la seance decouverte (outilDecouverte.seanceHTML, sans
   reponse, donc niveau debutant) ; nutrition : une journee type faite des recettes du catalogue PUBLIC
   (CONFIG.decouverte.recettes, lues comme outilDecouverte.chargerRecettes) ; journal : une seance notee ; suivi : un suivi
   de la semaine (les deux derniers ecrits en dur). Textes : DECOUVERTE.echantillons (FR) et DECOUVERTE.en.echantillons. */
const Echantillons = {
  ids: ["programme", "nutrition", "journal", "suivi"],
  L(){ return (typeof DECOUVERTE !== "undefined" && DECOUVERTE.echantillons) || {}; },
  /* le bloc complet (marque « Exemple » + exemple) ; "" : pas d'exemple pour cette page, ou pas un prospect */
  html(id){
    if (this.ids.indexOf(id) === -1 || !Auth.estProspect() || Store.idConsulte) return "";
    let corps = "";
    try { corps = this[id](); } catch(e){ console.warn("[MHX] exemple illisible (" + id + ")", e); return ""; }
    if (!corps) return "";
    const L = this.L();
    return `<div class="echantillon" id="ech-${id}" role="region" aria-labelledby="ech-${id}-m">
      <p class="ech-marque" id="ech-${id}-m"><span class="pastille accent">${esc(trad(L.marque || "Exemple"))}</span> <span>${esc(trad(L.note || ""))}</span></p>
      ${corps}</div>`;
  },
  programme(){ return outilDecouverte.seanceHTML({}); },
  nutrition(){
    const L = this.L().nutrition || {};
    return `<section class="panel"><h2>${esc(trad(L.titre || ""))}</h2><p class="note" style="margin:0 0 8px">${esc(trad(L.intro || ""))}</p>
      <div id="ech-repas"><div class="empty">${esc(trad("Chargement…"))}</div></div></section>`;
  },
  journal(){
    const L = this.L().journal || {}, ex = (Array.isArray(L.exercices) ? L.exercices : []).filter(e => e && e.nom);
    const nbS = ex.reduce((n, e) => n + (Array.isArray(e.series) ? e.series.length : 0), 0);
    const bloc = e => {
      const series = (Array.isArray(e.series) ? e.series : []).map(s => ({ r: num(s && s[0]), c: num(s && s[1]) }));
      /* le conseil de la seance suivante, calcule comme dans le vrai journal */
      const cs = e.cible ? Journal.conseil({ reps: e.cible }, { e: { series } }) : null;
      return `<div class="exo ech-exo"><b>${esc(trad(e.nom))}</b>
        <ul class="ech-sets">${series.map((s, j) => `<li class="set"><span class="s-lbl">${esc(trad(L.serie, { n: j + 1 }))}</span><span class="v">${esc(trad(L.reps, { r: s.r }))}</span><span class="c">${esc(s.c > 0 ? trad(L.kg, { c: Journal.kg(s.c) }) : trad(L.pdc))}</span></li>`).join("")}</ul>
        ${cs && cs.texte ? `<p class="note" style="margin:8px 0 0"><b class="${cs.monte ? "pos" : ""}">${esc(cs.texte)}</b></p>` : ""}</div>`;
    };
    return `<section class="panel"><div class="seance-c-tete"><h2>${esc(trad(L.titre || ""))}</h2><span class="pastille ok">${esc(trad(L.notee || ""))}</span></div>
      <p class="note" style="margin:-6px 0 4px">${esc(trad(L.resume || "", { e: ex.length, s: nbS }))}</p>
      <p class="note" style="margin:0 0 14px">${esc(trad(L.intro || ""))}</p>${ex.map(bloc).join("")}</section>`;
  },
  suivi(){
    const L = this.L().suivi || {}, P = (Array.isArray(L.pesees) ? L.pesees : []).map(num).filter(v => v > 0), n = P.length;
    const signe = v => (v < 0 ? "−" : v > 0 ? "+" : "") + n1(Math.abs(v));
    const tuile = (lbl, val, unite, sous) => `<div class="tile"><div class="t-lbl">${esc(trad(lbl || ""))}</div><div class="t-val readout">${esc(val)}<small>${esc(unite)}</small></div><div class="t-sub">${esc(trad(sous || ""))}</div></div>`;
    return `<section class="panel"><div class="seance-c-tete"><h2>${esc(trad(L.titre || ""))}</h2>${n ? `<span class="pastille">${esc(trad(L.semaine || "", { n }))}</span>` : ""}</div>
      <p class="note" style="margin:-6px 0 14px">${esc(trad(L.intro || ""))}</p>
      <div class="tiles">${tuile(L.regularite, fmt(L.score), "/ 100", L.cette_semaine)}${tuile(L.seances, fmt(L.faites), "/ " + fmt(L.prevues), L.cette_semaine)}${n > 1 ? tuile(L.poids, signe(P[n - 1] - P[n - 2]), "kg", L.depuis) : ""}</div>
      ${n > 1 ? `<div class="ech-courbe"><h3>${esc(trad(L.courbe || ""))}</h3>${this.courbe(P, L)}</div>` : ""}
      <div class="fb-entree ech-message"><div class="fb-tete"><b>${esc(trad(L.message_titre || ""))}</b></div><p class="fb-texte">${esc(trad(L.message || ""))}</p></div></section>`;
  },
  /* la courbe de poids de l'exemple : un petit SVG fixe (role img, decrit en une phrase pour les lecteurs d'ecran) */
  courbe(P, L){
    const W = 320, H = 150, g = 26, d = 26, h = 24, b = 28;   // marges gauche, droite, haut, bas
    const min = Math.min(...P), max = Math.max(...P), ecart = (max - min) || 1;
    const X = i => (g + i * (W - g - d) / Math.max(1, P.length - 1)).toFixed(1);
    const Y = v => (h + (max - v) / ecart * (H - h - b)).toFixed(1);
    const alt = trad(L.courbe_alt || "", { n: P.length, a: n1(P[0]), b: n1(P[P.length - 1]) });
    const txt = (x, y, t, fort) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" font-family="IBM Plex Mono, monospace" fill="${fort ? "var(--ink)" : "var(--ink-3)"}">${esc(t)}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}" focusable="false">
      <line x1="${g - 12}" x2="${W - d + 12}" y1="${H - b + 8}" y2="${H - b + 8}" stroke="var(--axis)" stroke-width="1"/>
      <polyline points="${P.map((v, i) => X(i) + "," + Y(v)).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${P.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>${txt(X(i), (+Y(v) - 10).toFixed(1), n1(v), i === P.length - 1)}${txt(X(i), H - 4, trad(L.court || "", { n: i + 1 }))}`).join("")}
    </svg>`;
  },
  /* apres l'affichage (afficher) : la journee type lit le catalogue PUBLIC (recettes, aliments) ; les demonstrations de
     la seance s'ouvrent comme dans la Decouverte. Rien d'autre n'est lu, rien n'est ecrit. */
  brancher(zone, id){
    const bloc = zone && this.ids.indexOf(id) > -1 ? zone.querySelector("#ech-" + id) : null;
    if (!bloc) return;
    if (id === "nutrition") this.chargerJournee(bloc);
    $$("[data-yt]", bloc).forEach(bt => bt.addEventListener("click", () => {
      const v = idVideo(bt.dataset.yt); if (!v) return;
      $$(".video-cadre", bloc).forEach(cd => { if (cd._bouton && cd.parentNode) cd.parentNode.replaceChild(cd._bouton, cd); });   // une video a la fois
      const cadre = document.createElement("div"); cadre.className = "video-cadre"; cadre._bouton = bt;
      cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v}?rel=0&autoplay=1" title="${esc(trad("Démonstration de l'exercice"))}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      bt.parentNode.replaceChild(cadre, bt);
    }));
  },
  async chargerJournee(bloc){
    const boite = bloc.querySelector("#ech-repas"); if (!boite) return;
    const L = this.L().nutrition || {}, R = DECOUVERTE.recettes || {}, moments = L.moments || {};
    try {
      const [liste, idx] = await Promise.all([Catalogue.recettes(), Catalogue.indexAliments()]);
      if (!boite.isConnected) return;
      const rs = (Decouverte.cfg().recettes || []).map(id => (liste || []).find(r => r && r.id === id)).filter(Boolean);
      if (!rs.length) throw new Error("recettes introuvables");
      const mac = await Promise.all(rs.map(r => Catalogue.macros(r)));
      if (!boite.isConnected) return;
      boite.innerHTML = rs.map((r, i) => {
        const m = mac[i] || {}, info = [];
        if (r.temps_min) info.push(trad(R.minutes || "{n} min", { n: r.temps_min }));
        if (!m.manquants && m.kcal > 0) info.push(trad(L.macros || "", { k: fmt(m.kcal), p: fmt(m.proteines) }));   // macros justes seulement
        return `<details class="dc-recette ech-repas"><summary>${moments[r.moment] ? `<span class="ech-moment">${esc(trad(moments[r.moment]))}</span>` : ""}<b>${esc(trad(r.nom || ""))}</b>${info.length ? `<span class="ech-macros">${esc(info.join(" · "))}</span>` : ""}</summary>
          <h4>${esc(trad(R.ingredients || ""))}</h4><ul class="ingr fiche-l">${(r.ingredients || []).map(x => { const a = idx[x && x.aliment_id]; return `<li><span>${esc(trad(a ? a.nom : String((x && x.aliment_id) || "")))}</span><b>${esc(fmt(num(x && x.grammes)))} g</b></li>`; }).join("")}</ul>
          ${(r.etapes || []).length ? `<h4>${esc(trad(R.preparation || ""))}</h4><ol class="etapes">${r.etapes.map(e => `<li>${esc(trad(String(e)))}</li>`).join("")}</ol>` : ""}</details>`;
      }).join("");
    } catch(e){ if (boite.isConnected) boite.innerHTML = `<p class="note" style="margin:0">${esc(trad(R.indispo || ""))}</p>`; }
  }
};

/* La page d'arrivee : le coach tombe sur ses clients, le client sur son accueil. */
function outilParDefaut(){
  const v = outilsVisibles();
  if (Auth.estCoach() && !Store.idConsulte){ if (v.some(o => o.id === "tableau")) return "tableau"; if (v.some(o => o.id === "clients")) return "clients"; }
  return v[0].id;
}

/* Les onglets de la barre du bas (telephone) : quatre au plus, le reste
   derriere « Plus ». En consultation d'une fiche, ce sont ceux du client. */
function outilsPrincipaux(){
  const v = outilsVisibles();
  const coach = Auth.estCoach() && !Store.idConsulte;
  /* v40 : un prospect voit d'abord ce qui lui est ouvert (accueil, formation,
     profil), puis un onglet verrouille ; le reste derriere « Plus ».
     v52 : l'ordre est celui de CONFIG.marque.gratuit_barre (accueil, calculateur, progression, Speed Formation) */
  if (!coach && v.some(o => estVerrouille(o))){
    const barre = CONFIG.marque && CONFIG.marque.gratuit_barre;
    const choisis = Array.isArray(barre) ? barre.map(id => v.find(o => o.id === id && !o.masque_nav && !estVerrouille(o))).filter(Boolean) : [];
    if (choisis.length) return choisis.slice(0, 4);
    return v.filter(o => !o.masque_nav && !estVerrouille(o)).concat(v.filter(o => o.principal && estVerrouille(o) && !horsVitrine(o))).slice(0, 4);
  }
  return v.filter(o => coach ? o.principal_coach : o.principal).slice(0, 4);
}
function iconeOutil(o){
  return ICONES[o.id] ? `<span class="ico" aria-hidden="true">${ICONES[o.id]}</span>` : `<span class="ico" aria-hidden="true">${o.icone || ""}</span>`;
}

/* « Mon programme » devient « Son programme » quand le coach consulte
   une fiche : le meme mot pour deux personnes differentes, c'est ce qui
   fait qu'on ne sait plus chez qui on ecrit. */
function nomOnglet(o){
  /* Les outils du coach gardent leur nom : « Mes clients » ne devient
     jamais « Ses clients ». Seuls les outils qui affichent les donnees
     d'un client changent de possessif. */
  if (!Store.idConsulte || o.role === "coach") return o.nom;
  return o.nom.replace(/^Mon /, "Son ").replace(/^Mes /, "Ses ").replace(/^Ma /, "Sa ");
}

function construireNav(){
  const nav = $("nav");
  /* le coach hors fiche : ses outils d'abord, ses propres onglets client ensuite */
  const coachSeul = Auth.estCoach() && !Store.idConsulte;
  const visibles = outilsVisibles().filter(o => !o.masque_nav && !horsVitrine(o));   // v50
  const ordre = coachSeul ? visibles.filter(o => o.role === "coach").concat(visibles.filter(o => o.role !== "coach")) : visibles;
  nav.innerHTML = ordre.map(o =>
    `<a href="#/${o.id}" data-id="${o.id}">${iconeOutil(o)}${esc(nomOnglet(o))}${cadenasNav(o)}</a>`
  ).join("");
  construireBarreBas();
  if (typeof Nouveautes !== "undefined") Nouveautes.badge();   // v51 : le badge survit a la reconstruction
  if (typeof Checkin !== "undefined") Checkin.badge();         // v53 : « ton coach a répondu » (feedback du dimanche)
  $("brand-name").textContent = CONFIG.marque.nom;
  const sub = $("brand-sub");
  sub.textContent = CONFIG.marque.programme || "";
  sub.hidden = !CONFIG.marque.programme;
  const lg = $("brand-logo");
  if (CONFIG.marque.logo){
    lg.src = CONFIG.marque.logo;
    lg.alt = CONFIG.marque.nom;
    lg.style.height = (CONFIG.marque.logo_hauteur || 34) + "px";
    lg.hidden = false;
  } else lg.hidden = true;
  $("foot-left").textContent  = CONFIG.marque.programme ? `${CONFIG.marque.programme} — ${CONFIG.marque.nom}` : CONFIG.marque.nom;
  $("foot-right").innerHTML   = `Une question ? <a href="${CONFIG.marque.instagram}" target="_blank" rel="noopener">${esc(CONFIG.marque.pseudo)}</a> · ${esc(CONFIG.marque.email)}` + (CONFIG.marque.version ? ` · <span class="version">v${esc(CONFIG.marque.version)}</span>` : "");

  const p = Auth.profil, u = Auth.utilisateur();
  const nom = p && (p.prenom || p.nom) ? ((p.prenom || "") + " " + (p.nom || "")).trim() : (u ? u.email : "");
  $("qui").textContent = nom + (Auth.estCoach() ? " · coach" : "");
  $("compte").hidden = false;
  $("deco").onclick = () => Auth.deconnecter();
  const bl = $("langue");
  if (bl){
    bl.textContent = libelleLangue();
    bl.title = I18N.langue === "en" ? "Passer en français" : "Switch to English";
    bl.onclick = basculerLangue;
  }
  Theme.majBoutons();
}

/* --- barre du bas (telephone) --- */
function construireBarreBas(){
  let b = $("barre-bas");
  if (!b){ b = document.createElement("nav"); b.id = "barre-bas"; b.className = "barre-bas"; b.setAttribute("aria-label", "Navigation"); document.body.appendChild(b); }
  const principaux = outilsPrincipaux();
  const autres = outilsVisibles().filter(o => principaux.indexOf(o) === -1 && !o.masque_nav && !horsVitrine(o));   // v50
  b.innerHTML = principaux.map(o =>
    `<a href="#/${o.id}" data-id="${o.id}"${estVerrouille(o) ? ' class="verrouille"' : ""}>${iconeOutil(o)}<span class="lbl">${esc(nomCourt(o))}</span>${cadenasNav(o)}</a>`).join("") +
    (autres.length ? `<button type="button" data-plus><span class="ico" aria-hidden="true">${ICONES.plus}</span><span class="lbl">Plus</span></button>` : "");
  const plus = b.querySelector("[data-plus]");
  if (plus) plus.addEventListener("click", () => {
    UI.volet({ titre: trad("Tout mon espace"), corps: `<ul class="menu-plus">` + autres.map(o =>
      `<li><a href="#/${o.id}" data-id="${o.id}"${courant === o.id ? ' aria-current="page"' : ""}>${iconeOutil(o)}<span>${esc(nomOnglet(o))}${cadenasNav(o)}</span></a></li>`).join("") + `</ul>` });
    /* un clic sur un lien du volet le referme */
    setTimeout(() => { $$(".volet .menu-plus a").forEach(a => a.addEventListener("click", () => UI.fermer())); if (typeof Nouveautes !== "undefined") Nouveautes.badge(); }, 0);
    if (typeof Checkin !== "undefined") setTimeout(() => Checkin.badge(), 0);   // v53 : le badge sur « Mon suivi » du volet
  });
  b.hidden = !Auth.connecte();
}
/* le libelle sous l'icone, court : « Programme » plutot que « Mon programme » */
function nomCourt(o){
  if (o.court && !Store.idConsulte) return o.court;
  return nomOnglet(o).replace(/^(Mon|Mes|Ma|Son|Ses|Sa) /, "").replace(/^./, c => c.toUpperCase());
}

function marquerNav(id){
  if (id === "decouverte") id = "accueil";   // la Decouverte est l'accueil du prospect (sans onglet a elle) : « Accueil » est marque, pas « Plus »
  $$("#barre-bas a, .menu-plus a").forEach(a => { if (a.dataset.id === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const plus = document.querySelector("#barre-bas [data-plus]");
  if (plus) plus.classList.toggle("ici", !outilsPrincipaux().some(o => o.id === id) && !horsVitrine(OUTILS.find(o => o.id === id)));   // v50 : une page cachee n'est pas dans « Plus »
  $$("#nav a").forEach(a => {
    if (a.dataset.id === id){
      a.setAttribute("aria-current","page");
      /* sur telephone, l'onglet ouvert peut etre hors de l'ecran */
      try { a.scrollIntoView({ block:"nearest", inline:"nearest" }); } catch(e){}
    }
    else a.removeAttribute("aria-current");
  });
  setTimeout(majFondus, 80);
}

/* Le degrade a droite des barres d'onglets dit « il y a une suite ». On
   l'enleve quand on est au bout, ou quand tout tient a l'ecran. */
function majFondus(){
  document.querySelectorAll(".nav, .jours-onglets").forEach(el => {
    el.classList.toggle("fin", el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  });
}
document.addEventListener("scroll", e => {
  const t = e.target;
  if (t && t.classList && (t.classList.contains("nav") || t.classList.contains("jours-onglets"))) majFondus();
}, true);
document.addEventListener("click", () => setTimeout(majFondus, 80), true);
window.addEventListener("resize", () => setTimeout(majFondus, 80));

function bandeauConsultation(){
  if (!Store.idConsulte) return "";
  /* Sans ces boutons, le coach atterrit sur une page et ne devine pas que
     tout le reste de la fiche est accessible par les onglets du haut.
     Un mode implicite est un mode qu'on ne trouve pas. */
  const actions = [
    { id:"accueil",      nom:"Fiche" },
    { id:"bilan",        nom:"Préparer le call" },
    { id:"suivi",        nom:"Son suivi" },
    { id:"profil",       nom:"Son questionnaire" },
    { id:"programme",    nom:"Son programme",  fort:true },
    { id:"nutrition",    nom:"Ses repas",      fort:true },
    { id:"calculateur",  nom:"Ses calories", fort:true },
    { id:"mensurations", nom:"Ses courbes" },
    /* v53 : le journal du client (cle journal, #/journal en lecture seule), et non plus #/entrainement (sa cle perf,
       l'outil du coach : toujours vide chez un client, le coach croyait qu'il n'avait rien note) */
    { id:"journal",      nom:"Ses séances" }
  ];
  return `<div class="bandeau">
    <div class="bandeau-tete">
      <strong>${Store.nomConsulte === Clients.SANS_NOM ? "Fiche — " : "Fiche de "}${esc(Store.nomConsulte || "ce client")}</strong>
      <span class="note">Tu vois ses données. Tu écris pour lui dans les boutons dorés, dans « Préparer le call » (ton feedback) et dans la fiche (tes notes privées, qu'il ne voit jamais).</span>
    </div>
    <div class="bandeau-actions">
      ${actions.map(a => `<a href="#/${a.id}" class="b-act${a.fort ? " fort" : ""}${courant === a.id ? " ici" : ""}">${esc(a.nom)}</a>`).join("")}
      <button class="sortir" type="button" id="sortir-fiche">Revenir à mes clients</button>
    </div>
  </div>`;
}

/* v42 — filet de securite : une page qui ne peut pas s'afficher (donnee
   illisible, ecrite hors de l'application) le dit, au lieu de rester blanche
   ou figee sur « Chargement… ». Les autres pages continuent de marcher.
   L'erreur reste visible dans la console (et donc pour le banc de test). */
function messageIllisible(){
  if (Store.idConsulte) return "Cette page n'a pas pu s'afficher : une donnée de ce client est illisible (sans doute écrite hors de l'application). Les autres onglets de sa fiche restent consultables.";
  if (Auth.estCoach()) return "Cette page n'a pas pu s'afficher. Recharge la page ; si ça recommence, une donnée est illisible (les autres pages fonctionnent).";
  return trad("Cette page n'a pas pu s'afficher : une de tes données est illisible. Les autres pages fonctionnent ; préviens ton coach.");
}
function htmlSur(outil){
  try { return outil.html(); }
  catch(e){ console.error("[MHX] page illisible (" + outil.id + ")", e); return `<div class="flag grave" id="page-illisible">${esc(messageIllisible())}</div>`; }
}
function signalerIllisible(outil, e){
  console.error("[MHX] page illisible (" + outil.id + ")", e);
  const vue = $("vue"); if (!vue || $("page-illisible")) return;
  const d = document.createElement("div");
  d.className = "flag grave"; d.id = "page-illisible"; d.textContent = messageIllisible();
  const tete = vue.querySelector(".masthead");
  if (tete) tete.after(d); else vue.prepend(d);
}

async function afficher(id, silencieux){
  const jeton = ++affichage;
  const dispo = outilsVisibles();
  const outil = dispo.find(o => o.id === id) || dispo.find(o => o.id === outilParDefaut()) || dispo[0];
  courant = outil.id;
  if (nettoyage){ nettoyage(); nettoyage = null; }

  if (outil.role === "coach"){ Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; }

  /* Le bloc « Mes donnees » (export, restauration, suppression) ne vit plus
     qu'au bas du Profil : le repeter sous chaque page alourdissait tout. */
  const avecDonnees = outil.id === "profil" && !Store.idConsulte;
  const verrouille = estVerrouille(outil);   // v40 : mode gratuit
  /* v51 : page vue par un prospect (la Decouverte compte elle-meme questionnaire et resultat) */
  if (outil.id !== "accueil" && outil.id !== "decouverte") Activite.page(verrouille ? "verrou-" + outil.id : outil.id);
  $("vue").innerHTML = `
    ${bandeauConsultation()}
    ${outil.sans_entete ? "" : `<header class="masthead">
      <span class="eyebrow">${Store.idConsulte ? esc(Store.nomConsulte || "client") + " — " : (CONFIG.marque.programme ? esc(CONFIG.marque.programme) + " — " : "")}${esc(nomOnglet(outil))}</span>
      <h1>${Store.idConsulte ? esc(nomOnglet(outil)) : esc(outil.titre)}</h1>
      ${Store.idConsulte ? "" : `<p class="lede">${esc(outil.accroche)}</p>`}
    </header>`}
    ${verrouille ? pageVerrouillee(outil) : htmlSur(outil)}
    ${avecDonnees ? blocSauvegarde() : ""}
    ${bandeauInstallation()}`;

  construireNav();   // les libelles dependent du mode : on les rafraichit
  /* Les outils que le coach REMPLIT depuis la fiche d'un client. Oublier
     d'inscrire un outil ici le rend muet : la page passe en lecture seule et
     tous ses boutons deviennent inertes, sans message d'erreur. */
  /* « bilan » y figure pour ses liens et, depuis la v38, pour les feedbacks ;
     « accueil » (la fiche) pour les notes privees, qu'elle seule ecrit */
  const MODIFIABLES = ["programme", "nutrition", "calculateur", "complements", "bilan", "accueil"];
  const modifiable = !Store.idConsulte || (Auth.estCoach() && MODIFIABLES.indexOf(outil.id) > -1);
  $("vue").className = modifiable ? "wrap" : "wrap lecture-seule";

  let fin = null;
  /* v50 : un clic « Réserver mon bilan » depuis une page verrouillee compte (suivi commercial du coach) */
  if (verrouille && Auth.estProspect() && !Store.idConsulte) $$("#vue .verrou a[target=_blank]").forEach(a => a.addEventListener("click", () => { try { Decouverte.clic(Store.cache[Decouverte.cle] || Decouverte.vide(), "verrou-" + outil.id); } catch(e){} }));
  /* v52 (lot E) : l'exemple de la page verrouillee (journee type lue dans le catalogue public, demonstrations) */
  if (verrouille) Echantillons.brancher($("vue"), outil.id);
  if (!verrouille){
    try { fin = (await outil.init()) || null; }
    catch(e){
      /* une page quittee pendant son chargement ne trouve plus ses elements :
         ce n'est pas une donnee illisible, et ce n'est plus la page affichee */
      if (jeton === affichage) signalerIllisible(outil, e);
      else console.warn("[MHX] page quittée pendant son chargement (" + outil.id + ")", e);
    }
  }
  /* une autre page a ete demandee pendant le chargement : sa fonction de sortie
     est deja en place ; celle-ci est perimee (on l'execute tout de suite) */
  if (jeton !== affichage){ if (typeof fin === "function") fin(); return; }
  nettoyage = fin;
  if (avecDonnees){ initSauvegarde(); }
  const sortir = $("sortir-fiche");
  if (sortir) sortir.addEventListener("click", () => {
    Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; location.hash = "#/clients";
  });

  brancherInstallation();

  marquerNav(outil.id);
  if (!silencieux) window.scrollTo(0, 0);
}

