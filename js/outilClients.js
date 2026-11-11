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
    const note = l => l.note == null ? '<span class="meta">—</span>' : bloc(`<b${l.alertes.some(a => a.type === "note_chute") ? ' class="neg"' : ""}>${esc(String(l.note))}</b><span class="meta">/10</span>`);
    const smiley = l => l.smiley ? `<span class="fbd-smiley-l" title="${esc(l.smiley.lbl)}${l.alertes.some(a => a.type === "avis_triste") ? " — à traiter" : ""}">${esc(l.smiley.emo)}</span>` : '<span class="meta">—</span>';
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

  /* v83 (bloc 3) : la liste des clients de la maquette (titre, nombre, recherche, filtres, « + », « Sélectionner »,
     ListeCoach). « Créer un accès » est un écran à part (#/clients/nouveau, Acces), ouvert par « + ».
     v84 (ménage du bloc 3) : l'écran d'avant, qui faisait doublon sous la liste, a quitté la page sans rien perdre : le
     tableau complet et ses alertes sont dans « Suivi détaillé » (outilSuiviClients, menu Plus), les comptes (équipe comprise)
     dans « Comptes » (outilComptes, menu Plus) ; mêmes contenus, mêmes boutons, mêmes identifiants. */
  html(){
    if (sousRoute === "nouveau") return Acces.html("clients");
    /* v98 : Suivi détaillé et Comptes ont quitté le menu : leurs écrans d'avant s'ouvrent d'ici.
       v106 (lot 1) : Vue tableau, Comptes et Créer un accès sont dans le menu « ⋯ » de la liste (ListeCoach.menuPoints) */
    return `<div id="lc-zone">${ListeCoach.attente("clients")}</div>`;
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
      try {
        const { profils, parClient, contenus, connexions } = await Clients.charger();
        const zone = $("lc-zone"); if (!zone || !zone.isConnected) return;
        /* v83 : les clients résumés une fois (la liste, avec les archivés : son filtre « Archivés ») */
        const lignes = Clients.resumer((profils || []).filter(p => p && p.role !== "coach" && p.statut !== "prospect"), parClient, contenus, connexions);
        ListeCoach.monter(zone, "clients", self.lignesListe(lignes), { recharger: charger });
      } catch(e){ ListeCoach.erreur($("lc-zone"), "clients"); }
    };
    charger();
  },

  /* v84 : les lignes du panneau « Comptes » (outilComptes) — tous les comptes non archivés, coachs compris : c'est là qu'on
     donne l'accès complet à quelqu'un de l'équipe, qu'on le retire, et qu'on supprime un compte d'équipe (qui n'a pas de fiche).
     Le même code qu'en v83 (déplacé tel quel depuis Mes clients). */
  comptes(box, donnees, recharger){
    const { profils, parClient, contenus } = donnees;
    const moi = Auth.utilisateur() && Auth.utilisateur().id;
    const comptes = (profils || []).filter(p => p && (p.role === "coach" || !Archive.le(contenus[p.id] && contenus[p.id].suivi_prospect)));
    if (!comptes.length){ box.innerHTML = '<div class="empty">Aucun compte pour le moment. Crée le premier accès avec « + », dans Clients.</div>'; return; }
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
      if (bsup) bsup.addEventListener("click", async () => { if (await Acces.supprimer(p, bsup) === "fait") await recharger(); });

      /* v39 — prospect <-> client : seul un coach peut le changer (garanti par la base) */
      const bst = el.querySelector(".statut");
      if (bst) bst.addEventListener("click", async () => { if (await Acces.changerStatut(p, bst.dataset.statut, bst)) await recharger(); });

      const br = el.querySelector(".role");
      if (br) br.addEventListener("click", async () => { if (await Acces.changerRole(p, br.dataset.role, br)) await recharger(); });
      box.appendChild(el);
    });
  }
};

/* ------------------------------------------------------------------
   v84 (ménage du bloc 3) — SUIVI DÉTAILLÉ (menu Plus) : le panneau « Suivi de mes clients » qui était sous la liste Clients,
   déplacé tel quel (le tableau complet de 18 colonnes, la légende, les alertes regroupées : calculateur ≠ questionnaire,
   régularité faible, sans nouvelles, jamais rien saisi, il manque quelque chose ; Préparer le call, Ouvrir, Appeler,
   WhatsApp) ; mêmes identifiants (#tb-clients, #alertes-clients). Sans les comptes archivés, comme avant.
   ------------------------------------------------------------------ */
const outilSuiviClients = {
  id: "suivi-clients",
  cle: null,
  nom: "Suivi détaillé",
  icone: "📋",
  role: "coach",
  titre: "Vue tableau",   // v106 (lot 1) : le nom du lien qui y mène (menu « ⋯ » de Clients)
  accroche: "Le tableau complet de tes clients, côte à côte, et ses alertes.",
  html(){
    return `
    <section class="panel">
      <h2>Suivi de mes clients</h2>
      <p class="note" style="margin:0 0 12px">Tous tes clients et leurs données, en direct. Le tableau te dit d'un coup d'œil qui avance, qui décroche, et à qui il manque quelque chose.</p>
      <div id="alertes-clients"></div>
      <div class="scroll" style="margin-top:14px"><table class="tb-clients-table"><thead><tr>
        <th>Client</th><th>Retour</th><th>Note</th><th>Smiley</th><th>Visite</th><th>Connexions</th><th>Dernière connexion</th><th>Jours actifs</th><th>Activité</th><th>Régularité</th><th>Poids</th><th>Depuis le début</th><th>4 dernières sem.</th>
        <th>Questionnaire</th><th>Programme</th><th>Diète</th><th>Téléphone</th><th></th>
      </tr></thead><tbody id="tb-clients"><tr><td colspan="18">Chargement…</td></tr></tbody></table></div>
      <p class="note" style="margin-top:12px">En haut : les 😞 non traités et les notes en chute, puis les retours de la semaine à lire. « Retour » : le feedback du dimanche ou le bilan du vendredi, selon ce que voit le client (à traiter / fait / non fait). « Note » et « Smiley » : son dernier feedback du dimanche. « Visite » et « Jours actifs » (sur 30 jours) : les jours où il a ouvert l'app — « — » quand ses visites ne sont pas suivies. « Connexions » : le nombre de jours où il a ouvert l'app connecté (une fois par jour au plus, depuis la mise en place du compteur) ; « Dernière connexion » : la date et l'heure de sa dernière ouverture — « — » si le compteur n'a pas pu être lu. « Activité » compte les jours depuis la dernière saisie du client, quelle qu'elle soit (une visite, un smiley ou une réponse lue ne comptent pas). Une variation de poids se lit sur quatre semaines : en dessous, c'est du bruit. Un compte archivé n'est pas dans ce tableau : il est dans « Archivés », dans Clients.</p>
    </section>`;
  },
  async init(){
    try {
      const { profils, parClient, contenus, connexions } = await Clients.charger();
      if (!$("tb-clients")) return;
      const lignes = Clients.resumer((profils || []).filter(p => p && p.role !== "coach" && p.statut !== "prospect"), parClient, contenus, connexions);
      outilClients.tableau(profils, parClient, contenus, connexions, lignes);
      ListeCoach.reprendre("suivi-clients");
    } catch(e){
      const tb = $("tb-clients"); if (tb) tb.innerHTML = '<tr><td colspan="18">Impossible de charger le suivi.</td></tr>';
    }
  }
};

/* ------------------------------------------------------------------
   v84 (ménage du bloc 3) — COMPTES (menu Plus) : le panneau « Comptes » qui était sous la liste Clients, déplacé tel quel :
   tous les comptes non archivés, ton équipe et toi compris ; Ouvrir sa fiche, Passer client / Repasser prospect,
   Donner / Retirer l'accès complet, Supprimer un compte d'équipe (qui n'a pas de fiche). Même identifiant (#liste-clients).
   ------------------------------------------------------------------ */
const outilComptes = {
  id: "comptes",
  cle: null,
  nom: "Comptes",
  icone: "🔑",
  role: "coach",
  titre: "Comptes",
  accroche: "Tous les comptes, ton équipe comprise : rôle, accès complet, passage client ou prospect.",
  html(){
    return `
    <section class="panel">
      <h2>Comptes</h2>
      <p class="note" style="margin:0 0 16px">« Supprimer définitivement » efface un compte et toutes ses données — c'est ce qu'il faut faire quand un client le demande : il est dans l'onglet « Compte » de sa fiche (ici, seulement pour un compte de ton équipe, qui n'a pas de fiche). « Accès complet » donne à une personne de ton équipe exactement ta vue : toutes les fiches, tous les questionnaires de santé, tous les programmes. Donne-le à un compte créé pour elle, jamais en partageant ton mot de passe — sinon tu ne sauras plus qui a modifié quoi, et tu ne pourras pas le lui retirer. Un compte archivé n'est pas listé ici : il est dans « Archivés », dans Clients ou Prospects.</p>
      <div id="liste-clients">${squelette()}</div>
    </section>`;
  },
  async init(){
    const charger = async () => {
      const box = $("liste-clients");
      try {
        const donnees = await Clients.charger({ connexions: false });
        if (!box || !box.isConnected) return;
        outilClients.comptes(box, donnees, charger);
        ListeCoach.reprendre("comptes");
      } catch(e){ if (box) box.innerHTML = '<div class="empty">Impossible de charger la liste.</div>'; }
    };
    charger();
  }
};

/* v104 (décision 10) : Clients, Archive, ListeCoach et Acces sont dans js/clients-prospects-communs.js. */
