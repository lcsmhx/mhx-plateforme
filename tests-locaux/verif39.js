/* v39 — phase 15 : statut prospect / client (colonne profils.statut).
   Supabase simulé : la colonne statut existe (sauf option sansStatut), un compte
   créé par la base naît « prospect », seul le coach change un statut.
   Découverte (remplace le Challenge 7 jours) : tuile « Prospects en découverte » (prospects
   encore dans leurs 7 jours), inscription « Crée ton accès découverte » avec les deux cases
   (conditions + données de santé), arrivée du nouveau compte sur l'écran Découverte sans aucune
   écriture dans donnees (rien ne part avant un âge ≥ 18).
   v52 (chantier 1, lot A) : 7 vérifications reprises de la branche attente/nuit-28-09 (index.html les reprend aussi) :
   erreurs d'envoi d'email en français, jamais le texte brut de Supabase (inscription : serveur d'emails en panne,
   limite horaire, limite par adresse ; mot de passe oublié : panne, limite horaire), liens du changement d'adresse
   en deux temps (premier lien, dernier lien). Détails et variantes (anglais, connecté, Profil) : verif55 bloc B.
   v52 (chantier 1, lot B) : l'écran d'inscription change volontairement : « Crée ton espace gratuit » / « Gratuit pour
   toujours… » (plus de 7 jours), champ Nom obligatoire (« Indique ton nom. »), trois cases séparées (conditions, santé,
   newsletter facultative), métadonnées exactes (nom saisi, versions des accords, newsletter au lieu d'emails_suivi) ; le
   faux Supabase rend la session avec ses métadonnées, comme la vraie base : à l'arrivée, seule la copie de la newsletter
   (clé emails) est écrite. Détails : verif55 blocs E à H.
   v52 (lot B, décision de Lucas) : aucun email envoyé par l'app : « Mot de passe oublié » donne l'adresse du coach, sans appel.
   v55 : sante_version « 2026-09-28b » à l'inscription ; connexion, inscription ouverte : « Mot de passe oublié ? » et
   « Créer mon compte » centrés à 320, 375 et 390 px (côte à côte ou sur deux lignes), 1 vérification de plus (48).
   v64 (lot 5, brief V2 A) : l'inscription n'a plus qu'UNE case obligatoire, « J'ai 18 ans ou plus et j'accepte les CGU et la
   politique de confidentialité. » (deux liens vers les PDF de CONFIG.textes_legaux, point final collé au 2e lien), puis la
   newsletter (facultative) et « Rester connecté » ; plus de case santé (accord demandé au premier usage, partie B) : « case santé
   obligatoire » devient « plus de case ni de texte santé, un compte se crée sans elle » ; sous-titre A1, bouton « Créer mon
   espace gratuit » / « Create my free account » ; métadonnées : conditions_version = CONFIG.textes_legaux.cgu_version (servie
   « 2026-10-15 », LEGAUX_TEST ; distincte du texte court, 2026-10-01), newsletter_version « 2026-09-30 », plus de consentement_sante ni de sante_version ; en anglais,
   la case des conditions manquante (avant : la case santé). Même nombre de vérifications (48).
   v71 (D) : le tableau « Suivi de mes clients » ne liste plus les prospects (ligne « Les prospects sont dans Prospects →
   (N compte gratuit). » sous le titre) : les 2 vérifications de la ligne de Léa dans #tb-clients (pastille « prospect », feu
   vert) sont adaptées (absence de Léa, ligne et lien vers Prospects). Même nombre (48).
   v74 (décision de Lucas du 04/10) : plus de champ Nom à l'inscription : #c-nom absent (FR, et « Your last name » en anglais),
   aucune erreur sur le nom (le prénom rempli, l'envoi passe au mot de passe), métadonnées avec nom "" (profils.nom vide,
   comme avant la v52). Même nombre (48).
   v81 (bloc 2, mission du 13/10) : l'écran unique « Crée ton espace gratuit » n'existe plus, la création de compte est le
   parcours du prospect en 11 écrans (js/parcours.js, piloté comme un doigt par FT.parcours de fichiers.js). Chaque
   vérification de l'ancien écran porte sur l'écran du parcours qui fait maintenant la même chose, même exigence, mêmes
   valeurs exactes quand elles existent encore :
   - titre, sous-titre, bouton → accueil du parcours (#pc[data-etape="accueil"], adresse #/inscription) : le sous-titre
     « …poser tes bases en 14 jours… » n'existe plus, c'est celui de l'accueil (TEXTES.md) qui est vérifié, et plus aucun
     « 14 jours », « 7 jours » ni « Challenge » : ni dans les textes des 11 écrans (PARCOURS_T), ni à l'écran sur les 11
     écrans vus (accueil → cadeau ; hors compte à rebours, qui dit « plus que 14 jours » le 1er novembre) ; en anglais,
     ni « 14 days », « 7 days », « Challenge », « health data » de l'accueil à l'écran Compte ;
   - prénom obligatoire → écran « On t’appelle comment ? » (« Continuer » inactif, vide ou fait d'espaces ; avant : le
     message « Indique ton prénom. ») ;
   - cases (conditions seule obligatoire, son texte, point collé au 2e lien, liens des PDF de test ; newsletter avec son
     texte v81), mot de passe court, case manquante → écran Compte (#pc-err-mdp, #pc-err-cgu : textes exacts) ; aucun
     champ Nom sur aucun écran ; santé → écrans Compte et WhatsApp ;
   - bouton qui crée le compte et erreurs du serveur (SMTP, limites, inscriptions fermées) → « Débloquer mon espace »
     (#c-go) et #co-err de l'écran WhatsApp ;
   - métadonnées EXACTES : mêmes clés, dans leur ordre ; newsletter_version « 2026-10-13 » (v81 : nouveau texte de la case,
     DECOUVERTE.accords.newsletter ; avant 2026-10-11) ;
   - arrivée → écran « Ton espace » du parcours (page rechargée avec la session), plus le questionnaire de l'app ; écritures
     du compte neuf : contact UNE fois (le numéro du parcours, à la création), emails (copie de la newsletter) et intake en
     UNE écriture (les réponses), rien d'autre (avant : la seule copie emails, le numéro n'étant pas demandé ici).
   Le faux Supabase rend la ligne écrite quand on la demande (Prefer: return=representation, comme la vraie base : la clé
   contact, écrite par CleCoach) ; avant, il rendait un corps vide et l'écriture du numéro aurait passé pour refusée.
   Inchangés : partie A (coach), l'inscription fermée (la connexion, jamais le parcours), les deux liens de la connexion
   (320 / 375 / 390 px, 12 à 24 px entre eux), « Mot de passe oublié », le changement d'adresse. Même nombre (48).
   Usage : node verif39.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9670;
let inscriptionLibre = false;
/* 52.1 : la retouche vaut pour la page et pour ses fichiers (inscription_libre est dans js/config.js) */
const { servirFichier, forcerInscription } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const FT = require("./fichiers");   // v81 : FT.parcours, le parcours du prospect piloté écran par écran
/* v54 : l'inscription est ouverte dans le fichier (inscription_libre: true) ; la retouche FORCE la valeur voulue
   (inscriptionLibre, fermée par défaut comme avant), dans les deux sens : la suite reste valable si Lucas la referme.
   v55 : par forcerInscription (fichiers.js), comme toutes les suites qui testent l'inscription (les autres servent la valeur
   du fichier) */
/* v64 (lot 5, brief V2 A2) : les 3 emplacements CONFIG.textes_legaux (js/config.js, « à compléter » tant que Lucas ne les a
   pas remplis) servis avec des valeurs de test valides (liens Drive fictifs, jamais ouverts ; version postérieure au
   2026-09-30) le temps des blocs d'inscription (legaux = LEGAUX_TEST), sinon tels quels. Aucun test ne clique un lien PDF. */
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-15" };   // v64 : version DISTINCTE du texte court (2026-10-01 depuis la v64, comme les PDF)
let legaux = null;
const poserLegaux = t => legaux ? t.replace(/\b(cgu_pdf|confidentialite_pdf|cgu_version): "[^"\n]*"/g, (x, k) => k + ": " + JSON.stringify(legaux[k])) : t;
const retouche = h => poserLegaux(forcerInscription(h, inscriptionLibre));
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
/* v64 (lot 5, brief V2 A1 et A2) : sous-titre et case des conditions de l'inscription, FR et EN (textes du brief, mot pour mot).
   v81 (bloc 2) : l'écran unique et son sous-titre « …poser tes bases en 14 jours… » n'existent plus : titre, sous-titre et
   bouton de l'ACCUEIL DU PARCOURS (docs/maj-blocs-1-2/TEXTES.md, § 1 ; anglais : js/i18n.js, bloc v81) ; la case des
   conditions (écran Compte du parcours) garde son texte ; la newsletter a son texte v81 */
const TITRE_FR = "Combien de lundis tu as dit « je commence » ?", TITRE_EN = "How many Mondays have you said “I’ll start”?";
const SOUS_FR = "Séances prêtes, journal alimentaire, recettes, suivi. Gratuit à vie pour les inscrits.";
const SOUS_EN = "Ready-made workouts, food diary, recipes, progress tracking. Free for life when you sign up.";
const BOUTON_FR = "Créer mon espace gratuit", BOUTON_EN = "Create my free space";
const CGU_FR = "J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité.", CGU_EN = "I'm 18 or older and I accept the Terms of Use and the Privacy Policy.";
const NEWSLETTER_FR = "Je veux recevoir les conseils et les offres de MHX Coaching par email.";
const PROSPECT = "00000000-0000-4000-8000-000000000c04", EQUIPE = "00000000-0000-4000-8000-0000000000e1", NOUVEAU = "00000000-0000-4000-8000-000000000c05";
const INSCRIT = "00000000-0000-4000-8000-00000000abcd";   // le compte créé par /auth/v1/signup (faux Supabase)
/* v81 : les 11 écrans du parcours, dans l'ordre */
const ETAPES_PC = ["accueil", "objectif", "coince", "projection", "sexe", "prenom", "chargement", "compte", "whatsapp", "espace", "cadeau"];
/* instant « il y a n jours » (midi, heure locale) : les dates d'inscription suivent le jour du test.
   Léa s'est inscrite il y a 3 jours : jour 4/7 de sa Découverte, quel que soit le jour où la suite tourne. */
const ilYAIso = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };

function base(opts) {
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([
    { id: PROSPECT, prenom: "Léa", nom: "Démo", role: "client", cree_le: ilYAIso(3) },
    { id: EQUIPE, prenom: "Équipe", nom: "Démo", role: "coach", cree_le: "2026-09-02T10:00:00Z" }
  ]);
  if (!opts.sansStatut) profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  return { profils, donnees: JSON.parse(JSON.stringify(F.donnees)), patchs: [], fonctions: [], inscriptions: [], ecritures: [] };
}
async function contexte(b, who, db, opts) {
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url();
    if (new URL(u).hostname === "localhost") return r.continue();
    if (!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage de chaque compte client ou prospect) n'est
       pas une écriture de l'app dans les données : elle est testée à part (verif61) */
    if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      if (opts.inscriptionKo) return json({ msg: "Signups not allowed for this instance" }, 422);
      if (opts.inscriptionErreur) return json({ msg: opts.inscriptionErreur.msg }, opts.inscriptionErreur.status);   // v52 : SMTP en panne, limites
      const id = INSCRIT;
      /* le declencheur de la base : profil avec prenom / nom, statut par defaut « prospect » */
      db.profils.push(Object.assign({ id, prenom: corps.data.prenom, nom: corps.data.nom, role: "client", cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      /* v52 : comme la vraie base, la session rendue porte les métadonnées de l'inscription (user_metadata) */
      const sess = F.session(id, corps.email); sess.user.user_metadata = corps.data || {};
      return json(sess);
    }
    if (p.startsWith("/auth/v1/recover") && opts.recoverErreur) { db.oublis = (db.oublis || 0) + 1; return json({ msg: opts.recoverErreur.msg }, opts.recoverErreur.status); }
    if (p.startsWith("/auth/v1/recover")) { db.recover = (db.recover || 0) + 1; return json({}); }   // v52 : ne doit plus jamais être appelé
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/functions/v1/creer-acces") {
      const corps = JSON.parse(req.postData() || "{}"); db.fonctions.push(corps);
      const role = corps.role === "coach" && !opts.equipeRefusee ? "coach" : "client";   // equipeRefusee : la base a refuse le role (la fonction renvoie le role reellement pose)
      db.profils.push(Object.assign({ id: NOUVEAU, prenom: corps.prenom, nom: corps.nom, role, cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      return json({ id: NOUVEAU, email: corps.email, role });
    }
    if (p === "/rest/v1/profils") {
      if (m === "PATCH") {
        const id = (q.get("id") || "").slice(3); const corps = JSON.parse(req.postData() || "{}"); db.patchs.push({ id, corps });
        if (opts.patchKo) return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400);
        const cible = db.profils.find(x => x.id === id);
        if (!cible) return json([], 200);
        if ("statut" in corps && !("statut" in cible)) return json({ code: "PGRST204", message: "Could not find the 'statut' column" }, 400);
        Object.assign(cible, corps);
        return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
      }
      const id = q.get("id");
      if (!id && opts.listeKo) return r.abort();   // panne reseau simulee
      return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {   /* toute écriture est notée (clé, compte), puis acceptée */
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => db.ecritures.push({ table: "donnees", m, user_id: row && row.user_id, outil: row && row.outil }));
        if (!rows || (Array.isArray(rows) && !rows.length)) db.ecritures.push({ table: "donnees", m, filtre: url.search });
        /* v81 : comme la vraie base, un POST qui demande la ligne en retour (Prefer: return=representation : CleCoach, la clé
           contact écrite par le parcours à la création du compte) la reçoit ; sinon, corps vide comme avant */
        if (m === "POST" && (req.headers()["prefer"] || "").includes("return=representation") && Array.isArray(rows) && rows.length) return json(rows, 201);
        return json(null, 201);
      }
      let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
      if (who && who.id !== F.IDS.coach) l = l.filter(x => x.user_id === who.id && x.outil !== "notes_coach");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(l);
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, langue }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who ? who.session : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  /* un 500 simulé exprès (serveur d'emails en panne) fait écrire au navigateur « status of 500 » : attendu dans ces cas-là */
  const attendu500 = !!(opts && ((opts.inscriptionErreur && opts.inscriptionErreur.status >= 500) || (opts.recoverErreur && opts.recoverErreur.status >= 500)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text()) && !(attendu500 && /status of 5\d\d/.test(msg.text()))) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const ligneCompte = (page, nom) => page.locator("#liste-clients .client-l", { hasText: nom });
/* les tuiles du tableau de bord : libellé, valeur, sous-titre, lien */
const lireTuiles = page => page.$$eval("#tb-vue .tb-tuile", l => l.map(t => {
  const txt = sel => { const e = t.querySelector(sel); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
  return { lbl: txt(".t-lbl"), val: txt(".t-val"), sub: txt(".t-sub"), href: t.getAttribute("href") };
}));
/* v81 — le parcours du prospect : l'écran affiché (data-etape de #pc), un bouton inactif (aria-disabled : touché, il ne fait
   rien), les erreurs de l'écran Compte, le texte d'un écran (sans le compte à rebours, « plus que N jours », qui dit
   « 14 jours » le 1er novembre et « 7 jours » le 8) et la présence d'un champ Nom, rangés par écran dans vus */
const etapeDe = page => page.$eval("#pc", e => e.dataset.etape).catch(() => "");
const inactif = (page, sel) => page.$eval(sel, b => b.getAttribute("aria-disabled") === "true").catch(() => null);
const erreursCompte = page => page.evaluate(() => {
  const t = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, " ").trim() : null; }, pc = document.getElementById("pc");
  return { etape: pc ? pc.dataset.etape : "", email: t("pc-err-email"), mdp: t("pc-err-mdp"), cgu: t("pc-err-cgu"), texte: pc ? pc.textContent.replace(/\s+/g, " ") : "" };
}).catch(e => ({ erreur: String(e) }));
const noter = async (page, vus) => {
  const v = await page.evaluate(() => {
    const pc = document.getElementById("pc"); if (!pc) return null;
    const k = pc.cloneNode(true); k.querySelectorAll("#pc-rebours").forEach(x => x.remove());
    return { e: pc.dataset.etape, t: k.textContent.replace(/\s+/g, " ").trim(), nom: !!document.getElementById("c-nom") };
  }).catch(() => null);
  if (v && v.e) vus[v.e] = v;
  return v ? v.e : "";
};
/* plus de case ni de texte santé sur l'écran affiché (v64) ; sante_avant / sante_manque absents des textes FR et EN */
const santeIci = page => page.evaluate(() => ({ cases: ["c-sante"].filter(id => document.getElementById(id)).concat(document.querySelector(".co-sante") ? [".co-sante"] : []),
  texte: /données de santé|health data/i.test((document.getElementById("pc") || document.body).textContent),
  cles: ["sante_avant", "sante_manque"].filter(k => (k in (DECOUVERTE.inscription || {})) || (k in ((DECOUVERTE.en || {}).inscription || {}))) })).catch(e => ({ erreur: String(e) }));
const santeOk = s => !!s && !!s.cles && s.cases.length === 0 && s.texte === false && s.cles.length === 0;
/* le message de l'écran WhatsApp (#co-err), une fois écrit */
const messageServeur = async page => { await page.waitForFunction(() => { const z = document.getElementById("co-err"); return !!z && !!z.textContent.trim(); }, null, { timeout: 8000 }).catch(() => {}); return (await page.textContent("#co-err").catch(() => "")) || ""; };

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Coach : prospects visibles, statut modifiable ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    /* v53 (chantier 4) : le tableau de bord n'a plus que 2 tuiles (Clients, Prospects) et « À traiter maintenant » : les
       vérifications de la tuile « Prospects en découverte » et de la section « Qui nécessite ton attention » sont retirées
       (2) ; les nouvelles tuiles et leurs urgences sont vérifiées par verif58 (bloc A). Le prospect reste sans alerte de
       suivi dans Mes clients (ci-dessous). */
    await aller(page, "#/clients", 1800);
    /* v71 (D) : le tableau « Suivi de mes clients » ne liste plus les prospects : plus de ligne, de pastille « prospect »,
       de feu ni de bouton « Ouvrir » pour Léa dans #tb-clients ; une ligne sous le titre renvoie vers la page Prospects avec
       le nombre de comptes gratuits (toujours affichée). Avant : pastille « prospect » et feu vert sur la ligne de Léa. */
    await page.waitForSelector(`#tb-clients [data-ouvrir="${F.IDS.c1}"]`, { timeout: 8000 }).catch(() => {});   // le tableau est rendu (Thomas, client) ; l'ancien locator attendait de lui-même
    const tbl = await page.$$eval("#tb-clients tr", trs => trs.map(tr => ({ t: tr.textContent.replace(/\s+/g, " ").trim(), feux: tr.querySelectorAll(".point").length, ouvrir: [...tr.querySelectorAll("[data-ouvrir]")].map(b => b.dataset.ouvrir) })));
    ok("mes clients (v71 D) : Léa (prospect) n'a plus de ligne dans #tb-clients (ni pastille « prospect », ni bouton Ouvrir [data-ouvrir]) ; les 3 clients Thomas, Sarah et Julien y sont, chacun avec son feu",
      !tbl.some(r => r.t.includes("Léa Démo")) && !tbl.some(r => r.ouvrir.includes(PROSPECT)) && !tbl.some(r => /\bprospect\b/.test(r.t)) && tbl.length === 3 && ["Thomas Démo", "Sarah Démo", "Julien Démo"].every(n => tbl.some(r => r.t.includes(n))) && tbl.every(r => r.feux === 1), JSON.stringify(tbl.map(r => r.t.slice(0, 40) + " · feux " + r.feux)));
    /* v83 (bloc 3, décision 7 de Lucas) : plus de lien « Les prospects sont dans Prospects → » sous le titre : on passe de Clients
       à Prospects par la barre du bas seulement ; Léa n'est pas non plus dans la liste « Clients » du haut (ni dans Tous, ni
       dans Archivés) ; le nombre de comptes gratuits est sur le Tableau de bord et la page Prospects */
    const zp = await page.evaluate(id => ({ lien: !!document.getElementById("clients-prospects"), liste: Array.from(document.querySelectorAll("#lc-clients .lc-ligne")).map(x => x.dataset.uid),
      compte: (document.getElementById("lc-compte") || {}).textContent, onglet: !!document.querySelector('#barre-bas a[data-id="prospects"][href="#/prospects"]') }), PROSPECT).catch(e => ({ erreur: String(e) }));
    ok("mes clients (v83, décision 7) : plus de lien « Prospects → » en haut ; la liste « Clients » (3 clients) sans Léa ; l'onglet Prospects de la barre du bas mène à #/prospects (aucune alerte de suivi pour un prospect : il n'est plus dans ce tableau)",
      zp.lien === false && zp.compte === "3 clients" && zp.liste.length === 3 && !zp.liste.includes(PROSPECT) && zp.onglet === true, JSON.stringify(zp));
    const encadres = (await page.textContent("#alertes-clients")).replace(/\s+/g, " ");
    ok("mes clients : le prospect n'est pas dans les encadrés « Sans nouvelles… » / « Il manque quelque chose… »", !encadres.includes("Léa Démo") && encadres.includes("Julien Démo"), encadres.slice(0, 300));
    const compteLea = await ligneCompte(page, "Léa Démo").textContent();
    ok("comptes : Léa « prospect » avec « Passer client »", compteLea.includes("prospect") && compteLea.includes("Passer client"));
    const compteThomas = await ligneCompte(page, "Thomas Démo").textContent();
    ok("comptes : Thomas « client » avec « Repasser prospect »", compteThomas.includes("client") && compteThomas.includes("Repasser prospect"));
    ok("comptes : pas de bouton de statut pour un compte d'équipe", !(await ligneCompte(page, "Équipe Démo").textContent()).includes("Passer client"));
    await ligneCompte(page, "Thomas Démo").locator(".statut").click(); await attendre(page, 400);
    ok("repasser prospect : fenêtre de confirmation en rouge (danger)", await page.locator('.modale [data-ui-b="1"].danger').count() === 1);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 300);
    /* annuler ne change rien ; confirmer passe Léa client, confirmé par la base */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 400);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 400);
    ok("passer client : Annuler = aucune écriture", db.patchs.length === 0);
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 400);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1500);
    ok("passer client : PATCH profils { statut: client } pour Léa, et la liste se met à jour", db.patchs.length === 1 && db.patchs[0].id === PROSPECT && db.patchs[0].corps.statut === "client" && (await ligneCompte(page, "Léa Démo").textContent()).includes("Repasser prospect"), JSON.stringify(db.patchs));
    /* bug corrigé : « Supprimer » sur un compte d'équipe n'ouvre plus une fiche */
    await ligneCompte(page, "Équipe Démo").locator(".suppr").click(); await attendre(page, 400);
    const apres = await page.evaluate(() => ({ h: location.hash, id: Store.idConsulte }));
    await page.click('.modale [data-ui-b="0"]').catch(() => {}); await attendre(page, 300);
    ok("supprimer un compte d'équipe : ne navigue pas vers une fiche (bug corrigé)", apres.h === "#/clients" && !apres.id, JSON.stringify(apres));
    /* fiche d'un prospect : pastille « prospect », pas d'alertes de suivi */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 300);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1200);   // Léa repasse prospect
    await page.evaluate(id => { Store.oublier(Store.idConsulte); Store.idConsulte = id; Store.nomConsulte = "Léa Démo"; location.hash = "#/accueil"; }, PROSPECT); await attendre(page, 1800);
    const ficheLea = (await page.textContent("#vue")).replace(/\s+/g, " ");
    ok("fiche d'un prospect : pastille « prospect », « Compte gratuit », aucune alerte de suivi", ficheLea.includes("prospect") && ficheLea.includes("Compte gratuit") && await page.locator("#vue .attention-alertes").count() === 0, ficheLea.slice(0, 250));
    await aller(page, "#/clients", 1500);   // meme ancre #/accueil : il faut en sortir pour changer de fiche
    await page.evaluate(id => { Store.oublier(Store.idConsulte); Store.idConsulte = id; Store.nomConsulte = "Julien Démo"; location.hash = "#/accueil"; }, F.IDS.c3); await attendre(page, 1800);
    ok("fiche d'un client : alertes de suivi toujours là", await page.locator("#vue .attention-alertes").count() === 1);
    await page.evaluate(() => { Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; location.hash = "#/clients/nouveau"; }); await attendre(page, 1800);   // v83 : Créer un accès est un écran à part (« + »)
    /* creation d'un acces : nait prospect en base, passe client tout de suite */
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-nom", "Démo"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("créer un accès : puis statut « client » posé tout de suite", db.fonctions.length === 1 && db.patchs.some(x => x.id === NOUVEAU && x.corps.statut === "client") && db.profils.find(x => x.id === NOUVEAU).statut === "client");
    ok("créer un accès : message « Compte créé »", (await page.textContent("#n-msg")).includes("Compte créé"));
    await c.close();
  }
  /* v53 (chantier 4) : tuile « Prospects en découverte » retirée (plus de limite de 7 jours, 2 tuiles Clients et Prospects) :
     le bloc qui en vérifiait les jours 7 / 8 / 11 et le sous-titre « 1 chaud · 4 prospects au total » est retiré (1). */
  {
    /* le passage en client echoue : le coach le sait */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { patchKo: true });
    await page.goto(`http://localhost:${PORT}/#/clients/nouveau`); await attendre(page, 2000);   // v83 : Créer un accès est un écran à part (« + »)
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("créer un accès, statut refusé : message « encore prospect … Passer client »", (await page.textContent("#n-msg")).includes("encore « prospect »"));
    ok("créer un accès, statut refusé : une fenêtre le dit aussi (le message ne s'efface pas)", (await page.textContent(".modale").catch(() => "")).includes("encore « prospect »"));
    await page.click('.modale [data-ui-b]').catch(() => {}); await attendre(page, 300);
    await aller(page, "#/clients", 2000);   // v83 : les Comptes sont sur la page Mes clients
    /* le bouton de statut qui echoue retrouve son libelle */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 300);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1000);
    await page.click('.modale [data-ui-b]').catch(() => {}); await attendre(page, 300);
    const bst = ligneCompte(page, "Léa Démo").locator(".statut");
    ok("passer client refusé : le bouton retrouve « Passer client »", (await bst.textContent()) === "Passer client" && !(await bst.isDisabled()));
    await c.close();
  }
  {
    /* la liste des comptes n'a pas pu se charger : le statut est quand meme pose apres une creation */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { listeKo: true });
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await aller(page, "#/clients/nouveau", 1500);   // v83 : Créer un accès est un écran à part (« + »)
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("liste en panne : la création pose quand même le statut « client »", db.fonctions.length === 1 && db.patchs.some(x => x.id === NOUVEAU && x.corps.statut === "client") && db.profils.find(x => x.id === NOUVEAU).statut === "client", JSON.stringify(db.patchs));
    await c.close();
  }
  {
    /* acces d'equipe demande, mais la base ne l'a pas accorde : le coach le sait */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { equipeRefusee: true });
    await page.goto(`http://localhost:${PORT}/#/clients/nouveau`); await attendre(page, 2000);   // v83 : Créer un accès est un écran à part (« + »)
    await page.fill("#n-prenom", "Eva"); await page.fill("#n-email", "eva@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.selectOption("#n-type", "coach"); await attendre(page, 200);
    await page.click("#n-creer"); await attendre(page, 500);
    await page.click('.modale [data-ui-b="1"]').catch(() => {}); await attendre(page, 1500);   // confirmation « Donner l'accès »
    const fen = await page.textContent(".modale").catch(() => "");
    ok("accès d'équipe refusé par la base : fenêtre « sans l'accès complet » et message", fen.includes("sans l'accès complet") && (await page.textContent("#n-msg")).includes("sans l'accès complet"), fen.slice(0, 120));
    await c.close();
  }
  {
    /* base sans colonne statut (avant migration) : rien ne change */
    const db = base({ sansStatut: true });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    /* comportement inchangé : sans statut, aucun prospect (la tuile est cherchée par le début de son libellé) */
    const tSans = (await lireTuiles(page)).find(x => /^Prospects/.test(x.lbl)) || {};
    ok("sans colonne statut : tuile des prospects = 0", tSans.val === "0", JSON.stringify(tSans));
    await aller(page, "#/clients", 1800);
    ok("sans colonne statut : ni pastille ni bouton de statut", !(await page.textContent("#liste-clients")).includes("Passer client") && !(await page.textContent("#liste-clients")).includes("Repasser prospect"));
    await aller(page, "#/clients/nouveau", 1500);   // v83 : Créer un accès est un écran à part (« + »)
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    const msgSans = await page.textContent("#n-msg");
    ok("sans colonne statut : création réussie, statut sans objet (PGRST204 ignoré), aucune alerte", db.fonctions.length === 1 && db.patchs.length === 1 && !("statut" in db.profils.find(x => x.id === NOUVEAU)) && msgSans.includes("Compte créé") && !msgSans.includes("prospect") && await page.locator(".modale").count() === 0, msgSans + " " + JSON.stringify(db.patchs));
    await c.close();
  }
  {
    /* Auth.estProspect */
    const db = base();
    const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("Auth.estProspect() vrai pour un prospect", await page.evaluate(() => Auth.estProspect()));
    await c.close();
    const { c: c2, page: p2 } = await contexte(b, { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") }, base());
    await p2.goto(`http://localhost:${PORT}/`); await attendre(p2, 1800);
    ok("Auth.estProspect() faux pour un client", !(await p2.evaluate(() => Auth.estProspect())));
    await c2.close();
  }

  /* ---------- B. Inscription libre ---------- */
  {
    inscriptionLibre = false;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await page.textContent("body"), pc = !!(await page.$("#pc"));
    ok("inscription fermée : pas de « Créer mon compte », #/inscription ouvre la connexion (v81 : jamais le parcours, #pc absent)", !t.includes("Créer mon compte") && t.includes("Connexion à ton espace") && !pc, (pc ? "parcours ouvert · " : "") + t.replace(/\s+/g, " ").slice(0, 160));
    await c.close();
  }
  {
    inscriptionLibre = true; legaux = LEGAUX_TEST;   // v64 : liens et version des CGU de test (CONFIG.textes_legaux)
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1200);
    ok("inscription ouverte : bouton « Créer mon compte » sur la connexion", !!(await page.$('[data-mode="inscription"]')));
    /* v81 (bloc 2) : « Pas encore de compte ? Créer mon compte » ouvre le parcours du prospect (plus l'écran unique) ; le texte
       de chaque écran est rangé dans vus, au fil du parcours */
    await page.click('[data-mode="inscription"]'); await page.waitForSelector('#pc[data-etape="accueil"]', { timeout: 8000 }).catch(() => {}); await attendre(page, 300);
    const vus = {};
    await noter(page, vus);
    const accueil = await page.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
      let textes = null; try { textes = JSON.stringify(PARCOURS_T); } catch (e) { }   // les textes des 11 écrans (js/parcours.js)
      return { etape: (document.getElementById("pc") || { dataset: {} }).dataset.etape || "", h: location.hash, titre: q("#pc h1"), sous: q("#pc .pc-sous"), bouton: q("#pc-go"),
        ancien: !!document.querySelector(".carte-co, #c-prenom, .co-sous, .co-note"), textes }; }).catch(e => ({ erreur: String(e) }));
    const textesOk = typeof accueil.textes === "string" && accueil.textes.length > 2000 && !/14\s*jours|(^|\D)7\s*jours|Challenge/.test(accueil.textes);
    const vuAccueil = (vus.accueil || {}).t || "";
    /* v52 (lot B) : plus de « 7 jours » ; titre et sous-titre de l'espace gratuit. v64 (brief V2 A1, A6) : sous-titre et bouton.
       v81 : l'accueil du parcours (TEXTES.md § 1) ; son sous-titre remplace « …poser tes bases en 14 jours… » ; plus aucun
       « 14 jours » (mission, point 15), ni à l'écran ni dans les textes du parcours */
    ok("inscription (v81 : le parcours, plus d'écran unique) : « Créer mon compte » ouvre l'accueil du parcours (#/inscription) : titre « Combien de lundis tu as dit « je commence » ? », sous-titre « Séances prêtes, journal alimentaire, recettes, suivi. Gratuit à vie pour les inscrits. » (avant : « …poser tes bases en 14 jours… »), bouton « Créer mon espace gratuit » ; plus d'ancien écran (.carte-co, #c-prenom, .co-sous) ; plus aucun « Challenge », « 7 jours » ni « 14 jours » à l'écran (hors compte à rebours) ni dans les textes des 11 écrans (PARCOURS_T)",
      accueil.etape === "accueil" && accueil.h === "#/inscription" && accueil.titre === TITRE_FR && accueil.sous === SOUS_FR && accueil.bouton === BOUTON_FR && !accueil.ancien
      && !!vuAccueil && !/14 jours|(^|\D)7 jours|Challenge/.test(vuAccueil) && textesOk, JSON.stringify(Object.assign({}, accueil, { textes: typeof accueil.textes === "string" ? accueil.textes.length + " car." : accueil.textes })) + " · " + vuAccueil.slice(0, 200));
    /* objectif, ce qui a coincé, dans 3 mois, « Tu es ? » (réponses par défaut de FT.parcours), jusqu'à l'écran du prénom */
    for (const e of ["objectif", "coince", "projection", "sexe", "prenom"]) { await FT.parcours(page, {}, e); await noter(page, vus); }
    /* avant : « Indique ton prénom. » sur l'écran unique. v81 : le prénom a son écran ; vide (ou fait d'espaces), « Continuer »
       reste inactif et, touché quand même, ne fait rien */
    const p0 = { champ: await page.$eval("#pc-prenom", e => e.value).catch(() => null), inactif: await inactif(page, "#pc-suivant") };
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const p1 = await etapeDe(page);
    await page.fill("#pc-prenom", "   "); const p2 = await inactif(page, "#pc-suivant");
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const p3 = await etapeDe(page);
    await page.fill("#pc-prenom", "Zoé"); const p4 = await inactif(page, "#pc-suivant");
    ok("inscription : prénom obligatoire (v81 : écran « On t’appelle comment ? » du parcours) — vide, puis fait d'espaces : « Continuer » inactif (aria-disabled) et, touché, on reste sur l'écran du prénom, rien n'est envoyé ; « Zoé » tapé : « Continuer » s'active",
      p0.champ === "" && p0.inactif === true && p1 === "prenom" && p2 === true && p3 === "prenom" && p4 === false && db.inscriptions.length === 0, JSON.stringify([p0, p1, p2, p3, p4, db.inscriptions.length]));
    await page.click("#pc-suivant"); await page.waitForSelector('#pc[data-etape="chargement"]', { timeout: 8000 }).catch(() => {}); await noter(page, vus);
    await FT.parcours(page, {}, "compte"); await noter(page, vus);
    /* v52 (lot B) : cases séparées, aucune cochée d'avance, et le champ Nom. v64 (brief V2 A) : UNE seule case obligatoire
       (conditions, son texte exact, point collé au 2e lien), la newsletter ; plus de case santé. v74 : plus de champ Nom (#c-nom
       absent). v76 : plus de « Rester connecté ». v81 : sur l'écran Compte du parcours ; les deux liens vers les PDF de test
       (lienLegal, nouvel onglet) ; la newsletter avec son texte v81 */
    const ecran = await page.evaluate(() => {
      const cas = id => { const e = document.getElementById(id); return e ? (e.checked ? "cochée" : "vide") : "absente"; };
      /* v64 : le texte de la case des conditions, et le nœud qui suit le 2e lien (« politique de confidentialité ») : il
         commence par le point final, sans espace (le point ne tombe plus seul sous le lien) */
      const lab = document.querySelector("#pc label.co-cgu > span"), l1 = document.getElementById("c-cgu-lien"), l2 = document.getElementById("c-politique-lien"), nl = document.querySelector("#pc label.co-newsletter > span");
      return { etape: (document.getElementById("pc") || { dataset: {} }).dataset.etape || "", cases: ["c-cgu", "c-sante", "c-newsletter", "c-rester"].map(cas), cocher: [...document.querySelectorAll("#pc input[type=checkbox]")].map(i => i.id),
        cgu: lab ? lab.textContent.replace(/\s+/g, " ").trim() : "", point: !!(l2 && l2.nextSibling && l2.nextSibling.nodeType === 3 && l2.nextSibling.textContent.startsWith(".")),
        liens: [l1, l2].map(a => a && a.tagName === "A" ? a.getAttribute("href") + (a.target === "_blank" ? " (nouvel onglet)" : "") : null),
        newsletter: nl ? nl.textContent.replace(/\s+/g, " ").trim() : "", nom: !!document.getElementById("c-nom") }; }).catch(e => ({ erreur: String(e) }));
    ok("inscription (v81 : écran Compte du parcours) : une seule case obligatoire, conditions (#c-cgu, « J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité. », point final collé au lien, liens vers les 2 PDF de test dans un nouvel onglet), puis newsletter (#c-newsletter, « Je veux recevoir les conseils et les offres de MHX Coaching par email. »), toutes deux vides ; plus de case santé (#c-sante absente) ; plus de « Rester connecté » (#c-rester absent, v76 : la session reste gardée) ; plus de champ Nom (#c-nom absent, v74)",
      ecran.etape === "compte" && JSON.stringify(ecran.cases) === '["vide","absente","vide","absente"]' && JSON.stringify(ecran.cocher) === '["c-cgu","c-newsletter"]' && ecran.cgu === CGU_FR && ecran.point
      && JSON.stringify(ecran.liens) === JSON.stringify([LEGAUX_TEST.cgu_pdf + " (nouvel onglet)", LEGAUX_TEST.confidentialite_pdf + " (nouvel onglet)"]) && ecran.newsletter === NEWSLETTER_FR && !ecran.nom, JSON.stringify(ecran));
    /* v52 (lot B) : le nom était obligatoire. v74 : plus de nom demandé. v81 : aucun champ Nom sur aucun écran du parcours (de
       l'accueil à l'écran Compte) ; le prénom donné, l'email valide, l'erreur de l'écran Compte est celle du mot de passe trop
       court, jamais « Indique ton nom. », et rien n'est envoyé (« Continuer » inactif, touché quand même) */
    await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "court");
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const e6 = await erreursCompte(page);
    ok("inscription : aucun nom demandé (v74 ; v81 : #c-nom absent de chaque écran du parcours, de l'accueil à l'écran Compte) — prénom donné, email valide, mot de passe court : l'erreur de l'écran Compte est celle du mot de passe (« 8 caractères minimum. »), aucune sur l'email, jamais « Indique ton nom. », rien n'est envoyé",
      e6.etape === "compte" && e6.mdp === "8 caractères minimum." && e6.email === "" && !/Indique ton nom/.test(e6.texte || "") && ETAPES_PC.slice(0, 8).every(k => vus[k] && !vus[k].nom) && db.inscriptions.length === 0,
      JSON.stringify(e6).slice(0, 200) + " · écrans vus : " + Object.keys(vus).join(",") + " · inscriptions " + db.inscriptions.length);
    await page.fill("#c-mdp", "abcdefg"); const b7 = await inactif(page, "#pc-suivant");
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const e7 = await erreursCompte(page);
    ok("inscription : 8 caractères minimum (v81 : écran Compte) — 7 caractères : « Continuer » reste inactif et, touché, « 8 caractères minimum. » sous le mot de passe ; on reste sur l'écran Compte, rien n'est envoyé",
      b7 === true && e7.mdp === "8 caractères minimum." && e7.etape === "compte" && db.inscriptions.length === 0, JSON.stringify([b7, e7.etape, e7.mdp, db.inscriptions.length]));
    await page.fill("#c-mdp", "motdepasse1"); const b8 = await inactif(page, "#pc-suivant");
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const e8 = await erreursCompte(page);
    ok("inscription : la case des conditions est obligatoire (v44 ; v81 : écran Compte) — email valide et 8 caractères, case vide : « Continuer » inactif et, touché, « Coche la case des conditions pour continuer. » (plus d'erreur sur l'email ni le mot de passe) ; on reste sur l'écran Compte, rien n'est envoyé",
      b8 === true && e8.cgu === "Coche la case des conditions pour continuer." && e8.mdp === "" && e8.email === "" && e8.etape === "compte" && db.inscriptions.length === 0, JSON.stringify([b8, e8.etape, e8.email, e8.mdp, e8.cgu, db.inscriptions.length]));
    /* v64 (brief V2 A3) : plus de case santé (avant, P0.5 : case obligatoire, « …données de santé… » au clic) : ni case, ni
       texte santé à l'écran, ni texte santé dans DECOUVERTE.inscription (FR et EN) ; la case des conditions cochée suffit.
       v81 : vérifié sur l'écran Compte et sur l'écran WhatsApp, où « Débloquer mon espace » crée le compte */
    const santeC = await santeIci(page);
    /* version des conditions attendue (v64, brief V2 A2 et K) : celle des CGU en PDF, CONFIG.textes_legaux.cgu_version (servie :
       LEGAUX_TEST), reprise par DECOUVERTE.accords.conditions ; avant : la version du texte court (confidentialite.version).
       v81 : et la version de la newsletter (DECOUVERTE.accords.newsletter, 2026-10-13 : texte de la case du parcours) */
    const version = await page.evaluate(() => ({ cgu: (CONFIG.textes_legaux || {}).cgu_version, accords: (DECOUVERTE.accords || {}).conditions, court: (DECOUVERTE.confidentialite || {}).version, newsletter: (DECOUVERTE.accords || {}).newsletter })).catch(e => ({ erreur: String(e) }));
    await page.check("#c-cgu"); const b9 = await inactif(page, "#pc-suivant");
    await page.click("#pc-suivant"); await page.waitForSelector('#pc[data-etape="whatsapp"]', { timeout: 8000 }).catch(() => {}); await noter(page, vus);
    const santeW = await santeIci(page);
    await page.fill("#c-tel", "06 39 98 00 99");   // plage réservée à la fiction
    await page.click("#c-go");
    /* le compte est créé, la page se recharge avec la session : « Ton espace » (Parcours.suite, après l'écriture d'intake) */
    await page.waitForSelector('#pc[data-etape="espace"]', { timeout: 15000 }).catch(() => {}); await attendre(page, 1200);
    ok("inscription : plus de case ni de texte santé (#c-sante absente, aucun « données de santé » à l'écran, sante_avant / sante_manque retirés des textes FR et EN ; v81 : écrans Compte et WhatsApp du parcours) ; la case des conditions cochée suffit (« Continuer » s'active), un compte se crée sans accord santé au toucher de « Débloquer mon espace » (v64, brief V2 A3 ; avant : case santé obligatoire, P0.5)",
      santeOk(santeC) && santeOk(santeW) && b9 === false && db.inscriptions.length === 1, JSON.stringify([santeC, santeW, b9]) + " · inscriptions envoyées : " + db.inscriptions.length);
    const ins = db.inscriptions[0] || {}, md = ins.data || {}, isoRe = /^\d{4}-\d{2}-\d{2}T/;
    /* v52 (lot B) : chaque accord daté ET versionné, newsletter (null si la case est vide) au lieu d'emails_suivi.
       v64 (brief V2 A) : EXACTEMENT prenom, nom, consentement, conditions_version (= CONFIG.textes_legaux.cgu_version), newsletter,
       newsletter_version ; plus de consentement_sante ni de sante_version (accord au premier usage). v74 : nom "".
       v81 : le prénom de l'écran « On t’appelle comment ? » ; newsletter_version « 2026-10-13 » (nouveau texte de la case ; avant
       2026-10-11) ; mêmes clés DANS LEUR ORDRE, corps sans autre clé (pas de jeton CAPTCHA : Turnstile éteint) */
    ok("inscription : POST /auth/v1/signup (v81 : au toucher de « Débloquer mon espace », écran WhatsApp du parcours) avec le prénom de l'écran « On t’appelle comment ? » et un nom vide (v74), consentement daté + version des CGU (CONFIG.textes_legaux.cgu_version, « 2026-10-15 » servie, = DECOUVERTE.accords.conditions, ≠ version du texte court), newsletter null (case vide) + version « 2026-10-13 » (v81, = DECOUVERTE.accords.newsletter), aucun accord santé (ni consentement_sante ni sante_version), plus d'emails_suivi ; exactement prenom, nom, consentement, conditions_version, newsletter, newsletter_version, dans cet ordre (v44, v52, v64, v81)",
      db.inscriptions.length === 1 && md.prenom === "Zoé" && md.nom === "" && isoRe.test(md.consentement || "") && version.cgu === LEGAUX_TEST.cgu_version && version.accords === LEGAUX_TEST.cgu_version && md.conditions_version === LEGAUX_TEST.cgu_version && !!version.court && md.conditions_version !== version.court
      && md.newsletter === null && md.newsletter_version === "2026-10-13" && version.newsletter === "2026-10-13" && JSON.stringify(Object.keys(md)) === '["prenom","nom","consentement","conditions_version","newsletter","newsletter_version"]'
      && JSON.stringify(Object.keys(ins)) === '["email","password","data"]' && ins.email === "nouvelle@exemple.fr" && ins.password === "motdepasse1",
      db.inscriptions.length + " " + JSON.stringify(Object.assign({}, ins, { password: ins.password ? "(" + ins.password.length + " car.)" : ins.password })) + " attendu " + JSON.stringify(version));
    ok("inscription : connecté ensuite (v81 : page rechargée avec la session), et prospect", await page.evaluate(() => Auth.connecte() && Auth.estProspect()).catch(() => false));
    /* avant (v52, lots C et D) : le compte neuf arrivait sur la Découverte, questionnaire court à remplir (#q-probleme, #dc-voir),
       sans « Jour n/7 » ni bouton Calendly. v81 : il arrive sur « Ton espace » du parcours (les réponses sont déjà données) ;
       ni questionnaire, ni page « Ton plan d'action », ni navigation, ni bouton Calendly (le cadeau vient après) */
    const arrivee = await page.evaluate(() => { const pc = document.getElementById("pc"), n = s => String(s || "").replace(/\s+/g, " ").trim(), q = s => { const e = document.querySelector(s); return e ? n(e.textContent) : ""; };
      const pr = document.querySelector("#pc .pc-progres");
      return { h: location.hash, etape: pc ? pc.dataset.etape : "", progres: pr ? pr.getAttribute("aria-valuenow") : null, titre: q("#pc h1"), bouton: q("#pc-suivant"), t: pc ? n(pc.textContent) : "",
        questionnaire: !!document.getElementById("q-probleme"), voir: !!document.getElementById("dc-voir"), bilan: !!document.getElementById("dc-bilan"), nav: !!document.querySelector(".topbar, #barre-bas"),
        installe: !!document.getElementById("installe"), cal: document.querySelectorAll('a[href*="calendly"], [data-dc-cal]').length }; }).catch(e => ({ erreur: String(e) }));
    await noter(page, vus);
    /* le cadeau (100 %), affiché sans être touché : son texte aussi, pour l'absence de « 14 jours » sur les 11 écrans */
    await page.click("#pc-suivant").catch(() => {}); await page.waitForSelector('#pc[data-etape="cadeau"]', { timeout: 8000 }).catch(() => {}); await noter(page, vus); await attendre(page, 600);
    const tous = ETAPES_PC.filter(k => vus[k]).map(k => k + " : " + vus[k].t).join(" | ");
    ok("inscription (v81) : arrivée du compte neuf sur « Ton espace » du parcours (90 %, « Zoé, voici ce qui t’attend dans ton espace. », « Entrer dans mon espace »), page rechargée avec la session : plus le questionnaire de l'app (#q-probleme, #dc-voir absents), ni la page « Ton plan d'action » (#dc-bilan), ni navigation, ni bannière d'installation, ni « Jour n/7 », aucun bouton Calendly ; et sur les 11 écrans du parcours vus (accueil → cadeau, hors compte à rebours) : plus aucun « 14 jours », « 7 jours » ni « Challenge »",
      arrivee.etape === "espace" && arrivee.progres === "90" && arrivee.titre === "Zoé, voici ce qui t’attend dans ton espace." && arrivee.bouton === "Entrer dans mon espace" && !arrivee.questionnaire && !arrivee.voir && !arrivee.bilan && !arrivee.nav && !arrivee.installe
      && !/Jour \d/.test(arrivee.t || "") && arrivee.cal === 0 && ETAPES_PC.every(k => vus[k] && !!vus[k].t) && !/14 jours|(^|\D)7 jours|Challenge/.test(tous),
      JSON.stringify(Object.assign({}, arrivee, { t: (arrivee.t || "").slice(0, 120) })) + " · écrans vus : " + Object.keys(vus).join(",") + " · " + ((tous.match(/[^|]*(14 jours|7 jours|Challenge)[^|]*/) || [""])[0]).slice(0, 160));
    /* avant (v52, lot B) : à l'arrivée, la seule écriture était la copie du choix de la newsletter (clé emails). v81 : le numéro
       est demandé par le parcours (écran WhatsApp) : clé contact écrite UNE fois à la création ; puis, page rechargée, la copie
       emails et les réponses du parcours en UNE écriture d'intake (après lecture) ; rien d'autre (ni challenge : il n'est écrit
       qu'au toucher d'un bouton du cadeau) */
    const ecrArrivee = db.ecritures.filter(e => e.table === "donnees");
    ok("inscription (v81) : écritures dans donnees du compte neuf, de « Débloquer mon espace » au cadeau (affiché, pas touché) : la clé contact UNE fois (le numéro, à la création), la copie de la newsletter (clé emails) UNE fois et les réponses du parcours en UNE écriture d'intake ; rien d'autre (ni challenge, ni autre clé) ; avant la v81 : la seule copie emails",
      ecrArrivee.map(e => e.outil).sort().join(",") === "contact,emails,intake" && ecrArrivee.every(e => e.user_id === INSCRIT && e.m === "POST"), JSON.stringify(ecrArrivee).slice(0, 300));
    await c.close();
    legaux = null;
  }
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { inscriptionKo: true, langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await page.waitForSelector('#pc[data-etape="accueil"]', { timeout: 10000 }).catch(() => {}); await attendre(page, 300);
    /* v52 (lot B) : espace gratuit, plus de 7 jours ; champ « Your last name ». v64 (brief V2 A1, A2, A6) : sous-titre, case
       des conditions « I'm 18 or older… », « Create my free account », plus aucun « health data ». v74 : plus de « Your last name ».
       v81 : le parcours en anglais — accueil (titre, sous-titre sans « 14 days », « Create my free space »), écran du prénom
       (« Your first name »), écran Compte (la case des conditions) ; de l'accueil à l'écran Compte, aucun champ Nom ni « Your
       last name », « health data », « Challenge », « 7 days » ou « 14 days » (hors compte à rebours) */
    const vusEn = {};
    await noter(page, vusEn);
    const accEn = await page.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
      return { etape: (document.getElementById("pc") || { dataset: {} }).dataset.etape || "", titre: q("#pc h1"), sous: q("#pc .pc-sous"), bouton: q("#pc-go") }; }).catch(e => ({ erreur: String(e) }));
    let prenomEn = "";
    for (const e of ["objectif", "coince", "projection", "sexe", "prenom", "chargement", "compte"]) {
      await FT.parcours(page, {}, e); await noter(page, vusEn);
      if (e === "prenom") prenomEn = await page.$eval('label[for="pc-prenom"]', l => l.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
    }
    const cguEn = await page.$eval("#pc label.co-cgu > span", s => s.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
    const tousEn = ETAPES_PC.filter(k => vusEn[k]).map(k => k + " : " + vusEn[k].t).join(" | ");
    ok("inscription en anglais (v81 : le parcours) : accueil « How many Mondays have you said “I’ll start”? », sous-titre « Ready-made workouts, food diary, recipes, progress tracking. Free for life when you sign up. » (avant : « …in 14 days… »), « Create my free space » ; écran du prénom « Your first name » (plus de « Your last name », v74 ; #c-nom absent) ; écran Compte : case « I'm 18 or older and I accept the Terms of Use and the Privacy Policy. » ; de l'accueil à l'écran Compte, plus aucun « health data », « Challenge », « 7 days » ni « 14 days »",
      accEn.etape === "accueil" && accEn.titre === TITRE_EN && accEn.sous === SOUS_EN && accEn.bouton === BOUTON_EN && prenomEn === "Your first name" && cguEn === CGU_EN
      && ETAPES_PC.slice(0, 8).every(k => vusEn[k] && !vusEn[k].nom) && !/Your last name/i.test(tousEn) && !/health data/i.test(tousEn) && !tousEn.includes("Challenge") && !/(^|\D)7 days|14 days/.test(tousEn),
      JSON.stringify([accEn, prenomEn, cguEn, Object.keys(vusEn)]) + " · " + tousEn.slice(0, 200));
    /* v64 (brief V2 A) : la seule case obligatoire est celle des conditions (avant : la case santé manquante → « Accept the
       processing of your health data ») : sans elle, « Tick the terms box to continue. » et rien n'est envoyé. v81 : sur l'écran
       Compte, « Continuer » reste inactif (touché quand même : le message) ; la case cochée, il s'active (newsletter vide) */
    await page.fill("#c-email", "z@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");   // v74 : plus de nom
    const b0 = await inactif(page, "#pc-suivant");
    await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
    const errEn = await erreursCompte(page), santeEn = !!(await page.$("#c-sante"));
    await page.check("#c-cgu"); const b1 = await inactif(page, "#pc-suivant"), nlEn = await page.isChecked("#c-newsletter").catch(() => null);
    ok("inscription en anglais : case des conditions manquante → « Tick the terms box to continue. » (v81 : écran Compte, « Continuer » inactif), on reste sur l'écran Compte, rien n'est envoyé ; c'est la seule case obligatoire (cochée, « Continuer » s'active, newsletter vide ; plus de case santé, #c-sante absente)",
      b0 === true && errEn.cgu === "Tick the terms box to continue." && errEn.etape === "compte" && db.inscriptions.length === 0 && !santeEn && b1 === false && nlEn === false,
      JSON.stringify([b0, errEn.etape, errEn.cgu, b1, nlEn, db.inscriptions.length]) + " · #c-sante " + (santeEn ? "présente" : "absente"));
    await page.click("#pc-suivant"); await page.waitForSelector('#pc[data-etape="whatsapp"]', { timeout: 8000 }).catch(() => {});
    await page.fill("#c-tel", "0639980099"); await page.click("#c-go");
    const refusEn = await messageServeur(page);
    ok("inscription refusée par Supabase : « Sign-ups are not open yet. » (v81 : écran WhatsApp du parcours, au toucher de « Débloquer mon espace » ; on y reste)", refusEn.includes("Sign-ups are not open yet") && db.inscriptions.length === 1 && (await etapeDe(page)) === "whatsapp", refusEn + " · inscriptions " + db.inscriptions.length);
    await c.close();
  }
  /* v52 (reprise de la nuit du 28/09) : erreurs d'envoi d'email (SMTP Brevo en panne, limite horaire du projet) : jamais l'anglais brut.
     v81 : la création de compte est au bout du parcours (« Débloquer mon espace », écran WhatsApp, message dans #co-err) */
  for (const [quoi, err, attendu] of [
    ["serveur d'emails en panne", { status: 500, msg: "Error sending confirmation email" }, "L'email n'a pas pu partir (souci de notre côté). Réessaie dans un moment ; si ça continue, écris-moi sur Instagram (@lucasmhxcoaching)."],
    ["limite horaire d'emails du projet", { status: 429, msg: "email rate limit exceeded" }, "Beaucoup d'inscriptions en ce moment : réessaie dans une heure."],
    ["limite par adresse (inchangée)", { status: 429, msg: "For security purposes, you can only request this after 42 seconds." }, "Trop de demandes d'un coup : réessaie dans une minute."]]) {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { inscriptionErreur: err });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await page.waitForSelector("#pc", { timeout: 10000 }).catch(() => {});
    await FT.parcours(page, { prenom: "Zoé", email: "z@exemple.fr", mdp: "motdepasse1", tel: "0639980099" }, "cree");   // v64 : plus de case santé ; v74 : plus de nom
    const t = await messageServeur(page);
    ok("inscription, " + quoi + " (« " + err.msg + " ») : message en français, jamais le texte anglais brut (v81 : écran WhatsApp du parcours)", t.includes(attendu) && !t.includes(err.msg) && db.inscriptions.length === 1, t + " · inscriptions " + db.inscriptions.length);
    await c.close();
  }
  /* v55 : écran de connexion, inscription ouverte : « Mot de passe oublié ? » et « Créer mon compte » bien placés sur
     téléphone. La v54 avait mis un margin-left de 18 px sur le second lien : côte à côte, un espace ; mais à 320 px, où les
     deux liens passent sur deux lignes, le second restait décalé de 9 px vers la droite, à 4 px sous le premier. v55
     (css/communs.css) : une marge égale autour de chaque lien. Vérifié sans dépendre de la police (celle de GitHub peut
     différer, les liens peuvent donc tenir ou non sur une ligne) : côte à côte (hauts à moins de 3 px l'un de l'autre) →
     12 à 24 px entre les deux et la paire centrée dans .bascule à 3 px près ; sur deux lignes (le second commence au moins
     6 px sous le bas du premier) → chacun centré à 3 px près. Une seule vérification pour les trois largeurs. */
  inscriptionLibre = true;
  try {
    const mesures = [];
    try {
      for (const largeur of [320, 375, 390]) {
        const { c, page } = await contexte(b, null, base(), { viewport: { width: largeur, height: 800 } });
        try {
          await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.bascule [data-mode="inscription"]', { timeout: 8000 }); await attendre(page, 600);
          mesures.push(await page.evaluate(() => {
            const bas = document.querySelector(".bascule"), bs = bas ? Array.from(bas.querySelectorAll("button")) : [];
            if (bs.length !== 2) return { largeur: innerWidth, erreur: bs.length + " lien(s) dans .bascule", bon: false };
            const B = bas.getBoundingClientRect(), [a, z] = bs.map(e => e.getBoundingClientRect());
            const centre = r => (r.left + r.right) / 2, cB = centre(B), arr = x => Math.round(x * 10) / 10;
            const liens = bs.map(e => e.textContent.replace(/[\u00a0\u202f]/g, " ").trim());
            const ligne = Math.abs(a.top - z.top) < 3, deuxLignes = z.top >= a.bottom + 6;
            const ecart = z.left - a.right, decalPaire = (a.left + z.right) / 2 - cB, decal = [centre(a) - cB, centre(z) - cB];
            const place = ligne ? ecart >= 12 && ecart <= 24 && Math.abs(decalPaire) <= 3 : deuxLignes && decal.every(d => Math.abs(d) <= 3);
            return { largeur: innerWidth, liens, disposition: ligne ? "côte à côte" : deuxLignes ? "deux lignes" : "ni l'un ni l'autre",
              ecart: arr(ecart), dessous: arr(z.top - a.bottom), decalPaire: arr(decalPaire), decal: decal.map(arr),
              bon: liens[0] === "Mot de passe oublié ?" && liens[1] === "Pas encore de compte ? Créer mon compte" && place };   // v72 (B) : le texte du lien
          }));
        } finally { await c.close(); }
      }
    } catch (e) { mesures.push({ erreur: String((e && e.message) || e).split("\n")[0].slice(0, 160), bon: false }); }
    ok("connexion, inscription ouverte, téléphone 320 / 375 / 390 px : « Mot de passe oublié ? » et « Pas encore de compte ? Créer mon compte » (v72 : texte du lien) côte à côte (12 à 24 px entre les deux, paire centrée à 3 px près) ou sur deux lignes (au moins 6 px entre les deux, chacun centré à 3 px près)",
      mesures.length === 3 && mesures.every(m => m.bon), JSON.stringify(mesures));
  } finally { inscriptionLibre = false; }
  inscriptionLibre = false;
  /* v52 (chantier 1, lot B — décision de Lucas : l'app n'envoie aucun email pour l'instant) : « Mot de passe oublié » ne
     demande plus de lien ; il donne l'adresse du coach (mailto), sans appel à /auth/v1/recover. Les deux vérifications
     des erreurs d'envoi du mot de passe oublié (panne, limite horaire) sont remplacées par celles-ci. */
  for (const langue of ["", "en"]) {
    const db = base();
    const { c, page } = await contexte(b, null, db, { langue });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1000);
    await page.click('[data-mode="oubli"]'); await attendre(page, 400);
    await page.keyboard.press("Enter"); await attendre(page, 800);
    const t = (await page.textContent("#co-oubli").catch(() => "")).replace(/\s+/g, " ").trim();
    const href = await page.getAttribute("#co-oubli a", "href").catch(() => "");
    const att = langue ? "Write to us at mhx.coaching@gmail.com, we'll get you back in quickly." : "Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement.";
    ok(`mot de passe oublié${langue ? " (anglais)" : ""} : « ${att} » (mailto), ni champ ni bouton d'envoi, aucun appel à /auth/v1/recover (même avec Entrée)`, t === att && href === "mailto:mhx.coaching@gmail.com" && !(await page.$("#c-email")) && !(await page.$("#c-go")) && !db.recover, t + " · " + href + " · appels recover " + (db.recover || 0));
    await c.close();
  }
  {
    /* changement d'adresse : le DERNIER lien revient avec #access_token=…&type=email_change — le changement est fait */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#access_token=abc.def.ghi&expires_in=3600&refresh_token=xyz&token_type=bearer&type=email_change`); await attendre(page, 1200);
    const t = await page.textContent("#co-err").catch(() => "");
    ok("changement d'adresse, dernier lien cliqué (déconnecté) : « Ton adresse email est changée : utilise la nouvelle pour te connecter. », jetons retirés de l'adresse", t.includes("Ton adresse email est changée : utilise la nouvelle pour te connecter.") && !/access_token/.test(page.url()), t + " · " + page.url());
    await c.close();
  }
  {
    /* changement d'adresse (« Secure email change ») : le PREMIER des deux liens revient sans jeton, avec #message=… */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#message=Confirmation+link+accepted.++Please+proceed+to+confirm+link+sent+to+the+other+email`); await attendre(page, 1200);
    const t = await page.textContent("#co-err").catch(() => "");
    ok("changement d'adresse, premier lien cliqué (déconnecté) : « Premier lien accepté : clique maintenant celui reçu sur ton autre adresse… », adresse nettoyée, jamais l'anglais", t.includes("Premier lien accepté : clique maintenant celui reçu sur ton autre adresse.") && !/Confirmation link accepted/.test(await page.textContent("body")) && !/message=/.test(page.url()), t + " · " + page.url());
    await c.close();
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})().catch(e => {   // v81 : une étape qui casse (écran attendu jamais affiché…) montre les vérifications déjà faites, au lieu de 0 ✓ muet
  console.log(res.join("\n")); console.log("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 200)); process.exit(1);
});
