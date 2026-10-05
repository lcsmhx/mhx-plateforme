/* ------------------------------------------------------------------
   « Mon journal » (#/journal).
   v52 : une page VERROUILLEE de la vitrine du prospect (CONFIG.marque.gratuit_vitrine ; l'exemple d'une seance notee :
   Echantillons.journal, lot E). Pour lui, rien ne change : une page verrouillee n'appelle ni html() ni init(), elle ne
   lit ni n'ecrit rien.
   v53 (lot D, partie clients et coach) : l'onglet du CLIENT (client_seul : le coach ne le voit que dans une fiche).
   Il reutilise l'objet Journal (js/outilProgramme.js) et sa cle « journal », la meme que « Mon programme » : aucune cle
   nouvelle. Le client y trouve l'historique de ses seances notees (les plus recentes d'abord) et, pour chaque seance de
   son programme, « Noter ma séance » (Journal.htmlSeance / Journal.brancher, comme dans « Mon programme ») ; sans
   programme, un message clair. Le coach, dans la fiche d'un client (« Ses séances »), voit le meme historique en lecture
   seule : ni formulaire, ni bouton, aucune ecriture (journal n'est ni dans MODIFIABLES ni dans les cles que le coach
   ecrit). cle: null : l'export et la restauration d'une sauvegarde ne changent pas (le journal y est traite comme avant).
   ------------------------------------------------------------------ */
const outilJournal = {
  id: "journal",
  cle: null,
  nom: "Mon journal",
  icone: "📓",
  client_seul: true,   // v53 : client (et prospect : page verrouillee) ; le coach dans une fiche seulement
  titre: "Ton journal d'entraînement",
  accroche: "Tes séances notées, tes charges et tes progrès, séance après séance.",
  PAS: 20,   // seances de l'historique montrees d'un coup (« Afficher les séances plus anciennes » : 20 de plus)

  html(){ return `<div id="jr-vue"><div id="jr-noter"><section class="panel"><div class="empty">${esc(trad("Chargement…"))}</div></section></div><div id="jr-hist"></div></div>`; },

  /* les seances du programme qui ont au moins un exercice nomme (les autres n'ont rien a noter), avec leur index dans
     le programme (si : c'est lui que range le journal) */
  seancesProgramme(P){
    return (P && Array.isArray(P.seances) ? P.seances : []).map((sc, si) => ({ sc, si }))
      .filter(x => x.sc && typeof x.sc === "object" && Array.isArray(x.sc.exercices) && x.sc.exercices.some(e => e && e.nom));
  },

  /* le client : « Noter ma séance » pour chaque seance de son programme (le formulaire vient de Journal.brancher) */
  noterHTML(P, J){
    const l = this.seancesProgramme(P);
    if (!l.length) return `<section class="panel" id="jr-sans-programme"><div class="empty">${esc(trad("Ton coach n'a pas encore déposé ton programme : dès qu'il sera prêt, tu pourras noter tes séances ici."))}</div></section>`;
    const faites = outilProgramme.faitesCetteSemaine(J);
    return `<section class="panel"><h2>${esc(trad("Mes séances du programme"))}</h2>
      <p class="note" style="margin:0">${esc(trad("Choisis la séance que tu viens de faire et note tes répétitions et tes charges, série par série."))}</p></section>` +
      l.map(({ sc, si }) => `<section class="panel seance-c${faites[si] ? " faite" : ""}" id="jr-seance-${si}">
        <div class="seance-c-tete"><h2>${esc(sc.nom || trad("Séance"))}</h2>${faites[si] ? `<span class="pastille ok">✓ ${esc(trad("notée le {d}", { d: dateFr(faites[si]) }))}</span>` : `<span class="pastille">${esc(trad("à faire"))}</span>`}</div>
        <div data-jr-place="${si}"></div></section>`).join("");
  },

  /* l'historique : les seances notees, les plus recentes d'abord (date, puis ordre d'enregistrement) ; n premieres */
  triees(J){
    return (J && Array.isArray(J.seances) ? J.seances : []).map((x, i) => ({ x, i })).filter(o => o.x && typeof o.x === "object")
      .sort((a, b) => { const da = String(a.x.date || ""), db = String(b.x.date || ""); return da < db ? 1 : da > db ? -1 : b.i - a.i; })
      .map(o => o.x);
  },
  historiqueHTML(J, n, consultation){
    const l = this.triees(J), vus = l.slice(0, n);
    const T = t => consultation ? t : trad(t);   // les ecrans du coach ne sont pas traduits
    const tete = `<div class="seance-c-tete"><h2>${esc(consultation ? "Séances notées par ton client" : trad("Mes séances notées"))}</h2>${l.length ? `<span class="pastille" id="jr-nb">${fmt(l.length)}</span>` : ""}</div>`;
    if (!l.length) return `<section class="panel" id="jr-historique">${tete}<div class="empty">${esc(T("Aucune séance notée pour le moment."))}</div></section>`;
    const exos = x => (Array.isArray(x.exos) ? x.exos : []).filter(e => e && typeof e === "object" && e.nom);
    return `<section class="panel" id="jr-historique">${tete}
      <p class="note" style="margin:-6px 0 14px">${esc(consultation ? "Lecture seule : les séances qu'il a notées (dans « Mon journal » ou « Mon programme »), les plus récentes d'abord." : trad("Les plus récentes d'abord."))}</p>
      ${vus.map(x => `<div class="exo jr-h" data-jr-h>
        <div class="seance-c-tete" style="margin-bottom:8px"><h3 style="margin:0;flex:1">${esc(x.nom || T("Séance"))}</h3><span class="pastille">${esc(dateFr(x.date))}</span></div>
        ${exos(x).length ? `<ul class="ingr fiche-l">${exos(x).map(e => `<li><span>${esc(e.nom)}</span><b>${esc(Journal.resumeSeries(e) || "—")}</b></li>`).join("")}</ul>` : ""}
      </div>`).join("")}
      ${l.length > vus.length ? `<div class="actions"><button type="button" class="btn ghost" id="jr-plus" data-lecture-ok>${esc(T("Afficher les séances plus anciennes"))}</button></div>` : ""}
    </section>`;
  },

  async init(){
    const self = this, consultation = !!Store.idConsulte;
    /* le programme ne sert qu'au client (« Noter ma séance ») : le coach ne lit que le journal */
    const P = consultation ? null : await Store.lire("programme", { nom:"", note:"", seances:[], maj:"" });
    const J = await Store.lire(Journal.cle, Journal.vide());
    const noter = $("jr-noter"), hist = $("jr-hist");
    if (!noter || !hist) return;   // page quittee pendant la lecture
    /* lecture ratee (reseau, 5xx) : « Pas de connexion » + Reessayer, jamais « Aucune séance notée » ni « pas encore déposé ton
       programme » (faux), comme Mon programme (v71 F) */
    if (Store.nonLus.has(J) || (P && Store.nonLus.has(P))){ pageHorsLigne(noter); hist.innerHTML = ""; return; }
    if (!Array.isArray(J.seances)) J.seances = [];
    let n = this.PAS;
    const dessinerHist = () => {
      hist.innerHTML = self.historiqueHTML(J, n, consultation);
      const plus = $("jr-plus"); if (plus) plus.addEventListener("click", () => { n += self.PAS; dessinerHist(); });
    };
    /* le coach (fiche d'un client) : l'historique seul, en lecture seule */
    if (consultation){ noter.innerHTML = ""; dessinerHist(); return; }
    /* le client : ses seances a noter, puis l'historique ; apres une seance notee, tout est redessine (pastilles, liste) */
    const dessiner = () => { noter.innerHTML = self.noterHTML(P, J); dessinerHist(); };
    const apres = () => { dessiner(); Journal.brancher(noter, P, J, apres); };
    dessiner();
    await Journal.brancher(noter, P, J, apres);
  }
};
