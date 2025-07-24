/**
 * Servicio para manejar el almacenamiento local de análisis nutricionales
 */

const STORAGE_KEY = 'nutrition_history';
const MAX_HISTORY_SIZE = 100; // Límite máximo de entradas en el historial

/**
 * Guarda un análisis nutricional en el historial
 * @param {Object} analysis - Datos del análisis nutricional
 * @returns {Object} El análisis guardado con ID y fecha
 */
export const saveAnalysis = (analysis) => {
  try {
    // Obtener historial existente
    const history = getHistory();
    
    // Crear nuevo análisis con ID y fecha
    const newAnalysis = {
      ...analysis,
      id: generateId(),
      date: new Date().toISOString(),
    };
    
    // Añadir al inicio del historial (más reciente primero)
    let updatedHistory = [newAnalysis, ...history];
    
    // Limitar el tamaño del historial para evitar problemas de almacenamiento
    if (updatedHistory.length > MAX_HISTORY_SIZE) {
      updatedHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE);
    }
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return newAnalysis;
  } catch (error) {
    console.error('Error al guardar análisis:', error);
    throw new Error('No se pudo guardar el análisis en el historial');
  }
};

/**
 * Obtiene todo el historial de análisis
 * @returns {Array} Lista de análisis ordenados por fecha (más reciente primero)
 */
export const getHistory = () => {
  try {
    const historyData = localStorage.getItem(STORAGE_KEY);
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
};

/**
 * Obtiene el número total de entradas en el historial
 * @returns {number} Número de entradas en el historial
 */
export const getHistoryCount = () => {
  try {
    const history = getHistory();
    return history.length;
  } catch (error) {
    console.error('Error al contar historial:', error);
    return 0;
  }
};

/**
 * Busca análisis por nombre de alimento
 * @param {string} foodName - Nombre del alimento a buscar
 * @returns {Array} Lista de análisis que contienen el alimento buscado
 */
export const searchAnalysisByFood = (foodName) => {
  try {
    if (!foodName) return [];
    
    const history = getHistory();
    const searchTerm = foodName.toLowerCase();
    
    return history.filter(item => {
      // Buscar en el nombre del alimento si existe
      if (item.foodName && item.foodName.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Buscar en alimentos detectados si existe
      if (item.detectedFoods && Array.isArray(item.detectedFoods)) {
        return item.detectedFoods.some(food => 
          food.name && food.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return false;
    });
  } catch (error) {
    console.error('Error al buscar análisis por alimento:', error);
    return [];
  }
};

/**
 * Obtiene análisis dentro de un rango de fechas
 * @param {Date|string} startDate - Fecha de inicio del rango
 * @param {Date|string} endDate - Fecha de fin del rango
 * @returns {Array} Lista de análisis dentro del rango de fechas
 */
export const getAnalysisByDateRange = (startDate, endDate) => {
  try {
    const history = getHistory();
    
    // Convertir fechas a timestamps para comparación
    const start = startDate instanceof Date ? startDate.getTime() : new Date(startDate).getTime();
    const end = endDate instanceof Date ? endDate.getTime() : new Date(endDate).getTime();
    
    return history.filter(item => {
      const itemDate = new Date(item.date).getTime();
      return itemDate >= start && itemDate <= end;
    });
  } catch (error) {
    console.error('Error al filtrar análisis por fecha:', error);
    return [];
  }
};

/**
 * Obtiene un análisis específico por ID
 * @param {string} id - ID del análisis a buscar
 * @returns {Object|null} El análisis encontrado o null si no existe
 */
export const getAnalysisById = (id) => {
  try {
    const history = getHistory();
    return history.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Error al obtener análisis por ID:', error);
    return null;
  }
};

/**
 * Elimina un análisis del historial
 * @param {string} id - ID del análisis a eliminar
 * @returns {boolean} true si se eliminó correctamente, false en caso contrario
 */
export const deleteAnalysis = (id) => {
  try {
    const history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    
    // Si no se encontró el elemento a eliminar
    if (updatedHistory.length === history.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('Error al eliminar análisis:', error);
    return false;
  }
};

/**
 * Limpia todo el historial
 * @returns {boolean} true si se limpió correctamente
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error al limpiar historial:', error);
    return false;
  }
};

/**
 * Genera un ID único para un análisis
 * @returns {string} ID único
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
};

/**
 * Formatea una fecha ISO a formato legible
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha formateada (ej: "15 Jun 2023, 14:30")
 */
export const formatDate = (isoDate) => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return isoDate || 'Fecha desconocida';
  }
};

/**
 * Exporta un análisis a formato JSON para descargar
 * @param {Object} analysis - Análisis a exportar
 * @returns {string} URL de datos para descargar el archivo
 */
export const exportAnalysisToJson = (analysis) => {
  try {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    return dataUri;
  } catch (error) {
    console.error('Error al exportar análisis:', error);
    throw new Error('No se pudo exportar el análisis');
  }
};

/**
 * Importa un análisis desde un archivo JSON
 * @param {string} jsonString - Contenido del archivo JSON
 * @returns {Object} El análisis importado
 * @throws {Error} Si el formato no es válido
 */
export const importAnalysisFromJson = (jsonString) => {
  try {
    const analysis = JSON.parse(jsonString);
    
    // Validación básica del formato
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Formato de análisis inválido');
    }
    
    return analysis;
  } catch (error) {
    console.error('Error al importar análisis:', error);
    throw new Error('No se pudo importar el análisis: formato inválido');
  }
};

export default {
  saveAnalysis,
  getHistory,
  getHistoryCount,
  getAnalysisById,
  searchAnalysisByFood,
  getAnalysisByDateRange,
  deleteAnalysis,
  clearHistory,
  formatDate,
  exportAnalysisToJson,
  importAnalysisFromJson
};