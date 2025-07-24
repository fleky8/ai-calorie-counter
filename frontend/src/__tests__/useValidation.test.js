import { renderHook, act } from '@testing-library/react';
import { useValidation, useImageValidation } from '../hooks/useValidation';
import { AppError, ErrorTypes } from '../services/errorService';
import * as validationService from '../services/validationService';

// Mock del servicio de validación
jest.mock('../services/validationService');

describe('useValidation Hook', () => {
  const mockFile = {
    name: 'test.jpg',
    size: 1024 * 1024,
    type: 'image/jpeg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock por defecto para validateImageFile
    validationService.validateImageFile.mockResolvedValue(true);
    
    // Mock por defecto para globalRateLimiter
    validationService.globalRateLimiter = {
      checkLimit: jest.fn(),
      getRemainingTime: jest.fn(() => 0)
    };
  });

  test('estado inicial es correcto', () => {
    const { result } = renderHook(() => useValidation());
    
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBe(null);
    expect(result.current.validationHistory).toEqual([]);
  });

  test('validateFile funciona correctamente con archivo válido', async () => {
    const { result } = renderHook(() => useValidation());
    
    await act(async () => {
      const isValid = await result.current.validateFile(mockFile);
      expect(isValid).toBe(true);
    });
    
    expect(validationService.validateImageFile).toHaveBeenCalledWith(mockFile, {});
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBe(null);
    expect(result.current.validationHistory).toHaveLength(1);
    expect(result.current.validationHistory[0].success).toBe(true);
  });

  test('validateFile maneja errores correctamente', async () => {
    const mockError = new AppError('Archivo inválido', ErrorTypes.VALIDATION);
    validationService.validateImageFile.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useValidation());
    
    await act(async () => {
      try {
        await result.current.validateFile(mockFile);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
    
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBe(mockError);
    expect(result.current.validationHistory).toHaveLength(1);
    expect(result.current.validationHistory[0].success).toBe(false);
  });

  test('rate limiting funciona correctamente', async () => {
    const rateLimitError = new AppError('Rate limit exceeded', ErrorTypes.API_LIMIT);
    validationService.globalRateLimiter.checkLimit.mockImplementation(() => {
      throw rateLimitError;
    });
    
    const { result } = renderHook(() => useValidation());
    
    await act(async () => {
      try {
        await result.current.validateFile(mockFile);
      } catch (error) {
        expect(error).toBe(rateLimitError);
      }
    });
    
    expect(validationService.globalRateLimiter.checkLimit).toHaveBeenCalledWith('default');
    expect(result.current.validationError).toBe(rateLimitError);
  });

  test('clearValidationError limpia el error', async () => {
    const mockError = new AppError('Archivo inválido', ErrorTypes.VALIDATION);
    validationService.validateImageFile.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useValidation());
    
    // Generar un error
    await act(async () => {
      try {
        await result.current.validateFile(mockFile);
      } catch (error) {
        // Error esperado
      }
    });
    
    expect(result.current.validationError).toBe(mockError);
    
    // Limpiar el error
    act(() => {
      result.current.clearValidationError();
    });
    
    expect(result.current.validationError).toBe(null);
  });

  test('getValidationStats devuelve estadísticas correctas', async () => {
    const { result } = renderHook(() => useValidation());
    
    // Validación exitosa
    await act(async () => {
      await result.current.validateFile(mockFile);
    });
    
    // Validación fallida
    const mockError = new AppError('Archivo inválido', ErrorTypes.VALIDATION);
    validationService.validateImageFile.mockRejectedValue(mockError);
    
    await act(async () => {
      try {
        await result.current.validateFile(mockFile);
      } catch (error) {
        // Error esperado
      }
    });
    
    const stats = result.current.getValidationStats();
    
    expect(stats.total).toBe(2);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.successRate).toBe(50);
  });

  test('getRateLimitStatus devuelve estado correcto', () => {
    const { result } = renderHook(() => useValidation());
    
    // Sin rate limit
    let status = result.current.getRateLimitStatus();
    expect(status.canValidate).toBe(true);
    expect(status.remainingTime).toBe(0);
    
    // Con rate limit
    const rateLimitError = new AppError('Rate limit exceeded', ErrorTypes.API_LIMIT);
    validationService.globalRateLimiter.checkLimit.mockImplementation(() => {
      throw rateLimitError;
    });
    validationService.globalRateLimiter.getRemainingTime.mockReturnValue(30000); // 30 segundos
    
    status = result.current.getRateLimitStatus();
    expect(status.canValidate).toBe(false);
    expect(status.remainingTime).toBe(30);
    expect(status.error).toBe(rateLimitError);
  });

  test('callbacks opcionales se ejecutan correctamente', async () => {
    const onValidationStart = jest.fn();
    const onValidationSuccess = jest.fn();
    const onValidationError = jest.fn();
    
    const { result } = renderHook(() => useValidation({
      onValidationStart,
      onValidationSuccess,
      onValidationError
    }));
    
    // Validación exitosa
    await act(async () => {
      await result.current.validateFile(mockFile);
    });
    
    expect(onValidationStart).toHaveBeenCalledWith(mockFile);
    expect(onValidationSuccess).toHaveBeenCalled();
    expect(onValidationError).not.toHaveBeenCalled();
    
    // Validación fallida
    const mockError = new AppError('Archivo inválido', ErrorTypes.VALIDATION);
    validationService.validateImageFile.mockRejectedValue(mockError);
    
    await act(async () => {
      try {
        await result.current.validateFile(mockFile);
      } catch (error) {
        // Error esperado
      }
    });
    
    expect(onValidationError).toHaveBeenCalled();
  });
});

describe('useImageValidation Hook', () => {
  const mockFile = {
    name: 'test.jpg',
    size: 1024 * 1024,
    type: 'image/jpeg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validationService.validateImageFile.mockResolvedValue(true);
    validationService.globalRateLimiter = {
      checkLimit: jest.fn(),
      getRemainingTime: jest.fn(() => 0)
    };
  });

  test('validateImage usa configuración predeterminada para imágenes', async () => {
    const { result } = renderHook(() => useImageValidation());
    
    await act(async () => {
      await result.current.validateImage(mockFile);
    });
    
    expect(validationService.validateImageFile).toHaveBeenCalledWith(mockFile, {
      maxSize: 8 * 1024 * 1024,
      minDimensions: { width: 100, height: 100 },
      maxDimensions: { width: 4096, height: 4096 }
    });
  });

  test('validateImage permite opciones personalizadas', async () => {
    const { result } = renderHook(() => useImageValidation());
    
    const customOptions = {
      maxSize: 5 * 1024 * 1024,
      minDimensions: { width: 200, height: 200 }
    };
    
    await act(async () => {
      await result.current.validateImage(mockFile, customOptions);
    });
    
    expect(validationService.validateImageFile).toHaveBeenCalledWith(mockFile, {
      maxSize: 5 * 1024 * 1024,
      minDimensions: { width: 200, height: 200 },
      maxDimensions: { width: 4096, height: 4096 }
    });
  });

  test('usa rate limit key específico para imágenes', () => {
    const { result } = renderHook(() => useImageValidation());
    
    result.current.getRateLimitStatus();
    
    expect(validationService.globalRateLimiter.checkLimit).toHaveBeenCalledWith('image-validation');
  });
});