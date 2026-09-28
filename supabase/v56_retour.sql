-- Retour arrière de la v56 (compteur de connexions) SANS RIEN SUPPRIMER : ni DROP, ni DELETE, ni TRUNCATE.
-- La table public.connexions et la fonction public.noter_connexion() restent en place, avec leurs lignes ; on retire
-- seulement les droits :
--   * plus personne ne peut appeler la fonction (l'app reçoit un refus, n'affiche rien et ne réessaie plus avant le
--     prochain chargement) ;
--   * plus personne ne peut lire la table (le coach voit « — » dans les colonnes Connexions et Dernière connexion).
-- Aucune autre table, règle ou fonction n'est touchée. Pour l'app elle-même : git revert du commit v56, puis push.
revoke execute on function public.noter_connexion() from authenticated;
revoke select on table public.connexions from authenticated;

-- Pour rétablir plus tard (même effet que la migration v56) :
--   grant execute on function public.noter_connexion() to authenticated;
--   grant select on table public.connexions to authenticated;
