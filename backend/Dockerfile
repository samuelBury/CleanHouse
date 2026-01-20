# Dockerfile pour CleanHouse Backend
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Installer les dépendances système pour Prisma
RUN apk add --no-cache openssl

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Supprimer les devDependencies après le build
RUN npm prune --production

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
