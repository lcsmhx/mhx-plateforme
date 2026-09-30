/* =====================================================================
   supprimer-acces — effacer un compte et tout ce qui va avec

   Deux usages, un seul chemin :
   - le client supprime SON compte (droit à l'effacement, RGPD art. 17)
   - le coach supprime le compte de quelqu'un

   On efface vraiment : les photos (v41), les donnees, le profil, puis
   l'utilisateur. Pas de « compte désactivé » qui garderait tout en base —
   ce serait mentir sur ce que le bouton fait.
   ===================================================================== */

const URL_SUPABASE = Deno.env.get("SUPABASE_URL")!;
const CLE_SERVICE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const repondre = (c: unknown, s = 200) =>
  new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const service = (chemin: string, init: RequestInit = {}) =>
  fetch(`${URL_SUPABASE}${chemin}`, {
    ...init,
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

/* Tout ce qui est range sous <dossier>/ dans le bucket photos (sous-dossiers
   compris), par pages de 1 000. null = on ne sait pas (on n'efface rien). */
async function lister(dossier: string, profondeur = 0): Promise<string[] | null> {
  const chemins: string[] = [];
  for (let page = 0; page < 50; page++){
    const r = await service(`/storage/v1/object/list/photos`, {
      method: "POST",
      body: JSON.stringify({ prefix: dossier + "/", limit: 1000, offset: page * 1000, sortBy: { column: "name", order: "asc" } })
    });
    if (!r.ok){
      const t = await r.text().catch(() => "");
      return /bucket not found/i.test(t) ? chemins : null;   // pas de bucket : aucune photo
    }
    const l = await r.json().catch(() => null);
    if (!Array.isArray(l)) return null;
    for (const f of l){
      if (!f?.name) continue;
      const chemin = `${dossier}/${f.name}`;
      if (f.id == null){                                   // un sous-dossier
        if (profondeur >= 3) return null;
        const sous = await lister(chemin, profondeur + 1);
        if (!sous) return null;
        chemins.push(...sous);
      } else chemins.push(chemin);
    }
    if (l.length < 1000) return chemins;
  }
  return null;
}

async function supprimerPhotos(uid: string): Promise<boolean> {
  const chemins = await lister(uid);
  if (!chemins) return false;
  for (let i = 0; i < chemins.length; i += 500){
    const r = await service(`/storage/v1/object/photos`, { method: "DELETE", body: JSON.stringify({ prefixes: chemins.slice(i, i + 500) }) });
    if (!r.ok) return false;
  }
  if (!chemins.length) return true;
  /* on verifie : plus rien sous <uid>/, sinon on ne touche pas au reste */
  const reste = await lister(uid);
  return !!reste && reste.length === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return repondre({ erreur: "Méthode non autorisée." }, 405);

  const jeton = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jeton) return repondre({ erreur: "Il faut être connecté." }, 401);

  const rMoi = await fetch(`${URL_SUPABASE}/auth/v1/user`, {
    headers: { apikey: CLE_SERVICE, Authorization: `Bearer ${jeton}` }
  });
  if (!rMoi.ok) return repondre({ erreur: "Session expirée. Reconnecte-toi." }, 401);
  const moi = await rMoi.json();
  if (!moi?.id) return repondre({ erreur: "Session invalide." }, 401);

  let corps: any = {};
  try { corps = await req.json(); } catch { /* corps vide */ }
  const cible = String(corps.id || moi.id).toLowerCase();   // les dossiers Storage portent l'id en minuscules
  /* v41 : un identifiant de compte, rien d'autre (il finit dans des adresses
     de l'API et dans le dossier des photos a vider). */
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cible)){
    return repondre({ erreur: "Compte introuvable." }, 400);
  }

  /* Supprimer quelqu'un d'autre demande d'être coach. */
  if (cible !== moi.id){
    const r = await service(`/rest/v1/profils?id=eq.${moi.id}&select=role`);
    const l = r.ok ? await r.json() : [];
    if (l?.[0]?.role !== "coach") return repondre({ erreur: "Seul un coach peut supprimer un autre compte." }, 403);
  }

  /* Garde-fou : ne pas se retrouver sans aucun coach. Un espace sans coach,
     c'est un espace que plus personne ne peut administrer. */
  const rCible = await service(`/rest/v1/profils?id=eq.${cible}&select=role,prenom,nom`);
  const profil = rCible.ok ? (await rCible.json())?.[0] : null;
  if (profil?.role === "coach"){
    const rC = await service(`/rest/v1/profils?role=eq.coach&select=id`);
    const coachs = rC.ok ? await rC.json() : [];
    if (coachs.length <= 1) return repondre({ erreur: "C'est le dernier compte coach : il ne peut pas être supprimé." }, 400);
  }

  /* La confirmation écrite est demandée à l'écran ; on la revérifie ici, pour
     qu'un appel direct ne puisse pas sauter l'étape. */
  if (String(corps.confirmation || "").trim().toUpperCase() !== "SUPPRIMER"){
    return repondre({ erreur: "Confirmation manquante." }, 400);
  }

  /* v41 : les photos de progression vivent dans Storage (dossier <id>/ du
     bucket photos) : la suppression en cascade de la base ne les atteint pas.
     On les efface d'abord ; si c'est impossible, on s'arrete AVANT de toucher
     au reste, pour ne jamais laisser des photos sans proprietaire. */
  if (!(await supprimerPhotos(cible))){
    return repondre({ erreur: "Les photos n'ont pas pu être effacées : rien n'a été supprimé. Réessaie." }, 500);
  }

  await service(`/rest/v1/donnees?user_id=eq.${cible}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  await service(`/rest/v1/bibliotheque?coach_id=eq.${cible}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  await service(`/rest/v1/profils?id=eq.${cible}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

  const rSup = await service(`/auth/v1/admin/users/${cible}`, { method: "DELETE" });
  if (!rSup.ok && rSup.status !== 404){
    const d = await rSup.json().catch(() => ({}));
    return repondre({ erreur: String(d?.msg || d?.message || "Suppression incomplète.") }, 500);
  }

  return repondre({ supprime: cible, soi_meme: cible === moi.id });
});
