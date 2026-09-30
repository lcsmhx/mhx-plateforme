/* =====================================================================
   creer-acces — création d'un compte par le coach

   Pourquoi cette fonction existe : l'application créait les comptes avec
   POST /auth/v1/signup et la clé publique. Or cette clé est, par nature,
   dans le fichier que tout le monde télécharge. N'importe qui pouvait
   donc se créer un compte en une commande, et entrer dans l'espace —
   formation comprise. Grok Bot l'a démontré en créant un compte sonde.

   La création passe maintenant par ici. La clé de service ne quitte
   jamais le serveur, et on vérifie que l'appelant est bien un coach
   AVANT de créer quoi que ce soit. L'inscription publique peut alors
   être coupée dans Supabase sans priver Lucas de son outil.
   ===================================================================== */

const URL_SUPABASE = Deno.env.get("SUPABASE_URL")!;
const CLE_SERVICE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/* L'application est servie depuis GitHub Pages : sans ces en-têtes, le
   navigateur refuse la réponse avant même de la lire. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function repondre(corps: unknown, statut = 200){
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return repondre({ erreur: "Méthode non autorisée." }, 405);

  /* ---- 1. Qui appelle ? ---- */
  const entete = req.headers.get("Authorization") || "";
  const jeton  = entete.replace(/^Bearer\s+/i, "").trim();
  if (!jeton) return repondre({ erreur: "Il faut être connecté." }, 401);

  const rMoi = await fetch(`${URL_SUPABASE}/auth/v1/user`, {
    headers: { apikey: CLE_SERVICE, Authorization: `Bearer ${jeton}` }
  });
  if (!rMoi.ok) return repondre({ erreur: "Session expirée. Reconnecte-toi." }, 401);
  const moi = await rMoi.json();
  if (!moi?.id) return repondre({ erreur: "Session invalide." }, 401);

  /* ---- 2. Est-il coach ? ----
     On relit le rôle en base avec la clé de service : le jeton, lui, peut
     être forgé côté client, la table non. */
  const rProfil = await fetch(
    `${URL_SUPABASE}/rest/v1/profils?id=eq.${moi.id}&select=role`,
    { headers: { apikey: CLE_SERVICE, Authorization: `Bearer ${CLE_SERVICE}` } }
  );
  const profils = rProfil.ok ? await rProfil.json() : [];
  if (profils?.[0]?.role !== "coach"){
    return repondre({ erreur: "Seul un coach peut créer un accès." }, 403);
  }

  /* ---- 3. Ce qu'on nous demande ---- */
  let corps: any = {};
  try { corps = await req.json(); } catch { /* corps vide */ }
  const email  = String(corps.email || "").trim().toLowerCase();
  const mdp    = String(corps.motdepasse || "");
  const prenom = String(corps.prenom || "").trim();
  const nom    = String(corps.nom || "").trim();
  const role   = corps.role === "coach" ? "coach" : "client";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return repondre({ erreur: "Adresse email invalide." }, 400);
  if (mdp.length < 8) return repondre({ erreur: "Le mot de passe doit faire au moins 8 caractères." }, 400);

  /* ---- 4. Création ---- */
  const rCree = await fetch(`${URL_SUPABASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password: mdp,
      email_confirm: true,               // le coach transmet les identifiants de la main à la main
      user_metadata: { prenom, nom }
    })
  });
  const cree = await rCree.json();
  if (!rCree.ok){
    const m = String(cree?.msg || cree?.message || cree?.error_description || "");
    return repondre({
      erreur: /already|exist|registered/i.test(m)
        ? "Un compte existe déjà avec cette adresse."
        : (m || "Création impossible.")
    }, rCree.status === 422 ? 400 : rCree.status);
  }

  /* ---- 5. Statut et accès complet ----
     Le déclencheur on_auth_user_created a posé le profil ; depuis la v39, un
     compte créé par la base naît « prospect » (compte gratuit). Un accès créé
     par le coach est un client — ou un membre de l'équipe si le coach l'a
     explicitement voulu. On le pose ici, côté serveur, avec la clé de service
     (le déclencheur protege_role l'autorise) : ça ne dépend ni de l'onglet ni
     du réseau du coach. L'application le repose ensuite, par sécurité. */
  const poser = (champs: Record<string, string>) =>
    fetch(`${URL_SUPABASE}/rest/v1/profils?id=eq.${cree.id}`, {
      method: "PATCH",
      headers: {
        apikey: CLE_SERVICE,
        Authorization: `Bearer ${CLE_SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(champs)
    });
  /* Le compte existe désormais : quoi qu'il arrive ensuite, on renvoie son
     id (200), avec le rôle et le statut RÉELLEMENT posés, pour que l'app
     prévienne le coach si l'un des deux n'a pas pu l'être. */
  let statut: string | null = null, rolePose = "client";
  try {
    const rMaj = await poser(role === "coach" ? { statut: "client", role: "coach" } : { statut: "client" });
    if (rMaj.ok){
      const l = await rMaj.json().catch(() => []);
      statut = l?.[0]?.statut ?? null;
      rolePose = l?.[0]?.role ?? "client";
    } else if (role === "coach"){
      /* base sans colonne statut (avant la v39) : on tente au moins le rôle */
      const t = await rMaj.text().catch(() => "");
      if (/PGRST204/.test(t)){
        const r2 = await poser({ role: "coach" });
        if (r2.ok){ const l2 = await r2.json().catch(() => []); rolePose = l2?.[0]?.role ?? "client"; }
      }
    }
  } catch { /* réseau : le compte existe, statut et rôle restent ceux de la base */ }

  return repondre({ id: cree.id, email: cree.email, role: rolePose, statut });
});
