/* ------------------------------------------------------------------
   LISTE DES OUTILS — ajouter un objet ici suffit à créer un onglet
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   OUTIL — Accueil (v34). Le tableau de bord du client : en cinq secondes,
   ou il en est cette semaine, et quoi faire aujourd'hui. Il ne fait que
   LIRE (une seule requete) et reutilise Regularite, le journal, les repas
   coches, les mesures et les objectifs du mois tels qu'ils existent.
   Le coach le voit en consultant une fiche (« Vue d'ensemble »).
   ------------------------------------------------------------------ */
const outilAccueil = {
  id: "accueil",
  onglet: null,   // v83 (bloc 3) : l'onglet de la fiche consultée ({ uid, nom : "suivi" | "compte" })
  cle: null,
  nom: "Accueil",
  icone: "🏠",
  principal: true,
  client_seul: true,
  sans_entete: true,
  titre: "Accueil",
  accroche: "",

  html(){ return `<div id="acc-vue"><header class="masthead"><h1>Bonjour</h1></header><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  dateLongue(){
    const t = new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  },

  /* le poids : derniere mesure, et l'ecart avec la precedente (ou le depart) */
  poids(M){
    const l = (M.mesures || []).filter(m => m.poids != null && isFinite(m.poids)).slice().sort((a, b) => a.sem - b.sem);
    if (!l.length) return null;
    const der = l[l.length - 1];
    const ref = l.length > 1 ? l[l.length - 2].poids : (M.pstart != null && isFinite(M.pstart) ? M.pstart : null);
    return { actuel: der.poids, delta: ref == null ? null : der.poids - ref, sem: der.sem };
  },

  /* la prochaine seance a noter cette semaine */
  prochaineSeance(P, J, bornes){
    const seances = (P.seances || []).map((sc, si) => ({ sc, si })).filter(x => (x.sc.exercices || []).some(e => e.nom));
    if (!seances.length) return null;
    const faites = new Set((J.seances || []).filter(x => x.date >= bornes.debut && x.date <= bornes.fin).map(x => x.si));
    const reste = seances.filter(x => !faites.has(x.si));
    return { prochaine: reste.length ? reste[0] : null, faites: faites.size, total: seances.length };
  },

  /* ---------- ACCUEIL DU MODE GRATUIT : l'ecran Decouverte (questionnaire court, resultat, bilan). Aucun prix. */
  async gratuit(zone){ return outilDecouverte.afficher(zone); },
  /* bloc « Découverte » de la fiche d'un prospect : jour, questionnaire court, clics, bilan reserve (lecture seule)
     v53 (chantier 4) : plus de score ; « Bilan réservé » suit la coche du coach (Commercial.bilan), la case du prospect
     reste lisible comme info ; dernière visite et jours actifs sur 30 jours */
  decouverteFicheHTML(p, C, I, S, A, EM){
    try { return this._decouverteFicheHTML(p, C, I, EM, S, A) + this.prospectDetailHTML(p, C, (I && typeof I === "object") ? I : {}, S, A); }
    catch(e){ console.warn("[MHX] bloc découverte illisible", e); return `<section class="panel" id="fiche-decouverte"><h2>Découverte</h2><div class="empty">Données de la découverte illisibles — à vérifier.</div></section>`; }
  },
  _decouverteFicheHTML(p, C, I, EM, S, A){
    I = (I && typeof I === "object") ? I : {};
    const r = Decouverte.resume(p, C, I), B = Commercial.bilan(S, C, p), V = Activite.lecture(A, true);
    /* tout ce qui vient du prospect passe par s() (chaine ou nombre, sinon rien) ou dt() (date en chaine, sinon —) */
    const s = v => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 400) : "";
    const dt = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : "—";
    /* v52 : plus de « jour n / 7 » ni de « terminée » : le nombre de jours depuis son inscription */
    const jourTxt = r.jour == null ? "date d'inscription inconnue" : Decouverte.depuisTexte(r.jour);
    /* v52 (lot G) : son nom (profils.nom, demandé à l'inscription), la newsletter (clé emails), puis ses réponses qui ont
       une valeur : les 3 questions d'abord, puis les anciennes (Decouverte.reponsesCoach).
       v74 : le nom n'est plus demandé à l'inscription : la ligne « Nom » n'apparaît que s'il existe (comptes d'avant) */
    const nl = Accords.newsletterCoach(EM);
    const lignes = [
      ["Découverte", jourTxt + (p && typeof p.cree_le === "string" ? " · inscrit le " + dt(p.cree_le) : "")],
      ["Nom", s(p && p.nom).trim()],
      ["Newsletter", nl.oui ? "oui" + (nl.depuis ? " (depuis le " + dt(nl.depuis) + ")" : "") : "non"],
      ["Questionnaire court", r.questionnaire ? "rempli le " + dt(r.questionnaire) : "pas encore rempli"]
    ].concat(Decouverte.reponsesCoach(I), [
      /* v65 (décision de Lucas du 30/09) : le nom du bouton d'aujourd'hui, comme la chronologie (avant : « Réserver mon bilan ») */
      ["Bouton « Réserver mon plan d'action »", r.clics ? r.clics + " clic" + (r.clics > 1 ? "s" : "") + (r.dernierClic ? ", le dernier le " + dt(r.dernierClic) : "") : "jamais cliqué"],
      /* v59 : une coche ou une case d'avant l'issue « Absent » / « Perdu » le dit (elle a servi à cet appel) */
      ["Bilan réservé", B.coach ? "oui, coché par toi le " + dt(B.coach) + (Commercial.avantIssue(S, B.coach) ? ", avant l'appel" : "")
        : B.source === "prospect" ? (Commercial.avantIssue(S, B.case) ? "case cochée par le prospect avant l'appel" : "à vérifier : le prospect a coché sa case") : B.retire ? "non (tu l'as retiré le " + dt(B.retire) + ")" : "non"],
      ["Case « J'ai réservé mon bilan »", r.reserve ? "Le prospect a coché « J'ai réservé » le " + dt(r.reserve) : "pas cochée"],
      ["Dernière visite", Activite.texteVisite(V) + (V.derniere ? " (le " + dt(V.derniere) + ")" : "")],
      ["Jours actifs (30 j)", Activite.texteJours(V)]
    ]);
    const ligne = (k, v) => v ? `<li><span>${esc(k)}</span><b>${esc(String(v))}</b></li>` : "";
    const pastilles = (r.jour != null ? `<span class="pastille">${Decouverte.depuisTexte(r.jour)}</span>` : "")
      + (B.reserve ? " " + Commercial.pastilleBilan(B) : r.clics ? ` <span class="pastille accent">a cliqué Plan d'action</span>` : "");
    return `<section class="panel" id="fiche-decouverte"><div class="seance-c-tete"><h2>Découverte</h2>${pastilles}</div>
      <ul class="ingr fiche-l">${lignes.map(x => ligne(x[0], x[1])).join("")}</ul>
      <p class="note" style="margin:10px 0 0">Lecture seule : rien ne s'écrit d'ici.</p></section>`;
  },

  /* v51 — detail d'un prospect pour le coach : reponses, chronologie, lien de reservation, email (v53 : plus de score
     ni de journal des emails). Lecture seule : tout ce qui vient du prospect passe par s() / dt() et esc(). */
  prospectDetailHTML(p, C, I, S, A){
    const s = v => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 400) : "";
    const dt = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : "—";
    const heure = v => { if (typeof v !== "string" || v.length <= 10) return ""; const d = new Date(v); return isNaN(d) ? "" : " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    const nbQ = Decouverte.liste(I).length || (CONFIG.decouverte.questions || []).length;
    /* v52 : les questions de SON questionnaire court (les 3 nouvelles, ou les 10 d'un ancien prospect), puis celles de
       l'autre qui ont une valeur : les anciennes reponses restent lisibles. Lot G : libelles courts du coach (Problème…) */
    const qs = Decouverte.reponsesCoach(I, true);
    /* email_compte : l'email du compte, copie par l'app (v51) ; a defaut, le champ « Email » du questionnaire complet */
    const email = s(I.email_compte).trim() || s(I.email).trim();
    const rep = [["Email", email]].concat(qs);
    const repHTML = `<section class="panel" id="fiche-reponses"><h2>Réponses au questionnaire court</h2>
      <p class="note" style="margin:0 0 8px">${Decouverte.repondues(I)} / ${nbQ} réponses${Decouverte.questionnaireFait(I) ? ", validé le " + esc(dt(I.court_le)) : ", pas encore validé"}.</p>
      <ul class="ingr fiche-l">${rep.map(([k, v]) => `<li><span>${esc(k)}</span><b>${v ? esc(v) : "—"}</b></li>`).join("")}</ul></section>`;
    const ev = [];
    const futur = Date.now() + 5 * 60000;
    const ajoute = (quand, texte) => { if (typeof quand === "string" && /^\d{4}-\d{2}-\d{2}/.test(quand) && !isNaN(Date.parse(quand)) && Date.parse(quand) <= futur) ev.push({ t: Date.parse(quand), quand, texte }); };
    ajoute(p && p.cree_le, "Inscription");
    ajoute(I.court_debut, "Questionnaire commencé");
    ajoute(I.court_le, "Questionnaire rempli");
    /* v63 : ancien ou nouveau code, le nom de l'ecran d'aujourd'hui (Decouverte.nomOrigine, comme « Mesure » et la carte) ;
       affichage seulement, rien n'est reecrit en base */
    Decouverte.clics(C).forEach(c => { const o = Decouverte.nomOrigine(c.source); ajoute(c.date, "Clic « Réserver mon plan d'action »" + (o ? " (" + o + ")" : "")); });
    ajoute(Decouverte.reserve(C), "Le prospect a coché « J'ai réservé »");
    const hist = S && typeof S === "object" && Array.isArray(S.historique) ? S.historique : [];
    hist.forEach(e => {
      if (!e || typeof e !== "object") return;
      const lib = e.type === "relance" ? "Tu l'as relancé" : e.type === "annule" ? "Issue annulée" : e.type === "issue" && typeof e.valeur === "string" && Object.prototype.hasOwnProperty.call(Commercial.ISSUES, e.valeur) ? "Appel : « " + Commercial.ISSUES[e.valeur] + " »" + (typeof e.note === "string" && e.note ? " — " + e.note.slice(0, 200) : "")
        : e.type === "bilan" && e.valeur === "reserve" ? "Tu as coché « Bilan réservé »" : e.type === "bilan" && e.valeur === "annule" ? "Tu as retiré « Bilan réservé »" : "";
      if (lib) ajoute(e.le, lib);
    });
    const act = Activite.propre(A);
    ajoute(act.derniere, "Dernière visite dans l'app");
    ev.sort((x, y) => y.t - x.t);
    const pages = Object.keys(act.pages).sort((x, y) => act.pages[y] - act.pages[x]).slice(0, 8).map(k => k + " (" + act.pages[k] + ")").join(", ");
    const chronoHTML = `<section class="panel" id="fiche-chrono"><h2>Chronologie</h2>
      ${ev.length ? `<ol class="dc-chrono">${ev.slice(0, 40).map(e => `<li><time datetime="${esc(e.quand)}">${esc(dt(e.quand) + heure(e.quand))}</time><span>${esc(e.texte)}</span></li>`).join("")}</ol>` : `<div class="empty">Rien pour l'instant.</div>`}
      <p class="note" style="margin:10px 0 0">${act.jours.length} jour${act.jours.length > 1 ? "s" : ""} d'activité, ${Math.floor(act.temps_s / 60)} min dans l'app${pages ? " · pages vues : " + esc(pages) : ""}.</p></section>`;
    const prenom = s(p && p.prenom).trim(), nomP = s(p && p.nom).trim();
    const emailOk = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) && email.length <= 254;
    const lien = lienCalendlyPour(prenom, emailOk ? email : "", "fiche_coach", nomP);   // v52 : + son nom (inscription)
    const remplis = [prenom && "prénom", nomP && "nom", emailOk && "email"].filter(Boolean);
    const remplisTxt = remplis.length ? " (" + (remplis.length > 1 ? remplis.slice(0, -1).join(", ") + " et " + remplis[remplis.length - 1] : remplis[0]) + " déjà rempli" + (remplis.length > 1 ? "s" : "") + ")" : "";
    const coach = (Auth.profil && typeof Auth.profil.prenom === "string" && Auth.profil.prenom) || "";
    const marque = CONFIG.marque.nom || "MHX Coaching";
    const corps = "Bonjour" + (prenom ? " " + prenom : "") + ",\n\nMerci d'avoir fait ta découverte " + marque + ". Je te propose un bilan de 15 minutes pour faire le point sur ton objectif et voir comment je peux t'aider :\n" + lien + "\n\nÀ très vite,\n" + (coach ? coach + " — " : "") + marque;
    const mailto = emailOk && lien ? "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent("Ton bilan " + marque) + "&body=" + encodeURIComponent(corps) : "";
    const actionsHTML = `<section class="panel" id="fiche-actions"><h2>Contacter</h2>
      ${lien ? `<p class="note" style="margin:0 0 8px">Son lien de réservation${esc(remplisTxt)} :</p><input type="text" id="dc-lien" readonly value="${esc(lien)}" aria-label="Lien de réservation du prospect" style="width:100%">` : ""}
      <div class="actions">${lien ? `<button type="button" class="btn ghost petit" id="dc-copier">Copier le lien</button>` : ""}${mailto ? `<a class="btn petit" id="dc-mail" href="${esc(mailto)}">Lui écrire un email</a>` : `<span class="note">Email inconnu : il apparaît quand le prospect a commencé son questionnaire.</span>`}<span class="msg" id="dc-copie-msg" role="status" aria-live="polite"></span></div>
      <p class="note" style="margin:10px 0 0">« Lui écrire un email » ouvre ta messagerie avec un message prêt, que tu relis avant d'envoyer. Rien n'est envoyé par l'app.</p></section>`;
    return repHTML + chronoHTML + actionsHTML;
  },

  /* ---------- FICHE CLIENT (v37, phase 18) ----------
     Ce que le coach voit en ouvrant un client : tout l'etat en une page,
     avec un lien vers l'editeur de chaque bloc. Lecture seule ici. Les
     notes privees et les feedbacks arrivent avec les phases 10 et 18. */
  async fiche(zone){
    const cles = ["intake", "programme", "journal", "repas", "repas_suivi", "mens", "objectifs_faits", "checkins", "complements", "calc", "formation", "hist_programme", "hist_repas", "prefs", "feedbacks", "challenge", "suivi_prospect", "activite", "emails", "contact"];   // v47 : + challenge ; v49 : + suivi commercial ; v51 : + activite ; v52 : + emails (newsletter d'un prospect) ; v72 : + contact (numéro)
    const uidFiche = Store.idConsulte;
    /* v79 : son journal alimentaire (s'il lui est ouvert : interrupteur) et son propre calcul (l'objectif du journal) */
    const avecJA = JournalAlim.pourCompte(uidFiche);
    if (avecJA) cles.push("journal_alimentaire", "calc_perso");
    const [{ valeurs: d, dates }, pr, cx] = await Promise.all([
      Store.lireTout(cles, { dates: true }),
      /* v39 : prospect ou client ? (colonne absente ou lecture ratee : rien ne change) */
      Auth.appel("/rest/v1/profils?id=eq." + uidFiche + "&select=*").then(r => Array.isArray(r) ? r[0] || null : null).catch(() => null),
      /* v83 (bloc 3) : sa dernière connexion et le nombre de ses connexions (onglet Compte), comme dans Mes clients ; lecture
         ratée (table absente, panne) : « — », le reste de la fiche s'affiche */
      Auth.appel("/rest/v1/connexions?user_id=eq." + uidFiche + "&select=user_id,nombre,derniere,premiere").then(r => ({ lue: Array.isArray(r), ligne: Array.isArray(r) ? r[0] || null : null })).catch(() => ({ lue: false, ligne: null }))
    ]);
    if (!zone.isConnected || Store.idConsulte !== uidFiche) return;   // on a change de fiche entre-temps
    const I = d.intake || {}, P = d.programme || {}, J = d.journal || { seances: [] }, R = d.repas || {}, S = d.repas_suivi || {}, M = d.mens || {}, CK = d.checkins || { liste: [] };
    if (!Array.isArray(J.seances)) J.seances = [];
    const nomC = Store.nomConsulte || "Client";
    const profil = { id: Store.idConsulte, prenom: nomC.split(" ")[0], nom: nomC.split(" ").slice(1).join(" "), role: "client" };
    if (pr && "statut" in pr) profil.statut = pr.statut;
    const ecritParCoach = ["programme", "repas", "calc", "complements", "feedbacks", "notes_coach", "suivi_prospect"];
    /* v51 : les pages vues (activite) ne sont une activite que pour un prospect, comme dans Mes clients ;
       v52 : le choix de la newsletter (emails) n'est pas une saisie, comme dans Mes clients (pasSaisie) ;
       v59 (Q13-4) : checkins compte par ses vraies saisies (Clients.dateSaisie : ni smiley, ni « réponse vue »), comme dans Mes clients */
    const dernier = Object.keys(dates).filter(k => ecritParCoach.indexOf(k) === -1 && k !== "emails" && k !== "contact" && dates[k] && (k !== "activite" || profil.statut === "prospect")).map(k => Clients.dateSaisie(k, dates[k], d[k])).filter(Boolean).sort().pop() || null;
    const l = Clients.resumerUn(profil, d, dernier);
    const r = Regularite.calculer({ programme: P, journal: J, repas: R, repas_suivi: S, mens: M }, 0), prec = Regularite.calculer({ programme: P, journal: J, repas: R, repas_suivi: S, mens: M }, -1);
    const b = outilBilan.calculer({ programme: P, journal: J, repas: R, repas_suivi: S, mens: M, objectifs_faits: d.objectifs_faits || {} });
    const av = outilProgramme.avancement(P);
    const seances = (P.seances || []).filter(sc => (sc.exercices || []).some(e => e.nom));
    const derniereSeance = J.seances.length ? J.seances[J.seances.length - 1] : null;
    const e = Checkin.etat(CK, uidFiche);
    /* v53 (chantier 3) : la regle de ce client ; feedback du dimanche : « reçu », ou « non fait » des le lundi */
    const dim = e.semaine.regle === "dimanche";
    const dernierCk = (CK.liste || []).length ? CK.liste[CK.liste.length - 1] : null;
    const fbCk = dernierCk ? Feedback.repond(d.feedbacks, dernierCk) : null;
    const fbAvant = (dernierCk && !fbCk) ? Feedback.pour(d.feedbacks, dernierCk.semaine) : null;
    const obj = (P.objectifs && (P.objectifs.liste || []).some(Boolean)) ? P.objectifs : null;
    const cible = R.cible || null;
    const nbJours = (R.jours || []).filter(j => (j.repas || []).length).length;
    const nbCompl = ((d.complements || {}).liste || []).length;
    const histP = ((d.hist_programme || {}).liste || []).length, histR = ((d.hist_repas || {}).liste || []).length;
    const fo = d.formation ? outilFormation.compte(outilFormation.migrer(d.formation)) : null;
    /* la decouverte d'un prospect (jour depuis l'inscription, questionnaire court, clics, bilan reserve) */
    const pDc = Object.assign({}, profil, pr || {});
    let rdc = null; try { rdc = profil.statut === "prospect" ? Decouverte.resume(pDc, d.challenge, I) : null; } catch(e){ rdc = null; }
    /* v49 : le suivi commercial d'un prospect (un client n'en a plus : son bloc disparait) */
    let SC = null;
    try { if (profil.statut === "prospect") SC = Commercial.analyse(pDc, d.challenge, d.suivi_prospect, dernier, I); } catch(e){ SC = null; }
    const lien = (id, txt) => `<a class="link-a" href="#/${id}">${esc(txt)} →</a>`;
    const ligne = (k, v) => v == null || v === "" ? "" : `<li><span>${esc(k)}</span><b>${esc(String(v))}</b></li>`;
    const alertes = l.alertes;
    /* v83 (bloc 3, maquettes FicheSuivi et FicheCompte) — la même fiche pour un client et un prospect : en-tête (croix =
       retour là d'où l'on vient, initiales, nom, pastille Client ou Prospect, pastille du programme s'il est connu), bouton
       principal (client : « Préparer le call » ; prospect : « WhatsApp » pré-rempli, ou « Pas de numéro ») et bouton rond
       Appeler, puis 2 onglets. Suivi : (prospect : « Ses réponses » puis le « Suivi commercial » complet), le retour de la
       semaine, le poids, la régularité sur 30 jours, questionnaire / programme / diète, le bandeau d'avant (tous les outils du client),
       puis tout ce que la fiche montrait déjà. Compte : email, téléphone, source, rôle (« Changer »), dernière connexion,
       l'accès complet, « Archiver ce compte » / « Restaurer ce compte », la zone rouge « Supprimer définitivement ». */
    const prospectF = profil.statut === "prospect", tel = Contact.telephone(d.contact), arch = Archive.le(d.suivi_prospect);
    const anglais = !!(d.prefs && d.prefs.langue === "en");
    const progNom = seances.length && typeof P.nom === "string" && P.nom.trim() ? P.nom.trim().slice(0, 60) : "";
    const pFiche = Object.assign({}, pr || {}, { id: uidFiche, prenom: pr && typeof pr.prenom === "string" ? pr.prenom : profil.prenom, nom: pr && typeof pr.nom === "string" ? pr.nom : profil.nom, statut: profil.statut });
    const emailF = (typeof I.email_compte === "string" && I.email_compte.trim()) || (typeof I.email === "string" && I.email.trim()) || "";
    const cxF = Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(pFiche), !!(cx && cx.lue));
    const principal = prospectF
      ? boutonWhatsAppVers(tel, MessageProspect.texte(pFiche.prenom, I, anglais), "btn fc-principal", "fc-wa")
      : `<a class="btn fc-principal" id="fc-call" href="${esc(lienOutil("bilan"))}">Préparer le call</a>`;
    const appeler = Telephone.valide(tel) ? `<a class="rond fc-appeler" id="fc-appeler" href="tel:${esc(tel)}" aria-label="${esc(trad("Appeler"))}" title="${esc(trad("Appeler"))}">${SVG.tel}</a>`
      : `<button type="button" class="rond fc-appeler" id="fc-appeler" disabled aria-label="${esc(trad("Appeler : pas de numéro"))}" title="${esc(trad("Pas de numéro"))}">${SVG.tel}</button>`;
    const onglet = this.onglet && this.onglet.uid === uidFiche ? this.onglet.nom : "suivi";
    /* le retour de la semaine (carte de la maquette) : reçu à lire, fait, non fait, ou rien encore */
    const recu = alertes.find(a => a.type === "bilan_recu"), rt = l.retour;
    const retourTexte = recu ? recu.texte : rt && rt.etat ? rt.nom + " : " + rt.texte : (dim ? "Feedback du dimanche" : "Bilan hebdo") + " : " + trad("rien de nouveau");
    /* le poids depuis le début (et sa courbe), les 4 dernières semaines */
    const mesuresP = (M.mesures || []).filter(m => m && m.poids != null && isFinite(m.poids) && typeof m.date === "string").slice().sort((a, b) => a.date < b.date ? -1 : 1).slice(-12).map(m => +m.poids);
    const courbe = mesuresP.length > 1 ? (() => { const W = 300, H = 64, mi = Math.min(...mesuresP), ma = Math.max(...mesuresP), e = (ma - mi) || 1;
      const pts = mesuresP.map((v, i) => [(4 + i * (W - 8) / (mesuresP.length - 1)).toFixed(1), (6 + (ma - v) / e * (H - 12)).toFixed(1)]);
      return `<svg class="fc-courbe" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(trad("Courbe du poids"))}"><line x1="0" x2="${W}" y1="${H / 3}" y2="${H / 3}" class="fc-grille"/><line x1="0" x2="${W}" y1="${2 * H / 3}" y2="${2 * H / 3}" class="fc-grille"/><polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" class="fc-trait"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" class="fc-point"/></svg>`; })() : "";
    const kg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + n1(Math.abs(v)) + " kg";
    /* la régularité sur 30 jours : les jours actifs (visites suivies), sinon le score de la semaine */
    const vis = Activite.lecture(d.activite, Activite.suiviPour(pFiche));
    const regTexte = vis.suivi ? trad("{n} jours actifs sur 30", { n: vis.jours30 }) : r.score != null ? r.score + "/100 " + trad("cette semaine") : "—";
    const regPct = vis.suivi ? Math.round(Math.min(30, vis.jours30) / 30 * 100) : r.score != null ? Math.max(0, Math.min(100, r.score)) : 0;
    const etat = (lib, ok, val, manque) => `<li><span>${esc(lib)}</span><b class="${ok ? "fc-ok" : "fc-manque"}">${ok ? `${esc(val)} <span class="fc-coche" aria-hidden="true">${SVG.coche}</span>` : esc(manque)}</b></li>`;
    /* « Ses réponses » (prospect) : objectif, ce qui bloque, avec ses mots, dans 3 mois, « Tu es ? » ; l'ancien format lisible */
    const qo = Decouverte.defQ("obstacle"), qp = Decouverte.defQ("projection");
    const choixO = Decouverte.choixDe(I, "obstacle"), choixP = Decouverte.choixDe(I, "projection");
    const sansRep = esc(trad("Pas encore répondu"));
    const rep = (lib, v) => `<li><span>${esc(lib)}</span><b data-notr>${v ? esc(v) : `<i class="fc-sans">${sansRep}</i>`}</b></li>`;
    const ancienF = Decouverte.ancien(I);
    const objectifRep = typeof I.probleme === "string" && I.probleme.trim() ? I.probleme.trim() : ancienF && typeof I.objectif === "string" ? I.objectif.trim() : "";
    const bloque = choixO && choixO.length ? choixO.map(k => Decouverte.libelleChoix(qo, k)).filter(Boolean).join(" · ") : "";
    const sesMots = choixO ? Decouverte.precisionDe(I, "obstacle") : (typeof I.obstacle === "string" ? I.obstacle.trim() : "");
    const dans3 = choixP && choixP.length ? Decouverte.texteFr(qp, choixP, Decouverte.precisionDe(I, "projection")) : (typeof I.projection === "string" ? I.projection.trim() : "");
    const reponsesHTML = prospectF ? `<section class="carte fc-carte" id="fc-reponses"><h2 class="fc-sur">${esc(trad("Ses réponses"))}</h2><ul class="fiche-l fc-lignes">
        ${rep(trad("Objectif"), objectifRep)}${rep(trad("Ce qui bloque"), bloque)}${rep(trad("Avec ses mots"), Decouverte.extrait(sesMots, 400))}${rep(trad("Dans 3 mois"), Decouverte.extrait(dans3, 400))}${rep(trad("Tu es ?"), I.sexe === "Homme" || I.sexe === "Femme" ? trad(I.sexe) : "")}</ul>
        ${ancienF ? `<p class="note" style="margin:8px 0 0">${esc(trad("Anciennes réponses (questionnaire d'avant) : toutes dans « Découverte », plus bas."))}</p>` : ""}</section>` : "";
    zone.innerHTML = `
      <div class="fc-tete">
        <div class="fc-haut"><button type="button" class="rond" id="fc-fermer" aria-label="${esc(trad("Fermer la fiche"))}" title="${esc(trad("Fermer la fiche"))}">${SVG.croix}</button></div>
        <header class="masthead fc-masthead"><span class="eyebrow">${esc(trad("Fiche client"))} · ${esc(this.dateLongue())}</span>
        <div class="fc-id"><span class="avatar grand fc-avatar${nomC === Clients.SANS_NOM ? " neutre" : ""}">${esc(Clients.initiales(nomC))}</span>
          <div class="fc-id-t"><h1 data-notr>${esc(nomC)}</h1>
            <div class="fc-pastilles"><span class="pastille fc-role-p">${esc(trad(prospectF ? "Prospect" : "Client"))}</span>${progNom ? `<span class="pastille fc-prog" data-notr>${esc(progNom)}</span>` : ""}${arch ? `<span class="pastille attention fc-archive">${esc(trad("Archivé"))}</span>` : ""}${anglais ? ` <span class="pastille" title="Ce client utilise l'app en anglais">🇺🇸 anglais</span>` : ""}</div></div></div></header>
        <div class="fc-actions">${principal}${appeler}</div>
        <div class="fc-onglets" role="tablist" aria-label="${esc(trad("Fiche"))}">
          <button type="button" role="tab" id="fc-tab-suivi" data-onglet="suivi" aria-controls="fc-suivi" aria-selected="${onglet === "suivi"}"${onglet === "suivi" ? "" : ' tabindex="-1"'}>${esc(trad("Suivi"))}</button>
          <button type="button" role="tab" id="fc-tab-compte" data-onglet="compte" aria-controls="fc-compte" aria-selected="${onglet === "compte"}"${onglet === "compte" ? "" : ' tabindex="-1"'}>${esc(trad("Compte"))}</button>
        </div>
      </div>
      <div class="fc-panneau" role="tabpanel" id="fc-suivi" aria-labelledby="fc-tab-suivi"${onglet === "suivi" ? "" : " hidden"}>
      <p class="lede fc-lede">${profil.statut === "prospect" ? "Compte gratuit : pas de suivi à assurer tant qu'il n'est pas passé client." + (rdc ? " Découverte : " + (rdc.jour == null ? "date d'inscription inconnue" : Decouverte.depuisTexte(rdc.jour)) + (rdc.questionnaire ? ", questionnaire rempli." : ", questionnaire pas encore rempli.") : "") : alertes.length ? `${alertes.length} point${alertes.length > 1 ? "s" : ""} à regarder.` : "Rien à signaler : tout est en ordre."}</p>
      ${alertes.length ? `<div class="attention-alertes" style="margin:0 0 12px">${alertes.map(a => `<a class="pastille ${a.niveau === "info" ? "accent" : a.niveau}" href="#/${esc(a.cible)}">${esc(a.texte)}</a>`).join("")}</div>` : ""}
      ${reponsesHTML}
      ${SC ? `<div id="fiche-commercial">${Commercial.ficheHTML(Object.assign({}, pr || {}, profil), SC, d.suivi_prospect)}</div>` : ""}
      <section class="carte fc-carte fc-retour" id="fc-retour"><div class="fc-retour-l"><div><p class="fc-sur">${esc(trad("Retour de la semaine"))}</p><p class="fc-retour-t">${esc(retourTexte)}</p></div><a class="lc-lien" id="fc-lire" href="${esc(lienOutil("bilan"))}">${esc(trad("Lire"))}</a></div></section>
      <section class="carte fc-carte fc-poids" id="fc-poids">${l.ev ? `<p class="fc-kg"><b>${kg(l.ev.total)}</b> <span>${esc(trad("depuis le début"))}</span></p>${courbe}${l.ev.mois != null ? `<span class="pastille fc-4s">${esc(trad("4 dernières sem. : {v}", { v: kg(l.ev.mois) }))}</span>` : ""}` : `<p class="fc-kg"><span>${esc(trad("Poids : aucune mesure"))}</span></p>`}</section>
      <section class="carte fc-carte fc-reg" id="fc-regularite"><div class="fc-reg-l"><b>${esc(trad("Régularité"))}</b><span>${esc(regTexte)}</span></div><div class="fc-jauge" role="img" aria-label="${esc(regTexte)}"><span style="width:${regPct}%"></span></div></section>
      <section class="carte fc-carte" id="fc-etat"><ul class="fiche-l fc-lignes">${etat("Questionnaire", I.complet, trad("Rempli"), trad("à remplir"))}${etat("Programme", seances.length, progNom || trad("envoyé"), trad("à faire"))}${etat("Diète", nbJours, trad("envoyée"), trad("à définir"))}</ul></section>
      <div class="fc-outils" id="fc-outils">${bandeauConsultation(true)}</div>
      <section class="panel">
        <h2>En bref</h2>
        <div class="tiles">
          <div class="tile"><div class="t-lbl">Régularité</div><div class="t-val readout ${Regularite.niveau(r.score)}">${r.score == null ? "—" : r.score}<small>/100</small></div><div class="t-sub">${prec.score != null ? "semaine passée : " + prec.score : "en cours"}</div></div>
          <div class="tile"><div class="t-lbl">Poids</div><div class="t-val readout">${l.ev ? n1(l.ev.actuel) : "—"}<small>kg</small></div><div class="t-sub">${l.ev ? `départ ${n1(l.ev.depart)} · <span class="${l.sens ? (l.ev.total * l.sens < -0.2 ? "pos" : l.ev.total * l.sens > 0.2 ? "neg" : "") : ""}">${l.ev.total > 0 ? "+" : ""}${n1(l.ev.total)} kg</span>` : "aucune mesure"}</div></div>
          <div class="tile"><div class="t-lbl">Séances</div><div class="t-val readout">${r.parts.seances ? r.parts.seances.faites : "—"}<small>${r.parts.seances ? "/ " + r.parts.seances.cible : ""}</small></div><div class="t-sub">notées cette semaine</div></div>
          <div class="tile"><div class="t-lbl">Repas respectés</div><div class="t-val readout">${b.repas != null ? b.repas : "—"}<small>${b.repas != null ? "%" : ""}</small></div><div class="t-sub">sur 28 jours</div></div>
          <div class="tile"><div class="t-lbl">Activité</div><div class="t-val readout${l.jours != null && l.jours >= 10 ? " neg" : ""}">${l.jours == null ? "—" : l.jours === 0 ? "auj." : l.jours + "<small>j</small>"}</div><div class="t-sub">${l.jours == null ? "jamais rien saisi" : "depuis sa dernière saisie"}</div></div>
          <div class="tile"><div class="t-lbl">${dim ? "Feedback du dimanche" : "Bilan hebdo"}</div><div class="t-val readout${dernierCk ? " pos" : ""}">${dernierCk ? "✓" : "—"}</div><div class="t-sub">${dernierCk ? "dernier envoyé le " + esc(dateFr(dernierCk.envoye_le)) : "jamais envoyé"}</div></div>
        </div>
      </section>
      ${profil.statut === "prospect" ? `<div id="fiche-prospect">${this.decouverteFicheHTML(pDc, d.challenge, I, d.suivi_prospect, d.activite, d.emails)}</div>` : ""}
      ${NotesCoach.html()}
      <div class="fiche-grille">
      <section class="panel"><div class="seance-c-tete"><h2>Profil</h2>${I.complet ? `<span class="pastille ok">questionnaire complet</span>` : `<span class="pastille attention">questionnaire incomplet</span>`}</div>
        <ul class="ingr fiche-l">${ligne("Âge", I.age ? I.age + " ans" : "")}${ligne("Sexe", I.sexe)}${ligne("Taille", I.taille ? I.taille + " cm" : "")}${ligne("Poids déclaré", I.poids ? I.poids + " kg" : "")}${ligne("Poids objectif", I.poids_obj ? I.poids_obj + " kg" : "")}${ligne("Objectif", I.objectif)}${ligne("Niveau", I.niveau)}${ligne("Lieu", I.lieu)}${ligne("Séances / semaine", I.seances)}${ligne("Régime", I.regime_type)}${ligne("Allergènes", String(I.allergenes || "").split("|").filter(Boolean).join(", "))}${ligne("Ville", I.ville)}</ul>
        <p class="note" style="margin:10px 0 0">${lien("profil", "Son questionnaire complet")}</p></section>
      <section class="panel"><div class="seance-c-tete"><h2>Objectifs du mois</h2>${obj ? `<span class="pastille">${b.statuts.filter(x => x === "atteint").length} / ${obj.liste.filter(Boolean).length}</span>` : ""}</div>
        ${obj ? obj.liste.map((t, i) => t ? `<div class="objectif${b.statuts[i] === "atteint" ? " atteint" : ""}${b.statuts[i] === "non_atteint" ? " rate" : ""}"><span class="num">0${i + 1}</span><span class="texte" data-notr>${esc(t)}</span><span class="pastille ${Regularite.classeStatut(b.statuts[i])}">${esc(Regularite.libelleStatut(b.statuts[i]))}</span></div>` : "").join("") : `<div class="empty">Pas d'objectifs ce mois-ci.</div>`}
        <p class="note" style="margin:10px 0 0">${lien("programme", "Écrire ou modifier les objectifs")}</p></section>
      <section class="panel"><div class="seance-c-tete"><h2>Programme</h2>${seances.length ? `<span class="pastille ok">envoyé</span>` : `<span class="pastille attention">à faire</span>`}</div>
        <ul class="ingr fiche-l">${ligne("Nom", P.nom)}${seances.length ? ligne("Cycle", "Cycle " + String(av.cycle).padStart(2, "0") + (av.semaine != null ? " · semaine " + Math.min(av.semaine, av.duree) + " / " + av.duree : "")) : ""}${ligne("Séances / semaine", seances.length || "")}${ligne("Envoyé le", P.maj)}${ligne("Dernière séance notée", derniereSeance ? dateFr(derniereSeance.date) + " — " + (derniereSeance.nom || "") : "")}</ul>
        <p class="note" style="margin:10px 0 0">${lien("programme", "Son programme")}</p></section>
      <section class="panel"><div class="seance-c-tete"><h2>Nutrition</h2>${nbJours ? `<span class="pastille ok">envoyée</span>` : `<span class="pastille attention">à faire</span>`}</div>
        <ul class="ingr fiche-l">${ligne("Cible", cible ? fmt(cible.kcal) + " kcal · " + fmt(cible.prot) + " g prot." : "")}${ligne("Régime", R.regime)}${ligne("Allergènes écartés", (R.allergenes || []).join(", "))}${ligne("Jours différents", nbJours || "")}${ligne("Envoyée le", R.maj)}${ligne("Repas respectés (28 j)", b.repas != null ? b.repas + " %" : "")}${ligne("Repas remplacés ce mois", b.remplaces.length || "")}</ul>
        <p class="note" style="margin:10px 0 0">${lien("nutrition", "Ses repas")} · ${lien("calculateur", "Ses calories")}</p></section>
      ${avecJA ? JournalAlim.ficheHTML(JournalAlim.remettre(d.journal_alimentaire || JournalAlim.vide()), JournalAlim.objectif({ repas: R, calc: d.calc, calc_perso: d.calc_perso }, profil.statut === "prospect")) : ""}
      <section class="panel"><h2>Poids et mensurations</h2>
        <ul class="ingr fiche-l">${ligne("Poids actuel", l.ev ? n1(l.ev.actuel) + " kg" : "")}${ligne("Départ", l.ev ? n1(l.ev.depart) + " kg" : "")}${ligne("Depuis le début", l.ev ? (l.ev.total > 0 ? "+" : "") + n1(l.ev.total) + " kg" : "")}${ligne("4 dernières semaines", l.ev && l.ev.mois != null ? (l.ev.mois > 0 ? "+" : "") + n1(l.ev.mois) + " kg" : "")}${ligne("Mesures", (M.mesures || []).length || "")}${ligne("Dernière mesure", l.ev && l.ev.date ? dateFr(l.ev.date) : "")}${b.zones.map(z => ligne(z.nom, n1(z.de) + " → " + n1(z.a) + " cm")).join("")}</ul>
        <p class="note" style="margin:10px 0 0">${lien("mensurations", "Ses courbes")}</p></section>
      <section class="panel"><div class="seance-c-tete"><h2>${dim ? "Feedback du dimanche" : "Bilan hebdomadaire"}</h2>${e.fait ? `<span class="pastille ok">${dim ? "reçu" : "reçu cette semaine"}</span>` : dim && e.semaine.etat !== "ouvert" ? `<span class="pastille attention">non fait</span>` : dernierCk ? `<span class="pastille">${esc(trad("dernier : {d}", { d: dateFr(dernierCk.envoye_le) }))}</span>` : `<span class="pastille attention">aucun</span>`}</div>
        ${dernierCk ? `<p class="note" style="margin:0 0 8px">${esc(Checkin.periode(dernierCk))}</p>${Checkin.reponsesHTML(dernierCk)}${Checkin.avisCoachHTML(CK, dernierCk.semaine, d.feedbacks)}` : `<div class="empty">${dim ? "Aucun feedback du dimanche envoyé pour le moment." : "Aucun bilan hebdomadaire envoyé pour le moment."}</div>`}
        ${dernierCk ? `<p class="note" style="margin:10px 0 0">Ton feedback sur ce bilan : ${fbCk ? "envoyé le " + esc(dateFr(fbCk.date)) : fbAvant ? "<b>écrit avant ce bilan, à relire</b>" : "<b>à écrire</b>"}</p>` : ""}
        <p class="note" style="margin:10px 0 0">${lien("bilan", "Préparer le call")} · ${lien("suivi", "Son suivi")}</p></section>
      <section class="panel"><h2>Le reste</h2>
        <ul class="ingr fiche-l">${ligne("Compléments", nbCompl ? nbCompl + " prescrit" + (nbCompl > 1 ? "s" : "") : "aucun")}${ligne("Formation", fo ? fo.pct + " % (" + fo.faits + " / " + fo.tot + ")" : "pas commencée")}${ligne("Anciens programmes", histP || "0")}${ligne("Anciennes diètes", histR || "0")}</ul>
        <p class="note" style="margin:10px 0 0">${lien("complements", "Ses compléments")} · ${lien("formation", "Sa formation")}</p></section>
      </div>
      </div>
      <div class="fc-panneau" role="tabpanel" id="fc-compte" aria-labelledby="fc-tab-compte"${onglet === "compte" ? "" : " hidden"}>
        <section class="carte fc-carte" id="fc-infos"><ul class="fiche-l fc-lignes">
          <li><span>${esc(trad("Email"))}</span><b data-notr id="fc-email">${emailF ? esc(emailF) : "—"}</b></li>
          <li><span>${esc(trad("Téléphone"))}</span><b id="fiche-tel">${Telephone.coachHTML(tel, "lc-lien")}</b></li>
          <li><span>${esc(trad("Source"))}</span><b id="fiche-source" data-notr>${esc(Contact.ref(d.contact) || "—")}</b></li>
          <li><span>${esc(trad("Rôle"))}</span><b><span id="fc-role">${esc(trad(prospectF ? "Prospect" : "Client"))}</span> <button type="button" class="lc-lien fc-changer" id="fc-changer" data-statut="${prospectF ? "client" : "prospect"}">${esc(trad("Changer"))}</button></b></li>
          <li><span>${esc(trad("Dernière connexion"))}</span><b id="fc-derniere" title="${esc(Connexions.aide(cxF))}">${esc(Connexions.texteDerniere(cxF))}</b></li>
          <li><span>${esc(trad("Connexions"))}</span><b id="fc-connexions" title="${esc(Connexions.aide(cxF))}">${esc(Connexions.texteNombre(cxF))}</b></li>
        </ul></section>
        <div class="fc-boutons">
          <button type="button" class="btn ghost fc-large" id="fc-acces" data-role="coach">Donner l'accès complet</button>
          <button type="button" class="btn ghost fc-large" id="fc-archiver" data-archiver="${arch ? "non" : "oui"}">${esc(trad(arch ? "Restaurer ce compte" : "Archiver ce compte"))}</button>
          ${arch ? `<p class="note" id="fc-archive-note" style="margin:0">${esc(trad("Archivé le {d} : ce compte n'apparaît plus dans tes listes, tes compteurs ni « À traiter ». Rien n'a changé pour la personne.", { d: dateFr(Decouverte.dateLocale(arch) || arch.slice(0, 10)) }))}</p>` : ""}
        </div>
        <section class="zone-danger fc-danger" id="fc-danger"><h3>Supprimer définitivement</h3>
          <p class="note">Efface le compte et toutes ses données : c'est ce qu'il faut faire quand une personne demande l'effacement de ses données. C'est définitif : il n'y a pas de corbeille.</p>
          <button type="button" class="btn danger fc-large" id="fc-supprimer">Supprimer définitivement</button></section>
      </div>`;
    /* v51 — copier le lien de reservation du prospect (presse-papiers, sinon selection a copier a la main) */
    const brancherCopie = () => {
      const copier = zone.querySelector("#dc-copier");
      if (copier) copier.addEventListener("click", async () => {
        const champ = zone.querySelector("#dc-lien"), msg = zone.querySelector("#dc-copie-msg");
        let ok = false;
        try { await navigator.clipboard.writeText(champ.value); ok = true; }
        catch(e){ try { champ.focus(); champ.select(); ok = document.execCommand("copy"); } catch(e2){ ok = false; } }
        if (msg) msg.textContent = ok ? "Lien copié." : "Copie impossible : le lien est sélectionné, copie-le à la main.";
        if (!ok && champ){ champ.focus(); champ.select(); }
      });
    };
    brancherCopie();
    /* v49 — suivi commercial : apres une action, seuls ses blocs sont redessines (les notes privees ne bougent pas) ;
       un passage en client redessine la page par le routeur (les notes en attente partent avant).
       v53 (chantier 4) : le bloc « Découverte » et la chronologie aussi (« Bilan réservé », historique) */
    if (SC){
      const pSC = Object.assign({}, pr || {}, profil), boite = zone.querySelector("#fiche-commercial");
      const rebrancher = () => Commercial.brancher(boite, (uid, S, act) => {
        if (act === "client"){ afficher(courant); return; }
        if (!boite.isConnected || Store.idConsulte !== uidFiche) return;
        d.suivi_prospect = S;
        boite.innerHTML = Commercial.ficheHTML(pSC, Commercial.analyse(pSC, d.challenge, S, dernier, I), S);
        const bp = zone.querySelector("#fiche-prospect");
        if (bp){ bp.innerHTML = this.decouverteFicheHTML(pDc, d.challenge, I, S, d.activite, d.emails); brancherCopie(); }
        rebrancher();
      });
      if (boite) rebrancher();
    }
    /* v83 (bloc 3) — les onglets Suivi / Compte (un clic, ou les flèches gauche / droite au clavier) ; l'onglet choisi est
       gardé pour cette fiche (retour d'un outil du client, action de l'onglet Compte) */
    const onglets = $$("[data-onglet]", zone);
    const montrer = (nom, focus) => {
      this.onglet = { uid: uidFiche, nom };
      onglets.forEach(t => { const oui = t.dataset.onglet === nom; t.setAttribute("aria-selected", String(oui)); if (oui) t.removeAttribute("tabindex"); else t.setAttribute("tabindex", "-1"); if (oui && focus) t.focus(); });
      ["suivi", "compte"].forEach(k => { const x = zone.querySelector("#fc-" + k); if (x) x.hidden = k !== nom; });
    };
    onglets.forEach(t => {
      t.addEventListener("click", () => montrer(t.dataset.onglet));
      t.addEventListener("keydown", ev => { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft"){ ev.preventDefault(); montrer(t.dataset.onglet === "suivi" ? "compte" : "suivi", true); } });
    });
    /* onglet Compte : le statut (« Changer »), l'accès complet, archiver / restaurer, supprimer définitivement (les mêmes
       actions et les mêmes fenêtres que dans Comptes : Acces) ; après une action, la fiche est relue, ou quittée si le compte
       n'en a plus (supprimé, ou passé en accès complet) */
    const refaire = () => { if (Store.idConsulte === uidFiche && courant === "accueil") afficher("accueil", true, true); };
    const quitter = vers => { ListeCoach.revenir(vers); if (Store.idConsulte === uidFiche){ Store.oublier(uidFiche); Store.idConsulte = null; Store.nomConsulte = null; } Store.retourVers = null; location.hash = "#/" + vers; };
    const bc = zone.querySelector("#fc-changer");
    if (bc) bc.addEventListener("click", async () => { if (await Acces.changerStatut(pFiche, bc.dataset.statut, bc)) refaire(); });
    const ba = zone.querySelector("#fc-acces");
    if (ba) ba.addEventListener("click", async () => { const vers = Store.retourVers || "clients"; if (await Acces.changerRole(pFiche, "coach", ba)) quitter(vers); });
    const bar = zone.querySelector("#fc-archiver");
    if (bar) bar.addEventListener("click", async () => {
      const oui = bar.dataset.archiver === "oui", T = ListeCoach.TEXTES[prospectF ? "prospects" : "clients"];
      if (oui && !(await UI.ouvrir({ titre: ListeCoach.plur(1, T.confirmer), corps: trad(ListeCoach.UN), annulation: false, boutons: [
        { texte: trad("Annuler"), valeur: false, classe: "ghost" }, { texte: trad("Archiver"), valeur: true, classe: "danger", principal: true }] }))) return;
      const avant = bar.textContent; bar.disabled = true; bar.textContent = "…";
      const r = await Archive.appliquer([uidFiche], oui);
      if (r.ok.length){ UI.toast(ListeCoach.plur(1, oui ? T.archives : T.restaures), "ok"); refaire(); return; }
      bar.disabled = false; bar.textContent = avant;
      UI.alerte(trad("Non enregistré ({c}). Réessaie dans un instant.", { c: Commercial.cause(r.ko[0] && r.ko[0].e) }));
    });
    const bs = zone.querySelector("#fc-supprimer");
    if (bs) bs.addEventListener("click", async () => { const vers = Store.retourVers || "clients"; if (await Acces.supprimer(pFiche, bs) === "fait") quitter(vers); });
    /* v38 — notes privees : la fonction rendue enregistre ce qui attend quand on quitte la fiche */
    return NotesCoach.monter(Store.idConsulte);
  },

  async init(){
    const zone = $("acc-vue"); if (!zone) return;
    const consult = !!Store.idConsulte;
    if (consult) return this.fiche(zone);
    if (Auth.estProspect()) return this.gratuit(zone);   // v40 : l'accueil du mode gratuit
    /* v53 (chantier 4) : l'accueil d'un client compte comme une visite (afficher() compte les autres pages) ; sans effet
       si ses visites ne sont pas suivies (interrupteur suivi_visites_clients), pour le coach et pour une fiche consultée */
    Activite.page("accueil");
    /* v79 : la carte du journal alimentaire (interrupteur) : son journal et son calcul, dans la même lecture */
    const ja = JournalAlim.visible();
    const d = await Store.lireTout(["intake", "programme", "journal", "repas", "repas_suivi", "mens", "objectifs_faits", "checkins", "feedbacks"].concat(ja ? ["journal_alimentaire", "calc", "calc_perso"] : []));
    /* v71 (F) : lecture ratee : « Pas de connexion » + Reessayer sous le « Bonjour », jamais « Ton coach prepare ton programme » */
    if (d.erreur){ const tete = zone.querySelector(".masthead"); zone.innerHTML = (tete ? tete.outerHTML : "") + flagHorsLigne(); return; }
    const I = d.intake || {}, P = d.programme || {}, J = d.journal || { seances: [] }, R = d.repas || {}, S = d.repas_suivi || {}, M = d.mens || {}, OF = d.objectifs_faits || {}, CK = d.checkins || { liste: [] };
    const fbR = Feedback.recent(d.feedbacks);   // v38 : un feedback du coach de moins de 7 jours
    /* v53 (chantier 3) — feedback du dimanche (compte en test) : le rappel du dimanche en haut, « Ton coach a
       répondu » (et le badge de la navigation) quand une réponse est plus récente que la dernière vue. Lecture seule. */
    const moi = Store.cible(), dim = Checkin.regle(moi) === "dimanche";
    const nonVus = dim ? Checkin.nonVus(CK, d.feedbacks) : [];
    if (dim) Checkin.majBadge(moi, nonVus.length);
    if (!Array.isArray(J.seances)) J.seances = [];
    const c = { programme: P, journal: J, repas: R, repas_suivi: S, mens: M };
    const r = Regularite.calculer(c, 0), prec = Regularite.calculer(c, -1);
    const p = r.parts;
    const objectif = I.objectif || "";
    const sens = /perte|s[èe]che/i.test(objectif) ? -1 : /prise|masse/i.test(objectif) ? 1 : 0;
    const pd = this.poids(M);
    const obj = (P.objectifs && (P.objectifs.liste || []).some(Boolean)) ? P.objectifs : null;
    const faits = (obj && OF.mois === obj.mois && Array.isArray(OF.faits)) ? OF.faits : [];
    const nbObj = obj ? obj.liste.filter(Boolean).length : 0, nbFaits = obj ? obj.liste.filter((t, i) => t && Regularite.statutObjectif(P, OF, i) === "atteint").length : 0;
    const aProgramme = (P.seances || []).some(sc => (sc.exercices || []).some(e => e.nom));
    const aDiete = (R.jours || []).some(j => (j.repas || []).length);
    const prenom = consult ? (Store.nomConsulte || "").split(" ")[0]
                 : ((Auth.profil && Auth.profil.prenom) || String(I.nom || "").split(" ")[0] || "");

    /* --- la phrase du haut --- */
    let resume;
    if (consult) resume = trad("Sa semaine en un coup d'œil.");
    else if (!aProgramme && !aDiete) resume = trad("Ton coach prépare ton programme et tes repas. En attendant, ta formation t'attend.");
    else {
      const bouts = [];
      if (p.seances) bouts.push(trad(p.seances.faites > 1 ? "{a} séances sur {b}" : "{a} séance sur {b}", { a: p.seances.faites, b: p.seances.cible }));
      if (p.repas) bouts.push(trad("{a} repas cochés sur {b}", { a: p.repas.coches, b: p.repas.prevus }));
      resume = bouts.length ? bouts.join(", ") + (r.score != null ? trad(" : régularité {n}/100 cette semaine.", { n: r.score }) : ".")
                            : trad("Une nouvelle semaine commence : à toi de jouer.");
    }

    /* --- les tuiles de la semaine --- */
    let tuiles = "";
    tuiles += `<div class="tile"><div class="t-lbl">Régularité</div><div class="t-val readout ${Regularite.niveau(r.score)}">${r.score == null ? "—" : r.score}<small>/100</small></div><div class="t-sub">${prec.score != null ? esc(trad("semaine dernière : {n}", { n: prec.score })) : esc(trad("remis à zéro chaque lundi"))}</div></div>`;
    if (pd){
      const bon = pd.delta == null || !sens ? "" : (pd.delta * sens > 0.05 ? "pos" : pd.delta * sens < -0.05 ? "neg" : "");
      const sub = pd.delta == null ? esc(trad("semaine {n}", { n: pd.sem })) : `<span class="${bon}">${pd.delta > 0 ? "+" : pd.delta < 0 ? "−" : ""}${n1(Math.abs(pd.delta))} kg</span> ${esc(trad("depuis la mesure d'avant"))}`;
      tuiles += `<div class="tile"><div class="t-lbl">Poids</div><div class="t-val readout">${n1(pd.actuel)}<small>kg</small></div><div class="t-sub">${sub}</div></div>`;
    } else if (aProgramme || aDiete){
      tuiles += `<div class="tile"><div class="t-lbl">Poids</div><div class="t-val readout">—</div><div class="t-sub">${esc(trad("aucune mesure"))}</div></div>`;
    }
    if (p.seances) tuiles += `<div class="tile"><div class="t-lbl">Entraînement</div><div class="t-val readout${p.seances.faites >= p.seances.cible ? " pos" : ""}">${p.seances.faites}<small>/ ${p.seances.cible}</small></div><div class="t-sub">${esc(trad("séances notées"))}</div></div>`;
    if (p.repas) tuiles += `<div class="tile"><div class="t-lbl">Nutrition</div><div class="t-val readout${p.repas.ratio >= 0.9 ? " pos" : ""}">${fmt(p.repas.coches)}<small>/ ${fmt(p.repas.prevus)}</small></div><div class="t-sub">${esc(trad("repas respectés"))}</div></div>`;
    if (obj) tuiles += `<div class="tile"><div class="t-lbl">Objectifs</div><div class="t-val readout${nbFaits === nbObj ? " pos" : ""}">${nbFaits}<small>/ ${nbObj}</small></div><div class="t-sub">${esc(trad("ce mois-ci"))}</div></div>`;

    /* --- aujourd'hui : quoi faire --- */
    const acces = [];
    const ps = this.prochaineSeance(P, J, r.bornes);
    if (ps){
      if (ps.prochaine) acces.push({ id: "programme", ico: ICONES.programme, t: trad("Noter ma séance"), s: ps.prochaine.sc.nom || trad("Séance {n}", { n: ps.prochaine.si + 1 }) });
      else acces.push({ id: "programme", ico: ICONES.programme, t: trad("Toutes tes séances de la semaine sont notées"), s: trad("Bravo. Revoir mon programme"), ok: true });
    }
    if (aDiete){
      const auj = aujourdhui(), prevus = Regularite.prevusLe(R, auj);
      const coches = Math.min(prevus, (S.hist && S.hist[auj] && S.hist[auj].c) || 0);
      acces.push({ id: "nutrition", ico: ICONES.nutrition, t: trad("Mes repas du jour"), s: trad("{a} sur {b} cochés aujourd'hui", { a: coches, b: prevus }), ok: prevus > 0 && coches >= prevus });
    }
    if (aProgramme || aDiete || (M.mesures || []).length){
      acces.push((p.mesure && p.mesure.faite)   // v71 (A) : pas de part mesure tant qu'il n'y a rien a mesurer
        ? { id: "mensurations", ico: ICONES.mensurations, t: trad("Mesure de la semaine faite"), s: trad("Voir ma progression"), ok: true }
        : { id: "mensurations", ico: ICONES.mensurations, t: trad("Ma mesure de la semaine"), s: trad("Poids et tours de taille, à jeun") });
    }
    if (!consult && !I.complet) acces.unshift({ id: "profil", ico: ICONES.profil, t: trad("Compléter mon profil"), s: trad("C'est ce qui permet à ton coach de construire ton suivi") });
    if (!consult && !aProgramme && !aDiete) acces.push({ id: "formation", ico: ICONES.formation, t: trad("Commencer la Speed Formation"), s: trad("Les bases, à ton rythme") });

    const ligne = a => `<a class="acces${a.ok ? " fait" : ""}" href="#/${a.id}"><span class="ico">${a.ico}</span><span class="txt"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></span><span class="fleche">›</span></a>`;

    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(this.dateLongue())}</span>
        <h1>${consult ? esc(trad("Vue d'ensemble")) + (prenom ? " — " + esc(prenom) : "") : esc(trad("Bonjour")) + (prenom ? " " + esc(prenom) : "")}</h1>
        <p class="lede">${esc(resume)}</p>
      </header>
      ${ja ? JournalAlim.carteAccueilHTML(JournalAlim.local(d.journal_alimentaire), JournalAlim.objectif(d, false)) : ""}
      ${dim ? Checkin.bandeauHTML(CK, moi) : ""}
      <section class="panel">
        <h2>${esc(trad("Cette semaine"))}</h2>
        <div class="tiles">${tuiles}</div>
        <p class="note" style="margin:12px 0 0">${esc(trad("La régularité mesure ce que tu fais — séances, repas, mesure — pas ce que dit la balance."))}</p>
      </section>
      ${dim ? `<section class="panel" id="acc-fbd"><h2>${esc(trad("Feedback de la semaine"))}</h2><div class="acces-l">${nonVus.length ? Checkin.accesReponseHTML(nonVus[0]) : ""}${Checkin.statutHTML(CK, { lien: "#/suivi", uid: moi })}</div></section>`
        : (aProgramme || aDiete || fbR) ? `<section class="panel"><h2>${esc(trad("Bilan hebdomadaire"))}</h2><div class="acces-l">${fbR ? Feedback.accesHTML(fbR) : ""}${(aProgramme || aDiete) ? Checkin.statutHTML(CK, { lien: "#/suivi", uid: moi }) : ""}</div></section>` : ""}
      ${acces.length ? `<section class="panel"><h2>${esc(trad("Aujourd'hui"))}</h2><div class="acces-l">${acces.map(ligne).join("")}</div></section>` : ""}
      ${obj ? `<section class="panel"><h2>${esc(trad("Tes objectifs du mois"))}</h2>
        ${obj.liste.map((t, i) => { if (!t) return ""; const st = Regularite.statutObjectif(P, OF, i); return `<div class="objectif${st === "atteint" ? " atteint" : ""}${st === "non_atteint" ? " rate" : ""}"><span class="num">0${i + 1}</span><span class="texte" data-notr>${esc(t)}</span><span class="pastille ${Regularite.classeStatut(st)}">${esc(Regularite.libelleStatut(st))}</span></div>`; }).join("")}
        <div class="actions"><a class="btn ghost petit" href="#/suivi">${esc(trad("Cocher mes objectifs"))}</a></div>
      </section>` : ""}
      <section class="panel">
        <h2>${esc(trad("Mon bilan"))}</h2>
        <p class="note" style="margin:0 0 12px">${esc(trad("Tes quatre dernières semaines : régularité, poids, ce qui a bougé et la progression de tes charges."))}</p>
        <div class="actions" style="margin-top:0"><a class="btn ghost petit" href="#/suivi">${esc(trad("Voir mon bilan du mois"))}</a></div>
      </section>`;
  }
};

