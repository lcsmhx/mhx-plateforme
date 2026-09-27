// Fonction Supabase « emails-prospects » : emails de suivi des prospects (Brevo).
// Toute la logique est dans logique.js (testée avec Node : node supabase/functions/emails-prospects/test.mjs).
//
// Entrées, sans jeton de connexion Supabase (déployer avec --no-verify-jwt, voir supabase/README.md) :
//   POST  (en-tête x-mhx-cron = CRON_SECRET)                  → un passage : calcule et envoie les emails dus
//   POST  ?action=desinscription&u=<id>&t=<signature>          → désinscription : bouton de la page desinscription.html
//                                                                (GitHub Pages)
//   GET   ?action=desinscription&u=…&t=…                       → renvoie (303) vers la page de confirmation : Supabase
//                                                                sert le HTML des fonctions en texte brut, et un GET
//                                                                (antivirus qui visite les liens) ne désinscrit personne
//   POST  ?action=brevo&cle=<BREVO_WEBHOOK_SECRET>             → événements Brevo (ouvertures, clics, désinscriptions,
//                                                                plaintes, rebonds)
//
// Secrets (supabase secrets set …) : BREVO_API_KEY, EXPEDITEUR_EMAIL, APP_URL, FONCTION_URL,
// CRON_SECRET, DESINSCRIPTION_SECRET, BREVO_WEBHOOK_SECRET ; facultatifs : EXPEDITEUR_NOM,
// REPONSE_EMAIL, MARQUE, CONTACT, SIGNATAIRE. SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis
// par Supabase. Aucune clé n'est écrite dans le dépôt.

import { executer, desinscrire, evenementBrevo, lienPageDesinscription } from "./logique.js";

const json = (corps: unknown, statut = 200, entetes: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), { status: statut, headers: Object.assign({ "Content-Type": "application/json" }, entetes) });

// la page de confirmation (même origine que l'app) peut lire la réponse de la désinscription
function cors(env: Record<string, string>): Record<string, string> {
  let origine = "";
  try { origine = new URL(env.APP_URL || "").origin; } catch (_) { origine = ""; }
  return origine ? { "Access-Control-Allow-Origin": origine, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" } : {};
}

// comparaison à temps constant des secrets reçus
function egal(a: string | null, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req: Request) => {
  const env = Deno.env.toObject();
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  try {
    if (req.method === "OPTIONS" && action === "desinscription") return new Response(null, { status: 204, headers: cors(env) });
    if (req.method === "GET" && action === "desinscription") {
      if (!env.APP_URL) return json({ erreur: "APP_URL manquant" }, 500);
      const cible = lienPageDesinscription(env.APP_URL, (url.searchParams.get("u") || "").slice(0, 80), (url.searchParams.get("t") || "").slice(0, 80));
      return new Response(null, { status: 303, headers: { Location: cible } });
    }
    // bouton de la page de confirmation
    if (req.method === "POST" && action === "desinscription") {
      const r = await desinscrire({ fetch, env, uid: url.searchParams.get("u") || "", jeton: url.searchParams.get("t") || "" });
      return json({ ok: r.ok }, r.ok ? 200 : 400, cors(env));
    }
    if (req.method === "POST" && action === "brevo") {
      if (!egal(url.searchParams.get("cle"), env.BREVO_WEBHOOK_SECRET)) return json({ erreur: "non autorisé" }, 401);
      const corps = await req.json().catch(() => null);
      if (!corps) return json({ erreur: "corps illisible" }, 400);
      return json(await evenementBrevo({ fetch, env, corps }));
    }
    if (req.method === "POST" && !action) {
      if (!egal(req.headers.get("x-mhx-cron"), env.CRON_SECRET)) return json({ erreur: "non autorisé" }, 401);
      const bilan = await executer({ fetch, env, maintenant: new Date() });
      // visible dans Supabase → Edge Functions → emails-prospects → Logs (des nombres, pas d'adresse)
      console.log("[emails-prospects] passage", JSON.stringify({ prospects: bilan.prospects, dus: bilan.dus, envoyes: bilan.envoyes, echecs: bilan.echecs, abandons: bilan.abandons, reportes: bilan.reportes, arret: bilan.arret }));
      if (bilan.arret) console.error("[emails-prospects] passage arrêté :", bilan.arret);
      return json(bilan);
    }
    return json({ erreur: "requête inconnue" }, 404);
  } catch (e) {
    // le détail part dans les journaux de la fonction, pas dans la réponse
    console.error("[emails-prospects]", e instanceof Error ? e.message : e);
    // la page de désinscription doit pouvoir lire l'erreur (sinon elle croirait à une coupure réseau)
    return json({ erreur: "erreur interne" }, 500, action === "desinscription" ? cors(env) : {});
  }
});
