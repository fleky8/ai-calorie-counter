/**
 * Servicio para realizar solicitudes HTTP con manejo de errores
 */
import { handleHttpError, withRetry } from './errorService';

// Tiempo de espera predeterminado para las solicitudes (en milisegundos)
const DEFAULT_TIMEOUT = 30000;

// URL base de la API
const API_BASE_URL = process?.env?.REACT_APP_API_URL || '/api';

/**
 * Realiza una solicitud HTTP con manejo de errores
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export async function fetchWithErrorHandling(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    enableRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Crear URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Configurar headers predeterminados
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Crear controlador de aborto para el timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Configurar opciones de fetch
    const fetchOpts = {
      method,
      headers: { ...defaultHeaders, ...headers },
      signal: controller.signal,
      ...fetchOptions
    };
    
    // Añadir body si es necesario
    if (body) {
      fetchOpts.body = body instanceof FormData ? body : JSON.stringify(body);
      
      // No establecer Content-Type para FormData, el navegador lo hace automáticamente
      if (body instanceof FormData) {
        delete fetchOpts.headers['Content-Type'];
      }
    }
    
    // Realizar la solicitud con o sin reintentos
    let response;
    
    if (enableRetry) {
      response = await withRetry(
        () => fetch(url, fetchOpts),
        { maxRetries, retryDelay }
      );
    } else {
      response = await fetch(url, fetchOpts);
    }
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      // Intentar obtener detalles del error desde la respuesta
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto
        try {
          errorData = { message: await response.text() };
        } catch (e2) {
          // Si tampoco se puede obtener el texto, usar un mensaje genérico
          errorData = { message: 'Error desconocido' };
        }
      }
      
      // Crear y lanzar un error tipado
      throw handleHttpError(
        new Error(errorData.message || `Error ${response.status}: ${response.statusText}`),
        response
      );
    }
    
    // Verificar si la respuesta está vacía
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    // Si el error es por timeout, crear un error específico
    if (error.name === 'AbortError') {
      throw handleHttpError(
        new Error('La solicitud ha excedido el tiempo de espera'),
        { status: 408, statusText: 'Request Timeout' }
      );
    }
    
    // Manejar otros errores
    throw handleHttpError(error);
  }
}

/**
 * Realiza una solicitud GET
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export function get(endpoint, options = {}) {
  return fetchWithErrorHandling(endpoint, {
    ...options,
    method: 'GET'
  });
}

/**
 * Realiza una solicitud POST
 * @param {string} endpoint - Endpoint de la API
 * @param {Object|FormData} data - Datos a enviar
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export function post(endpoint, data, options = {}) {
  return fetchWithErrorHandling(endpoint, {
    ...options,
    method: 'POST',
    body: data
  });
}

/**
 * Realiza una solicitud PUT
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} data - Datos a enviar
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export function put(endpoint, data, options = {}) {
  return fetchWithErrorHandling(endpoint, {
    ...options,
    method: 'PUT',
    body: data
  });
}

/**
 * Realiza una solicitud DELETE
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export function del(endpoint, options = {}) {
  return fetchWithErrorHandling(endpoint, {
    ...options,
    method: 'DELETE'
  });
}

/**
 * Sube un archivo al servidor
 * @param {string} endpoint - Endpoint de la API
 * @param {File} file - Archivo a subir
 * @param {Object} options - Opciones de la solicitud
 * @returns {Promise} Respuesta de la API
 */
export function uploadFile(endpoint, file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  
  // Añadir campos adicionales si se proporcionan
  if (options.fields) {
    Object.entries(options.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  return fetchWithErrorHandling(endpoint, {
    ...options,
    method: 'POST',
    body: formData,
    // Aumentar el timeout para subidas de archivos
    timeout: options.timeout || 60000
  });
}

export default {
  get,
  post,
  put,
  delete: del,
  uploadFile
};