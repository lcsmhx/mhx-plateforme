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
   refusSimulation(env) : le message de ce refus, "" s'il n'y en a pas.
   v64 (brief V2, A2 et K) : les 3 emplacements « à compléter » de js/config.js (CONFIG.textes_legaux : cgu_pdf,
   confidentialite_pdf, cgu_version) et le VERROU de publication (verif70, bloc A0). Rien de ceci n'est appliqué par
   défaut : servirFichier sert toujours le fichier tel quel (hors interrupteurs), comme avant.
   LEGAUX : les 3 noms. LEGAUX_TEST : 3 valeurs de test (2 liens Drive fictifs différents, jamais ouverts par un test ;
     version 2026-10-01), les mêmes liens que ceux des suites qui servent l'écran d'inscription (verif39, 50, 55, 67 bloc J
     et verif71 servent, elles, une version 2026-10-15, distincte du texte court qui vaut 2026-10-01 depuis la v64) : elles
     font marcher l'écran, mais le verrou les REFUSE (jamais publiables).
   LIENS_TEST : les liens Google Drive de test écrits dans les suites (grep du 30/09 : LEGAUX_TEST, recopié dans verif39,
     40, 50, 53, 55, 67 et 70 ; verif71 : TEST-CGU-71 et TEST-POLITIQUE-71 ; verif66 : un guide du banc).
   valeursLegales(texte, nom) : les valeurs (entre guillemets droits) de toutes les occurrences « nom: "…" ».
   lienDrive(s) : { id } (l'identifiant du document, toute longueur) ou { pb } (pourquoi ce n'est pas un lien de document
     Drive). Accepté seulement : https, drive.google.com ou docs.google.com, sans compte ni port, écrit sous sa forme
     standard (new URL(s).href === s), uniquement des caractères de \x21 à \x7E (ni espace, ni caractère invisible
     comme U+200B, ni accent), et l'un des 4 chemins …/file/d/<id>, …/document/d/<id> (suivis de « / » ou de la fin du
     chemin), …/open?id=<id>, …/uc?id=<id> ; <id> en [A-Za-z0-9_-]. Décision de Lucas du 30/09 (en attendant un lien par
     fichier) : aussi le lien d'un DOSSIER Drive, drive.google.com/drive/folders/<id> (suivi au plus d'un « / » ; ni
     /drive/u/0/… d'un compte, ni docs.google.com) → { id, dossier: true }.
   idsDeTest() : identifiant → fichier, pour LIENS_TEST ET tout lien Google Drive écrit dans un fichier .js de ce dossier
     (tests-locaux : les suites, lues une fois) : une valeur de test d'une suite n'est jamais publiable, même recopiée.
   idModele(id) : "" pour un identifiant qui a l'air réel, sinon pourquoi il ressemble à un modèle écrit à la main : sans
     minuscule, sans majuscule ou sans chiffre, 5 caractères identiques à la suite, un mot de gabarit (MOTS_MODELE :
     EXEMPLE, EXAMPLE, SAMPLE, COMPLET, REMPLAC, PLACEHOLDER, VOTRE, COLLER, PASTE, DUMMY, IDENTIFIANT, DOCUMENT, QWERTY,
     AZERTY, toute casse), une suite de 6 (abcdef, zyxwvu, 123456, 987654, toute casse). Mesuré le 30/09 : les 13
     identifiants Drive de js/outilFormation.js passent ; sur 250 000 tirages réalistes (« 1 » + aléatoire) : 4 refus
     par million à 28 et 33 caractères, 12 à 44, 28 à 25 (le lien d'un PDF : 33) ; un identifiant Drive commence par
     « 1 » (ou « 0B », ancien), donc a toujours un chiffre.
   problemeLien(s) : "" si s est publiable (lien d'un PDF de Lucas), sinon la raison : lienDrive, puis lien de test
     (identifiant de idsDeTest, ou qui commence ou finit par TEST, ou …-TEST-…, toute casse), puis identifiant de moins
     de 25 caractères (un vrai en a 28, 33 ou 44), puis idModele. documentDrive(s) : l'identifiant d'un lien publiable,
     "" sinon.
   legauxBorne(maintenant) : la dernière date acceptée pour cgu_version, aujourd'hui (UTC ; maintenant en ms, Date.now()
     par défaut) + 366 jours : une faute sur l'année (2062, 2099) est refusée, une version juste reste valide ensuite.
   legauxManquants(texte, maintenant) : ce qui manque pour publier ([] = complet), lu dans le TEXTE — chaque emplacement
     écrit UNE fois, entre guillemets droits ; 2 liens publiables (problemeLien) vers 2 documents différents, OU le MÊME
     dossier Drive pour les deux (décision de Lucas du 30/09 : le dossier qui contient les 2 PDF ; un dossier n'est jamais
     accepté autrement : ni 2 dossiers différents, ni un dossier avec un fichier), dont
     l'identifiant n'est écrit nulle part ailleurs dans le texte (hors des 3 emplacements : un PDF de la formation,
     js/outilFormation.js, collé par erreur) ; cgu_version = une date AAAA-MM-JJ réelle, postérieure au 2026-09-30 et au
     plus tard legauxBorne(maintenant).
   legauxExecutes(conf) : les 3 valeurs de CONFIG.textes_legaux quand js/config.js (conf) est EXÉCUTÉ seul dans un bac à
     sable (vm, 2 s au plus) ; { erreur } sinon. legauxEcarts(conf) : [] si chaque valeur exécutée est exactement la
     valeur lue dans le texte (une seule occurrence dans conf) ; sinon ce qui trompe la lecture (un commentaire qui porte
     « nom: "…" » pendant que la vraie clé est écrite autrement — apostrophes, entre guillemets, sans espace —, une
     réaffectation plus loin, un échappement \u…).
   legauxAilleurs(texte, conf) : [] si rien, hors de js/config.js (conf, retiré une fois du texte, tel quel ou vu à travers
     la simulation), ne modifie CONFIG.textes_legaux (MOTIFS_AILLEURS : réaffectation de textes_legaux ou d'une clé
     cgu_pdf / confidentialite_pdf / cgu_version, même entre crochets ou par un alias, +=, ||=… ; clé écrite dans un
     objet ; assign / defineProperty / Reflect.set / delete sur CONFIG ; CONFIG remplacé) ; les lectures et comparaisons
     (==, ===, !==, >=, <=) passent. Un js/config.js introuvable dans le texte est refusé.
   verrouLegaux(texte, conf, maintenant) : le verrou = legauxManquants(texte de la page et de ses fichiers) +
     legauxEcarts(js/config.js) + legauxAilleurs(texte, js/config.js).
   modeLegaux(env, brancheLocale) : "strict" (le verrou est ✗ tant que verrouLegaux n'est pas vide) ou "branche" (✓ en
     disant ce qui manque). BANC_LEGAUX posée (BANC_LEGAUX=strict ; toute valeur non vide) → strict. Sinon GITHUB_REF
     (posé par GitHub Actions) : refs/heads/v2/… → branche, sauf v2/simu-main et v2/simu-main-… (toute casse ; preuve du
     rouge de main sans toucher main) ; tout autre ref (refs/heads/main, un tag, une pull request) → strict. Sans
     GITHUB_REF : la branche git de la copie (brancheLocale, sinon brancheGit()) : v2/… → branche (même exception) ; main,
     HEAD (détaché), échec de git → strict. Aucune variable ne force le mode « branche ».
   brancheGit(dossier) : la branche git du dossier (par défaut la copie qui contient ce fichier), "" si git échoue.
   forcerLegaux(texte, valeurs) : le texte avec la PREMIÈRE valeur de chaque emplacement remplacée par celle de valeurs
     (LEGAUX_TEST par défaut ; un nom absent de valeurs garde la valeur du fichier) : pour la retouche d'une suite qui a
     besoin de liens valides (écran d'inscription, carte de l'accord santé). */
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

/* v64 : textes légaux (CONFIG.textes_legaux) et verrou de publication (voir l'en-tête) */
const LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
const LEGAUX_TEST = Object.freeze({ cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view",
  confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-01" });
const LIENS_TEST = Object.freeze([LEGAUX_TEST.cgu_pdf, LEGAUX_TEST.confidentialite_pdf,
  "https://drive.google.com/file/d/TEST-CGU-71/view", "https://drive.google.com/file/d/TEST-POLITIQUE-71/view",
  "https://drive.google.com/file/d/verif66-banc/view"]);
const LEGAUX_APRES = "2026-09-30";   // cgu_version : strictement après cette date (textes d'avant le brief V2)
const LEGAUX_MARGE = 366;   // … et au plus aujourd'hui (UTC) + 366 jours : une faute sur l'année (2062, 2099) est refusée
const JOUR = 86400000;
const ID_MIN = 25;   // un identifiant de document Google Drive fait 28, 33 ou 44 caractères
const motifLegal = (nom, g) => new RegExp("\\b(" + nom + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function valeursLegales(texte, nom){ return Array.from(String(texte).matchAll(motifLegal(nom, true)), m => m[2]); }
/* une valeur lisible dans un message : les caractères invisibles ou hors ASCII (sauf les lettres accentuées) en \u… */
const montrer = s => String(s).replace(/[^\x20-\x7e\u00c0-\u017f]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
function lienDrive(s){
  if (typeof s !== "string" || !s) return { pb: "valeur vide" };
  if (!s.includes("://")) return { pb: "pas un lien" };
  if (!/^[\x21-\x7e]+$/.test(s)) return { pb: "caractère interdit (espace, caractère invisible ou accentué) : recopier le lien tel quel" };
  let u; try { u = new URL(s); } catch (e) { return { pb: "adresse illisible" }; }
  if (u.protocol !== "https:" || !/^(drive|docs)\.google\.com$/.test(u.hostname) || u.username || u.password || u.port)
    return { pb: "pas un lien https de drive.google.com ou docs.google.com" };
  if (u.href !== s) return { pb: "forme non standard (lue « " + u.href + " ») : recopier le lien donné par Google Drive" };
  const m = /^\/(?:file|document)\/d\/([^/]*)(?:\/|$)/.exec(u.pathname);
  /* décision de Lucas du 30/09 : le dossier Drive qui contient les 2 PDF (drive.google.com seulement, sans /u/0/ de compte) */
  const f = u.hostname === "drive.google.com" ? /^\/drive\/folders\/([^/]*)\/?$/.exec(u.pathname) : null;
  const id = m ? m[1] : f ? f[1] : /^\/(?:open|uc)$/.test(u.pathname) ? (u.searchParams.get("id") || "") : null;
  if (id === null) return { pb: "chemin non accepté (…/file/d/<id>, …/document/d/<id>, …/open?id=<id>, …/uc?id=<id> ou drive.google.com/drive/folders/<id>)" };
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return { pb: "identifiant de document illisible (« " + id + " »)" };
  return f ? { id, dossier: true } : { id };
}
let idsTest = null;
function idsDeTest(){
  if (idsTest) return idsTest;
  const ids = new Map(), noter = (lien, ou) => { const l = lienDrive(lien); if (l.id && !ids.has(l.id)) ids.set(l.id, ou); };
  LIENS_TEST.forEach(l => noter(l, "tests-locaux/fichiers.js"));
  let noms = [];
  try { noms = fs.readdirSync(__dirname).filter(f => f.endsWith(".js")).sort(); } catch (e) {}
  for (const f of noms) {
    let t = "";
    try { t = fs.readFileSync(path.join(__dirname, f), "utf8"); } catch (e) { continue; }
    for (const m of t.matchAll(/https:\/\/(?:drive|docs)\.google\.com\/[A-Za-z0-9._~:\/?#=&%+-]*/g)) noter(m[0], "tests-locaux/" + f);
  }
  return (idsTest = ids);
}
/* relecture du verrou : un identifiant « modèle » (écrit à la main, jamais donné par Google Drive). Un vrai identifiant
   (tirage aléatoire de [A-Za-z0-9_-], et un « 1 » ou un « 0B » devant) a des minuscules, des majuscules et des chiffres,
   jamais 5 fois le même caractère à la suite, ni un mot de gabarit, ni une suite de 6 (abcdef, zyxwvu, 123456) ; mesuré
   le 30/09 : les 13 identifiants Drive de js/outilFormation.js passent ; faux refus sur des tirages réalistes : 4 par
   million à 33 caractères (le lien d'un PDF), 28 par million au pire (25 caractères). */
const MOTS_MODELE = ["EXEMPLE", "EXAMPLE", "SAMPLE", "COMPLET", "REMPLAC", "PLACEHOLDER", "VOTRE", "COLLER", "PASTE", "DUMMY",
  "IDENTIFIANT", "DOCUMENT", "QWERTY", "AZERTY"];
function idModele(id){
  const s = String(id), bas = s.toLowerCase();
  if (!/[a-z]/.test(s)) return "aucune minuscule";
  if (!/[A-Z]/.test(s)) return "aucune majuscule";
  if (!/[0-9]/.test(s)) return "aucun chiffre";
  const r = /(.)\1{4}/.exec(s);
  if (r) return "5 caractères identiques à la suite (« " + r[0] + " »)";
  const mot = MOTS_MODELE.find(w => bas.includes(w.toLowerCase()));
  if (mot) return "mot « " + mot + " »";
  for (const alpha of ["abcdefghijklmnopqrstuvwxyz", "0123456789"])
    for (let i = 0; i + 6 <= bas.length; i++) {
      const x = bas.slice(i, i + 6), a = alpha.indexOf(x[0]);
      if (a < 0) continue;
      const monte = alpha.slice(a, a + 6), descend = alpha.slice(Math.max(0, a - 5), a + 1).split("").reverse().join("");
      if (x === monte || x === descend) return "suite « " + s.slice(i, i + 6) + " »";
    }
  return "";
}
function problemeLien(s){
  const l = lienDrive(s);
  if (l.pb) return l.pb;
  const ou = idsDeTest().get(l.id);
  if (ou) return "lien de test (« " + l.id + " », écrit dans " + ou + "), pas le PDF de Lucas";
  if (/^TEST|TEST$|[-_]TEST[-_]/i.test(l.id)) return "lien de test (« " + l.id + " »), pas le PDF de Lucas";
  if (l.id.length < ID_MIN) return "identifiant de document trop court (« " + l.id + " », " + l.id.length + " caractères ; un vrai lien Drive en a 28, 33 ou 44)";
  const mod = idModele(l.id);
  if (mod) return "identifiant qui ressemble à un exemple (« " + l.id + " » : " + mod + ") : recopier le lien donné par Google Drive (bouton « Partager » > « Copier le lien »)";
  return "";
}
function documentDrive(s){ return problemeLien(s) ? "" : lienDrive(s).id; }
/* la date la plus lointaine acceptée pour cgu_version : aujourd'hui (UTC, d'après maintenant) + LEGAUX_MARGE jours */
function legauxBorne(maintenant){
  const t = maintenant == null ? Date.now() : +maintenant;
  return new Date(Math.floor(t / JOUR) * JOUR + LEGAUX_MARGE * JOUR).toISOString().slice(0, 10);
}
function legauxManquants(texte, maintenant){
  const v = {}, pb = [];
  for (const n of LEGAUX) {
    const l = valeursLegales(texte, n);
    if (l.length !== 1) pb.push(n + " : " + l.length + " valeur(s) écrite(s) au lieu d'une (« " + n + ": \"…\" », guillemets droits)");
    v[n] = l.length ? l[0] : "";
  }
  const id = {};
  for (const n of ["cgu_pdf", "confidentialite_pdf"]) {
    const p = problemeLien(v[n]);
    id[n] = p ? "" : lienDrive(v[n]).id;
    if (p) pb.push(n + " « " + montrer(v[n]) + " » : " + p + " — le lien https d'un PDF sur Google Drive est attendu (drive.google.com/file/d/… ou docs.google.com/document/d/…), ou celui du dossier Drive qui contient les 2 PDF (drive.google.com/drive/folders/…)");
  }
  /* 2 documents différents, ou le MÊME dossier pour les deux (décision de Lucas du 30/09), rien d'autre avec un dossier */
  const dA = !!id.cgu_pdf && !!lienDrive(v.cgu_pdf).dossier, dB = !!id.confidentialite_pdf && !!lienDrive(v.confidentialite_pdf).dossier;
  const memeDossier = dA && dB && id.cgu_pdf === id.confidentialite_pdf;
  if (id.cgu_pdf && id.confidentialite_pdf && !memeDossier && (dA || dB) && id.cgu_pdf !== id.confidentialite_pdf)
    pb.push("un dossier Drive n'est accepté que le MÊME pour cgu_pdf et confidentialite_pdf (le dossier qui contient les 2 PDF, décision de Lucas du 30/09) : ici " + (dA && dB ? "2 dossiers différents" : "un dossier et un fichier"));
  if (id.cgu_pdf && id.cgu_pdf === id.confidentialite_pdf && !memeDossier) pb.push("cgu_pdf et confidentialite_pdf mènent au même document (« " + id.cgu_pdf + " ») : 2 PDF différents attendus");
  /* relecture du verrou : le document d'un AUTRE lien du site (une ressource de la formation, js/outilFormation.js : erreur
     de copier-coller la plus plausible) — l'identifiant écrit ailleurs que dans les 3 emplacements, sous toute forme */
  const hors = LEGAUX.reduce((t, n) => t.replace(motifLegal(n, true), ""), String(texte));
  for (const n of ["cgu_pdf", "confidentialite_pdf"])
    if (id[n] && new RegExp("(^|[^A-Za-z0-9_-])" + id[n] + "(?![A-Za-z0-9_-])").test(hors))
      pb.push(n + " : ce document (« " + id[n] + " ») est déjà lié ailleurs dans le site (ressource de la formation ?) : le PDF " + (n === "cgu_pdf" ? "des CGU" : "de la politique de confidentialité") + " est attendu");
  const borne = legauxBorne(maintenant);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.cgu_version), d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  if (!d || isNaN(d) || d.toISOString().slice(0, 10) !== v.cgu_version || v.cgu_version <= LEGAUX_APRES || v.cgu_version > borne)
    pb.push("cgu_version « " + montrer(v.cgu_version) + " » : date AAAA-MM-JJ réelle, postérieure au " + LEGAUX_APRES + " et au plus tard le " + borne + " (aujourd'hui + " + LEGAUX_MARGE + " jours), attendue (la date de mise en ligne des PDF)");
  return pb;
}
function legauxExecutes(conf){
  try {
    const ctx = {};
    require("vm").runInNewContext(String(conf) + "\n;this.__C = CONFIG;", ctx, { timeout: 2000 });
    const t = ctx.__C && ctx.__C.textes_legaux;
    if (!t || typeof t !== "object") return { erreur: "CONFIG.textes_legaux absent" };
    return Object.fromEntries(LEGAUX.map(n => [n, t[n]]));
  } catch (e) { return { erreur: String((e && e.message) || e).split("\n")[0].slice(0, 160) }; }
}
function legauxEcarts(conf){
  const x = legauxExecutes(conf);
  if (x.erreur) return ["js/config.js exécuté seul dans un bac à sable : " + x.erreur + " (valeurs réelles de CONFIG.textes_legaux illisibles)"];
  const pb = [];
  for (const n of LEGAUX) {
    const lu = valeursLegales(conf, n);
    if (lu.length !== 1 || x[n] !== lu[0])
      pb.push(n + " : valeur exécutée " + montrer(JSON.stringify(x[n])) + " ≠ valeur lue dans js/config.js " + (lu.length ? "« " + montrer(lu[0]) + " »" : "(aucune)")
        + (lu.length > 1 ? " (" + lu.length + " fois)" : "") + " — commentaire, clé écrite autrement, réaffectation ou échappement ?");
  }
  return pb;
}
/* relecture du verrou : une modification de CONFIG.textes_legaux HORS de js/config.js (un autre fichier de la page, un
   <script> de index.html), que ni la lecture ni le bac à sable (config.js seul) ne voient. autres = la source de la page
   SANS js/config.js (retiré une fois, tel qu'il est sur le disque ou vu à travers la simulation des interrupteurs). */
const ECRIT = "\\s*[-+*/%&|^?]{0,3}=(?![=>])";   // =, +=, ||=, ??=… (jamais ==, ===, !=, <=, >=, =>)
const CIBLE = "(?:[\"'`]\\s*\\])?";           // la clé écrite entre crochets : CONFIG["textes_legaux"]["cgu_pdf"]
const MOTIFS_AILLEURS = [
  new RegExp("\\btextes_legaux\\b" + CIBLE + "\\s*(?:\\.\\s*\\w+|\\[[^\\]]*\\])?" + ECRIT),                    // CONFIG.textes_legaux(.cle|[cle]) = …
  new RegExp("\\b(?:cgu_pdf|confidentialite_pdf|cgu_version)\\b" + CIBLE + ECRIT),                                  // alias.cgu_pdf = …
  /[{,]\s*["'`]?(?:textes_legaux|cgu_pdf|confidentialite_pdf|cgu_version)["'`]?\s*:/,                                // { cgu_pdf: … } (assign, spread)
  /\b(?:Object\s*\.\s*(?:assign|defineProperty|defineProperties|setPrototypeOf)|Reflect\s*\.\s*(?:set|defineProperty|deleteProperty|setPrototypeOf))\s*\(\s*(?:(?:window|globalThis|self)\s*\.\s*)?CONFIG\b/,   // (une lecture M.set(CONFIG.x, …) n'est pas une écriture)
  /\bdelete\s+(?:(?:window|globalThis|self)\s*\.\s*)?CONFIG\b/,
  new RegExp("\\bCONFIG\\b" + CIBLE + ECRIT)                                                                          // CONFIG = …, window.CONFIG = …
];
function horsConfig(texte, conf){
  const t = String(texte);
  for (const c of [String(conf || ""), duDisque(String(conf || ""))]) { const i = c ? t.indexOf(c) : -1; if (i > -1) return t.slice(0, i) + t.slice(i + c.length); }
  return null;
}
function legauxAilleurs(texte, conf){
  const autres = horsConfig(texte, conf);
  if (autres === null) return ["js/config.js introuvable tel quel dans la source de la page : modifications de CONFIG.textes_legaux hors de js/config.js impossibles à chercher"];
  const lignes = new Map();   // une raison par ligne fautive (plusieurs motifs peuvent voir la même ligne)
  for (const re of MOTIFS_AILLEURS) {
    const g = new RegExp(re.source, "g");
    for (const m of autres.matchAll(g)) {
      const debut = autres.lastIndexOf("\n", m.index) + 1, fin = autres.indexOf("\n", m.index);
      if (!lignes.has(debut)) lignes.set(debut, autres.slice(debut, fin < 0 ? autres.length : fin).replace(/\s+/g, " ").trim().slice(0, 140));
    }
  }
  return Array.from(lignes.keys()).sort((x, y) => x - y)
    .map(k => "CONFIG.textes_legaux modifié hors de js/config.js (ligne « " + montrer(lignes.get(k)) + " ») : les 3 valeurs s'écrivent seulement dans js/config.js");
}
function verrouLegaux(texte, conf, maintenant){ return legauxManquants(texte, maintenant).concat(legauxEcarts(conf), legauxAilleurs(texte, conf)); }
function brancheGit(dossier){
  try {
    return require("child_process").execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: dossier || path.join(__dirname, ".."), stdio: ["ignore", "pipe", "ignore"], timeout: 10000 }).toString().trim();
  } catch (e) { return ""; }
}
function modeLegaux(env, brancheLocale){
  env = env || process.env;
  if (String(env.BANC_LEGAUX || "").trim()) return "strict";   // BANC_LEGAUX=strict (preuve locale du rouge) ; rien ne force « branche »
  const ref = String(env.GITHUB_REF || "").trim();
  const b = ref ? (ref.startsWith("refs/heads/") ? ref.slice(11) : "") : String(brancheLocale != null ? brancheLocale : brancheGit()).trim();
  return /^v2\/[^/\s]/.test(b) && !/^v2\/simu-main(-|$)/i.test(b) ? "branche" : "strict";
}
function forcerLegaux(texte, valeurs){
  const V = valeurs || LEGAUX_TEST;
  let t = String(texte);
  for (const n of LEGAUX) if (V[n] != null) t = t.replace(motifLegal(n), (x, a) => a + JSON.stringify(String(V[n])));
  return t;
}

module.exports = { servirFichier, source, sourceServie, listes, forcerInscription, valeursInscription,
  NOUVEAUTES, forcerNouveautes, valeursNouveaute, simulation, refusSimulation,
  LEGAUX, LEGAUX_TEST, LIENS_TEST, valeursLegales, lienDrive, idsDeTest, idModele, problemeLien, documentDrive, legauxBorne,
  legauxManquants, legauxExecutes, legauxEcarts, legauxAilleurs, verrouLegaux, modeLegaux, brancheGit, forcerLegaux };
