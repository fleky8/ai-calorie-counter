// Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;

// Mock de console.log para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};