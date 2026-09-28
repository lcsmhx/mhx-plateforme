/* ------------------------------------------------------------------
   TRACKING — Événements du diagnostic funnel (v48)
   ------------------------------------------------------------------ */
const Tracking = {
  enregistrer(event_name){
    const uid = Auth.utilisateur() ? Auth.utilisateur().id : "anonymous";
    const timestamp = new Date().toISOString();
    const evt = { event: event_name, uid, timestamp };
    try {
      const cle = "mhx_tracking";
      const historique = JSON.parse(localStorage.getItem(cle) || "[]") || [];
      historique.push(evt);
      if (historique.length > 100) historique.shift();
      localStorage.setItem(cle, JSON.stringify(historique));
    } catch (e) { /* silent */ }
  }
};

