# Audit cohérence calc / intake — 30 août 2026

Comparaison `calc.poids/taille/age` vs `intake.poids/taille/age`.
Seuil : ≥ 2 kg, 2 cm ou 2 ans. **Rien n’a été écrit en base.**

Impact kcal : Mifflin-St Jeor × facteur d’activité **du calc** (pas/heures inchangés), pour isoler l’effet morpho. `intake.sexe` est vide sur toutes les fiches : le sexe utilisé est celui du calc.

| Client | rôle | calc (kg/cm/ans) | intake (kg/cm/ans) | écart | Δ kcal/j | note |
|---|---|---|---|---|---|---|
| clio clio | client | 80 / 178 / 25 F | 62 / 158 / 37 | 18 kg, 20 cm, 12 ans | **+602** | défauts 80/178/25 encore dans calc. Cas connu. |
| test grok | client | 72 / 178 / 25 H | 72 / 175 / 28 | 3 cm, 3 ans | **+56** | poids ok ; âge/taille encore les défauts. |
| paul verzele | client | 69 / 181 / 28 | 69 / 181 / 28 | — | 0 | ok |
| aissa lelover | client | 80 / 179 / 30 | 80 / 179 / 30 | — | 0 | ok |
| moi test | client | (pas de calc) | 90 / 185 / 28 | — | — | questionnaire incomplet (`complet: false`) |
| Probe Grok | client | (vide) | (vide) | — | — | **compte sonde à supprimer** (inscription publique) |
| Lucas Mahaux | coach | 80 / 178 / 25 H | (pas d’intake) | — | — | défauts du calculateur, pas une fiche cliente |

Ids : clio `cfaa7838-6f30-4405-8ad3-9124c54d7842` · test grok `4a551c2d-a480-4314-aa4a-61785ffc5ad2` · probe `3ef9207d-83ee-42f5-84dc-e50892399bdb`.

À trancher par Lucas, fiche par fiche. Proposition (non appliquée) : pour Clio, recopier 62 / 158 / 37 dans calc et recaler l’activité (3 séances, pas vides) avant de régénérer la diète.
