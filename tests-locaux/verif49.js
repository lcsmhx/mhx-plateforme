/* v49 — P0 suivi commercial : température CHAUD / TIÈDE / FROID calculée à partir du funnel, raisons,
   prochaine action, issue de l'appel (Signé / Perdu / Absent) et relances notées par le coach dans la clé
   coach-seul « suivi_prospect » (écriture conditionnelle, conflit rejoué), page « Prospects », bloc de la
   fiche, tableau de bord, Mes clients ; données piégées ; prospect, client et coach inchangés.
   Supabase simulé (règles de la base comprises pour suivi_prospect) : rien ne part vers la vraie base.
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

/* un prospect : id, prénom, inscrit il y a n jours, challenge (jours faits, réponses), activité il y a a jours */
const PID = k => "00000000-0000-4000-8000-0000000000" + String(k).padStart(2, "0");
function challenge(nb, opts){
  opts = opts || {};
  const j = {}; for (let n = 1; n <= nb; n++) j[String(n)] = { fait: ilYA(nb - n + (opts.decalage || 0)) + "T08:00:00.000Z", date: ilYA(nb - n + (opts.decalage || 0)) };
  if (opts.etat6 && j["6"]) j["6"].etat = opts.etat6;
  if (opts.reserve && j["7"]) j["7"].reserve = instant(0);
  return { version: 1, debut: ilYA(nb - 1 + (opts.decalage || 0)), jours: j, cta: { clics: opts.clics || [] }, termine: nb >= 7 ? instant(0) : null };
}
const PROSPECTS = [
  { k: 1, prenom: "Chloé", inscrit: 8, ch: challenge(7, { reserve: true, clics: [{ jour: 7, date: instant(0) }] }), actif: 0 },
  { k: 2, prenom: "Hugo", inscrit: 7, ch: challenge(6, { etat6: "avancer" }), actif: 0 },
  { k: 3, prenom: "Inès", inscrit: 6, ch: challenge(5, { clics: [{ jour: 5, date: instant(1) }] }), actif: 1 },
  { k: 4, prenom: "Karim", inscrit: 9, ch: challenge(3, { decalage: 5 }), actif: 5 },
  { k: 5, prenom: "Lina", inscrit: 3, ch: null, actif: null },
  { k: 6, prenom: "Marc", inscrit: 7, ch: challenge(6, { etat6: "pas_maintenant" }), actif: 0 },
  { k: 7, prenom: "Nora", inscrit: 2, ch: challenge(2), actif: 0 },
  { k: 8, prenom: "Omar", inscrit: 7, ch: challenge(6, { etat6: "hesite" }), actif: 0 }
];
function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)); profils.forEach(p => { p.statut = "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  (opts.prospects || PROSPECTS).forEach(x => {
    profils.push({ id: PID(x.k), prenom: x.prenom, nom: "", role: "client", statut: "prospect", cree_le: instant(x.inscrit) });
    if (x.ch) donnees.push({ user_id: PID(x.k), outil: "challenge", contenu: x.ch, maj_le: instant(x.actif == null ? x.inscrit : x.actif) });
    if (x.suivi) donnees.push({ user_id: PID(x.k), outil: "suivi_prospect", contenu: x.suivi, maj_le: instant(0) });
  });
  return { profils, donnees, ecritures: [], conflit: 0 };
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
          /* un autre onglet ecrit juste avant nous : la ligne bouge, notre PATCH conditionnel ne touche rien */
          db.conflit--; const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq);
          if (row) { row.contenu = Object.assign({}, row.contenu, { relances: (row.contenu.relances || []).concat(instant(0)) }); row.maj_le = new Date(Date.now() - 5000).toISOString(); }
          return json([]);
        }
        const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj === "is.null" ? !x.maj_le : mj ? x.maj_le === decodeURIComponent(mj.slice(3)) : true));
        if (!row) return json([]);
        row.contenu = corps.contenu; row.maj_le = corps.maj_le;
        db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: corps.contenu });
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
  await c.addInitScript(({ s }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }, { s: who ? who.session : null });
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

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Page Prospects : températures, raisons, prochaine action ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    const t = await texte(page, "#pr-vue");
    ok("page Prospects : 8 comptes gratuits, 3 chauds, 2 tièdes, 3 froids (Thomas, client, absent)", t.includes("8 comptes gratuits") && t.includes("3 chauds, 2 tièdes, 3 froids") && !t.includes("Thomas"), t.slice(0, 300));
    const ordre = await page.$$eval(".sc-carte", l => l.map(e => e.querySelector(".sc-nom b").textContent));
    ok("« À traiter » par défaut, dans l'ordre : Chloé (a réservé) puis Hugo et Inès (chauds), puis Omar, Karim, Lina", ordre.join(",") === "Chloé,Hugo,Inès,Omar,Karim,Lina", ordre.join(","));
    ok("Chloé : CHAUD, « A coché « J'ai réservé mon appel » aujourd'hui », « Prépare l'appel »", (await carte(page, 1)).includes("CHAUD") && (await carte(page, 1)).includes("A coché « J'ai réservé mon appel » aujourd'hui") && (await carte(page, 1)).includes("Prépare l'appel"), await carte(page, 1));
    ok("Hugo : CHAUD, « Je veux avancer avec un accompagnement », « Envoie-lui le lien de réservation en DM aujourd'hui »", (await carte(page, 2)).includes("CHAUD") && (await carte(page, 2)).includes("Je veux avancer avec un accompagnement") && (await carte(page, 2)).includes("Envoie-lui le lien de réservation en DM aujourd'hui"));
    ok("Inès : CHAUD, « A cliqué « Réserver mon appel » (1 fois), la dernière hier »", (await carte(page, 3)).includes("CHAUD") && (await carte(page, 3)).includes("(1 fois), la dernière hier"), await carte(page, 3));
    ok("Karim : FROID, « Inactif depuis 5 jours, arrêté au jour 4 », « Relance douce en DM : son jour 4 l'attend »", (await carte(page, 4)).includes("FROID") && (await carte(page, 4)).includes("Inactif depuis 5 jours, arrêté au jour 4") && (await carte(page, 4)).includes("son jour 4 l'attend"), await carte(page, 4));
    ok("Lina : FROID, « Inscrit il y a 3 jours, challenge pas commencé », « DM de bienvenue »", (await carte(page, 5)).includes("FROID") && (await carte(page, 5)).includes("Inscrit il y a 3 jours, challenge pas commencé") && (await carte(page, 5)).includes("DM de bienvenue"), await carte(page, 5));
    ok("Omar : TIÈDE, « J'hésite encore », « DM : demande-lui ce qui le fait hésiter »", (await carte(page, 8)).includes("TIÈDE") && (await carte(page, 8)).includes("J'hésite encore") && (await carte(page, 8)).includes("ce qui le fait hésiter"));
    await page.click('[data-filtre="tous"]'); await attendre(page, 800);
    ok("« Tous » : Marc FROID « Ne pas insister : relance dans 30 jours », Nora TIÈDE « Rien à faire aujourd'hui : il avance (2/7) »", (await carte(page, 6)).includes("FROID") && (await carte(page, 6)).includes("Ne pas insister : relance dans 30 jours") && (await carte(page, 7)).includes("TIÈDE") && (await carte(page, 7)).includes("Rien à faire aujourd'hui : il avance (2/7)"), (await carte(page, 6)) + " | " + (await carte(page, 7)));
    await page.click('[data-filtre="chaud"]'); await attendre(page, 800);
    ok("filtre « Chauds » : Chloé, Hugo, Inès seulement", (await page.$$(".sc-carte")).length === 3);
    ok("rien n'a été écrit en consultant", db.ecritures.length === 0);
    await c.close();
  }

  /* ---------- B. Actions : relance, Perdu (motif), Absent, Signé puis Passer client, Annuler ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 4, "relance"); await attendre(page, 1800);
    let S = suiviDe(db, 4);
    ok("« J'ai relancé » (Karim) : suivi_prospect créé (1 relance datée), Karim sort de « À traiter » (l'écriture du coach ne compte pas comme activité du prospect)", !!S && Array.isArray(S.relances) && S.relances.length === 1 && S.version === 1 && !(await page.$(`.sc-carte[data-uid="${PID(4)}"]`)), JSON.stringify(S));
    await page.click('[data-filtre="tous"]'); await attendre(page, 800);
    ok("Karim après relance : toujours FROID, « Relancé aujourd'hui : attends sa réponse. », « 1 relance »", (await carte(page, 4)).includes("FROID") && (await carte(page, 4)).includes("Relancé aujourd'hui : attends sa réponse.") && (await carte(page, 4)).includes("1 relance"), await carte(page, 4));
    await cliquer(page, 2, "perdu"); await attendre(page, 500);
    await page.fill(".modale input", "prix"); await bouton(page, "Perdu"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Perdu » (Hugo) avec le motif « prix » : issue perdu datée, carte PERDU « Relance prévue dans 30 jours »", !!S && S.issue === "perdu" && S.note === "prix" && /^\d{4}-/.test(S.issue_le) && (await carte(page, 2)).includes("PERDU") && (await carte(page, 2)).includes("Relance prévue dans 30 jours") && (await carte(page, 2)).includes("prix"), JSON.stringify(S) + " | " + await carte(page, 2));
    await cliquer(page, 1, "absent"); await attendre(page, 500); await bouton(page, "Absent"); await attendre(page, 1800);
    ok("« Absent » (Chloé) : issue absent, « Absent à l'appel : repropose-lui un créneau en DM. »", (suiviDe(db, 1) || {}).issue === "absent" && (await carte(page, 1)).includes("ABSENT") && (await carte(page, 1)).includes("repropose-lui un créneau"), await carte(page, 1));
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1500); await bouton(page, "Plus tard"); await attendre(page, 1800);
    ok("« Signé » (Inès) puis « Plus tard » : issue signe, toujours prospect, carte SIGNÉ avec « Passer client »", (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect" && (await carte(page, 3)).includes("SIGNÉ") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
    await cliquer(page, 3, "client"); await attendre(page, 500); await bouton(page, "Passer client"); await attendre(page, 2200);
    ok("« Passer client » (Inès) : statut client en base, Inès quitte la liste des prospects, tuile « Signés » à 1", db.profils.find(p => p.id === PID(3)).statut === "client" && !(await page.$(`.sc-carte[data-uid="${PID(3)}"]`)) && /Signés\s*1/.test(await texte(page, "#pr-vue .tiles")), await texte(page, "#pr-vue .tiles"));
    await cliquer(page, 2, "annuler"); await attendre(page, 500); await bouton(page, "Retirer l'issue"); await attendre(page, 1800);
    S = suiviDe(db, 2);
    ok("« Annuler « Perdu » » (Hugo) : issue retirée (historique gardé), Hugo redevient CHAUD", !!S && !S.issue && Array.isArray(S.historique) && S.historique.length === 2 && (await carte(page, 2)).includes("CHAUD"), JSON.stringify(S));
    ok("toutes les écritures sont des suivi_prospect (et un passage client), aucune autre clé touchée", db.ecritures.every(e => (e.table === "donnees" && e.outil === "suivi_prospect") || (e.table === "profils" && e.m === "PATCH")), JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-desktop.png"), fullPage: true });
    await c.close();
  }
  {
    /* conflit : un autre onglet ecrit le suivi entre notre lecture et notre ecriture → relecture, rien de perdu */
    const db = base(); db.conflit = 1;
    db.donnees.push({ user_id: PID(4), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: instant(9) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 4, "relance"); await attendre(page, 2200);
    const S = suiviDe(db, 4);
    ok("conflit d'écriture (autre onglet) : relu et rejoué, les 3 relances sont gardées (la nôtre en plus)", !!S && S.relances.length === 3, JSON.stringify(S));
    await c.close();
  }

  {
    /* « Signé » puis le passage en client echoue (504) : l'issue est bien la, la carte montre SIGNÉ, le message le dit */
    const db = base(); db.echecClient = true;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 3, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1800); await bouton(page, "Passer client"); await attendre(page, 1800);
    const alerte = await texte(page, ".modale");
    ok("« Signé » puis passage en client en échec : « « Signé » est bien enregistré, mais le passage en client a échoué (erreur 504 du serveur) », un seul « Réessaie », l'issue est en base, statut toujours prospect", alerte.includes("« Signé » est bien enregistré") && alerte.includes("(erreur 504 du serveur)") && (alerte.match(/Réessaie/g) || []).length === 1 && (suiviDe(db, 3) || {}).issue === "signe" && db.profils.find(p => p.id === PID(3)).statut === "prospect", alerte.slice(0, 200));
    await bouton(page, "OK"); await attendre(page, 1500);
    await page.click('[data-filtre="tous"]').catch(() => {}); await attendre(page, 800);
    ok("… la carte d'Inès montre SIGNÉ avec « Passer client » (pas CHAUD)", (await carte(page, 3)).includes("SIGNÉ") && !!(await page.$(`.sc-carte[data-uid="${PID(3)}"] [data-sc="client"]`)), await carte(page, 3));
    await c.close();
  }
  {
    /* course a la creation : la ligne existe deja quand notre lecture la croit absente → 409 → relue → modifiee, rien de perdu */
    const db = base(); db.cacheLigne = 1;
    db.donnees.push({ user_id: PID(4), outil: "suivi_prospect", contenu: { version: 1, relances: [instant(9)] }, maj_le: instant(9) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await cliquer(page, 4, "relance"); await attendre(page, 2200);
    ok("création en course (409) : relue puis modifiée, les 2 relances sont gardées", (suiviDe(db, 4) || {}).relances.length === 2, JSON.stringify(suiviDe(db, 4)));
    await c.close();
  }
  {
    /* etats qui vieillissent et cas limites, calcules par la vraie fonction */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const res2 = await page.evaluate(({ ch6, ch7, iso }) => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const a = (P, C, S, act) => Commercial.analyse(P, C, S, act);
      const vieux = a(p(200), null, { relances: [J(40), J(30), J(20), J(10), J(5)] }, null);
      const avancer = a(p(30), Object.assign({}, ch6, { jours: Object.assign({}, ch6.jours, { "6": { fait: J(20), date: J(20).slice(0, 10), etat: "avancer" } }) }), {}, J(20));
      const fini = a(p(70), ch7, {}, J(60));
      const perdu = a(p(60), ch6, { issue: "perdu", issue_le: J(40), relances: [J(5)] }, J(41));
      const revenu = a(p(60), Object.assign({}, ch6, { cta: { clics: [{ jour: 6, date: J(1) }] } }), { issue: "perdu", issue_le: J(10) }, J(1));
      const nouveau = a(p(0), null, {}, null);
      const diag = a(p(3), null, {}, J(0));
      return { vieux: [vieux.urgent, vieux.action, vieux.etat], avancer: [avancer.etat, avancer.urgent, avancer.raisons.join(" ")], fini: [fini.etat, fini.action], perdu: [perdu.etat, perdu.urgent, perdu.action], revenu: [revenu.etat, revenu.raisons.join(" ")], nouveau: nouveau.action, diag: [diag.etat, diag.action] };
    }, { ch6: challenge(6), ch7: challenge(7) });
    ok("inscrit il y a 200 jours, jamais commencé, 5 relances sans réponse : plus à traiter, « Sans réponse après 5 relances : classe-le « Perdu » »", res2.vieux[0] === false && res2.vieux[1].includes("Sans réponse après 5 relances") && res2.vieux[2] === "froid", JSON.stringify(res2.vieux));
    ok("« Je veux avancer » il y a 20 jours, inactif depuis : n'est plus CHAUD (FROID, raison « sans suite depuis »)", res2.avancer[0] === "froid" && res2.avancer[2].includes("sans suite depuis"), JSON.stringify(res2.avancer));
    ok("challenge terminé il y a 60 jours sans suite : FROID, « propose-lui l'appel »", res2.fini[0] === "froid" && res2.fini[1].includes("propose-lui l'appel"), JSON.stringify(res2.fini));
    ok("« Perdu » il y a 40 jours et déjà relancé après : plus à traiter (« s'il ne répond pas, laisse-le »)", res2.perdu[0] === "perdu" && res2.perdu[1] === false && res2.perdu[2].includes("laisse-le"), JSON.stringify(res2.perdu));
    ok("« Perdu » puis il reclique « Réserver » hier : redevient CHAUD (« Revenu après l'issue « Perdu » »)", res2.revenu[0] === "chaud" && res2.revenu[1].includes("Revenu après l'issue « Perdu »"), JSON.stringify(res2.revenu));
    ok("nouvel inscrit du jour : « Rien à faire aujourd'hui : il vient de s'inscrire »", res2.nouveau === "Rien à faire aujourd'hui : il vient de s'inscrire.", res2.nouveau);
    ok("inscrit il y a 3 jours qui remplit son diagnostic aujourd'hui : pas FROID, « il a commencé son diagnostic »", res2.diag[0] === "tiede" && res2.diag[1].includes("il a commencé son diagnostic"), JSON.stringify(res2.diag));
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
    /* verrou par prospect : pendant une ecriture lente sur Karim, un second clic sur Karim est ignore AVEC un mot ; Lina reste possible */
    const db = base(); db.lentEcriture = 2500;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(4));
    await attendre(page, 200);
    await page.evaluate(k => { const b = document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`); b.disabled = false; b.click(); }, PID(4));
    await attendre(page, 300);
    const t1 = await texte(page, "#toasts");
    await page.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PID(5));
    await attendre(page, 7000);
    ok("verrou par prospect : second clic sur Karim ignoré avec « Une action est en cours pour Karim », une seule relance ; Lina relancée en parallèle", t1.includes("Une action est en cours pour Karim") && (suiviDe(db, 4) || {}).relances.length === 1 && (suiviDe(db, 5) || {}).relances.length === 1, t1 + " | " + JSON.stringify([suiviDe(db, 4), suiviDe(db, 5)].map(x => x && x.relances && x.relances.length)));
    await c.close();
  }
  {
    /* second tour de relecture : cas limites par la vraie fonction */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2200);
    const r3 = await page.evaluate(({ ch6, ch7 }) => {
      const J = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      const p = n => ({ statut: "prospect", cree_le: J(n) });
      const a = (P, C, S, act) => Commercial.analyse(P, C, S, act);
      const ancien = a(p(200), ch7, { issue: "signe", issue_le: J(120), client_le: J(119) }, J(100));
      const vieuxClic = a(p(90), Object.assign({}, ch6, { cta: { clics: [{ jour: 6, date: J(10) }] } }), { issue: "perdu", issue_le: J(60) }, J(10));
      const avancerEpuise = a(p(16), Object.assign({}, ch6, { jours: Object.assign({}, ch6.jours, { "6": { fait: J(9), date: J(9).slice(0, 10), etat: "avancer" } }) }), { relances: [J(8), J(7), J(6)] }, J(9));
      const futur = a(p(20), ch6, { relances: [J(8), J(7), J(6)] }, new Date(Date.now() + 5 * 86400000).toISOString());
      const reserveVieux = Object.assign({}, ch7); reserveVieux.jours = Object.assign({}, ch7.jours, { "7": Object.assign({}, ch7.jours["7"], { reserve: J(45) }) });
      const rv = a(p(60), reserveVieux, {}, J(45));
      const oublie = a(p(80), ch7, { issue: "signe", issue_le: J(31) }, J(31));
      const resigne = a(p(300), ch7, { issue: "signe", issue_le: J(0), client_le: J(200) }, J(0));
      const reserveAvant = Object.assign({}, ch7); reserveAvant.jours = Object.assign({}, ch7.jours, { "7": Object.assign({}, ch7.jours["7"], { reserve: J(200) }) });
      const ancienCase = a(p(260), reserveAvant, { issue: "signe", issue_le: J(199), client_le: J(198) }, J(150));
      return { ancien: [ancien.etat, ancien.urgent, ancien.raisons.join(" "), ancien.action], vieuxClic: vieuxClic.etat, avancerEpuise: [avancerEpuise.etat, avancerEpuise.action], futur: [futur.etat, futur.action], rv: rv.action, oublie: [oublie.etat, oublie.urgent, oublie.action], resigne: [resigne.etat, resigne.urgent, resigne.action], ancienCase: [ancienCase.etat, ancienCase.urgent, ancienCase.action] };
    }, { ch6: challenge(6), ch7: challenge(7) });
    ok("ancien client redevenu prospect : plus « SIGNÉ », action propre non urgente « Ancien client redevenu prospect », raison « Ancien client »", r3.ancien[0] !== "signe" && r3.ancien[1] === false && r3.ancien[3].includes("Ancien client redevenu prospect") && r3.ancien[2].includes("Ancien client"), JSON.stringify(r3.ancien));
    ok("clic « Réserver » 50 jours après « Perdu » (10 jours avant aujourd'hui) : reste PERDU (le retour doit être récent)", r3.vieuxClic === "perdu", r3.vieuxClic);
    ok("« Je veux avancer » récent mais 3 relances sans réponse : plus CHAUD, « classe-le « Perdu » »", r3.avancerEpuise[0] === "froid" && r3.avancerEpuise[1].includes("classe-le « Perdu »"), JSON.stringify(r3.avancerEpuise));
    ok("activité datée dans le futur (horloge du prospect en avance) : les relances comptent quand même (« Sans réponse après 3 relances »)", r3.futur[1].includes("Sans réponse après 3 relances"), JSON.stringify(r3.futur));
    ok("« J'ai réservé » il y a 45 jours sans issue : « l'appel a-t-il eu lieu ? »", r3.rv.includes("l'appel a-t-il eu lieu"), r3.rv);
    ok("« Signé » il y a 31 jours, jamais passé client : reste SIGNÉ, rappel non urgent « passe-le client, ou retire l'issue s'il a arrêté »", r3.oublie[0] === "signe" && r3.oublie[1] === false && r3.oublie[2].includes("passe-le client, ou retire l'issue"), JSON.stringify(r3.oublie));
    ok("ancien client dont la case « J'ai réservé » date d'avant sa signature : action « Ancien client… », non urgente (la vieille case ne compte plus)", r3.ancienCase[1] === false && r3.ancienCase[2].includes("Ancien client redevenu prospect"), JSON.stringify(r3.ancienCase));
    ok("ancien client revenu et re-signé aujourd'hui : SIGNÉ, « Passe-le client » (son ancien passage n'annule pas la nouvelle signature)", r3.resigne[0] === "signe" && r3.resigne[1] === true && r3.resigne[2].includes("Passe-le client"), JSON.stringify(r3.resigne));
    await c.close();
  }

  /* ---------- C. Fiche, tableau de bord, Mes clients ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2400);
    const ligne = k => page.$eval(`[data-ouvrir="${PID(k)}"]`, x => x.closest("tr").textContent).then(norm).catch(() => "");
    ok("Mes clients : la ligne de Chloé porte CHAUD, celle de Karim FROID, celle de Nora TIÈDE ; Thomas (client) aucune", (await ligne(1)).includes("CHAUD") && (await ligne(4)).includes("FROID") && (await ligne(7)).includes("TIÈDE") && !/CHAUD|TIÈDE|FROID/.test(await page.$eval(`[data-ouvrir="${F.IDS.c1}"]`, x => x.closest("tr").textContent).catch(() => "")));
    await page.click(`[data-ouvrir="${PID(4)}"]`); await attendre(page, 2000);
    let t = await texte(page, "#fiche-commercial");
    ok("fiche de Karim : bloc « Suivi commercial » FROID, raison, prochaine action, boutons", t.includes("Suivi commercial") && t.includes("FROID") && t.includes("Inactif depuis 5 jours") && t.includes("Relance douce en DM") && !!(await page.$('#fiche-commercial [data-sc="relance"]')) && !(await page.$('#fiche-commercial [data-sc="fiche"]')), t.slice(0, 300));
    await page.fill("#nc-texte", "À rappeler lundi").catch(() => {});
    await page.click('#fiche-commercial [data-sc="relance"]'); await attendre(page, 2000);
    t = await texte(page, "#fiche-commercial");
    ok("fiche : « J'ai relancé » redessine le bloc seul (attends sa réponse, historique « Relance — » daté), la note en cours de frappe reste dans le champ", t.includes("attends sa réponse") && t.includes("Historique") && /Relance — \d{2}\/\d{2}\/\d{4}/.test(t) && (await page.$eval("#nc-texte", e => e.value).catch(() => "")) === "À rappeler lundi" && (suiviDe(db, 4) || {}).relances.length === 1, t.slice(0, 200));
    await attendre(page, 1500);
    await aller(page, "#/tableau", 2400);
    const tb = await texte(page, "#tb-vue");
    ok("tableau de bord : tuile Prospects « 3 chauds » vers #/prospects, section « Prospects à traiter » (4 au plus, Chloé en tête)", tb.includes("3 chauds") && !!(await page.$('#tb-vue a.tile[href="#/prospects"]')) && (await page.$$("#tb-prospects .sc-carte")).length === 4 && (await page.$eval("#tb-prospects .sc-carte .sc-nom b", e => e.textContent).catch(() => "")) === "Chloé", tb.slice(0, 400));
    await c.close();
  }
  {
    /* mobile */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    ok("page Prospects mobile : sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "coach-prospects-mobile.png"), fullPage: true });
    await c.close();
  }

  /* ---------- D. Robustesse, prospect, client ---------- */
  {
    /* suivi piege (objets a la place des chaines) : rien ne tombe, aucune issue retenue */
    const piege = [{ k: 9, prenom: "Paul", inscrit: 2, ch: challenge(1), actif: 0, suivi: { issue: { toString: 1 }, issue_le: { toString: 1 }, relances: "x", historique: 5, note: { a: 1 } } }];
    const db = base({ prospects: PROSPECTS.concat(piege) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await attendre(page, 2400);
    await page.click('[data-filtre="tous"]'); await attendre(page, 800);
    ok("suivi piégé : la page s'affiche, Paul TIÈDE sans issue", (await carte(page, 9)).includes("TIÈDE") && !(await carte(page, 9)).includes("Appel :"), await carte(page, 9));
    await aller(page, "#/clients", 2000);
    ok("suivi piégé : Mes clients s'affiche entière", !!(await page.$(`[data-ouvrir="${PID(9)}"]`)) && !!(await page.$(`[data-ouvrir="${F.IDS.c1}"]`)));
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
    ok("prospect : son accueil s'ouvre, « perdu » et « prix » n'apparaissent nulle part, Store.ecrire refuse la clé, aucune écriture, aucune requête ne nomme suivi_prospect", !db.urls.some(x => x.indexOf("suivi_prospect") > -1) && !!(await page.$("#acc-vue")) && !/perdu|prix/i.test(await page.evaluate(() => document.body.innerText)) && refus === false && db.ecritures.length === 0);
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    ok("client : accueil, pas d'onglet Prospects, aucune écriture", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="prospects"]')) && db.ecritures.length === 0);
    await aller(page, "#/prospects", 1500);
    ok("client : #/prospects ne montre pas la page coach", !(await page.$("#pr-vue")));
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
