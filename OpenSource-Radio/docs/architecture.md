# Architecture

## Principe général

OpenSource Radio sépare clairement quatre couches :

- la bibliothèque audio ;
- le moteur radio ;
- l'exposition publique ;
- le site web ou les applications clientes.

```text
/home/votreradio/Musique
  -> scan_music_library.py
  -> generate_pools.py
  -> /home/votreradio/radio/pools/*.m3u
  -> Liquidsoap
  -> Icecast2 sur 127.0.0.1:8000
  -> Nginx HTTPS sur 443
  -> Internet
```

## Composants

### Ubuntu 24.04 LTS

La référence de départ est Ubuntu 24.04 LTS. Pour un déploiement public, Ubuntu Server 24.04 LTS est préférable à une version desktop : moins de services, moins de surface d'attaque, moins de charge inutile.

Debian stable est une alternative raisonnable si les versions disponibles de Liquidsoap et ffmpeg conviennent au projet.

### Liquidsoap

Liquidsoap est le cœur de la radio :

- lecture des sources audio ;
- scheduler hebdomadaire ;
- priorité du direct ;
- métadonnées ;
- génération de `nowplaying.json` et `current-show.json` via scripts ;
- sorties Icecast en Opus et MP3.

Le fichier de référence est :

```text
/home/votreradio/radio/liquidsoap/radio.liq
```

### Icecast2

Icecast2 reçoit les sorties Liquidsoap et expose les mounts locaux :

- `/stream` en Opus ;
- `/stream.mp3` en MP3 pour le web.

Icecast peut écouter localement ou sur le LAN, mais l'accès public direct à son interface doit rester bloqué. Le public passe par Nginx.

### Nginx

Nginx assure :

- la terminaison TLS ;
- le reverse proxy vers Icecast ;
- les headers CORS pour les endpoints ;
- l'exposition statique de `/var/www/html/*.json` et `/var/www/html/history/`.

### systemd

systemd pilote :

- Liquidsoap ;
- Icecast2 ;
- Nginx ;
- les timers d'exploitation ;
- la génération périodique des JSON.

La chaîne nocturne recommandée :

```text
04:00  nettoyage artefacts macOS
04:05  régénération des pools .m3u
04:10  redémarrage propre de Liquidsoap
```

## Ports

Ports publics typiques :

- `80/tcp` : redirection HTTP vers HTTPS ;
- `443/tcp` : Nginx HTTPS ;
- `18005/tcp` : entrée live Liquidsoap, seulement si vous acceptez un direct externe.

Ports internes ou LAN :

- `8000/tcp` : Icecast2 ;
- `22/tcp` : SSH ;
- `445/tcp` : SMB, seulement si vous partagez la bibliothèque sur le LAN.

Le port `18005` est un exemple. Choisissez votre propre port, gardez-le hors documentation publique si possible, et protégez l'entrée live par mot de passe fort. Si le live externe n'est pas utile, ne l'exposez pas.

## Endpoints publics

Les endpoints publics ne révèlent pas l'administration Icecast :

- `nowplaying.json` : titre lu ;
- `current-show.json` : bloc, émission ou direct réellement entendu ;
- `listeners.json` : nombre d'auditeurs sur le mount web ;
- `history/nowplaying.csv` : historique public de diffusion ;
- `history/nowplaying.jsonl` : historique structuré, optionnel.

## Site web

Le site peut être un site statique, par exemple hébergé sur GitHub Pages ou tout autre hébergeur statique. Il consomme uniquement :

- le flux MP3 ;
- les endpoints JSON ;
- le CSV d'historique si besoin.

Il n'a pas besoin d'accéder à Icecast directement.
