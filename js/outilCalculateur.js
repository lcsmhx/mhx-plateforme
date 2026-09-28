/* ==================================================================
   [F] OUTILS
   Chaque outil est un objet autonome :
     id       — utilisé dans l'adresse (#/calculateur)
     cle      — clé de stockage (préfixée "mhx_")
     nom      — libellé dans la navigation
     icone    — emoji de la navigation
     titre    — grand titre de la page
     accroche — phrase d'introduction
     html()   — le contenu de la page
     init()   — branche les interactions ; peut renvoyer une fonction
                de nettoyage appelée quand on quitte l'outil
   ================================================================== */

/* ------------------------------------------------------------------
   OUTIL 1 — Calculateur métabolique
   ------------------------------------------------------------------ */
const outilCalculateur = {
  id: "calculateur",
  cle: "calc",
  /* v52 : ouvert au prospect (gratuit pour toujours), qui travaille sur une cle A LUI (calc_perso, meme forme que calc) :
     il ne lit ni n'ecrit jamais calc. Le coach (son compte et la fiche d'un client) lit et ecrit calc exactement comme
     avant. v53 (lot D, partie clients) : ouvert aussi au CLIENT (plus de masque_client), de la meme facon : sa cle
     calc_perso ; le calc prepare par son coach n'est que LU, comme valeur de depart (Store.lireTout) ; il n'ecrit
     jamais calc (le generateur de diete du coach et l'alerte d'ecart lisent calc : inchanges). Sur le telephone du
     client, il est dans « Plus » (ses 4 onglets principaux ne changent pas). */
  cle_perso: "calc_perso",
  nom: "Calculateur",
  icone: "🔥",
  titre: "Calculateur métabolique",
  accroche: "Tes calories de maintenance et tes macros, calculées sur ta morphologie et ton niveau d'activité réel. Tout se met à jour en direct.",

  /* v52 : le calcul de la personne elle-meme (tout compte qui n'est pas le coach : prospect, et client en v53), sur
     calc_perso, avec les garde-fous (18 ans, IMC) et la mention « pas un avis medical » ; le coach garde son
     calculateur tel quel, sur calc (son compte et, en consultation, la fiche d'un client) */
  perso(){ return !Auth.estCoach(); },

  html(){
    const perso = this.perso(), c = CONFIG.calcul;
    const loc = v => perso ? Number(v).toLocaleString(locale()) : String(v).replace(".", ",");
    return `
    <section class="panel">
      <h2>${esc(trad("Tes données"))}</h2>
      <div class="grid g2">
        <div>
          <label for="sexe">${esc(trad("Sexe"))}</label>
          <div class="seg" id="sexe" role="group" aria-label="${esc(trad("Sexe"))}">
            <button type="button" data-v="H">${esc(trad("Homme"))}</button>
            <button type="button" data-v="F">${esc(trad("Femme"))}</button>
          </div>
        </div>
        <div><label for="age">${esc(trad("Âge (ans)"))}</label><input id="age" type="number" min="${perso ? this.bornes().age[0] : 14}" max="90" step="1"${perso ? ' inputmode="numeric"' : ""}></div>
        <div><label for="taille">${esc(trad("Taille (cm)"))}</label><input id="taille" type="number" min="130" max="220" step="1"${perso ? ' inputmode="numeric"' : ""}></div>
        <div><label for="poids">${esc(trad("Poids (kg)"))}</label><input id="poids" type="number" min="35" max="250" step="0.1"${perso ? ' inputmode="decimal"' : ""}></div>
        <div><label for="pas">${esc(trad("Pas par jour"))}</label><input id="pas" type="number" min="0" max="30000" step="500"${perso ? ' inputmode="numeric"' : ""}></div>
        <div><label for="heures">${esc(trad("Entraînement (h / semaine)"))}</label><input id="heures" type="number" min="0" max="25" step="0.5"${perso ? ' inputmode="decimal"' : ""}></div>
      </div>
      ${perso ? `<p class="flag" id="calc-etat" role="status" aria-live="polite" hidden></p>
      <div class="actions"><button class="btn" type="button" id="calc-ok" hidden>${esc(trad("Enregistrer mes chiffres"))}</button><span class="msg" id="calc-msg" role="status" aria-live="polite"></span></div>` : ""}
    </section>

    <section class="panel">
      <h2>${esc(trad("Ta maintenance"))}</h2>
      <div class="hero"><span class="readout hero-num" id="tdee">—</span><span class="unit">${esc(trad("kcal / jour"))}</span></div>
      <p class="note" style="margin:10px 0 20px">${esc(trad("C'est ce que ton corps dépense sur une journée type. Manger ça, c'est rester au même poids."))}</p>
      <h3>${esc(trad("Choisis ton objectif"))}</h3>
      <div class="obj-grid" id="objs">
        <button class="obj" type="button" data-k="perte"><span class="lbl">${esc(trad("Perte de poids −10%"))}</span><span class="val readout" id="v-perte">—</span></button>
        <button class="obj" type="button" data-k="maintien"><span class="lbl">${esc(trad("Maintien"))}</span><span class="val readout" id="v-maintien">—</span></button>
        <button class="obj" type="button" data-k="prise"><span class="lbl">${esc(trad("Prise de masse +10%"))}</span><span class="val readout" id="v-prise">—</span></button>
      </div>
      ${perso ? `<p class="flag" id="calc-imc" hidden></p>` : ""}
    </section>

    <section class="panel">
      <h2>${esc(trad("Tes macros"))} — <span id="obj-name">${esc(trad("maintien"))}</span></h2>
      <div class="grid g3">
        <div class="macro"><div class="m-top"><span class="m-name">${esc(trad("Protéines"))}</span><span class="m-g readout" id="g-prot">—</span></div><div class="bar"><i id="b-prot" style="background:var(--s1)"></i></div><span class="m-sub" id="s-prot"></span></div>
        <div class="macro"><div class="m-top"><span class="m-name">${esc(trad("Lipides"))}</span><span class="m-g readout" id="g-lip">—</span></div><div class="bar"><i id="b-lip" style="background:var(--s2)"></i></div><span class="m-sub" id="s-lip"></span></div>
        <div class="macro"><div class="m-top"><span class="m-name">${esc(trad("Glucides"))}</span><span class="m-g readout" id="g-gluc">—</span></div><div class="bar"><i id="b-gluc" style="background:var(--s3)"></i></div><span class="m-sub" id="s-gluc"></span></div>
      </div>
      <p class="note" style="margin-top:14px">${esc(trad("Grammes par jour. Protéines fixées à {p} g par kg de poids de corps, lipides à {l} g par kg, les glucides complètent le total de calories de ton objectif.", { p: perso ? loc(c.proteines_g_par_kg) : c.proteines_g_par_kg, l: perso ? loc(c.lipides_g_par_kg) : c.lipides_g_par_kg }))}</p>
      <div id="flag" class="flag" hidden></div>
      <details>
        <summary>${esc(trad("Comment ces chiffres sont calculés"))}</summary>
        <p class="note" style="margin-top:12px"><strong>${esc(trad("1. Métabolisme de base"))}</strong> ${esc(trad("— formule de Mifflin-St Jeor, la référence actuelle :"))}<br><span class="readout" id="f-bmr"></span></p>
        <p class="note"><strong>${esc(trad("2. Facteur d'activité"))}</strong> ${esc(trad("— on part d'une base sédentaire de {b}, puis on ajoute ton activité réelle :", { b: loc(c.facteur_base) }))}<br><span class="readout" id="f-fact"></span></p>
        <p class="note"><strong>${esc(trad("3. Maintenance"))}</strong> ${esc(trad("= métabolisme de base × facteur d'activité ="))} <span class="readout" id="f-tdee"></span></p>
        <p class="note">${esc(trad("Ces formules donnent une estimation solide, pas une vérité absolue. La vraie mesure, c'est la balance : garde le même apport pendant 2 semaines, et si ton poids ne bouge pas dans le sens voulu, ajuste de 150 à 200 kcal."))}</p>
      </details>
      ${perso ? `<p class="note" id="calc-avis" style="margin:14px 0 0">${esc(trad("Ces chiffres sont une estimation générale, pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel."))}</p>` : ""}
    </section>`;
  },

  /* v44 — les donnees de depart a partir du questionnaire (meme logique qu'avant,
     partagee avec la Decouverte) : rien n'est ecrit tant qu'on n'a rien touche */
  departDepuis(intake){
    const c = CONFIG.calcul;
    intake = intake || {};
    const depart = Object.assign({ objectif:"maintien" }, c.valeurs_depart);
    if (num(intake.poids))  depart.poids  = num(intake.poids);
    if (num(intake.taille)) depart.taille = num(intake.taille);
    if (num(intake.age))    depart.age    = num(intake.age);
    if (intake.sexe)        depart.sexe   = (intake.sexe === "Femme") ? "F" : "H";
    if (num(intake.pas))    depart.pas    = num(intake.pas);
    if (num(intake.seances)) depart.heures = num(intake.seances) * 1.25;   // ~1 h 15 par seance
    if (/perte|s[èe]che/i.test(intake.objectif || "")) depart.objectif = "perte";
    else if (/prise|masse/i.test(intake.objectif || "")) depart.objectif = "prise";
    return depart;
  },

  /* --- le calcul, isolé pour pouvoir être modifié sans toucher au reste --- */
  metabolismeDeBase(d){
    const b = 10*d.poids + 6.25*d.taille - 5*d.age;
    return d.sexe === "H" ? b + 5 : b - 161;
  },
  facteurActivite(d){
    const c = CONFIG.calcul;
    const parPas    = Math.min(d.pas, c.plafond_pas)/10000 * c.bonus_10000_pas;
    const parHeures = Math.min(d.heures, c.plafond_heures) * c.bonus_par_heure;
    return { total: c.facteur_base + parPas + parHeures, parPas, parHeures };
  },
  macros(kcal, poids){
    const c = CONFIG.calcul;
    const prot = c.proteines_g_par_kg * poids;
    const lip  = c.lipides_g_par_kg  * poids;
    const gluc = (kcal - prot*4 - lip*9) / 4;
    return { prot, lip, gluc: Math.max(gluc, 0), glucBrut: gluc };
  },

  /* ---------- v52 : le calcul de la personne elle-meme (prospect ; client en v53) : cle calc_perso ----------
     bornes de saisie : celles du questionnaire court (CONFIG.decouverte.bornes : l'age minimum, 18, se change la) */
  bornes(){
    const B = (CONFIG.decouverte && CONFIG.decouverte.bornes) || {};
    const b = (x, d) => Array.isArray(x) && x.length === 2 && isFinite(x[0]) && isFinite(x[1]) ? x : d;
    return { age: b(B.age, [18, 90]), taille: b(B.taille, [120, 230]), poids: b(B.poids, [35, 250]), pas: [0, 30000], heures: [0, 25] };
  },
  CHAMPS: ["sexe", "age", "taille", "poids", "pas", "heures", "objectif"],
  LIBELLES: { sexe: "Sexe", age: "Âge (ans)", taille: "Taille (cm)", poids: "Poids (kg)", pas: "Pas par jour", heures: "Entraînement (h / semaine)" },
  /* un nombre lisible, sinon null (jamais NaN, jamais une chaine) */
  nombre(v){ const n = typeof v === "number" ? v : (typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN); return isFinite(n) ? n : null; },
  /* un calcul enregistre d'aplomb (sert aussi a l'accueil du prospect : « son calcul est enregistre ») */
  valide(D){
    if (!D || typeof D !== "object" || Array.isArray(D)) return false;
    const B = this.bornes(), dans = (k) => { const n = this.nombre(D[k]); return n != null && n >= B[k][0] && n <= B[k][1]; };
    return (D.sexe === "H" || D.sexe === "F") && ["age", "taille", "poids", "pas", "heures"].every(dans) && ["perte", "maintien", "prise"].indexOf(D.objectif) > -1;
  },
  /* un age saisi sous le minimum (garde-fou 18 ans) */
  mineur(D){ const a = D && typeof D === "object" ? this.nombre(D.age) : null; return a != null && a > 0 && a < this.bornes().age[0]; },
  /* IMC sous 18,5 : aucun objectif de perte n'est propose (garde-fou sante repris de outilDecouverte.chiffres) */
  imcBas(D){ const p = this.nombre(D && D.poids), t = this.nombre(D && D.taille); return p > 0 && t > 0 && p / Math.pow(t / 100, 2) < 18.5; },
  /* valeur de depart : le calc du coach s'il en a prepare un, sinon le questionnaire. Contrairement au coach, rien n'est
     invente : sexe, age, taille, poids et heures d'entrainement restent vides tant qu'ils ne sont pas connus (c'est la
     personne qui les donne, l'age compris : c'est lui que juge le garde-fou) ; pas par jour : ceux de la Decouverte. */
  departPerso(intake, calcCoach){
    intake = intake && typeof intake === "object" ? intake : {};
    const d = this.departDepuis(intake);
    if (!(num(intake.age) > 0)) d.age = null;
    if (!(num(intake.taille) > 0)) d.taille = null;
    if (!(num(intake.poids) > 0)) d.poids = null;
    if (!intake.sexe) d.sexe = null;
    if (!(num(intake.seances) > 0)) d.heures = null;
    if (!(num(intake.pas) > 0)) d.pas = (CONFIG.decouverte && CONFIG.decouverte.pas_defaut) || d.pas;
    if (calcCoach && typeof calcCoach === "object" && !Array.isArray(calcCoach)) this.CHAMPS.forEach(k => { if (calcCoach[k] != null && calcCoach[k] !== "") d[k] = calcCoach[k]; });
    return d;
  },

  /* Le prospect (et le client, v53) : lit et ecrit calc_perso, jamais calc. Rien n'est enregistre avant une vraie saisie, ni tant que ses
     donnees ne sont pas completes et dans les bornes. Garde-fou 18 ans : un age sous le minimum (juge a la sortie du
     champ, ou des qu'il a deux chiffres) affiche un message, n'enregistre rien, annule l'ecriture en attente, et retire
     ce que ce formulaire avait deja enregistre (calc_perso vide). Un calc_perso enregistre avec un age mineur (ecrit hors
     de l'application) est retire de la meme facon a l'ouverture. */
  async initPerso(){
    const c = CONFIG.calcul, self = this, cle = this.cle_perso, B = this.bornes();
    const intake = Store.cache["intake"] || await Store.lire("intake", {});
    /* lecture seule du calc du coach (valeur de depart) et du calc_perso tel qu'il est en base (savoir s'il y a quelque
       chose a retirer) : ni le cache, ni les drapeaux de lecture ne bougent */
    const brut = await Store.lireTout(["calc", cle]);
    const D = await Store.lire(cle, this.departPerso(intake, brut.calc));
    if (!$("tdee")) return;   // page quittee pendant la lecture
    const R = brut[cle];
    /* aRetirer : ce formulaire a peut-etre quelque chose en base (lu a l'ouverture, ou saisie programmee depuis) */
    let aRetirer = !!(R && typeof R === "object" && this.CHAMPS.some(k => k in R));
    let touche = false, retire = false, ageJuge = true;
    /* la forme comparable d'un calcul (le dernier enregistre, celui a l'ecran) : le bouton « Enregistrer mes chiffres »
       ne se montre que si l'ecran differe de ce qui est enregistre */
    const forme = X => JSON.stringify(self.CHAMPS.map(k => (k === "sexe" || k === "objectif") ? (X && X[k]) || null : self.nombre(X && X[k])));
    let dernier = R && this.valide(R) && !this.mineur(R) ? forme(R) : "";
    /* champs remis d'aplomb (une valeur ecrite hors de l'application ne fait rien tomber) */
    ["age", "taille", "poids", "pas", "heures"].forEach(k => { D[k] = self.nombre(D[k]); });
    if (D.sexe !== "H" && D.sexe !== "F") D.sexe = null;
    if (["perte", "maintien", "prise"].indexOf(D.objectif) === -1) D.objectif = "maintien";

    /* garde-fou 18 ans : la saisie en attente ne part pas, et ce qui a pu partir est remplace par un calcul vide (une
       seule fois : l'ecriture du vide, en attente, n'est jamais annulee par un nouvel appel) */
    const retirer = () => {
      if (retire) return;
      Store.annuler(cle);
      if (aRetirer && Store.ecrire(cle, {}) !== false){ aRetirer = false; retire = true; dernier = ""; }
    };
    const sauver = (force) => {
      if (!(touche || force) || !self.valide(D) || self.mineur(D)) return;
      const v = {}; self.CHAMPS.forEach(k => { v[k] = D[k]; });
      if (Store.ecrire(cle, v) !== false){ aRetirer = true; retire = false; dernier = forme(v); flash("calc-msg", trad("Tes chiffres sont enregistrés.")); }
    };
    const vider = () => {
      ["tdee", "v-perte", "v-maintien", "v-prise", "g-prot", "g-lip", "g-gluc"].forEach(id => { $(id).textContent = "—"; });
      ["s-prot", "s-lip", "s-gluc", "f-bmr", "f-fact", "f-tdee"].forEach(id => { $(id).textContent = ""; });
      ["b-prot", "b-lip", "b-gluc"].forEach(id => { $(id).style.width = "0%"; });
      $("flag").hidden = true;
      $("calc-ok").hidden = true;
    };
    const dire = (t) => { const e = $("calc-etat"); if (!e) return; e.hidden = !t; e.textContent = t || ""; };
    const lib = k => trad(self.LIBELLES[k]);

    const rendre = () => {
      if (!$("tdee")) return;
      /* garde-fou IMC : sous 18,5, pas d'objectif de perte (maintien) et la phrase de prudence */
      const imcBas = self.imcBas(D);
      const bp = $("objs").querySelector('[data-k="perte"]');
      if (bp){ bp.hidden = imcBas; bp.disabled = imcBas; }
      if (imcBas && D.objectif === "perte") D.objectif = "maintien";
      const fi = $("calc-imc"); if (fi){ fi.hidden = !imcBas; fi.textContent = imcBas ? trad(DECOUVERTE.resultat.imc_bas) : ""; }
      $$("#objs button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.k === D.objectif)));
      $("obj-name").textContent = trad({ perte:"perte de poids", maintien:"maintien", prise:"prise de masse" }[D.objectif]);

      /* garde-fou 18 ans */
      if (ageJuge && self.mineur(D)){
        retirer(); vider();
        dire(trad("Le calculateur est réservé aux adultes ({n} ans et plus) : rien n'est enregistré.", { n: B.age[0] }) + (retire ? " " + trad("Ce que tu avais enregistré ici a été retiré.") : ""));
        return;
      }
      const manque = ["sexe", "age", "taille", "poids", "pas", "heures"].filter(k => k === "sexe" ? !D.sexe : D[k] == null || (k === "age" && self.mineur(D)));
      if (manque.length){ vider(); dire(trad(DECOUVERTE.questionnaire.manque, { l: manque.map(lib).join(", ") })); return; }
      const hors = ["age", "taille", "poids", "pas", "heures"].filter(k => D[k] < B[k][0] || D[k] > B[k][1]);
      if (hors.length){ vider(); dire(trad(DECOUVERTE.questionnaire.verifie, { l: hors.map(k => lib(k) + " (" + trad("{a} à {b}", { a: fmt(B[k][0]), b: fmt(B[k][1]) }) + ")").join(", ") })); return; }
      dire("");

      const Bm = self.metabolismeDeBase(D);
      const F = self.facteurActivite(D);
      const T = Bm * F.total;
      const cibles = { perte: T*(1-c.deficit_perte), maintien: T, prise: T*(1+c.surplus_prise) };
      $("tdee").textContent = fmt(T);
      $("v-perte").textContent = imcBas ? "—" : fmt(cibles.perte);
      $("v-maintien").textContent = fmt(cibles.maintien);
      $("v-prise").textContent = fmt(cibles.prise);
      const m = self.macros(cibles[D.objectif], D.poids);
      const flag = $("flag");
      if (m.glucBrut < c.seuil_alerte_glucides){
        flag.hidden = false;
        flag.textContent = trad("À ce niveau de calories, il ne reste presque plus de place pour les glucides. Baisse les protéines à 2 g/kg ou revois ton objectif à la hausse — s'entraîner dur sans glucides ne tient pas dans la durée.");
      } else flag.hidden = true;
      const kp = m.prot*4, kl = m.lip*9, kg = m.gluc*4, tot = kp+kl+kg || 1, kc = trad("kcal");
      $("g-prot").textContent = fmt(m.prot);  $("g-lip").textContent = fmt(m.lip);  $("g-gluc").textContent = fmt(m.gluc);
      $("s-prot").textContent = `${fmt(kp)} ${kc} · ${Math.round(kp/tot*100)}%`;
      $("s-lip").textContent  = `${fmt(kl)} ${kc} · ${Math.round(kl/tot*100)}%`;
      $("s-gluc").textContent = `${fmt(kg)} ${kc} · ${Math.round(kg/tot*100)}%`;
      $("b-prot").style.width = (kp/tot*100)+"%";
      $("b-lip").style.width  = (kl/tot*100)+"%";
      $("b-gluc").style.width = (kg/tot*100)+"%";
      const d2 = v => v.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), d1 = v => Number(v).toLocaleString(locale());
      const signe = D.sexe === "H" ? "+ 5" : "− 161";
      $("f-bmr").textContent  = `(10 × ${d1(D.poids)}) + (${d1(6.25)} × ${d1(D.taille)}) − (5 × ${d1(D.age)}) ${signe} = ${fmt(Bm)} ${kc}`;
      $("f-fact").textContent = `${d1(c.facteur_base)} + ${d2(F.parPas)} ${trad("(pas)")} + ${d2(F.parHeures)} ${trad("(entraînement)")} = ${d2(F.total)}`;
      $("f-tdee").textContent = `${fmt(Bm)} × ${d2(F.total)} = ${fmt(T)} ${trad("kcal / jour")}`;
      sauver();
      $("calc-ok").hidden = forme(D) === dernier;
    };

    ["age","taille","poids","pas","heures"].forEach(k => {
      const e = $(k); e.value = D[k] == null ? "" : D[k];
      e.addEventListener("input", () => {
        D[k] = self.nombre(e.value); touche = true;
        /* l'age est juge a la sortie du champ, ou des qu'il a deux chiffres (« 35 » passe par « 3 ») */
        if (k === "age") ageJuge = String(e.value).replace(/\D/g, "").length >= 2;
        rendre();
      });
      if (k === "age") e.addEventListener("change", () => { ageJuge = true; rendre(); });
    });
    $$("#sexe button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.v === D.sexe));
      b.addEventListener("click", () => {
        D.sexe = b.dataset.v; touche = true;
        $$("#sexe button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === D.sexe)));
        rendre();
      });
    });
    $$("#objs button").forEach(b => {
      b.addEventListener("click", () => {
        if (b.disabled) return;
        D.objectif = b.dataset.k; touche = true;
        rendre();
      });
    });
    /* des chiffres deja connus (questionnaire, calcul du coach) : rien ne part avant qu'il les confirme */
    $("calc-ok").addEventListener("click", () => { touche = true; rendre(); });
    rendre();
  },

  async init(){
    if (this.perso()) return this.initPerso();   // v52 : le prospect (v53 : et le client), sur calc_perso (le coach : plus bas, inchange)
    const c = CONFIG.calcul;
    /* Le calculateur partait sur 80 kg / 25 ans / 178 cm et enregistrait ces
       valeurs des l'ouverture. La diete d'un client de 72 kg etait alors
       calculee sur 80 kg. On part donc de son questionnaire, et on n'ecrit
       rien tant qu'il n'a rien touche. */
    const intake = Store.cache["intake"] || await Store.lire("intake", {});
    const depart = this.departDepuis(intake);
    const D = await Store.lire(this.cle, depart);
    const self = this;
    let touche = false;
    const sauver = () => { if (touche) Store.ecrire(self.cle, D); };

    const rendre = () => {
      const B = self.metabolismeDeBase(D);
      const F = self.facteurActivite(D);
      const T = B * F.total;
      const cibles = { perte: T*(1-c.deficit_perte), maintien: T, prise: T*(1+c.surplus_prise) };

      $("tdee").textContent = fmt(T);
      $("v-perte").textContent = fmt(cibles.perte);
      $("v-maintien").textContent = fmt(cibles.maintien);
      $("v-prise").textContent = fmt(cibles.prise);

      const kc = cibles[D.objectif];
      const m = self.macros(kc, D.poids);
      const flag = $("flag");
      if (m.glucBrut < c.seuil_alerte_glucides){
        flag.hidden = false;
        flag.textContent = "À ce niveau de calories, il ne reste presque plus de place pour les glucides. Baisse les protéines à 2 g/kg ou revois ton objectif à la hausse — s'entraîner dur sans glucides ne tient pas dans la durée.";
      } else flag.hidden = true;

      const kp = m.prot*4, kl = m.lip*9, kg = m.gluc*4, tot = kp+kl+kg || 1;
      $("g-prot").textContent = fmt(m.prot);  $("g-lip").textContent = fmt(m.lip);  $("g-gluc").textContent = fmt(m.gluc);
      $("s-prot").textContent = `${fmt(kp)} kcal · ${Math.round(kp/tot*100)}%`;
      $("s-lip").textContent  = `${fmt(kl)} kcal · ${Math.round(kl/tot*100)}%`;
      $("s-gluc").textContent = `${fmt(kg)} kcal · ${Math.round(kg/tot*100)}%`;
      $("b-prot").style.width = (kp/tot*100)+"%";
      $("b-lip").style.width  = (kl/tot*100)+"%";
      $("b-gluc").style.width = (kg/tot*100)+"%";
      $("obj-name").textContent = { perte:"perte de poids", maintien:"maintien", prise:"prise de masse" }[D.objectif];

      const signe = D.sexe === "H" ? "+ 5" : "− 161";
      $("f-bmr").textContent  = `(10 × ${D.poids}) + (6,25 × ${D.taille}) − (5 × ${D.age}) ${signe} = ${fmt(B)} kcal`;
      $("f-fact").textContent = `${String(c.facteur_base).replace(".",",")} + ${F.parPas.toFixed(2).replace(".",",")} (pas) + ${F.parHeures.toFixed(2).replace(".",",")} (entraînement) = ${F.total.toFixed(2).replace(".",",")}`;
      $("f-tdee").textContent = `${fmt(B)} × ${F.total.toFixed(2).replace(".",",")} = ${fmt(T)} kcal / jour`;
      sauver();
    };

    ["age","taille","poids","pas","heures"].forEach(k => {
      const e = $(k); e.value = D[k];
      e.addEventListener("input", () => { const v = parseFloat(e.value); if (isFinite(v)) D[k] = v; touche = true; rendre(); });
    });
    $$("#sexe button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.v === D.sexe));
      b.addEventListener("click", () => {
        D.sexe = b.dataset.v; touche = true;
        $$("#sexe button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === D.sexe)));
        rendre();
      });
    });
    $$("#objs button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.k === D.objectif));
      b.addEventListener("click", () => {
        D.objectif = b.dataset.k; touche = true;
        $$("#objs button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.k === D.objectif)));
        rendre();
      });
    });
    rendre();
  }
};

