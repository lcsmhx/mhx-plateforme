/* verif86 — v83 (bloc 3 de la mission du 13/10/2026) : l'espace coach réorganisé, dans un vrai navigateur, Supabase simulé.
   A. liste Clients : titre, nombre, recherche par nom sans accents ni majuscules (« Aucun résultat pour ce nom. »), filtres
      Tous · À traiter · Inactifs · Archivés, « + », « Sélectionner », plus de lien « Clients | Prospects » ; chaque ligne :
      initiales, nom, raison, poids à droite ; tout l'écran d'avant reste dessous (tableau complet, alertes, Comptes) ;
   B. liste Prospects : Tous · À traiter · Archivés, issue (PERDU) et « bilan réservé » sur la ligne ; tout le reste de la page
      d'avant dessous (compteur, Nouveautés, chiffres, Mesure, filtres détaillés, cartes, CSV, newsletter) ;
   C. sélection et archivage : les cases, « Tout sélectionner » (la liste filtrée), « N sélectionné(s) », la fenêtre de
      confirmation (1 compte, puis plusieurs : titre et texte exacts, « Annuler » n'écrit rien), le message après, l'écriture
      (clé coach-seul suivi_prospect, archive_le, rien d'autre ne change), « Archivés », « Restaurer » ; un prospect aussi ;
      aucun appel DELETE ; jamais « Supprimer » dans la sélection ;
   D. Tableau de bord : titre, sous-titre, 3 compteurs, « À traiter maintenant » (raisons), sans les archivés (compteurs,
      à traiter, « Nouveaux depuis ta dernière visite », Nouveautés) ; « Rien à traiter pour l'instant. » ; barre du bas
      Tableau · Clients · Prospects · Plus ;
   E. fiches à onglets : client (Préparer le call, Appeler, Suivi : retour de la semaine, poids, régularité, questionnaire /
      programme / diète, « Ses outils », toute la fiche d'avant ; Compte dans l'ordre, Supprimer définitivement inchangé),
      prospect (« Ses réponses » : format v81, v60 et ancien ; Suivi commercial après), WhatsApp (numéro, texte encodé exact,
      avec et sans texte libre, en anglais, « Pas de numéro »), archiver / restaurer depuis la fiche (les autres champs du
      suivi gardés, écriture conditionnelle) ;
   F. la croix : retour au Tableau de bord, retour à la liste avec la recherche, le filtre et la position gardés ; « + » et
      Créer un accès (mêmes champs, mêmes rôles), croix ;
   G. le Suivi commercial toujours utilisable (« J'ai relancé » sur un compte archivé : l'archivage est gardé) ;
   H. largeurs 360, 390 et 430 px : aucun débordement, zones de toucher d'au moins 44 px ;
   I. anglais (US) ; W. moteur WebKit (Safari), si installé (banc GitHub ; VERIF86_WEBKIT=0 pour s'en passer en local — le
      nombre de ✓ change alors).
   Comptes fictifs (@exemple.fr), numéros de la plage réservée à la fiction (06 39 98 …). Aucun vrai compte, aucune écriture
   dans Supabase.
   Usage : node verif86.js ../index.html
           VERIF86_PORT=10021 node verif86.js ../index.html     (autre port, si 10020 est pris)
           VERIF86_BLOCS="A,C" node verif86.js …                 (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF86_PORT || 10020;
const BLOCS = (process.env.VERIF86_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 360, height: 740 }, GRAND = { width: 430, height: 932 };

const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates, petites aides ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && Math.abs(Date.parse(x) - t) < 60000;

/* ---------- les personnes ---------- */
const session = (id, email) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: { id, email, role: "authenticated" } });
const PID = k => "00000000-0000-4000-8000-0000000086" + String(k).padStart(2, "0");   // verif86 : …86kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" };
const THOMAS = F.IDS.c1, SARAH = F.IDS.c2, JULIEN = F.IDS.c3;
const NADIA = PID(1), ELOISE = PID(2), PAUL = PID(3);
const ZOE = PID(10), HUGO = PID(11), ANA = PID(12), LEO = PID(13), NOE = PID(14), INES = PID(15);
const TEL_ZOE = "+33639980011", TEL_LEO = "+12025550147", TEL_NOE = "+33639980014", TEL_THOMAS = "+33639980001";

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien) + 3 clients et 6 prospects fictifs ----------
   Thomas : retour de la semaine à lire (à traiter) ; Julien : inactif depuis 12 j (à traiter) ; Sarah, Nadia, Éloïse : rien
   d'urgent ; Paul : ARCHIVÉ (et inactif depuis 30 j : il serait à traiter). Zoé (parcours v81, 2 blocages + texte libre,
   numéro), Noé (v81 sans texte libre, numéro), Leo (v81, anglais, numéro américain) : nouveaux, à traiter ; Hugo (format v60,
   sans numéro, « Bilan réservé » coché il y a 2 j) ; Ana (ancien questionnaire, « Perdu » il y a 9 j) ; Inès : ARCHIVÉE
   (inscrite il y a 1 h : elle serait à traiter et dans les nouveautés). Pas de clé coach_visite : « Nouveaux depuis ta
   dernière visite » = les inscrits des 7 derniers jours. */
const SUIVI_HUGO = { version: 1, bilan_le: avant(2 * J), historique: [{ type: "bilan", valeur: "reserve", le: avant(2 * J) }] };
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const P = (id, prenom, nom, statut, cree) => profils.push({ id, prenom, nom, role: "client", statut, cree_le: cree });
  P(NADIA, "Nadia", "Exemple", "client", avant(40 * J)); P(ELOISE, "Éloïse", "Durand", "client", avant(20 * J)); P(PAUL, "Paul", "Rangé", "client", avant(60 * J));
  P(ZOE, "Zoé", "Martin", "prospect", avant(2 * H)); P(HUGO, "Hugo", "Bernard", "prospect", avant(3 * J)); P(ANA, "Ana", "Lopez", "prospect", avant(10 * J));
  P(LEO, "Leo", "Smith", "prospect", avant(26 * H)); P(NOE, "Noé", "Petit", "prospect", avant(5 * H)); P(INES, "Inès", "Morel", "prospect", avant(1 * H));
  const d = (user_id, outil, contenu, quand) => ({ user_id, outil, contenu, maj_le: quand });
  let donnees = clone(F.donnees).filter(x => x.outil !== "coach_visite").concat([
    d(THOMAS, "contact", { telephone: TEL_THOMAS }, avant(30 * J)),
    d(NADIA, "intake", { nom: "Nadia Exemple", complet: true, age: 35, sexe: "Femme", taille: 168, poids: 70 }, avant(5 * J)),
    d(NADIA, "mens", { dstart: avant(30 * J).slice(0, 10), pstart: 71.5, mesures: [{ sem: 1, date: avant(20 * J).slice(0, 10), poids: 70.9, vals: {} }, { sem: 2, date: avant(2 * J).slice(0, 10), poids: 69.8, vals: {} }] }, avant(2 * J)),
    d(ELOISE, "intake", { nom: "Éloïse Durand", age: 28, sexe: "Femme" }, avant(1 * J)),
    d(PAUL, "intake", { nom: "Paul Rangé", complet: true, age: 50, sexe: "Homme" }, avant(30 * J)),
    d(PAUL, "suivi_prospect", { version: 1, archive_le: avant(5 * J) }, avant(5 * J)),
    d(ZOE, "intake", { probleme: "Perdre du gras", obstacle: "Le manque de temps · Je craque sur la nourriture — Je travaille de nuit", obstacle_choix: ["temps", "craquages"], obstacle_precision: "Je travaille de nuit",
      projection: "Avoir de l'énergie toute la journée", projection_choix: ["energie"], sexe: "Femme", court_debut: avant(2 * H), court_le: avant(2 * H), parcours_le: avant(2 * H), email_compte: "zoe@exemple.fr", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche" }, avant(2 * H)),
    d(ZOE, "contact", { telephone: TEL_ZOE, ref: "insta", inscrit_le: avant(2 * H) }, avant(2 * H)),
    d(HUGO, "intake", { probleme: "Prendre du muscle", obstacle: "La motivation retombe vite", obstacle_choix: ["motivation"], projection: "Tenir une routine sans me forcer", projection_choix: ["routine"], court_debut: avant(3 * J), court_le: avant(3 * J), email_compte: "hugo@exemple.fr" }, avant(3 * J)),
    d(HUGO, "suivi_prospect", clone(SUIVI_HUGO), avant(2 * J)),
    d(ANA, "intake", { sexe: "Femme", age: 31, objectif: "Remise en forme", obstacle: "Trop de travail le soir", motivation: 7, court_debut: avant(10 * J), court_le: avant(10 * J), email_compte: "ana@exemple.fr" }, avant(10 * J)),
    d(ANA, "suivi_prospect", { version: 1, issue: "perdu", issue_le: avant(9 * J), note: "timing", historique: [{ type: "issue", valeur: "perdu", le: avant(9 * J), note: "timing" }] }, avant(9 * J)),
    d(LEO, "intake", { probleme: "Prendre du muscle", obstacle: "Personne pour me suivre et me recadrer", obstacle_choix: ["suivi"], projection: "Retrouver confiance en moi", projection_choix: ["confiance"], sexe: "Homme", court_debut: avant(26 * H), court_le: avant(26 * H), parcours_le: avant(26 * H), email_compte: "leo@exemple.fr" }, avant(26 * H)),
    d(LEO, "prefs", { langue: "en" }, avant(26 * H)),
    d(LEO, "contact", { telephone: TEL_LEO }, avant(26 * H)),
    d(NOE, "intake", { probleme: "Me remettre en forme", obstacle: "La motivation retombe vite", obstacle_choix: ["motivation"], projection: "Tenir une routine sans me forcer", projection_choix: ["routine"], sexe: "Homme", court_debut: avant(5 * H), court_le: avant(5 * H), parcours_le: avant(5 * H), email_compte: "noe@exemple.fr" }, avant(5 * H)),
    d(NOE, "contact", { telephone: TEL_NOE }, avant(5 * H)),
    d(INES, "intake", { probleme: "Perdre du gras", obstacle: "Le manque de temps", obstacle_choix: ["temps"], projection: "M'aimer sur les photos", projection_choix: ["photos"], sexe: "Femme", court_debut: avant(1 * H), court_le: avant(1 * H), parcours_le: avant(1 * H) }, avant(1 * H)),
    d(INES, "suivi_prospect", { version: 1, archive_le: avant(30 * MIN) }, avant(30 * MIN))
  ]);
  if (opts.langue === "en") donnees.push(d(F.IDS.coach, "prefs", { langue: "en" }, avant(40 * J)));
  if (opts.calme){   // rien à traiter : aucun prospect, plus de retour à lire ni d'inactif
    const garder = [F.IDS.coach, SARAH, NADIA, PAUL];
    donnees = donnees.filter(x => garder.includes(x.user_id));
    for (let i = profils.length - 1; i >= 0; i--) if (!garder.includes(profils[i].id)) profils.splice(i, 1);
  }
  const connexions = [{ user_id: THOMAS, nombre: 41, derniere: avant(3 * H), premiere: avant(50 * J) }, { user_id: ZOE, nombre: 1, derniere: avant(2 * H), premiere: avant(2 * H) }];
  return { profils, donnees, connexions, ecritures: [], lectures: [], chemins: [], conditions: [], emails: {}, meta: {} };
}

/* ---------- le faux Supabase (gabarit de verif85 ; + la table connexions, le statut posé par le coach, la condition de chaque
   écriture conditionnelle ; toute méthode DELETE est notée : jamais attendue) ---------- */
const MAX_LIGNES = 1000;
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
const appelant = req => { const m = /^Bearer (?:jeton-)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/token")) { const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")); return r1 ? json(session(r1[1], db.emails[r1[1]] || "")) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400); }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") { const uid = (q.get("user_id") || "").replace(/^eq\./, ""); let l = coach ? db.connexions : []; if (uid) l = l.filter(x => x.user_id === uid); return json(colonnes(plage(l), q)); }
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}; db.ecritures.push({ table: "profils", m, id, corps: c });
    const pr = db.profils.find(x => x.id === id); if (pr && coach && m === "PATCH") Object.assign(pr, c);
    return json(pr ? [pr] : []);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, upsert }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      db.conditions.push({ outil: cleEq, user_id: uid, maj_le: mj });
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return m === "GET" ? json(colonnes(plage(F.catalogue[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) : le coach connecté ; opts : viewport, langue ---------- */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  db.emails[COACH.id] = COACH.email;
  await c.addInitScript(({ langue, s }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1"); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      localStorage.setItem("mhx_session", JSON.stringify(s));
    }
  }, { langue: opts.langue || "", s: session(COACH.id, COACH.email) });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("popup", p => { db.onglets = (db.onglets || 0) + 1; p.close().catch(() => {}); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const URL0 = "http://localhost:" + PORT + "/";
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 300); };
const aller = async (page, h) => { await page.evaluate(x => { location.hash = x; }, h); await pret(page); };
const ouvrirListe = async (page, t) => { await aller(page, "#/" + t); await page.waitForSelector("#lc-" + t + " #lc-liste li"); await attendre(page, 250); };
const noms = page => page.$$eval("#lc-liste .lc-ligne .lc-nom b", l => l.map(e => e.textContent.trim())).catch(() => []);
const uids = page => page.$$eval("#lc-liste .lc-ligne", l => l.map(e => e.dataset.uid)).catch(() => []);
const txt = (page, sel) => page.$eval(sel, e => e.textContent).then(norm).catch(() => null);
const txts = (page, sel) => page.$$eval(sel, l => l.map(e => e.textContent)).then(l => l.map(norm)).catch(() => []);
const filtrer = async (page, k) => { await page.click('[data-lc-filtre="' + k + '"]'); await attendre(page, 200); };
const chercher = async (page, q) => { await page.fill("#lc-q", q); await attendre(page, 400); };
const ligne = (page, uid) => page.click('.lc-ligne[data-uid="' + uid + '"] [data-lc-ligne]');
const modale = page => page.evaluate(() => { const m = document.querySelector(".modale"); return m ? { titre: (m.querySelector("h2") || {}).textContent || "", corps: (m.querySelector(".corps") || {}).textContent || "",
  boutons: Array.from(m.querySelectorAll(".actions .btn")).map(b => b.textContent.trim()) } : null; });
const bouton = (page, texte) => page.evaluate(t => { const b = Array.from(document.querySelectorAll(".modale .actions .btn")).find(x => x.textContent.trim() === t); if (b) b.click(); return !!b; }, texte);
const dernierToast = page => page.$$eval(".toast", l => l.length ? l[l.length - 1].textContent : "").then(norm).catch(() => "");
const ligne0 = (db, uid, outil) => db.donnees.find(d => d.user_id === uid && d.outil === outil) || null;
const suiviDe = (db, uid) => (ligne0(db, uid, "suivi_prospect") || {}).contenu || null;
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && !e.refus && (!uid || e.user_id === uid));
const sansDelete = db => !db.chemins.some(c => c.startsWith("DELETE ")) && !db.ecritures.some(e => e.m === "DELETE");
const fiche = async (page, uid, nom) => { await page.evaluate(([u, n]) => Clients.ouvrir(u, n, "accueil"), [uid, nom]); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 300); };
const onglet = async (page, k) => { await page.click('[data-onglet="' + k + '"]'); await attendre(page, 150); };
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
/* les zones de toucher visibles des écrans du bloc 3 qui font moins de 44 px de haut (ou de large pour un bouton rond) */
const petits = page => page.evaluate(() => {
  const sel = ".lc button, .lc a, .lc input, .tb-tete a, .tb-tiles a, .tb-at button, #tb-a-traiter a, .fc-tete button, .fc-tete a, .fc-panneau .lc-lien, .fc-outils a, .fc-outils button, #fc-compte button, .acces-vue button, .acces-vue a, .lc-barre button, #barre-bas a, #barre-bas button";
  return Array.from(document.querySelectorAll(sel)).filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; })
    .filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || (e.classList.contains("rond") && r.width < 43.5); })
    .map(e => (e.id || e.className || e.tagName) + " " + Math.round(e.getBoundingClientRect().height) + "px « " + e.textContent.trim().slice(0, 20) + " »");
});
const MSG_ZOE = "Salut Zoé 👋 Bienvenue chez MHX Coaching ! J'ai bien reçu tes réponses : ton objectif, c'est perdre du gras, et ce qui a coincé jusqu'ici : le manque de temps et les craquages. Tu m'as aussi écrit : « Je travaille de nuit ». Je prépare ton plan d'action. Tu as pu réserver ton appel offert de 15 min ?";
const MSG_NOE = "Salut Noé 👋 Bienvenue chez MHX Coaching ! J'ai bien reçu tes réponses : ton objectif, c'est te remettre en forme, et ce qui a coincé jusqu'ici : la motivation qui retombe. Je prépare ton plan d'action. Tu as pu réserver ton appel offert de 15 min ?";
const MSG_LEO = "Hi Leo 👋 Welcome to MHX Coaching! I got your answers: your goal is to build muscle, and what's held you back so far: lack of support. I'm putting together your action plan. Were you able to book your free 15-min call?";
const UN = "Ce compte disparaît de tes listes. Tu le retrouves dans « Archivés ». Rien ne change pour la personne.";
const PLUSIEURS = "Ces comptes disparaissent de tes listes. Tu les retrouves dans « Archivés ». Rien ne change pour eux.";

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF86_PORT=10021 node verif86.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. liste Clients =================== */
  await bloc("A. liste Clients", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#lc-clients #lc-liste li"); await attendre(page, 300);
    const e = await page.evaluate(() => { const s = document.getElementById("lc-clients");
      return { h1: s.querySelector("h1").textContent, compte: s.querySelector("#lc-compte").textContent, ph: s.querySelector("#lc-q").placeholder,
        filtres: Array.from(s.querySelectorAll("[data-lc-filtre]")).map(x => x.textContent.trim() + (x.getAttribute("aria-pressed") === "true" ? "*" : "")),
        plus: (s.querySelector("[data-lc-plus]") || {}).getAttribute ? s.querySelector("[data-lc-plus]").getAttribute("href") : null, sel: (s.querySelector("[data-sel-debut]") || {}).textContent,
        selecteur: !!document.getElementById("clients-prospects") || Array.from(s.querySelectorAll("button, a")).some(x => x.textContent.trim() === "Prospects"),
        detail: !!document.querySelector("#tb-clients [data-ouvrir]") && !!document.getElementById("alertes-clients") && !!document.querySelector("#liste-clients .client-l") };
    });
    ok("A1 : en haut de Mes clients : « Clients », « 5 clients » (sans l'archivé), recherche « Rechercher un client par son nom », filtres Tous · À traiter · Inactifs · Archivés (Tous choisi), « + » vers Créer un accès, « Sélectionner » ; plus de lien « Clients | Prospects » ; dessous, le tableau complet, ses alertes et Comptes restent",
      e.h1 === "Clients" && e.compte === "5 clients" && e.ph === "Rechercher un client par son nom" && JSON.stringify(e.filtres) === '["Tous*","À traiter","Inactifs","Archivés"]' && e.plus === "#/clients/nouveau" && e.sel === "Sélectionner" && !e.selecteur && e.detail, JSON.stringify(e));
    const l = await page.$$eval("#lc-liste .lc-ligne", l => l.map(li => ({ uid: li.dataset.uid, ini: li.querySelector(".avatar").textContent, nom: li.querySelector(".lc-nom b").textContent,
      raison: li.querySelector("small").textContent, droite: (li.querySelector(".lc-droite") || {}).textContent || "" })));
    const julien = l.find(x => x.uid === JULIEN) || {}, thomas = l.find(x => x.uid === THOMAS) || {};
    ok("A2 : chaque ligne : initiales, nom, raison (celle de « À traiter » : « Inactif depuis 12 j », « Bilan hebdo reçu — à lire »), poids depuis le début à droite ; l'archivé (Paul) n'y est pas",
      l.length === 5 && julien.ini === "JD" && julien.raison === "Inactif depuis 12 j" && thomas.raison === "Bilan hebdo reçu — à lire" && /^[−+]\d+,\d kg$/.test(norm(thomas.droite)) && !l.some(x => x.uid === PAUL), JSON.stringify(l));
    await chercher(page, "ELOISE"); const r1 = await noms(page);
    await chercher(page, "démo"); const r2 = await noms(page);
    await chercher(page, "DEMO"); const r3 = await noms(page);
    await chercher(page, "zzz"); const r4 = await txt(page, "#lc-liste .lc-vide");
    await chercher(page, "");
    ok("A3 : recherche par nom sans tenir compte des accents ni des majuscules (« ELOISE » → Éloïse Durand ; « démo » et « DEMO » → les 3 Démo) ; aucun résultat : « Aucun résultat pour ce nom. »",
      JSON.stringify(r1) === '["Éloïse Durand"]' && r2.length === 3 && r2.every(n => / Démo$/.test(n)) && JSON.stringify(r2.slice().sort()) === JSON.stringify(r3.slice().sort()) && r4 === "Aucun résultat pour ce nom.", JSON.stringify({ r1, r2, r3, r4 }));
    await filtrer(page, "a_traiter"); const f1 = (await uids(page)).sort();
    await filtrer(page, "inactifs"); const f2 = await uids(page);
    await filtrer(page, "archives"); const f3 = await uids(page);
    await filtrer(page, "tous"); const f4 = await uids(page);
    ok("A4 : filtres : À traiter = Thomas et Julien (définition du Tableau de bord) ; Inactifs = Julien (10 jours ou plus sans saisie) ; Archivés = Paul seul ; Tous = les 5 autres",
      JSON.stringify(f1) === JSON.stringify([THOMAS, JULIEN].sort()) && JSON.stringify(f2) === JSON.stringify([JULIEN]) && JSON.stringify(f3) === JSON.stringify([PAUL]) && f4.length === 5 && !f4.includes(PAUL), JSON.stringify({ f1, f2, f3, f4 }));
    const tb = await page.$$eval("#tb-clients [data-ouvrir]", l => l.map(x => x.dataset.ouvrir));
    const cpt = await page.$$eval("#liste-clients .client-l", l => l.map(x => x.querySelector(".nom").textContent.trim()));
    ok("A5 : l'archivé est aussi retiré du tableau complet et de Comptes (rien d'autre ne change : 5 clients au tableau, les comptes de l'équipe et les prospects restent dans Comptes)",
      tb.length === 5 && !tb.includes(PAUL) && !cpt.some(n => /Paul/.test(n)) && cpt.some(n => /Coach/.test(n)) && cpt.some(n => /Zoé/.test(n)) && !cpt.some(n => /Inès/.test(n)), JSON.stringify({ tb, cpt }));
  });

  /* =================== B. liste Prospects =================== */
  await bloc("B. liste Prospects", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/prospects"); await pret(page); await page.waitForSelector("#lc-prospects #lc-liste li"); await attendre(page, 400);
    const e = await page.evaluate(() => { const s = document.getElementById("lc-prospects");
      return { h1: s.querySelector("h1").textContent, compte: s.querySelector("#lc-compte").textContent, ph: s.querySelector("#lc-q").placeholder,
        filtres: Array.from(s.querySelectorAll("[data-lc-filtre]")).map(x => x.textContent.trim()), plus: s.querySelector("[data-lc-plus]").getAttribute("href"),
        lignes: Array.from(s.querySelectorAll(".lc-ligne")).map(li => ({ uid: li.dataset.uid, nom: li.querySelector(".lc-nom b").textContent, raison: li.querySelector("small").textContent, droite: (li.querySelector(".lc-droite") || {}).textContent || "" })) }; });
    const ana = e.lignes.find(x => x.uid === ANA) || {}, hugo = e.lignes.find(x => x.uid === HUGO) || {}, zoe = e.lignes.find(x => x.uid === ZOE) || {};
    ok("B1 : Prospects : « 5 prospects » (sans l'archivée), « Rechercher un prospect par son nom », filtres Tous · À traiter · Archivés, « + » ; lignes de la plus récente à la plus ancienne ; raison (« Inscrit il y a 2 h : DM de bienvenue ») ; à droite l'issue « PERDU » et « bilan réservé »",
      e.h1 === "Prospects" && e.compte === "5 prospects" && e.ph === "Rechercher un prospect par son nom" && JSON.stringify(e.filtres) === '["Tous","À traiter","Archivés"]' && e.plus === "#/prospects/nouveau"
        && JSON.stringify(e.lignes.map(x => x.uid)) === JSON.stringify([ZOE, NOE, LEO, HUGO, ANA]) && zoe.raison === "Inscrit il y a 2 h : DM de bienvenue" && norm(ana.droite) === "PERDU" && norm(hugo.droite) === "bilan réservé", JSON.stringify(e));
    await filtrer(page, "a_traiter"); const f1 = await uids(page);
    await filtrer(page, "archives"); const f2 = await uids(page);
    await filtrer(page, "tous"); await chercher(page, "ZOE"); const r1 = await noms(page); await chercher(page, "");
    ok("B2 : À traiter = Zoé, Noé, Leo (nouveaux) ; Archivés = Inès ; recherche « ZOE » → Zoé Martin", JSON.stringify(f1) === JSON.stringify([ZOE, NOE, LEO]) && JSON.stringify(f2) === JSON.stringify([INES]) && JSON.stringify(r1) === '["Zoé Martin"]', JSON.stringify({ f1, f2, r1 }));
    const d = await page.evaluate(() => ({ compteur: !!document.getElementById("pr-compteur"), nouv: !!document.querySelector("#pr-nouveautes .nv-panneau"), tuiles: document.querySelectorAll("#pr-vue .tiles .tile").length >= 4,
      mesure: !!document.querySelector("#pr-mesure h2"), seg: Array.from(document.querySelectorAll("[data-filtre]")).map(x => x.dataset.filtre), csv: !!document.getElementById("pr-csv"),
      cartes: Array.from(document.querySelectorAll(".sc-carte")).map(c => c.dataset.uid), nl: !!document.getElementById("pr-nl"), q: !!document.getElementById("pr-q"),
      nv: Array.from(document.querySelectorAll("#pr-nouveautes .nv-liste li b")).map(x => x.textContent) }));
    ok("B3 : dessous, tout ce que la page montrait reste (compteur, Nouveautés, chiffres, Mesure, filtres détaillés, recherche nom ou email, export CSV, cartes avec leurs boutons, newsletter) ; l'archivée n'est ni dans les cartes ni dans les Nouveautés",
      d.compteur && d.nouv && d.tuiles && d.mesure && JSON.stringify(d.seg) === '["a_traiter","issues","tous"]' && d.csv && d.nl && d.q && !d.cartes.includes(INES) && d.cartes.length >= 3 && !d.nv.some(n => /Inès/.test(n)) && d.nv.some(n => /Zoé/.test(n)), JSON.stringify(d));
  });

  /* =================== C. sélection et archivage =================== */
  await bloc("C. sélection et archivage", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#lc-clients #lc-liste li"); await attendre(page, 300);
    await page.click("[data-sel-debut]"); await attendre(page, 200);
    const s0 = await page.evaluate(() => ({ cases: document.querySelectorAll('#lc-liste [data-lc-ligne][role="checkbox"]').length, nb: (document.getElementById("lc-nb-sel") || {}).textContent,
      bouton: (document.querySelector("[data-sel-archiver]") || {}).textContent, inactif: (document.querySelector("[data-sel-archiver]") || {}).disabled,
      tout: !!document.querySelector("[data-sel-tout]"), annuler: !!document.querySelector("[data-sel-annuler]"), plus: !!document.querySelector("[data-lc-plus]"),
      barreBas: getComputedStyle(document.getElementById("barre-bas")).display, supprimer: Array.from(document.querySelectorAll(".lc-barre button")).some(x => /Supprimer/.test(x.textContent)) }));
    ok("C1 : « Sélectionner » fait apparaître une case par ligne, « Tout sélectionner » et « Annuler » ; la barre « 0 sélectionné » + « Archiver » (inactif) remplace la barre du bas ; jamais « Supprimer » dans la sélection",
      s0.cases === 5 && s0.nb === "0 sélectionné" && s0.bouton === "Archiver" && s0.inactif === true && s0.tout && s0.annuler && !s0.plus && s0.barreBas === "none" && !s0.supprimer, JSON.stringify(s0));
    await ligne(page, SARAH); await attendre(page, 150);
    const s1 = await page.evaluate(id => ({ nb: document.getElementById("lc-nb-sel").textContent, coche: document.querySelector('.lc-ligne[data-uid="' + id + '"] [data-lc-ligne]').getAttribute("aria-checked"), hash: location.hash }), SARAH);
    await page.click("[data-sel-archiver]"); await attendre(page, 300);
    const m1 = await modale(page);
    await bouton(page, "Annuler"); await attendre(page, 300);
    const apresAnnuler = ecr(db, "suivi_prospect").length;
    ok("C2 : une ligne touchée est cochée (« 1 sélectionné », la fiche ne s'ouvre pas) ; « Archiver » ouvre la fenêtre « Archiver 1 client ? » avec le texte pour 1 compte, « Annuler » / « Archiver » ; « Annuler » : rien n'est écrit",
      s1.nb === "1 sélectionné" && s1.coche === "true" && s1.hash === "#/clients" && !!m1 && m1.titre === "Archiver 1 client ?" && norm(m1.corps) === UN && JSON.stringify(m1.boutons) === '["Annuler","Archiver"]' && apresAnnuler === 0, JSON.stringify({ s1, m1, apresAnnuler }));
    const t1 = Date.now();
    await page.click("[data-sel-archiver]"); await attendre(page, 300); await bouton(page, "Archiver");
    await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]") && document.querySelectorAll("#lc-liste .lc-ligne").length === 4, null, { timeout: 8000 }); await attendre(page, 300);
    const toast1 = await dernierToast(page), S1 = suiviDe(db, SARAH) || {}, w1 = ecr(db, "suivi_prospect", SARAH);
    ok("C3 : « Archiver » : message « 1 client archivé », sortie de la sélection, Sarah quitte la liste (« 4 clients ») ; écrit UNE fois chez elle dans la clé coach-seul suivi_prospect : { version: 1, archive_le: maintenant } (rien d'autre)",
      toast1 === "1 client archivé" && (await txt(page, "#lc-compte")) === "4 clients" && !(await uids(page)).includes(SARAH) && w1.length === 1 && w1[0].m === "POST" && !w1[0].upsert
        && JSON.stringify(Object.keys(S1).sort()) === '["archive_le","version"]' && S1.version === 1 && isoPres(S1.archive_le, t1), JSON.stringify({ toast1, S1, w1 }));
    await chercher(page, "demo"); await page.click("[data-sel-debut]"); await attendre(page, 200); await page.click("[data-sel-tout]"); await attendre(page, 150);
    const s2 = await page.evaluate(() => ({ nb: document.getElementById("lc-nb-sel").textContent, coches: Array.from(document.querySelectorAll('#lc-liste [aria-checked="true"]')).map(x => x.dataset.lcLigne) }));
    await page.click("[data-sel-archiver]"); await attendre(page, 300);
    const m2 = await modale(page); await bouton(page, "Archiver");
    await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]"), null, { timeout: 8000 }); await attendre(page, 400);
    const toast2 = await dernierToast(page);
    ok("C4 : « Tout sélectionner » prend la liste filtrée (recherche « demo » : Thomas et Julien, « 2 sélectionnés ») ; fenêtre « Archiver 2 clients ? » avec le texte pour plusieurs ; message « 2 clients archivés »",
      s2.nb === "2 sélectionnés" && JSON.stringify(s2.coches.sort()) === JSON.stringify([THOMAS, JULIEN].sort()) && !!m2 && m2.titre === "Archiver 2 clients ?" && norm(m2.corps) === PLUSIEURS && toast2 === "2 clients archivés", JSON.stringify({ s2, m2, toast2 }));
    await chercher(page, ""); const tous = await uids(page); await filtrer(page, "a_traiter"); const at = await uids(page); await filtrer(page, "archives"); const ar = (await uids(page)).sort();
    ok("C5 : les archivés ne sont plus dans Tous ni dans À traiter (vide : « Rien à traiter pour l'instant. »), ils sont dans Archivés (Paul, Sarah, Thomas, Julien)",
      tous.length === 2 && !tous.some(u => [SARAH, THOMAS, JULIEN].includes(u)) && at.length === 0 && JSON.stringify(ar) === JSON.stringify([PAUL, SARAH, THOMAS, JULIEN].sort()), JSON.stringify({ tous, at, ar }));
    await page.click("[data-sel-debut]"); await attendre(page, 200);
    const restaurer = await txt(page, "[data-sel-archiver]");
    await ligne(page, SARAH); await page.click("[data-sel-archiver]");
    await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]"), null, { timeout: 8000 }); await attendre(page, 400);
    const toast3 = await dernierToast(page), S3 = suiviDe(db, SARAH) || {};
    await filtrer(page, "tous"); const tous2 = await uids(page);
    ok("C6 : dans Archivés, le bouton devient « Restaurer » : Sarah revient (message « 1 client restauré », archive_le remis à null, rien d'autre)",
      restaurer === "Restaurer" && toast3 === "1 client restauré" && S3.archive_le === null && JSON.stringify(Object.keys(S3).sort()) === '["archive_le","version"]' && tous2.includes(SARAH), JSON.stringify({ restaurer, toast3, S3, tous2 }));
    await ouvrirListe(page, "prospects"); await page.click("[data-sel-debut]"); await attendre(page, 200); await ligne(page, HUGO); await page.click("[data-sel-archiver]"); await attendre(page, 300);
    const m4 = await modale(page); await bouton(page, "Archiver");
    await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]"), null, { timeout: 8000 }); await attendre(page, 400);
    const toast4 = await dernierToast(page), H4 = suiviDe(db, HUGO) || {}, c4 = db.conditions.filter(c => c.user_id === HUGO);
    const cartes = await page.$$eval(".sc-carte", l => l.map(c => c.dataset.uid));
    ok("C7 : un prospect (Hugo) : « Archiver 1 prospect ? », « 1 prospect archivé » ; son suivi commercial est gardé tel quel (Bilan réservé, historique) + archive_le, par une écriture conditionnelle (maj_le lu) ; il quitte la liste et les cartes",
      !!m4 && m4.titre === "Archiver 1 prospect ?" && toast4 === "1 prospect archivé" && H4.bilan_le === SUIVI_HUGO.bilan_le && JSON.stringify(H4.historique) === JSON.stringify(SUIVI_HUGO.historique) && isoPres(H4.archive_le, Date.now())
        && c4.length === 1 && /^eq\./.test(c4[0].maj_le || "") && !(await uids(page)).includes(HUGO) && !cartes.includes(HUGO), JSON.stringify({ m4, toast4, H4, c4, cartes }));
    ok("C8 : aucun appel DELETE pendant tout ce parcours (listes, sélection, archivage, restauration)", sansDelete(db), JSON.stringify(db.chemins.filter(c => !c.startsWith("GET "))));
  });

  /* =================== D. Tableau de bord =================== */
  await bloc("D. Tableau de bord", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/tableau"); await pret(page); await page.waitForSelector("#tb-a-traiter"); await attendre(page, 500);
    const t = await page.evaluate(() => ({ h1: document.querySelector("#tb-vue h1").textContent, sous: document.querySelector("#tb-vue .tb-tete .lede").textContent,
      compteurs: Array.from(document.querySelectorAll("#tb-vue .tb-tiles .tb-tuile")).map(x => x.querySelector(".t-lbl").textContent + " " + x.querySelector(".t-val").textContent),
      sur: document.querySelector("#tb-a-traiter h2").textContent, lignes: Array.from(document.querySelectorAll("#tb-a-traiter [data-fiche]")).map(x => x.dataset.fiche),
      raisons: Array.from(document.querySelectorAll("#tb-a-traiter [data-fiche] small")).map(x => x.textContent.trim()),
      nouveaux: Array.from(document.querySelectorAll("#tb-nouveaux .tb-liste li b")).map(x => x.textContent),
      ordre: (() => { const a = document.getElementById("tb-a-traiter"), n = document.getElementById("tb-nouveaux"), s = document.getElementById("tb-sources"); return !!(a && n && s && (a.compareDocumentPosition(n) & 4) && (n.compareDocumentPosition(s) & 4)); })(),
      raccourcis: Array.from(document.querySelectorAll("#tb-vue .acces b")).map(x => x.textContent),
      badge: (document.querySelector('#barre-bas a[data-id="prospects"] .nav-badge') || {}).textContent || "" }));
    ok("D1 : « Tableau de bord », « Ce qui demande ton attention aujourd'hui. », 3 compteurs dans l'ordre : Clients 5, À traiter 5, Prospects 5 (sans les 2 archivés)",
      t.h1 === "Tableau de bord" && t.sous === "Ce qui demande ton attention aujourd'hui." && JSON.stringify(t.compteurs) === '["Clients 5","À traiter 5","Prospects 5"]', JSON.stringify(t));
    ok("D2 : « À traiter maintenant » : Thomas (retour à lire) d'abord, les 3 nouveaux prospects, Julien (inactif), avec la raison existante ; jamais Paul ni Inès (archivés)",
      t.sur === "À traiter maintenant" && t.lignes[0] === THOMAS && t.lignes.length === 5 && JSON.stringify(t.lignes.slice(1, 4).sort()) === JSON.stringify([ZOE, LEO, NOE].sort()) && t.lignes[4] === JULIEN
        && t.raisons[0] === "Bilan hebdo reçu — à lire" && t.raisons[4] === "Inactif depuis 12 j" && !t.lignes.includes(PAUL) && !t.lignes.includes(INES), JSON.stringify(t));
    ok("D3 : dessous, tout le reste d'avant : « Nouveaux depuis ta dernière visite » (Zoé, Noé, Leo, Hugo ; pas Inès, archivée), « Inscrits par source », raccourcis (Mes clients, Mes séances, Bibliothèque, Catalogue) ; badge des Nouveautés sans l'archivée",
      t.ordre && JSON.stringify(t.nouveaux) === '["Zoé","Noé","Leo","Hugo"]' && JSON.stringify(t.raccourcis) === '["Mes clients","Mes séances","Bibliothèque","Catalogue"]' && t.badge === "8", JSON.stringify(t));
    const nav = await page.evaluate(() => Array.from(document.querySelectorAll("#barre-bas a, #barre-bas button")).map(x => x.textContent.trim()));
    await page.click("#barre-bas [data-plus]"); await attendre(page, 400);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => a.dataset.id));
    await page.keyboard.press("Escape");
    ok("D4 : barre du bas du coach : Tableau · Clients · Prospects · Plus ; « Plus » ouvre les autres outils du coach (Mes séances, Bibliothèque, Catalogue, Entraînement…)",
      JSON.stringify(nav.map(x => x.replace(/\d+$/, ""))) === '["Tableau","Clients","Prospects","Plus"]' && ["atelier", "bibliotheque", "catalogue", "entrainement"].every(k => plus.includes(k)), JSON.stringify({ nav, plus }));
    const db2 = base({ calme: true });
    const { page: p2 } = await contexte(b, db2);
    await p2.goto(URL0 + "#/tableau"); await pret(p2); await p2.waitForSelector("#tb-a-traiter"); await attendre(p2, 400);
    const v = await p2.evaluate(() => ({ rien: (document.querySelector("#tb-a-traiter .tb-rien") || {}).textContent, compteurs: Array.from(document.querySelectorAll("#tb-vue .tb-tiles .t-val")).map(x => x.textContent) }));
    ok("D5 : rien à traiter : la section reste, « Rien à traiter pour l'instant. » ; compteurs 2 · 0 · 0 (Paul archivé ne compte pas)", v.rien === "Rien à traiter pour l'instant." && JSON.stringify(v.compteurs) === '["2","0","0"]', JSON.stringify(v));
  });

  /* =================== E. fiches à onglets, WhatsApp =================== */
  await bloc("E. fiches", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#lc-clients #lc-liste li"); await attendre(page, 300);
    await ligne(page, THOMAS); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 400);
    const f = await page.evaluate(() => { const v = s => document.querySelector(s); const vis = s => { const e = v(s); return !!e && !e.hidden && e.getBoundingClientRect().height > 0; };
      return { hash: location.hash, h1: v(".fc-tete h1").textContent, role: v(".fc-role-p").textContent, prog: (v(".fc-prog") || {}).textContent, call: v("#fc-call") && v("#fc-call").getAttribute("href"), callT: (v("#fc-call") || {}).textContent,
        tel: v("#fc-appeler") && v("#fc-appeler").getAttribute("href"), onglets: Array.from(document.querySelectorAll("[data-onglet]")).map(x => x.textContent + ":" + x.getAttribute("aria-selected")),
        suivi: vis("#fc-suivi"), compte: vis("#fc-compte"), croix: (v("#fc-fermer") || {}).getAttribute ? v("#fc-fermer").getAttribute("aria-label") : null,
        retour: (v("#fc-retour") || {}).textContent, lire: (v("#fc-lire") || {}).getAttribute ? v("#fc-lire").getAttribute("href") : null, poids: (v("#fc-poids") || {}).textContent, reg: (v("#fc-regularite") || {}).textContent,
        etat: Array.from(document.querySelectorAll("#fc-etat li")).map(li => li.textContent.replace(/\s+/g, " ").trim()), outils: Array.from(document.querySelectorAll("#fc-outils a")).map(a => a.textContent),
        avant: ["En bref", "Profil", "Objectifs du mois", "Programme", "Nutrition", "Poids et mensurations", "Bilan hebdomadaire", "Le reste"].filter(h => !Array.from(document.querySelectorAll("#fc-suivi h2")).some(x => x.textContent === h)),
        notes: !!document.querySelector("#fc-suivi .notes-coach"), bandeau: !!document.querySelector("#vue > .bandeau"), bandeauSuivi: !!document.querySelector("#fc-suivi #fc-outils .bandeau #sortir-fiche") }; });
    ok("E1 : la fiche d'un client (depuis la liste) : croix « Fermer la fiche », initiales, nom, pastille « Client » et celle du programme, « Préparer le call » (#/client/…/bilan), Appeler (tel:) ; onglets Suivi (ouvert) et Compte",
      f.hash === "#/client/" + THOMAS + "/accueil" && f.h1 === "Thomas Démo" && f.role === "Client" && f.prog === "Bloc 1 — 4 semaines" && f.callT === "Préparer le call" && f.call === "#/client/" + THOMAS + "/bilan" && f.tel === "tel:" + TEL_THOMAS
        && JSON.stringify(f.onglets) === '["Suivi:true","Compte:false"]' && f.suivi && !f.compte && f.croix === "Fermer la fiche" && !f.bandeau && f.bandeauSuivi, JSON.stringify(f));
    ok("E2 : Suivi : retour de la semaine (« Bilan hebdo reçu — à lire », Lire → Préparer le call), poids depuis le début, régularité, questionnaire / programme / diète, le bandeau d'avant (la fiche et les 9 outils du client), puis toute la fiche d'avant (notes privées comprises)",
      /Retour de la semaine/i.test(f.retour) && /Bilan hebdo reçu — à lire/.test(f.retour) && f.lire === "#/client/" + THOMAS + "/bilan" && /kg/.test(f.poids) && /depuis le début/.test(f.poids) && /Régularité/.test(f.reg)
        && f.etat.length === 3 && /^Questionnaire Rempli/.test(f.etat[0]) && /^Programme Bloc 1/.test(f.etat[1]) && /^Diète envoyée/.test(f.etat[2])
        && JSON.stringify(f.outils) === '["Fiche","Préparer le call","Son suivi","Son questionnaire","Son programme","Ses repas","Ses calories","Ses courbes","Ses séances","Son journal alimentaire"]' && !f.avant.length && f.notes, JSON.stringify(f));
    await onglet(page, "compte");
    const c = await page.evaluate(() => { const p = document.getElementById("fc-compte");
      return { vis: !p.hidden, suivi: document.getElementById("fc-suivi").hidden, lignes: Array.from(p.querySelectorAll("#fc-infos li")).map(li => li.querySelector("span").textContent),
        tel: norm0(p.querySelector("#fiche-tel").textContent), role: p.querySelector("#fc-role").textContent, changer: p.querySelector("#fc-changer").textContent, derniere: p.querySelector("#fc-derniere").textContent,
        ordre: Array.from(p.querySelectorAll("#fc-acces, #fc-archiver, #fc-supprimer")).map(x => x.textContent.trim()), zone: (p.querySelector("#fc-danger h3") || {}).textContent };
      function norm0(t){ return String(t).replace(/\s+/g, " ").trim(); } });
    ok("E3 : Compte, dans l'ordre : Email, Téléphone (numéro, Appeler, WhatsApp), Source, Rôle « Client » + « Changer », Dernière connexion, Connexions ; puis « Donner l'accès complet », « Archiver ce compte », la zone rouge « Supprimer définitivement »",
      c.vis && c.suivi && JSON.stringify(c.lignes) === '["Email","Téléphone","Source","Rôle","Dernière connexion","Connexions"]' && c.tel === TEL_THOMAS + " Appeler WhatsApp" && c.role === "Client" && c.changer === "Changer"
        && /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(c.derniere) && JSON.stringify(c.ordre) === '["Donner l\'accès complet","Archiver ce compte","Supprimer définitivement"]' && c.zone === "Supprimer définitivement", JSON.stringify(c));
    await page.click("#fc-supprimer"); await attendre(page, 300);
    const ms = await modale(page); await page.keyboard.press("Escape"); await attendre(page, 300);
    ok("E4 : « Supprimer définitivement » : la double confirmation d'avant (« Supprimer un compte », texte inchangé) ; Échap : rien n'est envoyé",
      !!ms && ms.titre === "Supprimer un compte" && /^Supprimer définitivement le compte de Thomas Démo \?/.test(ms.corps) && JSON.stringify(ms.boutons) === '["Annuler","Continuer"]' && !db.chemins.some(x => /supprimer-acces/.test(x)), JSON.stringify(ms));
    await fiche(page, ZOE, "Zoé Martin");
    const z = await page.evaluate(() => { const v = s => document.querySelector(s);
      return { role: v(".fc-role-p").textContent, wa: v("#fc-wa") && v("#fc-wa").getAttribute("href"), waT: (v("#fc-wa") || {}).textContent, cible: v("#fc-wa") && v("#fc-wa").getAttribute("target"),
        call: !!v("#fc-call"), rep: Array.from(document.querySelectorAll("#fc-reponses li")).map(li => [li.querySelector("span").textContent, li.querySelector("b").textContent.trim()]),
        ordre: (() => { const r = v("#fc-reponses"), s = v("#fiche-commercial"), t = v("#fc-retour"); return !!(r && s && t && (r.compareDocumentPosition(s) & 4) && (s.compareDocumentPosition(t) & 4)); })(),
        sc: (v("#fiche-commercial h2") || {}).textContent, boutons: Array.from(document.querySelectorAll("#fiche-commercial [data-sc]")).map(x => x.textContent.trim()) }; });
    const waZ = "https://wa.me/33639980011?text=" + encodeURIComponent(MSG_ZOE);
    ok("E5 : fiche d'un prospect : pastille « Prospect », « WhatsApp » à la place de « Préparer le call » : lien wa.me vers son numéro, texte pré-rempli encodé exact (objectif, 2 blocages, son texte libre), nouvel onglet",
      z.role === "Prospect" && z.wa === waZ && norm(z.waT) === "WhatsApp" && z.cible === "_blank" && !z.call && decodeURIComponent(z.wa.split("?text=")[1]) === MSG_ZOE, JSON.stringify({ z, waZ }));
    ok("E6 : d'abord « Ses réponses » (format du parcours v81) : Objectif, Ce qui bloque, Avec ses mots, Dans 3 mois, Tu es ? ; puis le Suivi commercial complet (Bilan réservé, J'ai relancé, Signé, Perdu, Absent)",
      JSON.stringify(z.rep) === JSON.stringify([["Objectif", "Perdre du gras"], ["Ce qui bloque", "Le manque de temps · Je craque sur la nourriture"], ["Avec ses mots", "Je travaille de nuit"], ["Dans 3 mois", "Avoir de l'énergie toute la journée"], ["Tu es ?", "Femme"]])
        && z.ordre && z.sc === "Suivi commercial" && JSON.stringify(z.boutons) === '["Bilan réservé","J\'ai relancé","Signé","Perdu","Absent"]', JSON.stringify(z));
    await fiche(page, HUGO, "Hugo Bernard");
    const h = await page.evaluate(() => ({ wa: (document.getElementById("fc-wa") || {}).textContent, dis: (document.getElementById("fc-wa") || {}).disabled, tag: (document.getElementById("fc-wa") || {}).tagName,
      tel: (document.getElementById("fc-appeler") || {}).disabled, rep: Array.from(document.querySelectorAll("#fc-reponses li")).map(li => li.querySelector("b").textContent.trim()) }));
    await fiche(page, ANA, "Ana Lopez");
    const a = await page.evaluate(() => ({ rep: Array.from(document.querySelectorAll("#fc-reponses li")).map(li => li.querySelector("b").textContent.trim()), note: (document.querySelector("#fc-reponses .note") || {}).textContent || "",
      decouverte: !!document.getElementById("fiche-decouverte") }));
    ok("E7 : sans numéro : bouton grisé « Pas de numéro » (et Appeler inactif) ; « Ses réponses » au format v60 (sans texte libre ni « Tu es ? » : « Pas encore répondu ») et à l'ancien format (questionnaire de 10 questions) lisibles",
      h.tag === "BUTTON" && norm(h.wa) === "Pas de numéro" && h.dis === true && h.tel === true
        && JSON.stringify(h.rep) === JSON.stringify(["Prendre du muscle", "La motivation retombe vite", "Pas encore répondu", "Tenir une routine sans me forcer", "Pas encore répondu"])
        && JSON.stringify(a.rep) === JSON.stringify(["Remise en forme", "Pas encore répondu", "Trop de travail le soir", "Pas encore répondu", "Femme"]) && /Anciennes réponses/.test(a.note) && a.decouverte, JSON.stringify({ h, a }));
    await fiche(page, LEO, "Leo Smith");
    const lw = await page.$eval("#fc-wa", x => x.getAttribute("href"));
    await fiche(page, NOE, "Noé Petit");
    const nw = await page.$eval("#fc-wa", x => x.getAttribute("href"));
    ok("E8 : WhatsApp en anglais pour le prospect qui a choisi l'anglais (numéro américain) ; en français sans texte libre (la phrase « Tu m'as aussi écrit » est sautée)",
      lw === "https://wa.me/12025550147?text=" + encodeURIComponent(MSG_LEO) && nw === "https://wa.me/33639980014?text=" + encodeURIComponent(MSG_NOE), JSON.stringify({ lw: decodeURIComponent(lw), nw: decodeURIComponent(nw) }));
    ok("E9 : aucun appel DELETE en ouvrant les fiches", sansDelete(db), JSON.stringify(db.chemins.filter(c => !c.startsWith("GET "))));
  });

  /* =================== F. la croix, Créer un accès =================== */
  await bloc("F. croix et Créer un accès", async () => {
    const db = base();
    const { page } = await contexte(b, db, { viewport: { width: 360, height: 560 } });
    await page.goto(URL0 + "#/tableau"); await pret(page); await page.waitForSelector("#tb-a-traiter [data-fiche]"); await attendre(page, 400);
    await page.click('#tb-a-traiter [data-fiche="' + JULIEN + '"]'); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 300);
    const h1 = await page.evaluate(() => location.hash);
    await page.click("#fc-fermer"); await pret(page); await page.waitForSelector("#tb-a-traiter"); await attendre(page, 300);
    const retour = await page.evaluate(() => location.hash);
    ok("F1 : Tableau de bord → une ligne « À traiter » (Julien, inactif) ouvre sa fiche → la croix ramène au Tableau de bord",
      h1 === "#/client/" + JULIEN + "/accueil" && retour === "#/tableau", JSON.stringify({ h1, retour }));
    await ouvrirListe(page, "clients"); await filtrer(page, "tous"); await chercher(page, "émo");
    await page.evaluate(id => document.querySelector('.lc-ligne[data-uid="' + id + '"]').scrollIntoView({ block: "end" }), SARAH); await attendre(page, 200);
    const y0 = await page.evaluate(() => window.scrollY);
    await ligne(page, SARAH); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 300);
    await page.click("#fc-fermer"); await pret(page); await page.waitForSelector("#lc-clients #lc-liste li"); await attendre(page, 600);
    const g = await page.evaluate(() => ({ hash: location.hash, q: document.getElementById("lc-q").value, n: document.querySelectorAll("#lc-liste .lc-ligne").length,
      filtre: (document.querySelector('[data-lc-filtre][aria-pressed="true"]') || {}).dataset, y: window.scrollY }));
    ok("F2 : liste → fiche → croix : retour à la liste Clients avec la recherche (« émo », 3 lignes), le filtre et la position gardés",
      g.hash === "#/clients" && g.q === "émo" && g.n === 3 && g.filtre && g.filtre.lcFiltre === "tous" && Math.abs(g.y - y0) <= 40 && y0 > 50, JSON.stringify({ g, y0 }));
    await ouvrirListe(page, "prospects"); await filtrer(page, "a_traiter"); await ligne(page, NOE); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 300);
    await page.click("#fc-fermer"); await pret(page); await page.waitForSelector("#lc-prospects #lc-liste li"); await attendre(page, 400);
    const p = await page.evaluate(() => ({ hash: location.hash, filtre: (document.querySelector('[data-lc-filtre][aria-pressed="true"]') || {}).dataset }));
    ok("F3 : Prospects (filtre À traiter) → fiche → croix : retour aux Prospects, filtre gardé", p.hash === "#/prospects" && p.filtre && p.filtre.lcFiltre === "a_traiter", JSON.stringify(p));
    await page.click("[data-lc-plus]"); await pret(page); await page.waitForSelector("#acces-vue"); await attendre(page, 300);
    const n = await page.evaluate(() => ({ hash: location.hash, h1: document.querySelector("#acces-vue h1").textContent, champs: ["n-prenom", "n-nom", "n-email", "n-mdp", "n-type", "n-gen", "n-creer"].filter(id => !document.getElementById(id)),
      roles: Array.from(document.querySelectorAll("#n-type option")).map(o => o.value), fermer: document.getElementById("acces-fermer").getAttribute("aria-label") }));
    await page.click("#n-gen"); const mdp = await page.$eval("#n-mdp", x => x.value);
    await page.click("#acces-fermer"); await pret(page); await page.waitForSelector("#lc-prospects #lc-liste li"); await attendre(page, 300);
    const apres = await page.evaluate(() => location.hash);
    ok("F4 : « + » ouvre Créer un accès (mêmes champs : prénom, nom, email, mot de passe provisoire avec « Générer un mot de passe », type d'accès client ou équipe ; « Créer le compte ») ; la croix « Fermer » ramène à la liste d'où l'on vient",
      n.hash === "#/prospects/nouveau" && n.h1 === "Créer un accès" && !n.champs.length && JSON.stringify(n.roles) === '["client","coach"]' && n.fermer === "Fermer" && mdp.length === 10 && apres === "#/prospects" && db.ecritures.every(e => e.outil === "coach_visite"), JSON.stringify({ n, mdp, apres, e: db.ecritures }));
  });

  /* =================== G. le Suivi commercial reste utilisable =================== */
  await bloc("G. Suivi commercial et archivage depuis la fiche", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/prospects"); await pret(page); await page.waitForSelector("#lc-prospects #lc-liste li"); await attendre(page, 300);
    await fiche(page, HUGO, "Hugo Bernard"); await onglet(page, "compte");
    await page.click("#fc-archiver"); await attendre(page, 300);
    const m = await modale(page); await bouton(page, "Archiver");
    await page.waitForFunction(() => !!document.querySelector(".fc-archive"), null, { timeout: 8000 }); await attendre(page, 400);
    const a = await page.evaluate(() => ({ pastille: document.querySelector(".fc-archive").textContent, b: document.getElementById("fc-archiver").textContent, onglet: (document.querySelector('[data-onglet][aria-selected="true"]') || {}).textContent }));
    const toastA = await dernierToast(page), HA = suiviDe(db, HUGO) || {};
    ok("G1 : depuis la fiche (onglet Compte) : « Archiver ce compte » demande confirmation (« Archiver 1 prospect ? ») ; après : « 1 prospect archivé », pastille « Archivé », « Restaurer ce compte », toujours sur Compte ; le suivi commercial gardé",
      !!m && m.titre === "Archiver 1 prospect ?" && norm(m.corps) === UN && toastA === "1 prospect archivé" && a.pastille === "Archivé" && a.b === "Restaurer ce compte" && a.onglet === "Compte"
        && HA.bilan_le === SUIVI_HUGO.bilan_le && JSON.stringify(HA.historique) === JSON.stringify(SUIVI_HUGO.historique) && !!HA.archive_le, JSON.stringify({ m, a, toastA, HA }));
    await onglet(page, "suivi");
    await page.click('#fiche-commercial [data-sc="relance"]');
    await page.waitForFunction(() => /enregistré/.test(Array.from(document.querySelectorAll(".toast")).map(t => t.textContent).join(" ")), null, { timeout: 8000 }); await attendre(page, 400);
    const HR = suiviDe(db, HUGO) || {};
    ok("G2 : le Suivi commercial reste utilisable sur un compte archivé : « J'ai relancé » enregistre la relance et garde archive_le (et le reste du suivi)",
      Array.isArray(HR.relances) && HR.relances.length === 1 && HR.archive_le === HA.archive_le && HR.bilan_le === SUIVI_HUGO.bilan_le && HR.historique.length === 2, JSON.stringify(HR));
    await onglet(page, "compte"); await page.click("#fc-archiver");
    await page.waitForFunction(() => !document.querySelector(".fc-archive"), null, { timeout: 8000 }); await attendre(page, 400);
    const toastR = await dernierToast(page), HZ = suiviDe(db, HUGO) || {};
    ok("G3 : « Restaurer ce compte » (sans fenêtre) : « 1 prospect restauré », archive_le remis à null, relance et bilan gardés ; aucun DELETE",
      toastR === "1 prospect restauré" && HZ.archive_le === null && HZ.relances.length === 1 && HZ.bilan_le === SUIVI_HUGO.bilan_le && (await txt(page, "#fc-archiver")) === "Archiver ce compte" && sansDelete(db), JSON.stringify({ toastR, HZ }));
  });

  /* =================== H. largeurs, zones de toucher =================== */
  await bloc("H. largeurs et 44 px", async () => {
    for (const vp of [ETROIT, MOBILE, GRAND]) {
      const db = base();
      const { page } = await contexte(b, db, { viewport: vp });
      const pb = [];
      const voir = async nom => { if (await deborde(page)) pb.push(nom + " : déborde"); const p = await petits(page); if (p.length) pb.push(nom + " : " + p.join(", ")); };
      await page.goto(URL0 + "#/tableau"); await pret(page); await page.waitForSelector("#tb-a-traiter"); await attendre(page, 300); await voir("tableau");
      await ouvrirListe(page, "clients"); await voir("clients");
      await page.click("[data-sel-debut]"); await attendre(page, 200); await ligne(page, SARAH); await voir("sélection");
      await page.click("[data-sel-annuler]");
      await ouvrirListe(page, "prospects"); await voir("prospects");
      await fiche(page, ZOE, "Zoé Martin"); await voir("fiche suivi"); await onglet(page, "compte"); await voir("fiche compte");
      await aller(page, "#/clients/nouveau"); await page.waitForSelector("#acces-vue"); await voir("créer un accès");
      ok("H : " + vp.width + " px : Tableau de bord, Clients (et sélection), Prospects, fiche (Suivi, Compte), Créer un accès : aucun débordement, zones de toucher d'au moins 44 px", !pb.length, JSON.stringify(pb));
    }
  });

  /* =================== I. anglais =================== */
  await bloc("I. anglais", async () => {
    const db = base({ langue: "en" });
    const { page } = await contexte(b, db, { langue: "en" });
    await page.goto(URL0 + "#/tableau"); await pret(page); await page.waitForSelector("#tb-a-traiter"); await attendre(page, 500);
    const t = await page.evaluate(() => ({ h1: document.querySelector("#tb-vue h1").textContent, sous: document.querySelector("#tb-vue .tb-tete .lede").textContent,
      lbl: Array.from(document.querySelectorAll("#tb-vue .tb-tiles .t-lbl")).map(x => x.textContent), sur: document.querySelector("#tb-a-traiter h2").textContent,
      nav: Array.from(document.querySelectorAll("#barre-bas .lbl")).map(x => x.textContent) }));
    ok("I1 : Tableau de bord en anglais : « Dashboard », « What needs your attention today. », Clients · To handle · Prospects, « To handle now » ; barre du bas Dashboard · Clients · Prospects · More",
      t.h1 === "Dashboard" && t.sous === "What needs your attention today." && JSON.stringify(t.lbl) === '["Clients","To handle","Prospects"]' && t.sur === "To handle now" && JSON.stringify(t.nav) === '["Dashboard","Clients","Prospects","More"]', JSON.stringify(t));
    await ouvrirListe(page, "clients"); await attendre(page, 300);
    const l = await page.evaluate(() => ({ compte: document.getElementById("lc-compte").textContent, sel: document.querySelector("[data-sel-debut]").textContent, ph: document.getElementById("lc-q").placeholder,
      filtres: Array.from(document.querySelectorAll("[data-lc-filtre]")).map(x => x.textContent), plus: document.querySelector("[data-lc-plus]").getAttribute("aria-label") }));
    await page.click("[data-sel-debut]"); await attendre(page, 200); await ligne(page, SARAH); await attendre(page, 150);
    const nb = await txt(page, "#lc-nb-sel"); await page.click("[data-sel-archiver]"); await attendre(page, 400);
    const m = await modale(page); await bouton(page, "Archive");
    await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]"), null, { timeout: 8000 }); await attendre(page, 400);
    const toast = await dernierToast(page);
    ok("I2 : listes en anglais : « 5 clients », « Select », « Search for a client by name », All · To handle · Inactive · Archived, « Create an account » ; « 1 selected », « Archive 1 client? » et son texte, « Cancel » / « Archive », « 1 client archived »",
      l.compte === "5 clients" && l.sel === "Select" && l.ph === "Search for a client by name" && JSON.stringify(l.filtres) === '["All","To handle","Inactive","Archived"]' && l.plus === "Create an account" && nb === "1 selected"
        && !!m && m.titre === "Archive 1 client?" && norm(m.corps) === "This account disappears from your lists. You'll find it under “Archived.” Nothing changes for this person." && JSON.stringify(m.boutons) === '["Cancel","Archive"]' && toast === "1 client archived", JSON.stringify({ l, nb, m, toast }));
    await fiche(page, ZOE, "Zoé Martin");
    const f = await page.evaluate(() => ({ onglets: Array.from(document.querySelectorAll("[data-onglet]")).map(x => x.textContent), titre: document.querySelector("#fc-reponses h2").textContent,
      rep: Array.from(document.querySelectorAll("#fc-reponses li span")).map(x => x.textContent), croix: document.getElementById("fc-fermer").getAttribute("aria-label"), role: document.querySelector(".fc-role-p").textContent }));
    ok("I3 : fiche en anglais : onglets Follow-up / Account, « Their answers » (Goal, What's holding them back, In their own words, In 3 months, You are…?), croix « Close profile »",
      JSON.stringify(f.onglets) === '["Follow-up","Account"]' && f.titre === "Their answers" && JSON.stringify(f.rep) === JSON.stringify(["Goal", "What's holding them back", "In their own words", "In 3 months", "You are…?"]) && f.croix === "Close profile" && f.role === "Prospect", JSON.stringify(f));
  });

  /* =================== W. moteur WebKit (Safari) =================== */
  await bloc("W. WebKit", async () => {
    if (process.env.VERIF86_WEBKIT === "0") return;
    const { webkit } = require("playwright");
    const wb = await webkit.launch();
    try {
      const db = base(); db.emails[COACH.id] = COACH.email;
      const c = await wb.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true }); ouverts.push(c);
      await c.route("**/*", r => repondre(r, db));
      await c.addInitScript(s => { if (!/^https?:$/.test(location.protocol)) return; if (!localStorage.getItem("__init")) { localStorage.setItem("__init", "1"); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); localStorage.setItem("mhx_session", JSON.stringify(s)); } }, session(COACH.id, COACH.email));
      const page = await c.newPage(); const err = [];
      page.on("pageerror", e => err.push(String(e)));
      await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#lc-clients #lc-liste li"); await attendre(page, 400);
      await page.tap("[data-sel-debut]"); await attendre(page, 200); await page.tap('.lc-ligne[data-uid="' + SARAH + '"] [data-lc-ligne]'); await attendre(page, 200);
      await page.tap("[data-sel-archiver]"); await attendre(page, 400);
      const m = await modale(page); await bouton(page, "Archiver");
      await page.waitForFunction(() => !document.querySelector("[data-sel-annuler]"), null, { timeout: 8000 }); await attendre(page, 400);
      const S = suiviDe(db, SARAH) || {};
      ok("W1 : WebKit (moteur de Safari sur iPhone) : liste Clients, sélection au toucher, fenêtre « Archiver 1 client ? », archivage écrit (archive_le), aucune erreur, aucun DELETE",
        !!m && m.titre === "Archiver 1 client ?" && !!S.archive_le && !err.length && sansDelete(db), JSON.stringify({ m, S, err }));
      await page.evaluate(id => Clients.ouvrir(id, "Zoé Martin", "accueil"), ZOE); await pret(page); await page.waitForSelector("#fc-suivi"); await attendre(page, 400);
      await page.tap('[data-onglet="compte"]'); await attendre(page, 200);
      const f = await page.evaluate(() => ({ compte: !document.getElementById("fc-compte").hidden, wa: (document.getElementById("fc-wa") || {}).getAttribute ? document.getElementById("fc-wa").getAttribute("href") : "", deb: document.documentElement.scrollWidth > window.innerWidth + 1 }));
      ok("W2 : WebKit : la fiche d'un prospect, onglet Compte au toucher, lien WhatsApp pré-rempli, aucun débordement", f.compte && f.wa === "https://wa.me/33639980011?text=" + encodeURIComponent(MSG_ZOE) && !f.deb && !err.length, JSON.stringify({ f, err }));
    } finally { await wb.close().catch(() => {}); }
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    ok("Z : aucune requête vers un autre hôte que la page et le faux Supabase", externes.size === 0, JSON.stringify(Array.from(externes)));
  });

  await b.close(); server.close(); bilan();
})().catch(e => { console.log("ERREUR " + (e && e.stack || e)); process.exit(1); });
