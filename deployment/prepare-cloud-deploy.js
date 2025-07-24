#!/usr/bin/env node

// 🚀 Script para preparar deployment en Vercel + Railway
// Este script configura automáticamente los archivos necesarios

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Crear interfaz para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  log(`${colors.bright}${colors.magenta}🚀 PREPARANDO DEPLOYMENT PARA VERCEL + RAILWAY${colors.reset}`);
  log(`${colors.yellow}Este script configurará automáticamente tu proyecto para deployment en la nube${colors.reset}\n`);

  try {
    // 1. Verificar que estamos en el directorio correcto
    if (!fs.existsSync('package.json') || !fs.existsSync('frontend') || !fs.existsSync('backend')) {
      error('Este script debe ejecutarse desde el directorio raíz del proyecto AI Calorie Counter');
      process.exit(1);
    }

    success('Proyecto AI Calorie Counter detectado');

    // 2. Obtener información del usuario
    log('\n📋 Configuración del proyecto:');
    
    const projectName = await askQuestion('Nombre del proyecto (ai-calorie-counter): ') || 'ai-calorie-counter';
    const googleProjectId = await askQuestion('Google Cloud Project ID: ');
    
    if (!googleProjectId) {
      error('Google Cloud Project ID es requerido');
      process.exit(1);
    }

    const hasCredentials = await askQuestion('¿Ya tienes las credenciales de Google Cloud en Base64? (y/n): ');
    
    let credentialsBase64 = '';
    if (hasCredentials.toLowerCase() === 'y' || hasCredentials.toLowerCase() === 'yes') {
      credentialsBase64 = await askQuestion('Pega las credenciales en Base64: ');
    } else {
      warning('Necesitarás convertir tus credenciales de Google Cloud a Base64');
      info('Instrucciones:');
      info('1. Descarga el archivo JSON de credenciales de Google Cloud');
      info('2. Convierte a Base64:');
      info('   Windows: [Convert]::ToBase64String([IO.File]::ReadAllBytes("archivo.json"))');
      info('   macOS: base64 -i archivo.json | pbcopy');
      info('   Linux: base64 archivo.json');
    }

    // 3. Actualizar package.json del frontend para Vercel
    log('\n🔧 Configurando archivos para Vercel...');
    
    const frontendPackagePath = path.join('frontend', 'package.json');
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    
    // Agregar scripts específicos para Vercel
    frontendPackage.scripts = {
      ...frontendPackage.scripts,
      'vercel-build': 'npm run build',
      'vercel-dev': 'npm start'
    };

    fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackage, null, 2));
    success('package.json del frontend actualizado');

    // 4. Crear archivo de configuración para Vercel
    const vercelConfig = {
      "version": 2,
      "name": projectName + "-frontend",
      "buildCommand": "npm run build",
      "outputDirectory": "build",
      "installCommand": "npm install",
      "devCommand": "npm start",
      "routes": [
        {
          "src": "/static/(.*)",
          "dest": "/static/$1"
        },
        {
          "src": "/manifest.json",
          "dest": "/manifest.json"
        },
        {
          "src": "/favicon.ico",
          "dest": "/favicon.ico"
        },
        {
          "src": "/(.*)",
          "dest": "/index.html"
        }
      ]
    };

    fs.writeFileSync(path.join('frontend', 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
    success('Configuración de Vercel creada');

    // 5. Crear archivo de configuración para Railway
    const railwayConfig = {
      "$schema": "https://railway.app/railway.schema.json",
      "build": {
        "builder": "NIXPACKS",
        "buildCommand": "cd backend && npm install --production"
      },
      "deploy": {
        "startCommand": "cd backend && npm start",
        "healthcheckPath": "/health",
        "healthcheckTimeout": 100,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
      }
    };

    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    success('Configuración de Railway creada');

    // 6. Crear archivo .env.example para Railway
    const railwayEnvExample = `# Variables de entorno para Railway (Backend)
NODE_ENV=production
PORT=5000
GOOGLE_CLOUD_PROJECT_ID=${googleProjectId}
GOOGLE_CLOUD_KEY_FILE_BASE64=tu-credencial-base64-aqui
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100`;

    fs.writeFileSync('railway.env.example', railwayEnvExample);
    success('Archivo de ejemplo para variables de Railway creado');

    // 7. Crear archivo .env.example para Vercel
    const vercelEnvExample = `# Variables de entorno para Vercel (Frontend)
REACT_APP_ENV=production
REACT_APP_API_URL=https://tu-backend-railway-url.railway.app/api
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_NAME=AI Calorie Counter
REACT_APP_PWA_SHORT_NAME=CalorieAI
REACT_APP_PWA_DESCRIPTION=Contador de calorías con inteligencia artificial`;

    fs.writeFileSync('vercel.env.example', vercelEnvExample);
    success('Archivo de ejemplo para variables de Vercel creado');

    // 8. Crear README específico para deployment
    const deploymentReadme = `# 🚀 Deployment Instructions

## Quick Deploy: Vercel + Railway

### 1. Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables from \`railway.env.example\`
4. Deploy automatically

### 2. Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to \`frontend\`
4. Add environment variables from \`vercel.env.example\`
5. Deploy automatically

### 3. Environment Variables

#### Railway (Backend):
\`\`\`
NODE_ENV=production
PORT=5000
GOOGLE_CLOUD_PROJECT_ID=${googleProjectId}
GOOGLE_CLOUD_KEY_FILE_BASE64=${credentialsBase64 ? '[CONFIGURED]' : '[PASTE_YOUR_BASE64_CREDENTIALS]'}
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

#### Vercel (Frontend):
\`\`\`
REACT_APP_ENV=production
REACT_APP_API_URL=[YOUR_RAILWAY_BACKEND_URL]/api
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_NAME=AI Calorie Counter
REACT_APP_PWA_SHORT_NAME=CalorieAI
\`\`\`

### 4. After Deployment
- Update \`REACT_APP_API_URL\` in Vercel with your Railway backend URL
- Test the application end-to-end
- Configure custom domains if needed

## Files Created:
- \`frontend/vercel.json\` - Vercel configuration
- \`railway.json\` - Railway configuration  
- \`railway.env.example\` - Backend environment variables
- \`vercel.env.example\` - Frontend environment variables

## Support:
See \`deployment/VERCEL_RAILWAY_GUIDE.md\` for detailed step-by-step instructions.
`;

    fs.writeFileSync('DEPLOYMENT.md', deploymentReadme);
    success('README de deployment creado');

    // 9. Verificar que el build funcione
    log('\n🧪 Verificando que el build funcione...');
    
    try {
      const { execSync } = require('child_process');
      
      // Test build del frontend
      log('Probando build del frontend...');
      execSync('cd frontend && npm install', { stdio: 'inherit' });
      execSync('cd frontend && npm run build', { stdio: 'inherit' });
      success('Build del frontend exitoso');
      
      // Test del backend
      log('Probando instalación del backend...');
      execSync('cd backend && npm install', { stdio: 'inherit' });
      success('Instalación del backend exitosa');
      
    } catch (buildError) {
      warning('Hubo un problema con el build, pero los archivos de configuración están listos');
      warning('Puedes continuar con el deployment y resolver los problemas después');
    }

    // 10. Mostrar resumen final
    log(`\n${colors.bright}${colors.green}🎉 ¡CONFIGURACIÓN COMPLETADA!${colors.reset}\n`);
    
    log(`${colors.bright}📋 Archivos creados:${colors.reset}`);
    log(`   ✅ frontend/vercel.json - Configuración de Vercel`);
    log(`   ✅ railway.json - Configuración de Railway`);
    log(`   ✅ railway.env.example - Variables de entorno para Railway`);
    log(`   ✅ vercel.env.example - Variables de entorno para Vercel`);
    log(`   ✅ DEPLOYMENT.md - Instrucciones de deployment`);

    log(`\n${colors.bright}🚀 Próximos pasos:${colors.reset}`);
    log(`   1. Sube tu código a GitHub: git add . && git commit -m "Ready for deployment" && git push`);
    log(`   2. Ve a Railway.app y conecta tu repositorio`);
    log(`   3. Ve a Vercel.com y conecta tu repositorio`);
    log(`   4. Configura las variables de entorno en ambas plataformas`);
    log(`   5. ¡Disfruta tu aplicación en producción!`);

    log(`\n${colors.bright}📚 Documentación detallada:${colors.reset}`);
    log(`   📖 deployment/VERCEL_RAILWAY_GUIDE.md - Guía paso a paso completa`);

    if (!credentialsBase64) {
      log(`\n${colors.bright}${colors.yellow}⚠️  RECORDATORIO:${colors.reset}`);
      log(`   No olvides convertir tus credenciales de Google Cloud a Base64`);
      log(`   y configurarlas en Railway como GOOGLE_CLOUD_KEY_FILE_BASE64`);
    }

  } catch (err) {
    error(`Error durante la configuración: ${err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar script
main().catch((err) => {
  error(`Error inesperado: ${err.message}`);
  process.exit(1);
});