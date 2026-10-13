/* ------------------------------------------------------------------
   v85 (bloc 4) — LES PROGRAMMES DE LA FORMATION : 3 programmes transcrits des PDF de la formation (docs/maj-bloc-4/
   programmes-formation.json fait foi : seulement les séances et la méthode), l'échauffement commun et la règle « Combien de
   séances ? ». Chaque exercice est relié à un exercice de l'app (donnees/exercices.json, champ ex = son id) et affiché sous le
   nom de l'app ; sa vidéo (yt, YouTube) est celle de l'exercice dans l'app (liensexercices.json, sinon son champ lien : la
   même règle que l'import du catalogue). Un nom sans équivalent sûr garde le nom du PDF, sans vidéo (liste « à préciser »
   du rapport, docs/maj-bloc-4/RAPPORT.md). Fichier fabriqué depuis le JSON ; pas de propriété cle… ni outil (garde-cles).
   v87 (mission de nuit du 14/10/2026, lot 2) : « Burpees » (classique, avec saut) n'est plus relié à « Burpees contrôlés » (sans saut),
   « Tractions assistées » et « Curl barre EZ » / « Curl biceps barre EZ » ne sont plus reliés (variantes non garanties) : nom du
   PDF, sans vidéo. Un nom sans équivalent peut porter une vidéo de la chaîne YouTube AZEOO (yt sans ex) quand son titre
   correspond clairement au mouvement (vérifié par oEmbed, auteur « AZEOO ») : liste et titres dans docs/mission-nuit/RAPPORT.md.
   ------------------------------------------------------------------ */
const PF_DONNEES = {"version":1,"echauffement":{"duree":"5 min de cardio + 5 min d'ostéo-articulaire (30 s par mouvement)","cardio":["Jumping jacks (1 min)","Montées de genoux sur place (1 min)","Talons-fesses (1 min)","Pas chassés latéraux (1 min)","Burpees lents (1 min)"],"haut_du_corps":["Rotations de la tête","Cercles des épaules (15 s avant / 15 s arrière)","Rotations des bras","Rotations des coudes","Rotations des poignets","Torsion du tronc","Élévation des bras au-dessus de la tête","Inclinaisons latérales du tronc","Rotation du thorax","Élévation des épaules"],"bas_du_corps":["Flexion latérale des hanches","Rotations des hanches","Rotations des genoux","Rotations des chevilles (30 s par cheville)"]},"combien":["1–2 j/semaine : séance HIIT ou Full body.","3–4 j/semaine : Haut/Bas du corps + Full body, ou Haut/Bas du corps + HIIT.","5–6 j/semaine : toutes les séances du programme chaque semaine (+ cardio le dernier jour)."],"programmes":[
  {"id":"salle-homme","nom":"Programme salle 12 semaines · Homme","sexe":"homme","lieu":"salle","phases":[{"semaines":"1-4","titre":"Semaines 1 à 4","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"10","repos":"90 s"},{"nom":"Presse à cuisses","ex":"presse-a-cuisses","yt":"wsZqaefajGc","series":"3","reps":"15","repos":"90 s"},{"nom":"Fentes marchées","ex":"fentes-marchees","yt":"QRewx1DhJF8","series":"4","reps":"10 / jambe","repos":"60 s"},{"nom":"Leg extension","ex":"leg-extension","yt":"C26wr0pvhcQ","series":"4","reps":"15","repos":"60 s"},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"4","reps":"15","repos":"60 s"}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90 s"},{"nom":"Développé haltères incliné","ex":"developpe-halteres-incline","yt":"SHX2G9h4jGY","series":"4","reps":"12","repos":"90 s"},{"nom":"Dips","ex":"dips","yt":"dmGLQ0-HmeM","series":"3","reps":"12","repos":"60 s"},{"nom":"Écartés haltères","ex":"ecartes-halteres","yt":"Bhq25TveHAQ","series":"3","reps":"12","repos":"60 s"},{"nom":"Extension triceps poulie","ex":"extension-triceps-poulie","yt":"cGCJKdAuQG0","series":"4","reps":"12","repos":"60 s"},{"nom":"Crunch","ex":"crunch","yt":"VBAgK577WmM","series":"4","reps":"15-20","repos":"45 s"}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"12","repos":"90 s"},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"4","reps":"12","repos":"90 s"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"15","repos":"60 s"},{"nom":"Fentes marchées","ex":"fentes-marchees","yt":"QRewx1DhJF8","series":"4","reps":"10 / jambe","repos":"60 s"},{"nom":"Mollets assis","ex":"mollets-assis","yt":"TMaY8lgKYyI","series":"4","reps":"20","repos":"60 s"}]},{"nom":"Séance 4 — Haut du corps","type":"muscu","exercices":[{"nom":"Tractions assistées","series":"4","reps":"12","repos":"90 s"},{"nom":"Rowing haltère","ex":"rowing-haltere","yt":"ZPFkeki3poA","series":"4","reps":"12","repos":"90 s"},{"nom":"Curl haltères","ex":"curl-halteres","yt":"5FY8DsusGZ8","series":"4","reps":"12","repos":"90 s"},{"nom":"Curl barre EZ","series":"3","reps":"15","repos":"60 s"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","series":"3","reps":"20-30 s","repos":"45 s"}]},{"nom":"Séance 5 — Full body","type":"muscu","exercices":[{"nom":"Burpees","series":"5","reps":"12","repos":"60 s"},{"nom":"Fentes haltères","ex":"fentes-halteres","yt":"QRewx1DhJF8","series":"4","reps":"15","repos":"90 s"},{"nom":"Peck deck","yt":"OrkQU-f0mEY","series":"4","reps":"12","repos":"90 s"},{"nom":"Rowing haltère un bras","ex":"rowing-haltere-un-bras","yt":"FUV_Tx2Oqqs","series":"3","reps":"12","repos":"60 s"},{"nom":"Crunch","ex":"crunch","yt":"VBAgK577WmM","series":"3","reps":"15-20","repos":"45 s"}]},{"nom":"Séance 6 — HIIT cardio","type":"hiit","consigne":"Circuit à répéter 4 à 5 fois selon le niveau.","exercices":[{"nom":"Burpees","repos":"30 s","travail":"30 s"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA","repos":"30 s","travail":"30 s"},{"nom":"Squats sautés","repos":"30 s","travail":"30 s"},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","repos":"30 s","travail":"30 s"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","repos":"30 s","travail":"30 s"}]}]},{"semaines":"5-8","titre":"Semaines 5 à 8 — Intensification","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat front","ex":"squat-front","yt":"lWuaIsGgmDA","series":"4","reps":"12","repos":"60 s","technique":"superset","groupe":1},{"nom":"Presse à cuisses","ex":"presse-a-cuisses","yt":"wsZqaefajGc","series":"4","reps":"12","repos":"60 s","technique":"superset","groupe":1},{"nom":"Fentes marchées haltères","ex":"fentes-marchees-halteres","yt":"QRewx1DhJF8","series":"4","reps":"10 / jambe","repos":"60 s"},{"nom":"Leg extension","ex":"leg-extension","yt":"C26wr0pvhcQ","series":"4","reps":"20","repos":"60 s"},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"4","reps":"25","repos":"60 s"}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Dips de chaise","ex":"dips-de-chaise","yt":"HCf97NPYeGY","series":"4","reps":"15","repos":"60 s"},{"nom":"Extension triceps poulie","ex":"extension-triceps-poulie","yt":"cGCJKdAuQG0","series":"4","reps":"20","repos":"60 s"},{"nom":"Crunch","ex":"crunch","yt":"VBAgK577WmM","series":"4","reps":"25","repos":"45 s"}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"15","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"4","reps":"15","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"20","repos":"60 s"},{"nom":"Fentes haltères","ex":"fentes-halteres","yt":"QRewx1DhJF8","series":"3","reps":"15 / jambe","repos":"60 s"},{"nom":"Mollets assis","ex":"mollets-assis","yt":"TMaY8lgKYyI","series":"4","reps":"25","repos":"60 s"}]},{"nom":"Séance 4 — Haut du corps","type":"muscu","exercices":[{"nom":"Tractions assistées","series":"4","reps":"15","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Rowing haltère","ex":"rowing-haltere","yt":"ZPFkeki3poA","series":"4","reps":"15","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Curl haltères","ex":"curl-halteres","yt":"5FY8DsusGZ8","series":"4","reps":"12","repos":"60 s"},{"nom":"Curl barre EZ","series":"3","reps":"15","repos":"60 s"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","series":"3","reps":"60 s","repos":"30 s"}]},{"nom":"Séance 5 — Full body","type":"muscu","exercices":[{"nom":"Vélo elliptique ou tapis de marche","series":"—","reps":"20 min","repos":"—"},{"nom":"Jumping jacks","series":"3","reps":"30 s","repos":"60 s","technique":"superset","groupe":1},{"nom":"Squat goblet","ex":"squat-goblet","yt":"gCESNsDsbqk","series":"3","reps":"15","repos":"60 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"60 s"},{"nom":"Rowing haltère un bras","ex":"rowing-haltere-un-bras","yt":"FUV_Tx2Oqqs","series":"3","reps":"15","repos":"60 s"}]},{"nom":"Séance 6 — HIIT intensifié","type":"hiit","consigne":"Circuit à répéter 4 à 5 fois selon le niveau.","exercices":[{"nom":"Burpees","repos":"20 s","travail":"40 s"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA","repos":"20 s","travail":"40 s"},{"nom":"Squats sautés","repos":"20 s","travail":"40 s"},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","repos":"20 s","travail":"40 s"},{"nom":"Planche dynamique","repos":"20 s","travail":"40 s"}]}]},{"semaines":"9-12","titre":"Semaines 9 à 12 — Intensification +","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Presse à cuisses","ex":"presse-a-cuisses","yt":"wsZqaefajGc","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Fentes statiques haltères","series":"4","reps":"10 / jambe + 5","repos":"60 s","technique":"dropset"},{"nom":"Leg extension","ex":"leg-extension","yt":"C26wr0pvhcQ","series":"4","reps":"20","repos":"60 s"},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"5","reps":"25","repos":"60 s"}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"5","reps":"15","repos":"120 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"5","reps":"15","repos":"120 s","technique":"superset","groupe":1},{"nom":"Dips de chaise","ex":"dips-de-chaise","yt":"HCf97NPYeGY","series":"3","reps":"12-15 + 5","repos":"60 s","technique":"dropset"},{"nom":"Extension triceps poulie","ex":"extension-triceps-poulie","yt":"cGCJKdAuQG0","series":"4","reps":"20","repos":"60 s"},{"nom":"Crunch","ex":"crunch","yt":"VBAgK577WmM","series":"4","reps":"25","repos":"30 s"}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"3","reps":"12-15","repos":"60 s","technique":"superset","groupe":1},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"3","reps":"12-15","repos":"60 s","technique":"superset","groupe":1},{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"3","reps":"10 / jambe + 5","repos":"60 s","technique":"dropset"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"3","reps":"15-20","repos":"60 s"},{"nom":"Mollets assis","ex":"mollets-assis","yt":"TMaY8lgKYyI","series":"3","reps":"15-20","repos":"60 s"}]},{"nom":"Séance 4 — Haut du corps","type":"muscu","exercices":[{"nom":"Tractions assistées","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Rowing haltère","ex":"rowing-haltere","yt":"ZPFkeki3poA","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Curl haltères","ex":"curl-halteres","yt":"5FY8DsusGZ8","series":"4","reps":"12-15 + 5","repos":"60 s","technique":"dropset"},{"nom":"Curl barre EZ","series":"3","reps":"15-20","repos":"60 s"},{"nom":"Planche dynamique","series":"3","reps":"90 s","repos":"45 s"}]},{"nom":"Séance 5 — Full body + cardio","type":"muscu","exercices":[{"nom":"Jumping jacks","series":"4","reps":"30 s","repos":"60 s","technique":"superset","groupe":1},{"nom":"Squat goblet","ex":"squat-goblet","yt":"gCESNsDsbqk","series":"4","reps":"15","repos":"60 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"3","reps":"12-15","repos":"60 s"},{"nom":"Rowing haltère un bras","ex":"rowing-haltere-un-bras","yt":"FUV_Tx2Oqqs","series":"3","reps":"12-15","repos":"60 s"},{"nom":"Crunch","ex":"crunch","yt":"VBAgK577WmM","series":"3","reps":"20","repos":"45 s"}]},{"nom":"Séance 6 — HIIT cardio","type":"hiit","consigne":"Circuit à répéter 4 à 5 fois selon le niveau.","exercices":[{"nom":"Burpees explosifs","repos":"15 s","travail":"45 s"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA","repos":"15 s","travail":"45 s"},{"nom":"Squats sautés","repos":"15 s","travail":"45 s"},{"nom":"Pompes avec claquement","repos":"15 s","travail":"45 s"},{"nom":"Planche dynamique","repos":"15 s","travail":"45 s"}]}]}]},
  {"id":"salle-femme","nom":"Programme salle 12 semaines · Femme","sexe":"femme","lieu":"salle","phases":[{"semaines":"1-4","titre":"Semaines 1 à 4","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"15","repos":"90-120 s"},{"nom":"Fentes avant","yt":"LphXqrsgLUI","series":"4","reps":"12 / jambe","repos":"90 s"},{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"15","repos":"90 s"},{"nom":"Presse à cuisses","ex":"presse-a-cuisses","yt":"wsZqaefajGc","series":"4","reps":"15","repos":"90 s"},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"4","reps":"20","repos":"60 s"},{"nom":"Abducteurs machine","ex":"abducteurs-machine","yt":"lwKkqZG09qs","series":"3","reps":"15","repos":"60 s"},{"nom":"Step-ups avec haltères","series":"3","reps":"12 / jambe","repos":"90 s"}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90-120 s"},{"nom":"Tirage vertical","ex":"tirage-vertical","yt":"KNM8U6Y72Y4","series":"4","reps":"12","repos":"90 s"},{"nom":"Développé militaire","ex":"developpe-militaire","yt":"VZcMoeLZGAw","series":"4","reps":"15","repos":"90 s"},{"nom":"Rowing barre","ex":"rowing-barre","yt":"R9qxaP9PDAk","series":"4","reps":"12","repos":"90 s"},{"nom":"Curl haltères","ex":"curl-halteres","yt":"5FY8DsusGZ8","series":"3","reps":"15","repos":"60 s"},{"nom":"Extension triceps poulie","ex":"extension-triceps-poulie","yt":"cGCJKdAuQG0","series":"3","reps":"15","repos":"60 s"},{"nom":"Élévations latérales","ex":"elevations-laterales","yt":"-Emurq_o8pI","series":"3","reps":"15","repos":"60 s"},{"nom":"Tirage horizontal","ex":"tirage-horizontal","yt":"59iS-DtCaXw","series":"3","reps":"12","repos":"60 s"}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"4","reps":"12 / jambe","repos":"90-120 s"},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"4","reps":"15","repos":"90 s"},{"nom":"Soulevé de terre","ex":"souleve-de-terre","yt":"78XFxKk9yIk","series":"4","reps":"12","repos":"90 s"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"15","repos":"90 s"},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"4","reps":"20","repos":"60 s"},{"nom":"Fentes arrière haltères","ex":"fentes-arriere-halteres","yt":"Ur-RGDw5e_U","series":"3","reps":"12 / jambe","repos":"90 s"},{"nom":"Box jump","series":"3","reps":"15","repos":"90 s"}]},{"nom":"Séance 4 — HIIT (choisis 1 option)","type":"hiit_options","consigne":"30 s travail / 30 s repos — 3 tours. Progression : à la fin de chaque semaine, réduis le repos à 20 s.","options":[{"nom":"Option 1","echauffement":"5 min : Jumping jacks, Mountain climbers","exercices":[{"nom":"Burpees"},{"nom":"Squats","ex":"squats","yt":"LSAalN4gEjY"},{"nom":"Fentes alternées"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0"}]},{"nom":"Option 2","echauffement":"5 min : Corde à sauter sans corde, High knees","exercices":[{"nom":"Jumping jacks"},{"nom":"Squats sautés"},{"nom":"Fentes latérales","yt":"XOAzj8Vu-EU"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"}]},{"nom":"Option 3","echauffement":"5 min : Squats, Fentes","exercices":[{"nom":"Burpees"},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"},{"nom":"Planche avec levée de jambe"}]}]},{"nom":"Séance 5 — Full body","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"15","repos":"90-120 s"},{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90 s"},{"nom":"Soulevé de terre","ex":"souleve-de-terre","yt":"78XFxKk9yIk","series":"4","reps":"12","repos":"90 s"},{"nom":"Tractions assistées","series":"3","reps":"10","repos":"90 s"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","series":"3","reps":"60 s","repos":"60 s"},{"nom":"Burpees","series":"3","reps":"15","repos":"60 s"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA","series":"3","reps":"20","repos":"60 s"}]},{"nom":"Séance 6 — Cardio","type":"cardio","consigne":"30 min à intensité moyenne (marche rapide en pente, vélo elliptique…)."}]},{"semaines":"5-8","titre":"Semaines 5 à 8 — Intensification","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"12","repos":"90-120 s"},{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Squats sautés","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"12","repos":"90 s"},{"nom":"Presse à cuisses","ex":"presse-a-cuisses","yt":"wsZqaefajGc","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Extension mollets","series":"4","reps":"20","repos":"90 s","technique":"superset","groupe":2},{"nom":"Leg extension","ex":"leg-extension","yt":"C26wr0pvhcQ","series":"3","reps":"15","repos":"60 s"},{"nom":"Step-ups avec haltères","series":"3","reps":"12 / jambe","repos":"90 s"}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"90-120 s","technique":"superset","groupe":1},{"nom":"Tirage vertical","ex":"tirage-vertical","yt":"KNM8U6Y72Y4","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Tirage horizontal","ex":"tirage-horizontal","yt":"59iS-DtCaXw","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Développé militaire","ex":"developpe-militaire","yt":"VZcMoeLZGAw","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":3},{"nom":"Élévations latérales","ex":"elevations-laterales","yt":"-Emurq_o8pI","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":3},{"nom":"Dips","ex":"dips","yt":"dmGLQ0-HmeM","series":"3","reps":"12","repos":"90 s"},{"nom":"Curl barre EZ","series":"3","reps":"15","repos":"60 s"},{"nom":"Extension triceps poulie","ex":"extension-triceps-poulie","yt":"cGCJKdAuQG0","series":"3","reps":"15","repos":"60 s"}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"4","reps":"12","repos":"90 s"},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"4","reps":"12","repos":"90 s"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Extension mollets","series":"4","reps":"20","repos":"90 s","technique":"superset","groupe":1},{"nom":"Fentes arrière haltères","ex":"fentes-arriere-halteres","yt":"Ur-RGDw5e_U","series":"3","reps":"12 / jambe","repos":"90 s"},{"nom":"Box jump","series":"3","reps":"15","repos":"90 s"}]},{"nom":"Séance 4 — HIIT (choisis 1 option)","type":"hiit_options","consigne":"40 s travail / 20 s repos — 4 tours. Progression : passe à 5 tours en semaines 7 et 8.","options":[{"nom":"Option 1","echauffement":"5 min : High knees, Cercles de bras","exercices":[{"nom":"Burpees"},{"nom":"Squats sautés"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"},{"nom":"Planche dynamique"}]},{"nom":"Option 2","echauffement":"5 min : Jumping jacks, Fentes","exercices":[{"nom":"Pompes avec claquement"},{"nom":"Planche avec rotation"},{"nom":"Squats sautés"},{"nom":"High knees","yt":"G4TXQzNMZEY"}]},{"nom":"Option 3","echauffement":"5 min : Fentes dynamiques, Squats sautés","exercices":[{"nom":"Fentes sautées","yt":"-g1shAUmIws"},{"nom":"Squats sautés"},{"nom":"Planche avec touche d'épaule"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"}]}]},{"nom":"Séance 5 — Full body","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"12","repos":"90 s"},{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Soulevé de terre","ex":"souleve-de-terre","yt":"78XFxKk9yIk","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Rowing","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Gainage latéral","ex":"gainage-lateral","yt":"pQXEcierrHM","series":"3","reps":"45 s","repos":"60 s"},{"nom":"Burpees","series":"3","reps":"15","repos":"60 s"}]},{"nom":"Séance 6 — Cardio","type":"cardio","consigne":"45 min à intensité moyenne (marche rapide en pente, vélo elliptique…)."}]},{"semaines":"9-12","titre":"Semaines 9 à 12 — Intensification +","seances":[{"nom":"Séance 1 — Bas du corps","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"10-12","repos":"90 s","technique":"dropset","note":"Dropset sur la dernière série"},{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Squats sautés","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"10-12","repos":"90 s"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Extension mollets","series":"4","reps":"20","repos":"90 s","technique":"superset","groupe":2}]},{"nom":"Séance 2 — Haut du corps","type":"muscu","exercices":[{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"10-12","repos":"90 s","technique":"dropset"},{"nom":"Rowing barre","ex":"rowing-barre","yt":"R9qxaP9PDAk","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Tirage vertical","ex":"tirage-vertical","yt":"KNM8U6Y72Y4","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Développé militaire","ex":"developpe-militaire","yt":"VZcMoeLZGAw","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":2}]},{"nom":"Séance 3 — Bas du corps","type":"muscu","exercices":[{"nom":"Fentes bulgares","ex":"fentes-bulgares","yt":"VpEUdmw_PaM","series":"4","reps":"10-12 / jambe","repos":"90 s","technique":"dropset","note":"Dropset sur la dernière série"},{"nom":"Leg curl","ex":"leg-curl","yt":"9p23QLa_e6g","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Soulevé de terre jambes tendues","yt":"Rtwy_BbAhgQ","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Fentes arrière","ex":"fentes-arriere","yt":"Ur-RGDw5e_U","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Hip thrust","ex":"hip-thrust","yt":"W89Ha5B357s","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Mollets à la presse","ex":"mollets-a-la-presse","yt":"1YjDjUOHFUM","series":"4","reps":"20","repos":"60 s","technique":"superset","groupe":3},{"nom":"Mollets debout","ex":"mollets-debout","yt":"g_E7_q1z2bo","series":"4","reps":"20","repos":"60 s","technique":"superset","groupe":3}]},{"nom":"Séance 4 — HIIT (choisis 1 option)","type":"hiit_options","consigne":"50 s travail / 10 s repos — 5 tours. Dernière semaine : si possible, repos réduit à 5 s.","options":[{"nom":"Option 1","echauffement":"5 min : Corde à sauter sans corde, Mountain climbers","exercices":[{"nom":"Burpees avec saut"},{"nom":"Squats sautés"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"},{"nom":"Planche avec levée de jambe"}]},{"nom":"Option 2","echauffement":"5 min : Jumping jacks, Squats","exercices":[{"nom":"Pompes explosives"},{"nom":"Planche dynamique"},{"nom":"Fentes sautées","yt":"-g1shAUmIws"},{"nom":"High knees rapides","yt":"G4TXQzNMZEY"}]},{"nom":"Option 3","echauffement":"5 min : Squats, Fentes sautées","exercices":[{"nom":"Squats sautés avec levée de genoux"},{"nom":"Burpees"},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA"},{"nom":"Planche avec rotation rapide"}]}]},{"nom":"Séance 5 — Full body","type":"muscu","exercices":[{"nom":"Squat barre","ex":"squat-barre","yt":"LSAalN4gEjY","series":"4","reps":"10-12","repos":"90 s","technique":"dropset","note":"Dropset sur la dernière série"},{"nom":"Développé couché","ex":"developpe-couche","yt":"_N_3lENcda4","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":1},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":1},{"nom":"Soulevé de terre","ex":"souleve-de-terre","yt":"78XFxKk9yIk","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Rowing barre","ex":"rowing-barre","yt":"R9qxaP9PDAk","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":2},{"nom":"Développé militaire","ex":"developpe-militaire","yt":"VZcMoeLZGAw","series":"4","reps":"12","repos":"90 s","technique":"superset","groupe":3},{"nom":"Élévations latérales","ex":"elevations-laterales","yt":"-Emurq_o8pI","series":"4","reps":"15","repos":"90 s","technique":"superset","groupe":3},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","series":"4","reps":"60 s","repos":"60 s","technique":"superset","groupe":4},{"nom":"Mountain climbers","ex":"mountain-climbers","yt":"e51MITfR2bA","series":"4","reps":"30 s","repos":"60 s","technique":"superset","groupe":4}]},{"nom":"Séance 6 — Cardio","type":"cardio","consigne":"60 min à intensité moyenne (marche rapide en pente, vélo elliptique…)."}]}]},
  {"id":"maison","nom":"Full body à la maison","sexe":"tous","lieu":"maison","methode":["3 séances pour tout le corps, à faire chez toi. Des haltères et un tapis suffisent ; sans haltères, une bouteille d'eau ou rien du tout.","Vise le haut de la plage de répétitions (ex. 10-15 : essaie d'aller à 15). Si tu t'arrêtes à 10 ou 12, c'est normal : tu progresseras au fil des semaines.","Trop dur ? Fais l'exercice sans poids. Planche : commence sur les genoux. Pompes : sur les genoux, ou les mains sur un petit meuble."],"phases":[{"semaines":"toutes","titre":"Toutes les semaines","seances":[{"nom":"Séance 1 — Full body","type":"muscu","exercices":[{"nom":"Squat avec haltères","yt":"0MOw1B2YysY","series":"5","reps":"10-15","repos":"60 s"},{"nom":"Rowing haltère un bras","ex":"rowing-haltere-un-bras","yt":"FUV_Tx2Oqqs","series":"4","reps":"8-12 / côté","repos":"60 s"},{"nom":"Pompes","ex":"pompes","yt":"jdM0CTRKTKU","series":"4","reps":"8-12","repos":"60 s"},{"nom":"Fentes haltères","ex":"fentes-halteres","yt":"QRewx1DhJF8","series":"4","reps":"12-16","repos":"60 s"},{"nom":"Curl haltères","ex":"curl-halteres","yt":"5FY8DsusGZ8","series":"4","reps":"12-16","repos":"60 s"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0","series":"3","reps":"Le plus longtemps possible","repos":"45 s"}]},{"nom":"Séance 2 — Full body","type":"muscu","exercices":[{"nom":"Pont fessier","ex":"pont-fessier","yt":"bnKpYIMmvtw","series":"4","reps":"15-20","repos":"45 s"},{"nom":"Step-ups sur une chaise avec haltères","series":"3","reps":"15-20","repos":"60 s"},{"nom":"Hip thrust à l'haltère","yt":"2KaDiDFL0HY","series":"4","reps":"10-15","repos":"60 s"},{"nom":"Développé haltères au sol","ex":"developpe-halteres-au-sol","yt":"MoxtltClaJ0","series":"3","reps":"10-15","repos":"60 s"},{"nom":"Élévations latérales haltères","ex":"elevations-laterales-halteres","yt":"-Emurq_o8pI","series":"3","reps":"10-15","repos":"60 s"}]},{"nom":"Séance 3 — Full body","type":"muscu","exercices":[{"nom":"Soulevé de terre haltères","ex":"souleve-de-terre-halteres","yt":"0a7GUsvQt2A","series":"4","reps":"10-15","repos":"90 s"},{"nom":"Wall sit","ex":"wall-sit","yt":"90wz-xiMes8","series":"3","reps":"Max","repos":"60 s"},{"nom":"Oiseau haltères","ex":"oiseau-halteres","yt":"lscvrLVszYc","series":"3","reps":"10-15","repos":"60 s"},{"nom":"Développé militaire avec haltères","yt":"WuHq01Jnf8I","series":"3","reps":"8-12","repos":"60 s"},{"nom":"Triceps kickback avec haltères","yt":"dgjl5H-TK3g","series":"3","reps":"8-12 / côté","repos":"60 s"}]},{"nom":"Séance bonus — Circuit","type":"circuit","consigne":"4 à 8 tours. 30 à 45 s d'action par exercice, le maximum de répétitions. 5 s de repos entre les exercices, 1 min 30 après chaque tour. Progression : commence par 4 tours de 30 s ; quand c'est trop facile, passe à 45 s ; puis ajoute un tour, et ainsi de suite.","exercices":[{"nom":"Squat avec haltères","yt":"0MOw1B2YysY"},{"nom":"Jumping jacks"},{"nom":"Burpees"},{"nom":"Wall sit","ex":"wall-sit","yt":"90wz-xiMes8"},{"nom":"Planche","ex":"planche","yt":"R4FB7v-v6x0"}]}]}]}]};

/* Anglais américain, même ton : les textes des programmes (séances, consignes, méthode, échauffement) et de leurs écrans. Les
   noms d'exercices restent ceux de l'app (leur traduction vient du catalogue, comme partout). */
Object.assign(I18N.en, {
  "5 min de cardio + 5 min d'ostéo-articulaire (30 s par mouvement)": "5 min of cardio + 5 min of joint mobility (30 s per movement)",
  "Montées de genoux sur place (1 min)": "High knees in place (1 min)",
  "Talons-fesses (1 min)": "Butt kicks (1 min)",
  "Pas chassés latéraux (1 min)": "Side shuffles (1 min)",
  "Burpees lents (1 min)": "Slow burpees (1 min)",
  "Rotations de la tête": "Head rotations",
  "Cercles des épaules (15 s avant / 15 s arrière)": "Shoulder circles (15 s forward / 15 s backward)",
  "Rotations des bras": "Arm circles",
  "Rotations des coudes": "Elbow rotations",
  "Rotations des poignets": "Wrist rotations",
  "Torsion du tronc": "Torso twists",
  "Élévation des bras au-dessus de la tête": "Overhead arm raises",
  "Inclinaisons latérales du tronc": "Side bends",
  "Rotation du thorax": "Thoracic rotations",
  "Élévation des épaules": "Shoulder shrugs",
  "Flexion latérale des hanches": "Lateral hip bends",
  "Rotations des hanches": "Hip circles",
  "Rotations des genoux": "Knee circles",
  "Rotations des chevilles (30 s par cheville)": "Ankle circles (30 s per ankle)",
  "1–2 j/semaine : séance HIIT ou Full body.": "1–2 days/week: a HIIT or Full body workout.",
  "3–4 j/semaine : Haut/Bas du corps + Full body, ou Haut/Bas du corps + HIIT.": "3–4 days/week: Upper/Lower body + Full body, or Upper/Lower body + HIIT.",
  "5–6 j/semaine : toutes les séances du programme chaque semaine (+ cardio le dernier jour).": "5–6 days/week: every workout in the program each week (+ cardio on the last day).",
  "Programme salle 12 semaines · Homme": "12-week gym program · Men",
  "Programme salle 12 semaines · Femme": "12-week gym program · Women",
  "Full body à la maison": "Full body at home",
  "Semaines 1 à 4": "Weeks 1 to 4",
  "Semaines 5 à 8 — Intensification": "Weeks 5 to 8 — Intensification",
  "Semaines 9 à 12 — Intensification +": "Weeks 9 to 12 — Intensification +",
  "Toutes les semaines": "Every week",
  "Séance 1 — Bas du corps": "Workout 1 — Lower body",
  "Séance 2 — Haut du corps": "Workout 2 — Upper body",
  "Séance 3 — Bas du corps": "Workout 3 — Lower body",
  "Séance 4 — Haut du corps": "Workout 4 — Upper body",
  "Séance 5 — Full body": "Workout 5 — Full body",
  "Séance 5 — Full body + cardio": "Workout 5 — Full body + cardio",
  "Séance 6 — HIIT cardio": "Workout 6 — HIIT cardio",
  "Séance 6 — HIIT intensifié": "Workout 6 — Intensified HIIT",
  "Séance 4 — HIIT (choisis 1 option)": "Workout 4 — HIIT (pick 1 option)",
  "Séance 6 — Cardio": "Workout 6 — Cardio",
  "Séance 1 — Full body": "Workout 1 — Full body",
  "Séance 2 — Full body": "Workout 2 — Full body",
  "Séance 3 — Full body": "Workout 3 — Full body",
  "Séance bonus — Circuit": "Bonus workout — Circuit",
  "Circuit à répéter 4 à 5 fois selon le niveau.": "Repeat the circuit 4 to 5 times, depending on your level.",
  "30 s travail / 30 s repos — 3 tours. Progression : à la fin de chaque semaine, réduis le repos à 20 s.": "30 s work / 30 s rest — 3 rounds. Progression: at the end of each week, cut the rest to 20 s.",
  "40 s travail / 20 s repos — 4 tours. Progression : passe à 5 tours en semaines 7 et 8.": "40 s work / 20 s rest — 4 rounds. Progression: go up to 5 rounds in weeks 7 and 8.",
  "50 s travail / 10 s repos — 5 tours. Dernière semaine : si possible, repos réduit à 5 s.": "50 s work / 10 s rest — 5 rounds. Last week: if you can, cut the rest to 5 s.",
  "30 min à intensité moyenne (marche rapide en pente, vélo elliptique…).": "30 min at moderate intensity (brisk incline walking, elliptical…).",
  "45 min à intensité moyenne (marche rapide en pente, vélo elliptique…).": "45 min at moderate intensity (brisk incline walking, elliptical…).",
  "60 min à intensité moyenne (marche rapide en pente, vélo elliptique…).": "60 min at moderate intensity (brisk incline walking, elliptical…).",
  "4 à 8 tours. 30 à 45 s d'action par exercice, le maximum de répétitions. 5 s de repos entre les exercices, 1 min 30 après chaque tour. Progression : commence par 4 tours de 30 s ; quand c'est trop facile, passe à 45 s ; puis ajoute un tour, et ainsi de suite.": "4 to 8 rounds. 30 to 45 s of work per exercise, as many reps as you can. 5 s of rest between exercises, 1 min 30 s after each round. Progression: start with 4 rounds of 30 s; when that gets too easy, go to 45 s; then add a round, and so on.",
  "5 min : Jumping jacks, Mountain climbers": "5 min: Jumping jacks, Mountain climbers",
  "5 min : Corde à sauter sans corde, High knees": "5 min: Jump rope without a rope, High knees",
  "5 min : Squats, Fentes": "5 min: Squats, Lunges",
  "5 min : High knees, Cercles de bras": "5 min: High knees, Arm circles",
  "5 min : Jumping jacks, Fentes": "5 min: Jumping jacks, Lunges",
  "5 min : Fentes dynamiques, Squats sautés": "5 min: Dynamic lunges, Jump squats",
  "5 min : Corde à sauter sans corde, Mountain climbers": "5 min: Jump rope without a rope, Mountain climbers",
  "5 min : Jumping jacks, Squats": "5 min: Jumping jacks, Squats",
  "5 min : Squats, Fentes sautées": "5 min: Squats, Jump lunges",
  "Dropset sur la dernière série": "Dropset on the last set",
  "10 / jambe": "10 / leg",
  "15 / jambe": "15 / leg",
  "12 / jambe": "12 / leg",
  "10 / jambe + 5": "10 / leg + 5",
  "10-12 / jambe": "10-12 / leg",
  "8-12 / côté": "8-12 / side",
  "Le plus longtemps possible": "As long as you can",
  "3 séances pour tout le corps, à faire chez toi. Des haltères et un tapis suffisent ; sans haltères, une bouteille d'eau ou rien du tout.": "3 full-body workouts to do at home. Dumbbells and a mat are all you need; no dumbbells? Use a water bottle, or nothing at all.",
  "Vise le haut de la plage de répétitions (ex. 10-15 : essaie d'aller à 15). Si tu t'arrêtes à 10 ou 12, c'est normal : tu progresseras au fil des semaines.": "Aim for the top of the rep range (e.g. 10-15: try to reach 15). If you stop at 10 or 12, that's normal: you'll improve week after week.",
  "Trop dur ? Fais l'exercice sans poids. Planche : commence sur les genoux. Pompes : sur les genoux, ou les mains sur un petit meuble.": "Too hard? Do the exercise without weights. Plank: start on your knees. Push-ups: on your knees, or with your hands on a low piece of furniture.",
  "Ton programme": "Your program", "Changer de programme": "Change program", "Choisis ton programme": "Choose your program",
  "Voir mes séances": "See my workouts", "Combien de séances ?": "How many workouts?", "Échauffement": "Warm-up",
  "Cardio": "Cardio", "Haut du corps": "Upper body", "Bas du corps": "Lower body",
  "Semaines {p}": "Weeks {p}", "Semaines": "Weeks", "Options": "Options", "Semaine {n} sur 12": "Week {n} of 12", "Tes 12 semaines sont faites : recommence ou change de programme.": "Your 12 weeks are done: start over or change program.",
  "Facultative": "Optional", "Superset": "Superset", "Dropset": "Dropset", "HIIT": "HIIT", "Circuit": "Circuit",
  "{n} exercice": "{n} exercise", "{n} exercices": "{n} exercises", "{n} options": "{n} options",
  "{s} × {r}": "{s} × {r}", "Repos {r}": "Rest {r}", "{t} travail / {r} repos": "{t} work / {r} rest",
  "Vidéo": "Video", "Voir la vidéo : {nom}": "Watch the video: {nom}",
  "Enchaîne ces exercices sans repos entre eux, puis récupère.": "Do these exercises back to back with no rest in between, then recover.",
  "Retour au programme": "Back to the program", "La méthode": "The method",
  "À la salle · Homme": "Gym · Men", "À la salle · Femme": "Gym · Women", "À la maison · Homme ou femme": "At home · Men or women",
  "Programme actuel": "Current program", "Choisir": "Choose", "Ce programme commence aujourd'hui.": "This program starts today.",
  "Ton programme est choisi.": "Your program is set.", "Non enregistré : réessaie dans un instant.": "Not saved: try again in a moment.",
  "Ton objectif et ton profil n'indiquent pas encore de programme : choisis celui qui te convient. Tu pourras en changer quand tu veux.": "Your goal and profile don't point to a program yet: choose the one that suits you. You can change it anytime.",
  "Tu peux changer de programme quand tu veux : il recommence à la semaine 1.": "You can change programs anytime: it starts over at week 1.",
  "Séance introuvable.": "Workout not found.", "À choisir": "To choose",
  "Les programmes de la formation": "The course programs",
  "En plus du programme de ton coach : 3 programmes prêts à suivre (salle homme, salle femme, full body à la maison), avec la vidéo de chaque exercice.": "On top of your coach's program: 3 ready-to-follow programs (men's gym, women's gym, full body at home), with a video for every exercise.",
  "Voir les programmes": "See the programs",
  /* v87 (mission de nuit du 14/10) : deux noms du PDF qui ne sont plus reliés à un exercice de l'app (avant : « Tractions »,
     « Curl barre », traduits par le catalogue) */
  "Tractions assistées": "Assisted pull-ups",
  "Curl barre EZ": "EZ-bar curl",
  /* v90 (lot 5) : « J'ai fait cette séance » */
  "J'ai fait cette séance ✓": "I did this workout ✓",
  "Fait le {d}": "Done on {d}",
  "Noté : fait le {d}.": "Saved: done on {d}.",
  "Déjà noté aujourd'hui.": "Already saved today.",
  "Bravo, séance notée !": "Nice work, workout saved!",
  "Aucune séance faite cette semaine": "No workouts done this week",
  "{n} séance faite cette semaine": "{n} workout done this week",
  "{n} séances faites cette semaine": "{n} workouts done this week",
  "Séances de la formation faites (30 j) :": "Course workouts done (30 days):"
});

/* ------------------------------------------------------------------
   PROGFORMATION (v85) — l'attribution, le choix, la phase du moment et les écrans (programme, séance, choix).
   Le choix et sa date de début : SANS MIGRATION, dans la clé « prefs » de la personne (celle de la langue, lue au démarrage
   pour tous les comptes), champ prog_formation = { id, debut "AAAA-MM-JJ" (date locale) } ; écrit seulement quand la personne
   choisit (« Changer de programme »), par lecture puis fusion (la langue et tout autre champ gardés) ; jamais à l'affichage ;
   jamais par le coach. Sans choix : le programme attribué (objectif × sexe, tableau validé par Lucas), début = le jour du
   parcours (intake.parcours_le) s'il existe, sinon la semaine 1.
   Adresses : #/programme (prospect : la page verrouillée de son onglet Programme, la carte 🔒 dessous) ou #/programme/formation
   (client : en plus du programme de son coach) ; #/programme/seance/<id>/<phase>/<séance> ; #/programme/choisir.
   ------------------------------------------------------------------ */
const ProgFormation = {
  IDS: ["salle-homme", "salle-femme", "maison"],
  /* objectif (parcours, tel quel) × sexe → programme ; « Prendre du muscle » : la séance 6 est marquée « Facultative » */
  ATTRIBUTION: { "Perdre du gras": { Homme: "salle-homme", Femme: "salle-femme" }, "Prendre du muscle": { Homme: "salle-homme", Femme: "salle-femme" },
    "Me remettre en forme": { Homme: "maison", Femme: "maison" } },
  FACULTATIVE: { "Prendre du muscle": 6 },
  programme(id){ return (PF_DONNEES.programmes || []).find(p => p && p.id === id) || null; },
  /* l'objectif du parcours (intake.probleme, réponse exacte) ; à défaut celui du questionnaire complet, lu par la table
     CONFIG.decouverte.objectif_depuis (« Perte de poids / sèche » → « Perdre du gras »…) ; sinon null */
  objectif(I){
    I = I && typeof I === "object" ? I : {};
    if (typeof I.probleme === "string" && this.ATTRIBUTION[I.probleme.trim()]) return I.probleme.trim();
    const t = (CONFIG.decouverte && CONFIG.decouverte.objectif_depuis) || {};
    const o = typeof I.objectif === "string" ? I.objectif.trim() : "";
    return Object.keys(t).find(k => t[k] === o && this.ATTRIBUTION[k]) || null;
  },
  sexe(I){ const s = I && typeof I.sexe === "string" ? I.sexe.trim() : ""; return s === "Homme" || s === "Femme" ? s : null; },
  /* le programme attribué ; null sans objectif ou sans sexe (la personne choisit elle-même), sauf « Me remettre en forme » :
     la maison pour tous */
  attribue(I){
    const o = this.objectif(I); if (!o) return null;
    const s = this.sexe(I), A = this.ATTRIBUTION[o];
    if (s) return A[s];
    return A.Homme === A.Femme ? A.Homme : null;
  },
  dateValide(d){
    const m = typeof d === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(d) : null; if (!m) return false;
    const x = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return x.getUTCFullYear() === +m[1] && x.getUTCMonth() === +m[2] - 1 && x.getUTCDate() === +m[3];
  },
  /* le choix rangé (prefs.prog_formation), vérifié ; null s'il est absent ou illisible */
  choix(pr){
    const c = pr && typeof pr === "object" && !Array.isArray(pr) ? pr.prog_formation : null;
    if (!c || typeof c !== "object" || this.IDS.indexOf(c.id) === -1) return null;
    return { id: c.id, debut: this.dateValide(c.debut) ? c.debut : null };
  },
  /* tout ce qu'un écran doit savoir */
  etat(I, pr){
    const c = this.choix(pr), att = this.attribue(I), id = c ? c.id : att;
    const debut = c ? c.debut : (I && Decouverte.dateLocale(I.parcours_le)) || null;
    return { id, p: this.programme(id), debut, choisi: !!c, attribue: att, objectif: this.objectif(I) };
  },
  /* la semaine du programme (1 = la semaine de la date de début ; comptée en jours de calendrier, sans fuseau ni heure d'été) ;
     null sans date ; 0 avant le début */
  semaine(debut){
    const j = this.dateValide(debut) ? Decouverte.joursEcoules(debut) : null;
    if (j == null) return null;
    return j < 0 ? 0 : Math.floor(j / 7) + 1;
  },
  /* l'onglet de phase du moment (0, 1, 2) : semaines 1-4, 5-8, 9-12 ; après la 12e, la dernière */
  phaseDu(p, debut){
    if (!p || p.phases.length < 2) return 0;
    const s = this.semaine(debut);
    return !s ? 0 : Math.min(p.phases.length - 1, Math.floor((s - 1) / 4));
  },
  facultative(E, p, si){ const n = this.FACULTATIVE[E.objectif]; return !!(n && p && p.lieu === "salle" && si === n - 1); },
  LIEUX: { "salle-homme": "À la salle · Homme", "salle-femme": "À la salle · Femme", maison: "À la maison · Homme ou femme" },
  /* la base de l'adresse : le prospect a la page de son onglet Programme ; le client, une sous-page de « Mon programme » */
  page(){ return Auth.estProspect() ? "#/programme" : "#/programme/formation"; },
  /* ce que l'écran courant demande : { vue: "page" | "seance" | "choisir", … } d'après la sous-adresse */
  route(sr){
    const x = String(sr || "").split("/");
    if (x[0] === "seance") return { vue: "seance", id: x[1], ph: +x[2], si: +x[3] };
    if (x[0] === "choisir") return { vue: "choisir" };
    return { vue: "page" };
  },
  /* une sous-adresse de #/programme qui appartient aux programmes de la formation */
  sous(sr){ return /^(formation|seance|choisir)(\/|$)/.test(String(sr || "")); },
  zoneHTML(){ return `<div id="pf-zone" class="pf"><section class="panel"><div class="empty">${esc(trad("Chargement…"))}</div></section></div>`; },
  /* lecture : intake et prefs de la personne (jamais d'écriture ici) ; une lecture ratée (réseau) : null.
     v90 : un client (lui-même, pas le coach qui consulte) lit aussi ses séances faites (seances_formation) ; le prospect, non :
     son onglet Programme reste la vitrine verrouillée, sans autre lecture ni écriture */
  async lire(){
    const avecFaites = this.faitesOuvertes();
    const [I, pr, F] = await Promise.all([Store.lire("intake", {}), Store.lire("prefs", {}), avecFaites ? Store.lire(this.CLE_FAITES, { v: 1, faites: [] }) : Promise.resolve(null)]);
    if (!I || !pr || Store.nonLus.has(I) || Store.nonLus.has(pr)) return null;
    if (avecFaites && (!F || Store.nonLus.has(F))) return null;
    return { I, pr, faites: avecFaites ? this.faitesDe(F) : null };
  },
  /* ---------- v90 (mission de nuit du 14/10/2026, lot 5) : « J'AI FAIT CETTE SÉANCE » ----------
     La date de chaque séance faite des programmes de la formation, rangée À PART, à la personne, SANS MIGRATION, dans la clé
     « seances_formation » = { v: 1, faites: [{ p: id du programme, f: n° de phase, s: n° de séance, d: "AAAA-MM-JJ" (date
     locale), t: instant ISO }] } (400 au plus : les plus anciennes partent). Rien n'est écrit dans le journal du programme du
     coach : son compteur de la semaine et sa régularité ne changent pas. Écrit seulement au toucher du bouton (la clé est
     relue d'abord ; la même séance déjà notée le même jour ne l'est pas deux fois). Seulement pour un client lui-même ; le coach
     la lit (« Séances de la formation faites (30 j) : N », onglet Suivi de la fiche) ; le prospect n'a pas le bouton. */
  CLE_FAITES: "seances_formation",
  MAX_FAITES: 400,
  faitesOuvertes(){ return !!(Auth.utilisateur() && !Auth.estProspect() && !Auth.estCoach() && !Store.idConsulte); },
  /* les entrées lisibles seulement (une ligne abîmée ou écrite hors de l'app est ignorée, jamais réécrite à l'affichage) */
  faitesDe(v){
    const l = v && typeof v === "object" && Array.isArray(v.faites) ? v.faites : [];
    return l.filter(x => x && typeof x === "object" && this.IDS.indexOf(x.p) > -1 && Number.isInteger(x.f) && x.f >= 0 && Number.isInteger(x.s) && x.s >= 0 && this.dateValide(x.d));
  },
  /* la dernière date où cette séance a été faite, ou null */
  faiteLe(F, id, ph, si){ let d = null; (F || []).forEach(x => { if (x.p === id && x.f === ph && x.s === si && (!d || x.d > d)) d = x.d; }); return d; },
  /* le lundi et le dimanche de la semaine en cours (dates locales) */
  semaineEnCours(){ const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); const l = new Date(t); t.setDate(t.getDate() + 6);
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); return [iso(l), iso(t)]; },
  faitesCetteSemaine(F){ const [a, z] = this.semaineEnCours(); return (F || []).filter(x => x.d >= a && x.d <= z).length; },
  /* le coach : séances faites ces 30 derniers jours (aujourd'hui compris) */
  faites30j(v){ const F = this.faitesDe(v), j = Decouverte.joursEcoules; return F.filter(x => { const n = j(x.d); return n != null && n >= 0 && n < 30; }).length; },
  semaineHTML(F){ const n = this.faitesCetteSemaine(F); return esc(trad(!n ? "Aucune séance faite cette semaine" : n > 1 ? "{n} séances faites cette semaine" : "{n} séance faite cette semaine", { n })); },
  /* « J'ai fait cette séance » : relit la clé, ajoute la date du jour (une fois par séance et par jour), écrit ; renvoie
     "ok", "deja" ou "ko" (lecture ratée, écriture refusée) */
  async noter(id, ph, si){
    if (!this.faitesOuvertes()) return "ko";
    let v = null;
    try { v = await Store.lire(this.CLE_FAITES, { v: 1, faites: [] }); } catch(e){ v = null; }
    if (!v || typeof v !== "object" || Store.nonLus.has(v)) return "ko";
    const brut = Array.isArray(v.faites) ? v.faites.slice() : [], jour = aujourdhui();
    if (brut.some(x => x && x.p === id && x.f === ph && x.s === si && x.d === jour)){ if (this._D) this._D.faites = this.faitesDe(v); return "deja"; }
    brut.push({ p: id, f: ph, s: si, d: jour, t: new Date().toISOString() });
    const nv = Object.assign({}, v, { v: 1, faites: brut.slice(-this.MAX_FAITES) });
    if (Store.ecrire(this.CLE_FAITES, nv) === false) return "ko";
    try { await Promise.race([Store.envoyerCle(this.CLE_FAITES), new Promise(r => setTimeout(r, 6000))]); } catch(e){}
    if (this._D) this._D.faites = this.faitesDe(nv);
    return "ok";
  },
  async monter(zone, sr){
    if (!zone) return;
    let D = null; try { D = await this.lire(); } catch(e){ D = null; }
    if (!zone.isConnected) return;
    /* v71 (F) : une lecture ratée n'est pas « aucun programme » : « Pas de connexion » et Réessayer, comme partout */
    if (!D){ pageHorsLigne(zone); return; }
    this._D = D;
    this.dessiner(zone, sr);
  },
  dessiner(zone, sr){
    const D = this._D || { I: {}, pr: {} }, E = Object.assign(this.etat(D.I, D.pr), { faites: D.faites || null }), R = this.route(sr);
    if (R.vue === "seance") zone.innerHTML = this.seanceHTML(E, R);
    else if (R.vue === "choisir" || !E.p) zone.innerHTML = this.choisirHTML(E);
    else zone.innerHTML = this.pageHTML(E);
    this.brancher(zone, sr);
  },
  /* ---------- la page du programme ---------- */
  pageHTML(E){
    /* « Semaine n sur 12 » : seulement pour un programme de 12 semaines (la maison n'a qu'une phase, sans durée) */
    const p = E.p, ph = this.phaseDu(p, E.debut), s = p.phases.length > 1 ? this.semaine(E.debut) : null, P = PF_DONNEES;
    const onglets = p.phases.length > 1 ? `<div class="pf-onglets" role="tablist" aria-label="${esc(trad("Semaines"))}">${p.phases.map((f, i) =>
      `<button type="button" role="tab" id="pf-o-${i}" aria-controls="pf-ph-${i}" aria-selected="${i === ph}" data-pf-phase="${i}" aria-label="${esc(trad("Semaines {p}", { p: f.semaines }))}"><small aria-hidden="true">${esc(trad("Semaines"))}</small><b aria-hidden="true">${esc(f.semaines)}</b></button>`).join("")}</div>` : "";
    const phases = p.phases.map((f, i) => `<div class="pf-phase" id="pf-ph-${i}" role="${p.phases.length > 1 ? "tabpanel" : "region"}"${p.phases.length > 1 ? ` aria-labelledby="pf-o-${i}"` : ""}${i === ph ? "" : " hidden"}>
      <h3 class="pf-phase-t">${esc(trad(f.titre))}</h3>
      <ul class="pf-seances">${f.seances.map((sc, si) => this.ligneHTML(E, p, i, si, sc)).join("")}</ul></div>`).join("");
    return `<section class="panel pf-tete" id="pf-tete">
        <div class="pf-tete-haut"><div><span class="eyebrow">${esc(trad("Ton programme"))}</span><h2 id="pf-nom">${esc(trad(p.nom))}</h2>
          ${E.faites ? `<p class="note pf-faites-sem" id="pf-faites-sem">${this.semaineHTML(E.faites)}</p>` : ""}
          ${s ? `<p class="note pf-semaine" id="pf-semaine">${esc(s > 12 ? trad("Tes 12 semaines sont faites : recommence ou change de programme.") : trad("Semaine {n} sur 12", { n: s }))}</p>` : ""}</div></div>
        ${Store.idConsulte ? "" : `<a class="btn ghost petit" id="pf-changer" href="#/programme/choisir">${esc(trad("Changer de programme"))}</a>`}
        <details class="pf-combien" id="pf-combien"><summary>${esc(trad("Combien de séances ?"))}</summary><ul>${P.combien.map(x => `<li>${esc(trad(x))}</li>`).join("")}</ul></details>
      </section>
      ${p.methode ? `<section class="panel pf-methode" id="pf-methode"><h2>${esc(trad("La méthode"))}</h2><ul>${p.methode.map(x => `<li>${esc(trad(x))}</li>`).join("")}</ul></section>` : ""}
      <section class="panel pf-liste">${onglets}${phases}</section>`;
  },
  compte(sc){
    if (sc.type === "cardio") return trad("Cardio");
    if (sc.options) return trad("{n} options", { n: sc.options.length });
    const n = (sc.exercices || []).length;
    return trad(n > 1 ? "{n} exercices" : "{n} exercice", { n });
  },
  type(sc){ return sc.type === "hiit" || sc.type === "hiit_options" ? "HIIT" : sc.type === "circuit" ? "Circuit" : sc.type === "cardio" ? "Cardio" : ""; },
  ligneHTML(E, p, ph, si, sc){
    const t = this.type(sc), fac = this.facultative(E, p, si), fl = E.faites ? this.faiteLe(E.faites, p.id, ph, si) : null;   // v90 : « Fait le … »
    return `<li><a class="pf-seance-l" href="#/programme/seance/${esc(p.id)}/${ph}/${si}" data-pf-seance="${ph}-${si}">
      <span class="txt"><b>${esc(trad(sc.nom))}</b><small>${esc(this.compte(sc))}</small>${fl ? `<small class="pf-fait-le">${esc(trad("Fait le {d}", { d: dateFr(fl) }))}</small>` : ""}</span>
      <span class="pf-pastilles">${t ? `<span class="pastille">${esc(trad(t))}</span>` : ""}${fac ? `<span class="pastille accent pf-fac">${esc(trad("Facultative"))}</span>` : ""}</span>
      <span class="fleche" aria-hidden="true">›</span></a></li>`;
  },
  /* ---------- l'écran d'une séance ---------- */
  echauffementHTML(){
    const W = PF_DONNEES.echauffement, l = a => `<ul>${a.map(x => `<li>${esc(trad(x))}</li>`).join("")}</ul>`;
    return `<details class="panel pf-echauffement" id="pf-echauffement"><summary><b>${esc(trad("Échauffement"))}</b> <span class="note">${esc(trad(W.duree))}</span></summary>
      <h4>${esc(trad("Cardio"))}</h4>${l(W.cardio)}<h4>${esc(trad("Haut du corps"))}</h4>${l(W.haut_du_corps)}<h4>${esc(trad("Bas du corps"))}</h4>${l(W.bas_du_corps)}</details>`;
  },
  videoHTML(x){
    const v = idVideo(x.yt); if (!v) return "";
    return `<button type="button" class="btn ghost petit pf-video" data-yt="${esc(v)}" aria-label="${esc(trad("Voir la vidéo : {nom}", { nom: trad(x.nom) }))}"><span aria-hidden="true">▶</span><span>${esc(trad("Vidéo"))}</span></button>`;
  },
  exoHTML(x){
    const chiffres = [];
    if (x.series && x.reps && x.series !== "—") chiffres.push(trad("{s} × {r}", { s: x.series, r: trad(x.reps) }));
    else if (x.reps) chiffres.push(trad(x.reps));
    if (x.travail) chiffres.push(trad("{t} travail / {r} repos", { t: x.travail, r: x.repos || "—" }));
    else if (x.repos && x.repos !== "—") chiffres.push(trad("Repos {r}", { r: x.repos }));
    const tech = x.technique === "superset" ? "Superset" : x.technique === "dropset" ? "Dropset" : "";
    return `<li class="pf-exo"${x.ex ? ` data-ex="${esc(x.ex)}"` : ""}><div class="pf-exo-haut"><b class="pf-exo-nom">${esc(x.nom)}</b>${tech ? `<span class="pastille accent pf-tech">${esc(trad(tech))}</span>` : ""}</div>
      ${chiffres.length ? `<p class="pf-chiffres">${chiffres.map(c => `<span>${esc(c)}</span>`).join("")}</p>` : ""}
      ${x.note ? `<p class="note pf-note">${esc(trad(x.note))}</p>` : ""}${this.videoHTML(x)}</li>`;
  },
  /* les exercices dans l'ordre ; deux lignes « superset » du même groupe, l'une après l'autre, dans un même cadre */
  exosHTML(l){
    let h = "", i = 0;
    while (i < l.length){
      const x = l[i], y = l[i + 1];
      if (x.technique === "superset" && y && y.technique === "superset" && y.groupe === x.groupe){
        h += `<li class="pf-superset"><p class="note">${esc(trad("Enchaîne ces exercices sans repos entre eux, puis récupère."))}</p><ul class="pf-exos">${this.exoHTML(x)}${this.exoHTML(y)}</ul></li>`;
        i += 2;
      } else { h += this.exoHTML(x); i++; }
    }
    return `<ul class="pf-exos">${h}</ul>`;
  },
  seanceHTML(E, R){
    const p = this.programme(R.id), f = p && p.phases[R.ph], sc = f && f.seances[R.si];
    const retour = `<a class="link-a pf-retour" href="${esc(this.page())}" id="pf-retour">‹ ${esc(trad("Retour au programme"))}</a>`;
    if (!sc) return `<section class="panel">${retour}<p class="empty">${esc(trad("Séance introuvable."))}</p></section>`;
    const fac = this.facultative(E, p, R.si), t = this.type(sc);
    let corps = "";
    if (sc.type === "cardio") corps = `<p class="pf-consigne" id="pf-consigne">${esc(trad(sc.consigne || ""))}</p>`;
    else if (sc.type === "hiit_options"){
      corps = `<p class="pf-consigne" id="pf-consigne">${esc(trad(sc.consigne || ""))}</p>
        <div class="pf-onglets" role="tablist" aria-label="${esc(trad("Options"))}">${sc.options.map((o, i) => `<button type="button" role="tab" id="pf-oo-${i}" aria-controls="pf-op-${i}" aria-selected="${i === 0}" data-pf-option="${i}">${esc(trad(o.nom))}</button>`).join("")}</div>
        ${sc.options.map((o, i) => `<div class="pf-option" id="pf-op-${i}" role="tabpanel" aria-labelledby="pf-oo-${i}"${i ? " hidden" : ""}><p class="note">${esc(trad(o.echauffement))}</p>${this.exosHTML(o.exercices)}</div>`).join("")}`;
    } else corps = (sc.consigne ? `<p class="pf-consigne" id="pf-consigne">${esc(trad(sc.consigne))}</p>` : "") + this.exosHTML(sc.exercices || []);
    return `<section class="panel pf-seance-tete">${retour}<span class="eyebrow">${esc(trad(p.nom))} · ${esc(trad(f.titre))}</span>
        <h2 id="pf-seance-nom">${esc(trad(sc.nom))}</h2><p class="pf-pastilles">${t ? `<span class="pastille">${esc(trad(t))}</span>` : ""}${fac ? `<span class="pastille accent pf-fac">${esc(trad("Facultative"))}</span>` : ""}</p></section>
      ${this.echauffementHTML()}
      <section class="panel pf-seance" id="pf-seance" data-type="${esc(sc.type)}">${corps}</section>${E.faites ? this.boutonFaitHTML(E, p, R) : ""}`;
  },
  boutonFaitHTML(E, p, R){
    const fl = this.faiteLe(E.faites, p.id, R.ph, R.si);
    return `<section class="panel pf-fait" id="pf-fait"><button type="button" class="btn" id="pf-fait-btn" data-pf-fait="${esc(p.id)}/${R.ph}/${R.si}">${esc(trad("J'ai fait cette séance ✓"))}</button>
      <p class="note pf-fait-msg" id="pf-fait-msg" role="status" aria-live="polite">${fl ? esc(trad("Fait le {d}", { d: dateFr(fl) })) : ""}</p></section>`;
  },
  /* ---------- choisir (ou changer de) programme ---------- */
  choisirHTML(E){
    const intro = E.p ? trad("Tu peux changer de programme quand tu veux : il recommence à la semaine 1.") : trad("Ton objectif et ton profil n'indiquent pas encore de programme : choisis celui qui te convient. Tu pourras en changer quand tu veux.");
    return `<section class="panel pf-choisir" id="pf-choisir">${E.p ? `<a class="link-a pf-retour" href="${esc(this.page())}" id="pf-retour">‹ ${esc(trad("Retour au programme"))}</a>` : ""}
      <h2>${esc(trad("Choisis ton programme"))}</h2><p class="note">${esc(intro)}</p>
      <ul class="pf-choix">${this.IDS.map(id => { const p = this.programme(id), actuel = E.id === id;
        return `<li class="pf-choix-l${actuel ? " actuel" : ""}"><span class="txt"><b>${esc(trad(p.nom))}</b><small>${esc(trad(this.LIEUX[id]))}</small></span>
          ${actuel ? `<span class="pastille ok">${esc(trad("Programme actuel"))}</span>` : ""}
          ${Store.idConsulte ? "" : `<button type="button" class="btn${actuel ? " ghost" : ""} petit" data-pf-choisir="${esc(id)}">${esc(trad("Choisir"))}</button>`}</li>`; }).join("")}</ul></section>`;
  },
  /* range le choix : prefs lue d'abord, tous ses champs gardés (la langue…), puis prog_formation = { id, debut: aujourd'hui } */
  async choisir(id){
    if (Store.idConsulte || this.IDS.indexOf(id) === -1) return false;
    let pr = null;
    try { pr = await Store.lire("prefs", {}); } catch(e){ pr = null; }
    if (!pr || typeof pr !== "object" || Store.nonLus.has(pr)) return false;
    const nv = Object.assign({}, pr, { prog_formation: { id, debut: aujourdhui() } });
    if (Store.ecrire("prefs", nv) === false) return false;
    try { await Promise.race([Store.envoyerCle("prefs"), new Promise(r => setTimeout(r, 6000))]); } catch(e){}
    if (this._D) this._D.pr = nv;
    return true;
  },
  brancher(zone, sr){
    $$("[data-pf-phase]", zone).forEach(b => b.addEventListener("click", () => this.onglet(zone, "pf-phase", "pf-ph-", +b.dataset.pfPhase)));
    $$("[data-pf-option]", zone).forEach(b => b.addEventListener("click", () => this.onglet(zone, "pf-option", "pf-op-", +b.dataset.pfOption)));
    /* v90 : « J'ai fait cette séance ✓ » */
    const bf = zone.querySelector("[data-pf-fait]");
    if (bf) bf.addEventListener("click", async () => {
      if (bf.disabled) return;
      const [id, ph, si] = bf.dataset.pfFait.split("/"), msg = zone.querySelector("#pf-fait-msg");
      bf.disabled = true;
      const r = await this.noter(id, +ph, +si);
      if (!zone.isConnected) return;
      bf.disabled = false;
      if (r === "ko"){ UI.toast(trad("Non enregistré : réessaie dans un instant."), "attention"); return; }
      if (msg) msg.textContent = r === "deja" ? trad("Déjà noté aujourd'hui.") : trad("Noté : fait le {d}.", { d: dateFr(aujourdhui()) });
      if (r === "ok") UI.toast(trad("Bravo, séance notée !"), "ok");
    });
    $$("[data-pf-choisir]", zone).forEach(b => b.addEventListener("click", async () => {
      b.disabled = true;
      const ok = await this.choisir(b.dataset.pfChoisir);
      if (!zone.isConnected) return;
      if (!ok){ b.disabled = false; UI.toast(trad("Non enregistré : réessaie dans un instant."), "attention"); return; }
      UI.toast(trad("Ton programme est choisi.") + " " + trad("Ce programme commence aujourd'hui."), "ok");
      if (location.hash === this.page()) this.dessiner(zone, ""); else location.hash = this.page();
    }));
    /* la vidéo : comme les démonstrations de la séance découverte (YouTube seulement, une à la fois) */
    $$("[data-yt]", zone).forEach(bt => bt.addEventListener("click", () => {
      const v = idVideo(bt.dataset.yt); if (!v) return;
      $$(".video-cadre", zone).forEach(cd => { if (cd._bouton && cd.parentNode) cd.parentNode.replaceChild(cd._bouton, cd); });
      const cadre = document.createElement("div"); cadre.className = "video-cadre"; cadre._bouton = bt;
      cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v}?rel=0&autoplay=1" title="${esc(trad("Démonstration de l'exercice"))}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      bt.parentNode.replaceChild(cadre, bt);
    }));
  },
  onglet(zone, attr, pre, i){
    $$("[data-" + attr + "]", zone).forEach(b => b.setAttribute("aria-selected", String(+b.getAttribute("data-" + attr) === i)));
    $$("[id^='" + pre + "']", zone).forEach(d => { d.hidden = d.id !== pre + i; });
  },
  /* ---------- la carte de l'accueil (prospect, ou client sans programme de son coach) ---------- */
  carteHTML(I, pr){
    const E = this.etat(I, pr), p = E.p, f = p ? p.phases[this.phaseDu(p, E.debut)] : null;
    return `<section class="panel pf-carte" id="pf-carte"><h2>${esc(trad("Ton programme"))}</h2>
      <p class="pf-carte-nom"><b>${esc(p ? trad(p.nom) : trad("À choisir"))}</b>${f ? `<br><span class="note">${esc(trad(f.titre))}</span>` : ""}</p>
      <div class="actions"><a class="btn ghost" id="pf-carte-go" href="${esc(this.page())}">${esc(trad("Voir mes séances"))}</a></div></section>`;
  },
  /* la section du client sous le programme de son coach (« Mon programme ») */
  lienHTML(){
    return `<section class="panel pf-lien" id="pf-lien"><h2>${esc(trad("Les programmes de la formation"))}</h2>
      <p class="note" style="margin:0">${esc(trad("En plus du programme de ton coach : 3 programmes prêts à suivre (salle homme, salle femme, full body à la maison), avec la vidéo de chaque exercice."))}</p>
      <div class="actions"><a class="btn ghost" href="#/programme/formation" id="pf-lien-go">${esc(trad("Voir les programmes"))}</a></div></section>`;
  }
};
