# Forces et faiblesses

## Forces

- Infrastructure autonome et compréhensible.
- Formats ouverts : `.m3u`, JSON, CSV, JSONL.
- Programmation lisible dans Liquidsoap.
- Aucune coupure de piste : la grille attend les frontières audio.
- Séparation propre entre flux audio, site web et endpoints JSON.
- Icecast non exposé directement si Nginx est bien configuré.
- systemd fournit une exploitation simple et robuste.
- Les pools générés évitent à Liquidsoap de rescanner toute la bibliothèque en continu.
- Le site peut rester statique et léger.

## Faiblesses

- La première version de scheduler reste artisanale : elle est robuste, mais pas encore pilotée par une base de données ou un moteur de grille externe.
- Les réglages Liquidsoap peuvent devenir longs à maintenir si toute la grille est codée à la main.
- La gestion fine des retards repose sur des fenêtres d'éligibilité plutôt que sur un moteur de pending complet.
- Le loudness peut varier fortement si les fichiers sources n'ont pas été analysés ou normalisés.
- L'architecture de base est mono-serveur.
- Le direct externe ajoute une surface d'exposition supplémentaire.
- Les scripts Python doivent être testés après toute évolution des formats de logs Liquidsoap ou Icecast.
- Les endpoints JSON publics doivent rester sobres pour ne pas exposer d'informations d'exploitation.

## Points d'attention

- Garder les secrets hors Git.
- Tester la syntaxe Liquidsoap avant chaque redémarrage.
- Vérifier les pools après ajout massif de musique.
- Surveiller la taille des logs.
- Ne pas exposer `/admin/` ou `status-json.xsl` d'Icecast au public si ce n'est pas nécessaire.
- Documenter chaque changement de grille avant de le déployer.

## Améliorations naturelles

- Générer `radio.liq` depuis un fichier de grille JSON.
- Ajouter un validateur de grille.
- Ajouter un tableau de bord local de supervision.
- Historiser les statistiques d'audience sans stocker d'IP.
- Ajouter une stratégie ReplayGain / LUFS par piste.
- Mettre en place des sauvegardes automatiques chiffrées.
- Ajouter des tests automatisés pour les scripts.
- Packager l'installation avec Ansible ou cloud-init.
