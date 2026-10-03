/* ------------------------------------------------------------------
   OUTIL 3 — Journal d'entraînement
   ------------------------------------------------------------------ */
const outilEntrainement = {
  id: "entrainement",
  cle: "perf",
  masque_client: true,     // outil de travail du coach : le client ne le voit pas
  coach_perso: true,       // v71 (I) : journal perso du coach (cle perf) : jamais pendant la consultation d'une fiche
  nom: "Entraînement",
  icone: "🏋️",
  titre: "Journal d'entraînement",
  accroche: "Tes séances, tes charges et tes répétitions. À chaque séance enregistrée, l'outil te rappelle ce que tu avais fait la fois d'avant — c'est comme ça qu'on progresse pour de vrai.",

  /* --- fabriques : servent aussi à réinitialiser --- */
  nouvelExercice(plage){
    return {
      nom:"", plage: plage || "10-12",
      series: Array.from({length: CONFIG.entrainement.nb_series}, () => ({r:"", c:""})),
      obs:"", lien:""
    };
  },
  nouvelleSeance(i){
    return { nom: "Séance " + (i+1), ex: CONFIG.entrainement.modele_seance.map(p => this.nouvelExercice(p)) };
  },

  /* --- calculs, isolés --- */
  volumeExercice(e){ return e.series.reduce((v,s) => v + num(s.r)*num(s.c), 0); },
  chargeMax(e){ return e.series.reduce((m,s) => Math.max(m, num(s.c)), 0); },
  seriesRemplies(e){ return e.series.filter(s => num(s.r) > 0 && num(s.c) > 0).length; },
  volumeSeance(sc){ return sc.ex.reduce((v,e) => v + this.volumeExercice(e), 0); },

  html(){
    return `
    <div class="tabs" id="tabs"></div>

    <section class="panel">
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;justify-content:space-between;margin-bottom:18px">
        <div style="flex:1;min-width:220px"><label for="snom">Nom de la séance</label><input id="snom" type="text" placeholder="Ex. Haut du corps"></div>
        <div><label for="sdate">Date</label><input id="sdate" type="date"></div>
      </div>
      <div class="tiles">
        <div class="tile"><div class="t-lbl">Volume de la séance</div><div class="t-val readout" id="k-vol">0</div><div class="t-sub">kg soulevés au total</div></div>
        <div class="tile"><div class="t-lbl">Séries effectuées</div><div class="t-val readout" id="k-set">0</div><div class="t-sub">séries remplies</div></div>
        <div class="tile"><div class="t-lbl">Vs séance précédente</div><div class="t-val readout" id="k-cmp">—</div><div class="t-sub" id="k-cmp-s">Aucun historique</div></div>
      </div>
    </section>

    <section class="panel">
      <h2>Tes exercices</h2>
      <div id="exos"></div>
      <div class="actions">
        <button class="btn ghost" id="addexo">+ Ajouter un exercice</button>
        <button class="btn" id="savesess">Enregistrer la séance</button>
        <span class="msg" id="msg"></span>
      </div>
      <p class="note" style="margin-top:12px">Le volume, c'est répétitions × charge, additionné sur toutes tes séries. C'est l'indicateur le plus fiable de ta progression : si ton volume monte de semaine en semaine, tu progresses, même quand la charge maximale stagne.</p>
    </section>

    <section class="panel">
      <h2>Historique</h2>
      <div class="scroll"><table><thead><tr><th>Date</th><th>Séance</th><th>Exercices</th><th>Séries</th><th>Volume</th><th></th></tr></thead><tbody id="hist"></tbody></table></div>
    </section>`;
  },

  async init(){
    const cfg = CONFIG.entrainement, self = this;
    const D = await Store.lire(this.cle, {
      courante: 0, date: "",
      seances: Array.from({length: cfg.nb_seances}, (_,i) => self.nouvelleSeance(i)),
      historique: []
    });
    const sauver = () => Store.ecrire(self.cle, D);

    const derniereSeance = si => {
      for (let i = D.historique.length-1; i >= 0; i--) if (D.historique[i].si === si) return D.historique[i];
      return null;
    };
    const dernierExercice = (si, nom) => {
      const h = derniereSeance(si);
      if (!h || !nom) return null;
      return h.exos.find(x => x.nom && x.nom.toLowerCase() === nom.toLowerCase()) || null;
    };

    const construireOnglets = () => {
      const t = $("tabs"); t.innerHTML = "";
      D.seances.forEach((sc,i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "tab"; b.setAttribute("aria-pressed", String(i === D.courante));
        b.textContent = sc.nom || ("Séance " + (i+1));
        b.addEventListener("click", () => {
          D.courante = i; sauver();
          construireOnglets(); construireExercices(); $("snom").value = D.seances[i].nom; dessinerKPI();
        });
        t.appendChild(b);
      });
    };

    const construireExercices = () => {
      const box = $("exos"); box.innerHTML = "";
      const sc = D.seances[D.courante];
      if (!sc.ex.length){ box.innerHTML = '<div class="empty">Aucun exercice. Ajoute le premier ci-dessous.</div>'; return; }

      sc.ex.forEach((e,i) => {
        const d = document.createElement("div"); d.className = "exo";
        const options = Object.keys(cfg.plages)
          .map(p => `<option value="${p}"${p === e.plage ? " selected" : ""}>${p} reps</option>`).join("");
        const series = e.series.map((s,j) => `
          <div class="set">
            <div class="s-lbl">Série ${j+1}</div>
            <div class="pair">
              <input type="number" min="0" max="100" step="1" placeholder="reps" value="${esc(s.r)}" data-e="${i}" data-s="${j}" data-f="r">
              <input type="number" min="0" step="0.5" placeholder="kg" value="${esc(s.c)}" data-e="${i}" data-s="${j}" data-f="c">
            </div>
            <div class="cap">reps · kg</div>
          </div>`).join("");
        const prec = dernierExercice(D.courante, e.nom);
        let badge = "";
        if (prec){
          const v = self.volumeExercice(e), delta = v - prec.vol;
          const cls = v === 0 ? "same" : delta > 0 ? "up" : delta < 0 ? "down" : "same";
          badge = `<span class="prev ${cls}">Dernière fois : ${fmt(prec.vol)} kg de volume · max ${fmt(prec.max)} kg</span>`;
        }
        d.innerHTML = `
          <div class="exo-head">
            <div><label>Exercice</label><input type="text" placeholder="Ex. Développé couché" value="${esc(e.nom)}" data-e="${i}" data-f="nom"></div>
            <div><label>Répétitions</label><select data-e="${i}" data-f="plage">${options}</select></div>
            <div><button class="del" data-del="${i}" aria-label="Supprimer cet exercice">×</button></div>
          </div>
          <div class="sets">${series}</div>
          <div class="extra">
            <div><label>Observations</label><input type="text" placeholder="Sensations, douleurs, technique…" value="${esc(e.obs)}" data-e="${i}" data-f="obs"></div>
            <div><label>Lien vidéo</label><input type="url" placeholder="https://" value="${esc(e.lien)}" data-e="${i}" data-f="lien"></div>
          </div>
          <div class="exo-foot">
            <span class="stat">Volume <b>${fmt(self.volumeExercice(e))}</b> kg</span>
            <span class="stat">Charge max <b>${fmt(self.chargeMax(e))}</b> kg</span>
            ${badge}
            ${lienSur(e.lien) ? `<a class="link-a" href="${esc(lienSur(e.lien))}" target="_blank" rel="noopener">Voir la vidéo →</a>` : ""}
          </div>`;
        box.appendChild(d);
      });

      $$("[data-f]", box).forEach(el => {
        const evt = el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(evt, () => {
          const e = D.seances[D.courante].ex[+el.dataset.e], f = el.dataset.f;
          if (f === "r" || f === "c") e.series[+el.dataset.s][f] = el.value;
          else e[f] = el.value;
          sauver(); dessinerKPI();
          if (f === "nom" || f === "plage" || f === "lien"){
            const pos = el.selectionStart;
            construireExercices();
            const rendu = $("exos").querySelector(`[data-e="${el.dataset.e}"][data-f="${f}"]`);
            if (rendu){ rendu.focus(); try { rendu.setSelectionRange(pos, pos); } catch(x){} }
          } else rafraichirPied(+el.dataset.e);
        });
      });
      $$("[data-del]", box).forEach(b => {
        b.addEventListener("click", () => {
          D.seances[D.courante].ex.splice(+b.dataset.del, 1);
          sauver(); construireExercices(); dessinerKPI();
        });
      });
    };

    const rafraichirPied = i => {
      const e = D.seances[D.courante].ex[i];
      const carte = $("exos").children[i]; if (!carte) return;
      const st = carte.querySelectorAll(".exo-foot .stat b");
      if (st[0]) st[0].textContent = fmt(self.volumeExercice(e));
      if (st[1]) st[1].textContent = fmt(self.chargeMax(e));
      const pv = carte.querySelector(".prev"), prec = dernierExercice(D.courante, e.nom);
      if (pv && prec){
        const v = self.volumeExercice(e), delta = v - prec.vol;
        pv.className = "prev " + (v === 0 ? "same" : delta > 0 ? "up" : delta < 0 ? "down" : "same");
      }
    };

    const dessinerKPI = () => {
      const sc = D.seances[D.courante];
      const vol = self.volumeSeance(sc);
      const series = sc.ex.reduce((n,e) => n + self.seriesRemplies(e), 0);
      $("k-vol").textContent = fmt(vol);
      $("k-set").textContent = series;
      const h = derniereSeance(D.courante), c = $("k-cmp"), cs = $("k-cmp-s");
      if (h && h.vol > 0 && vol > 0){
        const delta = vol - h.vol, pct = Math.round(delta / h.vol * 100);
        c.textContent = (delta > 0 ? "+" : delta < 0 ? "−" : "") + Math.abs(pct) + "%";
        c.className = "t-val readout " + (delta > 0 ? "pos" : delta < 0 ? "neg" : "");
        cs.textContent = `dernière : ${fmt(h.vol)} kg le ${dateFr(h.date)}`;
      } else {
        c.textContent = "—"; c.className = "t-val readout";
        cs.textContent = h ? `dernière : ${fmt(h.vol)} kg` : "Aucun historique";
      }
    };

    const dessinerHistorique = () => {
      const tb = $("hist"); tb.innerHTML = "";
      if (!D.historique.length){
        tb.innerHTML = '<tr><td colspan="6" class="empty">Aucune séance enregistrée pour le moment.</td></tr>';
        return;
      }
      D.historique.slice().reverse().forEach(h => {
        const idx = D.historique.indexOf(h);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${esc(dateFr(h.date))}</td><td>${esc(h.nom)}</td><td>${fmt(Array.isArray(h.exos) ? h.exos.length : 0)}</td><td>${fmt(h.series || 0)}</td><td>${fmt(h.vol)} kg</td>` +
                       `<td><button class="del" aria-label="Supprimer cette séance">×</button></td>`;
        tr.querySelector(".del").addEventListener("click", () => {
          D.historique.splice(idx,1); sauver(); dessinerHistorique(); construireExercices(); dessinerKPI();
        });
        tb.appendChild(tr);
      });
    };

    $("addexo").addEventListener("click", () => {
      D.seances[D.courante].ex.push(self.nouvelExercice("10-12"));
      sauver(); construireExercices();
    });
    $("snom").addEventListener("input", function(){ D.seances[D.courante].nom = this.value; sauver(); construireOnglets(); });
    $("sdate").addEventListener("input", function(){ D.date = this.value; sauver(); });

    $("savesess").addEventListener("click", () => {
      const sc = D.seances[D.courante];
      const vol = self.volumeSeance(sc);
      if (vol <= 0){ flash("msg","Remplis au moins une série (reps et charge) avant d'enregistrer."); return; }
      const exos = []; let series = 0;
      sc.ex.forEach(e => {
        if (self.volumeExercice(e) > 0){
          exos.push({ nom: e.nom || "Sans nom", vol: self.volumeExercice(e), max: self.chargeMax(e) });
          series += self.seriesRemplies(e);
        }
      });
      D.historique.push({ date: $("sdate").value || aujourdhui(), si: D.courante, nom: sc.nom, exos, series, vol });
      D.historique.sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      if (sauver() === false) return;   // refusee (message deja affiche)
      dessinerHistorique(); construireExercices(); dessinerKPI();
      flash("msg","Séance enregistrée. Tes charges restent affichées pour la prochaine fois.");
    });

    $("sdate").value = D.date || aujourdhui();
    $("snom").value = D.seances[D.courante].nom;
    construireOnglets(); construireExercices(); dessinerHistorique(); dessinerKPI();
  }
};

