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
  const db = { profils: [], users: [], donnees: [], journal: [], brevo: [], brevoPanne: o.brevoPanne || 0, brevoToujoursEnPanne: !!o.brevoToujoursEnPanne, requetes: [] };
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
      if (h["api-key"] !== ENV.BREVO_API_KEY) return rep({ code: "unauthorized" }, 401);
      if (db.brevoToujoursEnPanne || db.brevoPanne > 0) { db.brevoPanne--; return rep({ message: "service indisponible" }, 503); }
      const corps = JSON.parse(init.body); const id = "<msg-" + (seq++) + "@brevo>";
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
      if (m === "PATCH") { const cible = filtrer(db.journal, q); const b = JSON.parse(init.body); cible.forEach(x => Object.assign(x, b)); return rep(pref.includes("return=representation") ? cible : null, 200); }
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

/* ---------- 2. l'enchaînement bienvenue → questionnaire → relance ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "p1", { inscritIl: 2 * H });
  await passe(w, new Date(MAINTENANT.getTime()));
  const m = () => db.brevo.filter(x => x.to[0].email === "p1@exemple.fr").map(x => x.tags[1]);
  ok("J0 : bienvenue", JSON.stringify(m()) === '["mhx-bienvenue"]', m());
  await passe(w, new Date(MAINTENANT.getTime() + 20 * H));
  ok("J0 + 22 h : rien (le rappel attend 24 h)", m().length === 1, m());
  await passe(w, new Date(MAINTENANT.getTime() + 23 * H));
  ok("J1 sans questionnaire : rappel du questionnaire", JSON.stringify(m()) === '["mhx-bienvenue","mhx-questionnaire"]', m());
  await passe(w, new Date(MAINTENANT.getTime() + 2 * J));
  ok("J2 : rien", m().length === 2, m());
  await passe(w, new Date(MAINTENANT.getTime() + 3 * J));
  ok("J3 sans aucune action depuis 3 jours : relance (variante questionnaire)", m()[2] === "mhx-relance" && /questionnaire t'attend/.test(db.brevo[2].subject), db.brevo.map(x => x.subject));
  await passe(w, new Date(MAINTENANT.getTime() + 4 * J));
  ok("ensuite plus rien : 3 emails au plus", m().length === 3, m());
}
{
  const w = monde(); const db = w.db;
  prospect(db, "q1", { inscritIl: 30 * H, intake: { court_le: il(29 * H), court_debut: il(29 * H) } });
  db.journal.push({ id: 900, user_id: "q1", modele: "bienvenue", statut: "envoye", tentatives: 1, envoye_le: il(29 * H), maj_le: il(29 * H) });
  await passe(w);
  ok("questionnaire déjà rempli : pas de rappel du questionnaire", db.brevo.length === 0, db.brevo.map(x => x.subject));
  await passe(w, new Date(MAINTENANT.getTime() + 2 * J));
  ok("J3, questionnaire rempli, inactif depuis 3 jours : relance « tu as oublié de regarder ton résultat ? »", db.brevo.length === 1 && /regarder ton résultat/.test(db.brevo[0].subject), db.brevo.map(x => x.subject));
}
{
  const w = monde(); const db = w.db;
  prospect(db, "r1", { inscritIl: 4 * J, activite: { derniere: il(H) } });
  db.journal.push({ id: 901, user_id: "r1", modele: "bienvenue", statut: "envoye", tentatives: 1, envoye_le: il(4 * J), maj_le: il(4 * J) });
  db.journal.push({ id: 902, user_id: "r1", modele: "questionnaire", statut: "envoye", tentatives: 1, envoye_le: il(3 * J), maj_le: il(3 * J) });
  await passe(w);
  ok("actif il y a 1 h (activité dans l'app) : pas de relance", db.brevo.length === 0);
}

/* ---------- 3. échecs, reprises, abandon ---------- */
{
  const w = monde({ brevoPanne: 1 }); const db = w.db;
  prospect(db, "s1");
  const b1 = await passe(w);
  ok("Brevo en panne : échec noté (tentative 1), rien d'envoyé", b1.echecs === 1 && db.journal[0].statut === "echec" && db.journal[0].tentatives === 1 && /503/.test(db.journal[0].derniere_erreur), db.journal);
  const b2 = await passe(w, new Date(MAINTENANT.getTime() + H));
  ok("passage suivant : nouvel essai, envoyé (tentative 2)", b2.envoyes === 1 && db.journal[0].statut === "envoye" && db.journal[0].tentatives === 2, db.journal);
}
{
  const w = monde({ brevoToujoursEnPanne: true }); const db = w.db;
  prospect(db, "s2");
  for (let i = 0; i < 5; i++) await passe(w, new Date(MAINTENANT.getTime() + i * H));
  ok("3 échecs : abandon, plus aucun essai", db.journal[0].statut === "abandon" && db.journal[0].tentatives === 3 && db.requetes.filter(r => r.startsWith("POST /v3/smtp/email") || r.includes("api.brevo")).length <= 3, db.journal);
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
  ok("en-têtes de désinscription en un clic (List-Unsubscribe, List-Unsubscribe-Post)", /^<https:\/\/projet\.supabase\.co\/functions\/v1\/emails-prospects\?action=desinscription&u=c1&t=[0-9a-f]{64}>$/.test(e.headers["List-Unsubscribe"]) && e.headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click", e.headers);
  ok("lien de désinscription dans le corps HTML et texte", e.htmlContent.includes("action=desinscription") && e.textContent.includes("action=desinscription"));
  ok("bouton vers l'app", e.htmlContent.includes(ENV.APP_URL));
}
{
  const p = { prenom: "Léa", questionnaire: false };
  const cfg = { marque: "MHX Coaching", contact: "mhx.coaching@gmail.com", signataire: "Lucas", lienApp: ENV.APP_URL, lienDesinscription: "https://x/?d" };
  const tous = [L.contenu("bienvenue", p, cfg), L.contenu("questionnaire", p, cfg), L.contenu("relance", p, cfg), L.contenu("relance", { prenom: "", questionnaire: true }, cfg)];
  const texte = tous.map(m => m.sujet + " " + m.html + " " + m.texte).join(" ");
  ok("aucun prix, tarif, abonnement ni montant dans les 4 emails", !/€|\beuros?\b|tarif|abonnement|prix|\/mois|paiement/i.test(texte));
  ok("aucune mention du Challenge ni de Notion (abandonnés)", !/challenge|notion/i.test(texte));
  ok("sujets attendus", tous[0].sujet === "Léa, ta découverte MHX Coaching commence" && tous[1].sujet === "Léa, ton résultat personnalisé t'attend" && tous[2].sujet === "Léa, ton questionnaire t'attend toujours" && tous[3].sujet === "Bonjour, tu as oublié de regarder ton résultat ?", tous.map(m => m.sujet));
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
  ok("pages de désinscription (valide / non valable), texte échappé", /C&#39;est noté/.test(L.pageDesinscription(true, "MHX", ENV.APP_URL)) && /pas valable/.test(L.pageDesinscription(false, "<b>X</b>", "")) && !/<b>X<\/b>/.test(L.pageDesinscription(false, "<b>X</b>", "")));
}

/* ---------- 7. ouvertures et clics (webhook Brevo) ---------- */
{
  const w = monde(); const db = w.db;
  prospect(db, "o1");
  await passe(w);
  const id = db.journal[0].message_id;
  await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: { event: "opened", "message-id": id, date: "2026-10-05 12:00:00" }, maintenant: MAINTENANT });
  ok("ouverture : ouvert_le noté", db.journal[0].ouvert_le != null, db.journal[0]);
  const premiere = db.journal[0].ouvert_le;
  await L.evenementBrevo({ fetch: w.fetch, env: ENV, corps: [{ event: "unique_opened", "message-id": id }, { event: "click", "message-id": id }, { event: "delivered", "message-id": id }, { event: "opened" }], maintenant: new Date(MAINTENANT.getTime() + H) });
  ok("seule la première ouverture compte ; clic noté ; autres événements et événement sans identifiant ignorés", db.journal[0].ouvert_le === premiere && db.journal[0].clique_le != null, db.journal[0]);
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
