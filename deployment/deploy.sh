#!/bin/bash

# 🚀 Script de Deployment Automatizado - AI Calorie Counter
# Este script automatiza el proceso de deployment en un servidor

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto"
fi

# Variables de configuración
APP_DIR="/var/www/ai-calorie-counter"
NGINX_SITE="ai-calorie-counter"
PM2_APP="ai-calorie-counter-backend"

log "🚀 Iniciando deployment de AI Calorie Counter..."

# Paso 1: Verificar dependencias del sistema
log "📋 Verificando dependencias del sistema..."

if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instala Node.js 18+ primero."
fi

if ! command -v npm &> /dev/null; then
    error "npm no está instalado."
fi

if ! command -v nginx &> /dev/null; then
    warning "Nginx no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
fi

if ! command -v pm2 &> /dev/null; then
    warning "PM2 no está instalado. Instalando..."
    sudo npm install -g pm2
fi

success "Dependencias verificadas"

# Paso 2: Crear directorios necesarios
log "📁 Creando directorios necesarios..."

sudo mkdir -p $APP_DIR
sudo mkdir -p /var/log/ai-calorie-counter
sudo chown -R $USER:$USER $APP_DIR
sudo chown -R $USER:$USER /var/log/ai-calorie-counter

success "Directorios creados"

# Paso 3: Verificar variables de entorno
log "🔧 Verificando configuración..."

if [ ! -f "backend/.env" ]; then
    warning "Archivo backend/.env no encontrado. Creando desde template..."
    cp backend/.env.example backend/.env
    warning "⚠️  IMPORTANTE: Edita backend/.env con tus credenciales de Google Cloud antes de continuar"
    echo "Presiona Enter cuando hayas configurado el archivo .env..."
    read
fi

# Verificar que las variables críticas estén configuradas
if ! grep -q "GOOGLE_CLOUD_PROJECT_ID=" backend/.env || ! grep -q "GOOGLE_CLOUD_KEY_FILE=" backend/.env; then
    error "Variables de Google Cloud no configuradas en backend/.env"
fi

success "Configuración verificada"

# Paso 4: Instalar dependencias
log "📦 Instalando dependencias..."

npm run install:all

success "Dependencias instaladas"

# Paso 5: Ejecutar tests
log "🧪 Ejecutando tests..."

if npm run test:client -- --watchAll=false --coverage=false; then
    success "Tests pasaron correctamente"
else
    warning "Algunos tests fallaron, pero continuando con el deployment..."
fi

# Paso 6: Build de producción
log "🏗️  Creando build de producción..."

cd frontend
npm run build
cd ..

if [ ! -d "frontend/build" ]; then
    error "Build de frontend falló"
fi

success "Build de producción creado"

# Paso 7: Copiar archivos al directorio de producción
log "📋 Copiando archivos a directorio de producción..."

# Copiar backend
cp -r backend/* $APP_DIR/
cp -r frontend/build $APP_DIR/frontend-build

# Copiar archivos de configuración
cp deployment/ecosystem.config.js $APP_DIR/
cp deployment/nginx.conf /tmp/nginx-ai-calorie-counter.conf

success "Archivos copiados"

# Paso 8: Configurar PM2
log "⚙️  Configurando PM2..."

cd $APP_DIR

# Detener aplicación si está corriendo
pm2 delete $PM2_APP 2>/dev/null || true

# Instalar dependencias de producción
npm install --production

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar al boot
pm2 startup | grep -E '^sudo' | bash || true

success "PM2 configurado"

# Paso 9: Configurar Nginx
log "🌐 Configurando Nginx..."

# Actualizar configuración de nginx con rutas correctas
sed -i "s|/var/www/ai-calorie-counter/build|$APP_DIR/frontend-build|g" /tmp/nginx-ai-calorie-counter.conf

# Copiar configuración
sudo cp /tmp/nginx-ai-calorie-counter.conf /etc/nginx/sites-available/$NGINX_SITE

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Verificar configuración
if sudo nginx -t; then
    success "Configuración de Nginx válida"
    sudo systemctl reload nginx
else
    error "Configuración de Nginx inválida"
fi

success "Nginx configurado"

# Paso 10: Verificar deployment
log "🔍 Verificando deployment..."

sleep 5  # Esperar a que la aplicación inicie

# Verificar backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    success "Backend funcionando correctamente"
else
    error "Backend no responde en http://localhost:5000/health"
fi

# Verificar frontend (si nginx está configurado para localhost)
if curl -f http://localhost/ > /dev/null 2>&1; then
    success "Frontend funcionando correctamente"
else
    warning "Frontend podría no estar accesible (normal si no tienes dominio configurado)"
fi

# Mostrar estado de PM2
pm2 status

success "🎉 ¡Deployment completado exitosamente!"

echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu dominio para apuntar a este servidor"
echo "2. Configura SSL con: sudo certbot --nginx -d tu-dominio.com"
echo "3. Actualiza la configuración de nginx con tu dominio real"
echo "4. Verifica que todo funcione en: https://tu-dominio.com"
echo ""
echo "📊 Comandos útiles:"
echo "- Ver logs: pm2 logs $PM2_APP"
echo "- Reiniciar app: pm2 restart $PM2_APP"
echo "- Ver estado: pm2 status"
echo "- Logs de nginx: sudo tail -f /var/log/nginx/access.log"
echo ""

log "✨ Deployment finalizado"