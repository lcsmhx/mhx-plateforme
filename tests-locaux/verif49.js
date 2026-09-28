/* v51 (Découverte) — suivi commercial des prospects, statuts et score du brief de Lucas (27/09/2026) :
   NOUVEAU = inscrit depuis moins de 24 h, rien fait (ni questionnaire validé, ni clic, ni réservation) ;
   CHAUD = bilan réservé (case « J'ai réservé mon bilan », ou jour 7 d'un ancien prospect du Challenge), même sans
   questionnaire ; TIÈDE = questionnaire rempli sans réservation (avec ou sans clic « Réserver mon bilan ») ;
   FROID = pas de questionnaire passé 24 h, aucune action depuis 3 jours, ou 3 relances sans réponse
   (seuils CONFIG.suivi.nouveau_heures = 24, inactif_jours = 3). Score de qualification sur 100 : inscription 10,
   questionnaire 30 (jusqu'à 20 tant qu'il n'est pas validé, au prorata des réponses : 4/10 = 8), clic 30,
   bilan réservé 30, bonus 2 jours d'activité +5, 5 min dans l'app +5, email ouvert +5 (table emails_prospects ;
   « pas encore mesuré » si elle n'existe pas), plafond 100. Pastilles (statut, score), sous-titre des cartes
   (« inscrit il y a N h » avant 24 h), bloc « Score de qualification » de la fiche.
   Inchangés depuis la v49 et toujours vérifiés : raisons et prochaine action, issue de l'appel (Signé / Perdu /
   Absent) et relances dans la clé coach-seul « suivi_prospect » (écriture conditionnelle, conflit rejoué, 409, 504,
   verrou par prospect), issues qui vieillissent, Mes clients, fiche, tableau de bord, mode test de la découverte
   sans effet côté coach, anciens choix du jour 6 du Challenge ignorés, données piégées, prospect et client.
   Aussi : une visite enregistrée dans la clé « activite » compte comme action du prospect (bloc A') ; un journal
   emails_prospects de plus de 1 000 lignes est lu en entier (le faux PostgREST coupe chaque réponse à 1 000 lignes,
   comme Supabase, et respecte Range, limit / offset, order et les filtres simples).
   Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») : un bloc qui s'arrête n'empêche pas les suivants.
   Toutes les dates sont relatives à maintenant, et le résultat ne dépend ni de l'heure (entre minuit et 1 h, « il y a
   1 h » tombe la veille) ni d'un changement d'heure (un « hier à la même heure » ne fait que 23 h réelles le jour du
   passage à l'heure d'été) : un prospect dont le statut dépend du seuil de 24 h est inscrit en heures réelles (Emma
   40 min, Hana 5,7 h, Paul 26 h), et les libellés « hier / il y a 2 jours / J2 / J3 » attendus sont recalculés depuis
   la date écrite en base. Vérifié en rejouant la suite à 00:30 (Asia/Makassar) et le 28/03/2027 à 12:00 (Europe/Paris).
   Supabase simulé (règles de la base comprises pour suivi_prospect ; table emails_prospects lisible par le coach
   seul, ou absente) : rien ne part vers la vraie base.
   Usage : node verif49.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9679;
const OUT = path.join(__dirname, "captures", "v49"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const instant = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const ilYAh = h => new Date(Date.now() - h * 3600000).toISOString();
/* jour de découverte d'un instant d'inscription (1 = le jour même, calendrier local) */
const jourDe = v => { const d = new Date(v); d.setHours(12, 0, 0, 0); const t = new Date(); t.setHours(12, 0, 0, 0); return Math.round((t - d) / 86400000) + 1; };
/* « aujourd'hui / hier / il y a N jours » d'un instant (calendrier local, comme Commercial.quand) */
const quandDe = v => { const n = jourDe(v) - 1; return n === 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " jours"; };
/* la date d'inscription écrite en base pour le prospect k (les libellés attendus en sont recalculés) */
const creeDe = (db, k) => (db.profils.find(x => x.id === PID(k)) || {}).cree_le;
const norm = t => String(t || "").replace(/[  ]/g, " ");
const COACH_SEUL = ["notes_coach", "suivi_prospect"];

/* les contextes ouverts par le bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route */
const ouverts = [];
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- les prospects (tout est relatif à maintenant) ----------
   inscrit = jours depuis l'inscription (ou h = heures) ; q = questionnaire court validé il y a q jours (motivation m) ;
   brouillon = questionnaire commencé (4 réponses sur 10, court_debut) il y a b jours, sans validation ;
   clics = il y a combien de jours chaque clic « Réserver mon bilan » ; reserve = case « J'ai réservé mon bilan »
   cochée il y a r jours ; ancien = ancien prospect du Challenge 7 jours (case du jour 7 cochée il y a « ancien » jours,
   questionnaire long sans court_le, 6 réponses sur 10) ; formation = dernière case de Speed Formation il y a f jours ;
   act = clé « activite » (jours d'activité, temps en secondes, écrite il y a « le » jours) ; suivi = suivi_prospect */
const PID = k => "00000000-0000-4000-8000-0000000000" + String(k).padStart(2, "0");
const intakeCourt = (q, m, email) => Object.assign({ sexe: "Femme", age: 31, taille: 168, poids: 72, objectif: "Perte de poids / sèche", seances: "3",
  essaye: "Des régimes trop stricts", obstacle: "Le manque de temps", pourquoi: "Me sentir mieux cet été", motivation: String(m), court_debut: instant(q), court_le: instant(q) }, email ? { email } : {});
const intakeBrouillon = (b, email) => Object.assign({ sexe: "Homme", age: 34, taille: 180, poids: 85, court_debut: instant(b) }, email ? { email } : {});
function cleDecouverte(x){
  const C = { version: 1, jours: {}, cta: { clics: (x.clics || []).map(n => ({ jour: (x.inscrit || 0) - n + 1, source: "decouverte", date: instant(n) })) } };
  if (x.reserve != null) C.reserve = instant(x.reserve);
  return C;
}
function cleAncienChallenge(x){
  const j = {}; for (let n = 1; n <= 7; n++) j[String(n)] = { fait: ilYA(x.inscrit - n + 1) + "T08:00:00.000Z", date: ilYA(x.inscrit - n + 1) };
  j["7"].reserve = instant(x.ancien);
  return { version: 1, debut: ilYA(x.inscrit), jours: j, cta: { clics: [] }, termine: instant(x.ancien) };
}
const PROSPECTS = [
  { k: 1, prenom: "Chloé", inscrit: 5, q: 4, m: 7, clics: [5], reserve: 0, act: { jours: [5, 2, 0], temps: 900, le: 0 }, email: "chloe@exemple.fr" },   // CHAUD ; score 115 plafonné à 100
  { k: 2, prenom: "Hugo", inscrit: 4, q: 4, m: 6, clics: [1] },                          // TIÈDE : clic hier sans réservation (70)
  { k: 3, prenom: "Inès", inscrit: 2, q: 2, m: 9, formation: 0, act: { jours: [2, 0], temps: 299, le: 0 } },   // TIÈDE, motivation 9 ; 40 + 5 (2 jours) + 5 (email ouvert) = 50
  { k: 4, prenom: "Karim", inscrit: 6, q: 6, m: 5, clics: [5], formation: 3 },           // FROID : aucune action depuis 3 jours pile (70)
  { k: 5, prenom: "Lina", inscrit: 3, act: { jours: [3, 2], temps: 120, le: 2 } },       // FROID : pas de questionnaire passé 24 h (15)
  { k: 6, prenom: "Marc", inscrit: 5, q: 4, m: 6 },                                      // FROID : aucune action depuis 4 jours (40)
  { k: 7, prenom: "Nora", inscrit: 9, ancien: 2 },                                       // CHAUD : ancien prospect du challenge, jour 7 coché (10 + 12 + 30 = 52)
  { k: 8, prenom: "Omar", inscrit: 8, q: 8, m: 6, reserve: 1,                            // CHAUD : revenu après « Perdu » (case cochée après l'issue) (70)
    suivi: { version: 1, issue: "perdu", issue_le: instant(3), note: "timing", historique: [{ type: "issue", valeur: "perdu", le: instant(3), note: "timing" }] } },
  { k: 9, prenom: "Paul", h: 26 },                                                       // FROID : inscrit il y a 26 h réelles (« hier », ou « il y a 2 jours » avant 2 h du matin), rien fait (10)
  { k: 10, prenom: "Sofia", inscrit: 1, q: 1, m: 6, formation: 0 },                      // TIÈDE : découvre, rien à faire ; email envoyé non ouvert (40)
  { k: 11, prenom: "Yanis", inscrit: 10, q: 10, m: 7, formation: 8 },                    // FROID : découverte terminée, plus rien depuis 8 jours (40)
  { k: 12, prenom: "Emma", h: 0.67 },                                                    // NOUVEAU : inscrite il y a 40 minutes (10)
  { k: 13, prenom: "Félix", inscrit: 2, brouillon: 0, email: "felix@exemple.fr" },      // FROID : questionnaire commencé (4/10) mais pas validé, passé 24 h (18)
  { k: 14, prenom: "Gabriel", inscrit: 4, reserve: 3 },                                  // CHAUD sans questionnaire, réservé il y a 3 jours (40)
  { k: 15, prenom: "Hana", h: 5.7, brouillon: 0 }                                        // NOUVEAU : inscrite il y a 5,7 h → « il y a 5 h » (troncature, pas arrondi), questionnaire commencé 4/10 (18)
];
/* le résultat attendu de chaque prospect de la liste : statut (texte et classe de la pastille), score (texte et classe) */
const ATTENDU = {
  1: ["CHAUD", "chaud", 100, "ok"], 2: ["TIÈDE", "tiede", 70, "ok"], 3: ["TIÈDE", "tiede", 50, "accent"], 4: ["FROID", "froid", 70, "ok"],
  5: ["FROID", "froid", 15, ""], 6: ["FROID", "froid", 40, "accent"], 7: ["CHAUD", "chaud", 52, "accent"], 8: ["CHAUD", "chaud", 70, "ok"],
  9: ["FROID", "froid", 10, ""], 10: ["TIÈDE", "tiede", 40, "accent"], 11: ["FROID", "froid", 40, "accent"], 12: ["NOUVEAU", "accent", 10, ""],
  13: ["FROID", "froid", 18, ""], 14: ["CHAUD", "chaud", 40, "accent"], 15: ["NOUVEAU", "accent", 18, ""]
};
const EMAILS = [
  { user_id: PID(1), modele: "bienvenue", statut: "envoye", envoye_le: instant(4), ouvert_le: instant(3), clique_le: null, cree_le: instant(4) },
  { user_id: PID(3), modele: "bienvenue", statut: "envoye", envoye_le: instant(2), ouvert_le: instant(1), clique_le: null, cree_le: instant(2) },
  { user_id: PID(10), modele: "bienvenue", statut: "envoye", envoye_le: instant(1), ouvert_le: null, clique_le: null, cree_le: instant(1) }
];
/* un PostgREST simulé, en lecture, pour la table emails_prospects : filtres simples (eq, neq, gt, gte, lt, lte, in, is,
   et not.…), order (plusieurs colonnes, asc / desc), select, puis l'en-tête Range ou limit / offset, et JAMAIS plus de
   1 000 lignes par réponse (max_rows de Supabase : la réponse est coupée sans erreur, à l'app de lire la suite).
   Un début au-delà de la fin : 416, comme PostgREST. */
const MAX_LIGNES = 1000;
function postgrest(lignes, q, entetes){
  let l = lignes.slice();
  const OPS = { eq: (a, v) => a != null && String(a) === v, neq: (a, v) => a != null && String(a) !== v,
    gt: (a, v) => a != null && String(a) > v, gte: (a, v) => a != null && String(a) >= v, lt: (a, v) => a != null && String(a) < v, lte: (a, v) => a != null && String(a) <= v,
    in: (a, v) => a != null && v.replace(/^\(|\)$/g, "").split(",").includes(String(a)),
    is: (a, v) => v === "null" ? a == null : v === "true" ? a === true : v === "false" ? a === false : false };
  for (const [k, v0] of q.entries()){
    if (["select", "order", "limit", "offset"].includes(k)) continue;
    let v = v0, non = false; if (v.startsWith("not.")) { non = true; v = v.slice(4); }
    const i = v.indexOf("."), op = OPS[v.slice(0, i)], arg = v.slice(i + 1);
    if (!op) return { status: 400, corps: { code: "PGRST100", message: "filtre non simulé : " + k + "=" + v0 }, lignes: [], entetes: {} };
    l = l.filter(x => { const t = op(x && typeof x === "object" ? x[k] : undefined, arg); return non ? !t : t; });
  }
  const tri = (q.get("order") || "").split(",").filter(Boolean).map(o => { const [c, sens] = o.split("."); return { c, desc: sens === "desc" }; });
  if (tri.length) l.sort((a, b) => { for (const { c, desc } of tri){ const x = a && a[c], y = b && b[c]; if (x === y) continue;
    if (x == null) return desc ? -1 : 1; if (y == null) return desc ? 1 : -1; return (String(x) < String(y) ? -1 : 1) * (desc ? -1 : 1); } return 0; });
  const total = l.length, rg = /^(\d+)-(\d*)$/.exec(entetes["range"] || "");
  let debut = 0, fin = Infinity;
  if (rg) { debut = +rg[1]; if (rg[2] !== "") fin = +rg[2]; }
  else { if (q.get("offset")) debut = +q.get("offset"); if (q.get("limit")) fin = debut + (+q.get("limit")) - 1; }
  fin = Math.min(fin, debut + MAX_LIGNES - 1, total - 1);
  if (debut > 0 && debut >= total) return { status: 416, corps: { code: "PGRST103", message: "Requested range not satisfiable" }, lignes: [], entetes: { "content-range": "*/" + total } };
  l = debut > fin ? [] : l.slice(debut, fin + 1);
  const sel = (q.get("select") || "*").split(","); const corps = sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x == null ? undefined : x[k]])));
  const compte = /count=exact/.test(entetes["prefer"] || "");
  return { status: compte && l.length < total ? 206 : 200, corps, lignes: l, entetes: { "content-range": (l.length ? debut + "-" + (debut + l.length - 1) : "*") + "/" + (compte ? total : "*") } };
}
function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)); profils.forEach(p => { p.statut = "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  (opts.prospects || PROSPECTS).forEach(x => {
    const uid = PID(x.k);
    profils.push({ id: uid, prenom: x.prenom, nom: "", role: "client", statut: "prospect", cree_le: x.h != null ? ilYAh(x.h) : instant(x.inscrit) });
    if (x.q != null) donnees.push({ user_id: uid, outil: "intake", contenu: intakeCourt(x.q, x.m, x.email), maj_le: instant(x.q) });
    if (x.brouillon != null) donnees.push({ user_id: uid, outil: "intake", contenu: intakeBrouillon(x.brouillon, x.email), maj_le: instant(x.brouillon) });
    if (x.ancien != null){
      donnees.push({ user_id: uid, outil: "intake", contenu: { sexe: "Femme", age: 36, taille: 164, poids: 70, objectif: "Santé & énergie au quotidien", seances: "3" }, maj_le: instant(x.inscrit) });
      donnees.push({ user_id: uid, outil: "challenge", contenu: cleAncienChallenge(x), maj_le: instant(x.ancien) });
    }
    if ((x.clics && x.clics.length) || x.reserve != null){
      /* la clé est écrite au dernier clic ou à la case cochée */
      const dern = Math.min.apply(null, (x.clics || []).concat(x.reserve != null ? [x.reserve] : []));
      donnees.push({ user_id: uid, outil: "challenge", contenu: cleDecouverte(x), maj_le: instant(dern) });
    }
    if (x.formation != null) donnees.push({ user_id: uid, outil: "formation", contenu: { coches: { p1a: true }, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, maj_le: instant(x.formation) });
    if (x.act) donnees.push({ user_id: uid, outil: "activite", contenu: { version: 1, jours: x.act.jours.map(ilYA), pages: { "decouverte-questionnaire": 2, formation: 1 }, temps_s: x.act.temps, derniere: instant(x.act.le) }, maj_le: instant(x.act.le) });
    if (x.brut) x.brut.forEach(r => donnees.push(Object.assign({ user_id: uid }, r)));
    if (x.suivi) donnees.push({ user_id: uid, outil: "suivi_prospect", contenu: x.suivi, maj_le: instant(0) });
  });
  return { profils, donnees, emails: JSON.parse(JSON.stringify(opts.emails || EMAILS)), ecritures: [], tentatives: [], conflit: 0 };
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(6000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    const estCoach = who && who.id === F.IDS.coach;
    (db.urls = db.urls || []).push(u);
    /* toute demande d'écriture est notée dans db.tentatives, même refusée ou sans effet (PATCH qui ne touche aucune ligne,
       DELETE) : « rien n'a été écrit » les voit aussi. maj_le = la condition de l'écriture (maj_le=eq.… ou is.null) */
    if (["POST", "PATCH", "PUT", "DELETE"].includes(m) && p.startsWith("/rest/v1/")) {
      let lignes = []; try { const x = JSON.parse(req.postData() || "null"); lignes = (Array.isArray(x) ? x : [x]).filter(y => y && typeof y === "object"); } catch (e) { }
      (db.tentatives = db.tentatives || []).push({ table: p.replace("/rest/v1/", ""), m,
        user_id: (q.get("user_id") || q.get("id") || "").replace(/^eq\./, "") || lignes.map(y => y.user_id).filter(Boolean).join(",") || null,
        outil: (q.get("outil") || "").replace(/^eq\./, "") || lignes.map(y => y.outil).filter(Boolean).join(",") || null, maj_le: q.get("maj_le") });
    }
    if (p.startsWith("/auth/v1/")) return json(p.startsWith("/auth/v1/token") ? F.session(who.id, who.email) : {});
    if (p === "/rest/v1/emails_prospects") {
      /* journal des emails de suivi (v51) : lisible par le coach seul (RLS) ; db.sansJournal = migration pas appliquée ;
         réponses coupées à 1 000 lignes comme PostgREST (db.journalLu = le nombre de lignes de chaque réponse) */
      if (m !== "GET") { db.ecritures.push({ table: "emails_prospects", m }); return json({ message: "rls" }, 403); }
      if (db.sansJournal) return json({ code: "42P01", message: "relation \"public.emails_prospects\" does not exist" }, 404);
      const z = postgrest(estCoach ? db.emails : [], q, req.headers());
      (db.journalLu = db.journalLu || []).push(z.lignes.length);
      return r.fulfill({ status: z.status, contentType: "application/json", headers: z.entetes, body: JSON.stringify(z.corps) });
    }
    if (p === "/rest/v1/profils") {
      const id = q.get("id");
      if (m === "PATCH") {
        let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
        db.ecritures.push({ table: "profils", m, id: id && id.slice(3), corps });
        if (!estCoach) return json({ message: "Seul un coach peut changer un rôle ou un statut." }, 400);
        if (db.echecClient) return json({ message: "upstream timeout" }, 504);
        const row = db.profils.find(x => x.id === (id || "").slice(3)); if (!row) return json([]);
        Object.assign(row, corps); return json([row]);
      }
      if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); }
      return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
    if (p === "/rest/v1/donnees") {
      const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
      const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
      if (m === "PATCH") {
        let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
        if (!estCoach && (COACH_SEUL.includes(cleEq))) return json({ message: "rls" }, 403);
        if (cleEq === "suivi_prospect" && db.lentEcriture) await new Promise(x => setTimeout(x, db.lentEcriture));
        if (cleEq === "suivi_prospect" && db.conflit > 0) {
          /* un autre onglet ecrit juste avant nous : la ligne bouge (nouvelle maj_le). Notre PATCH est ensuite juge sur sa
             condition, comme en base : conditionnel, il ne touche rien ; sans condition, il ecraserait la relance de l'autre onglet */
          db.conflit--; const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq);
          if (row) { row.contenu = Object.assign({}, row.contenu, { relances: (row.contenu.relances || []).concat(instant(0)) }); row.maj_le = new Date(Date.now() - 5000).toISOString(); db.majAutreOnglet = row.maj_le; }
        }
        const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null ? true : mj === "is.null" ? !x.maj_le : mj.startsWith("eq.") ? x.maj_le === decodeURIComponent(mj.slice(3)) : false));
        if (!row) return json([]);
        row.contenu = corps.contenu; row.maj_le = corps.maj_le;
        db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: corps.contenu, maj_le: mj });
        return json([row]);
      }
      if (m === "POST") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        rows = Array.isArray(rows) ? rows : [rows];
        if (rows.some(row => !estCoach && COACH_SEUL.includes(row.outil))) return json({ message: "rls" }, 403);
        if (rows.some(row => row.outil === "suivi_prospect") && db.lentEcriture) await new Promise(x => setTimeout(x, db.lentEcriture));
        const upsert = u.indexOf("on_conflict") > -1;
        const out = [];
        for (const row of rows) {
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key" }, 409);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: row.contenu });
          out.push(ligne);
        }
        return (req.headers()["prefer"] || "").indexOf("return=representation") > -1 ? json(out, 201) : json(null, 201);
      }
      if (m === "DELETE" || m === "PUT") {
        /* jamais attendu ici : noté comme une écriture, les lignes visées sont retirées comme en base (RLS : les siennes) */
        if (!estCoach && COACH_SEUL.includes(cleEq)) return json({ message: "rls" }, 403);
        const vis = db.donnees.filter(x => (!uid || x.user_id === uid) && (!cleEq || x.outil === cleEq) && (estCoach || (who && x.user_id === who.id)));
        if (m === "DELETE") db.donnees = db.donnees.filter(x => !vis.includes(x));
        db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, lignes: vis.length });
        return json(null, 204);
      }
      if (m === "GET" && cleEq === "suivi_prospect" && db.cacheLigne > 0) { db.cacheLigne--; return json([]); }   // la ligne existe mais notre lecture arrive avant (course)
      let l = db.donnees;
      if (who && !estCoach) l = l.filter(x => x.user_id === who.id && !COACH_SEUL.includes(x.outil));
      if (uid) l = l.filter(x => x.user_id === uid);
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); }
      return json(l);
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, l }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); Object.keys(l || {}).forEach(k => localStorage.setItem(k, l[k])); }, { s: who ? who.session : null, l: opts.local || null });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1600); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const carte = (page, k) => page.$eval(`.sc-carte[data-uid="${PID(k)}"]`, e => e.textContent).then(norm).catch(() => "");
const sousTitre = (page, k) => page.$eval(`.sc-carte[data-uid="${PID(k)}"] .sc-nom small`, e => e.textContent).then(norm).catch(() => "");
const suiviDe = (db, k) => (db.donnees.find(x => x.user_id === PID(k) && x.outil === "suivi_prospect") || {}).contenu || null;
const cliquer = (page, k, act) => page.click(`.sc-carte[data-uid="${PID(k)}"] [data-sc="${act}"]`).catch(() => {});
const bouton = (page, txt) => page.click(`.modale button:has-text("${txt}")`).catch(() => {});
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`).catch(() => {}); await attendre(page, 800); };
const contient = (t, l) => l.every(x => t.includes(x));
const noms = page => page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent));
/* les tuiles d'une zone : { libellé: valeur } */
const tuiles = (page, sel) => page.$$eval(sel + " .tile", l => Object.fromEntries(l.map(e => [(e.querySelector(".t-lbl") || {}).textContent, ((e.querySelector(".t-val") || {}).textContent || "").replace(/\s+/g, "")]))).catch(() => ({}));
/* les pastilles de chaque carte : la dernière = le statut, la première (s'il y en a deux) = le score */
const pastilles = page => page.$$eval(".sc-carte", l => l.map(e => { const ps = Array.from(e.querySelectorAll(".sc-tete .pastille")); const z = ps[ps.length - 1], sc = ps.length > 1 ? ps[0] : null;
  return { uid: e.dataset.uid, etat: z ? z.textContent : "", cls: z ? z.className : "", score: sc ? sc.textContent : "", scls: sc ? sc.className : "", titre: z ? z.getAttribute("title") : "" }; }));
/* les lignes du bloc « Score de qualification » de la fiche : [[libellé, points], …] */
const lignesScore = page => page.$$eval("#fiche-score li", l => l.map(e => [(e.querySelector("span") || {}).textContent, (e.querySelector("b") || {}).textContent])).catch(() => []);
const ligneClient = (page, k) => page.$eval(`[data-ouvrir="${k}"]`, x => x.closest("tr").textContent).then(norm).catch(() => "");

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Page Prospects : statuts v51, pastilles, scores, sous-titres, raisons, prochaine action ---------- */
  await bloc("A. page Prospects", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2600);
    const t = await texte(page, "#pr-vue");
    ok("page Prospects : « 15 comptes gratuits · 2 nouveaux, 4 chauds, 3 tièdes, 6 froids · score moyen 43/100 » (Thomas, client, absent)", t.includes("15 comptes gratuits · 2 nouveaux, 4 chauds, 3 tièdes, 6 froids · score moyen 43/100") && !t.includes("Thomas"), t.slice(0, 300));
    ok("légende v51 : NOUVEAU moins de 24 h sans questionnaire, clic ni réservation ; CHAUD bilan réservé ; TIÈDE questionnaire rempli sans réservation ; FROID questionnaire pas rempli passé 24 h, aucune action depuis 3 jours, ou 3 relances ; barème du score", contient(t, ["NOUVEAU : inscrit depuis moins de 24 h, ni questionnaire rempli, ni clic, ni réservation.", "CHAUD : bilan réservé.", "TIÈDE : questionnaire rempli (ou clic « Réserver » dans ses premières 24 h), pas encore de réservation.", "FROID : questionnaire pas rempli passé 24 h, aucune action depuis 3 jours, ou 3 relances sans réponse.", "Score sur 100 : inscription 10, questionnaire 30, clic « Réserver mon bilan » 30, bilan réservé 30"]) && !t.includes("ces 3 derniers jours"), t.slice(-600));
    const ordre = await noms(page);
    ok("« À traiter » par défaut, dans l'ordre : réservés (Chloé, Omar, Nora, Gabriel, le plus récemment actif d'abord), tièdes à relancer (Inès, Hugo), froids (Félix, Lina, Karim, Marc, Yanis, Paul) ; Sofia, Emma, Hana absentes", ordre.join(",") === "Chloé,Omar,Nora,Gabriel,Inès,Hugo,Félix,Lina,Karim,Marc,Yanis,Paul", ordre.join(","));
    const T = await tuiles(page, "#pr-vue");
    ok("tuiles : À traiter 12, Nouveaux 2, Chauds 4, Score moyen 43/100, Signés 0, Perdus 1 (Omar, même revenu), Absents 0", T["À traiter"] === "12" && T["Nouveaux"] === "2" && T["Chauds"] === "4" && T["Score moyen"] === "43/100" && T["Signés"] === "0" && T["Perdus"] === "1" && T["Absents"] === "0", JSON.stringify(T));
    const cpt = await page.$$eval("[data-filtre]", l => Object.fromEntries(l.map(e => [e.dataset.filtre, (e.querySelector(".meta") || {}).textContent])));
    ok("filtres : À traiter 12, Nouveaux 2, Chauds 4, Tièdes 3, Froids 6, Appel fait 0 (le retour d'Omar efface son issue), Tous 15", cpt.a_traiter === "12" && cpt.nouveau === "2" && cpt.chaud === "4" && cpt.tiede === "3" && cpt.froid === "6" && cpt.issues === "0" && cpt.tous === "15", JSON.stringify(cpt));
    const k1 = await carte(page, 1), s1 = await sousTitre(page, 1);
    /* v52 (Chantier 1, lot D) : sous-titre des cartes sans « J n/7 » ni « terminée » (« Découverte · questionnaire … ») */
    ok("Chloé (case cochée aujourd'hui, un clic il y a 5 jours) : CHAUD, « A coché « J'ai réservé mon bilan » aujourd'hui. », « Questionnaire rempli il y a 4 jours, motivation 7/10, découverte jour 6/7. », « Prépare le bilan », plus de ligne « A cliqué » (réservé) ; sous-titre « Découverte · questionnaire rempli · inscrit il y a 5 jours »", contient(k1, ["CHAUD", "A coché « J'ai réservé mon bilan » aujourd'hui.", "Questionnaire rempli il y a 4 jours, motivation 7/10, découverte jour 6/7.", "Prépare le bilan : relis sa fiche (questionnaire, obstacle, motivation)."]) && !k1.includes("A cliqué") && s1 === "Découverte · questionnaire rempli · inscrit il y a 5 jours", s1 + " | " + k1);
    const k2 = await carte(page, 2);
    ok("Hugo (questionnaire, clic hier, pas de réservation) : TIÈDE (plus CHAUD : un clic ne suffit plus), « A cliqué « Réserver mon bilan » (1 fois), la dernière hier, sans réserver. », « DM : il a cliqué sans réserver, demande-lui ce qui le retient. »", contient(k2, ["TIÈDE", "Questionnaire rempli il y a 4 jours, motivation 6/10, découverte jour 5/7.", "A cliqué « Réserver mon bilan » (1 fois), la dernière hier, sans réserver.", "DM : il a cliqué sans réserver, demande-lui ce qui le retient."]) && !k2.includes("CHAUD"), k2);
    const k3 = await carte(page, 3);
    ok("Inès (questionnaire rempli, motivation 9) : TIÈDE, « Questionnaire rempli il y a 2 jours, motivation 9/10, découverte jour 3/7. », « DM : il se dit motivé à 9/10, propose-lui le bilan. »", contient(k3, ["TIÈDE", "Questionnaire rempli il y a 2 jours, motivation 9/10, découverte jour 3/7.", "DM : il se dit motivé à 9/10, propose-lui le bilan."]) && !k3.includes("CHAUD"), k3);
    const k4 = await carte(page, 4);
    ok("Karim (questionnaire, clic il y a 5 jours, dernière action il y a 3 jours pile) : FROID, « Aucune action depuis 3 jours (découverte jour 7/7). », clic « il y a 5 jours, sans réserver », « Relance douce en DM : demande-lui où il en est. »", contient(k4, ["FROID", "Aucune action depuis 3 jours (découverte jour 7/7).", "A cliqué « Réserver mon bilan » (1 fois), la dernière il y a 5 jours, sans réserver.", "Relance douce en DM : demande-lui où il en est."]), k4);
    const k5 = await carte(page, 5), s5 = await sousTitre(page, 5);
    ok("Lina (3 jours, venue il y a 2 jours, questionnaire jamais commencé) : FROID, « Inscrit il y a 3 jours, questionnaire pas rempli. », « DM de bienvenue : aide-le à remplir son questionnaire (3 minutes). », pas « Aucune action depuis » (active il y a 2 jours) ; sous-titre « questionnaire à remplir »", contient(k5, ["FROID", "Inscrit il y a 3 jours, questionnaire pas rempli.", "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes)."]) && !k5.includes("Aucune action depuis") && !k5.includes("Questionnaire rempli") && s5 === "Découverte · questionnaire à remplir · inscrit il y a 3 jours", s5 + " | " + k5);
    const k6 = await carte(page, 6);
    ok("Marc (rien depuis le questionnaire il y a 4 jours) : FROID, « Aucune action depuis 4 jours (découverte jour 6/7). », « Relance douce en DM : demande-lui où il en est. »", contient(k6, ["FROID", "Aucune action depuis 4 jours (découverte jour 6/7).", "Questionnaire rempli il y a 4 jours, motivation 6/10, découverte jour 6/7.", "Relance douce en DM : demande-lui où il en est."]), k6);
    const k7 = await carte(page, 7), s7 = await sousTitre(page, 7);
    ok("Nora (ancienne prospecte du challenge, jour 7 « J'ai réservé » coché il y a 2 jours, pas de questionnaire court) : CHAUD, « A coché « J'ai réservé mon bilan » il y a 2 jours. », « Prépare le bilan » ; sous-titre « Découverte · questionnaire à remplir · inscrit il y a 9 jours »", contient(k7, ["CHAUD", "A coché « J'ai réservé mon bilan » il y a 2 jours.", "Prépare le bilan"]) && s7 === "Découverte · questionnaire à remplir · inscrit il y a 9 jours", s7 + " | " + k7);
    const k8 = await carte(page, 8);
    ok("Omar (« Perdu » il y a 3 jours, puis case cochée hier) : CHAUD, « Revenu après l'issue « Perdu » », « Prépare le bilan », boutons Signé / Perdu / Absent (plus d'« Annuler »)", contient(k8, ["CHAUD", "Revenu après l'issue « Perdu »", "A coché « J'ai réservé mon bilan » hier.", "Prépare le bilan"]) && !k8.includes("PERDU") && !!(await page.$(`.sc-carte[data-uid="${PID(8)}"] [data-sc="signe"]`)) && !(await page.$(`.sc-carte[data-uid="${PID(8)}"] [data-sc="annuler"]`)), k8);
    /* Paul est inscrit il y a 26 h réelles : « hier » (J2) la plupart du temps, « il y a 2 jours » (J3) entre minuit et 2 h */
    const k9 = await carte(page, 9), s9 = await sousTitre(page, 9), c9 = creeDe(db, 9), q9 = quandDe(c9), j9 = jourDe(c9);
    ok("Paul (inscrit il y a 26 h, rien fait) : FROID (plus NOUVEAU passé 24 h), « Inscrit " + q9 + ", questionnaire pas rempli. », « DM de bienvenue » ; sous-titre « Découverte · questionnaire à remplir · inscrit " + q9 + " » (pas « il y a 26 h »)", contient(k9, ["FROID", "Inscrit " + q9 + ", questionnaire pas rempli.", "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes)."]) && !k9.includes("NOUVEAU") && s9 === "Découverte · questionnaire à remplir · inscrit " + q9, s9 + " | " + k9);
    const k11 = await carte(page, 11);
    ok("Yanis (découverte terminée, plus rien depuis 8 jours) : FROID, « Aucune action depuis 8 jours (découverte terminée). », « Relance : sa découverte est terminée, propose-lui le bilan. »", contient(k11, ["FROID", "Aucune action depuis 8 jours (découverte terminée).", "Relance : sa découverte est terminée, propose-lui le bilan."]), k11);
    const k13 = await carte(page, 13), s13 = await sousTitre(page, 13);
    ok("Félix (inscrit il y a 2 jours, questionnaire commencé 4/10 aujourd'hui, pas validé) : FROID, « Inscrit il y a 2 jours, questionnaire pas rempli. », « DM de bienvenue », pas « Questionnaire rempli » ; sous-titre « questionnaire à remplir »", contient(k13, ["FROID", "Inscrit il y a 2 jours, questionnaire pas rempli.", "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes)."]) && !k13.includes("Questionnaire rempli") && s13 === "Découverte · questionnaire à remplir · inscrit il y a 2 jours", s13 + " | " + k13);
    const k14 = await carte(page, 14), s14 = await sousTitre(page, 14);
    ok("Gabriel (bilan réservé il y a 3 jours, sans questionnaire) : CHAUD même sans questionnaire, « A coché « J'ai réservé mon bilan » il y a 3 jours. », « Prépare le bilan », pas « Aucune action depuis » (réservé) ; sous-titre « Découverte · questionnaire à remplir · inscrit il y a 4 jours »", contient(k14, ["CHAUD", "A coché « J'ai réservé mon bilan » il y a 3 jours.", "Prépare le bilan"]) && !k14.includes("Aucune action depuis") && !k14.includes("FROID") && s14 === "Découverte · questionnaire à remplir · inscrit il y a 4 jours", s14 + " | " + k14);
    await filtre(page, "tous");
    ok("« Tous » : 15 cartes", (await page.$$(".sc-carte")).length === 15, String((await page.$$(".sc-carte")).length));
    const P = await pastilles(page);
    const faux = Object.keys(ATTENDU).filter(k => { const x = P.find(y => y.uid === PID(k)), a = ATTENDU[k];
      return !x || x.etat !== a[0] || x.cls !== "pastille " + a[1] || x.score !== a[2] + "/100" || x.scls !== "pastille" + (a[3] ? " " + a[3] : ""); });
    ok("pastilles des 15 cartes : statut (NOUVEAU accent, CHAUD chaud, TIÈDE tiede, FROID froid) et score exact (Chloé 100 plafonné, Hugo 70, Inès 50, Karim 70, Lina 15, Marc 40, Nora 52, Omar 70, Paul 10, Sofia 40, Yanis 40, Emma 10, Félix 18, Gabriel 40, Hana 18 ; ≥ 70 ok, ≥ 40 accent, sinon neutre)", faux.length === 0, JSON.stringify(faux.map(k => P.find(y => y.uid === PID(k)) || k)));
    const k12 = await carte(page, 12), s12 = await sousTitre(page, 12), u12 = await page.$eval(`.sc-carte[data-uid="${PID(12)}"]`, e => e.classList.contains("urgent")).catch(() => null);
    const t12 = (P.find(y => y.uid === PID(12)) || {}).titre || "";
    const j12 = jourDe(creeDe(db, 12));
    ok("Emma (inscrite il y a 40 minutes, rien fait) : NOUVEAU, « Inscrit il y a moins d'une heure, rien fait pour l'instant. », « Rien à faire aujourd'hui : il vient de s'inscrire. », pas à traiter, info-bulle = la raison ; sous-titre « Découverte · questionnaire à remplir · inscrit il y a moins d'une heure »", contient(k12, ["NOUVEAU", "Inscrit il y a moins d'une heure, rien fait pour l'instant.", "Rien à faire aujourd'hui : il vient de s'inscrire."]) && u12 === false && t12.includes("rien fait pour l'instant") && s12 === "Découverte · questionnaire à remplir · inscrit il y a moins d'une heure", s12 + " | " + k12 + " | urgent " + u12);
    const k15 = await carte(page, 15), s15 = await sousTitre(page, 15), j15 = jourDe(creeDe(db, 15));
    ok("Hana (inscrite il y a 5,7 h, questionnaire commencé 4/10 sans validation) : NOUVEAU, « Inscrit il y a 5 h, questionnaire commencé (4/10 réponses). » (heures tronquées : pas « 6 h »), score 18/100 ; sous-titre « Découverte · questionnaire à remplir · inscrit il y a 5 h »", contient(k15, ["NOUVEAU", "Inscrit il y a 5 h, questionnaire commencé (4/10 réponses).", "Rien à faire aujourd'hui : il vient de s'inscrire."]) && s15 === "Découverte · questionnaire à remplir · inscrit il y a 5 h", s15 + " | " + k15);
    const k10 = await carte(page, 10);
    ok("Sofia (questionnaire hier, motivation 6) : TIÈDE, « Rien à faire aujourd'hui : il découvre (jour 2/7). »", contient(k10, ["TIÈDE", "Questionnaire rempli hier, motivation 6/10, découverte jour 2/7.", "Rien à faire aujourd'hui : il découvre (jour 2/7)."]), k10);
    await filtre(page, "nouveau");
    const nv = (await noms(page)).sort();
    await filtre(page, "chaud");
    const chauds = await noms(page);
    await filtre(page, "tiede");
    const tiedes = (await noms(page)).sort();
    await filtre(page, "froid");
    const froids = (await noms(page)).sort();
    ok("filtres : « Nouveaux » Emma, Hana ; « Chauds » Chloé, Omar, Nora, Gabriel (dans cet ordre) ; « Tièdes » Hugo, Inès, Sofia ; « Froids » Félix, Karim, Lina, Marc, Paul, Yanis", nv.join(",") === "Emma,Hana" && chauds.join(",") === "Chloé,Omar,Nora,Gabriel" && tiedes.join(",") === "Hugo,Inès,Sofia" && froids.join(",") === "Félix,Karim,Lina,Marc,Paul,Yanis", [nv, chauds, tiedes, froids].map(x => x.join(",")).join(" | "));
    ok("rien n'a été écrit en consultant (aucune demande d'écriture, même sans effet)", db.ecritures.length === 0 && db.tentatives.length === 0, JSON.stringify(db.tentatives));
    ok("le journal des emails de suivi a été lu (table emails_prospects, en lecture seule)", db.urls.some(x => x.indexOf("/rest/v1/emails_prospects") > -1));
  });

  /* ---------- A'. Une visite enregistrée dans la clé « activite » compte comme action du prospect ----------
     (elle entre dans la date de dernière action, page Prospects / Mes clients comme fiche : sans elle, un prospect
     qui revient voir l'app sans rien saisir paraîtrait inactif et passerait FROID) */
  await bloc("A'. activité", async () => {
    const ACT = [
      { k: 16, prenom: "Rémi", inscrit: 6, q: 5, m: 6, act: { jours: [1], temps: 60, le: 1 } },   // questionnaire il y a 5 jours, venu hier (clé activite seule) : TIÈDE
      { k: 17, prenom: "Théo", inscrit: 9, q: 8, m: 6, act: { jours: [4], temps: 60, le: 4 } },   // questionnaire il y a 8 jours, dernière visite il y a 4 jours : FROID « 4 jours » (pas 8)
      { k: 18, prenom: "Ugo", inscrit: 6, q: 5, m: 6 }                                            // témoin : comme Rémi, sans clé activite → FROID « 5 jours »
    ];
    const db = base({ prospects: ACT, emails: [] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    const k16 = await carte(page, 16), k17 = await carte(page, 17), k18 = await carte(page, 18);
    ok("A'. Rémi (questionnaire il y a 5 jours, rien saisi depuis, clé activite datée d'hier) : TIÈDE, « Questionnaire rempli il y a 5 jours, motivation 6/10, découverte jour 7/7. », « Rien à faire aujourd'hui : il découvre (jour 7/7). », jamais « Aucune action depuis » ni FROID", contient(k16, ["TIÈDE", "Questionnaire rempli il y a 5 jours, motivation 6/10, découverte jour 7/7.", "Rien à faire aujourd'hui : il découvre (jour 7/7)."]) && !k16.includes("Aucune action depuis") && !k16.includes("FROID"), k16);
    ok("A'. Théo (questionnaire il y a 8 jours, clé activite d'il y a 4 jours) : FROID « Aucune action depuis 4 jours (découverte terminée). » (pas 8 jours : la visite compte), « Relance : sa découverte est terminée, propose-lui le bilan. »", contient(k17, ["FROID", "Aucune action depuis 4 jours (découverte terminée).", "Relance : sa découverte est terminée, propose-lui le bilan."]) && !k17.includes("Aucune action depuis 8 jours"), k17);
    ok("A'. témoin Ugo (comme Rémi, sans clé activite) : FROID « Aucune action depuis 5 jours (découverte jour 7/7). », « Relance douce en DM : demande-lui où il en est. »", contient(k18, ["FROID", "Aucune action depuis 5 jours (découverte jour 7/7).", "Relance douce en DM : demande-lui où il en est."]), k18);
    await aller(page, "#/clients", 2200);
    const l16 = await ligneClient(page, PID(16)), l17 = await ligneClient(page, PID(17)), l18 = await ligneClient(page, PID(18));
    ok("A'. Mes clients : Rémi TIÈDE, Théo FROID, Ugo FROID", l16.includes("TIÈDE") && !l16.includes("FROID") && l17.includes("FROID") && l18.includes("FROID"), [l16, l17, l18].join(" | ").slice(0, 500));
    await page.click(`[data-ouvrir="${PID(16)}"]`).catch(() => {}); await attendre(page, 2000);
    const f16 = await texte(page, "#fiche-commercial");
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(17)}"]`).catch(() => {}); await attendre(page, 2000);
    const f17 = await texte(page, "#fiche-commercial");
    ok("A'. fiches (date de dernière action calculée à part) : Rémi TIÈDE sans « Aucune action depuis » ; Théo FROID « Aucune action depuis 4 jours (découverte terminée). » ; rien d'écrit", contient(f16, ["Suivi commercial", "TIÈDE"]) && !f16.includes("Aucune action depuis") && !f16.includes("FROID") && contient(f17, ["FROID", "Aucune action depuis 4 jours (découverte terminée)."]) && db.tentatives.length === 0, (f16.slice(0, 200) + " | " + f17.slice(0, 200)) + " | " + JSON.stringify(db.tentatives));
  });

  /* ---------- B. Actions : relance, Perdu (motif), Absent, Signé puis Passer client, Annuler (inchangées) ---------- */
  await bloc("B. actions", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 6, "relance"); await attendre(page, 1800);
    let S = suiviDe(db, 6);
    ok("« J'ai relancé » (Marc) : suivi_prospect créé (1 relance datée), Marc sort de « À traiter » (l'écriture du coach ne compte pas comme activité du prospect)", !!S && Array.isArray(S.relances) && S.relances.length === 1 && S.version === 1 && !(await page.$(`.sc-carte[data-uid="${PID(6)}"]`)), JSON.stringify(S));
    await filtre(page, "tous");
    ok("Marc après relance : toujours FROID, « Relancé aujourd'hui : attends sa réponse. », sous-titre « · 1 relance »", contient(await carte(page, 6), ["FROID", "Relancé aujourd'hui : attends sa réponse."]) && (await sousTitre(page, 6)).endsWith(" · 1 relance"), await carte(page, 6));
    await cliquer(page, 2, "perdu"); await attendre(page, 500);
    await page.fill(".modale input", "prix"); await bouton(page, "Perdu"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Perdu » (Hugo) avec le motif « prix » : issue perdu datée, carte PERDU « Relance prévue dans 30 jours »", !!S && S.issue === "perdu" && S.note === "prix" && /^\d{4}-/.test(S.issue_le) && contient(await carte(page, 2), ["PERDU", "Relance prévue dans 30 jours", "prix"]), JSON.stringify(S) + " | " + await carte(page, 2));
    await cliquer(page, 1, "absent"); await attendre(page, 500); await bouton(page, "Absent"); await attendre(page, 1800);
    ok("« Absent » (Chloé) : issue absent, « Absent à l'appel : repropose-lui un créneau en DM. » (sa case cochée avant l'appel ne la fait pas revenir)", (suiviDe(db, 1) || {}).issue === "absent" && contient(await carte(page, 1), ["ABSENT", "repropose-lui un créneau"]), await carte(page, 1));
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1500); await bouton(page, "Plus tard"); await attendre(page, 1800);
    ok("« Signé » (Inès) puis « Plus tard » : issue signe, toujours prospect, carte SIGNÉ avec « Passer client »", (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect" && (await carte(page, 3)).includes("SIGNÉ") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
    await cliquer(page, 3, "client"); await attendre(page, 500); await bouton(page, "Passer client"); await attendre(page, 2200);
    const T = await tuiles(page, "#pr-vue");
    ok("« Passer client » (Inès) : statut client en base, Inès quitte la liste des prospects, tuile « Signés » à 1", db.profils.find(p => p.id === PID(3)).statut === "client" && !(await page.$(`.sc-carte[data-uid="${PID(3)}"]`)) && T["Signés"] === "1", JSON.stringify(T));
    await cliquer(page, 2, "annuler"); await attendre(page, 500); await bouton(page, "Retirer l'issue"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Annuler « Perdu » » (Hugo) : issue retirée (historique gardé), Hugo redevient TIÈDE (questionnaire et clic d'hier, pas de réservation)", !!S && !S.issue && Array.isArray(S.historique) && S.historique.length === 2 && (await carte(page, 2)).includes("TIÈDE") && !(await carte(page, 2)).includes("PERDU"), JSON.stringify(S) + " | " + await carte(page, 2));
    const patchs = db.ecritures.filter(e => e.table === "donnees" && e.m === "PATCH");
    ok("toutes les demandes d'écriture sont des suivi_prospect (et un passage client), aucune autre clé touchée ; chaque modification d'une ligne existante est conditionnelle (maj_le=eq.…)", db.tentatives.length > 0 && db.tentatives.every(e => (e.table === "donnees" && e.outil === "suivi_prospect") || (e.table === "profils" && e.m === "PATCH")) && patchs.length >= 2 && patchs.every(e => /^eq\.\d{4}-/.test(e.maj_le || "")), JSON.stringify(db.tentatives.map(e => [e.m, e.outil || e.table, e.maj_le])));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-desktop.png"), fullPage: true });
  });
  await bloc("B. conflit", async () => {
    /* conflit : un autre onglet ecrit le suivi entre notre lecture et notre ecriture → relecture, rien de perdu */
    const db = base(); db.conflit = 1; const lu = instant(9);
    db.donnees.push({ user_id: PID(6), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: lu });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 6, "relance"); await attendre(page, 2200);
    const S = suiviDe(db, 6);
    ok("conflit d'écriture (autre onglet) : relu et rejoué, les 3 relances sont gardées (la nôtre en plus)", !!S && S.relances.length === 3, JSON.stringify(S));
    const pt = db.tentatives.filter(e => e.table === "donnees" && e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    const pe = db.ecritures.filter(e => e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    ok("… écriture conditionnelle : le premier PATCH porte maj_le=eq.<date lue> et ne touche rien, le PATCH rejoué porte la nouvelle date écrite par l'autre onglet", pt.length === 2 && pt[0].maj_le === "eq." + lu && !!db.majAutreOnglet && pt[1].maj_le === "eq." + db.majAutreOnglet && pe.length === 1 && pe[0].maj_le === "eq." + db.majAutreOnglet, JSON.stringify(pt.map(e => e.maj_le)) + " | autre onglet " + db.majAutreOnglet);
  });
  await bloc("B. 504", async () => {
    /* « Signé » puis le passage en client echoue (504) : l'issue est bien la, la carte montre SIGNÉ, le message le dit */
    const db = base(); db.echecClient = true;
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1800); await bouton(page, "Passer client"); await attendre(page, 1800);
    const alerte = await texte(page, ".modale");
    ok("« Signé » puis passage en client en échec : « « Signé » est bien enregistré, mais le passage en client a échoué (erreur 504 du serveur) », un seul « Réessaie », l'issue est en base, statut toujours prospect", alerte.includes("« Signé » est bien enregistré") && alerte.includes("(erreur 504 du serveur)") && (alerte.match(/Réessaie/g) || []).length === 1 && (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect", alerte.slice(0, 200));
    await bouton(page, "OK"); await attendre(page, 1500);
    await filtre(page, "tous");
    ok("… la carte d'Inès montre SIGNÉ avec « Passer client » (pas TIÈDE)", (await carte(page, 3)).includes("SIGNÉ") && !(await carte(page, 3)).includes("TIÈDE") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
  });
  await bloc("B. 409", async () => {
    /* course a la creation : la ligne existe deja quand notre lecture la croit absente → 409 → relue → modifiee, rien de perdu */
    const db = base(); db.cacheLigne = 1; const lu = instant(9);
    db.donnees.push({ user_id: PID(6), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: lu });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 6, "relance"); await attendre(page, 2200);
    ok("création en course (409) : relue puis modifiée, les 2 relances sont gardées", ((suiviDe(db, 6) || {}).relances || []).length === 2, JSON.stringify(suiviDe(db, 6)));
    const pe = db.ecritures.filter(e => e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    ok("… la relance de Marc sur sa ligne existante est un PATCH conditionnel : maj_le=eq.<date lue> (sans condition, l'écriture d'un autre onglet serait écrasée)", pe.length === 1 && pe[0].maj_le === "eq." + lu, JSON.stringify(pe.map(e => e.maj_le)) + " | lu " + lu);
  });
  await bloc("B. ancien client", async () => {
    /* un client (ancien prospect « Absent ») : sa fiche n'a pas de bloc « Suivi commercial » ni de score */
    const db = base(); db.donnees.push({ user_id: F.IDS.c1, outil: "suivi_prospect", contenu: { version: 1, issue: "absent", issue_le: instant(3) }, maj_le: instant(3) });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`).catch(() => {}); await attendre(page, 2000);
    ok("fiche d'un client avec un ancien suivi (Absent) : pas de bloc « Suivi commercial », pas de « Score de qualification »", (await texte(page, "#vue")).includes("Fiche client") && !(await page.$("#fiche-commercial")) && !(await page.$("#fiche-score")));
  });
  await bloc("B. verrou", async () => {
    /* verrou par prospect : pendant une ecriture lente sur Marc, un second clic sur Marc est ignore AVEC un mot ; Lina reste possible */
    const db = base(); db.lentEcriture = 2500;
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(6));
    await attendre(page, 200);
    await page.evaluate(k => { const b = document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`); b.disabled = false; b.click(); }, PID(6));
    await attendre(page, 300);
    const t1 = await texte(page, "#toasts");
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(5));
    await attendre(page, 7000);
    ok("verrou par prospect : second clic sur Marc ignoré avec « Une action est en cours pour Marc », une seule relance ; Lina relancée en parallèle", t1.includes("Une action est en cours pour Marc") && ((suiviDe(db, 6) || {}).relances || []).length === 1 && ((suiviDe(db, 5) || {}).relances || []).length === 1, t1 + " | " + JSON.stringify([suiviDe(db, 6), suiviDe(db, 5)].map(x => x && x.relances && x.relances.length)));
  });

  /* ---------- B'. Statuts v51, seuils et cas limites, calculés par la vraie fonction Commercial.analyse(p, C, S, activite, D) ---------- */
  await bloc("B'. seuils", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const r = await page.evaluate(() => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const H = h => new Date(Date.now() - h * 3600000).toISOString();
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const ph = h => ({ statut: "prospect", cree_le: H(h) });
      const Q = (n, m) => ({ court_le: typeof n === "string" ? n : J(n), motivation: String(m) });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(v => ({ jour: 1, source: "decouverte", date: typeof v === "string" ? v : J(v) })) } }; if (o.reserve != null) x.reserve = typeof o.reserve === "string" ? o.reserve : J(o.reserve); return x; };
      const a = (P, Cc, S, act, D) => { const z = Commercial.analyse(P, Cc, S, act, D); return { etat: z.etat, urgent: z.urgent, action: z.action, raisons: z.raisons.join(" "), q: z.questionnaire, nouveau: z.nouveau, rang: z.rang }; };
      /* ancienne clé du Challenge 7 jours (la vraie base peut encore en contenir) : jours 1 à 6 faits, choix du jour 6 */
      const ancienJ6 = etat => { const j = {}; for (let n = 1; n <= 6; n++) j[String(n)] = { fait: J(8 - n + 1), date: J(8 - n + 1) }; j["6"] = { fait: J(1), date: J(1), etat }; return { version: 1, debut: J(8), jours: j, cta: { clics: [] } }; };
      return {
        cfg: Commercial.cfg(),
        n23: a(ph(23), null, {}, null, null),
        n25: a(ph(25), null, {}, null, null),
        n0: a(p(0), null, {}, null, null),
        nBrouillon: a(ph(3), null, {}, H(1), { sexe: "Homme", age: 40, court_debut: H(1) }),
        nQ: a(ph(3), null, {}, H(1), Q(H(1), 6)),
        nReserve: a(ph(3), C({ reserve: H(1) }), {}, H(1), null),
        nClic: a(ph(3), C({ clics: [H(1)] }), {}, H(1), null),
        fBrouillon: a(p(5), null, {}, J(0), { sexe: "Homme", age: 40 }),
        clicQ: a(p(4), C({ clics: [1] }), {}, J(1), Q(4, 6)),
        clicSansQ: a(p(4), C({ clics: [1] }), {}, J(1), null),
        act2: a(p(5), null, {}, J(2), Q(5, 6)),
        act3: a(p(5), null, {}, J(3), Q(5, 6)),
        reserveSansQ: a(p(2), C({ reserve: 0 }), {}, J(0), null),
        reserveVieille: a(p(12), C({ reserve: 10 }), {}, J(10), null),
        sansQ4: a(p(6), null, {}, J(4), {}),
        motiv8: a(p(2), null, {}, J(0), Q(2, 8)),
        motiv7: a(p(2), null, {}, J(0), Q(2, 7)),
        relances2: a(p(10), null, { relances: [H(20), H(10)] }, H(30), Q(9, 6)),
        epuise: a(p(10), C({ clics: [H(50)] }), { relances: [H(40), H(30), H(20)] }, H(50), Q(9, 6)),
        epuiseCase: a(p(10), C({ reserve: H(50) }), { relances: [H(40), H(30), H(20)] }, H(50), Q(9, 6)),
        avancer6: a(p(8), ancienJ6("avancer"), {}, J(1), null),
        pasMaintenant6: a(p(8), ancienJ6("pas_maintenant"), {}, J(1), Q(8, 6)),
        finieSansQ: a(p(10), null, {}, null, null),
        finieActif: a(p(9), null, {}, J(1), Q(8, 5)),
        sansDate: a({ statut: "prospect", cree_le: null }, null, {}, null, null),
        piege: a(p(4), { reserve: { a: 1 }, cta: { clics: "x" } }, {}, J(0), { court_le: 5, motivation: { x: 1 } })
      };
    });
    ok("seuils de CONFIG.suivi : nouveau_heures = 24, inactif_jours = 3 (et relances_max = 3)", r.cfg.nouveau_heures === 24 && r.cfg.inactif_jours === 3 && r.cfg.relances_max === 3, JSON.stringify(r.cfg));
    ok("inscrit il y a 23 h, rien fait : NOUVEAU « Inscrit il y a 23 h, rien fait pour l'instant. », « Rien à faire aujourd'hui : il vient de s'inscrire. », non urgent", r.n23.etat === "nouveau" && r.n23.nouveau === true && r.n23.urgent === false && r.n23.raisons.includes("Inscrit il y a 23 h, rien fait pour l'instant.") && r.n23.action === "Rien à faire aujourd'hui : il vient de s'inscrire.", JSON.stringify(r.n23));
    ok("inscrit il y a 25 h, rien fait : FROID « questionnaire pas rempli », « DM de bienvenue… », urgent", r.n25.etat === "froid" && r.n25.nouveau === false && r.n25.urgent === true && r.n25.raisons.includes("questionnaire pas rempli.") && r.n25.action === "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes).", JSON.stringify(r.n25));
    ok("inscrit à l'instant : NOUVEAU « Inscrit il y a moins d'une heure, rien fait pour l'instant. »", r.n0.etat === "nouveau" && r.n0.raisons.includes("Inscrit il y a moins d'une heure, rien fait pour l'instant."), JSON.stringify(r.n0));
    ok("moins de 24 h, questionnaire commencé mais pas validé (brouillon) : encore NOUVEAU (seule la validation compte)", r.nBrouillon.etat === "nouveau" && r.nBrouillon.q === false, JSON.stringify(r.nBrouillon));
    /* questionnaire validé il y a 1 h : « aujourd'hui », ou « hier » entre minuit et 1 h (calendrier local) — les deux sont justes */
    ok("moins de 24 h, questionnaire validé il y a 1 h : TIÈDE (plus NOUVEAU), « Questionnaire rempli aujourd'hui, motivation 6/10 » (« hier » entre minuit et 1 h)", r.nQ.etat === "tiede" && r.nQ.nouveau === false && /Questionnaire rempli (aujourd'hui|hier), motivation 6\/10/.test(r.nQ.raisons), JSON.stringify(r.nQ));
    ok("moins de 24 h, bilan réservé (sans questionnaire) : CHAUD, « Prépare le bilan », urgent", r.nReserve.etat === "chaud" && r.nReserve.nouveau === false && r.nReserve.urgent === true && r.nReserve.action.startsWith("Prépare le bilan"), JSON.stringify(r.nReserve));
    /* VÉRIFICATION VOLONTAIREMENT OUVERTE — À RESSERRER APRÈS L'ARBITRAGE DE LUCAS. Le brief ne dit pas quoi faire d'un
       prospect de moins de 24 h qui a cliqué « Réserver mon bilan » sans questionnaire ni réservation. L'app le classe
       aujourd'hui FROID tout de suite (urgent, « DM de bienvenue », raison « Inscrit aujourd'hui, questionnaire pas
       rempli. »), alors que le brief ne met FROID qu'« passé 24 h ». Ici FROID et TIÈDE passent tous les deux : ni le
       comportement actuel ni sa correction ne sont figés (une copie qui le passe TIÈDE passerait aussi). Une fois la
       décision prise, vérifier l'état exact, l'urgence, la prochaine action et la raison. */
    ok("moins de 24 h, un clic « Réserver » sans questionnaire ni réservation : ni NOUVEAU (il a fait quelque chose) ni CHAUD (un clic ne suffit pas) — ouvert en attendant l'arbitrage de Lucas (FROID ou TIÈDE)", r.nClic.etat !== "nouveau" && r.nClic.etat !== "chaud" && r.nClic.nouveau === false, JSON.stringify(r.nClic));
    ok("inscrit il y a 5 jours, questionnaire commencé aujourd'hui sans validation : FROID « Inscrit il y a 5 jours, questionnaire pas rempli. » (être actif ne suffit plus), « DM de bienvenue »", r.fBrouillon.etat === "froid" && r.fBrouillon.q === false && r.fBrouillon.raisons.includes("Inscrit il y a 5 jours, questionnaire pas rempli.") && !r.fBrouillon.raisons.includes("Actif (dernière activité") && r.fBrouillon.action.startsWith("DM de bienvenue"), JSON.stringify(r.fBrouillon));
    ok("questionnaire rempli + clic hier, sans réservation : TIÈDE « A cliqué « Réserver mon bilan » (1 fois), la dernière hier, sans réserver. », « DM : il a cliqué sans réserver… », urgent, rang des tièdes (5)", r.clicQ.etat === "tiede" && r.clicQ.urgent === true && r.clicQ.rang === 5 && r.clicQ.raisons.includes("A cliqué « Réserver mon bilan » (1 fois), la dernière hier, sans réserver.") && r.clicQ.action === "DM : il a cliqué sans réserver, demande-lui ce qui le retient.", JSON.stringify(r.clicQ));
    ok("clic hier mais pas de questionnaire, inscrit il y a 4 jours : FROID (pas de questionnaire passé 24 h)", r.clicSansQ.etat === "froid" && r.clicSansQ.raisons.includes("Inscrit il y a 4 jours, questionnaire pas rempli."), JSON.stringify(r.clicSansQ));
    ok("questionnaire rempli, dernière action il y a 2 jours : TIÈDE ; il y a 3 jours : FROID « Aucune action depuis 3 jours (découverte jour 6/7). », « Relance douce en DM »", r.act2.etat === "tiede" && !r.act2.raisons.includes("Aucune action") && r.act3.etat === "froid" && r.act3.raisons.includes("Aucune action depuis 3 jours (découverte jour 6/7).") && r.act3.action === "Relance douce en DM : demande-lui où il en est.", JSON.stringify([r.act2, r.act3]));
    ok("bilan réservé aujourd'hui sans questionnaire : CHAUD « A coché « J'ai réservé mon bilan » aujourd'hui. », rang 1", r.reserveSansQ.etat === "chaud" && r.reserveSansQ.rang === 1 && r.reserveSansQ.raisons.includes("A coché « J'ai réservé mon bilan » aujourd'hui."), JSON.stringify(r.reserveSansQ));
    ok("bilan réservé il y a 10 jours, plus rien depuis, sans questionnaire : reste CHAUD (l'inactivité ne refroidit pas un réservé), « l'appel a-t-il eu lieu ? », pas « Aucune action depuis »", r.reserveVieille.etat === "chaud" && r.reserveVieille.action.includes("l'appel a-t-il eu lieu ?") && !r.reserveVieille.raisons.includes("Aucune action depuis"), JSON.stringify(r.reserveVieille));
    ok("questionnaire pas rempli, plus rien depuis 4 jours : FROID « Inscrit il y a 6 jours, questionnaire pas rempli. » et « Aucune action depuis 4 jours », jamais « Questionnaire rempli »", r.sansQ4.etat === "froid" && r.sansQ4.q === false && r.sansQ4.raisons.includes("Inscrit il y a 6 jours, questionnaire pas rempli.") && r.sansQ4.raisons.includes("Aucune action depuis 4 jours") && !r.sansQ4.raisons.includes("Questionnaire rempli"), JSON.stringify(r.sansQ4));
    ok("motivation 8/10 : « DM : il se dit motivé à 8/10, propose-lui le bilan. » (urgent) ; 7/10 : « Rien à faire aujourd'hui : il découvre (jour 3/7). » ; tous deux TIÈDE", r.motiv8.etat === "tiede" && r.motiv8.action === "DM : il se dit motivé à 8/10, propose-lui le bilan." && r.motiv8.urgent === true && r.motiv7.etat === "tiede" && r.motiv7.action === "Rien à faire aujourd'hui : il découvre (jour 3/7)." && r.motiv7.urgent === false, JSON.stringify([r.motiv8, r.motiv7]));
    ok("2 relances sans réponse (questionnaire rempli, actif avant) : reste TIÈDE, « Relancé 2 fois sans réponse. »", r.relances2.etat === "tiede" && r.relances2.raisons.includes("Relancé 2 fois sans réponse."), JSON.stringify(r.relances2));
    ok("clic et questionnaire mais 3 relances sans réponse depuis : FROID « Relancé 3 fois sans réponse. » ; avec la case « J'ai réservé » : reste CHAUD", r.epuise.etat === "froid" && r.epuise.raisons.includes("Relancé 3 fois sans réponse.") && r.epuiseCase.etat === "chaud", JSON.stringify([r.epuise, r.epuiseCase]));
    ok("ancien prospect du Challenge (jours 1 à 6 faits), jour 6 « Je veux avancer » hier, sans clic ni case : pas CHAUD, l'ancien choix du jour 6 n'est plus lu", r.avancer6.etat !== "chaud" && !/Jour 6|avancer/.test(r.avancer6.raisons) && r.avancer6.action !== "Envoie-lui le lien de réservation en DM aujourd'hui.", JSON.stringify(r.avancer6));
    ok("ancien prospect du Challenge, jour 6 « Pas maintenant », questionnaire rempli, actif hier : TIÈDE (pas FROID), sans « Ne pas insister »", r.pasMaintenant6.etat === "tiede" && !r.pasMaintenant6.action.includes("Ne pas insister") && !/Jour 6|Pas maintenant/.test(r.pasMaintenant6.raisons), JSON.stringify(r.pasMaintenant6));
    ok("découverte finie sans questionnaire : FROID, « Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan. »", r.finieSansQ.etat === "froid" && r.finieSansQ.action === "Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan.", JSON.stringify(r.finieSansQ));
    ok("questionnaire rempli, découverte terminée, encore actif hier : TIÈDE, « DM : sa découverte est terminée, propose-lui le bilan. » (urgent)", r.finieActif.etat === "tiede" && r.finieActif.urgent === true && r.finieActif.action === "DM : sa découverte est terminée, propose-lui le bilan.", JSON.stringify(r.finieActif));
    ok("date d'inscription illisible : rien ne tombe, pas NOUVEAU, « Inscrit à une date inconnue, questionnaire pas rempli. »", r.sansDate.etat === "froid" && r.sansDate.nouveau === false && r.sansDate.raisons.includes("Inscrit à une date inconnue, questionnaire pas rempli."), JSON.stringify(r.sansDate));
    ok("clé et questionnaire piégés (case objet, clics texte, court_le nombre, motivation objet) : rien ne tombe, questionnaire non compté, pas CHAUD", !!r.piege && r.piege.q === false && r.piege.etat !== "chaud" && !r.piege.raisons.includes("J'ai réservé"), JSON.stringify(r.piege));
  });
  await bloc("B'. issues", async () => {
    /* issues qui vieillissent, retours et anciens clients, calcules par la vraie fonction (logique inchangée depuis la v49) */
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const r = await page.evaluate(({ ancien }) => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const Q = (n, m) => ({ court_le: J(n), motivation: String(m) });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(n => ({ jour: 1, source: "decouverte", date: J(n) })) } }; if (o.reserve != null) x.reserve = J(o.reserve); return x; };
      const a = (P, Cc, S, act, D) => { const z = Commercial.analyse(P, Cc, S, act, D); return { etat: z.etat, urgent: z.urgent, action: z.action, raisons: z.raisons.join(" ") }; };
      const vieil = JSON.parse(JSON.stringify(ancien)); vieil.jours["7"].reserve = J(45);
      const vieilAvant = JSON.parse(JSON.stringify(ancien)); vieilAvant.jours["7"].reserve = J(200);
      return {
        vieux: a(p(200), null, { relances: [J(40), J(30), J(20), J(10), J(5)] }, null, null),
        perdu: a(p(60), C({}), { issue: "perdu", issue_le: J(40), relances: [J(5)] }, J(41), Q(60, 6)),
        perduClic: a(p(60), C({ clics: [1] }), { issue: "perdu", issue_le: J(10) }, J(1), Q(60, 6)),
        absentCase: a(p(12), C({ reserve: 1 }), { issue: "absent", issue_le: J(4) }, J(1), Q(12, 7)),
        perduCaseRecente: a(p(40), C({ reserve: 10 }), { issue: "perdu", issue_le: J(30) }, J(10), Q(40, 6)),
        perduCaseVieille: a(p(40), C({ reserve: 20 }), { issue: "perdu", issue_le: J(30) }, J(20), Q(40, 6)),
        vieuxClic: a(p(90), C({ clics: [10] }), { issue: "perdu", issue_le: J(60) }, J(10), Q(90, 6)),
        case7: a(p(12), C({ reserve: 7 }), {}, J(7), Q(12, 6)),
        case8: a(p(12), C({ reserve: 8 }), {}, J(8), Q(12, 6)),
        ancien45: a(p(60), vieil, {}, J(45), null),
        ancienClient: a(p(200), C({}), { issue: "signe", issue_le: J(120), client_le: J(119) }, J(100), Q(200, 6)),
        futur: a(p(20), C({}), { relances: [J(8), J(7), J(6)] }, new Date(Date.now() + 5 * 86400000).toISOString(), Q(20, 6)),
        oublie: a(p(80), C({}), { issue: "signe", issue_le: J(31) }, J(31), Q(80, 6)),
        ancienCase: a(p(260), vieilAvant, { issue: "signe", issue_le: J(199), client_le: J(198) }, J(150), null),
        resigne: a(p(300), C({}), { issue: "signe", issue_le: J(0), client_le: J(200) }, J(0), Q(300, 6))
      };
    }, { ancien: cleAncienChallenge({ inscrit: 60, ancien: 45 }) });
    ok("inscrit il y a 200 jours, jamais de questionnaire, 5 relances sans réponse : plus à traiter, « Sans réponse après 5 relances : classe-le « Perdu » »", r.vieux.urgent === false && r.vieux.action.includes("Sans réponse après 5 relances : classe-le « Perdu »") && r.vieux.etat === "froid", JSON.stringify(r.vieux));
    ok("« Perdu » il y a 40 jours et déjà relancé après : plus à traiter (« s'il ne répond pas, laisse-le »)", r.perdu.etat === "perdu" && r.perdu.urgent === false && r.perdu.action.includes("laisse-le"), JSON.stringify(r.perdu));
    ok("« Perdu » puis il reclique « Réserver mon bilan » hier (questionnaire rempli, pas de réservation) : revient dans la course en TIÈDE (« Revenu après l'issue « Perdu » »), plus PERDU", r.perduClic.etat === "tiede" && r.perduClic.raisons.includes("Revenu après l'issue « Perdu »"), JSON.stringify(r.perduClic));
    ok("« Absent » puis case « J'ai réservé mon bilan » cochée hier : redevient CHAUD (« Revenu après l'issue « Absent » »), « Prépare le bilan »", r.absentCase.etat === "chaud" && r.absentCase.raisons.includes("Revenu après l'issue « Absent »") && r.absentCase.action.startsWith("Prépare le bilan") && r.absentCase.urgent === true, JSON.stringify(r.absentCase));
    ok("« Perdu » il y a 30 jours puis case cochée après l'issue : il y a 10 jours → CHAUD (revenu, 14 jours au plus) ; il y a 20 jours → reste PERDU, « Relance-le »", r.perduCaseRecente.etat === "chaud" && r.perduCaseRecente.raisons.includes("Revenu après l'issue « Perdu »") && r.perduCaseVieille.etat === "perdu" && r.perduCaseVieille.action.includes("Relance-le"), JSON.stringify([r.perduCaseRecente, r.perduCaseVieille]));
    ok("clic « Réserver » 50 jours après « Perdu » (10 jours avant aujourd'hui) : reste PERDU (le retour doit être récent)", r.vieuxClic.etat === "perdu", JSON.stringify(r.vieuxClic));
    ok("case « J'ai réservé » il y a 7 jours : « Prépare le bilan » ; il y a 8 jours : « l'appel a-t-il eu lieu ? »", r.case7.action.startsWith("Prépare le bilan") && r.case8.action.includes("l'appel a-t-il eu lieu ?"), JSON.stringify([r.case7.action, r.case8.action]));
    ok("ancien prospect du challenge, « J'ai réservé » du jour 7 il y a 45 jours sans issue : CHAUD, « l'appel a-t-il eu lieu ? »", r.ancien45.etat === "chaud" && r.ancien45.action.includes("l'appel a-t-il eu lieu"), JSON.stringify(r.ancien45));
    ok("ancien client redevenu prospect : plus « SIGNÉ », action propre non urgente « Ancien client redevenu prospect », raison « Ancien client »", r.ancienClient.etat !== "signe" && r.ancienClient.urgent === false && r.ancienClient.action.includes("Ancien client redevenu prospect") && r.ancienClient.raisons.includes("Ancien client"), JSON.stringify(r.ancienClient));
    ok("activité datée dans le futur (horloge du prospect en avance) : les relances comptent quand même (« Sans réponse après 3 relances »)", r.futur.action.includes("Sans réponse après 3 relances"), JSON.stringify(r.futur));
    ok("« Signé » il y a 31 jours, jamais passé client : reste SIGNÉ, rappel non urgent « passe-le client, ou retire l'issue s'il a arrêté »", r.oublie.etat === "signe" && r.oublie.urgent === false && r.oublie.action.includes("passe-le client, ou retire l'issue"), JSON.stringify(r.oublie));
    ok("ancien client dont la case « J'ai réservé » (challenge) date d'avant sa signature : action « Ancien client… », non urgente (la vieille case ne compte plus)", r.ancienCase.urgent === false && r.ancienCase.action.includes("Ancien client redevenu prospect"), JSON.stringify(r.ancienCase));
    ok("ancien client revenu et re-signé aujourd'hui : SIGNÉ, « Passe-le client » (son ancien passage n'annule pas la nouvelle signature)", r.resigne.etat === "signe" && r.resigne.urgent === true && r.resigne.action.includes("Passe-le client"), JSON.stringify(r.resigne));
  });

  /* ---------- S. Score de qualification, calculé par la vraie fonction Commercial.score(p, C, D, A, E) ---------- */
  await bloc("S. score", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const r = await page.evaluate(() => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const jr = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(n => ({ jour: 1, source: "decouverte", date: J(n) })) } }; if (o.reserve != null) x.reserve = J(o.reserve); return x; };
      const VALS = { sexe: "Homme", age: 34, taille: 180, poids: 85, objectif: "Perte de poids / sèche", seances: "3", essaye: "Rien", obstacle: "Le temps", pourquoi: "La forme", motivation: "7" };
      const brouillon = n => { const o = {}; Object.keys(VALS).slice(0, n).forEach(k => { o[k] = VALS[k]; }); return o; };
      const Qf = Object.assign(brouillon(10), { court_le: J(1) });
      const A = (jours, temps) => ({ version: 1, jours: jours.map(jr), pages: { formation: 2 }, temps_s: temps, derniere: J(0) });
      const lu = { statut: "envoye", envoye_le: J(2), ouvert_le: J(1) }, nonLu = { statut: "envoye", envoye_le: J(2), ouvert_le: null };
      const s = (P, Cc, D, Ac, E) => { const z = Commercial.score(P, Cc, D, Ac, E); const L = {}; z.lignes.forEach(l => { L[l.cle] = { pts: l.pts, lbl: l.lbl, max: l.max, nm: !!l.nonMesure, bonus: !!l.bonus }; });
        return { total: z.total, somme: z.lignes.reduce((t, l) => t + l.pts, 0), max: z.lignes.filter(l => !l.bonus).reduce((t, l) => t + l.max, 0), L, rep: z.repondues, q: z.questions }; };
      return {
        seul: s(p(0), null, null, null, []),
        enCours4: s(p(1), null, brouillon(4), null, []),
        enCours4r: s(p(1), null, Object.assign(brouillon(4), { repondues: 4 }), null, []),
        enCours9: s(p(1), null, brouillon(9), null, []),
        enCours10: s(p(1), null, brouillon(10), null, []),
        rempli: s(p(2), null, Qf, null, []),
        rempliClic: s(p(2), C({ clics: [1, 0] }), Qf, null, []),
        complet: s(p(3), C({ clics: [1], reserve: 0 }), Qf, null, []),
        plafond: s(p(3), C({ clics: [1], reserve: 0 }), Qf, A([2, 1, 0], 600), [lu]),
        reserveSeule: s(p(2), C({ reserve: 0 }), null, null, []),
        clicSeul: s(p(2), C({ clics: [0] }), null, null, []),
        bonusBas: s(p(2), null, Qf, A([0, 0], 299), [nonLu]),
        bonusHaut: s(p(2), null, Qf, A([1, 0], 300), [nonLu, nonLu]),
        emailLu: s(p(2), null, Qf, null, [nonLu, lu]),
        sansJournal: s(p(2), null, Qf, null, null),
        sansJournalBonus: s(p(2), null, Qf, A([1, 0], 300), undefined),
        piege: s(p(2), { reserve: { a: 1 }, cta: { clics: "x" } }, { repondues: 99, court_le: 5 }, { jours: "x", pages: 5, temps_s: "900" }, [{ ouvert_le: 5 }, null, "x", { statut: { a: 1 } }]),
        piegeNeg: s(p(2), null, { repondues: -5 }, null, []),
        piegeNaN: s(p(2), null, { repondues: NaN, sexe: "F" }, null, []),
        pastilles: [70, 69, 40, 39].map(t => Commercial.pastilleScore({ total: t })),
        etats: ["nouveau", "chaud", "tiede", "froid"].map(e => Commercial.pastille({ etat: e, raisons: ["<b>x</b>"] }))
      };
    });
    const L = (x, k) => (x && x.L && x.L[k]) || {};
    /* v52 (28/09/2026, Chantier 1 lot C) : un inscrit qui n'a rien répondu est sur le nouveau questionnaire court, compté sur
       ses 3 questions (avant : « 0/10 réponses ») ; les réponses de l'ancien questionnaire restent comptées sur 10 (cas suivants) */
    ok("inscrit seul : 10/100 ; « Questionnaire en cours (0/3 réponses) » 0 ; « Email ouvert (0 email de suivi envoyé) » 0 ; barème de base 10 + 30 + 30 + 30 = 100", r.seul.total === 10 && L(r.seul, "inscription").pts === 10 && L(r.seul, "questionnaire").lbl === "Questionnaire en cours (0/3 réponses)" && L(r.seul, "questionnaire").pts === 0 && L(r.seul, "emails").lbl === "Email ouvert (0 email de suivi envoyé)" && L(r.seul, "emails").pts === 0 && r.seul.max === 100 && r.seul.q === 3, JSON.stringify(r.seul));
    ok("questionnaire en cours 4/10 : 18/100 (10 + 8), « Questionnaire en cours (4/10 réponses) » 8 / 30 ; même résultat avec repondues = 4 donné (comme Mes clients)", r.enCours4.total === 18 && L(r.enCours4, "questionnaire").pts === 8 && L(r.enCours4, "questionnaire").max === 30 && L(r.enCours4, "questionnaire").lbl === "Questionnaire en cours (4/10 réponses)" && r.enCours4.rep === 4 && r.enCours4r.total === 18, JSON.stringify([r.enCours4, r.enCours4r.total]));
    ok("questionnaire en cours 9/10 : 28/100 (18 points) ; 10/10 sans validation : 30/100 (20 au plus tant qu'il n'est pas validé)", r.enCours9.total === 28 && L(r.enCours9, "questionnaire").pts === 18 && r.enCours10.total === 30 && L(r.enCours10, "questionnaire").pts === 20, JSON.stringify([r.enCours9.total, r.enCours10.total]));
    ok("questionnaire validé : 40/100, « Questionnaire rempli » 30", r.rempli.total === 40 && L(r.rempli, "questionnaire").pts === 30 && L(r.rempli, "questionnaire").lbl === "Questionnaire rempli", JSON.stringify(r.rempli));
    ok("questionnaire + 2 clics « Réserver » : 70/100, « Clic « Réserver mon bilan » (2 fois) » 30 (compté une fois)", r.rempliClic.total === 70 && L(r.rempliClic, "clic").pts === 30 && L(r.rempliClic, "clic").lbl === "Clic « Réserver mon bilan » (2 fois)", JSON.stringify(r.rempliClic));
    ok("questionnaire + clic + bilan réservé : 100/100 sans aucun bonus", r.complet.total === 100 && r.complet.somme === 100 && L(r.complet, "reserve").pts === 30, JSON.stringify(r.complet));
    ok("tout + 3 jours d'activité + 10 min + email ouvert : 115 points, plafonné à 100 ; libellés « Revenu plusieurs jours (3 jours d'activité) », « Temps passé dans l'app (10 min) », « Email ouvert (1 email de suivi envoyé) »", r.plafond.total === 100 && r.plafond.somme === 115 && L(r.plafond, "visites").pts === 5 && L(r.plafond, "temps").pts === 5 && L(r.plafond, "emails").pts === 5 && L(r.plafond, "visites").lbl === "Revenu plusieurs jours (3 jours d'activité)" && L(r.plafond, "temps").lbl === "Temps passé dans l'app (10 min)" && L(r.plafond, "emails").lbl === "Email ouvert (1 email de suivi envoyé)", JSON.stringify(r.plafond));
    ok("bilan réservé seul (ni questionnaire ni clic) : 40/100", r.reserveSeule.total === 40 && L(r.reserveSeule, "reserve").pts === 30 && L(r.reserveSeule, "clic").pts === 0 && L(r.reserveSeule, "questionnaire").pts === 0, JSON.stringify(r.reserveSeule));
    ok("clic « Réserver mon bilan » seul (ni questionnaire ni réservation) : 40/100, « Clic « Réserver mon bilan » (1 fois) » 30, questionnaire 0, réservé 0 (le clic compte même sans questionnaire)", r.clicSeul.total === 40 && L(r.clicSeul, "clic").pts === 30 && L(r.clicSeul, "clic").lbl === "Clic « Réserver mon bilan » (1 fois)" && L(r.clicSeul, "questionnaire").pts === 0 && L(r.clicSeul, "reserve").pts === 0, JSON.stringify(r.clicSeul));
    ok("bonus sous les seuils : 1 seul jour (même noté deux fois), 299 s, email envoyé non ouvert → 40/100, « (1 jour d'activité) », « (4 min) », « Email ouvert (1 email de suivi envoyé) » 0", r.bonusBas.total === 40 && L(r.bonusBas, "visites").pts === 0 && L(r.bonusBas, "temps").pts === 0 && L(r.bonusBas, "emails").pts === 0 && L(r.bonusBas, "visites").lbl === "Revenu plusieurs jours (1 jour d'activité)" && L(r.bonusBas, "temps").lbl === "Temps passé dans l'app (4 min)" && L(r.bonusBas, "emails").lbl === "Email ouvert (1 email de suivi envoyé)", JSON.stringify(r.bonusBas));
    ok("bonus aux seuils : 2 jours, 300 s → +5 +5 = 50/100 ; 2 emails non ouverts → « Email ouvert (2 emails de suivi envoyés) » 0", r.bonusHaut.total === 50 && L(r.bonusHaut, "visites").pts === 5 && L(r.bonusHaut, "temps").pts === 5 && L(r.bonusHaut, "temps").lbl === "Temps passé dans l'app (5 min)" && L(r.bonusHaut, "emails").pts === 0 && L(r.bonusHaut, "emails").lbl === "Email ouvert (2 emails de suivi envoyés)", JSON.stringify(r.bonusHaut));
    ok("email ouvert (journal présent) : questionnaire rempli 40 + 5 = 45/100", r.emailLu.total === 45 && L(r.emailLu, "emails").pts === 5 && L(r.emailLu, "emails").bonus === true && L(r.emailLu, "emails").nm === false, JSON.stringify(r.emailLu));
    ok("sans journal (table emails_prospects absente) : 40/100, « Email ouvert (pas encore mesuré : emails non branchés) », non mesuré, 0 ; les autres bonus comptent (50/100)", r.sansJournal.total === 40 && L(r.sansJournal, "emails").nm === true && L(r.sansJournal, "emails").pts === 0 && L(r.sansJournal, "emails").lbl === "Email ouvert (pas encore mesuré : emails non branchés)" && r.sansJournalBonus.total === 50 && L(r.sansJournalBonus, "emails").nm === true, JSON.stringify([r.sansJournal, r.sansJournalBonus.total]));
    ok("données piégées (repondues 99, court_le nombre, case objet, clics texte, activité illisible, emails piégés) : rien ne tombe, 30/100 (10 + 20 au plus, aucun bonus)", r.piege.total === 30 && L(r.piege, "questionnaire").pts === 20 && L(r.piege, "clic").pts === 0 && L(r.piege, "reserve").pts === 0 && L(r.piege, "visites").pts === 0 && L(r.piege, "temps").pts === 0 && L(r.piege, "emails").pts === 0, JSON.stringify(r.piege));
    ok("repondues négatif : 10/100 ; repondues NaN : recompté sur les réponses (1 → 2 points), 12/100", r.piegeNeg.total === 10 && r.piegeNaN.total === 12, JSON.stringify([r.piegeNeg.total, r.piegeNaN.total]));
    ok("pastille du score : 70 → ok, 69 et 40 → accent, 39 → neutre ; texte « N/100 »", /class="pastille ok"[^>]*>70\/100</.test(r.pastilles[0]) && /class="pastille accent"[^>]*>69\/100</.test(r.pastilles[1]) && /class="pastille accent"[^>]*>40\/100</.test(r.pastilles[2]) && /class="pastille"[^>]*>39\/100</.test(r.pastilles[3]), JSON.stringify(r.pastilles));
    ok("pastille du statut : NOUVEAU accent, CHAUD chaud, TIÈDE tiede, FROID froid ; l'info-bulle (raisons) est échappée", /class="pastille accent"[^>]*>NOUVEAU</.test(r.etats[0]) && /class="pastille chaud"[^>]*>CHAUD</.test(r.etats[1]) && /class="pastille tiede"[^>]*>TIÈDE</.test(r.etats[2]) && /class="pastille froid"[^>]*>FROID</.test(r.etats[3]) && r.etats.every(x => x.includes("&lt;b&gt;") && !x.includes("<b>")), JSON.stringify(r.etats));
  });

  /* ---------- C. Mes clients, fiche (suivi commercial et score), tableau de bord ---------- */
  await bloc("C. Mes clients, fiche, tableau de bord", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2400);
    const L = {}; for (const k of [1, 2, 5, 6, 7, 9, 12, 14]) L[k] = await ligneClient(page, PID(k));
    const lt = await ligneClient(page, F.IDS.c1);
    /* v52 (Chantier 1, lot D) : pastille « Découverte · inscrit depuis n j » (avant : « Découverte J n/7 » / « Découverte terminée ») */
    ok("Mes clients : Chloé « Découverte · inscrit depuis 5 j » + « bilan réservé » + CHAUD ; Hugo « … 4 j » + « a cliqué Réserver » + TIÈDE (pas CHAUD) ; Nora « … 9 j » + « bilan réservé » + CHAUD ; Gabriel « bilan réservé » + CHAUD", contient(L[1], ["Découverte · inscrit depuis 5 j", "bilan réservé", "CHAUD"]) && contient(L[2], ["Découverte · inscrit depuis 4 j", "a cliqué Réserver", "TIÈDE"]) && !L[2].includes("CHAUD") && !L[2].includes("bilan réservé") && contient(L[7], ["Découverte · inscrit depuis 9 j", "bilan réservé", "CHAUD"]) && contient(L[14], ["bilan réservé", "CHAUD"]), [L[1], L[2], L[7], L[14]].join(" | ").slice(0, 700));
    const j9 = jourDe(creeDe(db, 9));
    ok("Mes clients : Marc « Découverte · inscrit depuis 5 j » FROID, Lina « … 3 j » FROID, Paul « … " + (j9 - 1) + " j » FROID, Emma NOUVEAU ; Thomas (client) aucune pastille de découverte ni de statut", contient(L[6], ["Découverte · inscrit depuis 5 j", "FROID"]) && contient(L[5], ["Découverte · inscrit depuis 3 j", "FROID"]) && contient(L[9], ["Découverte · inscrit depuis " + (j9 - 1) + " j", "FROID"]) && L[12].includes("NOUVEAU") && !/CHAUD|TIÈDE|FROID|NOUVEAU|Découverte/.test(lt) && lt.includes("Thomas"), [L[6], L[5], L[9], L[12], lt].join(" | ").slice(0, 700));
    await page.click(`[data-ouvrir="${PID(6)}"]`); await attendre(page, 2000);
    let t = await texte(page, "#fiche-commercial");
    ok("fiche de Marc : bloc « Suivi commercial » FROID, raison « Aucune action depuis 4 jours (découverte jour 6/7). », prochaine action, boutons (sans « Ouvrir la fiche »)", contient(t, ["Suivi commercial", "FROID", "Aucune action depuis 4 jours (découverte jour 6/7).", "Relance douce en DM"]) && !!(await page.$('#fiche-commercial [data-sc="relance"]')) && !(await page.$('#fiche-commercial [data-sc="fiche"]')), t.slice(0, 300));
    const tdc = await texte(page, "#fiche-decouverte");
    ok("fiche de Marc : bloc « Découverte » (inscrit depuis 5 j — v52 ; avant : jour 6 / 7 —, questionnaire rempli le …, motivation 6 / 10, jamais cliqué, case pas cochée)", contient(tdc, ["Découverte", "inscrit depuis 5 j", "rempli le", "6 / 10", "jamais cliqué", "pas cochée"]), tdc.slice(0, 400));
    const ls6 = await lignesScore(page), ps6 = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    const attendu6 = [["Inscription", "10 / 10"], ["Questionnaire rempli", "30 / 30"], ["Clic « Réserver mon bilan »", "0 / 30"], ["Bilan réservé", "0 / 30"], ["Revenu plusieurs jours (0 jour d'activité) (bonus)", "0 / 5"], ["Temps passé dans l'app (0 min) (bonus)", "0 / 5"], ["Email ouvert (0 email de suivi envoyé) (bonus)", "0 / 5"]];
    ok("fiche de Marc : « Score de qualification » 40/100, détail ligne par ligne (inscription 10 / 10, questionnaire rempli 30 / 30, clic 0 / 30, réservé 0 / 30, bonus 0 / 5, email 0 / 5 avec journal présent)", ps6 === "40/100" && JSON.stringify(ls6.map(x => x.map(norm))) === JSON.stringify(attendu6), ps6 + " | " + JSON.stringify(ls6));
    await page.fill("#nc-texte", "À rappeler lundi").catch(() => {});
    await page.click('#fiche-commercial [data-sc="relance"]'); await attendre(page, 2000);
    t = await texte(page, "#fiche-commercial");
    ok("fiche : « J'ai relancé » redessine le bloc seul (attends sa réponse, historique « Relance — » daté), la note en cours de frappe reste dans le champ", t.includes("attends sa réponse") && t.includes("Historique") && /Relance — \d{2}\/\d{2}\/\d{4}/.test(t) && (await page.$eval("#nc-texte", e => e.value).catch(() => "")) === "À rappeler lundi" && ((suiviDe(db, 6) || {}).relances || []).length === 1, t.slice(0, 200));
    await attendre(page, 1500);
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(1)}"]`).catch(() => {}); await attendre(page, 2000);
    const tc = await texte(page, "#fiche-commercial"), tcd = await texte(page, "#fiche-decouverte");
    ok("fiche de Chloé : CHAUD « Prépare le bilan », bloc « Découverte » « 1 clic » et « cochée le … »", contient(tc, ["CHAUD", "Prépare le bilan"]) && contient(tcd, ["bilan réservé", "1 clic", "cochée le"]), (tc + " | " + tcd).slice(0, 400));
    const ls1 = (await lignesScore(page)).map(x => x.map(norm)), ps1 = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    const v1 = lbl => (ls1.find(x => x[0] === lbl) || [])[1];
    ok("fiche de Chloé : score 100/100 (115 points plafonnés) : questionnaire 30 / 30, « Clic « Réserver mon bilan » (1 fois) » 30 / 30, réservé 30 / 30, « Revenu plusieurs jours (3 jours d'activité) (bonus) » 5 / 5, « Temps passé dans l'app (15 min) (bonus) » 5 / 5, « Email ouvert (1 email de suivi envoyé) (bonus) » 5 / 5, « Total plafonné à 100 »", ps1 === "100/100" && v1("Questionnaire rempli") === "30 / 30" && v1("Clic « Réserver mon bilan » (1 fois)") === "30 / 30" && v1("Bilan réservé") === "30 / 30" && v1("Revenu plusieurs jours (3 jours d'activité) (bonus)") === "5 / 5" && v1("Temps passé dans l'app (15 min) (bonus)") === "5 / 5" && v1("Email ouvert (1 email de suivi envoyé) (bonus)") === "5 / 5" && (await texte(page, "#fiche-score")).includes("Total plafonné à 100"), ps1 + " | " + JSON.stringify(ls1));
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(13)}"]`).catch(() => {}); await attendre(page, 2000);
    const tf = await texte(page, "#fiche-commercial"), ls13 = (await lignesScore(page)).map(x => x.map(norm)), ps13 = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    ok("fiche de Félix (questionnaire commencé, 4 réponses sur 10) : FROID « DM de bienvenue », score 18/100, « Questionnaire en cours (4/10 réponses) » 8 / 30", contient(tf, ["FROID", "DM de bienvenue"]) && ps13 === "18/100" && (ls13.find(x => x[0] === "Questionnaire en cours (4/10 réponses)") || [])[1] === "8 / 30", ps13 + " | " + JSON.stringify(ls13) + " | " + tf.slice(0, 200));
    await aller(page, "#/tableau", 2400);
    const tuile = await page.$('#tb-vue a.tile[href="#/prospects"]');
    const tt = tuile ? norm(await tuile.textContent()) : "";
    const val = tuile ? norm(await tuile.$eval(".t-val", e => e.textContent)).trim() : "", sub = tuile ? norm(await tuile.$eval(".t-sub", e => e.textContent)).trim() : "";
    ok("tableau de bord : tuile « Prospects en découverte » = 12 (Nora, Omar, Yanis ont fini leurs 7 jours), « 4 chauds · 15 prospects au total », vers #/prospects", tt.includes("Prospects en découverte") && val === "12" && sub === "4 chauds · 15 prospects au total", tt);
    const tbP = await pastilles(page);
    ok("tableau de bord : section « Prospects à traiter » (4 au plus, Chloé en tête, CHAUD)", tbP.length === 4 && (await page.$eval("#tb-prospects .sc-carte .sc-nom b", e => e.textContent).catch(() => "")) === "Chloé" && tbP[0].etat === "CHAUD", await texte(page, "#tb-prospects"));
    ok("tableau de bord : les cartes « Prospects à traiter » portent aussi le score (Chloé 100/100)", tbP.length === 4 && tbP[0].score === "100/100" && tbP.every(x => /^\d+\/100$/.test(x.score)), JSON.stringify(tbP.map(x => x.score)));
  });
  await bloc("C. sans journal des emails", async () => {
    /* la table emails_prospects n'existe pas encore (migration pas appliquée) : le bonus « email ouvert » n'est pas mesuré */
    const db = base(); db.sansJournal = true;
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2600);
    await filtre(page, "tous");
    const P = await pastilles(page), sc = k => (P.find(y => y.uid === PID(k)) || {}).score;
    /* seule Inès change (50 → 45) : Chloé, dont l'email a aussi été ouvert, reste plafonnée à 100 ; la moyenne arrondie ne
       bouge pas (638 / 15 = 42,5 contre 643 / 15 = 42,9), d'où la somme des 15 scores, elle discriminante */
    const autres = Object.keys(ATTENDU).filter(k => k !== "3" && sc(k) !== ATTENDU[k][2] + "/100"), somme = P.reduce((t, x) => t + (parseInt(x.score, 10) || 0), 0);
    ok("sans table emails_prospects (404) : la page s'affiche, Inès 45/100 au lieu de 50 (son email ouvert n'est plus mesuré), les 14 autres scores inchangés (Chloé reste plafonnée à 100), somme des 15 scores 638 au lieu de 643 ; l'en-tête garde « score moyen 43/100 » (arrondi de 42,5)", P.length === 15 && sc(3) === "45/100" && autres.length === 0 && somme === 638 && (await texte(page, "#pr-vue")).includes("score moyen 43/100"), "somme " + somme + " | " + JSON.stringify(P.map(x => x.score)));
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(3)}"]`).catch(() => {}); await attendre(page, 2200);
    const ls = (await lignesScore(page)).map(x => x.map(norm)), ps = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    ok("… fiche d'Inès : 45/100, « Email ouvert (pas encore mesuré : emails non branchés) (bonus) » affiché « — » (pas « 0 / 5 »)", ps === "45/100" && (ls.find(x => x[0] === "Email ouvert (pas encore mesuré : emails non branchés) (bonus)") || [])[1] === "—", ps + " | " + JSON.stringify(ls));
    ok("… la table a bien été demandée (refus 404 absorbé, sans message d'erreur), rien d'écrit", db.urls.some(x => x.indexOf("/rest/v1/emails_prospects") > -1) && db.tentatives.length === 0 && !(await page.$(".modale")), JSON.stringify(db.tentatives));
  });
  await bloc("C. journal de plus de 1 000 emails", async () => {
    /* 1 200 emails anciens (d'anciens prospects, il y a 200 à 80 jours), puis les 3 récents de Chloé, Inès et Sofia :
       1 203 lignes. Le faux PostgREST coupe chaque réponse à 1 000 lignes, comme Supabase (max_rows) : l'app doit lire
       la suite, sinon les emails les plus récents — et leur bonus « email ouvert » — disparaissent sans message */
    const vieux = [];
    for (let i = 0; i < 1200; i++) { const t = new Date(Date.now() - (200 - i / 10) * 86400000).toISOString();
      vieux.push({ user_id: "00000000-0000-4000-8000-1" + String(i).padStart(11, "0"), modele: "bienvenue", statut: "envoye", envoye_le: t, ouvert_le: i % 3 ? null : t, clique_le: null, cree_le: t }); }
    const db = base({ emails: vieux.concat(EMAILS) });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2600);
    await filtre(page, "tous");
    const P = await pastilles(page), sc = k => (P.find(y => y.uid === PID(k)) || {}).score;
    const faux = Object.keys(ATTENDU).filter(k => sc(k) !== ATTENDU[k][2] + "/100");
    const luPage = (db.journalLu || []).slice();
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(3)}"]`).catch(() => {}); await attendre(page, 2200);
    const ls = (await lignesScore(page)).map(x => x.map(norm)), ps = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    ok("journal de 1 203 emails (réponses coupées à 1 000 lignes, comme Supabase) : lu en entier — page Prospects, les 15 scores comme avec un petit journal (Inès 50/100 avec son email ouvert) ; fiche d'Inès 50/100, « Email ouvert (1 email de suivi envoyé) (bonus) » 5 / 5", P.length === 15 && faux.length === 0 && ps === "50/100" && (ls.find(x => x[0] === "Email ouvert (1 email de suivi envoyé) (bonus)") || [])[1] === "5 / 5", "Inès page " + sc(3) + ", fiche " + ps + " " + JSON.stringify(ls.filter(x => /Email/.test(x[0] || ""))) + " | faux " + JSON.stringify(faux.map(k => [k, sc(k)])) + " | lignes par réponse du journal : page " + JSON.stringify(luPage) + ", total " + JSON.stringify(db.journalLu));
    ok("… le scénario coupe bien : la première réponse du journal fait 1 000 lignes pile, aucune n'en dépasse 1 000 ; rien d'écrit", (db.journalLu || [])[0] === 1000 && db.journalLu.every(n => n <= 1000) && db.tentatives.length === 0, JSON.stringify(db.journalLu) + " | " + JSON.stringify(db.tentatives));
  });
  await bloc("C. mobile", async () => {
    const db = base();
    const { page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    ok("page Prospects mobile : cartes affichées, sans défilement horizontal", (await page.$$(".sc-carte")).length > 0 && await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    ok("page Prospects mobile : chaque carte porte ses deux pastilles (score et statut)", (await pastilles(page)).length > 0 && (await pastilles(page)).every(x => x.score && x.etat));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-mobile.png"), fullPage: true });
  });
  await bloc("C. mode test de l'appareil", async () => {
    /* mode test de la découverte resté sur l'appareil du coach (#/decouverte-jour/9) : il ne vaut que pour un prospect
       sur son propre appareil ; les écrans du coach gardent le vrai jour de chaque prospect */
    const db = base();
    const { page } = await contexte(b, coach, db, { local: { mhx_decouverte_jour: "9" } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    const s1 = await sousTitre(page, 1), s9 = await sousTitre(page, 9), j9 = jourDe(creeDe(db, 9));
    /* v52 (lot D) : le sous-titre des cartes ne donne plus le jour (« Découverte · questionnaire … · inscrit … ») */
    ok("mode test de l'appareil (mhx_decouverte_jour = 9) ignoré côté coach : page Prospects, sous-titres « Découverte · … » sans « J n/7 » ni « terminée »", s1.startsWith("Découverte · ") && s9.startsWith("Découverte · ") && !/J\d+\/7|terminée/.test(s1 + s9), s1 + " | " + s9);
    await aller(page, "#/clients", 2200);
    const l1 = await ligneClient(page, PID(1)), l9 = await ligneClient(page, PID(9));
    await aller(page, "#/tableau", 2400);
    const val = norm(await page.$eval('#tb-vue a.tile[href="#/prospects"] .t-val', e => e.textContent).catch(() => "")).trim();
    ok("… Mes clients : Chloé « Découverte · inscrit depuis 5 j », Paul « … " + (j9 - 1) + " j » (le vrai jour, pas celui du mode test) ; tableau de bord : « Prospects en découverte » toujours 12 ; rien d'écrit", l1.includes("Découverte · inscrit depuis 5 j") && l9.includes("Découverte · inscrit depuis " + (j9 - 1) + " j") && !/J\d+\/7|terminée/.test(l1 + l9) && val === "12" && db.tentatives.length === 0, [l1, l9].join(" | ").slice(0, 400) + " | tuile " + val);
  });

  /* ---------- D. Robustesse, prospect, client ---------- */
  await bloc("D. données piégées", async () => {
    /* suivi piege (objets a la place des chaines), cle de decouverte piegee, activite et journal des emails pieges :
       rien ne tombe, aucune issue retenue, aucun point de bonus, rien ne s'execute */
    const piege = "<img src=x onerror=\"window.__xss=1\">";
    const pieges = [
      { k: 20, prenom: "Zoé", inscrit: 1, q: 0, m: 6, suivi: { issue: { toString: 1 }, issue_le: { toString: 1 }, relances: "x", historique: 5, note: { a: 1 } },
        brut: [{ outil: "activite", contenu: { jours: "x", pages: { [piege]: 5, formation: "9" }, temps_s: "99999", derniere: { a: 1 } }, maj_le: instant(0) }] },
      { k: 21, prenom: "Léon", inscrit: 4, brut: [
        { outil: "challenge", contenu: { version: 1, reserve: { a: 1 }, cta: { clics: "x" }, jours: 5 }, maj_le: instant(4) },
        { outil: "intake", contenu: { court_le: 12, motivation: { x: 1 } }, maj_le: instant(4) } ] }
    ];
    const emails = EMAILS.concat([{ user_id: PID(20), modele: piege, statut: { a: 1 }, envoye_le: 5, ouvert_le: 12345, clique_le: [] }, { user_id: PID(20) }, { user_id: 7 }]);
    const db = base({ prospects: PROSPECTS.concat(pieges), emails });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2600);
    await filtre(page, "tous");
    const P = await pastilles(page), z = P.find(y => y.uid === PID(20)) || {};
    ok("suivi piégé : la page s'affiche, Zoé TIÈDE sans issue", (await carte(page, 20)).includes("TIÈDE") && !(await carte(page, 20)).includes("Appel :"), await carte(page, 20));
    ok("clé de découverte et questionnaire piégés : Léon FROID « Inscrit il y a 4 jours, questionnaire pas rempli » (jamais « Questionnaire rempli »), ni case ni clic retenus", contient(await carte(page, 21), ["FROID", "Inscrit il y a 4 jours, questionnaire pas rempli."]) && !(await carte(page, 21)).includes("Réserver mon bilan") && !(await carte(page, 21)).includes("Questionnaire rempli"), await carte(page, 21));
    ok("scores avec données piégées : Zoé 40/100 (activité et emails piégés ne donnent aucun bonus), Léon 10/100", z.score === "40/100" && (P.find(y => y.uid === PID(21)) || {}).score === "10/100", z.score + " | " + (P.find(y => y.uid === PID(21)) || {}).score);
    await aller(page, "#/clients", 2000);
    ok("données piégées : Mes clients s'affiche entière", !!(await page.$(`[data-ouvrir="${PID(20)}"]`)) && !!(await page.$(`[data-ouvrir="${PID(21)}"]`)) && !!(await page.$(`[data-ouvrir="${F.IDS.c1}"]`)));
    await page.click(`[data-ouvrir="${PID(20)}"]`).catch(() => {}); await attendre(page, 2200);
    const ps = norm(await page.$eval("#fiche-score .seance-c-tete .pastille", e => e.textContent).catch(() => ""));
    ok("fiche de Zoé (suivi, activité et emails piégés) : suivi commercial affiché, aucun code du prospect exécuté (window.__xss absent, aucune balise <img src=x> injectée)", !!(await page.$("#fiche-commercial")) && (await page.evaluate(() => window.__xss)) === undefined && !(await page.$('#vue img[src="x"]')));
    ok("… et son bloc « Score de qualification » : 40/100", ps === "40/100", ps);
  });
  await bloc("D. prospect", async () => {
    /* le prospect ne voit jamais son suivi commercial, ne peut pas l'ecrire, ne lit pas le journal des emails */
    const db = base(); db.donnees.push({ user_id: PID(1), outil: "suivi_prospect", contenu: { version: 1, issue: "perdu", note: "prix" }, maj_le: instant(0) });
    const chloe = { id: PID(1), email: "chloe@e.fr", session: F.session(PID(1), "chloe@e.fr") };
    const { page } = await contexte(b, chloe, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2400);
    const refus = await page.evaluate(() => Store.ecrire("suivi_prospect", { issue: "signe" }));
    await attendre(page, 1200);
    const corps = await page.evaluate(() => document.body.innerText);
    ok("prospect : son accueil s'ouvre, « perdu » et « prix » n'apparaissent nulle part, Store.ecrire refuse la clé, aucune écriture, aucune requête ne nomme suivi_prospect ni emails_prospects, pas de score affiché", !db.urls.some(x => x.indexOf("suivi_prospect") > -1 || x.indexOf("emails_prospects") > -1) && !!(await page.$("#acc-vue, #dc-vue")) && !/perdu|prix/i.test(corps) && !/\d+\/100\b/.test(corps) && refus === false && db.ecritures.length === 0 && db.tentatives.length === 0, JSON.stringify({ refus, ecritures: db.tentatives.map(e => e.outil || e.table), mot: (corps.match(/.{0,40}(perdu|prix|\d+\/100).{0,40}/i) || [""])[0] }));
  });
  await bloc("D. client", async () => {
    const db = base();
    const { page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    ok("client : accueil, pas d'onglet Prospects, aucune écriture, aucune lecture du journal des emails", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="prospects"]')) && db.ecritures.length === 0 && db.tentatives.length === 0 && !db.urls.some(x => x.indexOf("emails_prospects") > -1), JSON.stringify(db.tentatives));
    await aller(page, "#/prospects", 1500);
    ok("client : #/prospects ne montre pas la page coach", !(await page.$("#pr-vue")));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
