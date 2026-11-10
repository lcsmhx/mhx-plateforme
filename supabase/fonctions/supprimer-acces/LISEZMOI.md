# supprimer-acces — version du dépôt (v103 + v104), pas encore déployée

La version en ligne est celle d'avant (même code que `supabase/releve-2026-09-30/fonctions/supprimer-acces/index.ts`).

**Ce qui change** : quand un compte est supprimé (par le client lui-même ou par le coach), son brouillon de programme et
son brouillon de diète, rangés sur le compte du coach (`brouillons_programme`, `brouillons_repas`), sont retirés aussi.
Les brouillons des autres clients ne bougent pas. Si ce retrait échoue, rien n'est supprimé et le bouton peut être
retouché. Test : `tests-locaux/verif103.js` (au banc).

**Ce qui change en v104** (toujours pas déployée) :
- Si le coach tape dans la fiche de ce client au moment de la suppression, son brouillon ne revient plus : après
  l'effacement du compte, la fonction refait un passage sur les brouillons (au mieux, sans faire échouer la réponse).
  L'app (v104) garde aussi la marque du serveur (`appareil: "serveur"`) au lieu d'y réécrire la saisie de la page.
- Les brouillons ne sont lus que sur les comptes coach (liste des profils `role = coach`, puis leurs lignes).
- Messages d'échec exacts : si l'effacement des photos échoue, « Suppression interrompue : le compte n'est pas supprimé,
  mais une partie des photos a pu être effacée. Réessaie. » (au lieu de « rien n'a été supprimé », faux à ce moment) ;
  si les brouillons ne sont mis à jour qu'en partie, « … qu'en partie : le compte n'est pas supprimé. Réessaie. ».
  Traductions anglaises dans `js/i18n.js`. Test : `tests-locaux/verif104.js`.

**Déployer** (seulement avec un « ok » écrit de Lucas, séparé) :
1. Sauvegarde : Supabase → Edge Functions → `supprimer-acces` → copier le code en ligne dans un fichier hors dépôt
   (`~/MHX-Code/sauvegardes/<date>-avant-supprimer-acces-v104/`), et vérifier qu'il est identique à la copie du relevé.
2. Coller le contenu de `index.ts` de ce dossier → Deploy (aucune clé ni réglage à changer).
3. Vérifier, sans rien supprimer : la fonction répond « Confirmation manquante. » (400) à un appel sans le mot SUPPRIMER.

**Retour arrière** : recoller la copie de l'étape 1 → Deploy.
