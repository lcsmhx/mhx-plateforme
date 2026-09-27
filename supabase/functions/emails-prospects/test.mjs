/* Tests de la logique des emails de suivi (sans réseau : Supabase et Brevo simulés en mémoire).
   Usage : node supabase/functions/emails-prospects/test.mjs      (Node 18 ou plus) */
import * as L from "./logique.js";

const res = [];
const ok = (nom, cond, detail) => res.push((cond ? "  ✓ " : "  ✗ ") + nom + (cond ? "" : "  — " + (detail === undefined ? "" : typeof detail === "string" ? detail : JSON.stringify(detail))));
const H = 3600000, J = 24 * H;
const MAINTENANT = new Date("2026-10-05T10:00:00Z");
const il = ms => new Date(MAINTENANT.getTime() - ms).toISOString();

const ENV = {
  SUPABASE_URL: "https://projet.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "cle-service-test",
  BREVO_API_KEY: "cle-brevo-test", EXPEDITEUR_EMAIL: "mhx.coaching@gmail.com", EXPEDITEUR_NOM: "MHX Coaching",
  APP_URL: "https://lcsmhx.github.io/mhx-plateforme/", FONCTION_URL: "https://projet.supabase.co/functions/v1/emails-prospects",
  DESINSCRIPTION_SECRET: "secret-de-desinscription-assez-long", CRON_SECRET: "cron", SIGNATAIRE: "Lucas", CONTACT: "mhx.coaching@gmail.com"
};

/* ---------- faux Supabase + faux Brevo ---------- */
function monde(o) {
  o = o || {};
  const db = { profils: [], users: [], donnees: [], journal: [], brevo: [], brevoPanne: o.brevoPanne || 0, brevoToujoursEnPanne: !!o.brevoToujoursEnPanne, brevoRefuse: new Set(o.brevoRefuse || []), brevoAppels: 0, patchPanne: o.patchPanne || 0, brevoStatut: o.brevoStatut || 0, brevoExpire: !!o.brevoExpire, requetes: [] };
  let seq = 1;
  const rep = (corps, statut) => ({ ok: (statut || 200) < 400, status: statut || 200, text: async () => corps == null ? "" : JSON.stringify(corps) });
  const filtrer = (lignes, q) => lignes.filter(l => {
    for (const [k, v] of q) {
      if (["select", "on_conflict"].includes(k)) continue;
      if (v.startsWith("eq.")) { if (String(l[k]) !== decodeURIComponent(v.slice(3))) return false; }
      else if (v.startsWith("in.(")) { if (!v.slice(4, -1).split(",").includes(String(l[k]))) return false; }
      else if (v === "is.null") { if (l[k] != null) return false; }
    }
    return true;
  });
  const fetch = async (url, init) => {
    init = init || {};
    const u = new URL(url), m = (init.method || "GET").toUpperCase(), h = init.headers || {};
    db.requetes.push(m + " " + u.pathname + u.search);
    if (u.hostname === "api.brevo.com") {
      db.brevoAppels++;
      if (h["api-key"] !== ENV.BREVO_API_KEY) return rep({ code: "unauthorized", message: "Key not found" }, 401);
      if (db.brevoToujoursEnPanne || db.brevoPanne > 0) { db.brevoPanne--; return rep({ message: "service indisponible" }, 503); }
      if (db.brevoStatut) { const st = db.brevoStatut; if (db.brevoStatutUneFois) db.brevoStatut = 0; if (db.brevoHtml) return { ok: false, status: st, text: async () => "<html><body>503 Service Temporarily Unavailable</body></html>" }; return rep({ code: st === 402 ? "not_enough_credits" : "erreur", message: st === 402 ? "Not enough credits" : "gateway timeout" }, st); }
      const corps = JSON.parse(init.body); const id = "<msg-" + (seq++) + "@brevo>";
      /* Brevo prend l'email, mais la réponse n'arrive jamais (délai dépassé) */
      if (db.brevoExpire) { db.brevo.push(Object.assign({ id }, corps)); throw Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }); }
      if (db.brevoRefuse.has(corps.to[0].email)) return rep({ code: "invalid_parameter", message: "email is not valid in to" }, 400);
      db.brevo.push(Object.assign({ id }, corps)); return rep({ messageId: id }, 201);
    }
    if (h.Authorization !== "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY) return rep({ message: "clé de service attendue" }, 401);
    const q = [...u.searchParams.entries()];
    if (u.pathname === "/auth/v1/admin/users") { const page = +u.searchParams.get("page"); return rep({ users: page === 1 ? db.users : [] }); }
    if (u.pathname === "/rest/v1/profils") return rep(filtrer(db.profils, q));
    if (u.pathname === "/rest/v1/donnees") {
      if (m === "GET") return rep(filtrer(db.donnees, q));
      if (m === "POST") { for (const r of JSON.parse(init.body)) { const i = db.donnees.findIndex(x => x.user_id === r.user_id && x.outil === r.outil); if (i > -1) db.donnees[i] = r; else db.donnees.push(r); } return rep(null, 201); }
    }
    if (u.pathname === "/rest/v1/emails_prospects") {
      if (m === "GET") return rep(filtrer(db.journal, q));
      const pref = String(h.Prefer || "");
      if (m === "POST") {
        const out = [];
        for (const r of JSON.parse(init.body)) {
          const ex = db.journal.find(x => x.user_id === r.user_id && x.modele === r.modele);
          if (ex) { if (pref.includes("merge-duplicates")) { Object.assign(ex, r); out.push(ex); } continue; }   // ignore-duplicates : rien
          const l = Object.assign({ id: seq++, tentatives: 0, message_id: null, envoye_le: null, ouvert_le: null, clique_le: null }, r); db.journal.push(l); out.push(l);
        }
        return rep(pref.includes("return=representation") ? out : null, 201);
      }
      if (m === "PATCH") { const b = JSON.parse(init.body); if (b.statut === "envoye" && db.patchPanne > 0) { db.patchPanne--; return rep({ message: "timeout" }, 504); } const cible = filtrer(db.journal, q); cible.forEach(x => Object.assign(x, b)); return rep(pref.includes("return=representation") ? cible : null, 200); }
    }
    return rep({ message: "inconnu " + u.pathname }, 404);
  };
  return { db, fetch };
}
function prospect(db, id, o) {
  o = o || {};
  const cree = il(o.inscritIl != null ? o.inscritIl : 2 * H);
  db.profils.push({ id, prenom: o.prenom === undefined ? "Léa" : o.prenom, cree_le: cree, statut: o.statut || "prospect" });
  db.users.push({ id, email: o.email === undefined ? id + "@exemple.fr" : o.email, email_confirmed_at: o.confirme === false ? null : cree, created_at: cree,
                  user_metadata: { prenom: o.prenom || "Léa", emails_suivi: o.accord === false ? null : cree } });
  if (o.intake) db.donnees.push({ user_id: id, outil: "intake", contenu: o.intake });
  if (o.challenge) db.donnees.push({ user_id: id, outil: "challenge", contenu: o.challenge });
  if (o.emails) db.donnees.push({ user_id: id, outil: "emails", contenu: o.emails });
  if (o.activite) db.donnees.push({ user_id: id, outil: "activite", contenu: o.activite });
  if (o.suivi) db.donnees.push({ user_id: id, outil: "suivi_prospect", contenu: o.suivi });
}
const passe = (w, maintenant, regles) => L.executer({ fetch: w.fetch, env: ENV, maintenant: maintenant || MAINTENANT, regles });

/* ---------- 1. qui reçoit quoi ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "a-bienvenue");
  prospect(db, "b-sans-accord", { accord: false });
  prospect(db, "c-non-confirme", { confirme: false });
  prospect(db, "d-email-invalide", { email: "pas-un-email" });
  prospect(db, "e-client", { statut: "client" });
  prospect(db, "f-reserve", { challenge: { cta: { clics: [{ date: il(H) }] }, reserve: il(H) } });
  prospect(db, "g-ancien", { inscritIl: 9 * J });
  prospect(db, "h-signe", { suivi: { issue: "signe" } });
  prospect(db, "i-desinscrit-profil", { emails: { suivi: false } });
  prospect(db, "j-accord-profil", { accord: false, emails: { suivi: true } });
  prospect(db, "k-ancien-challenge-reserve", { challenge: { jours: { "7": { fait: il(H), reserve: il(H) } } } });
  const b = await passe(w);
  const pour = id => db.brevo.filter(x => x.to[0].email === id + "@exemple.fr");
  ok("bienvenue envoyé au prospect confirmé qui l'a accepté", pour("a-bienvenue").length === 1, b);
  ok("rien sans accord (case de l'inscription non cochée)", pour("b-sans-accord").length === 0);
  ok("rien si l'email n'est pas confirmé", pour("c-non-confirme").length === 0);
  ok("rien si l'adresse n'a pas la forme d'un email", db.brevo.every(x => x.to[0].email !== "pas-un-email"));
  ok("rien pour un client", pour("e-client").length === 0 && !db.requetes.some(r => r.includes("statut=eq.client")));
  ok("rien après une réservation de bilan (case « J'ai réservé »)", pour("f-reserve").length === 0);
  ok("rien pour un compte créé il y a plus de 8 jours (pas d'envoi aux anciens comptes au déploiement)", pour("g-ancien").length === 0);
  ok("rien après une issue « Signé »", pour("h-signe").length === 0);
  ok("l'interrupteur du Profil (non) l'emporte sur la case de l'inscription", pour("i-desinscrit-profil").length === 0);
  ok("l'interrupteur du Profil (oui) suffit sans la case de l'inscription", pour("j-accord-profil").length === 1);
  ok("ancien prospect du challenge avec la case du jour 7 : rien", pour("k-ancien-challenge-reserve").length === 0);
  ok("bilan du passage : 2 envoyés, aucun échec", b.envoyes === 2 && b.echecs === 0 && b.abandons === 0, b);
  ok("journal : une ligne « envoye » par email, avec l'identifiant Brevo", db.journal.length === 2 && db.journal.every(l => l.statut === "envoye" && /^<msg-/.test(l.message_id) && l.envoye_le), db.journal);
  const b2 = await passe(w);
  ok("deuxième passage juste après : rien de plus (un email n'est envoyé qu'une fois)", b2.envoyes === 0 && db.brevo.length === 2, b2);
}

/* ---------- 2. le parcours du brief : bienvenue → ton résultat (questionnaire rempli) → relance J3 ---------- */
const plus = ms => new Date(MAINTENANT.getTime() + ms);
const remplir = (db, id, quand) => { const iso = quand.toISOString(); const x = db.donnees.find(d => d.user_id === id && d.outil === "intake"); if (x) Object.assign(x.contenu, { court_le: iso, court_debut: iso }); else db.donnees.push({ user_id: id, outil: "intake", contenu: { court_le: iso, court_debut: iso } }); };
{
  const w = monde(); const db = w.db;
  prospect(db, "p1", { inscritIl: 2 * H });
  const m = () => db.brevo.filter(x => x.to[0].email === "p1@exemple.fr").map(x => x.tags[1]);
  await passe(w, plus(0));
  ok("J0, email confirmé, questionnaire pas encore rempli : bienvenue « commence par ton questionnaire »", JSON.stringify(m()) === '["mhx-bienvenue"]' && /Commence par ton questionnaire/.test(db.brevo[0].textContent) && /Commencer mon questionnaire/.test(db.brevo[0].htmlContent), m());
  remplir(db, "p1", plus(30 * 60000));
  await passe(w, plus(H));
  ok("questionnaire rempli 30 min après : « ton résultat est prêt » au passage suivant (1 h après la bienvenue : l'écart de 20 h ne vaut pas pour une réponse à son action)", JSON.stringify(m()) === '["mhx-bienvenue","mhx-resultat"]' && db.brevo[1].subject === "Léa, ton résultat est prêt", db.brevo.map(x => x.subject));
  ok("email « ton résultat » : aucun chiffre de santé (ni kcal, ni kg, ni poids), renvoie vers l'app", !/kcal|\bkg\b|poids|\d{3,4} ?cal/i.test(db.brevo[1].textContent + db.brevo[1].htmlContent) && db.brevo[1].htmlContent.includes(ENV.APP_URL), db.brevo[1].textContent);
  await passe(w, plus(2 * H));
  await passe(w, plus(2 * J));
  ok("ensuite, tant qu'il n'est pas inactif depuis 3 jours : rien", m().length === 2, m());
  await passe(w, plus(3 * J + 2 * H));
  ok("3 jours sans action après le questionnaire : relance « tu as oublié de regarder ton résultat ? »", m()[2] === "mhx-relance" && /regarder ton résultat/.test(db.brevo[2].subject), db.brevo.map(x => x.subject));
  await passe(w, plus(6 * J));
  ok("ensuite plus rien : 3 emails au plus", m().length === 3, m());
}
{
  const w = monde(); const db = w.db;
  prospect(db, "n1", { inscritIl: 2 * H });
  const m = () => db.brevo.filter(x => x.to[0].email === "n1@exemple.fr").map(x => x.tags[1]);
  await passe(w, plus(0));
  await passe(w, plus(23 * H)); await passe(w, plus(2 * J));
  ok("questionnaire jamais rempli : rien entre la bienvenue et J3 (pas de rappel à part : la relance s'en charge)", JSON.stringify(m()) === '["mhx-bienvenue"]', m());
  await passe(w, plus(3 * J));
  ok("J3 sans aucune action : relance « ton questionnaire t'attend toujours »", m()[1] === "mhx-relance" && /questionnaire t'attend toujours/.test(db.brevo[1].subject), db.brevo.map(x => x.subject));
  await passe(w, plus(5 * J));
  ok("ensuite plus rien (2 emails pour lui)", m().length === 2, m());
}
{
  const w = monde(); const db = w.db;
  prospect(db, "q1", { inscritIl: 3 * H, intake: { court_le: il(2 * H), court_debut: il(2 * H) } });
  await passe(w, plus(0));
  ok("questionnaire rempli AVANT la bienvenue : bienvenue « ton résultat t'attend » (bouton « Voir mon résultat »)", db.brevo.length === 1 && db.brevo[0].tags[1] === "mhx-bienvenue" && /Ton questionnaire est rempli/.test(db.brevo[0].textContent) && /Voir mon résultat/.test(db.brevo[0].htmlContent), db.brevo.map(x => x.textContent.slice(0, 120)));
  await passe(w, plus(H)); await passe(w, plus(5 * H));
  ok("… et pas d'email « ton résultat » en plus (la bienvenue l'a déjà dit)", db.brevo.length === 1, db.brevo.map(x => x.subject));
}
{
  const w = monde(); const db = w.db;
  prospect(db, "v1", { inscritIl: 5 * J, intake: { court_le: il(3 * J), court_debut: il(3 * J) } });
  db.journal.push({ id: 905, user_id: "v1", modele: "bienvenue", statut: "envoye", tentatives: 1, envoye_le: il(5 * J), maj_le: il(5 * J) });
  await passe(w);
  ok("questionnaire rempli il y a 3 jours (plus de 48 h, par exemple au déploiement) : pas d'email « ton résultat » périmé ; la relance à la place", db.brevo.length === 1 && db.brevo[0].tags[1] === "mhx-relance", db.brevo.map(x => x.tags[1]));
}
{
  const w = monde(); const db = w.db;
  prospect(db, "r1", { inscritIl: 4 * J, activite: { derniere: il(H) } });
  db.journal.push({ id: 901, user_id: "r1", modele: "bienvenue", statut: "envoye", tentatives: 1, envoye_le: il(4 * J), maj_le: il(4 * J) });
  await passe(w);
  ok("actif il y a 1 h (activité dans l'app) : pas de relance", db.brevo.length === 0);
}

{
  /* accord donné tard (ou déploiement) : inscrit depuis 4 jours, questionnaire pas rempli, inactif */
  const w = monde(); const db = w.db;
  prospect(db, "g1", { inscritIl: 4 * J });
  const m = () => db.brevo.filter(x => x.to[0].email === "g1@exemple.fr").map(x => x.tags[1]);
  await passe(w);
  ok("inscrit depuis 4 jours : bienvenue seulement", JSON.stringify(m()) === '["mhx-bienvenue"]', m());
  await passe(w, plus(H));
  await passe(w, plus(2 * H));
  ok("1 h et 2 h plus tard : rien (20 h au moins entre deux emails, même si la relance est déjà due)", m().length === 1, m());
  await passe(w, plus(19 * H));
  ok("19 h plus tard : toujours rien", m().length === 1, m());
  await passe(w, plus(20 * H));
  ok("20 h plus tard : la relance ; 2 emails étalés sur 20 h au lieu de 2 en 1 h", JSON.stringify(m()) === '["mhx-bienvenue","mhx-relance"]', m());
  await passe(w, plus(3 * J));
  ok("ensuite plus rien", m().length === 2, m());
}

/* ---------- 3. échecs, reprises, abandon ---------- */
{
  const w = monde({ brevoPanne: 1 }); const db = w.db;
  prospect(db, "s1"); prospect(db, "s1b");
  const b1 = await passe(w);
  const l1 = db.journal.find(l => l.user_id === "s1");
  ok("Brevo en panne (503) : échec noté sans compter d'essai (tentatives 0), passage arrêté, le 2e prospect reporté sans appel à Brevo", b1.echecs === 1 && l1.statut === "echec" && l1.tentatives === 0 && /503/.test(l1.derniere_erreur) && /503/.test(b1.arret || "") && b1.reportes === 1 && db.brevoAppels === 1 && !db.journal.some(l => l.user_id === "s1b"), { b1, journal: db.journal });
  const b2 = await passe(w, new Date(MAINTENANT.getTime() + H));
  ok("passage suivant : les deux partent (le 1er avec sa tentative 1)", b2.envoyes === 2 && db.journal.every(l => l.statut === "envoye") && l1.tentatives === 1 && !b2.arret, { b2, journal: db.journal });
}
{
  const w = monde({ brevoToujoursEnPanne: true }); const db = w.db;
  prospect(db, "s2"); prospect(db, "s2b"); prospect(db, "s2c");
  for (let i = 0; i < 6; i++) await passe(w, new Date(MAINTENANT.getTime() + i * H));
  ok("panne de Brevo de 6 heures : aucun essai consommé, jamais d'abandon, un seul appel à Brevo par passage", db.journal.every(l => l.statut === "echec" && l.tentatives === 0) && db.brevoAppels === 6, { journal: db.journal, appels: db.brevoAppels });
  db.brevoToujoursEnPanne = false;
  const b = await passe(w, new Date(MAINTENANT.getTime() + 7 * H));
  ok("Brevo revenu : les 3 bienvenues partent", b.envoyes === 3 && db.brevo.length === 3, b);
}
{
  const w = monde({ brevoRefuse: ["r0@exemple.fr"] }); const db = w.db;
  prospect(db, "r0"); prospect(db, "r0b");
  const b1 = await passe(w);
  ok("adresse refusée par Brevo (400) : l'essai compte, le passage continue (l'autre prospect reçoit son email)", b1.echecs === 1 && b1.envoyes === 1 && !b1.arret && db.journal.find(l => l.user_id === "r0").tentatives === 1, { b1, journal: db.journal });
  for (let i = 1; i < 5; i++) await passe(w, new Date(MAINTENANT.getTime() + i * H));
  const l = db.journal.find(x => x.user_id === "r0");
  ok("3 refus : abandon, plus aucun essai", l.statut === "abandon" && l.tentatives === 3 && db.brevoAppels === 4, { l, appels: db.brevoAppels });
}
{
  const w = monde(); const db = w.db;
  prospect(db, "k1"); prospect(db, "k2");
  const b = await L.executer({ fetch: w.fetch, env: Object.assign({}, ENV, { BREVO_API_KEY: "mauvaise-cle" }), maintenant: MAINTENANT });
  ok("clé Brevo refusée (401) : un réglage, pas l'adresse — aucun essai compté, passage arrêté après un seul appel", /401/.test(b.arret || "") && db.brevoAppels === 1 && db.journal.every(l => l.tentatives === 0), { b, journal: db.journal });
}
{
  /* Brevo prend l'email mais ne répond pas (délai dépassé) : l'essai compte, jamais d'envoi sans fin */
  const w = monde({ brevoExpire: true }); const db = w.db;
  prospect(db, "e1"); prospect(db, "e2");
  const bilans = [];
  for (let i = 0; i < 8; i++) bilans.push(await passe(w, new Date(MAINTENANT.getTime() + i * H)));
  const copies = id => db.brevo.filter(x => x.to[0].email === id + "@exemple.fr").length;
  const l1 = db.journal.find(l => l.user_id === "e1"), l2 = db.journal.find(l => l.user_id === "e2");
  ok("Brevo prend l'email puis délai dépassé : 3 essais au plus par prospect (3 copies au plus, pas une par heure), puis abandon ; « [incertain] » dans le journal", copies("e1") === 3 && copies("e2") === 3 && l1.statut === "abandon" && l1.tentatives === 3 && l2.statut === "abandon" && /^\[incertain\]/.test(l1.derniere_erreur), { e1: copies("e1"), e2: copies("e2"), l1, l2 });
  ok("… chaque passage s'arrête au premier délai dépassé, et le 2e prospect passe dès le 2e passage (les jamais essayés d'abord)", bilans[0].details.length === 1 && bilans[0].details[0].user_id === "e1" && bilans[1].details[0].user_id === "e2" && /incertain/.test(bilans[0].arret || ""), bilans.slice(0, 3).map(b => b.details));
}
{
  const w = monde({ brevoStatut: 504 }); const db = w.db; db.brevoStatutUneFois = true;
  prospect(db, "g504");
  const b1 = await passe(w);
  ok("504 (réponse perdue) : compte comme un essai (tentatives 1, « [incertain] »), passage arrêté", db.journal[0].statut === "echec" && db.journal[0].tentatives === 1 && /^\[incertain\] Brevo 504/.test(db.journal[0].derniere_erreur) && /incertain/.test(b1.arret || ""), { j: db.journal[0], b1 });
  const b2 = await passe(w, new Date(MAINTENANT.getTime() + H));
  ok("… passage suivant : envoyé (tentative 2)", b2.envoyes === 1 && db.journal[0].statut === "envoye" && db.journal[0].tentatives === 2, db.journal[0]);
}
{
  const w = monde({ brevoStatut: 402 }); const db = w.db;
  prospect(db, "q1"); prospect(db, "q2"); prospect(db, "q3");
  for (let i = 0; i < 4; i++) await passe(w, new Date(MAINTENANT.getTime() + i * H));
  ok("crédits Brevo épuisés (402) : aucun essai compté, jamais d'abandon, un seul appel à Brevo par passage", db.journal.every(l => l.statut === "echec" && l.tentatives === 0) && db.brevoAppels === 4, { journal: db.journal, appels: db.brevoAppels });
  db.brevoStatut = 0;
  const b = await passe(w, new Date(MAINTENANT.getTime() + 5 * H));
  ok("… crédits revenus : les 3 emails partent", b.envoyes === 3, b);
}
{
  /* 503 renvoyé par un intermédiaire (page HTML), pas par Brevo : rien ne prouve que l'email n'est pas parti */
  const w = monde({ brevoStatut: 503 }); const db = w.db; db.brevoHtml = true;
  prospect(db, "h503");
  for (let i = 0; i < 5; i++) await passe(w, new Date(MAINTENANT.getTime() + i * H));
  ok("503 sans réponse de Brevo (page HTML d'un intermédiaire) : envoi incertain, compté, abandon au 3e essai (pas d'essais sans fin)", db.journal[0].statut === "abandon" && db.journal[0].tentatives === 3 && db.brevoAppels === 3 && /^\[incertain\] Brevo 503/.test(db.journal[0].derniere_erreur), { j: db.journal[0], appels: db.brevoAppels });
}
for (const [nom, env, attendu] of [["BREVO_API_KEY absente", { BREVO_API_KEY: "" }, /BREVO_API_KEY manquant/], ["secret de désinscription trop court", { DESINSCRIPTION_SECRET: "court-15-caract" }, /DESINSCRIPTION_SECRET trop court/]]) {
  const w = monde(); const db = w.db;
  prospect(db, "k-" + nom.length);
  let msg = ""; try { await L.executer({ fetch: w.fetch, env: Object.assign({}, ENV, env), maintenant: MAINTENANT }); } catch (e) { msg = e.message; }
  ok("réglage manquant (" + nom + ") : arrêt avant toute réservation (aucune ligne du journal, aucun essai usé), message clair", attendu.test(msg) && db.journal.length === 0 && db.brevoAppels === 0, { msg, journal: db.journal });
}
{
  const w = monde({ patchPanne: 2 }); const db = w.db;
  prospect(db, "m1");
  const b = await passe(w);
  ok("journal injoignable juste après l'envoi : réécrit (2 pannes, 3e essai) → « envoye », pas de renvoi une heure plus tard", b.envoyes === 1 && db.journal[0].statut === "envoye" && db.journal[0].message_id, db.journal);
  await passe(w, new Date(MAINTENANT.getTime() + 2 * H));
  ok("… et rien ne repart au passage suivant", db.brevo.length === 1, db.brevo.length);
}
{
  const w = monde(); const db = w.db;
  prospect(db, "s3");
  db.journal.push({ id: 903, user_id: "s3", modele: "bienvenue", statut: "en_cours", tentatives: 1, maj_le: il(10 * 60000) });
  await passe(w);
  ok("« en cours » depuis 10 min (autre passage en train d'envoyer) : on n'y touche pas", db.brevo.length === 0 && db.journal[0].statut === "en_cours");
  db.journal[0].maj_le = il(2 * H);
  await passe(w);
  ok("« en cours » depuis 2 h (fonction interrompue) : repris et envoyé", db.brevo.length === 1 && db.journal[0].statut === "envoye" && db.journal[0].tentatives === 2, db.journal);
}
{
  /* deux passages exactement en même temps : un seul envoi */
  const w = monde(); const db = w.db;
  prospect(db, "t1");
  await Promise.all([passe(w), passe(w)]);
  ok("deux passages simultanés : un seul email (réservation exclusive de la ligne)", db.brevo.length === 1 && db.journal.length === 1, db.brevo.length);
}

{
  const w = monde(); const db = w.db;
  prospect(db, "o0");
  await passe(w);
  const lectures = db.requetes.filter(r => r.startsWith("GET /rest/v1/"));
  ok("chaque lecture paginée porte un ordre stable (order=…) : aucune ligne manquée entre deux pages", lectures.length >= 4 && lectures.every(r => /[?&]order=/.test(r)), lectures);
}

/* ---------- 4. volume ---------- */
{
  const w = monde(); const db = w.db;
  for (let i = 0; i < 70; i++) prospect(db, "v" + i);
  const b = await passe(w);
  ok("au plus 50 emails par passage, le reste est reporté", b.envoyes === 50 && b.reportes === 20, b);
  const b2 = await passe(w, new Date(MAINTENANT.getTime() + H));
  ok("passage suivant : les 20 reportés partent", b2.envoyes === 20, b2);
}
{
  const w = monde(); const db = w.db;
  for (let i = 0; i < 10; i++) prospect(db, "w" + i);
  for (let i = 0; i < 148; i++) db.journal.push({ id: 1000 + i, user_id: "x" + i, modele: "bienvenue", statut: "envoye", tentatives: 1, envoye_le: new Date(Date.UTC(2026, 9, 5, 1)).toISOString(), maj_le: il(H) });
  const b = await passe(w);
  ok("quota du jour (150) : 148 déjà partis aujourd'hui → 2 envoyés, 8 reportés", b.envoyes === 2 && b.reportes === 8, b);
}

/* ---------- 5. contenu des emails ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "c1", { prenom: '<img src=x onerror="alert(1)">Zoé' });
  await passe(w);
  const e = db.brevo[0];
  ok("prénom piégé : échappé dans le HTML (aucune balise injectée)", e && !/<img src=x/.test(e.htmlContent) && /&lt;img/.test(e.htmlContent), e && e.htmlContent.slice(0, 400));
  ok("expéditeur, destinataire, texte brut et étiquettes Brevo présents", e.sender.email === ENV.EXPEDITEUR_EMAIL && e.to[0].email === "c1@exemple.fr" && typeof e.textContent === "string" && e.textContent.length > 50 && e.tags.includes("mhx-suivi"), e);
  ok("aucun en-tête standard ni clé d'idempotence envoyés à Brevo (l'API ne les accepte pas ; Brevo ajoute son propre List-Unsubscribe)", e.headers === undefined, e.headers);
  const page = "https://lcsmhx.github.io/mhx-plateforme/desinscription.html?u=c1&t=";
  ok("lien du corps (HTML et texte) : la page de confirmation desinscription.html (un GET ne désinscrit personne)", e.htmlContent.includes(page.replace("&", "&amp;")) && e.textContent.includes(page) && !e.htmlContent.includes("action=desinscription"), e.textContent.slice(-200));
  ok("bouton vers l'app", e.htmlContent.includes(ENV.APP_URL));
}
{
  const p = { prenom: "Léa", questionnaire: false };
  const cfg = { marque: "MHX Coaching", contact: "mhx.coaching@gmail.com", signataire: "Lucas", lienApp: ENV.APP_URL, lienDesinscription: "https://x/?d" };
  const tous = [L.contenu("bienvenue", p, cfg), L.contenu("resultat", p, cfg), L.contenu("relance", p, cfg), L.contenu("relance", { prenom: "", questionnaire: true }, cfg), L.contenu("bienvenue", { prenom: "Léa", questionnaire: true }, cfg)];
  const texte = tous.map(m => m.sujet + " " + m.html + " " + m.texte).join(" ");
  ok("aucun prix, tarif, abonnement ni montant dans les 5 emails (dont les 2 variantes de la bienvenue)", !/€|\beuros?\b|tarif|abonnement|prix|\/mois|paiement/i.test(texte));
  ok("aucune mention du Challenge ni de Notion (abandonnés)", !/challenge|notion/i.test(texte));
  ok("sujets attendus", tous[0].sujet === "Léa, ta découverte MHX Coaching commence" && tous[1].sujet === "Léa, ton résultat est prêt" && tous[2].sujet === "Léa, ton questionnaire t'attend toujours" && tous[3].sujet === "Bonjour, tu as oublié de regarder ton résultat ?", tous.map(m => m.sujet));
}

/* ---------- 6. désinscription ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "u1");
  const t = await L.signer("u1", ENV.DESINSCRIPTION_SECRET);
  ok("signature : 64 caractères hexadécimaux, stable", /^[0-9a-f]{64}$/.test(t) && t === await L.signer("u1", ENV.DESINSCRIPTION_SECRET));
  ok("signature d'un autre compte refusée", !(await L.verifier("u2", t, ENV.DESINSCRIPTION_SECRET)));
  ok("signature modifiée refusée", !(await L.verifier("u1", t.slice(0, 63) + (t[63] === "a" ? "b" : "a"), ENV.DESINSCRIPTION_SECRET)));
  ok("jeton mal formé refusé", !(await L.verifier("u1", "abc", ENV.DESINSCRIPTION_SECRET)) && !(await L.verifier("u1", null, ENV.DESINSCRIPTION_SECRET)));
  let secretCourt = false; try { await L.signer("u1", "court"); } catch (e) { secretCourt = true; }
  ok("un secret trop court est refusé (jamais de signature faible)", secretCourt);
  const r1 = await L.desinscrire({ fetch: w.fetch, env: ENV, uid: "u1", jeton: "0".repeat(64), maintenant: MAINTENANT });
  ok("lien falsifié : refusé, rien d'écrit", r1.ok === false && !db.donnees.some(d => d.outil === "emails"));
  const r2 = await L.desinscrire({ fetch: w.fetch, env: ENV, uid: "u1", jeton: t, maintenant: MAINTENANT });
  const e = db.donnees.find(d => d.user_id === "u1" && d.outil === "emails");
  ok("lien valide : clé « emails » = { suivi: false } (celle que lit aussi l'interrupteur du Profil)", r2.ok && e && e.contenu.suivi === false && e.contenu.source === "lien-email", e);
  const b = await passe(w);
  ok("après désinscription : plus aucun email", b.envoyes === 0 && db.brevo.length === 0, b);
  ok("lien de la page de confirmation : APP_URL (avec ou sans / final) + desinscription.html, paramètres encodés", L.lienPageDesinscription("https://a.io/app", "u 1", t) === "https://a.io/app/desinscription.html?u=u%201&t=" + t && L.lienPageDesinscription("https://a.io/app/", "u1", t) === "https://a.io/app/desinscription.html?u=u1&t=" + t);
}

/* ---------- 7. ouvertures et clics (webhook Brevo) ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "o1");
  await passe(w);
  const id = db.journal[0].message_id;
  await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: { event: "opened", "message-id": id, date: "2026-10-05 12:00:00", ts_event: Math.floor(Date.parse("2026-10-05T09:30:00Z") / 1000) }, maintenant: MAINTENANT });
  ok("ouverture : ouvert_le noté à l'heure de ts_event (UTC), pas à celle du champ « date » (heure du compte Brevo, sans fuseau)", db.journal[0].ouvert_le === "2026-10-05T09:30:00.000Z", db.journal[0]);
  const premiere = db.journal[0].ouvert_le;
  await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: [{ event: "unique_opened", "message-id": id }, { event: "click", "message-id": id }, { event: "delivered", "message-id": id }, { event: "opened" }], maintenant: new Date(MAINTENANT.getTime() + H) });
  ok("seule la première ouverture compte ; clic noté ; autres événements et événement sans identifiant ignorés", db.journal[0].ouvert_le === premiere && db.journal[0].clique_le != null, db.journal[0]);
}
{
  const w = monde(); const db = w.db;
  prospect(db, "o2");
  await passe(w);
  const id = db.journal[0].message_id;
  await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: { event: "click", "message-id": id, link: "https://lcsmhx.github.io/mhx-plateforme/desinscription.html?u=o2&t=abc" }, maintenant: MAINTENANT });
  ok("clic sur « Ne plus recevoir ces emails » : pas noté « lien cliqué »", db.journal[0].clique_le == null, db.journal[0]);
}
for (const ev of ["unsubscribed", "spam", "hard_bounce", "blocked"]) {
  const w = monde(); const db = w.db;
  prospect(db, "x-" + ev, { inscritIl: 30 * H });
  await passe(w);
  const id = db.journal[0].message_id;
  const r = await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: { event: ev, "message-id": id, email: "x-" + ev + "@exemple.fr", ts_event: Math.floor(MAINTENANT.getTime() / 1000) }, maintenant: MAINTENANT });
  const e = db.donnees.find(d => d.user_id === "x-" + ev && d.outil === "emails");
  const b = await passe(w, new Date(MAINTENANT.getTime() + 2 * J));
  ok("événement Brevo « " + ev + " » : emails de suivi coupés (clé « emails » = { suivi: false }), plus rien ensuite", r.coupes === 1 && e && e.contenu.suivi === false && e.contenu.source === "brevo-" + ev && b.envoyes === 0 && db.brevo.length === 1, { r, e, b });
  const nonDelivre = ev === "hard_bounce" || ev === "blocked";
  ok("… journal : " + (nonDelivre ? "l'email passe « abandon » (« Non délivré : " + ev + " »), jamais délivré" : "l'email reste « envoye » (il a bien été reçu)"), nonDelivre ? (db.journal[0].statut === "abandon" && /^Non délivré : /.test(db.journal[0].derniere_erreur)) : db.journal[0].statut === "envoye", db.journal[0]);
}

/* ---------- 8. configuration manquante ---------- */
{
  const w = monde();
  let msg = ""; try { await L.executer({ fetch: w.fetch, env: Object.assign({}, ENV, { DESINSCRIPTION_SECRET: "" }), maintenant: MAINTENANT }); } catch (e) { msg = e.message; }
  ok("secret manquant : le passage s'arrête avant tout envoi, message clair", /DESINSCRIPTION_SECRET manquant/.test(msg) && w.db.brevo.length === 0, msg);
  let msg2 = ""; try { await L.executer({ fetch: w.fetch, env: Object.assign({}, ENV, { SUPABASE_SERVICE_ROLE_KEY: "" }), maintenant: MAINTENANT }); } catch (e) { msg2 = e.message; }
  ok("clé de service manquante : arrêt, message clair", /SERVICE_ROLE_KEY manquant/.test(msg2), msg2);
}

/* ---------- 9. valeurs piégées dans les données du prospect ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "z1", { intake: { court_le: { x: 1 } }, challenge: { cta: "x", reserve: 5, jours: [] }, emails: { suivi: "oui" }, activite: { derniere: 12 } });
  let erreur = null; try { await passe(w); } catch (e) { erreur = e.message; }
  ok("données piégées (types faux) : pas d'erreur, traitées comme absentes (bienvenue envoyé, accord de l'inscription)", !erreur && db.brevo.length === 1, erreur || db.brevo.length);
}

const echecs = res.filter(l => l.startsWith("  ✗")).length;
console.log(res.join("\n"));
console.log("\n" + (res.length - echecs) + "/" + res.length + " vérifications" + (echecs ? " — " + echecs + " ÉCHEC(S)" : ""));
process.exit(echecs ? 1 : 0);
