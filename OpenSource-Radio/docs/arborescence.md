# Arborescence

Cette arborescence est une convention. Elle peut être adaptée, mais garder des chemins stables simplifie Liquidsoap, systemd et les scripts.

## Répertoire utilisateur

```text
/home/votreradio/
├── Musique/
│   └── Artiste/
│       └── Album/
│           └── piste.flac
└── radio/
    ├── backups/
    ├── config/
    │   └── pools.json
    ├── emissions/
    ├── jingles/
    ├── liquidsoap/
    │   └── radio.liq
    ├── logs/
    │   ├── liquidsoap.log
    │   └── live/
    │       └── direct-access.jsonl
    ├── pools/
    │   ├── bloc-nuit.m3u
    │   ├── bloc-matin.m3u
    │   └── bloc-nuit-endcap.m3u
    ├── annonces/
    ├── reports/
    │   └── genres_durees_musique.csv
    └── scripts/
        ├── append-nowplaying-log.py
        ├── build-direct-log.py
        ├── clean-macos-artifacts.sh
        ├── generate_pools.py
        ├── scan_music_library.py
        ├── write-current-show-json.py
        ├── write-listeners-json.py
        └── write-nowplaying-json.py
```

## Racines système

```text
/etc/icecast2/icecast.xml
/etc/nginx/sites-available/stream.votreradio.example
/etc/nginx/sites-enabled/stream.votreradio.example
/etc/systemd/system/votreradio-*.service
/etc/systemd/system/votreradio-*.timer
/etc/votreradio/radio.env
/var/www/html/
├── current-show.json
├── listeners.json
├── nowplaying.json
└── history/
    ├── nowplaying.csv
    └── nowplaying.jsonl
```

## Permissions

Recommandation simple :

- utilisateur applicatif : `votreradio` ;
- groupe applicatif : `votreradio` ;
- fichiers de travail sous `/home/votreradio` ;
- fichiers publics JSON sous `/var/www/html`, écrits par les scripts autorisés ;
- secrets sous `/etc/votreradio/radio.env`, lisibles seulement par root et par les services qui en ont besoin.

Exemple :

```bash
sudo useradd --system --create-home --home-dir /home/votreradio --shell /usr/sbin/nologin votreradio
sudo mkdir -p /home/votreradio/radio/{annonces,backups,emissions,jingles,liquidsoap,logs/live,pools,reports,scripts}
sudo mkdir -p /var/www/html/history /etc/votreradio
sudo chown -R votreradio:votreradio /home/votreradio /var/www/html
sudo chmod 0750 /etc/votreradio
```

## Convention audio

La bibliothèque musicale peut rester lisible humainement :

```text
Musique/Artiste/Album/01 - Titre.flac
```

La programmation ne dépend pas de cette arborescence. Elle dépend surtout des métadonnées :

- `artist` ;
- `album` ;
- `title` ;
- `genre` ;
- `duration`.

Les fichiers macOS parasites (`.DS_Store`, `._*`) doivent être nettoyés avant génération des pools.
