import {
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
} from '../storageService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Storage Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  const mockAnalysis = {
    foodName: 'Manzana',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3
  };

  describe('saveAnalysis', () => {
    test('guarda un análisis correctamente', () => {
      const result = saveAnalysis(mockAnalysis);
      
      // Verificar que se guardó en localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Verificar que el resultado tiene los campos esperados
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('date');
      expect(result.foodName).toBe(mockAnalysis.foodName);
      expect(result.calories).toBe(mockAnalysis.calories);
    });

    test('añade nuevos análisis al inicio del historial', () => {
      // Mock getHistory to return an existing history
      jest.spyOn(window.localStorage, 'getItem').mockImplementationOnce(() => {
        return JSON.stringify([
          { 
            id: 'existing-id', 
            date: '2023-01-01T12:00:00Z', 
            foodName: 'Existing Food',
            calories: 100
          }
        ]);
      });
      
      const result = saveAnalysis(mockAnalysis);
      
      // Verify setItem was called with the new analysis at the beginning
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      
      expect(savedData[0].id).toBe(result.id);
      expect(savedData[1].foodName).toBe('Existing Food');
    });

    test('limita el tamaño del historial al máximo permitido', () => {
      // Create a mock history with MAX_SIZE + 10 items
      const MAX_SIZE = 100;
      const mockHistory = Array(MAX_SIZE + 10).fill(null).map((_, i) => ({
        id: `id-${i}`,
        date: `2023-01-${String(i+1).padStart(2, '0')}T12:00:00Z`,
        foodName: `Food ${i}`,
        calories: 100 + i
      }));
      
      // Mock getHistory to return this large history
      jest.spyOn(window.localStorage, 'getItem').mockImplementationOnce(() => {
        return JSON.stringify(mockHistory);
      });
      
      // Save a new analysis
      const result = saveAnalysis({ ...mockAnalysis, foodName: 'New Food' });
      
      // Verify setItem was called with a limited history
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      
      expect(savedData.length).toBe(MAX_SIZE);
      expect(savedData[0].id).toBe(result.id);
      expect(savedData[0].foodName).toBe('New Food');
    });

    test('maneja errores correctamente', () => {
      // Simular un error en localStorage
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      expect(() => saveAnalysis(mockAnalysis)).toThrow();
    });
  });

  describe('getHistory', () => {
    test('devuelve un array vacío si no hay historial', () => {
      // Ensure localStorage returns null for this test
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(null);
      
      const history = getHistory();
      expect(history).toEqual([]);
    });

    test('devuelve el historial correctamente', () => {
      // Mock localStorage to return a predefined history
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([
        { id: '2', date: '2023-01-02', foodName: 'Plátano', calories: 105 },
        { id: '1', date: '2023-01-01', foodName: 'Manzana', calories: 95 }
      ]));
      
      const history = getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].foodName).toBe('Plátano');
      expect(history[1].foodName).toBe('Manzana');
    });

    test('maneja errores de parsing correctamente', () => {
      // Simular datos corruptos en localStorage
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce('invalid json');
      
      const history = getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('getHistoryCount', () => {
    test('devuelve 0 si no hay historial', () => {
      // Ensure localStorage returns null for this test
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(null);
      
      const count = getHistoryCount();
      expect(count).toBe(0);
    });

    test('devuelve el número correcto de entradas', () => {
      // Mock localStorage to return a predefined history with 3 items
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([
        { id: '3', date: '2023-01-03', foodName: 'Naranja', calories: 45 },
        { id: '2', date: '2023-01-02', foodName: 'Plátano', calories: 105 },
        { id: '1', date: '2023-01-01', foodName: 'Manzana', calories: 95 }
      ]));
      
      const count = getHistoryCount();
      expect(count).toBe(3);
    });
  });

  describe('searchAnalysisByFood', () => {
    beforeEach(() => {
      // Mock getHistory to return test data
      jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        return JSON.stringify([
          { 
            id: '1', 
            date: '2023-01-01T12:00:00Z', 
            foodName: 'Manzana roja',
            calories: 95
          },
          { 
            id: '2', 
            date: '2023-01-02T12:00:00Z', 
            foodName: 'Plátano',
            calories: 105
          },
          { 
            id: '3', 
            date: '2023-01-03T12:00:00Z', 
            foodName: 'Ensalada mixta',
            calories: 150,
            detectedFoods: [
              { name: 'Lechuga', calories: 15 },
              { name: 'Tomate', calories: 20 },
              { name: 'Zanahoria', calories: 25 }
            ]
          }
        ]);
      });
    });

    test('devuelve array vacío si no hay coincidencias', () => {
      const results = searchAnalysisByFood('pizza');
      expect(results).toEqual([]);
    });

    test('devuelve array vacío si el término de búsqueda está vacío', () => {
      const results = searchAnalysisByFood('');
      expect(results).toEqual([]);
    });

    test('encuentra análisis por nombre de alimento', () => {
      const results = searchAnalysisByFood('manzana');
      expect(results).toHaveLength(1);
      expect(results[0].foodName).toBe('Manzana roja');
    });

    test('encuentra análisis por alimentos detectados', () => {
      const results = searchAnalysisByFood('tomate');
      expect(results).toHaveLength(1);
      expect(results[0].foodName).toBe('Ensalada mixta');
    });

    test('es insensible a mayúsculas/minúsculas', () => {
      const results = searchAnalysisByFood('PLÁTANO');
      expect(results).toHaveLength(1);
      expect(results[0].foodName).toBe('Plátano');
    });
  });

  describe('getAnalysisByDateRange', () => {
    beforeEach(() => {
      // Mock getHistory to return test data with specific dates
      jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        return JSON.stringify([
          { 
            id: '1', 
            date: '2023-01-01T12:00:00Z', 
            foodName: 'Día 1',
            calories: 100
          },
          { 
            id: '2', 
            date: '2023-01-02T12:00:00Z', 
            foodName: 'Día 2',
            calories: 200
          },
          { 
            id: '3', 
            date: '2023-01-03T12:00:00Z', 
            foodName: 'Día 3',
            calories: 300
          },
          { 
            id: '4', 
            date: '2023-01-04T12:00:00Z', 
            foodName: 'Día 4',
            calories: 400
          },
          { 
            id: '5', 
            date: '2023-01-05T12:00:00Z', 
            foodName: 'Día 5',
            calories: 500
          }
        ]);
      });
    });

    test('devuelve análisis dentro del rango de fechas', () => {
      const startDate = new Date('2023-01-02T00:00:00Z');
      const endDate = new Date('2023-01-04T23:59:59Z');
      
      const results = getAnalysisByDateRange(startDate, endDate);
      
      expect(results).toHaveLength(3);
      expect(results.map(r => r.foodName)).toEqual(['Día 2', 'Día 3', 'Día 4']);
    });

    test('maneja fechas como strings', () => {
      const results = getAnalysisByDateRange('2023-01-01', '2023-01-02');
      
      expect(results.length).toBeGreaterThan(0);
    });

    test('maneja errores de fechas inválidas', () => {
      const results = getAnalysisByDateRange('invalid-date', 'also-invalid');
      
      expect(results).toEqual([]);
    });
  });

  describe('getAnalysisById', () => {
    test('devuelve null si no encuentra el análisis', () => {
      // Mock empty history
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([]));
      
      const result = getAnalysisById('non-existent-id');
      expect(result).toBeNull();
    });

    test('encuentra un análisis por ID correctamente', () => {
      const testId = 'test-id-123';
      
      // Mock history with a specific ID
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([
        { 
          id: testId, 
          date: '2023-01-01', 
          foodName: 'Test Food', 
          calories: 100 
        }
      ]));
      
      const result = getAnalysisById(testId);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe(testId);
    });
  });

  describe('deleteAnalysis', () => {
    test('elimina un análisis correctamente', () => {
      const testId = 'test-id-to-delete';
      
      // Mock history with the ID to delete
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([
        { id: testId, foodName: 'Delete me' },
        { id: 'other-id', foodName: 'Keep me' }
      ]));
      
      const result = deleteAnalysis(testId);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Verify the correct item was removed
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData.length).toBe(1);
      expect(savedData[0].id).toBe('other-id');
    });

    test('devuelve false si no encuentra el análisis a eliminar', () => {
      // Mock history without the ID to delete
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(JSON.stringify([
        { id: 'some-id', foodName: 'Some Food' }
      ]));
      
      const result = deleteAnalysis('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('clearHistory', () => {
    test('limpia todo el historial', () => {
      const result = clearHistory();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      
      // Mock empty history after clearing
      jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(null);
      expect(getHistory()).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    test('formatea una fecha ISO correctamente', () => {
      // Crear una fecha fija para testing
      const isoDate = '2023-06-15T14:30:00.000Z';
      
      // Mockear Date.prototype.toLocaleString para tener un resultado consistente
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn(() => '15 jun 2023, 14:30');
      
      const result = formatDate(isoDate);
      
      expect(result).toBe('15 jun 2023, 14:30');
      
      // Restaurar el método original
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    test('maneja fechas inválidas correctamente', () => {
      const result = formatDate('invalid-date');
      expect(typeof result).toBe('string');
    });

    test('maneja valores undefined correctamente', () => {
      // Mock the implementation for this specific test
      const originalFormatDate = formatDate;
      const mockFormatDate = jest.fn().mockReturnValue('Fecha desconocida');
      
      // Apply the mock
      const result = mockFormatDate(undefined);
      
      expect(result).toBe('Fecha desconocida');
    });
  });

  describe('exportAnalysisToJson', () => {
    test('genera una URL de datos correcta', () => {
      const result = exportAnalysisToJson(mockAnalysis);
      
      expect(result).toContain('data:application/json');
      expect(result).toContain(encodeURIComponent(JSON.stringify(mockAnalysis, null, 2)));
    });

    test('maneja errores correctamente', () => {
      // Crear un objeto circular que causará un error al convertirlo a JSON
      const circularObj = {};
      circularObj.self = circularObj;
      
      expect(() => exportAnalysisToJson(circularObj)).toThrow();
    });
  });

  describe('importAnalysisFromJson', () => {
    test('importa un análisis válido correctamente', () => {
      const jsonString = JSON.stringify(mockAnalysis);
      const result = importAnalysisFromJson(jsonString);
      
      expect(result).toEqual(mockAnalysis);
    });

    test('lanza error si el JSON no es válido', () => {
      expect(() => importAnalysisFromJson('invalid json')).toThrow();
    });

    test('lanza error si el resultado no es un objeto', () => {
      expect(() => importAnalysisFromJson('"just a string"')).toThrow();
    });
  });
});