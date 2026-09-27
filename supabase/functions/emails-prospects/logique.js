/* Emails de suivi des prospects MHX — la logique, sans dépendance.
   Elle tourne dans la fonction Supabase (Deno, index.ts) et dans Node pour les tests
   (node supabase/functions/emails-prospects/test.mjs). Rien ici ne lit une variable
   d'environnement ni le réseau directement : tout arrive par les paramètres (fetch, env).

   Trois emails, au plus un par prospect et par passage, chacun une seule fois (parcours du brief de Lucas) :
   - bienvenue : dès que l'email du compte est confirmé (« commence par ton questionnaire », ou « ton résultat est
                 prêt » s'il l'a déjà rempli) ;
   - resultat  : questionnaire rempli après la bienvenue (dans les 48 h) : « ton résultat est prêt » — aucun chiffre
                 de santé dans l'email, tout reste dans l'app ;
   - relance   : 3 jours après l'inscription, si plus aucune action depuis 3 jours.
   20 h au moins entre deux emails, sauf pour « resultat », qui répond à une action du prospect.
   Seulement aux prospects qui l'ont accepté (case de l'inscription, ou interrupteur du Profil),
   jamais après une réservation de bilan, une issue « Signé » ou « Perdu », ni aux comptes
   créés plus de 8 jours avant le passage (rien n'est envoyé aux anciens comptes au déploiement).
   Aucun prix, aucun tarif dans les emails. */

export const MODELES = ["bienvenue", "resultat", "relance"];

export const REGLES = {
  resultat_max_h: 48,          // « ton résultat » : seulement pour un questionnaire rempli depuis moins de 48 h
  relance_apres_jours: 3,      // relance : inscrit depuis 3 jours…
  inactif_jours: 3,            // … et plus aucune action depuis 3 jours
  fenetre_jours: 8,            // au-delà, plus aucun email de suivi
  ecart_min_h: 20,             // jamais deux emails de suivi à moins de 20 h d'écart (déploiement, accord tardif)
  tentatives_max: 3,           // un envoi refusé ou incertain est retenté au passage suivant, 3 fois au plus ;
                               // un refus qui prouve que rien n'est parti (clé, IP, crédits, trop de requêtes,
                               // service indisponible) ne compte pas : le passage s'arrête, rien n'est perdu
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
  const questionnaireLe = instant(intake.court_le), questionnaire = questionnaireLe != null;
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
    questionnaireLe: questionnaire && questionnaireLe <= now + 5 * 60000 ? questionnaireLe : null,
    clics: clics.length,
    reserve,
    issue: typeof suivi.issue === "string" ? suivi.issue : null,
    derniereAction: dates.length ? Math.max(...dates) : null,
    accord: accord(u.user_metadata, d.emails)
  };
}

/* Les emails dus à ce passage. envoyes : Map « user_id|modele » -> { statut, tentatives, maj_le, envoye_le }. */
export function emailsDus(prospects, envoyes, maintenant, regles) {
  const R = Object.assign({}, REGLES, regles || {});
  const now = maintenant.getTime(), out = [];
  const lu = (p, m) => envoyes.get(p.id + "|" + m) || null;
  /* dernier email parti vers ce prospect (tous modèles confondus) */
  const dernierEnvoi = p => { let t = null; for (const m of MODELES) { const e = lu(p, m), x = e && e.statut === "envoye" ? instant(e.envoye_le) : null; if (x != null && (t == null || x > t)) t = x; } return t; };
  /* « en cours » depuis plus d'une heure : la fonction s'est arrêtée pendant l'envoi, on reprend (comme un échec) */
  const bloque = e => !!e && e.statut === "en_cours" && !(instant(e.maj_le) != null && now - instant(e.maj_le) < R.en_cours_max_min * 60000);
  const fini = e => !!e && (e.statut === "envoye" || e.statut === "abandon" || (e.statut === "en_cours" && !bloque(e)) || ((e.statut === "echec" || bloque(e)) && e.tentatives >= R.tentatives_max));
  for (const p of prospects) {
    if (!p.id || !p.email || !p.confirme || !p.accord || p.statut !== "prospect") continue;
    if (p.reserve || p.issue === "signe" || p.issue === "perdu") continue;
    if (p.heures == null || p.heures > R.fenetre_jours * 24) continue;
    const inactifJours = p.derniereAction == null ? Infinity : (now - p.derniereAction) / JOUR;
    const b = lu(p, "bienvenue");
    const bLe = b && b.statut === "envoye" ? instant(b.envoye_le) : null;
    let modele = null;
    if (!fini(b)) modele = "bienvenue";
    /* questionnaire rempli APRÈS la bienvenue (sinon la bienvenue l'a déjà dit), il y a moins de 48 h */
    else if (bLe != null && p.questionnaireLe != null && p.questionnaireLe > bLe && now - p.questionnaireLe < R.resultat_max_h * 3600000 && !fini(lu(p, "resultat"))) modele = "resultat";
    else if (bLe != null && p.heures >= R.relance_apres_jours * 24 && inactifJours >= R.inactif_jours && !fini(lu(p, "relance"))) modele = "relance";
    if (!modele) continue;
    /* 20 h au moins depuis le dernier email, sauf « resultat » (réponse à ce que le prospect vient de faire) */
    const dernier = dernierEnvoi(p);
    if (modele !== "resultat" && dernier != null && now - dernier < R.ecart_min_h * 3600000) continue;
    out.push({ user_id: p.id, modele, prospect: p, existant: lu(p, modele) });
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
    paragraphes: p.questionnaire ? [
      "Ton accès découverte est ouvert pendant 7 jours.",
      "Ton questionnaire est rempli : ton résultat personnalisé t'attend dans ton espace, avec tes calories et tes macros, une séance à faire chez toi et 3 recettes pour démarrer."
    ] : [
      "Ton accès découverte est ouvert pendant 7 jours.",
      "Commence par ton questionnaire : 3 minutes, 10 questions. Tu obtiens tout de suite ton résultat personnalisé, tes calories et tes macros, une séance à faire chez toi et 3 recettes pour démarrer."
    ],
    cta: p.questionnaire ? "Voir mon résultat" : "Commencer mon questionnaire", lien: cfg.lienApp
  }));
  if (modele === "resultat") return gabarit(Object.assign(base, {
    sujet: salut + ", ton résultat est prêt",
    titre: "Ton résultat est prêt",
    paragraphes: [
      "Merci d'avoir rempli ton questionnaire. Ton point de départ, tes priorités, tes calories et tes macros t'attendent dans ton espace découverte, avec une séance à faire chez toi et 3 recettes.",
      "Si tu veux un plan construit pour toi, tu peux réserver un bilan de 30 minutes avec ton coach depuis ton espace."
    ],
    cta: "Voir mon résultat", lien: cfg.lienApp
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
  /* lecture paginée (1 000 lignes par page). Le chemin porte toujours un order=… sur une clé unique :
     sans ordre stable, deux pages peuvent se recouvrir et une ligne (une désinscription) manquer */
  const tout = async (chemin) => {
    if (!/[?&]order=/.test(chemin)) throw new Error("lecture paginée sans ordre : " + chemin.split("?")[0]);
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

/* Pas d'en-tête List-Unsubscribe ici : l'API Brevo n'accepte pas les en-têtes standard et ajoute elle-même le sien
   (le bouton « Se désabonner » de Gmail / Outlook passe par Brevo, qui prévient la fonction par le webhook
   « unsubscribed »). Pas de clé d'idempotence non plus : Brevo la veut au format UUID et ne la garde que 30 minutes,
   moins que l'écart entre deux passages ; un envoi incertain compte donc comme un essai (3 au plus). */
export async function envoyerBrevo(fetchFn, env, destinataire, message, tag) {
  if (!env.BREVO_API_KEY) throw Object.assign(new Error("BREVO_API_KEY manquant"), { avantEnvoi: true });
  const corps = {
    sender: { name: env.EXPEDITEUR_NOM || "MHX Coaching", email: env.EXPEDITEUR_EMAIL },
    to: [{ email: destinataire.email, name: destinataire.prenom || undefined }],
    subject: message.sujet, htmlContent: message.html, textContent: message.texte,
    tags: ["mhx-suivi", "mhx-" + tag]
  };
  if (env.REPONSE_EMAIL) corps.replyTo = { email: env.REPONSE_EMAIL };
  const r = await fetchFn("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify(corps), signal: delai(15000) });
  const t = await r.text(); let data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
  /* brevo : la réponse d'erreur vient bien de Brevo (JSON avec code ou message), pas d'un intermédiaire */
  if (!r.ok) { const err = new Error("Brevo " + r.status + " : " + ((data && (data.message || data.code)) || t).toString().slice(0, 200)); err.statut = r.status; err.brevo = !!(data && typeof data === "object" && (data.code || data.message)); throw err; }
  return (data && data.messageId) || null;
}

/* ---------- un passage complet ---------- */
export async function executer({ fetch: fetchFn, env, maintenant, regles }) {
  const now = maintenant || new Date();
  /* réglages vérifiés avant toute réservation : un secret oublié n'use les essais de personne */
  for (const k of ["BREVO_API_KEY", "EXPEDITEUR_EMAIL", "APP_URL", "DESINSCRIPTION_SECRET", "FONCTION_URL"]) if (!env[k]) throw new Error(k + " manquant");
  if (String(env.DESINSCRIPTION_SECRET).length < 16) throw new Error("DESINSCRIPTION_SECRET trop court (16 caractères au moins, 40 conseillés)");
  const A = api(fetchFn, env);
  const [profils, users, donnees, suivis, journal] = await Promise.all([
    A.tout("/rest/v1/profils?statut=eq.prospect&select=id,prenom,cree_le,statut&order=id.asc"),
    utilisateurs(fetchFn, env, A),
    A.tout("/rest/v1/donnees?outil=in.(intake,challenge,emails,activite)&select=user_id,outil,contenu&order=user_id.asc,outil.asc"),
    A.tout("/rest/v1/donnees?outil=eq.suivi_prospect&select=user_id,contenu&order=user_id.asc"),
    A.tout("/rest/v1/emails_prospects?select=id,user_id,modele,statut,tentatives,maj_le,envoye_le&order=id.asc")
  ]);
  const parUser = new Map(users.map(u => [u.id, u]));
  const dParUser = new Map();
  for (const l of donnees) { if (!l || !l.user_id) continue; const o = dParUser.get(l.user_id) || {}; o[l.outil] = l.contenu; dParUser.set(l.user_id, o); }
  const sParUser = new Map(suivis.map(l => [l.user_id, l.contenu]));
  const envoyes = new Map(journal.map(l => [l.user_id + "|" + l.modele, { statut: l.statut, tentatives: l.tentatives || 0, maj_le: l.maj_le || null, envoye_le: l.envoye_le || null }]));
  const prospects = profils.map(pr => etatProspect({ profil: pr, user: parUser.get(pr.id), donnees: dParUser.get(pr.id), suivi: sParUser.get(pr.id) }, now));
  const R = Object.assign({}, REGLES, regles || {});
  const tous = emailsDus(prospects, envoyes, now, R);
  /* quota du jour (depuis minuit UTC) et plafond par passage */
  const minuit = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  /* compte aussi les essais ratés du jour : un envoi incertain (délai dépassé) a pu partir chez Brevo */
  const deja = journal.filter(l => l && ((l.statut === "envoye" && instant(l.envoye_le) != null && instant(l.envoye_le) >= minuit) || ((l.statut === "echec" || l.statut === "abandon") && (l.tentatives || 0) > 0 && instant(l.maj_le) != null && instant(l.maj_le) >= minuit))).length;
  const place = Math.max(0, Math.min(R.max_par_passage, R.quota_jour - deja));
  /* d'abord les emails jamais essayés, puis les nouveaux essais (les moins essayés d'abord) : un prospect dont
     l'envoi rate ne reste pas en tête de file à chaque passage */
  const essais = e => e.existant ? (e.existant.tentatives || 0) + 1 : 0;
  const dus = tous.map((e, i) => ({ e, i })).sort((a, b) => essais(a.e) - essais(b.e) || a.i - b.i).map(x => x.e).slice(0, place);
  const bilan = { prospects: prospects.length, dus: tous.length, reportes: tous.length - dus.length, envoyes: 0, echecs: 0, abandons: 0, ignores: 0, arret: null, details: [] };
  for (let i = 0; i < dus.length; i++) {
    const e = dus[i];
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
    /* lien du corps de l'email : une page de confirmation (un antivirus qui visite les liens ne désinscrit personne) */
    const lienPage = lienPageDesinscription(env.APP_URL, e.user_id, jeton);
    const message = contenu(e.modele, e.prospect, { marque: env.MARQUE || "MHX Coaching", contact: env.CONTACT || env.REPONSE_EMAIL || "", signataire: env.SIGNATAIRE || "", lienApp: env.APP_URL, lienDesinscription: lienPage });
    let id;
    try {
      id = await envoyerBrevo(fetchFn, env, e.prospect, message, e.modele);
    } catch (err) {
      const texte = String(err.message || err).slice(0, 300), nature = natureErreur(err);
      if (nature === "reglage") {
        /* refus qui prouve que rien n'est parti (clé ou IP refusée, crédits épuisés, trop de requêtes, service
           indisponible, expéditeur non validé) : l'essai ne compte pas, la ligne retrouve son nombre d'essais d'avant,
           et le passage s'arrête (les suivants seraient refusés pareil) */
        await retenter(() => A.appel("/rest/v1/emails_prospects" + filtre, { method: "PATCH", body: { statut: "echec", tentatives: avant ? avant.tentatives : 0, derniere_erreur: texte, maj_le: now.toISOString() } })).catch(() => {});
        bilan.echecs++; bilan.arret = texte.slice(0, 160); bilan.reportes += dus.length - i - 1;
        bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: "echec", erreur: texte.slice(0, 120) });
        break;
      }
      /* refus propre à ce prospect (adresse…) ou envoi incertain (délai dépassé, coupure, 5xx : Brevo a pu le prendre) :
         l'essai compte (3 au plus, jamais d'envoi sans fin) ; un envoi incertain arrête aussi le passage */
      const abandon = tentatives >= R.tentatives_max;
      await retenter(() => A.appel("/rest/v1/emails_prospects" + filtre, { method: "PATCH", body: { statut: abandon ? "abandon" : "echec", derniere_erreur: (nature === "incertain" ? "[incertain] " : "") + texte, maj_le: now.toISOString() } })).catch(() => {});
      if (abandon) bilan.abandons++; else bilan.echecs++;
      bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: abandon ? "abandon" : "echec", erreur: texte.slice(0, 120) });
      if (nature === "incertain") { bilan.arret = "[incertain] " + texte.slice(0, 150); bilan.reportes += dus.length - i - 1; break; }
      continue;
    }
    /* parti : noté « envoye », avec de nouveaux essais si la base ne répond pas (sinon la ligne resterait « en cours »
       et l'email repartirait une heure plus tard) */
    try {
      await retenter(() => A.appel("/rest/v1/emails_prospects" + filtre, { method: "PATCH", body: { statut: "envoye", message_id: id, envoye_le: now.toISOString(), derniere_erreur: null, maj_le: now.toISOString() } }));
    } catch (err) { bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: "envoye", erreur: "journal non mis à jour : " + String(err.message || err).slice(0, 100) }); }
    bilan.envoyes++; bilan.details.push({ user_id: e.user_id, modele: e.modele, statut: "envoye" });
  }
  return bilan;
}

/* nature d'une erreur d'envoi :
   - « reglage »   : rien n'est parti, pour une raison qui ne tient pas au prospect — erreur avant l'appel (clé absente),
                     401 / 403 (clé, IP inconnue, compte pas activé), 402 (crédits épuisés), 429 (trop de requêtes),
                     503 renvoyé par Brevo lui-même (service indisponible), 400 « sender » (expéditeur non validé) :
                     ne compte pas, arrête le passage ;
   - « incertain » : pas de réponse (délai dépassé, coupure), 408, 500, 502, 504… : Brevo a pu prendre l'email —
                     compte comme un essai, arrête le passage ;
   - « refus »     : autre refus 4xx, propre à ce prospect (adresse invalide…) : compte, le passage continue. */
export function natureErreur(err) {
  const s = err && err.statut;
  if (err && err.avantEnvoi) return "reglage";
  if (s === 401 || s === 402 || s === 403 || s === 429 || (s === 503 && err.brevo) || (s === 400 && /sender/i.test(String(err.message || "")))) return "reglage";
  if (!s || s === 408 || s >= 500) return "incertain";
  return "refus";
}
/* quelques essais rapprochés (0,3 s puis 1 s) pour une écriture importante */
async function retenter(fn, essais) {
  let derniere;
  for (let k = 0; k < (essais || 3); k++) {
    try { return await fn(); } catch (e) { derniere = e; if (k < (essais || 3) - 1) await new Promise(r => setTimeout(r, k === 0 ? 300 : 1000)); }
  }
  throw derniere;
}
/* la page statique de confirmation (desinscription.html, à la racine de l'app, servie par GitHub Pages) */
export function lienPageDesinscription(appUrl, uid, jeton) {
  const base = String(appUrl || "").replace(/\/?$/, "/");
  return base + "desinscription.html?u=" + encodeURIComponent(uid) + "&t=" + encodeURIComponent(jeton);
}

/* ---------- lien « Ne plus recevoir ces emails » ---------- */
export async function desinscrire({ fetch: fetchFn, env, uid, jeton, maintenant }) {
  if (!(await verifier(uid, jeton, env.DESINSCRIPTION_SECRET))) return { ok: false };
  const A = api(fetchFn, env);
  const now = (maintenant || new Date()).toISOString();
  await A.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: [{ user_id: uid, outil: "emails", contenu: { suivi: false, maj: now, source: "lien-email" }, maj_le: now }] });
  return { ok: true };
}

/* ---------- événements renvoyés par Brevo (webhook transactionnel) ----------
   ouverture, clic : première fois seulement (le clic sur « Ne plus recevoir ces emails » ne compte pas) ;
   désinscription, plainte (spam), adresse invalide ou bloquée, rebond définitif : les emails de suivi sont coupés
   (clé « emails » = { suivi: false }, comme le lien de désinscription). L'heure vient de ts_epoch / ts_event
   (UTC) : le champ « date » de Brevo est à l'heure du compte, sans fuseau. */
const COUPE = /unsubscri|spam|complaint|hard.?bounce|invalid|blocked/;
export async function evenementBrevo({ fetch: fetchFn, env, corps, maintenant }) {
  const liste = Array.isArray(corps) ? corps : [corps];
  const A = api(fetchFn, env);
  let n = 0, coupes = 0;
  for (const ev of liste.slice(0, 500)) {
    const e = objet(ev), id = chaine(e["message-id"] || e.messageId || e["message_id"], 200), type = chaine(e.event, 40).toLowerCase().replace(/\s+/g, "_");
    if (!id) continue;
    const num = v => typeof v === "number" && isFinite(v) && v > 0 ? v : typeof v === "string" && /^\d{9,13}$/.test(v) ? Number(v) : null;
    const ms = num(e.ts_epoch) != null ? num(e.ts_epoch) : num(e.ts_event) != null ? num(e.ts_event) * 1000 : num(e.ts) != null ? num(e.ts) * 1000 : null;
    const t = ms != null && ms > Date.UTC(2020, 0, 1) && ms < (maintenant || new Date()).getTime() + 86400000 ? ms : (maintenant || new Date()).getTime();
    const quand = new Date(t).toISOString();
    if (COUPE.test(type)) {
      const l = await A.appel("/rest/v1/emails_prospects?message_id=eq." + encodeURIComponent(id) + "&select=user_id&limit=1");
      const uid = Array.isArray(l) && l[0] && typeof l[0].user_id === "string" ? l[0].user_id : null;
      if (uid) {
        await A.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: [{ user_id: uid, outil: "emails", contenu: { suivi: false, maj: quand, source: "brevo-" + type.slice(0, 30) }, maj_le: new Date((maintenant || new Date()).getTime()).toISOString() }] });
        /* bloqué, adresse invalide, rebond définitif : cet email n'est jamais arrivé — le journal le dit (fiche du coach :
           « non délivré ») au lieu de le laisser « envoye » */
        if (/blocked|invalid|hard.?bounce/.test(type)) await A.appel("/rest/v1/emails_prospects?message_id=eq." + encodeURIComponent(id) + "&statut=eq.envoye", { method: "PATCH", body: { statut: "abandon", derniere_erreur: "Non délivré : " + type.slice(0, 30) + " (Brevo)", maj_le: new Date((maintenant || new Date()).getTime()).toISOString() } });
        coupes++;
      }
      n++; continue;
    }
    const champ = /open/.test(type) ? "ouvert_le" : /click/.test(type) ? "clique_le" : null;
    if (!champ) continue;
    if (champ === "clique_le" && /desinscription/i.test(chaine(e.link || e.url, 2000))) continue;
    /* seulement la premiere ouverture / le premier clic */
    await A.appel("/rest/v1/emails_prospects?message_id=eq." + encodeURIComponent(id) + "&" + champ + "=is.null", { method: "PATCH", body: { [champ]: quand } });
    n++;
  }
  return { traites: n, coupes };
}
