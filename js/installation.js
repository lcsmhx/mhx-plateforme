/* ------------------------------------------------------------------
   « Ajoute l'application à ton écran d'accueil »
   Le mode d'emploi n'est pas le meme selon le telephone, et il n'y a
   aucun moyen fiable de le detecter : on montre celui qui correspond,
   et on laisse le choix de voir l'autre. Une fois que la personne a
   clique sur « C'est fait », la banniere ne revient plus — le reglage
   reste sur son appareil, puisqu'il ne concerne QUE cet appareil.
   ------------------------------------------------------------------ */
const CLE_INSTALL = "mhx_installe";

/* Le manifeste est embarque dans le fichier, donc sans adresse de base : sans
   start_url ni scope, « ajouter a l'ecran d'accueil » ouvrirait la racine du
   domaine au lieu de l'application. On les recalcule au demarrage depuis
   l'adresse reelle — l'application tourne ainsi sur n'importe quel
   hebergement, y compris dans un sous-dossier, sans etre retouchee. */
function ancrerManifeste(){
  const lien = document.getElementById("manifeste");
  if (!lien || !lien.href || lien.href.indexOf("data:") !== 0) return;
  try {
    const brut = decodeURIComponent(lien.href.replace(/^data:application\/manifest\+json,/, ""));
    const m = JSON.parse(brut);
    const ici = location.origin + location.pathname;
    m.start_url = ici;
    m.scope = ici.replace(/[^/]*$/, "");     // le dossier qui contient la page
    const blob = new Blob([JSON.stringify(m)], { type: "application/manifest+json" });
    lien.href = URL.createObjectURL(blob);
  } catch(e){ /* le manifeste reste tel quel : l'application fonctionne quand meme */ }
}

function dejaInstalle(){
  /* lancee depuis l'ecran d'accueil : la question ne se pose plus */
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.navigator && window.navigator.standalone) return true;
  try {
    if (sessionStorage.getItem(CLE_INSTALL) === "1") return true;   // « plus tard »
    return localStorage.getItem(CLE_INSTALL) === "1";               // « c'est fait »
  } catch(e){ return false; }
}

/* La banniere n'apparait qu'a partir de la 2e visite. A la toute premiere,
   le nouveau client doit voir son espace et remplir son profil : une grande
   fenetre qui masque tout, c'est la pire premiere impression (retour QA de
   GROK, 22/09). Une visite = une ouverture de l'application, comptee une
   seule fois meme si on change d'onglet. */
function visiteSuivante(){
  try {
    if (!sessionStorage.getItem("mhx_visite_comptee")){
      sessionStorage.setItem("mhx_visite_comptee", "1");
      localStorage.setItem("mhx_visites", String((parseInt(localStorage.getItem("mhx_visites"), 10) || 0) + 1));
    }
    return (parseInt(localStorage.getItem("mhx_visites"), 10) || 0) >= 2;
  } catch(e){ return true; }
}

function bandeauInstallation(){
  if (!Auth.connecte() || Store.idConsulte || dejaInstalle() || !visiteSuivante()) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
  return `<div class="installe" id="installe">
    <button type="button" class="fermer" id="inst-plus-tard" aria-label="Plus tard">×</button>
    <h3>Mets ${esc(CONFIG.marque.nom)} sur ton écran d'accueil</h3>
    <p>Tu l'ouvres d'un doigt, elle s'affiche en plein écran, et tu n'as plus à retenir l'adresse.</p>
    <ol id="inst-etapes">${ios ? etapesIOS() : etapesAndroid()}</ol>
    <p class="note" style="margin:0 0 12px">
      <button type="button" class="lien-bouton" id="inst-bascule">${ios ? "Je suis sur Android ou ordinateur" : "Je suis sur iPhone"}</button>
    </p>
    <div class="actions">
      <button class="btn" id="inst-fait">C'est fait</button>
      <button class="btn ghost" id="inst-plus-tard-2">Plus tard</button>
    </div>
  </div>`;
}

function etapesIOS(){
  return `<li>Touche le bouton <b>Partager</b> en bas de Safari — le carré avec une flèche vers le haut.</li>
          <li>Fais défiler et choisis <b>« Sur l'écran d'accueil »</b>.</li>
          <li>Touche <b>Ajouter</b> en haut à droite.</li>`;
}
function etapesAndroid(){
  return `<li>Ouvre le menu de ton navigateur — les trois points en haut à droite.</li>
          <li>Choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</li>
          <li>Confirme.</li>`;
}

function brancherInstallation(){
  const boite = $("installe");
  if (!boite) return;
  let ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");

  const bascule = $("inst-bascule");
  if (bascule) bascule.addEventListener("click", () => {
    ios = !ios;
    $("inst-etapes").innerHTML = ios ? etapesIOS() : etapesAndroid();
    bascule.textContent = ios ? "Je suis sur Android ou ordinateur" : "Je suis sur iPhone";
  });

  const fait = $("inst-fait");
  if (fait) fait.addEventListener("click", () => {
    try { localStorage.setItem(CLE_INSTALL, "1"); } catch(e){}
    boite.remove();
  });

  /* « Plus tard » ne ferme que pour cette visite : la banniere reviendra
     a la prochaine ouverture, mais pas dans cette session. */
  const plusTard = () => { boite.remove(); sessionStorage.setItem(CLE_INSTALL, "1"); };
  const b1 = $("inst-plus-tard"), b2 = $("inst-plus-tard-2");
  if (b1) b1.addEventListener("click", plusTard);
  if (b2) b2.addEventListener("click", plusTard);
}

