# CrossBus — Portail transport RP Arma 3

Site web immersif pour le réseau de transport **CrossBus** : radio, annonces sonores, billets et contrôle.

## Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind CSS v4
- Prisma ORM + Neon PostgreSQL
- Déploiement Vercel

## Démarrage rapide

### 1. Installation

```bash
npm install
```

### 2. Variables d'environnement

Copiez `.env.example` vers `.env` :

```env
DATABASE_URL="postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require"
ADMIN_PASSWORD="votre-mot-de-passe-fort"
```

Obtenez `DATABASE_URL` depuis [Neon Console](https://console.neon.tech).

### 3. Base de données

```bash
npm run db:push
```

Dans **Admin**, cliquez sur « Importer lignes prédéfinies » pour synchroniser les 6 lignes.

### 4. Fichiers audio

Placez vos MP3 dans `public/audio/` :

```
public/audio/
├── sfx/chime.mp3
├── music/track1.mp3
├── music/track2.mp3
├── music/track3.mp3
├── line1/kavala-center.mp3
├── line1/hospital.mp3
└── ...
```

Voir `public/audio/README.md` pour la liste complète.

### 5. Lancer en dev

```bash
npm run dev
```

## Pages

| Route | Rôle |
|-------|------|
| `/` | Accueil, branding, réseau |
| `/driver` | Annonces (ligne + arrêt) |
| `/tickets` | Création de billets |
| `/controller` | Vérification passagers |
| `/admin` | Gestion (mot de passe `ADMIN_PASSWORD`) |

## Déploiement Vercel

1. Importez le repo sur Vercel
2. Ajoutez `DATABASE_URL` et `ADMIN_PASSWORD` dans les variables d'environnement
3. Le build exécute `prisma generate` automatiquement (`postinstall`)

## Licence audio

Utilisez uniquement de la musique et des voix **libres de droits** pour la radio et les annonces.
