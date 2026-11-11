/* verif104 — v104 (gros chantier, partie 1), points 1 à 4 :
   1. les 3 restes de la relecture v103 de la fonction serveur supprimer-acces (sans navigateur, ci-dessous) ;
   2. halo du haut à 25 %, gris pâle à 4,5:1 au moins à nu, dans une carte et dans une réponse choisie, distinct du gris
      moyen (sans navigateur : calcul sur les jetons de css/jetons.css) ;
   3. outils communs de Clients et de Prospects dans js/clients-prospects-communs.js, les 3 fichiers chargés pour le coach
      seulement (fichiers, puis dans le navigateur : client, prospect, coach sur un appareil neuf) ;
   4. fiche d'un client : l'en-tête d'Aperçu est celui des 4 autres onglets (navigateur : blocs A à E, Z).
   Point 1, sans navigateur : la fonction (TypeScript de Deno) est chargée dans Node, Deno et fetch sont simulés (petite base
   en mémoire reprise de verif103, comptes fictifs, aucune donnée réelle, aucun appel réseau) ; côté app, BrouillonProg
   (js/outilProgramme.js) et BrouillonRepas (js/outilNutrition.js) sont extraits du fichier et chargés avec vm, Store, Auth
   et Forme réduits au strict nécessaire.
     1a. brouillon qui revenait : seconde passe du serveur après l'effacement ; la page du coach garde la marque du serveur ;
     1b. photos en échec : message exact (plus « rien n'a été supprimé »), traduit en anglais ;
     1c. seules les lignes des comptes coach sont lues.
   Fichiers testés : supabase/fonctions/supprimer-acces/index.ts, js/outilProgramme.js, js/outilNutrition.js, js/i18n.js.
   Usage : node verif104.js [../index.html]   (l'argument est ignoré : même appel que les autres suites du banc)
           VERIF104_RACINE=/chemin/vers/une/copie node verif104.js   (preuve : la même suite contre une autre version, ex. main) */
const fs = require("fs"); const path = require("path"); const vm = require("vm");
const { stripTypeScriptTypes } = require("node:module");

const RACINE = process.env.VERIF104_RACINE ? path.resolve(process.env.VERIF104_RACINE) : path.join(__dirname, "..");
const FONCTION = path.join(RACINE, "supabase", "fonctions", "supprimer-acces", "index.ts");
const URL_SB = "https://simule.supabase.test";

/* ---------- résultats (comme verif103) ---------- */
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
const NOUVEAU_MSG_PHOTOS = "Suppression interrompue : le compte n'est pas supprimé, mais une partie des photos a pu être effacée. Réessaie.";
const ANCIEN_MSG_PHOTOS = "Les photos n'ont pas pu être effacées : rien n'a été supprimé. Réessaie.";
const MSG_BROUILLONS_PARTIE = "Les brouillons du coach n'ont été mis à jour qu'en partie : le compte n'est pas supprimé. Réessaie.";

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

/* ---------- la base simulée (verif103, plus : profils des coachs illisibles, photos en panne ou réécriture pendant les
   photos, écriture refusée, effacement des photos) ---------- */
function base(opts = {}){
  const B0 = {
    profils: opts.profils || [{ id: COACH, role: "coach" }, { id: A, role: "client" }, { id: B, role: "client" }],
    donnees: opts.donnees || donneesDeBase(),
    users: new Set([COACH, A, B]),
    appels: [], lectures: 0, lecturesCoachs: 0, patchs: 0
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
    if (u.pathname === "/storage/v1/object/list/photos"){
      if (opts.pendantPhotos) opts.pendantPhotos(B0);   // la page du coach écrit pendant l'effacement des photos
      if (opts.photosRatees) return rep({ message: "panne" }, 500);
      return rep([]);
    }
    if (u.pathname === "/storage/v1/object/photos" && m === "DELETE") return rep([]);
    if (u.pathname === "/rest/v1/profils"){
      if (m === "GET"){
        if (sp.get("role") === "eq.coach"){
          B0.lecturesCoachs++;
          if (opts.coachsRates && opts.coachsRates(B0)) return rep({ message: "panne" }, 503);
        }
        return rep(B0.profils.filter(l => filtre(sp, l)).map(clone));
      }
      if (m === "DELETE"){ B0.profils = B0.profils.filter(l => !filtre(sp, l)); return new Response(null, { status: 204 }); }
    }
    if (u.pathname === "/rest/v1/bibliotheque" && m === "DELETE") return new Response(null, { status: 204 });
    if (u.pathname === "/rest/v1/donnees"){
      if (m === "GET"){
        B0.lectures++;
        if (opts.lectureRatee) return rep({ message: "panne" }, 503);
        return rep(B0.donnees.filter(x => filtre(sp, x)).map(clone));
      }
      if (m === "PATCH"){
        B0.patchs++;
        if (opts.patchRate && opts.patchRate(B0.patchs)) return rep({ message: "panne" }, 503);
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

/* ---------- la fonction, chargée comme Deno le ferait (verif103) ---------- */
function charger(fichier, b){
  const code = stripTypeScriptTypes(fs.readFileSync(fichier, "utf8"));
  let gestion = null;
  const Deno = { env: { get: k => ({ SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: "cle-service-simulee" })[k] }, serve: f => { gestion = f; } };
  new Function("Deno", "fetch", code)(Deno, b.fetch);
  if (typeof gestion !== "function") throw new Error("Deno.serve non appelé");
  return gestion;
}
async function appeler(b, qui, corps){
  const g = charger(FONCTION, b);
  const r = await g(new Request(URL_SB + "/functions/v1/supprimer-acces", {
    method: "POST", headers: { Authorization: "Bearer jeton-" + qui, "Content-Type": "application/json" }, body: JSON.stringify(corps)
  }));
  return { statut: r.status, corps: await r.json().catch(() => null) };
}
const ligne = (b, uid, outil) => b.donnees.find(x => x.user_id === uid && x.outil === outil);
const marque = e => !!e && typeof e === "object" && !e.programme && typeof e.retire_le === "string" && e.retire_le === e.ecrit_le && e.appareil === "serveur";
const effacements = b => b.appels.filter(a => /^DELETE /.test(a));
const lecturesBrouillons = b => b.appels.filter(a => /^GET \S+\/rest\/v1\/donnees\?/.test(a) && /brouillons_/.test(decodeURIComponent(a)));

/* ---------- côté app : BrouillonProg et BrouillonRepas extraits de leurs fichiers, chargés avec vm ---------- */
function chargerApp(lignesBase){
  const prog = fs.readFileSync(path.join(RACINE, "js", "outilProgramme.js"), "utf8");
  const nutri = fs.readFileSync(path.join(RACINE, "js", "outilNutrition.js"), "utf8");
  const a = prog.indexOf("const BrouillonProg = {"), z = prog.indexOf("\n};\n", a);
  const a2 = nutri.indexOf("const BrouillonRepas = Object.assign(Object.create(BrouillonProg), {"), z2 = nutri.indexOf("\n});\n", a2);
  if (a < 0 || z < 0 || a2 < 0 || z2 < 0) throw new Error("BrouillonProg ou BrouillonRepas introuvable");
  const ecrits = [];
  const ctx = vm.createContext({
    console, setTimeout, clearTimeout,
    Forme: { objet: v => !!v && typeof v === "object" && !Array.isArray(v) },
    Store: { moi: () => COACH, nonLus: new WeakSet(), lectureRatee(){}, garder(){}, envoyerCle(){},
      ecrire: (cle, D) => { ecrits.push({ cle, D: clone(D) }); return true; } },
    /* la ligne du coach relue par fusionner() (lignesBase : outil → contenu) */
    Auth: { appel: async url => { const o = decodeURIComponent(/outil=eq\.([^&]+)/.exec(url)[1]); return lignesBase && lignesBase[o] ? [{ contenu: clone(lignesBase[o]), maj_le: MAJ0 }] : []; } }
  });
  const o = vm.runInContext(prog.slice(a, z + 3) + "\n" + nutri.slice(a2, z2 + 4) + "\n({ BrouillonProg, BrouillonRepas });", ctx);
  return { BrouillonProg: o.BrouillonProg, BrouillonRepas: o.BrouillonRepas, ecrits };
}
const iso = ms => new Date(Date.now() + ms).toISOString();
const marqueServeur = t => ({ retire_le: t, ecrit_le: t, appareil: "serveur" });

async function principal(){
  /* ===================== Point 1 : supprimer-acces (relecture v103) ===================== */

  await bloc("1a. serveur : écriture de la page pendant la suppression", async () => {
    let fait = false;
    const b = base({ pendantPhotos: B0 => {
      if (fait) return; fait = true;
      /* la page du coach (ouverte sur ce client) réécrit son entrée 700 ms après une frappe : la marque est effacée */
      const P = B0.donnees.find(x => x.user_id === COACH && x.outil === "brouillons_programme");
      P.contenu.clients[A] = { programme: { nom: "Bloc 2 (modifié)", seances: [] }, base_maj: null, debut_le: "2026-11-08T08:00:00.000Z", ecrit_le: new Date(Date.now() + 1000).toISOString(), appareil: "abc" };
      P.maj_le = "2026-11-10T08:00:00.654321+00:00";
    } });
    const r = await appeler(b, A, { confirmation: "SUPPRIMER" });
    const P = ligne(b, COACH, "brouillons_programme"), R = ligne(b, COACH, "brouillons_repas");
    ok("1a-S1 : la page du coach réécrit le brouillon du client pendant l'effacement (après la première passe) : à la fin, la marque du serveur est là (seconde passe), l'autre client ne bouge pas, réponse 200",
      fait && r.statut === 200 && !b.users.has(A) && !!P && marque(P.contenu.clients[A]) && marque(R.contenu.clients[A]) && !!P.contenu.clients[B].programme,
      JSON.stringify([r, fait, P && P.contenu.clients[A]]));

    const b2 = base({ coachsRates: B0 => !B0.users.has(A) });   // la base devient illisible juste après l'effacement du compte
    const r2 = await appeler(b2, A, { confirmation: "SUPPRIMER" });
    ok("1a-S2 : la seconde passe est tentée après l'effacement et, en échec, ne fait pas échouer la réponse (200, compte supprimé)",
      r2.statut === 200 && r2.corps && r2.corps.supprime === A && !b2.users.has(A) && b2.lecturesCoachs >= 2,
      JSON.stringify([r2, b2.lecturesCoachs]));
  });

  await bloc("1a. app : la marque du serveur gagne", async () => {
    for (const nom of ["BrouillonProg", "BrouillonRepas"]){
      const app = chargerApp(null), O = app[nom];
      const mS = marqueServeur(iso(-60000)), page = { programme: { nom: "Page" }, ecrit_le: iso(-1000), appareil: "abc" };
      const mN = { retire_le: iso(-60000), ecrit_le: iso(-60000), appareil: "xyz" };
      const r1 = O.fusionnerEntrees({ v: 1, clients: { [A]: mS } }, { v: 1, clients: { [A]: page } });
      const r2 = O.fusionnerEntrees({ v: 1, clients: { [A]: page } }, { v: 1, clients: { [A]: mS } });
      const r3 = O.fusionnerEntrees({ v: 1, clients: { [A]: mN } }, { v: 1, clients: { [A]: page } });
      ok("1a-A " + nom + ".fusionnerEntrees : une entrée de la page plus récente ne remplace pas une marque du serveur (base ou copie) ; une marque d'appareil normal reste remplaçable comme avant",
        marque(r1.clients[A]) && marque(r2.clients[A]) && !!r3.clients[A] && !!r3.clients[A].programme,
        JSON.stringify([r1.clients[A], r2.clients[A], r3.clients[A]]));
      const vieux = marqueServeur(iso(-40 * 86400000)), pageVieille = { programme: { nom: "Page" }, ecrit_le: iso(-39 * 86400000), appareil: "abc" };
      const r4 = O.fusionnerEntrees({ v: 1, clients: { [A]: vieux, [B]: page } }, { v: 1, clients: { [A]: pageVieille } });
      ok("1a-B " + nom + ".fusionnerEntrees : purge gardée (marque du serveur de plus de 30 jours : l'entrée disparaît, sans revenir), les autres clients restent",
        !(A in r4.clients) && !!r4.clients[B] && !!r4.clients[B].programme, JSON.stringify(r4));
    }

    for (const nom of ["BrouillonProg", "BrouillonRepas"]){
      const cle = nom === "BrouillonProg" ? "brouillons_programme" : "brouillons_repas";
      const autreB = { programme: { nom: "Brouillon de B" }, ecrit_le: iso(-5000), appareil: "def" };
      const mS = marqueServeur(iso(-30000)), mN = { retire_le: iso(-30000), ecrit_le: iso(-30000), appareil: "xyz" };
      const saisie = () => ({ v: 1, clients: { [A]: { programme: { nom: "Saisie de la page" }, ecrit_le: iso(0), appareil: "abc" } } });
      const app = chargerApp({ [cle]: { v: 1, clients: { [A]: mS, [B]: autreB } } }), D = saisie();
      const f1 = await app[nom].fusionner(D, A);
      const e1 = app.ecrits.find(x => x.cle === cle);
      const app2 = chargerApp({ [cle]: { v: 1, clients: { [A]: mN, [B]: autreB } } }), D2 = saisie();
      const f2 = await app2[nom].fusionner(D2, A);
      const e2 = app2.ecrits.find(x => x.cle === cle);
      ok("1a-C " + nom + ".fusionner (700 ms après la saisie) : la base a la marque du serveur → la page l'écrit telle quelle (pas sa saisie) ; marque d'appareil normal → la saisie de la page part comme avant ; les autres clients viennent de la base",
        f1 === true && !!e1 && marque(e1.D.clients[A]) && marque(D.clients[A]) && JSON.stringify(e1.D.clients[B]) === JSON.stringify(autreB)
        && f2 === true && !!e2 && !!e2.D.clients[A] && !!e2.D.clients[A].programme && e2.D.clients[A].programme.nom === "Saisie de la page" && JSON.stringify(e2.D.clients[B]) === JSON.stringify(autreB),
        JSON.stringify([f1, e1 && e1.D.clients[A], f2, e2 && e2.D.clients[A]]));
    }
  });

  await bloc("1b. photos en échec : message exact", async () => {
    const b = base({ photosRatees: true });
    const r = await appeler(b, A, { confirmation: "SUPPRIMER" });
    const err = String((r.corps && r.corps.erreur) || "");
    ok("1b-P1 : photos impossibles à effacer : erreur 500 avec le message exact (compte pas supprimé, une partie des photos a pu être effacée) ; plus « rien n'a été supprimé » ; compte, profil et données encore là",
      r.statut === 500 && err === NOUVEAU_MSG_PHOTOS && !/rien n'a été supprimé/.test(err) && err !== ANCIEN_MSG_PHOTOS
      && b.users.has(A) && b.profils.some(x => x.id === A) && !!ligne(b, A, "programme"), JSON.stringify([r, effacements(b)]));
    const i18n = fs.readFileSync(path.join(RACINE, "js", "i18n.js"), "utf8");
    const traduit = fr => new RegExp(JSON.stringify(fr).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*\"[^\"]+\"").test(i18n);
    ok("1b-P2 : le nouveau message (et celui des brouillons mis à jour en partie) a sa traduction anglaise dans I18N.en (js/i18n.js)",
      traduit(NOUVEAU_MSG_PHOTOS) && traduit(MSG_BROUILLONS_PARTIE), JSON.stringify([traduit(NOUVEAU_MSG_PHOTOS), traduit(MSG_BROUILLONS_PARTIE)]));

    const b2 = base({ patchRate: n => n === 2 });   // le brouillon de programme est retiré, l'écriture de celui de la diète échoue
    const r2 = await appeler(b2, A, { confirmation: "SUPPRIMER" });
    const b3 = base({ lectureRatee: true });
    const r3 = await appeler(b3, A, { confirmation: "SUPPRIMER" });
    ok("1b-P3 : les autres « rien n'a été supprimé » restent vrais : brouillons retirés en partie → message exact (compte pas supprimé), sans « rien n'a été supprimé » ; rien d'écrit (brouillons illisibles) → « rien n'a été supprimé » comme avant ; aucun effacement dans les deux cas",
      r2.statut === 500 && r2.corps && r2.corps.erreur === MSG_BROUILLONS_PARTIE && marque(ligne(b2, COACH, "brouillons_programme").contenu.clients[A]) && !effacements(b2).length && b2.users.has(A)
      && r3.statut === 500 && /rien n'a été supprimé/.test(r3.corps && r3.corps.erreur) && b3.patchs === 0 && !effacements(b3).length && b3.users.has(A),
      JSON.stringify([r2, r3]));
  });

  await bloc("1c. seuls les comptes coach", async () => {
    const d = donneesDeBase();
    /* une ligne brouillons_* sur le compte d'un client (B) qui cite le compte supprimé : ni lue ni modifiée */
    d.push({ user_id: B, outil: "brouillons_programme", maj_le: MAJ0, contenu: { v: 1, clients: { [A]: { programme: { nom: "Copie de B" } , ecrit_le: "2026-11-08T09:00:00.000Z", appareil: "zzz" } } } });
    const avantB = clone(d[d.length - 1]);
    const b = base({ donnees: d });
    const r = await appeler(b, A, { confirmation: "SUPPRIMER" });
    const lus = lecturesBrouillons(b).map(decodeURIComponent);
    const iCoachs = b.appels.findIndex(a => /\/rest\/v1\/profils\?role=eq\.coach&select=id$/.test(a)), iLus = b.appels.findIndex(a => lecturesBrouillons({ appels: [a] }).length);
    ok("1c-L1 : la fonction lit d'abord les comptes coach, puis seulement leurs lignes de brouillons (user_id=in.(coach)) ; la ligne brouillons_* d'un compte client n'est ni lue ni modifiée",
      r.statut === 200 && iCoachs > -1 && iLus > iCoachs && lus.length >= 1 && lus.every(u => u.indexOf("user_id=in.(" + COACH + ")") > -1 && u.indexOf(B) === -1)
      && JSON.stringify(ligne(b, B, "brouillons_programme")) === JSON.stringify(avantB) && !b.appels.some(a => /^PATCH /.test(a) && a.indexOf("user_id=eq." + B) > -1)
      && marque(ligne(b, COACH, "brouillons_programme").contenu.clients[A]),
      JSON.stringify([r, lus, ligne(b, B, "brouillons_programme")]));

    const d2 = donneesDeBase(); d2.push(clone(avantB));
    const b2 = base({ donnees: d2, profils: [{ id: A, role: "client" }, { id: B, role: "client" }] });
    const r2 = await appeler(b2, A, { confirmation: "SUPPRIMER" });
    ok("1c-L2 : aucun compte coach : rien à retirer (aucune lecture de brouillons, aucune écriture), la suppression se fait normalement",
      r2.statut === 200 && !b2.users.has(A) && !lecturesBrouillons(b2).length && b2.patchs === 0 && JSON.stringify(ligne(b2, B, "brouillons_programme")) === JSON.stringify(avantB),
      JSON.stringify([r2, lecturesBrouillons(b2), b2.patchs]));

    const b3 = base({ coachsRates: () => true });
    const r3 = await appeler(b3, A, { confirmation: "SUPPRIMER" });
    ok("1c-L3 : liste des comptes coach illisible : erreur 500 « rien n'a été supprimé », aucun brouillon lu ni écrit, rien d'effacé",
      r3.statut === 500 && /rien n'a été supprimé/.test(r3.corps && r3.corps.erreur) && !lecturesBrouillons(b3).length && b3.patchs === 0 && !effacements(b3).length && b3.users.has(A),
      JSON.stringify([r3, b3.appels]));

    const b4 = base({ profils: [{ id: COACH, role: "coach" }, { id: "pas-un-uuid)", role: "coach" }, { id: A, role: "client" }, { id: B, role: "client" }] });
    const r4 = await appeler(b4, A, { confirmation: "SUPPRIMER" });
    ok("1c-L4 : un identifiant de coach qui n'est pas un UUID n'entre jamais dans l'adresse : erreur 500, rien lu, rien d'effacé",
      r4.statut === 500 && !lecturesBrouillons(b4).length && !effacements(b4).length && b4.users.has(A), JSON.stringify([r4, b4.appels]));
  });

  /* ---------- point 2 : halo du haut à 25 %, gris pâle à 4,5:1 au moins dans les cartes (sans navigateur : calcul sur css/jetons.css) ---------- */
  await bloc("2. contraste du gris pâle", async () => {
    const css = fs.readFileSync(path.join(RACINE, "css", "jetons.css"), "utf8");
    const jeton = n => { const m = new RegExp("--" + n + "\\s*:\\s*([^;]+);").exec(css); return m ? m[1].trim() : null; };
    const hex = h => /^#[0-9a-f]{6}$/i.test(h || "") ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : null;
    const rgba = v => { const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(v || ""); return m ? { c: [+m[1], +m[2], +m[3]], a: +m[4] } : null; };
    const lin = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
    const L = ([r, g, b]) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    const C = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const sur = (h, f) => h.c.map((t, i) => t * h.a + f[i] * (1 - h.a));
    const sol = hex(jeton("ground")), halo1 = rgba(jeton("halo-1")), verre = rgba(jeton("verre")), choisi = rgba(jeton("verre-choisi"));
    const ink = hex(jeton("ink")), ink2 = hex(jeton("ink-2")), ink3 = hex(jeton("ink-3"));
    if (!sol || !halo1 || !verre || !choisi || !ink || !ink2 || !ink3) throw new Error("jetons illisibles dans css/jetons.css");
    /* le pire endroit : le centre du halo du haut (sa couleur à pleine opacité de --halo-1, posée sur le fond) */
    const fHalo = sur(halo1, sol), fCarte = sur(verre, fHalo), fChoisi = sur(choisi, fHalo);
    ok("2-H1 : le halo du haut est à 25 % (--halo-1)", Math.abs(halo1.a - .25) < 1e-9, jeton("halo-1"));
    ok("2-H2 : le dégradé du fond part bien de --halo-1 (le centre du halo est ce jeton)", /radial-gradient\(circle 300px at 80px 100px,var\(--halo-1\)/.test(css), "dégradé du body introuvable");
    const r = [C(ink3, fHalo), C(ink3, fCarte), C(ink3, fChoisi)].map(x => +x.toFixed(2));
    ok("2-C1 : gris pâle (--ink-3) au centre du halo, à nu : 4,5:1 au moins", r[0] >= 4.5, r[0]);
    ok("2-C2 : gris pâle dans une carte (--verre) au centre du halo : 4,5:1 au moins", r[1] >= 4.5, r[1]);
    ok("2-C3 : gris pâle dans une réponse choisie (--verre-choisi) au centre du halo : 4,5:1 au moins", r[2] >= 4.5, r[2]);
    const d23 = C(ink2, ink3), d12 = C(ink, ink2);
    ok("2-D1 : gris pâle distinct du gris moyen : le gris moyen (--ink-2) est plus clair, écart 1,25:1 au moins", L(ink2) > L(ink3) && d23 >= 1.25, d23.toFixed(3));
    ok("2-D2 : gris moyen distinct du blanc du texte (--ink) : écart 1,25:1 au moins", L(ink) > L(ink2) && d12 >= 1.25, d12.toFixed(3));
    ok("2-D3 : gris moyen à 4,5:1 au moins aux mêmes endroits", [fHalo, fCarte, fChoisi].every(f => C(ink2, f) >= 4.5), [fHalo, fCarte, fChoisi].map(f => C(ink2, f).toFixed(2)).join(" "));
  });

  /* ---------- point 3, sans navigateur : les outils communs dans leur fichier, chargé pour le coach seulement ---------- */
  await bloc("3. séparation des outils communs (fichiers)", async () => {
    const lire = f => { try { return fs.readFileSync(path.join(RACINE, f), "utf8"); } catch (e) { return ""; } };
    const html = lire("index.html"), communs = lire("js/clients-prospects-communs.js"), cl = lire("js/outilClients.js"), pr = lire("js/outilProspects.js"), lo = lire("js/liste-outils.js");
    const liste = nom => { const m = new RegExp("var " + nom + " = \\[([\\s\\S]*?)\\];").exec(html); return m ? (m[1].match(/"[^"]+"/g) || []).map(x => x.slice(1, -1)) : []; };
    const JS = liste("MHX_JS"), COACH = liste("MHX_COACH"), SOCLE = liste("MHX_SOCLE");
    const TROIS = ["js/clients-prospects-communs.js", "js/outilClients.js", "js/outilProspects.js"];
    const COMMUNS = ["Clients", "Archive", "ListeCoach", "Acces", "Commercial", "MessageProspect", "Nouveautes", "Mesure"];
    const PAGES_C = ["outilClients", "outilSuiviClients", "outilComptes"], PAGES_P = ["outilProspects", "outilSuiviCommercial", "outilNewsletter"];
    const def = (src, n) => new RegExp("^const " + n + " = \\{", "m").test(src);
    ok("3-F1 : les 8 outils communs sont définis dans js/clients-prospects-communs.js, et seulement là", COMMUNS.every(n => def(communs, n) && !def(cl, n) && !def(pr, n)),
      COMMUNS.map(n => n + ":" + [def(communs, n), def(cl, n), def(pr, n)].join("/")).join(" "));
    ok("3-F2 : js/outilClients.js et js/outilProspects.js gardent leurs pages (Clients, Suivi détaillé, Comptes ; Prospects, Suivi commercial, Newsletter)",
      PAGES_C.every(n => def(cl, n)) && PAGES_P.every(n => def(pr, n)) && !PAGES_C.concat(PAGES_P).some(n => def(communs, n)));
    ok("3-F3 : le nouveau fichier est dans MHX_JS, juste avant js/outilClients.js, et hors de MHX_SOCLE",
      JS.indexOf(TROIS[0]) > -1 && JS.indexOf(TROIS[0]) + 1 === JS.indexOf(TROIS[1]) && SOCLE.every(f => TROIS.indexOf(f) === -1), JSON.stringify(JS));
    ok("3-F4 : les trois fichiers sont dans MHX_COACH (chargés pour le coach seulement), dans l'ordre de MHX_JS",
      TROIS.every(f => COACH.indexOf(f) > -1) && COACH.every((f, i) => i === 0 || JS.indexOf(COACH[i - 1]) < JS.indexOf(f)), JSON.stringify(COACH));
    ok("3-F5 : la liste des outils saute ces pages quand leur fichier n'est pas chargé (appareil d'un client)",
      PAGES_C.concat(PAGES_P).every(n => lo.indexOf('(typeof ' + n + ' !== "undefined" ? ' + n + " : null)") > -1));
  });

  /* points 3 (chargement réel) et 4 : dans le navigateur */
  await navigateur();
}

/* ==========================================================================================================
   Points 3 et 4, dans un vrai navigateur (Supabase simulé, gabarit de verif99 : coach et clients des fixtures, aucune
   donnée réelle ; port 10140, VERIF104_PORT pour en changer). Tout est dans navigateur() : ses noms (COACH, base, clone…)
   ne touchent pas ceux du point 1 ; les résultats vont dans le même relevé (ok, bilan).
   ========================================================================================================== */
async function navigateur(){
const http = require("http");
const TL = __dirname;
const { chromium } = require("playwright");
const F = require(path.join(TL, "fixtures"));
const HTML = path.join(RACINE, "index.html");   // VERIF104_RACINE : la même suite contre une autre version
const PORT = +process.env.VERIF104_PORT || 10140;
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 }, PETIT = { width: 360, height: 560 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ---------- */
const { servirFichier } = require(path.join(TL, "fichiers"));
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

const ouverts = [];
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" });
const C1 = F.IDS.c1, C2 = F.IDS.c2, TEL1 = "+33639980001", TEL2 = "+33639980002";
const EXTRA = n => "00000000-0000-4000-8000-0000000e" + String(n).padStart(4, "0");

/* ---------- le décor : fixtures.js ; Sarah (c2) est une prospecte ; opts.nombreux : 30 clients de plus (liste longue) ---------- */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = p.id === C2 ? "prospect" : "client"; });
  const donnees = clone(F.donnees);
  donnees.push({ user_id: C1, outil: "contact", contenu: { telephone: TEL1 }, maj_le: avant(J) });
  donnees.push({ user_id: C2, outil: "contact", contenu: { telephone: TEL2 }, maj_le: avant(J) });
  if (opts.nombreux) for (let i = 1; i <= 30; i++) profils.push({ id: EXTRA(i), prenom: "Client" + String(i).padStart(2, "0"), nom: "Démo", role: "client", statut: "client", cree_le: avant((40 + i) * J) });
  return { profils, donnees, ecritures: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [C1]: "thomas@exemple.fr", [C2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [C1]: { prenom: "Thomas", nom: "Démo" }, [C2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    programmes: clone(F.catalogue.programmes_types || []) };
}

/* ---------- le faux Supabase (gabarit de verif99 : lectures, écritures notées, refus RLS) ---------- */
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
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(TL, "..", "donnees", f), "utf8"));   // le catalogue public de la branche (lecture seule)
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p === "/auth/v1/user") {
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: clone(db.meta[moi] || {}) });
  }
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json(null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    if (m === "GET" || m === "HEAD") {
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403);
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, t: Date.now() }, clone(ligne)));
      }
      return json(null, 201);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: o });
    return json([]);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 201);
  if (p === "/rest/v1/programmes_types") {
    if (m === "GET") { const id = q.get("id"); let l = db.programmes; if (id && id.startsWith("eq.")) l = l.filter(x => x.id === id.slice(3)); return json(colonnes(plage(clone(l)), q)); }
    return json(null, 201);
  }
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour le coach, horloge contrôlée ---------- */
const ERREURS = [];
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, lg }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (lg) localStorage.setItem("mhx_langue", lg);   // partie 2 : opts.langue (avec prefs.langue du compte : avecPrefsEnTous)
    }
  }, { s: who ? who.session : null, lg: opts.langue || null });
  await c.clock.install({ time: T0 });
  const page = await c.newPage();
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  page.on("popup", p => p.close().catch(() => {}));
  return { c, page };
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) { try { await page.waitForSelector(sel, { timeout: 10000 }); } catch (e) {} }
  await attendre(page, 500);
}
const URL0 = `http://localhost:${PORT}/`;
/* v106 (lot 2) : 4 onglets — « Son questionnaire » (profil) est sous Aperçu ; « Entraînement » s'appelle « Programme » */
const PAGES = [["accueil", "Aperçu", "#fc-suivi"], ["programme", "Programme", "#pg-publier"], ["nutrition", "Nutrition", "#nu-vue"], ["suivi", "Suivi", "#suivi-reg"], ["profil", "Aperçu", "#q-age"]];
const ouvrir = async (page, uid, chemin, sel) => { await page.goto(URL0 + "#/client/" + uid + "/" + chemin); await pret(page, sel); await attendre(page, 900); };
/* l'en-tête de la page affichée, tel que le coach le voit */
const lireTete = page => page.evaluate(() => {
  const n = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const vis = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  const v = document.getElementById("vue"), be = v.querySelectorAll(".fiche-entete"), b = be[0] || null;
  const m = Array.from(v.querySelectorAll(".masthead")).find(vis) || null;
  const h1s = Array.from(v.querySelectorAll("h1")).filter(vis);
  const sortir = v.querySelectorAll("#sortir-fiche");
  /* ce qui est visible entre le bandeau et le titre de page (rien attendu) */
  const entre = b && m ? Array.from(v.querySelectorAll("*")).filter(e => (b.compareDocumentPosition(e) & 4) && !b.contains(e) && (e.compareDocumentPosition(m) & 4) && !e.contains(m) && vis(e) && n(e.textContent)).map(e => e.tagName + "." + e.className) : null;
  return {
    hash: location.hash, nbBandeaux: be.length, premier: !!b && v.firstElementChild === b,
    enfants: b ? Array.from(b.children).map(c => c.tagName + "." + c.className) : null,
    /* v106 (lot 2) : la ligne de l'en-tête montre le prénom ; le nom entier est sa bulle (title) */
    tete: b ? n((b.querySelector(".fe-nom") || {}).title) : null, prenom: b ? n((b.querySelector(".fe-nom") || {}).textContent) : null,
    srH1: n((Array.from(v.querySelectorAll("h1")).find(h => !vis(h) || h.classList.contains("sr-only")) || {}).textContent) || null, h1Visibles: h1s.filter(h => !h.classList.contains("sr-only")).length,
    nbOnglets: v.querySelectorAll(".fiche-onglets").length, onglets: Array.from(v.querySelectorAll(".fiche-onglets .f-onglet")).map(a => n(a.textContent)),
    ici: n((v.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent) || null,
    pageIci: n((v.querySelector('.fiche-entete a.b-act[aria-current="page"]') || {}).textContent) || null,
    sortir: sortir.length, sortirFin: !!(b && b.querySelector(".fe-ligne > #sortir-fiche:first-child")) /* v106 : la flèche en tête de ligne */, sortirTexte: sortir[0] ? n(sortir[0].textContent) : null,
    titre: m ? { cls: m.className, enfants: Array.from(m.children).map(c => c.tagName + "." + c.className), eyebrow: n((m.querySelector(".eyebrow") || {}).textContent), h1: n((m.querySelector("h1") || {}).textContent) } : null,
    apres: !!(b && m && (b.compareDocumentPosition(m) & 4)), h1Seul: h1s.length === 1 && !!m && m.contains(h1s[0]), entre,
    anciens: ["#fc-fermer", '[id^="fc-tab-"]', "[data-onglet]", ".fc-tete", ".fc-onglets"].filter(s => v.querySelector(s)),
    waVisibles: Array.from(v.querySelectorAll('a[href*="wa.me"]')).filter(vis).map(a => ({ dansBandeau: !!a.closest(".fiche-entete"), texte: n(a.textContent), id: a.id || "" }))
  };
});
/* la forme commune (sans ce qui dépend de l'onglet : onglet marqué, pages, titre) */
const forme = t => JSON.stringify({ premier: t.premier, nbBandeaux: t.nbBandeaux, enfants: t.enfants, tete: t.tete, prenom: t.prenom, h1Visibles: t.h1Visibles, nbOnglets: t.nbOnglets, onglets: t.onglets, sortir: t.sortir, sortirFin: t.sortirFin, sortirTexte: t.sortirTexte,
  titreCls: t.titre && t.titre.cls, titreEnfants: t.titre && t.titre.enfants, apres: t.apres, h1Seul: t.h1Seul });
/* v105 (point 2) : l'Aperçu n'a plus de titre de page visible (un seul en-tête : le bandeau) : sa forme, sans le titre */
const formeSansTitre = t => JSON.stringify(Object.assign(JSON.parse(forme(t)), { titreCls: null, titreEnfants: null, apres: null, h1Seul: null }));
const debordeLarg = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
/* partie 2 : tous les comptes en anglais (prefs.langue, sinon la page se recharge en boucle) */
const avecPrefsEnTous = db => { [F.IDS.coach, C1, C2, F.IDS.c3].forEach(id => { const pr = db.donnees.find(d => d.user_id === id && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: id, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(40 * J) }); }); };


  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris : VERIF104_PORT=10141 node verif104.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A et B. le même en-tête sur chaque onglet (v106 : 4), client puis prospect =================== */
  for (const [qui, uid, nom, statut] of [["client", C1, "Thomas Démo", "Client"], ["prospect", C2, "Sarah Démo", "Prospect"]]) {
    await bloc("A. " + qui, async () => {
      const db = base();
      const { page } = await contexte(b, COACH, db);
      const T = {};
      for (const [ch, ong, sel] of PAGES) { await ouvrir(page, uid, ch, sel); T[ch] = await lireTete(page); }
      const ref = T.programme, aper = T.accueil;
      /* v106 (lot 2) : changement voulu — l'en-tête de la fiche tient sur une ligne (flèche de retour en tête, prénom, statut,
         « vu il y a », WhatsApp, Appeler, Notes, « ⋯ »), puis les 4 onglets, puis la rangée des pages ; plus de phrase d'aide ni
         de titre de page répété (un h1 pour les lecteurs d'écran, au nom de la page ouverte) */
      ok("A1 (" + qui + ") : Programme (référence) : l'en-tête .fiche-entete en premier dans #vue (ligne : retour « Revenir à mes clients » en tête, prénom — nom entier en bulle —, puis les 4 onglets et les pages) ; aucun titre de page visible, h1 « Son programme » pour les lecteurs d'écran",
        ref.nbBandeaux === 1 && ref.premier && JSON.stringify(ref.enfants) === '["DIV.fe-ligne","P.etat fe-temoin","NAV.fiche-onglets","NAV.sous-onglets bandeau-actions fiche-pages"]' /* + la copie du témoin d'enregistrement (vide, cachée) */ && ref.tete === nom && ref.prenom === nom.split(" ")[0]
          && ref.nbOnglets === 1 && JSON.stringify(ref.onglets) === '["Aperçu","Programme","Nutrition","Suivi"]' && ref.sortir === 1 && ref.sortirFin && ref.sortirTexte === "Revenir à mes clients"
          && ref.titre === null && ref.h1Visibles === 0 && ref.srH1 === "Son programme" && ref.pageIci === "Son programme", JSON.stringify(ref));
      for (const [ch, ong] of PAGES) {
        const t = T[ch];
        ok("A2 (" + qui + ") : onglet « " + ong + " » : même en-tête que les autres onglets (même forme et même ordre, onglets une seule fois, un seul « Revenir … »), titre de page au même format, rien entre les deux, « " + ong + " » marqué",
          forme(t) === forme(ref) && t.ici === ong && t.titre === null && !!t.srH1 && t.srH1 === t.pageIci, JSON.stringify({ t, ref: forme(ref) }));   // v106 (lot 2) : aucun titre visible ; le h1 caché porte le nom de la page ouverte
      }
      ok("A3 (" + qui + ") : aucun onglet n'a la croix (#fc-fermer), les boutons Suivi / Compte (#fc-tab-*, [data-onglet]) ni l'ancien en-tête (.fc-tete)",
        PAGES.every(([ch]) => T[ch].anciens.length === 0), JSON.stringify(PAGES.map(([ch]) => [ch, T[ch].anciens])));
      /* v105 (point 2) : changement voulu — l'Aperçu n'a qu'un en-tête, le bandeau « Fiche de … » : plus de bouton « Fiche » (sa
         seule page), plus de grand titre « Fiche » visible (h1 gardé pour les lecteurs d'écran), le nom une seule fois */
      await ouvrir(page, uid, "accueil", "#fc-suivi");
      const A4 = await page.evaluate(nom => { const v = document.getElementById("vue"), vis = e => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 2;
        const w = document.createTreeWalker(v, NodeFilter.SHOW_TEXT); let x, noms = 0, fiches = 0;
        while ((x = w.nextNode())) { const p = x.parentElement; if (!p || !vis(p) || p.closest("[hidden]")) continue; const t = x.nodeValue.replace(/\s+/g, " ").trim(); if (t.includes(nom)) noms++; if (t === "Fiche") fiches++; }
        const h1 = v.querySelector("#acc-vue > h1.sr-only");
        return { noms, prenoms: Array.from(v.querySelectorAll(".fe-nom")).filter(vis).map(e => e.textContent.trim()), fiches, bAct: v.querySelectorAll(".fiche-entete a.b-act").length, h1: (v.querySelector("h1.sr-only") || {}).textContent || null, h1s: v.querySelectorAll("h1").length }; }, nom);
      /* v106 (lot 2) : changement voulu — le prénom une seule fois (en-tête), le nom entier jamais en double ; la rangée des pages
         d'Aperçu : « Aperçu » (marqué) et « Son questionnaire » ; le h1 caché s'appelle « Aperçu » (le nom de son lien) */
      ok("A4 (" + qui + ") : Aperçu (v105, v106) : un seul en-tête — le prénom une seule fois, le nom entier nulle part en double, ni bouton ni grand titre « Fiche » ; rangée « Aperçu » (marqué) · « Son questionnaire » ; un seul h1 « Aperçu », pour les lecteurs d'écran",
        aper.titre === null && aper.pageIci === "Aperçu" && /\/accueil$/.test(aper.hash) && aper.tete === nom && JSON.stringify(A4.prenoms) === JSON.stringify([nom.split(" ")[0]]) && A4.noms === 0 && A4.fiches === 0 && A4.bAct === 2 && A4.h1 === "Aperçu" && A4.h1s === 1, JSON.stringify({ aper, A4 }));
      /* B. l'identité et les actions, sous le titre */
      await ouvrir(page, uid, "accueil", "#fc-suivi");
      const id = await page.evaluate(() => {
        const n = t => String(t || "").replace(/\s+/g, " ").trim(), v = document.getElementById("vue"), m = v.querySelector(".fiche-entete"), f = v.querySelector("#fc-ident"), e = v.querySelector(".fiche-entete");   // v106 (lot 2) : statut, WhatsApp et Appeler dans l'en-tête
        const vis = e => !!e && e.getClientRects().length > 0;
        const textes = Array.from(v.querySelectorAll("a, button")).filter(vis).map(x => n(x.textContent)).filter(Boolean);
        return { sous: !!(m && f && (m.compareDocumentPosition(f) & 4)), avantSuivi: !!(f && (f.compareDocumentPosition(v.querySelector("#fc-suivi")) & 4)),
          avatar: n((f && f.querySelector(".fc-avatar") || {}).textContent), nom: n((f && f.querySelector("h2") || {}).textContent), role: n((e && e.querySelector(".fe-statut") || {}).textContent), roleIdent: !!(f && f.querySelector(".fc-role-p, .fe-statut")),
          call: f && f.querySelector("#fc-call") ? n(f.querySelector("#fc-call").textContent) : null, wa: e && e.querySelector("[data-fiche-wa] a") ? { t: n(e.querySelector("[data-fiche-wa] a").getAttribute("aria-label")), href: e.querySelector("[data-fiche-wa] a").getAttribute("href") } : null, waIdent: !!(f && f.querySelector("#fc-wa, a[href*='wa.me']")),
          appeler: e && e.querySelector("#fc-appeler") ? e.querySelector("#fc-appeler").getAttribute("href") : null, appelerIdent: !!(f && f.querySelector("#fc-appeler")),
          doublons: textes.filter((x, i) => /whatsapp/i.test(x) && textes.indexOf(x) !== i) };
      });
      const T2 = await lireTete(page);
      if (qui === "client") {
        /* v106 (lot 2) : changement voulu — « Client », WhatsApp (message prêt) et Appeler sont dans l'en-tête, une seule fois ;
           v106 (lot 4, test QA) : plus de bouton « Préparer le call » / « Bilans » sur l'Aperçu (la carte du dernier retour et l'onglet Suivi y mènent) */
        ok("B1 (client) : en-tête : « Client », WhatsApp (message prêt : « Salut Thomas 👋 »), Appeler (tel:) ; sous l'en-tête, avant le Suivi : plus de bouton « Préparer le call » (v106), sans statut, WhatsApp ni Appeler en double ; ni initiales ni nom répétés ; un seul lien WhatsApp visible",
          id.avantSuivi && !id.avatar && !id.nom && id.role === statut && !id.roleIdent && id.call === null /* v106 (lot 4) */ && !!id.wa && /^https:\/\/wa\.me\/\d+\?text=Salut%20Thomas/.test(id.wa.href) && !id.waIdent && id.appeler === "tel:" + TEL1 && !id.appelerIdent
            && T2.waVisibles.length === 1 && T2.waVisibles[0].dansBandeau, JSON.stringify({ id, wa: T2.waVisibles }));
      } else {
        /* v106 (lot 2) : changement voulu — un seul WhatsApp, celui de l'en-tête, qui ouvre le message prêt du prospect (ses réponses) */
        ok("B2 (prospect) : en-tête : « Prospect », WhatsApp = le message prêt (texte pré-rempli), Appeler (tel:) ; rien en double sous l'en-tête ; ni initiales ni nom répétés ; un seul lien WhatsApp visible",
          id.avantSuivi && !id.avatar && !id.nom && id.role === statut && !id.roleIdent && !id.call && !!id.wa && /^https:\/\/wa\.me\/33639980002\?text=./.test(id.wa.href) && !id.waIdent && id.appeler === "tel:" + TEL2 && !id.appelerIdent
            && T2.waVisibles.length === 1 && T2.waVisibles[0].dansBandeau && id.doublons.length === 0, JSON.stringify({ id, wa: T2.waVisibles }));
      }
      ok("A5 (" + qui + ") : aucune écriture en parcourant les onglets", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
    });
  }

  /* =================== C. « Revenir … » depuis Aperçu : là où ramenait la croix =================== */
  await bloc("C. Revenir", async () => {
    const db = base({ nombreux: true });
    const { page } = await contexte(b, COACH, db, { viewport: PETIT });
    /* tableau de bord → fiche (Clients.ouvrir, comme ses boutons « À traiter ») → « Revenir au tableau de bord » */
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue");
    await page.evaluate(([u, n]) => Clients.ouvrir(u, n, "accueil"), [C1, "Thomas Démo"]); await pret(page, "#fc-suivi"); await attendre(page, 400);
    const h0 = await page.evaluate(() => location.hash), l1 = await page.evaluate(() => (document.querySelector("#vue > .fiche-entete #sortir-fiche") || {}).textContent || null);
    await page.click("#vue > .fiche-entete #sortir-fiche"); await pret(page, "#tb-vue"); await attendre(page, 300);
    const r1 = await page.evaluate(() => ({ hash: location.hash, consulte: Store.idConsulte }));
    ok("C1 : Aujourd'hui → Aperçu → « Revenir à Aujourd'hui » (flèche de l'en-tête, v106) : retour à Aujourd'hui, la fiche est quittée",
      /\/accueil$/.test(h0) && l1 === "Revenir à Aujourd'hui" && r1.hash === "#/tableau" && r1.consulte === null, JSON.stringify({ h0, l1, r1 }));
    /* liste Clients (longue) : la position est retrouvée */
    await page.goto(URL0 + "#/clients"); await pret(page, "#lc-clients #lc-liste li"); await attendre(page, 400);
    const cible = EXTRA(20);
    await page.evaluate(id => { const x = document.querySelector('.lc-ligne[data-uid="' + id + '"]'); if (x) x.scrollIntoView({ block: "center" }); }, cible); await attendre(page, 300);
    const y0 = await page.evaluate(() => window.scrollY);
    await page.click('.lc-ligne[data-uid="' + cible + '"] [data-lc-ligne]'); await pret(page, "#fc-suivi"); await attendre(page, 400);
    const l2 = await page.evaluate(() => (document.querySelector("#vue > .fiche-entete #sortir-fiche") || {}).textContent || null);
    await page.click("#vue > .fiche-entete #sortir-fiche"); await pret(page, "#lc-clients #lc-liste li"); await attendre(page, 700);
    const r2 = await page.evaluate(() => ({ hash: location.hash, y: window.scrollY }));
    ok("C2 : liste Clients → Aperçu → « Revenir à mes clients » : retour à la liste, à la même position",
      l2 === "Revenir à mes clients" && r2.hash === "#/clients" && y0 > 50 && Math.abs(r2.y - y0) <= 40, JSON.stringify({ l2, y0, r2 }));
    /* liste Prospects, avec une recherche : elle est gardée */
    await page.goto(URL0 + "#/prospects"); await pret(page, "#lc-prospects #lc-liste li"); await attendre(page, 300);
    await page.fill("#lc-q", "sar"); await attendre(page, 500);
    await page.click('.lc-ligne[data-uid="' + C2 + '"] [data-lc-ligne]'); await pret(page, "#fc-suivi"); await attendre(page, 400);
    const l3 = await page.evaluate(() => (document.querySelector("#vue > .fiche-entete #sortir-fiche") || {}).textContent || null);
    await page.click("#vue > .fiche-entete #sortir-fiche"); await pret(page, "#lc-prospects #lc-liste li"); await attendre(page, 500);
    const r3 = await page.evaluate(() => ({ hash: location.hash, q: (document.getElementById("lc-q") || {}).value, n: document.querySelectorAll("#lc-liste .lc-ligne").length }));
    ok("C3 : liste Prospects (recherche « sar ») → Aperçu → « Revenir aux prospects » : retour aux Prospects, recherche gardée",
      l3 === "Revenir aux prospects" && r3.hash === "#/prospects" && r3.q === "sar" && r3.n === 1, JSON.stringify({ l3, r3 }));
  });

  /* =================== D. Profil › Son compte =================== */
  await bloc("D. Son compte", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "accueil", "#fc-suivi");
    /* v106 (lot 2) : changement voulu — « Son compte » s'ouvre par le menu « ⋯ » de l'en-tête ; ses actions (Passer client,
       accès complet, archiver, Supprimer définitivement) sont dans ce menu, sur chaque onglet */
    const pages = await page.evaluate(() => Array.from(document.querySelectorAll("#vue > .fiche-entete .bandeau-actions a.b-act")).map(a => a.textContent.trim()));
    await page.click("#fiche-points summary"); await attendre(page, 300);
    const menu = await page.evaluate(() => Array.from(document.querySelectorAll("#fiche-points .menu-points-l a, #fiche-points .menu-points-l button")).map(x => (x.id || x.getAttribute("href").split("/").slice(-2).join("/")) + ":" + x.textContent.trim()));
    await page.click("#fiche-points a[data-fe-compte]"); await pret(page, "#fc-compte"); await attendre(page, 600);
    const c = await page.evaluate(() => ({ hash: location.hash, compte: !document.getElementById("fc-compte").hidden, suivi: !document.getElementById("fc-suivi").hidden,
      ici: (document.querySelector('#vue > .fiche-entete .f-onglet[aria-current="page"]') || {}).textContent || null, page: (document.querySelector('#vue > .fiche-entete a.b-act[aria-current="page"]') || {}).textContent || null,
      h1: ((document.querySelector("#vue h1.sr-only") || {}).textContent || "").trim(), infos: !!document.querySelector("#fc-compte #fc-infos #fc-email"), supprimer: !!document.querySelector("#vue > .fiche-entete #fiche-points #fc-supprimer") }));
    const tc = await lireTete(page);
    ok("D1 : « ⋯ » (Son compte, Repasser prospect, Donner l'accès complet, Archiver ce compte, Supprimer définitivement) › « Son compte » : #/client/…/accueil/compte, le panneau Compte (#fc-compte : email) seul visible, Aperçu et « Son compte » marqués, titre « Son compte », même en-tête",
      JSON.stringify(pages) === '["Aperçu","Son questionnaire"]' && JSON.stringify(menu) === JSON.stringify(["accueil/compte:Son compte", "fc-changer:Repasser prospect", "fc-acces:Donner l'accès complet", "fc-archiver:Archiver ce compte", "fc-supprimer:Supprimer définitivement"])
        && /\/accueil\/compte$/.test(c.hash) && c.compte && !c.suivi && c.ici === "Aperçu" && c.page === "Son compte" && c.h1 === "Son compte" && c.infos && c.supprimer
        && tc.nbBandeaux === 1 && tc.premier && tc.nbOnglets === 1 && tc.sortir === 1 && tc.anciens.length === 0 && tc.titre === null, JSON.stringify({ pages, menu, c, tc }));
    await page.click('#vue > .fiche-entete .f-onglet[data-onglet-fiche="apercu"]'); await pret(page, "#fc-suivi"); await attendre(page, 600);
    const s = await page.evaluate(() => ({ hash: location.hash, suivi: !document.getElementById("fc-suivi").hidden, compte: !document.getElementById("fc-compte").hidden, ici: (document.querySelector('#vue > .fiche-entete .f-onglet[aria-current="page"]') || {}).textContent || null }));
    ok("D2 : puis « Aperçu » : le Suivi revient (#fc-suivi), Compte caché, Aperçu marqué", /\/accueil$/.test(s.hash) && s.suivi && !s.compte && s.ici === "Aperçu", JSON.stringify(s));
  });

  /* =================== E. téléphone 390 px =================== */
  await bloc("E. téléphone", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    const deb = [];
    for (const uid of [C1, C2]) for (const [ch, , sel] of PAGES) { await ouvrir(page, uid, ch, sel); if (await debordeLarg(page)) deb.push((uid === C1 ? "client " : "prospect ") + ch); }
    await ouvrir(page, C1, "accueil/compte", "#fc-compte"); if (await debordeLarg(page)) deb.push("client accueil/compte");
    ok("E1 : téléphone (390 px) : aucun débordement sur le côté (onglets du client et du prospect, Son compte)", deb.length === 0, JSON.stringify(deb));
  });

  /* =================== 3N. l'app d'un client ne télécharge plus Clients, Prospects ni leurs outils communs ; le coach les a =================== */
  await bloc("3N. fichiers du coach", async () => {
    const TROIS = ["js/clients-prospects-communs.js", "js/outilClients.js", "js/outilProspects.js"];
    const releve = page => page.evaluate(() => ({
      /* les scripts de la page (écrits par index.html, puis ajoutés par CodeCoach.assurer) : le relevé des ressources ne voit
         pas les fichiers servis par la simulation */
      charges: Array.from(document.scripts).map(x => (x.getAttribute("src") || "").split("?")[0]).filter(Boolean),
      objets: ["Clients", "Archive", "ListeCoach", "Acces", "Commercial", "MessageProspect", "Nouveautes", "Mesure", "outilClients", "outilProspects"].filter(n => { try { return typeof eval(n) !== "undefined"; } catch (e) { return false; } })
    }));
    const CLIENT = qui(C1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" }), PROSPECT = qui(C2, "sarah@exemple.fr", { prenom: "Sarah", nom: "Démo" });
    for (const [nom, who, pages] of [["client", CLIENT, ["programme", "nutrition", "mensurations", "profil"]], ["prospect", PROSPECT, ["profil", "calculateur"]]]) {
      const db = base();
      const { page } = await contexte(b, who, db);
      await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue"); await attendre(page, 400);
      const vus = [];
      for (const pg of pages) { await page.goto(URL0 + "#/" + pg); await pret(page); vus.push(pg + ":" + (await page.evaluate(() => !document.getElementById("page-illisible") && document.getElementById("vue").textContent.trim().length > 0))); }
      const r = await releve(page);
      ok("3N-" + nom + " : un " + nom + " ne télécharge aucun des 3 fichiers (outils communs, Clients, Prospects), aucun de leurs objets n'existe chez lui, et ses pages s'ouvrent",
        r.charges.indexOf("js/config.js") > -1 && TROIS.every(f => r.charges.indexOf(f) === -1) && r.objets.length === 0 && vus.every(v => /:true$/.test(v)), JSON.stringify({ r, vus }));
    }
    const db = base();
    const { page } = await contexte(b, COACH, db);   // appareil neuf : pas de marque « fichiers du coach »
    await page.goto(URL0 + "#/clients"); await pret(page, "#lc-clients #lc-liste li"); await attendre(page, 400);
    const r = await releve(page);
    const listeC = await page.evaluate(() => document.querySelectorAll("#lc-clients #lc-liste li").length);
    await page.goto(URL0 + "#/prospects"); await pret(page, "#lc-prospects #lc-liste li"); await attendre(page, 400);
    const listeP = await page.evaluate(() => document.querySelectorAll("#lc-prospects #lc-liste li").length);
    ok("3N-coach : le coach (appareil neuf) reçoit les 3 fichiers à sa connexion ; ses listes Clients et Prospects s'affichent",
      TROIS.every(f => r.charges.indexOf(f) > -1) && r.objets.length === 10 && listeC > 0 && listeP > 0, JSON.stringify({ r, listeC, listeP }));
  });

  /* ==========================================================================================================
     PARTIE 2 (audit de Cowork), points 1 à 5 et 9 à 11 — fiche d'un client et espace coach
     ========================================================================================================== */
  /* v106 (lot 1) : changement voulu — le menu du coach a 4 entrées ; Réglages et Mon entraînement sont derrière le rond de profil */
  const MENU7 = '["tableau","clients","prospects","mes-programmes"]';
  const visTextes = (page, sel) => page.evaluate(s => Array.from(document.querySelectorAll(s)).filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").map(e => e.textContent.replace(/\s+/g, " ").trim()), sel);

  /* =================== F. point 1 : une seule navigation dans la fiche =================== */
  await bloc("F. point 1", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "accueil", "#fc-suivi");
    const n = await page.evaluate(() => ({
      nav: Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id), versClient: Array.from(document.querySelectorAll("#nav a")).filter(a => /#\/client\//.test(a.getAttribute("href"))).length,
      raccourcis: !!document.querySelector("#fc-outils, #fc-suivi .bandeau-actions"),
      fleches: Array.from(document.querySelectorAll("#vue a")).filter(a => /→\s*$/.test(a.textContent)).map(a => a.textContent.trim()),
      call: Array.from(document.querySelectorAll("#vue a, #vue button")).filter(e => e.getClientRects().length && e.textContent.replace(/\s+/g, " ").trim() === "Bilans").length,   // v106 (lot 3) : « Préparer le call » est devenu « Bilans »
      suivi: (Array.from(document.querySelectorAll("#vue .fiche-onglets a")).find(a => /Suivi/.test(a.textContent)) || {}).hash || ""   // v106 (lot 4) : l'onglet Suivi mène à Bilans
    }));
    ok("F1 (point 1) : dans la fiche, le menu du haut est celui du coach (ses 4 entrées dans l'ordre, aucune vers les outils du client), plus de rangée de raccourcis ni de lien « … → » ; plus de bouton « Bilans » sur l'Aperçu : l'onglet Suivi y mène (v106)",
      JSON.stringify(n.nav) === MENU7 && n.versClient === 0 && !n.raccourcis && n.fleches.length === 0 && n.call === 0 && /\/bilan$/.test(n.suivi), JSON.stringify(n));
    /* les anciennes adresses s'ouvrent toujours */
    const vus = [];
    for (const [ch, sel] of [["bilan", "#bilan-vue"], ["journal", null], ["calculateur", null], ["mensurations", null], ["formation", null], ["complements", null]]) {
      await ouvrir(page, C1, ch, sel);
      vus.push(ch + ":" + (await page.evaluate(c => location.hash.endsWith("/" + c) && !document.getElementById("page-illisible") && document.querySelectorAll("#vue .fiche-entete").length === 1, ch)));
    }
    ok("F2 (point 1) : les adresses #/client/<id>/bilan, journal, calculateur, mensurations, formation, compléments s'ouvrent toujours dans la fiche", vus.every(v => /:true$/.test(v)), JSON.stringify(vus));
    /* « Réglages » depuis la fiche : la fiche se referme, les réglages du coach s'ouvrent (pas le questionnaire du client) */
    await page.click("#rond-profil"); await attendre(page, 500); await page.click('.volet #menu-profil a[data-id="profil"]'); await pret(page); await attendre(page, 600);   // v106 (lot 1) : par le rond de profil
    const r = await page.evaluate(() => ({ hash: location.hash, consulte: Store.idConsulte, bandeau: !!document.querySelector("#vue .fiche-entete"), nav: Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id) }));
    ok("F3 (point 1) : « Réglages » (rond de profil), depuis la fiche : #/profil du coach, fiche refermée, menu du coach", r.hash === "#/profil" && r.consulte === null && !r.bandeau && JSON.stringify(r.nav) === MENU7, JSON.stringify(r));
  });

  /* =================== G. point 2 : téléphone, barre du bas du coach, 5 onglets sur une ligne =================== */
  await bloc("G. point 2", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    const L = [];
    for (const [ch, , sel] of PAGES) {
      await ouvrir(page, C1, ch, sel);
      L.push(await page.evaluate(() => {
        const bb = Array.from(document.querySelectorAll("#barre-bas a")).map(a => a.dataset.id), ici = (document.querySelector('#barre-bas a[aria-current="page"]') || {}).dataset;
        const o = Array.from(document.querySelectorAll("#vue > .fiche-entete .f-onglet")), tops = o.map(a => Math.round(a.getBoundingClientRect().top));
        return { bb, ici: ici ? ici.id : null, plus: !!document.querySelector("#barre-bas [data-plus]"), n: o.length, uneLigne: new Set(tops).size === 1, deborde: document.documentElement.scrollWidth > innerWidth + 1 };
      }));
    }
    /* v106 (lot 1) : changement voulu — 4 cases (Aujourd'hui · Clients · Prospects · Bibliothèque), plus de « Plus » */
    ok("G1 (point 2) : sur chaque onglet de la fiche à 390 px, la barre du bas est celle du coach (Aujourd'hui · Clients · Prospects · Bibliothèque, sans « Plus », « Clients » marqué) et les 4 onglets (v106) tiennent sur une ligne",
      L.every(x => JSON.stringify(x.bb) === '["tableau","clients","prospects","mes-programmes"]' && !x.plus && x.ici === "clients" && x.n === 4 && x.uneLigne && !x.deborde), JSON.stringify(L));
    /* v106 (lot 2) : sur téléphone, dans une fiche, son en-tête remplace la barre du haut (collé en haut) ; sur ordinateur, le rond
       de profil (barre latérale) donne les autres pages du coach, qui referment la fiche */
    const tel = await page.evaluate(() => { const t = document.querySelector(".topbar"), e = document.querySelector("#vue > .fiche-entete"); window.scrollTo(0, 600);
      return { barreHaut: getComputedStyle(t).display, colle: getComputedStyle(e).position, haut: Math.round(e.getBoundingClientRect().top) }; });
    await page.setViewportSize({ width: 1280, height: 900 }); await attendre(page, 400);
    await page.click("#rond-profil"); await attendre(page, 500);
    const v = await page.evaluate(() => Array.from(document.querySelectorAll(".volet #menu-profil a")).map(a => a.dataset.id + (a.hasAttribute("data-quitter-fiche") ? "↩" : "")));
    ok("G2 (point 2) : à 390 px dans la fiche, l'en-tête de la fiche remplace la barre du haut et reste collé en haut au défilement ; sur ordinateur, le rond de profil donne les autres pages du coach (Réglages, Mon entraînement, qui referment la fiche), aucun outil du client",
      tel.barreHaut === "none" && tel.colle === "sticky" && tel.haut === 0 && JSON.stringify(v) === '["profil↩","entrainement↩"]', JSON.stringify([tel, v]));
  });

  /* =================== H. point 3 : un seul chiffre de régularité, pas de « 0 g prot. » =================== */
  await bloc("H. point 3", async () => {
    const db = base();
    const r = db.donnees.find(d => d.user_id === C1 && d.outil === "repas"); r.contenu.cible = Object.assign({}, r.contenu.cible, { prot: 0 });
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "accueil", "#fc-suivi");
    const h = await page.evaluate(() => ({
      reg: (document.querySelector("#fc-regularite") || {}).textContent || "",
      tuiles: Array.from(document.querySelectorAll("#fc-suivi .tile .t-lbl")).map(e => e.textContent.trim()),
      cible: Array.from(document.querySelectorAll("#fc-suivi li")).filter(li => /^Cible/.test(li.textContent.trim())).map(li => li.textContent.replace(/\s+/g, " ").trim()),
      zeroProt: /(^|[^\d])0 g prot/.test((document.getElementById("vue") || {}).textContent || ""),
      nbReg: Array.from(document.querySelectorAll("#fc-suivi *")).filter(e => !e.children.length && /\/100/.test(e.textContent)).length
    }));
    /* v106 (lot 4) : changement voulu — la carte Nutrition (et sa ligne « Cible ») a quitté l'Aperçu (onglet Nutrition) : plus de
       ligne Cible ici, et toujours aucun « 0 g prot. » nulle part sur l'Aperçu */
    ok("H1 (point 3) : Aperçu : un seul chiffre de régularité (« … /100 · semaine passée »), plus de tuile « Régularité » ; protéines non renseignées : aucun « 0 g prot. » (la ligne Cible a quitté l'Aperçu, v106)",
      /\/100 · semaine passée/.test(h.reg) && h.tuiles.indexOf("Régularité") === -1 && h.nbReg === 1 && h.cible.length === 0 && !h.zeroProt, JSON.stringify(h));
  });

  /* =================== I. point 4 : « sa / ses / son » pour le coach, « ta / tes / ton » chez le client =================== */
  await bloc("I. point 4", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    const tu = [];
    for (const [ch, , sel] of PAGES.concat([["bilan", "", "#bilan-vue"], ["mensurations", "", null]])) {
      await ouvrir(page, C1, ch, sel);
      const t = await page.evaluate(() => Array.from(document.querySelectorAll("#vue h1, #vue h2, #vue h3, #vue label, #vue .t-lbl, #vue legend, #vue summary")).filter(e => e.getClientRects().length && !e.closest("[data-notr]"))
        .map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(x => /^(Ta|Tes|Ton) /.test(x) && !/^(Ton|Tes|Ta) (feedback|client|notes?|base|changements|brouillon)/i.test(x)));
      t.forEach(x => tu.push(ch + " : " + x));
    }
    await ouvrir(page, C1, "suivi", "#suivi-reg");
    const s = await visTextes(page, "#vue h2");
    const q = await visTextes(page, "#vue .ck-q, #vue dt, #vue .q");
    /* v106 (lot 3) : changement voulu — Suivi › Bilans : la régularité, les objectifs et les 4 dernières semaines une seule fois
       (« Son bilan du mois », en double avec « Préparer le call », n'y est plus) */
    ok("I1 (point 4) : dans la fiche, aucun titre ni étiquette en « ta / tes / ton » ; Suivi › Bilans : « Ses bilans hebdomadaires et ton feedback », « Sa régularité », « Ses objectifs du mois », « Les 4 dernières semaines »",
      tu.length === 0 && ["Ses bilans hebdomadaires et ton feedback", "Sa régularité", "Ses objectifs du mois", "Les 4 dernières semaines"].every(x => s.indexOf(x) > -1) && s.indexOf("Son bilan du mois") === -1, JSON.stringify({ tu, s }));
    const txt = await page.evaluate(() => document.getElementById("vue").innerText);
    ok("I2 (point 4) : les questions du bilan à la 3e personne (« Comment s'est passée sa semaine ? »), plus « ta semaine »",
      /Comment s'est passée sa semaine \?/i.test(txt) && !/Comment s'est passée ta semaine/i.test(txt), JSON.stringify(q).slice(0, 300));
    /* le client, chez lui : inchangé */
    const CL = qui(C1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
    const { page: pc } = await contexte(b, CL, base());
    await pc.goto(URL0 + "#/suivi"); await pret(pc, "#suivi-reg h2"); await attendre(pc, 500);
    const sc = await visTextes(pc, "#vue h2");
    ok("I3 (point 4) : le client garde « Ta régularité », « Tes objectifs du mois », « Ton bilan du mois » (et ses cases à cocher)",
      ["Ta régularité", "Tes objectifs du mois", "Ton bilan du mois"].every(x => sc.indexOf(x) > -1) && (await pc.$$(".obj-case")).length > 0, JSON.stringify(sc));
    /* en anglais, le coach lit « Their » */
    const dbe = base(); avecPrefsEnTous(dbe);
    const { page: pe } = await contexte(b, COACH, dbe, { langue: "en" });
    await ouvrir(pe, C1, "suivi", "#suivi-reg h2");
    const se = await visTextes(pe, "#vue h2");
    ok("I4 (point 4) : en anglais, le coach lit « Their consistency », « Their goals for the month » (jamais « Your »)", se.indexOf("Their consistency") > -1 && se.indexOf("Their goals for the month") > -1 && !se.some(x => /^Your /.test(x)), JSON.stringify(se));
  });

  /* =================== J. point 5 : les objectifs du mois se modifient seulement dans Suivi =================== */
  await bloc("J. point 5", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "suivi", "#obj-0");
    const s = await page.evaluate(() => {
      const i = document.getElementById("obj-0"); if (i) i.scrollIntoView({ block: "center" });
      const r = i && i.getBoundingClientRect(), x = r && document.elementFromPoint(r.left + 5, r.top + r.height / 2);
      return { champ: !!i, cliquable: !!i && !i.disabled && getComputedStyle(i).pointerEvents !== "none" && x === i, statuts: document.querySelectorAll("#suivi-obj select").length, cases: document.querySelectorAll("#vue .obj-case").length,
        listes: Array.from(document.querySelectorAll("#vue h2")).filter(h => /objectifs du mois/i.test(h.textContent)).length };
    });
    ok("J1 (point 5) : Suivi de la fiche : les 3 objectifs et leurs statuts se modifient ici (champs actifs, page en lecture seule par ailleurs), pas de cases du client, un seul bloc « objectifs du mois »",
      s.champ && s.cliquable && s.statuts === 3 && s.cases === 0 && s.listes === 1, JSON.stringify(s));
    const avantN = db.ecritures.length;
    await page.fill("#obj-0", "Marcher 9 000 pas"); await attendre(page, 2200);
    const ec = db.ecritures.slice(avantN).filter(e => e.table === "donnees" && e.outil === "programme" && e.user_id === C1);
    const enBase = db.donnees.find(d => d.user_id === C1 && d.outil === "programme").contenu;
    ok("J2 (point 5) : un objectif tapé dans Suivi part dans le programme publié du client (une écriture, séances intactes)",
      ec.length === 1 && enBase.objectifs && enBase.objectifs.liste[0] === "Marcher 9 000 pas" && (enBase.seances || []).length === 4, JSON.stringify({ n: ec.length, o: enBase.objectifs }));
    await ouvrir(page, C1, "programme", "#pg-publier");
    const p = await page.evaluate(() => ({ champs: document.querySelectorAll("#obj-0, #obj-st-0").length, lecture: !!document.querySelector("#obj-lecture"), lien: (document.querySelector("#obj-lecture [data-obj-modifier]") || {}).hash || "",
      texte: (document.querySelector("#obj-lecture") || {}).textContent || "" }));
    await ouvrir(page, C1, "accueil", "#fc-suivi");
    const a = await page.evaluate(() => ({ lien: (document.getElementById("fc-obj-modifier") || {}).hash || "", champs: document.querySelectorAll("#obj-0").length }));
    await ouvrir(page, C1, "bilan", "#bilan-vue");
    const c = await page.evaluate(() => ({ champs: document.querySelectorAll("#obj-0").length, valeur: (document.getElementById("obj-0") || {}).value || "", lien: Array.from(document.querySelectorAll("#bilan-vue a")).filter(x => /\/(suivi|bilan)$/.test(x.hash)).length }));
    /* v106 (lot 3) : changement voulu — les objectifs se modifient dans « Bilans » (Suivi) : Programme les montre en lecture seule
       avec « Modifier » vers Bilans ; Bilans a l'éditeur (une seule fois, sans lien vers lui-même). v106 (lot 4) : l'Aperçu ne
       répète plus les objectifs (carte retirée) : ni champ ni lien « Modifier » */
    ok("J3 (point 5) : Programme : objectifs en lecture seule (le nouveau texte affiché) et un lien « Modifier » vers Bilans, aucun champ ; Aperçu : ni champ ni objectifs (v106) ; Bilans : l'éditeur, avec le nouveau texte",
      p.champs === 0 && p.lecture && /\/bilan$/.test(p.lien) && /Marcher 9 000 pas/.test(p.texte) && a.lien === "" && a.champs === 0 && c.champs === 1 && c.valeur === "Marcher 9 000 pas" && c.lien === 0, JSON.stringify({ p, a, c }));
  });

  /* =================== K. point 8 : boutons « × » de 44 px, séparés des autres =================== */
  await bloc("K. point 8", async () => {
    const mes = [];
    for (const vp of [MOBILE, ORDI]) {
      const db = base();
      const { page } = await contexte(b, COACH, db, { viewport: vp });
      for (const [ch, sel] of [["programme", "#pg-publier"], ["nutrition", "#nu-vue"], ["complements", null], ["mensurations", null]]) {
        await ouvrir(page, C1, ch, sel);
        await page.evaluate(() => { ["#vue details.ex-pli", "#vue details.repas-c, #vue .repas-c details, #vue details:has(.g-edit)"].forEach(q => { const d = document.querySelector(q); if (d) d.open = true; }); });   // points 6 et 7 : le 1er exercice et le 1er repas ouverts
        await attendre(page, 300);
        mes.push(await page.evaluate(([ch, w]) => {
          const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const x = Array.from(document.querySelectorAll("#vue .del, #vue .fo-x")).filter(vis);
          const petits = x.map(e => e.getBoundingClientRect()).filter(r => r.width < 43.5 || r.height < 43.5).map(r => Math.round(r.width) + "×" + Math.round(r.height));
          /* le voisin de gauche sur la même ligne (un autre bouton) : au moins 10 px d'écart */
          const colles = x.filter(e => { const r = e.getBoundingClientRect(); const v = Array.from(e.parentElement.querySelectorAll("button, a.btn")).filter(o => o !== e && vis(o)).map(o => o.getBoundingClientRect())
            .filter(o => Math.abs((o.top + o.bottom) / 2 - (r.top + r.bottom) / 2) < 10 && o.right <= r.left + 1); return v.some(o => r.left - o.right < 10); }).length;
          return { ch, w, n: x.length, petits, colles };
        }, [ch, vp.width]));
      }
    }
    ok("K1 (point 8) : programme (exercice ouvert), nutrition (repas ouvert), compléments, mesures, à 390 et 1280 px : chaque « × » fait au moins 44 × 44 px et garde 10 px au moins avec le bouton voisin",
      mes.filter(m => m.ch === "programme" || m.ch === "nutrition").every(m => m.n > 0) && mes.every(m => m.petits.length === 0 && m.colles === 0), JSON.stringify(mes));
  });

  /* =================== J'. point 5 (relecture) : pas d'objectif écrit pendant une publication ; pas d'éditeur hors fiche =================== */
  await bloc("J'. point 5 relecture", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "suivi", "#obj-0");
    const n0 = db.ecritures.length;
    /* une publication du programme de ce client est en cours (lancée sur la page Programme) quand le coach ouvre Suivi */
    await page.evaluate(u => { ObjectifsCoach.publiant = u; }, C1);
    await ouvrir(page, C1, "suivi", "#obj-0");
    await page.evaluate(() => { const i = document.getElementById("obj-0"); i.disabled = false; i.value = "Tapé pendant la publication"; i.dispatchEvent(new Event("input", { bubbles: true })); });   // même un champ forcé n'écrit rien
    await attendre(page, 1500);
    const fige = await page.evaluate(() => ({ champs: Array.from(document.querySelectorAll("#suivi-obj input, #suivi-obj select")).every(x => x.disabled), note: !document.querySelector("#suivi-obj [data-obj-publication]").hidden }));
    await page.evaluate(() => { ObjectifsCoach.publiant = null; });
    await attendre(page, 900);
    const libre = await page.evaluate(() => Array.from(document.querySelectorAll("#suivi-obj input, #suivi-obj select")).every(x => !x.disabled));
    ok("J4 (point 5, relecture) : pendant la publication du programme de ce client, les objectifs de Suivi sont figés (avec un message) et rien n'est écrit ; ils reviennent ensuite",
      fige.champs && fige.note && libre && db.ecritures.length === n0, JSON.stringify({ fige, libre, ecrit: db.ecritures.length - n0 }));
    await page.evaluate(() => sortirFiche()); await attendre(page, 600);
    await page.goto(URL0 + "#/suivi"); await pret(page, "#suivi-reg"); await attendre(page, 600);
    const hors = await page.evaluate(() => ({ consulte: Store.idConsulte, editeur: document.querySelectorAll("#suivi-obj #obj-0").length }));
    await ouvrir(page, C1, "profil", "#q-age");
    const q = await page.evaluate(() => { document.querySelectorAll("#vue details").forEach(d => { d.open = true; }); return document.getElementById("vue").innerText; });   // v106 (lot 4) : thèmes du questionnaire repliés dans la fiche
    ok("J5 (relecture) : hors fiche (#/suivi du coach), pas d'éditeur d'objectifs ; dans la fiche, « Son métier et son rythme de travail » et « Son entourage va-t-il soutenir sa démarche… » (plus de « ton » ou « ta » restés au milieu)",
      hors.consulte === null && hors.editeur === 0 && /Son métier et son rythme de travail/.test(q) && /Son entourage va-t-il soutenir sa démarche/.test(q) && !/ton rythme de travail|ta démarche/.test(q), JSON.stringify(hors));
  });

  /* =================== Q. points 6 et 7 : Nutrition et Programme du coach repliés, sur téléphone =================== */
  await bloc("Q. points 6 et 7", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await ouvrir(page, C1, "nutrition", "#nu-vue");
    const n = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, ouverts: Array.from(document.querySelectorAll("#nu-vue details")).filter(d => d.open).length, repas: document.querySelectorAll("#nu-vue .repas-c details, #nu-vue details.repas-c").length,
      publier: !!Array.from(document.querySelectorAll("#vue button")).find(x => /Publier les changements/.test(x.textContent) && x.getClientRects().length) }));
    await ouvrir(page, C1, "programme", "#pg-publier");
    const p = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, exos: document.querySelectorAll("#prog-vue details.ex-pli").length, ouverts: document.querySelectorAll("#prog-vue details.ex-pli[open]").length }));
    ok("Q1 (points 6 et 7) : à 390 px, la Nutrition du coach tient en 3 écrans (≤ 2 532 px), tout replié, « Publier les changements » visible ; le Programme montre une ligne par exercice, tout replié, près de deux fois moins haut qu'avant (moins de 55 % des 12 928 px d'avant)",
      n.h <= 2532 && n.ouverts === 0 && n.repas > 0 && n.publier && p.exos >= 10 && p.ouverts === 0 && p.h < 12928 * 0.55, JSON.stringify({ n, p }));
  });

  /* =================== L. point 9 : en-tête sur ordinateur =================== */
  await bloc("L. point 9", async () => {
    const db = base();
    const mes = [];
    /* v106 (lot 1) : changement voulu — dès 1 024 px, plus d'en-tête en haut : une barre latérale à gauche (72 px, icônes seules,
       sous 1 280 px ; 230 px au-delà), ses 4 entrées visibles en entier et l'une sous l'autre, la page à sa droite sans recouvrement */
    for (const w of [1024, 1200, 1280, 1440]) {
      const { page } = await contexte(b, COACH, db, { viewport: { width: w, height: 900 } });
      await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-a-traiter"); await attendre(page, 400);
      mes.push(await page.evaluate(w => {
        const t = document.querySelector(".topbar"), tr = t.getBoundingClientRect(), n = document.getElementById("nav"), nr = n.getBoundingClientRect();
        const a = Array.from(n.querySelectorAll("a")), dedans = a.every(x => { const r = x.getBoundingClientRect(); return r.left >= nr.left - 1 && r.right <= nr.right + 1 && r.bottom <= innerHeight; });
        const tops = a.map(x => Math.round(x.getBoundingClientRect().top)), v = document.getElementById("vue").getBoundingClientRect();
        return { w, larg: Math.round(tr.width), haut: Math.round(tr.height), gauche: Math.round(tr.left), n: a.length, dedans, colonne: new Set(tops).size === a.length, vue: Math.round(v.left), bas: !!document.querySelector("#barre-bas a") && getComputedStyle(document.getElementById("barre-bas")).display !== "none", rond: getComputedStyle(document.getElementById("rond-profil")).display !== "none" };
      }, w));
    }
    ok("L1 (point 9) : dès 1 024 px, la barre latérale du coach (72 px sous 1 280 px, 230 px au-delà, toute la hauteur) : ses 4 entrées visibles en entier, l'une sous l'autre, le rond de profil, la page à sa droite, pas de barre du bas",
      mes.every(m => m.n === 4 && m.dedans && m.colonne && m.gauche === 0 && m.haut >= 899 && m.larg === (m.w < 1280 ? 72 : 230) && m.vue >= m.larg && !m.bas && m.rond), JSON.stringify(mes));
  });

  /* =================== M. point 10 : urgences = action du jour, clients d'abord =================== */
  await bloc("M. point 10", async () => {
    const db = base();
    /* un nouveau prospect inscrit il y a 2 h (DM de bienvenue : urgent) ; Julien (inactif depuis 12 j : à surveiller) ; Thomas (bilan reçu : urgent) */
    const NV = EXTRA(77);
    db.profils.push({ id: NV, prenom: "Nina", nom: "Démo", role: "client", statut: "prospect", cree_le: avant(2 * H) });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-a-traiter"); await attendre(page, 500);
    /* v106 (lot 5) : changement voulu — « Aujourd'hui » range chaque personne dans un groupe (sa raison la plus urgente) : les
       clients à gauche (Retours à lire, Clients inactifs), les prospects à droite ; le badge de l'onglet Prospects compte toujours les
       urgences des prospects ; le chiffre « À traiter » = toutes les lignes */
    const m = await page.evaluate(() => {
      const g = id => Array.from(document.querySelectorAll("#tb-g-" + id + " .tb-l b")).map(b => b.textContent);
      return { retours: g("retours"), inactifs: g("inactifs"), nouveaux: g("nouveaux"), cols: Array.from(document.querySelectorAll("#tb-a-traiter .tb-col")).map(c => c.id),
        urgP: Array.from(document.querySelectorAll("#tb-col-prospects .tb-groupe")).reduce((n, x) => n + parseInt(x.dataset.urgences || "0", 10), 0),
        lignes: document.querySelectorAll("#tb-a-traiter .tb-l").length, total: (document.querySelector("#tb-c-traiter .t-val") || {}).textContent,
        badge: (document.querySelector('#barre-bas a[data-id="prospects"] .nav-badge, #nav a[data-id="prospects"] .nav-badge') || {}).textContent || "" };
    });
    ok("M1 (point 10, v106) : « Aujourd'hui » : Thomas (bilan reçu) dans « Retours à lire » (colonne Clients), Julien (inactif) dans « Clients inactifs », la prospecte inscrite il y a 2 h dans « Nouveaux prospects » (colonne Prospects) ; le badge Prospects = les urgences des prospects ; « À traiter » = toutes les lignes",
      m.retours.includes("Thomas Démo") && m.inactifs.includes("Julien Démo") && m.nouveaux.includes("Nina Démo") && !m.retours.includes("Julien Démo") && JSON.stringify(m.cols) === '["tb-col-clients","tb-col-prospects"]'
        && m.urgP >= 1 && m.badge === String(m.urgP) && +m.total === m.lignes, JSON.stringify(m));
  });

  /* =================== N. point 11 : textes traduits =================== */
  await bloc("N. point 11", async () => {
    const dbe = base(); avecPrefsEnTous(dbe);
    const { page } = await contexte(b, COACH, dbe, { langue: "en" });
    await ouvrir(page, C1, "programme", "#pg-publier");
    /* v106 (lot 2) : changement voulu — plus de « Fiche de … » (le prénom, jamais traduit) ; les onglets et le statut traduits */
    const t = await page.evaluate(() => ({ tete: Array.from(document.querySelectorAll("#vue > .fiche-entete .f-onglet")).map(a => a.textContent.trim()).join(" · ") + " | " + ((document.querySelector("#vue > .fiche-entete .fe-statut") || {}).textContent || ""), sortir: (document.getElementById("sortir-fiche") || {}).textContent,
      pages: Array.from(document.querySelectorAll("#vue > .fiche-entete a.b-act")).map(a => a.textContent.trim()), h1: (document.querySelector("#vue h1.sr-only") || {}).textContent,
      dico: ["Fiche client", "dernier : {d}", "Source", "3. Maintenance"].map(k => Object.prototype.hasOwnProperty.call(I18N.en, k) && !!I18N.en[k]) }));
    ok("N1 (point 11) : en anglais, l'en-tête de la fiche est traduit (« Overview · Program · Nutrition · Follow-up », « Client », « Back to my clients », « Their program », « Their sessions ») ainsi que « Fiche client », « dernier : {d} », « Source », « 3. Maintenance »",
      t.tete === "Overview · Program · Nutrition · Follow-up | Client" && t.sortir === "Back to my clients" && JSON.stringify(t.pages) === '["Their program","Their sessions"]' && t.h1 === "Their program" && t.dico.every(Boolean), JSON.stringify(t));
  });

  /* =================== O. point 12 : les fichiers du coach demandés ensemble (appareil neuf) =================== */
  await bloc("O. point 12", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    const debuts = [], m0 = /var MHX_COACH = \[([\s\S]*?)\]/.exec(fs.readFileSync(HTML, "utf8")), LISTE_COACH = m0 ? (m0[1].match(/"[^"]+"/g) || []).map(x => x.slice(1, -1)) : [];
    /* chaque fichier de MHX_COACH répond en 400 ms : demandés l'un après l'autre, le dernier partirait 2,4 s après le premier */
    await page.route(/\/js\/[^?]+\.js/, async r => {
      const f = new URL(r.request().url()).pathname.replace(/^\//, "");
      const coach = LISTE_COACH.indexOf(f) > -1;
      if (coach) { debuts.push({ f, t: Date.now() }); await new Promise(x => setTimeout(x, 400)); }
      return r.fallback();
    });
    await page.goto(URL0 + "#/clients"); await pret(page, "#lc-clients #lc-liste li"); await attendre(page, 400);
    const n = await page.evaluate(() => ({ coach: MHX_COACH.length, liste: document.querySelectorAll("#lc-clients #lc-liste li").length, objets: ["Clients", "outilClients", "outilProspects", "outilTableau"].every(x => { try { return typeof eval(x) !== "undefined"; } catch (e) { return false; } }) }));
    const ecart = debuts.length ? debuts[debuts.length - 1].t - debuts[0].t : -1;
    ok("O1 (point 12) : sur un appareil neuf, les fichiers du coach sont demandés ensemble (moins de 300 ms entre le premier et le dernier, au lieu de l'un après l'autre) et s'exécutent dans l'ordre (ses outils et sa liste Clients sont là)",
      debuts.length === n.coach && n.coach >= 5 && ecart >= 0 && ecart < 300 && n.liste > 0 && n.objets, JSON.stringify({ n, ecart, debuts: debuts.map(d => d.f) }));
  });

  /* =================== P. partie 4 : corrections sûres (sécurité, lectures) =================== */
  await bloc("P. partie 4", async () => {
    /* P1 : l'app affichée dans le cadre (iframe) d'une autre page ne se charge pas : un lien l'ouvre dans sa propre page */
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-a-traiter");   // la page elle-même (hors cadre) s'ouvre
    await page.setContent(`<!doctype html><iframe id="f" src="${URL0}#/tableau" style="width:800px;height:600px"></iframe>`);
    await attendre(page, 2500);
    const fr = page.frames().find(f => f !== page.mainFrame());
    const c = fr ? await fr.evaluate(() => ({ app: typeof appPrete !== "undefined", scripts: document.querySelectorAll("script[src]").length, lien: (document.querySelector('a[target="_top"]') || {}).textContent || "" })).catch(e => ({ err: String(e) })) : null;
    ok("P1 (partie 4) : dans le cadre d'une autre page, l'app ne se charge pas (aucun script, pas d'appPrete) et propose seulement un lien vers sa propre page",
      !!c && c.app === false && c.scripts === 0 && /Ouvrir MHX Coaching/.test(c.lien), JSON.stringify(c));
    /* P2 : Clients.charger ne télécharge plus les brouillons du coach ni son atelier (une entrée par client), seulement leur date */
    const db2 = base();
    db2.donnees.push({ user_id: F.IDS.coach, outil: "brouillons_programme", contenu: { v: 1, clients: { [C1]: { programme: { nom: "Bloc 2", seances: [] } } } }, maj_le: avant(2 * H) });
    db2.donnees.push({ user_id: F.IDS.coach, outil: "atelier", contenu: { nom: "Modèle", seances: [] }, maj_le: avant(3 * H) });
    const { page: p2 } = await contexte(b, COACH, db2);
    const urls = [];
    p2.on("request", r => { if (/\/rest\/v1\/donnees/.test(r.url())) urls.push(decodeURIComponent(r.url())); });
    await p2.goto(URL0 + "#/clients"); await pret(p2, "#lc-clients #lc-liste li"); await attendre(p2, 400);
    const groupee = urls.filter(u => /select=user_id,outil,contenu,maj_le/.test(u) && /outil=not\.in\./.test(u));
    const legere = urls.filter(u => /select=user_id,outil,maj_le&/.test(u));
    ok("P2 (partie 4) : la liste Clients ne télécharge plus le contenu des brouillons ni de l'atelier du coach (exclus de la lecture groupée), seulement leur date (lecture légère)",
      groupee.length >= 1 && groupee.every(u => /brouillons_programme/.test(u) && /brouillons_repas/.test(u) && /atelier/.test(u)) && legere.some(u => /outil=in\.\(journal_alimentaire,brouillons_programme,brouillons_repas,atelier\)/.test(u)), JSON.stringify({ groupee, legere }).slice(0, 600));
    /* P3 : « Le programme » du client lit son programme et son journal ENSEMBLE */
    const CL = qui(C1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
    const { page: p3 } = await contexte(b, CL, base());
    const t = {};
    await p3.route(/supabase\.co\/rest\/v1\/donnees\?.*outil=eq\.(programme|journal)(&|$)/, async r => { const o = /outil=eq\.(programme|journal)/.exec(r.request().url())[1]; if (!t[o]) t[o] = Date.now(); await new Promise(x => setTimeout(x, 500)); return r.fallback(); });
    await p3.goto(URL0 + "#/programme"); await pret(p3, "#prog-vue .seance"); await attendre(p3, 600);
    const vu = await p3.evaluate(() => document.querySelectorAll("#prog-vue .seance, #prog-vue section").length);
    ok("P3 (partie 4) : « Le programme » du client demande son programme et son journal ensemble (moins de 300 ms d'écart, au lieu de l'un après l'autre), la page s'affiche",
      t.programme && t.journal && Math.abs(t.programme - t.journal) < 300 && vu > 0, JSON.stringify({ ecart: t.programme && t.journal ? t.journal - t.programme : null, vu }));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com|www\.youtube-nocookie\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
}

principal().then(bilan).catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exitCode = 1; });
