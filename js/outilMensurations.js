/* ------------------------------------------------------------------
   OUTIL 2 — Suivi des mensurations
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   v41 — PHOTOS DE PROGRESSION (phase 13)
   Les images vivent dans le bucket PRIVE « photos » de Supabase Storage, un
   dossier par compte : <user_id>/s<NNN>-<face|profil|dos>.jpg. Les regles de
   la base (policies du 25/09/2026) : chacun ne depose, ne lit, ne remplace et
   ne retire que dans son dossier ; le coach lit tout, n'ecrit rien. L'index
   est la cle client « photos » = { liste: [{ semaine, date, vues: { face,
   profil, dos } }] }. Les images sont reduites dans le navigateur (1080 px,
   JPEG) avant l'envoi et relues avec le jeton de la personne : jamais
   d'adresse publique.
   ------------------------------------------------------------------ */
const Photos = {
  cle: "photos",
  bucket: "photos",
  vues: [["face", "De face"], ["profil", "De profil"], ["dos", "De dos"]],
  urls: {},   // chemin -> adresse locale de l'image deja lue (liberee en quittant la page)
  enCours: {},   // chemin -> lecture en cours (la meme photo affichee deux fois = une seule requete)
  vide(){ return { liste: [] }; },
  chemin(uid, semaine, vue){ return uid + "/s" + String(semaine).padStart(3, "0") + "-" + vue + ".jpg"; },
  entree(P, semaine){ return ((P && P.liste) || []).find(x => x && x.semaine === semaine) || null; },
  /* l'index est ecrit par le client (il peut l'ecrire par l'API) : on ne suit
     qu'un chemin de la forme exacte <uid du compte affiche>/sNNN-vue.jpg */
  valide(uid, chemin){ return typeof chemin === "string" && chemin.indexOf(uid + "/") === 0 && /^[0-9a-f-]{36}\/s\d{3,4}-(face|profil|dos)\.jpg$/.test(chemin); },
  semaines(P){ return ((P && P.liste) || []).filter(x => x && Number.isInteger(x.semaine) && x.vues && typeof x.vues === "object" && Object.keys(x.vues).some(k => x.vues[k])).map(x => x.semaine).sort((a, b) => a - b); },
  entetes(){ return { "apikey": CONFIG.supabase.cle, "Authorization": "Bearer " + ((Auth.session && Auth.session.access_token) || "") }; },
  erreur(r, texte){
    /* Storage repond souvent 400 avec le vrai code dans le corps ({ statusCode: "404" }) */
    let code = r.status;
    try { const d = JSON.parse(texte || "{}"); if (d && d.statusCode && +d.statusCode) code = +d.statusCode; } catch(x){}
    const e = new Error(texte || ("Erreur " + r.status)); e.statut = code;
    e.absent = /bucket not found/i.test(texte || "");           // le stockage n'est pas encore active
    e.introuvable = code === 404 && !e.absent;                   // ce fichier-la n'existe pas (ou plus)
    return e;
  },
  /* reduit l'image (1080 px au plus, JPEG 0,82) : quelques centaines de Ko */
  async reduire(fichier){
    let img;
    try { img = await createImageBitmap(fichier); }
    catch(e){
      img = await new Promise((ok, ko) => { const i = new Image(), u = URL.createObjectURL(fichier); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); ko(Object.assign(new Error("image"), { illisible: true })); }; i.src = u; });
    }
    const k = Math.min(1, 1080 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error("image")), "image/jpeg", 0.82));
  },
  async envoyer(chemin, blob){
    if (!(await Auth.assurer())) throw Object.assign(new Error("session"), { statut: 401 });
    const r = await fetch(CONFIG.supabase.url + "/storage/v1/object/" + this.bucket + "/" + chemin, {
      method: "POST", headers: Object.assign(this.entetes(), { "Content-Type": "image/jpeg", "x-upsert": "true", "cache-control": "no-cache" }), body: blob
    });
    if (!r.ok) throw this.erreur(r, await r.text().catch(() => ""));
    delete this.enCours[chemin];
    if (this.urls[chemin]){ URL.revokeObjectURL(this.urls[chemin]); delete this.urls[chemin]; }
  },
  image(chemin){
    if (this.urls[chemin]) return Promise.resolve(this.urls[chemin]);
    if (this.enCours[chemin]) return this.enCours[chemin];
    const p = (async () => {
      if (!(await Auth.assurer())) throw Object.assign(new Error("session"), { statut: 401 });
      const r = await fetch(CONFIG.supabase.url + "/storage/v1/object/authenticated/" + this.bucket + "/" + chemin, { headers: this.entetes(), cache: "no-store" });
      if (!r.ok) throw this.erreur(r, await r.text().catch(() => ""));
      const b = await r.blob();
      if (this.enCours[chemin] !== p) return null;   // lecture perimee (page quittee, photo remplacee) : personne ne l'affiche
      return (this.urls[chemin] = URL.createObjectURL(b));
    })();
    this.enCours[chemin] = p;
    const fini = () => { if (this.enCours[chemin] === p) delete this.enCours[chemin]; };
    p.then(fini, fini);
    return p;
  },
  async retirer(chemin){
    if (!(await Auth.assurer())) throw Object.assign(new Error("session"), { statut: 401 });
    const r = await fetch(CONFIG.supabase.url + "/storage/v1/object/" + this.bucket + "/" + chemin, { method: "DELETE", headers: this.entetes() });
    if (!r.ok){
      const e = this.erreur(r, await r.text().catch(() => ""));
      if (!e.introuvable) throw e;                                  // deja retiree : c'est ce qu'on voulait
    }
    delete this.enCours[chemin];
    if (this.urls[chemin]){ URL.revokeObjectURL(this.urls[chemin]); delete this.urls[chemin]; }
  },
  oublier(){ Object.keys(this.urls).forEach(k => URL.revokeObjectURL(this.urls[k])); this.urls = {}; this.enCours = {}; },
  message(e, retrait){
    if (e && e.illisible) return trad("Cette image ne peut pas être lue : choisis une photo JPEG ou PNG.");
    if (retrait && !(e && (e.statut === 401 || e.statut === 403))) return trad("Le retrait n'a pas abouti, réessaie.");
    if (e && e.absent) return trad("Les photos ne sont pas encore activées.");
    if (e && (e.statut === 401 || e.statut === 403)) return trad("Envoi refusé : reconnecte-toi puis réessaie.");
    if (e && e.statut === 413) return trad("Photo trop lourde.");
    return trad("L'envoi n'a pas abouti, réessaie.");
  },

  html(){
    const coach = !!Store.idConsulte;
    return `<section class="panel" id="photos-panel">
      <div class="seance-c-tete"><h2>${esc(trad("Photos de progression"))}</h2><span class="pastille">${esc(trad("privées"))}</span></div>
      <p class="note" style="margin:0 0 14px">${esc(trad(coach ? "Visibles par ton client et toi seulement." : "Visibles par toi et ton coach seulement. Même lumière, même tenue, même position : c'est ce qui rend la comparaison utile."))}</p>
      ${coach ? "" : `<div class="grid g2" style="margin-bottom:12px"><div><label for="ph-sem">${esc(trad("Semaine"))}</label><input id="ph-sem" type="number" min="0" max="520" step="1"></div></div>
      <div class="photos-vues" id="ph-envoi"></div><p class="msg" id="ph-msg"></p>`}
      <h3 style="margin-top:18px">${esc(trad("Comparer"))}</h3>
      <div class="grid g2"><div><select id="ph-a" aria-label="${esc(trad("Première semaine"))}"></select></div><div><select id="ph-b" aria-label="${esc(trad("Seconde semaine"))}"></select></div></div>
      <div id="ph-comparaison" class="photos-compare"></div>
    </section>`;
  },

  /* branche la section ; uid = le compte affiche ; semaineParDefaut = derniere mesure */
  async monter(uid, semaineParDefaut){
    const panneau = $("photos-panel"); if (!panneau || !uid) return;
    const coach = !!Store.idConsulte;
    const P = await Store.lire(this.cle, this.vide());
    if (!panneau.isConnected) return;   // page ou fiche changee pendant la lecture
    P.liste = Array.isArray(P.liste) ? P.liste.filter(x => x && typeof x === "object" && !Array.isArray(x)) : [];
    /* index illisible (reseau) : on n'envoie rien, sinon une photo remplacerait
       l'ancienne sans que l'index puisse etre ecrit (Store n'ecrit pas ce qu'il n'a pas lu) */
    const indexLu = Store.charge[uid + "|" + this.cle] !== false;
    const msg = $("ph-msg");
    const dire = (t, ko) => { if (msg){ msg.classList.toggle("ko", !!ko); msg.textContent = t; } };
    const vignette = async (el, chemin) => {
      if (!el) return;
      const j = el.__ph = (el.__ph || 0) + 1;   // seule la derniere demande de cet emplacement s'affiche (meme vide)
      if (!this.valide(uid, chemin)){ el.innerHTML = `<span class="ph-vide">—</span>`; return; }
      el.innerHTML = `<span class="ph-vide">…</span>`;
      try { const u = await this.image(chemin); if (u && el.isConnected && el.__ph === j) el.innerHTML = `<img src="${esc(u)}" alt="">`; }
      catch(e){ if (el.isConnected && el.__ph === j) el.innerHTML = `<span class="ph-vide">${esc(e.absent || e.introuvable ? "—" : trad("indisponible"))}</span>`; }
    };
    const semaine = () => {
      const t = $("ph-sem") ? String($("ph-sem").value).trim() : "";
      if (t === "") return null;   // champ vide : pas de « semaine 0 » par defaut
      const n = Math.round(Number(t)); return isFinite(n) && n >= 0 && n <= 520 ? n : null;
    };
    /* les trois emplacements sont construits UNE fois : changer de semaine ne
       remplace pas les boutons (sinon le clic qui suit une saisie se perd) */
    const majEnvoi = () => {
      const z = $("ph-envoi"); if (!z) return;
      const n = semaine(), e = n == null ? null : this.entree(P, n);
      this.vues.forEach(([v]) => {
        const a = e && e.vues && typeof e.vues === "object" ? e.vues[v] : null;
        const ch = z.querySelector(`[data-choisir="${v}"]`), rt = z.querySelector(`[data-retirer="${v}"]`);
        if (ch) ch.textContent = trad(a ? "Changer la photo" : "Choisir une photo");
        if (rt) rt.hidden = !a;
        vignette(z.querySelector(`[data-cadre="${v}"]`), a);
      });
    };
    const construireEnvoi = () => {
      const z = $("ph-envoi"); if (!z) return;
      z.innerHTML = this.vues.map(([v, lbl]) => `<div class="ph-vue" data-vue="${v}">
        <div class="ph-lbl">${esc(trad(lbl))}</div><div class="ph-cadre" data-cadre="${v}"></div>
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-fichier="${v}">
        <div class="actions" style="margin-top:8px"><button type="button" class="btn petit" data-choisir="${v}">${esc(trad("Choisir une photo"))}</button><button type="button" class="btn ghost petit" data-retirer="${v}" hidden>${esc(trad("Retirer"))}</button></div>
      </div>`).join("");
      $$("[data-choisir]", z).forEach(b => b.addEventListener("click", () => { if (semaine() == null){ dire(trad("Indique la semaine."), true); return; } z.querySelector(`[data-fichier="${b.dataset.choisir}"]`).click(); }));
      $$("[data-fichier]", z).forEach(inp => inp.addEventListener("change", async () => {
        const f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
        const n = semaine(), v = inp.dataset.fichier; if (n == null) return;
        dire(trad("Envoi…"));
        try {
          const chemin = this.chemin(uid, n, v);
          await this.envoyer(chemin, await this.reduire(f));
          let x = this.entree(P, n);
          if (!x){ x = { semaine: n, date: aujourdhui(), vues: {} }; P.liste.push(x); P.liste.sort((a, b) => (+a.semaine || 0) - (+b.semaine || 0)); }
          x.vues = Object.assign({}, x.vues, { [v]: chemin }); x.date = aujourdhui();
          Store.ecrire(this.cle, P);
          dire(trad("Photo enregistrée.")); majEnvoi(); dessinerComparaison(true);
        } catch(e){ dire(this.message(e), true); }
      }));
      $$("[data-retirer]", z).forEach(b => b.addEventListener("click", async () => {
        const n = semaine(), v = b.dataset.retirer, x = n == null ? null : this.entree(P, n);
        if (!x || !x.vues || !x.vues[v]) return;
        if (!this.valide(uid, x.vues[v])){ const vues = Object.assign({}, x.vues); delete vues[v]; x.vues = vues; Store.ecrire(this.cle, P); majEnvoi(); dessinerComparaison(true); return; }   // chemin etranger : on l'oublie sans rien effacer
        if (!(await UI.confirmer(trad("Retirer cette photo ?"), { ok: trad("Oui, retirer"), danger: true }))) return;
        try {
          await this.retirer(x.vues[v]);
          const vues = Object.assign({}, x.vues); delete vues[v]; x.vues = vues;
          P.liste = P.liste.filter(y => y && y.vues && Object.keys(y.vues).some(k => y.vues[k]));
          Store.ecrire(this.cle, P);
          dire(trad("Photo retirée.")); majEnvoi(); dessinerComparaison(true);
        } catch(e){ dire(this.message(e, true), true); }
      }));
      majEnvoi();
    };
    const dessinerComparaison = (garder) => {
      const a = $("ph-a"), b = $("ph-b"), z = $("ph-comparaison"); if (!a || !b || !z) return;
      const l = this.semaines(P);
      if (!l.length){ a.innerHTML = b.innerHTML = ""; a.disabled = b.disabled = true; z.innerHTML = `<div class="empty">${esc(trad("Aucune photo pour le moment."))}</div>`; return; }
      const va = garder && l.indexOf(+a.value) > -1 ? +a.value : l[0], vb = garder && l.indexOf(+b.value) > -1 ? +b.value : l[l.length - 1];
      const opts = l.map(n => `<option value="${n}">${esc(trad("Semaine {n}", { n: n }))}</option>`).join("");
      a.innerHTML = b.innerHTML = opts; a.disabled = b.disabled = false; a.value = String(va); b.value = String(vb);
      const ea = this.entree(P, va), eb = this.entree(P, vb);
      z.innerHTML = this.vues.map(([v, lbl]) => `<div class="ph-ligne"><div class="ph-lbl">${esc(trad(lbl))}</div><div class="ph-paire"><div class="ph-cadre" data-c="a-${v}"></div><div class="ph-cadre" data-c="b-${v}"></div></div></div>`).join("");
      this.vues.forEach(([v]) => { vignette(z.querySelector(`[data-c="a-${v}"]`), ea && ea.vues ? ea.vues[v] : null); vignette(z.querySelector(`[data-c="b-${v}"]`), eb && eb.vues ? eb.vues[v] : null); });
    };
    if (!coach && !indexLu){
      const z = $("ph-envoi"); if (z) z.innerHTML = `<p class="note ko" style="margin:0">${esc(trad("Tes photos n'ont pas pu être chargées : recharge la page pour en ajouter."))}</p>`;
      const s = $("ph-sem"); if (s) s.disabled = true;
    } else if (!coach){
      const s = $("ph-sem"); if (s){ s.value = semaineParDefaut != null ? semaineParDefaut : (this.semaines(P).slice(-1)[0] || 1); s.addEventListener("input", majEnvoi); }
      construireEnvoi();
    }
    ["ph-a", "ph-b"].forEach(id => { const el = $(id); if (el) el.addEventListener("change", () => dessinerComparaison(true)); });
    dessinerComparaison(false);
  }
};

const outilMensurations = {
  id: "mensurations",
  cle: "mens",
  nom: "Ma progression",
  principal: true,
  icone: "📏",
  titre: "Ta progression",
  accroche: "Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte.",
  couleurs: ["var(--s1)","var(--s2)","var(--s3)","var(--s4)"],

  /* v35 — la page repond a « est-ce que je progresse ? » : d'abord ou tu en
     es et la courbe de poids, puis les mensurations, puis la composition
     corporelle. La saisie se replie derriere « Ajouter ma mesure », les
     reglages (point de depart, noms des zones) passent en bas. Tous les
     identifiants sont ceux d'avant : la logique n'a pas bouge. */
  html(){
    /* v52 : Ma progression est ouverte au prospect, sans les photos (le depot est reserve aux comptes client en base) ;
       sans leur panneau, Photos.monter ne lit rien */
    const photos = Auth.estProspect() && !Store.idConsulte ? "" : Photos.html();
    return `
    <section class="panel">
      <div class="seance-c-tete"><h2>${esc(trad("Poids"))}</h2>
        ${Store.idConsulte ? "" : `<button type="button" class="btn petit" id="mens-ajouter">+ ${esc(trad("Ajouter ma mesure"))}</button>`}</div>
      <div class="tiles">
        <div class="tile"><div class="t-lbl">Poids actuel</div><div class="t-val readout" id="k-poids">—</div><div class="t-sub" id="k-poids-d">Pas encore de mesure</div></div>
        <div class="tile"><div class="t-lbl">Poids de départ</div><div class="t-val readout" id="k-depart">—</div><div class="t-sub" id="k-depart-d">à renseigner</div></div>
        <div class="tile"><div class="t-lbl">Variation de poids</div><div class="t-val readout" id="k-delta">—</div><div class="t-sub">depuis le départ</div></div>
        <div class="tile"><div class="t-lbl">Semaines suivies</div><div class="t-val readout" id="k-sem">0</div><div class="t-sub" id="k-sem-sub">Commence cette semaine</div></div>
      </div>
      <div class="chartbox" style="margin-top:16px"><svg class="chart" id="chart-poids" role="img" aria-label="Évolution du poids semaine par semaine"></svg><div class="tip" id="tip-poids"></div></div>
    </section>

    <section class="panel" id="mens-saisie"${Store.idConsulte ? " hidden" : ""}>
      <h2>Nouvelle mesure</h2>
      <div class="grid g2">
        <div><label for="e-sem">Semaine</label><input id="e-sem" type="number" min="0" step="1"></div>
        <div><label for="e-date">Date</label><input id="e-date" type="date"></div>
        <div><label for="e-poids">Poids (kg)</label><input id="e-poids" type="number" step="0.1" min="30" max="300"></div>
      </div>
      <h3 style="margin-top:20px">Mensurations (cm)</h3>
      <div class="grid g3" id="entry-zones"></div>
      <details id="compo-saisie">
        <summary>Balance à impédancemètre (facultatif)</summary>
        <div class="grid g3" id="entry-compo" style="margin-top:14px"></div>
        <p class="note" style="margin-top:10px">Pèse-toi toujours dans les mêmes conditions : le matin, à jeun, après être passé(e) aux toilettes et avant de boire. Ces balances ne sont pas précises au chiffre près : c'est l'évolution qui compte. Et compare-toi seulement à toi-même : deux marques de balance ne donnent pas les mêmes chiffres.</p>
      </details>
      <div class="actions"><button class="btn" id="add">Enregistrer la semaine</button><button class="btn ghost" type="button" id="mens-fermer">Fermer</button><span class="msg" id="msg"></span></div>
    </section>

    <section class="panel">
      <h2>Mensurations</h2>
      <div class="tiles" style="margin-bottom:16px">
        <div class="tile"><div class="t-lbl">Centimètres perdus</div><div class="t-val readout" id="k-cm">—</div><div class="t-sub">toutes zones cumulées</div></div>
      </div>
      <div class="chips" id="chips"></div>
      <div class="chartbox"><svg class="chart" id="chart-mens" role="img" aria-label="Évolution des mensurations semaine par semaine"></svg><div class="tip" id="tip-mens"></div></div>
      <div class="legend" id="legend"></div>
      <p class="note" style="margin-top:10px">${CONFIG.mensurations.max_courbes} zones maximum à l'écran — au-delà les courbes deviennent illisibles.</p>
    </section>

    <section class="panel" id="compo-panel" hidden>
      <h2>Composition corporelle</h2>
      <div class="tiles" id="compo-tiles"></div>
      <div class="chips" id="compo-chips" style="margin-top:18px"></div>
      <div class="chartbox"><svg class="chart" id="chart-compo" role="img" aria-label="Évolution de la composition corporelle semaine par semaine"></svg><div class="tip" id="tip-compo"></div></div>
      <p class="note" style="margin-top:10px">Mesures de balance à impédancemètre : fie-toi à la tendance, pas au chiffre d'un jour.</p>
    </section>

    ${photos}

    <section class="panel">
      <h2>Toutes tes mesures</h2>
      <div class="scroll"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
    </section>

    <section class="panel">
      <details>
        <summary>${esc(trad("Point de départ et réglages"))}</summary>
        <div class="grid g2" style="margin-top:14px">
          <div><label for="dstart">Date de départ</label><input id="dstart" type="date"></div>
          <div><label for="pstart">Poids de départ (kg)</label><input id="pstart" type="number" step="0.1" min="30" max="300" placeholder="80"></div>
        </div>
        <h3 style="margin-top:18px">Renommer les zones que tu mesures</h3>
        <div class="grid g2" id="zone-edit"></div>
        <p class="note" style="margin-top:10px">Mesure toujours au même endroit, le matin, à jeun, sans tirer sur le mètre. La régularité compte plus que la précision absolue.</p>
      </details>
    </section>`;
  },

  async init(){
    const cfg = CONFIG.mensurations, self = this;
    const D = await Store.lire(this.cle, {
      dstart:"", pstart:null,
      zones: cfg.zones.slice(),
      affichees: cfg.zones_affichees_au_depart.slice(),
      compo_affichee: "mg",
      mesures: []
    });
    const sauver = () => Store.ecrire(self.cle, D);

    const serieDuPoids = () => {
      const pts = [];
      if (D.pstart != null && isFinite(D.pstart)) pts.push({x:0, y:D.pstart});
      D.mesures.forEach(m => { if (m.poids != null && isFinite(m.poids)) pts.push({x:m.sem, y:m.poids}); });
      return pts.sort((a,b) => a.x-b.x);
    };
    const serieDeZone = i => D.mesures
      .filter(m => m.vals[i] != null && isFinite(m.vals[i]))
      .map(m => ({x:m.sem, y:m.vals[i]}))
      .sort((a,b) => a.x-b.x);
    /* composition corporelle (balance a impedancemetre) */
    const serieCompo = id => D.mesures
      .filter(m => m.compo && m.compo[id] != null && isFinite(m.compo[id]))
      .map(m => ({x:m.sem, y:m.compo[id]}))
      .sort((a,b) => a.x-b.x);
    const compoPresentes = () => cfg.composition.filter(c => serieCompo(c.id).length);
    const valCompo = (c, v) => c.pas >= 1 ? fmt(v) : n1(v);

    const construireZones = () => {
      const b = $("zone-edit"); b.innerHTML = "";
      D.zones.forEach((z,i) => {
        const d = document.createElement("div");
        d.innerHTML = `<label for="z${i}">Zone ${i+1}</label><input id="z${i}" type="text">`;
        b.appendChild(d);
        const inp = d.querySelector("input"); inp.value = z;
        inp.addEventListener("input", () => {
          D.zones[i] = inp.value || ("Zone "+(i+1));
          sauver(); construireChips(); construireSaisie(); dessinerTable(); tout();
        });
      });
    };
    const construireSaisie = () => {
      const b = $("entry-zones"); b.innerHTML = "";
      D.zones.forEach((z,i) => {
        const d = document.createElement("div");
        d.innerHTML = `<label for="ez${i}">${esc(z)}</label><input id="ez${i}" type="number" step="0.1" min="0" max="300" placeholder="cm">`;
        b.appendChild(d);
      });
      const bc = $("entry-compo");
      if (bc) bc.innerHTML = cfg.composition.map(c =>
        `<div><label for="ec-${c.id}">${esc(c.nom)} (${esc(c.unite)})</label><input id="ec-${c.id}" type="number" step="${c.pas}" min="${c.bas}" max="${c.haut}"></div>`).join("");
    };
    const semaineSuivante = () => D.mesures.length ? Math.max(...D.mesures.map(m => m.sem)) + 1 : 1;
    const viderFormulaire = () => {
      $("e-sem").value = semaineSuivante();
      $("e-date").value = aujourdhui();
      $("e-poids").value = "";
      D.zones.forEach((z,i) => { const e = $("ez"+i); if (e) e.value = ""; });
      cfg.composition.forEach(c => { const e = $("ec-" + c.id); if (e) e.value = ""; });
    };

    const construireChips = () => {
      const c = $("chips"); c.innerHTML = "";
      D.zones.forEach((z,i) => {
        const rang = D.affichees.indexOf(i), actif = rang > -1;
        const b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", String(actif));
        b.innerHTML = `<span class="dot"${actif ? ` style="background:${self.couleurs[rang]}"` : ""}></span>${esc(z)}`;
        b.addEventListener("click", () => {
          const k = D.affichees.indexOf(i);
          if (k > -1) D.affichees.splice(k,1);
          else {
            if (D.affichees.length >= cfg.max_courbes){ flash("msg", `${cfg.max_courbes} zones maximum à l'écran.`); return; }
            D.affichees.push(i);
          }
          sauver(); construireChips(); tout();
        });
        c.appendChild(b);
      });
    };

    const dessinerKPI = () => {
      const w = serieDuPoids(), dernier = w[w.length-1];
      $("k-poids").textContent = dernier ? n1(dernier.y) : "—";
      $("k-poids-d").textContent = dernier ? ("semaine "+dernier.x) : "Pas encore de mesure";
      const kd = $("k-depart"), kdd = $("k-depart-d");
      if (kd){ kd.textContent = (D.pstart != null && isFinite(D.pstart)) ? n1(D.pstart) : (w.length ? n1(w[0].y) : "—"); }
      if (kdd){ kdd.textContent = D.dstart ? trad("le {d}", { d: dateFr(D.dstart) }) : (D.pstart != null ? trad("point de départ") : trad("première mesure")); }
      const d = $("k-delta");
      if (w.length > 1){
        const dd = w[w.length-1].y - w[0].y;
        d.textContent = (dd > 0 ? "+" : "−") + n1(Math.abs(dd));
        d.className = "t-val readout " + (dd < 0 ? "pos" : dd > 0 ? "neg" : "");
      } else { d.textContent = "—"; d.className = "t-val readout"; }
      let total = 0, trouve = false;
      D.zones.forEach((z,i) => { const s = serieDeZone(i); if (s.length > 1){ total += s[0].y - s[s.length-1].y; trouve = true; } });
      const c = $("k-cm");
      c.textContent = trouve ? ((total >= 0 ? "−" : "+") + n1(Math.abs(total))) : "—";
      c.className = "t-val readout " + (trouve ? (total > 0 ? "pos" : total < 0 ? "neg" : "") : "");
      $("k-sem").textContent = D.mesures.length;
      $("k-sem-sub").textContent = D.mesures.length ? ("dernière : semaine " + D.mesures[D.mesures.length-1].sem) : "Commence cette semaine";
    };

    const dessinerLegende = sel => {
      const l = $("legend"); l.innerHTML = "";
      sel.forEach(s => { const sp = document.createElement("span"); sp.innerHTML = `<i style="background:${s.couleur}"></i>${esc(s.nom)}`; l.appendChild(sp); });
    };

    const dessinerTable = () => {
      const th = $("thead"), tb = $("tbody");
      const cols = compoPresentes();
      th.innerHTML = `<tr><th>Semaine</th><th>Date</th><th>Poids</th>${D.zones.map(z => `<th>${esc(z)}</th>`).join("")}${cols.map(c => `<th>${esc(c.nom)}</th>`).join("")}<th></th></tr>`;
      tb.innerHTML = "";
      if (!D.mesures.length){
        /* Le message vit HORS du tableau : dans un tableau large qui defile de
           cote, sur telephone, il etait coupe et le bouton hors de l'ecran. */
        th.innerHTML = "";
        const bloc = tb.closest(".scroll");
        if (bloc) bloc.hidden = true;
        let vide = $("mens-vide");
        if (!vide && bloc){ vide = document.createElement("div"); vide.id = "mens-vide"; vide.className = "empty"; bloc.parentNode.insertBefore(vide, bloc.nextSibling); }
        if (vide) vide.innerHTML = Store.idConsulte
          ? `Aucune mesure enregistrée pour le moment.`
          : `Aucune mesure enregistrée pour le moment.<br>Commence par ton poids du jour : c'est ta semaine 1, et la base de ta courbe.<div class="cta-vide"><button type="button" class="btn" id="mens-go">Ajouter ma première mesure</button></div>`;
        const go = $("mens-go");
        if (go) go.addEventListener("click", () => { const sa = $("mens-saisie"); if (sa) sa.hidden = false; const e = $("e-poids"); if (e){ e.scrollIntoView({ behavior:"smooth", block:"center" }); e.focus(); } });
        return;
      }
      { const bloc = tb.closest(".scroll"); if (bloc) bloc.hidden = false; const v = $("mens-vide"); if (v) v.remove(); }
      D.mesures.forEach((m, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>S${esc(m.sem)}</td><td>${esc(dateFr(m.date))}</td><td>${m.poids != null ? n1(m.poids) : "—"}</td>` +
          D.zones.map((z,i) => `<td>${(m.vals[i] != null && isFinite(m.vals[i])) ? n1(m.vals[i]) : "—"}</td>`).join("") +
          cols.map(c => `<td>${(m.compo && m.compo[c.id] != null && isFinite(m.compo[c.id])) ? valCompo(c, m.compo[c.id]) : "—"}</td>`).join("") +
          `<td><button class="del" aria-label="Supprimer la semaine ${esc(m.sem)}">×</button></td>`;
        tr.querySelector(".del").addEventListener("click", () => {
          D.mesures.splice(idx,1); sauver(); dessinerTable(); tout(); viderFormulaire();
        });
        tb.appendChild(tr);
      });
    };

    const dessinerCompo = () => {
      const panneau = $("compo-panel"); if (!panneau) return;
      const l = compoPresentes();
      panneau.hidden = !l.length;
      if (!l.length) return;
      $("compo-tiles").innerHTML = l.map(c => {
        const s = serieCompo(c.id), der = s[s.length-1];
        let sous = "semaine " + esc(der.x);
        if (s.length > 1){
          const dd = der.y - s[0].y;
          const bon = c.sens ? (dd * c.sens > 0 ? "pos" : dd * c.sens < 0 ? "neg" : "") : "";
          sous = `<span class="${bon}">${dd > 0 ? "+" : dd < 0 ? "−" : ""}${valCompo(c, Math.abs(dd))} ${esc(c.unite)}</span> depuis le début`;
        }
        return `<div class="tile"><div class="t-lbl">${esc(c.nom)}</div><div class="t-val readout">${valCompo(c, der.y)}</div><div class="t-sub">${sous}</div></div>`;
      }).join("");
      if (!l.some(c => c.id === D.compo_affichee)) D.compo_affichee = l[0].id;
      const ch = $("compo-chips"); ch.innerHTML = "";
      l.forEach(c => {
        const b = document.createElement("button");
        const actif = c.id === D.compo_affichee;
        b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", String(actif));
        b.innerHTML = `<span class="dot"${actif ? ` style="background:var(--s2)"` : ""}></span>${esc(c.nom)}`;
        b.addEventListener("click", () => { D.compo_affichee = c.id; sauver(); dessinerCompo(); });
        ch.appendChild(b);
      });
      const c = l.find(x => x.id === D.compo_affichee);
      Graphique.dessiner("chart-compo", "tip-compo", [{ nom: c.nom, couleur: "var(--s2)", points: serieCompo(c.id) }], c.unite);
    };

    const tout = () => {
      /* un redimensionnement en attente peut arriver apres avoir quitte
         l'onglet : plus rien a dessiner, on ne fait rien */
      if (!$("k-poids")) return;
      dessinerKPI();
      dessinerCompo();
      Graphique.dessiner("chart-poids","tip-poids",[{nom:"Poids",couleur:"var(--s1)",points:serieDuPoids()}],"kg");
      const sel = D.affichees.map((i,k) => ({nom:D.zones[i], couleur:self.couleurs[k], points:serieDeZone(i)}));
      Graphique.dessiner("chart-mens","tip-mens", sel, "cm");
      dessinerLegende(sel.filter(s => s.points.length));
    };

    $("dstart").value = D.dstart || "";
    $("pstart").value = D.pstart == null ? "" : D.pstart;
    $("dstart").addEventListener("input", function(){ D.dstart = this.value; sauver(); });
    let avaitDepart = Decouverte.peseeFaite(D), departOk = true;   // v62 (H) : le poids de depart saisi ici compte aussi comme premiere pesee
    $("pstart").addEventListener("input", function(){ const v = parseFloat(this.value); D.pstart = (isFinite(v) && v >= 30 && v <= 300) ? v : null; departOk = sauver() !== false; tout(); });
    /* seulement si l'ecriture est partie (une lecture ratee ou un refus : pas d'invitation, rien n'est enregistre) */
    $("pstart").addEventListener("change", function(){ const avait = avaitDepart; avaitDepart = Decouverte.peseeFaite(D); if (departOk && !Store.nonLus.has(D)) premierePesee(avait, () => this.closest(".panel")); });

    /* v62 (brief V2, H) : la toute premiere pesee du prospect (aucune avant) : l'invitation, sous ce qui vient d'etre
       enregistre (une seule fois) */
    const premierePesee = (avait, ancre) => {
      if (avait || !Decouverte.peseeFaite(D) || !Auth.estProspect() || Store.idConsulte) return;
      Invitations.declencher("declic_premiere_pesee", carte => { const a = ancre(); if (!a) return false; a.after(carte); return true; });
    };
    $("add").addEventListener("click", async () => {
      const avait = Decouverte.peseeFaite(D);
      const sem = parseInt($("e-sem").value, 10);
      const poids = parseFloat($("e-poids").value);
      if (!isFinite(sem)){ flash("msg","Indique un numéro de semaine."); return; }
      const vals = {}; let une = false;
      D.zones.forEach((z,i) => { const v = parseFloat($("ez"+i).value); if (isFinite(v)){ vals[i] = v; une = true; } });
      const compo = {}; let uneCompo = false;
      for (const c of cfg.composition){
        const e = $("ec-" + c.id); const v = e ? parseFloat(e.value) : NaN;
        if (!isFinite(v)) continue;
        if (v < c.bas || v > c.haut){ flash("msg", trad("{nom} : entre {bas} et {haut}, vérifie la saisie.", { nom: trad(c.nom), bas: c.bas, haut: c.haut })); return; }
        compo[c.id] = v; uneCompo = true;
      }
      if (!isFinite(poids) && !une && !uneCompo){ flash("msg","Renseigne au moins ton poids, une mensuration ou une mesure de balance."); return; }
      /* Une faute de frappe (7,5 au lieu de 75) ecrase la courbe pour
         toujours : on refuse les valeurs impossibles avant d'enregistrer. */
      if (sem < 0 || sem > 520){ flash("msg","Numéro de semaine invalide."); return; }
      if (isFinite(poids) && (poids < 30 || poids > 300)){ flash("msg","Poids entre 30 et 300 kg, vérifie la virgule."); return; }
      const horsBornes = D.zones.filter((z,i) => vals[i] != null && (vals[i] < 10 || vals[i] > 250));
      if (horsBornes.length){ flash("msg", horsBornes[0] + " : entre 10 et 250 cm, vérifie la saisie."); return; }
      if (D.mesures.some(m => m.sem === sem) && !(await UI.confirmer(trad("La semaine {n} existe déjà. La remplacer ?", { n: sem }), { ok: trad("Oui, remplacer") }))) return;
      D.mesures = D.mesures.filter(m => m.sem !== sem);
      const mesure = { sem, date: $("e-date").value || "", poids: isFinite(poids) ? poids : null, vals };
      if (uneCompo) mesure.compo = compo;
      D.mesures.push(mesure);
      D.mesures.sort((a,b) => a.sem - b.sem);
      if (sauver() === false) return;   // refusee (message deja affiche) : la saisie reste dans le formulaire
      viderFormulaire(); dessinerTable(); tout();
      flash("msg", `Semaine ${sem} enregistrée.`);
      premierePesee(avait, () => $("mens-saisie"));
    });

    construireZones(); construireSaisie(); construireChips(); dessinerTable(); viderFormulaire(); tout();
    /* qui a deja saisi des mesures de balance les retrouve deplies */
    if (compoPresentes().length && $("compo-saisie")) $("compo-saisie").open = true;
    /* la saisie est repliee tant qu'il y a des mesures ; ouverte a la premiere fois */
    const saisie = $("mens-saisie"), ouvrirSaisie = () => { if (!saisie) return; saisie.hidden = false; saisie.scrollIntoView({ behavior:"smooth", block:"start" }); const e = $("e-poids"); if (e) e.focus(); };
    if (saisie && !Store.idConsulte) saisie.hidden = D.mesures.length > 0;
    const ba = $("mens-ajouter"); if (ba) ba.addEventListener("click", ouvrirSaisie);
    const bf = $("mens-fermer"); if (bf) bf.addEventListener("click", () => { if (saisie) saisie.hidden = true; });

    /* v41 — photos de progression (lecture seule pour le coach) */
    const derniere = D.mesures.length ? D.mesures[D.mesures.length - 1].sem : null;
    Photos.monter(Store.idConsulte || (Auth.utilisateur() && Auth.utilisateur().id), derniere);

    let t; const redim = () => { clearTimeout(t); t = setTimeout(tout, 150); };
    window.addEventListener("resize", redim);
    return () => { window.removeEventListener("resize", redim); Photos.oublier(); };
  }
};

