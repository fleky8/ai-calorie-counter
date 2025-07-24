#!/usr/bin/env node

/**
 * Script interactivo para desplegar AI Calorie Counter
 * Guía paso a paso para el despliegue en Vercel + Railway
 */

const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 Asistente de Despliegue - AI Calorie Counter');
  console.log('='.repeat(50));
  
  // Verificar preparación
  if (!fs.existsSync('deployment-info.json')) {
    console.log('⚠️ Ejecutando preparación de despliegue...');
    execSync('node prepare-deployment.js', { stdio: 'inherit' });
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  console.log('\n📊 Estado del proyecto:');
  console.log(`✅ Frontend build: ${deploymentInfo.frontend.buildExists ? 'Listo' : 'Faltante'}`);
  console.log(`✅ Backend: ${deploymentInfo.backend.dependencies}`);
  console.log(`📅 Preparado: ${new Date(deploymentInfo.timestamp).toLocaleString()}`);
  
  console.log('\n🎯 Este asistente te guiará a través del despliegue en:');
  console.log('• Backend: Railway (https://railway.app)');
  console.log('• Frontend: Vercel (https://vercel.com)');
  
  const proceed = await ask('\n¿Quieres continuar con el despliegue? (s/n): ');
  if (proceed.toLowerCase() !== 's') {
    console.log('👋 Despliegue cancelado');
    rl.close();
    return;
  }
  
  // Paso 1: Google Cloud
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 1: Configurar Google Cloud Vision API');
  console.log('='.repeat(50));
  
  console.log('\n1. Ve a https://console.cloud.google.com/');
  console.log('2. Crea un nuevo proyecto o selecciona uno existente');
  console.log('3. Habilita la Vision API');
  console.log('4. Crea una cuenta de servicio con rol "Cloud Vision API User"');
  console.log('5. Descarga las credenciales JSON');
  
  const hasGoogleCloud = await ask('\n¿Has completado la configuración de Google Cloud? (s/n): ');
  if (hasGoogleCloud.toLowerCase() !== 's') {
    console.log('⚠️ Completa la configuración de Google Cloud antes de continuar');
    console.log('📖 Consulta deployment/VERCEL_RAILWAY_GUIDE.md para más detalles');
    rl.close();
    return;
  }
  
  const projectId = await ask('Ingresa tu Google Cloud Project ID: ');
  const credentialsPath = await ask('Ingresa la ruta al archivo de credenciales JSON: ');
  
  // Verificar credenciales
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Archivo de credenciales no encontrado');
    rl.close();
    return;
  }
  
  // Convertir credenciales a Base64
  console.log('\n🔄 Convirtiendo credenciales a Base64...');
  const credentialsContent = fs.readFileSync(credentialsPath);
  const credentialsBase64 = credentialsContent.toString('base64');
  
  // Paso 2: GitHub
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 2: Subir código a GitHub');
  console.log('='.repeat(50));
  
  console.log('\n1. Ve a https://github.com y crea un nuevo repositorio');
  console.log('2. Nombra el repositorio "ai-calorie-counter"');
  console.log('3. Ejecuta los siguientes comandos:');
  
  const repoUrl = await ask('\nIngresa la URL de tu repositorio GitHub: ');
  
  console.log('\n📝 Comandos para subir el código:');
  console.log('git init');
  console.log('git add .');
  console.log('git commit -m "Initial commit: AI Calorie Counter"');
  console.log(`git remote add origin ${repoUrl}`);
  console.log('git branch -M main');
  console.log('git push -u origin main');
  
  const gitDone = await ask('\n¿Has subido el código a GitHub? (s/n): ');
  if (gitDone.toLowerCase() !== 's') {
    console.log('⚠️ Sube el código a GitHub antes de continuar');
    rl.close();
    return;
  }
  
  // Paso 3: Railway
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 3: Desplegar Backend en Railway');
  console.log('='.repeat(50));
  
  console.log('\n1. Ve a https://railway.app y regístrate/inicia sesión');
  console.log('2. Haz clic en "New Project" > "Deploy from GitHub repo"');
  console.log('3. Selecciona tu repositorio "ai-calorie-counter"');
  console.log('4. Configura las siguientes variables de entorno:');
  
  console.log('\n🔧 Variables de entorno para Railway:');
  console.log('NODE_ENV=production');
  console.log('PORT=5000');
  console.log(`GOOGLE_CLOUD_PROJECT_ID=${projectId}`);
  console.log('GOOGLE_CLOUD_KEY_FILE_BASE64=[pegar el Base64 de abajo]');
  console.log('MAX_FILE_SIZE=5242880');
  console.log('ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp');
  console.log('RATE_LIMIT_WINDOW_MS=900000');
  console.log('RATE_LIMIT_MAX_REQUESTS=100');
  
  console.log('\n📋 Base64 de credenciales (copia esto):');
  console.log('-'.repeat(50));
  console.log(credentialsBase64);
  console.log('-'.repeat(50));
  
  console.log('\n5. En Settings, configura:');
  console.log('   - Root Directory: backend');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: npm start');
  
  const railwayUrl = await ask('\nIngresa la URL de tu backend en Railway (ej: https://tu-app.railway.app): ');
  
  // Paso 4: Vercel
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 4: Desplegar Frontend en Vercel');
  console.log('='.repeat(50));
  
  console.log('\n1. Ve a https://vercel.com y regístrate/inicia sesión');
  console.log('2. Haz clic en "New Project"');
  console.log('3. Selecciona tu repositorio "ai-calorie-counter"');
  console.log('4. Configura:');
  console.log('   - Framework Preset: Create React App');
  console.log('   - Root Directory: frontend');
  console.log('   - Build Command: npm run build');
  console.log('   - Output Directory: build');
  
  console.log('\n🔧 Variables de entorno para Vercel:');
  console.log('REACT_APP_ENV=production');
  console.log(`REACT_APP_API_URL=${railwayUrl}/api`);
  console.log('REACT_APP_VERSION=1.0.0');
  console.log('REACT_APP_PWA_NAME=AI Calorie Counter');
  console.log('REACT_APP_PWA_SHORT_NAME=CalorieAI');
  
  const vercelUrl = await ask('\nIngresa la URL de tu frontend en Vercel (ej: https://tu-app.vercel.app): ');
  
  // Paso 5: Configurar CORS
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 5: Configurar CORS');
  console.log('='.repeat(50));
  
  console.log('\n1. Ve a Railway > Variables de entorno');
  console.log('2. Agrega la variable:');
  console.log(`CORS_ORIGIN=${vercelUrl}`);
  console.log('3. Railway redesplegará automáticamente');
  
  // Paso 6: Verificación
  console.log('\n' + '='.repeat(50));
  console.log('📋 PASO 6: Verificar Despliegue');
  console.log('='.repeat(50));
  
  console.log('\n🔍 Verifica que todo funcione:');
  console.log(`1. Backend health: ${railwayUrl}/health`);
  console.log(`2. Frontend: ${vercelUrl}`);
  console.log('3. Sube una imagen de comida para probar el análisis');
  
  // Guardar información de despliegue
  const deploymentResult = {
    ...deploymentInfo,
    deployment: {
      timestamp: new Date().toISOString(),
      googleCloud: {
        projectId,
        configured: true
      },
      github: {
        repository: repoUrl,
        uploaded: true
      },
      railway: {
        url: railwayUrl,
        deployed: true
      },
      vercel: {
        url: vercelUrl,
        deployed: true
      }
    }
  };
  
  fs.writeFileSync('deployment-result.json', JSON.stringify(deploymentResult, null, 2));
  
  console.log('\n🎉 ¡Despliegue completado!');
  console.log('\n📊 URLs de tu aplicación:');
  console.log(`🌐 Frontend: ${vercelUrl}`);
  console.log(`⚙️ Backend: ${railwayUrl}`);
  console.log(`🔍 API Health: ${railwayUrl}/health`);
  
  console.log('\n📝 Información guardada en deployment-result.json');
  console.log('\n🚀 ¡Tu AI Calorie Counter está ahora en producción!');
  
  rl.close();
}

main().catch(console.error);