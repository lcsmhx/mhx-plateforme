#!/usr/bin/env bash
# Banc complet de la plateforme MHX : toutes les suites, l'une après l'autre (elles écoutent sur des ports fixes).
# Supabase est simulé dans chaque suite ; aucune ne doit joindre la vraie base (voir README, « Règle d'or »).
# Utilisé par GitHub Actions avant chaque publication, et en local :
#   bash tests-locaux/banc.sh [dossier des journaux]          (le dossier se lit depuis l'endroit où l'on tape la commande)
# En local sans le Chromium de Playwright : BANC_CHROME=1 bash tests-locaux/banc.sh   (Google Chrome de la machine)
# Code de sortie 1 au moindre échec : code de sortie non nul, une ligne ✗, un bloc interrompu, un nombre de ✓ différent
# du nombre attendu (une vérification sautée sans le dire, ou ajoutée sans relever le compte), une suite inconnue ou oubliée,
# une erreur de console, une écriture ou une page manquante pendant rig.js, un test de la fonction emails raté.
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
SUITES="flux verif34 verif35 verif36 verif37 verif38 verif-xss verif39 verif40 verif41 verif42 verif43 verif48 verif49 verif50 verif51 verif52 verif53 verif54"
HORS_BANC="verif44 verif45 verif46 verif47"

# Nombre EXACT de ✓ attendus par suite (et de pages pour rig, de vérifications pour la fonction emails).
# À relever dans le même commit que la suite qui gagne ou perd des vérifications.
attendu() {
  case "$1" in
    flux) echo 19;; verif34) echo 13;; verif35) echo 14;; verif36) echo 13;; verif37) echo 15;; verif38) echo 67;;
    verif-xss) echo 5;; verif39) echo 43;; verif40) echo 81;; verif41) echo 25;; verif42) echo 20;; verif43) echo 34;;
    verif48) echo 41;; verif49) echo 130;; verif50) echo 60;; verif51) echo 123;; verif52) echo 186;; verif53) echo 137;;
    verif54) echo 64;; rig) echo 78;; fonction) echo 88;; *) echo "";;
  esac
}
# Partie de chaque suite pour les jobs parallèles de GitHub Actions (10 parties, durées équilibrées, 4 à 5 minutes chacune).
partie() {
  case "$1" in
    verif52) echo 1;;
    verif53) echo 2;;
    verif51|verif34|verif35) echo 3;;
    verif38|verif36|verif37) echo 4;;
    verif48|verif43|flux) echo 5;;
    verif49|verif41) echo 6;;
    verif42|verif50) echo 7;;
    verif40|verif54) echo 8;;
    verif55|verif39|fonction) echo 9;;
    verif56|rig|verif-xss) echo 10;;
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

# Toute suite verif*.js du dossier est soit au banc, soit explicitement hors banc.
for f in verif*.js; do
  s="${f%.js}"
  case " $SUITES $HORS_BANC " in *" $s "*) ;; *) echec "$s : suite ni au banc ni dans HORS_BANC (banc.sh)";; esac
done

for s in $SUITES rig fonction; do
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

# Fonction des emails de suivi (sans réseau, jamais déployée par ce banc) : la dernière ligne doit être « N/N vérifications ».
if dans_partie fonction; then
debut=$(date +%s)
node ../supabase/functions/emails-prospects/test.mjs > "$OUT/fonction-emails.log" 2>&1
rc=$?
fin=$(tail -1 "$OUT/fonction-emails.log")
duree=$(( $(date +%s) - debut ))
att=$(attendu fonction)
if [ "$rc" -ne 0 ] || [ "$fin" != "$att/$att vérifications" ]; then
  echec "fonction emails : code $rc, « $fin » ($att/$att attendues), ${duree} s"; tail -20 "$OUT/fonction-emails.log"
else note "ok     fonction emails : $fin, ${duree} s"; fi
fi

# Le disque doit être resté exactement le commit testé.
DISQUE_FIN=$(etat_disque)
TETE_FIN=$(git -C .. rev-parse --short HEAD 2>/dev/null || echo "?")
if [ "${BANC_LIBRE:-}" != 1 ]; then
  if [ -n "$DISQUE_DEBUT" ] || [ -n "$DISQUE_FIN" ]; then echec "fichiers suivis modifiés (non commités) : le résultat ne vaut pour aucun commit (BANC_LIBRE=1 pour un essai)"; fi
  if [ "$TETE" != "$TETE_FIN" ]; then echec "le commit a changé pendant le banc ($TETE → $TETE_FIN)"; fi
fi

echo
echo "===== Bilan du banc — commit $TETE${BANC_PARTIE:+ — partie $BANC_PARTIE/${BANC_PARTIES:-10}} ====="
printf "%s" "$resume"
if [ "$echecs" -gt 0 ]; then echo "$echecs échec(s) : rien ne doit être publié."; exit 1; fi
echo "Tout est vert (commit $TETE)."
