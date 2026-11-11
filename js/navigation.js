/* ==================================================================
   [G] NAVIGATION, CONNEXION ET DEMARRAGE
   Chaque outil a sa propre adresse : #/calculateur, #/mensurations,
   #/entrainement. Le coach voit en plus #/clients.
   ================================================================== */
let courant = OUTILS[0].id;
let sousRoute = "";   // ce qui suit l'identifiant dans l'adresse (#/decouverte/reponses -> "reponses")
let nettoyage = null;
let affichage = 0;   // numero du dernier affichage demande

/* v101 (chantier 6 de la nuit du 10/11) : le code de l'espace du coach (MHX_COACH, index.html) n'est chargé que pour le coach :
   à sa connexion, avant le premier affichage, les fichiers absents sont ajoutés dans l'ordre de MHX_JS, puis OUTILS est refait ;
   la marque « mhx_coach_fichiers » les fait charger d'emblée aux ouvertures suivantes (comme avant la v101). Un fichier qui ne
   vient pas (hors ligne) : son outil manque au menu, le reste de l'espace s'ouvre. */
const CodeCoach = {
  CLE: "mhx_coach_fichiers",
  absents(){
    const l = typeof MHX_COACH !== "undefined" && Array.isArray(MHX_COACH) ? MHX_COACH : [];
    return l.filter(f => !Array.from(document.scripts).some(s => (s.getAttribute("src") || "").split("?")[0] === f));
  },
  async assurer(){
    try { localStorage.setItem(this.CLE, "1"); } catch(e){}
    const l = this.absents();
    let manque = 0;
    /* v104 (point 12) : les fichiers sont demandés TOUS ENSEMBLE (téléchargés en parallèle) ; async = false garde l'ordre
       d'exécution de MHX_COACH. Avant, l'un après l'autre : sur un appareil neuf en 4G lente, 7 fichiers coûtaient environ 0,5 s de
       plus. Délai de garde : 10 s, plus 2 s par fichier qui le précède (il attend leur exécution). */
    await Promise.all(l.map((f, i) => new Promise(fini => {
      const s = document.createElement("script");
      const fin = ok => { clearTimeout(m); if (!ok) manque++; fini(); };
      const m = setTimeout(() => fin(false), 10000 + 2000 * i);   // v102 : le démarrage ne reste jamais bloqué
      s.src = f + "?v=" + (typeof MHX_FICHIERS !== "undefined" ? MHX_FICHIERS : "");
      s.async = false; s.onload = () => fin(true); s.onerror = () => fin(false);
      document.body.appendChild(s);
    })));
    if (l.length) OUTILS.splice(0, OUTILS.length, ...listeOutils());
    if (manque) setTimeout(() => { try { UI.toast("Une partie de ton espace n'a pas pu se charger (connexion) : recharge la page.", "attention", 9000); } catch(e){} }, 800);
  }
};

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
                         && (!o.coach_perso || !Store.idConsulte)   // v71 (I) : l'Entrainement du coach n'apparait pas dans une fiche
                         && (!o.prospect_seul || Auth.estProspect())
                         /* v79 — interrupteur de nouveaute (CONFIG.nouveautes) : pour soi, Interrupteurs.visible ; dans une fiche,
                            celui du compte consulte (en « test », le coach ne le voit que chez un compte de test) */
                         && (!o.interrupteur || (Store.idConsulte ? Interrupteurs.pourCompte(o.interrupteur, Store.idConsulte) : Interrupteurs.visible(o.interrupteur))));
}

/* v40 — MODE GRATUIT. Un prospect (Auth.estProspect) n'a d'ouverts que les
   onglets de CONFIG.marque.gratuit_ouverts ; tous les autres affichent un
   cadenas, ce que l'accompagnement apporte et « Réserver mon bilan ». Liste
   blanche : un onglet ajoute plus tard est verrouille par defaut. Le coach
   qui consulte une fiche voit tout. */
function estVerrouille(o){
  if (!o || o.role === "coach" || Store.idConsulte || !Auth.estProspect()) return false;
  const ouverts = (CONFIG.marque && CONFIG.marque.gratuit_ouverts) || ["accueil", "decouverte", "profil"];
  /* v52 : gratuit pour toujours — plus de verrou de la Formation au 8e jour (elle est dans gratuit_ouverts) */
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
/* v61 (brief V2, E2) : ce que l'accompagnement ajoute — accueil du prospect (carte) et pages verrouillées (note) ; jamais
   un ecran client */
const AVANTAGES = {
  programme: "Tes séances construites pour toi et ajustées par ton coach selon tes progrès.",
  nutrition: "Tes repas calculés pour ton objectif, avec ta liste de courses.",
  mensurations: "Ton poids, tes mensurations et ta composition corporelle, semaine après semaine.",
  suivi: "Ta régularité, ta courbe et le retour de ton coach chaque semaine.",
  bilan: "Ton bilan du mois, préparé avec ton coach.",
  complements: "Tes compléments conseillés, avec les doses et les moments.",
  journal: "Chaque séance notée, et la charge à viser la fois suivante."   // v52 ; v61 (brief V2, E2)
};
function pageVerrouillee(o){
  /* v52 : plus de page spéciale pour la Formation (ouverte pour toujours) */
  const plus = AVANTAGES[o.id];
  /* v52 (lot E) : pour un prospect, d'abord un exemple generique de la page (Echantillons : marque « Exemple », aucune de
     ses donnees), puis « Tu veux un programme construit pour toi… » et « Réserver mon bilan » — toujours un lien
     .verrou a[target=_blank] : afficher() compte le clic (source verrou-<id>). Les autres pages verrouillees : inchangees. */
  /* v61 (brief V2, G et F) : un texte par page (DECOUVERTE.echantillons.appels), « Récupérer mon plan d'action », la ligne
     « 15 min avec Lucas · offert », et l'origine verrou_<id> (lien Calendly et clic compte par afficher) */
  /* v85 (bloc 4) : l'onglet Programme du prospect montre son programme de la formation (ProgFormation, à la place de l'exemple
     « Ta séance découverte ») ; dessous, la carte 🔒 d'avant (programme sur mesure avec son coach, Calendly verrou_programme)
     reste, sur la page du programme (pas sur l'écran d'une séance ni sur « Changer de programme ») */
  const pf = o.id === "programme" && Auth.estProspect() && !Store.idConsulte;
  const ech = pf ? ProgFormation.zoneHTML() : Echantillons.html(o.id), cta = DECOUVERTE.cta || {}, appels = DECOUVERTE.echantillons.appels || {};
  if (pf && sousRoute) return ech;
  /* v71 (H) : creneau coche (cle challenge deja en cache, cf. :404 plus bas ; ou la case cochee sur cet appareil,
     Invitations.lire) : le texte d'appel sans bouton, puis la pastille « Bilan réservé le … » ; aucune lecture de plus */
  let r = null; try { r = Decouverte.reserve(Store.cache[Decouverte.cle]) || Invitations.lire().reserve || null; } catch(e){ r = null; }
  const bouton = r ? {} : { lien: lienCalendly(Decouverte.codeVerrou(o.id)), cta: trad(cta.bouton), sous: typoFr(trad(cta.sous)) };
  const pastille = r ? `<p class="verrou-reserve"><span class="pastille ok">${esc(trad(DECOUVERTE.accomp.reserve_ok, { d: dateFr(Decouverte.dateLocale(r) || "") }))}</span></p>` : "";
  const wa = boutonWhatsApp("verrou-wa");   // v72 (D) : sous le cadre de réservation, hors de .verrou (pas un clic Calendly)
  /* v85 : sous le programme de la formation, la carte 🔒 dit « Après ton bilan : ton programme sur mesure, avec ton coach. » (le
     texte de « Ton espace » du parcours, PARCOURS_T.espace : l'appel d'avant parlait de la séance découverte, qui n'est plus là) */
  const texteVerrou = pf ? trad(PARCOURS_T.espace.bilan) + trad(PARCOURS_T.espace.bilan_suite) : trad(appels[o.id] || "");
  if (ech) return `${ech}<section class="panel ech-appel">${UI.verrou(Object.assign({ titre: trad(nomOnglet(o)), texte: typoFr(texteVerrou) }, bouton))}${pastille}${wa}
    ${plus ? `<p class="note verrou-plus">${esc(typoFr(trad(plus)))}</p>` : ""}</section>`;
  return `<section class="panel">${UI.verrou(Object.assign({ titre: trad(nomOnglet(o)), texte: trad("Cette fonctionnalité est disponible avec l'accompagnement MHX.") }, bouton))}${pastille}${wa}
    ${plus ? `<p class="note verrou-plus">${esc(typoFr(trad(plus)))}</p>` : ""}</section>`;
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
    const txt = (x, y, t, fort) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" font-family="IBM Plex Sans, sans-serif" fill="${fort ? "var(--ink)" : "var(--ink-3)"}">${esc(t)}</text>`;
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
  /* v104 (point 2) : dans la fiche d'un client aussi, la barre du bas reste celle du coach (Tableau · Clients · Prospects ·
     Programmes · Plus) : on navigue dans la fiche par ses 5 onglets */
  const coach = Auth.estCoach();
  /* v40 : un prospect voit d'abord ce qui lui est ouvert (accueil, formation,
     profil), puis un onglet verrouille ; le reste derriere « Plus ».
     v52 : l'ordre est celui de CONFIG.marque.gratuit_barre (accueil, calculateur, progression, Formation) */
  if (!coach && v.some(o => estVerrouille(o))){
    const barre = CONFIG.marque && CONFIG.marque.gratuit_barre;
    const choisis = Array.isArray(barre) ? barre.map(id => v.find(o => o.id === id && !o.masque_nav && !estVerrouille(o))).filter(Boolean) : [];
    if (choisis.length) return choisis.slice(0, 4);
    return v.filter(o => !o.masque_nav && !estVerrouille(o)).concat(v.filter(o => o.principal && estVerrouille(o) && !horsVitrine(o))).slice(0, 4);
  }
  /* v106 (lot 1) : le coach, ses 4 entrées dans l'ordre du menu (Aujourd'hui, Clients, Prospects, Bibliothèque), aussi dans une fiche */
  return coach ? menuCoach(v) : v.filter(o => o.principal).slice(0, 4);
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
  const visibles = outilsVisibles().filter(o => !o.masque_nav && !horsVitrine(o) && !cachePourClient(o));   // v50 ; v100 : le menu du client
  /* v98 : les 7 entrées du coach (MENU_COACH) ; les autres pages du coach gardent leur adresse.
     v104 (point 1) : dans la fiche d'un client, le menu du haut reste ces 7 entrées, sans les outils du client (une seule
     navigation dans la fiche : ses 5 onglets ; chaque adresse #/client/<id>/<outil> s'ouvre toujours) */
  const fiche = Auth.estCoach() && !!Store.idConsulte;
  const ordre = coachSeul ? menuCoach(visibles) : fiche ? menuCoach(visiblesHorsFiche().filter(o => !o.masque_nav)) : visibles;
  /* v106 (lot 1) : avec la nouvelle navigation, le nom dans un <span class="lbl"> (caché sur la barre latérale réduite aux
     icônes, où la bulle le dit) */
  nav.innerHTML = ordre.map(o => { const n = coachSeul || fiche ? nomMenuCoach(o) : nomOnglet(o), q = fiche && o.role !== "coach" ? " data-quitter-fiche" : "";
    return Nav106.actif() ? `<a href="${esc(lienMenu(o))}" data-id="${esc(o.id)}"${q} title="${esc(trad(n))}">${iconeOutil(o)}<span class="lbl">${esc(n)}</span>${cadenasNav(o)}</a>`
      : `<a href="${esc(lienMenu(o))}" data-id="${esc(o.id)}"${q}>${iconeOutil(o)}${esc(n)}${cadenasNav(o)}</a>`; }
  ).join("");
  Nav106.majTete();
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
  /* v86 (lot 1, défense en profondeur) : le lien Instagram passe par lienSur() et esc(), comme les autres liens de la marque */
  $("foot-right").innerHTML   = `Une question ? <a href="${esc(lienSur(CONFIG.marque.instagram))}" target="_blank" rel="noopener">${esc(CONFIG.marque.pseudo)}</a> · ${esc(CONFIG.marque.email)}` + (CONFIG.marque.version ? ` · <span class="version">v${esc(CONFIG.marque.version)}</span>` : "");

  const p = Auth.profil, u = Auth.utilisateur();
  const nom = p && (p.prenom || p.nom) ? ((p.prenom || "") + " " + (p.nom || "")).trim() : (u ? u.email : "");
  $("qui").textContent = nom + (Auth.estCoach() ? " · coach" : "");
  $("compte").hidden = false;
  $("deco").onclick = () => Auth.deconnecter();
  /* v76 : sur téléphone, le prospect se déconnecte depuis « Tout mon espace » (volet « Plus ») : sa barre du haut tient sur une
     ligne. Sur un grand écran (pas de barre du bas, donc pas de volet), le bouton reste en haut. */
  $("deco").classList.toggle("deco-volet", Auth.estProspect() && !!document.querySelector("#barre-bas [data-plus]"));
  const bl = $("langue");
  if (bl){
    bl.textContent = libelleLangue();
    bl.title = ariaLangue(); bl.setAttribute("aria-label", ariaLangue());
    bl.onclick = basculerLangue;
  }
  Theme.majBoutons();
  brancherLogo();
}
/* v80 (bloc 1) : le logo ramène à la page d'arrivée — le Tableau de bord du coach (même depuis la fiche d'un client : une
   page du coach referme la fiche), l'Accueil d'un client ou d'un prospect. Déjà sur cette page : elle est redessinée. */
function brancherLogo(){
  const a = $("brand"); if (!a) return;
  const cible = Auth.estCoach() && outilsVisibles().some(o => o.id === "tableau") ? "tableau" : "accueil";
  a.href = lienOutil(cible);
  a.setAttribute("aria-label", trad(cible === "tableau" ? "Aujourd'hui" : "Accueil"));   // v106 : le nom de l'entrée du menu
  a.onclick = e => { if (location.hash === lienOutil(cible)){ e.preventDefault(); afficher(cible); } };
}

/* v100 : un client accompagné (pas un prospect, pas le coach, pas une fiche) */
function clientAccompagne(){ return Auth.connecte() && !!Auth.profil && !Auth.estCoach() && !Auth.estProspect() && !Store.idConsulte; }
/* v100 : a-t-il une diète ? (lue une fois par visite, une seule ligne ; inconnu ou lecture ratée : le calculateur reste) */
const DieteClient = {
  etat: {},
  connue(){ const u = Auth.utilisateur(); return u ? this.etat[u.id] : undefined; },
  async verifier(){
    const u = Auth.utilisateur(); if (!u || !clientAccompagne() || u.id in this.etat) return;
    this.etat[u.id] = null;   // en cours
    try {
      const r = await Store.lireTout(["repas"]);
      if (r.erreur){ delete this.etat[u.id]; return; }
      const R = r.repas || {};
      this.etat[u.id] = (R.jours || []).some(j => j && (j.repas || []).length) || (Array.isArray(R.repas) && R.repas.length > 0);
    } catch(e){ delete this.etat[u.id]; return; }
    if (this.etat[u.id] && clientAccompagne()){ construireNav(); marquerNav(courant); }
  }
};
function cachePourClient(o){
  if (!o || !clientAccompagne()) return false;
  return CACHES_CLIENT.indexOf(o.id) > -1 || (CACHES_AVEC_DIETE.indexOf(o.id) > -1 && DieteClient.connue() === true);
}

/* v104 (points 1 et 2) : les pages du coach telles qu'il les voit hors fiche (ses Réglages et son entraînement compris : dans une
   fiche, outilsVisibles donne les outils du client consulté) */
function visiblesHorsFiche(){ const id = Store.idConsulte; Store.idConsulte = null; try { return outilsVisibles(); } finally { Store.idConsulte = id; } }
/* l'adresse d'une entrée du menu du coach : dans une fiche, « Réglages » et « Mon entraînement » (pas des outils « coach » :
   #/client/<id>/profil serait le questionnaire du client) referment d'abord la fiche (data-quitter-fiche, plus bas) */
function lienMenu(o){ return Auth.estCoach() && Store.idConsulte && o.role !== "coach" && (MENU_COACH.indexOf(o.id) > -1 || MENU_PROFIL_COACH.indexOf(o.id) > -1) ? "#/" + o.id : lienOutil(o.id); }   // v106 : aussi les pages du rond de profil
document.addEventListener("click", e => {
  const a = e.target && e.target.closest ? e.target.closest("a[data-quitter-fiche]") : null;
  if (!a || !Store.idConsulte) return;
  e.preventDefault();
  Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; Store.retourVers = null;
  if (location.hash === a.getAttribute("href")) afficher(a.dataset.id); else location.hash = a.getAttribute("href");
}, true);
/* v98 : le menu du coach hors fiche (MENU_COACH, liste-outils.js), dans cet ordre ; ses autres pages gardent leur adresse */
function menuCoach(visibles){ return MENU_COACH.map(id => visibles.find(o => o.id === id)).filter(Boolean); }
function nomMenuCoach(o){ return NOMS_MENU_COACH[o.id] || o.nom; }

/* v106 (lot 1, refonte de l'ergonomie) — NAVIGATION À 4 ENTRÉES. La classe « nav106 » sur <body> porte la nouvelle mise en
   page (css/communs.css, fin) : jusqu'à 1 023 px, une ligne fine en haut (titre de la page, loupe, rond de profil) et la barre
   du bas à 4 cases égales, sans « Plus » ; à partir de 1 024 px, la barre latérale (logo, recherche, les 4 entrées, le rond en
   bas ; réduite aux icônes sous 1 280 px). Lot 1 : le coach ; « FR » et « Se déconnecter » passent derrière le rond. */
const Nav106 = {
  actif(){ return typeof Auth !== "undefined" && Auth.connecte() && Auth.estCoach(); },
  nom(){ const p = Auth.profil, u = Auth.utilisateur(); return p && (p.prenom || p.nom) ? ((p.prenom || "") + " " + (p.nom || "")).trim() : (u ? u.email || "" : ""); },
  initiales(){ const n = this.nom(); if (!n || /@/.test(n)) return "?"; return n.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("") || "?"; },
  majTete(){
    const actif = this.actif();
    document.body.classList.toggle("nav106", actif);
    document.body.classList.toggle("nav106-coach", actif && Auth.estCoach());
    const r = $("rond-profil"), c = $("nav-chercher"), t = $("titre-page");
    if (t) t.hidden = !actif;
    if (r){
      r.hidden = !actif;
      if (actif){
        const lib = trad("Mon profil et mes réglages");
        r.innerHTML = `<span class="avatar" aria-hidden="true" data-notr>${esc(this.initiales())}</span><span class="lbl" data-notr>${esc(this.nom())}</span>`;
        r.setAttribute("aria-label", lib); r.title = lib; r.setAttribute("aria-haspopup", "dialog");
        r.onclick = () => MenuProfil.ouvrir();
      }
    }
    if (c){
      c.hidden = !(actif && Auth.estCoach());
      if (!c.hidden){
        const lib = trad("Rechercher un client par son nom");
        c.querySelector(".ico").innerHTML = SVG.loupe; c.setAttribute("aria-label", lib); c.title = lib;
        c.onclick = () => this.chercher();
      }
    }
  },
  /* la loupe : la liste des clients, curseur dans sa recherche (comme la loupe du tableau de bord) ; d'une fiche, la referme */
  chercher(){
    try { ListeCoach.etat("clients").focus = true; } catch(e){}
    if (Store.idConsulte){ Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; Store.retourVers = null; }
    if (location.hash === "#/clients") afficher("clients"); else location.hash = "#/clients";
  },
  /* le titre de la ligne du haut : le nom du lien qui y mène (menu du coach), le nom de la fiche ouverte, sinon le titre de la page */
  titre(outil){
    const t = $("titre-page"); if (!t || !outil) return;
    let x = "";
    if (Store.idConsulte) x = Store.nomConsulte || trad("Fiche");
    else if (Auth.estCoach() && MENU_COACH.indexOf(outil.id) > -1) x = trad(nomMenuCoach(outil));
    else if (Auth.estCoach() && PARENTS_MENU_COACH[outil.id] === "mes-programmes") x = trad(NOMS_MENU_COACH["mes-programmes"]);
    else if (Auth.estCoach() && MENU_PROFIL_COACH.indexOf(outil.id) > -1 && NOMS_MENU_COACH[outil.id]) x = trad(NOMS_MENU_COACH[outil.id]);   // le nom de son lien (Réglages, Mon entraînement)
    else x = trad(outil.titre || nomOnglet(outil));
    t.toggleAttribute("data-notr", !!Store.idConsulte);   // un nom n'est jamais traduit
    t.textContent = x;
  }
};
/* v106 (lot 1) : le volet du rond de profil — Réglages (qui s'ouvre sur « Mon compte »), Mon entraînement, Langue, Partager
   l'app, Se déconnecter (avec confirmation, UI.confirmer). Dans une fiche, Réglages et Mon entraînement la referment d'abord. */
const ICO_LANGUE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
const ICO_SORTIE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/></svg>';
const MenuProfil = {
  pages(){
    const fiche = Auth.estCoach() && !!Store.idConsulte, v = fiche ? visiblesHorsFiche() : outilsVisibles();
    return (Auth.estCoach() ? MENU_PROFIL_COACH : []).map(id => v.find(o => o.id === id)).filter(Boolean);
  },
  ouvrir(){
    const fiche = Auth.estCoach() && !!Store.idConsulte;
    const lignes = this.pages().map(o => `<li><a href="${esc(lienMenu(o))}" data-id="${esc(o.id)}"${fiche && o.role !== "coach" ? " data-quitter-fiche" : ""}${courant === o.id && !fiche ? ' aria-current="page"' : ""}>${iconeOutil(o)}<span>${esc(Auth.estCoach() ? nomMenuCoach(o) : nomOnglet(o))}</span></a></li>`).join("");
    const corps = `<p class="mp-qui"><span class="avatar" aria-hidden="true" data-notr>${esc(Nav106.initiales())}</span><span class="mp-qui-t"><b data-notr>${esc(Nav106.nom())}</b>${Auth.estCoach() ? `<small>${esc(trad("Coach"))}</small>` : ""}</span></p>
      <ul class="menu-plus" id="menu-profil">${lignes}
        <li><button type="button" data-mp-langue><span class="ico" aria-hidden="true">${ICO_LANGUE}</span><span>${esc(trad("Langue"))}</span><span class="mp-val" data-notr>${esc(libelleLangue())}</span></button></li>
        <li><button type="button" data-mp-partager><span class="ico" aria-hidden="true">${SVG.partager}</span><span>${esc(trad("Partager l'app"))}</span></button></li>
        <li><button type="button" data-mp-deco><span class="ico" aria-hidden="true">${ICO_SORTIE}</span><span>${esc(trad("Se déconnecter"))}</span></button></li>
      </ul>`;
    UI.volet({ titre: trad("Mon profil"), corps, classe: "volet-profil" });
    setTimeout(() => {
      const z = document.querySelector(".volet-profil"); if (!z) return;
      $$("#menu-profil a", z).forEach(a => a.addEventListener("click", () => UI.fermer()));
      const l = z.querySelector("[data-mp-langue]"); if (l) l.addEventListener("click", () => { UI.fermer(); basculerLangue(); });
      const p = z.querySelector("[data-mp-partager]"); if (p) p.addEventListener("click", () => partagerApp());
      const d = z.querySelector("[data-mp-deco]"); if (d) d.addEventListener("click", async () => {
        UI.fermer();
        if (await UI.confirmer(trad("Te déconnecter de ton espace ?"), { ok: trad("Se déconnecter") })) Auth.deconnecter();
      });
    }, 0);
  }
};

/* --- barre du bas (telephone) --- */
function construireBarreBas(){
  let b = $("barre-bas");
  if (!b){ b = document.createElement("nav"); b.id = "barre-bas"; b.className = "barre-bas"; b.setAttribute("aria-label", "Navigation"); document.body.appendChild(b); }
  const principaux = outilsPrincipaux();
  const coachSeul = Auth.estCoach() && !Store.idConsulte;
  const visiblesNav = outilsVisibles().filter(o => !o.masque_nav && !horsVitrine(o) && !cachePourClient(o));   // v50 ; v100 : le menu du client
  const enFiche = Auth.estCoach() && !!Store.idConsulte;
  const autres = (coachSeul ? menuCoach(visiblesNav) : enFiche ? menuCoach(visiblesHorsFiche().filter(o => !o.masque_nav)) : visiblesNav).filter(o => principaux.indexOf(o) === -1);   // v98 : le coach, ses 7 entrées ; v104 (point 2) : dans une fiche aussi, sans les outils du client
  b.innerHTML = principaux.map(o =>
    `<a href="${esc(Auth.estCoach() ? lienMenu(o) : lienOutil(o.id))}" data-id="${esc(o.id)}"${enFiche && o.role !== "coach" ? " data-quitter-fiche" : ""}${estVerrouille(o) ? ' class="verrouille"' : ""}>${iconeOutil(o)}<span class="lbl">${esc(Auth.estCoach() ? nomMenuCoach(o) : nomCourt(o))}</span>${cadenasNav(o)}</a>`).join("") +
    (autres.length ? `<button type="button" data-plus><span class="ico" aria-hidden="true">${ICONES.plus}</span><span class="lbl">Plus</span></button>` : "");
  const plus = b.querySelector("[data-plus]");
  /* v69 : le prospect revient a l'accueil par une fleche a gauche du titre (la croix seule ne suffisait pas sur telephone) ;
     v70 : le client aussi (tout compte qui n'est pas le coach, hors consultation d'une fiche) */
  const retourAccueil = !Auth.estCoach() && !Store.idConsulte && principaux.some(o => o.id === "accueil")
    ? { href: "#/accueil", libelle: trad("Retour à l'accueil") } : null;
  if (plus) plus.addEventListener("click", () => {
    UI.volet({ titre: trad("Tout mon espace"), retour: retourAccueil, corps: `<ul class="menu-plus">` + autres.map(o =>
      `<li><a href="${esc(lienMenu(o))}" data-id="${esc(o.id)}"${enFiche && o.role !== "coach" ? " data-quitter-fiche" : ""}${courant === o.id && !enFiche ? ' aria-current="page"' : ""}>${iconeOutil(o)}<span>${esc(coachSeul || enFiche ? nomMenuCoach(o) : nomOnglet(o))}${cadenasNav(o)}</span></a></li>`).join("") + `</ul>` +
      /* v70 : « Partager l'app » sous la liste (lien copie ou feuille de partage du telephone) */
      `<div class="menu-plus-partage"><button type="button" class="btn ghost petit" data-partager>${SVG.partager}<span>${esc(trad("Partager l'app"))}</span></button></div>` +
      /* v76 : « Se déconnecter » du prospect, en bas du volet (il n'est plus dans sa barre du haut sur téléphone) */
      (Auth.estProspect() ? `<div class="menu-plus-partage"><button type="button" class="btn ghost petit" data-deconnecter>${esc(trad("Se déconnecter"))}</button></div>` : "") });
    /* un clic sur un lien du volet le referme */
    setTimeout(() => { $$(".volet .menu-plus a").forEach(a => a.addEventListener("click", () => UI.fermer())); if (typeof Nouveautes !== "undefined") Nouveautes.badge();
      const bp = document.querySelector(".volet [data-partager]"); if (bp) bp.addEventListener("click", () => partagerApp());
      const bd = document.querySelector(".volet [data-deconnecter]"); if (bd) bd.addEventListener("click", () => { UI.fermer(); Auth.deconnecter(); }); }, 0);
    if (typeof Checkin !== "undefined") setTimeout(() => Checkin.badge(), 0);   // v53 : le badge sur « Mon suivi » du volet
  });
  b.hidden = !Auth.connecte();
}
/* le libelle sous l'icone, court : « Programme » plutot que « Mon programme » */
function nomCourt(o){
  if (o.court && (!Store.idConsulte || o.role === "coach")) return o.court;   // v104 (point 2) : la barre du coach, aussi dans une fiche
  return nomOnglet(o).replace(/^(Mon|Mes|Ma|Son|Ses|Sa) /, "").replace(/^./, c => c.toUpperCase());
}

function marquerNav(id){
  if (id === "decouverte") id = "accueil";   // la Decouverte est l'accueil du prospect (sans onglet a elle) : « Accueil » est marque, pas « Plus »
  /* v98 (relecture) : le coach hors fiche, sur une page sortie du menu : son entrée « parente » est marquée (jamais « Plus » vide) */
  if (Auth.estCoach() && !Store.idConsulte && PARENTS_MENU_COACH[id]) id = PARENTS_MENU_COACH[id];
  /* v104 (points 1 et 2) : dans la fiche d'un client, l'entrée marquée est celle d'où l'on vient (Tableau, Clients, Prospects ;
     une page du menu Plus marque sa parente) */
  if (Auth.estCoach() && Store.idConsulte){ const v = Store.retourVers || "clients"; id = PARENTS_MENU_COACH[v] || v; }
  if (PARENTS_CLIENT[id] && cachePourClient(OUTILS.find(o => o.id === id))) id = PARENTS_CLIENT[id];   // v100 : sa page « parente »
  $$("#barre-bas a, .menu-plus a").forEach(a => { if (a.dataset.id === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const plus = document.querySelector("#barre-bas [data-plus]");
  /* v98 (relecture) : « Plus » marqué seulement si la page est vraiment dans son volet (le coach : ses 7 entrées) */
  const dansPlus = Auth.estCoach() ? MENU_COACH.indexOf(id) > -1 : true;   // v104 (point 2) : aussi dans une fiche
  if (plus) plus.classList.toggle("ici", dansPlus && !outilsPrincipaux().some(o => o.id === id) && !horsVitrine(OUTILS.find(o => o.id === id)));   // v50 : une page cachee n'est pas dans « Plus »
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

/* v71 (I) : l'adresse d'un outil ; en consultation, la canonique #/client/<uuid>/<outil> (les outils du coach gardent #/<id>) :
   un rechargement rouvre la meme fiche (routeDepuisAdresse relit le profil). Les adresses nues (#/programme) restent acceptees
   a l'interieur d'une consultation ouverte. */
function lienOutil(id){
  const o = OUTILS.find(x => x.id === id);
  return Store.idConsulte && o && o.role !== "coach" ? "#/client/" + Store.idConsulte + "/" + id : "#/" + id;
}
/* v106 (lot 1 et 2) : le retour de la fiche (flèche de son en-tête) porte le nom de la page où il ramène */
const RETOURS = { tableau: "Revenir à Aujourd'hui", clients: "Revenir à mes clients", prospects: "Revenir aux prospects",
  /* v84 : les pages du menu Plus qui ont reçu l'écran d'avant de Clients et de Prospects */
  "suivi-clients": "Revenir à la vue tableau", comptes: "Revenir aux comptes", "suivi-commercial": "Revenir à la vue détaillée", newsletter: "Revenir à la newsletter" };
/* v99 (chantier 4 de la nuit du 10/11, plan-fiche-client) : la fiche d'un client en ONGLETS, un seul en-tête. Chaque onglet
   réunit les pages EXISTANTES (rien n'est réécrit, chaque page garde son adresse #/client/<id>/<outil> et ses garde-fous :
   lecture seule, « Pas de connexion », compte figé pendant une écriture). L'onglet affiché suit la page ouverte : une
   ancienne adresse ouvre le bon onglet.
   v106 (lot 2, refonte de l'ergonomie) : 4 onglets — Aperçu, Programme (l'ancien « Entraînement »), Nutrition, Suivi ; l'ancien
   onglet Profil est rangé : « Son questionnaire » sous Aperçu, « Son compte » (#/client/<id>/accueil/compte) dans le menu « ⋯ »
   de l'en-tête (la page ne s'affiche dans la rangée des pages que quand elle est ouverte : 4e valeur). */
const ONGLETS_FICHE = [
  { id: "apercu", nom: "Aperçu", pages: [["accueil", "Aperçu"], ["profil", "Son questionnaire"], ["accueil/compte", "Son compte", false, true]] },
  { id: "programme", nom: "Programme", pages: [["programme", "Son programme", true], ["journal", "Ses séances"]] },
  { id: "nutrition", nom: "Nutrition", pages: [["nutrition", "Ses repas", true], ["calculateur", "Ses calories", true], ["complements", "Ses compléments"], ["journal-alimentaire", "Son journal alimentaire"]] },
  /* v106 (lot 3) : « Son suivi » et « Préparer le call » ne font plus qu'une vue, « Bilans » (outilBilan) ; #/client/<id>/suivi y mène */
  { id: "suivi", nom: "Suivi", pages: [["bilan", "Bilans"], ["mensurations", "Courbes"], ["formation", "Formation"]] }
];
/* les pages d'un onglet qui existent pour ce client (journal alimentaire : interrupteur) */
function pagesOnglet(g){ const v = outilsVisibles(); return g.pages.filter(p => v.some(o => o.id === p[0].split("/")[0])); }
/* l'onglet de la page ouverte (courant, sousRoute) */
function ongletFiche(id, sous){
  if (id === "accueil") return "apercu";
  if (id === "suivi") return "suivi";   // v106 (lot 3) : l'ancienne page « Son suivi » (son adresse mène à « Bilans »)
  const g = ONGLETS_FICHE.find(x => x.pages.some(p => p[0] === id));
  return g ? g.id : "apercu";
}
function lienPageFiche(p){ const [id, s] = p.split("/"); return lienOutil(id) + (s ? "/" + s : ""); }
/* la page de la fiche ouverte (« Son compte » : …/accueil/compte ; « Aperçu » : …/accueil) */
function pageFicheActive(p){ return p[0] === "accueil/compte" ? courant === "accueil" && sousRoute === "compte" : p[0] === courant && !(courant === "accueil" && sousRoute === "compte"); }
/* v106 (lot 2) : le nom de la page ouverte (le même que son lien : titre pour les lecteurs d'écran) */
function nomPageFiche(){
  for (const g of ONGLETS_FICHE) for (const p of g.pages) if (pageFicheActive(p)) return p[1];
  const o = OUTILS.find(x => x.id === courant); return o ? nomOnglet(o) : "Fiche";
}
/* v106 (lot 2) — L'EN-TÊTE DE LA FICHE, sur une ligne et toujours visible (collé en haut au défilement) : retour, prénom, statut,
   « vu il y a X » (orange quand le client n'a rien saisi depuis 10 jours, la règle « inactif » de Clients.alertes), WhatsApp
   (toujours le message prêt), Appeler, Notes (volet), « ⋯ » (Son compte, passer client / prospect, accès complet, archiver,
   supprimer : les actions de l'ancien onglet Compte, mêmes fonctions, mêmes fenêtres de confirmation). Dessous : les 4 onglets,
   puis la rangée fine des pages de l'onglet. Ce qui dépend du compte (statut, numéro, connexion, dernière saisie, archivage)
   est lu une fois par fiche, après l'affichage (EnteteFiche.remplir) : la page n'attend pas. */
const EnteteFiche = {
  infos: {},
  /* ce qui n'est pas une saisie du client (même liste que Clients.charger : ce que le coach écrit, et ce qui n'est pas une saisie) */
  PAS_SAISIE: ["programme", "repas", "calc", "complements", "feedbacks", "notes_coach", "suivi_prospect", "emails", "coach_notifs", "contact", "coach_visite", "activite", "hist_programme", "hist_repas", "brouillons_programme", "brouillons_repas", "atelier"],
  oublier(uid){ if (uid){ delete this.infos[uid]; delete this.encours[uid]; } },
  prenom(nom){ const n = String(nom || "").trim(); return n === Clients.SANS_NOM ? n : (n.split(/\s+/)[0] || n); },
  html(){
    const uid = Store.idConsulte, nom = Store.nomConsulte || trad("ce client"), ret = trad(RETOURS[Store.retourVers] || RETOURS.clients);
    const ici = ongletFiche(courant, sousRoute), g = ONGLETS_FICHE.find(x => x.id === ici), pages = pagesOnglet(g).filter(p => !p[3] || pageFicheActive(p));
    const i = this.infos[uid];
    return `<div class="bandeau fiche-entete" id="fiche-entete">
      <div class="fe-ligne">
        <button class="rond fe-retour" type="button" id="sortir-fiche" aria-label="${esc(ret)}" title="${esc(ret)}">${SVG.retour}<span class="sr-only">${esc(ret)}</span></button>
        <div class="fe-qui"><strong class="fe-nom" data-notr title="${esc(nom)}">${esc(this.prenom(nom))}</strong>
          <span class="fe-etat"><span data-fe-statut>${i ? this.statutHTML(i) : ""}</span><span class="fe-vu" data-fe-vu>${i ? this.vuHTML(i) : ""}</span></span></div>
        <div class="fe-actions">
          <span class="fiche-wa" data-fiche-wa>${this.waHTML(i)}</span>
          <span data-fiche-tel>${this.telHTML(i)}</span>
          <button class="rond fe-notes" type="button" id="fe-notes" aria-label="${esc(trad("Notes privées"))}" title="${esc(trad("Notes privées"))}" aria-haspopup="dialog">${SVG.note}</button>
          ${menuPointsHTML([{ href: lienPageFiche("accueil/compte"), texte: "Son compte", attrs: 'data-fe-compte' }].concat(i ? this.actions(i) : []), { id: "fiche-points", libelle: "Actions du compte" })}
        </div>
      </div>
      <p class="etat fe-temoin" data-etat-miroir role="status" aria-live="polite">${esc(($("etat") || {}).textContent || "")}</p>
      ${ongletsFicheHTML(ici)}
      ${pages.length > 1 ? `<nav class="sous-onglets bandeau-actions fiche-pages" aria-label="${esc(trad(g.nom))}">${pages.map(p => { const actif = pageFicheActive(p);
        return `<a href="${esc(lienPageFiche(p[0]))}" class="s-onglet b-act${actif ? " on ici" : ""}"${actif ? ' aria-current="page"' : ""}>${esc(trad(p[1]))}</a>`; }).join("")}</nav>` : ""}
    </div>`;
  },
  statutHTML(i){ return `<span class="pastille fe-statut${i.prospect ? " accent" : ""}">${esc(trad(i.prospect ? "Prospect" : "Client"))}</span>${i.arch ? ` <span class="pastille attention fc-archive">${esc(trad("Archivé"))}</span>` : ""}`; },
  /* « vu il y a X » : sa dernière connexion (table connexions) ; orange : un client sans saisie depuis 10 jours ou plus */
  vuTexte(cx){
    if (!cx || !cx.lue) return "";
    if (!cx.derniere) return trad("aucune connexion notée");
    const m = Math.max(0, (Date.now() - Date.parse(cx.derniere)) / 60000);
    if (m < 60) return trad("vu il y a {n} min", { n: Math.max(1, Math.floor(m)) });
    if (m < 1440) return trad("vu il y a {n} h", { n: Math.floor(m / 60) });
    return trad("vu il y a {n} j", { n: Math.floor(m / 1440) });
  },
  inactif(i){ return !i.prospect && i.jours !== null && i.jours >= 10; },
  vuHTML(i){
    const t = this.vuTexte(i.cx), aide = i.jours === null ? trad("Jamais rien saisi") : i.jours === 0 ? trad("Dernière saisie aujourd'hui") : trad("Dernière saisie il y a {n} j", { n: i.jours });
    if (!t && !aide) return "";
    return `<span class="fe-vu-t${this.inactif(i) ? " inactif" : ""}" title="${esc(aide)}">${esc(t || aide)}${this.inactif(i) ? `<span class="sr-only"> · ${esc(aide)}</span>` : ""}</span>`;
  },
  /* i absent (lecture en cours) : les ronds grisés, pour que la ligne ne saute pas à l'arrivée des données */
  waHTML(i){
    if (!i) return `<button type="button" class="rond fiche-wa-l" disabled aria-label="WhatsApp" title="WhatsApp">${SVG.whatsapp}</button>`;
    let m = ""; try { m = messageWhatsAppCoach(i.pr, i.I, i.anglais); } catch(e){ m = ""; }
    const l = Telephone.valide(i.tel) ? (lienWaVers(i.tel, m) || lienWaVers(i.tel, "")) : "";   // un message impossible à encoder : la conversation s'ouvre quand même
    return l ? `<a class="rond fiche-wa-l" href="${esc(l)}" target="_blank" rel="noopener" data-wa-coach aria-label="${esc(trad("WhatsApp : message prêt"))}" title="${esc(trad("WhatsApp : message prêt"))}">${SVG.whatsapp}</a>`
      : `<button type="button" class="rond fiche-wa-l" disabled aria-label="${esc(trad("WhatsApp : pas de numéro"))}" title="${esc(trad("Pas de numéro"))}">${SVG.whatsapp}</button>`;
  },
  telHTML(i){
    if (!i) return `<button type="button" class="rond fc-appeler" disabled aria-label="${esc(trad("Appeler"))}" title="${esc(trad("Appeler"))}">${SVG.tel}</button>`;
    return Telephone.valide(i.tel) ? `<a class="rond fc-appeler" id="fc-appeler" href="tel:${esc(i.tel)}" aria-label="${esc(trad("Appeler"))}" title="${esc(trad("Appeler"))}">${SVG.tel}</a>`
      : `<button type="button" class="rond fc-appeler" id="fc-appeler" disabled aria-label="${esc(trad("Appeler : pas de numéro"))}" title="${esc(trad("Pas de numéro"))}">${SVG.tel}</button>`;
  },
  /* les actions du compte (avant : l'onglet Compte de la fiche), mêmes identifiants qu'avant */
  actions(i){
    return [
      { texte: i.prospect ? "Passer client" : "Repasser prospect", attrs: `id="fc-changer" data-statut="${i.prospect ? "client" : "prospect"}"` },
      { texte: "Donner l'accès complet", attrs: 'id="fc-acces" data-role="coach"' },
      { texte: i.arch ? "Restaurer ce compte" : "Archiver ce compte", attrs: `id="fc-archiver" data-archiver="${i.arch ? "non" : "oui"}"` },
      { texte: "Supprimer définitivement", attrs: 'id="fc-supprimer"', danger: true }
    ];
  },
  /* lu une fois par fiche : profil, numéro, réponses (message prêt), langue, archivage, connexions, dernière saisie */
  encours: {},
  lire(uid){
    if (this.infos[uid]) return Promise.resolve(this.infos[uid]);
    /* deux pages ouvertes avant la fin de la lecture : une seule lecture */
    if (!this.encours[uid]) this.encours[uid] = this.lecture(uid).finally(() => { delete this.encours[uid]; });
    return this.encours[uid];
  },
  async lecture(uid){
    const q = "/rest/v1/donnees?user_id=eq." + uid;
    const [pr, cx, lignes, dates] = await Promise.all([
      Auth.appel("/rest/v1/profils?id=eq." + uid + "&select=*").then(r => Array.isArray(r) ? r[0] || null : null),
      Auth.appel("/rest/v1/connexions?user_id=eq." + uid + "&select=user_id,nombre,derniere,premiere").then(r => ({ lue: Array.isArray(r), ligne: Array.isArray(r) ? r[0] || null : null })).catch(() => ({ lue: false, ligne: null })),
      Auth.appel(q + "&outil=in.(contact,intake,prefs,suivi_prospect,checkins)&select=outil,contenu,maj_le"),
      /* les pages vues (activite) sont une activité pour un prospect seulement (comme Mes clients et l'ancienne tuile « Activité ») */
      Auth.appel(q + "&outil=not.in.(" + this.PAS_SAISIE.filter(k => k !== "activite").join(",") + ")&select=outil,maj_le")
    ]);
    if (!pr) throw new Error("profil introuvable");
    const c = Object.create(null), majs = Object.create(null);
    (Array.isArray(lignes) ? lignes : []).forEach(l => { if (l && typeof l.outil === "string"){ c[l.outil] = typeof Forme !== "undefined" ? Forme.cle(l.outil, l.contenu) : l.contenu; majs[l.outil] = l.maj_le; } });
    let dernier = null;
    (Array.isArray(dates) ? dates : []).forEach(l => {
      if (!l || typeof l.outil !== "string" || typeof l.maj_le !== "string") return;
      if (l.outil === "activite" && pr.statut !== "prospect") return;
      const quand = l.outil === "checkins" ? Clients.dateSaisie("checkins", majs.checkins || l.maj_le, c.checkins) : l.maj_le;
      if (quand && (!dernier || quand > dernier)) dernier = quand;
    });
    const prospect = pr.statut === "prospect", I = c.intake && typeof c.intake === "object" ? c.intake : {};
    const info = { pr: Object.assign({}, pr, { id: uid }), prospect, tel: Contact.telephone(c.contact) || "", I, anglais: !!(c.prefs && c.prefs.langue === "en"),
      arch: Archive.le(c.suivi_prospect), cx: Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(pr), !!(cx && cx.lue)),
      jours: dernier && !isNaN(Date.parse(dernier)) ? Math.max(0, Math.floor((Date.now() - Date.parse(dernier)) / 86400000)) : null };
    this.infos[uid] = info;
    return info;
  },
  /* après l'affichage : les zones de l'en-tête se remplissent ; lecture ratée (hors ligne) : l'en-tête reste sans elles */
  async remplir(uid){
    if (!uid) return;
    let i = null;
    try { i = await this.lire(uid); } catch(e){ return; }
    const z = $("fiche-entete"); if (!z || Store.idConsulte !== uid) return;
    const pose = (sel, h) => { const e = z.querySelector(sel); if (e && e.innerHTML !== h) e.innerHTML = h; };
    pose("[data-fe-statut]", this.statutHTML(i)); pose("[data-fe-vu]", this.vuHTML(i)); pose("[data-fiche-wa]", this.waHTML(i)); pose("[data-fiche-tel]", this.telHTML(i));
    const l = z.querySelector("#fiche-points .menu-points-l");
    if (l && !l.querySelector("#fc-supprimer")){ const t = document.createElement("div"); t.innerHTML = menuPointsHTML(this.actions(i)); const n = t.querySelector(".menu-points-l"); if (n) Array.from(n.children).forEach(x => l.appendChild(x)); }
    this.brancher(z, uid, i);
  },
  brancher(z, uid, i){
    if (z.dataset.feBranche === uid) return;
    z.dataset.feBranche = uid;
    const pFiche = i.pr;
    /* après une action : la fiche est relue (son en-tête aussi), ou quittée si le compte n'en a plus (supprimé, ou passé en accès
       complet) — comme avant dans l'onglet Compte */
    /* sur l'Aperçu, la page est relue (comme avant dans l'onglet Compte) ; ailleurs (Programme en cours d'édition…), seul
       l'en-tête est relu */
    const refaire = () => {
      this.oublier(uid); if (Store.idConsulte !== uid) return;
      if (courant === "accueil") { afficher(courant, true, true); return; }
      const z0 = $("fiche-entete"); if (z0){ const t = document.createElement("div"); t.innerHTML = this.html(); z0.replaceWith(t.firstElementChild); }
      this.remplir(uid);
    };
    const quitter = vers => { this.oublier(uid); ListeCoach.revenir(vers); if (Store.idConsulte === uid){ Store.oublier(uid); Store.idConsulte = null; Store.nomConsulte = null; } Store.retourVers = null; location.hash = "#/" + vers; };
    const sur = (id, f) => { const b = z.querySelector("#" + id); if (b) b.addEventListener("click", () => f(b)); };
    sur("fc-changer", async b => { if (await Acces.changerStatut(pFiche, b.dataset.statut, b)) refaire(); });
    sur("fc-acces", async b => { const vers = Store.retourVers || "clients"; if (await Acces.changerRole(pFiche, "coach", b)) quitter(vers); });
    sur("fc-archiver", async b => {
      const oui = b.dataset.archiver === "oui", T = ListeCoach.TEXTES[i.prospect ? "prospects" : "clients"];
      if (oui && !(await UI.ouvrir({ titre: ListeCoach.plur(1, T.confirmer), corps: trad(ListeCoach.UN), annulation: false, boutons: [
        { texte: trad("Annuler"), valeur: false, classe: "ghost" }, { texte: trad("Archiver"), valeur: true, principal: true }] }))) return;   // v84 : « Archiver » en or (le rouge reste à « Supprimer définitivement »)
      const avant = b.textContent; b.disabled = true; b.textContent = "…";
      const r = await Archive.appliquer([uid], oui);
      if (r.ok.length){ UI.toast(ListeCoach.plur(1, oui ? T.archives : T.restaures), "ok"); refaire(); return; }
      b.disabled = false; b.textContent = avant;
      UI.alerte(trad("Non enregistré ({c}). Réessaie dans un instant.", { c: Commercial.cause(r.ko[0] && r.ko[0].e) }));
    });
    sur("fc-supprimer", async b => { const vers = Store.retourVers || "clients"; if (await Acces.supprimer(pFiche, b) === "fait") quitter(vers); });
  },
  /* « Notes » : les notes privées dans un volet, depuis chaque onglet (NotesCoach : même champ, même enregistrement) ; ce qui
     attend part à la fermeture */
  async notes(){
    const uid = Store.idConsulte; if (!uid) return;
    let fin = () => {};
    const p = UI.volet({ titre: trad("Notes privées"), corps: NotesCoach.html(), classe: "volet-notes" });
    setTimeout(() => { if (Store.idConsulte === uid) fin = NotesCoach.monter(uid); const t = $("nc-texte"); if (t && !t.disabled) try { t.focus(); } catch(e){} }, 0);
    await p;
    try { fin(); } catch(e){}
  }
};
document.addEventListener("click", e => { const b = e.target && e.target.closest ? e.target.closest("#fe-notes") : null; if (b) EnteteFiche.notes(); });
/* v106 (lot 2, relecture) : en descendant dans la page, la rangée des pages de l'onglet se replie (l'en-tête collé garde la ligne et
   les onglets) ; elle revient en haut de page */
window.addEventListener("scroll", () => { const z = document.getElementById("fiche-entete"); if (z) z.classList.toggle("fe-reduit", window.scrollY > 160); }, { passive: true });
/* L'en-tête de chaque page de la fiche (v106 : EnteteFiche) */
function bandeauConsultation(){
  if (!Store.idConsulte) return "";
  return EnteteFiche.html();
}
/* les onglets (liens : chaque onglet ouvre sa première page ; clavier : Tab et Entrée) */
function ongletsFicheHTML(ici){
  return `<nav class="fiche-onglets" aria-label="${esc(trad("Fiche"))}">${ONGLETS_FICHE.map(g => { const p = pagesOnglet(g)[0]; if (!p) return "";
    return `<a class="f-onglet${g.id === ici ? " ici" : ""}" href="${esc(lienPageFiche(p[0]))}" data-onglet-fiche="${g.id}"${g.id === ici ? ' aria-current="page"' : ""}>${esc(trad(g.nom))}</a>`; }).join("")}</nav>`;
}

/* v104 (point 4) : dans la fiche d'un client, le coach lit « sa / ses / son » (Sa régularité, Ses objectifs du mois, Son
   objectif…), jamais « ta / tes / ton » ; le client garde « ta / tes / ton » chez lui (rien ne change hors d'une fiche).
   Une couche, comme celle de la traduction (i18n.js), sur les textes de #vue seulement (jamais data-notr, ni les champs) :
   - un titre (h1 à h4, légende, étiquette, résumé, en-tête de tableau, étiquette de tuile…) qui commence par « Ta / Tes / Ton »
     (« Your » en anglais) commence par « Sa / Ses / Son » (« Their ») ;
   - une phrase qui parle au client (« Coche un objectif quand tu l'as atteint… ») : sa version pour le coach, mot pour mot
     (PHRASES_FICHE ; en anglais, la traduction de l'une devient celle de l'autre). */
const PHRASES_FICHE = {};
/* v104 (point 4) : les phrases qui parlent au client, dans leur version pour le coach (fiche d'un client) */
Object.assign(PHRASES_FICHE, {
  "Comment s'est passée ta semaine ?": "Comment s'est passée sa semaine ?",
  "Combien de séances as-tu réalisées ?": "Combien de séances a-t-il réalisées ?",
  "Comment s'est passée ton alimentation ?": "Comment s'est passée son alimentation ?",
  "Quelle a été ta principale réussite ?": "Quelle a été sa principale réussite ?",
  "Quelle a été ta principale difficulté ?": "Quelle a été sa principale difficulté ?",
  "As-tu besoin d'un ajustement ?": "A-t-il besoin d'un ajustement ?",
  "Un indicateur de motivation, pas une mesure médicale : il compte ce que tu fais — séances, repas, mesure — pas ce que dit la balance.": "Un indicateur de motivation, pas une mesure médicale : il compte ce que ton client fait — séances, repas, mesure — pas ce que dit la balance.",
  "Tes quatre dernières semaines en un coup d'œil : ce que tu as fait, ce qui a bougé et ce qu'on travaille ensuite.": "Ses quatre dernières semaines en un coup d'œil : ce qu'il a fait, ce qui a bougé et ce que vous travaillez ensuite.",
  "Toutes tes mesures": "Toutes ses mesures",
  "Renommer les zones que tu mesures": "Renommer les zones qu'il mesure",
  "Ton métier et ton rythme de travail": "Son métier et son rythme de travail",
  "Quel est ton objectif principal ? *": "Quel est son objectif principal ? *",
  "Décris ton objectif en une phrase, avec un chiffre si possible": "Son objectif en une phrase, avec un chiffre si possible",
  "Pourquoi maintenant ? Qu'est-ce qui a déclenché ta décision ?": "Pourquoi maintenant ? Qu'est-ce qui a déclenché sa décision ?",
  "À quel point es-tu prêt à changer tes habitudes ?": "À quel point est-il prêt à changer ses habitudes ?",
  "Qu'est-ce qui t'a fait échouer par le passé, selon toi ?": "Qu'est-ce qui l'a fait échouer par le passé, selon lui ?",
  "Es-tu suivi actuellement par un professionnel de santé ?": "Est-il suivi actuellement par un professionnel de santé ?",
  "As-tu une contre-indication médicale au sport ou à un changement alimentaire ?": "A-t-il une contre-indication médicale au sport ou à un changement alimentaire ?",
  "Quel est ton niveau ? *": "Quel est son niveau ? *",
  "Que fais-tu comme activité physique actuellement ?": "Que fait-il comme activité physique actuellement ?",
  "Où vas-tu t'entraîner ? *": "Où va-t-il s'entraîner ? *",
  "Si à la maison : quel matériel as-tu ?": "Si à la maison : quel matériel a-t-il ?",
  "Combien de séances par semaine peux-tu RÉELLEMENT tenir ? *": "Combien de séances par semaine peut-il RÉELLEMENT tenir ? *",
  "Exercices ou types de séances que tu détestes / que tu adores": "Exercices ou types de séances qu'il déteste / qu'il adore",
  "Fais-tu du cardio ? Lequel, combien de fois par semaine ?": "Fait-il du cardio ? Lequel, combien de fois par semaine ?",
  "Nombre de pas moyen par jour (si tu le suis)": "Nombre de pas moyen par jour (s'il le suit)",
  "C'est sur cette réponse que ton plan alimentaire sera bâti. Compte les collations comme des repas.": "C'est sur cette réponse que son plan alimentaire sera bâti. Les collations comptent comme des repas.",
  "Qui cuisine ? Combien de temps peux-tu y consacrer par jour ?": "Qui cuisine ? Combien de temps peut-il y consacrer par jour ?",
  "Combien de fois par semaine manges-tu à l'extérieur ou au restaurant ?": "Combien de fois par semaine mange-t-il à l'extérieur ou au restaurant ?",
  "Sert à composer tes repas : aucun plat proposé ne sortira de ce cadre.": "Sert à composer ses repas : aucun plat proposé ne sortira de ce cadre.",
  "Coche tout ce qui te concerne. Les aliments correspondants seront écartés de tes repas. Signale aussi toute allergie qui ne figure pas dans cette liste dans le champ suivant.": "Tout ce qui le concerne. Les aliments correspondants sont écartés de ses repas. Les allergies hors de cette liste sont dans le champ suivant.",
  "Tout ce que la liste ci-dessus ne couvre pas. Ton coach en tient compte avant de valider tes repas.": "Tout ce que la liste ci-dessus ne couvre pas : à prendre en compte avant de valider ses repas.",
  "Aliments que tu ne mangeras jamais, quoi qu'il arrive": "Aliments qu'il ne mangera jamais, quoi qu'il arrive",
  "Aliments dont tu ne veux surtout pas te passer": "Aliments dont il ne veut surtout pas se passer",
  "As-tu déjà suivi un régime ou compté tes calories ? Avec quel résultat ?": "A-t-il déjà suivi un régime ou compté ses calories ? Avec quel résultat ?",
  "As-tu des contraintes de budget alimentaire ?": "A-t-il des contraintes de budget alimentaire ?",
  "Qualité de ton sommeil": "Qualité de son sommeil",
  "À quel moment de la journée as-tu tes coups de barre ?": "À quel moment de la journée a-t-il ses coups de barre ?",
  "Ton entourage va-t-il soutenir ta démarche ou la compliquer ?": "Son entourage va-t-il soutenir sa démarche ou la compliquer ?",
  "Fumes-tu ?": "Fume-t-il ?",
  "Tu es ?": "Sexe"
});
const VueFiche = {
  titres: "h1,h2,h3,h4,legend,label,summary,th,dt,.t-lbl,.fc-sur,.eyebrow,.pastille,.sec-titre",
  POSS: { Ta: "Sa", Tes: "Ses", Ton: "Son", Your: "Their", your: "their" },
  AU_COACH: /^(feedback|client|clients|notes?|base|changements|brouillons?|agenda|avis|réponse|reply|answer)\b/i,
  actif(){ return typeof Auth !== "undefined" && Auth.estCoach() && !!Store.idConsulte; },
  _en: null,
  en(){
    if (!this._en){ this._en = {}; for (const fr in PHRASES_FICHE){ const a = I18N.en[fr], b = I18N.en[PHRASES_FICHE[fr]]; if (a && b) this._en[a] = b; }
      /* v105 (point 3) : deux titres du questionnaire neutres en français mais en « you » en anglais */
      Object.assign(this._en, { "Other allergies, intolerances or foods you avoid": "Other allergies, intolerances or foods they avoid", "Supplements you currently take": "Supplements they currently take" }); }
    return this._en;
  },
  conv(v, titre){
    const n = Traduction.norm(v); if (!n) return null;
    const dico = I18N.langue === "en" ? this.en() : PHRASES_FICHE;
    if (Object.prototype.hasOwnProperty.call(dico, n)) return dico[n];
    /* ce qui appartient au coach (« Ton feedback… », « Ton client… », « Tes notes… ») garde « ton / tes » */
    /* v105 (point 3) : aussi un titre numéroté du questionnaire (« 2 · Ton objectif » → « 2 · Son objectif ») */
    if (titre){ const m = /^(\d+ · )?(Ta|Tes|Ton|Your) (\S.*)$/.exec(n); if (m && !this.AU_COACH.test(m[3])) return (m[1] || "") + this.POSS[m[2]] + " " + m[3]; }
    return null;
  },
  tn(nd){
    const p = nd.parentElement;
    if (!p || Traduction.exclu(p) || !p.closest("#vue") || p.closest("input,select,option")) return;
    if (I18N.langue === "en") Traduction.tn(nd);   // la traduction d'abord : la phrase pour le coach part de l'anglais
    const v = nd.nodeValue, r = this.conv(v, !!p.closest(this.titres));
    if (r != null && r !== Traduction.norm(v)) nd.nodeValue = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0];
  },
  noeud(racine){
    if (!racine || !this.actif()) return;
    if (racine.nodeType === 3){ this.tn(racine); return; }
    if (racine.nodeType !== 1) return;
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT), l = []; let n; while ((n = w.nextNode())) l.push(n);
    l.forEach(x => this.tn(x));
  },
  demarrer(){
    if (this.obs || typeof MutationObserver === "undefined") return;
    this.obs = new MutationObserver(ms => {
      if (!this.actif()) return;
      for (const m of ms){ if (m.type === "characterData") this.tn(m.target); else m.addedNodes.forEach(nd => this.noeud(nd)); }
      this.obs.takeRecords();   // v104 (partie 4) : ses propres changements ne sont pas repassés
    });
    const vue = $("vue"); if (vue) this.obs.observe(vue, { childList: true, subtree: true, characterData: true });
  }
};

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
/* v71 (F) : la page n'a pas pu lire ses donnees (reseau, 5xx) : « Pas de connexion » + Reessayer, a la place d'un etat
   vide faux (« pas encore de programme »…). zone : l'element a remplacer ; zone null (Ma progression, sans zone) : les
   panneaux de la page sont retires et le bloc est pose sous l'en-tete — l'appelant verifie d'abord que SA page est encore
   affichee. L'id n'est pas page-illisible : Retour.relire doit pouvoir redessiner la page au retour du reseau. */
function flagHorsLigne(){
  const t = Store.idConsulte ? "Pas de connexion : les données de ce client n'ont pas pu être chargées." : trad("Pas de connexion : tes données n'ont pas pu être chargées.");
  return `<div class="flag grave flag-hors-ligne" id="page-hors-ligne" role="alert"><span>${esc(t)}</span><button type="button" class="btn petit" data-reessayer data-lecture-ok>${esc(trad("Réessayer"))}</button></div>`;
}
function pageHorsLigne(zone){
  if (zone){ zone.innerHTML = flagHorsLigne(); return; }
  const vue = $("vue"); if (!vue || $("page-hors-ligne")) return;
  $$("#vue section.panel").forEach(s => s.remove());
  const d = document.createElement("div"); d.innerHTML = flagHorsLigne();
  const tete = vue.querySelector(".masthead"); if (tete) tete.after(d.firstElementChild); else vue.prepend(d.firstElementChild);
}
/* « Reessayer » : la page est relue (sans retour en haut, sans compter une page vue de plus : comme Retour.relire) */
document.addEventListener("click", e => {
  const b = e.target && e.target.closest ? e.target.closest("[data-reessayer]") : null;
  if (!b || !$("vue") || !$("vue").contains(b)) return;
  afficher(courant, true, true);
});

/* quitter la fiche consultée : retour vers l'écran d'origine (v71 (I) : tableau, clients, prospects) ; v83 (bloc 3) : la liste
   retrouve sa recherche, son filtre et sa position */
function sortirFiche(){
  const vers = Store.retourVers || "clients";
  ListeCoach.revenir(vers);
  Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; Store.retourVers = null;
  location.hash = "#/" + vers;
}
/* v64 : sansCompte = page reconstruite sur place apres l'accord sante (deja comptee a son ouverture) */
async function afficher(id, silencieux, sansCompte){
  const jeton = ++affichage;
  /* v106 (lot 2) : changer de page referme le volet des notes privées (ce qui attend part tout de suite, comme avant en quittant
     la fiche) */
  if (document.querySelector(".volet-notes")) UI.fermer();
  document.body.classList.remove("lc-selection");   // v83 (bloc 3) : la barre du bas revient en quittant une sélection
  const dispo = outilsVisibles();
  const outil = dispo.find(o => o.id === id) || dispo.find(o => o.id === outilParDefaut()) || dispo[0];
  courant = outil.id;
  if (nettoyage){ nettoyage(); nettoyage = null; }

  if (outil.role === "coach"){ Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; Store.retourVers = null; }

  /* Le bloc « Mes donnees » (export, restauration, suppression) ne vit plus
     qu'au bas du Profil : le repeter sous chaque page alourdissait tout. */
  const avecDonnees = outil.id === "profil" && !Store.idConsulte;
  const verrouille = estVerrouille(outil);   // v40 : mode gratuit
  /* v64 (brief V2, B) : calculateur et Ma progression en pause tant que le prospect n'a pas donne son accord sante */
  const pause = !verrouille && Sante.ECRANS.indexOf(outil.id) > -1 && Sante.aDemander();
  /* v51 : page vue par un prospect (la Decouverte compte elle-meme questionnaire et resultat) */
  if (!sansCompte && outil.id !== "accueil" && outil.id !== "decouverte") Activite.page(verrouille ? "verrou-" + outil.id : outil.id);
  /* v78 (tâche 2) : la bannière d'installation, en bas de la page comme avant ; en haut (avant l'en-tête) seulement après une
     connexion arrivée par ?ouvrir=connexion (Integre.suiteConnexion : la suite des étapes vues dans Instagram, TikTok ou
     Facebook). Ailleurs, la page est identique au caractère près. */
  const installation = bandeauInstallation(), installationHaut = !!installation && typeof Integre !== "undefined" && Integre.suiteConnexion();
  /* v106 (lot 2) : dans une fiche, l'en-tête de la fiche porte tout : plus de titre de page répété (un titre pour les lecteurs
     d'écran seulement, le nom de la page) */
  const enFiche = !!Store.idConsulte && Auth.estCoach();
  document.body.classList.toggle("en-fiche", enFiche);
  $("vue").innerHTML = `
    ${bandeauConsultation()}${installationHaut ? installation : ""}
    ${enFiche ? (outil.sans_entete ? "" : `<h1 class="sr-only">${esc(trad(nomPageFiche()))}</h1>`) : outil.sans_entete ? "" : `<header class="masthead">
      <span class="eyebrow">${CONFIG.marque.programme ? esc(CONFIG.marque.programme) + " — " : ""}${esc(nomOnglet(outil))}</span>
      <h1>${esc(outil.titre)}</h1>
      <p class="lede">${esc(outil.accroche)}</p>
    </header>`}
    ${verrouille ? pageVerrouillee(outil) : (pause ? Sante.carteHTML(outil.id) : "") + htmlSur(outil)}
    ${avecDonnees ? blocSauvegarde() : ""}
    ${installationHaut ? "" : installation}`;

  construireNav();   // les libelles dependent du mode : on les rafraichit
  Nav106.titre(outil);   // v106 (lot 1) : le titre de la page dans la ligne du haut (téléphone, tablette)
  if (Store.idConsulte && Auth.estCoach()){ VueFiche.demarrer(); VueFiche.noeud($("vue")); if (VueFiche.obs) VueFiche.obs.takeRecords(); }   // v104 (point 4) ; partie 4 : la page n'est pas parcourue deux fois
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
  if (verrouille && Auth.estProspect() && !Store.idConsulte) $$("#vue .verrou a[target=_blank]").forEach(a => a.addEventListener("click", () => { try { Decouverte.clic(Store.cache[Decouverte.cle] || Decouverte.vide(), Decouverte.codeVerrou(outil.id)); } catch(e){} }));
  /* v52 (lot E) : l'exemple de la page verrouillee (journee type lue dans le catalogue public, demonstrations) */
  if (verrouille) Echantillons.brancher($("vue"), outil.id);
  if (verrouille && outil.id === "programme" && $("pf-zone")) ProgFormation.monter($("pf-zone"), sousRoute);   // v85 (bloc 4)
  if (pause){
    /* rien n'est lu ni branche (outil.init) avant l'accord : la carte, les champs inactifs ; « J'accepte » (ou un accord
       donne sur un autre appareil, relu) → la page repart, sans la carte */
    Sante.figer($("vue"));
    Sante.pause($("vue"), outil.id, async () => {
      if (jeton !== affichage || courant !== outil.id) return;
      await afficher(courant, true, true);
      /* clavier, lecteur d'ecran : la place n'est pas perdue, le premier champ maintenant actif prend le focus */
      const f = courant === outil.id && $("vue").querySelector("section.panel input:not([disabled]), section.panel select:not([disabled]), section.panel button:not([disabled])");
      if (f) try { f.focus({ preventScroll: true }); } catch(e){}
    });
  } else if (!verrouille){
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
  /* « Revenir … » du bandeau et, v83 (bloc 3), la croix de la fiche (« Fermer la fiche ») : là d'où l'on vient */
  ["sortir-fiche", "fc-fermer"].forEach(id => { const b = $(id); if (b) b.addEventListener("click", sortirFiche); });
  if (Store.idConsulte && Auth.estCoach()) EnteteFiche.remplir(Store.idConsulte);   // v106 (lot 2) : statut, « vu il y a », WhatsApp, Appeler, « ⋯ » (lecture seule)

  brancherInstallation();

  marquerNav(outil.id);
  DieteClient.verifier();   // v100 : le calculateur quitte le menu d'un client qui a une diète (une lecture par visite)
  if (!silencieux) window.scrollTo(0, 0);
}

