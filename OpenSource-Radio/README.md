# OpenSource Radio

OpenSource Radio est une documentation technique francophone pour construire une webradio auto-hébergée, programmable, observable et publiable sans dépendance à une plateforme fermée.

Ce dépôt est volontairement anonymisé. Les chemins, domaines, noms de service, exemples de grille et identifiants utilisent `VotreRadio`, `votreradio` et `votreradio.example`. Aucun mot de passe, identifiant personnel, adresse IP réelle, nom de fournisseur ou information matérielle privée n'est nécessaire pour utiliser ces exemples.

## Objectif

Mettre à disposition une base reproductible pour :

- diffuser une radio 24/7 avec Liquidsoap et Icecast2 ;
- exposer le flux public via Nginx en HTTPS ;
- produire des endpoints JSON simples pour un site web ou une app ;
- programmer une grille hebdomadaire sans couper les morceaux ;
- générer automatiquement des pools `.m3u` à partir des métadonnées audio ;
- automatiser la maintenance via systemd ;
- documenter clairement les limites, les arbitrages et les pistes d'amélioration.

## Stack

- Ubuntu 24.04 LTS, idéalement en version Server.
- Liquidsoap pour la programmation, le live, les métadonnées et les sorties Icecast.
- Icecast2 pour les mounts audio.
- Nginx pour le reverse proxy HTTPS et les endpoints publics.
- Certbot / Let's Encrypt pour TLS.
- Python 3 pour les scripts d'exploitation.
- ffmpeg / ffprobe pour analyser la bibliothèque musicale.
- systemd pour les services et timers.

## Architecture courte

```text
Bibliothèque audio
  -> generate_pools.py
  -> playlists .m3u
  -> Liquidsoap
  -> Icecast2
  -> Nginx HTTPS
  -> auditeurs, site web, applications
```

Le public ne consomme pas directement l'interface Icecast. Le flux et les endpoints passent par Nginx :

- `https://stream.votreradio.example/stream.mp3`
- `https://stream.votreradio.example/stream`
- `https://stream.votreradio.example/nowplaying.json`
- `https://stream.votreradio.example/current-show.json`
- `https://stream.votreradio.example/listeners.json`
- `https://stream.votreradio.example/history/nowplaying.csv`

## Structure du dépôt

```text
OpenSource Radio/
├── README.md
├── docs/
├── examples/
│   ├── data/
│   ├── icecast/
│   ├── liquidsoap/
│   ├── logrotate/
│   ├── nginx/
│   └── systemd/
├── scripts/
├── .env.example
├── .gitignore
├── LICENSE.md
└── LICENSES/
```

## Lecture conseillée

1. [Architecture](docs/architecture.md)
2. [Arborescence](docs/arborescence.md)
3. [Installation](docs/installation.md)
4. [Grille et programmation](docs/grille-et-programmation.md)
5. [Endpoints JSON](docs/json-endpoints.md)
6. [Exploitation](docs/exploitation.md)
7. [Sécurité](docs/securite.md)
8. [Forces et faiblesses](docs/forces-faiblesses.md)
9. [Roadmap](docs/roadmap.md)

## Ressources minimales

Pour une radio audio 24/7 avec un flux MP3 et un flux Opus :

- minimum confortable : 2 vCPU, 4 Go de RAM, stockage adapté à la bibliothèque ;
- recommandé : 4 vCPU, 8 Go de RAM, disque SSD pour le système et stockage séparé ou extensible pour l'audio ;
- système conseillé : Ubuntu Server 24.04 LTS ou Debian stable.

La version desktop d'Ubuntu fonctionne, mais une version serveur réduit la surface d'attaque et les services inutiles.

## Licences

- Code et scripts : MIT.
- Documentation, schémas, exemples de configuration et données d'exemple : CC0-1.0.

Voir [LICENSE.md](LICENSE.md).
