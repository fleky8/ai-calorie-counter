import { useState, useCallback } from 'react';
import { AppError, ErrorTypes } from '../services/errorService';
import { validateImageFile, globalRateLimiter } from '../services/validationService';

/**
 * Hook personalizado para manejar validaciones
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Objeto con funciones y estado de validación
 */
export function useValidation(options = {}) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationHistory, setValidationHistory] = useState([]);

  const {
    enableRateLimit = true,
    rateLimitKey = 'default',
    onValidationStart,
    onValidationSuccess,
    onValidationError
  } = options;

  /**
   * Valida un archivo de imagen
   * @param {File} file - Archivo a validar
   * @param {Object} validationOptions - Opciones específicas de validación
   * @returns {Promise<boolean>} true si la validación es exitosa
   */
  const validateFile = useCallback(async (file, validationOptions = {}) => {
    try {
      setIsValidating(true);
      setValidationError(null);
      
      if (onValidationStart) {
        onValidationStart(file);
      }

      // Verificar rate limiting si está habilitado
      if (enableRateLimit) {
        globalRateLimiter.checkLimit(rateLimitKey);
      }

      // Realizar la validación del archivo
      await validateImageFile(file, validationOptions);

      // Registrar validación exitosa
      const validationRecord = {
        timestamp: new Date(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        success: true
      };
      
      setValidationHistory(prev => [validationRecord, ...prev.slice(0, 9)]); // Mantener últimas 10

      if (onValidationSuccess) {
        onValidationSuccess(file, validationRecord);
      }

      return true;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error.message,
        ErrorTypes.VALIDATION,
        error
      );

      // Registrar validación fallida
      const validationRecord = {
        timestamp: new Date(),
        fileName: file?.name || 'unknown',
        fileSize: file?.size || 0,
        fileType: file?.type || 'unknown',
        success: false,
        error: appError.type,
        message: appError.getUserMessage()
      };
      
      setValidationHistory(prev => [validationRecord, ...prev.slice(0, 9)]);
      setValidationError(appError);

      if (onValidationError) {
        onValidationError(appError, validationRecord);
      }

      throw appError;
    } finally {
      setIsValidating(false);
    }
  }, [enableRateLimit, rateLimitKey, onValidationStart, onValidationSuccess, onValidationError]);

  /**
   * Limpia el error de validación actual
   */
  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  /**
   * Limpia el historial de validaciones
   */
  const clearValidationHistory = useCallback(() => {
    setValidationHistory([]);
  }, []);

  /**
   * Obtiene estadísticas del historial de validaciones
   * @returns {Object} Estadísticas de validación
   */
  const getValidationStats = useCallback(() => {
    const total = validationHistory.length;
    const successful = validationHistory.filter(v => v.success).length;
    const failed = total - successful;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  }, [validationHistory]);

  /**
   * Verifica si se puede realizar una nueva validación (rate limiting)
   * @returns {Object} Información sobre el estado del rate limiting
   */
  const getRateLimitStatus = useCallback(() => {
    if (!enableRateLimit) {
      return { canValidate: true, remainingTime: 0 };
    }

    try {
      globalRateLimiter.checkLimit(rateLimitKey);
      return { canValidate: true, remainingTime: 0 };
    } catch (error) {
      const remainingTime = globalRateLimiter.getRemainingTime(rateLimitKey);
      return { 
        canValidate: false, 
        remainingTime: Math.ceil(remainingTime / 1000),
        error: error instanceof AppError ? error : null
      };
    }
  }, [enableRateLimit, rateLimitKey]);

  return {
    // Estado
    isValidating,
    validationError,
    validationHistory,
    
    // Funciones
    validateFile,
    clearValidationError,
    clearValidationHistory,
    getValidationStats,
    getRateLimitStatus
  };
}

/**
 * Hook específico para validación de imágenes con configuración predeterminada
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Objeto con funciones y estado de validación de imágenes
 */
export function useImageValidation(options = {}) {
  const defaultOptions = {
    rateLimitKey: 'image-validation',
    ...options
  };

  const validation = useValidation(defaultOptions);

  /**
   * Valida una imagen con configuración específica para imágenes
   * @param {File} file - Archivo de imagen a validar
   * @param {Object} imageOptions - Opciones específicas para imágenes
   * @returns {Promise<boolean>} true si la validación es exitosa
   */
  const validateImage = useCallback(async (file, imageOptions = {}) => {
    const defaultImageOptions = {
      maxSize: 8 * 1024 * 1024, // 8MB
      minDimensions: { width: 100, height: 100 },
      maxDimensions: { width: 4096, height: 4096 },
      ...imageOptions
    };

    return validation.validateFile(file, defaultImageOptions);
  }, [validation]);

  return {
    ...validation,
    validateImage
  };
}

export default useValidation;