/* ------------------------------------------------------------------
   v79 — JOURNAL ALIMENTAIRE (#/journal-alimentaire, clé journal_alimentaire).
   Gratuit, ouvert à tous les comptes (prospects et clients), derrière l'interrupteur CONFIG.nouveautes.journal_alimentaire
   (« test » : coach et comptes de test ; « tous » : tout le monde) et, pour un prospect, derrière l'accord santé
   (Sante.ECRANS, Sante.bloque). Le coach le lit dans la fiche d'un client ou d'un prospect : la même page, en lecture
   seule, avec un résumé sur 7 jours (rien n'y écrit : ni MODIFIABLES, ni la liste des clés du coach, ni la base).

   Stockage : UN document par compte, compact (mesuré : un an d'usage quotidien soutenu tient bien sous le plafond
   prospect de 256 Ko, voir supabase/releve-2026-09-30/INVENTAIRE-CLES.md) :
     { v: 1,
       a: [[id du catalogue, kcal, prot, gluc, lip (pour 100 g, figés au dernier ajout), nom FR], …]   // un aliment, une fois
       j: { "AAAA-MM-JJ": [[repas (0 à 3, REPAS), n° dans a (-1 = ajout rapide), grammes (kcal si -1)], …] } }
   Les totaux se recalculent depuis « a » : l'accueil et la vue du coach n'ont pas besoin du catalogue. Tout ce qui est
   lu est vérifié (le compte peut écrire n'importe quoi par l'API) : une ligne illisible est ignorée, jamais une erreur,
   et le rendu échappe tout (esc) — le coach lit ces noms.
   Recherche : moteur repris du matériel préparé pour le journal (accents, pluriels, fautes de frappe, synonymes,
   aliments courants d'abord), sur le catalogue (Catalogue.aliments) et JOURNAL_ALIMENTS (js/journalAliments.js).
   ------------------------------------------------------------------ */
const JournalAlim = {
  cle: "journal_alimentaire",
  interrupteur: "journal_alimentaire",
  /* l'ordre de l'écran ; le numéro est rangé dans chaque ligne : ne jamais réordonner, seulement ajouter à la fin */
  REPAS: ["Petit-déjeuner", "Déjeuner", "Dîner", "Collations"],
  AJOUT_A: ["Ajouter au petit-déjeuner", "Ajouter au déjeuner", "Ajouter au dîner", "Ajouter aux collations"],
  MAX_LIGNES: 60,          // lignes par jour au plus
  MAX_GRAMMES: 3000,       // une ligne : 3 kg au plus
  MAX_KCAL: 10000,         // un ajout rapide : 10 000 kcal au plus

  vide(){ return { v: 1, a: [], j: {} }; },
  donnees(){ return typeof JOURNAL_ALIMENTS !== "undefined" && JOURNAL_ALIMENTS && typeof JOURNAL_ALIMENTS === "object" ? JOURNAL_ALIMENTS : { c: {}, pn: {}, px: [] }; },
  en(){ return window.__langue === "en"; },

  /* ---------- visibilité (interrupteur) ---------- */
  visible(){ return Interrupteurs.visible(this.interrupteur); },
  pourCompte(uid){ return Interrupteurs.pourCompte(this.interrupteur, uid); },

  /* ---------- dates (la date du téléphone de la personne, comme aujourdhui()) ---------- */
  jourValide(s){ return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T12:00:00").getTime()); },
  iso(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
  decaler(iso, n){ const [y, m, d] = iso.split("-").map(Number); return this.iso(new Date(y, m - 1, d + n, 12)); },
  /* la barre de date : un titre court (« Aujourd'hui », « Hier », sinon le jour de la semaine) et la date dessous : deux
     lignes qui tiennent à 320 px dans les deux langues */
  libelleJour(iso, consultation){
    const T = t => consultation ? t : trad(t), auj = aujourdhui();
    if (iso === auj) return T("Aujourd'hui");
    if (iso === this.decaler(auj, -1)) return T("Hier");
    return this.format(iso, consultation, { weekday: "long" });
  },
  sousJour(iso, consultation){
    const auj = aujourdhui(), proche = iso === auj || iso === this.decaler(auj, -1);
    return this.format(iso, consultation, proche ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });
  },
  format(iso, consultation, o){
    const [y, m, d] = iso.split("-").map(Number);
    const t = new Date(y, m - 1, d, 12).toLocaleDateString(consultation ? "fr-FR" : locale(), o);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  /* le repas probable à cette heure (bouton « Ajouter » de l'accueil) */
  repasDeLHeure(){ const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? 0 : h < 15 ? 1 : h < 18 ? 3 : 2; },

  /* ---------- lecture prudente du document ---------- */
  nb(v){ return typeof v === "number" && isFinite(v) ? v : null; },
  remettre(JA){
    /* le document lu, remis d'aplomb SANS rien retirer de lisible : a = liste, j = objet (Forme les garantit déjà) */
    if (!JA || typeof JA !== "object") return this.vide();
    if (!Array.isArray(JA.a)) JA.a = [];
    if (!JA.j || typeof JA.j !== "object" || Array.isArray(JA.j)) JA.j = {};
    if (JA.v == null) JA.v = 1;
    return JA;
  },
  aliment(JA, i){
    const x = JA && Array.isArray(JA.a) ? JA.a[i] : null;
    if (!Array.isArray(x) || typeof x[0] !== "string" || !x[0]) return null;
    const v = [1, 2, 3, 4].map(n => this.nb(x[n]));
    if (v.some(n => n === null || n < 0 || n > 1000)) return null;
    return { id: x[0].slice(0, 200), kcal: v[0], p: v[1], g: v[2], l: v[3], nom: typeof x[5] === "string" ? x[5].slice(0, 120) : "" };
  },
  /* les lignes lisibles d'un jour, avec leur place (k) dans la liste rangée et leurs valeurs */
  lignes(JA, iso){
    const brut = JA && JA.j && Array.isArray(JA.j[iso]) ? JA.j[iso].slice(0, 200) : [];   // 60 écrites au plus par l'app
    const out = [];
    brut.forEach((x, k) => {
      if (!Array.isArray(x)) return;
      const r = x[0], i = x[1], q = this.nb(x[2]);
      if (!Number.isInteger(r) || r < 0 || r >= this.REPAS.length || !Number.isInteger(i) || q === null || q <= 0) return;
      if (i === -1){ if (q > this.MAX_KCAL) return; out.push({ k, r, i, q, al: null, kcal: q, p: 0, g: 0, l: 0 }); return; }
      const al = this.aliment(JA, i);
      if (!al || q > this.MAX_GRAMMES) return;
      const f = q / 100;
      out.push({ k, r, i, q, al, kcal: al.kcal * f, p: al.p * f, g: al.g * f, l: al.l * f });
    });
    return out;
  },
  totaux(L){ return L.reduce((t, x) => ({ kcal: t.kcal + x.kcal, p: t.p + x.p, g: t.g + x.g, l: t.l + x.l }), { kcal: 0, p: 0, g: 0, l: 0 }); },
  jours(JA){ return Object.keys((JA && JA.j) || {}).filter(d => this.jourValide(d)).sort(); },
  dernierJour(JA){ const l = this.jours(JA).filter(d => this.lignes(JA, d).length); return l.length ? l[l.length - 1] : null; },

  /* ---------- l'objectif du jour ----------
     O = { repas, calc, calc_perso } (lecture seule). Client : l'objectif fixé par le coach dans sa diète (repas.cible),
     sinon celui de son calculateur (calc_perso, puis le calcul préparé par le coach, calc), avec le plancher automatique
     (outilCalculateur.objectif). Prospect : son calculateur seulement (sa page Nutrition est verrouillée). null : aucun. */
  objectif(O, prospect){
    O = O || {};
    const R = O.repas, ci = R && typeof R === "object" && !Array.isArray(R) ? R.cible : null;
    if (!prospect && ci && typeof ci === "object" && num(ci.kcal) > 0 && num(ci.kcal) < 20000){
      const m = k => num(ci[k]) > 0 && num(ci[k]) < 2000 ? num(ci[k]) : null;
      return { kcal: num(ci.kcal), p: m("prot"), g: m("gluc"), l: m("lip"), source: "coach", plancher: false };
    }
    for (const k of ["calc_perso", "calc"]){
      const o = outilCalculateur.objectif(O[k]);
      if (o) return Object.assign({ source: k }, o);   // calc_perso : son calculateur ; calc : le calcul préparé par le coach
    }
    return null;
  },

  /* ---------- résumé sur 7 jours (vue du coach), jusqu'au jour affiché ---------- */
  resume7(JA, fin){
    let jours = 0, total = 0;
    for (let n = 0; n < 7; n++){
      const L = this.lignes(JA, this.decaler(fin, -n));
      if (L.length){ jours++; total += this.totaux(L).kcal; }
    }
    return { jours, moyenne: jours ? total / jours : null };
  },

  /* ---------- les aliments récents (avant de taper) : du plus récent au plus ancien, sans doublon ---------- */
  recents(JA, n){
    const out = [], vus = new Set(), jours = this.jours(JA).reverse().slice(0, 90);
    for (const d of jours){
      const L = this.lignes(JA, d).filter(x => x.i >= 0).reverse();
      for (const x of L){
        if (vus.has(x.al.id)) continue;
        vus.add(x.al.id); out.push({ al: x.al, q: x.q });
        if (out.length >= n) return out;
      }
    }
    return out;
  },

  /* ---------- écritures (sur le document lu par Store.lire, puis Store.ecrire) ---------- */
  arrondi1(v){ return Math.round(num(v) * 10) / 10; },
  arrondiG(q){ return Math.round(num(q) * 2) / 2; },   // au demi-gramme
  grammesOk(g){ return this.arrondiG(g) > 0 && g <= this.MAX_GRAMMES; },
  kcalOk(k){ return Math.round(k) >= 1 && k <= this.MAX_KCAL; },
  /* a : un aliment du catalogue ({id, nom, kcal, proteines, glucides, lipides}) ou un aliment déjà rangé ({id, nom, kcal, p, g, l}) */
  ranger(JA, a){
    const v = a.proteines !== undefined ? [a.kcal, a.proteines, a.glucides, a.lipides] : [a.kcal, a.p, a.g, a.l];
    const fige = [String(a.id), this.arrondi1(v[0]), this.arrondi1(v[1]), this.arrondi1(v[2]), this.arrondi1(v[3]), String(a.nom || "").slice(0, 120)];
    let i = JA.a.findIndex(x => Array.isArray(x) && x[0] === fige[0]);
    if (i === -1){ JA.a.push(fige); i = JA.a.length - 1; }
    else JA.a[i] = fige;   // les valeurs du catalogue le jour de l'ajout (une correction du catalogue passe ainsi dans le journal)
    return i;
  },
  jour(JA, iso){ if (!Array.isArray(JA.j[iso])) JA.j[iso] = []; return JA.j[iso]; },
  /* renvoie la place (k) de la nouvelle ligne, ou -1 (journée pleine) */
  ajouter(JA, iso, r, a, q){
    const g = this.arrondiG(Math.min(q, this.MAX_GRAMMES));
    if (!(g > 0)) return -1;
    const L = this.jour(JA, iso);
    if (L.length >= this.MAX_LIGNES) return -1;
    const i = this.ranger(JA, a);
    L.push([r, i, g]);
    return L.length - 1;
  },
  ajoutRapide(JA, iso, r, kcal){
    const k = Math.round(Math.min(kcal, this.MAX_KCAL));
    if (!(k >= 1)) return -1;
    const L = this.jour(JA, iso);
    if (L.length >= this.MAX_LIGNES) return -1;
    L.push([r, -1, k]);
    return L.length - 1;
  },
  modifier(JA, iso, k, q){
    const L = JA.j[iso]; if (!Array.isArray(L) || !Array.isArray(L[k])) return false;
    const v = L[k][1] === -1 ? Math.round(Math.min(q, this.MAX_KCAL)) : this.arrondiG(Math.min(q, this.MAX_GRAMMES));
    if (!(v > 0)) return false;
    L[k][2] = v;
    return true;
  },
  retirer(JA, iso, k){
    const L = JA.j[iso]; if (!Array.isArray(L) || k < 0 || k >= L.length) return null;
    const x = L.splice(k, 1)[0];
    if (!L.length) delete JA.j[iso];
    return x;
  },
  remettreLigne(JA, iso, k, x){ const L = this.jour(JA, iso); L.splice(Math.min(k, L.length), 0, x); },
  place(JA, iso, ref){ const L = JA && JA.j ? JA.j[iso] : null; return Array.isArray(L) ? L.indexOf(ref) : -1; },
  /* copie le repas r de la veille dans le jour iso ; renvoie les lignes ajoutées (null : journée pleine) */
  copierVeille(JA, iso, r){
    const src = this.lignes(JA, this.decaler(iso, -1)).filter(x => x.r === r);
    if (!src.length) return [];
    const L = this.jour(JA, iso);
    if (L.length + src.length > this.MAX_LIGNES){ if (!L.length) delete JA.j[iso]; return null; }
    return src.map(x => { const y = [r, x.i, x.q]; L.push(y); return y; });
  },
  /* retire des lignes précises (les références rendues par copierVeille), où qu'elles soient maintenant */
  retirerLignes(JA, iso, refs){
    const L = JA.j[iso]; if (!Array.isArray(L)) return;
    refs.forEach(y => { const k = L.indexOf(y); if (k > -1) L.splice(k, 1); });
    if (!L.length) delete JA.j[iso];
  },

  /* ---------- noms et portions ---------- */
  courant(id){ const c = this.donnees().c; return c && Object.prototype.hasOwnProperty.call(c, id) && Array.isArray(c[id]) ? c[id] : null; },
  /* le nom à l'écran : nom court (anglais si la page est en anglais et qu'il existe), sinon celui du catalogue */
  nom(id, nomFr, a){
    const c = this.courant(id);
    if (this.en()){
      if (c && typeof c[2] === "string" && c[2]) return c[2];
      const t = a && a.traductions && a.traductions.en && a.traductions.en.nom;
      if (typeof t === "string" && t) return t;
    }
    return (c && typeof c[1] === "string" && c[1]) || nomFr || "";
  },
  /* les portions proposées : celles des aliments courants (sourcées), sinon celle du catalogue si elle n'est pas connue
     fausse (liste px), puis toujours 100 g */
  portions(id, a){
    const c = this.courant(id), out = [];
    (c && Array.isArray(c[4]) ? c[4] : []).forEach(p => {
      if (Array.isArray(p) && typeof p[0] === "string" && num(p[2]) > 0 && num(p[2]) <= this.MAX_GRAMMES) out.push({ fr: p[0], en: typeof p[1] === "string" ? p[1] : "", g: num(p[2]) });
    });
    const D = this.donnees();
    if (!out.length && a && num(a.portion_g) > 0 && num(a.portion_g) !== 100 && typeof a.portion_nom === "string" && a.portion_nom
        && !(Array.isArray(D.px) && D.px.indexOf(id) > -1))
      out.push({ fr: a.portion_nom, en: (D.pn && D.pn[a.portion_nom]) || "", g: num(a.portion_g) });
    if (!out.some(p => p.g === 100)) out.push({ fr: "100 g", en: "100 g", g: 100 });
    return out.slice(0, 4);
  },
  libPortion(p, consultation){
    const t = !consultation && this.en() && p.en ? p.en : p.fr;
    return /\d\s*g\b/.test(t) ? t : t + " · " + this.grammes(p.g, consultation);
  },
  grammes(g, consultation){ return (consultation ? String(Math.round(g * 10) / 10).replace(".", ",") : (Math.round(g * 10) / 10).toLocaleString(locale())) + " g"; },
  /* « 1 œuf × 2 · 100 g » quand les grammes d'une ligne font un nombre rond d'une portion connue, sinon « 100 g » */
  libLigne(x, consultation){
    if (x.i === -1) return consultation ? "Calories ajoutées à la main" : trad("Calories ajoutées à la main");
    const p = this.portions(x.al.id, null).find(p => p.g !== 100 && Math.abs(x.q / p.g - Math.round(x.q / p.g * 2) / 2) < 0.01 && x.q / p.g <= 10);
    if (!p) return this.grammes(x.q, consultation);
    const n = Math.round(x.q / p.g * 2) / 2, lib = !consultation && this.en() && p.en ? p.en : p.fr;
    return (n === 1 ? lib : lib + " × " + (consultation ? String(n).replace(".", ",") : n.toLocaleString(locale()))) + " · " + this.grammes(x.q, consultation);
  },

  /* ---------- recherche (moteur du matériel « journal », en JavaScript natif) ---------- */
  MOTS_VIDES: new Set(["de", "du", "des", "d", "la", "le", "les", "l", "au", "aux", "a", "et", "ou", "en", "un", "une", "avec", "sans", "pour", "par", "ex", "of", "and", "with", "an", "in"]),
  normaliser(s){
    return String(s || "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]+/g, " ").trim();
  },
  singulier(m){
    if (m.length <= 3) return m;
    if (m.endsWith("eaux") || m.endsWith("eux")) return m.slice(0, -1);
    if (m.endsWith("aux") && m.length > 4) return m.slice(0, -3) + "al";
    if (/[^su]s$/.test(m)) return m.slice(0, -1);
    return m;
  },
  jetons(s){ return this.normaliser(s).split(" ").filter(m => m && !this.MOTS_VIDES.has(m)).map(m => this.singulier(m)); },
  distance(a, b, max){
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++){
      let min = Infinity;
      for (let j = 1; j <= b.length; j++){
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        min = Math.min(min, d[i][j]);
      }
      if (min > max) return max + 1;
    }
    return d[a.length][b.length];
  },
  _index: null, _indexDe: null,
  /* l'index d'une liste d'aliments du catalogue (construit une fois par liste et par langue : quelques dizaines de ms) */
  index(aliments){
    const cle = this.en() ? "en" : "fr";
    if (this._index && this._indexDe === aliments && this._index.langue === cle) return this._index;
    const docs = [], vocab = new Set();
    (Array.isArray(aliments) ? aliments : []).forEach(a => {
      if (!a || typeof a.id !== "string" || typeof a.nom !== "string" || !(num(a.kcal) >= 0)) return;
      const c = this.courant(a.id), nomAff = this.nom(a.id, a.nom, a);
      const autres = [a.nom];
      if (c){ if (c[1]) autres.push(c[1]); if (c[2]) autres.push(c[2]); if (typeof c[3] === "string") c[3].split("|").forEach(s => s && autres.push(s)); }
      const t = a.traductions && a.traductions.en && a.traductions.en.nom; if (typeof t === "string" && t) autres.push(t);
      const doc = { a, id: a.id, nomAff, jetonsNom: this.jetons(nomAff), aliasNorm: new Set(), jetonsAlias: new Set(),
                    rang: c && num(c[0]) > 0 ? num(c[0]) : null };
      autres.forEach(s => { const j = this.jetons(s); doc.aliasNorm.add(j.join(" ")); j.forEach(m => doc.jetonsAlias.add(m)); });
      doc.jetonsNom.forEach(m => vocab.add(m)); doc.jetonsAlias.forEach(m => vocab.add(m));
      docs.push(doc);
    });
    this._index = { docs, vocab: Array.from(vocab), langue: cle }; this._indexDe = aliments;
    return this._index;
  },
  etendre(idx, m){
    if (idx.vocab.indexOf(m) > -1) return [{ mot: m, poids: 1 }];
    const tol = m.length >= 8 ? 2 : m.length >= 4 ? 1 : 0, res = [];
    for (const v of idx.vocab){
      if (m.length >= 2 && v.startsWith(m)) res.push({ mot: v, poids: 0.9, prefixe: true });
      else if (tol){ const dd = this.distance(m, v, tol); if (dd <= tol) res.push({ mot: v, poids: dd === 1 ? 0.75 : 0.55 }); }
    }
    return res.length ? res : [{ mot: m, poids: 1 }];
  },
  score(doc, etendus, requete){
    let s = 0, debut = false;
    for (let i = 0; i < etendus.length; i++){
      let meilleur = 0;
      for (const e of etendus[i]){
        const pos = doc.jetonsNom.findIndex(t => t === e.mot || (e.prefixe && t.startsWith(e.mot)));
        let v = 0;
        if (pos >= 0){ v = 10 * e.poids; if (pos === 0){ v += 6; if (i === 0) debut = true; } }
        else if (doc.jetonsAlias.has(e.mot) || (e.prefixe && Array.from(doc.jetonsAlias).some(t => t.startsWith(e.mot)))) v = 8 * e.poids;
        meilleur = Math.max(meilleur, v);
      }
      if (!meilleur) return null;
      s += meilleur;
    }
    if (doc.aliasNorm.has(requete)) s += 30;
    s += 12 * Math.min(etendus.length / Math.max(doc.jetonsNom.length, 1), 1);
    if (debut) s += 4;
    if (doc.rang) s += 8 + 15 * Math.max(0, 1 - Math.log(doc.rang) / Math.log(400));
    return s;
  },
  chercher(aliments, q, limite){
    const mots = this.jetons(String(q || "").slice(0, 80)).slice(0, 6);
    if (!mots.length) return [];
    const idx = this.index(aliments), etendus = mots.map(m => this.etendre(idx, m)), requete = mots.join(" "), res = [];
    for (const d of idx.docs){ const s = this.score(d, etendus, requete); if (s !== null) res.push({ d, s }); }
    res.sort((x, y) => y.s - x.s || x.d.nomAff.length - y.d.nomAff.length || x.d.nomAff.localeCompare(y.d.nomAff, "fr"));
    return res.slice(0, limite || 20).map(x => x.d.a);
  },
  /* sans requête : les aliments courants, dans l'ordre de consommation */
  courants(aliments, n){
    const c = this.donnees().c || {}, par = {};
    (Array.isArray(aliments) ? aliments : []).forEach(a => { if (a && c[a.id]) par[a.id] = a; });
    return Object.keys(par).sort((x, y) => num(c[x][0]) - num(c[y][0])).slice(0, n).map(id => par[id]);
  },

  /* ---------- rendus partagés (page, accueil, fiche du coach) ---------- */
  /* le chiffre principal : « Il te reste 820 kcal », « 120 kcal au-dessus de ton objectif », ou le total sans objectif */
  chiffre(t, obj, consultation){
    const T = s => consultation ? s : trad(s);
    if (!obj) return { lbl: T("Total du jour"), n: t.kcal, pct: null };
    const reste = obj.kcal - t.kcal;
    if (reste >= 0) return { lbl: consultation ? "Il lui reste" : trad("Il te reste"), n: reste, pct: Math.min(100, t.kcal / obj.kcal * 100) };
    return { lbl: consultation ? "Au-dessus de son objectif" : trad("Au-dessus de ton objectif"), n: -reste, pct: 100, plus: true };
  },
  /* la carte « Mon journal alimentaire » des accueils (client et prospect) ; JA null = pas encore lu (accord santé) */
  carteAccueilHTML(JA, obj){
    const L = JA ? this.lignes(JA, aujourdhui()) : [], t = this.totaux(L), c = this.chiffre(t, obj);
    const corps = !L.length && !obj
      ? `<p class="ja-carte-txt">${esc(typoFr(trad("Note ce que tu manges : tes calories du jour se calculent toutes seules.")))}</p>`
      : `<div class="ja-grand"><span class="ja-lbl">${esc(L.length || obj ? (obj ? c.lbl : trad("Aujourd'hui")) : "")}</span><span class="ja-grand-l"><span class="readout ja-num">${fmt(c.n)}</span><span class="unit">${esc(trad("kcal"))}</span></span></div>
         ${obj ? `<div class="jauge ja-jauge${c.plus ? " ja-plus" : ""}"><i style="width:${c.pct.toFixed(1)}%"></i></div>
         <p class="ja-detail">${esc(trad("{a} sur {b} kcal", { a: fmt(t.kcal), b: fmt(obj.kcal) }))}</p>` : ""}`;
    return `<section class="panel ja-carte" id="ja-carte">
      <h2>${esc(trad("Mon journal alimentaire"))}</h2>${corps}
      <div class="actions ja-carte-a"><a class="btn ghost ja-btn-ajout" href="#/journal-alimentaire/ajouter">${esc(trad("+ Ajouter un aliment"))}</a></div>
    </section>`;
  },
  /* le journal lu (lireTout) remplacé par la copie de cet appareil pas encore partie (700 ms, hors ligne), s'il y en a une :
     pour un affichage seulement (cartes des accueils), jamais pour écrire */
  local(lu){
    let v = lu;
    try { const l = outilDecouverte.saisiesLocales([this.cle])[this.cle]; if (l) v = Forme.cle(this.cle, l.v); } catch(e){}
    return this.remettre(v && typeof v === "object" ? v : this.vide());
  },
  /* la ligne du coach : 7 jours jusqu'au jour donné */
  ligne7(JA, fin, obj){
    const r = this.resume7(JA, fin);
    if (!r.jours) return `Aucun repas noté sur les 7 jours jusqu'au ${dateFr(fin)}.`;
    return `Sur les 7 jours jusqu'au ${dateFr(fin)} : ${r.jours} jour${r.jours > 1 ? "s" : ""} rempli${r.jours > 1 ? "s" : ""} sur 7, moyenne ${fmt(r.moyenne)} kcal par jour rempli${obj ? ` (objectif ${fmt(obj.kcal)} kcal)` : " (pas d'objectif calculé)"}.`;
  },
  /* le panneau de la fiche du coach (outilAccueil.fiche) */
  ficheHTML(JA, obj){
    const auj = aujourdhui(), dj = this.dernierJour(JA), L = this.lignes(JA, auj), t = this.totaux(L);
    return `<section class="panel" id="fiche-ja"><div class="seance-c-tete"><h2>Journal alimentaire</h2>${dj ? `<span class="pastille${dj === auj ? " ok" : ""}">${dj === auj ? "noté aujourd'hui" : "dernier : " + esc(dateFr(dj))}</span>` : `<span class="pastille">rien de noté</span>`}</div>
      <p class="note" style="margin:0 0 10px">${esc(this.ligne7(JA, auj, obj))}</p>
      <ul class="ingr fiche-l">
        <li><span>Aujourd'hui</span><b>${L.length ? esc(fmt(t.kcal) + " kcal" + (obj ? " / " + fmt(obj.kcal) : "")) : "rien de noté"}</b></li>
        <li><span>Objectif</span><b>${obj ? esc(fmt(obj.kcal) + " kcal · " + (obj.source === "coach" ? "ta diète" : obj.source === "calc" ? "ton calcul" : "son calculateur")) : "pas d'objectif calculé"}</b></li>
      </ul>
      <p class="note" style="margin:10px 0 0"><a class="link-a" href="#/journal-alimentaire">Son journal, jour par jour →</a></p></section>`;
  }
};

const outilJournalAlimentaire = {
  id: "journal-alimentaire",   // jamais de « _ » (Activite.page) ; la clé, elle, en a un
  cle: "journal_alimentaire",
  nom: "Mon journal alimentaire",
  court: "Journal alimentaire",
  icone: "",
  client_seul: true,           // client et prospect ; le coach seulement dans une fiche (lecture seule)
  interrupteur: "journal_alimentaire",
  sans_entete: true,           // la barre de date est le haut de la page
  titre: "Mon journal alimentaire",
  accroche: "",

  html(){
    const c = !!Store.idConsulte, pause = !c && Sante.aDemander();   // en pause (accord santé) : rien à charger avant l'accord
    const fl = (id, sens, lib) => `<button type="button" class="ja-fleche" id="${id}" data-lecture-ok aria-label="${esc(c ? lib : trad(lib))}">${sens}</button>`;
    return `<div class="ja" id="ja-vue">
      ${c ? `<header class="masthead"><h1>Son journal alimentaire</h1><p class="lede">Lecture seule : ce qu'il a noté, jour par jour.</p></header>
             <section class="panel ja-sept" id="ja-sept"><p class="note" id="ja-sept-txt" style="margin:0"></p></section>`
          : `<h1 class="sr-only">${esc(trad("Mon journal alimentaire"))}</h1>`}
      <div class="ja-date" role="group" aria-label="${esc(c ? "Jour affiché" : trad("Jour affiché"))}">
        ${fl("ja-prec", "‹", "Jour précédent")}
        <div class="ja-date-lib"><b id="ja-jour">${esc(c ? "Aujourd'hui" : trad("Aujourd'hui"))}</b><small id="ja-date-sous"></small></div>
        ${fl("ja-suiv", "›", "Jour suivant")}
      </div>
      <div id="ja-corps">${pause ? "" : `<section class="panel"><div class="empty">${esc(c ? "Chargement…" : trad("Chargement…"))}</div></section>`}</div>
      <p class="note ja-sources">${esc(c ? "Sources : Anses – CIQUAL 2025, INCA 3, USDA" : trad("Sources : Anses – CIQUAL 2025, INCA 3, USDA"))}</p>
    </div>`;
  },

  async init(){
    const J = JournalAlim, consultation = !!Store.idConsulte, uid = Store.cible();
    const T = t => consultation ? t : trad(t);
    const zone = $("ja-vue"); if (!zone) return;
    /* le statut de la personne (fiche : lu dans profils ; sinon son propre compte) : un prospect n'a pas de diète du coach */
    const statut = consultation
      ? Auth.appel("/rest/v1/profils?id=eq." + uid + "&select=*").then(r => Array.isArray(r) && r[0] ? r[0].statut : null).catch(() => null)
      : Promise.resolve(Auth.estProspect() ? "prospect" : "client");
    const [JA0, O, st] = await Promise.all([Store.lire(J.cle, J.vide()), Store.lireTout(["repas", "calc", "calc_perso"]), statut]);
    if (!zone.isConnected || Store.cible() !== uid) return;   // page ou fiche quittée pendant la lecture
    const corps = $("ja-corps");
    /* lecture ratée : « Pas de connexion » + Réessayer, jamais un journal vide (qu'une saisie écraserait) ; ni flèches inertes */
    if (Store.nonLus.has(JA0)){ const bd = zone.querySelector(".ja-date"); if (bd) bd.hidden = true; pageHorsLigne(corps); return; }
    const JA = J.remettre(JA0);
    /* saisie de calcul pas encore partie (700 ms, hors ligne) : comme l'accueil du prospect */
    if (!consultation && !O.erreur && typeof outilDecouverte !== "undefined"){
      const loc = outilDecouverte.saisiesLocales(["calc_perso"]);
      if (loc.calc_perso) O.calc_perso = Forme.cle("calc_perso", loc.calc_perso.v);
    }
    const obj = O.erreur ? undefined : J.objectif(O, st === "prospect");
    /* suitAujourdhui : la page montre « aujourd'hui » et le suit (passé minuit, elle passe au nouveau jour) */
    let jour = aujourdhui(), suitAujourdhui = true, nouveau = null;

    /* ---------- la page ---------- */
    corps.innerHTML = `
      <section class="panel ja-resume" id="ja-resume">
        <div class="ja-grand"><span class="ja-lbl" id="ja-lbl"></span><span class="ja-grand-l"><span class="readout ja-num" id="ja-num">0</span><span class="unit">${esc(T("kcal"))}</span></span></div>
        <div class="jauge ja-jauge" id="ja-jauge"><i id="ja-jauge-i" style="width:0%"></i></div>
        <p class="ja-detail" id="ja-detail"></p>
        ${consultation ? "" : `<a class="ja-calc" id="ja-calc" href="#/calculateur" hidden>${esc(trad("Calcule ton objectif dans le calculateur"))} ›</a>`}
        <div class="ja-macros">${[["p", "Protéines", "--s1"], ["g", "Glucides", "--s3"], ["l", "Lipides", "--s2"]].map(([k, n, c]) =>
          `<div class="ja-macro"><div class="ja-m-l"><span>${esc(T(n))}</span><b class="readout" id="ja-m-${k}"></b></div><div class="bar ja-fin" id="ja-b-${k}"><i style="width:0%;background:var(${c})"></i></div></div>`).join("")}</div>
      </section>
      ${J.REPAS.map((nom, r) => `<section class="panel ja-repas" data-ja-repas="${r}">
        <div class="ja-repas-tete"><h2>${esc(T(nom))}</h2><span class="readout ja-repas-kcal" id="ja-rk-${r}"></span>
          ${consultation ? "" : `<button type="button" class="ja-menu" data-ja-menu="${r}" aria-label="${esc(trad("Plus d'actions : {r}", { r: trad(nom) }))}">${ICONES.plus}</button>`}</div>
        <div class="ja-lignes" id="ja-l-${r}"></div>
        ${consultation ? "" : `<button type="button" class="btn ghost ja-ajouter" data-ja-ajout="${r}">${esc(trad("+ Ajouter"))}</button>`}
      </section>`).join("")}`;

    const dessiner = () => {
      if (!zone.isConnected) return;
      const L = J.lignes(JA, jour), t = J.totaux(L), c = J.chiffre(t, obj, consultation);
      /* la barre de date */
      $("ja-jour").textContent = J.libelleJour(jour, consultation);
      $("ja-date-sous").textContent = J.sousJour(jour, consultation);
      $("ja-suiv").disabled = jour >= aujourdhui();
      /* le résumé */
      $("ja-lbl").textContent = c.lbl;
      $("ja-num").textContent = fmt(c.n);
      $("ja-jauge").hidden = !obj;
      $("ja-jauge").classList.toggle("ja-plus", !!c.plus);
      $("ja-jauge-i").style.width = (obj ? c.pct : 0).toFixed(1) + "%";
      $("ja-detail").textContent = obj ? (consultation ? `${fmt(t.kcal)} sur ${fmt(obj.kcal)} kcal` : trad("{a} sur {b} kcal", { a: fmt(t.kcal), b: fmt(obj.kcal) }))
        : obj === undefined ? T("Objectif indisponible : pas de connexion.") : consultation ? "Pas d'objectif calculé." : "";
      $("ja-detail").hidden = !$("ja-detail").textContent;
      const lc = $("ja-calc"); if (lc) lc.hidden = obj !== null;
      ["p", "g", "l"].forEach(k => {
        const cible = obj && obj[k] > 0 ? obj[k] : null;
        $("ja-m-" + k).textContent = cible ? `${fmt(t[k])} / ${fmt(cible)} g` : `${fmt(t[k])} g`;
        const b = $("ja-b-" + k); b.hidden = !cible; b.firstElementChild.style.width = cible ? Math.min(100, t[k] / cible * 100).toFixed(1) + "%" : "0%";
      });
      /* les repas */
      J.REPAS.forEach((nom, r) => {
        const Lr = L.filter(x => x.r === r), box = $("ja-l-" + r);
        $("ja-rk-" + r).textContent = Lr.length ? fmt(J.totaux(Lr).kcal) + " " + T("kcal") : "";
        box.innerHTML = Lr.length ? Lr.map(x => {
          const nomL = x.i === -1 ? T("Ajout rapide") : J.nom(x.al.id, x.al.nom), sous = J.libLigne(x, consultation);
          const dedans = `<span class="ja-l-txt"><b data-notr>${esc(nomL)}</b><small data-notr>${esc(sous)}</small></span><span class="readout ja-l-kcal">${fmt(x.kcal)}</span>`;
          return consultation ? `<div class="ja-ligne">${dedans}</div>`
            : `<button type="button" class="ja-ligne${nouveau && nouveau.r === r && nouveau.k.indexOf(x.k) > -1 ? " ja-nouveau" : ""}" data-ja-k="${x.k}" aria-label="${esc(trad("Modifier : {n}", { n: nomL }))}">${dedans}</button>`;
        }).join("") : `<p class="ja-vide">${esc(T("Rien de noté pour l'instant."))}</p>`;
      });
      if (consultation){ const s = $("ja-sept-txt"); if (s) s.textContent = J.ligne7(JA, jour, obj); }
      if (nouveau){
        const el = zone.querySelector(".ja-nouveau");
        if (el) try { el.scrollIntoView({ block: "nearest", behavior: defilementDoux() }); } catch(e){}
        const n = nouveau; setTimeout(() => { if (nouveau === n) nouveau = null; }, 50);
      }
    };
    const changerJour = n => {
      const d = J.decaler(jour, n); if (n > 0 && d > aujourdhui()) return;
      jour = d; suitAujourdhui = jour === aujourdhui(); nouveau = null; dessiner();
    };
    $("ja-prec").addEventListener("click", () => changerJour(-1));
    $("ja-suiv").addEventListener("click", () => changerJour(1));
    dessiner();
    /* le coach : lecture seule, rien d'autre (aucun écouteur qui écrit) */
    if (consultation) return;

    /* passé minuit, page restée ouverte sur « aujourd'hui » : elle suit la date (l'ajout du matin va au bon jour) */
    const aJour = () => { if (suitAujourdhui && jour !== aujourdhui()){ jour = aujourdhui(); nouveau = null; dessiner(); } };

    /* ---------- écrire : le document entier (Store.ecrire, 700 ms) ; refus = on remet l'écran comme avant ---------- */
    const enregistrer = (annuler) => {
      if (Store.ecrire(J.cle, JA) !== false) return true;
      if (typeof annuler === "function") annuler();
      UI.toast(trad("Non enregistré. Vérifie ta connexion, puis recommence."), "mauvais", 4500);
      dessiner();
      return false;
    };
    /* le message « … · Annuler » : retiré dès qu'un panneau s'ouvre ou que la page change (il agirait sur un état dépassé) */
    const fermerToasts = () => $$(".toast.ja-toast").forEach(t => t.remove());
    const annulable = (texte, retour) => {
      const t = UI.toast(texte, "ok", 6000);
      const b = document.createElement("button"); b.type = "button"; b.className = "ja-annuler"; b.textContent = trad("Annuler");
      b.addEventListener("click", () => { t.remove(); if (zone.isConnected) retour(); }, { once: true });
      t.classList.add("ja-toast"); t.append(" ", b);
    };
    const eclairer = (r, k) => { nouveau = { r, k: Array.isArray(k) ? k : [k] }; dessiner(); setTimeout(() => { $$(".ja-nouveau", zone).forEach(e => e.classList.remove("ja-nouveau")); }, 1700); };
    const ligneChangee = () => { UI.fermer(null); UI.toast(trad("Cette ligne a changé : rouvre-la pour la modifier."), "attention"); dessiner(); };

    /* ---------- un autre appareil (ou onglet) a écrit le journal depuis la lecture : la page se recharge au lieu de l'écraser.
       Vérifié (date seule) au retour sur l'app et à chaque ouverture d'un panneau ; rien si une saisie de cet onglet attend
       son envoi (c'est elle la plus récente) ou si la lecture échoue. ---------- */
    const kStore = uid + "|" + J.cle;
    let verif = null;
    const enAttente = () => !!Store.attente[kStore] || Store.aUneCopie(uid, J.cle);
    const verifier = () => verif || (verif = (async () => {
      try {
        if (enAttente()) return;
        const r = await Promise.race([Auth.appel("/rest/v1/donnees?user_id=eq." + uid + "&outil=eq." + J.cle + "&select=maj_le"), new Promise(res => setTimeout(() => res(null), 4000))]);
        if (!Array.isArray(r) || !zone.isConnected || enAttente()) return;
        const ms = x => { const v = x == null ? NaN : new Date(x).getTime(); return isNaN(v) ? null : v; };
        const base = ms(r[0] && r[0].maj_le);
        if (base === null || [ms(Store.majLu[kStore]), ms(Store.dernierT[kStore])].indexOf(base) > -1) return;
        fermerToasts(); UI.fermer(null);
        UI.toast(trad("Ton journal a changé sur un autre appareil : il vient d'être rechargé."), "attention", 4500);
        afficher(courant, true, true);
      } catch(e){} finally { verif = null; }
    })());
    const surRetour = () => { if (document.visibilityState === "visible"){ aJour(); verifier(); } };
    document.addEventListener("visibilitychange", surRetour);

    /* ---------- le panneau (UI.ouvrir : un panneau qui monte du bas sur téléphone, avec sa croix) ---------- */
    const panneau = titre => {
      fermerToasts(); aJour();
      UI.ouvrir({ titre, corps: "<div></div>", html: true, classe: "ja-feuille", croix: true, annulation: null });
      verifier();
      return document.querySelector(".modale.ja-feuille .corps");
    };
    const recherche = (boite, oui) => { const m = boite.closest(".modale"); if (m) m.classList.toggle("ja-recherche", !!oui); };

    /* le catalogue : chargé une fois, à la première recherche (4 pages de 1 000 aliments) ; une lecture incomplète n'est pas
       gardée (Catalogue ne garde que la liste complète) : la recherche suivante relit */
    let cat = null, chargement = null;
    const catalogue = () => chargement || (chargement = Catalogue.aliments()
      .then(l => { cat = Array.isArray(l) && l.length && Catalogue._c && Catalogue._c.aliments === l ? l : null; if (!cat) chargement = null; return cat; })
      .catch(() => { chargement = null; return null; }));
    const duCatalogue = id => cat ? cat.find(y => y.id === id) || null : null;

    /* supprimer une ligne (repérée par elle-même, pas par sa place), avec « Annuler » */
    const supprimer = (ref, r, nomL) => {
      const d = jour, kk = J.place(JA, d, ref);
      if (kk < 0) return ligneChangee();
      UI.fermer(null);
      J.retirer(JA, d, kk);
      if (!enregistrer(() => J.remettreLigne(JA, d, kk, ref))) return;
      dessiner();
      annulable(trad("Supprimé : {n}", { n: nomL }), () => {
        if (J.place(JA, d, ref) > -1) return;
        J.remettreLigne(JA, d, kk, ref);
        if (enregistrer(() => { const p = J.place(JA, d, ref); if (p > -1) J.retirer(JA, d, p); }) && d === jour) eclairer(r, J.place(JA, d, ref));
      });
    };

    /* la portion : ajouter un aliment (a du catalogue, ou al déjà rangé) ou, avec mode { ref, x, nomL }, modifier une ligne */
    const choisirPortion = (boite, r, a, al, qDepart, mode) => {
      recherche(boite, false);
      const id = a ? a.id : al.id, nomA = mode ? mode.nomL : J.nom(id, a ? a.nom : al.nom, a);
      /* les valeurs : celles du catalogue pour un nouvel ajout (elles seront rangées), celles déjà rangées pour une ligne */
      const v = !mode && a ? { kcal: num(a.kcal), p: num(a.proteines), g: num(a.glucides), l: num(a.lipides) } : { kcal: al.kcal, p: al.p, g: al.g, l: al.l };
      const P = J.portions(id, a || duCatalogue(id));
      let sel = 0, n = 1;
      if (qDepart > 0){
        const k = P.findIndex(p => Math.abs(qDepart / p.g - Math.round(qDepart / p.g * 2) / 2) < 0.01 && qDepart / p.g <= 20 && qDepart / p.g >= 0.5);
        if (k > -1){ sel = k; n = Math.round(qDepart / P[k].g * 2) / 2; } else sel = -1;
      }
      let g = sel > -1 ? P[sel].g * n : qDepart;
      boite.innerHTML = `<div class="ja-f ja-f-portion">
        ${mode ? "" : `<button type="button" class="ja-retour" id="ja-retour">‹ ${esc(trad("Retour"))}</button>`}
        <div class="ja-f-nom">${mode ? "" : `<b data-notr>${esc(nomA)}</b>`}<small>${esc(trad("{k} kcal pour 100 g", { k: fmt(v.kcal) }))}</small></div>
        <div class="ja-pastilles" role="group" aria-label="${esc(trad("Portion"))}">${P.map((p, k) => `<button type="button" class="ja-past" data-p="${k}" aria-pressed="false">${esc(J.libPortion(p))}</button>`).join("")}</div>
        <div class="ja-qte">
          <div class="ja-pas" id="ja-pas"><button type="button" id="ja-moins" aria-label="${esc(trad("Moins"))}">−</button><span class="readout" id="ja-n" aria-live="polite"></span><button type="button" id="ja-plus" aria-label="${esc(trad("Plus"))}">+</button></div>
          <label class="ja-g" for="ja-g"><input id="ja-g" type="number" inputmode="decimal" min="0.5" max="${J.MAX_GRAMMES}" step="any" aria-label="${esc(trad("Grammes"))}"><span>g</span></label>
        </div>
        <div class="ja-calcul" aria-live="polite"><span class="readout ja-calcul-n" id="ja-ck"></span><span class="unit">${esc(trad("kcal"))}</span><small id="ja-pgl"></small></div>
        <button type="button" class="btn ja-ok" id="ja-ok">${esc(trad(mode ? "Enregistrer" : "Ajouter"))}</button>
        ${mode ? `<button type="button" class="btn danger ja-suppr" id="ja-suppr">${esc(trad("Supprimer"))}</button>` : ""}
      </div>`;
      const champ = $("ja-g");
      const maj = (depuisChamp) => {
        if (!depuisChamp) champ.value = g > 0 ? String(Math.round(g * 10) / 10) : "";
        $$(".ja-past", boite).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.p === sel)));
        /* le compteur reste en place (grisé) quand les grammes sont tapés à la main : rien ne saute */
        $("ja-n").textContent = sel < 0 ? "–" : n.toLocaleString(locale());
        $("ja-moins").disabled = sel < 0 || n <= 0.5;
        $("ja-plus").disabled = sel < 0 || n >= 20;
        const f = g > 0 ? g / 100 : 0;
        $("ja-ck").textContent = fmt(v.kcal * f);
        $("ja-pgl").textContent = trad("Protéines {p} g · Glucides {g} g · Lipides {l} g", { p: fmt(v.p * f), g: fmt(v.g * f), l: fmt(v.l * f) });
        $("ja-ok").disabled = !J.grammesOk(g);
      };
      $$(".ja-past", boite).forEach(b => b.addEventListener("click", () => { sel = +b.dataset.p; n = 1; g = P[sel].g; maj(); }));
      $("ja-moins").addEventListener("click", () => { if (sel < 0) return; n = Math.max(0.5, n - (n > 1 ? 1 : 0.5)); g = P[sel].g * n; maj(); });
      $("ja-plus").addEventListener("click", () => { if (sel < 0) return; n = Math.min(20, n < 1 ? n + 0.5 : n + 1); g = P[sel].g * n; maj(); });
      champ.addEventListener("input", () => { const x = outilCalculateur.nombre(champ.value); g = x && x > 0 ? x : 0; sel = -1; maj(true); });
      champ.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); $("ja-ok").click(); } });
      const ret = $("ja-retour"); if (ret) ret.addEventListener("click", () => etapeListe(boite, r));
      $("ja-ok").addEventListener("click", () => {
        if (!J.grammesOk(g)) return;
        if (mode){
          const kk = J.place(JA, jour, mode.ref); if (kk < 0) return ligneChangee();
          const avant = mode.ref[2];
          if (!J.modifier(JA, jour, kk, g)) return;
          UI.fermer(null);
          if (enregistrer(() => { mode.ref[2] = avant; })) eclairer(r, kk);
          return;
        }
        const k = J.ajouter(JA, jour, r, a || al, g);
        if (k < 0){ UI.toast(trad("Cette journée est pleine (60 lignes)."), "attention"); return; }
        UI.fermer(null);
        if (enregistrer(() => J.retirer(JA, jour, k))) eclairer(r, k);
      });
      const sup = $("ja-suppr"); if (sup) sup.addEventListener("click", () => supprimer(mode.ref, r, mode.nomL));
      maj();
    };

    /* l'ajout rapide de kcal (menu ⋯, ou « aliment introuvable » dans la recherche) ; avec mode : modifier ce chiffre */
    const formRapide = (boite, r, retour, mode) => {
      recherche(boite, false);
      boite.innerHTML = `<div class="ja-f">
        ${retour ? `<button type="button" class="ja-retour" id="ja-retour">‹ ${esc(trad("Retour"))}</button>` : ""}
        <label class="ja-g ja-g-large" for="ja-rk"><input id="ja-rk" type="number" inputmode="numeric" min="1" max="${J.MAX_KCAL}" step="1" aria-label="${esc(trad("Calories (kcal)"))}" placeholder="0" value="${mode ? esc(String(mode.x.q)) : ""}"><span>${esc(trad("kcal"))}</span></label>
        <button type="button" class="btn ja-ok" id="ja-ok"${mode ? "" : " disabled"}>${esc(trad(mode ? "Enregistrer" : "Ajouter"))}</button>
        ${mode ? `<button type="button" class="btn danger ja-suppr" id="ja-suppr">${esc(trad("Supprimer"))}</button>` : ""}
      </div>`;
      const champ = $("ja-rk"), lu = () => { const v = outilCalculateur.nombre(champ.value); return v && J.kcalOk(v) ? v : 0; };
      champ.addEventListener("input", () => { $("ja-ok").disabled = !lu(); });
      champ.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); $("ja-ok").click(); } });
      if (retour) $("ja-retour").addEventListener("click", retour);
      $("ja-ok").addEventListener("click", () => {
        const v = lu(); if (!v) return;
        if (mode){
          const kk = J.place(JA, jour, mode.ref); if (kk < 0) return ligneChangee();
          const avant = mode.ref[2];
          if (!J.modifier(JA, jour, kk, v)) return;
          UI.fermer(null);
          if (enregistrer(() => { mode.ref[2] = avant; })) eclairer(r, kk);
          return;
        }
        const k = J.ajoutRapide(JA, jour, r, v);
        if (k < 0){ UI.toast(trad("Cette journée est pleine (60 lignes)."), "attention"); return; }
        UI.fermer(null);
        if (enregistrer(() => J.retirer(JA, jour, k))) eclairer(r, k);
      });
      const sup = $("ja-suppr"); if (sup) sup.addEventListener("click", () => supprimer(mode.ref, r, mode.nomL));
      if (!mode) try { champ.focus(); } catch(e){}
    };

    /* la recherche (récents d'abord, avant de taper) ; la dernière recherche revient après « ‹ Retour » */
    let derniereQ = "";
    const etapeListe = (boite, r) => {
      recherche(boite, true);
      boite.innerHTML = `<div class="ja-f ja-f-liste">
        <div class="ja-q-zone"><input type="search" id="ja-q" class="ja-q" placeholder="${esc(trad("Cherche un aliment (ex. poulet)"))}" aria-label="${esc(trad("Cherche un aliment"))}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="80"></div>
        <h3 id="ja-res-titre"></h3>
        <div class="ja-res" id="ja-res"></div>
        <p class="note ja-f-etat" id="ja-f-etat" role="status" aria-live="polite"></p>
        <button type="button" class="ja-action" id="ja-vers-rapide" hidden><b>${esc(trad("Ajout rapide de kcal"))}</b><small>${esc(trad("Quand tu ne trouves pas l'aliment : les calories seulement."))}</small></button>
      </div>`;
      const champ = $("ja-q"), res = $("ja-res"), etat = $("ja-f-etat"), titre = $("ja-res-titre"), versRapide = $("ja-vers-rapide");
      const item = (o, k) => {
        const p0 = J.portions(o.id, o.a)[0] || { fr: "100 g", en: "100 g", g: 100 }, g = o.q || p0.g;
        const sous = o.q ? J.grammes(o.q) : J.libPortion(p0);
        return `<button type="button" class="ja-res-l" data-ja-res="${k}"><span class="ja-l-txt"><b data-notr>${esc(o.nom)}</b><small data-notr>${esc(sous)}</small></span><span class="ja-res-k"><span class="readout">${fmt(o.kcal * g / 100)}</span><small>${esc(trad("kcal"))}</small></span></button>`;
      };
      let liste = [];
      const montrer = (l, t, vide, rapide) => {
        liste = l; titre.textContent = t; titre.hidden = !t;
        res.innerHTML = l.map(item).join("");
        etat.textContent = l.length ? "" : vide || "";
        versRapide.hidden = !rapide;
        $$("[data-ja-res]", res).forEach(b => b.addEventListener("click", () => {
          const o = liste[+b.dataset.jaRes]; if (!o) return;
          choisirPortion(boite, r, o.a, o.al, o.q || 0);
        }));
      };
      const deCatalogue = a => ({ id: a.id, a, al: null, nom: J.nom(a.id, a.nom, a), kcal: num(a.kcal), q: 0 });
      const accueil = () => {
        const rec = J.recents(JA, 10).map(x => ({ id: x.al.id, a: duCatalogue(x.al.id), al: x.al, nom: J.nom(x.al.id, x.al.nom), kcal: x.al.kcal, q: x.q }));
        if (rec.length) return montrer(rec, trad("Récents"));
        if (cat) return montrer(J.courants(cat, 10).map(deCatalogue), trad("Les plus courants"));
        montrer([], "", trad("Chargement des aliments…"));
      };
      const impossible = () => montrer([], "", trad("Les aliments n'ont pas pu être chargés. Vérifie ta connexion, puis réessaie."), true);
      let minuterie = null;
      const lancer = () => {
        const t = champ.value.trim(); derniereQ = t;
        /* une lettre, ou seulement des petits mots (« la », « de ») : les récents, pas « aucun aliment » */
        if (t.length < 2 || !J.jetons(t).length){ accueil(); return; }
        if (!cat){ montrer([], "", trad("Chargement des aliments…")); catalogue().then(l => { if (!boite.isConnected || champ.value.trim() !== t) return; if (!l) return impossible(); lancer(); }); return; }
        montrer(J.chercher(cat, t, 20).map(deCatalogue), "", trad("Aucun aliment trouvé. Essaie un autre mot."), true);
      };
      champ.addEventListener("input", () => { clearTimeout(minuterie); minuterie = setTimeout(lancer, 90); });
      champ.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); clearTimeout(minuterie); lancer(); } });
      versRapide.addEventListener("click", () => formRapide(boite, r, () => etapeListe(boite, r)));
      if (derniereQ) champ.value = derniereQ;
      lancer();
      /* le catalogue arrive pendant qu'on regarde les récents : rien ne bouge ; sans récents, les plus courants apparaissent */
      if (!cat) catalogue().then(l => {
        if (!boite.isConnected || champ.value.trim().length >= 2 || J.recents(JA, 1).length) return;
        if (l) accueil(); else impossible();
      });
      try { champ.focus(); } catch(e){}
    };
    const ouvrirAjout = r => { derniereQ = ""; const b = panneau(trad(J.AJOUT_A[r])); if (b) etapeListe(b, r); };

    /* toucher une ligne : la même étape portion (ou le chiffre d'un ajout rapide), en mode « modifier », avec Supprimer */
    const ouvrirLigne = k => {
      const x = J.lignes(JA, jour).find(y => y.k === k); if (!x) return;
      const ref = JA.j[jour][k], nomL = x.i === -1 ? trad("Ajout rapide") : J.nom(x.al.id, x.al.nom), mode = { ref, x, nomL };
      const b = panneau(nomL); if (!b) return;
      if (J.place(JA, jour, ref) < 0) return ligneChangee();   // la page vient de passer au nouveau jour (aJour)
      if (x.i === -1) formRapide(b, x.r, null, mode);
      else choisirPortion(b, x.r, null, x.al, x.q, mode);
    };

    /* le menu « ⋯ » d'un repas : copier depuis hier, ajout rapide de kcal */
    const ouvrirMenu = r => {
      const b = panneau(trad(J.REPAS[r])); if (!b) return;
      const hier = J.lignes(JA, J.decaler(jour, -1)).filter(x => x.r === r);
      b.innerHTML = `<div class="ja-f ja-f-menu">
        <button type="button" class="ja-action" id="ja-copier"${hier.length ? "" : " disabled"}><b>${esc(trad("Copier depuis hier"))}</b><small>${esc(hier.length ? trad(hier.length > 1 ? "{n} aliments notés la veille" : "{n} aliment noté la veille", { n: hier.length }) : trad("Rien de noté la veille à ce repas."))}</small></button>
        <button type="button" class="ja-action" id="ja-rapide"><b>${esc(trad("Ajout rapide de kcal"))}</b><small>${esc(trad("Quand tu ne trouves pas l'aliment : les calories seulement."))}</small></button>
      </div>`;
      $("ja-copier").addEventListener("click", () => {
        const refs = J.copierVeille(JA, jour, r);
        if (refs === null){ UI.toast(trad("Cette journée est pleine (60 lignes)."), "attention"); return; }
        if (!refs.length) return;
        UI.fermer(null);
        const d = jour, n = refs.length, retirer = () => J.retirerLignes(JA, d, refs);
        if (!enregistrer(retirer)) return;
        eclairer(r, refs.map(y => J.place(JA, d, y)));
        annulable(trad(n > 1 ? "{n} aliments copiés depuis hier" : "{n} aliment copié depuis hier", { n }), () => {
          const places = refs.map(y => [J.place(JA, d, y), y]).filter(z => z[0] > -1);
          if (!places.length) return;
          retirer();
          if (enregistrer(() => places.sort((x, y) => x[0] - y[0]).forEach(([k, y]) => J.remettreLigne(JA, d, k, y)))) dessiner();
        });
      });
      $("ja-rapide").addEventListener("click", () => formRapide(b, r, null));
    };

    corps.addEventListener("click", e => {
      const t = e.target && e.target.closest ? e.target.closest("[data-ja-ajout],[data-ja-menu],[data-ja-k]") : null;
      if (!t || !corps.contains(t)) return;
      if (t.dataset.jaAjout != null) ouvrirAjout(+t.dataset.jaAjout);
      else if (t.dataset.jaMenu != null) ouvrirMenu(+t.dataset.jaMenu);
      else if (t.dataset.jaK != null) ouvrirLigne(+t.dataset.jaK);
    });
    /* v79.1 : le catalogue (4 pages, plusieurs secondes sur téléphone) se charge dès l'ouverture de la page, sans attendre le
       premier « + Ajouter » : la recherche est prête quand on en a besoin (une fois par visite : Catalogue le garde) */
    setTimeout(() => { if (zone.isConnected) catalogue(); }, 400);
    /* #/journal-alimentaire/ajouter (bouton des accueils) : le panneau d'ajout, au repas de l'heure */
    if (sousRoute === "ajouter"){
      sousRoute = "";
      try { history.replaceState(null, "", "#/journal-alimentaire"); } catch(e){}
      ouvrirAjout(J.repasDeLHeure());
    }
    /* en quittant la page : le panneau et les messages « Annuler » disparaissent (ils agiraient sur un journal qui n'est plus
       affiché), l'écoute du retour sur l'app aussi */
    return () => {
      document.removeEventListener("visibilitychange", surRetour);
      fermerToasts();
      if (document.querySelector(".modale.ja-feuille")) UI.fermer(null);
    };
  }
};
