import { 
  ErrorTypes, 
  AppError, 
  handleHttpError, 
  withRetry, 
  handleComponentError 
} from '../services/errorService';

describe('ErrorService', () => {
  describe('AppError', () => {
    test('crea una instancia de error con propiedades correctas', () => {
      const message = 'Error de prueba';
      const type = ErrorTypes.NETWORK;
      const originalError = new Error('Error original');
      const data = { key: 'value' };
      
      const error = new AppError(message, type, originalError, data);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(type);
      expect(error.originalError).toBe(originalError);
      expect(error.data).toEqual(data);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.id).toBeDefined();
    });
    
    test('usa mensaje predeterminado si no se proporciona uno', () => {
      const error = new AppError(null, ErrorTypes.NETWORK);
      
      expect(error.message).toBe('Error de conexión. Por favor, verifica tu conexión a internet.');
    });
    
    test('devuelve mensaje de usuario correcto', () => {
      const error = new AppError('Mensaje personalizado', ErrorTypes.NETWORK);
      
      expect(error.getUserMessage()).toBe('Mensaje personalizado');
    });
    
    test('devuelve acción recomendada correcta', () => {
      const error = new AppError('Error', ErrorTypes.NETWORK);
      
      expect(error.getRecommendedAction()).toBe('Verifica tu conexión a internet y vuelve a intentarlo.');
    });
    
    test('determina correctamente si el error es recuperable', () => {
      const networkError = new AppError('Error', ErrorTypes.NETWORK);
      const validationError = new AppError('Error', ErrorTypes.VALIDATION);
      
      expect(networkError.isRecoverable()).toBe(true);
      expect(validationError.isRecoverable()).toBe(false);
    });
  });
  
  describe('handleHttpError', () => {
    test('convierte error en AppError con tipo adecuado', () => {
      const error = new Error('Error genérico');
      const appError = handleHttpError(error);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ErrorTypes.UNKNOWN);
      
      // Para un error de red específico
      const networkError = new Error('NetworkError when attempting to fetch resource');
      const networkAppError = handleHttpError(networkError);
      expect(networkAppError.type).toBe(ErrorTypes.NETWORK);
    });
    
    test('analiza códigos de estado HTTP correctamente', () => {
      const error = new Error('HTTP Error');
      
      const serverError = handleHttpError(error, { status: 500, statusText: 'Internal Server Error' });
      expect(serverError.type).toBe(ErrorTypes.SERVER);
      
      const timeoutError = handleHttpError(error, { status: 408, statusText: 'Request Timeout' });
      expect(timeoutError.type).toBe(ErrorTypes.TIMEOUT);
      
      const permissionError = handleHttpError(error, { status: 403, statusText: 'Forbidden' });
      expect(permissionError.type).toBe(ErrorTypes.PERMISSION);
      
      const validationError = handleHttpError(error, { status: 400, statusText: 'Bad Request' });
      expect(validationError.type).toBe(ErrorTypes.VALIDATION);
      
      const rateLimitError = handleHttpError(error, { status: 429, statusText: 'Too Many Requests' });
      expect(rateLimitError.type).toBe(ErrorTypes.API_LIMIT);
    });
    
    test('devuelve el mismo error si ya es un AppError', () => {
      const appError = new AppError('Error original', ErrorTypes.NETWORK);
      const result = handleHttpError(appError);
      
      expect(result).toBe(appError);
    });
  });
  
  describe('withRetry', () => {
    test('devuelve el resultado si la función tiene éxito', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    test('reintenta la función si falla y debería reintentar', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new AppError('Error 1', ErrorTypes.NETWORK))
        .mockRejectedValueOnce(new AppError('Error 2', ErrorTypes.NETWORK))
        .mockResolvedValue('success');
      
      // Reducir el retryDelay para que la prueba sea más rápida
      const result = await withRetry(mockFn, { retryDelay: 10 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
    
    test('lanza el último error si se agotan los reintentos', async () => {
      const mockError = new AppError('Error final', ErrorTypes.NETWORK);
      const mockFn = jest.fn().mockRejectedValue(mockError);
      
      await expect(withRetry(mockFn, { maxRetries: 2, retryDelay: 10 }))
        .rejects.toThrow(mockError);
      
      expect(mockFn).toHaveBeenCalledTimes(3); // Intento inicial + 2 reintentos
    });
    
    test('no reintenta si el error no es recuperable', async () => {
      const mockError = new AppError('Error de validación', ErrorTypes.VALIDATION);
      const mockFn = jest.fn().mockRejectedValue(mockError);
      
      await expect(withRetry(mockFn, { maxRetries: 2, retryDelay: 10 }))
        .rejects.toThrow(mockError);
      
      expect(mockFn).toHaveBeenCalledTimes(1); // Solo el intento inicial
    });
  });
  
  describe('handleComponentError', () => {
    test('convierte un error normal en AppError', () => {
      const originalError = new Error('Error normal');
      const appError = handleComponentError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ErrorTypes.UNKNOWN);
      expect(appError.originalError).toBe(originalError);
    });
    
    test('devuelve el mismo error si ya es un AppError', () => {
      const appError = new AppError('Error original', ErrorTypes.NETWORK);
      const result = handleComponentError(appError);
      
      expect(result).toBe(appError);
    });
    
    test('llama a setError si se proporciona', () => {
      const setError = jest.fn();
      const error = new Error('Error de prueba');
      
      handleComponentError(error, setError);
      
      expect(setError).toHaveBeenCalledTimes(1);
      expect(setError).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});