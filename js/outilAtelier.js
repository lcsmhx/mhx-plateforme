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
  /* v83 (bloc 3) : plus dans la barre du bas du coach (Tableau · Clients · Prospects · Plus) : dans « Plus » et les raccourcis du Tableau de bord */
  nom: "Mes séances",
  icone: "🧱",
  titre: "L'atelier",
  accroche: "Construis un programme une fois, réutilise-le pour tous tes clients. Il rejoint tes « programmes prêts à l'emploi ».",

  vide(){
    return { nom:"", note:"", lieu:"", seances_semaine:3, niveau:"Debutant",
             objectif:"Prise de muscle", seances:[] };
  },

  html(){ return `<div id="at-vue"><section class="panel">${squelette()}</section></div>`; },

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
    if (Store.nonLus.has(P)){ pageHorsLigne(zone); return; }   // v91 : brouillon illisible : « Pas de connexion » + Réessayer (avant : un brouillon vide)
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
      /* v98 : « Modifier » ou « Dupliquer » depuis « Mes programmes › Ma base » : le programme demandé est repris ici, comme
         avec la liste « Reprendre un programme existant » (même confirmation si un brouillon est commencé) */
      const demande = self.aCharger; self.aCharger = null;
      if (demande && prets.some(x => x.id === demande.id)) setTimeout(() => { if (!sel.isConnected) return; self.copie = !!demande.copie; sel.value = demande.id; sel.dispatchEvent(new Event("change")); }, 0);
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
        const copie = !!self.copie; self.copie = false;   // v98 (relecture) : le drapeau « Dupliquer » ne vaut que pour ce choix
        const m = prets.find(x => x.id === ch.value);
        if (!m) return;
        if (P.seances.length && !(await UI.confirmer("Remplacer ce que tu as commencé par « " + m.nom + " » ?", { ok: "Oui, remplacer" }))) { ch.value = ""; return; }
        P.nom = m.nom; P.note = m.note || ""; P.lieu = m.lieu || "";
        P.niveau = m.niveau || "Debutant"; P.objectif = m.objectif || "Prise de muscle";
        P.seances_semaine = m.seances_semaine || 3;
        P.seances = JSON.parse(JSON.stringify(m.seances || []));
        /* v98 : « Dupliquer » (Mes programmes) : un autre nom, donc un nouveau programme à l'enregistrement */
        if (copie) P.nom = m.nom + " " + trad("(copie)");
        sauver(); redessiner();
        flash("pg-msg", "« " + P.nom + " » chargé. Modifie-le, puis enregistre.");
      });

      const vider = $("at-vider");
      if (vider) vider.addEventListener("click", async () => {
        if (!(await UI.confirmer("Effacer ce brouillon et repartir de zéro ?", { ok: "Effacer", danger: true }))) return;
        Object.assign(P, self.vide());
        sauver(); redessiner();
      });

      /* le contrôle commun à « Ma base » et « Ma bibliothèque » : un nom, au moins une séance, aucune séance vide (message, ou "") */
      const aCorriger = () => {
        lireEntete();
        if (!P.nom.trim()) return "Donne un nom à ce programme.";
        if (!P.seances.length) return "Il faut au moins une séance.";
        if (P.seances.some(sc => !(sc.exercices || []).some(e => (e.nom || "").trim()))) return "Une séance n'a aucun exercice. Complète-la ou supprime-la.";
        return "";
      };

      /* v91 : « Enregistrer dans ma bibliothèque » (jamais branché avant : le bouton ne faisait rien) — même table et même
         format que la fiche d'un client ({ type: "entrainement", seances }), sous le nom du programme */
      const biblio = $("pg-biblio-save");
      if (biblio) biblio.addEventListener("click", async () => {
        if (biblio.disabled) return;
        const pb = aCorriger(); if (pb){ flash("pg-msg", pb); return; }
        biblio.disabled = true; flashFixe("pg-msg", "Enregistrement…");
        try {
          await Auth.appel("/rest/v1/bibliotheque", {
            method: "POST",
            headers: { "Prefer": "return=minimal" },
            body: [{ coach_id: Auth.utilisateur().id, nom: P.nom.trim(), note: P.note || "", contenu: { type: "entrainement", seances: JSON.parse(JSON.stringify(P.seances)) } }]
          });
          if (biblio.isConnected) flash("pg-msg", "« " + P.nom.trim() + " » enregistré dans ta bibliothèque. Tu le retrouves sur la fiche de chaque client.");
        } catch(e){
          if (biblio.isConnected) flashFixe("pg-msg", "Pas enregistré dans ta bibliothèque : vérifie ta connexion et réessaie.");
        }
        biblio.disabled = false;
      });

      const base = $("at-base");
      if (base) base.addEventListener("click", async () => {
        const pb = aCorriger(); if (pb){ flash("pg-msg", pb); return; }

        const forme = t => Normaliser.aplatir(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
        let id = forme(P.nom);
        /* v91 : la base est relue juste avant d'enregistrer (avant : la liste chargée à l'ouverture de la page, et un programme
           du même nom ajouté entre-temps — autre onglet, autre appareil — était écrasé sans question). Relecture impossible :
           rien n'est écrit. Jamais d'écrasement sans « Oui, remplacer ». */
        if (base.disabled) return;
        base.disabled = true; flashFixe("pg-msg", "Vérification…");
        /* v92 : la base est relue en entier (identifiant ET nom) : un programme du catalogue a son propre identifiant
           (« corps-entier-2j-debutant »), différent de celui que l'atelier tire du nom (« corps-entier-2-seances ») ; repris
           puis enregistré sous le même nom, il était COPIÉ sans question (un doublon) au lieu d'être proposé au remplacement.
           Même identifiant d'abord, sinon même nom : c'est CE programme-là qui est remplacé (son identifiant est gardé). */
        let lus = null;
        try {
          const r = await Auth.appel("/rest/v1/programmes_types?select=id,nom&order=id.asc");
          if (Array.isArray(r)) lus = r.filter(x => x && typeof x.id === "string");
        } catch(e){}
        if (!base.isConnected) return;   // v91 : page quittée pendant la relecture : rien n'est écrit, aucun message ailleurs
        if (lus === null){ base.disabled = false; flashFixe("pg-msg", "Pas enregistré : ta base n'a pas pu être relue. Vérifie ta connexion et réessaie."); return; }
        const trouve = l => l.find(x => x.id === id) || l.find(x => forme(x.nom) === id) || null;
        const cible = trouve(lus) || trouve(prets.filter(x => x && typeof x.id === "string"));
        const existe = !!cible;
        if (cible) id = cible.id;
        flashFixe("pg-msg", "");
        if (existe && !(await UI.confirmer("Un programme du même nom existe déjà dans ta base. Le remplacer ?", { ok: "Oui, remplacer" }))){ base.disabled = false; return; }

        flash("pg-msg", "Enregistrement…");
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
          if (!base.isConnected) return;   // v91 : page quittée entre-temps : aucun message ailleurs
          remplirCharger();
          flash("pg-msg", existe ? "Programme remplacé dans ta base." : "Programme ajouté à ta base. Tu le retrouves dans « prêts à l'emploi » sur la fiche de n'importe quel client.");
        } catch(e){
          if (base.isConnected) flashFixe("pg-msg", messageEchec("Enregistrement impossible", e));
        }
        base.disabled = false;
      });
    }

    redessiner();
  }
};


/* ------------------------------------------------------------------
   v98 (chantier 3 de la nuit du 10/11, plan-menu-coach et plan-etape3 3d) — MES PROGRAMMES
   Un seul écran pour les programmes réutilisables du coach : « Mes séances » (l'atelier), « Ma base » (programmes_types,
   les « programmes prêts à l'emploi » de chaque fiche) et « Ma bibliothèque » (entraînements et journées types). Les données
   restent dans leurs tables ; les anciennes adresses (#/atelier, #/bibliotheque) ouvrent toujours leur page d'avant.
   Sous-adresses : #/mes-programmes (Mes séances), #/mes-programmes/base, #/mes-programmes/bibliotheque.
   ------------------------------------------------------------------ */
const outilMesProgrammes = {
  id: "mes-programmes",
  cle: null,
  role: "coach",
  nom: "Mes programmes",
  court: "Programmes",
  principal_coach: true,   // la barre du bas du coach : Tableau · Clients · Prospects · Programmes · Plus
  icone: "🗂️",
  titre: "Mes programmes",
  accroche: "Tes programmes réutilisables au même endroit : tes séances en cours, ta base de programmes prêts à l'emploi et ta bibliothèque.",
  onglets(){ return [["", "Mes séances"], ["base", "Ma base"], ["bibliotheque", "Ma bibliothèque"]]; },
  onglet(){ const s = String(sousRoute || ""); return this.onglets().some(o => o[0] === s) ? s : ""; },
  html(){
    const ici = this.onglet();
    return `<nav class="tabs mp-onglets" aria-label="${esc(trad("Mes programmes"))}">${this.onglets().map(([s, nom]) =>
      `<a class="tab${s === ici ? " on" : ""}" href="#/mes-programmes${s ? "/" + s : ""}"${s === ici ? ' aria-current="page"' : ""} data-mp="${s}">${esc(trad(nom))}</a>`).join("")}</nav>
      <div id="mp-zone">${ici === "" ? outilAtelier.html() : ici === "bibliotheque" ? outilBibliotheque.html() : `<section class="panel">${squelette()}</section>`}</div>`;
  },
  async init(){
    const ici = this.onglet();
    if (ici === "") return outilAtelier.init();
    if (ici === "bibliotheque") return outilBibliotheque.init();
    return this.base();
  },
  /* « Ma base » : les programmes prêts à l'emploi ; Modifier / Dupliquer les reprennent dans « Mes séances » */
  async base(){
    const zone = $("mp-zone"); if (!zone) return;
    let l = null;
    try { l = await Catalogue.programmes(); } catch(e){ l = null; }
    if (!zone.isConnected) return;
    /* v102 : la liste lue en base, pas un repli vide ou les fichiers de secours : sinon « Pas de connexion » */
    if (!Array.isArray(l) || !(Catalogue._c && Catalogue._c.programmes_types === l)){ pageHorsLigne(zone); return; }
    const nbExos = p => (p.seances || []).reduce((n, s) => n + ((s.exercices || []).filter(e => e && e.nom).length), 0);
    zone.innerHTML = `<section class="panel"><h2>${esc(trad("Ma base"))} <span class="pastille">${fmt(l.length)}</span></h2>
      <p class="note" style="margin-top:0">${esc(trad("Ces programmes sont proposés dans « Programmes prêts à l'emploi », sur la fiche de chaque client. « Modifier » et « Dupliquer » les reprennent dans « Mes séances » : enregistre-les ensuite dans ta base."))}</p>
      ${l.length ? l.map(p => `<div class="biblio-l" data-mp-prog="${esc(p.id)}"><span class="nom">${esc(p.nom || "")}</span>
        <span class="meta">${esc([p.lieu, p.seances_semaine ? p.seances_semaine + " " + trad("séances / semaine") : "", p.niveau, p.objectif].filter(Boolean).join(" · "))} · ${fmt(nbExos(p))} ${esc(trad("exercices"))}</span>
        <span class="actions-b"><button type="button" data-mp-modifier="${esc(p.id)}">${esc(trad("Modifier"))}</button><button type="button" data-mp-dupliquer="${esc(p.id)}">${esc(trad("Dupliquer"))}</button></span></div>`).join("")
      : `<div class="empty">${esc(trad("Aucun programme dans ta base pour le moment. Construis-en un dans « Mes séances », puis « Enregistrer dans ma base »."))}</div>`}
    </section>`;
    const reprendre = (id, copie) => { outilAtelier.aCharger = { id, copie }; location.hash = "#/mes-programmes"; };
    $$("[data-mp-modifier]", zone).forEach(b => b.addEventListener("click", () => reprendre(b.dataset.mpModifier, false)));
    $$("[data-mp-dupliquer]", zone).forEach(b => b.addEventListener("click", () => reprendre(b.dataset.mpDupliquer, true)));
  }
};
