/* ------------------------------------------------------------------
   OUTIL COACH — Tableau de bord (v37). La page d'arrivee du coach :
   « qui necessite mon attention aujourd'hui ? ». Ne fait que lire.
   ------------------------------------------------------------------ */
const outilTableau = {
  id: "tableau",
  cle: null,
  nom: "Tableau de bord",
  icone: "📈",
  role: "coach",
  principal_coach: true,
  sans_entete: true,
  titre: "Tableau de bord",
  accroche: "",

  html(){ return `<div id="tb-vue"><header class="masthead"><h1>Tableau de bord</h1></header><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  async init(){
    const zone = $("tb-vue"); if (!zone) return;
    let profils, parClient, contenus;
    const t0 = new Date().toISOString();   // v51 : instant de lecture (Nouveautés)
    try { [{ profils, parClient, contenus }] = await Promise.all([Clients.charger(), JournalEmails.charger()]); }
    catch(e){ zone.innerHTML = `<section class="panel"><div class="empty">Impossible de charger tes clients pour le moment.</div></section>`; return; }
    const lignes = Clients.resumer(profils, parClient, contenus);
    const prospects = profils.filter(p => p.role !== "coach" && p.statut === "prospect");
    /* prospects encore dans leurs jours de decouverte (depuis l'inscription) — v52 : tuile gardee telle quelle (v53) */
    const enDecouverte = lignes.filter(l => l.p.statut === "prospect" && !Decouverte.finie(l.p, true)).length;
    /* v49 : les prospects a traiter (temperature, prochaine action) */
    const aTraiterPr = lignes.filter(l => l.p.statut === "prospect").map(l => ({ l, a: Commercial.analyseLigne(l) })).filter(x => x.a).sort((x, y) => x.a.rang - y.a.rang || x.a.recence - y.a.recence);
    const chauds = aTraiterPr.filter(x => x.a.etat === "chaud").length;
    const clients = lignes.filter(l => l.p.statut !== "prospect");
    const aTraiter = clients.filter(l => l.alertes.some(a => a.type === "bilan_recu")).length;
    const nonCompletes = clients.filter(l => l.alertes.some(a => a.type === "bilan_manque")).length;
    const aSurveiller = clients.filter(l => l.alertes.some(a => a.niveau !== "info"));
    const prenom = (Auth.profil && Auth.profil.prenom) || "";
    const tuile = (lbl, val, sub, cls, lien) => `<a class="tile tb-tuile${cls ? " " + cls : ""}" href="${lien || "#/clients"}"><div class="t-lbl">${lbl}</div><div class="t-val readout">${val}</div><div class="t-sub">${sub}</div></a>`;
    const carte = l => `<div class="attention-c">
        <div class="attention-tete">${Clients.avatar(l.nom)}
          <div class="attention-nom"><b>${esc(l.nom)}</b><small>${l.jours === null ? "jamais rien saisi" : l.jours === 0 ? "actif aujourd'hui" : "dernière saisie il y a " + l.jours + " j"}${l.reg != null ? ` · régularité <b class="${Regularite.niveau(l.reg)}">${l.reg}</b>/100` : ""}</small></div>
          <button type="button" class="btn ghost petit" data-fiche="${esc(l.p.id)}" data-nom="${esc(l.nom)}" data-cible="accueil">Ouvrir</button></div>
        <div class="attention-alertes">${l.alertes.map(a => `<button type="button" class="pastille ${a.niveau === "info" ? "accent" : a.niveau}" data-fiche="${esc(l.p.id)}" data-nom="${esc(l.nom)}" data-cible="${esc(a.cible)}">${esc(a.texte)}</button>`).join("")}</div>
      </div>`;
    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Bonjour${prenom ? " " + esc(prenom) : ""}</h1>
        <p class="lede">${aSurveiller.length ? `${aSurveiller.length} client${aSurveiller.length > 1 ? "s" : ""} ${aSurveiller.length > 1 ? "demandent" : "demande"} ton attention aujourd'hui.` : "Rien d'urgent : tes clients avancent."}</p>
      </header>
      <section class="panel">
        <div class="tiles tb-tiles">
          ${tuile("Clients actifs", clients.length, "accompagnement en cours")}
          ${tuile("Prospects en découverte", enDecouverte, [chauds ? `${chauds} chaud${chauds > 1 ? "s" : ""}` : "", `${prospects.length} prospect${prospects.length > 1 ? "s" : ""} au total`].filter(Boolean).join(" · "), chauds ? "cle" : "", "#/prospects")}
          ${tuile("Bilans à traiter", aTraiter, "reçus cette semaine", aTraiter ? "cle" : "")}
          ${tuile("Bilans non complétés", nonCompletes, "semaine passée", nonCompletes ? "attention" : "")}
          ${tuile("À surveiller", aSurveiller.length, "au moins une alerte", aSurveiller.length ? "attention" : "")}
        </div>
      </section>
      <div id="tb-nouveautes"></div>
      ${aTraiterPr.some(x => x.a.urgent) ? `<section class="panel" id="tb-prospects"><div class="seance-c-tete"><h2>Prospects à traiter</h2><a class="link-a" href="#/prospects">Tous les prospects →</a></div>
        <div class="sc-liste">${aTraiterPr.filter(x => x.a.urgent).slice(0, 4).map(x => Commercial.carteHTML(x.l.p, x.a, { sc: Commercial.scoreLigne(x.l, x.a), dc: x.l.dc })).join("")}</div></section>` : ""}
      <section class="panel">
        <h2>Qui nécessite ton attention aujourd'hui ?</h2>
        ${aSurveiller.length ? `<div class="attention-l">${aSurveiller.map(carte).join("")}</div>` : `<div class="empty">Tout est en ordre : questionnaires remplis, programmes et diètes envoyés, bilans à jour, personne d'inactif.</div>`}
        ${clients.length - aSurveiller.length > 0 ? `<p class="note" style="margin:12px 0 0">${clients.length - aSurveiller.length} client${clients.length - aSurveiller.length > 1 ? "s" : ""} sans alerte. <a class="link-a" href="#/clients">Voir le tableau complet →</a></p>` : ""}
      </section>
      <section class="panel">
        <h2>Raccourcis</h2>
        <div class="acces-l">
          <a class="acces" href="#/clients"><span class="ico">${ICONES.clients}</span><span class="txt"><b>Mes clients</b><small>tableau complet, comptes, création d'accès</small></span><span class="fleche">›</span></a>
          <a class="acces" href="#/atelier"><span class="ico">${ICONES.atelier}</span><span class="txt"><b>Mes séances</b><small>construire un programme modèle</small></span><span class="fleche">›</span></a>
          <a class="acces" href="#/bibliotheque"><span class="ico">${ICONES.bibliotheque}</span><span class="txt"><b>Bibliothèque</b><small>entraînements et journées types</small></span><span class="fleche">›</span></a>
          <a class="acces" href="#/catalogue"><span class="ico">${ICONES.catalogue}</span><span class="txt"><b>Catalogue</b><small>aliments, recettes, programmes, exercices</small></span><span class="fleche">›</span></a>
        </div>
      </section>`;
    $$("[data-fiche]", zone).forEach(b => b.addEventListener("click", () => Clients.ouvrir(b.dataset.fiche, b.dataset.nom, b.dataset.cible)));
    Commercial.brancher(zone, () => { if (zone.isConnected) this.init(); });   // v49
    Nouveautes.monter(zone.querySelector("#tb-nouveautes"), lignes, false, t0);   // v51
  }
};

