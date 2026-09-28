/* ------------------------------------------------------------------
   OUTIL COACH — Ma bibliotheque d'entrainements et de repas
   ------------------------------------------------------------------ */
const outilBibliotheque = {
  id: "bibliotheque",
  cle: null,
  nom: "Bibliothèque",
  principal_coach: true,
  icone: "📚",
  role: "coach",
  titre: "Ma bibliothèque",
  accroche: "Tes entraînements et tes journées types enregistrés, prêts à être réutilisés. Depuis la fiche d'un client, tu les charges en deux clics.",

  html(){
    return `<section class="panel">
      <h2>Mes entraînements</h2>
      <div id="bib-entrainements"><div class="empty">Chargement…</div></div>
      <p class="note" style="margin-top:14px">Pour en ajouter un : ouvre la fiche d'un client, construis son programme, puis clique sur « Enregistrer dans ma bibliothèque ».</p>
    </section>
    <section class="panel">
      <h2>Mes journées types</h2>
      <div id="bib-repas"><div class="empty">Chargement…</div></div>
      <p class="note" style="margin-top:14px">Pour en ajouter une : ouvre la fiche d'un client, va dans « Mes repas », compose la journée, puis enregistre-la ici.</p>
    </section>`;
  },

  async init(){
    const boxE = $("bib-entrainements"), boxR = $("bib-repas");

    const resume = (x) => {
      if (x.contenu && x.contenu.type === "repas"){
        /* un plan enregistre peut etre une semaine (jours[]) ou, pour les
           entrees d'avant, une journee unique (repas[]) */
        const jours = x.contenu.jours || (x.contenu.repas ? [{ repas: x.contenu.repas }] : []);
        const n = jours.reduce((t, j) => t + (j.repas || []).length, 0);
        const k = jours.reduce((t, j) => t + (j.repas || []).reduce((u, r) => u + ((r.macros && r.macros.kcal) || 0), 0), 0);
        const moy = jours.length ? Math.round(k / jours.length) : 0;
        return `${jours.length} jour${jours.length>1?"s":""} · ${n} repas · ${fmt(moy)} kcal / jour`;
      }
      const seances = (x.contenu && x.contenu.seances) || [];
      const nbE = seances.reduce((n,s) => n + ((s.exercices||[]).filter(e=>e.nom).length), 0);
      return `${seances.length} séance${seances.length>1?"s":""} · ${nbE} exercice${nbE>1?"s":""}`;
    };

    const charger = async () => {
      try {
        const l = await Auth.appel("/rest/v1/bibliotheque?select=*&order=cree_le.desc");
        const groupes = [
          { box: boxE, items: (l||[]).filter(x => !x.contenu || x.contenu.type !== "repas"), vide: "Aucun entraînement enregistré pour le moment." },
          { box: boxR, items: (l||[]).filter(x => x.contenu && x.contenu.type === "repas"),  vide: "Aucune journée type enregistrée pour le moment." }
        ];
        groupes.forEach(g => {
          if (!g.box) return;
          if (!g.items.length){ g.box.innerHTML = '<div class="empty">' + g.vide + '</div>'; return; }
          g.box.innerHTML = "";
          g.items.forEach(x => {
            const el = document.createElement("div");
            el.className = "biblio-l";
            el.innerHTML = `<span class="nom">${esc(x.nom)}</span>
              <span class="meta">${resume(x)}</span>
              <span class="actions-b"><button data-suppr="${x.id}">Supprimer</button></span>`;
            el.querySelector("[data-suppr]").addEventListener("click", async () => {
              if (!(await UI.confirmer("Supprimer « " + x.nom + " » de ta bibliothèque ?", { ok: "Supprimer", danger: true }))) return;
              try { await Auth.appel("/rest/v1/bibliotheque?id=eq." + x.id, { method:"DELETE", headers:{ "Prefer":"return=minimal" } }); charger(); }
              catch(e){}
            });
            g.box.appendChild(el);
          });
        });
      } catch(e){
        [boxE, boxR].forEach(b => { if (b) b.innerHTML = '<div class="empty">Impossible de charger la bibliothèque.</div>'; });
      }
    };
    charger();
  }
};

