#!/bin/sh

# Script de inicio para el contenedor Docker

echo "🚀 Iniciando AI Calorie Counter..."

# Verificar variables de entorno requeridas
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    echo "❌ Error: GOOGLE_CLOUD_PROJECT_ID no está configurado"
    exit 1
fi

if [ -z "$GOOGLE_CLOUD_KEY_FILE" ]; then
    echo "❌ Error: GOOGLE_CLOUD_KEY_FILE no está configurado"
    exit 1
fi

# Iniciar nginx en background
echo "🌐 Iniciando servidor web..."
nginx -g "daemon off;" &

# Esperar un momento para que nginx inicie
sleep 2

# Cambiar al directorio del backend
cd /app/backend

# Iniciar servidor backend
echo "⚙️  Iniciando servidor backend..."
exec node server.js