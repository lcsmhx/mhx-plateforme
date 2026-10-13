/* verif84 — v79 : le JOURNAL ALIMENTAIRE (#/journal-alimentaire, outil « journal-alimentaire », clé journal_alimentaire), de bout
   en bout dans un vrai navigateur, avec des comptes fictifs, sur téléphone (390 px et 320 px), en français et en anglais.
   Format rangé : { v: 1, a: [[id, kcal, prot, gluc, lip, nom]], j: { "AAAA-MM-JJ": [[repas 0-3, n° dans a (-1 = ajout rapide),
   grammes | kcal]] } } ; repas : 0 Petit-déjeuner, 1 Déjeuner, 2 Dîner, 3 Collations.
   A. client compte de test (identifiant lu dans CONFIG.nouveautes.comptes_test du fichier servi), 390 px : l'ouverture lit le
      journal et n'écrit rien ; « Il te reste 2 240 kcal » (objectif de sa diète, repas.cible) ; panneau d'ajout (curseur dans la
      recherche, « Récents » absent tant que rien n'est noté, puis « Les plus courants ») ; « poulet » → « Blanc de poulet grillé »
      dans les 3 premiers ; portion (une pastille pressée, kcal attendues, « + » double les grammes) ; « Ajouter » → UNE écriture
      (POST upsert, 700 ms d'attente) de la seule clé journal_alimentaire, contenu exact ; totaux ; ligne éclairée ; « Récents » ;
   B. modifier les grammes d'une ligne, la supprimer (écriture sans elle), « Annuler » (elle revient, écriture) ;
   C. menu ⋯ : « Copier depuis hier » (lignes ajoutées, « Annuler » les retire ; désactivé sans rien la veille), ajout rapide 350 kcal ;
   D. jours : ‹ montre hier, › désactivé aujourd'hui, réactivé hier ; rien d'écrit ;
   E. prospect SANS accord santé (interrupteur sur « tous ») : la carte de l'accord (écran journal-alimentaire), rien lu (ni le
      journal, ni /rest/v1/aliments), champs inactifs, écriture forcée refusée, textes de l'accord (journal alimentaire), puis
      « J'accepte » (PUT exact) → la page se charge et on peut ajouter ;
   F. prospect AVEC accord (« tous ») : la carte « Mon journal alimentaire » en premier sur l'accueil (avant l'étape), son objectif
      calculé, bouton en contour (aucun bouton doré de plus), le lien ouvre la page et le panneau ;
   G. interrupteur « test » (servi par défaut) : Thomas (hors comptes de test) ne voit ni l'onglet, ni la carte, ni la page ; le
      compte de test les voit ; le coach dans la fiche de Thomas : ni lien ni panneau du journal ;
   H. coach (« tous ») : fiche de Thomas (#fiche-ja, résumé sur 7 jours), sa page en lecture seule (navigation des jours, résumé
      mis à jour, zéro écriture, écriture forcée refusée) ; fiche d'un prospect : objectif de son calculateur (sa diète ignorée) ;
   I. anglais 390 px (page, panneau, portion, aucun mot français), « chicken » ; largeur à 320 et 390 px (FR et EN) ; zones de
      toucher d'au moins 44 px ;
   J. traductions : le bloc « v79 » de js/i18n.js chargé, chaque texte de js/outilJournalAlimentaire.js traduit ;
   K. données piégées (nom avec balise, lignes et dates invalides, aliments illisibles) : rien d'injecté, aucune erreur, aucune
      écriture, client et coach ;
   L. plancher du calculateur (1 200 kcal pour une femme, rien pour un homme normal), objectif du coach jamais relevé ;
   M. Mes clients : la lecture groupée ne télécharge pas les journaux, une lecture légère de leur date, qui compte comme saisie ;
   N. taille : un an d'usage soutenu (20 lignes par jour, 300 aliments) sous le plafond prospect de 256 Ko (format de Postgres) ;
   P. recherche (les 13 essais du matériel, sur le vrai catalogue) ;
   Q. corrections de la relecture : recherche « thé », « p », « la » (liste d'accueil), « zzqx » (message, bouton d'ajout rapide
      caché sinon, « ‹ Retour » garde la recherche) ; « Annuler » puis un panneau (le message disparaît, la bonne ligne est
      modifiée) ; deux appareils (date relue au retour sur l'app et à l'ouverture d'un panneau : page rechargée avec un message,
      jamais une écriture qui écrase la base ; contre-épreuve) ; croix du panneau ; minuit (la page suit « Aujourd'hui », pas un
      autre jour affiché) ; 0,2 g et 0,4 kcal refusés ; prospect sans accord : rien sous la carte ; tailles des boutons ;
   Z. aucun appel vers l'extérieur, aucune erreur de console ni JS, aucun dialogue natif.
   Infrastructure reprise de verif71 (faux Supabase avec les métadonnées du compte, routage par NOM D'HÔTE, règles de la base,
   chaque lecture et écriture notée) et de verif60 (catalogue complet, anglais). Horloge : midi du jour du lancement (T0), qui
   tourne. L'interrupteur journal_alimentaire est servi sur « test » (fichiers.js) ; « tous » le temps d'un bloc (MODE, retouche
   du fichier servi, jamais du disque). Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif84.js ../index.html
           VERIF84_PORT=10001 node verif84.js ../index.html    (autre port, si 10000 est pris)
           VERIF84_BLOCS="A.,P." node verif84.js …              (seulement les blocs dont le nom commence ainsi)
           VERIF84_CAPTURES=<dossier> node verif84.js …         (captures PNG à 390 px, FR et EN : pas des vérifications) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path"); const vm = require("vm");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const RACINE = path.dirname(HTML);
const PORT = +process.env.VERIF84_PORT || 10000;
const BLOCS = (process.env.VERIF84_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF84_CAPTURES ? path.resolve(process.env.VERIF84_CAPTURES) : "";
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 640 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ; l'interrupteur journal_alimentaire sur « tous » le temps
   d'un bloc (MODE), sinon « test » comme le reste du banc (fichiers.js) ---------- */
const { servirFichier, source, forcerNouveautes } = require("./fichiers");
let MODE = "test";
const retouche = t => MODE === "tous" ? forcerNouveautes(t, { journal_alimentaire: "tous" }) : t;
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1500)));
const info = t => res.push("  · " + String(t).replace(/[✓✗]/g, "·"));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 200)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); MODE = "test"; }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const isoJ = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const jour = n => { const d = new Date(T0); d.setDate(d.getDate() - n); return isoJ(d); };
const AUJ = jour(0), HIER = jour(1);
const dfr = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);   // dateFr (coach, français)
const dateLongue = iso => { const [y, m, d] = iso.split("-").map(Number); const t = new Date(y, m - 1, d, 12).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); return t.charAt(0).toUpperCase() + t.slice(1); };
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
/* deux valeurs égales quel que soit l'ordre des clés des objets */
const canon = x => Array.isArray(x) ? "[" + x.map(canon).join(",") + "]" : x && typeof x === "object" ? "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + canon(x[k])).join(",") + "}" : JSON.stringify(x);
const memes = (x, y) => x !== undefined && canon(x) === canon(y);
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const frN = n => norm(Math.round(n).toLocaleString("fr-FR"));
const enN = n => Math.round(n).toLocaleString("en-US");

/* ---------- le catalogue (donnees/aliments.json, tel que la table aliments) et les aliments courants (js/journalAliments.js) ---------- */
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(RACINE, "donnees", f), "utf8"));
const ALIM = lireDonnees("aliments.json");
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: ALIM, recettes: lireDonnees("recettes.json") });
const JAL = (() => { try { const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(RACINE, "js", "journalAliments.js"), "utf8") + "\n;this.J = JOURNAL_ALIMENTS;", ctx, { timeout: 2000 }); return ctx.J; } catch (e) { return null; } })();
const AL = id => { const a = ALIM.find(x => x.id === id); if (!a) throw new Error("aliment absent du catalogue : " + id); return a; };
/* la première portion proposée d'un aliment courant (grammes), lue dans js/journalAliments.js */
const portion1 = id => JAL && JAL.c && Array.isArray(JAL.c[id]) && Array.isArray(JAL.c[id][4]) && JAL.c[id][4][0] ? JAL.c[id][4][0][2] : null;
const r1 = v => Math.round(v * 10) / 10;
/* un aliment tel qu'il est rangé dans « a » : les valeurs du catalogue pour 100 g, le nom du catalogue */
const fige = id => { const a = AL(id); return [a.id, r1(a.kcal), r1(a.proteines), r1(a.glucides), r1(a.lipides), a.nom]; };
/* un journal : spec = { "AAAA-MM-JJ": [[repas, id du catalogue | -1, grammes | kcal]] } ; « a » dans l'ordre de première apparition */
function JA(spec){
  const a = [], j = {};
  for (const d of Object.keys(spec)) j[d] = spec[d].map(([r, id, q]) => {
    if (id === -1) return [r, -1, q];
    let i = a.findIndex(x => x[0] === id); if (i < 0) { a.push(fige(id)); i = a.length - 1; }
    return [r, i, q];
  });
  return { v: 1, a, j };
}
const kcalDe = (doc, d) => (doc.j[d] || []).reduce((s, [r, i, q]) => s + (i === -1 ? q : doc.a[i][1] * q / 100), 0);

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000084" + String(k).padStart(2, "0");   // verif84 : …84kk (une plage par suite)
const EMAIL = k => "p" + k + "@exemple.fr";
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;
const TESTC = qui(TEST_ID || PID(99), "test@exemple.fr", { prenom: "Test" });
const deFixture = (uid, outil) => clone((F.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu);
const INTAKE_T = Object.assign(deFixture(F.IDS.c1, "intake"), { nom: "Test Démo" });
const REPAS_T = deFixture(F.IDS.c1, "repas");   // cible : 2 240 kcal, 183 g de protéines, 231 g de glucides, 83 g de lipides
/* métadonnées d'un prospect inscrit en v64 (une seule case : conditions, newsletter non cochée ; AUCUN accord santé) */
const META_V64 = () => ({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-10-01", newsletter: null, newsletter_version: "2026-09-30" });
const META_OK = () => Object.assign(META_V64(), { consentement_sante: avant(J), sante_version: "2026-10-01", sante_ecran: "calculateur" });
const EMAILS0 = { newsletter: false, maj: avant(3 * J), version: "2026-09-30", source: "inscription" };
const AVEC_CHOIX = k => ({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: EMAIL(k), bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } });
/* son calculateur : femme, 30 ans, 165 cm, 60 kg, 6 000 pas, 3 h, perte → (10×60 + 6,25×165 − 5×30 − 161) × (1,2 + 0,09 + 0,09) × 0,9 */
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const OBJ_CP = Math.round(Math.max((10 * 60 + 6.25 * 165 - 5 * 30 - 161) * (1.2 + 6000 / 10000 * 0.15 + 3 * 0.03) * 0.9, 1200));   // 1 640
const compte = (k, opts) => { opts = opts || {}; return { id: PID(k), prenom: "Léa", nom: "Martin", statut: opts.statut || "prospect", cree: avant(4 * J), email: EMAIL(k), meta: opts.meta === undefined ? META_V64() : opts.meta,
  donnees: [["intake", Object.assign(AVEC_CHOIX(k), opts.intake || {})], ["emails", EMAILS0]].concat(opts.donnees || []) }; };
const quiP = (k, meta) => qui(PID(k), EMAIL(k), meta === undefined ? META_V64() : meta);

/* ---------- le décor : fixtures.js (coach, clients) + le compte client de test + les comptes du bloc ----------
   opts.en : le compte de test en anglais (prefs) ; opts.comptes : [{ id, prenom, nom, statut, cree, email, meta, donnees: [[outil,
   contenu, maj_le]] }] ; opts.cles : [[uid, outil, contenu, maj_le]] (ajoutées ou remplacées) */
function poser(db, uid, outil, contenu, maj){
  const l = { user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(H) }, i = db.donnees.findIndex(x => x.user_id === uid && x.outil === outil);
  if (i > -1) db.donnees[i] = l; else db.donnees.push(l);
}
function ajouterCompte(db, x){
  db.profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
  if (x.email) db.emails[x.id] = x.email;
  db.meta[x.id] = clone(x.meta || {});
  for (const [outil, contenu, maj] of x.donnees || []) poser(db, x.id, outil, contenu, maj || avant(H));
}
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const db = { profils, donnees: clone(F.donnees), ecritures: [], refus: [], lectures: [], catalogue: [], authUser: [], n: 0,
    emails: { [F.IDS.coach]: "coach@exemple.fr", [F.IDS.c1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [F.IDS.c1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } } };
  ajouterCompte(db, { id: TESTC.id, prenom: "Test", nom: "Démo", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", meta: { prenom: "Test" },
    donnees: [["intake", INTAKE_T, avant(2 * J)], ["repas", REPAS_T, avant(10 * J)], ["prefs", { langue: opts.en ? "en" : "fr" }, avant(10 * J)]] });
  for (const x of opts.comptes || []) ajouterCompte(db, x);
  for (const [uid, outil, contenu, maj] of opts.cles || []) poser(db, uid, outil, contenu, maj);
  return db;
}

/* ---------- le faux Supabase (gabarit de verif71) ---------- */
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
const appelant = req => { const m = /^Bearer jeton-([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  /* le compte : GET rend les métadonnées de la base ; PUT { data } les FUSIONNE (null supprime la clé) et les rend */
  if (p === "/auth/v1/user") {
    const c = corps();
    db.authUser.push({ m, par: moi, corps: clone(c), q: url.search });
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    const meta = db.meta[moi] || (db.meta[moi] = {});
    if (m === "PUT" && c && c.data && typeof c.data === "object") Object.keys(c.data).forEach(k => { if (c.data[k] === null) delete meta[k]; else meta[k] = clone(c.data[k]); });
    return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: clone(meta) });
  }
  if (p.startsWith("/auth/v1/")) return json({});   // logout…
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*", n: ++db.n });
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict");
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, n: ++db.n, on_conflict: q.get("on_conflict"), par: moi }, clone(ligne)));
      }
      return json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {}, row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq);
      db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: clone(c.contenu), par: moi });
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, par: moi });   // DELETE : jamais attendu (zéro perte), noté
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) { if (m === "GET") db.catalogue.push({ t, par: moi, plage: req.headers()["range"] || "" }); return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201); }
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ; opts : viewport, langue ("en") ---------- */
const ERREURS = [];   // erreurs de console et erreurs JS de toute la suite (bloc Z)
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, langue, plusTard }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      /* v88 : cette suite ne teste pas la fenêtre « Notre politique de confidentialité a changé » (verif90) : « Plus tard » déjà touché
         sur cet appareil pour ce compte (accord santé d'une version plus ancienne), une minute avant l'horloge de la page */
      if (s && s.user && s.user.id) localStorage.setItem("mhx_rappel_politique|" + s.user.id, plusTard);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", plusTard: new Date((opts.temps || T0) - 60000).toISOString() });
  await c.clock.install({ time: opts.temps || T0 });   // midi du jour du lancement (ou opts.temps, bloc Q : 23 h 59), puis l'horloge tourne
  const page = surveiller(await c.newPage());
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!f(); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const ecrJA = (db, uid) => ecr(db, "journal_alimentaire", uid);
/* les écritures, hors compteur de visites (clé activite : prospect, compte de test suivi par suivi_visites_clients) */
const saisies = (db, uid) => db.ecritures.filter(e => !(e.table === "donnees" && e.outil === "activite") && (!uid || e.user_id === uid || e.par === uid || e.id === uid));
const resumeE = db => JSON.stringify(saisies(db).map(e => (e.table === "donnees" ? e.outil + "@" + String(e.user_id).slice(-4) : e.table) + ":" + e.m));
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
/* une lecture du CONTENU du journal (eq. ou in.(…) qui le nomme ; jamais not.in.) */
const litJA = o => /^eq\.journal_alimentaire$/.test(o) || (/^in\.\(/.test(o) && liste(o.slice(3)).includes("journal_alimentaire"));
const lusJA = (db, par, n0) => db.lectures.filter(l => l.n > (n0 || 0) && (!par || l.par === par) && litJA(l.outil));
const txt = (page, sel) => page.$eval(sel, e => e.textContent).then(norm).catch(() => null);
const capturer = async (page, nom, plein) => { if (!CAPT) return; fs.mkdirSync(CAPT, { recursive: true }); await page.screenshot({ path: path.join(CAPT, nom + ".png"), fullPage: !!plein }).catch(() => {}); };

/* la page du journal, lue telle qu'elle s'affiche */
const lirePage = page => page.evaluate(() => {
  const t = e => e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null, q = s => document.querySelector(s);
  return { lbl: t(q("#ja-lbl")), num: t(q("#ja-num")), unite: t(q("#ja-resume .ja-grand .unit")), detail: t(q("#ja-detail")),
    jauge: q("#ja-jauge-i") ? q("#ja-jauge-i").style.width : null, jaugeCachee: q("#ja-jauge") ? q("#ja-jauge").hidden : null,
    jour: t(q("#ja-jour")), sous: t(q("#ja-date-sous")), precOff: q("#ja-prec") ? q("#ja-prec").disabled : null, suivOff: q("#ja-suiv") ? q("#ja-suiv").disabled : null,
    macros: ["p", "g", "l"].map(k => t(q("#ja-m-" + k))),
    repas: [...document.querySelectorAll(".ja-repas")].map(s => ({ r: s.dataset.jaRepas, h2: t(s.querySelector("h2")), kcal: t(s.querySelector(".ja-repas-kcal")),
      lignes: [...s.querySelectorAll(".ja-ligne")].map(l => ({ tag: l.tagName.toLowerCase(), k: l.dataset.jaK, nom: t(l.querySelector(".ja-l-txt b")), sous: t(l.querySelector(".ja-l-txt small")), kcal: t(l.querySelector(".ja-l-kcal")), nouveau: l.classList.contains("ja-nouveau") })),
      vide: t(s.querySelector(".ja-vide")), ajout: t(s.querySelector("[data-ja-ajout]")), menu: !!s.querySelector("[data-ja-menu]") })),
    sept: t(q("#ja-sept-txt")), lecture: !!q("#vue.lecture-seule"), h1: t(q("#ja-vue h1")), hash: location.hash, courant: typeof courant !== "undefined" ? courant : null };
}).catch(e => ({ erreur: String(e) }));
const nbLignes = R => (R.repas || []).reduce((n, x) => n + x.lignes.length, 0);
/* le panneau (feuille) : titre, liste, portion */
const lirePanneau = page => page.evaluate(() => {
  const t = e => e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null, f = document.querySelector(".modale.ja-feuille");
  if (!f) return null;
  const q = s => f.querySelector(s), h = q("#ja-res-titre");
  return { titre: t(f.querySelector(":scope > h2")), focus: document.activeElement ? document.activeElement.id : null, resTitre: h ? (h.hidden ? "" : t(h)) : null,
    res: [...f.querySelectorAll(".ja-res-l")].map(b => ({ nom: t(b.querySelector("b")), sous: t(b.querySelector("small")), kcal: t(b.querySelector(".ja-res-k .readout")) })),
    etat: t(q("#ja-f-etat")), nom: t(q(".ja-f-nom b")), par100: t(q(".ja-f-nom small")), past: [...f.querySelectorAll(".ja-past")].map(b => [t(b), b.getAttribute("aria-pressed")]),
    g: q("#ja-g") ? q("#ja-g").value : null, n: t(q("#ja-n")), ck: t(q("#ja-ck")), pgl: t(q("#ja-pgl")), ok: t(q("#ja-ok")), okOff: q("#ja-ok") ? q("#ja-ok").disabled : null,
    mg: q("#ja-g") ? q("#ja-g").value : null,   /* v79 (relecture) : modifier une ligne = la même étape portion (#ja-g) */ suppr: t(q("#ja-suppr")), copier: q("#ja-copier") ? { off: q("#ja-copier").disabled, txt: t(q("#ja-copier small")) } : null, texte: t(f) };
}).catch(() => null);
/* une recherche dans le panneau : attend les résultats (titre caché, au moins une ligne) */
async function chercher(page, mot){
  await page.fill("#ja-q", mot);
  await page.waitForFunction(m => { const c = document.getElementById("ja-q"), h = document.getElementById("ja-res-titre"); return !!c && c.value === m && !!h && h.hidden && document.querySelectorAll(".ja-res-l").length > 0; }, mot, { timeout: 10000 }).catch(() => {});
  await attendre(page, 250);
  return lirePanneau(page);
}
/* touche le résultat dont le nom est exactement nom ; faux s'il n'y est pas */
async function choisir(page, nom){
  const i = await page.$$eval(".ja-res-l b", (l, n) => l.findIndex(b => b.textContent.trim() === n), nom);
  if (i < 0) return false;
  await page.locator(".ja-res-l").nth(i).click();
  await page.waitForSelector(".modale.ja-feuille #ja-ok", { timeout: 5000 });
  await attendre(page, 200);
  return true;
}
/* attend « Les plus courants » (ou « Récents ») dans le panneau ouvert ; renvoie tous les titres vus pendant l'attente */
async function suivreTitres(page, cible, ms){
  const vus = [], fin = Date.now() + (ms || 10000);
  while (Date.now() < fin) {
    const s = await page.evaluate(() => { const h = document.getElementById("ja-res-titre"); return h ? [h.hidden ? "" : h.textContent.trim(), document.querySelectorAll(".ja-res-l").length] : null; }).catch(() => null);
    if (s) { if (vus[vus.length - 1] !== s[0]) vus.push(s[0]); if (s[0] === cible && s[1] > 0) break; }
    await attendre(page, 40);
  }
  return vus;
}
const panneauFerme = page => page.waitForFunction(() => !document.querySelector(".modale.ja-feuille"), null, { timeout: 4000 }).then(() => true).catch(() => false);
/* la fiche du coach : ouverte comme depuis Mes clients ou Prospects (Clients.ouvrir), attendue jusqu'à son panneau Nutrition */
async function ouvrirFiche(page, id, nom){
  await page.evaluate(([i, n]) => Clients.ouvrir(i, n, "accueil"), [id, nom]);
  await page.waitForSelector("#vue .bandeau", { timeout: 8000 });
  await page.waitForFunction(() => [...document.querySelectorAll("#vue section.panel h2")].some(h => h.textContent.trim() === "Nutrition"), null, { timeout: 8000 });
  await attendre(page, 500);
}
/* la valeur d'une ligne (« Aujourd'hui », « Objectif »…) du panneau #fiche-ja lu ; null si la ligne n'y est pas (une seule attendue) */
const valeurFiche = (FJ, cle) => { const l = ((FJ && FJ.lignes) || []).filter(x => x[0] === cle); return l.length === 1 ? l[0][1] : null; };
const liensBandeau = page => page.$$eval("#vue .bandeau-actions a", l => l.map(a => [a.textContent.trim(), a.getAttribute("href")])).catch(() => []);
const nav = page => page.$$eval("#nav a", l => l.map(a => a.dataset.id)).catch(() => []);
/* les mots français qui ne doivent jamais rester sur un écran anglais */
const MOTS_FR = ["Aujourd'hui", "Ajouter", "Petit-déjeuner", "Déjeuner", "Dîner", "Collations", "Il te reste", "Récents", "Les plus courants", "Supprimer", "Rien de noté"];
const textesEcran = page => page.evaluate(() => [document.getElementById("vue"), document.querySelector(".modale.ja-feuille"), document.getElementById("toasts")].filter(Boolean).map(e => e.innerText).join("\n")).catch(() => "");
const motsFr = t => MOTS_FR.filter(m => t.includes(m));
const largeurOk = page => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth })).then(x => ({ ok: x.sw <= x.w, x })).catch(e => ({ ok: false, x: String(e) }));
/* tailles des zones de toucher (visibles) */
const zones = (page, sel) => page.$$eval(sel, l => l.filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; })).catch(() => []);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF84_PORT=10001 node verif84.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. client compte de test, 390 px : ouvrir, chercher, ajouter =================== */
  await bloc("A. client compte de test : ouvrir, chercher, ajouter", async () => {
    const db = base();
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 1800);
    const L0 = lusJA(db, TESTC.id), E0 = saisies(db, TESTC.id), cat0 = db.catalogue.length;
    ok("ouverture (" + (TEST_ID ? "compte de test lu dans CONFIG.nouveautes.comptes_test" : "IDENTIFIANT DU COMPTE DE TEST INTROUVABLE dans le fichier servi") + ", interrupteur « test ») : le journal est lu chez lui (outil=eq.journal_alimentaire), le catalogue est préchargé dès l'ouverture (v79.1 : la recherche est prête au premier « + Ajouter ») ; aucune écriture à l'ouverture",
      !!TEST_ID && L0.some(l => l.uid === TESTC.id && l.outil === "eq.journal_alimentaire") && cat0 >= 1 && E0.length === 0, JSON.stringify([TEST_ID, L0, cat0]) + " " + resumeE(db));
    const R = await lirePage(page);
    await capturer(page, "fr-01-vide", true);
    ok("résumé : « Il te reste 2 240 kcal » (objectif de sa diète), « 0 sur 2 240 kcal », jauge à 0 % ; « Aujourd'hui », jour suivant désactivé ; 4 repas (Petit-déjeuner, Déjeuner, Dîner, Collations), chacun « Rien de noté pour l'instant. », « + Ajouter » et son menu",
      R.lbl === "Il te reste" && R.num === "2 240" && R.unite === "kcal" && R.detail === "0 sur 2 240 kcal" && /%$/.test(R.jauge || "") && parseFloat(R.jauge) === 0 && R.jaugeCachee === false && R.jour === "Aujourd'hui" && R.suivOff === true && R.precOff === false
      && egal(R.repas.map(x => x.h2), ["Petit-déjeuner", "Déjeuner", "Dîner", "Collations"]) && R.repas.every(x => x.lignes.length === 0 && x.vide === "Rien de noté pour l'instant." && x.ajout === "+ Ajouter" && x.menu), JSON.stringify(R));
    /* le panneau d'ajout du déjeuner */
    await page.click('[data-ja-ajout="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-q");
    const P0 = await lirePanneau(page);
    const vus = await suivreTitres(page, "Les plus courants", 10000);
    const P1 = await lirePanneau(page), cat = db.catalogue.filter(x => x.t === "aliments");
    await capturer(page, "fr-02-panneau");
    ok("panneau « Ajouter au déjeuner » (.modale.ja-feuille) : le curseur dans #ja-q ; « Récents » jamais affiché (rien de noté), puis « Les plus courants » (10 aliments) dès que le catalogue est lu (/rest/v1/aliments, 4 pages de 1 000)",
      !!P0 && P0.titre === "Ajouter au déjeuner" && P0.focus === "ja-q" && !vus.includes("Récents") && vus[vus.length - 1] === "Les plus courants" && !!P1 && P1.res.length === 10 && cat.length === 4,
      JSON.stringify([P0 && [P0.titre, P0.focus, P0.resTitre], vus, P1 && P1.res.slice(0, 3), cat.map(x => x.plage)]));
    const P2 = await chercher(page, "poulet");
    const top3 = P2 ? P2.res.slice(0, 3).map(x => x.nom) : [];
    ok("« poulet » → « Blanc de poulet grillé » dans les 3 premiers résultats", top3.includes("Blanc de poulet grillé"), JSON.stringify(P2 && P2.res.slice(0, 5)));
    const choisi = await choisir(page, "Blanc de poulet grillé");
    const P3 = await lirePanneau(page), g1 = portion1("poulet-blanc-grille"), kc1 = 141 * g1 / 100;
    await capturer(page, "fr-03-portion");
    ok("toucher → portion : « Blanc de poulet grillé », « 141 kcal pour 100 g » ; une seule pastille pressée (« 1 portion habituelle · " + g1 + " g », la portion de js/journalAliments.js), puis « 100 g » ; #ja-g = " + g1 + ", #ja-ck = " + frN(kc1) + " ; « Ajouter » actif",
      choisi && !!P3 && P3.nom === "Blanc de poulet grillé" && P3.par100 === "141 kcal pour 100 g" && egal(P3.past, [["1 portion habituelle · " + g1 + " g", "true"], ["100 g", "false"]]) && P3.g === String(g1) && P3.ck === frN(kc1) && P3.ok === "Ajouter" && P3.okOff === false,
      JSON.stringify([choisi, g1, P3]));
    await page.click("#ja-plus"); await attendre(page, 200);
    const P4 = await lirePanneau(page), g2 = 2 * g1, kc2 = 141 * g2 / 100;
    ok("« + » double les grammes : « × 2 », #ja-g = " + g2 + ", #ja-ck = " + frN(kc2), !!P4 && P4.g === String(g2) && P4.n === "2" && P4.ck === frN(kc2) && P4.past[0][1] === "true", JSON.stringify(P4));
    const tClic = Date.now();
    await page.click("#ja-ok");
    const ferme = await panneauFerme(page);
    const R2 = await lirePage(page), l1 = (R2.repas && R2.repas[1] && R2.repas[1].lignes) || [];
    ok("« Ajouter » : panneau fermé ; la ligne apparaît au déjeuner, éclairée (.ja-nouveau) : « Blanc de poulet grillé », « 1 portion habituelle × 2 · " + g2 + " g », " + frN(kc2),
      ferme && l1.length === 1 && l1[0].nouveau && l1[0].tag === "button" && l1[0].k === "0" && l1[0].nom === "Blanc de poulet grillé" && l1[0].sous === "1 portion habituelle × 2 · " + g2 + " g" && l1[0].kcal === frN(kc2), JSON.stringify([ferme, l1]));
    await attendreQue(() => ecrJA(db, TESTC.id).length >= 1, 3000); await attendre(page, Math.max(0, 1400 - (Date.now() - tClic)));
    const W = ecrJA(db, TESTC.id), autres = saisies(db, TESTC.id).filter(e => e.outil !== "journal_alimentaire");
    const attendu = { v: 1, a: [fige("poulet-blanc-grille")], j: { [AUJ]: [[1, 0, g2]] } };
    ok("UNE écriture (1,4 s après, attente de 700 ms) : POST upsert (on_conflict=user_id,outil) de la seule clé journal_alimentaire chez lui, contenu exact { v: 1, a: [[\"poulet-blanc-grille\", 141, 30.1, 0, 2, \"Blanc de poulet grillé\"]], j: { aujourd'hui: [[1, 0, " + g2 + "]] } } ; aucune autre clé écrite",
      W.length === 1 && W[0].m === "POST" && W[0].on_conflict === "user_id,outil" && W[0].user_id === TESTC.id && memes(W[0].contenu, attendu) && autres.length === 0,
      JSON.stringify(W.map(e => [e.m, e.on_conflict, e.contenu])) + " " + resumeE(db));
    const R3 = await lirePage(page), reste = 2240 - kc2;
    await capturer(page, "fr-04-rempli", true);
    ok("totaux : « Il te reste » 2 240 → " + frN(reste) + " (" + frN(kc2) + " kcal de moins), « " + frN(kc2) + " sur 2 240 kcal », déjeuner « " + frN(kc2) + " kcal », protéines « " + frN(30.1 * g2 / 100) + " / 183 g »",
      R3.lbl === "Il te reste" && R3.num === frN(reste) && R3.detail === frN(kc2) + " sur 2 240 kcal" && R3.repas[1].kcal === frN(kc2) + " kcal" && R3.macros[0] === frN(30.1 * g2 / 100) + " / 183 g" && R3.macros[1] === "0 / 231 g",
      JSON.stringify([R3.lbl, R3.num, R3.detail, R3.repas[1].kcal, R3.macros]));
    await page.click('[data-ja-ajout="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-q"); await attendre(page, 500);
    const P5 = await lirePanneau(page);
    ok("panneau rouvert (petit-déjeuner) : « Récents » avec « Blanc de poulet grillé » (" + g2 + " g, " + frN(kc2) + " kcal) en premier",
      !!P5 && P5.titre === "Ajouter au petit-déjeuner" && P5.resTitre === "Récents" && P5.res.length >= 1 && P5.res[0].nom === "Blanc de poulet grillé" && P5.res[0].sous === g2 + " g" && P5.res[0].kcal === frN(kc2), JSON.stringify(P5 && [P5.titre, P5.resTitre, P5.res]));
  });

  /* =================== B. modifier et supprimer une ligne =================== */
  await bloc("B. modifier et supprimer une ligne", async () => {
    const doc0 = JA({ [AUJ]: [[1, "poulet-blanc-grille", 204], [1, "riz-blanc-cuit", 150], [3, "banane-crue", 120]] });
    const db = base({ cles: [[TESTC.id, "journal_alimentaire", doc0, avant(H)]] });
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-ligne"); await attendre(page, 800);
    await page.click('.ja-ligne[data-ja-k="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-suppr");
    const M0 = await lirePanneau(page);    await page.fill("#ja-g", "150"); await attendre(page, 200);
    const M1 = await lirePanneau(page);
    await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400);
    const W1 = ecrJA(db, TESTC.id), doc1 = clone(doc0); doc1.j[AUJ][0][2] = 150;
    const R1 = await lirePage(page);
    ok("toucher la ligne : panneau « Blanc de poulet grillé », #ja-g = 204 (pastille × 2), « Enregistrer » et « Supprimer » ; 150 g → 212 kcal ; « Enregistrer » → UNE écriture : la ligne passe à 150 g, rien d'autre ne change ; l'écran suit (212)",
      !!M0 && M0.titre === "Blanc de poulet grillé" && M0.mg === "204" && M0.ok === "Enregistrer" && M0.suppr === "Supprimer" && !!M1 && M1.ck === "212" && M1.okOff === false
      && W1.length === 1 && memes(W1[0].contenu, doc1) && R1.repas[1].lignes.length === 2 && R1.repas[1].lignes[0].kcal === "212" && R1.repas[1].lignes[0].nom === "Blanc de poulet grillé",
      JSON.stringify([M0 && [M0.titre, M0.mg, M0.ok, M0.suppr], M1 && M1.ck, W1.map(e => e.contenu.j), R1.repas && R1.repas[1]]));
    await page.click('.ja-ligne[data-ja-k="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-suppr");
    await page.click("#ja-suppr"); await panneauFerme(page); await attendre(page, 1400);
    const W2 = ecrJA(db, TESTC.id).slice(1), doc2 = clone(doc1); doc2.j[AUJ].splice(0, 1);
    const toast = await page.evaluate(() => { const t = document.querySelector(".toast.ja-toast"), a = t && t.querySelector(".ja-annuler"); return t ? { txt: t.textContent, annuler: a ? a.textContent : null } : null; });
    const R2 = await lirePage(page);
    ok("« Supprimer » : UNE écriture sans la ligne (les autres lignes et la liste des aliments intactes) ; la ligne quitte l'écran ; message « Supprimé : Blanc de poulet grillé » avec « Annuler »",
      W2.length === 1 && memes(W2[0].contenu, doc2) && R2.repas[1].lignes.length === 1 && R2.repas[1].lignes[0].nom === "Riz blanc, cuit" && !!toast && norm(toast.txt).startsWith("Supprimé : Blanc de poulet grillé") && toast.annuler === "Annuler",
      JSON.stringify([W2.map(e => e.contenu.j), R2.repas && R2.repas[1].lignes, toast]));
    await page.click(".toast.ja-toast .ja-annuler"); await attendre(page, 1400);
    const W3 = ecrJA(db, TESTC.id).slice(2), R3 = await lirePage(page);
    ok("« Annuler » : la ligne revient à sa place (déjeuner, en premier, 212) ; UNE écriture : le document redevient celui d'avant la suppression ; le message disparaît",
      W3.length === 1 && memes(W3[0].contenu, doc1) && R3.repas[1].lignes.length === 2 && R3.repas[1].lignes[0].nom === "Blanc de poulet grillé" && R3.repas[1].lignes[0].kcal === "212" && !(await page.$(".toast.ja-toast")),
      JSON.stringify([W3.map(e => e.contenu.j), R3.repas && R3.repas[1].lignes]) + " " + resumeE(db));
  });

  /* =================== C. menu ⋯ : copier depuis hier, ajout rapide =================== */
  await bloc("C. menu : copier depuis hier, ajout rapide", async () => {
    const doc0 = JA({ [HIER]: [[0, "yaourt-nature", 125], [0, "banane-crue", 120], [2, "oeuf-dur", 100]], [AUJ]: [[1, "poulet-blanc-grille", 150]] });
    const db = base({ cles: [[TESTC.id, "journal_alimentaire", doc0, avant(H)]] });
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-ligne"); await attendre(page, 800);
    await page.click('[data-ja-menu="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-copier");
    const M0 = await lirePanneau(page);
    await page.click("#ja-copier"); await panneauFerme(page);
    const Rc = await lirePage(page);
    await attendre(page, 1400);
    const W1 = ecrJA(db, TESTC.id), doc1 = clone(doc0); doc1.j[AUJ].push([0, 0, 125], [0, 1, 120]);
    const toast = await page.evaluate(() => { const t = document.querySelector(".toast.ja-toast"); return t ? t.textContent : null; });
    ok("menu du petit-déjeuner : « Copier depuis hier » actif, « 2 aliments notés la veille » ; copié → les 2 lignes d'hier ajoutées à aujourd'hui (écran, éclairées) ; UNE écriture : aujourd'hui = la ligne d'avant + [0, yaourt, 125], [0, banane, 120], hier intact ; « 2 aliments copiés depuis hier » avec « Annuler »",
      !!M0 && M0.titre === "Petit-déjeuner" && !!M0.copier && M0.copier.off === false && M0.copier.txt === "2 aliments notés la veille" && Rc.repas[0].lignes.length === 2 && Rc.repas[0].lignes.every(x => x.nouveau)
      && egal(Rc.repas[0].lignes.map(x => x.nom), ["Yaourt nature", "Banane crue"]) && W1.length === 1 && memes(W1[0].contenu, doc1) && norm(toast).startsWith("2 aliments copiés depuis hier") && /Annuler$/.test(norm(toast)),
      JSON.stringify([M0 && [M0.titre, M0.copier], Rc.repas && Rc.repas[0].lignes, W1.map(e => e.contenu.j), toast]));
    await page.click(".toast.ja-toast .ja-annuler"); await attendre(page, 1400);
    const W2 = ecrJA(db, TESTC.id).slice(1), R2 = await lirePage(page);
    ok("« Annuler » : les 2 lignes copiées quittent l'écran ; UNE écriture : le document redevient celui d'avant la copie",
      W2.length === 1 && memes(W2[0].contenu, doc0) && R2.repas[0].lignes.length === 0 && R2.repas[1].lignes.length === 1, JSON.stringify([W2.map(e => e.contenu.j), R2.repas && R2.repas.map(x => x.lignes.length)]));
    await page.click('[data-ja-menu="3"]'); await page.waitForSelector(".modale.ja-feuille #ja-copier");
    const M3 = await lirePanneau(page);
    ok("menu des collations (rien la veille) : « Copier depuis hier » désactivé, « Rien de noté la veille à ce repas. »",
      !!M3 && M3.titre === "Collations" && !!M3.copier && M3.copier.off === true && M3.copier.txt === "Rien de noté la veille à ce repas.", JSON.stringify(M3 && [M3.titre, M3.copier]));
    const R3a = await lirePage(page);
    await page.click("#ja-rapide"); await page.waitForSelector("#ja-rk");
    const off0 = await page.$eval("#ja-ok", e => e.disabled);
    await page.fill("#ja-rk", "350"); await attendre(page, 150);
    const off1 = await page.$eval("#ja-ok", e => e.disabled);
    await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400);
    const W3 = ecrJA(db, TESTC.id).slice(2), doc3 = clone(doc0); doc3.j[AUJ].push([3, -1, 350]);
    const R3 = await lirePage(page), l3 = R3.repas[3].lignes;
    ok("ajout rapide 350 kcal (collations) : « Ajouter » inactif tant que rien n'est tapé ; ligne « Ajout rapide », « Calories ajoutées à la main », 350 ; UNE écriture [3, -1, 350] ; collations « 350 kcal », « Il te reste » baisse de 350",
      off0 === true && off1 === false && W3.length === 1 && memes(W3[0].contenu, doc3) && l3.length === 1 && l3[0].nom === "Ajout rapide" && l3[0].sous === "Calories ajoutées à la main" && l3[0].kcal === "350"
      && R3.repas[3].kcal === "350 kcal" && R3a.num === frN(2240 - 211.5) && R3.num === frN(2240 - 211.5 - 350), JSON.stringify([off0, off1, W3.map(e => e.contenu.j), l3, R3.repas[3].kcal, R3a.num, R3.num]) + " " + resumeE(db));
  });

  /* =================== D. jours précédent et suivant =================== */
  await bloc("D. jours : hier, aujourd'hui", async () => {
    const doc0 = JA({ [HIER]: [[0, "yaourt-nature", 125], [0, "banane-crue", 120], [2, "oeuf-dur", 100]], [AUJ]: [[1, "poulet-blanc-grille", 150]] });
    const db = base({ cles: [[TESTC.id, "journal_alimentaire", doc0, avant(H)]] });
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-ligne"); await attendre(page, 800);
    const R0 = await lirePage(page);
    ok("aujourd'hui : « Aujourd'hui » et « " + dateLongue(AUJ) + " », jour suivant désactivé, 1 ligne (déjeuner), « Il te reste " + frN(2240 - kcalDe(doc0, AUJ)) + " »",
      R0.jour === "Aujourd'hui" && R0.sous === dateLongue(AUJ) && R0.suivOff === true && nbLignes(R0) === 1 && R0.repas[1].lignes.length === 1 && R0.num === frN(2240 - kcalDe(doc0, AUJ)), JSON.stringify([R0.jour, R0.sous, R0.suivOff, R0.num, nbLignes(R0)]));
    await page.click("#ja-prec"); await attendre(page, 300);
    const R1 = await lirePage(page);
    ok("‹ : « Hier » et « " + dateLongue(HIER) + " », ses 3 lignes (2 au petit-déjeuner, 1 au dîner), jour suivant réactivé, « Il te reste " + frN(2240 - kcalDe(doc0, HIER)) + " »",
      R1.jour === "Hier" && R1.sous === dateLongue(HIER) && R1.suivOff === false && nbLignes(R1) === 3 && R1.repas[0].lignes.length === 2 && R1.repas[2].lignes.length === 1 && R1.repas[2].lignes[0].nom === "Œuf dur" && R1.num === frN(2240 - kcalDe(doc0, HIER)),
      JSON.stringify([R1.jour, R1.sous, R1.suivOff, R1.num, R1.repas && R1.repas.map(x => x.lignes.map(l => l.nom))]));
    await page.click("#ja-suiv"); await attendre(page, 300);
    const R2 = await lirePage(page);
    ok("› : retour à « Aujourd'hui » (1 ligne), jour suivant de nouveau désactivé ; rien d'écrit pendant la navigation",
      R2.jour === "Aujourd'hui" && R2.suivOff === true && nbLignes(R2) === 1 && saisies(db, TESTC.id).length === 0, JSON.stringify([R2.jour, R2.suivOff, nbLignes(R2)]) + " " + resumeE(db));
  });

  /* =================== E. prospect sans accord santé (interrupteur sur « tous ») =================== */
  await bloc("E. prospect sans accord santé", async () => {
    MODE = "tous";
    const k = 1, ID = PID(k);
    const db = base({ comptes: [compte(k)] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, "#sante-carte"); await attendre(page, 1200);
    const E0 = await page.evaluate(() => {
      const c = document.getElementById("sante-carte"), vue = document.getElementById("vue");
      const champs = [...vue.querySelectorAll("input, select, textarea, button")].filter(e => !e.closest(".sante-carte, .masthead, #installe"));
      return { inter: CONFIG.nouveautes.journal_alimentaire, ecran: c && c.dataset.santeEcran, premier: !!c && vue.firstElementChild === c, page: !!document.getElementById("ja-vue"),
        champs: champs.map(e => e.id || e.className), off: champs.filter(e => e.disabled && e.hasAttribute("data-sante-off")).length, ajout: document.querySelectorAll("[data-ja-ajout], [data-ja-menu], .ja-repas").length,
        ok: Sante.ok(), bloque: Sante.bloque("journal_alimentaire", { v: 1, a: [], j: {} }) };
    });
    ok("interrupteur servi sur « tous » ; prospect sans accord : #/journal-alimentaire montre la carte #sante-carte[data-sante-ecran=\"journal-alimentaire\"] en premier ; la page dessous figée (‹ et › inactifs et marqués, aucun repas ni bouton d'ajout) ; rien lu : ni le journal, ni /rest/v1/aliments",
      E0.inter === "tous" && E0.ecran === "journal-alimentaire" && E0.premier && E0.page && E0.champs.length >= 2 && E0.off === E0.champs.length && E0.champs.includes("ja-prec") && E0.champs.includes("ja-suiv") && E0.ajout === 0
      && E0.ok === false && E0.bloque === true && lusJA(db, ID).length === 0 && db.catalogue.length === 0, JSON.stringify(E0) + " " + JSON.stringify([lusJA(db, ID), db.catalogue.length]));
    const T0c = await page.evaluate(() => ({ texte: document.querySelector("#sante-carte .sante-texte").textContent, phrase: document.querySelector("#sante-carte .sante-phrase").textContent }));
    await page.click("#sante-non"); await attendre(page, 300);
    const refus = await txt(page, "#sante-refus");
    ok("textes de l'accord : « … et les aliments notés dans ton journal alimentaire. », « … aliments notés dans le journal) … » ; « Pas maintenant » → « … l'organisation de la diète et le journal alimentaire restent en pause. »",
      norm(T0c.texte).includes("aliments notés dans ton journal alimentaire") && norm(T0c.phrase).includes("aliments notés dans le journal") && !!refus && refus.includes("le journal alimentaire restent en pause"), JSON.stringify([T0c, refus]));
    const force = await page.evaluate(() => Store.ecrire("journal_alimentaire", { v: 1, a: [["x", 1, 1, 1, 1, "x"]], j: {} }));
    await attendre(page, 1400);
    const copies = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => /journal_alimentaire/.test(k)));
    await aller(page, "#/decouverte", 1800); await page.waitForSelector("#ja-carte", { timeout: 6000 }).catch(() => {});
    const carte = await txt(page, "#ja-carte .ja-carte-txt");
    ok("Store.ecrire(\"journal_alimentaire\", …) forcé → false : rien d'écrit ni gardé sur l'appareil ; son accueil montre la carte du journal qui invite seulement (« Note ce que tu manges… ») : toujours aucune lecture du journal ni du catalogue",
      force === false && ecrJA(db).length === 0 && copies.length === 0 && carte === "Note ce que tu manges : tes calories du jour se calculent toutes seules." && lusJA(db, ID).length === 0 && db.catalogue.length === 0,
      JSON.stringify([force, copies, carte, lusJA(db, ID), db.catalogue.length]) + " " + resumeE(db));
    await aller(page, "#/journal-alimentaire", 1200); await page.waitForSelector("#sante-oui", { timeout: 6000 });
    const n0 = db.n, tClic = await page.evaluate(() => Date.now());
    await page.click("#sante-oui");
    const parti = await page.waitForFunction(() => !document.getElementById("sante-carte") && document.querySelectorAll(".ja-repas").length === 4, null, { timeout: 9000 }).then(() => true).catch(() => false);
    await attendre(page, 800);
    const P = db.authUser.filter(x => x.m === "PUT"), d = P[0] && P[0].corps && P[0].corps.data, v = await page.evaluate(() => CONFIG.textes_legaux.cgu_version);
    const tAcc = d ? Date.parse(d.consentement_sante) : NaN;
    ok("« J'accepte » : UN PUT /auth/v1/user { data: { consentement_sante (l'instant), sante_version, sante_ecran: \"journal-alimentaire\" } } ; la page repart sans la carte (4 repas, champs actifs) et lit le journal",
      parti && P.length === 1 && !!d && egal(Object.keys(P[0].corps), ["data"]) && egal(Object.keys(d).sort(), ["consentement_sante", "sante_ecran", "sante_version"]) && d.sante_ecran === "journal-alimentaire" && d.sante_version === v
      && tAcc >= tClic - 1000 && tAcc <= tClic + 60000 && lusJA(db, ID, n0).length >= 1 && !(await page.$("#vue [data-sante-off]")), JSON.stringify([parti, P.map(x => x.corps), v, lusJA(db, ID, n0)]));
    await page.click('[data-ja-ajout="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-q");
    await suivreTitres(page, "Les plus courants", 10000);
    await chercher(page, "banane");
    const choisi = await choisir(page, "Banane crue");
    await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400);
    const W = ecrJA(db, ID), R = await lirePage(page);
    ok("après l'accord, il peut ajouter : « banane » → « Banane crue » (portion " + portion1("banane-crue") + " g) → UNE écriture chez lui { a: [banane-crue], j: { aujourd'hui: [[0, 0, " + portion1("banane-crue") + "]] } } ; « Total du jour » (pas de calcul) : " + frN(88 * portion1("banane-crue") / 100),
      choisi && W.length === 1 && W[0].user_id === ID && memes(W[0].contenu, { v: 1, a: [fige("banane-crue")], j: { [AUJ]: [[0, 0, portion1("banane-crue")]] } }) && R.lbl === "Total du jour" && R.num === frN(88 * portion1("banane-crue") / 100),
      JSON.stringify([choisi, W.map(e => e.contenu), R.lbl, R.num]) + " " + resumeE(db));
  });

  /* =================== F. prospect avec accord : la carte de son accueil (« tous ») =================== */
  await bloc("F. prospect avec accord : carte de l'accueil", async () => {
    const k = 2, ID = PID(k);
    const mk = () => base({ comptes: [compte(k, { meta: META_OK(), donnees: [["calc_perso", CP, avant(2 * H)]] })] });
    const dores = page => page.$$eval("#vue .btn", l => l.filter(e => !e.classList.contains("ghost") && e.offsetParent !== null).map(e => e.id || e.textContent.trim())).catch(() => null);
    /* d'abord en « test » (ce prospect n'est pas un compte de test) : l'accueil sans la carte, ses boutons dorés */
    let db = mk(), X = await contexte(b, quiP(k, META_OK()), db);
    await X.page.goto(URL0 + "#/decouverte"); await pret(X.page, "#dc-etape"); await attendre(X.page, 800);
    const sans = !(await X.page.$("#ja-carte")), dores0 = await dores(X.page), lus0 = lusJA(db, ID).length;
    await X.c.close();
    MODE = "tous";
    db = mk(); X = await contexte(b, quiP(k, META_OK()), db);
    const page = X.page;
    await page.goto(URL0 + "#/decouverte"); await pret(page, "#ja-carte"); await attendre(page, 800);
    const A = await page.evaluate(() => {
      const c = document.getElementById("ja-carte"), h = document.querySelector("#vue header.masthead"), e = document.getElementById("dc-etape");
      const t = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
      return { apresTete: !!c && !!h && h.nextElementSibling === c, avantEtape: !!c && !!e && !!(c.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING),
        h2: t(c && c.querySelector("h2")), lbl: t(c && c.querySelector(".ja-lbl")), num: t(c && c.querySelector(".ja-num")), detail: t(c && c.querySelector(".ja-detail")),
        boutons: c ? [...c.querySelectorAll("a, button")].map(x => [x.tagName.toLowerCase(), [...x.classList].sort().join("."), x.getAttribute("href"), t(x)]) : [] };
    });
    const L = lusJA(db, ID), dores1 = await dores(page);
    await capturer(page, "fr-05-accueil-prospect");
    ok("accueil du prospect : « Mon journal alimentaire » (#ja-carte) est la première carte sous l'en-tête, avant l'étape (#dc-etape) ; son journal et le calcul sont lus avec le reste (outil=in.(…journal_alimentaire…)) ; en « test », pas de carte ni de lecture",
      sans && lus0 === 0 && A.apresTete && A.avantEtape && L.length >= 1 && L.every(l => /^in\./.test(l.outil)) && liste(L[0].outil.slice(3)).includes("calc_perso"), JSON.stringify([sans, lus0, A.apresTete, A.avantEtape, L]));
    ok("la carte : « Il te reste " + frN(OBJ_CP) + " kcal » (objectif de son calculateur), « 0 sur " + frN(OBJ_CP) + " kcal » ; un seul bouton, en contour (a.btn.ghost « + Ajouter un aliment » → #/journal-alimentaire/ajouter) ; aucun bouton doré de plus qu'en « test »",
      A.h2 === "Mon journal alimentaire" && A.lbl === "Il te reste" && A.num === frN(OBJ_CP) && A.detail === "0 sur " + frN(OBJ_CP) + " kcal"
      && egal(A.boutons, [["a", "btn.ghost.ja-btn-ajout", "#/journal-alimentaire/ajouter", "+ Ajouter un aliment"]]) && !!dores0 && dores0.length >= 1 && egal(dores1, dores0), JSON.stringify([A, dores0, dores1]));
    await page.click("#ja-carte a.ja-btn-ajout");
    const ouvert = await page.waitForSelector(".modale.ja-feuille #ja-q", { timeout: 8000 }).then(() => true).catch(() => false);
    await attendre(page, 500);
    const P = await lirePanneau(page), R = await lirePage(page);
    ok("le lien ouvre la page du journal et son panneau d'ajout, au repas de l'heure (midi : « Ajouter au déjeuner ») ; adresse ramenée à #/journal-alimentaire ; rien d'écrit",
      ouvert && !!P && P.titre === "Ajouter au déjeuner" && P.focus === "ja-q" && R.hash === "#/journal-alimentaire" && R.courant === "journal-alimentaire" && (R.repas || []).length === 4 && saisies(db, ID).length === 0,
      JSON.stringify([ouvert, P && [P.titre, P.focus], R.hash, R.courant]) + " " + resumeE(db));
  });

  /* =================== G. interrupteur « test » (servi par défaut) =================== */
  await bloc("G. interrupteur « test »", async () => {
    const db = base({ cles: [[F.IDS.c1, "journal_alimentaire", JA({ [AUJ]: [[1, "poulet-blanc-grille", 150]] }), avant(H)], [TESTC.id, "journal_alimentaire", JA({ [AUJ]: [[1, "riz-blanc-cuit", 200]] }), avant(H)]] });
    let X = await contexte(b, THOMAS, db);
    await X.page.goto(URL0 + "#/accueil"); await pret(X.page, "#vue .masthead"); await attendre(X.page, 1500);
    const cfg = await X.page.evaluate(() => [CONFIG.nouveautes.journal_alimentaire, (CONFIG.nouveautes.comptes_test || []).slice()]);
    const navT = await nav(X.page), carteT = !!(await X.page.$("#ja-carte")), lusT = lusJA(db, F.IDS.c1).length;
    ok("Thomas (client hors comptes de test, interrupteur servi sur « test ») : ni onglet « Journal alimentaire » ni carte #ja-carte sur son accueil ; ses lectures de l'accueil ne nomment pas journal_alimentaire",
      cfg[0] === "test" && !cfg[1].includes(F.IDS.c1) && navT.length > 3 && !navT.includes("journal-alimentaire") && !carteT && lusT === 0, JSON.stringify([cfg, navT, carteT, lusT]));
    await aller(X.page, "#/journal-alimentaire", 1800);
    const RT = await lirePage(X.page);
    ok("Thomas : #/journal-alimentaire le renvoie ailleurs (pas de page du journal), toujours rien lu ni écrit",
      RT.courant !== "journal-alimentaire" && !(await X.page.$("#ja-vue")) && lusJA(db, F.IDS.c1).length === 0 && ecrJA(db).length === 0, JSON.stringify([RT.courant, RT.hash]));
    await X.c.close();
    X = await contexte(b, TESTC, db);
    await X.page.goto(URL0 + "#/accueil"); await pret(X.page, "#ja-carte"); await attendre(X.page, 800);
    const navC = await nav(X.page), carteC = await txt(X.page, "#ja-carte .ja-num"), lusC = lusJA(db, TESTC.id);
    await aller(X.page, "#/journal-alimentaire", 1800);
    const RC = await lirePage(X.page);
    ok("le compte de test : l'onglet (« journal-alimentaire »), la carte de l'accueil (« Il te reste " + frN(2240 - 310) + " », lue avec le reste : in.(…)) et la page (sa ligne de riz)",
      navC.includes("journal-alimentaire") && carteC === frN(2240 - 310) && lusC.some(l => /^in\./.test(l.outil)) && RC.courant === "journal-alimentaire" && nbLignes(RC) === 1 && RC.repas[1].lignes[0].nom === "Riz blanc, cuit",
      JSON.stringify([navC, carteC, lusC, RC.courant, nbLignes(RC)]));
    await X.c.close();
    X = await contexte(b, COACH, db);
    await X.page.goto(URL0 + "#/suivi-clients"); await pret(X.page, "#tb-clients"); await attendre(X.page, 800);   // v84 (ménage du bloc 3) : le tableau complet (#tb-clients) est dans « Suivi détaillé » (menu Plus)
    const navCo = await nav(X.page), n0 = db.n;
    await ouvrirFiche(X.page, F.IDS.c1, "Thomas Démo");
    const liens = await liensBandeau(X.page), fiche = !!(await X.page.$("#fiche-ja")), navF = await nav(X.page), lusF = lusJA(db, COACH.id, n0);
    await aller(X.page, "#/client/" + F.IDS.c1 + "/journal-alimentaire", 1800);
    const RF = await lirePage(X.page);
    ok("coach : pas d'onglet hors fiche ; fiche de Thomas sans lien « Son journal alimentaire », sans #fiche-ja, sans onglet, son journal jamais lu ; #/client/<Thomas>/journal-alimentaire ne l'ouvre pas ; rien d'écrit",
      !navCo.includes("journal-alimentaire") && liens.length > 5 && !liens.some(([t, h]) => t === "Son journal alimentaire" || /journal-alimentaire$/.test(h)) && !fiche && !navF.includes("journal-alimentaire") && lusF.length === 0
      && RF.courant !== "journal-alimentaire" && !(await X.page.$("#ja-vue")) && db.ecritures.length === 0, JSON.stringify([navCo, liens, fiche, navF, lusF, RF.courant]) + " " + resumeE(db));
  });

  /* =================== H. coach (« tous ») : fiche et page en lecture seule =================== */
  await bloc("H. coach : fiche et page du journal en lecture seule", async () => {
    MODE = "tous";
    const J3 = jour(3);
    const docT = JA({ [J3]: [[1, "poulet-blanc-grille", 150]], [HIER]: [[0, "yaourt-nature", 125], [0, "banane-crue", 120], [2, "oeuf-dur", 100]], [AUJ]: [[1, "poulet-blanc-grille", 150], [1, "riz-blanc-cuit", 200]] });
    const k = 3, IDP = PID(k);
    const docP = JA({ [AUJ]: [[0, "banane-crue", 120]] });
    const prospect = compte(k, { meta: META_OK(), donnees: [["calc_perso", CP, avant(2 * H)], ["repas", { cible: { kcal: 1000, prot: 90, gluc: 80, lip: 35 } }, avant(30 * J)], ["journal_alimentaire", docP, avant(H)]] });
    const db = base({ comptes: [prospect], cles: [[F.IDS.c1, "journal_alimentaire", docT, avant(H)]] });
    const kA = kcalDe(docT, AUJ), kH = kcalDe(docT, HIER), k3 = kcalDe(docT, J3);
    const sept = (fin, n, moy, obj) => `Sur les 7 jours jusqu'au ${dfr(fin)} : ${n} jour${n > 1 ? "s" : ""} rempli${n > 1 ? "s" : ""} sur 7, moyenne ${frN(moy)} kcal par jour rempli (objectif ${frN(obj)} kcal).`;
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/suivi-clients"); await pret(page, "#tb-clients"); await attendre(page, 800);   // v84 (ménage du bloc 3) : le tableau complet (#tb-clients) est dans « Suivi détaillé » (menu Plus)
    await ouvrirFiche(page, F.IDS.c1, "Thomas Démo"); await page.waitForSelector("#fiche-ja", { timeout: 6000 }).catch(() => {});
    const FJ = await page.evaluate(() => { const f = document.getElementById("fiche-ja"), t = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
      return f ? { pastille: t(f.querySelector(".pastille")), note: t(f.querySelector("p.note")), lignes: [...f.querySelectorAll("li")].map(li => [t(li.querySelector("span")), t(li.querySelector("b"))]), lien: f.querySelector("a") && f.querySelector("a").getAttribute("href") } : null; });
    const liens = await liensBandeau(page);
    await capturer(page, "fr-06-coach-fiche");
    ok("fiche de Thomas : #fiche-ja « Journal alimentaire » (« noté aujourd'hui ») : « " + sept(AUJ, 3, (kA + kH + k3) / 3, 2240) + " » ; Aujourd'hui « " + frN(kA) + " kcal / 2 240 », objectif « 2 240 kcal · ta diète » ; lien « Son journal alimentaire » dans le bandeau",
      !!FJ && FJ.pastille === "noté aujourd'hui" && FJ.note === sept(AUJ, 3, (kA + kH + k3) / 3, 2240) && valeurFiche(FJ, "Aujourd'hui") === frN(kA) + " kcal / 2 240" && valeurFiche(FJ, "Objectif") === "2 240 kcal · ta diète"
      && liens.some(([t, h]) => t === "Son journal alimentaire" && h === "#/client/" + F.IDS.c1 + "/journal-alimentaire"), JSON.stringify([FJ, liens]));
    await page.click('#vue .bandeau-actions a[href$="/journal-alimentaire"]');
    await page.waitForSelector(".ja-repas", { timeout: 8000 }); await attendre(page, 800);
    const R0 = await lirePage(page);
    const bout = await page.evaluate(() => ({ ajout: document.querySelectorAll("[data-ja-ajout], [data-ja-menu], button.ja-ligne, #ja-calc").length, div: document.querySelectorAll("div.ja-ligne").length, lectureOk: ["ja-prec", "ja-suiv"].every(i => document.getElementById(i).hasAttribute("data-lecture-ok")) }));
    await capturer(page, "fr-07-coach-page", true);
    ok("« Son journal alimentaire » : #vue.lecture-seule, titre « Son journal alimentaire » ; aucun [data-ja-ajout], [data-ja-menu], button.ja-ligne ; ses 2 lignes du jour (div) ; « Il lui reste " + frN(2240 - kA) + " » ; résumé « " + sept(AUJ, 3, (kA + kH + k3) / 3, 2240) + " »",
      R0.lecture && R0.h1 === "Son journal alimentaire" && bout.ajout === 0 && bout.div === 2 && bout.lectureOk && R0.lbl === "Il lui reste" && R0.num === frN(2240 - kA) && R0.sept === sept(AUJ, 3, (kA + kH + k3) / 3, 2240) && R0.hash === "#/client/" + F.IDS.c1 + "/journal-alimentaire",
      JSON.stringify([R0.lecture, R0.h1, bout, R0.lbl, R0.num, R0.sept, R0.hash]));
    await page.click("#ja-prec"); await attendre(page, 400);
    const R1 = await lirePage(page);
    ok("‹ (data-lecture-ok) : « Hier », ses 3 lignes ; le résumé suit le jour affiché : « " + sept(HIER, 2, (kH + k3) / 2, 2240) + " »",
      R1.jour === "Hier" && nbLignes(R1) === 3 && R1.sept === sept(HIER, 2, (kH + k3) / 2, 2240) && R1.suivOff === false, JSON.stringify([R1.jour, nbLignes(R1), R1.sept]));
    const force = await page.evaluate(() => Store.ecrire("journal_alimentaire", { v: 1, a: [], j: {} }));
    await attendre(page, 1400);
    ok("aucune écriture (fiche, page, navigation) ; Store.ecrire(\"journal_alimentaire\", …) forcé dans la fiche → false, rien d'écrit, son journal intact",
      force === false && db.ecritures.length === 0 && memes(contenuDe(db, F.IDS.c1, "journal_alimentaire"), docT), String(force) + " " + resumeE(db));
    /* la fiche d'un prospect (ancien client : une diète de 1 000 kcal, ignorée) */
    await aller(page, "#/clients", 1500);
    await ouvrirFiche(page, IDP, "Léa Martin"); await page.waitForSelector("#fiche-ja", { timeout: 6000 }).catch(() => {});
    const FP = await page.evaluate(() => { const f = document.getElementById("fiche-ja"), t = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
      return f ? { note: t(f.querySelector("p.note")), lignes: [...f.querySelectorAll("li")].map(li => [t(li.querySelector("span")), t(li.querySelector("b"))]) } : null; });
    const kP = kcalDe(docP, AUJ);
    ok("fiche d'un prospect : #fiche-ja avec l'objectif de SON calculateur (" + frN(OBJ_CP) + " kcal · son calculateur ; sa diète de 1 000 kcal ignorée) : « " + sept(AUJ, 1, kP, OBJ_CP) + " »",
      !!FP && FP.note === sept(AUJ, 1, kP, OBJ_CP) && valeurFiche(FP, "Aujourd'hui") === frN(kP) + " kcal / " + frN(OBJ_CP) && valeurFiche(FP, "Objectif") === frN(OBJ_CP) + " kcal · son calculateur", JSON.stringify(FP));
    await page.click('#vue .bandeau-actions a[href$="/journal-alimentaire"]');
    await page.waitForSelector(".ja-repas", { timeout: 8000 }); await attendre(page, 800);
    const RP = await lirePage(page), nbB = await page.evaluate(() => document.querySelectorAll("[data-ja-ajout], [data-ja-menu], button.ja-ligne").length);
    await page.click("#ja-prec"); await attendre(page, 300);
    const RP1 = await lirePage(page);
    const forceP = await page.evaluate(() => Store.ecrire("journal_alimentaire", { v: 1, a: [], j: {} }));
    await attendre(page, 1400);
    ok("sa page : lecture seule (aucun bouton d'ajout ni ligne touchable), « Il lui reste " + frN(OBJ_CP - kP) + " », résumé exact, ‹ fonctionne (hier : rien de noté) ; écriture forcée → false ; zéro écriture dans tout le bloc",
      RP.lecture && nbB === 0 && RP.lbl === "Il lui reste" && RP.num === frN(OBJ_CP - kP) && RP.sept === sept(AUJ, 1, kP, OBJ_CP) && RP1.jour === "Hier" && nbLignes(RP1) === 0 && RP1.sept === `Aucun repas noté sur les 7 jours jusqu'au ${dfr(HIER)}.`
      && forceP === false && db.ecritures.length === 0 && memes(contenuDe(db, IDP, "journal_alimentaire"), docP), JSON.stringify([RP.lecture, nbB, RP.lbl, RP.num, RP.sept, RP1.jour, RP1.sept, forceP]) + " " + resumeE(db));
  });

  /* =================== I. anglais 390 px, largeurs 320 / 390 px, zones de toucher =================== */
  await bloc("I. anglais, largeurs, zones de toucher", async () => {
    const largeurs = [];
    const mesurer = async (page, nom) => { for (const v of [MOBILE, ETROIT]) { await page.setViewportSize(v); await attendre(page, 250); const L = await largeurOk(page); largeurs.push([nom + "@" + v.width, L.ok, L.x]); } await page.setViewportSize(MOBILE); await attendre(page, 150); };
    /* anglais */
    const db = base({ en: true });
    const { page } = await contexte(b, TESTC, db, { langue: "en" });
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 1200);
    const R0 = await lirePage(page), t0 = await textesEcran(page);
    await capturer(page, "en-01-vide", true);
    await mesurer(page, "en-vide");
    ok("anglais : « Remaining 2,240 Cal », « 0 of 2,240 Cal », « Today », « Breakfast », « Lunch », « Dinner », « Snacks », « + Add », « Nothing logged yet. » ; aucun mot français (" + MOTS_FR.join(", ") + ")",
      R0.lbl === "Remaining" && R0.num === "2,240" && R0.unite === "Cal" && R0.detail === "0 of 2,240 Cal" && R0.jour === "Today" && egal(R0.repas.map(x => x.h2), ["Breakfast", "Lunch", "Dinner", "Snacks"])
      && R0.repas.every(x => x.ajout === "+ Add" && x.vide === "Nothing logged yet.") && motsFr(t0).length === 0, JSON.stringify([R0.lbl, R0.num, R0.unite, R0.detail, R0.jour, R0.repas && R0.repas.map(x => [x.h2, x.ajout, x.vide]), motsFr(t0)]));
    await page.click('[data-ja-ajout="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-q");
    await suivreTitres(page, "Most common", 10000);
    const P0 = await lirePanneau(page), t1 = await textesEcran(page);
    await capturer(page, "en-02-panneau");
    await mesurer(page, "en-panneau");
    const P1 = await chercher(page, "chicken"), top3 = P1 ? P1.res.slice(0, 3).map(x => x.nom) : [];
    const nomPoulet = top3.find(n => n === "Grilled chicken breast") || top3.find(n => /^Chicken breast\b/.test(n));
    ok("anglais, panneau : « Add to lunch », « Most common » ; « chicken » → « Grilled chicken breast » ou « Chicken breast… » dans les 3 premiers ; aucun mot français",
      !!P0 && P0.titre === "Add to lunch" && P0.resTitre === "Most common" && motsFr(t1).length === 0 && !!nomPoulet && motsFr(await textesEcran(page)).length === 0, JSON.stringify([P0 && [P0.titre, P0.resTitre], motsFr(t1), top3]));
    const choisi = nomPoulet ? await choisir(page, nomPoulet) : false;
    const P2 = await lirePanneau(page), t2 = await textesEcran(page);
    await capturer(page, "en-03-portion");
    await mesurer(page, "en-portion");
    const zP = { past: await zones(page, ".ja-past"), ok: await zones(page, "#ja-ok") };
    ok("anglais, portion : « Add », « Serving », « Cal per 100 g », « Protein … · Carbs … · Fat … » ; aucun mot français",
      choisi && !!P2 && P2.ok === "Add" && /^\d[\d,]* Cal per 100 g$/.test(P2.par100 || "") && /^Protein .* g · Carbs .* g · Fat .* g$/.test(P2.pgl || "") && motsFr(t2).length === 0
      && await page.$eval('.ja-pastilles', e => e.getAttribute("aria-label")) === "Serving", JSON.stringify([choisi, P2 && [P2.ok, P2.par100, P2.pgl, P2.past], motsFr(t2)]));
    await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400);
    const R1 = await lirePage(page), t3 = await textesEcran(page);
    await capturer(page, "en-04-rempli", true);
    await mesurer(page, "en-rempli");
    await page.click('[data-ja-ajout="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-q"); await attendre(page, 500);
    const P3 = await lirePanneau(page), t4 = await textesEcran(page);
    await page.keyboard.press("Escape"); await panneauFerme(page);
    const zPage = { ajout: await zones(page, "[data-ja-ajout]"), menu: await zones(page, "[data-ja-menu]"), prec: await zones(page, "#ja-prec"), suiv: await zones(page, "#ja-suiv") };
    ok("anglais, après l'ajout : la ligne « " + nomPoulet + " » (nom anglais), « Remaining » ; panneau rouvert : « Recent » ; aucun mot français ; une écriture du journal",
      nbLignes(R1) === 1 && R1.repas[1].lignes[0].nom === nomPoulet && R1.lbl === "Remaining" && motsFr(t3).length === 0 && !!P3 && P3.resTitre === "Recent" && P3.titre === "Add to breakfast" && motsFr(t4).length === 0 && ecrJA(db, TESTC.id).length === 1,
      JSON.stringify([R1.repas && R1.repas[1].lignes, R1.lbl, motsFr(t3), P3 && [P3.titre, P3.resTitre], motsFr(t4)]));
    /* français : page remplie, panneau, portion, ligne */
    const doc = JA({ [AUJ]: [[0, "pain-blanc-par-ex-baguette-boule", 50], [0, "beurre-a-80-mg-minimum-doux", 10], [1, "poulet-blanc-grille", 150], [1, "riz-blanc-cuit", 200], [3, "banane-crue", 120], [3, -1, 180]] });
    const db2 = base({ cles: [[TESTC.id, "journal_alimentaire", doc, avant(H)]] });
    const Y = await contexte(b, TESTC, db2);
    await Y.page.goto(URL0 + "#/journal-alimentaire"); await pret(Y.page, ".ja-ligne"); await attendre(Y.page, 800);
    await mesurer(Y.page, "fr-rempli");
    await Y.page.click('[data-ja-ajout="2"]'); await Y.page.waitForSelector(".modale.ja-feuille #ja-q"); await suivreTitres(Y.page, "Récents", 6000);
    await mesurer(Y.page, "fr-panneau");
    await chercher(Y.page, "oeuf"); const nomOeuf = (await Y.page.$$eval(".ja-res-l b", l => l.map(b => b.textContent.trim())))[0];
    await choisir(Y.page, nomOeuf);
    await mesurer(Y.page, "fr-portion");
    const zP2 = { past: await zones(Y.page, ".ja-past"), ok: await zones(Y.page, "#ja-ok") };
    await Y.page.keyboard.press("Escape"); await panneauFerme(Y.page);
    await Y.page.click('.ja-ligne[data-ja-k="2"]'); await Y.page.waitForSelector(".modale.ja-feuille #ja-suppr");
    await mesurer(Y.page, "fr-ligne");
    await Y.page.keyboard.press("Escape"); await panneauFerme(Y.page);
    await Y.page.click('[data-ja-menu="3"]'); await Y.page.waitForSelector(".modale.ja-feuille #ja-copier");
    await mesurer(Y.page, "fr-menu");
    ok("largeur : rien ne déborde (document.documentElement.scrollWidth ≤ largeur) à 390 et 320 px, en anglais (page vide et remplie, panneau, portion) et en français (page remplie, panneau, portion, ligne, menu)",
      largeurs.length === 18 && largeurs.every(x => x[1]), JSON.stringify(largeurs.filter(x => !x[1]).concat([largeurs.length])));
    const tout = [["ajout", zPage.ajout], ["menu", zPage.menu], ["prec", zPage.prec], ["suiv", zPage.suiv], ["past", zP.past.concat(zP2.past)], ["ok", zP.ok.concat(zP2.ok)]];
    ok("zones de toucher d'au moins 44 × 44 px : « + Add » [data-ja-ajout] (4), menu [data-ja-menu] (4), ‹ #ja-prec, › #ja-suiv, pastilles de portion .ja-past, #ja-ok",
      tout.every(([, l]) => l.length >= 1 && l.every(([w, h]) => w >= 44 && h >= 44)) && zPage.ajout.length === 4 && zPage.menu.length === 4, JSON.stringify(tout));
  });

  /* =================== J. traductions =================== */
  await bloc("J. traductions", async () => {
    const db = base();
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas");
    const i18n = fs.readFileSync(path.join(RACINE, "js", "i18n.js"), "utf8");
    const debut = i18n.indexOf("/* v79 "), corps = debut > -1 ? i18n.slice(debut, i18n.indexOf("});", debut)) : "";
    const cles = Array.from(corps.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*"/gm), m => JSON.parse('"' + m[1] + '"'));
    const manquentBloc = await page.evaluate(l => l.filter(k => !(typeof I18N.en[k] === "string" && I18N.en[k].trim())), cles);
    ok("le bloc « v79 » de js/i18n.js (" + cles.length + " clés) : chacune est dans I18N.en, non vide", cles.length >= 40 && manquentBloc.length === 0, JSON.stringify([cles.length, manquentBloc]));
    const src = fs.readFileSync(path.join(RACINE, "js", "outilJournalAlimentaire.js"), "utf8");
    const lit = new Set();
    for (const m of src.matchAll(/\b(?:trad|T)\("((?:[^"\\]|\\.)*)"/g)) lit.add(JSON.parse('"' + m[1] + '"'));
    for (const m of src.matchAll(/\bfl\("[^"]*", "[^"]*", "([^"]+)"\)/g)) lit.add(m[1]);                       // ‹ et › (aria-label)
    for (const m of src.matchAll(/\["[pgl]", "([^"]+)", "--s\d"\]/g)) lit.add(m[1]);                           // Protéines, Glucides, Lipides
    const tableaux = await page.evaluate(() => JournalAlim.REPAS.concat(JournalAlim.AJOUT_A));                   // trad(J.REPAS[r]), trad(J.AJOUT_A[r])
    tableaux.forEach(x => lit.add(x));
    const manquent = await page.evaluate(l => l.filter(k => !(typeof I18N.en[k] === "string" && I18N.en[k].trim())), [...lit]);
    ok("chaque texte traduit de js/outilJournalAlimentaire.js (" + lit.size + " : trad() et T() littéraux, repas, « Ajouter au … », macros, flèches) a son entrée anglaise",
      lit.size >= 50 && manquent.length === 0, JSON.stringify([lit.size, manquent]));
  });

  /* =================== K. données piégées =================== */
  await bloc("K. données piégées", async () => {
    const NOM = "<img src=x onerror=window.__pwn=1>";
    const piege = { v: "x", a: [["piege-1", 141, 30, 0, 2, NOM], "x", null, ["piege-2", "abc", 1, 1, 1, "kcal en texte"], ["piege-3", 5000, 1, 1, 1, "trop de kcal"], { id: "objet" }, ["", 1, 1, 1, 1, "sans id"], ["piege-4", -5, 1, 1, 1, "négatif"]],
      j: { [AUJ]: [[1, 0, 150], [9, 0, 100], [1, 99, 100], [1, 0, -50], ["1", 0, 100], { r: 1 }, null, "ligne", [1, 1, 100], [1, 2, 100], [1, 3, 100], [1, 4, 100], [1, 5, 100], [1, 6, 100], [1, 7, 100],
        [0, -1, 20000], [0, -1, 300], [1, 0, "100"], [1, 0, 4000], [1.5, 0, 100], [1, 0.5, 100], [1, 0, 0], [3, -1, -10]],
        "2026-13-45": [[1, 0, 100]], "pas-une-date": [[1, 0, 100]], [HIER]: "pas une liste", [jour(2)]: [[2, 0, 100]], "<script>alert(1)</script>": [[1, 0, 100]] } };
    const total = 141 * 1.5 + 300;
    const db = base({ cles: [[TESTC.id, "journal_alimentaire", piege, avant(H)]] });
    const e0 = ERREURS.length;
    let X = await contexte(b, TESTC, db);
    let page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 1500);
    const injecte = () => page.evaluate(() => ({ pwn: typeof window.__pwn, img: document.querySelectorAll("img[src='x'], #vue img, .modale img").length, script: document.querySelectorAll("#vue script").length })).catch(e => ({ erreur: String(e) }));
    const R = await lirePage(page), I0 = await injecte();
    await page.click('[data-ja-ajout="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-q"); await attendre(page, 800);
    const P = await lirePanneau(page), I1 = await injecte();
    await page.keyboard.press("Escape"); await panneauFerme(page);
    await page.click("#ja-prec"); await attendre(page, 200); const Rh = await lirePage(page);
    await page.click("#ja-prec"); await attendre(page, 200); const R2 = await lirePage(page);
    ok("client, journal piégé (nom avec balise, lignes et aliments illisibles, dates invalides) : la page s'affiche avec les 2 seules lignes lisibles (nom piégé en texte, ajout rapide 300), total exact (« Il te reste " + frN(2240 - total) + " ») ; hier illisible = rien de noté, avant-hier lisible ; panneau « Récents » sans injection ; window.__pwn indéfini, aucune image ; aucune écriture",
      nbLignes(R) === 2 && R.repas[1].lignes[0].nom === NOM && R.repas[0].lignes[0].nom === "Ajout rapide" && R.repas[0].lignes[0].kcal === "300" && R.num === frN(2240 - total)
      && nbLignes(Rh) === 0 && Rh.jour === "Hier" && nbLignes(R2) === 1 && !!P && P.resTitre === "Récents" && P.res.length === 1 && P.res[0].nom === NOM
      && I0.pwn === "undefined" && I0.img === 0 && I1.pwn === "undefined" && I1.img === 0 && saisies(db, TESTC.id).length === 0,
      JSON.stringify([R.repas && R.repas.map(x => x.lignes.map(l => [l.nom, l.kcal])), R.num, nbLignes(Rh), nbLignes(R2), P && [P.resTitre, P.res], I0, I1]) + " " + resumeE(db));
    await aller(page, "#/accueil", 1800); await page.waitForSelector("#ja-carte", { timeout: 6000 }).catch(() => {});
    const carte = await txt(page, "#ja-carte .ja-num"), I2 = await injecte();
    ok("client, accueil : la carte du journal avec le même total (« " + frN(2240 - total) + " »), rien d'injecté, aucune écriture", carte === frN(2240 - total) && I2.pwn === "undefined" && I2.img === 0 && saisies(db, TESTC.id).length === 0, JSON.stringify([carte, I2]) + " " + resumeE(db));
    await X.c.close();
    X = await contexte(b, COACH, db); page = X.page;
    await page.goto(URL0 + "#/suivi-clients"); await pret(page, "#tb-clients"); await attendre(page, 600);   // v84 (ménage du bloc 3) : le tableau complet (#tb-clients) est dans « Suivi détaillé » (menu Plus)
    await ouvrirFiche(page, TESTC.id, "Test Démo"); await page.waitForSelector("#fiche-ja", { timeout: 6000 }).catch(() => {});
    const fiche = await txt(page, "#fiche-ja"), I3 = await injecte();
    await page.click('#vue .bandeau-actions a[href$="/journal-alimentaire"]'); await page.waitForSelector(".ja-repas", { timeout: 8000 }); await attendre(page, 800);
    const RC = await lirePage(page), I4 = await injecte();
    ok("coach (compte de test en « test ») : fiche (#fiche-ja, « " + frN(total) + " kcal / 2 240 ») et page en consultation (2 lignes, nom piégé en texte) : rien d'injecté, aucune écriture ; aucune erreur JS ni de console pendant le bloc",
      !!fiche && fiche.includes(frN(total) + " kcal / 2 240") && I3.pwn === "undefined" && I3.img === 0 && nbLignes(RC) === 2 && RC.repas[1].lignes[0].nom === NOM && RC.lecture && I4.pwn === "undefined" && I4.img === 0
      && saisies(db).length === 0 && ERREURS.length === e0, JSON.stringify([fiche, I3, nbLignes(RC), I4, ERREURS.slice(e0)]) + " " + resumeE(db));
  });

  /* =================== L. plancher du calculateur =================== */
  await bloc("L. plancher du calculateur", async () => {
    const db = base({ cles: [[TESTC.id, "repas", Object.assign(clone(REPAS_T), { cible: { kcal: 1000, prot: 90, gluc: 80, lip: 35 } }), avant(10 * J)]] });
    let X = await contexte(b, THOMAS, db), page = X.page;
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    const remplir = async (s, age, taille, poids, pas, heures) => {
      await page.click(`#sexe [data-v="${s}"]`);
      for (const [id, v] of [["age", age], ["taille", taille], ["poids", poids], ["pas", pas], ["heures", heures]]) await page.fill("#" + id, String(v));
      await page.click('#objs [data-k="perte"]'); await attendre(page, 500);
      return page.evaluate(() => ({ perte: document.getElementById("v-perte").textContent.replace(/[  ]/g, " ").trim(), maintien: document.getElementById("v-maintien").textContent.replace(/[  ]/g, " ").trim(),
        cache: document.getElementById("calc-plancher").hidden, phrase: document.getElementById("calc-plancher").textContent.replace(/[  ]/g, " ") }));
    };
    const Fm = await remplir("F", 60, 155, 48, 2000, 0);
    const PHRASE = "Ton objectif est relevé : un objectif calculé ne descend jamais sous 1 200 kcal par jour pour une femme, ni sous 1 500 kcal pour un homme. En dessous, c'est trop peu pour tenir sans suivi médical.";
    ok("calculateur du client (calc_perso) : femme, 48 kg, 155 cm, 60 ans, 2 000 pas, 0 h, perte → « 1 200 » (au lieu de " + frN((10 * 48 + 6.25 * 155 - 5 * 60 - 161) * 1.23 * 0.9) + ") et #calc-plancher visible : « " + PHRASE + " »",
      Fm.perte === "1 200" && Fm.cache === false && norm(Fm.phrase) === PHRASE, JSON.stringify(Fm));
    const Hm = await remplir("H", 30, 180, 80, 8000, 3);
    ok("homme, 80 kg, 180 cm, 30 ans, 8 000 pas, 3 h, perte → " + frN((10 * 80 + 6.25 * 180 - 5 * 30 + 5) * 1.41 * 0.9) + ", #calc-plancher caché",
      Hm.perte === frN((10 * 80 + 6.25 * 180 - 5 * 30 + 5) * 1.41 * 0.9) && Hm.cache === true, JSON.stringify(Hm));
    await X.c.close();
    X = await contexte(b, TESTC, db); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 800);
    const R = await lirePage(page);
    const O = await page.evaluate(() => {
      const femme = { sexe: "F", age: 60, taille: 155, poids: 48, pas: 2000, heures: 0, objectif: "perte" };
      return { coach: JournalAlim.objectif({ repas: { cible: { kcal: 1000, prot: 90, gluc: 80, lip: 35 } }, calc_perso: femme }, false), prospect: JournalAlim.objectif({ calc_perso: femme }, true), calcul: outilCalculateur.objectif(femme) };
    });
    ok("objectif fixé par le coach (repas.cible 1 000 kcal) jamais relevé : JournalAlim.objectif → 1 000 (source coach, sans plancher) et la page affiche « Il te reste 1 000 » ; un calcul (femme ci-dessus) → 1 200 avec plancher",
      !!O.coach && O.coach.kcal === 1000 && O.coach.source === "coach" && O.coach.plancher === false && R.num === "1 000" && R.detail === "0 sur 1 000 kcal"
      && !!O.prospect && O.prospect.kcal === 1200 && O.prospect.plancher === true && !!O.calcul && O.calcul.kcal === 1200, JSON.stringify([O, R.num, R.detail]));
  });

  /* =================== M. Mes clients : le journal ne se télécharge pas, sa date compte =================== */
  await bloc("M. Mes clients", async () => {
    const lignesJulien = async (avecJA) => {
      const db = base({ cles: avecJA ? [[F.IDS.c3, "journal_alimentaire", JA({ [AUJ]: [[1, "poulet-blanc-grille", 150]] }), avant(2 * H)]] : [] });
      const { c, page } = await contexte(b, COACH, db, { viewport: ORDI });
      /* v84 (ménage du bloc 3) : l'ancien « Mes clients » est réparti : la liste « Clients » (#/clients, qui lit aussi par
         Clients.charger()) est ouverte d'abord, puis « Suivi détaillé » ; les lectures relevées (ok ci-dessous) couvrent les deux */
      await page.goto(URL0 + "#/clients"); await pret(page, "#lc-clients #lc-liste li"); await attendre(page, 1000);
      await aller(page, "#/suivi-clients", 400); await pret(page, "#tb-clients [data-ouvrir]"); await attendre(page, 1000);   // v84 (ménage du bloc 3) : le tableau complet et ses lignes ([data-ouvrir], Activité, feu) sont dans « Suivi détaillé » (menu Plus)
      const l = await page.$eval(`[data-ouvrir="${F.IDS.c3}"]`, bt => { const tr = bt.closest("tr"), t = x => x ? x.textContent.replace(/\s+/g, " ").trim() : null; return { activite: t(tr.querySelector('[data-l="Activité"]')), feu: tr.querySelector(".point") ? tr.querySelector(".point").getAttribute("title") : null }; }).catch(e => ({ erreur: String(e) }));
      await c.close();
      return { db, l };
    };
    const A = await lignesJulien(true), Bt = await lignesJulien(false);
    const L = A.db.lectures.filter(x => x.par === COACH.id && !x.uid);
    const groupee = L.find(x => /^not\.in\./.test(x.outil) && x.select === "user_id,outil,contenu,maj_le");
    const legere = L.find(x => x.outil === "eq.journal_alimentaire");
    ok("lectures de Mes clients : la lecture groupée exclut le journal (not.in.(…, journal_alimentaire)) ; une lecture légère outil=eq.journal_alimentaire&select=user_id,outil,maj_le ; le contenu d'aucun journal n'est téléchargé",
      !!groupee && liste(groupee.outil.slice(7)).includes("journal_alimentaire") && !!legere && legere.select === "user_id,outil,maj_le" && !L.some(x => litJA(x.outil) && /contenu|\*/.test(x.select)) && A.db.ecritures.length === 0,
      JSON.stringify(L.map(x => [x.outil, x.select])));
    ok("Julien (dernière saisie il y a 12 jours) qui a noté son journal il y a 2 h : pas « Inactif » (activité « aujourd'hui ») ; témoin sans ce journal : « 12 j », « Inactif depuis 12 j »",
      A.l.activite === "aujourd'hui" && !/Inactif/.test(A.l.feu || "") && Bt.l.activite === "12 j" && /Inactif depuis 12 j/.test(Bt.l.feu || ""), JSON.stringify([A.l, Bt.l]));
  });

  /* =================== N. taille d'un an d'usage soutenu =================== */
  await bloc("N. taille d'un an", async () => {
    const db = base();
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas");
    const N = await page.evaluate(async () => {
      const cat = await Catalogue.aliments();
      let s = 84; const alea = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;   // tirage reproductible
      const pris = [], vus = new Set();
      while (pris.length < 300) { const a = cat[Math.floor(alea() * cat.length)]; if (a && !vus.has(a.id)) { vus.add(a.id); pris.push(a); } }
      const JA = JournalAlim.vide(), GR = [12.5, 30, 45, 62.5, 80, 100, 125, 150, 180, 200, 250, 330, 437.5];
      let refus = 0, lignes = 0, d = aujourdhui();
      for (let n = 0; n < 365; n++, d = JournalAlim.decaler(d, -1))
        for (let k = 0; k < 20; k++) { const a = pris[Math.floor(alea() * pris.length)], g = GR[Math.floor(alea() * GR.length)] + (alea() < 0.3 ? Math.floor(alea() * 40) : 0); if (JournalAlim.ajouter(JA, d, k % 4, a, g) < 0) refus++; else lignes++; }
      /* le texte de Postgres (jsonb::text) : « , » et « : » suivis d'une espace, hors des chaînes */
      const pg = v => Array.isArray(v) ? "[" + v.map(pg).join(", ") + "]" : v && typeof v === "object" ? "{" + Object.keys(v).map(k => JSON.stringify(k) + ": " + pg(v[k])).join(", ") + "}" : JSON.stringify(v);
      const relu = Forme.cle("journal_alimentaire", JSON.parse(JSON.stringify(JA)));
      return { refus, lignes, jours: Object.keys(JA.j).length, aliments: JA.a.length, octets: new TextEncoder().encode(pg(JA)).length, compact: new TextEncoder().encode(JSON.stringify(JA)).length, identique: JSON.stringify(relu) === JSON.stringify(JA) };
    });
    ok("un an d'usage soutenu construit dans la page avec JournalAlim.ajouter (365 jours × 20 lignes, 300 aliments du catalogue, grammes variés) : les 7 300 lignes acceptées, 300 aliments rangés une fois chacun ; relu par Forme.cle sans rien perdre",
      N.refus === 0 && N.lignes === 7300 && N.jours === 365 && N.aliments === 300 && N.identique === true, JSON.stringify(N));
    info("taille un an : " + N.octets + " octets au format de Postgres (" + N.compact + " en JSON compact)");
    ok("taille d'un an au format de Postgres (jsonb, « , » et « : » suivis d'une espace) : " + N.octets + " octets, sous le plafond prospect de 262 144 octets (256 Ko)", N.octets > 0 && N.octets < 262144, JSON.stringify(N));
  });

  /* =================== P. recherche (les 13 essais du matériel, sur le vrai catalogue) =================== */
  await bloc("P. recherche", async () => {
    const db = base();
    const { page } = await contexte(b, TESTC, db);
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas");
    const S = await page.evaluate(async () => {
      const cat = await Catalogue.aliments(), c = (q, n) => JournalAlim.chercher(cat, q, n || 5).map(a => a.id);
      return { n: cat.length, norm: JournalAlim.normaliser("Œuf À la Coque"), sing: ["pommes", "noix", "jus"].map(m => JournalAlim.singulier(m)), dist: JournalAlim.distance("poulte", "poulet", 2),
        poulet: c("poulet"), oeuf: c("oeuf"), oeufs: c("œufs"), bananne: c("bananne"), yahourt: c("yahourt"), pates: c("pates"), steack: c("steack haché"), pdt: c("pdt"), carottes: c("carottes"), camem: c("camem"), vide: [c(""), c("   "), c(" , ; ")] };
    });
    ok("normaliser(\"Œuf À la Coque\") = \"oeuf a la coque\"", S.norm === "oeuf a la coque", S.norm);
    ok("singulier : pommes → pomme, noix → noix, jus → jus", egal(S.sing, ["pomme", "noix", "jus"]), JSON.stringify(S.sing));
    ok("distance(\"poulte\", \"poulet\", 2) = 1 (inversion de deux lettres)", S.dist === 1, String(S.dist));
    ok("« poulet » → poulet-blanc-grille dans les 3 premiers (catalogue de " + S.n + " aliments)", S.poulet.slice(0, 3).includes("poulet-blanc-grille"), JSON.stringify(S.poulet));
    ok("« oeuf » et « œufs » : le même premier résultat", !!S.oeuf[0] && S.oeuf[0] === S.oeufs[0], JSON.stringify([S.oeuf, S.oeufs]));
    ok("« bananne » (faute de frappe) → banane-crue dans les 3 premiers", S.bananne.slice(0, 3).includes("banane-crue"), JSON.stringify(S.bananne));
    ok("« yahourt » → yaourt-nature en premier", S.yahourt[0] === "yaourt-nature", JSON.stringify(S.yahourt));
    ok("« pates » → pates-cuites en premier", S.pates[0] === "pates-cuites", JSON.stringify(S.pates));
    ok("« steack haché » → un steak haché de bœuf en premier (boeuf-steak-hache…)", /^boeuf-steak-hache/.test(S.steack[0] || ""), JSON.stringify(S.steack));
    ok("« pdt » (synonyme) → une pomme de terre en premier (pomme-de-terre…)", /^pomme-de-terre/.test(S.pdt[0] || ""), JSON.stringify(S.pdt));
    ok("« carottes » (pluriel) → carotte-crue en premier", S.carottes[0] === "carotte-crue", JSON.stringify(S.carottes));
    ok("« camem » (début de mot) → un camembert dans les 5 premiers", S.camem.slice(0, 5).some(id => /^camembert/.test(id)), JSON.stringify(S.camem));
    ok("requête vide (\"\", espaces, ponctuation) → []", S.vide.every(x => Array.isArray(x) && x.length === 0), JSON.stringify(S.vide));
  });

  /* =================== Q. corrections de la relecture (v79) =================== */
  await bloc("Q. corrections de la relecture", async () => {
    const MSG_AUTRE = "Ton journal a changé sur un autre appareil : il vient d'être rechargé.";
    const toasts = page => page.$$eval(".toast", l => l.map(t => t.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim())).catch(() => []);
    const toastsJA = page => page.$$eval(".toast.ja-toast", l => l.length).catch(() => -1);
    /* la liste du panneau : champ, titre, résultats, message, bouton « Ajout rapide de kcal » (affiché = rendu à l'écran) */
    const etatListe = page => page.evaluate(() => {
      const t = e => e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null, $i = i => document.getElementById(i), h = $i("ja-res-titre"), v = $i("ja-vers-rapide");
      return { q: $i("ja-q") ? $i("ja-q").value : null, titre: h ? (h.hidden ? "" : t(h)) : null, n: document.querySelectorAll(".ja-res-l").length,
        noms: [...document.querySelectorAll(".ja-res-l b")].slice(0, 3).map(t), etat: t($i("ja-f-etat")),
        rapide: v ? { hidden: v.hidden, affiche: v.getClientRects().length > 0 && getComputedStyle(v).display !== "none" && getComputedStyle(v).visibility !== "hidden" } : null,
        rk: !!$i("ja-rk"), retour: t($i("ja-retour")) };
    }).catch(() => null);
    const croix = page => page.$$eval(".modale.ja-feuille .fermer-volet", l => l.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; })).catch(() => []);
    const fermerParCroix = async page => { await page.click(".modale.ja-feuille .fermer-volet"); return panneauFerme(page); };

    /* ----- 1, 4, 6, 8 : recherche, croix, grammes et kcal trop petits (compte de test, journal vide) ----- */
    let db = base();
    let X = await contexte(b, TESTC, db), page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 600);
    const zAjout = await zones(page, "[data-ja-ajout]");
    await page.click('[data-ja-ajout="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-q");
    await suivreTitres(page, "Les plus courants", 10000);
    const S0 = await etatListe(page);
    const Pthe = await chercher(page, "thé"), ids = await page.evaluate(async () => JournalAlim.chercher(await Catalogue.aliments(), "thé", 3).map(a => a.id));
    const Sthe = await etatListe(page);
    ok("« thé » : un thé (« Thé noir » ou « Thé vert » : the-noir-infuse-sans-sucres-ajoutes / the-vert-infuse-sans-sucres-ajoutes de js/journalAliments.js) dans les 3 premiers",
      !!Pthe && Pthe.resTitre === "" && Pthe.res.slice(0, 3).some(x => x.nom === "Thé noir" || x.nom === "Thé vert") && ids.some(i => i === "the-noir-infuse-sans-sucres-ajoutes" || i === "the-vert-infuse-sans-sucres-ajoutes"),
      JSON.stringify([Pthe && Pthe.res.slice(0, 5), ids]));
    await page.fill("#ja-q", "p");
    await page.waitForFunction(() => { const h = document.getElementById("ja-res-titre"); return !!h && !h.hidden && document.querySelectorAll(".ja-res-l").length > 0; }, null, { timeout: 6000 }).catch(() => {});
    await attendre(page, 400); const Sp = await etatListe(page);
    await page.fill("#ja-q", "la"); await attendre(page, 500); const Sla = await etatListe(page);
    ok("« p » (une lettre) et « la » (mot vide) : la liste d'accueil (« Les plus courants », 10 aliments : rien de noté), jamais « Aucun aliment trouvé »",
      [Sp, Sla].every((x, i) => !!x && x.q === ["p", "la"][i] && x.titre === "Les plus courants" && x.n === 10 && !/Aucun aliment/.test(x.etat || "")), JSON.stringify([Sp, Sla]));
    ok("le bouton « Ajout rapide de kcal » (#ja-vers-rapide) n'apparaît qu'après une recherche : sur la liste d'accueil (à l'ouverture, « p », « la ») il est caché (hidden) ET absent de l'écran ; après « thé », hidden retiré",
      [S0, Sp, Sla].every(x => !!x && !!x.rapide && x.rapide.hidden === true && x.rapide.affiche === false) && !!Sthe && !!Sthe.rapide && Sthe.rapide.hidden === false,
      JSON.stringify({ ouverture: S0 && S0.rapide, the: Sthe && Sthe.rapide, p: Sp && Sp.rapide, la: Sla && Sla.rapide }));
    await page.fill("#ja-q", "zzqx");
    await page.waitForFunction(() => { const e = document.getElementById("ja-f-etat"); return !!e && /Aucun aliment/.test(e.textContent); }, null, { timeout: 8000 }).catch(() => {});
    await attendre(page, 300);
    const Sz = await etatListe(page);
    ok("« zzqx » (sans résultat) : aucune ligne, « Aucun aliment trouvé. Essaie un autre mot. », bouton « Ajout rapide de kcal » (#ja-vers-rapide) affiché",
      !!Sz && Sz.n === 0 && Sz.etat === "Aucun aliment trouvé. Essaie un autre mot." && !!Sz.rapide && Sz.rapide.hidden === false && Sz.rapide.affiche === true, JSON.stringify(Sz));
    await page.click("#ja-vers-rapide"); await page.waitForSelector(".modale.ja-feuille #ja-rk", { timeout: 4000 }).catch(() => {});
    const Sr = await etatListe(page);
    await page.click("#ja-retour"); await page.waitForSelector(".modale.ja-feuille #ja-q", { timeout: 4000 }).catch(() => {}); await attendre(page, 400);
    const Sb = await etatListe(page);
    ok("… il ouvre l'ajout rapide (#ja-rk, « ‹ Retour » #ja-retour) ; « ‹ Retour » revient à la recherche avec « zzqx » toujours dans #ja-q (même message, même bouton)",
      !!Sr && Sr.rk && Sr.retour === "‹ Retour" && Sr.q === null && !!Sb && !Sb.rk && Sb.q === "zzqx" && Sb.etat === "Aucun aliment trouvé. Essaie un autre mot." && !!Sb.rapide && Sb.rapide.affiche === true,
      JSON.stringify([Sr, Sb]));
    await chercher(page, "banane"); await choisir(page, "Banane crue");
    const okAvant = await page.$eval("#ja-ok", e => e.disabled), zOkAjout = await zones(page, "#ja-ok");
    await page.fill("#ja-g", "0.2"); await attendre(page, 200);
    const off02 = await page.$eval("#ja-ok", e => e.disabled);
    const zCroix = await croix(page), ferme = await fermerParCroix(page);
    ok("croix du panneau (.modale.ja-feuille .fermer-volet, " + JSON.stringify(zCroix) + ") : au moins 44 × 44 px ; elle ferme le panneau sans rien écrire",
      zCroix.length === 1 && zCroix[0][0] >= 44 && zCroix[0][1] >= 44 && ferme && !(await page.$(".modale.ja-feuille")) && ecrJA(db, TESTC.id).length === 0, JSON.stringify([zCroix, ferme]) + " " + resumeE(db));
    await page.click('[data-ja-menu="3"]'); await page.waitForSelector(".modale.ja-feuille #ja-rapide"); await page.click("#ja-rapide"); await page.waitForSelector("#ja-rk");
    await page.fill("#ja-rk", "0.4"); await attendre(page, 150);
    const off04 = await page.$eval("#ja-ok", e => e.disabled);
    await page.fill("#ja-rk", "1"); await attendre(page, 150);
    const on1 = await page.$eval("#ja-ok", e => !e.disabled);
    await fermerParCroix(page); await attendre(page, 1000);
    ok("0,2 g (portion de Banane crue d'abord active) → « Ajouter » désactivé", okAvant === false && off02 === true, JSON.stringify([okAvant, off02]));
    ok("ajout rapide 0,4 kcal → « Ajouter » désactivé (1 kcal : actif) ; rien d'écrit dans ces essais", off04 === true && on1 === true && ecrJA(db, TESTC.id).length === 0, JSON.stringify([off04, on1]) + " " + resumeE(db));
    await X.c.close();

    /* ----- 2 et 8 : « Annuler » puis un panneau ; tailles des boutons de l'édition ----- */
    const ABC = JA({ [AUJ]: [[1, "poulet-blanc-grille", 150], [1, "riz-blanc-cuit", 150], [3, "banane-crue", 120]] });
    db = base({ cles: [[TESTC.id, "journal_alimentaire", ABC, avant(H)]] });
    X = await contexte(b, TESTC, db); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-ligne"); await attendre(page, 800);
    await page.click('.ja-ligne[data-ja-k="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-suppr"); await attendre(page, 300);
    const zEd = { ok: await zones(page, "#ja-ok"), suppr: await zones(page, "#ja-suppr") };
    await fermerParCroix(page);
    await page.click('.ja-ligne[data-ja-k="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-suppr");
    await page.click("#ja-suppr"); await panneauFerme(page); await attendre(page, 1400);
    const t1 = await toastsJA(page), nomC = await page.$eval('.ja-ligne[data-ja-k="1"] .ja-l-txt b', e => e.textContent.trim()).catch(() => null);
    await page.click('.ja-ligne[data-ja-k="1"]'); await page.waitForSelector(".modale.ja-feuille #ja-g");
    const t2 = await toastsJA(page), PC = await lirePanneau(page);
    ok("jour [A, B, C] ; B supprimé (message « Supprimé : … » avec « Annuler ») ; toucher C (maintenant data-ja-k=1) : le message disparaît dès l'ouverture du panneau « Banane crue »",
      t1 === 1 && nomC === "Banane crue" && t2 === 0 && !!PC && PC.titre === "Banane crue" && PC.g === "120", JSON.stringify([t1, nomC, t2, PC && [PC.titre, PC.g]]));
    await page.fill("#ja-g", "200"); await attendre(page, 150); await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400);
    const W = ecrJA(db, TESTC.id), sansB = clone(ABC), avecC = clone(ABC);
    sansB.j[AUJ] = [ABC.j[AUJ][0], ABC.j[AUJ][2]]; avecC.j[AUJ] = [ABC.j[AUJ][0], [3, 2, 200]];
    const RC = await lirePage(page);
    ok("« Enregistrer » 200 g : c'est C qui passe à 200 g (écriture), B reste supprimé, A intact ; l'écran suit (collations : Banane crue " + frN(88 * 2) + ")",
      W.length === 2 && memes(W[0].contenu, sansB) && memes(W[1].contenu, avecC) && memes(contenuDe(db, TESTC.id, "journal_alimentaire"), avecC)
      && RC.repas[1].lignes.length === 1 && RC.repas[1].lignes[0].nom === "Blanc de poulet grillé" && RC.repas[3].lignes.length === 1 && RC.repas[3].lignes[0].kcal === frN(88 * 2),
      JSON.stringify([W.map(e => e.contenu.j), RC.repas && RC.repas.map(x => x.lignes.map(l => [l.nom, l.kcal]))]) + " " + resumeE(db));
    ok("tailles des boutons après la correction du CSS : « + Ajouter » [data-ja-ajout] (4) au moins 44 px de haut ; #ja-ok au moins 50 px (ajout et édition) ; #ja-suppr au moins 44 px",
      zAjout.length === 4 && zAjout.every(([w, h]) => w >= 44 && h >= 44) && zOkAjout.length === 1 && zOkAjout[0][1] >= 50 && zEd.ok.length === 1 && zEd.ok[0][1] >= 50 && zEd.suppr.length === 1 && zEd.suppr[0][1] >= 44,
      JSON.stringify({ ajout: zAjout, okAjout: zOkAjout, okEdition: zEd.ok, suppr: zEd.suppr }));
    await X.c.close();

    /* ----- 3 : deux appareils ----- */
    const d0 = JA({ [AUJ]: [[1, "poulet-blanc-grille", 150]] });
    db = base({ cles: [[TESTC.id, "journal_alimentaire", d0, avant(H)]] });
    X = await contexte(b, TESTC, db); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-ligne"); await attendre(page, 800);
    const marquer = () => page.evaluate(() => { window.__resume84 = document.getElementById("ja-resume"); });
    const meme = () => page.evaluate(() => !!window.__resume84 && window.__resume84 === document.getElementById("ja-resume")).catch(() => null);
    const lusMaj = () => db.lectures.filter(l => l.par === TESTC.id && l.outil === "eq.journal_alimentaire" && l.select === "maj_le").length;
    const retour = () => page.evaluate(() => { document.dispatchEvent(new Event("visibilitychange")); return document.visibilityState; });
    const message = () => page.waitForFunction(m => [...document.querySelectorAll(".toast")].some(t => t.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() === m), MSG_AUTRE, { timeout: 6000 }).then(() => true).catch(() => false);
    await marquer(); const m0 = lusMaj();
    const vis = await retour(); await attendre(page, 1500);
    const C0 = { lu: lusMaj() - m0, meme: await meme(), toasts: await toasts(page), lignes: nbLignes(await lirePage(page)) };
    ok("deux appareils, contre-épreuve : retour sur l'app (visibilitychange, « " + vis + " ») sans changement en base : la date seule est relue (select=maj_le), rien ne se recharge, aucun message",
      vis === "visible" && C0.lu === 1 && C0.meme === true && !C0.toasts.includes(MSG_AUTRE) && C0.lignes === 1 && saisies(db, TESTC.id).length === 0, JSON.stringify(C0));
    const d1 = JA({ [AUJ]: [[1, "poulet-blanc-grille", 150], [2, "riz-blanc-cuit", 200]] });
    poser(db, TESTC.id, "journal_alimentaire", d1, new Date(T0 + 10 * MIN).toISOString());   // écrit par l'autre appareil, directement en base
    await marquer(); await retour();
    const vu1 = await message();
    await page.waitForFunction(() => document.querySelectorAll(".ja-ligne").length === 2, null, { timeout: 6000 }).catch(() => {}); await attendre(page, 800);
    const R1 = await lirePage(page), r1 = (await meme()) === false;
    ok("la base reçoit une version plus récente (autre appareil : riz au dîner, maj_le plus récent) ; retour sur l'app : « " + MSG_AUTRE + " », page rechargée avec la ligne de l'autre appareil ; aucune écriture n'a écrasé la base",
      vu1 && r1 && nbLignes(R1) === 2 && R1.repas[2].lignes.length === 1 && R1.repas[2].lignes[0].nom === "Riz blanc, cuit" && ecrJA(db, TESTC.id).length === 0 && memes(contenuDe(db, TESTC.id, "journal_alimentaire"), d1),
      JSON.stringify([vu1, r1, R1.repas && R1.repas.map(x => x.lignes.map(l => l.nom)), await toasts(page)]) + " " + resumeE(db));
    await page.evaluate(() => document.querySelectorAll(".toast").forEach(t => t.remove()));
    const d2 = JA({ [AUJ]: [[1, "poulet-blanc-grille", 150], [2, "riz-blanc-cuit", 200], [3, "banane-crue", 120]] });
    poser(db, TESTC.id, "journal_alimentaire", d2, new Date(T0 + 20 * MIN).toISOString());
    await marquer(); await page.click('[data-ja-ajout="0"]');
    const vu2 = await message();
    await page.waitForFunction(() => document.querySelectorAll(".ja-ligne").length === 3, null, { timeout: 6000 }).catch(() => {}); await attendre(page, 800);
    const R2 = await lirePage(page), r2 = (await meme()) === false, ouvert = !!(await page.$(".modale.ja-feuille"));
    ok("nouvelle version en base, puis ouverture d'un panneau (« + Ajouter ») : le panneau se referme, même message, page rechargée (banane aux collations) ; toujours aucune écriture",
      vu2 && r2 && !ouvert && nbLignes(R2) === 3 && R2.repas[3].lignes.length === 1 && R2.repas[3].lignes[0].nom === "Banane crue" && ecrJA(db, TESTC.id).length === 0 && memes(contenuDe(db, TESTC.id, "journal_alimentaire"), d2),
      JSON.stringify([vu2, r2, ouvert, R2.repas && R2.repas.map(x => x.lignes.map(l => l.nom))]) + " " + resumeE(db));
    await X.c.close();

    /* ----- 5 : minuit (horloge à 23 h 59 le jour D, puis passée minuit sans recharger) ----- */
    const D1 = jour(-1), t2359 = (() => { const d = new Date(T0); d.setHours(23, 59, 0, 0); return d.getTime(); })();
    const ajouterBanane = async page => { await page.click('[data-ja-ajout="0"]'); await page.waitForSelector(".modale.ja-feuille #ja-q"); await chercher(page, "banane"); const c = await choisir(page, "Banane crue"); await page.click("#ja-ok"); await panneauFerme(page); await attendre(page, 1400); return c; };
    db = base();
    X = await contexte(b, TESTC, db, { temps: t2359 }); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 500);
    const M0 = await lirePage(page);
    await X.c.clock.fastForward(2 * MIN); await attendre(page, 300);
    const apres = await page.evaluate(() => aujourdhui());
    const c5 = await ajouterBanane(page);
    const W5 = ecrJA(db, TESTC.id), M1 = await lirePage(page);
    ok("minuit : page ouverte à 23 h 59 le jour D sur « Aujourd'hui » (" + AUJ + "), horloge passée minuit sans recharger ; « + Ajouter » → la ligne est rangée sous D+1 (" + D1 + "), l'écran montre « Aujourd'hui » D+1",
      M0.jour === "Aujourd'hui" && M0.sous === dateLongue(AUJ) && apres === D1 && c5 && W5.length === 1 && memes(W5[0].contenu, { v: 1, a: [fige("banane-crue")], j: { [D1]: [[0, 0, portion1("banane-crue")]] } })
      && M1.jour === "Aujourd'hui" && M1.sous === dateLongue(D1) && nbLignes(M1) === 1, JSON.stringify([M0.jour, M0.sous, apres, c5, W5.map(e => e.contenu.j), M1.jour, M1.sous, nbLignes(M1)]));
    await X.c.close();
    const dH = JA({ [HIER]: [[0, "yaourt-nature", 125]] });
    db = base({ cles: [[TESTC.id, "journal_alimentaire", dH, avant(H)]] });
    X = await contexte(b, TESTC, db, { temps: t2359 }); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, ".ja-repas"); await attendre(page, 500);
    await page.click("#ja-prec"); await attendre(page, 300);
    const N0 = await lirePage(page);
    await X.c.clock.fastForward(2 * MIN); await attendre(page, 300);
    const c6 = await ajouterBanane(page);
    const W6 = ecrJA(db, TESTC.id), N1 = await lirePage(page), attenduH = clone(dH);
    attenduH.a.push(fige("banane-crue")); attenduH.j[HIER].push([0, 1, portion1("banane-crue")]);
    const semaine = iso => { const [y, m, d] = iso.split("-").map(Number); const t = new Date(y, m - 1, d, 12).toLocaleDateString("fr-FR", { weekday: "long" }); return t.charAt(0).toUpperCase() + t.slice(1); };
    ok("… si la personne était sur « Hier » (" + HIER + ") avant minuit, rien ne bouge : l'ajout va au jour affiché (" + HIER + ", devenu « " + semaine(HIER) + " »), ni à D ni à D+1",
      N0.jour === "Hier" && c6 && W6.length === 1 && memes(W6[0].contenu, attenduH) && N1.jour === semaine(HIER) && nbLignes(N1) === 2, JSON.stringify([N0.jour, c6, W6.map(e => e.contenu.j), N1.jour, nbLignes(N1)]));
    await X.c.close();

    /* ----- 7 : prospect sans accord (« tous ») : rien sous la carte ----- */
    MODE = "tous";
    const k = 4;
    db = base({ comptes: [compte(k)] });
    X = await contexte(b, quiP(k), db); page = X.page;
    await page.goto(URL0 + "#/journal-alimentaire"); await pret(page, "#sante-carte"); await attendre(page, 800);
    const corps7 = await page.evaluate(() => { const c = document.getElementById("ja-corps"); return c ? { html: c.innerHTML.trim(), txt: c.textContent.trim() } : null; });
    ok("prospect sans accord : sous la carte de l'accord, #ja-corps est vide (pas de « Chargement… » qui ne finirait jamais)",
      !!corps7 && corps7.html === "" && !!(await page.$("#sante-carte")), JSON.stringify(corps7));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com)$/.test(h));
    ok("aucune erreur de console ni erreur JS ni dialogue natif pendant la suite ; aucune requête vers un autre hôte que la page et le faux Supabase",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
