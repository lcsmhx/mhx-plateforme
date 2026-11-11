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

  /* v104 (point 4) : dans la fiche d'un client, le titre de page est celui des autres onglets dès le chargement (plus de
     « Bonjour » le temps de lire) */
  html(){ return `<div id="acc-vue">${Store.idConsulte ? this.titreFiche() : `<header class="masthead"><h1>Bonjour</h1></header>`}<section class="panel">${squelette()}</section></div>`; },

  /* v104 (point 4) : le titre de page de la fiche, au même format que celui des 4 autres onglets (afficher, navigation.js :
     « Nom — page », puis la page en titre) ; la page est celle du bandeau : « Fiche » sous Aperçu, « Son compte » sous Profil */
  titreFiche(){
    /* v105 (point 2) : l'Aperçu n'a qu'un en-tête, le bandeau : plus de grand titre (gardé pour les lecteurs d'écran seulement).
       v106 (lot 2) : « Son compte » aussi ; le titre est le nom du lien de la page (« Aperçu », « Son compte ») */
    return `<h1 class="sr-only">${esc(trad(nomPageFiche()))}</h1>`;
  },

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
    const faites = new Set((J.seances || []).filter(x => x && x.date >= bornes.debut && x.date <= bornes.fin).map(x => Journal.place(P, x)).filter(i => i > -1));   // v96 : par séance (Journal.place)
    const reste = seances.filter(x => !faites.has(x.si));
    return { prochaine: reste.length ? reste[0] : null, faites: faites.size, total: seances.length };
  },

  /* ---------- ACCUEIL DU MODE GRATUIT : l'ecran Decouverte (questionnaire court, resultat, bilan). Aucun prix. */
  async gratuit(zone){ return outilDecouverte.afficher(zone); },
  /* bloc « Découverte » de la fiche d'un prospect : jour, questionnaire court, clics, bilan reserve (lecture seule)
     v53 (chantier 4) : plus de score ; « Bilan réservé » suit la coche du coach (Commercial.bilan), la case du prospect
     reste lisible comme info ; dernière visite et jours actifs sur 30 jours */
  decouverteFicheHTML(p, C, I, S, A, EM){
    /* v106 (lot 4) : sans ses réponses (une seule fois, « Réponses au questionnaire court » en haut) ni « Contacter » (en haut, contacterHTML) */
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
    /* v106 (lot 4) : ses réponses sont une seule fois, dans « Réponses au questionnaire court » (en haut de la fiche) */
    ].concat([
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
    /* v106 (lot 4, test QA) : repliée (le suivi commercial, en haut, dit déjà l'essentiel) ; tout reste lisible d'un toucher */
    return `<details class="panel q-theme" id="fiche-decouverte"><summary><h2>Découverte</h2><span class="fc-repli-p">${pastilles}</span></summary>
      <ul class="ingr fiche-l">${lignes.map(x => ligne(x[0], x[1])).join("")}</ul>
      <p class="note" style="margin:10px 0 0">Lecture seule : rien ne s'écrit d'ici.</p></details>`;
  },

  /* v51 — detail d'un prospect pour le coach : reponses, chronologie, lien de reservation, email (v53 : plus de score
     ni de journal des emails). Lecture seule : tout ce qui vient du prospect passe par s() / dt() et esc(). */
  prospectDetailHTML(p, C, I, S, A){
    const s = v => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 400) : "";
    const dt = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : "—";
    const heure = v => { if (typeof v !== "string" || v.length <= 10) return ""; const d = new Date(v); return isNaN(d) ? "" : " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
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
    const chronoHTML = `<details class="panel q-theme" id="fiche-chrono"><summary><h2>Chronologie</h2></summary>
      ${ev.length ? `<ol class="dc-chrono">${ev.slice(0, 40).map(e => `<li><time datetime="${esc(e.quand)}">${esc(dt(e.quand) + heure(e.quand))}</time><span>${esc(e.texte)}</span></li>`).join("")}</ol>` : `<div class="empty">Rien pour l'instant.</div>`}
      <p class="note" style="margin:10px 0 0">${act.jours.length} jour${act.jours.length > 1 ? "s" : ""} d'activité, ${Math.floor(act.temps_s / 60)} min dans l'app${pages ? " · pages vues : " + esc(pages) : ""}.</p></details>`;   // v106 (lot 4, test QA) : repliée
    return chronoHTML;   // v106 (lot 4) : ses réponses (reponsesCourtHTML) et « Contacter » sont en haut de la fiche
  },

  /* v51 (v106 : seul bloc des réponses d'un prospect, en haut de sa fiche) — ses réponses au questionnaire court, puis celles de
     l'ancien questionnaire qui ont une valeur ; son email. Tout ce qui vient du prospect passe par s() / dt() et esc(). */
  reponsesCourtHTML(I){
    I = (I && typeof I === "object") ? I : {};
    const s = v => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 400) : "";
    const dt = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) ? dateFr(Decouverte.dateLocale(v) || v.slice(0, 10)) : "—";
    const nbQ = Decouverte.liste(I).length || (CONFIG.decouverte.questions || []).length;
    const email = s(I.email_compte).trim() || s(I.email).trim();
    const rep = [["Email", email]].concat(Decouverte.reponsesCoach(I, true));
    /* v106 (lot 4) : seul bloc des réponses, il remplace aussi « Ses réponses » (v81, traduit) : ses textes sont traduits pour un
       coach en anglais (les réponses du prospect, jamais : data-notr) */
    return `<section class="panel" id="fiche-reponses"><h2>${esc(trad("Réponses au questionnaire court"))}</h2>
      <p class="note" style="margin:0 0 8px">${esc(trad("{n} / {t} réponses", { n: Decouverte.repondues(I), t: nbQ }))}${esc(Decouverte.questionnaireFait(I) ? trad(", validé le {d}", { d: dt(I.court_le) }) : trad(", pas encore validé"))}.</p>
      <ul class="ingr fiche-l">${rep.map(([k, v]) => `<li><span>${esc(trad(k))}</span><b data-notr>${v ? esc(v === "Homme" || v === "Femme" ? trad(v) : v) : "—"}</b></li>`).join("")}</ul></section>`;
  },

  /* v106 (lot 4) — « Contacter » (v51), en haut de la fiche d'un prospect : son lien de réservation et un email prêt */
  contacterHTML(p, I){
    I = (I && typeof I === "object") ? I : {};
    const s = v => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 400) : "";
    const email = s(I.email_compte).trim() || s(I.email).trim();
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
      <div class="actions">${lien ? `<button type="button" class="btn ghost petit" id="dc-copier">Copier le lien</button>` : ""}${mailto ? `<a class="btn ghost petit" id="dc-mail" href="${esc(mailto)}">Lui écrire un email</a>` : `<span class="note">Email inconnu : il apparaît quand le prospect a commencé son questionnaire.</span>`}<span class="msg" id="dc-copie-msg" role="status" aria-live="polite"></span></div>
      <p class="note" style="margin:10px 0 0">« Lui écrire un email » ouvre ta messagerie avec un message prêt, que tu relis avant d'envoyer. Rien n'est envoyé par l'app.</p></section>`;
    return actionsHTML;
  },

  /* ---------- FICHE CLIENT (v37, phase 18) ----------
     Ce que le coach voit en ouvrant un client : tout l'etat en une page,
     avec un lien vers l'editeur de chaque bloc. Lecture seule ici. Les
     notes privees et les feedbacks arrivent avec les phases 10 et 18. */
  async fiche(zone){
    /* v106 (lot 4, relectures) : les saisies du client sont toutes lues (formation, journal alimentaire et son calculateur quand
       ils lui sont ouverts) : leurs dates font la « dernière saisie » (alerte d'inactivité, analyse commerciale), comme l'en-tête
       de la fiche et Mes clients ; pas les clés écrites par le coach qui ne servent plus ici (complements, hist_programme, hist_repas) */
    const cles = ["intake", "programme", "journal", "repas", "repas_suivi", "mens", "objectifs_faits", "checkins", "calc", "formation", "prefs", "feedbacks", "challenge", "suivi_prospect", "activite", "emails", "contact", "seances_formation"];   // v90 : + les séances faites des programmes de la formation   // v47 : + challenge ; v49 : + suivi commercial ; v51 : + activite ; v52 : + emails (newsletter d'un prospect) ; v72 : + contact (numéro)
    const uidFiche = Store.idConsulte;
    const avecJA = JournalAlim.pourCompte(uidFiche);   // une seule fois : la carte suit ce qui a été lu
    if (avecJA) cles.push("journal_alimentaire", "calc_perso");
    const [{ valeurs: d, dates, erreur }, pr, cx] = await Promise.all([
      Store.lireTout(cles, { dates: true }),
      /* v39 : prospect ou client ? (colonne absente ou lecture ratee : rien ne change) */
      Auth.appel("/rest/v1/profils?id=eq." + uidFiche + "&select=*").then(r => Array.isArray(r) ? r[0] || null : null).catch(() => null),
      /* v83 (bloc 3) : sa dernière connexion et le nombre de ses connexions (onglet Compte), comme dans Mes clients ; lecture
         ratée (table absente, panne) : « — », le reste de la fiche s'affiche */
      Auth.appel("/rest/v1/connexions?user_id=eq." + uidFiche + "&select=user_id,nombre,derniere,premiere").then(r => ({ lue: Array.isArray(r), ligne: Array.isArray(r) ? r[0] || null : null })).catch(() => ({ lue: false, ligne: null }))
    ]);
    if (!zone.isConnected || Store.idConsulte !== uidFiche) return;   // on a change de fiche entre-temps
    /* v91 : lecture groupée ratée : « Pas de connexion » + Réessayer (avant : une fiche vide, « Rien à signaler : tout est en ordre ») */
    if (erreur){ zone.innerHTML = this.titreFiche() + flagHorsLigne(); return; }   // v104 (point 4) : sous le titre de page, comme les autres onglets
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
    const prec = Regularite.calculer({ programme: P, journal: J, repas: R, repas_suivi: S, mens: M }, -1);
    /* v106 (lot 4, relecture des tests) : les repas qu'il a remplacés ce mois (avant : carte Nutrition), sur la ligne Diète de l'état, s'il y en a */
    let nbRemplaces = 0; try { nbRemplaces = profil.statut === "prospect" ? 0 : outilBilan.calculer({ programme: P, journal: J, repas: R, repas_suivi: S, mens: M, objectifs_faits: d.objectifs_faits || {} }).remplaces.length; } catch(e){ nbRemplaces = 0; }
    const seances = (P.seances || []).filter(sc => (sc.exercices || []).some(e => e.nom));
    const e = Checkin.etat(CK, uidFiche);
    /* v53 (chantier 3) : la regle de ce client ; feedback du dimanche : « reçu », ou « non fait » des le lundi */
    const dim = e.semaine.regle === "dimanche";
    const nbJours = (R.jours || []).filter(j => (j.repas || []).length).length;
    /* la decouverte d'un prospect (jour depuis l'inscription, questionnaire court, clics, bilan reserve) */
    const pDc = Object.assign({}, profil, pr || {});
    let rdc = null; try { rdc = profil.statut === "prospect" ? Decouverte.resume(pDc, d.challenge, I) : null; } catch(e){ rdc = null; }
    /* v49 : le suivi commercial d'un prospect (un client n'en a plus : son bloc disparait) */
    let SC = null;
    try { if (profil.statut === "prospect") SC = Commercial.analyse(pDc, d.challenge, d.suivi_prospect, dernier, I); } catch(e){ SC = null; }
    const alertes = l.alertes;
    /* v106 (lot 4, test QA) : les alertes « à remplir / à envoyer » (questionnaire, programme, diète) ne sont pas répétées en
       pastilles : la ligne Questionnaire / Programme / Diète de l'Aperçu les dit */
    const alertesV = alertes.filter(a => a.type !== "manque" && a.type !== "bilan_recu");   // v106 (revue UX) : le retour reçu est dit par la carte « Retour de la semaine »
    /* v83 (bloc 3, maquettes FicheSuivi et FicheCompte) — la même fiche pour un client et un prospect : en-tête (croix =
       retour là d'où l'on vient, initiales, nom, pastille Client ou Prospect, pastille du programme s'il est connu), bouton
       principal (client : « Préparer le call » ; prospect : « WhatsApp » pré-rempli, ou « Pas de numéro ») et bouton rond
       Appeler, puis 2 onglets. Suivi : (prospect : « Ses réponses » puis le « Suivi commercial » complet), le retour de la
       semaine, le poids, la régularité sur 30 jours, questionnaire / programme / diète, le bandeau d'avant (tous les outils du client),
       puis tout ce que la fiche montrait déjà. Compte : email, téléphone, source, rôle (« Changer »), dernière connexion,
       l'accès complet, « Archiver ce compte » / « Restaurer ce compte », la zone rouge « Supprimer définitivement ».
       v104 (point 4) : l'en-tête est celui des 4 autres onglets (bandeau .fiche-entete : « Revenir … », WhatsApp, les 5 onglets,
       les pages de l'onglet ; puis le titre de page). Plus de croix (« Revenir … » fait la même chose : sortirFiche), plus de
       boutons Suivi / Compte (Suivi = Aperçu, Compte = Profil › Son compte, #/client/<id>/accueil/compte). L'identité et les
       actions restent, sous le titre de page. */
    const prospectF = profil.statut === "prospect", tel = Contact.telephone(d.contact), arch = Archive.le(d.suivi_prospect);
    const anglais = !!(d.prefs && d.prefs.langue === "en");
    const progNom = seances.length && typeof P.nom === "string" && P.nom.trim() ? P.nom.trim().slice(0, 60) : "";
    /* v106 (lot 4, relecture des tests) : où il en est de son programme (avant : carte Programme, « Cycle 01 · semaine 4 / 4 ») */
    let progCycle = ""; try { if (seances.length){ const av = outilProgramme.avancement(P); progCycle = trad("Cycle {n}", { n: String(av.cycle).padStart(2, "0") }) + (av.semaine != null ? " · " + trad("Semaine {a} sur {b}", { a: Math.min(av.semaine, av.duree), b: av.duree }) : ""); } } catch(e){ progCycle = ""; }
    const pFiche = Object.assign({}, pr || {}, { id: uidFiche, prenom: pr && typeof pr.prenom === "string" ? pr.prenom : profil.prenom, nom: pr && typeof pr.nom === "string" ? pr.nom : profil.nom, statut: profil.statut });
    const emailF = (typeof I.email_compte === "string" && I.email_compte.trim()) || (typeof I.email === "string" && I.email.trim()) || "";
    const cxF = Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(pFiche), !!(cx && cx.lue));
    /* v104 (point 4) : le WhatsApp du bandeau (le même sur les 5 onglets) ouvre une conversation vide ; celui-ci ouvre le message
       prêt du prospect : il s'appelle « Message WhatsApp prêt », pour ne pas porter le même texte que celui du bandeau */
    /* v106 (lot 2) : le statut, WhatsApp (message prêt) et Appeler sont dans l'en-tête de la fiche (EnteteFiche, navigation.js) ;
       ici reste « Bilans » d'un client (v106 : avant « Préparer le call ») */
    /* v106 (lot 4, test QA) : plus de bouton « Bilans » (« Préparer le call ») ici : la carte du dernier retour (« Lire ») et
       l'onglet Suivi y mènent déjà ; pour un prospect, la phrase du haut est gardée pour les lecteurs d'écran seulement (le suivi
       commercial, juste dessous, dit la même chose) */
    /* v99 : #/client/<id>/accueil/compte (Profil › Son compte) ouvre l'onglet Compte */
    /* v99 (relecture) : le panneau suit l'adresse seulement (…/accueil = Suivi, sous l'onglet Aperçu ; …/accueil/compte = Compte,
       sous Profil) : « Aperçu » rouvre toujours le Suivi (une action de Compte qui redessine la fiche reste sur Compte).
       v104 (point 4) : seule l'adresse choisit le panneau (les boutons Suivi / Compte ont disparu) */
    const onglet = sousRoute === "compte" ? "compte" : "suivi";
    /* le retour de la semaine (carte de la maquette) : reçu à lire, fait, non fait, ou rien encore */
    const recu = alertes.find(a => a.type === "bilan_recu"), rt = l.retour;
    const retourTexte = recu ? recu.texte : rt && rt.etat ? rt.nom + " : " + rt.texte : (dim ? "Feedback du dimanche" : "Bilan hebdo") + " : " + trad("rien de nouveau");
    /* v106 (lot 4, relecture des tests) : l'état de son feedback sur le dernier bilan (avant : bas de la carte « Bilan hebdomadaire »),
       gardé sous le retour de la semaine */
    const dernierCk = (CK.liste || []).length ? CK.liste[CK.liste.length - 1] : null;
    const fbCk = dernierCk ? Feedback.repond(d.feedbacks, dernierCk) : null;
    const fbAvant = (dernierCk && !fbCk) ? Feedback.pour(d.feedbacks, dernierCk.semaine) : null;
    /* v106 (lot 4, relecture des tests) : la carte « Journal alimentaire » reste (comptes où le journal est allumé) : elle seule dit
       le total du jour et d'où vient l'objectif (sa diète, ton calcul, son calculateur) */
    let jaHTML = ""; try { if (avecJA) jaHTML = JournalAlim.ficheHTML(JournalAlim.remettre(d.journal_alimentaire || JournalAlim.vide()), JournalAlim.objectif({ repas: R, calc: d.calc, calc_perso: d.calc_perso }, profil.statut === "prospect")); } catch(e){ jaHTML = ""; }
    const fbEtat = dernierCk ? `<p class="note fc-fb-etat" style="margin:6px 0 0">${esc(trad("Ton feedback sur ce bilan :"))} ${fbCk ? esc(trad("envoyé le {d}", { d: dateFr(fbCk.date) })) : `<b>${esc(trad(fbAvant ? "écrit avant ce bilan, à relire" : "à écrire"))}</b>`}</p>` : "";
    /* le poids depuis le début (et sa courbe), les 4 dernières semaines */
    const mesuresP = (M.mesures || []).filter(m => m && m.poids != null && isFinite(m.poids) && typeof m.date === "string").slice().sort((a, b) => a.date < b.date ? -1 : 1).slice(-12).map(m => +m.poids);
    const courbe = mesuresP.length > 1 ? (() => { const W = 300, H = 64, mi = Math.min(...mesuresP), ma = Math.max(...mesuresP), e = (ma - mi) || 1;
      const pts = mesuresP.map((v, i) => [(4 + i * (W - 8) / (mesuresP.length - 1)).toFixed(1), (6 + (ma - v) / e * (H - 12)).toFixed(1)]);
      return `<svg class="fc-courbe" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(trad("Courbe du poids"))}"><line x1="0" x2="${W}" y1="${H / 3}" y2="${H / 3}" class="fc-grille"/><line x1="0" x2="${W}" y1="${2 * H / 3}" y2="${2 * H / 3}" class="fc-grille"/><polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" class="fc-trait"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" class="fc-point"/></svg>`; })() : "";
    const kg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + n1(Math.abs(v)) + " kg";
    /* la régularité sur 30 jours : les jours actifs (visites suivies), sinon le score de la semaine */
    const vis = Activite.lecture(d.activite, Activite.suiviPour(pFiche));
    /* v104 (point 3) : UN chiffre de régularité, la semaine passée (semaine complète : celle de Clients, du tableau de bord et des
       alertes), la période écrite ; plus de tuile « Régularité » en double dans « En bref ». Les jours actifs (visites suivies)
       ne sont pas la régularité : ils ont leur ligne à eux. */
    const regTexte = prec.score != null ? prec.score + "/100 · " + trad("semaine passée") : "— · " + trad("semaine passée");
    const regPct = prec.score != null ? Math.max(0, Math.min(100, prec.score)) : 0;
    const joursActifs = vis.suivi ? trad("{n} jours actifs sur 30", { n: vis.jours30 }) : "";
    const etat = (lib, ok, val, manque) => `<li><span>${esc(lib)}</span><b class="${ok ? "fc-ok" : "fc-manque"}">${ok ? `${esc(val)} <span class="fc-coche" aria-hidden="true">${SVG.coche}</span>` : esc(manque)}</b></li>`;
    /* v106 (lot 4) : ses réponses une seule fois (avant aussi dans « Ses réponses » et dans « Découverte ») : le bloc
       « Réponses au questionnaire court » (son email, ses réponses, les anciennes comprises) */
    const reponsesHTML = prospectF ? this.reponsesCourtHTML(I) : "";
    /* v104 (point 4) : le bandeau du haut (posé par afficher, comme sur les autres onglets) reste ; la fiche commence par le
       titre de page, puis l'identité (initiales, nom, pastilles) et les actions (Préparer le call ou message WhatsApp prêt,
       Appeler) ; WhatsApp (client) est celui du bandeau. Plus de croix, d'onglets en double ni de boutons Suivi / Compte. */
    zone.innerHTML = `
      ${this.titreFiche()}
      <section class="fc-ident" id="fc-ident">
        <div class="fc-id"><div class="fc-id-t">
            <div class="fc-pastilles">${progNom ? `<span class="pastille fc-prog" data-notr>${esc(progNom)}</span>` : ""}${anglais ? ` <span class="pastille" title="Ce client utilise l'app en anglais">🇺🇸 anglais</span>` : ""}</div></div></div>
      </section>
      <div class="fc-panneau" id="fc-suivi"${onglet === "suivi" ? "" : " hidden"}>
      ${/* v106 (lot 4) : l'Aperçu montre une seule fois l'essentiel — un client : l'état (phrase et alertes), le dernier retour, le
         poids, la régularité, questionnaire / programme / diète (« Tout voir » ouvre son questionnaire, replié par thème) ; plus de
         « En bref » ni de grille de cartes qui résumait les autres onglets (tout y est). Un prospect : le suivi commercial et
         « Contacter » en haut, ses réponses une seule fois, ses séances de la formation, puis la découverte et la chronologie ; pas
         de cartes « client » (retour, poids, régularité, diète). */ ""}
      <p class="lede fc-lede${prospectF ? " sr-only" : ""}">${profil.statut === "prospect" ? "Compte gratuit : pas de suivi à assurer tant qu'il n'est pas passé client." + (rdc ? " Découverte : " + (rdc.jour == null ? "date d'inscription inconnue" : Decouverte.depuisTexte(rdc.jour)) + (rdc.questionnaire ? ", questionnaire rempli." : ", questionnaire pas encore rempli.") : "") : alertes.length ? `${alertes.length} point${alertes.length > 1 ? "s" : ""} à regarder.` : "Rien à signaler : tout est en ordre."}</p>
      ${alertesV.length ? `<div class="attention-alertes" style="margin:0 0 12px">${alertesV.map(a => `<a class="pastille ${a.niveau === "info" ? "accent" : a.niveau}" href="#/${esc(a.cible)}">${esc(a.texte)}</a>`).join("")}</div>` : ""}
      ${prospectF ? `
        ${SC ? `<div id="fiche-commercial">${Commercial.ficheHTML(Object.assign({}, pr || {}, profil), SC, d.suivi_prospect)}</div>` : ""}
        ${this.contacterHTML(pDc, I)}
        ${reponsesHTML}
        <section class="carte fc-carte fc-pf" id="fc-pf-faites"><p class="fc-pf-l">${esc(trad("Séances de la formation faites (30 j) :"))} <b>${ProgFormation.faites30j(d.seances_formation)}</b></p></section>
        ${jaHTML}
        <div id="fiche-prospect">${this.decouverteFicheHTML(pDc, d.challenge, I, d.suivi_prospect, d.activite, d.emails)}</div>` : `
        <section class="carte fc-carte fc-retour" id="fc-retour"><div class="fc-retour-l"><div><p class="fc-sur">${esc(trad("Retour de la semaine"))}</p><p class="fc-retour-t">${esc(retourTexte)}</p>${fbEtat}</div><a class="lc-lien" id="fc-lire" href="${esc(lienOutil("bilan"))}">${esc(trad("Lire"))}</a></div></section>
        <section class="carte fc-carte fc-poids" id="fc-poids">${l.ev ? `<p class="fc-kg"><b>${kg(l.ev.total)}</b> <span>${esc(trad("depuis le début"))}</span></p>${courbe}${l.ev.mois != null ? `<span class="pastille fc-4s">${esc(trad("4 dernières sem. : {v}", { v: kg(l.ev.mois) }))}</span>` : ""}` : `<p class="fc-kg"><span>${esc(trad("Poids : aucune mesure"))}</span></p>`}</section>
        <section class="carte fc-carte fc-reg" id="fc-regularite"><div class="fc-reg-l"><b>${esc(trad("Régularité"))}</b><span>${esc(regTexte)}</span></div><div class="fc-jauge" role="img" aria-label="${esc(trad("Régularité") + " : " + regTexte)}"><span style="width:${regPct}%"></span></div>${joursActifs ? `<p class="note fc-actifs" style="margin:8px 0 0">${esc(joursActifs)}</p>` : ""}</section>
        <section class="carte fc-carte" id="fc-etat"><ul class="fiche-l fc-lignes">${etat("Questionnaire", I.complet, trad("Rempli"), trad("à remplir")).replace("<span>Questionnaire</span>", `<span>${esc(trad("Questionnaire"))} <a class="lc-lien fc-tout-voir" id="fc-questionnaire" href="${esc(lienOutil("profil"))}">${esc(trad("Tout voir"))}</a></span>`)}${etat("Programme", seances.length, (progNom || trad("envoyé")) + (progCycle ? " · " + progCycle : ""), trad("à faire"))}${etat("Diète", nbJours, trad("envoyée"), trad("à définir"))}${nbRemplaces ? `<li id="fc-remplaces"><span>${esc(trad("Repas remplacés ce mois"))}</span><b>${nbRemplaces}</b></li>` : ""}<li id="fc-pf-faites"><span>${esc(trad("Séances de la formation faites (30 j) :"))}</span> <b>${ProgFormation.faites30j(d.seances_formation)}</b></li></ul></section>
        ${jaHTML}
      `}
      </div>
      <div class="fc-panneau" id="fc-compte"${onglet === "compte" ? "" : " hidden"}>
        <section class="carte fc-carte" id="fc-infos"><ul class="fiche-l fc-lignes">
          <li><span>${esc(trad("Email"))}</span><b data-notr id="fc-email">${emailF ? esc(emailF) : "—"}</b></li>
          <li><span>${esc(trad("Téléphone"))}</span><b id="fiche-tel">${Telephone.valide(tel) ? `<span class="tel-num" data-notr>${esc(tel)}</span>` : "—"}</b></li>
          <li><span>${esc(trad("Source"))}</span><b id="fiche-source" data-notr>${esc(Contact.ref(d.contact) || "—")}</b></li>
          <li><span>${esc(trad("Rôle"))}</span><b><span id="fc-role">${esc(trad(prospectF ? "Prospect" : "Client"))}</span></b></li>
          <li><span>${esc(trad("Dernière connexion"))}</span><b id="fc-derniere" title="${esc(Connexions.aide(cxF))}">${esc(Connexions.texteDerniere(cxF))}</b></li>
          <li><span>${esc(trad("Connexions"))}</span><b id="fc-connexions" title="${esc(Connexions.aide(cxF))}">${esc(Connexions.texteNombre(cxF))}</b></li>
        </ul></section>
        ${arch ? `<p class="note" id="fc-archive-note" style="margin:0">${esc(trad("Archivé le {d} : ce compte n'apparaît plus dans tes listes, tes compteurs ni « À traiter ». Rien n'a changé pour la personne.", { d: dateFr(Decouverte.dateLocale(arch) || arch.slice(0, 10)) }))}</p>` : ""}
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
        if (bp) bp.innerHTML = this.decouverteFicheHTML(pDc, d.challenge, I, S, d.activite, d.emails);   // #dc-copier est dans #fiche-actions (déjà branché)
        rebrancher();
      });
      if (boite) rebrancher();
    }
    /* v104 (point 4) : les boutons Suivi / Compte (v83, bloc 3) ont disparu : le panneau Suivi s'ouvre par l'onglet Aperçu,
       le panneau Compte par Profil › « Son compte » (des liens du bandeau, comme les pages des autres onglets) */
    /* v106 (lot 2) : les actions du compte (statut, accès complet, archiver / restaurer, supprimer définitivement) sont dans le menu
       « ⋯ » de l'en-tête de la fiche (EnteteFiche.brancher, navigation.js) : mêmes fonctions, mêmes fenêtres */
    /* v106 (lot 2) : les notes privées (v38) sont dans le volet « Notes » de l'en-tête (EnteteFiche.notes) */
    return null;
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
      /* v106 (lot 6) : « Noter ma séance » ouvre directement cette séance (#/programme/noter-<n>), les autres repliées */
      if (ps.prochaine) acces.push({ id: "programme", href: "#/programme/noter-" + ps.prochaine.si, ico: ICONES.programme, t: trad("Noter ma séance"), s: ps.prochaine.sc.nom || trad("Séance {n}", { n: ps.prochaine.si + 1 }) });
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
    if (!consult && !aProgramme && !aDiete) acces.push({ id: "formation", ico: ICONES.formation, t: trad("Commencer la Formation"), s: trad("Les bases, à ton rythme") });

    const ligne = a => `<a class="acces${a.ok ? " fait" : ""}" href="${esc(a.href || "#/" + a.id)}"><span class="ico">${a.ico}</span><span class="txt"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></span><span class="fleche">›</span></a>`;

    zone.innerHTML = `
      <header class="masthead">
        <span class="eyebrow">${esc(this.dateLongue())}</span>
        <h1>${consult ? esc(trad("Vue d'ensemble")) + (prenom ? " — " + esc(prenom) : "") : esc(trad("Bonjour")) + (prenom ? " " + esc(prenom) : "")}</h1>
        <p class="lede">${esc(resume)}</p>
      </header>
      ${/* v106 (lot 6) : « Aujourd'hui » en premier (séance du jour, repas, mesure), puis le bilan ou le feedback à remplir ; le reste dessous */ ""}
      ${acces.length ? `<section class="panel" id="acc-aujourdhui"><h2>${esc(trad("Aujourd'hui"))}</h2><div class="acces-l">${acces.map(ligne).join("")}</div></section>` : ""}
      ${dim ? Checkin.bandeauHTML(CK, moi) : ""}
      ${dim ? `<section class="panel" id="acc-fbd"><h2>${esc(trad("Feedback de la semaine"))}</h2><div class="acces-l">${nonVus.length ? Checkin.accesReponseHTML(nonVus[0]) : ""}${Checkin.statutHTML(CK, { lien: "#/suivi", uid: moi })}</div></section>`
        : (aProgramme || aDiete || fbR) ? `<section class="panel"><h2>${esc(trad("Bilan hebdomadaire"))}</h2><div class="acces-l">${fbR ? Feedback.accesHTML(fbR) : ""}${(aProgramme || aDiete) ? Checkin.statutHTML(CK, { lien: "#/suivi", uid: moi }) : ""}</div></section>` : ""}
      ${consult ? "" : BrouillonProg.annonceHTML(P)}
      ${ja ? JournalAlim.carteAccueilHTML(JournalAlim.local(d.journal_alimentaire), JournalAlim.objectif(d, false)) : ""}
      <section class="panel">
        <h2>${esc(trad("Cette semaine"))}</h2>
        <div class="tiles">${tuiles}</div>
        <p class="note" style="margin:12px 0 0">${esc(trad("La régularité mesure ce que tu fais — séances, repas, mesure — pas ce que dit la balance."))}</p>
      </section>
      ${!consult && !aProgramme ? ProgFormation.carteHTML(I, (Store.cache && Store.cache.prefs) || {}) : ""}
      ${obj ? `<section class="panel"><h2>${esc(trad("Tes objectifs du mois"))}</h2>
        ${obj.liste.map((t, i) => { if (!t) return ""; const st = Regularite.statutObjectif(P, OF, i); return `<div class="objectif${st === "atteint" ? " atteint" : ""}${st === "non_atteint" ? " rate" : ""}"><span class="num">0${i + 1}</span><span class="texte" data-notr>${esc(t)}</span><span class="pastille ${Regularite.classeStatut(st)}">${esc(Regularite.libelleStatut(st))}</span></div>`; }).join("")}
        <div class="actions"><a class="btn ghost petit" href="#/suivi">${esc(trad("Cocher mes objectifs"))}</a></div>
      </section>` : ""}
      <section class="panel">
        <h2>${esc(trad("Mon bilan"))}</h2>
        <p class="note" style="margin:0 0 12px">${esc(trad("Tes quatre dernières semaines : régularité, poids, ce qui a bougé et la progression de tes charges."))}</p>
        <div class="actions" style="margin-top:0"><a class="btn ghost petit" href="#/suivi">${esc(trad("Voir mon bilan du mois"))}</a></div>
      </section>`;
    if (!consult) BrouillonProg.brancherAnnonce(zone, P);   // v96 : « C'est noté » sous l'annonce du nouveau bloc
  }
};

