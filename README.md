# EsthyPyaourt — Gestion de stock

Application Next.js pour **EsthyPyaourt** (P.Aktion) : catalogue, commandes, stock, coûts, et dashboards Admin / SuperAdmin.

## Prérequis

- Node.js 20+
- PostgreSQL 16 (local ou Docker)

## Démarrage rapide

### 1. Base de données PostgreSQL

Avec Docker :

```bash
docker compose up -d
```

Ou adaptez `DATABASE_URL` dans `.env` vers votre instance PostgreSQL.

### 2. Variables d'environnement

Copiez `.env.example` → `.env` (déjà prêt pour Docker local) :

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/esthypyaourt?schema=public"
AUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Installation & migration

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Comptes de démo (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@esthypyaourt.com | Admin123! |
| Admin | admin@esthypyaourt.com | Admin123! |
| Client | client@esthypyaourt.com | User123! |

## Fonctionnalités

- **Client** : inscription, connexion, catalogue, commande
- **Admin** : produits, production/stock, coûts, validation & livraison
- **Super Admin** : KPIs, tendances (jour/semaine/mois/année), création d’admins

## Visuels marque

Fichiers dans `public/` : `banner.jpg`, `esthy.jpg`, `visuel1.jpg`
