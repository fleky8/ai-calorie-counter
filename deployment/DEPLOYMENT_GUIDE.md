# 🚀 Guía de Deployment - AI Calorie Counter

## Opciones de Deployment

### Opción 1: Deployment Manual (Recomendado para empezar)
### Opción 2: Deployment con Docker
### Opción 3: Deployment en la Nube (Vercel + Railway/Heroku)

---

## 🔧 Opción 1: Deployment Manual

### Paso 1: Preparar el Servidor

```bash
# En tu servidor (Ubuntu/Debian)
sudo apt update
sudo apt install nginx nodejs npm

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Crear directorio para la aplicación
sudo mkdir -p /var/www/ai-calorie-counter
sudo chown $USER:$USER /var/www/ai-calorie-counter
```

### Paso 2: Configurar Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Vision API
4. Crea una cuenta de servicio:
   - Ve a IAM & Admin > Service Accounts
   - Crea una nueva cuenta de servicio
   - Asigna el rol "Cloud Vision API User"
   - Descarga el archivo JSON de credenciales

### Paso 3: Subir el Código

```bash
# En tu máquina local
# 1. Hacer build de producción
npm run build:production

# 2. Subir archivos al servidor (usando scp o rsync)
rsync -avz --exclude node_modules . usuario@tu-servidor:/var/www/ai-calorie-counter/

# O usando git en el servidor
# git clone https://github.com/tu-usuario/ai-calorie-counter.git /var/www/ai-calorie-counter
```

### Paso 4: Configurar el Backend

```bash
# En el servidor
cd /var/www/ai-calorie-counter

# Instalar dependencias
npm run install:all

# Configurar variables de entorno del backend
cd backend
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Configurar el archivo `.env`:
```env
NODE_ENV=production
PORT=5000
GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id
GOOGLE_CLOUD_KEY_FILE=/var/www/ai-calorie-counter/credentials/service-account.json
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
```

```bash
# Crear directorio para credenciales
mkdir -p /var/www/ai-calorie-counter/credentials

# Subir el archivo de credenciales de Google Cloud
# (copia el archivo JSON descargado anteriormente)
```

### Paso 5: Configurar PM2

```bash
# Crear archivo de configuración PM2
cd /var/www/ai-calorie-counter
```

<function_calls>
<invoke name="fsWrite">
<parameter name="path">deployment/ecosystem.config.jsle.exports = {
  apps: [{
    name: 'ai-calorie-counter-backend',
    script: './backend/server.js',
    cwd: '/var/www/ai-calorie-counter',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/ai-calorie-counter/error.log',
    out_file: '/var/log/ai-calorie-counter/out.log',
    log_file: '/var/log/ai-calorie-counter/combined.log',
    time: true
  }]
};