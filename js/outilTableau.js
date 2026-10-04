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
   visite = un affichage du tableau de bord 30 min ou plus après le début de la précédente ; seule écriture de cette page,
   une fois par visite (un rechargement ou un retour au tableau de bord pendant la visite ne vide pas la liste et n'écrit
   rien). Le seuil est la date d'inscription la plus récente vue au début de la visite précédente (horloge du serveur :
   rien ne se perd entre la lecture et l'écriture, quelle que soit l'heure du téléphone du coach). Aucune visite
   enregistrée : les inscrits des 7 derniers jours.
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
     rang : 😞 0, note en chute 1, retour à lire 2, prospect signé 3, case « J'ai réservé » 4, absent à l'appel 5, clic 6,
     nouvel inscrit 7, autre urgence d'un client 8, bilan à conclure (coché depuis plus de 7 j) 9, « Perdu » à relancer 10.
     v59 : une table (plus un décalage du rang de la page Prospects, qui se déréglait avec les nouveaux motifs) ; les rappels
     de gestion (bilan à conclure, « Perdu » à relancer) passent après les urgences des clients ; à rang égal, un prospect
     le plus récemment actif d'abord (comme la page Prospects) */
  RANG_PROSPECTS: { signe: 3, case: 4, absent: 5, clic: 6, nouveau: 7, appel: 9, perdu: 10 },
  aTraiter(clients, prospects){
    const out = [];
    clients.forEach(l => {
      const al = l.alertes.filter(a => a.niveau === "mauvais" || a.type === "bilan_recu"); if (!al.length) return;
      const r = a => a.type === "avis_triste" ? 0 : a.type === "note_chute" ? 1 : a.type === "bilan_recu" ? 2 : 8;
      const a = al.slice().sort((x, y) => r(x) - r(y))[0];
      out.push({ rang: r(a), uid: l.p.id, nom: l.nom, texte: a.texte, cible: a.cible || "accueil", jours: l.jours || 0 });
    });
    prospects.forEach(x => { if (x.a.urgent) out.push({ rang: this.RANG_PROSPECTS[x.a.motif] != null ? this.RANG_PROSPECTS[x.a.motif] : 8, uid: x.l.p.id, nom: x.l.nom, texte: Commercial.motifTexte(x.a), cible: "accueil", prospect: true, jours: 0, recence: x.a.recence }); });
    return out.sort((a, b) => a.rang - b.rang || b.jours - a.jours || (a.recence || 0) - (b.recence || 0));
  },

  /* v72 (E) — la visite du coach */
  VISITE: { cle: "coach_visite", PAUSE: 30 * 60000, JOURS: 7, MAX: 10 },
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
  quand(iso){ const d = new Date(iso), p = n => String(n).padStart(2, "0"); return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " à " + p(d.getHours()) + ":" + p(d.getMinutes()); },
  nouveauxHTML(nouveaux, vis){
    const reste = nouveaux.length - this.VISITE.MAX;
    const ligne = l => { const pr = String((l.p && l.p.prenom) || "").trim() || Clients.nom(l.p);
      return `<li><span class="tb-quoi"><b data-notr>${esc(pr)}</b><small>inscrit le ${esc(this.quand(l.p.cree_le))}</small></span><span class="tb-nv-tel">${Telephone.coachHTML(l.tel)}</span></li>`; };
    return `<section class="panel" id="tb-nouveaux"><h2>Nouveaux depuis ta dernière visite</h2>
      <p class="note" style="margin:0 0 10px">${vis.depuis ? `Ta dernière visite : le ${esc(this.quand(vis.depuis))}.` : "Première visite enregistrée : les inscrits des 7 derniers jours."}</p>
      ${nouveaux.length ? `<ul class="tb-liste">${nouveaux.slice(0, this.VISITE.MAX).map(ligne).join("")}</ul>
        ${reste > 0 ? `<p class="note" style="margin:10px 0 0">Et ${reste} autre${reste > 1 ? "s" : ""} : <a class="link-a" href="#/prospects" data-tb-tous>Prospects →</a></p>` : ""}`
        : `<p class="empty" style="margin:0">Aucun nouvel inscrit depuis ta dernière visite.</p>`}</section>`;
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
    /* v72 (E) : la visite (décidée ici, au rendu : la clé du coach est dans contenus), puis les inscrits d'après elle */
    const moi = Auth.utilisateur() && Auth.utilisateur().id, t = Date.now(), futur = t + 5 * 60000;
    const V = this.visiteLue(moi && contenus[moi] ? contenus[moi][this.VISITE.cle] : null);
    const crees = (profils || []).map(p => p && this.iso(p.cree_le)).filter(x => x && Date.parse(x) <= futur).sort();
    const vis = this.visite(V, t, crees.length ? crees[crees.length - 1] : null);
    const borne = vis.seuil ? Date.parse(vis.seuil) : t - this.VISITE.JOURS * 86400000;
    const nouveaux = lignes.filter(l => l.p.statut === "prospect" && this.iso(l.p.cree_le) && Date.parse(l.p.cree_le) > borne && Date.parse(l.p.cree_le) <= futur)
      .sort((a, b) => Date.parse(b.p.cree_le) - Date.parse(a.p.cree_le));
    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Bonjour${prenom ? " " + esc(prenom) : ""}</h1>
        <p class="lede">${total ? `${total} ${pl(total, "urgence", "urgences")} aujourd'hui.` : "Rien d'urgent aujourd'hui."}</p>
      </header>
      ${this.nouveauxHTML(nouveaux, vis)}
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
    /* v72 (E) : « Et N autres » ouvre Prospects sur tous les prospects (le filtre « À traiter » cacherait les inscrits de plus de 48 h) */
    $$("[data-tb-tous]", zone).forEach(a => a.addEventListener("click", () => { outilProspects.filtre = "tous"; outilProspects.tri = "inscription"; }));
    /* v72 (E) : nouvelle visite : la seule écriture de cette page, une ligne du coach lui-même (règles de la base : le propriétaire),
       directe (pas de copie sur l'appareil ni d'« Enregistrement… » : rien que le coach ait saisi) ; ratée : la visite suivante
       repartira de l'ancienne */
    if (vis.nouvelle && moi && !Store.idConsulte){
      Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: [{ user_id: moi, outil: this.VISITE.cle, contenu: vis.nouvelle, maj_le: new Date(t).toISOString() }] }).catch(() => {});
    }
    Nouveautes.compter(lignes);   // v51 : le badge de l'onglet Prospects (le panneau est sur la page Prospects)
  }
};
