/* ==================================================================
   [E] BOÎTE À OUTILS — helpers partagés par tous les outils
   ================================================================== */
const $  = (id) => document.getElementById(id);
const $$ = (sel, racine) => Array.from((racine || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* v42 : un identifiant de video YouTube, rien d'autre (il finit dans l'adresse d'une iframe) */
const idVideo = (id) => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
/* Un nombre absent ou illisible s'affiche « — », jamais « NaN ». */
/* en anglais : 3,288 et 79.4 (format americain) au lieu de 3 288 et 79,4 */
const locale = () => (window.__langue === "en" ? "en-US" : "fr-FR");
const fmt = (n) => isFinite(Number(n)) ? Math.round(Number(n)).toLocaleString(locale()) : "—";
const n1  = (n) => isFinite(Number(n)) ? (Math.round(Number(n)*10)/10).toLocaleString(locale(),{minimumFractionDigits:1,maximumFractionDigits:1}) : "—";
/* v60 (brief V2) — typographie francaise des nouveaux textes, a l'affichage : espace insecable avant « : ; ? ! » et a
   l'interieur des guillemets « ». En francais seulement ; les sources et le dictionnaire anglais gardent des espaces
   simples (Traduction.norm ramene toute espace a une espace simple). A appliquer au texte, avant esc(). */
const typoFr = (s) => typeof s !== "string" || window.__langue === "en" ? s : s.replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");
/* La date du jour est celle de la montre de la personne, pas celle de
   Londres. Avant, toISOString() donnait la date UTC : a Bali, avant 8 h du
   matin, on etait encore « hier » — mesures mal datees et cases « mangé »
   remises a zero a 8 h au lieu de minuit. */
const aujourdhui = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
/* Un lien saisi a la main (video d'exercice, ressource) n'est accepte que
   s'il commence par http:// ou https://. Un lien « javascript:… » colle dans
   une fiche s'executerait chez celui qui clique — le coach, qui voit tout. */
const lienSur = (u) => {
  const s = String(u == null ? "" : u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return "https://" + s;
  return "";
};
/* v50 — le lien de reservation, le meme partout. Pre-remplissage (prenom, nom et email du prospect connecte)
   seulement si CONFIG.marque.calendly_prerempli vaut true ; jamais pour le coach qui consulte une fiche. */
/* source : l'ecran d'ou part le clic (decouverte, verrou-programme…), transmis a Calendly en utm_content
   (aucune donnee personnelle) : le coach voit dans Calendly d'ou vient chaque reservation
   v61 (brief V2, F) : utm_source=app, utm_medium=bouton (coach : medium coach) ; codes d'origine avec « _ »
   (apres_questionnaire, verrou_programme… : Decouverte.ORIGINES) */
/* v52 — prenom et nom pre-remplis : name = « prenom nom » (champ « Nom » unique de Calendly ; le nom seul s'il
   manque le prenom, et inversement), first_name / last_name (evenement qui demande prenom et nom separement :
   Calendly prend ceux qui existent). Chaque valeur encodee ; aucun parametre vide. */
function paramsNomCalendly(prenom, nom){
  const pr = typeof prenom === "string" ? prenom.trim().slice(0, 80) : "", nm = typeof nom === "string" ? nom.trim().slice(0, 80) : "";
  const out = [], complet = [pr, nm].filter(Boolean).join(" ");
  if (complet) out.push("name=" + encodeURIComponent(complet));
  if (pr) out.push("first_name=" + encodeURIComponent(pr));
  if (nm) out.push("last_name=" + encodeURIComponent(nm));
  return out;
}
function lienCalendly(source){
  const base = lienSur(CONFIG.marque && CONFIG.marque.calendly); if (!base) return "";
  try {
    if (!Auth.estProspect() || Store.idConsulte) return base;
    const params = ["utm_source=app", "utm_medium=bouton"];
    if (typeof source === "string" && /^[a-z0-9_-]{1,40}$/.test(source)) params.push("utm_content=" + source);
    if (CONFIG.marque && CONFIG.marque.calendly_prerempli === true){
      const u = Auth.utilisateur(), p = Auth.profil || {};
      const email = u && typeof u.email === "string" ? u.email.trim() : "";
      params.push(...paramsNomCalendly(p.prenom, p.nom));   // v52 : + le nom (profils.nom, saisi a l'inscription)
      if (email) params.push("email=" + encodeURIComponent(email));
    }
    const i = base.indexOf("#"), avant = i > -1 ? base.slice(0, i) : base, apres = i > -1 ? base.slice(i) : "";   // les parametres avant un eventuel #
    return avant + (avant.indexOf("?") > -1 ? "&" : "?") + params.join("&") + apres;
  } catch(e){ return base; }   // un caractere mal forme ne doit jamais empecher la page de s'afficher
}
/* v51 — le lien de reservation d'un prospect, construit pour le coach (fiche) : prenom, nom (v52, 4e parametre :
   les appels a 3 parametres restent justes) et email du prospect, source « fiche-coach » (v61 : « fiche_coach »). Rend "" si Calendly n'est pas configure. */
function lienCalendlyPour(prenom, email, source, nom){
  const base = lienSur(CONFIG.marque && CONFIG.marque.calendly); if (!base) return "";
  try {
    const params = ["utm_source=app", "utm_medium=coach"];
    if (typeof source === "string" && /^[a-z0-9_-]{1,40}$/.test(source)) params.push("utm_content=" + source);
    const em = typeof email === "string" ? email.trim() : "";
    params.push(...paramsNomCalendly(prenom, nom));
    if (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(em) && em.length <= 254) params.push("email=" + encodeURIComponent(em));
    const i = base.indexOf("#"), avant = i > -1 ? base.slice(0, i) : base, apres = i > -1 ? base.slice(i) : "";
    return avant + (avant.indexOf("?") > -1 ? "&" : "?") + params.join("&") + apres;
  } catch(e){ return base; }
}
/* v52 — « écris-nous » : une phrase (clé française, traduite par trad) dont {e} devient l'adresse email du coach, en lien
   mailto (CONFIG.marque.email). Sert tant que l'app n'envoie aucun email (mot de passe oublié, changement d'adresse). */
function ecrisNous(phrase, id, classe){
  const t = trad(phrase), mail = String((CONFIG.marque && CONFIG.marque.email) || "").trim();
  const i = t.indexOf("{e}"), avant = i > -1 ? t.slice(0, i) : t, apres = i > -1 ? t.slice(i + 3) : "";
  const lien = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(mail) ? `<a href="mailto:${esc(mail)}">${esc(mail)}</a>` : "";
  return `<p class="${esc(classe || "note")}" id="${esc(id || "")}" data-notr>${esc(avant)}${lien}${esc(apres)}</p>`;
}
/* v70 — « Partager l'app » : le lien de l'app (CONFIG.marque.partage.lien, sinon l'adresse de la page sans
   son ancre). Sur telephone, la feuille de partage du systeme (Messages, WhatsApp…) ; sinon le lien est copie
   dans le presse-papier et un toast le dit ; si la copie est refusee, une fenetre montre le lien a copier. */
function lienApp(){
  const p = (CONFIG.marque && CONFIG.marque.partage) || {};
  const l = lienSur(p.lien);
  return l || (location.origin + location.pathname);
}
async function partagerApp(){
  const lien = lienApp(), p = (CONFIG.marque && CONFIG.marque.partage) || {};
  const texte = p.texte ? trad(p.texte) : "";
  if (navigator.share){
    try { await navigator.share({ title: CONFIG.marque.nom, text: texte, url: lien }); return true; }
    catch(e){ if (e && e.name === "AbortError") return false; }   // partage annule : rien a dire ; autre refus : on copie
  }
  try { await navigator.clipboard.writeText(lien); UI.toast(trad("Lien copié !"), "ok"); return true; }
  catch(e){ await UI.demander(trad("Copie ce lien :"), lien, { ok: trad("Fermer") }); return false; }
}
/* Un ecran vide doit toujours proposer quoi faire. Sans bouton, le client
   se dit que l'app ne marche pas et ne revient plus. Rien en consultation
   coach : c'est le coach lui-meme qui regarde. */
function ctaVide(profil){
  if (typeof Store !== "undefined" && Store.idConsulte) return "";
  const ig = lienSur(CONFIG.marque.instagram);
  return `<div class="cta-vide">` +
    (profil ? `<a class="btn" href="#/profil">Compléter mon profil</a>` : "") +
    (ig ? `<a class="btn ghost" href="${esc(ig)}" target="_blank" rel="noopener">Écrire à mon coach</a>` : "") +
    `</div>`;
}

