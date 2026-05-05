# Frontend Dockerfile
# Multi-stage build para optimizar el tamaño de la imagen

# Etapa 1: Build con Bun
FROM oven/bun:latest AS builder

WORKDIR /app

# Copiar package files
COPY package.json bun.lockb* ./

# Instalar dependencias con bun
RUN bun install

# Copiar código fuente
COPY . .

# Build con vite
RUN bun run build

# Etapa 2: Servir con nginx
FROM nginx:alpine

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
