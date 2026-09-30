/* ---------------------- DÉMARRAGE ---------------------- */
let premiereFois = false;
let appPrete = false;   // v48 : demarrage termine (une session refusee ensuite renvoie a la connexion, avec un mot)
let reconnexion = false;   // v57 : « Me reconnecter » (session perdue en cours d'utilisation) : la connexion garde la page ouverte
function sessionPerdue(){
  /* la page n'est PAS remplacee : un texte en cours (feedback, notes privees) reste a l'ecran et peut etre copie ;
     un bandeau propose de se reconnecter. Les saisies gardees sur l'appareil repartiront apres reconnexion. */
  if (!appPrete || $("session-perdue")) return;
  const d = document.createElement("div");
  d.id = "session-perdue"; d.className = "bandeau session-perdue"; d.setAttribute("role", "alert");
  d.innerHTML = `<span>${esc(trad("Ta session a pris fin (déconnexion depuis un autre appareil ?). Ce qui est à l'écran reste là : copie ton texte si besoin, puis reconnecte-toi. Ce que tu avais saisi avant est gardé sur cet appareil et repartira ; ce que tu saisis maintenant n'est plus enregistré."))}</span><button type="button" class="btn">${esc(trad("Me reconnecter"))}</button>`;
  document.body.appendChild(d);
  d.querySelector("button").addEventListener("click", () => {
    appPrete = false; reconnexion = true;
    window.removeEventListener("hashchange", routeDepuisAdresse);
    portail("connexion");
    setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = trad("Reconnecte-toi : ce que tu avais saisi est gardé sur cet appareil et repartira."); } }, 60);
  });
}
let lienEmail = null;   // v47 : "rate_connecte" apres un lien d'email (mot affiche une fois l'ecran construit) ; v66 : seule valeur restante

(async function demarrer(){
  /* v52 : l'app gere seule le defilement (afficher remonte en haut). Sans cela, apres « Se connecter » (rechargement),
     le navigateur remettait la page a la hauteur de l'ecran de connexion, et seulement a la fin du chargement (polices) :
     sur telephone, le Profil s'ouvrait deja defile, l'encadre « Bienvenue ! » cache sous l'en-tete. */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch(e){}
  /* v53 : le mode test « jour n » de la Decouverte est retire : son ancien drapeau, s'il est reste sur cet appareil, est
     ignore et efface */
  try { localStorage.removeItem("mhx_decouverte_jour"); } catch(e){}
  I18N.charger();   // en anglais, les textes de la Decouverte rejoignent le dictionnaire ici (Contenus.decouverte)
  Traduction.demarrer();
  ancrerManifeste();
  const p = lireAdresse();
  let premierLien = false, emailChange = false;   // v52 : changement d'adresse (premier lien / dernier lien)

  /* v66 (securite) : des jetons de connexion dans l'adresse (#access_token=…) n'ouvrent plus JAMAIS de session, ni ne
     menent a l'ecran « nouveau mot de passe ». Aucun parcours de l'app n'en envoie (« Mot de passe oublie » donne
     l'adresse du coach depuis la v52, « Confirm email » est coupe dans Supabase) ; un lien fabrique par un tiers avec
     SES jetons faisait entrer dans SON compte (saisies de sante chez lui, ou mot de passe choisi pose sur son compte).
     Les jetons sont retires de l'adresse sans etre lus ni envoyes nulle part ; « Ce lien n'est plus valable ». Le dernier
     lien d'un changement d'adresse (type=email_change) garde son mot : il n'a jamais ouvert de session. */
  if (p.access_token){
    try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}
    /* v52 : dernier lien d'un changement d'adresse : le changement est fait, on le dit */
    if (p.type === "email_change") emailChange = true;
    else lienEmail = "rate_connecte";
  }
  /* v47 — lien perime ou deja utilise : Supabase revient SANS jeton, avec #error=…&error_code=otp_expired&error_description=…
     (deuxieme clic sur l'email de confirmation, lien de plus de 24 h, lien « visite » par un filtre anti-spam).
     L'adresse est nettoyee d'abord (sinon chaque rechargement relit l'erreur : boucle), le texte anglais brut n'est
     jamais affiche, et une session deja ouverte sur l'appareil n'est pas touchee. */
  /* v52 — changement d'adresse avec « Secure email change » : le PREMIER des deux liens revient sans jeton, avec
     #message=Confirmation link accepted… : adresse nettoyee, et le mot en francais (le changement se fait au 2e clic) */
  if (p.message && !p.access_token && !p.error && !p.error_code){
    try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}
    premierLien = true;
  }
  if (p.error || p.error_code || p.error_description){
    try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}
    Auth.charger();
    if (Auth.connecte()) lienEmail = "rate_connecte";
    else {
      portail("connexion");
      setTimeout(() => { const e = $("co-err"); if (e){ e.className = "erreur"; e.textContent = trad(DECOUVERTE.inscription.lien_rate); } }, 60);
      return;
    }
  }

  Auth.charger();
  /* Les comptes sont crees par le coach. L'inscription libre (v39) n'existe que
     si CONFIG.marque.inscription_libre vaut true : #/inscription ouvre alors la
     creation de compte ; sinon, l'ecran de connexion comme n'importe quelle autre adresse. */
  if (!Auth.connecte()){
    portail(/inscription/.test(location.hash) ? "inscription" : "connexion");
    if (lienEmail) setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = trad(DECOUVERTE.inscription.lien_rate); } }, 60);
    else if (premierLien || emailChange) setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur ok"; z.textContent = trad(DECOUVERTE.inscription[emailChange ? "email_change" : "premier_lien"]); } }, 60);
    return;
  }
  const ok = await Auth.assurer();
  /* v48 : sessions partagees entre onglets, modifications gardees sur l'appareil */
  window.addEventListener("storage", e => Auth.depuisAutreOnglet(e));
  window.addEventListener("online", () => Store.reprendre());
  window.addEventListener("pagehide", () => Store.toutEnvoyer());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") Store.toutEnvoyer(); else Store.reprendre(); });
  document.addEventListener("click", e => { if (e.target && e.target.href && e.target.href.includes("calendly")) Tracking.enregistrer("call_cta_clicked"); }, true);
  if (!ok){
    portail("connexion");
    /* v47 : on arrivait par un lien d'email et la session enregistree ne se renouvelle plus : le dire */
    if (lienEmail) setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = trad(DECOUVERTE.inscription.lien_rate); } }, 60);
    else if (premierLien || emailChange) setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur ok"; z.textContent = trad(DECOUVERTE.inscription[emailChange ? "email_change" : "premier_lien"]); } }, 60);
    return;
  }
  /* v52 : adresse changee (dernier lien) : la session de l'appareil est renouvelee tout de suite, pour que le Profil,
     le changement de mot de passe et l'email du prospect utilisent la nouvelle adresse */
  if (emailChange){ try { await Auth.rafraichir(); } catch(e){} }
  try { await Auth.chargerProfil(); } catch(e){}
  /* v56 : une ouverture de l'app avec une session valide (connexion automatique comprise) est notee pour le coach, en
     arriere-plan : rien n'attend, rien ne s'affiche (Connexions) */
  try { Connexions.noter(); } catch(e){}
  /* v48 : ce qui n'etait pas arrive au serveur la derniere fois repart avant le premier affichage (4 s au plus) */
  try { await Promise.race([Store.reprendre(true), new Promise(r => setTimeout(r, 4000))]); } catch(e){}
  /* v52 : prospect — le choix de la newsletter fait a l'inscription est recopie dans la cle « emails » (lue par le
     coach) si elle n'existe pas encore ; en arriere-plan, sans retarder l'affichage (lecture ratee : rien d'ecrit,
     nouvel essai a la prochaine ouverture) */
  if (Auth.estProspect()) Accords.copierEmails();

  /* la langue choisie sur un autre appareil l'emporte */
  try {
    const pr = await Store.lire("prefs", {});
    if (pr && (pr.langue === "en" || pr.langue === "fr") && pr.langue !== I18N.langue){
      const ok = I18N.choisir(pr.langue);
      if (pr.langue === "fr" && ok){ location.reload(); return; }
      if (pr.langue === "en") Traduction.noeud(document.body);
    }
  } catch(e){}

  construireNav();
  Contenus.charger();
  window.addEventListener("hashchange", routeDepuisAdresse);
  /* v47 — un mot apres un lien d'email, une fois l'ecran construit */
  if ((premierLien || emailChange) && !lienEmail) setTimeout(() => { try { UI.toast(trad(DECOUVERTE.inscription[emailChange ? "email_change" : "premier_lien"]), "ok", 9000); } catch(e){} }, 600);
  if (lienEmail) setTimeout(() => { try { UI.toast(trad(DECOUVERTE.inscription.lien_rate_connecte), "attention", 7000); } catch(e){} }, 600);

  /* Premiere connexion d'un client : on l'envoie remplir son profil */
  if (!Auth.estCoach() && !Auth.estProspect()){
    const intake = await Store.lire("intake", {});
    if (!intake || !intake.complet){
      premiereFois = true;
      /* v52 : replaceState et non location.hash : l'ecouteur hashchange est deja pose, un changement d'ancre relancait
         un second affichage du Profil pendant le premier (intake lu 3 fois, champs branches deux fois, encadre perdu) */
      try { history.replaceState(null, "", "#/profil"); } catch(e){}
      await afficher("profil");
      const v = $("vue");
      const mot = document.createElement("div");
      mot.className = "bandeau";
      /* les dates et l'email copies par l'app (v51) ne sont pas des reponses */
      const repondu = k => { const v = intake[k]; return v != null && v !== false && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && !v.length); };
      const dejaVenu = intake && Object.keys(intake).filter(k => ["court_debut", "court_le", "email_compte", "complet"].indexOf(k) === -1 && repondu(k)).length > 3;
      /* « une question a ete ajoutee » seulement s'il ne manque qu'une ou deux reponses obligatoires ; sinon il reprend
         simplement son profil commence (enregistre pendant la frappe depuis la v48) */
      const manquantes = QUESTIONS.filter(q => q.requis && !repondu(q.id)).length;
      /* un ancien prospect passe client : ses reponses du questionnaire court (ou de l'ancien challenge) sont deja la,
         meme s'il ne l'avait pas valide */
      let dejaProspect = !!intake && !intake.nom && (Decouverte.questionnaireFait(intake) || (typeof intake.court_debut === "string" && Decouverte.repondues(intake) > 0));
      if (dejaVenu && !intake.nom && !dejaProspect){ try { const ch = (await Store.lireTout([Decouverte.cle]))[Decouverte.cle]; const j1 = ch && ch.jours && typeof ch.jours === "object" ? ch.jours["1"] : null; dejaProspect = !!(j1 && typeof j1 === "object" && j1.fait); } catch(e){} }
      mot.innerHTML = dejaProspect
        ? `<strong>Bienvenue dans l'accompagnement !</strong><span class="note">Tes premières réponses sont déjà là : complète le reste du questionnaire et enregistre.</span>`
        : dejaVenu && manquantes <= 2
        ? (manquantes <= 1 ? `<strong>Une réponse manque à ton profil.</strong><span class="note">Complète-la et enregistre : ça prend dix secondes.</span>` : `<strong>Deux réponses manquent à ton profil.</strong><span class="note">Complète-les et enregistre : ça prend quelques secondes.</span>`)
        : dejaVenu
        ? `<strong>Reprends ton profil là où tu t'es arrêté.</strong><span class="note">Tes premières réponses sont enregistrées : complète le reste et enregistre.</span>`
        : `<strong>Bienvenue !</strong><span class="note">Commence par remplir ton profil : c'est ce qui permet à ton coach de construire ton suivi.</span>`;
      v.insertBefore(mot, v.firstChild);
      window.scrollTo(0, 0);   // v52 : l'encadre, insere apres le rendu, est en haut de l'ecran, sous l'en-tete
      appPrete = true;
      return;
    }
  }

  appPrete = true;
  routeDepuisAdresse();
})();
