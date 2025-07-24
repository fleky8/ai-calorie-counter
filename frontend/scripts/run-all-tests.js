#!/usr/bin/env node

const { spawn } = require('child_process');
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
      cwd: process.cwd()
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

async function runAllTests() {
  const startTime = Date.now();
  
  log(`${colors.bright}${colors.magenta}🧪 EJECUTANDO SUITE COMPLETA DE TESTS${colors.reset}`);
  log(`${colors.yellow}Iniciando tests en: ${new Date().toLocaleString()}${colors.reset}`);
  
  const testSuites = [
    {
      command: 'npm',
      args: ['test', '--', '--coverage', '--watchAll=false'],
      description: 'Tests Unitarios y de Integración (Jest)'
    },
    {
      command: 'npm',
      args: ['run', 'lint'],
      description: 'Análisis de Código (ESLint)'
    }
  ];
  
  // Verificar si Cypress está disponible para tests E2E
  try {
    await runCommand('npx', ['cypress', 'verify'], 'Verificación de Cypress');
    testSuites.push({
      command: 'npm',
      args: ['run', 'test:e2e'],
      description: 'Tests End-to-End (Cypress)'
    });
  } catch (error) {
    log(`${colors.yellow}⚠️  Cypress no está disponible, saltando tests E2E${colors.reset}`);
  }
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const suite of testSuites) {
    try {
      await runCommand(suite.command, suite.args, suite.description);
      passedTests++;
    } catch (error) {
      failedTests++;
      log(`${colors.red}Error en ${suite.description}: ${error.message}${colors.reset}`);
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\n${colors.bright}${colors.magenta}📊 RESUMEN DE TESTS${colors.reset}`);
  log(`${colors.cyan}Tiempo total: ${duration}s${colors.reset}`);
  log(`${colors.green}Tests exitosos: ${passedTests}${colors.reset}`);
  log(`${colors.red}Tests fallidos: ${failedTests}${colors.reset}`);
  
  if (failedTests === 0) {
    log(`${colors.bright}${colors.green}🎉 ¡TODOS LOS TESTS PASARON!${colors.reset}`);
    process.exit(0);
  } else {
    log(`${colors.bright}${colors.red}💥 ALGUNOS TESTS FALLARON${colors.reset}`);
    process.exit(1);
  }
}

// Manejar interrupciones
process.on('SIGINT', () => {
  log(`${colors.yellow}\n⚠️  Tests interrumpidos por el usuario${colors.reset}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log(`${colors.yellow}\n⚠️  Tests terminados${colors.reset}`);
  process.exit(1);
});

// Ejecutar tests
runAllTests().catch((error) => {
  log(`${colors.red}❌ Error ejecutando tests: ${error.message}${colors.reset}`);
  process.exit(1);
});