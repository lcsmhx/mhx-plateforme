/* ------------------------------------------------------------------
   OUTIL — Les complements alimentaires
   Le coach coche ce que prend le client et fixe les doses ; le client
   lit sa liste. Les poudres proteinees comptent dans la journee : leur
   shaker devient une collation du plan alimentaire.
   ------------------------------------------------------------------ */
const outilComplements = {
  id: "complements",
  cle: "complements",
  nom: "Mes compléments",
  icone: "💊",
  titre: "Les compléments",
  accroche: "Ce que tu prends, à quelle dose et à quel moment. Rien d'obligatoire : un complément complète une alimentation, il ne la remplace pas.",

  vide(){ return { liste: [], note: "" }; },

  migrer(D){
    if (!D || typeof D !== "object") return this.vide();
    if (!Array.isArray(D.liste)) D.liste = [];
    if (typeof D.note !== "string") D.note = "";
    return D;
  },

  /* Le shaker d'une poudre proteinee, avec ses vraies macros a la dose
     choisie. Sert au plan alimentaire : sans ca, on ferait manger deux
     fois les memes proteines. */
  shaker(D){
    const p = (D.liste || []).find(x => x.proteine && +x.dose > 0 && x.par100);
    if (!p) return null;
    const k = (+p.dose || 0) / 100;
    return {
      nom: p.nom, dose: +p.dose, unite: p.unite || "g",
      kcal:      Math.round((p.par100.kcal || 0) * k),
      proteines: Math.round((p.par100.prot || 0) * k),
      glucides:  Math.round((p.par100.gluc || 0) * k),
      lipides:   Math.round((p.par100.lip  || 0) * k)
    };
  },

  ligne(c, i, edition){
    const macros = c.proteine && c.par100 ? (() => {
      const k = (+c.dose || 0) / 100;
      return `<span class="meta">${fmt((c.par100.kcal||0)*k)} kcal · ${fmt((c.par100.prot||0)*k)} g de protéines par dose</span>`;
    })() : "";
    if (!edition){
      return `<li class="compl-l">
        <div><b>${esc(c.nom)}</b> ${c.dose ? `<span class="pastille">${esc(String(c.dose))} ${esc(c.unite || "")}</span>` : ""}
          ${c.proteine ? `<span class="pastille compl-prot">compté dans tes repas</span>` : ""}</div>
        ${c.moment ? `<span class="meta">${esc(c.moment)}</span>` : ""}
        ${macros}
        ${c.note ? `<p class="note" style="margin:4px 0 0">${esc(c.note)}</p>` : ""}
      </li>`;
    }
    return `<li class="compl-l compl-edit">
      <div class="compl-champs">
        <div><label>Complément</label><input type="text" data-c="${i}" data-f="nom" value="${esc(c.nom)}"></div>
        <div><label>Dose</label><input type="number" min="0" step="0.5" data-c="${i}" data-f="dose" value="${esc(c.dose)}"></div>
        <div><label>Unité</label><input type="text" data-c="${i}" data-f="unite" value="${esc(c.unite)}" placeholder="g"></div>
        <div><button class="del" data-suppr-c="${i}" aria-label="Retirer">×</button></div>
        <div class="plein"><label>Quand</label><input type="text" data-c="${i}" data-f="moment" value="${esc(c.moment)}" placeholder="Le matin, pendant un repas"></div>
        <div class="plein"><label>Précision pour le client</label><input type="text" data-c="${i}" data-f="note" value="${esc(c.note)}" placeholder="Dans 250 ml d'eau, après la séance"></div>
      </div>
      ${c.proteine ? `<p class="note" style="margin:8px 0 0">${macros} — cette dose est comptée comme une collation dans son plan alimentaire.</p>` : ""}
    </li>`;
  },

  /* ---------- vue client ---------- */
  vueLecture(D){
    if (!D.liste.length){
      return `<section class="panel"><div class="empty">Ton coach ne t'a pas prescrit de complément. C'est une bonne nouvelle : rien ne remplace tes repas.</div></section>`;
    }
    return `<section class="panel">
      <h2>Ce que tu prends</h2>
      <ul class="compl">${D.liste.map((c, i) => this.ligne(c, i, false)).join("")}</ul>
      ${D.note ? `<div class="flag" style="margin-top:16px"><b>Mot de ton coach :</b> ${esc(D.note)}</div>` : ""}
      ${this.avertissement()}
    </section>`;
  },

  avertissement(){
    return `<p class="note" style="margin-top:18px">Un complément ne rattrape pas une alimentation qui ne va pas : commence toujours par tes repas.
      Si tu prends un traitement, si tu es enceinte ou si tu as une pathologie, demande à ton médecin avant d'en ajouter un —
      certains interagissent avec des médicaments. Ton coach n'est pas médecin.</p>`;
  },

  /* ---------- vue coach ---------- */
  vueEdition(D){
    const dejaPris = id => D.liste.some(c => c.ref === id);
    let h = `<section class="panel">
      <h2>Ajouter un complément</h2>
      <p class="note" style="margin:0 0 14px">Coche ce qu'il prend déjà, ou ce que tu lui conseilles. Les doses proposées sont des valeurs usuelles : ajuste-les.</p>
      <div class="chips">${CONFIG.nutrition.complements.map(c =>
        `<button type="button" class="chip" data-cat="${esc(c.id)}"${dejaPris(c.id) ? " disabled" : ""}>
          ${esc(c.nom)}${dejaPris(c.id) ? " ✓" : ""}
        </button>`).join("")}</div>
      <div class="actions"><button class="btn ghost" id="cp-libre">+ Un autre complément</button></div>
    </section>`;

    h += `<section class="panel">
      <h2>Sa liste</h2>
      ${D.liste.length
        ? `<ul class="compl">${D.liste.map((c, i) => this.ligne(c, i, true)).join("")}</ul>`
        : `<div class="empty">Rien pour l'instant. C'est très bien aussi : ne prescris que ce qui sert.</div>`}
      <div style="margin-top:18px"><label for="cp-note">Mot pour ton client</label>
        <textarea id="cp-note" rows="2" placeholder="Pourquoi ces compléments, et pendant combien de temps">${esc(D.note)}</textarea></div>
      ${this.avertissement()}
    </section>`;
    return h;
  },

  html(){ return `<div id="cp-vue"><section class="panel"><div class="empty">Chargement…</div></section></div>`; },

  async init(){
    const self = this;
    const edition = Auth.estCoach() && Store.idConsulte;
    const D = this.migrer(await Store.lire(this.cle, this.vide()));
    const zone = $("cp-vue");
    if (!zone) return;
    if (Store.nonLus.has(D)){ pageHorsLigne(zone); return; }   // lecture ratee : « Pas de connexion », pas « aucun complément prescrit » (faux)
    const sauver = () => Store.ecrire(self.cle, D);

    if (!edition){ zone.innerHTML = self.vueLecture(D); return; }

    const redessiner = () => { zone.innerHTML = self.vueEdition(D); brancher(); };

    function brancher(){
      $$("[data-cat]", zone).forEach(b => b.addEventListener("click", () => {
        const modele = CONFIG.nutrition.complements.find(c => c.id === b.dataset.cat);
        if (!modele) return;
        D.liste.push({
          ref: modele.id, nom: modele.nom, dose: modele.dose, unite: modele.unite,
          moment: modele.moment, note: "",
          proteine: !!modele.proteine, par100: modele.par100 || null
        });
        sauver(); redessiner();
      }));

      const libre = $("cp-libre");
      if (libre) libre.addEventListener("click", () => {
        D.liste.push({ ref:"", nom:"", dose:"", unite:"", moment:"", note:"", proteine:false, par100:null });
        sauver(); redessiner();
      });

      $$("[data-f]", zone).forEach(el => el.addEventListener("input", () => {
        const c = D.liste[+el.dataset.c];
        if (!c) return;
        c[el.dataset.f] = el.value;
        /* on rafraichit les macros affichees sans redessiner : redessiner
           ferait perdre le curseur a chaque chiffre tape */
        if (el.dataset.f === "dose" && c.proteine && c.par100){
          const boite = el.closest(".compl-l");
          const note = boite && boite.querySelector(".note");
          if (note){
            const k = (+c.dose || 0) / 100;
            note.textContent = fmt((c.par100.kcal||0)*k) + " kcal · " + fmt((c.par100.prot||0)*k) +
              " g de protéines par dose — cette dose est comptée comme une collation dans son plan alimentaire.";
          }
        }
        sauver();
      }));

      $$("[data-suppr-c]", zone).forEach(b => b.addEventListener("click", () => {
        D.liste.splice(+b.dataset.supprC, 1); sauver(); redessiner();
      }));

      const n = $("cp-note");
      if (n) n.addEventListener("input", () => { D.note = n.value; sauver(); });
    }

    redessiner();
  }
};

