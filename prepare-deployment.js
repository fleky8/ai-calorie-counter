#!/usr/bin/env node

/**
 * Script para preparar el despliegue de AI Calorie Counter
 * Este script verifica que todo esté listo para el despliegue
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando despliegue de AI Calorie Counter...\n');

// Verificar que existan los directorios necesarios
const requiredDirs = [
  'frontend',
  'backend',
  'deployment'
];

console.log('📁 Verificando estructura de directorios...');
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directorio faltante: ${dir}`);
    process.exit(1);
  }
  console.log(`✅ ${dir}/`);
}

// Verificar archivos de configuración
const requiredFiles = [
  'frontend/package.json',
  'backend/package.json',
  'backend/.env.example',
  'deployment/VERCEL_RAILWAY_GUIDE.md'
];

console.log('\n📄 Verificando archivos de configuración...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Archivo faltante: ${file}`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
}

// Verificar que el build del frontend exista
console.log('\n🏗️ Verificando build del frontend...');
if (!fs.existsSync('frontend/build')) {
  console.log('⚠️ Build del frontend no encontrado. Creando...');
  try {
    execSync('npm run build', { cwd: 'frontend', stdio: 'inherit' });
    console.log('✅ Build del frontend creado exitosamente');
  } catch (error) {
    console.error('❌ Error al crear build del frontend:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Build del frontend existe');
}

// Verificar dependencias del backend
console.log('\n📦 Verificando dependencias del backend...');
try {
  execSync('npm list --production', { cwd: 'backend', stdio: 'pipe' });
  console.log('✅ Dependencias del backend verificadas');
} catch (error) {
  console.log('⚠️ Instalando dependencias del backend...');
  execSync('npm install --production', { cwd: 'backend', stdio: 'inherit' });
}

// Crear archivo de información de despliegue
const deploymentInfo = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  frontend: {
    buildExists: fs.existsSync('frontend/build'),
    buildSize: fs.existsSync('frontend/build') ? getDirectorySize('frontend/build') : 0
  },
  backend: {
    hasEnvExample: fs.existsSync('backend/.env.example'),
    dependencies: 'verified'
  },
  deployment: {
    guides: [
      'deployment/VERCEL_RAILWAY_GUIDE.md',
      'deployment/DEPLOYMENT_GUIDE.md',
      'deployment/DEPLOYMENT_CHECKLIST.md'
    ]
  }
};

fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

console.log('\n✅ Preparación de despliegue completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configurar Google Cloud Vision API');
console.log('2. Crear repositorio en GitHub');
console.log('3. Desplegar backend en Railway');
console.log('4. Desplegar frontend en Vercel');
console.log('\n📖 Consulta deployment/VERCEL_RAILWAY_GUIDE.md para instrucciones detalladas');

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}