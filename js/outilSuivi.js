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
  vide(){ return { liste: [] }; },
  questions(){ return (CONFIG.bilan && CONFIG.bilan.questions) || []; },

  /* La semaine visee : des le jour d'ouverture (vendredi par defaut), la
     semaine en cours ; avant, la semaine passee, encore ouverte. */
  semaineVisee(){
    const jour = (new Date().getDay() + 6) % 7 + 1;
    const ouverture = (CONFIG.bilan && CONFIG.bilan.jour_ouverture) || 5;
    const b = Regularite.bornes(jour >= ouverture ? 0 : -1);
    return { debut: b.debut, fin: b.fin };
  },
  entree(C, debut){ return ((C && C.liste) || []).find(x => x.semaine === debut) || null; },
  etat(C){ const v = this.semaineVisee(); const e = this.entree(C, v.debut); return { semaine: v, entree: e, fait: !!e }; },
  periode(x){ return trad("Semaine du {a} au {b}", { a: dateFr(x.semaine), b: dateFr(x.fin || x.semaine) }); },

  champ(q, v){
    const val = v == null ? "" : v;
    if (q.type === "echelle5") return `<div class="seg echelle5" data-q="${esc(q.id)}" role="group" aria-label="${esc(q.label)}">${[1,2,3,4,5].map(n => `<button type="button" data-v="${n}" aria-pressed="${String(val) === String(n)}">${n}</button>`).join("")}</div>`;
    if (q.type === "nombre") return `<input type="number" min="0" max="30" step="1" inputmode="numeric" data-q="${esc(q.id)}" value="${esc(val)}">`;
    if (q.type === "select") return `<select data-q="${esc(q.id)}"><option value="">— choisis —</option>${(q.options || []).map(o => `<option value="${esc(o)}"${val === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    return `<textarea rows="2" data-q="${esc(q.id)}">${esc(val)}</textarea>`;
  },

  formulaire(C, entree){
    const r = (entree && entree.reponses) || {};
    return `<form class="checkin-form" data-checkin>
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

  /* branche un formulaire deja rendu ; apres(entree) est appele une fois enregistre */
  brancher(zone, C, apres){
    const form = zone.querySelector("[data-checkin]"); if (!form) return;
    $$(".echelle5 button", form).forEach(b => b.addEventListener("click", () => {
      $$("button", b.parentNode).forEach(x => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
    }));
    const annuler = form.querySelector("[data-checkin-annuler]");
    if (annuler) annuler.addEventListener("click", () => { if (typeof apres === "function") apres(null); });
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const rep = this.lire(form);
      const echelles = this.questions().filter(q => q.type === "echelle5");
      const manque = echelles.filter(q => rep[q.id] == null);
      if (manque.length){ const m = form.querySelector("[data-checkin-msg]"); if (m){ m.textContent = trad("Il manque : {l}", { l: manque.map(q => q.label).join(", ") }); setTimeout(() => { m.textContent = ""; }, 3200); } return; }
      const v = this.semaineVisee();
      if (!Array.isArray(C.liste)) C.liste = [];
      C.liste = C.liste.filter(x => x.semaine !== v.debut);
      const entree = { semaine: v.debut, fin: v.fin, envoye_le: aujourdhui(), envoye_a: new Date().toISOString(), reponses: rep };
      C.liste.push(entree);
      C.liste.sort((a, b) => a.semaine < b.semaine ? -1 : 1);
      if (C.liste.length > this.max) C.liste = C.liste.slice(-this.max);
      if (Store.ecrire(this.cle, C) === false) return;   // refusee (message deja affiche)
      UI.toast(trad("Bilan envoyé. Ton coach le lira avant votre prochain échange."), "ok");
      if (typeof apres === "function") apres(entree);
    });
  },

  /* les reponses d'une entree, en lecture */
  reponsesHTML(x){
    const r = x.reponses || {};
    const echelles = this.questions().filter(q => q.type === "echelle5" && r[q.id] != null);
    const textes = this.questions().filter(q => q.type !== "echelle5" && r[q.id] != null && r[q.id] !== "");
    return `${echelles.length ? `<div class="checkin-echelles">${echelles.map(q => `<span class="pastille"><span data-notr>${esc(q.label)}</span> <b>${esc(r[q.id])}</b>/5</span>`).join("")}</div>` : ""}
      ${textes.map(q => `<p class="checkin-rep"><span class="lbl">${esc(q.label)}</span>${esc(String(r[q.id]))}</p>`).join("")}`;
  },

  /* le bloc « statut » : disponible / envoye, pour Mon suivi et l'accueil */
  statutHTML(C, opts){
    opts = opts || {};
    const e = this.etat(C);
    if (e.fait){
      return `<div class="acces fait${opts.lien ? "" : " statique"}"${opts.lien ? ` href="${opts.lien}"` : ""}><span class="ico">${ICONES.bilan}</span><span class="txt"><b>${esc(trad("Bilan de la semaine envoyé"))}</b><small>${esc(trad("le {d} — merci, ton coach le lit avant votre prochain échange", { d: dateFr(e.entree.envoye_le) }))}</small></span>${opts.lien ? `<span class="fleche">›</span>` : ""}</div>`;
    }
    return `<a class="acces attention" href="${opts.lien || "#/suivi"}"><span class="ico">${ICONES.bilan}</span><span class="txt"><b>${esc(trad("Ton bilan de la semaine est disponible"))}</b><small>${esc(trad("5 minutes, avant dimanche soir : c'est ce qui permet à ton coach d'ajuster"))}</small></span><span class="fleche">›</span></a>`;
  },

  /* l'historique, du plus recent au plus ancien */
  historiqueHTML(C, sauf){
    const l = ((C && C.liste) || []).filter(x => x.semaine !== sauf).slice().reverse();
    if (!l.length) return "";
    return `<h3 style="margin-top:20px">${esc(trad("Mes bilans précédents"))}</h3>` + l.map(x => `<details class="hist-entree"><summary><b>${esc(this.periode(x))}</b> <span class="hist-dates">${esc(trad("envoyé le {d}", { d: dateFr(x.envoye_le) }))}</span></summary>${this.reponsesHTML(x)}</details>`).join("");
  },

  /* Mon suivi : le panneau complet (client : formulaire ; coach : lecture) */
  monter(idZone, C){
    const z = $(idZone); if (!z) return;
    const consult = !!Store.idConsulte;
    const dessiner = (ouvert) => {
      const e = this.etat(C);
      let corps = "";
      if (consult){
        corps = e.fait ? `<p class="note" style="margin:0 0 10px">${esc(this.periode(e.entree))} · ${esc(trad("envoyé le {d}", { d: dateFr(e.entree.envoye_le) }))}</p>${this.reponsesHTML(e.entree)}`
                       : `<div class="empty">${esc(trad("Pas encore de bilan pour cette semaine."))}</div>`;
      } else if (ouvert || !e.fait){
        corps = `<p class="note" style="margin:0 0 14px">${esc(trad("Semaine du {a} au {b}", { a: dateFr(e.semaine.debut), b: dateFr(e.semaine.fin) }))} · ${esc(trad("Réponds simplement, avec tes mots. Rien n'est noté : ça sert à ajuster ton suivi."))}</p>` + this.formulaire(C, e.entree);
      } else {
        corps = this.statutHTML(C, {}) + `<div style="margin-top:12px">${this.reponsesHTML(e.entree)}</div><div class="actions"><button type="button" class="btn ghost petit" data-checkin-modifier>${esc(trad("Modifier mon bilan"))}</button></div>`;
      }
      z.innerHTML = `<section class="panel"><div class="seance-c-tete"><h2>${esc(trad("Bilan hebdomadaire"))}</h2>${e.fait ? `<span class="pastille ok">✓ ${esc(trad("envoyé"))}</span>` : `<span class="pastille attention">${esc(trad("disponible"))}</span>`}</div>
        ${corps}${this.historiqueHTML(C, e.entree ? e.entree.semaine : null)}</section>`;
      const mod = z.querySelector("[data-checkin-modifier]"); if (mod) mod.addEventListener("click", () => dessiner(true));
      this.brancher(z, C, () => dessiner(false));
    };
    dessiner(false);
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
  liste(F){ return ((F && F.liste) || []).filter(x => x && x.semaine && x.texte); },
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
      let entree = null;
      if (t){
        entree = { semaine: semaine, fin: fin || this.finDe(semaine), date: aujourdhui(), texte: t };
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
    Checkin.monter("suivi-checkin", C);
    /* v38 — le feedback du coach : en tete s'il date de la semaine, sinon sous le bilan */
    const fb = Feedback.panneauHTML(d.feedbacks);
    const zf = $(Feedback.recent(d.feedbacks) ? "suivi-fb-haut" : "suivi-fb-bas");
    if (zf && fb) zf.innerHTML = fb;
    await Regularite.monterClient("suivi-reg", P, J, d);
    const zb = $("suivi-bilan"); if (!zb) return;
    const b = outilBilan.calculer({ programme: P, journal: J, repas: d.repas || {}, repas_suivi: d.repas_suivi || {}, mens: d.mens || {}, objectifs_faits: d.objectifs_faits || {} });
    zb.innerHTML = `<div class="suivi-sep"><h2 style="margin:0">${esc(trad("Ton bilan du mois"))}</h2><p class="note" style="margin:4px 0 0">${esc(outilBilan.accroche)}</p></div>` + outilBilan.vue(b, false, (d.intake && d.intake.objectif) || "");
  }
};

