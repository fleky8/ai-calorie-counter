/**
 * Servicio para validación de datos y archivos
 * Proporciona funciones para validar diferentes tipos de datos y archivos
 */
import { AppError, ErrorTypes } from './errorService';

// Tipos de archivo permitidos para imágenes
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Tamaño máximo de archivo en bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Dimensiones máximas de imagen
const MAX_IMAGE_DIMENSIONS = {
  width: 4096,
  height: 4096
};

/**
 * Valida un archivo de imagen
 * @param {File} file - Archivo a validar
 * @param {Object} options - Opciones de validación
 * @returns {Promise<boolean>} true si el archivo es válido
 * @throws {AppError} Error si el archivo no es válido
 */
export async function validateImageFile(file, options = {}) {
  const {
    allowedTypes = ALLOWED_IMAGE_TYPES,
    maxSize = MAX_FILE_SIZE,
    maxDimensions = MAX_IMAGE_DIMENSIONS,
    minDimensions = { width: 50, height: 50 }
  } = options;

  // Validar que el archivo existe
  if (!file) {
    throw new AppError(
      'No se ha proporcionado ningún archivo.',
      ErrorTypes.VALIDATION
    );
  }

  // Validar el tipo de archivo
  if (!allowedTypes.includes(file.type)) {
    throw new AppError(
      `Tipo de archivo no permitido. Los tipos permitidos son: ${allowedTypes.join(', ')}`,
      ErrorTypes.VALIDATION,
      null,
      { fileType: file.type }
    );
  }

  // Validar el tamaño del archivo
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new AppError(
      `El archivo es demasiado grande. El tamaño máximo permitido es ${maxSizeMB} MB.`,
      ErrorTypes.VALIDATION,
      null,
      { fileSize: file.size, maxSize }
    );
  }

  // Validar las dimensiones de la imagen
  try {
    const dimensions = await getImageDimensions(file);
    
    if (dimensions.width > maxDimensions.width || dimensions.height > maxDimensions.height) {
      throw new AppError(
        `La imagen es demasiado grande. Las dimensiones máximas permitidas son ${maxDimensions.width}x${maxDimensions.height} píxeles.`,
        ErrorTypes.VALIDATION,
        null,
        { dimensions, maxDimensions }
      );
    }
    
    if (dimensions.width < minDimensions.width || dimensions.height < minDimensions.height) {
      throw new AppError(
        `La imagen es demasiado pequeña. Las dimensiones mínimas permitidas son ${minDimensions.width}x${minDimensions.height} píxeles.`,
        ErrorTypes.VALIDATION,
        null,
        { dimensions, minDimensions }
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'No se pudo validar las dimensiones de la imagen.',
      ErrorTypes.VALIDATION,
      error
    );
  }

  return true;
}

/**
 * Obtiene las dimensiones de una imagen
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} Dimensiones de la imagen (width, height)
 */
function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AppError(
        'No se pudo cargar la imagen para validar sus dimensiones.',
        ErrorTypes.VALIDATION
      ));
    };
    
    img.src = url;
  });
}

/**
 * Sanitiza una cadena de texto para prevenir inyección de código
 * @param {string} input - Cadena de texto a sanitizar
 * @returns {string} Cadena de texto sanitizada
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Eliminar etiquetas HTML
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Escapar caracteres especiales
  const escaped = withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  return escaped;
}

/**
 * Sanitiza un objeto para prevenir inyección de código
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Implementa rate limiting básico para evitar demasiadas solicitudes
 */
export class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10;
    this.timeWindow = options.timeWindow || 60000; // 1 minuto por defecto
    this.requests = [];
  }
  
  /**
   * Verifica si se puede realizar una nueva solicitud
   * @param {string} key - Clave para identificar el tipo de solicitud
   * @returns {boolean} true si se puede realizar la solicitud
   * @throws {AppError} Error si se ha alcanzado el límite de solicitudes
   */
  checkLimit(key = 'default') {
    const now = Date.now();
    
    // Eliminar solicitudes antiguas
    this.requests = this.requests.filter(req => 
      req.timestamp > now - this.timeWindow && req.key === key
    );
    
    // Verificar si se ha alcanzado el límite
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const resetTime = oldestRequest.timestamp + this.timeWindow;
      const waitTime = Math.ceil((resetTime - now) / 1000);
      
      throw new AppError(
        `Has alcanzado el límite de solicitudes. Por favor, espera ${waitTime} segundos antes de intentarlo de nuevo.`,
        ErrorTypes.API_LIMIT,
        null,
        { 
          key, 
          maxRequests: this.maxRequests, 
          timeWindow: this.timeWindow,
          resetTime
        }
      );
    }
    
    // Registrar la nueva solicitud
    this.requests.push({ key, timestamp: now });
    
    return true;
  }
  
  /**
   * Obtiene el tiempo restante hasta que se pueda realizar una nueva solicitud
   * @param {string} key - Clave para identificar el tipo de solicitud
   * @returns {number} Tiempo restante en milisegundos, 0 si se puede realizar la solicitud
   */
  getRemainingTime(key = 'default') {
    const now = Date.now();
    
    // Eliminar solicitudes antiguas
    this.requests = this.requests.filter(req => 
      req.timestamp > now - this.timeWindow && req.key === key
    );
    
    // Verificar si se ha alcanzado el límite
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const resetTime = oldestRequest.timestamp + this.timeWindow;
      return resetTime - now;
    }
    
    return 0;
  }
  
  /**
   * Reinicia el contador de solicitudes
   * @param {string} key - Clave para identificar el tipo de solicitud
   */
  reset(key = 'default') {
    this.requests = this.requests.filter(req => req.key !== key);
  }
}

// Crear una instancia global de RateLimiter
export const globalRateLimiter = new RateLimiter();

export default {
  validateImageFile,
  sanitizeString,
  sanitizeObject,
  RateLimiter,
  globalRateLimiter
};