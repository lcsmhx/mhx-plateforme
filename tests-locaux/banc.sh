#!/usr/bin/env bash
# Banc complet de la plateforme MHX : toutes les suites, l'une après l'autre (elles écoutent sur des ports fixes).
# Supabase est simulé dans chaque suite ; aucune ne doit joindre la vraie base (voir README, « Règle d'or »).
# Utilisé par GitHub Actions avant chaque publication, et en local :
#   bash tests-locaux/banc.sh [dossier des journaux]        (depuis la racine du dépôt ou d'ailleurs)
# En local sans le Chromium de Playwright : BANC_CHROME=1 bash tests-locaux/banc.sh   (Google Chrome de la machine)
# Code de sortie 1 au moindre échec : code de sortie non nul, une ligne ✗, un bloc interrompu, moins de ✓ qu'attendu,
# une erreur de console ou une écriture pendant le parcours des pages (rig.js), un test de la fonction emails raté.
set -u
cd "$(dirname "$0")"
OUT="${1:-captures/banc}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
if [ "${BANC_CHROME:-}" = 1 ]; then export NODE_OPTIONS="--require ./chrome-systeme.js"; fi

# Suites du banc (verif44 à verif47 testent le Challenge 7 jours supprimé : hors banc).
SUITES="flux verif34 verif35 verif36 verif37 verif38 verif-xss verif39 verif40 verif41 verif42 verif43 verif48 verif49 verif50 verif51 verif52 verif53 verif54"

# Nombre minimum de ✓ attendus par suite : une vérification sautée sans le dire devient un échec.
# À mettre à jour quand une suite gagne des vérifications (voir README).
attendu() {
  case "$1" in
    flux) echo 19;; verif34) echo 13;; verif35) echo 14;; verif36) echo 13;; verif37) echo 15;; verif38) echo 67;;
    verif-xss) echo 5;; verif39) echo 43;; verif40) echo 81;; verif41) echo 25;; verif42) echo 20;; verif43) echo 34;;
    verif48) echo 41;; verif49) echo 130;; verif50) echo 60;; verif51) echo 123;; verif52) echo 186;; verif53) echo 137;;
    verif54) echo 64;; *) echo 1;;
  esac
}

echecs=0
resume=""
note() { resume="$resume$1"$'\n'; echo "$1"; }

for s in $SUITES; do
  debut=$(date +%s)
  if [ "$s" = flux ]; then node flux.js ../index.html "$OUT/captures-flux" > "$OUT/$s.log" 2>&1
  else node "$s.js" ../index.html > "$OUT/$s.log" 2>&1; fi
  rc=$?
  ok=$(grep -c '✓' "$OUT/$s.log"); ko=$(grep -c '✗' "$OUT/$s.log")
  interrompu=$(grep -c 'BLOC INTERROMPU' "$OUT/$s.log")
  duree=$(( $(date +%s) - debut ))
  min=$(attendu "$s")
  if [ "$rc" -ne 0 ] || [ "$ko" -gt 0 ] || [ "$interrompu" -gt 0 ] || [ "$ok" -lt "$min" ]; then
    echecs=$((echecs + 1))
    note "ÉCHEC  $s : $ok ✓ (au moins $min attendus), $ko ✗, code $rc, ${duree} s"
    grep -E '✗|BLOC INTERROMPU|Error' "$OUT/$s.log" | head -20
  else
    note "ok     $s : $ok ✓, ${duree} s"
  fi
done

# Parcours de toutes les pages (client, coach, fiche, connexion ; téléphone et ordi) : 0 erreur, 0 écriture.
debut=$(date +%s)
node rig.js --html ../index.html --out "$OUT/captures-rig" > "$OUT/rig.log" 2>&1
rc=$?
bilan=$(node -e '
  const r = require(process.argv[1]);
  const e = r.erreurs || [], w = r.ecritures_simulees || [];
  console.log((e.length || w.length ? "KO" : "OK") + " " + r.captures + " pages, " + e.length + " erreur(s), " + w.length + " écriture(s)");
  e.concat(w).slice(0, 20).forEach(x => console.log("   " + x));
' "$OUT/captures-rig/_rapport.json" 2>&1)
duree=$(( $(date +%s) - debut ))
if [ "$rc" -ne 0 ] || [ "${bilan:0:2}" != OK ]; then
  echecs=$((echecs + 1)); note "ÉCHEC  rig : code $rc, ${duree} s — $bilan"
else
  note "ok     rig : ${bilan:3}, ${duree} s"
fi

# Fonction des emails de suivi (sans réseau, jamais déployée par ce banc).
debut=$(date +%s)
node ../supabase/functions/emails-prospects/test.mjs > "$OUT/fonction-emails.log" 2>&1
rc=$?
duree=$(( $(date +%s) - debut ))
if [ "$rc" -ne 0 ]; then
  echecs=$((echecs + 1)); note "ÉCHEC  fonction emails : code $rc, ${duree} s"; tail -20 "$OUT/fonction-emails.log"
else
  note "ok     fonction emails : $(tail -1 "$OUT/fonction-emails.log"), ${duree} s"
fi

echo
echo "===== Bilan du banc ====="
printf "%s" "$resume"
if [ "$echecs" -gt 0 ]; then echo "$echecs échec(s) : rien ne doit être publié."; exit 1; fi
echo "Tout est vert."
