/* v41 — phase 13 : photos de progression (Supabase Storage simulé).
   Règles simulées comme celles de la base : chacun dépose, lit et retire dans
   son dossier <user_id>/ ; le coach lit tout et n'écrit rien.
   Usage : node verif41.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9672;
const OUT = path.join(__dirname, "captures", "v41"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML)); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
/* dimensions d'un JPEG (marqueur SOF) */
function dimJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) return null;
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
function base() { return { donnees: JSON.parse(JSON.stringify(F.donnees)), fichiers: {}, envois: [], retraits: [], lectures: [], ecritures: [] }; }
async function contexte(b, who, db, opts) {
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  const coach = who.id === F.IDS.coach;
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const url = new URL(u);
    if (url.hostname === "localhost") return r.continue();
    if (!url.hostname.endsWith(".supabase.co")) return r.abort();
    const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
    if (p.startsWith("/auth/v1/")) return json({});
    if (p.startsWith("/storage/v1/object/")) {
      if (opts.sansBucket) return json({ statusCode: "404", error: "Bucket not found", message: "Bucket not found" }, 400);
      const lecture = p.startsWith("/storage/v1/object/authenticated/photos/");
      const chemin = decodeURIComponent(p.replace(lecture ? "/storage/v1/object/authenticated/photos/" : "/storage/v1/object/photos/", ""));
      const dossier = chemin.split("/")[0], sien = dossier === who.id;
      if (m === "GET" && lecture) {
        db.lectures.push(chemin);
        if (!(sien || coach) || !db.fichiers[chemin]) return json({ statusCode: "404", error: "not_found", message: "Object not found" }, 400);
        return r.fulfill({ status: 200, contentType: "image/jpeg", body: db.fichiers[chemin].corps });
      }
      if (m === "POST") {
        if (!sien) return json({ statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" }, 400);
        const corps = req.postDataBuffer();
        db.fichiers[chemin] = { corps, type: req.headers()["content-type"], upsert: req.headers()["x-upsert"] };
        db.envois.push({ chemin, type: req.headers()["content-type"], taille: corps.length, upsert: req.headers()["x-upsert"] });
        return json({ Key: "photos/" + chemin, Id: "x" });
      }
      if (m === "DELETE") {
        if (!sien) return json({ statusCode: "403", error: "Unauthorized", message: "rls" }, 400);
        if (!db.fichiers[chemin]) return json({ statusCode: "404", error: "not_found", message: "Object not found" }, 400);   // comme Storage : 400, vrai code dans le corps
        db.retraits.push(chemin); delete db.fichiers[chemin]; return json([{ name: chemin }]);
      }
      return json({}, 400);
    }
    if (p === "/rest/v1/profils") { const id = q.get("id"); return json(id ? F.profils.filter(x => x.id === id.slice(3)).map(x => Object.assign({ statut: "client" }, x)) : F.profils.map(x => Object.assign({ statut: "client" }, x))); }
    if (p === "/rest/v1/donnees") {
      if (m === "GET" && opts.indexKo && (q.get("outil") || "") === "eq.photos") return r.abort();   // panne reseau simulee
      if (m !== "GET") {
        const rows = JSON.parse(req.postData() || "[]");
        for (const x of (Array.isArray(rows) ? rows : [rows])) {
          db.ecritures.push(x);
          const i = db.donnees.findIndex(y => y.user_id === x.user_id && y.outil === x.outil);
          if (i > -1) db.donnees[i] = Object.assign({}, db.donnees[i], x); else db.donnees.push(x);
        }
        return json(null, 201);
      }
      let l = db.donnees.filter(x => coach || x.user_id === who.id);
      const uid = q.get("user_id"), o = q.get("outil") || "";
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
  await c.addInitScript(({ s, langue }) => { localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who.session, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const sarah = { id: F.IDS.c2, email: "s@e.fr", session: F.session(F.IDS.c2, "s@e.fr") };
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
/* une grande image PNG fabriquée dans la page (3000 x 2000) */
const grandePng = (page) => page.evaluate(async () => {
  const c = document.createElement("canvas"); c.width = 3000; c.height = 2000;
  const x = c.getContext("2d"); x.fillStyle = "#4a7"; x.fillRect(0, 0, 3000, 2000); x.fillStyle = "#e33"; x.fillRect(500, 400, 1200, 900);
  const b = await new Promise(ok => c.toBlob(ok, "image/png"));
  const t = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < t.length; i += 0x8000) s += String.fromCharCode.apply(null, t.subarray(i, i + 0x8000));
  return btoa(s);
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const C1 = F.IDS.c1;

  /* ---------- A. Client : envoyer, comparer, retirer ---------- */
  const db = base();
  {
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await aller(page, "#/mensurations", 1800);
    ok("client : section « Photos de progression » avec 3 vues et la semaine de la dernière mesure", !!(await page.$("#photos-panel")) && (await page.$$("#ph-envoi .ph-vue")).length === 3 && (await page.inputValue("#ph-sem")) === "4");
    ok("client : aucune photo → « Aucune photo pour le moment. »", (await page.textContent("#ph-comparaison")).includes("Aucune photo"));
    const png = Buffer.from(await grandePng(page), "base64");
    await page.setInputFiles('[data-fichier="face"]', { name: "face.png", mimeType: "image/png", buffer: png });
    await attendre(page, 2500);
    const e1 = db.envois[0] || {};
    ok("envoi : chemin <mon id>/s004-face.jpg, JPEG, remplacement autorisé", e1.chemin === C1 + "/s004-face.jpg" && e1.type === "image/jpeg" && e1.upsert === "true", JSON.stringify(e1));
    const dim = e1.chemin ? dimJpeg(db.fichiers[e1.chemin].corps) : null;
    ok("envoi : image réduite (1080 px au plus) et plus légère que l'originale", !!dim && Math.max(dim.w, dim.h) <= 1080 && e1.taille < png.length, JSON.stringify(dim) + " " + e1.taille + " < " + png.length);
    ok("envoi : « Photo enregistrée. » et vignette affichée", (await page.textContent("#ph-msg")).includes("Photo enregistrée") && !!(await page.$('#ph-envoi [data-cadre="face"] img')));
    await attendre(page, 1000);
    const idx = db.donnees.find(x => x.user_id === C1 && x.outil === "photos");
    ok("index : clé « photos » = { liste: [{ semaine: 4, vues: { face } }] }", !!idx && idx.contenu.liste.length === 1 && idx.contenu.liste[0].semaine === 4 && idx.contenu.liste[0].vues.face === C1 + "/s004-face.jpg", JSON.stringify(idx && idx.contenu));
    await page.fill("#ph-sem", "1");  await attendre(page, 400);
    await page.setInputFiles('[data-fichier="face"]', { name: "face.png", mimeType: "image/png", buffer: png });
    await attendre(page, 2500);
    const opts = await page.$$eval("#ph-a option", l => l.map(o => o.value));
    ok("comparaison : semaines 1 et 4 proposées, deux images de face côte à côte", JSON.stringify(opts) === '["1","4"]' && (await page.$$("#ph-comparaison .ph-paire img")).length >= 2, JSON.stringify(opts));
    await page.screenshot({ path: path.join(OUT, "client-photos.png"), fullPage: true });
    await page.fill("#ph-sem", "");  await attendre(page, 300);
    const avant = db.envois.length;
    await page.click('[data-choisir="profil"]'); await attendre(page, 300);
    ok("semaine vide : « Indique la semaine. », rien n'est envoyé", (await page.textContent("#ph-msg")).includes("Indique la semaine") && db.envois.length === avant);
    await page.fill("#ph-sem", "1");  await attendre(page, 400);
    await page.click('[data-retirer="face"]'); await attendre(page, 400);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 300);
    ok("retirer : Annuler = rien n'est retiré", db.retraits.length === 0);
    await page.click('[data-retirer="face"]'); await attendre(page, 400);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1800);
    const idx2 = db.donnees.find(x => x.user_id === C1 && x.outil === "photos");
    ok("retirer : fichier supprimé et semaine 1 sortie de l'index", db.retraits[0] === C1 + "/s001-face.jpg" && idx2.contenu.liste.length === 1 && idx2.contenu.liste[0].semaine === 4, JSON.stringify(idx2.contenu));
    await c.close();
  }
  /* ---------- B. Coach : lecture seule ---------- */
  {
    db.lectures = [];
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.click(`[data-ouvrir="${C1}"]`); await attendre(page, 1500);
    await aller(page, "#/mensurations", 2000);
    ok("coach : photos du client visibles (lecture avec son jeton)", (await page.$$("#ph-comparaison img")).length >= 1);
    ok("coach : aucun bouton d'envoi ni de retrait", !(await page.$("#ph-envoi")) && !(await page.$("[data-retirer]")) && !(await page.$("[data-fichier]")));
    ok("coach : les listes de semaines restent utilisables (fiche en lecture seule)", await page.$eval("#ph-a", el => getComputedStyle(el).pointerEvents !== "none" && !el.disabled));
    ok("coach : la même photo affichée des deux côtés = une seule requête", db.lectures.filter(x => x === C1 + "/s004-face.jpg").length === 1, JSON.stringify(db.lectures));
    await c.close();
  }
  /* ---------- C. Un autre client ne lit pas ces photos ---------- */
  {
    const { c, page } = await contexte(b, sarah, db);
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2000);
    const r = await page.evaluate(async (ch) => { try { await Photos.image(ch); return "lu"; } catch (e) { return "refus"; } }, C1 + "/s004-face.jpg");
    ok("un autre client ne peut pas lire les photos de Thomas", r === "refus");
    await c.close();
  }
  /* ---------- D. Stockage pas encore activé ---------- */
  {
    const db2 = base();
    const { c, page } = await contexte(b, thomas, db2, { sansBucket: true });
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2000);
    const png = Buffer.from(await grandePng(page), "base64");
    await page.setInputFiles('[data-fichier="dos"]', { name: "dos.png", mimeType: "image/png", buffer: png });
    await attendre(page, 2000);
    ok("stockage absent : « Les photos ne sont pas encore activées. », index non modifié", (await page.textContent("#ph-msg")).includes("pas encore activées") && !db2.donnees.some(x => x.outil === "photos"));
    await c.close();
  }
  /* ---------- E. Anglais et mobile ---------- */
  {
    const db3 = base();
    db3.donnees.find(x => x.user_id === C1 && x.outil === "prefs").contenu.langue = "en";
    const { c, page } = await contexte(b, thomas, db3, { langue: "en", viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2200);
    const t = await page.textContent("#photos-panel");
    ok("anglais : « Progress photos », « Front », « Compare »", t.includes("Progress photos") && t.includes("Front") && t.includes("Compare"));
    ok("mobile : pas de défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "client-photos-mobile.png"), fullPage: true });
    await c.close();
  }
  /* ---------- G. Fichier déjà disparu : le retrait aboutit quand même ---------- */
  {
    const db5 = base();
    db5.donnees.push({ user_id: C1, outil: "photos", contenu: { liste: [{ semaine: 2, date: "2026-09-20", vues: { face: C1 + "/s002-face.jpg" } }] }, maj_le: "2026-09-24T10:00:00Z" });
    const { c, page } = await contexte(b, thomas, db5);
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2000);
    await page.fill("#ph-sem", "2"); await attendre(page, 400);
    await page.click('[data-retirer="face"]'); await attendre(page, 400);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1800);
    const idx = db5.donnees.find(x => x.user_id === C1 && x.outil === "photos");
    ok("fichier déjà disparu (Storage : 400 / 404) : « Photo retirée. » et entrée sortie de l'index", (await page.textContent("#ph-msg")).includes("Photo retirée") && idx.contenu.liste.length === 0, JSON.stringify(idx.contenu));
    await c.close();
  }
  /* ---------- H. Index illisible : pas d'envoi possible ---------- */
  {
    const db6 = base();
    const { c, page } = await contexte(b, thomas, db6, { indexKo: true });
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2000);
    ok("index des photos illisible : message, aucun bouton d'envoi", (await page.textContent("#ph-envoi")).includes("recharge la page") && !(await page.$("[data-choisir]")) && !(await page.$("[data-fichier]")));
    await c.close();
  }
  /* ---------- H2. Les mêmes messages en anglais (compte réglé en anglais) ---------- */
  {
    const db7 = base();
    db7.donnees.find(x => x.user_id === C1 && x.outil === "prefs").contenu.langue = "en";
    const { c, page } = await contexte(b, thomas, db7, { indexKo: true, langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2200);
    ok("anglais : index illisible → « Your photos couldn't be loaded… », champ semaine désactivé", (await page.textContent("#ph-envoi")).includes("couldn't be loaded") && await page.$eval("#ph-sem", e => e.disabled));
    await c.close();
  }
  /* ---------- F. Index piégé (écrit par l'API) : seuls les chemins du compte sont suivis ---------- */
  {
    const db4 = base();
    const piege = { liste: [null, { semaine: 2, vues: "abc" }, { semaine: 3, vues: { face: "../../rest/v1/donnees?select=*", profil: F.IDS.c2 + "/s001-profil.jpg", dos: C1 + "/s003-dos.jpg" } }] };
    db4.donnees.push({ user_id: C1, outil: "photos", contenu: piege, maj_le: "2026-09-24T10:00:00Z" });
    db4.fichiers[C1 + "/s003-dos.jpg"] = { corps: Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]) };
    db4.fichiers[F.IDS.c2 + "/s001-profil.jpg"] = { corps: Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]) };
    for (const [qui, nom] of [[thomas, "client"], [coach, "coach"]]) {
      db4.lectures = [];
      const { c, page } = await contexte(b, qui, db4);
      if (qui === coach) {
        await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
        await page.click(`[data-ouvrir="${C1}"]`); await attendre(page, 1500);
        await aller(page, "#/mensurations", 2200);
      } else { await page.goto(`http://localhost:${PORT}/#/mensurations`); await attendre(page, 2200); }
      const opts = await page.$$eval("#ph-a option", l => l.map(o => o.value));
      ok(nom + " : index piégé → seule la semaine 3 est proposée, sans erreur", JSON.stringify(opts) === '["3"]', JSON.stringify(opts));
      ok(nom + " : aucune requête vers un chemin étranger (autre dossier, remontée ../)", db4.lectures.length > 0 && db4.lectures.every(x => x === C1 + "/s003-dos.jpg"), JSON.stringify(db4.lectures));
      await c.close();
    }
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
