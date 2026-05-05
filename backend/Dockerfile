# Backend Dockerfile
# Multi-stage build para optimizar el tamaño de la imagen

# Etapa 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src
COPY tsconfig.json ./

# Compilar TypeScript
RUN npm run build

# Etapa 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar el código compilado desde la etapa de build
COPY --from=builder /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "dist/server.js"]
