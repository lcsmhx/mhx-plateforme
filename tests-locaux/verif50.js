/* v50 — P0 funnel + P1 interface prospect : lien Calendly central (pré-remplissage prénom + email derrière
   un interrupteur, éteint par défaut ; adresse avec ? et #, caractère mal formé), Calendly décrit dans la
   confidentialité (FR / EN) et relisible depuis le profil, navigation du prospect allégée (vitrine : programme,
   nutrition, formation ; mensurations, suivi, compléments cachés mais verrouillés à leur adresse ; vitrine
   absente ou mal réglée ; bouton Plus ; liens de la formation), clics des pages verrouillées comptés, client et
   coach inchangés. Reprend le simulateur de verif47.
   Usage : node verif50.js ../index.html
   (ancien en-tête de verif47 :) v47 — funnel « Challenge 7 jours », finitions : retour du lien de confirmation d'email (entrée
   directe sur le jour 1, lien périmé, déjà connecté), écran « Vérifie ta boîte mail » après
   l'inscription, côté coach : pastille « Challenge n/7 » dans Mes clients, tuile du tableau de bord,
   bloc « Challenge 7 jours » de la fiche (lecture seule), anglais, mobile, client et coach inchangés ;
   après relecture : lien périmé réel (#error=otp_expired), autre compte connecté, panne serveur, lien
   magique d'un client, adresse mal encodée, touche Entrée, messages Supabase en français, prospect piégé,
   ancien prospect passé client.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire.
   Usage : node verif47.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9680;
const OUT = path.join(__dirname, "captures", "v50"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false, prerempli = false;
const server = http.createServer((req, res) => {
  let h = fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
  if (prerempli) h = h.replace("calendly_prerempli: false", "calendly_prerempli: true");
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const CAL = "https://calendly.com/mhx-coaching/30min";
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const AUJ = ilYA(0);
const INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4", pourquoi: "Retrouver de l'énergie." };
const REPONSES = { 2: { erreur: "boire", ressenti: "moyen" }, 3: { tours: 3, ressenti: 4 }, 4: { habitude: "marche", quand: "après le déjeuner", ou: "autour du bureau" }, 5: { interet: "calories" }, 6: { etat: "hesite" } };
const jourFait = (n, quand, extra) => Object.assign({ fait: quand + "T08:00:00.000Z", date: quand }, extra || {});
/* jours 1..k faits, le jour 1 il y a k jours (le jour k+1 est disponible aujourd'hui) */
const chJusqua = (k, clics) => { const j = {}; for (let n = 1; n <= k; n++) j[String(n)] = jourFait(n, ilYA(k - n + 1), REPONSES[n]); return { version: 1, debut: ilYA(k), jours: j, cta: { clics: clics || [] }, termine: null }; };
const chFini = (opts) => { const c = chJusqua(7, (opts || {}).clics); c.termine = ilYA(0) + "T09:00:00.000Z"; if ((opts || {}).reserve) c.jours["7"].reserve = ilYA(0) + "T09:05:00.000Z"; return c; };
const norm = t => String(t || "").replace(/[  ]/g, " ");

function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: "2026-09-24T10:00:00Z" }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.intake !== null) donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake || INTAKE, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.prefs) donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: opts.prefs, maj_le: "2026-09-24T10:00:00+00:00" });
  return { profils, donnees, ecritures: [], inscriptions: [], lienValide: true, confirmation: false, lecturesUser: 0 };
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
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      const id = "00000000-0000-4000-8000-00000000abcd";
      db.profils.push({ id, prenom: (corps.data || {}).prenom, nom: (corps.data || {}).nom, role: "client", statut: "prospect", cree_le: new Date().toISOString() });
      if (db.limite) return json({ code: 429, msg: "email rate limit exceeded" }, 429);
      /* confirmation d'email exigee : Supabase renvoie la personne sans session */
      if (db.confirmation) return json({ id, aud: "authenticated", role: "", email: corps.email, confirmation_sent_at: new Date().toISOString() });
      return json(F.session(id, corps.email));
    }
    if (p === "/auth/v1/user" && m === "GET") {
      db.lecturesUser++;
      const auth = req.headers()["authorization"] || "";
      if (db.lienPanne) return json({ message: "panne simulée" }, 500);
      if (auth === "Bearer jeton.lien.test" && db.lienValide) return json(db.lienUser || { id: PROSPECT, aud: "authenticated", role: "authenticated", email: "l@e.fr", email_confirmed_at: new Date().toISOString() });
      return json({ code: 401, msg: "invalid JWT: token is expired" }, 401);
    }
    if (p.startsWith("/auth/v1/token")) {
      if (db.nonConfirme && q.get("grant_type") === "password") return json({ error: "invalid_grant", error_description: "Email not confirmed" }, 400);
      if (!who && db.connexion && q.get("grant_type") === "password") return json(F.session(PROSPECT, "l@e.fr"));
      return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    }
    if (p.startsWith("/auth/v1/")) return json({});
    /* comme Supabase : 1 000 lignes au plus sans en-tete Range (c'est ce qui rend le test de pagination discriminant) */
    const tranche = l => { const rg = req.headers()["range"]; if (!rg) return l.slice(0, 1000); const [a, z] = rg.split("-").map(Number); return l.slice(a, z + 1); };
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); } const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : tranche(db.profils)); }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => {
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: row.contenu });
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        });
        return json(null, 201);
      }
      let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
      /* qui lit ? le jeton du lien = la prospecte ; sinon la session de depart */
      const auth = req.headers()["authorization"] || "";
      const lecteur = auth === "Bearer jeton.lien.test" ? { id: (db.lienUser || {}).id || PROSPECT } : who;
      if (lecteur && lecteur.id !== F.IDS.coach) l = l.filter(x => x.user_id === lecteur.id && x.outil !== "notes_coach");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(tranche(l));
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, langue }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who ? who.session : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const LIEN = "#access_token=jeton.lien.test&expires_at=1800000000&expires_in=3600&refresh_token=ref-lien&token_type=bearer&type=signup";
const ligneDe = (page, id) => page.$eval(`[data-ouvrir="${id}"]`, b => b.closest("tr").textContent).then(norm).catch(() => "");

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const navIds = page => page.$$eval("#nav a", l => l.map(a => a.dataset.id));
  const PRE = CAL + "?name=L%C3%A9a&first_name=L%C3%A9a&email=l%40e.fr";

  /* ---------- A. Navigation du prospect ---------- */
  {
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
    const ids = await navIds(page);
    ok("prospect : la navigation garde accueil, challenge, programme, nutrition, formation, profil", ["accueil", "challenge", "programme", "nutrition", "formation", "profil"].every(x => ids.includes(x)), JSON.stringify(ids));
    ok("prospect : ma progression, mon suivi et compléments ne sont plus dans la navigation", !["mensurations", "suivi", "complements"].some(x => ids.includes(x)), JSON.stringify(ids));
    ok("prospect : la vitrine garde ses cadenas (programme, nutrition, formation)", (await page.$$eval("#nav a .nav-cadenas", l => l.map(e => e.closest("a").dataset.id))).sort().join(",") === "formation,nutrition,programme");
    for (const r of ["mensurations", "suivi", "complements"]) {
      await aller(page, "#/" + r, 1200);
      ok(`prospect : #/${r} (caché) reste verrouillé à son adresse, avec « Réserver mon appel »`, !!(await page.$("#vue .verrou")) && !!(await page.$(`#vue .verrou a[href="${CAL}"]`)));
    }
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("prospect mobile : barre du bas inchangée (accueil, challenge, profil, programme)", JSON.stringify(barre) === '["accueil","challenge","profil","programme"]', JSON.stringify(barre));
    await page.click("#barre-bas [data-plus]").catch(() => {}); await attendre(page, 500);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => a.dataset.id)).catch(() => []);
    ok("prospect mobile : « Plus » ne propose que nutrition et formation (rien de caché)", JSON.stringify(plus.sort()) === '["formation","nutrition"]', JSON.stringify(plus));
    await page.screenshot({ path: path.join(OUT, "prospect-plus-mobile.png") });
    await c.close();
  }
  {
    /* challenge termine : la formation s'ouvre et reste visible */
    const db = base({ challenge: chFini() });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
    const ids = await navIds(page);
    ok("prospect, challenge terminé : formation visible et ouverte (sans cadenas)", ids.includes("formation") && !(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const ids = await navIds(page);
    ok("client : navigation complète inchangée (programme, nutrition, mensurations, suivi, formation, compléments, profil), aucun cadenas", ["programme", "nutrition", "mensurations", "suivi", "formation", "complements", "profil"].every(x => ids.includes(x)) && (await page.$$("#nav .nav-cadenas")).length === 0, JSON.stringify(ids));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(3) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    const ids = await navIds(page);
    ok("coach dans la fiche d'un prospect : tous les onglets de sa fiche, aucun cadenas", ids.includes("mensurations") && ids.includes("suivi") && (await page.$$("#nav .nav-cadenas")).length === 0, JSON.stringify(ids));
    await c.close();
  }

  /* ---------- B. Calendly ---------- */
  {
    const db = base({ challenge: chJusqua(6) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    const h = await page.$eval("#ch-vue .ch-cta", a => a.getAttribute("href")).catch(() => "");
    ok("interrupteur éteint (par défaut) : le bouton du jour 7 mène au Calendly tel quel, sans prénom ni email", h === CAL, h);
    await c.close();
  }
  {
    prerempli = true;
    const db = base({ challenge: chJusqua(6) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    const h = await page.$eval("#ch-vue .ch-cta", a => a.getAttribute("href")).catch(() => "");
    ok("interrupteur allumé : prénom et email du prospect pré-remplis (name, first_name, email)", h === PRE, h);
    await aller(page, "#/programme", 1300);
    const hv = await page.$eval("#vue .verrou a", a => a.getAttribute("href")).catch(() => "");
    ok("interrupteur allumé : la page verrouillée aussi", hv === PRE, hv);
    await c.close();
    const db2 = base({ challenge: chJusqua(3) });
    const { c: c2, page: p2 } = await contexte(b, coach, db2);
    await p2.goto(`http://localhost:${PORT}/#/clients`); await attendre(p2, 2200);
    await p2.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(p2, 1800);
    ok("interrupteur allumé, coach dans la fiche d'un prospect : lienCalendly() rend l'adresse telle quelle", (await p2.evaluate(() => typeof lienCalendly === "function" ? lienCalendly() : null)) === CAL);
    await c2.close();
    prerempli = false;
  }
  {
    /* interrupteur allume : hub (apres le jour 5) et jours 5, 6 pre-remplis ; le clic du hub est compte */
    prerempli = true;
    for (const [k, h, sel] of [[5, "#/accueil", "#acc-vue a[target=_blank]"], [4, "#/challenge/5", "#ch-voir-accomp"], [5, "#/challenge/6", '#ch-vue a[data-ch-cal="6"]']]) {
      const db = base({ challenge: chJusqua(k) });
      const { c, page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/${h}`); await attendre(page, 2600);
      let href = "";
      if (sel === "#ch-voir-accomp") { await page.click(sel).catch(() => {}); await attendre(page, 600); href = await page.$eval('.volet a[data-ch-cal="5"]', a => a.getAttribute("href")).catch(() => ""); }
      else href = await page.$eval(sel, a => a.getAttribute("href")).catch(() => "");
      ok(`interrupteur allumé : ${h} → lien pré-rempli`, href === PRE, href);
      if (h === "#/accueil") {
        await page.evaluate(s => { const a = document.querySelector(s); a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); }, sel); await attendre(page, 1800);
        const C = (db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge") || {}).contenu || {};
        ok("interrupteur allumé : le clic du hub est bien compté", !!(C.cta && C.cta.clics && C.cta.clics.length), JSON.stringify(C.cta));
      }
      await c.close();
    }
    prerempli = false;
  }
  {
    /* robustesse du lien : adresse avec ? et #, caractere mal forme (demi-paire de substitution) */
    prerempli = true;
    const db = base({ challenge: chJusqua(6) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2400);
    const r = await page.evaluate(() => {
      if (typeof lienCalendly !== "function") return { l1: "", l2: "", err: "lienCalendly absent" };
      const avant = CONFIG.marque.calendly;
      CONFIG.marque.calendly = "https://calendly.com/x/30min?month=2026-10#haut"; const l1 = lienCalendly();
      CONFIG.marque.calendly = avant; const p0 = Auth.profil.prenom; Auth.profil.prenom = "L" + String.fromCharCode(0xD800) + "a"; let l2 = "", err = "";
      try { l2 = lienCalendly(); } catch(e){ err = String(e); }
      Auth.profil.prenom = p0; return { l1, l2, err };
    });
    ok("adresse Calendly avec « ? » et « # » : paramètres ajoutés avec « & », avant le « # »", r.l1 === "https://calendly.com/x/30min?month=2026-10&name=L%C3%A9a&first_name=L%C3%A9a&email=l%40e.fr#haut", r.l1);
    ok("prénom avec un caractère mal formé : aucune erreur, adresse sans paramètres", !r.err && r.l2 === CAL, JSON.stringify(r));
    await c.close();
    prerempli = false;
  }
  {
    /* vitrine absente ou mal reglee : retour au comportement d'avant (tout visible avec cadenas), sans erreur */
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
    const ids = await page.evaluate(() => { const out = {}; for (const v of [undefined, "programme", []]) { CONFIG.marque.gratuit_vitrine = v; construireNav(); out[JSON.stringify(v === undefined ? "absent" : v)] = Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id); } return out; });
    ok("vitrine absente ou en texte : tout redevient visible (mensurations, suivi, compléments avec cadenas)", ["\"absent\"", "\"programme\""].every(k => ["mensurations", "suivi", "complements"].every(x => ids[k].includes(x))), JSON.stringify(ids));
    ok("vitrine vide ([]) : seuls les onglets ouverts restent", !ids["[]"].includes("programme") && ids["[]"].includes("challenge"), JSON.stringify(ids["[]"]));
    await c.close();
  }
  {
    /* mobile : sur une page cachee, le bouton « Plus » ne s'allume pas */
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/suivi`); await attendre(page, 2200);
    ok("page cachée (#/suivi) sur mobile : verrouillée, et le bouton « Plus » ne s'allume pas", !!(await page.$("#vue .verrou")) && !(await page.$eval("#barre-bas [data-plus]", e => e.classList.contains("ici")).catch(() => true)));
    await c.close();
  }
  {
    /* clic « Reserver mon appel » depuis une page verrouillee : compte pour le suivi du coach */
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 2200);
    await page.evaluate(() => { const a = document.querySelector("#vue .verrou a[target=_blank]"); a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); }); await attendre(page, 2000);
    const C = (db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge") || {}).contenu || {};
    ok("clic « Réserver mon appel » depuis #/programme (verrouillé) : compté dans le suivi (cta.clics)", !!(C.cta && Array.isArray(C.cta.clics) && C.cta.clics.length === 1), JSON.stringify(C.cta));
    await c.close();
  }
  {
    /* le prospect relit les conditions depuis son profil ; la formation ne renvoie pas vers un onglet cache */
    const db = base({ challenge: chFini() });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.click("#mc-conditions").catch(() => {}); await attendre(page, 500);
    ok("profil du prospect : « Conditions d'utilisation et confidentialité » s'ouvre (Calendly mentionné)", (await texte(page, ".volet")).includes("Calendly (société américaine)"));
    await page.keyboard.press("Escape"); await attendre(page, 300);
    await aller(page, "#/formation", 2200);
    ok("formation (après le jour 7) : aucun lien vers un onglet caché (#/mensurations, #/suivi, #/complements)", !(await page.$('#vue a[href="#/mensurations"], #vue a[href="#/suivi"], #vue a[href="#/complements"]')));
    await c.close();
  }
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.click("#c-cgu-lien"); await attendre(page, 500);
    const v = await texte(page, ".volet");
    ok("confidentialité : Calendly (société américaine), réservation enregistrée pour le compte du coach, traitement possible aux États-Unis, pré-remplissage à l'ouverture", v.includes("Calendly (société américaine)") && v.includes("pour le compte du coach") && v.includes("États-Unis") && v.includes("dès que tu ouvres la page de réservation"));
    await c.close();
    inscriptionLibre = false;
  }
  {
    const db = base();
    const { c, page } = await contexte(b, null, db, { langue: "en" });
    inscriptionLibre = true;
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.click("#c-cgu-lien"); await attendre(page, 500);
    const v = await texte(page, ".volet");
    ok("confidentialité en anglais : « Booking: … Calendly (a US company) … on the coach's behalf »", v.includes("Booking:") && v.includes("Calendly (a US company)") && v.includes("on the coach's behalf"), v.slice(0, 300));
    await c.close();
    inscriptionLibre = false;
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
