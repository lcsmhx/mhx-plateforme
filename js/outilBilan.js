/* ------------------------------------------------------------------
   OUTIL — Le bilan du mois (les 28 derniers jours).
   Cote client : ce qu'il a fait et ce qui a bouge, noir sur blanc.
   Cote coach : la meme chose, plus les points a aborder pendant le call,
   tires des donnees. Cet outil ne fait que lire : il n'ecrit rien.
   ------------------------------------------------------------------ */
const outilBilan = {
  id: "bilan",
  cle: null,
  nom: "Mon bilan",
  masque_nav: true,      // v35 : vit dans « Mon suivi » ; le coach y accede par « Préparer le call »
  icone: "📊",
  titre: "Ton bilan du mois",
  accroche: "Tes quatre dernières semaines en un coup d'œil : ce que tu as fait, ce qui a bougé et ce qu'on travaille ensuite.",
  jours: 28,

  html(){ return `<div id="bilan-vue"><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  ok(v){ return v !== null && v !== undefined && v !== "" && isFinite(v); },

  /* premiere valeur de la periode (ou la derniere juste avant) contre la derniere */
  ecart(mesures, lire, debut){
    const l = (mesures || []).filter(m => m.date && this.ok(lire(m))).sort((a, b) => a.date < b.date ? -1 : 1);
    if (l.length < 2) return null;
    const fin = l[l.length - 1];
    if (fin.date < debut) return null;
    let ref = null;
    l.forEach(m => { if (m.date <= debut) ref = m; });
    if (!ref) ref = l[0];
    if (ref === fin) return null;
    return { de: +lire(ref), a: +lire(fin), delta: +lire(fin) - +lire(ref),
             jours: Math.round((new Date(fin.date) - new Date(ref.date)) / 86400000) };
  },

  charges(J, debut){
    const par = {};
    (J.seances || []).filter(s => s.date >= debut).sort((a, b) => a.date < b.date ? -1 : 1).forEach(s => (s.exos || []).forEach(e => {
      const k = Normaliser.aplatir(e.nom || ""); if (!k) return;
      const kg = Math.max(0, ...(e.series || []).map(x => num(x.c)));
      (par[k] = par[k] || { nom: e.nom, pts: [] }).pts.push(kg);
    }));
    return Object.values(par).filter(x => x.pts.length >= 2 && x.pts.some(v => v > 0)).map(x => {
      const der = x.pts.slice(-3);
      return { nom: x.nom, de: x.pts[0], a: x.pts[x.pts.length - 1], n: x.pts.length,
               stable: x.pts.length >= 3 && der.every(v => v === der[0]) && der[0] > 0 };
    }).sort((p, q) => (q.a - q.de) - (p.a - p.de));
  },

  calculer(c){
    const auj = new Date(); auj.setHours(12, 0, 0, 0);
    const d0 = new Date(auj); d0.setDate(auj.getDate() - (this.jours - 1));
    const debut = Regularite.iso(d0), fin = Regularite.iso(auj);
    const P = c.programme || {}, J = c.journal || {}, R = c.repas || {}, S = c.repas_suivi || {}, M = c.mens || {};
    const b = {};
    b.periode = { debut, fin };
    b.semaines = [-4, -3, -2, -1].map(k => Regularite.calculer(c, k).score);
    b.enCours = Regularite.calculer(c, 0).score;
    const pleines = b.semaines.filter(v => v != null);
    b.regMoy = pleines.length ? Math.round(pleines.reduce((a, v) => a + v, 0) / pleines.length) : null;
    const nb = Math.min(7, (P.seances || []).filter(sc => (sc.exercices || []).some(e => e.nom)).length);
    b.seances = { faites: new Set((J.seances || []).filter(x => x.date >= debut && x.date <= fin).map(x => x.date + "|" + x.si)).size,
                  attendues: nb * 4 };
    const mes = M.mesures || [];
    b.poids = this.ecart(mes, m => m.poids, debut);
    const zones = M.zones || [];
    b.zones = [];
    zones.forEach((z, i) => {
      if (!/taille|ventre|hanche/i.test(z)) return;
      const e = this.ecart(mes, m => (m.vals || {})[i], debut);
      if (e) b.zones.push(Object.assign({ nom: z }, e));
    });
    b.compo = [];
    (CONFIG.mensurations.composition || []).filter(x => x.id === "mg" || x.id === "mm").forEach(x => {
      const e = this.ecart(mes, m => (m.compo || {})[x.id], debut);
      if (e) b.compo.push(Object.assign({ nom: x.nom, unite: x.unite, sens: x.sens }, e));
    });
    const derniere = mes.filter(m => m.date).map(m => m.date).sort().pop() || null;
    b.joursSansMesure = derniere ? Math.round((auj - new Date(derniere + "T12:00:00")) / 86400000) : null;
    const hist = S.hist || {}, debutHist = Object.keys(hist).sort()[0];
    if (debutHist && (R.jours || []).some(j => (j.repas || []).length)){
      let co = 0, pr = 0;
      for (const d = new Date(d0); d <= auj; d.setDate(d.getDate() + 1)){
        const iso = Regularite.iso(d); if (iso < debutHist) continue;
        const p = Regularite.prevusLe(R, iso); pr += p; co += Math.min(p, (hist[iso] && hist[iso].c) || 0);
      }
      b.repas = pr ? Math.round(co / pr * 100) : null;
    } else b.repas = null;
    b.remplaces = [];
    (R.jours || []).forEach(j => (j.repas || []).forEach(x => { if (x.change_client && x.change_client >= debut) b.remplaces.push(x.moment_nom || x.nom); }));
    b.charges = this.charges(J, debut);
    b.objectifs = (P.objectifs && (P.objectifs.liste || []).some(Boolean)) ? P.objectifs : null;
    b.faits = (c.objectifs_faits && c.objectifs_faits.mois === (b.objectifs && b.objectifs.mois)) ? (c.objectifs_faits.faits || []) : [];
    b.statuts = b.objectifs ? b.objectifs.liste.map((t, i) => t ? Regularite.statutObjectif(P, c.objectifs_faits || {}, i) : "") : [];
    b.vide = !mes.length && !(J.seances || []).length && b.repas == null;
    return b;
  },

  /* Les points a aborder : des regles simples, qu'un coach appliquerait
     en relisant la fiche. Elles orientent le call, elles ne le remplacent pas. */
  points(b, objectif){
    const out = [];
    const perte = /perte|s[èe]che/i.test(objectif || ""), prise = /prise|masse/i.test(objectif || "");
    const s1 = b.semaines[3], s4 = b.semaines.find(v => v != null);
    if (s1 != null && s1 < 40) out.push(`Régularité faible la semaine dernière (${s1}/100) : demande ce qui bloque, sans reproche.`);
    else if (s1 != null && s4 != null && s4 - s1 >= 15) out.push(`Régularité en baisse (${s4} → ${s1}/100) : repère ce qui a changé dans son quotidien.`);
    else if (b.regMoy != null && b.regMoy >= 70) out.push(`Excellente régularité ce mois-ci (${b.regMoy}/100 en moyenne) : dis-le, c'est ce qui fait durer.`);
    if (b.seances.attendues && b.seances.faites < b.seances.attendues / 2)
      out.push(`Seulement ${b.seances.faites} séances notées sur ${b.seances.attendues} prévues : programme trop ambitieux, ou séances faites sans être notées ?`);
    if (b.joursSansMesure == null) out.push("Aucune mesure enregistrée : demande une pesée par semaine, toujours dans les mêmes conditions.");
    else if (b.joursSansMesure > 10) out.push(`Pas de mesure depuis ${b.joursSansMesure} jours : rappelle la pesée de la semaine.`);
    if (b.poids){
      const d = b.poids.delta, t = (d > 0 ? "+" : "") + n1(d) + " kg";
      if ((perte && d <= -0.5) || (prise && d >= 0.5)) out.push(`Poids : ${t} sur ${b.poids.jours} jours, dans le bon sens : c'est le moment de féliciter.`);
      else if ((perte || prise) && Math.abs(d) < 0.3) out.push(`Poids stable sur ${b.poids.jours} jours : vérifie d'abord les repas cochés et les écarts avant de toucher aux calories.`);
      else if ((perte && d > 0.3) || (prise && d < -0.3)) out.push(`Poids : ${t} sur ${b.poids.jours} jours, à l'inverse de son objectif : regarde la régularité et les repas avant de conclure.`);
    }
    b.zones.filter(z => z.delta <= -1).forEach(z => out.push(`${z.nom} : ${n1(z.delta)} cm — un bon argument si la balance ne suit pas.`));
    b.charges.filter(x => x.stable).slice(0, 3).forEach(x => out.push(`${x.nom} : même charge (${Journal.kg(x.a)} kg) sur les 3 dernières séances — regarde ses répétitions avant de changer quoi que ce soit.`));
    if (b.remplaces.length >= 3) out.push(`A remplacé ${b.remplaces.length} repas ce mois-ci : ajuste la diète à ses goûts.`);
    if (b.objectifs){
      const n = (b.objectifs.liste || []).filter(Boolean).length, f = b.statuts.filter(x => x === "atteint").length, r = b.statuts.filter(x => x === "non_atteint").length;
      out.push(`Objectifs du mois : ${f} sur ${n} atteints${r ? `, ${r} non atteint${r > 1 ? "s" : ""}` : ""}. Fais le point, pose les statuts, puis écris ceux du mois prochain.`);
    } else out.push("Pas d'objectifs ce mois-ci : écris-en 3 juste après le call.");
    return out;
  },

  vue(b, coach, objectif){
    const perte = /perte|s[èe]che/i.test(objectif || "") ? -1 : /prise|masse/i.test(objectif || "") ? 1 : 0;
    const cls = (delta, sens) => !sens ? "" : (delta * sens > 0.2 ? "pos" : delta * sens < -0.2 ? "neg" : "");
    const signe = (v, u) => (v > 0 ? "+" : v < 0 ? "−" : "") + n1(Math.abs(v)) + " " + u;
    let h = "";
    if (coach){
      h += `<section class="panel"><h2>Points à aborder pendant le call</h2>
        <ul class="obj-l">${this.points(b, objectif).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        <div class="actions"><a class="btn ghost" href="#/programme">Écrire les objectifs du mois</a></div>
      </section>`;
    }
    if (b.vide){
      return h + `<section class="panel"><div class="empty">Pas encore assez de données. Le bilan se remplit au fil des séances notées, des repas cochés et des mesures.</div></section>`;
    }
    h += `<section class="panel"><h2>Les 4 dernières semaines</h2>
      <p class="note" style="margin:-6px 0 14px">${esc(trad("Du {de} au {a}", { de: dateFr(b.periode.debut), a: dateFr(b.periode.fin) }))}</p>
      <div class="tiles">
        <div class="tile"><div class="t-lbl">Régularité moyenne</div><div class="t-val readout ${Regularite.niveau(b.regMoy)}">${b.regMoy == null ? "—" : b.regMoy}<small>/100</small></div><div class="t-sub">4 semaines complètes</div></div>
        ${b.seances.attendues ? `<div class="tile"><div class="t-lbl">Séances notées</div><div class="t-val readout">${b.seances.faites}/${b.seances.attendues}</div><div class="t-sub">sur 28 jours</div></div>` : ""}
        <div class="tile"><div class="t-lbl">Poids</div><div class="t-val readout ${b.poids ? cls(b.poids.delta, perte) : ""}">${b.poids ? signe(b.poids.delta, "kg") : "—"}</div><div class="t-sub">${b.poids ? esc(trad("{de} → {a} kg", { de: n1(b.poids.de), a: n1(b.poids.a) })) : "pas assez de mesures"}</div></div>
        ${b.repas != null ? `<div class="tile"><div class="t-lbl">Repas cochés</div><div class="t-val readout">${b.repas} %</div><div class="t-sub">des repas prévus</div></div>` : ""}
      </div>
      <p class="note" style="margin:14px 0 0">${esc(trad("Régularité semaine par semaine : {l}", { l: b.semaines.map(v => v == null ? "—" : v).join(" · ") + (b.enCours != null ? " · " + trad("en cours {n}", { n: b.enCours }) : "") }))}</p>
    </section>`;
    const lignes = b.zones.map(z => ({ nom: z.nom, de: z.de, a: z.a, delta: z.delta, u: "cm", sens: perte }))
      .concat(b.compo.map(x => ({ nom: x.nom, de: x.de, a: x.a, delta: x.delta, u: x.unite, sens: x.sens })));
    if (lignes.length){
      h += `<section class="panel"><h2>Ce qui a bougé</h2><ul class="ingr">${lignes.map(l =>
        `<li><span>${esc(l.nom)}</span><b><span class="${cls(l.delta, l.sens)}">${n1(l.de)} → ${n1(l.a)} ${esc(l.u)} (${signe(l.delta, l.u)})</span></b></li>`).join("")}</ul></section>`;
    }
    if (b.charges.length){
      h += `<section class="panel"><h2>Progression des charges</h2><div class="scroll"><table><thead><tr><th>Exercice</th><th>Début du mois</th><th>Maintenant</th><th>Séances</th></tr></thead><tbody>${
        b.charges.slice(0, 8).map(x => `<tr><td>${esc(x.nom)}</td><td>${x.de ? Journal.kg(x.de) + " kg" : "—"}</td><td><b class="${x.a > x.de ? "pos" : ""}">${x.a ? Journal.kg(x.a) + " kg" : "—"}</b></td><td>${x.n}</td></tr>`).join("")
      }</tbody></table></div></section>`;
    }
    if (b.objectifs){
      h += `<section class="panel"><h2>Objectifs du mois</h2>${b.objectifs.liste.map((t, i) => t ? `<div class="objectif${b.statuts[i] === "atteint" ? " atteint" : ""}${b.statuts[i] === "non_atteint" ? " rate" : ""}"><span class="num">0${i + 1}</span><span class="texte" data-notr>${esc(t)}</span><span class="pastille ${Regularite.classeStatut(b.statuts[i])}">${esc(Regularite.libelleStatut(b.statuts[i]))}</span></div>` : "").join("")}</section>`;
    }
    return h;
  },

  async init(){
    const zone = $("bilan-vue"); if (!zone) return;
    const coach = Auth.estCoach() && !!Store.idConsulte;
    const [programme, journal, repas, repas_suivi, mens, objectifs_faits, intake, checkins] = await Promise.all([
      Store.lire("programme", {}), Store.lire("journal", { seances: [] }), Store.lire("repas", {}),
      Store.lire("repas_suivi", {}), Store.lire("mens", {}), Store.lire("objectifs_faits", {}), Store.lire("intake", {}),
      Store.lire(Checkin.cle, Checkin.vide())
    ]);
    const b = this.calculer({ programme, journal, repas, repas_suivi, mens, objectifs_faits });
    zone.innerHTML = this.vue(b, coach, (intake && intake.objectif) || "");
    /* v36 — ce que le client a ecrit dans ses bilans hebdo : a lire avant le call.
       v38 — et, sous chaque bilan, le feedback du coach (cle feedbacks). La
       semaine en cours a aussi son editeur tant qu'elle n'a pas de bilan. */
    if (coach){
      const uid = Store.idConsulte;
      let F = null, lu = true;
      try { F = await CleCoach.lire(uid, Feedback.cle); } catch(e){ lu = false; }
      if (!zone.isConnected || Store.idConsulte !== uid) return;   // on a change de page entre-temps
      /* v53 (chantier 3) : la regle de CE client (bilan du vendredi, ou feedback du dimanche) ; les entrees se lisent
         selon leur format (Checkin.reponsesHTML), les smileys du client sous chacune, un 😞 non traite en evidence
         (et remonte meme s'il n'est plus dans les 4 derniers) ; le coach repond juste en dessous, au meme endroit */
      const l = Checkin.liste(checkins).slice(-4).reverse();
      const v = Checkin.semaineVisee(checkins, uid), dim = v.regle === "dimanche";
      const tristes = Checkin.avisTristes(checkins, F).map(a => a.semaine);
      const enPlus = tristes.filter((s, i) => tristes.indexOf(s) === i && !l.some(x => x.semaine === s));
      const sansBilan = !l.some(x => x.semaine === v.debut) && enPlus.indexOf(v.debut) === -1;
      const resume = x => {
        const n = Checkin.note(x);
        return (n != null ? " · note " + n + "/10" : "") + (tristes.indexOf(x.semaine) > -1 ? " · 😞 à traiter" : "");
      };
      zone.insertAdjacentHTML("beforeend", `<section class="panel"><h2>${dim ? "Ses feedbacks du dimanche et ta réponse" : "Ses bilans hebdomadaires et ton feedback"}</h2>
        ${lu ? "" : `<p class="msg ko">Ses feedbacks n'ont pas pu être lus : recharge la page pour écrire. Rien n'a été modifié.</p>`}
        ${enPlus.map(s => { const x = Checkin.entree(checkins, s); return `<details class="hist-entree" open><summary><b>${esc(Checkin.periode(x || { semaine: s, fin: Feedback.finDe(s) }))}</b> <span class="hist-dates">${x ? "envoyé le " + esc(dateFr(x.envoye_le)) : "sans feedback"} · 😞 à traiter</span></summary>${x ? Checkin.reponsesHTML(x) : ""}${Checkin.avisCoachHTML(checkins, s, F)}${Feedback.editeurHTML(s, x ? x.fin : Feedback.finDe(s), F, x, !lu)}</details>`; }).join("")}
        ${l.map((x, i) => `<details class="hist-entree"${i === 0 || tristes.indexOf(x.semaine) > -1 ? " open" : ""}><summary><b>${esc(Checkin.periode(x))}</b> <span class="hist-dates">envoyé le ${esc(dateFr(x.envoye_le))}${esc(resume(x))}${Feedback.repond(F, x) ? " · feedback envoyé" : Feedback.pour(F, x.semaine) ? " · feedback à relire" : ""}</span></summary>${Checkin.reponsesHTML(x)}${Checkin.avisCoachHTML(checkins, x.semaine, F)}${Feedback.editeurHTML(x.semaine, x.fin, F, x, !lu)}</details>`).join("")}
        ${l.length ? "" : `<div class="empty">${dim ? "Aucun feedback du dimanche envoyé pour le moment." : "Aucun bilan hebdomadaire envoyé pour le moment."}</div>`}
        ${sansBilan ? `<div class="hist-entree"><p class="note" style="margin:0"><b>${esc(Checkin.periode({ semaine: v.debut, fin: v.fin }))}</b> · ${dim ? "pas de feedback du dimanche pour cette semaine" : "pas encore de bilan pour cette semaine"}. Tu peux quand même lui écrire.</p>${Checkin.avisCoachHTML(checkins, v.debut, F)}${Feedback.editeurHTML(v.debut, v.fin, F, null, !lu)}</div>` : ""}
      </section>`);
      Feedback.brancher(zone, uid, F);
    }
  }
};

