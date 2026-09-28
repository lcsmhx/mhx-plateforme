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
  MAX_LIGNES: 5,
  AIDE_CLIENTS: "Urgences : un 😞 non traité, une note en chute, un retour de la semaine à lire (feedback du dimanche ou bilan du vendredi), un client inactif depuis 10 jours, une régularité faible, ou un calculateur qui ne correspond pas au questionnaire.",

  html(){ return `<div id="tb-vue"><header class="masthead"><h1>Tableau de bord</h1></header><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  /* les lignes « À traiter maintenant » : une par personne (sa raison la plus urgente), des plus urgentes aux autres.
     rang : 😞 0, note en chute 1, retour à lire 2, prospect signé 3, case « J'ai réservé » 4, clic 5, nouvel inscrit 6,
     autre urgence d'un client 7 */
  aTraiter(clients, prospects){
    const out = [];
    clients.forEach(l => {
      const al = l.alertes.filter(a => a.niveau === "mauvais" || a.type === "bilan_recu"); if (!al.length) return;
      const r = a => a.type === "avis_triste" ? 0 : a.type === "note_chute" ? 1 : a.type === "bilan_recu" ? 2 : 7;
      const a = al.slice().sort((x, y) => r(x) - r(y))[0];
      out.push({ rang: r(a), uid: l.p.id, nom: l.nom, texte: a.texte, cible: a.cible || "accueil", jours: l.jours || 0 });
    });
    prospects.forEach(x => { if (x.a.urgent) out.push({ rang: 3 + x.a.rang, uid: x.l.p.id, nom: x.l.nom, texte: Commercial.motifTexte(x.a), cible: "accueil", prospect: true, jours: 0 }); });
    return out.sort((a, b) => a.rang - b.rang || b.jours - a.jours);
  },

  async init(){
    const zone = $("tb-vue"); if (!zone) return;
    let profils, parClient, contenus;
    try { ({ profils, parClient, contenus } = await Clients.charger({ connexions: false })); }   // v56 : le compteur de connexions n'est pas affiche ici
    catch(e){ zone.innerHTML = `<section class="panel"><div class="empty">Impossible de charger tes clients pour le moment.</div></section>`; return; }
    if (!zone.isConnected) return;
    const lignes = Clients.resumer(profils, parClient, contenus);
    const clients = lignes.filter(l => l.p.statut !== "prospect");
    const prospects = lignes.filter(l => l.p.statut === "prospect").map(l => ({ l, a: Commercial.analyseLigne(l) })).filter(x => x.a);
    const urgClients = clients.filter(l => Clients.urgent(l)).length, urgProspects = prospects.filter(x => x.a.urgent).length;
    const liste = this.aTraiter(clients, prospects);
    const prenom = (Auth.profil && Auth.profil.prenom) || "";
    const pl = (n, s, p) => n > 1 ? p : s;
    /* le badge : le nombre d'urgences, en couleur seulement s'il y en a */
    const badge = (n, aide) => `<span class="pastille tb-badge${n ? " mauvais" : ""}" title="${esc(aide)}">${n} ${pl(n, "urgence", "urgences")}</span>`;
    const tuile = (id, lbl, val, sub, n, aide, lien) => `<a class="tile tb-tuile" id="${id}" href="${lien}" title="${esc(aide)}"><div class="tb-tuile-tete"><span class="t-lbl">${lbl}</span>${badge(n, aide)}</div><div class="t-val readout">${val}</div><div class="t-sub">${sub}</div></a>`;
    const total = urgClients + urgProspects;
    const ligne = x => `<li><span class="tb-quoi"><b>${esc(x.nom)}</b>${x.prospect ? ` <span class="pastille accent">prospect</span>` : ""}<small>${esc(x.texte)}</small></span><button type="button" class="btn ghost petit" data-fiche="${esc(x.uid)}" data-nom="${esc(x.nom)}" data-cible="${esc(x.cible)}">Ouvrir</button></li>`;
    const reste = liste.length - this.MAX_LIGNES;
    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Bonjour${prenom ? " " + esc(prenom) : ""}</h1>
        <p class="lede">${total ? `${total} ${pl(total, "urgence", "urgences")} aujourd'hui.` : "Rien d'urgent aujourd'hui."}</p>
      </header>
      <section class="panel">
        <div class="tiles tb-tiles">
          ${tuile("tb-t-clients", "Clients", clients.length, pl(clients.length, "accompagnement en cours", "accompagnements en cours"), urgClients, this.AIDE_CLIENTS, "#/clients")}
          ${tuile("tb-t-prospects", "Prospects", prospects.length, pl(prospects.length, "compte gratuit", "comptes gratuits"), urgProspects, Commercial.AIDE, "#/prospects")}
        </div>
      </section>
      ${liste.length ? `<section class="panel" id="tb-a-traiter"><h2>À traiter maintenant</h2>
        <ul class="tb-liste">${liste.slice(0, this.MAX_LIGNES).map(ligne).join("")}</ul>
        ${reste > 0 ? `<p class="note" style="margin:10px 0 0">Et ${reste} autre${reste > 1 ? "s" : ""} : <a class="link-a" href="#/clients">Mes clients →</a> · <a class="link-a" href="#/prospects">Prospects →</a></p>` : ""}</section>` : ""}
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
    Nouveautes.compter(lignes);   // v51 : le badge de l'onglet Prospects (le panneau est sur la page Prospects)
  }
};
