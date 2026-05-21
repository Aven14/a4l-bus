# Sécurité

## Règle principale

Ne publiez jamais :

- mots de passe ;
- tokens ;
- identifiants personnels ;
- IP publiques réelles ;
- IP LAN réelles si elles révèlent votre installation ;
- noms de machines privées ;
- noms de fournisseurs ou details contractuels ;
- spécifications matérielles précises si elles ne sont pas utiles au public.

Les exemples utilisent :

- `votreradio` pour l'utilisateur ;
- `VotreRadio` pour la radio ;
- `votreradio.example` pour le domaine ;
- `192.0.2.10` quand une IP d'exemple est nécessaire.

## Secrets

Stockez les secrets hors dépôt :

```text
/etc/votreradio/radio.env
```

Exemple de permissions :

```bash
sudo chmod 0640 /etc/votreradio/radio.env
sudo chown root:votreradio /etc/votreradio/radio.env
```

## Pare-feu

Exemple UFW :

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 192.0.2.0/24 to any port 22 proto tcp
sudo ufw allow from 192.0.2.0/24 to any port 8000 proto tcp
sudo ufw enable
```

Adaptez le réseau LAN à votre contexte. Pour un vrai LAN privé, remplacez `192.0.2.0/24` par votre plage locale.

N'exposez le port live externe que s'il est indispensable. Le port `18005` utilisé dans les exemples n'est pas une recommandation de production : choisissez votre propre valeur et gardez-la hors documentation publique.

## Icecast

Recommandations :

- mots de passe distincts pour source, relay et admin ;
- interface admin non exposée publiquement ;
- stats consommées localement par `write-listeners-json.py` ;
- endpoint public `listeners.json` limité aux informations utiles.

## Nginx

Recommandations :

- HTTPS obligatoire ;
- `proxy_buffering off` sur les flux ;
- headers CORS uniquement sur les endpoints publics ;
- pas d'autoindex en dehors de `history/` si vous l'assumez ;
- pas d'exposition publique de fichiers de configuration.

## Données d'écoute

Le script `build-direct-log.py` anonymise les IP par défaut. Si vous conservez des IP complètes pour de l'exploitation privée, ne publiez pas ces logs.

## Publication open source

Avant publication :

```bash
rg -n 'CHANGE_ME|password|secret|token|NOM_PRIVE|ANCIEN_DOMAINE|ANCIEN_UTILISATEUR|192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\.' .
```

Passez chaque résultat en revue. Remplacez `NOM_PRIVE`, `ANCIEN_DOMAINE` et `ANCIEN_UTILISATEUR` par les termes propres à votre projet avant publication. Certains mots comme `password` peuvent être normaux dans une documentation de sécurité, mais aucune valeur réelle ne doit apparaître.
