# AI Calorie Counter

Una aplicación web progresiva (PWA) que utiliza inteligencia artificial para analizar imágenes de alimentos y proporcionar información nutricional detallada.

## 🚀 Características

- **Análisis de imágenes con IA**: Utiliza Google Cloud Vision API para identificar alimentos
- **Información nutricional completa**: Calorías, macronutrientes, vitaminas y minerales
- **PWA**: Funciona offline y se puede instalar como aplicación nativa
- **Historial de análisis**: Guarda y consulta análisis anteriores
- **Interfaz responsive**: Optimizada para móviles y escritorio
- **Captura de cámara**: Toma fotos directamente desde la aplicación

## �️ Tecnsologías

### Frontend
- React 18
- Styled Components
- React Router
- Service Workers (PWA)
- Chart.js para visualizaciones

### Backend
- Node.js + Express
- Google Cloud Vision API
- Multer para manejo de archivos
- Rate limiting y validación de seguridad

## 🚀 Despliegue Rápido

### Opción 1: Asistente Automático ⚡

```bash
# 1. Preparar el proyecto
node prepare-deployment.js

# 2. Ejecutar asistente de despliegue
node deploy.js
```

El asistente te guiará paso a paso para desplegar en:
- **Backend**: Railway (https://railway.app)
- **Frontend**: Vercel (https://vercel.com)

### Opción 2: Guía Manual 📖

Consulta las guías detalladas:
- [`deployment/VERCEL_RAILWAY_GUIDE.md`](deployment/VERCEL_RAILWAY_GUIDE.md) - Guía paso a paso (15 min)
- [`deployment/DEPLOYMENT_GUIDE.md`](deployment/DEPLOYMENT_GUIDE.md) - Guía general
- [`deployment/DEPLOYMENT_CHECKLIST.md`](deployment/DEPLOYMENT_CHECKLIST.md) - Lista de verificación

## 📦 Desarrollo Local

### Prerrequisitos
- Node.js 16+
- Cuenta de Google Cloud con Vision API habilitada
- Credenciales de servicio de Google Cloud

### Configuración Rápida

1. **Clonar e instalar**
```bash
git clone <repository-url>
cd ai-calorie-counter

# Instalar dependencias
npm install
cd frontend && npm install
cd ../backend && npm install
```

2. **Configurar Google Cloud**
```bash
# Copiar archivo de ejemplo
cp backend/.env.example backend/.env

# Editar backend/.env con tus credenciales
GOOGLE_CLOUD_PROJECT_ID=tu-project-id
GOOGLE_CLOUD_KEY_FILE=ruta/a/credenciales.json
```

3. **Ejecutar en desarrollo**
```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- Frontend en http://localhost:3000
- Backend en http://localhost:5000

## 🧪 Testing

```bash
# Tests completos
npm run test:all

# Solo frontend
cd frontend && npm test

# Solo backend
cd backend && npm test
```

## 📊 URLs de Producción

Una vez desplegado, tendrás:

- **Frontend**: https://tu-app.vercel.app
- **Backend**: https://tu-app.railway.app
- **API Health**: https://tu-app.railway.app/health

## 📱 PWA Features

- ✅ Instalable en móviles y escritorio
- ✅ Funciona offline (historial)
- ✅ Notificaciones de actualización
- ✅ Iconos adaptativos
- ✅ Splash screen personalizada

## 🔒 Seguridad

- Validación de tipos de archivo (JPEG, PNG, WebP)
- Rate limiting (100 requests/15min)
- Sanitización de datos
- Headers de seguridad CORS
- Límite de tamaño de archivos (5MB)

## 📊 Estructura del Proyecto

```
ai-calorie-counter/
├── 📱 frontend/              # React PWA
│   ├── src/components/      # Componentes UI
│   ├── src/services/        # API y servicios
│   ├── src/hooks/          # Custom hooks
│   └── public/             # PWA assets
├── ⚙️ backend/              # Node.js API
│   ├── routes/             # Endpoints REST
│   ├── services/           # Google Vision + Nutrición
│   ├── middleware/         # Validación y seguridad
│   └── data/              # Base de datos nutricional
├── 🚀 deployment/           # Guías de despliegue
├── 📋 prepare-deployment.js # Script de preparación
└── 🤖 deploy.js            # Asistente de despliegue
```

## 🎯 Características Técnicas

### Frontend
- **React 18** con hooks modernos
- **Styled Components** para CSS-in-JS
- **PWA** con service workers
- **Responsive design** mobile-first
- **Error boundaries** para manejo de errores
- **Lazy loading** para optimización

### Backend
- **Express.js** con middleware personalizado
- **Google Cloud Vision API** para análisis de imágenes
- **Multer** para upload de archivos
- **Rate limiting** con express-rate-limit
- **Base de datos nutricional** integrada
- **Validación robusta** de archivos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [`LICENSE`](LICENSE) para detalles.

## 🆘 Soporte

### Problemas Comunes

1. **Error de Google Vision API**
   - Verifica que la API esté habilitada
   - Revisa las credenciales JSON
   - Confirma el Project ID

2. **Build falla**
   - Ejecuta `npm run build:production`
   - Revisa errores de ESLint

3. **PWA no se instala**
   - Verifica HTTPS en producción
   - Revisa el manifest.json

### Obtener Ayuda

- 📖 Consulta [`deployment/`](deployment/) para guías detalladas
- 🐛 Reporta bugs en Issues
- 💬 Preguntas en Discussions

## 🎯 Roadmap

- [ ] 🌍 Soporte multiidioma
- [ ] 🥗 Análisis de recetas completas
- [ ] 📊 Dashboard de nutrición
- [ ] 🎯 Objetivos nutricionales personalizados
- [ ] 📱 App móvil nativa
- [ ] 🔗 Integración con APIs nutricionales externas

---

**¿Listo para desplegar?** Ejecuta `node deploy.js` y sigue las instrucciones 🚀