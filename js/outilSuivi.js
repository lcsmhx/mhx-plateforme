/* ------------------------------------------------------------------
   BILAN HEBDOMADAIRE (v36) — le check-in du client.
   Les questions vivent dans CONFIG.bilan.questions. Les reponses sont
   rangees dans la cle « checkins » (au client), une entree par semaine,
   reperee par son lundi. Jamais bloquant : disponible, recommande, c'est
   tout. Le coach lit les bilans dans « Preparer le call » et « Son suivi » ;
   la phase 10 y accrochera son feedback.
   ------------------------------------------------------------------ */
const Checkin = {
  cle: "checkins",
  max: 60,
  maxAvis: 200,
  vide(){ return { liste: [] }; },
  questions(){ return (CONFIG.bilan && CONFIG.bilan.questions) || []; },
  /* v53 — les trois cases du feedback du dimanche (CONFIG.bilan.dimanche) */
  questionsDimanche(){ const d = CONFIG.bilan && CONFIG.bilan.dimanche; return (d && Array.isArray(d.questions)) ? d.questions : []; },
  bornesNote(){ const n = (CONFIG.bilan && CONFIG.bilan.dimanche && CONFIG.bilan.dimanche.note) || {}; return { min: Number.isInteger(n.min) ? n.min : 1, max: Number.isInteger(n.max) ? n.max : 10 }; },
  /* v53 — le smiley que le client pose sur la réponse du coach (checkins.avis) */
  SMILEYS: [{ id: "triste", emo: "😞", lbl: "Pas vraiment" }, { id: "neutre", emo: "😐", lbl: "Moyen" }, { id: "content", emo: "😊", lbl: "Oui" }],

  /* ------------------------------------------------------------------
     v53 (chantier 3) — LA RÈGLE DE LA SEMAINE, par compte.
     « dimanche » : le compte a le feedback du dimanche (interrupteur CONFIG.nouveautes.feedback_dimanche :
     Interrupteurs.visible pour la personne connectée — en « test », le coach et le compte de test ; pourCompte
     pour le client dont le coach ouvre la fiche). Sinon « vendredi » : le bilan du vendredi, comme avant.
     ------------------------------------------------------------------ */
  regle(uid){
    const u = Auth.utilisateur(), moi = u && u.id;
    const id = uid || Store.idConsulte || moi;
    if (id && id === moi) return Interrupteurs.visible("feedback_dimanche") ? "dimanche" : "vendredi";
    return Interrupteurs.pourCompte("feedback_dimanche", id) ? "dimanche" : "vendredi";
  },
  jour(){ return (new Date().getDay() + 6) % 7 + 1; },   // 1 = lundi … 7 = dimanche, horloge de l'appareil qui affiche
  decaler(iso, n){ const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return Regularite.iso(d); },
  /* le jour d'ouverture du bilan du vendredi (1 = lundi … 7 = dimanche) ; 0 est une valeur permise (v53 : « || 5 »
     la remplaçait par 5) — 0 ou 1 : toujours la semaine en cours */
  ouverture(){ const v = CONFIG.bilan && CONFIG.bilan.jour_ouverture; return (typeof v === "number" && isFinite(v) && v >= 0 && v <= 7) ? Math.floor(v) : 5; },
  /* les entrées lisibles (verif42 : une liste piégée n'arrête rien) */
  liste(C){ return (C && Array.isArray(C.liste)) ? C.liste.filter(x => x && typeof x === "object") : []; },
  nomJour(iso){ try { const d = new Date(iso + "T12:00:00"); return isNaN(d) ? "" : d.toLocaleDateString(locale(), { weekday: "long" }); } catch(e){ return ""; } },

  /* La semaine visée et l'état de sa fenêtre. Tous les textes du bilan et du feedback en découlent.
     → { debut, fin (lundi et dimanche ISO), etat: "ouvert" | "en_retard" | "ferme", limite (dernier jour où cette
         semaine peut encore être envoyée), regle: "vendredi" | "dimanche", prochain (règle du dimanche : le dimanche
         du prochain feedback) }
     Règle du dimanche : le dimanche, la semaine en cours (ouvert) ; le lundi, la semaine passée, « en retard »
       seulement si elle n'a pas été faite (sinon fermé) ; du mardi au samedi, la semaine passée, fermé.
     Règle du vendredi : du jour d'ouverture au dimanche, la semaine en cours (ouvert) ; avant, la semaine passée,
       « en retard » tant qu'elle n'est pas faite (jusqu'à la veille du jour d'ouverture : le jeudi soir).
     C : le document checkins (pour savoir si la semaine passée est faite) ; uid : le compte concerné. */
  semaineVisee(C, uid){
    const regle = this.regle(uid), jour = this.jour();
    const cette = Regularite.bornes(0), passee = Regularite.bornes(-1);
    const faitePassee = !!this.entree(C, passee.debut);
    if (regle === "dimanche"){
      if (jour === 7) return { debut: cette.debut, fin: cette.fin, etat: "ouvert", limite: this.decaler(cette.fin, 1), regle, prochain: cette.fin };
      return { debut: passee.debut, fin: passee.fin, etat: (jour === 1 && !faitePassee) ? "en_retard" : "ferme", limite: this.decaler(passee.fin, 1), regle, prochain: cette.fin };
    }
    const o = this.ouverture();
    if (jour >= o) return { debut: cette.debut, fin: cette.fin, etat: "ouvert", limite: cette.fin, regle };
    return { debut: passee.debut, fin: passee.fin, etat: faitePassee ? "ouvert" : "en_retard", limite: this.decaler(passee.fin, o - 1), regle };
  },
  entree(C, debut){ return this.liste(C).find(x => x.semaine === debut) || null; },
  etat(C, uid){ const v = this.semaineVisee(C, uid); const e = this.entree(C, v.debut); return { semaine: v, entree: e, fait: !!e }; },
  periode(x){ return trad("Semaine du {a} au {b}", { a: dateFr(x.semaine), b: dateFr(x.fin || x.semaine) }); },
  /* v53 — la note sur 10 d'une entrée, relue avec prudence : un entier de 1 à 10, sinon rien */
  noteValide(n){ const b = this.bornesNote(); return typeof n === "number" && Number.isInteger(n) && n >= b.min && n <= b.max; },
  note(x){ const n = x && x.reponses && typeof x.reponses === "object" ? x.reponses.note : null; return this.noteValide(n) ? n : null; },

  champ(q, v){
    const val = v == null ? "" : v;
    if (q.type === "echelle5") return `<div class="seg echelle5" data-q="${esc(q.id)}" role="group" aria-label="${esc(q.label)}">${[1,2,3,4,5].map(n => `<button type="button" data-v="${n}" aria-pressed="${String(val) === String(n)}">${n}</button>`).join("")}</div>`;
    if (q.type === "nombre") return `<input type="number" min="0" max="30" step="1" inputmode="numeric" data-q="${esc(q.id)}" value="${esc(val)}">`;
    if (q.type === "select") return `<select data-q="${esc(q.id)}"><option value="">— choisis —</option>${(q.options || []).map(o => `<option value="${esc(o)}"${val === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    return `<textarea rows="2" data-q="${esc(q.id)}">${esc(val)}</textarea>`;
  },

  /* v53 : la semaine affichée (v) est gardée dans le formulaire : c'est elle qui est enregistrée, pas une semaine
     recalculée au clic (un formulaire ouvert le jeudi à 23 h 59 et envoyé à minuit reste sur sa semaine) */
  formulaire(C, entree, v){
    const r = (entree && entree.reponses) || {};
    return `<form class="checkin-form" data-checkin data-semaine="${esc(v.debut)}" data-fin="${esc(v.fin)}">
      ${this.questions().map(q => `<div class="checkin-q${q.type === "echelle5" ? " echelle" : ""}">
        <label>${esc(q.label)}</label>
        ${q.aide ? `<p class="note" style="margin:-2px 0 8px">${esc(q.aide)}</p>` : ""}
        ${this.champ(q, r[q.id])}
      </div>`).join("")}
      <div class="actions"><button type="submit" class="btn">${esc(entree ? trad("Mettre à jour mon bilan") : trad("Envoyer mon bilan"))}</button>${entree ? `<button type="button" class="btn ghost" data-checkin-annuler>${esc(trad("Annuler"))}</button>` : ""}<span class="msg" data-checkin-msg></span></div>
    </form>`;
  },

  lire(form){
    const rep = {};
    this.questions().forEach(q => {
      if (q.type === "echelle5"){ const b = form.querySelector(`[data-q="${q.id}"] [aria-pressed="true"]`); rep[q.id] = b ? +b.dataset.v : null; return; }
      const el = form.querySelector(`[data-q="${q.id}"]`); if (!el) return;
      rep[q.id] = q.type === "nombre" ? (el.value === "" ? null : num(el.value)) : el.value.trim();
    });
    return rep;
  },

  /* ------------------------------------------------------------------
     v59 (Q13) — TOUTE écriture de checkins (l'entrée de la semaine : bilan du vendredi et feedback du dimanche ; le
     smiley ; « réponse vue », fb_vu) passe par une file, sur le modèle de Decouverte.fraiche / enFile. Juste avant
     d'écrire : l'écriture en attente de cet onglet part d'abord, la base est relue, ce que la copie affichée (C) a de
     plus y est réuni (fusion), la modification est appliquée sur ce résultat, écrite puis envoyée tout de suite ; C
     prend la version écrite. Une copie lue à l'ouverture de Mon suivi n'efface plus ce qu'un autre appareil (ou un
     autre onglet) a écrit entre-temps.
     ------------------------------------------------------------------ */
  _file: Promise.resolve(),
  enFile(fn){
    const p = this._file.then(fn, fn);
    this._file = Promise.race([p.then(() => {}, () => {}), new Promise(r => setTimeout(r, 15000))]);
    return p;
  },
  _relus: new WeakSet(),   // les copies affichées qui ont pris une version relue (même si leur lecture d'ouverture avait échoué)
  /* la base relue juste avant d'écrire, complétée par C. null : relecture ratée (rien n'est écrit sur la base relue) ;
     false : la fiche a changé (message déjà affiché), ou consultation du coach (il n'écrit jamais checkins) */
  async fraiche(C){
    const uid = Store.cible(); if (!uid || Store.idConsulte) return false;
    const o = (C && typeof C === "object") ? Store.origines.get(C) : undefined;
    if (o && o !== uid){ Store.ficheChangee(); return false; }
    await Store.envoyerCle(this.cle);   // l'écriture en attente de cet onglet (700 ms) part d'abord : la base relue la contient
    const k = uid + "|" + this.cle, avant = Store.charge[k];
    const F = await Store.lire(this.cle, this.vide());
    if (!F || typeof F !== "object" || Store.nonLus.has(F)){ Store.charge[k] = avant; return null; }   // une relecture ratée ne change pas ce qui était permis (Q13-6)
    if (Store.cible() !== uid) return false;
    if (!Array.isArray(F.liste)) F.liste = [];
    return this.fusion(F, C);
  },
  /* rien de ce que l'un ou l'autre a de plus n'est perdu : les entrées par semaine (la plus récemment envoyée :
     envoye_a, sinon envoye_le ; à égalité, la base), les avis par (semaine, réponse) (le plus récent, « le »), fb_vu
     (le plus récent). F (la base relue) est complété et renvoyé ; les entrées et les avis sont gardés tels quels. */
  fusion(F, C){
    if (!C || typeof C !== "object" || C === F) return F;
    const s = v => typeof v === "string" ? v : "", quand = x => s(x && x.envoye_a) || s(x && x.envoye_le);
    let ajout = false;
    this.liste(C).forEach(x => {
      if (typeof x.semaine !== "string") return;
      const i = F.liste.findIndex(y => y && typeof y === "object" && y.semaine === x.semaine);
      if (i === -1){ F.liste.push(x); ajout = true; }
      else if (quand(x) > quand(F.liste[i])) F.liste[i] = x;
    });
    if (ajout){ F.liste.sort((a, b) => String(a && a.semaine) < String(b && b.semaine) ? -1 : 1); if (F.liste.length > this.max) F.liste = F.liste.slice(-this.max); }
    if (Array.isArray(C.avis) && C.avis.length){
      if (!Array.isArray(F.avis)) F.avis = [];
      C.avis.forEach(a => {
        if (!a || typeof a !== "object") return;
        const i = F.avis.findIndex(y => y && typeof y === "object" && y.semaine === a.semaine && y.fb === a.fb);
        if (i === -1) F.avis.push(a); else if (s(a.le) > s(F.avis[i].le)) F.avis[i] = a;
      });
      if (F.avis.length > this.maxAvis) F.avis = F.avis.slice(-this.maxAvis);
    }
    const vu = this.vu(C); if (vu && vu > this.vu(F)) F.fb_vu = vu;
    return F;
  },
  /* toute écriture de checkins : appliquer(D) modifie la version fraîche (false = rien à écrire). Renvoie (Promise)
     true si c'est écrit (ou s'il n'y avait rien à écrire), false sinon. C prend la version écrite (même objet :
     l'affichage et les écritures suivantes partent d'elle).
     Relecture impossible (hors ligne, Q13-6, choix b) : opts.horsLigne (une vraie saisie : bilan, feedback) — comme
     en v48, la saisie est écrite sur la copie affichée, gardée sur l'appareil et renvoyée d'elle-même (si la lecture
     de l'ouverture avait échoué : le refus d'avant, avec son message) ; opts.silence (fb_vu) : rien, sans message ;
     sinon (smiley) : refus, avec le message de lecture ratée. */
  modifier(C, appliquer, opts){
    return this.enFile(() => this._modifier(C, appliquer, opts || {}).catch(e => { console.warn("[MHX] checkins : écriture impossible", e); return false; }));
  },
  async _modifier(C, appliquer, opts){
    const D = await this.fraiche(C);
    if (D === false) return false;
    const k = Store.cible() + "|" + this.cle;
    if (D === null){
      if (opts.horsLigne){
        if (Store.nonLus.has(C) && !this._relus.has(C)){ Store.lectureRatee(k); return false; }
        const X = JSON.parse(JSON.stringify(C));
        if (appliquer(X) === false) return true;
        if (Store.ecrire(this.cle, X) === false) return false;   // refusée (message déjà affiché)
        this.remplacer(C, X);
        return true;
      }
      if (!opts.silence) Store.lectureRatee(k);
      return false;
    }
    const rien = appliquer(D) === false;
    if (!rien && Store.ecrire(this.cle, D) === false) return false;
    this.remplacer(C, D); this._relus.add(C);
    if (!rien) await Store.envoyerCle(this.cle);   // part tout de suite : la fenêtre qui reste se réduit au trajet réseau
    return true;
  },
  remplacer(C, D){ Object.keys(C).forEach(x => { delete C[x]; }); Object.assign(C, D); },

  /* v53 — la seule écriture d'une entrée de checkins (bilan du vendredi et feedback du dimanche). L'entrée de la
     semaine est complétée, jamais reconstruite : ses champs en plus (et ceux du document : avis, fb_vu…) sont
     gardés, ses réponses d'un autre format aussi (seul « format » suit le formulaire envoyé). Renvoie l'entrée
     enregistrée, ou null si l'écriture est refusée (message déjà affiché).
     v59 (Q13) : par la file (modifier) — l'entrée est complétée sur la base relue juste avant, pas sur la copie de
     l'ouverture ; renvoie une Promise. */
  async enregistrerEntree(C, semaine, fin, rep, format){
    let entree = null;
    const ok = await this.modifier(C, D => {
      if (!Array.isArray(D.liste)) D.liste = [];
      const ancienne = D.liste.find(x => x && typeof x === "object" && x.semaine === semaine) || null;
      const anc = (ancienne && ancienne.reponses && typeof ancienne.reponses === "object" && !Array.isArray(ancienne.reponses)) ? ancienne.reponses : {};
      const e = Object.assign({}, ancienne || {}, { semaine: semaine, fin: fin, envoye_le: aujourdhui(), envoye_a: new Date().toISOString(), reponses: Object.assign({}, anc, rep) });
      if (format) e.format = format; else delete e.format;
      D.liste = D.liste.filter(x => !(x && x.semaine === semaine));
      D.liste.push(e);
      D.liste.sort((a, b) => String(a && a.semaine) < String(b && b.semaine) ? -1 : 1);
      if (D.liste.length > this.max) D.liste = D.liste.slice(-this.max);
      entree = e;
    }, { horsLigne: true });
    return ok ? entree : null;
  },

  /* branche un formulaire deja rendu ; apres(entree) est appele une fois enregistre */
  brancher(zone, C, apres){
    const form = zone.querySelector("[data-checkin]"); if (!form) return;
    $$(".echelle5 button", form).forEach(b => b.addEventListener("click", () => {
      $$("button", b.parentNode).forEach(x => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
    }));
    const annuler = form.querySelector("[data-checkin-annuler]");
    if (annuler) annuler.addEventListener("click", () => { if (typeof apres === "function") apres(null); });
    let envoi = false;   // v59 : un envoi à la fois (relecture puis écriture ; double clic)
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (envoi) return;
      const rep = this.lire(form);
      const echelles = this.questions().filter(q => q.type === "echelle5");
      const manque = echelles.filter(q => rep[q.id] == null);
      if (manque.length){ const m = form.querySelector("[data-checkin-msg]"); if (m){ m.textContent = trad("Il manque : {l}", { l: manque.map(q => q.label).join(", ") }); setTimeout(() => { m.textContent = ""; }, 3200); } return; }
      const v = form.dataset.semaine ? { debut: form.dataset.semaine, fin: form.dataset.fin } : this.semaineVisee(C);
      const bt = form.querySelector('button[type="submit"]');
      envoi = true; if (bt) bt.disabled = true;
      const entree = await this.enregistrerEntree(C, v.debut, v.fin, rep, null);
      envoi = false; if (bt) bt.disabled = false;
      if (!entree) return;   // refusée : le texte reste dans le formulaire
      UI.toast(trad("Bilan envoyé. Ton coach le lira avant votre prochain échange."), "ok");
      if (typeof apres === "function") apres(entree);
    });
  },

  /* les reponses d'une entree, en lecture (v53 : selon son format ; sans format = bilan du vendredi, 11 questions).
     v59 (remarque v53 c1) : les réponses de l'AUTRE format restent affichées quand elles existent (un bilan du vendredi
     complété par le formulaire du dimanche, ou l'inverse : enregistrerEntree les garde toutes) ; affichage seul.
     « alimentation », identifiant commun aux deux formats, ne s'affiche qu'une fois (dans le format de l'entrée). Une
     entrée sans réponse de l'autre format s'affiche exactement comme avant. */
  reponsesHTML(x){
    const r = (x && x.reponses && typeof x.reponses === "object") ? x.reponses : {};
    const ven = this.questions().map(q => q.id), communs = this.questionsDimanche().map(q => q.id).filter(id => ven.indexOf(id) > -1);
    if (x && x.format === "dimanche"){
      const v = this.repVendredi(r, communs, true), plus = v.echelles.length + v.textes.length > 0;
      return this.reponsesDimancheHTML(x, { suite: plus }) + (plus ? this.reponsesVendrediHTML(r, v) : "");
    }
    const h = this.reponsesVendrediHTML(r, this.repVendredi(r, []));
    const dim = this.note(x) != null || this.questionsDimanche().some(q => communs.indexOf(q.id) === -1 && typeof r[q.id] === "string" && r[q.id].trim());
    return dim ? h + this.reponsesDimancheHTML(x, { sauf: communs, suite: true }) : h;
  },
  /* v59 — les questions du bilan du vendredi qui ont une réponse (sauf les identifiants de « sauf ») ; stricte (les
     réponses de l'autre format, sous un feedback du dimanche) : seulement un texte non vide ou un nombre */
  repVendredi(r, sauf, stricte){
    const q = this.questions().filter(q => sauf.indexOf(q.id) === -1 && r[q.id] != null && (!stricte || (typeof r[q.id] === "string" && r[q.id].trim()) || (typeof r[q.id] === "number" && isFinite(r[q.id]))));
    return { echelles: q.filter(q => q.type === "echelle5"), textes: q.filter(q => q.type !== "echelle5" && r[q.id] !== "") };
  },
  reponsesVendrediHTML(r, v){
    return `${v.echelles.length ? `<div class="checkin-echelles">${v.echelles.map(q => `<span class="pastille"><span data-notr>${esc(q.label)}</span> <b>${esc(r[q.id])}</b>/5</span>`).join("")}</div>` : ""}
      ${v.textes.map(q => `<p class="checkin-rep"><span class="lbl">${esc(q.label)}</span>${esc(String(r[q.id]))}</p>`).join("")}`;
  },
  /* v53 — une entrée du feedback du dimanche : la note, puis les cases remplies (textes du client : data-notr).
     v59 : o.sauf, les cases à ne pas répéter ; o.suite, d'autres réponses suivent (pas de « Aucune réponse lisible. ») */
  reponsesDimancheHTML(x, o){
    o = o || {};
    const r = (x.reponses && typeof x.reponses === "object") ? x.reponses : {};
    const n = this.note(x);
    const textes = this.questionsDimanche().filter(q => !(o.sauf && o.sauf.indexOf(q.id) > -1) && typeof r[q.id] === "string" && r[q.id].trim());
    return `${n != null ? `<div class="checkin-echelles"><span class="pastille fbd-note"><span>${esc(trad("Note de la semaine"))}</span> <b>${n}</b>/10</span></div>` : ""}
      ${textes.map(q => `<p class="checkin-rep"><span class="lbl">${esc(trad(q.label))}</span><span data-notr>${esc(r[q.id])}</span></p>`).join("")}
      ${n == null && !textes.length && !o.suite ? `<p class="note" style="margin:0">${esc(trad("Aucune réponse lisible."))}</p>` : ""}`;
  },

  /* le bloc « statut » : disponible / envoye, pour Mon suivi et l'accueil (v53 : opts.uid, le compte concerne ;
     textes tires de l'etat de la semaine : plus de « avant dimanche soir » du lundi au jeudi) */
  statutHTML(C, opts){
    opts = opts || {};
    const e = this.etat(C, opts.uid);
    if (e.semaine.regle === "dimanche") return this.statutDimancheHTML(e, opts);
    if (e.fait){
      return `<div class="acces fait${opts.lien ? "" : " statique"}"${opts.lien ? ` href="${opts.lien}"` : ""}><span class="ico">${ICONES.bilan}</span><span class="txt"><b>${esc(trad("Bilan de la semaine envoyé"))}</b><small>${esc(trad("le {d} — merci, ton coach le lit avant votre prochain échange", { d: dateFr(e.entree.envoye_le) }))}</small></span>${opts.lien ? `<span class="fleche">›</span>` : ""}</div>`;
    }
    const sous = e.semaine.etat === "en_retard"
      ? trad("Ton bilan de la semaine du {a} au {b} n'est pas encore fait : tu as jusqu'à {j} soir.", { a: dateFr(e.semaine.debut), b: dateFr(e.semaine.fin), j: this.nomJour(e.semaine.limite) })
      : trad("5 minutes, avant dimanche soir : c'est ce qui permet à ton coach d'ajuster");
    return `<a class="acces attention" href="${opts.lien || "#/suivi"}"><span class="ico">${ICONES.bilan}</span><span class="txt"><b>${esc(trad("Ton bilan de la semaine est disponible"))}</b><small>${esc(sous)}</small></span><span class="fleche">›</span></a>`;
  },
  /* v53 — la carte de la règle du dimanche (accueil) : toujours un lien vers Mon suivi */
  statutDimancheHTML(e, opts){
    const v = e.semaine, lien = opts.lien || "#/suivi", per = { a: dateFr(v.debut), b: dateFr(v.fin) };
    const carte = (cls, t, s) => `<a class="acces${cls}" href="${esc(lien)}" data-fbd-statut="${esc(v.etat)}"><span class="ico">${ICONES.bilan}</span><span class="txt"><b>${esc(t)}</b><small>${esc(s)}</small></span><span class="fleche">›</span></a>`;
    if (v.etat === "ouvert" && !e.fait) return carte(" attention", trad("C'est dimanche : ton feedback de la semaine t'attend (2 minutes)"), trad("Semaine du {a} au {b}", per));
    if (v.etat === "en_retard") return carte(" attention", trad("Ton feedback de la semaine du {a} au {b} n'a pas été fait.", per), trad("Tu peux encore le faire aujourd'hui."));
    if (v.etat === "ouvert") return carte(" fait", trad("Feedback de la semaine envoyé"), trad("le {d} — ton coach te répond au même endroit, dans Mon suivi", { d: dateFr(e.entree.envoye_le) }));
    return carte("", trad("Prochain feedback : dimanche {d}", { d: dateFr(v.prochain) }), trad("Une note sur 10 et trois lignes : ton coach te répond au même endroit."));
  },
  /* v53 — le rappel du dimanche en haut de l'accueil, tant que le feedback de la semaine n'est pas fait */
  bandeauHTML(C, uid){
    const e = this.etat(C, uid);
    if (e.semaine.regle !== "dimanche" || e.semaine.etat !== "ouvert" || e.fait) return "";
    return `<a class="bandeau fbd-bandeau" href="#/suivi" data-fbd-bandeau><span class="fbd-bandeau-txt"><strong>${esc(trad("C'est dimanche : ton feedback de la semaine t'attend (2 minutes)"))}</strong><span class="note">${esc(trad("Une note sur 10 et trois lignes : ton coach te répond au même endroit."))}</span></span><span class="fleche" aria-hidden="true">›</span></a>`;
  },

  /* l'historique, du plus recent au plus ancien */
  historiqueHTML(C, sauf){
    const l = this.liste(C).filter(x => x.semaine !== sauf).slice().reverse();
    if (!l.length) return "";
    return `<h3 style="margin-top:20px">${esc(trad("Mes bilans précédents"))}</h3>` + l.map(x => `<details class="hist-entree"><summary><b>${esc(this.periode(x))}</b> <span class="hist-dates">${esc(trad("envoyé le {d}", { d: dateFr(x.envoye_le) }))}</span></summary>${this.reponsesHTML(x)}</details>`).join("");
  },

  /* Mon suivi : le panneau complet (client : formulaire ; coach : lecture) — bilan du vendredi */
  monter(idZone, C){
    const z = $(idZone); if (!z) return;
    const consult = !!Store.idConsulte, uid = Store.cible();
    const dessiner = (ouvert) => {
      const e = this.etat(C, uid);
      let corps = "";
      if (consult){
        corps = e.fait ? `<p class="note" style="margin:0 0 10px">${esc(this.periode(e.entree))} · ${esc(trad("envoyé le {d}", { d: dateFr(e.entree.envoye_le) }))}</p>${this.reponsesHTML(e.entree)}`
                       : `<div class="empty">${esc(trad("Pas encore de bilan pour cette semaine."))}</div>`;
      } else if (ouvert || !e.fait){
        corps = `<p class="note" style="margin:0 0 14px">${esc(trad("Semaine du {a} au {b}", { a: dateFr(e.semaine.debut), b: dateFr(e.semaine.fin) }))} · ${esc(trad("Réponds simplement, avec tes mots. Rien n'est noté : ça sert à ajuster ton suivi."))}</p>` + this.formulaire(C, e.entree, e.semaine);
      } else {
        corps = this.statutHTML(C, { uid }) + `<div style="margin-top:12px">${this.reponsesHTML(e.entree)}</div><div class="actions"><button type="button" class="btn ghost petit" data-checkin-modifier>${esc(trad("Modifier mon bilan"))}</button></div>`;
      }
      z.innerHTML = `<section class="panel"><div class="seance-c-tete"><h2>${esc(trad("Bilan hebdomadaire"))}</h2>${e.fait ? `<span class="pastille ok">✓ ${esc(trad("envoyé"))}</span>` : `<span class="pastille attention">${esc(trad("disponible"))}</span>`}</div>
        ${corps}${this.historiqueHTML(C, e.entree ? e.entree.semaine : null)}</section>`;
      const mod = z.querySelector("[data-checkin-modifier]"); if (mod) mod.addEventListener("click", () => dessiner(true));
      this.brancher(z, C, () => dessiner(false));
    };
    dessiner(false);
  },

  /* ==================================================================
     v53 (chantier 3) — FEEDBACK DU DIMANCHE (règle « dimanche » seulement)
     Le client écrit dans checkins (sa clé) : l'entrée de la semaine (format « dimanche » : note 1-10 + trois
     cases), ses smileys (checkins.avis = [{ semaine, fb, smiley, le, deplu?, ameliorer? }], un par réponse du
     coach notée) et checkins.fb_vu (la dernière réponse du coach qu'il a vue : le badge). Il n'écrit JAMAIS
     feedbacks (la base le refuse) ; le coach n'écrit JAMAIS checkins. La réponse du coach vient de feedbacks
     (même semaine) et s'affiche sous le feedback de la semaine, au même endroit.
     ================================================================== */
  /* l'instant d'une réponse du coach : ecrit_a (v53), sinon son jour */
  marque(f){ return (f && typeof f.ecrit_a === "string" && f.ecrit_a) || (f && typeof f.date === "string" && f.date) || ""; },
  avisListe(C){
    const ids = this.SMILEYS.map(s => s.id);
    return (C && Array.isArray(C.avis) ? C.avis : []).filter(a => a && typeof a === "object" && typeof a.semaine === "string" && ids.indexOf(a.smiley) > -1);
  },
  avisPour(C, semaine, fb){ return this.avisListe(C).find(a => a.semaine === semaine && a.fb === fb) || null; },
  dernierAvis(C, semaine){ return this.avisListe(C).filter(a => a.semaine === semaine).sort((a, b) => String(a.le || "") < String(b.le || "") ? 1 : -1)[0] || null; },
  /* un 😞 est « traité » quand le coach a répondu à cette semaine APRÈS lui (ecrit_a plus récent) */
  avisTraite(a, F){ const f = a ? Feedback.pour(F, a.semaine) : null; return !!(f && typeof f.ecrit_a === "string" && typeof a.le === "string" && f.ecrit_a > a.le); },
  /* les 😞 non traités (le dernier avis de chaque semaine), du plus récent au plus ancien */
  avisTristes(C, F){
    const par = {};
    this.avisListe(C).forEach(a => { if (!par[a.semaine] || String(a.le || "") > String(par[a.semaine].le || "")) par[a.semaine] = a; });
    return Object.keys(par).map(k => par[k]).filter(a => a.smiley === "triste" && !this.avisTraite(a, F)).sort((a, b) => a.semaine < b.semaine ? 1 : -1);
  },
  /* v53 — note en chute (précision de Lucas) : sur le dernier feedback noté de la semaine passée ou en cours,
     une note de 5 ou moins, ou 2 points de moins que la note précédente. → { note, avant } ou null */
  noteEnChute(C){
    const l = this.liste(C).filter(x => x.format === "dimanche" && this.note(x) != null && typeof x.semaine === "string").sort((a, b) => a.semaine < b.semaine ? -1 : 1);
    const der = l[l.length - 1];
    if (!der || der.semaine < Regularite.bornes(-1).debut) return null;
    const n = this.note(der), p = l.length > 1 ? this.note(l[l.length - 2]) : null;
    return (n <= 5 || (p != null && p - n >= 2)) ? { note: n, avant: p, semaine: der.semaine } : null;
  },
  vu(C){ return (C && typeof C.fb_vu === "string") ? C.fb_vu : ""; },
  /* le dernier fb_vu écrit par cet onglet (la base peut ne pas l'avoir encore : écriture dans 700 ms ; v59 : posé une fois
     l'écriture acceptée, envoyée tout de suite ; si l'envoi échoue, elle attend sur l'appareil) */
  _vuEcrit: null,
  /* les réponses du coach plus récentes que la dernière vue (écrites dans les 14 derniers jours : pas de badge
     pour une vieille réponse le jour où le feedback du dimanche s'allume), la plus récente d'abord */
  nonVus(C, F){
    const u = Auth.utilisateur(), local = (!Store.idConsulte && u && this._vuEcrit && this._vuEcrit.uid === u.id) ? this._vuEcrit.v : "";
    const vu = [this.vu(C), local].sort().pop(), d = new Date(); d.setDate(d.getDate() - 14);
    const il14 = Regularite.iso(d);
    return Feedback.liste(F).filter(f => this.marque(f) > vu && typeof f.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.date) && f.date >= il14).sort((a, b) => this.marque(a) < this.marque(b) ? 1 : -1);
  },
  /* les semaines à montrer : celles d'une entrée ou d'une réponse du coach, de la plus récente à la plus ancienne */
  semaines(C, F){
    const s = new Set(), ok = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    this.liste(C).forEach(x => { if (ok(x.semaine)) s.add(x.semaine); });
    Feedback.liste(F).forEach(f => { if (ok(f.semaine)) s.add(f.semaine); });
    return Array.from(s).sort().reverse();
  },

  /* le formulaire du dimanche (v : la semaine affichée, enregistrée telle quelle) */
  formulaireDimanche(entree, v){
    const r = (entree && entree.reponses && typeof entree.reponses === "object") ? entree.reponses : {};
    const n = this.note(entree), b = this.bornesNote(), notes = [];
    for (let k = b.min; k <= b.max; k++) notes.push(k);
    return `<form class="checkin-form fbd-form" data-fbd data-semaine="${esc(v.debut)}" data-fin="${esc(v.fin)}" novalidate>
      <div class="checkin-q">
        <label id="fbd-note-lbl">${esc(trad("Selon toi, comment as-tu travaillé cette semaine ?"))}</label>
        <p class="note" style="margin:-2px 0 8px">${esc(trad("1 = très mal · 10 = parfaitement"))}</p>
        <div class="seg note10" role="group" aria-labelledby="fbd-note-lbl">${notes.map(k => `<button type="button" data-v="${k}" aria-pressed="${n === k}" aria-label="${esc(trad("{n} sur 10", { n: k }))}">${k}</button>`).join("")}</div>
      </div>
      ${this.questionsDimanche().map(q => `<div class="checkin-q"><label for="fbd-${esc(q.id)}">${esc(trad(q.label))}</label><textarea id="fbd-${esc(q.id)}" rows="2" maxlength="2000" data-q="${esc(q.id)}" placeholder="${esc(trad(q.aide || ""))}">${esc(typeof r[q.id] === "string" ? r[q.id] : "")}</textarea></div>`).join("")}
      <p class="note" style="margin:0 0 4px">${esc(trad("La note est obligatoire ; les trois cases sont facultatives."))}</p>
      <div class="actions"><button type="submit" class="btn">${esc(entree ? trad("Mettre à jour mon feedback") : trad("Envoyer mon feedback"))}</button>${entree ? `<button type="button" class="btn ghost" data-fbd-annuler>${esc(trad("Annuler"))}</button>` : ""}<span class="msg" data-fbd-msg role="status" aria-live="polite"></span></div>
    </form>`;
  },
  brancherDimanche(zone, C, apres){
    const form = zone.querySelector("[data-fbd]"); if (!form) return;
    $$(".note10 button", form).forEach(b => b.addEventListener("click", () => {
      $$(".note10 button", form).forEach(x => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
    }));
    const annuler = form.querySelector("[data-fbd-annuler]");
    if (annuler) annuler.addEventListener("click", () => { if (typeof apres === "function") apres(null); });
    let envoi = false;   // v59 : un envoi à la fois (relecture puis écriture ; double clic)
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (envoi) return;
      const b = form.querySelector('.note10 [aria-pressed="true"]');
      const note = b ? parseInt(b.dataset.v, 10) : null;
      const m = form.querySelector("[data-fbd-msg]");
      if (!this.noteValide(note)){ if (m){ m.textContent = trad("Choisis ta note, de 1 à 10."); setTimeout(() => { if (m.textContent === trad("Choisis ta note, de 1 à 10.")) m.textContent = ""; }, 3200); } return; }
      const rep = { note: note };
      this.questionsDimanche().forEach(q => { const el = form.querySelector(`[data-q="${q.id}"]`); rep[q.id] = el ? el.value.trim().slice(0, 2000) : ""; });
      const bt = form.querySelector('button[type="submit"]');
      envoi = true; if (bt) bt.disabled = true;
      const entree = await this.enregistrerEntree(C, form.dataset.semaine, form.dataset.fin, rep, "dimanche");
      envoi = false; if (bt) bt.disabled = false;
      if (!entree) return;   // refusée : le texte reste dans le formulaire
      UI.toast(trad("Feedback envoyé. Ton coach te répond ici, juste en dessous."), "ok");
      if (typeof apres === "function") apres(entree);
    });
  },

  /* la réponse du coach à une semaine, juste sous le feedback ; le client y pose son smiley (le coach, en
     consultation, voit l'avis du client) */
  reponseHTML(C, F, semaine, idx, consult){
    const f = Feedback.pour(F, semaine);
    if (!f) return `<div class="fbd-reponse fbd-attente"><p class="note" style="margin:0">${esc(trad("Ton coach n'a pas encore répondu."))}</p></div>`;
    return `<div class="fb-entree fbd-reponse" data-fbd-reponse="${esc(semaine)}"><div class="fb-tete"><b>${esc(trad("Réponse de ton coach"))}</b> <span class="hist-dates">${esc(trad("écrit le {d}", { d: dateFr(f.date) }))}</span></div><p class="fb-texte" data-notr>${esc(f.texte)}</p>${consult ? this.avisCoachHTML(C, semaine, F) : this.avisHTML(C, semaine, f, idx)}</div>`;
  },
  /* les trois smileys (facultatif, un clic), et si 😞 les deux questions */
  avisHTML(C, semaine, f, idx){
    const fb = this.marque(f), a = this.avisPour(C, semaine, fb), id = "fbd-av-" + idx;
    const txt = k => esc(a && typeof a[k] === "string" ? a[k] : "");
    return `<div class="fbd-avis" data-avis-semaine="${esc(semaine)}" data-avis-fb="${esc(fb)}">
      <p class="fbd-avis-q" id="${id}">${esc(trad("Cette réponse t'a aidé ?"))}</p>
      <div class="fbd-smileys" role="group" aria-labelledby="${id}">${this.SMILEYS.map(s => `<button type="button" data-smiley="${s.id}" aria-pressed="${!!a && a.smiley === s.id}"><span class="emo" aria-hidden="true">${s.emo}</span><span>${esc(trad(s.lbl))}</span></button>`).join("")}</div>
      <div class="fbd-triste"${a && a.smiley === "triste" ? "" : " hidden"}>
        <label for="${id}-d">${esc(trad("Qu'est-ce qui ne t'a pas plu ?"))}</label><textarea id="${id}-d" rows="2" maxlength="2000" data-avis-q="deplu">${txt("deplu")}</textarea>
        <label for="${id}-a">${esc(trad("Qu'est-ce que je peux améliorer pour toi ?"))}</label><textarea id="${id}-a" rows="2" maxlength="2000" data-avis-q="ameliorer">${txt("ameliorer")}</textarea>
        <div class="actions"><button type="button" class="btn petit" data-avis-envoyer>${esc(trad("Envoyer"))}</button></div>
      </div>
      <span class="msg" data-avis-msg role="status" aria-live="polite"></span>
    </div>`;
  },
  /* un avis par (semaine, réponse notée) : le client peut le changer ; les entrées de la liste (et envoye_a) ne
     sont jamais touchées. Renvoie true si l'écriture part.
     v59 (Q13) : par la file (modifier), sur la base relue juste avant ; renvoie une Promise (relecture ratée : refus,
     avec le message de lecture ratée). Deux clics rapides s'enchaînent : le dernier gagne. */
  donnerAvis(C, semaine, fb, champs){
    return this.modifier(C, D => {
      if (!Array.isArray(D.avis)) D.avis = [];
      const i = D.avis.findIndex(a => a && typeof a === "object" && a.semaine === semaine && a.fb === fb);
      const a = Object.assign({}, i > -1 ? D.avis[i] : {}, champs, { semaine: semaine, fb: fb, le: new Date().toISOString() });
      if (i > -1) D.avis[i] = a; else D.avis.push(a);
      if (D.avis.length > this.maxAvis) D.avis = D.avis.slice(-this.maxAvis);
    });
  },
  brancherAvis(zone, C){
    $$("[data-avis-semaine]", zone).forEach(bloc => {
      const semaine = bloc.dataset.avisSemaine, fb = bloc.dataset.avisFb;
      const msg = bloc.querySelector("[data-avis-msg]"), triste = bloc.querySelector(".fbd-triste");
      $$("[data-smiley]", bloc).forEach(btn => btn.addEventListener("click", async () => {
        const s = btn.dataset.smiley;
        if (!(await this.donnerAvis(C, semaine, fb, { smiley: s }))) return;
        $$("[data-smiley]", bloc).forEach(x => x.setAttribute("aria-pressed", String(x === btn)));
        if (triste) triste.hidden = s !== "triste";
        if (msg) msg.textContent = trad("Merci, c'est noté.");
      }));
      const env = bloc.querySelector("[data-avis-envoyer]");
      if (env) env.addEventListener("click", async () => {
        const champs = { smiley: "triste" };
        $$("[data-avis-q]", bloc).forEach(t => { champs[t.dataset.avisQ] = t.value.trim().slice(0, 2000); });
        if ((await this.donnerAvis(C, semaine, fb, champs)) && msg) msg.textContent = trad("Merci, ton coach le verra.");
      });
    });
  },
  /* l'avis du client, vu par le coach (Préparer le call, fiche, Son suivi) : un 😞 en évidence avec ses deux
     réponses, tant qu'il n'est pas traité */
  avisCoachHTML(C, semaine, F){
    const a = this.dernierAvis(C, semaine); if (!a) return "";
    const s = this.SMILEYS.find(x => x.id === a.smiley) || this.SMILEYS[1];
    const t = typeof a.le === "string" ? new Date(a.le) : null;
    const quand = t && !isNaN(t) ? " (le " + dateFr(Regularite.iso(t)) + ")" : "";
    if (a.smiley !== "triste") return `<p class="note fbd-avis-coach" style="margin:10px 0 0">Son avis sur ta réponse : ${s.emo} ${esc(s.lbl)}${esc(quand)}</p>`;
    const traite = this.avisTraite(a, F);
    const rep = (k, lbl) => typeof a[k] === "string" && a[k].trim() ? `<p class="checkin-rep"><span class="lbl">${esc(lbl)}</span><span data-notr>${esc(a[k])}</span></p>` : "";
    return `<div class="flag${traite ? "" : " grave"} fbd-avis-coach" data-avis-triste="${traite ? "traite" : "a-traiter"}"><b>😞 ${traite ? "Ta réponse ne l'a pas aidé — tu lui as répondu depuis" : "Ta réponse ne l'a pas aidé — à traiter en priorité"}</b>${esc(quand)}${rep("deplu", "Ce qui ne lui a pas plu")}${rep("ameliorer", "Ce que tu peux améliorer pour lui")}</div>`;
  },

  /* Mon suivi, règle du dimanche : la semaine (formulaire, ou son feedback), la réponse du coach juste en dessous
     (avec le smiley), puis l'historique. En consultation (Son suivi du coach) : la même chose en lecture seule. */
  monterDimanche(idZone, C, F){
    const z = $(idZone); if (!z) return;
    const consult = !!Store.idConsulte, uid = Store.cible();
    const vuAvant = this.vu(C);
    const dessiner = (modifier) => {
      const e = this.etat(C, uid), v = e.semaine;
      const ouvert = v.etat === "ouvert" || v.etat === "en_retard";
      const semaines = this.semaines(C, F);
      const principale = ouvert ? v.debut : (semaines[0] || v.debut);
      const x = this.entree(C, principale);
      const per = { a: dateFr(v.debut), b: dateFr(v.fin) };
      let corps;
      if (!ouvert) corps = `<p class="note" style="margin:0 0 12px">${esc(trad("Prochain feedback : dimanche {d}", { d: dateFr(v.prochain) }))}</p>`;
      else if (v.etat === "en_retard") corps = `<p class="note" style="margin:0 0 14px">${esc(trad("Ton feedback de la semaine du {a} au {b} n'a pas été fait.", per) + " " + trad("Tu peux encore le faire aujourd'hui."))}</p>`;
      else corps = `<p class="note" style="margin:0 0 14px">${esc(trad("Semaine du {a} au {b}", per))}${x || consult ? "" : " · " + esc(trad("Réponds simplement, avec tes mots : ton coach te répond juste en dessous."))}</p>`;
      if (ouvert && !consult && (modifier || !x)) corps += this.formulaireDimanche(x, v);
      else if (x) corps += `<div class="fbd-semaine"><p class="note" style="margin:0 0 8px"><b>${esc(this.periode(x))}</b> · ${esc(trad("envoyé le {d}", { d: dateFr(x.envoye_le) }))}</p>${this.reponsesHTML(x)}${ouvert && !consult ? `<div class="actions"><button type="button" class="btn ghost petit" data-fbd-modifier>${esc(trad("Modifier mon feedback"))}</button></div>` : ""}</div>`;
      else if (ouvert) corps += `<div class="empty">${esc(trad("Pas encore de feedback pour cette semaine."))}</div>`;
      else if (!semaines.length) corps += `<div class="empty">${esc(trad("Ton premier feedback arrive dimanche : une note sur 10 et trois lignes."))}</div>`;
      if (x || Feedback.pour(F, principale)) corps += this.reponseHTML(C, F, principale, "p", consult);
      const pastille = e.fait ? `<span class="pastille ok">✓ ${esc(trad("envoyé"))}</span>` : v.etat === "ouvert" ? `<span class="pastille attention">${esc(trad("à faire"))}</span>` : v.etat === "en_retard" ? `<span class="pastille attention">${esc(trad("en retard"))}</span>` : "";
      z.innerHTML = `<section class="panel fbd" data-fbd-etat="${esc(v.etat)}"><div class="seance-c-tete"><h2>${esc(trad("Feedback de la semaine"))}</h2>${pastille}</div>
        ${corps}${this.historiqueDimancheHTML(C, F, principale, consult, vuAvant)}</section>`;
      const mod = z.querySelector("[data-fbd-modifier]"); if (mod) mod.addEventListener("click", () => dessiner(true));
      this.brancherDimanche(z, C, () => dessiner(false));
      if (!consult) this.brancherAvis(z, C);
    };
    dessiner(false);
  },
  /* l'historique de la règle du dimanche : chaque semaine (nouveau format ou ancien bilan) avec la réponse du coach ;
     une semaine dont la réponse n'a pas encore été vue est ouverte */
  historiqueDimancheHTML(C, F, sauf, consult, vuAvant){
    const l = this.semaines(C, F).filter(s => s !== sauf);
    if (!l.length) return "";
    return `<h3 style="margin-top:20px">${esc(trad("Mes feedbacks précédents"))}</h3>` + l.map((s, i) => {
      const x = this.entree(C, s), f = Feedback.pour(F, s), n = x ? this.note(x) : null;
      const bouts = [x ? (n != null ? trad("note {n}/10", { n: n }) : trad("envoyé le {d}", { d: dateFr(x.envoye_le) })) : trad("pas de feedback envoyé")];
      if (f) bouts.push(trad("réponse du coach"));
      const nouveau = !consult && !!f && this.nonVus({ fb_vu: vuAvant }, { liste: [f] }).length > 0;
      const per = this.periode(x || { semaine: s, fin: (f && f.fin) || Feedback.finDe(s) });
      return `<details class="hist-entree"${nouveau ? " open" : ""}><summary><b>${esc(per)}</b> <span class="hist-dates">${esc(bouts.join(" · "))}</span>${nouveau ? ` <span class="pastille accent">${esc(trad("nouveau"))}</span>` : ""}</summary>${x ? this.reponsesHTML(x) : ""}${this.reponseHTML(C, F, s, "h" + i, consult)}</details>`;
    }).join("");
  },

  /* À l'ouverture de Mon suivi (client, règle du dimanche) : une réponse du coach plus récente que fb_vu est
     maintenant affichée → fb_vu = la plus récente, UNE écriture (rien s'il n'y a rien de nouveau).
     v59 (Q13-1, Q13-3 et remarque v53 c2) : par la file (modifier, sans message), sur la base relue juste avant.
     Lecture de checkins ratée (à l'ouverture ou à la relecture) : rien n'est écrit, aucun message, et la pastille
     « Ton coach a répondu » reste ; elle ne s'éteint que quand fb_vu est écrit (sinon elle est rallumée). */
  marquerVu(C, F){
    const u = Auth.utilisateur(), uid = u && u.id;
    if (Store.idConsulte || !uid) return false;
    if (Store.nonLus.has(C) || Store.charge[uid + "|" + this.cle] === false) return false;   // lecture d'ouverture ratée : Mon suivi a l'air vide, on n'écrit rien
    if (!this.nonVus(C, F).length){ this.majBadge(uid, 0); return false; }
    const v = Feedback.liste(F).map(f => this.marque(f)).sort().pop();
    this.modifier(C, D => { if (this.vu(D) >= v) return false; D.fb_vu = v; }, { silence: true }).then(ok => {
      const moi = Auth.utilisateur(); if (!moi || moi.id !== uid) return;
      if (ok){ if (!(this._vuEcrit && this._vuEcrit.uid === uid && this._vuEcrit.v > v)) this._vuEcrit = { uid: uid, v: v }; this.majBadge(uid, 0); }   // revenir sur Mon suivi ne réécrit pas
      else this.majBadge(uid, this.nonVus(C, F).length);   // pas écrit : la pastille reste (ou revient)
    });
    return true;
  },
  /* la carte de l'accueil « Ton coach a répondu » */
  accesReponseHTML(f){
    return `<a class="acces fbd-repondu" href="#/suivi"><span class="ico">${ICONES.suivi || ICONES.bilan}</span><span class="txt"><b>${esc(trad("Ton coach a répondu"))}</b><small>${esc(trad("Semaine du {a} au {b} : sa réponse t'attend dans Mon suivi.", { a: dateFr(f.semaine), b: dateFr(f.fin || Feedback.finDe(f.semaine)) }))}</small></span><span class="fleche">›</span></a>`;
  },
  /* le badge « ton coach a répondu » : sur « Mon suivi » (barre du haut, barre du bas, volet « Plus ») et sur le
     bouton « Plus » du téléphone quand Mon suivi est derrière lui. Posé à chaque construction de la navigation. */
  _badge: null,          // { uid, n } : le dernier calcul (accueil, Mon suivi, ou lecture au démarrage)
  _badgeLecture: null,   // le compte pour lequel la lecture du démarrage est partie (une fois)
  majBadge(uid, n){ this._badge = { uid: uid, n: n || 0 }; this.badge(); },
  badge(){
    const u = Auth.utilisateur(), uid = u && u.id;
    const eligible = !!uid && Auth.connecte() && !Store.idConsulte && !Auth.estProspect() && this.regle(uid) === "dimanche";
    let n = 0;
    if (eligible && this._badge && this._badge.uid === uid) n = this._badge.n;
    else if (eligible && !Auth.estCoach() && this._badgeLecture !== uid){
      /* arrivée sur une autre page que l'accueil : une lecture (jamais d'écriture) pour savoir s'il y a du nouveau */
      this._badgeLecture = uid;
      Store.lireTout([this.cle, Feedback.cle]).then(d => {
        if (this._badge && this._badge.uid === uid) return;
        const moi = Auth.utilisateur();
        if (moi && moi.id === uid) this.majBadge(uid, this.nonVus(d[this.cle], d[Feedback.cle]).length);
      }).catch(() => {});
    }
    const surBarre = !!document.querySelector('#barre-bas a[data-id="suivi"]');
    $$('#nav a[data-id="suivi"], #barre-bas a[data-id="suivi"], .menu-plus a[data-id="suivi"]' + (surBarre ? "" : ", #barre-bas [data-plus]")).forEach(a => {
      let b = a.querySelector(".fbd-badge");
      if (n > 0){
        if (!b){ b = document.createElement("span"); b.className = "nav-badge fbd-badge"; a.appendChild(b); }
        b.textContent = n > 9 ? "9+" : String(n);
        b.setAttribute("aria-label", trad("Ton coach a répondu"));
      } else if (b) b.remove();
    });
  }
};

/* ------------------------------------------------------------------
   v38 — FEEDBACK DU COACH (phase 10) et NOTES PRIVEES (phase 18)
   Deux cles rangees chez le client mais ecrites par le coach seul :
   - feedbacks   = { liste: [{ semaine (lundi ISO), fin, date (ISO), texte, bilan? }] }
                   une entree par semaine de bilan ; « bilan » = date d'envoi du
                   bilan auquel ce feedback repond ; le client LIT cette cle ;
   - notes_coach = { texte, maj, avant? } : le client ne peut ni la lire ni
                   l'ecrire ; « avant » = la version trouvee a l'ouverture.
   C'est la base qui le garantit (policies RLS du 25/09/2026), pas l'ecran.
   Elles ne passent pas par Store.ecrire : on relit la ligne juste avant
   d'ecrire (rien d'autre n'est ecrase, et rien n'est ecrit si elle a change
   depuis l'affichage) et on n'annonce « enregistre » que si la base renvoie
   la ligne. Un refus est dit clairement, et le texte tape reste dans le champ.
   ------------------------------------------------------------------ */
const CleCoach = {
  /* une session qu'on ne peut plus renouveler n'est pas « aucune donnee » :
     on s'arrete net plutot que de lire sans jeton */
  async session(){ if (!(await Auth.assurer())) throw Object.assign(new Error("session"), { statut: 401 }); },
  /* la ligne telle qu'en base : { contenu, maj_le }, ou null */
  async ligne(uid, cle){
    await this.session();
    const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(cle) + "&select=contenu,maj_le");
    return (r && r[0]) || null;
  },
  async lire(uid, cle){ const l = await this.ligne(uid, cle); return (l && l.contenu) || null; },
  /* ecriture CONDITIONNELLE : seulement si la ligne n'a pas bouge depuis la
     lecture (meme maj_le), ou si elle n'existe toujours pas. Sinon rien n'est
     ecrit et l'erreur porte « conflit ». Renvoie la ligne enregistree. */
  async ecrireSi(uid, cle, contenu, lue){
    await this.session();
    const maj = new Date().toISOString();
    const conflit = () => Object.assign(new Error("conflit"), { conflit: true });
    const refus = () => Object.assign(new Error("refus"), { statut: 403 });
    let r;
    if (lue){
      const filtre = lue.maj_le ? "&maj_le=eq." + encodeURIComponent(lue.maj_le) : "&maj_le=is.null";
      r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(cle) + filtre, {
        method: "PATCH", headers: { "Prefer": "return=representation" }, body: { contenu: contenu, maj_le: maj }
      });
      if (!Array.isArray(r) || !r[0]){
        /* aucune ligne touchee : elle a bouge (conflit)… ou la base nous l'interdit */
        const l = await this.ligne(uid, cle);
        if (l && l.maj_le === lue.maj_le) throw refus();
        throw conflit();
      }
    } else {
      try {
        r = await Auth.appel("/rest/v1/donnees", {
          method: "POST", headers: { "Prefer": "return=representation" },
          body: [{ user_id: uid, outil: cle, contenu: contenu, maj_le: maj }]
        });
      } catch(e){
        /* 409 : la ligne existe deja (conflit)… ou le compte n'existe plus */
        if (e && e.statut === 409){ const l = await this.ligne(uid, cle); throw l ? conflit() : refus(); }
        throw e;
      }
      if (!Array.isArray(r) || !r[0]) throw refus();
    }
    return r[0];
  },
  message(e){
    if (e && (e.statut === 403 || e.statut === 409)) return "Non enregistré : la base refuse cette écriture. Ton texte est gardé.";
    if (e && e.statut === 401) return "Non enregistré : ta session a expiré. Reconnecte-toi, ton texte est gardé ici.";
    return "Non enregistré : la connexion a échoué. Ton texte est gardé, réessaie.";
  }
};

const Feedback = {
  cle: "feedbacks",
  max: 60,
  file: Promise.resolve(),   // les envois partent l'un apres l'autre
  liste(F){ return ((F && Array.isArray(F.liste)) ? F.liste : []).filter(x => x && x.semaine && x.texte); },   // v53 : liste piegee (pas un tableau) = vide
  pour(F, semaine){ return this.liste(F).find(x => x.semaine === semaine) || null; },
  /* le feedback qui REPOND a ce bilan : ecrit sous ce bilan-la, pour cette
     date d'envoi. Un mot ecrit avant que le bilan arrive (ou avant qu'il soit
     renvoye) ne compte pas : le bilan reste « a lire ». */
  repond(F, x){
    const f = x ? this.pour(F, x.semaine) : null, envoi = x ? this.envoi(x) : "";
    return (f && f.bilan && envoi && f.bilan === envoi) ? f : null;
  },
  /* l'instant d'envoi du bilan (envoye_a, depuis la v38) ; sinon son jour */
  envoi(x){ return (x && (x.envoye_a || x.envoye_le)) || ""; },
  /* du plus recent au plus ancien : la semaine, puis la date d'ecriture */
  tries(F){ return this.liste(F).slice().sort((a, b) => a.semaine !== b.semaine ? (a.semaine < b.semaine ? 1 : -1) : (String(a.date) < String(b.date) ? 1 : -1)); },
  /* le dernier ecrit ou mis a jour, s'il date de moins de 7 jours */
  recent(F){
    const d = new Date(); d.setDate(d.getDate() - 7);
    const il7 = Regularite.iso(d);
    const l = this.liste(F).filter(x => x.date && x.date >= il7).sort((a, b) => String(a.date) < String(b.date) ? 1 : -1);
    return l[0] || null;
  },
  finDe(semaine){ const d = new Date(semaine + "T12:00:00"); d.setDate(d.getDate() + 6); return Regularite.iso(d); },
  /* v53 : les champs qu'enregistrer() ecrit lui-meme ; tout autre champ d'une entree existante est recopie */
  connus: ["semaine", "fin", "date", "texte", "bilan", "ecrit_a"],
  empreinte(x){ return x ? JSON.stringify([x.date || "", x.texte || "", x.bilan || ""]) : ""; },

  /* texte vide = retirer le feedback de cette semaine. La base est relue juste
     avant : les autres semaines sont reprises telles quelles, et si celle-ci a
     change depuis l'affichage (autre onglet, autre appareil), rien n'est ecrit.
     Renvoie l'entree enregistree (null si retiree). */
  async enregistrer(uid, semaine, fin, texte, bilan, base, dejas){
    const t = String(texte || "").trim();
    const meme = (x, y) => !!(x && y && x.texte === y.texte && (x.bilan || "") === (y.bilan || ""));
    for (let essai = 1; ; essai++){
      const lue = await CleCoach.ligne(uid, this.cle);
      const actuel = lue && lue.contenu;
      const brute = (actuel && Array.isArray(actuel.liste)) ? actuel.liste : [];
      const cour = brute.find(x => x && x.semaine === semaine && x.texte) || null;
      /* deja comme on le veut (une tentative precedente est passee, sa reponse s'est perdue) */
      if (t ? meme(cour, { texte: t, bilan: bilan }) : !cour) return cour;
      /* l'entree a change depuis l'affichage, et ce n'est pas notre propre tentative : conflit */
      if (this.empreinte(cour) !== this.empreinte(base) && !(dejas || []).some(x => meme(cour, x))) throw Object.assign(new Error("conflit"), { conflit: true });
      const l = brute.filter(x => !(x && x.semaine === semaine));
      /* v53 : l'entree n'est plus reconstruite a vide : ses champs inconnus (ajoutes plus tard) sont recopies ;
         ecrit_a = l'instant de cet enregistrement (le badge du client et le « traite » d'un 😞 en dependent) */
      const precedente = brute.find(x => x && typeof x === "object" && x.semaine === semaine) || null;
      let entree = null;
      if (t){
        entree = {};
        if (precedente) Object.keys(precedente).forEach(k => { if (this.connus.indexOf(k) === -1) entree[k] = precedente[k]; });
        Object.assign(entree, { semaine: semaine, fin: fin || this.finDe(semaine), date: aujourdhui(), texte: t, ecrit_a: new Date().toISOString() });
        if (bilan) entree.bilan = bilan;
        l.push(entree);
      }
      l.sort((a, b) => String(a && a.semaine) < String(b && b.semaine) ? -1 : 1);
      try {
        await CleCoach.ecrireSi(uid, this.cle, { liste: l.slice(-this.max) }, lue);
        return entree;
      } catch(e){
        /* une autre semaine a ete ecrite entre la lecture et l'ecriture (autre
           onglet, autre appareil) : on relit et on recommence, deux fois au plus */
        if (!(e && e.conflit) || essai >= 3) throw e;
      }
    }
  },

  /* ----- cote client (et coach dans « Son suivi ») : lecture ----- */
  periode(x){ return Checkin.periode({ semaine: x.semaine, fin: x.fin || this.finDe(x.semaine) }); },
  panneauHTML(F){
    const l = this.tries(F);
    if (!l.length) return "";
    const d = l[0], reste = l.slice(1);
    return `<section class="panel fb-panneau"><div class="seance-c-tete"><h2>${esc(trad("Feedback de ton coach"))}</h2>${this.recent(F) ? `<span class="pastille accent">${esc(trad("nouveau"))}</span>` : ""}</div>
      <div class="fb-entree"><div class="fb-tete"><b>${esc(this.periode(d))}</b> <span class="hist-dates">${esc(trad("écrit le {d}", { d: dateFr(d.date) }))}</span></div><p class="fb-texte" data-notr>${esc(d.texte)}</p></div>
      ${reste.length ? `<h3 style="margin-top:20px">${esc(trad("Feedbacks précédents"))}</h3>` + reste.map(x => `<details class="hist-entree"><summary><b>${esc(this.periode(x))}</b> <span class="hist-dates">${esc(trad("écrit le {d}", { d: dateFr(x.date) }))}</span></summary><p class="fb-texte" data-notr>${esc(x.texte)}</p></details>`).join("") : ""}
    </section>`;
  },
  /* la carte de l'accueil, pour un feedback de moins de 7 jours */
  accesHTML(x){
    return `<a class="acces" href="#/suivi"><span class="ico">${ICONES.suivi || ICONES.bilan}</span><span class="txt"><b>${esc(trad("Ton feedback est disponible"))}</b><small>${esc(trad("Ton coach a répondu : {p}", { p: this.periode(x) }))}</small></span><span class="fleche">›</span></a>`;
  },

  /* ----- cote coach (« Préparer le call ») : ecriture -----
     bilan = l'entree de bilan hebdo sous laquelle s'affiche l'editeur (null pour
     une semaine sans bilan) ; ferme = feedbacks illisibles : on ne propose pas
     d'ecrire par-dessus ce qu'on n'a pas pu lire. */
  editeurHTML(semaine, fin, F, bilan, ferme){
    const f = this.pour(F, semaine);
    const avantBilan = !!(f && bilan && !(f.bilan && f.bilan === this.envoi(bilan)));
    const etat = !f ? "— pas encore envoyé" : avantBilan ? "— écrit le " + dateFr(f.date) + ", avant ce bilan : relis-le et renvoie-le" : "— envoyé le " + dateFr(f.date);
    return `<div class="fb-editeur" data-fb-semaine="${esc(semaine)}" data-fb-fin="${esc(fin || "")}" data-fb-bilan="${esc(bilan ? this.envoi(bilan) : "")}">
      <label>Ton feedback pour cette semaine <span class="fb-etat">${esc(etat)}</span></label>
      <textarea rows="3"${ferme ? " disabled" : ""} placeholder="Ce qui va bien, ce qu'on ajuste, l'objectif de la semaine qui vient…">${esc(f ? f.texte : "")}</textarea>
      <div class="actions"><button type="button" class="btn petit" data-fb-enregistrer${ferme ? " disabled" : ""}>${f ? "Mettre à jour le feedback" : "Envoyer le feedback"}</button><span class="msg" data-fb-msg></span></div>
    </div>`;
  },
  brancher(zone, uid, F){
    $$("[data-fb-semaine]", zone).forEach(bloc => {
      const btn = bloc.querySelector("[data-fb-enregistrer]"), ta = bloc.querySelector("textarea");
      const msg = bloc.querySelector("[data-fb-msg]"), etat = bloc.querySelector(".fb-etat");
      let base = this.pour(F, bloc.dataset.fbSemaine);   // ce que l'editeur a affiche
      let dejas = [];   // les tentatives sans reponse depuis le dernier succes (elles ont pu passer)
      btn.addEventListener("click", async () => {
        const texte = ta.value;
        msg.classList.remove("ko"); msg.textContent = "";
        if (!texte.trim()){
          if (!base){ msg.textContent = "Écris d'abord ton feedback."; return; }
          if (!(await UI.confirmer("Retirer le feedback de cette semaine ? Ton client ne le verra plus.", { titre: "Retirer le feedback", ok: "Oui, retirer", danger: true }))) return;
        }
        btn.disabled = true; msg.textContent = "Enregistrement…";
        const tentative = { texte: texte.trim(), bilan: bloc.dataset.fbBilan || "" };
        const tache = this.file.then(() => this.enregistrer(uid, bloc.dataset.fbSemaine, bloc.dataset.fbFin, texte, bloc.dataset.fbBilan, base, dejas));
        this.file = tache.catch(() => {});
        try {
          const entree = await tache;
          base = entree; dejas = [];
          etat.textContent = entree ? "— envoyé le " + dateFr(entree.date) : "— pas encore envoyé";
          btn.textContent = entree ? "Mettre à jour le feedback" : "Envoyer le feedback";
          msg.textContent = entree ? "Feedback enregistré : ton client le voit dans « Mon suivi »." : "Feedback retiré.";
        } catch(e){
          if (!(e && e.conflit) && tentative.texte) dejas.push(tentative);
          msg.classList.add("ko");
          msg.textContent = (e && e.conflit) ? "Ce feedback a changé entre-temps (autre onglet ou appareil) : recharge la page avant d'écrire. Ton texte est gardé ici." : CleCoach.message(e);
        }
        btn.disabled = false;
      });
    });
  }
};

/* Notes privees du coach, dans la fiche : enregistrees toutes seules une
   seconde apres la derniere frappe (et tout de suite en quittant la fiche).
   Si la lecture echoue, le champ reste ferme. Chaque ecriture est
   conditionnelle : si les notes ont change ailleurs, rien n'est ecrase et les
   deux versions sont gardees. */
const NotesCoach = {
  cle: "notes_coach",
  html(){
    return `<section class="panel notes-coach"><div class="seance-c-tete"><h2>Notes privées</h2><span class="pastille">jamais visibles par le client</span></div>
      <textarea id="nc-texte" rows="5" disabled placeholder="Contexte, points à suivre, ce qui s'est dit en call… Ton client ne voit jamais ces notes."></textarea>
      <p class="note" style="margin:8px 0 0" id="nc-etat">Chargement…</p></section>`;
  },
  /* renvoie la fonction a appeler en quittant la fiche */
  monter(uid){
    const ta = $("nc-texte"), etat = $("nc-etat");
    if (!ta || !etat || !uid) return () => {};
    let minuterie = null, enCours = false, encore = false, lu = false, bloque = false;
    let dernier = "", ligneLue = null, avant = null;
    let envois = [];   // « maj » des ecritures dont la reponse n'est pas revenue (elles ont pu passer)
    const quand = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
    const dire = (t, ko) => { etat.classList.toggle("ko", !!ko); etat.textContent = t; };
    /* ecrit le texte du champ, par ecriture conditionnelle. Sur un conflit : si
       c'etait notre propre ecriture (reponse perdue), on la reprend ; si les
       notes ont vraiment change ailleurs, on garde LES DEUX versions (la notre
       a la suite, datee) : aucune frappe n'est jamais jetee. */
    const envoyer = async () => {
      let fusion = false;
      for (let essai = 1; essai <= 3; essai++){
        const texte = ta.value;
        const contenu = { texte: texte, maj: new Date().toISOString() };
        if (avant) contenu.avant = avant;
        envois.push(contenu.maj);
        try {
          const r = await CleCoach.ecrireSi(uid, this.cle, contenu, ligneLue);
          ligneLue = { maj_le: r.maj_le }; dernier = texte; envois = [];
          dire((fusion ? "Ces notes avaient changé ailleurs : les deux versions sont gardées, la tienne à la suite. " : "") + "Enregistré · " + quand(contenu.maj));
          return;
        } catch(e){ if (!(e && e.conflit)) throw e; }
        const l = await CleCoach.ligne(uid, this.cle);
        const c = (l && l.contenu) || {};
        const distant = typeof c.texte === "string" ? c.texte : "";
        ligneLue = l ? { maj_le: l.maj_le } : null;
        if (c.maj && envois.indexOf(c.maj) > -1){
          /* notre propre ecriture etait passee : on repart d'elle */
          dernier = distant; envois = [];
          if (ta.value === dernier){ dire("Enregistré · " + quand(c.maj)); return; }
          continue;
        }
        const local = ta.value;
        const ajout = (local.indexOf(dernier) === 0 ? local.slice(dernier.length) : local).trim();
        dernier = distant; fusion = true;
        ta.value = ajout ? distant + (distant ? "\n\n" : "") + "— ajouté depuis un autre onglet ou appareil, le " + quand(new Date().toISOString()) + " —\n" + ajout : distant;
        if (ta.value === dernier){ dire("Ces notes avaient changé ailleurs : la dernière version est affichée."); return; }
      }
      bloque = true; ta.readOnly = true;
      dire("Tes notes changent ailleurs en même temps : copie ton texte ci-dessus, puis rouvre la fiche.", true);
    };
    const sauver = async () => {
      minuterie = null;
      if (!lu || bloque) return;
      if (enCours){ encore = true; return; }
      if (ta.value === dernier) return;
      enCours = true; dire("Enregistrement…");
      try { await envoyer(); } catch(e){ dire(CleCoach.message(e), true); }
      enCours = false;
      if (encore && !bloque){ encore = false; sauver(); }
    };
    /* en quittant la fiche (ou le champ) : ce qui attend part tout de suite,
       y compris un texte dont le dernier enregistrement a echoue */
    const maintenant = () => { if (minuterie || (lu && !bloque && ta.value !== dernier)){ clearTimeout(minuterie); sauver(); } };
    CleCoach.ligne(uid, this.cle).then(l => {
      const c = l && l.contenu;
      lu = true; ligneLue = l ? { maj_le: l.maj_le } : null;
      dernier = (c && typeof c.texte === "string") ? c.texte : "";
      /* la version trouvee a l'ouverture est gardee a cote : un effacement
         par erreur pendant cette seance se rattrape */
      avant = dernier ? { texte: dernier, maj: (c && c.maj) || null } : ((c && c.avant) || null);
      ta.value = dernier; ta.disabled = false;
      dire((c && c.maj) ? "Dernière modification : " + quand(c.maj) : "Enregistrement automatique.");
    }).catch(() => dire("Tes notes n'ont pas pu être lues : rouvre la fiche pour réessayer. Rien n'a été modifié.", true));
    ta.addEventListener("input", () => { if (bloque) return; clearTimeout(minuterie); dire("Modifié…"); minuterie = setTimeout(sauver, 1000); });
    ta.addEventListener("blur", maintenant);
    return maintenant;
  }
};

/* ------------------------------------------------------------------
   OUTIL — Mon suivi (v35). « Comment se passe mon accompagnement ? » :
   la regularite et son evolution, les objectifs du mois (a cocher), et le
   bilan des quatre dernieres semaines. Il reutilise Regularite.monterClient
   et outilBilan tels quels ; les phases 9 et 10 y ajouteront le bilan
   hebdomadaire et le feedback du coach. Le coach le voit en fiche client.
   ------------------------------------------------------------------ */
const outilSuivi = {
  id: "suivi",
  cle: null,
  nom: "Mon suivi",
  icone: "📊",
  titre: "Ton suivi",
  accroche: "Comment se passe ton accompagnement : ta régularité, tes objectifs du mois et ton bilan des quatre dernières semaines.",

  html(){ return `<div id="suivi-fb-haut"></div><div id="suivi-checkin"></div><div id="suivi-fb-bas"></div><div id="suivi-reg"><section class="panel"><div class="empty">Chargement…</div></section></div><div id="suivi-bilan"></div>`; },

  async init(){
    const d = await Store.lireTout(["programme", "journal", "repas", "repas_suivi", "mens", "objectifs_faits", "intake", "checkins", "feedbacks"]);
    const P = d.programme || {}, J = d.journal || { seances: [] };
    if (!Array.isArray(J.seances)) J.seances = [];
    /* le bilan hebdo : la cle est lue ici, mais on la re-lit par Store.lire
       pour que l'ecriture soit autorisee (drapeau de lecture) */
    const C = await Store.lire(Checkin.cle, Checkin.vide());
    if (!Array.isArray(C.liste)) C.liste = [];
    if (Checkin.regle(Store.cible()) === "dimanche"){
      /* v53 (chantier 3) — feedback du dimanche : la reponse du coach s'affiche sous chaque semaine (pas de
         panneau a part) ; une reponse pas encore vue l'est maintenant : fb_vu (une ecriture, client seulement) */
      Checkin.monterDimanche("suivi-checkin", C, d.feedbacks);
      if (!Store.idConsulte) Checkin.marquerVu(C, d.feedbacks);
    } else {
      Checkin.monter("suivi-checkin", C);
      /* v38 — le feedback du coach : en tete s'il date de la semaine, sinon sous le bilan */
      const fb = Feedback.panneauHTML(d.feedbacks);
      const zf = $(Feedback.recent(d.feedbacks) ? "suivi-fb-haut" : "suivi-fb-bas");
      if (zf && fb) zf.innerHTML = fb;
    }
    await Regularite.monterClient("suivi-reg", P, J, d);
    const zb = $("suivi-bilan"); if (!zb) return;
    const b = outilBilan.calculer({ programme: P, journal: J, repas: d.repas || {}, repas_suivi: d.repas_suivi || {}, mens: d.mens || {}, objectifs_faits: d.objectifs_faits || {} });
    zb.innerHTML = `<div class="suivi-sep"><h2 style="margin:0">${esc(trad("Ton bilan du mois"))}</h2><p class="note" style="margin:4px 0 0">${esc(outilBilan.accroche)}</p></div>` + outilBilan.vue(b, false, (d.intake && d.intake.objectif) || "");
  }
};

