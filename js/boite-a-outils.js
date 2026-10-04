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
      /* v72 (C) : + le numéro (clé contact, deja lue au demarrage : aucune lecture ici), dans le parametre de
         CONFIG.marque.calendly_tel ; « + » encode (%2B : un « + » brut serait lu comme une espace) */
      const P = CONFIG.marque.calendly_tel, tel = Contact.telephone(Store.cache[Contact.cle]);
      if (tel && typeof P === "string" && /^(a([1-9]|10)|location)$/.test(P)) params.push(P + "=" + encodeURIComponent(tel));
    }
    const i = base.indexOf("#"), avant = i > -1 ? base.slice(0, i) : base, apres = i > -1 ? base.slice(i) : "";   // les parametres avant un eventuel #
    /* v72 (C) : un parametre deja present dans le lien colle dans la config n'est jamais remplace ni double */
    const deja = new Set(), iq = avant.indexOf("?");
    if (iq > -1) avant.slice(iq + 1).split("&").forEach(kv => { const k = kv.split("=")[0]; if (!k) return; try { deja.add(decodeURIComponent(k)); } catch(e){ deja.add(k); } });
    const libres = params.filter(x => !deja.has(x.split("=")[0]));
    if (!libres.length) return base;
    return avant + (iq > -1 ? "&" : "?") + libres.join("&") + apres;
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
/* v72 (A) — TÉLÉPHONE : un menu d'indicatif (les pays de Lucas, France par défaut, et « Autre pays ») et le numéro.
   Espaces, points et tirets ignorés, le 0 initial retiré (sauf Côte d'Ivoire : depuis 2021, le 0 fait partie du
   numéro), 6 à 14 chiffres sans l'indicatif ; enregistré au format international sans espaces (+33612345678).
   Un numéro tapé avec son indicatif (« +33 6… », « 0033 6… ») garde cet indicatif ; « Autre pays » : le numéro complet
   avec son indicatif (+…), pour ne bloquer personne. Les phrases sont des clés françaises (trad). Côté coach (coachHTML) :
   le numéro, « Appeler » (tel:+…) et « WhatsApp » (wa.me, chiffres sans le +), seulement pour un numéro bien formé :
   la clé est écrite par le compte lui-même, rien d'autre n'en sort en lien ; sinon « — ». */
const Telephone = {
  PAYS: [["33", "France (+33)"], ["32", "Belgique (+32)"], ["41", "Suisse (+41)"], ["1", "Canada (+1)"], ["61", "Australie (+61)"],
    ["225", "Côte d'Ivoire (+225)"], ["221", "Sénégal (+221)"], ["262", "La Réunion (+262)"]],
  AUTRE: "autre",
  DEFAUT: "33",
  /* un numéro enregistré : « + » puis 7 à 17 chiffres (indicatif de 1 à 3 chiffres + 6 à 14) */
  valide(t){ return typeof t === "string" && /^\+[1-9]\d{6,16}$/.test(t); },
  /* ind : indicatif du menu ("33"…) ou "autre" ; saisie : ce qui est tapé. Rend { tel } ou { erreur } (clé française) */
  normaliser(ind, saisie){
    let s = String(saisie == null ? "" : saisie).replace(/[\s.\-  ]/g, "");
    if (!s) return { erreur: "Indique ton numéro." };
    let code = this.PAYS.some(p => p[0] === ind) ? ind : ind === this.AUTRE ? this.AUTRE : this.DEFAUT;
    if (/^(\+|00)/.test(s)){
      s = s.replace(/^(\+|00)/, "");
      if (!/^\d+$/.test(s)) return { erreur: "Un numéro ne contient que des chiffres." };
      /* l'indicatif tapé l'emporte : celui du menu, sinon un pays de la liste (le plus long d'abord), sinon « Autre pays » */
      const connus = this.PAYS.map(p => p[0]).sort((a, b) => b.length - a.length);
      const c = code !== this.AUTRE && s.indexOf(code) === 0 ? code : connus.find(k => s.indexOf(k) === 0);
      if (c){ code = c; s = s.slice(c.length); }
      else code = this.AUTRE;
    } else if (code === this.AUTRE) return { erreur: "Avec « Autre pays », tape ton numéro avec son indicatif, par exemple +212 6 12 34 56 78." };
    if (!/^\d+$/.test(s)) return { erreur: "Un numéro ne contient que des chiffres." };
    if (code === this.AUTRE){
      if (s.length < 7 || s[0] === "0") return { erreur: "Ce numéro est trop court : 6 chiffres au moins, sans l'indicatif." };
      if (s.length > 17) return { erreur: "Ce numéro est trop long : 14 chiffres au plus, sans l'indicatif." };
      return { tel: "+" + s };
    }
    if (code !== "225") s = s.replace(/^0/, "");
    if (code === "1" && s.length === 11 && s[0] === "1") s = s.slice(1);   // Canada : le « 1 » national devant les 10 chiffres
    if (s.length < 6) return { erreur: "Ce numéro est trop court : 6 chiffres au moins, sans l'indicatif." };
    if (s.length > 14) return { erreur: "Ce numéro est trop long : 14 chiffres au plus, sans l'indicatif." };
    return { tel: "+" + code + s };
  },
  /* pour pré-remplir le champ : { ind, num } (le pays de la liste le plus long qui correspond, sinon « Autre pays ») */
  decouper(t){
    if (!this.valide(t)) return { ind: this.DEFAUT, num: "" };
    const c = this.PAYS.map(p => p[0]).sort((a, b) => b.length - a.length).find(k => t.slice(1).indexOf(k) === 0);
    return c ? { ind: c, num: t.slice(1 + c.length) } : { ind: this.AUTRE, num: t };
  },
  /* le menu (id + "-ind") et le champ (id) ; tel : un numéro enregistré, pour pré-remplir */
  champHTML(id, tel){
    const d = this.decouper(tel), opt = (v, l) => `<option value="${esc(v)}"${v === d.ind ? " selected" : ""}>${esc(trad(l))}</option>`;
    return `<div class="tel-ligne"><select id="${esc(id)}-ind" aria-label="${esc(trad("Indicatif du pays"))}">${this.PAYS.map(p => opt(p[0], p[1])).join("")}${opt(this.AUTRE, "Autre pays")}</select>`
      + `<input id="${esc(id)}" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="06 12 34 56 78" value="${esc(d.num)}"></div>`;
  },
  /* lecture du champ : { tel } ou { erreur } */
  lire(id){ const i = $(id + "-ind"), c = $(id); return this.normaliser(i ? i.value : this.DEFAUT, c ? c.value : ""); },
  /* côté coach (écrans non traduits) : le numéro et ses deux liens, ou « — » */
  coachHTML(t, classe){
    if (!this.valide(t)) return '<span class="meta">—</span>';
    const c = esc(classe || "btn ghost petit");
    return `<span class="tel-coach"><span class="tel-num" data-notr>${esc(t)}</span> <a class="${c}" href="tel:${esc(t)}">Appeler</a> <a class="${c}" href="https://wa.me/${esc(t.slice(1))}" target="_blank" rel="noopener">WhatsApp</a></span>`;
  }
};
/* v72 (D) — « Écrire à Lucas sur WhatsApp » (prospect connecté, jamais une fiche consultée) : https://wa.me/<chiffres du numéro
   de CONFIG.marque.whatsapp>?text=<message encodé, avec son prénom>. Numéro vide ou mal formé (il doit commencer par +),
   texte absent : "" (pas de bouton). Le message n'est jamais retouché par la typographie française (il part tel quel). */
function lienWhatsApp(){
  try {
    if (!Auth.estProspect() || Store.idConsulte) return "";
    const brut = String((CONFIG.marque && CONFIG.marque.whatsapp) || "").trim();
    if (!/^\+/.test(brut)) return "";
    const n = brut.slice(1).replace(/[\s.()-]/g, "");
    if (!/^[1-9]\d{7,14}$/.test(n)) return "";
    const L = DECOUVERTE.whatsapp || {};
    if (![L.bouton, L.message, L.message_sans_prenom].every(x => typeof x === "string" && x.trim())) return "";
    const p = Auth.profil && typeof Auth.profil.prenom === "string" ? Array.from(Auth.profil.prenom.replace(/\s+/g, " ").trim()).slice(0, 60).join("") : "";
    let texte;
    try { texte = encodeURIComponent(p ? trad(L.message, { p }) : trad(L.message_sans_prenom)); }
    catch(e){ texte = encodeURIComponent(trad(L.message_sans_prenom)); }
    return "https://wa.me/" + n + "?text=" + texte;
  } catch(e){ return ""; }
}
/* le bouton (secondaire, dans son propre bloc, hors du cadre « verrou » et sans data-dc-cal : ce n'est pas une réservation) */
function boutonWhatsApp(classe){
  const l = lienWhatsApp(); if (!l) return "";
  return `<div class="actions ${esc(classe || "")}"><a class="btn ghost" href="${esc(l)}" target="_blank" rel="noopener" data-wa>${esc(trad(DECOUVERTE.whatsapp.bouton))}</a></div>`;
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

