# 🚀 Guía Paso a Paso: Vercel + Railway

## ⏱️ Tiempo estimado: 10-15 minutos

---

## 📋 PASO 1: Preparar Google Cloud (5 minutos)

### 1.1 Crear proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en "Nuevo Proyecto" o selecciona el selector de proyectos
3. Crea un proyecto nuevo con el nombre "ai-calorie-counter" (o el que prefieras)
4. Anota el **Project ID** (lo necesitarás después)

### 1.2 Habilitar Vision API
1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Vision API"
3. Haz clic en "Cloud Vision API"
4. Haz clic en "HABILITAR"

### 1.3 Crear cuenta de servicio
1. Ve a "IAM y administración" > "Cuentas de servicio"
2. Haz clic en "CREAR CUENTA DE SERVICIO"
3. Nombre: `ai-calorie-counter-service`
4. Descripción: `Cuenta de servicio para AI Calorie Counter`
5. Haz clic en "CREAR Y CONTINUAR"
6. En "Función", selecciona "Cloud Vision API > Administrador de Cloud Vision"
7. Haz clic en "CONTINUAR" y luego "LISTO"

### 1.4 Descargar credenciales
1. Haz clic en la cuenta de servicio que acabas de crear
2. Ve a la pestaña "CLAVES"
3. Haz clic en "AGREGAR CLAVE" > "Crear clave nueva"
4. Selecciona "JSON" y haz clic en "CREAR"
5. Se descargará un archivo JSON - **guárdalo en un lugar seguro**

### 1.5 Convertir credenciales a Base64
Abre una terminal y ejecuta:

**En Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ruta\al\archivo\service-account.json")) | Set-Clipboard
```

**En macOS:**
```bash
base64 -i /ruta/al/archivo/service-account.json | pbcopy
```

**En Linux:**
```bash
base64 /ruta/al/archivo/service-account.json | xclip -selection clipboard
```

**✅ Resultado:** Tienes las credenciales en Base64 copiadas en tu clipboard

---

## 📋 PASO 2: Subir código a GitHub (2 minutos)

### 2.1 Crear repositorio en GitHub
1. Ve a [GitHub](https://github.com) y haz login
2. Haz clic en "New repository"
3. Nombre: `ai-calorie-counter`
4. Descripción: `Contador de calorías con inteligencia artificial`
5. Selecciona "Public" (o Private si prefieres)
6. Haz clic en "Create repository"

### 2.2 Subir el código
En tu terminal, en el directorio del proyecto:

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .

# Hacer commit
git commit -m "Initial commit: AI Calorie Counter app"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/ai-calorie-counter.git

# Subir código
git branch -M main
git push -u origin main
```

**✅ Resultado:** Tu código está en GitHub

---

## 📋 PASO 3: Desplegar Backend en Railway (3 minutos)

### 3.1 Crear cuenta en Railway
1. Ve a [Railway.app](https://railway.app)
2. Haz clic en "Login" y conecta con GitHub
3. Autoriza Railway para acceder a tus repositorios

### 3.2 Crear nuevo proyecto
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona tu repositorio `ai-calorie-counter`
4. Haz clic en "Deploy Now"

### 3.3 Configurar variables de entorno
1. Una vez desplegado, haz clic en tu servicio
2. Ve a la pestaña "Variables"
3. Agrega estas variables:

```
NODE_ENV=production
PORT=5000
GOOGLE_CLOUD_PROJECT_ID=tu-project-id-de-google-cloud
GOOGLE_CLOUD_KEY_FILE_BASE64=pega-aqui-el-base64-de-las-credenciales
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.4 Configurar build y start commands
1. Ve a la pestaña "Settings"
2. En "Build Command" pon: `cd backend && npm install`
3. En "Start Command" pon: `cd backend && npm start`
4. Haz clic en "Save Changes"

### 3.5 Obtener URL del backend
1. Ve a la pestaña "Deployments"
2. Copia la URL que aparece (algo como `https://tu-app.railway.app`)
3. **Guarda esta URL** - la necesitarás para el frontend

**✅ Resultado:** Backend funcionando en Railway

---

## 📋 PASO 4: Desplegar Frontend en Vercel (3 minutos)

### 4.1 Crear cuenta en Vercel
1. Ve a [Vercel.com](https://vercel.com)
2. Haz clic en "Sign Up" y conecta con GitHub
3. Autoriza Vercel para acceder a tus repositorios

### 4.2 Importar proyecto
1. Haz clic en "New Project"
2. Busca y selecciona tu repositorio `ai-calorie-counter`
3. Haz clic en "Import"

### 4.3 Configurar build settings
1. En "Framework Preset" selecciona "Create React App"
2. En "Root Directory" pon: `frontend`
3. En "Build Command" pon: `npm run build`
4. En "Output Directory" pon: `build`
5. En "Install Command" pon: `npm install`

**⚠️ SOLUCIÓN PARA ERROR ENOENT package.json**:

Si obtienes el error "Could not read package.json", usa esta configuración:

**Opción A - Configuración en Vercel Dashboard:**
- Framework Preset: `Other`
- Root Directory: `./` (raíz del proyecto)
- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/build`
- Install Command: `echo "Skip install"`

**Opción B - Usar archivo vercel.json (Recomendado):**
El proyecto ya incluye un archivo `vercel.json` configurado. Solo necesitas:
- Framework Preset: `Create React App`
- Root Directory: `frontend`
- Las demás configuraciones se tomarán del archivo `vercel.json`

### 4.4 Configurar variables de entorno
En la sección "Environment Variables" agrega:

```
REACT_APP_ENV=production
REACT_APP_API_URL=https://tu-backend-url.railway.app/api
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_NAME=AI Calorie Counter
REACT_APP_PWA_SHORT_NAME=CalorieAI
```

**⚠️ IMPORTANTE:** Reemplaza `https://tu-backend-url.railway.app` con la URL real de Railway del paso anterior.

### 4.5 Deploy
1. Haz clic en "Deploy"
2. Espera a que termine el build (2-3 minutos)
3. ¡Tu frontend estará listo!

**✅ Resultado:** Frontend funcionando en Vercel

---

## 📋 PASO 5: Verificar que todo funcione (2 minutos)

### 5.1 Probar el backend
1. Ve a la URL de Railway: `https://tu-backend.railway.app/health`
2. Deberías ver algo como: `{"status":"OK","timestamp":"...","uptime":...}`

### 5.2 Probar el frontend
1. Ve a la URL de Vercel (aparece en tu dashboard)
2. Deberías ver la aplicación AI Calorie Counter
3. Intenta subir una imagen para probar el análisis

### 5.3 Probar la integración completa
1. En el frontend, haz clic en "Subir Imagen"
2. Selecciona una imagen de comida
3. Haz clic en "Analizar imagen"
4. Deberías ver los resultados nutricionales

**✅ Resultado:** ¡Aplicación funcionando completamente!

---

## 🎉 ¡LISTO! Tu aplicación está en producción

### URLs de tu aplicación:
- **Frontend**: https://tu-app.vercel.app
- **Backend**: https://tu-backend.railway.app
- **API**: https://tu-backend.railway.app/api
- **Health Check**: https://tu-backend.railway.app/health

### 📱 Características disponibles:
- ✅ Análisis de imágenes con IA
- ✅ Información nutricional completa
- ✅ Historial de análisis
- ✅ PWA (se puede instalar como app)
- ✅ Responsive design
- ✅ Funciona offline (historial)

---

## 🔧 Próximos pasos opcionales:

### Configurar dominio personalizado:
1. **En Vercel**: Settings > Domains > Add domain
2. **En Railway**: Settings > Domains > Custom Domain

### Monitoreo:
- Railway tiene métricas integradas
- Vercel tiene analytics integrados

### Actualizaciones:
- Cada push a GitHub actualizará automáticamente ambos servicios

---

## 🆘 Solución de problemas:

### Si el backend no funciona:
1. Ve a Railway > Logs para ver errores
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que el Project ID de Google Cloud sea correcto

### Si el frontend no se conecta al backend:
1. Verifica que `REACT_APP_API_URL` tenga la URL correcta de Railway
2. Asegúrate de que termine en `/api`
3. Redeploy el frontend después de cambiar variables

### Si Google Vision API no funciona:
1. Verifica que la API esté habilitada en Google Cloud
2. Verifica que las credenciales Base64 estén correctas
3. Verifica que la cuenta de servicio tenga los permisos correctos

---

## 🎊 ¡Felicitaciones!

Tu aplicación AI Calorie Counter está ahora funcionando en producción con:
- ⚡ Deploy automático desde GitHub
- 🌐 URLs públicas accesibles desde cualquier lugar
- 📱 PWA instalable en móviles
- 🔄 Actualizaciones automáticas
- 📊 Monitoreo integrado

¡Comparte tu aplicación con el mundo! 🚀