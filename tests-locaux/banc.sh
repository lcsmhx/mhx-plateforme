#!/usr/bin/env bash
# Banc complet de la plateforme MHX : toutes les suites, l'une après l'autre (elles écoutent sur des ports fixes).
# Supabase est simulé dans chaque suite ; aucune ne doit joindre la vraie base (voir README, « Règle d'or »).
# Utilisé par GitHub Actions avant chaque publication, et en local :
#   bash tests-locaux/banc.sh [dossier des journaux]          (le dossier se lit depuis l'endroit où l'on tape la commande)
# En local sans le Chromium de Playwright : BANC_CHROME=1 bash tests-locaux/banc.sh   (Google Chrome de la machine)
# Code de sortie 1 au moindre échec : code de sortie non nul, une ligne ✗, un bloc interrompu, un nombre de ✓ différent
# du nombre attendu (une vérification sautée sans le dire, ou ajoutée sans relever le compte), une suite inconnue ou oubliée,
# une erreur de console, une écriture ou une page manquante pendant rig.js,
# un fichier js/ qui utilise au chargement un nom d'un fichier chargé plus tard (niveau-haut.js, 52.1).
# Le banc teste index.html tel qu'il est sur le disque : il ne conclut « vert » que si ce disque est exactement un commit
# (aucun fichier suivi modifié) du début à la fin. Pour un essai sur des modifications non commitées : BANC_LIBRE=1.
# Découpage (GitHub Actions, jobs en parallèle) : BANC_PARTIE=1 … 10 ne lance que les suites de cette partie (voir partie()) ;
# toute suite doit appartenir à une partie. Sans BANC_PARTIE : tout le banc.
# Deux bancs en même temps sur une machine (copies du dépôt différentes) : BANC_VERROUS=<dossier> empêche la même suite
# de tourner deux fois à la fois (chaque suite a son propre port) ; deux suites différentes peuvent tourner ensemble.
set -u
APPEL="$PWD"
cd "$(dirname "$0")" || exit 1
ICI="$PWD"
if [ -n "${1:-}" ]; then case "$1" in /*) OUT="$1";; *) OUT="$APPEL/$1";; esac; else OUT="$ICI/captures/banc"; fi
mkdir -p "$OUT" || exit 1
OUT="$(cd "$OUT" && pwd)"
if [ "${BANC_CHROME:-}" = 1 ]; then export NODE_OPTIONS="--require $ICI/chrome-systeme.js"; fi

TETE=$(git -C .. rev-parse --short HEAD 2>/dev/null || echo "?")
etat_disque() { git -C .. status --porcelain --untracked-files=no 2>/dev/null; }
DISQUE_DEBUT=$(etat_disque)

# Suites du banc, et suites volontairement hors banc (verif44 à verif47 testent le Challenge 7 jours supprimé).
SUITES="flux verif34 verif35 verif36 verif37 verif38 verif-xss verif39 verif40 verif41 verif42 verif43 verif48 verif50 verif51 verif52 verif53 verif54 verif55 verif56 verif57 verif58 verif60 verif61 verif62 verif63 verif64 verif65 verif66"
# v53 (chantier 4) : verif49 (score sur 100 et température NOUVEAU / CHAUD / TIÈDE / FROID, journal des emails) sort du banc ;
# ses blocs relances, issues, conflits, verrou et passage client sont repris dans verif58 (bloc F).
HORS_BANC="verif44 verif45 verif46 verif47 verif49"

# Nombre EXACT de ✓ attendus par suite (et de pages pour rig).
# À relever dans le même commit que la suite qui gagne ou perd des vérifications.
# v52 (lot C, 3 questions et page bilan) : verif48 41 → 42, verif51 123 → 102 (ancien écran « résultat », garde 18 ans et
# bornes du questionnaire retirés), verif53 137 → 132 (purge d'un âge mineur retirée), verif56 105 (nouvelle suite).
# v52 (lot D, gratuit pour toujours, calculateur du prospect) : verif40 81 → 64, verif50 60 → 55, verif51 102 → 91
# (« Jour n/7 », jours restants, verrou de la Speed Formation au jour 8 et mode test : fonction supprimée), verif56 105 → 187
# (blocs I à O du lot D), rig 78 → 84 pages (calculateur, Ma progression et « Mon journal » du prospect).
# v52 (lot E, pages verrouillées avec un exemple) : verif56 + 54 (blocs E1) ; verif40, 50, 51 inchangées (textes des pages
# verrouillées adaptés, aucune vérification ajoutée ni retirée). v52 : lots D + E : verif56 187 → 241 ; verif40 64, verif50 57,
# verif51 91 (journal du lot D : son exemple et l'appel, sans vérification de plus).
# v52 (lot G, côté coach) : verif55 143 → 165 (blocs G1 à G4 : fiche, page Prospects, CSV).
# v53 (nettoyage) : fonction des emails de suivi v51 retirée (dossier supabase/functions/emails-prospects, sa migration,
# desinscription.html) : l'étape « fonction » du banc est supprimée, verif53 132 → 126 (bloc M, page de désinscription).
# Mode test « jour n » de la Découverte retiré : verif39 51 → 50, verif49 130 → 128 (bloc « C. mode test de l'appareil »),
# verif51 91 → 92 (+1 : l'ancienne adresse #/decouverte-jour/8 mène à #/decouverte, l'ancien drapeau est effacé).
# v53 (chantier 3, feedback du dimanche) : verif57 152 (nouvelle suite) ; verif36 et verif38 inchangées (samedi : texte d'avant).
# v53 (lot D-clients : calculateur et « Mon journal » du client, « Ses séances » du coach) : verif60 60 (nouvelle suite),
# rig 84 → 90 pages (calculateur et journal du client, journal dans la fiche ; téléphone et ordi) ; verif42, verif55,
# verif56 et verif-xss adaptées sans vérification ajoutée ni retirée.
# v53 (chantier 4, côté coach sans score ni température, « Bilan réservé » coché par le coach, visites des clients, liste
# newsletter, compteur) : verif58 (nouvelle suite, partie 5) ; verif49 hors banc ; vérifications devenues fausses retirées
# (tuiles d'avant, cartes « Qui nécessite ton attention », score, température, journal des emails, panneau des Nouveautés
# du tableau de bord) : verif37 15 → 12, verif38 67 → 66, verif39 50 → 47, verif43 34 → 27, verif51 92 → 89,
# verif52 186 → 136, verif53 126 → 114, verif54 64 → 60, verif55 165 → 164 ; verif42, verif56, verif57 inchangées (adaptées).
# v54 (ouverture de l'inscription, décision de Lucas : inscription_libre: true dans js/config.js) : verif39, 40, 50, 52, 53
# et rig forcent la valeur voulue dans les deux sens (fermée par défaut, comme avant) ; verif55 ouvre depuis la valeur du
# fichier ; verif52 vérifie une seule valeur (true ou false) au lieu de « false » : le banc reste vert si Lucas la referme.
# Aucune vérification ajoutée ni retirée : nombres inchangés.
# v55 (relecture de la v54) : les suites qui testent l'inscription (rig, verif39, 40, 50, 52, 53, 55 ; hors banc verif44, 47)
# forcent inscription_libre par forcerInscription (fichiers.js), fermée par défaut et ouverte le temps de leurs blocs
# d'inscription (verif55 aussi, qui servait jusque-là la valeur du fichier) ; les autres suites servent la valeur du fichier ;
# case santé en version 2026-09-28b pour les nouvelles inscriptions (verif39, verif55 adaptées) ; verif39 47 → 48 (les deux
# liens de la connexion centrés à 320 / 375 / 390 px) ; verif52 136 → 137 (inscription_libre: true n'est accepté que si le
# commit qui l'a passé à true contient « ouverture de l'inscription » dans son message ; false passe toujours).
# v56 (compteur de connexions côté coach) : verif61 50 (nouvelle suite, partie 6) ; l'appel noter_connexion (au démarrage de
# chaque client et prospect, décision de Lucas du 29/09) n'est pas une écriture de l'app dans les données : les simulations
# de flux, verif35 à 43, verif-xss, 48, 50 à 58, 60 et rig le mettent à part (il est testé dans verif61) ; verif52 compare
# Mes clients à main sans les 2 nouvelles colonnes ; nombres inchangés.
# v57 (retouches de Lucas du 29/09 : colonne du nom fixe, Connexions après Visite, date courte, page d'arrivée après la
# connexion) : verif62 32 (nouvelle suite, partie 8) ; verif61 adaptée (ordre des colonnes, date courte), nombre inchangé.
# v58 (cartes de Mes clients sur téléphone : « 7/10 » d'un seul tenant, pastilles des prospects dans la carte) : verif62 32 → 37.
# v59 (interrupteurs forcés sur « test » pour toutes les suites par fichiers.js, simulation « tous » / « off » sur les branches
# v2/simu-tous-* et v2/simu-off-*) : verif55 164 → 167 (bloc A0 + 1 vérification des conditions : contenus chargés depuis
# Google) ; verif57, 58, 61 : garde « une valeur connue » au lieu de « test », nombres inchangés. Q13 (checkins relu avant
# chaque écriture, vraies saisies) : verif63 96 (nouvelle suite, partie 3 ; après les relectures : session perdue, copie d'une saisie jamais envoyée,
# textes du 😞 hors ligne, « Annuler » et déconnexion pendant l'envoi, file, reprise au démarrage). « À traiter » complet : verif64 92
# (nouvelle suite, partie 2 ; horloge posée à midi). verif52 J : écrans comparés avec les interrupteurs du fichier testé. Barre du haut à 320 px : verif62 37 → 50. Remarques de la v52 : verif56 247 → 259, verif60 60 → 71
# (verif60 passe de la partie 10 à la partie 9).
# v60 (brief V2, lot 1 : questionnaire à toucher, textes de la formation, cartes « Commence ici » / « Ce qui t'attend ») :
# verif65 70 (nouvelle suite, partie 7 : les 3 questions de bout en bout) ; verif66 55 (nouvelle suite, partie 4 : textes J
# et cartes I) ; verif39, 40, 48, 51, 52, 53, 54, 56, 60 adaptées (remplissage par touchers, textes), nombres inchangés.
attendu() {
  case "$1" in
    flux) echo 19;; verif34) echo 13;; verif35) echo 14;; verif36) echo 13;; verif37) echo 12;; verif38) echo 66;;
    verif-xss) echo 5;; verif39) echo 48;; verif40) echo 64;; verif41) echo 25;; verif42) echo 20;; verif43) echo 27;;
    verif48) echo 42;; verif50) echo 57;; verif51) echo 89;; verif52) echo 137;; verif53) echo 114;;
    verif54) echo 60;; verif55) echo 167;; verif56) echo 259;; verif57) echo 152;; verif58) echo 126;; verif60) echo 71;; verif61) echo 50;; verif62) echo 50;; verif63) echo 96;; verif64) echo 92;; verif65) echo 70;; verif66) echo 55;; rig) echo 90;; *) echo "";;
  esac
}
# Partie de chaque suite pour les jobs parallèles de GitHub Actions (10 parties, durées équilibrées, 4 à 5 minutes chacune).
partie() {
  case "$1" in
    verif52) echo 1;;
    verif53|verif64) echo 2;;
    verif51|verif34|verif35|verif63) echo 3;;
    verif38|verif36|verif37|verif66) echo 4;;
    verif48|verif43|flux|verif58) echo 5;;
    verif41|verif57|verif61) echo 6;;
    verif42|verif50|verif65) echo 7;;
    verif40|verif54|verif62) echo 8;;
    verif55|verif39|verif60) echo 9;;
    verif56|rig|verif-xss|niveau) echo 10;;
    *) echo "";;
  esac
}
dans_partie() { [ -z "${BANC_PARTIE:-}" ] || [ "$(partie "$1")" = "$BANC_PARTIE" ]; }
TENU=""   # verrou de suite tenu par CE banc (on ne rend jamais celui d'un autre)
prendre() { [ -z "${BANC_VERROUS:-}" ] && return 0; mkdir -p "$BANC_VERROUS"; until mkdir "$BANC_VERROUS/$1" 2>/dev/null; do sleep 3; done; TENU="$1"; }
rendre() { [ -n "${BANC_VERROUS:-}" ] && [ "$TENU" = "$1" ] && rmdir "$BANC_VERROUS/$1" 2>/dev/null; TENU=""; return 0; }
trap '[ -n "$TENU" ] && rendre "$TENU"' EXIT

nombre() { case "$1" in ''|*[!0-9]*) return 1;; esac; return 0; }

echecs=0
resume=""
note() { resume="$resume$1"$'\n'; echo "$1"; }
echec() { echecs=$((echecs + 1)); note "ÉCHEC  $1"; }

# v59 : interrupteurs des nouveautés simulés (preuve du vert avec « tous » ou « off » sans jamais pousser ces valeurs) :
# BANC_SIMULER_NOUVEAUTES, sinon d'après la branche (GITHUB_REF : v2/simu-tous-* → « tous », v2/simu-off-* → « off »).
# Une seule règle, lue dans fichiers.js (simulation()) ; jamais sur main (refus, et fichiers.js refuse aussi de se charger).
SIMULE=$(node -e 'try { process.stdout.write(require("./fichiers.js").simulation()); } catch (e) { process.stdout.write("REFUS " + e.message); }' 2>/dev/null)
case "$SIMULE" in "REFUS "*) echec "${SIMULE#REFUS }"; echo "$echecs échec(s) : rien ne doit être publié."; exit 1;; esac

# Toute suite verif*.js du dossier est soit au banc, soit explicitement hors banc.
for f in verif*.js; do
  s="${f%.js}"
  case " $SUITES $HORS_BANC " in *" $s "*) ;; *) echec "$s : suite ni au banc ni dans HORS_BANC (banc.sh)";; esac
done

for s in $SUITES rig niveau; do
  if [ -z "$(partie "$s")" ]; then echec "$s : aucune partie dans partie() (banc.sh)"; fi
done
case "${BANC_PARTIE:-}" in ''|[1-9]|10) ;; *) echec "BANC_PARTIE=${BANC_PARTIE} : partie inconnue";; esac

for s in $SUITES; do
  dans_partie "$s" || continue
  min=$(attendu "$s")
  if ! nombre "$min"; then echec "$s : aucun nombre attendu dans attendu() (banc.sh)"; continue; fi
  prendre "$s"
  debut=$(date +%s)
  if [ "$s" = flux ]; then node flux.js ../index.html "$OUT/captures-flux" > "$OUT/$s.log" 2>&1
  else node "$s.js" ../index.html > "$OUT/$s.log" 2>&1; fi
  rc=$?
  ok=$(grep -c '✓' "$OUT/$s.log"); ko=$(grep -c '✗' "$OUT/$s.log")
  interrompu=$(grep -c 'BLOC INTERROMPU' "$OUT/$s.log")
  duree=$(( $(date +%s) - debut ))
  if ! nombre "$ok" || ! nombre "$ko" || ! nombre "$interrompu"; then
    echec "$s : journal illisible (${duree} s)"
  elif [ "$rc" -ne 0 ] || [ "$ko" -gt 0 ] || [ "$interrompu" -gt 0 ] || [ "$ok" -ne "$min" ]; then
    echec "$s : $ok ✓ ($min attendus), $ko ✗, code $rc, ${duree} s"
    grep -E '✗|BLOC INTERROMPU|Error' "$OUT/$s.log" | head -20
  else
    note "ok     $s : $ok ✓, ${duree} s"
  fi
  rendre "$s"
done

# Parcours de toutes les pages (client, coach, fiche, connexion ; téléphone et ordi) : 0 erreur, 0 écriture, toutes les pages.
if dans_partie rig; then
prendre rig
debut=$(date +%s)
rm -f "$OUT/captures-rig/_rapport.json"
node rig.js --html ../index.html --out "$OUT/captures-rig" > "$OUT/rig.log" 2>&1
rc=$?
bilan=$(node -e '
  let r; try { r = require(process.argv[1]); } catch (e) { console.log("KO rapport absent"); process.exit(0); }
  const e = r.erreurs || [], w = r.ecritures_simulees || [], n = Number(r.captures), att = Number(process.argv[2]);
  const bon = !e.length && !w.length && n === att;
  console.log((bon ? "OK" : "KO") + " " + n + " pages (" + att + " attendues), " + e.length + " erreur(s), " + w.length + " écriture(s)");
  e.concat(w).slice(0, 20).forEach(x => console.log("   " + x));
' "$OUT/captures-rig/_rapport.json" "$(attendu rig)" 2>&1)
duree=$(( $(date +%s) - debut ))
if [ "$rc" -ne 0 ] || [ "${bilan:0:2}" != OK ]; then echec "rig : code $rc, ${duree} s — $bilan"
else note "ok     rig : ${bilan:3}, ${duree} s"; fi
rendre rig
fi

# 52.1 : ordre de chargement des fichiers js/ (sans navigateur) : aucun code exécuté au chargement d'un fichier n'utilise
# un nom déclaré dans un fichier chargé plus tard, chaque fichier se compile seul (voir niveau-haut.js).
if dans_partie niveau; then
debut=$(date +%s)
node niveau-haut.js ../index.html > "$OUT/niveau-haut.log" 2>&1
rc=$?
duree=$(( $(date +%s) - debut ))
if [ "$rc" -ne 0 ]; then echec "niveau-haut : code $rc, ${duree} s"; grep -E 'PROBLÈME|Error' "$OUT/niveau-haut.log" | head -20
else note "ok     niveau-haut : $(tail -1 "$OUT/niveau-haut.log"), ${duree} s"; fi
fi

# Le disque doit être resté exactement le commit testé.
DISQUE_FIN=$(etat_disque)
TETE_FIN=$(git -C .. rev-parse --short HEAD 2>/dev/null || echo "?")
if [ "${BANC_LIBRE:-}" != 1 ]; then
  if [ -n "$DISQUE_DEBUT" ] || [ -n "$DISQUE_FIN" ]; then echec "fichiers suivis modifiés (non commités) : le résultat ne vaut pour aucun commit (BANC_LIBRE=1 pour un essai)"; fi
  if [ "$TETE" != "$TETE_FIN" ]; then echec "le commit a changé pendant le banc ($TETE → $TETE_FIN)"; fi
fi

echo
echo "===== Bilan du banc — commit $TETE${BANC_PARTIE:+ — partie $BANC_PARTIE/${BANC_PARTIES:-10}}${SIMULE:+ — fichier simulé : interrupteurs sur « $SIMULE »} ====="
printf "%s" "$resume"
if [ "$echecs" -gt 0 ]; then echo "$echecs échec(s) : rien ne doit être publié."; exit 1; fi
echo "Tout est vert (commit $TETE)."
