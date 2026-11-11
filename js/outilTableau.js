/* ------------------------------------------------------------------
   OUTIL COACH — Tableau de bord (v37). La page d'arrivee du coach :
   « qui necessite mon attention aujourd'hui ? ». Ne fait que lire.
   v53 (chantier 4) : deux tuiles seulement, Clients et Prospects, avec leurs urgences en badge (un nombre ; en couleur
   seulement s'il y a une urgence), puis « À traiter maintenant » (5 lignes au plus, un clic vers la bonne fiche),
   affichée seulement quand elle n'est pas vide. Plus de score ni de température ; la tuile « Prospects en découverte »
   et le panneau des Nouveautés (sur la page Prospects) sont retirés, le badge des Nouveautés est toujours calculé.
   Urgences clients : une alerte de niveau « mauvais » (😞 non traité, note en chute, inactivité, régularité faible,
   calculateur ≠ questionnaire), ou un retour de la semaine reçu à lire (Clients.urgent). Urgences prospects : ceux
   « à traiter » (Commercial.analyse : même définition que la page Prospects).
   v72 (E) : en haut, « Nouveaux depuis ta dernière visite » : les prospects inscrits depuis la visite précédente du coach,
   avec prénom, date d'inscription, numéro, « Appeler » et « WhatsApp ». La visite est gardée dans une clé du coach lui-même
   (coach_visite : { le, jusqua, avant, avant_le }), déjà lue par Clients.charger (aucune lecture de plus) : une NOUVELLE
   visite = un affichage du tableau de bord une demi-heure ou plus après le début de la précédente ; seule écriture de cette page,
   une fois par visite (un rechargement ou un retour au tableau de bord pendant la visite ne vide pas la liste et n'écrit
   rien). Le seuil est la date d'inscription la plus récente vue au début de la visite précédente (horloge du serveur :
   rien ne se perd entre la lecture et l'écriture, quelle que soit l'heure du téléphone du coach). Aucune visite
   enregistrée : les inscrits des 7 derniers jours.
   v83 (bloc 3, maquette Tableau) : titre « Tableau de bord » et « Ce qui demande ton attention aujourd'hui. », une loupe (la
   recherche de la liste Clients), 3 compteurs (Clients, À traiter, Prospects ; les badges d'urgences restent dans Clients et
   Prospects), puis « À traiter maintenant » (toujours affichée : « Rien à traiter pour l'instant. » quand elle est vide ;
   chaque ligne ouvre la bonne fiche), puis tout le reste d'avant, en dessous : « Nouveaux depuis ta dernière visite »,
   « Inscrits par source », « Raccourcis ». Les comptes archivés (Archive) sont exclus des compteurs, de « À traiter », des
   nouveaux et des Nouveautés ; « Inscrits par source » reste une statistique de tous les inscrits.
   v106 (lot 5, refonte de l'ergonomie) — « AUJOURD'HUI » : en haut, 4 chiffres qui sont des boutons vers leur groupe (à traiter,
   retours à lire, nouveaux, inactifs) ; puis UNE liste groupée, une ligne par personne avec sa raison la plus urgente, toute la
   ligne cliquable : Retours à lire (bilan ou feedback reçu, 😞, note en chute → fiche › Suivi › Bilans), Clients inactifs (aucune
   saisie depuis 10 jours → Aperçu), Nouveaux prospects (inscrits depuis ta dernière visite ou depuis moins de 48 h → leur fiche ;
   WhatsApp = message prêt), Bilans réservés (« Bilan réservé » ou « J'ai réservé » → leur fiche, suivi commercial), À relancer
   (signé à passer client, absent, a cliqué, perdu → leur fiche). Plus de plafond à 5 lignes : un groupe long se replie sur place
   (« Tout voir (N) »). Plus de tuiles ni de « Raccourcis » ; « Inscrits par source » est dans Prospects › Vue détaillée. Sur
   ordinateur, 2 colonnes : les clients à gauche, les prospects à droite. La visite du coach (v72 E) et le badge de l'onglet
   Prospects (v105) ne changent pas.
   ------------------------------------------------------------------ */
const outilTableau = {
  id: "tableau",
  cle: null,
  nom: "Tableau de bord",
  icone: "📈",
  role: "coach",
  sans_entete: true,
  titre: "Aujourd'hui",   // v106 (lot 1) : le nom de l'entrée du menu
  accroche: "",

  html(){ return `<div id="tb-vue"><header class="masthead tb-tete"><div class="tb-tete-l"><h1>Aujourd'hui</h1><p class="lede">Ce qui demande ton attention aujourd'hui.</p></div></header><section class="panel">${squelette()}</section></div>`; },

  /* le rang des motifs des prospects (v59) : signé 3, « J'ai réservé » 4, absent 5, clic 6, nouvel inscrit 7, bilan à conclure 9,
     « Perdu » à relancer 10 ; v106 (lot 5) : l'ordre des lignes dans « Bilans réservés » et « À relancer » */
  RANG_PROSPECTS: { signe: 3, case: 4, absent: 5, clic: 6, nouveau: 7, appel: 9, perdu: 10 },
  /* v104 (point 10) : une URGENCE = ce qui demande une action du coach aujourd'hui (client : 😞, note en chute, retour à lire ;
     prospect : nouvel inscrit, « J'ai réservé », clic, absent, signé). v106 (lot 5) : les retours à lire forment leur groupe ; les
     urgences des prospects font le badge de l'onglet Prospects. */
  URG_CLIENTS: ["avis_triste", "note_chute", "bilan_recu"],
  URG_PROSPECTS: ["nouveau", "case", "clic", "absent", "signe"],
  urgentProspect(a){ return !!(a && a.urgent && this.URG_PROSPECTS.indexOf(a.motif) > -1); },
  /* v106 (lot 5) : les groupes de « Aujourd'hui », chacun trié (le plus urgent d'abord). nouveaux : les prospects inscrits depuis la
     visite précédente du coach (v72 E). Une personne n'est que dans un groupe : celui de sa raison la plus urgente. */
  GROUPES: [
    { id: "retours", titre: "Retours à lire", col: "clients", vide: "Aucun retour à lire." },
    { id: "inactifs", titre: "Clients inactifs", col: "clients", vide: "Aucun client inactif." },
    { id: "nouveaux", titre: "Nouveaux prospects", col: "prospects", vide: "Aucun nouvel inscrit." },
    { id: "reserves", titre: "Bilans réservés", col: "prospects", vide: "Aucun bilan réservé à suivre." },
    { id: "relancer", titre: "À relancer", col: "prospects", vide: "Personne à relancer." }
  ],
  REPLI: 5,          // un groupe plus long se replie sur place : « Tout voir (N) »
  deplies: {},       // les groupes dépliés pendant la session
  groupes(clients, prospects, nouveaux){
    const G = { retours: [], inactifs: [], nouveaux: [], reserves: [], relancer: [] };
    const rg = a => a.type === "avis_triste" ? 0 : a.type === "note_chute" ? 1 : 2;
    clients.forEach(l => {
      const ret = l.alertes.filter(a => this.URG_CLIENTS.indexOf(a.type) > -1).sort((x, y) => rg(x) - rg(y))[0];
      const base = { uid: l.p.id, nom: l.nom, jours: l.jours || 0 };
      if (ret){ G.retours.push(Object.assign(base, { texte: ret.texte, cible: "bilan", niveau: ret.type === "bilan_recu" ? "ok" : "attention", rang: rg(ret) })); return; }
      const ina = l.alertes.find(a => a.type === "inactif" && a.niveau === "mauvais");
      if (ina) G.inactifs.push(Object.assign(base, { texte: ina.texte, cible: "accueil", niveau: "mauvais", rang: 0 }));
    });
    const neufs = new Set((nouveaux || []).map(l => l.p.id));
    prospects.forEach(x => {
      const a = x.a, m = a.motif, l = x.l;
      const base = { uid: l.p.id, nom: l.nom, prospect: true, cible: "accueil", recence: a.recence || 0, rang: this.RANG_PROSPECTS[m] != null ? this.RANG_PROSPECTS[m] : 8, urgent: this.urgentProspect(a) };
      if (m === "case" || m === "appel" || (!m && !a.issue && (a.coche || a.caseAVerifier))) G.reserves.push(Object.assign(base, { texte: m ? Commercial.motifTexte(a) : trad("Bilan réservé"), niveau: "accent" }));
      else if (m === "signe" || m === "absent" || m === "clic" || m === "perdu") G.relancer.push(Object.assign(base, { texte: Commercial.motifTexte(a), niveau: m === "signe" ? "ok" : "attention" }));
      else if (m === "nouveau" || neufs.has(l.p.id)) G.nouveaux.push(Object.assign(base, { texte: m === "nouveau" ? Commercial.motifTexte(a) : trad("Inscrit le {d}", { d: this.quand(l.p.cree_le) }), niveau: "accent", cree: Date.parse(l.p.cree_le) || 0, tel: l.tel, msgWa: l.msgWa }));
    });
    G.retours.sort((a, b) => a.rang - b.rang || b.jours - a.jours);
    G.inactifs.sort((a, b) => b.jours - a.jours);
    G.nouveaux.sort((a, b) => b.cree - a.cree);
    ["reserves", "relancer"].forEach(k => G[k].sort((a, b) => a.rang - b.rang || a.recence - b.recence));
    return G;
  },
  ligneHTML(x){
    /* toute la ligne ouvre la fiche (initiales, nom, point de couleur et raison, chevron) ; un nouveau prospect a aussi son
       WhatsApp (message prêt), à côté */
    const wa = x.prospect && x.tel && Telephone.valide(x.tel) ? lienWaVers(x.tel, x.msgWa || "") || lienWaVers(x.tel, "") : "";
    return `<li class="tb-l"><button type="button" class="tb-at-b" data-fiche="${esc(x.uid)}" data-nom="${esc(x.nom)}" data-cible="${esc(x.cible)}">${Clients.avatar(x.nom)}<span class="tb-quoi"><b data-notr>${esc(x.nom)}</b><small><span class="point ${esc(x.niveau || "neutre")}" aria-hidden="true"></span> ${esc(x.texte)}</small></span><span class="tb-chevron" aria-hidden="true">${SVG.chevron}</span></button>${wa ? `<a class="rond tb-wa" href="${esc(wa)}" target="_blank" rel="noopener" data-wa-coach aria-label="${esc(trad("WhatsApp : message prêt"))}" title="${esc(trad("WhatsApp : message prêt"))}">${SVG.whatsapp}</a>` : ""}</li>`;
  },
  groupeHTML(g, l, note){
    const ouvert = !!this.deplies[g.id], n = l.length, vus = ouvert ? l : l.slice(0, this.REPLI);
    /* data-urgences : combien de ces lignes sont des urgences (le badge de l'onglet Prospects les compte) */
    return `<section class="tb-groupe" id="tb-g-${g.id}" aria-labelledby="tb-g-${g.id}-t" data-urgences="${l.filter(x => x.urgent).length}"><h3 class="tb-sur" id="tb-g-${g.id}-t">${esc(trad(g.titre))} <span class="tb-n">${n}</span></h3>
      ${note ? `<p class="note tb-g-note">${esc(note)}</p>` : ""}
      ${n ? `<ul class="tb-liste tb-at">${vus.map(x => this.ligneHTML(x)).join("")}</ul>${n > this.REPLI ? `<button type="button" class="lc-lien tb-tout" data-tb-deplier="${g.id}" aria-controls="tb-g-${g.id}" aria-expanded="${ouvert}">${esc(ouvert ? trad("Replier") : trad("Tout voir ({n})", { n }))}</button>` : ""}`
        : `<p class="note tb-rien">${esc(trad(g.vide))}</p>`}</section>`;
  },

  /* v72 (E) — la visite du coach */
  VISITE: { cle: "coach_visite", PAUSE: 30 * 60000, JOURS: 7 },
  iso(v){ return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && !isNaN(Date.parse(v)) ? v : null; },
  /* la visite enregistrée, revalidée (écrite par le coach, mais jamais lue sans contrôle), ou null */
  visiteLue(V){
    if (!V || typeof V !== "object" || Array.isArray(V) || !this.iso(V.le)) return null;
    return { le: V.le, jusqua: this.iso(V.jusqua), avant: this.iso(V.avant), avant_le: this.iso(V.avant_le) };
  },
  /* V : la visite enregistrée ; t : maintenant ; maxCree : l'inscription la plus récente des profils chargés.
     Rend { seuil (null : 7 derniers jours), depuis (début de la visite précédente, à afficher), nouvelle (à écrire, ou null) } */
  visite(V, t, maxCree){
    if (V && t - Date.parse(V.le) < this.VISITE.PAUSE) return { seuil: V.avant, depuis: V.avant_le, nouvelle: null };   // même visite (début dans le futur : aussi)
    const seuil = V ? (V.jusqua || V.le) : null;
    return { seuil, depuis: V ? V.le : null, nouvelle: { le: new Date(t).toISOString(), jusqua: maxCree, avant: seuil, avant_le: V ? V.le : null } };
  },
  quand(iso){ const d = new Date(iso), p = n => String(n).padStart(2, "0"); return p(d.getDate()) + "/" + p(d.getMonth() + 1) + (I18N.langue === "en" ? " at " : " à ") + p(d.getHours()) + ":" + p(d.getMinutes()); },
  /* v72 (F) — les inscrits des 30 derniers jours (aujourd'hui compris, depuis minuit il y a 29 jours) par source (le code du
     lien d'inscription, clé contact) : les comptes passés par l'inscription gratuite, hors coach et hors comptes de test (même
     règle que la Mesure de la page Prospects, sans sa case « Inclure les comptes de test ») */
  sources(lignes){
    const passe = l => l.p.statut === "prospect" || !!l.ch || !!(l.dc && (l.dc.court_le || l.dc.court_debut)) || !!(l.suivi && (l.suivi.client_le || l.suivi.issue));
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 29);
    const n = Object.create(null);   // sans prototype : un code « constructor » ne touche rien
    let total = 0;
    (lignes || []).filter(l => l && l.p && l.p.role !== "coach" && passe(l) && !Mesure.estTest(l) && Mesure.dans(l.p.cree_le, d.getTime())).forEach(l => { const k = l.ref || ""; n[k] = (n[k] || 0) + 1; total++; });
    const table = Object.keys(n).map(k => ({ ref: k, n: n[k] })).sort((a, b) => b.n - a.n || (a.ref === "" ? 1 : b.ref === "" ? -1 : a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
    return { total, table };
  },
  sourcesHTML(S){
    return `<section class="panel" id="tb-sources"><h2>Inscrits par source</h2>
      <p class="note" style="margin:0 0 10px">30 derniers jours, hors comptes de test. La source est le code du lien d'inscription (…/?ref=insta) ; « — » : sans code.</p>
      ${S.total ? `<table class="pr-mesure-t" id="tb-sources-t"><thead><tr><th>Source</th><th>Inscrits</th></tr></thead><tbody>${S.table.map(r => `<tr><td data-notr>${esc(r.ref || "—")}</td><td>${r.n}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td><b>Total</b></td><td><b>${S.total}</b></td></tr></tfoot></table>`
        : `<p class="empty" style="margin:0">Aucun inscrit sur les 30 derniers jours.</p>`}</section>`;
  },
  async init(){
    const zone = $("tb-vue"); if (!zone) return;
    let profils, parClient, contenus;
    try { ({ profils, parClient, contenus } = await Clients.charger({ connexions: false })); }   // v56 : le compteur de connexions n'est pas affiche ici
    catch(e){ zone.innerHTML = `<section class="panel"><div class="empty">Impossible de charger tes clients pour le moment.</div></section>`; return; }
    if (!zone.isConnected) return;
    const toutes = Clients.resumer(profils, parClient, contenus);
    const lignes = toutes.filter(l => !l.archive);   // v83 (bloc 3) : sans les comptes archivés (compteurs, à traiter, nouveaux, Nouveautés)
    const clients = lignes.filter(l => l.p.statut !== "prospect");
    const prospects = lignes.filter(l => l.p.statut === "prospect").map(l => ({ l, a: Commercial.analyseLigne(l) })).filter(x => x.a);
    /* v105 : le badge de l'onglet Prospects = les urgences prospects (inchangé) */
    const urgProspects = prospects.filter(x => this.urgentProspect(x.a)).length;
    /* v72 (E) : la visite (décidée ici, au rendu : la clé du coach est dans contenus), puis les inscrits d'après elle */
    const moi = Auth.utilisateur() && Auth.utilisateur().id, t = Date.now(), futur = t + 5 * 60000;
    const V = this.visiteLue(moi && contenus[moi] ? contenus[moi][this.VISITE.cle] : null);
    /* le seuil de la visite suivante : jamais une date future (cree_le est modifiable par son compte) */
    const crees = (profils || []).map(p => p && this.iso(p.cree_le)).filter(x => x && Date.parse(x) <= t).sort();
    const vis = this.visite(V, t, crees.length ? crees[crees.length - 1] : null);
    const borne = vis.seuil ? Date.parse(vis.seuil) : t - this.VISITE.JOURS * 86400000;
    const nouveaux = lignes.filter(l => l.p.statut === "prospect" && this.iso(l.p.cree_le) && Date.parse(l.p.cree_le) > borne && Date.parse(l.p.cree_le) <= futur);
    const G = this.groupes(clients, prospects, nouveaux);
    const total = Object.keys(G).reduce((n, k) => n + G[k].length, 0);
    const noteVisite = vis.depuis ? trad("Inscrits depuis ta dernière visite (le {d}) ou depuis moins de 48 h.", { d: this.quand(vis.depuis) }) : trad("Première visite enregistrée : les inscrits des 7 derniers jours.");
    const chiffre = (id, n, lbl, vers) => `<button type="button" class="tb-chiffre${n ? " actif" : ""}" id="${id}" data-tb-aller="${vers}"><span class="t-val readout">${n}</span><span class="t-lbl">${esc(trad(lbl))}</span></button>`;
    const colonne = (col, titre) => `<div class="tb-col" id="tb-col-${col}"><h2 class="tb-col-t">${esc(trad(titre))}</h2>${this.GROUPES.filter(g => g.col === col).map(g => this.groupeHTML(g, G[g.id], g.id === "nouveaux" ? noteVisite : "")).join("")}</div>`;
    zone.innerHTML = `
      <header class="masthead tb-tete">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <div class="tb-tete-l"><h1>Aujourd'hui</h1><p class="lede">Ce qui demande ton attention aujourd'hui.</p></div>
      </header>
      <nav class="tb-chiffres" aria-label="${esc(trad("En bref"))}">
        ${chiffre("tb-c-traiter", total, "À traiter", "tb-a-traiter")}${chiffre("tb-c-retours", G.retours.length, "Retours à lire", "tb-g-retours")}${chiffre("tb-c-nouveaux", G.nouveaux.length, "Nouveaux", "tb-g-nouveaux")}${chiffre("tb-c-inactifs", G.inactifs.length, "Inactifs", "tb-g-inactifs")}
      </nav>
      ${total ? "" : `<p class="empty tb-rien-tout">${esc(trad("Rien à traiter pour l'instant."))}</p>`}
      <div class="tb-colonnes" id="tb-a-traiter">${colonne("clients", "Clients")}${colonne("prospects", "Prospects")}</div>`;
    /* v106 (lot 5) : « Tout voir (N) » déplie le groupe sur place (et « Replier ») ; un chiffre du haut mène à son groupe (et le
       déplie s'il est long) */
    const brancherGroupe = sec => {
      $$("[data-fiche]", sec).forEach(b => b.addEventListener("click", () => Clients.ouvrir(b.dataset.fiche, b.dataset.nom, b.dataset.cible)));
      $$("[data-tb-deplier]", sec).forEach(b => b.addEventListener("click", () => {
        const id = b.dataset.tbDeplier, g = this.GROUPES.find(x => x.id === id), z = $("tb-g-" + id); if (!g || !z) return;
        this.deplies[id] = !this.deplies[id];
        const t = document.createElement("div"); t.innerHTML = this.groupeHTML(g, G[id], id === "nouveaux" ? noteVisite : "");
        const n = t.firstElementChild; z.replaceWith(n); brancherGroupe(n);
        const nb = n.querySelector("[data-tb-deplier]"); if (nb) try { nb.focus({ preventScroll: true }); } catch(e){}
      }));
    };
    $$(".tb-groupe", zone).forEach(brancherGroupe);
    $$("[data-tb-aller]", zone).forEach(b => b.addEventListener("click", () => {
      const z = $(b.dataset.tbAller); if (!z) return;
      const d = z.classList.contains("tb-groupe") ? z.querySelector('[data-tb-deplier][aria-expanded="false"]') : null; if (d) d.click();   // un groupe long se déplie ; « À traiter » mène juste en haut de la liste
      const cible = $(b.dataset.tbAller); if (cible) cible.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    /* v72 (E) : nouvelle visite : la seule écriture de cette page, une ligne du coach lui-même (règles de la base : le propriétaire),
       directe (pas de copie sur l'appareil ni d'« Enregistrement… » : rien que le coach ait saisi) ; ratée : la visite suivante
       repartira de l'ancienne */
    if (vis.nouvelle && moi && !Store.idConsulte){
      Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: [{ user_id: moi, outil: this.VISITE.cle, contenu: vis.nouvelle, maj_le: new Date(t).toISOString() }] }).catch(e => console.warn("[MHX] visite du coach non enregistrée", e && e.statut));
    }
    /* v105 : le badge de l'onglet Prospects = les urgences prospects de cette page (avant : les nouveautés) */
    if (!Store.idConsulte){ Nouveautes.urg = urgProspects; Nouveautes.badge(); }
  }
};
