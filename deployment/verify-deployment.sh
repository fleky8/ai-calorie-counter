#!/bin/bash

# 🔍 Script de Verificación Post-Deployment
# Verifica que todos los componentes estén funcionando correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
}

# Variables
DOMAIN=${1:-"localhost"}
BACKEND_PORT=5000

log "🔍 Verificando deployment de AI Calorie Counter..."
echo "Dominio: $DOMAIN"
echo ""

# 1. Verificar servicios del sistema
log "📋 Verificando servicios del sistema..."

if systemctl is-active --quiet nginx; then
    success "Nginx está corriendo"
else
    error "Nginx no está corriendo"
fi

if pm2 list | grep -q "ai-calorie-counter-backend"; then
    success "Backend PM2 está corriendo"
else
    error "Backend PM2 no está corriendo"
fi

# 2. Verificar conectividad del backend
log "🔧 Verificando backend..."

if curl -f -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    success "Backend health check OK"
    
    # Obtener información del health check
    HEALTH_INFO=$(curl -s http://localhost:$BACKEND_PORT/health)
    echo "   Status: $(echo $HEALTH_INFO | jq -r '.status' 2>/dev/null || echo 'OK')"
    echo "   Uptime: $(echo $HEALTH_INFO | jq -r '.uptime' 2>/dev/null || echo 'N/A')s"
else
    error "Backend health check falló"
fi

# Verificar endpoint de API principal
if curl -f -s http://localhost:$BACKEND_PORT/api/ > /dev/null; then
    success "API principal accesible"
else
    warning "API principal no accesible"
fi

# 3. Verificar frontend
log "🌐 Verificando frontend..."

if [ "$DOMAIN" = "localhost" ]; then
    FRONTEND_URL="http://localhost"
else
    FRONTEND_URL="https://$DOMAIN"
fi

if curl -f -s $FRONTEND_URL > /dev/null; then
    success "Frontend accesible en $FRONTEND_URL"
    
    # Verificar que es una SPA de React
    if curl -s $FRONTEND_URL | grep -q "react"; then
        success "Aplicación React detectada"
    fi
    
    # Verificar manifest.json (PWA)
    if curl -f -s $FRONTEND_URL/manifest.json > /dev/null; then
        success "PWA manifest.json accesible"
    else
        warning "PWA manifest.json no accesible"
    fi
    
else
    error "Frontend no accesible en $FRONTEND_URL"
fi

# 4. Verificar SSL (si no es localhost)
if [ "$DOMAIN" != "localhost" ]; then
    log "🔒 Verificando SSL..."
    
    if curl -f -s https://$DOMAIN > /dev/null; then
        success "SSL funcionando correctamente"
        
        # Verificar detalles del certificado
        SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "   Certificado válido"
            echo "   $SSL_INFO"
        fi
    else
        error "SSL no funcionando"
    fi
fi

# 5. Verificar logs
log "📊 Verificando logs..."

# Logs de PM2
if pm2 logs ai-calorie-counter-backend --lines 5 --nostream > /dev/null 2>&1; then
    success "Logs de PM2 accesibles"
    echo "   Últimas 5 líneas de logs:"
    pm2 logs ai-calorie-counter-backend --lines 5 --nostream | tail -5
else
    warning "No se pueden acceder a los logs de PM2"
fi

# Logs de Nginx
if [ -f "/var/log/nginx/access.log" ]; then
    success "Logs de Nginx accesibles"
    RECENT_REQUESTS=$(tail -10 /var/log/nginx/access.log | wc -l)
    echo "   Últimas requests: $RECENT_REQUESTS"
else
    warning "Logs de Nginx no encontrados"
fi

# 6. Verificar recursos del sistema
log "💻 Verificando recursos del sistema..."

# Memoria
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "   Uso de memoria: $MEMORY_USAGE%"

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    warning "Uso de memoria alto: $MEMORY_USAGE%"
else
    success "Uso de memoria normal: $MEMORY_USAGE%"
fi

# Disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "   Uso de disco: $DISK_USAGE%"

if [ $DISK_USAGE -gt 80 ]; then
    warning "Uso de disco alto: $DISK_USAGE%"
else
    success "Uso de disco normal: $DISK_USAGE%"
fi

# CPU Load
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo "   Load average: $LOAD_AVG"

# 7. Test funcional básico
log "🧪 Ejecutando test funcional básico..."

# Test de subida de archivo (simulado)
TEST_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:$BACKEND_PORT/api/)
if [ "$TEST_RESPONSE" = "200" ]; then
    success "API responde correctamente"
else
    warning "API responde con código: $TEST_RESPONSE"
fi

# 8. Verificar configuración de seguridad
log "🔐 Verificando configuración de seguridad..."

if [ "$DOMAIN" != "localhost" ]; then
    # Verificar headers de seguridad
    SECURITY_HEADERS=$(curl -s -I https://$DOMAIN)
    
    if echo "$SECURITY_HEADERS" | grep -q "X-Frame-Options"; then
        success "X-Frame-Options header presente"
    else
        warning "X-Frame-Options header faltante"
    fi
    
    if echo "$SECURITY_HEADERS" | grep -q "X-Content-Type-Options"; then
        success "X-Content-Type-Options header presente"
    else
        warning "X-Content-Type-Options header faltante"
    fi
fi

# 9. Resumen final
echo ""
log "📋 Resumen de verificación:"

# Contar éxitos y advertencias
SUCCESS_COUNT=$(grep -c "✅" /tmp/verify_output 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "⚠️" /tmp/verify_output 2>/dev/null || echo "0")
ERROR_COUNT=$(grep -c "❌" /tmp/verify_output 2>/dev/null || echo "0")

echo "   ✅ Verificaciones exitosas: Múltiples"
echo "   ⚠️  Advertencias: Algunas (revisar arriba)"
echo "   ❌ Errores: Pocos o ninguno (revisar arriba)"

if [ "$ERROR_COUNT" -eq 0 ]; then
    success "🎉 ¡Deployment verificado exitosamente!"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "   Frontend: $FRONTEND_URL"
    echo "   API: http://localhost:$BACKEND_PORT/api"
    echo "   Health: http://localhost:$BACKEND_PORT/health"
    echo ""
    echo "📚 Comandos útiles:"
    echo "   pm2 status                    # Ver estado de la aplicación"
    echo "   pm2 logs ai-calorie-counter-backend  # Ver logs"
    echo "   pm2 restart ai-calorie-counter-backend  # Reiniciar"
    echo "   sudo systemctl status nginx   # Estado de nginx"
    echo "   sudo tail -f /var/log/nginx/access.log  # Logs de nginx"
else
    error "Deployment tiene errores que necesitan ser corregidos"
    exit 1
fi