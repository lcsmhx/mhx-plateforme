/* Préchargement facultatif : fait tourner le banc avec le Google Chrome installé sur la machine
   (canal « chrome ») au lieu du Chromium téléchargé par Playwright. Aucun fichier de test à modifier :
     NODE_OPTIONS="--require ./chrome-systeme.js" node rig.js ...                                      */
const pw = require("playwright");
const lancer = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = (options) => lancer(Object.assign({ channel: "chrome" }, options || {}));
