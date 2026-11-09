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
      /* v89 (lot 4) : lecture ratée (réseau, 5xx) : « Pas de connexion », le bouton reste pour réessayer — avant, « Aucun ancien
         programme » s'affichait à tort et le bouton disparaissait */
      if (Store.nonLus.has(H)){ bouton.disabled = false; boite.innerHTML = `<p class="note ko" style="margin:8px 0 0" data-hist-hors-ligne>${esc(Store.idConsulte ? "Pas de connexion : les données de ce client n'ont pas pu être chargées." : trad("Pas de connexion : tes données n'ont pas pu être chargées."))}</p>`; return; }
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
    /* v96 (relecture) : la clé de la séance en cours : l'identifiant de la séance (sid) s'il existe, sinon sa place ; un
       brouillon d'avant la v96 (rangé par la place) est repris tant que la séance est encore à sa place d'origine */
    k(P, si){ const sc = P && Array.isArray(P.seances) ? P.seances[si] : null; return sc && typeof sc.sid === "string" && sc.sid ? sc.sid : si; },
    lireDe(P, si){
      const k = this.k(P, si); if (k === si) return this.lire(si);
      const b = this.lire(k); if (b) return b;
      return (P && P.places && P.places[String(si)] === k) ? this.lire(si) : null;
    },
    effacerDe(P, si){ const k = this.k(P, si); this.effacer(k); if (k !== si && P && P.places && P.places[String(si)] === k) this.effacer(si); },
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

  /* v96 : la séance du programme P (son index, ou -1) que désigne une séance notée x. Nouvelle séance notée : par
     l'identifiant fixe de la séance (sid). Ancienne (sans sid, ou programme sans identifiants) : par la place qu'elle avait
     quand elle a été notée — P.places relie ces anciennes places aux identifiants (posé quand le programme a reçu ses
     identifiants) ; sans P.places, la place telle quelle (comme avant la v96). Une séance retirée : -1 (jamais une autre). */
  place(P, x){
    const l = (P && Array.isArray(P.seances)) ? P.seances : [];
    if (!x || typeof x !== "object") return -1;
    const parSid = s => l.findIndex(sc => sc && typeof sc === "object" && sc.sid === s);
    const avecSids = l.some(sc => sc && typeof sc === "object" && typeof sc.sid === "string" && sc.sid);
    if (typeof x.sid === "string" && x.sid && avecSids) return parSid(x.sid);
    const si = Number.isInteger(x.si) ? x.si : (typeof x.si === "string" && /^\d+$/.test(x.si) ? +x.si : -1);
    if (si < 0) return -1;
    const telle = si < l.length ? si : -1;   // la place telle quelle (ce que voyait la version qui l'a notée)
    if (avecSids && P.places && typeof P.places === "object" && !Array.isArray(P.places)){
      const s = P.places[String(si)], parPlace = typeof s === "string" ? parSid(s) : -1;
      /* relecture du 10/11 : P.places ne décrit que les places d'AVANT la publication qui a posé les identifiants
         (places_le). Une séance notée après, sans identifiant (téléphone resté sur une ancienne version de l'app), désigne
         la place telle quelle ; le jour même, le nom de la séance notée départage. */
      const le = typeof P.places_le === "string" ? P.places_le : "", d = String(x.date || "");
      if (!le || d < le) return parPlace;
      if (d > le) return telle;
      const nom = String(x.nom || "");
      if (nom && telle > -1 && String((l[telle] || {}).nom || "") === nom && !(parPlace > -1 && String((l[parPlace] || {}).nom || "") === nom)) return telle;
      return parPlace;
    }
    return telle;
  },
  /* v96 : « 4 × 8 à 52,5 kg » (séries notées × répétitions les plus basses, à la charge la plus haute) */
  resumeCourt(e){
    const f = (e && Array.isArray(e.series) ? e.series : []).filter(s => num(s.r) > 0);
    if (!f.length) return "";
    const rmin = Math.min(...f.map(s => num(s.r))), rmax = Math.max(...f.map(s => num(s.r))), kg = Math.max(...f.map(s => num(s.c)));
    const reps = rmin === rmax ? String(rmin) : rmin + "-" + rmax;
    return f.length + " × " + reps + (kg > 0 ? " " + trad("à {kg} kg", { kg: this.kg(kg) }) : "");
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

  htmlSeance(J, sc, si, B, P){   // v71 (G) : B = brouillon de cette seance (Journal.brouillon.lire) ou null ; v96 : P, le programme
    const exos = (sc.exercices || []).filter(e => e.nom);
    if (!exos.length) return "";
    let der = null;
    for (let i = J.seances.length - 1; i >= 0; i--) if (this.place(P, J.seances[i]) === si){ der = J.seances[i]; break; }
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
        pl.innerHTML = sc ? self.htmlSeance(J, sc, si, self.brouillon.lireDe(P, si), P) : "";
      });
      $$("[data-jr-ouvrir]", zone).forEach(b => b.addEventListener("click", () => {
        b.closest(".jr-zone").querySelector("[data-jr-form]").hidden = false;
        b.hidden = true;
      }));
      /* v71 (G) : chaque frappe met le brouillon de la seance sur l'appareil ; « Effacer le brouillon » le retire */
      $$("[data-jr-form]", zone).forEach(f => { const boite = f.closest(".jr-zone"), si = +boite.dataset.jr;
        f.addEventListener("input", () => self.brouillon.ecrire(self.brouillon.k(P, si), self.brouillon.depuis(boite)));
      });
      $$("[data-jr-effacer]", zone).forEach(b => b.addEventListener("click", () => { self.brouillon.effacerDe(P, +b.dataset.jrEffacer); remplir(); }));
      /* v71 (G) : « Annuler » avec des chiffres saisis demande confirmation (fenetre de l'app) */
      $$("[data-jr-annuler]", zone).forEach(b => b.addEventListener("click", async () => {
        const boite = b.closest(".jr-zone"), si = +boite.dataset.jr;
        if (self.brouillon.saisi(boite) && !(await UI.confirmer(trad("Abandonner cette séance ? Les chiffres saisis seront effacés."), { ok: trad("Abandonner"), annuler: trad("Continuer"), danger: true }))) return;
        self.brouillon.effacerDe(P, si);
        remplir();
      }));
      $$("[data-jr-fin]", zone).forEach(b => b.addEventListener("click", async () => {
        const si = +b.dataset.jrFin, sc = P.seances[si], boite = b.closest(".jr-zone");
        if (b.disabled) return;
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
        /* v102 : les chiffres sont lus ci-dessus ; le journal est relu juste avant d'écrire (une séance notée sur un autre
           appareil depuis l'ouverture de la page n'est jamais effacée), et l'écriture se fait même si la page a changé entre-temps ;
           relecture impossible : comme avant (copie gardée sur l'appareil) */
        b.disabled = true;
        try { const frais = await Store.lire(self.cle, self.vide()); if (!Store.nonLus.has(frais) && Array.isArray(frais.seances)) J.seances = frais.seances; }
        catch(e){}
        finally { b.disabled = false; }
        const date = aujourdhui();
        /* v96 : la même séance notée deux fois le même jour remplace la première (reconnue par Journal.place) ; une séance
           notée garde sa place (si, lue par les anciennes versions de l'app) ET l'identifiant fixe de la séance (sid) */
        J.seances = J.seances.filter(x => !(x.date === date && self.place(P, x) === si));
        const ligne = { date: date, si: si, nom: sc.nom || "", exos: exos };
        if (typeof sc.sid === "string" && sc.sid) ligne.sid = sc.sid;
        J.seances.push(ligne);
        if (J.seances.length > self.max) J.seances = J.seances.slice(-self.max);
        if (Store.ecrire(self.cle, J) === false) return;   // refusee (message deja affiche) : le brouillon reste
        self.brouillon.effacerDe(P, si);   // v71 (G) : seulement apres une ecriture acceptee, avant de redessiner
        if (!zone.isConnected) return;   // v102 : page quittée pendant la relecture : la séance est enregistrée, rien à redessiner
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
        const i = +c.dataset.obj, ancien = OF.faits[i];
        OF.faits[i] = c.checked;
        if (Store.ecrire("objectifs_faits", OF) === false) OF.faits[i] = ancien;   // v91 : rien d'enregistré : la case revient à son état d'avant
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

/* ------------------------------------------------------------------
   v96 (chantier 1 de la nuit du 10/11, plan-etape3 3a à 3c) — LE BROUILLON DES PROGRAMMES
   Le coach ne modifie plus le programme d'un client en direct : il travaille dans un brouillon rangé sur SON compte
   (clé brouillons_programme, une entrée par client), et le client ne voit rien avant « Publier les changements ».
     { v: 1, clients: { <compte du client>: { programme, base_maj, debut_le, ecrit_le, appareil, nouveau_bloc? } } }
   - base_maj : maj_le du programme publié quand le brouillon a commencé (deux appareils : relu avant de publier) ;
   - appareil : cette page (un autre appareil ou un autre onglet qui écrit le même brouillon se voit à la publication).
   Le document programme garde sa forme : seuls des champs s'ajoutent (sid de chaque séance, places, publie_le,
   bloc_annonce) ; une ancienne version de l'app le lit sans rien perdre. Aucune écriture à la lecture.
   ------------------------------------------------------------------ */
const BrouillonProg = {
  cle: "brouillons_programme",
  appareil: Math.random().toString(36).slice(2, 10),
  vide(){ return { v: 1, clients: {} }; },

  async lire(){
    const D = await Store.lire(this.cle, this.vide(), { chezMoi: true });
    if (!Forme.objet(D.clients)) D.clients = {};   // en mémoire seulement (rien n'est écrit à la lecture)
    return D;
  },
  entree(D, uid){
    const e = D && Forme.objet(D.clients) ? D.clients[uid] : null;
    return (Forme.objet(e) && Forme.objet(e.programme)) ? e : null;
  },

  /* ce que voit le client (sans les champs techniques) : sert à dire « brouillon non publié » ou « rien à publier » */
  empreinte(x){
    const s = v => v == null ? "" : String(v);
    x = Forme.objet(x) ? x : {};
    return JSON.stringify({ nom: s(x.nom), note: s(x.note), cycle: s(x.cycle || 1), duree: s(x.duree_semaines || 4),
      seances: (Array.isArray(x.seances) ? x.seances : []).filter(Forme.objet).map(sc => ({ nom: s(sc.nom), note: s(sc.note),
        exercices: (Array.isArray(sc.exercices) ? sc.exercices : []).filter(Forme.objet).map(e => [s(e.nom), s(e.series), s(e.reps), s(e.repos), s(e.note), s(e.lien)]) })) });
  },
  differe(b, P){ return this.empreinte(b) !== this.empreinte(P); },

  /* --- identifiants fixes des séances (le « ✓ notée » ne glisse plus quand une séance bouge ou disparaît) --- */
  nouveauSid(vus){ let s; do { s = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); } while (vus.has(s)); return s; },
  /* une séance sans identifiant en reçoit un ; programme qui n'en avait aucun : P.places relie chaque ancienne place à
     son identifiant, pour que les séances notées avant (rangées par leur place) restent sur la bonne séance */
  assurerSids(b){
    if (!Array.isArray(b.seances)) b.seances = [];
    const ancien = !b.seances.some(sc => Forme.objet(sc) && typeof sc.sid === "string" && sc.sid) && !Forme.objet(b.places);
    const vus = new Set();
    b.seances.forEach((sc, i) => {
      if (!Forme.objet(sc)) return;
      if (typeof sc.sid !== "string" || !sc.sid || vus.has(sc.sid)){
        sc.sid = this.nouveauSid(vus);
        if (ancien){ if (!Forme.objet(b.places)) b.places = {}; b.places[String(i)] = sc.sid; }
      }
      vus.add(sc.sid);
    });
    return b;
  },
  /* une copie de travail du programme publié (identifiants posés dans la copie, jamais dans le publié) */
  depuis(P){
    const b = JSON.parse(JSON.stringify(Object.assign({ nom: "", note: "", seances: [], maj: "" }, P || {})));
    delete b.objectifs;   // les objectifs du mois restent dans le programme publié (écrits tout de suite)
    return this.assurerSids(b);
  },
  /* « Nouveau bloc à partir de celui-ci » : copie du publié, cycle + 1, nom « Bloc N » → « Bloc N+1 », semaine 1 à la publication */
  nouveauBloc(P){
    const b = this.depuis(P), c = Math.max(1, parseInt(P.cycle, 10) || 1);
    b.cycle = c + 1; b.debut = ""; b.maj = "";
    const m = /^(.*?\bbloc\s*)(\d+)(.*)$/i.exec(b.nom || "");
    if (m) b.nom = m[1] + (parseInt(m[2], 10) + 1) + m[3];
    return b;
  },
  /* le programme d'avant (pour « ≈ identique ») : seulement pendant un nouveau bloc */
  reference(D, uid, P){ const e = this.entree(D, uid); return e && Forme.objet(e.nouveau_bloc) ? P : null; },
  identique(ref, sc, e){
    if (!ref || !e || !e.nom) return false;
    const k = Normaliser.aplatir(e.nom), meme = x => Normaliser.aplatir(x.nom || "") === k && String(x.series || "") === String(e.series || "") && String(x.reps || "") === String(e.reps || "") && String(x.repos || "") === String(e.repos || "");
    const l = (ref.seances || []).filter(Forme.objet);
    const avant = l.find(x => sc.sid && x.sid === sc.sid) || l.find(x => Normaliser.aplatir(x.nom || "") === Normaliser.aplatir(sc.nom || ""));
    return !!(avant && (avant.exercices || []).some(x => Forme.objet(x) && meme(x)));
  },

  /* relecture du 10/11 : le document contient les brouillons de TOUS les clients. Une page n'écrit jamais l'ensemble tel
     qu'elle l'a lu à l'ouverture (un brouillon fait depuis sur un autre appareil serait effacé, ou un brouillon publié
     ailleurs reviendrait) : 700 ms après la saisie, elle relit la base, n'y remplace que l'entrée de SON client, puis
     écrit (copie gardée sur l'appareil comme toute saisie). Base illisible (hors ligne) : la version de la page part, comme
     toute saisie hors ligne (Store.reprendre ne l'enverra pas par-dessus une version plus récente). */
  _minuteurs: {},
  planifier(D, uid){
    if (Store.nonLus.has(D)){ Store.lectureRatee(Store.moi() + "|" + this.cle); return false; }
    try { Store.garder(Store.moi(), this.cle, D); } catch(e){}   // la copie sur l'appareil tout de suite (onglet fermé dans la seconde : rien de perdu)
    clearTimeout(this._minuteurs[this.cle + uid]);
    this._minuteurs[this.cle + uid] = setTimeout(() => { delete this._minuteurs[this.cle + uid]; this.fusionner(D, uid); }, 700);
    return true;
  },
  async fusionner(D, uid){
    const moi = Store.moi(); if (!moi) return false;
    let base = null;
    try { const l = await this.ligne(moi, this.cle); base = (l && Forme.objet(l.contenu)) ? l.contenu : this.vide(); } catch(e){ base = null; }
    if (base && Forme.objet(base.clients)){
      Object.keys(D.clients).forEach(k => { if (k !== uid) delete D.clients[k]; });
      Object.keys(base.clients).forEach(k => { if (k !== uid) D.clients[k] = base.clients[k]; });
    }
    if (Store.ecrire(this.cle, D, { chezMoi: true }) === false) return false;
    Store.envoyerCle(this.cle, moi);   // déjà attendu 700 ms : part tout de suite
    return true;
  },
  /* v102 : un brouillon retiré (annulé, publié, identique au publié) laisse une marque datée, sans programme (entree() l'ignore) :
     une copie plus ancienne rejouée plus tard (autre appareil, hors ligne) ne le fait pas revenir */
  tombe(){ const m = new Date().toISOString(); return { retire_le: m, ecrit_le: m, appareil: this.appareil }; },
  /* v102 : réunit deux documents de brouillons ENTRÉE PAR ENTRÉE (le plus récent écrit de chaque client gagne) ; les marques de
     retrait de plus de 30 jours disparaissent. Sert à la reprise d'une copie gardée sur l'appareil (Store.reprendre,
     Store.copieAServir) : jamais plus un document entier rejoué par-dessus les brouillons faits ailleurs. */
  fusionnerEntrees(base, copie){
    const out = this.vide(), b = Forme.objet(base) && Forme.objet(base.clients) ? base.clients : {}, c = Forme.objet(copie) && Forme.objet(copie.clients) ? copie.clients : {};
    const limite = new Date(Date.now() - 30 * 86400000).toISOString();
    new Set(Object.keys(b).concat(Object.keys(c))).forEach(k => {
      const x = b[k], y = c[k];
      const e = !Forme.objet(x) ? y : !Forme.objet(y) ? x : (String(y.ecrit_le || "") > String(x.ecrit_le || "") ? y : x);
      if (!Forme.objet(e)) return;
      if (e.retire_le && !e.programme && String(e.retire_le) < limite) return;
      out.clients[k] = e;
    });
    return out;
  },
  enAttente(cle){ return Object.keys(this._minuteurs).some(k => k.indexOf(cle) === 0); },

  /* « Publier » et la sortie de page : la saisie qui attend part tout de suite (relue, fusionnée) et on attend la base */
  async vider(D, uid){
    if (this._minuteurs[this.cle + uid]){ clearTimeout(this._minuteurs[this.cle + uid]); delete this._minuteurs[this.cle + uid]; await this.fusionner(D, uid); }
    return await Store.envoyerConfirme(this.cle, { chezMoi: true }).catch(() => false);
  },

  /* range le brouillon de ce client (sur le compte du coach) ; identique au publié : l'entrée est retirée */
  ranger(D, uid, b, P, majPublie, extra){
    if (!Forme.objet(D.clients)) D.clients = {};
    const avant = this.entree(D, uid);
    if (!this.differe(b, P) && !(extra && extra.nouveau_bloc) && !(avant && avant.nouveau_bloc)){
      if (!avant) return true;   // rien à ranger, rien d'écrit
      D.clients[uid] = this.tombe();
    } else {
      const maintenant = new Date().toISOString();
      D.clients[uid] = Object.assign({}, avant || { base_maj: majPublie || null, debut_le: maintenant }, extra || {},
        { programme: b, ecrit_le: maintenant, appareil: this.appareil });
    }
    return this.planifier(D, uid);
  },
  retirer(D, uid){
    if (!this.entree(D, uid)) return true;
    D.clients[uid] = this.tombe();
    return this.planifier(D, uid);
  },

  /* la ligne de la base, relue juste avant de publier (jamais le cache) ; erreur réseau : exception */
  async ligne(uid, cle){
    const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(cle) + "&select=contenu,maj_le");
    return (r && r[0]) || null;
  },
  /* le brouillon de la base a été écrit par un autre appareil (ou onglet) APRÈS la dernière écriture de cette page, et il est
     différent : sans comparer les heures de deux appareils (leurs horloges peuvent différer). Entrée de la base écrite par un
     autre appareil et identique à celle que la page a lue à l'ouverture (même ecrit_le, même appareil) : pas de conflit. */
  autreAppareil(autres, moiE, b){
    if (!Forme.objet(autres) || !Forme.objet(autres.programme) || autres.appareil === this.appareil || !this.differe(autres.programme, b)) return false;
    return !moiE || moiE.appareil !== autres.appareil || String(moiE.ecrit_le || "") !== String(autres.ecrit_le || "");
  },
  dateHeure(iso){ const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString(locale()) + " " + d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }); },

  /* Publier : { ok, programme, D } ; { ok:false, annule } (le coach a dit non) ; { ok:false, refus } (base) ; { ok:false } (réseau) */
  async publier(uid, P, b, D, majPublie){
    const moi = Store.moi(); if (!moi || !uid) return { ok: false };
    await this.vider(D, uid);   // le brouillon tapé à l'instant part d'abord (relu, fusionné)
    const objOk = await Store.envoyerConfirme("programme").catch(() => false);   // un objectif du mois tapé à l'instant aussi (relu ensuite)
    if (!objOk && Store.aUneCopie(uid, "programme")) return { ok: false, attente: true };   // v102 : il attend son envoi : on ne publie pas par-dessus
    let lP, lD;
    try { await Auth.assurer(); [lP, lD] = await Promise.all([this.ligne(uid, "programme"), this.ligne(moi, this.cle)]); }
    catch(e){ return { ok: false, refus: !!(e && e.statut >= 400 && e.statut < 500 && [401, 408, 429].indexOf(e.statut) === -1) }; }
    if (Store.cible() !== uid) return { ok: false, quitte: true };   // v102 : fiche quittée (pas un « non » du coach)
    const enBase = Forme.cle("programme", lP && lP.contenu) || {};
    /* v102 : la base a déjà exactement ce brouillon, publié (une réponse perdue au premier essai) : ni fenêtre, ni archive, ni
       nouvelle semaine 1 ; le brouillon est retiré */
    if (enBase.publie_le && this.empreinte(enBase) === this.empreinte(b)){
      Object.keys(D.clients || {}).forEach(k => { if (k !== uid) delete D.clients[k]; });
      const autres0 = Forme.objet(lD && lD.contenu) && Forme.objet(lD.contenu.clients) ? lD.contenu.clients : {};
      Object.keys(autres0).forEach(k => { if (k !== uid) D.clients[k] = autres0[k]; });
      D.clients[uid] = this.tombe(); this.planifier(D, uid);
      Store.boite(uid).programme = P; Store.majLu[uid + "|programme"] = lP.maj_le || null;
      return { ok: true, programme: enBase, D: D };
    }
    /* 1. le programme publié a changé depuis l'ouverture de la page (autre appareil, ancienne version de l'app) */
    if (this.empreinte(enBase) !== this.empreinte(P)){
      const quand = lP && lP.maj_le ? this.dateHeure(lP.maj_le) : "";
      if (!(await UI.confirmer(trad("Le programme de ce client a été modifié ailleurs (autre appareil ou autre onglet{q}) depuis que tu as ouvert cette page. Le remplacer par ton brouillon ?", { q: quand ? ", " + quand : "" }), { ok: trad("Remplacer"), annuler: trad("Ne rien publier"), danger: true }))) return { ok: false, annule: true };
    }
    /* 2. le même brouillon a été modifié sur un autre appareil après cette page */
    const autres = Forme.objet(lD && lD.contenu) && Forme.objet(lD.contenu.clients) ? lD.contenu.clients[uid] : null;
    const moiE = this.entree(D, uid);
    if (this.autreAppareil(autres, moiE, b)){
      if (!(await UI.confirmer(trad("Ce brouillon a été modifié sur un autre appareil ({q}). Publier la version de cet appareil ? Celle de l'autre appareil sera remplacée.", { q: this.dateHeure(autres.ecrit_le) || "?" }), { ok: trad("Publier cette version"), annuler: trad("Ne rien publier"), danger: true }))) return { ok: false, annule: true };
    }
    if (Store.cible() !== uid) return { ok: false, quitte: true };   // v102 : fiche quittée (pas un « non » du coach)
    /* 3. l'ancien programme (celui de la base) entre dans l'historique ; échec : on demande, comme avant */
    if (Historique.utile("programme", enBase)){
      const archive = Object.assign({}, enBase, { maj: enBase.maj || enBase.debut || aujourdhui() });
      if (!(await Historique.archiver("programme", archive)) && !(await UI.confirmer(trad("L'ancien programme n'a pas pu être rangé dans l'historique. Le remplacer quand même ?"), { ok: trad("Remplacer"), danger: true }))) return { ok: false, annule: true };
    }
    if (Store.cible() !== uid) return { ok: false, quitte: true };   // v102 : fiche quittée (pas un « non » du coach)
    /* 4. le nouveau programme, en UNE écriture (tout ou rien) : sans copie d'attente, rien ne partira plus tard sans le coach */
    const N = JSON.parse(JSON.stringify(b));
    this.assurerSids(N);
    N.objectifs = enBase.objectifs || P.objectifs;   // les objectifs du mois : ceux de la base (écrits à part)
    if (!N.objectifs) delete N.objectifs;
    N.maj = new Date().toLocaleDateString("fr-FR");
    if (!N.debut) N.debut = aujourdhui();     // la semaine 1 commence à la publication (nouveau programme, nouveau bloc)
    const nb = moiE && Forme.objet(moiE.nouveau_bloc);
    if (nb) N.bloc_annonce = { cycle: Math.max(1, parseInt(N.cycle, 10) || 1), nom: String(N.nom || ""), le: aujourdhui() };
    N.publie_le = new Date().toISOString();
    if (Forme.objet(N.places) && typeof N.places_le !== "string") N.places_le = aujourdhui();   // relecture : depuis quand les identifiants valent
    /* --- 5 (relecture) : réponse perdue (délai dépassé) alors que la base a écrit : on relit avant de dire « Pas publié » --- */
    try {
      await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", {
        method: "POST", headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: [{ user_id: uid, outil: "programme", contenu: N, maj_le: N.publie_le }]
      });
    } catch(e){
      const refus = !!(e && e.statut >= 400 && e.statut < 500 && [401, 408, 429].indexOf(e.statut) === -1);
      let arrive = false;
      if (!refus) try { const l = await this.ligne(uid, "programme"); arrive = !!(l && Forme.objet(l.contenu) && l.contenu.publie_le === N.publie_le); } catch(e2){}
      if (!arrive) return { ok: false, refus };
    }
    Store.boite(uid).programme = P;   // la page garde le même objet (mis à jour par l'appelant)
    Store.majLu[uid + "|programme"] = N.publie_le;
    majEtat("enregistre");
    /* 5. le brouillon de CE client quitte le document du coach (relu en base : les brouillons des autres clients écrits
       depuis un autre appareil restent) ; s'il ne part pas, il reste identique au publié : il ne se montre plus */
    /* (relecture : on ne recopie plus les entrées de la page, peut-être périmées : la base relue juste avant fait foi) */
    Object.keys(D.clients || {}).forEach(k => { if (k !== uid) delete D.clients[k]; });
    const autresB = Forme.objet(lD && lD.contenu) && Forme.objet(lD.contenu.clients) ? lD.contenu.clients : {};
    Object.keys(autresB).forEach(k => { if (k !== uid) D.clients[k] = autresB[k]; });
    D.clients[uid] = this.tombe();
    this.planifier(D, uid);
    return { ok: true, programme: N, D: D };
  },

  /* le bandeau en tête de l'éditeur : publié ou brouillon, et les 3 actions */
  etatHTML(b, P, entree){
    const brouillon = this.differe(b, P) || !!(entree && entree.nouveau_bloc);
    const nb = entree && Forme.objet(entree.nouveau_bloc) ? entree.nouveau_bloc : null;
    return `<section class="panel pg-etat${brouillon ? " brouillon" : ""}" id="pg-etat">
      <div class="seance-c-tete" style="margin-bottom:6px"><h2 style="margin:0;flex:1">${esc(b.nom || trad("Programme"))}</h2>
        ${brouillon ? `<span class="pastille attention" id="pg-statut">● ${esc(trad("Brouillon non publié"))}</span>` : `<span class="pastille ok" id="pg-statut">✓ ${esc(trad("Publié"))}</span>`}</div>
      <p class="note" style="margin:0 0 10px">${esc(brouillon
        ? (nb ? trad("Nouveau bloc en préparation (cycle {n}). Ton client voit toujours le bloc publié tant que tu n'as pas publié.", { n: String(Math.max(1, parseInt(b.cycle, 10) || 1)).padStart(2, "0") })
              : trad("Ton client voit toujours la version publiée{d} tant que tu n'as pas publié.", { d: P.maj ? " " + trad("du {d}", { d: P.maj }) : "" }))
        : (P.maj ? trad("Ton client voit exactement cette version (publiée le {d}).", { d: P.maj }) : trad("Tes changements restent dans un brouillon : ton client ne voit rien avant « Publier les changements ».")))}</p>
      <div class="actions">
        <button type="button" class="btn" id="pg-publier">${esc(trad("Publier les changements"))}</button>
        ${brouillon ? `<button type="button" class="btn ghost" id="pg-annuler-brouillon">${esc(trad("Annuler le brouillon"))}</button>` : ""}
        <button type="button" class="btn ghost" id="pg-nouveau-bloc">${esc(trad("Nouveau bloc à partir de celui-ci"))}</button>
        <span class="msg" id="pg-pub-msg" role="status"></span>
      </div>
    </section>`;
  },

  /* chez le client : « Nouveau bloc », à sa prochaine ouverture (21 jours au plus, jusqu'à « OK » sur cet appareil) */
  vuCle(){ const u = Auth.utilisateur(); return u && u.id ? "mhx_bloc_vu|" + u.id : null; },
  annonce(P){
    const a = P && Forme.objet(P.bloc_annonce) ? P.bloc_annonce : null;
    if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(String(a.le || "")) || Store.idConsulte) return null;
    const age = (new Date(aujourdhui() + "T12:00:00") - new Date(a.le + "T12:00:00")) / 86400000;
    if (!(age >= 0 && age <= 21)) return null;
    const k = this.vuCle(); let vu = ""; try { vu = k ? localStorage.getItem(k) || "" : ""; } catch(e){}
    const id = a.le + "|" + (parseInt(a.cycle, 10) || 1);
    return vu === id ? null : { id, cycle: Math.max(1, parseInt(a.cycle, 10) || 1), nom: String(a.nom || "") };
  },
  annonceHTML(P){
    const a = this.annonce(P); if (!a) return "";
    return `<section class="panel bloc-annonce" id="bloc-annonce" role="status"><div class="flag info" style="margin-top:0">
      <b>${esc(trad("Nouveau bloc"))}</b> · ${esc(trad("Cycle {n}", { n: String(a.cycle).padStart(2, "0") }))}<br>
      ${esc(trad("Ton coach a préparé la suite de ton programme{n}. Ta semaine 1 commence maintenant.", { n: a.nom ? " : « " + a.nom + " »" : "" }))}
      <div class="actions" style="margin-top:8px"><button type="button" class="btn ghost" data-bloc-vu="${esc(a.id)}">${esc(trad("C'est noté"))}</button></div></div></section>`;
  },
  brancherAnnonce(zone, P){
    $$("[data-bloc-vu]", zone).forEach(x => x.addEventListener("click", () => {
      const k = this.vuCle(); try { if (k) localStorage.setItem(k, x.dataset.blocVu); } catch(e){}
      const s = x.closest(".bloc-annonce"); if (s) s.remove();
    }));
  }
};

/* v102 : les copies gardées sur l'appareil de ces clés sont fusionnées entrée par entrée avant d'être rejouées ou servies */
Store.fusions.brouillons_programme = (base, copie) => BrouillonProg.fusionnerEntrees(base, copie);
Store.fusionEnAttente = cle => BrouillonProg.enAttente(cle);

const outilProgramme = {
  id: "programme",
  cle: "programme",
  nom: "Mon programme",
  principal: true,
  icone: "📋",
  titre: "Le programme",
  accroche: "Les séances construites pour toi : les exercices, les séries, les répétitions et les temps de repos.",

  /* v96 (3b) : la valeur après « + » ou « − » : séries ± 1 (1 à 20) ; répétitions ± 1 sur chaque nombre (« 8-10 » → « 9-11 »,
     une durée « 30 s » ± 5 s) ; repos ± 15 s (« 2 min » → « 135 s ») ; une valeur sans nombre ne bouge pas, sauf vide + */
  pas(f, v, d){
    const s = String(v == null ? "" : v).trim();
    if (f === "series"){ const n = parseInt(s, 10); if (isNaN(n)) return d > 0 ? "3" : s; return String(Math.max(1, Math.min(20, n + d))); }
    if (f === "repos"){
      const m = /^(\d+(?:[.,]\d+)?)\s*(min|mn|')?\s*(s|sec)?$/i.exec(s);
      if (!s) return d > 0 ? "60 s" : s;
      if (!m) return s;
      let sec = parseFloat(m[1].replace(",", ".")) * (m[2] ? 60 : 1);
      sec = Math.max(0, Math.round(sec) + 15 * d);
      return sec + " s";
    }
    if (f === "reps"){
      if (!/\d/.test(s)) return d > 0 && !s ? "10" : s;
      const duree = /\d\s*(s|sec)\b/i.test(s), k = duree ? 5 : 1;
      return s.replace(/\d+/g, x => String(Math.max(1, parseInt(x, 10) + d * k)));
    }
    return s;
  },

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
  faitesCetteSemaine(J, P){   // v96 : par séance du programme P (Journal.place), plus par la place notée
    const b = Regularite.bornes(0), out = {};
    (J && J.seances || []).forEach(x => { if (x && x.date >= b.debut && x.date <= b.fin){ const i = Journal.place(P, x); if (i > -1) out[i] = x.date; } });
    return out;
  },

  vueLecture(P, J){
    if (!P.seances || !P.seances.length){
      return `<section class="panel"><div class="empty">Ton coach n'a pas encore déposé ton programme. Tu recevras un message quand il sera prêt.${ctaVide(true)}</div></section>`;
    }
    const av = this.avancement(P), faites = this.faitesCetteSemaine(J, P);
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
      /* v101 : « Supprimé : … · Annuler » pendant 10 s (l'élément revient à sa place) */
      $$("[data-suppr-e]", zone).forEach(b => b.addEventListener("click", () => {
        const [si, ei] = b.dataset.supprE.split(":").map(Number), sc = P.seances[si], liste = sc.exercices;
        const ex = liste.splice(ei, 1)[0]; sauver(); redessiner();
        UI.annulable(trad("Supprimé : {n}", { n: (ex && ex.nom) || trad("un exercice") }), () => {
          /* relecture : seulement dans la liste d'où il vient (pas après un programme chargé ou un échauffement posé) */
          if (P.seances.indexOf(sc) < 0 || sc.exercices !== liste || liste.indexOf(ex) > -1) return;
          liste.splice(Math.min(ei, liste.length), 0, ex); sauver(); redessiner();
        }, zone);
      }));
      $$("[data-suppr-s]", zone).forEach(b => b.addEventListener("click", () => {
        const si = +b.dataset.supprS, liste = P.seances, sc = liste.splice(si, 1)[0]; sauver(); redessiner();
        UI.annulable(trad("Supprimé : {n}", { n: (sc && sc.nom) || trad("une séance") }), () => {
          /* relecture : seulement dans le programme d'où elle vient (pas dans un programme chargé entre-temps) */
          if (P.seances !== liste || liste.indexOf(sc) > -1) return;
          liste.splice(Math.min(si, liste.length), 0, sc); sauver(); redessiner();
        }, zone);
      }));
      const as = $("pg-ajout-s");
      if (as) as.addEventListener("click", () => { P.seances.push(PR.seanceVide(P.seances.length + 1)); sauver(); redessiner(); });

      /* v96 (3b) : déplacer, dupliquer, + / − */
      const echanger = (l, i, j) => { if (j < 0 || j >= l.length) return false; const x = l[i]; l[i] = l[j]; l[j] = x; return true; };
      const copie = x => JSON.parse(JSON.stringify(x));
      const sur = (attr, fn) => $$("[" + attr + "]", zone).forEach(b => b.addEventListener("click", () => { if (fn(b.getAttribute(attr)) !== false){ sauver(); redessiner(); } }));
      sur("data-monter-s", v => echanger(P.seances, +v, +v - 1));
      sur("data-descendre-s", v => echanger(P.seances, +v, +v + 1));
      sur("data-dupliquer-s", v => { const sc = copie(P.seances[+v]); delete sc.sid; sc.nom = (sc.nom || trad("Séance")) + " " + trad("(copie)"); P.seances.splice(+v + 1, 0, sc); });
      const ex = v => { const [si, ei] = v.split(":").map(Number); return { l: P.seances[si].exercices, ei }; };
      sur("data-monter-e", v => { const x = ex(v); return echanger(x.l, x.ei, x.ei - 1); });
      sur("data-descendre-e", v => { const x = ex(v); return echanger(x.l, x.ei, x.ei + 1); });
      sur("data-dupliquer-e", v => { const x = ex(v); x.l.splice(x.ei + 1, 0, copie(x.l[x.ei])); });
      $$("[data-pm]", zone).forEach(b => b.addEventListener("click", () => {
        const [si, ei, f, d] = b.dataset.pm.split(":"), e = P.seances[+si].exercices[+ei];
        const v = PR.pas(f, e[f], +d);
        if (v === e[f]) return;
        e[f] = v;
        const champ = zone.querySelector('[data-f="' + f + '"][data-s="' + si + '"][data-e="' + ei + '"]');
        if (champ) champ.value = v;
        sauver();
      }));

  },

  vueEdition(P, mode, opts){
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

    h += this.blocSeances(P, opts);

    /* v96 : « Envoyer au client » devient « Publier les changements » (le brouillon, plus rien en direct) */
    h += `<section class="panel">
      <div class="actions">
        <button class="btn ghost" id="pg-ajout-s">+ Ajouter une séance</button>
        <button class="btn" id="pg-publier-bas">${esc(trad("Publier les changements"))}</button>
        <button class="btn ghost" id="pg-biblio-save">Enregistrer dans ma bibliothèque</button>
        <span class="msg" id="pg-msg"></span>
      </div>
      <p class="note" style="margin-top:10px">${esc(trad("Tes changements sont gardés dans un brouillon, sur ton compte : ton client ne les voit qu'après « Publier les changements ». La publication date le programme (« Programme mis à jour le … » chez lui), range l'ancien dans l'historique et fait démarrer la semaine 1 d'un nouveau programme ou d'un nouveau bloc."))}</p>
    </section>`;
    return h;
  },

  /* Le corps de l'editeur : les seances et leurs exercices. Partage entre la
     fiche d'un client et l'atelier. */
  blocSeances(P, opts){
    opts = opts || {};
    let h = "";
    const nbS = (P.seances || []).length;
    /* v96 (3b) : ↑ ↓ et « Dupliquer » pour une séance ou un exercice ; + / − sur les séries, les répétitions et le repos (le
       clavier reste possible) ; sous chaque exercice d'un client, ce qu'il a fait la dernière fois ; pendant un nouveau bloc,
       « ≈ identique au bloc d'avant » sur un exercice inchangé */
    const outil = (attr, val, txt, aria, off) => `<button type="button" class="outil-pg" ${attr}="${val}" aria-label="${esc(aria)}"${off ? " disabled" : ""}>${txt}</button>`;
    const pm = (si, ei, f, aria) => `<span class="pm">${outil("data-pm", si + ":" + ei + ":" + f + ":-1", "−", trad("Diminuer") + " · " + aria)}${outil("data-pm", si + ":" + ei + ":" + f + ":1", "+", trad("Augmenter") + " · " + aria)}</span>`;
    (P.seances || []).forEach((sc, si) => {
      const nbE = (sc.exercices || []).length;
      h += `<section class="panel seance">
        <div class="seance-tete">
          <div><label>Nom de la séance</label><input type="text" data-s="${si}" data-f="nom" value="${esc(sc.nom || "")}" placeholder="Séance A — Haut du corps"></div>
          <div class="outils-pg">${outil("data-monter-s", si, "↑", trad("Monter la séance"), si === 0)}${outil("data-descendre-s", si, "↓", trad("Descendre la séance"), si === nbS - 1)}${outil("data-dupliquer-s", si, "⧉", trad("Dupliquer la séance"))}</div>
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
        const der = opts.J && e.nom ? Journal.dernier(opts.J, e.nom) : null, court = der ? Journal.resumeCourt(der.e) : "";
        h += `<div class="ex-ligne">
          <div class="nom-c"><label>Exercice</label>
            <input type="text" list="ex-catalogue" data-s="${si}" data-e="${ei}" data-f="nom" value="${esc(e.nom)}" placeholder="Commence à taper : Développé couché…">
            ${this.etatExo(e, f, si, ei)}
            ${court ? `<p class="ex-derniere" data-derniere>${esc(trad("Dernière fois : {d} ({date})", { d: court, date: dateFr(der.date).slice(0, 5) }))}</p>` : ""}
            ${opts.ref ? `<p class="ex-identique" data-identique="${si}:${ei}"${BrouillonProg.identique(opts.ref, sc, e) ? "" : " hidden"}>≈ ${esc(trad("identique au bloc d'avant : à faire évoluer ?"))}</p>` : ""}
          </div>
          <div><label>Séries</label><input type="text" data-s="${si}" data-e="${ei}" data-f="series" value="${esc(e.series)}" placeholder="4">${pm(si, ei, "series", trad("séries"))}</div>
          <div><label>Reps</label><input type="text" data-s="${si}" data-e="${ei}" data-f="reps" value="${esc(e.reps)}" placeholder="8-10">${pm(si, ei, "reps", trad("répétitions"))}</div>
          <div><label>Repos</label><input type="text" data-s="${si}" data-e="${ei}" data-f="repos" value="${esc(e.repos)}" placeholder="90 s">${pm(si, ei, "repos", trad("repos"))}</div>
          <div class="outils-ex">${outil("data-monter-e", si + ":" + ei, "↑", trad("Monter l'exercice"), ei === 0)}${outil("data-descendre-e", si + ":" + ei, "↓", trad("Descendre l'exercice"), ei === nbE - 1)}${outil("data-dupliquer-e", si + ":" + ei, "⧉", trad("Dupliquer l'exercice"))}<button class="del" data-suppr-e="${si}:${ei}" aria-label="Supprimer l'exercice">×</button></div>
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
    /* v85 (bloc 4) : #/programme/formation, …/seance/…, …/choisir : les programmes de la formation (ProgFormation), en plus du
       programme du coach (jamais dans une fiche consultée : le coach y garde l'éditeur) */
    if (!Store.idConsulte && ProgFormation.sous(sousRoute)) return ProgFormation.zoneHTML();
    return `<div id="prog-vue"><section class="panel">${squelette()}</section></div><div id="prog-obj"></div><div id="prog-jr"></div><div id="prog-hist"></div>`;
  },

  async init(){
    const self = this;
    if (!Store.idConsulte && ProgFormation.sous(sousRoute)) return ProgFormation.monter($("pf-zone"), sousRoute);   // v85 (bloc 4)
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

    /* le client voit son programme : lecture seule, « Noter ma séance » */
    if (!edition){
      const J = await Store.lire(Journal.cle, Journal.vide());
      if (Store.nonLus.has(J)){ pageHorsLigne(zone); return; }   // v71 (F)
      if (!Array.isArray(J.seances)) J.seances = [];
      /* v85 (bloc 4) : sous son programme (inchangé, en premier), le lien vers les programmes de la formation */
      const dessiner = () => { zone.innerHTML = BrouillonProg.annonceHTML(P) + self.vueLecture(P, J) + ProgFormation.lienHTML(); self.brancherFiches(zone); BrouillonProg.brancherAnnonce(zone, P); };
      dessiner();
      /* v100 (chantier 5) : « Mon journal » vit ici : l'historique des séances notées, sous le programme (même code que #/journal) */
      let n = outilJournal.PAS;
      const dessinerHist = () => {
        const h = $("prog-jr"); if (!h || Auth.estCoach()) return;   // le client seulement (le coach garde sa page d'avant)
        h.innerHTML = outilJournal.historiqueHTML(J, n, false);
        const plus = $("jr-plus"); if (plus) plus.addEventListener("click", () => { n += outilJournal.PAS; dessinerHist(); });
      };
      dessinerHist();
      /* apres une seance notee : on redessine (badge « notée », compteur) et on rebranche le journal */
      const apres = () => { dessiner(); dessinerHist(); Journal.brancher(zone, P, J, apres); };
      await Journal.brancher(zone, P, J, apres);
      Historique.monter("programme", "prog-hist");
      return;
    }

    /* ---------- v96 (chantier 1 de la nuit du 10/11) : le coach travaille dans un BROUILLON ----------
       P = le programme publié (ce que voit le client), jamais modifié par la saisie ; B = le brouillon, rangé sur le compte
       du coach (BrouillonProg, clé brouillons_programme), une entrée par client. Rien ne part chez le client avant
       « Publier les changements » (une seule écriture, tout ou rien). Sans brouillon : B est une copie de P, rien n'est
       écrit tant que le coach ne change rien (aucune conversion au chargement). Les 3 objectifs du mois restent écrits
       tout de suite dans le programme publié, comme avant (ils ne font pas partie du brouillon). */
    const uid = Store.cible();
    const [D, J] = await Promise.all([BrouillonProg.lire(), Store.lire(Journal.cle, Journal.vide())]);
    if (!$("prog-vue") || Store.cible() !== uid) return;   // page ou fiche quittée pendant la lecture
    if (Store.nonLus.has(D)){ pageHorsLigne(zone); return; }   // brouillons illisibles : on n'écrit rien par-dessus
    const etat = { D: D, J: Store.nonLus.has(J) ? null : J, B: null, publication: false };
    const majPublie = () => Store.majLu[uid + "|" + self.cle] || null;
    const entree = BrouillonProg.entree(D, uid);
    /* un brouillon identique à la version publiée (publié depuis un autre appareil) n'est pas un brouillon */
    etat.B = (entree && BrouillonProg.differe(entree.programme, P)) ? JSON.parse(JSON.stringify(entree.programme)) : BrouillonProg.depuis(P);
    const B = () => etat.B;

    /* chaque changement : le brouillon part sur le compte du coach (700 ms, copie gardée sur l'appareil comme toute saisie) */
    const sauver = () => {
      if (Store.cible() !== uid){ Store.ficheChangee(); return false; }
      BrouillonProg.assurerSids(etat.B);
      const r = BrouillonProg.ranger(etat.D, uid, etat.B, P, majPublie());
      majEtat();
      /* « ≈ identique au bloc d'avant » suit la saisie (sans redessiner : le curseur reste dans son champ) */
      const ref = BrouillonProg.reference(etat.D, uid, P);
      $$("[data-identique]", zone).forEach(m => { const [si, ei] = m.dataset.identique.split(":").map(Number), sc = etat.B.seances[si], e = sc && (sc.exercices || [])[ei]; m.hidden = !(ref && sc && e && BrouillonProg.identique(ref, sc, e)); });
      return r;
    };
    /* les 3 objectifs du mois : dans le programme publié, comme avant ; v102 : 700 ms après la frappe, le programme est relu et
       les objectifs y sont posés seulement s'il est toujours celui de cette page (sinon : publié ailleurs, on le dit, rien n'est
       écrit) ; relecture impossible (hors ligne) : comme avant (copie gardée sur l'appareil) */
    let minuteurObj = null;
    const sauverPublie = () => {
      if (etat.publication || Store.cible() !== uid) return false;
      clearTimeout(minuteurObj);
      minuteurObj = setTimeout(async () => {
        if (Store.cible() !== uid) return;
        let l = null;
        try { l = await BrouillonProg.ligne(uid, self.cle); } catch(e){ Store.ecrire(self.cle, P); return; }
        if (Store.cible() !== uid) return;
        const enBase = Forme.cle(self.cle, l && l.contenu) || {};
        if (BrouillonProg.empreinte(enBase) !== BrouillonProg.empreinte(P)){
          UI.toast(trad("Le programme de ce client a été publié ailleurs : recharge la page avant de changer ses objectifs."), "attention", 9000);
          return;
        }
        const N = Object.assign({}, enBase, { objectifs: P.objectifs });
        Store.ecrire(self.cle, N);
      }, 700);
      return true;
    };

    const majEtat = () => {
      const z = $("pg-etat"); if (!z) return;
      z.outerHTML = BrouillonProg.etatHTML(etat.B, P, BrouillonProg.entree(etat.D, uid));
      brancherEtat();
    };
    const redessiner = () => {
      zone.innerHTML = BrouillonProg.etatHTML(etat.B, P, BrouillonProg.entree(etat.D, uid)) + self.vueEdition(etat.B, null, { J: etat.J, ref: BrouillonProg.reference(etat.D, uid, P) });
      brancher();
    };

    /* Le bouton « L'ajouter » apparait au fil de la frappe : on ecoute la
       zone entiere plutot que chaque bouton, sinon les nouveaux seraient morts. */
    zone.addEventListener("click", async ev => {
      const b = ev.target.closest("[data-ajout-base]");
      if (!b || !zone.contains(b)) return;
      const [si, ei] = b.dataset.ajoutBase.split(":").map(Number);
      const ex = B().seances[si].exercices[ei];
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
        UI.alerte(messageEchec(trad("Ajout impossible"), err));
      }
    });

    /* un programme complet chargé (catalogue, bibliothèque, proposition, historique) remplace les séances DU BROUILLON ;
       sa semaine 1 commencera à la publication (debut vide) ; l'ancien programme entre dans l'historique à la publication */
    const charger = (seances, nom, note, garderNom, garderSids) => {
      const b = etat.B;
      b.debut = ""; b.maj = "";
      b.seances = JSON.parse(JSON.stringify(seances || []));
      if (!garderSids) b.seances.forEach(sc => { if (sc && typeof sc === "object") delete sc.sid; });   // de nouvelles séances : de nouveaux identifiants
      if (nom && !(garderNom && b.nom)) b.nom = nom;
      if (note && !(garderNom && b.note)) b.note = note;
      b.seances.forEach(sc => (sc.exercices || []).forEach(e => {
        const f = self.trouve(e.nom);
        if (f){ e.id = f.id; if (!e.lien) e.lien = f.lien || (f.video_id ? "https://www.youtube.com/watch?v=" + f.video_id : ""); }
      }));
      if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
      redessiner();
      return true;
    };

    const brancherEtat = () => {
      const pub = $("pg-publier"); if (pub) pub.addEventListener("click", publier);
      const ann = $("pg-annuler-brouillon");
      if (ann) ann.addEventListener("click", async () => {
        if (!(await UI.confirmer(trad("Annuler le brouillon ? Tes changements non publiés seront perdus. Ton client garde la version publiée."), { ok: trad("Annuler le brouillon"), annuler: trad("Garder le brouillon"), danger: true }))) return;
        if (Store.cible() !== uid){ Store.ficheChangee(); return; }
        if (BrouillonProg.retirer(etat.D, uid) === false) return;
        $$(".toast.annulable").forEach(x => x.remove());   // v102
        etat.B = BrouillonProg.depuis(P);
        redessiner();
        flash("pg-pub-msg", trad("Brouillon annulé : tu vois la version publiée."));
      });
      const nb = $("pg-nouveau-bloc");
      if (nb) nb.addEventListener("click", async () => {
        if (!Historique.utile("programme", P)){ flash("pg-pub-msg", trad("Publie d'abord un premier programme : le nouveau bloc part de la version publiée.")); return; }
        if (BrouillonProg.differe(etat.B, P) && !(await UI.confirmer(trad("Ton brouillon sera remplacé par une copie du bloc publié, pour préparer le bloc suivant. Continuer ?"), { ok: trad("Préparer le nouveau bloc") }))) return;
        if (Store.cible() !== uid){ Store.ficheChangee(); return; }
        etat.B = BrouillonProg.nouveauBloc(P);
        $$(".toast.annulable").forEach(x => x.remove());   // v102
        if (BrouillonProg.ranger(etat.D, uid, etat.B, P, majPublie(), { nouveau_bloc: { cycle: Math.max(1, parseInt(P.cycle, 10) || 1), nom: P.nom || "" } }) === false) return;
        redessiner();
        flash("pg-pub-msg", trad("Nouveau bloc prêt dans ton brouillon : fais évoluer les exercices marqués « ≈ identique », puis publie."));
      });
    };

    /* « Publier les changements » : relire la base (deux appareils), ranger l'ancien programme dans l'historique, écrire le
       nouveau d'un seul coup ; en cas d'échec rien n'a changé chez le client et le brouillon reste */
    const publier = async () => {
      if (etat.publication) return;
      const msg = t => flashFixe("pg-pub-msg", t);
      const b = etat.B;
      const exos = (b.seances || []).reduce((n, sc) => n + (sc.exercices || []).filter(e => e.nom).length, 0);
      if (!exos){ flash("pg-pub-msg", trad("Ce programme est vide : ajoute au moins une séance avec un exercice avant de le publier.")); return; }
      if (!BrouillonProg.differe(b, P) && P.maj){ flash("pg-pub-msg", trad("Rien à publier : ton client voit déjà cette version.")); return; }
      etat.publication = true;
      const boutons = ["pg-publier", "pg-publier-bas"].map(id => $(id)).filter(Boolean);
      boutons.forEach(x => { x.disabled = true; x.dataset.libelle = x.textContent; x.textContent = trad("Publication…"); });
      msg("");
      /* relecture : les objectifs du mois (écrits à part, dans le programme publié) sont bloqués pendant la publication */
      const objectifs = $$("#prog-obj input, #prog-obj select"); objectifs.forEach(x => { x.disabled = true; });
      const corps = $$("#prog-vue > section:not(#pg-etat)"); corps.forEach(x => x.setAttribute("inert", ""));   // v102 : rien ne se tape pendant la publication
      const fin = () => { etat.publication = false; corps.forEach(x => x.removeAttribute("inert")); objectifs.forEach(x => { if (x.isConnected) x.disabled = false; }); boutons.forEach(x => { if (x.isConnected){ x.disabled = false; x.textContent = x.dataset.libelle; } }); };
      try {
        const r = await BrouillonProg.publier(uid, P, b, etat.D, majPublie());
        if (!zone.isConnected || Store.cible() !== uid){   // page ou fiche quittée : aucun message sur la page d'un autre client
          if (!r.ok && !r.annule) UI.toast(trad("Programme non publié : ton brouillon est gardé."), "mauvais", 9000);   // v102 : mais on le dit
          return;
        }
        if (r.ok){
          $$(".toast.annulable").forEach(x => x.remove());   // v102 : « Annuler » agirait sur l'ancien brouillon
          /* le programme publié en mémoire devient la nouvelle version (même objet : la page et le cache le partagent) */
          Object.keys(P).forEach(k => delete P[k]); Object.assign(P, r.programme);
          etat.D = r.D;
          etat.B = BrouillonProg.depuis(P);
          redessiner();
          flash("pg-pub-msg", trad("Publié. Ton client voit la nouvelle version dès sa prochaine ouverture."));
          return;
        }
        if (r.annule) return;
        if (r.attente){ msg(trad("Un changement des objectifs du mois attend son envoi : réessaie dans un instant.")); return; }
        const t = (($("etat") || {}).textContent || "").trim();
        msg(r.refus ? trad("Pas publié : la base a refusé cette modification. Ton brouillon est gardé.")
                    : trad("Pas publié : vérifie ta connexion et réessaie. Ton brouillon est gardé.") + (t && !r.refus ? " (" + t + ")" : ""));
      } finally { fin(); }
    };

    const brancher = () => {
      const b = etat.B;
      self.brancherEditeur(b, zone, sauver, redessiner);
      brancherEtat();
      const pub2 = $("pg-publier-bas"); if (pub2) pub2.addEventListener("click", publier);   // relecture : une seule fois par dessin

      const n = $("pg-nom"), no = $("pg-note"), cy = $("pg-cycle"), du = $("pg-duree");
      if (n)  n.addEventListener("input", () => { b.nom = n.value; sauver(); });
      if (no) no.addEventListener("input", () => { b.note = no.value; sauver(); });
      /* le cycle et la duree : ce qui fait « Cycle 01 · Semaine 2 sur 4 » chez le client */
      if (cy) cy.addEventListener("input", () => { const v = parseInt(cy.value, 10); if (v >= 1) b.cycle = v; sauver(); });
      if (du) du.addEventListener("input", () => { const v = parseInt(du.value, 10); if (v >= 1) b.duree_semaines = v; sauver(); });

      const auto = $("pg-auto");
      if (auto) auto.addEventListener("click", async () => {
        const choix = self.proposer(intake);
        if (!choix){
          flash("pg-auto-msg", (self.prets || []).length
            ? "Rien ne correspond vraiment à son questionnaire. Choisis à la main."
            : "Ton catalogue de programmes est vide : lance l'import.");
          return;
        }
        if (b.seances.length && !(await UI.confirmer("Remplacer le programme en cours par « " + choix.prog.nom + " » ?", { ok: "Oui, remplacer" }))) return;
        if (charger(choix.prog.seances, choix.prog.nom, choix.prog.note, false) === false) return;
        flash("pg-auto-msg", "« " + choix.prog.nom + " » — retenu pour " +
          (choix.pour.length ? choix.pour.join(", ") : "le meilleur compromis") + ". " + trad("Relis-le avant de publier."));
      });

      const bs = $("pg-biblio-save");
      if (bs) bs.addEventListener("click", async () => {
        const nom = await UI.demander("Sous quel nom l'enregistrer dans ta bibliothèque ?", b.nom || "Entraînement", { titre: "Ma bibliothèque", ok: "Enregistrer" });
        if (!nom) return;
        try {
          await Auth.appel("/rest/v1/bibliotheque", {
            method: "POST",
            headers: { "Prefer": "return=minimal" },
            body: [{ coach_id: Auth.utilisateur().id, nom, note: b.note || "", contenu: { type:"entrainement", seances: b.seances } }]
          });
          flash("pg-msg", "Enregistré dans ta bibliothèque.");
          chargerBiblio();
        } catch(e){ flashFixe("pg-msg", trad("Pas enregistré dans ta bibliothèque : vérifie ta connexion et réessaie.")); }
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
        if (!(await UI.confirmer(trad("Charger « {n} » ? Il remplacera les séances de ton brouillon (ton client garde la version publiée).", { n: x.nom }), { ok: trad("Charger") }))){ sel.value = ""; return; }
        if (charger(x.seances, x.nom, x.note, true) === false) return false;
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
          if (!(await UI.confirmer(trad("Charger cet entraînement ? Il remplacera les séances de ton brouillon (ton client garde la version publiée)."), { ok: trad("Charger") }))) { sel.value = ""; return; }
          let r = null;
          try { r = await Auth.appel("/rest/v1/bibliotheque?id=eq." + sel.value + "&select=contenu,nom,note"); }
          catch(e){ sel.value = ""; flashFixe("pg-msg", trad("Pas chargé : vérifie ta connexion et réessaie.")); return; }   // v102
          if (r && r[0] && r[0].contenu){
            if (charger(r[0].contenu.seances, r[0].nom, "", true) === false) return false;
          } else { sel.value = ""; flashFixe("pg-msg", trad("Cet entraînement n'existe plus dans ta bibliothèque.")); }
        };
      } catch(e){}
    };

    redessiner();
    Regularite.objectifsCoach("prog-obj", P, sauverPublie);
    Journal.resumeCoach("prog-jr");
    Historique.monter("programme", "prog-hist", async (C) => {
      const b = etat.B;
      b.nom = C.nom || b.nom; b.note = C.note || "";
      if (charger(C.seances || [], "", "", true, true) === false) return false;
      /* les séances remises gardent leur identifiant : les séances notées de l'époque restent reliées */
      UI.alerte(trad("Programme remis dans ton brouillon. Relis-le, puis clique sur « Publier les changements »."));
      return true;
    });
  }
};

