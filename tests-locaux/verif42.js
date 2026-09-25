/* v42 — phase 20 : robustesse face aux données malformées.
   Un client peut écrire n'importe quoi dans ses propres clés par l'API (la RLS
   le lui permet). Ce test crée trois clients fictifs aux données piégées et
   parcourt tous les écrans, côté coach et côté client : aucune erreur JS, et
   le tableau de bord du coach continue d'afficher les autres clients.
   Usage : node verif42.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9674;
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML)); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const G1 = "00000000-0000-4000-8000-000000000d01", G2 = "00000000-0000-4000-8000-000000000d02", G3 = "00000000-0000-4000-8000-000000000d03";
const MAJ = "2026-09-24T10:00:00Z";
const pieges = {
  [G1]: { nom: ["Types", "Faux"], cles: {   // mauvais types a l'interieur des objets
    intake: { complet: true, objectif: 42, allergenes: 12, regime_type: {}, poids: "abc", taille: [], age: null, sexe: 5, nom: {}, seances: {}, nb_repas: [], poids_obj: "x" },
    programme: { nom: {}, seances: "x", objectifs: "y", debut: 12345, cycle: "a", duree_semaines: {}, note: [] },
    journal: { seances: { a: 1 } },
    repas: { jours: 5, cible: "x", allergenes: "lait", regime: 3, nb_repas: "z", debut: {} },
    repas_suivi: { hist: [], mange: "x", date: 7, courses: 3, joursCourses: "y" },
    mens: { mesures: { a: 1 }, zones: "x", pstart: "abc", dstart: 5, affichees: 3, compo_affichee: "z" },
    objectifs_faits: { faits: "x", mois: 3 },
    checkins: { liste: { a: 1 } },
    complements: { liste: "x", note: [] },
    calc: { poids: "x", taille: {}, age: [], sexe: 1, objectif: 2, pas: "z", heures: {} },
    formation: { coches: [], defis: "x", notes: 5, objectifs: "a", priorites: [], diete: 3, ouvert: {} },
    hist_programme: { liste: "x" }, hist_repas: { liste: 3 },
    prefs: { langue: {} }, photos: { liste: "x" }
  } },
  [G2]: { nom: ["Contenus", "Bruts"], cles: {   // le contenu lui-meme n'est pas un objet
    intake: "texte", programme: 42, journal: [1, 2], repas: null, repas_suivi: true, mens: "x",
    objectifs_faits: 7, checkins: [], complements: "y", calc: [3], formation: 5, prefs: "en", photos: 9, hist_programme: "z", hist_repas: [null]
  } },
  [G3]: { nom: ["Listes", "Piégées"], cles: {   // des elements de listes invalides
    intake: { complet: true, objectif: "Perte de poids", allergenes: "Gluten, Lait", poids: 80, taille: 170, age: 30, sexe: "Femme" },
    programme: { nom: "P", seances: [null, 3, { nom: 3, exercices: "x" }, { nom: "A", exercices: [null, 7, { nom: {}, series: [], reps: {} }] }], objectifs: { mois: "2026-09", liste: [null, 3, {}], statuts: "x" }, debut: "2026-09-01" },
    journal: { seances: [null, 3, "x", { date: 5, exos: "y" }, { date: "2026-09-20", si: "a", exos: [null, { nom: 3, series: "z" }, { nom: "Squat", series: [null, { r: "a", c: {} }] }] }] },
    repas: { cible: { kcal: "x", prot: {} }, jours: [null, 3, { repas: "x" }, { nom: 4, repas: [null, 5, { nom: 3, aliments: "y", kcal: "z" }] }] },
    repas_suivi: { hist: { "2026-09-20": "x", "2026-09-21": { c: "a", p: {} }, "pas-une-date": { c: 1, p: 2 } }, mange: { "0:1": "oui" } },
    mens: { mesures: [null, 3, { sem: "a", date: 5, poids: "x", vals: 3, compo: "y" }, { sem: 2, date: "2026-09-10", poids: 80, vals: { 0: "x", 1: {} } }], zones: [null, 3], affichees: [99, "a"] },
    objectifs_faits: { mois: "2026-09", faits: [null, "x", {}] },
    checkins: { liste: [null, 3, { semaine: 3, reponses: "x" }, { semaine: "2026-09-15", fin: 4, envoye_le: {}, reponses: { humeur: {} } }] },
    complements: { liste: [null, 3, { nom: {}, dose: [], par100: "x" }] },
    formation: { coches: { a: {} }, notes: [null, 3], objectifs: [null, {}], defis: { x: [] } },
    hist_programme: { liste: [null, 3, { nom: {}, du: 4, contenu: "x" }] }, hist_repas: { liste: [{ nom: "R", contenu: null }] },
    prefs: { langue: "fr" }, photos: { liste: [null, 3, { semaine: "x", vues: [] }] }
  } }
};
const profils = JSON.parse(JSON.stringify(F.profils)).map(p => Object.assign({ statut: "client" }, p));
const donnees = JSON.parse(JSON.stringify(F.donnees));
for (const [id, g] of Object.entries(pieges)) {
  profils.push({ id, prenom: g.nom[0], nom: g.nom[1], role: "client", cree_le: "2026-09-12T10:00:00Z", statut: "client" });
  for (const [outil, contenu] of Object.entries(g.cles)) donnees.push({ user_id: id, outil, contenu, maj_le: MAJ });
}
async function contexte(b, who, erreurs, opts) {
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  const coach = who.id === F.IDS.coach;
  await c.route("**/*", async r => {
    const req = r.request(); const url = new URL(req.url());
    if (url.hostname === "localhost") return r.continue();
    if (!url.hostname.endsWith(".supabase.co")) return r.abort();
    const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
    if (p.startsWith("/auth/v1/")) return json({});
    if (p.startsWith("/storage/v1/")) return json({ statusCode: "404", error: "not_found", message: "Object not found" }, 400);
    if (p === "/rest/v1/profils") { if (m !== "GET") return json([], 200); const id = q.get("id"); return json(id ? profils.filter(x => x.id === id.slice(3)) : (coach ? profils : profils.filter(x => x.id === who.id))); }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") { erreurs.ecritures.push(m + " " + (req.postData() || "").slice(0, 600)); return json(null, 201); }
      const uid = q.get("user_id"), o = q.get("outil") || "";
      if (opts.lent && opts.lent.includes(o)) await new Promise(ok => setTimeout(ok, 1500));   // reseau lent sur cette cle
      if (opts.enPanne && opts.enPanne.includes(o)) return r.abort();                           // lecture en panne sur cette cle
      let l = donnees.filter(x => coach || (x.user_id === who.id && x.outil !== "notes_coach"));
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
  await c.addInitScript(({ s }) => { localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }, { s: who.session });
  const page = await c.newPage();
  page.on("pageerror", e => erreurs.js.push(erreurs.ici + " : " + String(e).slice(0, 160)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) erreurs.js.push(erreurs.ici + " : console " + msg.text().slice(0, 160)); });
  page.on("dialog", d => { erreurs.js.push(erreurs.ici + " : dialogue natif"); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const PAGES_CLIENT = ["accueil", "programme", "nutrition", "mensurations", "suivi", "bilan", "formation", "complements", "profil"];
const PAGES_FICHE = ["accueil", "bilan", "suivi", "profil", "programme", "nutrition", "calculateur", "mensurations", "entrainement"];

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
  /* ---------- Coach : tableau de bord, Mes clients, fiches piégées ---------- */
  {
    const E = { js: [], ecritures: [], ici: "" };
    const { c, page } = await contexte(b, coach, E);
    E.ici = "coach tableau"; await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2200);
    const tb = await page.textContent("#vue");
    ok("coach : le tableau de bord s'affiche et montre les clients sains (Thomas, Julien)", tb.includes("Clients actifs") && /Thomas|Julien/.test(tb), tb.slice(0, 160));
    E.ici = "coach mes clients"; await page.evaluate(() => { location.hash = "#/clients"; }); await attendre(page, 2200);
    const lignes = await page.$$eval("#tb-clients tr", l => l.map(x => x.textContent));
    ok("coach : « Mes clients » liste les 3 clients sains ET les 3 piégés", ["Thomas", "Sarah", "Julien", "Types", "Contenus", "Listes"].every(n => lignes.some(t => t.includes(n))), lignes.length + " lignes");
    for (const [id, g] of Object.entries(pieges)) {
      const nom = g.nom.join(" ");
      for (const pg of PAGES_FICHE) {
        E.ici = "fiche " + nom + " / " + pg;
        await page.evaluate(([id, nom, pg]) => { if (Store.idConsulte !== id){ Store.oublier(Store.idConsulte); Store.idConsulte = id; Store.nomConsulte = nom; } location.hash = "#/" + pg; }, [id, nom, pg]);
        await attendre(page, 1300);
        await page.evaluate(() => { location.hash = "#/clients"; }); await attendre(page, 250);
      }
    }
    ok("coach : aucune erreur JS sur le tableau, Mes clients et les 27 pages des fiches piégées", E.js.length === 0, E.js.length + " erreur(s) : " + E.js.slice(0, 12).join(" | "));
    ok("coach : aucune écriture en parcourant les fiches", E.ecritures.length === 0, E.ecritures.slice(0, 5).join(" | "));
    await c.close();
  }
  /* ---------- Chaque client piégé dans son propre espace ---------- */
  for (const [id, g] of Object.entries(pieges)) {
    const nom = g.nom.join(" ");
    const E = { js: [], ecritures: [], ici: "" };
    const who = { id, email: "g@e.fr", session: F.session(id, "g@e.fr") };
    const { c, page } = await contexte(b, who, E);
    E.ici = nom + " / accueil"; await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2000);
    for (const pg of PAGES_CLIENT) { E.ici = nom + " / " + pg; await page.evaluate(x => { location.hash = "#/" + x; }, pg); await attendre(page, 1300); }
    const vue = await page.textContent("#vue");
    ok(nom + " : ses 9 pages s'ouvrent sans erreur JS", E.js.length === 0, E.js.length + " erreur(s) : " + E.js.slice(0, 12).join(" | "));
    ok(nom + " : la dernière page (Profil) est bien affichée", vue.length > 50);
    await c.close();
  }
  /* ---------- Quitter une page pendant son chargement : pas de fausse alerte ---------- */
  for (const [depart, arrivee, lent] of [["mensurations", "nutrition", ["eq.mens"]], ["profil", "programme", ["eq.intake"]]]) {
    const E = { js: [], ecritures: [], ici: "course " + depart };
    const who = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
    const { c, page } = await contexte(b, who, E, { lent });
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2500);
    await page.evaluate(x => { Store.oublier(Auth.utilisateur().id); location.hash = "#/" + x; }, depart);   // cache vide : la lecture repart sur le reseau
    await attendre(page, 200);
    await page.evaluate(x => { location.hash = "#/" + x; }, arrivee); await attendre(page, 3000);
    ok(`quitter « ${depart} » pendant son chargement : aucune fausse alerte sur « ${arrivee} », aucune erreur`, !(await page.$("#page-illisible")) && E.js.length === 0, E.js.join(" | "));
    await c.close();
  }
  /* ---------- Une donnée lue pour un client n'est jamais écrite chez un autre ---------- */
  {
    const E = { js: [], ecritures: [], ici: "croise" };
    const { c, page } = await contexte(b, coach, E);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    const r = await page.evaluate(async ([a, bb]) => {
      Store.idConsulte = a; Store.nomConsulte = "A";
      const P = await Store.lire("programme", {});            // lu pour A
      Store.oublier(a); Store.idConsulte = bb; Store.nomConsulte = "B";   // le coach est passé sur la fiche de B
      Store.ecrire("programme", P);                           // page périmée : doit être refusé
      const Q = await Store.lire("programme", {});            // lu pour B
      Q.note = "note du coach pour B"; Store.ecrire("programme", Q);   // écriture légitime chez B
      await new Promise(ok => setTimeout(ok, 1200));
      Store.idConsulte = null; Store.nomConsulte = null;
      return true;
    }, [F.IDS.c1, F.IDS.c2]);
    const chezB = E.ecritures.filter(x => x.includes(F.IDS.c2));
    ok("donnée lue pour A puis écrite après être passé sur B : refusée ; l'écriture légitime chez B part", r && chezB.length === 1 && chezB[0].includes("note du coach pour B") && !E.ecritures.some(x => x.includes(F.IDS.c1)), JSON.stringify(E.ecritures).slice(0, 300));
    await c.close();
  }
  /* ---------- Changement de fiche pendant une opération : rien ne passe d'un client à l'autre ---------- */
  {
    const E = { js: [], ecritures: [], ici: "fiches" };
    const { c, page } = await contexte(b, coach, E);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    const r = await page.evaluate(async ([a, bb]) => {
      const out = {};
      /* 1. un envoi en attente part quand meme apres « Revenir a mes clients » (compte fige) */
      Store.idConsulte = a; Store.nomConsulte = "A";
      const P = await Store.lire("programme", {}); P.note = "envoi juste avant de quitter";
      out.ecrit = Store.ecrire("programme", P);
      Store.oublier(a); Store.idConsulte = null; Store.nomConsulte = null;
      await new Promise(ok => setTimeout(ok, 1100));
      /* 2. un remplacement commence chez A et termine chez B : abandonne, rien dans l'historique de B */
      Store.idConsulte = a;
      const R = await Store.lire("repas", {});
      Store.oublier(a); Store.idConsulte = bb;
      out.remplacement = await Historique.avantRemplacement("repas", R);
      out.ecritureB = Store.ecrire("repas", R);
      out.toast = (document.querySelector(".toast") || {}).textContent || "";
      /* 3. rien de A dans la boite de B */
      out.boiteB = JSON.stringify(Store.boite(bb).repas || null);
      Store.idConsulte = null;
      return out;
    }, [F.IDS.c1, F.IDS.c2]);
    await attendre(page, 900);
    ok("envoi en attente puis retour à « Mes clients » : l'écriture part quand même chez le bon client", r.ecrit === true && E.ecritures.some(x => x.includes(F.IDS.c1) && x.includes("envoi juste avant de quitter")), JSON.stringify(E.ecritures).slice(0, 200));
    ok("remplacement commencé chez A, fini chez B : abandonné, écriture refusée, message affiché, rien chez B", r.remplacement === false && r.ecritureB === false && r.toast.includes("la fiche a changé") && !E.ecritures.some(x => x.includes(F.IDS.c2)) && r.boiteB === "null", JSON.stringify(r).slice(0, 300));
    await c.close();
  }
  {
    /* lecture ratée : l'écriture est refusée (sinon on écraserait la vraie fiche) et on le dit */
    const E = { js: [], ecritures: [], ici: "lecture ratee" };
    const who = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
    const { c, page } = await contexte(b, who, E, { enPanne: ["eq.objectifs_faits"] });
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 1800);
    E.js = [];
    const r = await page.evaluate(async () => {
      const O = await Store.lire("objectifs_faits", { mois: "", faits: [] });
      const ecrit = Store.ecrire("objectifs_faits", O);
      return { ecrit, toast: (document.querySelector(".toast") || {}).textContent || "" };
    });
    await attendre(page, 1000);
    ok("lecture ratée : écriture refusée et « Non enregistré : tes données n'ont pas pu être chargées »", r.ecrit === false && r.toast.includes("n'ont pas pu être chargées") && !E.ecritures.some(x => x.includes("objectifs_faits")), JSON.stringify(r));
    await c.close();
  }
  {
    /* l'objet d'une lecture ratée n'est jamais écrit, même si une lecture plus ancienne réussit après coup */
    const E = { js: [], ecritures: [], ici: "non lu" };
    const who = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
    const { c, page } = await contexte(b, who, E, { enPanne: ["eq.mens"] });
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 1800);
    const r = await page.evaluate(async () => {
      const D = await Store.lire("mens", { mesures: [] });                  // en panne : défaut marqué « non lu »
      Store.charge[Auth.utilisateur().id + "|mens"] = true;                 // comme si une lecture plus ancienne avait réussi après coup
      D.mesures.push({ sem: 30, poids: 80 });
      return Store.ecrire("mens", D);
    });
    await attendre(page, 1000);
    ok("objet d'une lecture ratée : jamais écrit, même si le drapeau repasse à « lu » (les vraies mesures ne sont pas écrasées)", r === false && !E.ecritures.some(x => x.includes('"mens"')), JSON.stringify(E.ecritures).slice(0, 200));
    await c.close();
  }
  /* ---------- Filet de sécurité : une page qui plante le dit, et le reste marche ---------- */
  {
    const E = { js: [], ecritures: [], ici: "" };
    const who = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
    const { c, page } = await contexte(b, who, E);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 1800);
    await page.evaluate(() => { outilComplements.init = async () => { throw new Error("panne simulée"); }; location.hash = "#/complements"; });
    await attendre(page, 1200);
    const msg = await page.textContent("#page-illisible").catch(() => "");
    ok("filet de sécurité : la page en panne affiche un message clair", msg.includes("n'a pas pu s'afficher"), msg);
    ok("filet de sécurité : l'erreur reste visible dans la console (pour le banc)", E.js.some(x => x.includes("[MHX] page illisible (complements)")) && E.js.every(x => x.includes("[MHX] page illisible")), E.js.join(" | "));
    E.js = [];
    await page.evaluate(() => { location.hash = "#/programme"; }); await attendre(page, 1400);
    ok("filet de sécurité : les autres pages fonctionnent ensuite", !(await page.$("#page-illisible")) && (await page.textContent("#vue")).includes("Séance") && E.js.length === 0, E.js.join(" | "));
    await c.close();
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
