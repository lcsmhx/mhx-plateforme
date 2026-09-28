/* 52.1 (chantier 1 bis) — index.html ne contient plus que le HTML : il charge son CSS (css/) et son JavaScript (js/)
   dans l'ordre des listes MHX_CSS et MHX_JS, chaque lien portant ?v=<MHX_FICHIERS>.
   Les serveurs des suites servent donc la page ET ces fichiers, depuis le dossier de la page testée, avec LES MÊMES
   retouches que la page (ex. la valeur d'inscription_libre, forcée par forcerInscription : ce texte est maintenant dans
   js/config.js).

   servirFichier(req, res, html, retouche, lire)
     sert /css/<nom>.css ou /js/<nom>.js (404 s'il n'existe pas) et renvoie true ; sinon renvoie false (la suite sert
     la page comme avant). retouche(texte) : facultative, appliquée au fichier comme à la page. lire(chemin) :
     facultatif, remplace la lecture sur le disque (verif52 : fichiers d'une révision git de référence).
   source(html, lire)
     le texte de la page puis de tous ses fichiers, dans l'ordre de chargement : pour les suites qui cherchent un texte
     « dans le fichier testé » (version, CONFIG…). Une page sans MHX_JS (v52 et avant) : la page seule.
   listes(texte de la page) : les chemins de MHX_CSS puis de MHX_JS.
   v55 : forcerInscription(texte, valeur)
     le texte avec la PREMIÈRE valeur « inscription_libre: true|false » remplacée par la valeur voulue (true si valeur est
     vraie, sinon false), dans les deux sens. Ouverte dans le fichier depuis la v54 : les suites qui testent l'inscription
     (rig, verif39, 40, 50, 52, 53, 55 ; hors banc verif44, 47) la forcent ainsi, fermée par défaut et ouverte le temps de
     leurs blocs d'inscription (au lieu d'une retouche recopiée dans chacune) ; les autres suites servent la valeur du
     fichier.
   valeursInscription(texte)
     les valeurs ("true" / "false") de toutes les occurrences « inscription_libre: true|false » (verif52 : une seule
     attendue dans source(HTML), sinon forcerInscription ne forcerait qu'une partie du fichier). */
const fs = require("fs"), path = require("path");
const TYPES = { ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

function servirFichier(req, res, html, retouche, lire){
  const p = decodeURIComponent(String(req.url || "").split("?")[0].split("#")[0]);
  const m = /^\/((css|js)\/[A-Za-z0-9._-]+\.(css|js))$/.exec(p);
  if (!m || m[2] !== m[3]) return false;
  let t;
  try { t = lire ? lire(m[1]) : fs.readFileSync(path.join(path.dirname(html), m[1]), "utf8"); }
  catch (e) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("absent : " + m[1]); return true; }
  if (retouche) t = retouche(t);
  res.writeHead(200, { "Content-Type": TYPES["." + m[3]], "Cache-Control": "no-store" });
  res.end(t);
  return true;
}

function listes(h){
  const l = k => { const x = new RegExp("var " + k + " = \\[([\\s\\S]*?)\\];").exec(h); return x ? JSON.parse("[" + x[1] + "]") : []; };
  return l("MHX_CSS").concat(l("MHX_JS"));
}

function source(html, lire){
  const h = lire ? lire("index.html") : fs.readFileSync(html, "utf8");
  return [h].concat(listes(h).map(f => lire ? lire(f) : fs.readFileSync(path.join(path.dirname(html), f), "utf8"))).join("\n");
}

function forcerInscription(texte, valeur){
  return texte.replace(/inscription_libre: (?:true|false)\b/, "inscription_libre: " + (valeur ? "true" : "false"));
}

function valeursInscription(texte){
  return Array.from(String(texte).matchAll(/inscription_libre: (true|false)\b/g), m => m[1]);
}

module.exports = { servirFichier, source, listes, forcerInscription, valeursInscription };
