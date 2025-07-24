import { useState, useCallback, useEffect } from 'react';
import { handleComponentError, withRetry } from '../services/errorService';

/**
 * Hook personalizado para manejar operaciones asíncronas con estados de carga, éxito y error
 * @param {Function} asyncFunction - Función asíncrona a ejecutar
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones para manejar la operación asíncrona
 */
const useAsync = (asyncFunction, options = {}) => {
  const {
    immediate = false,
    initialData = null,
    onSuccess = null,
    onError = null,
    enableRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    resetOnUnmount = true
  } = options;

  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Función para ejecutar la operación asíncrona
  const execute = useCallback(async (...args) => {
    setStatus('loading');
    setError(null);
    
    try {
      let result;
      
      if (enableRetry) {
        // Ejecutar con reintentos automáticos
        result = await withRetry(
          () => asyncFunction(...args),
          {
            maxRetries,
            retryDelay,
            shouldRetry: (error) => {
              setRetryCount(count => count + 1);
              return error.isRecoverable && error.isRecoverable();
            }
          }
        );
      } else {
        // Ejecutar sin reintentos
        result = await asyncFunction(...args);
      }
      
      setData(result);
      setStatus('success');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const appError = handleComponentError(error);
      setError(appError);
      setStatus('error');
      
      if (onError) {
        onError(appError);
      }
      
      throw appError;
    } finally {
      setRetryCount(0);
    }
  }, [asyncFunction, enableRetry, maxRetries, retryDelay, onSuccess, onError]);

  // Ejecutar inmediatamente si se especifica
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    // Limpiar al desmontar
    return () => {
      if (resetOnUnmount) {
        setStatus('idle');
        setData(initialData);
        setError(null);
      }
    };
  }, [execute, immediate, initialData, resetOnUnmount]);

  // Función para reintentar la operación
  const retry = useCallback(() => {
    if (status === 'error') {
      execute();
    }
  }, [execute, status]);

  // Función para restablecer el estado
  const reset = useCallback(() => {
    setStatus('idle');
    setData(initialData);
    setError(null);
    setRetryCount(0);
  }, [initialData]);

  return {
    execute,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    retry,
    reset,
    retryCount
  };
};

export default useAsync;