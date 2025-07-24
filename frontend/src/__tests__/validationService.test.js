import {
  validateImageFile,
  sanitizeString,
  sanitizeObject,
  RateLimiter,
  globalRateLimiter
} from '../services/validationService';
import { AppError, ErrorTypes } from '../services/errorService';

// Mock para URL.createObjectURL y URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock para Image
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.width = 800;
    this.height = 600;
  }
  
  set src(value) {
    // Simular carga exitosa de imagen
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};

describe('Validation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImageFile', () => {
    const createMockFile = (type = 'image/jpeg', size = 1024 * 1024) => ({
      type,
      size,
      name: 'test.jpg'
    });

    test('valida correctamente un archivo de imagen válido', async () => {
      const file = createMockFile();
      
      const result = await validateImageFile(file);
      
      expect(result).toBe(true);
    });

    test('lanza error si no se proporciona archivo', async () => {
      await expect(validateImageFile(null)).rejects.toThrow(AppError);
      await expect(validateImageFile(null)).rejects.toThrow('No se ha proporcionado ningún archivo');
    });

    test('lanza error para tipo de archivo no permitido', async () => {
      const file = createMockFile('application/pdf');
      
      await expect(validateImageFile(file)).rejects.toThrow(AppError);
      await expect(validateImageFile(file)).rejects.toThrow('Tipo de archivo no permitido');
    });

    test('lanza error para archivo demasiado grande', async () => {
      const file = createMockFile('image/jpeg', 10 * 1024 * 1024); // 10MB
      
      await expect(validateImageFile(file)).rejects.toThrow(AppError);
      await expect(validateImageFile(file)).rejects.toThrow('El archivo es demasiado grande');
    });

    test('permite configurar tipos de archivo permitidos', async () => {
      const file = createMockFile('image/gif');
      
      // Sin incluir GIF en tipos permitidos
      await expect(validateImageFile(file)).rejects.toThrow(AppError);
      
      // Incluyendo GIF en tipos permitidos
      const result = await validateImageFile(file, {
        allowedTypes: ['image/gif']
      });
      
      expect(result).toBe(true);
    });

    test('permite configurar tamaño máximo de archivo', async () => {
      const file = createMockFile('image/jpeg', 2 * 1024 * 1024); // 2MB
      
      // Con límite de 1MB
      await expect(validateImageFile(file, {
        maxSize: 1024 * 1024
      })).rejects.toThrow(AppError);
      
      // Con límite de 3MB
      const result = await validateImageFile(file, {
        maxSize: 3 * 1024 * 1024
      });
      
      expect(result).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    test('elimina etiquetas HTML', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeString(input);
      
      expect(result).toBe('alert(&quot;xss&quot;)Hello World');
      expect(result).not.toContain('<script>');
    });

    test('escapa caracteres especiales', () => {
      const input = 'Hello & "World" <test>';
      const result = sanitizeString(input);
      
      expect(result).toBe('Hello &amp; &quot;World&quot; ');
    });

    test('maneja valores no string', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });

    test('maneja cadenas vacías', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    test('sanitiza strings en objetos', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        description: 'Hello & "World"'
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('alert(&quot;xss&quot;)John');
      expect(result.description).toBe('Hello &amp; &quot;World&quot;');
    });

    test('sanitiza objetos anidados', () => {
      const input = {
        user: {
          name: '<script>alert("xss")</script>John',
          profile: {
            bio: 'Hello & "World"'
          }
        }
      };
      
      const result = sanitizeObject(input);
      
      expect(result.user.name).toBe('alert(&quot;xss&quot;)John');
      expect(result.user.profile.bio).toBe('Hello &amp; &quot;World&quot;');
    });

    test('sanitiza arrays', () => {
      const input = ['<script>alert("xss")</script>', 'Hello & "World"'];
      
      const result = sanitizeObject(input);
      
      expect(result[0]).toBe('alert(&quot;xss&quot;)');
      expect(result[1]).toBe('Hello &amp; &quot;World&quot;');
    });

    test('preserva valores no string', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        data: null
      };
      
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });

    test('maneja valores null y undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        maxRequests: 3,
        timeWindow: 1000 // 1 segundo
      });
    });

    test('permite solicitudes dentro del límite', () => {
      expect(() => rateLimiter.checkLimit()).not.toThrow();
      expect(() => rateLimiter.checkLimit()).not.toThrow();
      expect(() => rateLimiter.checkLimit()).not.toThrow();
    });

    test('bloquea solicitudes que exceden el límite', () => {
      // Realizar solicitudes hasta el límite
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      
      // La siguiente solicitud debe ser bloqueada
      expect(() => rateLimiter.checkLimit()).toThrow(AppError);
      expect(() => rateLimiter.checkLimit()).toThrow('Has alcanzado el límite de solicitudes');
    });

    test('permite solicitudes después de que expire la ventana de tiempo', (done) => {
      // Realizar solicitudes hasta el límite
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      
      // Verificar que está bloqueado
      expect(() => rateLimiter.checkLimit()).toThrow(AppError);
      
      // Esperar a que expire la ventana de tiempo
      setTimeout(() => {
        expect(() => rateLimiter.checkLimit()).not.toThrow();
        done();
      }, 1100);
    });

    test('maneja diferentes claves de solicitud por separado', () => {
      // Realizar solicitudes para la clave 'api1'
      rateLimiter.checkLimit('api1');
      rateLimiter.checkLimit('api1');
      rateLimiter.checkLimit('api1');
      
      // La siguiente solicitud para 'api1' debe ser bloqueada
      expect(() => rateLimiter.checkLimit('api1')).toThrow(AppError);
      
      // Pero las solicitudes para 'api2' deben estar permitidas
      expect(() => rateLimiter.checkLimit('api2')).not.toThrow();
    });

    test('getRemainingTime devuelve el tiempo correcto', () => {
      // Realizar solicitudes hasta el límite
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      
      const remainingTime = rateLimiter.getRemainingTime();
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(1000);
    });

    test('reset limpia el contador para una clave específica', () => {
      // Realizar solicitudes hasta el límite
      rateLimiter.checkLimit('test');
      rateLimiter.checkLimit('test');
      rateLimiter.checkLimit('test');
      
      // Verificar que está bloqueado
      expect(() => rateLimiter.checkLimit('test')).toThrow(AppError);
      
      // Reiniciar el contador
      rateLimiter.reset('test');
      
      // Ahora debe permitir solicitudes nuevamente
      expect(() => rateLimiter.checkLimit('test')).not.toThrow();
    });
  });

  describe('globalRateLimiter', () => {
    beforeEach(() => {
      globalRateLimiter.reset();
    });

    test('es una instancia de RateLimiter', () => {
      expect(globalRateLimiter).toBeInstanceOf(RateLimiter);
    });

    test('funciona como rate limiter global', () => {
      // Realizar múltiples solicitudes
      for (let i = 0; i < 10; i++) {
        globalRateLimiter.checkLimit('test');
      }
      
      // Eventualmente debe bloquear solicitudes
      expect(() => {
        globalRateLimiter.checkLimit('test');
      }).toThrow(AppError);
    });
  });
});