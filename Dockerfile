# Multi-stage build para AI Calorie Counter

# Etapa 1: Build del frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copiar package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY frontend/ ./

# Build de producción
RUN npm run build

# Etapa 2: Setup del backend
FROM node:18-alpine AS backend-setup

WORKDIR /app/backend

# Copiar package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copiar código fuente del backend
COPY backend/ ./

# Etapa 3: Imagen final
FROM node:18-alpine AS production

# Instalar nginx para servir archivos estáticos
RUN apk add --no-cache nginx

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Crear directorios necesarios
RUN mkdir -p /var/log/nginx
RUN mkdir -p /var/lib/nginx/tmp
RUN mkdir -p /app/frontend/build
RUN mkdir -p /app/backend

# Copiar archivos del frontend build
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Copiar archivos del backend
COPY --from=backend-setup /app/backend /app/backend

# Copiar configuración de nginx
COPY deployment/nginx.conf /etc/nginx/http.d/default.conf

# Configurar permisos
RUN chown -R nodejs:nodejs /app
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /var/lib/nginx

# Exponer puertos
EXPOSE 80 5000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Script de inicio
COPY deployment/start.sh /start.sh
RUN chmod +x /start.sh

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["/start.sh"]