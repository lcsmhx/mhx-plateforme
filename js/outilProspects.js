/* ------------------------------------------------------------------
   SUIVI COMMERCIAL (v49 ; v53 chantier 4 : sans température ni score). Pour chaque prospect : ce qu'il a fait dans
   l'app (inscription, ses 3 réponses, clics « Réserver mon bilan », case « J'ai réservé »), la prochaine action, ce
   qui est « à traiter » (définition simple, la même que le badge du tableau de bord : voir analyse), et ce que le
   coach enregistre : « Bilan réservé » (sa coche, un clic dans la fiche), l'issue de l'appel (Signé, Perdu, Absent)
   et ses relances. Clé coach-seul « suivi_prospect » (jamais lisible par le prospect, règles de la base), écriture
   conditionnelle (CleCoach). Rien n'est calculé à l'avance ni stocké en plus. Seuils : CONFIG.suivi.
   ------------------------------------------------------------------ */
const Commercial = {
  cle: "suivi_prospect",
  ISSUES: { signe: "Signé", perdu: "Perdu", absent: "Absent" },
  ETATS: { signe: "SIGNÉ", perdu: "PERDU", absent: "ABSENT" },   // v53 : les pastilles d'issue seulement
  cfg(){ return Object.assign({ urgence_heures: 48, clic_recent_jours: 3, relance_attente_jours: 3, perdu_relance_jours: 30, relances_max: 3, retour_jours: 14, appel_jours: 7 }, CONFIG.suivi || {}); },
  /* jours ecoules depuis une date ou un instant (calendrier local) ; null si illisible */
  depuis(v){
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
    let j = v.slice(0, 10);
    if (v.length > 10){ const d = new Date(v); if (isNaN(d)) return null; j = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    const n = Decouverte.joursEcoules(j);
    return n == null ? null : Math.max(0, n);
  },
  quand(n){ return n == null ? "à une date inconnue" : n === 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " jours"; },
  suivi(S){ return (S && typeof S === "object" && !Array.isArray(S)) ? S : {}; },
  instant(v){ const x = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(x) ? null : x; },
  /* v53 (chantier 4) — « Bilan réservé ». La coche du coach (suivi_prospect.bilan_le = instant ou null, et un événement
     historique { type: "bilan", valeur: "reserve" | "annule", le } à chaque coche ou retrait) fait foi dès qu'il a
     décidé : cochée → réservé ; retirée → pas réservé, même si le prospect a coché sa case. Tant que le coach n'a jamais
     décidé, la case « J'ai réservé mon bilan » du prospect (challenge.reserve) compte encore (source « prospect » : à
     vérifier) ; elle reste toujours lisible comme info. Tous les lecteurs de « réservé » passent par ici (page Prospects,
     filtres, CSV, fiche, Mes clients, Nouveautés, compteur, prochaine action).
     Ancien client redevenu prospect (client_le) : une coche ou une case d'avant son passage en client ne compte plus.
     → { reserve, le (instant retenu), coach (instant de la coche ou null), decide, retire (dernier retrait, s'il n'est
         pas recoché), case (case du prospect retenue), source: "coach" | "prospect" | null } */
  bilan(S, C, p){
    S = this.suivi(S);
    const t = v => this.instant(v);
    const tClient = p && p.statut === "prospect" ? t(S.client_le) : null;
    const garde = v => typeof v === "string" && t(v) != null && (tClient == null || t(v) > tClient);
    const hist = (Array.isArray(S.historique) ? S.historique : []).filter(e => e && typeof e === "object" && e.type === "bilan" && garde(e.le));
    const coche = garde(S.bilan_le) ? S.bilan_le : null;
    const decide = !!coche || hist.length > 0 || (tClient == null && Object.prototype.hasOwnProperty.call(S, "bilan_le"));
    const retire = coche ? null : (hist.filter(e => e.valeur === "annule").map(e => e.le).sort().pop() || null);
    const cs = Decouverte.reserve(C), caseP = garde(cs) ? cs : null;
    const parCase = !decide && !!caseP;
    return { reserve: !!coche || parCase, le: coche || (parCase ? caseP : null), coach: coche, decide, retire, case: caseP, source: coche ? "coach" : parCase ? "prospect" : null };
  },
  bilanLigne(l){ try { return this.bilan(l && l.suivi, l && l.ch, l && l.p); } catch(e){ return { reserve: false, le: null, coach: null, decide: false, retire: null, case: null, source: null }; } },
  /* ce qui le rend « à traiter » (texte court : tableau de bord, cartes) */
  MOTIFS: { signe: "Signé : à passer client", case: "A coché « J'ai réservé » : à vérifier", clic: "A cliqué « Réserver mon bilan », pas de bilan coché", nouveau: "Vient de s'inscrire" },
  AIDE: "À traiter : les prospects inscrits depuis moins de 48 h, et ceux qui ont cliqué « Réserver mon bilan » ou coché « J'ai réservé », tant que tu n'as ni coché « Bilan réservé », ni indiqué l'issue de l'appel, ni relancé depuis ; et les « Signé » à passer client.",
  /* p = profil (cree_le, statut), C = cle « challenge » (clics « Réserver mon bilan », case « J'ai réservé »),
     S = suivi_prospect, activite = derniere saisie du prospect (une visite, cle activite, compte), D = son questionnaire.
     → { etat (issue ou "en_cours"), issue, raisons[], action, urgent, motif (signe | case | clic | nouveau), rang, recence,
         jour, questionnaire, reserve, bilan (Commercial.bilan), clics, relances, derniereRelance, inscritHeures }
     « À traiter » (urgent), sans température : « Signé » et toujours prospect (30 jours au plus) ; sinon, sans issue et
     sans bilan coché par le coach : la case « J'ai réservé » du prospect (à vérifier), un clic « Réserver mon bilan »
     sans relance depuis, ou une inscription de moins de CONFIG.suivi.urgence_heures (48 h) sans relance. */
  analyse(p, C, S, activite, D){
    const cfg = this.cfg(); S = this.suivi(S);
    let r = null; try { r = Decouverte.resume(p, C, D); } catch(e){ r = null; }
    const fait = !!(r && r.questionnaire), jour = r ? r.jour : null;
    const instant = v => this.instant(v);
    /* une activite datee de plus de 12 h dans le futur (horloge du prospect en avance) est traitee comme inconnue :
       sinon il paraitrait actif a jamais et les relances ne compteraient jamais comme restees sans reponse */
    const futur = instant(activite) != null && instant(activite) > Date.now() + 12 * 3600000;
    const actif = futur ? null : this.depuis(activite);
    const clics = r ? r.clics : 0, clic = r && r.dernierClic ? this.depuis(r.dernierClic) : null;
    const relances = Array.isArray(S.relances) ? S.relances.filter(x => instant(x) != null) : [];
    const relance = relances.length ? this.depuis(relances[relances.length - 1]) : null;
    const tAct0 = futur ? null : instant(activite), tAct = tAct0 == null ? null : Math.min(tAct0, Date.now());   // quelques heures d'avance : ramenee a maintenant
    /* relances restees sans reponse : faites apres la derniere activite du prospect */
    const sansReponse = relances.filter(x => tAct == null || instant(x) > tAct).length;
    let issue = (typeof S.issue === "string" && Object.prototype.hasOwnProperty.call(this.ISSUES, S.issue)) ? S.issue : null;   // une valeur piegee (objet) ne fait rien tomber
    const tIssue = issue ? instant(S.issue_le) : null, issueDepuis = issue ? this.depuis(S.issue_le) : null;
    /* « Signé » puis passé client, puis repassé prospect (fin d'accompagnement) : ce n'est plus un signé a traiter
       (seulement si le passage en client est POSTERIEUR a la signature : un ancien client qui re-signe reste « Signé ») */
    const tClient = instant(S.client_le);
    const ancienClient = issue === "signe" && p && p.statut === "prospect" && tClient != null && tIssue != null && tClient > tIssue;
    if (ancienClient) issue = null;
    const B = this.bilan(S, C, p), reserve = B.reserve;
    const relancesApresIssue = tIssue != null ? relances.filter(x => instant(x) > tIssue).length : 0;
    /* « Perdu » ou « Absent », puis il reclique « Réserver » ou son bilan redevient réservé : il revient dans la course */
    const revenu = (issue === "perdu" || issue === "absent") && tIssue != null && ((!!r && !!r.dernierClic && instant(r.dernierClic) > tIssue && clic != null && clic <= cfg.clic_recent_jours) || (reserve && instant(B.le) > tIssue && this.depuis(B.le) != null && this.depuis(B.le) <= cfg.retour_jours));
    const tInscrit = instant(p && p.cree_le), heures = tInscrit == null ? null : Math.max(0, (Date.now() - tInscrit) / 3600000);
    const commence = D && typeof D.repondues === "number" && isFinite(D.repondues) ? Math.floor(D.repondues) : Decouverte.repondues(D);
    const total = (D && typeof D.nb_questions === "number" && D.nb_questions > 0 ? Math.floor(D.nb_questions) : Decouverte.liste(D).length) || 3;
    const depuisH = heures == null ? "" : heures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(heures) + " h";
    /* les faits, en clair (fiche : « Suivi commercial ») */
    const raisons = [];
    if (issue && revenu) raisons.push("Revenu après l'issue « " + this.ISSUES[issue] + " » : a recliqué « Réserver » ou son bilan est de nouveau réservé.");
    else if (issue) raisons.push("Appel : « " + this.ISSUES[issue] + " » " + this.quand(issueDepuis) + (typeof S.note === "string" && S.note ? " — " + S.note : "") + ".");
    if (ancienClient) raisons.push("Ancien client (« Signé » " + this.quand(this.depuis(S.issue_le)) + "), redevenu prospect.");
    if (B.coach) raisons.push("Bilan réservé : coché par toi " + this.quand(this.depuis(B.coach)) + ".");
    else if (B.source === "prospect") raisons.push("A coché « J'ai réservé mon bilan » " + this.quand(this.depuis(B.case)) + " : pas encore vérifié par toi.");
    else if (B.retire) raisons.push("« Bilan réservé » retiré par toi " + this.quand(this.depuis(B.retire)) + ".");
    raisons.push("Inscrit " + (heures != null && heures < 24 ? depuisH : this.quand(this.depuis(p && p.cree_le))) + (fait ? ", questionnaire rempli " + this.quand(this.depuis(r.questionnaire)) : commence > 0 ? ", questionnaire commencé (" + commence + "/" + total + " réponses)" : ", questionnaire pas encore rempli") + ".");
    if (clics) raisons.push("A cliqué « Réserver mon bilan » (" + clics + " fois), la dernière " + this.quand(clic) + ".");
    if (sansReponse) raisons.push("Relancé " + sansReponse + " fois sans réponse.");
    if (revenu) issue = null;   // il est de nouveau « en cours »
    /* à traiter : la définition simple (voir plus haut) */
    const relanceApres = t0 => t0 != null && relances.some(x => instant(x) > t0);
    const tClic = r && r.dernierClic ? instant(r.dernierClic) : null;
    const clicAtraiter = clics > 0 && tClic != null && !(p && p.statut === "prospect" && tClient != null && tClic <= tClient) && !relanceApres(tClic);
    let motif = null;
    if (issue === "signe"){ if (p && p.statut === "prospect" && !(issueDepuis != null && issueDepuis > 30)) motif = "signe"; }
    else if (!issue && !B.coach){
      if (B.source === "prospect") motif = "case";
      else if (clicAtraiter) motif = "clic";
      else if (heures != null && heures < cfg.urgence_heures && !relances.length) motif = "nouveau";
    }
    const attendre = relance != null && relance < cfg.relance_attente_jours;
    const epuise = sansReponse >= cfg.relances_max;
    const siPasRelance = texte => attendre ? "Relancé " + this.quand(relance) + " : attends sa réponse."
      : epuise ? "Sans réponse après " + sansReponse + " relances : classe-le « Perdu », ou attends qu'il revienne." : texte;
    let action;
    if (issue === "signe"){
      if (!(p && p.statut === "prospect")) action = "C'est désormais un client.";
      else if (issueDepuis != null && issueDepuis > 30) action = "« Signé » " + this.quand(issueDepuis) + " et toujours prospect : passe-le client, ou retire l'issue s'il a arrêté.";   // oublie : rappel garde, non urgent
      else action = "Passe-le client pour lui ouvrir son espace d'accompagnement.";
    }
    else if (issue === "absent") action = relancesApresIssue >= cfg.relances_max ? "Absent, puis relancé " + relancesApresIssue + " fois sans suite : classe-le « Perdu » ?" : siPasRelance("Absent à l'appel : repropose-lui un créneau en DM.");
    else if (issue === "perdu"){ const reste = cfg.perdu_relance_jours - (issueDepuis || 0); action = relancesApresIssue >= 1 ? "Relancé après l'appel : s'il ne répond pas, laisse-le." : reste <= 0 ? siPasRelance("Relance-le : l'appel date d'il y a " + issueDepuis + " jours.") : "Relance prévue dans " + reste + " jour" + (reste > 1 ? "s" : "") + "."; }
    else if (B.coach){ const dr = this.depuis(B.coach); action = dr != null && dr > cfg.appel_jours ? "Bilan réservé " + this.quand(dr) + " : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent." : "Prépare le bilan : relis sa fiche (ses 3 réponses). Après l'appel, indique Signé, Perdu ou Absent."; }
    else if (B.source === "prospect") action = "Il a coché « J'ai réservé » " + this.quand(this.depuis(B.case)) + " : vérifie ton agenda, puis coche « Bilan réservé » dans sa fiche (ou retire-le).";
    else if (ancienClient) action = "Ancien client redevenu prospect : reprends contact si tu veux lui proposer de reprendre.";
    else if (clics) action = siPasRelance("DM : il a cliqué « Réserver mon bilan » sans réserver, demande-lui ce qui le retient.");
    else if (heures != null && heures < cfg.urgence_heures) action = siPasRelance("Il vient de s'inscrire : envoie-lui un DM de bienvenue.");
    else if (!fait) action = siPasRelance("DM : aide-le à répondre à ses 3 questions (1 minute).");
    else action = siPasRelance("Propose-lui le bilan en DM quand tu le sens prêt.");
    const RANG = { signe: 0, case: 1, clic: 2, nouveau: 3 };
    const rang = motif ? RANG[motif] : B.coach ? 4 : issue === "absent" ? 5 : issue === "perdu" ? 6 : issue === "signe" ? 8 : 7;
    /* recence : a rang egal, le plus recemment actif d'abord (on lui ecrit pendant qu'il est dans le coup) */
    return { etat: issue || "en_cours", issue, raisons, action, urgent: !!motif, motif, rang, recence: actif == null ? 9999 : actif, jour, questionnaire: fait, reserve, bilan: B, clics, relances: relances.length, derniereRelance: relance, inscritHeures: heures };
  },
  analyseLigne(l){ try { return this.analyse(l.p, l.ch, l.suivi, l.activite, l.dc); } catch(e){ console.warn("[MHX] suivi commercial illisible", e); return null; } },
  /* le motif « à traiter » en clair (tableau de bord) */
  motifTexte(a){
    if (!a || !a.motif) return "";
    if (a.motif === "nouveau") return "Inscrit " + (a.inscritHeures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(a.inscritHeures) + " h") + " : DM de bienvenue";
    return this.MOTIFS[a.motif] || "";
  },
  /* v53 (chantier 4) — le compteur : inscrits → 3 questions remplies → bilans réservés (coche du coach, sinon case du
     prospect) → clients. Inscrits = les prospects, et les clients passés par l'inscription gratuite (une trace du parcours
     gratuit : questionnaire court, clé challenge, ou suivi commercial) ; les comptes créés directement par le coach ne
     comptent pas. Calculé à l'affichage (lignes de Clients.resumer), rien n'est stocké. */
  compteur(lignes){
    const passe = l => l.p.statut === "prospect" || !!l.ch || !!(l.dc && (l.dc.court_le || l.dc.court_debut)) || !!(l.suivi && (l.suivi.client_le || l.suivi.issue));
    const L = (lignes || []).filter(l => l && l.p && l.p.role !== "coach" && passe(l));
    return { inscrits: L.length, questions: L.filter(l => Decouverte.questionnaireFait(l.dc)).length,
             bilans: L.filter(l => this.bilanLigne(l).reserve).length, clients: L.filter(l => l.p.statut !== "prospect").length };
  },
  CLASSES: { signe: "ok", perdu: "manque", absent: "attention" },
  /* la pastille de l'issue de l'appel (SIGNÉ / PERDU / ABSENT) ; rien tant qu'il n'y a pas d'issue */
  pastille(a){ return a && a.issue && this.ETATS[a.issue] ? `<span class="pastille ${this.CLASSES[a.issue] || ""}" title="${esc(a.raisons.join(" "))}">${esc(this.ETATS[a.issue])}</span>` : ""; },
  pastilleLigne(l){ return this.pastille(this.analyseLigne(l)); },
  pastilleBilan(B){ return B && B.reserve ? `<span class="pastille ok" title="${B.coach ? "Bilan réservé : coché par toi" : "A coché « J'ai réservé mon bilan » : à vérifier"}">bilan réservé</span>` : ""; },
  bouton(p, act, txt, cls){ return `<button type="button" class="btn petit${cls === "principal" ? "" : " ghost"}" data-sc="${act}" data-uid="${esc(p.id)}" data-nom="${esc(Clients.nom(p))}">${esc(txt)}</button>`; },
  /* fiche = boutons du panneau « Suivi commercial » de la fiche : + « Bilan réservé » / « Retirer « Bilan réservé » »
     (v53, un clic, sans fenêtre de confirmation, annulable), tant qu'aucune issue n'est indiquée */
  boutons(p, a, fiche){
    const b = (act, txt, cls) => this.bouton(p, act, txt, cls), B = a.bilan || {};
    const bilan = !fiche || a.issue ? "" : B.coach ? b("bilan_non", "Retirer « Bilan réservé »")
      : b("bilan", "Bilan réservé", "principal") + (B.source === "prospect" ? b("bilan_non", "Retirer « Bilan réservé »") : "");
    return (fiche ? "" : b("fiche", "Ouvrir la fiche")) + bilan + (a.issue
      ? (a.issue === "signe" && p.statut === "prospect" ? b("client", "Passer client", "principal") : "") + b("relance", "J'ai relancé") + b("annuler", "Annuler « " + this.ISSUES[a.issue] + " »")
      : b("relance", "J'ai relancé") + b("signe", "Signé") + b("perdu", "Perdu") + b("absent", "Absent"));
  },
  sousTitre(p, a){
    const i = this.depuis(p && p.cree_le), d = p && typeof p.cree_le === "string" ? Decouverte.dateLocale(p.cree_le) : null;
    /* v53 : la date d'inscription, puis depuis quand ; les relances */
    return (d ? "inscrit le " + dateFr(d) + " · " : "") + (a.inscritHeures != null && a.inscritHeures < 24 ? (a.inscritHeures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(a.inscritHeures) + " h") : this.quand(i)) + (a.relances ? " · " + a.relances + " relance" + (a.relances > 1 ? "s" : "") : "");
  },
  /* v53 (chantier 4) — la carte d'un prospect (page Prospects) : l = sa ligne (Clients.resumer), a = son analyse.
     Date d'inscription, email, ses 3 réponses (Problème / Ce qui l'a bloqué / Dans 3 mois ; anciennes réponses : dans sa
     fiche), bilan réservé ou pas, newsletter oui / non, dernière visite, jours actifs (30 j), prochaine action, boutons. */
  carteHTML(l, a){
    const p = l.p, nom = Clients.nom(p), dc = l.dc || {}, B = a.bilan || {};
    const dt = v => { const d = Decouverte.dateLocale(v); return d ? dateFr(d) : ""; };
    const reponses = [["Problème", dc.probleme || ""], ["Ce qui l'a bloqué", !dc.ancien && dc.obstacle ? "« " + Decouverte.extrait(dc.obstacle, 90) + " »" : ""], ["Dans 3 mois", dc.projection ? "« " + Decouverte.extrait(dc.projection, 100) + " »" : ""]].filter(x => x[1]);
    const faits = [["Bilan", B.coach ? "réservé le " + dt(B.coach) : B.source === "prospect" ? "à vérifier (case cochée le " + dt(B.case) + ")" : "pas réservé"],
      ["Newsletter", l.newsletter && l.newsletter.oui ? "oui" : "non"], ["Dernière visite", Activite.texteVisite(l.visites)], ["Jours actifs (30 j)", Activite.texteJours(l.visites)]];
    return `<article class="sc-carte${a.urgent ? " urgent" : ""}" data-uid="${esc(p.id)}">
      <div class="sc-tete">${Clients.avatar(nom)}<div class="sc-nom"><b>${esc(nom)}</b><small>${esc(this.sousTitre(p, a))}</small></div>${this.pastille(a)}${this.pastilleBilan(B)}</div>
      ${dc.email ? `<p class="sc-infos">${esc(dc.email)}</p>` : ""}
      ${reponses.length ? `<ul class="sc-reponses">${reponses.map(([k, v]) => `<li><span>${esc(k)}</span> ${esc(v)}</li>`).join("")}</ul>` : `<p class="sc-infos sc-sans">${dc.ancien ? "Anciennes réponses : dans sa fiche." : "Pas encore de réponse à ses 3 questions."}</p>`}
      <ul class="sc-faits">${faits.map(([k, v]) => `<li><span>${esc(k)}</span> <b>${esc(v)}</b></li>`).join("")}</ul>
      ${a.urgent ? `<p class="sc-motif"><span class="pastille mauvais">à traiter</span> ${esc(this.motifTexte(a))}</p>` : ""}
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <div class="sc-boutons">${this.boutons(p, a, false)}</div>
      <span class="msg sc-msg" role="status" aria-live="polite"></span>
    </article>`;
  },
  /* l'historique des actions du coach (bilan réservé, relances, issues), du plus recent au plus ancien */
  histoHTML(S){
    const h = (Array.isArray(this.suivi(S).historique) ? this.suivi(S).historique : []).filter(e => e && typeof e === "object" && typeof e.le === "string").slice(-6).reverse();
    if (!h.length) return "";
    const lib = e => e.type === "relance" ? "Relance" : e.type === "annule" ? "Issue annulée" + (this.ISSUES[e.valeur] ? " (" + this.ISSUES[e.valeur] + ")" : "") : e.type === "issue" && this.ISSUES[e.valeur] ? "Appel : " + this.ISSUES[e.valeur]
      : e.type === "bilan" ? (e.valeur === "reserve" ? "Bilan réservé coché" : e.valeur === "annule" ? "« Bilan réservé » retiré" : "") : "";
    return `<p class="note" style="margin:10px 0 4px">Historique</p><ul class="sc-raisons sc-histo">${h.filter(lib).map(e => `<li>${esc(lib(e) + " — " + dateFr(e.le) + (typeof e.note === "string" && e.note ? " — " + e.note : ""))}</li>`).join("")}</ul>`;
  },
  ficheHTML(p, a, S){
    return `<section class="panel sc-fiche${a.urgent ? " urgent" : ""}"><div class="seance-c-tete"><h2>Suivi commercial</h2>${this.pastille(a)}${this.pastilleBilan(a.bilan)}</div>
      ${a.urgent ? `<p class="sc-motif"><span class="pastille mauvais">à traiter</span> ${esc(this.motifTexte(a))}</p>` : ""}
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <ul class="sc-raisons">${a.raisons.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="sc-boutons">${this.boutons(p, a, true)}</div>${this.histoHTML(S)}
      <span class="msg sc-msg" role="status" aria-live="polite"></span>
      <p class="note" style="margin:10px 0 0">« Bilan réservé » : coche-le quand le bilan est dans ton agenda (un clic, annulable). Seuls cette coche, l'issue de l'appel et tes relances sont enregistrés, jamais visibles par le prospect.</p></section>`;
  },
  /* ---- ecritures : cle coach-seul, ecriture conditionnelle (un conflit relit et rejoue, 3 fois au plus) ---- */
  async modifier(uid, maj){
    for (let essai = 1; essai <= 3; essai++){
      const l = await CleCoach.ligne(uid, this.cle);
      const avant = (l && l.contenu && typeof l.contenu === "object" && !Array.isArray(l.contenu)) ? l.contenu : {};
      const apres = maj(JSON.parse(JSON.stringify(avant)));
      apres.version = 1;
      try { const r = await CleCoach.ecrireSi(uid, this.cle, apres, l ? { maj_le: l.maj_le } : null); return (r && r.contenu) || apres; }
      catch(e){ if (!(e && e.conflit)) throw e; }
    }
    throw new Error("le suivi a changé ailleurs en même temps, réessaie");
  },
  noter(c, ev){ c.historique = (Array.isArray(c.historique) ? c.historique : []).concat(ev).slice(-30); return c; },
  poserIssue(uid, issue, note){ const le = new Date().toISOString(); return this.modifier(uid, c => { c.issue = issue; c.issue_le = le; c.note = note || ""; return this.noter(c, { type: "issue", valeur: issue, le: le, note: note || "" }); }); },
  annulerIssue(uid){ const le = new Date().toISOString(); return this.modifier(uid, c => { const avant = c.issue || null; c.issue = null; c.issue_le = null; c.note = ""; return this.noter(c, { type: "annule", valeur: avant, le: le }); }); },
  relancer(uid){ const le = new Date().toISOString(); return this.modifier(uid, c => { c.relances = (Array.isArray(c.relances) ? c.relances.filter(x => typeof x === "string") : []).concat(le).slice(-20); return this.noter(c, { type: "relance", le: le }); }); },
  /* v53 (chantier 4) : « Bilan réservé » coché (bilan_le = maintenant) ou retiré (bilan_le = null), un événement « bilan »
     dans l'historique ; le reste du suivi est gardé tel quel (écriture conditionnelle) */
  poserBilan(uid, oui){ const le = new Date().toISOString(); return this.modifier(uid, c => { c.bilan_le = oui ? le : null; return this.noter(c, { type: "bilan", valeur: oui ? "reserve" : "annule", le: le }); }); },
  async passerClient(uid){
    const r = await Auth.appel("/rest/v1/profils?id=eq." + uid, { method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: "client" } });
    if (!Array.isArray(r) || !r[0] || r[0].statut !== "client") throw new Error("la base n'a pas confirmé le passage en client");
  },
  /* un message d'erreur clair ; sur une coupure reseau, on ne pretend pas savoir si l'ecriture est passee */
  /* la cause en quelques mots (pour une phrase qui continue) */
  cause(e){
    if (e && (e.statut === 403 || e.statut === 409)) return "la base refuse cette écriture";
    if (e && e.statut === 401) return "ta session a expiré, reconnecte-toi";
    if (e && e.statut) return "erreur " + e.statut + " du serveur";
    if (e && /n'a pas confirmé/.test(e.message || "")) return "la base n'a pas confirmé le changement, recharge la page pour vérifier";
    return "connexion interrompue, recharge la page pour vérifier";
  },
  erreur(e){
    if (e && /n'a pas confirmé/.test(e.message || "")) return "Non confirmé : " + e.message + ". Recharge la page pour vérifier.";
    if (e && (e.statut === 403 || e.statut === 409)) return "Non enregistré : la base refuse cette écriture.";
    if (e && e.statut === 401) return "Non enregistré : ta session a expiré. Reconnecte-toi, puis recommence.";
    if (e && e.statut) return "Non enregistré (erreur " + e.statut + " du serveur). Réessaie dans un instant.";
    if (e && /changé ailleurs/.test(e.message || "")) return "Non enregistré : " + e.message + ".";
    return "Peut-être non enregistré (connexion interrompue) : recharge la page pour vérifier avant de recommencer.";
  },
  occupe: {},   // par prospect : une action a la fois (un double clic ou une carte redessinee ne relance pas une ecriture en cours)
  /* branche les boutons d'une zone ; apres(uid, suivi, action) redessine */
  brancher(zone, apres){
    if (!zone) return;
    $$("[data-sc]", zone).forEach(b => b.addEventListener("click", async () => {
      const uid = b.dataset.uid, nom = b.dataset.nom, act = b.dataset.sc;
      if (act === "fiche") return Clients.ouvrir(uid, nom, "accueil");
      if (this.occupe[uid]){ UI.toast("Une action est en cours pour " + nom + ", un instant…", "attention"); return; }
      this.occupe[uid] = true;
      try { await this.agir(b, uid, nom, act, apres); } finally { delete this.occupe[uid]; }
    }));
  },
  async agir(b, uid, nom, act, apres){
    const carte = b.closest(".sc-carte, .sc-fiche"), msg = carte && carte.querySelector(".sc-msg");
    const boutons = carte ? $$("[data-sc]", carte) : [b];
    const attente = () => { boutons.forEach(x => { x.disabled = true; }); if (msg) msg.textContent = "Enregistrement…"; };
    const relacher = () => { boutons.forEach(x => { x.disabled = false; }); if (msg) msg.textContent = ""; };
    const client = async (S) => {
      try { await this.passerClient(uid); }
      catch(e){ UI.alerte((S ? "« Signé » est bien enregistré, mais le passage en client a échoué (" : "Le passage en client a échoué (") + this.cause(e) + "). Réessaie avec « Passer client »."); return false; }
      /* la date du passage en client est notee (s'il redevient prospect un jour, il ne sera pas « Signé » a traiter) */
      try { await this.modifier(uid, c => { c.client_le = new Date().toISOString(); return c; }); } catch(e){}
      UI.toast(nom + " est maintenant client.", "ok"); apres && apres(uid, S, "client"); return true;
    };
    let S = null;
    try {
      if (act === "signe"){
        if (!(await UI.confirmer("Marquer " + nom + " comme signé ?", { ok: "Signé" }))) return;
        attente(); S = await this.poserIssue(uid, "signe");
        apres && apres(uid, S, "signe");   // la carte montre « SIGNÉ » tout de suite
        if (await UI.confirmer("Passer " + nom + " client maintenant ?\n\nIl aura accès à tout son espace d'accompagnement. Tu peux aussi le faire plus tard.", { ok: "Passer client", annuler: "Plus tard" })) await client(S);
        else UI.toast("Suivi de " + nom + " enregistré.", "ok");
        return;
      }
      if (act === "client"){
        if (!(await UI.confirmer("Passer " + nom + " client ?\n\nIl aura accès à tout son espace d'accompagnement.", { ok: "Passer client" }))) return;
        attente(); if (!(await client(null))) relacher();
        return;
      }
      /* v53 (chantier 4) : « Bilan réservé » en un clic, sans fenêtre (annulable par « Retirer « Bilan réservé » ») */
      if (act === "bilan" || act === "bilan_non"){
        attente(); S = await this.poserBilan(uid, act === "bilan");
        UI.toast(act === "bilan" ? "Bilan réservé noté pour " + nom + "." : "« Bilan réservé » retiré pour " + nom + ".", "ok");
        apres && apres(uid, S, act);
        return;
      }
      if (act === "perdu"){
        const note = await UI.demander("Marquer " + nom + " comme perdu. La raison, en quelques mots (facultatif) : prix, timing, pas convaincu…", "", { ok: "Perdu", placeholder: "Facultatif" });
        if (note === null) return;
        attente(); S = await this.poserIssue(uid, "perdu", String(note).trim().slice(0, 200));
      } else if (act === "absent"){
        if (!(await UI.confirmer(nom + " ne s'est pas présenté à l'appel ?", { ok: "Absent" }))) return;
        attente(); S = await this.poserIssue(uid, "absent");
      } else if (act === "annuler"){
        if (!(await UI.confirmer("Retirer l'issue indiquée pour " + nom + " ? Il redevient un prospect en cours.", { ok: "Retirer l'issue" }))) return;
        attente(); S = await this.annulerIssue(uid);
      } else if (act === "relance"){
        attente(); S = await this.relancer(uid);
      } else return;
      UI.toast("Suivi de " + nom + " enregistré.", "ok");
      apres && apres(uid, S, act);
    } catch(e){
      relacher();
      UI.alerte(this.erreur(e));
    }
  }
};

/* ------------------------------------------------------------------
   NOUVEAUTÉS (v51) — pour le coach : ce que ses prospects ont fait depuis sa dernière visite
   (inscriptions, questionnaires remplis, clics « Réserver mon bilan », cases « J'ai réservé »), calculé à partir
   des données déjà chargées par le tableau de bord ou la page Prospects (aucune requête de plus). Seule la
   date de dernière visite est rangée, dans la clé du coach « coach_notifs » = { vu: instant } (première
   fois : les 7 derniers jours). Badge sur l'onglet Prospects. Pas de notification push ni d'email :
   l'app n'a pas de serveur d'envoi.
   ------------------------------------------------------------------ */
const Nouveautes = {
  cle: "coach_notifs",
  JOURS_PAR_DEFAUT: 7,
  n: 0, _vu: undefined, _lecture: null, erreur: false, _deplie: false, _tCharge: null,
  /* v53 (chantier 4) : « reserve » = la case « J'ai réservé » cochée par le prospect (une action du prospect, à vérifier) ;
     elle ne compte plus dès que le coach a décidé du bilan (coché ou retiré : Commercial.bilan) */
  TYPES: { inscription: "inscription", questionnaire: "questionnaire rempli", clic: "clic « Réserver mon bilan »", reserve: "a coché « J'ai réservé »" },
  COURTS: { inscription: ["inscription", "inscriptions"], questionnaire: ["questionnaire rempli", "questionnaires remplis"], clic: ["clic « Réserver »", "clics « Réserver »"], reserve: ["case « J'ai réservé »", "cases « J'ai réservé »"] },
  /* date de la derniere visite, relue a chaque affichage (un autre appareil a pu tout marquer comme vu).
     Une date qui n'est pas au format ISO (valeur piegee) compte comme absente. Lecture ratee : erreur = true,
     on garde la derniere valeur connue (sinon les 7 derniers jours) et on le dit dans le panneau. */
  iso(v){ return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !isNaN(Date.parse(v)); },
  async vu(){
    if (!this._lecture) this._lecture = (async () => {
      let d = null; try { d = await Store.lire(this.cle, {}); } catch(e){ d = null; }
      const uid = Store.cible();
      this.erreur = !uid || Store.charge[uid + "|" + this.cle] === false;
      /* la date ne recule jamais : juste apres « Tout marquer comme vu », l'ecriture (700 ms) peut ne pas etre arrivee */
      if (!this.erreur){ const lu = d && this.iso(d.vu) ? d.vu : null; this._vu = this._vu && (!lu || Date.parse(this._vu) > Date.parse(lu)) ? this._vu : lu; }
      return this._vu === undefined ? null : this._vu;
    })().finally(() => { this._lecture = null; });
    return this._lecture;
  },
  seuil(vu){ const t = typeof vu === "string" ? Date.parse(vu) : NaN; return isNaN(t) ? Date.now() - this.JOURS_PAR_DEFAUT * 86400000 : t; },
  /* lignes = Clients.resumer ; seuls les prospects comptent ; une date dans le futur (horloge d'un appareil en avance) ne compte pas */
  evenements(lignes, vu){
    const t0 = this.seuil(vu), maxi = Date.now() + 5 * 60000, out = [];
    const ajoute = (l, type, quand) => { if (typeof quand !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(quand)) return; const t = Date.parse(quand); if (!isNaN(t) && t > t0 && t <= maxi) out.push({ uid: l.p.id, nom: Clients.nom(l.p), type, t, quand }); };
    (lignes || []).filter(l => l && l.p && l.p.statut === "prospect").forEach(l => {
      ajoute(l, "inscription", l.p.cree_le);
      if (l.dc) ajoute(l, "questionnaire", l.dc.court_le);
      Decouverte.clics(l.ch).forEach(c => ajoute(l, "clic", c.date));
      const B = Commercial.bilanLigne(l);
      if (B.case && !B.decide) ajoute(l, "reserve", B.case);
    });
    return out.sort((a, b) => b.t - a.t);
  },
  quand(v){ const d = new Date(v); return isNaN(d) ? "" : dateFr(Decouverte.dateLocale(v) || "") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); },
  /* complet = page Prospects : les evenements au-dela des 8 premiers se deplient sur place ;
     ailleurs (tableau de bord), un lien mene a la page Prospects */
  html(ev, vu, complet){
    const depuis = vu ? "depuis ta dernière visite (" + this.quand(vu) + ")" : "ces " + this.JOURS_PAR_DEFAUT + " derniers jours";
    const avert = this.erreur ? `<p class="note" style="margin:0 0 8px;color:var(--bad)">Ta dernière visite n'a pas pu être lue (réseau) : ${vu ? "dernière date connue" : "nouveautés des " + this.JOURS_PAR_DEFAUT + " derniers jours"}.</p>` : "";
    if (!ev.length) return `<section class="panel nv-panneau"><div class="seance-c-tete"><h2>Nouveautés</h2></div>${avert}<p class="note" style="margin:0">Rien de nouveau chez tes prospects ${esc(depuis)}.</p></section>`;
    const par = t => ev.filter(e => e.type === t).length;
    const types = Object.keys(this.TYPES).filter(t => par(t)).map(t => `<span class="pastille${t === "reserve" ? " ok" : t === "clic" ? " accent" : ""}">${par(t)} ${esc(this.COURTS[t][par(t) > 1 ? 1 : 0])}</span>`).join("");
    const PREMIERS = 8, MAXI = 300;
    const li = e => `<li><span class="nv-txt"><b>${esc(e.nom)}</b> · ${esc(this.TYPES[e.type])}</span><time datetime="${esc(e.quand)}">${esc(this.quand(e.quand))}</time><button type="button" class="btn ghost petit" data-nv-ouvrir="${esc(e.uid)}" data-nom="${esc(e.nom)}">Ouvrir</button></li>`;
    const reste = ev.length - PREMIERS, pl = n => n > 1 ? "s" : "";
    const suite = reste <= 0 ? ""
      : complet ? `<ul class="nv-liste nv-suite"${this._deplie ? "" : " hidden"}>${ev.slice(PREMIERS, MAXI).map(li).join("")}</ul>${ev.length > MAXI ? `<p class="note nv-suite"${this._deplie ? "" : " hidden"} style="margin:8px 0 0">Les ${ev.length - MAXI} plus anciennes ne sont pas listées : filtre la liste ci-dessous par date d'inscription.</p>` : ""}${this._deplie ? "" : `<p style="margin:8px 0 0"><button type="button" class="btn ghost petit" data-nv-plus aria-expanded="false">${Math.min(reste, MAXI - PREMIERS) > 1 ? "Voir les " + Math.min(reste, MAXI - PREMIERS) + " suivantes" : "Voir la suivante"}</button></p>`}`
      : `<p class="note" style="margin:8px 0 0">Et ${reste} autre${pl(reste)} : <a class="link-a" href="#/prospects">tout voir dans la page Prospects →</a></p>`;
    return `<section class="panel nv-panneau"><div class="seance-c-tete"><h2>Nouveautés</h2><span class="pastille accent">${ev.length}</span></div>
      ${avert}<p class="note" style="margin:0 0 10px">${esc(depuis.charAt(0).toUpperCase() + depuis.slice(1))} :</p>
      <div class="nv-types">${types}</div>
      <ul class="nv-liste">${ev.slice(0, PREMIERS).map(li).join("")}</ul>
      ${suite}
      <div class="actions"><button type="button" class="btn ghost petit" data-nv-vu>Tout marquer comme vu</button><span class="msg" role="status" aria-live="polite"></span></div></section>`;
  },
  /* v53 (chantier 4) : le tableau de bord n'affiche plus le panneau (il est sur la page Prospects) mais calcule toujours
     le nombre de nouveautés et le badge de l'onglet Prospects */
  async compter(lignes){
    if (!Auth.estCoach() || Store.idConsulte) return;
    const vu = await this.vu();
    if (Store.idConsulte) return;
    this.n = this.evenements(lignes, vu).length; this.badge();
  },
  /* tCharge : l'instant ou les lignes affichees ont ete lues — « Tout marquer comme vu » ne marque rien de plus recent */
  async monter(boite, lignes, complet, tCharge){
    if (!boite || !Auth.estCoach() || Store.idConsulte) return;
    this._tCharge = typeof tCharge === "string" ? tCharge : new Date().toISOString();
    const vu = await this.vu();
    if (!boite.isConnected || Store.idConsulte) return;
    const ev = this.evenements(lignes, vu);
    this.n = ev.length; this.badge();
    boite.innerHTML = this.html(ev, vu, complet);
    $$("[data-nv-ouvrir]", boite).forEach(b => b.addEventListener("click", () => Clients.ouvrir(b.dataset.nvOuvrir, b.dataset.nom, "accueil")));
    const plus = boite.querySelector("[data-nv-plus]");
    if (plus) plus.addEventListener("click", () => { this._deplie = true; $$(".nv-suite", boite).forEach(x => { x.hidden = false; }); plus.parentNode.remove(); });
    const bv = boite.querySelector("[data-nv-vu]");
    if (bv) bv.addEventListener("click", async () => {
      bv.disabled = true;
      const ok = await this.marquerVu();
      if (!boite.isConnected) return;
      if (!ok){ bv.disabled = false; const m = boite.querySelector(".msg"); if (m) m.textContent = "Non enregistré : vérifie ta connexion et réessaie."; return; }
      this.erreur = false;
      boite.innerHTML = this.html([], this._vu, complet);
    });
  },
  /* la date de derniere visite = maintenant ; false si l'ecriture est refusee (rien ne change alors).
     Si la lecture avait rate, on relit d'abord : sans lecture reussie, le Store refuse d'ecrire (a raison). */
  async marquerVu(){
    const uid = Store.cible(); if (!uid) return false;
    /* relue juste avant : un autre appareil a pu marquer vu plus tard (la date en base ne recule jamais) */
    await this.vu(); if (Store.charge[uid + "|" + this.cle] !== true) return false;
    const t = Date.parse(this._tCharge), charge = !isNaN(t) && t <= Date.now() ? t : Date.now(), avant = this._vu;
    const vu = new Date(Math.max(charge, this.iso(avant) ? Date.parse(avant) : 0)).toISOString();
    const d = Object.assign({}, (Store.cache[this.cle] && typeof Store.cache[this.cle] === "object") ? Store.cache[this.cle] : {}, { vu: vu });
    if (Store.ecrire(this.cle, d) === false){ this._vu = avant; return false; }
    this._vu = vu; this.n = 0; this.badge();
    return true;
  },
  /* badge sur l'onglet Prospects (barre du haut, barre du bas, menu « Plus ») */
  badge(){
    const n = (Auth.estCoach() && !Store.idConsulte) ? this.n : 0;
    $$('#nav a[data-id="prospects"], #barre-bas a[data-id="prospects"], .menu-plus a[data-id="prospects"]').forEach(a => {
      let b = a.querySelector(".nav-badge");
      if (n > 0){
        if (!b){ b = document.createElement("span"); b.className = "nav-badge"; a.appendChild(b); }
        b.textContent = n > 99 ? "99+" : String(n);
        b.setAttribute("aria-label", n + " nouveauté" + (n > 1 ? "s" : "") + " chez tes prospects");
      } else if (b) b.remove();
    });
  }
};

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
  sans_entete: true,
  titre: "Prospects",
  accroche: "",
  /* filtres (gardes le temps de la session), recherche, tri, pagination par 50, export CSV */
  filtre: "a_traiter", periode: "tout", bilanF: "tout", newsF: "tout", tri: "priorite", recherche: "",
  PAS: 50, limite: 50, NL_PREMIERS: 10,
  donnees: null, lignes: [], tous: [], _nlDeplie: false,
  html(){ return `<div id="pr-vue"><header class="masthead"><h1>Prospects</h1></header><section class="panel"><div class="empty">Chargement…</div></section></div>`; },
  /* garder = rechargement apres une action sur une carte : le coach garde sa place (nombre de prospects affiches) */
  async init(garder){
    const zone = $("pr-vue"); if (!zone) return;
    if (!garder && typeof Nouveautes !== "undefined") Nouveautes._deplie = false;
    if (!garder) this._nlDeplie = false;
    const t0 = new Date().toISOString();
    try { this.donnees = await Clients.charger(); }
    catch(e){ zone.innerHTML = `<header class="masthead"><h1>Prospects</h1></header><section class="panel"><div class="empty">Impossible de charger les prospects pour le moment.</div></section>`; return; }
    if (!zone.isConnected) return;
    if (!garder) this.limite = this.PAS;
    this.tCharge = t0;
    this.rendre(zone);
  },
  /* chaque prospect : sa ligne (Clients.resumer) et son analyse (issue, prochaine action, à traiter) */
  preparer(){
    const { profils, parClient, contenus } = this.donnees;
    this.lignes = Clients.resumer(profils, parClient, contenus);
    this.tous = this.lignes.filter(l => l.p.statut === "prospect").map(l => ({ l, a: Commercial.analyseLigne(l) })).filter(x => x.a);
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
    const cmp = this.tri === "inscription" ? (x, y) => t(y.l.p.cree_le) - t(x.l.p.cree_le)
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
    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Prospects</h1>
        <p class="lede">${tous.length ? `${tous.length} ${pl(tous.length, "compte gratuit", "comptes gratuits")} · ${aTraiter} à traiter` : "Aucun prospect pour l'instant."}</p>
        <p class="note pr-compteur" id="pr-compteur" title="Inscrits : les prospects et les clients passés par l'inscription gratuite. Bilans réservés : ta coche « Bilan réservé », sinon la case « J'ai réservé » du prospect.">Inscrits <b>${K.inscrits}</b> → 3 questions remplies <b>${K.questions}</b> → bilans réservés <b>${K.bilans}</b> → clients <b>${K.clients}</b></p>
      </header>
      <div id="pr-nouveautes"></div>
      <section class="panel"><div class="tiles">
        ${tuile("À traiter", aTraiter, "une action à faire", aTraiter ? "neg" : "")}
        ${tuile("Signés", cmpt("signe"), "30 derniers jours", "pos")}
        ${tuile("Perdus", cmpt("perdu"), "30 derniers jours")}
        ${tuile("Absents", cmpt("absent"), "30 derniers jours")}
      </div></section>
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
        <p class="note" style="margin:12px 0 0">${esc(Commercial.AIDE)} « Bilan réservé » : ta coche, dans sa fiche (sans coche de ta part, la case « J'ai réservé » du prospect compte, à vérifier). « Dernière visite » et « Jours actifs » : les jours où il a ouvert l'app.</p>
      </section>
      <div id="pr-newsletter"></div>`;
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
      this.telecharger(this.csv(liste), "prospects-" + aujourdhui() + ".csv");
      UI.toast(liste.length + " prospect" + (liste.length > 1 ? "s" : "") + " exporté" + (liste.length > 1 ? "s" : "") + ".", "ok");
    });
    this.majListe(zone);
    this.monterNewsletter(zone.querySelector("#pr-newsletter"));
    if (typeof Nouveautes !== "undefined") Nouveautes.monter(zone.querySelector("#pr-nouveautes"), this.lignes, true, this.tCharge);
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
    Commercial.brancher(boite, async () => { if (!zone.isConnected) return; const y = window.scrollY; await this.init(true); if (zone.isConnected) window.scrollTo(0, y); });
  },
  /* une cellule CSV : point-virgule, UTF-8 avec BOM (s'ouvre tel quel dans Excel en français). Une cellule qui commence
     par = + - @ (ou une tabulation, un retour) est neutralisée (apostrophe) : un prénom piégé ne devient jamais une
     formule dans le tableur. Le même format pour les deux exports (prospects, newsletter). */
  csvDe(tete, lignes){
    const cell = v => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    return "﻿" + [tete].concat(lignes).map(ligne => ligne.map(cell).join(";")).join("\r\n") + "\r\n";
  },
  dateCsv(v){ return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : ""; },
  /* export CSV des prospects filtrés (v53 : colonnes à jour, sans statut ni score) */
  TETE_CSV: ["Nom", "Email", "Inscrit le", "Problème", "Ce qui l'a bloqué", "Dans 3 mois", "Questionnaire", "Bilan réservé", "Bilan réservé le", "Case « J'ai réservé » (prospect)", "Newsletter", "Dernière visite", "Jours actifs (30 j)", "Clics « Réserver mon bilan »", "Dernier clic", "Issue", "Relances", "Prochaine action"],
  csv(liste){
    const dt = v => this.dateCsv(v);
    const lignes = liste.map(({ l, a }) => {
      const dc = l.dc || {}, B = a.bilan || {}, v = l.visites; let r = null; try { r = Decouverte.resume(l.p, l.ch, dc); } catch(e){ r = null; }
      const q = a.questionnaire ? "rempli le " + dt(dc.court_le) : (dc.repondues || 0) + "/" + (dc.nb_questions || (CONFIG.decouverte.questions || []).length) + " réponses";
      return [Clients.nom(l.p), dc.email || "", dt(l.p.cree_le), dc.probleme || "", dc.ancien ? "" : (dc.obstacle || ""), dc.projection || "", q,
              B.reserve ? (B.coach ? "oui" : "à vérifier (case du prospect)") : "non", B.le ? dt(B.le) : "", B.case ? dt(B.case) : "",
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
      this.telecharger(this.csvNewsletter(l), "newsletter-" + aujourdhui() + ".csv");
      UI.toast(l.length + " personne" + (l.length > 1 ? "s" : "") + " exportée" + (l.length > 1 ? "s" : "") + ".", "ok");
    });
  },
  telecharger(texte, nom){
    const url = URL.createObjectURL(new Blob([texte], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = nom; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
};

