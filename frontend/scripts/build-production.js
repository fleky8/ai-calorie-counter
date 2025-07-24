#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
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

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.blue}🚀 ${description}${colors.reset}`);
    log(`${colors.cyan}Ejecutando: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}✅ ${description} - EXITOSO${colors.reset}`);
        resolve();
      } else {
        log(`${colors.red}❌ ${description} - FALLÓ (código: ${code})${colors.reset}`);
        reject(new Error(`${description} falló con código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      log(`${colors.red}❌ Error ejecutando ${description}: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

function checkFileSize(filePath, maxSize, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > maxSize) {
      log(`${colors.yellow}⚠️  ${description}: ${sizeInMB}MB (excede el límite recomendado)${colors.reset}`);
    } else {
      log(`${colors.green}✅ ${description}: ${sizeInMB}MB${colors.reset}`);
    }
  }
}

function analyzeBuildSize() {
  log(`\n${colors.magenta}📊 ANÁLISIS DEL BUILD${colors.reset}`);
  
  const buildDir = path.join(process.cwd(), 'build');
  const staticDir = path.join(buildDir, 'static');
  
  if (!fs.existsSync(buildDir)) {
    log(`${colors.red}❌ Directorio build no encontrado${colors.reset}`);
    return;
  }
  
  // Analizar archivos JavaScript
  const jsDir = path.join(staticDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      checkFileSize(filePath, 2 * 1024 * 1024, `JS: ${file}`); // 2MB límite
    });
  }
  
  // Analizar archivos CSS
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      checkFileSize(filePath, 500 * 1024, `CSS: ${file}`); // 500KB límite
    });
  }
  
  // Tamaño total del build
  function getDirSize(dirPath) {
    let totalSize = 0;
    
    function calculateSize(currentPath) {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
          calculateSize(path.join(currentPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    }
    
    calculateSize(dirPath);
    return totalSize;
  }
  
  const totalSize = getDirSize(buildDir);
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  log(`${colors.cyan}📦 Tamaño total del build: ${totalSizeInMB}MB${colors.reset}`);
}

function createDeploymentInfo() {
  const deploymentInfo = {
    buildDate: new Date().toISOString(),
    version: require('../package.json').version,
    nodeVersion: process.version,
    environment: 'production',
    features: {
      pwa: true,
      lazyLoading: true,
      codesplitting: true,
      serviceWorker: true
    }
  };
  
  const buildDir = path.join(process.cwd(), 'build');
  const infoPath = path.join(buildDir, 'deployment-info.json');
  
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
  log(`${colors.green}✅ Información de deployment creada: ${infoPath}${colors.reset}`);
}

async function buildForProduction() {
  const startTime = Date.now();
  
  log(`${colors.bright}${colors.magenta}🏗️  BUILD DE PRODUCCIÓN${colors.reset}`);
  log(`${colors.yellow}Iniciando build en: ${new Date().toLocaleString()}${colors.reset}`);
  
  try {
    // 1. Limpiar build anterior
    if (fs.existsSync('build')) {
      await runCommand('rm', ['-rf', 'build'], 'Limpiando build anterior');
    }
    
    // 2. Ejecutar tests antes del build
    log(`${colors.blue}🧪 Ejecutando tests antes del build...${colors.reset}`);
    await runCommand('npm', ['test', '--', '--coverage', '--watchAll=false'], 'Tests unitarios');
    
    // 3. Lint del código
    await runCommand('npm', ['run', 'lint'], 'Análisis de código (ESLint)');
    
    // 4. Build de producción
    await runCommand('npm', ['run', 'build'], 'Build de producción');
    
    // 5. Analizar tamaño del build
    analyzeBuildSize();
    
    // 6. Crear información de deployment
    createDeploymentInfo();
    
    // 7. Verificar que los archivos críticos existen
    const criticalFiles = [
      'build/index.html',
      'build/manifest.json',
      'build/static/js',
      'build/static/css'
    ];
    
    log(`\n${colors.blue}🔍 Verificando archivos críticos...${colors.reset}`);
    criticalFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        log(`${colors.green}✅ ${file}${colors.reset}`);
      } else {
        log(`${colors.red}❌ ${file} - NO ENCONTRADO${colors.reset}`);
        throw new Error(`Archivo crítico no encontrado: ${file}`);
      }
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`\n${colors.bright}${colors.green}🎉 BUILD DE PRODUCCIÓN COMPLETADO${colors.reset}`);
    log(`${colors.cyan}Tiempo total: ${duration}s${colors.reset}`);
    log(`${colors.yellow}Los archivos están listos en el directorio 'build/'${colors.reset}`);
    
    // Instrucciones de deployment
    log(`\n${colors.bright}${colors.blue}📋 INSTRUCCIONES DE DEPLOYMENT:${colors.reset}`);
    log(`${colors.cyan}1. Subir el contenido de 'build/' a tu servidor web${colors.reset}`);
    log(`${colors.cyan}2. Configurar el servidor para servir index.html para rutas SPA${colors.reset}`);
    log(`${colors.cyan}3. Configurar HTTPS (requerido para PWA y cámara)${colors.reset}`);
    log(`${colors.cyan}4. Verificar que las variables de entorno estén configuradas${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}❌ Error durante el build: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Manejar interrupciones
process.on('SIGINT', () => {
  log(`${colors.yellow}\n⚠️  Build interrumpido por el usuario${colors.reset}`);
  process.exit(1);
});

// Ejecutar build
buildForProduction();