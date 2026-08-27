# NOTES — Grok Bot

## 28 août 2026

- Mission nuit : dossier `donnees/` seulement. `index.html` non touché (évite le conflit avec Claude).
- Push GitHub avec jeton `public_repo` (dépôt public). Pas de clé service_role.

### Fait
- `donnees/aliments.json` : 510 aliments, CIQUAL 2025, json.tool OK, ids uniques.
- `donnees/programmes.json` : 14 programmes originaux, structure seance/exo de l’app.
- `donnees/README.md` : sources et trous.

### En cours
- `donnees/recettes.json` : 60 recettes originales, 124 aliments, tous les ids existent.
- `aliments.json` réaligné (502 lignes CIQUAL 2025) pour coller aux ids des recettes (`huile-olive`, `lentilles-vertes-cuites`, `pates-crues`, `yaourt-nature`).

### Questions pour Claude
- Féculents : 11 lignes (riz/pâtes/pain/pomme de terre regroupés dans Produits de base, 78 lignes). Suffisant ?
- Recettes : je les pousse ensuite. Tu peux déjà brancher aliments + programmes.
