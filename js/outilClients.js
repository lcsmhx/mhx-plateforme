/* ------------------------------------------------------------------
   OUTIL COACH — Mes clients (invisible pour les clients)
   ------------------------------------------------------------------ */
const outilClients = {
  id: "clients",
  cle: null,
  nom: "Mes clients",
  principal_coach: true,
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

  tableau(profils, parClient, contenus, connexions){
    const tb = $("tb-clients"), zoneA = $("alertes-clients");
    if (!tb) return;
    /* v71 (D) : le tableau ne liste que les clients ; un compte sans colonne statut reste un client (comme partout) ;
       les prospects sont sur la page Prospects, la ligne sous le titre le dit (toujours, meme a zero) ;
       la section Comptes garde tout le monde (c'est la qu'on passe un prospect client) */
    const tous = (profils || []).filter(p => p && p.role !== "coach");
    const clients = tous.filter(p => p.statut !== "prospect"), nbProspects = tous.length - clients.length;
    const zp = $("clients-prospects");
    if (zp){
      zp.hidden = false;
      zp.innerHTML = `Les prospects sont dans <a class="link-a" href="#/prospects">Prospects →</a> (${nbProspects} compte${nbProspects > 1 ? "s" : ""} gratuit${nbProspects > 1 ? "s" : ""}).`;
    }
    if (!clients.length){
      tb.innerHTML = '<tr><td colspan="17">Aucun client pour le moment.</td></tr>';
      if (zoneA) zoneA.innerHTML = "";
      return;
    }
    /* v37 — le resume de chaque client et son tri par urgence vivent dans
       Clients.resumer : le tableau de bord et la fiche s'en servent aussi (ici, les clients seulement : un prospect
       n'est plus classe par le score d'urgence devant les clients sains) */
    const lignes = Clients.resumer(clients, parClient, contenus, connexions);

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
      <td data-l="" class="td-actions"><button class="voir" type="button" data-bilan="${esc(l.p.id)}" data-nom="${esc(l.nom)}">Préparer le call</button> <button class="voir" type="button" data-ouvrir="${esc(l.p.id)}" data-nom="${esc(l.nom)}">Ouvrir</button></td>
    </tr>`).join("");

    $$("[data-ouvrir]", tb).forEach(b => b.addEventListener("click", () => {
      Store.oublier(Store.idConsulte);
      Store.idConsulte = b.dataset.ouvrir;
      Store.nomConsulte = b.dataset.nom;
      location.hash = "#/accueil";     // v37 : la fiche s'ouvre sur la vue d'ensemble
    }));
    $$("[data-bilan]", tb).forEach(b => b.addEventListener("click", () => {
      Store.oublier(Store.idConsulte);
      Store.idConsulte = b.dataset.bilan;
      Store.nomConsulte = b.dataset.nom;
      location.hash = "#/bilan";
    }));

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

  html(){
    return `
    <section class="panel">
      <h2>Suivi de mes clients</h2>
      <p class="note" id="clients-prospects" hidden style="margin:0 0 10px"></p>
      <div id="alertes-clients"></div>
      <div class="scroll" style="margin-top:14px"><table class="tb-clients-table"><thead><tr>
        <th>Client</th><th>Retour</th><th>Note</th><th>Smiley</th><th>Visite</th><th>Connexions</th><th>Dernière connexion</th><th>Jours actifs</th><th>Activité</th><th>Régularité</th><th>Poids</th><th>Depuis le début</th><th>4 dernières sem.</th>
        <th>Questionnaire</th><th>Programme</th><th>Diète</th><th></th>
      </tr></thead><tbody id="tb-clients"><tr><td colspan="17">Chargement…</td></tr></tbody></table></div>
      <p class="note" style="margin-top:12px">En haut : les 😞 non traités et les notes en chute, puis les retours de la semaine à lire. « Retour » : le feedback du dimanche ou le bilan du vendredi, selon ce que voit le client (à traiter / fait / non fait). « Note » et « Smiley » : son dernier feedback du dimanche. « Visite » et « Jours actifs » (sur 30 jours) : les jours où il a ouvert l'app — « — » quand ses visites ne sont pas suivies. « Connexions » : le nombre de jours où il a ouvert l'app connecté (une fois par jour au plus, depuis la mise en place du compteur) ; « Dernière connexion » : la date et l'heure de sa dernière ouverture — « — » si le compteur n'a pas pu être lu. « Activité » compte les jours depuis la dernière saisie du client, quelle qu'elle soit (une visite, un smiley ou une réponse lue ne comptent pas). Une variation de poids se lit sur quatre semaines : en dessous, c'est du bruit.</p>
    </section>

    <section class="panel">
      <h2>Comptes</h2>
      <p class="note" style="margin:0 0 16px">« Supprimer » efface définitivement un compte et toutes ses données — c'est ce qu'il faut faire quand un client le demande. « Accès complet » donne à une personne de ton équipe exactement ta vue : toutes les fiches, tous les questionnaires de santé, tous les programmes. Donne-le à un compte créé pour elle, jamais en partageant ton mot de passe — sinon tu ne sauras plus qui a modifié quoi, et tu ne pourras pas le lui retirer.</p>
      <div id="liste-clients"><div class="empty">Chargement…</div></div>
    </section>

    <section class="panel">
      <h2>Créer un accès</h2>
      <p class="note" style="margin-bottom:16px">La personne recevra ces identifiants. Elle pourra changer son mot de passe et son adresse elle-même, depuis son profil. Personne ne peut créer de compte sans passer par toi.</p>
      <div class="grid g2">
        <div><label for="n-prenom">Prénom</label><input id="n-prenom" type="text"></div>
        <div><label for="n-nom">Nom</label><input id="n-nom" type="text"></div>
        <div><label for="n-email">Email</label><input id="n-email" type="email"></div>
        <div><label for="n-mdp">Mot de passe provisoire</label><input id="n-mdp" type="text"></div>
        <div><label for="n-type">Type d'accès</label>
          <select id="n-type">
            <option value="client" selected>Client — ne voit que ses propres données</option>
            <option value="coach">Équipe — voit tout, comme toi</option>
          </select>
        </div>
      </div>
      <p class="note" id="n-avert" hidden style="margin-top:4px;color:var(--warn)">Cette personne verra les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète, et pourra les modifier.</p>
      <div class="actions">
        <button class="btn" id="n-creer">Créer le compte</button>
        <button class="btn ghost" id="n-gen">Générer un mot de passe</button>
        <span class="msg" id="n-msg"></span>
      </div>
    </section>`;
  },

  async init(){
    const self = this;

    const charger = async () => {
      const box = $("liste-clients");
      try {
        const { profils, parClient, contenus, connexions } = await Clients.charger();
        self.tableau(profils, parClient, contenus, connexions);
        /* Tous les comptes, coachs compris : c'est ici qu'on donne l'acces
           complet a quelqu'un de l'equipe, et qu'on le retire. */
        const moi = Auth.utilisateur() && Auth.utilisateur().id;
        const comptes = (profils || []);
        if (!comptes.length){ box.innerHTML = '<div class="empty">Aucun compte pour le moment. Crée le premier accès ci-dessous.</div>'; return; }
        box.innerHTML = "";
        comptes.forEach(p => {
          const d = parClient[p.id];
          const quand = d ? new Date(d).toLocaleDateString("fr-FR") : "jamais";
          const estCoach = p.role === "coach", cestMoi = p.id === moi;
          const el = document.createElement("div");
          el.className = "client-l";
          /* le client a choisi l'anglais : le coach le voit, et ecrit ses notes en anglais */
          const enAnglais = !estCoach && contenus[p.id] && contenus[p.id].prefs && contenus[p.id].prefs.langue === "en";
          el.innerHTML = `<span class="nom">${esc(Clients.nom(p))}${enAnglais ? ` <span class="pastille" title="Ce client utilise l'app en anglais : écris-lui tes notes en anglais">🇺🇸 anglais</span>` : ""}</span>
                          ${estCoach ? `<span class="pastille role-coach">accès complet</span>` : `<span class="pastille">${d ? "actif" : "pas encore utilisé"}</span>`}
                          ${!estCoach && "statut" in p ? `<span class="pastille${p.statut === "prospect" ? " accent" : " ok"}">${p.statut === "prospect" ? "prospect" : "client"}</span>` : ""}
                          <span class="meta">${estCoach ? (cestMoi ? "c'est toi" : "voit tout, comme toi") : "dernière saisie : " + quand}</span>
                          ${estCoach ? "" : `<button class="voir" type="button">Ouvrir sa fiche</button>`}
                          ${cestMoi ? "" : `<button class="voir role" type="button" data-role="${estCoach ? "client" : "coach"}">${estCoach ? "Retirer l'accès complet" : "Donner l'accès complet"}</button>`}
                          ${!estCoach && "statut" in p ? `<button class="voir statut" type="button" data-statut="${p.statut === "prospect" ? "client" : "prospect"}">${p.statut === "prospect" ? "Passer client" : "Repasser prospect"}</button>` : ""}
                          ${cestMoi ? "" : `<button class="voir suppr" type="button">Supprimer</button>`}`;
          const bv = el.querySelector(".voir:not(.role):not(.statut):not(.suppr)");
          if (bv) bv.addEventListener("click", () => {
            Store.oublier(Store.idConsulte);
            Store.idConsulte = p.id;
            Store.nomConsulte = Clients.nom(p);   // v43 : « Sans nom », comme dans la liste
            location.hash = "#/profil";
          });
          const bsup = el.querySelector(".suppr");
          if (bsup) bsup.addEventListener("click", async () => {
            const nom = Clients.nom(p);
            if (!(await UI.confirmer("Supprimer définitivement le compte de " + nom + " ?\n\n" +
                         "Son profil, ses mensurations, son programme, ses repas et sa progression seront effacés. " +
                         "Tu n'y auras plus accès non plus.\n\nC'est définitif : il n'y a pas de corbeille.", { titre: "Supprimer un compte", ok: "Continuer", danger: true }))) return;
            const mot = await UI.demander("Pour confirmer la suppression de " + nom + ", écris SUPPRIMER en majuscules :", "", { titre: "Supprimer un compte", ok: "Supprimer définitivement", danger: true });
            if (mot === null) return;
            if (String(mot).trim().toUpperCase() !== "SUPPRIMER"){
              UI.alerte("Ce n'est pas le mot attendu : rien n'a été supprimé.");
              return;
            }
            bsup.disabled = true; bsup.textContent = "…";
            try {
              await Auth.supprimerCompte(p.id, "SUPPRIMER");
              if (Store.idConsulte === p.id){ Store.oublier(p.id); Store.idConsulte = null; Store.nomConsulte = null; }
              await charger();
            } catch(e){
              bsup.disabled = false; bsup.textContent = "Supprimer";
              UI.alerte("Suppression impossible : " + (e.message || "erreur inconnue"));
            }
          });

          /* v39 — prospect <-> client : seul un coach peut le changer (garanti par la base) */
          const bst = el.querySelector(".statut");
          if (bst) bst.addEventListener("click", async () => {
            const vers = bst.dataset.statut;
            const nom = Clients.nom(p);
            const message = vers === "client"
              ? "Passer " + nom + " en client ?\n\nIl aura accès à tout son espace d'accompagnement."
              : "Repasser " + nom + " en prospect ?\n\nIl redevient un compte gratuit : son espace sera limité au mode gratuit (" + ((CONFIG.marque.gratuit_ouverts || []).map(id => (OUTILS.find(o => o.id === id) || {}).nom).filter(Boolean).join(", ") || "accueil") + ") à sa prochaine ouverture de l'application, et il ne sera plus suivi comme un client. Ses données restent intactes.";
            if (!(await UI.confirmer(message, { ok: vers === "client" ? "Passer client" : "Repasser prospect", danger: vers === "prospect" }))) return;
            bst.disabled = true; bst.textContent = "…";
            try {
              const r = await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
                method: "PATCH", headers: { "Prefer": "return=representation" }, body: { statut: vers }
              });
              if (!Array.isArray(r) || !r[0] || r[0].statut !== vers) throw new Error("la base n'a pas confirmé le changement");
              await charger();
            } catch(e){
              bst.disabled = false; bst.textContent = vers === "client" ? "Passer client" : "Repasser prospect";
              UI.alerte("Changement impossible : " + (e.message || "erreur inconnue"));
            }
          });

          const br = el.querySelector(".role");
          if (br) br.addEventListener("click", async () => {
            const vers = br.dataset.role;
            const nom = Clients.nom(p);
            const message = vers === "coach"
              ? "Donner l'accès complet à " + nom + " ?\n\nCette personne verra exactement ce que tu vois : les fiches de tous tes clients, leur questionnaire de santé, leurs programmes et leur diète. Elle pourra aussi les modifier."
              : "Retirer l'accès complet à " + nom + " ?\n\nElle redeviendra un client ordinaire et ne verra plus que ses propres données.";
            if (!(await UI.confirmer(message, { ok: vers === "coach" ? "Donner l'accès" : "Retirer l'accès", danger: vers === "coach" }))) return;
            br.disabled = true; br.textContent = "…";
            try {
              await Auth.appel("/rest/v1/profils?id=eq." + p.id, {
                method: "PATCH", headers: { "Prefer": "return=minimal" }, body: { role: vers }
              });
              await charger();
            } catch(e){
              br.disabled = false; br.textContent = vers === "coach" ? "Donner l'accès complet" : "Retirer l'accès complet";
              UI.alerte("Changement impossible : " + (e.message || "erreur inconnue"));
            }
          });
          box.appendChild(el);
        });
      } catch(e){
        box.innerHTML = '<div class="empty">Impossible de charger la liste.</div>';
        const tb = $("tb-clients"); if (tb) tb.innerHTML = '<tr><td colspan="17">Impossible de charger le suivi.</td></tr>';
      }
    };

    $("n-type").addEventListener("change", () => {
      $("n-avert").hidden = $("n-type").value !== "coach";
    });

    $("n-gen").addEventListener("click", () => {
      const a = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let m = ""; for (let i=0;i<10;i++) m += a[Math.floor(Math.random()*a.length)];
      $("n-mdp").value = m;
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
        charger();
      } catch(e){
        flash("n-msg", e.message || "Création impossible.");
      }
      b.disabled = false;
    });

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
    const profils = await this.pages("/rest/v1/profils?select=*&order=cree_le.desc,id.asc", l => String(l && l.id));
    /* les historiques (jusqu'a 24 plans par client) ne servent pas ici :
       on ne les telecharge pas */
    /* v38 : les notes privees ne servent pas ici non plus */
    const donnees = await this.pages("/rest/v1/donnees?select=user_id,outil,contenu,maj_le&outil=not.in.(hist_programme,hist_repas,notes_coach)&order=user_id.asc,outil.asc", l => String(l && l.user_id) + "|" + String(l && l.outil));
    const parClient = {}, contenus = {};
    /* « Activite » = ce que le CLIENT a saisi. Ce que le coach ecrit dans
       sa fiche (programme, diete, calories, feedbacks, notes) ne dit rien de lui. */
    const ecritParCoach = ["programme", "repas", "calc", "complements", "feedbacks", "notes_coach", "suivi_prospect"];
    /* v51 : ni le choix des emails de suivi, ni la date « vu » des Nouveautes ne sont une saisie ; les pages vues
       (activite) ne comptent que pour un prospect (un client inactif garde son alerte « Inactif depuis N j ») */
    const pasSaisie = ["emails", "coach_notifs"], prospects = new Set((profils || []).filter(p => p && p.statut === "prospect").map(p => p.id));
    (donnees || []).forEach(d => {
      const saisie = ecritParCoach.indexOf(d.outil) === -1 && pasSaisie.indexOf(d.outil) === -1 && (d.outil !== "activite" || prospects.has(d.user_id));
      const c = Forme.cle(d.outil, d.contenu);   // v42
      /* v59 (Q13-4) : checkins compte par ses vraies saisies (ses entrées), pas par la date de sa ligne */
      const quand = saisie ? this.dateSaisie(d.outil, d.maj_le, c) : null;
      if (quand && (!parClient[d.user_id] || quand > parClient[d.user_id])) parClient[d.user_id] = quand;
      (contenus[d.user_id] = contenus[d.user_id] || {})[d.outil] = c;
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
      act: (c.activite && typeof c.activite === "object") ? c.activite : null,   // v51 : activite (chronologie de la fiche)
      /* v53 (chantier 4) : dernière visite et jours actifs sur 30 jours ; un compte non suivi (client hors interrupteur
         suivi_visites_clients) : rien (« — »), même s'il a une ancienne clé activite de quand il était prospect */
      visites: Activite.lecture(c.activite, Activite.suiviPour(p)),
      /* v56 : nombre de connexions et derniere connexion (table connexions), pour chaque client et prospect ; « — » si la
         table n'a pas pu etre lue */
      connexions: Connexions.lecture(cx && cx.ligne, Connexions.suiviPour(p), !!(cx && cx.lue)),
      suivi: (c.suivi_prospect && typeof c.suivi_prospect === "object") ? c.suivi_prospect : null,   // v49 : suivi commercial
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
    Store.oublier(Store.idConsulte);
    Store.idConsulte = p; Store.nomConsulte = nom;
    location.hash = "#/" + (cible || "accueil");
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

