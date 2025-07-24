const { identifyFoodItems, processImageForFood } = require('../services');

// Mock de Google Vision API
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    objectLocalization: jest.fn(),
    labelDetection: jest.fn(),
    textDetection: jest.fn(),
  })),
}));

describe('Services - Google Vision Integration', () => {
  describe('identifyFoodItems', () => {
    it('debería identificar alimentos en objetos detectados', () => {
      const objects = [
        { name: 'Apple', confidence: 0.8, boundingBox: {} },
        { name: 'Car', confidence: 0.9, boundingBox: {} },
        { name: 'Banana', confidence: 0.7, boundingBox: {} },
      ];
      
      const labels = [
        { description: 'Food', confidence: 0.9, topicality: 0.8 },
        { description: 'Building', confidence: 0.6, topicality: 0.5 },
      ];

      const result = identifyFoodItems(objects, labels);

      expect(result).toHaveLength(3); // Apple, Banana, Food
      expect(result[0].name).toBe('Food'); // Ordenado por confianza
      expect(result[1].name).toBe('Apple');
      expect(result[2].name).toBe('Banana');
    });

    it('debería filtrar objetos con baja confianza', () => {
      const objects = [
        { name: 'Apple', confidence: 0.3, boundingBox: {} }, // Muy baja confianza
        { name: 'Banana', confidence: 0.8, boundingBox: {} },
      ];
      
      const labels = [];

      const result = identifyFoodItems(objects, labels);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Banana');
    });

    it('debería evitar duplicados entre objetos y etiquetas', () => {
      const objects = [
        { name: 'Apple', confidence: 0.8, boundingBox: {} },
      ];
      
      const labels = [
        { description: 'Apple', confidence: 0.9, topicality: 0.8 },
      ];

      const result = identifyFoodItems(objects, labels);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
    });

    it('debería manejar arrays vacíos', () => {
      const result = identifyFoodItems([], []);
      expect(result).toHaveLength(0);
    });

    it('debería reconocer palabras clave en español', () => {
      const objects = [];
      const labels = [
        { description: 'Manzana', confidence: 0.8, topicality: 0.7 },
        { description: 'Comida', confidence: 0.9, topicality: 0.8 },
      ];

      const result = identifyFoodItems(objects, labels);

      expect(result).toHaveLength(2);
      expect(result.some(item => item.name === 'Comida')).toBe(true);
      expect(result.some(item => item.name === 'Manzana')).toBe(true);
    });
  });

  describe('processImageForFood', () => {
    const vision = require('@google-cloud/vision');
    let mockClient;

    beforeEach(() => {
      mockClient = {
        objectLocalization: jest.fn(),
        labelDetection: jest.fn(),
        textDetection: jest.fn(),
      };
      vision.ImageAnnotatorClient.mockImplementation(() => mockClient);
    });

    it('debería procesar imagen exitosamente con alimentos detectados', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      
      mockClient.objectLocalization.mockResolvedValue([{
        localizedObjectAnnotations: [
          { name: 'Apple', score: 0.8, boundingPoly: {} },
        ],
      }]);
      
      mockClient.labelDetection.mockResolvedValue([{
        labelAnnotations: [
          { description: 'Food', score: 0.9, topicality: 0.8 },
        ],
      }]);
      
      mockClient.textDetection.mockResolvedValue([{
        textAnnotations: [{ description: 'Nutrition Facts' }],
      }]);

      const result = await processImageForFood(mockBuffer);

      expect(result.success).toBe(true);
      expect(result.foodItems).toHaveLength(2); // Apple y Food
      expect(result.message).toContain('Se detectaron 2 alimento(s)');
    });

    it('debería manejar imagen sin alimentos detectados', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      
      mockClient.objectLocalization.mockResolvedValue([{
        localizedObjectAnnotations: [
          { name: 'Car', score: 0.9, boundingPoly: {} },
        ],
      }]);
      
      mockClient.labelDetection.mockResolvedValue([{
        labelAnnotations: [
          { description: 'Vehicle', score: 0.8, topicality: 0.7 },
        ],
      }]);
      
      mockClient.textDetection.mockResolvedValue([{
        textAnnotations: [],
      }]);

      const result = await processImageForFood(mockBuffer);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No se detectaron alimentos');
      expect(result.foodItems).toHaveLength(0);
    });

    it('debería manejar errores de Google Vision API', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      
      mockClient.objectLocalization.mockRejectedValue(
        new Error('API quota exceeded')
      );

      const result = await processImageForFood(mockBuffer);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error al analizar imagen');
      expect(result.error).toContain('API quota exceeded');
    });

    it('debería incluir timestamp en resultado exitoso', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      
      mockClient.objectLocalization.mockResolvedValue([{
        localizedObjectAnnotations: [
          { name: 'Apple', score: 0.8, boundingPoly: {} },
        ],
      }]);
      
      mockClient.labelDetection.mockResolvedValue([{
        labelAnnotations: [],
      }]);
      
      mockClient.textDetection.mockResolvedValue([{
        textAnnotations: [],
      }]);

      const result = await processImageForFood(mockBuffer);

      expect(result.success).toBe(true);
      expect(result.processedAt).toBeDefined();
      expect(new Date(result.processedAt)).toBeInstanceOf(Date);
    });
  });
});