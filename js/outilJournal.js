/* ------------------------------------------------------------------
   v52 — « Mon journal » : en v52, une page VERROUILLEE de la vitrine du prospect
   seulement (CONFIG.marque.gratuit_vitrine ; l'exemple d'une seance notee :
   Echantillons.journal, lot E). Ni le client ni le coach ne le voient
   (prospect_seul) : l'onglet du client (cle journal, objet Journal) est prevu
   pour la v53. Aucune cle : une page verrouillee ne lit ni n'ecrit rien.
   ------------------------------------------------------------------ */
const outilJournal = {
  id: "journal",
  cle: null,
  nom: "Mon journal",
  icone: "📓",
  prospect_seul: true,
  titre: "Ton journal d'entraînement",
  accroche: "Tes séances notées, tes charges et tes progrès, séance après séance.",
  html(){ return ""; },   // jamais affichee : toujours verrouillee pour le prospect (estVerrouille)
  async init(){}
};

