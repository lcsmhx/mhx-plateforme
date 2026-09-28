/* ------------------------------------------------------------------
   OUTIL — L'atelier de séances (coach)
   Fabriquer un programme sans etre dans la fiche de qui que ce soit,
   puis l'enregistrer dans la base pour le proposer a n'importe quel
   client. Reutilise l'editeur de outilProgramme : un seul editeur a
   maintenir, et les memes garanties sur les fiches et les videos.
   ------------------------------------------------------------------ */
const outilAtelier = {
  id: "atelier",
  cle: "atelier",
  role: "coach",
  principal_coach: true,
  nom: "Mes séances",
  icone: "🧱",
  titre: "L'atelier",
  accroche: "Construis un programme une fois, réutilise-le pour tous tes clients. Il rejoint tes « programmes prêts à l'emploi ».",

  vide(){
    return { nom:"", note:"", lieu:"", seances_semaine:3, niveau:"Debutant",
             objectif:"Prise de muscle", seances:[] };
  },

  html(){ return `<div id="at-vue"><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  async init(){
    const self = this;
    const PR = outilProgramme;

    /* l'editeur a besoin du catalogue d'exercices pour la liste deroulante */
    if (!PR.exos){
      try {
        PR.exos = (await Catalogue.exercices()).slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr"));
        PR.idxExos = await Catalogue.indexExercices();
      } catch(e){ PR.exos = []; PR.idxExos = {}; }
    }
    let prets = [];
    try { prets = await Catalogue.programmes(); } catch(e){ prets = []; }

    /* Le brouillon est range sur le compte du coach : il le retrouve tel
       qu'il l'a laisse, meme apres avoir ouvert dix fiches clients. */
    const P = await Store.lire(this.cle, this.vide());   // meme objet : origine et marque de lecture conservees
    if (!Array.isArray(P.seances)) P.seances = [];

    const zone = $("at-vue");
    if (!zone) return;
    const sauver = () => Store.ecrire(self.cle, P);

    const redessiner = () => {
      zone.innerHTML = PR.vueEdition(P, "atelier");
      remplirCharger();
      PR.brancherEditeur(P, zone, sauver, redessiner);
      brancherAtelier();
    };

    const remplirCharger = () => {
      const sel = $("at-charger");
      if (!sel) return;
      sel.innerHTML = `<option value="">— repartir de zéro —</option>` +
        prets.map(x => `<option value="${esc(x.id)}">${esc(x.nom)}${x.lieu ? " · " + esc(x.lieu) : ""}</option>`).join("");
    };

    function lireEntete(){
      const v = id => { const e = $(id); return e ? e.value : ""; };
      P.nom = v("at-nom"); P.note = v("at-note");
      P.lieu = v("at-lieu"); P.niveau = v("at-niveau"); P.objectif = v("at-objectif");
      P.seances_semaine = +v("at-seances") || 3;
    }

    function brancherAtelier(){
      ["at-nom","at-note","at-lieu","at-niveau","at-objectif","at-seances"].forEach(id => {
        const e = $(id); if (e) e.addEventListener("input", () => { lireEntete(); sauver(); });
        if (e) e.addEventListener("change", () => { lireEntete(); sauver(); });
      });

      const ch = $("at-charger");
      if (ch) ch.addEventListener("change", async () => {
        const m = prets.find(x => x.id === ch.value);
        if (!m) return;
        if (P.seances.length && !(await UI.confirmer("Remplacer ce que tu as commencé par « " + m.nom + " » ?", { ok: "Oui, remplacer" }))) { ch.value = ""; return; }
        P.nom = m.nom; P.note = m.note || ""; P.lieu = m.lieu || "";
        P.niveau = m.niveau || "Debutant"; P.objectif = m.objectif || "Prise de muscle";
        P.seances_semaine = m.seances_semaine || 3;
        P.seances = JSON.parse(JSON.stringify(m.seances || []));
        sauver(); redessiner();
        flash("pg-msg", "« " + m.nom + " » chargé. Modifie-le, puis enregistre.");
      });

      const vider = $("at-vider");
      if (vider) vider.addEventListener("click", async () => {
        if (!(await UI.confirmer("Effacer ce brouillon et repartir de zéro ?", { ok: "Effacer", danger: true }))) return;
        Object.assign(P, self.vide());
        sauver(); redessiner();
      });

      const base = $("at-base");
      if (base) base.addEventListener("click", async () => {
        lireEntete();
        if (!P.nom.trim()){ flash("pg-msg", "Donne un nom à ce programme."); return; }
        if (!P.seances.length){ flash("pg-msg", "Il faut au moins une séance."); return; }
        const vides = P.seances.filter(sc => !(sc.exercices || []).some(e => (e.nom || "").trim()));
        if (vides.length){ flash("pg-msg", "Une séance n'a aucun exercice. Complète-la ou supprime-la."); return; }

        const id = Normaliser.aplatir(P.nom).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
        const existe = prets.some(x => x.id === id);
        if (existe && !(await UI.confirmer("Un programme du même nom existe déjà dans ta base. Le remplacer ?", { ok: "Oui, remplacer" }))) return;

        base.disabled = true; flash("pg-msg", "Enregistrement…");
        try {
          await Auth.appel("/rest/v1/programmes_types", {
            method: "POST",
            headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
            body: [{
              id: id, nom: P.nom.trim(), niveau: P.niveau, seances_semaine: P.seances_semaine,
              lieu: P.lieu || null, objectif: P.objectif, duree_semaines: null,
              note: P.note || null, seances: P.seances, maj_le: new Date().toISOString()
            }]
          });
          /* on rafraichit les caches : le programme doit apparaitre tout de
             suite dans « prets a l'emploi », sans rechargement de page */
          Catalogue._c["programmes_types"] = null;
          delete Catalogue._c["programmes_types"];
          prets = await Catalogue.programmes();
          outilProgramme.prets = prets;
          remplirCharger();
          flash("pg-msg", existe ? "Programme remplacé dans ta base." : "Programme ajouté à ta base. Tu le retrouves dans « prêts à l'emploi » sur la fiche de n'importe quel client.");
        } catch(e){
          flash("pg-msg", "Enregistrement impossible : " + (e.message || "erreur inconnue"));
        }
        base.disabled = false;
      });
    }

    redessiner();
  }
};

