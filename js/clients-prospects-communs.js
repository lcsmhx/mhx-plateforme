/* ------------------------------------------------------------------
   v104 (décision 10 de Lucas) — OUTILS COMMUNS DE CLIENTS ET DE PROSPECTS
   Ce qui sert à plusieurs pages du coach (fiche d'un client, listes, tableau de bord, menu) : Clients, Archive,
   ListeCoach, Acces (venus de js/outilClients.js) et Commercial, MessageProspect, Nouveautes, Mesure (venus de
   js/outilProspects.js). Code déplacé tel quel, dans le même ordre. Ces deux fichiers ne gardent que leurs pages
   (Clients, Suivi détaillé, Comptes ; Prospects, Suivi commercial, Newsletter).
   Comme ces trois fichiers ne servent qu'au coach, ils sont dans MHX_COACH (index.html) : l'app d'un client ou d'un
   prospect ne les télécharge plus (environ 165 Ko de moins).
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   CLIENTS (v37) — ce que le coach sait de chaque client, en un objet.
   Chargement partage (profils + donnees, sans les historiques), resume
   par client (poids, activite, regularite, ce qui manque) et ALERTES.
   Les alertes repondent a une seule question : « qui a besoin de moi
   aujourd'hui ? ». Pas d'usine a gaz : des regles simples, chacune avec
   l'ecran ou aller.
   ------------------------------------------------------------------ */
const Clients = {
  /* v47 : lecture par pages de 1 000 (Supabase coupe a 1 000 lignes sans prevenir : avec l'inscription
     ouverte, quelques centaines de prospects suffiraient a faire disparaitre des clients de la liste) */
  async pages(chemin, cle){
    const PAGE = 1000, tout = [], vus = new Set();
    let precedent = null;
    for (let debut = 0; ; debut += PAGE){
      let lot;
      try { lot = await Auth.appel(chemin, { headers: { "Range-Unit": "items", "Range": debut + "-" + (debut + PAGE - 1) } }); }
      catch(e){ if (e && e.statut === 416) break; throw e; }   // 416 = au-dela de la fin
      if (!Array.isArray(lot) || !lot.length) break;
      const k0 = cle(lot[0]);
      if (precedent !== null && k0 === precedent) break;   // le serveur ignore Range : on a deja tout
      lot.forEach(l => { const k = cle(l); if (!vus.has(k)){ vus.add(k); tout.push(l); } });   // une inscription entre deux pages ne cree pas de doublon
      precedent = k0;
      if (lot.length !== PAGE) break;
      if (debut > 200000) break;   // garde-fou
    }
    return tout;
  },
  /* v56 — le nombre de connexions et la derniere connexion de chaque compte (table connexions, lisible par le coach seul :
     regles de la base) : { uid: ligne }, ou null si la table n'a pas pu etre lue (base sans la migration, panne) : les
     colonnes disent alors « — » et tout le reste se charge comme avant */
  async lireConnexions(){
    try {
      const l = await this.pages("/rest/v1/connexions?select=user_id,nombre,derniere,premiere&order=user_id.asc", x => String(x && x.user_id));
      const m = {}; l.forEach(x => { if (x && typeof x.user_id === "string") m[x.user_id] = x; });
      return m;
    } catch(e){ return null; }
  },
  /* v56 : opts.connexions === false : sans le compteur (tableau de bord, qui ne l'affiche pas) */
  async charger(opts){
    /* v56 : en meme temps que le reste ; elle ne rejette jamais et ne retarde jamais la liste de plus de 8 s (« — » alors) */
    const cx = opts && opts.connexions === false ? Promise.resolve(null)
      : Promise.race([this.lireConnexions(), new Promise(r => setTimeout(() => r(null), 8000))]);
    /* les historiques (jusqu'a 24 plans par client) ne servent pas ici :
       on ne les telecharge pas */
    /* v38 : les notes privees ne servent pas ici non plus */
    /* profils et donnees en meme temps (deux lectures independantes : un aller-retour au lieu de deux) */
    /* v79 : le journal alimentaire (jusqu'a 1 Mo par compte) n'est pas telecharge ici : sa date seule, lue a part (une lecture
       legere en meme temps), compte comme une saisie ; lecture ratee : rien (la date des autres cles reste) */
    const [profils, donnees, journaux] = await Promise.all([
      this.pages("/rest/v1/profils?select=*&order=cree_le.desc,id.asc", l => String(l && l.id)),
      /* v104 (partie 4) : ni les brouillons du coach (programme et repas : une entrée par client) ni son atelier ne sont lus ici
         (aucune page qui appelle Clients.charger ne s'en sert) ; seule leur date est lue, avec celle du journal alimentaire */
      this.pages("/rest/v1/donnees?select=user_id,outil,contenu,maj_le&outil=not.in.(hist_programme,hist_repas,notes_coach,journal_alimentaire,brouillons_programme,brouillons_repas,atelier)&order=user_id.asc,outil.asc", l => String(l && l.user_id) + "|" + String(l && l.outil)),
      this.pages("/rest/v1/donnees?select=user_id,outil,maj_le&outil=in.(journal_alimentaire,brouillons_programme,brouillons_repas,atelier)&order=user_id.asc,outil.asc", l => String(l && l.user_id) + "|" + String(l && l.outil)).catch(() => [])
    ]);
    const parClient = {}, contenus = {};
    /* « Activite » = ce que le CLIENT a saisi. Ce que le coach ecrit dans
       sa fiche (programme, diete, calories, feedbacks, notes) ne dit rien de lui. */
    const ecritParCoach = ["programme", "repas", "calc", "complements", "feedbacks", "notes_coach", "suivi_prospect"];
    /* v51 : ni le choix des emails de suivi, ni la date « vu » des Nouveautes ne sont une saisie ; les pages vues
       (activite) ne comptent que pour un prospect (un client inactif garde son alerte « Inactif depuis N j ») */
    /* v72 (A) : le numéro (contact) non plus ; v72 (E) : la visite du coach (coach_visite) non plus */
    const pasSaisie = ["emails", "coach_notifs", "contact", "coach_visite"], prospects = new Set((profils || []).filter(p => p && p.statut === "prospect").map(p => p.id));
    (donnees || []).forEach(d => {
      const saisie = ecritParCoach.indexOf(d.outil) === -1 && pasSaisie.indexOf(d.outil) === -1 && (d.outil !== "activite" || prospects.has(d.user_id));
      const c = Forme.cle(d.outil, d.contenu);   // v42
      /* v59 (Q13-4) : checkins compte par ses vraies saisies (ses entrées), pas par la date de sa ligne */
      const quand = saisie ? this.dateSaisie(d.outil, d.maj_le, c) : null;
      if (quand && (!parClient[d.user_id] || quand > parClient[d.user_id])) parClient[d.user_id] = quand;
      /* v86 (lot 1) : la boîte de chaque compte sans prototype — une ligne écrite par le compte avec une clé « __proto__ » ne
         fait plus apparaître de fausses clés du coach (suivi_prospect, feedbacks) dans les listes ; les vraies clés restent lues */
      (contenus[d.user_id] = contenus[d.user_id] || Object.create(null))[d.outil] = c;
    });
    (journaux || []).forEach(d => {
      if (!d || ["journal_alimentaire", "brouillons_programme", "brouillons_repas", "atelier"].indexOf(d.outil) === -1 || typeof d.user_id !== "string" || typeof d.maj_le !== "string") return;
      const quand = this.dateSaisie(d.outil, d.maj_le, null);
      if (quand && (!parClient[d.user_id] || quand > parClient[d.user_id])) parClient[d.user_id] = quand;
    });
    return { profils: profils || [], parClient, contenus, connexions: await cx };
  },
  /* v59 (Q13-4) — l'instant de la dernière VRAIE saisie que représente une ligne de donnees (maj_le : sa date), ou null.
     Hors checkins : maj_le. checkins : l'envoi le plus récent d'un bilan ou d'un feedback — envoye_a (l'instant) ;
     sinon envoye_le (un jour sans heure, celui de l'appareil qui l'a envoyé : compté du début de ce jour, heure locale ;
     le jour même de la ligne, l'heure de la ligne) ; jamais après la ligne. Un smiley (avis) ou « réponse vue »
     (fb_vu) réécrivent la ligne sans être une saisie : ils ne comptent pas. Une date illisible (données piégées) ne
     compte pas : jamais « NaN j ». Même règle dans Mes clients, la fiche, le tableau de bord et Comptes. */
  dateSaisie(outil, maj, contenu){
    if (outil !== "checkins") return maj || null;
    const tMaj = typeof maj === "string" ? Date.parse(maj) : NaN, jourMaj = isNaN(tMaj) ? "" : Regularite.iso(new Date(tMaj));
    let t = NaN;
    Checkin.liste(contenu).forEach(x => {
      let u = typeof x.envoye_a === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x.envoye_a) ? Date.parse(x.envoye_a) : NaN;
      if (isNaN(u) && typeof x.envoye_le === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.envoye_le)) u = x.envoye_le === jourMaj ? tMaj : new Date(x.envoye_le + "T00:00:00").getTime();
      if (!isNaN(u) && (isNaN(t) || u > t)) t = u;
    });
    if (isNaN(t)) return null;
    return !isNaN(tMaj) && t >= tMaj ? maj : new Date(t).toISOString();
  },

  /* le resume d'un client (memes calculs qu'avant dans Mes clients) ; v56 : cx = { lue, ligne } (Clients.resumer) */
  resumerUn(p, c, dernierMaj, cx){
    const K = outilClients;
    const ev = K.evolution(c.mens);
    const j = K.jours(dernierMaj);
    const objectif = (c.intake && c.intake.objectif) || "";
    const sens = /perte|s[èe]che/i.test(objectif) ? -1 : /prise|masse/i.test(objectif) ? 1 : 0;
    const ec = K.ecarts(c.intake, c.calc);
    const l = {
      p: p, ev: ev, jours: j, ecarts: ec,
      ecartKcal: ec.length ? K.ecartKcal(c.intake, c.calc) : null,
      nom: Clients.nom(p),   // v43 : « Sans nom » plutot que son identifiant
      intake: !!(c.intake && c.intake.complet),
      programme: !!(c.programme && (c.programme.seances||[]).length),
      diete: !!(c.repas && ((c.repas.jours || []).some(j => (j.repas || []).length) || (c.repas.repas || []).length)),
      sens: sens,
      ch: (c.challenge && typeof c.challenge === "object") ? c.challenge : null,   // clics « Réserver mon bilan » et case « J'ai réservé » (prospects)
      /* questionnaire court du prospect (Decouverte) : seulement ce que le suivi commercial lit */
      /* v52 : repondues / nb_questions comptes sur le questionnaire de ce prospect (3 questions, ou 10 pour un ancien prospect) */
      dc: (c.intake && typeof c.intake === "object") ? { court_le: c.intake.court_le, motivation: c.intake.motivation, repondues: Decouverte.repondues(c.intake), nb_questions: Decouverte.liste(c.intake).length,
            court_debut: typeof c.intake.court_debut === "string" ? c.intake.court_debut : null, objectif: typeof c.intake.objectif === "string" ? c.intake.objectif.slice(0, 120) : "",
            email: typeof c.intake.email_compte === "string" && c.intake.email_compte ? c.intake.email_compte.slice(0, 254) : typeof c.intake.email === "string" ? c.intake.email.slice(0, 254) : "",
            /* v52 (lot G) : les réponses (page Prospects, CSV) ; "" si absente ou illisible. v53 : + obstacle (« Ce qui l'a
               bloqué »), ancien = ses réponses sont celles de l'ancien questionnaire (l'obstacle y répondait à une autre question) */
            probleme: typeof c.intake.probleme === "string" ? c.intake.probleme.trim().slice(0, 120) : "",
            obstacle: typeof c.intake.obstacle === "string" ? c.intake.obstacle.trim().slice(0, 1000) : "",
            projection: typeof c.intake.projection === "string" ? c.intake.projection.trim().slice(0, 1000) : "",
            ancien: Decouverte.ancien(c.intake),
            bilan: Decouverte.bilanPropose(c.intake) } : null,   // v62 (L) : son choix sur la page « Ton plan d'action » (« Plus tard » d'avant la v62)
      newsletter: Accords.newsletterCoach(c.emails),   // v52 (lot G) : { oui, depuis } d'après la clé emails (CSV)
      tel: Contact.telephone(c.contact),   // v72 (A) : son numéro (clé contact), "" si aucun ou illisible
      ref: Contact.ref(c.contact),   // v72 (F) : le code de son lien d'inscription (clé contact), "" si aucun ou illisible
      act: (c.activite && typeof c.activite === "object") ? c.activite : null,   // v51 : activite (chronologie de la fiche)
      /* v53 (chantier 4) : dernière visite et jours actifs sur 30 jours ; un compte non suivi (client hors interrupteur
         suivi_visites_clients) : rien (« — »), même s'il a une ancienne clé activite de quand il était prospect */
      visites: Activite.lecture(c.activite, Activite.suiviPour(p)),
      /* v56 : nombre de connexions et derniere connexion (table connexions), pour chaque client et prospect ; « — » si la
         table n'a pas pu etre lue */
      connexions: Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(p), !!(cx && cx.lue)),
      suivi: (c.suivi_prospect && typeof c.suivi_prospect === "object") ? c.suivi_prospect : null,   // v49 : suivi commercial
      archive: Archive.le(c.suivi_prospect),   // v83 (bloc 3) : archivé par le coach (instant), ou null
      activite: dernierMaj || null
    };
    /* regularite : la semaine passee (complete) sert au tri, celle en cours
       est donnee a titre indicatif. Rien tant qu'il n'a ni programme ni diete. */
    if (!l.programme && !l.diete){ l.reg = null; l.regEnCours = null; }
    else { l.reg = Regularite.calculer(c, -1).score; l.regEnCours = Regularite.calculer(c, 0).score; }
    l.alertes = this.alertes(l, c);
    /* v53 (chantier 4) : Mes clients — retour de la semaine, dernière note, dernier smiley (clients seulement) */
    if (!(p && p.statut === "prospect")){
      const ck = c.checkins || { liste: [] };
      l.retour = this.retour(l, c);
      const notes = Checkin.liste(ck).filter(x => x.format === "dimanche" && Checkin.note(x) != null && typeof x.semaine === "string").sort((a, b) => a.semaine < b.semaine ? -1 : 1);
      l.note = notes.length ? Checkin.note(notes[notes.length - 1]) : null;
      const av = Checkin.avisListe(ck).slice().sort((a, b) => String(a.le || "") < String(b.le || "") ? -1 : 1).pop();
      l.smiley = av ? (Checkin.SMILEYS.find(x => x.id === av.smiley) || null) : null;
    } else { l.retour = null; l.note = null; l.smiley = null; }
    return l;
  },
  /* v53 (chantier 4) — le retour de la semaine d'un client, selon SA règle (Checkin : feedback du dimanche pour les comptes
     de l'interrupteur, sinon bilan du vendredi) : « à traiter » / « à lire » (reçu dans les 7 derniers jours, sans réponse
     du coach : l'alerte bilan_recu), « fait » (la dernière entrée des deux dernières semaines a sa réponse), « non fait »
     / « non complété » (l'alerte bilan_manque), sinon rien. */
  retour(l, c){
    const ck = c.checkins || { liste: [] }, e = Checkin.etat(ck, l.p && l.p.id), dim = e.semaine.regle === "dimanche";
    const nom = dim ? "Feedback du dimanche" : "Bilan du vendredi";
    if (l.alertes.some(a => a.type === "bilan_recu")) return { regle: e.semaine.regle, nom, etat: "a_traiter", texte: dim ? "à traiter" : "à lire" };
    const der = Checkin.liste(ck).filter(x => x.envoye_le && typeof x.semaine === "string").sort((a, b) => a.semaine < b.semaine ? -1 : 1).pop();
    if (der && der.semaine >= Regularite.bornes(-1).debut && Feedback.repond(c.feedbacks, der)) return { regle: e.semaine.regle, nom, etat: "fait", texte: "fait" };
    if (l.alertes.some(a => a.type === "bilan_manque")) return { regle: e.semaine.regle, nom, etat: "non_fait", texte: dim ? "non fait" : "non complété" };
    return { regle: e.semaine.regle, nom, etat: null, texte: "" };
  },
  /* v53 (chantier 4) — une urgence pour le tableau de bord (badge de la tuile Clients, « À traiter maintenant ») : une
     alerte de niveau « mauvais » (dont 😞 non traité, note en chute, inactivité), ou un retour de la semaine reçu à lire */
  urgent(l){ return !!(l && l.p && l.p.statut !== "prospect" && (l.alertes || []).some(a => a.niveau === "mauvais" || a.type === "bilan_recu")); },

  /* v56 : connexions = celles de Clients.charger ({ uid: ligne }, ou null si la table n'a pas pu etre lue ; absent : « — ») */
  resumer(profils, parClient, contenus, connexions){
    const cx = p => ({ lue: !!connexions && typeof connexions === "object", ligne: connexions && typeof connexions === "object" ? connexions[p.id] : null });
    /* v42 : les donnees illisibles d'UN client ne font jamais tomber le
       tableau de bord pour tous : sa ligne reste, avec une alerte. */
    const lignes = (profils || []).filter(p => p && p.id && p.role !== "coach").map(p => {
      try { return this.resumerUn(p, contenus[p.id] || {}, parClient[p.id], cx(p)); }
      catch(e){
        console.warn("[MHX] résumé impossible pour un client", e);
        const l = this.resumerUn(p, {}, parClient[p.id], cx(p));
        l.illisible = true;
        l.archive = Archive.le((contenus[p.id] || {}).suivi_prospect);   // v83 : un compte archivé reste archivé, même illisible
        l.alertes = [{ type: "illisible", niveau: "attention", cible: "accueil", texte: "Données illisibles — à vérifier" }];
        return l;
      }
    });
    /* Ceux qui demandent une action passent devant. */
    const seuils = (CONFIG.regularite && CONFIG.regularite.seuils) || { bon: 70, moyen: 40 };
    const urgence = (l) => (l.ecarts.length ? 200 : 0) +
                           (l.jours === null ? 100 : l.jours >= 10 ? 90 : 0) +
                           (!l.intake ? 50 : 0) + (!l.programme ? 20 : 0) + (!l.diete ? 10 : 0) +
                           (l.reg == null ? 0 : l.reg < seuils.moyen ? 60 : l.reg < seuils.bon ? 25 : 0) +
                           l.alertes.reduce((n, a) => n + (a.niveau === "mauvais" ? 30 : a.niveau === "attention" ? 12 : 3), 0);
    /* v53 (chantier 4) : d'abord les 😞 non traités et les notes en chute, puis les retours de la semaine à lire, puis le
       reste (dans chaque groupe, le tri d'avant) */
    const groupe = l => l.alertes.some(a => a.type === "avis_triste" || a.type === "note_chute") ? 0 : l.alertes.some(a => a.type === "bilan_recu") ? 1 : 2;
    lignes.sort((a,b) => groupe(a) - groupe(b) || urgence(b) - urgence(a) || (b.jours||0) - (a.jours||0));
    return lignes;
  },

  /* ---------- ALERTES (phase 19) ----------
     niveau : mauvais (agir aujourd'hui) · attention (cette semaine) · info (bon a savoir)
     cible  : l'onglet de la fiche a ouvrir */
  alertes(l, c){
    const out = [];
    /* v39 : un prospect (compte gratuit) n'a pas de suivi a assurer */
    if (l.p && l.p.statut === "prospect") return out;
    const seuils = (CONFIG.regularite && CONFIG.regularite.seuils) || { bon: 70, moyen: 40 };
    const auj = aujourdhui();
    if (l.ecarts.length) out.push({ type: "chiffres", niveau: "mauvais", cible: "calculateur",
      texte: "Calculateur ≠ questionnaire" + (l.ecartKcal ? ` (${l.ecartKcal > 0 ? "+" : ""}${fmt(l.ecartKcal)} kcal/j)` : "") });
    if (l.jours === null) out.push({ type: "inactif", niveau: "attention", cible: "profil", texte: "Jamais rien saisi" });
    else if (l.jours >= 10) out.push({ type: "inactif", niveau: "mauvais", cible: "accueil", texte: `Inactif depuis ${l.jours} j` });
    if (!l.intake) out.push({ type: "manque", niveau: "attention", cible: "profil", texte: "Questionnaire à remplir" });
    if (!l.programme) out.push({ type: "manque", niveau: "attention", cible: "programme", texte: "Programme à envoyer" });
    if (!l.diete) out.push({ type: "manque", niveau: "attention", cible: "nutrition", texte: "Diète à envoyer" });
    if (l.reg != null && l.reg < seuils.moyen) out.push({ type: "regularite", niveau: "mauvais", cible: "suivi", texte: `Régularité faible : ${l.reg}/100` });
    /* bilan hebdomadaire : recu (a lire) ou manquant.
       v53 (chantier 3) : la regle de CE client — bilan du vendredi (comme avant), ou feedback du dimanche : « reçu —
       à lire » meme sans programme, « non fait » des le lundi (semaine passee sans feedback, fenetre fermee ou en retard) */
    const ck = c.checkins || { liste: [] }, e = Checkin.etat(ck, l.p && l.p.id), dim = e.semaine.regle === "dimanche";
    if (l.programme || l.diete || dim){
      const il7 = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return Regularite.iso(d); })();
      /* recu : un bilan envoye dans les sept derniers jours, quelle que soit sa
         semaine, et auquel le coach n'a pas encore repondu (v38 : un feedback
         ecrit sous CE bilan ; un mot ecrit avant son arrivee ne compte pas) */
      const recent = Checkin.liste(ck).filter(x => x.envoye_le && x.envoye_le >= il7 && !Feedback.repond(c.feedbacks, x));
      if (recent.length) out.push({ type: "bilan_recu", niveau: "info", cible: "bilan", texte: recent.some(x => x.format === "dimanche") ? "Feedback du dimanche reçu — à lire" : "Bilan hebdo reçu — à lire" });
      else if (dim ? ((l.programme || l.diete) && !e.fait && e.semaine.etat !== "ouvert") : (!e.fait && e.semaine.fin < auj)) out.push({ type: "bilan_manque", niveau: "attention", cible: "suivi", texte: dim ? "Feedback du dimanche non fait" : "Bilan hebdo non complété" });
    }
    /* v53 — ce que le client a dit du feedback (calcule a l'affichage, rien n'est stocke) : un 😞 sur la reponse du
       coach, tant qu'il n'y a pas repondu depuis ; une note en chute (5 ou moins, ou 2 points de moins que la
       precedente). Niveau « mauvais », et en tete des alertes « mauvais » (plan V2 : les 😞 et les notes en chute en haut). */
    const prio = [];
    if (Checkin.avisTristes(ck, c.feedbacks).length) prio.push({ type: "avis_triste", niveau: "mauvais", cible: "bilan", texte: "😞 sur ta réponse — à traiter" });
    const chute = Checkin.noteEnChute(ck);
    if (chute) prio.push({ type: "note_chute", niveau: "mauvais", cible: "bilan", texte: chute.avant != null && chute.avant - chute.note >= 2 ? `Note en chute : ${chute.avant} → ${chute.note}/10` : `Note en chute : ${chute.note}/10` });
    /* objectif du mois non atteint (statut pose par le coach) */
    const o = c.programme && c.programme.objectifs;
    if (o && o.mois === auj.slice(0, 7)) (o.statuts || []).forEach((st, i) => { if (st === "non_atteint" && (o.liste || [])[i]) out.push({ type: "objectif", niveau: "attention", cible: "suivi", texte: `Objectif non atteint : ${(o.liste || [])[i]}` }); });
    /* stagnation : au moins trois mesures sur trois semaines, et le poids n'a pas bouge */
    if (l.sens && c.mens && (c.mens.mesures || []).length >= 3){
      const m = c.mens.mesures.filter(x => x.date && x.poids != null).slice().sort((a, b) => a.date < b.date ? -1 : 1);
      if (m.length >= 3){
        const der = m[m.length - 1], ref = m.find(x => (new Date(der.date) - new Date(x.date)) / 86400000 <= 28) || m[0];
        const jours = Math.round((new Date(der.date) - new Date(ref.date)) / 86400000);
        if (jours >= 21 && Math.abs(der.poids - ref.poids) < 0.3) out.push({ type: "stagnation", niveau: "info", cible: "mensurations", texte: `Poids stable depuis ${jours} j (${n1(der.poids)} kg)` });
      }
    }
    const rang = { mauvais: 0, attention: 1, info: 2 };
    return prio.concat(out).sort((a, b) => rang[a.niveau] - rang[b.niveau]);
  },

  /* ouvre la fiche d'un client sur un onglet */
  ouvrir(p, nom, cible){
    /* v71 (I) : l'ecran d'origine (pour « Revenir … » : tableau, clients, prospects ; une fiche ouverte depuis une autre fiche
       garde l'origine de la premiere) et l'adresse canonique #/client/<uuid>/<outil>, qui survit a un rechargement */
    if (["tableau", "clients", "prospects", "suivi-clients", "comptes", "suivi-commercial", "newsletter"].indexOf(courant) > -1){ Store.retourVers = courant; ListeCoach.memoriser(courant); }   // v83 : la position de la page, retrouvée au retour
    else if (Store.idConsulte !== p || !Store.retourVers) Store.retourVers = "clients";
    Store.oublier(Store.idConsulte);
    Store.idConsulte = p; Store.nomConsulte = nom;
    location.hash = "#/client/" + p + "/" + (cible || "accueil");
  },

  /* v43 — le nom affiche d'un compte, le meme partout (tableau de bord, Mes
     clients, Comptes, fiche, bandeau, fil d'Ariane). Sans prenom ni nom :
     « Sans nom », jamais l'identifiant du compte. */
  SANS_NOM: "Sans nom",
  nom(p){ return (((p && p.prenom) || "") + " " + ((p && p.nom) || "")).trim() || Clients.SANS_NOM; },
  initiales(nom){ if (!nom || nom === Clients.SANS_NOM) return "?"; return String(nom).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("") || "?"; },
  /* l'avatar (initiales) ; neutre — gris, « ? » — pour un compte sans nom */
  avatar(nom){ const neutre = !nom || nom === Clients.SANS_NOM; return `<span class="avatar${neutre ? " neutre" : ""}">${esc(Clients.initiales(nom))}</span>`; }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — ARCHIVAGE (décision 1 de Lucas : dans les listes, on archive au lieu de supprimer).
   Archiver = masquer la personne des listes, des compteurs, de « à traiter » et des Nouveautés du coach ; rien ne change pour
   elle (compte, connexion, données) ; on restaure à tout moment. Rangé SANS migration dans la clé coach-seul « suivi_prospect »
   (illisible et non modifiable par la personne : règles de la base ; déjà lue pour tous les comptes par Clients.charger et par
   la fiche), champ archive_le = l'instant de l'archivage (ISO), remis à null pour restaurer. Écriture par Commercial.modifier :
   écriture conditionnelle (CleCoach.ecrireSi) qui relit et garde tous les autres champs. Pas dans notes_coach (proposition de
   la mission) : NotesCoach réécrit tout l'objet à chaque note (l'archivage serait effacé sans bruit) et les listes ne la lisent
   pas. Aucun événement ajouté à l'historique du suivi (il est limité à 30 et sert à « Bilan réservé »). Jamais de DELETE.
   ------------------------------------------------------------------ */
const Archive = {
  /* l'instant de l'archivage (texte ISO lisible), ou null : une valeur piégée ne fait rien tomber et ne compte pas */
  le(S){
    const v = (S && typeof S === "object" && !Array.isArray(S)) ? S.archive_le : null;
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !isNaN(Date.parse(v)) ? v : null;
  },
  est(l){ return !!(l && l.archive); },
  /* archiver (oui) ou restaurer (non) ces comptes, un par un (une écriture conditionnelle chacun ; un compte dont une action
     commerciale est en cours est laissé de côté) ; rend { ok: [uid], ko: [{ uid, e }] } */
  async appliquer(uids, oui){
    const ok = [], ko = [];
    for (const uid of uids || []){
      if (Commercial.occupe[uid]){ ko.push({ uid, e: new Error("une action est en cours pour ce compte") }); continue; }
      Commercial.occupe[uid] = true;
      try {
        const le = oui ? new Date().toISOString() : null;
        const S = await Commercial.modifier(uid, c => { c.archive_le = le; return c; });
        if (!!this.le(S) !== !!oui) throw new Error("la base n'a pas confirmé le changement");
        ok.push(uid);
      } catch(e){ ko.push({ uid, e }); }
      finally { delete Commercial.occupe[uid]; }
    }
    return { ok, ko };
  }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — LA LISTE DU COACH (maquettes Liste, ListeProspects, ListeSelection, ListeConfirmation), la même pour
   Clients et Prospects : titre, nombre, recherche par nom (sans tenir compte des accents ni des majuscules), filtres en
   pastilles, « + » (Créer un accès), « Sélectionner » ; chaque ligne : initiales, nom, raison, info à droite. Sélection :
   des cases, « Tout sélectionner » (la liste filtrée), une barre en bas « N sélectionnés » + « Archiver » (« Restaurer » dans
   « Archivés »), une fenêtre de confirmation (objet UI) avant tout archivage, même d'un seul compte, puis un message.
   La recherche et le filtre sont gardés (le temps de la session), la position aussi au retour d'une fiche (Clients.ouvrir
   la note, la croix de la fiche demande de la rendre : ListeCoach.revenir).
   items : [{ uid, nom, raison, niveau (point : ok | attention | mauvais | ""), droite (HTML sûr), pastilles (HTML sûr),
   archive, a_traiter, inactifs }]
   ------------------------------------------------------------------ */
const ListeCoach = {
  etats: {},
  PAS: 50,   // lignes affichées, puis « Afficher N de plus » (une longue liste n'enterre pas le reste de la page)
  etat(t){ return this.etats[t] || (this.etats[t] = { q: "", filtre: "tous", y: 0, revenir: false, focus: false, sel: null, garder: false, limite: 50, items: [], opts: {} }); },
  /* sans accents ni majuscules (comme la recherche de la page Prospects) */
  norm(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); },
  TEXTES: {
    clients: { titre: "Clients", nb: ["{n} client", "{n} clients"], recherche: "Rechercher un client par son nom",
      vide: { tous: "Aucun client pour le moment.", a_traiter: "Rien à traiter pour l'instant.", inactifs: "Aucun client inactif.", archives: "Aucun compte archivé." },
      confirmer: ["Archiver {n} client ?", "Archiver {n} clients ?"], archives: ["{n} client archivé", "{n} clients archivés"], restaures: ["{n} client restauré", "{n} clients restaurés"] },
    prospects: { titre: "Prospects", nb: ["{n} prospect", "{n} prospects"], recherche: "Rechercher un prospect par son nom",
      vide: { tous: "Aucun prospect pour l'instant.", a_traiter: "Rien à traiter pour l'instant.", archives: "Aucun compte archivé." },
      confirmer: ["Archiver {n} prospect ?", "Archiver {n} prospects ?"], archives: ["{n} prospect archivé", "{n} prospects archivés"], restaures: ["{n} prospect restauré", "{n} prospects restaurés"] }
  },
  FILTRES: { clients: [["tous", "Tous"], ["a_traiter", "À traiter"], ["inactifs", "Inactifs"], ["archives", "Archivés"]],
             prospects: [["tous", "Tous"], ["a_traiter", "À traiter"], ["archives", "Archivés"]] },
  UN: "Ce compte disparaît de tes listes. Tu le retrouves dans « Archivés ». Rien ne change pour la personne.",
  PLUSIEURS: "Ces comptes disparaissent de tes listes. Tu les retrouves dans « Archivés ». Rien ne change pour eux.",
  /* singulier / pluriel (« 0 client », mais « 0 clients » en anglais) */
  plur(n, formes){ return trad(n > 1 || (n === 0 && I18N.langue === "en") ? formes[1] : formes[0], { n }); },
  /* la page Clients ou Prospects la note en ouvrant une fiche (Clients.ouvrir) ; la croix de la fiche demande de la rendre */
  memoriser(t){ if (this.TEXTES[t] || this.PAGES.indexOf(t) > -1) this.etat(t).y = window.scrollY || 0; },
  revenir(t){ if (this.TEXTES[t] || this.PAGES.indexOf(t) > -1) this.etat(t).revenir = true; },
  /* v84 : les pages du menu Plus qui ont reçu l'écran d'avant retrouvent aussi leur position au retour d'une fiche (comme avant,
     quand le tableau, Comptes et les cartes étaient sur Clients et Prospects) : appelé à la fin de leur dessin */
  PAGES: ["suivi-clients", "comptes", "suivi-commercial", "newsletter"],
  reprendre(t){ const E = this.etats[t]; if (!E || !E.revenir) return; E.revenir = false; const y = E.y; setTimeout(() => window.scrollTo(0, y), 0); },
  /* le titre et « + » (Créer un accès reste joignable pendant le chargement et si la liste n'a pas pu se charger) */
  tetePlus(t){ return `<div class="lc-tete"><div class="lc-titres"><h1>${esc(trad(this.TEXTES[t].titre))}</h1></div><div class="lc-actions"><a class="rond" href="#/${t}/nouveau" data-lc-plus aria-label="${esc(trad("Créer un accès"))}" title="${esc(trad("Créer un accès"))}">${SVG.ajouter}</a>${this.menuPoints(t)}</div></div>`; },
  /* v106 (lot 1) : le menu « ⋯ » de la liste : les vues d'avant de Clients (Vue tableau, Comptes, Créer un accès) et de Prospects
     (Vue détaillée, Newsletter), qui étaient dans le menu « Plus » puis en boutons au-dessus de la liste */
  MENUS: {
    clients: [["#/suivi-clients", "Vue tableau"], ["#/comptes", "Comptes"], ["#/clients/nouveau", "Créer un accès"]],
    prospects: [["#/suivi-commercial", "Vue détaillée"], ["#/newsletter", "Newsletter"]]
  },
  menuPoints(t){ return menuPointsHTML((this.MENUS[t] || []).map(([href, texte]) => ({ href, texte })), { id: "vues-" + t, libelle: "Autres vues" }); },
  attente(t){ return `<section class="lc" data-liste="${t}">${this.tetePlus(t)}<div class="empty">${esc(trad("Chargement…"))}</div></section>`; },
  erreur(zone, t){ if (zone && zone.isConnected) zone.innerHTML = `<section class="lc" data-liste="${t}">${this.tetePlus(t)}<div class="empty">${esc(trad("Impossible de charger la liste."))}</div></section>`; },
  /* la liste filtrée (filtre, puis recherche) */
  visibles(t){
    const E = this.etat(t), q = this.norm(E.q);
    return E.items.filter(x => E.filtre === "archives" ? x.archive : !x.archive && (E.filtre === "tous" || !!x[E.filtre]))
      .filter(x => !q || this.norm(x.nom).indexOf(q) > -1);
  },
  monter(zone, t, items, opts){
    if (!zone || !zone.isConnected) return;
    const E = this.etat(t);
    E.items = Array.isArray(items) ? items : []; E.opts = opts || {};
    if (!E.garder) E.sel = null;   // une sélection ne survit pas à un départ de la page (sauf les comptes restés après une action ratée)
    E.garder = false;
    if (!this.FILTRES[t].some(f => f[0] === E.filtre)) E.filtre = "tous";
    this.dessiner(zone, t);
    if (E.revenir){ E.revenir = false; const y = E.y; setTimeout(() => { if (zone.isConnected) window.scrollTo(0, y); }, 0); }
    if (E.focus){ E.focus = false; setTimeout(() => { const q = zone.querySelector("#lc-q"); if (q && zone.isConnected) q.focus(); }, 0); }
  },
  dessiner(zone, t){
    const T = this.TEXTES[t], E = this.etat(t), sel = !!E.sel, n = E.items.filter(x => !x.archive).length;
    const restaurer = E.filtre === "archives";
    document.body.classList.toggle("lc-selection", sel);   // la barre de sélection remplace la barre du bas (maquette)
    zone.innerHTML = `<section class="lc${sel ? " lc-sel" : ""}" id="lc-${t}" data-liste="${t}">
      <div class="lc-tete">
        <div class="lc-titres"><h1>${esc(trad(T.titre))}</h1><p class="lc-compte" id="lc-compte">${esc(this.plur(n, T.nb))}</p></div>
        <div class="lc-actions">${sel
          ? `<button type="button" class="lc-lien" data-sel-tout>${esc(trad("Tout sélectionner"))}</button><button type="button" class="lc-lien" data-sel-annuler>${esc(trad("Annuler"))}</button>`
          : `<button type="button" class="lc-lien" data-sel-debut>${esc(trad("Sélectionner"))}</button><a class="rond" href="#/${t}/nouveau" data-lc-plus aria-label="${esc(trad("Créer un accès"))}" title="${esc(trad("Créer un accès"))}">${SVG.ajouter}</a>${this.menuPoints(t)}`}</div>
      </div>
      <label class="lc-recherche"><span class="lc-loupe" aria-hidden="true">${SVG.loupe}</span><input type="search" id="lc-q" placeholder="${esc(trad(T.recherche))}" aria-label="${esc(trad(T.recherche))}" value="${esc(E.q)}" autocomplete="off" maxlength="120"></label>
      <div class="lc-filtres" role="group" aria-label="${esc(trad("Filtrer la liste"))}">${this.FILTRES[t].map(([k, lib]) => `<button type="button" class="lc-filtre" data-lc-filtre="${k}" aria-pressed="${E.filtre === k}">${esc(trad(lib))}</button>`).join("")}</div>
      <ul class="lc-liste" id="lc-liste"></ul>
      ${sel ? `<div class="lc-barre" id="lc-barre" role="region" aria-label="${esc(trad("Sélection"))}"><b id="lc-nb-sel" aria-live="polite"></b><button type="button" class="btn" data-sel-archiver>${esc(trad(restaurer ? "Restaurer" : "Archiver"))}</button></div>` : ""}
    </section>`;
    this.brancher(zone, t);
    this.majListe(zone, t);
  },
  ligneHTML(x, sel){
    const coche = !!sel && sel.has(x.uid);
    return `<li class="lc-ligne${coche ? " choisie" : ""}" data-uid="${esc(x.uid)}"><button type="button" class="lc-b" data-lc-ligne="${esc(x.uid)}" data-nom="${esc(x.nom)}"${sel ? ` role="checkbox" aria-checked="${coche}"` : ""}>
      ${sel ? `<span class="lc-case" aria-hidden="true">${coche ? SVG.coche : ""}</span>` : ""}${Clients.avatar(x.nom)}
      <span class="lc-txt"><span class="lc-nom">${x.niveau ? `<span class="point ${esc(x.niveau)}" aria-hidden="true"></span>` : ""}<b data-notr>${esc(x.nom)}</b>${x.pastilles || ""}</span><small>${esc(x.raison || "")}</small></span>
      ${x.droite ? `<span class="lc-droite">${x.droite}</span>` : ""}</button></li>`;
  },
  majListe(zone, t){
    const E = this.etat(t), boite = zone.querySelector("#lc-liste"); if (!boite) return;
    const v = this.visibles(t);
    if (E.sel){ const vus = new Set(v.map(x => x.uid)); E.sel.forEach(uid => { if (!vus.has(uid)) E.sel.delete(uid); }); }   // jamais un compte caché par le filtre ou la recherche
    const vus = v.slice(0, Math.max(this.PAS, E.limite || this.PAS)), reste = v.length - vus.length;
    boite.innerHTML = v.length ? vus.map(x => this.ligneHTML(x, E.sel)).join("")
        + (reste > 0 ? `<li class="lc-plus"><button type="button" class="btn ghost" data-lc-plus-lignes>${esc(trad(reste > 1 ? "Afficher {n} de plus ({r} restants)" : "Afficher {n} de plus ({r} restant)", { n: Math.min(this.PAS, reste), r: reste }))}</button></li>` : "")
      : `<li class="lc-vide"><p class="empty">${esc(trad(E.q.trim() ? "Aucun résultat pour ce nom." : this.TEXTES[t].vide[E.filtre] || this.TEXTES[t].vide.tous))}</p></li>`;
    this.majBarre(zone, t);
  },
  majBarre(zone, t){
    const E = this.etat(t); if (!E.sel) return;
    const nb = zone.querySelector("#lc-nb-sel"), b = zone.querySelector("[data-sel-archiver]"), n = E.sel.size;
    if (nb) nb.textContent = trad(n > 1 || (n === 0 && I18N.langue === "en") ? "{n} sélectionnés" : "{n} sélectionné", { n });
    if (b) b.disabled = !n;
  },
  brancher(zone, t){
    const E = this.etat(t), q = zone.querySelector("#lc-q");
    let minuteur = null;
    if (q) q.addEventListener("input", () => { clearTimeout(minuteur); minuteur = setTimeout(() => { if (!zone.isConnected) return; E.q = q.value.slice(0, 120); E.limite = this.PAS; this.majListe(zone, t); }, 120); });
    $$("[data-lc-filtre]", zone).forEach(b => b.addEventListener("click", () => { E.filtre = b.dataset.lcFiltre; E.limite = this.PAS; this.dessiner(zone, t); const f = zone.querySelector(`[data-lc-filtre="${E.filtre}"]`); if (f) f.focus(); }));
    const debut = zone.querySelector("[data-sel-debut]");
    if (debut) debut.addEventListener("click", () => { E.sel = new Set(); this.dessiner(zone, t); const a = zone.querySelector("[data-sel-annuler]"); if (a) a.focus(); });
    const fin = zone.querySelector("[data-sel-annuler]");
    if (fin) fin.addEventListener("click", () => { E.sel = null; this.dessiner(zone, t); const d = zone.querySelector("[data-sel-debut]"); if (d) d.focus(); });
    const tout = zone.querySelector("[data-sel-tout]");
    if (tout) tout.addEventListener("click", () => { this.visibles(t).forEach(x => E.sel.add(x.uid)); this.majListe(zone, t); });
    const plus = zone.querySelector("[data-lc-plus]");
    if (plus) plus.addEventListener("click", () => this.memoriser(t));
    const boite = zone.querySelector("#lc-liste");
    if (boite) boite.addEventListener("click", ev => {
      if (ev.target && ev.target.closest && ev.target.closest("[data-lc-plus-lignes]")){ E.limite = (E.limite || this.PAS) + this.PAS; this.majListe(zone, t); return; }
      const b = ev.target && ev.target.closest ? ev.target.closest("[data-lc-ligne]") : null; if (!b) return;
      const uid = b.dataset.lcLigne;
      if (E.sel){
        if (E.sel.has(uid)) E.sel.delete(uid); else E.sel.add(uid);
        const li = b.closest(".lc-ligne"), coche = E.sel.has(uid);
        b.setAttribute("aria-checked", String(coche)); if (li) li.classList.toggle("choisie", coche);
        const c = b.querySelector(".lc-case"); if (c) c.innerHTML = coche ? SVG.coche : "";
        this.majBarre(zone, t);
        return;
      }
      Clients.ouvrir(uid, b.dataset.nom, "accueil");
    });
    const agir = zone.querySelector("[data-sel-archiver]");
    if (agir) agir.addEventListener("click", () => this.agir(zone, t, agir));
  },
  /* « Archiver » (avec la fenêtre de confirmation, même pour un seul compte) ou « Restaurer » (dans « Archivés ») */
  async agir(zone, t, b){
    const E = this.etat(t), T = this.TEXTES[t], uids = Array.from(E.sel || []), n = uids.length;
    if (!n) return;
    const restaurer = E.filtre === "archives";
    if (!restaurer){
      const oui = await UI.ouvrir({ titre: this.plur(n, T.confirmer), corps: trad(n > 1 ? this.PLUSIEURS : this.UN), annulation: false, boutons: [
        { texte: trad("Annuler"), valeur: false, classe: "ghost" }, { texte: trad("Archiver"), valeur: true, principal: true }] });   // v84 : « Archiver » en or (le rouge est pour « Supprimer définitivement »)
      if (!oui || !zone.isConnected) return;
    }
    b.disabled = true; b.textContent = "…";
    const r = await Archive.appliquer(uids, !restaurer);
    if (r.ok.length) UI.toast(this.plur(r.ok.length, restaurer ? T.restaures : T.archives), "ok");
    if (r.ko.length) UI.alerte(trad(r.ko.length > 1 ? "{n} comptes n'ont pas pu être changés ({c}). Ils sont restés sélectionnés : réessaie dans un instant." : "{n} compte n'a pas pu être changé ({c}). Il est resté sélectionné : réessaie dans un instant.", { n: r.ko.length, c: Commercial.cause(r.ko[0].e) }));
    E.sel = r.ko.length ? new Set(r.ko.map(x => x.uid)) : null;
    E.garder = !!r.ko.length;
    if (E.opts && typeof E.opts.recharger === "function") await E.opts.recharger();
    else if (zone.isConnected) this.dessiner(zone, t);
  }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — CRÉER UN ACCÈS (maquette Nouveau) : un écran à part, ouvert par « + » (#/clients/nouveau ou
   #/prospects/nouveau), la croix ramène à la liste d'où l'on vient. Mêmes champs, mêmes rôles et même logique qu'avant
   (Auth.creerAcces, statut client posé ensuite). Et les actions sur un compte, les mêmes partout (Comptes de Mes clients,
   onglet Compte de la fiche) : changer le statut, l'accès complet, supprimer définitivement (double confirmation, inchangée).
   ------------------------------------------------------------------ */
const Acces = {
  html(liste){
    return `<div id="acces-vue" class="acces-vue" data-liste="${esc(liste)}">
      <div class="fc-haut"><a class="rond" href="#/${esc(liste)}" id="acces-fermer" aria-label="${esc(trad("Fermer"))}" title="${esc(trad("Fermer"))}">${SVG.croix}</a></div>
      <header class="masthead"><h1>Créer un accès</h1><p class="lede">La personne recevra ces identifiants. Elle pourra changer son mot de passe et son adresse elle-même, depuis son profil. Personne ne peut créer de compte sans passer par toi.</p></header>
      <section class="panel">
        <div class="grid g2">
          <div><label for="n-prenom">Prénom</label><input id="n-prenom" type="text" autocomplete="off"></div>
          <div><label for="n-nom">Nom</label><input id="n-nom" type="text" autocomplete="off"></div>
          <div><label for="n-email">Email</label><input id="n-email" type="email" autocomplete="off"></div>
          <div><label for="n-mdp">Mot de passe provisoire</label><input id="n-mdp" type="text" autocomplete="off">
            <div class="acces-gen"><button class="btn ghost petit" type="button" id="n-gen">Générer un mot de passe</button></div></div>
          <div><label for="n-type">Type d'accès</label>
            <select id="n-type">
              <option value="client" selected>Client — ne voit que ses propres données</option>
              <option value="coach">Équipe — voit tout, comme toi</option>
            </select>
          </div>
        </div>
        <p class="note" id="n-avert" hidden style="margin-top:4px;color:var(--warn)">Cette personne verra les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète, et pourra les modifier.</p>
        <div class="actions acces-actions">
          <button class="btn" type="button" id="n-creer">Créer le compte</button>
          <span class="msg" id="n-msg" role="status" aria-live="polite"></span>
        </div>
      </section></div>`;
  },
  init(liste){
    const f = $("acces-fermer"); if (f) f.addEventListener("click", () => ListeCoach.revenir(liste));
    $("n-type").addEventListener("change", () => {
      $("n-avert").hidden = $("n-type").value !== "coach";
    });

    $("n-gen").addEventListener("click", () => {
      const a = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      /* un tirage fait pour les secrets (crypto), pas Math.random */
      const r = new Uint32Array(10);
      try { crypto.getRandomValues(r); } catch(e){ for (let i = 0; i < r.length; i++) r[i] = Math.floor(Math.random() * 4294967296); }
      $("n-mdp").value = Array.from(r, x => a[x % a.length]).join("");
    });

    $("n-creer").addEventListener("click", async () => {
      const prenom = $("n-prenom").value.trim(), nom = $("n-nom").value.trim();
      const email = $("n-email").value.trim(), mdp = $("n-mdp").value;
      const type = $("n-type") ? $("n-type").value : "client";
      if (!email || !mdp){ flash("n-msg","Il faut au moins un email et un mot de passe."); return; }
      if (type === "coach" && !(await UI.confirmer("Donner l'accès complet à " + (email) + " ?\n\nCette personne verra exactement ce que tu vois : toutes les fiches, les questionnaires de santé, les programmes et les diètes de tous tes clients.", { ok: "Donner l'accès", danger: true }))) return;
      if (mdp.length < 8){ flash("n-msg","Le mot de passe doit faire au moins 8 caractères."); return; }
      const b = $("n-creer"); b.disabled = true;
      flash("n-msg", "Création…");
      try {
        /* Le serveur cree le compte, verifie que c'est bien un coach qui le
           demande, et pose le role. Ta session n'est plus touchee : avant,
           la creation te reconnectait sous le nouveau compte et il fallait
           remettre la tienne en place a la main. */
        const cree = await Auth.creerAcces(email, mdp, prenom, nom, type);
        /* v39 : un compte cree par la base nait « prospect » ; un acces cree par
           le coach est un client (ou un membre de l'equipe) : on le pose tout de suite */
        let statutOk = true;
        if (cree && cree.id){
          try {
            const r = await Auth.appel("/rest/v1/profils?id=eq." + cree.id, {
              method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: "client" }
            });
            statutOk = Array.isArray(r) && !!r[0] && r[0].statut === "client";
          } catch(e){ statutOk = !!(e && e.code === "PGRST204"); }   // PGRST204 : la base n'a pas (encore) de colonne statut, rien a poser
        } else statutOk = false;   // pas d'identifiant en retour : on ne peut pas verifier, on le dit
        $("n-prenom").value = $("n-nom").value = $("n-email").value = $("n-mdp").value = "";
        if ($("n-type")) $("n-type").value = "client";
        if ($("n-avert")) $("n-avert").hidden = true;
        /* la fonction renvoie le role REELLEMENT pose (v39) : un acces d'equipe refuse se voit */
        const sansAcces = type === "coach" && cree && cree.role !== "coach";
        if (!statutOk) UI.alerte("Le compte de " + (((prenom + " " + nom).trim()) || email) + " est créé, mais il est encore « prospect » : son espace resterait limité.\n\nClique « Passer client » sur sa ligne, dans « Comptes » (menu Plus), ou dans l'onglet Compte de sa fiche.");
        else if (sansAcces) UI.alerte("Le compte de " + (((prenom + " " + nom).trim()) || email) + " est créé, mais sans l'accès complet.\n\nClique « Donner l'accès complet » sur sa ligne, dans « Comptes » (menu Plus).");
        flash("n-msg", !statutOk
          ? "Compte créé, mais il est encore « prospect » : clique « Passer client » sur sa ligne, dans « Comptes » (menu Plus)."
          : sansAcces
          ? "Compte créé, mais sans l'accès complet : clique « Donner l'accès complet » sur sa ligne, dans « Comptes » (menu Plus)."
          : type === "coach"
          ? "Compte d'équipe créé, avec l'accès complet. Transmets-lui ses identifiants."
          : "Compte créé. Transmets-lui ses identifiants.");
      } catch(e){
        flashFixe("n-msg", e && e.reseau ? "Création impossible : vérifie ta connexion et réessaie." : (e.message || "Création impossible : vérifie ta connexion et réessaie."));
      }
      b.disabled = false;
    });
  },

  /* « Supprimer » (définitivement) : double confirmation inchangée (fenêtre de l'app, puis le mot SUPPRIMER), fonction serveur
     supprimer-acces. b : le bouton (« … » pendant l'appel). Rend "fait", "annule" ou "echec". */
  async supprimer(p, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    if (!(await UI.confirmer("Supprimer définitivement le compte de " + nom + " ?\n\n" +
                 "Son profil, ses mensurations, son programme, ses repas et sa progression seront effacés. " +
                 "Tu n'y auras plus accès non plus.\n\nC'est définitif : il n'y a pas de corbeille.", { titre: "Supprimer un compte", ok: "Continuer", danger: true }))) return "annule";
    const mot = await UI.demander("Pour confirmer la suppression de " + nom + ", écris SUPPRIMER en majuscules :", "", { titre: "Supprimer un compte", ok: "Supprimer définitivement", danger: true });
    if (mot === null) return "annule";
    if (String(mot).trim().toUpperCase() !== "SUPPRIMER"){
      UI.alerte("Ce n'est pas le mot attendu : rien n'a été supprimé.");
      return "annule";
    }
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      await Auth.supprimerCompte(p.id, "SUPPRIMER");
      if (Store.idConsulte === p.id){ Store.oublier(p.id); Store.idConsulte = null; Store.nomConsulte = null; }
      /* v102 : ses brouillons (programme, diète) quittent aussi le compte du coach (droit à l'effacement) */
      for (const Bx of [BrouillonProg, BrouillonRepas]){
        try { const D = await Bx.lire(); if (!Store.nonLus.has(D) && Bx.entree(D, p.id)){ Bx.retirer(D, p.id); await Bx.vider(D, p.id); } } catch(e){}
      }
      return "fait";
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte(messageEchec("Suppression impossible", e));
      return "echec";
    }
  },
  /* v39 — prospect <-> client : seul un coach peut le changer (garanti par la base). Rend true si c'est fait. */
  async changerStatut(p, vers, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    const message = vers === "client"
      ? "Passer " + nom + " en client ?\n\nIl aura accès à tout son espace d'accompagnement."
      : "Repasser " + nom + " en prospect ?\n\nIl redevient un compte gratuit : son espace sera limité au mode gratuit (" + ((CONFIG.marque.gratuit_ouverts || []).map(id => (OUTILS.find(o => o.id === id) || {}).nom).filter(Boolean).join(", ") || "accueil") + ") à sa prochaine ouverture de l'application, et il ne sera plus suivi comme un client. Ses données restent intactes.";
    if (!(await UI.confirmer(message, { ok: vers === "client" ? "Passer client" : "Repasser prospect", danger: vers === "prospect" }))) return false;
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      const r = await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
        method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: vers }
      });
      if (!Array.isArray(r) || !r[0] || r[0].statut !== vers) throw new Error("la base n'a pas confirmé le changement");
      return true;
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte(messageEchec("Changement impossible", e));
      return false;
    }
  },
  /* l'accès complet (rôle coach) : le donner ou le retirer. Rend true si c'est fait. */
  async changerRole(p, vers, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    const message = vers === "coach"
      ? "Donner l'accès complet à " + nom + " ?\n\nCette personne verra exactement ce que tu vois : les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète. Elle pourra aussi les modifier."
      : "Retirer l'accès complet à " + nom + " ?\n\nElle redeviendra un client ordinaire et ne verra plus que ses propres données.";
    if (!(await UI.confirmer(message, { ok: vers === "coach" ? "Donner l'accès" : "Retirer l'accès", danger: vers === "coach" }))) return false;
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
        method: "PATCH", headers: { "Prefer": "return=minimal" }, body: { role: vers }
      });
      return true;
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte(messageEchec("Changement impossible", e));
      return false;
    }
  }
};

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
     v59 : la case cochée par le prospect APRÈS ta dernière décision datée (coche ou retrait) compte de nouveau (à vérifier) :
     il a repris un créneau après que tu as décidé ; une case d'avant reste une info. La case n'a qu'une date, posée à sa
     PREMIÈRE coche (Decouverte.reserver : elle ne se coche qu'une fois, puis disparaît de son écran) : cela ne vaut que pour
     un prospect qui la coche pour la première fois après ta décision ; celui qui l'avait déjà cochée revient par son clic
     « Réserver » (clic_recent_jours) ou par ta coche « Bilan réservé (nouveau créneau) ». Décision sans date (clé bilan_le posée
     sans historique) : la case ne compte plus, comme avant. Une case datée dans le futur (horloge du prospect en avance,
     plus de 5 min, comme les Nouveautés) ne passe pas devant ta décision : sinon « Retirer » ne la ferait jamais tomber.
     → { reserve, le (instant retenu), coach (instant de la coche ou null), decide, retire (dernier retrait, s'il n'est
         pas recoché), case (case du prospect retenue), caseCompte (v59 : la case compte, même face à une coche), source:
         "coach" | "prospect" | null } */
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
    /* v59 : la date de ta dernière décision, sur les valeurs gardées seulement (comme coche et hist) */
    const tDecision = [coche].concat(hist.map(e => e.le)).map(t).filter(x => x != null).reduce((m, x) => Math.max(m, x), -Infinity);
    const tCase = caseP ? t(caseP) : null, caseFutur = tCase != null && tCase > Date.now() + 5 * 60000;
    const caseCompte = !!caseP && (!decide || (!caseFutur && isFinite(tDecision) && tCase > tDecision));
    const parCase = !coche && caseCompte;
    return { reserve: !!coche || parCase, le: coche || (parCase ? caseP : null), coach: coche, decide, retire, case: caseP, caseCompte, source: coche ? "coach" : parCase ? "prospect" : null };
  },
  bilanLigne(l){ try { return this.bilan(l && l.suivi, l && l.ch, l && l.p); } catch(e){ return { reserve: false, le: null, coach: null, decide: false, retire: null, case: null, caseCompte: false, source: null }; } },
  /* v59 : une date (ta coche, sa case) d'avant l'issue « Absent » / « Perdu » en cours : elle a servi à cet appel (analyse,
     et le bloc « Découverte » de la fiche) */
  avantIssue(S, v){ S = this.suivi(S); const tI = S.issue === "perdu" || S.issue === "absent" ? this.instant(S.issue_le) : null, tv = this.instant(v); return tI != null && tv != null && tv <= tI; },
  /* ce qui le rend « à traiter » (texte court : tableau de bord, cartes). v65 (décision de Lucas du 30/09) : côté coach, le
     bouton porte son nom d'aujourd'hui, « Récupérer mon plan d'action » (motif, aide, faits, action, Nouveautés, CSV, pastille
     « a cliqué Plan d'action ») ; avant : « Réserver mon bilan » / « a cliqué Réserver ». Les données ne changent pas. */
  MOTIFS: { signe: "Signé : à passer client", case: "A coché « J'ai réservé » : à vérifier", absent: "Absent à l'appel : repropose-lui un créneau", clic: "A cliqué « Réserver mon plan d'action », pas de bilan coché", nouveau: "Vient de s'inscrire",
    perdu: "Perdu : relance-le", appel: "Bilan réservé : l'appel a-t-il eu lieu ?" },   // v59 : + absent, perdu, appel (perdu et appel : avec depuis quand, motifTexte)
  AIDE: "À traiter : les prospects inscrits depuis moins de 48 h, et ceux qui ont cliqué « Réserver mon plan d'action » ou coché « J'ai réservé », tant que tu n'as ni coché « Bilan réservé », ni indiqué l'issue de l'appel, ni relancé depuis ; les « Signé » à passer client ; les « Absent » (sans limite de durée) et les « Perdu » depuis 30 jours ou plus, tant que tu ne les as pas relancés depuis l'appel ; les bilans cochés depuis plus de 7 jours sans issue.",
  /* v59 : l'ordre de « À traiter » (page Prospects ; le tableau de bord a sa table, outilTableau.RANG_PROSPECTS) ; sans
     urgence ensuite : bilan coché 7, absent 8, perdu 9, le reste 10 (et une analyse de secours), signé 11 */
  RANG: { signe: 0, case: 1, absent: 2, clic: 3, nouveau: 4, appel: 5, perdu: 6 },
  /* p = profil (cree_le, statut), C = cle « challenge » (clics « Réserver mon bilan », case « J'ai réservé »),
     S = suivi_prospect, activite = derniere saisie du prospect (une visite, cle activite, compte), D = son questionnaire.
     → { etat (issue ou "en_cours"), issue, raisons[], action, urgent, motif (signe | case | absent | clic | nouveau | appel |
         perdu), rang, recence, jour, questionnaire, reserve, bilan (Commercial.bilan), coche (v59 : ta coche qui attend un
         appel, ou null), caseAVerifier (v59 : la case du prospect à vérifier, ou null), issueDepuis, issueDatee (v59 : l'issue
         a une date lisible), clics, relances, derniereRelance, inscritHeures }
     « À traiter » (urgent), sans température : « Signé » et toujours prospect (30 jours au plus) ; sinon, sans issue et
     sans bilan coché par le coach : la case « J'ai réservé » du prospect (à vérifier), un clic « Réserver mon bilan »
     sans relance depuis, ou une inscription de moins de CONFIG.suivi.urgence_heures (48 h) sans relance.
     v59 (rétablis, retirés par erreur en v53) : toujours prospect, « Absent » tant que tu ne l'as pas relancé depuis
     l'appel (sans limite de durée) ; « Perdu » depuis CONFIG.suivi.perdu_relance_jours (30 j) ou plus, sans relance depuis
     l'appel ; un bilan coché depuis plus de CONFIG.suivi.appel_jours (7 j) sans issue (l'appel a-t-il eu lieu ?). Une
     relance après l'issue sort Absent et Perdu de la liste ; le bilan à conclure en sort par Signé, Perdu ou Absent. */
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
    /* v59 : ta coche « Bilan réservé » et la case « J'ai réservé » d'AVANT l'issue « Absent » / « Perdu » ont servi à cet
       appel : elles ne font plus attendre d'appel (ni « Prépare le bilan », ni « l'appel a-t-il eu lieu ? ») ni vérifier de
       réservation, même s'il revient en cours après un clic. La case compte si elle suit ta dernière décision (caseCompte). */
    const avantAppel = v => this.avantIssue(S, v);
    const coche = B.coach && !avantAppel(B.coach) ? B.coach : null, dCoche = coche ? this.depuis(coche) : null;
    const caseAv = B.caseCompte && !coche && B.case && !avantAppel(B.case) ? B.case : null;
    /* « Perdu » ou « Absent », puis il reclique « Réserver » ou coche « J'ai réservé » (retour_jours) : il revient dans la
       course (v59 : la case ne se coche qu'une fois, voir bilan : seulement une première coche, après l'appel ; celui qui
       l'avait déjà cochée revient par son clic « Réserver » ou par ta coche « nouveau créneau ») ; v59 : ou tu coches
       « Bilan réservé (nouveau créneau) » après l'appel : de nouveau en cours, sans limite de durée, jusqu'à la prochaine
       issue (l'issue d'avant reste en base : tuiles des 30 jours, historique) */
    const revenu = (issue === "perdu" || issue === "absent") && tIssue != null && (!!coche
      || (!!r && !!r.dernierClic && instant(r.dernierClic) > tIssue && clic != null && clic <= cfg.clic_recent_jours)
      || (!!caseAv && this.depuis(caseAv) != null && this.depuis(caseAv) <= cfg.retour_jours));
    const tInscrit = instant(p && p.cree_le), heures = tInscrit == null ? null : Math.max(0, (Date.now() - tInscrit) / 3600000);
    const commence = D && typeof D.repondues === "number" && isFinite(D.repondues) ? Math.floor(D.repondues) : Decouverte.repondues(D);
    const total = (D && typeof D.nb_questions === "number" && D.nb_questions > 0 ? Math.floor(D.nb_questions) : Decouverte.liste(D).length) || 3;
    const depuisH = heures == null ? "" : heures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(heures) + " h";
    /* les faits, en clair (fiche : « Suivi commercial ») */
    const raisons = [];
    if (issue && revenu) raisons.push("Revenu après l'issue « " + this.ISSUES[issue] + " » : a recliqué « Réserver mon plan d'action » ou son bilan est de nouveau réservé.");
    else if (issue) raisons.push("Appel : « " + this.ISSUES[issue] + " » " + this.quand(issueDepuis) + (typeof S.note === "string" && S.note ? " — " + S.note : "") + ".");
    if (ancienClient) raisons.push("Ancien client (« Signé » " + this.quand(this.depuis(S.issue_le)) + "), redevenu prospect.");
    if (B.coach) raisons.push("Bilan réservé : coché par toi " + this.quand(this.depuis(B.coach)) + (coche ? "" : ", avant l'appel") + ".");
    if (caseAv) raisons.push("A coché « J'ai réservé mon bilan » " + this.quand(this.depuis(caseAv)) + " : pas encore vérifié par toi.");
    else if (!B.coach && B.retire) raisons.push("« Bilan réservé » retiré par toi " + this.quand(this.depuis(B.retire)) + ".");
    raisons.push("Inscrit " + (heures != null && heures < 24 ? depuisH : this.quand(this.depuis(p && p.cree_le))) + (fait ? ", questionnaire rempli " + this.quand(this.depuis(r.questionnaire)) : commence > 0 ? ", questionnaire commencé (" + commence + "/" + total + " réponses)" : ", questionnaire pas encore rempli") + ".");
    if (clics) raisons.push("A cliqué « Réserver mon plan d'action » (" + clics + " fois), la dernière " + this.quand(clic) + ".");
    if (sansReponse) raisons.push("Relancé " + sansReponse + " fois sans réponse.");
    if (revenu) issue = null;   // il est de nouveau « en cours »
    /* à traiter : la définition simple (voir plus haut) */
    const relanceApres = t0 => t0 != null && relances.some(x => instant(x) > t0);
    const tClic = r && r.dernierClic ? instant(r.dernierClic) : null;
    const clicAtraiter = clics > 0 && tClic != null && !(p && p.statut === "prospect" && tClient != null && tClic <= tClient) && !relanceApres(tClic);
    const prospect = !!(p && p.statut === "prospect");
    const relancesDepuis = tIssue != null ? relancesApresIssue : relances.length;   // v59 : depuis l'appel (issue_le illisible : toutes)
    let motif = null;
    if (issue === "signe"){ if (prospect && !(issueDepuis != null && issueDepuis > 30)) motif = "signe"; }
    /* v59 : Absent (repropose un créneau) et Perdu depuis perdu_relance_jours (relance-le) tant que tu ne l'as pas relancé
       depuis l'appel ; un bilan coché depuis plus de appel_jours sans issue (l'appel a-t-il eu lieu ?) */
    else if (issue === "absent"){ if (prospect && !relancesDepuis) motif = "absent"; }
    else if (issue === "perdu"){ if (prospect && !relancesDepuis && issueDepuis != null && issueDepuis >= cfg.perdu_relance_jours) motif = "perdu"; }
    else if (coche){ if (prospect && dCoche != null && dCoche > cfg.appel_jours) motif = "appel"; }
    else if (caseAv) motif = "case";
    else if (clicAtraiter) motif = "clic";
    else if (heures != null && heures < cfg.urgence_heures && !relances.length) motif = "nouveau";
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
    /* v59 : une relance faite AVANT l'appel ne fait plus « attendre » (l'action suit le motif : sans relance depuis l'appel,
       il est à traiter) */
    else if (issue === "absent"){ const T = "Absent à l'appel : repropose-lui un créneau en DM."; action = relancesApresIssue >= cfg.relances_max ? "Absent, puis relancé " + relancesApresIssue + " fois sans suite : classe-le « Perdu » ?" : relancesDepuis ? siPasRelance(T) : T; }
    else if (issue === "perdu"){ const reste = cfg.perdu_relance_jours - (issueDepuis || 0); action = relancesApresIssue >= 1 ? "Relancé après l'appel : s'il ne répond pas, laisse-le." : reste <= 0 ? "Relance-le : l'appel date d'il y a " + issueDepuis + " jours." : "Relance prévue dans " + reste + " jour" + (reste > 1 ? "s" : "") + "."; }
    else if (coche){ action = dCoche != null && dCoche > cfg.appel_jours ? "Bilan réservé " + this.quand(dCoche) + " : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent." : "Prépare le bilan : relis sa fiche (ses 3 réponses). Après l'appel, indique Signé, Perdu ou Absent."; }
    else if (caseAv) action = "Il a coché « J'ai réservé » " + this.quand(this.depuis(caseAv)) + " : vérifie ton agenda, puis coche « Bilan réservé » dans sa fiche (ou retire-le).";
    else if (ancienClient) action = "Ancien client redevenu prospect : reprends contact si tu veux lui proposer de reprendre.";
    else if (clics) action = siPasRelance("DM : il a cliqué « Réserver mon plan d'action » sans réserver, demande-lui ce qui le retient.");
    else if (heures != null && heures < cfg.urgence_heures) action = siPasRelance("Il vient de s'inscrire : envoie-lui un DM de bienvenue.");
    else if (!fait) action = siPasRelance("DM : aide-le à répondre à ses 3 questions (1 minute).");
    else action = siPasRelance("Propose-lui le bilan en DM quand tu le sens prêt.");
    /* v59 : table RANG (signé, case, absent, clic, nouveau, appel, perdu), puis les autres (voir RANG) ; un « Signé » oublié
       reste le dernier, même avec sa coche d'avant l'appel */
    const rang = motif ? this.RANG[motif] : issue === "signe" ? 11 : coche ? 7 : issue === "absent" ? 8 : issue === "perdu" ? 9 : 10;
    /* recence : a rang egal, le plus recemment actif d'abord (on lui ecrit pendant qu'il est dans le coup) */
    return { etat: issue || "en_cours", issue, raisons, action, urgent: !!motif, motif, rang, recence: actif == null ? 9999 : actif, jour, questionnaire: fait, reserve, bilan: B,
             coche, caseAVerifier: caseAv, issueDepuis: issue ? issueDepuis : null, issueDatee: !!issue && tIssue != null, clics, relances: relances.length, derniereRelance: relance, inscritHeures: heures };
  },
  /* v59 : une analyse impossible (erreur imprévue) ne fait plus disparaître le prospect de la page Prospects (liste,
     en-tête, filtres, CSV) ni du tableau de bord : une analyse de secours, sans urgence, « données illisibles : ouvre sa
     fiche », au rang le plus bas des prospects en cours (10) ; sa carte n'a que « Ouvrir la fiche » (aucune écriture sur un
     suivi qu'on n'a pas su lire) ; son bilan s'affiche comme Commercial.bilan le lit (coche, sinon case à vérifier) */
  secours(l){
    const p = (l && l.p) || {}, t = this.instant(p.cree_le), B = this.bilanLigne(l);
    let fait = false; try { fait = Decouverte.questionnaireFait(l && l.dc); } catch(e){ fait = false; }
    return { etat: "en_cours", issue: null, raisons: ["Suivi commercial illisible : ouvre sa fiche pour vérifier."], action: "Données illisibles : ouvre sa fiche pour vérifier.",
             urgent: false, motif: null, rang: 10, recence: 9999, jour: null, questionnaire: fait, reserve: !!B.reserve, bilan: B, coche: B.coach || null, caseAVerifier: B.source === "prospect" ? B.case : null, issueDepuis: null, issueDatee: false,
             clics: 0, relances: 0, derniereRelance: null, inscritHeures: t == null ? null : Math.max(0, (Date.now() - t) / 3600000), illisible: true };
  },
  analyseLigne(l){ try { return this.analyse(l.p, l.ch, l.suivi, l.activite, l.dc); } catch(e){ console.warn("[MHX] suivi commercial illisible", e); try { return this.secours(l); } catch(e2){ return null; } } },
  /* le motif « à traiter » en clair (tableau de bord) */
  motifTexte(a){
    if (!a || !a.motif) return "";
    if (a.motif === "nouveau") return "Inscrit " + (a.inscritHeures < 1 ? "il y a moins d'une heure" : "il y a " + Math.floor(a.inscritHeures) + " h") + " : DM de bienvenue";
    /* v59 : depuis quand, en jours (comme « Inactif depuis N j » des clients) */
    const dc = a.motif === "appel" ? this.depuis(a.coche) : null;
    if (a.motif === "perdu" && a.issueDepuis != null) return "Perdu depuis " + a.issueDepuis + " j : relance-le";
    if (a.motif === "appel" && dc != null) return "Bilan réservé depuis " + dc + " j : l'appel a-t-il eu lieu ?";
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
  /* v59 : avec l'analyse (a : carte, fiche), l'info-bulle suit ce qui compte : la case à vérifier, ou la coche / la case
     d'avant l'appel ; sans analyse (bloc « Découverte »), comme avant */
  pastilleBilan(B, a){
    if (!(B && B.reserve)) return "";
    const avant = !!a && !a.coche && !a.caseAVerifier;
    const titre = a && a.caseAVerifier ? "A coché « J'ai réservé mon bilan » : à vérifier" : B.coach ? "Bilan réservé : coché par toi" + (avant ? ", avant l'appel" : "")
      : avant ? "A coché « J'ai réservé mon bilan », avant l'appel" : "A coché « J'ai réservé mon bilan » : à vérifier";
    return `<span class="pastille ok" title="${titre}">bilan réservé</span>`;
  },
  bouton(p, act, txt, cls){ return `<button type="button" class="btn petit${cls === "principal" ? "" : " ghost"}" data-sc="${act}" data-uid="${esc(p.id)}" data-nom="${esc(Clients.nom(p))}">${esc(txt)}</button>`; },
  /* fiche = boutons du panneau « Suivi commercial » de la fiche : + « Bilan réservé » / « Retirer « Bilan réservé » »
     (v53, un clic, sans fenêtre de confirmation, annulable), tant qu'aucune issue n'est indiquée.
     v59 : après « Absent » ou « Perdu », il a repris un créneau : « Bilan réservé (nouveau créneau) », même écriture (l'issue
     et l'historique gardés), il redevient en cours jusqu'à la prochaine issue ; la coche d'avant l'appel ne compte plus
     (« Bilan réservé » de nouveau). « Signé » : rien. Une issue sans date lisible (ancienne donnée) : pas de nouveau
     créneau (la coche ne saurait pas la suivre) ; « Annuler » reste.
     v59 : Absent ou Perdu avec une case « J'ai réservé » encore à vérifier (caseAVerifier : cochée après l'appel, il y a
     plus de retour_jours, l'issue est restée) : + « Retirer « Bilan réservé » » (ta décision, datée après sa case : le « à
     vérifier » tombe, l'issue et sa date restent). */
  boutons(p, a, fiche){
    const b = (act, txt, cls) => this.bouton(p, act, txt, cls), B = a.bilan || {};
    const bilan = !fiche || a.issue === "signe" ? "" : a.issue ? (a.issueDatee ? b("bilan", "Bilan réservé (nouveau créneau)", "principal") : "") + (a.caseAVerifier ? b("bilan_non", "Retirer « Bilan réservé »") : "")
      : a.coche ? b("bilan_non", "Retirer « Bilan réservé »")
      : b("bilan", "Bilan réservé", "principal") + (B.source === "prospect" || a.caseAVerifier ? b("bilan_non", "Retirer « Bilan réservé »") : "");
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
     fiche), bilan réservé ou pas, newsletter oui / non, dernière visite, jours actifs (30 j), prochaine action, boutons.
     v56 : + nombre de connexions et dernière connexion (date et heure).
     v59 : « Bilan » suit l'analyse (comme le motif) : ta coche en cours, la case à vérifier, sinon la coche ou la case
     d'avant l'appel (« …, avant l'appel »). */
  /* v62 (brief V2, L) : « 3 (dernier : page verrouillée Nutrition) », « 0 » */
  clicsTexte(C){
    try {
      const cl = Decouverte.clics(C);
      if (!cl.length) return "0";
      /* v63 : la meme regle que « A traiter » et le CSV ; aucune date lisible : le dernier de la liste qui n'est pas date du
         futur ; tous dates du futur (horloge en avance) : le nombre seul, comme le CSV (« Dernier clic » vide) */
      const der = Decouverte.dernierClic(C) || cl.filter(c => !Decouverte.clicFutur(c)).pop();
      return der ? cl.length + " (dernier : " + (Decouverte.nomOrigine(der.source) || "origine inconnue (avant la v50)") + ")" : String(cl.length);
    } catch(e){ return "—"; }
  },
  carteHTML(l, a){
    const p = l.p, nom = Clients.nom(p), dc = l.dc || {}, B = a.bilan || {};
    const dt = v => { const d = Decouverte.dateLocale(v); return d ? dateFr(d) : ""; };
    const reponses = [["Problème", dc.probleme || ""], ["Ce qui l'a bloqué", !dc.ancien && dc.obstacle ? "« " + Decouverte.extrait(dc.obstacle, 90) + " »" : ""], ["Dans 3 mois", dc.projection ? "« " + Decouverte.extrait(dc.projection, 100) + " »" : ""]].filter(x => x[1]);
    const faits = [["Bilan", a.coche ? "réservé le " + dt(a.coche) : a.caseAVerifier ? "à vérifier (case cochée le " + dt(a.caseAVerifier) + ")"
        : B.coach ? "coché le " + dt(B.coach) + ", avant l'appel" : B.source === "prospect" ? "case cochée le " + dt(B.case) + ", avant l'appel" : "pas réservé"],
      ["Newsletter", l.newsletter && l.newsletter.oui ? "oui" : "non"], ["Dernière visite", Activite.texteVisite(l.visites)], ["Jours actifs (30 j)", Activite.texteJours(l.visites)],
      ["Connexions", Connexions.texteNombre(l.connexions)], ["Dernière connexion", Connexions.texteDerniere(l.connexions)],   // v56
      ["Clics plan d'action", this.clicsTexte(l.ch)]];   // v62 (brief V2, L) : nombre de clics et dernière origine
    return `<article class="sc-carte${a.urgent ? " urgent" : ""}" data-uid="${esc(p.id)}">
      <div class="sc-tete">${Clients.avatar(nom)}<div class="sc-nom"><b>${esc(nom)}</b><small>${esc(this.sousTitre(p, a))}</small></div>${this.pastille(a)}${this.pastilleBilan(B, a)}${a.illisible ? '<span class="pastille attention">données illisibles</span>' : ""}</div>
      ${dc.email ? `<p class="sc-infos">${esc(dc.email)}</p>` : ""}
      <p class="sc-tel">Téléphone : ${Telephone.coachHTML(l.tel)}</p>
      <p class="sc-tel sc-source">Source : <span data-notr>${esc(l.ref || "—")}</span></p>
      ${reponses.length ? `<ul class="sc-reponses">${reponses.map(([k, v]) => `<li><span>${esc(k)}</span> ${esc(v)}</li>`).join("")}</ul>` : `<p class="sc-infos sc-sans">${dc.ancien ? "Anciennes réponses : dans sa fiche." : "Pas encore de réponse à ses 3 questions."}</p>`}
      <ul class="sc-faits">${faits.map(([k, v]) => `<li><span>${esc(k)}</span> <b>${esc(v)}</b></li>`).join("")}</ul>
      ${a.urgent ? `<p class="sc-motif"><span class="pastille mauvais">à traiter</span> ${esc(this.motifTexte(a))}</p>` : ""}
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <div class="sc-boutons">${a.illisible ? this.bouton(p, "fiche", "Ouvrir la fiche") : this.boutons(p, a, false)}</div>
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
    return `<section class="panel sc-fiche${a.urgent ? " urgent" : ""}"><div class="seance-c-tete"><h2>Suivi commercial</h2>${this.pastille(a)}${this.pastilleBilan(a.bilan, a)}</div>
      ${a.urgent ? `<p class="sc-motif"><span class="pastille mauvais">à traiter</span> ${esc(this.motifTexte(a))}</p>` : ""}
      <p class="sc-action"><b>Prochaine action :</b> ${esc(a.action)}</p>
      <ul class="sc-raisons">${a.raisons.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="sc-boutons">${this.boutons(p, a, true)}</div>${this.histoHTML(S)}
      <span class="msg sc-msg" role="status" aria-live="polite"></span>
      <p class="note" style="margin:10px 0 0">« Bilan réservé » : coche-le quand le bilan est dans ton agenda (un clic, annulable). Après « Absent » ou « Perdu », « Bilan réservé (nouveau créneau) » le remet en cours. Seuls cette coche, l'issue de l'appel et tes relances sont enregistrés, jamais visibles par le prospect.</p></section>`;
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
   v83 (bloc 3, G) — LE MESSAGE WHATSAPP DU COACH À UN PROSPECT (fiche, bouton « WhatsApp »), pré-rempli avec ses réponses,
   en français, ou en anglais si le prospect a choisi l'anglais dans l'app (prefs.langue). Les réponses en texte court
   (PARCOURS_T.cadeau.courts, en minuscules : « perdre du gras », « le manque de temps et les craquages » ; en anglais, leur
   traduction du dictionnaire) ; le texte libre tel qu'il l'a écrit (une ancienne réponse libre à « ce qui a coincé » aussi).
   Une réponse absente : sa phrase est sautée. Le coach peut modifier le message dans WhatsApp avant de l'envoyer.
   ------------------------------------------------------------------ */
const MessageProspect = {
  court(k){ const c = (typeof PARCOURS_T !== "undefined" && PARCOURS_T.cadeau && PARCOURS_T.cadeau.courts) || {}; return typeof k === "string" && Object.prototype.hasOwnProperty.call(c, k) ? c[k] : ""; },
  en(fr){ return (I18N.en && Object.prototype.hasOwnProperty.call(I18N.en, fr) && I18N.en[fr]) || fr; },
  /* { objectif, blocages: [..], libre } en texte court français ("" / [] si absent) */
  reponses(I){
    I = I && typeof I === "object" && !Array.isArray(I) ? I : {};
    const objectif = this.court(typeof I.probleme === "string" ? I.probleme.trim() : "");
    const choix = Decouverte.choixDe(I, "obstacle");
    const blocages = (choix || []).map(k => this.court(k)).filter(Boolean);
    let libre = Decouverte.precisionDe(I, "obstacle");
    if (!libre && !choix && typeof I.obstacle === "string") libre = I.obstacle.trim();   // ancienne réponse libre (sans cases)
    libre = Decouverte.extrait(libre.replace(/[«»"]/g, "").trim(), 300);
    return { objectif, blocages, libre };
  },
  texte(prenom, I, anglais){
    const R = this.reponses(I), p = typeof prenom === "string" ? Array.from(prenom.replace(/\s+/g, " ").trim()).slice(0, 60).join("") : "";
    const marque = (CONFIG.marque && CONFIG.marque.nom) || "MHX Coaching";
    if (anglais){
      const bl = R.blocages.map(x => this.en(x)), et = bl.length > 1 ? bl.slice(0, -1).join(", ") + " and " + bl[bl.length - 1] : bl[0] || "";
      const parts = [R.objectif ? "your goal is to " + this.en(R.objectif) : "", et ? "what's held you back so far: " + et : ""].filter(Boolean);
      return ["Hi" + (p ? " " + p : "") + " 👋", "Welcome to " + marque + "!",
        parts.length ? "I got your answers: " + parts.join(", and ") + "." : R.libre ? "I got your answers." : "",
        R.libre ? "You also wrote: \"" + R.libre + "\"." : "",
        "I'm putting together your action plan. Were you able to book your free 15-min call?"].filter(Boolean).join(" ");
    }
    const et = R.blocages.length > 1 ? R.blocages.slice(0, -1).join(", ") + " et " + R.blocages[R.blocages.length - 1] : R.blocages[0] || "";
    const parts = [R.objectif ? "ton objectif, c'est " + R.objectif : "", et ? "ce qui a coincé jusqu'ici : " + et : ""].filter(Boolean);
    return ["Salut" + (p ? " " + p : "") + " 👋", "Bienvenue chez " + marque + " !",
      parts.length ? "J'ai bien reçu tes réponses : " + parts.join(", et ") + "." : R.libre ? "J'ai bien reçu tes réponses." : "",
      R.libre ? "Tu m'as aussi écrit : « " + R.libre + " »." : "",
      "Je prépare ton plan d'action. Tu as pu réserver ton appel offert de 15 min ?"].filter(Boolean).join(" ");
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
  /* v105 : le badge de l'onglet Prospects = les urgences prospects du tableau de bord (outilTableau.urgentProspect),
     plus le nombre de nouveautés (qui reste dans le panneau de la page Prospects) */
  urg: 0,
  /* tous = les prospects non archivés déjà analysés ({ l, a } : outilProspects.preparer) */
  urgences(tous){
    if (!Auth.estCoach() || Store.idConsulte) return;
    this.urg = (tous || []).filter(x => x && x.l && !x.l.archive && outilTableau.urgentProspect(x.a)).length;
    this.badge();
  },
  /* v53 (chantier 4) : « reserve » = la case « J'ai réservé » cochée par le prospect (une action du prospect, à vérifier) ;
     elle ne compte plus dès que le coach a décidé du bilan (coché ou retiré : Commercial.bilan) ; v59 : sauf une case
     cochée APRÈS sa dernière décision ; elle suit l'analyse (caseAVerifier) : ni une coche en cours, ni l'appel qui a suivi
     la case (Absent, Perdu) */
  TYPES: { inscription: "inscription", questionnaire: "questionnaire rempli", clic: "clic « Réserver mon plan d'action »", reserve: "a coché « J'ai réservé »" },
  COURTS: { inscription: ["inscription", "inscriptions"], questionnaire: ["questionnaire rempli", "questionnaires remplis"], clic: ["clic « Plan d'action »", "clics « Plan d'action »"], reserve: ["case « J'ai réservé »", "cases « J'ai réservé »"] },
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
    /* v83 (bloc 3) : un compte archivé par le coach n'a plus de Nouveautés (badge et panneau) */
    (lignes || []).filter(l => l && l.p && l.p.statut === "prospect" && !l.archive).forEach(l => {
      ajoute(l, "inscription", l.p.cree_le);
      if (l.dc) ajoute(l, "questionnaire", l.dc.court_le);
      Decouverte.clics(l.ch).forEach(c => ajoute(l, "clic", c.date));
      /* v59 : la case à vérifier de l'analyse (caseAVerifier, comme « À traiter », la carte et la fiche) : aussi une case
         cochée après ta dernière décision, même face à ta coche d'avant l'appel ; plus une case d'avant l'appel */
      const a = Commercial.analyseLigne(l);
      if (a && a.caseAVerifier) ajoute(l, "reserve", a.caseAVerifier);
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
      : complet ? `<ul class="nv-liste nv-suite"${this._deplie ? "" : " hidden"}>${ev.slice(PREMIERS, MAXI).map(li).join("")}</ul>${ev.length > MAXI ? `<p class="note nv-suite"${this._deplie ? "" : " hidden"} style="margin:8px 0 0">Les ${ev.length - MAXI} plus anciennes ne sont pas listées : filtre les prospects par date d'inscription dans « Suivi commercial » (menu Plus).</p>` : ""}${this._deplie ? "" : `<p style="margin:8px 0 0"><button type="button" class="btn ghost petit" data-nv-plus aria-expanded="false">${Math.min(reste, MAXI - PREMIERS) > 1 ? "Voir les " + Math.min(reste, MAXI - PREMIERS) + " suivantes" : "Voir la suivante"}</button></p>`}`
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
  /* badge sur l'onglet Prospects (barre du haut, barre du bas, menu « Plus ») : v105, les urgences prospects */
  badge(){
    const n = (Auth.estCoach() && !Store.idConsulte) ? this.urg : 0;
    $$('#nav a[data-id="prospects"], #barre-bas a[data-id="prospects"], .menu-plus a[data-id="prospects"]').forEach(a => {
      let b = a.querySelector(".nav-badge");
      if (n > 0){
        if (!b){ b = document.createElement("span"); b.className = "nav-badge"; a.appendChild(b); }
        b.textContent = n > 99 ? "99+" : String(n);
        b.setAttribute("aria-label", trad(n > 1 ? "{n} urgences chez tes prospects" : "{n} urgence chez tes prospects", { n }));
      } else if (b) b.remove();
    });
  }
};

/* ------------------------------------------------------------------
   v62 (brief V2, L) — MESURE : les clics sur les boutons « Récupérer mon plan d'action », écran par écran (page Prospects ;
   simple, sans score ni classement). Calculé à l'affichage depuis les lignes déjà chargées (Clients.resumer : profils,
   clés intake et challenge) : rien n'est lu en plus, rien n'est écrit. Anciens codes d'origine lus comme les nouveaux
   (Decouverte.origine). « Plus tard » : cta.plus_tard (depuis la v62), et le choix « plus_tard » de la page du plan
   d'action enregistré avant (intake.bilan_propose), compté une seule fois. Exclus des chiffres : le compte du coach, les
   comptes de test de CONFIG.nouveautes.comptes_test et les comptes dont l'email contient « +test » (email connu dès sa
   première réponse au questionnaire) ; la case « Inclure les comptes de test » (décochée) les remet. Aucune donnée de santé.
   ------------------------------------------------------------------ */
const Mesure = {
  periode: "7", avecTest: false,
  DEBUT: "2026-09-28",
  PERIODES: [["7", "7 derniers jours"], ["30", "30 derniers jours"], ["tout", "Depuis le 28/09/2026"]],
  estTest(l){
    const e = l && l.dc && typeof l.dc.email === "string" ? l.dc.email.toLowerCase() : "", ids = (CONFIG.nouveautes && CONFIG.nouveautes.comptes_test) || [];
    return e.indexOf("+test") > -1 || !!(l && l.p && ids.indexOf(l.p.id) > -1);
  },
  debut(){
    if (this.periode === "tout") return new Date(this.DEBUT + "T00:00:00").getTime();
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (Math.max(1, +this.periode || 7) - 1)); return d.getTime();
  },
  dans(v, t0){ const t = typeof v === "string" ? Date.parse(v) : NaN; return !isNaN(t) && t >= t0 && t <= Date.now() + 5 * 60000; },
  /* les comptes passés par l'inscription gratuite (comme le compteur), hors coach, hors comptes de test (sauf la case) */
  comptes(lignes){
    const passe = l => l.p.statut === "prospect" || !!l.ch || !!(l.dc && (l.dc.court_le || l.dc.court_debut)) || !!(l.suivi && (l.suivi.client_le || l.suivi.issue));
    return (lignes || []).filter(l => l && l.p && l.p.role !== "coach" && passe(l) && (this.avecTest || !this.estTest(l)));
  },
  calcul(lignes){
    const t0 = this.debut(), L = this.comptes(lignes), ecrans = Object.create(null), cliqueurs = new Set();   // sans prototype : un code piege ne touche rien d'autre
    const ecran = k => ecrans[k] || (ecrans[k] = { clics: 0, tard: 0 });
    let clics = 0;
    L.forEach(l => {
      Decouverte.clics(l.ch).forEach(c => { if (!this.dans(c.date, t0)) return; clics++; cliqueurs.add(l.p.id); ecran(Decouverte.origine(c.source) || "?").clics++; });
      const pt = Decouverte.plusTardDe(l.ch);
      pt.forEach(c => { if (this.dans(c.date, t0)) ecran(Decouverte.origine(c.source) || "?").tard++; });
      const b = l.dc && l.dc.bilan;
      if (b && b.choix === "plus_tard" && this.dans(b.le, t0) && !pt.some(c => Decouverte.origine(c.source) === "apres_questionnaire")) ecran("apres_questionnaire").tard++;
    });
    const table = Object.keys(ecrans).map(k => ({ k, nom: k === "?" ? "origine inconnue (avant la v50)" : Decouverte.nomOrigine(k) || k, clics: ecrans[k].clics, tard: ecrans[k].tard }))
      .sort((a, b) => b.clics - a.clics || b.tard - a.tard || a.nom.localeCompare(b.nom, "fr"));
    return { inscrits: L.filter(l => this.dans(l.p.cree_le, t0)).length, questionnaires: L.filter(l => l.dc && this.dans(l.dc.court_le, t0)).length,
             cliqueurs: cliqueurs.size, clics, cases: L.filter(l => this.dans(Decouverte.reserve(l.ch), t0)).length, table,
             exclus: (lignes || []).filter(l => l && l.p && l.p.role !== "coach" && this.estTest(l)).length };
  },
  html(lignes){
    const M = this.calcul(lignes), n = v => String(v);
    const tuile = (lbl, val) => `<div class="tile"><div class="t-lbl">${esc(lbl)}</div><div class="t-val readout">${esc(n(val))}</div></div>`;
    return `<div class="seance-c-tete"><h2>Mesure</h2><select id="pr-mesure-periode" aria-label="Période de la mesure">${this.PERIODES.map(p => `<option value="${p[0]}"${p[0] === this.periode ? " selected" : ""}>${esc(p[1])}</option>`).join("")}</select></div>
      <div class="tiles" id="pr-mesure-chiffres">${tuile("Nouveaux inscrits", M.inscrits)}${tuile("Questionnaires terminés", M.questionnaires)}${tuile("Ont cliqué au moins une fois", M.cliqueurs)}${tuile("Clics", M.clics)}${tuile("« J'ai déjà choisi mon créneau »", M.cases)}</div>
      <h3>Clics par écran</h3>
      ${M.table.length ? `<table class="pr-mesure-t" id="pr-mesure-table"><thead><tr><th>Écran</th><th>Clics</th><th>Plus tard</th></tr></thead><tbody>${M.table.map(r => `<tr data-origine="${esc(r.k)}"><td>${esc(r.nom)}</td><td>${esc(n(r.clics))}</td><td>${esc(n(r.tard))}</td></tr>`).join("")}</tbody></table>`
        : `<p class="note" id="pr-mesure-vide">Aucun clic ni « Plus tard » sur cette période.</p>`}
      <label class="coche" style="margin-top:12px"><input type="checkbox" id="pr-mesure-test"${this.avecTest ? " checked" : ""}> Inclure les comptes de test</label>
      <p class="note" style="margin:8px 0 0">${this.avecTest ? "Comptes de test inclus" : "Exclus : ton compte et " + M.exclus + " compte" + (M.exclus > 1 ? "s" : "") + " de test (email avec « +test », ou compte de test de l'app)"}. Un inscrit qui n'a pas encore répondu au questionnaire n'a pas d'email connu ici. Les réservations par écran se lisent dans Calendly (origine « utm_content »).</p>`;
  },
  /* focus = le reglage qui vient d'etre change : il garde le focus apres le redessin (clavier) */
  monter(boite, lignes, focus){
    if (!boite) return;
    try { boite.innerHTML = this.html(lignes); } catch(e){ console.warn("[MHX] mesure illisible", e); boite.innerHTML = `<h2>Mesure</h2><p class="note">Mesure indisponible pour le moment.</p>`; return; }
    const p = boite.querySelector("#pr-mesure-periode"), t = boite.querySelector("#pr-mesure-test");
    if (p) p.addEventListener("change", () => { this.periode = p.value; this.monter(boite, lignes, p.id); });
    if (t) t.addEventListener("change", () => { this.avecTest = t.checked; this.monter(boite, lignes, t.id); });
    const f = focus && boite.querySelector("#" + focus); if (f) f.focus();
  }
};
