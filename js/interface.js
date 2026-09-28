/* Les dates sont stockees au format ISO (2026-08-29) parce que c'est le seul
   qui se trie correctement. On les affiche a la francaise. */
const dateFr = (iso) => {
  if (!iso) return "—";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return esc(String(iso));   // jamais une valeur brute dans du HTML
  return window.__langue === "en" ? m[2] + "/" + m[3] + "/" + m[1] : m[3] + "/" + m[2] + "/" + m[1];   // US : mois/jour/annee
};

function flash(id, texte){
  const e = $(id); if(!e) return;
  e.textContent = texte;
  setTimeout(() => { if (e.textContent === texte) e.textContent = ""; }, 3200);
}

/* --- ICONES (v33) -----------------------------------------------------------
   Quelques pictogrammes en SVG, dessines en trait, qui prennent la couleur du
   texte. Pas d'emoji : ils changent d'un telephone a l'autre. */
const SVG = {
  soleil: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  lune:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  cadenas:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  croix:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
/* Une icone par outil (cle = id de l'outil). En trait, 24x24, couleur du texte. */
const ICONES = {
  accueil:      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  programme:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7v10M18 7v10M2.5 9.5v5M21.5 9.5v5M6 12h12"/></svg>',
  nutrition:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M12 12V7"/><path d="M12 7c1.2-2.4 3.6-3 6-2-1.2 2.6-3.6 3.4-6 2z"/></svg>',
  mensurations: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  bilan:        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M9 13l2 2 4-4"/></svg>',
  suivi:        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M9 13l2 2 4-4"/></svg>',
  formation:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2.2 9 2.2 12 0v-4.5"/><path d="M22 9v5"/></svg>',
  complements:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M8.5 15.5l7-7"/></svg>',
  profil:       '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
  clients:      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><circle cx="17" cy="9" r="3"/><path d="M17.5 14.5c2.8 0 4.5 2.2 4.5 5"/></svg>',
  atelier:      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  bibliotheque: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
  catalogue:    '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  calculateur:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2 0 2 1 3.2 2.2 3.2C10.5 9 11 6 12 3z"/></svg>',
  entrainement: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  journal:      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z"/><path d="M5 17a2 2 0 0 1 2-2h12"/><path d="M9 7h6M9 10.5h4"/></svg>',
  prospects:    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  plus:         '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
};

/* --- THEME (v33) ------------------------------------------------------------
   Le sombre est le theme de l'application. Le clair est un choix, range sur
   l'appareil (comme la banniere d'installation) : il ne concerne que lui. */
const Theme = {
  cle: "mhx_theme",
  actuel: "dark",
  charger(){
    try { this.actuel = localStorage.getItem(this.cle) === "light" ? "light" : "dark"; } catch(e){ this.actuel = "dark"; }
    this.appliquer();
    return this.actuel;
  },
  appliquer(){
    if (this.actuel === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", this.actuel === "light" ? "#f1f2f4" : "#07090d");
  },
  basculer(){
    this.actuel = this.actuel === "light" ? "dark" : "light";
    try { localStorage.setItem(this.cle, this.actuel); } catch(e){}
    this.appliquer();
    this.majBoutons();
  },
  /* tous les boutons de theme de la page (barre du haut, ecran de connexion) */
  majBoutons(){
    $$("[data-theme-bouton]").forEach(b => {
      b.innerHTML = this.actuel === "light" ? SVG.lune : SVG.soleil;
      b.title = trad(this.actuel === "light" ? "Passer en sombre" : "Passer en clair");
      b.setAttribute("aria-label", b.title);
      b.onclick = () => Theme.basculer();
    });
  }
};
Theme.charger();

/* --- FENETRES, VOLET, TOASTS (v33) ------------------------------------------
   Remplacent alert / confirm / prompt du navigateur : memes usages, meme
   logique (Annuler ou Echap = rien ne se passe), mais dans le style de
   l'application, utilisables au doigt et traduisibles. Chaque fonction
   renvoie une promesse :  if (!(await UI.confirmer("…"))) return;  */
const UI = {
  _ouverte: null,

  fermer(valeur){
    const o = this._ouverte; if (!o) return;
    this._ouverte = null;
    document.removeEventListener("keydown", o.clavier);
    o.fond.remove();
    document.body.classList.remove("figee");
    if (o.focusAvant && o.focusAvant.focus){ try { o.focusAvant.focus(); } catch(e){} }
    o.resoudre(valeur);
  },

  /* o = { titre, corps, html, champ:{type, valeur, placeholder}, boutons:[{texte, valeur, classe, principal, champ}],
           annulation (valeur rendue si on ferme sans choisir), volet, fermable } */
  ouvrir(o){
    return new Promise(resoudre => {
      if (this._ouverte) this.fermer(this._ouverte.annulation);
      const fond = document.createElement("div");
      fond.className = "fond" + (o.volet ? " volet-fond" : "");
      const boite = document.createElement("div");
      boite.className = o.volet ? "volet" : "modale";
      boite.setAttribute("role", "dialog"); boite.setAttribute("aria-modal", "true");
      const boutons = o.boutons || [];
      let h = "";
      if (o.volet) h += `<button type="button" class="del fermer-volet" data-ui-fermer aria-label="Fermer">${SVG.croix}</button>`;
      if (o.titre) h += `<h2>${esc(o.titre)}</h2>`;
      if (o.corps) h += `<div class="corps">${o.html ? o.corps : esc(o.corps)}</div>`;
      if (o.champ) h += `<div class="champ"><input id="ui-champ" type="${esc(o.champ.type || "text")}" value="${esc(o.champ.valeur || "")}" placeholder="${esc(o.champ.placeholder || "")}" autocomplete="off"></div>`;
      if (boutons.length) h += `<div class="actions">${boutons.map((b, i) => `<button type="button" class="btn${b.classe ? " " + b.classe : ""}" data-ui-b="${i}">${esc(b.texte)}</button>`).join("")}</div>`;
      boite.innerHTML = h;
      fond.appendChild(boite);
      const valeur = b => { if (b.champ){ const c = boite.querySelector("#ui-champ"); return c ? c.value : ""; } return b.valeur; };
      const clavier = ev => {
        if (ev.key === "Escape"){ ev.preventDefault(); this.fermer(o.annulation); return; }
        if (ev.key === "Enter" && !(ev.target && ev.target.tagName === "TEXTAREA")){
          const p = boutons.find(b => b.principal);
          if (p){ ev.preventDefault(); this.fermer(valeur(p)); }
        }
      };
      fond.addEventListener("click", ev => { if (ev.target === fond && o.fermable !== false) this.fermer(o.annulation); });
      const f = boite.querySelector("[data-ui-fermer]");
      if (f) f.addEventListener("click", () => this.fermer(o.annulation));
      $$("[data-ui-b]", boite).forEach(b => b.addEventListener("click", () => this.fermer(valeur(boutons[+b.dataset.uiB]))));
      document.addEventListener("keydown", clavier);
      document.body.appendChild(fond);
      document.body.classList.add("figee");
      this._ouverte = { fond, clavier, resoudre, annulation: o.annulation, focusAvant: document.activeElement };
      const champ = boite.querySelector("#ui-champ"), principal = boite.querySelector(".btn:not(.ghost)");
      setTimeout(() => { if (champ){ champ.focus(); champ.select(); } else if (principal) principal.focus(); }, 30);
    });
  },

  /* confirm() : renvoie true ou false */
  confirmer(texte, opts){
    opts = opts || {};
    return this.ouvrir({ titre: opts.titre || "", corps: texte, annulation: false, boutons: [
      { texte: opts.annuler || trad("Annuler"), valeur: false, classe: "ghost" },
      { texte: opts.ok || trad("Confirmer"), valeur: true, classe: opts.danger ? "danger" : "", principal: true }
    ] });
  },
  /* prompt() : renvoie le texte saisi, ou null si on annule */
  demander(texte, defaut, opts){
    opts = opts || {};
    return this.ouvrir({ titre: opts.titre || "", corps: texte, annulation: null,
      champ: { type: opts.type || "text", valeur: defaut || "", placeholder: opts.placeholder || "" }, boutons: [
      { texte: opts.annuler || trad("Annuler"), valeur: null, classe: "ghost" },
      { texte: opts.ok || trad("Valider"), champ: true, classe: opts.danger ? "danger" : "", principal: true }
    ] });
  },
  /* alert() */
  alerte(texte, opts){
    opts = opts || {};
    return this.ouvrir({ titre: opts.titre || "", corps: texte, boutons: [ { texte: opts.ok || trad("OK"), principal: true } ] });
  },
  /* volet lateral (contenu html), ferme par la croix, Echap ou un clic a cote */
  volet(o){ return this.ouvrir(Object.assign({ volet: true, html: true }, o)); },

  /* petit message en bas d'ecran, qui s'efface seul. type : ok | attention | mauvais */
  toast(texte, type, duree){
    let z = $("toasts");
    if (!z){ z = document.createElement("div"); z.id = "toasts"; z.className = "toasts"; z.setAttribute("aria-live", "polite"); document.body.appendChild(z); }
    const t = document.createElement("div");
    t.className = "toast" + (type ? " " + type : "");
    t.textContent = texte;
    z.appendChild(t);
    setTimeout(() => { t.classList.add("sortie"); setTimeout(() => t.remove(), 350); }, duree || 3200);
    return t;
  },

  /* etat verrouille : ce que la personne obtiendrait avec l'accompagnement */
  verrou(o){
    return `<div class="verrou"><div class="cadenas">${SVG.cadenas}</div>
      <h2>${esc(o.titre || "")}</h2><p>${esc(o.texte || "")}</p>
      ${o.lien ? `<div class="actions"><a class="btn" href="${esc(lienSur(o.lien))}" target="_blank" rel="noopener">${esc(o.cta || "")}</a></div>` : ""}
    </div>`;
  }
};

