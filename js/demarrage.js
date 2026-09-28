/* ---------------------- DÉMARRAGE ---------------------- */
let premiereFois = false;
let appPrete = false;   // v48 : demarrage termine (une session refusee ensuite renvoie a la connexion, avec un mot)
function sessionPerdue(){
  /* la page n'est PAS remplacee : un texte en cours (feedback, notes privees) reste a l'ecran et peut etre copie ;
     un bandeau propose de se reconnecter. Les saisies gardees sur l'appareil repartiront apres reconnexion. */
  if (!appPrete || $("session-perdue")) return;
  const d = document.createElement("div");
  d.id = "session-perdue"; d.className = "bandeau session-perdue"; d.setAttribute("role", "alert");
  d.innerHTML = `<span>${esc(trad("Ta session a pris fin (déconnexion depuis un autre appareil ?). Ce qui est à l'écran reste là : copie ton texte si besoin, puis reconnecte-toi. Ce que tu avais saisi avant est gardé sur cet appareil et repartira ; ce que tu saisis maintenant n'est plus enregistré."))}</span><button type="button" class="btn">${esc(trad("Me reconnecter"))}</button>`;
  document.body.appendChild(d);
  d.querySelector("button").addEventListener("click", () => {
    appPrete = false;
    window.removeEventListener("hashchange", routeDepuisAdresse);
    portail("connexion");
    setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = trad("Reconnecte-toi : ce que tu avais saisi est gardé sur cet appareil et repartira."); } }, 60);
  });
}
let lienEmail = null, lienEmailType = "", lienEmailAdresse = "";   // v47 : "ok" | "autre_compte" | "rate_connecte" apres un lien d'email (mot affiche une fois l'ecran construit)

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

  /* lien de reinitialisation recu par email */
  if (p.type === "recovery" && p.access_token){ ecranNouveauMotDePasse(p.access_token); return; }
  /* v47 — lien de confirmation d'inscription (ou lien magique) : entree directe */
  if (p.access_token && p.refresh_token && (p.type === "signup" || p.type === "magiclink")){
    if (!(await entrerParLien(p))) return;
  } else if (p.access_token){
    try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}   // autre lien (changement d'email…) : les jetons ne restent pas dans l'adresse
    /* v52 : dernier lien d'un changement d'adresse : le changement est fait, on le dit */
    if (p.type === "email_change") emailChange = true;
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
    if (premierLien || emailChange) setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur ok"; z.textContent = trad(DECOUVERTE.inscription[emailChange ? "email_change" : "premier_lien"]); } }, 60);
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
  if (lienEmail) setTimeout(() => { try {
    const T = DECOUVERTE.inscription;
    const cle = lienEmail === "ok" ? (lienEmailType === "signup" && Auth.estProspect() ? "lien_ok" : "lien_entree") : lienEmail === "autre_compte" ? "lien_autre_compte" : "lien_rate_connecte";
    UI.toast(trad(T[cle], { e: lienEmailAdresse ? " (" + lienEmailAdresse + ")" : "" }), lienEmail === "ok" ? "ok" : "attention", 7000);
  } catch(e){} }, 600);

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
