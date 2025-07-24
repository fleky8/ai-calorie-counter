# 🚀 Despliegue Desde Cero - AI Calorie Counter

## ✨ Guía Simple y Directa

Esta guía te llevará paso a paso para desplegar tu aplicación desde cero, sin complicaciones.

---

## 📋 PASO 1: Preparar Google Cloud (5 minutos)

### 1.1 Crear proyecto
1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto llamado "ai-calorie-counter"
3. **Anota el Project ID** (lo necesitarás después)

### 1.2 Habilitar Vision API
1. En el menú, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Vision API" y habilítala

### 1.3 Crear credenciales
1. Ve a "APIs y servicios" > "Credenciales"
2. "Crear credenciales" > "Cuenta de servicio"
3. Nombre: `calorie-counter-service`
4. Rol: `Cloud Vision API User`
5. Descarga el archivo JSON de credenciales

### 1.4 Convertir a Base64
Abre PowerShell y ejecuta:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\a\tu\archivo.json")) | Set-Clipboard
```
Esto copiará el Base64 al clipboard.

---

## 📋 PASO 2: Subir a GitHub (3 minutos)

### 2.1 Crear repositorio
1. Ve a https://github.com/new
2. Nombre: `ai-calorie-counter`
3. Público o privado (tu elección)
4. Crear repositorio

### 2.2 Subir código
En tu terminal:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/ai-calorie-counter.git
git push -u origin main
```

---

## 📋 PASO 3: Desplegar Backend en Railway (5 minutos)

### 3.1 Crear cuenta
1. Ve a https://railway.app
2. Regístrate con GitHub

### 3.2 Crear proyecto
1. "New Project" > "Deploy from GitHub repo"
2. Selecciona tu repositorio
3. Railway detectará automáticamente el backend

### 3.3 Configurar variables de entorno
En Railway, ve a Variables y agrega:

```
NODE_ENV=production
PORT=5000
GOOGLE_CLOUD_PROJECT_ID=tu-project-id-aqui
GOOGLE_CLOUD_KEY_FILE_BASE64=pega-el-base64-aqui
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
```

### 3.4 Configurar build
En Settings:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3.5 Obtener URL
Copia la URL de tu backend (ej: `https://tu-app.railway.app`)

---

## 📋 PASO 4: Desplegar Frontend en Vercel (5 minutos)

### 4.1 Crear cuenta
1. Ve a https://vercel.com
2. Regístrate con GitHub

### 4.2 Importar proyecto
1. "New Project"
2. Selecciona tu repositorio
3. **IMPORTANTE**: Configura así:

```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### 4.3 Variables de entorno
Agrega estas variables en Vercel:

```
REACT_APP_ENV=production
REACT_APP_API_URL=https://tu-backend.railway.app/api
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_NAME=AI Calorie Counter
REACT_APP_PWA_SHORT_NAME=CalorieAI
```

### 4.4 Deploy
Haz clic en "Deploy" y espera.

---

## 📋 PASO 5: Conectar Frontend y Backend (2 minutos)

### 5.1 Configurar CORS
En Railway, agrega esta variable:
```
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### 5.2 Verificar
1. Ve a `https://tu-backend.railway.app/health` - debe mostrar JSON
2. Ve a `https://tu-frontend.vercel.app` - debe cargar la app
3. Prueba subir una imagen

---

## 🎉 ¡Listo!

Tu aplicación está funcionando en:
- **Frontend**: https://tu-frontend.vercel.app
- **Backend**: https://tu-backend.railway.app

---

## 🆘 Si algo falla:

### Error en Vercel:
- Verifica que Root Directory sea `frontend`
- Verifica que las variables de entorno estén correctas

### Error en Railway:
- Revisa los logs en Railway
- Verifica que el Base64 de Google Cloud esté correcto

### Error de CORS:
- Verifica que CORS_ORIGIN tenga la URL exacta de Vercel

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas, comparte:
1. El error exacto que ves
2. En qué paso estás
3. Capturas de pantalla si es posible

¡Vamos paso a paso hasta que funcione! 🚀