/* verif103 — v103 (décision 8 de Lucas, 10/11/2026) : la fonction serveur supprimer-acces efface aussi les brouillons du
   coach (programme et diète) préparés pour le compte supprimé. Sans navigateur : la fonction (TypeScript de Deno) est
   chargée dans Node, Deno et fetch sont simulés (une petite base en mémoire, comptes fictifs, aucune donnée réelle,
   aucun appel réseau).
   Fichiers testés : supabase/fonctions/supprimer-acces/index.ts (la nouvelle version, pas encore déployée) et, pour la
   preuve, supabase/releve-2026-09-30/fonctions/supprimer-acces/index.ts (la version en ligne).
   Usage : node verif103.js [../index.html]   (l'argument est ignoré : même appel que les autres suites du banc) */
const fs = require("fs"); const path = require("path");
const { stripTypeScriptTypes } = require("node:module");

const NOUVELLE = path.join(__dirname, "..", "supabase", "fonctions", "supprimer-acces", "index.ts");
const EN_LIGNE = path.join(__dirname, "..", "supabase", "releve-2026-09-30", "fonctions", "supprimer-acces", "index.ts");
const URL_SB = "https://simule.supabase.test";

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
}

/* ---------- comptes fictifs ---------- */
const COACH = "c0000000-0000-4000-8000-000000000001";
const A = "a0000000-0000-4000-8000-00000000000a";   // le client qui part
const B = "b0000000-0000-4000-8000-00000000000b";   // un autre client
const MAJ0 = "2026-11-09T10:00:00.123456+00:00";
const clone = x => JSON.parse(JSON.stringify(x));

function donneesDeBase(){
  return [
    { user_id: COACH, outil: "brouillons_programme", maj_le: MAJ0, contenu: { v: 1, clients: {
      [A]: { programme: { nom: "Bloc 2", seances: [] }, base_maj: null, debut_le: "2026-11-08T08:00:00.000Z", ecrit_le: "2026-11-08T09:00:00.000Z", appareil: "abc" },
      [B]: { programme: { nom: "Bloc 1", seances: [] }, base_maj: null, debut_le: "2026-11-07T08:00:00.000Z", ecrit_le: "2026-11-07T09:00:00.000Z", appareil: "abc" } } } },
    { user_id: COACH, outil: "brouillons_repas", maj_le: MAJ0, contenu: { v: 1, clients: {
      [A]: { programme: { nom: "Diète sèche", jours: [] }, ecrit_le: "2026-11-08T10:00:00.000Z", appareil: "abc" },
      [B]: { programme: { nom: "Diète masse", jours: [] }, ecrit_le: "2026-11-07T10:00:00.000Z", appareil: "abc" } } } },
    { user_id: A, outil: "programme", maj_le: MAJ0, contenu: { nom: "Bloc 1" } },
    { user_id: B, outil: "programme", maj_le: MAJ0, contenu: { nom: "Bloc 1" } }
  ];
}

/* ---------- la base simulée (ce que la fonction appelle : auth, profils, donnees, bibliotheque, photos) ---------- */
function base(opts = {}){
  const B0 = {
    profils: [{ id: COACH, role: "coach" }, { id: A, role: "client" }, { id: B, role: "client" }],
    donnees: opts.donnees || donneesDeBase(),
    users: new Set([COACH, A, B]),
    appels: [], lectures: 0
  };
  const filtre = (sp, l) => [...sp.entries()].every(([k, v]) => {
    if (k === "select") return true;
    if (v.startsWith("eq.")) return String(l[k]) === v.slice(3);
    if (v.startsWith("in.(")) return v.slice(4, -1).split(",").indexOf(String(l[k])) > -1;
    if (v === "is.null") return l[k] == null;
    throw new Error("filtre inconnu " + k + "=" + v);
  });
  const rep = (c, s = 200) => new Response(JSON.stringify(c), { status: s, headers: { "Content-Type": "application/json" } });
  B0.fetch = async (url, init = {}) => {
    const u = new URL(String(url)), m = String(init.method || "GET").toUpperCase(), sp = u.searchParams;
    B0.appels.push(m + " " + u.origin + u.pathname + u.search);
    if (u.origin !== URL_SB) return rep({ message: "hors base" }, 599);
    const h = new Headers(init.headers || {});
    if (u.pathname === "/auth/v1/user"){
      const id = (h.get("Authorization") || "").replace(/^Bearer jeton-/, "");
      return B0.users.has(id) ? rep({ id }) : rep({ msg: "jeton" }, 401);
    }
    if (u.pathname.startsWith("/auth/v1/admin/users/") && m === "DELETE"){ B0.users.delete(u.pathname.split("/").pop()); return rep({}); }
    if (u.pathname === "/storage/v1/object/list/photos") return rep([]);
    if (u.pathname === "/rest/v1/profils"){
      if (m === "GET") return rep(B0.profils.filter(l => filtre(sp, l)).map(clone));
      if (m === "DELETE"){ B0.profils = B0.profils.filter(l => !filtre(sp, l)); return new Response(null, { status: 204 }); }
    }
    if (u.pathname === "/rest/v1/bibliotheque" && m === "DELETE") return new Response(null, { status: 204 });
    if (u.pathname === "/rest/v1/donnees"){
      if (m === "GET"){
        B0.lectures++;
        if (opts.lectureRatee) return rep({ message: "panne" }, 503);
        const l = B0.donnees.filter(x => filtre(sp, x)).map(clone);
        if (opts.apresLecture) opts.apresLecture(B0);   // le coach écrit entre la lecture et l'écriture de la fonction
        return rep(l);
      }
      if (m === "PATCH"){
        const corps = JSON.parse(init.body);
        const l = B0.donnees.filter(x => filtre(sp, x));
        l.forEach(x => Object.assign(x, clone(corps)));
        return rep(l.map(x => ({ user_id: x.user_id })));
      }
      if (m === "DELETE"){ B0.donnees = B0.donnees.filter(x => !filtre(sp, x)); return new Response(null, { status: 204 }); }
    }
    return rep({ message: "inconnu " + m + " " + u.pathname }, 404);
  };
  return B0;
}

/* ---------- la fonction, chargée comme Deno le ferait (TypeScript sans types, Deno.serve capturé) ---------- */
function charger(fichier, b){
  const code = stripTypeScriptTypes(fs.readFileSync(fichier, "utf8"));
  let gestion = null;
  const Deno = { env: { get: k => ({ SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: "cle-service-simulee" })[k] }, serve: f => { gestion = f; } };
  new Function("Deno", "fetch", code)(Deno, b.fetch);
  if (typeof gestion !== "function") throw new Error("Deno.serve non appelé");
  return gestion;
}
async function appeler(fichier, b, qui, corps){
  const g = charger(fichier, b);
  const r = await g(new Request(URL_SB + "/functions/v1/supprimer-acces", {
    method: "POST", headers: { Authorization: "Bearer jeton-" + qui, "Content-Type": "application/json" }, body: JSON.stringify(corps)
  }));
  return { statut: r.status, corps: await r.json().catch(() => null) };
}
const ligne = (b, uid, outil) => b.donnees.find(x => x.user_id === uid && x.outil === outil);
const marque = e => !!e && typeof e === "object" && !e.programme && typeof e.retire_le === "string" && e.retire_le === e.ecrit_le && e.appareil === "serveur";
const ecrituresBrouillons = b => b.appels.filter(a => /^PATCH /.test(a));
const effacements = b => b.appels.filter(a => /^DELETE /.test(a));

(async () => {
  await bloc("A. le client supprime son compte", async () => {
    const b = base(), avant = clone(b.donnees);
    const r = await appeler(NOUVELLE, b, A, { confirmation: "SUPPRIMER" });
    ok("A1 : le client supprime son compte : réponse 200 « supprimé, soi-même »", r.statut === 200 && r.corps && r.corps.supprime === A && r.corps.soi_meme === true, JSON.stringify(r));
    const P = ligne(b, COACH, "brouillons_programme"), R = ligne(b, COACH, "brouillons_repas");
    ok("A2 : sur le compte du coach, son brouillon de programme ET son brouillon de diète sont remplacés par une marque de retrait datée, sans contenu",
      !!P && !!R && marque(P.contenu.clients[A]) && marque(R.contenu.clients[A]), JSON.stringify([P && P.contenu.clients[A], R && R.contenu.clients[A]]));
    const avP = avant.find(x => x.outil === "brouillons_programme"), avR = avant.find(x => x.outil === "brouillons_repas");
    ok("A3 : les brouillons des autres clients et le reste des deux documents ne bougent pas",
      !!P && !!R && JSON.stringify(P.contenu.clients[B]) === JSON.stringify(avP.contenu.clients[B]) && JSON.stringify(R.contenu.clients[B]) === JSON.stringify(avR.contenu.clients[B])
      && P.contenu.v === 1 && R.contenu.v === 1 && Object.keys(P.contenu.clients).length === 2 && Object.keys(R.contenu.clients).length === 2, JSON.stringify([P, R]));
    ok("A4 : les deux lignes ont une nouvelle date (maj_le) : l'app du coach voit qu'elles ont changé",
      !!P && !!R && P.maj_le !== MAJ0 && R.maj_le !== MAJ0 && P.maj_le === P.contenu.clients[A].ecrit_le, JSON.stringify([P && P.maj_le, R && R.maj_le]));
    ok("A5 : comme avant, ses données, son profil et son compte sont effacés ; l'autre client et le coach restent",
      !b.donnees.some(x => x.user_id === A) && !b.profils.some(x => x.id === A) && !b.users.has(A) && !!ligne(b, B, "programme") && b.users.has(COACH) && b.users.has(B), JSON.stringify([b.donnees.map(x => x.user_id + "|" + x.outil), [...b.users]]));
    ok("A6 : les brouillons sont retirés AVANT tout effacement (en cas d'échec, rien n'est encore supprimé)",
      (() => { const i = b.appels.findIndex(a => /^PATCH /.test(a)), j = b.appels.findIndex(a => /^DELETE |object\/list/.test(a)); return i > -1 && j > i; })(), b.appels.join(" | "));
    ok("A7 : aucun appel en dehors de la base (adresse lue dans l'environnement, comme en ligne)", b.appels.every(a => a.indexOf(URL_SB + "/") > -1), b.appels.join(" | "));
  });

  await bloc("B. preuve : la version en ligne", async () => {
    const b = base();
    const r = await appeler(EN_LIGNE, b, A, { confirmation: "SUPPRIMER" });
    const P = ligne(b, COACH, "brouillons_programme"), R = ligne(b, COACH, "brouillons_repas");
    ok("B1 : preuve que ce test voit la différence : avec la version en ligne (supabase/releve-2026-09-30), le compte part mais ses brouillons restent chez le coach",
      r.statut === 200 && !b.users.has(A) && !!P && !!P.contenu.clients[A].programme && !!R.contenu.clients[A].programme, JSON.stringify([r, P && P.contenu.clients[A]]));
  });

  await bloc("C. le coach écrit au même instant", async () => {
    const NOUVEAU = "d0000000-0000-4000-8000-00000000000d";
    let fait = false;
    const b = base({ apresLecture: B0 => {
      if (fait) return; fait = true;
      const P = B0.donnees.find(x => x.user_id === COACH && x.outil === "brouillons_programme");
      P.contenu.clients[NOUVEAU] = { programme: { nom: "Bloc 1" }, ecrit_le: "2026-11-10T08:00:00.000Z", appareil: "abc" };
      P.maj_le = "2026-11-10T08:00:00.654321+00:00";
    } });
    const r = await appeler(NOUVELLE, b, A, { confirmation: "SUPPRIMER" });
    const P = ligne(b, COACH, "brouillons_programme");
    ok("C1 : le coach écrit un brouillon entre la lecture et l'écriture de la fonction : rien d'écrasé (on relit), son nouveau brouillon reste, celui du compte supprimé part",
      r.statut === 200 && b.lectures >= 2 && !!P && !!P.contenu.clients[NOUVEAU] && !!P.contenu.clients[NOUVEAU].programme && marque(P.contenu.clients[A]) && !!P.contenu.clients[B].programme, JSON.stringify([r, b.lectures, P && Object.keys(P.contenu.clients)]));
  });

  await bloc("D. échecs", async () => {
    const b = base({ lectureRatee: true });
    const r = await appeler(NOUVELLE, b, A, { confirmation: "SUPPRIMER" });
    ok("D1 : brouillons illisibles (panne de la base) : erreur 500 avec un message clair, rien d'effacé (ni photos, ni données, ni profil, ni compte)",
      r.statut === 500 && /rien n'a été supprimé/.test(r.corps && r.corps.erreur) && !effacements(b).length && !b.appels.some(a => /object\/list/.test(a)) && b.users.has(A) && !!ligne(b, A, "programme"), JSON.stringify([r, b.appels]));
    let n = 0;
    const b2 = base({ apresLecture: B0 => { B0.donnees.forEach(x => { if (x.outil.startsWith("brouillons_")) x.maj_le = "2026-11-10T0" + (n % 10) + ":00:00.000001+00:00"; }); n++; } });
    const r2 = await appeler(NOUVELLE, b2, A, { confirmation: "SUPPRIMER" });
    ok("D2 : la ligne du coach change à chaque essai : 3 essais au plus, puis erreur 500, rien d'effacé et aucun brouillon écrasé",
      r2.statut === 500 && b2.lectures === 3 && !effacements(b2).length && b2.users.has(A) && !!ligne(b2, COACH, "brouillons_programme").contenu.clients[A].programme, JSON.stringify([r2, b2.lectures, b2.appels.length]));
  });

  await bloc("E. le coach supprime un client", async () => {
    const b = base();
    const r = await appeler(NOUVELLE, b, COACH, { id: A, confirmation: "SUPPRIMER" });
    const P = ligne(b, COACH, "brouillons_programme"), R = ligne(b, COACH, "brouillons_repas");
    ok("E1 : quand le coach supprime un client, ses brouillons partent aussi (garanti côté serveur, en plus de l'app)",
      r.statut === 200 && r.corps.soi_meme === false && !b.users.has(A) && marque(P.contenu.clients[A]) && marque(R.contenu.clients[A]) && !!P.contenu.clients[B].programme, JSON.stringify([r, P && P.contenu.clients[A]]));
  });

  await bloc("F. rien à retirer", async () => {
    const d = donneesDeBase();
    delete d[0].contenu.clients[A];
    d[1].contenu.clients[A] = { retire_le: "2026-11-01T00:00:00.000Z", ecrit_le: "2026-11-01T00:00:00.000Z", appareil: "abc" };
    const b = base({ donnees: d });
    const r = await appeler(NOUVELLE, b, A, { confirmation: "SUPPRIMER" });
    ok("F1 : aucun brouillon pour ce compte (absent, ou déjà une marque de retrait) : aucune écriture sur les brouillons, suppression normale",
      r.statut === 200 && !ecrituresBrouillons(b).length && !b.users.has(A) && ligne(b, COACH, "brouillons_programme").maj_le === MAJ0 && ligne(b, COACH, "brouillons_repas").maj_le === MAJ0, JSON.stringify([r, ecrituresBrouillons(b)]));
  });

  await bloc("G. refus inchangés", async () => {
    const b = base();
    const r = await appeler(NOUVELLE, b, A, {});
    ok("G1 : sans le mot SUPPRIMER : 400, aucun brouillon touché, rien d'effacé",
      r.statut === 400 && !ecrituresBrouillons(b).length && !effacements(b).length && b.lectures === 0, JSON.stringify([r, b.appels]));
    const b2 = base();
    const r2 = await appeler(NOUVELLE, b2, B, { id: A, confirmation: "SUPPRIMER" });
    ok("G2 : un client ne peut pas supprimer un autre compte : 403, aucun brouillon touché, rien d'effacé",
      r2.statut === 403 && !ecrituresBrouillons(b2).length && !effacements(b2).length && b2.users.has(A), JSON.stringify([r2, b2.appels]));
    const b3 = base();
    const r3 = await appeler(NOUVELLE, b3, COACH, { confirmation: "SUPPRIMER" });
    ok("G3 : le dernier coach ne peut toujours pas supprimer son compte : 400, rien d'écrit",
      r3.statut === 400 && !ecrituresBrouillons(b3).length && !effacements(b3).length && b3.users.has(COACH), JSON.stringify([r3, b3.appels]));
  });

  await bloc("H. le reste de la fonction inchangé", async () => {
    const neuf = fs.readFileSync(NOUVELLE, "utf8"), vieux = fs.readFileSync(EN_LIGNE, "utf8");
    /* la nouvelle version = la version en ligne + l'en-tête v103 + retirerDesBrouillons + son appel : rien d'autre.
       v104 (adapté) : Lucas a demandé de changer le message des photos et d'ajouter une seconde passe après l'effacement :
       ces deux changements v104 (et leur en-tête) sont aussi retirés avant la comparaison ; tout le reste doit être identique */
    const sans = neuf
      .replace(/\n   v104 \(relecture de la v103[\s\S]*?d'échec exacts\.\n/, "")
      .replace(/    \/\* v104 : message exact[\s\S]*?\n    return repondre\(\{ erreur: "Suppression interrompue[^\n]*/, '    return repondre({ erreur: "Les photos n\'ont pas pu être effacées : rien n\'a été supprimé. Réessaie." }, 500);')
      .replace(/\n  \/\* v104 : seconde passe[\s\S]*?catch \{ \/\* au mieux \*\/ \}/, "")
      .replace(/\n\n   v103 \(décision de Lucas[\s\S]*?LISEZMOI\.md de ce dossier\.\n/, "\n")
      .replace(/\/\* v103 — Le coach prépare[\s\S]*?\n}\n\n(?=Deno\.serve)/, "")
      .replace(/\n  \/\* v103 : les brouillons du coach pour ce compte[\s\S]*?\n  }\n(?=\n  \/\* v41 : les photos)/, "");
    ok("H1 : en dehors des ajouts v103 et v104, le fichier est exactement la version en ligne (rien d'autre n'a changé)", sans === vieux,
      (() => { const a = sans.split("\n"), c = vieux.split("\n"); const i = a.findIndex((x, k) => x !== c[k]); return "ligne " + (i + 1) + " : " + a[i] + " ≠ " + c[i]; })());
  });

  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
