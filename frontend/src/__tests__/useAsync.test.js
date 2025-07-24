import { renderHook, act } from '@testing-library/react-hooks';
import useAsync from '../hooks/useAsync';
import { AppError, ErrorTypes } from '../services/errorService';

describe('useAsync', () => {
  test('estado inicial es idle', () => {
    const { result } = renderHook(() => useAsync(() => {}));
    
    expect(result.current.status).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
  
  test('ejecuta la función asíncrona y actualiza el estado correctamente', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn));
    
    // Estado inicial
    expect(result.current.status).toBe('idle');
    
    // Ejecutar la función
    act(() => {
      result.current.execute();
    });
    
    // Estado de carga
    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    
    // Esperar a que se resuelva
    await waitForNextUpdate();
    
    // Estado de éxito
    expect(result.current.status).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('maneja errores correctamente', async () => {
    const mockError = new AppError('Error de prueba', ErrorTypes.NETWORK);
    const mockFn = jest.fn().mockRejectedValue(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn));
    
    // Ejecutar la función
    act(() => {
      result.current.execute().catch(() => {}); // Capturar el error para que no falle la prueba
    });
    
    // Esperar a que se rechace
    await waitForNextUpdate();
    
    // Estado de error
    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
  
  test('ejecuta la función inmediatamente si immediate es true', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn, { immediate: true }));
    
    // Estado de carga inmediatamente
    expect(result.current.status).toBe('loading');
    
    // Esperar a que se resuelva
    await waitForNextUpdate();
    
    // Estado de éxito
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('llama a onSuccess cuando la función tiene éxito', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const onSuccess = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn, { onSuccess }));
    
    // Ejecutar la función
    act(() => {
      result.current.execute();
    });
    
    // Esperar a que se resuelva
    await waitForNextUpdate();
    
    // onSuccess debería haber sido llamado
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('success');
  });
  
  test('llama a onError cuando la función falla', async () => {
    const mockError = new AppError('Error de prueba', ErrorTypes.NETWORK);
    const mockFn = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn, { onError }));
    
    // Ejecutar la función
    act(() => {
      result.current.execute().catch(() => {}); // Capturar el error para que no falle la prueba
    });
    
    // Esperar a que se rechace
    await waitForNextUpdate();
    
    // onError debería haber sido llamado
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(mockError);
  });
  
  test('retry ejecuta la función de nuevo', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new AppError('Error 1', ErrorTypes.NETWORK))
      .mockResolvedValue('success');
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn));
    
    // Ejecutar la función
    act(() => {
      result.current.execute().catch(() => {}); // Capturar el error para que no falle la prueba
    });
    
    // Esperar a que se rechace
    await waitForNextUpdate();
    
    // Estado de error
    expect(result.current.status).toBe('error');
    
    // Reintentar
    act(() => {
      result.current.retry();
    });
    
    // Estado de carga
    expect(result.current.status).toBe('loading');
    
    // Esperar a que se resuelva
    await waitForNextUpdate();
    
    // Estado de éxito
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
  
  test('reset restablece el estado', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockFn));
    
    // Ejecutar la función
    act(() => {
      result.current.execute();
    });
    
    // Esperar a que se resuelva
    await waitForNextUpdate();
    
    // Estado de éxito
    expect(result.current.status).toBe('success');
    
    // Restablecer
    act(() => {
      result.current.reset();
    });
    
    // Estado inicial
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});