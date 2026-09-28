/* ------------------------------------------------------------------
   OUTIL COACH — Le catalogue (aliments, recettes, programmes)
   Importe les donnees du depot public et les corrige au passage.
   ------------------------------------------------------------------ */
const outilCatalogue = {
  id: "catalogue",
  cle: null,
  nom: "Catalogue",
  icone: "📦",
  role: "coach",
  titre: "Le catalogue",
  accroche: "Les aliments, les recettes et les programmes dans lesquels l'application pioche. Tu peux les recharger à tout moment depuis le dépôt.",

  html(){
    return `<section class="panel">
      <h2>Ce que contient ton catalogue</h2>
      <div class="grid g4 bilan-jour" id="cat-compteurs">
        <div class="tuile"><span class="t-lbl">Aliments</span><span class="t-val readout" id="cat-n-aliments">…</span><span class="t-u">fiches</span></div>
        <div class="tuile"><span class="t-lbl">Recettes</span><span class="t-val readout" id="cat-n-recettes">…</span><span class="t-u">plats</span></div>
        <div class="tuile"><span class="t-lbl">Programmes</span><span class="t-val readout" id="cat-n-programmes">…</span><span class="t-u">prêts à l'emploi</span></div>
        <div class="tuile"><span class="t-lbl">Exercices</span><span class="t-val readout" id="cat-n-vegan">…</span><span class="t-u">fiches détaillées</span></div>
      </div>
      <div id="cat-couverture" style="margin-top:18px"></div>
    </section>

    <section class="panel">
      <h2>Recharger depuis le dépôt</h2>
      <p class="note" style="margin-top:0">Les données viennent de <span class="readout">${esc(CONFIG.nutrition.source_donnees)}</span>. À chaque import, les régimes et les allergènes sont <strong>recalculés</strong> à partir du nom et de la composition de chaque aliment : les étiquettes du fichier ne sont jamais reprises telles quelles, et les recettes héritent des étiquettes de leurs ingrédients.</p>
      <div class="actions">
        <button class="btn" id="cat-go">Importer le catalogue</button>
        <span class="msg" id="cat-msg"></span>
      </div>
      <div id="cat-journal" style="margin-top:16px"></div>
    </section>`;
  },

  async compteurs(){
    const [al, re, pr, ex] = await Promise.all([Catalogue.aliments(), Catalogue.recettes(), Catalogue.programmes(), Catalogue.exercices()]);
    $("cat-n-aliments").textContent   = fmt(al.length);
    $("cat-n-recettes").textContent   = fmt(re.length);
    $("cat-n-programmes").textContent = fmt(pr.length);
    $("cat-n-vegan").textContent      = fmt(ex.length);

    /* Couverture : un client d'un regime donne a-t-il de quoi manger a chaque repas ? */
    const cles = [["vegan","Végétalien"],["vegetarien","Végétarien"],["sans_gluten","Sans gluten"],
                  ["sans_lactose","Sans lactose"],["paleo","Paléo"],["pescetarien","Pescétarien"]];
    let h = `<h3 style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px">Couverture par régime et par repas</h3>
      <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Régime</th>` +
      CONFIG.nutrition.repas.map(r => `<th>${esc(r.nom)}</th>`).join("") + `</tr></thead><tbody>`;
    let trous = 0;
    cles.forEach(([k, nom]) => {
      h += `<tr><td>${esc(nom)}</td>`;
      CONFIG.nutrition.repas.forEach(slot => {
        const n = re.filter(r => r.moment === slot.id && (r.regimes||[]).indexOf(k) > -1).length;
        if (n === 0) trous++;
        h += `<td${n === 0 ? ' style="color:var(--bad);font-weight:600"' : (n < 3 ? ' style="color:var(--warn)"' : "")}>${n}</td>`;
      });
      h += `</tr>`;
    });
    h += `</tbody></table></div>
      <p class="note" style="margin-top:10px">${trous ? `<strong>${trous} case${trous>1?"s":""} à zéro</strong> : pour ces combinaisons, le générateur n'a rien à proposer et répartira les calories sur les autres repas. C'est là qu'il faut ajouter des recettes.` : "Chaque régime a au moins une recette pour chaque repas de la journée."}</p>`;
    $("cat-couverture").innerHTML = h;
  },

  async init(){
    const self = this;
    Catalogue._c = {}; Catalogue._idx = null; Catalogue._idxEx = null;
    await this.compteurs();

    const journal = $("cat-journal");
    const dire = (txt, classe) => {
      const d = document.createElement("div");
      d.className = "j-ligne" + (classe ? " " + classe : "");
      d.innerHTML = txt; journal.appendChild(d); journal.scrollTop = journal.scrollHeight;
    };

    $("cat-go").addEventListener("click", async () => {
      const b = $("cat-go"); b.disabled = true; b.textContent = "Import en cours…";
      journal.innerHTML = "";
      try {
        /* --- 1. aliments --- */
        dire("Téléchargement des aliments…");
        const brutA = await Import.fichier("aliments.json");
        let corriges = 0, allergAjoutes = 0;
        const aliments = brutA.map(a => {
          const n = Normaliser.aliment(a);
          const avant = (a.regimes || []).slice().sort().join(","), apres = n.regimes.slice().sort().join(",");
          if (avant !== apres) corriges++;
          const plus = n.allergenes.filter(x => (a.allergenes || []).indexOf(x) === -1).length;
          allergAjoutes += plus;
          return n;
        });
        dire(`<b>${fmt(aliments.length)} aliments</b> lus. Régimes recalculés : <b>${fmt(corriges)}</b> fiches corrigées, <b>${fmt(allergAjoutes)}</b> allergènes ajoutés.`, corriges ? "attention" : "");
        await Import.envoyer("aliments", aliments, (t, i, n) => dire(`Aliments enregistrés : ${fmt(i)} / ${fmt(n)}`));

        /* --- 2. recettes : etiquettes deduites des ingredients --- */
        dire("Téléchargement des recettes…");
        const brutR = await Import.fichier("recettes.json");
        const idx = {}; aliments.forEach(a => { idx[a.id] = a; });
        const recettes = []; let orphelines = 0, ecarts = 0;
        brutR.forEach(r => {
          const res = Normaliser.recette(r, idx);
          if (res.manquants.length){ orphelines++; dire(`Recette écartée — ingrédient inconnu dans « ${esc(r.nom)} » : ${esc(res.manquants.join(", "))}`, "erreur-l"); return; }
          const avant = (r.regimes || []).slice().sort().join(","), apres = res.fiche.regimes.slice().sort().join(",");
          if (avant !== apres) ecarts++;
          recettes.push(res.fiche);
        });
        dire(`<b>${fmt(recettes.length)} recettes</b> retenues${orphelines ? `, ${fmt(orphelines)} écartée${orphelines>1?"s":""}` : ""}. Étiquettes déduites des ingrédients : <b>${fmt(ecarts)}</b> différaient du fichier.`, ecarts ? "attention" : "");
        await Import.envoyer("recettes", recettes, (t, i, n) => dire(`Recettes enregistrées : ${fmt(i)} / ${fmt(n)}`));

        /* --- 3. programmes --- */
        dire("Téléchargement des programmes…");
        const brutP = await Import.fichier("programmes.json");
        const programmes = brutP.filter(x => x && x.id && x.seances && x.seances.length).map(x => ({
          id: x.id, nom: x.nom, niveau: x.niveau || null, seances_semaine: x.seances_semaine || null,
          lieu: x.lieu || null, objectif: x.objectif || null, duree_semaines: x.duree_semaines || null,
          note: x.note || null,
          seances: x.seances.map(sc => ({
            nom: sc.nom || "Séance", note: sc.note || "",
            /* le tempo n'est pas repris : Lucas ne s'en sert pas et il
               encombrait la fiche d'exercice du client */
            exercices: (sc.exercices || []).map(e => ({
              nom: e.nom || "", series: String(e.series || ""), reps: String(e.reps || ""),
              repos: String(e.repos || ""), note: e.note || "", lien: e.lien || ""
            }))
          }))
        }));
        await Import.envoyer("programmes_types", programmes, null);
        dire(`<b>${fmt(programmes.length)} programmes</b> enregistrés.`);

        /* --- 4. fiches d'exercices --- */
        dire("Téléchargement des fiches d'exercices…");
        let exercices = [];
        try { exercices = await Import.fichier("exercices.json"); }
        catch(e){ dire("Pas de fichier d'exercices dans le dépôt — on continue sans.", "attention"); }
        if (exercices.length){
          const fiches = exercices.filter(x => x && x.id && x.nom).map(x => ({
            id: x.id, nom: x.nom, groupe: x.groupe || null,
            muscles: x.muscles || [], materiel: x.materiel || null, niveau: x.niveau || null,
            type: x.type || null, execution: x.execution || [], erreurs: x.erreurs || [],
            respiration: x.respiration || null, alternatives: x.alternatives || [],
            lien: x.lien || "", video_id: x.video_id || ""
          }));
          /* Les vidéos vivent dans un fichier à part : les fiches viennent de
             Grok Bot, les liens de Lucas. On les recolle ici, sur l'identifiant. */
          /* le fichier peut s'appeler avec ou sans tiret : GitHub et macOS
             renomment volontiers, on essaie les deux plutot que d'echouer */
          let liens = {};
          for (const nom of ["liens-exercices.json", "liensexercices.json"]){
            try { liens = await Import.fichier(nom); if (Object.keys(liens).length) break; } catch(e){}
          }
          /* on retrouve l'identifiant de la video dans n'importe quelle
             adresse YouTube : ainsi les liens ecrits directement dans les
             fiches donnent aussi un lecteur, pas seulement un lien sortant */
          const idYoutube = (url) => {
            const m = String(url || "").match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
            return m ? m[1] : "";
          };
          let avecVideo = 0;
          fiches.forEach(f => {
            const l = liens[f.id];
            if (l && l.lien){ f.lien = l.lien; f.video_id = l.yt || idYoutube(l.lien); }
            else if (f.lien) f.video_id = idYoutube(f.lien);
            if (f.video_id) avecVideo++;
          });
          await Import.envoyer("exercices", fiches, null);
          if (Object.keys(liens).length) dire(`<b>${fmt(avecVideo)} exercices</b> ont leur vidéo de démonstration.`);
          /* on verifie tout de suite ce qui compte : un exercice de programme
             sans fiche, c'est un client qui ne sait pas quoi faire */
          const idx = {}; fiches.forEach(f => { idx[Normaliser.aplatir(f.nom)] = true; });
          const noms = {};
          programmes.forEach(pr => (pr.seances||[]).forEach(sc => (sc.exercices||[]).forEach(e => {
            if (e.nom) noms[Normaliser.aplatir(e.nom)] = e.nom; })));
          const sans = Object.keys(noms).filter(k => !idx[k]);
          dire(`<b>${fmt(fiches.length)} fiches d'exercices</b> enregistrées. ${sans.length ? `<b>${sans.length}</b> exercice(s) des programmes n'ont pas de fiche : ${esc(sans.slice(0,5).map(k => noms[k]).join(", "))}${sans.length > 5 ? "…" : ""}` : "Tous les exercices des programmes ont leur fiche."}`, sans.length ? "attention" : "");
        }

        Catalogue._c = {}; Catalogue._idx = null; Catalogue._idxEx = null;
        await self.compteurs();
        dire("Import terminé.", "ok-l");
        flash("cat-msg", "Catalogue à jour.");
      } catch(e){
        dire("Import interrompu : " + esc(e.message || String(e)), "erreur-l");
        flash("cat-msg", "L'import n'a pas abouti — rien n'a été perdu, tu peux réessayer.");
      }
      b.disabled = false; b.textContent = "Importer le catalogue";
    });
  }
};

