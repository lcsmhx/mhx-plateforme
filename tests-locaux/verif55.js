/* verif55 — Chantier 1 (v52) : le parcours prospect et ses corrections, vérifiés de bout en bout dans un vrai navigateur.
   Lot A :
   A0. v59 : interrupteurs forcés par le banc (tests-locaux/fichiers.js à côté de la page testée) : chaque fichier css/ et
      js/ servi identique octet pour octet que le fichier dise « test », « tous », « off » ou « Tous » (sur « test »,
      exactement le fichier) ; fichier simulé sur « tous » (BANC_SIMULER_NOUVEAUTES, le temps du bloc) : lu « tous »,
      servi « test », Thomas garde le bilan du vendredi et n'est pas suivi ; la règle de la simulation (branches
      v2/simu-tous-* et v2/simu-off-*, refusée sur main) ;
   A. interrupteurs des nouveautés (CONFIG.nouveautes, objet Interrupteurs) : « test » = le coach et les comptes de test
      seulement, « tous » = tout le monde, « off » ou valeur inconnue = personne ; comptes de test = identifiants, jamais
      d'email ; l'objet Nouveautes (notifications du coach) est toujours là, à part ;
   B. corrections de la nuit du 28/09 : erreurs d'envoi d'email en français (et en anglais), jamais le texte brut de
      Supabase (inscription) ; changement d'adresse en deux liens (premier lien, dernier lien, connecté ou non, session
      renouvelée après le dernier lien). v52, lot B (décision de Lucas : aucun email envoyé par l'app) : « Mot de passe
      oublié » et le changement d'adresse du Profil donnent seulement l'adresse du coach, sans aucun appel ;
   C. adresse réécrite quand la page demandée n'est pas pour la personne (client, prospect, coach), sans boucle ; le
      coach sur #/accueil hors fiche : « Ouvrir » du tableau de bord ouvre bien la fiche ; v71 (I) : la fiche consultée est
      dans l'adresse (#/client/<uuid>/<outil>) : rechargement → même fiche, uuid inconnu → Mes clients, « Revenir … » vers
      l'écran d'origine, pas d'onglet Entraînement dans une fiche ;
   D. première connexion d'un client sur téléphone : le Profil s'ouvre en haut (écran de connexion défilé, polices
      lentes), l'encadré « Bienvenue ! » sous l'en-tête, un seul affichage (intake lu 2 fois) ; l'encadré en anglais ;
   Lot B :
   E. inscription : écran « Crée ton espace gratuit » sans « 7 jours » (FR / EN), champ Nom obligatoire (#c-nom,
      family-name, 60 caractères, « Indique ton nom. »), v64 (lot 5, brief V2 A) : deux cases séparées jamais cochées
      d'avance, la seule obligatoire « J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité. » (deux
      liens distincts vers les PDF de CONFIG.textes_legaux, target=_blank, rel=noopener, le point collé au second ; le mot
      seul, sans lien, tant que le lien est « à compléter ») et la newsletter (texte court A4) ; plus de case santé ni de
      texte « données de santé » ; métadonnées exactes (prénom, nom, consentement + conditions_version =
      CONFIG.textes_legaux.cgu_version, newsletter instant ou null + newsletter_version 2026-09-30, plus d'emails_suivi,
      aucun accord santé), profils.nom, jamais intake.nom ; copie { newsletter, maj, version, source: "inscription" } dans
      la clé emails à la première ouverture, une seule fois (aussi par le lien de confirmation) ; rien d'écrit pour un ancien compte, un client, le coach, une clé
      déjà là, une lecture ratée (écrite à l'ouverture suivante), une copie en attente sur l'appareil, une clé apparue
      pendant l'envoi (insertion simple : rien d'écrasé) ;
   F. Profil du prospect : interrupteur « Newsletter » (FR / EN) → emails { newsletter, maj, version, source: "profil" },
      un « non » coupe aussi l'ancien suivi ; l'ancien accord ne coche jamais la newsletter ; lecture ratée ;
   G. conditions FR / EN (version 2026-09-30 depuis la v61, 2026-09-29 depuis la v59 ; DECOUVERTE.accords : v64,
      conditions = CONFIG.textes_legaux.cgu_version, sante 2026-09-28b, newsletter 2026-09-30 (inscription), newsletter_profil
      2026-09-28c (Profil) ; volet ouvert depuis le Profil du prospect, plus depuis l'inscription) : paragraphe 2 « dont tes
      clics sur « Récupérer mon plan d'action » » (v61), plus de 7 jours, nom, 3 questions, newsletter (1 à 2 par semaine, désinscription en 1 clic, retrait dans le Profil), ni mesure
      d'ouverture, ni prestataire d'emails nommé, ni relance, ni email du compte promis (décisions de Lucas), Calendly avec
      le nom ; v59 : « Contenus chargés depuis Google » (polices, aperçus des vidéos, adresse IP, vidéo au clic seulement)
      juste après « Hébergement » ; mêmes paragraphes aux mêmes places ;
   H. Calendly : name = prénom + nom, first_name, last_name, email (prospect, page verrouillée, fiche du coach,
      lienCalendlyPour à 3 ou 4 paramètres), pré-remplissage éteint, caractères piégés ; v61 : événement de 15 min,
      utm_source=app, utm_medium=bouton (fiche du coach : coach), codes d'origine avec « _ » (accueil_haut, verrou_programme,
      fiche_coach) ;
   Lot G (côté coach) :
   v71 (D) : un prospect n'a plus de ligne dans « Suivi de mes clients » (il est sur la page Prospects) : sa fiche s'ouvre par
      Clients.ouvrir, une fois le tableau chargé ;
   G1. fiche d'un prospect : son nom (profils.nom, « pas renseigné » s'il manque), « Newsletter : oui (depuis le …) / non »
       d'après la clé emails (absente ou ancien accord « emails de suivi » seul : non), ses 3 réponses avec des libellés
       courts (Problème, Ce qui l'a bloqué, Dans 3 mois) puis les anciennes qui ont une valeur, jamais « undefined » ;
   G2. données piégées (nom, réponses, date) : du texte, rien d'injecté ; clé emails illisible : non ;
   G3. page Prospects (Problème et Dans 3 mois sur la carte) et export CSV (3 colonnes de plus en fin de ligne, les 15
       d'avant inchangées, cellule « = » neutralisée) ; aucune écriture côté coach ;
   G4. téléphone 390 px : fiche et page Prospects sans défilement horizontal ;
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de tests-locaux, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE,
   jamais par sous-chaîne : README, « Règle d'or ») ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant
   reconnu à son jeton ; chaque écriture est appliquée en mémoire et notée, chaque lecture de « donnees » aussi ;
   réponses coupées à 1 000 lignes, Range et order= respectés. Dates relatives au lancement. Chaque bloc tourne à part
   (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif55.js ../index.html
           VERIF55_PORT=9711 node verif55.js ../index.html     (autre port, si 9710 est pris)
           VERIF55_BLOCS="A.,C." node verif55.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF55_PORT || 9710;
const BLOCS = (process.env.VERIF55_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé, retouché le temps d'un bloc (avec) ---------- */
let retouches = [];
/* v55 : l'inscription est FERMÉE par défaut, comme dans les autres suites qui testent l'inscription (les autres suites
   servent la valeur du fichier ; le fichier la porte ouverte depuis la v54 ; en v54, hors de ses blocs d'inscription, la
   suite servait la valeur du fichier) ; inscriptionOuverte(fn) l'ouvre le temps d'un bloc. Valeur forcée dans les deux
   sens (forcerInscription, fichiers.js), avant les retouches de texte d'avec. */
let inscriptionLibre = false;
const { servirFichier, source, sourceServie, listes, forcerInscription, valeursInscription, valeursNouveaute } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
/* 52.1 : les retouches valent pour la page et pour ses fichiers css/ et js/ (CONFIG est dans js/config.js) */
const retouche = h => { h = forcerInscription(h, inscriptionLibre); if (legaux) h = forcerLegaux(h, legaux); for (const [de, vers] of retouches) h = h.split(de).join(vers); return h; };
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
/* une retouche dont le texte a disparu du fichier ne passe jamais en silence : le bloc s'interrompt */
async function avec(liste, fn){
  const h = sourceServie(HTML);   // v59 : ce que la suite sert (interrupteurs forcés sur « test », fichiers.js), pas le disque
  for (const [de] of liste) if (!h.includes(de)) throw new Error("retouche impossible, texte absent du fichier servi : " + de);
  retouches = liste;
  try { await fn(); } finally { retouches = []; }
}
/* v55 : les blocs d'inscription ouvrent l'inscription le temps de fn (en v54 : une retouche avec() depuis la valeur du
   fichier) ; valables que Lucas la laisse ouverte ou la referme. Comme avec, jamais en silence :
   le fichier doit porter une seule valeur inscription_libre (true ou false), sinon le bloc s'interrompt. */
async function inscriptionOuverte(fn){
  if (valeursInscription(source(HTML)).length !== 1) throw new Error("retouche impossible : le fichier doit porter une seule valeur inscription_libre (true ou false)");
  inscriptionLibre = true;
  try { await fn(); } finally { inscriptionLibre = false; }
}
/* v64 (lot 5, brief V2 A) : les textes légaux (CONFIG.textes_legaux, js/config.js) : liens des 2 PDF (CGU, politique de
   confidentialité) et version des CGU, « à compléter » sur les branches de travail (le verrou de publication est ailleurs :
   verif70 A0). avecLegaux(v, fn) sert, le temps de fn, la valeur de chaque clé remplacée par celle de v, QUELLE QUE SOIT la
   valeur du fichier (la suite reste valable quand Lucas les remplit) : LEGAUX_TEST (liens https Google Drive et version de
   test valides) ou LEGAUX_VIDES (« à compléter » : le mot seul, sans lien). Jamais en silence : les vérifications relisent
   dans la page les valeurs servies (CONFIG.textes_legaux) ou exigent les liens / la version de test exacts. */
let legaux = null;
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-15" };   // v64 : version DISTINCTE du texte court (V_COND)
const LEGAUX_VIDES = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
/* la valeur entre guillemets, collée à « cle: » (jamais « cgu_version : » d'un commentaire) */
const forcerLegaux = (t, v) => Object.keys(v).reduce((h, k) => h.replace(new RegExp("\\b(" + k + ": )\"[^\"\\n]*\""), (x, a) => a + JSON.stringify(v[k])), t);
async function avecLegaux(v, fn){ legaux = v; try { return await fn(); } finally { legaux = null; } }

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates : toujours relatives au lancement ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes ---------- */
/* un jeton par compte : le faux Supabase reconnaît l'appelant à son en-tête Authorization, comme la vraie base */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000055" + String(k).padStart(2, "0");   // verif55 : …55kk (une plage par suite)
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  const db = { profils, donnees, emails_prospects: [], sansJournal: false, ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
    fonctions: [], inscriptions: [], emails: {}, connexions: {}, inscription: {}, lectureKo: opts.lectureKo || [], retardLecture: {}, retard: {},
    reponseFonction: { status: 200, body: { ok: true } },
    /* v52 (lot A) : mot de passe oublié et changement d'adresse (erreurs simulées), renouvellements de session, polices lentes */
    oublis: [], recover: {}, majUsers: [], majUser: {}, tokens: [], polices: null,
    /* v52 (lot B) : métadonnées des comptes (user_metadata), rendues par /auth/v1/user et le renouvellement */
    meta: {} };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  for (const [uid, outil, contenu, maj] of opts.cles || []) donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) });
  return db;
}

/* ---------- le faux Supabase ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];                 // SELECT : le propriétaire ne les lit pas
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];     // INSERT / UPDATE / DELETE du propriétaire
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){   // order=a.desc,b.asc (PostgREST)
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

/* polices lentes (db.polices = { css: ms, fichiers: ms }) — v66 : hébergées dans polices/ (plus de Google Fonts) ; la feuille
   qui les déclare (css/jetons.css) répond après « css » ms, les fichiers woff2 après « fichiers » ms */
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") {
    const pa = new URL(u).pathname;
    if (db.polices && db.polices.css && pa === "/css/jetons.css") await new Promise(z => setTimeout(z, db.polices.css));
    if (db.polices && db.polices.fichiers && /^\/polices\//.test(pa)) await new Promise(z => setTimeout(z, db.polices.fichiers));
    return r.continue().catch(() => {});
  }
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Calendly, Instagram… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);

  /* --- comptes --- */
  if (p.startsWith("/auth/v1/signup")) {
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    if (db.inscription.erreur) return json({ msg: db.inscription.erreur.msg }, db.inscription.erreur.status);
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });   // déclencheur creer_profil
    if (db.inscription.confirmation) return json({ id, email: c.email, user_metadata: data });   // « Confirm email » : pas de session
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {   // mot de passe ou renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    db.tokens.push(q.get("grant_type") || "?");
    const id = (r1 && r1[1]) || (c.email && db.connexions[c.email]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    /* renouvellement : la session porte l'adresse que la base connaît à cet instant (db.emails, ex. après un changement d'adresse) */
    return json(who && id === who.id && !db.emails[id] ? who.session : session(id, db.emails[id] || (who && id === who.id ? who.email : "") || c.email || "", db.meta[id]));
  }
  /* toute autre écriture vers la base (compte, fonctions, Storage, bibliothèque, catalogue…) est notée ;
     donnees et profils le sont plus bas, avec leur contenu */
  /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage d'un prospect ou d'un compte suivi) n'est
     pas une écriture de l'app dans les données : elle est testée à part (verif61) */
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); return json({}); }
  if (p.startsWith("/auth/v1/recover")) {   // mot de passe oublié (erreur simulée : db.recover.erreur)
    db.oublis.push(corps());
    if (db.recover.erreur) return json({ msg: db.recover.erreur.msg }, db.recover.erreur.status);
    return json({});
  }
  if (p.startsWith("/auth/v1/user") && m === "PUT") {   // changement d'adresse ou de mot de passe (erreur simulée : db.majUser.erreur)
    const c = corps() || {}; db.majUsers.push(clone(c));
    if (db.majUser.erreur) return json({ msg: db.majUser.erreur.msg }, db.majUser.erreur.status);
    return json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), new_email: c.email || undefined, role: "authenticated" });
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  /* --- fonctions serveur et Storage : jamais appelés pour de vrai --- */
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m, action: q.get("action"), corps: corps() }); const rf = db.reponseFonction; return rf.abort ? r.abort() : json(rf.body, rf.status); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") {
    if (db.sansJournal) return json({ code: "42P01", message: 'relation "public.emails_prospects" does not exist' }, 404);
    return json(coach ? colonnes(plage(db.emails_prospects.slice()), q) : []);
  }
  /* --- profils : chacun le sien, le coach tous ; rôle et statut changés par le coach seul (déclencheur protege_role) --- */
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
  /* --- donnees --- */
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
      if (cleEq && db.retardLecture[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
      if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const lent = Math.max(0, ...rows.map(row => db.retard[row.outil] || 0));
      if (lent) { db.journal.push("P " + rows.map(row => row.outil).join(",")); await new Promise(z => setTimeout(z, lent)); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne))); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : maj_le=eq.<valeur lue> ou is.null
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);   // la ligne a bougé : 0 ligne (conflit)
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }   // RLS d'une mise à jour : 0 ligne, sans erreur
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row))); db.journal.push("E " + cleEq);
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

/* ---------- un navigateur (contexte) pour une personne ----------
   opts : viewport (ORDI par défaut, MOBILE), langue ("en" ; la ligne prefs en base l'emporte), stockage ({ clé: valeur }
   posés sur l'appareil), persistant (false : « Rester connecté » décoché), horloge (instant : l'horloge part de là et
   tourne ; true : maintenant), horlogeFixe (instant figé), fuseau ("Asia/Makassar"…) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || ORDI }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, stock, langue, persistant }) => {
    if (!/^https?:$/.test(location.protocol)) return;   // about:blank (fermeture simulée)
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    /* l'appareil (localStorage, partagé par les onglets du contexte) n'est préparé qu'une fois : un rechargement ou un 2e onglet le garde */
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s && persistant) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
    }
    if (s && !persistant && !sessionStorage.getItem("__init")) { sessionStorage.setItem("__init", "1"); sessionStorage.setItem("mhx_session", JSON.stringify(s)); }
  }, { s: who ? who.session : null, stock: opts.stockage || {}, langue: opts.langue || "", persistant: opts.persistant !== false });
  if (opts.horloge) await c.clock.install(opts.horloge === true ? undefined : { time: opts.horloge });
  if (opts.horlogeFixe) await c.clock.setFixedTime(opts.horlogeFixe);
  const page = await nouvellePage(c);
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}
async function nouvellePage(c){ return surveiller(await c.newPage()); }

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* l'app a fini de démarrer (appPrete, index.html [G]) et l'écran attendu est là */
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const ecrDonnees = db => db.ecritures.filter(e => e.table === "donnees" || e.table === "profils");
const couvre = (o, k) => { o = String(o || ""); if (!o) return true; if (o.startsWith("eq.")) return o.slice(3) === k; if (o.startsWith("in.")) return liste(o.slice(3)).includes(k); if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k); return true; };
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;   // lectures du CONTENU de la clé
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const largeur = page => page.evaluate(() => document.documentElement.scrollWidth + " px pour " + window.innerWidth).catch(() => "?");
const ou = page => page.evaluate(() => ({ courant: typeof courant !== "undefined" ? courant : null, hash: location.hash })).catch(() => ({}));
const avecEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };

/* ---------- les textes attendus (FR et EN), repris de DECOUVERTE.inscription (v51, corrections de la nuit du 28/09) ---------- */
const TX = {
  envoi_rate: "L'email n'a pas pu partir (souci de notre côté). Réessaie dans un moment ; si ça continue, écris-moi sur Instagram (@lucasmhxcoaching).",
  envoi_rate_en: "The email could not be sent (a problem on our side). Try again in a moment; if it keeps happening, message me on Instagram (@lucasmhxcoaching).",
  trop_emails: "Beaucoup d'inscriptions en ce moment : réessaie dans une heure.",
  trop_demandes: "Trop de demandes d'un coup : réessaie dans une minute.",
  trop_emails_compte: "Trop d'emails envoyés en peu de temps : réessaie dans une heure.",
  trop_emails_compte_en: "Too many emails sent in a short time: try again in an hour.",
  premier_lien: "Premier lien accepté : clique maintenant celui reçu sur ton autre adresse. Le changement d'email est fait au deuxième clic.",
  premier_lien_en: "First link accepted: now click the one sent to your other address. The email change is done on the second click.",
  email_change: "Ton adresse email est changée : utilise la nouvelle pour te connecter.",
  email_change_en: "Your email address has been changed: use the new one to sign in.",
  profil_ok: e => "Un lien de confirmation part sur " + e + ", et par sécurité un autre sur ton adresse actuelle : clique les deux. Le changement est fait au dernier clic.",
  profil_ok_en: e => "A confirmation link is on its way to " + e + ", and for security another one to your current address: click both. The change is done on the last click.",
  profil_note: "Un lien de confirmation part sur la nouvelle adresse (et, par sécurité, un autre sur l'ancienne : clique les deux).",
  profil_note_en: "A confirmation link is sent to the new address (and, for security, another one to the old address: click both).",
  /* v52 (décision de Lucas) : aucun email envoyé par l'app : mot de passe oublié et changement d'adresse passent par un email au coach */
  oubli: "Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement.",
  oubli_en: "Write to us at mhx.coaching@gmail.com, we'll get you back in quickly.",
  profil_mail: "Pour changer ton adresse email, écris-nous à mhx.coaching@gmail.com, on s'en occupe rapidement.",
  profil_mail_en: "To change your email address, write to us at mhx.coaching@gmail.com, we'll take care of it quickly.",
  adresse: ". C'est avec elle que tu te connectes.", adresse_en: ". It's the address you sign in with."
};
const LIEN_DERNIER = "#access_token=abc.def.ghi&expires_in=3600&refresh_token=xyz&token_type=bearer&type=email_change";
const LIEN_PREMIER = "#message=Confirmation+link+accepted.++Please+proceed+to+confirm+link+sent+to+the+other+email";

/* ---------- lot B : inscription (nom, cases, accords), newsletter, conditions, Calendly ---------- */
const V52 = "2026-09-28";   // version de la case santé des comptes créés avant la v55 (métadonnées des décors, et conditions_version de ces décors)
/* v55 : DECOUVERTE.accords.sante passe à « 2026-09-28b » (anglais de la case santé avec son point final) : c'est la version
   attendue d'une NOUVELLE inscription et dans DECOUVERTE.accords ; les décors des comptes d'avant gardent V52. v64 (lot 5, A3) :
   plus envoyée à l'inscription (plus de case santé : accord au premier usage) ; reste la valeur de DECOUVERTE.accords.sante (G) */
const V_SANTE = "2026-09-28b";
/* v59 : « 2026-09-29 » = paragraphe « Contenus chargés depuis Google » ajouté (lot E, remarque d de la relecture v52) ; les
   comptes déjà inscrits gardent leur version dans leurs métadonnées (rien ne la compare : personne n'est redemandé) */
/* v61 (décision 4 de Lucas du 30/09) : « 2026-09-30 » = « Réserver mon bilan » devient « Récupérer mon plan d'action » dans le
   paragraphe 2 (données collectées) ; rien d'autre ne change */
const V_COND = "2026-10-01";   // version du texte court des conditions (confidentialite.version ; v55 à v58 : 2026-09-28b ; v59, v60 : 2026-09-29 ; v61 à v63 : 2026-09-30, aussi conditions_version des nouvelles inscriptions jusqu'à la v63 ; v64 : 2026-10-01, la date des PDF, décision de Lucas du 30/09)
/* v64 (lot 5, brief V2 A) : conditions_version d'une nouvelle inscription = la version des CGU en PDF (CONFIG.textes_legaux.cgu_version
   = DECOUVERTE.accords.conditions ; servie LEGAUX_TEST.cgu_version, distincte de V_COND : la version envoyée vient bien de
   CONFIG.textes_legaux, jamais du texte court) */
const V_NEWS = "2026-09-28c";   // version du texte de l'interrupteur du Profil (DECOUVERTE.accords.newsletter_profil) ; jusqu'à la v63, aussi celle de la case de l'inscription (décors des comptes d'avant)
const V_NEWS_INSC = "2026-09-30";   // v64 (A4) : version du texte court de la case newsletter de l'inscription (DECOUVERTE.accords.newsletter)
const TXB = {
  titre: "Crée ton espace gratuit", titre_en: "Create your free space",
  /* v64 (lot 5, brief V2 A1) */
  sous: "Gratuit, pour toujours : calculateur de calories, suivi de ton poids et de tes mensurations, et la Speed Formation avec ses vidéos, programmes et plans alimentaires.",
  sous_en: "Free, forever: calorie calculator, weight and measurement tracking, and the Speed Formation course with its videos, workout programs and meal plans.",
  /* décisions de Lucas du 28/09 : newsletter sans mesure d'ouverture ; l'âge est dans la case des conditions. v64 (A4, A2) : textes
     courts ; « CGU » et « politique de confidentialité » (cgu_mots) sont deux liens distincts vers les PDF */
  news: "Oui, je veux les conseils et les offres de Lucas par email (2 max par semaine, désinscription en 1 clic).",
  news_en: "Yes, send me Lucas's tips and offers by email (2 per week max, unsubscribe in 1 click).",
  cgu: "J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité.",
  cgu_en: "I'm 18 or older and I accept the Terms of Use and the Privacy Policy.",
  cgu_mots: ["CGU", "politique de confidentialité"], cgu_mots_en: ["Terms of Use", "Privacy Policy"],
  bouton: "Créer mon espace gratuit", bouton_en: "Create my free account",
  nom: "Ton nom", nom_en: "Your last name", nom_manque: "Indique ton nom.", nom_manque_en: "Enter your last name.",
  libelle: "Recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum)",
  libelle_en: "Receive MHX Coaching's tips, testimonials and coaching offers by email (1 to 2 emails per week maximum)",
  oui: "C'est noté : tu recevras la newsletter.", non: "C'est noté : plus aucune newsletter.",
  oui_en: "Noted: you will receive the newsletter.", non_en: "Noted: no more newsletters.",
  refuse: "Non enregistré : réessaie dans un instant."
};
const SEPT = /7 jours|7 days|7-day|jour \d+ ?\/ ?7|day \d+ ?\/ ?7/i;
const CLES_META = "conditions_version,consentement,newsletter,newsletter_version,nom,prenom";   // v64 : plus de consentement_sante ni sante_version (accord au premier usage)
/* v61 (lot 2, F) : l'événement de 15 min « Ton plan d'action offert » (remplace …/30min) */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
/* remplit le formulaire d'inscription (page sur #/inscription) */
async function remplir(page, f){
  await page.fill("#c-prenom", f.prenom); await page.fill("#c-nom", f.nom); await page.fill("#c-email", f.email); await page.fill("#c-mdp", f.mdp || "motdepasse1");
  if (f.cgu !== false) await page.check("#c-cgu");   // v64 : la seule case obligatoire (plus de case santé)
  if (f.news) await page.check("#c-newsletter");
}
/* l'écran d'inscription tel qu'affiché */
const ecranInscription = page => page.evaluate(() => {
  const t = s => { const x = document.querySelector(s); return x ? x.textContent.replace(/\s+/g, " ").trim() : null; };
  const at = (id, a) => { const x = document.getElementById(id); return x ? x.getAttribute(a) : null; };
  /* v64 : deux cases (conditions, newsletter) ; la case santé ne doit plus exister (sante) */
  const cases = ["c-cgu", "c-newsletter"].map(id => { const x = document.getElementById(id), l = x && x.closest("label");
    return x ? { id, type: x.type, coche: x.checked, attr: x.hasAttribute("checked"), label: l ? l.textContent.replace(/\s+/g, " ").trim() : null, seul: l ? l.querySelectorAll("input").length : 0 } : null; });
  /* v64 (A2) : les deux mots de la case des conditions (lien vers le PDF, ou le mot seul) ; ce qui suit le second (« . » collé) */
  const liens = ["c-cgu-lien", "c-politique-lien"].map(id => { const x = document.getElementById(id);
    return x ? { id, tag: x.tagName, classe: x.className, texte: x.textContent.replace(/\s+/g, " ").trim(), href: x.getAttribute("href"), cible: x.getAttribute("target"), rel: x.getAttribute("rel"), dans: !!x.closest("label.co-cgu"), boutons: x.closest("label.co-cgu") ? x.closest("label.co-cgu").querySelectorAll("button").length : null } : null; });
  const p2 = document.getElementById("c-politique-lien"), suite = p2 && p2.nextSibling;
  return { titre: t(".carte-co h2"), sous: t(".carte-co .co-sous"), ordre: Array.from(document.querySelectorAll(".carte-co input")).map(i => i.id),
    labelNom: t('label[for="c-nom"]'), nomType: at("c-nom", "type"), nomAuto: at("c-nom", "autocomplete"), nomMax: at("c-nom", "maxlength"), prenomMax: at("c-prenom", "maxlength"),
    cases, sante: !!document.getElementById("c-sante") || !!document.querySelector(".co-sante"), liens, apres: suite ? (suite.nodeType === 3 ? suite.textContent : "<" + suite.nodeName + ">") + (suite.nextSibling ? "+" : "") : null,
    bouton: t("#c-go"), anciennes: !!document.getElementById("c-emails"), texte: document.body.innerText.replace(/\s+/g, " ") };
});
/* v64 (A2) : le point final de la case des conditions est-il sur la même ligne que la fin du dernier mot-lien (« politique de
   confidentialité » ; jusqu'à la v63 : le bouton des conditions) ? écart vertical en px entre le dernier caractère du mot et le « . » */
const ecartPoint = page => page.evaluate(() => {
  const l = document.getElementById("c-politique-lien") || document.getElementById("c-cgu-lien");
  if (!l) return null;
  const t = Array.from(l.childNodes).reverse().find(n => n.nodeType === 3 && n.textContent.trim()), n = l.nextSibling;
  if (!t || !n || n.nodeType !== 3 || !n.textContent.startsWith(".")) return null;
  const r1 = document.createRange(); r1.setStart(t, t.textContent.trimEnd().length - 1); r1.setEnd(t, t.textContent.trimEnd().length);
  const r2 = document.createRange(); r2.setStart(n, 0); r2.setEnd(n, 1);
  const a = r1.getClientRects(), z = r2.getClientRects();
  return a.length && z.length ? Math.abs(a[a.length - 1].top - z[0].top) : null;
}).catch(() => null);
/* v61 (lot 2, F) : utm_source=app, utm_medium=bouton (avant : app-mhx, app) ; code d'origine par défaut : le bouton du haut
   de l'accueil, accueil_haut (avant : decouverte) — le « _ » est accepté */
const lienLea = (params, source) => CAL + "?utm_source=app&utm_medium=bouton&utm_content=" + (source || "accueil_haut") + params;
/* la clé emails d'un compte, telle qu'elle est en base (faux Supabase) */
const contenu0 = (db, uid) => (db.donnees.find(d => d.user_id === uid && d.outil === "emails") || {}).contenu || {};

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF55_PORT=9711 node verif55.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== A0. v59 : interrupteurs forcés par le banc =================== */
  await bloc("A0. interrupteurs forcés par le banc", async () => {
    /* le banc de la page testée (tests-locaux/fichiers.js à côté d'elle ; au banc, celui de cette suite) : c'est lui qui
       sert les interrupteurs sur « test », quelle que soit la valeur écrite dans le fichier (Lucas peut passer « tous ») */
    const FT = require(path.join(path.dirname(HTML), "tests-locaux", "fichiers.js"));
    const NOMS = ["feedback_dimanche", "suivi_visites_clients"], V = ["test", "tous", "off", "Tous"];
    /* le fichier du disque avec la valeur v écrite dans chaque interrupteur (remplacement fait ici, sans fichiers.js) */
    const ecrire = (t, v) => t.replace(/\b(feedback_dimanche|suivi_visites_clients): "[^"\n]*"/g, (x, n) => n + ': "' + v + '"');
    /* ce que servirFichier (du banc testé) sert pour ce texte, sans retouche de suite */
    const servi = (f, t) => { let corps = null; FT.servirFichier({ url: "/" + f + "?v=1" }, { writeHead(){}, end(x){ corps = String(x); } }, HTML, null, () => t); return corps; };
    /* v72 (A) : le banc sert aussi le téléphone obligatoire ÉTEINT (forcerTelephone, fichiers.js) : « exactement le fichier », avec ce
       seul réglage éteint en plus */
    const eteint = t => typeof FT.forcerTelephone === "function" ? FT.forcerTelephone(t, false) : t;
    const index = fs.readFileSync(HTML, "utf8"), fichiers = listes(index), ecarts = [];
    for (const f of fichiers) {
      const t = fs.readFileSync(path.join(path.dirname(HTML), f), "utf8"), s = V.map(v => servi(f, ecrire(t, v)));
      if (s.some(x => x !== s[0]) || s[0] !== eteint(ecrire(t, "test"))) ecarts.push(f);
    }
    const conf = servi("js/config.js", ecrire(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8"), "tous")) || "";
    const surTest = NOMS.every(n => JSON.stringify(valeursNouveaute(conf, n)) === '["test"]') && (typeof FT.valeursTelephone !== "function" || JSON.stringify(FT.valeursTelephone(conf)) === '["false"]'), pageSans = NOMS.every(n => !valeursNouveaute(index, n).length);
    ok("A0 : le banc sert les interrupteurs sur « test » : chaque fichier css/ et js/ servi identique octet pour octet que le fichier dise « test », « tous », « off » ou « Tous » (sur « test » : exactement le fichier ; v72 : avec le téléphone obligatoire éteint) ; la page, servie sans retouche, n'en porte aucun",
      fichiers.includes("js/config.js") && !ecarts.length && surTest && pageSans, JSON.stringify({ ecarts, surTest, pageSans }));

    /* fichier simulé sur « tous » le temps du bloc (comme une branche v2/simu-tous-*), puis remis comme avant */
    const avant = process.env.BANC_SIMULER_NOUVEAUTES;
    process.env.BANC_SIMULER_NOUVEAUTES = "tous";
    try {
      const lus = FT.source(HTML), servie = typeof FT.sourceServie === "function" ? FT.sourceServie(HTML) : "";
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.etat("suivi_visites_clients"), Checkin.regle(), Activite.suivi()]);
      const regle = typeof FT.simulation === "function" && typeof FT.refusSimulation === "function"
        && FT.simulation({ GITHUB_REF: "refs/heads/v2/simu-tous-x" }) === "tous" && FT.simulation({ GITHUB_REF: "refs/heads/v2/simu-off-x" }) === "off"
        && FT.simulation({ GITHUB_REF: "refs/heads/v2/x" }) === "" && FT.simulation({ GITHUB_REF: "refs/heads/main" }) === ""
        && !!FT.refusSimulation({ GITHUB_REF: "refs/heads/main", BANC_SIMULER_NOUVEAUTES: "tous" }) && !!FT.refusSimulation({ GITHUB_REF: "refs/heads/main", BANC_SIMULER_NOUVEAUTES: "off" })
        && FT.refusSimulation({ GITHUB_REF: "refs/heads/v2/simu-tous-x" }) === "";
      const d = { lus: NOMS.map(n => valeursNouveaute(lus, n)), servie: NOMS.map(n => valeursNouveaute(servie, n)), r, regle };
      ok("A0 : fichier simulé sur « tous » (BANC_SIMULER_NOUVEAUTES ; branches v2/simu-tous-* et v2/simu-off-*, refusée sur main) : le banc lit « tous » dans le fichier, sert « test » (avec() l'y retrouve) ; Thomas (hors test) : bilan du vendredi, visites non suivies",
        JSON.stringify(d.lus) === '[["tous"],["tous"]]' && JSON.stringify(d.servie) === '[["test"],["test"]]' && JSON.stringify(r) === '["test","test","vendredi",false]' && regle, JSON.stringify(d));
      await c.close();
    } finally { if (avant === undefined) delete process.env.BANC_SIMULER_NOUVEAUTES; else process.env.BANC_SIMULER_NOUVEAUTES = avant; }
  });

  /* =================== A. interrupteurs des nouveautés =================== */
  await bloc("A. interrupteurs", async () => {
    /* le compte de test est lu dans le fichier servi (dépôt public : jamais recopié ici, jamais d'email) */
    const src = source(HTML);   // 52.1 : la page et tous ses fichiers (CONFIG est dans js/config.js)
    const conf = (/\n  nouveautes: \{([\s\S]*?)\n  \},/.exec(src) || [, ""])[1];
    const tab = (/comptes_test:\s*\[([^\]]*)\]/.exec(conf) || [, ""])[1];
    const ids = (tab.match(/"[^"]*"/g) || []).map(x => JSON.parse(x));
    const TEST = ids[0] || null;
    /* v59 : le banc sert toujours « test » (fichiers.js) ; dans le fichier, Lucas peut écrire off, test ou tous — une seule
       valeur par interrupteur, que le banc sait retoucher ; une faute de frappe (« Tous ») rend le banc rouge */
    const connue = n => { const v = valeursNouveaute(src, n); return v.length === 1 && ["off", "test", "tous"].includes(v[0]); };
    ok("CONFIG.nouveautes dans le fichier : feedback_dimanche et suivi_visites_clients, une seule valeur chacun, connue (off, test ou tous), que le banc sait retoucher ; au moins un compte de test, que des identifiants Supabase (aucun « @ »)",
      connue("feedback_dimanche") && connue("suivi_visites_clients") && ids.length >= 1 && ids.every(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(x)) && tab.indexOf("@") === -1, JSON.stringify({ feedback_dimanche: valeursNouveaute(src, "feedback_dimanche"), suivi_visites_clients: valeursNouveaute(src, "suivi_visites_clients") }) + " " + JSON.stringify(conf.slice(0, 300)));

    /* coach */
    {
      const db = base();
      const { c, page } = await contexte(b, COACH, db);
      await page.goto(URL0); await pret(page, "#tb-vue");
      const r = await page.evaluate(({ t, th }) => ({
        etat: Interrupteurs.etat("feedback_dimanche"), visible: Interrupteurs.visible("feedback_dimanche"),
        pourTest: Interrupteurs.pourCompte("feedback_dimanche", t), pourThomas: Interrupteurs.pourCompte("feedback_dimanche", th),
        pourRien: Interrupteurs.pourCompte("feedback_dimanche", "") || Interrupteurs.pourCompte("feedback_dimanche", null),
        inconnu: Interrupteurs.etat("pas_une_nouveaute"), visibleInconnu: Interrupteurs.visible("pas_une_nouveaute"), pourInconnu: Interrupteurs.pourCompte("pas_une_nouveaute", t),
        sansArobase: Array.isArray(CONFIG.nouveautes.comptes_test) && CONFIG.nouveautes.comptes_test.every(x => typeof x === "string" && x.indexOf("@") === -1),
        notifs: typeof Nouveautes === "object" && typeof Nouveautes.monter === "function" && typeof Nouveautes.badge === "function" && Nouveautes !== Interrupteurs
      }), { t: TEST, th: F.IDS.c1 });
      ok("coach : « test » → la nouveauté lui est visible (Interrupteurs.visible)", r.etat === "test" && r.visible === true, JSON.stringify(r));
      ok("pourCompte en « test » : vrai pour le compte de test, faux pour Thomas et sans identifiant", r.pourTest === true && r.pourThomas === false && r.pourRien === false, JSON.stringify(r));
      ok("nouveauté inconnue : « off », invisible même pour le coach ; aucun « @ » dans comptes_test (page)", r.inconnu === "off" && r.visibleInconnu === false && r.pourInconnu === false && r.sansArobase, JSON.stringify(r));
      ok("les Nouveautés du coach (objet Nouveautes, notifications) sont toujours là, à part des interrupteurs", r.notifs === true, JSON.stringify(r));
      const v = await page.evaluate(({ t }) => {
        const out = {};
        for (const x of ["Tous", "TEST", "on", "oui", "", null, undefined, true, 1]) {
          CONFIG.nouveautes.feedback_dimanche = x;
          out[JSON.stringify(x === undefined ? "undefined" : x)] = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)];
        }
        CONFIG.nouveautes.feedback_dimanche = "off"; out.off = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)];
        CONFIG.nouveautes.feedback_dimanche = "tous"; out.tous = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", "n-importe-qui")];
        CONFIG.nouveautes.feedback_dimanche = "test";
        return out;
      }, { t: TEST });
      const inconnues = Object.keys(v).filter(k => k !== "off" && k !== "tous");
      ok("valeur inconnue (« Tous », « TEST », « on », « oui », vide, null, absente, true, 1) : « off », invisible même pour le coach et le compte de test",
        inconnues.length === 9 && inconnues.every(k => v[k][0] === "off" && v[k][1] === false && v[k][2] === false), JSON.stringify(v));
      ok("« off » : invisible pour le coach et le compte de test ; « tous » : visible, et pour n'importe quel compte", JSON.stringify(v.off) === '["off",false,false]' && JSON.stringify(v.tous) === '["tous",true,true]', JSON.stringify(v));
      ok("coach : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }

    /* Thomas (client, pas compte de test), puis ajouté à comptes_test à chaud */
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => {
        const nom = "feedback_dimanche", uid = Auth.utilisateur().id;
        const a = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        CONFIG.nouveautes.comptes_test.push(uid);
        const b2 = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        CONFIG.nouveautes.comptes_test.pop();
        const c2 = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        return { a, b: b2, c: c2 };
      });
      ok("Thomas (client, pas compte de test) en « test » : la nouveauté ne lui est pas visible", r.a.visible === false && r.a.pour === false, JSON.stringify(r));
      ok("Thomas ajouté à comptes_test à chaud : visible, pourCompte vrai ; retiré : plus visible", r.b.visible === true && r.b.pour === true && r.c.visible === false && r.c.pour === false, JSON.stringify(r));
      ok("Thomas : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }

    /* le compte de test lui-même (sans prénom ni nom, comme le vrai) */
    if (TEST) {
      const db = base({ comptes: [{ id: TEST, prenom: "", nom: "", statut: "client", cree: avant(3 * J), donnees: [["intake", INTAKE_THOMAS, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(TEST, "test@exemple.fr"), db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => ({ coach: Auth.estCoach(), visible: Interrupteurs.visible("feedback_dimanche"), pour: Interrupteurs.pourCompte("feedback_dimanche", Auth.utilisateur().id) }));
      ok("compte client de test (son identifiant dans comptes_test) en « test » : la nouveauté lui est visible", r.coach === false && r.visible === true && r.pour === true, JSON.stringify(r));
      await c.close();
    } else ok("compte client de test : identifiant introuvable dans le fichier", false, conf);

    /* le fichier servi retouché : « tous », « off », valeur mal tapée */
    await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "tous"']], async () => {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche")]);
      ok("fichier sur « tous » : Thomas voit la nouveauté", JSON.stringify(r) === '["tous",true]', JSON.stringify(r));
      await c.close();
    });
    for (const [valeur, quoi] of [["off", "« off »"], ["Tous", "valeur mal tapée « Tous »"]]) {
      await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "' + valeur + '"']], async () => {
        const db = base();
        const { c, page } = await contexte(b, COACH, db);
        await page.goto(URL0); await pret(page, "#tb-vue");
        const r = await page.evaluate(t => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)], TEST);
        ok("fichier sur " + quoi + " : personne, pas même le coach ni le compte de test", JSON.stringify(r) === '["off",false,false]', JSON.stringify(r));
        await c.close();
      });
    }

    /* une prospecte en « test » : rien */
    {
      const LEA = PID(1);
      const db = base({ comptes: [{ id: LEA, prenom: "Léa", nom: "", cree: avant(2 * J), email: "lea@exemple.fr" }] });
      const { c, page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db);
      await page.goto(URL0); await pret(page);
      const r = await page.evaluate(() => [Auth.estProspect(), Interrupteurs.visible("feedback_dimanche")]);
      ok("prospecte en « test » : la nouveauté ne lui est pas visible", JSON.stringify(r) === "[true,false]", JSON.stringify(r));
      await c.close();
    }

    /* déconnecté (écran de connexion) : rien, sans erreur */
    {
      const db = base();
      const { c, page } = await contexte(b, null, db);
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      const r = await page.evaluate(() => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche")]);
      ok("déconnecté : invisible (aucune session)", JSON.stringify(r) === '["test",false]', JSON.stringify(r));
      await c.close();
    }
  });

  /* =================== B. corrections de la nuit : emails du compte =================== */
  await bloc("B. emails du compte", async () => {
    /* inscription (page servie avec inscription_libre: true) : erreurs d'envoi et limites */
    await inscriptionOuverte(async () => {
      for (const [quoi, err, attendu, langue] of [
        ["serveur d'emails en panne", { status: 500, msg: "Error sending confirmation email" }, TX.envoi_rate, ""],
        ["limite horaire d'emails du projet", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails, ""],
        ["limite par adresse (inchangée)", { status: 429, msg: "For security purposes, you can only request this after 42 seconds." }, TX.trop_demandes, ""],
        ["serveur d'emails en panne, en anglais", { status: 500, msg: "Error sending confirmation email" }, TX.envoi_rate_en, "en"]]) {
        const db = base(); db.inscription.erreur = err;
        const { c, page } = await contexte(b, null, db, { langue });
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
        await page.fill("#c-prenom", "Zoé"); if (await page.$("#c-nom")) await page.fill("#c-nom", "Martin");
        await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
        await page.check("#c-cgu");   // v64 : la seule case obligatoire (plus de case santé)
        await page.click("#c-go"); await attendre(page, 900);
        const t = norm(await page.textContent("#co-err").catch(() => ""));
        ok("inscription, " + quoi + " (« " + err.msg + " ») : « " + attendu.slice(0, 60) + "… », jamais le texte brut", db.inscriptions.length === 1 && t.includes(attendu) && !t.includes(err.msg), t);
        await c.close();
      }
    });
    /* mot de passe oublié — v52 (décision de Lucas) : l'app n'envoie plus aucun email : l'écran donne seulement l'adresse
       du coach (lien mailto), sans champ ni bouton d'envoi, et rien ne part vers /auth/v1/recover (même avec Entrée) */
    for (const langue of ["", "en"]) {
      const db = base();
      const { c, page } = await contexte(b, null, db, { langue });
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      await page.click('[data-mode="oubli"]'); await attendre(page, 400);
      const e = await page.evaluate(() => { const p = document.getElementById("co-oubli"), a = p && p.querySelector("a");
        return { t: p ? p.textContent.replace(/\s+/g, " ").trim() : null, href: a ? a.getAttribute("href") : null, email: !!document.getElementById("c-email"), go: !!document.getElementById("c-go") }; });
      const att = langue ? TX.oubli_en : TX.oubli;
      ok(`mot de passe oublié${langue ? " (anglais)" : ""} : seulement « ${att} » (lien mailto:mhx.coaching@gmail.com), ni champ email ni bouton d'envoi`, e.t === att && e.href === "mailto:mhx.coaching@gmail.com" && !e.email && !e.go, JSON.stringify(e));
      if (!langue) {
        /* un champ email encore là (ancienne version) est rempli : Entrée enverrait alors vraiment la demande */
        if (await page.$("#c-email")) { await page.fill("#c-email", "client@exemple.fr"); await page.focus("#c-email"); }
        await page.keyboard.press("Enter"); await attendre(page, 800);
        const envoi = db.oublis.length || db.chemins.filter(x => /\/auth\/v1\/(recover|otp|magiclink)/.test(x)).length;
        await page.click('[data-mode="connexion"]'); await attendre(page, 400);
        ok("mot de passe oublié : Entrée n'envoie rien (aucun appel /auth/v1/recover), « Retour à la connexion » ramène l'écran de connexion", envoi === 0 && !!(await page.$("#c-go")) && !!(await page.$("#c-email")), JSON.stringify(db.chemins));
      }
      await c.close();
    }
    /* liens de changement d'adresse, déconnecté */
    for (const [quoi, lien, attendu, langue] of [
      ["dernier lien cliqué (#access_token=…&type=email_change)", LIEN_DERNIER, TX.email_change, ""],
      ["premier lien cliqué (#message=Confirmation link accepted…)", LIEN_PREMIER, TX.premier_lien, ""],
      ["premier lien cliqué, en anglais", LIEN_PREMIER, TX.premier_lien_en, "en"]]) {
      const db = base();
      const { c, page } = await contexte(b, null, db, { langue });
      await page.goto(URL0 + lien); await page.waitForSelector("#c-go"); await attendre(page, 700);
      const t = norm(await page.textContent("#co-err").catch(() => "")), corpsPage = await page.textContent("body").catch(() => "");
      ok("changement d'adresse, " + quoi + ", déconnecté : « " + attendu.slice(0, 50) + "… », adresse nettoyée (ni jeton ni message), jamais l'anglais brut",
        t.includes(attendu) && !/access_token|message=/.test(page.url()) && !/Confirmation link accepted/.test(corpsPage), t + " · " + page.url());
      await c.close();
    }
    /* liens de changement d'adresse, connecté (Thomas) : un mot, et après le dernier lien la session est renouvelée tout de suite */
    {
      const db = base(); db.emails[F.IDS.c1] = "thomas.nouveau@exemple.fr";   // la base connaît déjà la nouvelle adresse
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + LIEN_DERNIER); await pret(page, "#acc-vue"); await attendre(page, 900);
      const r = await page.evaluate(() => ({ toasts: window.__toasts || [], email: (Auth.utilisateur() || {}).email }));
      ok("dernier lien, connecté : « " + TX.email_change + " », adresse nettoyée", r.toasts.some(x => norm(x).includes(TX.email_change)) && !/access_token/.test(page.url()), JSON.stringify(r.toasts) + " · " + page.url());
      ok("… session renouvelée tout de suite (Auth.rafraichir) : l'app connaît la nouvelle adresse, et le Profil l'affiche", db.tokens.includes("refresh_token") && r.email === "thomas.nouveau@exemple.fr" && await (async () => { await aller(page, "#/profil", 1800); return (await texte(page, "#vue")).includes("Adresse actuelle : thomas.nouveau@exemple.fr"); })(), JSON.stringify(db.tokens) + " · " + r.email);
      ok("… aucune écriture de données", ecrDonnees(db).length === 0, resume(db));
      await c.close();
    }
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + LIEN_PREMIER); await pret(page, "#acc-vue"); await attendre(page, 900);
      const toasts = await page.evaluate(() => window.__toasts || []);
      ok("premier lien, connecté : « Premier lien accepté… », adresse nettoyée, pas de renouvellement de session", toasts.some(x => norm(x).includes(TX.premier_lien)) && !/message=/.test(page.url()) && !db.tokens.includes("refresh_token"), JSON.stringify(toasts) + " · " + page.url() + " · " + JSON.stringify(db.tokens));
      await c.close();
    }
    /* Profil : changement d'adresse — v52 (décision de Lucas) : plus aucun envoi (ni PUT /auth/v1/user avec email) ; le Profil
       dit d'écrire au coach (lien mailto), le reste du compte ne change pas (mot de passe) ; FR puis EN */
    for (const langue of ["", "en"]) {
      const db = base(); if (langue) avecEn(db, F.IDS.c1);
      const { c, page } = await contexte(b, THOMAS, db, { langue });
      await page.goto(URL0 + "#/profil"); await pret(page, "#mc-email-aide");
      const e = await page.evaluate(() => { const p = document.getElementById("mc-email-aide"), a = p && p.querySelector("a");
        return { t: p ? p.textContent.replace(/\s+/g, " ").trim() : null, href: a ? a.getAttribute("href") : null, champ: !!document.getElementById("mc-email"), bouton: !!document.getElementById("mc-maj-email"), mdp: !!document.getElementById("mc-mdp") && !!document.getElementById("mc-actuel") }; });
      const vue = await texte(page, "#vue");
      ok(`Profil${langue ? " (anglais)" : ""}, changement d'adresse : seulement « ${langue ? TX.profil_mail_en : TX.profil_mail} » (lien mailto), plus de champ ni de bouton ; « ${langue ? TX.adresse_en : TX.adresse} » ; changement du mot de passe toujours là`,
        e.t === (langue ? TX.profil_mail_en : TX.profil_mail) && e.href === "mailto:mhx.coaching@gmail.com" && !e.champ && !e.bouton && e.mdp && vue.includes("thomas@exemple.fr" + (langue ? TX.adresse_en : TX.adresse)), JSON.stringify(e));
      await attendre(page, 600);
      ok(`Profil${langue ? " (anglais)" : ""} : aucun changement d'email envoyé (PUT /auth/v1/user), aucune écriture de données, aucune promesse de lien par email`, db.majUsers.length === 0 && !db.chemins.some(x => /^PUT \/auth\/v1\/user/.test(x)) && ecrDonnees(db).length === 0 && !/lien de confirmation|confirmation link|reset link|qu'arrive le lien/i.test(vue), resume(db) + " · " + JSON.stringify(db.chemins.filter(x => /auth/.test(x))));
      await c.close();
    }
  });

  /* =================== C. adresse réécrite quand la page n'est pas pour la personne =================== */
  await bloc("C. adresse", async () => {
    /* client Thomas */
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const d0 = await ou(page);
      ok("client, adresse vide : son accueil, l'adresse n'est pas réécrite", d0.courant === "accueil" && d0.hash === "", JSON.stringify(d0));
      await page.evaluate(() => { window.__hc = 0; window.__hl = history.length; addEventListener("hashchange", () => { window.__hc++; }); });
      const vus = [];
      /* v53 (lot D-clients) : le calculateur est ouvert au client (sa clé calc_perso, verif60) : la page coach qui reste
         fermée au client est désormais #/entrainement (l'outil du coach, clé perf) ; même vérification, mêmes nombres */
      for (const h of ["#/entrainement", "#/tableau", "#/clients", "#/decouverte", "#/inconnu"]) { await aller(page, h, 1200); vus.push([h, await ou(page)]); }
      const boucle = await page.evaluate(() => ({ hc: window.__hc, entrees: history.length - window.__hl }));
      ok("client : #/entrainement, #/tableau, #/clients, #/decouverte, #/inconnu → son accueil ET l'adresse #/accueil", vus.every(([, d]) => d.courant === "accueil" && d.hash === "#/accueil"), JSON.stringify(vus));
      ok("… sans boucle : un seul hashchange par adresse tapée, une seule entrée d'historique", boucle.hc === 5 && boucle.entrees === 5, JSON.stringify(boucle));
      await aller(page, "#/progression", 1400); const dp = await ou(page);
      await aller(page, "#/programme", 1400); const dg = await ou(page);
      ok("client : une page à lui garde son adresse (#/programme), un alias aussi (#/progression → Ma progression)", dp.courant === "mensurations" && dp.hash === "#/progression" && dg.courant === "programme" && dg.hash === "#/programme", JSON.stringify([dp, dg]));
      const p2 = await nouvellePage(c);
      await p2.goto(URL0 + "#/entrainement"); await pret(p2, "#acc-vue");   // v53 : #/calculateur est ouvert au client
      const d2 = await ou(p2);
      ok("client, ouverture directe sur #/entrainement (page du coach) : accueil, adresse #/accueil", d2.courant === "accueil" && d2.hash === "#/accueil", JSON.stringify(d2));
      ok("client : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }
    /* prospecte Léa */
    {
      const LEA = PID(2);
      const db = base({ comptes: [{ id: LEA, prenom: "Léa", nom: "", cree: avant(2 * J), email: "lea@exemple.fr" }] });
      const { c, page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db, { viewport: MOBILE });
      await page.goto(URL0); await pret(page);
      await aller(page, "#/clients", 1500); const d1 = await ou(page);
      await aller(page, "#/programme", 1500); const d2 = await ou(page); const verrou = !!(await page.$("#vue .verrou"));
      ok("prospecte : #/clients → son accueil, adresse #/accueil ; #/programme (vitrine) garde son adresse, page verrouillée", d1.courant === "accueil" && d1.hash === "#/accueil" && d2.courant === "programme" && d2.hash === "#/programme" && verrou, JSON.stringify([d1, d2, verrou]));
      ok("prospecte : aucune écriture, aucun défilement horizontal", db.ecritures.length === 0 && !(await deborde(page)), resume(db) + " · " + await largeur(page));
      await c.close();
    }
    /* coach : #/accueil hors fiche (ex. rechargement dans une fiche), puis « Ouvrir » du tableau de bord */
    for (const viewport of [ORDI, MOBILE]) {
      const db = base();
      const { c, page } = await contexte(b, COACH, db, { viewport });
      await page.goto(URL0 + "#/accueil"); await pret(page, "#tb-vue");
      const d0 = await ou(page);
      ok(`coach (${viewport.width} px) sur #/accueil hors fiche : tableau de bord, adresse #/tableau`, d0.courant === "tableau" && d0.hash === "#/tableau", JSON.stringify(d0));
      await page.waitForSelector('#tb-vue button[data-fiche][data-cible="accueil"]', { timeout: 8000 });
      const cible = await page.$eval('#tb-vue button[data-fiche][data-cible="accueil"]', x => ({ id: x.dataset.fiche, nom: x.dataset.nom }));
      await page.click(`#tb-vue button[data-fiche="${cible.id}"][data-cible="accueil"]`);
      await page.waitForSelector("#vue .bandeau strong", { timeout: 8000 }).catch(() => {}); await attendre(page, 900);
      const d1 = await ou(page), fiche = await page.evaluate(() => Store.idConsulte), titre = await texte(page, "#vue .bandeau strong");
      /* v71 (I) : l'adresse porte la fiche (#/client/<uuid>/accueil), posée par Clients.ouvrir */
      ok(`coach (${viewport.width} px) : « Ouvrir » (${cible.nom}) ouvre bien sa fiche (Store.idConsulte, #/client/<uuid>/accueil, bandeau « Fiche de ${cible.nom} »)`, fiche === cible.id && d1.courant === "accueil" && d1.hash === "#/client/" + cible.id + "/accueil" && titre === "Fiche de " + cible.nom, JSON.stringify([d1, fiche, titre]));
      await aller(page, "#/clients", 1500); const d2 = await ou(page);
      ok(`coach (${viewport.width} px) : une page du coach garde son adresse (#/clients) et quitte la fiche`, d2.courant === "clients" && d2.hash === "#/clients" && (await page.evaluate(() => Store.idConsulte)) === null, JSON.stringify(d2));
      ok(`coach (${viewport.width} px) : aucune écriture`, db.ecritures.length === 0, resume(db));
      await c.close();
    }
    /* v71 (I) : la fiche consultée est dans l'adresse : un rechargement sur #/client/<uuid>/programme rouvre la fiche (profil relu
       avant l'affichage) ; uuid inconnu → Mes clients ; « Revenir … » ramène à l'écran d'origine (tableau de bord, Prospects) ;
       l'onglet Entraînement du coach n'apparaît pas dans une fiche */
    {
      const db = base({ comptes: [{ id: PID(80), prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "lea80@exemple.fr", donnees: [["intake", INTAKE_THOMAS, avant(2 * J)]] }] });   // une prospecte pour la page Prospects
      const { c, page } = await contexte(b, COACH, db, { viewport: ORDI });
      await page.goto(URL0 + "#/client/" + F.IDS.c1 + "/programme"); await pret(page, "#vue .bandeau"); await attendre(page, 1500);
      const e1 = await page.evaluate(() => ({ consulte: Store.idConsulte, courant, hash: location.hash, titre: ($("vue").querySelector(".bandeau strong") || {}).textContent, h1: ($("vue").querySelector(".masthead h1") || {}).textContent, prog: Array.from(document.querySelectorAll("#prog-vue input")).some(i => i.value === "Bloc 1 — 4 semaines"), nav: Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id), bouton: ($("sortir-fiche") || {}).textContent, liens: Array.from(document.querySelectorAll("#vue .bandeau-actions a")).map(a => a.getAttribute("href")) }));
      ok("coach : rechargement sur #/client/<uuid>/programme → la fiche de Thomas (bandeau, « Son programme », SON programme), « Revenir à mes clients », liens du bandeau canoniques, pas d'onglet Entraînement", e1.consulte === F.IDS.c1 && e1.courant === "programme" && e1.hash === "#/client/" + F.IDS.c1 + "/programme" && e1.titre === "Fiche de Thomas Démo" && e1.h1 === "Son programme" && e1.prog && !e1.nav.includes("entrainement") && e1.bouton === "Revenir à mes clients" && e1.liens.length > 0 && e1.liens.every(h => h.startsWith("#/client/" + F.IDS.c1 + "/")), JSON.stringify(e1));
      await page.goto(URL0 + "#/client/00000000-0000-4000-8000-00000000dead/programme"); await pret(page, "#tb-clients"); await attendre(page, 800);
      ok("coach : uuid inconnu → Mes clients (#/clients), aucune fiche ouverte", (await ou(page)).hash === "#/clients" && (await page.evaluate(() => Store.idConsulte)) === null, JSON.stringify(await ou(page)));
      await aller(page, "#/tableau", 1500); await page.waitForSelector("#tb-vue button[data-fiche]", { timeout: 8000 }); await page.click("#tb-vue button[data-fiche]"); await pret(page, "#vue .bandeau"); await attendre(page, 600);
      const b1 = await texte(page, "#sortir-fiche"); await page.click("#sortir-fiche"); await attendre(page, 1200); const d1 = await ou(page);
      ok("coach : fiche ouverte depuis le tableau de bord → « Revenir au tableau de bord » ramène sur #/tableau", b1 === "Revenir au tableau de bord" && d1.courant === "tableau" && d1.hash === "#/tableau", b1 + " " + JSON.stringify(d1));
      await aller(page, "#/prospects", 1800); await page.click('[data-filtre="tous"]').catch(() => {}); await page.waitForSelector('#pr-liste [data-sc="fiche"]', { timeout: 8000 }); await page.click('#pr-liste [data-sc="fiche"]'); await pret(page, "#vue .bandeau"); await attendre(page, 600);
      const b2 = await texte(page, "#sortir-fiche"); await page.click("#sortir-fiche"); await attendre(page, 1200); const d2 = await ou(page);
      ok("coach : fiche ouverte depuis Prospects → « Revenir aux prospects » ramène sur #/prospects", b2 === "Revenir aux prospects" && d2.courant === "prospects" && d2.hash === "#/prospects", b2 + " " + JSON.stringify(d2));
      ok("coach : ces parcours n'écrivent rien", db.ecritures.length === 0, resume(db));
      await c.close();
    }
  });

  /* =================== D. première connexion d'un client sur téléphone =================== */
  await bloc("D. Profil sur téléphone", async () => {
    /* 390 px, clavier ouvert (fenêtre de 380 px de haut) : l'écran de connexion est défilé jusqu'au bouton (230 px), puis
       « Se connecter » recharge la page. Le navigateur remettait l'ancien défilement à la FIN du chargement : quand les
       fichiers de police arrivent après l'affichage du Profil (réseau mobile), le Profil sautait à 230 px, l'encadré caché
       sous l'en-tête (mesuré sur la v51). Feuille de style elle-même retenue : les scripts attendent, même contrôle. */
    let k = 0;
    for (const [quoi, polices] of [["fichiers de police retardés de 2,5 s", { fichiers: 2500 }], ["feuille des polices (css/jetons.css) retenue 2,5 s", { css: 2500 }], ["polices immédiates", {}]]) {
      const CAM = PID(20 + k), mail = "camille" + k++ + "@exemple.fr";
      const db = base({ comptes: [{ id: CAM, prenom: "Camille", nom: "Martin", statut: "client", cree: avant(J), email: mail }] });
      db.connexions[mail] = CAM; db.polices = polices;
      const { c, page } = await contexte(b, null, db, { viewport: { width: 390, height: 380 } });
      await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 15000 }); await attendre(page, 300);
      await page.fill("#c-email", mail); await page.fill("#c-mdp", "motdepasse1");
      const y0 = await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); return window.scrollY; });
      const n0 = db.lectures.length;
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 20000 }), page.click("#c-go")]);
      await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true && !!document.querySelector("#vue .bandeau"), null, { timeout: 15000 });
      await attendre(page, 1500);   // la fin du chargement est passée : une remise en place du navigateur aurait eu lieu
      const m = await page.evaluate(() => {
        const bd = document.querySelector("#vue .bandeau"), tb = document.querySelector(".topbar");
        return { y: window.scrollY, haut: bd ? Math.round(bd.getBoundingClientRect().top) : null, entete: tb ? Math.round(tb.getBoundingClientRect().bottom) : null,
          texte: bd ? bd.querySelector("strong").textContent : "", nb: document.querySelectorAll("#vue .bandeau").length, restauration: history.scrollRestoration,
          courant, hash: location.hash, hauteur: innerHeight };
      });
      ok(`première connexion (${quoi}) : l'écran de connexion était défilé (${y0} px)`, y0 > 50, String(y0));
      ok(`… le Profil s'ouvre tout en haut (défilement 0), l'encadré « Bienvenue ! » visible sous l'en-tête`, m.y === 0 && m.haut !== null && m.entete !== null && m.haut >= m.entete - 1 && m.haut < m.hauteur && m.texte === "Bienvenue !", JSON.stringify(m));
      ok(`… un seul affichage du Profil : intake lu 2 fois (démarrage + page), un seul encadré, adresse #/profil, défilement géré par l'app`, lu(db, "intake", n0) === 2 && m.nb === 1 && m.courant === "profil" && m.hash === "#/profil" && m.restauration === "manual", "intake lu " + lu(db, "intake", n0) + " fois · " + JSON.stringify(m));
      ok(`… aucune écriture`, ecrDonnees(db).length === 0, resume(db));
      await c.close();
    }
    /* l'encadré en anglais : les variantes « une / deux réponses manquent » et « reprends ton profil » */
    const TOUT = { nom: "Camille Martin", age: "34", sexe: "Femme", taille: "165", poids: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", lieu: "Salle complète", seances: "3", journee_type: "Tartines le matin, pâtes à midi, soupe le soir.", nb_repas: "3 repas", regime_type: "Omnivore" };
    const sans = (...k) => { const o = Object.assign({}, TOUT, { complet: false }); k.forEach(x => delete o[x]); return o; };
    let i = 0;
    for (const [quoi, I, titre, note] of [
      ["1 réponse obligatoire manque", sans("regime_type"), "One answer is missing from your profile.", "Fill it in and save: it takes ten seconds."],
      ["2 réponses obligatoires manquent", sans("nb_repas", "regime_type"), "Two answers are missing from your profile.", "Fill them in and save: it takes a few seconds."],
      ["7 réponses obligatoires manquent", sans("objectif", "niveau", "lieu", "seances", "journee_type", "nb_repas", "regime_type"), "Pick up your profile where you left off.", "Your first answers are saved: complete the rest and save."]]) {
      const id = PID(30 + i++), mail = "client" + i + "@exemple.fr";
      const db = base({ comptes: [{ id, prenom: "Camille", nom: "Martin", statut: "client", cree: avant(5 * J), donnees: [["intake", I, avant(2 * J)], ["prefs", { langue: "en" }, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(id, mail), db, { langue: "en", viewport: MOBILE });
      await page.goto(URL0); await pret(page, "#vue .bandeau");
      const tb = await texte(page, "#vue .bandeau strong"), tn = await texte(page, "#vue .bandeau .note");
      ok(`encadré de première connexion en anglais, ${quoi} : « ${titre} » + « ${note} »`, tb === titre && tn === note, tb + " · " + tn);
      await c.close();
    }
  });

  /* =================== E. inscription : nom, deux cases (v64), accords datés et versionnés, copie « emails » =================== */
  await bloc("E. inscription : écran", async () => {
    await inscriptionOuverte(() => avecLegaux(LEGAUX_TEST, async () => {
      for (const langue of ["", "en"]) {
        const T = k => TXB[k + (langue ? "_en" : "")], L = langue ? " (anglais)" : "";
        const db = base();
        legaux = LEGAUX_TEST;   // v64 : liens de test valides (CONFIG.textes_legaux), puis « à compléter » plus bas
        const { c, page } = await contexte(b, null, db, { viewport: MOBILE, langue });
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 400);
        const e = await ecranInscription(page);
        ok(`inscription${L} : « ${T("titre")} », « ${T("sous").slice(0, 45)}… », bouton « ${T("bouton")} », aucun « 7 jours » / « 7 days » ni email de confirmation promis à l'écran`, e.titre === T("titre") && e.sous === T("sous") && e.bouton === T("bouton") && !SEPT.test(e.texte) && !/email de confirmation|lien de confirmation|confirmation (email|link)/i.test(e.texte), JSON.stringify({ titre: e.titre, sous: e.sous, bouton: e.bouton, sept: (SEPT.exec(e.texte) || [""])[0] }));
        ok(`inscription${L} : champ « ${T("nom")} » (#c-nom) juste après le prénom, type text, autocomplete="family-name", maxlength="60" (prénom : maxlength="60" aussi)`,
          e.ordre[e.ordre.indexOf("c-prenom") + 1] === "c-nom" && e.labelNom === T("nom") && e.nomType === "text" && e.nomAuto === "family-name" && e.nomMax === "60" && e.prenomMax === "60", JSON.stringify(e.ordre) + " " + JSON.stringify([e.labelNom, e.nomType, e.nomAuto, e.nomMax, e.prenomMax]));
        /* v64 (A3) : plus de case santé ni de texte « données de santé » à l'inscription (accord au premier usage) */
        ok(`inscription${L} : deux cases séparées (conditions, newsletter), chacune seule dans son libellé, aucune cochée d'avance, dans cet ordre avant « Rester connecté » ; plus de case santé (#c-sante) ni « ${langue ? "health data" : "données de santé"} » à l'écran ; plus de case « emails de suivi »`,
          e.cases.every(x => x && x.type === "checkbox" && !x.coche && !x.attr && x.seul === 1) && e.ordre.slice(e.ordre.indexOf("c-cgu")).join(",") === "c-cgu,c-newsletter,c-rester" && !e.sante && !/données de santé|health data/i.test(e.texte) && !e.anciennes, JSON.stringify(e.cases) + " · " + JSON.stringify(e.ordre) + " · santé " + e.sante + " " + ((/.{0,40}(données de santé|health data).{0,20}/i.exec(e.texte) || [""])[0]));
        ok(`inscription${L} : case newsletter, texte exact « ${T("news").slice(0, 55)}… »`, !!e.cases[1] && e.cases[1].label === T("news"), e.cases[1] && e.cases[1].label);
        /* v64 (A2) : « CGU » et « politique de confidentialité » = deux liens distincts vers les PDF (CONFIG.textes_legaux ; jamais
           cliqués : réseau), le point collé au second ; « à compléter » : le mot seul (span.lien-absent, même id), qui n'ouvre
           aucun volet (le volet des conditions reste dans le Profil) */
        const lienOk = (x, id, mot, href) => !!x && x.id === id && x.tag === "A" && /\blien\b/.test(x.classe) && x.texte === mot && x.href === href && x.cible === "_blank" && x.rel === "noopener" && x.dans && x.boutons === 0;
        const liens = lienOk(e.liens[0], "c-cgu-lien", T("cgu_mots")[0], LEGAUX_TEST.cgu_pdf) && lienOk(e.liens[1], "c-politique-lien", T("cgu_mots")[1], LEGAUX_TEST.confidentialite_pdf) && e.apres === ".";
        legaux = LEGAUX_VIDES;
        await page.reload(); await page.waitForSelector("#c-go"); await attendre(page, 400);
        const e2 = await ecranInscription(page);
        const motOk = (x, id, mot) => !!x && x.id === id && x.tag === "SPAN" && /\blien-absent\b/.test(x.classe) && x.texte === mot && x.href === null && x.cible === null && x.dans && x.boutons === 0;
        const clic = await page.evaluate(async () => {
          const cgu = document.getElementById("c-cgu"), avant = cgu && cgu.checked;
          for (const id of ["c-cgu-lien", "c-politique-lien"]) { const x = document.getElementById(id); if (x && x.tagName === "SPAN") x.click(); }
          await new Promise(r => setTimeout(r, 500));
          const volet = !!document.querySelector(".volet") || !!(window.UI && UI._ouverte);
          if (cgu) cgu.checked = avant;
          return volet;
        }).catch(() => null);
        const vides = motOk(e2.liens[0], "c-cgu-lien", T("cgu_mots")[0]) && motOk(e2.liens[1], "c-politique-lien", T("cgu_mots")[1]) && e2.apres === "." && e2.cases[0] && e2.cases[0].label === T("cgu") && clic === false;
        ok(`inscription${L} : case des conditions, texte exact « ${T("cgu")} » (l'âge y est) ; « ${T("cgu_mots")[0]} » et « ${T("cgu_mots")[1]} » : deux liens distincts vers les PDF (href = CONFIG.textes_legaux.cgu_pdf / confidentialite_pdf, target=_blank, rel=noopener), aucun bouton, le « . » collé au second ; liens « à compléter » : le mot seul (span.lien-absent, même id, sans lien) qui n'ouvre aucun volet`,
          !!e.cases[0] && e.cases[0].label === T("cgu") && liens && vides, JSON.stringify({ label: e.cases[0] && e.cases[0].label, liens: e.liens, apres: e.apres, vides: e2.liens, apres2: e2.apres, clic }));
        /* v64 (A2) : le point final ne tombe plus seul sous le lien (à 320, 375 et 390 px, liens de test puis « à compléter ») */
        const mesures = [];
        for (const v of [LEGAUX_VIDES, LEGAUX_TEST]) {
          if (legaux !== v) { legaux = v; await page.reload(); await page.waitForSelector("#c-go"); await attendre(page, 300); }
          for (const w of [390, 375, 320]) { await page.setViewportSize({ width: w, height: MOBILE.height }); await attendre(page, 200); mesures.push({ w, lien: v === LEGAUX_TEST, deborde: await deborde(page), ecart: await ecartPoint(page) }); }
        }
        await page.setViewportSize(MOBILE); await attendre(page, 200);
        ok(`inscription${L}, téléphone 390, 375 et 320 px : aucun défilement horizontal ; le point final sur la même ligne que la fin de « ${T("cgu_mots")[1]} » (jamais seul sous le lien), avec ou sans lien`,
          mesures.length === 6 && mesures.every(m => !m.deborde && m.ecart !== null && m.ecart <= 2), JSON.stringify(mesures));
        await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");
        await page.click("#c-go"); await attendre(page, 300);
        const m1 = norm(await page.textContent("#co-err").catch(() => ""));
        await page.fill("#c-nom", "   "); await page.click("#c-go"); await attendre(page, 300);
        const m2 = norm(await page.textContent("#co-err").catch(() => ""));
        ok(`inscription${L} : nom vide ou fait d'espaces → « ${T("nom_manque")} », rien n'est envoyé`, m1 === T("nom_manque") && m2 === T("nom_manque") && db.inscriptions.length === 0, m1 + " · " + m2 + " · " + db.inscriptions.length);
        await c.close();
      }
    }));
  });

  /* v64 (lot 5, A) : servi avec LEGAUX_TEST (version des CGU de test « 2026-10-15 », distincte du texte court 2026-10-01) */
  await bloc("E. inscription : accords et copie", async () => {
    await inscriptionOuverte(() => avecLegaux(LEGAUX_TEST, async () => {
      for (const news of [false, true]) {
        const ZID = PID(40 + (news ? 1 : 0)), mail = "zoe" + (news ? 1 : 0) + "@exemple.fr", Q = news ? "AVEC la newsletter" : "sans la newsletter";
        const db = base(); db.inscription.id = ZID;
        const { c, page } = await contexte(b, null, db, { viewport: MOBILE });
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
        const versions = await page.evaluate(() => ({ c: DECOUVERTE.confidentialite.version, a: JSON.parse(JSON.stringify(DECOUVERTE.accords || null)), l: JSON.parse(JSON.stringify(CONFIG.textes_legaux || null)) }));
        await remplir(page, { prenom: "Zoé", nom: "  Martin ", email: mail, news });
        const t0 = Date.now();
        await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 15000 }), page.click("#c-go")]);
        await pret(page); await attendre(page, 2200);
        const md = (db.inscriptions[0] || {}).data || {}, cles = Object.keys(md).sort().join(",");
        const date = x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}T/.test(x) && Math.abs(Date.parse(x) - t0) < 10000;
        ok(`inscription ${Q} : métadonnées exactement ${CLES_META} (plus d'emails_suivi ; aucun accord santé : ni consentement_sante ni sante_version)`, db.inscriptions.length === 1 && cles === CLES_META && !("consentement_sante" in md) && !("sante_version" in md), db.inscriptions.length + " · " + cles);
        ok(`… prénom « Zoé », nom « Martin » (espaces retirés) ; conditions datées de l'inscription ; conditions_version = CONFIG.textes_legaux.cgu_version = accords.conditions (${LEGAUX_TEST.cgu_version} servie), plus la version du texte court (${V_COND})`,
          md.prenom === "Zoé" && md.nom === "Martin" && date(md.consentement) && md.conditions_version === LEGAUX_TEST.cgu_version && !!versions.l && versions.l.cgu_version === LEGAUX_TEST.cgu_version && !!versions.a && versions.a.conditions === LEGAUX_TEST.cgu_version && versions.c === V_COND && md.conditions_version !== versions.c,
          JSON.stringify(md) + " · " + JSON.stringify(versions));
        if (news) ok(`… newsletter cochée : newsletter = l'instant de l'inscription, newsletter_version = accords.newsletter (${V_NEWS_INSC}, texte court de la case)`, date(md.newsletter) && md.newsletter === md.consentement && md.newsletter_version === V_NEWS_INSC && versions.a.newsletter === V_NEWS_INSC, JSON.stringify(md));
        else ok(`… newsletter laissée décochée : l'inscription passe quand même, newsletter = null, newsletter_version = ${V_NEWS_INSC} (le texte montré)`, "newsletter" in md && md.newsletter === null && md.newsletter_version === V_NEWS_INSC, JSON.stringify(md));
        const prof = db.profils.find(x => x.id === ZID) || {};
        const apres = await page.evaluate(() => ({ prospect: Auth.estProspect(), nom: (Auth.profil || {}).nom })).catch(() => ({}));
        ok(`… profil créé avec le nom (déclencheur creer_profil → profils.nom), lu par l'app ; jamais rangé dans intake.nom`,
          prof.nom === "Martin" && apres.prospect === true && apres.nom === "Martin" && ecr(db, "intake").every(x => !(x.contenu && typeof x.contenu === "object" && "nom" in x.contenu)), JSON.stringify(prof) + " · " + JSON.stringify(apres) + " · " + resume(db));
        const E1 = ecr(db, "emails", ZID), att = { newsletter: news, maj: news ? md.newsletter : md.consentement, version: V_NEWS_INSC, source: "inscription" };   // v64 : la version de la case de l'inscription
        ok(`… première ouverture : clé emails écrite une fois, exactement ${JSON.stringify(Object.assign({}, att, { maj: "<date de l'accord>" }))} ; rien d'autre d'écrit`,
          E1.length === 1 && JSON.stringify(E1[0].contenu) === JSON.stringify(att) && ecrDonnees(db).every(x => x.outil === "emails"), JSON.stringify(E1.map(x => x.contenu)) + " · " + resume(db));
        await page.reload(); await pret(page); await attendre(page, 2000);
        ok(`… rechargement (deuxième ouverture) : la clé existe, rien n'est réécrit`, ecr(db, "emails", ZID).length === 1, resume(db));
        await c.close();
      }
    }));
  });

  await bloc("E. inscription : anglais, longueur, lien de confirmation", async () => {
    await inscriptionOuverte(() => avecLegaux(LEGAUX_TEST, async () => {
      /* anglais + noms trop longs (valeurs posées par script : maxlength ne s'applique pas) */
      {
        const ZID = PID(42), db = base(); db.inscription.id = ZID;
        const { c, page } = await contexte(b, null, db, { langue: "en" });
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
        await remplir(page, { prenom: "Zoé", nom: "Martin", email: "zoe2@exemple.fr", news: true });
        await page.evaluate(() => { document.getElementById("c-prenom").value = " " + "P".repeat(70); document.getElementById("c-nom").value = "N".repeat(70) + " "; });
        await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 15000 }), page.click("#c-go")]);
        await pret(page); await attendre(page, 2000);
        const md = (db.inscriptions[0] || {}).data || {};
        ok("inscription en anglais, newsletter cochée : mêmes métadonnées (" + CLES_META + " : conditions_version " + LEGAUX_TEST.cgu_version + " servie, newsletter datée, version " + V_NEWS_INSC + ", aucun accord santé) ; prénom et nom coupés à 60 caractères", Object.keys(md).sort().join(",") === CLES_META && md.prenom === "P".repeat(60) && md.nom === "N".repeat(60) && typeof md.newsletter === "string" && md.newsletter_version === V_NEWS_INSC && !("sante_version" in md) && !("consentement_sante" in md) && md.conditions_version === LEGAUX_TEST.cgu_version, JSON.stringify(md).slice(0, 300));
        ok("… copie emails { newsletter: true } à la première ouverture", ecr(db, "emails", ZID).length === 1 && (ecr(db, "emails", ZID)[0].contenu || {}).newsletter === true, resume(db));
        await c.close();
      }
      /* « Confirm email » activé : pas de session à l'inscription ; v66 : le lien de l'email n'ouvre plus de session (jetons
         ignorés) : la copie se fait à la première connexion par mot de passe */
      {
        const ZID = PID(43), db = base(); db.inscription.id = ZID; db.inscription.confirmation = true;
        const { c, page } = await contexte(b, null, db);
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
        await remplir(page, { prenom: "Zoé", nom: "Martin", email: "zoe3@exemple.fr", news: true });
        await page.click("#c-go"); await attendre(page, 1500);
        const h2 = norm(await page.textContent(".carte-co h2").catch(() => ""));
        ok("« Confirm email » activé : écran « Vérifie ta boîte mail », rien d'écrit (personne n'est encore connecté)", h2 === "Vérifie ta boîte mail" && db.inscriptions.length === 1 && ecrDonnees(db).length === 0, h2 + " · " + resume(db));
        await page.close();
        const p2 = await nouvellePage(c);
        await p2.goto(URL0 + "#access_token=lien." + ZID + ".x&expires_in=3600&refresh_token=renouvellement-" + ZID + "&token_type=bearer&type=signup");
        await p2.waitForSelector("#c-go", { timeout: 10000 }); await attendre(p2, 400);
        const l0 = { url: p2.url(), err: await texte(p2, "#co-err"), session: await p2.evaluate(() => !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session"))), ecrit: ecrDonnees(db).length };
        db.connexions["zoe3@exemple.fr"] = ZID;
        await p2.fill("#c-email", "zoe3@exemple.fr"); await p2.fill("#c-mdp", "motdepasse1");
        await Promise.all([p2.waitForNavigation({ waitUntil: "load", timeout: 15000 }), p2.click("#c-go")]);
        await pret(p2); await attendre(p2, 2200);
        const E1 = ecr(db, "emails", ZID), md = db.meta[ZID] || {};
        ok("… clic sur le lien de l'email : aucune session (« Ce lien n'est plus valable », adresse nettoyée, rien d'écrit) ; connectée par mot de passe, prospecte, la newsletter de ses métadonnées (lues par /auth/v1/user) est recopiée une fois : { newsletter: true, maj = date de la case, version, source: \"inscription\" }",
          !l0.session && l0.err.startsWith("Ce lien n'est plus valable") && !/access_token/.test(l0.url) && l0.ecrit === 0 && (await p2.evaluate(() => Auth.estProspect()).catch(() => false)) && E1.length === 1 && JSON.stringify(E1[0].contenu) === JSON.stringify({ newsletter: true, maj: md.newsletter, version: V_NEWS_INSC, source: "inscription" }), JSON.stringify(l0) + " · " + JSON.stringify(E1.map(x => x.contenu)));
        await c.close();
      }
    }));
  });

  await bloc("E. copie emails : les cas où rien n'est écrit", async () => {
    const meta = (o) => Object.assign({ prenom: "Léa", nom: "Martin", consentement: avant(2 * H), conditions_version: V52, consentement_sante: avant(2 * H), sante_version: V52, newsletter_version: V_NEWS }, o);
    const ouvrir = async (who, db, opts) => { const x = await contexte(b, who, db, opts); await x.page.goto(URL0); await pret(x.page); await attendre(x.page, 2200); return x; };
    const L1 = PID(50);
    const compte = (o) => [Object.assign({ id: L1, prenom: "Léa", nom: "Martin", cree: avant(2 * H), email: "lea@exemple.fr" }, o || {})];
    /* compte d'avant la v52 : seulement l'ancien accord des emails de suivi */
    {
      const db = base({ comptes: compte() });
      await ouvrir(qui(L1, "lea@exemple.fr", { prenom: "Léa", nom: "", consentement: avant(J), conditions_version: "2026-09", consentement_sante: avant(J), emails_suivi: avant(J) }), db);
      ok("compte d'avant la v52 (emails_suivi seulement, pas de case newsletter) : aucune copie, rien d'écrit (l'ancien accord ne vaut pas newsletter)", ecrDonnees(db).length === 0 && lu(db, "emails") === 0, resume(db));
    }
    /* compte sans aucune métadonnée (créé par le coach, ou fausse session des autres suites) */
    {
      const db = base({ comptes: compte() });
      await ouvrir(qui(L1, "lea@exemple.fr"), db);
      ok("prospect sans métadonnées : aucune copie, aucune lecture de la clé emails, rien d'écrit", ecrDonnees(db).length === 0 && lu(db, "emails") === 0, resume(db));
    }
    /* client et coach avec une case newsletter dans leurs métadonnées : jamais de copie (prospect seulement) */
    {
      const db = base();
      await ouvrir(qui(F.IDS.c1, "thomas@exemple.fr", meta({ prenom: "Thomas", newsletter: avant(H) })), db);
      await ouvrir(qui(F.IDS.coach, "coach@exemple.fr", meta({ prenom: "Coach", newsletter: avant(H) })), db, {});
      ok("client Thomas et coach avec newsletter dans leurs métadonnées : aucune copie, rien d'écrit", ecrDonnees(db).length === 0 && ecr(db, "emails").length === 0, resume(db));
    }
    /* la clé existe déjà (choix changé dans le Profil) : jamais écrasée */
    {
      const deja = { newsletter: false, maj: avant(H), version: V_NEWS, source: "profil", suivi: false };
      const db = base({ comptes: compte({ donnees: [["emails", deja, avant(H)]] }) });
      await ouvrir(qui(L1, "lea@exemple.fr", meta({ newsletter: avant(2 * H) })), db);
      ok("clé emails déjà là (newsletter: false depuis le Profil) alors que la case était cochée : rien d'écrit, la clé est intacte", ecrDonnees(db).length === 0 && JSON.stringify((db.donnees.find(d => d.user_id === L1 && d.outil === "emails") || {}).contenu) === JSON.stringify(deja), resume(db));
    }
    /* lecture ratée : rien ; la fois suivante (réseau revenu) : la copie part, une fois */
    {
      const db = base({ comptes: compte(), lectureKo: ["emails"] });
      const m = meta({ newsletter: avant(2 * H) });
      const x = await ouvrir(qui(L1, "lea@exemple.fr", m), db);
      ok("lecture de la clé emails ratée (500) : rien n'est écrit", lu(db, "emails") >= 1 && ecrDonnees(db).length === 0, resume(db) + " · lectures emails " + lu(db, "emails"));
      db.lectureKo = [];
      await x.page.reload(); await pret(x.page); await attendre(x.page, 2200);
      ok("… ouverture suivante, réseau revenu : la copie part, une seule fois ({ newsletter: true, maj = date de la case })", ecr(db, "emails", L1).length === 1 && JSON.stringify(ecr(db, "emails", L1)[0].contenu) === JSON.stringify({ newsletter: true, maj: m.newsletter, version: V_NEWS, source: "inscription" }), resume(db));
    }
    /* un choix fait sur cet appareil attend son envoi (copie « mhx_attente|… ») : c'est lui qui part, pas la copie de l'inscription */
    {
      const choix = { newsletter: false, maj: avant(30 * MIN), version: V_NEWS, source: "profil", suivi: false };
      const db = base({ comptes: compte() });
      await ouvrir(qui(L1, "lea@exemple.fr", meta({ newsletter: avant(2 * H) })), db, { stockage: { ["mhx_attente|" + L1 + "|emails"]: JSON.stringify({ a: L1, t: avant(30 * MIN), v: choix }) } });
      const E1 = ecr(db, "emails", L1);
      ok("choix du Profil resté sur l'appareil (hors ligne) : il est envoyé tel quel, une seule écriture, la case de l'inscription ne l'écrase pas", E1.length === 1 && JSON.stringify(E1[0].contenu) === JSON.stringify(choix), JSON.stringify(E1.map(x => x.contenu)));
    }
    /* la clé apparaît entre la lecture et l'écriture (autre onglet, Profil) : insertion simple, la base refuse (409), rien d'écrasé */
    {
      const autre = { newsletter: false, maj: avant(MIN), version: V_NEWS, source: "profil", suivi: false };
      const db = base({ comptes: compte() }); db.retard.emails = 1500;
      const x = await contexte(b, qui(L1, "lea@exemple.fr", meta({ newsletter: avant(2 * H) })), db);
      await x.page.goto(URL0);
      const t = Date.now(); while (!db.journal.includes("P emails") && Date.now() - t < 10000) await new Promise(z => setTimeout(z, 50));
      const vu = db.journal.includes("P emails");
      db.donnees.push({ user_id: L1, outil: "emails", contenu: clone(autre), maj_le: new Date().toISOString() });
      await attendre(x.page, 2500);
      const lignes = db.donnees.filter(d => d.user_id === L1 && d.outil === "emails");
      ok("clé emails apparue pendant l'envoi de la copie : pas de fusion (insertion simple refusée), la clé de l'autre écriture est intacte, une seule ligne", vu && ecr(db, "emails").length === 0 && lignes.length === 1 && JSON.stringify(lignes[0].contenu) === JSON.stringify(autre), "envoi vu " + vu + " · " + resume(db) + " · " + JSON.stringify(lignes.map(l => l.contenu)));
    }
  });

  /* =================== F. Profil du prospect : l'interrupteur de la newsletter =================== */
  await bloc("F. Profil : newsletter", async () => {
    const L2 = PID(60);
    const compte = (donnees) => [{ id: L2, prenom: "Léa", nom: "Martin", cree: avant(3 * H), email: "lea@exemple.fr", donnees: donnees || [] }];
    const meta = (o) => Object.assign({ prenom: "Léa", nom: "Martin", consentement: avant(3 * H), conditions_version: V52, consentement_sante: avant(3 * H), sante_version: V52, newsletter_version: V_NEWS }, o);
    const etat = page => page.$eval("#mc-emails", e => ({ c: e.checked, d: e.disabled })).catch(() => null);
    const cliquer = async page => { await page.click("#mc-emails-bloc label.switch"); await attendre(page, 1400); };
    for (const langue of ["", "en"]) {
      const T = k => TXB[k + (langue ? "_en" : "")], L = langue ? " (anglais)" : "";
      const copie = { newsletter: true, maj: avant(3 * H), version: V_NEWS, source: "inscription" };
      const db = base({ comptes: compte([["emails", copie, avant(3 * H)]]) });
      if (langue) avecEn(db, L2);
      const { c, page } = await contexte(b, qui(L2, "lea@exemple.fr", meta({ newsletter: avant(3 * H) })), db, { langue, viewport: MOBILE });
      await page.goto(URL0 + "#/profil"); await pret(page, "#mc-emails-bloc"); await attendre(page, 800);
      const h2 = await texte(page, "#mc-emails-bloc h2"), lib = await texte(page, "#mc-emails-bloc label.switch"), note = await texte(page, "#mc-emails-bloc .note");
      ok(`Profil${L} : bloc « Newsletter », libellé « ${T("libelle").slice(0, 50)}… », interrupteur coché d'après la clé emails, actif`, h2 === "Newsletter" && lib === T("libelle") && JSON.stringify(await etat(page)) === '{"c":true,"d":false}', JSON.stringify([h2, lib, await etat(page)]));
      ok(`Profil${L} : la note parle de la désinscription en 1 clic`, langue ? note.includes("one-click unsubscribe link") : note.includes("lien de désinscription en 1 clic"), note);
      if (!langue) ok("Profil, téléphone 390 px : aucun défilement horizontal", !(await deborde(page)), await largeur(page));
      const n0 = db.ecritures.length;
      await cliquer(page);
      const E1 = contenu0(db, L2), m1 = await texte(page, "#mc-emails-msg");
      ok(`Profil${L}, décoché : emails = { newsletter: false, maj, version ${V_NEWS}, source: "profil", suivi: false }, « ${T("non")} »`,
        E1.newsletter === false && E1.suivi === false && E1.version === V_NEWS && E1.source === "profil" && typeof E1.maj === "string" && Math.abs(Date.parse(E1.maj) - Date.now()) < 20000 && ecr(db, "emails", L2).length === 1 && m1 === T("non"), JSON.stringify(E1) + " · " + m1);
      await cliquer(page);
      const E2 = contenu0(db, L2), m2 = await texte(page, "#mc-emails-msg");
      ok(`Profil${L}, recoché : { newsletter: true, version, source: "profil" } (suivi reste false : la newsletter ne rallume pas l'ancien accord), « ${T("oui")} »`,
        E2.newsletter === true && E2.suivi === false && E2.version === V_NEWS && E2.source === "profil" && ecr(db, "emails", L2).length === 2 && m2 === T("oui"), JSON.stringify(E2) + " · " + m2);
      ok(`Profil${L} : seule la clé emails est écrite`, db.ecritures.slice(n0).every(x => x.outil === "emails") && ecrDonnees(db).every(x => x.outil === "emails"), resume(db));
      await c.close();
    }
  });

  await bloc("F. Profil : état de départ, ancien accord, lecture ratée", async () => {
    const L3 = PID(61);
    const compte = (donnees) => [{ id: L3, prenom: "Léa", nom: "Martin", cree: avant(3 * H), email: "lea@exemple.fr", donnees: donnees || [] }];
    const etat = page => page.$eval("#mc-emails", e => ({ c: e.checked, d: e.disabled })).catch(() => null);
    const profil = async (who, db) => { const x = await contexte(b, who, db); await x.page.goto(URL0 + "#/profil"); await pret(x.page, "#mc-emails-bloc"); await attendre(x.page, 1500); return x; };
    /* ancien prospect : emails_suivi, pas de clé → décoché ; ancienne clé { suivi: true } → décoché */
    {
      const db = base({ comptes: compte() });
      const { page } = await profil(qui(L3, "lea@exemple.fr", { prenom: "Léa", emails_suivi: avant(J) }), db);
      ok("ancien prospect (emails_suivi coché à l'inscription, pas de clé) : interrupteur décoché (l'ancien accord ne vaut pas newsletter), actif, rien d'écrit", JSON.stringify(await etat(page)) === '{"c":false,"d":false}' && ecrDonnees(db).length === 0, JSON.stringify(await etat(page)) + " · " + resume(db));
    }
    {
      const ancienne = { suivi: true, maj: avant(J) };
      const db = base({ comptes: compte([["emails", ancienne, avant(J)]]) });
      const { page } = await profil(qui(L3, "lea@exemple.fr", { prenom: "Léa", emails_suivi: avant(2 * J) }), db);
      ok("ancienne clé { suivi: true } : interrupteur décoché", JSON.stringify(await etat(page)) === '{"c":false,"d":false}', JSON.stringify(await etat(page)));
      await page.click("#mc-emails-bloc label.switch"); await attendre(page, 1400);
      const E1 = contenu0(db, L3);
      ok("… coché : l'ancienne clé est complétée, pas remplacée ({ suivi: true, maj, newsletter: true, version, source: \"profil\" })", E1.suivi === true && E1.newsletter === true && E1.version === V_NEWS && E1.source === "profil" && E1.maj !== ancienne.maj && ecr(db, "emails", L3).length === 1, JSON.stringify(E1));
    }
    /* case newsletter laissée vide à l'inscription : la copie { newsletter: false } part, interrupteur décoché */
    {
      const db = base({ comptes: compte() });
      const { page } = await profil(qui(L3, "lea@exemple.fr", { prenom: "Léa", nom: "Martin", consentement: avant(H), conditions_version: V52, consentement_sante: avant(H), sante_version: V52, newsletter: null, newsletter_version: V_NEWS }), db);
      ok("case newsletter vide à l'inscription : interrupteur décoché, la copie { newsletter: false } est écrite une fois", JSON.stringify(await etat(page)) === '{"c":false,"d":false}' && ecr(db, "emails", L3).length === 1 && (contenu0(db, L3)).newsletter === false, JSON.stringify(await etat(page)) + " · " + resume(db));
    }
    /* lecture ratée : interrupteur désactivé, message, rien d'écrit (ni par le Profil ni par la copie) */
    {
      const db = base({ comptes: compte(), lectureKo: ["emails"] });
      const { page } = await profil(qui(L3, "lea@exemple.fr", { prenom: "Léa", newsletter: avant(H), newsletter_version: V_NEWS }), db);
      await page.click("#mc-emails-bloc label.switch").catch(() => {}); await attendre(page, 1200);
      ok("lecture de la clé emails ratée : interrupteur désactivé, « " + TXB.refuse + " », rien d'écrit", JSON.stringify(await etat(page)) === '{"c":false,"d":true}' && (await texte(page, "#mc-emails-msg")) === TXB.refuse && ecrDonnees(db).length === 0, JSON.stringify(await etat(page)) + " · " + resume(db));
    }
    /* client Thomas : pas de bloc newsletter */
    {
      const db = base();
      const x = await contexte(b, THOMAS, db); await x.page.goto(URL0 + "#/profil"); await pret(x.page, "#vue"); await attendre(x.page, 800);
      ok("client Thomas : pas de bloc newsletter dans son Profil", !(await x.page.$("#mc-emails-bloc, #mc-emails")), "");
    }
  });

  /* =================== G. conditions (FR et EN) : sans « 7 jours », nom, 3 questions, newsletter =================== */
  await bloc("G. conditions", async () => {
    const db = base();
    const { c, page } = await contexte(b, COACH, db);
    /* v64 : la page servie avec LEGAUX_TEST (version des CGU de test : accords.conditions) */
    const d = await avecLegaux(LEGAUX_TEST, async () => { await page.goto(URL0); await pret(page, "#tb-vue");
      return page.evaluate(() => ({ v: DECOUVERTE.confidentialite.version, a: JSON.parse(JSON.stringify(DECOUVERTE.accords || null)), l: JSON.parse(JSON.stringify(CONFIG.textes_legaux || null)), fr: DECOUVERTE.confidentialite.paragraphes, en: DECOUVERTE.en.confidentialite.paragraphes,
      ins: JSON.stringify([DECOUVERTE.inscription, DECOUVERTE.en.inscription, DECOUVERTE.emails, DECOUVERTE.en.emails]), vieille: "emails_avant" in DECOUVERTE.inscription || "emails_avant" in DECOUVERTE.en.inscription })); });
    const fr = (d.fr || []).join("\n"), en = (d.en || []).join("\n");
    /* v64 (lot 5, A) : conditions = la version des CGU en PDF (CONFIG.textes_legaux.cgu_version, servie LEGAUX_TEST), plus celle du
       texte court ; sante inchangée (ancienne case, plus envoyée) ; newsletter = la case de l'inscription (texte court A4) ;
       newsletter_profil = l'interrupteur du Profil (texte inchangé) */
    ok(`conditions : texte court en version ${V_COND} ; DECOUVERTE.accords = { conditions: ${LEGAUX_TEST.cgu_version} (= CONFIG.textes_legaux.cgu_version servie), sante: ${V_SANTE}, newsletter: ${V_NEWS_INSC}, newsletter_profil: ${V_NEWS} }`, d.v === V_COND && !!d.l && d.l.cgu_version === LEGAUX_TEST.cgu_version && JSON.stringify(d.a) === JSON.stringify({ conditions: LEGAUX_TEST.cgu_version, sante: V_SANTE, newsletter: V_NEWS_INSC, newsletter_profil: V_NEWS }), JSON.stringify([d.v, d.a, d.l]));
    ok("conditions FR et EN : même nombre de paragraphes (traduction par position), aucun « 7 jours » / « 7 days », ni dans les textes de l'inscription et du Profil ; plus d'ancienne case", d.fr.length === d.en.length && d.fr.length >= 10 && !SEPT.test(fr) && !SEPT.test(en) && !SEPT.test(d.ins) && !d.vieille, JSON.stringify([d.fr.length, d.en.length, (SEPT.exec(fr + en + d.ins) || [""])[0], d.vieille]));
    const i1 = d.fr.findIndex(p => p.startsWith("Données collectées")), i6 = d.fr.findIndex(p => p.startsWith("Prise de rendez-vous")), i7 = d.fr.findIndex(p => p.startsWith("Newsletter"));
    /* v61 (décision 4) : le paragraphe 2 (données collectées) nomme le bouton « Récupérer mon plan d'action » (avant : « Réserver
       mon bilan »), plus aucun « Réserver mon bilan » dans le texte ; c'est bien le 2e paragraphe */
    ok("FR : données collectées (2e paragraphe) = prénom, nom, email, réponses aux 3 questions, « dont tes clics sur « Récupérer mon plan d'action » », données de santé saisies (poids, mensurations, calculateur) ; plus de « Réserver mon bilan »", i1 === 1 && ["ton prénom, ton nom, ton email", "3 questions", "ton activité dans l'app, dont tes clics sur « Récupérer mon plan d'action ». Données de santé", "poids", "mensurations", "calculateur de calories"].every(x => d.fr[i1].includes(x)) && !/Réserver mon bilan/.test(fr), d.fr[i1]);
    ok("FR : Calendly « Ton prénom, ton nom et ton email y sont pré-remplis »", i6 > -1 && d.fr[i6].includes("Ton prénom, ton nom et ton email y sont pré-remplis"), d.fr[i6]);
    /* décisions de Lucas du 28/09 : plus aucune mention de mesure d'ouverture ; aucun prestataire d'emails nommé ; plus de
       relances ni d'emails de suivi automatiques ; emails du compte envoyés par Gmail (Google). v59 : « Google » est nommé
       pour les polices et les aperçus des vidéos (paragraphe à part) : l'interdit garde « Gmail », sans « Google » */
    /* v64 (décision de Lucas du 30/09, alignée sur les PDF) : « 2 emails par semaine au plus » (avant : « 1 à 2 emails ») */
    ok("FR : paragraphe Newsletter à la place des « Emails de suivi » : « de MHX Coaching, 2 emails par semaine au plus » (v64 ; plus « 1 à 2 »), désinscription en 1 clic, retrait dans le Profil ; ni mesure d'ouverture, ni Brevo, ni relance, ni « 3 emails » ; aucun email du compte promis (confirmation, mot de passe, Gmail)",
      i7 > -1 && !/1 à 2 emails/.test(d.fr[i7]) && ["offres de coaching de MHX Coaching, 2 emails par semaine au plus.", "Désinscription en 1 clic dans chaque email", "retrait de ton accord possible à tout moment dans ton Profil"].every(x => d.fr[i7].includes(x)) && !/Gmail|email de confirmation|confirmation de ton email|mot de passe oublié/i.test(fr)
      && !/relance|3 emails|emails de suivi|réserv|ouvert|cliqu|mesur/i.test(d.fr[i7]) && !/Brevo|emails de suivi|au plus 3 emails|a été ouvert|mesure d'ouverture/i.test(fr), d.fr[i7]);
    ok("FR : toujours « réservés aux adultes » et « ne remplace pas un avis médical »", /réservés aux adultes/.test(d.fr[0]) && /ne remplace pas un avis médical/.test(d.fr[0]), d.fr[0]);
    ok("EN à la même place : last name, 3 questions, « including your clicks on “Get my action plan” » (plus de « Book my assessment »), measurements ; « Your first name, last name and email are pre-filled » ; Newsletter (v64 : « 2 emails per week at most », no more « 1 to 2 » ; one-click unsubscribe, withdrawal in the Profile ; no open tracking, no Brevo, no follow-up, no account email) ; adults only, not medical advice",
      /^Data collected: /.test(d.en[i1]) && ["your last name", "3 starting questions", "your activity in the app, including your clicks on “Get my action plan”. Health data", "measurements", "calorie calculator"].every(x => d.en[i1].includes(x)) && !/Book my assessment/.test(en) && /^Booking: /.test(d.en[i6]) && d.en[i6].includes("Your first name, last name and email are pre-filled")
      && /^Newsletter \(optional\): /.test(d.en[i7]) && !/1 to 2 emails/.test(d.en[i7]) && ["coaching offers by email, 2 emails per week at most.", "One-click unsubscribe in every email", "withdraw your consent at any time in your Profile"].every(x => d.en[i7].includes(x)) && !/Gmail|confirmation email|email confirmation|forgotten password/i.test(en) && !/follow-up|3 emails|booked|opened|opening|clicked|track|measur/i.test(d.en[i7]) && !/Brevo|follow-up emails|at most 3 emails|was opened|open tracking/i.test(en)
      && /for adults only/.test(d.en[0]) && /not medical advice/.test(d.en[0]), JSON.stringify([d.en[i1], d.en[i6], d.en[i7]]).slice(0, 400));
    /* v59 : ce que l'app charge vraiment depuis Google, sans action de la personne (index.html : Google Fonts ; outilFormation
       et outilProgramme : img.youtube.com/…/hqdefault.jpg) ; le lecteur (youtube-nocookie.com) seulement au clic */
    const iH = d.fr.findIndex(p => p.startsWith("Hébergement")), iG = d.fr.findIndex(p => p.startsWith("Contenus chargés depuis Google"));
    ok("conditions FR et EN : un paragraphe « Contenus chargés depuis Google » juste après « Hébergement » (polices Google Fonts, images d'aperçu des vidéos YouTube, adresse IP, vidéo au clic seulement, confidentialité renforcée), « Content loaded from Google » à la même place",
      iH > -1 && iG === iH + 1 && ["polices de caractères de l'app (Google Fonts)", "images d'aperçu des vidéos (YouTube)", "serveurs de Google", "ton adresse IP", "ne démarre que si tu cliques dessus", "mode de confidentialité renforcée"].every(x => d.fr[iG].includes(x))
      && /^Hosting: /.test(d.en[iH]) && /^Content loaded from Google: /.test(d.en[iG]) && ["the app's fonts (Google Fonts)", "video preview images (YouTube)", "Google's servers", "your IP address", "only starts if you click it", "privacy-enhanced mode"].every(x => d.en[iG].includes(x)),
      JSON.stringify([iH, iG, d.fr[iG], d.en[iG]]).slice(0, 400));
    await c.close();
    /* le volet des conditions, en français puis en anglais : tous les paragraphes, dans la bonne langue. v64 (lot 5, A2) : il
       s'ouvre depuis le Profil du prospect (#mc-conditions), plus depuis l'inscription : là, « CGU » et « politique de
       confidentialité » mènent aux PDF ; servis « à compléter » (le mot seul, sans lien : rien vers le réseau), cliqués, ils
       n'ouvrent aucun volet */
    const L5 = PID(71);
    await avecLegaux(LEGAUX_VIDES, () => inscriptionOuverte(async () => {
      for (const langue of ["", "en"]) {
        const db2 = base();
        const x = await contexte(b, null, db2, { langue });
        await x.page.goto(URL0 + "#/inscription"); await x.page.waitForSelector("#c-go"); await attendre(x.page, 300);
        const ins = await x.page.evaluate(async () => {
          const l = ["c-cgu-lien", "c-politique-lien"].map(id => document.getElementById(id)), cgu = document.getElementById("c-cgu"), avant = cgu && cgu.checked;
          const tags = l.map(e => e ? e.tagName : null);
          for (const e of l) if (e && e.tagName === "SPAN") e.click();
          await new Promise(r => setTimeout(r, 500));
          const volet = !!document.querySelector(".volet") || !!(window.UI && UI._ouverte);
          if (cgu) cgu.checked = avant;
          return { tags, volet, boutons: document.querySelectorAll("label.co-cgu button").length };
        }).catch(e => ({ erreur: String(e).slice(0, 80) }));
        const db3 = base({ comptes: [{ id: L5, prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "lea71@exemple.fr" }] });
        if (langue) avecEn(db3, L5);
        const y = await contexte(b, qui(L5, "lea71@exemple.fr", { prenom: "Léa", nom: "Martin" }), db3, { langue });
        await y.page.goto(URL0 + "#/profil"); await pret(y.page, "#mc-conditions"); await attendre(y.page, 300);
        await y.page.click("#mc-conditions"); await y.page.waitForSelector(".volet"); await attendre(y.page, 300);
        const tv = norm(await y.page.textContent(".volet").catch(() => ""));
        const P = langue ? d.en : d.fr, autres = langue ? d.fr : d.en;
        const manquants = P.filter(p => !tv.includes(norm(p))).map(p => p.slice(0, 30)), restes = autres.map(p => norm(p).slice(0, 25)).filter(p => tv.includes(p));
        ok(`Profil du prospect${langue ? " (anglais)" : ""} : le volet des conditions (#mc-conditions) montre les ${P.length} paragraphes ${langue ? "anglais" : "français"}, aucun dans l'autre langue ; l'inscription ne l'ouvre plus (« CGU » et « politique de confidentialité » « à compléter » : le mot seul, cliqué, aucun volet ; aucun bouton dans la case)`,
          manquants.length === 0 && restes.length === 0 && JSON.stringify(ins.tags) === '["SPAN","SPAN"]' && ins.volet === false && ins.boutons === 0, JSON.stringify({ manquants, restes, ins }));
        await x.c.close(); await y.c.close();
      }
    }));
  });

  /* =================== H. Calendly : prénom + nom + email =================== */
  await bloc("H. Calendly avec le nom", async () => {
    const L4 = PID(70);
    const db = base({ comptes: [{ id: L4, prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "lea@exemple.fr", donnees: [["intake", { email_compte: "lea@exemple.fr" }, avant(J)]] }] });
    const { c, page } = await contexte(b, qui(L4, "lea@exemple.fr"), db);
    await page.goto(URL0); await pret(page); await attendre(page, 600);
    const NOMS = "&name=L%C3%A9a%20Martin&first_name=L%C3%A9a&last_name=Martin&email=lea%40exemple.fr";
    const r = await page.evaluate(() => {
      const out = {}, p = Auth.profil, p0 = p.prenom, n0 = p.nom;
      /* v61 : le code d'origine du bouton du haut de l'accueil (accueil_haut, avant : decouverte) */
      out.base = lienCalendly("accueil_haut");
      p.prenom = ""; out.nomSeul = lienCalendly("accueil_haut");
      p.prenom = p0; p.nom = ""; out.prenomSeul = lienCalendly("accueil_haut");
      p.nom = "  D'Arc & Fils "; out.special = lienCalendly("accueil_haut");
      p.nom = "M" + String.fromCharCode(0xD800) + "n"; try { out.malforme = lienCalendly("accueil_haut"); } catch(e){ out.err = String(e); }
      p.nom = null; out.nomNull = lienCalendly("accueil_haut");
      p.prenom = p0; p.nom = n0;
      return out;
    });
    ok("prospecte Léa Martin : lienCalendly → name = « Léa Martin », first_name = Léa, last_name = Martin, email (encodés)", r.base === lienLea(NOMS), r.base);
    ok("nom seul (prénom vide) : name = nom, last_name, pas de first_name", r.nomSeul === lienLea("&name=Martin&last_name=Martin&email=lea%40exemple.fr"), r.nomSeul);
    ok("prénom seul (nom vide ou absent) : comme avant (name et first_name = prénom, pas de last_name)", r.prenomSeul === lienLea("&name=L%C3%A9a&first_name=L%C3%A9a&email=lea%40exemple.fr") && r.nomNull === r.prenomSeul, JSON.stringify([r.prenomSeul, r.nomNull]));
    ok("nom avec espaces, apostrophe et « & » : espaces retirés, tout encodé, aucun paramètre injecté", r.special === lienLea("&name=L%C3%A9a%20D'Arc%20%26%20Fils&first_name=L%C3%A9a&last_name=D'Arc%20%26%20Fils&email=lea%40exemple.fr"), r.special);
    ok("nom avec un caractère mal formé : aucune erreur, adresse Calendly nue", !r.err && r.malforme === CAL, JSON.stringify(r));
    await aller(page, "#/programme", 1500);
    /* v61 (lot 2, F et G) : le bouton s'appelle « Récupérer mon plan d'action » ; code d'origine verrou_programme (avant : verrou-programme) */
    const hv = await page.$eval("#vue .verrou a[target=_blank]", a => a.getAttribute("href")).catch(() => "");
    const tv = await texte(page, "#vue .verrou a[target=_blank]");
    ok("page verrouillée (#/programme) : le bouton « Récupérer mon plan d'action » porte le code verrou_programme, prénom, nom et email", hv === lienLea(NOMS, "verrou_programme") && tv === "Récupérer mon plan d'action", hv + " · " + tv);
    ok("prospecte : aucune écriture en calculant ses liens", ecrDonnees(db).length === 0, resume(db));
    await c.close();
    /* pré-remplissage éteint : ni prénom, ni nom, ni email */
    await avec([["calendly_prerempli: true", "calendly_prerempli: false"]], async () => {
      const db2 = base({ comptes: [{ id: L4, prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "lea@exemple.fr" }] });
      const x = await contexte(b, qui(L4, "lea@exemple.fr"), db2);
      await x.page.goto(URL0); await pret(x.page);
      const l = await x.page.evaluate(() => lienCalendly("accueil_haut"));
      ok("calendly_prerempli à false : utm seulement (ni name, ni first_name, ni last_name, ni email)", l === lienLea(""), l);
    });
    /* client Thomas : lien nu */
    {
      const x = await contexte(b, THOMAS, base());
      await x.page.goto(URL0); await pret(x.page, "#acc-vue");
      ok("client Thomas : lienCalendly rend l'adresse nue", (await x.page.evaluate(() => lienCalendly("accueil_haut"))) === CAL);
    }
    /* coach : fiche de la prospecte (lien à copier, mailto) et lienCalendlyPour */
    {
      const db3 = base({ comptes: [{ id: L4, prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "lea@exemple.fr", donnees: [["intake", { email_compte: "lea@exemple.fr" }, avant(J)]] }] });
      const x = await contexte(b, COACH, db3);
      await x.page.goto(URL0 + "#/clients"); await pret(x.page, "#tb-vue, #vue"); await attendre(x.page, 1500);
      /* v71 (D) : Léa (prospecte) n'a plus de ligne dans Mes clients : sa fiche s'ouvre par Clients.ouvrir (ce que faisait le bouton « Ouvrir ») */
      await x.page.evaluate(([id, n]) => Clients.ouvrir(id, n, "accueil"), [L4, "Léa Martin"]).catch(() => {});
      await x.page.waitForSelector("#dc-lien", { timeout: 8000 }).catch(() => {}); await attendre(x.page, 500);
      const lien = await x.page.$eval("#dc-lien", e => e.value).catch(() => ""), note = await texte(x.page, "#fiche-actions p.note");
      /* v61 (lot 2, F) : utm_source=app (avant : app-mhx), code d'origine fiche_coach (avant : fiche-coach) */
      const COACHL = CAL + "?utm_source=app&utm_medium=coach&utm_content=fiche_coach";
      ok("coach, fiche de Léa Martin : lien de réservation avec name = « Léa Martin », first_name, last_name, email ; « Son lien de réservation (prénom, nom et email déjà remplis) : »",
        lien === COACHL + NOMS && note === "Son lien de réservation (prénom, nom et email déjà remplis) :", lien + " · " + note);
      const l3 = await x.page.evaluate(() => [lienCalendlyPour("Léa", "lea@exemple.fr", "fiche_coach"), lienCalendlyPour("Léa", "", "fiche_coach", "Martin"), lienCalendly("accueil_haut")]);
      ok("lienCalendlyPour : un appel à 3 paramètres (sans nom) reste juste ; nom en 4e paramètre ; le coach reçoit lienCalendly nu", l3[0] === COACHL + "&name=L%C3%A9a&first_name=L%C3%A9a&email=lea%40exemple.fr" && l3[1] === COACHL + "&name=L%C3%A9a%20Martin&first_name=L%C3%A9a&last_name=Martin" && l3[2] === CAL, JSON.stringify(l3));
      ok("coach : aucune écriture", ecrDonnees(db3).length === 0, resume(db3));
    }
  });

  /* =================== G1… lot G : le coach lit les 3 réponses, le nom et la newsletter =================== */
  {
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    const LEA = PID(80), MARC = PID(81), ZOE = PID(82), NINA = PID(83), PIEGE = PID(84), TAB = PID(85), CHAINE = PID(86);
    const LONGUE = "Je voudrais enfin me sentir bien dans mon corps, courir 10 km sans m'arrêter, dormir mieux et ne plus grignoter le soir devant la télé après une longue journée de travail, bref retrouver de l'énergie pour mes enfants et pour moi.";
    const NEWS_LE = avant(2 * J);
    const frDe = iso => { const d = new Date(iso); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };
    const ANCIEN = { sexe: "Homme", age: "40", taille: "180", poids: "90", objectif: "Prise de muscle", seances: "3", essaye: "La salle, seul", obstacle: "Je lâche au bout de 2 semaines", pourquoi: "Mon mariage en juin", motivation: "8", court_debut: avant(20 * J), court_le: avant(20 * J), email_compte: "marc@exemple.fr" };
    const comptes = () => [
      { id: LEA, prenom: "Léa", nom: "Martin", cree: avant(3 * J), donnees: [
        ["intake", { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Rentrer dans mon jean d'avant", objectif: "Perte de poids / sèche", court_debut: avant(3 * J), court_le: avant(3 * J), email_compte: "lea.martin@exemple.fr" }, avant(3 * J)],
        ["emails", { newsletter: true, maj: NEWS_LE, version: "2026-09-28c", source: "inscription" }, NEWS_LE]] },
      { id: MARC, prenom: "Marc", nom: "", cree: avant(25 * J), donnees: [["intake", ANCIEN, avant(20 * J)], ["emails", { suivi: true, maj: avant(20 * J) }, avant(20 * J)]] },
      { id: ZOE, prenom: "Zoé", nom: "Durand", cree: avant(5 * H) },
      { id: NINA, prenom: "Nina", nom: "Petit", cree: avant(4 * J), donnees: [
        ["intake", { probleme: "Me remettre en forme", obstacle: "Mes horaires", projection: LONGUE, court_le: avant(4 * J), email_compte: "nina@exemple.fr" }, avant(4 * J)],
        ["emails", { newsletter: false, maj: avant(J), version: "2026-09-28c", source: "profil", suivi: false }, avant(J)]] },
      { id: PIEGE, prenom: XSS, nom: XSS, cree: avant(2 * J), donnees: [
        ["intake", { probleme: XSS, obstacle: XSS, projection: "=HYPERLINK(\"http://x\") " + XSS, court_le: avant(2 * J), email_compte: "piege@exemple.fr" }, avant(2 * J)],
        ["emails", { newsletter: true, maj: XSS }, avant(J)]] },
      { id: TAB, prenom: "Tom", nom: "Liste", cree: avant(2 * J), donnees: [["emails", ["newsletter"], avant(J)]] },
      { id: CHAINE, prenom: "Chloé", nom: "Texte", cree: avant(2 * J), donnees: [["emails", { newsletter: "true", maj: avant(J) }, avant(J)]] }
    ];
    const RIEN_DE_BRUT = /\bundefined\b|\bnull\b|\bNaN\b|\[object /;
    const lignesFiche = (page, sel) => page.$$eval(sel + " ul.fiche-l > li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
    const injecte = page => page.evaluate(() => !!window.__xss || !!document.querySelector("#vue img[src='x']")).catch(() => true);
    /* v71 (D) : un prospect n'a plus de ligne (ni de bouton [data-ouvrir]) dans Mes clients : sa fiche s'ouvre par Clients.ouvrir
       (ce que faisait le bouton « Ouvrir »), une fois le tableau chargé (la ligne « Les prospects sont dans Prospects → » n'est
       affichée qu'à ce moment) ; le nom passé est celui du bouton d'avant (Clients.nom : prénom + nom, sinon « Sans nom ») */
    const nomDe = uid => { const c = comptes().find(x => x.id === uid) || {}; return ((c.prenom || "") + " " + (c.nom || "")).trim() || "Sans nom"; };
    async function ficheDe(page, uid){
      await aller(page, "#/clients", 300);
      await page.waitForSelector("#clients-prospects:not([hidden])", { timeout: 8000 });
      await page.evaluate(([id, n]) => Clients.ouvrir(id, n, "accueil"), [uid, nomDe(uid)]);
      await page.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(page, 400);
      return { dec: await lignesFiche(page, "#fiche-decouverte"), rep: await lignesFiche(page, "#fiche-reponses"), vue: await texte(page, "#vue") };
    }
    const sans = (l, k) => l.filter(x => x[0] !== k);   // la ligne « Découverte » (jour, date d'inscription) n'est pas du lot G
    /* v53 (chantier 4) : après le bouton « Réserver mon bilan », « Bilan réservé » (la coche du coach), la case du prospect
       (« Le prospect a coché « J'ai réservé » le … » quand elle est cochée), la dernière visite et les jours actifs */
    const FIN_V53 = [["Bouton « Récupérer mon plan d'action »", "jamais cliqué"], ["Bilan réservé", "non"], ["Case « J'ai réservé mon bilan »", "pas cochée"], ["Dernière visite", "aucune"], ["Jours actifs (30 j)", "0"]];
    const coachSur = async db => { const x = await contexte(b, COACH, db); await x.page.goto(URL0 + "#/clients"); await pret(x.page, "#vue"); return x; };

    await bloc("G1. fiche : les 3 réponses, le nom, la newsletter", async () => {
      const db = base({ comptes: comptes() });
      const { page } = await coachSur(db);
      const f = await ficheDe(page, LEA);
      ok("fiche de Léa Martin (bloc « Découverte ») : Nom « Martin », Newsletter « oui (depuis le " + frDe(NEWS_LE) + ") », questionnaire rempli, puis Problème, Ce qui l'a bloqué, Dans 3 mois ; l'objectif posé par l'app n'est pas répété",
        JSON.stringify(sans(f.dec, "Découverte")) === JSON.stringify([["Nom", "Martin"], ["Newsletter", "oui (depuis le " + frDe(NEWS_LE) + ")"], ["Questionnaire court", "rempli le " + frDe(avant(3 * J))], ["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", "Le manque de temps"], ["Dans 3 mois", "Rentrer dans mon jean d'avant"]].concat(FIN_V53)), JSON.stringify(f.dec));
      ok("… « Réponses au questionnaire court » : Email, Problème, Ce qui l'a bloqué, Dans 3 mois (libellés courts du coach)", JSON.stringify(f.rep) === JSON.stringify([["Email", "lea.martin@exemple.fr"], ["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", "Le manque de temps"], ["Dans 3 mois", "Rentrer dans mon jean d'avant"]]), JSON.stringify(f.rep));
      const m = await ficheDe(page, MARC);
      const ATT_M = [["Sexe", "Homme"], ["Âge", "40"], ["Taille (cm)", "180"], ["Poids actuel (kg)", "90"], ["Objectif", "Prise de muscle"], ["Séances par semaine", "3"], ["Déjà essayé", "La salle, seul"], ["Obstacle principal", "Je lâche au bout de 2 semaines"], ["Pourquoi maintenant", "Mon mariage en juin"], ["Motivation", "8 / 10"]];
      ok("ancien prospect Marc (nom vide, ancien accord « emails de suivi » seul) : Nom « pas renseigné », Newsletter « non », ses 10 anciennes réponses (obstacle d'avant « Obstacle principal », motivation « 8 / 10 »), pas de Problème",
        JSON.stringify(sans(m.dec, "Découverte")) === JSON.stringify([["Nom", "pas renseigné"], ["Newsletter", "non"], ["Questionnaire court", "rempli le " + frDe(avant(20 * J))]].concat(ATT_M, FIN_V53)), JSON.stringify(m.dec));
      ok("… ses réponses (bloc du bas) : Email puis les mêmes libellés", JSON.stringify(m.rep) === JSON.stringify([["Email", "marc@exemple.fr"]].concat(ATT_M)), JSON.stringify(m.rep));
      const z = await ficheDe(page, ZOE), n = await ficheDe(page, NINA);
      ok("Zoé (rien répondu, pas de clé emails) : Nom « Durand », Newsletter « non », questionnaire pas encore rempli, aucune réponse inventée ; ses 3 questions « — »",
        JSON.stringify(sans(z.dec, "Découverte")) === JSON.stringify([["Nom", "Durand"], ["Newsletter", "non"], ["Questionnaire court", "pas encore rempli"]].concat(FIN_V53)) && JSON.stringify(z.rep) === JSON.stringify([["Email", "—"], ["Problème", "—"], ["Ce qui l'a bloqué", "—"], ["Dans 3 mois", "—"]]), JSON.stringify([z.dec, z.rep]));
      ok("Nina (newsletter décochée dans son Profil) : Newsletter « non » ; sa réponse « Dans 3 mois » entière", (n.dec.find(x => x[0] === "Newsletter") || [])[1] === "non" && (n.dec.find(x => x[0] === "Dans 3 mois") || [])[1] === LONGUE, JSON.stringify(n.dec));
      ok("fiches de Léa, Marc, Zoé et Nina : ni « undefined », ni « null », ni « NaN », ni « [object »", [f, m, z, n].every(x => !RIEN_DE_BRUT.test(x.vue)), [f, m, z, n].map(x => (x.vue.match(RIEN_DE_BRUT) || [""])[0]).join("|"));
      ok("coach : aucune écriture en affichant ces fiches", ecrDonnees(db).length === 0, resume(db));
    });

    await bloc("G2. fiche : données piégées, newsletter illisible", async () => {
      const db = base({ comptes: comptes() });
      const { page } = await coachSur(db);
      const p = await ficheDe(page, PIEGE);
      const v = k => (p.dec.find(x => x[0] === k) || [])[1];
      ok("prospect piégé : nom, problème, obstacle et « Dans 3 mois » affichés tels quels (texte), Newsletter « oui » sans date (date illisible)", v("Nom") === XSS && v("Problème") === XSS && v("Ce qui l'a bloqué") === XSS && v("Dans 3 mois") === "=HYPERLINK(\"http://x\") " + XSS && v("Newsletter") === "oui", JSON.stringify(p.dec));
      ok("… aucune balise injectée (fiche), ni « undefined » ni « null »", !(await injecte(page)) && !RIEN_DE_BRUT.test(p.vue), (p.vue.match(RIEN_DE_BRUT) || [""])[0]);
      const t = await ficheDe(page, TAB), c = await ficheDe(page, CHAINE);
      ok("clé emails qui n'est pas un objet (liste) : « non » ; newsletter écrite « true » en texte : « non » (seul le vrai booléen vaut oui)", (t.dec.find(x => x[0] === "Newsletter") || [])[1] === "non" && (c.dec.find(x => x[0] === "Newsletter") || [])[1] === "non", JSON.stringify([t.dec, c.dec]));
      ok("coach : aucune écriture (fiches piégées)", ecrDonnees(db).length === 0, resume(db));
    });

    await bloc("G3. page Prospects et export CSV", async () => {
      const db = base({ comptes: comptes() });
      const { page } = await coachSur(db);
      await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 });
      await page.click('[data-filtre="tous"]'); await attendre(page, 500);
      /* v53 (chantier 4) : la carte liste les 3 réponses (Problème, Ce qui l'a bloqué, Dans 3 mois : .sc-reponses li) */
      const carte = uid => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => ({ t: e.textContent.replace(/\s+/g, " ").trim(), infos: Array.from(e.querySelectorAll(".sc-infos")).map(x => x.textContent.replace(/\s+/g, " ").trim()), rep: Array.from(e.querySelectorAll(".sc-reponses li")).map(x => x.textContent.replace(/\s+/g, " ").trim()) })).catch(() => ({ t: "", infos: [], rep: [] }));
      const cl = await carte(LEA), cm = await carte(MARC), cz = await carte(ZOE), cn = await carte(NINA), cp = await carte(PIEGE);
      ok("carte de Léa : « Problème Perdre du gras », « Ce qui l'a bloqué « Le manque de temps » », « Dans 3 mois « Rentrer dans mon jean d'avant » » ; l'objectif posé par l'app (Perte de poids / sèche) n'est pas répété", JSON.stringify(cl.rep) === JSON.stringify(["Problème Perdre du gras", "Ce qui l'a bloqué « Le manque de temps »", "Dans 3 mois « Rentrer dans mon jean d'avant »"]) && !cl.t.includes("Perte de poids / sèche"), JSON.stringify(cl.rep));
      const ext = (cn.rep[2] || "").replace(/^Dans 3 mois « /, "").replace(/ »$/, "");
      ok("carte de Nina : sa réponse « Dans 3 mois » tronquée proprement (100 caractères au plus, « … »), début identique", ext.endsWith("…") && Array.from(ext).length <= 101 && LONGUE.startsWith(ext.slice(0, -1)), cn.rep[2]);
      ok("cartes de Marc (ancien : « Anciennes réponses : dans sa fiche. ») et Zoé (rien répondu) : pas de réponses sur la carte ; aucune carte avec « undefined » ou « null »", !cm.rep.length && cm.t.includes("Anciennes réponses : dans sa fiche.") && !cm.t.includes("Problème") && !cz.rep.length && !cz.t.includes("Problème") && !RIEN_DE_BRUT.test(await texte(page, "#pr-liste")), JSON.stringify([cm.infos, cz.infos]));
      ok("carte piégée : réponses en texte, aucune balise injectée", (cp.rep[0] || "").startsWith("Problème " + XSS) && !(await injecte(page)), JSON.stringify(cp.rep));
      const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.click("#pr-csv")]);
      const t = fs.readFileSync(await dl.path(), "utf8").replace(/^﻿/, "");
      const L = [], lire = s => { let ligne = [], champ = "", dans = false; for (let i = 0; i < s.length; i++) { const ch = s[i];
        if (dans) { if (ch === '"') { if (s[i + 1] === '"') { champ += '"'; i++; } else dans = false; } else champ += ch; continue; }
        if (ch === '"') dans = true; else if (ch === ";") { ligne.push(champ); champ = ""; } else if (ch === "\r" && s[i + 1] === "\n") { ligne.push(champ); L.push(ligne); ligne = []; champ = ""; i++; } else champ += ch; } };
      lire(t);
      /* v53 (chantier 4) : colonnes à jour (sans statut ni score) : la vérification « les 15 colonnes d'avant inchangées » est
         retirée (1) ; les colonnes du lot G (Problème, Dans 3 mois, Newsletter) sont lues par leur en-tête (verif58, bloc D :
         toutes les colonnes) */
      const col = k => L[0].indexOf(k), K3 = [col("Problème"), col("Dans 3 mois"), col("Newsletter")];
      const ligne = nom => { const l = L.find(x => x[0] === nom) || []; return K3.map(i => l[i]); };
      ok("CSV : Léa « Perdre du gras » / « Rentrer dans mon jean d'avant » / oui ; Marc (ancien accord seul) vide / vide / non ; Zoé vide / vide / non ; Nina, réponse entière / non ; Tom (clé liste) et Chloé (« true » en texte) non",
        JSON.stringify(ligne("Léa Martin")) === JSON.stringify(["Perdre du gras", "Rentrer dans mon jean d'avant", "oui"]) && JSON.stringify(ligne("Marc")) === '["","","non"]' && JSON.stringify(ligne("Zoé Durand")) === '["","","non"]' && JSON.stringify(ligne("Nina Petit")) === JSON.stringify(["Me remettre en forme", LONGUE, "non"]) && JSON.stringify(ligne("Tom Liste")) === '["","","non"]' && JSON.stringify(ligne("Chloé Texte")) === '["","","non"]',
        JSON.stringify(["Léa Martin", "Marc", "Zoé Durand", "Nina Petit", "Tom Liste", "Chloé Texte"].map(ligne)));
      const lp = L.find(l => l[1] === "piege@exemple.fr") || [];
      ok("CSV piégé : « Dans 3 mois » qui commence par « = » neutralisé (apostrophe), newsletter « oui » (vrai booléen)", lp[K3[1]] === "'=HYPERLINK(\"http://x\") " + XSS && lp[K3[0]] === XSS && lp[K3[2]] === "oui" && L.length === 8 && L.every(l => l.length === L[0].length), JSON.stringify(K3.map(i => lp[i])));
      ok("page Prospects et export : aucune écriture", ecrDonnees(db).length === 0, resume(db));
    });

    await bloc("G4. téléphone 390 px", async () => {
      const db = base({ comptes: comptes() });
      const x = await contexte(b, COACH, db, { viewport: MOBILE });
      await x.page.goto(URL0 + "#/clients"); await pret(x.page, "#vue");
      await ficheDe(x.page, NINA);
      ok("téléphone : fiche de Nina (longue réponse « Dans 3 mois ») sans défilement horizontal", !(await deborde(x.page)), await largeur(x.page));
      await aller(x.page, "#/prospects", 300); await x.page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 });
      await x.page.click('[data-filtre="tous"]'); await attendre(x.page, 500);
      ok("téléphone : page Prospects (cartes avec les réponses, prospect piégé) sans défilement horizontal, aucune écriture", !(await deborde(x.page)) && ecrDonnees(db).length === 0, await largeur(x.page));
    });
  }

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes);   // v66 : polices hébergées, plus d'exception pour Google Fonts
    ok("aucune requête vers un autre hôte que la page et le faux Supabase (polices comprises : plus de Google Fonts)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
