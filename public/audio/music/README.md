# Musique radio — dossier automatique

## Utilisation

1. Déposez vos fichiers **`.mp3`** ici (`public/audio/music/`).
2. C’est tout — **pas de liste à éditer**, pas de `tracks.json` obligatoire.

Le site détecte automatiquement tous les MP3 du dossier.

## Ordre de lecture

- Ordre **aléatoire** (mélangé)
- **Même ordre pour tous les joueurs** (radio synchronisée)
- Si vous ajoutez un nouveau MP3, il sera pris en compte au prochain scan (~1 minute) ou après rechargement de la page

## Nom affiché

Le titre à l’écran est dérivé du nom du fichier :
- `ambiance-bus.mp3` → « ambiance bus »
- `Radio_Nuit.mp3` → « Radio Nuit »

## Déploiement (Vercel)

Après avoir ajouté des MP3, faites un **commit + push** pour que les fichiers soient en ligne sur le serveur.

En local : un simple rechargement de la page suffit (`Ctrl + Shift + R`).

## Musique libre de droits uniquement

Utilisez uniquement des pistes dont vous avez le droit de diffusion.
