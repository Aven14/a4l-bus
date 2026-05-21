# Site web

Le site public peut rester statique.

## Sources minimales

```js
const STREAM_URL = "https://stream.votreradio.example/stream.mp3";
const NOWPLAYING_URL = "https://stream.votreradio.example/nowplaying.json";
const CURRENT_SHOW_URL = "https://stream.votreradio.example/current-show.json";
const LISTENERS_URL = "https://stream.votreradio.example/listeners.json";
const HISTORY_CSV_URL = "https://stream.votreradio.example/history/nowplaying.csv";
```

## Pages utiles

- accueil / direct ;
- grille ;
- historique ;
- actualités ;
- à propos ;
- contribution ou contact.

## Principe important

Le site ne doit pas déduire le show courant uniquement depuis l'heure théorique de la grille.

La source de vérité est :

- `nowplaying.json` pour le titre ;
- `current-show.json` pour le bloc ou l'émission réellement entendu ;
- `listeners.json` pour les statistiques publiques du flux web.

Cette séparation évite les incohérences quand une piste déborde, quand une émission attend une fin de morceau ou quand un direct prend la priorité.
