/* verif90 — v88 (mission de nuit du 14/10/2026, lot 3 ; demande de Lucas du 13/10) : L'ACCORD SANTÉ REDEMANDÉ APRÈS UN
   CHANGEMENT DE LA POLITIQUE (RappelSante, js/auth-store.js), de bout en bout dans un vrai navigateur, comptes fictifs
   (« pNN@exemple.fr », clients des fixtures), Supabase simulé AVEC les métadonnées du compte (infrastructure de verif71 :
   PUT /auth/v1/user { data } FUSIONNE data, GET les rend ; pannes au choix). La version actuelle de la politique est celle
   que la suite sert (CONFIG.textes_legaux.cgu_version = 2026-10-15, retouche du fichier servi, jamais du disque).
   A. un prospect dont l'accord date d'une version plus ancienne (inscrit v55 : 2026-09-28b) : à l'ouverture, UNE fenêtre
      (.modale.rappel-sante, role=dialog), après UNE relecture du compte (GET /auth/v1/user) ; textes FR exacts, la phrase
      d'accord de la carte, le lien vers la politique (target=_blank, rel=noopener), « Plus tard » puis « J'accepte » ;
      rien d'écrit avant un choix ;
   B. « J'accepte » : UN PUT exact (consentement_sante = maintenant, sante_version = la version actuelle, sante_ecran =
      « nouvelle-version », le tout premier accord gardé dans sante_premier_accord, sante_premiere_version et sante_premier_ecran), les autres
      métadonnées gardées, le message, la session rangée à jour, l'export des données avec les deux nouveaux champs ; page
      rechargée : plus de fenêtre, plus de relecture ;
   C. « Plus tard » : rien d'écrit dans le compte, l'appareil retient la date (mhx_rappel_politique|<id>) ; l'accord d'avant
      reste valable (le calculateur s'ouvre sans la carte, champs actifs) ; rechargée le jour même et 6 jours après : rien ;
      7 jours après : la fenêtre revient ; la déconnexion retire la date ;
   D. Échap ou un toucher à côté = « Plus tard » ;
   E. pannes : PUT refusé (500) ou réponse sans la nouvelle version → message d'échec, rien de retenu, la fenêtre revient à
      l'ouverture suivante ; relecture du compte ratée (500, coupure) ou appareil hors ligne : pas de fenêtre, rien d'écrit ;
   F. qui ne voit rien : accord déjà à la version actuelle, prospect sans accord (la carte « Ton accord, une seule fois »
      reste), version illisible ou plus récente, le coach (même avec un ancien accord dans ses métadonnées), le coach dans
      la fiche d'un client ; qui la voit : un client avec un ancien accord, un accord sans version ;
   G. accord donné sur un autre appareil (la session de l'appareil porte l'ancienne version, le compte la nouvelle) : pas de
      fenêtre, la session de l'appareil mise à jour ;
   H. anglais (US) : textes EN exacts, message EN ;
   I. 320 px : la fenêtre tient dans l'écran (aucun débordement), boutons de 44 px au moins ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Sur la version d'avant (v85) : aucune fenêtre ; 3 ✓ seulement (A3, F3, Z1), les autres en échec ou blocs interrompus.
   Usage : node verif90.js ../index.html
           VERIF90_PORT=10071 node verif90.js ../index.html     (autre port, si 10070 est pris)
           VERIF90_BLOCS="A.,C." node verif90.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF90_PORT || 10070;
const BLOCS = (process.env.VERIF90_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF90_CAPTURES ? path.resolve(process.env.VERIF90_CAPTURES) : "";
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 700 }, ORDI = { width: 1280, height: 900 };

/* ---------- les textes légaux SERVIS (CONFIG.textes_legaux de js/config.js) : la suite remplace les 3 valeurs dans le
   fichier servi (jamais sur le disque) ; test par défaut, « à compléter » ou invalides le temps du bloc M ---------- */
const NOMS_LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-90/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-90/view", cgu_version: "2026-10-15" };
const LEGAUX_ABSENTS = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
const LEGAUX_INVALIDES = { cgu_pdf: "ftp://exemple.fr/cgu.pdf", confidentialite_pdf: "javascript:alert(90)", cgu_version: "2026-10-15" };
/* relecture (v64) : la version du texte court (DECOUVERTE.confidentialite.version), lue dans js/config.js du disque exécuté
   seul (vm) : sante_version doit en être DISTINCTE (putOk) — sinon une version prise au mauvais endroit passerait */
const VERSION_COURT = (() => { try { const ctx = {}; require("vm").runInNewContext(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8") + "\n;this.v = DECOUVERTE.confidentialite.version;", ctx, { timeout: 2000 }); return typeof ctx.v === "string" ? ctx.v : null; } catch (e) { return null; } })();
let LEGAUX = LEGAUX_TEST;
/* la valeur entre guillemets collée à « nom: » (la première occurrence : il n'y en a qu'une, bloc 0) */
const motifLegal = (n, g) => new RegExp("\\b(" + n + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function poserLegaux(texte, valeurs){ let t = String(texte); for (const n of NOMS_LEGAUX) t = t.replace(motifLegal(n), (x, a) => a + JSON.stringify(String(valeurs[n]))); return t; }
const valeursLegales = (texte, n) => Array.from(String(texte).matchAll(motifLegal(n, true)), m => m[2]);

/* ---------- la page servie : le fichier testé (page, css/ et js/), config.js avec les textes légaux de la suite ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, t => poserLegaux(t, LEGAUX))) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
const blocsLances = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  blocsLances.push(nom);
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); LEGAUX = LEGAUX_TEST; }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- les textes attendus (brief V2, B, mot pour mot ; échec : DECOUVERTE.emails.refuse, contrat du lot 5) ----------
   v64 (décision de Lucas du 30/09) : la carte s'affiche aussi sur « Organise ta diète » : les repas prévus y sont ajoutés dans
   le texte, la phrase d'accord (entre parenthèses, après « calculs ») et le message après « Pas maintenant » ; le reste mot pour
   mot. En anglais, le nom de l'outil tel qu'il s'affiche (la Speed Formation n'est pas traduite) : “Organise ta diète”.
   v79 (mission de Lucas du 13/10) : + les aliments notés dans le journal alimentaire, dans les 3 textes (FR et EN), le reste
   mot pour mot. */
const SANTE = {
  fr: { titre: "Ton accord, une seule fois",
    texte: "Pour calculer tes calories et suivre ta progression, l'app enregistre ton poids, ta taille, tes mensurations, tes calculs, les repas prévus dans « Organise ta diète » et les aliments notés dans ton journal alimentaire. Ce sont des données de santé : elles restent privées, visibles seulement par toi et ton coach, et tu peux les supprimer à tout moment.",
    phrase: "J'accepte que mes données de santé (poids, taille, mensurations, calculs, repas prévus dans « Organise ta diète », aliments notés dans le journal) servent à mes calculs et à mon suivi.",
    oui: "J'accepte", non: "Pas maintenant", lien: "En savoir plus : politique de confidentialité",
    refus: "Pas de souci. Sans ton accord, le calculateur, le suivi, l'organisation de la diète et le journal alimentaire restent en pause. Le reste de ton espace reste ouvert, et tu peux changer d'avis quand tu veux.",
    echec: "Non enregistré : réessaie dans un instant." },
  en: { titre: "Your consent, just once",
    texte: "To calculate your calories and track your progress, the app saves your weight, height, measurements, results, the meals you plan in “Organise ta diète” and the foods you log in your food diary. This is health data: it stays private, visible only to you and your coach, and you can delete it at any time.",
    phrase: "I agree that my health data (weight, height, measurements, results, meals planned in “Organise ta diète”, foods logged in the diary) is used for my calculations and tracking.",
    oui: "I agree", non: "Not now", lien: "Learn more: Privacy Policy",
    refus: "No problem. Without your consent, the calculator, tracking, diet planning and food diary stay paused. The rest of your space stays open, and you can change your mind anytime.",
    echec: "Not saved: try again in a moment." }
};

/* ---------- les personnes ---------- */
const MDP = "MotDePasse-fictif-90";
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000090" + String(k).padStart(2, "0");   // verif71 : …71kk (une plage par suite)
const EMAIL = k => "p" + k + "@exemple.fr";
/* métadonnées d'un prospect inscrit en v64 (une seule case : conditions, newsletter non cochée ; AUCUN accord santé) */
const META_V64 = () => ({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-10-01", newsletter: null, newsletter_version: "2026-09-30" });
/* un prospect inscrit de la v52 à la v63 (case « données de santé » cochée à l'inscription) */
const META_V55 = extra => Object.assign({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-09-29", consentement_sante: avant(3 * J), sante_version: "2026-09-28b", newsletter: null, newsletter_version: "2026-09-28c" }, extra || {});
/* le choix de la newsletter déjà recopié dans la clé emails (Accords.copierEmails n'écrit donc rien au démarrage) */
const EMAILS0 = { newsletter: false, maj: avant(3 * J), version: "2026-09-30", source: "inscription" };
const AVEC_CHOIX = k => ({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: EMAIL(k), bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } });
const FO = extra => Object.assign({ coches: {}, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, extra || {});
const LIGNE = (f, p, g, l) => ({ f, p, g, l });
const DIETE_REMPLIE = { "1": { "0": [LIGNE(true, "30", "40", "10"), LIGNE(false, "25", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", "")] } };
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const ZONES = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const MENS1 = { dstart: "2026-01-05", pstart: 70.5, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [{ sem: 1, date: "2026-01-12", poids: 70.1, vals: { "4": 80 } }] };
/* des chiffres déjà connus (ancien questionnaire) : un calculateur LANCÉ affiche aussitôt un résultat de départ */
const CHIFFRES_Q = { age: 30, taille: 165, poids: 60, sexe: "Femme", seances: 3 };
/* un prospect : opts.meta (métadonnées du compte en base ; META_V64 par défaut), opts.intake (ajouté au questionnaire),
   opts.donnees (en plus de intake et emails) */
const compte = (k, opts) => { opts = opts || {}; return { id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(4 * J), email: EMAIL(k), meta: opts.meta === undefined ? META_V64() : opts.meta,
  donnees: [["intake", Object.assign(AVEC_CHOIX(k), opts.intake || {})], ["emails", EMAILS0]].concat(opts.donnees || []) }; };
/* la session de l'appareil : par défaut, les métadonnées d'un inscrit v64 (sans accord) */
const quiP = (k, meta) => qui(PID(k), EMAIL(k), meta === undefined ? META_V64() : meta);
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;

/* ---------- le décor : fixtures.js (coach, clients) + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree, email, meta, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], authUser: [], connexions: [], renouvellements: [], bloquees: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [F.IDS.c1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [F.IDS.c1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    panneGet: null, pannePut: null, retardPut: 0, retardGet: 0, retardMajLe: null, majLeLents: [],
    /* n : numéro d'ordre commun aux lectures et aux écritures de donnees (qui passe avant qui) ; getsLents : les réponses
       des GET /auth/v1/user retardés (métadonnées LUES À L'ARRIVÉE de la requête) ; putsFinis : l'instant de chaque réponse
       réussie d'un PUT /auth/v1/user */
    n: 0, getsLents: [], putsFinis: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    db.meta[x.id] = clone(x.meta || {});
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif68) + les métadonnées du compte ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
const liste = t => String(t).replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
function parOutil(l, o){
  if (o.startsWith("eq.")) return l.filter(x => x.outil === o.slice(3));
  if (o.startsWith("in.")) { const k = liste(o.slice(3)); return l.filter(x => k.includes(x.outil)); }
  if (o.startsWith("not.in.")) { const k = liste(o.slice(7)); return l.filter(x => !k.includes(x.outil)); }
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db, appareil){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  /* appareil hors ligne (couper) : la requête ne part pas (le gestionnaire de routes de Playwright répond même quand le
     contexte est hors ligne : c'est donc ici qu'elle échoue, sans jamais atteindre le serveur) */
  if (appareil && appareil.horsLigne) { db.bloquees.push(m + " " + p); return r.abort("internetdisconnected").catch(() => {}); }
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  /* jetons : connexion par mot de passe (les métadonnées de la base) ; renouvellement (idem) — jamais comptés comme écriture */
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {};
    if (q.get("grant_type") === "password") {
      const e = String(c.email || "").trim().toLowerCase(); db.connexions.push(e);
      const id = Object.keys(db.emails).find(x => db.emails[x] === e);
      if (!id || c.password !== MDP) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      return json(session(id, db.emails[id], db.meta[id]));
    }
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    db.renouvellements.push(id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  /* le compte : GET rend les métadonnées de la base ; PUT { data } les FUSIONNE (null supprime la clé) et les rend. Pannes :
     un statut (400, 500…), "coupure" (réseau coupé), pour le GET "vide" ({}) ou "sans" (sans user_metadata), pour le PUT
     "sans accord" (200, les métadonnées du compte SANS rien fusionner). Lenteurs : retardPut (fusion à la fin du délai),
     retardGet (métadonnées lues à l'ARRIVÉE de la requête, rendues à la fin du délai : une réponse périmée) */
  if (p === "/auth/v1/user") {
    const c = corps();
    db.authUser.push({ m, par: moi, corps: clone(c), q: url.search });
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    const panne = m === "GET" ? db.panneGet : db.pannePut;
    if (panne === "coupure") return r.abort("failed").catch(() => {});
    if (typeof panne === "number") return json({ msg: "panne simulée", code: panne }, panne);
    if (m === "GET" && db.retardGet) {
      const lu = clone(db.meta[moi] || {}), ms = db.retardGet;
      await new Promise(k => setTimeout(k, ms));
      db.getsLents.push({ meta: clone(lu), t: Date.now() });
      return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: lu });
    }
    if (m === "PUT" && db.retardPut) await new Promise(k => setTimeout(k, db.retardPut));
    const meta = db.meta[moi] || (db.meta[moi] = {});
    const uu = { id: moi, email: db.emails[moi] || "", role: "authenticated" };
    if (m === "PUT" && panne === "sans accord") return json(Object.assign(uu, { user_metadata: clone(meta) }));
    if (m === "PUT" && c && c.data && typeof c.data === "object") Object.keys(c.data).forEach(k => { if (c.data[k] === null) delete meta[k]; else meta[k] = clone(c.data[k]); });
    if (m === "PUT") db.putsFinis.push(Date.now());
    if (m === "GET" && panne === "vide") return json({});
    if (m === "GET" && panne === "sans") return json(uu);
    return json(Object.assign(uu, { user_metadata: clone(meta) }));
  }
  if (p.startsWith("/auth/v1/")) return json({});   // logout…
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*", n: ++db.n });
      /* reprise lente (bloc V) : la lecture maj_le d'une clé (celle de Store.reprendre) répond après ms (minuteur qui ne
         retient pas la fin de la suite) ; majLeLents : l'instant de chaque réponse */
      if (db.retardMajLe && (q.get("select") || "") === "maj_le" && o === "eq." + db.retardMajLe.outil) {
        const ms = db.retardMajLe.ms; await new Promise(k => setTimeout(k, ms).unref()); db.majLeLents.push(Date.now());
      }
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, n: ++db.n }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    db.donnees = db.donnees.filter(x => !(x.user_id === uid && x.outil === cleEq && permis(moi, coach, x)));
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ----------
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" : un ancien choix « clair » rangé dans
   mhx_theme, que la v80 ignore — tout en sombre ; rien de rangé par défaut), rangement ("session" :
   « Rester connecté » décoché, la session dans sessionStorage) */
const ERREURS = [];   // erreurs de console et erreurs JS de toute la suite (bloc Z)
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  const appareil = { horsLigne: false };
  await c.route("**/*", r => repondre(r, who, db, appareil));
  await c.addInitScript(({ s, langue, theme, rangement }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) (rangement === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "", rangement: opts.rangement || "" });
  await c.clock.install({ time: T0 });   // midi du jour du lancement, puis l'horloge tourne
  const page = surveiller(await c.newPage());
  return { c, page, appareil };
}
/* l'appareil passe hors ligne (navigator.onLine faux, événements offline / online) ou revient */
async function couper(x, oui){ x.appareil.horsLigne = !!oui; await x.c.setOffline(!!oui); }
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  /* une ressource refusée (4xx/5xx simulés), une requête coupée ou hors ligne (simulés) : le navigateur le note, ce n'est
     pas une erreur de l'app */
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* attend (côté suite) qu'une condition sur le faux Supabase devienne vraie ; faux au bout de ms */
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!f(); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const ACCUEIL = "#/decouverte";   // l'accueil du prospect (#/accueil le mène là)
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
/* les écritures en base, hors compteur de visites du prospect (clé activite) */
const saisies = (db, uid) => db.ecritures.filter(e => !(e.table === "donnees" && e.outil === "activite") && (!uid || e.user_id === uid || e.id === uid));
const resume = db => JSON.stringify(saisies(db).map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const rangees = (db, uid) => JSON.stringify(db.donnees.filter(d => d.user_id === uid).map(d => [d.outil, d.contenu, d.maj_le]).sort((a, b) => a[0] < b[0] ? -1 : 1));
/* les appels /auth/v1/user (m : "GET" / "PUT"), depuis n0 */
const auth = (db, m, n0) => db.authUser.slice(n0 || 0).filter(x => !m || x.m === m);
/* les lectures de clés de santé (calc_perso, calc, mens : lecture seule ou groupée) depuis n0 */
const SANTE_CLES = /\b(calc_perso|calc|mens)\b/;
const lusSante = (db, n0) => db.lectures.slice(n0 || 0).filter(l => SANTE_CLES.test(l.outil));
/* une diète écrite avec une ligne (squelette compris) */
const avecDiete = e => !!(e && e.contenu && e.contenu.diete && Object.keys(e.contenu.diete).length);
/* l'état de Sante dans la page (null si l'objet n'existe pas : ancienne version) */
const santeEtat = page => page.evaluate(() => { try { return { a: Sante.aDemander(), ok: Sante.ok(), consulte: Store.idConsulte || null }; } catch (e) { return { erreur: String((e && e.message) || e).slice(0, 80) }; } });
/* la garde du stockage (Sante.bloque) pour des mesures et un calcul chiffré : { mens, calc } (vrai = bloqué) ; null si l'objet
   n'existe pas (ancienne version) */
const garde = page => page.evaluate(() => { try { return { mens: Sante.bloque("mens", { mesures: [{ poids: 70 }] }), calc: Sante.bloque("calc_perso", { age: 30, poids: 60 }) }; } catch (e) { return null; } });
const gardeOuverte = G => !!G && G.mens === false && G.calc === false;
/* le stockage de l'appareil : clés, session rangée (jetons, métadonnées), métadonnées de la session en mémoire */
const stockage = page => page.evaluate(() => {
  const l = [];
  for (const [nom, m] of [["local", localStorage], ["session", sessionStorage]]) { try { for (let i = 0; i < m.length; i++) l.push(nom + ":" + m.key(i)); } catch (e) { l.push(nom + ":illisible"); } }
  const lire = m => { try { return JSON.parse(m.getItem("mhx_session") || "null"); } catch (e) { return "illisible"; } };
  const sl = lire(localStorage), ss = lire(sessionStorage), s = sl || ss;
  let u = null; try { u = Auth.utilisateur(); } catch (e) {}
  let inv = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/invitations/.test(k)) inv.push(localStorage.getItem(k)); } } catch (e) {}
  return { cles: l, enLocal: !!sl, enSession: !!ss, rangee: s && typeof s === "object" ? { access: s.access_token, refresh: s.refresh_token, meta: s.user ? s.user.user_metadata : undefined } : null,
    memoire: u ? (u.user_metadata === undefined ? null : u.user_metadata) : "sans session", invitations: inv.join(" | ") };
});
/* rien en file pour la santé : aucune copie mhx_attente|…|calc_perso ou mens, aucune clé d'accord sur l'appareil */
const copiesSante = S => S.cles.filter(k => /mhx_attente\|.*\|(calc_perso|mens)$/.test(k) || /sante|consentement/i.test(k));
const invitSante = S => /declic_calculateur|declic_premiere_pesee/.test(S.invitations);
const nbInvitations = page => page.evaluate(() => document.querySelectorAll(".invitation, [data-invitation]").length);


/* ---------- la fenêtre du rappel (textes de DECOUVERTE.sante_maj, FR et EN, mot pour mot) ---------- */
const RAPPEL = {
  fr: { titre: "Notre politique de confidentialité a changé",
    texte: "Tu as donné ton accord pour l'usage de tes données de santé avec une version plus ancienne. Rien ne change pour tes données ni pour ton espace : tu peux confirmer ton accord pour la nouvelle version.",
    lien: "Lire la politique de confidentialité", oui: "J'accepte", non: "Plus tard",
    merci: "C'est noté : ton accord est enregistré pour la nouvelle version.",
    rate: "Ton accord n'a pas pu être enregistré (connexion ?). On te le redemandera à ta prochaine visite." },
  en: { titre: "Our Privacy Policy has changed",
    texte: "You gave your consent to the use of your health data under an older version. Nothing changes for your data or your space: you can confirm your consent for the new version.",
    lien: "Read the Privacy Policy", oui: "I agree", non: "Later",
    merci: "Got it: your consent is saved for the new version.",
    rate: "Your consent couldn't be saved (connection?). We'll ask you again on your next visit." }
};
const VERSION = () => LEGAUX_TEST.cgu_version;
const CLE = id => "mhx_rappel_politique|" + id;
const OUI = '.modale.rappel-sante [data-ui-b="1"]', NON = '.modale.rappel-sante [data-ui-b="0"]';
const lireRappel = page => page.evaluate(() => {
  const m = document.querySelector(".fond .modale.rappel-sante"); if (!m) return null;
  const a = m.querySelector("a#rappel-sante-lien"), r = m.getBoundingClientRect();
  return { role: m.getAttribute("role"), modal: m.getAttribute("aria-modal"), titre: (m.querySelector("h2") || {}).textContent || "",
    texte: (m.querySelector(".rappel-sante-texte") || {}).textContent || "", phrase: (m.querySelector(".rappel-sante-phrase strong") || {}).textContent || "",
    lien: a ? { t: a.textContent, href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") } : null,
    boutons: Array.from(m.querySelectorAll(".actions button")).map(x => x.textContent), focus: document.activeElement ? document.activeElement.textContent : "",
    figee: document.body.classList.contains("figee"), nb: document.querySelectorAll(".modale.rappel-sante").length,
    gauche: Math.round(r.left), droite: Math.round(r.right), hauteurs: Array.from(m.querySelectorAll(".actions button")).map(x => Math.round(x.getBoundingClientRect().height)),
    scroll: document.documentElement.scrollWidth };
});
const attendreRappel = async (page, ms) => { try { await page.waitForSelector(".fond .modale.rappel-sante", { timeout: ms || 7000 }); await attendre(page, 300); return true; } catch (e) { return false; } };
const rienApres = async (page, ms) => { await attendre(page, ms || 4000); return !(await page.$(".modale.rappel-sante")); };
const toasts = page => page.evaluate(() => Array.from(document.querySelectorAll("#toasts .toast")).map(t => t.textContent));
const cleLue = (page, id) => page.evaluate(k => { try { return localStorage.getItem(k); } catch (e) { return "illisible"; } }, CLE(id));
const ouvrirAccueil = async (page) => { await page.goto(URL0 + "#/accueil"); await pret(page); };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF90_PORT=10071 node verif90.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. la fenêtre =================== */
  await bloc("A. prospect, ancien accord : la fenêtre", async () => {
    const k = 1, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V55() })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db);
    await ouvrirAccueil(page);
    const vue = await attendreRappel(page);
    const R = await lireRappel(page), T = RAPPEL.fr;
    ok("A1 : à l'ouverture, une seule fenêtre « .modale.rappel-sante » (role=dialog, aria-modal), après UNE relecture du compte (GET /auth/v1/user) et sans aucun PUT",
      vue && !!R && R.nb === 1 && R.role === "dialog" && R.modal === "true" && auth(db, "GET").length === 1 && auth(db, "PUT").length === 0, JSON.stringify([vue, R, auth(db).map(x => x.m)]));
    ok("A2 : textes FR exacts (titre, texte, phrase d'accord de la carte en gras), lien « Lire la politique de confidentialité » vers la politique servie (target=_blank, rel=noopener), boutons « Plus tard » puis « J'accepte » (focus sur « J'accepte »), page figée derrière",
      !!R && norm(R.titre) === T.titre && norm(R.texte) === T.texte && norm(R.phrase) === norm(SANTE.fr.phrase) && !!R.lien && norm(R.lien.t) === T.lien && R.lien.href === LEGAUX_TEST.confidentialite_pdf
      && R.lien.target === "_blank" && /noopener/.test(R.lien.rel || "") && egal(R.boutons.map(norm), [T.non, T.oui]) && norm(R.focus) === T.oui && R.figee, JSON.stringify(R));
    ok("A3 : rien d'écrit avant un choix : aucune donnée (hors compteur de visites), métadonnées du compte inchangées, rien de retenu sur l'appareil",
      saisies(db, ID).length === 0 && egal(db.meta[ID], META_V55()) && (await cleLue(page, ID)) === null, resume(db) + " " + JSON.stringify(db.meta[ID]));
  });

  /* =================== B. J'accepte =================== */
  await bloc("B. « J'accepte »", async () => {
    const k = 2, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V55() })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db);
    await ouvrirAccueil(page);
    const vue = await attendreRappel(page);
    const t0 = await page.evaluate(() => Date.now());
    await page.click(OUI);
    const fini = await attendreQue(() => auth(db, "PUT").length === 1, 5000); await attendre(page, 900);
    const P = auth(db, "PUT"), d = P[0] && P[0].corps && P[0].corps.data, tc = d ? Date.parse(d.consentement_sante) : NaN;
    ok("B1 : « J'accepte » → UN PUT /auth/v1/user exact : consentement_sante = l'instant du clic, sante_version = la version actuelle, sante_ecran « nouvelle-version », sante_premier_accord, sante_premiere_version et sante_premier_ecran = l'accord d'avant (ces 6 champs, rien d'autre)",
      vue && fini && P.length === 1 && !!d && egal(Object.keys(d).sort(), ["consentement_sante", "sante_ecran", "sante_premier_accord", "sante_premier_ecran", "sante_premiere_version", "sante_version"]) && ISO.test(d.consentement_sante)
      && Math.abs(tc - t0) < 5000 && d.sante_version === VERSION() && d.sante_ecran === "nouvelle-version" && d.sante_premier_accord === META_V55().consentement_sante && d.sante_premiere_version === "2026-09-28b" && d.sante_premier_ecran === "", JSON.stringify(P));
    const M = db.meta[ID], ancien = META_V55();
    ok("B2 : dans le compte : la nouvelle version, et toutes les autres métadonnées gardées (prénom, conditions, newsletter…)",
      M.sante_version === VERSION() && Object.keys(ancien).filter(c => !["consentement_sante", "sante_version"].includes(c)).every(c => egal(M[c], ancien[c])), JSON.stringify(M));
    const R = await lireRappel(page), Ts = await toasts(page), S = await stockage(page), fig = await page.evaluate(() => document.body.classList.contains("figee"));
    ok("B3 : la fenêtre se ferme, le message « C'est noté : ton accord est enregistré pour la nouvelle version. », la page n'est plus figée ; la session rangée porte la nouvelle version",
      !R && Ts.map(norm).includes(RAPPEL.fr.merci) && !fig && !!S.rangee && !!S.rangee.meta && S.rangee.meta.sante_version === VERSION(), JSON.stringify([R, Ts, fig, S.rangee && S.rangee.meta]));
    const ex = await page.evaluate(async () => { try { const e = await Store.exportComplet(); return e && e.compte ? e.compte.accords : null; } catch (er) { return "erreur " + er.message; } });
    ok("B4 : l'export des données (droit d'accès) contient le nouvel accord et le tout premier (sante_premier_accord, sante_premiere_version)",
      !!ex && typeof ex === "object" && ex.sante_version === VERSION() && ex.sante_premier_accord === META_V55().consentement_sante && ex.sante_premiere_version === "2026-09-28b", JSON.stringify(ex));
    const g0 = auth(db, "GET").length;
    await page.reload(); await pret(page);
    const rien = await rienApres(page);
    ok("B5 : page rechargée : plus de fenêtre, plus de relecture du compte, aucun autre PUT",
      rien && auth(db, "GET").length === g0 && auth(db, "PUT").length === 1, JSON.stringify(auth(db).map(x => x.m)));
  });

  /* =================== C. Plus tard =================== */
  await bloc("C. « Plus tard »", async () => {
    const k = 3, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V55() })] });
    const x = await contexte(b, quiP(k, META_V55()), db), page = x.page;
    await ouvrirAccueil(page);
    const vue = await attendreRappel(page);
    const t0 = await page.evaluate(() => Date.now());
    await page.click(NON); await attendre(page, 800);
    const v = await cleLue(page, ID);
    ok("C1 : « Plus tard » → la fenêtre se ferme, aucun PUT, métadonnées du compte inchangées ; l'appareil retient la date (mhx_rappel_politique|<id>)",
      vue && !(await lireRappel(page)) && auth(db, "PUT").length === 0 && egal(db.meta[ID], META_V55()) && typeof v === "string" && ISO.test(v) && Math.abs(Date.parse(v) - t0) < 5000, JSON.stringify([vue, v, auth(db).map(a => a.m)]));
    await aller(page, "#/calculateur", 2000);
    const calc = await page.evaluate(() => ({ carte: !!document.getElementById("sante-carte"), off: document.querySelectorAll("#vue [data-sante-off]").length, champs: document.querySelectorAll("#vue input:not([disabled])").length, ok: Sante.ok() }));
    ok("C2 : l'accord d'avant reste valable : le calculateur s'ouvre sans la carte « Ton accord », champs actifs",
      !calc.carte && calc.off === 0 && calc.champs >= 3 && calc.ok === true, JSON.stringify(calc));
    const g0 = auth(db, "GET").length;
    await ouvrirAccueil(page);
    const r1 = await rienApres(page);
    await x.c.clock.setSystemTime(T0 + 6 * J);
    await page.reload(); await pret(page);
    const r6 = await rienApres(page), g6 = auth(db, "GET").length;
    await x.c.clock.setSystemTime(T0 + 7 * J + 10 * MIN);
    await page.reload(); await pret(page);
    const v7 = await attendreRappel(page);
    ok("C3 : rechargée le jour même puis 6 jours après : ni fenêtre ni relecture ; 7 jours après : la fenêtre revient (une relecture de plus)",
      r1 && r6 && g6 === g0 && v7 && auth(db, "GET").length === g0 + 1, JSON.stringify([r1, r6, g0, g6, v7, auth(db).map(a => a.m)]));
    await page.click(NON); await attendre(page, 500);
    const avantDeco = await cleLue(page, ID);
    const apresDeco = await page.evaluate(c => { Auth.viderCompte(); try { return localStorage.getItem(c); } catch (e) { return "illisible"; } }, CLE(ID));
    ok("C4 : la déconnexion (Auth.viderCompte) retire la date retenue : rien d'un compte ne reste sur un appareil partagé",
      typeof avantDeco === "string" && apresDeco === null, JSON.stringify([avantDeco, apresDeco]));
  });

  /* =================== D. Échap, toucher à côté =================== */
  await bloc("D. Échap ou toucher à côté", async () => {
    const out = [];
    for (const [k, geste] of [[4, "echap"], [5, "cote"]]) {
      const ID = PID(k), db = base({ comptes: [compte(k, { meta: META_V55() })] });
      const { page } = await contexte(b, quiP(k, META_V55()), db);
      await ouvrirAccueil(page);
      const vue = await attendreRappel(page);
      if (geste === "echap") await page.keyboard.press("Escape"); else await page.mouse.click(4, 4);
      await attendre(page, 700);
      out.push({ geste, vue, ferme: !(await lireRappel(page)), put: auth(db, "PUT").length, cle: await cleLue(page, ID), meta: egal(db.meta[ID], META_V55()) });
    }
    ok("D1 : Échap, puis un toucher à côté de la fenêtre : fermée comme « Plus tard » (aucun PUT, date retenue, compte inchangé)",
      out.length === 2 && out.every(o => o.vue && o.ferme && o.put === 0 && typeof o.cle === "string" && ISO.test(o.cle) && o.meta), JSON.stringify(out));
  });

  /* =================== E. pannes =================== */
  await bloc("E. pannes", async () => {
    {
      const k = 6, ID = PID(k), db = base({ comptes: [compte(k, { meta: META_V55() })] });
      const { page } = await contexte(b, quiP(k, META_V55()), db);
      await ouvrirAccueil(page);
      const vue = await attendreRappel(page);
      db.pannePut = 500;
      await page.click(OUI); await attendre(page, 1500);
      const Ts = await toasts(page), v = await cleLue(page, ID), S = await stockage(page);
      ok("E1 : PUT refusé (500) → le message « Ton accord n'a pas pu être enregistré (connexion ?)… », rien de retenu sur l'appareil, compte et session inchangés",
        vue && auth(db, "PUT").length === 1 && Ts.map(norm).includes(RAPPEL.fr.rate) && v === null && egal(db.meta[ID], META_V55()) && !!S.rangee && !!S.rangee.meta && S.rangee.meta.sante_version === "2026-09-28b", JSON.stringify([Ts, v, S.rangee && S.rangee.meta]));
      db.pannePut = null;
      await page.reload(); await pret(page);
      ok("E2 : à l'ouverture suivante, la fenêtre revient", await attendreRappel(page), JSON.stringify(auth(db).map(a => a.m)));
    }
    {
      const k = 7, ID = PID(k), db = base({ comptes: [compte(k, { meta: META_V55() })] });
      const { page } = await contexte(b, quiP(k, META_V55()), db);
      await ouvrirAccueil(page);
      const vue = await attendreRappel(page);
      db.pannePut = "sans accord";
      await page.click(OUI); await attendre(page, 1500);
      const Ts = await toasts(page), S = await stockage(page);
      ok("E3 : réponse du PUT sans la nouvelle version → le message d'échec, la session de l'appareil garde l'ancienne version (jamais « accepté » sur l'appareil seulement), rien de retenu",
        vue && Ts.map(norm).includes(RAPPEL.fr.rate) && !!S.rangee && !!S.rangee.meta && S.rangee.meta.sante_version === "2026-09-28b" && (await cleLue(page, ID)) === null, JSON.stringify([Ts, S.rangee && S.rangee.meta]));
    }
    const out = [];
    for (const [k, panne] of [[8, 500], [9, "coupure"], [10, "horsligne"]]) {
      const ID = PID(k), db = base({ comptes: [compte(k, { meta: META_V55() })] });
      if (panne !== "horsligne") db.panneGet = panne;
      const x = await contexte(b, quiP(k, META_V55()), db), page = x.page;
      await page.goto(URL0 + "#/accueil");
      await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
      if (panne === "horsligne") await couper(x, true);
      const rien = await rienApres(page);
      out.push({ panne, rien, put: auth(db, "PUT").length, cle: await cleLue(page, ID), meta: egal(db.meta[ID], META_V55()), get: auth(db, "GET").length });
    }
    ok("E4 : relecture du compte refusée (500) ou coupée, appareil hors ligne : pas de fenêtre, aucun PUT, rien de retenu, compte inchangé (hors ligne : aucune relecture)",
      out.length === 3 && out.every(o => o.rien && o.put === 0 && o.cle === null && o.meta) && out[2].get === 0, JSON.stringify(out));
  });

  /* =================== F. qui la voit, qui ne la voit pas =================== */
  await bloc("F. qui la voit", async () => {
    const cas = [
      { nom: "accord à la version actuelle", k: 11, meta: () => META_V55({ sante_version: LEGAUX_TEST.cgu_version }), voit: false, sansGet: true },
      { nom: "prospect sans accord (inscrit v64)", k: 12, meta: () => META_V64(), voit: false },
      { nom: "version plus récente", k: 13, meta: () => META_V55({ sante_version: "2027-01-01" }), voit: false, sansGet: true },
      { nom: "version illisible", k: 14, meta: () => META_V55({ sante_version: "x" }), voit: false, sansGet: true },
      { nom: "accord sans version (true)", k: 15, meta: () => META_V55({ consentement_sante: true, sante_version: undefined }), voit: true }
    ];
    const out = [];
    for (const c of cas) {
      const db = base({ comptes: [compte(c.k, { meta: c.meta() })] });
      const { page } = await contexte(b, quiP(c.k, c.meta()), db);
      await ouvrirAccueil(page);
      const vu = c.voit ? await attendreRappel(page) : !(await rienApres(page));
      out.push({ nom: c.nom, vu, attendu: c.voit, get: auth(db, "GET").length, put: auth(db, "PUT").length, sansGet: !!c.sansGet });
    }
    ok("F1 : accord à la version actuelle, prospect sans accord, version plus récente ou illisible : pas de fenêtre (et, avec un accord, aucune relecture) ; accord sans version : la fenêtre",
      out.every(o => o.vu === o.attendu && o.put === 0 && (!o.sansGet || o.get === 0)), JSON.stringify(out));
    {
      const db = base(); db.meta[F.IDS.c1] = META_V55({ prenom: "Thomas", nom: "Démo" });
      const { page } = await contexte(b, qui(F.IDS.c1, "thomas@exemple.fr", db.meta[F.IDS.c1]), db);
      await ouvrirAccueil(page);
      ok("F2 : un client accompagné dont l'accord date d'une version plus ancienne voit aussi la fenêtre", await attendreRappel(page), JSON.stringify(auth(db).map(a => a.m)));
    }
    {
      const db = base(); db.meta[F.IDS.coach] = META_V55({ prenom: "Coach", nom: "Démo" });
      const { page } = await contexte(b, qui(F.IDS.coach, "coach@exemple.fr", db.meta[F.IDS.coach]), db);
      await page.goto(URL0 + "#/tableau"); await pret(page);
      const rien = await rienApres(page);
      ok("F3 : le coach ne voit jamais la fenêtre, même avec un ancien accord dans ses métadonnées (aucune relecture, aucun PUT)",
        rien && auth(db, "GET").length === 0 && auth(db, "PUT").length === 0, JSON.stringify(auth(db).map(a => a.m)));
    }
  });

  /* =================== G. un autre appareil =================== */
  await bloc("G. accord donné sur un autre appareil", async () => {
    const k = 16, ID = PID(k);
    const enBase = META_V55({ consentement_sante: avant(H), sante_version: LEGAUX_TEST.cgu_version, sante_ecran: "nouvelle-version", sante_premier_accord: avant(3 * J), sante_premiere_version: "2026-09-28b" });
    const db = base({ comptes: [compte(k, { meta: enBase })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db);
    await ouvrirAccueil(page);
    const rien = await rienApres(page), S = await stockage(page);
    ok("G1 : la session de l'appareil porte l'ancienne version, le compte la nouvelle (accord donné ailleurs) : une relecture, pas de fenêtre, aucun PUT, la session de l'appareil mise à jour",
      rien && auth(db, "GET").length === 1 && auth(db, "PUT").length === 0 && !!S.rangee && !!S.rangee.meta && S.rangee.meta.sante_version === VERSION() && egal(db.meta[ID], enBase), JSON.stringify([auth(db).map(a => a.m), S.rangee && S.rangee.meta]));
  });

  /* =================== H. anglais =================== */
  await bloc("H. anglais", async () => {
    const k = 17, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V55(), donnees: [["prefs", { langue: "en" }]] })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db, { langue: "en" });
    await ouvrirAccueil(page);
    const vue = await attendreRappel(page);
    const R = await lireRappel(page), T = RAPPEL.en;
    ok("H1 : en anglais : titre, texte, phrase d'accord (celle de la carte), lien « Read the Privacy Policy », « Later » puis « I agree »",
      vue && !!R && norm(R.titre) === T.titre && norm(R.texte) === T.texte && norm(R.phrase) === norm(SANTE.en.phrase) && !!R.lien && norm(R.lien.t) === T.lien && egal(R.boutons.map(norm), [T.non, T.oui]), JSON.stringify(R));
    await page.click(OUI); await attendreQue(() => auth(db, "PUT").length === 1, 5000); await attendre(page, 900);
    const Ts = await toasts(page);
    ok("H2 : « I agree » → l'accord est enregistré, message en anglais", Ts.map(norm).includes(T.merci) && db.meta[ID].sante_version === VERSION(), JSON.stringify([Ts, db.meta[ID]]));
  });

  /* =================== I. 320 px =================== */
  await bloc("I. 320 px", async () => {
    const k = 18, db = base({ comptes: [compte(k, { meta: META_V55() })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db, { viewport: ETROIT });
    await ouvrirAccueil(page);
    const vue = await attendreRappel(page);
    const R = await lireRappel(page);
    ok("I1 : à 320 px, la fenêtre tient dans l'écran (aucun débordement horizontal) et ses deux boutons font au moins 44 px de haut",
      vue && !!R && R.gauche >= 0 && R.droite <= 320 && R.scroll <= 320 && R.hauteurs.length === 2 && R.hauteurs.every(h => h >= 44), JSON.stringify(R));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
