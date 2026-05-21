# Endpoints JSON

## `nowplaying.json`

Décrit le titre réellement lu.

```json
{
  "artist": "Artiste Exemple",
  "title": "Titre Exemple",
  "album": "Album Exemple",
  "year": "2026",
  "updatedAt": "2026-04-30T12:00:00+02:00"
}
```

## `current-show.json`

Décrit le bloc, l'émission ou le direct réellement entendu.

```json
{
  "show": "Bloc de nuit",
  "kind": "music_block",
  "is_live": false,
  "updatedAt": "2026-04-30T12:00:00+02:00"
}
```

Valeurs possibles pour `kind` :

- `music_block` ;
- `editorial_event` ;
- `editorial_window` ;
- `live` ;
- `dressing`.

## `listeners.json`

Expose un résumé public des statistiques Icecast.

```json
{
  "mount": "/stream.mp3",
  "current": 12,
  "peak": 31,
  "server_listeners": 12,
  "updatedAt": "2026-04-30T12:00:00+02:00"
}
```

## `history/nowplaying.csv`

Historique simple pour le site web.

```csv
timestamp,artist,title,album,year
2026-04-30T12:00:00+02:00,Artiste Exemple,Titre Exemple,Album Exemple,2026
```

## `history/nowplaying.jsonl`

Historique structure, une ligne JSON par événement.

```jsonl
{"timestamp":"2026-04-30T12:00:00+02:00","artist":"Artiste Exemple","title":"Titre Exemple","album":"Album Exemple","year":"2026"}
```

## `direct-access.jsonl`

Journal privé ou semi-privé des tentatives de direct. Par défaut, le script fourni anonymise les IP.

```jsonl
{"ip":"203.0.113.0","try_ts":"2026-04-30T12:00:00+02:00","status":"BLOCK","attempt_count":3}
{"ip":"203.0.113.0","try_ts":"2026-04-30T12:05:00+02:00","live_start_ts":"2026/04/30 12:05:03","live_end_ts":"2026/04/30 12:35:10","duration_on_air_s":1807,"status":"LIVE_OK"}
```

Ne publiez pas ce fichier sans vérifier sa politique d'anonymisation.

## `news.json`

Optionnel pour un site ou une app.

```json
{
  "version": 1,
  "updatedAt": "2026-04-30T12:00:00+02:00",
  "items": [
    {
      "id": "2026-04-30-exemple",
      "date": "2026-04-30",
      "title": "Annonce exemple",
      "lead": "VotreRadio publie une information générique.",
      "body": "Le texte long peut rester dans le site ou dans ce fichier.",
      "url": "https://votreradio.example/actualites/2026-04-30-exemple"
    }
  ]
}
```

Voir [examples/data/news.example.json](../examples/data/news.example.json).
