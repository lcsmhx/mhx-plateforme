/* ------------------------------------------------------------------
   OUTIL — Mon profil (questionnaire de depart)
   Rempli par le client a sa premiere connexion, consultable par le coach.
   Pour ajouter/retirer une question : modifier QUESTIONS ci-dessous.
   ------------------------------------------------------------------ */
const QUESTIONS = [
  { section:"1 · Identité & logistique" },
  { id:"nom",        label:"Prénom et nom", type:"texte", requis:true },
  { id:"age",        label:"Âge", type:"nombre", requis:true },
  { id:"sexe",       label:"Sexe", type:"select", requis:true, options:["Homme","Femme"],
    aide:"Demandé uniquement pour le calcul du métabolisme de base : la formule de référence donne un résultat différent d'environ 160 kcal par jour." },
  { id:"ville",      label:"Ville / Pays", type:"texte" },
  { id:"fuseau",     label:"Fuseau horaire", type:"texte" },
  { id:"email",      label:"Email", type:"texte" },
  /* v73 (C) : plus posée (décision de Lucas du 04/10/2026 : le numéro est demandé à tous depuis la v72, clé contact). Une
     réponse déjà donnée reste dans intake (jamais effacée : le champ absent n'est pas réécrit) et se lit dans la fiche, côté coach. */
  { id:"whatsapp",   label:"Numéro WhatsApp (avec indicatif)", type:"texte", retiree:true },
  { id:"metier",     label:"Ton métier et ton rythme de travail", type:"long",
    aide:"Horaires, déplacements, poste sédentaire ou physique." },
  { id:"taille",     label:"Taille (cm)", type:"nombre", requis:true },
  { id:"poids",      label:"Poids actuel (kg)", type:"nombre", requis:true },
  { id:"poids_obj",  label:"Poids objectif (kg)", type:"nombre" },
  { soustitre:"Mensurations du jour (cm)", aide:"Le matin à jeun, mètre bien à plat, sans serrer." },
  { id:"m_taille",   label:"Taille", type:"nombre" },
  { id:"m_hanches",  label:"Hanches", type:"nombre" },
  { id:"m_cuisse",   label:"Cuisse", type:"nombre" },
  { id:"m_bras",     label:"Bras", type:"nombre" },
  { id:"m_poitrine", label:"Poitrine", type:"nombre" },
  { id:"photos",     label:"Photos de départ envoyées ?", type:"select", options:["Pas encore","Oui, envoyées"],
    aide:"À envoyer par WhatsApp : face, profil, dos — tenue ajustée, même lumière, même endroit. Elles servent uniquement au suivi et ne sont jamais publiées sans ton accord écrit." },

  { section:"2 · Ton objectif" },
  { id:"objectif",   label:"Quel est ton objectif principal ?", type:"select", requis:true,
    options:["Perte de poids / sèche","Prise de muscle","Recomposition (perdre du gras + prendre du muscle)","Performance / condition physique","Santé & énergie au quotidien"] },
  { id:"objectif_phrase", label:"Décris ton objectif en une phrase, avec un chiffre si possible", type:"long",
    aide:"Ex : perdre 8 kg d'ici décembre, tenir 10 tractions, retrouver de l'énergie l'après-midi." },
  { id:"echeance",   label:"Y a-t-il une échéance précise ?", type:"texte",
    aide:"Vacances, mariage, compétition, shooting." },
  { id:"pourquoi",   label:"Pourquoi maintenant ? Qu'est-ce qui a déclenché ta décision ?", type:"long" },
  { id:"pret",       label:"À quel point es-tu prêt à changer tes habitudes ?", type:"echelle",
    aide:"1 = très faible · 10 = maximum" },
  { id:"echecs",     label:"Qu'est-ce qui t'a fait échouer par le passé, selon toi ?", type:"long" },

  { section:"3 · Santé & antécédents" },
  { id:"blessures",  label:"Blessures actuelles ou passées", type:"long",
    aide:"Dos, genoux, épaules, hernies, opérations… précise l'année et l'état actuel." },
  { id:"pathologies",label:"Problèmes de santé, pathologies ou traitements médicaux en cours", type:"long" },
  { id:"suivi_pro",  label:"Es-tu suivi actuellement par un professionnel de santé ?", type:"long",
    aide:"Médecin, kiné, nutritionniste, psychologue…" },
  { id:"contre_ind", label:"As-tu une contre-indication médicale au sport ou à un changement alimentaire ?", type:"select",
    options:["Non","Oui"] },
  { id:"contre_ind_detail", label:"Si oui, précise", type:"long" },
  { id:"douleurs",   label:"Douleurs ou limitations sur certains mouvements", type:"long",
    aide:"Squat, développé, tractions, course, amplitude d'épaule…" },
  { id:"cycle",      label:"Pour les femmes : cycle régulier ? Grossesse, post-partum ou contraception à prendre en compte ?", type:"long" },
  { id:"rapport_nourriture", label:"Y a-t-il un antécédent de trouble du comportement alimentaire, ou une relation compliquée avec la nourriture, dont je dois tenir compte ?", type:"long",
    aide:"Facultatif, et aucune obligation de détailler. Cela me permet simplement d'adapter mon approche et, si besoin, de t'orienter vers un professionnel de santé." },

  { section:"4 · Pratique sportive" },
  { id:"niveau",     label:"Quel est ton niveau ?", type:"select", requis:true,
    options:["Débutant (0 à 6 mois)","Intermédiaire (6 mois à 2 ans)","Avancé (2 ans et +)"] },
  { id:"activite",   label:"Que fais-tu comme activité physique actuellement ?", type:"long",
    aide:"Type, fréquence, depuis quand." },
  { id:"lieu",       label:"Où vas-tu t'entraîner ?", type:"select", requis:true,
    options:["Salle complète","Salle basique","À la maison","Extérieur"] },
  { id:"materiel",   label:"Si à la maison : quel matériel as-tu ?", type:"long" },
  { id:"seances",    label:"Combien de séances par semaine peux-tu RÉELLEMENT tenir ?", type:"select", requis:true,
    options:["2","3","4","5","6"],
    aide:"Sois réaliste : mieux vaut 3 séances tenues que 5 prévues et 2 faites." },
  { id:"duree",      label:"Durée maximum par séance", type:"select", options:["30 min","45 min","60 min","90 min"] },
  { id:"creneaux",   label:"Quels jours et à quel moment de la journée ?", type:"long" },
  { id:"gouts",      label:"Exercices ou types de séances que tu détestes / que tu adores", type:"long" },
  { id:"cardio",     label:"Fais-tu du cardio ? Lequel, combien de fois par semaine ?", type:"long" },
  { id:"pas",        label:"Nombre de pas moyen par jour (si tu le suis)", type:"nombre" },

  { section:"5 · Alimentation" },
  { id:"journee_type", label:"Décris une journée type de repas", type:"long", requis:true, grand:true,
    aide:"Petit-déjeuner, déjeuner, dîner, collations, boissons — avec les quantités approximatives. C'est la question la plus importante du questionnaire : prends 5 minutes dessus." },
  { id:"nb_repas", label:"Combien de repas par jour ?", type:"select", requis:true,
    options:["2 repas","3 repas","4 repas (3 + une collation)","5 repas (3 + deux collations)","6 repas (3 + trois collations)"],
    aide:"C'est sur cette réponse que ton plan alimentaire sera bâti. Compte les collations comme des repas." },
  { id:"repas_horaires", label:"À quels horaires ?", type:"long" },
  { id:"cuisine",    label:"Qui cuisine ? Combien de temps peux-tu y consacrer par jour ?", type:"long" },
  { id:"exterieur",  label:"Combien de fois par semaine manges-tu à l'extérieur ou au restaurant ?", type:"texte" },
  { id:"regime_type", label:"Ton régime alimentaire", type:"select", requis:true,
    options: CONFIG.nutrition.regimes,
    aide:"Sert à composer tes repas : aucun plat proposé ne sortira de ce cadre." },
  { id:"allergenes", label:"Allergies et intolérances", type:"multi",
    options: CONFIG.nutrition.allergenes.map(a => a.nom),
    grand: true,
    aide:"Coche tout ce qui te concerne. Les aliments correspondants seront écartés de tes repas. Signale aussi toute allergie qui ne figure pas dans cette liste dans le champ suivant." },
  { id:"allergies",  label:"Autres allergies, intolérances ou interdits alimentaires", type:"long",
    aide:"Tout ce que la liste ci-dessus ne couvre pas. Ton coach en tient compte avant de valider tes repas." },
  { id:"jamais",     label:"Aliments que tu ne mangeras jamais, quoi qu'il arrive", type:"long" },
  { id:"indispensable", label:"Aliments dont tu ne veux surtout pas te passer", type:"long" },
  { id:"grignotage", label:"Grignotage : quand et pourquoi ?", type:"long",
    aide:"Ennui, stress, fatigue, soir devant un écran, après le travail…" },
  { id:"alcool",     label:"Alcool : fréquence et quantité", type:"texte" },
  { id:"eau",        label:"Eau par jour (L)", type:"nombre" },
  { id:"cafes",      label:"Cafés par jour", type:"nombre" },
  { id:"sodas",      label:"Sodas, jus par jour", type:"nombre" },
  { id:"complements",label:"Compléments alimentaires actuels", type:"long",
    aide:"Protéine, créatine, vitamines, oméga 3…" },
  { id:"regimes",    label:"As-tu déjà suivi un régime ou compté tes calories ? Avec quel résultat ?", type:"long" },
  { id:"budget",     label:"As-tu des contraintes de budget alimentaire ?", type:"long" },

  { section:"6 · Mode de vie" },
  { id:"sommeil_h",  label:"Heures de sommeil / nuit", type:"nombre" },
  { id:"coucher",    label:"Heure de coucher", type:"texte" },
  { id:"lever",      label:"Heure de lever", type:"texte" },
  { id:"qualite_sommeil", label:"Qualité de ton sommeil", type:"echelle", aide:"1 = très faible · 10 = maximum" },
  { id:"stress",     label:"Niveau de stress au quotidien", type:"echelle", aide:"1 = très faible · 10 = maximum" },
  { id:"stress_src", label:"Source principale de ce stress", type:"texte" },
  { id:"energie",    label:"Niveau d'énergie dans la journée", type:"echelle", aide:"1 = très faible · 10 = maximum" },
  { id:"coup_barre", label:"À quel moment de la journée as-tu tes coups de barre ?", type:"texte" },
  { id:"famille",    label:"Situation familiale et contraintes horaires", type:"long",
    aide:"Enfants, vie de couple, horaires imposés…" },
  { id:"entourage",  label:"Ton entourage va-t-il soutenir ta démarche ou la compliquer ?", type:"long" },
  { id:"fume",       label:"Fumes-tu ?", type:"select", options:["Non","Occasionnellement","Oui, quotidiennement"] }
];

const outilProfil = {
  id: "profil",
  cle: "intake",
  nom: "Profil",
  icone: "📝",
  titre: "Ton profil",
  /* v44 : un prospect n'a que son compte ici (le questionnaire complet arrive avec l'accompagnement) */
  get accroche(){ return (Auth.estProspect() && !Store.idConsulte) ? "Ton compte et tes réglages." : "Plus tes réponses sont précises, plus ton programme sera adapté. Ne cherche pas la bonne réponse : cherche la vraie. Compte 10 à 15 minutes."; },

  /* v71 (C) : en consultation (Store.idConsulte), chaque reponse est rendue en texte, pas en champ desactive :
     le coach lit une reponse longue en entier. Vide, ou valeur piegee (objet, liste) : « — ». esc() obligatoire ;
     data-q garde (les suites s'en servent), data-notr : la reponse du client n'est jamais traduite. */
  lecture(q, v){
    if (v == null || typeof v === "object") return "—";
    let s = String(v).trim();
    if (q.type === "multi") s = s.split("|").filter(Boolean).join(", ");
    return s || "—";
  },
  lectureHTML(q, v){
    return `<p class="checkin-rep q-lecture" id="q-${q.id}" data-q="${q.id}" data-lecture="1"><span data-notr>${esc(this.lecture(q, v))}</span></p>`;
  },

  champ(q, valeur){
    const v = valeur == null ? "" : valeur;
    if (q.type === "echelle"){
      let o = '<option value="">—</option>';
      for (let n = 1; n <= 10; n++) o += `<option value="${n}"${String(v) === String(n) ? " selected" : ""}>${n}</option>`;
      return `<select id="q-${q.id}" data-q="${q.id}">${o}</select>`;
    }
    if (q.type === "select"){
      return `<select id="q-${q.id}" data-q="${q.id}">
        <option value=""${v === "" ? " selected" : ""}>— choisis —</option>
        ${q.options.map(o => `<option value="${esc(o)}"${v === o ? " selected" : ""}>${esc(o)}</option>`).join("")}
      </select>`;
    }
    if (q.type === "multi"){
      const choisis = String(v || "").split("|").filter(Boolean);
      return `<div class="coches" id="q-${q.id}" data-q="${q.id}" data-multi="1">` +
        q.options.map(o => `<label class="coche"><input type="checkbox" value="${esc(o)}"${choisis.indexOf(o) > -1 ? " checked" : ""}> ${esc(o)}</label>`).join("") +
        `</div>`;
    }
    if (q.type === "long")   return `<textarea id="q-${q.id}" data-q="${q.id}" rows="${q.grand ? 6 : 2}">${esc(v)}</textarea>`;
    if (q.type === "nombre") return `<input id="q-${q.id}" data-q="${q.id}" type="number" step="0.1" value="${esc(v)}">`;
    if (q.type === "date")   return `<input id="q-${q.id}" data-q="${q.id}" type="date" value="${esc(v)}">`;
    return `<input id="q-${q.id}" data-q="${q.id}" type="text" value="${esc(v)}">`;
  },

  html(){
    /* prospect : pas de questionnaire complet (il s'ouvrira avec l'accompagnement,
       pre-rempli par ses reponses du questionnaire court) ; son compte et ses donnees seulement */
    if (Auth.estProspect() && !Store.idConsulte){
      /* v52 : ses reponses (les 3 questions, puis celles de l'ancien questionnaire qui ont une valeur) : brancherReponses */
      return `<section class="panel" id="mc-questionnaire"><h2>${esc(trad("Ton questionnaire"))}</h2>
        <p class="note" style="margin:0">${esc(trad(DECOUVERTE.profil.texte))}</p>
        <div id="mc-reponses"></div>
        <div class="actions" id="mc-reponses-lien"><a class="btn ghost petit" href="#/decouverte">${esc(trad(DECOUVERTE.profil.lien))}</a></div></section>` + this.compteHTML();
    }
    const D = Store.cache["intake"] || {};
    let corps = "", ouverte = false;
    QUESTIONS.forEach(q => {
      if (q.retiree && !Store.idConsulte) return;   // v73 (C) : question retirée, lue seulement en consultation
      if (q.section){
        if (ouverte) corps += `</div></section>`;
        corps += `<section class="panel"><h2>${esc(q.section)}</h2><div class="grid g2">`;
        ouverte = true;
        return;
      }
      if (q.soustitre){
        corps += `<div style="grid-column:1/-1"><h3 style="margin-top:8px">${esc(q.soustitre)}</h3>${q.aide ? `<p class="note" style="margin:-4px 0 0">${esc(q.aide)}</p>` : ""}</div>`;
        return;
      }
      const large = (q.type === "long" || q.grand) ? ' style="grid-column:1/-1"' : "";
      corps += `<div${large}>
        <label for="q-${q.id}">${esc(q.label)}${q.requis ? " *" : ""}</label>
        ${q.aide ? `<p class="note" style="margin:-2px 0 8px">${esc(q.aide)}</p>` : ""}
        ${Store.idConsulte ? this.lectureHTML(q, D[q.id]) : this.champ(q, D[q.id])}</div>`;
    });
    if (ouverte) corps += `</div></section>`;
    /* v71 (C) : en consultation, pas de bouton « Enregistrer mon profil » (rien n'est modifiable) */
    return corps + (Store.idConsulte ? "" : `
    <section class="panel">
      <div class="actions">
        <button class="btn" id="p-save">Enregistrer mon profil</button>
        <span class="msg" id="p-msg"></span>
      </div>
      <p class="note" style="margin-top:10px">Les questions marquées d'une étoile sont indispensables. Tu peux revenir modifier tes réponses à tout moment.</p>
    </section>`) + this.compteHTML();
  },

  /* Le compte n'appartient qu'a son proprietaire : quand le coach consulte la
     fiche d'un client, ce bloc n'existe pas. Il ne change pas le mot de passe
     de quelqu'un d'autre depuis ici. */
  compteHTML(){
    if (Store.idConsulte) return "";
    const u = Auth.utilisateur();
    /* v50 : un prospect peut relire a tout moment les conditions acceptees a l'inscription */
    const conditions = Auth.estProspect() ? `<p class="note" style="margin:0 0 14px"><button type="button" class="lien-bouton" id="mc-conditions">${esc(trad(DECOUVERTE.confidentialite.titre))}</button></p>` : "";
    /* v51 : emails (prospect) ; l'etat reel est lu dans brancherCompte (cle « emails », sinon l'accord de l'inscription). v52 : la newsletter */
    const E = DECOUVERTE.emails;
    const emails = Auth.estProspect() ? `<section class="panel" id="mc-emails-bloc"><h2>${esc(trad(E.titre))}</h2>
        <label class="switch"><input type="checkbox" id="mc-emails" disabled><span class="piste" aria-hidden="true"></span><span>${esc(trad(E.libelle))}</span></label>
        <p class="note" style="margin:10px 0 0">${esc(trad(E.note))}</p><span class="msg" id="mc-emails-msg" role="status" aria-live="polite"></span></section>` : "";
    return `${emails}
    <section class="panel">${conditions}
      <h2>Mon compte</h2>
      <p class="note" style="margin:0 0 18px">Adresse actuelle : <b>${esc((u && u.email) || "—")}</b>. C'est avec elle que tu te connectes.</p>
${Auth.estCoach() ? "" : `<div id="mc-tel-bloc" style="margin:0 0 26px">
      <h3 style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:14px;font-weight:500;color:var(--ink-2);margin:0 0 12px">Mon numéro</h3>
      <p class="note" style="margin:0 0 10px" id="mc-tel-ligne">Numéro actuel : <b id="mc-tel-actuel" data-notr>…</b></p>
      <div class="champ"><label for="mc-tel">Ton numéro (WhatsApp)</label>${Telephone.champHTML("mc-tel")}</div>
      <div class="actions"><button class="btn ghost" id="mc-tel-ok" disabled>Enregistrer mon numéro</button><span class="msg" id="mc-tel-msg" role="status" aria-live="polite"></span></div>
      </div>`}
      <h3 style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:14px;font-weight:500;color:var(--ink-2);margin:0 0 12px">Changer mon mot de passe</h3>
      <div class="grid g2">
        <div><label for="mc-actuel">Mot de passe actuel</label><input id="mc-actuel" type="password" autocomplete="current-password"></div>
        <div><label for="mc-nouveau">Nouveau mot de passe</label><input id="mc-nouveau" type="password" autocomplete="new-password"></div>
        <div><label for="mc-nouveau2">Confirme le nouveau</label><input id="mc-nouveau2" type="password" autocomplete="new-password"></div>
      </div>
      <div class="actions"><button class="btn ghost" id="mc-mdp">Changer mon mot de passe</button><span class="msg" id="mc-mdp-msg"></span></div>

      <h3 style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:14px;font-weight:500;color:var(--ink-2);margin:26px 0 12px">Changer mon adresse email</h3>
      ${ecrisNous("Pour changer ton adresse email, écris-nous à {e}, on s'en occupe rapidement.", "mc-email-aide", "note")}

      <h3 style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:14px;font-weight:500;color:var(--ink-2);margin:26px 0 12px">Partager l'app</h3>
      <p class="note" style="margin:0 0 12px">Envoie le lien de l'app à un proche : l'espace gratuit est ouvert à tout le monde.</p>
      <div class="actions" style="margin-top:0"><button type="button" class="btn ghost" id="mc-partager">Partager l'app</button></div>
    </section>`;
  },

  /* lit la valeur d'un champ ; les cases a cocher sont stockees "A|B|C" */
  valeur(q){
    const el = $("q-" + q.id); if (!el) return "";
    if (q.type === "multi") return $$("input:checked", el).map(c => c.value).join("|");
    return el.value;
  },
  poser(q, v){
    const el = $("q-" + q.id); if (!el || v == null) return;
    if (el.dataset.lecture){ const s = el.querySelector("[data-notr]"); if (s) s.textContent = this.lecture(q, v); return; }   // v71 (C) : texte de la consultation
    if (q.type === "multi"){
      const choisis = String(v).split("|");
      $$("input", el).forEach(c => { c.checked = choisis.indexOf(c.value) > -1; });
      return;
    }
    if (el.value !== v) el.value = v;
  },

  /* v52 : le prospect relit ses reponses au questionnaire court (lecture seule ; lecture ratee : rien d'affiche, le lien
     reste) et, une fois valide, « Modifier mes réponses » (#/decouverte/reponses) */
  async brancherReponses(){
    const boite = $("mc-reponses"), lien = $("mc-reponses-lien"); if (!boite) return;
    let I = null; try { I = await Store.lire("intake", {}); } catch(e){ I = null; }
    if (!boite.isConnected || !I || typeof I !== "object" || Store.nonLus.has(I)) return;
    const rep = Decouverte.reponses(I, false, true);   // v60 : ses reponses a choix dans sa langue
    boite.innerHTML = rep.length ? `<ul class="ingr fiche-l" style="margin-top:12px">${rep.map(x => `<li><span>${esc(trad(x.q.label))}</span><b>${esc(x.v)}</b></li>`).join("")}</ul>` : "";
    if (lien && Decouverte.questionnaireFait(I)) lien.innerHTML = `<a class="btn ghost petit" href="#/decouverte/reponses">${esc(trad(DECOUVERTE.resultat.modifier))}</a>`;
  },

  async init(){
    /* v44 — prospect : seul le bloc « Mon compte » est a brancher */
    if (Auth.estProspect() && !Store.idConsulte){ this.brancherReponses(); this.brancherCompte(); return; }
    const D = await Store.lire(this.cle, {});
    /* Une question ajoutee apres coup laisse les anciens profils incomplets
       sans que personne ne s'en apercoive : on remet le drapeau a jour. */
    if (D.complet && QUESTIONS.some(q => q.requis && !D[q.id])) D.complet = false;

    /* si le cache etait vide au moment du rendu, on re-remplit les champs */
    QUESTIONS.forEach(q => { if (q.id) this.poser(q, D[q.id]); });
    if (Store.idConsulte) return;   // v71 (C) : consultation : rien a brancher (ni champs, ni #p-save, ni compte)

    const enregistrer = () => {
      QUESTIONS.forEach(q => { if (!q.id) return; const el = $("q-" + q.id); if (el) D[q.id] = this.valeur(q); });
      const manquants = QUESTIONS.filter(q => q.requis && !D[q.id]);
      D.complet = manquants.length === 0;
      if (Store.ecrire(this.cle, D) === false) return null;   // refusee (message deja affiche)
      return manquants;
    };

    $$("[data-q]").forEach(el => {
      el.addEventListener("change", () => enregistrer());
      /* v48 : les textes partent pendant la frappe (fermer l'app sans quitter le champ les perdait) */
      if (el.matches("textarea, input:not([type=checkbox]):not([type=radio])")) el.addEventListener("input", () => enregistrer());
    });
    $$('[data-multi="1"] input').forEach(c => c.addEventListener("change", () => enregistrer()));

    $("p-save").addEventListener("click", () => {
      const manquants = enregistrer();
      if (manquants === null) return;
      if (manquants.length){
        flash("p-msg", "Il manque : " + manquants.map(q => q.label).join(", "));
        const premier = $("q-" + manquants[0].id);
        if (premier){ premier.scrollIntoView({ behavior:"smooth", block:"center" }); premier.focus(); }
        manquants.forEach(q => { const e = $("q-" + q.id); if (e) e.classList.add("manque"); });
        return;
      }
      $$(".manque").forEach(e => e.classList.remove("manque"));
      flash("p-msg", "Profil enregistré. Ton coach le voit de son côté.");
      if (premiereFois){ premiereFois = false; setTimeout(() => { location.hash = estVerrouille(outilMensurations) ? "#/accueil" : "#/mensurations"; }, 900); }
    });

    this.brancherCompte();
  },

  /* v51 : l'accord pour les emails — la cle « emails » l'emporte sur la case de l'inscription.
     v52 : l'interrupteur pilote la NEWSLETTER : emails.newsletter (booleen) sinon la case de l'inscription
     (user_metadata.newsletter) ; l'ancien accord « emails de suivi » (emails.suivi, emails_suivi) ne coche jamais la
     newsletter. Chaque changement ecrit { newsletter, maj, version, source: "profil" } (les autres champs sont gardes) ;
     un « non » met aussi suivi a false (l'ancienne fonction d'envoi lit encore ce champ : un refus vaut pour tout). */
  async brancherEmails(){
    const c = $("mc-emails"); if (!c || !Auth.estProspect() || Store.idConsulte) return;
    const E = DECOUVERTE.emails, msg = $("mc-emails-msg");
    let d = null; try { d = await Store.lire("emails", {}); } catch(e){ d = null; }
    if (!c.isConnected) return;
    if (!d || Store.nonLus.has(d)){ if (msg) msg.textContent = trad(E.refuse); return; }   // lecture ratee : l'interrupteur reste ferme
    c.checked = typeof d.newsletter === "boolean" ? d.newsletter : Accords.newsletterInscription() === true;
    c.disabled = false;
    c.addEventListener("change", () => {
      const oui = c.checked;
      const choix = { newsletter: oui, maj: new Date().toISOString(), version: DECOUVERTE.accords.newsletter_profil, source: "profil" };
      if (!oui) choix.suivi = false;
      const ok = Store.ecrire("emails", Object.assign({}, d, choix));
      if (ok === false){ c.checked = !oui; if (msg) msg.textContent = trad(E.refuse); return; }
      Object.assign(d, choix);
      if (msg) msg.textContent = trad(oui ? E.oui : E.non);
    });
  },
  /* v72 (A) : « Mon numéro » (client et prospect) : la clé contact lue ; lecture ratée : un mot, le bouton reste inactif.
     Enregistrer relit la ligne puis l'écrit (Contact.enregistrer : ref et date d'inscription gardées). */
  async brancherTelephone(){
    const b = $("mc-tel-ok"), val = $("mc-tel-actuel"), msg = $("mc-tel-msg");
    if (!b || Auth.estCoach() || Store.idConsulte) return;
    const dire = t => { if (msg) msg.textContent = typoFr(trad(t)); };
    let C = null; try { C = await Store.lire(Contact.cle, {}); } catch(e){ C = null; }
    if (!b.isConnected) return;
    if (!C || Store.nonLus.has(C)){ if (val) val.textContent = "—"; dire("Ton numéro n'a pas pu être chargé. Recharge la page."); return; }
    let actuel = Contact.telephone(C);
    /* force : après un enregistrement ; sinon le champ n'est rempli que s'il est vide (une saisie faite pendant la lecture reste) */
    const montrer = force => {
      if (val){ if (actuel){ val.textContent = actuel; val.setAttribute("data-notr", ""); } else { val.textContent = trad("Aucun numéro enregistré."); val.removeAttribute("data-notr"); } }
      const d = Telephone.decouper(actuel), i = $("mc-tel-ind"), c = $("mc-tel");
      if (c && (force || !c.value.trim())){ if (i) i.value = d.ind; c.value = d.num; }
    };
    montrer();
    b.disabled = false;
    b.addEventListener("click", async () => {
      if (b.disabled) return;
      const T = Telephone.lire("mc-tel");
      if (T.erreur){ dire(T.erreur); return; }
      if (T.tel === actuel){ dire("C'est déjà ton numéro."); return; }
      b.disabled = true; dire("Un instant…");
      try {
        const apres = await Contact.enregistrer({ telephone: T.tel }); actuel = Contact.telephone(apres); montrer(true); dire("Numéro enregistré.");
        const u = Auth.utilisateur(); if (u && u.id) Contact.oublierAttente(u.id);   // v72 (A) : une copie de l'inscription ne repartira plus
      }
      catch(e){ dire(Auth.indispo(e) ? "Service momentanément indisponible, réessaie dans une minute." : "Non enregistré : réessaie dans un instant."); }
      b.disabled = false;
    });
  },
  brancherCompte(){
    this.brancherEmails();
    this.brancherTelephone();
    const bPart = $("mc-partager");
    if (bPart) bPart.addEventListener("click", () => partagerApp());   // v70
    const bCond = $("mc-conditions");
    if (bCond) bCond.addEventListener("click", () => UI.volet({ titre: trad(DECOUVERTE.confidentialite.titre), corps: (DECOUVERTE.confidentialite.paragraphes || []).map(p => `<p>${esc(trad(p))}</p>`).join("") }));
    const bMdp = $("mc-mdp");
    if (bMdp) bMdp.addEventListener("click", async () => {
      const actuel = $("mc-actuel").value, nouveau = $("mc-nouveau").value, nouveau2 = $("mc-nouveau2").value;
      if (!actuel || !nouveau)      return flash("mc-mdp-msg", "Remplis les trois champs.");
      if (nouveau.length < 6)       return flash("mc-mdp-msg", "Le nouveau mot de passe doit faire au moins 6 caractères.");
      if (nouveau !== nouveau2)     return flash("mc-mdp-msg", "Les deux nouveaux mots de passe ne sont pas identiques.");
      if (nouveau === actuel)       return flash("mc-mdp-msg", "Le nouveau mot de passe est le même que l'ancien.");
      bMdp.disabled = true; flash("mc-mdp-msg", "Un instant…");
      try {
        await Auth.changerMotDePasse(actuel, nouveau);
        $("mc-actuel").value = $("mc-nouveau").value = $("mc-nouveau2").value = "";
        flash("mc-mdp-msg", "Mot de passe changé. Utilise le nouveau à ta prochaine connexion.");
      } catch(e){ flash("mc-mdp-msg", e.message || "Changement impossible."); }
      bMdp.disabled = false;
    });

    /* v52 (décision de Lucas) : l'app n'envoie aucun email pour l'instant : le changement d'adresse passe par un email au
       coach (compteHTML) ; ce branchement ne sert plus tant que #mc-maj-email n'est pas affiché (gardé pour le jour où
       les emails du compte reviendront) */
    const bMail = $("mc-maj-email");
    if (bMail) bMail.addEventListener("click", async () => {
      const nouveau = ($("mc-email").value || "").trim();
      const u = Auth.utilisateur();
      if (!nouveau || nouveau.indexOf("@") < 1) return flash("mc-email-msg", "Indique une adresse valide.");
      if (u && nouveau.toLowerCase() === String(u.email || "").toLowerCase())
        return flash("mc-email-msg", "C'est déjà ton adresse actuelle.");
      bMail.disabled = true; flash("mc-email-msg", "Un instant…");
      try {
        await Auth.changerEmail(nouveau);
        /* v52 : avec « Secure email change » (Supabase), un lien part aussi sur l'adresse actuelle : il faut cliquer les deux */
        flash("mc-email-msg", trad("Un lien de confirmation part sur {e}, et par sécurité un autre sur ton adresse actuelle : clique les deux. Le changement est fait au dernier clic.", { e: nouveau }));
      } catch(e){
        /* v52 : erreurs d'envoi et de limite en francais, comme a l'inscription et pour le mot de passe oublie */
        const m = String((e && e.message) || "").toLowerCase(), T = DECOUVERTE.inscription;
        flash("mc-email-msg", /email rate limit/.test(m) ? trad(T.trop_emails_compte)
          : /error sending|sending .*email|smtp/.test(m) ? trad(T.envoi_rate, { p: CONFIG.marque.pseudo || "" })
          : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(T.trop_demandes)
          : (e && e.message) || trad("Changement impossible."));
      }
      bMail.disabled = false;
    });
  }
};

