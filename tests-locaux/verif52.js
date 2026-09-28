/* v51 — tableau de bord prospects (phases 3 et 4 du brief de Lucas) : page coach #/prospects (compteurs, chaque
   filtre statut / date d'inscription / progression, recherche nom et email sans tenir compte des accents ni des
   majuscules, champ jamais redessiné, tri score / inscription / activité, « Afficher plus » par 50, cartes avec
   score et email, boutons des cartes actifs après un filtre), export CSV (téléchargement intercepté et relu comme un
   vrai CSV : BOM, en-têtes, une ligne par prospect filtré, cellules entre guillemets, = + - @ neutralisés), fiche
   d'un prospect (score détaillé, réponses, chronologie dans l'ordre, lien de réservation exact, mailto, Copier),
   Nouveautés (panneau du tableau de bord et de la page Prospects, 7 jours par défaut, « Tout marquer comme vu »
   qui écrit coach_notifs, badge qui disparaît, nouvel événement après la visite), journal des emails présent ou
   absent (404), accord pour les emails (v52 : case newsletter de l'inscription → newsletter daté et versionné ;
   interrupteur du Profil → clé emails { newsletter, maj, version, source }), activité du prospect (pages comptées en mémoire, aucune lecture à l'affichage d'une page
   verrouillée, écriture après relecture de la base — le delta s'ajoute —, pagehide : rien d'écrit, delta gardé
   sur l'appareil et repris au prochain envoi ou à la visite suivante, une minute), email du compte (email_compte)
   et début du questionnaire dans le premier brouillon (jamais avant 18 ans, retirés
   sur un âge mineur), 1 000 prospects (page construite en moins de 2 s côté app), mobile 390 px, client Thomas
   et fiche d'un client identiques à main (git show main:index.html), données piégées sans erreur ni injection.
   Toutes les dates sont relatives au lancement. Supabase simulé : rien ne part vers la vraie base ; chaque
   écriture est appliquée en mémoire et notée, chaque lecture de « donnees » aussi (ordre lecture / écriture).
   Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») : une action impossible n'arrête que son bloc.
   Le faux Supabase coupe chaque réponse à 1 000 lignes, comme la vraie base (réglage « max rows »), et
   respecte l'en-tête Range et le tri demandé (order=…). Un défaut connu de l'app, hors brief (rien ne
   casse, rien ne s'exécute), s'affiche « ⚠ DÉFAUT CONNU » sans compter dans le total ; la suite sort
   avec le code 1 dès qu'un ✗ apparaît.
   Usage : node verif52.js ../index.html
           VERIF52_PORT=9700 node verif52.js ../index.html     (autre port, si 9682 est pris)
           VERIF52_BLOCS="G.,H. journal" node verif52.js …     (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = +process.env.VERIF52_PORT || 9682;
const BLOCS = (process.env.VERIF52_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const OUT = path.join(__dirname, "captures", "v52"); fs.mkdirSync(OUT, { recursive: true });
/* référence pour « client inchangé » : la version de main (servie sur /?ref=main) */
/* v52 : référence de comparaison = VERIF52_REF (GitHub Actions : le commit publié juste avant), sinon main */
const REF_NOM = process.env.VERIF52_REF || "main";
let REF = null; try { REF = require("child_process").execFileSync("git", ["show", REF_NOM + ":index.html"], { cwd: path.join(__dirname, ".."), maxBuffer: 64e6, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); } catch (e) { REF = null; }
let inscriptionLibre = false;
const server = http.createServer((req, res) => {
  let h = (req.url.indexOf("ref=main") > -1 && REF) ? REF : fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
/* défaut connu de l'app, hors brief : compté s'il est corrigé, sinon signalé à part (ni ✓ ni ✗) */
const connu = (n, c, d) => res.push(c ? "  ✓ " + n : "  ⚠ DÉFAUT CONNU (hors brief, voir README) " + n + "  — " + (d || ""));
const CAL = "https://calendly.com/mhx-coaching/30min";
const COACH_SEUL = ["notes_coach", "suivi_prospect", "feedbacks"];
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const T0 = Date.now(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const midiIlYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
/* date locale « jj/mm/aaaa » d'un instant, et jour de découverte (1 = jour de l'inscription, date locale) */
const fr = v => { const j = iso(new Date(v)); return j.slice(8, 10) + "/" + j.slice(5, 7) + "/" + j.slice(0, 4); };
const jourDe = v => { const a = iso(new Date()), m = iso(new Date(v)); return Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, +m.slice(8, 10))) / J) + 1; };
const hm = v => { const d = new Date(v); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les prospects (tout est relatif au lancement) ----------
   Attendu, calculé à la main à partir du brief :
   Léa     inscrite il y a 2 h, rien fait                     → NOUVEAU, score 10, pas à traiter (rang 8)
   Inès    26 h, questionnaire, 1 clic, bilan réservé, activité 2 jours / 12 min, email ouvert, 1 relance
                                                             → CHAUD, 10+30+30+30+5+5+5 = 115 plafonné à 100, à traiter (rang 1)
   Émilie  50 h, questionnaire, 2 clics sans réserver, email envoyé non ouvert → TIÈDE, 70, à traiter (rang 5)
   Paul    10 jours, rien                                      → FROID, 10, à traiter (rang 6, jamais actif)
   Zoé     5 jours, questionnaire en cours (5/10), email ouvert, rien depuis 4 jours → FROID, 10+10+5 = 25, à traiter
   Hugo    20 jours, questionnaire, issue « Perdu » il y a 5 jours → PERDU, 40, relance prévue (rang 9)
   Karim   8 jours, questionnaire, rien depuis 6 jours          → FROID, 40, à traiter (rang 6)
   Piège   3 jours, données piégées (prénom « =1+1 », nom en HTML, court_le nombre…) → FROID, 10 + 20×3/10 = 16
   Score moyen : (10+100+70+10+25+40+40+16) / 8 = 38,9 → 39 (38 sans journal des emails : Zoé perd son bonus). */
const PID = k => "00000000-0000-4000-8000-0000000052" + String(k).padStart(2, "0");
const LEA = PID(1), INES = PID(2), EMILIE = PID(3), PAUL = PID(4), ZOE = PID(5), HUGO = PID(6), KARIM = PID(7), PIEGE = PID(8), NINA = PID(9);
const XSS = "<img src=x onerror=window.__xss=1>";
const complet = (o) => Object.assign({ sexe: "Homme", age: "35", taille: "178", poids: "82", objectif: "Perte de poids / sèche", seances: "3", essaye: "Rien de sérieux", obstacle: "Le temps", pourquoi: "Pour ma santé", motivation: "7" }, o);
const PROSPECTS = [
  { id: LEA, prenom: "Léa", nom: "Martin", cree: avant(2 * H) },
  { id: INES, prenom: "Inès", nom: "Dupré", cree: avant(26 * H), donnees: [
    ["intake", { sexe: "Femme", age: "31", taille: "168", poids: "70", objectif: "Perte de poids / sèche", seances: "3", essaye: "Des applis, sans tenir", obstacle: "Le manque de temps le soir", pourquoi: "Mariage en juin", motivation: "9", court_debut: avant(25.5 * H), court_le: avant(25 * H), email_compte: "ines.dupre@exemple.fr" }, avant(25 * H)],
    ["challenge", { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "decouverte", date: avant(24 * H) }] }, reserve: avant(23 * H) }, avant(23 * H)],
    ["activite", { version: 1, jours: [ilYA(1), ilYA(0)], pages: { "decouverte-resultat": 4, formation: 2, "verrou-programme": 1 }, temps_s: 720, derniere: avant(1 * H) }, avant(60000)],
    ["suivi_prospect", { version: 1, relances: [avant(2 * H)], historique: [{ type: "relance", le: avant(2 * H) }] }, avant(2 * H)] ] },
  { id: EMILIE, prenom: "Émilie", nom: "Rousseau", cree: avant(50 * H), donnees: [
    ["intake", { sexe: "Femme", age: "27", taille: "162", poids: "58", objectif: "Prise de muscle", seances: "4", motivation: "6", court_debut: avant(41 * H), court_le: avant(40 * H), email_compte: "emilie.r@exemple.fr" }, avant(40 * H)],
    ["challenge", { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "decouverte", date: avant(31 * H) }, { jour: 2, source: "verrou-programme", date: avant(10 * H) }] } }, avant(10 * H)] ] },
  { id: PAUL, prenom: "Paul", nom: "Durand", cree: avant(10 * J) },
  { id: ZOE, prenom: "Zoé", nom: "Bernard", cree: avant(5 * J), donnees: [
    ["intake", { sexe: "Femme", age: "34", taille: "170", poids: "65", objectif: "Prise de muscle", court_debut: avant(5 * J - H), email_compte: "zoe.bernard@exemple.fr" }, midiIlYA(4)] ] },
  { id: HUGO, prenom: "Hugo", nom: "Petit", cree: avant(20 * J), donnees: [
    ["intake", complet({ objectif: "-8 kg", motivation: "5", court_debut: avant(19 * J + H), court_le: avant(19 * J), email_compte: "hugo.petit@exemple.fr" }), midiIlYA(19)],
    /* issue datée à midi (heure locale) il y a 5 jours : « Relance prévue dans 25 jours » ne dépend ni de l'heure du lancement ni du passage à l'heure d'été */
    ["suivi_prospect", { version: 1, issue: "perdu", issue_le: midiIlYA(5), note: "prix", historique: [{ type: "issue", valeur: "perdu", le: midiIlYA(5), note: "prix" }] }, midiIlYA(5)] ] },
  { id: KARIM, prenom: "Karim", nom: "Benali", cree: avant(8 * J), donnees: [
    ["intake", complet({ objectif: "+5 kg de muscle", court_debut: avant(7 * J + 3 * H), court_le: avant(7 * J + 2 * H), email_compte: "karim@exemple.org" }), midiIlYA(6)] ] },
  { id: PIEGE, prenom: "=1+1", nom: XSS, cree: avant(3 * J), donnees: [
    ["intake", { email_compte: "@piege.fr", objectif: 'Perdre "vite"; bien', court_le: 12345, motivation: "<b>9</b>", obstacle: "<script>window.__xss=1</script>" }, midiIlYA(3)],
    ["challenge", { cta: { clics: [null, 5, "x"] }, reserve: { d: 1 }, jours: "abc" }, midiIlYA(3)],
    ["activite", { jours: "abc", pages: { "<img src=x>": 5, formation: -3, ok: "x" }, temps_s: "999", derniere: "<b>" }, midiIlYA(3)],
    ["suivi_prospect", { issue: { x: 1 }, relances: "abc", historique: [null, 5, { type: "relance", le: XSS }, { type: "issue", valeur: XSS, le: avant(4 * J) }] }, avant(4 * J)] ] }
];
/* bloc « périodes et issues anciennes » : un prospect inscrit il y a 40 jours (issue « perdu » vieille de 40 jours),
   un signé, un absent, et un client passé par la case prospect (signé il y a 10 jours : compté dans « Signés ») */
const VICTOR = PID(12), SAM = PID(13), ALICE = PID(14);
const ANCIENS = [
  { id: VICTOR, prenom: "Victor", nom: "Ancien", cree: avant(40 * J), donnees: [
    ["intake", complet({ court_debut: avant(39 * J + H), court_le: avant(39 * J), email_compte: "victor@exemple.fr" }), midiIlYA(39)],
    ["suivi_prospect", { version: 1, issue: "perdu", issue_le: midiIlYA(40), historique: [{ type: "issue", valeur: "perdu", le: midiIlYA(40) }] }, midiIlYA(40)] ] },
  { id: SAM, prenom: "Sam", nom: "Signé", cree: avant(6 * J), donnees: [
    ["intake", complet({ court_debut: avant(6 * J - H), court_le: avant(6 * J - 2 * H), email_compte: "sam@exemple.fr" }), midiIlYA(5)],
    ["suivi_prospect", { version: 1, issue: "signe", issue_le: midiIlYA(2), historique: [{ type: "issue", valeur: "signe", le: midiIlYA(2) }] }, midiIlYA(2)] ] },
  { id: ALICE, prenom: "Alice", nom: "Absente", cree: avant(9 * J), donnees: [
    ["intake", complet({ court_debut: avant(9 * J - H), court_le: avant(9 * J - 2 * H), email_compte: "alice@exemple.fr" }), midiIlYA(8)],
    ["suivi_prospect", { version: 1, issue: "absent", issue_le: midiIlYA(3), historique: [{ type: "issue", valeur: "absent", le: midiIlYA(3) }] }, midiIlYA(3)] ] }
];
const NOM = { [VICTOR]: "Victor", [SAM]: "Sam", [ALICE]: "Alice", [LEA]: "Léa", [INES]: "Inès", [EMILIE]: "Émilie", [PAUL]: "Paul", [ZOE]: "Zoé", [HUGO]: "Hugo", [KARIM]: "Karim", [PIEGE]: "Piège", [NINA]: "Nina" };
const noms = l => (l || []).map(u => NOM[u] || u.slice(-4)).join(", ");
const JOURNAL = [
  { user_id: INES, modele: "bienvenue", statut: "envoye", envoye_le: avant(25.75 * H), ouvert_le: avant(20 * H), clique_le: null },
  { user_id: EMILIE, modele: "questionnaire", statut: "envoye", envoye_le: avant(30 * H), ouvert_le: null, clique_le: null },
  { user_id: ZOE, modele: "relance", statut: "envoye", envoye_le: avant(3 * J), ouvert_le: avant(2 * J), clique_le: avant(2 * J - H) },
  { user_id: PIEGE, modele: XSS, statut: "envoye", envoye_le: "<script>", ouvert_le: 42, clique_le: { a: 1 } },
  null, 5, { user_id: 42 }
];
/* copie du journal, avec cree_le (colonne de la vraie table, remplie par la base : c'est l'ordre de lecture de l'app) */
const journalDe = l => JSON.parse(JSON.stringify(l)).map(e => (e && typeof e === "object" && !e.cree_le) ? Object.assign(e, { cree_le: typeof e.envoye_le === "string" && /^\d{4}-/.test(e.envoye_le) ? e.envoye_le : avant(3 * J) }) : e);
/* les ordres attendus (priorité = rang puis activité la plus récente) */
const ORDRE = {
  priorite: [INES, EMILIE, PIEGE, ZOE, KARIM, PAUL, LEA, HUGO],
  score: [INES, EMILIE, KARIM, HUGO, ZOE, PIEGE, PAUL, LEA],
  inscription: [LEA, INES, EMILIE, PIEGE, ZOE, KARIM, PAUL, HUGO],
  activite: [INES, EMILIE, PIEGE, ZOE, KARIM, HUGO, PAUL, LEA]
};
const garde = (liste, ids) => ORDRE.priorite.filter(u => ids.includes(u));

/* 1 000 prospects générés (bloc performance) */
const GEN = i => "00000000-0000-4000-8000-1" + String(i).padStart(11, "0");
const p4 = i => String(i).padStart(4, "0");
function genere(db, n){
  for (let i = 0; i < n; i++) {
    const id = GEN(i), jours = i % 30;
    db.profils.push({ id, prenom: "Prospect", nom: "N" + p4(i), role: "client", statut: "prospect", cree_le: avant((jours * 24 + 3) * H + i * 1000) });
    if (i % 2 === 0) db.donnees.push({ user_id: id, outil: "intake", contenu: Object.assign({ sexe: "Homme", age: "30", taille: "175", poids: "80", objectif: "Prise de muscle", seances: "3", motivation: String(i % 10 + 1), court_debut: avant(jours * J), email_compte: "p" + p4(i) + "@gen.fr" }, i % 4 === 0 ? { court_le: avant(jours * J) } : {}), maj_le: avant(jours * J) });
    if (i % 5 === 0) db.donnees.push({ user_id: id, outil: "challenge", contenu: Object.assign({ version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "decouverte", date: avant(jours * J) }] } }, i % 10 === 0 ? { reserve: avant(jours * J) } : {}), maj_le: avant(jours * J) });
    if (i % 3 === 0) db.donnees.push({ user_id: id, outil: "activite", contenu: { version: 1, jours: [ilYA(jours)], pages: { formation: i % 7 }, temps_s: i, derniere: avant(jours * J) }, maj_le: avant(jours * J) });
    if (i % 6 === 0) db.emails_prospects.push({ user_id: id, modele: "bienvenue", statut: "envoye", envoye_le: avant(jours * J), ouvert_le: i % 12 === 0 ? avant(jours * J) : null, clique_le: null, cree_le: avant(jours * J) });
  }
}

/* les contextes ouverts par le bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route */
const ouverts = [];
const MAX_LIGNES = 1000;
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)); profils.forEach(p => { p.statut = "client"; });
  /* un CLIENT inscrit il y a 3 h : il ne doit jamais apparaître dans les Nouveautés ni dans les prospects */
  profils.find(p => p.id === F.IDS.c3).cree_le = avant(3 * H);
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  const db = { profils, donnees, emails_prospects: [], ecritures: [], lectures: [], journal: [], chemins: [], inscriptions: [], sansJournal: !!opts.sansJournal, lectureKo: opts.lectureKo || [] };
  (opts.prospects || PROSPECTS).forEach(x => {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom, role: "client", statut: "prospect", cree_le: x.cree });
    (x.donnees || []).forEach(([outil, contenu, maj]) => donnees.push({ user_id: x.id, outil, contenu: JSON.parse(JSON.stringify(contenu)), maj_le: maj }));
  });
  journalDe(opts.journal || (opts.prospects ? [] : JOURNAL)).forEach(e => db.emails_prospects.push(e));
  (opts.cles || []).forEach(([uid, outil, contenu, maj]) => donnees.push({ user_id: uid, outil, contenu, maj_le: maj || avant(J) }));
  if (opts.nb) genere(db, opts.nb);
  return db;
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    /* comme PostgREST sur Supabase : l'en-tête Range choisit les lignes, et aucune réponse ne dépasse 1 000 lignes (« max rows ») */
    const plage = l => { const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
    const estCoach = !!who && who.id === F.IDS.coach;
    db.chemins.push(m + " " + p);
    if (p.startsWith("/auth/v1/signup")) {
      let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
      db.inscriptions.push(corps);
      const id = "00000000-0000-4000-8000-00000000abcd";
      db.profils.push({ id, prenom: (corps.data || {}).prenom, nom: (corps.data || {}).nom, role: "client", statut: "prospect", cree_le: new Date().toISOString() });
      return json(F.session(id, corps.email));
    }
    if (p.startsWith("/auth/v1/token")) return json(who ? who.session : { error: "invalid" }, who ? 200 : 400);
    /* toute autre écriture vers la base (compte, fonctions, Storage…) est notée */
    if (!["GET", "HEAD", "OPTIONS"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m });
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/emails_prospects") {
      if (db.sansJournal) return json({ code: "42P01", message: 'relation "public.emails_prospects" does not exist' }, 404);
      if (!estCoach) return json([]);
      let l = db.emails_prospects.slice();
      const ord = (q.get("order") || "").split(",")[0].split(".");   // ex. cree_le.asc
      if (ord[0]) { const cle = x => (x && typeof x === "object" && x[ord[0]] != null) ? String(x[ord[0]]) : ""; l.sort((x, y) => cle(x) < cle(y) ? -1 : cle(x) > cle(y) ? 1 : 0); if (ord[1] === "desc") l.reverse(); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => (x && typeof x === "object") ? Object.fromEntries(sel.map(k => [k, x[k]])) : x);
      return json(plage(l));
    }
    if (p === "/rest/v1/profils") {
      if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); }
      const id = q.get("id"); let l = id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils.slice();
      return json(plage(l));
    }
    if (p === "/rest/v1/donnees") {
      const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
      const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
      if (m === "PATCH") {
        let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
        if (!estCoach && (COACH_SEUL.includes(cleEq) || uid !== (who && who.id))) return json({ message: "rls" }, 403);
        const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null ? true : mj === "is.null" ? !x.maj_le : mj.startsWith("eq.") ? x.maj_le === decodeURIComponent(mj.slice(3)) : false));
        if (!row) return json([]);
        row.contenu = corps.contenu; row.maj_le = corps.maj_le;
        db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: JSON.parse(JSON.stringify(corps.contenu)) }); db.journal.push("E " + cleEq);
        return json([row]);
      }
      if (m === "POST") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        rows = Array.isArray(rows) ? rows : [rows];
        if (rows.some(row => !estCoach && (COACH_SEUL.includes(row.outil) || row.user_id !== (who && who.id)))) return json({ message: "rls" }, 403);
        const upsert = u.indexOf("on_conflict") > -1, out = [];
        for (const row of rows) {
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key" }, 409);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: JSON.parse(JSON.stringify(row.contenu)) }); db.journal.push("E " + row.outil);
          out.push(ligne);
        }
        return (req.headers()["prefer"] || "").indexOf("return=representation") > -1 ? json(out, 201) : json(null, 201);
      }
      if (m !== "GET") { db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json(null, 204); }
      db.lectures.push({ uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
      if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne" }, 500);
      let l = db.donnees;
      if (who && !estCoach) l = l.filter(x => x.user_id === who.id && !COACH_SEUL.includes(x.outil));
      if (uid) l = l.filter(x => x.user_id === uid);
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(plage(l));
    }
    const t = p.replace("/rest/v1/", "");
    if (CATALOGUE[t]) return json(plage(CATALOGUE[t]));
    return json([]);
  });
  await c.addInitScript(({ s, stock }) => {
    if (sessionStorage.getItem("__init")) return; sessionStorage.setItem("__init", "1");   // une seule fois : un rechargement garde l'état de l'appareil
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
  }, { s: who ? who.session : null, stock: opts.stockage || {} });
  if (opts.horloge) await c.clock.install();   // horloge contrôlée (qui continue de tourner) : pour avancer d'une minute
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const sessionDe = (id, email, meta) => { const s = F.session(id, email); if (meta) s.user.user_metadata = meta; return s; };
const qui = (id, email, meta) => ({ id, email, session: sessionDe(id, email, meta) });
const coach = qui(F.IDS.coach, "c@e.fr");
const thomas = qui(F.IDS.c1, "t@e.fr");
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1600); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const uids = page => page.$$eval("#pr-liste .sc-carte", l => l.map(e => e.dataset.uid)).catch(() => []);
const carte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => e.textContent).then(norm).catch(() => "");
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 350); };
const choisir = async (page, sel, v) => { await page.selectOption(sel, v); await attendre(page, 350); };
const chercher = async (page, v) => { await page.fill("#pr-q", v); await attendre(page, 550); };
const tuiles = (page, sel) => page.$$eval(sel + " .tile", l => l.map(t => ({ lbl: t.querySelector(".t-lbl").textContent.trim(), val: (t.querySelector(".t-val").firstChild || { textContent: "" }).textContent.replace(/[  ]/g, " ").trim() }))).catch(() => []);
const tuile = (ts, lbl) => (ts.find(t => t.lbl === lbl) || {}).val;
const badge = page => page.$$eval('#nav a[data-id="prospects"] .nav-badge, #barre-bas a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.outil === outil && (!uid || e.user_id === uid));
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
/* la clé k fait-elle partie de ce qu'une lecture de « donnees » renvoie ? filtre outil = eq.k, in.(…,k,…),
   not.in.(… sans k …), neq / not.eq d'une autre clé, ou pas de filtre du tout (toutes les clés) ; un autre
   opérateur est compté par prudence */
const couvre = (o, k) => {
  o = String(o || ""); if (!o) return true;
  const liste = t => t.replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
  if (o.startsWith("eq.")) return o.slice(3) === k;
  if (o.startsWith("in.")) return liste(o.slice(3)).includes(k);
  if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k);
  if (o.startsWith("neq.")) return o.slice(4) !== k;
  if (o.startsWith("not.eq.")) return o.slice(7) !== k;
  return true;
};
/* lectures qui renvoient la clé (depuis la n-ième lecture) */
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil)).length;
const xss = page => page.evaluate(() => !!window.__xss || !!document.querySelector("#vue img[src='x'], #vue script, .nv-panneau img, .nv-panneau i, [onmouseover], [onerror]")).catch(() => true);
const ajd = () => iso(new Date());   // « aujourd'hui » au moment du contrôle (et non du lancement : minuit peut passer pendant la suite)
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
/* deux objets egaux, quel que soit l'ordre de leurs cles */
const memes = (a, b) => { const t = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]])); return t(a) === t(b); };
const toasts = page => page.$$eval("#toasts .toast", l => l.map(e => e.textContent.trim())).catch(() => []);
const lignesLi = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
/* un vrai lecteur CSV (guillemets doublés, point-virgule, fin de ligne CRLF) ; note si chaque cellule était entre guillemets */
function lireCSV(t){
  const lignes = [], cites = []; let ligne = [], lc = [], champ = "", dans = false, cite = false, i = 0, brut = false;
  const finChamp = () => { ligne.push(champ); lc.push(cite); champ = ""; cite = false; };
  while (i < t.length) {
    const ch = t[i];
    if (dans) { if (ch === '"') { if (t[i + 1] === '"') { champ += '"'; i += 2; continue; } dans = false; i++; continue; } champ += ch; i++; continue; }
    if (ch === '"') { if (champ !== "") brut = true; dans = true; cite = true; i++; continue; }
    if (ch === ";") { finChamp(); i++; continue; }
    if (ch === "\r" && t[i + 1] === "\n") { finChamp(); lignes.push(ligne); cites.push(lc); ligne = []; lc = []; i += 2; continue; }
    if (ch === "\n" || ch === "\r") brut = true;
    champ += ch; i++;
  }
  if (champ !== "" || ligne.length) { finChamp(); lignes.push(ligne); cites.push(lc); }
  return { lignes, cites, brut, ouvert: dans };
}
async function exporter(page){
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.click("#pr-csv")]);
  return { nom: dl.suggestedFilename(), t: fs.readFileSync(await dl.path(), "utf8") };
}
const ENTETES = ["Nom", "Email", "Inscrit le", "Découverte", "Objectif", "Statut", "Score /100", "Questionnaire", "Motivation /10", "Clics « Réserver mon bilan »", "Dernier clic", "Bilan réservé le", "Relances", "Dernière activité", "Prochaine action"];
/* v52 (lot B) : le nom du prospect (profils.nom) est pré-rempli aussi : name = « prénom nom », first_name, last_name */
const lienPour = (prenom, nom, email) => CAL + "?utm_source=app-mhx&utm_medium=coach&utm_content=fiche-coach&name=" + encodeURIComponent([prenom, nom].filter(Boolean).join(" ")) + "&first_name=" + encodeURIComponent(prenom) + (nom ? "&last_name=" + encodeURIComponent(nom) : "") + (email ? "&email=" + encodeURIComponent(email) : "");
/* la fiche d'un prospect, ouverte depuis sa carte (filtre « Tous ») */
async function ouvrirFiche(page, uid){
  if (!(await page.$("#pr-vue"))) { await aller(page, "#/prospects", 2200); }
  await filtre(page, "tous");
  await page.click(`#pr-liste .sc-carte[data-uid="${uid}"] [data-sc="fiche"]`);
  await page.waitForSelector("#fiche-score", { timeout: 6000 }); await attendre(page, 500);
}
const chrono = page => page.$$eval("#fiche-chrono ol li", l => l.map(li => ({ t: li.querySelector("span").textContent.trim(), dt: li.querySelector("time").getAttribute("datetime"), aff: li.querySelector("time").textContent.trim() }))).catch(() => []);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : relance plus tard ou choisis un autre port, VERIF52_PORT=9700 node verif52.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* ---------- A. Page Prospects : compteurs, filtres, recherche, tri, cartes ---------- */
  await bloc("A. compteurs", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 800);
    const lede = await texte(page, "#pr-vue .masthead .lede");
    ok("en-tête : « 8 comptes gratuits · 1 nouveau, 1 chaud, 1 tiède, 4 froids · score moyen 39/100 » (clients jamais comptés)", lede === "8 comptes gratuits · 1 nouveau, 1 chaud, 1 tiède, 4 froids · score moyen 39/100", lede);
    const ts = await tuiles(page, "#pr-vue");
    const att = { "À traiter": "6", "Nouveaux": "1", "Chauds": "1", "Score moyen": "39", "Signés": "0", "Perdus": "1", "Absents": "0" };
    ok("compteurs : À traiter 6, Nouveaux 1, Chauds 1, Score moyen 39, Signés 0, Perdus 1 (30 jours), Absents 0", Object.keys(att).every(k => tuile(ts, k) === att[k]), JSON.stringify(ts));
    const meta = await page.$$eval("[data-filtre]", l => Object.fromEntries(l.map(bt => [bt.dataset.filtre, (bt.querySelector(".meta") || {}).textContent]))).catch(() => ({}));
    ok("boutons de statut avec leur nombre : À traiter 6, Nouveaux 1, Chauds 1, Tièdes 1, Froids 4, Appel fait 1, Tous 8", JSON.stringify(meta) === JSON.stringify({ a_traiter: "6", nouveau: "1", chaud: "1", tiede: "1", froid: "4", issues: "1", tous: "8" }), JSON.stringify(meta));
    const l0 = await uids(page);
    ok("par défaut « À traiter » : Inès, Émilie, Piège, Zoé, Karim, Paul (priorité puis activité), « 6 sur 8 prospects »", JSON.stringify(l0) === JSON.stringify([INES, EMILIE, PIEGE, ZOE, KARIM, PAUL]) && (await texte(page, "#pr-compte")) === "6 sur 8 prospects" && (await page.getAttribute('[data-filtre="a_traiter"]', "aria-pressed")) === "true", noms(l0) + " · " + (await texte(page, "#pr-compte")));
    const ci = await carte(page, INES), cz = await carte(page, ZOE), cp = await carte(page, PIEGE);
    ok("carte d'Inès : score « 100/100 » (plafonné), « CHAUD », email, date d'inscription, objectif, prochaine action", ["Inès Dupré", "100/100", "CHAUD", "ines.dupre@exemple.fr", "inscrit le " + fr(avant(26 * H)), "Perte de poids / sèche", "Prochaine action : Prépare le bilan"].every(x => ci.includes(x)), ci.slice(0, 300));
    ok("carte de Zoé : « 25/100 » (questionnaire 5/10 + email ouvert), « FROID », email", ["25/100", "FROID", "zoe.bernard@exemple.fr"].every(x => cz.includes(x)), cz.slice(0, 200));
    ok("carte piégée : le nom « =1+1 <img …> » et l'email « @piege.fr » restent du texte, score 16/100, aucune injection", cp.includes("=1+1 " + XSS) && cp.includes("@piege.fr") && cp.includes("16/100") && !(await xss(page)), cp.slice(0, 200));
    await page.screenshot({ path: path.join(OUT, "prospects-desktop.png"), fullPage: true });
    ok("aucune écriture à l'affichage de la page Prospects", db.ecritures.length === 0, JSON.stringify(db.ecritures).slice(0, 200));
  });

  await bloc("A. filtres", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    const cas = [["nouveau", [LEA]], ["chaud", [INES]], ["tiede", [EMILIE]], ["froid", [PIEGE, ZOE, KARIM, PAUL]], ["issues", [HUGO]], ["tous", ORDRE.priorite], ["a_traiter", [INES, EMILIE, PIEGE, ZOE, KARIM, PAUL]]];
    for (const [f, att] of cas) {
      await filtre(page, f);
      const l = await uids(page), presse = await page.$$eval("[data-filtre]", x => x.filter(bt => bt.getAttribute("aria-pressed") === "true").map(bt => bt.dataset.filtre)).catch(() => []);
      ok(`statut « ${f} » : ${noms(att)}`, JSON.stringify(l) === JSON.stringify(att) && JSON.stringify(presse) === JSON.stringify([f]), noms(l) + " · pressé " + JSON.stringify(presse));
    }
    await filtre(page, "tous");
    for (const [v, att] of [["24h", [LEA]], ["7j", garde(0, [LEA, INES, EMILIE, ZOE, PIEGE])], ["30j", ORDRE.priorite], ["tout", ORDRE.priorite]]) {
      await choisir(page, "#pr-periode", v);
      const l = await uids(page);
      ok(`date d'inscription « ${v} » : ${noms(att)}`, JSON.stringify(l) === JSON.stringify(att), noms(l));
    }
    for (const [v, att] of [["sans_q", [PIEGE, ZOE, PAUL, LEA]], ["q_fait", [INES, EMILIE, KARIM, HUGO]], ["clic", [INES, EMILIE]], ["reserve", [INES]], ["tout", ORDRE.priorite]]) {
      await choisir(page, "#pr-prog", v);
      const l = await uids(page);
      ok(`progression « ${v} » : ${noms(att)}`, JSON.stringify(l) === JSON.stringify(att), noms(l));
    }
    await filtre(page, "froid"); await choisir(page, "#pr-periode", "7j");
    const l2 = await uids(page);
    ok("filtres combinés « Froids » + « 7 derniers jours » : Piège, Zoé ; « 2 sur 8 prospects »", JSON.stringify(l2) === JSON.stringify([PIEGE, ZOE]) && (await texte(page, "#pr-compte")) === "2 sur 8 prospects", noms(l2) + " · " + (await texte(page, "#pr-compte")));
    await filtre(page, "chaud"); await choisir(page, "#pr-periode", "tout"); await choisir(page, "#pr-prog", "sans_q");
    ok("« Chauds » + « Questionnaire à remplir » : aucune carte, « Aucun prospect ne correspond à ces filtres. »", (await uids(page)).length === 0 && (await texte(page, "#pr-liste")) === "Aucun prospect ne correspond à ces filtres.", await texte(page, "#pr-liste"));
    ok("filtres : aucune écriture", db.ecritures.length === 0);
  });

  await bloc("A. recherche et tri", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    await filtre(page, "tous");
    await page.evaluate(() => { document.getElementById("pr-q").__marque = 1; });
    await page.click("#pr-q"); await page.keyboard.type("émi", { delay: 60 }); await attendre(page, 600);
    const l1 = await uids(page);
    const champ = await page.evaluate(() => { const q = document.getElementById("pr-q"); return { meme: q.__marque === 1, focus: document.activeElement === q, v: q.value }; }).catch(() => ({}));
    ok("recherche tapée « émi » : Émilie seule ; le champ n'est pas redessiné (même élément, curseur dedans, valeur gardée)", JSON.stringify(l1) === JSON.stringify([EMILIE]) && champ.meme && champ.focus && champ.v === "émi", noms(l1) + " · " + JSON.stringify(champ));
    for (const [v, att, quoi] of [["EMILIE", [EMILIE], "sans accent, en majuscules"], ["dupre", [INES], "nom sans accent"], ["DUPRÉ", [INES], "nom en majuscules accentuées"], ["  Inès   dupré ", [INES], "espaces en trop"], ["zoe.bernard@", [ZOE], "début d'email"], ["exemple.fr", [INES, EMILIE, ZOE, HUGO], "domaine d'email"], ["@PIEGE", [PIEGE], "email piégé"]]) {
      await chercher(page, v);
      const l = await uids(page);
      ok(`recherche « ${v} » (${quoi}) : ${noms(att)}`, JSON.stringify(l) === JSON.stringify(att), noms(l));
    }
    await chercher(page, "zzz");
    ok("recherche « zzz » : « Aucun prospect ne correspond à ces filtres. », « 0 sur 8 prospects »", (await uids(page)).length === 0 && (await texte(page, "#pr-liste")) === "Aucun prospect ne correspond à ces filtres." && (await texte(page, "#pr-compte")) === "0 sur 8 prospects", await texte(page, "#pr-compte"));
    await chercher(page, "");
    for (const t of ["score", "inscription", "activite", "priorite"]) {
      await choisir(page, "#pr-tri", t);
      const l = await uids(page);
      ok(`tri « ${t} » : ${noms(ORDRE[t])}`, JSON.stringify(l) === JSON.stringify(ORDRE[t]), noms(l));
    }
    const scores = await page.$$eval("#pr-liste .sc-carte", l => l.map(e => { const m = e.textContent.match(/(\d+)\/100/); return m ? +m[1] : null; })).catch(() => []);
    ok("chaque carte porte son score sur 100 (Inès 100, Émilie 70, Piège 16, Zoé 25, Karim 40, Paul 10, Léa 10, Hugo 40)", JSON.stringify(scores) === JSON.stringify([100, 70, 16, 25, 40, 10, 10, 40]), JSON.stringify(scores));
    ok("recherche et tri : aucune écriture", db.ecritures.length === 0);
  });

  await bloc("A. boutons des cartes après un filtre", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    await filtre(page, "froid"); await filtre(page, "tiede");
    await page.click(`#pr-liste .sc-carte[data-uid="${EMILIE}"] [data-sc="relance"]`); await attendre(page, 2600);
    const S = contenu(db, "suivi_prospect", EMILIE) || {};
    ok("après deux filtres, « J'ai relancé » sur la carte d'Émilie : relance écrite (clé coach suivi_prospect, 1 relance, historique)", Array.isArray(S.relances) && S.relances.length === 1 && Array.isArray(S.historique) && S.historique[0].type === "relance" && ecr(db, "suivi_prospect", EMILIE).length === 1, JSON.stringify(S));
    const ce = await carte(page, EMILIE);
    ok("… la carte est redessinée dans le même filtre : « Relancé aujourd'hui : attends sa réponse. », toast « Suivi de Émilie Rousseau enregistré. »", ce.includes("Relancé aujourd'hui : attends sa réponse.") && (await page.getAttribute('[data-filtre="tiede"]', "aria-pressed")) === "true" && (await toasts(page)).includes("Suivi de Émilie Rousseau enregistré."), ce.slice(0, 200) + " · " + JSON.stringify(await toasts(page)));
    await filtre(page, "tous"); await chercher(page, "karim");
    await page.click(`#pr-liste .sc-carte[data-uid="${KARIM}"] [data-sc="fiche"]`); await page.waitForSelector("#fiche-score", { timeout: 6000 }); await attendre(page, 400);
    ok("après une recherche, « Ouvrir la fiche » sur la carte de Karim : sa fiche s'ouvre (« Karim Benali », score détaillé)", (await texte(page, "#vue .masthead h1")).startsWith("Karim Benali") && (await texte(page, "#fiche-score")).includes("40/100"), await texte(page, "#vue .masthead h1"));
    ok("seule écriture : la relance (aucune autre clé touchée)", db.ecritures.length === 1, JSON.stringify(db.ecritures.map(e => e.outil)));
  });

  await bloc("A. périodes et issues anciennes", async () => {
    /* sans ce bloc, aucun prospect n'a plus de 30 jours et aucune issue n'est ancienne : « 30 jours » = « tous » */
    const db = base({ prospects: PROSPECTS.concat(ANCIENS), journal: JOURNAL, cles: [
      [F.IDS.c2, "suivi_prospect", { version: 1, issue: "signe", issue_le: midiIlYA(10), historique: [{ type: "issue", valeur: "signe", le: midiIlYA(10) }] }, midiIlYA(10)],
      [F.IDS.c3, "suivi_prospect", { version: 1, issue: "signe", issue_le: midiIlYA(45), historique: [{ type: "issue", valeur: "signe", le: midiIlYA(45) }] }, midiIlYA(45)] ] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    const ts = await tuiles(page, "#pr-vue");
    ok("tuiles sur 30 jours : Signés 2 (Sam il y a 2 jours ; Sarah, cliente signée il y a 10 jours), Perdus 1 (Hugo ; Victor, perdu il y a 40 jours, ne compte plus), Absents 1 (Alice) ; Julien, signé il y a 45 jours, ne compte plus", tuile(ts, "Signés") === "2" && tuile(ts, "Perdus") === "1" && tuile(ts, "Absents") === "1", JSON.stringify(ts));
    const meta = await page.$$eval("[data-filtre]", l => Object.fromEntries(l.map(bt => [bt.dataset.filtre, (bt.querySelector(".meta") || {}).textContent]))).catch(() => ({}));
    ok("boutons : « Appel fait » 4 (Hugo, Victor, Sam, Alice), « Tous » 11", meta.issues === "4" && meta.tous === "11", JSON.stringify(meta));
    const trie = l => JSON.stringify(l.slice().sort());
    const TOUS = PROSPECTS.concat(ANCIENS).map(x => x.id);
    await filtre(page, "tous");
    ok("« Tous », inscrits : tous → « 11 prospects », Victor (inscrit il y a 40 jours) compris", trie(await uids(page)) === trie(TOUS) && (await texte(page, "#pr-compte")) === "11 prospects", noms(await uids(page)) + " · " + (await texte(page, "#pr-compte")));
    await choisir(page, "#pr-periode", "30j");
    ok("« Tous » + « Inscrits : 30 derniers jours » → « 10 sur 11 prospects » : seul Victor est écarté", trie(await uids(page)) === trie(TOUS.filter(u => u !== VICTOR)) && (await texte(page, "#pr-compte")) === "10 sur 11 prospects", noms(await uids(page)) + " · " + (await texte(page, "#pr-compte")));
    await choisir(page, "#pr-periode", "7j");
    ok("« Tous » + « 7 derniers jours » : Léa, Inès, Émilie, Piège, Zoé, Sam (6 jours) ; Alice (9 jours) écartée", trie(await uids(page)) === trie([LEA, INES, EMILIE, PIEGE, ZOE, SAM]), noms(await uids(page)));
    await filtre(page, "issues"); await choisir(page, "#pr-periode", "30j");
    ok("« Appel fait » + 30 jours : Hugo, Sam, Alice (Victor écarté)", trie(await uids(page)) === trie([HUGO, SAM, ALICE]), noms(await uids(page)));
    await choisir(page, "#pr-periode", "tout");
    ok("« Appel fait », inscrits : tous : Hugo, Victor, Sam, Alice ; cartes « PERDU », « SIGNÉ », « ABSENT »", trie(await uids(page)) === trie([HUGO, VICTOR, SAM, ALICE]) && (await carte(page, VICTOR)).includes("PERDU") && (await carte(page, SAM)).includes("SIGNÉ") && (await carte(page, ALICE)).includes("ABSENT"), noms(await uids(page)) + " · " + (await carte(page, SAM)).slice(0, 120));
    ok("périodes et issues anciennes : aucune écriture", db.ecritures.length === 0);
  });

  /* ---------- B. Export CSV ---------- */
  await bloc("B. export CSV", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    const { nom, t } = await exporter(page); await attendre(page, 300);
    const csv = lireCSV(t.replace(/^﻿/, ""));
    ok("export : fichier « prospects-AAAA-MM-JJ.csv » (date du jour), commence par le BOM UTF-8", nom === "prospects-" + iso(new Date()) + ".csv" && t.charCodeAt(0) === 0xFEFF, nom + " · " + t.charCodeAt(0).toString(16));
    ok("export : 15 en-têtes (Nom, Email, Inscrit le, Découverte, Objectif, Statut, Score /100, Questionnaire, Motivation /10, Clics, Dernier clic, Bilan réservé le, Relances, Dernière activité, Prochaine action)", JSON.stringify(csv.lignes[0]) === JSON.stringify(ENTETES), JSON.stringify(csv.lignes[0]));
    const L = csv.lignes.slice(1);
    ok("export du filtre « À traiter » : 6 lignes, dans l'ordre de l'écran (Inès, Émilie, Piège, Zoé, Karim, Paul), 15 cellules chacune, fins de ligne CRLF", L.length === 6 && L.every(l => l.length === 15) && JSON.stringify(L.map(l => l[0])) === JSON.stringify(["Inès Dupré", "Émilie Rousseau", "'=1+1 " + XSS, "Zoé Bernard", "Karim Benali", "Paul Durand"]) && !csv.brut && !csv.ouvert, JSON.stringify(L.map(l => l[0])) + " brut " + csv.brut);
    ok("export : chaque cellule est entre guillemets (point-virgule et guillemets du contenu sans danger)", csv.cites.every(l => l.every(Boolean)), JSON.stringify(csv.cites.map(l => l.filter(x => !x).length)));
    const ines = L[0] || [];
    /* v52 (Chantier 1, lot D) : colonne Découverte « inscrit depuis n j » (avant : « jour n/7 » / « terminée ») */
    const depuis = j => j <= 1 ? "inscrit aujourd'hui" : "inscrit depuis " + (j - 1) + " j";
    const attI = ["Inès Dupré", "ines.dupre@exemple.fr", fr(avant(26 * H)), depuis(jourDe(avant(26 * H))), "Perte de poids / sèche", "CHAUD", "100", "rempli le " + fr(avant(25 * H)), "9", "1", fr(avant(24 * H)), fr(avant(23 * H)), "1", fr(avant(60000)), "Prépare le bilan : relis sa fiche (questionnaire, obstacle, motivation). Après l'appel, indique Signé, Perdu ou Absent."];
    ok("ligne d'Inès : toutes les valeurs (dates locales, jour de découverte, CHAUD, 100, motivation 9, 1 clic, bilan réservé, 1 relance, dernière activité, action)", JSON.stringify(ines) === JSON.stringify(attI), JSON.stringify(ines) + " attendu " + JSON.stringify(attI));
    const emi = L[1] || [];
    ok("ligne d'Émilie : TIÈDE, 70, 2 clics, dernier clic, pas de bilan réservé, « DM : il a cliqué sans réserver… »", emi[5] === "TIÈDE" && emi[6] === "70" && emi[9] === "2" && emi[10] === fr(avant(10 * H)) && emi[11] === "" && emi[14] === "DM : il a cliqué sans réserver, demande-lui ce qui le retient.", JSON.stringify(emi));
    const pg = L[2] || [];
    ok("ligne piégée : nom « '=1+1 <img …> » et email « '@piege.fr » neutralisés (apostrophe), objectif « Perdre \"vite\"; bien » relu intact, FROID, 16, « 3/10 réponses »", pg[0] === "'=1+1 " + XSS && pg[1] === "'@piege.fr" && pg[4] === 'Perdre "vite"; bien' && pg[5] === "FROID" && pg[6] === "16" && pg[7] === "3/10 réponses" && pg[9] === "0" && pg[12] === "0", JSON.stringify(pg));
    const zo = L[3] || [], ka = L[4] || [], pa = L[5] || [];
    /* v52 (28/09/2026, Chantier 1 lot C) : Paul, qui n'a rien répondu, est compté sur les 3 questions du nouveau questionnaire
       (« 0/3 » ; avant « 0/10 ») ; Zoé, qui a commencé l'ancien, reste comptée sur 10 */
    ok("Zoé « 5/10 réponses », score 25 ; Karim objectif « +5 kg de muscle » neutralisé (« '+5 kg… »), « inscrit depuis n j » (v52 ; avant : « terminée ») ; Paul « 0/3 réponses », « Relance : sa découverte est finie sans questionnaire… »", zo[7] === "5/10 réponses" && zo[6] === "25" && ka[4] === "'+5 kg de muscle" && /^inscrit depuis \d+ j$/.test(ka[3]) && ka[14] === "Relance : sa découverte est terminée, propose-lui le bilan." && pa[7] === "0/3 réponses" && pa[13] === "" && pa[14] === "Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan.", JSON.stringify([zo[6], zo[7], ka[3], ka[4], pa[7], pa[14]]));
    ok("export : toast « 6 prospects exportés. », aucune écriture", (await toasts(page)).includes("6 prospects exportés.") && db.ecritures.length === 0, JSON.stringify(await toasts(page)));
    /* un autre filtre : l'export suit l'écran */
    await filtre(page, "tous"); await choisir(page, "#pr-prog", "q_fait");
    const e2 = await exporter(page); const L2 = lireCSV(e2.t.replace(/^﻿/, "")).lignes.slice(1);
    const hugo = L2.find(l => l[0] === "Hugo Petit") || [];
    ok("« Tous » + « Questionnaire rempli » : 4 lignes (Inès, Émilie, Karim, Hugo) ; Hugo objectif « '-8 kg » neutralisé, PERDU, « Relance prévue dans 25 jours. »", L2.length === 4 && JSON.stringify(L2.map(l => l[0])) === JSON.stringify(["Inès Dupré", "Émilie Rousseau", "Karim Benali", "Hugo Petit"]) && hugo[4] === "'-8 kg" && hugo[5] === "PERDU" && hugo[14] === "Relance prévue dans 25 jours.", JSON.stringify(L2.map(l => l[0])) + " " + JSON.stringify(hugo));
    await choisir(page, "#pr-prog", "tout"); await chercher(page, "zzz");
    let telecharge = false; page.once("download", () => { telecharge = true; });
    await page.click("#pr-csv"); await attendre(page, 1500);
    ok("rien à exporter (recherche « zzz ») : pas de fichier, toast « Aucun prospect à exporter avec ces filtres. »", !telecharge && (await toasts(page)).includes("Aucun prospect à exporter avec ces filtres."), JSON.stringify(await toasts(page)));
  });

  /* ---------- C. Fiche d'un prospect ---------- */
  await bloc("C. fiche d'Inès", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 400);
    await ouvrirFiche(page, INES);
    const sc = await lignesLi(page, "#fiche-score");
    const attS = [["Inscription", "10 / 10"], ["Questionnaire rempli", "30 / 30"], ["Clic « Réserver mon bilan » (1 fois)", "30 / 30"], ["Bilan réservé", "30 / 30"], ["Revenu plusieurs jours (2 jours d'activité) (bonus)", "5 / 5"], ["Temps passé dans l'app (12 min) (bonus)", "5 / 5"], ["Email ouvert (1 email de suivi envoyé) (bonus)", "5 / 5"]];
    ok("score détaillé : inscription 10, questionnaire 30, clic 30, bilan 30, bonus visites (2 jours), temps (12 min), email ouvert (1 envoyé) ; total « 100/100 » plafonné", JSON.stringify(sc) === JSON.stringify(attS) && (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "100/100", JSON.stringify(sc) + " · " + (await texte(page, "#fiche-score .seance-c-tete .pastille")));
    const rep = await lignesLi(page, "#fiche-reponses"), repM = Object.fromEntries(rep);
    ok("réponses : « 10 / 10 réponses, validé le … », email, sexe, âge, objectif, motivation « 9 / 10 », déclic « Mariage en juin »", (await texte(page, "#fiche-reponses p.note")) === "10 / 10 réponses, validé le " + fr(avant(25 * H)) + "." && repM.Email === "ines.dupre@exemple.fr" && rep.some(([k, v]) => v === "Femme") && rep.some(([k, v]) => v === "31") && rep.some(([k, v]) => v === "Perte de poids / sèche") && rep.some(([k, v]) => v === "9 / 10") && rep.some(([k, v]) => v === "Mariage en juin") && rep.length === 11, (await texte(page, "#fiche-reponses p.note")) + " " + JSON.stringify(rep));
    const ch = await chrono(page);
    const attC = ["Dernière activité dans l'app", "Tu l'as relancé", "Email de suivi « bienvenue » ouvert", "Bilan réservé (case « J'ai réservé » cochée)", "Clic « Réserver mon bilan » (en haut de sa Découverte)", "Questionnaire rempli", "Questionnaire commencé", "Email de suivi « bienvenue » envoyé", "Inscription"];
    const dates = ch.map(x => Date.parse(x.dt));
    ok("chronologie dans l'ordre (la plus récente d'abord) : activité, relance, email ouvert, bilan réservé, clic, questionnaire rempli, commencé, email envoyé, inscription", JSON.stringify(ch.map(x => x.t)) === JSON.stringify(attC) && dates.every((d, i) => i === 0 || dates[i - 1] >= d), JSON.stringify(ch.map(x => x.t)));
    ok("chronologie : chaque ligne datée « jj/mm/aaaa hh:mm » en heure locale (inscription : " + fr(avant(26 * H)) + " " + hm(avant(26 * H)) + ")", ch.length === 9 && ch.every(x => /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(x.aff)) && ch[8].aff === fr(avant(26 * H)) + " " + hm(avant(26 * H)), JSON.stringify(ch.map(x => x.aff)));
    ok("chronologie : « 2 jours d'activité, 12 min dans l'app · pages vues : decouverte-resultat (4), formation (2), verrou-programme (1). »", (await texte(page, "#fiche-chrono p.note")) === "2 jours d'activité, 12 min dans l'app · pages vues : decouverte-resultat (4), formation (2), verrou-programme (1).", await texte(page, "#fiche-chrono p.note"));
    const lien = await page.$eval("#dc-lien", e => e.value).catch(() => "");
    const lienAtt = lienPour("Inès", "Dupré", "ines.dupre@exemple.fr");
    ok("lien de réservation exact : " + lienAtt, lien === lienAtt, lien);
    const href = await page.getAttribute("#dc-mail", "href").catch(() => "");
    const mt = (() => { try { const [a, qs] = href.slice(7).split("?"); const P = new URLSearchParams(qs.replace(/\+/g, "%2B")); return { a: decodeURIComponent(a), s: P.get("subject"), c: P.get("body") }; } catch (e) { return {}; } })();
    ok("« Lui écrire un email » : mailto:ines.dupre@exemple.fr, objet « Ton bilan MHX Coaching », message « Bonjour Inès, … » avec le lien exact et la signature du coach", href.startsWith("mailto:") && mt.a === "ines.dupre@exemple.fr" && mt.s === "Ton bilan MHX Coaching" && (mt.c || "").startsWith("Bonjour Inès,\n\n") && (mt.c || "").includes("\n" + lienAtt + "\n") && (mt.c || "").endsWith("Coach — MHX Coaching"), JSON.stringify(mt).slice(0, 300));
    /* Copier : presse-papiers intercepté */
    await page.evaluate(() => { window.__copie = null; Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: t => { window.__copie = t; return Promise.resolve(); } }); });
    await page.click("#dc-copier"); await attendre(page, 300);
    ok("« Copier le lien » : le lien exact part au presse-papiers, « Lien copié. »", (await page.evaluate(() => window.__copie)) === lienAtt && (await texte(page, "#dc-copie-msg")) === "Lien copié.", (await page.evaluate(() => window.__copie)) + " · " + (await texte(page, "#dc-copie-msg")));
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: () => Promise.reject(new Error("refus")) }); document.execCommand = () => false; });
    await page.click("#dc-copier"); await attendre(page, 300);
    const sel = await page.evaluate(() => { const c = document.getElementById("dc-lien"); return document.activeElement === c && c.selectionStart === 0 && c.selectionEnd === c.value.length; }).catch(() => false);
    ok("presse-papiers refusé : « Copie impossible : le lien est sélectionné, copie-le à la main. », lien sélectionné dans son champ", (await texte(page, "#dc-copie-msg")) === "Copie impossible : le lien est sélectionné, copie-le à la main." && sel, await texte(page, "#dc-copie-msg"));
    ok("fiche du prospect : aucune écriture, aucune injection", db.ecritures.length === 0 && !(await xss(page)));
    await page.screenshot({ path: path.join(OUT, "fiche-ines.png"), fullPage: true });
    /* le coach n'a pas d'activité suivie : ni en arrière-plan, ni à la fermeture, rien n'est relu ni écrit (surtout pas chez Inès, dont la fiche est ouverte) */
    const n0 = db.lectures.length;
    await cacher(page); await attendre(page, 1500); await montrer(page);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 1500);
    ok("coach sur la fiche d'Inès, onglet en arrière-plan puis fermeture (pagehide) : aucune lecture de la clé activite, aucune écriture", lu(db, "activite", n0) === 0 && db.ecritures.length === 0, JSON.stringify(db.lectures.slice(n0)) + " · " + JSON.stringify(db.ecritures.map(e => e.outil)));
  });

  await bloc("C. fiches de Léa, Zoé et du prospect piégé", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 400);
    await ouvrirFiche(page, LEA);
    const lienL = await page.$eval("#dc-lien", e => e.value).catch(() => "");
    /* v52 : rien répondu = nouveau questionnaire court, 3 questions (avant : « 0/10 réponses ») */
    ok("Léa (rien fait) : score 10/100, « Questionnaire en cours (0/3 réponses) » 0 / 30, chronologie « Inscription » seule", (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "10/100" && (await lignesLi(page, "#fiche-score")).some(([k, v]) => k === "Questionnaire en cours (0/3 réponses)" && v === "0 / 30") && JSON.stringify((await chrono(page)).map(x => x.t)) === '["Inscription"]', JSON.stringify(await lignesLi(page, "#fiche-score")));
    ok("Léa sans email : lien avec son prénom et son nom, sans email (" + lienPour("Léa", "Martin", "") + "), pas de mailto, « Email inconnu : il apparaît quand le prospect a commencé son questionnaire. »", lienL === lienPour("Léa", "Martin", "") && !(await page.$("#dc-mail")) && (await texte(page, "#fiche-actions")).includes("Email inconnu : il apparaît quand le prospect a commencé son questionnaire."), lienL);
    await aller(page, "#/prospects", 2000);
    await ouvrirFiche(page, ZOE);
    const sz = await lignesLi(page, "#fiche-score");
    ok("Zoé : « Questionnaire en cours (5/10 réponses) » 10 / 30, « Email ouvert (1 email de suivi envoyé) » 5 / 5, total 25/100", sz.some(([k, v]) => k === "Questionnaire en cours (5/10 réponses)" && v === "10 / 30") && sz.some(([k, v]) => k === "Email ouvert (1 email de suivi envoyé) (bonus)" && v === "5 / 5") && (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "25/100", JSON.stringify(sz));
    const cz = (await chrono(page)).map(x => x.t);
    ok("Zoé, chronologie : lien cliqué, email ouvert, email envoyé (« relance »), questionnaire commencé, inscription", JSON.stringify(cz) === JSON.stringify(["Email de suivi « relance » : lien cliqué", "Email de suivi « relance » ouvert", "Email de suivi « relance » envoyé", "Questionnaire commencé", "Inscription"]), JSON.stringify(cz));
    ok("Zoé : réponses « 5 / 10 réponses, pas encore validé. », mailto vers zoe.bernard@exemple.fr", (await texte(page, "#fiche-reponses p.note")) === "5 / 10 réponses, pas encore validé." && ((await page.getAttribute("#dc-mail", "href").catch(() => "")) || "").startsWith("mailto:zoe.bernard%40exemple.fr?"), await texte(page, "#fiche-reponses p.note"));
    await aller(page, "#/prospects", 2000);
    await ouvrirFiche(page, PIEGE);
    const sp = await lignesLi(page, "#fiche-score"), cp = (await chrono(page)).map(x => x.t);
    const lienP = await page.$eval("#dc-lien", e => e.value).catch(() => "");
    ok("prospect piégé : fiche affichée, score 16/100 (3/10 réponses, email non ouvert), chronologie « Inscription » seule (dates piégées ignorées)", (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "16/100" && sp.some(([k, v]) => k === "Questionnaire en cours (3/10 réponses)" && v === "6 / 30") && JSON.stringify(cp) === '["Inscription"]', JSON.stringify(sp) + " " + JSON.stringify(cp));
    ok("prospect piégé : « 0 jour d'activité, 0 min dans l'app. » (pages piégées écartées), lien sans email (« @piege.fr » invalide), pas de mailto", (await texte(page, "#fiche-chrono p.note")) === "0 jour d'activité, 0 min dans l'app." && lienP === lienPour("=1+1", XSS, "") && !(await page.$("#dc-mail")), (await texte(page, "#fiche-chrono p.note")) + " · " + lienP);
    ok("prospect piégé : aucune injection (nom, obstacle, modèle d'email), aucune écriture", !(await xss(page)) && (await texte(page, "#vue .masthead h1")).startsWith("=1+1 " + XSS) && db.ecritures.length === 0, await texte(page, "#vue .masthead h1"));
  });

  /* ---------- D. Journal des emails absent (table pas encore créée : 404) ---------- */
  await bloc("D. journal des emails absent", async () => {
    const db = base({ sansJournal: true });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 600);
    ok("table emails_prospects absente (404) : la page s'affiche, « score moyen 38/100 » (Zoé perd son bonus email)", (await texte(page, "#pr-vue .masthead .lede")).endsWith("score moyen 38/100") && db.chemins.includes("GET /rest/v1/emails_prospects"), await texte(page, "#pr-vue .masthead .lede"));
    ok("… carte de Zoé : « 20/100 »", (await carte(page, ZOE)).includes("20/100"), await carte(page, ZOE));
    await ouvrirFiche(page, ZOE);
    const sz = await lignesLi(page, "#fiche-score");
    ok("fiche de Zoé : « Email ouvert (pas encore mesuré : emails non branchés) » —, total 20/100", sz.some(([k, v]) => k === "Email ouvert (pas encore mesuré : emails non branchés) (bonus)" && v === "—") && (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "20/100", JSON.stringify(sz));
    ok("fiche de Zoé : chronologie sans aucun email (questionnaire commencé, inscription)", JSON.stringify((await chrono(page)).map(x => x.t)) === '["Questionnaire commencé","Inscription"]', JSON.stringify((await chrono(page)).map(x => x.t)));
    await aller(page, "#/prospects", 2000); await ouvrirFiche(page, INES);
    ok("fiche d'Inès sans journal : « pas encore mesuré », toujours 100/100 (plafond), pas d'email dans la chronologie", (await lignesLi(page, "#fiche-score")).some(([k, v]) => k.startsWith("Email ouvert (pas encore mesuré") && v === "—") && (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "100/100" && !(await chrono(page)).some(x => x.t.startsWith("Email")), JSON.stringify((await chrono(page)).map(x => x.t)));
    ok("journal absent : aucune écriture", db.ecritures.length === 0);
  });

  /* ---------- E. Nouveautés ---------- */
  await bloc("E. Nouveautés (tableau de bord)", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    const pan = await texte(page, "#tb-nouveautes");
    const types = await page.$$eval("#tb-nouveautes .nv-types .pastille", l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("première visite (pas de coach_notifs) : « Ces 7 derniers jours : », 11 nouveautés — 5 inscriptions, 2 questionnaires remplis, 3 clics « Réserver », 1 bilan réservé", pan.includes("Ces 7 derniers jours :") && (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "11" && JSON.stringify(types) === JSON.stringify(["5 inscriptions", "2 questionnaires remplis", "3 clics « Réserver »", "1 bilan réservé"]), JSON.stringify(types) + " · " + pan.slice(0, 120));
    const li = await page.$$eval("#tb-nouveautes .nv-liste li .nv-txt", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    const attL = ["Léa Martin · inscription", "Émilie Rousseau · clic « Réserver mon bilan »", "Inès Dupré · bilan réservé", "Inès Dupré · clic « Réserver mon bilan »", "Inès Dupré · questionnaire rempli", "Inès Dupré · inscription", "Émilie Rousseau · clic « Réserver mon bilan »", "Émilie Rousseau · questionnaire rempli"];
    const lienTout = await page.$eval('#tb-nouveautes a[href="#/prospects"]', a => a.textContent.trim()).catch(() => "");
    ok("liste : les 8 plus récentes, de la plus récente à la plus ancienne, « Et 3 autres : tout voir dans la page Prospects → » (lien vers #/prospects)", JSON.stringify(li) === JSON.stringify(attL) && pan.includes("Et 3 autres : tout voir dans la page Prospects →") && lienTout === "tout voir dans la page Prospects →", JSON.stringify(li) + " · lien « " + lienTout + " »");
    ok("7 jours : Karim (8 jours) et Paul (10 jours) absents, le client Julien (inscrit il y a 3 h) jamais compté", !pan.includes("Karim") && !pan.includes("Paul") && !pan.includes("Julien"));
    ok("badge « 11 » sur l'onglet Prospects", JSON.stringify(await badge(page)) === '["11"]', JSON.stringify(await badge(page)));
    const tp = await page.$eval(`#tb-prospects .sc-carte[data-uid="${INES}"]`, e => e.textContent).then(norm).catch(() => "");
    ok("tableau de bord, « Prospects à traiter » : carte d'Inès avec « 100/100 » et son email", tp.includes("100/100") && tp.includes("ines.dupre@exemple.fr"), tp.slice(0, 200));
    ok("affichage : aucune écriture (coach_notifs pas écrit tant qu'on ne clique pas)", db.ecritures.length === 0, JSON.stringify(db.ecritures));
    const t0 = Date.now();
    await page.click("#tb-nouveautes [data-nv-vu]"); await attendre(page, 1600);
    const N = contenu(db, "coach_notifs", F.IDS.coach) || {};
    ok("« Tout marquer comme vu » : clé du coach coach_notifs = { vu : maintenant } (une écriture)", ecr(db, "coach_notifs", F.IDS.coach).length === 1 && typeof N.vu === "string" && Math.abs(Date.parse(N.vu) - t0) < 10000 && db.ecritures.length === 1, JSON.stringify(N));
    ok("… panneau « Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + "). », badge disparu", (await texte(page, "#tb-nouveautes")).includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ").") && (await badge(page)).length === 0, (await texte(page, "#tb-nouveautes")) + " · " + JSON.stringify(await badge(page)));
    await aller(page, "#/prospects", 2200);
    ok("page Prospects ensuite : « Rien de nouveau… », toujours pas de badge", (await texte(page, "#pr-nouveautes")).includes("Rien de nouveau chez tes prospects depuis ta dernière visite") && (await badge(page)).length === 0, await texte(page, "#pr-nouveautes"));
    /* un nouveau prospect s'inscrit après la visite */
    await attendre(page, 1100);
    db.profils.push({ id: NINA, prenom: "Nina", nom: "Nouvelle", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    await aller(page, "#/tableau", 2400);
    const li2 = await page.$$eval("#tb-nouveautes .nv-liste li .nv-txt", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    ok("nouvelle inscription après la visite : « Depuis ta dernière visite (…) : », 1 nouveauté « Nina Nouvelle · inscription », badge « 1 »", JSON.stringify(li2) === '["Nina Nouvelle · inscription"]' && (await texte(page, "#tb-nouveautes")).includes("Depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ") :") && JSON.stringify(await badge(page)) === '["1"]', JSON.stringify(li2) + " · " + JSON.stringify(await badge(page)));
    await page.reload(); await attendre(page, 2600);
    ok("après rechargement (coach_notifs relu en base) : toujours 1 nouveauté, badge « 1 »", (await page.$$("#tb-nouveautes .nv-liste li")).length === 1 && JSON.stringify(await badge(page)) === '["1"]', JSON.stringify(await badge(page)));
    await page.click(`#tb-nouveautes [data-nv-ouvrir="${NINA}"]`); await attendre(page, 2400);
    ok("« Ouvrir » dans les Nouveautés : la fiche de Nina s'ouvre", (await texte(page, "#vue .masthead h1")).startsWith("Nina Nouvelle") && !!(await page.$("#fiche-score")), await texte(page, "#vue .masthead h1"));
    ok("Nouveautés : une seule écriture en tout (coach_notifs), aucune injection", db.ecritures.length === 1 && !(await xss(page)), JSON.stringify(db.ecritures.map(e => e.outil)));
  });
  await bloc("E. Nouveautés depuis la dernière visite", async () => {
    const vu = avant(30 * H);
    const db = base({ cles: [[F.IDS.coach, "coach_notifs", { vu }, vu]] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    const types = await page.$$eval("#pr-nouveautes .nv-types .pastille", l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("coach_notifs.vu il y a 30 h : page Prospects « Depuis ta dernière visite (" + fr(vu) + " " + hm(vu) + ") : », 6 nouveautés (2 inscriptions, 1 questionnaire, 2 clics, 1 bilan), badge « 6 »", (await texte(page, "#pr-nouveautes")).includes("Depuis ta dernière visite (" + fr(vu) + " " + hm(vu) + ") :") && (await texte(page, "#pr-nouveautes .seance-c-tete .pastille")) === "6" && JSON.stringify(types) === JSON.stringify(["2 inscriptions", "1 questionnaire rempli", "2 clics « Réserver »", "1 bilan réservé"]) && JSON.stringify(await badge(page)) === '["6"]', JSON.stringify(types) + " · " + JSON.stringify(await badge(page)));
    ok("… le clic d'Émilie d'il y a 31 h et son questionnaire (40 h) n'y sont pas ; rien n'est écrit", !(await texte(page, "#pr-nouveautes")).includes("Émilie Rousseau · questionnaire rempli") && (await page.$$("#pr-nouveautes .nv-liste li")).length === 6 && db.ecritures.length === 0);
  });
  await bloc("E. Nouveautés : coach_notifs piégé", async () => {
    for (const [quoi, v] of [["texte brut", "texte brut"], ["liste", [1, 2]], ["vu nombre", { vu: 12345 }], ["vu en HTML", { vu: XSS }]]) {
      const db = base({ cles: [[F.IDS.coach, "coach_notifs", v, avant(H)]] });
      const { c, page } = await contexte(b, coach, db);
      await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);
      if (quoi === "vu en HTML") ok(`coach_notifs piégé (${quoi}) : panneau affiché, aucune injection, aucune écriture`, !!(await page.$("#tb-nouveautes .nv-panneau")) && !(await xss(page)) && db.ecritures.length === 0, (await texte(page, "#tb-nouveautes")).slice(0, 120));
      else ok(`coach_notifs piégé (${quoi}) : comme une première visite (7 jours, 11 nouveautés), aucune injection, aucune écriture`, (await texte(page, "#tb-nouveautes")).includes("Ces 7 derniers jours :") && (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "11" && !(await xss(page)) && db.ecritures.length === 0, (await texte(page, "#tb-nouveautes")).slice(0, 120));
      await c.close();
    }
  });
  await bloc("E. Nouveautés : nom piégé", async () => {
    /* le prospect piégé clique il y a 1 h, un autre au nom piégé (guillemets, apostrophe, balise, entité) s'inscrit il y a 10 min :
       les deux sont en tête de la liste (sans cela, le nom piégé n'y apparaît jamais : 10e nouveauté sur 11, 8 affichées) */
    const QUOTE = PID(11), prenomQ = 'Guill" onmouseover="window.__xss=1" data-x="', nomQ = "O'Brien <i>&amp;</i>";
    const litQ = prenomQ + " " + nomQ, litP = "=1+1 " + XSS, clicP = avant(H), creeQ = avant(10 * 60000);
    const prospects = PROSPECTS.map(x => x.id !== PIEGE ? x : Object.assign({}, x, { donnees: x.donnees.map(([o, c, m]) => o === "challenge" ? [o, Object.assign({}, c, { cta: { clics: [null, 5, "x", { jour: 1, source: "decouverte", date: clicP }] } }), m] : [o, c, m]) })).concat([{ id: QUOTE, prenom: prenomQ, nom: nomQ, cree: creeQ }]);
    const db = base({ prospects, journal: JOURNAL });
    const { page } = await contexte(b, coach, db);
    const lignesNv = sel => page.$$eval(sel + " .nv-liste li", l => l.map(li => { const bt = li.querySelector("[data-nv-ouvrir]"), t = li.querySelector("time"), g = li.querySelector("b"), x = li.querySelector(".nv-txt"); return { uid: bt && bt.dataset.nvOuvrir, nom: g && g.textContent, dataNom: bt && bt.getAttribute("data-nom"), dt: t && t.getAttribute("datetime"), txt: x && x.textContent.replace(/\s+/g, " ").trim() }; })).catch(() => []);
    const verifier = async (sel, ou) => {
      const L = await lignesNv(sel), q = L[0] || {}, pg = L[1] || {};
      ok(`${ou} : en tête « ${litQ} · inscription » puis « ${litP} · clic » — noms affichés tels quels, attribut data-nom intact, date exacte`, q.uid === QUOTE && q.nom === litQ && q.dataNom === litQ && q.dt === creeQ && q.txt === litQ + " · inscription" && pg.uid === PIEGE && pg.nom === litP && pg.dataNom === litP && pg.dt === clicP && pg.txt === litP + " · clic « Réserver mon bilan »", JSON.stringify(L.slice(0, 2)));
      ok(`${ou} : aucune injection (ni image, ni balise <i>, ni attribut onmouseover), aucune écriture`, !(await xss(page)) && db.ecritures.length === 0);
    };
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 400);
    await verifier("#tb-nouveautes", "Nouveautés du tableau de bord");
    await aller(page, "#/prospects", 2200); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 });
    await verifier("#pr-nouveautes", "Nouveautés de la page Prospects");
    await page.click(`#pr-nouveautes [data-nv-ouvrir="${QUOTE}"]`); await attendre(page, 2400);
    ok("« Ouvrir » sur le nom piégé : sa fiche s'ouvre, nom affiché tel quel, aucune injection", (await texte(page, "#vue .masthead h1")).startsWith(norm(litQ)) && !!(await page.$("#fiche-score")) && !(await xss(page)), await texte(page, "#vue .masthead h1"));
  });
  await bloc("E. Nouveautés : dates non ISO", async () => {
    /* Date.parse de Chrome accepte des chaînes non ISO (« <img src=x…> » = une date de 2001, « Sep 26 2026 10:00 » = une vraie
       date) ; la fiche (chronologie) et l'export CSV exigent AAAA-MM-JJ. Les Nouveautés doivent faire pareil. */
    const MOIS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hier = new Date(T0 - J); const floue = MOIS[hier.getMonth()] + " " + hier.getDate() + " " + hier.getFullYear() + " 10:00";
    const db = base({ cles: [[F.IDS.coach, "coach_notifs", { vu: XSS }, avant(H)]], prospects: PROSPECTS.concat([{ id: PID(10), prenom: "Date", nom: "Floue", cree: avant(9 * J), donnees: [["challenge", { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "decouverte", date: floue }] } }, avant(J)]] }]) });
    db.emails_prospects = journalDe(JOURNAL);
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 400);
    const pan = await texte(page, "#tb-nouveautes");
    connu("dates non ISO ignorées comme dans la fiche : coach_notifs.vu « <img…> » traité comme absent (7 jours, 11 nouveautés) et le clic daté « " + floue + " » (écrit par un prospect) pas compté", pan.includes("Ces 7 derniers jours :") && (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "11" && !pan.includes("Date Floue"), (await texte(page, "#tb-nouveautes .note")).slice(0, 60) + " · " + (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) + " nouveautés · " + JSON.stringify(await page.$$eval("#tb-nouveautes .nv-liste li", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(t => t.includes("Date Floue"))).catch(() => [])));
    ok("dates non ISO : aucune injection, aucune écriture", !(await xss(page)) && db.ecritures.length === 0);
  });

  /* ---------- F. Accord pour les emails : la newsletter ----------
     v52 (chantier 1, lot B) : la case « emails de suivi » est remplacée par la case NEWSLETTER (facultative, décochée) :
     métadonnée newsletter (instant ou null) + newsletter_version, plus d'emails_suivi ; l'interrupteur du Profil pilote
     emails.newsletter (date, version, source « profil ») ; l'ancien accord (emails_suivi, emails.suivi) ne vaut pas
     newsletter. Détails (copie à la première ouverture, anglais, cas limites) : verif55 blocs E et F. */
  const NEWS = "Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email.";
  const V_NEWS = "2026-09-28c";   // version du texte de la case newsletter (DECOUVERTE.accords.newsletter)
  await bloc("F. case de l'inscription", async () => {
    ok("le fichier testé garde inscription_libre: false (l'inscription n'est ouverte ici que dans la page servie par le banc)", fs.readFileSync(HTML, "utf8").includes("inscription_libre: false"));
    inscriptionLibre = true;
    try {
      for (const coche of [true, false]) {
        const db = base();
        const { c, page } = await contexte(b, null, db);
        await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1200);
        await page.click('[data-mode="inscription"]'); await attendre(page, 400);
        const lib = await texte(page, "label.co-newsletter");
        if (coche) ok("inscription : case facultative « " + NEWS.slice(0, 60) + "… » (texte exact), décochée par défaut ; plus de case « emails de suivi »", lib === NEWS && (await page.$eval("#c-newsletter", e => e.checked).catch(() => null)) === false && !(await page.$("#c-emails")), lib);
        if (coche) {
          await page.click("#c-cgu-lien"); await attendre(page, 500);
          const vt = await texte(page, "body");
          ok("conditions (volet) : paragraphe « Newsletter (facultative) : … 1 à 2 emails par semaine au plus. Désinscription en 1 clic … », plus « Emails de suivi » ni « au plus 3 emails »", vt.includes("Newsletter (facultative) : si tu coches la case, tu reçois par email les conseils, témoignages et offres de coaching de MHX Coaching, 1 à 2 emails par semaine au plus.") && vt.includes("Désinscription en 1 clic dans chaque email, et retrait de ton accord possible à tout moment dans ton Profil.") && !vt.includes("Emails de suivi (facultatif)") && !vt.includes("au plus 3 emails"));
          await page.keyboard.press("Escape"); await attendre(page, 300);
          await page.evaluate(() => { const f = document.querySelector("[data-ui-fermer]"); if (f) f.click(); }).catch(() => {}); await attendre(page, 300);
        }
        await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Martin"); await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
        await page.check("#c-cgu"); await page.check("#c-sante"); if (coche) await page.check("#c-newsletter");
        const t0 = Date.now();
        await page.click("#c-go"); await attendre(page, 2500);
        const md = (db.inscriptions[0] || {}).data || {};
        if (coche) ok("case cochée : l'inscription porte newsletter = l'instant de l'inscription et newsletter_version (métadonnées du compte), plus d'emails_suivi", db.inscriptions.length === 1 && typeof md.newsletter === "string" && Math.abs(Date.parse(md.newsletter) - t0) < 10000 && md.newsletter_version === V_NEWS && !("emails_suivi" in md), JSON.stringify(md));
        else ok("case laissée vide : l'inscription passe quand même, newsletter = null, plus d'emails_suivi", db.inscriptions.length === 1 && "newsletter" in md && md.newsletter === null && !("emails_suivi" in md) && typeof md.consentement_sante === "string", JSON.stringify(md));
        await c.close();
      }
    } finally { inscriptionLibre = false; }
  });
  await bloc("F. interrupteur du Profil", async () => {
    const leaMeta = qui(LEA, "lea.martin@exemple.fr", { prenom: "Léa", nom: "Martin", newsletter: avant(2 * H), newsletter_version: V_NEWS });
    const db = base({ cles: [[LEA, "emails", { newsletter: true, maj: avant(2 * H), version: V_NEWS, source: "inscription" }, avant(2 * H)]] });
    const { page } = await contexte(b, leaMeta, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
    const etat = () => page.$eval("#mc-emails", e => ({ c: e.checked, d: e.disabled })).catch(() => null);
    ok("Profil du prospect : bloc « Newsletter », interrupteur coché d'après la clé emails (copie de la case de l'inscription), actif", (await texte(page, "#mc-emails-bloc h2")) === "Newsletter" && JSON.stringify(await etat()) === '{"c":true,"d":false}' && lu(db, "emails") >= 1, JSON.stringify(await etat()) + " lectures emails " + lu(db, "emails"));
    await page.click("#mc-emails-bloc label.switch"); await attendre(page, 1400);
    const E1 = contenu(db, "emails", LEA) || {};
    ok("décoché : clé emails = { newsletter: false, maj, version, source: « profil » } écrite, « C'est noté : plus aucune newsletter. »", E1.newsletter === false && E1.version === V_NEWS && E1.source === "profil" && typeof E1.maj === "string" && !isNaN(Date.parse(E1.maj)) && ecr(db, "emails", LEA).length === 1 && (await texte(page, "#mc-emails-msg")) === "C'est noté : plus aucune newsletter.", JSON.stringify(E1) + " · " + (await texte(page, "#mc-emails-msg")));
    await page.click("#mc-emails-bloc label.switch"); await attendre(page, 1400);
    const E2 = contenu(db, "emails", LEA) || {};
    ok("recoché : { newsletter: true, maj, version }, « C'est noté : tu recevras la newsletter. »", E2.newsletter === true && E2.version === V_NEWS && ecr(db, "emails", LEA).length === 2 && (await texte(page, "#mc-emails-msg")) === "C'est noté : tu recevras la newsletter.", JSON.stringify(E2));
    ok("interrupteur : seule la clé emails est écrite (ni intake, ni profil, ni compte, ni activite : pas de minute écoulée, pas d'arrière-plan)", db.ecritures.every(e => e.outil === "emails") && ecr(db, "activite").length === 0, JSON.stringify(db.ecritures.map(e => e.table + ":" + e.outil)));
  });
  await bloc("F. la clé emails l'emporte ; lecture ratée", async () => {
    const leaMeta = qui(LEA, "lea.martin@exemple.fr", { prenom: "Léa", nom: "Martin", newsletter: avant(2 * H), newsletter_version: V_NEWS });
    const db = base({ cles: [[LEA, "emails", { newsletter: false, maj: avant(H), version: V_NEWS, source: "profil" }, avant(H)]] });
    const { c, page } = await contexte(b, leaMeta, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
    ok("case cochée à l'inscription mais clé emails { newsletter: false } : interrupteur décoché (la clé l'emporte), rien d'écrit", (await page.$eval("#mc-emails", e => e.checked).catch(() => null)) === false && ecr(db, "emails").length === 0);
    await c.close();
    const db2 = base();
    const { c: c2, page: p2 } = await contexte(b, qui(LEA, "lea.martin@exemple.fr", { prenom: "Léa", emails_suivi: avant(2 * H) }), db2);
    await p2.goto(`http://localhost:${PORT}/#/profil`); await attendre(p2, 2600);
    ok("ancien accord « emails de suivi » seulement (emails_suivi), ni case newsletter ni clé : interrupteur décoché, actif", (await p2.$eval("#mc-emails", e => e.checked + "|" + e.disabled).catch(() => null)) === "false|false");
    await c2.close();
    const db3 = base({ lectureKo: ["emails"] });
    const { page: p3 } = await contexte(b, leaMeta, db3);
    await p3.goto(`http://localhost:${PORT}/#/profil`); await attendre(p3, 2600);
    await p3.click("#mc-emails-bloc label.switch").catch(() => {}); await attendre(p3, 1200);
    ok("lecture de la clé emails ratée (500) : interrupteur désactivé, « Non enregistré : réessaie dans un instant. », rien d'écrit", (await p3.$eval("#mc-emails", e => e.disabled).catch(() => null)) === true && (await texte(p3, "#mc-emails-msg")) === "Non enregistré : réessaie dans un instant." && ecr(db3, "emails").length === 0, await texte(p3, "#mc-emails-msg"));
  });

  /* ---------- G. Activité du prospect, email et début du questionnaire ---------- */
  const ACT = PID(20);
  const leaAct = qui(ACT, "lea.martin@exemple.fr");
  const seule = (donnees) => [{ id: ACT, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: donnees || [] }];
  await bloc("G. pages comptées, relecture puis écriture", async () => {
    const baseAct = { version: 1, jours: [ilYA(1)], pages: { formation: 2, "decouverte-questionnaire": 1 }, temps_s: 100, derniere: avant(J) };
    const db = base({ prospects: seule([["activite", baseAct, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    const t0 = Date.now();
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("affichage de la Découverte : la clé activite n'est pas lue", lu(db, "activite") === 0, JSON.stringify(db.lectures.map(x => x.outil)));
    const n0 = db.lectures.length;
    await aller(page, "#/programme", 1400);
    const v1 = !!(await page.$("#vue .verrou"));
    await aller(page, "#/journal", 1400);   // v52 (lot D) : Ma progression est ouverte au prospect ; page verrouillée : « Mon journal »
    ok("pages verrouillées #/programme et #/journal : aucune donnée lue (ni activite, ni autre)", v1 && !!(await page.$("#vue .verrou")) && db.lectures.length === n0, JSON.stringify(db.lectures.slice(n0)));
    await aller(page, "#/formation", 1600);
    ok("navigation (4 pages) : rien d'écrit tant que l'envoi n'a pas lieu (au plus une fois par minute)", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil)));
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A1 = contenu(db, "activite", ACT) || {};
    const secondes = (Date.now() - t0) / 1000;
    ok("onglet en arrière-plan : la base est relue (1 lecture d'activite) PUIS écrite (1 écriture), dans cet ordre", lu(db, "activite") === 1 && ecr(db, "activite").length === 1 && db.journal.indexOf("L activite") > -1 && db.journal.indexOf("L activite") < db.journal.indexOf("E activite"), JSON.stringify(db.journal.filter(x => x.endsWith("activite"))));
    ok("le delta s'ajoute à la base : formation 2 → 3, decouverte-questionnaire 1 → 2, verrou-programme 1, verrou-journal 1", memes(A1.pages, { formation: 3, "decouverte-questionnaire": 2, "verrou-programme": 1, "verrou-journal": 1 }), JSON.stringify(A1.pages));
    ok("jours réunis (hier + aujourd'hui), temps additionné (100 s + le temps visible), dernière activité à l'instant, version 1", JSON.stringify(A1.jours) === JSON.stringify([ilYA(1), ajd()]) && A1.temps_s >= 101 && A1.temps_s <= 100 + Math.ceil(secondes) + 1 && Math.abs(Date.parse(A1.derniere) - Date.now()) < 15000 && A1.version === 1, JSON.stringify(A1));
    /* un autre onglet a écrit entre-temps : ses pages ne sont pas effacées */
    const row = db.donnees.find(x => x.user_id === ACT && x.outil === "activite");
    row.contenu = Object.assign({}, row.contenu, { pages: Object.assign({}, row.contenu.pages, { formation: row.contenu.pages.formation + 10 }), jours: [ilYA(3)].concat(row.contenu.jours) });
    await aller(page, "#/suivi", 1400);
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A2 = contenu(db, "activite", ACT) || {};
    ok("deux onglets : la base est relue (2e lecture), les +10 pages de l'autre onglet restent (formation 13), verrou-suivi 1 s'ajoute, jours réunis", lu(db, "activite") === 2 && ecr(db, "activite").length === 2 && A2.pages.formation === 13 && A2.pages["verrou-suivi"] === 1 && A2.pages["decouverte-questionnaire"] === 2 && JSON.stringify(A2.jours) === JSON.stringify([ilYA(3), ilYA(1), ajd()]), JSON.stringify(A2));
    /* fermeture de l'onglet : rien d'écrit (la base connue peut être périmée : autre onglet, autre appareil) ;
       le delta part dans la copie locale, reprise au prochain envoi */
    await aller(page, "#/programme", 1400);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 1500);
    const loc = await page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, "mhx_activite_attente|" + ACT);
    ok("fermeture (pagehide), base connue : ni relue ni écrite (elle peut être périmée) ; le delta (verrou-programme 1) est gardé sur l'appareil", lu(db, "activite") === 2 && ecr(db, "activite").length === 2 && !!loc && memes(loc.pages, { "verrou-programme": 1 }), "lectures " + lu(db, "activite") + " · écritures " + ecr(db, "activite").length + " · " + JSON.stringify(loc));
    /* la page n'a pas été fermée : elle revient du cache du navigateur (pageshow persisted), puis passe en arrière-plan */
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A3 = contenu(db, "activite", ACT) || {};
    const loc2 = await page.evaluate(k => localStorage.getItem(k), "mhx_activite_attente|" + ACT);
    ok("page revenue du cache puis arrière-plan : la copie locale est reprise, la base relue puis écrite (verrou-programme 2, formation 13), la copie effacée", lu(db, "activite") === 3 && ecr(db, "activite").length === 3 && A3.pages["verrou-programme"] === 2 && A3.pages.formation === 13 && loc2 === null, "lectures " + lu(db, "activite") + " · " + JSON.stringify(A3.pages) + " · copie " + loc2);
    ok("seule la clé activite est écrite pendant la navigation", db.ecritures.every(e => e.outil === "activite" && e.user_id === ACT), JSON.stringify(db.ecritures.map(e => e.outil)));
  });
  await bloc("G. fermeture sans base connue ; clé piégée", async () => {
    const piege = { jours: "abc", pages: { "<img src=x>": 5, formation: -3, "decouverte-resultat": "x", ok: 2 }, temps_s: "999", derniere: "<b>" };
    const db = base({ prospects: seule([["activite", piege, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await aller(page, "#/programme", 1400);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 1500);
    ok("fermeture (pagehide) avant toute relecture : rien d'écrit, rien de lu (on n'écrase pas le vrai compte par un compte partiel)", ecr(db, "activite").length === 0 && lu(db, "activite") === 0, "écritures " + ecr(db, "activite").length + " lectures " + lu(db, "activite"));
    /* visite suivante (page rechargée) : la visite de moins d'une minute n'est pas perdue */
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A = contenu(db, "activite", ACT) || {};
    ok("visite suivante puis arrière-plan : la visite fermée avant une minute est reprise, relue et écrite, rien de perdu ni compté deux fois (decouverte-questionnaire 1 + 1, verrou-programme 1)", lu(db, "activite") === 1 && ecr(db, "activite").length === 1 && A.pages["decouverte-questionnaire"] === 2 && A.pages["verrou-programme"] === 1, JSON.stringify(A.pages));
    ok("clé activite piégée en base : remise d'aplomb (pages piégées écartées, « ok » gardé, jours = dates, temps nombre, dernière activité valide)", memes(A.pages, { ok: 2, "decouverte-questionnaire": 2, "verrou-programme": 1 }) && JSON.stringify(A.jours) === JSON.stringify([ajd()]) && typeof A.temps_s === "number" && !isNaN(Date.parse(A.derniere)), JSON.stringify(A));
  });
  await bloc("G. au plus une fois par minute", async () => {
    /* horloge contrôlée (elle suit le temps réel ; fastForward la fait sauter) : on vise des instants précis par rapport à la
       première page vue, que l'on encadre entre « avant d'ouvrir » et « Découverte affichée » */
    const db = base({ prospects: seule() });
    const { page } = await contexte(b, leaAct, db, { horloge: true });
    const maintenant = () => page.evaluate(() => Date.now());
    const jusqua = async t => { const d = Math.round(t - (await maintenant())); if (d > 0) await page.clock.fastForward(d); };
    const tAvant = Date.now();   // la première page vue (decouverte-questionnaire) est comptée après cet instant…
    /* v52 : la Découverte est prête quand ses 3 questions sont là (#q-probleme ; avant : #q-age) */
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 });
    const tRendu = await maintenant();   // … et avant celui-ci
    await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    await jusqua(tAvant + 56000); await attendre(page, 2000);
    ok("56 à 58 s après la première page vue (2 pages vues) : rien d'écrit, rien de lu", ecr(db, "activite").length === 0 && lu(db, "activite") === 0, "écritures " + ecr(db, "activite").length + " lectures " + lu(db, "activite") + " · " + Math.round(((await maintenant()) - tRendu) / 1000) + " s après l'affichage");
    await jusqua(tRendu + 61000); await attendre(page, 1800);
    const A1 = contenu(db, "activite", ACT) || {};
    ok("une minute après la première page vue : relue puis écrite, une fois (decouverte-questionnaire 1, formation 1)", lu(db, "activite") === 1 && ecr(db, "activite").length === 1 && db.journal.indexOf("L activite") < db.journal.indexOf("E activite") && memes(A1.pages, { formation: 1, "decouverte-questionnaire": 1 }), JSON.stringify(A1));
    const tE = await maintenant();   // juste après la 1re écriture
    await aller(page, "#/programme", 1200);
    await jusqua(tE + 25000); await aller(page, "#/formation", 1200);
    await jusqua(tE + 50000); await aller(page, "#/suivi", 1200);
    await jusqua(tE + 56000); await attendre(page, 1500);
    ok("après la 1re écriture, 3 pages vues en 57 s (0, 25 et 50 s) : aucune nouvelle écriture ni relecture", ecr(db, "activite").length === 1 && lu(db, "activite") === 1, "écritures " + ecr(db, "activite").length + " lectures " + lu(db, "activite"));
    await jusqua(tE + 63000); await attendre(page, 1800);
    const A2 = contenu(db, "activite", ACT) || {};
    ok("une minute après la première de ces pages : 2e écriture, après relecture (formation 2, verrou-programme 1, verrou-suivi 1)", ecr(db, "activite").length === 2 && lu(db, "activite") === 2 && memes(A2.pages, { formation: 2, "decouverte-questionnaire": 1, "verrou-programme": 1, "verrou-suivi": 1 }), JSON.stringify(A2.pages));
  });
  await bloc("G. lecture de l'activité ratée", async () => {
    const baseAct = { version: 1, jours: [ilYA(1)], pages: { formation: 5 }, temps_s: 100, derniere: avant(J) };
    const db = base({ prospects: seule([["activite", baseAct, avant(J)]]), lectureKo: ["activite"] });
    const { page } = await contexte(b, leaAct, db, { horloge: true });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await aller(page, "#/formation", 1400);
    await cacher(page); await attendre(page, 1800); await montrer(page);
    ok("arrière-plan, relecture de la clé activite ratée (500) : rien d'écrit, la base n'est pas touchée", lu(db, "activite") === 1 && ecr(db, "activite").length === 0 && memes(contenu(db, "activite", ACT), baseAct), "lectures " + lu(db, "activite") + " écritures " + ecr(db, "activite").length);
    await page.clock.fastForward(61000); await attendre(page, 1800);
    ok("nouvel essai une minute plus tard, toujours en panne : relue une 2e fois, toujours rien d'écrit", lu(db, "activite") === 2 && ecr(db, "activite").length === 0, "lectures " + lu(db, "activite") + " écritures " + ecr(db, "activite").length);
    db.lectureKo = [];
    await aller(page, "#/programme", 1200);
    await page.clock.fastForward(61000); await attendre(page, 1800);
    const A = contenu(db, "activite", ACT) || {};
    ok("panne finie : relue puis écrite une seule fois ; rien de perdu ni compté deux fois (formation 5 → 6, decouverte-questionnaire 1, verrou-programme 1, temps ajouté)", lu(db, "activite") === 3 && ecr(db, "activite").length === 1 && memes(A.pages, { formation: 6, "decouverte-questionnaire": 1, "verrou-programme": 1 }) && A.temps_s > 100 && JSON.stringify(A.jours) === JSON.stringify([ilYA(1), ajd()]), JSON.stringify(A));
  });
  /* v52 (28/09/2026, Chantier 1 lot C) : les 3 questions (probleme, obstacle, projection) remplacent les 10 et l'âge n'est
     plus demandé : le premier brouillon part avec la première réponse (avant : seulement après un âge d'au moins 18 ans,
     avec 2 vérifications « âge 15 → tout retiré » / « âge 30 → tout repart », remplacées ici par l'objectif posé depuis la
     réponse « problème » et l'absence de question d'âge) ; après la validation, la page de proposition de bilan
     (page vue « decouverte-bilan » au lieu de « decouverte-resultat »). */
  await bloc("G. email et début du questionnaire", async () => {
    const db = base({ prospects: seule() });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("questionnaire affiché, rien encore répondu : rien ne part (ni réponse, ni email, ni court_debut) ; aucune question d'âge", ecr(db, "intake").length === 0 && !!(await page.$("#q-probleme")) && !(await page.$("#q-age")));
    const t0 = Date.now();
    await page.selectOption("#q-probleme", "Perdre du gras"); await attendre(page, 1500);
    const I1 = contenu(db, "intake", ACT) || {};
    ok("première réponse : le premier brouillon part avec l'email du compte (email_compte = lea.martin@exemple.fr, jamais le champ « email » du questionnaire client) et court_debut (maintenant)", I1.probleme === "Perdre du gras" && I1.email_compte === "lea.martin@exemple.fr" && !("email" in I1) && typeof I1.court_debut === "string" && Math.abs(Date.parse(I1.court_debut) - t0) < 10000 && !I1.court_le, JSON.stringify(I1));
    const debut1 = I1.court_debut;
    await page.fill("#q-obstacle", "Le temps"); await attendre(page, 1300);
    ok("brouillon suivant : court_debut et email inchangés", (contenu(db, "intake", ACT) || {}).court_debut === debut1 && (contenu(db, "intake", ACT) || {}).obstacle === "Le temps");
    ok("la réponse « problème » a posé l'objectif du questionnaire complet (« Perte de poids / sèche »)", (contenu(db, "intake", ACT) || {}).objectif === "Perte de poids / sèche", JSON.stringify(contenu(db, "intake", ACT)));
    await page.fill("#q-projection", "Courir 10 km"); await attendre(page, 1300);
    const I3 = contenu(db, "intake", ACT) || {};
    ok("toutes les réponses partent en brouillon, email et court_debut avec elles, sans court_le", I3.email_compte === "lea.martin@exemple.fr" && I3.court_debut === debut1 && I3.projection === "Courir 10 km" && !I3.court_le, JSON.stringify(I3));
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I4 = contenu(db, "intake", ACT) || {};
    ok("validation : court_le posé, court_debut du brouillon gardé (antérieur), email gardé", typeof I4.court_le === "string" && I4.court_debut === I3.court_debut && Date.parse(I4.court_debut) <= Date.parse(I4.court_le) && I4.email_compte === "lea.martin@exemple.fr" && !("email" in I4), JSON.stringify(I4));
    ok("questionnaire et page bilan : l'activité n'est toujours ni lue ni écrite (rien avant l'envoi)", lu(db, "activite") === 0 && ecr(db, "activite").length === 0);
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A = contenu(db, "activite", ACT) || {};
    ok("envoi (arrière-plan) après « Valider mes réponses » : relue puis écrite, pages decouverte-questionnaire 1 et decouverte-bilan 1", lu(db, "activite") === 1 && ecr(db, "activite").length === 1 && memes(A.pages, { "decouverte-questionnaire": 1, "decouverte-bilan": 1 }), JSON.stringify(A.pages));
  });

  /* ---------- H. 1 000 prospects ---------- */
  await bloc("H. 1 000 prospects", async () => {
    const db = base({ nb: 1000 });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 15000 }); await attendre(page, 400);
    const t0 = Date.now();
    await page.evaluate(() => { location.hash = "#/prospects"; });
    await page.waitForSelector("#pr-liste .sc-carte", { timeout: 15000 }); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 15000 });
    const total = Date.now() - t0;   // changement d'adresse → cartes ET Nouveautés (calculées après coup) affichées
    const app = await page.evaluate(() => { const z = document.getElementById("pr-vue"); const t = performance.now(); outilProspects.rendre(z); return Math.round(performance.now() - t); }).catch(() => 99999);
    ok(`1 008 prospects : page complète (cartes et Nouveautés) en ${total} ms depuis le changement d'adresse, construite en ${app} ms côté app (chacun < 2 000)`, total < 2000 && app < 2000, "complet " + total + " ms · app " + app + " ms");
    ok("1 008 prospects : « 1008 comptes gratuits », badge « 99+ »", (await texte(page, "#pr-vue .masthead .lede")).startsWith("1008 comptes gratuits") && JSON.stringify(await badge(page)) === '["99+"]', (await texte(page, "#pr-vue .masthead .lede")) + " · " + JSON.stringify(await badge(page)));
    const tf = await page.evaluate(() => { const t = performance.now(); document.querySelector('[data-filtre="tous"]').click(); return Math.round(performance.now() - t); });
    ok(`filtre « Tous » en ${tf} ms : 50 cartes, « Afficher 50 de plus (958 restants) », « 1008 prospects »`, tf < 2000 && (await page.$$("#pr-liste .sc-carte")).length === 50 && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (958 restants)" && (await texte(page, "#pr-compte")) === "1008 prospects", (await texte(page, "#pr-plus")) + " · " + (await texte(page, "#pr-compte")));
    const avant50 = await uids(page);
    await page.click("#pr-plus"); await attendre(page, 400);
    const apres = await uids(page);
    ok("« Afficher plus » : 100 cartes (les 50 premières inchangées), « Afficher 50 de plus (908 restants) »", apres.length === 100 && JSON.stringify(apres.slice(0, 50)) === JSON.stringify(avant50) && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (908 restants)", apres.length + " · " + (await texte(page, "#pr-plus")));
    await choisir(page, "#pr-tri", "score");
    ok("changer le tri revient à 50 cartes", (await page.$$("#pr-liste .sc-carte")).length === 50);
    await chercher(page, "p0998@gen.fr");
    ok("recherche d'un email parmi 1 008 : une carte (Prospect N0998), pas de bouton « Afficher plus »", JSON.stringify(await uids(page)) === JSON.stringify([GEN(998)]) && !(await page.$("#pr-plus")), JSON.stringify(await uids(page)));
    await chercher(page, "");
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, "")).lignes;
    ok("export des 1 008 prospects : 1 008 lignes + en-têtes, 15 cellules chacune", L.length === 1009 && L.every(l => l.length === 15), L.length + " lignes");
    await chercher(page, "Prospect N01");
    ok("recherche « Prospect N01 » : 100 résultats, 50 cartes puis « Afficher 50 de plus (50 restants) »", (await page.$$("#pr-liste .sc-carte")).length === 50 && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (50 restants)", await texte(page, "#pr-plus"));
    await page.click("#pr-plus"); await attendre(page, 400);
    ok("… puis 100 cartes, plus de bouton", (await page.$$("#pr-liste .sc-carte")).length === 100 && !(await page.$("#pr-plus")));
    ok("1 000 prospects : aucune écriture", db.ecritures.length === 0);
  });

  await bloc("H. journal des emails au-delà de 1 000 lignes", async () => {
    /* la vraie base renvoie 1 000 lignes au plus par requête : 400 anciens prospects × 3 emails (il y a 40 à 45 jours) passent
       avant le journal récent (tri cree_le croissant) ; les emails d'Inès et de Zoé doivent quand même compter */
    const db = base();
    for (let i = 0; i < 400; i++) {
      const id = GEN(i), cree = avant((45 * 24 - i) * H);
      db.profils.push({ id, prenom: "Ancien", nom: "A" + p4(i), role: "client", statut: "prospect", cree_le: cree });
      ["bienvenue", "questionnaire", "relance"].forEach((m, k) => db.emails_prospects.push({ user_id: id, modele: m, statut: "envoye", envoye_le: avant((45 * 24 - i - k) * H), ouvert_le: null, clique_le: null, cree_le: avant((45 * 24 - i - k) * H) }));
    }
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 15000 }); await attendre(page, 800);
    await filtre(page, "tous"); await chercher(page, "zoe.bernard");   // 408 prospects : on la cherche (50 cartes par page)
    ok("journal de " + db.emails_prospects.length + " lignes (plus de 1 000) : carte de Zoé « 25/100 » (son email ouvert compte toujours)", (await carte(page, ZOE)).includes("25/100"), (await carte(page, ZOE)).slice(0, 160));
    await page.click(`#pr-liste .sc-carte[data-uid="${ZOE}"] [data-sc="fiche"]`); await page.waitForSelector("#fiche-score", { timeout: 6000 }); await attendre(page, 500);
    const sz = await lignesLi(page, "#fiche-score"), cz = (await chrono(page)).map(x => x.t);
    ok("… fiche de Zoé : « Email ouvert (1 email de suivi envoyé) » 5 / 5, total 25/100, chronologie avec ses 3 événements d'email", sz.some(([k, v]) => k === "Email ouvert (1 email de suivi envoyé) (bonus)" && v === "5 / 5") && (await texte(page, "#fiche-score .seance-c-tete .pastille")) === "25/100" && cz.filter(t => t.startsWith("Email de suivi")).length === 3, JSON.stringify(sz.filter(([k]) => k.startsWith("Email"))) + " · " + JSON.stringify(cz));
    ok("journal au-delà de 1 000 lignes : aucune écriture", db.ecritures.length === 0);
  });

  /* ---------- I. Mobile 390 px ---------- */
  await bloc("I. mobile 390 px", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 600);
    ok("mobile 390 px, page Prospects (compteurs, filtres, recherche, Nouveautés, cartes) : aucun débordement horizontal", !(await deborde(page)) && !!(await page.$("#pr-nouveautes .nv-panneau")), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await filtre(page, "tous");
    ok("mobile : filtre « Tous » (8 cartes, dont la piégée), toujours sans débordement", (await uids(page)).length === 8 && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    const bb = await page.$$eval('#barre-bas a[data-id="prospects"] .nav-badge, #nav a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("mobile : badge « 11 » sur l'onglet Prospects", bb.length >= 1 && bb.every(x => x === "11"), JSON.stringify(bb));
    await page.screenshot({ path: path.join(OUT, "prospects-mobile.png"), fullPage: true });
    await ouvrirFiche(page, INES);
    ok("mobile : fiche d'Inès (score, réponses, chronologie, lien de réservation) sans débordement", !!(await page.$("#dc-lien")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await page.screenshot({ path: path.join(OUT, "fiche-mobile.png"), fullPage: true });
    await aller(page, "#/tableau", 2400);
    ok("mobile : tableau de bord avec les Nouveautés, sans débordement", !!(await page.$("#tb-nouveautes .nv-panneau")) && !(await deborde(page)));
  });
  await bloc("I. mobile, Profil du prospect", async () => {
    const db = base();
    const { page } = await contexte(b, qui(LEA, "lea.martin@exemple.fr"), db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
    ok("mobile : Profil du prospect avec l'interrupteur des emails, sans débordement", !!(await page.$("#mc-emails")) && !(await deborde(page)));
  });

  /* ---------- J. Client Thomas et fiche d'un client : identiques à main ---------- */
  const vueDe = async (who, url, action) => {
    const db = base();
    const { c, page } = await contexte(b, who, db);
    await page.goto(url); await attendre(page, 2600);
    if (action) await action(page, db);
    const t = await texte(page, "#vue"), h2 = await page.$$eval("#vue h2", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    const ret = { t, h2, db, page, c };
    return ret;
  };
  await bloc("J. client Thomas", async () => {
    const naviguer = async (page) => { for (const h of ["#/programme", "#/nutrition", "#/formation", "#/profil"]) await aller(page, h, 1400); await cacher(page); await attendre(page, 1200); await montrer(page); await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 1200); await aller(page, "#/accueil", 1800); };
    const a = await vueDe(thomas, `http://localhost:${PORT}/`, naviguer);
    ok("client Thomas (programme, nutrition, formation, profil, arrière-plan, fermeture) : aucune écriture, aucune lecture d'activite, emails ni coach_notifs, aucun appel au journal des emails", a.db.ecritures.length === 0 && lu(a.db, "activite") + lu(a.db, "emails") + lu(a.db, "coach_notifs") === 0 && !a.db.chemins.some(x => x.includes("emails_prospects")), JSON.stringify(a.db.ecritures.map(e => e.outil)) + " " + JSON.stringify(a.db.lectures.map(x => x.outil)));
    await aller(a.page, "#/profil", 1800);
    ok("client Thomas : pas de bloc « Emails de suivi » dans son Profil, pas d'onglet Prospects", !(await a.page.$("#mc-emails-bloc, #mc-emails")) && !(await a.page.$('#nav a[data-id="prospects"]')));
    await aller(a.page, "#/prospects", 1800);
    ok("client Thomas tape #/prospects : rien du tableau de bord prospects", !(await a.page.$("#pr-vue, #pr-liste, .nv-panneau")));
    await a.c.close();
    if (!REF) { ok("référence " + REF_NOM + " (git show " + REF_NOM + ":index.html) introuvable : comparaison impossible", false, "git show a échoué"); return; }
    const acc = await vueDe(thomas, `http://localhost:${PORT}/#/accueil`), accM = await vueDe(thomas, `http://localhost:${PORT}/?ref=main#/accueil`);
    ok("client Thomas, accueil : texte identique à main", acc.t.length > 200 && acc.t === accM.t, acc.t.length + " / " + accM.t.length + " car. · premier écart : " + (() => { let i = 0; while (i < acc.t.length && acc.t[i] === accM.t[i]) i++; return JSON.stringify(acc.t.slice(Math.max(0, i - 40), i + 60)) + " ≠ " + JSON.stringify(accM.t.slice(Math.max(0, i - 40), i + 60)); })());
    await acc.c.close(); await accM.c.close();
    const pro = await vueDe(thomas, `http://localhost:${PORT}/#/profil`), proM = await vueDe(thomas, `http://localhost:${PORT}/?ref=main#/profil`);
    /* v52 (chantier 1, lot A) : seule différence VOULUE du Profil de Thomas avec main (v51) : la note du changement
       d'adresse (avec « Secure email change », un lien part aussi sur l'ancienne adresse : corrections de la nuit du
       28/09). Elle est remplacée par un repère dans les deux textes : tout le reste doit rester identique. Une fois la
       v52 sur main, les deux textes portent la nouvelle note et la comparaison redevient stricte d'elle-même. */
    const NOTE_V51 = "Un lien de confirmation part sur la nouvelle adresse. Tant que tu n'as pas cliqué dessus, tu continues de te connecter avec l'ancienne — c'est ce qui t'évite de perdre ton compte en cas de faute de frappe.";
    const NOTE_V52 = "Un lien de confirmation part sur la nouvelle adresse (et, par sécurité, un autre sur l'ancienne : clique les deux). Tant que ce n'est pas fait, tu continues de te connecter avec l'ancienne — c'est ce qui t'évite de perdre ton compte en cas de faute de frappe.";
    const sansNote = t => t.split(NOTE_V52).join("[note du changement d'adresse]").split(NOTE_V51).join("[note du changement d'adresse]");
    ok("client Thomas, Profil : texte identique à main (hors note du changement d'adresse, v52)", pro.t.length > 200 && pro.t.includes(NOTE_V52) && sansNote(pro.t) === sansNote(proM.t), pro.t.length + " / " + proM.t.length + " · nouvelle note : " + pro.t.includes(NOTE_V52));
    await pro.c.close(); await proM.c.close();
  });
  await bloc("J. fiche d'un client et Mes clients", async () => {
    if (!REF) { ok("référence " + REF_NOM + " (git show " + REF_NOM + ":index.html) introuvable : comparaison impossible", false, "git show a échoué"); return; }
    const ouvrir = async (page) => { await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 2600); };
    const f = await vueDe(coach, `http://localhost:${PORT}/#/clients`, ouvrir), fM = await vueDe(coach, `http://localhost:${PORT}/?ref=main#/clients`, ouvrir);
    ok("fiche de Thomas vue par le coach : texte et sections identiques à main (" + f.h2.join(", ") + ")", f.t.length > 300 && f.t === fM.t && JSON.stringify(f.h2) === JSON.stringify(fM.h2), f.t.length + " / " + fM.t.length + " · " + JSON.stringify(f.h2) + " vs " + JSON.stringify(fM.h2));
    ok("fiche de Thomas : ni score, ni réponses du questionnaire court, ni chronologie, ni lien de réservation, aucune écriture", !(await f.page.$("#fiche-score, #fiche-reponses, #fiche-chrono, #fiche-actions, #fiche-decouverte, #dc-lien")) && f.db.ecritures.length === 0);
    await f.c.close(); await fM.c.close();
    const ligne = async (page) => page.$eval(`[data-ouvrir="${F.IDS.c1}"]`, bt => bt.closest("tr").textContent).then(norm).catch(() => "");
    const m1 = await vueDe(coach, `http://localhost:${PORT}/#/clients`), m2 = await vueDe(coach, `http://localhost:${PORT}/?ref=main#/clients`);
    const l1 = await ligne(m1.page), l2 = await ligne(m2.page);
    ok("Mes clients : ligne de Thomas identique à main", l1.length > 10 && l1 === l2, l1 + " | " + l2);
  });

  await bloc("J. coach : aucune activité suivie", async () => {
    /* Activite ne suit que le prospect : ni les pages du coach, ni la fiche d'un client consultée (Store.cible() = le client)
       ne doivent relire ou écrire une clé activite — ni en arrière-plan, ni à la fermeture, ni au bout d'une minute */
    const db = base();
    const { page } = await contexte(b, coach, db, { horloge: true });
    const fermer = async () => { await cacher(page); await attendre(page, 1500); await montrer(page); await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 1200); await page.clock.fastForward(61000); await attendre(page, 1800); };
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);   // pas d'attente du panneau Nouveautés : ce bloc tourne aussi sur main
    await aller(page, "#/prospects", 2200); await aller(page, "#/clients", 2200);
    const n0 = db.lectures.length;
    await fermer();
    ok("pages du coach (tableau de bord, Prospects, Mes clients), puis arrière-plan, fermeture et une minute : aucune lecture d'activite, aucune écriture", lu(db, "activite", n0) === 0 && db.ecritures.length === 0, JSON.stringify(db.lectures.slice(n0)) + " · " + JSON.stringify(db.ecritures.map(e => (e.user_id || e.table || "").slice(-4) + ":" + e.outil)));
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 2600);
    await aller(page, "#/programme", 2200);
    const enConsultation = (await texte(page, "#vue")).includes("Thomas");
    const n1 = db.lectures.length;
    await fermer();
    ok("fiche de Thomas, onglet Programme ouvert en consultation, puis arrière-plan, fermeture et une minute : aucune lecture de la clé activite (ni la sienne, ni celle du coach), aucune écriture", enConsultation && lu(db, "activite", n1) === 0 && db.ecritures.length === 0, "consultation " + enConsultation + " · " + JSON.stringify(db.lectures.slice(n1)) + " · " + JSON.stringify(db.ecritures.map(e => (e.user_id || e.table || "").slice(-4) + ":" + e.outil)));
    ok("aucune clé activite créée pour le coach ni pour Thomas", !contenu(db, "activite", F.IDS.coach) && !contenu(db, "activite", F.IDS.c1));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length, dc = res.filter(l => l.startsWith("  ⚠")).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot + (dc ? "  (+ " + dc + " défaut" + (dc > 1 ? "s" : "") + " connu" + (dc > 1 ? "s" : "") + " de l'app, hors brief, non compté" + (dc > 1 ? "s" : "") + ")" : ""));
  if (nb < tot) process.exitCode = 1;
}
