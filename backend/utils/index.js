/**
 * Utilidades para procesamiento de imágenes y validaciones
 */

/**
 * Valida si un buffer contiene una imagen válida
 * @param {Buffer} buffer - Buffer de la imagen
 * @returns {Object} - Resultado de la validación
 */
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: 'Buffer de imagen vacío',
    };
  }

  // Verificar signatures de archivos de imagen
  const signatures = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  };

  let detectedFormat = null;
  
  for (const [format, signature] of Object.entries(signatures)) {
    if (buffer.length >= signature.length) {
      const matches = signature.every((byte, index) => buffer[index] === byte);
      if (matches) {
        detectedFormat = format;
        break;
      }
    }
  }

  if (!detectedFormat) {
    return {
      isValid: false,
      error: 'Formato de imagen no reconocido',
    };
  }

  return {
    isValid: true,
    format: detectedFormat,
    size: buffer.length,
  };
}

/**
 * Convierte bytes a formato legible
 * @param {number} bytes - Número de bytes
 * @returns {string} - Tamaño formateado
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitiza nombre de archivo
 * @param {string} filename - Nombre original del archivo
 * @returns {string} - Nombre sanitizado
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unknown';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales
    .replace(/_{2,}/g, '_') // Reducir múltiples underscores
    .toLowerCase();
}

/**
 * Genera un ID único para el análisis
 * @returns {string} - ID único
 */
function generateAnalysisId() {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida configuración de Google Cloud
 * @returns {Object} - Estado de la configuración
 */
function validateGoogleCloudConfig() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  const errors = [];
  
  if (!projectId) {
    errors.push('GOOGLE_CLOUD_PROJECT_ID no está configurado');
  }
  
  if (!keyFilename) {
    errors.push('GOOGLE_APPLICATION_CREDENTIALS no está configurado');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config: {
      projectId: projectId ? '***' + projectId.slice(-4) : null,
      keyFilename: keyFilename ? '***' + keyFilename.slice(-10) : null,
    },
  };
}

/**
 * Crea respuesta de error estandarizada
 * @param {string} message - Mensaje de error
 * @param {number} status - Código de estado HTTP
 * @param {string} details - Detalles adicionales
 * @returns {Object} - Objeto de error estandarizado
 */
function createErrorResponse(message, status = 500, details = null) {
  return {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };
}

/**
 * Crea respuesta de éxito estandarizada
 * @param {*} data - Datos de respuesta
 * @param {string} message - Mensaje de éxito
 * @returns {Object} - Objeto de respuesta estandarizado
 */
function createSuccessResponse(data, message = 'Operación exitosa') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  validateImageBuffer,
  formatFileSize,
  sanitizeFilename,
  generateAnalysisId,
  validateGoogleCloudConfig,
  createErrorResponse,
  createSuccessResponse,
};