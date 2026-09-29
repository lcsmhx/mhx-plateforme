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
     attendue dans source(HTML), sinon forcerInscription ne forcerait qu'une partie du fichier).
   v59 : forcerNouveautes(texte, valeurs)
     le texte avec la PREMIÈRE valeur de chaque interrupteur des nouveautés (NOUVEAUTES : « feedback_dimanche: "…" »,
     « suivi_visites_clients: "…" », js/config.js) remplacée par celle de valeurs, « test » par défaut (NOUVEAUTES_BANC).
     servirFichier l'applique PAR DÉFAUT, pour TOUTES les suites, avant la retouche propre à la suite : ce que le banc
     sert ne dépend plus de la valeur écrite dans le fichier (« test », « tous » ou « off » : Lucas peut passer un
     interrupteur sur « tous » sans rendre le banc rouge). Beaucoup de suites s'en servent sans le dire (Thomas, client
     hors test : bilan du vendredi, visites non suivies). Une suite qui teste « tous » ou « off » le fait le temps d'un
     bloc (avec), en partant de « test ». Avec « test » dans le fichier, rien ne change à ce qui est servi.
   valeursNouveaute(texte, nom)
     les valeurs (entre guillemets) de toutes les occurrences « nom: "…" » (verif55, 57, 58 : une seule attendue dans
     source(HTML), connue : off, test ou tous ; une faute de frappe comme « Tous » rend le banc rouge).
   sourceServie(html, lire)
     comme source, mais ce que les suites SERVENT (interrupteurs forcés) : avec() y cherche son texte, pas sur le disque.
   simulation(env) (preuve sans jamais pousser « tous ») : BANC_SIMULER_NOUVEAUTES si posée, sinon d'après la branche
     (GITHUB_REF, posé par GitHub Actions) : refs/heads/v2/simu-tous-* → « tous », refs/heads/v2/simu-off-* → « off » ;
     "" : pas de simulation. Les lectures du DISQUE (servirFichier et source sans lire) voient alors le fichier comme s'il
     portait cette valeur, sans que le disque change ; les révisions git (lire, verif52) jamais. Lue à chaque lecture
     (verif55 A0 la pose le temps d'un bloc, y compris sur main). Posée pour tout le banc sur main (GITHUB_REF =
     refs/heads/main) : refusée, au chargement de ce fichier (chaque suite s'arrête aussitôt) et par banc.sh.
   refusSimulation(env) : le message de ce refus, "" s'il n'y en a pas. */
const fs = require("fs"), path = require("path");
const TYPES = { ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

function servirFichier(req, res, html, retouche, lire){
  const p = decodeURIComponent(String(req.url || "").split("?")[0].split("#")[0]);
  const m = /^\/((css|js)\/[A-Za-z0-9._-]+\.(css|js))$/.exec(p);
  if (!m || m[2] !== m[3]) return false;
  let t;
  try { t = lire ? lire(m[1]) : fs.readFileSync(path.join(path.dirname(html), m[1]), "utf8"); }
  catch (e) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("absent : " + m[1]); return true; }
  if (!lire) t = duDisque(t);   // v59 : le disque, vu à travers la simulation (jamais une révision git)
  t = forcerNouveautes(t);   // v59 : toujours « test », AVANT la retouche de la suite (ses avec() partent de « test »)
  if (retouche) t = retouche(t);
  res.writeHead(200, { "Content-Type": TYPES["." + m[3]], "Cache-Control": "no-store" });
  res.end(t);
  return true;
}

function listes(h){
  const l = k => { const x = new RegExp("var " + k + " = \\[([\\s\\S]*?)\\];").exec(h); return x ? JSON.parse("[" + x[1] + "]") : []; };
  return l("MHX_CSS").concat(l("MHX_JS"));
}

/* v59 : la page puis ses fichiers, chaque lecture du disque vue à travers la simulation (duDisque), jamais une révision git */
function morceaux(html, lire){
  const h = lire ? lire("index.html") : duDisque(fs.readFileSync(html, "utf8"));
  return [h].concat(listes(h).map(f => lire ? lire(f) : duDisque(fs.readFileSync(path.join(path.dirname(html), f), "utf8"))));
}
function source(html, lire){ return morceaux(html, lire).join("\n"); }
/* v59 : ce que les suites servent — la page telle quelle, ses fichiers css/ et js/ avec les interrupteurs forcés (servirFichier) */
function sourceServie(html, lire){ return morceaux(html, lire).map((t, i) => i ? forcerNouveautes(t) : t).join("\n"); }

function forcerInscription(texte, valeur){
  return texte.replace(/inscription_libre: (?:true|false)\b/, "inscription_libre: " + (valeur ? "true" : "false"));
}

function valeursInscription(texte){
  return Array.from(String(texte).matchAll(/inscription_libre: (true|false)\b/g), m => m[1]);
}

/* v59 : interrupteurs des nouveautés (CONFIG.nouveautes, js/config.js), servis sur « test » par le banc */
const NOUVEAUTES = ["feedback_dimanche", "suivi_visites_clients"], NOUVEAUTES_BANC = Object.fromEntries(NOUVEAUTES.map(n => [n, "test"]));
/* la valeur entre guillemets, collée à « nom: » (jamais « feedback_dimanche : » d'un commentaire, js/outilSuivi.js) */
const motifNouveaute = (nom, g) => new RegExp("\\b(" + nom + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function poserNouveautes(texte, valeurs){
  let t = String(texte);
  for (const n of NOUVEAUTES) if (valeurs[n] != null) t = t.replace(motifNouveaute(n), (x, a) => a + JSON.stringify(String(valeurs[n])));
  return t;
}
function forcerNouveautes(texte, valeurs){ return poserNouveautes(texte, Object.assign({}, NOUVEAUTES_BANC, valeurs || {})); }
function valeursNouveaute(texte, nom){ return Array.from(String(texte).matchAll(motifNouveaute(nom, true)), m => m[2]); }

/* v59 : la simulation (voir l'en-tête) ; des lettres seulement, pour ne jamais casser le fichier servi */
function simulation(env){
  env = env || process.env;
  const ref = String(env.GITHUB_REF || "");
  const v = String(env.BANC_SIMULER_NOUVEAUTES || "").trim()
    || (ref.startsWith("refs/heads/v2/simu-tous-") ? "tous" : ref.startsWith("refs/heads/v2/simu-off-") ? "off" : "");
  if (v && !/^[A-Za-z]{1,12}$/.test(v)) throw new Error("BANC_SIMULER_NOUVEAUTES illisible (des lettres seulement) : " + v);
  return v;
}
/* jamais sur main : main teste toujours le vrai fichier ("" : pas de refus) */
function refusSimulation(env){
  env = env || process.env;
  const v = simulation(env);
  return v && String(env.GITHUB_REF || "") === "refs/heads/main" ? "simulation des interrupteurs (« " + v + " ») sur main : refusée, main teste toujours le vrai fichier" : "";
}
function duDisque(t){ const v = simulation(); return v ? poserNouveautes(t, Object.fromEntries(NOUVEAUTES.map(n => [n, v]))) : t; }
{ const r = refusSimulation(); if (r) throw new Error(r); }   // au chargement : le banc entier, jamais le temps d'un bloc

module.exports = { servirFichier, source, sourceServie, listes, forcerInscription, valeursInscription,
  NOUVEAUTES, forcerNouveautes, valeursNouveaute, simulation, refusSimulation };
