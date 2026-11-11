/* v104 (décision 10) : Commercial, MessageProspect, Nouveautes et Mesure sont dans js/clients-prospects-communs.js. */

/* ------------------------------------------------------------------
   OUTIL COACH — Prospects (v49 ; v53 chantier 4 : sans température ni score). Tous les comptes gratuits : date
   d'inscription, 3 réponses, bilan réservé, newsletter, dernière visite, jours actifs ; « À traiter » (même définition
   que le badge du tableau de bord), issues, relances, recherche, filtres, tri, export CSV, Nouveautés, compteur
   (inscrits → 3 questions → bilans réservés → clients) et la liste newsletter (export CSV).
   ------------------------------------------------------------------ */
const outilProspects = {
  id: "prospects",
  cle: null,
  nom: "Prospects",
  icone: "🎯",
  role: "coach",
  principal_coach: true,   // v83 (bloc 3) : la barre du bas du coach, Tableau · Clients · Prospects · Plus (décision 7 : la seule façon de passer de Clients à Prospects)
  court: "Prospects",
  sans_entete: true,
  titre: "Prospects",
  accroche: "",
  /* filtres (gardes le temps de la session), recherche, tri, pagination par 50, export CSV */
  /* v72 (E) : tri par défaut « inscription récente » (les plus récents en premier) ; « priorité » reste au choix */
  filtre: "a_traiter", periode: "tout", bilanF: "tout", newsF: "tout", tri: "inscription", recherche: "",
  PAS: 50, limite: 50, NL_PREMIERS: 10,
  donnees: null, lignes: [], tous: [], _nlDeplie: false,
  /* v83 (bloc 3) : en haut, la liste de la maquette ListeProspects (ListeCoach : nombre, recherche par nom, Tous · À traiter ·
     Archivés, « + », « Sélectionner », archivage). « Créer un accès » : #/prospects/nouveau (Acces). Les comptes archivés ne
     sont que dans « Archivés » de la liste.
     v84 (ménage du bloc 3) : l'écran d'avant, qui faisait doublon sous la liste, a quitté la page sans rien perdre. Sous la liste
     reste le panneau Nouveautés (avec « Tout marquer comme vu » ; v105 : le badge de l'onglet Prospects compte les urgences). Le reste, tel quel
     et avec les mêmes identifiants : « Suivi commercial » (outilSuiviCommercial, menu Plus : nombre de comptes gratuits et à
     traiter, compteur Inscrits → clients, chiffres des 30 jours, Mesure, filtres détaillés, cartes avec leurs boutons, export
     CSV) et « Newsletter » (outilNewsletter, menu Plus : la liste et son export). */
  html(){
    if (sousRoute === "nouveau") return Acces.html("prospects");
    /* v98 : Suivi commercial et Newsletter ont quitté le menu : leurs écrans d'avant s'ouvrent d'ici */
    /* v106 (lot 1) : Vue détaillée et Newsletter sont dans le menu « ⋯ » de la liste (ListeCoach.menuPoints) */
    return `<div id="pr-vue"><div id="lc-zone">${ListeCoach.attente("prospects")}</div></div>`;
  },
  /* garder = rechargement apres une action (carte, archivage) : le coach garde sa place (nombre de prospects affiches) */
  async init(garder){
    if (sousRoute === "nouveau") return Acces.init("prospects");
    return this.monter(garder, "liste");
  },
  /* v84 : vue = "liste" (page Prospects : la liste et les Nouveautés), "detail" (Suivi commercial) ou "newsletter" */
  async monter(garder, vue){
    const zone = $("pr-vue"); if (!zone) return;
    this.vue = vue;
    if (!garder && typeof Nouveautes !== "undefined") Nouveautes._deplie = false;
    if (!garder) this._nlDeplie = false;
    const t0 = new Date().toISOString();
    try { this.donnees = await Clients.charger(vue === "newsletter" ? { connexions: false } : undefined); }
    catch(e){
      if (!zone.isConnected) return;
      if (vue === "liste"){ zone.innerHTML = `<div id="lc-zone"></div><section class="panel"><div class="empty">Impossible de charger les prospects pour le moment.</div></section>`; ListeCoach.erreur(zone.querySelector("#lc-zone"), "prospects"); }
      else zone.innerHTML = `<section class="panel"><div class="empty">Impossible de charger les prospects pour le moment.</div></section>`;
      return;
    }
    if (!zone.isConnected) return;
    if (!garder) this.limite = this.PAS;
    this.tCharge = t0;
    if (vue === "detail"){ this.rendre(zone); ListeCoach.reprendre("suivi-commercial"); }
    else if (vue === "newsletter"){ this.preparer(); zone.innerHTML = `<div id="pr-newsletter"></div>`; this.monterNewsletter(zone.querySelector("#pr-newsletter")); ListeCoach.reprendre("newsletter"); }
    else this.rendreListe(zone);
    if (typeof Nouveautes !== "undefined") Nouveautes.urgences(this.tous);   // v105 : le badge = les urgences (Prospects, Suivi commercial, Newsletter)
  },
  /* v84 : la page Prospects — la liste, puis les Nouveautés */
  rendreListe(zone){
    this.preparer();
    zone.innerHTML = `<div id="lc-zone"></div><div id="pr-nouveautes"></div>`;
    ListeCoach.monter(zone.querySelector("#lc-zone"), "prospects", this.lignesListe(), { recharger: async () => { if (zone.isConnected) await this.monter(true, "liste"); } });   // v83 (bloc 3)
    if (typeof Nouveautes !== "undefined"){ Nouveautes.monter(zone.querySelector("#pr-nouveautes"), this.lignes, true, this.tCharge); }   // v105 : le badge = les urgences
  },
  /* chaque prospect : sa ligne (Clients.resumer) et son analyse (issue, prochaine action, à traiter) */
  preparer(){
    const { profils, parClient, contenus, connexions } = this.donnees;
    this.lignes = Clients.resumer(profils, parClient, contenus, connexions);
    /* v83 : avecArchives = la liste du haut (son filtre « Archivés ») ; tous = le reste de la page, sans les comptes archivés */
    this.avecArchives = this.lignes.filter(l => l.p.statut === "prospect").map(l => ({ l, a: Commercial.analyseLigne(l) })).filter(x => x.a);
    this.tous = this.avecArchives.filter(x => !x.l.archive);
  },
  /* v83 : les lignes de la liste du haut — la raison : le motif « à traiter », sinon l'inscription (et les relances) ; à droite,
     l'issue de l'appel (SIGNÉ / PERDU / ABSENT) et « bilan réservé » ; triées comme la page (inscription récente d'abord) */
  lignesListe(){
    /* v84 : toujours « inscription récente d'abord » (le tri choisi dans le Suivi commercial ne change pas l'ordre de la liste) */
    const tri = this.tri; this.tri = "inscription";
    let liste; try { liste = this.trier(this.avecArchives); } finally { this.tri = tri; }
    return liste.map(({ l, a }) => {
      const pastilles = Commercial.pastille(a) + Commercial.pastilleBilan(a.bilan, a) + (a.illisible ? '<span class="pastille attention">données illisibles</span>' : "");
      return { uid: l.p.id, nom: Clients.nom(l.p), archive: !!l.archive, niveau: a.urgent ? "accent" : "",   // maquette : point doré « à traiter »
        raison: a.urgent ? Commercial.motifTexte(a) : Commercial.sousTitre(l.p, a), droite: pastilles ? `<span class="lc-pastilles">${pastilles}</span>` : "", a_traiter: !!a.urgent };
    });
  },
  norm(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); },
  statutOk(x, f){ return f === "tous" ? true : f === "a_traiter" ? x.a.urgent : f === "issues" ? !!x.a.issue : true; },
  passe(x){
    if (!this.statutOk(x, this.filtre)) return false;
    const h = x.a.inscritHeures;
    if (this.periode !== "tout"){ const lim = { "24h": 24, "7j": 168, "30j": 720 }[this.periode]; if (!(h != null && h < lim)) return false; }
    if (this.bilanF === "oui" && !x.a.reserve) return false;
    if (this.bilanF === "non" && x.a.reserve) return false;
    const nl = !!(x.l.newsletter && x.l.newsletter.oui);
    if (this.newsF === "oui" && !nl) return false;
    if (this.newsF === "non" && nl) return false;
    const q = this.norm(this.recherche);
    if (q){ const dc = x.l.dc || {}; if ((this.norm(Clients.nom(x.l.p)) + " " + this.norm(dc.email)).indexOf(q) === -1) return false; }
    return true;
  },
  trier(liste){
    const t = v => { const x = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(x) ? 0 : x; };
    const visite = x => { const v = x.l.visites; return v && v.derniere ? t(v.derniere) : 0; };
    /* v72 (E) : une date d'inscription dans le futur (le profil est modifiable par son compte) va en dernier ; à date égale, la priorité */
    const insc = x => { const v = t(x.l.p.cree_le); return v > Date.now() + 5 * 60000 ? 0 : v; };
    const cmp = this.tri === "inscription" ? (x, y) => insc(y) - insc(x) || x.a.rang - y.a.rang || x.a.recence - y.a.recence
              : this.tri === "visite" ? (x, y) => visite(y) - visite(x) || x.a.rang - y.a.rang
              : (x, y) => x.a.rang - y.a.rang || x.a.recence - y.a.recence;
    return liste.slice().sort(cmp);
  },
  rendre(zone){
    this.preparer();
    const tous = this.tous;
    /* issues des 30 derniers jours, clients compris (un prospect signe puis passe client reste compte) */
    const mois = this.lignes.map(l => Commercial.suivi(l.suivi)).filter(S => typeof S.issue === "string" && Commercial.depuis(S.issue_le) != null && Commercial.depuis(S.issue_le) <= 30);
    const cmpt = k => mois.filter(S => S.issue === k).length, pl = (k, sg, p) => k > 1 ? p : sg;
    const K = Commercial.compteur(this.lignes);
    const tuile = (lbl, val, sub, cls) => `<div class="tile"><div class="t-lbl">${lbl}</div><div class="t-val readout${cls ? " " + cls : ""}">${val}</div><div class="t-sub">${sub}</div></div>`;
    const opt = (v, t, cur) => `<option value="${v}"${v === cur ? " selected" : ""}>${esc(t)}</option>`;
    const aTraiter = tous.filter(x => x.a.urgent).length;
    /* v84 : le Suivi commercial (menu Plus) — l'écran d'avant de la page Prospects, sans la liste du haut (elle reste sur la page
       Prospects), sans les Nouveautés (sous la liste) ni la newsletter (son écran à part) */
    zone.innerHTML = `
      <header class="masthead pr-detail">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Suivi commercial</h1>
        <p class="lede">${tous.length ? `${tous.length} ${pl(tous.length, "compte gratuit", "comptes gratuits")} · ${aTraiter} à traiter` : "Aucun prospect pour l'instant."}</p>
        <p class="note pr-compteur" id="pr-compteur" title="Inscrits : les prospects et les clients passés par l'inscription gratuite. Bilans réservés : ta coche « Bilan réservé », sinon la case « J'ai réservé » du prospect.">Inscrits <b>${K.inscrits}</b> → 3 questions remplies <b>${K.questions}</b> → bilans réservés <b>${K.bilans}</b> → clients <b>${K.clients}</b></p>
      </header>
      <section class="panel"><div class="tiles">
        ${tuile("À traiter", aTraiter, "une action à faire", aTraiter ? "neg" : "")}
        ${tuile("Signés", cmpt("signe"), "30 derniers jours", "pos")}
        ${tuile("Perdus", cmpt("perdu"), "30 derniers jours")}
        ${tuile("Absents", cmpt("absent"), "30 derniers jours")}
      </div></section>
      <section class="panel" id="pr-mesure"></section>
      <section class="panel">
        <div class="seg sc-filtres" role="group" aria-label="Filtrer">${[["a_traiter", "À traiter"], ["issues", "Appel fait"], ["tous", "Tous"]].map(f => `<button type="button" data-filtre="${f[0]}" aria-pressed="${this.filtre === f[0]}">${esc(f[1])} <span class="meta">${tous.filter(x => this.statutOk(x, f[0])).length}</span></button>`).join("")}</div>
        <div class="pr-outils">
          <input type="search" id="pr-q" placeholder="Rechercher un nom ou un email" aria-label="Rechercher un prospect par nom ou email" value="${esc(this.recherche)}" autocomplete="off">
          <select id="pr-periode" aria-label="Date d'inscription">${opt("tout", "Inscrits : tous", this.periode)}${opt("24h", "Inscrits : 24 dernières heures", this.periode)}${opt("7j", "Inscrits : 7 derniers jours", this.periode)}${opt("30j", "Inscrits : 30 derniers jours", this.periode)}</select>
          <select id="pr-bilan" aria-label="Bilan réservé">${opt("tout", "Bilan : tous", this.bilanF)}${opt("oui", "Bilan réservé", this.bilanF)}${opt("non", "Bilan pas réservé", this.bilanF)}</select>
          <select id="pr-news" aria-label="Newsletter">${opt("tout", "Newsletter : tous", this.newsF)}${opt("oui", "Newsletter : oui", this.newsF)}${opt("non", "Newsletter : non", this.newsF)}</select>
          <select id="pr-tri" aria-label="Trier">${opt("priorite", "Tri : priorité", this.tri)}${opt("inscription", "Tri : inscription récente", this.tri)}${opt("visite", "Tri : dernière visite", this.tri)}</select>
          <button type="button" class="btn ghost petit" id="pr-csv">Exporter (CSV)</button>
        </div>
        <p class="note" id="pr-compte" role="status" aria-live="polite" style="margin:4px 0 10px"></p>
        <div id="pr-liste"></div>
        <p class="note" style="margin:12px 0 0">${esc(Commercial.AIDE)} « Bilan réservé » : ta coche, dans sa fiche (sans coche de ta part, la case « J'ai réservé » du prospect compte, à vérifier). « Dernière visite » et « Jours actifs » : les jours où il a ouvert l'app. « Connexions » : le nombre de jours où il a ouvert l'app connecté (une fois par jour au plus, depuis la mise en place du compteur) ; « Dernière connexion » : la date et l'heure de sa dernière ouverture.</p>
      </section>`;
    $$("[data-filtre]", zone).forEach(b => b.addEventListener("click", () => {
      this.filtre = b.dataset.filtre; this.limite = this.PAS;
      $$("[data-filtre]", zone).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      this.majListe(zone);
    }));
    const q = zone.querySelector("#pr-q"); let minuteur = null;
    if (q) q.addEventListener("input", () => { clearTimeout(minuteur); minuteur = setTimeout(() => { this.recherche = q.value.slice(0, 120); this.limite = this.PAS; this.majListe(zone); }, 200); });
    [["#pr-periode", "periode"], ["#pr-bilan", "bilanF"], ["#pr-news", "newsF"], ["#pr-tri", "tri"]].forEach(([sel, k]) => {
      const el = zone.querySelector(sel); if (el) el.addEventListener("change", () => { this[k] = el.value; this.limite = this.PAS; this.majListe(zone); });
    });
    const csv = zone.querySelector("#pr-csv");
    if (csv) csv.addEventListener("click", () => {
      const liste = this.trier(this.tous.filter(x => this.passe(x)));
      if (!liste.length){ UI.toast("Aucun prospect à exporter avec ces filtres.", "attention"); return; }
      telecharger("prospects-" + aujourdhui() + ".csv", this.csv(liste), "text/csv;charset=utf-8");
      UI.toast(liste.length + " prospect" + (liste.length > 1 ? "s" : "") + " exporté" + (liste.length > 1 ? "s" : "") + ".", "ok");
    });
    this.majListe(zone);
    Mesure.monter(zone.querySelector("#pr-mesure"), this.lignes);   // v62 (brief V2, L)
  },
  /* la liste seule (les filtres ne redessinent pas la recherche : le curseur y reste) */
  majListe(zone){
    const boite = zone.querySelector("#pr-liste"), compte = zone.querySelector("#pr-compte"); if (!boite) return;
    const liste = this.trier(this.tous.filter(x => this.passe(x)));
    const vus = liste.slice(0, this.limite);
    if (compte) compte.textContent = liste.length === this.tous.length ? liste.length + " prospect" + (liste.length > 1 ? "s" : "") : liste.length + " sur " + this.tous.length + " prospect" + (this.tous.length > 1 ? "s" : "");
    boite.innerHTML = vus.length
      ? `<div class="sc-liste">${vus.map(x => Commercial.carteHTML(x.l, x.a)).join("")}</div>`
        + (liste.length > vus.length ? `<div class="actions pr-plus"><button type="button" class="btn ghost" id="pr-plus">Afficher ${Math.min(this.PAS, liste.length - vus.length)} de plus (${liste.length - vus.length} restant${liste.length - vus.length > 1 ? "s" : ""})</button></div>` : "")
      : `<div class="empty">${this.filtre === "a_traiter" && !this.recherche && this.periode === "tout" && this.bilanF === "tout" && this.newsF === "tout" ? "Rien à faire aujourd'hui : aucun prospect n'attend d'action de ta part." : "Aucun prospect ne correspond à ces filtres."}</div>`;
    const plus = boite.querySelector("#pr-plus");
    if (plus) plus.addEventListener("click", () => { this.limite += this.PAS; this.majListe(zone); });
    Commercial.brancher(boite, async () => { if (!zone.isConnected) return; const y = window.scrollY; await this.monter(true, "detail"); if (zone.isConnected) window.scrollTo(0, y); });
  },
  /* une cellule CSV : point-virgule, UTF-8 avec BOM (s'ouvre tel quel dans Excel en français). Une cellule qui commence
     par = + - @ (ou une tabulation, un retour) est neutralisée (apostrophe) : un prénom piégé ne devient jamais une
     formule dans le tableur. v59 : aussi = + - @ précédé d'espaces (certains tableurs retirent les espaces du début avant
     de lire une formule, ex. un email « ␣␣=HYPERLINK(…) »). Le même format pour les deux exports (prospects, newsletter). */
  csvDe(tete, lignes){
    const cell = v => { let s = v == null ? "" : String(v); if (/^[\t\r]|^\s*[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    return "﻿" + [tete].concat(lignes).map(ligne => ligne.map(cell).join(";")).join("\r\n") + "\r\n";
  },
  dateCsv(v){ return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : ""; },
  /* export CSV des prospects filtrés (v53 : colonnes à jour, sans statut ni score ; v59 : « Bilan réservé » et sa date
     suivent l'analyse, comme la carte : « oui », « à vérifier (case du prospect) », sinon « oui, avant l'appel » ou « case du
     prospect, avant l'appel ») */
  /* v65 : « Clics « Récupérer mon plan d'action » » (avant : « Clics « Réserver mon bilan » ») : même place (14e colonne), même
     contenu (le nombre de clics) ; aucun fichier du dépôt ne lit cet en-tête. v76 (décision de Lucas du 11/10) : « Clics « Réserver
     mon plan d'action » », comme le motif d'un clic (MOTIFS.clic) et le bouton du prospect */
  TETE_CSV: ["Nom", "Email", "Inscrit le", "Problème", "Ce qui l'a bloqué", "Dans 3 mois", "Questionnaire", "Bilan réservé", "Bilan réservé le", "Case « J'ai réservé » (prospect)", "Newsletter", "Dernière visite", "Jours actifs (30 j)", "Clics « Réserver mon plan d'action »", "Dernier clic", "Issue", "Relances", "Prochaine action"],
  csv(liste){
    const dt = v => this.dateCsv(v);
    const lignes = liste.map(({ l, a }) => {
      const dc = l.dc || {}, B = a.bilan || {}, v = l.visites; let r = null; try { r = Decouverte.resume(l.p, l.ch, dc); } catch(e){ r = null; }
      const q = a.questionnaire ? "rempli le " + dt(dc.court_le) : (dc.repondues || 0) + "/" + (dc.nb_questions || (CONFIG.decouverte.questions || []).length) + " réponses";
      return [Clients.nom(l.p), dc.email || "", dt(l.p.cree_le), dc.probleme || "", dc.ancien ? "" : (dc.obstacle || ""), dc.projection || "", q,
              a.coche ? "oui" : a.caseAVerifier ? "à vérifier (case du prospect)" : B.coach ? "oui, avant l'appel" : B.source === "prospect" ? "case du prospect, avant l'appel" : "non",
              dt(a.coche || a.caseAVerifier || B.le || ""), B.case ? dt(B.case) : "",
              l.newsletter && l.newsletter.oui ? "oui" : "non", v && v.suivi ? (v.derniere ? dt(v.derniere) : "aucune") : "", v && v.suivi ? v.jours30 : "",
              r ? r.clics : 0, r ? dt(r.dernierClic) : "", a.issue ? Commercial.ISSUES[a.issue] : "", a.relances, a.action];
    });
    return this.csvDe(this.TETE_CSV, lignes);
  },
  /* v53 (chantier 2, §2) — LA LISTE NEWSLETTER : toutes les personnes (prospects et clients) dont l'accord newsletter est
     actif (clé emails.newsletter === true, Accords.newsletterCoach ; un retrait dans le Profil l'enlève ; l'ancien accord
     « emails de suivi » ne compte jamais), avec prénom, nom, email (email du compte copié par l'app, sinon celui du
     questionnaire) et date de l'accord ; les plus récents d'abord. Lecture seule. */
  newsletter(lignes){
    const t = v => { const x = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(x) ? 0 : x; };
    return (lignes || []).filter(l => l && l.p && l.newsletter && l.newsletter.oui)
      .map(l => ({ uid: l.p.id, prenom: String(l.p.prenom || "").trim(), nom: String(l.p.nom || "").trim(), email: (l.dc && l.dc.email) || "", depuis: l.newsletter.depuis || "", statut: l.p.statut === "prospect" ? "prospect" : "client" }))
      .sort((a, b) => t(b.depuis) - t(a.depuis) || (a.prenom + a.nom).localeCompare(b.prenom + b.nom, "fr"));
  },
  csvNewsletter(liste){ return this.csvDe(["Prénom", "Nom", "Email", "Date de l'accord"], liste.map(x => [x.prenom, x.nom, x.email, this.dateCsv(x.depuis)])); },
  monterNewsletter(boite){
    if (!boite) return;
    const liste = this.newsletter(this.lignes), n = liste.length;
    const li = x => `<li data-nl="${esc(x.uid)}"><span class="nv-txt"><b>${esc(((x.prenom + " " + x.nom).trim()) || Clients.SANS_NOM)}</b>${x.email ? " · " + esc(x.email) : " · email inconnu"}${x.statut === "client" ? ` <span class="pastille">client</span>` : ""}</span> <time${x.depuis ? ` datetime="${esc(x.depuis)}"` : ""}>${x.depuis ? "depuis le " + esc(this.dateCsv(x.depuis)) : "date inconnue"}</time></li>`;
    const reste = n - this.NL_PREMIERS;
    boite.innerHTML = `<section class="panel" id="pr-nl"><div class="seance-c-tete"><h2>Newsletter</h2><span class="pastille" id="pr-nl-n">${n}</span></div>
      <p class="note" style="margin:0 0 10px">${n ? `${n} personne${n > 1 ? "s ont" : " a"} accepté la newsletter (prospects et clients). Une personne qui retire son accord dans son Profil disparaît de la liste. L'app n'envoie aucun email : exporte la liste pour ton outil d'envoi.` : "Personne n'a encore accepté la newsletter."}</p>
      ${n ? `<ul class="nv-liste" id="pr-nl-liste">${liste.slice(0, this.NL_PREMIERS).map(li).join("")}</ul>
        ${reste > 0 ? `<ul class="nv-liste nl-suite"${this._nlDeplie ? "" : " hidden"}>${liste.slice(this.NL_PREMIERS).map(li).join("")}</ul>${this._nlDeplie ? "" : `<p style="margin:8px 0 0"><button type="button" class="btn ghost petit" id="pr-nl-plus">Voir ${reste > 1 ? "les " + reste + " autres" : "l'autre"}</button></p>`}` : ""}
        <div class="actions"><button type="button" class="btn ghost petit" id="pr-nl-csv">Exporter la liste (CSV)</button></div>` : ""}</section>`;
    const plus = boite.querySelector("#pr-nl-plus");
    if (plus) plus.addEventListener("click", () => { this._nlDeplie = true; $$(".nl-suite", boite).forEach(x => { x.hidden = false; }); plus.parentNode.remove(); });
    const bc = boite.querySelector("#pr-nl-csv");
    if (bc) bc.addEventListener("click", () => {
      const l = this.newsletter(this.lignes);
      if (!l.length){ UI.toast("Personne à exporter.", "attention"); return; }
      telecharger("newsletter-" + aujourdhui() + ".csv", this.csvNewsletter(l), "text/csv;charset=utf-8");
      UI.toast(l.length + " personne" + (l.length > 1 ? "s" : "") + " exportée" + (l.length > 1 ? "s" : "") + ".", "ok");
    });
  }
};

/* ------------------------------------------------------------------
   v84 (ménage du bloc 3) — SUIVI COMMERCIAL (menu Plus) : l'écran d'avant de la page Prospects, déplacé tel quel (nombre de
   comptes gratuits et à traiter, compteur Inscrits → 3 questions → bilans → clients, tuiles À traiter / Signés / Perdus /
   Absents des 30 jours, Mesure, filtres détaillés — À traiter, Appel fait, Tous, recherche nom ou email, période, bilan,
   newsletter, tri —, cartes avec leurs boutons, export CSV) ; mêmes identifiants (#pr-vue, #pr-liste, #pr-csv…). Les
   statistiques comptent toujours les archivés (décision de Lucas) ; les cartes et l'export, comme avant, sans eux.
   ------------------------------------------------------------------ */
const outilSuiviCommercial = {
  id: "suivi-commercial",
  cle: null,
  nom: "Suivi commercial",
  icone: "📈",
  role: "coach",
  sans_entete: true,
  titre: "Vue détaillée",   // v106 (lot 1) : le nom du lien qui y mène (menu « ⋯ » de Prospects)
  accroche: "",
  html(){ return `<div id="pr-vue"><section class="panel">${squelette()}</section></div>`; },
  init(){ return outilProspects.monter(false, "detail"); }
};

/* ------------------------------------------------------------------
   v84 (ménage du bloc 3) — NEWSLETTER (menu Plus) : la liste newsletter qui était en bas de la page Prospects, déplacée telle
   quelle (prospects et clients qui ont accepté, archivés compris : l'accord de la personne ne change pas ; export CSV) ;
   mêmes identifiants (#pr-nl, #pr-nl-csv…).
   ------------------------------------------------------------------ */
const outilNewsletter = {
  id: "newsletter",
  cle: null,
  nom: "Newsletter",
  icone: "✉️",
  role: "coach",
  titre: "Newsletter",
  accroche: "Les personnes qui ont accepté la newsletter, à exporter pour ton outil d'envoi.",
  html(){ return `<div id="pr-vue"><section class="panel">${squelette()}</section></div>`; },
  init(){ return outilProspects.monter(false, "newsletter"); }
};
