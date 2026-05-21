# Installation

Ce guide donne une procédure générique pour Ubuntu Server 24.04 LTS.

## Paquets

```bash
sudo apt update
sudo apt install liquidsoap icecast2 nginx certbot python3-certbot-nginx ffmpeg python3
```

Selon votre distribution, Liquidsoap peut être disponible dans une version plus ancienne. Vérifiez la syntaxe de `radio.liq` avec :

```bash
liquidsoap -c /home/votreradio/radio/liquidsoap/radio.liq
```

## Utilisateur et dossiers

```bash
sudo useradd --system --create-home --home-dir /home/votreradio --shell /usr/sbin/nologin votreradio
sudo mkdir -p /home/votreradio/Musique
sudo mkdir -p /home/votreradio/radio/{annonces,backups,config,emissions,jingles,liquidsoap,logs/live,pools,reports,scripts}
sudo mkdir -p /var/www/html/history /etc/votreradio
sudo chown -R votreradio:votreradio /home/votreradio /var/www/html
```

## Secrets

Ne mettez jamais de secret dans Git.

Copiez `.env.example` vers un fichier système local :

```bash
sudo cp .env.example /etc/votreradio/radio.env
sudo chmod 0640 /etc/votreradio/radio.env
sudo chown root:votreradio /etc/votreradio/radio.env
```

Remplacez toutes les valeurs `CHANGE_ME`.

## Scripts

```bash
sudo install -o votreradio -g votreradio -m 0755 scripts/*.py /home/votreradio/radio/scripts/
sudo install -o votreradio -g votreradio -m 0755 scripts/clean-macos-artifacts.sh /home/votreradio/radio/scripts/
sudo install -o votreradio -g votreradio -m 0644 examples/data/pools.example.json /home/votreradio/radio/config/pools.json
```

## Icecast2

Copiez l'exemple :

```bash
sudo cp examples/icecast/icecast.xml /etc/icecast2/icecast.xml
```

Adaptez :

- les mots de passe ;
- le hostname ;
- la limite de clients ;
- le bind si vous voulez limiter Icecast à `127.0.0.1`.

Puis :

```bash
sudo systemctl restart icecast2
sudo systemctl status icecast2 --no-pager
```

## Liquidsoap

```bash
sudo cp examples/liquidsoap/radio.liq /home/votreradio/radio/liquidsoap/radio.liq
sudo chown votreradio:votreradio /home/votreradio/radio/liquidsoap/radio.liq
liquidsoap -c /home/votreradio/radio/liquidsoap/radio.liq
```

Remplacez les mots de passe `CHANGE_ME` dans l'exemple ou utilisez un mécanisme de templating privé.

## Nginx et TLS

```bash
sudo cp examples/nginx/stream.votreradio.example.conf /etc/nginx/sites-available/stream.votreradio.example
sudo ln -s /etc/nginx/sites-available/stream.votreradio.example /etc/nginx/sites-enabled/stream.votreradio.example
sudo nginx -t
sudo systemctl reload nginx
```

Avec un vrai domaine pointe vers le serveur :

```bash
sudo certbot --nginx -d stream.votre-domaine.example
```

## systemd

```bash
sudo cp examples/systemd/*.service examples/systemd/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now votreradio-listeners-json.timer
sudo systemctl enable --now votreradio-clean-macos-artifacts.timer
sudo systemctl enable --now votreradio-generate-pools.timer
sudo systemctl enable --now votreradio-liquidsoap-restart.timer
```

## Verification

```bash
systemctl status liquidsoap icecast2 nginx --no-pager
systemctl list-timers 'votreradio-*'
curl -i https://stream.votreradio.example/nowplaying.json
curl -i https://stream.votreradio.example/current-show.json
curl -i https://stream.votreradio.example/listeners.json
```
