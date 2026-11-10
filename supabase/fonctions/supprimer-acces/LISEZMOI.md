# supprimer-acces — version du dépôt (v103), pas encore déployée

La version en ligne est celle d'avant (même code que `supabase/releve-2026-09-30/fonctions/supprimer-acces/index.ts`).

**Ce qui change** : quand un compte est supprimé (par le client lui-même ou par le coach), son brouillon de programme et
son brouillon de diète, rangés sur le compte du coach (`brouillons_programme`, `brouillons_repas`), sont retirés aussi.
Les brouillons des autres clients ne bougent pas. Si ce retrait échoue, rien n'est supprimé et le bouton peut être
retouché. Test : `tests-locaux/verif103.js` (au banc).

**Déployer** (seulement avec un « ok » écrit de Lucas, séparé) :
1. Sauvegarde : Supabase → Edge Functions → `supprimer-acces` → copier le code en ligne dans un fichier hors dépôt
   (`~/MHX-Code/sauvegardes/<date>-avant-supprimer-acces-v103/`), et vérifier qu'il est identique à la copie du relevé.
2. Coller le contenu de `index.ts` de ce dossier → Deploy (aucune clé ni réglage à changer).
3. Vérifier, sans rien supprimer : la fonction répond « Confirmation manquante. » (400) à un appel sans le mot SUPPRIMER.

**Retour arrière** : recoller la copie de l'étape 1 → Deploy.
