/* verif71 — v64 (brief V2, lot 5, section B, et scénario 3 de la section 8) : l'ACCORD SANTÉ AU PREMIER USAGE, de bout en
   bout dans un vrai navigateur, avec des prospects fictifs (« pk@exemple.fr »), sur téléphone (390 px et 320 px), en thème
   sombre et en thème clair, en français et en anglais. Supabase est simulé AVEC les métadonnées du compte : PUT
   /auth/v1/user { data } FUSIONNE data dans les métadonnées (une valeur null supprime la clé, comme GoTrue) et rend
   { id, email, user_metadata } ; GET /auth/v1/user et les jetons (connexion par mot de passe, renouvellement) rendent les
   métadonnées de la base ; le PUT et le GET peuvent être mis en panne (4xx, 5xx, coupure réseau, réponse vide ou sans
   métadonnées, PUT réussi dont la réponse ne porte pas l'accord), ou retardés (GET : métadonnées lues à l'arrivée de la
   requête, rendues à la fin du délai).
   0. le config.js servi : les 3 emplacements CONFIG.textes_legaux (« à compléter » sur la branche de travail) remplacés PAR
      CETTE SUITE (retouche du fichier servi, jamais du disque) par des valeurs de test valides : 2 liens https Google Drive
      et la version 2026-10-15 (DISTINCTE du texte court, 2026-10-01 depuis la v64 : sante_version vient bien de
      CONFIG.textes_legaux.cgu_version, jamais de DECOUVERTE.confidentialite.version) ; le bloc M sert « à compléter » et
      des liens invalides ;
   A. #/calculateur, prospect sans accord (inscrit en v64) : la carte section.panel.sante-carte#sante-carte
      [data-sante-ecran=calculateur], 1re carte juste après l'en-tête, avant tout champ ; son contenu dans l'ordre (titre,
      texte, phrase d'accord en gras juste au-dessus des boutons, « J'accepte », « Pas maintenant », message vide, lien
      « En savoir plus » vers le PDF de la politique, target=_blank, rel=noopener) ; textes FR exacts (brief B) ; tous les
      champs de la page inactifs (disabled + data-sante-off) ; rien n'est lu (calc_perso, calc, mens : outil.init non
      lancé), rien n'est calculé, écrit, mis en file (mhx_attente|…) ni invité, même avec des valeurs forcées dans les champs
      et leurs événements ; UNE relecture GET /auth/v1/user (l'accord a-t-il été donné sur un autre appareil ?) ;
   B. #/mensurations (Ma progression) : la même carte [data-sante-ecran=mensurations], champs inactifs, rien lu ni écrit ;
      #/calculateur ouvert dans la minute : la carte, pas de 2e relecture ;
   C. « Organise ta diète » (module 02 de #/formation) : div.sante-carte.sante-inline#sante-carte[data-sante-ecran=formation]
      juste sous « Organise ta diète » (titre en h4), champs de la diète inactifs, 6 lignes vides, le reste de la formation
      actif ; la diète n'est jamais créée ni changée en base (ouvrir le module, cocher une case, valeurs forcées) ; une
      diète déjà en base (ancien client repassé prospect) n'est pas affichée et reste intacte ; « J'accepte » dans la diète
      (session rangée « Rester connecté » décoché) : UN PUT exact (sante_ecran formation), diète redessinée active, saisie
      enregistrée ; page rechargée : plus de carte ;
   D. anglais, thème clair : textes EN exacts (Ma progression, calculateur, diète), « Not now », échec (400) ;
   E. « J'accepte » sur le calculateur (double tap) : le bouton se désactive pendant l'envoi, UN SEUL PUT exact (3 clés :
      consentement_sante = l'instant, ISO ; sante_version = la version servie ; sante_ecran = calculateur ; jamais null), fusionné en base (les
      autres métadonnées gardées), session mise à jour (mémoire et session rangée, jetons intacts), page repartie sans la
      carte (init lancé), saisie → calc_perso écrit → l'invitation declic_calculateur ; plus de carte ailleurs (Ma
      progression : pesée enregistrée ; diète active), après rechargement, après déconnexion puis reconnexion (mot de
      passe), sans aucune autre requête /auth/v1/user ;
   F. un autre appareil : l'accord donné sur Ma progression de l'appareil A (sante_ecran mensurations) ; l'appareil B (sa
      session ne porte pas l'accord) : UNE relecture puis plus de carte (calculateur, Ma progression, diète) ; l'appareil C
      ouvre la diète : une relecture, diète active ; relecture sans accord : réponse {}, sans métadonnées, 500, coupure →
      la carte reste, métadonnées de l'appareil intactes, au plus une relecture par minute, aucune hors ligne ;
   G. scénario 3, « Pas maintenant » : message exact à la place de la carte, focus dessus, champs toujours inactifs,
      aucune écriture ; l'accueil (étape « Calcule tes calories »), la Speed Formation (cases enregistrées), le Profil
      (newsletter enregistrée) et une page verrouillée utilisables ; diète : « Pas maintenant », message gardé quand une
      case est cochée (formation redessinée), aucune ligne de diète en base ; la carte revient à la prochaine ouverture
      (formation, calculateur, Ma progression) ; aucun accord envoyé, aucune invitation santé ; l'invitation du module
      Mindset (pas une donnée de santé) inchangée (7e case → sa carte) ;
   H. échecs : 400, 500, coupure, hors ligne → la carte reste, « Non enregistré : réessaie dans un instant. », boutons
      réactivés, métadonnées inchangées, rien en file (ni renvoyé 30 s plus tard ni au retour du réseau) ; puis succès ;
   I. défense en profondeur, appels directs dans la page (prospect sans accord) : Store.ecrire("calc_perso", chiffres) et
      Store.ecrire("mens", …) → false, rien en cache, aucune copie, rien envoyé ; Store.envoyer de ces clés → rien ;
      Store.reprendre saute leurs copies (ni lecture maj_le ni envoi, copies gardées) et envoie les autres ;
      Store.importer ignore mens, calc_perso chiffré et une formation dont la diète est remplie (« vide » si rien d'autre),
      restaure le reste ; calc_perso {} (retrait du garde-fou 18 ans) et les autres clés restent permis ;
   J. prospects qui ont coché la case à l'inscription (v52-v63 : consentement_sante daté, ou true) : aucune carte, aucune
      relecture, garde du stockage ouverte (Sante.bloque faux), écritures normales ;
   K. client Thomas, compte client de test (identifiant lu dans CONFIG.nouveautes.comptes_test du fichier servi), coach, et
      coach dans la fiche d'un prospect sans accord : aucune carte (calculateur, Ma progression, diète), aucun GET ni PUT
      /auth/v1/user, Sante.aDemander() faux, garde du stockage ouverte, écritures comme avant (calc_perso, mens, diète ; calc
      du coach, dans son compte et dans la fiche) ; compte de test : données intactes ;
   L. affichage : 390 px et 320 px, thèmes sombre et clair : rien ne déborde (carte, diète, message), texte lisible
      (contraste), « J'accepte » et « Pas maintenant » d'au moins 44 px ;
   M. liens absents (« à compléter ») ou invalides (javascript:, ftp:) : le lien « En savoir plus » devient un texte simple ;
   Corrections après la relecture du code (v64, cdc9e68) :
   N. relecture lente : le GET /auth/v1/user de l'ouverture, lu SANS l'accord, arrive après « J'accepte » → l'accord reste
      (Sante.ok(), session rangée), la saisie du calculateur est enregistrée, aucune carte ailleurs ;
   O. ancien client repassé prospect, copie mhx_attente|…|mens hors ligne plus récente que la base : après « J'accepte »,
      la copie part AVANT que Ma progression relise mens (2 mesures affichées), puis une nouvelle mesure garde les 3 ; de
      même quand l'accord est RELU (donné sur un autre appareil : une relecture, aucun PUT) ;
   P. page quittée puis rouverte pendant un « J'accepte » lent : « J'accepte » touché à nouveau pendant l'envoi → toujours
      un seul PUT ; la carte disparaît dès que le PUT aboutit ; la diète ouverte pendant l'envoi repart de même ;
   Q. deux onglets : accord donné dans A, « J'accepte » dans B → aucun 2e PUT, B repart sans carte ; puis B range une
      session du même compte SANS l'accord (reprise par A) : l'accord reste acquis pour la visite (Sante._donnes) ;
   R. réponse du PUT avec des métadonnées SANS l'accord → « Non enregistré… », carte gardée, Sante.ok() faux, rien d'écrit ;
   S. après « J'accepte » : focus sur le premier champ actif (calculateur) ou sur #fo-sem (diète) ; la page vue
      « calculateur » comptée une seule fois dans la clé activite (comme une ouverture simple) ;
   T. style : titre h4 de la carte dans la diète en 15 px sans capitales ; lien « En savoir plus » souligné, doré : --accent
      en thème sombre, #7f5f19 en thème clair (00df998), contraste d'au moins 4,5:1 ;
   U. copie retenue ET page ouverte pendant un « J'accepte » lent (5 s) : quand le PUT aboutit, deux pages repartent
      (calculateur, Ma progression) ; la copie part AVANT toute lecture de mens par Ma progression (Sante.apres attend une
      reprise déjà en cours, 00df998), 2 mesures affichées, une nouvelle mesure garde les 3 ;
   V. reprise lente (lecture maj_le qui répond en 12 à 20 s) : après « J'accepte », l'outil repart en 4 s au plus, quoi qu'il
      arrive — (a) la reprise lancée par l'accord (copie mhx_attente|…|mens retenue) : la page repart sans l'attendre, puis
      la copie part quand la lecture répond ; (b) une reprise DÉJÀ en cours (lancée au démarrage) : même limite (00df998) ;
   Z. aucune erreur de console ni erreur JS pendant les pages ouvertes avec la carte, aucun appel vers l'extérieur.
   Infrastructure (serveur, faux Supabase, horloge) reprise de verif68 : rien ne part vers la vraie base (routage par NOM
   D'HÔTE), chaque écriture, lecture et appel /auth/v1/user est noté. Horloge de chaque navigateur : midi du jour du
   lancement (T0), qui tourne. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif71.js ../index.html
           VERIF71_PORT=9871 node verif71.js ../index.html     (autre port, si 9870 est pris)
           VERIF71_BLOCS="A.,E." node verif71.js …              (seulement les blocs dont le nom commence ainsi)
           VERIF71_CAPTURES=<dossier> node verif71.js …         (captures PNG de la carte : pas des vérifications) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF71_PORT || 9870;
const BLOCS = (process.env.VERIF71_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF71_CAPTURES ? path.resolve(process.env.VERIF71_CAPTURES) : "";
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 700 }, ORDI = { width: 1280, height: 900 };

/* ---------- les textes légaux SERVIS (CONFIG.textes_legaux de js/config.js) : la suite remplace les 3 valeurs dans le
   fichier servi (jamais sur le disque) ; test par défaut, « à compléter » ou invalides le temps du bloc M ---------- */
const NOMS_LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-71/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-71/view", cgu_version: "2026-10-15" };
const LEGAUX_ABSENTS = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
const LEGAUX_INVALIDES = { cgu_pdf: "ftp://exemple.fr/cgu.pdf", confidentialite_pdf: "javascript:alert(71)", cgu_version: "2026-10-15" };
/* relecture (v64) : la version du texte court (DECOUVERTE.confidentialite.version), lue dans js/config.js du disque exécuté
   seul (vm) : sante_version doit en être DISTINCTE (putOk) — sinon une version prise au mauvais endroit passerait */
const VERSION_COURT = (() => { try { const ctx = {}; require("vm").runInNewContext(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8") + "\n;this.v = DECOUVERTE.confidentialite.version;", ctx, { timeout: 2000 }); return typeof ctx.v === "string" ? ctx.v : null; } catch (e) { return null; } })();
let LEGAUX = LEGAUX_TEST;
/* la valeur entre guillemets collée à « nom: » (la première occurrence : il n'y en a qu'une, bloc 0) */
const motifLegal = (n, g) => new RegExp("\\b(" + n + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function poserLegaux(texte, valeurs){ let t = String(texte); for (const n of NOMS_LEGAUX) t = t.replace(motifLegal(n), (x, a) => a + JSON.stringify(String(valeurs[n]))); return t; }
const valeursLegales = (texte, n) => Array.from(String(texte).matchAll(motifLegal(n, true)), m => m[2]);

/* ---------- la page servie : le fichier testé (page, css/ et js/), config.js avec les textes légaux de la suite ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, t => poserLegaux(t, LEGAUX))) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
const blocsLances = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  blocsLances.push(nom);
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); LEGAUX = LEGAUX_TEST; }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- les textes attendus (brief V2, B, mot pour mot ; échec : DECOUVERTE.emails.refuse, contrat du lot 5) ----------
   v64 (décision de Lucas du 30/09) : la carte s'affiche aussi sur « Organise ta diète » : les repas prévus y sont ajoutés dans
   le texte, la phrase d'accord (entre parenthèses, après « calculs ») et le message après « Pas maintenant » ; le reste mot pour
   mot. En anglais, le nom de l'outil tel qu'il s'affiche (la Speed Formation n'est pas traduite) : “Organise ta diète”. */
const SANTE = {
  fr: { titre: "Ton accord, une seule fois",
    texte: "Pour calculer tes calories et suivre ta progression, l'app enregistre ton poids, ta taille, tes mensurations, tes calculs et les repas prévus dans « Organise ta diète ». Ce sont des données de santé : elles restent privées, visibles seulement par toi et ton coach, et tu peux les supprimer à tout moment.",
    phrase: "J'accepte que mes données de santé (poids, taille, mensurations, calculs, repas prévus dans « Organise ta diète ») servent à mes calculs et à mon suivi.",
    oui: "J'accepte", non: "Pas maintenant", lien: "En savoir plus : politique de confidentialité",
    refus: "Pas de souci. Sans ton accord, le calculateur, le suivi et l'organisation de la diète restent en pause. Le reste de ton espace reste ouvert, et tu peux changer d'avis quand tu veux.",
    echec: "Non enregistré : réessaie dans un instant." },
  en: { titre: "Your consent, just once",
    texte: "To calculate your calories and track your progress, the app saves your weight, height, measurements, results and the meals you plan in “Organise ta diète”. This is health data: it stays private, visible only to you and your coach, and you can delete it at any time.",
    phrase: "I agree that my health data (weight, height, measurements, results, meals planned in “Organise ta diète”) is used for my calculations and tracking.",
    oui: "I agree", non: "Not now", lien: "Learn more: Privacy Policy",
    refus: "No problem. Without your consent, the calculator, tracking and diet planning stay paused. The rest of your space stays open, and you can change your mind anytime.",
    echec: "Not saved: try again in a moment." }
};

/* ---------- les personnes ---------- */
const MDP = "MotDePasse-fictif-71";
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000071" + String(k).padStart(2, "0");   // verif71 : …71kk (une plage par suite)
const EMAIL = k => "p" + k + "@exemple.fr";
/* métadonnées d'un prospect inscrit en v64 (une seule case : conditions, newsletter non cochée ; AUCUN accord santé) */
const META_V64 = () => ({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-10-01", newsletter: null, newsletter_version: "2026-09-30" });
/* un prospect inscrit de la v52 à la v63 (case « données de santé » cochée à l'inscription) */
const META_V55 = extra => Object.assign({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-09-29", consentement_sante: avant(3 * J), sante_version: "2026-09-28b", newsletter: null, newsletter_version: "2026-09-28c" }, extra || {});
/* le choix de la newsletter déjà recopié dans la clé emails (Accords.copierEmails n'écrit donc rien au démarrage) */
const EMAILS0 = { newsletter: false, maj: avant(3 * J), version: "2026-09-30", source: "inscription" };
const AVEC_CHOIX = k => ({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: EMAIL(k), bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } });
const FO = extra => Object.assign({ coches: {}, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, extra || {});
const LIGNE = (f, p, g, l) => ({ f, p, g, l });
const DIETE_REMPLIE = { "1": { "0": [LIGNE(true, "30", "40", "10"), LIGNE(false, "25", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", "")] } };
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const ZONES = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const MENS1 = { dstart: "2026-01-05", pstart: 70.5, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [{ sem: 1, date: "2026-01-12", poids: 70.1, vals: { "4": 80 } }] };
/* des chiffres déjà connus (ancien questionnaire) : un calculateur LANCÉ affiche aussitôt un résultat de départ */
const CHIFFRES_Q = { age: 30, taille: 165, poids: 60, sexe: "Femme", seances: 3 };
/* un prospect : opts.meta (métadonnées du compte en base ; META_V64 par défaut), opts.intake (ajouté au questionnaire),
   opts.donnees (en plus de intake et emails) */
const compte = (k, opts) => { opts = opts || {}; return { id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(4 * J), email: EMAIL(k), meta: opts.meta === undefined ? META_V64() : opts.meta,
  donnees: [["intake", Object.assign(AVEC_CHOIX(k), opts.intake || {})], ["emails", EMAILS0]].concat(opts.donnees || []) }; };
/* la session de l'appareil : par défaut, les métadonnées d'un inscrit v64 (sans accord) */
const quiP = (k, meta) => qui(PID(k), EMAIL(k), meta === undefined ? META_V64() : meta);
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;

/* ---------- le décor : fixtures.js (coach, clients) + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree, email, meta, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], authUser: [], connexions: [], renouvellements: [], bloquees: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [F.IDS.c1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [F.IDS.c1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    panneGet: null, pannePut: null, retardPut: 0, retardGet: 0, retardMajLe: null, majLeLents: [],
    /* n : numéro d'ordre commun aux lectures et aux écritures de donnees (qui passe avant qui) ; getsLents : les réponses
       des GET /auth/v1/user retardés (métadonnées LUES À L'ARRIVÉE de la requête) ; putsFinis : l'instant de chaque réponse
       réussie d'un PUT /auth/v1/user */
    n: 0, getsLents: [], putsFinis: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    db.meta[x.id] = clone(x.meta || {});
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif68) + les métadonnées du compte ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
const liste = t => String(t).replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
function parOutil(l, o){
  if (o.startsWith("eq.")) return l.filter(x => x.outil === o.slice(3));
  if (o.startsWith("in.")) { const k = liste(o.slice(3)); return l.filter(x => k.includes(x.outil)); }
  if (o.startsWith("not.in.")) { const k = liste(o.slice(7)); return l.filter(x => !k.includes(x.outil)); }
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db, appareil){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  /* appareil hors ligne (couper) : la requête ne part pas (le gestionnaire de routes de Playwright répond même quand le
     contexte est hors ligne : c'est donc ici qu'elle échoue, sans jamais atteindre le serveur) */
  if (appareil && appareil.horsLigne) { db.bloquees.push(m + " " + p); return r.abort("internetdisconnected").catch(() => {}); }
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  /* jetons : connexion par mot de passe (les métadonnées de la base) ; renouvellement (idem) — jamais comptés comme écriture */
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {};
    if (q.get("grant_type") === "password") {
      const e = String(c.email || "").trim().toLowerCase(); db.connexions.push(e);
      const id = Object.keys(db.emails).find(x => db.emails[x] === e);
      if (!id || c.password !== MDP) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      return json(session(id, db.emails[id], db.meta[id]));
    }
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    db.renouvellements.push(id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  /* le compte : GET rend les métadonnées de la base ; PUT { data } les FUSIONNE (null supprime la clé) et les rend. Pannes :
     un statut (400, 500…), "coupure" (réseau coupé), pour le GET "vide" ({}) ou "sans" (sans user_metadata), pour le PUT
     "sans accord" (200, les métadonnées du compte SANS rien fusionner). Lenteurs : retardPut (fusion à la fin du délai),
     retardGet (métadonnées lues à l'ARRIVÉE de la requête, rendues à la fin du délai : une réponse périmée) */
  if (p === "/auth/v1/user") {
    const c = corps();
    db.authUser.push({ m, par: moi, corps: clone(c), q: url.search });
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    const panne = m === "GET" ? db.panneGet : db.pannePut;
    if (panne === "coupure") return r.abort("failed").catch(() => {});
    if (typeof panne === "number") return json({ msg: "panne simulée", code: panne }, panne);
    if (m === "GET" && db.retardGet) {
      const lu = clone(db.meta[moi] || {}), ms = db.retardGet;
      await new Promise(k => setTimeout(k, ms));
      db.getsLents.push({ meta: clone(lu), t: Date.now() });
      return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: lu });
    }
    if (m === "PUT" && db.retardPut) await new Promise(k => setTimeout(k, db.retardPut));
    const meta = db.meta[moi] || (db.meta[moi] = {});
    const uu = { id: moi, email: db.emails[moi] || "", role: "authenticated" };
    if (m === "PUT" && panne === "sans accord") return json(Object.assign(uu, { user_metadata: clone(meta) }));
    if (m === "PUT" && c && c.data && typeof c.data === "object") Object.keys(c.data).forEach(k => { if (c.data[k] === null) delete meta[k]; else meta[k] = clone(c.data[k]); });
    if (m === "PUT") db.putsFinis.push(Date.now());
    if (m === "GET" && panne === "vide") return json({});
    if (m === "GET" && panne === "sans") return json(uu);
    return json(Object.assign(uu, { user_metadata: clone(meta) }));
  }
  if (p.startsWith("/auth/v1/")) return json({});   // logout…
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*", n: ++db.n });
      /* reprise lente (bloc V) : la lecture maj_le d'une clé (celle de Store.reprendre) répond après ms (minuteur qui ne
         retient pas la fin de la suite) ; majLeLents : l'instant de chaque réponse */
      if (db.retardMajLe && (q.get("select") || "") === "maj_le" && o === "eq." + db.retardMajLe.outil) {
        const ms = db.retardMajLe.ms; await new Promise(k => setTimeout(k, ms).unref()); db.majLeLents.push(Date.now());
      }
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, n: ++db.n }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    db.donnees = db.donnees.filter(x => !(x.user_id === uid && x.outil === cleEq && permis(moi, coach, x)));
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ----------
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" ; sombre par défaut), rangement ("session" :
   « Rester connecté » décoché, la session dans sessionStorage) */
const ERREURS = [];   // erreurs de console et erreurs JS de toute la suite (bloc Z)
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  const appareil = { horsLigne: false };
  await c.route("**/*", r => repondre(r, who, db, appareil));
  await c.addInitScript(({ s, langue, theme, rangement }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) (rangement === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "", rangement: opts.rangement || "" });
  await c.clock.install({ time: T0 });   // midi du jour du lancement, puis l'horloge tourne
  const page = surveiller(await c.newPage());
  return { c, page, appareil };
}
/* l'appareil passe hors ligne (navigator.onLine faux, événements offline / online) ou revient */
async function couper(x, oui){ x.appareil.horsLigne = !!oui; await x.c.setOffline(!!oui); }
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  /* une ressource refusée (4xx/5xx simulés), une requête coupée ou hors ligne (simulés) : le navigateur le note, ce n'est
     pas une erreur de l'app */
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* attend (côté suite) qu'une condition sur le faux Supabase devienne vraie ; faux au bout de ms */
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!f(); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const ACCUEIL = "#/decouverte";   // l'accueil du prospect (#/accueil le mène là)
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
/* les écritures en base, hors compteur de visites du prospect (clé activite) */
const saisies = (db, uid) => db.ecritures.filter(e => !(e.table === "donnees" && e.outil === "activite") && (!uid || e.user_id === uid || e.id === uid));
const resume = db => JSON.stringify(saisies(db).map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const rangees = (db, uid) => JSON.stringify(db.donnees.filter(d => d.user_id === uid).map(d => [d.outil, d.contenu, d.maj_le]).sort((a, b) => a[0] < b[0] ? -1 : 1));
/* les appels /auth/v1/user (m : "GET" / "PUT"), depuis n0 */
const auth = (db, m, n0) => db.authUser.slice(n0 || 0).filter(x => !m || x.m === m);
/* les lectures de clés de santé (calc_perso, calc, mens : lecture seule ou groupée) depuis n0 */
const SANTE_CLES = /\b(calc_perso|calc|mens)\b/;
const lusSante = (db, n0) => db.lectures.slice(n0 || 0).filter(l => SANTE_CLES.test(l.outil));
/* une diète écrite avec une ligne (squelette compris) */
const avecDiete = e => !!(e && e.contenu && e.contenu.diete && Object.keys(e.contenu.diete).length);
/* l'état de Sante dans la page (null si l'objet n'existe pas : ancienne version) */
const santeEtat = page => page.evaluate(() => { try { return { a: Sante.aDemander(), ok: Sante.ok(), consulte: Store.idConsulte || null }; } catch (e) { return { erreur: String((e && e.message) || e).slice(0, 80) }; } });
/* la garde du stockage (Sante.bloque) pour des mesures et un calcul chiffré : { mens, calc } (vrai = bloqué) ; null si l'objet
   n'existe pas (ancienne version) */
const garde = page => page.evaluate(() => { try { return { mens: Sante.bloque("mens", { mesures: [{ poids: 70 }] }), calc: Sante.bloque("calc_perso", { age: 30, poids: 60 }) }; } catch (e) { return null; } });
const gardeOuverte = G => !!G && G.mens === false && G.calc === false;
/* le stockage de l'appareil : clés, session rangée (jetons, métadonnées), métadonnées de la session en mémoire */
const stockage = page => page.evaluate(() => {
  const l = [];
  for (const [nom, m] of [["local", localStorage], ["session", sessionStorage]]) { try { for (let i = 0; i < m.length; i++) l.push(nom + ":" + m.key(i)); } catch (e) { l.push(nom + ":illisible"); } }
  const lire = m => { try { return JSON.parse(m.getItem("mhx_session") || "null"); } catch (e) { return "illisible"; } };
  const sl = lire(localStorage), ss = lire(sessionStorage), s = sl || ss;
  let u = null; try { u = Auth.utilisateur(); } catch (e) {}
  let inv = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/invitations/.test(k)) inv.push(localStorage.getItem(k)); } } catch (e) {}
  return { cles: l, enLocal: !!sl, enSession: !!ss, rangee: s && typeof s === "object" ? { access: s.access_token, refresh: s.refresh_token, meta: s.user ? s.user.user_metadata : undefined } : null,
    memoire: u ? (u.user_metadata === undefined ? null : u.user_metadata) : "sans session", invitations: inv.join(" | ") };
});
/* rien en file pour la santé : aucune copie mhx_attente|…|calc_perso ou mens, aucune clé d'accord sur l'appareil */
const copiesSante = S => S.cles.filter(k => /mhx_attente\|.*\|(calc_perso|mens)$/.test(k) || /sante|consentement/i.test(k));
const invitSante = S => /declic_calculateur|declic_premiere_pesee/.test(S.invitations);
const nbInvitations = page => page.evaluate(() => document.querySelectorAll(".invitation, [data-invitation]").length);

/* ---------- la carte de l'accord, lue dans la page (textes bruts : insécables gardées) ---------- */
let VUES_CARTE = 0;   // pages où la carte a été vue (bloc Z)
async function lireCarte(page){
  const C = await page.evaluate(() => {
    const sig = e => e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + [...e.classList].sort().map(c => "." + c).join("") : null;
    const brut = e => e ? e.textContent.replace(/[ \t\r\n]+/g, " ").trim() : null;
    const c = document.getElementById("sante-carte"), vue = document.getElementById("vue");
    if (!c || !vue) return null;
    const q = s => c.querySelector(s);
    const cta = q(".dc-cta"), lienP = q("p.sante-lien"), a = lienP && lienP.querySelector("a"), sp = lienP && lienP.querySelector("span");
    const oui = q("#sante-oui"), non = q("#sante-non"), msg = q("#sante-msg"), refus = q("#sante-refus"), tete = vue.querySelector("header.masthead");
    const prec = c.previousElementSibling;
    /* les champs de la page, hors carte, en-tête et bandeau d'installation ; ceux qui précèdent la carte */
    const champs = [...vue.querySelectorAll("input, select, textarea, button")].filter(e => !e.closest(".sante-carte, .masthead, #installe"));
    const precede = e => !!(c.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
    const diete = [...document.querySelectorAll("#fo-sem, [data-fj], [data-df], [data-dm]")];
    return {
      sig: sig(c), ecran: c.getAttribute("data-sante-ecran"), n: document.querySelectorAll(".sante-carte").length, dansVue: vue.contains(c),
      apresTete: !!tete && tete.nextElementSibling === c, precedent: sig(prec), apresH3: !!prec && prec.tagName === "H3" && prec.textContent.trim() === "Organise ta diète",
      dansOutil: !!c.closest(".fo-outil"), enfants: [...c.children].map(sig), cta: cta ? [...cta.children].map(sig) : [], strong: !!q("p.sante-phrase > strong") && brut(q("p.sante-phrase > strong")) === brut(q("p.sante-phrase")),
      txt: { titre: brut(q("h2, h4")), texte: brut(q("p.sante-texte")), phrase: brut(q("p.sante-phrase")), oui: brut(oui), non: brut(non), lien: brut(lienP), refus: brut(refus) },
      msg: msg ? msg.textContent : null, a: a ? { href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") } : null, span: !!sp && !a,
      ouiType: oui && oui.getAttribute("type"), nonType: non && non.getAttribute("type"), ouiOff: oui ? oui.disabled : null, nonOff: non ? non.disabled : null,
      refusAttr: refus ? { role: refus.getAttribute("role"), tab: refus.getAttribute("tabindex") } : null, focus: sig(document.activeElement),
      champs: champs.length, off: champs.filter(e => e.disabled && e.hasAttribute("data-sante-off")).length,
      pasOff: champs.filter(e => !(e.disabled && e.hasAttribute("data-sante-off"))).map(sig).slice(0, 8), avant: champs.filter(precede).map(sig).slice(0, 8),
      avantDiete: diete.filter(precede).length, verrou: !!vue.querySelector(".verrou"), html: c.outerHTML.length
    };
  }).catch(() => null);
  if (C && C.txt && C.txt.oui) VUES_CARTE++;
  return C;
}
const det = C => JSON.stringify(C ? { sig: C.sig, ecran: C.ecran, n: C.n, apresTete: C.apresTete, precedent: C.precedent, apresH3: C.apresH3, enfants: C.enfants, cta: C.cta, strong: C.strong, a: C.a, span: C.span, msg: C.msg, types: [C.ouiType, C.nonType, C.ouiOff, C.nonOff], champs: [C.champs, C.off, C.pasOff, C.avant, C.avantDiete], focus: C.focus } : "carte absente");
/* la carte attendue (écran calculateur, mensurations ou formation), en fr ou en ; opts.lien : "absent" (texte simple) */
function verifCarte(C, ecran, langue, opts){
  opts = opts || {};
  const L = SANTE[langue], inline = ecran === "formation";
  if (!C) return { place: false, struct: false, textes: false, lien: false };
  const place = C.sig === (inline ? "div#sante-carte.sante-carte.sante-inline" : "section#sante-carte.panel.sante-carte") && C.ecran === ecran && C.n === 1 && C.dansVue
    && (inline ? C.apresH3 && C.dansOutil && C.avantDiete === 0 : C.apresTete && C.avant.length === 0) && !C.verrou;
  const struct = egal(C.enfants, [inline ? "h4" : "h2", "p.sante-texte", "p.sante-phrase", "div.dc-cta", "p#sante-msg.ko.msg", "p.note.sante-lien"]) && C.strong
    && egal(C.cta, ["button#sante-oui.btn", "button#sante-non.lien-discret"]) && C.ouiType === "button" && C.nonType === "button" && C.msg === "" && C.ouiOff === false && C.nonOff === false;
  const cles = ["titre", "texte", "phrase", "oui", "non", "lien"];
  const typo = cles.every(k => langue === "fr" ? !/ [:;?!]/.test(C.txt[k] || "") : !/[\u00a0\u202f]/.test(C.txt[k] || ""));
  const textes = cles.every(k => norm(C.txt[k]) === norm(L[k])) && typo;
  const lien = opts.lien === "absent" ? (C.span && !C.a) : (!!C.a && C.a.href === LEGAUX.confidentialite_pdf && C.a.target === "_blank" && /(^|\s)noopener(\s|$)/.test(C.a.rel || "") && !C.span);
  return { place, struct, textes, lien };
}
const carteOk = (C, ecran, langue, opts) => { const V = verifCarte(C, ecran, langue, opts); return V.place && V.struct && V.textes && V.lien; };
/* le message après « Pas maintenant » : il remplace la carte (même place), focus dessus */
function verifRefus(C, ecran, langue){
  const inline = ecran === "formation";
  return !!C && C.sig === (inline ? "div#sante-carte.sante-carte.sante-inline.sante-refus" : "section#sante-carte.panel.sante-carte.sante-refus") && C.ecran === ecran && C.n === 1
    && egal(C.enfants, ["p#sante-refus"]) && norm(C.txt.refus) === norm(SANTE[langue].refus) && !!C.refusAttr && C.refusAttr.role === "status" && C.refusAttr.tab === "-1"
    && C.focus === "p#sante-refus" && (inline ? C.apresH3 : C.apresTete) && (langue === "fr" || !/[\u00a0\u202f]/.test(C.txt.refus || ""));
}
/* la page en pause : tous ses champs (au moins n) inactifs et marqués */
const figee = (C, n) => !!C && C.champs >= (n || 8) && C.off === C.champs;
/* la diète telle qu'elle est affichée */
const lireDiete = page => page.evaluate(() => {
  const d = [...document.querySelectorAll("#fo-sem, [data-fj], [data-df], [data-dm]")];
  const autres = [...document.querySelectorAll("#fo-vue [data-coche], #fo-vue [data-mod], #fo-vue [data-lecon]")];
  const lignes = [...document.querySelectorAll(".fo-diete tr")].filter(tr => tr.querySelector("[data-df]"));
  return { n: d.length, off: d.filter(e => e.disabled && e.hasAttribute("data-sante-off")).length, actifs: d.filter(e => !e.disabled && !e.hasAttribute("data-sante-off")).length,
    autres: autres.length, autresOff: autres.filter(e => e.disabled || e.hasAttribute("data-sante-off")).length,
    lignes: lignes.length, vides: lignes.filter(tr => !tr.querySelector("[data-df]").checked && [...tr.querySelectorAll("[data-dm]")].every(i => i.value === "")).length,
    offAilleurs: document.querySelectorAll("#vue [data-sante-off]").length - d.filter(e => e.hasAttribute("data-sante-off")).length };
}).catch(() => null);
/* des valeurs forcées dans des champs (même inactifs) et leurs événements : sans écouteur, rien ne doit se passer */
const forcer = (page, liste) => page.evaluate(l => {
  for (const [sel, v] of l) {
    const e = document.querySelector(sel); if (!e) continue;
    if (v === "clic") { e.dispatchEvent(new MouseEvent("click", { bubbles: true })); continue; }
    if (e.type === "checkbox") e.checked = !!v; else e.value = v;
    e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}, liste).catch(e => String(e));
const CHAMPS_CALC = [["#age", "30"], ["#taille", "165"], ["#poids", "60"], ["#pas", "6000"], ["#heures", "3"], ['#sexe [data-v="F"]', "clic"], ['#objs [data-k="perte"]', "clic"], ["#calc-ok", "clic"]];
const CHAMPS_MENS = [["#e-sem", "1"], ["#e-poids", "70"], ["#add", "clic"], ["#pstart", "71"], ["#dstart", "2026-01-05"], ["#mens-ajouter", "clic"]];
const CHAMPS_DIETE = [['[data-dm="0.p"]', "30"], ['[data-dm="1.g"]', "45"], ['[data-df="0"]', true], ["#fo-sem", "2"], ['[data-fj="3"]', "clic"]];
/* calcul saisi (sexe, âge, taille, poids, heures) : enregistré dès qu'il est complet */
async function saisirCalcul(page){ await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3"); }
async function ouvrirM2(page){ await page.click('#fo-vue [data-mod="m2"]'); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }); await attendre(page, 1200); }
/* « J'accepte » : l'instant de la page au clic (pour dater l'accord) */
async function accepter(page, ms){ const t = await page.evaluate(() => Date.now()); await page.click("#sante-oui"); await attendre(page, ms || 2000); return t; }
/* le PUT de l'accord : { data: { consentement_sante: <instant ISO du clic>, sante_version: <version servie>, sante_ecran } }, rien d'autre */
function putOk(x, ecran, tClic){
  const c = x && x.corps, d = c && c.data;
  if (!d || typeof d !== "object") return false;
  const t = Date.parse(d.consentement_sante);
  return egal(Object.keys(c), ["data"]) && egal(Object.keys(d).sort(), ["consentement_sante", "sante_ecran", "sante_version"]) && Object.values(d).every(v => v !== null)
    && ISO.test(d.consentement_sante) && t >= tClic - 1000 && t <= tClic + 60000 && d.sante_version === LEGAUX.cgu_version && !!VERSION_COURT && d.sante_version !== VERSION_COURT && d.sante_ecran === ecran && x.q === "";
}
/* les métadonnées en base après l'accord : toutes celles d'avant gardées, plus les 3 clés envoyées */
const metaFusionnee = (apres, avantM, x) => !!apres && !!x && !!x.corps && egal(apres, Object.assign({}, avantM, x.corps.data));
async function capturer(page, nom, sel){
  if (!CAPT) return;
  fs.mkdirSync(CAPT, { recursive: true });
  await page.evaluate(sel => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: "start" }); }, sel).catch(() => {});
  await attendre(page, 300);
  await page.screenshot({ path: path.join(CAPT, nom) }).catch(() => {});
}

/* ---------- affichage : débordement, contraste (WCAG), hauteur des boutons ----------
   Contraste de chaque texte de la carte avec son fond réel (fonds semi-transparents composés jusqu'au corps de la page,
   comme verif66). Seuil 4,5:1 ; 3:1 pour les seules exceptions NOMMÉES (comme verif66 et verif69), et seulement quand le
   texte a exactement la couleur du jeton de l'app nommé (et dans le thème nommé) : le texte secondaire de toute l'app
   (--ink-3 : 3,99:1 en sombre, 4,27:1 en clair) du lien discret « Pas maintenant » (button.lien-discret, le même que
   « Plus tard » des invitations) et de la note ; en thème clair seulement, le bouton doré de l'app (blanc sur --accent :
   4,29:1, la même exception que le bouton des invitations dans verif66). [sélecteur, jeton, thème] */
const CONTRASTE = 4.5, CONTRASTE_EXC = 3, EXC = [[".sante-carte .lien-discret", "--ink-3"], [".sante-carte .note", "--ink-3"], [".sante-carte .btn", "--accent-ink", "light"]];
const affichage = page => page.evaluate(EXC => {
  const c = document.getElementById("sante-carte"); if (!c) return null;
  const jeton = v => { const s = document.createElement("span"); s.style.color = "var(" + v + ")"; document.body.appendChild(s); const x = getComputedStyle(s).color; s.remove(); return x; };
  const rgb = s => {
    let m = /^rgba?\(([^)]+)\)/.exec(s || "");
    if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
    m = /^color\(srgb ([^)]+)\)/.exec(s || "");
    if (m) { const p = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 }; }
    return null;
  };
  const sur = (h, b) => ({ r: h.r * h.a + b.r * (1 - h.a), g: h.g * h.a + b.g * (1 - h.a), b: h.b * h.a + b.b * (1 - h.a), a: 1 });
  const fond = el => { const pile = []; for (let e = el; e; e = e.parentElement) { const k = rgb(getComputedStyle(e).backgroundColor); if (k && k.a > 0) { pile.push(k); if (k.a >= 1) break; } }
    let f = { r: 255, g: 255, b: 255, a: 1 }; for (let i = pile.length - 1; i >= 0; i--) f = sur(pile[i], f); return f; };
  const lum = x => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(x.r) + 0.7152 * f(x.g) + 0.0722 * f(x.b); };
  const theme = document.documentElement.getAttribute("data-theme");
  const exc = e => EXC.some(([q, v, th]) => e.matches(q) && getComputedStyle(e).color === jeton(v) && (!th || th === theme));
  const qui = e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className ? "." + String(e.className).trim().replace(/\s+/g, ".") : "");
  /* chaque élément qui porte lui-même du texte */
  const els = [c].concat([...c.querySelectorAll("*")]).filter(e => Array.from(e.childNodes).some(x => x.nodeType === 3 && x.nodeValue.trim()));
  const textes = els.map(e => { const t = rgb(getComputedStyle(e).color), f = fond(e); if (!t) return { qui: qui(e), ratio: 0, exc: false }; const a = lum(sur(t, f)), b = lum(f); return { qui: qui(e), ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2), exc: exc(e) }; });
  const r = c.getBoundingClientRect(), W = window.innerWidth;
  const dehors = [...c.querySelectorAll("*")].filter(e => { const x = e.getBoundingClientRect(); return x.width > 0 && (x.left < r.left - 1 || x.right > r.right + 1); }).map(qui).slice(0, 5);
  const coupes = [...c.querySelectorAll("h2, h4, p, button, a, strong")].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== "inline").map(qui).slice(0, 5);
  const h = s => { const e = c.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
  return { page: document.documentElement.scrollWidth + "/" + W, deborde: document.documentElement.scrollWidth > W + 1, carte: [Math.round(r.left), Math.round(r.right)], carteOk: r.width > 0 && r.left >= 0 && r.right <= W + 1,
    dehors, coupes, textes, oui: h("#sante-oui"), non: h("#sante-non"), theme };
}, EXC).catch(() => null);
/* au moins les textes attendus (carte : titre, texte, phrase, 2 boutons, lien ; message : 1) */
const lisible = (A, n) => !!A && A.textes.length >= n && A.textes.every(x => x.ratio >= (x.exc ? CONTRASTE_EXC : CONTRASTE));
const sansDebord = A => !!A && !A.deborde && A.carteOk && !A.dehors.length && !A.coupes.length;
const boutons44 = (A, refus) => !!A && (refus || (A.oui >= 44 && A.non >= 44));
const detA = A => JSON.stringify(A ? { page: A.page, carte: A.carte, dehors: A.dehors, coupes: A.coupes, faibles: A.textes.filter(x => x.ratio < (x.exc ? CONTRASTE_EXC : CONTRASTE)), n: A.textes.length, oui: A.oui, non: A.non, theme: A.theme } : "carte absente");

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF71_PORT=9871 node verif71.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== 0. le config.js servi =================== */
  await bloc("0. config servie", async () => {
    const cfg = fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8");
    const disque = Object.fromEntries(NOMS_LEGAUX.map(n => [n, valeursLegales(cfg, n)]));
    const servi = poserLegaux(cfg, LEGAUX_TEST), vs = Object.fromEntries(NOMS_LEGAUX.map(n => [n, valeursLegales(servi, n)]));
    const ailleurs = NOMS_LEGAUX.filter(n => valeursLegales(SRC, n).length !== 1);
    ok("config.js servi par la suite : les 3 emplacements CONFIG.textes_legaux (cgu_pdf, confidentialite_pdf, cgu_version) présents une fois chacun dans js/config.js (nulle part ailleurs dans la page et ses fichiers), remplacés dans le fichier SERVI par des valeurs de test valides (2 liens https Google Drive différents, version 2026-10-15, distincte de celle du texte court « " + VERSION_COURT + " ») — le disque n'est jamais touché",
      NOMS_LEGAUX.every(n => disque[n].length === 1 && vs[n].length === 1 && vs[n][0] === LEGAUX_TEST[n]) && !ailleurs.length && !!VERSION_COURT && VERSION_COURT !== LEGAUX_TEST.cgu_version, JSON.stringify({ disque, ailleurs, court: VERSION_COURT }));
  });

  /* =================== A. le calculateur : la carte =================== */
  await bloc("A. calculateur : la carte", async () => {
    const k = 1, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 1500);
    const C = await lireCarte(page), V = verifCarte(C, "calculateur", "fr");
    const cfg = await page.evaluate(() => (typeof CONFIG !== "undefined" && CONFIG.textes_legaux) || null).catch(() => null);
    ok("#/calculateur, prospect sans accord (inscrit en v64), 390 px, thème sombre : section.panel.sante-carte#sante-carte[data-sante-ecran=calculateur], seule, la 1re carte juste après l'en-tête .masthead, avant tout champ de la page (aucune classe .verrou)",
      V.place, det(C));
    ok("contenu dans l'ordre : h2, p.sante-texte, p.sante-phrase > strong (juste au-dessus des boutons), div.dc-cta (button.btn#sante-oui, button.lien-discret#sante-non, type button, actifs), p.msg.ko#sante-msg vide, p.note.sante-lien > a vers le PDF de la politique (CONFIG.textes_legaux.confidentialite_pdf servi), target=_blank, rel=noopener",
      V.struct && V.lien && egal(cfg, LEGAUX_TEST), det(C) + " " + JSON.stringify(cfg));
    ok("textes FR EXACTS du brief B : « Ton accord, une seule fois », « Pour calculer tes calories… à tout moment. », « J'accepte que mes données de santé… à mon suivi. », « J'accepte », « Pas maintenant », « En savoir plus : politique de confidentialité » (typographie française : aucune espace simple avant « : »)",
      V.textes, JSON.stringify(C && C.txt));
    const tdee0 = await page.$eval("#tdee", e => e.textContent.trim()).catch(() => "?");
    ok("page en pause : les " + (C ? C.champs : "?") + " champs et boutons de la page hors carte et en-tête (sexe, âge, taille, poids, pas, heures, objectifs, « Enregistrer mes chiffres ») disabled + data-sante-off ; rien de calculé (#tdee « — ») alors que son questionnaire donne âge, taille et poids",
      figee(C, 10) && tdee0 === "—", det(C) + " tdee=" + tdee0);
    await capturer(page, "calculateur-fr-sombre-390.png", "#sante-carte");
    /* des valeurs forcées dans les champs inactifs, avec leurs événements (input, change, clics) : aucun écouteur */
    const f = await forcer(page, CHAMPS_CALC); await attendre(page, 2000);
    const tdee1 = await page.$eval("#tdee", e => e.textContent.trim()).catch(() => "?"), S = await stockage(page), nInv = await nbInvitations(page);
    ok("rien n'est lu ni écrit avant l'accord : aucune lecture de calc_perso, calc ni mens (outil.init non lancé) ; valeurs forcées dans les champs et leurs événements (input, change, clics sur le sexe, l'objectif et « Enregistrer ») : rien calculé, aucune écriture en base (hors compteur de visites), aucune copie mhx_attente|…|calc_perso ou mens, aucun PUT /auth/v1/user, aucune invitation (ni carte ni mémoire)",
      f === true && tdee1 === "—" && lusSante(db).length === 0 && saisies(db).length === 0 && !copiesSante(S).length && auth(db, "PUT").length === 0 && nInv === 0 && !invitSante(S),
      JSON.stringify([f, tdee1, lusSante(db), copiesSante(S), nInv, S.invitations, db.lectures.map(l => l.outil)]) + " · " + resume(db));
    const C2 = await lireCarte(page);
    ok("l'appareil ne voit pas d'accord : UNE relecture GET /auth/v1/user à l'ouverture ; la base n'a pas d'accord : la carte reste, les métadonnées de la session (mémoire et session rangée) inchangées, sans accord",
      auth(db, "GET").length === 1 && carteOk(C2, "calculateur", "fr") && !!S.memoire && S.memoire.prenom === "Léa" && !("consentement_sante" in S.memoire) && !!S.rangee && egal(S.rangee.meta, S.memoire),
      JSON.stringify([auth(db).map(x => x.m), S.memoire, S.rangee]));
  });

  /* =================== B. Ma progression : la carte =================== */
  await bloc("B. Ma progression : la carte", async () => {
    const k = 2;
    const db = base({ comptes: [compte(k, { donnees: [["mens", MENS1]] })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#sante-carte"); await attendre(page, 1500);
    const C = await lireCarte(page), V = verifCarte(C, "mensurations", "fr");
    const kp = await page.$eval("#k-poids", e => e.textContent.trim()).catch(() => "?");
    ok("#/mensurations (Ma progression) : la même carte section.panel.sante-carte#sante-carte[data-sante-ecran=mensurations], 1re carte juste après l'en-tête, avant tout champ ; contenu, lien et textes FR exacts",
      V.place && V.struct && V.textes && V.lien, det(C) + " " + JSON.stringify(C && C.txt));
    ok("champs inactifs (« Ajouter ma mesure », semaine, date, poids, « Enregistrer la semaine », « Fermer », date et poids de départ : " + (C ? C.champs : "?") + " disabled + data-sante-off ; les zones, dessinées par l'outil, absentes) ; ses mesures déjà en base ni lues ni affichées (poids actuel « — »)",
      figee(C, 8) && kp === "—", det(C) + " k-poids=" + kp);
    const f = await forcer(page, CHAMPS_MENS); await attendre(page, 2000);
    const S = await stockage(page);
    ok("valeurs forcées (semaine, poids, « Enregistrer la semaine », poids et date de départ) : aucune lecture ni écriture de mens, aucune copie en file, aucun PUT ; UNE relecture GET /auth/v1/user",
      f === true && lusSante(db).length === 0 && saisies(db).length === 0 && !copiesSante(S).length && auth(db, "PUT").length === 0 && auth(db, "GET").length === 1,
      JSON.stringify([f, lusSante(db), copiesSante(S), auth(db).map(x => x.m)]) + " · " + resume(db));
    await aller(page, "#/calculateur", 1800);
    const C2 = await lireCarte(page);
    ok("#/calculateur ouvert dans la minute : la carte (écran calculateur), champs inactifs, sans 2e relecture (au plus une par minute) ni lecture de calc_perso",
      carteOk(C2, "calculateur", "fr") && figee(C2, 10) && auth(db, "GET").length === 1 && lusSante(db).length === 0, det(C2) + " " + JSON.stringify(auth(db).map(x => x.m)));
  });

  /* =================== C. « Organise ta diète » (module 02) =================== */
  await bloc("C. diète : la carte", async () => {
    const k = 3, ID = PID(k);
    const db = base({ comptes: [compte(k, { donnees: [["formation", FO()]] })] });
    const { page } = await contexte(b, quiP(k), db, { rangement: "session" });   // « Rester connecté » décoché
    await page.goto(URL0 + "#/formation"); await pret(page, '#fo-vue [data-mod="m2"]');
    await ouvrirM2(page);
    const C = await lireCarte(page), V = verifCarte(C, "formation", "fr"), Dt = await lireDiete(page);
    ok("module 02 ouvert : div.sante-carte.sante-inline#sante-carte[data-sante-ecran=formation] juste sous « Organise ta diète » (h3), avant le sélecteur de semaine ; titre en h4, même contenu, lien et textes FR exacts",
      V.place && V.struct && V.textes && V.lien, det(C) + " " + JSON.stringify(C && C.txt));
    ok("la diète en pause : ses " + (Dt ? Dt.n : "?") + " champs (semaine, jours, cases « Fait », grammes) disabled + data-sante-off, 6 lignes vides ; le reste de la formation actif (modules, leçons, cases : " + (Dt ? Dt.autres : "?") + ", aucun inactif ni marqué)",
      !!Dt && Dt.n === 32 && Dt.off === 32 && Dt.lignes === 6 && Dt.vides === 6 && Dt.autres > 10 && Dt.autresOff === 0 && Dt.offAilleurs === 0, JSON.stringify(Dt));
    const n0 = ecr(db, "formation", ID).length;
    const f = await forcer(page, CHAMPS_DIETE); await attendre(page, 2000);
    const n1 = ecr(db, "formation", ID).length;
    await page.check('[data-coche="m2a"]'); await attendre(page, 2000);
    const Ec = ecr(db, "formation", ID), C2 = await lireCarte(page), fo = contenuDe(db, ID, "formation") || {};
    ok("aucune ligne de diète créée en base : module ouvert (formation écrite : ouvert m2), valeurs forcées dans les grammes, la case, la semaine et le jour (aucun écouteur : rien d'écrit), puis une case de la to-do cochée (formation écrite, coches.m2a) — chaque écriture de formation porte une diète vide {} ; la carte redessinée",
      n0 >= 1 && f === true && n1 === n0 && Ec.length === n0 + 1 && Ec.every(e => egal(e.contenu.diete, {})) && fo.coches && fo.coches.m2a === true && fo.ouvert === "m2" && carteOk(C2, "formation", "fr"),
      JSON.stringify([n0, n1, Ec.map(e => e.contenu.diete), fo.coches, f]));
    const S0 = await stockage(page);
    ok("rien d'autre : aucune lecture ni écriture de calc_perso ou mens par la diète, aucune copie en file, aucun PUT ; UNE relecture GET /auth/v1/user ; session rangée dans sessionStorage (« Rester connecté » décoché)",
      saisies(db).every(e => e.outil === "formation") && !copiesSante(S0).length && auth(db, "PUT").length === 0 && auth(db, "GET").length === 1 && S0.enSession && !S0.enLocal,
      resume(db) + " " + JSON.stringify([copiesSante(S0), auth(db).map(x => x.m), S0.enSession, S0.enLocal]));
    await capturer(page, "diete-fr-sombre-390.png", "#sante-carte");
    /* « J'accepte » dans la diète */
    const tClic = await accepter(page, 2500);
    const P = auth(db, "PUT"), Dt2 = await lireDiete(page), S = await stockage(page), C3 = await lireCarte(page);
    ok("« J'accepte » dans la diète : UN PUT /auth/v1/user { data: { consentement_sante (l'instant, ISO), sante_version " + LEGAUX_TEST.cgu_version + " (version servie), sante_ecran formation } } (3 clés, aucun null), fusionné en base (autres métadonnées gardées)",
      P.length === 1 && putOk(P[0], "formation", tClic) && metaFusionnee(db.meta[ID], META_V64(), P[0]), JSON.stringify([P, db.meta[ID]]));
    ok("la diète redessinée tout de suite, active (32 champs actifs, plus de carte ni de data-sante-off) ; session mise à jour en mémoire ET dans la session rangée (sessionStorage), jetons intacts",
      !C3 && !!Dt2 && Dt2.actifs === 32 && Dt2.off === 0 && !!S.memoire && S.memoire.consentement_sante === (P[0] && P[0].corps.data.consentement_sante) && S.enSession && !S.enLocal
      && !!S.rangee && egal(S.rangee.meta, S.memoire) && S.rangee.access === "jeton-" + ID && S.rangee.refresh === "renouvellement-" + ID, JSON.stringify([C3 && C3.sig, Dt2, S.memoire, S.rangee]));
    const n2 = ecr(db, "formation", ID).length;
    await page.fill('[data-dm="0.p"]', "30"); await attendre(page, 2000);
    const fo2 = contenuDe(db, ID, "formation") || {}, l0 = (((fo2.diete || {})["1"] || {})["0"] || [])[0] || {};
    await page.reload(); await pret(page, "#fo-vue .fo-diete"); await attendre(page, 1500);
    const C4 = await lireCarte(page), Dt3 = await lireDiete(page);
    ok("saisie des grammes : formation écrite, diète en base (semaine 1, lundi, 1er repas : 30 g de protéines) ; page rechargée : plus de carte, la diète active avec sa saisie, aucune autre requête /auth/v1/user",
      ecr(db, "formation", ID).length === n2 + 1 && l0.p === "30" && !C4 && !!Dt3 && Dt3.actifs === 32 && Dt3.vides === 5 && auth(db).length === 2, JSON.stringify([l0, C4 && C4.sig, Dt3, auth(db).map(x => x.m)]));
    /* une diète déjà en base (ancien client repassé prospect) : jamais affichée ni changée avant l'accord */
    {
      const k2 = 4, ID2 = PID(k2);
      const db2 = base({ comptes: [compte(k2, { donnees: [["formation", FO({ ouvert: "m2", diete: clone(DIETE_REMPLIE) })]] })] });
      const { page: p2 } = await contexte(b, quiP(k2), db2);
      await p2.goto(URL0 + "#/formation"); await pret(p2, "#sante-carte"); await attendre(p2, 1200);
      const Cx = await lireCarte(p2), Dx = await lireDiete(p2);
      await p2.check('[data-coche="m2b"]'); await attendre(p2, 2000);
      const E2 = ecr(db2, "formation", ID2), fx = contenuDe(db2, ID2, "formation") || {};
      ok("diète déjà remplie en base (ancien client repassé prospect) : carte, 6 lignes affichées VIDES (aucun gramme ni case cochée) ; une case de la formation cochée : formation écrite, sa diète en base identique à l'originale (rien ajouté ni changé)",
        carteOk(Cx, "formation", "fr") && !!Dx && Dx.vides === 6 && Dx.off === 32 && E2.length === 1 && egal(E2[0].contenu.diete, DIETE_REMPLIE) && egal(fx.diete, DIETE_REMPLIE) && fx.coches && fx.coches.m2b === true,
        det(Cx) + " " + JSON.stringify([Dx, E2.map(e => e.contenu.diete), fx.coches]));
    }
  });

  /* =================== D. anglais, thème clair =================== */
  await bloc("D. anglais", async () => {
    const k = 5;
    const db = base({ comptes: [compte(k, { donnees: [["formation", FO()]] })] });
    const { page } = await contexte(b, quiP(k), db, { langue: "en", theme: "light" });
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#sante-carte"); await attendre(page, 1200);
    const C = await lireCarte(page);
    await page.click("#sante-non"); await attendre(page, 500);
    const R = await lireCarte(page);
    ok("anglais, thème clair, Ma progression : la carte, textes EN EXACTS (« Your consent, just once », « To calculate your calories… at any time. », « I agree that my health data… tracking. », « I agree », « Not now », « Learn more: Privacy Policy »), sans espace insécable ; « Not now » : « No problem. Without your consent… anytime. » à sa place, focus dessus",
      carteOk(C, "mensurations", "en") && verifRefus(R, "mensurations", "en"), det(C) + " " + JSON.stringify([C && C.txt, R && R.txt, R && R.focus]));
    await aller(page, "#/calculateur", 1500);
    const C2 = await lireCarte(page);
    await capturer(page, "calculateur-en-clair-390.png", "#sante-carte");
    db.pannePut = 400;
    await page.click("#sante-oui"); await attendre(page, 1500);
    const C3 = await lireCarte(page);
    ok("calculateur : la carte revenue (anglais, textes exacts) ; « I agree » refusé par le serveur (400) : « Not saved: try again in a moment. », la carte reste, boutons réactivés",
      carteOk(C2, "calculateur", "en") && !!C3 && C3.sig === "section#sante-carte.panel.sante-carte" && norm(C3.msg) === SANTE.en.echec && C3.ouiOff === false && C3.nonOff === false && auth(db, "PUT").length === 1,
      det(C3) + " " + JSON.stringify([C2 && C2.txt, C3 && C3.msg]));
    db.pannePut = null;
    await aller(page, "#/formation", 1500); await page.waitForSelector('#fo-vue [data-mod="m2"]');
    await ouvrirM2(page);
    const C4 = await lireCarte(page);
    ok("anglais, la diète (module 02) : la carte en ligne, titre h4 et textes EN exacts", carteOk(C4, "formation", "en"), det(C4) + " " + JSON.stringify(C4 && C4.txt));
  });

  /* =================== E. « J'accepte » sur le calculateur =================== */
  await bloc("E. J'accepte (calculateur)", async () => {
    const k = 6, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q, donnees: [["formation", FO()]] })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 1500);
    const S0 = await stockage(page);
    db.retardPut = 1500;
    const tClic = await page.evaluate(() => Date.now());
    await page.dblclick("#sante-oui"); await attendre(page, 300);   // un double tap
    const pendant = await lireCarte(page);
    await page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).catch(() => {});
    await attendre(page, 1800); db.retardPut = 0;
    const P = auth(db, "PUT");
    ok("« J'accepte » (double tap) : les deux boutons inactifs pendant l'envoi ; UN SEUL PUT /auth/v1/user { data: { consentement_sante: l'instant du clic (ISO), sante_version: " + LEGAUX_TEST.cgu_version + " (CONFIG.textes_legaux.cgu_version servi), sante_ecran: calculateur } } — 3 clés, aucun null",
      !!pendant && pendant.ouiOff === true && pendant.nonOff === true && P.length === 1 && putOk(P[0], "calculateur", tClic), JSON.stringify([pendant && [pendant.ouiOff, pendant.nonOff], P]));
    const S = await stockage(page), C = await lireCarte(page);
    const etat = await page.evaluate(() => ({ tdee: document.getElementById("tdee").textContent.trim(), age: document.getElementById("age").disabled, off: document.querySelectorAll("#vue [data-sante-off]").length, ok: !document.getElementById("calc-ok").disabled })).catch(e => String(e));
    ok("en base : les métadonnées fusionnées (prénom, nom, conditions, newsletter gardés + les 3 clés) ; sur l'appareil : session en mémoire ET session rangée mises à jour (accord lisible), jetons intacts",
      metaFusionnee(db.meta[ID], META_V64(), P[0]) && !!S.memoire && S.memoire.consentement_sante === P[0].corps.data.consentement_sante && S.memoire.sante_ecran === "calculateur" && S.memoire.prenom === "Léa"
      && !!S.rangee && egal(S.rangee.meta, S.memoire) && S.rangee.access === S0.rangee.access && S.rangee.refresh === S0.rangee.refresh && S.enLocal, JSON.stringify([db.meta[ID], S.memoire, S.rangee]));
    ok("la page repart sans la carte : champs actifs (aucun data-sante-off), le calculateur lancé (calc_perso lu, résultat de départ tiré du questionnaire affiché)",
      !C && typeof etat === "object" && etat.age === false && etat.off === 0 && /\d/.test(etat.tdee) && lusSante(db).some(l => /calc_perso/.test(l.outil)), JSON.stringify([C && C.sig, etat, lusSante(db)]));
    await saisirCalcul(page);
    await page.waitForSelector("#invitation-declic_calculateur", { timeout: 6000 }).catch(() => null); await attendre(page, 1500);
    const cp = contenuDe(db, ID, "calc_perso") || {};
    ok("saisie du calcul : calc_perso écrit (femme, 30 ans, 165 cm, 60 kg, 3 h) ; l'invitation declic_calculateur s'affiche (#invitation-declic_calculateur)",
      ecr(db, "calc_perso", ID).length === 1 && cp.sexe === "F" && cp.age === 30 && cp.taille === 165 && cp.poids === 60 && cp.heures === 3 && !!(await page.$("#invitation-declic_calculateur")),
      JSON.stringify(cp) + " · " + resume(db));
    const a0 = db.authUser.length;
    await aller(page, "#/mensurations", 1800);
    const Cm = await lireCarte(page);
    await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
    await page.fill("#e-sem", "1"); await page.fill("#e-poids", "70.4"); await page.click("#add"); await attendre(page, 1800);
    const mens = contenuDe(db, ID, "mens") || {};
    await aller(page, "#/formation", 1500); await page.waitForSelector('#fo-vue [data-mod="m2"]');
    await ouvrirM2(page);
    const Cf = await lireCarte(page), Df = await lireDiete(page);
    ok("plus de carte ailleurs : Ma progression active (pesée enregistrée : mens écrit, 70,4 kg), la diète active (32 champs) ; aucune autre requête /auth/v1/user",
      !Cm && ecr(db, "mens", ID).length === 1 && Array.isArray(mens.mesures) && mens.mesures.some(x => x.poids === 70.4) && !Cf && !!Df && Df.actifs === 32 && db.authUser.length === a0,
      JSON.stringify([Cm && Cm.sig, mens.mesures, Cf && Cf.sig, Df, auth(db, null, a0)]));
    await aller(page, "#/calculateur", 1500);
    await page.reload(); await pret(page, "#tdee"); await attendre(page, 1500);
    const Cr = await lireCarte(page);
    ok("page rechargée (#/calculateur) : plus de carte, champs actifs, aucune requête /auth/v1/user", !Cr && !(await page.$("#vue [data-sante-off]")) && db.authUser.length === a0, JSON.stringify([Cr && Cr.sig, auth(db, null, a0)]));
    /* déconnexion (« Se déconnecter »), puis reconnexion par le mot de passe : la session vient de la base */
    await page.evaluate(() => document.getElementById("deco").click());
    await page.waitForSelector("#c-email", { timeout: 15000 });
    const Sd = await stockage(page);
    await page.fill("#c-email", EMAIL(k)); await page.fill("#c-mdp", MDP); await page.click("#c-go");
    await pret(page, "#vue header.masthead"); await attendre(page, 800);
    await aller(page, "#/calculateur", 1800);
    const Cc = await lireCarte(page), Sc = await stockage(page);
    await aller(page, "#/mensurations", 1500);
    const Cc2 = await lireCarte(page);
    ok("« Se déconnecter » (session effacée de l'appareil) puis reconnexion par mot de passe : la session reçue porte l'accord (métadonnées de la base) ; calculateur et Ma progression sans carte, aucune requête /auth/v1/user",
      !Sd.rangee && egal(db.connexions, [EMAIL(k)]) && !Cc && !Cc2 && !!Sc.memoire && Sc.memoire.consentement_sante === P[0].corps.data.consentement_sante && db.authUser.length === a0,
      JSON.stringify([Sd.rangee, db.connexions, Cc && Cc.sig, Cc2 && Cc2.sig, Sc.memoire, auth(db, null, a0)]));
  });

  /* =================== F. un autre appareil ; relecture =================== */
  await bloc("F. autre appareil et relecture", async () => {
    const k = 7, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q, donnees: [["mens", MENS1], ["formation", FO({ ouvert: "m2" })]] })] });
    /* appareil A : l'accord donné sur Ma progression */
    const A = await contexte(b, quiP(k), db);
    await A.page.goto(URL0 + "#/mensurations"); await pret(A.page, "#sante-carte"); await attendre(A.page, 1200);
    const tClic = await accepter(A.page, 2500);
    const P = auth(db, "PUT"), Ca = await lireCarte(A.page), kp = await A.page.$eval("#k-poids", e => e.textContent.trim()).catch(() => "?");
    ok("appareil A, Ma progression : « J'accepte » → UN PUT exact (sante_ecran mensurations) ; la page repart sans carte, ses mesures lues et affichées (poids actuel 70,1)",
      P.length === 1 && putOk(P[0], "mensurations", tClic) && !Ca && /70,1/.test(kp) && lusSante(db).some(l => /\bmens\b/.test(l.outil)), JSON.stringify([P, Ca && Ca.sig, kp]));
    /* appareil B : sa session ne porte pas l'accord (métadonnées d'avant) */
    const g0 = auth(db, "GET").length, l0 = db.lectures.length;
    const B = await contexte(b, quiP(k), db);
    await B.page.goto(URL0 + "#/calculateur"); await pret(B.page, "#tdee");
    await B.page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).catch(() => {});
    await attendre(B.page, 1500);
    const Cb = await lireCarte(B.page), Sb = await stockage(B.page), gB = auth(db, "GET").length - g0;
    const eb = await B.page.evaluate(() => ({ age: document.getElementById("age").disabled, off: document.querySelectorAll("#vue [data-sante-off]").length, tdee: document.getElementById("tdee").textContent.trim() })).catch(e => String(e));
    ok("appareil B (session sans l'accord), calculateur : UNE relecture GET /auth/v1/user, l'accord y est → la page repart sans carte, champs actifs, calculateur lancé (calc_perso lu) ; la session de B mise à jour (mémoire et rangée), jetons intacts",
      gB === 1 && !Cb && typeof eb === "object" && eb.age === false && eb.off === 0 && /\d/.test(eb.tdee) && lusSante(db, l0).some(l => /calc_perso/.test(l.outil))
      && !!Sb.memoire && Sb.memoire.consentement_sante === P[0].corps.data.consentement_sante && !!Sb.rangee && egal(Sb.rangee.meta, Sb.memoire) && Sb.rangee.access === "jeton-" + ID,
      JSON.stringify([gB, Cb && Cb.sig, eb, Sb.memoire, Sb.rangee]));
    const g1 = db.authUser.length;
    await aller(B.page, "#/mensurations", 1800);
    const Cb2 = await lireCarte(B.page);
    await aller(B.page, "#/formation", 1800); await B.page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
    const Cb3 = await lireCarte(B.page), Db3 = await lireDiete(B.page);
    ok("appareil B ensuite : Ma progression et la diète sans carte (diète active), aucune autre requête /auth/v1/user, aucun PUT de B",
      !Cb2 && !Cb3 && !!Db3 && Db3.actifs === 32 && db.authUser.length === g1 && auth(db, "PUT").length === 1, JSON.stringify([Cb2 && Cb2.sig, Cb3 && Cb3.sig, Db3, auth(db, null, g1)]));
    /* appareil C : la diète d'abord (module 02 ouvert en base) */
    const g2 = auth(db, "GET").length;
    const Cx = await contexte(b, quiP(k), db);
    await Cx.page.goto(URL0 + "#/formation"); await pret(Cx.page, "#fo-vue .fo-diete");
    await Cx.page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).catch(() => {});
    await attendre(Cx.page, 1200);
    const Cc = await lireCarte(Cx.page), Dc = await lireDiete(Cx.page);
    ok("appareil C (session sans l'accord), la diète : UNE relecture, l'accord y est → la diète redessinée sans carte, active",
      auth(db, "GET").length - g2 === 1 && !Cc && !!Dc && Dc.actifs === 32 && Dc.off === 0 && auth(db, "PUT").length === 1, JSON.stringify([auth(db, "GET").length - g2, Cc && Cc.sig, Dc]));
    /* relecture SANS accord en base : réponse vide, sans métadonnées, 500, coupure → rien ne change ; une par minute ; aucune hors ligne */
    const k2 = 8;
    const db2 = base({ comptes: [compte(k2)] });
    const X = await contexte(b, quiP(k2), db2);
    const S0 = await (async () => { db2.panneGet = "vide"; await X.page.goto(URL0 + "#/calculateur"); await pret(X.page, "#sante-carte"); await attendre(X.page, 1500); return stockage(X.page); })();
    const etapes = [];
    const etape = async (nom, panne, h, avance) => {
      if (avance) await X.page.clock.setSystemTime((await X.page.evaluate(() => Date.now())) + 2 * MIN);
      db2.panneGet = panne; await aller(X.page, h, 1800);
      const C = await lireCarte(X.page), S = await stockage(X.page);
      etapes.push({ nom, get: auth(db2, "GET").length, carte: carteOk(C, h === "#/calculateur" ? "calculateur" : "mensurations", "fr") && figee(C, 6), meta: egal(S.memoire, S0.memoire) && egal(S.rangee && S.rangee.meta, S0.rangee && S0.rangee.meta) });
    };
    etapes.push({ nom: "vide", get: auth(db2, "GET").length, carte: carteOk(await lireCarte(X.page), "calculateur", "fr"), meta: !!S0.memoire && S0.memoire.prenom === "Léa" && !("consentement_sante" in S0.memoire) });
    await etape("dans la minute", null, "#/mensurations", false);
    await etape("sans métadonnées", "sans", "#/calculateur", true);
    await etape("500", 500, "#/mensurations", true);
    await etape("coupure", "coupure", "#/calculateur", true);
    await couper(X, true);
    await etape("hors ligne", null, "#/mensurations", true);
    await couper(X, false);
    const att = [["vide", 1], ["dans la minute", 1], ["sans métadonnées", 2], ["500", 3], ["coupure", 4], ["hors ligne", 4]];
    ok("relecture sans accord en base : réponse {} , sans user_metadata, 500, coupure réseau → la carte reste (champs inactifs), métadonnées de l'appareil intactes (prénom gardé, rien effacé) ; au plus UNE relecture par minute (page rouverte dans la minute : aucune) ; hors ligne : aucune relecture ; aucun PUT",
      etapes.length === 6 && att.every(([n, g], i) => etapes[i].nom === n && etapes[i].get === g && etapes[i].carte && etapes[i].meta) && auth(db2, "PUT").length === 0
      && !db2.bloquees.some(x => /^GET \/auth\/v1\/user/.test(x)), JSON.stringify(etapes) + " bloquées hors ligne : " + JSON.stringify(db2.bloquees));
  });

  /* =================== G. scénario 3 : « Pas maintenant » =================== */
  await bloc("G. Pas maintenant (scénario 3)", async () => {
    const k = 9, ID = PID(k);
    const SIX = { m1a: true, m1b: true, m1c: true, m1d: true, m1e: true, m1f: true };   // module 01 Mindset : 6 cases sur 7
    const db = base({ comptes: [compte(k, { donnees: [["formation", FO({ coches: SIX })]] })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + ACCUEIL); await pret(page, "#dc-etape-go"); await attendre(page, 800);
    const etape0 = await page.$eval("#dc-etape", e => e.getAttribute("data-etape")).catch(() => "?");
    const l0 = db.lectures.length;   // l'accueil lit calc_perso et mens pour choisir l'étape (v52) : on compte à partir du calculateur
    await page.click("#dc-etape-go"); await page.waitForSelector("#sante-carte", { timeout: 8000 }).catch(() => {}); await attendre(page, 1500);
    const C0 = await lireCarte(page);
    await page.click("#sante-non"); await attendre(page, 400);
    const R = await lireCarte(page);
    ok("depuis l'accueil (« Ta prochaine étape » : calories), le calculateur : la carte ; « Pas maintenant » → section.panel.sante-carte.sante-refus#sante-carte > p#sante-refus[role=status][tabindex=-1] à la place de la carte (juste après l'en-tête), texte EXACT « " + SANTE.fr.refus + " », focus dessus",
      etape0 === "calories" && carteOk(C0, "calculateur", "fr") && verifRefus(R, "calculateur", "fr"), det(R) + " " + JSON.stringify([etape0, R && R.txt.refus]));
    await capturer(page, "refus-fr-sombre-390.png", "#sante-carte");
    const f = await forcer(page, CHAMPS_CALC); await attendre(page, 1500);
    ok("après « Pas maintenant » : champs toujours inactifs (disabled + data-sante-off), valeurs forcées sans effet, aucun PUT, aucune lecture de calc_perso, calc ou mens depuis l'ouverture du calculateur, aucune écriture",
      figee(R, 10) && f === true && auth(db, "PUT").length === 0 && lusSante(db, l0).length === 0 && saisies(db).length === 0, det(R) + " " + JSON.stringify([f, lusSante(db, l0), auth(db)]) + " " + resume(db));
    /* le reste de l'espace */
    await aller(page, ACCUEIL, 1800);
    const acc = await page.evaluate(() => ({ etape: (document.getElementById("dc-etape") || {}).getAttribute ? document.getElementById("dc-etape").getAttribute("data-etape") : null, accomp: !!document.getElementById("dc-accomp"),
      off: document.querySelectorAll("#vue [data-sante-off]").length, inactifs: [...document.querySelectorAll("#vue a, #vue button, #vue input")].filter(e => e.disabled).length, carte: !!document.getElementById("sante-carte") })).catch(e => String(e));
    ok("l'accueil s'affiche et reste utilisable : « Ta prochaine étape » toujours « calories », « Ce que l'accompagnement ajoute », aucun élément inactif ni marqué, aucune carte",
      typeof acc === "object" && acc.etape === "calories" && acc.accomp && acc.off === 0 && acc.inactifs === 0 && !acc.carte, JSON.stringify(acc));
    await aller(page, "#/formation", 1500); await page.waitForSelector('#fo-vue [data-coche="p1a"]');
    await page.check('[data-coche="p1a"]'); await attendre(page, 1800);
    await ouvrirM2(page);
    const Cd = await lireCarte(page);
    await page.click("#sante-non"); await attendre(page, 400);
    const Rd = await lireCarte(page);
    const nf = ecr(db, "formation", ID).length;
    await page.check('[data-coche="m2a"]'); await attendre(page, 2000);
    const Rd2 = await lireCarte(page), Ef = ecr(db, "formation", ID), fo = contenuDe(db, ID, "formation") || {};
    ok("la Speed Formation utilisable : une case cochée enregistrée (coches.p1a) ; module 02 : la carte de la diète, « Pas maintenant » → le message à sa place (div…sante-inline.sante-refus, focus) ; une case de la to-do cochée (formation redessinée) : le message GARDÉ, pas de carte, formation écrite (coches.m2a) ; aucune ligne de diète en base (toutes les écritures : diète {})",
      carteOk(Cd, "formation", "fr") && verifRefus(Rd, "formation", "fr") && !!Rd2 && Rd2.sig === "div#sante-carte.sante-carte.sante-inline.sante-refus" && norm(Rd2.txt.refus) === norm(SANTE.fr.refus) && !Rd2.txt.oui
      && Ef.length === nf + 1 && fo.coches && fo.coches.p1a === true && fo.coches.m2a === true && Ef.every(e => egal(e.contenu.diete, {})), det(Rd2) + " " + JSON.stringify([Ef.map(e => [e.contenu.coches, e.contenu.diete]), Rd && Rd.focus]));
    await aller(page, "#/profil", 1500); await page.waitForSelector("#mc-emails:not([disabled])", { state: "attached", timeout: 8000 });
    await page.click("label.switch:has(#mc-emails)"); await attendre(page, 1800);
    const em = contenuDe(db, ID, "emails") || {}, pOff = await page.evaluate(() => document.querySelectorAll("#vue [data-sante-off]").length);
    await aller(page, "#/programme", 1500);
    const ver = await page.evaluate(() => ({ verrou: !!document.querySelector("#vue .verrou"), lien: !!document.querySelector("#vue .verrou a[target=_blank]"), off: document.querySelectorAll("#vue [data-sante-off]").length, carte: !!document.getElementById("sante-carte") })).catch(e => String(e));
    ok("le Profil utilisable (interrupteur de la newsletter : emails écrit, newsletter oui, version du Profil 2026-09-28c) ; une page verrouillée (#/programme) s'affiche avec son lien ; rien d'inactif ni de carte",
      em.newsletter === true && em.source === "profil" && em.version === "2026-09-28c" && pOff === 0 && typeof ver === "object" && ver.verrou && ver.lien && ver.off === 0 && !ver.carte, JSON.stringify([em, pOff, ver]));
    /* la carte revient à la prochaine ouverture */
    await aller(page, "#/formation", 1800); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
    const Cn = await lireCarte(page);
    await aller(page, "#/calculateur", 1500);
    const Cn2 = await lireCarte(page);
    await aller(page, "#/mensurations", 1500);
    const Cn3 = await lireCarte(page);
    await page.click("#sante-non"); await attendre(page, 400);
    const Rn3 = await lireCarte(page);
    await aller(page, "#/calculateur", 1500);
    const Cn4 = await lireCarte(page);
    ok("la carte revient à la prochaine ouverture : diète (formation rouverte), calculateur, Ma progression (« Pas maintenant » → message), puis calculateur de nouveau",
      carteOk(Cn, "formation", "fr") && carteOk(Cn2, "calculateur", "fr") && carteOk(Cn3, "mensurations", "fr") && verifRefus(Rn3, "mensurations", "fr") && carteOk(Cn4, "calculateur", "fr"),
      [Cn, Cn2, Cn3, Cn4].map(det).join(" | "));
    const S = await stockage(page);
    ok("tout du long : aucun accord envoyé (aucun PUT /auth/v1/user), aucune écriture de calc_perso ni de mens, aucune copie en file, aucune invitation santé (ni carte ni mémoire) ; écrits : formation, emails (et le compteur de visites) seulement",
      auth(db, "PUT").length === 0 && ecr(db, "calc_perso").length === 0 && ecr(db, "mens").length === 0 && !copiesSante(S).length && !invitSante(S) && (await nbInvitations(page)) === 0
      && saisies(db).every(e => e.table === "donnees" && ["formation", "emails"].includes(e.outil)), resume(db) + " " + JSON.stringify([copiesSante(S), S.invitations]));
    /* l'invitation du module Mindset n'est pas une donnée de santé : inchangée avant l'accord (contrat du lot 5, H) */
    await aller(page, "#/formation", 1500); await page.waitForSelector('#fo-vue [data-mod="m1"]');
    await page.click('#fo-vue [data-mod="m1"]'); await page.waitForSelector('[data-coche="m1g"]', { timeout: 6000 }); await attendre(page, 800);
    await page.check('[data-coche="m1g"]');
    await page.waitForSelector("#invitation-declic_mindset", { timeout: 6000 }).catch(() => null); await attendre(page, 1200);
    const S2 = await stockage(page);
    ok("l'invitation du module Mindset (pas une donnée de santé) inchangée avant l'accord : 7e case du module 01 → la carte #invitation-declic_mindset ; toujours aucun accord envoyé ni invitation santé",
      !!(await page.$("#invitation-declic_mindset")) && auth(db, "PUT").length === 0 && !invitSante(S2) && ((contenuDe(db, ID, "formation") || {}).coches || {}).m1g === true, resume(db) + " " + S2.invitations);
  });

  /* =================== H. échecs de l'accord =================== */
  await bloc("H. échecs de l'accord", async () => {
    const k = 10, ID = PID(k);
    const db = base({ comptes: [compte(k)] });
    const X = await contexte(b, quiP(k), db), page = X.page;
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 1500);
    const S0 = await stockage(page);
    const essais = [];
    const essai = async (nom, panne, horsLigne) => {
      db.pannePut = panne; if (horsLigne) await couper(X, true);
      await page.click("#sante-oui"); await attendre(page, 1800);
      const C = await lireCarte(page), S = await stockage(page);
      essais.push({ nom, put: auth(db, "PUT").length, bloque: db.bloquees.filter(x => /^PUT \/auth\/v1\/user/.test(x)).length, carte: !!C && C.sig === "section#sante-carte.panel.sante-carte" && !!C.txt.oui, msg: C && norm(C.msg), boutons: !!C && C.ouiOff === false && C.nonOff === false,
        figee: figee(C, 10), meta: egal(S.memoire, S0.memoire) && egal(S.rangee && S.rangee.meta, S0.rangee && S0.rangee.meta) && egal(db.meta[ID], META_V64()), file: copiesSante(S).length });
    };
    await essai("400", 400); await essai("500", 500); await essai("coupure", "coupure"); await essai("hors ligne", null, true);
    const att = [["400", 1, 0], ["500", 2, 0], ["coupure", 3, 0], ["hors ligne", 3, 1]];
    ok("« J'accepte » refusé (400), serveur en panne (500), réseau coupé, puis hors ligne (la requête ne part pas) : à chaque fois la carte reste, « Non enregistré : réessaie dans un instant. », boutons réactivés, champs toujours inactifs, métadonnées inchangées (appareil et base), rien en file",
      att.every(([n, p, bl], i) => !!essais[i] && essais[i].nom === n && essais[i].put === p && essais[i].bloque === bl && essais[i].carte && essais[i].msg === SANTE.fr.echec && essais[i].boutons && essais[i].figee && essais[i].meta && essais[i].file === 0), JSON.stringify(essais));
    /* l'accord n'est jamais mis en file : ni reprise 30 s plus tard, ni au retour du réseau */
    await page.clock.fastForward(35000); await attendre(page, 500);
    await couper(X, false); await attendre(page, 2500);
    const rp = await page.evaluate(async () => { if (typeof Store.reprendre !== "function") return "Store.reprendre absent"; await Store.reprendre(); return "ok"; }).catch(e => String(e)); await attendre(page, 1500);
    const S1 = await stockage(page);
    ok("l'accord n'est jamais mis en file : 35 s plus tard (reprises), puis au retour du réseau (événement online, Store.reprendre) : aucun PUT de plus, la carte toujours là, aucune écriture de santé, aucune copie",
      rp === "ok" && auth(db, "PUT").length === 3 && db.bloquees.filter(x => /^PUT \/auth\/v1\/user/.test(x)).length === 1 && !!(await page.$("#sante-oui")) && ecr(db, "calc_perso").length === 0 && !copiesSante(S1).length, rp + " " + JSON.stringify([auth(db, "PUT").length, copiesSante(S1)]) + " " + resume(db));
    db.pannePut = null;
    const tClic = await accepter(page, 2500);
    const P = auth(db, "PUT"), C = await lireCarte(page);
    ok("puis « J'accepte » réussi : le PUT exact (écran calculateur), plus de carte, champs actifs",
      P.length === 4 && putOk(P[3], "calculateur", tClic) && !C && !(await page.$("#vue [data-sante-off]")), JSON.stringify([P.slice(3), C && C.sig]));
  });

  /* =================== I. défense en profondeur : le stockage (appels directs dans la page) =================== */
  await bloc("I. défense en profondeur (Store)", async () => {
    const k = 11, ID = PID(k);
    const db = base({ comptes: [compte(k)] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + ACCUEIL); await pret(page, "#dc-accomp"); await attendre(page, 1500);
    const CHIFFRES = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
    const MENS = { dstart: "2026-01-05", pstart: 70, zones: ZONES, affichees: [4], mesures: [{ sem: 1, date: "2026-01-12", poids: 70, vals: { "4": 80 } }] };
    const e0 = saisies(db).length;
    const r1 = await page.evaluate(([c, m]) => {
      const avantC = Store.cache.calc_perso, avantM = Store.cache.mens;
      return { calc: Store.ecrire("calc_perso", c), mens: Store.ecrire("mens", m), cacheC: Store.cache.calc_perso === avantC, cacheM: Store.cache.mens === avantM };
    }, [CHIFFRES, MENS]).catch(e => String(e));
    await attendre(page, 1800);
    const S1 = await stockage(page);
    ok("Store.ecrire(\"calc_perso\", chiffres) et Store.ecrire(\"mens\", mesures) → false : rien en cache, aucune copie mhx_attente, rien envoyé",
      typeof r1 === "object" && r1.calc === false && r1.mens === false && r1.cacheC && r1.cacheM && !copiesSante(S1).length && saisies(db).length === e0, JSON.stringify([r1, copiesSante(S1)]) + " " + resume(db));
    const env = await page.evaluate(async ([c, m]) => { if (typeof Store.envoyer !== "function") return "Store.envoyer absent"; await Store.envoyer("mens", m); await Store.envoyer("calc_perso", c); return "ok"; }, [CHIFFRES, MENS]).catch(e => String(e));
    await attendre(page, 800);
    ok("Store.envoyer de ces clés (appel direct, sans erreur) : rien envoyé", env === "ok" && ecr(db, "mens").length === 0 && ecr(db, "calc_perso").length === 0, env + " " + resume(db));
    /* des copies anciennes sur l'appareil (app d'avant, coupure réseau) : Store.reprendre les saute, envoie les autres */
    const l0 = db.lectures.length;
    const r2 = await page.evaluate(async ([id, c, m]) => {
      const t = new Date(Date.now() - 60000).toISOString(), P = "mhx_attente|" + id + "|";
      localStorage.setItem(P + "mens", JSON.stringify({ a: id, t, v: m })); localStorage.setItem(P + "calc_perso", JSON.stringify({ a: id, t, v: c })); localStorage.setItem(P + "prefs", JSON.stringify({ a: id, t, v: { langue: "fr" } }));
      await Store.reprendre();
      return { mens: !!localStorage.getItem(P + "mens"), calc: !!localStorage.getItem(P + "calc_perso"), prefs: !!localStorage.getItem(P + "prefs") };
    }, [ID, CHIFFRES, MENS]).catch(e => String(e));
    await attendre(page, 800);
    const lus = db.lectures.slice(l0);
    ok("Store.reprendre avec des copies anciennes de mens, calc_perso et prefs : mens et calc_perso sautées (ni lecture maj_le ni envoi, copies gardées sur l'appareil), prefs envoyée normalement (lecture maj_le, écriture, copie retirée)",
      typeof r2 === "object" && r2.mens && r2.calc && !r2.prefs && !lus.some(l => SANTE_CLES.test(l.outil)) && lus.some(l => l.outil === "eq.prefs" && l.select === "maj_le")
      && ecr(db, "mens").length === 0 && ecr(db, "calc_perso").length === 0 && ecr(db, "prefs", ID).length === 1, JSON.stringify([r2, lus]) + " " + resume(db));
    await page.evaluate(id => { ["mens", "calc_perso"].forEach(c => localStorage.removeItem("mhx_attente|" + id + "|" + c)); }, ID);
    /* « Restaurer une sauvegarde » */
    const FO_D = FO({ coches: { p1a: true }, diete: clone(DIETE_REMPLIE) }), FO_S = FO({ coches: { p1b: true } });
    const r3 = await page.evaluate(async ([c, m, fd, fs2]) => {
      const out = {};
      const essai = async (d) => { try { return await Store.importer(JSON.stringify({ plateforme: "mhx", version: 2, donnees: d })); } catch (e) { return "erreur : " + (e && e.message); } };
      out.mixte = await essai({ mens: m, calc_perso: c, formation: fd, challenge: { version: 1, jours: {}, cta: { clics: [] }, restauree: 71 } });
      out.sante = await essai({ mens: m, calc_perso: c, formation: fd });
      out.sansDiete = await essai({ formation: fs2 });
      return out;
    }, [CHIFFRES, MENS, FO_D, FO_S]).catch(e => String(e));
    await attendre(page, 800);
    const Ef = ecr(db, "formation", ID);
    const Ech = ecr(db, "challenge", ID);
    ok("Store.importer (« Restaurer une sauvegarde ») : mens, calc_perso chiffré et une formation dont la diète est remplie ignorés, le reste restauré (challenge) ; une sauvegarde sans rien d'autre → « vide », rien envoyé ; une formation sans diète restaurée",
      typeof r3 === "object" && r3.mixte === true && r3.sante === "erreur : vide" && r3.sansDiete === true && ecr(db, "mens").length === 0 && ecr(db, "calc_perso").length === 0
      && Ech.length === 1 && Ech[0].contenu.restauree === 71 && Ef.length === 1 && egal(Ef[0].contenu, FO_S), JSON.stringify([r3, Ef.map(e => e.contenu.coches)]) + " " + resume(db));
    const r4 = await page.evaluate(() => ({ vide: Store.ecrire("calc_perso", {}), prefs: Store.ecrire("prefs", { langue: "fr", t: 71 }) })).catch(e => String(e));
    await attendre(page, 1800);
    ok("toujours permis : calc_perso {} (retrait du garde-fou 18 ans : aucune valeur) et les autres clés (prefs) → écrits",
      typeof r4 === "object" && r4.vide === true && r4.prefs === true && ecr(db, "calc_perso", ID).length === 1 && egal(ecr(db, "calc_perso", ID)[0].contenu, {}) && ecr(db, "prefs", ID).length === 2,
      JSON.stringify(r4) + " " + resume(db));
  });

  /* =================== J. prospects déjà d'accord (inscription v52-v63) =================== */
  await bloc("J. prospects déjà d'accord", async () => {
    const k = 12, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V55(), donnees: [["formation", FO({ ouvert: "m2" })]] })] });
    const { page } = await contexte(b, quiP(k, META_V55()), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1500);
    const C1 = await lireCarte(page), E = await santeEtat(page);
    await saisirCalcul(page); await attendre(page, 2000);
    await aller(page, "#/mensurations", 1500);
    const C2 = await lireCarte(page);
    await aller(page, "#/formation", 1500); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
    const C3 = await lireCarte(page), D3 = await lireDiete(page);
    ok("prospect inscrit en v52-v63 (consentement_sante daté, sante_version 2026-09-28b) : Sante.aDemander() faux ; aucune carte (calculateur, Ma progression, diète active), aucun data-sante-off",
      !!E && E.a === false && E.ok === true && !C1 && !C2 && !C3 && !!D3 && D3.actifs === 32 && !(await page.$("#vue [data-sante-off]")), JSON.stringify([E, C1 && C1.sig, C2 && C2.sig, C3 && C3.sig, D3]));
    const Gj = await garde(page);
    ok("aucune relecture ni PUT /auth/v1/user ; la garde du stockage ouverte (Sante.bloque faux pour mens et calc_perso) : écritures normales (calc_perso écrit à la saisie)",
      db.authUser.length === 0 && ecr(db, "calc_perso", ID).length === 1 && gardeOuverte(Gj), JSON.stringify([db.authUser, Gj]) + " " + resume(db));
    const k2 = 13;
    const db2 = base({ comptes: [compte(k2, { meta: META_V55({ consentement_sante: true }) })] });
    const { page: p2 } = await contexte(b, quiP(k2, META_V55({ consentement_sante: true })), db2);
    await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#tdee"); await attendre(p2, 1500);
    const Cx = await lireCarte(p2), Ex = await santeEtat(p2);
    ok("accord enregistré sous la forme true : aucune carte, Sante.aDemander() faux, aucune requête /auth/v1/user",
      !Cx && !!Ex && Ex.a === false && db2.authUser.length === 0 && !(await p2.$("#vue [data-sante-off]")), JSON.stringify([Cx && Cx.sig, Ex, db2.authUser]));
  });

  /* =================== K. client, compte de test, coach, fiche consultée =================== */
  await bloc("K. client, compte de test, coach", async () => {
    /* client Thomas */
    {
      const db = base();
      const { page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
      const C1 = await lireCarte(page), E = await santeEtat(page);
      const okCalc = await page.$eval("#calc-ok", e => !e.hidden).catch(() => false);
      if (okCalc) await page.click("#calc-ok"); else await page.fill("#poids", "82");
      await attendre(page, 1800);
      await aller(page, "#/mensurations", 1800);
      const C2 = await lireCarte(page);
      await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
      await page.fill("#e-sem", "40"); await page.fill("#e-poids", "82"); await page.click("#add"); await attendre(page, 1800);
      await aller(page, "#/formation", 1800); await page.waitForSelector('#fo-vue [data-mod="m2"]');
      await ouvrirM2(page);
      const C3 = await lireCarte(page), D3 = await lireDiete(page);
      await page.fill('[data-dm="0.p"]', "35"); await attendre(page, 1800);
      const fo = contenuDe(db, F.IDS.c1, "formation") || {};
      ok("client Thomas : aucune carte (calculateur, Ma progression, diète active), Sante.aDemander() faux ; aucun GET ni PUT /auth/v1/user ; écritures comme avant (calc_perso, pesée mens, grammes de la diète)",
        !C1 && !C2 && !C3 && !!E && E.a === false && !!D3 && D3.actifs === 32 && db.authUser.length === 0 && ecr(db, "calc_perso", F.IDS.c1).length >= 1 && ecr(db, "mens", F.IDS.c1).length === 1
        && ((((fo.diete || {})["1"] || {})["0"] || [])[0] || {}).p === "35", JSON.stringify([C1 && C1.sig, C2 && C2.sig, C3 && C3.sig, E, D3, db.authUser]) + " " + resume(db));
    }
    /* le compte client de test (identifiant lu dans CONFIG.nouveautes.comptes_test) : ses données intactes */
    {
      const TID = TEST_ID || PID(90);
      const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);
      const db = base({ comptes: [{ id: TID, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", meta: { prenom: "" },
        donnees: [["intake", INTAKE_THOMAS], ["prefs", { langue: "fr" }], ["calc_perso", CP], ["mens", MENS1], ["formation", FO({ ouvert: "m2", diete: clone(DIETE_REMPLIE) })]] }] });
      const avantT = rangees(db, TID);
      const { page } = await contexte(b, qui(TID, "test@exemple.fr", { prenom: "" }), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
      const C1 = await lireCarte(page), E = await santeEtat(page);
      await aller(page, "#/mensurations", 1800);
      const C2 = await lireCarte(page), kp = await page.$eval("#k-poids", e => e.textContent.trim()).catch(() => "?");
      await aller(page, "#/formation", 1800); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
      const C3 = await lireCarte(page), D3 = await lireDiete(page);
      const intact = rangees(db, TID) === avantT && saisies(db, TID).length === 0;
      ok("compte client de test (" + (TEST_ID ? "identifiant lu dans CONFIG.nouveautes.comptes_test" : "IDENTIFIANT INTROUVABLE dans le fichier servi") + ") : aucune carte (calculateur, Ma progression avec sa pesée affichée, diète avec ses grammes affichés), Sante.aDemander() faux, aucun GET ni PUT /auth/v1/user ; toutes ses données intactes après la visite",
        !!TEST_ID && !C1 && !C2 && !C3 && !!E && E.a === false && /70,1/.test(kp) && !!D3 && D3.actifs === 32 && D3.vides === 4 && db.authUser.length === 0 && intact,
        JSON.stringify([TEST_ID, C1 && C1.sig, C2 && C2.sig, C3 && C3.sig, E, kp, D3, db.authUser, intact]) + " " + resume(db));
      await aller(page, "#/calculateur", 1500); await page.fill("#poids", "61"); await attendre(page, 1800);
      const Gt = await garde(page);
      ok("compte client de test : la garde du stockage ouverte (Sante.bloque faux pour mens et calc_perso) ; ses écritures comme avant (calcul modifié : calc_perso écrit, 61 kg)",
        gardeOuverte(Gt) && ecr(db, "calc_perso", TID).length === 1 && (contenuDe(db, TID, "calc_perso") || {}).poids === 61 && db.authUser.length === 0, JSON.stringify(Gt) + " " + resume(db));
    }
    /* le coach : son calculateur, puis la fiche d'un prospect SANS accord */
    {
      const k = 14, IDP = PID(k);
      const db = base({ comptes: [compte(k, { donnees: [["calc_perso", CP], ["mens", MENS1], ["formation", FO({ ouvert: "m2", diete: clone(DIETE_REMPLIE) })]] })] });
      const avantP = rangees(db, IDP);
      const { page } = await contexte(b, COACH, db, { viewport: ORDI });
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
      const C0 = await lireCarte(page), E0 = await santeEtat(page);
      await page.fill("#poids", "84"); await attendre(page, 1800);
      ok("coach, son calculateur : aucune carte, Sante.aDemander() faux, écriture comme avant (calc du coach)", !C0 && !!E0 && E0.a === false && ecr(db, "calc", F.IDS.coach).length >= 1, JSON.stringify([C0 && C0.sig, E0]) + " " + resume(db));
      await aller(page, "#/clients", 1500); await page.waitForSelector(`[data-ouvrir="${IDP}"]`, { timeout: 10000 });
      await page.click(`[data-ouvrir="${IDP}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
      await aller(page, "#/calculateur", 1800);
      const C1 = await lireCarte(page), E1 = await santeEtat(page);
      await aller(page, "#/mensurations", 1800);
      const C2 = await lireCarte(page), kp = await page.$eval("#k-poids", e => e.textContent.trim()).catch(() => "?");
      await aller(page, "#/formation", 1800); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
      const C3 = await lireCarte(page), D3 = await lireDiete(page);
      const intact = rangees(db, IDP) === avantP && saisies(db, IDP).length === 0;
      ok("coach dans la fiche d'un prospect SANS accord : calculateur, Ma progression (ses mesures affichées), diète (ses grammes affichés) sans aucune carte ; Sante.aDemander() faux (fiche consultée) ; aucun GET ni PUT /auth/v1/user ; rien écrit chez le prospect",
        !C1 && !C2 && !C3 && !!E1 && E1.a === false && E1.consulte === IDP && /70,1/.test(kp) && !!D3 && D3.vides === 4 && D3.off === 0 && db.authUser.length === 0 && intact,
        JSON.stringify([C1 && C1.sig, C2 && C2.sig, C3 && C3.sig, E1, kp, D3, db.authUser, intact]) + " " + resume(db));
      await aller(page, "#/calculateur", 1800); await page.fill("#poids", "58"); await attendre(page, 1800);
      const cf = contenuDe(db, IDP, "calc") || {}, Gc = await garde(page);
      ok("coach dans cette fiche : la garde du stockage ouverte (Sante.bloque faux : fiche consultée) ; son calculateur enregistre comme avant (calc du prospect, 58 kg), sans carte ni requête /auth/v1/user ; ni calc_perso ni mens touchés",
        gardeOuverte(Gc) && ecr(db, "calc", IDP).length >= 1 && cf.poids === 58 && !(await lireCarte(page)) && db.authUser.length === 0 && ecr(db, "calc_perso", IDP).length === 0 && ecr(db, "mens", IDP).length === 0, JSON.stringify([cf, Gc]) + " " + resume(db));
    }
  });

  /* =================== L. affichage : 390 px et 320 px, sombre et clair =================== */
  await bloc("L. affichage", async () => {
    const cas = [];
    const mesurer = async (nom, k, opts, h, diete, refus) => {
      const db = base({ comptes: [compte(k, { donnees: [["formation", FO({ ouvert: diete ? "m2" : "" })]] })] });
      const { page } = await contexte(b, quiP(k), db, opts);
      await page.goto(URL0 + h); await pret(page, "#sante-carte"); await attendre(page, 1200);
      if (refus) { await page.click("#sante-non"); await attendre(page, 400); }
      const A = await affichage(page), C = await lireCarte(page);
      cas.push({ nom, A, ok: sansDebord(A) && lisible(A, refus ? 1 : 6) && boutons44(A, refus) && A.theme === (opts.theme === "light" ? "light" : null) && (refus ? !!C && /sante-refus/.test(C.sig) : !!C && !!C.txt.oui) });
      await capturer(page, nom.replace(/[^a-z0-9]+/gi, "-") + ".png", "#sante-carte");
      const cx = page.context(), i = ouverts.indexOf(cx); if (i > -1) ouverts.splice(i, 1); await cx.close().catch(() => {});
    };
    await mesurer("390 sombre calculateur", 20, {}, "#/calculateur");
    await mesurer("390 sombre diete", 21, {}, "#/formation", true);
    await mesurer("390 sombre refus", 22, {}, "#/calculateur", false, true);
    const n390 = cas.length;
    await mesurer("320 sombre calculateur", 23, { viewport: ETROIT }, "#/calculateur");
    await mesurer("320 sombre mensurations", 24, { viewport: ETROIT }, "#/mensurations");
    await mesurer("320 sombre diete", 25, { viewport: ETROIT }, "#/formation", true);
    await mesurer("320 sombre refus diete", 26, { viewport: ETROIT }, "#/formation", true, true);
    const n320 = cas.length;
    await mesurer("390 clair calculateur", 27, { theme: "light" }, "#/calculateur");
    await mesurer("390 clair diete", 28, { theme: "light" }, "#/formation", true);
    await mesurer("320 clair mensurations", 29, { viewport: ETROIT, theme: "light" }, "#/mensurations");
    await mesurer("320 anglais clair diete", 30, { viewport: ETROIT, theme: "light", langue: "en" }, "#/formation", true);
    const d = l => l.filter(x => !x.ok).map(x => x.nom + " " + detA(x.A)).join(" | ");
    ok("390 px, thème sombre (calculateur, diète, message « Pas maintenant ») : rien ne déborde (page, carte, textes), tout le texte de la carte lisible (contraste 4,5:1 ; 3:1 pour « Pas maintenant » et la note au gris --ink-3 de l'app), « J'accepte » et « Pas maintenant » d'au moins 44 px",
      n390 === 3 && cas.slice(0, n390).every(x => x.ok), d(cas.slice(0, n390)));
    ok("320 px, thème sombre (calculateur, Ma progression, diète, message de la diète) : rien ne déborde, texte lisible, boutons d'au moins 44 px",
      n320 - n390 === 4 && cas.slice(n390, n320).every(x => x.ok), d(cas.slice(n390, n320)));
    ok("thème clair (390 px : calculateur, diète ; 320 px : Ma progression, diète en anglais) : rien ne déborde, texte lisible (4,5:1 ; 3:1 pour le gris --ink-3 et, en clair seulement, le bouton doré de l'app : blanc sur --accent, 4,29:1, comme verif66), boutons d'au moins 44 px",
      cas.length - n320 === 4 && cas.slice(n320).every(x => x.ok), d(cas.slice(n320)));
  });

  /* =================== M. liens absents ou invalides =================== */
  await bloc("M. liens absents ou invalides", async () => {
    const r = [];
    for (const [nom, L] of [["à compléter", LEGAUX_ABSENTS], ["invalides", LEGAUX_INVALIDES]]) {
      LEGAUX = L;
      const k = nom === "à compléter" ? 31 : 32;
      const db = base({ comptes: [compte(k, { donnees: [["formation", FO({ ouvert: "m2" })]] })] });
      const { page } = await contexte(b, quiP(k), db);
      await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 800);
      const C1 = await lireCarte(page), cfg = await page.evaluate(() => CONFIG.textes_legaux).catch(() => null);
      await aller(page, "#/formation", 1500); await page.waitForSelector("#sante-carte", { timeout: 6000 }).catch(() => {});
      const C2 = await lireCarte(page), html = await page.evaluate(() => document.getElementById("vue").innerHTML).catch(() => "");
      r.push({ nom, cfg: egal(cfg, L), c1: carteOk(C1, "calculateur", "fr", { lien: "absent" }), c2: carteOk(C2, "formation", "fr", { lien: "absent" }), js: /javascript:|ftp:/.test(html), d: det(C1) });
    }
    ok("liens des textes légaux « à compléter » (la branche de travail) : la carte (calculateur et diète) garde le même texte « En savoir plus : politique de confidentialité », en texte simple (span, aucun lien)",
      !!r[0] && r[0].cfg && r[0].c1 && r[0].c2, JSON.stringify(r[0]));
    ok("liens invalides (javascript:, ftp:) : texte simple, aucun lien, rien de ces adresses dans la page", !!r[1] && r[1].cfg && r[1].c1 && r[1].c2 && !r[1].js, JSON.stringify(r[1]));
  });

  /* =================== N. relecture lente arrivée après « J'accepte » (correction de la relecture du code) =================== */
  await bloc("N. relecture lente", async () => {
    const k = 40, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q, donnees: [["formation", FO({ ouvert: "m2" })]] })] });
    db.retardGet = 5000;   // la relecture de l'ouverture : lue par le serveur SANS l'accord, sa réponse arrive 5 s plus tard
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte");
    const getParti = await attendreQue(() => auth(db, "GET").length === 1, 3000);
    db.retardGet = 0;
    const tClic = await accepter(page, 1500);   // pendant la relecture
    const avantGet = { lents: db.getsLents.length, carte: !!(await lireCarte(page)) };
    const arrive = await attendreQue(() => db.getsLents.length === 1, 9000); await attendre(page, 1500);
    const E = await santeEtat(page), S = await stockage(page), P = auth(db, "PUT");
    const cs = P[0] && P[0].corps && P[0].corps.data ? P[0].corps.data.consentement_sante : null;
    ok("relecture lente : le GET /auth/v1/user de l'ouverture, lu par le serveur SANS l'accord, répond 5 s plus tard ; « J'accepte » pendant ce temps (UN PUT exact, la page repart sans carte) ; la réponse périmée du GET arrive ensuite : l'accord reste — Sante.ok() vrai, session en mémoire ET session rangée avec le consentement_sante du PUT, jetons intacts",
      getParti && arrive && avantGet.lents === 0 && !avantGet.carte && egal(auth(db).map(x => x.m), ["GET", "PUT"]) && !("consentement_sante" in db.getsLents[0].meta)
      && P.length === 1 && putOk(P[0], "calculateur", tClic) && !!E && E.ok === true && E.a === false
      && !!S.memoire && !!cs && S.memoire.consentement_sante === cs && !!S.rangee && !!S.rangee.meta && S.rangee.meta.consentement_sante === cs && S.rangee.access === "jeton-" + ID,
      JSON.stringify([getParti, arrive, avantGet, auth(db).map(x => x.m), db.getsLents.map(x => x.meta), E, S.memoire, S.rangee]));
    await saisirCalcul(page); await attendre(page, 2000);
    const cp = contenuDe(db, ID, "calc_perso") || {};
    await aller(page, "#/mensurations", 1800);
    const Cm = await lireCarte(page);
    const em = await page.evaluate(() => ({ off: document.querySelectorAll("#vue [data-sante-off]").length, poids: !!document.getElementById("e-poids") && !document.getElementById("e-poids").disabled })).catch(e => String(e));
    await aller(page, "#/formation", 1800); await page.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
    const Cf = await lireCarte(page), Df = await lireDiete(page);
    ok("après la réponse périmée : la saisie du calculateur est enregistrée (calc_perso écrit : femme, 30 ans, 165 cm, 60 kg, 3 h) ; aucune carte ailleurs (Ma progression active, diète active : 32 champs) ; aucune autre requête /auth/v1/user",
      ecr(db, "calc_perso", ID).length === 1 && cp.sexe === "F" && cp.age === 30 && cp.taille === 165 && cp.poids === 60 && cp.heures === 3
      && !Cm && typeof em === "object" && em.off === 0 && em.poids && !Cf && !!Df && Df.actifs === 32 && Df.off === 0 && db.authUser.length === 2,
      JSON.stringify([cp, Cm && Cm.sig, em, Cf && Cf.sig, Df, auth(db).map(x => x.m)]) + " " + resume(db));
  });

  /* =================== O. copie de santé retenue sur l'appareil (ancien client repassé prospect) =================== */
  await bloc("O. copie retenue sur l'appareil", async () => {
    const k = 41, ID = PID(k);
    const M1 = { sem: 1, date: "2026-01-12", poids: 79, vals: {} }, M2 = { sem: 2, date: "2026-01-19", poids: 77, vals: {} };
    const MENS_BASE = { dstart: "2026-01-05", pstart: 80, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [M1] };
    const MENS_COPIE = Object.assign(clone(MENS_BASE), { mesures: [clone(M1), clone(M2)] });
    const db = base({ comptes: [compte(k, { donnees: [["mens", MENS_BASE, avant(3 * H)]] })] });
    const X = await contexte(b, quiP(k), db), page = X.page;
    /* la copie gardée sur l'appareil (pesée de la semaine 2 faite hors ligne quand il était client) : plus récente que la base */
    const tCopie = avant(20 * MIN), CLE = "mhx_attente|" + ID + "|mens";
    await page.addInitScript(([c, id, t, v]) => {
      if (location.hostname !== "localhost" || localStorage.getItem("__copie71")) return;
      localStorage.setItem("__copie71", "1"); localStorage.setItem(c, JSON.stringify({ a: id, t, v }));
    }, [CLE, ID, tCopie, MENS_COPIE]);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#sante-carte"); await attendre(page, 1200);
    const S0 = await stockage(page), C0 = await lireCarte(page), e0 = ecr(db, "mens").length, n0 = db.n;
    await accepter(page, 2500);
    await page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).catch(() => {}); await attendre(page, 1200);
    const Em = ecr(db, "mens", ID), lus = db.lectures.filter(l => l.n > n0 && /\bmens\b/.test(l.outil) && l.select !== "maj_le");
    const aff = page => page.evaluate(() => ({ sem: document.getElementById("k-sem").textContent.trim(), lignes: document.querySelectorAll("#tbody tr").length, poids: document.getElementById("k-poids").textContent.trim() })).catch(e => String(e));
    const A1 = await aff(page), S1 = await stockage(page);
    ok("ancien client repassé prospect, une copie mhx_attente|…|mens hors ligne plus récente que la base (base : 79 kg ; copie : 79 et 77 kg) : gardée sans envoi avant l'accord ; après « J'accepte » sur Ma progression, la copie est envoyée (mens écrit avec 79 et 77, à l'instant de la copie) AVANT que l'outil relise mens, la page montre 2 mesures (dernière 77), la copie retirée de l'appareil ; UN PUT",
      carteOk(C0, "mensurations", "fr") && S0.cles.includes("local:" + CLE) && e0 === 0
      && Em.length === 1 && egal(Em[0].contenu.mesures.map(x => x.poids), [79, 77]) && Em[0].maj_le === tCopie && lus.length >= 1 && lus.every(l => l.n > Em[0].n)
      && typeof A1 === "object" && A1.sem === "2" && A1.lignes === 2 && /^77/.test(A1.poids) && !S1.cles.includes("local:" + CLE) && auth(db, "PUT").length === 1,
      JSON.stringify([C0 && C0.sig, e0, Em.map(e => [e.n, e.maj_le, e.contenu.mesures.map(x => x.poids)]), lus.map(l => [l.n, l.outil, l.select]), A1, S1.cles.filter(c => /attente/.test(c))]));
    await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
    await page.fill("#e-sem", "3"); await page.fill("#e-poids", "76"); await page.click("#add"); await attendre(page, 1800);
    const mf = contenuDe(db, ID, "mens") || {}, A2 = await aff(page);
    ok("puis une nouvelle mesure (semaine 3, 76 kg) : mens écrit avec les 3 mesures (79, 77, 76 : rien de la copie perdu), la page en montre 3",
      Array.isArray(mf.mesures) && egal(mf.mesures.map(x => x.poids), [79, 77, 76]) && ecr(db, "mens", ID).length === 2 && typeof A2 === "object" && A2.sem === "3" && A2.lignes === 3,
      JSON.stringify([mf.mesures, A2]));
    /* l'accord donné sur un AUTRE appareil (en base, pas dans la session de cet appareil) : relu à l'ouverture ; la copie
       retenue part aussi AVANT que Ma progression relise mens (Sante.apres dans Sante.pause) */
    const k2 = 53, ID2 = PID(k2), CLE2 = "mhx_attente|" + ID2 + "|mens";
    const db2 = base({ comptes: [compte(k2, { meta: META_V55(), donnees: [["mens", MENS_BASE, avant(3 * H)]] })] });
    const X2 = await contexte(b, quiP(k2), db2), p2 = X2.page;
    await p2.addInitScript(([c, id, t, v]) => {
      if (location.hostname !== "localhost" || localStorage.getItem("__copie71")) return;
      localStorage.setItem("__copie71", "1"); localStorage.setItem(c, JSON.stringify({ a: id, t, v }));
    }, [CLE2, ID2, tCopie, MENS_COPIE]);
    await p2.goto(URL0 + "#/mensurations"); await pret(p2);
    await p2.waitForFunction(() => !document.getElementById("sante-carte") && !!document.getElementById("k-sem"), null, { timeout: 8000 }).catch(() => {}); await attendre(p2, 1500);
    const Em2 = ecr(db2, "mens", ID2), lus2 = db2.lectures.filter(l => /\bmens\b/.test(l.outil) && l.select !== "maj_le");
    const A3 = await aff(p2), S3 = await stockage(p2);
    ok("accord donné sur un autre appareil (en base, pas dans la session), copie mhx_attente|…|mens retenue (79 et 77 kg) : la relecture trouve l'accord, la copie est envoyée AVANT que Ma progression relise mens, la page montre 2 mesures (dernière 77), copie retirée ; UNE relecture, aucun PUT",
      auth(db2, "GET").length === 1 && auth(db2, "PUT").length === 0 && Em2.length === 1 && egal(Em2[0].contenu.mesures.map(x => x.poids), [79, 77]) && Em2[0].maj_le === tCopie
      && lus2.length >= 1 && lus2.every(l => l.n > Em2[0].n) && typeof A3 === "object" && A3.sem === "2" && A3.lignes === 2 && /^77/.test(A3.poids) && !S3.cles.includes("local:" + CLE2),
      JSON.stringify([auth(db2).map(x => x.m), Em2.map(e => [e.n, e.maj_le, e.contenu.mesures.map(x => x.poids)]), lus2.map(l => [l.n, l.outil, l.select]), A3, S3.cles.filter(c => /attente/.test(c))]));
  });

  /* =================== P. page quittée puis rouverte pendant un « J'accepte » lent =================== */
  await bloc("P. page rouverte pendant l'envoi", async () => {
    const k = 42, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 800);
    db.retardPut = 8000;   // marge : la page rouverte et le 2e clic ont lieu bien avant la fin de l'envoi
    const tClic = await page.evaluate(() => Date.now());
    await page.click("#sante-oui"); await attendre(page, 300);
    await aller(page, "#/mensurations", 700);   // la page quittée pendant l'envoi…
    const Cm = await lireCarte(page);
    await aller(page, "#/calculateur", 900);    // … puis rouverte, l'envoi toujours en cours
    const C1 = await lireCarte(page), pendant = { finis: db.putsFinis.length, puts: auth(db, "PUT").length };
    await page.click("#sante-oui"); await attendre(page, 400);   // « J'accepte » touché aussi sur la page rouverte, l'envoi toujours en cours
    const pendant2 = { finis: db.putsFinis.length, puts: auth(db, "PUT").length };
    const fini = await attendreQue(() => db.putsFinis.length === 1, 9000); const tFin = Date.now();
    const parti = await page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 5000 }).then(() => true).catch(() => false);
    const delai = Date.now() - tFin;
    db.retardPut = 0; await attendre(page, 1200);
    const P = auth(db, "PUT");
    const etat = await page.evaluate(() => ({ off: document.querySelectorAll("#vue [data-sante-off]").length, age: document.getElementById("age").disabled, tdee: document.getElementById("tdee").textContent.trim() })).catch(e => String(e));
    ok("« J'accepte » lent (8 s) : page quittée (Ma progression : sa carte) puis rouverte (calculateur : la carte, tant que l'envoi n'a pas abouti) ; dès que le PUT aboutit (moins de 3 s après), la page rouverte repart sans carte, champs actifs, calculateur lancé (calc_perso lu, résultat affiché) ; UN SEUL PUT exact",
      carteOk(Cm, "mensurations", "fr") && carteOk(C1, "calculateur", "fr") && pendant.finis === 0 && pendant.puts === 1 && pendant2.finis === 0 && pendant2.puts === 1 && fini && parti && delai < 3000
      && P.length === 1 && putOk(P[0], "calculateur", tClic) && typeof etat === "object" && etat.off === 0 && etat.age === false && /\d/.test(etat.tdee) && lusSante(db).some(l => /calc_perso/.test(l.outil)),
      JSON.stringify([Cm && Cm.sig, C1 && C1.sig, pendant, pendant2, fini, parti, delai, P.length, etat, lusSante(db).map(l => l.outil)]));
    /* la diète (module 02) ouverte pendant l'envoi (Sante._envoi dans outilFormation.js) : elle repart dès que le PUT aboutit */
    const k2 = 52;
    const db2 = base({ comptes: [compte(k2, { donnees: [["formation", FO({ ouvert: "m2" })]] })] });
    const { page: p2 } = await contexte(b, quiP(k2), db2);
    await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#sante-carte"); await attendre(p2, 800);
    db2.retardPut = 8000;   // marge : la formation doit s'afficher avant la fin de l'envoi
    const tClic2 = await p2.evaluate(() => Date.now());
    await p2.click("#sante-oui"); await attendre(p2, 300);
    await aller(p2, "#/formation", 1200); await p2.waitForSelector("#fo-vue .fo-diete", { timeout: 6000 }).catch(() => {});
    const Cf = await lireCarte(p2), pendantF = { finis: db2.putsFinis.length, puts: auth(db2, "PUT").length };
    const finiF = await attendreQue(() => db2.putsFinis.length === 1, 12000); const tFinF = Date.now();
    const partiF = await p2.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 5000 }).then(() => true).catch(() => false);
    const delaiF = Date.now() - tFinF;
    db2.retardPut = 0; await attendre(p2, 1000);
    const Df = await lireDiete(p2), P2 = auth(db2, "PUT");
    ok("la diète (module 02) ouverte pendant un « J'accepte » lent (8 s) donné sur le calculateur : sa carte tant que l'envoi n'a pas abouti ; dès que le PUT aboutit (moins de 3 s après), la diète repart sans carte, active (32 champs) ; UN SEUL PUT exact",
      carteOk(Cf, "formation", "fr") && pendantF.finis === 0 && pendantF.puts === 1 && finiF && partiF && delaiF < 3000 && !!Df && Df.actifs === 32 && Df.off === 0 && P2.length === 1 && putOk(P2[0], "calculateur", tClic2),
      JSON.stringify([Cf && Cf.sig, pendantF, finiF, partiF, delaiF, Df, P2.length]));
  });

  /* =================== Q. deux onglets du même appareil =================== */
  await bloc("Q. deux onglets", async () => {
    const k = 43, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q, donnees: [["mens", MENS1]] })] });
    const X = await contexte(b, quiP(k), db);
    const A = X.page, B = surveiller(await X.c.newPage());
    await A.goto(URL0 + "#/calculateur"); await pret(A, "#sante-carte"); await attendre(A, 800);
    await B.goto(URL0 + "#/mensurations"); await pret(B, "#sante-carte"); await attendre(B, 800);
    const CB0 = await lireCarte(B);
    const tClic = await accepter(A, 2500);   // l'accord donné dans l'onglet A
    const CA = await lireCarte(A);
    await B.click("#sante-oui"); await attendre(B, 2500);
    const CB = await lireCarte(B), P = auth(db, "PUT"), EB = await santeEtat(B);
    const eb = await B.evaluate(() => ({ off: document.querySelectorAll("#vue [data-sante-off]").length, poids: document.getElementById("k-poids").textContent.trim() })).catch(e => String(e));
    ok("deux onglets : l'accord donné dans l'onglet A (calculateur : UN PUT exact, la page repart) ; l'onglet B (Ma progression, sa carte affichée avant) : « J'accepte » → AUCUN 2e PUT, B repart sans carte (champs actifs, ses mesures lues : 70,1 kg), Sante.ok() vrai",
      carteOk(CB0, "mensurations", "fr") && !CA && P.length === 1 && putOk(P[0], "calculateur", tClic) && !CB && !!EB && EB.ok === true
      && typeof eb === "object" && eb.off === 0 && /70,1/.test(eb.poids),
      JSON.stringify([CB0 && CB0.sig, CA && CA.sig, P.length, CB && CB.sig, EB, eb]));
    /* puis un autre onglet range une session du même compte SANS l'accord (lue avant l'accord : app d'avant, réponse
       lente) : l'onglet A la reprend (événement storage) ; l'accord donné pendant la visite reste acquis (Sante._donnes) */
    const a0 = db.authUser.length;   // avant l'événement storage : aucune relecture ni PUT depuis, saisie comprise
    await B.evaluate(() => { const s = JSON.parse(localStorage.getItem("mhx_session")); ["consentement_sante", "sante_version", "sante_ecran"].forEach(c => delete s.user.user_metadata[c]); localStorage.setItem("mhx_session", JSON.stringify(s)); });
    await attendre(A, 800);
    const SA = await stockage(A), EA = await santeEtat(A), e0 = ecr(db, "calc_perso", ID).length;
    await saisirCalcul(A); await attendre(A, 2000);
    const cpA = contenuDe(db, ID, "calc_perso") || {};
    await aller(A, "#/mensurations", 1800);
    const CmA = await lireCarte(A);
    const emA = await A.evaluate(() => ({ off: document.querySelectorAll("#vue [data-sante-off]").length, poids: !!document.getElementById("e-poids") && !document.getElementById("e-poids").disabled })).catch(e => String(e));
    ok("puis une session du même compte SANS l'accord rangée par l'autre onglet (reprise par A : événement storage) : l'accord donné dans A reste acquis — Sante.ok() vrai, la saisie du calculateur enregistrée (calc_perso), Ma progression sans carte (active), aucune relecture ni PUT",
      !!SA.memoire && typeof SA.memoire === "object" && SA.memoire.prenom === "Léa" && !("consentement_sante" in SA.memoire) && !!EA && EA.ok === true && EA.a === false
      && ecr(db, "calc_perso", ID).length === e0 + 1 && cpA.age === 30 && cpA.poids === 60 && !CmA && typeof emA === "object" && emA.off === 0 && emA.poids && db.authUser.length === a0,
      JSON.stringify([SA.memoire, EA, cpA, CmA && CmA.sig, emA, auth(db, null, a0).map(x => x.m)]) + " " + resume(db));
  });

  /* =================== R. réponse du PUT sans l'accord =================== */
  await bloc("R. réponse sans l'accord", async () => {
    const k = 44;
    const db = base({ comptes: [compte(k)] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 1200);
    const S0 = await stockage(page);
    db.pannePut = "sans accord";   // 200, avec les métadonnées du compte, SANS l'accord
    await page.click("#sante-oui"); await attendre(page, 1800);
    const C = await lireCarte(page), E = await santeEtat(page), S = await stockage(page);
    const f = await forcer(page, CHAMPS_CALC); await attendre(page, 2000);
    const S2 = await stockage(page);
    ok("réponse du PUT (200) avec des user_metadata SANS l'accord : « Non enregistré : réessaie dans un instant. », la carte reste (boutons réactivés, champs inactifs), Sante.ok() faux, métadonnées de l'appareil inchangées (mémoire et session rangée) ; rien d'écrit, même avec des valeurs forcées dans les champs (aucune écriture, aucune copie en file)",
      auth(db, "PUT").length === 1 && !!C && C.sig === "section#sante-carte.panel.sante-carte" && norm(C.msg) === SANTE.fr.echec && C.ouiOff === false && C.nonOff === false && figee(C, 10)
      && !!E && E.ok === false && E.a === true && egal(S.memoire, S0.memoire) && egal(S.rangee && S.rangee.meta, S0.rangee && S0.rangee.meta)
      && f === true && saisies(db).length === 0 && !copiesSante(S2).length,
      det(C) + " " + JSON.stringify([C && C.msg, E, S.memoire, f, copiesSante(S2)]) + " " + resume(db));
  });

  /* =================== S. après l'accord : focus, page vue comptée une fois =================== */
  await bloc("S. focus et page vue", async () => {
    const lireFocus = page => page.evaluate(() => {
      const sig = e => e ? e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.getAttribute && e.getAttribute("data-v") ? "[data-v=" + e.getAttribute("data-v") + "]" : "") : null;
      const vue = document.getElementById("vue"), a = document.activeElement;
      const premier = vue && vue.querySelector("section.panel input:not([disabled]), section.panel select:not([disabled]), section.panel button:not([disabled])");
      return { actif: sig(a), premier: sig(premier), meme: !!premier && a === premier, carte: !!document.getElementById("sante-carte") };
    }).catch(e => String(e));
    const k = 45, ID = PID(k);
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q })] });
    const { page } = await contexte(b, quiP(k), db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 800);
    await accepter(page, 1500);
    await page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).catch(() => {}); await attendre(page, 800);
    const Fc = await lireFocus(page);
    ok("« J'accepte » sur le calculateur : la page repart sans carte et le focus est sur son premier champ actif (le bouton « Homme », ou le 1er champ de saisie) : le clavier et le lecteur d'écran ne perdent pas leur place",
      typeof Fc === "object" && !Fc.carte && Fc.meme && (Fc.actif === "button[data-v=H]" || /^input/.test(Fc.actif || "")), JSON.stringify(Fc));
    /* une ouverture simple du calculateur (prospect déjà d'accord), pour comparer le compteur de pages vues */
    const k2 = 46, ID2 = PID(k2);
    const db2 = base({ comptes: [compte(k2, { meta: META_V55(), intake: CHIFFRES_Q })] });
    const { page: p2 } = await contexte(b, quiP(k2, META_V55()), db2);
    await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#tdee"); await attendre(p2, 800);
    await page.clock.fastForward(61000); await p2.clock.fastForward(61000);   // l'envoi du compteur (une minute)
    await attendre(page, 2500);
    const vues = (d, id) => { const e = ecr(d, "activite", id); const c = e.length ? e[e.length - 1].contenu : null; return c && c.pages ? (c.pages.calculateur === undefined ? null : c.pages.calculateur) : null; };
    const v1 = vues(db, ID), v2 = vues(db2, ID2);
    ok("la page vue « calculateur » comptée UNE fois dans la clé activite (ouverture avec la carte, puis page reconstruite après l'accord), comme une ouverture simple du calculateur (prospect déjà d'accord : 1)",
      v2 === 1 && v1 === v2, JSON.stringify([v1, v2, ecr(db, "activite", ID).map(e => e.contenu.pages), ecr(db2, "activite", ID2).map(e => e.contenu.pages)]));
    const k3 = 47;
    const db3 = base({ comptes: [compte(k3, { donnees: [["formation", FO({ ouvert: "m2" })]] })] });
    const { page: p3 } = await contexte(b, quiP(k3), db3);
    await p3.goto(URL0 + "#/formation"); await pret(p3, "#sante-carte"); await attendre(p3, 800);
    await accepter(p3, 2500);
    const f3 = await p3.evaluate(() => ({ actif: document.activeElement ? (document.activeElement.id || document.activeElement.tagName.toLowerCase()) : null,
      sem: !!document.getElementById("fo-sem") && !document.getElementById("fo-sem").disabled, carte: !!document.getElementById("sante-carte") })).catch(e => String(e));
    ok("« J'accepte » dans la diète : la diète repart sans carte et le focus est sur le sélecteur de semaine #fo-sem (actif)",
      typeof f3 === "object" && f3.actif === "fo-sem" && f3.sem && !f3.carte, JSON.stringify(f3));
  });

  /* =================== T. style de la carte : titre dans la diète, lien doré =================== */
  await bloc("T. style de la carte", async () => {
    const style = page => page.evaluate(() => {
      const c = document.getElementById("sante-carte"); if (!c) return null;
      const jeton = v => { const s = document.createElement("span"); s.style.color = "var(" + v + ")"; document.body.appendChild(s); const x = getComputedStyle(s).color; s.remove(); return x; };
      const h = c.querySelector("h2, h4"), a = c.querySelector("p.sante-lien a"), H = h ? getComputedStyle(h) : null, A = a ? getComputedStyle(a) : null;
      return { ecran: c.getAttribute("data-sante-ecran"), theme: document.documentElement.getAttribute("data-theme"), h: h ? h.tagName.toLowerCase() : null,
        taille: H && H.fontSize, casse: H && H.textTransform, espacement: H && H.letterSpacing, lien: A && A.color, accent: jeton("--accent"), souligne: !!A && /underline/.test(A.textDecorationLine || A.textDecoration || "") };
    }).catch(e => String(e));
    const r = [];
    const mesurer = async (k, theme, h) => {
      const db = base({ comptes: [compte(k, { donnees: [["formation", FO({ ouvert: "m2" })]] })] });
      const { page } = await contexte(b, quiP(k), db, { theme });
      await page.goto(URL0 + h); await pret(page, "#sante-carte"); await attendre(page, 800);
      /* le contraste du lien sur son fond réel (même calcul que le bloc L) */
      const st = await style(page), A = await affichage(page), liens = A ? A.textes.filter(x => x.qui === "a") : [];
      r.push(st && typeof st === "object" ? Object.assign(st, { ratio: liens.length === 1 ? liens[0].ratio : null, nLiens: liens.length }) : st);
      const cx = page.context(), i = ouverts.indexOf(cx); if (i > -1) ouverts.splice(i, 1); await cx.close().catch(() => {});
    };
    await mesurer(48, "", "#/formation"); await mesurer(49, "light", "#/formation");
    await mesurer(50, "", "#/calculateur"); await mesurer(51, "light", "#/calculateur");
    const bon = x => !!x && typeof x === "object";
    ok("diète (module 02), thèmes sombre et clair : le titre h4 de la carte en 15 px, sans capitales ni espacement de .fo-outil h4 (text-transform none, letter-spacing normal)",
      r.length === 4 && bon(r[0]) && bon(r[1]) && r[0].theme === null && r[1].theme === "light" && [r[0], r[1]].every(x => x.ecran === "formation" && x.h === "h4" && x.taille === "15px" && x.casse === "none" && x.espacement === "normal"),
      JSON.stringify(r.slice(0, 2)));
    /* le doré du lien : --accent en thème sombre ; en thème CLAIR #7f5f19, plus foncé que --accent (contrat, 00df998 : --accent
       n'y donne que 4,29:1 sur la carte et 3,97:1 dans la diète) ; lisible (4,5:1) partout, souligné partout */
    const DORE_CLAIR = "rgb(127, 95, 25)";
    ok("lien « En savoir plus : politique de confidentialité » doré et souligné, diète et calculateur : thème sombre → la couleur --accent du thème ; thème CLAIR → #7f5f19 (un doré plus foncé que --accent) ; contraste du lien sur son fond d'au moins 4,5:1 dans les 4 cas",
      r.length === 4 && r.every(bon) && egal(r.map(x => [x.ecran, x.theme]), [["formation", null], ["formation", "light"], ["calculateur", null], ["calculateur", "light"]])
      && r.every(x => !!x.lien && x.souligne && x.nLiens === 1 && typeof x.ratio === "number" && x.ratio >= CONTRASTE)
      && [r[0], r[2]].every(x => x.lien === x.accent) && [r[1], r[3]].every(x => x.lien === DORE_CLAIR && x.lien !== x.accent) && r[0].accent !== r[1].accent,
      JSON.stringify(r.map(x => bon(x) ? [x.ecran, x.theme, x.lien, x.accent, x.souligne, x.ratio, x.nLiens] : x)));
  });

  /* =================== U. copie retenue ET page ouverte pendant un « J'accepte » lent (relecture du code, 00df998) ===================
     deux pages repartent ensemble quand le PUT aboutit (le calculateur où « J'accepte » a été touché, Ma progression ouverte
     pendant l'envoi) : la 2e ne relit jamais mens avant que la reprise de la 1re ait envoyé la copie retenue (Sante.apres
     attend une reprise déjà en cours, Store._reprend) */
  await bloc("U. copie retenue et page ouverte pendant l'envoi", async () => {
    const k = 54, ID = PID(k);
    const M1 = { sem: 1, date: "2026-01-12", poids: 79, vals: {} }, M2 = { sem: 2, date: "2026-01-19", poids: 77, vals: {} };
    const MENS_BASE = { dstart: "2026-01-05", pstart: 80, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [M1] };
    const MENS_COPIE = Object.assign(clone(MENS_BASE), { mesures: [clone(M1), clone(M2)] });
    const db = base({ comptes: [compte(k, { intake: CHIFFRES_Q, donnees: [["mens", MENS_BASE, avant(3 * H)]] })] });
    const X = await contexte(b, quiP(k), db), page = X.page;
    /* ancien client repassé prospect : la pesée de la semaine 2 (77 kg) faite hors ligne, gardée sur l'appareil, plus récente que la base */
    const tCopie = avant(20 * MIN), CLE = "mhx_attente|" + ID + "|mens";
    await page.addInitScript(([c, id, t, v]) => {
      if (location.hostname !== "localhost" || localStorage.getItem("__copie71")) return;
      localStorage.setItem("__copie71", "1"); localStorage.setItem(c, JSON.stringify({ a: id, t, v }));
    }, [CLE, ID, tCopie, MENS_COPIE]);
    const aff = p => p.evaluate(() => ({ sem: document.getElementById("k-sem").textContent.trim(), lignes: document.querySelectorAll("#tbody tr").length, poids: document.getElementById("k-poids").textContent.trim() })).catch(e => String(e));
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#sante-carte"); await attendre(page, 1000);
    const S0 = await stockage(page), C0 = await lireCarte(page), e0 = ecr(db, "mens").length, n0 = db.n;
    db.retardPut = 5000;   // « J'accepte » lent : le PUT aboutit 5 s après le clic (Ma progression s'ouvre bien avant)
    const tClic = await page.evaluate(() => Date.now());
    await page.click("#sante-oui"); await attendre(page, 300);
    await aller(page, "#/mensurations", 800);   // Ma progression ouverte pendant l'envoi (sa carte)
    const C1 = await lireCarte(page), pendant = { finis: db.putsFinis.length, puts: auth(db, "PUT").length, mens: ecr(db, "mens").length, lus: lusSante(db).length };
    const fini = await attendreQue(() => db.putsFinis.length === 1, 8000);
    const parti = await page.waitForFunction(() => !document.getElementById("sante-carte"), null, { timeout: 8000 }).then(() => true).catch(() => false);
    await attendre(page, 2000); db.retardPut = 0;
    /* les lectures du CONTENU de mens (Ma progression) ; la lecture « maj_le » est celle de la reprise (comparaison des dates) */
    const Em = ecr(db, "mens", ID), lus = db.lectures.filter(l => l.n > n0 && /\bmens\b/.test(l.outil) && l.select !== "maj_le");
    const A1 = await aff(page), S1 = await stockage(page), P = auth(db, "PUT");
    ok("copie mhx_attente|…|mens retenue (base : 79 kg ; copie hors ligne plus récente : 79 et 77 kg), « J'accepte » lent (5 s) sur le calculateur, Ma progression ouverte pendant l'envoi (sa carte) : quand le PUT aboutit, les deux pages repartent et la copie est envoyée (mens écrit avec 79 et 77, à l'instant de la copie) AVANT toute lecture de mens par Ma progression ; la page montre 2 mesures (dernière 77), copie retirée de l'appareil ; UN SEUL PUT exact",
      carteOk(C0, "calculateur", "fr") && S0.cles.includes("local:" + CLE) && e0 === 0 && carteOk(C1, "mensurations", "fr")
      && pendant.finis === 0 && pendant.puts === 1 && pendant.mens === 0 && pendant.lus === 0 && fini && parti
      && Em.length === 1 && egal(Em[0].contenu.mesures.map(x => x.poids), [79, 77]) && Em[0].maj_le === tCopie && lus.length >= 1 && lus.every(l => l.n > Em[0].n)
      && typeof A1 === "object" && A1.sem === "2" && A1.lignes === 2 && /^77/.test(A1.poids) && !S1.cles.includes("local:" + CLE) && P.length === 1 && putOk(P[0], "calculateur", tClic),
      JSON.stringify([C0 && C0.sig, C1 && C1.sig, e0, pendant, fini, parti, Em.map(e => [e.n, e.maj_le, e.contenu.mesures.map(x => x.poids)]), lus.map(l => [l.n, l.outil, l.select]), A1, S1.cles.filter(c => /attente/.test(c)), P.length]));
    await page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; });
    await page.fill("#e-sem", "3"); await page.fill("#e-poids", "76"); await page.click("#add"); await attendre(page, 1800);
    const mf = contenuDe(db, ID, "mens") || {}, A2 = await aff(page);
    ok("puis une nouvelle mesure sur cette page (semaine 3, 76 kg) : mens écrit avec les 3 mesures (79, 77, 76 : la pesée hors ligne n'est pas perdue), la page en montre 3",
      Array.isArray(mf.mesures) && egal(mf.mesures.map(x => x.poids), [79, 77, 76]) && ecr(db, "mens", ID).length === 2 && typeof A2 === "object" && A2.sem === "3" && A2.lignes === 3,
      JSON.stringify([mf.mesures, A2]));
  });

  /* =================== V. reprise lente : l'outil repart en 4 s au plus (contrat cdc9e68 et 00df998) =================== */
  await bloc("V. reprise lente", async () => {
    const M1 = { sem: 1, date: "2026-01-12", poids: 79, vals: {} }, M2 = { sem: 2, date: "2026-01-19", poids: 77, vals: {} };
    const MENS_BASE = { dstart: "2026-01-05", pstart: 80, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [M1] };
    const MENS_COPIE = Object.assign(clone(MENS_BASE), { mesures: [clone(M1), clone(M2)] });
    const tCopie = avant(20 * MIN);
    const poser = (page, cle, id, v) => page.addInitScript(([c, id, t, v]) => {
      if (location.hostname !== "localhost" || localStorage.getItem("__copie71")) return;
      localStorage.setItem("__copie71", "1"); localStorage.setItem(c, JSON.stringify({ a: id, t, v }));
    }, [cle, id, tCopie, v]);
    const repartie = (page, champ, ms) => page.waitForFunction(ch => !document.getElementById("sante-carte") && !document.querySelector("#vue [data-sante-off]")
      && !!document.getElementById(ch) && !document.getElementById(ch).disabled, champ, { timeout: ms }).then(() => true).catch(() => false);
    const majLe = (db, outil) => db.lectures.filter(l => l.outil === "eq." + outil && l.select === "maj_le").length;
    /* (a) la reprise LANCÉE PAR L'ACCORD est lente : copie mhx_attente|…|mens retenue, sa lecture maj_le répond en 12 s */
    const k = 55, ID = PID(k), CLE = "mhx_attente|" + ID + "|mens";
    const db = base({ comptes: [compte(k, { donnees: [["mens", MENS_BASE, avant(3 * H)]] })] });
    const { page } = await contexte(b, quiP(k), db);
    await poser(page, CLE, ID, MENS_COPIE);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#sante-carte"); await attendre(page, 1000);
    db.retardMajLe = { outil: "mens", ms: 12000 };
    const t0 = Date.now(); await page.click("#sante-oui");
    const parti = await repartie(page, "e-poids", 11000), delai = Date.now() - t0;
    const pendant = { majLe: majLe(db, "mens"), finies: db.majLeLents.length, mens: ecr(db, "mens").length };
    const envoyee = await attendreQue(() => ecr(db, "mens", ID).length === 1, 14000); await attendre(page, 800);
    const Em = ecr(db, "mens", ID), S1 = await stockage(page);
    ok("reprise lancée par l'accord et lente (copie mhx_attente|…|mens retenue, sa lecture maj_le répond en 12 s) : après « J'accepte », Ma progression repart sans carte, champs actifs, en 4 s au plus (moins de 7 s après le clic) sans attendre la fin de la reprise ; puis la reprise aboutit et envoie la copie (mens écrit avec 79 et 77, à l'instant de la copie ; copie retirée) ; UN PUT",
      parti && delai < 7000 && pendant.majLe === 1 && pendant.finies === 0 && pendant.mens === 0 && envoyee && db.majLeLents.length === 1
      && Em.length === 1 && egal(Em[0].contenu.mesures.map(x => x.poids), [79, 77]) && Em[0].maj_le === tCopie && !S1.cles.includes("local:" + CLE) && auth(db, "PUT").length === 1,
      JSON.stringify([parti, delai, pendant, envoyee, db.majLeLents.length, Em.map(e => [e.n, e.maj_le, e.contenu.mesures.map(x => x.poids)]), S1.cles.filter(c => /attente/.test(c)), auth(db).map(x => x.m)]));
    /* (b) une reprise DÉJÀ EN COURS (lancée au démarrage pour une copie mhx_attente|…|intake, lecture maj_le de 20 s) :
       Sante.apres l'attend (Store._reprend, 00df998), dans la même limite de 4 s */
    const k2 = 56, ID2 = PID(k2);
    const db2 = base({ comptes: [compte(k2, { intake: CHIFFRES_Q })] });
    db2.retardMajLe = { outil: "intake", ms: 20000 };
    const { page: p2 } = await contexte(b, quiP(k2), db2);
    await poser(p2, "mhx_attente|" + ID2 + "|intake", ID2, Object.assign(AVEC_CHOIX(k2), CHIFFRES_Q));
    await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#sante-carte"); await attendre(p2, 800);
    const avantClic = { majLe: majLe(db2, "intake"), finies: db2.majLeLents.length, reprend: await p2.evaluate(() => Store._reprend === true).catch(e => String(e)) };
    const t2 = Date.now(); await p2.click("#sante-oui");
    const parti2 = await repartie(p2, "age", 16000), delai2 = Date.now() - t2;
    const apres2 = { finies: db2.majLeLents.length };
    ok("reprise DÉJÀ en cours et lente (lancée au démarrage : copie mhx_attente|…|intake, lecture maj_le de 20 s) : « J'accepte » sur le calculateur → la page repart sans carte, champs actifs, en 4 s au plus (moins de 7 s après le clic), la reprise toujours en cours ; UN PUT",
      avantClic.majLe === 1 && avantClic.finies === 0 && avantClic.reprend === true && parti2 && delai2 < 7000 && apres2.finies === 0 && auth(db2, "PUT").length === 1,
      JSON.stringify([avantClic, parti2, delai2, apres2, auth(db2).map(x => x.m)]));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com)$/.test(h));
    ok("aucune erreur de console ni erreur JS ni dialogue natif pendant la suite (" + VUES_CARTE + " pages ouvertes avec la carte, au moins 20 attendues : relu après les autres blocs, lancé seul il échoue) ; aucune requête vers un autre hôte que la page et le faux Supabase (polices et vignettes bloquées)",
      ERREURS.length === 0 && VUES_CARTE >= 20 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " cartes=" + VUES_CARTE + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
