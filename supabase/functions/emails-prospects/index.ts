// Fonction Supabase « emails-prospects » : emails de suivi des prospects (Brevo).
// Toute la logique est dans logique.js (testée avec Node : node supabase/functions/emails-prospects/test.mjs).
//
// Trois entrées, sans jeton de connexion Supabase (déployer avec --no-verify-jwt, voir supabase/README.md) :
//   POST  (en-tête x-mhx-cron = CRON_SECRET)                  → un passage : calcule et envoie les emails dus
//   GET   ?action=desinscription&u=<id>&t=<signature>          → lien « Ne plus recevoir ces emails »
//   POST  ?action=brevo&cle=<BREVO_WEBHOOK_SECRET>             → ouvertures et clics renvoyés par Brevo
//
// Secrets (supabase secrets set …) : BREVO_API_KEY, EXPEDITEUR_EMAIL, APP_URL, FONCTION_URL,
// CRON_SECRET, DESINSCRIPTION_SECRET, BREVO_WEBHOOK_SECRET ; facultatifs : EXPEDITEUR_NOM,
// REPONSE_EMAIL, MARQUE, CONTACT, SIGNATAIRE. SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis
// par Supabase. Aucune clé n'est écrite dans le dépôt.

import { executer, desinscrire, pageDesinscription, evenementBrevo } from "./logique.js";

const json = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });

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
    if (req.method === "GET" && action === "desinscription") {
      const r = await desinscrire({ fetch, env, uid: url.searchParams.get("u") || "", jeton: url.searchParams.get("t") || "" });
      return new Response(pageDesinscription(r.ok, env.MARQUE || "MHX Coaching", env.APP_URL || ""), {
        status: r.ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    // désinscription « en un clic » demandée par les messageries (en-tête List-Unsubscribe-Post)
    if (req.method === "POST" && action === "desinscription") {
      const r = await desinscrire({ fetch, env, uid: url.searchParams.get("u") || "", jeton: url.searchParams.get("t") || "" });
      return json({ ok: r.ok }, r.ok ? 200 : 400);
    }
    if (req.method === "POST" && action === "brevo") {
      if (!egal(url.searchParams.get("cle"), env.BREVO_WEBHOOK_SECRET)) return json({ erreur: "non autorisé" }, 401);
      const corps = await req.json().catch(() => null);
      if (!corps) return json({ erreur: "corps illisible" }, 400);
      return json(await evenementBrevo({ fetch, env, corps }));
    }
    if (req.method === "POST" && !action) {
      if (!egal(req.headers.get("x-mhx-cron"), env.CRON_SECRET)) return json({ erreur: "non autorisé" }, 401);
      return json(await executer({ fetch, env, maintenant: new Date() }));
    }
    return json({ erreur: "requête inconnue" }, 404);
  } catch (e) {
    // le détail part dans les journaux de la fonction, pas dans la réponse
    console.error("[emails-prospects]", e instanceof Error ? e.message : e);
    return json({ erreur: "erreur interne" }, 500);
  }
});
