/* ------------------------------------------------------------------
   OUTIL COACH — Mes clients (invisible pour les clients)
   ------------------------------------------------------------------ */
const outilClients = {
  id: "clients",
  cle: null,
  nom: "Mes clients",
  principal_coach: true,
  court: "Clients",   // v83 (bloc 3) : la barre du bas du coach, Tableau · Clients · Prospects · Plus
  sans_entete: true,  // v83 (bloc 3) : la liste du haut porte le titre « Clients » et le nombre (maquette Liste)
  icone: "👥",
  role: "coach",          // n'apparait que pour le coach
  titre: "Mes clients",
  accroche: "Tous tes clients et leurs données, en direct. Le tableau te dit d'un coup d'œil qui avance, qui décroche, et à qui il manque quelque chose.",

  jours(iso){
    if (!iso) return null;
    /* jamais negatif : une horloge un peu en avance donnait « il y a -1 j » */
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  },

  /* Evolution du poids d'un client a partir de ses mensurations */
  evolution(mens){
    if (!mens || !mens.mesures || !mens.mesures.length) return null;
    const m = mens.mesures.filter(x => x.poids).slice().sort((a,b) => (a.date||"") < (b.date||"") ? -1 : 1);
    if (!m.length) return null;
    const dernier = m[m.length - 1];
    const depart = mens.pstart || m[0].poids;
    /* on cherche la mesure la plus proche de 28 jours avant la derniere */
    const cible = new Date(dernier.date || aujourdhui()).getTime() - 28 * 86400000;
    let ref = m[0], ecartMin = Infinity;
    m.forEach(x => {
      const e = Math.abs(new Date(x.date || aujourdhui()).getTime() - cible);
      if (e < ecartMin){ ecartMin = e; ref = x; }
    });
    /* On ne parle de "quatre semaines" que si la mesure de reference tombe
       vraiment dans cette fenetre : sinon on affiche rien plutot qu'un
       chiffre calcule sur une periode differente de celle annoncee. */
    const ecartJours = Math.round(Math.abs(new Date(dernier.date || aujourdhui()).getTime() - new Date(ref.date || aujourdhui()).getTime()) / 86400000);
    const fenetreValide = ref !== dernier && ecartJours >= 14 && ecartJours <= 45;
    return {
      depart: depart, actuel: dernier.poids, date: dernier.date,
      total: dernier.poids - depart,
      mois: fenetreValide ? dernier.poids - ref.poids : null,
      jours_fenetre: fenetreValide ? ecartJours : null,
      n: m.length
    };
  },

  /* Le calculateur et le questionnaire peuvent diverger : le client remplit
     son formulaire, le coach ouvre le calculateur, et personne ne remarque
     que les deux ne parlent pas de la meme personne. Un cas reel : 80 kg /
     178 cm / 25 ans dans le calculateur contre 62 / 158 / 37 dans le
     questionnaire — environ 950 kcal d'ecart par jour, invisible a l'ecran. */
  SEUILS: { poids: 2, taille: 2, age: 2 },

  ecarts(intake, calc){
    if (!intake || !calc) return [];
    const out = [];
    [["poids","kg"],["taille","cm"],["age","ans"]].forEach(([cle, unite]) => {
      const a = parseFloat(intake[cle]), b = parseFloat(calc[cle]);
      if (!isFinite(a) || !isFinite(b)) return;
      if (Math.abs(a - b) >= this.SEUILS[cle]) out.push({ cle, unite, forms: a, calc: b });
    });
    /* le sexe n'a pas de seuil : c'est juste ou c'est faux */
    const sf = intake.sexe === "Homme" ? "H" : intake.sexe === "Femme" ? "F" : null;
    if (sf && calc.sexe && sf !== calc.sexe)
      out.push({ cle:"sexe", unite:"", forms: intake.sexe, calc: calc.sexe === "H" ? "Homme" : "Femme" });
    return out;
  },

  /* Combien de calories par jour separent les deux versions. C'est le chiffre
     qui dit si l'ecart est un detail ou une erreur de plan alimentaire. */
  ecartKcal(intake, calc){
    try {
      const depuisForm = Object.assign({}, calc, {
        poids:  parseFloat(intake.poids)  || calc.poids,
        taille: parseFloat(intake.taille) || calc.taille,
        age:    parseFloat(intake.age)    || calc.age,
        sexe:   intake.sexe === "Homme" ? "H" : intake.sexe === "Femme" ? "F" : calc.sexe
      });
      const t = d => outilCalculateur.metabolismeDeBase(d) * outilCalculateur.facteurActivite(d).total;
      return Math.round(t(calc) - t(depuisForm));
    } catch(e){ return null; }
  },

  /* resumees (v83) : les clients déjà résumés (Clients.resumer) ; les archivés n'y sont plus (ni dans les alertes) */
  tableau(profils, parClient, contenus, connexions, resumees){
    const tb = $("tb-clients"), zoneA = $("alertes-clients");
    if (!tb) return;
    /* v71 (D) : le tableau ne liste que les clients ; un compte sans colonne statut reste un client (comme partout) ;
       les prospects sont sur la page Prospects ; la section Comptes garde tout le monde (c'est la qu'on passe un prospect client).
       v83 (bloc 3, décision 7 de Lucas) : plus de lien « Les prospects sont dans Prospects → » en haut : on passe de Clients à
       Prospects par la barre du bas seulement (le nombre de prospects est sur le Tableau de bord et la page Prospects) */
    const tous = (profils || []).filter(p => p && p.role !== "coach");
    const clients = tous.filter(p => p.statut !== "prospect");
    /* v37 — le resume de chaque client et son tri par urgence vivent dans
       Clients.resumer : le tableau de bord et la fiche s'en servent aussi (ici, les clients seulement : un prospect
       n'est plus classe par le score d'urgence devant les clients sains) */
    const lignes = (resumees || Clients.resumer(clients, parClient, contenus, connexions)).filter(l => !l.archive);
    if (!lignes.length){
      tb.innerHTML = '<tr><td colspan="18">Aucun client pour le moment.</td></tr>';
      if (zoneA) zoneA.innerHTML = "";
      return;
    }

    const pastille = (ok, txtOk, txtNon) =>
      `<span class="pastille${ok ? "" : " manque"}">${ok ? txtOk : txtNon}</span>`;
    const variation = (v, sens) => {
      if (v === null || v === undefined) return '<span class="meta">—</span>';
      const t = (v > 0 ? "+" : "") + n1(v) + "\u00a0kg";   // v58 : insécable, « kg » ne part jamais seul à la ligne
      const bon = sens === 0 ? null : (sens < 0 ? v < -0.2 : v > 0.2);
      return `<b style="color:${bon === null ? "var(--ink)" : bon ? "var(--good)" : (Math.abs(v) < 0.3 ? "var(--ink-3)" : "var(--warn)")}">${t}</b>`;
    };

    const feu = l => { const n = l.alertes.some(a => a.niveau === "mauvais") ? "mauvais" : l.alertes.some(a => a.niveau === "attention") ? "attention" : "ok"; return `<span class="point ${n}" title="${esc(l.alertes.map(a => a.texte).join(" · ") || "Rien à signaler")}"></span>`; };
    /* v53 (chantier 4) : le retour de la semaine selon la règle de CE client (feedback du dimanche, ou bilan du vendredi),
       sa dernière note et son dernier smiley (feedback du dimanche), sa dernière visite et ses jours actifs sur 30 jours
       (« — » pour un compte dont les visites ne sont pas suivies) ; 😞 non traité et note en chute en tête (Clients.resumer) */
    const retour = l => { const r = l.retour; if (!r || !r.etat) return '<span class="meta">—</span>';
      const cls = r.etat === "a_traiter" ? "mauvais" : r.etat === "fait" ? "ok" : r.etat === "non_fait" ? "attention" : "";
      return `<span class="pastille${cls ? " " + cls : ""}" title="${esc(r.nom)}">${esc(r.texte)}</span>`; };
    /* v58 : une valeur en plusieurs morceaux (7 + /10, 72,5 kg + départ…) tient dans UN élément : sur téléphone, la ligne de la
       carte (flex, space-between) écartait chaque morceau aux deux bouts (« 7        /10 ») */
    const bloc = h => `<span class="tb-val">${h}</span>`;
    const note = l => l.note == null ? '<span class="meta">—</span>' : bloc(`<b${l.alertes.some(a => a.type === "note_chute") ? ' class="neg"' : ""}>${l.note}</b><span class="meta">/10</span>`);
    const smiley = l => l.smiley ? `<span class="fbd-smiley-l" title="${esc(l.smiley.lbl)}${l.alertes.some(a => a.type === "avis_triste") ? " — à traiter" : ""}">${l.smiley.emo}</span>` : '<span class="meta">—</span>';
    const visite = l => { const t = Activite.texteVisite(l.visites); return t === "—" ? '<span class="meta" title="Visites non suivies pour ce compte">—</span>' : `<span class="meta">${esc(t)}</span>`; };
    /* v56 : nombre de connexions et dernière connexion (date et heure) ; l'info-bulle dit depuis quand elles sont comptées.
       v57 : juste après la dernière visite, date courte (29/09 10:53) ; la colonne du nom reste à l'écran (css, .tb-clients-table) */
    const cxCase = (l, t) => `<span class="meta" title="${esc(Connexions.aide(l.connexions))}">${esc(t)}</span>`;
    tb.innerHTML = lignes.map(l => `<tr>
      <td data-l="Client">${feu(l)} <b>${esc(l.nom)}</b>${l.p.statut === "prospect" ? ` <span class="pastille accent" title="Compte gratuit : pas encore accompagné">prospect</span> ` + Decouverte.pastilleCoach(l) + " " + Commercial.pastilleLigne(l) : ""}${l.ecarts.length ? ` <span class="pastille manque" title="Le calculateur ne correspond pas au questionnaire">chiffres à vérifier</span>` : ""}</td>
      <td data-l="Retour de la semaine">${retour(l)}</td>
      <td data-l="Dernière note">${note(l)}</td>
      <td data-l="Dernier smiley">${smiley(l)}</td>
      <td data-l="Dernière visite">${visite(l)}</td>
      <td data-l="Connexions">${cxCase(l, Connexions.texteNombre(l.connexions))}</td>
      <td data-l="Dernière connexion">${cxCase(l, Connexions.texteDerniere(l.connexions, true))}</td>
      <td data-l="Jours actifs (30 j)">${Activite.texteJours(l.visites) === "—" ? '<span class="meta">—</span>' : `<span class="meta">${esc(Activite.texteJours(l.visites))}</span>`}</td>
      <td data-l="Activité">${l.jours === null ? '<span class="pastille manque">jamais</span>'
            : l.jours >= 10 ? `<span class="pastille manque">${l.jours} j</span>`
            : `<span class="meta">${l.jours === 0 ? "aujourd'hui" : "il y a " + l.jours + " j"}</span>`}</td>
      <td data-l="Régularité">${l.reg == null ? '<span class="meta">—</span>'
            : bloc(`<b class="${Regularite.niveau(l.reg)}">${l.reg}</b><span class="meta">/100</span>${l.regEnCours != null ? ` <span class="meta">(en cours&nbsp;:&nbsp;${l.regEnCours})</span>` : ""}`)}</td>
      <td data-l="Poids">${l.ev ? bloc(`${n1(l.ev.actuel)}&nbsp;kg <span class="meta">(départ&nbsp;${n1(l.ev.depart)})</span>`) : '<span class="meta">aucune mesure</span>'}</td>
      <td data-l="Depuis le début">${l.ev ? variation(l.ev.total, l.sens) : '<span class="meta">—</span>'}</td>
      <td data-l="4 dernières sem.">${l.ev && l.ev.mois !== null ? bloc(variation(l.ev.mois, l.sens) + (l.ev.jours_fenetre !== 28 ? ` <span class="meta">sur ${l.ev.jours_fenetre}&nbsp;j</span>` : "")) : '<span class="meta">pas assez de recul</span>'}</td>
      <td data-l="Questionnaire">${pastille(l.intake, "rempli", "à remplir")}</td>
      <td data-l="Programme">${pastille(l.programme, "envoyé", "à faire")}</td>
      <td data-l="Diète">${pastille(l.diete, "envoyée", "à faire")}</td>
      <td data-l="Téléphone" class="td-tel">${Telephone.coachHTML(l.tel, "voir")}</td>
      <td data-l="" class="td-actions"><button class="voir" type="button" data-bilan="${esc(l.p.id)}" data-nom="${esc(l.nom)}">Préparer le call</button> <button class="voir" type="button" data-ouvrir="${esc(l.p.id)}" data-nom="${esc(l.nom)}">Ouvrir</button></td>
    </tr>`).join("");

    /* v71 (I) : tout passe par Clients.ouvrir (adresse canonique #/client/<uuid>/<outil>, ecran d'origine memorise) */
    $$("[data-ouvrir]", tb).forEach(b => b.addEventListener("click", () => Clients.ouvrir(b.dataset.ouvrir, b.dataset.nom, "accueil")));   // v37 : la fiche s'ouvre sur la vue d'ensemble
    $$("[data-bilan]", tb).forEach(b => b.addEventListener("click", () => Clients.ouvrir(b.dataset.bilan, b.dataset.nom, "bilan")));

    if (zoneA){
      /* v39 : un prospect (compte gratuit) n'a pas de suivi a assurer */
      const suivis = lignes.filter(l => !(l.p && l.p.statut === "prospect"));
      /* v43 : un compte qui n'a jamais rien saisi est classe a part : il n'est
         pas « sans nouvelles depuis 10 jours », il n'a jamais commence */
      const jamais = suivis.filter(l => l.jours === null);
      const muets = suivis.filter(l => l.jours !== null && l.jours >= 10);
      const aFaire = suivis.filter(l => !l.programme || !l.diete || !l.intake);
      const incoherents = suivis.filter(l => l.ecarts.length);
      let h = "";
      if (incoherents.length){
        h += `<div class="flag grave"><b>Le calculateur ne correspond pas au questionnaire :</b><ul style="margin:8px 0 0;padding-left:20px">` +
          incoherents.map(l => `<li><b>${esc(l.nom)}</b> — ` +
            l.ecarts.map(e => `${e.cle} : ${esc(String(e.forms))}${e.unite ? " " + e.unite : ""} au questionnaire, ` +
                              `${esc(String(e.calc))}${e.unite ? " " + e.unite : ""} au calculateur`).join(" · ") +
            (l.ecartKcal ? ` <b>(${l.ecartKcal > 0 ? "+" : ""}${fmt(l.ecartKcal)} kcal/jour)</b>` : "") +
            `</li>`).join("") +
          `</ul><p class="note" style="margin:10px 0 0">Sa diète est calculée sur les chiffres du calculateur. Ouvre sa fiche et corrige avant d'envoyer un plan.</p></div>`;
      }
      const irreguliers = suivis.filter(l => l.reg != null && l.reg < 40);
      if (irreguliers.length) h += `<div class="flag" style="margin-bottom:8px"><b>Régularité faible la semaine dernière :</b> ${irreguliers.map(l => esc(l.nom) + " (" + l.reg + "/100)").join(", ")}. Un message d'encouragement maintenant peut éviter un départ.</div>`;
      if (muets.length) h += `<div class="flag"><b>Sans nouvelles depuis 10 jours ou plus :</b> ${muets.map(l => esc(l.nom)).join(", ")}. C'est le moment de reprendre contact.</div>`;
      if (jamais.length) h += `<div class="flag" style="margin-top:8px"><b>Jamais rien saisi :</b> ${jamais.map(l => esc(l.nom)).join(", ")}. ${jamais.length > 1 ? "Ces comptes n'ont encore rien enregistré : vérifie que leurs accès sont bien arrivés." : "Ce compte n'a encore rien enregistré : vérifie que ses accès sont bien arrivés."}</div>`;
      if (aFaire.length) h += `<div class="flag" style="margin-top:8px"><b>Il manque quelque chose pour :</b> ${aFaire.map(l => esc(l.nom) + " (" + [!l.intake ? "questionnaire" : null, !l.programme ? "programme" : null, !l.diete ? "diète" : null].filter(Boolean).join(", ") + ")").join(" · ")}.</div>`;
      if (!h) h = `<p class="note" style="margin:0">Tous tes clients ont leur questionnaire, leur programme et leur diète, et se sont manifestés dans les dix derniers jours.</p>`;
      zoneA.innerHTML = h;
    }
  },

  /* v83 (bloc 3) : en haut, la liste des clients de la maquette (titre, nombre, recherche, filtres, « + », « Sélectionner »,
     ListeCoach) ; dessous, sans rien retirer, le tableau complet et ses alertes, puis les comptes. « Créer un accès » est un
     écran à part (#/clients/nouveau, Acces), ouvert par « + ». */
  html(){
    if (sousRoute === "nouveau") return Acces.html("clients");
    return `
    <div id="lc-zone">${ListeCoach.attente("clients")}</div>

    <section class="panel">
      <h2>Suivi de mes clients</h2>
      <div id="alertes-clients"></div>
      <div class="scroll" style="margin-top:14px"><table class="tb-clients-table"><thead><tr>
        <th>Client</th><th>Retour</th><th>Note</th><th>Smiley</th><th>Visite</th><th>Connexions</th><th>Dernière connexion</th><th>Jours actifs</th><th>Activité</th><th>Régularité</th><th>Poids</th><th>Depuis le début</th><th>4 dernières sem.</th>
        <th>Questionnaire</th><th>Programme</th><th>Diète</th><th>Téléphone</th><th></th>
      </tr></thead><tbody id="tb-clients"><tr><td colspan="18">Chargement…</td></tr></tbody></table></div>
      <p class="note" style="margin-top:12px">En haut : les 😞 non traités et les notes en chute, puis les retours de la semaine à lire. « Retour » : le feedback du dimanche ou le bilan du vendredi, selon ce que voit le client (à traiter / fait / non fait). « Note » et « Smiley » : son dernier feedback du dimanche. « Visite » et « Jours actifs » (sur 30 jours) : les jours où il a ouvert l'app — « — » quand ses visites ne sont pas suivies. « Connexions » : le nombre de jours où il a ouvert l'app connecté (une fois par jour au plus, depuis la mise en place du compteur) ; « Dernière connexion » : la date et l'heure de sa dernière ouverture — « — » si le compteur n'a pas pu être lu. « Activité » compte les jours depuis la dernière saisie du client, quelle qu'elle soit (une visite, un smiley ou une réponse lue ne comptent pas). Une variation de poids se lit sur quatre semaines : en dessous, c'est du bruit.</p>
    </section>

    <section class="panel">
      <h2>Comptes</h2>
      <p class="note" style="margin:0 0 16px">« Supprimer définitivement » efface un compte et toutes ses données — c'est ce qu'il faut faire quand un client le demande : il est dans l'onglet « Compte » de sa fiche (ici, seulement pour un compte de ton équipe, qui n'a pas de fiche). « Accès complet » donne à une personne de ton équipe exactement ta vue : toutes les fiches, tous les questionnaires de santé, tous les programmes. Donne-le à un compte créé pour elle, jamais en partageant ton mot de passe — sinon tu ne sauras plus qui a modifié quoi, et tu ne pourras pas le lui retirer. Un compte archivé n'est pas listé ici : il est dans « Archivés », en haut.</p>
      <div id="liste-clients"><div class="empty">Chargement…</div></div>
    </section>`;
  },

  /* les lignes de la liste du haut (ListeCoach) : nom, raison (l'alerte la plus urgente, sinon la dernière saisie), poids
     depuis le début à droite ; filtres « À traiter » (Clients.urgent) et « Inactifs » (10 jours ou plus sans saisie : l'alerte
     « Inactif depuis N j », même définition que la zone d'alertes) */
  lignesListe(lignes){
    return (lignes || []).map(l => {
      /* la raison : celle de « À traiter » du Tableau de bord (😞, note en chute, retour à lire, autre urgence), sinon la
         première alerte, sinon la dernière saisie ; le point : vert pour un retour à lire, ambre pour un 😞 ou une note en
         chute, rouge pour une autre urgence (comme le Tableau de bord), sinon ambre (une alerte) ou vert (rien) */
      const urg = l.alertes.filter(x => x.niveau === "mauvais" || x.type === "bilan_recu");
      const rg = x => x.type === "avis_triste" ? 0 : x.type === "note_chute" ? 1 : x.type === "bilan_recu" ? 2 : 8;
      const a = urg.length ? urg.slice().sort((x, y) => rg(x) - rg(y))[0] : l.alertes[0];
      const niveau = !a ? "ok" : a.type === "bilan_recu" ? "ok" : a.type === "avis_triste" || a.type === "note_chute" ? "attention" : a.niveau === "mauvais" ? "mauvais" : "attention";
      const saisie = l.jours === null ? trad("Jamais rien saisi") : l.jours === 0 ? trad("Dernière saisie aujourd'hui") : trad("Dernière saisie il y a {n} j", { n: l.jours });
      const v = l.ev ? l.ev.total : null;
      return { uid: l.p.id, nom: l.nom, raison: a ? a.texte : saisie, niveau, archive: !!l.archive,
        droite: v == null ? "" : `<b class="lc-kg">${(v > 0 ? "+" : v < 0 ? "−" : "") + n1(Math.abs(v))}&nbsp;kg</b>`,
        a_traiter: Clients.urgent(l), inactifs: l.jours !== null && l.jours >= 10 };
    });
  },

  async init(){
    if (sousRoute === "nouveau") return Acces.init("clients");
    const self = this;

    const charger = async () => {
      const box = $("liste-clients");
      try {
        const { profils, parClient, contenus, connexions } = await Clients.charger();
        if (!box || !box.isConnected) return;
        /* v83 : les clients résumés une fois (liste du haut, avec les archivés ; tableau complet, sans eux) */
        const lignes = Clients.resumer((profils || []).filter(p => p && p.role !== "coach" && p.statut !== "prospect"), parClient, contenus, connexions);
        ListeCoach.monter($("lc-zone"), "clients", self.lignesListe(lignes), { recharger: charger });
        self.tableau(profils, parClient, contenus, connexions, lignes);
        /* Tous les comptes, coachs compris : c'est ici qu'on donne l'acces
           complet a quelqu'un de l'equipe, et qu'on le retire. v83 : sans les comptes archivés. */
        const moi = Auth.utilisateur() && Auth.utilisateur().id;
        const comptes = (profils || []).filter(p => p && (p.role === "coach" || !Archive.le(contenus[p.id] && contenus[p.id].suivi_prospect)));
        if (!comptes.length){ box.innerHTML = '<div class="empty">Aucun compte pour le moment. Crée le premier accès avec « + », en haut.</div>'; return; }
        box.innerHTML = "";
        comptes.forEach(p => {
          const d = parClient[p.id];
          const quand = d ? new Date(d).toLocaleDateString("fr-FR") : "jamais";
          const estCoach = p.role === "coach", cestMoi = p.id === moi;
          const el = document.createElement("div");
          el.className = "client-l";
          /* le client a choisi l'anglais : le coach le voit, et ecrit ses notes en anglais */
          const enAnglais = !estCoach && contenus[p.id] && contenus[p.id].prefs && contenus[p.id].prefs.langue === "en";
          /* v83 : « Supprimer » d'un client ou d'un prospect est dans l'onglet Compte de sa fiche (décision de Lucas) ; il reste
             ici pour un compte d'équipe (accès complet), qui n'a pas de fiche */
          el.innerHTML = `<span class="nom">${esc(Clients.nom(p))}${enAnglais ? ` <span class="pastille" title="Ce client utilise l'app en anglais : écris-lui tes notes en anglais">🇺🇸 anglais</span>` : ""}</span>
                          ${estCoach ? `<span class="pastille role-coach">accès complet</span>` : `<span class="pastille">${d ? "actif" : "pas encore utilisé"}</span>`}
                          ${!estCoach && "statut" in p ? `<span class="pastille${p.statut === "prospect" ? " accent" : " ok"}">${p.statut === "prospect" ? "prospect" : "client"}</span>` : ""}
                          <span class="meta">${estCoach ? (cestMoi ? "c'est toi" : "voit tout, comme toi") : "dernière saisie : " + quand}</span>
                          ${estCoach ? "" : `<button class="voir" type="button">Ouvrir sa fiche</button>`}
                          ${cestMoi ? "" : `<button class="voir role" type="button" data-role="${estCoach ? "client" : "coach"}">${estCoach ? "Retirer l'accès complet" : "Donner l'accès complet"}</button>`}
                          ${!estCoach && "statut" in p ? `<button class="voir statut" type="button" data-statut="${p.statut === "prospect" ? "client" : "prospect"}">${p.statut === "prospect" ? "Passer client" : "Repasser prospect"}</button>` : ""}
                          ${cestMoi || !estCoach ? "" : `<button class="voir suppr" type="button">Supprimer</button>`}`;
          const bv = el.querySelector(".voir:not(.role):not(.statut):not(.suppr)");
          if (bv) bv.addEventListener("click", () => Clients.ouvrir(p.id, Clients.nom(p), "profil"));   // v43 : « Sans nom », comme dans la liste ; v71 (I) : Clients.ouvrir
          const bsup = el.querySelector(".suppr");
          if (bsup) bsup.addEventListener("click", async () => { if (await Acces.supprimer(p, bsup) === "fait") await charger(); });

          /* v39 — prospect <-> client : seul un coach peut le changer (garanti par la base) */
          const bst = el.querySelector(".statut");
          if (bst) bst.addEventListener("click", async () => { if (await Acces.changerStatut(p, bst.dataset.statut, bst)) await charger(); });

          const br = el.querySelector(".role");
          if (br) br.addEventListener("click", async () => { if (await Acces.changerRole(p, br.dataset.role, br)) await charger(); });
          box.appendChild(el);
        });
      } catch(e){
        if (box) box.innerHTML = '<div class="empty">Impossible de charger la liste.</div>';
        const tb = $("tb-clients"); if (tb) tb.innerHTML = '<tr><td colspan="18">Impossible de charger le suivi.</td></tr>';
        ListeCoach.erreur($("lc-zone"), "clients");
      }
    };

    charger();
  }
};

/* ------------------------------------------------------------------
   CLIENTS (v37) — ce que le coach sait de chaque client, en un objet.
   Chargement partage (profils + donnees, sans les historiques), resume
   par client (poids, activite, regularite, ce qui manque) et ALERTES.
   Les alertes repondent a une seule question : « qui a besoin de moi
   aujourd'hui ? ». Pas d'usine a gaz : des regles simples, chacune avec
   l'ecran ou aller.
   ------------------------------------------------------------------ */
const Clients = {
  /* v47 : lecture par pages de 1 000 (Supabase coupe a 1 000 lignes sans prevenir : avec l'inscription
     ouverte, quelques centaines de prospects suffiraient a faire disparaitre des clients de la liste) */
  async pages(chemin, cle){
    const PAGE = 1000, tout = [], vus = new Set();
    let precedent = null;
    for (let debut = 0; ; debut += PAGE){
      let lot;
      try { lot = await Auth.appel(chemin, { headers: { "Range-Unit": "items", "Range": debut + "-" + (debut + PAGE - 1) } }); }
      catch(e){ if (e && e.statut === 416) break; throw e; }   // 416 = au-dela de la fin
      if (!Array.isArray(lot) || !lot.length) break;
      const k0 = cle(lot[0]);
      if (precedent !== null && k0 === precedent) break;   // le serveur ignore Range : on a deja tout
      lot.forEach(l => { const k = cle(l); if (!vus.has(k)){ vus.add(k); tout.push(l); } });   // une inscription entre deux pages ne cree pas de doublon
      precedent = k0;
      if (lot.length !== PAGE) break;
      if (debut > 200000) break;   // garde-fou
    }
    return tout;
  },
  /* v56 — le nombre de connexions et la derniere connexion de chaque compte (table connexions, lisible par le coach seul :
     regles de la base) : { uid: ligne }, ou null si la table n'a pas pu etre lue (base sans la migration, panne) : les
     colonnes disent alors « — » et tout le reste se charge comme avant */
  async lireConnexions(){
    try {
      const l = await this.pages("/rest/v1/connexions?select=user_id,nombre,derniere,premiere&order=user_id.asc", x => String(x && x.user_id));
      const m = {}; l.forEach(x => { if (x && typeof x.user_id === "string") m[x.user_id] = x; });
      return m;
    } catch(e){ return null; }
  },
  /* v56 : opts.connexions === false : sans le compteur (tableau de bord, qui ne l'affiche pas) */
  async charger(opts){
    /* v56 : en meme temps que le reste ; elle ne rejette jamais et ne retarde jamais la liste de plus de 8 s (« — » alors) */
    const cx = opts && opts.connexions === false ? Promise.resolve(null)
      : Promise.race([this.lireConnexions(), new Promise(r => setTimeout(() => r(null), 8000))]);
    /* les historiques (jusqu'a 24 plans par client) ne servent pas ici :
       on ne les telecharge pas */
    /* v38 : les notes privees ne servent pas ici non plus */
    /* profils et donnees en meme temps (deux lectures independantes : un aller-retour au lieu de deux) */
    /* v79 : le journal alimentaire (jusqu'a 1 Mo par compte) n'est pas telecharge ici : sa date seule, lue a part (une lecture
       legere en meme temps), compte comme une saisie ; lecture ratee : rien (la date des autres cles reste) */
    const [profils, donnees, journaux] = await Promise.all([
      this.pages("/rest/v1/profils?select=*&order=cree_le.desc,id.asc", l => String(l && l.id)),
      this.pages("/rest/v1/donnees?select=user_id,outil,contenu,maj_le&outil=not.in.(hist_programme,hist_repas,notes_coach,journal_alimentaire)&order=user_id.asc,outil.asc", l => String(l && l.user_id) + "|" + String(l && l.outil)),
      this.pages("/rest/v1/donnees?select=user_id,outil,maj_le&outil=eq.journal_alimentaire&order=user_id.asc", l => String(l && l.user_id)).catch(() => [])
    ]);
    const parClient = {}, contenus = {};
    /* « Activite » = ce que le CLIENT a saisi. Ce que le coach ecrit dans
       sa fiche (programme, diete, calories, feedbacks, notes) ne dit rien de lui. */
    const ecritParCoach = ["programme", "repas", "calc", "complements", "feedbacks", "notes_coach", "suivi_prospect"];
    /* v51 : ni le choix des emails de suivi, ni la date « vu » des Nouveautes ne sont une saisie ; les pages vues
       (activite) ne comptent que pour un prospect (un client inactif garde son alerte « Inactif depuis N j ») */
    /* v72 (A) : le numéro (contact) non plus ; v72 (E) : la visite du coach (coach_visite) non plus */
    const pasSaisie = ["emails", "coach_notifs", "contact", "coach_visite"], prospects = new Set((profils || []).filter(p => p && p.statut === "prospect").map(p => p.id));
    (donnees || []).forEach(d => {
      const saisie = ecritParCoach.indexOf(d.outil) === -1 && pasSaisie.indexOf(d.outil) === -1 && (d.outil !== "activite" || prospects.has(d.user_id));
      const c = Forme.cle(d.outil, d.contenu);   // v42
      /* v59 (Q13-4) : checkins compte par ses vraies saisies (ses entrées), pas par la date de sa ligne */
      const quand = saisie ? this.dateSaisie(d.outil, d.maj_le, c) : null;
      if (quand && (!parClient[d.user_id] || quand > parClient[d.user_id])) parClient[d.user_id] = quand;
      (contenus[d.user_id] = contenus[d.user_id] || {})[d.outil] = c;
    });
    (journaux || []).forEach(d => {
      if (!d || d.outil !== "journal_alimentaire" || typeof d.user_id !== "string" || typeof d.maj_le !== "string") return;
      const quand = this.dateSaisie(d.outil, d.maj_le, null);
      if (quand && (!parClient[d.user_id] || quand > parClient[d.user_id])) parClient[d.user_id] = quand;
    });
    return { profils: profils || [], parClient, contenus, connexions: await cx };
  },
  /* v59 (Q13-4) — l'instant de la dernière VRAIE saisie que représente une ligne de donnees (maj_le : sa date), ou null.
     Hors checkins : maj_le. checkins : l'envoi le plus récent d'un bilan ou d'un feedback — envoye_a (l'instant) ;
     sinon envoye_le (un jour sans heure, celui de l'appareil qui l'a envoyé : compté du début de ce jour, heure locale ;
     le jour même de la ligne, l'heure de la ligne) ; jamais après la ligne. Un smiley (avis) ou « réponse vue »
     (fb_vu) réécrivent la ligne sans être une saisie : ils ne comptent pas. Une date illisible (données piégées) ne
     compte pas : jamais « NaN j ». Même règle dans Mes clients, la fiche, le tableau de bord et Comptes. */
  dateSaisie(outil, maj, contenu){
    if (outil !== "checkins") return maj || null;
    const tMaj = typeof maj === "string" ? Date.parse(maj) : NaN, jourMaj = isNaN(tMaj) ? "" : Regularite.iso(new Date(tMaj));
    let t = NaN;
    Checkin.liste(contenu).forEach(x => {
      let u = typeof x.envoye_a === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x.envoye_a) ? Date.parse(x.envoye_a) : NaN;
      if (isNaN(u) && typeof x.envoye_le === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.envoye_le)) u = x.envoye_le === jourMaj ? tMaj : new Date(x.envoye_le + "T00:00:00").getTime();
      if (!isNaN(u) && (isNaN(t) || u > t)) t = u;
    });
    if (isNaN(t)) return null;
    return !isNaN(tMaj) && t >= tMaj ? maj : new Date(t).toISOString();
  },

  /* le resume d'un client (memes calculs qu'avant dans Mes clients) ; v56 : cx = { lue, ligne } (Clients.resumer) */
  resumerUn(p, c, dernierMaj, cx){
    const K = outilClients;
    const ev = K.evolution(c.mens);
    const j = K.jours(dernierMaj);
    const objectif = (c.intake && c.intake.objectif) || "";
    const sens = /perte|s[èe]che/i.test(objectif) ? -1 : /prise|masse/i.test(objectif) ? 1 : 0;
    const ec = K.ecarts(c.intake, c.calc);
    const l = {
      p: p, ev: ev, jours: j, ecarts: ec,
      ecartKcal: ec.length ? K.ecartKcal(c.intake, c.calc) : null,
      nom: Clients.nom(p),   // v43 : « Sans nom » plutot que son identifiant
      intake: !!(c.intake && c.intake.complet),
      programme: !!(c.programme && (c.programme.seances||[]).length),
      diete: !!(c.repas && ((c.repas.jours || []).some(j => (j.repas || []).length) || (c.repas.repas || []).length)),
      sens: sens,
      ch: (c.challenge && typeof c.challenge === "object") ? c.challenge : null,   // clics « Réserver mon bilan » et case « J'ai réservé » (prospects)
      /* questionnaire court du prospect (Decouverte) : seulement ce que le suivi commercial lit */
      /* v52 : repondues / nb_questions comptes sur le questionnaire de ce prospect (3 questions, ou 10 pour un ancien prospect) */
      dc: (c.intake && typeof c.intake === "object") ? { court_le: c.intake.court_le, motivation: c.intake.motivation, repondues: Decouverte.repondues(c.intake), nb_questions: Decouverte.liste(c.intake).length,
            court_debut: typeof c.intake.court_debut === "string" ? c.intake.court_debut : null, objectif: typeof c.intake.objectif === "string" ? c.intake.objectif.slice(0, 120) : "",
            email: typeof c.intake.email_compte === "string" && c.intake.email_compte ? c.intake.email_compte.slice(0, 254) : typeof c.intake.email === "string" ? c.intake.email.slice(0, 254) : "",
            /* v52 (lot G) : les réponses (page Prospects, CSV) ; "" si absente ou illisible. v53 : + obstacle (« Ce qui l'a
               bloqué »), ancien = ses réponses sont celles de l'ancien questionnaire (l'obstacle y répondait à une autre question) */
            probleme: typeof c.intake.probleme === "string" ? c.intake.probleme.trim().slice(0, 120) : "",
            obstacle: typeof c.intake.obstacle === "string" ? c.intake.obstacle.trim().slice(0, 1000) : "",
            projection: typeof c.intake.projection === "string" ? c.intake.projection.trim().slice(0, 1000) : "",
            ancien: Decouverte.ancien(c.intake),
            bilan: Decouverte.bilanPropose(c.intake) } : null,   // v62 (L) : son choix sur la page « Ton plan d'action » (« Plus tard » d'avant la v62)
      newsletter: Accords.newsletterCoach(c.emails),   // v52 (lot G) : { oui, depuis } d'après la clé emails (CSV)
      tel: Contact.telephone(c.contact),   // v72 (A) : son numéro (clé contact), "" si aucun ou illisible
      ref: Contact.ref(c.contact),   // v72 (F) : le code de son lien d'inscription (clé contact), "" si aucun ou illisible
      act: (c.activite && typeof c.activite === "object") ? c.activite : null,   // v51 : activite (chronologie de la fiche)
      /* v53 (chantier 4) : dernière visite et jours actifs sur 30 jours ; un compte non suivi (client hors interrupteur
         suivi_visites_clients) : rien (« — »), même s'il a une ancienne clé activite de quand il était prospect */
      visites: Activite.lecture(c.activite, Activite.suiviPour(p)),
      /* v56 : nombre de connexions et derniere connexion (table connexions), pour chaque client et prospect ; « — » si la
         table n'a pas pu etre lue */
      connexions: Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(p), !!(cx && cx.lue)),
      suivi: (c.suivi_prospect && typeof c.suivi_prospect === "object") ? c.suivi_prospect : null,   // v49 : suivi commercial
      archive: Archive.le(c.suivi_prospect),   // v83 (bloc 3) : archivé par le coach (instant), ou null
      activite: dernierMaj || null
    };
    /* regularite : la semaine passee (complete) sert au tri, celle en cours
       est donnee a titre indicatif. Rien tant qu'il n'a ni programme ni diete. */
    if (!l.programme && !l.diete){ l.reg = null; l.regEnCours = null; }
    else { l.reg = Regularite.calculer(c, -1).score; l.regEnCours = Regularite.calculer(c, 0).score; }
    l.alertes = this.alertes(l, c);
    /* v53 (chantier 4) : Mes clients — retour de la semaine, dernière note, dernier smiley (clients seulement) */
    if (!(p && p.statut === "prospect")){
      const ck = c.checkins || { liste: [] };
      l.retour = this.retour(l, c);
      const notes = Checkin.liste(ck).filter(x => x.format === "dimanche" && Checkin.note(x) != null && typeof x.semaine === "string").sort((a, b) => a.semaine < b.semaine ? -1 : 1);
      l.note = notes.length ? Checkin.note(notes[notes.length - 1]) : null;
      const av = Checkin.avisListe(ck).slice().sort((a, b) => String(a.le || "") < String(b.le || "") ? -1 : 1).pop();
      l.smiley = av ? (Checkin.SMILEYS.find(x => x.id === av.smiley) || null) : null;
    } else { l.retour = null; l.note = null; l.smiley = null; }
    return l;
  },
  /* v53 (chantier 4) — le retour de la semaine d'un client, selon SA règle (Checkin : feedback du dimanche pour les comptes
     de l'interrupteur, sinon bilan du vendredi) : « à traiter » / « à lire » (reçu dans les 7 derniers jours, sans réponse
     du coach : l'alerte bilan_recu), « fait » (la dernière entrée des deux dernières semaines a sa réponse), « non fait »
     / « non complété » (l'alerte bilan_manque), sinon rien. */
  retour(l, c){
    const ck = c.checkins || { liste: [] }, e = Checkin.etat(ck, l.p && l.p.id), dim = e.semaine.regle === "dimanche";
    const nom = dim ? "Feedback du dimanche" : "Bilan du vendredi";
    if (l.alertes.some(a => a.type === "bilan_recu")) return { regle: e.semaine.regle, nom, etat: "a_traiter", texte: dim ? "à traiter" : "à lire" };
    const der = Checkin.liste(ck).filter(x => x.envoye_le && typeof x.semaine === "string").sort((a, b) => a.semaine < b.semaine ? -1 : 1).pop();
    if (der && der.semaine >= Regularite.bornes(-1).debut && Feedback.repond(c.feedbacks, der)) return { regle: e.semaine.regle, nom, etat: "fait", texte: "fait" };
    if (l.alertes.some(a => a.type === "bilan_manque")) return { regle: e.semaine.regle, nom, etat: "non_fait", texte: dim ? "non fait" : "non complété" };
    return { regle: e.semaine.regle, nom, etat: null, texte: "" };
  },
  /* v53 (chantier 4) — une urgence pour le tableau de bord (badge de la tuile Clients, « À traiter maintenant ») : une
     alerte de niveau « mauvais » (dont 😞 non traité, note en chute, inactivité), ou un retour de la semaine reçu à lire */
  urgent(l){ return !!(l && l.p && l.p.statut !== "prospect" && (l.alertes || []).some(a => a.niveau === "mauvais" || a.type === "bilan_recu")); },

  /* v56 : connexions = celles de Clients.charger ({ uid: ligne }, ou null si la table n'a pas pu etre lue ; absent : « — ») */
  resumer(profils, parClient, contenus, connexions){
    const cx = p => ({ lue: !!connexions && typeof connexions === "object", ligne: connexions && typeof connexions === "object" ? connexions[p.id] : null });
    /* v42 : les donnees illisibles d'UN client ne font jamais tomber le
       tableau de bord pour tous : sa ligne reste, avec une alerte. */
    const lignes = (profils || []).filter(p => p && p.id && p.role !== "coach").map(p => {
      try { return this.resumerUn(p, contenus[p.id] || {}, parClient[p.id], cx(p)); }
      catch(e){
        console.warn("[MHX] résumé impossible pour un client", e);
        const l = this.resumerUn(p, {}, parClient[p.id], cx(p));
        l.illisible = true;
        l.alertes = [{ type: "illisible", niveau: "attention", cible: "accueil", texte: "Données illisibles — à vérifier" }];
        return l;
      }
    });
    /* Ceux qui demandent une action passent devant. */
    const seuils = (CONFIG.regularite && CONFIG.regularite.seuils) || { bon: 70, moyen: 40 };
    const urgence = (l) => (l.ecarts.length ? 200 : 0) +
                           (l.jours === null ? 100 : l.jours >= 10 ? 90 : 0) +
                           (!l.intake ? 50 : 0) + (!l.programme ? 20 : 0) + (!l.diete ? 10 : 0) +
                           (l.reg == null ? 0 : l.reg < seuils.moyen ? 60 : l.reg < seuils.bon ? 25 : 0) +
                           l.alertes.reduce((n, a) => n + (a.niveau === "mauvais" ? 30 : a.niveau === "attention" ? 12 : 3), 0);
    /* v53 (chantier 4) : d'abord les 😞 non traités et les notes en chute, puis les retours de la semaine à lire, puis le
       reste (dans chaque groupe, le tri d'avant) */
    const groupe = l => l.alertes.some(a => a.type === "avis_triste" || a.type === "note_chute") ? 0 : l.alertes.some(a => a.type === "bilan_recu") ? 1 : 2;
    lignes.sort((a,b) => groupe(a) - groupe(b) || urgence(b) - urgence(a) || (b.jours||0) - (a.jours||0));
    return lignes;
  },

  /* ---------- ALERTES (phase 19) ----------
     niveau : mauvais (agir aujourd'hui) · attention (cette semaine) · info (bon a savoir)
     cible  : l'onglet de la fiche a ouvrir */
  alertes(l, c){
    const out = [];
    /* v39 : un prospect (compte gratuit) n'a pas de suivi a assurer */
    if (l.p && l.p.statut === "prospect") return out;
    const seuils = (CONFIG.regularite && CONFIG.regularite.seuils) || { bon: 70, moyen: 40 };
    const auj = aujourdhui();
    if (l.ecarts.length) out.push({ type: "chiffres", niveau: "mauvais", cible: "calculateur",
      texte: "Calculateur ≠ questionnaire" + (l.ecartKcal ? ` (${l.ecartKcal > 0 ? "+" : ""}${fmt(l.ecartKcal)} kcal/j)` : "") });
    if (l.jours === null) out.push({ type: "inactif", niveau: "attention", cible: "profil", texte: "Jamais rien saisi" });
    else if (l.jours >= 10) out.push({ type: "inactif", niveau: "mauvais", cible: "accueil", texte: `Inactif depuis ${l.jours} j` });
    if (!l.intake) out.push({ type: "manque", niveau: "attention", cible: "profil", texte: "Questionnaire à remplir" });
    if (!l.programme) out.push({ type: "manque", niveau: "attention", cible: "programme", texte: "Programme à envoyer" });
    if (!l.diete) out.push({ type: "manque", niveau: "attention", cible: "nutrition", texte: "Diète à envoyer" });
    if (l.reg != null && l.reg < seuils.moyen) out.push({ type: "regularite", niveau: "mauvais", cible: "suivi", texte: `Régularité faible : ${l.reg}/100` });
    /* bilan hebdomadaire : recu (a lire) ou manquant.
       v53 (chantier 3) : la regle de CE client — bilan du vendredi (comme avant), ou feedback du dimanche : « reçu —
       à lire » meme sans programme, « non fait » des le lundi (semaine passee sans feedback, fenetre fermee ou en retard) */
    const ck = c.checkins || { liste: [] }, e = Checkin.etat(ck, l.p && l.p.id), dim = e.semaine.regle === "dimanche";
    if (l.programme || l.diete || dim){
      const il7 = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return Regularite.iso(d); })();
      /* recu : un bilan envoye dans les sept derniers jours, quelle que soit sa
         semaine, et auquel le coach n'a pas encore repondu (v38 : un feedback
         ecrit sous CE bilan ; un mot ecrit avant son arrivee ne compte pas) */
      const recent = Checkin.liste(ck).filter(x => x.envoye_le && x.envoye_le >= il7 && !Feedback.repond(c.feedbacks, x));
      if (recent.length) out.push({ type: "bilan_recu", niveau: "info", cible: "bilan", texte: recent.some(x => x.format === "dimanche") ? "Feedback du dimanche reçu — à lire" : "Bilan hebdo reçu — à lire" });
      else if (dim ? ((l.programme || l.diete) && !e.fait && e.semaine.etat !== "ouvert") : (!e.fait && e.semaine.fin < auj)) out.push({ type: "bilan_manque", niveau: "attention", cible: "suivi", texte: dim ? "Feedback du dimanche non fait" : "Bilan hebdo non complété" });
    }
    /* v53 — ce que le client a dit du feedback (calcule a l'affichage, rien n'est stocke) : un 😞 sur la reponse du
       coach, tant qu'il n'y a pas repondu depuis ; une note en chute (5 ou moins, ou 2 points de moins que la
       precedente). Niveau « mauvais », et en tete des alertes « mauvais » (plan V2 : les 😞 et les notes en chute en haut). */
    const prio = [];
    if (Checkin.avisTristes(ck, c.feedbacks).length) prio.push({ type: "avis_triste", niveau: "mauvais", cible: "bilan", texte: "😞 sur ta réponse — à traiter" });
    const chute = Checkin.noteEnChute(ck);
    if (chute) prio.push({ type: "note_chute", niveau: "mauvais", cible: "bilan", texte: chute.avant != null && chute.avant - chute.note >= 2 ? `Note en chute : ${chute.avant} → ${chute.note}/10` : `Note en chute : ${chute.note}/10` });
    /* objectif du mois non atteint (statut pose par le coach) */
    const o = c.programme && c.programme.objectifs;
    if (o && o.mois === auj.slice(0, 7)) (o.statuts || []).forEach((st, i) => { if (st === "non_atteint" && (o.liste || [])[i]) out.push({ type: "objectif", niveau: "attention", cible: "suivi", texte: `Objectif non atteint : ${(o.liste || [])[i]}` }); });
    /* stagnation : au moins trois mesures sur trois semaines, et le poids n'a pas bouge */
    if (l.sens && c.mens && (c.mens.mesures || []).length >= 3){
      const m = c.mens.mesures.filter(x => x.date && x.poids != null).slice().sort((a, b) => a.date < b.date ? -1 : 1);
      if (m.length >= 3){
        const der = m[m.length - 1], ref = m.find(x => (new Date(der.date) - new Date(x.date)) / 86400000 <= 28) || m[0];
        const jours = Math.round((new Date(der.date) - new Date(ref.date)) / 86400000);
        if (jours >= 21 && Math.abs(der.poids - ref.poids) < 0.3) out.push({ type: "stagnation", niveau: "info", cible: "mensurations", texte: `Poids stable depuis ${jours} j (${n1(der.poids)} kg)` });
      }
    }
    const rang = { mauvais: 0, attention: 1, info: 2 };
    return prio.concat(out).sort((a, b) => rang[a.niveau] - rang[b.niveau]);
  },

  /* ouvre la fiche d'un client sur un onglet */
  ouvrir(p, nom, cible){
    /* v71 (I) : l'ecran d'origine (pour « Revenir … » : tableau, clients, prospects ; une fiche ouverte depuis une autre fiche
       garde l'origine de la premiere) et l'adresse canonique #/client/<uuid>/<outil>, qui survit a un rechargement */
    if (["tableau", "clients", "prospects"].indexOf(courant) > -1){ Store.retourVers = courant; ListeCoach.memoriser(courant); }   // v83 : la position de la page, retrouvée au retour
    else if (Store.idConsulte !== p || !Store.retourVers) Store.retourVers = "clients";
    Store.oublier(Store.idConsulte);
    Store.idConsulte = p; Store.nomConsulte = nom;
    location.hash = "#/client/" + p + "/" + (cible || "accueil");
  },

  /* v43 — le nom affiche d'un compte, le meme partout (tableau de bord, Mes
     clients, Comptes, fiche, bandeau, fil d'Ariane). Sans prenom ni nom :
     « Sans nom », jamais l'identifiant du compte. */
  SANS_NOM: "Sans nom",
  nom(p){ return (((p && p.prenom) || "") + " " + ((p && p.nom) || "")).trim() || Clients.SANS_NOM; },
  initiales(nom){ if (!nom || nom === Clients.SANS_NOM) return "?"; return String(nom).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("") || "?"; },
  /* l'avatar (initiales) ; neutre — gris, « ? » — pour un compte sans nom */
  avatar(nom){ const neutre = !nom || nom === Clients.SANS_NOM; return `<span class="avatar${neutre ? " neutre" : ""}">${esc(Clients.initiales(nom))}</span>`; }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — ARCHIVAGE (décision 1 de Lucas : dans les listes, on archive au lieu de supprimer).
   Archiver = masquer la personne des listes, des compteurs, de « à traiter » et des Nouveautés du coach ; rien ne change pour
   elle (compte, connexion, données) ; on restaure à tout moment. Rangé SANS migration dans la clé coach-seul « suivi_prospect »
   (illisible et non modifiable par la personne : règles de la base ; déjà lue pour tous les comptes par Clients.charger et par
   la fiche), champ archive_le = l'instant de l'archivage (ISO), remis à null pour restaurer. Écriture par Commercial.modifier :
   écriture conditionnelle (CleCoach.ecrireSi) qui relit et garde tous les autres champs. Pas dans notes_coach (proposition de
   la mission) : NotesCoach réécrit tout l'objet à chaque note (l'archivage serait effacé sans bruit) et les listes ne la lisent
   pas. Aucun événement ajouté à l'historique du suivi (il est limité à 30 et sert à « Bilan réservé »). Jamais de DELETE.
   ------------------------------------------------------------------ */
const Archive = {
  /* l'instant de l'archivage (texte ISO lisible), ou null : une valeur piégée ne fait rien tomber et ne compte pas */
  le(S){
    const v = (S && typeof S === "object" && !Array.isArray(S)) ? S.archive_le : null;
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !isNaN(Date.parse(v)) ? v : null;
  },
  est(l){ return !!(l && l.archive); },
  /* archiver (oui) ou restaurer (non) ces comptes, un par un (une écriture conditionnelle chacun ; un compte dont une action
     commerciale est en cours est laissé de côté) ; rend { ok: [uid], ko: [{ uid, e }] } */
  async appliquer(uids, oui){
    const ok = [], ko = [];
    for (const uid of uids || []){
      if (Commercial.occupe[uid]){ ko.push({ uid, e: new Error("une action est en cours pour ce compte") }); continue; }
      Commercial.occupe[uid] = true;
      try {
        const le = oui ? new Date().toISOString() : null;
        const S = await Commercial.modifier(uid, c => { c.archive_le = le; return c; });
        if (!!this.le(S) !== !!oui) throw new Error("la base n'a pas confirmé le changement");
        ok.push(uid);
      } catch(e){ ko.push({ uid, e }); }
      finally { delete Commercial.occupe[uid]; }
    }
    return { ok, ko };
  }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — LA LISTE DU COACH (maquettes Liste, ListeProspects, ListeSelection, ListeConfirmation), la même pour
   Clients et Prospects : titre, nombre, recherche par nom (sans tenir compte des accents ni des majuscules), filtres en
   pastilles, « + » (Créer un accès), « Sélectionner » ; chaque ligne : initiales, nom, raison, info à droite. Sélection :
   des cases, « Tout sélectionner » (la liste filtrée), une barre en bas « N sélectionnés » + « Archiver » (« Restaurer » dans
   « Archivés »), une fenêtre de confirmation (objet UI) avant tout archivage, même d'un seul compte, puis un message.
   La recherche et le filtre sont gardés (le temps de la session), la position aussi au retour d'une fiche (Clients.ouvrir
   la note, la croix de la fiche demande de la rendre : ListeCoach.revenir).
   items : [{ uid, nom, raison, niveau (point : ok | attention | mauvais | ""), droite (HTML sûr), pastilles (HTML sûr),
   archive, a_traiter, inactifs }]
   ------------------------------------------------------------------ */
const ListeCoach = {
  etats: {},
  etat(t){ return this.etats[t] || (this.etats[t] = { q: "", filtre: "tous", y: 0, revenir: false, focus: false, sel: null, garder: false, items: [], opts: {} }); },
  /* sans accents ni majuscules (comme la recherche de la page Prospects) */
  norm(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); },
  TEXTES: {
    clients: { titre: "Clients", nb: ["{n} client", "{n} clients"], recherche: "Rechercher un client par son nom",
      vide: { tous: "Aucun client pour le moment.", a_traiter: "Rien à traiter pour l'instant.", inactifs: "Aucun client inactif.", archives: "Aucun compte archivé." },
      confirmer: ["Archiver {n} client ?", "Archiver {n} clients ?"], archives: ["{n} client archivé", "{n} clients archivés"], restaures: ["{n} client restauré", "{n} clients restaurés"] },
    prospects: { titre: "Prospects", nb: ["{n} prospect", "{n} prospects"], recherche: "Rechercher un prospect par son nom",
      vide: { tous: "Aucun prospect pour l'instant.", a_traiter: "Rien à traiter pour l'instant.", archives: "Aucun compte archivé." },
      confirmer: ["Archiver {n} prospect ?", "Archiver {n} prospects ?"], archives: ["{n} prospect archivé", "{n} prospects archivés"], restaures: ["{n} prospect restauré", "{n} prospects restaurés"] }
  },
  FILTRES: { clients: [["tous", "Tous"], ["a_traiter", "À traiter"], ["inactifs", "Inactifs"], ["archives", "Archivés"]],
             prospects: [["tous", "Tous"], ["a_traiter", "À traiter"], ["archives", "Archivés"]] },
  UN: "Ce compte disparaît de tes listes. Tu le retrouves dans « Archivés ». Rien ne change pour la personne.",
  PLUSIEURS: "Ces comptes disparaissent de tes listes. Tu les retrouves dans « Archivés ». Rien ne change pour eux.",
  /* singulier / pluriel (« 0 client », mais « 0 clients » en anglais) */
  plur(n, formes){ return trad(n > 1 || (n === 0 && I18N.langue === "en") ? formes[1] : formes[0], { n }); },
  /* la page Clients ou Prospects la note en ouvrant une fiche (Clients.ouvrir) ; la croix de la fiche demande de la rendre */
  memoriser(t){ if (this.TEXTES[t]) this.etat(t).y = window.scrollY || 0; },
  revenir(t){ if (this.TEXTES[t]) this.etat(t).revenir = true; },
  attente(t){ return `<section class="lc" data-liste="${t}"><div class="lc-tete"><div class="lc-titres"><h1>${esc(trad(this.TEXTES[t].titre))}</h1></div></div><div class="empty">${esc(trad("Chargement…"))}</div></section>`; },
  erreur(zone, t){ if (zone && zone.isConnected) zone.innerHTML = `<section class="lc" data-liste="${t}"><div class="lc-tete"><div class="lc-titres"><h1>${esc(trad(this.TEXTES[t].titre))}</h1></div></div><div class="empty">${esc(trad("Impossible de charger la liste."))}</div></section>`; },
  /* la liste filtrée (filtre, puis recherche) */
  visibles(t){
    const E = this.etat(t), q = this.norm(E.q);
    return E.items.filter(x => E.filtre === "archives" ? x.archive : !x.archive && (E.filtre === "tous" || !!x[E.filtre]))
      .filter(x => !q || this.norm(x.nom).indexOf(q) > -1);
  },
  monter(zone, t, items, opts){
    if (!zone || !zone.isConnected) return;
    const E = this.etat(t);
    E.items = Array.isArray(items) ? items : []; E.opts = opts || {};
    if (!E.garder) E.sel = null;   // une sélection ne survit pas à un départ de la page (sauf les comptes restés après une action ratée)
    E.garder = false;
    if (!this.FILTRES[t].some(f => f[0] === E.filtre)) E.filtre = "tous";
    this.dessiner(zone, t);
    if (E.revenir){ E.revenir = false; const y = E.y; setTimeout(() => { if (zone.isConnected) window.scrollTo(0, y); }, 0); }
    if (E.focus){ E.focus = false; setTimeout(() => { const q = zone.querySelector("#lc-q"); if (q && zone.isConnected) q.focus(); }, 0); }
  },
  dessiner(zone, t){
    const T = this.TEXTES[t], E = this.etat(t), sel = !!E.sel, n = E.items.filter(x => !x.archive).length;
    const restaurer = E.filtre === "archives";
    document.body.classList.toggle("lc-selection", sel);   // la barre de sélection remplace la barre du bas (maquette)
    zone.innerHTML = `<section class="lc${sel ? " lc-sel" : ""}" id="lc-${t}" data-liste="${t}">
      <div class="lc-tete">
        <div class="lc-titres"><h1>${esc(trad(T.titre))}</h1><p class="lc-compte" id="lc-compte">${esc(this.plur(n, T.nb))}</p></div>
        <div class="lc-actions">${sel
          ? `<button type="button" class="lc-lien" data-sel-tout>${esc(trad("Tout sélectionner"))}</button><button type="button" class="lc-lien" data-sel-annuler>${esc(trad("Annuler"))}</button>`
          : `<button type="button" class="lc-lien" data-sel-debut>${esc(trad("Sélectionner"))}</button><a class="rond" href="#/${t}/nouveau" data-lc-plus aria-label="${esc(trad("Créer un accès"))}" title="${esc(trad("Créer un accès"))}">${SVG.ajouter}</a>`}</div>
      </div>
      <label class="lc-recherche"><span class="lc-loupe" aria-hidden="true">${SVG.loupe}</span><input type="search" id="lc-q" placeholder="${esc(trad(T.recherche))}" aria-label="${esc(trad(T.recherche))}" value="${esc(E.q)}" autocomplete="off" maxlength="120"></label>
      <div class="lc-filtres" role="group" aria-label="${esc(trad("Filtrer la liste"))}">${this.FILTRES[t].map(([k, lib]) => `<button type="button" class="lc-filtre" data-lc-filtre="${k}" aria-pressed="${E.filtre === k}">${esc(trad(lib))}</button>`).join("")}</div>
      <ul class="lc-liste" id="lc-liste"></ul>
      ${sel ? `<div class="lc-barre" id="lc-barre" role="region" aria-label="${esc(trad("Sélection"))}"><b id="lc-nb-sel" aria-live="polite"></b><button type="button" class="btn${restaurer ? "" : " danger"}" data-sel-archiver>${esc(trad(restaurer ? "Restaurer" : "Archiver"))}</button></div>` : ""}
    </section>`;
    this.brancher(zone, t);
    this.majListe(zone, t);
  },
  ligneHTML(x, sel){
    const coche = !!sel && sel.has(x.uid);
    return `<li class="lc-ligne${coche ? " choisie" : ""}" data-uid="${esc(x.uid)}"><button type="button" class="lc-b" data-lc-ligne="${esc(x.uid)}" data-nom="${esc(x.nom)}"${sel ? ` role="checkbox" aria-checked="${coche}"` : ""}>
      ${sel ? `<span class="lc-case" aria-hidden="true">${coche ? SVG.coche : ""}</span>` : ""}${Clients.avatar(x.nom)}
      <span class="lc-txt"><span class="lc-nom">${x.niveau ? `<span class="point ${esc(x.niveau)}" aria-hidden="true"></span>` : ""}<b data-notr>${esc(x.nom)}</b>${x.pastilles || ""}</span><small>${esc(x.raison || "")}</small></span>
      ${x.droite ? `<span class="lc-droite">${x.droite}</span>` : ""}</button></li>`;
  },
  majListe(zone, t){
    const E = this.etat(t), boite = zone.querySelector("#lc-liste"); if (!boite) return;
    const v = this.visibles(t);
    if (E.sel){ const vus = new Set(v.map(x => x.uid)); E.sel.forEach(uid => { if (!vus.has(uid)) E.sel.delete(uid); }); }   // jamais un compte caché par le filtre ou la recherche
    boite.innerHTML = v.length ? v.map(x => this.ligneHTML(x, E.sel)).join("")
      : `<li class="lc-vide"><p class="empty">${esc(trad(E.q.trim() ? "Aucun résultat pour ce nom." : this.TEXTES[t].vide[E.filtre] || this.TEXTES[t].vide.tous))}</p></li>`;
    this.majBarre(zone, t);
  },
  majBarre(zone, t){
    const E = this.etat(t); if (!E.sel) return;
    const nb = zone.querySelector("#lc-nb-sel"), b = zone.querySelector("[data-sel-archiver]"), n = E.sel.size;
    if (nb) nb.textContent = trad(n > 1 || (n === 0 && I18N.langue === "en") ? "{n} sélectionnés" : "{n} sélectionné", { n });
    if (b) b.disabled = !n;
  },
  brancher(zone, t){
    const E = this.etat(t), q = zone.querySelector("#lc-q");
    let minuteur = null;
    if (q) q.addEventListener("input", () => { clearTimeout(minuteur); minuteur = setTimeout(() => { if (!zone.isConnected) return; E.q = q.value.slice(0, 120); this.majListe(zone, t); }, 120); });
    $$("[data-lc-filtre]", zone).forEach(b => b.addEventListener("click", () => { E.filtre = b.dataset.lcFiltre; this.dessiner(zone, t); const f = zone.querySelector(`[data-lc-filtre="${E.filtre}"]`); if (f) f.focus(); }));
    const debut = zone.querySelector("[data-sel-debut]");
    if (debut) debut.addEventListener("click", () => { E.sel = new Set(); this.dessiner(zone, t); const a = zone.querySelector("[data-sel-annuler]"); if (a) a.focus(); });
    const fin = zone.querySelector("[data-sel-annuler]");
    if (fin) fin.addEventListener("click", () => { E.sel = null; this.dessiner(zone, t); const d = zone.querySelector("[data-sel-debut]"); if (d) d.focus(); });
    const tout = zone.querySelector("[data-sel-tout]");
    if (tout) tout.addEventListener("click", () => { this.visibles(t).forEach(x => E.sel.add(x.uid)); this.majListe(zone, t); });
    const plus = zone.querySelector("[data-lc-plus]");
    if (plus) plus.addEventListener("click", () => this.memoriser(t));
    const boite = zone.querySelector("#lc-liste");
    if (boite) boite.addEventListener("click", ev => {
      const b = ev.target && ev.target.closest ? ev.target.closest("[data-lc-ligne]") : null; if (!b) return;
      const uid = b.dataset.lcLigne;
      if (E.sel){
        if (E.sel.has(uid)) E.sel.delete(uid); else E.sel.add(uid);
        const li = b.closest(".lc-ligne"), coche = E.sel.has(uid);
        b.setAttribute("aria-checked", String(coche)); if (li) li.classList.toggle("choisie", coche);
        const c = b.querySelector(".lc-case"); if (c) c.innerHTML = coche ? SVG.coche : "";
        this.majBarre(zone, t);
        return;
      }
      Clients.ouvrir(uid, b.dataset.nom, "accueil");
    });
    const agir = zone.querySelector("[data-sel-archiver]");
    if (agir) agir.addEventListener("click", () => this.agir(zone, t, agir));
  },
  /* « Archiver » (avec la fenêtre de confirmation, même pour un seul compte) ou « Restaurer » (dans « Archivés ») */
  async agir(zone, t, b){
    const E = this.etat(t), T = this.TEXTES[t], uids = Array.from(E.sel || []), n = uids.length;
    if (!n) return;
    const restaurer = E.filtre === "archives";
    if (!restaurer){
      const oui = await UI.ouvrir({ titre: this.plur(n, T.confirmer), corps: trad(n > 1 ? this.PLUSIEURS : this.UN), annulation: false, boutons: [
        { texte: trad("Annuler"), valeur: false, classe: "ghost" }, { texte: trad("Archiver"), valeur: true, classe: "danger", principal: true }] });
      if (!oui || !zone.isConnected) return;
    }
    b.disabled = true; b.textContent = "…";
    const r = await Archive.appliquer(uids, !restaurer);
    if (r.ok.length) UI.toast(this.plur(r.ok.length, restaurer ? T.restaures : T.archives), "ok");
    if (r.ko.length) UI.alerte(trad(r.ko.length > 1 ? "{n} comptes n'ont pas pu être changés ({c}). Ils sont restés sélectionnés : réessaie dans un instant." : "{n} compte n'a pas pu être changé ({c}). Il est resté sélectionné : réessaie dans un instant.", { n: r.ko.length, c: Commercial.cause(r.ko[0].e) }));
    E.sel = r.ko.length ? new Set(r.ko.map(x => x.uid)) : null;
    E.garder = !!r.ko.length;
    if (E.opts && typeof E.opts.recharger === "function") await E.opts.recharger();
    else if (zone.isConnected) this.dessiner(zone, t);
  }
};

/* ------------------------------------------------------------------
   v83 (bloc 3) — CRÉER UN ACCÈS (maquette Nouveau) : un écran à part, ouvert par « + » (#/clients/nouveau ou
   #/prospects/nouveau), la croix ramène à la liste d'où l'on vient. Mêmes champs, mêmes rôles et même logique qu'avant
   (Auth.creerAcces, statut client posé ensuite). Et les actions sur un compte, les mêmes partout (Comptes de Mes clients,
   onglet Compte de la fiche) : changer le statut, l'accès complet, supprimer définitivement (double confirmation, inchangée).
   ------------------------------------------------------------------ */
const Acces = {
  html(liste){
    return `<div id="acces-vue" class="acces-vue" data-liste="${esc(liste)}">
      <div class="fc-haut"><a class="rond" href="#/${esc(liste)}" id="acces-fermer" aria-label="${esc(trad("Fermer"))}" title="${esc(trad("Fermer"))}">${SVG.croix}</a></div>
      <header class="masthead"><h1>Créer un accès</h1><p class="lede">La personne recevra ces identifiants. Elle pourra changer son mot de passe et son adresse elle-même, depuis son profil. Personne ne peut créer de compte sans passer par toi.</p></header>
      <section class="panel">
        <div class="grid g2">
          <div><label for="n-prenom">Prénom</label><input id="n-prenom" type="text" autocomplete="off"></div>
          <div><label for="n-nom">Nom</label><input id="n-nom" type="text" autocomplete="off"></div>
          <div><label for="n-email">Email</label><input id="n-email" type="email" autocomplete="off"></div>
          <div><label for="n-mdp">Mot de passe provisoire</label><input id="n-mdp" type="text" autocomplete="off">
            <div class="acces-gen"><button class="btn ghost petit" type="button" id="n-gen">Générer un mot de passe</button></div></div>
          <div><label for="n-type">Type d'accès</label>
            <select id="n-type">
              <option value="client" selected>Client — ne voit que ses propres données</option>
              <option value="coach">Équipe — voit tout, comme toi</option>
            </select>
          </div>
        </div>
        <p class="note" id="n-avert" hidden style="margin-top:4px;color:var(--warn)">Cette personne verra les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète, et pourra les modifier.</p>
        <div class="actions acces-actions">
          <button class="btn" type="button" id="n-creer">Créer le compte</button>
          <span class="msg" id="n-msg" role="status" aria-live="polite"></span>
        </div>
      </section></div>`;
  },
  init(liste){
    const f = $("acces-fermer"); if (f) f.addEventListener("click", () => ListeCoach.revenir(liste));
    $("n-type").addEventListener("change", () => {
      $("n-avert").hidden = $("n-type").value !== "coach";
    });

    $("n-gen").addEventListener("click", () => {
      const a = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      /* un tirage fait pour les secrets (crypto), pas Math.random */
      const r = new Uint32Array(10);
      try { crypto.getRandomValues(r); } catch(e){ for (let i = 0; i < r.length; i++) r[i] = Math.floor(Math.random() * 4294967296); }
      $("n-mdp").value = Array.from(r, x => a[x % a.length]).join("");
    });

    $("n-creer").addEventListener("click", async () => {
      const prenom = $("n-prenom").value.trim(), nom = $("n-nom").value.trim();
      const email = $("n-email").value.trim(), mdp = $("n-mdp").value;
      const type = $("n-type") ? $("n-type").value : "client";
      if (!email || !mdp){ flash("n-msg","Il faut au moins un email et un mot de passe."); return; }
      if (type === "coach" && !(await UI.confirmer("Donner l'accès complet à " + (email) + " ?\n\nCette personne verra exactement ce que tu vois : toutes les fiches, les questionnaires de santé, les programmes et les diètes de tous tes clients.", { ok: "Donner l'accès", danger: true }))) return;
      if (mdp.length < 8){ flash("n-msg","Le mot de passe doit faire au moins 8 caractères."); return; }
      const b = $("n-creer"); b.disabled = true;
      flash("n-msg", "Création…");
      try {
        /* Le serveur cree le compte, verifie que c'est bien un coach qui le
           demande, et pose le role. Ta session n'est plus touchee : avant,
           la creation te reconnectait sous le nouveau compte et il fallait
           remettre la tienne en place a la main. */
        const cree = await Auth.creerAcces(email, mdp, prenom, nom, type);
        /* v39 : un compte cree par la base nait « prospect » ; un acces cree par
           le coach est un client (ou un membre de l'equipe) : on le pose tout de suite */
        let statutOk = true;
        if (cree && cree.id){
          try {
            const r = await Auth.appel("/rest/v1/profils?id=eq." + cree.id, {
              method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: "client" }
            });
            statutOk = Array.isArray(r) && !!r[0] && r[0].statut === "client";
          } catch(e){ statutOk = !!(e && e.code === "PGRST204"); }   // PGRST204 : la base n'a pas (encore) de colonne statut, rien a poser
        } else statutOk = false;   // pas d'identifiant en retour : on ne peut pas verifier, on le dit
        $("n-prenom").value = $("n-nom").value = $("n-email").value = $("n-mdp").value = "";
        if ($("n-type")) $("n-type").value = "client";
        if ($("n-avert")) $("n-avert").hidden = true;
        /* la fonction renvoie le role REELLEMENT pose (v39) : un acces d'equipe refuse se voit */
        const sansAcces = type === "coach" && cree && cree.role !== "coach";
        if (!statutOk) UI.alerte("Le compte de " + (((prenom + " " + nom).trim()) || email) + " est créé, mais il est encore « prospect » : son espace resterait limité.\n\nClique « Passer client » sur sa ligne, dans la liste des comptes.");
        else if (sansAcces) UI.alerte("Le compte de " + (((prenom + " " + nom).trim()) || email) + " est créé, mais sans l'accès complet.\n\nClique « Donner l'accès complet » sur sa ligne, dans la liste des comptes.");
        flash("n-msg", !statutOk
          ? "Compte créé, mais il est encore « prospect » : clique « Passer client » sur sa ligne."
          : sansAcces
          ? "Compte créé, mais sans l'accès complet : clique « Donner l'accès complet » sur sa ligne."
          : type === "coach"
          ? "Compte d'équipe créé, avec l'accès complet. Transmets-lui ses identifiants."
          : "Compte créé. Transmets-lui ses identifiants.");
      } catch(e){
        flash("n-msg", e.message || "Création impossible.");
      }
      b.disabled = false;
    });
  },

  /* « Supprimer » (définitivement) : double confirmation inchangée (fenêtre de l'app, puis le mot SUPPRIMER), fonction serveur
     supprimer-acces. b : le bouton (« … » pendant l'appel). Rend "fait", "annule" ou "echec". */
  async supprimer(p, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    if (!(await UI.confirmer("Supprimer définitivement le compte de " + nom + " ?\n\n" +
                 "Son profil, ses mensurations, son programme, ses repas et sa progression seront effacés. " +
                 "Tu n'y auras plus accès non plus.\n\nC'est définitif : il n'y a pas de corbeille.", { titre: "Supprimer un compte", ok: "Continuer", danger: true }))) return "annule";
    const mot = await UI.demander("Pour confirmer la suppression de " + nom + ", écris SUPPRIMER en majuscules :", "", { titre: "Supprimer un compte", ok: "Supprimer définitivement", danger: true });
    if (mot === null) return "annule";
    if (String(mot).trim().toUpperCase() !== "SUPPRIMER"){
      UI.alerte("Ce n'est pas le mot attendu : rien n'a été supprimé.");
      return "annule";
    }
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      await Auth.supprimerCompte(p.id, "SUPPRIMER");
      if (Store.idConsulte === p.id){ Store.oublier(p.id); Store.idConsulte = null; Store.nomConsulte = null; }
      return "fait";
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte("Suppression impossible : " + (e.message || "erreur inconnue"));
      return "echec";
    }
  },
  /* v39 — prospect <-> client : seul un coach peut le changer (garanti par la base). Rend true si c'est fait. */
  async changerStatut(p, vers, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    const message = vers === "client"
      ? "Passer " + nom + " en client ?\n\nIl aura accès à tout son espace d'accompagnement."
      : "Repasser " + nom + " en prospect ?\n\nIl redevient un compte gratuit : son espace sera limité au mode gratuit (" + ((CONFIG.marque.gratuit_ouverts || []).map(id => (OUTILS.find(o => o.id === id) || {}).nom).filter(Boolean).join(", ") || "accueil") + ") à sa prochaine ouverture de l'application, et il ne sera plus suivi comme un client. Ses données restent intactes.";
    if (!(await UI.confirmer(message, { ok: vers === "client" ? "Passer client" : "Repasser prospect", danger: vers === "prospect" }))) return false;
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      const r = await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
        method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: vers }
      });
      if (!Array.isArray(r) || !r[0] || r[0].statut !== vers) throw new Error("la base n'a pas confirmé le changement");
      return true;
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte("Changement impossible : " + (e.message || "erreur inconnue"));
      return false;
    }
  },
  /* l'accès complet (rôle coach) : le donner ou le retirer. Rend true si c'est fait. */
  async changerRole(p, vers, b){
    const nom = Clients.nom(p), texte = b ? b.textContent : "";
    const message = vers === "coach"
      ? "Donner l'accès complet à " + nom + " ?\n\nCette personne verra exactement ce que tu vois : les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète. Elle pourra aussi les modifier."
      : "Retirer l'accès complet à " + nom + " ?\n\nElle redeviendra un client ordinaire et ne verra plus que ses propres données.";
    if (!(await UI.confirmer(message, { ok: vers === "coach" ? "Donner l'accès" : "Retirer l'accès", danger: vers === "coach" }))) return false;
    if (b){ b.disabled = true; b.textContent = "…"; }
    try {
      await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
        method: "PATCH", headers: { "Prefer": "return=minimal" }, body: { role: vers }
      });
      return true;
    } catch(e){
      if (b){ b.disabled = false; b.textContent = texte; }
      UI.alerte("Changement impossible : " + (e.message || "erreur inconnue"));
      return false;
    }
  }
};
