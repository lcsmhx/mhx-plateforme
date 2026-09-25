/* v47 — funnel « Challenge 7 jours », finitions : retour du lien de confirmation d'email (entrée
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
const PORT = 9677;
const OUT = path.join(__dirname, "captures", "v47"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false;
const server = http.createServer((req, res) => {
  let h = fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
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

  /* ---------- A. Retour du lien de confirmation ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2600);
    const s = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_session") || "null"); } catch (e) { return null; } });
    ok("lien de confirmation : la personne est lue avec le jeton du lien (GET /auth/v1/user), une seule fois", db.lecturesUser === 1, "lectures " + db.lecturesUser);
    ok("lien de confirmation : session mémorisée (jeton, jeton de rafraîchissement, utilisateur), « Rester connecté » par défaut", !!s && s.access_token === "jeton.lien.test" && s.refresh_token === "ref-lien" && s.user && s.user.id === PROSPECT && (await page.evaluate(() => !sessionStorage.getItem("mhx_session"))), JSON.stringify(s));
    ok("lien de confirmation : les jetons ont disparu de l'adresse, arrivée directe sur le jour 1 du challenge", !(await page.evaluate(() => location.href)).includes("access_token") && (await page.evaluate(() => location.hash)) === "#/challenge" && (await texte(page, "#ch-vue")).includes("Ton point de départ"), await page.evaluate(() => location.href));
    ok("lien de confirmation : connectée, prospecte, mot d'accueil « Ton email est confirmé »", (await page.evaluate(() => Auth.connecte() && Auth.estProspect()).catch(() => false)) && (await texte(page, "#toasts")).includes("Ton email est confirmé"));
    ok("lien de confirmation : aucune écriture", db.ecritures.length === 0);
    await page.reload(); await attendre(page, 2000);
    ok("lien de confirmation : après rechargement, toujours connectée (session en mémoire), sur le challenge", (await page.evaluate(() => Auth.connecte()).catch(() => false)) && (await texte(page, "#ch-vue")).includes("Jour 1 / 7"));
    await c.close();
  }
  {
    /* lien perime : rien n'est memorise, la connexion s'affiche avec un mot */
    const db = base(); db.lienValide = false;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2200);
    const t = await texte(page, "body");
    ok("lien périmé : écran de connexion, « Ce lien n'est plus valable », aucune session, adresse nettoyée", !!(await page.$("#c-go")) && t.includes("Ce lien n'est plus valable") && (await page.evaluate(() => !localStorage.getItem("mhx_session") && !sessionStorage.getItem("mhx_session"))) && !(await page.evaluate(() => location.href)).includes("access_token"), t.slice(0, 200));
    await c.close();
  }
  {
    /* deja connecte (le coach) et lien perime : on entre quand meme, la session du coach est intacte */
    const db = base(); db.lienValide = false;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2600);
    ok("lien périmé, coach déjà connecté : le tableau de bord s'ouvre, session intacte, mot « Ce lien n'est plus valable »", !!(await page.$("#tb-vue")) && (await page.evaluate(() => Auth.estCoach()).catch(() => false)) && (await texte(page, "#toasts")).includes("Ce lien n'est plus valable") && db.ecritures.length === 0);
    await c.close();
  }
  {
    /* le lien de reinitialisation garde son ecran a lui */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#access_token=jeton.lien.test&type=recovery`); await attendre(page, 1500);
    ok("lien de réinitialisation : toujours l'écran « Choisis ton nouveau mot de passe » (rien ne change)", !!(await page.$("#r-mdp")) && db.lecturesUser === 0);
    await c.close();
  }
  {
    /* le vrai lien perime (Supabase revient sans jeton, avec une erreur dans l'adresse) : francais, adresse nettoyee, la connexion aboutit (pas de boucle) */
    const db = base(); db.connexion = true;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`); await attendre(page, 1800);
    const t = await texte(page, "body");
    ok("lien périmé réel (#error=otp_expired) : connexion avec « Ce lien n'est plus valable » en français, jamais le texte anglais brut, adresse nettoyée", !!(await page.$("#c-go")) && t.includes("Ce lien n'est plus valable") && !t.includes("Email link is invalid") && !(await page.evaluate(() => location.href)).includes("error"), t.slice(0, 200));
    await page.fill("#c-email", "l@e.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.click("#c-go"); await attendre(page, 2800);
    ok("lien périmé réel : la connexion qui suit aboutit sur le challenge (pas de boucle)", (await page.evaluate(() => Auth.connecte()).catch(() => false)) && !!(await page.$("#ch-vue")), await page.evaluate(() => location.href));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`); await attendre(page, 2600);
    ok("lien périmé réel, coach connecté : il reste connecté (tableau de bord), mot « déjà dans ton espace »", !!(await page.$("#tb-vue")) && (await page.evaluate(() => Auth.estCoach()).catch(() => false)) && (await texte(page, "#toasts")).includes("déjà dans ton espace"), await texte(page, "#toasts"));
    await c.close();
  }
  {
    /* un autre compte est connecte (le coach) et le lien est valide : on ne bascule pas */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2600);
    const s = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session") || "null"); } catch (e) { return null; } });
    ok("lien valide avec un autre compte connecté : pas de bascule (le coach reste), mot « Un autre compte est déjà connecté », adresse nettoyée", !!(await page.$("#tb-vue")) && !!s && s.user && s.user.id === F.IDS.coach && s.access_token !== "jeton.lien.test" && (await texte(page, "#toasts")).includes("Un autre compte est déjà connecté") && !(await page.evaluate(() => location.href)).includes("access_token"), JSON.stringify(s && s.user));
    await c.close();
  }
  {
    /* panne (500) sur la lecture de la personne : l'email est confirme, l'entree automatique a echoue */
    const db = base(); db.lienPanne = true;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2200);
    ok("lien valide mais panne serveur : connexion avec « l'entrée automatique a échoué », rien de mémorisé", !!(await page.$("#c-go")) && (await texte(page, "body")).includes("entrée automatique a échoué") && (await page.evaluate(() => !localStorage.getItem("mhx_session"))), (await texte(page, "#co-err")));
    await c.close();
  }
  {
    /* lien magique d'un client : entree, mot neutre (pas « Bienvenue dans le challenge ») */
    const db = base(); db.lienUser = { id: F.IDS.c1, aud: "authenticated", role: "authenticated", email: "t@e.fr" };
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#access_token=jeton.lien.test&expires_in=3600&refresh_token=ref-lien&token_type=bearer&type=magiclink`); await attendre(page, 2800);
    const toast = await texte(page, "#toasts");
    ok("lien magique d'un client : connecté, mot « Connexion réussie (t@e.fr) », pas « Bienvenue dans le challenge »", (await page.evaluate(() => Auth.connecte() && !Auth.estProspect()).catch(() => false)) && toast.includes("Connexion réussie") && toast.includes("t@e.fr") && !toast.includes("Bienvenue dans le challenge"), toast);
    await c.close();
  }
  {
    /* adresse mal encodee : l'app demarre quand meme */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#%`); await attendre(page, 1500);
    ok("adresse mal encodée (#%) : l'écran de connexion s'affiche, pas d'erreur", !!(await page.$("#c-go")));
    await c.close();
  }
  {
    const db = base({ prefs: { langue: "en" } });
    const { c, page } = await contexte(b, null, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/${LIEN}`); await attendre(page, 2600);
    ok("lien de confirmation en anglais : « Your email is confirmed », jour 1 « Your starting point »", (await texte(page, "#toasts")).includes("Your email is confirmed") && (await texte(page, "#ch-vue")).includes("Your starting point"), (await texte(page, "#ch-vue")).slice(0, 200));
    await c.close();
  }

  /* ---------- B. « Vérifie ta boîte mail » ---------- */
  {
    inscriptionLibre = true;
    const db = base(); db.confirmation = true;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 2000);
    const t = await texte(page, ".carte-co");
    ok("inscription avec confirmation : écran « Vérifie ta boîte mail » avec l'adresse, les indésirables, sans formulaire", db.inscriptions.length === 1 && t.includes("Vérifie ta boîte mail") && t.includes("nouvelle@exemple.fr") && t.includes("indésirables") && t.includes("directement sur ton jour 1") && !(await page.$("#c-go")) && !(await page.$("#c-mdp")), t.slice(0, 300));
    ok("inscription avec confirmation : personne n'est connectée, aucune écriture", (await page.evaluate(() => !localStorage.getItem("mhx_session") && !sessionStorage.getItem("mhx_session"))) && db.ecritures.length === 0);
    await page.screenshot({ path: path.join(OUT, "anon-verifie-email-desktop.png") });
    await page.keyboard.press("Enter"); await attendre(page, 500);
    ok("« Vérifie ta boîte mail » : le titre a le focus, la touche Entrée ne fait rien (écran intact, aucune erreur)", (await page.evaluate(() => document.activeElement && document.activeElement.id === "co-verif")) && (await texte(page, ".carte-co")).includes("Vérifie ta boîte mail") && t.includes("Déjà un compte avec cet email"));
    await page.click(".carte-co [data-mode='connexion']"); await attendre(page, 600);
    ok("inscription avec confirmation : « Retour à la connexion » ramène l'écran de connexion", (await texte(page, "#c-go")).includes("Se connecter"));
    await c.close();
  }
  {
    const db = base(); db.confirmation = true;
    const { c, page } = await contexte(b, null, db, { langue: "en", viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "new@example.com"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 2000);
    const t = await texte(page, ".carte-co");
    ok("« Vérifie ta boîte mail » en anglais, mobile : « Check your inbox », l'adresse, « spam », sans défilement horizontal", t.includes("Check your inbox") && t.includes("new@example.com") && t.includes("spam") && (await page.evaluate(() => document.documentElement.scrollWidth <= 390)), t.slice(0, 300));
    await page.screenshot({ path: path.join(OUT, "anon-verifie-email-mobile-en.png"), fullPage: true });
    await c.close();
  }
  {
    /* sans confirmation exigee : entree directe, comme avant (v44) */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 2800);
    ok("inscription sans confirmation : toujours l'entrée directe sur le jour 1 (rien ne change)", (await page.evaluate(() => Auth.connecte()).catch(() => false)) && (await texte(page, "#ch-vue")).includes("Ton point de départ"));
    await c.close();
  }
  {
    /* limite d'envoi d'emails atteinte : message en francais */
    const db = base(); db.limite = true;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 1200);
    ok("inscription, limite d'envoi atteinte (« email rate limit exceeded ») : « Trop de demandes d'un coup »", (await texte(page, "#co-err")).includes("Trop de demandes"), await texte(page, "#co-err"));
    await c.close();
    inscriptionLibre = false;
  }
  {
    /* connexion avant d'avoir clique le lien : message en francais */
    const db = base(); db.nonConfirme = true;
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1200);
    await page.fill("#c-email", "l@e.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.click("#c-go"); await attendre(page, 1200);
    ok("connexion avant confirmation (« Email not confirmed ») : « Ton email n'est pas encore confirmé »", (await texte(page, "#co-err")).includes("Ton email n'est pas encore confirmé"), await texte(page, "#co-err"));
    await c.close();
  }

  /* ---------- C. Côté coach ---------- */
  {
    const db = base({ challenge: chJusqua(3) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    ok("Mes clients : la prospecte porte « prospect » et « Challenge 3/7 », le client Thomas rien de tel", (await ligneDe(page, PROSPECT)).includes("prospect") && (await ligneDe(page, PROSPECT)).includes("Challenge 3/7") && !(await ligneDe(page, F.IDS.c1)).includes("Challenge"), await ligneDe(page, PROSPECT));
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    const t = await texte(page, "#vue");
    ok("fiche (3 jours) : bloc « Challenge 7 jours » 3 / 7, prochain jour 4, erreur « Boire ses calories », séance « 3 tours · ressenti 4/5 », « jamais cliqué »", t.includes("Challenge 7 jours") && t.includes("3 / 7") && t.includes("prochain : jour 4") && t.includes("Boire ses calories") && t.includes("3 tours · ressenti 4/5") && t.includes("jamais cliqué") && !t.includes("Habitude (jour 4)"), t.slice(0, 500));
    ok("fiche (3 jours) : phrase du haut « Challenge 7 jours : 3 / 7. », sept étapes dont trois faites, aucune écriture", t.includes("Challenge 7 jours : 3 / 7.") && (await page.$$("#fiche-challenge .ch-etape")).length === 7 && (await page.$$("#fiche-challenge .ch-etape.fait")).length === 3 && db.ecritures.length === 0);
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(6, [{ jour: 5, date: ilYA(1) + "T10:00:00.000Z" }]) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    ok("Mes clients : « Challenge 6/7 » et « a cliqué Réserver »", (await ligneDe(page, PROSPECT)).includes("Challenge 6/7") && (await ligneDe(page, PROSPECT)).includes("a cliqué Réserver"), await ligneDe(page, PROSPECT));
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    const t = await texte(page, "#vue");
    ok("fiche (6 jours) : habitude « Marcher 10 minutes après un repas (après le déjeuner, autour du bureau) », « Calories », « J'hésite encore », « 1 clic », prochain jour 7", t.includes("Marcher 10 minutes après un repas (après le déjeuner, autour du bureau)") && t.includes("Calories") && t.includes("J'hésite encore") && t.includes("1 clic") && t.includes("prochain : jour 7"), t.slice(0, 600));
    ok("fiche (6 jours) : « Erreur choisie » avec l'action jugée « moyen », note « lecture seule », aucune écriture", t.includes("action jugée « moyen »") && t.includes("Lecture seule") && db.ecritures.length === 0);
    await page.screenshot({ path: path.join(OUT, "coach-fiche-prospecte-desktop.png"), fullPage: true });
    await c.close();
  }
  {
    const db = base({ challenge: chFini({ reserve: true, clics: [{ jour: 7, date: ilYA(0) + "T09:01:00.000Z" }] }) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2200);
    ok("tableau de bord : tuile Prospects « 1 challenge terminé »", (await texte(page, "#tb-vue")).includes("1 challenge terminé"), (await texte(page, "#tb-vue")).slice(0, 300));
    await aller(page, "#/clients", 2000);
    ok("Mes clients : « Challenge terminé » et « appel réservé »", (await ligneDe(page, PROSPECT)).includes("Challenge terminé") && (await ligneDe(page, PROSPECT)).includes("appel réservé"), await ligneDe(page, PROSPECT));
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    const t = await texte(page, "#vue");
    ok("fiche (terminé) : « terminé le », « cochée le », « 1 clic », phrase du haut « Challenge 7 jours : terminé. »", t.includes("7 / 7 · terminé le") && t.includes("cochée le") && t.includes("1 clic") && t.includes("Challenge 7 jours : terminé."), t.slice(0, 500));
    await c.close();
  }
  {
    /* prospecte sans challenge : pastille 0/7, pas de bloc mais la phrase du haut le dit */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    ok("Mes clients : prospecte sans challenge → « Challenge 0/7 »", (await ligneDe(page, PROSPECT)).includes("Challenge 0/7"), await ligneDe(page, PROSPECT));
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    const t = await texte(page, "#vue");
    ok("fiche (sans challenge) : pas de bloc, « pas encore commencé » dans la phrase du haut", !(await page.$("#fiche-challenge")) && t.includes("Challenge 7 jours : pas encore commencé"), t.slice(0, 300));
    await page.click(`#nav a[data-id="clients"]`).catch(() => {}); await aller(page, "#/clients", 1800);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 1800);
    const tc = await texte(page, "#vue");
    ok("fiche d'un client (Thomas) : aucun bloc ni mention du challenge, aucune écriture", !(await page.$("#fiche-challenge")) && !tc.includes("Challenge 7 jours") && db.ecritures.length === 0);
    await c.close();
  }
  {
    /* prospect piege : des objets a la place des chaines, du HTML dans le texte libre → rien ne tombe, rien ne s'execute */
    const piege = { version: 1, debut: { toString: 1 }, jours: { "1": { fait: ilYA(3) + "T08:00:00.000Z", date: { toString: 1 } }, "2": "texte", "3": null, "4": { fait: ilYA(1) + "T08:00:00.000Z", date: ilYA(1), habitude: "marche", quand: "<img src=x onerror=\"window.__x=1\">", ou: 5 }, "7": { fait: ilYA(0) + "T08:00:00.000Z", date: ilYA(0), reserve: { toString: 1 } } }, cta: { clics: ["x", { jour: 5, date: { toString: 1 } }, null] }, termine: { toString: 1 } };
    const db = base({ challenge: piege });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    ok("prospect piégé : Mes clients s'affiche entière (Léa et Thomas), pastille présente, aucune erreur", !!(await page.$(`[data-ouvrir="${PROSPECT}"]`)) && !!(await page.$(`[data-ouvrir="${F.IDS.c1}"]`)) && /Challenge/.test(await ligneDe(page, PROSPECT)), await ligneDe(page, PROSPECT));
    await aller(page, "#/tableau", 2000);
    ok("prospect piégé : le tableau de bord s'affiche", !!(await page.$("#tb-vue .tiles")));
    await aller(page, "#/clients", 2000);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 1800);
    const t = await texte(page, "#vue");
    ok("prospect piégé : la fiche s'ouvre avec le bloc (3 jours, prochain jour 2, 1 clic), rien d'injecté, aucune écriture", t.includes("Fiche client") && !!(await page.$("#fiche-challenge")) && t.includes("3 / 7") && t.includes("prochain : jour 2") && t.includes("1 clic") && !(await page.$("#fiche-challenge img")) && (await page.evaluate(() => window.__x === undefined)) && db.ecritures.length === 0, (await texte(page, "#fiche-challenge")).slice(0, 400));
    await c.close();
  }
  {
    /* plus de 1 000 lignes : Mes clients lit par pages (la simulation honore l'en-tete Range) et reste complete, sans doublon */
    const db = base();
    for (let i = 0; i < 1100; i++){ const id = "00000000-0000-4000-8000-0000" + String(100000 + i).slice(-6) + "00"; db.profils.push({ id, prenom: "P" + i, nom: "", role: "client", statut: "prospect", cree_le: "2026-09-20T10:00:00Z" }); db.donnees.push({ user_id: id, outil: "intake", contenu: { age: "30" }, maj_le: "2026-09-20T10:00:00+00:00" }); }
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 6000);
    const ids = await page.$$eval("[data-ouvrir]", l => l.map(b => b.dataset.ouvrir));
    ok("plus de 1 000 profils et lignes : Mes clients montre tout le monde (1 104 comptes), une seule fois chacun", ids.length === 1104 && new Set(ids).size === 1104, "boutons " + ids.length);
    await c.close();
  }
  {
    /* ancien prospect passe client : son bloc reste dans la fiche (historique utile), pas de pastille dans Mes clients */
    const db = base(); db.donnees.push({ user_id: F.IDS.c1, outil: "challenge", contenu: chFini(), maj_le: "2026-09-24T10:00:00+00:00" });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    ok("client avec un challenge fini (ancien prospect) : pas de pastille dans Mes clients", !(await ligneDe(page, F.IDS.c1)).includes("Challenge"));
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 1800);
    ok("client avec un challenge fini : le bloc « Challenge 7 jours » reste dans sa fiche (terminé)", !!(await page.$("#fiche-challenge")) && (await texte(page, "#fiche-challenge")).includes("terminé"));
    await c.close();
  }
  {
    /* mobile : la fiche avec le bloc, sans defilement horizontal */
    const db = base({ challenge: chJusqua(6, [{ jour: 6, date: ilYA(0) + "T10:00:00.000Z" }]) });
    const { c, page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1800);
    ok("fiche mobile : bloc présent, sans défilement horizontal", !!(await page.$("#fiche-challenge")) && (await page.evaluate(() => document.documentElement.scrollWidth <= 390)));
    await page.screenshot({ path: path.join(OUT, "coach-fiche-prospecte-mobile.png"), fullPage: true });
    await c.close();
  }

  /* ---------- D. Client et prospecte : rien ne change ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("client : accueil, pas d'onglet challenge, aucune écriture", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="challenge"]')) && db.ecritures.length === 0);
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(3) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2000);
    ok("prospecte : son accueil (3 jours validés) est inchangé, aucune écriture", (await texte(page, "#acc-vue")).includes("3 jours validés sur 7") && db.ecritures.length === 0);
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
