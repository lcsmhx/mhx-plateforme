/* ------------------------------------------------------------------
   OUTIL — Le programme d'entrainement
   Le coach l'ecrit depuis la fiche du client ; le client le lit.
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   HISTORIQUE — les anciens programmes et les anciennes dietes.
   Avant qu'un plan en remplace un autre, l'ancien est range ici : ni le
   client ni le coach ne perdent plus ce qui a ete fait.
   Range A PART (hist_programme / hist_repas) et lu seulement quand on ouvre
   l'historique : une semaine de repas pese ~30 ko, on ne veut pas la
   recharger a chaque ouverture de l'onglet.
   Seuls les plans reellement ENVOYES (date d'envoi renseignee) entrent dans
   l'historique : les brouillons que le coach genere trois fois de suite
   pour trouver le bon n'ont rien a y faire.
   ------------------------------------------------------------------ */
const Historique = {
  max: 24,
  cles: { programme: "hist_programme", repas: "hist_repas" },

  utile(type, x){
    if (!x) return false;
    if (type === "programme") return (x.seances || []).some(sc => (sc.exercices || []).some(e => e.nom));
    return (x.jours || []).some(j => (j.repas || []).length);
  },
  empreinte(type, x){ return JSON.stringify(type === "programme" ? (x.seances || []) : (x.jours || [])); },

  async lire(type){ return await Store.lire(this.cles[type], { liste: [] }); },

  /* Range le plan courant. Renvoie false si l'archive n'a pas pu partir. */
  async archiver(type, x){
    if (!x || !x.maj || !this.utile(type, x)) return true;
    const cle = this.cles[type], uid = Store.cible();
    if (!uid) return false;
    const H = await this.lire(type);
    /* lecture ratee : surtout ne pas ecraser l'historique existant */
    if (Store.charge[uid + "|" + cle] === false) return false;
    const l = Array.isArray(H.liste) ? H.liste.slice() : [];
    const copie = JSON.parse(JSON.stringify(x));
    if (l[0] && l[0].contenu && this.empreinte(type, l[0].contenu) === this.empreinte(type, copie)) return true;
    l.unshift({ nom: x.nom || "", du: x.debut || x.maj || "", au: aujourdhui(), contenu: copie });
    const val = { liste: l.slice(0, this.max) };
    try {
      await Auth.assurer();
      await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: [{ user_id: uid, outil: cle, contenu: val, maj_le: new Date().toISOString() }]
      });
      Store.boite(uid)[cle] = val;
      return true;
    } catch(e){ return false; }
  },

  /* A appeler juste avant de remplacer un plan. true = on peut remplacer. */
  async avantRemplacement(type, x){
    const o = x && typeof x === "object" ? Store.origines.get(x) : undefined;
    if (o && o !== Store.cible()){ Store.ficheChangee(); return false; }   // fiche quittee : on abandonne
    if (await this.archiver(type, x)) return true;
    return await UI.confirmer(trad(type === "programme"
      ? "L'ancien programme n'a pas pu être rangé dans l'historique. Le remplacer quand même ?"
      : "L'ancienne diète n'a pas pu être rangée dans l'historique. La remplacer quand même ?"));
  },

  date(s){ return /^\d{4}-\d{2}-\d{2}/.test(s || "") ? dateFr(s) : (s || ""); },
  periode(x){ return x.du ? "du " + this.date(x.du) + " au " + this.date(x.au) : "jusqu'au " + this.date(x.au); },

  htmlProgramme(P){
    const s = (P && P.seances) || [];
    let h = (P && P.note) ? `<p class="note">${esc(P.note)}</p>` : "";
    s.forEach(sc => {
      const ex = (sc.exercices || []).filter(e => e.nom);
      if (!ex.length) return;
      h += `<div class="hist-bloc"><h3>${esc(sc.nom || "Séance")}</h3>` + ex.map(e => `<div class="ex-lecture"><div class="haut">
          <span class="nom">${esc(e.nom)}</span>
          ${e.series ? `<span class="chiffre"><b>${esc(e.series)}</b> séries</span>` : ""}
          ${e.reps ? `<span class="chiffre"><b>${esc(e.reps)}</b> reps</span>` : ""}
          ${e.repos ? `<span class="chiffre">repos <b>${esc(e.repos)}</b></span>` : ""}
        </div></div>`).join("") + `</div>`;
    });
    return h || `<p class="note">Programme vide.</p>`;
  },

  htmlRepas(R){
    const jours = ((R && R.jours) || []).filter(j => (j.repas || []).length);
    const kcal = j => (j.repas || []).reduce((n, x) => n + ((x.macros && x.macros.kcal) || 0), 0);
    let h = (R && R.note) ? `<p class="note">${esc(R.note)}</p>` : "";
    jours.forEach(j => {
      h += `<div class="hist-bloc"><h3>${esc(j.nom)} <span class="hist-dates">${fmt(kcal(j))} kcal</span></h3><ul class="ingr">` +
        j.repas.map(x => `<li><span>${x.moment_nom ? `<span class="hist-dates" style="margin:0">${esc(x.moment_nom)}</span><br>` : ""}${esc(x.nom)}` +
          `${(x.ingredients || []).length ? `<br><small>${x.ingredients.map(g => esc(g.nom) + " " + fmt(g.grammes) + " g").join(" · ")}</small>` : ""}</span>` +
          `<b>${fmt(x.macros ? x.macros.kcal : 0)} kcal</b></li>`).join("") + `</ul></div>`;
    });
    return h || `<p class="note">Diète vide.</p>`;
  },

  /* Le panneau sous le plan en cours. Rien n'est charge tant qu'on ne
     l'ouvre pas. restaurer(contenu) n'existe que cote coach. */
  monter(type, idZone, restaurer){
    const zone = $(idZone); if (!zone) return;
    const prog = type === "programme", coach = typeof restaurer === "function";
    const titre = prog ? (coach ? "Historique des programmes" : "Mes anciens programmes")
                       : (coach ? "Historique des diètes" : "Mes anciennes diètes");
    zone.innerHTML = `<section class="panel"><h2>${titre}</h2>
      <p class="note" style="margin:0 0 12px">${prog ? "Chaque programme remplacé est rangé ici avec ses dates. Rien ne s'efface." : "Chaque diète remplacée est rangée ici avec ses dates. Rien ne s'efface."}</p>
      <div class="actions"><button type="button" class="btn ghost" data-hist-ouvrir>Afficher l'historique</button></div>
      <div data-hist-liste></div></section>`;
    const bouton = zone.querySelector("[data-hist-ouvrir]"), boite = zone.querySelector("[data-hist-liste]");
    const dessiner = async () => {
      bouton.disabled = true;
      const H = await this.lire(type);
      bouton.hidden = true;
      const l = (H && Array.isArray(H.liste)) ? H.liste : [];
      if (!l.length){
        boite.innerHTML = `<div class="empty">${prog ? "Aucun ancien programme pour le moment." : "Aucune ancienne diète pour le moment."}</div>`;
        return;
      }
      boite.innerHTML = l.map((x, i) => `<details class="hist-entree">
          <summary><b>${esc(x.nom || (prog ? "Programme sans nom" : "Diète sans nom"))}</b> <span class="hist-dates">${esc(this.periode(x))}</span></summary>
          ${prog ? this.htmlProgramme(x.contenu) : this.htmlRepas(x.contenu)}
          ${coach ? `<div class="actions" style="margin-top:12px"><button type="button" class="btn ghost" data-hist-remettre="${i}">${prog ? "Remettre ce programme" : "Remettre cette diète"}</button><span class="msg" id="hist-msg-${type}-${i}"></span></div>` : ""}
        </details>`).join("");
      if (coach) $$("[data-hist-remettre]", boite).forEach(b => b.addEventListener("click", async () => {
        const x = l[+b.dataset.histRemettre]; if (!x || !x.contenu) return;
        if (!(await UI.confirmer(trad(prog ? "Remettre « {nom} » ? Le programme actuel sera rangé dans l'historique."
                               : "Remettre « {nom} » ? La diète actuelle sera rangée dans l'historique.", { nom: x.nom || "" }), { ok: trad("Remettre") }))) return;
        b.disabled = true;
        const ok = await restaurer(JSON.parse(JSON.stringify(x.contenu)));
        if (ok) await dessiner(); else b.disabled = false;
      }));
    };
    bouton.addEventListener("click", dessiner);
  }
};

/* ------------------------------------------------------------------
   JOURNAL CLIENT — la cliente note ses seances depuis « Mon programme ».
   Chaque exercice rappelle ce qu'elle a fait la derniere fois et propose
   la charge a viser : double progression. Tant que toutes les series
   n'atteignent pas le haut de la fourchette de repetitions, on garde la
   charge ; quand elles l'atteignent toutes, on monte (+1 kg sous 20 kg,
   +2,5 kg au-dessus). C'est ce qu'un coach fait a la main.
   Range dans la cle « journal », qui appartient a la cliente : le coach
   la lit, il ne l'ecrit pas.
   ------------------------------------------------------------------ */
const Journal = {
  cle: "journal",
  max: 400,
  vide(){ return { seances: [] }; },

  /* v71 (G) : brouillon de la seance en cours, sur l'appareil, par compte (jamais en consultation) :
     mhx_brouillon|<compte>|<si> = { v: { "<exercice>:<serie>": { r, c } } }, ecrit a chaque frappe, efface par une ecriture
     acceptee de la seance, par « Annuler » confirme ou par « Effacer le brouillon » — jamais par un refus de la base. */
  brouillon: {
    PREFIXE: "mhx_brouillon|",
    cle(si){ const u = Auth.utilisateur(); return (u && u.id && !Store.idConsulte) ? this.PREFIXE + u.id + "|" + si : null; },
    lire(si){
      const k = this.cle(si); if (!k) return null;
      let x = null; try { x = JSON.parse(localStorage.getItem(k) || "null"); } catch(e){ x = null; }
      if (!x || typeof x !== "object" || !x.v || typeof x.v !== "object" || Array.isArray(x.v)) return null;
      const v = {};
      Object.keys(x.v).forEach(p => { const s = x.v[p]; if (/^\d+:\d+$/.test(p) && s && typeof s === "object") v[p] = { r: String(s.r == null ? "" : s.r).slice(0, 6), c: String(s.c == null ? "" : s.c).slice(0, 8) }; });
      return Object.keys(v).length ? { v: v } : null;
    },
    ecrire(si, v){ const k = this.cle(si); if (!k) return; if (!Object.keys(v).length){ this.effacer(si); return; } try { localStorage.setItem(k, JSON.stringify({ v: v })); } catch(e){} },
    effacer(si){ const k = this.cle(si); if (!k) return; try { localStorage.removeItem(k); } catch(e){} },
    /* ce que le formulaire contient : les series ou quelque chose a ete tape (reps, ou charge differente de la proposee) */
    depuis(boite){
      const v = {};
      $$("[data-jr-ex]", boite).forEach(bloc => { const ei = bloc.dataset.jrEx;
        $$("[data-r]", bloc).forEach(inp => { const j = inp.dataset.r, ci = bloc.querySelector(`[data-c="${j}"]`), c = ci ? ci.value : "";
          if (inp.value !== "" || (ci && c !== (ci.dataset.kg || ""))) v[ei + ":" + j] = { r: inp.value, c: c }; }); });
      return v;
    },
    saisi(boite){ return Object.keys(this.depuis(boite)).length > 0; }
  },

  /* « 8-10 » -> {8,10} ; « 12 » -> {12,12} ; « 30 s », « 1 min » -> rien */
  cibleReps(reps){
    const s = String(reps || "");
    if (/\d\s*(s|sec|min)\b/i.test(s)) return null;
    const m = s.match(/(\d+)\s*(?:-|–|à)\s*(\d+)/);
    if (m) return { min: +m[1], max: Math.max(+m[1], +m[2]) };
    const u = s.match(/^\s*(\d+)\s*$/);
    return u ? { min: +u[1], max: +u[1] } : null;
  },
  nbSeries(s){ const n = parseInt(s, 10); return (n >= 1 && n <= 10) ? n : 3; },
  kg(v){ return (Math.round(v * 2) / 2).toLocaleString(locale()); },

  /* la derniere fois que cet exercice a ete fait, toutes seances confondues */
  dernier(J, nom){
    const k = Normaliser.aplatir(nom || "");
    if (!k) return null;
    for (let i = J.seances.length - 1; i >= 0; i--){
      const e = (J.seances[i].exos || []).find(x => Normaliser.aplatir(x.nom || "") === k && (x.series || []).some(s => num(s.r) > 0));
      if (e) return { date: J.seances[i].date, e: e };
    }
    return null;
  },

  conseil(ex, prec){
    if (!prec) return null;
    const faites = (prec.e.series || []).filter(s => num(s.r) > 0);
    if (!faites.length) return null;
    const cible = this.cibleReps(ex.reps);
    const kg = Math.max(...faites.map(s => num(s.c)));
    const repsMin = Math.min(...faites.map(s => num(s.r)));
    if (!cible) return { kg: kg || null, texte: "" };
    if (kg > 0){
      if (repsMin >= cible.max){
        const nv = Math.round((kg + (kg < 20 ? 1 : 2.5)) * 2) / 2;
        return { kg: nv, monte: true, texte: trad("Toutes tes séries ont atteint {n} reps : passe à {kg} kg.", { n: cible.max, kg: this.kg(nv) }) };
      }
      return { kg: kg, texte: trad("Garde {kg} kg et vise {n} reps sur chaque série.", { kg: this.kg(kg), n: cible.max }) };
    }
    if (repsMin >= cible.max) return { kg: null, monte: true, texte: trad("Toutes tes séries ont atteint {n} reps : ajoute 1 à 2 répétitions ou un peu de charge.", { n: cible.max }) };
    return { kg: null, texte: trad("Vise {n} reps sur chaque série.", { n: cible.max }) };
  },

  resumeSeries(e){
    return (e.series || []).filter(s => num(s.r) > 0)
      .map(s => num(s.c) > 0 ? s.r + " × " + this.kg(num(s.c)) + " kg" : s.r + " reps").join(" · ");
  },

  htmlSeance(J, sc, si, B){   // v71 (G) : B = brouillon de cette seance (Journal.brouillon.lire) ou null
    const exos = (sc.exercices || []).filter(e => e.nom);
    if (!exos.length) return "";
    let der = null;
    for (let i = J.seances.length - 1; i >= 0; i--) if (J.seances[i].si === si){ der = J.seances[i]; break; }
    const corps = exos.map((e, ei) => {
      const prec = this.dernier(J, e.nom), c = this.conseil(e, prec);
      const rc = this.cibleReps(e.reps);
      const b = j => (B && B.v[ei + ":" + j]) || null;   // v71 (G) : la serie du brouillon
      return `<div class="exo jr-ex" data-jr-ex="${ei}">
        <b>${esc(e.nom)}</b>
        ${prec ? `<p class="note" style="margin:6px 0 0">${esc(trad("Dernière fois ({date}) : {detail}", { date: dateFr(prec.date), detail: this.resumeSeries(prec.e) }))}</p>` : ""}
        ${c && c.texte ? `<p class="note" style="margin:4px 0 0"><b class="${c.monte ? "pos" : ""}">${esc(c.texte)}</b></p>` : ""}
        <div class="sets">${Array.from({ length: this.nbSeries(e.series) }, (_, j) => `<div class="set"><div class="s-lbl">Série ${j + 1}</div><div class="pair">
            <input type="number" min="0" max="100" step="1" inputmode="numeric" placeholder="${rc ? rc.max : "reps"}" value="${b(j) ? esc(b(j).r) : ""}" data-r="${j}" aria-label="Répétitions">
            <input type="number" min="0" max="500" step="0.5" inputmode="decimal" placeholder="kg" value="${b(j) ? esc(b(j).c) : (c && c.kg ? c.kg : "")}" data-kg="${c && c.kg ? c.kg : ""}" data-c="${j}" aria-label="Charge en kg">
          </div><div class="cap">reps · kg</div></div>`).join("")}</div>
      </div>`;
    }).join("");
    return `<div class="jr-zone" data-jr="${si}">
      <div class="actions">
        <button type="button" class="btn" data-jr-ouvrir="${si}"${B ? " hidden" : ""}>Noter ma séance</button>
        ${der ? `<span class="note" style="margin:0">${esc(trad("Dernière séance notée le {date}", { date: dateFr(der.date) }))}</span>` : ""}
        <span class="msg" id="jr-ok-${si}"></span>
      </div>
      <div data-jr-form${B ? "" : " hidden"}>
        ${B ? `<p class="note jr-reprise" style="margin:0 0 8px"><span>Séance en cours reprise</span> · <button type="button" class="lien-bouton" data-jr-effacer="${si}">Effacer le brouillon</button></p>` : ""}
        <p class="note">Note tes répétitions et ta charge pour chaque série. La charge proposée vient de ta dernière séance : ajuste-la si besoin.</p>
        ${corps}
        <div class="actions"><button type="button" class="btn" data-jr-fin="${si}">Séance terminée</button><button type="button" class="btn ghost" data-jr-annuler>Annuler</button><span class="msg" id="jr-msg-${si}"></span></div>
      </div>
    </div>`;
  },

  /* Remplit les emplacements laisses par outilProgramme.vueLecture */
  async brancher(zone, P, Jfourni, apres){
    const J = Jfourni || await Store.lire(this.cle, this.vide());
    if (!Array.isArray(J.seances)) J.seances = [];
    const self = this;
    const remplir = () => {
      $$("[data-jr-place]", zone).forEach(pl => {
        const si = +pl.dataset.jrPlace, sc = (P.seances || [])[si];
        pl.innerHTML = sc ? self.htmlSeance(J, sc, si, self.brouillon.lire(si)) : "";
      });
      $$("[data-jr-ouvrir]", zone).forEach(b => b.addEventListener("click", () => {
        b.closest(".jr-zone").querySelector("[data-jr-form]").hidden = false;
        b.hidden = true;
      }));
      /* v71 (G) : chaque frappe met le brouillon de la seance sur l'appareil ; « Effacer le brouillon » le retire */
      $$("[data-jr-form]", zone).forEach(f => { const boite = f.closest(".jr-zone"), si = +boite.dataset.jr;
        f.addEventListener("input", () => self.brouillon.ecrire(si, self.brouillon.depuis(boite)));
      });
      $$("[data-jr-effacer]", zone).forEach(b => b.addEventListener("click", () => { self.brouillon.effacer(+b.dataset.jrEffacer); remplir(); }));
      /* v71 (G) : « Annuler » avec des chiffres saisis demande confirmation (fenetre de l'app) */
      $$("[data-jr-annuler]", zone).forEach(b => b.addEventListener("click", async () => {
        const boite = b.closest(".jr-zone"), si = +boite.dataset.jr;
        if (self.brouillon.saisi(boite) && !(await UI.confirmer(trad("Abandonner cette séance ? Les chiffres saisis seront effacés."), { ok: trad("Abandonner"), annuler: trad("Continuer"), danger: true }))) return;
        self.brouillon.effacer(si);
        remplir();
      }));
      $$("[data-jr-fin]", zone).forEach(b => b.addEventListener("click", () => {
        const si = +b.dataset.jrFin, sc = P.seances[si], boite = b.closest(".jr-zone");
        let aberrant = false;
        const exos = (sc.exercices || []).filter(e => e.nom).map((e, ei) => {
          const bloc = boite.querySelector(`[data-jr-ex="${ei}"]`);
          const series = [];
          $$("[data-r]", bloc).forEach(inp => {
            const j = inp.dataset.r, r = num(inp.value);
            const ci = bloc.querySelector(`[data-c="${j}"]`), c = ci ? num(ci.value) : 0;
            if (r > 100 || c > 500 || r < 0 || c < 0) aberrant = true;
            if (r > 0) series.push({ r: r, c: c > 0 ? c : 0 });
          });
          return { nom: e.nom, series: series };
        }).filter(x => x.series.length);
        if (aberrant){ flash("jr-msg-" + si, "Vérifie tes chiffres : jusqu'à 100 reps et 500 kg par série."); return; }
        if (!exos.length){ flash("jr-msg-" + si, "Note au moins une série pour enregistrer ta séance."); return; }
        const date = aujourdhui();
        J.seances = J.seances.filter(x => !(x.si === si && x.date === date));
        J.seances.push({ date: date, si: si, nom: sc.nom || "", exos: exos });
        if (J.seances.length > self.max) J.seances = J.seances.slice(-self.max);
        if (Store.ecrire(self.cle, J) === false) return;   // refusee (message deja affiche) : le brouillon reste
        self.brouillon.effacer(si);   // v71 (G) : seulement apres une ecriture acceptee, avant de redessiner
        remplir();
        if (typeof apres === "function") apres();
        flash("jr-ok-" + si, "Séance enregistrée. Bravo !");
      }));
    };
    remplir();
  },

  /* Cote coach : les dernieres seances notees par le client */
  async resumeCoach(idZone){
    const z = $(idZone); if (!z) return;
    const J = await Store.lire(this.cle, this.vide());
    const l = (Array.isArray(J.seances) ? J.seances : []).slice(-8).reverse();
    z.innerHTML = `<section class="panel"><h2>Séances notées par ton client</h2>` + (l.length
      ? `<div class="scroll"><table><thead><tr><th>Date</th><th>Séance</th><th>Exercices</th><th>Séries</th></tr></thead><tbody>` +
        l.map(x => `<tr><td>${esc(dateFr(x.date))}</td><td>${esc(x.nom || "—")}</td><td>${fmt(Array.isArray(x.exos) ? x.exos.length : 0)}</td><td>${fmt((Array.isArray(x.exos) ? x.exos : []).reduce((n, e) => n + (e && Array.isArray(e.series) ? e.series.length : 0), 0))}</td></tr>`).join("") +
        `</tbody></table></div>`
      : `<div class="empty">Aucune séance notée pour le moment.</div>`) + `</section>`;
  }
};

/* ------------------------------------------------------------------
   REGULARITE — un score sur 100 par semaine (du lundi au dimanche).
   Il mesure ce que le client FAIT, pas ce que dit la balance : seances
   notees (50), repas coches (30), mesure de la semaine (20).
   Une partie sans objet (pas de programme, pas de diete, repas jamais
   coches) sort du calcul au lieu de faire baisser la note ; sans programme,
   diete ni mesure enregistree, il n'y a pas de score (v71). Les repas ne
   comptent qu'a partir du premier jour ou le client a coche quelque chose :
   les jours d'avant l'existence du suivi ne sont pas des jours rates.
   ------------------------------------------------------------------ */
const Regularite = {
  /* les points de chaque partie vivent dans CONFIG.regularite (v36) */
  get poids(){ return (CONFIG.regularite && CONFIG.regularite.poids) || { seances: 50, repas: 30, mesure: 20 }; },

  iso(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
  /* decalage 0 = semaine en cours (du lundi a aujourd'hui), -1 = la precedente, complete */
  bornes(decalage){
    const l = new Date(); l.setHours(12, 0, 0, 0);
    l.setDate(l.getDate() - ((l.getDay() + 6) % 7) + 7 * (decalage || 0));
    const fin = new Date(l); fin.setDate(l.getDate() + 6);
    const auj = new Date(); auj.setHours(12, 0, 0, 0);
    const dernier = (decalage || 0) === 0 ? auj : fin;
    const jours = [];
    for (const d = new Date(l); d <= dernier; d.setDate(d.getDate() + 1)) jours.push(this.iso(d));
    return { debut: this.iso(l), fin: this.iso(fin), jours: jours };
  },

  /* repas prevus un jour donne : le plan suit les jours de la semaine */
  prevusLe(R, iso){
    const jours = (R && R.jours) || [];
    if (!jours.length) return 0;
    const d = new Date(iso + "T12:00:00");
    const j = jours[Math.min(jours.length - 1, (d.getDay() + 6) % 7)];
    return (j && Array.isArray(j.repas)) ? j.repas.length : 0;
  },

  calculer(c, decalage){
    const b = this.bornes(decalage);
    const P = c.programme || {}, J = c.journal || {}, R = c.repas || {}, S = c.repas_suivi || {}, M = c.mens || {};
    const parts = {};
    const nb = Math.min(7, (P.seances || []).filter(sc => (sc.exercices || []).some(e => e.nom)).length);
    if (nb){
      const faites = new Set((J.seances || []).filter(x => x.date >= b.debut && x.date <= b.fin).map(x => x.date + "|" + x.si)).size;
      parts.seances = { faites: faites, cible: nb, ratio: Math.min(1, faites / nb) };
    }
    const hist = S.hist || {};
    const debutHist = Object.keys(hist).sort()[0];
    if (debutHist && (R.jours || []).some(j => (j.repas || []).length)){
      let coches = 0, prevus = 0;
      b.jours.forEach(iso => {
        if (iso < debutHist) return;
        const p = this.prevusLe(R, iso);
        prevus += p; coches += Math.min(p, (hist[iso] && hist[iso].c) || 0);
      });
      if (prevus) parts.repas = { coches: coches, prevus: prevus, ratio: coches / prevus };
    }
    /* v71 (A) : la mesure ne compte que s'il y a quelque chose a mesurer — un programme (part seances), une diete
       (meme test que l'accueil et Mes clients, ancien format compris) ou au moins une mesure enregistree ;
       sinon aucune part : score null, les ecrans affichent « — » au lieu de « 0/100 » */
    const aDiete = (R.jours || []).some(j => (j.repas || []).length) || (R.repas || []).length;
    const aMesure = Array.isArray(M.mesures) && M.mesures.length > 0;
    if (nb || aDiete || aMesure){
      const faite = (M.mesures || []).some(m => m && m.date && m.date >= b.debut && m.date <= b.fin);
      parts.mesure = { faite: faite, ratio: faite ? 1 : 0 };
    }
    let total = 0, poids = 0;
    for (const k in parts){ total += this.poids[k] * parts[k].ratio; poids += this.poids[k]; }
    return { score: poids ? Math.round(total / poids * 100) : null, parts: parts, bornes: b };
  },

  niveau(s){
    const t = (CONFIG.regularite && CONFIG.regularite.seuils) || { bon: 70, moyen: 40 };
    return s == null ? "" : s >= t.bon ? "pos" : s >= t.moyen ? "moyen" : "neg";
  },

  /* ---------- objectifs du mois (v36) ----------
     Deux sources, toutes deux conservees : le coach pose un statut
     (P.objectifs.statuts[i] : en_cours | atteint | non_atteint), le client
     coche (objectifs_faits.faits[i]). Le statut du coach l'emporte quand il
     tranche (atteint / non atteint) ; sinon la case du client fait foi. */
  statutObjectif(P, OF, i){
    const o = P && P.objectifs || {};
    const coach = (o.statuts || [])[i] || "";
    if (coach === "atteint" || coach === "non_atteint") return coach;
    const faits = (OF && OF.mois === o.mois && Array.isArray(OF.faits)) ? OF.faits : [];
    return faits[i] ? "atteint" : "en_cours";
  },
  libelleStatut(st){ return st === "atteint" ? trad("Atteint") : st === "non_atteint" ? trad("Non atteint") : trad("En cours"); },
  classeStatut(st){ return st === "atteint" ? "ok" : st === "non_atteint" ? "mauvais" : ""; },

  /* appele a chaque case « mange » : garde le compte du jour, 70 jours max */
  noterRepas(R, suivi){
    const jours = (R && R.jours) || [];
    if (!jours.length) return;
    const iso = aujourdhui();
    const idx = Math.min(jours.length - 1, (new Date().getDay() + 6) % 7);
    const c = Object.keys(suivi.mange || {}).filter(k => suivi.mange[k] && k.indexOf(idx + ":") === 0).length;
    suivi.hist = suivi.hist || {};
    suivi.hist[iso] = { c: c, p: this.prevusLe(R, iso) };
    const cles = Object.keys(suivi.hist).sort();
    while (cles.length > 70) delete suivi.hist[cles.shift()];
  },

  /* Cote client : le panneau « Ta semaine » en haut de « Mon programme ».
     Renvoie une fonction pour le redessiner (apres une seance notee). */
  /* pre : donnees deja lues (l'outil Mon suivi les charge en une requete) */
  async monterClient(idZone, P, J, pre){
    const z = $(idZone); if (!z) return () => {};
    const [R, S, M, OF] = pre
      ? [pre.repas || {}, pre.repas_suivi || {}, pre.mens || {}, Object.assign({ mois: "", faits: [] }, pre.objectifs_faits || {})]
      : await Promise.all([
          Store.lire("repas", {}), Store.lire("repas_suivi", {}), Store.lire("mens", {}),
          Store.lire("objectifs_faits", { mois: "", faits: [] })
        ]);
    if (!Array.isArray(OF.faits)) OF.faits = [];
    const dessiner = () => {
      const c = { programme: P, journal: J, repas: R, repas_suivi: S, mens: M };
      const r = this.calculer(c, 0);
      const p = r.parts;
      const mesureFaite = !!(p.mesure && p.mesure.faite);   // v71 (A) : pas de part mesure tant qu'il n'y a rien a mesurer
      /* v35 — les quatre semaines precedentes, pour voir la tendance */
      const evo = [-4, -3, -2, -1].map(k => this.calculer(c, k).score).concat([r.score]);
      const obj = (P.objectifs && (P.objectifs.liste || []).some(Boolean)) ? P.objectifs : null;
      if (obj && OF.mois !== obj.mois){ OF.mois = obj.mois; OF.faits = []; }
      const nbObj = obj ? obj.liste.filter(Boolean).length : 0, nbFaits = obj ? obj.liste.filter((t, i) => t && this.statutObjectif(P, OF, i) === "atteint").length : 0;
      z.innerHTML = `<section class="panel"><h2>${esc(trad("Ta régularité"))}</h2>
        <div class="tiles">
          <div class="tile"><div class="t-lbl">Score de régularité</div><div class="t-val readout ${this.niveau(r.score)}">${r.score == null ? "—" : r.score}<small>/100</small></div><div class="t-sub">remis à zéro chaque lundi</div></div>
          ${p.seances ? `<div class="tile"><div class="t-lbl">Training</div><div class="t-val readout${p.seances.faites >= p.seances.cible ? " pos" : ""}">${p.seances.faites}<small>/ ${p.seances.cible}</small></div><div class="t-sub">${esc(trad("séances notées"))}</div></div>` : ""}
          ${p.repas ? `<div class="tile"><div class="t-lbl">Nutrition</div><div class="t-val readout${p.repas.ratio >= 0.9 ? " pos" : ""}">${fmt(p.repas.coches)}<small>/ ${fmt(p.repas.prevus)}</small></div><div class="t-sub">${esc(trad("repas respectés"))}</div></div>` : ""}
          <div class="tile"><div class="t-lbl">Mesure de la semaine</div><div class="t-val readout ${mesureFaite ? "pos" : ""}">${mesureFaite ? "✓" : "—"}</div><div class="t-sub">${mesureFaite ? "c'est fait" : esc(trad("dans Ma progression"))}</div></div>
        </div>
        <div class="reg-evo" aria-label="${esc(trad("Régularité des cinq dernières semaines"))}">${evo.map((v, i) => `<div class="reg-evo-col${i === evo.length - 1 ? " ici" : ""}"><div class="reg-evo-barre"><i style="height:${v == null ? 0 : Math.max(4, v)}%"></i></div><span class="reg-evo-val ${this.niveau(v)}">${v == null ? "—" : v}</span><span class="reg-evo-lbl">${i === evo.length - 1 ? esc(trad("en cours")) : "S−" + (evo.length - 1 - i)}</span></div>`).join("")}</div>
        <p class="note" style="margin:12px 0 0">${esc(trad("Un indicateur de motivation, pas une mesure médicale : il compte ce que tu fais — séances, repas, mesure — pas ce que dit la balance."))}</p>
      </section>
      <section class="panel"><div class="seance-c-tete"><h2>${esc(trad("Tes objectifs du mois"))}</h2>${obj ? `<span class="pastille${nbFaits === nbObj ? " ok" : ""}">${nbFaits} / ${nbObj}</span>` : ""}</div>
        ${obj ? obj.liste.map((t, i) => { if (!t) return ""; const st = this.statutObjectif(P, OF, i), tranche = st === "non_atteint" || ((obj.statuts || [])[i] === "atteint");
             return `<label class="objectif${st === "atteint" ? " atteint" : ""}${st === "non_atteint" ? " rate" : ""}"><input type="checkbox" class="obj-case" data-obj="${i}"${OF.faits[i] ? " checked" : ""}${tranche ? " disabled" : ""}><span class="texte" data-notr>${esc(t)}</span><span class="pastille ${this.classeStatut(st)}">${esc(this.libelleStatut(st))}</span></label>`; }).join("")
             : `<div class="empty">${esc(trad("Ton coach écrit tes trois objectifs après votre call. Ils apparaîtront ici."))}</div>`}
        ${obj ? `<p class="note" style="margin:12px 0 0">${esc(trad("Coche un objectif quand tu l'as atteint : ton coach le voit."))}</p>` : ""}
      </section>`;
      $$("[data-obj]", z).forEach(c => c.addEventListener("change", () => {
        OF.faits[+c.dataset.obj] = c.checked;
        Store.ecrire("objectifs_faits", OF);
        dessiner();
      }));
    };
    dessiner();
    return dessiner;
  },

  /* Cote coach : les 3 objectifs, sur la fiche programme du client */
  objectifsCoach(idZone, P, sauver){
    const z = $(idZone); if (!z) return;
    const o = P.objectifs || { mois: "", liste: ["", "", ""] };
    const moisTxt = o.mois ? new Date(o.mois + "-15T12:00:00").toLocaleDateString(locale(), { month: "long", year: "numeric" }) : "";
    const exemples = ["Ex. 3 séances par semaine", "Ex. 2 L d'eau par jour", "Ex. 8 000 pas par jour"];
    const statuts = o.statuts || ["", "", ""];
    const opt = (v, l, sel) => `<option value="${v}"${sel === v ? " selected" : ""}>${l}</option>`;
    z.innerHTML = `<section class="panel"><h2>Les 3 objectifs du mois</h2>
      <p class="note" style="margin:0 0 12px">Remplis-les juste après ton call du mois : ils s'affichent dans « Mon suivi » et sur l'accueil de ton client, qui peut les cocher. Le statut que tu poses (atteint / non atteint) l'emporte sur sa case.</p>
      ${moisTxt ? `<p class="note" style="margin:0 0 12px">${esc(trad("Dernière mise à jour : {mois}.", { mois: moisTxt }))}</p>` : ""}
      <div class="grid g3">${[0, 1, 2].map(i => `<div><label for="obj-${i}">Objectif ${i + 1}</label><input id="obj-${i}" type="text" maxlength="120" value="${esc((o.liste || [])[i] || "")}" placeholder="${esc(exemples[i])}">
        <select id="obj-st-${i}" style="margin-top:6px">${opt("", "En cours", statuts[i] || "")}${opt("atteint", "Atteint", statuts[i])}${opt("non_atteint", "Non atteint", statuts[i])}</select></div>`).join("")}</div>
    </section>`;
    const lire = () => {
      P.objectifs = Object.assign({}, P.objectifs || {}, {
        mois: (P.objectifs && P.objectifs.mois) || aujourdhui().slice(0, 7),
        liste: [0, 1, 2].map(k => $("obj-" + k).value.trim()),
        statuts: [0, 1, 2].map(k => $("obj-st-" + k).value)
      });
      sauver();
    };
    [0, 1, 2].forEach(i => {
      /* un objectif retape = nouveau mois d'objectifs ; un statut change sans toucher au mois */
      $("obj-" + i).addEventListener("input", () => { if (P.objectifs) P.objectifs.mois = aujourdhui().slice(0, 7); lire(); });
      $("obj-st-" + i).addEventListener("change", lire);
    });
  }
};

const outilProgramme = {
  id: "programme",
  cle: "programme",
  nom: "Mon programme",
  principal: true,
  icone: "📋",
  titre: "Le programme",
  accroche: "Les séances construites pour toi : les exercices, les séries, les répétitions et les temps de repos.",

  seanceVide(n){ return { nom: "Séance " + String.fromCharCode(64 + n), note: "", exercices: [ this.exoVide() ] }; },
  exoVide(){ return { nom:"", series:"", reps:"", repos:"", note:"", lien:"", id:"" }; },

  /* Une ligne « Développé couché — 4 x 8-10 » ne dit pas comment faire le
     mouvement. La fiche s'ouvre sous l'exercice, sans quitter la page. */
  ficheHTML(f){
    if (!f) return `<div class="fiche-ex"><p class="note" style="margin:0">Aucune fiche pour cet exercice. Demande à ton coach.</p></div>`;
    return `<div class="fiche-ex">
      <div class="fiche-tags">
        ${f.groupe ? `<span class="pastille">${esc(f.groupe)}</span>` : ""}
        ${f.materiel ? `<span class="pastille">${esc(f.materiel)}</span>` : ""}
        ${f.niveau ? `<span class="pastille">${esc(f.niveau)}</span>` : ""}
        ${(f.muscles || []).length ? `<span class="meta">${f.muscles.map(m => `<span>${esc(m)}</span>`).join(" · ")}</span>` : ""}
      </div>
      ${(f.execution || []).length ? `<h3>Exécution</h3><ol class="etapes">${f.execution.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
      ${(f.erreurs || []).length ? `<h3>Erreurs fréquentes</h3><ul class="erreurs">${f.erreurs.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${f.respiration ? `<p class="note"><b>Respiration :</b> ${esc(f.respiration)}</p>` : ""}
      ${idVideo(f.video_id) ? `<div class="video-boite">
        <button type="button" class="video-vignette" data-yt="${esc(f.video_id)}" aria-label="Voir la démonstration">
          <img src="https://img.youtube.com/vi/${esc(f.video_id)}/hqdefault.jpg" alt="" loading="lazy">
          <span class="jouer">▶ Voir la démonstration</span>
        </button>
        <p class="note" style="margin:8px 0 0">Vidéo hébergée sur YouTube, d'une chaîne tierce. Elle s'ouvre ici, sans quitter ton espace.</p>
      </div>`
      : (lienSur(f.lien) ? `<a class="link-a" href="${esc(lienSur(f.lien))}" target="_blank" rel="noopener">Voir la démonstration →</a>` : "")}
    </div>`;
  },

  /* Branche les boutons « fiche » d'une zone déjà rendue. */
  brancherFiches(zone){
    $$("[data-fiche]", zone).forEach(b => b.addEventListener("click", async () => {
      const boite = b.closest(".ex-lecture").querySelector(".fiche-boite");
      if (!boite) return;
      if (boite.innerHTML){ boite.hidden = !boite.hidden; b.textContent = boite.hidden ? "Comment faire ?" : "Masquer"; return; }
      b.textContent = "…";
      const f = await Catalogue.fiche(b.dataset.fiche);
      boite.innerHTML = this.ficheHTML(f);
      boite.hidden = false;
      b.textContent = "Masquer";
      /* on ne charge le lecteur qu'au clic : sinon chaque fiche ouverte
         tirerait une video, et la page deviendrait lourde sur mobile */
      $$(".video-vignette", boite).forEach(v => v.addEventListener("click", () => {
        const id = v.dataset.yt;
        const cadre = document.createElement("div");
        cadre.className = "video-cadre";
        if (!idVideo(id)) return;
        cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${idVideo(id)}?rel=0&autoplay=1" title="Démonstration" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        v.parentNode.replaceChild(cadre, v);
      }));
    }));
  },

  /* ---------- vue client : lecture ---------- */
  /* v35 — ou en est le programme : cycle (pose par le coach) et semaine en
     cours, comptee depuis la date d'envoi (P.debut, lundi a dimanche). Un
     programme sans date ne dit rien : on n'invente pas. */
  avancement(P){
    const duree = Math.max(1, Math.min(52, parseInt(P.duree_semaines, 10) || 4));
    const cycle = Math.max(1, parseInt(P.cycle, 10) || 1);
    const debut = /^\d{4}-\d{2}-\d{2}/.test(P.debut || "") ? new Date(P.debut + "T12:00:00") : null;
    let semaine = null;
    if (debut){
      const l = new Date(debut); l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
      const auj = new Date(); auj.setHours(12, 0, 0, 0);
      semaine = Math.floor((auj - l) / (7 * 86400000)) + 1;
      if (semaine < 1) semaine = 1;
    }
    return { cycle, duree, semaine, depassee: semaine != null && semaine > duree, pct: semaine == null ? 0 : Math.min(100, Math.round(Math.min(semaine, duree) / duree * 100)) };
  },

  /* seances notees cette semaine (lundi -> aujourd'hui), par index de seance */
  faitesCetteSemaine(J){
    const b = Regularite.bornes(0), out = {};
    (J && J.seances || []).forEach(x => { if (x.date >= b.debut && x.date <= b.fin) out[x.si] = x.date; });
    return out;
  },

  vueLecture(P, J){
    if (!P.seances || !P.seances.length){
      return `<section class="panel"><div class="empty">Ton coach n'a pas encore déposé ton programme. Tu recevras un message quand il sera prêt.${ctaVide(true)}</div></section>`;
    }
    const av = this.avancement(P), faites = this.faitesCetteSemaine(J);
    const seances = P.seances.filter(sc => (sc.exercices || []).some(e => e.nom));
    const nbFaites = seances.reduce((n, sc) => n + (faites[P.seances.indexOf(sc)] != null ? 1 : 0), 0);
    let h = `<section class="panel prog-tete">
      <div class="prog-tete-haut">
        <div>
          <span class="eyebrow">${esc(trad("Cycle {n}", { n: String(av.cycle).padStart(2, "0") }))}${av.semaine != null ? ` · ${esc(trad(av.depassee ? "Semaine {a} — cycle terminé" : "Semaine {a} sur {b}", { a: Math.min(av.semaine, av.duree), b: av.duree }))}` : ""}</span>
          <h2 style="margin:4px 0 0">${esc(P.nom || trad("Mon programme"))}</h2>
        </div>
        <div class="tile prog-compteur"><div class="t-lbl">${esc(trad("Cette semaine"))}</div><div class="t-val readout${seances.length && nbFaites >= seances.length ? " pos" : ""}" id="prog-nb">${nbFaites}<small>/ ${seances.length}</small></div><div class="t-sub">${esc(trad("séances notées"))}</div></div>
      </div>
      ${av.semaine != null ? `<div class="bar" style="margin-top:14px"><i style="width:${av.pct}%"></i></div>
      <p class="note" style="margin:8px 0 0">${esc(av.depassee ? trad("Ce cycle est terminé : ton coach prépare la suite.") : trad("{n} séances par semaine. Note chaque séance : c'est ce qui fait avancer ta régularité.", { n: seances.length }))}</p>` : ""}
      ${P.note ? `<div class="flag info" style="margin-top:14px"><b>${esc(trad("Mot du coach"))}</b><br>${esc(P.note)}</div>` : ""}
    </section>`;
    P.seances.forEach((sc, si) => {
      const faite = faites[si];
      h += `<section class="panel seance-c${faite ? " faite" : ""}" id="seance-${si}">
        <div class="seance-c-tete"><h2>${esc(sc.nom || "Séance")}</h2>${faite ? `<span class="pastille ok">✓ ${esc(trad("notée le {d}", { d: dateFr(faite) }))}</span>` : `<span class="pastille">${esc(trad("à faire"))}</span>`}</div>`;
      if (sc.note) h += `<p class="note" style="margin:-6px 0 14px">${esc(sc.note)}</p>`;
      (sc.exercices || []).forEach(e => {
        if (!e.nom) return;
        h += `<div class="ex-lecture">
          <div class="haut">
            <span class="nom">${esc(e.nom)}</span>
            ${e.series ? `<span class="chiffre"><b>${esc(e.series)}</b> séries</span>` : ""}
            ${e.reps ? `<span class="chiffre"><b>${esc(e.reps)}</b> reps</span>` : ""}
            ${e.repos ? `<span class="chiffre">repos <b>${esc(e.repos)}</b></span>` : ""}
          </div>
          ${e.note ? `<div class="obs">${esc(e.note)}</div>` : ""}
          ${lienSur(e.lien) ? `<a class="link-a" href="${esc(lienSur(e.lien))}" target="_blank" rel="noopener">Voir la démonstration →</a>` : ""}
          <button type="button" class="ex-fiche" data-fiche="${esc(e.nom)}">Comment faire ?</button>
          <div class="fiche-boite" hidden></div>
        </div>`;
      });
      h += `<div data-jr-place="${si}"></div></section>`;
    });
    if (P.maj) h += `<p class="note" style="text-align:center">Programme mis à jour le ${esc(P.maj)}</p>`;
    return h;
  },

  /* Les programmes sont ranges par lieu d'entrainement : c'est la premiere
     question qu'on se pose devant un client — salle, maison avec halteres,
     ou rien du tout. */
  lieux(){
    const l = [];
    (this.prets || []).forEach(x => { if (x.lieu && l.indexOf(x.lieu) === -1) l.push(x.lieu); });
    return l.sort();
  },

  /* Cherche un exercice dans la base par son nom, sans tenir compte des
     accents ni de la casse. C'est la MEME cle que celle qui sert a afficher
     la fiche cote client : si ca ne trouve rien ici, le client n'aura ni
     fiche ni video. */
  trouve(nom){
    const cle = Normaliser.aplatir(nom || "");
    if (!cle) return null;
    return (this.idxExos && this.idxExos[cle]) || null;
  },

  /* Le petit mot sous le champ : dit tout de suite si l'exercice est reconnu,
     et si sa video suivra. */
  etatExo(e, f, si, ei){
    if (!e.nom) return `<p class="ex-etat vide">Choisis un exercice dans ta base pour que la fiche et la vidéo suivent.</p>`;
    if (f){
      const v = f.video_id || f.lien;
      return `<p class="ex-etat ok">✓ Dans ta base${v ? " · vidéo automatique" : " · pas encore de vidéo"}</p>`;
    }
    return `<p class="ex-etat absent">Pas dans ta base : ton client n'aura ni fiche ni vidéo.
      <button type="button" class="lien-bouton" data-ajout-base="${si}:${ei}">L'ajouter</button></p>`;
  },

  /* On remplace le message sous le champ sans redessiner toute la page :
     redessiner ferait perdre le curseur a chaque lettre tapee. */
  majEtat(el, ex, fiche, si, ei){
    const boite = el.parentNode;
    const ancien = boite.querySelector(".ex-etat");
    const neuf = document.createElement("div");
    neuf.innerHTML = this.etatExo(ex, fiche, si, ei);
    const remplacant = neuf.firstElementChild;
    if (ancien && remplacant) boite.replaceChild(remplacant, ancien);
  },

  /* Le questionnaire dit ou il s'entraine, combien de fois, a quel niveau et
     pour quoi. On note chaque programme du catalogue la-dessus, et on propose
     le meilleur — en disant POURQUOI, pour que le coach puisse contredire.
     Ce n'est pas de la magie : c'est le tri qu'il ferait a la main. */
  LIEUX_EQUIV: {
    "Salle complète": ["Salle complète"],
    "Salle basique":  ["Salle basique", "Salle complète", "Maison avec haltères"],
    "À la maison":    ["Maison sans matériel", "Maison avec haltères"],
    "Extérieur":      ["Extérieur", "Maison sans matériel"]
  },

  noter(prog, intake){
    let note = 0; const pour = [];
    const lieux = this.LIEUX_EQUIV[intake.lieu] || [];
    if (prog.lieu && lieux.indexOf(prog.lieu) === 0){ note += 4; pour.push("le lieu"); }
    else if (prog.lieu && lieux.indexOf(prog.lieu) > 0){ note += 2; pour.push("un lieu compatible"); }
    else if (prog.lieu && intake.lieu) note -= 3;

    const veut = num(intake.seances);
    if (veut && prog.seances_semaine){
      const d = Math.abs(prog.seances_semaine - veut);
      if (d === 0){ note += 4; pour.push("le nombre de séances"); }
      else if (d === 1){ note += 1; }
      else note -= 2;
    }

    const niv = /d[ée]butant/i.test(intake.niveau || "") ? "Debutant"
              : /avanc/i.test(intake.niveau || "") ? "Avance" : "Intermediaire";
    const nivProg = Normaliser.aplatir(prog.niveau || "");
    if (nivProg && nivProg === Normaliser.aplatir(niv)){ note += 3; pour.push("le niveau"); }
    else if (nivProg) note -= 1;

    if (prog.objectif && intake.objectif){
      const a = Normaliser.aplatir(prog.objectif), b = Normaliser.aplatir(intake.objectif);
      if (a === b || b.indexOf(a) > -1 || a.indexOf(b) > -1){ note += 3; pour.push("l'objectif"); }
    }
    return { note: note, pour: pour };
  },

  proposer(intake){
    const l = (this.prets || []);
    if (!l.length || !intake) return null;
    let meilleur = null;
    l.forEach(x => {
      const r = this.noter(x, intake);
      if (!meilleur || r.note > meilleur.note) meilleur = { prog: x, note: r.note, pour: r.pour };
    });
    return (meilleur && meilleur.note > 0) ? meilleur : null;
  },

  optionsPrets(){
    let l = (this.prets || []).slice();
    if (this.lieuChoisi) l = l.filter(x => x.lieu === this.lieuChoisi);
    if (this.seancesChoisies) l = l.filter(x => String(x.seances_semaine) === String(this.seancesChoisies));
    if (!l.length) return `<option value="">— aucun programme pour ces critères —</option>`;
    const ordre = { "Débutant":1, "Debutant":1, "Intermédiaire":2, "Intermediaire":2, "Avancé":3, "Avance":3 };
    const parLieu = {};
    l.forEach(x => { (parLieu[x.lieu || "Autre"] = parLieu[x.lieu || "Autre"] || []).push(x); });
    let h = `<option value="">— choisis un programme —</option>`;
    Object.keys(parLieu).sort().forEach(lieu => {
      const g = parLieu[lieu].sort((a, b) => (a.seances_semaine || 0) - (b.seances_semaine || 0)
                              || (ordre[a.niveau] || 9) - (ordre[b.niveau] || 9));
      h += `<optgroup label="${esc(lieu)}">` + g.map(x =>
        `<option value="${esc(x.id)}">${x.seances_semaine ? x.seances_semaine + "× · " : ""}${esc(x.nom)}${x.niveau ? " · " + esc(x.niveau) : ""}${x.objectif ? " · " + esc(x.objectif) : ""}</option>`
      ).join("") + `</optgroup>`;
    });
    return h;
  },

  /* ---------- vue coach : edition ---------- */
  /* Les branchements communs aux deux contextes : les champs des seances,
     le selecteur d'exercice, les echauffements, l'ajout et la suppression.
     L'atelier appelle exactement la meme fonction que la fiche client — ce
     qui evite d'avoir deux editeurs qui divergent au fil des corrections. */
  brancherEditeur(P, zone, sauver, redessiner){
    const PR = this;
      $$("[data-f]", zone).forEach(el => {
        el.addEventListener("input", () => {
          const si = +el.dataset.s, f = el.dataset.f;
          if (el.dataset.e === undefined){ P.seances[si][f] = el.value; sauver(); return; }
          const ex = P.seances[si].exercices[+el.dataset.e];
          ex[f] = el.value;
          /* Le nom vient de changer : on rebranche l'exercice sur la base, et
             on va y chercher la video au lieu de la demander au coach. */
          if (f === "nom"){
            const fiche = PR.trouve(el.value);
            ex.id = fiche ? fiche.id : "";
            if (fiche && !ex.lien && (fiche.lien || fiche.video_id)){
              ex.lien = fiche.lien || ("https://www.youtube.com/watch?v=" + fiche.video_id);
              /* on le montre aussi a l'ecran : sinon le coach croit que le
                 champ est vide et le remplit une deuxieme fois a la main */
              const champLien = zone.querySelector('[data-f="lien"][data-s="' + si + '"][data-e="' + el.dataset.e + '"]');
              if (champLien) champLien.value = ex.lien;
            }
            PR.majEtat(el, ex, fiche, si, +el.dataset.e);
          }
          sauver();
        });
      });
      $$("[data-poser-ech]", zone).forEach(b => b.addEventListener("click", () => {
        const si = +b.dataset.poserEch;
        const sel = $("ech-" + si);
        const modele = ECHAUFFEMENTS.find(e => e.id === (sel && sel.value));
        if (!modele){ flash("pg-msg", "Choisis d'abord un échauffement."); return; }
        /* on relie chaque mouvement a la base pour que la video suive */
        const lignes = modele.exercices.map(x => {
          const fiche = PR.trouve(x.nom);
          return { nom: x.nom, series: x.series, reps: x.reps, repos: x.repos,
                   note: "Échauffement", id: fiche ? fiche.id : "",
                   lien: fiche ? (fiche.lien || (fiche.video_id ? "https://www.youtube.com/watch?v=" + fiche.video_id : "")) : "" };
        });
        P.seances[si].exercices = lignes.concat(P.seances[si].exercices || []);
        const absents = modele.exercices.filter(x => !PR.trouve(x.nom)).map(x => x.nom);
        sauver(); redessiner();
        flash("pg-msg", absents.length
          ? "Échauffement ajouté. " + absents.length + " mouvement" + (absents.length > 1 ? "s ne sont pas" : " n'est pas") + " dans ta base : " + absents.join(", ")
          : "Échauffement « " + modele.nom + " » ajouté en tête de séance.");
      }));

      $$("[data-ajout-e]", zone).forEach(b => b.addEventListener("click", () => {
        P.seances[+b.dataset.ajoutE].exercices.push(PR.exoVide()); sauver(); redessiner();
      }));
      $$("[data-suppr-e]", zone).forEach(b => b.addEventListener("click", () => {
        const [si, ei] = b.dataset.supprE.split(":").map(Number);
        P.seances[si].exercices.splice(ei, 1); sauver(); redessiner();
      }));
      $$("[data-suppr-s]", zone).forEach(b => b.addEventListener("click", () => {
        P.seances.splice(+b.dataset.supprS, 1); sauver(); redessiner();
      }));
      const as = $("pg-ajout-s");
      if (as) as.addEventListener("click", () => { P.seances.push(PR.seanceVide(P.seances.length + 1)); sauver(); redessiner(); });

  },

  vueEdition(P, mode){
    /* Deux contextes, un seul editeur : « client » ecrit le programme d'une
       personne, « atelier » fabrique un modele reutilisable. Le corps des
       seances est strictement le meme — c'est le but : une seule fonction a
       corriger le jour ou il y a un defaut. */
    if (mode === "atelier") return this.enteteAtelier(P) + this.blocSeances(P) + this.piedAtelier();
    let h = `<section class="panel">
      <h2>Réglages du programme</h2>
      <div class="grid g2">
        <div><label for="pg-nom">Nom du programme</label><input id="pg-nom" type="text" value="${esc(P.nom || "")}" placeholder="Ex. Bloc 1 — 4 semaines"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label for="pg-cycle">Cycle n°</label><input id="pg-cycle" type="number" min="1" max="99" step="1" value="${esc(P.cycle || 1)}"></div>
          <div><label for="pg-duree">Durée (semaines)</label><input id="pg-duree" type="number" min="1" max="52" step="1" value="${esc(P.duree_semaines || 4)}"></div>
        </div>
        <div><label for="pg-biblio">Charger depuis ma bibliothèque</label><select id="pg-biblio"><option value="">— choisis un entraînement —</option></select></div>
        <div><label for="pg-lieu">Où s'entraîne-t-il ?</label><select id="pg-lieu">
          <option value="">Tous les lieux</option>
          ${this.lieux().map(l => `<option value="${esc(l)}"${this.lieuChoisi === l ? " selected" : ""}>${esc(l)}</option>`).join("")}
        </select></div>
        <div><label for="pg-seances">Séances par semaine</label><select id="pg-seances">
          <option value="">Peu importe</option>
          ${[2,3,4,5,6].map(n => `<option value="${n}"${String(this.seancesChoisies) === String(n) ? " selected" : ""}>${n} séances</option>`).join("")}
        </select></div>
        <div style="grid-column:1/-1"><label for="pg-prets">Programmes prêts à l'emploi</label><select id="pg-prets">
          ${this.optionsPrets()}
        </select>
          <div class="actions" style="margin-top:10px">
            <button type="button" class="btn ghost" id="pg-auto">Proposer d'après son questionnaire</button>
            <span class="msg" id="pg-auto-msg"></span>
          </div>
          <p class="note" style="margin:6px 0 0">Charge un programme complet, puis adapte-le à ce client : c'est un point de départ, pas une fatalité.</p></div>
        <div style="grid-column:1/-1"><label for="pg-note">Mot pour ton client</label><textarea id="pg-note" rows="2" placeholder="Consignes générales, priorités du bloc…">${esc(P.note || "")}</textarea></div>
      </div>
    </section>`;

    h += this.blocSeances(P);

    h += `<section class="panel">
      <div class="actions">
        <button class="btn ghost" id="pg-ajout-s">+ Ajouter une séance</button>
        <button class="btn" id="pg-save">Envoyer au client</button>
        <button class="btn ghost" id="pg-biblio-save">Enregistrer dans ma bibliothèque</button>
        <span class="msg" id="pg-msg"></span>
      </div>
      <p class="note" style="margin-top:10px">Tout est enregistré au fil de la saisie et ton client voit chaque changement tout de suite, avant même l'envoi. « Envoyer au client » date le programme (« Programme mis à jour le … » chez lui), fait démarrer la semaine 1 s'il n'a pas encore de date de début, et le fait entrer dans l'historique quand un autre le remplacera.</p>
    </section>`;
    return h;
  },

  /* Le corps de l'editeur : les seances et leurs exercices. Partage entre la
     fiche d'un client et l'atelier. */
  blocSeances(P){
    let h = "";
    (P.seances || []).forEach((sc, si) => {
      h += `<section class="panel seance">
        <div class="seance-tete">
          <div><label>Nom de la séance</label><input type="text" data-s="${si}" data-f="nom" value="${esc(sc.nom || "")}" placeholder="Séance A — Haut du corps"></div>
          <button class="del" data-suppr-s="${si}" aria-label="Supprimer la séance">×</button>
        </div>
        <div style="margin-bottom:12px"><label>Note sur la séance</label><input type="text" data-s="${si}" data-f="note" value="${esc(sc.note || "")}" placeholder="Consignes de la séance"></div>
        <div style="margin-bottom:14px"><label for="ech-${si}">Échauffement en tête de séance</label>
          <div class="ech-ligne">
            <select id="ech-${si}" data-ech="${si}">
              <option value="">— aucun —</option>
              ${ECHAUFFEMENTS.map(e => `<option value="${esc(e.id)}">${esc(e.nom)} · ${esc(e.duree)}</option>`).join("")}
            </select>
            <button type="button" class="btn ghost" data-poser-ech="${si}">Ajouter en tête</button>
          </div>
          <p class="note" style="margin:6px 0 0">Les exercices de l'échauffement sont ajoutés au-dessus des autres, avec leur fiche et leur vidéo. Tu peux ensuite les modifier ou en retirer.</p>
        </div>`;

      (sc.exercices || []).forEach((e, ei) => {
        const f = this.trouve(e.nom);
        h += `<div class="ex-ligne">
          <div class="nom-c"><label>Exercice</label>
            <input type="text" list="ex-catalogue" data-s="${si}" data-e="${ei}" data-f="nom" value="${esc(e.nom)}" placeholder="Commence à taper : Développé couché…">
            ${this.etatExo(e, f, si, ei)}
          </div>
          <div><label>Séries</label><input type="text" data-s="${si}" data-e="${ei}" data-f="series" value="${esc(e.series)}" placeholder="4"></div>
          <div><label>Reps</label><input type="text" data-s="${si}" data-e="${ei}" data-f="reps" value="${esc(e.reps)}" placeholder="8-10"></div>
          <div><label>Repos</label><input type="text" data-s="${si}" data-e="${ei}" data-f="repos" value="${esc(e.repos)}" placeholder="90 s"></div>
          <div><button class="del" data-suppr-e="${si}:${ei}" aria-label="Supprimer l'exercice">×</button></div>
          <div class="plein" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div><label>Consigne</label><input type="text" data-s="${si}" data-e="${ei}" data-f="note" value="${esc(e.note)}" placeholder="Descente contrôlée"></div>
            <div><label>Lien vidéo</label><input type="url" data-s="${si}" data-e="${ei}" data-f="lien" value="${esc(e.lien)}" placeholder="https://"></div>
          </div>
        </div>`;
      });

      h += `<div class="actions"><button class="btn ghost" data-ajout-e="${si}">+ Ajouter un exercice</button></div></section>`;
    });

    /* Une seule liste pour tous les champs : le navigateur propose les noms
       de TA base pendant la frappe. C'est ce qui garantit que la fiche et la
       video suivront — un nom tape a la main ne correspond a rien. */
    h += `<datalist id="ex-catalogue">${(this.exos || []).map(x => `<option value="${esc(x.nom)}">`).join("")}</datalist>`;
    return h;
  },

  /* ---------- atelier : en-tete et pied ---------- */
  enteteAtelier(P){
    const opt = (v, l, sel) => `<option value="${esc(v)}"${sel === v ? " selected" : ""}>${esc(l)}</option>`;
    return `<section class="panel">
      <h2>Le modèle</h2>
      <div class="grid g2">
        <div style="grid-column:1/-1"><label for="at-nom">Nom du programme</label>
          <input id="at-nom" type="text" value="${esc(P.nom || "")}" placeholder="Ex. Haut / Bas — 4 séances"></div>
        <div><label for="at-lieu">Lieu</label><select id="at-lieu">
          ${["", "Maison sans matériel", "Maison avec haltères", "Salle complète", "Extérieur"].map(l => opt(l, l || "— à préciser —", P.lieu || "")).join("")}
        </select></div>
        <div><label for="at-seances">Séances par semaine</label><select id="at-seances">
          ${[2,3,4,5,6].map(n => `<option value="${n}"${String(P.seances_semaine) === String(n) ? " selected" : ""}>${n} séances</option>`).join("")}
        </select></div>
        <div><label for="at-niveau">Niveau</label><select id="at-niveau">
          ${["Debutant","Intermediaire","Avance"].map(l => opt(l, l === "Debutant" ? "Débutant" : l === "Avance" ? "Avancé" : "Intermédiaire", P.niveau || "Debutant")).join("")}
        </select></div>
        <div><label for="at-objectif">Objectif</label><select id="at-objectif">
          ${["Prise de muscle","Perte de gras","Recomposition","Remise en forme","Performance"].map(l => opt(l, l, P.objectif || "Prise de muscle")).join("")}
        </select></div>
        <div style="grid-column:1/-1"><label for="at-note">Note du programme</label>
          <textarea id="at-note" rows="2" placeholder="Pour qui, sur combien de semaines, ce qu'il faut surveiller">${esc(P.note || "")}</textarea></div>
        <div style="grid-column:1/-1"><label for="at-charger">Reprendre un programme existant</label>
          <select id="at-charger"><option value="">— repartir de zéro —</option></select>
          <p class="note" style="margin:6px 0 0">Charge un programme de ta base pour le modifier. En l'enregistrant sous le même nom, tu le remplaces.</p></div>
      </div>
    </section>`;
  },

  piedAtelier(){
    return `<section class="panel">
      <div class="actions">
        <button class="btn ghost" id="pg-ajout-s">+ Ajouter une séance</button>
        <button class="btn" id="at-base">Enregistrer dans ma base</button>
        <button class="btn ghost" id="pg-biblio-save">Enregistrer dans ma bibliothèque</button>
        <button class="btn ghost" id="at-vider">Repartir de zéro</button>
        <span class="msg" id="pg-msg"></span>
      </div>
      <p class="note" style="margin-top:10px">« Ma base » rend le programme disponible dans « Programmes prêts à l'emploi », sur la fiche de n'importe quel client. « Ma bibliothèque » le garde pour toi seul.</p>
    </section>`;
  },

  html(){
    return `<div id="prog-vue"><section class="panel"><div class="empty">Chargement…</div></section></div><div id="prog-obj"></div><div id="prog-jr"></div><div id="prog-hist"></div>`;
  },

  async init(){
    const self = this;
    const edition = Auth.estCoach() && Store.idConsulte;
    if (edition && !this.prets){ try { this.prets = await Catalogue.programmes(); } catch(e){ this.prets = []; } }
    if (edition && !this.exos){
      try {
        this.exos = (await Catalogue.exercices()).slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr"));
        this.idxExos = await Catalogue.indexExercices();
      } catch(e){ this.exos = []; this.idxExos = {}; }
    }
    const P = await Store.lire(this.cle, { nom:"", note:"", seances:[], maj:"" });
    /* le questionnaire sert a proposer un programme adapte */
    let intake = {};
    if (edition){ try { intake = await Store.lire("intake", {}) || {}; } catch(e){} }
    const zone = $("prog-vue");
    if (!zone) return;
    if (Store.nonLus.has(P)){ pageHorsLigne(zone); return; }   // v71 (F) : lecture ratee : « Pas de connexion », pas un programme vide

    const sauver = () => Store.ecrire(self.cle, P);

    if (!edition){
      const J = await Store.lire(Journal.cle, Journal.vide());
      if (Store.nonLus.has(J)){ pageHorsLigne(zone); return; }   // v71 (F)
      if (!Array.isArray(J.seances)) J.seances = [];
      const dessiner = () => { zone.innerHTML = self.vueLecture(P, J); self.brancherFiches(zone); };
      dessiner();
      /* apres une seance notee : on redessine (badge « notée », compteur) et on rebranche le journal */
      const apres = () => { dessiner(); Journal.brancher(zone, P, J, apres); };
      await Journal.brancher(zone, P, J, apres);
      Historique.monter("programme", "prog-hist");
      return;
    }

    const redessiner = () => { zone.innerHTML = self.vueEdition(P); brancher(); };

    /* Le bouton « L'ajouter » apparait au fil de la frappe : on ecoute la
       zone entiere plutot que chaque bouton, sinon les nouveaux seraient morts. */
    zone.addEventListener("click", async ev => {
      const b = ev.target.closest("[data-ajout-base]");
      if (!b || !zone.contains(b)) return;
      const [si, ei] = b.dataset.ajoutBase.split(":").map(Number);
      const ex = P.seances[si].exercices[ei];
      const lien = await UI.demander("Lien YouTube de la démonstration pour « " + ex.nom + " » :\n\n" +
                          "Laisse vide si tu n'en as pas — tu pourras l'ajouter plus tard.", ex.lien || "", { titre: "Ajouter à ma base", ok: "Ajouter", type: "url", placeholder: "https://" });
      if (lien === null) return;                    // annulé
      b.disabled = true; b.textContent = "…";
      try {
        const cree = await Catalogue.ajouterExercice(ex.nom, lien.trim(), "");
        ex.id = cree.id;
        if (lien.trim()) ex.lien = lien.trim();
        self.exos = (await Catalogue.exercices()).slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr"));
        self.idxExos = await Catalogue.indexExercices();
        if (sauver() === false) return;
        redessiner();
      } catch(err){
        b.disabled = false; b.textContent = "L'ajouter";
        UI.alerte("Ajout impossible : " + (err.message || "erreur inconnue"));
      }
    });


    const brancher = () => {
      self.brancherEditeur(P, zone, sauver, redessiner);

      const n = $("pg-nom"), no = $("pg-note"), cy = $("pg-cycle"), du = $("pg-duree");
      if (n)  n.addEventListener("input", () => { P.nom = n.value; sauver(); });
      if (no) no.addEventListener("input", () => { P.note = no.value; sauver(); });
      /* le cycle et la duree : ce qui fait « Cycle 01 · Semaine 2 sur 4 » chez le client */
      if (cy) cy.addEventListener("input", () => { const v = parseInt(cy.value, 10); if (v >= 1) P.cycle = v; sauver(); });
      if (du) du.addEventListener("input", () => { const v = parseInt(du.value, 10); if (v >= 1) P.duree_semaines = v; sauver(); });

      const auto = $("pg-auto");
      if (auto) auto.addEventListener("click", async () => {
        const choix = self.proposer(intake);
        if (!choix){
          flash("pg-auto-msg", (self.prets || []).length
            ? "Rien ne correspond vraiment à son questionnaire. Choisis à la main."
            : "Ton catalogue de programmes est vide : lance l'import.");
          return;
        }
        if (P.seances.length && !(await UI.confirmer("Remplacer le programme en cours par « " + choix.prog.nom + " » ?", { ok: "Oui, remplacer" }))) return;
        if (!(await Historique.avantRemplacement("programme", P))) return;
        P.debut = aujourdhui(); P.maj = "";
        P.nom = choix.prog.nom;
        P.note = choix.prog.note || P.note;
        P.seances = JSON.parse(JSON.stringify(choix.prog.seances || []));
        /* on rebranche chaque exercice sur la base : le modele stocke des
           noms, on veut les fiches et les videos qui vont avec */
        P.seances.forEach(sc => (sc.exercices || []).forEach(e => {
          const f = self.trouve(e.nom);
          if (f){ e.id = f.id; if (!e.lien) e.lien = f.lien || (f.video_id ? "https://www.youtube.com/watch?v=" + f.video_id : ""); }
        }));
        if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
        redessiner();
        flash("pg-auto-msg", "« " + choix.prog.nom + " » — retenu pour " +
          (choix.pour.length ? choix.pour.join(", ") : "le meilleur compromis") + ". Relis-le avant d'envoyer.");
      });

      const save = $("pg-save");
      if (save) save.addEventListener("click", () => {
        /* Un programme vide envoye, c'est un client qui ouvre son onglet
           et n'y trouve rien — sans savoir si c'est un bug ou un oubli. */
        const exos = (P.seances || []).reduce((n, sc) => n + (sc.exercices || []).filter(e => e.nom).length, 0);
        if (!exos){ flash("pg-msg", "Ce programme est vide : ajoute au moins une séance avec un exercice avant de l'envoyer."); return; }
        P.maj = new Date().toLocaleDateString("fr-FR");
        if (!P.debut) P.debut = aujourdhui();     // la semaine 1 commence a l'envoi
        if (Store.ecrire(self.cle, P) === false){ flash("pg-msg", "Programme non envoyé : relis le message affiché."); return; }
        flash("pg-msg", "Programme envoyé. Ton client le voit dès sa prochaine ouverture.");
      });

      const bs = $("pg-biblio-save");
      if (bs) bs.addEventListener("click", async () => {
        const nom = await UI.demander("Sous quel nom l'enregistrer dans ta bibliothèque ?", P.nom || "Entraînement", { titre: "Ma bibliothèque", ok: "Enregistrer" });
        if (!nom) return;
        try {
          await Auth.appel("/rest/v1/bibliotheque", {
            method: "POST",
            headers: { "Prefer": "return=minimal" },
            body: [{ coach_id: Auth.utilisateur().id, nom, note: P.note || "", contenu: { type:"entrainement", seances: P.seances } }]
          });
          flash("pg-msg", "Enregistré dans ta bibliothèque.");
          chargerBiblio();
        } catch(e){ flash("pg-msg", "Enregistrement impossible."); }
      });

      chargerBiblio();
      chargerPrets();
    };

    /* Catalogue partage : les programmes tout faits (table programmes_types) */
    /* Le catalogue est charge une fois pour toutes avant le premier rendu :
       la liste etait auparavant remplie apres coup, ce qui obligeait a
       choisir deux fois quand le clic arrivait avant la reponse du serveur. */
    const chargerPrets = async () => {
      const sel = $("pg-prets"); if (!sel) return;
      const l = self.prets || [];
      if (!l.length){ sel.innerHTML = `<option value="">— aucun programme dans le catalogue —</option>`; return; }
      ["pg-lieu","pg-seances"].forEach(id => {
        const f = $(id); if (!f) return;
        f.addEventListener("change", () => {
          if (id === "pg-lieu") self.lieuChoisi = f.value; else self.seancesChoisies = f.value;
          $("pg-prets").innerHTML = self.optionsPrets();
        });
      });
      sel.onchange = async () => {
        if (!sel.value) return;
        const x = l.find(y => String(y.id) === sel.value);
        if (!x) return;
        if (!(await UI.confirmer("Charger « " + x.nom + " » ? Il remplacera les séances actuelles de ce client.", { ok: "Charger" }))){ sel.value = ""; return; }
        if (!(await Historique.avantRemplacement("programme", P))){ sel.value = ""; return; }
        P.debut = aujourdhui(); P.maj = "";
        P.seances = JSON.parse(JSON.stringify(x.seances || []));
        if (!P.nom) P.nom = x.nom;
        if (!P.note && x.note) P.note = x.note;
        if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
        redessiner();
      };
    };

    const chargerBiblio = async () => {
      const sel = $("pg-biblio"); if (!sel) return;
      try {
        const tout = await Auth.appel("/rest/v1/bibliotheque?select=id,nom,contenu&order=cree_le.desc");
        const l = (tout || []).filter(x => !x.contenu || x.contenu.type !== "repas");
        sel.innerHTML = `<option value="">— choisis un entraînement —</option>` +
          l.map(x => `<option value="${x.id}">${esc(x.nom)}</option>`).join("");
        sel.onchange = async () => {
          if (!sel.value) return;
          if (!(await UI.confirmer("Charger cet entraînement ? Il remplacera les séances actuelles de ce client.", { ok: "Charger" }))) { sel.value = ""; return; }
          const r = await Auth.appel("/rest/v1/bibliotheque?id=eq." + sel.value + "&select=contenu,nom,note");
          if (r && r[0]){
            if (!(await Historique.avantRemplacement("programme", P))){ sel.value = ""; return; }
            P.debut = aujourdhui(); P.maj = "";
            P.seances = JSON.parse(JSON.stringify(r[0].contenu.seances || []));
            if (!P.nom) P.nom = r[0].nom;
            if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
            redessiner();
          }
        };
      } catch(e){}
    };

    redessiner();
    Regularite.objectifsCoach("prog-obj", P, sauver);
    Journal.resumeCoach("prog-jr");
    Historique.monter("programme", "prog-hist", async (C) => {
      if (!(await Historique.avantRemplacement("programme", P))) return false;
      P.nom = C.nom || P.nom; P.note = C.note || ""; P.seances = C.seances || [];
      P.debut = aujourdhui(); P.maj = "";
      if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
      redessiner();
      UI.alerte(trad("Programme remis en place. Relis-le, puis clique sur « Envoyer » pour le dater."));
      return true;
    });
  }
};

