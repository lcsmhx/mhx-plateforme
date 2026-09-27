/* Emails de suivi des prospects MHX — la logique, sans dépendance.
   Elle tourne dans la fonction Supabase (Deno, index.ts) et dans Node pour les tests
   (node supabase/functions/emails-prospects/test.mjs). Rien ici ne lit une variable
   d'environnement ni le réseau directement : tout arrive par les paramètres (fetch, env).

   Trois emails, au plus un par prospect et par passage, chacun une seule fois :
   - bienvenue      : dès que l'email du compte est confirmé ;
   - questionnaire  : 24 h après l'inscription, si le questionnaire court n'est pas rempli ;
   - relance        : 3 jours après l'inscription, si plus aucune action depuis 3 jours.
   Seulement aux prospects qui l'ont accepté (case de l'inscription, ou interrupteur du Profil),
   jamais après une réservation de bilan, une issue « Signé » ou « Perdu », ni aux comptes
   créés plus de 8 jours avant le passage (rien n'est envoyé aux anciens comptes au déploiement).
   Aucun prix, aucun tarif dans les emails. */

export const MODELES = ["bienvenue", "questionnaire", "relance"];

export const REGLES = {
  questionnaire_apres_h: 24,   // rappel du questionnaire
  relance_apres_jours: 3,      // relance : inscrit depuis 3 jours…
  inactif_jours: 3,            // … et plus aucune action depuis 3 jours
  fenetre_jours: 8,            // au-delà, plus aucun email de suivi
  tentatives_max: 3,           // un envoi qui échoue est retenté au passage suivant, 3 fois au plus
  en_cours_max_min: 60,        // un envoi resté « en cours » plus d'une heure (fonction interrompue) est repris
  max_par_passage: 50,         // au plus 50 emails par passage (temps d'exécution de la fonction)
  quota_jour: 150              // au plus 150 emails de suivi par jour : le quota gratuit de Brevo (300 / jour)
                               // est partagé avec les emails de confirmation de compte envoyés par Supabase
};

const JOUR = 86400000;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/* ---------- petites aides ---------- */
const instant = v => { const t = typeof v === "string" ? Date.parse(v) : NaN; return isNaN(t) ? null : t; };
const chaine = (v, max) => typeof v === "string" ? v.trim().slice(0, max || 200) : "";
const objet = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* L'accord du prospect : la clé « emails » (interrupteur du Profil) l'emporte sur la case de l'inscription. */
export function accord(meta, emails) {
  const e = objet(emails);
  if (typeof e.suivi === "boolean") return e.suivi;
  const m = objet(meta);
  return typeof m.emails_suivi === "string" && instant(m.emails_suivi) != null;
}

/* Tout ce que l'on sait d'un prospect pour décider, à partir des données brutes (valeurs piégées neutralisées). */
export function etatProspect(src, maintenant) {
  const u = objet(src.user), pr = objet(src.profil), d = objet(src.donnees);
  const intake = objet(d.intake), ch = objet(d.challenge), act = objet(d.activite), suivi = objet(src.suivi);
  const now = maintenant.getTime();
  const cree = instant(pr.cree_le) ?? instant(u.created_at);
  const clics = Array.isArray(objet(ch.cta).clics) ? ch.cta.clics.filter(c => c && typeof c === "object" && instant(c.date) != null) : [];
  const j7 = objet(objet(ch.jours)["7"]);
  const reserve = instant(ch.reserve) != null || instant(j7.reserve) != null;
  const questionnaire = instant(intake.court_le) != null;
  /* derniere action connue : questionnaire, clic, activite dans l'app, inscription */
  const dates = [cree, instant(intake.court_le), instant(intake.court_debut), instant(act.derniere)].concat(clics.map(c => instant(c.date))).filter(t => t != null && t <= now + 5 * 60000);
  const email = chaine(u.email, 254);
  return {
    id: String(u.id || pr.id || ""),
    email: EMAIL_RE.test(email) ? email : "",
    prenom: chaine(pr.prenom || objet(u.user_metadata).prenom, 60),
    statut: pr.statut === "prospect" ? "prospect" : String(pr.statut || ""),
    confirme: instant(u.email_confirmed_at) != null,
    heures: cree == null ? null : (now - cree) / 3600000,
    questionnaire,
    clics: clics.length,
    reserve,
    issue: typeof suivi.issue === "string" ? suivi.issue : null,
    derniereAction: dates.length ? Math.max(...dates) : null,
    accord: accord(u.user_metadata, d.emails)
  };
}

/* Les emails dus à ce passage. envoyes : Map « user_id|modele » -> { statut, tentatives, maj_le }. */
export function emailsDus(prospects, envoyes, maintenant, regles) {
  const R = Object.assign({}, REGLES, regles || {});
  const now = maintenant.getTime(), out = [];
  const lu = (p, m) => envoyes.get(p.id + "|" + m) || null;
  /* « en cours » depuis plus d'une heure : la fonction s'est arrêtée pendant l'envoi, on reprend (comme un échec) */
  const bloque = e => !!e && e.statut === "en_cours" && !(instant(e.maj_le) != null && now - instant(e.maj_le) < R.en_cours_max_min * 60000);
  const fini = e => !!e && (e.statut === "envoye" || e.statut === "abandon" || (e.statut === "en_cours" && !bloque(e)) || ((e.statut === "echec" || bloque(e)) && e.tentatives >= R.tentatives_max));
  for (const p of prospects) {
    if (!p.id || !p.email || !p.confirme || !p.accord || p.statut !== "prospect") continue;
    if (p.reserve || p.issue === "signe" || p.issue === "perdu") continue;
    if (p.heures == null || p.heures > R.fenetre_jours * 24) continue;
    const inactifJours = p.derniereAction == null ? Infinity : (now - p.derniereAction) / JOUR;
    const b = lu(p, "bienvenue");
    let modele = null;
    if (!fini(b)) modele = "bienvenue";
    else if (b.statut === "envoye" && !p.questionnaire && p.heures >= R.questionnaire_apres_h && !fini(lu(p, "questionnaire"))) modele = "questionnaire";
    else if (b.statut === "envoye" && p.heures >= R.relance_apres_jours * 24 && inactifJours >= R.inactif_jours && !fini(lu(p, "relance"))) modele = "relance";
    if (modele) out.push({ user_id: p.id, modele, prospect: p, existant: lu(p, modele) });
  }
  return out;
}

/* ---------- les emails (FR, sans prix) ---------- */
function gabarit(o) {
  const bouton = `<p style="margin:28px 0"><a href="${esc(o.lien)}" style="background:#c9a24a;color:#111;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:8px;display:inline-block">${esc(o.cta)}</a></p>`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.sujet)}</title></head>
<body style="margin:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;color:#1c1c1c">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8a7a52;margin:0 0 18px">${esc(o.marque)}</p>
<h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${esc(o.titre)}</h1>
${o.paragraphes.map(p => `<p style="font-size:16px;line-height:1.55;margin:0 0 14px">${esc(p)}</p>`).join("\n")}
${bouton}
<p style="font-size:16px;line-height:1.55;margin:0 0 24px">${esc(o.signature)}</p>
<hr style="border:0;border-top:1px solid #ddd6c8;margin:28px 0 14px">
<p style="font-size:12px;line-height:1.5;color:#777;margin:0">Tu reçois cet email parce que tu as accepté les emails de suivi de ta découverte ${esc(o.marque)} (3 au plus). <a href="${esc(o.desinscription)}" style="color:#777">Ne plus recevoir ces emails</a>.<br>${esc(o.marque)}${o.contact ? " — " + esc(o.contact) : ""}</p>
</div></body></html>`;
  const texte = [o.titre, "", ...o.paragraphes, "", o.cta + " : " + o.lien, "", o.signature, "", "—", "Tu reçois cet email parce que tu as accepté les emails de suivi de ta découverte " + o.marque + ". Ne plus les recevoir : " + o.desinscription].join("\n");
  return { sujet: o.sujet, html, texte };
}

export function contenu(modele, p, cfg) {
  const prenom = p.prenom || "";
  const salut = prenom ? prenom : "Bonjour";
  const base = { marque: cfg.marque, contact: cfg.contact, desinscription: cfg.lienDesinscription, signature: "À très vite,\n" + (cfg.signataire ? cfg.signataire + " — " : "") + cfg.marque };
  if (modele === "bienvenue") return gabarit(Object.assign(base, {
    sujet: (prenom ? prenom + ", ta" : "Ta") + " découverte " + cfg.marque + " commence",
    titre: "Bienvenue" + (prenom ? " " + prenom : "") + " !",
    paragraphes: [
      "Ton accès découverte est ouvert pendant 7 jours.",
      "Commence par ton questionnaire : 3 minutes, 10 questions. Tu obtiens tout de suite ton résultat personnalisé, tes calories et tes macros, une séance à faire chez toi et 3 recettes pour démarrer."
    ],
    cta: "Commencer mon questionnaire", lien: cfg.lienApp
  }));
  if (modele === "questionnaire") return gabarit(Object.assign(base, {
    sujet: salut + ", ton résultat personnalisé t'attend",
    titre: "Ton résultat personnalisé t'attend",
    paragraphes: [
      "Il te manque une étape pour voir ton résultat : ton questionnaire (3 minutes).",
      "À partir de tes réponses, l'app calcule ton point de départ, tes priorités, tes calories et tes macros."
    ],
    cta: "Remplir mon questionnaire", lien: cfg.lienApp
  }));
  /* relance : deux variantes selon que le questionnaire est rempli ou non */
  if (p.questionnaire) return gabarit(Object.assign(base, {
    sujet: salut + ", tu as oublié de regarder ton résultat ?",
    titre: "Ton résultat est toujours là",
    paragraphes: [
      "Tes priorités, tes calories, ta séance et tes recettes t'attendent dans ton espace découverte.",
      "Si tu veux un plan construit pour toi, tu peux réserver un bilan de 30 minutes avec ton coach depuis ton espace."
    ],
    cta: "Voir mon résultat", lien: cfg.lienApp
  }));
  return gabarit(Object.assign(base, {
    sujet: salut + ", ton questionnaire t'attend toujours",
    titre: "3 minutes pour ton point de départ",
    paragraphes: [
      "Tu n'as pas encore rempli ton questionnaire. C'est lui qui te donne ton résultat personnalisé : priorités, calories, macros.",
      "Ton accès découverte dure 7 jours : c'est le bon moment."
    ],
    cta: "Remplir mon questionnaire", lien: cfg.lienApp
  }));
}

/* ---------- désinscription par lien signé (HMAC-SHA256, Web Crypto : Deno et Node 18+) ---------- */
async function hmac(message, secret) {
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export async function signer(uid, secret) {
  if (!secret || String(secret).length < 16) throw new Error("secret de désinscription absent ou trop court");
  return hmac("desinscription:" + uid, secret);
}
export async function verifier(uid, jeton, secret) {
  if (typeof uid !== "string" || typeof jeton !== "string" || !/^[0-9a-f]{64}$/.test(jeton)) return false;
  let attendu; try { attendu = await signer(uid, secret); } catch (e) { return false; }
  let diff = 0; for (let i = 0; i < 64; i++) diff |= attendu.charCodeAt(i) ^ jeton.charCodeAt(i);
  return diff === 0;
}

/* ---------- accès Supabase (clé de service : réservée à la fonction) et Brevo ---------- */
function api(fetchFn, env) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, ""), cle = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !cle) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  const appel = async (chemin, options) => {
    options = options || {};
    const r = await fetchFn(base + chemin, { method: options.method || "GET", headers: Object.assign({ apikey: cle, Authorization: "Bearer " + cle, "Content-Type": "application/json" }, options.headers || {}), body: options.body ? JSON.stringify(options.body) : undefined });
    const t = await r.text(); let data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = t; }
    if (!r.ok) { const err = new Error("Supabase " + r.status + " sur " + chemin.split("?")[0] + " : " + (data && (data.message || data.msg) || t).toString().slice(0, 200)); err.statut = r.status; throw err; }
    return data;
  };
  /* lecture paginée (1 000 lignes par page) */
  const tout = async (chemin) => {
    const out = [];
    for (let debut = 0; debut < 200000; debut += 1000) {
      const lot = await appel(chemin, { headers: { "Range-Unit": "items", Range: debut + "-" + (debut + 999) } });
      if (!Array.isArray(lot) || !lot.length) break;
      out.push(...lot);
      if (lot.length < 1000) break;
    }
    return out;
  };
  return { appel, tout };
}

async function utilisateurs(fetchFn, env, api_) {
  const out = [];
  for (let page = 1; page <= 200; page++) {
    const r = await api_.appel("/auth/v1/admin/users?page=" + page + "&per_page=1000");
    const lot = r && Array.isArray(r.users) ? r.users : [];
    out.push(...lot);
    if (lot.length < 1000) break;
  }
  return out;
}

const delai = ms => (typeof AbortSignal !== "undefined" && AbortSignal.timeout) ? AbortSignal.timeout(ms) : undefined;

export async function envoyerBrevo(fetchFn, env, destinataire, message, tag) {
  if (!env.BREVO_API_KEY) throw new Error("BREVO_API_KEY manquant");
  const corps = {
    sender: { name: env.EXPEDITEUR_NOM || "MHX Coaching", email: env.EXPEDITEUR_EMAIL },
    to: [{ email: destinataire.email, name: destinataire.prenom || undefined }],
    subject: message.sujet, htmlContent: message.html, textContent: message.texte,
    tags: ["mhx-suivi", "mhx-" + tag],
    headers: message.desinscription ? { "List-Unsubscribe": "<" + message.desinscription + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined
  };
  if (env.REPONSE_EMAIL) corps.replyTo = { email: env.REPONSE_EMAIL };
  const r = await fetchFn("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(corps), signal: delai(15000) });
  const t = await r.text(); let data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
  if (!r.ok) { const err = new Error("Brevo " + r.status + " : " + ((data && (data.message || data.code)) || t).toString().slice(0, 200)); err.statut = r.status; throw err; }
  return (data && data.messageId) || null;
}

/* ---------- un passage complet ---------- */
export async function executer({ fetch: fetchFn, env, maintenant, regles }) {
  const now = maintenant || new Date();
  for (const k of ["EXPEDITEUR_EMAIL", "APP_URL", "DESINSCRIPTION_SECRET", "FONCTION_URL"]) if (!env[k]) throw new Error(k + " manquant");
  const A = api(fetchFn, env);
  const [profils, users, donnees, suivis, journal] = await Promise.all([
    A.tout("/rest/v1/profils?statut=eq.prospect&select=id,prenom,cree_le,statut"),
    utilisateurs(fetchFn, env, A),
    A.tout("/rest/v1/donnees?outil=in.(intake,challenge,emails,activite)&select=user_id,outil,contenu"),
    A.tout("/rest/v1/donnees?outil=eq.suivi_prospect&select=user_id,contenu"),
    A.tout("/rest/v1/emails_prospects?select=user_id,modele,statut,tentatives,maj_le,envoye_le")
  ]);
  const parUser = new Map(users.map(u => [u.id, u]));
  const dParUser = new Map();
  for (const l of donnees) { if (!l || !l.user_id) continue; const o = dParUser.get(l.user_id) || {}; o[l.outil] = l.contenu; dParUser.set(l.user_id, o); }
  const sParUser = new Map(suivis.map(l => [l.user_id, l.contenu]));
  const envoyes = new Map(journal.map(l => [l.user_id + "|" + l.modele, { statut: l.statut, tentatives: l.tentatives || 0, maj_le: l.maj_le || null }]));
  const prospects = profils.map(pr => etatProspect({ profil: pr, user: parUser.get(pr.id), donnees: dParUser.get(pr.id), suivi: sParUser.get(pr.id) }, now));
  const R = Object.assign({}, REGLES, regles || {});
  const tous = emailsDus(prospects, envoyes, now, R);
  /* quota du jour (depuis minuit UTC) et plafond par passage */
  const minuit = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deja = journal.filter(l => l && l.statut === "envoye" && instant(l.envoye_le) != null && instant(l.envoye_le) >= minuit).length;
  const place = Math.max(0, Math.min(R.max_par_passage, R.quota_jour - deja));
  const dus = tous.slice(0, place);
  const bilan = { prospects: prospects.length, dus: tous.length, reportes: tous.length - dus.length, envoyes: 0, echecs: 0, abandons: 0, ignores: 0, details: [] };
  for (const e of dus) {
    const cle = { user_id: e.user_id, modele: e.modele };
    const filtre = "?user_id=eq." + encodeURIComponent(e.user_id) + "&modele=eq." + e.modele;
    /* reservation de la ligne : une seule execution envoie, meme si deux passages tournent en meme temps.
       Ligne nouvelle : insertion qui ignore un doublon ; ligne existante (echec, envoi interrompu) : mise a jour
       conditionnee a l'etat lu (statut + tentatives). Si un autre passage a pris la ligne, la reponse est vide. */
    const avant = e.existant, tentatives = (avant ? avant.tentatives : 0) + 1;
    const ligne = Object.assign({}, cle, { statut: "en_cours", tentatives, maj_le: now.toISOString() });
    const reserve = avant
      ? await A.appel("/rest/v1/emails_prospects" + filtre + "&statut=eq." + encodeURIComponent(avant.statut) + "&tentatives=eq." + avant.tentatives, { method: "PATCH", headers: { Prefer: "return=representation" }, body: { statut: "en_cours", tentatives, maj_le: now.toISOString() } })
      : await A.appel("/rest/v1/emails_prospects?on_conflict=user_id,modele", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: [ligne] });
    if (!Array.isArray(reserve) || !reserve.length){ bilan.ignores++; continue; }
    const jeton = await signer(e.user_id, env.DESINSCRIPTION_SECRET);
    const lienDesinscription = String(env.FONCTION_URL).replace(/\/$/, "") + "?action=desinscription&u=" + encodeURIComponent(e.user_id) + "&t=" + jeton;
    const message = contenu(e.modele, e.prospect, { marque: env.MARQUE || "MHX Coaching", contact: env.CONTACT || env.REPONSE_EMAIL || "", signataire: env.SIGNATAIRE || "", lienApp: env.APP_URL, lienDesinscription });
    message.desinscription = lienDesinscription;
    try {
      const id = await envoyerBrevo(fetchFn, env, e.prospect, message, e.modele);
      await A.appel("/rest/v1/emails_prospects" + filtre, { method: "PATCH", body: { statut: "envoye", message_id: id, envoye_le: now.toISOString(), derniere_erreur: null, maj_le: now.toISOString() } });
      bilan.envoyes++; bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: "envoye" });
    } catch (err) {
      const abandon = tentatives >= R.tentatives_max;
      await A.appel("/rest/v1/emails_prospects" + filtre, { method: "PATCH", body: { statut: abandon ? "abandon" : "echec", derniere_erreur: String(err.message || err).slice(0, 300), maj_le: now.toISOString() } }).catch(() => {});
      if (abandon) bilan.abandons++; else bilan.echecs++;
      bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: abandon ? "abandon" : "echec", erreur: String(err.message || err).slice(0, 120) });
    }
  }
  return bilan;
}

/* ---------- lien « Ne plus recevoir ces emails » ---------- */
export async function desinscrire({ fetch: fetchFn, env, uid, jeton, maintenant }) {
  if (!(await verifier(uid, jeton, env.DESINSCRIPTION_SECRET))) return { ok: false };
  const A = api(fetchFn, env);
  const now = (maintenant || new Date()).toISOString();
  await A.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: [{ user_id: uid, outil: "emails", contenu: { suivi: false, maj: now, source: "lien-email" }, maj_le: now }] });
  return { ok: true };
}

export function pageDesinscription(ok, marque, lienApp) {
  const titre = ok ? "C'est noté" : "Lien non valable";
  const texte = ok ? "Tu ne recevras plus les emails de suivi. Tu peux changer d'avis à tout moment depuis ton Profil." : "Ce lien de désinscription n'est pas valable. Tu peux couper les emails de suivi depuis ton Profil, dans l'app.";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titre)} — ${esc(marque)}</title></head>
<body style="margin:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;color:#1c1c1c"><div style="max-width:520px;margin:0 auto;padding:48px 20px">
<p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8a7a52">${esc(marque)}</p><h1 style="font-size:22px">${esc(titre)}</h1><p style="font-size:16px;line-height:1.55">${esc(texte)}</p>
${lienApp ? `<p><a href="${esc(lienApp)}" style="color:#8a6a1c">Ouvrir l'app</a></p>` : ""}</div></body></html>`;
}

/* ---------- ouvertures et clics renvoyés par Brevo (webhook transactionnel) ---------- */
export async function evenementBrevo({ fetch: fetchFn, env, corps, maintenant }) {
  const liste = Array.isArray(corps) ? corps : [corps];
  const A = api(fetchFn, env);
  let n = 0;
  for (const ev of liste) {
    const e = objet(ev), id = chaine(e["message-id"] || e.messageId || e["message_id"], 200), type = chaine(e.event, 40).toLowerCase();
    if (!id) continue;
    const champ = /open/.test(type) ? "ouvert_le" : /click/.test(type) ? "clique_le" : null;
    if (!champ) continue;
    const quand = instant(e.date) != null ? new Date(instant(e.date)).toISOString() : (maintenant || new Date()).toISOString();
    /* seulement la premiere ouverture / le premier clic */
    await A.appel("/rest/v1/emails_prospects?message_id=eq." + encodeURIComponent(id) + "&" + champ + "=is.null", { method: "PATCH", body: { [champ]: quand } });
    n++;
  }
  return { traites: n };
}
