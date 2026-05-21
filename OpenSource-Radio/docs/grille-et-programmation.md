# Grille et programmation

## Principes

La grille repose sur quelques règles simples :

- tout fichier audio est choisi de manière aléatoire dans une source admissible ;
- les blocs musicaux sont alimentés par des playlists `.m3u` générées ;
- les émissions ponctuelles jouent un épisode puis rendent la main ;
- aucun morceau, jingle, annonce ou épisode n'est coupé ;
- un rendez-vous prévu à une heure donnée part à la prochaine fin de piste disponible ;
- le direct prend la priorité sur l'automate.

## Pools musicaux

Les pools sont générés par `scripts/generate_pools.py` depuis les métadonnées :

- `genre` ;
- `artist` ;
- `album` ;
- `duration`.

Exemple de pools volontairement génériques :

| Pool | Règle |
| --- | --- |
| `bloc-nuit` | tags `night` ou `calm`, morceaux longs |
| `bloc-nuit-endcap` | tags `night` ou `calm`, morceaux courts pour fin de bloc |
| `bloc-matin` | tag `morning`, durée inférieure à 20 min |
| `bloc-journee` | tag `daytime` |
| `bloc-soiree` | tag `evening` |
| `format-court` | durée inférieure à 10 min |
| `format-long` | durée supérieure à 20 min |

## Rotation anti-répétition

La génération des pools applique des garde-fous :

- artiste : éviter le retour trop rapide ;
- album : éviter l'effet album éclaté ;
- titre : éviter la répétition exacte.

Valeurs de départ :

```text
artist_s = 5400
album_s = 10800
title_s = 86400
```

Ces valeurs sont indicatives. Une petite bibliothèque impose parfois des contraintes plus souples.

## Mode endcap

Le mode `endcap` limite les débordements en fin de bloc sans couper l'audio.

Exemple :

- de `00:00` à `06:30`, le bloc de nuit accepte des morceaux longs ;
- de `06:30` à `07:00`, le bloc garde le même nom public, mais bascule vers `bloc-nuit-endcap.m3u`, limité à des morceaux de moins de `15 min`.

Le site continue d'afficher `Bloc de nuit`, car `current-show.json` expose le nom public et non le nom technique du pool.

## Exemple de semaine

```text
Lundi
00:00  Bloc de nuit
07:00  Bloc du matin
10:00  Émission du matin
12:00  Bloc de journée
18:00  Bloc de soirée

Mardi
00:00  Bloc de nuit
07:00  Bloc du matin
12:00  Bloc de journée
18:00  Bloc de soirée

Jeudi
00:00  Bloc de nuit
07:00  Bloc du matin
12:00  Bloc de journée
20:00  Émission du soir
22:00  Bloc de soirée

Dimanche
00:00  Bloc de nuit
07:00  Bloc du matin
12:00  Bloc de journée
18:00  Archives génériques
20:00  Bloc de soirée
```

## Exemple Liquidsoap

Voir [examples/liquidsoap/radio.liq](../examples/liquidsoap/radio.liq).
