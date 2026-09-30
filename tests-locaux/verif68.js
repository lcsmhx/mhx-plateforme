/* verif68 — v62 (brief V2, lot 3 : section H, et le « Plus tard » par origine de la section L) : les invitations au bon
   moment du prospect, vérifiées de bout en bout dans un vrai navigateur, en français et en anglais, sur téléphone (390 px),
   en thème sombre et en thème clair, avec des prospects fictifs (« pk@exemple.fr ») et une horloge contrôlée (page.clock :
   midi du jour du lancement, puis setSystemTime pour « un autre jour » ; jamais d'attente réelle). Un faux Calendly (hôte
   calendly.com, comme verif67) sert une page blanche à l'onglet ouvert par le bouton et note l'adresse reçue.
   A. le parcours d'un prospect, français, 390 px, thème sombre : ouverture du calculateur avec un résultat de départ (tiré
      du questionnaire) sans rien enregistrer : aucune carte, aucune lecture ; « Enregistrer mes chiffres » : la carte
      #invitation-declic_calculateur juste après la section des macros (structure, textes EXACTS du brief H avec la
      typographie française, « Ton objectif : « … » », lien exact utm_content=declic_calculateur pré-rempli, bordure dorée,
      390 px, aucune valeur saisie ni aucun chiffre hors « 15 min »), UNE lecture groupée intake+challenge au déclencheur,
      mémoire « mhx_invitations|<id> » sur l'appareil (forme exacte), rien de nouveau en base ; un autre calcul : pas de 2e
      carte ; LE MÊME JOUR, la première pesée (« Enregistrer la semaine ») puis les 7 cases du module Mindset : aucune carte,
      en attente, sans lecture ; UN AUTRE JOUR : l'accueil montre UNE carte en haut, juste après l'en-tête (la plus récente
      en attente : Mindset) ; revenue le même jour ou page rechargée : plus rien ; ENCORE UN AUTRE JOUR : la suivante
      (première pesée) ; « Plus tard » : retirée, fermée pour toujours, challenge.cta.plus_tard { source, date } écrit ;
      le jour d'après : plus rien ; aucune écriture en base à la simple ouverture d'une page ;
   B. anglais, 390 px, thème clair : la carte du calculateur (calcul saisi champ par champ : 4 champs sur 5, rien pendant
      1,5 s — ni carte, ni écriture, ni lecture —, puis le 5e), le cas « Poids de départ » le même jour (en attente),
      l'accueil le lendemain (carte « Your starting point is set. » en haut) ; clic sur son bouton : l'onglet reçoit le
      lien declic_premiere_pesee, le clic est noté avec cette origine ;
   C. « Plus tard » définitif : carte retirée tout de suite, trace en base (challenge.cta.plus_tard) ; un autre calcul, la
      page rechargée, puis la mémoire de l'appareil vidée (comme « Se déconnecter ») : jamais remontrée, ni au déclencheur
      ni depuis une attente remise sur l'appareil ; de même pour une invitation « traitée » en base par un CLIC sur son
      bouton (il y a 10 jours) ; Decouverte.plusTard relit avant d'écrire : une clé challenge déjà remplie (jours, clic et
      « Plus tard » anciens, champ inconnu) et une modification faite en base entre la carte et le tap sont gardées, le
      nouveau est ajouté à la suite ; 50 « Plus tard » au plus (le plus ancien part) ;
   D. clic sur le bouton d'une invitation : onglet ouvert (lien exact), clic noté (source = code) ; pendant 7 jours plus
      aucune invitation (déclencheur → en attente sans lecture ; accueil le lendemain et 7 j − 1 h après le clic : rien) ;
      7 j + 5 min après : la carte ; un clic de moins de 7 jours noté en base seulement (autre bouton) : même règle (en
      attente, rien à 7 j − 1 h, carte à 7 j + 5 min) ; clics en base dans le désordre : le plus récent EN DATE compte ;
   E. « J'ai déjà choisi mon créneau » cochée en base : aucune invitation nulle part (accueil, calculateur, première pesée,
      Mindset), sans aucune lecture (intake et challenge en cache depuis l'accueil), rien d'ajouté en attente, l'attente
      de l'appareil ne s'affiche pas (le lendemain non plus) ; case cochée sur l'appareil, page rechargée (rien en cache) :
      ensuite plus rien, sans relire la base ;
   F. « Commence ici » terminé : la vidéo de bienvenue lancée (3e action) → carte formation_commence_ici juste après
      #fo-depart (replié en « Départ lancé ✓ ») ; en anglais, thème clair : les 3 actions déjà faites → la carte à
      l'ouverture de #/formation, rien d'écrit en base ;
   G. Mindset en anglais, thème clair : la 7e case → carte juste après la section du module 01, elle y reste quand la page
      est redessinée (autre case), « Later » la retire pour de bon ; le cas « Poids de départ » le même jour → en attente ;
      le lendemain : carte en haut de l'accueil, avant « Your first step » ; première pesée par « Enregistrer la semaine » →
      carte juste après #mens-saisie (une 2e pesée : rien de plus) ; par « Poids de départ » → juste après sa section ;
      pas une première pesée (poids de départ déjà en base) : rien ; module déjà à 7/7 (pas de passage de 6 à 7) : rien ;
   H. projection absente : pas de ligne « Ton objectif », jamais « undefined » ; projection piégée (<b>, <img onerror>) :
      texte brut, aucun élément créé ; projection de 200 caractères : coupée proprement à 140 (mesuré sur l'affichage) ;
   I. robustesse (corrections de la relecture) : lecture groupée ratée (500) → aucune carte, rien de compté, en attente
      (carte le lendemain, avant « Ta prochaine étape ») ; page quittée tout de suite après la carte → pas comptée vue, en
      attente (carte le lendemain) ; page quittée pendant la lecture (ancre détachée) → jamais posée, en attente ; stockage
      de l'appareil bloqué pour cette clé → une seule carte au calculateur (4 calculs, page rouverte), une seule lecture ;
      mémoire de l'appareil illisible ou piégée → on repart de zéro (carte exacte, mémoire réécrite d'aplomb) ; accueil avec
      la clé challenge illisible → rien (l'attente est gardée, la carte revient quand la clé se lit) ; enregistrement refusé
      (mens illisible : « Enregistrer la semaine », « Poids de départ » ; formation illisible : vidéo de bienvenue ;
      calc_perso illisible : « Enregistrer mes chiffres ») → rien ; déjà en attente → rien, avant toute lecture ;
   J. client Thomas (calcul enregistré, une pesée, 7e case du Mindset), le compte client de test (identifiant lu dans
      CONFIG.nouveautes.comptes_test du fichier servi ; toute première pesée, calcul enregistré, 7e case du Mindset) et le
      coach dans la fiche d'un prospect (« Commence ici » fait ; fiche en lecture seule : la 7e case du Mindset ne se coche
      pas à la souris, l'événement « change » lui est envoyé — case redessinée cochée, rien n'est enregistré — ; puis
      calculateur, mensurations et accueil ouverts) : jamais de carte, aucune lecture in.(intake,challenge), aucune
      mémoire d'invitations sur l'appareil ;
   K. la page « Ton plan d'action » ne compte pas : nouveau prospect, 3 questions, page du plan, « Plus tard » (noté
      apres_questionnaire), puis calcul le même jour → la carte du calculateur, sans aucune lecture (tout est en cache) ;
   Z. aucun appel vers l'extérieur (hors polices et vignettes YouTube, bloquées, et le faux Calendly) ; relu après les
      autres blocs : lancé seul, il échoue.
   Supabase simulé (gabarit de verif67 / verif65) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais par
   sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture est
   appliquée en mémoire et notée ; une lecture groupée peut être mise en panne (500) ou retardée. Données fictives, dates
   relatives au midi du lancement (T0). Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗
   apparaît.
   Usage : node verif68.js ../index.html
           VERIF68_PORT=9841 node verif68.js ../index.html     (autre port, si 9840 est pris)
           VERIF68_BLOCS="A.,C." node verif68.js …              (seulement les blocs dont le nom commence ainsi)
           VERIF68_CAPTURES=<dossier> node verif68.js …         (4 captures PNG : carte du calculateur et carte en haut de
                                                                 l'accueil, français sombre et anglais clair) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF68_PORT || 9840;
const BLOCS = (process.env.VERIF68_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF68_CAPTURES || "";
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé (page, css/ et js/), sans retouche ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/\s+/g, " ").trim().slice(0, 900)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
const blocsLances = [];   // Z relit ce que les autres blocs ont appelé : lancé seul, il échoue (rien à vérifier)
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  blocsLances.push(nom);
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ; « un autre
   jour » = T0 + n jours (setSystemTime) : aucun minuit n'est franchi par hasard, quelle que soit l'heure réelle ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const pad = n => String(n).padStart(2, "0");
const jourL = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const JOUR = n => jourL(T0 + n * J);   // le jour local (aujourdhui() de l'app) n jours après le lancement
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
/* la typographie française attendue (js/boite-a-outils.js, typoFr) : insécable avant « : ; ? ! » et « », après « « » */
const typo = s => s.replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });   // valable au-delà du 8e jour simulé
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000068" + String(k).padStart(2, "0");   // verif68 : …68kk (une plage par suite)
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;

/* ---------- le décor : fixtures.js (coach, clients) + les prospects du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], calendly: [], emails: {}, koIn: null, retardIn: 0, lectureKo: null };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif67) et le faux Calendly ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
const CAL_RECUS = [];
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
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (host === "calendly.com") { CAL_RECUS.push(u); db.calendly.push(u); return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Calendly (faux)</body></html>" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {   // renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = (r1 && r1[1]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(who && id === who.id ? who.session : session(id, db.emails[id] || ""));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
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
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      /* une lecture groupée (in.(…)) qui contient une clé en panne : 500 ; la lecture des invitations peut être retardée */
      if (cleEq && db.lectureKo && db.lectureKo.includes(cleEq)) return json({ message: "panne simulée" }, 500);   // une clé illisible (lue seule)
      if (o.startsWith("in.") && db.koIn && liste(o.slice(3)).some(x => db.koIn.includes(x))) return json({ message: "panne simulée" }, 500);
      if (o === "in.(intake,challenge)" && db.retardIn) await new Promise(ok => setTimeout(ok, db.retardIn));
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
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne)));
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
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" ; sombre par défaut), memoire ({ id, valeur } :
   la mémoire des invitations déjà sur l'appareil), bloque (le stockage de l'appareil refuse la clé « mhx_invitations| ») */
const CLE = "mhx_invitations|";
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, langue, theme, memoire, bloque }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;   // l'onglet du faux Calendly : rien
    /* toute carte d'invitation posée dans la page, même retirée aussitôt, est comptée */
    window.__inv68 = 0;
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && ((n.matches && n.matches(".invitation, [data-invitation]")) || (n.querySelector && n.querySelector(".invitation, [data-invitation]")))) window.__inv68++; }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    if (bloque) {   // stockage bloqué ou plein, pour cette clé seulement (la session et le reste de l'app fonctionnent)
      const P = Storage.prototype, g = P.getItem, st = P.setItem;
      P.getItem = function(k){ if (String(k).indexOf("mhx_invitations") === 0) throw new DOMException("stockage bloqué", "SecurityError"); return g.call(this, k); };
      P.setItem = function(k, v){ if (String(k).indexOf("mhx_invitations") === 0) throw new DOMException("stockage plein", "QuotaExceededError"); return st.call(this, k, v); };
    }
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
      if (memoire) localStorage.setItem("mhx_invitations|" + memoire.id, typeof memoire.valeur === "string" ? memoire.valeur : JSON.stringify(memoire.valeur));   // texte : mémoire illisible
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "", memoire: opts.memoire || null, bloque: !!opts.bloque });
  await c.clock.install({ time: T0 });   // midi du jour du lancement, puis l'horloge tourne (setSystemTime pour un autre jour)
  const page = surveiller(await c.newPage());
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
/* une nouvelle visite (page rechargée) à l'instant t de l'horloge de la page (t absent : l'horloge continue) */
async function visiteLe(page, t, h, sel){
  if (t != null) await page.clock.setSystemTime(t);
  await page.evaluate(x => { history.replaceState(null, "", x); }, "/" + (h || ""));
  await page.reload(); await pret(page, sel);
}
/* une nouvelle visite (page rechargée), n jours (et 5 min) après le lancement si n est donné */
const visite = (page, n, h, sel) => visiteLe(page, n != null ? T0 + n * J + 5 * MIN : null, h, sel);
const ACCUEIL = "#/decouverte";   // l'accueil du prospect (#/accueil le mène là)
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
/* les écritures de données, hors compteur de visites du prospect (clé activite) */
const saisies = db => db.ecritures.filter(e => (e.table === "donnees" || e.table === "profils") && e.outil !== "activite");
const resume = db => JSON.stringify(saisies(db).map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const challengeDe = (db, uid) => contenuDe(db, uid, "challenge") || {};
/* la lecture des invitations : GET …/donnees?user_id=eq.<id>&outil=in.(intake,challenge)&select=outil,contenu,maj_le (ces
   deux clés seulement, dans n'importe quel ordre ; la fiche du coach, qui lit toutes les clés d'un compte d'un coup, n'en
   est pas une) */
const lecturesInv = (db, n0) => db.lectures.slice(n0 || 0).filter(l => /^in\./.test(l.outil) && egal(liste(l.outil.slice(3)).sort(), ["challenge", "intake"]));
const lectureExacte = (l, uid) => !!l && l.outil === "in.(intake,challenge)" && l.select === "outil,contenu,maj_le" && l.uid === uid && l.par === uid;
const memoire = (page, uid) => page.evaluate(k => { try { const x = localStorage.getItem(k); return x === null ? null : JSON.parse(x); } catch (e) { return "illisible : " + e.name; } }, CLE + uid);
const clesMemoire = page => page.evaluate(() => { const l = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/invitation/i.test(k)) l.push(k); } } catch (e) { l.push("illisible"); } return l; });
const nbCartes = page => page.evaluate(() => ({ n: document.querySelectorAll(".invitation, [data-invitation]").length, poses: window.__inv68 || 0 }));
const codesAttente = m => (m && Array.isArray(m.attente) ? m.attente.map(a => a.code) : null);
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
/* un clic (vrai) sur un bouton qui ouvre Calendly dans un nouvel onglet : l'adresse de l'onglet ouvert et ce que le faux
   Calendly a reçu ; puis le temps que le clic soit noté (Decouverte.clic : relecture, écriture après 700 ms) */
async function ouvrirCalendly(c, page, sel){
  const n0 = CAL_RECUS.length;
  if (!(await page.$(sel))) return { url: "", recus: [], absent: sel };
  const [pop] = await Promise.all([c.waitForEvent("page", { timeout: 6000 }).catch(() => null), page.click(sel)]);
  let url = "";
  if (pop) { await pop.waitForLoadState("domcontentloaded", { timeout: 6000 }).catch(() => {}); url = pop.url(); await pop.close().catch(() => {}); }
  await attendre(page, 2300);
  return { url, recus: CAL_RECUS.slice(n0) };
}
const TRANSPARENT = "rgba(0, 0, 0, 0)";
const PRIX = /€|\$ ?\d|\d ?\$|\bprix\b|\bprice\b|\btarifs?\b|\beuros?\b|\bEUR\b/i, BRUT = /undefined|\[object|\bNaN\b|\bnull\b/;
const propre = t => !PRIX.test(t) && !BRUT.test(t);
/* aucune valeur saisie dans une carte : aucun chiffre hors « 15 min », ni kcal, kg, cm */
const sansValeurs = t => !/\d/.test(String(t).replace(/15\s?min/gi, "")) && !/kcal|\bkg\b|\bcm\b/i.test(t);
async function capturer(page, nom, sel, haut){
  if (!CAPT) return;
  fs.mkdirSync(CAPT, { recursive: true });
  await page.evaluate(({ sel, haut }) => { const e = document.querySelector(sel); if (haut) window.scrollTo(0, 0); else if (e) e.scrollIntoView({ block: "center" }); }, { sel, haut });
  await attendre(page, 400);
  await page.screenshot({ path: path.join(CAPT, nom) });
}

/* ---------- le lien Calendly attendu (brief F) ---------- */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
const enc = encodeURIComponent;
const lienAtt = (code, k) => CAL + "?utm_source=app&utm_medium=bouton&utm_content=" + code + "&name=" + enc("Léa Martin") + "&first_name=" + enc("Léa") + "&last_name=" + enc("Martin") + "&email=" + enc("p" + k + "@exemple.fr");

/* ---------- les textes attendus (brief V2, H, mot pour mot) : [titre, texte] ---------- */
const INV = {
  declic_calculateur: { fr: ["Tu as ton chiffre. Maintenant, le plan.", "Savoir combien manger, c'est la base. Le tenir avec ton rythme, tes envies et tes semaines chargées, c'est là que tout se joue. En 15 min, Lucas t'aide à en faire un plan qui tient."],
    en: ["You've got your number. Now, the plan.", "Knowing how much to eat is the foundation. Sticking to it with your schedule, your cravings and your busy weeks is where it all happens. In 15 min, Lucas helps you turn it into a plan that sticks."] },
  declic_premiere_pesee: { fr: ["Ton point de départ est posé.", "C'est à partir d'aujourd'hui qu'on mesure tes progrès. Pour que ta courbe aille dans le bon sens, il te faut un plan qui colle à ta vie : c'est ce que Lucas te prépare en 15 min."],
    en: ["Your starting point is set.", "From today, we measure your progress. To move your curve in the right direction, you need a plan that fits your life: that's what Lucas builds with you in 15 min."] },
  declic_mindset: { fr: ["Ton pourquoi est clair.", "Reste le comment. En 15 min, Lucas t'aide à transformer ta motivation en plan concret pour tes prochaines semaines."],
    en: ["Your why is clear.", "Now for the how. In 15 min, Lucas helps you turn your motivation into a concrete plan for the weeks ahead."] },
  formation_commence_ici: { fr: ["Bien joué, ton départ est lancé.", "Prochaine étape : ton plan d'action personnalisé, offert, en 15 min avec Lucas."],
    en: ["Nice work, you're off to a start.", "Next step: your personalized action plan, free, in 15 min with Lucas."] }
};
const OBJ = { fr: p => "Ton objectif : « " + p + " »", en: p => "Your goal: “" + p + "”" };
const BOUTON = { fr: "Récupérer mon plan d'action", en: "Get my action plan" }, SOUS = { fr: "15 min avec Lucas · offert", en: "15 min with Lucas · free" }, TARD = { fr: "Plus tard", en: "Later" };
/* les textes d'une carte tels qu'ils doivent s'afficher (français : typographie française ; anglais : tels quels) */
function textesAtt(code, en, p){
  const l = en ? "en" : "fr", f = x => en ? x : typo(x);
  return { h2: f(INV[code][l][0]), obj: p ? f(OBJ[l](p)) : null, texte: f(INV[code][l][1]), bouton: f(BOUTON[l]), sous: f(SOUS[l]), tard: f(TARD[l]) };
}
const PHOTOS = { fr: "M'aimer sur les photos", en: "Loving how I look in photos" };

/* ---------- les données du décor ---------- */
const AVEC_CHOIX = (k, extra) => Object.assign({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: "p" + k + "@exemple.fr", bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } }, extra || {});
/* des chiffres déjà connus (ancien questionnaire) : le calculateur s'ouvre avec un résultat de départ, rien d'enregistré */
const CHIFFRES = { age: 30, taille: 165, poids: 60, sexe: "Femme", seances: 3 };
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const ZONES = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const MENS_DEPART = { dstart: JOUR(-3), pstart: 70.5, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [] };
/* sa Speed Formation : le module 01 Mindset ouvert, 6 cases sur 7 cochées */
const SIX = { m1a: true, m1b: true, m1c: true, m1d: true, m1e: true, m1f: true };
const FO = extra => Object.assign({ coches: Object.assign({}, SIX), ouvert: "m1", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, extra || {});
const compte = (k, donnees) => ({ id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(4 * J), email: "p" + k + "@exemple.fr", donnees: donnees || [] });
/* v64 (lot 5, B) : ces prospects sont inscrits entre la v52 et la v63, case santé cochée à l'inscription : l'accord est dans
   les métadonnées de leur compte (sans clé newsletter : rien d'autre ne change), donc aucune carte d'accord santé dans le
   calculateur ni dans Ma progression (l'accord au premier usage est vérifié ailleurs) ; quiP(k, meta) : d'autres métadonnées */
const ACCORD_SANTE = { consentement_sante: "2026-09-28T09:00:00.000Z", sante_version: "2026-09-28b" };
const quiP = (k, meta) => qui(PID(k), "p" + k + "@exemple.fr", meta === undefined ? ACCORD_SANTE : meta);
const memVide = () => ({ vues: {}, fermees: {}, attente: [], jour: "", clic: "", reserve: "" });

/* ---------- la carte d'une invitation, lue dans la page (textes bruts : insécables gardées) ---------- */
const carteVue = (page, code) => page.evaluate(code => {
  const brut = e => e ? e.textContent.replace(/[ \t\r\n]+/g, " ").trim() : null;
  const sig = e => e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + [...e.classList].sort().map(c => "." + c).join("") : null;
  const s = document.getElementById("invitation-" + code); if (!s) return null;
  const a = s.querySelector("a"), t = s.querySelector("button"), cta = s.querySelector(".dc-cta"), o = s.querySelector(".inv-objectif");
  const st = e => { if (!e) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { bg: c.backgroundColor, bord: [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join(" "), deco: c.textDecorationLine, w: Math.round(r.width), h: Math.round(r.height) }; };
  const col = v => { const x = document.createElement("span"); x.style.color = "var(" + v + ")"; document.body.appendChild(x); const r = getComputedStyle(x).color; x.remove(); return r; };
  return { sig: sig(s), data: s.getAttribute("data-invitation"), dansVue: !!s.closest("#vue"), n: document.querySelectorAll(".invitation, [data-invitation]").length,
    enfants: [...s.children].map(sig), cta: cta ? [...cta.children].map(sig) : [],
    txt: { h2: brut(s.querySelector("h2")), obj: brut(o), texte: brut(s.querySelector(".inv-texte")), bouton: brut(a), sous: brut(s.querySelector(".dc-cta-sous")), tard: brut(t) },
    objEnfants: o ? o.children.length : -1, elements: s.querySelectorAll("img, b, script, iframe").length,
    a: a ? { href: a.getAttribute("href"), cible: a.getAttribute("target"), rel: a.getAttribute("rel") || "", inv: a.getAttribute("data-inv-cal"), btn: a.classList.contains("btn") } : null,
    tardAttr: t ? { type: t.getAttribute("type"), inv: t.getAttribute("data-inv-tard"), btn: t.classList.contains("btn"), cls: t.className } : null,
    tout: s.innerText, bordure: getComputedStyle(s).borderTopColor, accentLigne: col("--accent-line"), accent: col("--accent"),
    sa: st(a), st: st(t), ctaW: cta ? Math.round(cta.getBoundingClientRect().width) : 0, haut: Math.round(s.getBoundingClientRect().top),
    deborde: document.documentElement.scrollWidth > innerWidth + 1, theme: document.documentElement.getAttribute("data-theme") };
}, code);
/* la carte est-elle juste après son ancre (et qu'y a-t-il après elle) */
const ANCRES = {
  macros: 'const g = document.getElementById("g-prot"); return g && g.closest(".panel");',
  entete: 'return document.querySelector("#vue header.masthead");',
  saisie: 'return document.getElementById("mens-saisie");',
  depart: 'const p = document.getElementById("pstart"); return p && p.closest(".panel");',
  m1: 'const b = document.querySelector(\'#vue [data-mod="m1"]\'); return b && b.closest("section");',
  fo_depart: 'return document.getElementById("fo-depart");'
};
const placeVue = (page, code, ancre) => page.evaluate(({ code, fn }) => {
  const sig = e => e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + [...e.classList].sort().map(c => "." + c).join("") : null;
  const a = (new Function(fn))(), s = document.getElementById("invitation-" + code);
  return { juste: !!a && !!s && a.nextElementSibling === s, ancre: sig(a), avantCarte: s ? sig(s.previousElementSibling) : null, apres: s ? sig(s.nextElementSibling) : null,
    apresH2: s && s.nextElementSibling && s.nextElementSibling.querySelector("h2") ? s.nextElementSibling.querySelector("h2").textContent.trim() : null };
}, { code, fn: ANCRES[ancre] });
/* la vérification commune d'une carte : structure, textes exacts, lien exact, style (bordure dorée, un bouton doré, « Plus
   tard » en lien gris), 390 px, aucune valeur saisie, rien de brut */
function verifCarte(C, code, en, k, p){
  if (!C) return { struct: false, textes: false, lien: false, style: false, att: null };
  const att = textesAtt(code, en, p);
  const enfants = ["h2"].concat(p ? ["p.inv-objectif"] : []).concat(["p.inv-texte", "div.dc-cta"]);
  const struct = C.sig === "section#invitation-" + code + ".invitation.panel" && C.data === code && C.dansVue && C.n === 1 && egal(C.enfants, enfants)
    && egal(C.cta, ["a.btn", "p.dc-cta-sous", "button.lien-discret"]) && !!C.tardAttr && C.tardAttr.type === "button" && C.tardAttr.inv === code && !C.tardAttr.btn;
  const textes = egal(C.txt, att) && (!en || !Object.values(C.txt).some(x => /[  ]/.test(x || ""))) && sansValeurs(C.tout) && propre(C.tout);
  const lien = !!C.a && C.a.href === lienAtt(code, k) && C.a.cible === "_blank" && /noopener/.test(C.a.rel) && C.a.inv === code && C.a.btn;
  const style = C.bordure === C.accentLigne && C.sa.bg === C.accent && C.sa.h >= 44 && Math.abs(C.sa.w - C.ctaW) <= 1 && C.st.bg === TRANSPARENT && C.st.bord === "0px 0px 0px 0px" && /underline/.test(C.st.deco) && C.st.h >= 44 && !C.deborde
    && C.theme === (en ? "light" : null);
  return { struct, textes, lien, style, att };
}
const detail = (C, V) => JSON.stringify(C ? { sig: C.sig, n: C.n, enfants: C.enfants, cta: C.cta, txt: C.txt, att: V && V.att, a: C.a, tard: C.tardAttr, bord: [C.bordure, C.accentLigne], sa: C.sa, st: C.st, ctaW: C.ctaW, theme: C.theme, deborde: C.deborde } : "carte absente");

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF68_PORT=9841 node verif68.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. le parcours d'un prospect, français, 390 px, thème sombre =================== */
  await bloc("A. parcours en français", async () => {
    const k = 1, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)], ["formation", FO()]])] });
    const { page } = await contexte(b, quiP(k), db);
    const ouvertures = [];   // [page, écritures en base pendant son ouverture]
    const ouvrir = async (nom, fn) => { const n0 = saisies(db).length; await fn(); ouvertures.push([nom, saisies(db).length - n0]); };
    /* le calculateur, ouvert avec un résultat de départ (ses chiffres du questionnaire) : rien n'est enregistré */
    await ouvrir("calculateur", async () => { await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1800); });
    const ouv = await page.evaluate(() => ({ tdee: document.getElementById("tdee").textContent.trim(), okVisible: !!document.getElementById("calc-ok") && !document.getElementById("calc-ok").hidden }));
    const n0 = await nbCartes(page), m0 = await memoire(page, ID), k0 = await clesMemoire(page);
    ok("ouverture du calculateur avec un résultat de départ (tiré du questionnaire), sans enregistrement : résultat affiché, « Enregistrer mes chiffres » proposé ; aucune carte, aucune lecture intake+challenge, rien d'écrit en base ni sur l'appareil (aucune clé d'invitations)",
      /\d/.test(ouv.tdee) && ouv.okVisible && n0.n === 0 && n0.poses === 0 && lecturesInv(db).length === 0 && saisies(db).length === 0 && m0 === null && k0.length === 0,
      JSON.stringify([ouv, n0, m0, k0, lecturesInv(db)]) + " · " + resume(db));
    /* « Enregistrer mes chiffres » : le calcul enregistré déclenche la carte */
    const L0 = db.lectures.length;
    await page.click("#calc-ok");
    await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null);
    const msg = await page.$eval("#calc-msg", e => e.textContent).catch(() => "");
    await attendre(page, 2000);   // la carte reste à l'écran au-delà de 1,5 s : comptée vue ; l'écriture du calcul est partie
    const C = await carteVue(page, "declic_calculateur"), V = verifCarte(C, "declic_calculateur", false, k, PHOTOS.fr), pl = await placeVue(page, "declic_calculateur", "macros");
    ok("« Enregistrer mes chiffres » (« Tes chiffres sont enregistrés. ») : la carte section.panel.invitation#invitation-declic_calculateur[data-invitation], seule de la page, juste APRÈS la section des macros (la dernière section du calculateur) ; dans l'ordre : h2, « Ton objectif », texte, div.dc-cta (bouton doré, « 15 min avec Lucas · offert », button.lien-discret « Plus tard »)",
      /Tes chiffres sont enregistrés\./.test(msg) && V.struct && pl.juste && pl.apres === null, detail(C, V) + " · " + JSON.stringify([msg, pl]));
    ok("textes EXACTS du brief H (typographie française : espace insécable avant « : », dans « « … » ») : « Tu as ton chiffre. Maintenant, le plan. », « Ton objectif : « M'aimer sur les photos » », « Savoir combien manger… un plan qui tient. », « Récupérer mon plan d'action », « 15 min avec Lucas · offert », « Plus tard » ; aucune valeur saisie (poids, taille, âge, kcal : aucun chiffre hors « 15 min »), aucun prix ni « undefined »",
      V.textes, detail(C, V) + " · " + JSON.stringify(C && C.tout));
    ok("lien exact : " + lienAtt("declic_calculateur", k).slice(0, 118) + "… (base 15 min, utm_source=app, utm_medium=bouton, utm_content=declic_calculateur, prénom, nom, email), nouvel onglet (noopener), data-inv-cal",
      V.lien, JSON.stringify(C && C.a));
    ok("style des cartes à bordure dorée (--accent-line), bouton doré sur toute la largeur (≥ 44 px), « Plus tard » gris souligné sans fond ni bordure (≥ 44 px), thème sombre ; 390 px sans défilement horizontal",
      V.style, detail(C, V));
    const L = lecturesInv(db, L0), E = saisies(db), m1 = await memoire(page, ID);
    ok("au déclencheur, UNE lecture groupée sans cache : GET …/donnees?user_id=eq.<son id>&outil=in.(intake,challenge)&select=outil,contenu,maj_le ; en base, seul son calcul (calc_perso) est écrit, rien d'autre (ni challenge, ni intake)",
      L.length === 1 && lectureExacte(L[0], ID) && E.length === 1 && E[0].outil === "calc_perso" && E[0].user_id === ID, JSON.stringify(L) + " · " + resume(db));
    ok("mémoire sur l'appareil, localStorage « mhx_invitations|<son id> » : { vues: { declic_calculateur: instant }, fermees: {}, attente: [], jour: « " + JOUR(0) + " » (jour local), clic: \"\", reserve: \"\" }, seule clé d'invitations",
      !!m1 && egal(Object.keys(m1), ["vues", "fermees", "attente", "jour", "clic", "reserve"]) && egal(Object.keys(m1.vues), ["declic_calculateur"]) && ISO.test(m1.vues.declic_calculateur)
      && egal(m1.fermees, {}) && egal(m1.attente, []) && m1.jour === JOUR(0) && m1.clic === "" && m1.reserve === "" && egal(await clesMemoire(page), [CLE + ID]), JSON.stringify([m1, await clesMemoire(page)]));
    await capturer(page, "calculateur-fr-sombre.png", "#invitation-declic_calculateur");
    /* un autre calcul, sur la même page : pas de 2e carte, pas de nouvelle lecture */
    await page.fill("#poids", "61"); await attendre(page, 1800);
    const n1 = await nbCartes(page);
    ok("un autre calcul enregistré (poids changé) : toujours UNE seule carte (posée une fois), aucune nouvelle lecture intake+challenge ; le calcul est bien réécrit",
      n1.n === 1 && n1.poses === 1 && lecturesInv(db).length === 1 && ecr(db, "calc_perso", ID).length === 2, JSON.stringify(n1) + " · " + resume(db));
    /* le même jour : la toute première pesée, puis les 7 cases du module Mindset */
    await ouvrir("mensurations", async () => { await aller(page, "#/mensurations", 1800); await page.waitForSelector("#add", { timeout: 6000 }); });
    const L1 = db.lectures.length, p1 = (await nbCartes(page)).poses;
    await page.fill("#e-poids", "70"); await page.click("#add"); await attendre(page, 2000);
    const n2 = await nbCartes(page), m2 = await memoire(page, ID), mens = contenuDe(db, ID, "mens") || {};
    ok("le même jour, toute première pesée (« Enregistrer la semaine ») : enregistrée (mens, poids 70), aucune carte, mise en attente (attente = [declic_premiere_pesee], datée), sans aucune lecture intake+challenge",
      n2.n === 0 && n2.poses === p1 && ecr(db, "mens", ID).length === 1 && Array.isArray(mens.mesures) && mens.mesures.length === 1 && mens.mesures[0].poids === 70
      && egal(codesAttente(m2), ["declic_premiere_pesee"]) && ISO.test(m2.attente[0].le) && !m2.vues.declic_premiere_pesee && lecturesInv(db, L1).length === 0, JSON.stringify([n2, m2]) + " · " + resume(db));
    await ouvrir("formation", async () => { await aller(page, "#/formation", 1800); await page.waitForSelector('[data-coche="m1g"]', { timeout: 6000 }); });
    const L2 = db.lectures.length, p2 = (await nbCartes(page)).poses;   // la carte du calculateur a déjà été posée dans ce document
    await page.check('[data-coche="m1g"]'); await attendre(page, 2000);
    const n3 = await nbCartes(page), m3 = await memoire(page, ID), fo = contenuDe(db, ID, "formation") || {};
    ok("le même jour, la 7e case du module 01 Mindset (7/7) : enregistrée, aucune carte, mise en attente après la pesée (attente = [declic_premiere_pesee, declic_mindset]), sans lecture",
      n3.n === 0 && n3.poses === p2 && (fo.coches || {}).m1g === true && egal(codesAttente(m3), ["declic_premiere_pesee", "declic_mindset"]) && lecturesInv(db, L2).length === 0 && m3.jour === JOUR(0),
      JSON.stringify([n3, m3]) + " · " + resume(db));
    /* un autre jour : l'accueil montre la plus récente en attente, en haut */
    await ouvrir("accueil (jour 1)", async () => { await visite(page, 1, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_mindset", { timeout: 6000 }).catch(() => null); await attendre(page, 1800); });
    const Cm = await carteVue(page, "declic_mindset"), Vm = verifCarte(Cm, "declic_mindset", false, k, PHOTOS.fr), plm = await placeVue(page, "declic_mindset", "entete"), m4 = await memoire(page, ID);
    ok("UN AUTRE JOUR (lendemain), l'accueil : UNE carte, la plus récente en attente (declic_mindset), en haut, juste après l'en-tête .masthead et avant la suite de l'accueil (Speed Formation), visible sans défiler ; structure, textes exacts (« Ton pourquoi est clair. »…), lien declic_mindset",
      Vm.struct && Vm.textes && Vm.lien && Vm.style && plm.juste && plm.apres === "section#dc-formation.panel" && Cm.haut < 844, detail(Cm, Vm) + " · " + JSON.stringify(plm));
    ok("… comptée comme l'invitation du jour : vues declic_calculateur + declic_mindset, jour « " + JOUR(1) + " », la pesée toujours en attente (seule)",
      !!m4 && egal(Object.keys(m4.vues).sort(), ["declic_calculateur", "declic_mindset"]) && m4.jour === JOUR(1) && egal(codesAttente(m4), ["declic_premiere_pesee"]), JSON.stringify(m4));
    await capturer(page, "accueil-fr-sombre.png", "#invitation-declic_mindset", true);
    await aller(page, "#/profil", 1200); await aller(page, ACCUEIL, 1800);
    const n5 = await nbCartes(page);
    await visite(page, null, ACCUEIL, "#dc-accomp"); await attendre(page, 1500);
    const n6 = await nbCartes(page), m6 = await memoire(page, ID);
    ok("le même jour, accueil rouvert puis page rechargée : plus aucune carte (la même ne revient pas, une par jour), la pesée toujours en attente",
      n5.n === 0 && n6.n === 0 && n6.poses === 0 && egal(codesAttente(m6), ["declic_premiere_pesee"]), JSON.stringify([n5, n6, m6]));
    /* encore un autre jour : la suivante */
    await ouvrir("accueil (jour 2)", async () => { await visite(page, 2, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(page, 1800); });
    const Cp = await carteVue(page, "declic_premiere_pesee"), Vp = verifCarte(Cp, "declic_premiere_pesee", false, k, PHOTOS.fr), plp = await placeVue(page, "declic_premiere_pesee", "entete"), m7 = await memoire(page, ID);
    ok("ENCORE UN AUTRE JOUR : la suivante, declic_premiere_pesee, seule, en haut sous l'en-tête (le Mindset ne revient pas) ; textes exacts (« Ton point de départ est posé. », « … qui colle à ta vie : c'est ce que Lucas te prépare en 15 min. »), lien declic_premiere_pesee ; attente vide",
      Vp.struct && Vp.textes && Vp.lien && plp.juste && !(await page.$("#invitation-declic_mindset")) && !!m7 && egal(m7.attente, []) && m7.jour === JOUR(2), detail(Cp, Vp) + " · " + JSON.stringify([plp, m7]));
    const w0 = ecr(db, "challenge", ID).length, t0 = await page.evaluate(() => Date.now());
    await page.click('[data-inv-tard="declic_premiere_pesee"]');
    const retire = await page.evaluate(() => !document.getElementById("invitation-declic_premiere_pesee"));
    await attendre(page, 2500);
    const m8 = await memoire(page, ID), Ch = challengeDe(db, ID), pt = ((Ch.cta || {}).plus_tard) || [];
    ok("« Plus tard » : la carte est retirée tout de suite ; fermée pour toujours sur l'appareil (fermees.declic_premiere_pesee) ; en base, UNE écriture de challenge : cta.plus_tard = [{ source « declic_premiere_pesee », date }] (aucun clic compté)",
      retire && !!m8 && ISO.test(m8.fermees.declic_premiere_pesee || "") && ecr(db, "challenge", ID).length === w0 + 1 && pt.length === 1 && egal(Object.keys(pt[0]).sort(), ["date", "source"])
      && pt[0].source === "declic_premiere_pesee" && ISO.test(pt[0].date) && Math.abs(Date.parse(pt[0].date) - t0) < 15000 && !((Ch.cta || {}).clics || []).length, JSON.stringify([retire, m8, Ch]) + " · " + resume(db));
    await visite(page, 3, ACCUEIL, "#dc-accomp"); await attendre(page, 1500);
    const n9 = await nbCartes(page);
    ok("le jour d'après : plus aucune carte (rien en attente, la pesée fermée)", n9.n === 0 && n9.poses === 0, JSON.stringify(n9));
    ok("aucune écriture en base à la simple ouverture d'une page (calculateur avec son résultat de départ, mensurations, formation, accueil avec une carte, deux jours de suite)",
      ouvertures.length === 5 && ouvertures.every(x => x[1] === 0), JSON.stringify(ouvertures));
  });

  /* =================== B. anglais, 390 px, thème clair =================== */
  await bloc("B. parcours en anglais", async () => {
    const k = 2, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)]])] });
    const { c, page } = await contexte(b, quiP(k), db, { langue: "en", theme: "light" });
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    /* le calcul saisi champ par champ : enregistré dès qu'il est complet */
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60");
    await attendre(page, 1500);   // le temps qu'une carte arrive (lecture, pose) si ce calcul incomplet la déclenchait
    const avantDernier = Object.assign(await nbCartes(page), { calc: ecr(db, "calc_perso", ID).length, L: lecturesInv(db).length });
    await page.fill("#heures", "3");
    await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const C = await carteVue(page, "declic_calculateur"), V = verifCarte(C, "declic_calculateur", true, k, PHOTOS.en), pl = await placeVue(page, "declic_calculateur", "macros");
    ok("anglais, thème clair : calcul incomplet (4 champs sur 5, 1,5 s d'attente : aucune carte posée, rien d'enregistré, aucune lecture intake+challenge), puis complet et enregistré : la carte juste après les macros ; textes EXACTS (« You've got your number. Now, the plan. », « Your goal: “Loving how I look in photos” », « Knowing how much to eat… », « Get my action plan », « 15 min with Lucas · free », « Later »), sans espace insécable ni aucune valeur saisie",
      avantDernier.n === 0 && avantDernier.poses === 0 && avantDernier.calc === 0 && avantDernier.L === 0 && V.struct && V.textes && pl.juste && ecr(db, "calc_perso", ID).length === 1, detail(C, V) + " · " + JSON.stringify([avantDernier, pl, C && C.tout]));
    ok("anglais : lien exact (declic_calculateur, pré-rempli) ; bordure dorée et bouton doré du thème clair, « Later » gris souligné ; 390 px sans débordement",
      V.lien && V.style, detail(C, V));
    await capturer(page, "calculateur-en-clair.png", "#invitation-declic_calculateur");
    /* le même jour : « Poids de départ » (Starting weight), toute première pesée */
    await aller(page, "#/mensurations", 1800); await page.waitForSelector("#pstart", { state: "attached", timeout: 6000 });
    await page.click("details:has(#pstart) > summary"); await page.fill("#pstart", "72"); await page.press("#pstart", "Tab"); await attendre(page, 2000);
    const n1 = await nbCartes(page), m1 = await memoire(page, ID);
    ok("le même jour, « Poids de départ » (première pesée, champ #pstart) : enregistré (mens.pstart 72), aucune carte, en attente (attente = [declic_premiere_pesee])",
      n1.n === 0 && (contenuDe(db, ID, "mens") || {}).pstart === 72 && egal(codesAttente(m1), ["declic_premiere_pesee"]), JSON.stringify([n1, m1]) + " · " + resume(db));
    await visite(page, 1, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const Cp = await carteVue(page, "declic_premiere_pesee"), Vp = verifCarte(Cp, "declic_premiere_pesee", true, k, PHOTOS.en), plp = await placeVue(page, "declic_premiere_pesee", "entete");
    ok("anglais, le lendemain : l'accueil montre la carte en haut, juste après l'en-tête : « Your starting point is set. », « Your goal: “Loving how I look in photos” », « From today, we measure your progress… », « Get my action plan », « 15 min with Lucas · free », « Later » ; lien declic_premiere_pesee ; thème clair, 390 px",
      Vp.struct && Vp.textes && Vp.lien && Vp.style && plp.juste, detail(Cp, Vp) + " · " + JSON.stringify(plp));
    await capturer(page, "accueil-en-clair.png", "#invitation-declic_premiere_pesee", true);
    const o = await ouvrirCalendly(c, page, '[data-inv-cal="declic_premiere_pesee"]'), cl = ((challengeDe(db, ID).cta || {}).clics) || [], m2 = await memoire(page, ID);
    ok("clic sur « Get my action plan » de la carte : l'onglet ouvert reçoit exactement le lien declic_premiere_pesee (faux Calendly) ; clic noté en base (challenge.cta.clics : source declic_premiere_pesee, jour, date) et sur l'appareil (clic)",
      o.url === lienAtt("declic_premiere_pesee", k) && o.recus.length === 1 && cl.length === 1 && cl[0].source === "declic_premiere_pesee" && typeof cl[0].jour === "number" && ISO.test(cl[0].date) && !!m2 && ISO.test(m2.clic),
      JSON.stringify([o, cl, m2]) + " · " + resume(db));
  });

  /* =================== C. « Plus tard » : définitif, trace en base =================== */
  await bloc("C. « Plus tard » définitif", async () => {
    const k = 3, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const avantClic = !!(await page.$("#invitation-declic_calculateur")), t0 = await page.evaluate(() => Date.now());
    await page.click('[data-inv-tard="declic_calculateur"]');
    const retire = await page.evaluate(() => !document.getElementById("invitation-declic_calculateur"));
    await attendre(page, 2500);
    const m1 = await memoire(page, ID), Ch = challengeDe(db, ID), pt = ((Ch.cta || {}).plus_tard) || [];
    ok("carte du calculateur, « Plus tard » : retirée tout de suite ; fermees.declic_calculateur sur l'appareil ; UNE écriture de challenge, cta.plus_tard = [{ source « declic_calculateur », date }], aucun clic",
      avantClic && retire && !!m1 && ISO.test(m1.fermees.declic_calculateur || "") && ecr(db, "challenge", ID).length === 1 && pt.length === 1 && pt[0].source === "declic_calculateur" && Math.abs(Date.parse(pt[0].date) - t0) < 15000 && !((Ch.cta || {}).clics || []).length,
      JSON.stringify([avantClic, retire, m1, Ch]) + " · " + resume(db));
    await page.fill("#poids", "61"); await attendre(page, 1800);
    const n1 = await nbCartes(page);
    await visite(page, null, "#/calculateur", "#tdee"); await page.fill("#poids", "62"); await attendre(page, 1800);
    const n2 = await nbCartes(page);
    ok("un autre calcul sur la même page, puis page rechargée et encore un calcul : la carte ne revient jamais", n1.n === 0 && n2.n === 0 && n2.poses === 0 && ecr(db, "calc_perso", ID).length === 3, JSON.stringify([n1, n2]) + " · " + resume(db));
    /* la mémoire de l'appareil vidée (comme « Se déconnecter ») : la trace en base suffit */
    await page.evaluate(k => localStorage.removeItem(k), CLE + ID);
    await visite(page, null, "#/calculateur", "#tdee");
    const L0 = db.lectures.length;
    await page.fill("#poids", "63"); await attendre(page, 2000);
    const n3 = await nbCartes(page), m3 = await memoire(page, ID), L = lecturesInv(db, L0);
    ok("mémoire de l'appareil vidée, page rechargée, nouveau calcul : relu en base (une lecture intake+challenge), le « Plus tard » de ce code y est : aucune carte (jamais posée), rien mis en attente",
      n3.n === 0 && n3.poses === 0 && L.length === 1 && lectureExacte(L[0], ID) && (m3 === null || (egal(m3.attente, []) && !m3.vues.declic_calculateur)), JSON.stringify([n3, m3, L]));
    /* une attente de ce code remise sur l'appareil (mémoire d'une autre visite) : l'accueil d'un autre jour ne la montre pas */
    await page.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: CLE + ID, v: Object.assign(memVide(), { attente: [{ code: "declic_calculateur", le: avant(-10 * MIN) }], jour: JOUR(0) }) });
    await visite(page, 1, ACCUEIL, "#dc-accomp"); await attendre(page, 1500);
    const n4 = await nbCartes(page);
    ok("… et une attente de ce code sur l'appareil : l'accueil, un autre jour, ne la montre pas (trace « Plus tard » en base)", n4.n === 0 && n4.poses === 0, JSON.stringify([n4, await memoire(page, ID)]));

    /* « traitée » en base par un CLIC sur le bouton de cette invitation (il y a 10 jours : hors des 7 jours), mémoire de
       l'appareil vide : ni au déclencheur, ni depuis une attente remise sur l'appareil */
    {
      const k2 = 26, ID2 = PID(k2);
      const C2 = { version: 1, jours: {}, cta: { clics: [{ jour: 2, source: "declic_calculateur", date: avant(10 * J) }] } };
      const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2, CHIFFRES)], ["challenge", C2, avant(10 * J)]])] });
      const { page: p2 } = await contexte(b, quiP(k2), db2);
      await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#tdee"); await attendre(p2, 800);
      await p2.click("#calc-ok"); await attendre(p2, 2200);
      const n5 = await nbCartes(p2), m5 = await memoire(p2, ID2), L5 = lecturesInv(db2);
      ok("clic en base sur le bouton de CETTE invitation (source declic_calculateur, il y a 10 jours), mémoire de l'appareil vide : calcul enregistré → relu (une lecture), aucune carte (jamais posée), rien mis en attente",
        ecr(db2, "calc_perso", ID2).length === 1 && n5.n === 0 && n5.poses === 0 && L5.length === 1 && lectureExacte(L5[0], ID2) && (m5 === null || (egal(m5.attente, []) && !m5.vues.declic_calculateur)),
        JSON.stringify([n5, m5, L5]) + " · " + resume(db2));
      await p2.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: CLE + ID2, v: Object.assign(memVide(), { attente: [{ code: "declic_calculateur", le: avant(-10 * MIN) }], jour: JOUR(0) }) });
      await visite(p2, 1, ACCUEIL, "#dc-accomp"); await attendre(p2, 1500);
      const n6 = await nbCartes(p2), m6 = await memoire(p2, ID2);
      ok("… et une attente de ce code remise sur l'appareil : l'accueil, un autre jour, ne la montre pas (le clic en base suffit ; rien n'est compté vu)",
        n6.n === 0 && n6.poses === 0 && !!m6 && !m6.vues.declic_calculateur && m6.jour === JOUR(0), JSON.stringify([n6, m6]));
    }

    /* Decouverte.plusTard relit la clé avant d'écrire et fusionne : une clé challenge déjà remplie (jours, un clic ancien,
       un « Plus tard » ancien, un champ inconnu) et une modification faite en base (autre onglet) entre l'affichage de la
       carte et le tap : tout est gardé, le nouveau « Plus tard » est ajouté à la suite */
    {
      const k3 = 28, ID3 = PID(k3);
      const vieuxClic = { jour: 2, source: "accueil_haut", date: avant(10 * J) }, vieuxTard = { source: "apres_questionnaire", date: avant(10 * J - H) };
      const C3 = { version: 1, jours: { "1": { fait: true }, "3": { fait: true, note: "séance faite" } }, cta: { clics: [vieuxClic], plus_tard: [vieuxTard] }, perso: "gardé" };
      const db3 = base({ comptes: [compte(k3, [["intake", AVEC_CHOIX(k3, CHIFFRES)], ["challenge", C3, avant(10 * J)]])] });
      const { page: p3 } = await contexte(b, quiP(k3), db3);
      await p3.goto(URL0 + "#/calculateur"); await pret(p3, "#tdee"); await attendre(p3, 800);
      await p3.click("#calc-ok"); await p3.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(p3, 1800);
      const vue = !!(await p3.$("#invitation-declic_calculateur"));
      /* un autre onglet écrit en base pendant que la carte est affichée : un clic (page verrouillée) et un jour de plus */
      const nouveauClic = { jour: 5, source: "verrou_programme", date: avant(0) };
      const ligne = db3.donnees.find(d => d.user_id === ID3 && d.outil === "challenge");
      ligne.contenu = clone(ligne.contenu); ligne.contenu.cta.clics.push(nouveauClic); ligne.contenu.jours["4"] = { fait: true }; ligne.maj_le = avant(0);
      const w0 = ecr(db3, "challenge", ID3).length, t0 = await p3.evaluate(() => Date.now());
      await p3.click('[data-inv-tard="declic_calculateur"]'); await attendre(p3, 2500);
      const F3 = challengeDe(db3, ID3), cta3 = F3.cta || {}, pt3 = Array.isArray(cta3.plus_tard) ? cta3.plus_tard : [];
      const nouveau = pt3[pt3.length - 1] || {};
      ok("« Plus tard » sur une clé challenge déjà remplie (jours, clic et « Plus tard » anciens, champ inconnu) : UNE écriture ; tout est gardé (version, perso, jours 1 et 3, le clic ancien, le « Plus tard » ancien en tête) et le nouveau ajouté à la suite (source declic_calculateur, date du tap)",
        vue && ecr(db3, "challenge", ID3).length === w0 + 1 && F3.version === 1 && F3.perso === "gardé" && egal(F3.jours && F3.jours["1"], C3.jours["1"]) && egal(F3.jours && F3.jours["3"], C3.jours["3"])
          && Array.isArray(cta3.clics) && egal(cta3.clics[0], vieuxClic) && pt3.length === 2 && egal(pt3[0], vieuxTard) && egal(Object.keys(nouveau).sort(), ["date", "source"]) && nouveau.source === "declic_calculateur"
          && ISO.test(nouveau.date || "") && Math.abs(Date.parse(nouveau.date) - t0) < 15000, JSON.stringify([vue, F3]) + " · " + resume(db3));
      ok("… et la modification faite en base entre l'affichage de la carte et le tap (un clic d'une page verrouillée, un jour de plus) est gardée : relue avant l'écriture (clics = [l'ancien, le nouveau], jours 1, 3 et 4), rien d'effacé ni de doublé",
        egal(cta3.clics, [vieuxClic, nouveauClic]) && egal(Object.keys(F3.jours || {}).sort(), ["1", "3", "4"]) && egal(F3.jours["4"], { fait: true }), JSON.stringify(F3));
    }

    /* 50 « Plus tard » au plus : il y en a déjà 50 en base ; après le tap, toujours 50 (le plus ancien part, le nouveau à la fin) */
    {
      const k4 = 29, ID4 = PID(k4);
      const cinquante = Array.from({ length: 50 }, (_, i) => ({ source: i % 2 ? "apres_questionnaire" : "declic_mindset", date: avant((100 - i) * H) }));
      const C4 = { version: 1, jours: {}, cta: { clics: [], plus_tard: cinquante } };
      const db4 = base({ comptes: [compte(k4, [["intake", AVEC_CHOIX(k4, CHIFFRES)], ["challenge", C4, avant(2 * H)]])] });
      const { page: p4 } = await contexte(b, quiP(k4), db4);
      await p4.goto(URL0 + "#/calculateur"); await pret(p4, "#tdee"); await attendre(p4, 800);
      await p4.click("#calc-ok"); await p4.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(p4, 1800);
      const vue = !!(await p4.$("#invitation-declic_calculateur"));
      await p4.click('[data-inv-tard="declic_calculateur"]'); await attendre(p4, 2500);
      const pt4 = ((challengeDe(db4, ID4).cta || {}).plus_tard) || [];
      ok("50 « Plus tard » déjà en base : après le tap, il en reste 50 — les 49 plus récents dans leur ordre, puis le nouveau (declic_calculateur) ; une seule écriture",
        vue && ecr(db4, "challenge", ID4).length === 1 && pt4.length === 50 && egal(pt4.slice(0, 49), cinquante.slice(1)) && (pt4[49] || {}).source === "declic_calculateur" && ISO.test((pt4[49] || {}).date || ""),
        JSON.stringify([vue, pt4.length, pt4.slice(0, 2), pt4.slice(-2)]) + " · " + resume(db4));
    }
  });

  /* =================== D. clic sur le bouton : 7 jours sans invitation =================== */
  await bloc("D. clic sur le bouton, 7 jours", async () => {
    const k = 4, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
    const { c, page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const o = await ouvrirCalendly(c, page, '[data-inv-cal="declic_calculateur"]'), cl = ((challengeDe(db, ID).cta || {}).clics) || [], m0 = await memoire(page, ID);
    ok("clic sur « Récupérer mon plan d'action » de la carte : l'onglet ouvert reçoit exactement le lien declic_calculateur ; clic noté en base (source declic_calculateur, jour, date) en UNE écriture de challenge, et sur l'appareil (clic)",
      o.url === lienAtt("declic_calculateur", k) && o.recus.length === 1 && cl.length === 1 && cl[0].source === "declic_calculateur" && typeof cl[0].jour === "number" && ecr(db, "challenge", ID).length === 1 && !!m0 && ISO.test(m0.clic),
      JSON.stringify([o, cl, m0]) + " · " + resume(db));
    await visite(page, 1, "#/mensurations", "#add");
    const L1 = db.lectures.length;
    await page.fill("#e-poids", "70"); await page.click("#add"); await attendre(page, 2000);
    const n1 = await nbCartes(page), m1 = await memoire(page, ID);
    ok("le lendemain (clic de moins de 7 jours), toute première pesée : aucune carte, en attente (declic_premiere_pesee), sans même relire la base",
      n1.n === 0 && n1.poses === 0 && ecr(db, "mens", ID).length === 1 && egal(codesAttente(m1), ["declic_premiere_pesee"]) && lecturesInv(db, L1).length === 0, JSON.stringify([n1, m1]));
    await aller(page, ACCUEIL, 1800);
    const n2 = await nbCartes(page);
    /* l'instant du clic : le plus récent de ce qui est noté sur l'appareil (clic) et en base (cta.clics[].date) */
    const tClic = Math.max(Date.parse(m0 && m0.clic) || 0, Date.parse(cl[0] && cl[0].date) || 0);
    await visiteLe(page, tClic + 7 * J - H, ACCUEIL, "#dc-accomp"); await attendre(page, 1500);
    const n3 = await nbCartes(page);
    ok("accueil le lendemain, puis 7 jours MOINS 1 heure après le clic : aucune carte (la pesée reste en attente)", tClic > 0 && n2.n === 0 && n3.n === 0 && n3.poses === 0 && egal(codesAttente(await memoire(page, ID)), ["declic_premiere_pesee"]), JSON.stringify([tClic, n2, n3]));
    await visiteLe(page, tClic + 7 * J + 5 * MIN, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const Cp = await carteVue(page, "declic_premiere_pesee"), Vp = verifCarte(Cp, "declic_premiere_pesee", false, k, PHOTOS.fr), plp = await placeVue(page, "declic_premiere_pesee", "entete");
    ok("7 jours PLUS 5 minutes après le clic : l'accueil montre la carte en attente (declic_premiere_pesee), en haut sous l'en-tête, textes et lien exacts",
      Vp.struct && Vp.textes && Vp.lien && plp.juste, detail(Cp, Vp) + " · " + JSON.stringify(plp));
    /* un clic de moins de 7 jours noté EN BASE seulement (bouton du haut de l'accueil, il y a 3 jours ; rien sur l'appareil) */
    const k2 = 5, ID2 = PID(k2);
    const C2 = { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "accueil_haut", date: avant(3 * J) }] } };
    const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2, CHIFFRES)], ["challenge", C2, avant(3 * J)]])] });
    const { page: p2 } = await contexte(b, quiP(k2), db2);
    await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#tdee"); await attendre(p2, 800);
    await p2.click("#calc-ok"); await attendre(p2, 2200);
    const n4 = await nbCartes(p2), m4 = await memoire(p2, ID2), L4 = lecturesInv(db2);
    await visiteLe(p2, T0 - 3 * J + 7 * J - H, ACCUEIL, "#dc-accomp"); await attendre(p2, 1500);
    const n5 = await nbCartes(p2);
    ok("clic en base seulement (bouton du haut, il y a 3 jours) : calcul enregistré → relu (une lecture), aucune carte, en attente ; accueil 7 jours MOINS 1 heure après ce clic : rien",
      ecr(db2, "calc_perso", ID2).length === 1 && n4.n === 0 && n4.poses === 0 && L4.length === 1 && lectureExacte(L4[0], ID2) && egal(codesAttente(m4), ["declic_calculateur"]) && n5.n === 0 && n5.poses === 0, JSON.stringify([n4, m4, L4, n5]));
    await visite(p2, 4, ACCUEIL, "#dc-accomp"); await p2.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(p2, 1500);
    const C5 = await carteVue(p2, "declic_calculateur"), V5 = verifCarte(C5, "declic_calculateur", false, k2, PHOTOS.fr), pl5 = await placeVue(p2, "declic_calculateur", "entete");
    ok("… 7 jours PLUS 5 minutes après ce clic : la carte declic_calculateur en haut de l'accueil (textes et lien exacts)", V5.struct && V5.textes && V5.lien && pl5.juste, detail(C5, V5) + " · " + JSON.stringify(pl5));

    /* le clic le plus récent est le plus récent EN DATE, pas le dernier (ni le premier) de la liste : clics en base dans le
       désordre (il y a 10 jours, 2 jours, 12 jours) */
    const k3 = 27, ID3 = PID(k3);
    const C3 = { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "verrou_programme", date: avant(10 * J) }, { jour: 5, source: "accueil_haut", date: avant(2 * J) }, { jour: 0, source: "apres_questionnaire", date: avant(12 * J) }] } };
    const db3 = base({ comptes: [compte(k3, [["intake", AVEC_CHOIX(k3, CHIFFRES)], ["challenge", C3, avant(2 * J)]])] });
    const { page: p3 } = await contexte(b, quiP(k3), db3);
    await p3.goto(URL0 + "#/calculateur"); await pret(p3, "#tdee"); await attendre(p3, 800);
    await p3.click("#calc-ok"); await attendre(p3, 2200);
    const n6 = await nbCartes(p3), m6 = await memoire(p3, ID3), L6 = lecturesInv(db3);
    ok("clics en base dans le désordre (le plus récent, il y a 2 jours, au milieu de la liste) : calcul enregistré → relu (une lecture), aucune carte, en attente (clic de moins de 7 jours)",
      ecr(db3, "calc_perso", ID3).length === 1 && n6.n === 0 && n6.poses === 0 && L6.length === 1 && lectureExacte(L6[0], ID3) && egal(codesAttente(m6), ["declic_calculateur"]), JSON.stringify([n6, m6, L6]));
    await visiteLe(p3, T0 - 2 * J + 7 * J - H, ACCUEIL, "#dc-accomp"); await attendre(p3, 1500);
    const n7 = await nbCartes(p3);
    await visiteLe(p3, T0 - 2 * J + 7 * J + 5 * MIN, ACCUEIL, "#dc-accomp"); await p3.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(p3, 1500);
    const C7 = await carteVue(p3, "declic_calculateur"), V7 = verifCarte(C7, "declic_calculateur", false, k3, PHOTOS.fr);
    ok("… accueil 7 jours MOINS 1 heure après ce clic le plus récent : rien ; 7 jours PLUS 5 minutes après : la carte (textes et lien exacts)",
      n7.n === 0 && n7.poses === 0 && V7.struct && V7.textes && V7.lien, JSON.stringify(n7) + " · " + detail(C7, V7));
  });

  /* =================== E. « J'ai déjà choisi mon créneau » =================== */
  await bloc("E. case « J'ai déjà choisi mon créneau »", async () => {
    const k = 6, ID = PID(k);
    const C0 = { version: 1, jours: {}, cta: { clics: [] }, reserve: avant(J) };
    /* sur l'appareil, une invitation en attente d'un autre jour (Commence ici) */
    const mem = Object.assign(memVide(), { attente: [{ code: "formation_commence_ici", le: avant(J) }], jour: JOUR(-1) });
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)], ["challenge", C0, avant(J)], ["formation", FO()]])] });
    const { page } = await contexte(b, quiP(k), db, { memoire: { id: ID, valeur: mem } });
    await page.goto(URL0 + ACCUEIL); await pret(page, "#dc-accomp"); await attendre(page, 1500);
    const acc = { n: await nbCartes(page), pastille: await page.$eval("#dc-reserve-ok", e => e.textContent).catch(() => "") };
    await aller(page, "#/calculateur", 1800); await page.waitForSelector("#calc-ok", { state: "attached" }); await page.click("#calc-ok"); await attendre(page, 2000);
    const calc = await nbCartes(page);
    await aller(page, "#/mensurations", 1800); await page.fill("#e-poids", "70"); await page.click("#add"); await attendre(page, 2000);
    const pesee = await nbCartes(page);
    await aller(page, "#/formation", 1800); await page.waitForSelector('[data-coche="m1g"]'); await page.check('[data-coche="m1g"]'); await attendre(page, 2000);
    const mindset = await nbCartes(page), m1 = await memoire(page, ID);
    ok("case cochée en base (challenge.reserve) : accueil (pastille « Bilan réservé le … »), calcul enregistré, toute première pesée, 7e case du Mindset : aucune carte nulle part ; aucune lecture intake+challenge (déjà en cache depuis l'accueil : la décision se prend sans relire)",
      acc.n.n === 0 && /Bilan réservé le/.test(acc.pastille) && calc.n === 0 && pesee.n === 0 && mindset.n === 0 && mindset.poses === 0 && ecr(db, "calc_perso", ID).length === 1 && ecr(db, "mens", ID).length === 1
        && ((contenuDe(db, ID, "formation") || {}).coches || {}).m1g === true && lecturesInv(db).length === 0,
      JSON.stringify([acc, calc, pesee, mindset, lecturesInv(db)]) + " · " + resume(db));
    ok("… rien d'ajouté en attente ni compté (attente = l'ancienne seule, vues vides, jour inchangé)", !!m1 && egal(codesAttente(m1), ["formation_commence_ici"]) && egal(m1.vues, {}) && m1.jour === JOUR(-1), JSON.stringify(m1));
    await visite(page, 1, ACCUEIL, "#dc-accomp"); await attendre(page, 1500);
    const n2 = await nbCartes(page);
    ok("le lendemain, l'accueil : l'attente de l'appareil ne s'affiche pas (case cochée)", n2.n === 0 && n2.poses === 0, JSON.stringify([n2, await memoire(page, ID)]));
    /* la case cochée sur l'appareil (Decouverte.reserver) : ensuite plus rien, sans relire la base */
    const k2 = 7, ID2 = PID(k2);
    const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2, CHIFFRES)]])] });
    const { page: p2 } = await contexte(b, quiP(k2), db2);
    await p2.goto(URL0 + ACCUEIL); await pret(p2, "#dc-reserve-case"); await p2.check("#dc-reserve-case"); await attendre(p2, 2300);
    const mr = await memoire(p2, ID2);
    /* page rechargée sur le calculateur : plus rien en cache (ni intake ni challenge) ; seule la mémoire de l'appareil
       sait que la case est cochée — relire la base se verrait */
    await visite(p2, null, "#/calculateur", "#tdee"); await p2.waitForSelector("#calc-ok", { state: "attached" });
    const L0 = db2.lectures.length, enCache = await p2.evaluate(() => !!(Store.cache && Store.cache.challenge));   // doit être faux : sinon « sans relire » ne prouverait rien
    await p2.click("#calc-ok"); await attendre(p2, 2000);
    const n3 = await nbCartes(p2), m3 = await memoire(p2, ID2);
    ok("case cochée sur l'accueil : notée en base (challenge.reserve) et sur l'appareil (reserve) ; page rechargée (la clé challenge n'est plus en cache), calcul enregistré : aucune carte, rien en attente, mémoire inchangée, aucune lecture intake+challenge (la mémoire de l'appareil suffit)",
      typeof challengeDe(db2, ID2).reserve === "string" && !!mr && ISO.test(mr.reserve) && !enCache && ecr(db2, "calc_perso", ID2).length === 1 && n3.n === 0 && n3.poses === 0 && !!m3 && egal(m3.attente, []) && egal(m3, mr)
        && lecturesInv(db2, L0).length === 0, JSON.stringify([mr, enCache, n3, m3, lecturesInv(db2, L0)]) + " · " + resume(db2));
  });

  /* =================== F. « Commence ici » terminé =================== */
  await bloc("F. « Commence ici » terminé", async () => {
    const k = 8, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)], ["calc_perso", CP], ["mens", MENS_DEPART], ["formation", FO({ coches: {}, ouvert: "" })]])] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/formation"); await pret(page, "#fo-depart"); await attendre(page, 1500);
    const a0 = { n: await nbCartes(page), fini: await page.evaluate(() => document.getElementById("fo-depart").classList.contains("fo-depart-fini")), L: lecturesInv(db).length, w: saisies(db).length };
    await page.click('[data-depart="video"]');
    await page.waitForSelector("#invitation-formation_commence_ici", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const C = await carteVue(page, "formation_commence_ici"), V = verifCarte(C, "formation_commence_ici", false, k, PHOTOS.fr), pl = await placeVue(page, "formation_commence_ici", "fo_depart");
    const dep = await page.evaluate(() => { const d = document.getElementById("fo-depart"); return d ? { cls: d.className, t: d.textContent.replace(/\s+/g, " ").trim() } : null; });
    ok("#/formation, 2 actions sur 3 faites (calcul, pesée) : aucune carte, aucune lecture intake+challenge ni écriture à l'ouverture ; la vidéo de bienvenue lancée (3e action) : « Départ lancé ✓ », puis la carte juste APRÈS #fo-depart",
      a0.n.n === 0 && !a0.fini && a0.L === 0 && a0.w === 0 && !!dep && /fo-depart-fini/.test(dep.cls) && dep.t === "Départ lancé ✓" && pl.juste && !!(await page.$("#fo-presentation iframe")),
      JSON.stringify([a0, dep, pl]));
    const L = lecturesInv(db);
    ok("carte formation_commence_ici : structure, textes EXACTS (« Bien joué, ton départ est lancé. », « Ton objectif : « M'aimer sur les photos » », « Prochaine étape : ton plan d'action personnalisé, offert, en 15 min avec Lucas. »), lien formation_commence_ici, style ; une lecture intake+challenge ; en base : formation.depart.video seul (une écriture)",
      V.struct && V.textes && V.lien && V.style && L.length === 1 && lectureExacte(L[0], ID) && saisies(db).length === 1 && ecr(db, "formation", ID).length === 1 && ISO.test(((contenuDe(db, ID, "formation") || {}).depart || {}).video || ""),
      detail(C, V) + " · " + resume(db));
    /* anglais, thème clair : les 3 actions déjà faites → la carte à l'ouverture de la page */
    const k2 = 9, ID2 = PID(k2);
    const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2)], ["calc_perso", CP], ["mens", MENS_DEPART], ["formation", FO({ coches: {}, ouvert: "", depart: { video: avant(2 * H) } })]])] });
    const { page: p2 } = await contexte(b, quiP(k2), db2, { langue: "en", theme: "light" });
    await p2.goto(URL0 + "#/formation"); await pret(p2, "#fo-depart");
    await p2.waitForSelector("#invitation-formation_commence_ici", { timeout: 6000 }).catch(() => null); await attendre(p2, 1800);
    const C2 = await carteVue(p2, "formation_commence_ici"), V2 = verifCarte(C2, "formation_commence_ici", true, k2, PHOTOS.en), pl2 = await placeVue(p2, "formation_commence_ici", "fo_depart");
    const dep2 = await p2.evaluate(() => { const d = document.getElementById("fo-depart"); return d ? d.textContent.replace(/\s+/g, " ").trim() : null; }), m2 = await memoire(p2, ID2);
    ok("anglais, thème clair, les 3 actions déjà faites : à l'ouverture de #/formation, « You're off ✓ » puis la carte (« Nice work, you're off to a start. », « Your goal: “Loving how I look in photos” », « Next step: your personalized action plan, free, in 15 min with Lucas. », lien formation_commence_ici) ; notée vue sur l'appareil ; rien d'écrit en base",
      V2.struct && V2.textes && V2.lien && V2.style && pl2.juste && dep2 === "You're off ✓" && !!m2 && ISO.test(m2.vues.formation_commence_ici || "") && saisies(db2).length === 0,
      detail(C2, V2) + " · " + JSON.stringify([pl2, dep2, m2]) + " · " + resume(db2));
  });

  /* =================== G. Mindset (anglais, clair), et les deux façons de faire la première pesée =================== */
  await bloc("G. Mindset et première pesée", async () => {
    const k = 10, ID = PID(k);
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)], ["formation", FO()]])] });
    const { page } = await contexte(b, quiP(k, null), db, { langue: "en", theme: "light" });
    await page.goto(URL0 + "#/formation"); await pret(page, '[data-coche="m1g"]'); await attendre(page, 800);
    await page.check('[data-coche="m1g"]');
    await page.waitForSelector("#invitation-declic_mindset", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const C = await carteVue(page, "declic_mindset"), V = verifCarte(C, "declic_mindset", true, k, PHOTOS.en), pl = await placeVue(page, "declic_mindset", "m1");
    ok("anglais, thème clair, #/formation : la 7e case du module 01 Mindset (7/7) → la carte juste APRÈS la section du module (section.fo-mod) ; « Your why is clear. », « Your goal: “Loving how I look in photos” », « Now for the how… », lien declic_mindset, style",
      V.struct && V.textes && V.lien && V.style && pl.juste && /fo-mod/.test(pl.ancre || ""), detail(C, V) + " · " + JSON.stringify(pl));
    await page.evaluate(() => { const s = document.querySelector('#vue [data-mod="m1"]').closest("section"); s.__v68 = "avant"; document.getElementById("invitation-declic_mindset").__v68 = "carte"; });
    await page.check('[data-coche="p1a"]'); await attendre(page, 1500);
    const r = await page.evaluate(() => { const s = document.querySelector('#vue [data-mod="m1"]').closest("section"), c = document.getElementById("invitation-declic_mindset"); return { redessinee: s.__v68 !== "avant", meme: !!c && c.__v68 === "carte", apres: !!c && s.nextElementSibling === c, n: document.querySelectorAll(".invitation").length }; });
    ok("une autre case cochée (la page est redessinée) : la même carte reste juste après la section du module 01, seule", r.redessinee && r.meme && r.apres && r.n === 1, JSON.stringify(r));
    await page.click('[data-inv-tard="declic_mindset"]'); await attendre(page, 300);
    await page.check('[data-coche="p1b"]'); await attendre(page, 1500);
    const n1 = await nbCartes(page);
    await attendre(page, 1500);
    const pt = (((challengeDe(db, ID).cta || {}).plus_tard) || []).map(x => x.source);
    ok("« Later » : retirée, et une page redessinée ne la remet pas ; plus_tard noté en base (source declic_mindset)", n1.n === 0 && egal(pt, ["declic_mindset"]), JSON.stringify([n1, pt]));
    /* le même jour : « Poids de départ » → en attente ; le lendemain : carte en haut de l'accueil, avant « Your first step » */
    await aller(page, "#/mensurations", 1800); await page.click("#sante-oui"); await page.waitForSelector("#pstart:not([disabled])", { state: "attached" }); await attendre(page, 800);
    await page.click("details:has(#pstart) > summary"); await page.fill("#pstart", "68"); await page.press("#pstart", "Tab"); await attendre(page, 2000);
    const n2 = await nbCartes(page), m2 = await memoire(page, ID);
    await visite(page, 1, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const Cp = await carteVue(page, "declic_premiere_pesee"), Vp = verifCarte(Cp, "declic_premiere_pesee", true, k, PHOTOS.en), plp = await placeVue(page, "declic_premiere_pesee", "entete");
    ok("le même jour, « Poids de départ » : aucune carte, en attente ; le lendemain, l'accueil : la carte (« Your starting point is set. ») juste après l'en-tête et AVANT « Your first step » (#dc-etape : calcul pas encore fait)",
      n2.n === 0 && egal(codesAttente(m2), ["declic_premiere_pesee"]) && Vp.struct && Vp.textes && plp.juste && plp.apres === "section#dc-etape.dc-etape.panel" && plp.apresH2 === "Your first step",
      detail(Cp, Vp) + " · " + JSON.stringify([n2, m2, plp]));
    /* première pesée par « Enregistrer la semaine » : juste après #mens-saisie ; une 2e pesée : rien de plus */
    const k2 = 11, ID2 = PID(k2);
    const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2)]])] });
    const { page: p2 } = await contexte(b, quiP(k2), db2);
    await p2.goto(URL0 + "#/mensurations"); await pret(p2, "#add"); await attendre(p2, 600);
    await p2.fill("#e-poids", "70"); await p2.click("#add");
    await p2.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(p2, 1800);
    const C2 = await carteVue(p2, "declic_premiere_pesee"), V2 = verifCarte(C2, "declic_premiere_pesee", false, k2, PHOTOS.fr), pl2 = await placeVue(p2, "declic_premiere_pesee", "saisie");
    ok("français : toute première pesée par « Enregistrer la semaine » → la carte juste APRÈS #mens-saisie ; textes exacts (typographie française), lien declic_premiere_pesee, style, 390 px",
      V2.struct && V2.textes && V2.lien && V2.style && pl2.juste, detail(C2, V2) + " · " + JSON.stringify(pl2));
    const L2 = db2.lectures.length;
    await p2.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
    await p2.fill("#e-sem", "2"); await p2.fill("#e-poids", "69.5"); await p2.click("#add"); await attendre(p2, 2000);
    const n3 = await nbCartes(p2), m3 = await memoire(p2, ID2);
    ok("une 2e pesée (semaine 2) : enregistrée, toujours une seule carte, rien en attente, aucune lecture", ecr(db2, "mens", ID2).length === 2 && n3.n === 1 && n3.poses === 1 && !!m3 && egal(m3.attente, []) && lecturesInv(db2, L2).length === 0,
      JSON.stringify([n3, m3]) + " · " + resume(db2));
    /* première pesée par « Poids de départ » : juste après sa section */
    const k3 = 12;
    const db3 = base({ comptes: [compte(k3, [["intake", AVEC_CHOIX(k3)]])] });
    const { page: p3 } = await contexte(b, quiP(k3), db3);
    await p3.goto(URL0 + "#/mensurations"); await pret(p3, "#add"); await attendre(p3, 600);
    await p3.click("details:has(#pstart) > summary"); await p3.fill("#pstart", "75"); await p3.press("#pstart", "Tab");
    await p3.waitForSelector("#invitation-declic_premiere_pesee", { timeout: 6000 }).catch(() => null); await attendre(p3, 1800);
    const C3 = await carteVue(p3, "declic_premiere_pesee"), V3 = verifCarte(C3, "declic_premiere_pesee", false, k3, PHOTOS.fr), pl3 = await placeVue(p3, "declic_premiere_pesee", "depart");
    ok("toute première pesée par « Poids de départ » (#pstart) : la carte juste APRÈS la section qui contient le champ ; textes et lien exacts",
      V3.struct && V3.textes && V3.lien && pl3.juste && (contenuDe(db3, PID(k3), "mens") || {}).pstart === 75, detail(C3, V3) + " · " + JSON.stringify(pl3));
    /* pas une première pesée : un poids de départ déjà en base (aucune mesure) — « Enregistrer la semaine », puis un
       autre « Poids de départ » : rien (ni carte, ni attente, ni lecture) */
    {
      const k4 = 31, ID4 = PID(k4);
      const db4 = base({ comptes: [compte(k4, [["intake", AVEC_CHOIX(k4)], ["mens", MENS_DEPART]])] });
      const { page: p4 } = await contexte(b, quiP(k4), db4);
      await p4.goto(URL0 + "#/mensurations"); await pret(p4, "#add"); await attendre(p4, 600);
      await p4.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
      await p4.fill("#e-poids", "70"); await p4.click("#add"); await attendre(p4, 2000);
      const w1 = ecr(db4, "mens", ID4).length, mesures = ((contenuDe(db4, ID4, "mens") || {}).mesures || []).length;
      await p4.evaluate(() => { const d = document.querySelector("details:has(#pstart)"); if (d) d.open = true; });
      await p4.fill("#pstart", "71"); await p4.press("#pstart", "Tab"); await attendre(p4, 2000);
      const n4 = await nbCartes(p4), m4 = await memoire(p4, ID4);
      ok("poids de départ déjà en base (pas une première pesée) : « Enregistrer la semaine » (enregistrée), puis un autre « Poids de départ » (enregistré, 71) : aucune carte, rien en attente (aucune mémoire d'invitations), aucune lecture intake+challenge",
        w1 === 1 && mesures === 1 && ecr(db4, "mens", ID4).length === 2 && (contenuDe(db4, ID4, "mens") || {}).pstart === 71 && n4.n === 0 && n4.poses === 0 && m4 === null && lecturesInv(db4).length === 0,
        JSON.stringify([w1, mesures, n4, m4, lecturesInv(db4)]) + " · " + resume(db4));
    }
    /* le module Mindset déjà à 7/7 (avant la v62) : une autre case cochée ne le fait pas « passer de 6 à 7 » : rien */
    {
      const k5 = 32, ID5 = PID(k5);
      const db5 = base({ comptes: [compte(k5, [["intake", AVEC_CHOIX(k5)], ["formation", FO({ coches: Object.assign({}, SIX, { m1g: true }) })]])] });
      const { page: p5 } = await contexte(b, quiP(k5, null), db5);
      await p5.goto(URL0 + "#/formation"); await pret(p5, '[data-coche="p1a"]'); await attendre(p5, 800);
      const n0 = await nbCartes(p5);
      await p5.check('[data-coche="p1a"]'); await attendre(p5, 2000);
      const n5 = await nbCartes(p5), m5 = await memoire(p5, ID5), co = (contenuDe(db5, ID5, "formation") || {}).coches || {};
      ok("module 01 Mindset déjà à 7/7 à l'ouverture de #/formation : aucune carte ; une autre case cochée (p1a, enregistrée) : toujours aucune carte, rien en attente (aucune mémoire d'invitations), aucune lecture intake+challenge",
        n0.n === 0 && n0.poses === 0 && ecr(db5, "formation", ID5).length === 1 && co.p1a === true && co.m1g === true && n5.n === 0 && n5.poses === 0 && m5 === null && lecturesInv(db5).length === 0,
        JSON.stringify([n0, n5, m5, co, lecturesInv(db5)]) + " · " + resume(db5));
    }
  });

  /* =================== H. projection absente, piégée, longue =================== */
  await bloc("H. projection", async () => {
    const carteCalc = async (k, intake) => {
      const db = base({ comptes: [compte(k, [["intake", intake]])] });
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 600);
      await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1200);
      return { page, C: await carteVue(page, "declic_calculateur") };
    };
    /* ancien prospect : ni projection, ni choix, ni précision */
    const ANCIEN = { probleme: "Perdre du gras", obstacle: "Le temps", objectif: "Perte de poids / sèche", court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: "p13@exemple.fr", bilan_propose: { choix: "plus_tard", le: avant(2 * J) } };
    const a = await carteCalc(13, Object.assign({}, ANCIEN, CHIFFRES)), Va = verifCarte(a.C, "declic_calculateur", false, 13, null);
    ok("projection absente : pas de ligne « Ton objectif » (h2, texte, boutons seulement), jamais « undefined » ni « null » ; le reste exact",
      Va.struct && Va.textes && !!a.C && a.C.objEnfants === -1 && !/Ton objectif|undefined|null/.test(a.C.tout), detail(a.C, Va));
    const PIEGE = "<b>gras</b> <img src=x onerror=\"window.__xssH=true\">";
    const p = await carteCalc(14, AVEC_CHOIX(14, Object.assign({ projection_precision: PIEGE, projection: PIEGE }, CHIFFRES))), Vp = verifCarte(p.C, "declic_calculateur", false, 14, PIEGE);
    const xss = await p.page.evaluate(() => ({ x: window.__xssH, img: document.querySelectorAll("#vue img[src='x']").length }));
    ok("projection piégée (« <b>gras</b> <img src=x onerror=…> ») : affichée en texte brut dans « Ton objectif : « … » » (exact), aucun élément créé, rien d'exécuté",
      Vp.struct && Vp.textes && !!p.C && p.C.objEnfants === 0 && p.C.elements === 0 && xss.x === undefined && xss.img === 0, detail(p.C, Vp) + " · " + JSON.stringify(xss));
    /* 200 caractères : coupée proprement à 140 (Decouverte.extrait : dernier mot entier, ponctuation finale retirée, « … ») */
    const LONG = Array.from({ length: 40 }, (_, i) => "mot" + String.fromCharCode(97 + (i % 26))).join(" ") + ".";
    const extrait = (v, n) => { const a = Array.from(String(v).replace(/\s+/g, " ").trim()); if (a.length <= n) return a.join(""); let s = a.slice(0, n).join(""); const i = s.lastIndexOf(" "); if (i > s.length * 0.6) s = s.slice(0, i); return s.replace(/[\s,;:.!?…'’-]+$/, "") + "…"; };
    const l = await carteCalc(15, AVEC_CHOIX(15, Object.assign({ projection_precision: LONG, projection: LONG }, CHIFFRES))), Vl = verifCarte(l.C, "declic_calculateur", false, 15, extrait(LONG, 140));
    /* mesurée sur ce qui est AFFICHÉ (entre les guillemets de « Ton objectif ») : 140 caractères au plus + « … », début de
       LONG coupé entre deux mots (le caractère suivant dans LONG est une espace), pas raccourcie au-delà du dernier mot */
    const aff = (/^Ton objectif\s*:\s*«\s*(.*?)\s*»$/.exec((l.C && l.C.txt && l.C.txt.obj) || "") || [])[1];
    const corps = typeof aff === "string" && aff.endsWith("…") ? aff.slice(0, -1) : null;
    ok("projection de " + LONG.length + " caractères : affichée coupée proprement (140 caractères au plus puis « … », début exact de la réponse, coupure entre deux mots), le reste de la carte exact",
      LONG.length > 140 && Vl.struct && Vl.textes && corps !== null && Array.from(aff).length <= 141 && Array.from(corps).length <= 140 && Array.from(corps).length > 84 && LONG.startsWith(corps) && LONG.charAt(corps.length) === " ",
      JSON.stringify(aff) + " · " + detail(l.C, Vl));
  });

  /* =================== I. robustesse =================== */
  await bloc("I. robustesse", async () => {
    /* lecture groupée ratée */
    {
      const k = 16, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] }); db.koIn = ["challenge"];
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      await page.click("#calc-ok"); await attendre(page, 2500);
      const n = await nbCartes(page), m = await memoire(page, ID), L = lecturesInv(db);
      ok("lecture groupée intake+challenge ratée (500) au déclencheur : aucune carte (jamais posée), rien de compté (vues vides, jour vide), l'invitation en attente",
        n.n === 0 && n.poses === 0 && L.length === 1 && !!m && egal(m.vues, {}) && m.jour === "" && egal(codesAttente(m), ["declic_calculateur"]), JSON.stringify([n, m, L]));
      db.koIn = null;
      await visite(page, 1, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
      const C = await carteVue(page, "declic_calculateur"), V = verifCarte(C, "declic_calculateur", false, k, PHOTOS.fr), pl = await placeVue(page, "declic_calculateur", "entete");
      ok("… le lendemain (base lisible) : la carte en haut de l'accueil, juste après l'en-tête et AVANT « Ta prochaine étape » (#dc-etape : pesée pas encore faite)",
        V.struct && V.textes && V.lien && pl.juste && pl.apres === "section#dc-etape.dc-etape.panel" && pl.apresH2 === "Ta prochaine étape", detail(C, V) + " · " + JSON.stringify(pl));
    }
    /* page quittée tout de suite après l'apparition de la carte */
    {
      const k = 17, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null);
      await page.evaluate(() => { location.hash = "#/profil"; });
      await attendre(page, 2800);
      const n = await nbCartes(page), m = await memoire(page, ID);
      await visite(page, 1, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1500);
      const pl = await placeVue(page, "declic_calculateur", "entete");
      ok("carte montrée puis page quittée aussitôt (moins de 1,5 s) : pas comptée vue (vues vides, jour remis comme avant), en attente ; le lendemain : la carte en haut de l'accueil",
        n.poses === 1 && n.n === 0 && !!m && egal(m.vues, {}) && m.jour === "" && egal(codesAttente(m), ["declic_calculateur"]) && pl.juste, JSON.stringify([n, m, pl]));
    }
    /* page quittée pendant la lecture : l'ancre n'est plus là */
    {
      const k = 18, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] }); db.retardIn = 2500;
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      await page.click("#calc-ok"); await attendre(page, 300);
      await page.evaluate(() => { location.hash = "#/profil"; });
      await attendre(page, 4000);
      const n = await nbCartes(page), m = await memoire(page, ID);
      ok("page quittée pendant la lecture (réponse retardée de 2,5 s) : la carte n'est jamais posée ailleurs, pas comptée vue, en attente",
        lecturesInv(db).length === 1 && n.poses === 0 && !!m && egal(m.vues, {}) && m.jour === "" && egal(codesAttente(m), ["declic_calculateur"]), JSON.stringify([n, m]));
    }
    /* mémoire de l'appareil illisible (texte qui n'est pas du JSON) ou piégée (codes inconnus ou réservés, types faux) : on
       repart d'une mémoire vide, la carte s'affiche, la mémoire est réécrite d'aplomb */
    {
      const vus = [];
      for (const [k, valeur] of [[20, "{pas du json"], [21, '{"vues":{"__proto__":"x","autre":"y","declic_calculateur":5},"fermees":[1],"attente":[{"code":"inconnu","le":"x"},{"code":"constructor","le":"2026-01-01T00:00:00.000Z"},"declic_calculateur"],"jour":42,"clic":{"a":1},"reserve":["x"]}']]) {
        const ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
        const { page } = await contexte(b, quiP(k), db, { memoire: { id: ID, valeur } });
        await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
        await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
        const C = await carteVue(page, "declic_calculateur"), V = verifCarte(C, "declic_calculateur", false, k, PHOTOS.fr), m = await memoire(page, ID);
        vus.push({ k, ok: V.struct && V.textes && V.lien, m });
      }
      ok("mémoire de l'appareil illisible (pas du JSON) ou piégée (codes inconnus ou réservés, types faux) : on repart d'une mémoire vide, la carte du calculateur s'affiche (exacte), la mémoire est réécrite d'aplomb (vues declic_calculateur, attente vide, jour du jour)",
        vus.length === 2 && vus.every(v => v.ok && !!v.m && typeof v.m === "object" && egal(Object.keys(v.m.vues), ["declic_calculateur"]) && egal(v.m.fermees, {}) && egal(v.m.attente, []) && v.m.jour === JOUR(0) && v.m.clic === "" && v.m.reserve === ""), JSON.stringify(vus));
    }
    /* accueil : la clé challenge illisible (500) → rien, même avec une invitation en attente d'un autre jour ; lisible → la carte */
    {
      const k = 22, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)]])] }); db.lectureKo = ["challenge"];
      const mem = Object.assign(memVide(), { attente: [{ code: "declic_mindset", le: avant(J) }], jour: JOUR(-1) });
      const { page } = await contexte(b, quiP(k), db, { memoire: { id: ID, valeur: mem } });
      await page.goto(URL0 + ACCUEIL); await pret(page, "#vue .masthead"); await attendre(page, 1500);
      const n1 = await nbCartes(page), m1 = await memoire(page, ID);
      db.lectureKo = null;
      await visite(page, null, ACCUEIL, "#dc-accomp"); await page.waitForSelector("#invitation-declic_mindset", { timeout: 6000 }).catch(() => null); await attendre(page, 1500);
      const pl = await placeVue(page, "declic_mindset", "entete");
      ok("accueil avec la clé challenge illisible (500) et une invitation en attente d'un autre jour : aucune carte, rien de compté (attente gardée) ; la clé lisible de nouveau (rechargée) : la carte en haut",
        n1.n === 0 && n1.poses === 0 && !!m1 && egal(codesAttente(m1), ["declic_mindset"]) && m1.jour === JOUR(-1) && pl.juste, JSON.stringify([n1, m1, pl]));
    }
    /* enregistrement refusé (lecture de mens ratée : Store refuse d'écrire) : ni « Enregistrer la semaine » ni « Poids de départ »
       ne déclenchent quoi que ce soit ; vidéo de bienvenue dont l'écriture est refusée (lecture de formation ratée) : rien */
    {
      const k = 23, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)], ["calc_perso", CP]])] }); db.lectureKo = ["mens"];
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/mensurations"); await pret(page, "#add"); await attendre(page, 600);
      await page.fill("#e-poids", "70"); await page.click("#add"); await attendre(page, 1500);
      await page.click("details:has(#pstart) > summary"); await page.fill("#pstart", "72"); await page.press("#pstart", "Tab"); await attendre(page, 2000);
      const n1 = await nbCartes(page), m1 = await memoire(page, ID);
      ok("mens illisible (500) : « Enregistrer la semaine » puis « Poids de départ » refusés (rien écrit en base) : aucune carte, rien en attente, aucune lecture intake+challenge",
        n1.poses === 0 && ecr(db, "mens", ID).length === 0 && (m1 === null || egal(m1.attente, [])) && lecturesInv(db).length === 0, JSON.stringify([n1, m1]) + " · " + resume(db));
      const k2 = 24, ID2 = PID(k2);
      const db2 = base({ comptes: [compte(k2, [["intake", AVEC_CHOIX(k2)], ["calc_perso", CP], ["mens", MENS_DEPART], ["formation", FO({ coches: {}, ouvert: "" })]])] }); db2.lectureKo = ["formation"];
      const { page: p2 } = await contexte(b, quiP(k2), db2);
      await p2.goto(URL0 + "#/formation"); await pret(p2, "#fo-depart"); await attendre(p2, 800);
      await p2.click('[data-depart="video"]'); await attendre(p2, 2200);
      const n2 = await nbCartes(p2), m2 = await memoire(p2, ID2), fini = await p2.evaluate(() => { const d = document.getElementById("fo-depart"); return !!d && d.classList.contains("fo-depart-fini"); });
      ok("formation illisible (500) : la vidéo de bienvenue lancée, son écriture refusée : l'action n'est pas cochée (pas de « Départ lancé »), aucune carte, rien en attente, rien écrit",
        !fini && n2.poses === 0 && ecr(db2, "formation", ID2).length === 0 && (m2 === null || egal(m2.attente, [])) && lecturesInv(db2).length === 0, JSON.stringify([fini, n2, m2]) + " · " + resume(db2));
      /* calc_perso illisible (500) : « Enregistrer mes chiffres » est refusé (rien n'est écrit) : rien n'est déclenché */
      const k3 = 33, ID3 = PID(k3);
      const db3 = base({ comptes: [compte(k3, [["intake", AVEC_CHOIX(k3, CHIFFRES)]])] }); db3.lectureKo = ["calc_perso"];
      const { page: p3 } = await contexte(b, quiP(k3), db3);
      await p3.goto(URL0 + "#/calculateur"); await pret(p3, "#tdee"); await attendre(p3, 800);
      const okVisible = await p3.$eval("#calc-ok", e => !e.hidden).catch(() => false);
      if (okVisible) await p3.click("#calc-ok");
      await attendre(p3, 400); const msg3 = await p3.$eval("#calc-msg", e => e.textContent).catch(() => ""); await attendre(p3, 1800);
      const n3 = await nbCartes(p3), m3 = await memoire(p3, ID3);
      ok("calc_perso illisible (500) : « Enregistrer mes chiffres » touché, écriture refusée (rien écrit, pas de « Tes chiffres sont enregistrés. ») : aucune carte, rien en attente (aucune mémoire d'invitations), aucune lecture intake+challenge",
        okVisible && ecr(db3, "calc_perso", ID3).length === 0 && !/enregistrés/.test(msg3) && n3.poses === 0 && m3 === null && lecturesInv(db3).length === 0, JSON.stringify([okVisible, msg3, n3, m3]) + " · " + resume(db3));
    }
    /* déjà en attente (mis en attente hier, rien montré depuis) : le même déclencheur aujourd'hui ne fait rien, AVANT toute
       lecture (ni carte, ni lecture, mémoire inchangée) */
    {
      const k = 25, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
      const mem = Object.assign(memVide(), { attente: [{ code: "declic_calculateur", le: avant(J) }], jour: JOUR(-1) });
      const { page } = await contexte(b, quiP(k), db, { memoire: { id: ID, valeur: mem } });
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      const enCache = await page.evaluate(() => !!(Store.cache && Store.cache.challenge));   // doit être faux : décider sans la mémoire demanderait une lecture
      await page.click("#calc-ok"); await attendre(page, 2200);
      const n = await nbCartes(page), m = await memoire(page, ID);
      ok("calcul mis en attente hier, calcul réenregistré aujourd'hui (calc_perso écrit, clé challenge pas en cache) : aucune carte au calculateur, aucune lecture intake+challenge, mémoire de l'appareil inchangée (attente, jour)",
        !enCache && ecr(db, "calc_perso", ID).length === 1 && n.n === 0 && n.poses === 0 && lecturesInv(db).length === 0 && egal(m, mem), JSON.stringify([enCache, n, m, lecturesInv(db)]) + " · " + resume(db));
    }
    /* le stockage de l'appareil bloqué pour la mémoire des invitations */
    {
      const k = 19, ID = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, CHIFFRES)]])] });
      const { page } = await contexte(b, quiP(k), db, { bloque: true });
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      await page.click("#calc-ok"); await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
      for (const [ch, v] of [["#poids", "61"], ["#taille", "166"], ["#poids", "62"]]) { await page.fill(ch, v); await attendre(page, 1000); }
      const n1 = await nbCartes(page);
      await aller(page, "#/profil", 1200); await aller(page, "#/calculateur", 1800); await page.waitForSelector("#poids");
      await page.fill("#poids", "63"); await attendre(page, 1800);
      const n2 = await nbCartes(page), cles = await page.evaluate(() => { const l = []; for (let i = 0; i < localStorage.length; i++) l.push(localStorage.key(i)); return l.filter(x => /invitation/.test(x)); });
      ok("stockage de l'appareil bloqué pour « mhx_invitations| » : une seule carte au calculateur (4 calculs enregistrés, puis page rouverte et un 5e : aucune autre), une seule lecture intake+challenge, rien d'écrit sur l'appareil, rien ne casse",
        n1.n === 1 && n1.poses === 1 && n2.n === 0 && n2.poses === 1 && lecturesInv(db).length === 1 && ecr(db, "calc_perso", ID).length === 5 && !cles.length, JSON.stringify([n1, n2, cles, lecturesInv(db).length]) + " · " + resume(db));
    }
  });

  /* =================== J. client Thomas, compte client de test, coach =================== */
  await bloc("J. client, compte de test, coach", async () => {
    const ajouterSix = (db, uid) => { const f = db.donnees.find(d => d.user_id === uid && d.outil === "formation"); if (f) f.contenu = Object.assign({}, f.contenu, { coches: Object.assign({}, f.contenu.coches || {}, SIX), ouvert: "m1" }); else db.donnees.push({ user_id: uid, outil: "formation", contenu: FO(), maj_le: avant(J) }); };
    /* client Thomas : calcul enregistré, une pesée, la 7e case du Mindset */
    {
      const db = base(); ajouterSix(db, F.IDS.c1);
      const { page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
      const okCalc = await page.$eval("#calc-ok", e => !e.hidden).catch(() => false);
      if (okCalc) await page.click("#calc-ok"); else await page.fill("#poids", "82");
      await attendre(page, 1800);
      await aller(page, "#/mensurations", 1800); await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
      await page.fill("#e-sem", "40"); await page.fill("#e-poids", "82"); await page.click("#add"); await attendre(page, 1800);
      await aller(page, "#/formation", 1800); await page.check('[data-coche="m1g"]'); await attendre(page, 1800);
      const n = await nbCartes(page), cles = await clesMemoire(page);
      ok("client Thomas : calcul enregistré, une pesée, 7e case du Mindset : jamais de carte, aucune lecture in.(intake,challenge), aucune mémoire d'invitations sur l'appareil (ses écritures habituelles faites)",
        n.n === 0 && n.poses === 0 && lecturesInv(db).length === 0 && !cles.length && ecr(db, "calc_perso", F.IDS.c1).length >= 1 && ecr(db, "mens", F.IDS.c1).length === 1 && ecr(db, "formation", F.IDS.c1).length === 1,
        JSON.stringify([okCalc, n, cles, lecturesInv(db)]) + " · " + resume(db));
    }
    /* le compte client de test (sans mesures) : toute première pesée, calcul saisi */
    {
      const TID = TEST_ID || PID(90);
      const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);
      const db = base({ comptes: [{ id: TID, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", donnees: [["intake", INTAKE_THOMAS], ["prefs", { langue: "fr" }], ["formation", FO()]] }] });
      const { page } = await contexte(b, qui(TID, "test@exemple.fr"), db);
      await page.goto(URL0 + "#/mensurations"); await pret(page, "#add"); await attendre(page, 600);
      await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
      await page.fill("#e-poids", "80"); await page.click("#add"); await attendre(page, 1800);
      await aller(page, "#/calculateur", 1800);
      const okCalc = await page.$eval("#calc-ok", e => !e.hidden).catch(() => false);
      if (okCalc) await page.click("#calc-ok"); else await page.fill("#poids", "79");
      await attendre(page, 1800);
      await aller(page, "#/formation", 1800); await page.check('[data-coche="m1g"]'); await attendre(page, 1800);
      const n = await nbCartes(page), cles = await clesMemoire(page);
      ok("compte client de test (" + (TEST_ID ? "identifiant lu dans CONFIG.nouveautes.comptes_test" : "IDENTIFIANT INTROUVABLE dans le fichier servi") + ") : toute première pesée, calcul enregistré, 7e case du Mindset : jamais de carte, aucune lecture in.(intake,challenge), aucune mémoire d'invitations",
        !!TEST_ID && n.n === 0 && n.poses === 0 && lecturesInv(db).length === 0 && !cles.length && ecr(db, "mens", TID).length === 1 && ecr(db, "calc_perso", TID).length >= 1 && ecr(db, "formation", TID).length === 1,
        JSON.stringify([TEST_ID, okCalc, n, cles]) + " · " + resume(db));
    }
    /* le coach dans la fiche d'un prospect dont les 3 actions sont faites et le Mindset à 6/7 */
    {
      const k = 30, IDP = PID(k);
      const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)], ["calc_perso", CP], ["mens", MENS_DEPART], ["formation", FO({ depart: { video: avant(2 * H) } })]])] });
      const { page } = await contexte(b, COACH, db, { viewport: ORDI });
      await page.goto(URL0 + "#/clients"); await pret(page, `[data-ouvrir="${IDP}"]`);
      await page.click(`[data-ouvrir="${IDP}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
      await aller(page, "#/formation", 2000);
      const coche = !!(await page.$('[data-coche="m1g"]'));
      /* la case est vraiment cochée par le coach (échec de page.check noté, pas avalé) et l'est encore à l'écran ensuite */
      let erreurCoche = "absente", cochee = false;
      /* pour le détail d'un échec : la case est-elle visible, active, et qu'y a-t-il sous son centre */
      const diag = await page.evaluate(() => { const c = document.querySelector('[data-coche="m1g"]'); if (!c) return null; const r = c.getBoundingClientRect(), s = getComputedStyle(c), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y);
        return { hash: location.hash, disabled: c.disabled, checked: c.checked, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], display: s.display, visibility: s.visibility, opacity: s.opacity, pointer: s.pointerEvents,
          dessus: e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : "") : null, fermes: [...document.querySelectorAll("details:not([open])")].filter(d => d.contains(c)).length, cache: !!c.closest("[hidden]") }; });
      /* la fiche consultée est en lecture seule : la case ne réagit pas à la souris (pointer-events: none) ; l'événement
         « change » est donc envoyé à la page (le vrai gestionnaire de la page tourne : la case est redessinée cochée) */
      if (coche) { erreurCoche = await page.evaluate(() => { const c = document.querySelector('[data-coche="m1g"]'); if (!c) return "absente"; c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); return ""; }).catch(e => String((e && e.message) || e).split("\n")[0]); await attendre(page, 1500); cochee = await page.isChecked('[data-coche="m1g"]').catch(() => false); }
      await aller(page, "#/calculateur", 2000); await aller(page, "#/mensurations", 2000); await aller(page, "#/accueil", 2000);
      const n = await nbCartes(page), cles = await clesMemoire(page), consulte = await page.evaluate(() => Store.idConsulte);
      ok("coach dans la fiche d'un prospect (« Commence ici » fait ; 7e case du Mindset : fiche en lecture seule, la case ne se coche pas à la souris, l'événement « change » est envoyé à la page → case redessinée cochée, rien enregistré) puis calculateur, mensurations et accueil de la fiche ouverts : jamais de carte, aucune lecture in.(intake,challenge), aucune mémoire d'invitations, rien écrit chez le prospect",
        consulte === IDP && coche && erreurCoche === "" && cochee && n.n === 0 && n.poses === 0 && lecturesInv(db).length === 0 && !cles.length && saisies(db).length === 0,
        JSON.stringify([consulte, coche, erreurCoche, cochee, diag, n, cles, lecturesInv(db)]) + " · " + resume(db));
    }
  });

  /* =================== K. la page « Ton plan d'action » ne compte pas =================== */
  await bloc("K. page du plan d'action puis calculateur", async () => {
    const k = 34, ID = PID(k);
    const db = base({ comptes: [compte(k)] });   // nouveau prospect : ni questionnaire, ni challenge
    const { page } = await contexte(b, quiP(k), db);
    /* les 3 questions, en 1 tap chacune, puis « Voir… » : la page « Ton plan d'action » */
    await page.goto(URL0 + ACCUEIL); await pret(page, "#dc-voir");
    await page.click('label.dc-opt:has(input[name="q-probleme"][value="Perdre du gras"])');
    await page.click('#q-obstacle label.dc-opt:has(input[value="temps"])');
    await page.click('label.dc-opt:has(input[name="q-projection"][value="photos"])');
    await attendre(page, 600);
    await page.click("#dc-voir"); await page.waitForSelector("#dc-bilan", { timeout: 6000 }).catch(() => null); await attendre(page, 1200);
    const plan = { bilan: !!(await page.$("#dc-bilan")), m: await memoire(page, ID), cles: await clesMemoire(page), I: clone(contenuDe(db, ID, "intake")) || {} };
    /* « Plus tard, je découvre mon espace » : noté (bilan_propose + cta.plus_tard apres_questionnaire), puis l'accueil */
    await page.click("#dc-bilan-plus-tard"); await page.waitForSelector("#dc-accomp", { timeout: 6000 }).catch(() => null); await attendre(page, 2000);
    const I = contenuDe(db, ID, "intake") || {}, pt = ((challengeDe(db, ID).cta || {}).plus_tard) || [], mA = await memoire(page, ID), kA = await clesMemoire(page);
    ok("nouveau prospect : les 3 questions validées → la page « Ton plan d'action » ; « Plus tard » : bilan_propose = plus_tard, challenge.cta.plus_tard = [{ source apres_questionnaire }], puis l'accueil ; aucune mémoire d'invitations sur l'appareil (la page ne compte pas comme l'invitation du jour)",
      plan.bilan && typeof plan.I.court_le === "string" && plan.m === null && !plan.cles.length && !!(await page.$("#dc-accomp")) && (I.bilan_propose || {}).choix === "plus_tard"
        && pt.length === 1 && pt[0].source === "apres_questionnaire" && mA === null && !kA.length, JSON.stringify([plan, I.bilan_propose, pt, mA, kA]) + " · " + resume(db));
    /* le même jour, le calculateur (sans rechargement : intake et challenge sont en cache depuis l'accueil) */
    await aller(page, "#/calculateur", 1800); await page.waitForSelector("#tdee", { timeout: 6000 });
    const L0 = db.lectures.length;
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3");
    await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1800);
    const C = await carteVue(page, "declic_calculateur"), V = verifCarte(C, "declic_calculateur", false, k, PHOTOS.fr), pl = await placeVue(page, "declic_calculateur", "macros"), m = await memoire(page, ID);
    ok("le même jour, calcul enregistré : la carte declic_calculateur s'affiche (juste après les macros, textes et lien exacts, « Ton objectif : « M'aimer sur les photos » ») — la page du plan d'action ne comptait pas ; comptée comme l'invitation du jour (vues declic_calculateur, jour « " + JOUR(0) + " »)",
      ecr(db, "calc_perso", ID).length === 1 && V.struct && V.textes && V.lien && pl.juste && !!m && egal(Object.keys(m.vues), ["declic_calculateur"]) && m.jour === JOUR(0) && egal(m.attente, []),
      detail(C, V) + " · " + JSON.stringify([pl, m]) + " · " + resume(db));
    ok("… et sans AUCUNE lecture intake+challenge (ni au déclencheur, ni de tout le parcours) : l'intake et la clé challenge sont pris dans le cache de l'accueil",
      lecturesInv(db, L0).length === 0 && lecturesInv(db).length === 0, JSON.stringify(lecturesInv(db)));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    /* Z relit ce que les autres blocs ont appelé : lancé seul, il n'aurait rien vérifié */
    const avantZ = blocsLances.filter(x => !x.startsWith("Z."));
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase, le faux Calendly (nouvelle adresse seulement), les polices et les vignettes des vidéos (bloquées) ; le lecteur youtube-nocookie simulé ; relu après les autres blocs (lancé seul : échec, rien à vérifier)",
      avantZ.length > 0 && autres.length === 0 && CAL_RECUS.every(u => u.startsWith(CAL + "?")), "blocs " + JSON.stringify(avantZ) + " · " + JSON.stringify(autres) + " · " + JSON.stringify(CAL_RECUS.filter(u => !u.startsWith(CAL + "?"))));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
