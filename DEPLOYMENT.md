# Guide de Déploiement CleanHouse

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub                                │
│                    (samuelBury/CleanHouse)                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ Railway  │   │  Vercel  │   │   Expo EAS   │
        │ Backend  │   │  Admin   │   │  Mobile Apps │
        └──────────┘   └──────────┘   └──────────────┘
              │
              ▼
        ┌──────────┐
        │PostgreSQL│
        │ (Railway)│
        └──────────┘
```

## 1. Configuration Railway (Backend)

### Étape 1: Créer le projet Railway

1. Aller sur [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionner `samuelBury/CleanHouse`
4. Configurer le root directory: `backend`

### Étape 2: Ajouter PostgreSQL

1. Dans le projet Railway: "New" → "Database" → "PostgreSQL"
2. Railway génère automatiquement `DATABASE_URL`

### Étape 3: Variables d'environnement

Dans Railway → Settings → Variables, ajouter:

```
NODE_ENV=production
JWT_SECRET=<générer avec: openssl rand -base64 32>
JWT_REFRESH_SECRET=<générer avec: openssl rand -base64 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...
BREVO_API_KEY=xkeysib-...
```

### Étape 4: Récupérer le token Railway pour GitHub Actions

1. Railway → Account Settings → Tokens
2. Créer un token
3. L'ajouter dans GitHub: Settings → Secrets → `RAILWAY_TOKEN`

---

## 2. Configuration Vercel (Admin Dashboard)

### Étape 1: Connecter le repo

1. Aller sur [vercel.com](https://vercel.com)
2. "Import Project" → GitHub → `samuelBury/CleanHouse`
3. Root Directory: `admin-dashboard`
4. Framework: Vite

### Étape 2: Variables d'environnement

```
VITE_API_URL=https://your-app.up.railway.app
```

### Étape 3: Récupérer les tokens pour GitHub Actions

Dans Vercel → Settings → Tokens, créer un token et récupérer:

```
VERCEL_TOKEN=<votre token>
VERCEL_ORG_ID=<dans .vercel/project.json après premier deploy>
VERCEL_PROJECT_ID=<dans .vercel/project.json après premier deploy>
```

Ajouter ces 3 secrets dans GitHub.

---

## 3. Configuration GitHub Secrets

Dans GitHub → Settings → Secrets and variables → Actions:

### Secrets (valeurs sensibles)

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Token Railway CLI |
| `VERCEL_TOKEN` | Token Vercel |
| `VERCEL_ORG_ID` | ID de l'organisation Vercel |
| `VERCEL_PROJECT_ID` | ID du projet Vercel |

### Variables (valeurs non-sensibles)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API Railway |

---

## 4. Configuration Apps Mobile (Expo EAS)

### Étape 1: Installer EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Étape 2: Configurer EAS

```bash
cd CleanHouse  # App client
eas build:configure

cd CleanHousePro  # App pro
eas build:configure
```

### Étape 3: Variables d'environnement Expo

Dans `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.up.railway.app"
      }
    }
  }
}
```

### Étape 4: Build et déploiement

```bash
# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Soumettre aux stores
eas submit --platform ios
eas submit --platform android
```

---

## 5. Workflow de déploiement

### Branche `main` (Production)

```
Push → GitHub Actions → Tests → Deploy Railway + Vercel
```

### Branche `develop` (Staging)

```
Push → GitHub Actions → Tests → Deploy Preview
```

### Pull Request

```
PR → GitHub Actions → Tests → Vercel Preview URL
```

---

## 6. Domaines personnalisés

### Railway

1. Settings → Domains → Add Custom Domain
2. Ajouter CNAME: `api.cleanhouse.fr` → `your-app.up.railway.app`

### Vercel

1. Settings → Domains → Add
2. Ajouter: `admin.cleanhouse.fr`
3. Configurer DNS chez votre registrar

---

## 7. Monitoring

### Railway

- Logs: Railway Dashboard → Deployments → View Logs
- Métriques: Dashboard → Metrics

### Vercel

- Analytics: Vercel Dashboard → Analytics
- Logs: Functions → Logs

### Recommandés

- [Sentry](https://sentry.io) - Error tracking
- [Better Stack](https://betterstack.com) - Uptime monitoring

---

## Commandes utiles

```bash
# Voir les logs Railway
railway logs

# Déployer manuellement
railway up

# Ouvrir Prisma Studio (local)
cd backend && npm run prisma:studio

# Build local admin
cd admin-dashboard && npm run build && npm run preview
```
