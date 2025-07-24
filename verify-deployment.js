#!/usr/bin/env node

/**
 * Script para verificar que el despliegue esté funcionando correctamente
 */

const https = require('https');
const http = require('http');

function checkUrl(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      console.log(`${success ? '✅' : '❌'} ${description}: ${res.statusCode} ${res.statusMessage}`);
      resolve(success);
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description}: Error - ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 Verificando despliegue de AI Calorie Counter...\n');
  
  // Leer información de despliegue
  let deploymentInfo;
  try {
    const fs = require('fs');
    deploymentInfo = JSON.parse(fs.readFileSync('deployment-result.json', 'utf8'));
  } catch (error) {
    console.log('❌ No se encontró deployment-result.json');
    console.log('💡 Ejecuta primero: node deploy.js');
    return;
  }
  
  const { railway, vercel } = deploymentInfo.deployment;
  
  console.log('📊 URLs configuradas:');
  console.log(`🌐 Frontend: ${vercel.url}`);
  console.log(`⚙️ Backend: ${railway.url}`);
  console.log('');
  
  // Verificar endpoints
  const checks = [
    { url: `${railway.url}/health`, description: 'Backend Health Check' },
    { url: `${railway.url}/api`, description: 'Backend API Info' },
    { url: vercel.url, description: 'Frontend Home Page' },
  ];
  
  console.log('🔍 Verificando endpoints...');
  const results = await Promise.all(
    checks.map(check => checkUrl(check.url, check.description))
  );
  
  const allPassed = results.every(result => result);
  
  console.log('\n📋 Resumen:');
  if (allPassed) {
    console.log('🎉 ¡Todos los checks pasaron exitosamente!');
    console.log('\n✅ Tu aplicación está funcionando correctamente en producción');
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Prueba subir una imagen de comida');
    console.log('2. Verifica que el análisis funcione');
    console.log('3. Comprueba que se guarde en el historial');
    console.log('4. Instala la PWA en tu dispositivo');
  } else {
    console.log('⚠️ Algunos checks fallaron');
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las variables de entorno estén configuradas');
    console.log('2. Revisa los logs en Railway y Vercel');
    console.log('3. Confirma que Google Cloud Vision API esté habilitada');
    console.log('4. Verifica que las credenciales sean correctas');
  }
  
  console.log('\n📖 Para más ayuda, consulta deployment/VERCEL_RAILWAY_GUIDE.md');
}

verifyDeployment().catch(console.error);