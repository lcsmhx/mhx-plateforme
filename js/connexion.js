function routeDepuisAdresse(){
  if (!$("vue") || $("session-perdue")) return;   // v48 : session terminee (bandeau ou ecran de connexion) : rien a router
  let id = (location.hash || "").replace(/^#\/?/, "");
  if (id.indexOf("=") > -1 || id.indexOf("&") > -1) id = "";
  /* le Challenge 7 jours n'existe plus : ses anciennes adresses (liens partages, favoris) menent a la Decouverte */
  if (/^challenge(-libre|-rythme)?(\/.*)?$/.test(id)){ try { history.replaceState(null, "", "#/decouverte"); } catch(e){} id = "decouverte"; }
  /* v53 : le mode test « jour n » de la Decouverte n'existe plus : ses anciennes adresses (#/decouverte-jour/N) menent
     simplement a la Decouverte (un client ou le coach arrivent ensuite sur leur page d'arrivee, comme pour #/decouverte) */
  if (/^decouverte-jour(\/.*)?$/.test(id)){ try { history.replaceState(null, "", "#/decouverte"); } catch(e){} id = "decouverte"; }
  const parts = id.split("/"); id = parts[0]; sousRoute = parts.slice(1).join("/");
  if (ALIAS_ROUTES[id]) id = ALIAS_ROUTES[id];
  /* v52 : une page qui n'est pas pour cette personne (client sur #/calculateur, coach hors fiche sur #/accueil…)
     affiche la page d'arrivee ET l'adresse le dit. replaceState ne declenche pas hashchange : pas de boucle.
     Sans ce correctif, un « Ouvrir » du coach qui pose #/accueil (deja dans l'adresse) ne faisait rien.
     Adresse vide (page d'arrivee) : rien a reecrire. */
  const cible = outilsVisibles().some(o => o.id === id) ? id : outilParDefaut();
  if (id && cible !== id){
    sousRoute = "";
    try { history.replaceState(null, "", "#/" + cible); } catch(e){}
  }
  afficher(cible);
}

/* ---------------------- ÉCRAN DE CONNEXION ---------------------- */
/* v64 (brief V2, A2) : un lien vers un PDF des textes legaux (CONFIG.textes_legaux) ; lien absent ou non valide (« à
   compléter », branche de travail : le banc de main refuse de publier) → le mot seul, sans lien */
function lienLegal(id, cle, texte){
  const u = lienSur((CONFIG.textes_legaux || {})[cle]);
  return u ? `<a class="lien" id="${id}" href="${esc(u)}" target="_blank" rel="noopener">${esc(texte)}</a>` : `<span class="lien lien-absent" id="${id}">${esc(texte)}</span>`;
}
function portail(mode){
  if (UI._ouverte) UI.fermer();   // v44 : un volet (conditions) encore ouvert ne doit pas figer l'ecran reconstruit
  /* v39 : « inscription » n'existe que si l'inscription libre est ouverte */
  const libre = !!(CONFIG.marque && CONFIG.marque.inscription_libre);
  mode = (mode === "oubli") ? "oubli" : (mode === "inscription" && libre) ? "inscription" : "connexion";
  const titre = mode === "oubli" ? "Mot de passe oublié" : mode === "inscription" ? DECOUVERTE.inscription.titre : "Connexion à ton espace";
  const bouton = mode === "oubli" ? "Recevoir le lien" : mode === "inscription" ? DECOUVERTE.inscription.bouton : "Se connecter";
  document.body.innerHTML = `
  <div class="portail">
    <div class="carte-co">
      <button type="button" class="co-langue" id="co-langue" data-notr>${I18N.langue === "en" ? "🇫🇷 Français" : "🇺🇸 English"}</button>
      <button type="button" class="co-langue co-theme" data-theme-bouton data-notr></button>
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      ${CONFIG.marque.programme ? `<div class="sous">${esc(CONFIG.marque.programme)}</div>` : ""}
      <h2>${esc(titre)}</h2>
      ${mode === "inscription" ? `<p class="co-sous">${esc(DECOUVERTE.inscription.sous)}</p>` : ""}
      <div id="co-err"></div>
      ${mode === "inscription" ? `<div class="champ"><label for="c-prenom">Ton prénom</label><input id="c-prenom" type="text" autocomplete="given-name" maxlength="60"></div>
      <div class="champ"><label for="c-nom">Ton nom</label><input id="c-nom" type="text" autocomplete="family-name" maxlength="60"></div>` : ""}
      ${mode === "oubli"
        /* v52 (décision de Lucas) : l'app n'envoie aucun email pour l'instant (ni lien de mot de passe, ni vérification) :
           « Mot de passe oublié ? » donne seulement l'adresse du coach, aucun appel à /auth/v1/recover */
        ? ecrisNous(DECOUVERTE.inscription.oubli, "co-oubli", "co-sous")
        : `<div class="champ"><label for="c-email">Email</label><input id="c-email" type="email" autocomplete="email"></div>`}
      ${mode === "inscription"
        /* v44 : prenom, email, mot de passe (un seul, avec « Afficher ») et la case des conditions.
           v52 : + le nom ; cases SEPAREES, aucune cochee d'avance. v64 (brief V2, A) : UNE seule case obligatoire, les
           conditions (deux liens distincts vers les PDF, CONFIG.textes_legaux ; aucun espace avant le point final, qui ne
           tombe plus seul sous le lien), et la newsletter (facultative) ; l'accord sante est demande au premier usage (Sante) */
        ? `<div class="champ"><label for="c-mdp">${esc(DECOUVERTE.inscription.mdp)}</label><div class="co-mdp"><input id="c-mdp" type="password" autocomplete="new-password"><button type="button" class="voir" id="c-voir" aria-pressed="false" aria-label="Afficher le mot de passe">Afficher</button></div></div>
      <label class="co-rester co-cgu"><input type="checkbox" id="c-cgu"><span>${esc(DECOUVERTE.inscription.cgu_avant)} ${lienLegal("c-cgu-lien", "cgu_pdf", DECOUVERTE.inscription.cgu_lien)} ${esc(DECOUVERTE.inscription.cgu_entre)} ${lienLegal("c-politique-lien", "confidentialite_pdf", DECOUVERTE.inscription.politique_lien)}${esc(DECOUVERTE.inscription.cgu_apres || "")}</span></label>
      <label class="co-rester co-newsletter"><input type="checkbox" id="c-newsletter"><span>${esc(DECOUVERTE.inscription.newsletter)}</span></label>`
        : mode !== "oubli" ? `<div class="champ"><label for="c-mdp">Mot de passe</label><input id="c-mdp" type="password" autocomplete="current-password"></div>` : ""}
      ${mode !== "oubli" ? `<label class="co-rester"><input type="checkbox" id="c-rester" checked><span>Rester connecté</span></label>` : ""}
      ${mode !== "oubli" ? `<button class="btn" id="c-go">${esc(bouton)}</button>` : ""}
      ${mode === "inscription" ? `<p class="co-note">${esc(DECOUVERTE.inscription.note)}</p>` : ""}
      ${CONFIG.marque.version ? `<p class="co-aide">v${esc(CONFIG.marque.version)}</p>` : ""}
      <div class="bascule">
        ${mode === "connexion"
          ? `<button type="button" data-mode="oubli">Mot de passe oublié ?</button>${libre ? `<button type="button" data-mode="inscription">Créer mon compte</button>` : ""}`
          : mode === "inscription"
          ? `<button type="button" data-mode="connexion">J'ai déjà un compte</button>`
          : `<button type="button" data-mode="connexion">Retour à la connexion</button>`}
      </div>
    </div>
  </div>`;

  const err = (msg, ok) => { const e = $("co-err"); e.className = "erreur" + (ok ? " ok" : ""); e.textContent = msg; };

  $$("[data-mode]").forEach(b => b.addEventListener("click", () => portail(b.dataset.mode)));
  Theme.majBoutons();
  /* v44 — inscription : voir le mot de passe (v64 : les conditions sont des liens vers les PDF, plus de volet ici) */
  const voir = $("c-voir");
  if (voir) voir.addEventListener("click", () => {
    const c = $("c-mdp"); if (!c) return;
    const montre = c.type === "password";
    c.type = montre ? "text" : "password";
    voir.textContent = montre ? trad("Masquer") : trad("Afficher");
    voir.setAttribute("aria-pressed", String(montre));
  });
  $("co-langue").addEventListener("click", () => {
    const ok = I18N.choisir(I18N.langue === "en" ? "fr" : "en");
    if (ok) location.reload(); else portail(mode);
  });

  const valider = async () => {
    if (mode === "oubli" || !$("c-go") || !$("c-email")) return;   // v52 : « Mot de passe oublié » n'envoie plus rien
    if ($("c-go") && $("c-go").disabled) return;   // v44 : un envoi est deja en cours
    const email = ($("c-email").value || "").trim();
    const mdp = $("c-mdp") ? $("c-mdp").value : "";
    if (!email){ err("Indique ton email."); return; }
    /* le choix doit etre pris AVANT la connexion : c'est lui qui decide
       ou la session sera rangee */
    const rester = $("c-rester");
    Auth.persistant = rester ? rester.checked : true;
    const b = $("c-go");
    if (mode === "inscription"){
      const prenom = ($("c-prenom").value || "").trim().slice(0, 60);
      if (!prenom){ err("Indique ton prénom."); return; }
      /* v52 : nom obligatoire (→ profils.nom par le declencheur de la base ; jamais dans intake.nom) */
      const nom = (($("c-nom") && $("c-nom").value) || "").trim().slice(0, 60);
      if (!nom){ err("Indique ton nom."); return; }
      if (mdp.length < 8){ err("Le mot de passe doit faire au moins 8 caractères."); return; }
      const cgu = $("c-cgu");
      if (!cgu || !cgu.checked){ err(trad(DECOUVERTE.inscription.cgu_manque)); return; }
      b.disabled = true; b.textContent = "Un instant…";
      try {
        /* v44 : l'acceptation des conditions est datee ; P0.5 : consentement sante separe, horodate.
           v52 : prenom ET nom ; chaque accord porte sa date et la version de son texte (DECOUVERTE.accords) ;
           la newsletter (facultative) remplace les « emails de suivi » : emails_suivi n'est plus envoye (il reste lu
           pour les comptes d'avant). Le choix de la newsletter est recopie dans la cle « emails » a la premiere
           ouverture (Accords.copierEmails), pour que le coach le voie.
           v64 (brief V2, A) : plus d'accord sante a l'inscription (consentement_sante / sante_version : au premier usage,
           Sante.donner) ; conditions_version = la version des CGU en PDF (CONFIG.textes_legaux.cgu_version). */
        const A = DECOUVERTE.accords, maintenant = new Date().toISOString();
        const ok_news = !!($("c-newsletter") && $("c-newsletter").checked);
        const connecte = await Auth.inscrire(email, mdp, prenom, nom, {
          consentement: maintenant, conditions_version: A.conditions,
          newsletter: ok_news ? maintenant : null, newsletter_version: A.newsletter });
        if (connecte){ location.hash = ""; location.reload(); return; }
        ecranVerifieEmail(email); return;   // v47 : un ecran dedie, pas une ligne de message
      } catch(e){
        const m = (e.message || "").toLowerCase();
        err(/email rate limit/.test(m) ? trad(DECOUVERTE.inscription.trop_emails)   // v52 : limite horaire d'emails du projet
          : /error sending|sending .*email|smtp/.test(m) ? trad(DECOUVERTE.inscription.envoi_rate, { p: CONFIG.marque.pseudo || "" })   // v52 : le serveur d'emails a refusé
          : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(DECOUVERTE.inscription.trop_demandes)   // v47
          : m.indexOf("already") > -1 || m.indexOf("registered") > -1 ? "Un compte existe déjà avec cet email : connecte-toi."
          : m.indexOf("disabled") > -1 || m.indexOf("not allowed") > -1 ? "Les inscriptions ne sont pas encore ouvertes."
          : e.message || "Une erreur est survenue.");
      }
      b.disabled = false; b.textContent = bouton;
      return;
    }
    b.disabled = true; b.textContent = "Un instant…";
    try {
      if (mode === "oubli"){
        await Auth.motDePasseOublie(email);
        err("Si un compte existe pour cet email, tu vas recevoir un lien.", true);
      } else {
        await Auth.connecter(email, mdp);
        /* v57 : une connexion ouvre la page d'arrivee (accueil ; tableau de bord du coach), comme apres « Se deconnecter ».
           L'adresse gardait la derniere page ouverte sur l'appareil quand la session avait pris fin sans deconnexion
           (session expiree, « Rester connecte » decoche, navigateur ferme) : on arrivait sur la Speed Formation.
           Sauf « Me reconnecter » (session perdue en cours d'utilisation) : retour sur la page qu'on avait sous les yeux. */
        if (!reconnexion){ try { history.replaceState(null, "", location.pathname + location.search); } catch(e){} }
        location.reload();
      }
    } catch(e){
      const m = (e.message || "").toLowerCase();
      /* v47 : les messages de Supabase qui arrivent sur le parcours du funnel, en francais */
      err(m.indexOf("not confirmed") > -1 ? trad(DECOUVERTE.inscription.non_confirme)
        : /email rate limit/.test(m) ? trad(DECOUVERTE.inscription.trop_emails_compte)   // v52 : limite horaire d'emails du projet (pas forcement des inscriptions)
        : /error sending|sending .*email|smtp/.test(m) ? trad(DECOUVERTE.inscription.envoi_rate, { p: CONFIG.marque.pseudo || "" })   // v52 : « Error sending recovery email »
        : /rate limit|security purposes|after \d+ seconds/.test(m) ? trad(DECOUVERTE.inscription.trop_demandes)
        : m.indexOf("invalid") > -1 ? "Email ou mot de passe incorrect."
        : m.indexOf("password") > -1 ? "Le mot de passe doit faire au moins 6 caractères."
        : e.message || "Une erreur est survenue.");
    }
    b.disabled = false;
    b.textContent = bouton;
  };

  if ($("c-go")) $("c-go").addEventListener("click", valider);
  /* Un seul ecouteur a la fois. Avant, chaque aller-retour « mot de passe
     oublie » en ajoutait un : Entree envoyait alors un email de
     reinitialisation EN PLUS de la connexion. */
  if (portail._entree) document.removeEventListener("keydown", portail._entree);
  portail._entree = e => {
    if (e.key !== "Enter") return;
    /* v44 : pas d'envoi depuis un bouton ou un lien (« Afficher », conditions), ni fenetre ouverte, ni envoi deja en cours */
    const t = e.target, go = $("c-go");
    if (UI._ouverte || (t && /^(BUTTON|A)$/.test(t.tagName)) || (go && go.disabled)) return;
    valider();
  };
  document.addEventListener("keydown", portail._entree);
}

/* ---------------------- NOUVEAU MOT DE PASSE ----------------------
   Quand le client clique sur le lien recu par email, Supabase le renvoie
   ici avec un jeton dans l'adresse. On lui fait choisir son mot de passe. */
function lireAdresse(){
  const h = (location.hash || "").replace(/^#\/?/, "");
  const p = {};
  h.split("&").forEach(kv => {
    const [k, v] = kv.split("=");
    const dec = x => { try { return decodeURIComponent(x); } catch(e){ return x; } };   // v47 : « #% » ne doit pas bloquer le demarrage
    if (k) p[dec(k)] = dec((v || "").replace(/\+/g, " "));
  });
  return p;
}

/* v47 — apres l'inscription, quand Supabase demande de confirmer l'email : la carte du portail
   devient « Verifie ta boite mail » (l'adresse, ou chercher, et un retour a la connexion) */
function ecranVerifieEmail(email){
  const carte = document.querySelector(".portail .carte-co"); if (!carte) return;
  const T = DECOUVERTE.inscription;
  /* le formulaire n'existe plus : la touche Entree ne doit plus chercher a l'envoyer */
  if (portail._entree){ document.removeEventListener("keydown", portail._entree); portail._entree = null; }
  carte.innerHTML = `
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      <h2 id="co-verif" tabindex="-1">${esc(trad(T.verif_titre))}</h2>
      <p class="co-sous">${esc(trad(T.verif_texte, { e: email }))}</p>
      <p class="co-note">${esc(trad(T.verif_note))}</p>
      <div class="bascule"><button type="button" data-mode="connexion">${esc(trad(T.verif_retour))}</button></div>`;
  $$("[data-mode]", carte).forEach(b => b.addEventListener("click", () => portail(b.dataset.mode)));
  const h2 = $("co-verif"); if (h2) h2.focus();
}

/* v47 — entree par un lien recu par email (confirmation d'inscription, lien magique) : les jetons
   sont dans l'adresse. On va chercher la personne avec ce jeton, on memorise la session comme
   apres une connexion, on retire les jetons de l'adresse, et le demarrage continue (un prospect
   arrive sur son jour 1). Lien perime : la connexion, avec un mot ; deja connecte sur cet
   appareil : on entre quand meme, avec un mot. */
async function entrerParLien(p){
  const nettoyer = () => { try { history.replaceState(null, "", location.pathname + location.search); } catch(e){} };
  Auth.charger();
  const avant = Auth.utilisateur();   // un compte deja connecte sur cet appareil ?
  try {
    if (!/^[\w-]+\.[\w-]+\.[\w-]*$/.test(String(p.access_token))) throw Object.assign(new Error("sans utilisateur"), { statut: 400 });   // un jeton qui n'en a pas la forme : pas d'appel
    const u = await Auth.appel("/auth/v1/user", { avecJeton: false, headers: { "Authorization": "Bearer " + p.access_token } });
    if (!u || typeof u !== "object" || typeof u.id !== "string" || !u.id) throw new Error("sans utilisateur");
    nettoyer();
    lienEmailType = p.type; lienEmailAdresse = typeof u.email === "string" ? u.email : "";
    /* un autre compte est connecte : on ne bascule jamais en silence (un lien envoye par un tiers
       ferait saisir ses reponses dans le compte du tiers) ; l'email du lien est de toute facon confirme */
    if (avant && avant.id && avant.id !== u.id){ lienEmail = "autre_compte"; return true; }
    Auth.persistant = true;
    const duree = Math.min(Math.max(parseInt(p.expires_in, 10) || 3600, 60), 3600);   // borne : un lien fabrique ne doit pas figer une session
    Auth.memoriser({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: duree, token_type: p.token_type || "bearer", user: u });
    lienEmail = "ok";
    return true;
  } catch(e){
    nettoyer();
    Auth.charger();
    if (Auth.connecte()){ lienEmail = "rate_connecte"; return true; }
    /* jeton refuse (4xx) : lien plus valable ; sinon (reseau, 5xx) l'email est confirme mais l'entree a echoue */
    const refuse = e && e.statut >= 400 && e.statut < 500 && e.statut !== 429;   // 429 = trop de demandes, pas un lien perime
    portail("connexion");
    setTimeout(() => { const z = $("co-err"); if (z){ z.className = "erreur"; z.textContent = trad(DECOUVERTE.inscription[refuse || !(e && e.statut) && /sans utilisateur/.test(String(e && e.message)) ? "lien_rate" : "lien_reseau"]); } }, 60);
    return false;
  }
}

function ecranNouveauMotDePasse(jeton){
  document.body.innerHTML = `
  <div class="portail">
    <div class="carte-co">
      ${CONFIG.marque.logo ? `<img class="logo-img" src="${esc(CONFIG.marque.logo)}" alt="${esc(CONFIG.marque.nom)}">` : ""}
      <div class="logo">${esc(CONFIG.marque.nom)}</div>
      ${CONFIG.marque.programme ? `<div class="sous">${esc(CONFIG.marque.programme)}</div>` : ""}
      <h2>Choisis ton nouveau mot de passe</h2>
      <div id="co-err"></div>
      <div class="champ"><label for="r-mdp">Nouveau mot de passe</label><input id="r-mdp" type="password" autocomplete="new-password"></div>
      <div class="champ"><label for="r-mdp2">Confirme-le</label><input id="r-mdp2" type="password" autocomplete="new-password"></div>
      <button class="btn" id="r-go">Enregistrer</button>
    </div>
  </div>`;
  const err = (m, ok) => { const e = $("co-err"); e.className = "erreur" + (ok ? " ok" : ""); e.textContent = m; };
  $("r-go").addEventListener("click", async () => {
    const a = $("r-mdp").value, b = $("r-mdp2").value;
    if (a.length < 6){ err("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (a !== b){ err("Les deux mots de passe ne sont pas identiques."); return; }
    const bouton = $("r-go"); bouton.disabled = true; bouton.textContent = "Un instant…";
    try {
      await fetch(CONFIG.supabase.url + "/auth/v1/user", {
        method: "PUT",
        headers: { "apikey": CONFIG.supabase.cle, "Content-Type": "application/json", "Authorization": "Bearer " + jeton },
        body: JSON.stringify({ password: a })
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).msg || "Lien expiré."); });
      err("Mot de passe enregistré. Tu peux te connecter.", true);
      setTimeout(() => { location.hash = ""; location.reload(); }, 1400);
    } catch(e){
      err(e.message || "Ce lien n'est plus valable. Redemande-en un depuis « Mot de passe oublié ».");
      bouton.disabled = false; bouton.textContent = "Enregistrer";
    }
  });
}

