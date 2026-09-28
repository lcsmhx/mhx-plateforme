/* ------------------------------------------------------------------
   ÉCHAUFFEMENTS
   Des routines prêtes, posées en tête de séance quand le coach le
   décide. Les exercices citent leur nom EXACT dans la base : c'est ce
   qui fait que la fiche et la vidéo suivent chez le client.
   ------------------------------------------------------------------ */
const ECHAUFFEMENTS = [
  { id:"osteo", nom:"Ostéo-articulaire", duree:"5 à 6 min",
    pour:"Avant n'importe quelle séance. Réveille les articulations sans fatiguer.",
    exercices:[
      { nom:"Respiration diaphragme assis", series:"1", reps:"6 respirations", repos:"—" },
      { nom:"Rotations d'épaules",          series:"1", reps:"10 dans chaque sens", repos:"—" },
      { nom:"Rotation de tronc assis",      series:"1", reps:"8 par côté", repos:"—" },
      { nom:"Cercles de chevilles assis",   series:"1", reps:"10 par cheville", repos:"—" },
      { nom:"Wall angels",                  series:"2", reps:"8", repos:"30 s" }
    ] },
  { id:"cardio", nom:"Cardio léger", duree:"5 min",
    pour:"Monter la température avant une séance intense ou un circuit.",
    exercices:[
      { nom:"Marche sur place",             series:"1", reps:"2 min", repos:"—" },
      { nom:"Marche sur place genoux hauts",series:"2", reps:"40 s", repos:"20 s" },
      { nom:"Montées de genoux + squats",   series:"2", reps:"30 s", repos:"30 s" }
    ] },
  { id:"haut", nom:"Spécifique haut du corps", duree:"5 min",
    pour:"Avant une séance pectoraux, dos ou épaules.",
    exercices:[
      { nom:"Rotations d'épaules",             series:"1", reps:"10 dans chaque sens", repos:"—" },
      { nom:"Wall angels",                     series:"2", reps:"10", repos:"30 s" },
      { nom:"Ouverture de poitrine à la chaise", series:"1", reps:"30 s par côté", repos:"—" },
      { nom:"Face pull serviette",             series:"2", reps:"12", repos:"30 s" }
    ] },
  { id:"bas", nom:"Spécifique bas du corps", duree:"6 min",
    pour:"Avant une séance jambes, fessiers ou squat lourd.",
    exercices:[
      { nom:"Cercles de chevilles assis",           series:"1", reps:"10 par cheville", repos:"—" },
      { nom:"Flexion de hanche debout avec appui",  series:"1", reps:"10 par jambe", repos:"—" },
      { nom:"Transfert de poids latéral",           series:"2", reps:"8 par côté", repos:"30 s" },
      { nom:"Fente statique courte",                series:"2", reps:"8 par jambe", repos:"30 s" },
      { nom:"Étirements mollets au mur",            series:"1", reps:"30 s par jambe", repos:"—" }
    ] },
  { id:"assis", nom:"Assis, sans impact", duree:"5 min",
    pour:"Reprise, douleurs articulaires, ou séance à la maison sur chaise.",
    exercices:[
      { nom:"Respiration au sol genoux pliés", series:"1", reps:"8 respirations", repos:"—" },
      { nom:"Élévations de genoux assis",      series:"2", reps:"10 par jambe", repos:"30 s" },
      { nom:"Rotation de tronc assis",         series:"1", reps:"8 par côté", repos:"—" },
      { nom:"Équilibre unipodal avec appui",   series:"2", reps:"20 s par jambe", repos:"20 s" }
    ] }
];

