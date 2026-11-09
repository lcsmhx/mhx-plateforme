/* ------------------------------------------------------------------
   OUTIL — Nutrition : la journee type
   Le coach la genere depuis la fiche du client, la relit, l'envoie.
   Le client la consulte. Les aliments et recettes viennent du
   catalogue Supabase (Catalogue.aliments / Catalogue.recettes).
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   v97 (chantier 2 de la nuit du 10/11, plan-etape4) — LE BROUILLON DES DIÈTES
   Même mécanique que les programmes (BrouillonProg, v96) : le coach travaille dans un brouillon rangé sur SON compte
   (clé brouillons_repas, une entrée par client) ; le client ne voit rien avant « Publier les changements ».
     { v: 1, clients: { <compte du client>: { programme (la diète), base_maj, depart, debut_le, ecrit_le, appareil, nouveau_bloc? } } }
   - depart : les repas de la version publiée quand le brouillon a commencé (« recette|nom » par jour et par repas) : à la
     publication, un repas que le client a changé depuis (« Remplacer », change_client) est compté et annoncé.
   Le document repas garde sa forme (on ajoute seulement publie_le) ; la liste de courses et les repas cochés du client ne
   repartent de zéro qu'à la publication (alignerCourses). Aucune écriture à la lecture.
   ------------------------------------------------------------------ */
const BrouillonRepas = Object.assign(Object.create(BrouillonProg), {
  cle: "brouillons_repas",
  /* ce que voit le client (sans maj, debut, publie_le ni les champs du coach) */
  empreinte(x){
    x = Forme.objet(x) ? x : {};
    const s = v => v == null ? "" : String(v), n = v => Math.round(Number(v) || 0);
    const c = Forme.objet(x.cible) ? x.cible : null;
    const jours = Array.isArray(x.jours) ? x.jours : (Array.isArray(x.repas) && x.repas.length ? [{ nom: "", repas: x.repas }] : []);
    return JSON.stringify({ nom: s(x.nom), note: s(x.note), regime: s(x.regime), nb: n(x.nb_repas),
      allergenes: (Array.isArray(x.allergenes) ? x.allergenes : []).map(s).sort(),
      cible: c ? [n(c.kcal), n(c.prot), n(c.gluc), n(c.lip)] : null,
      jours: jours.filter(Forme.objet).map(j => [s(j.nom), (Array.isArray(j.repas) ? j.repas : []).filter(Forme.objet).map(r => [s(r.moment), s(r.nom), s(r.recette_id),
        (Array.isArray(r.ingredients) ? r.ingredients : []).filter(Forme.objet).map(i => s(i.aliment_id) + ":" + n(i.grammes)).join(",")])]) });
  },
  depuis(R){
    const b = JSON.parse(JSON.stringify(Object.assign(outilNutrition.vide(), R || {})));
    return outilNutrition.migrer(b);
  },
  cleRepas(c){ return Forme.objet(c) ? String(c.recette_id || "") + "|" + String(c.nom || "") : ""; },
  depart(R){ return ((R && R.jours) || []).map(j => ((j && j.repas) || []).map(c => this.cleRepas(c))); },
  /* les repas que le client a changés (« Remplacer ») depuis le début du brouillon */
  changesClient(enBase, depart){
    let n = 0;
    ((enBase && enBase.jours) || []).forEach((j, d) => ((j && j.repas) || []).forEach((c, i) => {
      if (Forme.objet(c) && c.change_client && (!depart || !depart[d] || depart[d][i] !== this.cleRepas(c))) n++;
    }));
    return n;
  },
  nouveauBloc(R){ const b = this.depuis(R); b.debut = ""; b.maj = ""; const m = /^(.*?\bbloc\s*)(\d+)(.*)$/i.exec(b.nom || ""); if (m) b.nom = m[1] + (parseInt(m[2], 10) + 1) + m[3]; return b; },
  /* « ≈ identique à la semaine d'avant » : même repas, même jour, même place */
  identiqueRepas(ref, d, i, c){
    const j = ref && Array.isArray(ref.jours) ? ref.jours[d] : null, a = j && Array.isArray(j.repas) ? j.repas[i] : null;
    return !!(a && Forme.objet(c) && this.cleRepas(a) === this.cleRepas(c));
  },

  /* Publier : { ok, repas, D } ; { ok:false, annule } ; { ok:false, refus } ; { ok:false } (réseau) */
  async publier(uid, Rpub, b, D){
    const moi = Store.moi(); if (!moi || !uid) return { ok: false };
    await this.vider(D, uid);   // le brouillon tapé à l'instant part d'abord (relu, fusionné : BrouillonProg, relecture v96)
    let lR, lD;
    try { await Auth.assurer(); [lR, lD] = await Promise.all([this.ligne(uid, "repas"), this.ligne(moi, this.cle)]); }
    catch(e){ return { ok: false, refus: !!(e && e.statut >= 400 && e.statut < 500 && [401, 408, 429].indexOf(e.statut) === -1) }; }
    if (Store.cible() !== uid) return { ok: false, annule: true };
    const enBase = outilNutrition.migrer(Object.assign(outilNutrition.vide(), Forme.cle("repas", lR && lR.contenu) || {}));
    const moiE = this.entree(D, uid);
    const nbClient = this.changesClient(enBase, moiE && moiE.depart ? moiE.depart : this.depart(Rpub));
    const ailleurs = this.empreinte(enBase) !== this.empreinte(Rpub);
    const autres = Forme.objet(lD && lD.contenu) && Forme.objet(lD.contenu.clients) ? lD.contenu.clients[uid] : null;
    const autreAppareil = this.autreAppareil(autres, moiE, b);   // sans comparer les heures de deux appareils (BrouillonProg)
    /* la fenêtre « Publier » : ce qui va changer chez le client, et ce qui s'est passé entre-temps */
    const lignes = [trad("Publier cette diète ? Ton client la verra à sa prochaine ouverture ; sa liste de courses et ses repas cochés repartiront de zéro.")];
    if (nbClient) lignes.push(trad(nbClient > 1 ? "Attention : ton client a changé {n} repas depuis le début de ton brouillon (« Remplacer ») : ton brouillon remplacera ses choix." : "Attention : ton client a changé {n} repas depuis le début de ton brouillon (« Remplacer ») : ton brouillon remplacera son choix.", { n: nbClient }));
    else if (ailleurs) lignes.push(trad("Attention : la diète de ce client a été modifiée ailleurs (autre appareil ou autre onglet{q}) depuis que tu as ouvert cette page : ton brouillon la remplacera.", { q: lR && lR.maj_le ? ", " + this.dateHeure(lR.maj_le) : "" }));
    if (autreAppareil) lignes.push(trad("Ce brouillon a aussi été modifié sur un autre appareil ({q}) : c'est la version de cet appareil qui sera publiée.", { q: this.dateHeure(autres.ecrit_le) || "?" }));
    if (!(await UI.confirmer(lignes.join("\n\n"), { titre: trad("Publier les changements"), ok: trad("Publier"), annuler: trad("Ne rien publier"), danger: !!(nbClient || ailleurs || autreAppareil) }))) return { ok: false, annule: true };
    if (Store.cible() !== uid) return { ok: false, annule: true };
    if (Historique.utile("repas", enBase)){
      const archive = Object.assign({}, enBase, { maj: enBase.maj || enBase.debut || aujourdhui() });
      if (!(await Historique.archiver("repas", archive)) && !(await UI.confirmer(trad("L'ancienne diète n'a pas pu être rangée dans l'historique. La remplacer quand même ?"), { ok: trad("Remplacer"), danger: true }))) return { ok: false, annule: true };
    }
    if (Store.cible() !== uid) return { ok: false, annule: true };
    const N = JSON.parse(JSON.stringify(b));
    N.maj = new Date().toLocaleDateString("fr-FR");
    if (!N.debut || (moiE && moiE.nouveau_bloc)) N.debut = aujourdhui();
    N.publie_le = new Date().toISOString();
    try {
      await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", {
        method: "POST", headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: [{ user_id: uid, outil: "repas", contenu: N, maj_le: N.publie_le }]
      });
    } catch(e){
      /* réponse perdue (délai dépassé) alors que la base a écrit : on relit avant de dire « Pas publié » */
      const refus = !!(e && e.statut >= 400 && e.statut < 500 && [401, 408, 429].indexOf(e.statut) === -1);
      let arrive = false;
      if (!refus) try { const l = await this.ligne(uid, "repas"); arrive = !!(l && Forme.objet(l.contenu) && l.contenu.publie_le === N.publie_le); } catch(e2){}
      if (!arrive) return { ok: false, refus };
    }
    Store.boite(uid).repas = Rpub;
    Store.majLu[uid + "|repas"] = N.publie_le;
    majEtat("enregistre");
    /* la base relue juste avant fait foi pour les brouillons des autres clients (jamais les entrées de la page) */
    Object.keys(D.clients || {}).forEach(k => { if (k !== uid) delete D.clients[k]; });
    const autresB = Forme.objet(lD && lD.contenu) && Forme.objet(lD.contenu.clients) ? lD.contenu.clients : {};
    Object.keys(autresB).forEach(k => { if (k !== uid) D.clients[k] = autresB[k]; });
    delete D.clients[uid];
    this.planifier(D, uid);
    return { ok: true, repas: N, D: D };
  },

  etatHTML(b, ref, Rpub, entree){
    const brouillon = this.differe(b, ref) || !!(entree && entree.nouveau_bloc);
    return `<section class="panel nu-etat${brouillon ? " brouillon" : ""}" id="nu-etat">
      <div class="seance-c-tete" style="margin-bottom:6px"><h2 style="margin:0;flex:1">${esc(b.nom || trad("Sa diète"))}</h2>
        ${brouillon ? `<span class="pastille attention" id="nu-statut">● ${esc(trad("Brouillon non publié"))}</span>` : `<span class="pastille ok" id="nu-statut">✓ ${esc(trad("Publié"))}</span>`}</div>
      <p class="note" style="margin:0 0 10px">${esc(brouillon
        ? (entree && entree.nouveau_bloc ? trad("Nouvelle semaine type en préparation. Ton client voit toujours l'ancienne tant que tu n'as pas publié.")
                                         : trad("Ton client voit toujours la version publiée{d} tant que tu n'as pas publié.", { d: Rpub.maj ? " " + trad("du {d}", { d: Rpub.maj }) : "" }))
        : (Rpub.maj ? trad("Ton client voit exactement cette version (publiée le {d}).", { d: Rpub.maj }) : trad("Tes changements restent dans un brouillon : ton client ne voit rien avant « Publier les changements ».")))}</p>
      <div class="actions">
        <button type="button" class="btn" id="nu-publier">${esc(trad("Publier les changements"))}</button>
        ${brouillon ? `<button type="button" class="btn ghost" id="nu-annuler-brouillon">${esc(trad("Annuler le brouillon"))}</button>` : ""}
        <button type="button" class="btn ghost" id="nu-nouveau-bloc">${esc(trad("Nouvelle semaine à partir de celle-ci"))}</button>
        <span class="msg" id="nu-pub-msg" role="status"></span>
      </div>
    </section>`;
  }
});

const outilNutrition = {
  id: "nutrition",
  cle: "repas",
  nom: "Nutrition",
  principal: true,
  icone: "🥗",
  titre: "La journée type",
  accroche: "Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies.",

  vide(){ return { nom:"", note:"", cible:null, regime:"", allergenes:[], jours:[], nb_repas:0, maj:"" }; },

  /* La structure de la journee : celle que le client a declaree, sinon
     quatre repas. On renvoie toujours une copie — les parts sont
     renormalisees plus loin si un creneau n'a aucune recette. */
  structure(nb){
    const st = CONFIG.nutrition.structures[nb] || CONFIG.nutrition.structures[CONFIG.nutrition.repas_defaut];
    return st.map((sl, i) => Object.assign({}, sl, { ordre: i }));
  },

  /* « 4 repas (3 + une collation) » -> 4 */
  nbDepuisReponse(reponse){
    const m = String(reponse || "").match(/^(\d)/);
    const n = m ? +m[1] : 0;
    return (n >= 2 && n <= 6) ? n : 0;
  },

  JOURS: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"],

  /* Les plans crees avant la semaine n'avaient qu'une journee type.
     On les convertit au premier chargement plutot que de les perdre. */
  migrer(R){
    if (!R.jours) R.jours = [];
    if (!R.jours.length && R.repas && R.repas.length){
      R.jours = [{ nom: this.JOURS[0], repas: R.repas, manquants: R.manquants || [],
                   complement: R.complement || null, diagnostic: R.diagnostic || [] }];
    }
    delete R.repas;
    R.jours.forEach((j, i) => { if (!j.nom) j.nom = this.JOURS[i % 7]; if (!j.repas) j.repas = []; });
    return R;
  },

  /* v67 (D3) : empreinte de TOUTE la diete (semaine, dates debut / maj, cible, note…), cles triees : la base (jsonb)
     renvoie les cles dans son propre ordre, une meme diete doit donner la meme empreinte */
  signature(R){
    return JSON.stringify(R || {}, (k, v) => (v && typeof v === "object" && !Array.isArray(v))
      ? Object.keys(v).sort().reduce((o, c) => { o[c] = v[c]; return o; }, {}) : v);
  },

  /* v67 (D3) : la diete telle qu'elle est en base, lue comme a l'ouverture de la page (meme regle que Store.lire, sans
     toucher au cache ni aux drapeaux de lecture) ; null si la lecture echoue (hors ligne, reseau). Une copie de
     l'appareil (remplacement dont l'envoi a rate) part d'abord (6 s au plus) ; si elle attend encore et qu'elle est plus
     recente que la base, c'est elle qui est servie (comme a l'ouverture de la page) : pas de faux « changé entre-temps ». */
  async relire(){
    const uid = Store.cible(); if (!uid) return null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
    if (Store.aUneCopie(uid, this.cle)) try { await Promise.race([Store.reprendre(), new Promise(r => setTimeout(r, 6000))]); } catch(e){}
    try {
      const r = await Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + encodeURIComponent(this.cle) + "&select=contenu,maj_le");
      const copie = Store.copieAServir(uid, this.cle, r && r[0]);
      const c = Forme.cle(this.cle, copie ? copie.v : (r && r[0] && r[0].contenu));
      return this.migrer(c ? Object.assign({}, this.vide(), c) : this.vide());
    } catch(e){ return null; }
  },

  /* Une semaine, ce n'est pas sept fois la meme journee : on retient les
     recettes deja servies pour ne pas les reproposer le lendemain. */
  async composerSemaine(cible, regime, allergenes, nb, progres, nbRepas, shaker){
    const jours = [], vus = [];
    for (let i = 0; i < nb; i++){
      if (progres) progres(i + 1, nb);
      const liste = await this.composer(cible, regime, allergenes, vus.slice(), nbRepas, shaker);
      liste.forEach(c => { if (c.recette_id && vus.indexOf(c.recette_id) === -1) vus.push(c.recette_id); });
      jours.push({ nom: this.JOURS[i % 7], repas: liste, manquants: liste.manquants || [],
                   complement: liste.complement || null, diagnostic: liste.diagnostic || [] });
    }
    return jours;
  },

  /* Un shaker n'est pas une recette du catalogue : on fabrique sa carte a la
     main, avec l'ingredient unique qu'il est. */
  carteShaker(sh, slot){
    return {
      moment: slot.id, moment_nom: slot.nom, ordre: (slot.ordre != null ? slot.ordre : 0),
      recette_id: null, shaker: true,
      nom: sh.nom + " — " + sh.dose + " " + (sh.unite || "g"),
      temps_min: 1,
      etapes: ["Mélange " + sh.dose + " " + (sh.unite || "g") + " dans 250 à 300 ml d'eau ou de lait végétal."],
      ingredients: [{ aliment_id: null, nom: sh.nom, categorie: "Compléments", grammes: sh.dose, fige: true }],
      macros: { kcal: sh.kcal, proteines: sh.proteines, glucides: sh.glucides, lipides: sh.lipides },
      allergenes: [], inconnus: 0
    };
  },

  /* ================= filtrage : le point sensible ================= */
  compatible(r, regime, allergenes){
    if (allergenes && allergenes.length){
      const a = r.allergenes || [];
      for (let i = 0; i < allergenes.length; i++) if (a.indexOf(allergenes[i]) > -1) return false;
    }
    if (regime && regime !== "Omnivore"){
      const cle = this.cleRegime(regime);
      if (cle && (r.regimes || []).indexOf(cle) === -1) return false;
    }
    return true;
  },
  cleRegime(nom){
    return {
      "Omnivore":"omnivore", "Végétarien":"vegetarien", "Végétalien (vegan)":"vegan",
      "Pescétarien":"pescetarien", "Paléo":"paleo", "Sans gluten":"sans_gluten",
      "Sans lactose":"sans_lactose", "Sans porc ni alcool":"sans_porc"
    }[nom] || "";
  },

  /* ================= composition automatique ================= */
  async composer(cible, regime, allergenes, eviterIds, nbRepas, shaker){
    const recettes = await Catalogue.recettes();
    const dispo = recettes.filter(r => this.compatible(r, regime, allergenes));
    const structure = this.structure(nbRepas);
    const servis = structure.filter(sl => dispo.some(r => r.moment === sl.id));
    const manquants = structure.filter(sl => servis.indexOf(sl) === -1);
    /* Un creneau sans aucune recette compatible est retire, et ses calories
       sont reparties sur les autres : mieux vaut trois repas justes que
       quatre dont un vide. */

    /* Le client prend une poudre proteinee : sa premiere collation devient le
       shaker, avec ses vraies macros. Sans ca on lui ferait manger une
       collation EN PLUS de son shaker — soit 25 g de proteines comptees deux
       fois, et une journee qui ne tombe jamais juste.
       Les calories du shaker sont retirees de l'enveloppe, et ce qui reste est
       reparti sur les autres repas : un shaker leger ne doit pas faire une
       journee legere. */
    const slotShaker = shaker ? servis.find(sl => sl.id === "collation") : null;
    const kcalShaker = slotShaker ? (shaker.kcal || 0) : 0;
    const sommeRest  = servis.reduce((t, sl) => t + (sl === slotShaker ? 0 : sl.part), 0);
    const kcalDispo  = Math.max(0, cible.kcal - kcalShaker);

    const sortie = [];
    for (const slot of servis){
      if (slot === slotShaker){ sortie.push(this.carteShaker(shaker, slot)); continue; }
      const kcalSlot = kcalDispo * (sommeRest > 0 ? slot.part / sommeRest : slot.part);
      let choix = dispo.filter(r => r.moment === slot.id);
      /* dejaPris : deux collations dans la meme journee ne doivent pas etre
         la meme recette. eviterIds couvre les autres jours de la semaine. */
      const aEcarter = (eviterIds || []).concat(sortie.map(c => c.recette_id).filter(Boolean));
      const evites = choix.filter(r => aEcarter.indexOf(r.id) === -1);
      if (evites.length) choix = evites;
      const r = choix[Math.floor(Math.random() * choix.length)];
      const base = await Catalogue.macros(r, 1);
      let f = base.kcal > 0 ? kcalSlot / base.kcal : 1;
      f = Math.min(CONFIG.nutrition.facteur_max, Math.max(CONFIG.nutrition.facteur_min, f));
      sortie.push(await this.figer(r, f, slot));
    }
    /* Les recettes sont choisies et mises a l'echelle des calories ;
       on affine ensuite les portions pour tomber sur les macros. */
    if (sortie.length && cible && cible.prot){
      await this.ajusterAuxMacros(sortie, cible);
      const ajouts = [];
      /* Jusqu'a trois complements : un seul ne suffit pas toujours
         quand le regime limite fortement les sources de proteines. */
      for (let n = 0; n < 3; n++){
        const ajoutP = await this.completerProteines(sortie, cible, regime, allergenes,
                                                     ajouts.map(x => x.id));
        if (!ajoutP) break;
        await this.ajusterAuxMacros(sortie, cible);
        ajouts.push(ajoutP);
      }
      const ajoutG = await this.completerEnergie(sortie, cible, regime, allergenes);
      if (ajoutG){ await this.ajusterAuxMacros(sortie, cible); ajouts.push(ajoutG); }
      if (ajouts.length) sortie.complement = ajouts;
      sortie.diagnostic = this.diagnostic(sortie, cible);
    }
    sortie.manquants = manquants.map(sl => sl.nom);
    return sortie;
  },

  /* v97 (4b) : « Changer ce repas » : jusqu'à n recettes du même moment, TOUJOURS compatibles avec le régime et les allergies
     de la diète (compatible), différentes du repas actuel et des recettes déjà servies dans la semaine (sauf s'il n'y en a
     pas assez), à la même énergie que le repas remplacé */
  async propositions(x, R, n){
    const recettes = await Catalogue.recettes();
    const dans = new Set(); (R.jours || []).forEach(j => (j.repas || []).forEach(c => { if (c && c.recette_id) dans.add(c.recette_id); }));
    let l = recettes.filter(r => r.moment === x.moment && r.id !== x.recette_id && this.compatible(r, R.regime, R.allergenes));
    const neufs = l.filter(r => !dans.has(r.id));
    if (neufs.length >= n) l = neufs;
    l = l.map(r => ({ r, k: Math.random() })).sort((a, b) => a.k - b.k).slice(0, n).map(o => o.r);
    const slot = CONFIG.nutrition.repas.find(s => s.id === x.moment) || { id: x.moment, nom: x.moment_nom || "" };
    const kcal = (x.macros && x.macros.kcal) || 0, sortie = [];
    for (const r of l){
      const base = await Catalogue.macros(r, 1);
      let f = kcal > 0 && base.kcal > 0 ? kcal / base.kcal : 1;
      f = Math.min(CONFIG.nutrition.facteur_max, Math.max(CONFIG.nutrition.facteur_min, f));
      const c = await this.figer(r, f, slot);
      if (x.ordre != null) c.ordre = x.ordre;
      if (x.moment_nom) c.moment_nom = x.moment_nom;
      sortie.push(c);
    }
    return sortie;
  },
  /* v97 (4d) : la cible que donnent « Ses calories » (clé calc) ; null sans poids */
  cibleDepuis(calc){
    if (!calc || !num(calc.poids)) return null;
    const bmr = outilCalculateur.metabolismeDeBase(calc), tdee = bmr * outilCalculateur.facteurActivite(calc).total, c = CONFIG.calcul;
    const kcal = Math.max(calc.objectif === "perte" ? tdee * (1 - c.deficit_perte) : calc.objectif === "prise" ? tdee * (1 + c.surplus_prise) : tdee, outilCalculateur.plancher(calc.sexe));
    const m = outilCalculateur.macros(kcal, calc.poids);
    return { kcal: Math.round(kcal), prot: Math.round(m.prot), lip: Math.round(m.lip), gluc: Math.round(m.gluc) };
  },

  /* On fige la recette dans le plan : le client garde ses grammages
     meme si la recette change plus tard dans le catalogue. */
  async figer(r, f, slot){
    const idx = await Catalogue.indexAliments();
    const carte = {
      moment: slot.id, moment_nom: slot.nom, ordre: (slot.ordre != null ? slot.ordre : 0),
      recette_id: r.id, nom: r.nom,
      temps_min: r.temps_min || null, etapes: r.etapes || [],
      ingredients: (r.ingredients || []).map(i => {
        const a = idx[i.aliment_id] || {};
        return { aliment_id: i.aliment_id, nom: a.nom || i.aliment_id,
                 categorie: a.categorie || null, grammes: Math.round(i.grammes * f) };
      })
    };
    await this.recalculer(carte);
    return carte;
  },

  /* Macros d'une carte, recalculees depuis ses ingredients et leurs grammes.
     Un ingredient inconnu du catalogue est signale, jamais ignore en silence :
     sinon le plat serait annonce plus leger qu'il n'est. */
  async recalculer(carte){
    /* Un shaker n'a pas d'aliment dans le catalogue : ses macros sont posees
       une fois pour toutes a la creation de la carte. (A ne pas confondre
       avec « complement », qui designe ici les aliments d'appoint ajoutes
       pour atteindre la cible — ceux-la ont bien un aliment_id.) */
    if (carte.shaker) return carte;
    const idx = await Catalogue.indexAliments();
    const t = { kcal:0, proteines:0, glucides:0, lipides:0 };
    let inconnus = 0; const al = {};
    (carte.ingredients || []).forEach(i => {
      const a = idx[i.aliment_id];
      if (!a){ inconnus++; return; }
      const k = i.grammes / 100;
      t.kcal += (+a.kcal||0)*k; t.proteines += (+a.proteines||0)*k;
      t.glucides += (+a.glucides||0)*k; t.lipides += (+a.lipides||0)*k;
      (a.allergenes || []).forEach(x => { al[x] = true; });
      if (!i.nom) i.nom = a.nom;
      if (!i.categorie) i.categorie = a.categorie;
    });
    carte.macros = { kcal: Math.round(t.kcal), proteines: Math.round(t.proteines),
                     glucides: Math.round(t.glucides), lipides: Math.round(t.lipides) };
    carte.allergenes = Object.keys(al);
    carte.inconnus = inconnus;
    return carte;
  },

  /* ================= ajustement fin aux macros =================
     Mettre la journee au bon nombre de calories ne suffit pas : un plan
     a 2 400 kcal peut tres bien tomber 30 g de proteines sous la cible,
     et c'est justement le chiffre qui compte pour garder du muscle.
     On retouche donc les portions ingredient par ingredient.

     Le principe, en une phrase : chaque ingredient est range dans la
     famille du macro qu'il apporte surtout (proteines, glucides, lipides,
     ou legumes), et on ajuste une poignee de curseurs — un par famille —
     jusqu'a ce que la journee tombe juste. Les legumes ne bougent pas :
     ils ne servent pas de variable d'ajustement.
     ================================================================ */
  famille(a){
    const kcal = (+a.kcal) || 0;
    if (kcal < 25) return "legume";                       // legumes, fruits peu caloriques
    const p = (+a.proteines||0)*4, g = (+a.glucides||0)*4, l = (+a.lipides||0)*9;
    const t = p + g + l;
    if (t <= 0) return "legume";
    if (p / t >= 0.40) return "proteines";
    if (l / t >= 0.55) return "lipides";
    if (g / t >= 0.45) return "glucides";
    return "legume";
  },

  async ajusterAuxMacros(cartes, cible){
    const idx = await Catalogue.indexAliments();
    const A = CONFIG.nutrition.ajustement;
    const lignes = [];
    cartes.forEach((c, ci) => (c.ingredients || []).forEach((i, ii) => {
      const a = idx[i.aliment_id]; if (!a) return;
      const gras = ((+a.lipides||0) * 9) / Math.max(1, (+a.kcal||1)) > 0.85;
      lignes.push({ ci, ii, a, base: i.grammes, fam: this.famille(a),
                    max: Math.min(gras ? A.plafond_gras : A.plafond_solide, i.grammes * A.mult_max),
                    min: Math.max(A.plancher, i.grammes * A.mult_min) });
    }));
    if (!lignes.length) return { ok:false };

    const familles = ["proteines","glucides","lipides"];
    const mult = { proteines:1, glucides:1, lipides:1, legume:1 };

    /* grammes courants d'une ligne, bornes comprises */
    const grammes = (L) => Math.min(L.max, Math.max(L.min, L.base * mult[L.fam]));
    const total = () => {
      const t = { proteines:0, glucides:0, lipides:0, kcal:0 };
      lignes.forEach(L => {
        const k = grammes(L) / 100;
        t.proteines += (+L.a.proteines||0)*k; t.glucides += (+L.a.glucides||0)*k;
        t.lipides   += (+L.a.lipides||0)*k;   t.kcal     += (+L.a.kcal||0)*k;
      });
      return t;
    };
    /* ce qu'apporte une famille sur un macro donne, aux grammages courants */
    const apport = (fam, macro) => {
      let v = 0;
      lignes.forEach(L => { if (L.fam === fam) v += (+L.a[macro]||0) * grammes(L) / 100; });
      return v;
    };

    /* Ce que les cartes non ajustables apportent deja — le shaker. On le
       retire de la cible : sinon le reste de la journee serait cale sur la
       cible ENTIERE, et le shaker viendrait s'ajouter par-dessus. */
    const fixe = { kcal:0, prot:0, lip:0 };
    cartes.forEach(c => {
      if (!c.shaker) return;
      const m = c.macros || {};
      fixe.kcal += +m.kcal || 0; fixe.prot += +m.proteines || 0; fixe.lip += +m.lipides || 0;
    });
    const reste = { kcal: Math.max(0, cible.kcal - fixe.kcal),
                    prot: Math.max(0, cible.prot - fixe.prot),
                    lip:  Math.max(0, cible.lip  - fixe.lip) };
    const cibles = { proteines: reste.prot, lipides: reste.lip };

    /* L'ordre suit la logique du calculateur : les proteines et les lipides
       sont fixes par le poids de corps, les glucides completent les calories.
       On cale donc les deux premieres familles sur leur macro, et la famille
       des glucides sur ce qui manque en calories — pas sur un objectif propre. */
    for (let tour = 0; tour < A.tours; tour++){
      ["proteines","lipides"].forEach(fam => {
        const t = total();
        const propre = apport(fam, fam);
        if (propre < 0.5) return;
        const autres = t[fam] - propre;
        const voulu  = Math.max(0, cibles[fam] - autres);
        mult[fam] = Math.min(A.mult_max, Math.max(A.mult_min, mult[fam] * (voulu / propre)));
      });
      const t = total();
      const kcalGluc = apport("glucides", "kcal");
      if (kcalGluc > 1){
        const voulu = Math.max(0, reste.kcal - (t.kcal - kcalGluc));
        mult.glucides = Math.min(A.mult_max, Math.max(A.mult_min, mult.glucides * (voulu / kcalGluc)));
      }
    }

    /* On applique, en arrondissant a 5 g : c'est ce qu'une balance de
       cuisine sait faire, et un gramme pres n'a aucun sens biologique. */
    lignes.forEach(L => {
      const g = Math.round(grammes(L) / A.pas_arrondi) * A.pas_arrondi;
      cartes[L.ci].ingredients[L.ii].grammes = Math.max(A.pas_arrondi, g);
    });
    for (const c of cartes) await this.recalculer(c);

    const fin = this.totaux({ repas: cartes });
    return {
      ok: true,
      ecarts: {
        kcal: Math.round(fin.kcal - cible.kcal),
        proteines: Math.round(fin.proteines - cible.prot),
        glucides: Math.round(fin.glucides - cible.gluc),
        lipides: Math.round(fin.lipides - cible.lip)
      }
    };
  },

  /* Quand les recettes choisies ne portent pas assez de proteines — cela
     arrive sur les regimes vegetariens et vegetaliens — on ajoute une
     source proteinee plutot que de livrer une journee sous la cible.
     C'est exactement ce que ferait un coach : compléter, pas laisser filer. */
  async completerProteines(cartes, cible, regime, allergenes, dejaUtilises){
    const manque = cible.prot - this.totaux({ repas: cartes }).proteines;
    if (manque < 15) return null;
    const alims = await Catalogue.aliments();
    const trouve = this.trouverComplement(alims, CONFIG.nutrition.ajustement.complements_proteines,
                                     regime, allergenes, x => (+x.proteines || 0) >= 10,
                                     dejaUtilises || []);
    if (!trouve) return null;
    const a = trouve.aliment;
    /* 250 g est deja une belle portion : au-dela, mieux vaut un deuxieme
       aliment qu'une assiette que personne ne finira. */
    const gr = Math.min(250, Math.max(20, Math.round(manque / (a.proteines / 100) / 5) * 5));
    const slot = CONFIG.nutrition.repas.find(s => s.id === "collation") || CONFIG.nutrition.repas[CONFIG.nutrition.repas.length - 1];
    const carte = {
      moment: slot.id, moment_nom: slot.nom, recette_id: null,
      nom: a.nom, temps_min: null, etapes: [],
      complement: true,
      ingredients: [{ aliment_id: a.id, nom: a.nom, categorie: a.categorie, grammes: gr }]
    };
    await this.recalculer(carte);
    cartes.push(carte);
    return { id: trouve.mot, nom: a.nom, grammes: gr };
  },

  /* Meme logique cote energie : si la journee reste nettement sous la cible
     apres ajustement, c'est que les recettes tirees ne portent pas assez de
     glucides — frequent en paleo ou en sans gluten. On ajoute une source
     glucidique compatible plutot que de livrer un plan qui affame le client. */
  async completerEnergie(cartes, cible, regime, allergenes){
    const t = this.totaux({ repas: cartes });
    const manque = cible.kcal - t.kcal;
    if (manque < cible.kcal * 0.06) return null;
    const alims = await Catalogue.aliments();
    const trouve = this.trouverComplement(alims, CONFIG.nutrition.ajustement.complements_glucides,
                                     regime, allergenes, x => (+x.glucides || 0) >= 12 && (+x.kcal || 0) > 60);
    if (!trouve) return null;
    const a = trouve.aliment;
    const gr = Math.min(400, Math.max(20, Math.round(manque / ((+a.kcal) / 100) / 5) * 5));
    const slot = CONFIG.nutrition.repas.find(s => s.id === "dejeuner") || CONFIG.nutrition.repas[0];
    const carte = {
      moment: slot.id, moment_nom: slot.nom, recette_id: null,
      /* "Riz blanc cru (accompagnement)" se lit mal dans une assiette :
         les grammages sont crus par convention, inutile de le repeter. */
      nom: a.nom.replace(/,?\s+crue?$/i, "") + " (accompagnement)", temps_min: null, etapes: [],
      complement: true,
      ingredients: [{ aliment_id: a.id, nom: a.nom, categorie: a.categorie, grammes: gr }]
    };
    await this.recalculer(carte);
    cartes.push(carte);
    return { id: trouve.mot, nom: a.nom, grammes: gr };
  },

  /* Cherche dans le catalogue le premier aliment de la liste ecrite dans
     CONFIG qui soit compatible avec le regime et les allergies. On prend le
     nom le plus court parmi les correspondances : dans une table officielle,
     "Riz blanc cru" passe avant "Riz blanc precuit assaisonne, en sachet". */
  trouverComplement(alims, souhaits, regime, allergenes, filtre, exclus){
    /* On exclut par mot-cle et non par identifiant : sans cela, "Oeuf cru"
       puis "Oeuf dur" seraient deux aliments differents pour le programme,
       et le client se retrouverait avec dix oeufs dans la journee. */
    for (const mot of souhaits){
      if ((exclus || []).indexOf(mot) > -1) continue;
      const cible = Normaliser.aplatir(mot);
      const trouves = alims
        .filter(a => Normaliser.aplatir(a.nom).indexOf(cible) > -1)
        .filter(a => filtre(a))
        /* "Son de riz" n'est pas du riz, "germe de ble" n'est pas du pain :
           ces sous-produits sortent en tete parce que leur nom est court. */
        .filter(a => !/(poudre|deshydrat|lyophilis|isolat|aromatis|gelee|gelatine|sauce|bouillon|conserve au sirop|sucre|confit|\bson de\b|germe de|farine de|amidon|fecule|extrait)/.test(Normaliser.aplatir(a.nom)) || /proteine|whey/.test(Normaliser.aplatir(a.nom)))
        .filter(a => this.compatible(a, regime, allergenes))
        .sort((a, b) => a.nom.length - b.nom.length);
      if (trouves.length) return { aliment: trouves[0], mot: mot };
    }
    return null;
  },

  /* Ce que le catalogue ne permet pas d'atteindre, on le dit — plutot que
     de livrer une journee fausse sans explication. */
  diagnostic(cartes, cible){
    const t = this.totaux({ repas: cartes });
    const msgs = [];
    const dK = t.kcal - cible.kcal, dP = t.proteines - cible.prot, dG = t.glucides - cible.gluc, dL = t.lipides - cible.lip;
    if (Math.abs(dP) > 12) msgs.push(`protéines ${dP > 0 ? "au-dessus" : "en dessous"} de ${fmt(Math.abs(dP))} g`);
    if (Math.abs(dL) > 15) msgs.push(`lipides ${dL > 0 ? "au-dessus" : "en dessous"} de ${fmt(Math.abs(dL))} g — sur ce régime, les sources de protéines apportent beaucoup de gras`);
    if (Math.abs(dK) > cible.kcal * 0.07) msgs.push(`calories ${dK > 0 ? "au-dessus" : "en dessous"} de ${fmt(Math.abs(dK))} kcal`);
    if (dG < -60) msgs.push(`glucides en dessous de ${fmt(Math.abs(dG))} g — ce régime offre peu de sources de glucides dans le catalogue`);
    return msgs;
  },

  totaux(jour){
    const t = { kcal:0, proteines:0, glucides:0, lipides:0 };
    ((jour && jour.repas) || []).forEach(x => {
      if (!x.macros) return;
      t.kcal += x.macros.kcal; t.proteines += x.macros.proteines;
      t.glucides += x.macros.glucides; t.lipides += x.macros.lipides;
    });
    return t;
  },

  moyenne(R){
    const j = (R.jours || []).filter(x => (x.repas || []).length);
    if (!j.length) return { kcal:0, proteines:0, glucides:0, lipides:0 };
    const t = { kcal:0, proteines:0, glucides:0, lipides:0 };
    j.forEach(x => { const d = this.totaux(x);
      t.kcal += d.kcal; t.proteines += d.proteines; t.glucides += d.glucides; t.lipides += d.lipides; });
    Object.keys(t).forEach(k => { t[k] = Math.round(t[k] / j.length); });
    return t;
  },

  /* ================= liste de courses =================
     Elle se calcule sur les jours coches, pas sur un multiplicateur :
     si le client mange chez ses parents le dimanche, il decoche dimanche
     et la liste s'ajuste. */
  courses(R, actifs){
    /* v86 (lot 1) : un objet sans prototype — un identifiant d'aliment écrit par le client (« __proto__ », « constructor »…)
       ne touche jamais aux objets communs de la page */
    const somme = Object.create(null);
    (R.jours || []).forEach((j, ji) => {
      if (actifs && actifs[ji] === false) return;
      (j.repas || []).forEach(c => (c.ingredients || []).forEach(i => {
        const cle = i.aliment_id;
        if (!somme[cle]) somme[cle] = { nom: i.nom || cle, categorie: i.categorie, grammes: 0 };
        somme[cle].grammes += i.grammes;
      }));
    });
    const rayons = CONFIG.nutrition.rayons.map(r => ({ id:r.id, nom:r.nom, categories:r.categories, lignes:[] }));
    const autre = { id:"autre", nom:"Divers", lignes:[] };
    Object.keys(somme).forEach(cle => {
      const l = somme[cle];
      const r = rayons.find(x => (x.categories || []).indexOf(l.categorie) > -1);
      (r || autre).lignes.push({ id: cle, nom: l.nom, grammes: Math.round(l.grammes) });
    });
    if (autre.lignes.length) rayons.push(autre);
    rayons.forEach(r => r.lignes.sort((a,b) => a.nom.localeCompare(b.nom, "fr")));
    return rayons.filter(r => r.lignes.length);
  },

  /* v71 (E) : les articles coches valent pour UNE diete (R.maj, pose par « Valider et envoyer », vide apres « Generer la
     semaine ») : une autre diete = panier vide. Ancien document sans courses_pour : on retient la diete d'aujourd'hui sans
     rien vider. En memoire seulement, comme la remise a zero de mange : ecrit avec la prochaine coche, jamais a l'ouverture. */
  /* v97 : une diète publiée porte publie_le (instant) : deux publications le même jour vident aussi le panier ; un ancien
     document sans publie_le garde sa règle (R.maj). Une autre diète : les repas cochés du jour repartent aussi de zéro. */
  alignerCourses(R, suivi){
    const pour = String(R.publie_le || R.maj || "");
    if (typeof suivi.courses_pour !== "string") suivi.courses_pour = pour;
    else if (suivi.courses_pour !== pour){ suivi.courses = {}; suivi.courses_pour = pour; if (R.publie_le) suivi.mange = {}; }
  },

  blocCourses(R, suivi, client){
    if (!(R.jours || []).some(j => (j.repas || []).length)) return "";
    const actifs = (suivi && suivi.joursCourses) || {};
    const coches = (suivi && suivi.courses) || {};
    const rayons = this.courses(R, actifs);
    const nbJours = (R.jours || []).filter((j, i) => actifs[i] !== false && (j.repas || []).length).length;
    const total = rayons.reduce((n, r) => n + r.lignes.length, 0);
    const faits  = rayons.reduce((n, r) => n + r.lignes.filter(l => coches[l.id]).length, 0);

    let h = `<section class="panel">
      <h2>Liste de courses</h2>
      <p class="note" style="margin-top:0">Coche les jours que tu veux acheter : la liste se recalcule. ${nbJours} jour${nbJours > 1 ? "s" : ""} sélectionné${nbJours > 1 ? "s" : ""}.</p>
      <div class="coches" style="margin-bottom:16px">${(R.jours || []).map((j, i) =>
        (j.repas || []).length ? `<label class="coche"><input type="checkbox" data-jc="${i}"${actifs[i] === false ? "" : " checked"}> ${esc(j.nom)}</label>` : "").join("")}</div>
      <div class="jauge"><i style="width:${total ? Math.round(faits / total * 100) : 0}%"></i></div>
      <p class="note" style="margin:8px 0 4px">${faits} article${faits > 1 ? "s" : ""} sur ${total} dans le panier.</p>
      ${client ? `<div class="actions" style="margin:4px 0 8px"><button type="button" class="btn ghost petit" data-vider-courses${Object.keys(coches).some(k => coches[k]) ? "" : " disabled"}>${esc(trad("Vider la liste"))}</button></div>` : ""}`;
    rayons.forEach(r => {
      h += `<h3 style="margin-top:18px">${esc(r.nom)}</h3><ul class="ingr courses-l">` +
        r.lignes.map(l => `<li class="${coches[l.id] ? "pris" : ""}"><label class="coche"><input type="checkbox" data-course="${esc(l.id)}"${coches[l.id] ? " checked" : ""}> ${esc(l.nom)}</label><b>${fmt(l.grammes)} g</b></li>`).join("") +
        `</ul>`;
    });
    h += `<p class="note" style="margin-top:16px">Les poids sont ceux qui entrent dans les recettes — crus pour la viande, le poisson et les féculents. Prévois un peu plus pour les pertes à la cuisson.</p></section>`;
    return h;
  },

  /* ================= onglets des jours ================= */
  ongletsJours(R, actif, prefixe){
    if (!(R.jours || []).length) return "";
    return `<div class="jours-onglets">${R.jours.map((j, i) => {
      const t = this.totaux(j);
      return `<button type="button" class="j-onglet${i === actif ? " ici" : ""}" data-${prefixe}="${i}">
        <span class="j-nom">${esc(j.nom)}</span>
        <span class="j-kcal">${(j.repas || []).length ? fmt(t.kcal) + " kcal" : "vide"}</span>
      </button>`;
    }).join("")}</div>`;
  },

  /* ================= vue client ================= */
  vueLecture(R, suivi, actif){
    if (!(R.jours || []).some(j => (j.repas || []).length)){
      return `<section class="panel"><div class="empty">Ton coach n'a pas encore validé tes repas. Remplis ton profil — régime et allergies comprises — pour qu'il puisse les préparer.${ctaVide(true)}</div></section>`;
    }
    const jour = R.jours[actif] || R.jours[0];
    const t = this.totaux(jour);
    const mange = { kcal:0, proteines:0, glucides:0, lipides:0 };
    (jour.repas || []).forEach((x, i) => {
      if (suivi.mange && suivi.mange[actif + ":" + i] && x.macros){
        mange.kcal += x.macros.kcal; mange.proteines += x.macros.proteines;
        mange.glucides += x.macros.glucides; mange.lipides += x.macros.lipides;
      }
    });
    const reste = Math.max(0, t.kcal - mange.kcal);
    const pct = t.kcal ? Math.min(100, Math.round(mange.kcal / t.kcal * 100)) : 0;

    /* v35 — repas respectes du jour affiche, et « aujourd'hui » nomme */
    const nbRepas = (jour.repas || []).length;
    const nbCoches = (jour.repas || []).filter((x, i) => suivi.mange && suivi.mange[actif + ":" + i]).length;
    const estAujourdhui = R.jours.length && actif === Math.min(R.jours.length - 1, (new Date().getDay() + 6) % 7);
    let h = "";
    if (R.note) h += `<section class="panel"><div class="flag info" style="margin:0"><b>${esc(trad("Mot du coach"))}</b><br>${esc(R.note)}</div></section>`;
    h += this.ongletsJours(R, actif, "jour");
    h += `<section class="panel">
      <div class="seance-c-tete"><h2>${esc(jour.nom)}${estAujourdhui ? ` <span class="pastille accent">${esc(trad("aujourd'hui"))}</span>` : ""}</h2>
        <span class="pastille${nbRepas && nbCoches >= nbRepas ? " ok" : ""}">${esc(trad("{a} / {b} repas respectés", { a: nbCoches, b: nbRepas }))}</span></div>
      <div class="jauge"><i style="width:${pct}%"></i></div>
      <p class="note" style="margin:8px 0 18px">${fmt(mange.kcal)} kcal consommées sur ${fmt(t.kcal)} — il te reste <b>${fmt(reste)} kcal</b> aujourd'hui.</p>
      <div class="grid g4 bilan-jour">
        <div class="tuile"><span class="t-lbl">Calories</span><span class="t-val readout">${fmt(t.kcal)}</span><span class="t-u">kcal prévus</span></div>
        <div class="tuile"><span class="t-lbl">Protéines</span><span class="t-val readout">${fmt(t.proteines)}</span><span class="t-u">g</span></div>
        <div class="tuile"><span class="t-lbl">Glucides</span><span class="t-val readout">${fmt(t.glucides)}</span><span class="t-u">g</span></div>
        <div class="tuile"><span class="t-lbl">Lipides</span><span class="t-val readout">${fmt(t.lipides)}</span><span class="t-u">g</span></div>
      </div>
      ${R.cible ? `<p class="note" style="margin-top:14px">Objectif visé : ${fmt(R.cible.kcal)} kcal · ${fmt(R.cible.prot)} g de protéines · ${fmt(R.cible.gluc)} g de glucides · ${fmt(R.cible.lip)} g de lipides.</p>` : ""}
    </section>`;
    (jour.repas || []).forEach((x, i) => h += this.carteRepas(x, false, actif + ":" + i, suivi));
    h += this.blocCourses(R, suivi, true);   // v71 (E) : bouton « Vider la liste » cote client seulement
    /* v100 (chantier 5) : les compléments vivent sous Nutrition (leur page garde son adresse) */
    if (!Store.idConsulte && !Auth.estProspect()) h += `<section class="panel" id="nu-complements"><div class="acces-l"><a class="acces" href="#/complements"><span class="ico">${ICONES.complements || ""}</span><span class="txt"><b>${esc(trad("Mes compléments"))}</b><small>${esc(trad("Les compléments conseillés par ton coach : doses et moments."))}</small></span><span class="fleche">›</span></a></div></section>`;
    h += `<section class="panel"><p class="note" style="margin:0">Les grammages sont donnés crus, sauf mention contraire. Si un plat ne te convient pas, touche « Remplacer » : l'app t'en propose un autre avec les mêmes calories.</p></section>`;
    if (R.maj) h += `<p class="note" style="text-align:center">Repas mis à jour le ${esc(R.maj)}</p>`;
    return h;
  },

  carteRepas(x, edition, cle, suivi, opts){
    opts = opts || {};
    const m = x.macros || { kcal:0, proteines:0, glucides:0, lipides:0 };
    const coche = suivi && suivi.mange && suivi.mange[cle];
    return `<section class="panel repas-c${coche ? " mange" : ""}">
      <div class="repas-tete">
        <div>
          <span class="eyebrow">${esc(x.moment_nom || "")}</span>
          <h2 style="margin:2px 0 0">${esc(x.nom)}</h2>
          ${edition && x.change_client ? `<span class="pastille">Changé par ton client</span>` : ""}
          ${opts.identique ? `<p class="ex-identique" data-repas-identique="${cle}">≈ ${esc(trad("identique à la semaine d'avant : à varier ?"))}</p>` : ""}
        </div>
        ${edition ? `<span class="actions-b">
          ${x.recette_id ? `<button data-autre="${cle}">${esc(trad("Changer ce repas"))}</button>` : ""}
          <button type="button" class="outil-pg" data-monter-r="${cle}" aria-label="${esc(trad("Monter le repas"))}"${opts.premier ? " disabled" : ""}>↑</button>
          <button type="button" class="outil-pg" data-descendre-r="${cle}" aria-label="${esc(trad("Descendre le repas"))}"${opts.dernier ? " disabled" : ""}>↓</button>
          <button data-retirer="${cle}">Retirer</button></span>`
        : `<span class="actions-b">${x.recette_id ? `<button type="button" data-remplacer="${cle}">Remplacer</button>` : ""}<button type="button" class="respect${coche ? " on" : ""}" data-mange="${cle}" aria-pressed="${coche ? "true" : "false"}">${coche ? "✓ " + esc(trad("Respecté")) : esc(trad("Respecté ?"))}</button></span>`}
      </div>
      <div class="repas-macros">
        <span><b>${fmt(m.kcal)}</b> kcal</span>
        <span><b>${fmt(m.proteines)}</b> g prot.</span>
        <span><b>${fmt(m.glucides)}</b> g gluc.</span>
        <span><b>${fmt(m.lipides)}</b> g lip.</span>
        ${x.temps_min ? `<span>${fmt(x.temps_min)} min</span>` : ""}
      </div>
      ${edition && opts.jours && opts.jours.length > 1 ? `<div class="dup-sur"><label for="dup-${esc(cle)}">${esc(trad("Dupliquer sur"))}</label><select id="dup-${esc(cle)}" data-dup-sur="${cle}"><option value="">${esc(trad("— choisis un jour —"))}</option>${opts.jours.map((j, k) => k === opts.jour ? "" : `<option value="${k}">${esc(j.nom || "")}</option>`).join("")}<option value="tous">${esc(trad("Tous les autres jours"))}</option></select></div>` : ""}
      ${edition ? `<div data-props="${cle}"></div>` : ""}
      ${x.inconnus ? `<div class="flag">${fmt(x.inconnus)} ingrédient${x.inconnus>1?"s":""} absent${x.inconnus>1?"s":""} du catalogue : les macros affichées sont incomplètes.</div>` : ""}
      <div class="grid g2" style="margin-top:14px">
        <div>
          <h3>Ingrédients</h3>
          <ul class="ingr">${(x.ingredients || []).map((g, j) => edition
            ? `<li><span>${esc(g.nom)}</span><span class="g-edit"><input type="number" min="0" step="5" value="${esc(g.grammes)}" data-gr="${cle}:${j}"> g <button class="del" data-suppr-i="${cle}:${j}" aria-label="Retirer">×</button></span></li>`
            : `<li><span>${esc(g.nom)}</span><b>${fmt(g.grammes)} g</b></li>`).join("")}</ul>
          ${edition ? `<div class="actions" style="margin-top:10px"><button class="btn ghost" data-ajout-i="${cle}">+ Ajouter un aliment</button></div>` : ""}
        </div>
        <div>
          ${edition ? `<h3>Préparation</h3>` : `<details class="prep"><summary>${esc(trad("Préparation"))}</summary>`}
          ${(x.etapes && x.etapes.length) ? `<ol class="etapes">${x.etapes.map(e => `<li>${esc(e)}</li>`).join("")}</ol>` : `<p class="note" style="margin:0">Aucune préparation : ce repas se compose tel quel.</p>`}
          ${edition ? "" : `</details>`}
        </div>
      </div>
    </section>`;
  },

  /* ================= vue coach ================= */
  vueEdition(R, ctx, actif){
    const jour = R.jours[actif] || null;
    const t = jour ? this.totaux(jour) : { kcal:0, proteines:0, glucides:0, lipides:0 };
    const ecart = (jour && R.cible) ? Math.round(t.kcal - R.cible.kcal) : 0;
    const moy = this.moyenne(R);

    /* v91 : questionnaire illisible (réseau) : ses allergies ne sont pas reprises ici. Bandeau en tête, et la composition
       automatique (« Générer la semaine », « Refaire … », « Autre proposition ») bloquée tant qu'il n'est pas relu ; la diète
       existante reste affichée et modifiable à la main. */
    const bloque = ctx.intakeIllisible ? " disabled" : "";
    let h = `<section class="panel">
      <h2>Composer la semaine</h2>
      ${ctx.intakeIllisible ? `<div class="flag grave" id="nu-intake-illisible" role="alert" style="margin-bottom:14px"><span><b>Questionnaire illisible : vérifie ses allergies avant de générer.</b> Son questionnaire n'a pas pu être lu (connexion) : ses allergies et ce qu'il a écrit ne sont pas repris ici. « Générer la semaine » et « Refaire » restent bloqués tant qu'il n'est pas relu ; tu peux toujours modifier la diète à la main.</span> <button type="button" class="btn petit" data-reessayer data-lecture-ok>Réessayer</button></div>` : ""}
      <div class="grid g2">
        <div><label for="nu-kcal">Calories visées</label><input id="nu-kcal" type="number" step="10" value="${R.cible ? Math.round(R.cible.kcal) : ""}" placeholder="2400"></div>
        <div><label for="nu-regime">Régime</label><select id="nu-regime">${CONFIG.nutrition.regimes.map(o => `<option value="${esc(o)}"${R.regime === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></div>
        <div><label for="nu-repas">Repas par jour</label><select id="nu-repas">
          ${[2,3,4,5,6].map(n => `<option value="${n}"${(R.nb_repas || CONFIG.nutrition.repas_defaut) === n ? " selected" : ""}>${n} repas — ${esc(this.structure(n).map(sl => sl.nom).join(", "))}</option>`).join("")}
        </select></div>
        <div><label for="nu-nb">Nombre de jours différents</label><select id="nu-nb">${[1,2,3,4,5,6,7].map(n => `<option value="${n}"${(R.jours.length || 7) === n ? " selected" : ""}>${n} jour${n>1?"s":""}</option>`).join("")}</select></div>
        <div style="grid-column:1/-1">
          <label>Allergènes à écarter</label>
          <div class="coches" id="nu-allerg">${CONFIG.nutrition.allergenes.map(a =>
            `<label class="coche"><input type="checkbox" value="${a.id}"${(R.allergenes || []).indexOf(a.id) > -1 ? " checked" : ""}> ${esc(a.nom)}</label>`).join("")}</div>
        </div>
        <div style="grid-column:1/-1"><label for="nu-note">Mot pour ton client</label><textarea id="nu-note" rows="2" placeholder="Consignes, substitutions autorisées…">${esc(R.note || "")}</textarea></div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn" id="nu-gen"${bloque}>Générer la semaine</button>
        ${R.jours.length ? `<button class="btn ghost" id="nu-gen-jour"${bloque}>Refaire seulement ${esc((R.jours[actif]||{}).nom || "ce jour")}</button>` : ""}
        <button class="btn ghost" id="nu-biblio-save">Enregistrer dans ma bibliothèque</button>
        <select id="nu-biblio" style="max-width:240px"><option value="">— charger depuis ma bibliothèque —</option></select>
        <span class="msg" id="nu-msg"></span>
      </div>
      ${ctx.calcCible && R.cible && Math.abs(ctx.calcCible.kcal - R.cible.kcal) >= 20 ? `<div class="flag" id="nu-ecart-kcal" role="status" style="margin-top:12px"><b>⚠ ${esc(trad("Ses calories ({a}) ≠ cette diète ({b})", { a: fmt(ctx.calcCible.kcal), b: fmt(R.cible.kcal) }))}</b> · ${esc(trad("« Ses calories » a changé depuis : rien n'est recalculé sans toi."))} <button type="button" class="btn petit" id="nu-reprendre-kcal">${esc(trad("Reprendre {a} kcal", { a: fmt(ctx.calcCible.kcal) }))}</button></div>` : ""}
      ${ctx.prerempli ? `<p class="note" style="margin-top:10px">Pré-rempli avec ${ctx.depuisQuestionnaire ? "son questionnaire — passe par « Ses calories » si tu veux affiner son activité" : "son profil et son calculateur"}.</p>` : ""}
      ${Catalogue.secours ? `<div class="flag" style="margin-top:12px"><b>Catalogue de secours.</b> Ta base ne répond pas — projet Supabase en pause, ou import jamais lancé. L'application lit les données depuis le dépôt pour rester utilisable, mais rien n'est enregistré tant que la base ne répond pas.</div>` : ""}
      ${ctx.autres ? `<div class="flag" style="margin-top:12px"><b>À vérifier avant d'envoyer :</b> ce client a écrit « ${esc(ctx.autres)} » dans ses allergies. Aucun filtre automatique ne couvre ce texte : relis les ingrédients toi-même.</div>` : ""}
    </section>`;

    if (!R.jours.length){
      h += `<section class="panel"><div class="empty">Aucun repas pour l'instant. Renseigne les calories visées et clique sur « Générer la semaine ».</div></section>`;
      return h + this.blocEnvoi(R);
    }

    h += `<section class="panel">
      <h2>La semaine en moyenne</h2>
      <div class="grid g4 bilan-jour">
        <div class="tuile"><span class="t-lbl">Calories</span><span class="t-val readout">${fmt(moy.kcal)}</span><span class="t-u">kcal / jour</span></div>
        <div class="tuile"><span class="t-lbl">Protéines</span><span class="t-val readout">${fmt(moy.proteines)}</span><span class="t-u">g / jour</span></div>
        <div class="tuile"><span class="t-lbl">Glucides</span><span class="t-val readout">${fmt(moy.glucides)}</span><span class="t-u">g / jour</span></div>
        <div class="tuile"><span class="t-lbl">Lipides</span><span class="t-val readout">${fmt(moy.lipides)}</span><span class="t-u">g / jour</span></div>
      </div>
      ${R.cible ? `<p class="note" style="margin-top:14px">Cible : ${fmt(R.cible.kcal)} kcal · ${fmt(R.cible.prot)} g prot. · ${fmt(R.cible.gluc)} g gluc. · ${fmt(R.cible.lip)} g lip. — moyenne de la semaine à <b>${moy.kcal - R.cible.kcal > 0 ? "+" : ""}${fmt(moy.kcal - R.cible.kcal)} kcal</b> et <b>${moy.proteines - R.cible.prot > 0 ? "+" : ""}${fmt(moy.proteines - R.cible.prot)} g</b> de protéines.</p>` : ""}
    </section>`;

    h += this.ongletsJours(R, actif, "jed");
    h += `<section class="panel">
      <h2>${esc(jour.nom)}</h2>
      <div class="grid g4 bilan-jour">
        <div class="tuile"><span class="t-lbl">Calories</span><span class="t-val readout">${fmt(t.kcal)}</span><span class="t-u">kcal</span></div>
        <div class="tuile"><span class="t-lbl">Protéines</span><span class="t-val readout">${fmt(t.proteines)}</span><span class="t-u">g</span></div>
        <div class="tuile"><span class="t-lbl">Glucides</span><span class="t-val readout">${fmt(t.glucides)}</span><span class="t-u">g</span></div>
        <div class="tuile"><span class="t-lbl">Lipides</span><span class="t-val readout">${fmt(t.lipides)}</span><span class="t-u">g</span></div>
      </div>
      ${R.cible ? `<p class="note" style="margin-top:14px">Écart du jour : <b>${ecart > 0 ? "+" : ""}${fmt(ecart)} kcal</b>${Math.abs(ecart) > R.cible.kcal * 0.1 ? " — au-delà de 10 %, ajuste un repas" : ""} · protéines <b>${t.proteines >= R.cible.prot ? "+" : ""}${fmt(t.proteines - R.cible.prot)} g</b>.</p>` : ""}
      ${(jour.manquants && jour.manquants.length) ? `<div class="flag"><b>Repas sans recette compatible :</b> ${esc(jour.manquants.join(", "))}. Leurs calories ont été réparties sur les autres repas.</div>` : ""}
      ${(jour.complement && jour.complement.length) ? `<p class="note">Complété avec ${jour.complement.map(c => `<b>${esc(c.nom)}</b> (${fmt(c.grammes)} g)`).join(" et ")} pour atteindre la cible.</p>` : ""}
      ${(jour.diagnostic && jour.diagnostic.length) ? `<div class="flag"><b>Ce que le catalogue ne permet pas d'atteindre ici :</b> ${esc(jour.diagnostic.join(" · "))}.</div>` : ""}
    </section>`;

    const nbR = (jour.repas || []).length;
    (jour.repas || []).forEach((x, i) => h += this.carteRepas(x, true, actif + ":" + i, null, { premier: i === 0, dernier: i === nbR - 1, jours: R.jours, jour: actif,
      identique: !!(ctx.ref && BrouillonRepas.identiqueRepas(ctx.ref, actif, i, x)) }));

    h += `<section class="panel">
      <h2>Ajouter à la main</h2>
      <div class="grid g2">
        <div style="grid-column:1/-1"><label for="nu-q">Chercher un aliment ou une recette</label>
          <input id="nu-q" type="search" placeholder="Poulet, flocons d'avoine, saumon…" autocomplete="off"></div>
        <div><label for="nu-slot">Dans quel repas</label><select id="nu-slot">${CONFIG.nutrition.repas.map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join("")}</select></div>
        <div><label for="nu-gr">Quantité (g)</label><input id="nu-gr" type="number" min="0" step="10" value="100"></div>
      </div>
      <div id="nu-res" class="resultats"></div>
      <p class="note" style="margin-top:12px">L'ajout se fait dans <b>${esc(jour.nom)}</b>. Ce qui ne respecte pas le régime ou les allergies du client est signalé en rouge : tu peux quand même l'ajouter, mais en connaissance de cause.</p>
    </section>`;

    h += this.blocCourses(R, { joursCourses:{}, courses:{} });
    return h + this.blocEnvoi(R);
  },

  blocEnvoi(R){
    return `<section class="panel">
      <div class="actions">
        <button class="btn" id="nu-publier-bas">${esc(trad("Publier les changements"))}</button>
        <span class="msg" id="nu-msg2"></span>
      </div>
      <p class="note" style="margin-top:10px">Un mot sur les glucides : ils apparaissent souvent 20 à 40 g sous la cible théorique alors que les calories tombent juste. C'est normal — la cible compte 4 kcal par gramme de glucide, les valeurs réelles des aliments en donnent un peu moins. Fie-toi aux calories et aux protéines.</p>
      <p class="note">${esc(trad("Tes changements sont gardés dans un brouillon, sur ton compte : ton client ne les voit qu'après « Publier les changements ». Relis les ingrédients — les allergies en premier — avant de publier. La publication date la semaine (« Repas mis à jour le … » chez lui), range l'ancienne dans l'historique et remet à zéro sa liste de courses et ses repas cochés."))}</p>
      <p class="note">Le filtre travaille sur la composition des aliments. Il ne remplace pas ta lecture : une allergie sévère, un interdit religieux qui dépend de la certification, un aliment que le client ne supporte pas sans le savoir — c'est toi qui les attrapes.</p>
    </section>`;
  },

  html(){ return `<div id="nu-vue"><section class="panel">${squelette()}</section></div><div id="nu-hist"></div>`; },

  async init(){
    const self = this;
    const edition = Auth.estCoach() && Store.idConsulte;
    const R = this.migrer(await Store.lire(this.cle, this.vide()));
    const zone = $("nu-vue");
    if (!zone) return;
    /* v71 (F) : lecture ratee (R passe par migrer : drapeau Store.charge) : « Pas de connexion », pas « pas encore valide tes repas » */
    if (Store.charge[Store.cible() + "|" + self.cle] === false){ pageHorsLigne(zone); return; }
    let sauver = () => Store.ecrire(self.cle, R);

    /* ---------- cote client ---------- */
    if (!edition){
      const suivi = await Store.lire("repas_suivi", { date:"", mange:{}, courses:{}, joursCourses:{} });
      if (Store.nonLus.has(suivi)){ pageHorsLigne(zone); return; }   // v71 (F)
      if (suivi.date !== aujourdhui()){ suivi.date = aujourdhui(); suivi.mange = {}; }
      if (!suivi.joursCourses) suivi.joursCourses = {};
      self.alignerCourses(R, suivi);   // v71 (E) : panier vide si la diete a change (en memoire, rien d'ecrit ici)
      /* on ouvre sur le jour de la semaine reel : lundi = 0 */
      let actif = R.jours.length ? Math.min(R.jours.length - 1, (new Date().getDay() + 6) % 7) : 0;
      /* recettes deja refusees pendant cette visite : « Remplacer » propose
         a chaque clic un plat nouveau au lieu d'osciller entre deux */
      const refuses = [];
      /* v67 (D3) : « repas » est ecrit par le coach ET par le client (« Remplacer »). Les versions de la base que cette
         page connait : celle lue a l'ouverture, puis chacune qu'elle a ecrite. Une autre en base = le coach l'a changee
         depuis (nouvelle semaine, envoi, retouche) : on n'ecrit rien par-dessus. */
      const connues = new Set([self.signature(R)]);

      const dessiner = () => {
        zone.innerHTML = self.vueLecture(R, suivi, actif);
        $$("[data-jour]", zone).forEach(b => b.addEventListener("click", () => { actif = +b.dataset.jour; dessiner(); }));
        $$("[data-mange]", zone).forEach(c => c.addEventListener("click", () => {
          suivi.mange[c.dataset.mange] = !suivi.mange[c.dataset.mange];
          Regularite.noterRepas(R, suivi); Store.ecrire("repas_suivi", suivi); dessiner();
        }));
        $$("[data-course]", zone).forEach(c => c.addEventListener("change", () => {
          suivi.courses = suivi.courses || {};
          suivi.courses[c.dataset.course] = c.checked;
          Store.ecrire("repas_suivi", suivi); dessiner();
        }));
        $$("[data-jc]", zone).forEach(c => c.addEventListener("change", () => {
          suivi.joursCourses[c.dataset.jc] = c.checked;
          Store.ecrire("repas_suivi", suivi); dessiner();
        }));
        /* v71 (E) : « Vider la liste » decoche tous les articles (les jours choisis restent) apres confirmation ;
           si l'ecriture est refusee (lecture ratee), rien ne change a l'ecran */
        $$("[data-vider-courses]", zone).forEach(b => b.addEventListener("click", async () => {
          if (!(await UI.confirmer(trad("Vider la liste de courses ? Les articles cochés seront décochés."), { ok: trad("Oui, vider"), danger: true }))) return;
          const avant = suivi.courses; suivi.courses = {};
          if (Store.ecrire("repas_suivi", suivi)) dessiner(); else suivi.courses = avant;
        }));
        $$("[data-remplacer]", zone).forEach(b => b.addEventListener("click", async () => {
          const [d, i] = b.dataset.remplacer.split(":").map(Number);
          const jour = R.jours[d], x = jour && jour.repas[i];
          if (!x) return;
          b.disabled = true; b.textContent = "…";
          if (x.recette_id) refuses.push(x.recette_id);
          const vus = refuses.slice();
          R.jours.forEach(j => (j.repas || []).forEach(c => { if (c.recette_id) vus.push(c.recette_id); }));
          let nouveau = null;
          try {
            const l = await self.composer(R.cible || { kcal: (x.macros ? x.macros.kcal : 500) * 4, prot: 0 },
                                          R.regime, R.allergenes, vus, R.nb_repas);
            nouveau = l.find(n => n.moment === x.moment) || null;
          } catch(e){}
          if (!nouveau){
            refuses.length = 0;
            UI.toast(trad("Pas d'autre recette disponible pour ce repas pour le moment."), "attention");
            dessiner(); return;
          }
          /* v67 (D3) : la page a pu rester ouverte depuis la veille : on relit la base juste avant d'ecrire. Changee
             par le coach : rien n'est ecrit, la page repart de sa version (meme objet R : un envoi encore en attente
             part avec elle). Relecture impossible : rien n'est ecrit, on le dit. */
          const enBase = await self.relire();
          if (!enBase){
            UI.toast(trad("Pas de connexion : ton repas n'a pas été remplacé. Réessaie dans un instant."), "attention", 6000);
            dessiner(); return;
          }
          if (!connues.has(self.signature(enBase))){
            Object.keys(R).forEach(k => { delete R[k]; });
            Object.assign(R, enBase);
            connues.clear(); connues.add(self.signature(R));
            self.alignerCourses(R, suivi);   // v71 (E) : la diete vient de changer : panier vide (en memoire)
            refuses.length = 0;
            actif = R.jours.length ? Math.min(R.jours.length - 1, (new Date().getDay() + 6) % 7) : 0;
            UI.toast(trad("Tes repas ont changé entre-temps : voici la dernière version."), "attention", 6000);
            dessiner(); return;
          }
          nouveau.change_client = aujourdhui();
          jour.repas[i] = nouveau;
          if (suivi.mange) delete suivi.mange[b.dataset.remplacer];
          Regularite.noterRepas(R, suivi);
          if (Store.ecrire(self.cle, R)){ connues.add(self.signature(R)); Store.envoyerCle(self.cle); }
          Store.ecrire("repas_suivi", suivi);
          dessiner();
        }));
      };
      dessiner();
      Historique.monter("repas", "nu-hist");
      return;
    }

    /* ---------- cote coach ---------- */
    /* v97 (chantier 2 de la nuit du 10/11) : le coach travaille dans un BROUILLON (BrouillonRepas, sur son compte) : R = la
       diète publiée (ce que voit le client, jamais modifiée par la saisie), B = le brouillon. Le pré-remplissage (régime,
       allergènes, repas par jour, cible) se fait sur B et sur la référence (ref) : il ne compte pas comme un brouillon et
       n'écrit rien tant que le coach ne change rien. */
    const uid = Store.cible();
    const D0 = await BrouillonRepas.lire();
    if (!$("nu-vue") || Store.cible() !== uid) return;
    if (Store.nonLus.has(D0)){ pageHorsLigne(zone); return; }
    const etatB = { D: D0, publication: false };
    const B = BrouillonRepas.depuis(R);
    const ctx = { prerempli:false, autres:"" };
    let intake = {}, calc = null, actif = 0;
    try { intake = await Store.lire("intake", {}) || {}; } catch(e){}
    /* v91 : lecture ratée (Store.nonLus : l'objet rendu est le défaut) : jamais « pas d'allergie » par défaut */
    ctx.intakeIllisible = Store.nonLus.has(intake);
    try { calc   = await Store.lire("calc", null); } catch(e){}
    ctx.autres = (intake.allergies || "").trim();

    /* v97 (relecture) : le pré-remplissage (champs vides seulement) est une fonction : il s'applique au brouillon, à la
       référence ET à une « nouvelle semaine » (sinon les allergènes pris du questionnaire seraient perdus sans le dire) */
    const preremplir = X => {
      if (!X.regime && intake.regime_type){ X.regime = intake.regime_type; ctx.prerempli = true; }
      /* Le nombre de repas vient de SA reponse : le plan est bati sur sa
         journee, pas sur une journee moyenne. */
      if (!X.nb_repas){
        const n = self.nbDepuisReponse(intake.nb_repas);
        if (n){ X.nb_repas = n; ctx.prerempli = true; }
        else X.nb_repas = CONFIG.nutrition.repas_defaut;
      }
      if ((!X.allergenes || !X.allergenes.length) && intake.allergenes){
        const noms = String(intake.allergenes).split("|").filter(Boolean);
        X.allergenes = CONFIG.nutrition.allergenes.filter(a => noms.indexOf(a.nom) > -1).map(a => a.id);
        if (X.allergenes.length) ctx.prerempli = true;
      }
      /* Le client n'a plus acces au calculateur : si le coach ne l'a pas encore
         rempli, on calcule la cible directement depuis le questionnaire plutot
         que de laisser le champ vide. */
      let base = calc;
      if ((!base || !base.poids) && num(intake.poids)){
        base = { sexe: intake.sexe === "Femme" ? "F" : "H", age: num(intake.age) || 30,
                     taille: num(intake.taille) || 170, poids: num(intake.poids),
                     pas: num(intake.pas) || CONFIG.calcul.valeurs_depart.pas,
                     heures: (num(intake.seances) || 3) * 1.25,
                     objectif: /perte|s[èe]che/i.test(intake.objectif || "") ? "perte"
                                 : /prise|masse/i.test(intake.objectif || "") ? "prise" : "maintien" };
        ctx.depuisQuestionnaire = true;
      }
      if (!X.cible && base && base.poids){
        const calc = base;
        const bmr  = outilCalculateur.metabolismeDeBase(calc);
        const tdee = bmr * outilCalculateur.facteurActivite(calc).total;
        const c = CONFIG.calcul;
        /* v79 : une cible pré-remplie est calculée : jamais sous le plancher (1 200 / 1 500 kcal) ; celle que le coach tape reste la sienne */
        const kcal = Math.max(calc.objectif === "perte" ? tdee * (1 - c.deficit_perte)
                         : calc.objectif === "prise" ? tdee * (1 + c.surplus_prise) : tdee, outilCalculateur.plancher(calc.sexe));
        const m = outilCalculateur.macros(kcal, calc.poids);
        X.cible = { kcal: Math.round(kcal), prot: Math.round(m.prot), lip: Math.round(m.lip), gluc: Math.round(m.gluc) };
        ctx.prerempli = true;
      }
    };
    preremplir(B);

    /* la référence : la diète publiée, pré-remplie de la même façon (« Publié » tant que rien d'autre ne change) */
    let ref = JSON.parse(JSON.stringify(B));
    const remplacerB = x => { Object.keys(B).forEach(k => { delete B[k]; }); Object.assign(B, JSON.parse(JSON.stringify(x))); };
    const entree0 = BrouillonRepas.entree(etatB.D, uid);
    if (entree0 && BrouillonRepas.differe(entree0.programme, ref)) remplacerB(outilNutrition.migrer(Object.assign(outilNutrition.vide(), entree0.programme)));
    ctx.calcCible = self.cibleDepuis(calc);
    const majRef = () => { const e = BrouillonRepas.entree(etatB.D, uid); ctx.ref = e && e.nouveau_bloc ? R : null; };
    majRef();
    sauver = () => {
      if (Store.cible() !== uid){ Store.ficheChangee(); return false; }
      const extra = BrouillonRepas.entree(etatB.D, uid) ? null : { depart: BrouillonRepas.depart(R) };
      const r = BrouillonRepas.ranger(etatB.D, uid, B, ref, Store.majLu[uid + "|" + self.cle] || null, extra);
      majEtatB();
      return r;
    };
    const majEtatB = () => {
      const z = $("nu-etat"); if (!z) return;
      z.outerHTML = BrouillonRepas.etatHTML(B, ref, R, BrouillonRepas.entree(etatB.D, uid));
      brancherEtat();
    };
    const propositions = {};   // « Changer ce repas » : les 3 propositions affichées, par repas (« jour:repas »)
    let garderProps = false;
    const redessiner = () => {
      if (!garderProps) Object.keys(propositions).forEach(k => { delete propositions[k]; });   // relecture : jamais des propositions périmées
      garderProps = false;
      majRef();
      zone.innerHTML = BrouillonRepas.etatHTML(B, ref, R, BrouillonRepas.entree(etatB.D, uid)) + self.vueEdition(B, ctx, actif);
      brancher();
    };

    const brancherEtat = () => {
      const x = $("nu-publier"); if (x) x.addEventListener("click", publier);   // nu-publier-bas : une fois par dessin (brancher)
      const ann = $("nu-annuler-brouillon");
      if (ann) ann.addEventListener("click", async () => {
        if (!(await UI.confirmer(trad("Annuler le brouillon ? Tes changements non publiés seront perdus. Ton client garde la version publiée."), { ok: trad("Annuler le brouillon"), annuler: trad("Garder le brouillon"), danger: true }))) return;
        if (Store.cible() !== uid){ Store.ficheChangee(); return; }
        if (BrouillonRepas.retirer(etatB.D, uid) === false) return;
        remplacerB(ref); actif = Math.min(actif, Math.max(0, B.jours.length - 1));
        redessiner();
        flash("nu-pub-msg", trad("Brouillon annulé : tu vois la version publiée."));
      });
      const nb = $("nu-nouveau-bloc");
      if (nb) nb.addEventListener("click", async () => {
        if (!Historique.utile("repas", R)){ flash("nu-pub-msg", trad("Publie d'abord une première diète : la nouvelle semaine part de la version publiée.")); return; }
        if (BrouillonRepas.differe(B, ref) && !(await UI.confirmer(trad("Ton brouillon sera remplacé par une copie de la diète publiée, pour préparer la suivante. Continuer ?"), { ok: trad("Préparer la nouvelle semaine") }))) return;
        if (Store.cible() !== uid){ Store.ficheChangee(); return; }
        remplacerB(BrouillonRepas.nouveauBloc(R)); preremplir(B);   // relecture : régime, allergènes, repas, cible du questionnaire gardés
        if (BrouillonRepas.ranger(etatB.D, uid, B, ref, Store.majLu[uid + "|" + self.cle] || null, { nouveau_bloc: { le: aujourdhui() }, depart: BrouillonRepas.depart(R) }) === false) return;
        redessiner();
        flash("nu-pub-msg", trad("Nouvelle semaine prête dans ton brouillon : varie les repas marqués « ≈ identique », puis publie."));
      });
    };

    const publier = async () => {
      if (etatB.publication) return;
      const nbRepas = B.jours.reduce((n, j) => n + (j.repas || []).length, 0);
      if (!nbRepas){ flash("nu-pub-msg", trad("Il n'y a encore aucun repas à publier.")); return; }
      if (!BrouillonRepas.differe(B, ref) && R.maj && !(BrouillonRepas.entree(etatB.D, uid) || {}).nouveau_bloc){ flash("nu-pub-msg", trad("Rien à publier : ton client voit déjà cette version.")); return; }
      etatB.publication = true;
      const boutons = ["nu-publier", "nu-publier-bas"].map(id => $(id)).filter(Boolean);
      boutons.forEach(x => { x.disabled = true; x.dataset.libelle = x.textContent; x.textContent = trad("Publication…"); });
      flashFixe("nu-pub-msg", "");
      try {
        const r = await BrouillonRepas.publier(uid, R, B, etatB.D);
        if (!zone.isConnected || Store.cible() !== uid) return;
        if (r.ok){
          Object.keys(R).forEach(k => { delete R[k]; }); Object.assign(R, outilNutrition.migrer(JSON.parse(JSON.stringify(r.repas))));
          etatB.D = r.D;
          ref = JSON.parse(JSON.stringify(R)); remplacerB(R);
          redessiner();
          flash("nu-pub-msg", trad("Publié. Ton client voit la nouvelle version dès sa prochaine ouverture."));
          return;
        }
        if (r.annule) return;
        const t = (($("etat") || {}).textContent || "").trim();
        flashFixe("nu-pub-msg", r.refus ? trad("Pas publié : la base a refusé cette modification. Ton brouillon est gardé.")
                                        : trad("Pas publié : vérifie ta connexion et réessaie. Ton brouillon est gardé.") + (t ? " (" + t + ")" : ""));
      } finally {
        etatB.publication = false;
        boutons.forEach(x => { if (x.isConnected){ x.disabled = false; x.textContent = x.dataset.libelle; } });
      }
    };

    const lireReglages = () => {
      const k = $("nu-kcal"), rg = $("nu-regime"), no = $("nu-note");
      if (k && k.value){
        const kcal = num(k.value);
        const poids = (calc && calc.poids) || num(intake.poids) || 0;
        const m = poids ? outilCalculateur.macros(kcal, poids) : { prot:0, lip:0, gluc:0 };
        B.cible = { kcal: Math.round(kcal), prot: Math.round(m.prot), lip: Math.round(m.lip), gluc: Math.round(m.gluc) };
      }
      if (rg) B.regime = rg.value;
      if (no) B.note = no.value;
      B.allergenes = $$("#nu-allerg input:checked").map(c => c.value);
      const nr = $("nu-repas"); if (nr) B.nb_repas = +nr.value || CONFIG.nutrition.repas_defaut;
    };

    let minuteur = null;
    const chercher = async (q) => {
      const box = $("nu-res"); if (!box) return;
      if (q.length < 2){ box.innerHTML = ""; return; }
      const t = Normaliser.aplatir(q);
      const [alims, recs] = await Promise.all([Catalogue.aliments(), Catalogue.recettes()]);
      const score = (nom) => Normaliser.aplatir(nom).indexOf(t);
      const ra = alims.filter(a => score(a.nom) > -1).sort((a,b) => score(a.nom) - score(b.nom) || a.nom.length - b.nom.length).slice(0, 12);
      const rr = recs.filter(r => score(r.nom) > -1).sort((a,b) => score(a.nom) - score(b.nom)).slice(0, 6);
      if (!ra.length && !rr.length){ box.innerHTML = `<div class="empty">Rien ne correspond à « ${esc(q)} ».</div>`; return; }
      const ligne = (o, type) => {
        const ok = self.compatible(o, B.regime, B.allergenes);
        const pourquoi = ok ? "" : ((o.allergenes || []).filter(x => (B.allergenes || []).indexOf(x) > -1)
              .map(x => (CONFIG.nutrition.allergenes.find(z => z.id === x) || {}).nom).join(", ") || "hors régime");
        return `<div class="res-l${ok ? "" : " exclu"}">
          <span class="nom">${esc(o.nom)}</span>
          <span class="meta">${type === "aliment" ? `${fmt(o.kcal)} kcal / 100 g` : `recette · ${esc((CONFIG.nutrition.repas.find(s => s.id === o.moment) || {}).nom || "")}`}${ok ? "" : ` · <b>${esc(pourquoi)}</b>`}</span>
          <span class="actions-b"><button data-add="${type}:${esc(o.id)}">Ajouter</button></span>
        </div>`;
      };
      box.innerHTML = (rr.length ? `<h3>Recettes</h3>` + rr.map(r => ligne(r, "recette")).join("") : "") +
                      (ra.length ? `<h3>Aliments</h3>` + ra.map(a => ligne(a, "aliment")).join("") : "");
      $$("[data-add]", box).forEach(b => b.addEventListener("click", async () => {
        const [type, ...reste] = b.dataset.add.split(":");
        const id = reste.join(":");
        const slot = CONFIG.nutrition.repas.find(s => s.id === $("nu-slot").value);
        const jour = B.jours[actif]; if (!jour) return;
        if (type === "recette"){
          const r = (await Catalogue.recettes()).find(x => x.id === id);
          if (r) jour.repas.push(await self.figer(r, 1, slot));
        } else {
          const idx = await Catalogue.indexAliments(); const a = idx[id];
          if (a){
            const gr = Math.max(1, Math.round(num($("nu-gr").value) || a.portion_g || 100));
            const carte = { moment: slot.id, moment_nom: slot.nom, recette_id: null, nom: a.nom,
                            temps_min: null, etapes: [],
                            ingredients: [{ aliment_id: a.id, nom: a.nom, categorie: a.categorie, grammes: gr }] };
            await self.recalculer(carte);
            jour.repas.push(carte);
          }
        }
        /* on trie sur la place du creneau dans la structure du client :
           avec deux collations, l'index global ne veut plus rien dire */
        const rang = c => (c.ordre != null ? c.ordre
                          : CONFIG.nutrition.repas.findIndex(s => s.id === c.moment));
        jour.repas.sort((x, y) => rang(x) - rang(y));
        sauver(); redessiner();
      }));
    };

    const brancher = () => {
      ["nu-kcal","nu-regime","nu-note"].forEach(id => {
        const el = $(id); if (el) el.addEventListener("change", () => { lireReglages(); sauver(); viderProps(); });
      });
      $$("#nu-allerg input").forEach(c => c.addEventListener("change", () => { lireReglages(); sauver(); viderProps(); }));
      $$("#nu-repas").forEach(c => c.addEventListener("change", () => { lireReglages(); sauver(); viderProps(); }));
      $$("[data-jed]", zone).forEach(b => b.addEventListener("click", () => { actif = +b.dataset.jed; redessiner(); }));

      const q = $("nu-q");
      if (q) q.addEventListener("input", () => { clearTimeout(minuteur); minuteur = setTimeout(() => chercher(q.value.trim()), 200); });

      /* Les complements du client : s'il prend une poudre proteinee, son
         shaker prend la place d'une collation au lieu de s'y ajouter. */
      const lireShaker = async () => {
        try {
          const C = outilComplements.migrer(await Store.lire("complements", outilComplements.vide()));
          return outilComplements.shaker(C);
        } catch(e){ return null; }
      };

      /* v91 : questionnaire illisible : aucune composition automatique (boutons désactivés, et garde ici) */
      const illisible = id => { if (!ctx.intakeIllisible) return false; flash(id, "Questionnaire illisible : vérifie ses allergies avant de générer. Touche « Réessayer »."); return true; };
      if (ctx.intakeIllisible) $$("[data-autre]", zone).forEach(b => { b.disabled = true; });

      const g = $("nu-gen");
      if (g) g.addEventListener("click", async () => {
        if (illisible("nu-msg")) return;
        lireReglages();
        if (!B.cible || !B.cible.kcal){ flash("nu-msg","Indique d'abord les calories visées."); return; }
        const nb = +($("nu-nb") ? $("nu-nb").value : 7) || 7;
        g.disabled = true;
        const sh = await lireShaker();
        const jours = await self.composerSemaine(B.cible, B.regime, B.allergenes, nb,
                        (i, n) => { g.textContent = `Composition… jour ${i} sur ${n}`; }, B.nb_repas, sh);
        g.disabled = false; g.textContent = "Générer la semaine";
        if (!jours.length || !jours[0].repas.length){ flash("nu-msg","Aucune recette ne correspond à ces critères. Importe le catalogue ou assouplis les filtres."); return; }
        B.debut = ""; B.maj = "";   // v97 : semaine 1 à la publication ; l'ancienne entre dans l'historique à la publication
        B.jours = jours; actif = 0;
        if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
        redessiner();
      });

      const gj = $("nu-gen-jour");
      if (gj) gj.addEventListener("click", async () => {
        if (illisible("nu-msg")) return;
        lireReglages();
        if (!B.cible || !B.cible.kcal){ flash("nu-msg","Indique d'abord les calories visées."); return; }
        gj.disabled = true; gj.textContent = "Composition…";
        /* on evite les recettes des autres jours pour garder la variete */
        const vus = [];
        B.jours.forEach((j, i) => { if (i !== actif) (j.repas || []).forEach(c => { if (c.recette_id) vus.push(c.recette_id); }); });
        const liste = await self.composer(B.cible, B.regime, B.allergenes, vus, B.nb_repas, await lireShaker());
        gj.disabled = false;
        if (!liste.length){ flash("nu-msg","Aucune recette compatible."); return; }
        B.jours[actif] = { nom: B.jours[actif].nom, repas: liste, manquants: liste.manquants || [],
                           complement: liste.complement || null, diagnostic: liste.diagnostic || [] };
        if (sauver() === false) return;
        redessiner();
      });

      const cible = (cle) => { const [d, i] = cle.split(":").map(Number); return { jour: B.jours[d], i: i }; };

      /* v97 (4b) : « Changer ce repas » propose 3 recettes du même moment, filtrées par le régime et les allergènes de la
         diète (BrouillonRepas / outilNutrition.propositions) ; bloqué si le questionnaire est illisible (v91) */
      /* relecture : un réglage changé (régime, allergènes, calories) retire les propositions affichées : elles ne valaient que
         pour les réglages d'avant */
      const viderProps = () => { Object.keys(propositions).forEach(k => { delete propositions[k]; }); $$("[data-props]", zone).forEach(z => { z.innerHTML = ""; }); };
      const montrerProps = (cle) => {
        const z = zone.querySelector('[data-props="' + cle + '"]'); if (!z) return;
        const l = propositions[cle] || [];
        z.innerHTML = l.length ? `<div class="props-repas"><p class="note" style="margin:0 0 8px">${esc(trad("Choisis un remplaçant (même moment, compatible avec son régime et ses allergies) :"))}</p>` +
          l.map((c, k) => `<div class="res-l"><span class="nom">${esc(c.nom)}</span><span class="meta">${fmt((c.macros || {}).kcal || 0)} kcal · ${fmt((c.macros || {}).proteines || 0)} g prot.</span><span class="actions-b"><button type="button" data-choisir="${cle}:${k}">${esc(trad("Choisir"))}</button></span></div>`).join("") +
          `<div class="actions" style="margin-top:6px"><button type="button" class="btn ghost petit" data-props-fermer="${cle}">${esc(trad("Garder ce repas"))}</button></div></div>` : "";
        $$("[data-choisir]", z).forEach(c => c.addEventListener("click", async () => {
          const p = c.dataset.choisir.split(":").map(Number), cleR = p[0] + ":" + p[1], jour = B.jours[p[0]], l = propositions[cleR], nouveau = l && l[p[2]];
          if (!jour || !nouveau || !jour.repas[p[1]]) return;
          if (illisible("nu-msg")) return;
          /* relecture : le repas visé est toujours celui des propositions, et la recette passe encore le filtre régime + allergènes */
          const vise = jour.repas[p[1]];
          const fiche = (await Catalogue.recettes()).find(r => r.id === nouveau.recette_id);
          if (!zone.isConnected || propositions[cleR] !== l) return;
          if (String(vise.recette_id || "") !== String(l.pour.recette_id || "") || vise.moment !== l.pour.moment || !fiche || !self.compatible(fiche, B.regime, B.allergenes)){
            delete propositions[cleR]; montrerProps(cleR); flash("nu-msg", trad("Propositions périmées : touche à nouveau « Changer ce repas »."));
            return;
          }
          jour.repas[p[1]] = nouveau; delete propositions[cleR];
          if (sauver() === false) return;
          redessiner();
        }));
        $$("[data-props-fermer]", z).forEach(c => c.addEventListener("click", () => { delete propositions[c.dataset.propsFermer]; montrerProps(c.dataset.propsFermer); }));
      };
      $$("[data-autre]", zone).forEach(b => b.addEventListener("click", async () => {
        if (illisible("nu-msg")) return;
        const { jour, i } = cible(b.dataset.autre); const x = jour && jour.repas[i]; if (!x) return;
        b.disabled = true;
        let l = [];
        try { l = await self.propositions(x, B, 3); } catch(e){ l = []; }
        if (!b.isConnected) return;
        b.disabled = false;
        if (!l.length){ flash("nu-msg", trad("Pas d'autre recette compatible pour ce repas.")); return; }
        l.pour = { recette_id: x.recette_id, moment: x.moment };   // le repas visé (revérifié à « Choisir »)
        propositions[b.dataset.autre] = l;
        montrerProps(b.dataset.autre);
      }));
      Object.keys(propositions).forEach(montrerProps);

      /* v97 (4b) : ↑ ↓ dans la journée, « Dupliquer sur » un autre jour (ou tous) */
      const echangerR = (cle, d) => { const { jour, i } = cible(cle), j = i + d; if (!jour || j < 0 || j >= jour.repas.length) return; const x = jour.repas[i]; jour.repas[i] = jour.repas[j]; jour.repas[j] = x; if (sauver() === false) return; redessiner(); };
      $$("[data-monter-r]", zone).forEach(b => b.addEventListener("click", () => echangerR(b.dataset.monterR, -1)));
      $$("[data-descendre-r]", zone).forEach(b => b.addEventListener("click", () => echangerR(b.dataset.descendreR, 1)));
      $$("[data-dup-sur]", zone).forEach(s => s.addEventListener("change", () => {
        const { jour, i } = cible(s.dataset.dupSur), x = jour && jour.repas[i]; if (!x || s.value === "") return;
        const cibles = s.value === "tous" ? B.jours.map((j, k) => k).filter(k => B.jours[k] !== jour) : [+s.value];
        const rang = c => (c.ordre != null ? c.ordre : CONFIG.nutrition.repas.findIndex(sl => sl.id === c.moment));
        cibles.forEach(k => { const j = B.jours[k]; if (!j) return; if (!j.repas) j.repas = []; const copie = JSON.parse(JSON.stringify(x)); delete copie.change_client; j.repas.push(copie); j.repas.sort((a, b) => rang(a) - rang(b)); });
        if (sauver() === false) return;
        redessiner();
        flash("nu-msg", trad("Repas copié sur {n} jour(s).", { n: cibles.length }));
      }));
      /* v97 (4d) : « Reprendre » la cible de « Ses calories » : seulement sur ce clic */
      const rk = $("nu-reprendre-kcal");
      if (rk) rk.addEventListener("click", () => { if (!ctx.calcCible) return; B.cible = Object.assign({}, ctx.calcCible); if (sauver() === false) return; redessiner(); });
      brancherEtat();
      const bas = $("nu-publier-bas"); if (bas) bas.addEventListener("click", publier);
      /* v101 : « Supprimé : … · Annuler » pendant 10 s (le repas revient à sa place) */
      $$("[data-retirer]", zone).forEach(b => b.addEventListener("click", () => {
        const { jour, i } = cible(b.dataset.retirer); const x = jour.repas.splice(i, 1)[0]; sauver(); redessiner();
        UI.annulable(trad("Supprimé : {n}", { n: (x && x.nom) || trad("un repas") }), () => {
          if (B.jours.indexOf(jour) < 0) return;
          jour.repas.splice(Math.min(i, jour.repas.length), 0, x); sauver(); redessiner();
        }, zone);
      }));
      $$("[data-suppr-i]", zone).forEach(b => b.addEventListener("click", async () => {
        const p = b.dataset.supprI.split(":").map(Number);
        const jour = B.jours[p[0]], carte = jour.repas[p[1]];
        const avantCarte = JSON.parse(JSON.stringify(carte));   // v101 : pour « Annuler » (la ligne et les macros d'avant)
        const g = carte.ingredients.splice(p[2], 1)[0];
        const vide = !carte.ingredients.length;
        if (vide) jour.repas.splice(p[1], 1);
        else await self.recalculer(carte);
        if (sauver() === false) return;
        redessiner();
        UI.annulable(trad("Supprimé : {n}", { n: (g && g.nom) || trad("une ligne") }), () => {
          if (B.jours.indexOf(jour) < 0) return;
          if (vide){ if (jour.repas.indexOf(carte) < 0) jour.repas.splice(Math.min(p[1], jour.repas.length), 0, Object.assign(carte, avantCarte)); }
          else { const k = jour.repas.indexOf(carte); if (k < 0) return; Object.keys(carte).forEach(c => { delete carte[c]; }); Object.assign(carte, avantCarte); }
          sauver(); redessiner();
        }, zone);
      }));
      $$("[data-gr]", zone).forEach(el => el.addEventListener("change", async () => {
        const p = el.dataset.gr.split(":").map(Number);
        const jour = B.jours[p[0]];
        jour.repas[p[1]].ingredients[p[2]].grammes = Math.max(0, Math.round(num(el.value)));
        await self.recalculer(jour.repas[p[1]]);
        if (sauver() === false) return;
        redessiner();
      }));
      $$("[data-ajout-i]", zone).forEach(b => b.addEventListener("click", () => {
        const { jour, i } = cible(b.dataset.ajoutI);
        $("nu-slot").value = jour.repas[i].moment;
        $("nu-q").focus();
        $("nu-q").scrollIntoView({ behavior: defilementDoux(), block:"center" });
      }));

      const bs = $("nu-biblio-save");
      if (bs) bs.addEventListener("click", async () => {
        if (!B.jours.length){ flash("nu-msg","Compose d'abord une semaine."); return; }
        const nom = await UI.demander("Sous quel nom l'enregistrer dans ta bibliothèque ?", B.nom || "Semaine type", { titre: "Ma bibliothèque", ok: "Enregistrer" });
        if (!nom) return;
        try {
          await Auth.appel("/rest/v1/bibliotheque", {
            method:"POST", headers:{ "Prefer":"return=minimal" },
            body:[{ coach_id: Auth.utilisateur().id, nom, note: B.note || "",
                    contenu: { type:"repas", jours: B.jours, cible: B.cible, regime: B.regime, allergenes: B.allergenes } }]
          });
          flash("nu-msg","Enregistré dans ta bibliothèque.");
          chargerBiblio();
        } catch(e){ flashFixe("nu-msg", trad("Pas enregistré dans ta bibliothèque : vérifie ta connexion et réessaie.")); }
      });

      chargerBiblio();
    };

    const chargerBiblio = async () => {
      const sel = $("nu-biblio"); if (!sel) return;
      try {
        const l = await Auth.appel("/rest/v1/bibliotheque?select=id,nom,contenu&order=cree_le.desc");
        const repas = (l || []).filter(x => x.contenu && x.contenu.type === "repas");
        sel.innerHTML = `<option value="">— charger depuis ma bibliothèque —</option>` +
          repas.map(x => `<option value="${x.id}">${esc(x.nom)}</option>`).join("");
        sel.onchange = async () => {
          if (!sel.value) return;
          const x = repas.find(y => String(y.id) === sel.value);
          if (!x) return;
          if (!(await UI.confirmer(trad("Charger « {n} » ? Il remplacera les repas de ton brouillon (ton client garde la version publiée).", { n: x.nom }), { ok: trad("Charger") }))){ sel.value = ""; return; }
          B.debut = ""; B.maj = "";
          /* les entrees d'avant la semaine ne contiennent qu'une journee */
          B.jours = x.contenu.jours ? JSON.parse(JSON.stringify(x.contenu.jours))
                                    : [{ nom: self.JOURS[0], repas: JSON.parse(JSON.stringify(x.contenu.repas || [])) }];
          if (x.contenu.cible) B.cible = x.contenu.cible;
          actif = 0; if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
          redessiner();
        };
      } catch(e){}
    };

    redessiner();
    Historique.monter("repas", "nu-hist", async (C) => {
      ["nom", "note", "cible", "regime", "allergenes", "nb_repas"].forEach(k => { if (C[k] !== undefined) B[k] = C[k]; });
      B.jours = JSON.parse(JSON.stringify(C.jours || []));
      B.debut = ""; B.maj = ""; actif = 0;
      if (sauver() === false) return false;   /* fiche changee pendant l'operation : rien n'est ecrit */
      redessiner();
      UI.alerte(trad("Diète remise dans ton brouillon. Relis-la, puis clique sur « Publier les changements »."));
      return true;
    });
  }
};

