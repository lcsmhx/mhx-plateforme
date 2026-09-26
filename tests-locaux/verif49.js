/* v49 (Découverte) — suivi commercial des prospects : température CHAUD / TIÈDE / FROID calculée à partir du
   questionnaire court (intake.court_le, motivation), de l'activité du prospect, des clics « Réserver mon bilan »
   (challenge.cta.clics) et de la case « J'ai réservé mon bilan » (challenge.reserve, ou jours["7"].reserve d'un
   ancien prospect du Challenge 7 jours) ; raisons, prochaine action, issue de l'appel (Signé / Perdu / Absent) et
   relances notées par le coach dans la clé coach-seul « suivi_prospect » (écriture conditionnelle, conflit rejoué),
   page « Prospects », bloc de la fiche, tableau de bord, Mes clients ; les anciens choix du jour 6 du Challenge ne
   comptent plus ; le mode test de la découverte (#/decouverte-jour/N) ne touche jamais les écrans du coach ;
   données piégées ; prospect et client inchangés.
   Toutes les dates sont relatives à aujourd'hui. Supabase simulé (règles de la base comprises pour suivi_prospect) :
   rien ne part vers la vraie base.
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
const norm = t => String(t || "").replace(/[  ]/g, " ");
const COACH_SEUL = ["notes_coach", "suivi_prospect"];

/* ---------- les prospects (tout est relatif à aujourd'hui) ----------
   inscrit = jours depuis l'inscription ; q = questionnaire court validé il y a q jours (motivation m) ;
   clics = il y a combien de jours chaque clic « Réserver mon bilan » ; reserve = case « J'ai réservé mon bilan »
   cochée il y a r jours ; ancien = ancien prospect du Challenge 7 jours (case du jour 7 cochée il y a « ancien » jours,
   diagnostic sans court_le) ; formation = dernière case de Speed Formation il y a f jours ; suivi = suivi_prospect */
const PID = k => "00000000-0000-4000-8000-0000000000" + String(k).padStart(2, "0");
const intakeCourt = (q, m) => ({ sexe: "Femme", age: 31, taille: 168, poids: 72, objectif: "Perte de poids / sèche", seances: "3",
  essaye: "Des régimes trop stricts", obstacle: "Le manque de temps", pourquoi: "Me sentir mieux cet été", motivation: String(m), court_le: instant(q) });
function cleDecouverte(x){
  const C = { version: 1, jours: {}, cta: { clics: (x.clics || []).map(n => ({ jour: x.inscrit - n + 1, source: "decouverte", date: instant(n) })) } };
  if (x.reserve != null) C.reserve = instant(x.reserve);
  return C;
}
function cleAncienChallenge(x){
  const j = {}; for (let n = 1; n <= 7; n++) j[String(n)] = { fait: ilYA(x.inscrit - n + 1) + "T08:00:00.000Z", date: ilYA(x.inscrit - n + 1) };
  j["7"].reserve = instant(x.ancien);
  return { version: 1, debut: ilYA(x.inscrit), jours: j, cta: { clics: [] }, termine: instant(x.ancien) };
}
const PROSPECTS = [
  { k: 1, prenom: "Chloé", inscrit: 5, q: 4, m: 7, clics: [5], reserve: 0 },            // CHAUD par la case seule (cochée aujourd'hui ; son clic date de 5 jours)
  { k: 2, prenom: "Hugo", inscrit: 4, q: 4, m: 6, clics: [1] },                         // CHAUD : clic hier
  { k: 3, prenom: "Inès", inscrit: 2, q: 2, m: 9, formation: 0 },                       // TIÈDE : questionnaire rempli, motivation 9
  { k: 4, prenom: "Karim", inscrit: 6, q: 6, m: 5, clics: [5], formation: 3 },          // TIÈDE : clic il y a 5 jours
  { k: 5, prenom: "Lina", inscrit: 3 },                                                 // FROID : questionnaire pas rempli, 3 jours
  { k: 6, prenom: "Marc", inscrit: 5, q: 4, m: 6 },                                     // FROID : rien depuis le questionnaire (4 jours)
  { k: 7, prenom: "Nora", inscrit: 9, ancien: 2 },                                      // CHAUD : ancien prospect du challenge, jour 7 coché
  { k: 8, prenom: "Omar", inscrit: 8, q: 8, m: 6, reserve: 1,                           // CHAUD : revenu après « Perdu » (case cochée après l'issue)
    suivi: { version: 1, issue: "perdu", issue_le: instant(3), note: "timing", historique: [{ type: "issue", valeur: "perdu", le: instant(3), note: "timing" }] } },
  { k: 9, prenom: "Paul", inscrit: 1 },                                                 // TIÈDE : vient de s'inscrire
  { k: 10, prenom: "Sofia", inscrit: 1, q: 1, m: 6, formation: 0 },                     // TIÈDE : découvre, rien à faire
  { k: 11, prenom: "Yanis", inscrit: 10, q: 10, m: 7, formation: 8 }                    // FROID : découverte terminée, plus rien depuis 8 jours
];
function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)); profils.forEach(p => { p.statut = "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  (opts.prospects || PROSPECTS).forEach(x => {
    const uid = PID(x.k);
    profils.push({ id: uid, prenom: x.prenom, nom: "", role: "client", statut: "prospect", cree_le: instant(x.inscrit) });
    if (x.q != null) donnees.push({ user_id: uid, outil: "intake", contenu: intakeCourt(x.q, x.m), maj_le: instant(x.q) });
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
    if (x.brut) x.brut.forEach(r => donnees.push(Object.assign({ user_id: uid }, r)));
    if (x.suivi) donnees.push({ user_id: uid, outil: "suivi_prospect", contenu: x.suivi, maj_le: instant(0) });
  });
  return { profils, donnees, ecritures: [], tentatives: [], conflit: 0 };
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
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
const suiviDe = (db, k) => (db.donnees.find(x => x.user_id === PID(k) && x.outil === "suivi_prospect") || {}).contenu || null;
const cliquer = (page, k, act) => page.click(`.sc-carte[data-uid="${PID(k)}"] [data-sc="${act}"]`).catch(() => {});
const bouton = (page, txt) => page.click(`.modale button:has-text("${txt}")`).catch(() => {});
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`).catch(() => {}); await attendre(page, 800); };
const contient = (t, l) => l.every(x => t.includes(x));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Page Prospects : températures, raisons, prochaine action ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    const t = await texte(page, "#pr-vue");
    ok("page Prospects : « 11 comptes gratuits · 4 chauds, 4 tièdes, 3 froids » (Thomas, client, absent ; l'issue « Perdu » d'Omar ne compte plus)", t.includes("11 comptes gratuits · 4 chauds, 4 tièdes, 3 froids.") && !t.includes("avec une issue d'appel") && !t.includes("Thomas"), t.slice(0, 300));
    ok("légende : CHAUD = case « J'ai réservé mon bilan » ou clic « Réserver mon bilan » ces 3 derniers jours ; FROID = questionnaire pas rempli 3 jours après l'inscription, 4 jours sans activité après, ou 3 relances sans réponse", t.includes("CHAUD : a coché « J'ai réservé mon bilan » ou a cliqué « Réserver mon bilan » ces 3 derniers jours") && t.includes("questionnaire pas rempli 3 jours après l'inscription") && t.includes("plus d'activité 4 jours après le questionnaire") && t.includes("ou 3 relances sans réponse"), t.slice(-500));
    const ordre = await page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent));
    ok("« À traiter » par défaut, dans l'ordre : cases cochées (Chloé, Omar, Nora, la plus récente d'abord), clic (Hugo), tièdes à relancer (Inès, Karim), froids (Marc, Yanis, Lina) ; Paul et Sofia absents", ordre.join(",") === "Chloé,Omar,Nora,Hugo,Inès,Karim,Marc,Yanis,Lina", ordre.join(","));
    ok("tuile « À traiter » : 9", /À traiter\s*9/.test(await texte(page, "#pr-vue .tiles")), await texte(page, "#pr-vue .tiles"));
    let k1 = await carte(page, 1);
    ok("Chloé (case cochée aujourd'hui, son seul clic date de 5 jours) : CHAUD par la case seule, « A coché « J'ai réservé mon bilan » aujourd'hui », clic « il y a 5 jours, sans réserver », « Prépare le bilan : relis sa fiche (questionnaire, obstacle, motivation) », « Découverte J6/7 · questionnaire rempli · inscrit il y a 5 jours »", contient(k1, ["CHAUD", "A coché « J'ai réservé mon bilan » aujourd'hui.", "A cliqué « Réserver mon bilan » il y a 5 jours, sans réserver.", "Prépare le bilan : relis sa fiche (questionnaire, obstacle, motivation).", "Découverte J6/7 · questionnaire rempli · inscrit il y a 5 jours"]) && !k1.includes("fois), la dernière"), k1);
    const k2 = await carte(page, 2);
    ok("Hugo (clic hier) : CHAUD, « A cliqué « Réserver mon bilan » (1 fois), la dernière hier », « Envoie-lui le lien de réservation en DM aujourd'hui »", contient(k2, ["CHAUD", "A cliqué « Réserver mon bilan » (1 fois), la dernière hier.", "Envoie-lui le lien de réservation en DM aujourd'hui."]), k2);
    const k3 = await carte(page, 3);
    ok("Inès (questionnaire rempli, motivation 9) : TIÈDE, « Questionnaire rempli il y a 2 jours, motivation 9/10, découverte jour 3/7 », « DM : il se dit motivé à 9/10, propose-lui le bilan »", contient(k3, ["TIÈDE", "Questionnaire rempli il y a 2 jours, motivation 9/10, découverte jour 3/7.", "DM : il se dit motivé à 9/10, propose-lui le bilan."]) && !k3.includes("CHAUD"), k3);
    const k4 = await carte(page, 4);
    ok("Karim (clic il y a 5 jours) : TIÈDE, « A cliqué « Réserver mon bilan » il y a 5 jours, sans réserver », « DM : il a cliqué sans réserver, demande-lui ce qui le retient »", contient(k4, ["TIÈDE", "A cliqué « Réserver mon bilan » il y a 5 jours, sans réserver.", "DM : il a cliqué sans réserver, demande-lui ce qui le retient."]), k4);
    const k5 = await carte(page, 5);
    ok("Lina (3 jours, questionnaire pas rempli) : FROID, « Inscrit il y a 3 jours, questionnaire pas rempli », « DM de bienvenue : aide-le à remplir son questionnaire (3 minutes) »", contient(k5, ["FROID", "Inscrit il y a 3 jours, questionnaire pas rempli.", "DM de bienvenue : aide-le à remplir son questionnaire (3 minutes).", "questionnaire à remplir"]) && !k5.includes("Questionnaire rempli"), k5);
    const k6 = await carte(page, 6);
    ok("Marc (rien depuis le questionnaire il y a 4 jours) : FROID, « Questionnaire rempli, plus d'activité depuis 4 jours (découverte jour 6/7) », « Relance douce en DM : demande-lui où il en est »", contient(k6, ["FROID", "Questionnaire rempli, plus d'activité depuis 4 jours (découverte jour 6/7).", "Relance douce en DM : demande-lui où il en est."]), k6);
    const k7 = await carte(page, 7);
    ok("Nora (ancienne prospecte du challenge, jour 7 « J'ai réservé » coché) : CHAUD, « A coché « J'ai réservé mon bilan » il y a 2 jours », « Prépare le bilan », « Découverte terminée · questionnaire à remplir »", contient(k7, ["CHAUD", "A coché « J'ai réservé mon bilan » il y a 2 jours.", "Prépare le bilan", "Découverte terminée · questionnaire à remplir"]), k7);
    const k8 = await carte(page, 8);
    ok("Omar (« Perdu » il y a 3 jours, puis case cochée hier) : CHAUD, « Revenu après l'issue « Perdu » », « Prépare le bilan », boutons Signé / Perdu / Absent (plus d'« Annuler »)", contient(k8, ["CHAUD", "Revenu après l'issue « Perdu »", "A coché « J'ai réservé mon bilan » hier.", "Prépare le bilan"]) && !k8.includes("PERDU") && !!(await page.$(`.sc-carte[data-uid="${PID(8)}"] [data-sc="signe"]`)) && !(await page.$(`.sc-carte[data-uid="${PID(8)}"] [data-sc="annuler"]`)), k8);
    const k11 = await carte(page, 11);
    ok("Yanis (découverte terminée, plus rien depuis 8 jours) : FROID, « plus d'activité depuis 8 jours (découverte terminée) », « Relance : sa découverte est terminée, propose-lui le bilan »", contient(k11, ["FROID", "Questionnaire rempli, plus d'activité depuis 8 jours (découverte terminée).", "Relance : sa découverte est terminée, propose-lui le bilan."]), k11);
    await filtre(page, "tous");
    const k9 = await carte(page, 9), k10 = await carte(page, 10);
    ok("« Tous » : Paul TIÈDE « Vient de s'inscrire (hier) », « Rien à faire aujourd'hui : il vient de s'inscrire » ; Sofia TIÈDE « Rien à faire aujourd'hui : il découvre (jour 2/7) »", contient(k9, ["TIÈDE", "Vient de s'inscrire (hier).", "Rien à faire aujourd'hui : il vient de s'inscrire."]) && contient(k10, ["TIÈDE", "motivation 6/10", "Rien à faire aujourd'hui : il découvre (jour 2/7)."]) && (await page.$$(".sc-carte")).length === 11, k9 + " | " + k10);
    await filtre(page, "chaud");
    const chauds = await page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent));
    ok("filtre « Chauds » : Chloé, Omar, Nora, Hugo seulement", chauds.join(",") === "Chloé,Omar,Nora,Hugo", chauds.join(","));
    await filtre(page, "froid");
    const froids = await page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent).sort());
    ok("filtre « Froids » : Lina, Marc, Yanis seulement", froids.join(",") === "Lina,Marc,Yanis", froids.join(","));
    await filtre(page, "tiede");
    const tiedes = await page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent).sort());
    ok("filtre « Tièdes » : Inès, Karim, Paul, Sofia seulement", tiedes.join(",") === "Inès,Karim,Paul,Sofia", tiedes.join(","));
    ok("rien n'a été écrit en consultant (aucune demande d'écriture, même sans effet)", db.ecritures.length === 0 && db.tentatives.length === 0, JSON.stringify(db.tentatives));
    await c.close();
  }

  /* ---------- B. Actions : relance, Perdu (motif), Absent, Signé puis Passer client, Annuler ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 6, "relance"); await attendre(page, 1800);
    let S = suiviDe(db, 6);
    ok("« J'ai relancé » (Marc) : suivi_prospect créé (1 relance datée), Marc sort de « À traiter » (l'écriture du coach ne compte pas comme activité du prospect)", !!S && Array.isArray(S.relances) && S.relances.length === 1 && S.version === 1 && !(await page.$(`.sc-carte[data-uid="${PID(6)}"]`)), JSON.stringify(S));
    await filtre(page, "tous");
    ok("Marc après relance : toujours FROID, « Relancé aujourd'hui : attends sa réponse. », « 1 relance »", contient(await carte(page, 6), ["FROID", "Relancé aujourd'hui : attends sa réponse.", "1 relance"]), await carte(page, 6));
    await cliquer(page, 2, "perdu"); await attendre(page, 500);
    await page.fill(".modale input", "prix"); await bouton(page, "Perdu"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Perdu » (Hugo) avec le motif « prix » : issue perdu datée, carte PERDU « Relance prévue dans 30 jours »", !!S && S.issue === "perdu" && S.note === "prix" && /^\d{4}-/.test(S.issue_le) && contient(await carte(page, 2), ["PERDU", "Relance prévue dans 30 jours", "prix"]), JSON.stringify(S) + " | " + await carte(page, 2));
    await cliquer(page, 1, "absent"); await attendre(page, 500); await bouton(page, "Absent"); await attendre(page, 1800);
    ok("« Absent » (Chloé) : issue absent, « Absent à l'appel : repropose-lui un créneau en DM. » (sa case cochée avant l'appel ne la fait pas revenir)", (suiviDe(db, 1) || {}).issue === "absent" && contient(await carte(page, 1), ["ABSENT", "repropose-lui un créneau"]), await carte(page, 1));
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1500); await bouton(page, "Plus tard"); await attendre(page, 1800);
    ok("« Signé » (Inès) puis « Plus tard » : issue signe, toujours prospect, carte SIGNÉ avec « Passer client »", (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect" && (await carte(page, 3)).includes("SIGNÉ") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
    await cliquer(page, 3, "client"); await attendre(page, 500); await bouton(page, "Passer client"); await attendre(page, 2200);
    ok("« Passer client » (Inès) : statut client en base, Inès quitte la liste des prospects, tuile « Signés » à 1", db.profils.find(p => p.id === PID(3)).statut === "client" && !(await page.$(`.sc-carte[data-uid="${PID(3)}"]`)) && /Signés\s*1/.test(await texte(page, "#pr-vue .tiles")), await texte(page, "#pr-vue .tiles"));
    await cliquer(page, 2, "annuler"); await attendre(page, 500); await bouton(page, "Retirer l'issue"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Annuler « Perdu » » (Hugo) : issue retirée (historique gardé), Hugo redevient CHAUD (son clic d'hier)", !!S && !S.issue && Array.isArray(S.historique) && S.historique.length === 2 && (await carte(page, 2)).includes("CHAUD"), JSON.stringify(S) + " | " + await carte(page, 2));
    const patchs = db.ecritures.filter(e => e.table === "donnees" && e.m === "PATCH");
    ok("toutes les demandes d'écriture sont des suivi_prospect (et un passage client), aucune autre clé touchée ; chaque modification d'une ligne existante est conditionnelle (maj_le=eq.…)", db.tentatives.length > 0 && db.tentatives.every(e => (e.table === "donnees" && e.outil === "suivi_prospect") || (e.table === "profils" && e.m === "PATCH")) && patchs.length >= 2 && patchs.every(e => /^eq\.\d{4}-/.test(e.maj_le || "")), JSON.stringify(db.tentatives.map(e => [e.m, e.outil || e.table, e.maj_le])));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-desktop.png"), fullPage: true });
    await c.close();
  }
  {
    /* conflit : un autre onglet ecrit le suivi entre notre lecture et notre ecriture → relecture, rien de perdu */
    const db = base(); db.conflit = 1; const lu = instant(9);
    db.donnees.push({ user_id: PID(6), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: lu });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 6, "relance"); await attendre(page, 2200);
    const S = suiviDe(db, 6);
    ok("conflit d'écriture (autre onglet) : relu et rejoué, les 3 relances sont gardées (la nôtre en plus)", !!S && S.relances.length === 3, JSON.stringify(S));
    const pt = db.tentatives.filter(e => e.table === "donnees" && e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    const pe = db.ecritures.filter(e => e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    ok("… écriture conditionnelle : le premier PATCH porte maj_le=eq.<date lue> et ne touche rien, le PATCH rejoué porte la nouvelle date écrite par l'autre onglet", pt.length === 2 && pt[0].maj_le === "eq." + lu && !!db.majAutreOnglet && pt[1].maj_le === "eq." + db.majAutreOnglet && pe.length === 1 && pe[0].maj_le === "eq." + db.majAutreOnglet, JSON.stringify(pt.map(e => e.maj_le)) + " | autre onglet " + db.majAutreOnglet);
    await c.close();
  }
  {
    /* « Signé » puis le passage en client echoue (504) : l'issue est bien la, la carte montre SIGNÉ, le message le dit */
    const db = base(); db.echecClient = true;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1800); await bouton(page, "Passer client"); await attendre(page, 1800);
    const alerte = await texte(page, ".modale");
    ok("« Signé » puis passage en client en échec : « « Signé » est bien enregistré, mais le passage en client a échoué (erreur 504 du serveur) », un seul « Réessaie », l'issue est en base, statut toujours prospect", alerte.includes("« Signé » est bien enregistré") && alerte.includes("(erreur 504 du serveur)") && (alerte.match(/Réessaie/g) || []).length === 1 && (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect", alerte.slice(0, 200));
    await bouton(page, "OK"); await attendre(page, 1500);
    await filtre(page, "tous");
    ok("… la carte d'Inès montre SIGNÉ avec « Passer client » (pas TIÈDE)", (await carte(page, 3)).includes("SIGNÉ") && !(await carte(page, 3)).includes("TIÈDE") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
    await c.close();
  }
  {
    /* course a la creation : la ligne existe deja quand notre lecture la croit absente → 409 → relue → modifiee, rien de perdu */
    const db = base(); db.cacheLigne = 1; const lu = instant(9);
    db.donnees.push({ user_id: PID(6), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: lu });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    await cliquer(page, 6, "relance"); await attendre(page, 2200);
    ok("création en course (409) : relue puis modifiée, les 2 relances sont gardées", ((suiviDe(db, 6) || {}).relances || []).length === 2, JSON.stringify(suiviDe(db, 6)));
    const pe = db.ecritures.filter(e => e.m === "PATCH" && e.outil === "suivi_prospect" && e.user_id === PID(6));
    ok("… la relance de Marc sur sa ligne existante est un PATCH conditionnel : maj_le=eq.<date lue> (sans condition, l'écriture d'un autre onglet serait écrasée)", pe.length === 1 && pe[0].maj_le === "eq." + lu, JSON.stringify(pe.map(e => e.maj_le)) + " | lu " + lu);
    await c.close();
  }
  {
    /* un client (ancien prospect « Absent ») : sa fiche n'a pas de bloc « Suivi commercial » */
    const db = base(); db.donnees.push({ user_id: F.IDS.c1, outil: "suivi_prospect", contenu: { version: 1, issue: "absent", issue_le: instant(3) }, maj_le: instant(3) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`).catch(() => {}); await attendre(page, 2000);
    ok("fiche d'un client avec un ancien suivi (Absent) : pas de bloc « Suivi commercial »", (await texte(page, "#vue")).includes("Fiche client") && !(await page.$("#fiche-commercial")));
    await c.close();
  }
  {
    /* verrou par prospect : pendant une ecriture lente sur Marc, un second clic sur Marc est ignore AVEC un mot ; Lina reste possible */
    const db = base(); db.lentEcriture = 2500;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(6));
    await attendre(page, 200);
    await page.evaluate(k => { const b = document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`); b.disabled = false; b.click(); }, PID(6));
    await attendre(page, 300);
    const t1 = await texte(page, "#toasts");
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(5));
    await attendre(page, 7000);
    ok("verrou par prospect : second clic sur Marc ignoré avec « Une action est en cours pour Marc », une seule relance ; Lina relancée en parallèle", t1.includes("Une action est en cours pour Marc") && ((suiviDe(db, 6) || {}).relances || []).length === 1 && ((suiviDe(db, 5) || {}).relances || []).length === 1, t1 + " | " + JSON.stringify([suiviDe(db, 6), suiviDe(db, 5)].map(x => x && x.relances && x.relances.length)));
    await c.close();
  }

  /* ---------- B'. Seuils et cas limites, calculés par la vraie fonction Commercial.analyse(p, C, S, activite, D) ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const r = await page.evaluate(() => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const H = h => new Date(Date.now() - h * 3600000).toISOString();
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const Q = (n, m) => ({ court_le: J(n), motivation: String(m) });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(v => ({ jour: 1, source: "decouverte", date: typeof v === "string" ? v : J(v) })) } }; if (o.reserve != null) x.reserve = typeof o.reserve === "string" ? o.reserve : J(o.reserve); return x; };
      const a = (P, Cc, S, act, D) => { const z = Commercial.analyse(P, Cc, S, act, D); return { etat: z.etat, urgent: z.urgent, action: z.action, raisons: z.raisons.join(" "), q: z.questionnaire }; };
      /* ancienne clé du Challenge 7 jours (la vraie base peut encore en contenir) : jours 1 à 6 faits, choix du jour 6 */
      const ancienJ6 = etat => { const j = {}; for (let n = 1; n <= 6; n++) j[String(n)] = { fait: J(8 - n + 1), date: J(8 - n + 1) }; j["6"] = { fait: J(1), date: J(1), etat }; return { version: 1, debut: J(8), jours: j, cta: { clics: [] } }; };
      return {
        clic3: a(p(6), C({ clics: [3] }), {}, J(3), Q(6, 5)),
        clic4: a(p(6), C({ clics: [4] }), {}, J(2), Q(6, 5)),
        act3: a(p(5), null, {}, J(3), Q(5, 6)),
        act4: a(p(5), null, {}, J(4), Q(5, 6)),
        insc2: a(p(2), null, {}, null, null),
        insc3: a(p(3), null, {}, null, null),
        motiv8: a(p(2), null, {}, J(0), Q(2, 8)),
        motiv7: a(p(2), null, {}, J(0), Q(2, 7)),
        brouillon: a(p(5), null, {}, J(0), { sexe: "Homme", age: 40 }),
        brouillon2: a(p(5), null, {}, J(2), {}),
        brouillon3: a(p(5), null, {}, J(3), {}),
        sansQ4: a(p(6), null, {}, J(4), {}),
        avancer6: a(p(8), ancienJ6("avancer"), {}, J(1), null),
        pasMaintenant6: a(p(8), ancienJ6("pas_maintenant"), {}, J(1), Q(8, 6)),
        finieSansQ: a(p(10), null, {}, null, null),
        finieActif: a(p(9), null, {}, J(1), Q(8, 5)),
        nouveau: a(p(0), null, {}, null, null),
        epuise: a(p(10), C({ clics: [H(50)] }), { relances: [H(40), H(30), H(20)] }, H(50), Q(9, 6)),
        epuiseCase: a(p(10), C({ reserve: H(50) }), { relances: [H(40), H(30), H(20)] }, H(50), Q(9, 6)),
        piege: a(p(4), { reserve: { a: 1 }, cta: { clics: "x" } }, {}, J(0), { court_le: 5, motivation: { x: 1 } })
      };
    });
    ok("clic « Réserver mon bilan » il y a 3 jours : encore CHAUD ; il y a 4 jours (actif avant-hier) : TIÈDE « il y a 4 jours, sans réserver »", r.clic3.etat === "chaud" && r.clic4.etat === "tiede" && r.clic4.raisons.includes("A cliqué « Réserver mon bilan » il y a 4 jours, sans réserver."), JSON.stringify([r.clic3, r.clic4]));
    ok("questionnaire rempli, dernière activité il y a 3 jours : TIÈDE ; il y a 4 jours : FROID « plus d'activité depuis 4 jours »", r.act3.etat === "tiede" && r.act4.etat === "froid" && r.act4.raisons.includes("plus d'activité depuis 4 jours"), JSON.stringify([r.act3, r.act4]));
    ok("questionnaire pas rempli : inscrit il y a 2 jours TIÈDE « Vient de s'inscrire (il y a 2 jours) », non urgent ; il y a 3 jours FROID, urgent", r.insc2.etat === "tiede" && r.insc2.urgent === false && r.insc2.raisons.includes("Vient de s'inscrire (il y a 2 jours).") && r.insc3.etat === "froid" && r.insc3.urgent === true, JSON.stringify([r.insc2, r.insc3]));
    ok("motivation 8/10 : « DM : il se dit motivé à 8/10, propose-lui le bilan. » (urgent) ; 7/10 : « Rien à faire aujourd'hui : il découvre (jour 3/7). »", r.motiv8.action === "DM : il se dit motivé à 8/10, propose-lui le bilan." && r.motiv8.urgent === true && r.motiv7.action === "Rien à faire aujourd'hui : il découvre (jour 3/7)." && r.motiv7.urgent === false, JSON.stringify([r.motiv8, r.motiv7]));
    ok("inscrit il y a 5 jours, questionnaire commencé aujourd'hui (brouillon sans court_le) : pas FROID, « Rien à faire aujourd'hui : il est actif, questionnaire pas encore rempli. »", r.brouillon.etat === "tiede" && r.brouillon.q === false && r.brouillon.action === "Rien à faire aujourd'hui : il est actif, questionnaire pas encore rempli." && r.brouillon.raisons.includes("Actif (dernière activité aujourd'hui), questionnaire pas encore rempli."), JSON.stringify(r.brouillon));
    ok("questionnaire pas rempli (inscrit il y a 5 jours), dernière activité il y a 2 jours : TIÈDE « Actif (dernière activité il y a 2 jours), questionnaire pas encore rempli. », « il est actif, questionnaire pas encore rempli » ; il y a 3 jours : FROID « Inscrit il y a 5 jours, questionnaire pas rempli. »", r.brouillon2.etat === "tiede" && r.brouillon2.raisons.includes("Actif (dernière activité il y a 2 jours), questionnaire pas encore rempli.") && r.brouillon2.action === "Rien à faire aujourd'hui : il est actif, questionnaire pas encore rempli." && r.brouillon3.etat === "froid" && r.brouillon3.raisons.includes("Inscrit il y a 5 jours, questionnaire pas rempli.") && !r.brouillon3.raisons.includes("Actif (dernière activité"), JSON.stringify([r.brouillon2, r.brouillon3]));
    ok("questionnaire pas rempli, plus d'activité depuis 4 jours : FROID « Inscrit il y a 6 jours, questionnaire pas rempli. », jamais « Questionnaire rempli, plus d'activité… »", r.sansQ4.etat === "froid" && r.sansQ4.q === false && r.sansQ4.raisons.includes("Inscrit il y a 6 jours, questionnaire pas rempli.") && !r.sansQ4.raisons.includes("Questionnaire rempli"), JSON.stringify(r.sansQ4));
    ok("ancien prospect du Challenge (jours 1 à 6 faits), jour 6 « Je veux avancer » hier, sans clic ni case : pas CHAUD, l'ancien choix du jour 6 n'est plus lu", r.avancer6.etat !== "chaud" && !/Jour 6|avancer/.test(r.avancer6.raisons) && r.avancer6.action !== "Envoie-lui le lien de réservation en DM aujourd'hui.", JSON.stringify(r.avancer6));
    ok("ancien prospect du Challenge, jour 6 « Pas maintenant », questionnaire rempli, actif hier : TIÈDE (pas FROID), sans « Ne pas insister »", r.pasMaintenant6.etat === "tiede" && !r.pasMaintenant6.action.includes("Ne pas insister") && !/Jour 6|Pas maintenant/.test(r.pasMaintenant6.raisons), JSON.stringify(r.pasMaintenant6));
    ok("découverte finie sans questionnaire : FROID, « Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan. »", r.finieSansQ.etat === "froid" && r.finieSansQ.action === "Relance : sa découverte est finie sans questionnaire, propose-lui directement le bilan.", JSON.stringify(r.finieSansQ));
    ok("questionnaire rempli, découverte terminée, encore actif hier : TIÈDE, « DM : sa découverte est terminée, propose-lui le bilan. » (urgent)", r.finieActif.etat === "tiede" && r.finieActif.urgent === true && r.finieActif.action === "DM : sa découverte est terminée, propose-lui le bilan.", JSON.stringify(r.finieActif));
    ok("nouvel inscrit du jour : « Rien à faire aujourd'hui : il vient de s'inscrire. »", r.nouveau.action === "Rien à faire aujourd'hui : il vient de s'inscrire." && r.nouveau.etat === "tiede", JSON.stringify(r.nouveau));
    ok("clic récent mais 3 relances sans réponse depuis : plus CHAUD (FROID, « Relancé 3 fois sans réponse ») ; avec la case « J'ai réservé » : reste CHAUD", r.epuise.etat === "froid" && r.epuise.raisons.includes("Relancé 3 fois sans réponse.") && r.epuiseCase.etat === "chaud", JSON.stringify([r.epuise, r.epuiseCase]));
    ok("clé et questionnaire piégés (case objet, clics texte, court_le nombre, motivation objet) : rien ne tombe, questionnaire non compté, pas CHAUD", !!r.piege && r.piege.q === false && r.piege.etat !== "chaud" && !r.piege.raisons.includes("J'ai réservé"), JSON.stringify(r.piege));
    await c.close();
  }
  {
    /* issues qui vieillissent, retours et anciens clients, calcules par la vraie fonction */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
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
    ok("« Perdu » puis il reclique « Réserver mon bilan » hier : redevient CHAUD (« Revenu après l'issue « Perdu » »)", r.perduClic.etat === "chaud" && r.perduClic.raisons.includes("Revenu après l'issue « Perdu »"), JSON.stringify(r.perduClic));
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
    await c.close();
  }

  /* ---------- C. Mes clients, fiche, tableau de bord ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2400);
    const ligne = k => page.$eval(`[data-ouvrir="${k}"]`, x => x.closest("tr").textContent).then(norm).catch(() => "");
    const L = {}; for (const k of [1, 2, 5, 6, 7, 9]) L[k] = await ligne(PID(k));
    const lt = await ligne(F.IDS.c1);
    ok("Mes clients : Chloé « Découverte J6/7 » + « bilan réservé » + CHAUD ; Hugo « Découverte J5/7 » + « a cliqué Réserver » + CHAUD ; Nora « Découverte terminée » + « bilan réservé » + CHAUD", contient(L[1], ["Découverte J6/7", "bilan réservé", "CHAUD"]) && contient(L[2], ["Découverte J5/7", "a cliqué Réserver", "CHAUD"]) && !L[2].includes("bilan réservé") && contient(L[7], ["Découverte terminée", "bilan réservé", "CHAUD"]), [L[1], L[2], L[7]].join(" | ").slice(0, 600));
    ok("Mes clients : Marc « Découverte J6/7 » FROID, Lina « Découverte J4/7 » FROID, Paul « Découverte J2/7 » TIÈDE ; Thomas (client) aucune pastille de découverte ni de température", contient(L[6], ["Découverte J6/7", "FROID"]) && contient(L[5], ["Découverte J4/7", "FROID"]) && contient(L[9], ["Découverte J2/7", "TIÈDE"]) && !/CHAUD|TIÈDE|FROID|Découverte/.test(lt) && lt.includes("Thomas"), [L[6], L[5], L[9], lt].join(" | ").slice(0, 600));
    await page.click(`[data-ouvrir="${PID(6)}"]`); await attendre(page, 2000);
    let t = await texte(page, "#fiche-commercial");
    ok("fiche de Marc : bloc « Suivi commercial » FROID, raison « plus d'activité depuis 4 jours », prochaine action, boutons (sans « Ouvrir la fiche »)", contient(t, ["Suivi commercial", "FROID", "Questionnaire rempli, plus d'activité depuis 4 jours", "Relance douce en DM"]) && !!(await page.$('#fiche-commercial [data-sc="relance"]')) && !(await page.$('#fiche-commercial [data-sc="fiche"]')), t.slice(0, 300));
    const tdc = await texte(page, "#fiche-decouverte");
    ok("fiche de Marc : bloc « Découverte » (jour 6 / 7, questionnaire rempli le …, motivation 6 / 10, jamais cliqué, case pas cochée)", contient(tdc, ["Découverte", "jour 6 / 7", "rempli le", "6 / 10", "jamais cliqué", "pas cochée"]), tdc.slice(0, 400));
    await page.fill("#nc-texte", "À rappeler lundi").catch(() => {});
    await page.click('#fiche-commercial [data-sc="relance"]'); await attendre(page, 2000);
    t = await texte(page, "#fiche-commercial");
    ok("fiche : « J'ai relancé » redessine le bloc seul (attends sa réponse, historique « Relance — » daté), la note en cours de frappe reste dans le champ", t.includes("attends sa réponse") && t.includes("Historique") && /Relance — \d{2}\/\d{2}\/\d{4}/.test(t) && (await page.$eval("#nc-texte", e => e.value).catch(() => "")) === "À rappeler lundi" && ((suiviDe(db, 6) || {}).relances || []).length === 1, t.slice(0, 200));
    await attendre(page, 1500);
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${PID(1)}"]`).catch(() => {}); await attendre(page, 2000);
    const tc = await texte(page, "#fiche-commercial"), tcd = await texte(page, "#fiche-decouverte");
    ok("fiche de Chloé : CHAUD « Prépare le bilan », bloc « Découverte » « 1 clic » et « cochée le … »", contient(tc, ["CHAUD", "Prépare le bilan"]) && contient(tcd, ["bilan réservé", "1 clic", "cochée le"]), (tc + " | " + tcd).slice(0, 400));
    await aller(page, "#/tableau", 2400);
    const tuile = await page.$('#tb-vue a.tile[href="#/prospects"]');
    const tt = tuile ? norm(await tuile.textContent()) : "";
    const val = tuile ? norm(await tuile.$eval(".t-val", e => e.textContent)).trim() : "", sub = tuile ? norm(await tuile.$eval(".t-sub", e => e.textContent)).trim() : "";
    ok("tableau de bord : tuile « Prospects en découverte » = 8 (Nora, Omar, Yanis ont fini leurs 7 jours), « 4 chauds · 11 prospects au total », vers #/prospects", tt.includes("Prospects en découverte") && val === "8" && sub === "4 chauds · 11 prospects au total", tt);
    ok("tableau de bord : section « Prospects à traiter » (4 au plus, Chloé en tête)", (await page.$$("#tb-prospects .sc-carte")).length === 4 && (await page.$eval("#tb-prospects .sc-carte .sc-nom b", e => e.textContent).catch(() => "")) === "Chloé", await texte(page, "#tb-prospects"));
    await c.close();
  }
  {
    /* mobile */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    ok("page Prospects mobile : cartes affichées, sans défilement horizontal", (await page.$$(".sc-carte")).length > 0 && await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-mobile.png"), fullPage: true });
    await c.close();
  }
  {
    /* mode test de la découverte resté sur l'appareil du coach (#/decouverte-jour/9) : il ne vaut que pour un prospect
       sur son propre appareil ; les écrans du coach gardent le vrai jour de chaque prospect */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { local: { mhx_decouverte_jour: "9" } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    const sous = k => page.$eval(`.sc-carte[data-uid="${PID(k)}"] .sc-nom small`, e => e.textContent).then(norm).catch(() => "");
    const s1 = await sous(1), s9 = await sous(9);
    ok("mode test de l'appareil (mhx_decouverte_jour = 9) ignoré côté coach : page Prospects, Chloé « Découverte J6/7 », Paul « Découverte J2/7 » (pas « Découverte terminée »)", s1.startsWith("Découverte J6/7") && s9.startsWith("Découverte J2/7"), s1 + " | " + s9);
    await aller(page, "#/clients", 2200);
    const ligne = k => page.$eval(`[data-ouvrir="${k}"]`, x => x.closest("tr").textContent).then(norm).catch(() => "");
    const l1 = await ligne(PID(1)), l9 = await ligne(PID(9));
    await aller(page, "#/tableau", 2400);
    const val = norm(await page.$eval('#tb-vue a.tile[href="#/prospects"] .t-val', e => e.textContent).catch(() => "")).trim();
    ok("… Mes clients : Chloé « Découverte J6/7 », Paul « Découverte J2/7 » (pas « Découverte terminée ») ; tableau de bord : « Prospects en découverte » toujours 8 ; rien d'écrit", l1.includes("Découverte J6/7") && l9.includes("Découverte J2/7") && !l9.includes("Découverte terminée") && val === "8" && db.tentatives.length === 0, [l1, l9].join(" | ").slice(0, 400) + " | tuile " + val);
    await c.close();
  }

  /* ---------- D. Robustesse, prospect, client ---------- */
  {
    /* suivi piege (objets a la place des chaines) et cle de decouverte piegee : rien ne tombe, aucune issue retenue */
    const pieges = [
      { k: 12, prenom: "Zoé", inscrit: 1, q: 0, m: 6, suivi: { issue: { toString: 1 }, issue_le: { toString: 1 }, relances: "x", historique: 5, note: { a: 1 } } },
      { k: 13, prenom: "Léon", inscrit: 4, brut: [
        { outil: "challenge", contenu: { version: 1, reserve: { a: 1 }, cta: { clics: "x" }, jours: 5 }, maj_le: instant(4) },
        { outil: "intake", contenu: { court_le: 12, motivation: { x: 1 } }, maj_le: instant(4) } ] }
    ];
    const db = base({ prospects: PROSPECTS.concat(pieges) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await filtre(page, "tous");
    ok("suivi piégé : la page s'affiche, Zoé TIÈDE sans issue", (await carte(page, 12)).includes("TIÈDE") && !(await carte(page, 12)).includes("Appel :"), await carte(page, 12));
    ok("clé de découverte et questionnaire piégés : Léon FROID « Inscrit il y a 4 jours, questionnaire pas rempli » (jamais « Questionnaire rempli », même sans activité depuis 4 jours), ni case ni clic retenus", contient(await carte(page, 13), ["FROID", "Inscrit il y a 4 jours, questionnaire pas rempli."]) && !(await carte(page, 13)).includes("Réserver mon bilan") && !(await carte(page, 13)).includes("Questionnaire rempli"), await carte(page, 13));
    await aller(page, "#/clients", 2000);
    ok("données piégées : Mes clients s'affiche entière", !!(await page.$(`[data-ouvrir="${PID(12)}"]`)) && !!(await page.$(`[data-ouvrir="${PID(13)}"]`)) && !!(await page.$(`[data-ouvrir="${F.IDS.c1}"]`)));
    await c.close();
  }
  {
    /* le prospect ne voit jamais son suivi commercial et ne peut pas l'ecrire */
    const db = base(); db.donnees.push({ user_id: PID(1), outil: "suivi_prospect", contenu: { version: 1, issue: "perdu", note: "prix" }, maj_le: instant(0) });
    const chloe = { id: PID(1), email: "chloe@e.fr", session: F.session(PID(1), "chloe@e.fr") };
    const { c, page } = await contexte(b, chloe, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2400);
    const refus = await page.evaluate(() => Store.ecrire("suivi_prospect", { issue: "signe" }));
    await attendre(page, 1200);
    const corps = await page.evaluate(() => document.body.innerText);
    ok("prospect : son accueil s'ouvre, « perdu » et « prix » n'apparaissent nulle part, Store.ecrire refuse la clé, aucune écriture, aucune requête ne nomme suivi_prospect", !db.urls.some(x => x.indexOf("suivi_prospect") > -1) && !!(await page.$("#acc-vue, #dc-vue")) && !/perdu|prix/i.test(corps) && refus === false && db.ecritures.length === 0 && db.tentatives.length === 0, JSON.stringify({ refus, ecritures: db.tentatives.map(e => e.outil || e.table), mot: (corps.match(/.{0,40}(perdu|prix).{0,40}/i) || [""])[0] }));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    ok("client : accueil, pas d'onglet Prospects, aucune écriture", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="prospects"]')) && db.ecritures.length === 0 && db.tentatives.length === 0, JSON.stringify(db.tentatives));
    await aller(page, "#/prospects", 1500);
    ok("client : #/prospects ne montre pas la page coach", !(await page.$("#pr-vue")));
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
