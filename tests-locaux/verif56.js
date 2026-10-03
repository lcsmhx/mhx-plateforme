/* verif56 — Chantier 1 (v52), lots C, D et E : les 3 questions, la page de proposition de bilan, puis l'accueil du prospect,
   le calculateur (calc_perso) et « gratuit pour toujours », puis les pages verrouillées avec un exemple, vérifiés de bout en bout
   dans un vrai navigateur.
   A. réglages et définitions : 3 questions (probleme, obstacle, projection) requises, mêmes définitions en français et
      en anglais (même ordre), anciennes définitions gardées pour l'affichage, table problème → objectif vers des options
      EXACTES du questionnaire complet (/perte|s[èe]che/, /prise|masse/, santé), jamais par-dessus un objectif choisi ;
   B. arrivée juste après la vérification d'email (faux lien de confirmation) sur les 3 questions : plus d'âge, « 3
      questions, 30 secondes », « pas un avis médical » sous le formulaire, réponses requises (espaces seuls = vide),
      brouillon pendant la frappe (court_debut, email_compte, objectif), rechargement, validation (court_le) ;
      v60 (brief V2, C) : des réponses à toucher (cartes, pastilles, « 2 réponses max », précisions libres), bouton
      « Voir ma prochaine étape » inactif tant qu'il manque une réponse (« Il manque une réponse »), intake : texte
      français lisible + clés stables + précision ;
   C. page de proposition de bilan : sa réponse « projection » reprise (échappée, tronquée proprement), texte exact,
      les boutons (v52 : deux de même poids ; v61 : un seul doré, voir plus bas), lien Calendly exact (prénom, nom, email ;
      source apres_questionnaire, v52 : bilan-propose),
      clic compté, intake.bilan_propose écrit UNE fois (« reserver » / « plus_tard »), relu avant si le cache n'est pas
      chargé, puis l'accueil ; page rouverte par #/decouverte/bilan sans rien réécrire ; données piégées ; anglais ;
      téléphone 390 px ;
      v61 (brief V2, D et F) : la page devient « Ton plan d'action personnalisé » (« Offert », « Ton objectif dans 3 mois »,
      15 min avec Lucas, « Ton plan est à toi… », « Tu es libre de dire non ») : UN seul bouton doré « Récupérer mon plan
      d'action » (+ « 15 min · par téléphone · offert ») et « Plus tard, je découvre mon espace » en lien discret (ni fond
      ni bordure, souligné) ; lien Calendly utm_source=app, utm_medium=bouton, utm_content=apres_questionnaire ;
      v62 (brief V2, L) : « Plus tard » aussi noté avec son origine dans la clé challenge (cta.plus_tard, source
      apres_questionnaire), une seule écriture de chaque clé pour un double tape ; intake relu avant le choix : noté aussi ;
      intake illisible au moment du choix : rien n'est écrit (ni intake, ni challenge) ; page rouverte par son adresse
      puis « Plus tard » : intake jamais réécrit, mais une 2e entrée apres_questionnaire (une fois par affichage de la
      page) ; un clic « Récupérer mon plan d'action » ne note jamais de « Plus tard » ;
   D. ancien prospect (10 réponses, court_le, pas de bilan_propose) : la page bilan une fois (phrase neutre, jamais
      « undefined »), puis l'accueil ; ses anciennes réponses intactes et lisibles (Profil, fiche du coach, « 10 / 10 ») ;
      un ancien questionnaire commencé reste compté sur 10 ;
   E. Profil du prospect : ses réponses, « Modifier mes réponses » (#/decouverte/reponses : rien ne part avant la
      validation, « Annuler les modifications »), objectif suivi quand il venait de la réponse « problème » ;
   F. coach : fiche d'un nouveau prospect (« 3 / 3 réponses », les 3 réponses, les anciennes qui ont une valeur, clic
      depuis la page « Ton plan d'action » ; v63 : ancien code bilan-propose comme nouveau apres_questionnaire, « Clic
      « Récupérer mon plan d'action » (page « Ton plan d'action » (après les 3 questions)) » deux fois, plus aucun ancien
      libellé ni « Réserver mon bilan » dans la chronologie), aucune injection, aucune écriture ;
   G. l'ancien écran « résultat » n'est plus affiché (ni calories, ni séance, ni recettes, aucune lecture du catalogue),
      son code est gardé ; client Thomas : rien de tout cela ;
   H. la garde d'âge du formulaire, inerte sans question « age », marche toujours si une question d'âge revient (page
      servie retouchée) ;
   Lot D (v52) :
   I. accueil du prospect : une seule action mise en avant (« Calcule tes calories (2 min) » → #/calculateur, puis
      « Enregistre ta pesée de départ » → #/mensurations, puis l'accueil normal), décidée en lecture seule, sans écriture,
      « Récupérer mon plan d'action » (v52 : « Réserver mon bilan ») discret, Speed Formation ouverte, vitrine (programme, nutrition, journal, suivi) ; anglais ;
      v59 : juste après un enregistrement (calcul, pesée) pas encore arrivé au serveur — valeur qui attend ses 700 ms, puis
      envoi en vol (copie gardée sur l'appareil) —, l'étape en tient compte ; copie plus ancienne que le serveur ou
      écrite par un autre compte : ignorée ;
   J. calculateur du prospect : sa clé calc_perso (jamais calc), rien d'inventé, rien d'écrit avant une saisie complète,
      mêmes formules, « pas un avis médical », départ depuis le calc du coach ou l'ancien questionnaire, calc_perso piégé ;
   K. garde-fou 18 ans (âge 17 : message, rien d'écrit ; mineur ensuite : calc_perso retiré ; écriture en attente
      annulée ; calc_perso mineur en base retiré ; restauration refusée ; anglais ; v59 : « Copier ma sauvegarde » ne
      contient jamais un calcul fait avec un âge mineur) ;
   L. garde-fou IMC (< 18,5 : pas d'objectif de perte, phrase de prudence, maintien enregistré) ;
   M. client Thomas (v53 : calculateur et journal ouverts, sa barre du bas inchangée ; détail dans verif60) et coach (calc
      comme avant, son compte et la fiche de Thomas ; v53 : « Ses séances » → son journal) ;
   N. navigation du prospect (barre du bas, « Plus », ordre des onglets, #/journal verrouillé et compté, Speed Formation
      ouverte au 30e jour), Ma progression sans photos, plus aucun « 7 jours » (FR et EN) ;
   O. coach : « inscrit depuis n j » (pastilles, fiche, suivi, cartes, CSV).
   Lot E (v52) :
   E1. pages verrouillées du prospect avec un exemple générique marqué « Exemple » (programme, nutrition, journal — le
      vrai onglet du lot D —, suivi), puis l'appel « Tu veux un programme construit pour toi… » et « Réserver mon bilan »
      compté ; aucune clé donnees lue ; anglais ; 390 px ; compléments, bilan, client et coach inchangés.
      v61 (brief V2, G et E2) : un texte par page (DECOUVERTE.echantillons.appels), « Récupérer mon plan d'action » (origine
      verrou_<page>), la ligne « 15 min avec Lucas · offert » sous le bouton, et sous la carte la nouvelle description
      AVANTAGES de la page ; accueil : codes accueil_haut / accueil_accompagnement (reponses_haut sur « Modifier mes
      réponses »), boutons toujours en contour.
   Z. aucun appel vers l'extérieur.
   Le garde-fou 18 ans n'est plus dans le questionnaire court (plus d'âge demandé) : il passe au calculateur (lot D).
   Supabase simulé (gabarit de verif55, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais
   par sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture
   est appliquée en mémoire et notée, chaque lecture de « donnees » aussi. Dates relatives au lancement. Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif56.js ../index.html
           VERIF56_PORT=9721 node verif56.js ../index.html     (autre port, si 9720 est pris)
           VERIF56_BLOCS="A.,C." node verif56.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF56_PORT || 9720;
const BLOCS = (process.env.VERIF56_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé, retouché le temps d'un bloc (avec) ---------- */
let retouches = [];
/* 52.1 : les retouches valent pour la page et pour ses fichiers css/ et js/ (CONFIG est dans js/config.js) */
const retouche = h => { for (const [de, vers] of retouches) h = h.split(de).join(vers); return h; };
const { servirFichier, source } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
/* une retouche dont le texte a disparu du fichier ne passe jamais en silence : le bloc s'interrompt */
async function avec(liste, fn){
  const h = source(HTML);   // 52.1 : la page et tous ses fichiers
  for (const [de] of liste) if (!h.includes(de)) throw new Error("retouche impossible, texte absent du fichier : " + de);
  retouches = liste;
  try { await fn(); } finally { retouches = []; }
}

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates : toujours relatives au lancement ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes ---------- */
/* un jeton par compte : le faux Supabase reconnaît l'appelant à son en-tête Authorization, comme la vraie base */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000056" + String(k).padStart(2, "0");   // verif56 : …56kk (une plage par suite)
/* v64 (lot 5, B) : les prospects de cette suite sont inscrits entre la v52 et la v63, case santé cochée à l'inscription :
   l'accord est dans les métadonnées de leur compte (sans clé newsletter : rien d'autre ne change), donc aucune carte
   d'accord santé dans le calculateur ni dans Ma progression (l'accord au premier usage est vérifié ailleurs) */
const ACCORD_SANTE = { consentement_sante: "2026-09-28T09:00:00.000Z", sante_version: "2026-09-28b" };
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  const db = { profils, donnees, emails_prospects: [], sansJournal: false, ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
    fonctions: [], inscriptions: [], emails: {}, connexions: {}, inscription: {}, lectureKo: opts.lectureKo || [], retardLecture: {}, retard: {},
    reponseFonction: { status: 200, body: { ok: true } },
    /* v52 (lot A) : mot de passe oublié et changement d'adresse (erreurs simulées), renouvellements de session, polices lentes */
    oublis: [], recover: {}, majUsers: [], majUser: {}, tokens: [], polices: null };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  for (const [uid, outil, contenu, maj] of opts.cles || []) donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) });
  return db;
}

/* ---------- le faux Supabase ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];                 // SELECT : le propriétaire ne les lit pas
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];     // INSERT / UPDATE / DELETE du propriétaire
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){   // order=a.desc,b.asc (PostgREST)
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
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };

/* polices simulées (db.polices = { css: ms, fichiers: ms }) : une feuille de style comme celle de Google Fonts, dont les
   fichiers de police (fonts.gstatic.com) répondent après « fichiers » ms (404 : le texte garde la police de secours) */
const POLICES_CSS = ["IBM Plex Sans", "IBM Plex Mono", "Oswald"].map((f, i) => "@font-face{font-family:'" + f + "';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/police" + i + "/v1/fausse.woff2) format('woff2')}").join("\n");
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  /* polices lentes (réseau mobile) : la feuille de style après db.polices.css ms, les fichiers après db.polices.fichiers ms */
  if (host === "fonts.googleapis.com" && db.polices) { externes.add(host); if (db.polices.css) await new Promise(z => setTimeout(z, db.polices.css)); return r.fulfill({ status: 200, contentType: "text/css", body: POLICES_CSS }).catch(() => {}); }
  if (host === "fonts.gstatic.com" && db.polices) { externes.add(host); if (db.polices.fichiers) await new Promise(z => setTimeout(z, db.polices.fichiers)); return r.fulfill({ status: 404, contentType: "text/plain", body: "" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Calendly, Instagram… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);

  /* --- comptes --- */
  if (p.startsWith("/auth/v1/signup")) {
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    if (db.inscription.erreur) return json({ msg: db.inscription.erreur.msg }, db.inscription.erreur.status);
    const id = db.inscription.id || PID(99); db.emails[id] = c.email;
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });   // déclencheur creer_profil
    if (db.inscription.confirmation) return json({ id, email: c.email, user_metadata: data });   // « Confirm email » : pas de session
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {   // mot de passe ou renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    db.tokens.push(q.get("grant_type") || "?");
    const id = (r1 && r1[1]) || (c.email && db.connexions[c.email]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    /* renouvellement : la session porte l'adresse que la base connaît à cet instant (db.emails, ex. après un changement d'adresse) */
    return json(who && id === who.id && !db.emails[id] ? who.session : session(id, db.emails[id] || (who && id === who.id ? who.email : "") || c.email || ""));
  }
  /* toute autre écriture vers la base (compte, fonctions, Storage, bibliothèque, catalogue…) est notée ;
     donnees et profils le sont plus bas, avec leur contenu */
  /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage d'un prospect ou d'un compte suivi) n'est
     pas une écriture de l'app dans les données : elle est testée à part (verif61) */
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); return json({}); }
  if (p.startsWith("/auth/v1/recover")) {   // mot de passe oublié (erreur simulée : db.recover.erreur)
    db.oublis.push(corps());
    if (db.recover.erreur) return json({ msg: db.recover.erreur.msg }, db.recover.erreur.status);
    return json({});
  }
  if (p.startsWith("/auth/v1/user") && m === "PUT") {   // changement d'adresse ou de mot de passe (erreur simulée : db.majUser.erreur)
    const c = corps() || {}; db.majUsers.push(clone(c));
    if (db.majUser.erreur) return json({ msg: db.majUser.erreur.msg }, db.majUser.erreur.status);
    return json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), new_email: c.email || undefined, role: "authenticated" });
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  /* --- fonctions serveur et Storage : jamais appelés pour de vrai --- */
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m, action: q.get("action"), corps: corps() }); const rf = db.reponseFonction; return rf.abort ? r.abort() : json(rf.body, rf.status); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") {
    if (db.sansJournal) return json({ code: "42P01", message: 'relation "public.emails_prospects" does not exist' }, 404);
    return json(coach ? colonnes(plage(db.emails_prospects.slice()), q) : []);
  }
  /* --- profils : chacun le sien, le coach tous ; rôle et statut changés par le coach seul (déclencheur protege_role) --- */
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  /* --- donnees --- */
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
      if (cleEq && db.retardLecture[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
      if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const lent = Math.max(0, ...rows.map(row => db.retard[row.outil] || 0));
      if (lent) { db.journal.push("P " + rows.map(row => row.outil).join(",")); await new Promise(z => setTimeout(z, lent)); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne))); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : maj_le=eq.<valeur lue> ou is.null
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);   // la ligne a bougé : 0 ligne (conflit)
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }   // RLS d'une mise à jour : 0 ligne, sans erreur
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row))); db.journal.push("E " + cleEq);
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    db.donnees = db.donnees.filter(x => !(x.user_id === uid && x.outil === cleEq && permis(moi, coach, x)));
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne ----------
   opts : viewport (ORDI par défaut, MOBILE), langue ("en" ; la ligne prefs en base l'emporte), stockage ({ clé: valeur }
   posés sur l'appareil), persistant (false : « Rester connecté » décoché), horloge (instant : l'horloge part de là et
   tourne ; true : maintenant), horlogeFixe (instant figé), fuseau ("Asia/Makassar"…) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || ORDI }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, stock, langue, persistant }) => {
    if (!/^https?:$/.test(location.protocol)) return;   // about:blank (fermeture simulée)
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    /* l'appareil (localStorage, partagé par les onglets du contexte) n'est préparé qu'une fois : un rechargement ou un 2e onglet le garde */
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s && persistant) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
    }
    if (s && !persistant && !sessionStorage.getItem("__init")) { sessionStorage.setItem("__init", "1"); sessionStorage.setItem("mhx_session", JSON.stringify(s)); }
  }, { s: who ? who.session : null, stock: opts.stockage || {}, langue: opts.langue || "", persistant: opts.persistant !== false });
  if (opts.horloge) await c.clock.install(opts.horloge === true ? undefined : { time: opts.horloge });
  if (opts.horlogeFixe) await c.clock.setFixedTime(opts.horlogeFixe);
  const page = await nouvellePage(c);
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}
async function nouvellePage(c){ return surveiller(await c.newPage()); }

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* l'app a fini de démarrer (appPrete, index.html [G]) et l'écran attendu est là */
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const ecrDonnees = db => db.ecritures.filter(e => e.table === "donnees" || e.table === "profils");
const couvre = (o, k) => { o = String(o || ""); if (!o) return true; if (o.startsWith("eq.")) return o.slice(3) === k; if (o.startsWith("in.")) return liste(o.slice(3)).includes(k); if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k); return true; };
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;   // lectures du CONTENU de la clé
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const largeur = page => page.evaluate(() => document.documentElement.scrollWidth + " px pour " + window.innerWidth).catch(() => "?");
const ou = page => page.evaluate(() => ({ courant: typeof courant !== "undefined" ? courant : null, hash: location.hash })).catch(() => ({}));
const avecEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };

/* ---------- les textes attendus (FR et EN) : cahier des charges du lot C ---------- */
/* v60 (brief V2, C) : les 3 questions à toucher — probleme (cartes, un choix, valeur = option française EXACTE, sous-texte),
   obstacle (pastilles, 2 choix au plus, clés stables) et projection (pastilles, un choix), précisions libres facultatives ;
   « Il manque une réponse », « 2 réponses max ». Les textes FR sont affichés avec typoFr (espace insécable avant « ? »…) :
   comparés après normalisation des espaces (norm, \s+). */
const TX = {
  labels: ["Ton objectif numéro 1 ?", "Jusqu'ici, qu'est-ce qui a coincé ?", "Dans 3 mois, qu'est-ce qui changerait tout pour toi ?"],
  labels_en: ["Your #1 goal?", "What's held you back so far?", "In 3 months, what would change everything for you?"],
  options: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme"],
  options_en: ["Lose fat", "Build muscle", "Get back in shape"],
  sous: ["Affiner ma silhouette", "Me dessiner et gagner en force", "Retrouver de l'énergie et une routine"],
  sous_en: ["Get leaner", "Get toned and stronger", "Get my energy and routine back"],
  obstacle: [["temps", "Le manque de temps"], ["craquages", "Je craque sur la nourriture"], ["quoi_faire", "Je ne sais pas quoi faire exactement"], ["motivation", "La motivation retombe vite"], ["tout_essaye", "J'ai déjà tout essayé, rien ne dure"], ["suivi", "Personne pour me suivre et me recadrer"]],
  obstacle_en: [["temps", "Not enough time"], ["craquages", "I give in to cravings"], ["quoi_faire", "I don't know exactly what to do"], ["motivation", "My motivation fades fast"], ["tout_essaye", "I've tried everything, nothing lasts"], ["suivi", "No one to keep me on track"]],
  projections: [["vetements", "Rentrer à nouveau dans mes vêtements préférés"], ["photos", "M'aimer sur les photos"], ["energie", "Avoir de l'énergie toute la journée"], ["routine", "Tenir une routine sans me forcer"], ["confiance", "Retrouver confiance en moi"]],
  projections_en: [["vetements", "Fitting into my favorite clothes again"], ["photos", "Loving how I look in photos"], ["energie", "Having energy all day long"], ["routine", "Sticking to a routine without forcing it"], ["confiance", "Feeling confident again"]],
  aide: "Jusqu'à 2 réponses.", aide_en: "Pick up to 2.",
  precisions: ["Autre chose ? Avec tes mots (facultatif, sans détail de santé)", "Ou dis-le avec tes mots (facultatif)"],
  precisions_en: ["Anything else? In your own words (optional, no health details)", "Or say it in your own words (optional)"],
  manque: "Il manque une réponse", manque_en: "One answer is missing",
  max: "2 réponses max", max_en: "2 answers max",
  lede: "3 questions, 30 secondes : dis-nous où tu en es.",
  lede_en: "3 questions, 30 seconds: tell us where you're at.",
  note: "Ce questionnaire ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.",
  bouton: "Voir ma prochaine étape", bouton_en: "See my next step",
  /* v61 (brief V2, D) : la page « Ton plan d'action personnalisé » (avant : « Ta prochaine étape », bilan de 30 minutes
     avec un coach MHX, deux boutons de même poids) — dans l'ordre : Offert, titre, projection, texte, garde, libre, bouton
     doré + sa ligne, « Plus tard » en lien discret */
  offert: "Offert", offert_en: "Free",
  titre: "Ton plan d'action personnalisé", titre_en: "Your personalized action plan",
  bilan: "En 15 minutes au téléphone avec Lucas, on transforme cet objectif en plan concret : ce qui te freine vraiment, par quoi commencer, et les 3 actions à mettre en place en priorité.",
  bilan_en: "In a 15-minute call with Lucas, we turn this goal into a concrete plan: what's really holding you back, where to start, and the 3 actions to put in place first.",
  garde: "Ton plan est à toi, quelle que soit la suite.", garde_en: "The plan is yours to keep, whatever you decide next.",
  /* v70 : la phrase « Si l'accompagnement te correspond… Tu es libre de dire non. » n'existe plus (FR et EN) ; les suites
     vérifient son ABSENCE (#dc-bilan-libre absent, texte absent de la page) */
  libre: "Tu es libre de dire non", libre_en: "You're free to say no",
  plan_sous: "15 min · par téléphone · offert", plan_sous_en: "15 min · phone call · free",
  projection: p => "Ton objectif dans 3 mois : « " + p + " »",
  projection_en: p => "Your goal in 3 months: “" + p + "”",
  neutre: "Faisons le point ensemble sur ton objectif.", neutre_en: "Let's review your goal together.",
  reserver: "Récupérer mon plan d'action", reserver_en: "Get my action plan",
  plus_tard: "Plus tard, je découvre mon espace", plus_tard_en: "Later, let me explore my space",
  /* v61 (vocabulaire commun, E et G) : la ligne sous « Récupérer mon plan d'action » (accueil, pages verrouillées) */
  cta_sous: "15 min avec Lucas · offert", cta_sous_en: "15 min with Lucas · free",
  /* v61 (brief V2, E2) : la carte de l'accueil */
  accomp: "Ce que l'accompagnement ajoute", accomp_en: "What coaching adds",
  accomp_note: "15 min avec Lucas pour faire le point sur ton objectif. Offert.", accomp_note_en: "15 min with Lucas to go over your goal. Free.",
  reserve_case: "J'ai déjà choisi mon créneau", reserve_case_en: "I've already booked my slot",
  /* ce qui ne doit plus jamais apparaître sur l'accueil ni la page du plan (FR et EN) : l'ancien bouton, une durée de 30 min */
  anciens: /Réserver mon bilan|Book my assessment|\b30 ?(minutes?|min)\b|30-minute/i,
  modifier: "Modifier mes réponses", modifier_en: "Edit my answers",
  annuler: "Annuler les modifications"
};
/* v52 (lot D) : les textes attendus de l'accueil du prospect et du calculateur */
const TXD = {
  calories: "Calcule tes calories (2 min)", pesee: "Enregistre ta pesée de départ",
  lede: "Ton espace gratuit, sans limite de temps : calculateur de calories, suivi de ton poids et Speed Formation.",
  lede_en: "Your free space, with no time limit: calorie calculator, weight tracking and Speed Formation.",
  avis: "Ces chiffres sont une estimation générale, pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.",
  mineur: "Le calculateur est réservé aux adultes (18 ans et plus) : rien n'est enregistré.",
  retire: "Ce que tu avais enregistré ici a été retiré.",
  imc: "Ton poids est en dessous d'un poids de forme habituel pour ta taille. Viser une perte n'est pas l'objectif ici : parles-en d'abord à un professionnel de santé.",
  /* v61 (brief V2, E2) : ce que l'accompagnement ajoute (AVANTAGES) — carte de l'accueil et note sous les pages verrouillées */
  av_journal: "Chaque séance notée, et la charge à viser la fois suivante.",
  av: { programme: "Tes séances construites pour toi et ajustées par ton coach selon tes progrès.", nutrition: "Tes repas calculés pour ton objectif, avec ta liste de courses.",
    journal: "Chaque séance notée, et la charge à viser la fois suivante.", suivi: "Ta régularité, ta courbe et le retour de ton coach chaque semaine." },
  av_en: { programme: "Workouts built for you and adjusted by your coach as you progress.", nutrition: "Meals calculated for your goal, with your shopping list.",
    journal: "Every workout logged, with the weight to aim for next time.", suivi: "Your consistency, your progress curve and your coach's feedback every week." }
};
/* v52 (lot D) : ce qui ne doit plus jamais apparaître côté prospect (limite de 7 jours, jour n/7, fin de découverte) */
const SEPT = /\b7 (jours|days)\b|\b(Jour|Day) \d+ ?\/ ?\d+\b|\bJ\d+\/\d+\b|découverte (est )?terminée|discovery (period )?is over|période découverte|discovery period|accès découverte|discovery access|Encore \d+ jours|more days of|Dernier jour de|Last day of/i;
/* deux objets égaux, quel que soit l'ordre de leurs clés */
const memes = (a, b) => { const t = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]])); return !!a && t(a) === t(b); };
const OBJ = { "Perdre du gras": "Perte de poids / sèche", "Prendre du muscle": "Prise de muscle", "Me remettre en forme": "Santé & énergie au quotidien" };
/* un nouveau prospect qui a validé les 3 questions */
const NOUVEAU = (extra) => Object.assign({ probleme: "Perdre du gras", obstacle: "Le manque de temps avec le travail", projection: "Courir 10 km sans m'arrêter",
  objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche", court_debut: avant(2 * H), court_le: avant(H) }, extra || {});   // v52 : objectif posé par l'app (marqueur)
/* v60 (brief V2, C) : NOUVEAU garde les réponses libres d'avant la v60 (lues telles quelles) ; NOUVEAU60, un prospect qui a
   répondu aux questions à toucher : texte français lisible + clés stables (+ précision) */
const NOUVEAU60 = (extra) => NOUVEAU(Object.assign({ obstacle: "Le manque de temps · Je craque sur la nourriture — le soir", obstacle_choix: ["temps", "craquages"],
  obstacle_precision: "le soir", projection: "Avoir de l'énergie toute la journée", projection_choix: ["energie"] }, extra || {}));
/* choisir une réponse à toucher : un clic sur la carte / la pastille (le label ; la case elle-même est invisible) */
const choisir = (page, id, v) => page.click(`#q-${id} label.dc-opt:has(input[value="${v}"])`);
/* l'état du formulaire à toucher : les valeurs cochées de chaque question, les précisions, le bouton */
const etatForm = page => page.evaluate(() => {
  const coches = id => Array.from(document.querySelectorAll(`#q-${id} input:checked`)).map(i => i.value);
  const val = id => { const e = document.getElementById(id); return e ? e.value : null; };
  const b = document.getElementById("dc-voir");
  return { probleme: coches("probleme"), obstacle: coches("obstacle"), projection: coches("projection"), po: val("q-obstacle-precision"), pp: val("q-projection-precision"),
    inactif: b ? b.getAttribute("aria-disabled") + "|" + b.classList.contains("inactif") : null };
}).catch(e => ({ erreur: String(e) }));
/* un ancien prospect (v51) : les 10 réponses de l'ancien questionnaire court, validé, pas de choix sur la page bilan */
const ANCIEN = { sexe: "Femme", age: "30", taille: "165", poids: "70", objectif: "Perte de poids / sèche", seances: "3", essaye: "Des régimes trop stricts.",
  obstacle: "Je manque de temps avec le travail", pourquoi: "Me sentir mieux cet été", motivation: "8", court_debut: avant(3 * J), court_le: avant(3 * J - H), email_compte: "ancienne@exemple.fr" };
const LIEN = (id, type) => "#access_token=lien." + id + ".x&refresh_token=renouvellement-" + id + "&expires_in=3600&token_type=bearer&type=" + (type || "signup");
/* un prospect : son compte (statut « prospect »), ses données, puis son navigateur, ouvert sur h (accueil par défaut) ;
   les métadonnées de sa session : l'accord santé de l'inscription (ACCORD_SANTE), sauf opts.meta (autres métadonnées) */
const compte = (k, prenom, nom, donnees, extra) => Object.assign({ id: PID(k), prenom, nom, cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: donnees || [] }, extra || {});
async function ouvrir(b, db, k, h, sel, opts){
  const x = db.profils.find(p => p.id === PID(k));
  const meta = opts && opts.meta;
  const { c, page } = await contexte(b, qui(PID(k), db.emails[PID(k)] || ("p" + k + "@exemple.fr"), meta), db, opts);
  await page.goto(URL0 + (h || "")); await pret(page, sel || "#vue .masthead");
  return { c, page, x };
}
const ouvrirS = (b, db, k, h, sel, opts) => ouvrir(b, db, k, h, sel, Object.assign({ meta: ACCORD_SANTE }, opts || {}));   // revue : prospect avec accord (saisie santé)
/* un clic sur un lien vers Calendly sans l'ouvrir (le clic est noté par l'app ; aucun onglet vers l'extérieur) */
const cliquerSansOuvrir = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); return true; }, sel).catch(() => false);
const lignes = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
const valeurDe = (page, sel) => page.$eval(sel, e => e.value).catch(() => null);
/* les écritures de données, hors compteur de visites du prospect (clé activite, écrite au plus une fois par minute) */
const saisies = db => ecrDonnees(db).filter(e => e.outil !== "activite");
const URL0 = `http://localhost:${PORT}/`;
const intakeDe = (db, uid) => (db.donnees.find(d => d.user_id === uid && d.outil === "intake") || {}).contenu;
/* le lien Calendly de la page bilan : exact (paramètres attendus, rien d'autre), prénom + nom si l'app les envoie (lot B)
   v61 (brief V2, F) : l'événement de 15 min (…/ton-plan-d-action-offert-15-min-avec-lucas, jamais …/30min),
   utm_source=app, utm_medium=bouton (avant : app-mhx / app), utm_content = le code d'origine (avec « _ » : apres_questionnaire,
   accueil_haut, verrou_programme…) */
const CAL15 = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
function lienOk(href, base, attendu){
  let u; try { u = new URL(href); } catch (e) { return "adresse illisible"; }
  if (href.split("?")[0] !== base) return "base " + href.split("?")[0];
  if (base !== CAL15) return "événement Calendly " + base;
  const p = [...u.searchParams.entries()], k = p.map(x => x[0]), v = Object.fromEntries(p);
  const permis = ["utm_source", "utm_medium", "utm_content", "name", "first_name", "last_name", "email"];
  if (k.some(x => !permis.includes(x)) || new Set(k).size !== k.length) return "paramètres " + k.join(",");
  if (!/^[a-z0-9_]{1,40}$/.test(attendu.source)) return "code d'origine attendu illisible " + attendu.source;
  if (v.utm_source !== "app" || v.utm_medium !== "bouton" || v.utm_content !== attendu.source) return "utm " + JSON.stringify(v);
  if (v.first_name !== attendu.prenom || v.email !== attendu.email) return "prénom / email " + JSON.stringify(v);
  const complet = attendu.prenom + " " + attendu.nom;
  if (!(v.name === attendu.prenom || v.name === complet)) return "name " + v.name;
  if ("last_name" in v && v.last_name !== attendu.nom) return "last_name " + v.last_name;
  if (v.name === complet && v.last_name !== attendu.nom) return "name complet sans last_name";
  if (!href.startsWith(base + "?utm_source=app&utm_medium=bouton&utm_content=" + attendu.source + "&")) return "ordre utm";
  return "";
}

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF56_PORT=9721 node verif56.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. réglages et définitions =================== */
  await bloc("A. réglages", async () => {
    const db = base({ comptes: [compte(1, "Léa", "Martin")] });
    const { c, page } = await ouvrir(b, db, 1, "", "#q-probleme");
    const r = await page.evaluate(() => {
      const D = CONFIG.decouverte, fr = DECOUVERTE.questions, en = DECOUVERTE.en.questions;
      const obj = QUESTIONS.find(q => q.id === "objectif");
      return {
        questions: D.questions, requis: D.requis, avant: D.questions_avant,
        /* v60 : [id, type, libellé, options, sous-textes, max, aide, choix [clé, libellé], précision] */
        fr: fr.map(q => [q.id, q.type, q.label, q.options || null, q.sous || null, q.max || null, q.aide || null, q.choix || null, q.precision || null]),
        en: en.map(q => [q.id, q.type, q.label, q.options || null, q.sous || null, q.max || null, q.aide || null, q.choix || null, q.precision || null]),
        avantFr: (DECOUVERTE.questions_avant || []).map(q => [q.id, q.type, q.label]), avantEn: ((DECOUVERTE.en || {}).questions_avant || []).map(q => [q.id, q.type, q.label]),
        pasDansQuestions: ["probleme", "projection"].every(id => !QUESTIONS.some(q => q.id === id)),
        table: D.objectif_depuis, options: obj ? obj.options : [],
        depuis: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme", "autre", "", null, 5].map(v => Decouverte.objectifDepuis(v)),
        sens: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme"].map(v => outilCalculateur.departDepuis({ objectif: Decouverte.objectifDepuis(v), poids: "70", taille: "170", age: "30", sexe: "Femme", seances: "3" }).objectif)
      };
    });
    ok("CONFIG : questions = requis = probleme, obstacle, projection ; l'ancienne liste de 10 gardée (questions_avant)", JSON.stringify(r.questions) === '["probleme","obstacle","projection"]' && JSON.stringify(r.requis) === '["probleme","obstacle","projection"]' && JSON.stringify(r.avant) === '["sexe","age","taille","poids","objectif","seances","essaye","obstacle","pourquoi","motivation"]', JSON.stringify(r));
    /* v60 (brief V2, C) : des réponses à toucher — probleme en cartes (valeurs = les options françaises EXACTES d'avant, avec
       leur petit texte), obstacle en pastilles (2 choix au plus, clés stables), projection en pastilles (un choix) ; précisions
       libres facultatives pour les deux dernières */
    ok("DECOUVERTE.questions : probleme (cartes « Perdre du gras / Prendre du muscle / Me remettre en forme », sous-textes), obstacle (pastilles, 2 au plus, 6 clés stables), projection (pastilles, 1 choix, 5 clés), précisions libres, libellés exacts", JSON.stringify(r.fr) === JSON.stringify([["probleme", "cartes", TX.labels[0], TX.options, TX.sous, null, null, null, null], ["obstacle", "choix", TX.labels[1], null, null, 2, TX.aide, TX.obstacle, TX.precisions[0]], ["projection", "choix", TX.labels[2], null, null, 1, null, TX.projections, TX.precisions[1]]]), JSON.stringify(r.fr));
    ok("DECOUVERTE.en.questions : mêmes identifiants, même ordre, mêmes types, mêmes maximums et mêmes clés, en anglais", JSON.stringify(r.en) === JSON.stringify([["probleme", "cartes", TX.labels_en[0], TX.options_en, TX.sous_en, null, null, null, null], ["obstacle", "choix", TX.labels_en[1], null, null, 2, TX.aide_en, TX.obstacle_en, TX.precisions_en[0]], ["projection", "choix", TX.labels_en[2], null, null, 1, null, TX.projections_en, TX.precisions_en[1]]]), JSON.stringify(r.en));
    ok("« probleme » et « projection » sont de nouveaux identifiants (absents du questionnaire complet : aucune option d'« objectif » réutilisée)", r.pasDansQuestions, "");
    ok("anciennes définitions gardées pour l'affichage (essaye, obstacle avec son ancien libellé, motivation), en français et en anglais, même ordre", JSON.stringify(r.avantFr) === JSON.stringify([["essaye", "long", "Qu'as-tu déjà essayé pour atteindre cet objectif ?"], ["obstacle", "long", "Quel est ton principal obstacle aujourd'hui ?"], ["motivation", "echelle", "Ta motivation pour t'y mettre maintenant"]]) && JSON.stringify(r.avantEn.map(x => x[0])) === '["essaye","obstacle","motivation"]' && r.avantEn[1][2] === "What is your main obstacle today?", JSON.stringify([r.avantFr, r.avantEn]));
    ok("table problème → objectif : chaque cible est une option EXACTE du questionnaire complet", JSON.stringify(r.table) === JSON.stringify(OBJ) && Object.values(r.table).every(o => r.options.includes(o)), JSON.stringify([r.table, r.options]));
    ok("« Perdre du gras » → option perte (/perte|s[èe]che/), « Prendre du muscle » → option prise (/prise|masse/), « Me remettre en forme » → santé & énergie ; toute autre valeur → rien", /perte|s[èe]che/i.test(r.depuis[0]) && /prise|masse/i.test(r.depuis[1]) && r.depuis[2] === "Santé & énergie au quotidien" && r.depuis.slice(3).every(x => x === ""), JSON.stringify(r.depuis));
    ok("… le calcul des calories en profite : perte, prise, maintien (mêmes formules)", JSON.stringify(r.sens) === '["perte","prise","maintien"]', JSON.stringify(r.sens));
    const p = await page.evaluate(() => {
      const t = (I, prec) => { const x = Object.assign({}, I); const ch = Decouverte.poserObjectif(x, prec); return [ch, x.objectif === undefined ? null : x.objectif]; };
      const out = {
        vide: t({ probleme: "Perdre du gras" }), videChaine: t({ probleme: "Prendre du muscle", objectif: "  " }),
        choisi: t({ probleme: "Perdre du gras", objectif: "Recomposition (perdre du gras + prendre du muscle)" }),
        suivi: t({ probleme: "Prendre du muscle", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche" }),   // v52 : posé par l'app (marqueur objectif_auto) → il suit
        pasSuiviSiChoisi: t({ probleme: "Prendre du muscle", objectif: "Perte de poids / sèche" }),   // sans marqueur : choisi par la personne → jamais remplacé
        sansProbleme: t({ objectif: "" }), inconnu: t({ probleme: "<b>x</b>" })
      };
      /* une cible qui n'est plus une option du questionnaire complet : jamais posée */
      const avantT = CONFIG.decouverte.objectif_depuis["Me remettre en forme"];
      CONFIG.decouverte.objectif_depuis["Me remettre en forme"] = "Option disparue";
      out.disparue = [Decouverte.objectifDepuis("Me remettre en forme"), t({ probleme: "Me remettre en forme" })];
      CONFIG.decouverte.objectif_depuis["Me remettre en forme"] = avantT;
      return out;
    });
    ok("objectif vide (ou espaces) : posé depuis la réponse « problème »", JSON.stringify(p.vide) === '[true,"Perte de poids / sèche"]' && JSON.stringify(p.videChaine) === '[true,"Prise de muscle"]', JSON.stringify(p));
    ok("objectif déjà choisi dans le questionnaire complet : jamais remplacé", JSON.stringify(p.choisi) === '[false,"Recomposition (perdre du gras + prendre du muscle)"]' && JSON.stringify(p.pasSuiviSiChoisi) === '[false,"Perte de poids / sèche"]', JSON.stringify(p));
    ok("objectif posé par la table puis réponse « problème » changée : il suit (« Perdre du gras » → « Prendre du muscle »)", JSON.stringify(p.suivi) === '[true,"Prise de muscle"]', JSON.stringify(p.suivi));
    ok("sans réponse « problème », réponse inconnue, ou cible absente du questionnaire complet : rien n'est posé", JSON.stringify(p.sansProbleme) === '[false,""]' && JSON.stringify(p.inconnu) === "[false,null]" && JSON.stringify(p.disparue) === '["",[false,null]]', JSON.stringify(p));
    const e = await page.evaluate(() => [Decouverte.extrait("  Courir   10 km  "), Decouverte.extrait(5), Decouverte.extrait({ a: 1 }), Decouverte.extrait(null), Decouverte.extrait(undefined),
      Decouverte.extrait("mot ".repeat(80), 160), Decouverte.extrait("😀".repeat(200), 160)]);
    ok("réponse citée : espaces resserrés ; nombre → texte ; objet, null, absent → rien", e[0] === "Courir 10 km" && e[1] === "5" && e[2] === "" && e[3] === "" && e[4] === "", JSON.stringify(e.slice(0, 5)));
    ok("réponse longue : 160 caractères au plus, coupée à un espace (jamais au milieu d'un mot), « … » ; emojis jamais coupés en deux", Array.from(e[5]).length <= 161 && e[5].endsWith("mot…") && !/\s…$/.test(e[5]) && Array.from(e[6]).length === 161 && e[6].endsWith("😀…") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(e[6]), JSON.stringify([e[5].slice(-12), Array.from(e[6]).length]));
    ok("réglages : aucune écriture", db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== B. les 3 questions, juste après la vérification d'email =================== */
  await bloc("B. arrivée par le lien", async () => {
    const ID = PID(10), mail = "lea@exemple.fr";
    const db = base({ comptes: [{ id: ID, prenom: "Léa", nom: "Martin", cree: avant(5 * MIN), email: mail }] });
    /* v66 (sécurité) : un lien portant des jetons (#access_token=…) n'ouvre plus de session ; la personne se connecte avec
       son email et son mot de passe (session posée ici), et arrive sur le même accueil */
    const x0 = await contexte(b, null, db);
    await x0.page.goto(URL0 + LIEN(ID)); await x0.page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(x0.page, 400);
    const l0 = { url: x0.page.url(), err: await texte(x0.page, "#co-err"), session: await x0.page.evaluate(() => !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session"))) };
    await x0.c.close();
    const { c, page } = await contexte(b, qui(ID, mail), db);
    await page.goto(URL0); await pret(page, "#q-probleme");
    const d = await ou(page), v = await texte(page, "#vue");
    ok("lien de l'email (jetons dans l'adresse) : aucune session, « Ce lien n'est plus valable », adresse nettoyée ; connectée par mot de passe, l'accueil est le questionnaire court", !l0.session && l0.err.startsWith("Ce lien n'est plus valable") && !/access_token/.test(l0.url) && d.courant === "accueil" && !!(await page.$("#vue #q-probleme")), JSON.stringify(l0) + " · " + JSON.stringify(d));
    /* v60 (brief V2, C) : 3 questions à toucher (fieldset) ; plus aucune liste (select) ni texte libre à la place des questions */
    const champs = await page.$$eval("#vue [id^='q-']", l => l.map(e => e.id + ":" + e.tagName + (e.dataset.type ? ":" + e.dataset.type : "") + (e.dataset.max ? ":" + e.dataset.max : ""))).catch(() => []);
    ok("exactement 3 questions à toucher : #q-probleme (cartes), #q-obstacle (pastilles, 2 au plus, message « max ») et #q-projection (pastilles), une précision libre sous les deux dernières ; plus aucune liste ; plus aucune question d'âge", JSON.stringify(champs) === '["q-probleme:FIELDSET:cartes","q-obstacle:FIELDSET:choix:2","q-obstacle-max:P","q-obstacle-precision:TEXTAREA","q-projection:FIELDSET:choix","q-projection-precision:TEXTAREA"]' && !(await page.$("#vue select")) && !(await page.$("#q-age")) && !v.includes("À partir de"), JSON.stringify(champs));
    const opts = await page.$$eval("#vue fieldset.dc-q", l => l.map(f => Array.from(f.querySelectorAll("label.dc-opt")).map(lb => {
      const i = lb.querySelector("input"), t = s => { const e = lb.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
      return [i.type, i.name, i.value, t(".dc-opt-l"), t(".dc-opt-s"), lb.getBoundingClientRect().height >= 44];
    }))).catch(() => []);
    const attOpts = [TX.options.map((o, i) => ["radio", "q-probleme", o, o, TX.sous[i], true]), TX.obstacle.map(([k, l]) => ["checkbox", "q-obstacle", k, l, "", true]), TX.projections.map(([k, l]) => ["radio", "q-projection", k, l, "", true])];
    ok("« Ton objectif numéro 1 ? » : 3 cartes (un choix) Perdre du gras / Prendre du muscle / Me remettre en forme, valeurs inchangées, avec leur petit texte ; obstacle : 6 pastilles (cases, clés stables) ; projection : 5 pastilles (un choix) ; zones de tap d'au moins 44 px", JSON.stringify(opts) === JSON.stringify(attOpts), JSON.stringify(opts));
    const libs = await page.$$eval("#vue fieldset.dc-q > legend", l => l.map(e => e.textContent)).catch(() => []);
    const prec = await page.$$eval("#vue label.dc-precision", l => l.map(e => e.getAttribute("for") + "|" + e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    const aide = await texte(page, "#q-obstacle .dc-aide");
    ok("libellés exacts des 3 questions (typographie française : espace insécable avant « ? »), « Jusqu'à 2 réponses. », précisions libres « Autre chose ? … » et « Ou dis-le avec tes mots (facultatif) » reliées à leur champ", JSON.stringify(libs.map(norm)) === JSON.stringify(TX.labels) && libs.every(x => / \?$/.test(x)) && aide === TX.aide && JSON.stringify(prec) === JSON.stringify(["q-obstacle-precision|" + TX.precisions[0], "q-projection-precision|" + TX.precisions[1]]), JSON.stringify([libs, aide, prec]));
    ok("en-tête « 3 questions, 30 secondes » (plus de « 10 questions » ni « 1 minute »), « Voir ma prochaine étape », « pas un avis médical » sous le formulaire, aucun bouton Calendly", (await texte(page, "#vue .masthead .lede")) === TX.lede && !/10 questions|1 minute/.test(v) && (await texte(page, "#dc-voir")) === TX.bouton && (await texte(page, "#vue .panel .note:last-child")) === TX.note && !(await page.$("#vue a[href*='calendly']")), (await texte(page, "#vue .masthead .lede")) + " · " + (await texte(page, "#dc-voir")) + " · " + (await texte(page, "#vue .panel .note:last-child")));
    ok("arrivée : aucune écriture de données", saisies(db).length === 0, resume(db));
    /* réponses requises : le bouton a l'air inactif (aria-disabled, pas disabled) mais répond quand on le touche */
    const b0 = (await etatForm(page)).inactif;
    await page.click("#dc-voir", { force: true }); await attendre(page, 300);
    const msg = await texte(page, "#dc-msg"), ko = await page.$eval("#dc-msg", e => e.classList.contains("msg") && e.classList.contains("ko")).catch(() => false);
    const manque = await page.$$eval("#vue .manque", l => l.map(e => e.id)).catch(() => []);
    await attendre(page, 1000);
    ok("« Voir ma prochaine étape » sans rien remplir : bouton l'air inactif (aria-disabled, « inactif ») mais touché : « Il manque une réponse », les 3 questions signalées, rien d'écrit", b0 === "true|true" && msg === TX.manque && ko && JSON.stringify(manque) === '["q-probleme","q-obstacle","q-projection"]' && saisies(db).length === 0, b0 + " · " + msg + " · " + JSON.stringify(manque));
    /* brouillon pendant la saisie */
    await choisir(page, "probleme", "Perdre du gras"); await attendre(page, 1300);
    const I1 = clone(intakeDe(db, ID)) || {};
    ok("brouillon : la réponse « problème » (carte touchée) part tout de suite, avec court_debut, email_compte et l'objectif posé (« Perte de poids / sèche »), sans court_le", I1.probleme === "Perdre du gras" && I1.objectif === OBJ["Perdre du gras"] && typeof I1.court_debut === "string" && !isNaN(Date.parse(I1.court_debut)) && I1.email_compte === mail && !I1.court_le, JSON.stringify(I1));
    /* obstacle : 2 pastilles, la 3e refusée (« 2 réponses max »), puis la précision tapée */
    await choisir(page, "obstacle", "temps"); await choisir(page, "obstacle", "craquages"); await attendre(page, 200);
    await choisir(page, "obstacle", "quoi_faire"); await attendre(page, 200);
    const max = await texte(page, "#q-obstacle-max"), e3 = await etatForm(page);
    await page.click("#q-obstacle-precision"); await page.keyboard.type("le soir", { delay: 25 }); await attendre(page, 1300);
    const I2 = clone(intakeDe(db, ID)) || {}, focus = await page.evaluate(() => document.activeElement && document.activeElement.id);
    const jamais3 = ecr(db, "intake", ID).every(e => !((e.contenu || {}).obstacle_choix || []).includes("quoi_faire"));
    ok("obstacle : 2 pastilles prises, la 3e refusée (« 2 réponses max », case pas prise, jamais écrite) ; brouillon : la précision tapée part pendant la frappe, sans quitter le champ (« Le manque de temps · Je craque sur la nourriture — le soir », clés, précision) ; court_debut inchangé", max === TX.max && JSON.stringify(e3.obstacle) === '["temps","craquages"]' && jamais3 && I2.obstacle === "Le manque de temps · Je craque sur la nourriture — le soir" && JSON.stringify(I2.obstacle_choix) === '["temps","craquages"]' && I2.obstacle_precision === "le soir" && focus === "q-obstacle-precision" && I2.court_debut === I1.court_debut && !I2.court_le, max + " · " + JSON.stringify(e3) + " · " + JSON.stringify(I2) + " · " + focus);
    await page.reload(); await pret(page, "#q-probleme");
    const e4 = await etatForm(page);
    ok("après rechargement : les réponses sont là (carte et pastilles cochées, précision), le questionnaire reste ouvert, bouton toujours inactif (il manque la projection)", JSON.stringify(e4.probleme) === '["Perdre du gras"]' && JSON.stringify(e4.obstacle) === '["temps","craquages"]' && e4.po === "le soir" && e4.projection.length === 0 && e4.pp === "" && e4.inactif === "true|true" && !(await page.$("#dc-bilan")), JSON.stringify(e4));
    await page.fill("#q-projection-precision", "    "); await page.click("#dc-voir", { force: true }); await attendre(page, 300);
    const msg2 = await texte(page, "#dc-msg"), manque2 = await page.$$eval("#vue .manque", l => l.map(e => e.id)).catch(() => []), e5 = await etatForm(page); await attendre(page, 1000);
    ok("une précision faite d'espaces seulement ne compte pas : bouton toujours inactif, « Il manque une réponse », seule « Dans 3 mois… » signalée, pas de court_le", msg2 === TX.manque && JSON.stringify(manque2) === '["q-projection"]' && e5.inactif === "true|true" && !(intakeDe(db, ID) || {}).court_le, msg2 + " · " + JSON.stringify(manque2) + " · " + e5.inactif);
    /* projection : un seul choix (toucher une autre pastille remplace la première), puis sa précision */
    await choisir(page, "projection", "photos"); await choisir(page, "projection", "energie"); await page.fill("#q-projection-precision", "Courir 10 km sans m'arrêter"); await attendre(page, 200);
    const e6 = await etatForm(page);
    const t0 = Date.now(); await page.click("#dc-voir"); await attendre(page, 1600);
    const I3 = clone(intakeDe(db, ID)) || {}, fin = ecr(db, "intake", ID).filter(e => e.contenu && e.contenu.court_le);
    ok("validation (bouton actif, une seule pastille « Dans 3 mois » : la dernière touchée) : court_le (maintenant), les 3 réponses (texte français lisible, clés, précisions), l'objectif, court_debut du premier brouillon, email du compte ; une seule date de validation", e6.inactif === "false|false" && JSON.stringify(e6.projection) === '["energie"]' && typeof I3.court_le === "string" && Math.abs(Date.parse(I3.court_le) - t0) < 10000 && I3.probleme === "Perdre du gras" && I3.obstacle === "Le manque de temps · Je craque sur la nourriture — le soir" && JSON.stringify(I3.obstacle_choix) === '["temps","craquages"]' && I3.obstacle_precision === "le soir" && I3.projection === "Avoir de l'énergie toute la journée — Courir 10 km sans m'arrêter" && JSON.stringify(I3.projection_choix) === '["energie"]' && I3.projection_precision === "Courir 10 km sans m'arrêter" && I3.objectif === OBJ["Perdre du gras"] && I3.court_debut === I1.court_debut && I3.email_compte === mail && new Set(fin.map(e => e.contenu.court_le)).size === 1, JSON.stringify(e6) + " · " + JSON.stringify(I3));
    ok("… puis la page « Ton plan d'action » s'affiche (plus le questionnaire), {projection} = sa précision libre (« Ton objectif dans 3 mois : « … » »)", !!(await page.$("#dc-bilan")) && !(await page.$("#q-probleme")) && (await texte(page, "#dc-projection")) === TX.projection("Courir 10 km sans m'arrêter"), await texte(page, "#vue"));
    ok("… aucune autre clé écrite que intake (pas de challenge, pas de profil)", saisies(db).every(e => e.table === "donnees" && e.outil === "intake" && e.user_id === ID), resume(db));
    await c.close();
  });
  await bloc("B. questionnaire en anglais", async () => {
    const db = base({ comptes: [compte(11, "Léa", "Martin")] });
    const { c, page } = await ouvrir(b, db, 11, "", "#q-probleme", { langue: "en" });
    await attendre(page, 400);
    const libs = await page.$$eval("#vue fieldset.dc-q > legend", l => l.map(e => e.textContent)).catch(() => []);
    const opts = await page.$$eval("#vue label.dc-opt", l => l.map(lb => { const t = s => { const e = lb.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; }; return t(".dc-opt-l") + (t(".dc-opt-s") ? " — " + t(".dc-opt-s") : "") + "=" + lb.querySelector("input").value; })).catch(() => []);
    const autres = [await texte(page, "#q-obstacle .dc-aide")].concat(await page.$$eval("#vue label.dc-precision", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []));
    const attEn = TX.options_en.map((x, i) => x + " — " + TX.sous_en[i] + "=" + TX.options[i]).concat(TX.obstacle_en.map(([k, l]) => l + "=" + k), TX.projections_en.map(([k, l]) => l + "=" + k));
    ok("anglais : libellés traduits (« Your #1 goal? »…, sans espace insécable), cartes et pastilles affichées en anglais (« Lose fat — Get leaner »…), valeurs gardées (options françaises, clés), « Pick up to 2. » et précisions en anglais", JSON.stringify(libs) === JSON.stringify(TX.labels_en) && !libs.some(x => / /.test(x)) && JSON.stringify(opts) === JSON.stringify(attEn) && JSON.stringify(autres) === JSON.stringify([TX.aide_en].concat(TX.precisions_en)), JSON.stringify([libs, opts, autres]));
    const v = await texte(page, "#vue");
    const fr = TX.labels.concat(TX.options, TX.sous, TX.obstacle.map(x => x[1]), TX.projections.map(x => x[1]), TX.precisions, [TX.aide, TX.bouton, TX.lede]);
    ok("anglais : « 3 questions, 30 seconds: tell us where you're at. », « See my next step », note médicale en anglais, aucun texte français du questionnaire", (await texte(page, "#vue .masthead .lede")) === TX.lede_en && (await texte(page, "#dc-voir")) === TX.bouton_en && v.includes("This questionnaire is not medical advice.") && !v.includes("Il manque") && !fr.some(x => v.includes(x)), v.slice(0, 300));
    await page.click("#dc-voir", { force: true }); await attendre(page, 300);
    const m1 = await texte(page, "#dc-msg");
    await choisir(page, "obstacle", "temps"); await choisir(page, "obstacle", "suivi"); await choisir(page, "obstacle", "motivation"); await attendre(page, 200);
    const m2 = await texte(page, "#q-obstacle-max"), e = await etatForm(page);
    ok("anglais : « One answer is missing » (bouton touché trop tôt), puis « 2 answers max » (3e pastille refusée)", m1 === TX.manque_en && m2 === TX.max_en && JSON.stringify(e.obstacle) === '["temps","suivi"]', m1 + " · " + m2 + " · " + JSON.stringify(e.obstacle));
    await c.close();
  });

  /* =================== C. la page de proposition de bilan =================== */
  await bloc("C. page bilan", async () => {
    for (const viewport of [ORDI, MOBILE]) {
      const k = viewport === ORDI ? 20 : 21, ID = PID(k);
      const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ email_compte: "p" + k + "@exemple.fr" })]])] });
      const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan", { viewport });
      const w = viewport.width + " px";
      ok(`${w} : questionnaire validé sans choix → la page « Ton plan d'action » (ni questionnaire, ni accueil, ni ancien résultat)`, !!(await page.$("#dc-bilan")) && !(await page.$("#q-probleme, #dc-accomp, #dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")), "");
      ok(`${w} : sa réponse « projection » reprise : « Ton objectif dans 3 mois : « Courir 10 km sans m'arrêter » »`, (await texte(page, "#dc-projection")) === TX.projection("Courir 10 km sans m'arrêter"), await texte(page, "#dc-projection"));
      /* v61 (brief V2, D) : les textes EXACTS du plan d'action offert, dans l'ordre (avant : le texte du bilan de 30 minutes) */
      const ordre = await page.$$eval("#dc-bilan > *", l => l.map(e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className ? "." + e.className.trim().split(/\s+/).join(".") : ""))).catch(() => []);
      const txts = [await texte(page, "#dc-offert"), await texte(page, "#dc-bilan h2"), await texte(page, "#dc-bilan-texte"), await texte(page, "#dc-bilan-garde")];
      const vueTxt = await texte(page, "#vue");
      ok(`${w} : textes EXACTS du plan d'action offert, dans l'ordre (« ${TX.offert} » en étiquette, « ${TX.titre} », projection, « En 15 minutes au téléphone avec Lucas… », « ${TX.garde} »), sans le petit texte « Tu es libre de dire non » (v70), plus aucun « Réserver mon bilan » ni « 30 minutes »`,
        JSON.stringify(txts) === JSON.stringify([TX.offert, TX.titre, TX.bilan, TX.garde]) && JSON.stringify(ordre) === JSON.stringify(["span#dc-offert.eyebrow.dc-offert", "h2", "p#dc-projection.dc-projection", "p#dc-bilan-texte", "p#dc-bilan-garde", "div.dc-cta"]) && !(await page.$("#dc-bilan-libre")) && !vueTxt.includes(TX.libre) && !TX.anciens.test(vueTxt), JSON.stringify([txts, ordre]));
      const bt = await page.evaluate(() => {
        const f = e => { if (!e) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { tag: e.tagName, cls: e.className, txt: e.textContent.trim(), w: r.width, h: r.height, fond: s.backgroundColor, image: s.backgroundImage, couleur: s.color, bord: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].join(" "), souligne: s.textDecorationLine, graisse: s.fontWeight }; };
        const cta = document.querySelector("#dc-bilan .dc-cta");
        /* les éléments de la page qui ont un fond (le seul attendu : le bouton doré) */
        const fonds = [...document.querySelectorAll("#dc-bilan *")].filter(e => { const s = getComputedStyle(e); return (s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent") || s.backgroundImage !== "none"; }).map(e => e.id || e.tagName);
        return { r: f(document.querySelector("#dc-bilan-reserver")), t: f(document.querySelector("#dc-bilan-plus-tard")), sous: document.querySelector("#dc-bilan-sous") ? document.querySelector("#dc-bilan-sous").textContent.replace(/\s+/g, " ").trim() : null,
          dansCta: !!cta && [...cta.children].map(e => e.id).join(",") === "dc-bilan-reserver,dc-bilan-sous,dc-bilan-plus-tard",
          nCal: document.querySelectorAll("#vue a[href*='calendly']").length, nBtn: document.querySelectorAll("#dc-bilan .btn").length, fonds };
      });
      ok(`${w} : UN seul bouton « ${TX.reserver} » (a.btn, le seul .btn et le seul lien Calendly de la page), suivi de « ${TX.plan_sous} », puis « ${TX.plus_tard} » (button.lien-discret, pas .btn)`, !!bt.r && !!bt.t && bt.r.tag === "A" && bt.r.txt === TX.reserver && bt.t.tag === "BUTTON" && /(^| )lien-discret( |$)/.test(bt.t.cls) && !/(^| )btn( |$)/.test(bt.t.cls) && bt.t.txt === TX.plus_tard && bt.sous === TX.plan_sous && bt.dansCta && bt.nCal === 1 && bt.nBtn === 1, JSON.stringify(bt));
      /* v61 (brief V2, D) : avant, deux boutons de même taille et de même poids ; désormais un seul élément doré domine —
         le bouton a son fond (seul élément de la page à en avoir un), au moins 120 × 40 px ; « Plus tard » n'a ni fond ni
         bordure, il est souligné, d'une autre couleur que le fond du bouton, jamais plus gras que lui, zone de tap ≥ 44 px */
      ok(`${w} : un seul élément doré domine : le bouton (seul fond de la page, 120 × 40 px au moins) ; « Plus tard » : ni fond ni bordure, souligné, d'une autre couleur, pas plus gras, zone de tap de 44 px`,
        !!bt.r && !!bt.t && JSON.stringify(bt.fonds) === '["dc-bilan-reserver"]' && bt.r.w >= 120 && bt.r.h >= 40 && bt.t.fond === "rgba(0, 0, 0, 0)" && bt.t.image === "none" && bt.t.bord === "0px 0px 0px 0px" && /underline/.test(bt.t.souligne) && bt.t.couleur !== bt.r.fond && +bt.t.graisse <= +bt.r.graisse && bt.t.h >= 44,
        JSON.stringify([bt.fonds, bt.r && [bt.r.w, bt.r.h, bt.r.fond, bt.r.graisse], bt.t && [bt.t.w, bt.t.h, bt.t.fond, bt.t.image, bt.t.bord, bt.t.souligne, bt.t.couleur, bt.t.graisse]]));
      const a = await page.$eval("#dc-bilan-reserver", e => ({ href: e.getAttribute("href"), target: e.getAttribute("target"), rel: e.getAttribute("rel"), cal: e.dataset.dcCal })).catch(() => ({}));
      const lien = await page.evaluate(() => ({ base: CONFIG.marque.calendly, fn: lienCalendly("apres_questionnaire") }));
      const pb = lienOk(a.href || "", lien.base, { source: "apres_questionnaire", prenom: "Léa", nom: "Martin", email: "p" + k + "@exemple.fr" });
      ok(`${w} : « ${TX.reserver} » = lien Calendly de l'événement de 15 min pré-rempli exact (utm_source=app, utm_medium=bouton, utm_content=apres_questionnaire, prénom, nom si envoyé, email), data-dc-cal="apres_questionnaire", nouvel onglet`, !pb && a.href === lien.fn && a.cal === "apres_questionnaire" && a.target === "_blank" && /noopener/.test(a.rel || ""), pb + " · " + a.href + " · " + a.cal);
      ok(`${w} : aucun défilement horizontal ; aucune écriture à l'affichage`, !(await deborde(page)) && saisies(db).length === 0, (await largeur(page)) + " · " + resume(db));
      if (viewport === MOBILE) { try { fs.mkdirSync(path.join(__dirname, "captures", "v56"), { recursive: true }); } catch (e) { } await page.screenshot({ path: path.join(__dirname, "captures", "v56", "bilan-mobile.png"), fullPage: true }).catch(() => {}); }
      await c.close();
    }
  });
  await bloc("C. « Récupérer mon plan d'action »", async () => {
    const k = 22, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    const n0 = db.ecritures.length, t0 = Date.now();
    await cliquerSansOuvrir(page, "#dc-bilan-reserver"); await attendre(page, 2200);
    const I = clone(intakeDe(db, ID)) || {}, C = (db.donnees.find(d => d.user_id === ID && d.outil === "challenge") || {}).contenu || {};
    const wI = ecr(db, "intake", ID), cl = ((C.cta || {}).clics || []);
    /* v62 (relecture) : un clic n'est jamais un « Plus tard » : aucun cta.plus_tard dans la même écriture */
    ok("clic « Récupérer mon plan d'action » : noté une fois dans challenge (source apres_questionnaire), aucun « Plus tard » noté avec", cl.length === 1 && cl[0].source === "apres_questionnaire" && ecr(db, "challenge", ID).length === 1 && !(C.cta || {}).plus_tard, JSON.stringify(C));
    ok("… choix mémorisé en UNE écriture : intake.bilan_propose = { choix: « reserver », le: maintenant }, les réponses intactes", wI.length === 1 && I.bilan_propose && I.bilan_propose.choix === "reserver" && Math.abs(Date.parse(I.bilan_propose.le) - t0) < 10000 && Object.keys(I.bilan_propose).sort().join() === "choix,le" && I.projection === NOUVEAU().projection && I.court_le === NOUVEAU().court_le, JSON.stringify(I));
    ok("… puis l'accueil du prospect (Speed Formation, « Récupérer mon plan d'action »), plus la page du plan", !!(await page.$("#dc-accomp")) && !!(await page.$("#dc-formation")) && !(await page.$("#dc-bilan")), await texte(page, "#vue"));
    ok("… événement local « call_cta_clicked » (Calendly) noté", (await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_tracking") || "[]").map(x => x.event); } catch (e) { return []; } })).includes("call_cta_clicked"), "");
    await page.reload(); await pret(page, "#dc-accomp");
    ok("rechargement : l'accueil directement, la page du plan ne revient pas, rien de réécrit", !(await page.$("#dc-bilan")) && ecr(db, "intake", ID).length === 1 && ecr(db, "challenge", ID).length === 1 && saisies(db).length === n0 + 2, resume(db));
    await c.close();
  });
  await bloc("C. « Plus tard »", async () => {
    const k = 23, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    /* deux clics coup sur coup (double tape) */
    const t0 = Date.now();
    await page.evaluate(() => { const t = document.querySelector("#dc-bilan-plus-tard"); t.click(); t.click(); }); await attendre(page, 1800);
    const I = clone(intakeDe(db, ID)) || {}, wI = ecr(db, "intake", ID);
    /* v62 (brief V2, L) : le « Plus tard » est aussi noté avec son origine dans la clé challenge (cta.plus_tard =
       [{ source, date }]) — avant : aucune écriture de challenge ; toujours UNE écriture de chaque clé pour un double tape,
       et toujours aucun clic Calendly noté (cta.clics vide) */
    const Cpt = (db.donnees.find(d => d.user_id === ID && d.outil === "challenge") || {}).contenu || {}, cta = Cpt.cta || {}, pt = Array.isArray(cta.plus_tard) ? cta.plus_tard : [];
    ok("« Plus tard, je découvre mon espace » (deux clics) : UNE écriture de chaque clé : bilan_propose = { choix: « plus_tard », le } (intake) et UN « Plus tard » noté avec son origine (challenge.cta.plus_tard = [{ source: apres_questionnaire, date: maintenant }]), aucun clic Calendly noté",
      wI.length === 1 && I.bilan_propose && I.bilan_propose.choix === "plus_tard" && typeof I.bilan_propose.le === "string" && ecr(db, "challenge", ID).length === 1 && saisies(db).length === 2
        && pt.length === 1 && Object.keys(pt[0]).sort().join() === "date,source" && pt[0].source === "apres_questionnaire" && Math.abs(Date.parse(pt[0].date) - t0) < 10000 && !(Array.isArray(cta.clics) && cta.clics.length),
      JSON.stringify(I.bilan_propose) + " · " + JSON.stringify(Cpt) + " · " + resume(db));
    ok("… l'accueil s'affiche en haut de page", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")) && (await page.evaluate(() => window.scrollY)) === 0, "");
    const pages = await page.evaluate(() => Object.keys((Activite._delta && Activite._delta.pages) || {}).sort());
    ok("pages vues notées pour le coach : decouverte-bilan puis decouverte-accueil", pages.includes("decouverte-bilan") && pages.includes("decouverte-accueil") && !pages.includes("decouverte-resultat"), JSON.stringify(pages));
    /* la page reste accessible par son adresse ; y revenir n'écrit plus rien */
    await aller(page, "#/decouverte/bilan", 1500);
    ok("#/decouverte/bilan : la page « Ton plan d'action », toujours accessible (réponse « projection » reprise)", !!(await page.$("#dc-bilan")) && (await texte(page, "#dc-projection")) === TX.projection(NOUVEAU().projection), "");
    const t1 = Date.now();
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const d = await ou(page);
    /* v62 (relecture) : l'intake n'est pas réécrit (le premier choix gardé), mais l'origine du « Plus tard » est notée une
       fois PAR AFFICHAGE de la page (le code : bt.dataset.note sur le bouton de la page affichée) : la page rouverte par son
       adresse et un nouveau « Plus tard » ajoutent une 2e entrée apres_questionnaire (2e écriture de challenge) — comportement
       figé ici : un changement (ne plus noter la revisite) doit être décidé, pas passer en silence */
    const C2 = (db.donnees.find(x => x.user_id === ID && x.outil === "challenge") || {}).contenu || {}, cta2 = C2.cta || {}, pt2 = Array.isArray(cta2.plus_tard) ? cta2.plus_tard : [];
    ok("… « Plus tard » une 2e fois (page rouverte par son adresse) : l'accueil, adresse #/decouverte, le premier choix gardé (intake jamais réécrit : UNE écriture) ; l'origine notée une fois par affichage : 2e écriture de challenge, 2 « Plus tard » { source: apres_questionnaire, date } (le premier intact, le 2e à l'instant du 2e choix), aucun clic Calendly",
      !!(await page.$("#dc-accomp")) && d.hash === "#/decouverte" && ecr(db, "intake", ID).length === 1 && (intakeDe(db, ID).bilan_propose || {}).le === I.bilan_propose.le
        && ecr(db, "challenge", ID).length === 2 && saisies(db).length === 3 && pt2.length === 2 && pt2.every(x => Object.keys(x).sort().join() === "date,source" && x.source === "apres_questionnaire")
        && pt2[0].date === pt[0].date && Math.abs(Date.parse(pt2[1].date) - t1) < 10000 && Date.parse(pt2[1].date) > Date.parse(pt2[0].date) && !(Array.isArray(cta2.clics) && cta2.clics.length),
      JSON.stringify(d) + " · " + JSON.stringify(C2) + " · " + resume(db));
    await aller(page, "#/decouverte/bilan", 1500);
    await cliquerSansOuvrir(page, "#dc-bilan-reserver"); await attendre(page, 2200);
    const C3 = (db.donnees.find(x => x.user_id === ID && x.outil === "challenge") || {}).contenu || {}, cl = (C3.cta || {}).clics || [], pt3 = (C3.cta || {}).plus_tard;
    ok("… « Récupérer mon plan d'action » plus tard depuis cette page : le clic est noté (apres_questionnaire) dans une 3e écriture de challenge qui garde les 2 « Plus tard » (aucun de plus), le premier choix reste « plus_tard » (intake jamais réécrit)",
      cl.length === 1 && cl[0].source === "apres_questionnaire" && ecr(db, "intake", ID).length === 1 && intakeDe(db, ID).bilan_propose.choix === "plus_tard"
        && ecr(db, "challenge", ID).length === 3 && JSON.stringify(pt3) === JSON.stringify(pt2), JSON.stringify(C3) + " · " + resume(db));
    await c.close();
  });
  await bloc("C. relecture avant le choix", async () => {
    /* le cache d'intake n'est pas chargé (drapeau de lecture effacé) : relu juste avant d'écrire */
    const k = 24, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    /* entre-temps, un autre appareil a ajouté une réponse : la relecture la garde */
    intakeDe(db, ID).seances = "4";
    await page.evaluate(() => { delete Store.charge[Store.cible() + "|intake"]; });
    const l0 = lu(db, "intake"), t0 = Date.now();
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    /* v62 (relecture) : le cas réussi de « noté seulement si l'intake a pu être lu » (le cas raté est plus bas) : l'intake
       relu, le « Plus tard » est aussi noté avec son origine, en UNE écriture de challenge */
    const Cr = (db.donnees.find(d => d.user_id === ID && d.outil === "challenge") || {}).contenu || {}, ptr = Array.isArray((Cr.cta || {}).plus_tard) ? Cr.cta.plus_tard : [];
    ok("cache non chargé : intake relu une fois avant l'écriture, puis une écriture (la réponse venue d'ailleurs gardée) ; relu avec succès : le « Plus tard » noté avec son origine en UNE écriture de challenge (cta.plus_tard = [{ source: apres_questionnaire, date: maintenant }]), rien d'autre",
      lu(db, "intake") === l0 + 1 && ecr(db, "intake", ID).length === 1 && I.seances === "4" && (I.bilan_propose || {}).choix === "plus_tard"
        && ecr(db, "challenge", ID).length === 1 && saisies(db).length === 2 && ptr.length === 1 && Object.keys(ptr[0]).sort().join() === "date,source" && ptr[0].source === "apres_questionnaire" && Math.abs(Date.parse(ptr[0].date) - t0) < 10000,
      "lectures +" + (lu(db, "intake") - l0) + " · " + JSON.stringify(I) + " · " + JSON.stringify(Cr) + " · " + resume(db));
    await c.close();
    /* lecture ratée au moment du choix : rien n'est écrit, il découvre quand même son espace ; la page revient à la visite suivante */
    const db2 = base({ comptes: [compte(25, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const o2 = await ouvrir(b, db2, 25, "", "#dc-bilan");
    db2.lectureKo = ["intake"];
    await o2.page.evaluate(() => { delete Store.charge[Store.cible() + "|intake"]; });
    await o2.page.click("#dc-bilan-plus-tard"); await attendre(o2.page, 1600);
    ok("lecture ratée au moment du choix : aucune écriture, l'accueil s'affiche quand même (rien de bloquant)", saisies(db2).length === 0 && !!(await o2.page.$("#dc-accomp")), resume(db2));
    db2.lectureKo = [];
    await o2.page.reload(); await pret(o2.page, "#dc-bilan");
    ok("… à la visite suivante, la page « Ton plan d'action » revient (le choix n'avait pas été enregistré)", !!(await o2.page.$("#dc-bilan")) && saisies(db2).length === 0, "");
    await o2.c.close();
  });
  await bloc("C. données piégées", async () => {
    const cas = [
      ["HTML dans la réponse", "<img src=x onerror=\"window.__xss=1\"> <script>window.__xss=2</script>", TX.projection("<img src=x onerror=\"window.__xss=1\"> <script>window.__xss=2</script>")],
      ["réponse très longue", "Je veux enfin courir mon premier semi-marathon en moins de deux heures et me sentir fier de moi chaque matin devant la glace, avec plus d'énergie au travail et le soir avec mes enfants, sans douleurs", null],
      ["réponse objet", { a: 1 }, TX.neutre], ["réponse nombre", 42, TX.projection("42")], ["réponse vide", "   ", TX.neutre]
    ];
    let k = 30;
    for (const [quoi, projection, attendu] of cas) {
      const db = base({ comptes: [compte(k, "<b>Léa</b>", "Martin", [["intake", NOUVEAU({ projection })]])] });
      const { c, page } = await ouvrir(b, db, k++, "", "#dc-bilan");
      const t = await texte(page, "#dc-projection"), v = await texte(page, "#vue");
      const sain = !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x'], #vue script, #vue b"));
      if (attendu) ok(`page bilan, ${quoi} : « ${attendu.length > 70 ? attendu.slice(0, 70) + "…" : attendu} », affichée comme du texte, aucune injection, jamais « undefined » / « [object Object] »`, t === attendu && sain && !/undefined|\[object|null/.test(v), t);
      else {
        const x = t.replace(/^Ton objectif dans 3 mois : « /, "").replace(/ »$/, "");
        /* v60 (brief V2, C) : {projection} coupée vers 140 caractères (avant : 160) ; relecture : aussi la borne basse — le
           texte exact (136 caractères, coupé au dernier espace avant 140) : une coupe trop courte (20) ou à 160 échoue */
        ok(`page bilan, ${quoi} : tronquée proprement (140 caractères au plus, coupée au dernier espace avant, « … » ; texte exact de 136 caractères)`, t.startsWith("Ton objectif dans 3 mois : « Je veux enfin courir") && Array.from(x).length <= 141 && x.endsWith("…") && projection.startsWith(x.slice(0, -1)) && /[\s,]/.test(projection.charAt(x.length - 1)) && x === "Je veux enfin courir mon premier semi-marathon en moins de deux heures et me sentir fier de moi chaque matin devant la glace, avec plus…" && Array.from(x).length === 136 && sain, t);
      }
      await c.close();
    }
    /* bilan_propose piégé : la page s'affiche, le choix le remplace par une valeur propre */
    const db = base({ comptes: [compte(36, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: "<script>x</script>" })]])] });
    const { c, page } = await ouvrir(b, db, 36, "", "#dc-bilan");
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const B = (intakeDe(db, PID(36)) || {}).bilan_propose;
    ok("bilan_propose piégé (texte) : la page bilan s'affiche, le choix écrit une valeur propre { choix, le }", !!B && B.choix === "plus_tard" && typeof B.le === "string" && ecr(db, "intake", PID(36)).length === 1, JSON.stringify(B));
    await c.close();
  });
  await bloc("C. anglais", async () => {
    const k = 40, db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan", { langue: "en" });
    await attendre(page, 400);
    const v = await texte(page, "#vue");
    /* v61 (brief V2, D) : « Free », « Your personalized action plan », « Your goal in 3 months: “…” », les textes du plan
       (avant : « Your next step », « In 3 months, for you », l'assessment de 30 minutes) */
    const en = [await texte(page, "#dc-offert"), await texte(page, "#dc-bilan h2"), await texte(page, "#dc-projection"), await texte(page, "#dc-bilan-texte"), await texte(page, "#dc-bilan-garde")];
    ok("anglais : « Free », « Your personalized action plan », sa réponse reprise (« Your goal in 3 months: “…” »), textes du plan en anglais (15-minute call with Lucas, « The plan is yours to keep… »), sans « You're free to say no. » (v70)", JSON.stringify(en) === JSON.stringify([TX.offert_en, TX.titre_en, TX.projection_en(NOUVEAU().projection), TX.bilan_en, TX.garde_en]) && !(await page.$("#dc-bilan-libre")) && !v.includes(TX.libre_en), JSON.stringify(en));
    ok("anglais : « Get my action plan », « 15 min · phone call · free » et « Later, let me explore my space », aucun texte français de la page, plus aucun « Book my assessment » ni « 30-minute »", (await texte(page, "#dc-bilan-reserver")) === TX.reserver_en && (await texte(page, "#dc-bilan-sous")) === TX.plan_sous_en && (await texte(page, "#dc-bilan-plus-tard")) === TX.plus_tard_en && ![TX.offert, TX.bilan, TX.garde, TX.libre, TX.reserver, TX.plan_sous, TX.plus_tard, TX.titre, "Ton objectif dans 3 mois"].some(x => v.includes(x)) && !TX.anciens.test(v), v.slice(0, 300));
    await c.close();
  });

  /* =================== D. ancien prospect (10 réponses, court_le, pas de choix) =================== */
  await bloc("D. ancien prospect", async () => {
    const k = 50, ID = PID(k);
    const db = base({ comptes: [compte(k, "Nina", "", [["intake", ANCIEN]], { cree: avant(4 * J), email: "ancienne@exemple.fr" })] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    const v = await texte(page, "#vue");
    ok("ancien prospect (10 réponses, sans « projection ») : la page « Ton plan d'action », avec une phrase neutre, jamais « undefined » ni guillemets vides", (await texte(page, "#dc-projection")) === TX.neutre && !/undefined|null|« »|\{p\}/.test(v) && (await texte(page, "#dc-bilan-texte")) === TX.bilan, await texte(page, "#dc-projection"));
    ok("… ni ancien résultat, ni questionnaire ; aucune écriture à l'affichage", !(await page.$("#dc-resultat, #dc-calcul, #q-probleme, #q-age")) && saisies(db).length === 0, resume(db));
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("… « Plus tard » : une écriture (bilan_propose), ses 13 anciennes valeurs intactes, aucune nouvelle réponse inventée", ecr(db, "intake", ID).length === 1 && Object.keys(ANCIEN).every(x => I[x] === ANCIEN[x]) && Object.keys(I).sort().join() === Object.keys(ANCIEN).concat(["bilan_propose"]).sort().join(), JSON.stringify(I));
    await page.reload(); await pret(page, "#dc-accomp");
    ok("… à la visite suivante : l'accueil directement (la page du plan n'est vue qu'une fois), rien de réécrit", !(await page.$("#dc-bilan")) && ecr(db, "intake", ID).length === 1, resume(db));
    /* ses anciennes réponses, lisibles dans son Profil */
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    const att = [["Sexe", "Femme"], ["Âge", "30"], ["Taille (cm)", "165"], ["Poids actuel (kg)", "70"], ["Quel est ton objectif principal ?", "Perte de poids / sèche"], ["Combien de séances par semaine peux-tu RÉELLEMENT tenir ?", "3"], ["Qu'as-tu déjà essayé pour atteindre cet objectif ?", "Des régimes trop stricts."], ["Quel est ton principal obstacle aujourd'hui ?", "Je manque de temps avec le travail"], ["Pourquoi maintenant ? Qu'est-ce qui a déclenché ta décision ?", "Me sentir mieux cet été"], ["Ta motivation pour t'y mettre maintenant", "8 / 10"]];
    ok("Profil : ses 10 anciennes réponses lisibles, avec les anciens libellés (obstacle d'avant, motivation « 8 / 10 »)", JSON.stringify(rp) === JSON.stringify(att), JSON.stringify(rp));
    ok("Profil : « Modifier mes réponses » (#/decouverte/reponses) ; aucune écriture", (await page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte/reponses|" + TX.modifier && ecr(db, "intake", ID).length === 1, resume(db));
    await c.close();
    /* vues par le coach ; v62 (brief V2, L) : ce qui est écrit avant, par le prospect lui-même (son intake, et son
       « Plus tard » noté avec son origine dans sa clé challenge), est compté ici pour que le coach n'écrive rien après */
    const nAvantCoach = saisies(db).length;
    const { c: c2, page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 500);
    const note = await texte(p2, "#fiche-reponses p.note"), rf = await lignes(p2, "#fiche-reponses");
    /* v52 (lot G) : côté coach, des libellés courts (l'obstacle d'avant : « Obstacle principal ») ; mêmes valeurs, même ordre */
    const attCoach = [["Sexe", "Femme"], ["Âge", "30"], ["Taille (cm)", "165"], ["Poids actuel (kg)", "70"], ["Objectif", "Perte de poids / sèche"], ["Séances par semaine", "3"], ["Déjà essayé", "Des régimes trop stricts."], ["Obstacle principal", "Je manque de temps avec le travail"], ["Pourquoi maintenant", "Me sentir mieux cet été"], ["Motivation", "8 / 10"]];
    ok("coach, fiche de l'ancien prospect : « 10 / 10 réponses, validé le … », ses 10 réponses (libellés courts du coach, lot G) (+ email)", note.startsWith("10 / 10 réponses, validé le ") && rf.length === 11 && JSON.stringify(rf.slice(1)) === JSON.stringify(attCoach) && rf[0][1] === "ancienne@exemple.fr", note + " · " + JSON.stringify(rf));
    const horsIntake = saisies(db).filter(e => e.user_id !== ID || e.outil !== "intake"), ptD = horsIntake.length === 1 ? (((horsIntake[0].contenu || {}).cta || {}).plus_tard || []) : [];
    ok("coach : aucune écriture (avant lui, en dehors de l'intake du prospect : son seul « Plus tard » noté dans sa clé challenge, source apres_questionnaire)", saisies(db).length === nAvantCoach && horsIntake.length === 1 && horsIntake[0].user_id === ID && horsIntake[0].outil === "challenge" && Array.isArray(ptD) && ptD.length === 1 && ptD[0].source === "apres_questionnaire", resume(db));
    await c2.close();
  });
  await bloc("D. ancien questionnaire commencé", async () => {
    /* 4 réponses de l'ancien questionnaire, jamais validé : il répond maintenant aux 3 questions ; le coach le compte sur 10 */
    const k = 51, ID = PID(k), I0 = { sexe: "Homme", age: "34", taille: "180", poids: "85", court_debut: avant(5 * H) };
    const db = base({ comptes: [compte(k, "Hugo", "", [["intake", I0]], { cree: avant(8 * H) })] });
    const { c, page } = await ouvrir(b, db, k, "", "#q-probleme");
    ok("ancien questionnaire commencé : les 3 nouvelles questions (pas l'âge ni le poids), rien d'écrit à l'affichage", !(await page.$("#q-age, #q-poids")) && !!(await page.$("#q-projection")) && saisies(db).length === 0, "");
    await c.close();
    const { c: c2, page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 500);
    /* v53 (chantier 4) : plus de score (« Questionnaire en cours (4/10 réponses) ») : la note des réponses suffit */
    ok("coach : « 4 / 10 réponses, pas encore validé. » (compté sur l'ancien questionnaire)", (await texte(p2, "#fiche-reponses p.note")) === "4 / 10 réponses, pas encore validé." && !(await p2.$("#fiche-score")), await texte(p2, "#fiche-reponses p.note"));
    await c2.close();
  });

  /* =================== E. Profil du prospect et « Modifier mes réponses » =================== */
  await bloc("E. Profil et modification", async () => {
    const k = 60, ID = PID(k), I0 = NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(30 * MIN) }, email_compte: "p60@exemple.fr" });
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", I0]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil", "#mc-questionnaire");
    await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    /* v60 (brief V2, C) : I0 = des réponses libres d'avant la v60 (sans <id>_choix) : lues telles quelles, et en « Modifier
       mes réponses » elles pré-remplissent la précision libre (rien n'est perdu) */
    ok("Profil : ses 3 réponses (anciennes réponses libres telles quelles), libellés exacts (pas l'objectif posé par l'app en doublon)", JSON.stringify(rp) === JSON.stringify([[TX.labels[0], "Perdre du gras"], [TX.labels[1], I0.obstacle], [TX.labels[2], I0.projection]]), JSON.stringify(rp));
    ok("Profil : « Modifier mes réponses » → #/decouverte/reponses ; aucune écriture", (await page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte/reponses|" + TX.modifier && saisies(db).length === 0, resume(db));
    await page.click("#mc-reponses-lien a"); await page.waitForSelector("#q-probleme", { timeout: 6000 }); await attendre(page, 500);
    const e1 = await etatForm(page);
    /* v61 (brief V2, E1 et F) : sur « Modifier mes réponses », le même bouton du haut (contour) et sa ligne, origine reponses_haut */
    const haut = await page.$$eval("#vue [data-dc-cal]", l => l.map(a => ({ cal: a.dataset.dcCal, cls: a.className, t: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href"), dansTete: !!a.closest(".masthead"),
      sous: a.closest(".masthead") && a.closest(".masthead").querySelector(".dc-haut-sous") ? a.closest(".masthead").querySelector(".dc-haut-sous").textContent.replace(/[\s\u00a0\u202f]+/g, " ").trim() : null }))).catch(() => []);
    const pbHaut = haut.length === 1 ? lienOk(haut[0].href || "", await page.evaluate(() => CONFIG.marque.calendly), { source: "reponses_haut", prenom: "Léa", nom: "Martin", email: "p60@exemple.fr" }) : "liens " + haut.length;
    ok("« Modifier mes réponses » : le questionnaire pré-rempli (carte « Perdre du gras » cochée ; ses anciennes réponses libres dans les précisions, aucune pastille inventée ; bouton actif), « Annuler les modifications » ; en haut, « Récupérer mon plan d'action » en contour + « 15 min avec Lucas · offert » (seul lien Calendly, origine reponses_haut)", JSON.stringify(e1.probleme) === '["Perdre du gras"]' && !e1.obstacle.length && e1.po === I0.obstacle && !e1.projection.length && e1.pp === I0.projection && e1.inactif === "false|false" && (await texte(page, "#dc-annuler")) === TX.annuler
      && !pbHaut && haut[0].cal === "reponses_haut" && /(^| )ghost( |$)/.test(haut[0].cls) && /(^| )btn( |$)/.test(haut[0].cls) && haut[0].t === TX.reserver && haut[0].dansTete && haut[0].sous === TX.cta_sous, JSON.stringify(e1) + " · " + pbHaut + " · " + JSON.stringify(haut));
    await choisir(page, "probleme", "Prendre du muscle"); await choisir(page, "obstacle", "temps"); await page.fill("#q-obstacle-precision", "Autre chose"); await attendre(page, 1500);
    ok("en modification : rien ne part pendant la saisie", saisies(db).length === 0, resume(db));
    await page.click("#dc-annuler"); await attendre(page, 1300);
    const d1 = await ou(page);
    ok("« Annuler les modifications » : son accueil, adresse #/decouverte, rien d'écrit", !!(await page.$("#dc-accomp")) && d1.hash === "#/decouverte" && saisies(db).length === 0, JSON.stringify(d1));
    await aller(page, "#/decouverte/reponses", 1500);
    const e2 = await etatForm(page);
    ok("… rouvert : les réponses d'avant (pas celles abandonnées)", JSON.stringify(e2.probleme) === '["Perdre du gras"]' && !e2.obstacle.length && e2.po === I0.obstacle, JSON.stringify(e2));
    await choisir(page, "probleme", "Prendre du muscle"); await choisir(page, "projection", "confiance"); await page.fill("#q-projection-precision", "");
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {}, d2 = await ou(page);
    ok("« Voir ma prochaine étape » : une écriture, réponses changées (projection : la pastille « Retrouver confiance en moi », clé confiance), l'obstacle libre d'avant gardé, aucun champ vide créé (ni obstacle_choix vide, ni projection_precision vide), court_le et bilan_propose inchangés", ecr(db, "intake", ID).length === 1 && I.probleme === "Prendre du muscle" && I.projection === "Retrouver confiance en moi" && JSON.stringify(I.projection_choix) === '["confiance"]' && I.obstacle === I0.obstacle && !("obstacle_choix" in I) && !("projection_precision" in I) && I.court_le === I0.court_le && JSON.stringify(I.bilan_propose) === JSON.stringify(I0.bilan_propose), JSON.stringify(I));
    ok("… l'objectif posé par l'app suit la nouvelle réponse (« Prise de muscle »)", I.objectif === OBJ["Prendre du muscle"], I.objectif);
    ok("… puis son accueil (choix déjà fait), adresse #/decouverte", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")) && d2.hash === "#/decouverte", JSON.stringify(d2));
    await c.close();
    /* Profil en anglais — v60 : des réponses à toucher (NOUVEAU60), relues dans sa langue */
    const db2 = base({ comptes: [compte(61, "Léa", "Martin", [["intake", NOUVEAU60({ bilan_propose: { choix: "plus_tard", le: avant(30 * MIN) }, email_compte: "p61@exemple.fr" })]])] });
    const o2 = await ouvrir(b, db2, 61, "#/profil", "#mc-questionnaire", { langue: "en" });
    await o2.page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {}); await attendre(o2.page, 400);
    const re = await lignes(o2.page, "#mc-reponses");
    const h2En = await texte(o2.page, "#mc-questionnaire h2"), lienEn = await texte(o2.page, "#mc-reponses-lien a");
    await o2.c.close();
    /* relecture : et un Profil en anglais aux ANCIENNES réponses libres (I0, sans <id>_choix) : l'objectif traduit, ses
       réponses libres telles quelles (aucune autre suite ne couvre ce cas en anglais) ; aucune écriture */
    const I3 = Object.assign(clone(I0), { email_compte: "p63@exemple.fr" });
    const db4 = base({ comptes: [compte(63, "Léa", "Martin", [["intake", I3]])] });
    const o4 = await ouvrir(b, db4, 63, "#/profil", "#mc-questionnaire", { langue: "en" });
    await o4.page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {}); await attendre(o4.page, 400);
    const reLibre = await lignes(o4.page, "#mc-reponses");
    await o4.c.close();
    ok("Profil en anglais : « Your questionnaire », libellés et choix traduits (« Lose fat », « Not enough time · I give in to cravings — le soir », « Having energy all day long »), « Edit my answers » ; avec d'anciennes réponses libres : « Lose fat », puis ses réponses telles quelles, aucune écriture", h2En === "Your questionnaire" && JSON.stringify(re) === JSON.stringify([[TX.labels_en[0], "Lose fat"], [TX.labels_en[1], "Not enough time · I give in to cravings — le soir"], [TX.labels_en[2], "Having energy all day long"]]) && lienEn === TX.modifier_en && JSON.stringify(reLibre) === JSON.stringify([[TX.labels_en[0], "Lose fat"], [TX.labels_en[1], I0.obstacle], [TX.labels_en[2], I0.projection]]) && saisies(db4).length === 0, JSON.stringify([h2En, re, lienEn, reLibre, resume(db4)]));
    /* questionnaire pas encore validé : pas de liste, le lien mène aux 3 questions */
    const db3 = base({ comptes: [compte(62, "Léa", "Martin")] });
    const o3 = await ouvrir(b, db3, 62, "#/profil", "#mc-questionnaire", { viewport: MOBILE });
    await attendre(o3.page, 800);
    ok("Profil sans réponse : aucune liste, « Répondre aux 3 questions » (#/decouverte) ; 390 px sans débordement ; aucune écriture", !(await o3.page.$("#mc-reponses li")) && (await o3.page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte|Répondre aux 3 questions" && !(await deborde(o3.page)) && saisies(db3).length === 0, resume(db3));
    await o3.c.close();
  });

  /* =================== F. coach : fiche d'un nouveau prospect =================== */
  await bloc("F. coach", async () => {
    const k = 70, ID = PID(k);
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    const I0 = NOUVEAU({ projection: "Tenir " + XSS, email_compte: "p70@exemple.fr", sexe: "Femme", poids: "64", bilan_propose: { choix: "reserver", le: avant(20 * MIN) } });
    /* v61 (brief V2, F) : un clic d'avant (ancien code bilan-propose, déjà en base) et un clic d'après (nouveau code
       apres_questionnaire : le nom de son écran, Decouverte.ORIGINES). v63 (lot 4, point 1) : l'ancien code s'affiche lui
       aussi sous le nom de l'écran d'aujourd'hui (Decouverte.nomOrigine) : deux fois le même libellé */
    const C0 = { version: 1, jours: {}, cta: { clics: [{ jour: 3, source: "bilan-propose", date: avant(20 * MIN) }, { jour: 3, source: "apres_questionnaire", date: avant(10 * MIN) }] } };
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", I0], ["challenge", C0]])] });
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/clients"); await pret(page, `[data-ouvrir="${ID}"]`);
    await page.click(`[data-ouvrir="${ID}"]`); await page.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(page, 600);
    const note = await texte(page, "#fiche-reponses p.note"), rf = await lignes(page, "#fiche-reponses");
    ok("fiche : « 3 / 3 réponses, validé le … »", note.startsWith("3 / 3 réponses, validé le "), note);
    ok("fiche : email, puis les 3 réponses (v52, lot G : libellés courts Problème, Ce qui l'a bloqué, Dans 3 mois), puis les anciennes qui ont une valeur (sexe, poids) — pas l'objectif posé par l'app", JSON.stringify(rf) === JSON.stringify([["Email", "p70@exemple.fr"], ["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", I0.obstacle], ["Dans 3 mois", "Tenir " + XSS], ["Sexe", "Femme"], ["Poids actuel (kg)", "64"]]), JSON.stringify(rf));
    const chrono = await texte(page, "#fiche-chrono");
    const CLIC_APQ = "Clic « Récupérer mon plan d'action » (page « Ton plan d'action » (après les 3 questions))";
    const clicsChrono = await page.$$eval("#fiche-chrono ol li span", l => l.map(x => x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim()).filter(t => /^Clic\b/.test(t))).catch(() => []);
    const nomsEcr = await page.evaluate(() => [Decouverte.nomOrigine("bilan-propose"), Decouverte.ORIGINES.apres_questionnaire]).catch(() => []);
    ok("chronologie : l'ancien code (bilan-propose) comme le nouveau (apres_questionnaire) se lisent « " + CLIC_APQ + " » (nom de l'écran d'aujourd'hui, Decouverte.nomOrigine) : exactement 2 lignes de clic, ce libellé deux fois ; plus aucun ancien libellé (« Réserver mon bilan », « page de proposition du bilan ») ni code brut", JSON.stringify(clicsChrono) === JSON.stringify([CLIC_APQ, CLIC_APQ]) && JSON.stringify(nomsEcr) === JSON.stringify(["page « Ton plan d'action » (après les 3 questions)", "page « Ton plan d'action » (après les 3 questions)"]) && chrono.split(CLIC_APQ).length === 3 && !/Réserver mon bilan|page de proposition du bilan|en haut de sa Découverte|bloc accompagnement/.test(chrono) && !/apres_questionnaire|bilan-propose/.test(chrono), JSON.stringify(clicsChrono) + " · " + JSON.stringify(nomsEcr) + " · " + chrono.slice(0, 400));
    ok("fiche : sa réponse piégée reste du texte (aucune injection), aucune écriture", !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")) && db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== G. l'ancien écran « résultat » retiré, client Thomas =================== */
  await bloc("G. ancien résultat retiré", async () => {
    const k = 80, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ sexe: "Femme", age: "30", taille: "165", poids: "70", seances: "3", bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp");
    await attendre(page, 800);
    const v = await texte(page, "#vue");
    ok("accueil d'un nouveau prospect (même avec âge, taille, poids) : ni résultat, ni calories, ni séance, ni recettes", !(await page.$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes, #dc-modifier")) && !/Ton résultat|Tes 3 priorités|Tes calories et tes macros|Ta séance découverte|3 recettes pour commencer/.test(v), v.slice(0, 300));
    /* v52 (lot D) : l'accueil lit aussi, en lecture seule, son calcul (calc_perso) et ses pesées (mens) pour choisir
       l'action mise en avant */
    ok("… aucune lecture du catalogue (recettes, aliments) ni d'autre clé que intake, challenge, prefs (langue), calc_perso et mens (étape de l'accueil)", !db.chemins.some(x => /\/rest\/v1\/(recettes|aliments)/.test(x)) && db.lectures.every(l => ["eq.intake", "eq.challenge", "eq.prefs", "in.(calc_perso,mens)"].includes(l.outil)), JSON.stringify(db.lectures.map(l => l.outil)));
    /* v61 (brief V2, E et F) : « Récupérer mon plan d'action » en haut (accueil_haut, + « 15 min avec Lucas · offert ») et dans
       la carte « Ce que l'accompagnement ajoute » (accueil_accompagnement ; nouvelles descriptions, nouvelle note), case
       « J'ai déjà choisi mon créneau » ; exactement 2 liens [data-dc-cal] ; plus aucun « Réserver mon bilan » ni « 30 minutes » */
    const acc = await page.evaluate(() => {
      const n = x => (x || "").replace(/[\s\u00a0\u202f]+/g, " ").trim(), q = s => document.querySelector(s), t = s => q(s) ? n(q(s).textContent) : null;
      return { cal: [...document.querySelectorAll("#vue [data-dc-cal]")].map(a => a.dataset.dcCal), haut: t('#vue .masthead a.btn[data-dc-cal="accueil_haut"]'), hautSous: t("#vue .masthead .dc-haut-sous"),
        hautHref: q('#vue .masthead a[data-dc-cal="accueil_haut"]') ? q('#vue .masthead a[data-dc-cal="accueil_haut"]').getAttribute("href") : "",
        carte: t('#dc-accomp a.btn[data-dc-cal="accueil_accompagnement"]'), carteHref: q('#dc-accomp a[data-dc-cal="accueil_accompagnement"]') ? q('#dc-accomp a[data-dc-cal="accueil_accompagnement"]').getAttribute("href") : "",
        titre: t("#dc-accomp h2"), lignes: [...document.querySelectorAll("#dc-accomp .liste-debloque li")].map(li => n(li.textContent)), note: t("#dc-accomp > p.note"),
        cas: !!q("#dc-reserve-case"), casTxt: q("#dc-reserve-case") && q("#dc-reserve-case").closest("label") ? n(q("#dc-reserve-case").closest("label").textContent) : null, base: CONFIG.marque.calendly };
    });
    const pbH = lienOk(acc.hautHref || "", acc.base, { source: "accueil_haut", prenom: "Léa", nom: "Martin", email: "p80@exemple.fr" }), pbC = lienOk(acc.carteHref || "", acc.base, { source: "accueil_accompagnement", prenom: "Léa", nom: "Martin", email: "p80@exemple.fr" });
    const lignesAtt = [["Mon programme", "programme"], ["Nutrition", "nutrition"], ["Mon journal", "journal"], ["Mon suivi", "suivi"]].map(([nom, id]) => nom + " — " + TXD.av[id]);
    ok("… « Récupérer mon plan d'action » en haut (accueil_haut, « 15 min avec Lucas · offert ») et dans la carte « Ce que l'accompagnement ajoute » (accueil_accompagnement ; nouvelles descriptions, « 15 min avec Lucas pour faire le point… »), case « J'ai déjà choisi mon créneau » ; exactement 2 liens Calendly, pré-remplis exacts ; plus aucun « Réserver mon bilan » ni « 30 minutes »",
      JSON.stringify(acc.cal) === '["accueil_haut","accueil_accompagnement"]' && acc.haut === TX.reserver && acc.hautSous === TX.cta_sous && acc.carte === TX.reserver && !pbH && !pbC && acc.titre === TX.accomp && JSON.stringify(acc.lignes) === JSON.stringify(lignesAtt) && acc.note === TX.accomp_note && acc.cas && acc.casTxt === TX.reserve_case && !TX.anciens.test(v),
      pbH + " · " + pbC + " · " + JSON.stringify(acc) + (TX.anciens.test(v) ? " · ancien texte : " + v.match(TX.anciens)[0] : ""));
    const code = await page.evaluate(() => ["chiffres", "calculHTML", "seanceHTML", "recettesHTML", "chargerRecettes", "resultatHTML", "prioriteObstacle", "formationHTML", "accompHTML"].filter(f => typeof outilDecouverte[f] !== "function"));
    ok("le code encore utile est gardé (garde-fou IMC, séance découverte, recettes : lots D et E)", code.length === 0, JSON.stringify(code));
    ok("aucune écriture", saisies(db).length === 0, resume(db));
    await c.close();
  });
  await bloc("G. client Thomas", async () => {
    const db = base();
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0); await pret(page, "#acc-vue");
    const vus = [];
    for (const h of ["#/decouverte/bilan", "#/decouverte/reponses", "#/decouverte"]) { await aller(page, h, 1300); vus.push([h, await ou(page), !!(await page.$("#dc-vue, #dc-bilan, #q-probleme, [data-dc-cal]"))]); }
    ok("client Thomas : #/decouverte/bilan, #/decouverte/reponses, #/decouverte → son accueil (#/accueil), rien de la Découverte", vus.every(([, d, dc]) => d.courant === "accueil" && d.hash === "#/accueil" && !dc), JSON.stringify(vus));
    await aller(page, "#/profil", 1600);
    ok("client Thomas : son Profil complet (questionnaire), pas la liste du prospect ; aucune écriture", !!(await page.$("#p-save")) && !(await page.$("#mc-questionnaire, #mc-reponses")) && db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== H. la garde d'âge du formulaire, inerte sans question « age » ===================
     Le questionnaire court ne demande plus l'âge (le garde-fou 18 ans passe au calculateur, lot D). La garde reste dans le
     code du formulaire : page servie avec une question « age » remise en tête de la liste, elle marche toujours. */
  await bloc("H. garde d'âge (page retouchée)", async () => {
    await avec([['questions: ["probleme", "obstacle", "projection"],', 'questions: ["age", "probleme", "obstacle", "projection"],']], async () => {
      const k = 90, ID = PID(k);
      const db = base({ comptes: [compte(k, "Léa", "Martin")] });
      const { c, page } = await ouvrir(b, db, k, "", "#q-age");
      /* v60 : la carte touchée, l'obstacle dit avec ses mots (précision seule : obstacle = la précision, comme avant) */
      await choisir(page, "probleme", "Perdre du gras"); await page.fill("#q-obstacle-precision", "Le temps"); await attendre(page, 1300);
      ok("page retouchée (question « age » remise) : « À partir de 18 ans. », et rien ne part tant que l'âge n'est pas saisi", (await texte(page, "#vue")).includes("À partir de 18 ans.") && ecr(db, "intake", ID).length === 0, resume(db));
      await page.fill("#q-age", "15"); await page.press("#q-age", "Tab"); await attendre(page, 1300);
      ok("… âge 15 à la sortie du champ : toujours rien", ecr(db, "intake", ID).length === 0, resume(db));
      await page.fill("#q-age", "30"); await page.press("#q-age", "Tab"); await attendre(page, 1400);
      const I1 = clone(intakeDe(db, ID)) || {};
      ok("… âge 30 : le brouillon part avec les réponses déjà saisies (et l'objectif posé depuis la réponse « problème »)", I1.age === "30" && I1.probleme === "Perdre du gras" && I1.obstacle === "Le temps" && I1.objectif === OBJ["Perdre du gras"], JSON.stringify(I1));
      await page.fill("#q-age", "15"); await page.press("#q-age", "Tab"); await attendre(page, 1400);
      ok("… âge 15 ensuite : tout ce que le formulaire avait envoyé est retiré, objectif posé compris (intake = {})", JSON.stringify(intakeDe(db, ID)) === "{}", JSON.stringify(intakeDe(db, ID)));
      await c.close();
    });
  });

  /* ======================================================================================================
     LOT D (v52) — accueil du prospect, gratuit pour toujours, calculateur du prospect (calc_perso), garde-fous
     ====================================================================================================== */

  /* =================== I. accueil du prospect : une seule action mise en avant =================== */
  await bloc("I. accueil : calcule tes calories", async () => {
    const k = 2, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp");
    await attendre(page, 1200);
    const e = await page.$eval("#dc-etape", x => ({ etape: x.dataset.etape, h2: x.querySelector("h2").textContent.trim(), a: x.querySelector("a.btn").textContent.trim(), href: x.querySelector("a.btn").getAttribute("href"), ghost: x.querySelector("a.btn").classList.contains("ghost") })).catch(() => null);
    ok("accueil d'un nouveau prospect : l'action mise en avant est « Calcule tes calories (2 min) » → #/calculateur", !!e && e.etape === "calories" && e.a === TXD.calories && e.href === "#/calculateur" && !e.ghost, JSON.stringify(e));
    const forts = await page.$$eval("#vue a.btn:not(.ghost), #vue button.btn:not(.ghost)", l => l.map(x => x.id || x.textContent.trim()));
    ok("… une seule action mise en avant : tous les autres boutons de l'accueil sont discrets (« Récupérer mon plan d'action » compris)", forts.length === 1 && forts[0] === "dc-etape-go", JSON.stringify(forts));
    ok("… « Récupérer mon plan d'action » reste là, discret, en contour (en-tête et carte de l'accompagnement, origines accueil_haut / accueil_accompagnement)", !!(await page.$('#vue .masthead a.btn.ghost[data-dc-cal="accueil_haut"]')) && !!(await page.$('#dc-accomp a.btn.ghost[data-dc-cal="accueil_accompagnement"]')) && (await texte(page, '#vue .masthead a[data-dc-cal="accueil_haut"]')) === TX.reserver && (await texte(page, '#dc-accomp a[data-dc-cal="accueil_accompagnement"]')) === TX.reserver, "");
    const v = await texte(page, "#vue");
    ok("… en-tête « Découverte », phrase « gratuit, sans limite de temps », aucun « Jour n/7 » ni jours restants", (await texte(page, "#vue .masthead .eyebrow")) === "Découverte" && v.includes(TXD.lede) && !SEPT.test(v), v.slice(0, 260));
    const vit = await page.$$eval("#dc-accomp .liste-debloque a", l => l.map(a => a.getAttribute("href")));
    ok("… le bloc accompagnement mène aux pages de la vitrine (programme, nutrition, journal, suivi) ; plus « Ma progression » (ouverte)", JSON.stringify(vit) === JSON.stringify(["#/programme", "#/nutrition", "#/journal", "#/suivi"]), JSON.stringify(vit));
    ok("… Speed Formation ouverte (« Ouvrir la Speed Formation », sans « pendant ta découverte »)", !!(await page.$('#dc-formation a[href="#/formation"]')) && (await texte(page, "#dc-formation")).includes("Les bases de la nutrition et de l'entraînement, à ton rythme.") && !/découverte/i.test(await texte(page, "#dc-formation p")), await texte(page, "#dc-formation"));
    ok("… décidé en lecture seule (calc_perso et mens lus d'un coup, sans cache) : aucune écriture à l'affichage", db.lectures.some(l => l.outil === "in.(calc_perso,mens)") && saisies(db).length === 0, resume(db) + " " + JSON.stringify(db.lectures.map(l => l.outil)));
    await page.click("#dc-etape-go"); await attendre(page, 1800);
    ok("clic : le calculateur s'ouvre (#/calculateur)", (await ou(page)).courant === "calculateur" && (await ou(page)).hash === "#/calculateur" && !!(await page.$("#tdee")) && !(await page.$("#vue .verrou")), JSON.stringify(await ou(page)));
    await c.close();
  });

  await bloc("I. accueil : pesée puis accueil normal", async () => {
    const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
    const I0 = NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } });
    const db = base({ comptes: [
      compte(3, "Léa", "Martin", [["intake", I0], ["calc_perso", CP]]),
      compte(4, "Zoé", "Bernard", [["intake", I0], ["calc_perso", CP], ["mens", { mesures: [{ sem: 1, date: "2026-09-20", poids: 60.2, vals: {} }] }]]),
      compte(5, "Inès", "Dupré", [["intake", I0], ["calc_perso", Object.assign({}, CP, { age: 16 })]]),
      compte(6, "Paul", "Durand", [["intake", I0], ["calc_perso", {}], ["mens", { pstart: 80, mesures: [] }]]),
      compte(7, "Karim", "Benali", [["intake", I0], ["calc_perso", CP], ["mens", { pstart: 80, mesures: [] }]])
    ] });
    let { c, page } = await ouvrir(b, db, 3, "", "#dc-accomp"); await attendre(page, 1000);
    const e = await page.$eval("#dc-etape", x => [x.dataset.etape, x.querySelector("a.btn").textContent.trim(), x.querySelector("a.btn").getAttribute("href")]).catch(() => null);
    ok("son calcul enregistré (calc_perso) : l'action mise en avant devient « Enregistre ta pesée de départ » → #/mensurations", JSON.stringify(e) === JSON.stringify(["pesee", TXD.pesee, "#/mensurations"]), JSON.stringify(e));
    await page.click("#dc-etape-go"); await attendre(page, 1800);
    ok("clic : Ma progression s'ouvre (#/mensurations), la saisie de sa première mesure dépliée", (await ou(page)).courant === "mensurations" && !(await page.$("#vue .verrou")) && await page.isVisible("#e-poids"), JSON.stringify(await ou(page)));
    await c.close();
    ({ c, page } = await ouvrir(b, db, 4, "", "#dc-accomp")); await attendre(page, 1000);
    const forts = await page.$$eval("#vue a.btn:not(.ghost), #vue button.btn:not(.ghost)", l => l.length);
    ok("calcul et pesée faits : l'accueil normal (plus d'étape, aucun bouton mis en avant) : Speed Formation, pages de l'accompagnement, « Récupérer mon plan d'action » discret (contour, en haut et dans la carte)", !(await page.$("#dc-etape")) && forts === 0 && !!(await page.$("#dc-formation")) && !!(await page.$("#dc-accomp .liste-debloque a")) && !!(await page.$('#vue .masthead a.btn.ghost[data-dc-cal="accueil_haut"]')) && !!(await page.$('#dc-accomp a.btn.ghost[data-dc-cal="accueil_accompagnement"]')), "forts " + forts);
    await c.close();
    ({ c, page } = await ouvrir(b, db, 7, "", "#dc-accomp")); await attendre(page, 1000);
    ok("un poids de départ (réglages de Ma progression) compte comme une pesée : accueil normal", !(await page.$("#dc-etape")), "");
    await c.close();
    ({ c, page } = await ouvrir(b, db, 5, "", "#dc-accomp")); await attendre(page, 1000);
    ok("un calc_perso fait avec un âge mineur ne compte pas : « Calcule tes calories (2 min) »", (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "")) === "calories", "");
    await c.close();
    ({ c, page } = await ouvrir(b, db, 6, "", "#dc-accomp")); await attendre(page, 1000);
    ok("un calc_perso vide (retiré) ne compte pas, même avec une pesée : « Calcule tes calories (2 min) »", (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "")) === "calories", "");
    ok("aucune écriture à l'affichage de ces accueils", saisies(db).length === 0, resume(db));
    await c.close();
  });

  await bloc("I. accueil en anglais", async () => {
    const k = 8, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })], ["calc_perso", { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" }]])] });
    avecEn(db, ID);
    const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp", { langue: "en" }); await attendre(page, 1200);
    const v = await texte(page, "#vue");
    ok("anglais : « Log your starting weight », « Your next step », phrase d'accueil traduite, bloc Speed Formation traduit", (await texte(page, "#dc-etape-go")) === "Log your starting weight" && (await texte(page, "#dc-etape h2")) === "Your next step" && v.includes(TXD.lede_en) && (await texte(page, "#dc-formation p")) === "The basics of nutrition and training, at your pace.", v.slice(0, 300));
    /* v61 (brief V2, E) : la carte « What coaching adds » (descriptions, bouton, note, case) et le bouton du haut, en anglais */
    const accEn = await page.evaluate(() => {
      const n = x => (x || "").replace(/[\s\u00a0\u202f]+/g, " ").trim(), q = s => document.querySelector(s), t = s => q(s) ? n(q(s).textContent) : null;
      return { liens: [...document.querySelectorAll("#dc-accomp .liste-debloque a")].map(a => a.textContent.trim()), lignes: [...document.querySelectorAll("#dc-accomp .liste-debloque li")].map(li => n(li.textContent)),
        titre: t("#dc-accomp h2"), haut: t('#vue .masthead a[data-dc-cal="accueil_haut"]'), hautSous: t("#vue .masthead .dc-haut-sous"), carte: t('#dc-accomp a[data-dc-cal="accueil_accompagnement"]'),
        note: t("#dc-accomp > p.note"), casTxt: q("#dc-reserve-case") && q("#dc-reserve-case").closest("label") ? n(q("#dc-reserve-case").closest("label").textContent) : null };
    });
    const lignesEn = [["My program", "programme"], ["Nutrition", "nutrition"], ["My training log", "journal"], ["My follow-up", "suivi"]].map(([nom, id]) => nom + " — " + TXD.av_en[id]);
    const frAcc = [TX.reserver, TX.cta_sous, TX.accomp, TX.accomp_note, TX.reserve_case].concat(Object.values(TXD.av)).filter(x => v.includes(x));
    ok("anglais : liens de la vitrine traduits (My program, Nutrition, My training log, My follow-up) avec leurs nouvelles descriptions, « What coaching adds », « Get my action plan » (haut et carte), « 15 min with Lucas · free », « 15 min with Lucas to go over your goal. Free. », « I've already booked my slot » ; aucun texte français de la carte, aucun « Book my assessment » ni « 30-minute », aucun « 7 days » ni « Day n/7 »",
      JSON.stringify(accEn.liens) === JSON.stringify(["My program", "Nutrition", "My training log", "My follow-up"]) && JSON.stringify(accEn.lignes) === JSON.stringify(lignesEn) && accEn.titre === TX.accomp_en && accEn.haut === TX.reserver_en && accEn.hautSous === TX.cta_sous_en && accEn.carte === TX.reserver_en && accEn.note === TX.accomp_note_en && accEn.casTxt === TX.reserve_case_en && frAcc.length === 0 && !TX.anciens.test(v) && !SEPT.test(v),
      JSON.stringify(accEn) + " · " + JSON.stringify(frAcc));
    const db2 = base({ comptes: [compte(9, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] }); avecEn(db2, PID(9));
    const x = await ouvrir(b, db2, 9, "", "#dc-accomp", { langue: "en" }); await attendre(x.page, 1000);
    ok("anglais : « Calculate your calories (2 min) », « Your first step »", (await texte(x.page, "#dc-etape-go")) === "Calculate your calories (2 min)" && (await texte(x.page, "#dc-etape h2")) === "Your first step", await texte(x.page, "#dc-etape"));
    await c.close(); await x.c.close();
  });

  /* v59 (lot E, remarque a de la relecture v52) : le calcul, puis la pesée, enregistrés et pas encore arrivés au serveur
     (envoi retenu 4 s par le faux Supabase : db.retard) ; retour immédiat à l'accueil : l'étape suit ce que l'onglet
     vient d'enregistrer (sa copie gardée sur l'appareil), toujours sans rien écrire à l'affichage */
  await bloc("I. accueil juste après l'enregistrement", async () => {
    const k = 37, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    db.retard = { calc_perso: 4000, mens: 4000 };
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3");
    await aller(page, "#/accueil", 300); await page.waitForSelector("#dc-accomp", { timeout: 3000 }).catch(() => {}); await attendre(page, 300);
    const e1 = await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "");
    ok("calcul enregistré, retour immédiat à l'accueil (envoi pas encore arrivé au serveur) : l'action mise en avant est déjà « Enregistre ta pesée de départ »", e1 === "pesee" && ecr(db, "calc_perso", ID).length === 0, e1 + " " + resume(db));
    await aller(page, "#/mensurations", 300); await page.waitForSelector("#e-poids", { state: "visible", timeout: 3000 }).catch(() => {});
    await page.fill("#e-poids", "72.4"); await page.click("#add");
    await aller(page, "#/accueil", 300); await page.waitForSelector("#dc-accomp", { timeout: 3000 }).catch(() => {}); await attendre(page, 300);
    ok("pesée enregistrée, retour immédiat à l'accueil (envoi pas encore arrivé) : plus d'étape mise en avant, l'accueil normal", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-etape")) && ecr(db, "mens", ID).length === 0, (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "aucune étape")) + " " + resume(db));
    await attendre(page, 4800);
    ok("… une fois arrivés : une écriture de calc_perso et une de mens (les deux saisies), rien d'autre, rien à l'affichage de l'accueil", ecr(db, "calc_perso", ID).length === 1 && ecr(db, "mens", ID).length === 1 && saisies(db).length === 2, resume(db));
    await c.close();
  });

  /* v59 (suite de la relecture) : même parcours, mais l'accueil s'ouvre 1 s après chaque saisie : les 700 ms sont passées,
     l'envoi est parti et reste en vol (db.retard : téléphone lent) ; seule la copie gardée sur l'appareil (Store.garder)
     dit alors ce que l'onglet vient d'enregistrer */
  await bloc("I. accueil pendant l'envoi", async () => {
    const k = 39, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    db.retard = { calc_perso: 4000, mens: 4000 };
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    const enVol = cle => page.evaluate(([id, x]) => ({ attente: Store.valeursEnAttente[id + "|" + x] !== undefined, copie: !!Auth.magasin().getItem("mhx_attente|" + id + "|" + x) }), [ID, cle]);
    const etape = async () => { await aller(page, "#/accueil", 300); await page.waitForSelector("#dc-accomp", { timeout: 3000 }).catch(() => {}); await attendre(page, 300); return page.$eval("#dc-etape", x => x.dataset.etape).catch(() => ""); };
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3");
    await attendre(page, 1000);
    const v1 = await enVol("calc_perso"), e1 = await etape();
    ok("calcul enregistré, accueil ouvert 1 s après (envoi parti, pas encore arrivé : seule la copie gardée sur l'appareil le dit) : l'action mise en avant est déjà « Enregistre ta pesée de départ »",
      !v1.attente && v1.copie && db.journal.includes("P calc_perso") && e1 === "pesee" && ecr(db, "calc_perso", ID).length === 0, JSON.stringify(v1) + " " + e1 + " " + resume(db));
    await aller(page, "#/mensurations", 300); await page.waitForSelector("#e-poids", { state: "visible", timeout: 3000 }).catch(() => {});
    await page.fill("#e-poids", "72.4"); await page.click("#add");
    await attendre(page, 1000);
    const v2 = await enVol("mens"), e2 = await etape();
    ok("pesée enregistrée, accueil ouvert 1 s après (envoi en vol) : plus d'étape mise en avant, l'accueil normal",
      !v2.attente && v2.copie && db.journal.includes("P mens") && !!(await page.$("#dc-accomp")) && e2 === "" && ecr(db, "mens", ID).length === 0, JSON.stringify(v2) + " " + (e2 || "aucune étape") + " " + resume(db));
    await attendre(page, 4800);
    ok("… une fois arrivés : une écriture de calc_perso et une de mens, rien d'autre, copies retirées par leur arrivée (pas par l'accueil)",
      ecr(db, "calc_perso", ID).length === 1 && ecr(db, "mens", ID).length === 1 && saisies(db).length === 2 && !(await enVol("calc_perso")).copie && !(await enVol("mens")).copie, resume(db));
    await c.close();
  });

  /* v59 (suite de la relecture) : la règle de date de la copie gardée sur l'appareil (celle de Store.reprendre) — une copie
     plus ancienne que le serveur (calcul retiré depuis : calc_perso vide en base) ne passe pas devant ; plus récente, si ;
     écrite par un autre compte sur cet appareil, jamais. Copie posée page ouverte (au démarrage, Store.reprendre l'aurait
     déjà traitée) ; rien d'écrit ni de retiré à l'affichage */
  await bloc("I. accueil : copie sur l'appareil et date du serveur", async () => {
    const k = 41, ID = PID(k), CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })], ["calc_perso", {}, avant(10 * MIN)]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil"); await attendre(page, 1000);
    const poser = (t, a) => page.evaluate(([id, t, a, v]) => { Auth.magasin().setItem("mhx_attente|" + id + "|calc_perso", JSON.stringify({ a: a || id, t, v })); }, [ID, t, a || null, CP]);
    const copie = () => page.evaluate(id => Auth.magasin().getItem("mhx_attente|" + id + "|calc_perso"), ID);
    const etape = async () => { await aller(page, "#/accueil", 300); await page.waitForSelector("#dc-accomp", { timeout: 3000 }).catch(() => {}); await attendre(page, 300); const e = await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => ""); await aller(page, "#/profil", 600); return e; };
    await poser(avant(H));
    const e1 = await etape(), c1 = await copie();
    ok("copie d'un calcul adulte PLUS ANCIENNE que le serveur (calc_perso vide en base, plus récent) : elle ne passe pas devant, « Calcule tes calories (2 min) » ; copie laissée telle quelle", e1 === "calories" && !!c1 && JSON.parse(c1).t === avant(H), e1 + " " + c1);
    await poser(avant(MIN));
    const e2 = await etape(), c2 = await copie();
    ok("… la même copie PLUS RÉCENTE que le serveur (pas encore arrivée) passe devant : « Enregistre ta pesée de départ »", e2 === "pesee" && !!c2 && JSON.parse(c2).t === avant(MIN), e2 + " " + c2);
    await poser(avant(MIN), COACH.id);
    const e3 = await etape();
    ok("… une copie posée sur cet appareil par un autre compte ne compte jamais : « Calcule tes calories (2 min) »", e3 === "calories", e3);
    ok("… aucune écriture à l'affichage de ces accueils (ni calc_perso ni rien d'autre)", saisies(db).length === 0 && ecr(db, "calc_perso").length === 0, resume(db));
    await c.close();
  });

  /* =================== J. calculateur du prospect : sa clé calc_perso, jamais calc =================== */
  await bloc("J. calculateur du prospect", async () => {
    const k = 13, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1500);
    const champs = await page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => document.getElementById(i).value));
    ok("ouvert au prospect : rien n'est inventé (âge, taille, poids, heures vides ; pas par jour : 6 000) ; aucun sexe choisi", JSON.stringify(champs) === '["","","","6000",""]' && (await page.$$eval('#sexe button[aria-pressed="true"]', l => l.length)) === 0, JSON.stringify(champs));
    ok("… « Il manque : Sexe, Âge (ans), Taille (cm), Poids (kg), Entraînement (h / semaine) », aucun chiffre", (await texte(page, "#calc-etat")) === "Il manque : Sexe, Âge (ans), Taille (cm), Poids (kg), Entraînement (h / semaine)" && (await texte(page, "#tdee")) === "—", await texte(page, "#calc-etat"));
    ok("… « pas un avis médical » sous le calcul", (await texte(page, "#calc-avis")) === TXD.avis, await texte(page, "#calc-avis"));
    ok("… à l'ouverture : aucune écriture (ni calc_perso, ni calc)", saisies(db).length === 0 && ecr(db, "calc").length === 0, resume(db));
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60");
    await attendre(page, 1300);
    ok("tant qu'il manque une donnée (heures d'entraînement) : toujours rien d'enregistré", ecr(db, "calc_perso", ID).length === 0 && (await texte(page, "#calc-etat")) === "Il manque : Entraînement (h / semaine)", await texte(page, "#calc-etat"));
    await page.fill("#heures", "3"); await attendre(page, 1500);
    const CP = (db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu;
    ok("données complètes : calc_perso enregistré, de la même forme que calc (objectif « perte » depuis sa réponse « Perdre du gras »)", memes(CP, { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" }), JSON.stringify(CP));
    ok("… jamais « calc » (la clé du coach), ni chez lui ni chez personne", ecr(db, "calc").length === 0 && ecr(db, "calc_perso").every(e => e.user_id === ID), resume(db));
    const att = await page.evaluate(() => { const d = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3 }; const T = outilCalculateur.metabolismeDeBase(d) * outilCalculateur.facteurActivite(d).total; return [Math.round(T), Math.round(T * 0.9)]; });
    const tdee = (await texte(page, "#tdee")).replace(/\D/g, ""), perte = (await texte(page, "#v-perte")).replace(/\D/g, "");
    ok("… mêmes formules que le coach : maintenance " + att[0] + " kcal, perte " + att[1] + " kcal", tdee === String(att[0]) && perte === String(att[1]) && att[0] === 1822, tdee + " / " + perte);
    ok("… « Tes chiffres sont enregistrés. », plus de message d'erreur", (await texte(page, "#calc-msg")) === "Tes chiffres sont enregistrés." && !(await page.isVisible("#calc-etat")) && !(await page.isVisible("#calc-ok")), await texte(page, "#calc-msg"));
    const n0 = ecr(db, "calc_perso", ID).length;
    await page.reload(); await pret(page, "#tdee"); await attendre(page, 1500);
    const champs2 = await page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => document.getElementById(i).value));
    ok("rechargé : ses chiffres reviennent (calc_perso), rien de réécrit, bouton « Enregistrer mes chiffres » caché", JSON.stringify(champs2) === '["30","165","60","6000","3"]' && ecr(db, "calc_perso", ID).length === n0 && !(await page.isVisible("#calc-ok")), JSON.stringify(champs2) + " " + n0 + "/" + ecr(db, "calc_perso", ID).length);
    await page.click('#objs [data-k="prise"]'); await attendre(page, 1300);
    ok("objectif « prise de masse » : enregistré dans calc_perso", ((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu || {}).objectif === "prise" && (await texte(page, "#obj-name")) === "prise de masse", "");
    await aller(page, "#/accueil", 1800);
    ok("retour à l'accueil : l'action mise en avant devient « Enregistre ta pesée de départ »", (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "")) === "pesee", "");
    ok("tout le bloc : aucune écriture de calc", ecr(db, "calc").length === 0, resume(db));
    await c.close();
  });

  await bloc("J. calculateur : départ depuis le calcul du coach ou l'ancien questionnaire", async () => {
    const CC = { sexe: "H", age: 41, taille: 181, poids: 88, pas: 9000, heures: 4, objectif: "maintien" };
    const db = base({ comptes: [
      compte(14, "Marc", "Essai", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })], ["calc", CC]]),
      compte(15, "Ana", "Ancienne", [["intake", Object.assign({}, ANCIEN, { bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])
    ] });
    let { c, page } = await ouvrirS(b, db, 14, "#/calculateur", "#tdee"); await attendre(page, 1500);
    const v1 = await page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => document.getElementById(i).value).concat([(document.querySelector('#sexe [aria-pressed="true"]') || {}).dataset ? document.querySelector('#sexe [aria-pressed="true"]').dataset.v : ""]));
    ok("un calcul préparé par le coach (calc) sert de départ, lu sans être écrit", JSON.stringify(v1) === '["41","181","88","9000","4","H"]' && saisies(db).length === 0, JSON.stringify(v1));
    ok("… bouton « Enregistrer mes chiffres » (des chiffres connus ne partent pas sans son accord)", await page.isVisible("#calc-ok"), "");
    await page.click("#calc-ok"); await attendre(page, 1400);
    ok("… « Enregistrer mes chiffres » : calc_perso écrit, calc du coach intact", memes((db.donnees.find(d => d.user_id === PID(14) && d.outil === "calc_perso") || {}).contenu, CC) && ecr(db, "calc").length === 0 && memes((db.donnees.find(d => d.user_id === PID(14) && d.outil === "calc") || {}).contenu, CC), resume(db));
    await c.close();
    ({ c, page } = await ouvrirS(b, db, 15, "#/calculateur", "#tdee")); await attendre(page, 1500);
    const v2 = await page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => document.getElementById(i).value));
    ok("un ancien prospect (10 réponses) : son âge, sa taille, son poids et ses séances servent de départ (pas : 6 000)", JSON.stringify(v2) === '["30","165","70","6000","3.75"]', JSON.stringify(v2));
    ok("… et rien n'est écrit sans son accord", ecr(db, "calc_perso", PID(15)).length === 0, resume(db));
    await c.close();
  });

  await bloc("J. calculateur : calc_perso piégé", async () => {
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    const db = base({ comptes: [compte(33, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })], ["calc_perso", { sexe: XSS, age: XSS, taille: { a: 1 }, poids: [80], pas: "x", heures: null, objectif: "<script>" }]])] });
    const { c, page } = await ouvrirS(b, db, 33, "#/calculateur", "#tdee"); await attendre(page, 1500);
    const champs = await page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => document.getElementById(i).value));
    ok("calc_perso écrit hors de l'app avec des valeurs piégées : la page s'affiche (champs vides, « Il manque : … »), aucune injection, rien d'écrit", JSON.stringify(champs) === '["","","","",""]' && (await texte(page, "#calc-etat")).startsWith("Il manque : Sexe, Âge (ans)") && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")) && saisies(db).length === 0, JSON.stringify(champs) + " " + resume(db));
    await aller(page, "#/accueil", 1600);
    ok("… et l'accueil propose toujours « Calcule tes calories (2 min) »", (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "")) === "calories", "");
    await c.close();
  });

  /* =================== K. garde-fou 18 ans =================== */
  await bloc("K. garde-fou 18 ans", async () => {
    const k = 16, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    await page.click('#sexe [data-v="F"]'); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3");
    await page.fill("#age", "17"); await page.press("#age", "Tab"); await attendre(page, 1600);
    ok("âge 17 : message clair « réservé aux adultes (18 ans et plus) : rien n'est enregistré », aucun chiffre", (await texte(page, "#calc-etat")) === TXD.mineur && (await texte(page, "#tdee")) === "—" && (await texte(page, "#g-prot")) === "—", await texte(page, "#calc-etat"));
    ok("… rien n'est écrit (ni calc_perso, ni calc), aucune copie laissée sur l'appareil", ecr(db, "calc_perso").length === 0 && ecr(db, "calc").length === 0 && !(await page.evaluate(id => Object.keys(localStorage).some(x => x.indexOf("mhx_attente|" + id + "|calc_perso") === 0), ID)), resume(db));
    await page.fill("#age", "30"); await attendre(page, 1500);
    ok("âge 30 ensuite : enregistré", ((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu || {}).age === 30, resume(db));
    await page.fill("#age", "16"); await page.press("#age", "Tab"); await attendre(page, 1600);
    const CP = (db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu;
    ok("âge 16 ensuite : ce que ce formulaire avait enregistré est retiré (calc_perso vide) et il le dit", JSON.stringify(CP) === "{}" && (await texte(page, "#calc-etat")) === TXD.mineur + " " + TXD.retire, JSON.stringify(CP) + " " + await texte(page, "#calc-etat"));
    ok("… aucune écriture n'a jamais porté un âge sous 18 ans", ecr(db, "calc_perso").every(e => !(e.contenu && typeof e.contenu.age === "number" && e.contenu.age < 18)), resume(db));
    await page.fill("#age", "95"); await page.press("#age", "Tab"); await attendre(page, 1500);
    ok("âge 95 : « Vérifie : Âge (ans) (18 à 90) », rien d'écrit", (await texte(page, "#calc-etat")) === "Vérifie : Âge (ans) (18 à 90)" && JSON.stringify((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu) === "{}", await texte(page, "#calc-etat"));
    await page.fill("#age", "3"); await attendre(page, 900);
    ok("« 3 » en cours de frappe (vers « 35 ») : pas encore jugé mineur (« Il manque : Âge (ans) »), rien d'écrit", (await texte(page, "#calc-etat")) === "Il manque : Âge (ans)" && JSON.stringify((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu) === "{}", await texte(page, "#calc-etat"));
    await c.close();
  });

  await bloc("K. garde-fou 18 ans : écriture en attente", async () => {
    const k = 17, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    await page.click('#sexe [data-v="H"]'); await page.fill("#taille", "178"); await page.fill("#poids", "70"); await page.fill("#heures", "2");
    await page.fill("#age", "30"); await page.fill("#age", "15"); await page.press("#age", "Tab");   // en moins de 700 ms
    await attendre(page, 1800);
    ok("âge 30 puis 15 avant l'envoi : l'écriture en attente ne part pas, aucun âge ni aucune donnée ne reste en base", ecr(db, "calc_perso").every(e => JSON.stringify(e.contenu) === "{}") && !["age", "poids", "taille"].some(x => x in (((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu) || {})), resume(db) + " " + JSON.stringify(ecr(db, "calc_perso").map(e => e.contenu)));
    ok("… aucune copie en attente sur l'appareil", !(await page.evaluate(id => Object.keys(localStorage).concat(Object.keys(sessionStorage)).some(x => x.indexOf("mhx_attente|" + id + "|calc_perso") === 0), ID)), "");
    await c.close();
  });

  await bloc("K. garde-fou 18 ans : calc_perso mineur en base, restauration, anglais", async () => {
    const MIN_CP = { sexe: "F", age: 16, taille: 160, poids: 52, pas: 6000, heures: 2, objectif: "maintien" };
    const db = base({ comptes: [compte(18, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })], ["calc_perso", MIN_CP]]),
      compte(19, "Zoé", "Bernard", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    let { c, page } = await ouvrirS(b, db, 18, "#/calculateur", "#tdee"); await attendre(page, 1800);
    ok("un calc_perso enregistré avec un âge mineur (hors de l'app) est retiré à l'ouverture du calculateur, message clair", JSON.stringify((db.donnees.find(d => d.user_id === PID(18) && d.outil === "calc_perso") || {}).contenu) === "{}" && (await texte(page, "#calc-etat")) === TXD.mineur + " " + TXD.retire, await texte(page, "#calc-etat"));
    await c.close();
    ({ c, page } = await ouvrirS(b, db, 19, "#/profil", "#vue .masthead")); await attendre(page, 800);
    const r = await page.evaluate(async () => {
      const essai = async d => { try { await Store.importer(JSON.stringify({ plateforme: "mhx", version: 2, donnees: d })); return "ok"; } catch (e) { return String(e && e.message); } };
      return [await essai({ calc_perso: { sexe: "F", age: 15, taille: 160, poids: 50, pas: 6000, heures: 2, objectif: "maintien" } }),
              await essai({ calc_perso: { sexe: "F", age: 28, taille: 160, poids: 55, pas: 6000, heures: 2, objectif: "maintien" } })];
    });
    await attendre(page, 800);
    ok("restauration d'une sauvegarde : un calc_perso fait avec un âge mineur n'est jamais restauré ; un calc_perso adulte l'est (sa clé à lui)", r[0] === "vide" && r[1] === "ok" && ecr(db, "calc_perso", PID(19)).length === 1 && ecr(db, "calc_perso", PID(19))[0].contenu.age === 28 && ecr(db, "calc").length === 0, JSON.stringify(r) + " " + resume(db));
    await c.close();
    const db2 = base({ comptes: [compte(20, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] }); avecEn(db2, PID(20));
    ({ c, page } = await ouvrirS(b, db2, 20, "#/calculateur", "#tdee", { langue: "en" })); await attendre(page, 1200);
    await page.fill("#age", "14"); await page.press("#age", "Tab"); await attendre(page, 800);
    ok("anglais : « The calculator is for adults only (18 and over): nothing is saved. »", (await texte(page, "#calc-etat")) === "The calculator is for adults only (18 and over): nothing is saved." && ecr(db2, "calc_perso").length === 0, await texte(page, "#calc-etat"));
    await c.close();
  });

  /* v59 (lot E, remarque e de la relecture v52) : « Copier ma sauvegarde » (Profil, bouton #sv-copy : Store.exporter) suit le
     même garde-fou que la restauration : un calcul fait avec un âge mineur (tapé, jamais enregistré, mais resté dans le
     cache) n'en sort jamais ; un calcul adulte, si. Presse-papiers remplacé par un espion (rien ne sort de la page). */
  await bloc("K. garde-fou 18 ans : « Copier ma sauvegarde »", async () => {
    const k = 38, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    const remplir = async age => { await page.click('#sexe [data-v="F"]'); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3"); await page.fill("#age", age); await page.press("#age", "Tab"); await attendre(page, 1500); };
    const copier = async () => { await aller(page, "#/profil", 1500); return page.evaluate(async () => {
      let t = null;
      try { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: x => { t = x; return Promise.resolve(); } } }); } catch (e) { }
      const bt = document.getElementById("sv-copy"); if (!bt) return { bouton: false };
      bt.click(); await new Promise(r => setTimeout(r, 300));
      let d = null; try { d = JSON.parse(t).donnees || null; } catch (e) { d = null; }
      return { bouton: true, cache: (Store.cache.calc_perso || {}).age, cles: d ? Object.keys(d) : null, cp: d ? d.calc_perso || null : null };
    }); };
    await remplir("17");
    const r1 = await copier();
    ok("âge 17 tapé (rien d'enregistré, resté dans le cache) : « Copier ma sauvegarde » copie ses données sans ce calcul (aucun âge sous 18 ans)", r1.bouton && r1.cache === 17 && Array.isArray(r1.cles) && r1.cles.includes("intake") && !r1.cp && ecr(db, "calc_perso").length === 0, JSON.stringify(r1) + " " + resume(db));
    await aller(page, "#/calculateur", 1500); await remplir("30");
    const r2 = await copier();
    ok("… un calcul adulte enregistré (30 ans) est bien dans la copie", r2.bouton && !!r2.cp && r2.cp.age === 30 && ((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu || {}).age === 30, JSON.stringify(r2));
    await c.close();
  });

  /* =================== L. garde-fou IMC =================== */
  await bloc("L. garde-fou IMC", async () => {
    const k = 21, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/calculateur", "#tdee"); await attendre(page, 1200);
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "25"); await page.fill("#taille", "175"); await page.fill("#heures", "2");
    await page.fill("#poids", "68"); await attendre(page, 1400);
    ok("IMC normal : l'objectif « Perte de poids −10% » est proposé (et choisi : sa réponse « Perdre du gras »)", await page.isVisible('#objs [data-k="perte"]') && await page.$eval('#objs [data-k="perte"]', x => !x.disabled && x.getAttribute("aria-pressed") === "true") && !(await page.isVisible("#calc-imc")), "");
    await page.fill("#poids", "50"); await attendre(page, 1500);   // IMC 16,3
    ok("IMC 16,3 (< 18,5) : pas d'objectif de perte proposé, maintien", !(await page.isVisible('#objs [data-k="perte"]')) && await page.$eval('#objs [data-k="perte"]', x => x.disabled) && await page.$eval('#objs [data-k="maintien"]', x => x.getAttribute("aria-pressed") === "true") && (await texte(page, "#obj-name")) === "maintien", "");
    ok("… la phrase de prudence existante s'affiche", (await texte(page, "#calc-imc")) === TXD.imc && await page.isVisible("#calc-imc"), await texte(page, "#calc-imc"));
    ok("… enregistré en maintien (jamais en perte)", ((db.donnees.find(d => d.user_id === ID && d.outil === "calc_perso") || {}).contenu || {}).objectif === "maintien", resume(db));
    await c.close();
  });

  /* =================== M. client Thomas et coach =================== */
  /* v53 (lot D-clients) : changement VOULU — le calculateur (sa clé calc_perso) et « Mon journal » (clé journal) sont
     ouverts au client : ils entrent dans sa navigation, leurs adresses ouvrent ses pages (et non plus son accueil), et
     l'ouverture du calculateur lit calc_perso. Sa barre du bas (téléphone) ne change pas. Détail : verif60 (A à L). */
  await bloc("M. client Thomas : calculateur et journal ouverts (v53)", async () => {
    const db = base();
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0); await pret(page, "#acc-vue");
    ok("client : sa navigation d'avant, plus le journal (après le programme) et le calculateur (après Ma progression) — v53", JSON.stringify(await page.$$eval("#nav a", l => l.map(a => a.dataset.id))) === JSON.stringify(["accueil", "programme", "journal", "nutrition", "mensurations", "calculateur", "suivi", "formation", "complements", "profil"]), JSON.stringify(await page.$$eval("#nav a", l => l.map(a => a.dataset.id))));
    const vus = [];
    for (const h of ["#/calculateur", "#/journal"]) { await aller(page, h, 1300); vus.push([h, await ou(page)]); }
    ok("client : #/calculateur et #/journal ouvrent ses pages, l'adresse gardée — v53", vus.every(([h, d]) => "#/" + d.courant === h && d.hash === h), JSON.stringify(vus));
    ok("client : à l'ouverture, aucune écriture (ni calc_perso, ni calc)", db.ecritures.length === 0, resume(db));
    await c.close();
    const m = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await m.page.goto(URL0); await pret(m.page, "#acc-vue");
    ok("client (téléphone) : barre du bas inchangée (Accueil, Programme, Nutrition, Progression, Plus)", JSON.stringify(await m.page.$$eval("#barre-bas a[data-id]", l => l.map(a => a.dataset.id))) === '["accueil","programme","nutrition","mensurations"]' && !!(await m.page.$("#barre-bas [data-plus]")), "");
    await m.c.close();
  });

  await bloc("M. coach : calc comme avant", async () => {
    const db = base();
    const CALC_T = clone((F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "calc") || {}).contenu);
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1000);
    ok("coach, son compte : son calculateur d'avant (âge dès 14 ans, pas de garde-fou ni de mention ajoutés)", await page.$eval("#age", x => x.min === "14") && !(await page.$("#calc-etat, #calc-avis, #calc-imc, #calc-ok")), "");
    await page.fill("#poids", "81"); await attendre(page, 1400);
    ok("coach, son compte : il écrit calc chez lui, jamais calc_perso", ecr(db, "calc", F.IDS.coach).length >= 1 && ecr(db, "calc_perso").length === 0, resume(db));
    await aller(page, "#/clients", 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
    const actions = await page.$$eval("#vue .bandeau-actions a", l => l.map(a => [a.textContent.trim(), a.getAttribute("href")]));
    /* v53 (lot D-clients) : changement VOULU — « Ses séances » mène au journal du client (#/journal, lecture seule) au lieu
       de #/entrainement (sa clé perf, vide) ; « Son journal » entre dans la navigation de sa fiche (détail : verif60 G) */
    ok("fiche de Thomas : « Ses calories » → #/calculateur comme avant ; v53 : « Ses séances » → #/journal, « Son journal » dans sa navigation", actions.some(([t, h]) => t === "Ses calories" && h === "#/calculateur") && actions.some(([t, h]) => t === "Ses séances" && h === "#/journal") && !!(await page.$('#nav a[data-id="journal"]')), JSON.stringify(actions));
    await aller(page, "#/calculateur", 1800);
    ok("fiche de Thomas, Ses calories : son calc (celui du coach) en départ", (await valeurDe(page, "#age")) === String(CALC_T.age) && (await valeurDe(page, "#poids")) === String(CALC_T.poids), (await valeurDe(page, "#age")) + " / " + JSON.stringify(CALC_T));
    const n0 = ecr(db, "calc", F.IDS.c1).length;
    await page.fill("#heures", "6"); await attendre(page, 1400);
    ok("fiche de Thomas : le coach écrit calc chez Thomas (comme avant), jamais calc_perso", ecr(db, "calc", F.IDS.c1).length === n0 + 1 && ecr(db, "calc_perso").length === 0 && ecr(db, "calc", F.IDS.c1).slice(-1)[0].contenu.heures === 6, resume(db));
    await c.close();
  });

  /* =================== N. navigation et pages du prospect =================== */
  await bloc("N. navigation du prospect", async () => {
    const k = 26, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]], { cree: avant(30 * J) })] });
    let { c, page } = await ouvrir(b, db, k, "", "#dc-accomp", { viewport: MOBILE }); await attendre(page, 800);
    ok("téléphone : barre du bas Accueil, Calculateur, Progression, Speed Formation (+ Plus)", JSON.stringify(await page.$$eval("#barre-bas a[data-id]", l => l.map(a => a.dataset.id))) === '["accueil","calculateur","mensurations","formation"]' && JSON.stringify(await page.$$eval("#barre-bas a[data-id] .lbl", l => l.map(a => a.textContent.trim()))) === '["Accueil","Calculateur","Progression","Speed Formation"]' && !!(await page.$("#barre-bas [data-plus]")), JSON.stringify(await page.$$eval("#barre-bas a[data-id] .lbl", l => l.map(a => a.textContent.trim()))));
    await page.click("#barre-bas [data-plus]"); await attendre(page, 500);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => a.dataset.id + (a.querySelector(".nav-cadenas") ? "🔒" : "")));
    ok("« Plus » : la vitrine verrouillée (programme, journal, nutrition, suivi) et le Profil", JSON.stringify(plus) === JSON.stringify(["programme🔒", "journal🔒", "nutrition🔒", "suivi🔒", "profil"]), JSON.stringify(plus));
    ok("téléphone : accueil sans débordement horizontal", !(await deborde(page)), await largeur(page));
    await c.close();
    ({ c, page } = await ouvrir(b, db, k, "", "#dc-accomp")); await attendre(page, 800);
    const nav = await page.$$eval("#nav a", l => l.map(a => a.dataset.id + (a.querySelector(".nav-cadenas") ? "🔒" : "")));
    ok("ordinateur : calculateur juste après Ma progression, ouverts avec la Speed Formation ; journal dans la vitrine ; compléments et bilan cachés", JSON.stringify(nav) === JSON.stringify(["accueil", "programme🔒", "journal🔒", "nutrition🔒", "mensurations", "calculateur", "suivi🔒", "formation", "profil"]), JSON.stringify(nav));
    const L0 = db.lectures.length;
    await aller(page, "#/journal", 1500);
    /* v52 : lots D + E — la page verrouillée du journal montre d'abord son exemple (#ech-journal, lot E : détaillé en E1) */
    /* v61 (brief V2, E2) : la note sous la carte (.verrou-plus) = la nouvelle description AVANTAGES.journal */
    ok("#/journal : page verrouillée « Mon journal » (l'exemple, puis cadenas, « Récupérer mon plan d'action », et sous la carte ce que l'accompagnement ajoute : « Chaque séance notée, et la charge à viser la fois suivante. »), rien de ses données n'est lu", !!(await page.$("#vue #ech-journal.echantillon")) && !!(await page.$("#vue .verrou")) && (await texte(page, "#vue .verrou a[target=_blank]")) === TX.reserver && (await texte(page, "#vue .verrou-plus")) === TXD.av_journal && db.lectures.slice(L0).filter(l => l.outil !== "eq.challenge").length === 0, JSON.stringify(db.lectures.slice(L0).map(l => l.outil)) + " · " + (await texte(page, "#vue .verrou-plus")));
    await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 1800);
    const cl = (((db.donnees.find(d => d.user_id === ID && d.outil === "challenge") || {}).contenu || {}).cta || {}).clics || [];
    ok("… son « Récupérer mon plan d'action » est compté (source verrou_journal)", cl.length === 1 && cl[0].source === "verrou_journal", JSON.stringify(cl));
    await aller(page, "#/formation", 2200);
    ok("inscrit il y a 30 jours : la Speed Formation est ouverte (plus de verrou au 8e jour)", !(await page.$("#vue .verrou")) && !!(await page.$("#fo-vue")) && (await ou(page)).courant === "formation", JSON.stringify(await ou(page)));
    await c.close();
  });

  await bloc("N. Ma progression du prospect", async () => {
    const k = 27, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrirS(b, db, k, "#/mensurations", "#k-poids"); await attendre(page, 1500);
    ok("Ma progression ouverte au prospect, sans la section photos (aucune lecture de photos, aucun appel au stockage)", !(await page.$("#vue .verrou")) && !(await page.$("#photos-panel, #ph-envoi")) && lu(db, "photos") === 0 && !db.chemins.some(x => x.includes("/storage/")), JSON.stringify(db.chemins.filter(x => /photos|storage/.test(x))));
    ok("… rien d'écrit à l'ouverture", saisies(db).length === 0, resume(db));
    await page.fill("#e-poids", "72.4"); await page.click("#add"); await attendre(page, 1500);
    const M = (db.donnees.find(d => d.user_id === ID && d.outil === "mens") || {}).contenu || {};
    ok("pesée de départ : mens écrit comme pour un client (semaine 1, poids 72,4)", Array.isArray(M.mesures) && M.mesures.length === 1 && M.mesures[0].poids === 72.4 && M.mesures[0].sem === 1, JSON.stringify(M.mesures));
    await aller(page, "#/accueil", 1800);
    ok("retour à l'accueil : toujours « Calcule tes calories (2 min) » (son calcul d'abord)", (await page.$eval("#dc-etape", x => x.dataset.etape).catch(() => "")) === "calories", "");
    await c.close();
  });

  await bloc("N. plus aucun « 7 jours » côté prospect", async () => {
    const k = 28, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]], { cree: avant(9 * J) })] });
    const vus = [];
    for (const langue of ["fr", "en"]) {
      const d = clone(db); d.ecritures = []; d.lectures = []; d.chemins = []; d.journal = [];
      if (langue === "en") avecEn(d, ID);
      const { c, page } = await ouvrir(b, d, k, "", "#dc-accomp", langue === "en" ? { langue: "en" } : {});
      for (const h of ["#/accueil", "#/decouverte/bilan", "#/calculateur", "#/mensurations", "#/profil", "#/programme", "#/nutrition", "#/journal", "#/suivi"]) {
        await aller(page, h, 1500);
        const t = norm(await page.evaluate(() => document.body.innerText));
        if (SEPT.test(t)) vus.push(langue + " " + h + " : " + (t.match(SEPT) || [""])[0]);
      }
      await aller(page, "#/formation", 1800);
      const tf = norm(await page.evaluate(() => document.body.innerText));
      if (/\b(Jour|Day) \d+ ?\/ ?7\b|découverte (est )?terminée|discovery period is over|période découverte/i.test(tf)) vus.push(langue + " #/formation");
      await c.close();
    }
    ok("écrans du prospect (FR et EN) : aucun « 7 jours », « Jour n/7 », « découverte terminée », « accès découverte »", vus.length === 0, JSON.stringify(vus));
    const k2 = await (async () => {
      const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp");
      const r = await page.evaluate(() => { const T = DECOUVERTE, E = DECOUVERTE.en; return ["jour", "jour_fini", "lede_reste_1", "lede_reste", "lede_fini"].filter(x => x in T || x in E).concat(("fermee" in T.formation || "fermee" in E.formation) ? ["formation.fermee"] : []); });
      await c.close(); return r;
    })();
    ok("textes « Jour {n}/{t} », « terminée », « Encore {n} jours… », « Ta période découverte est terminée… » retirés (FR et EN)", k2.length === 0, JSON.stringify(k2));
  });

  /* =================== O. coach : « inscrit depuis n j » (la tuile « Prospects en découverte » et le mode test « jour n »
     restent en v52 : retirés en v53) =================== */
  await bloc("O. coach : inscrit depuis n j", async () => {
    const I1 = NOUVEAU({ email_compte: "p30@exemple.fr", bilan_propose: { choix: "plus_tard", le: avant(3 * J) }, court_debut: avant(30 * J), court_le: avant(30 * J - H) });
    const db = base({ comptes: [
      compte(30, "Léa", "Ancienne", [["intake", I1]], { cree: avant(30 * J) }),
      compte(31, "Zoé", "Récente", [], { cree: avant(3 * J) }),
      compte(32, "Paul", "Dujour", [], { cree: avant(2 * MIN) })
    ] });
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/clients"); await pret(page, `[data-ouvrir="${PID(30)}"]`); await attendre(page, 600);
    const ligneDe = async id => norm(await page.$eval(`#vue [data-ouvrir="${id}"]`, a => (a.closest("tr") || a.closest(".sc-carte") || a.parentElement).textContent).catch(() => ""));
    const l150 = await ligneDe(PID(30)), l151 = await ligneDe(PID(31)), l152 = await ligneDe(PID(32));
    ok("Mes clients : pastilles « Découverte · inscrit depuis 30 j », « … 3 j », « … inscrit aujourd'hui »", l150.includes("Découverte · inscrit depuis 30 j") && l151.includes("Découverte · inscrit depuis 3 j") && l152.includes("Découverte · inscrit aujourd'hui"), [l150, l151, l152].map(x => x.slice(0, 160)).join(" | "));
    const vc = await texte(page, "#vue");
    ok("Mes clients : plus aucun « J n/7 » ni « Découverte terminée »", !/J\d+\/7|Découverte terminée|terminée/.test(vc), (vc.match(/J\d+\/7|terminée/) || [""])[0]);
    await page.click(`[data-ouvrir="${PID(30)}"]`); await page.waitForSelector("#fiche-decouverte", { timeout: 8000 }); await attendre(page, 800);
    /* le bloc « Suivi commercial » (raisons, action : « découverte terminée ») part avec le score et la température (chantier 4) */
    const fd = await texte(page, "#fiche-decouverte"), lede = await texte(page, "#vue .masthead .lede");
    ok("fiche : « inscrit depuis 30 j » (pastille et ligne du bloc Découverte, en-tête), plus de « jour n / 7 » ni de « terminée »", fd.includes("inscrit depuis 30 j") && lede.includes("Découverte : inscrit depuis 30 j, questionnaire rempli.") && !/jour \d+ ?\/ ?7|J\d+\/7|terminée/i.test(fd + " " + lede), fd.slice(0, 200) + " · " + lede);
    await aller(page, "#/prospects", 2400);
    await page.click('[data-filtre="tous"]').catch(() => {}); await attendre(page, 600);
    const st = await page.$$eval("#vue .sc-carte .sc-nom small", l => l.map(x => x.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    /* v53 (chantier 4) : le sous-titre des cartes devient « inscrit le jj/mm/aaaa · il y a N jours » */
    ok("page Prospects : sous-titre des cartes « inscrit le … », sans « J n/7 » ni « terminée »", st.length >= 3 && st.every(x => /^inscrit le \d{2}\/\d{2}\/\d{4} · /.test(x) && !/J\d+\/7|terminée/.test(x)), JSON.stringify(st));
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.click("#pr-csv")]);
    const t = fs.readFileSync(await dl.path(), "utf8");
    /* v53 (chantier 4) : plus de colonne « Découverte » (colonnes à jour, verif58) : on vérifie tout le fichier */
    const lignesCsv = t.replace(/^\uFEFF/, "").split("\r\n").filter(Boolean);
    ok("export CSV : 3 prospects, nulle part « jour n/7 » ni « terminée »", lignesCsv.length === 4 && !/jour \d+\/7|J\d+\/7|terminée/.test(t), JSON.stringify(lignesCsv.map(l => l.slice(0, 80))));
    ok("coach : aucune écriture", db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* v52 : lots D + E — les blocs I à O (lot D) ci-dessus, puis les blocs E1 (lot E) : le prospect a le vrai onglet
     journal du lot D (outilJournal, vitrine), E1 le teste tel quel, sans retouche de la page servie. */
  /* =================== E1. lot E : pages verrouillées du prospect, avec un exemple générique ===================
     programme (la séance découverte, niveau débutant), nutrition (une journée type : recettes du catalogue public,
     CONFIG.decouverte.recettes), journal (une séance notée), suivi (un suivi de la semaine) : l'exemple d'abord, marqué
     « Exemple » (région nommée pour les lecteurs d'écran), en lecture seule, sans aucune donnée du prospect (seul le
     catalogue public est lu, aucune clé « donnees ») ; puis l'appel exact et « Réserver mon bilan », toujours un lien
     .verrou a[target=_blank] compté (source verrou-<id>) [v61 : le texte propre à la page, « Récupérer mon plan d'action »,
     « 15 min avec Lucas · offert », la note AVANTAGES sous la carte, origine verrou_<id>] ; anglais ; téléphone 390 px ; les autres pages verrouillées, le
     client et le coach inchangés. v52 : lots D + E — l'onglet journal du prospect est le vrai, celui du lot D (outilJournal,
     « journal » dans CONFIG.marque.gratuit_vitrine) : plus aucune retouche de la page servie (l'ancien outil journal
     minimal ajouté par retouche est retiré). */
  {
    const EX = {
      /* v61 (brief V2, G) : un texte par page (avant, le même partout : « Tu veux un programme construit pour toi, qui évolue
         chaque semaine ? Réserve ton bilan. ») */
      appels: {
        programme: "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.",
        journal: "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser.",
        nutrition: "Avec l'accompagnement, tes repas sont calculés sur tes calories et tes macros, en tenant compte de ton régime et de tes allergies, avec ta liste de courses.",
        suivi: "Avec l'accompagnement, ton coach lit ton bilan chaque semaine et te répond avec la suite du plan : tu sais toujours où tu en es et quoi faire ensuite."
      },
      appels_en: {
        programme: "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress.",
        journal: "With coaching, every workout is logged and the app suggests the weight to aim for next time: you always know what to do to progress.",
        nutrition: "With coaching, your meals are calculated from your calories and macros, taking your diet and allergies into account, with your shopping list.",
        suivi: "With coaching, your coach reads your weekly check-in and replies with the next step: you always know where you stand and what to do next."
      },
      marque: "Exemple", marque_en: "Example",
      note: "Un aperçu de cette page avec l'accompagnement : ce ne sont pas tes données.",
      note_en: "A preview of this page with coaching: this isn't your data.",
      ancien: "Cette fonctionnalité est disponible avec l'accompagnement MHX."
    };
    const PRIX = /€|\$|£|\bEUR\b|\beuros?\b|\bdollars?\b|(?<!à tout )\bprix\b|tarif|abonnement|\/\s*mois|(?<!\bat a )\bprices?\b|pricing|subscription|\/\s*month/i;   // même règle que verif40
    const TEMOIN = "TÉMOIN-LOT-E";
    /* ce qu'aurait un ancien client redevenu prospect : une page verrouillée ne doit JAMAIS le lire ni l'afficher */
    const TEMOINS = [
      ["programme", { nom: TEMOIN, seances: [{ nom: TEMOIN, exercices: [{ nom: TEMOIN, series: "3", reps: "10" }] }] }],
      ["repas", { nom: TEMOIN, cible: { kcal: 1999 }, jours: [{ nom: TEMOIN, repas: [{ nom: TEMOIN, ingredients: [] }] }] }],
      ["journal", { seances: [{ date: avant(2 * J).slice(0, 10), si: 0, nom: TEMOIN, exos: [{ nom: TEMOIN, series: [{ r: 7, c: 77 }] }] }] }],
      ["mens", { dstart: avant(9 * J).slice(0, 10), pstart: 77.7, mesures: [{ sem: 1, date: avant(9 * J).slice(0, 10), poids: 77.7 }] }],
      ["checkins", { liste: [{ semaine: TEMOIN, note: TEMOIN }] }]
    ];
    const CLES_TEMOINS = TEMOINS.map(x => x[0]);
    const prospectE = k => compte(k, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(H) }, email_compte: "p" + k + "@exemple.fr" })]].concat(TEMOINS));
    /* ce que montre une page verrouillée : l'exemple, son nom accessible, l'appel du verrou, son lien, l'ordre */
    const vueVerrou = (page, id) => page.evaluate(id => {
      const e = document.getElementById("ech-" + id), v = document.querySelector("#vue .verrou");
      const a = v ? v.querySelectorAll("a") : [], lab = e && e.getAttribute("aria-labelledby") ? document.getElementById(e.getAttribute("aria-labelledby")) : null;
      const n = x => (x || "").replace(/\s+/g, " ").trim();
      return { ech: !!e, role: e ? e.getAttribute("role") : "", label: lab ? n(lab.textContent) : "", marque: e ? n((e.querySelector(".ech-marque .pastille") || {}).textContent) : "",
        avant: !!(e && v && (e.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING)), texte: e ? n(e.textContent) : "",
        appel: v ? n((v.querySelector("p") || {}).textContent) : "", nLiens: a.length,
        lien: a[0] ? { href: a[0].getAttribute("href"), t: n(a[0].textContent), cible: a[0].getAttribute("target"), rel: a[0].getAttribute("rel") } : null,
        /* v61 : la ligne sous le bouton (après lui, dans la carte) et la note sous la carte */
        sous: v && v.querySelector(".verrou-sous") ? n(v.querySelector(".verrou-sous").textContent.replace(/[\u00a0\u202f]/g, " ")) : null,
        sousApres: !!(a[0] && v && v.querySelector(".verrou-sous") && (a[0].compareDocumentPosition(v.querySelector(".verrou-sous")) & Node.DOCUMENT_POSITION_FOLLOWING)),
        plus: n(((document.querySelector("#vue .verrou-plus") || {}).textContent || "").replace(/[\u00a0\u202f]/g, " ")),
        attendu: lienCalendly("verrou_" + id), base: CONFIG.marque.calendly, h: a[0] ? a[0].getBoundingClientRect().height : 0,
        champs: e ? e.querySelectorAll("a, input, textarea, select, [contenteditable]").length : -1 };
    }, id);
    /* v61 (brief V2, G) : le texte propre à la page (avant : le même appel partout), « Récupérer mon plan d'action » (avant :
       « Réserver mon bilan »), la ligne « 15 min avec Lucas · offert » juste après, la note AVANTAGES de la page sous la carte */
    const appelOk = (v, id, en) => !!v && v.ech && v.appel === (en ? EX.appels_en : EX.appels)[id] && v.nLiens === 1 && !!v.lien && v.lien.href === v.attendu && v.lien.t === (en ? TX.reserver_en : TX.reserver) && v.lien.cible === "_blank" && /noopener/.test(v.lien.rel || "") && v.avant
      && v.sous === (en ? TX.cta_sous_en : TX.cta_sous) && v.sousApres && v.plus === (en ? TXD.av_en : TXD.av)[id];
    const marqueOk = (v, en) => !!v && v.ech && v.role === "region" && v.marque === (en ? EX.marque_en : EX.marque) && v.label === (en ? EX.marque_en + " " + EX.note_en : EX.marque + " " + EX.note);
    const perso = t => /Léa|Martin|@exemple|TÉMOIN|1999|77[,.]7/.test(t);
    const clicsDe = (db, uid) => ((((db.donnees.find(d => d.user_id === uid && d.outil === "challenge") || {}).contenu || {}).cta || {}).clics || []);
    /* les lectures de « donnees » depuis n0, hors compteur de visites du prospect (clé activite : relue juste avant son
       écriture, au plus une fois par minute, quelle que soit la page) */
    const luHors = (db, n0) => db.lectures.slice(n0).filter(l => l.outil !== "eq.activite");
    const clesCache = page => page.evaluate(() => { try { return [...new Set(Object.values(Store.boites || {}).concat([Store.cache || {}]).flatMap(x => Object.keys(x || {})))]; } catch (e) { return null; } });
    const lienPre = (v, k, id) => v && v.lien ? lienOk(v.lien.href, v.base, { source: "verrou_" + id, prenom: "Léa", nom: "Martin", email: "p" + k + "@exemple.fr" }) : "pas de lien";
    /* clic « Récupérer mon plan d'action » (sans ouvrir Calendly) : noté une fois dans challenge avec la source (v61 :
       verrou_<id>), rien d'autre écrit */
    async function clicCompte(page, db, uid, id){
      const w0 = saisies(db).length;
      await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 2200);
      const cl = clicsDe(db, uid), aut = saisies(db).slice(w0).filter(e => e.outil !== "challenge");
      ok(`#/${id} : un clic « Récupérer mon plan d'action » est compté (challenge.cta.clics, source verrou_${id}), rien d'autre n'est écrit`, cl.length === 1 && cl[0].source === "verrou_" + id && ecr(db, "challenge", uid).length === 1 && aut.length === 0, JSON.stringify(cl) + " · " + resume(db));
    }
    const capture = async (page, nom) => { try { fs.mkdirSync(path.join(__dirname, "captures", "v56"), { recursive: true }); } catch (e) { } await page.screenshot({ path: path.join(__dirname, "captures", "v56", nom + ".png"), fullPage: true }).catch(() => {}); };
    const RECETTES = CATALOGUE.recettes, ALIM = Object.fromEntries(CATALOGUE.aliments.map(a => [a.id, a]));
    const MOMENTS = { petit_dejeuner: "Petit-déjeuner", dejeuner: "Déjeuner", collation: "Collation", diner: "Dîner" };
    const MOMENTS_EN = { petit_dejeuner: "Breakfast", dejeuner: "Lunch", collation: "Snack", diner: "Dinner" };
    /* la journée type attendue, calculée ici depuis les fichiers du catalogue (mêmes additions que Catalogue.macros) */
    const journeeAttendue = (ids, en) => ids.map(id => {
      const r = RECETTES.find(x => x.id === id); if (!r) return { id, absente: true };
      let kcal = 0, prot = 0; for (const i of r.ingredients) { const a = ALIM[i.aliment_id], q = i.grammes / 100; if (a) { kcal += (+a.kcal || 0) * q; prot += (+a.proteines || 0) * q; } }
      const loc = en ? "en-US" : "fr-FR";
      return { moment: (en ? MOMENTS_EN : MOMENTS)[r.moment] || "", nom: r.nom, info: r.temps_min + " min · " + Math.round(kcal).toLocaleString(loc) + (en ? " Cal · " : " kcal · ") + Math.round(prot).toLocaleString(loc) + (en ? " g protein" : " g de protéines"), ing: r.ingredients.length, etapes: r.etapes.length };
    });
    const journeeVue = page => page.$$eval("#ech-repas details", l => l.map(d => ({ moment: ((d.querySelector(".ech-moment") || {}).textContent || "").trim(), nom: ((d.querySelector("summary b") || {}).textContent || "").trim(), info: ((d.querySelector(".ech-macros") || {}).textContent || "").trim(), ing: d.querySelectorAll(".ingr li").length, etapes: d.querySelectorAll(".etapes li").length }))).catch(() => []);
    const JOURNAL_ATTENDU = [
      { nom: "Squat goblet", series: ["Série 1|12 reps|16 kg", "Série 2|12 reps|16 kg", "Série 3|10 reps|16 kg"], conseil: "" },
      { nom: "Pompes", series: ["Série 1|10 reps|poids du corps", "Série 2|9 reps|poids du corps", "Série 3|8 reps|poids du corps"], conseil: "" },
      { nom: "Rowing haltère", series: ["Série 1|12 reps|14 kg", "Série 2|11 reps|14 kg", "Série 3|10 reps|14 kg"], conseil: "" },
      { nom: "Hip thrust", series: ["Série 1|12 reps|40 kg", "Série 2|12 reps|40 kg", "Série 3|12 reps|40 kg"], conseil: "Toutes tes séries ont atteint 12 reps : passe à 42,5 kg." }
    ];
    const journalVu = page => page.evaluate(() => {
      const e = document.querySelector("#ech-journal"); if (!e) return null;
      const n = x => (x || "").replace(/\s+/g, " ").trim();
      return { h2: n((e.querySelector("h2") || {}).textContent), pastille: n((e.querySelector(".seance-c-tete .pastille") || {}).textContent), resume: n((e.querySelectorAll("section > p.note")[0] || {}).textContent),
        exos: [...e.querySelectorAll(".ech-exo")].map(x => ({ nom: n(x.querySelector("b").textContent), series: [...x.querySelectorAll(".set")].map(s => [".s-lbl", ".v", ".c"].map(c => n((s.querySelector(c) || {}).textContent)).join("|")), conseil: n((x.querySelector("p.note b") || {}).textContent) })) };
    });
    const suiviVu = page => page.evaluate(() => {
      const e = document.querySelector("#ech-suivi"); if (!e) return null;
      const n = x => (x || "").replace(/\s+/g, " ").trim(), s = e.querySelector("svg");
      return { h2: n((e.querySelector("h2") || {}).textContent), semaine: n((e.querySelector(".seance-c-tete .pastille") || {}).textContent),
        tuiles: [...e.querySelectorAll(".tile")].map(t => [".t-lbl", ".t-val", ".t-sub"].map(c => n((t.querySelector(c) || {}).textContent)).join("|")),
        courbe: n((e.querySelector(".ech-courbe h3") || {}).textContent), svg: s ? { role: s.getAttribute("role"), label: s.getAttribute("aria-label"), points: s.querySelectorAll("circle").length, textes: [...s.querySelectorAll("text")].map(t => t.textContent) } : null,
        titreMsg: n((e.querySelector(".ech-message .fb-tete") || {}).textContent), msg: n((e.querySelector(".ech-message .fb-texte") || {}).textContent) };
    });

    await bloc("E1. programme", async () => {
      for (const viewport of [ORDI, MOBILE]) {
        const k = viewport === ORDI ? 40 : 41, ID = PID(k), w = viewport.width + " px";
        const db = base({ comptes: [prospectE(k)] });
        const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { viewport });
        const n0 = db.lectures.length;
        await aller(page, "#/programme", 1600);
        const v = await vueVerrou(page, "programme");
        ok(`${w} : #/programme — d'abord l'exemple, marqué « ${EX.marque} » (région nommée « ${EX.marque} ${EX.note} »), puis l'appel`, marqueOk(v) && v.avant, JSON.stringify(v).slice(0, 300));
        const s = await page.evaluate(() => { const e = document.querySelector("#ech-programme"); return e ? { h2: (e.querySelector("h2") || {}).textContent, exos: [...e.querySelectorAll(".ch-exos b")].map(x => x.textContent), notes: [...e.querySelectorAll("p.note")].map(p => p.textContent).join(" | "), echauffement: e.querySelectorAll(".ingr li").length, demos: e.querySelectorAll("[data-yt]").length } : null; });
        ok(`${w} : l'exemple = la séance découverte, niveau débutant (échauffement, 5 exercices, 2 tours, 5 démonstrations)`, !!s && s.h2 === "Ta séance découverte" && JSON.stringify(s.exos) === JSON.stringify(["Squats", "Pompes", "Fentes arrière", "Pont fessier", "Gainage"]) && s.notes.includes("2 tours (ton niveau : Débutant)") && s.echauffement > 0 && s.demos === 5, JSON.stringify(s));
        ok(`${w} : aucune donnée personnelle dans l'exemple (ni prénom, ni nom, ni email, ni ses données témoins) ; lecture seule (aucun lien ni champ)`, !perso(v.texte) && v.champs === 0 && !(await texte(page, "#vue")).includes(TEMOIN), v.texte.slice(0, 200));
        const pb = lienPre(v, k, "programme");
        ok(`${w} : le texte exact de la page (« ${EX.appels.programme.slice(0, 50)}… »), « Récupérer mon plan d'action » (seul lien du verrou, Calendly pré-rempli exact, source verrou_programme, nouvel onglet), « 15 min avec Lucas · offert », la note « ${TXD.av.programme} »`, appelOk(v, "programme") && !pb, pb + " · " + JSON.stringify([v.appel, v.nLiens, v.lien]));
        ok(`${w} : aucune clé « donnees » lue en ouvrant la page, aucune écriture`, luHors(db, n0).length === 0 && saisies(db).length === 0, JSON.stringify(luHors(db, n0)) + " · " + resume(db));
        if (viewport === MOBILE) {
          ok("390 px : #/programme sans défilement horizontal, « Récupérer mon plan d'action » tactile (44 px de haut au moins)", !(await deborde(page)) && v.h >= 44, (await largeur(page)) + " · " + v.h);
          await capture(page, "ech-programme-mobile");
        } else {
          await page.click("#ech-programme [data-yt]"); await attendre(page, 500);
          const f = await page.evaluate(() => ({ src: (document.querySelector("#ech-programme iframe") || {}).src || "", reste: document.querySelectorAll("#ech-programme [data-yt]").length }));
          ok("« Démonstration » ouvre la vidéo à la place du bouton (youtube-nocookie), rien n'est écrit", f.src.startsWith("https://www.youtube-nocookie.com/embed/G9nGRJjQFXw") && f.reste === 4 && saisies(db).length === 0, JSON.stringify(f));
          await clicCompte(page, db, ID, "programme");
        }
        await c.close();
      }
    });

    await bloc("E1. nutrition", async () => {
      for (const viewport of [ORDI, MOBILE]) {
        const k = viewport === ORDI ? 42 : 43, ID = PID(k), w = viewport.width + " px";
        const db = base({ comptes: [prospectE(k)] });
        const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { viewport });
        const n0 = db.lectures.length, ch0 = db.chemins.length;
        await aller(page, "#/nutrition", 400);
        await page.waitForSelector("#ech-repas details", { timeout: 10000 }); await attendre(page, 400);
        const v = await vueVerrou(page, "nutrition");
        const ids = await page.evaluate(() => CONFIG.decouverte.recettes), vus = await journeeVue(page), att = journeeAttendue(ids);
        const tete = await page.evaluate(() => { const e = document.querySelector("#ech-nutrition"); return e ? [(e.querySelector("h2") || {}).textContent, (e.querySelector("section > p.note") || {}).textContent] : []; });
        ok(`${w} : #/nutrition — l'exemple (« ${EX.marque} ») : « Une journée type », les recettes du catalogue (CONFIG.decouverte.recettes) dans l'ordre, avec moment, temps, calories et protéines calculées depuis les aliments, ingrédients et préparation`, marqueOk(v) && v.avant && tete[0] === "Une journée type" && ids.length === 3 && JSON.stringify(vus) === JSON.stringify(att), JSON.stringify(vus) + " ≠ " + JSON.stringify(att));
        const ch = db.chemins.slice(ch0);
        ok(`${w} : seul le catalogue public est lu (recettes, aliments) : aucune clé « donnees », aucune écriture, aucune donnée personnelle affichée`, ch.includes("GET /rest/v1/recettes") && ch.includes("GET /rest/v1/aliments") && luHors(db, n0).length === 0 && saisies(db).length === 0 && !perso(v.texte) && v.champs === 0, JSON.stringify(ch.filter(x => !x.startsWith("OPTIONS")).slice(0, 12)) + " · " + JSON.stringify(luHors(db, n0)));
        const pb = lienPre(v, k, "nutrition");
        ok(`${w} : le texte exact de la page nutrition, « Récupérer mon plan d'action » (source verrou_nutrition, pré-rempli, nouvel onglet), « 15 min avec Lucas · offert », la note AVANTAGES`, appelOk(v, "nutrition") && !pb, pb + " · " + JSON.stringify([v.appel, v.nLiens, v.lien]));
        if (viewport === MOBILE) {
          await page.$$eval("#ech-repas details", l => l.forEach(d => { d.open = true; })); await attendre(page, 300);
          ok("390 px : journée type dépliée sans défilement horizontal, bouton tactile", !(await deborde(page)) && v.h >= 44, (await largeur(page)) + " · " + v.h);
          await capture(page, "ech-nutrition-mobile");
        } else await clicCompte(page, db, ID, "nutrition");
        await c.close();
      }
      /* catalogue incomplet (les recettes de CONFIG.decouverte.recettes absentes, comme le catalogue tronqué de fixtures.js) */
      const k = 46, db = base({ comptes: [prospectE(k)] });
      const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead");
      const ids = await page.evaluate(() => CONFIG.decouverte.recettes);
      await c.route(u => new URL(u).pathname === "/rest/v1/recettes", r => r.request().method() === "OPTIONS" ? r.fallback() : r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(F.catalogue.recettes.filter(x => !ids.includes(x.id))) }));
      await aller(page, "#/nutrition", 2500);
      const t = await texte(page, "#ech-repas"), v = await vueVerrou(page, "nutrition");
      ok("recettes introuvables dans le catalogue : « Les recettes n'ont pas pu être chargées. Recharge la page. », l'exemple et l'appel restent, rien d'écrit", t === "Les recettes n'ont pas pu être chargées. Recharge la page." && marqueOk(v) && appelOk(v, "nutrition") && saisies(db).length === 0, t + " · " + JSON.stringify([v.ech, v.appel]));
      await c.close();
    });

    await bloc("E1. journal (le vrai onglet du lot D)", async () => {
      for (const viewport of [ORDI, MOBILE]) {
        const k = viewport === ORDI ? 44 : 45, ID = PID(k), w = viewport.width + " px";
        const db = base({ comptes: [prospectE(k)] });
        const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { viewport });
        /* v52 : lots D + E — c'est le vrai onglet du lot D (outilJournal, sans clé, juste après le programme dans la
           navigation), pas un outil ajouté par le test. v53 (lot D-clients) : il n'est plus prospect_seul mais client_seul
           (l'onglet « Mon journal » du client, et le coach dans une fiche) ; pour le prospect, toujours la page verrouillée */
        const nav = await page.evaluate(() => { const a = document.querySelector('#nav a[data-id="journal"]'); const o = OUTILS.find(x => x.id === "journal"); return a ? { cadenas: !!a.querySelector(".nav-cadenas"), sr: (a.querySelector(".sr-only") || {}).textContent || "", vrai: typeof outilJournal !== "undefined" && o === outilJournal && o.client_seul === true && !o.prospect_seul && o.cle === null, ordre: [...document.querySelectorAll("#nav a")].map(x => x.dataset.id).join(",") } : null; });
        if (viewport === ORDI) ok("l'onglet journal (vitrine) apparaît dans la navigation du prospect, avec son cadenas (« (verrouillé) ») : le vrai onglet du lot D (outilJournal), juste après le programme", !!nav && nav.cadenas && nav.sr === " (verrouillé)" && nav.vrai && nav.ordre === "accueil,programme,journal,nutrition,mensurations,calculateur,suivi,formation,profil", JSON.stringify(nav));
        const n0 = db.lectures.length;
        await aller(page, "#/journal", 1600);
        const v = await vueVerrou(page, "journal"), j = await journalVu(page);
        ok(`${w} : #/journal — l'exemple (« ${EX.marque} ») d'une séance notée : « Séance A — Corps entier », « Séance notée », « 4 exercices · 12 séries », puis l'appel`, marqueOk(v) && v.avant && !!j && j.h2 === "Séance A — Corps entier" && j.pastille === "Séance notée" && j.resume === "4 exercices · 12 séries", JSON.stringify(j && [j.h2, j.pastille, j.resume]) + " · " + JSON.stringify(v).slice(0, 200));
        ok(`${w} : chaque série avec ses répétitions et sa charge (ou « poids du corps »), et le conseil de la séance suivante calculé comme le vrai journal`, !!j && JSON.stringify(j.exos) === JSON.stringify(JOURNAL_ATTENDU), JSON.stringify(j && j.exos));
        const pb = lienPre(v, k, "journal");
        ok(`${w} : le texte exact de la page journal, « Récupérer mon plan d'action » (source verrou_journal, pré-rempli, nouvel onglet), « 15 min avec Lucas · offert », la note AVANTAGES ; aucune donnée personnelle, aucun champ`, appelOk(v, "journal") && !pb && !perso(v.texte) && v.champs === 0, pb + " · " + JSON.stringify([v.appel, v.lien]));
        ok(`${w} : aucune clé « donnees » lue (ni journal, ni autre), aucune écriture`, luHors(db, n0).length === 0 && saisies(db).length === 0, JSON.stringify(luHors(db, n0)) + " · " + resume(db));
        if (viewport === MOBILE) { ok("390 px : #/journal sans défilement horizontal, bouton tactile", !(await deborde(page)) && v.h >= 44, (await largeur(page)) + " · " + v.h); await capture(page, "ech-journal-mobile"); }
        else await clicCompte(page, db, ID, "journal");
        await c.close();
      }
    });

    await bloc("E1. suivi", async () => {
      for (const viewport of [ORDI, MOBILE]) {
        const k = viewport === ORDI ? 47 : 48, ID = PID(k), w = viewport.width + " px";
        const db = base({ comptes: [prospectE(k)] });
        const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { viewport });
        const n0 = db.lectures.length;
        await aller(page, "#/suivi", 1600);
        const v = await vueVerrou(page, "suivi"), s = await suiviVu(page);
        ok(`${w} : #/suivi — l'exemple (« ${EX.marque} ») d'un suivi de la semaine : « Ton suivi de la semaine », « Semaine 5 », régularité, séances, poids`, marqueOk(v) && v.avant && !!s && s.h2 === "Ton suivi de la semaine" && s.semaine === "Semaine 5" && JSON.stringify(s.tuiles) === JSON.stringify(["Régularité|86/ 100|cette semaine", "Séances notées|3/ 3|cette semaine", "Poids|−0,4kg|depuis la semaine dernière"]), JSON.stringify(s && [s.h2, s.semaine, s.tuiles]));
        ok(`${w} : la courbe de poids (5 points S1 à S5), une image décrite pour les lecteurs d'écran, et le message du coach`, !!s && s.courbe === "Ta courbe de poids" && !!s.svg && s.svg.role === "img" && s.svg.label === "Poids sur 5 semaines : de 82,0 kg à 80,4 kg." && s.svg.points === 5 && ["S1", "S2", "S3", "S4", "S5", "82,0", "80,4"].every(x => s.svg.textes.includes(x)) && s.titreMsg === "Feedback de ton coach" && s.msg === "Belle semaine : 3 séances sur 3 et 400 g de moins sur la balance. On garde le même plan. Cette semaine, ajoute 10 minutes de marche après le dîner.", JSON.stringify(s && [s.courbe, s.svg, s.titreMsg, s.msg]));
        const pb = lienPre(v, k, "suivi");
        ok(`${w} : le texte exact de la page suivi, « Récupérer mon plan d'action » (source verrou_suivi, pré-rempli, nouvel onglet), « 15 min avec Lucas · offert », la note AVANTAGES ; aucune donnée personnelle, aucun champ`, appelOk(v, "suivi") && !pb && !perso(v.texte) && v.champs === 0, pb + " · " + JSON.stringify([v.appel, v.lien]));
        ok(`${w} : aucune clé « donnees » lue (ni checkins, ni mens, ni autre), aucune écriture`, luHors(db, n0).length === 0 && saisies(db).length === 0, JSON.stringify(luHors(db, n0)) + " · " + resume(db));
        if (viewport === MOBILE) { ok("390 px : #/suivi sans défilement horizontal, bouton tactile", !(await deborde(page)) && v.h >= 44, (await largeur(page)) + " · " + v.h); await capture(page, "ech-suivi-mobile"); }
        else await clicCompte(page, db, ID, "suivi");
        await c.close();
      }
    });

    await bloc("E1. les quatre pages : rien de ses données, aucun prix", async () => {
      const k = 49, db = base({ comptes: [prospectE(k)] });
      const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead");
      const n0 = db.lectures.length, fautes = [];
      for (const id of ["programme", "nutrition", "journal", "suivi"]) {
        await aller(page, "#/" + id, 1800);
        if (id === "nutrition") await page.waitForSelector("#ech-repas details", { timeout: 10000 }).catch(() => {});
        const t = await page.evaluate(() => { const v = document.querySelector("#vue"); return v ? v.innerText + "\n" + v.textContent : ""; }).then(norm);
        if (!(await page.$("#ech-" + id))) fautes.push(id + " : pas d'exemple");
        if (t.includes(TEMOIN)) fautes.push(id + " : donnée témoin affichée");
        const m = PRIX.exec(t); if (m) fautes.push(id + " : prix « " + t.slice(Math.max(0, m.index - 40), m.index + 30) + " »");
      }
      const pendant = luHors(db, n0), n1 = db.lectures.length;
      await page.reload(); await pret(page, "#vue .masthead"); await attendre(page, 800);
      if (!(await page.$("#ech-suivi"))) fautes.push("suivi rechargé : pas d'exemple");
      const cles = await clesCache(page), apres = luHors(db, n1).filter(l => l.outil !== "eq.prefs");   // au démarrage, l'app lit la langue (prefs), comme partout
      ok("#/programme, #/nutrition, #/journal, #/suivi (puis rechargement) : chacune son exemple, aucune donnée témoin affichée, aucun prix, tarif ni abonnement", fautes.length === 0, fautes.join(" ; "));
      ok("… aucune clé « donnees » lue pendant toute la visite (au rechargement : sa langue seulement), aucune de ses données d'accompagnement dans le cache de l'app, aucune écriture", pendant.length === 0 && apres.length === 0 && Array.isArray(cles) && !cles.some(x => CLES_TEMOINS.includes(x)) && saisies(db).length === 0, JSON.stringify(pendant.concat(apres)) + " · " + JSON.stringify(cles) + " · " + resume(db));
      const txt = await page.evaluate(() => { const l = []; const f = x => { if (typeof x === "string") l.push(x); else if (x && typeof x === "object") Object.values(x).forEach(f); }; f(DECOUVERTE.echantillons); f(DECOUVERTE.en.echantillons); return l.join("\n"); });
      const m = PRIX.exec(txt);
      ok("textes des exemples (DECOUVERTE.echantillons, FR et EN) : aucun prix, tarif ni abonnement", !!txt && !m, m ? txt.slice(Math.max(0, m.index - 40), m.index + 30) : "");
      await c.close();
    });

    await bloc("E1. anglais", async () => {
      /* mêmes clés, même ordre, même forme en français et en anglais ; chaque texte différent a sa traduction exacte */
      const k = 50, ID = PID(k), db = base({ comptes: [prospectE(k)] });
      avecEn(db, ID);
      const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { langue: "en" });
      const forme = await page.evaluate(() => {
        const f = x => Array.isArray(x) ? x.map(f) : x && typeof x === "object" ? Object.keys(x).map(k => [k, f(x[k])]) : typeof x;
        const paires = [], z = (a, b) => { if (typeof a === "string") paires.push([a, b]); else if (a && typeof a === "object") Object.keys(a).forEach(k => z(a[k], b && b[k])); };
        z(DECOUVERTE.echantillons, DECOUVERTE.en.echantillons);
        return { meme: !!DECOUVERTE.echantillons && typeof DECOUVERTE.echantillons === "object" && JSON.stringify(f(DECOUVERTE.echantillons)) === JSON.stringify(f(DECOUVERTE.en.echantillons)), paires: paires.length, manque: paires.filter(([fr, en]) => fr !== en && trad(fr) !== en).map(p => p.join(" → ")) };
      });
      ok("DECOUVERTE.en.echantillons : même forme et même ordre que le français ; en anglais, chaque texte a sa traduction exacte", forme.meme && forme.paires > 30 && forme.manque.length === 0, JSON.stringify(forme));
      /* v61 : + les nouveaux textes français (texte de chaque page, bouton, ligne sous le bouton, note AVANTAGES) */
      const FR = ["Exemple", "Tu veux un programme", "Réserver mon bilan", "Réserve ton bilan", "Récupérer mon plan d'action", "15 min avec Lucas", "Avec l'accompagnement", "Cette séance découverte", "Tes séances construites", "Tes repas calculés", "Chaque séance notée", "Ta régularité", "Ta séance découverte", "Une journée type", "Petit-déjeuner", "Séance notée", "Série 1", "poids du corps", "Toutes tes séries", "Ton suivi de la semaine", "Régularité", "Feedback de ton coach", "Belle semaine", "Ta courbe de poids", "Cette fonctionnalité"];
      const attendus = {
        programme: async () => { const s = await page.evaluate(() => { const e = document.querySelector("#ech-programme"); return e ? [(e.querySelector("h2") || {}).textContent, [...e.querySelectorAll("p.note")].map(p => p.textContent).join(" | "), [...e.querySelectorAll(".ch-exos b")].map(x => x.textContent).join(",")] : []; }); return s[0] === "Your discovery workout" && (s[1] || "").includes("2 rounds (your level: Beginner)") && s[2] === "Squats,Push-ups,Reverse lunges,Glute bridge,Plank" ? "" : JSON.stringify(s); },
        nutrition: async () => { await page.waitForSelector("#ech-repas details", { timeout: 10000 }).catch(() => {}); const h = await texte(page, "#ech-nutrition h2"), vus = await journeeVue(page), att = journeeAttendue(await page.evaluate(() => CONFIG.decouverte.recettes), true); return h === "A sample day of eating" && JSON.stringify(vus.map(x => [x.moment, x.info])) === JSON.stringify(att.map(x => [x.moment, x.info])) ? "" : h + " " + JSON.stringify(vus.map(x => [x.moment, x.info])) + " ≠ " + JSON.stringify(att.map(x => [x.moment, x.info])); },
        journal: async () => { const j = await journalVu(page); const bon = !!j && j.h2 === "Workout A — Full body" && j.pastille === "Workout logged" && j.resume === "4 exercises · 12 sets" && j.exos.map(x => x.nom).join(",") === "Goblet squat,Push-ups,Dumbbell row,Hip thrust" && j.exos[0].series[0] === "Set 1|12 reps|16 kg" && j.exos[1].series[0] === "Set 1|10 reps|bodyweight" && j.exos[3].conseil === "All your sets hit 12 reps: move up to 42.5 kg."; return bon ? "" : JSON.stringify(j); },
        suivi: async () => { const s = await suiviVu(page); const bon = !!s && s.h2 === "Your weekly follow-up" && s.semaine === "Week 5" && JSON.stringify(s.tuiles) === JSON.stringify(["Consistency|86/ 100|this week", "Workouts logged|3/ 3|this week", "Weight|−0.4kg|since last week"]) && s.courbe === "Your weight curve" && s.svg && s.svg.label === "Weight over 5 weeks: from 82.0 kg to 80.4 kg." && ["W1", "W5", "82.0", "80.4"].every(x => s.svg.textes.includes(x)) && s.titreMsg === "Your coach's feedback" && s.msg === "Great week: 3 workouts out of 3 and 400 g down on the scale. We keep the same plan. This week, add a 10-minute walk after dinner."; return bon ? "" : JSON.stringify(s); }
      };
      for (const id of ["programme", "nutrition", "journal", "suivi"]) {
        await aller(page, "#/" + id, 1800);
        const pb = await attendus[id]();
        const v = await vueVerrou(page, id);
        /* l'exemple et l'appel (les recettes du catalogue — noms, ingrédients, étapes — restent telles que le catalogue les donne) */
        const t = await page.evaluate(() => [...document.querySelectorAll("#vue .echantillon, #vue .ech-appel")].map(x => { const e = x.cloneNode(true); e.querySelectorAll("#ech-repas details .ingr, #ech-repas details .etapes, #ech-repas summary b").forEach(y => y.remove()); return e.textContent; }).join(" ")).then(norm);
        const tout = await texte(page, "#vue"), fr = FR.filter(x => t.includes(x)), m = PRIX.exec(tout);
        ok(`anglais, #/${id} : « ${EX.marque_en} », l'exemple en anglais, « ${EX.appels_en[id].slice(0, 40)}… », « Get my action plan », « 15 min with Lucas · free », la note « ${TXD.av_en[id]} », aucun texte français de l'exemple ni de l'appel, aucun prix`, marqueOk(v, true) && appelOk(v, id, true) && !pb && fr.length === 0 && !m, pb + " · " + JSON.stringify(fr) + " · " + JSON.stringify([v.marque, v.label, v.appel, v.lien && v.lien.t, v.sous, v.plus]) + (m ? " · prix : " + tout.slice(Math.max(0, m.index - 40), m.index + 30) : ""));
      }
      await c.close();
    });

    await bloc("E1. autres pages verrouillées, client, coach", async () => {
      /* les pages verrouillées sans exemple (compléments, bilan du mois) : inchangées */
      const k = 51, ID = PID(k), db = base({ comptes: [prospectE(k)] });
      const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead");
      const vus = [];
      /* v61 (brief V2, G et F) : texte inchangé ; même bouton « Récupérer mon plan d'action » et même ligne que les autres pages,
         origines verrou_complements / verrou_bilan (lien et clic compté) */
      for (const id of ["complements", "bilan"]) {
        await aller(page, "#/" + id, 1400); const v = await vueVerrou(page, id);
        await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 2200);
        vus.push([id, !!(await page.$("#vue .echantillon")), v.appel, v.nLiens, v.lien && v.lien.href === v.attendu, lienPre(v, k, id), v.lien && v.lien.t, v.sous, v.sousApres]);
      }
      const clV = clicsDe(db, ID).map(x => x.source);
      ok(`prospect, #/complements et #/bilan (sans exemple) : texte inchangé (« ${EX.ancien} »), « Récupérer mon plan d'action » (Calendly pré-rempli exact, verrou_<id>) puis « 15 min avec Lucas · offert », clic compté (verrou_complements, verrou_bilan)`, vus.every(([, e, a, n, l, pb, t, so, apres]) => !e && a === EX.ancien && n === 1 && l && !pb && t === TX.reserver && so === TX.cta_sous && apres) && JSON.stringify(clV) === '["verrou_complements","verrou_bilan"]', JSON.stringify(vus) + " · " + JSON.stringify(clV));
      await c.close();
      /* client Thomas : ses vraies pages, jamais d'exemple ni de verrou */
      const db2 = base();
      const t = await contexte(b, THOMAS, db2);
      await t.page.goto(URL0); await pret(t.page, "#acc-vue");
      const vt = [];
      for (const h of ["#/programme", "#/nutrition", "#/suivi"]) { await aller(t.page, h, 1600); vt.push([h, !!(await t.page.$("#vue .echantillon, #vue .verrou, #vue .ech-marque"))]); }
      const vide = await t.page.evaluate(() => ["programme", "nutrition", "journal", "suivi"].map(id => Echantillons.html(id)).join(""));
      ok("client Thomas : #/programme, #/nutrition, #/suivi sans exemple ni verrou (Echantillons.html rend « » pour un client), aucune écriture", vt.every(x => !x[1]) && vide === "" && db2.ecritures.length === 0, JSON.stringify(vt) + " · " + vide.slice(0, 80) + " · " + resume(db2));
      /* le coach dans la fiche d'un prospect : ses pages, sans exemple ni verrou */
      const k3 = 52, ID3 = PID(k3), db3 = base({ comptes: [prospectE(k3)] });
      const co = await contexte(b, COACH, db3);
      await co.page.goto(URL0 + "#/clients"); await pret(co.page, `[data-ouvrir="${ID3}"]`);
      await co.page.click(`[data-ouvrir="${ID3}"]`); await co.page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(co.page, 600);
      const vc = [];
      for (const h of ["#/programme", "#/nutrition", "#/suivi"]) { await aller(co.page, h, 1600); vc.push([h, await co.page.evaluate(() => Store.idConsulte), !!(await co.page.$("#vue .echantillon, #vue .verrou, #vue .ech-marque"))]); }
      const videC = await co.page.evaluate(() => ["programme", "nutrition", "journal", "suivi"].map(id => Echantillons.html(id)).join(""));
      ok("coach dans la fiche du prospect : #/programme, #/nutrition, #/suivi sans exemple ni verrou (Echantillons.html rend « » en consultation), aucune écriture", vc.every(x => x[1] === ID3 && !x[2]) && videC === "" && db3.ecritures.length === 0, JSON.stringify(vc) + " · " + resume(db3));
    });
  }

  /* =================== P. objectif d'un ancien client (correction après la relecture de la v52) ===================
     Un vrai client repassé prospect par le coach (intake.complet, objectif choisi dans son questionnaire) répond aux 3
     questions : son objectif ne doit jamais être remplacé par celui déduit de la réponse « problème ». Et pour un nouveau
     prospect, l'objectif posé par l'app suit sa réponse (marqueur intake.objectif_auto). Sur 13954f8 : P1 et P2 échouent. */
  await bloc("P1. ex-client repassé prospect, brouillon", async () => {
    const k = 91, ID = PID(k), I0 = clone(INTAKE_THOMAS);
    const db = base({ comptes: [compte(k, "Thomas", "Démo", [["intake", I0]], { cree: avant(90 * J) })] });
    const { c, page } = await ouvrir(b, db, k, "#/decouverte", "#q-probleme");
    await choisir(page, "probleme", "Perdre du gras"); await attendre(page, 1500);
    const I1 = clone(intakeDe(db, ID)) || {};
    await choisir(page, "probleme", "Prendre du muscle"); await attendre(page, 1500);
    const I2 = clone(intakeDe(db, ID)) || {};
    ok("P1 : objectif de l'ex-client (" + I0.objectif + ") gardé après le 1er choix", I1.objectif === I0.objectif, JSON.stringify({ o1: I1.objectif }));
    ok("P1 : objectif de l'ex-client gardé après un changement de la réponse « problème »", I2.objectif === I0.objectif, JSON.stringify({ o2: I2.objectif, probleme: I2.probleme }));
    await c.close();
  });
  await bloc("P2. ex-client repassé prospect, validation puis modification", async () => {
    const k = 92, ID = PID(k), I0 = Object.assign(clone(INTAKE_THOMAS), { objectif: "Prise de muscle" });
    const db = base({ comptes: [compte(k, "Thomas", "Démo", [["intake", I0]], { cree: avant(90 * J) })] });
    const { c, page } = await ouvrir(b, db, k, "#/decouverte", "#q-probleme");
    await choisir(page, "probleme", "Prendre du muscle"); await page.fill("#q-obstacle-precision", "Le temps"); await choisir(page, "projection", "routine");
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I1 = clone(intakeDe(db, ID)) || {};
    await aller(page, "#/decouverte/reponses", 1500);
    await choisir(page, "probleme", "Perdre du gras"); await page.click("#dc-voir"); await attendre(page, 1600);
    const I2 = clone(intakeDe(db, ID)) || {};
    ok("P2 : après validation, objectif de l'ex-client gardé", I1.objectif === I0.objectif, I1.objectif);
    ok("P2 : après modification de « problème », objectif de l'ex-client gardé", I2.objectif === I0.objectif, JSON.stringify({ o2: I2.objectif, complet: I2.complet }));
    await c.close();
  });
  await bloc("P3. nouveau prospect : l'objectif posé par l'app suit sa réponse", async () => {
    const k = 93, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [], { cree: avant(2 * J) })] });
    const { c, page } = await ouvrir(b, db, k, "#/decouverte", "#q-probleme");
    await choisir(page, "probleme", "Perdre du gras"); await attendre(page, 1500);
    const I1 = clone(intakeDe(db, ID)) || {};
    await choisir(page, "probleme", "Prendre du muscle"); await attendre(page, 1500);
    const I2 = clone(intakeDe(db, ID)) || {};
    ok("P3 : objectif posé depuis « Perdre du gras », avec le marqueur objectif_auto", I1.objectif === "Perte de poids / sèche" && I1.objectif_auto === I1.objectif, JSON.stringify({ o: I1.objectif, a: I1.objectif_auto }));
    ok("P3 : l'objectif posé par l'app suit le changement de réponse (« Prise de muscle »)", I2.objectif === "Prise de muscle" && I2.objectif_auto === "Prise de muscle", JSON.stringify({ o: I2.objectif, a: I2.objectif_auto }));
    await c.close();
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    /* v52 (lot D) : la Speed Formation, ouverte au prospect, montre les vignettes de ses vidéos (img.youtube.com, bloquées ici) */
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase, les polices et les vignettes des vidéos de la Speed Formation (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
