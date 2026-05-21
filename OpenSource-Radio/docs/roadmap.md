# Roadmap

## Court terme

- Stabiliser la documentation d'installation.
- Vérifier les exemples systemd, Nginx, Icecast et Liquidsoap sur une machine vierge.
- Ajouter des tests unitaires pour les scripts Python.
- Ajouter un validateur pour `pools.example.json`.
- Documenter une procédure de sauvegarde restaurée.

## Moyen terme

- Remplacer les sections de grille codées à la main dans Liquidsoap par une génération depuis JSON.
- Ajouter une stratégie loudness :
  - scan LUFS hors antenne ;
  - cache par fichier ;
  - annotation des playlists ;
  - limiteur de sécurité en sortie.
- Ajouter un tableau de bord local :
  - statut des services ;
  - derniers titres ;
  - direct ;
  - listeners ;
  - couverture des métadonnées.
- Ajouter une commande de prévol avant déploiement.

## Long terme

- Deploiement reproductible via Ansible.
- Supervision distante sans exposer d'informations sensibles.
- Mode multi-serveur ou relais.
- Interface web pour éditer la grille.
- Publication d'une image ou d'un paquet d'installation.
- Documentation bilingue si une communaute internationale apparait.

## Non-objectifs initiaux

- Remplacer un logiciel de playout professionnel complet.
- Construire une plateforme multi-radios.
- Exposer l'administration Icecast au public.
- Gerer les droits musicaux : chaque radio doit s'assurer de son propre cadre legal.
