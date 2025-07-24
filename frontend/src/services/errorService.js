/**
 * Servicio para manejar errores en la aplicación
 * Proporciona funciones para gestionar diferentes tipos de errores,
 * reintentos automáticos y mensajes de error informativos
 */

// Tipos de errores
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  TIMEOUT: 'TIMEOUT',
  VALIDATION: 'VALIDATION',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN',
  API_LIMIT: 'API_LIMIT',
  STORAGE: 'STORAGE',
  FILE: 'FILE'
};

// Mensajes de error por tipo
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  [ErrorTypes.SERVER]: 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.',
  [ErrorTypes.TIMEOUT]: 'La operación ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.',
  [ErrorTypes.VALIDATION]: 'Los datos proporcionados no son válidos.',
  [ErrorTypes.PERMISSION]: 'No tienes permisos para realizar esta acción.',
  [ErrorTypes.API_LIMIT]: 'Has alcanzado el límite de solicitudes. Por favor, inténtalo más tarde.',
  [ErrorTypes.STORAGE]: 'Error al acceder al almacenamiento local.',
  [ErrorTypes.FILE]: 'Error al procesar el archivo.',
  [ErrorTypes.UNKNOWN]: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'
};

// Acciones recomendadas por tipo de error
const errorActions = {
  [ErrorTypes.NETWORK]: 'Verifica tu conexión a internet y vuelve a intentarlo.',
  [ErrorTypes.SERVER]: 'Espera unos minutos y vuelve a intentarlo.',
  [ErrorTypes.TIMEOUT]: 'La operación puede estar tardando más de lo normal. Puedes intentarlo de nuevo.',
  [ErrorTypes.VALIDATION]: 'Revisa los datos ingresados y corrige los errores señalados.',
  [ErrorTypes.PERMISSION]: 'Verifica que has concedido los permisos necesarios para esta función.',
  [ErrorTypes.API_LIMIT]: 'Espera unos minutos antes de realizar más solicitudes.',
  [ErrorTypes.STORAGE]: 'Verifica que tu navegador permite el almacenamiento local.',
  [ErrorTypes.FILE]: 'Asegúrate de que el archivo tiene un formato válido y no es demasiado grande.',
  [ErrorTypes.UNKNOWN]: 'Refresca la página e intenta la operación nuevamente.'
};

/**
 * Clase para manejar errores en la aplicación
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, originalError = null, data = {}) {
    super(message || errorMessages[type]);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.data = data;
    this.timestamp = new Date();
    this.id = generateErrorId();
  }

  /**
   * Obtiene un mensaje de error amigable para el usuario
   * @returns {string} Mensaje de error para mostrar al usuario
   */
  getUserMessage() {
    return this.message || errorMessages[this.type];
  }

  /**
   * Obtiene una acción recomendada para el usuario
   * @returns {string} Acción recomendada
   */
  getRecommendedAction() {
    return errorActions[this.type];
  }

  /**
   * Determina si el error es recuperable (se puede reintentar)
   * @returns {boolean} true si el error es recuperable
   */
  isRecoverable() {
    return [
      ErrorTypes.NETWORK,
      ErrorTypes.SERVER,
      ErrorTypes.TIMEOUT,
      ErrorTypes.API_LIMIT
    ].includes(this.type);
  }

  /**
   * Registra el error para análisis
   */
  logError() {
    console.error(`[${this.id}] [${this.type}] ${this.message}`, {
      timestamp: this.timestamp,
      data: this.data,
      originalError: this.originalError
    });
    
    // Aquí se podría implementar el envío a un servicio de registro de errores
    // como Sentry, LogRocket, etc.
  }
}

/**
 * Genera un ID único para el error
 * @returns {string} ID único
 */
function generateErrorId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Analiza un error HTTP y devuelve un AppError con el tipo adecuado
 * @param {Error} error - Error original
 * @param {Response} response - Respuesta HTTP (opcional)
 * @returns {AppError} Error tipado
 */
export function handleHttpError(error, response = null) {
  // Si ya es un AppError, devolverlo directamente
  if (error instanceof AppError) {
    return error;
  }

  let type = ErrorTypes.UNKNOWN;
  let message = error.message;
  const data = {};

  // Si tenemos una respuesta HTTP, analizar el código de estado
  if (response) {
    data.status = response.status;
    data.statusText = response.statusText;

    // Determinar el tipo de error según el código de estado
    if (response.status >= 500) {
      type = ErrorTypes.SERVER;
    } else if (response.status === 408 || response.status === 504) {
      type = ErrorTypes.TIMEOUT;
    } else if (response.status === 401 || response.status === 403) {
      type = ErrorTypes.PERMISSION;
    } else if (response.status === 400 || response.status === 422) {
      type = ErrorTypes.VALIDATION;
    } else if (response.status === 429) {
      type = ErrorTypes.API_LIMIT;
    }
  } else {
    // Si no hay respuesta, analizar el mensaje de error
    if (error.name === 'AbortError') {
      type = ErrorTypes.TIMEOUT;
      message = 'La solicitud ha sido cancelada por tiempo de espera.';
    } else if (error.message && error.message.toLowerCase().includes('network')) {
      type = ErrorTypes.NETWORK;
    } else if (error.message && error.message.toLowerCase().includes('timeout')) {
      type = ErrorTypes.TIMEOUT;
    }
  }

  const appError = new AppError(message, type, error, data);
  appError.logError();
  return appError;
}

/**
 * Función para realizar una solicitud HTTP con reintentos automáticos
 * @param {Function} requestFn - Función que realiza la solicitud
 * @param {Object} options - Opciones de configuración
 * @returns {Promise} Resultado de la solicitud
 */
export async function withRetry(requestFn, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => error.isRecoverable()
  } = options;

  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      // Convertir a AppError si no lo es
      const appError = error instanceof AppError ? error : handleHttpError(error);
      lastError = appError;
      
      // Verificar si debemos reintentar
      if (attempt < maxRetries && shouldRetry(appError)) {
        // Esperar antes de reintentar (con backoff exponencial)
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Reintentando en ${delay}ms (intento ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
}

/**
 * Función para manejar errores en componentes React
 * @param {Error} error - Error capturado
 * @param {Function} setError - Función para establecer el estado de error
 * @returns {AppError} Error procesado
 */
export function handleComponentError(error, setError = null) {
  const appError = error instanceof AppError ? error : new AppError(
    error.message,
    ErrorTypes.UNKNOWN,
    error
  );
  
  appError.logError();
  
  if (setError && typeof setError === 'function') {
    setError(appError);
  }
  
  return appError;
}

/**
 * Hook personalizado para manejar errores en componentes React
 * @param {Function} onError - Función a ejecutar cuando ocurre un error
 * @returns {Object} Objeto con funciones para manejar errores
 */
export function useErrorHandler(onError) {
  return {
    /**
     * Envuelve una función asíncrona con manejo de errores
     * @param {Function} fn - Función a envolver
     * @returns {Function} Función envuelta
     */
    wrapAsync: (fn) => async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const appError = handleComponentError(error);
        if (onError && typeof onError === 'function') {
          onError(appError);
        }
        throw appError;
      }
    }
  };
}

export default {
  ErrorTypes,
  AppError,
  handleHttpError,
  withRetry,
  handleComponentError,
  useErrorHandler
};