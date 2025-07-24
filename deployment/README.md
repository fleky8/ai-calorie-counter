# 🚀 Deployment de AI Calorie Counter

## Opciones de Deployment Rápido

### 🎯 Opción Recomendada: Deployment Automatizado

Para hacer el deployment más fácil, he creado scripts automatizados:

#### 1. Deployment Completo (Linux/macOS)
```bash
# Hacer los scripts ejecutables
chmod +x deployment/deploy.sh deployment/verify-deployment.sh

# Ejecutar deployment automatizado
./deployment/deploy.sh
```

#### 2. Verificar Deployment
```bash
# Verificar que todo funcione correctamente
./deployment/verify-deployment.sh tu-dominio.com
```

---

## 🌐 Deployment en la Nube (Más Fácil)

### Opción A: Vercel + Railway

#### Frontend en Vercel:
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Configura:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd frontend && npm install`

#### Backend en Railway:
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub
3. Configura:
   - **Start Command**: `cd backend && npm start`
   - **Variables de entorno**:
     ```
     NODE_ENV=production
     PORT=5000
     GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id
     GOOGLE_CLOUD_KEY_FILE=base64-encoded-credentials
     ```

### Opción B: Netlify + Render

#### Frontend en Netlify:
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `frontend/build` después de hacer `npm run build`
3. O conecta tu repositorio con:
   - **Build Command**: `cd frontend && npm run build`
   - **Publish Directory**: `frontend/build`

#### Backend en Render:
1. Ve a [render.com](https://render.com)
2. Conecta tu repositorio
3. Configura como Web Service:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

---

## 🔧 Configuración Rápida de Google Cloud

### 1. Crear Proyecto y Habilitar API
```bash
# Instalar Google Cloud CLI (opcional)
# https://cloud.google.com/sdk/docs/install

# O usar la consola web:
# 1. Ve a https://console.cloud.google.com/
# 2. Crea un nuevo proyecto
# 3. Habilita Vision API
# 4. Crea cuenta de servicio
# 5. Descarga credenciales JSON
```

### 2. Configurar Credenciales

#### Para deployment local:
```bash
# Copiar archivo de credenciales
cp path/to/service-account.json backend/credentials/
```

#### Para deployment en la nube:
```bash
# Convertir a base64 para variables de entorno
base64 -i service-account.json | pbcopy  # macOS
base64 service-account.json | clip       # Windows
cat service-account.json | base64        # Linux
```

---

## ⚡ Deployment de 5 Minutos

### Para Vercel (Frontend):
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Build y deploy
cd frontend
npm run build
vercel --prod
```

### Para Railway (Backend):
```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login y deploy
railway login
railway link
railway up
```

---

## 🐳 Deployment con Docker (Una línea)

```bash
# 1. Configurar credenciales
mkdir credentials
cp path/to/service-account.json credentials/

# 2. Crear .env
echo "GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id" > .env

# 3. Deploy
docker-compose up -d
```

---

## 🔍 Verificación Rápida

### Verificar que todo funcione:
```bash
# Backend
curl http://localhost:5000/health

# Frontend (si está en localhost)
curl http://localhost

# O visita en el navegador:
# http://localhost (frontend)
# http://localhost:5000/api (backend API)
```

---

## 🆘 Solución de Problemas Comunes

### Error: "Google Cloud credentials not found"
```bash
# Verificar que el archivo existe
ls -la backend/credentials/service-account.json

# Verificar variables de entorno
echo $GOOGLE_CLOUD_PROJECT_ID
echo $GOOGLE_CLOUD_KEY_FILE
```

### Error: "Port 5000 already in use"
```bash
# Cambiar puerto en backend/.env
echo "PORT=3001" >> backend/.env

# O matar proceso en puerto 5000
lsof -ti:5000 | xargs kill -9
```

### Error: "Build failed"
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build:production
```

---

## 📞 Soporte

Si tienes problemas con el deployment:

1. **Revisa los logs**:
   ```bash
   # Logs del backend
   pm2 logs ai-calorie-counter-backend
   
   # Logs de nginx
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Ejecuta el script de verificación**:
   ```bash
   ./deployment/verify-deployment.sh
   ```

3. **Revisa el checklist**:
   - [deployment/DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🎉 ¡Listo!

Una vez completado el deployment, tu aplicación estará disponible en:
- **Frontend**: https://tu-dominio.com
- **API**: https://tu-dominio.com/api
- **Health Check**: https://tu-dominio.com/api/health

¡Disfruta tu aplicación AI Calorie Counter en producción! 🚀