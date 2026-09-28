/* ------------------------------------------------------------------
   SUIVI COMMERCIAL (v49). Pour chaque prospect : une temperature (CHAUD,
   TIEDE, FROID) calculee a chaque affichage a partir de ce qu'il a fait
   dans le funnel, les raisons en clair, la prochaine action, et l'issue
   de l'appel indiquee par le coach (Signe, Perdu, Absent). Seules
   l'issue et les relances sont enregistrees : cle coach-seul
   « suivi_prospect » (jamais lisible par le prospect, regles de la base),
   ecriture conditionnelle (CleCoach). Seuils : CONFIG.suivi.
   ------------------------------------------------------------------ */
const Commercial = {
  cle: "suivi_prospect",
  ISSUES: { signe: "Signé", perdu: "Perdu", absent: "Absent" },
  ETATS: { nouveau: "NOUVEAU", chaud: "CHAUD", tiede: "TIÈDE", froid: "FROID", signe: "SIGNÉ", perdu: "PERDU", absent: "ABSENT" },
  cfg(){ return Object.assign({ nouveau_heures: 24, inactif_jours: 3, clic_recent_jours: 3, relance_attente_jours: 3, perdu_relance_jours: 30, motivation_forte: 8, relances_max: 3, chaud_jours: 14, appel_jours: 7 }, CONFIG.suivi || {}); },
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
  /* p = profil (cree_le, statut), C = cle « challenge » (clics « Réserver mon bilan », case « J'ai réservé »),
     S = suivi_prospect, activite = derniere saisie du prospect, D = son questionnaire (court_le, motivation) */
  analyse(p, C, S, activite, D){
    const cfg = this.cfg(); S = this.suivi(S);
    let r = null; try { r = Decouverte.resume(p, C, D); } catch(e){ r = null; }
    const fait = !!(r && r.questionnaire), finie = !!(r && r.finie), jour = r ? r.jour : null;
    const motiv = D && (typeof D.motivation === "string" || typeof D.motivation === "number") ? (Math.round(Number(D.motivation)) || 0) : 0;
    const instant = v => { const x = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(x) ? null : x; };
    /* une activite datee de plus de 12 h dans le futur (horloge du prospect en avance) est traitee comme inconnue :
       sinon il paraitrait actif a jamais et les relances ne compteraient jamais comme restees sans reponse */
    const futur = instant(activite) != null && instant(activite) > Date.now() + 12 * 3600000;
    const inscrit = this.depuis(p && p.cree_le), actif = futur ? null : this.depuis(activite);
    const clic = r && r.dernierClic ? this.depuis(r.dernierClic) : null;
    const relances = Array.isArray(S.relances) ? S.relances.filter(x => instant(x) != null) : [];
    const relance = relances.length ? this.depuis(relances[relances.length - 1]) : null;
    const tAct0 = futur ? null : instant(activite), tAct = tAct0 == null ? null : Math.min(tAct0, Date.now());   // quelques heures d'avance : ramenee a maintenant
    /* relances restees sans reponse : faites apres la derniere activite du prospect */
    const sansReponse = relances.filter(x => tAct == null || instant(x) > tAct).length;
    let issue = (typeof S.issue === "string" && Object.prototype.hasOwnProperty.call(this.ISSUES, S.issue)) ? S.issue : null;   // une valeur piegee (objet) ne fait rien tomber
    const tIssue = issue ? instant(S.issue_le) : null, issueDepuis = issue ? this.depuis(S.issue_le) : null;
    /* « Signé » puis passé client, puis repassé prospect (fin d'accompagnement) : ce n'est plus un signé a traiter */
    /* seulement si le passage en client est POSTERIEUR a la signature (un ancien client qui re-signe reste « Signé ») */
    const tClient = instant(S.client_le);
    const ancienClient = issue === "signe" && p && p.statut === "prospect" && tClient != null && tIssue != null && tClient > tIssue;
    if (ancienClient) issue = null;
    /* une case « J'ai réservé » d'AVANT son passage en client ne compte plus (c'etait l'appel qui l'a fait signer) */
    if (ancienClient && r && r.reserve && !(instant(r.reserve) > tClient)) r = Object.assign({}, r, { reserve: null });
    const relancesApresIssue = tIssue != null ? relances.filter(x => instant(x) > tIssue).length : 0;
    /* « Perdu » ou « Absent », puis il reclique « Réserver » ou coche « J'ai réservé » : il revient dans la course */
    const revenu = (issue === "perdu" || issue === "absent") && tIssue != null && !!r && ((!!r.dernierClic && instant(r.dernierClic) > tIssue && clic != null && clic <= cfg.clic_recent_jours) || (!!r.reserve && instant(r.reserve) > tIssue && this.depuis(r.reserve) != null && this.depuis(r.reserve) <= cfg.chaud_jours));
    /* v51 — statuts calcules (brief de Lucas du 27/09) :
       NOUVEAU = inscrit depuis moins de 24 h, rien fait (ni questionnaire, ni clic, ni reservation) ;
       CHAUD   = bilan reserve (case « J'ai réservé mon bilan »), meme sans questionnaire : c'est l'appel qui compte ;
       TIÈDE   = questionnaire rempli, pas de reservation (avec ou sans clic « Réserver ») ;
       FROID   = questionnaire pas rempli passe 24 h, ou plus aucune action depuis 3 jours, ou relances epuisees. */
    const tInscrit = instant(p && p.cree_le), heures = tInscrit == null ? null : Math.max(0, (Date.now() - tInscrit) / 3600000);
    const reserve = !!(r && r.reserve), clics = r ? r.clics : 0;
    const nouveau = !fait && !clics && !reserve && heures != null && heures < cfg.nouveau_heures;
    /* inscrit depuis moins de 24 h : jamais FROID (sauf relances epuisees) — un clic « Réserver » sans questionnaire le rend TIÈDE */
    const jeune = heures != null && heures < cfg.nouveau_heures;
    const commence = D && typeof D.repondues === "number" && isFinite(D.repondues) ? Math.floor(D.repondues) : Decouverte.repondues(D);
    const inactif = !reserve && !nouveau && actif != null && actif >= cfg.inactif_jours;
    const chaud = [], froid = [], tiede = [], neuf = [];
    const etape = jour == null ? "" : finie ? "découverte terminée" : "découverte jour " + jour + "/" + r.duree;
    if (reserve) chaud.push("A coché « J'ai réservé mon bilan » " + this.quand(this.depuis(r.reserve)) + ".");
    const depuisH = heures == null ? "" : heures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(heures) + " h";
    if (nouveau) neuf.push("Inscrit " + depuisH + (commence > 0 ? ", questionnaire commencé (" + commence + "/" + ((D && typeof D.nb_questions === "number" && D.nb_questions > 0 ? Math.floor(D.nb_questions) : Decouverte.liste(D).length) || 10) + " réponses)." : ", rien fait pour l'instant."));
    else if (!fait && jeune) tiede.push("Inscrit " + depuisH + ", questionnaire pas encore rempli.");
    else if (!fait) froid.push("Inscrit " + this.quand(inscrit) + ", questionnaire pas rempli.");
    if (inactif) froid.push("Aucune action depuis " + actif + " jours" + (etape ? " (" + etape + ")" : "") + ".");
    if (fait) tiede.push("Questionnaire rempli " + this.quand(this.depuis(r.questionnaire)) + (motiv ? ", motivation " + motiv + "/10" : "") + (etape ? ", " + etape : "") + ".");
    if (clics && !reserve) tiede.push("A cliqué « Réserver mon bilan » (" + clics + " fois), la dernière " + this.quand(clic) + ", sans réserver.");
    if (sansReponse) (sansReponse >= cfg.relances_max ? froid : tiede).push("Relancé " + sansReponse + " fois sans réponse.");
    if (issue && revenu) (reserve ? chaud : tiede).unshift("Revenu après l'issue « " + this.ISSUES[issue] + " » : a recliqué « Réserver » ou coché « J'ai réservé ».");
    else if (issue) (issue === "signe" ? chaud : froid).unshift("Appel : « " + this.ISSUES[issue] + " » " + this.quand(issueDepuis) + (typeof S.note === "string" && S.note ? " — " + S.note : "") + ".");
    if (ancienClient) tiede.unshift("Ancien client (« Signé » " + this.quand(this.depuis(S.issue_le)) + "), redevenu prospect.");
    if (revenu) issue = null;   // la temperature reprend la main
    const attendre = relance != null && relance < cfg.relance_attente_jours;
    const epuise = sansReponse >= cfg.relances_max;
    const temperature = reserve ? "chaud" : epuise ? "froid" : nouveau ? "nouveau" : (inactif || (!fait && !jeune)) ? "froid" : "tiede";
    let action, urgent = false;
    const siPasRelance = (texte) => {
      if (attendre) return "Relancé " + this.quand(relance) + " : attends sa réponse.";
      if (epuise) return "Sans réponse après " + sansReponse + " relances : classe-le « Perdu », ou attends qu'il revienne.";
      urgent = true; return texte;
    };
    if (issue === "signe"){
      if (!(p && p.statut === "prospect")) action = "C'est désormais un client.";
      else if (issueDepuis != null && issueDepuis > 30) action = "« Signé » " + this.quand(issueDepuis) + " et toujours prospect : passe-le client, ou retire l'issue s'il a arrêté.";   // oublie : rappel garde, non urgent
      else { action = "Passe-le client pour lui ouvrir son espace d'accompagnement."; urgent = true; }
    }
    else if (issue === "absent") action = relancesApresIssue >= cfg.relances_max ? "Absent, puis relancé " + relancesApresIssue + " fois sans suite : classe-le « Perdu » ?" : siPasRelance("Absent à l'appel : repropose-lui un créneau en DM.");
    else if (issue === "perdu"){ const reste = cfg.perdu_relance_jours - (issueDepuis || 0); action = relancesApresIssue >= 1 ? "Relancé après l'appel : s'il ne répond pas, laisse-le." : reste <= 0 ? siPasRelance("Relance-le : l'appel date d'il y a " + issueDepuis + " jours.") : "Relance prévue dans " + reste + " jour" + (reste > 1 ? "s" : "") + "."; }
    else if (reserve){ const dr = this.depuis(r.reserve); action = dr != null && dr > cfg.appel_jours ? "« J'ai réservé » " + this.quand(dr) + " : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent." : "Prépare le bilan : relis sa fiche (questionnaire, obstacle, motivation). Après l'appel, indique Signé, Perdu ou Absent."; urgent = true; }
    else if (ancienClient) action = "Ancien client redevenu prospect : reprends contact si tu veux lui proposer de reprendre.";
    else if (temperature === "nouveau") action = "Rien à faire aujourd'hui : il vient de s'inscrire.";
    else if (temperature === "froid" && !fait) action = siPasRelance(finie ? "Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan." : "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes).");
    else if (temperature === "froid") action = siPasRelance(finie ? "Relance : sa découverte est terminée, propose-lui le bilan." : "Relance douce en DM : demande-lui où il en est.");
    else if (clics) action = siPasRelance("DM : il a cliqué sans réserver, demande-lui ce qui le retient.");
    else if (motiv >= cfg.motivation_forte) action = siPasRelance("DM : il se dit motivé à " + motiv + "/10, propose-lui le bilan.");
    else if (finie) action = siPasRelance("DM : sa découverte est terminée, propose-lui le bilan.");
    else action = "Rien à faire aujourd'hui : il découvre" + (jour != null ? " (jour " + jour + "/" + r.duree + ")" : "") + ".";
    const etat = issue || temperature;
    const rang = issue === "signe" ? (urgent ? 0 : 9) : issue === "absent" ? (urgent ? 3 : 7) : issue === "perdu" ? (urgent ? 4 : 9)
               : temperature === "chaud" ? 1 : urgent ? (temperature === "tiede" ? 5 : 6) : 8;
    /* recence : a rang egal, le plus recemment actif d'abord (on lui ecrit pendant qu'il est dans le coup) */
    return { etat, temperature, issue, raisons: chaud.concat(neuf, froid, tiede), action, urgent, rang, recence: actif == null ? 9999 : actif, jour, duree: r ? r.duree : Decouverte.duree(), finie, questionnaire: fait, nouveau, reserve, clics, relances: relances.length, derniereRelance: relance, inscritHeures: heures };
  },
  analyseLigne(l){ try { return this.analyse(l.p, l.ch, l.suivi, l.activite, l.dc); } catch(e){ console.warn("[MHX] suivi commercial illisible", e); return null; } },
  /* v51 — score de qualification sur 100 : inscription 10 ; questionnaire 30 (jusqu'a 20 tant qu'il n'est pas valide,
     au prorata des reponses) ; clic « Réserver mon bilan » 30 ; bilan reserve 30. Bonus : revenu au moins 2 jours
     differents +5, 5 minutes ou plus dans l'app +5, email ouvert +5 (pas mesure tant que les emails ne sont pas
     branches). Plafonne a 100. D = questionnaire (au moins court_le, repondues), A = cle activite. */
  /* ana (facultatif) : l'analyse du meme prospect ; ses reservation et clics font foi (l'ancienne case d'un ancien
     client redevenu prospect ne compte pas, exactement comme dans son statut) */
  score(p, C, D, A, E, ana){
    let r = null; try { r = Decouverte.resume(p, C, D); } catch(e){ r = null; }
    if (r && ana && typeof ana === "object"){ r = Object.assign({}, r, { reserve: ana.reserve ? r.reserve : null, clics: typeof ana.clics === "number" ? ana.clics : r.clics }); }
    /* v52 : sur le questionnaire de ce prospect (3 questions, ou 10 pour un ancien prospect) ; nb_questions donne par Mes clients */
    const total = (D && typeof D.nb_questions === "number" && D.nb_questions > 0 ? Math.floor(D.nb_questions) : Decouverte.liste(D).length) || 10;
    const rep = D && typeof D.repondues === "number" && isFinite(D.repondues) ? Math.max(0, Math.min(total, Math.floor(D.repondues))) : Decouverte.repondues(D);
    const fait = !!(r && r.questionnaire), clics = r ? r.clics : 0;
    const a = Activite.propre(A), jours = a.jours.length, min = Math.floor(a.temps_s / 60);
    const lignes = [
      { cle: "inscription", lbl: "Inscription", pts: 10, max: 10 },
      { cle: "questionnaire", lbl: fait ? "Questionnaire rempli" : "Questionnaire en cours (" + rep + "/" + total + " réponses)", pts: fait ? 30 : Math.round(20 * rep / total), max: 30 },
      { cle: "clic", lbl: "Clic « Réserver mon bilan »" + (clics ? " (" + clics + " fois)" : ""), pts: clics ? 30 : 0, max: 30 },
      { cle: "reserve", lbl: "Bilan réservé", pts: r && r.reserve ? 30 : 0, max: 30 },
      { cle: "visites", lbl: "Revenu plusieurs jours (" + jours + " jour" + (jours > 1 ? "s" : "") + " d'activité)", pts: jours >= 2 ? 5 : 0, max: 5, bonus: true },
      { cle: "temps", lbl: "Temps passé dans l'app (" + min + " min)", pts: a.temps_s >= 300 ? 5 : 0, max: 5, bonus: true },
      Array.isArray(E)
        ? (() => { const env = E.filter(x => x && x.statut === "envoye").length, ouv = E.some(x => x && typeof x.ouvert_le === "string");
                   return { cle: "emails", lbl: "Email ouvert (" + env + " email" + (env > 1 ? "s" : "") + " de suivi envoyé" + (env > 1 ? "s" : "") + ")", pts: ouv ? 5 : 0, max: 5, bonus: true }; })()
        : { cle: "emails", lbl: "Email ouvert (pas encore mesuré : emails non branchés)", pts: 0, max: 5, bonus: true, nonMesure: true }
    ];
    return { total: Math.min(100, lignes.reduce((s, x) => s + x.pts, 0)), lignes, repondues: rep, questions: total };
  },
  scoreLigne(l, ana){ try { return this.score(l.p, l.ch, l.dc, l.act, JournalEmails.pour(l.p.id), ana); } catch(e){ return null; } },
  pastilleScore(sc){ return sc ? `<span class="pastille${sc.total >= 70 ? " ok" : sc.total >= 40 ? " accent" : ""}" title="Score de qualification sur 100">${sc.total}/100</span>` : ""; },
  CLASSES: { nouveau: "accent", chaud: "chaud", tiede: "tiede", froid: "froid", signe: "ok", perdu: "manque", absent: "attention" },
  pastille(a){ return a ? `<span class="pastille ${this.CLASSES[a.etat] || ""}" title="${esc(a.raisons.join(" "))}">${esc(this.ETATS[a.etat] || "")}</span>` : ""; },
  pastilleLigne(l){ return this.pastille(this.analyseLigne(l)); },
  bouton(p, act, txt, cls){ return `<button type="button" class="btn petit${cls === "principal" ? "" : " ghost"}" data-sc="${act}" data-uid="${esc(p.id)}" data-nom="${esc(Clients.nom(p))}">${esc(txt)}</button>`; },
  boutons(p, a, fiche){
    const b = (act, txt, cls) => this.bouton(p, act, txt, cls);
    return (fiche ? "" : b("fiche", "Ouvrir la fiche")) + (a.issue
      ? (a.issue === "signe" && p.statut === "prospect" ? b("client", "Passer client", "principal") : "") + b("relance", "J'ai relancé") + b("annuler", "Annuler « " + this.ISSUES[a.issue] + " »")
      : b("relance", "J'ai relancé") + b("signe", "Signé") + b("perdu", "Perdu") + b("absent", "Absent"));
  },
  sousTitre(p, a){
    const i = this.depuis(p && p.cree_le);
    /* v52 : plus de « J n/7 » ni de « terminée » (la suite dit deja depuis quand il est inscrit) */
    return "Découverte" + (a.questionnaire ? " · questionnaire rempli" : " · questionnaire à remplir") + " · inscrit " + (a.inscritHeures != null && a.inscritHeures < 24 ? (a.inscritHeures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(a.inscritHeures) + " h") : this.quand(i)) + (a.relances ? " · " + a.relances + " relance" + (a.relances > 1 ? "s" : "") : "");
  },
  carteHTML(p, a, x){
    const nom = Clients.nom(p);
    /* v51 : x = { sc (score), dc (questionnaire resume) } — page Prospects */
    const dc = x && x.dc ? x.dc : null;
    /* v52 (lot G) : l'objectif posé par l'app depuis sa réponse « problème » n'est pas répété ; ses réponses « problème »
       et « dans 3 mois » (tronquée) sur une ligne à part */
    const objectif = dc && !(dc.probleme && dc.objectif === Decouverte.objectifDepuis(dc.probleme)) ? dc.objectif : "";
    const infos = dc ? [dc.email, p && typeof p.cree_le === "string" ? "inscrit le " + dateFr(Decouverte.dateLocale(p.cree_le) || "") : "", objectif].filter(Boolean) : [];
    const reponses = dc ? [dc.probleme ? "Problème : " + dc.probleme : "", dc.projection ? "Dans 3 mois : « " + Decouverte.extrait(dc.projection, 100) + " »" : ""].filter(Boolean) : [];
    return `<article class="sc-carte${a.urgent ? " urgent" : ""}" data-uid="${esc(p.id)}">
      <div class="sc-tete">${Clients.avatar(nom)}<div class="sc-nom"><b>${esc(nom)}</b><small>${esc(this.sousTitre(p, a))}</small></div>${x && x.sc ? this.pastilleScore(x.sc) + " " : ""}${this.pastille(a)}</div>
      ${infos.length ? `<p class="sc-infos">${esc(infos.join(" · "))}</p>` : ""}
      ${reponses.length ? `<p class="sc-infos sc-reponses">${esc(reponses.join(" · "))}</p>` : ""}
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <ul class="sc-raisons">${a.raisons.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="sc-boutons">${this.boutons(p, a, false)}</div>
      <span class="msg sc-msg" role="status" aria-live="polite"></span>
    </article>`;
  },
  /* l'historique des actions du coach (relances, issues), du plus recent au plus ancien */
  histoHTML(S){
    const h = (Array.isArray(this.suivi(S).historique) ? this.suivi(S).historique : []).filter(e => e && typeof e === "object" && typeof e.le === "string").slice(-6).reverse();
    if (!h.length) return "";
    const lib = e => e.type === "relance" ? "Relance" : e.type === "annule" ? "Issue annulée" + (this.ISSUES[e.valeur] ? " (" + this.ISSUES[e.valeur] + ")" : "") : e.type === "issue" && this.ISSUES[e.valeur] ? "Appel : " + this.ISSUES[e.valeur] : "";
    return `<p class="note" style="margin:10px 0 4px">Historique</p><ul class="sc-raisons sc-histo">${h.filter(lib).map(e => `<li>${esc(lib(e) + " — " + dateFr(e.le) + (typeof e.note === "string" && e.note ? " — " + e.note : ""))}</li>`).join("")}</ul>`;
  },
  ficheHTML(p, a, S){
    return `<section class="panel sc-fiche${a.urgent ? " urgent" : ""}"><div class="seance-c-tete"><h2>Suivi commercial</h2>${this.pastille(a)}</div>
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <ul class="sc-raisons">${a.raisons.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="sc-boutons">${this.boutons(p, a, true)}</div>${this.histoHTML(S)}
      <span class="msg sc-msg" role="status" aria-live="polite"></span>
      <p class="note" style="margin:10px 0 0">La température se recalcule à chaque ouverture. Seuls l'issue de l'appel et tes relances sont enregistrés, jamais visibles par le prospect.</p></section>`;
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
   OUTIL COACH — Prospects (v49). Tous les comptes gratuits, du plus
   chaud au plus froid : temperature, raisons, prochaine action, issue.
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   JOURNAL DES EMAILS (v51) — table emails_prospects, remplie par la fonction Supabase « emails-prospects »
   (bienvenue, resultat, relance ; ouvertures et clics renvoyés par Brevo). Lue par le coach
   seulement (score « email ouvert », chronologie de la fiche). Tant que la table n'existe pas (migration
   pas appliquée, fonction pas déployée), la lecture échoue sans bruit : rien n'est affiché, le bonus du
   score reste « pas encore mesuré ».
   ------------------------------------------------------------------ */
const JournalEmails = {
  _parUser: null, _ok: false,
  MODELES: { bienvenue: "bienvenue", resultat: "ton résultat", relance: "relance", questionnaire: "rappel du questionnaire" },   // « questionnaire » : ancien nom, gardé pour l'affichage
  async charger(){
    if (!Auth.estCoach()) return null;
    try {
      /* par pages de 1 000 (Supabase coupe au-dela sans prevenir), dans un ordre stable */
      const l = await Clients.pages("/rest/v1/emails_prospects?select=id,user_id,modele,statut,envoye_le,ouvert_le,clique_le&order=id.asc", x => String(x && x.user_id) + "|" + String(x && x.modele));
      const m = new Map();
      (Array.isArray(l) ? l : []).forEach(x => { if (x && typeof x.user_id === "string"){ const t = m.get(x.user_id) || []; t.push(x); m.set(x.user_id, t); } });
      this._parUser = m; this._ok = true;
    } catch(e){ this._parUser = null; this._ok = false; }
    return this._parUser;
  },
  /* la liste des emails d'un prospect ; null = journal indisponible (pas encore déployé) */
  pour(uid){ return this._ok && this._parUser ? (this._parUser.get(uid) || []) : null; }
};

/* ------------------------------------------------------------------
   NOUVEAUTÉS (v51) — pour le coach : ce que ses prospects ont fait depuis sa dernière visite
   (inscriptions, questionnaires remplis, clics « Réserver mon bilan », bilans réservés), calculé à partir
   des données déjà chargées par le tableau de bord ou la page Prospects (aucune requête de plus). Seule la
   date de dernière visite est rangée, dans la clé du coach « coach_notifs » = { vu: instant } (première
   fois : les 7 derniers jours). Badge sur l'onglet Prospects. Pas de notification push ni d'email :
   l'app n'a pas de serveur d'envoi.
   ------------------------------------------------------------------ */
const Nouveautes = {
  cle: "coach_notifs",
  JOURS_PAR_DEFAUT: 7,
  n: 0, _vu: undefined, _lecture: null, erreur: false, _deplie: false, _tCharge: null,
  TYPES: { inscription: "inscription", questionnaire: "questionnaire rempli", clic: "clic « Réserver mon bilan »", reserve: "bilan réservé" },
  COURTS: { inscription: ["inscription", "inscriptions"], questionnaire: ["questionnaire rempli", "questionnaires remplis"], clic: ["clic « Réserver »", "clics « Réserver »"], reserve: ["bilan réservé", "bilans réservés"] },
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
      ajoute(l, "reserve", Decouverte.reserve(l.ch));
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

const outilProspects = {
  id: "prospects",
  cle: null,
  nom: "Prospects",
  icone: "🎯",
  role: "coach",
  sans_entete: true,
  titre: "Prospects",
  accroche: "",
  /* v51 : filtres (gardes le temps de la session), recherche, tri, pagination par 50, export CSV */
  filtre: "a_traiter", periode: "tout", progression: "tout", tri: "priorite", recherche: "",
  PAS: 50, limite: 50,
  donnees: null, lignes: [], tous: [],
  html(){ return `<div id="pr-vue"><header class="masthead"><h1>Prospects</h1></header><section class="panel"><div class="empty">Chargement…</div></section></div>`; },
  /* garder = rechargement apres une action sur une carte : le coach garde sa place (nombre de prospects affiches) */
  async init(garder){
    const zone = $("pr-vue"); if (!zone) return;
    if (!garder && typeof Nouveautes !== "undefined") Nouveautes._deplie = false;
    const t0 = new Date().toISOString();
    try { [this.donnees] = await Promise.all([Clients.charger(), JournalEmails.charger()]); }
    catch(e){ zone.innerHTML = `<header class="masthead"><h1>Prospects</h1></header><section class="panel"><div class="empty">Impossible de charger les prospects pour le moment.</div></section>`; return; }
    if (!zone.isConnected) return;
    if (!garder) this.limite = this.PAS;
    this.tCharge = t0;
    this.rendre(zone);
  },
  /* chaque prospect : sa ligne (Clients.resumer), son analyse (statut, action) et son score */
  preparer(){
    const { profils, parClient, contenus } = this.donnees;
    this.lignes = Clients.resumer(profils, parClient, contenus);
    this.tous = this.lignes.filter(l => l.p.statut === "prospect").map(l => { const a = Commercial.analyseLigne(l); return { l, a, sc: a ? Commercial.scoreLigne(l, a) : null }; }).filter(x => x.a);
  },
  norm(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); },
  statutOk(x, f){ return f === "tous" ? true : f === "a_traiter" ? x.a.urgent : f === "issues" ? !!x.a.issue : x.a.etat === f; },
  passe(x){
    if (!this.statutOk(x, this.filtre)) return false;
    const h = x.a.inscritHeures;
    if (this.periode !== "tout"){ const lim = { "24h": 24, "7j": 168, "30j": 720 }[this.periode]; if (!(h != null && h < lim)) return false; }
    if (this.progression === "sans_q" && x.a.questionnaire) return false;
    if (this.progression === "q_fait" && !x.a.questionnaire) return false;
    if (this.progression === "clic" && !x.a.clics) return false;
    if (this.progression === "reserve" && !x.a.reserve) return false;
    const q = this.norm(this.recherche);
    if (q){ const dc = x.l.dc || {}; if ((this.norm(Clients.nom(x.l.p)) + " " + this.norm(dc.email)).indexOf(q) === -1) return false; }
    return true;
  },
  trier(liste){
    const t = v => { const x = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(x) ? 0 : x; };
    const cmp = this.tri === "score" ? (x, y) => ((y.sc ? y.sc.total : 0) - (x.sc ? x.sc.total : 0)) || x.a.rang - y.a.rang
              : this.tri === "inscription" ? (x, y) => t(y.l.p.cree_le) - t(x.l.p.cree_le)
              : this.tri === "activite" ? (x, y) => x.a.recence - y.a.recence || x.a.rang - y.a.rang
              : (x, y) => x.a.rang - y.a.rang || x.a.recence - y.a.recence;
    return liste.slice().sort(cmp);
  },
  rendre(zone){
    this.preparer();
    const tous = this.tous;
    /* issues des 30 derniers jours, clients compris (un prospect signe puis passe client reste compte) */
    const mois = this.lignes.map(l => Commercial.suivi(l.suivi)).filter(S => typeof S.issue === "string" && Commercial.depuis(S.issue_le) != null && Commercial.depuis(S.issue_le) <= 30);
    const n = e => tous.filter(x => x.a.etat === e).length, cmpt = k => mois.filter(S => S.issue === k).length;
    const pl = (k, sg, p) => k > 1 ? p : sg;
    const moy = tous.length ? Math.round(tous.reduce((s, x) => s + (x.sc ? x.sc.total : 0), 0) / tous.length) : 0;
    const tuile = (lbl, val, sub, cls) => `<div class="tile"><div class="t-lbl">${lbl}</div><div class="t-val readout${cls ? " " + cls : ""}">${val}</div><div class="t-sub">${sub}</div></div>`;
    const opt = (v, t, cur) => `<option value="${v}"${v === cur ? " selected" : ""}>${esc(t)}</option>`;
    const cfg = Commercial.cfg();
    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(outilAccueil.dateLongue())}</span>
        <h1>Prospects</h1>
        <p class="lede">${tous.length ? `${tous.length} ${pl(tous.length, "compte gratuit", "comptes gratuits")} · ${n("nouveau")} ${pl(n("nouveau"), "nouveau", "nouveaux")}, ${n("chaud")} ${pl(n("chaud"), "chaud", "chauds")}, ${n("tiede")} ${pl(n("tiede"), "tiède", "tièdes")}, ${n("froid")} ${pl(n("froid"), "froid", "froids")} · score moyen ${moy}/100` : "Aucun prospect pour l'instant."}</p>
      </header>
      <div id="pr-nouveautes"></div>
      <section class="panel"><div class="tiles">
        ${tuile("À traiter", tous.filter(x => x.a.urgent).length, "une action à faire")}
        ${tuile("Nouveaux", n("nouveau"), "moins de 24 h")}
        ${tuile("Chauds", n("chaud"), "bilan réservé", n("chaud") ? "pos" : "")}
        ${tuile("Score moyen", moy + "<small>/100</small>", "qualification")}
        ${tuile("Signés", cmpt("signe"), "30 derniers jours", "pos")}
        ${tuile("Perdus", cmpt("perdu"), "30 derniers jours")}
        ${tuile("Absents", cmpt("absent"), "30 derniers jours")}
      </div></section>
      <section class="panel">
        <div class="seg sc-filtres" role="group" aria-label="Filtrer par statut">${[["a_traiter", "À traiter"], ["nouveau", "Nouveaux"], ["chaud", "Chauds"], ["tiede", "Tièdes"], ["froid", "Froids"], ["issues", "Appel fait"], ["tous", "Tous"]].map(f => `<button type="button" data-filtre="${f[0]}" aria-pressed="${this.filtre === f[0]}">${esc(f[1])} <span class="meta">${tous.filter(x => this.statutOk(x, f[0])).length}</span></button>`).join("")}</div>
        <div class="pr-outils">
          <input type="search" id="pr-q" placeholder="Rechercher un nom ou un email" aria-label="Rechercher un prospect par nom ou email" value="${esc(this.recherche)}" autocomplete="off">
          <select id="pr-periode" aria-label="Date d'inscription">${opt("tout", "Inscrits : tous", this.periode)}${opt("24h", "Inscrits : 24 dernières heures", this.periode)}${opt("7j", "Inscrits : 7 derniers jours", this.periode)}${opt("30j", "Inscrits : 30 derniers jours", this.periode)}</select>
          <select id="pr-prog" aria-label="Progression">${opt("tout", "Progression : toutes", this.progression)}${opt("sans_q", "Questionnaire à remplir", this.progression)}${opt("q_fait", "Questionnaire rempli", this.progression)}${opt("clic", "A cliqué « Réserver »", this.progression)}${opt("reserve", "Bilan réservé", this.progression)}</select>
          <select id="pr-tri" aria-label="Trier">${opt("priorite", "Tri : priorité", this.tri)}${opt("score", "Tri : score", this.tri)}${opt("inscription", "Tri : inscription récente", this.tri)}${opt("activite", "Tri : activité récente", this.tri)}</select>
          <button type="button" class="btn ghost petit" id="pr-csv">Exporter (CSV)</button>
        </div>
        <p class="note" id="pr-compte" role="status" aria-live="polite" style="margin:4px 0 10px"></p>
        <div id="pr-liste"></div>
        <p class="note" style="margin:12px 0 0">NOUVEAU : inscrit depuis moins de ${cfg.nouveau_heures} h, ni questionnaire rempli, ni clic, ni réservation. CHAUD : bilan réservé. TIÈDE : questionnaire rempli (ou clic « Réserver » dans ses premières ${cfg.nouveau_heures} h), pas encore de réservation. FROID : questionnaire pas rempli passé ${cfg.nouveau_heures} h, aucune action depuis ${cfg.inactif_jours} jours, ou ${cfg.relances_max} relances sans réponse. Score sur 100 : inscription 10, questionnaire 30, clic « Réserver mon bilan » 30, bilan réservé 30, bonus visites, temps passé et email ouvert. Ces seuils se changent en une ligne, sur demande.</p>
      </section>`;
    $$("[data-filtre]", zone).forEach(b => b.addEventListener("click", () => {
      this.filtre = b.dataset.filtre; this.limite = this.PAS;
      $$("[data-filtre]", zone).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      this.majListe(zone);
    }));
    const q = zone.querySelector("#pr-q"); let minuteur = null;
    if (q) q.addEventListener("input", () => { clearTimeout(minuteur); minuteur = setTimeout(() => { this.recherche = q.value.slice(0, 120); this.limite = this.PAS; this.majListe(zone); }, 200); });
    [["#pr-periode", "periode"], ["#pr-prog", "progression"], ["#pr-tri", "tri"]].forEach(([sel, k]) => {
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
    if (typeof Nouveautes !== "undefined") Nouveautes.monter(zone.querySelector("#pr-nouveautes"), this.lignes, true, this.tCharge);
  },
  /* la liste seule (les filtres ne redessinent pas la recherche : le curseur y reste) */
  majListe(zone){
    const boite = zone.querySelector("#pr-liste"), compte = zone.querySelector("#pr-compte"); if (!boite) return;
    const liste = this.trier(this.tous.filter(x => this.passe(x)));
    const vus = liste.slice(0, this.limite);
    if (compte) compte.textContent = liste.length === this.tous.length ? liste.length + " prospect" + (liste.length > 1 ? "s" : "") : liste.length + " sur " + this.tous.length + " prospect" + (this.tous.length > 1 ? "s" : "");
    boite.innerHTML = vus.length
      ? `<div class="sc-liste">${vus.map(x => Commercial.carteHTML(x.l.p, x.a, { sc: x.sc, dc: x.l.dc })).join("")}</div>`
        + (liste.length > vus.length ? `<div class="actions pr-plus"><button type="button" class="btn ghost" id="pr-plus">Afficher ${Math.min(this.PAS, liste.length - vus.length)} de plus (${liste.length - vus.length} restant${liste.length - vus.length > 1 ? "s" : ""})</button></div>` : "")
      : `<div class="empty">${this.filtre === "a_traiter" && !this.recherche && this.periode === "tout" && this.progression === "tout" ? "Rien à faire aujourd'hui : aucun prospect n'attend d'action de ta part." : "Aucun prospect ne correspond à ces filtres."}</div>`;
    const plus = boite.querySelector("#pr-plus");
    if (plus) plus.addEventListener("click", () => { this.limite += this.PAS; this.majListe(zone); });
    Commercial.brancher(boite, async () => { if (!zone.isConnected) return; const y = window.scrollY; await this.init(true); if (zone.isConnected) window.scrollTo(0, y); });
  },
  /* export CSV (point-virgule, UTF-8 avec BOM : s'ouvre tel quel dans Excel en français). Une cellule qui commence
     par = + - @ est neutralisee (apostrophe) : un prenom piege ne devient jamais une formule dans le tableur. */
  csv(liste){
    const cell = v => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const dt = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : "";
    const tete = ["Nom", "Email", "Inscrit le", "Découverte", "Objectif", "Statut", "Score /100", "Questionnaire", "Motivation /10", "Clics « Réserver mon bilan »", "Dernier clic", "Bilan réservé le", "Relances", "Dernière activité", "Prochaine action"];
    tete.push("Problème", "Dans 3 mois", "Newsletter");   // v52 (lot G) : 2 des 3 réponses et la newsletter (oui / non), en fin de ligne
    const lignes = liste.map(({ l, a, sc }) => {
      const dc = l.dc || {}; let r = null; try { r = Decouverte.resume(l.p, l.ch, dc); } catch(e){ r = null; }
      const motiv = (typeof dc.motivation === "string" || typeof dc.motivation === "number") ? String(dc.motivation).slice(0, 3) : "";
      return [Clients.nom(l.p), dc.email || "", dt(l.p.cree_le), a.jour == null ? "" : Decouverte.depuisTexte(a.jour), dc.objectif || "",
              Commercial.ETATS[a.etat] || String(a.etat), sc ? sc.total : "", a.questionnaire ? "rempli le " + dt(dc.court_le) : (sc ? sc.repondues + "/" + sc.questions + " réponses" : ""),
              motiv, r ? r.clics : 0, r ? dt(r.dernierClic) : "", r ? dt(r.reserve) : "", a.relances, dt(l.activite), a.action]
             .concat([dc.probleme || "", dc.projection || "", l.newsletter && l.newsletter.oui ? "oui" : "non"]);
    });
    return "﻿" + [tete].concat(lignes).map(ligne => ligne.map(cell).join(";")).join("\r\n") + "\r\n";
  },
  telecharger(texte, nom){
    const url = URL.createObjectURL(new Blob([texte], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = nom; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
};

