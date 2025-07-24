const {
  estimatePortionWeight,
  calculateNutritionForFood,
  calculateTotalNutrition,
  getFoodNutritionInfo,
} = require('../services/nutritionService');

describe('Nutrition Service', () => {
  describe('estimatePortionWeight', () => {
    const mockNutritionInfo = {
      commonPortionSize: 100,
    };

    test('should return base weight for high confidence', () => {
      const foodItem = { confidence: 0.95 };
      const weight = estimatePortionWeight(foodItem, mockNutritionInfo);
      expect(weight).toBe(100);
    });

    test('should reduce weight for lower confidence', () => {
      const foodItem = { confidence: 0.6 };
      const weight = estimatePortionWeight(foodItem, mockNutritionInfo);
      expect(weight).toBeLessThan(100);
      expect(weight).toBeGreaterThan(50);
    });

    test('should adjust weight based on bounding box size', () => {
      const largeFoodItem = {
        confidence: 0.8,
        boundingBox: {
          normalizedVertices: [
            { x: 0, y: 0 },
            { x: 0.6, y: 0 },
            { x: 0.6, y: 0.6 },
            { x: 0, y: 0.6 },
          ],
        },
      };

      const smallFoodItem = {
        confidence: 0.8,
        boundingBox: {
          normalizedVertices: [
            { x: 0, y: 0 },
            { x: 0.1, y: 0 },
            { x: 0.1, y: 0.1 },
            { x: 0, y: 0.1 },
          ],
        },
      };

      const largeWeight = estimatePortionWeight(largeFoodItem, mockNutritionInfo);
      const smallWeight = estimatePortionWeight(smallFoodItem, mockNutritionInfo);

      expect(largeWeight).toBeGreaterThan(smallWeight);
    });

    test('should enforce minimum and maximum weight limits', () => {
      const veryLowConfidence = { confidence: 0.1 };
      const veryHighConfidence = { confidence: 1.0 };

      const lowWeight = estimatePortionWeight(veryLowConfidence, mockNutritionInfo);
      const highWeight = estimatePortionWeight(veryHighConfidence, mockNutritionInfo);

      expect(lowWeight).toBeGreaterThanOrEqual(30); // 30% of base
      expect(highWeight).toBeLessThanOrEqual(250); // 250% of base
    });

    test('should return integer values', () => {
      const foodItem = { confidence: 0.75 };
      const weight = estimatePortionWeight(foodItem, mockNutritionInfo);
      expect(Number.isInteger(weight)).toBe(true);
    });
  });

  describe('calculateNutritionForFood', () => {
    test('should calculate nutrition for known food', () => {
      const foodItem = {
        name: 'apple',
        confidence: 0.8,
      };

      const result = calculateNutritionForFood(foodItem);

      expect(result).toBeDefined();
      expect(result.name).toBe('Manzana');
      expect(result.originalName).toBe('apple');
      expect(result.category).toBe('fruit');
      expect(result.confidence).toBe(0.8);
      expect(result.estimatedWeight).toBeGreaterThan(0);
      expect(result.calories).toBeGreaterThan(0);
      expect(result.macronutrients).toHaveProperty('proteins');
      expect(result.macronutrients).toHaveProperty('carbohydrates');
      expect(result.macronutrients).toHaveProperty('fats');
      expect(result.macronutrients).toHaveProperty('fiber');
    });

    test('should return null for unknown food', () => {
      const foodItem = {
        name: 'unknownfood',
        confidence: 0.8,
      };

      const result = calculateNutritionForFood(foodItem);
      expect(result).toBeNull();
    });

    test('should calculate proportional nutrition values', () => {
      const foodItem = {
        name: 'apple',
        confidence: 0.8,
      };

      const result = calculateNutritionForFood(foodItem);
      const expectedCalories = Math.round((52 * result.estimatedWeight) / 100);

      expect(result.calories).toBe(expectedCalories);
    });

    test('should include nutrition per 100g reference', () => {
      const foodItem = {
        name: 'chicken',
        confidence: 0.9,
      };

      const result = calculateNutritionForFood(foodItem);

      expect(result.nutritionPer100g).toBeDefined();
      expect(result.nutritionPer100g.calories).toBe(165);
      expect(result.nutritionPer100g.macronutrients.proteins).toBe(31);
    });

    test('should round macronutrients to one decimal place', () => {
      const foodItem = {
        name: 'banana',
        confidence: 0.7,
      };

      const result = calculateNutritionForFood(foodItem);

      Object.values(result.macronutrients).forEach(value => {
        expect(value).toBe(Math.round(value * 10) / 10);
      });
    });
  });

  describe('calculateTotalNutrition', () => {
    test('should calculate total nutrition for multiple foods', () => {
      const foodItems = [
        { name: 'apple', confidence: 0.8 },
        { name: 'banana', confidence: 0.9 },
        { name: 'chicken', confidence: 0.85 },
      ];

      const result = calculateTotalNutrition(foodItems);

      expect(result.totalCalories).toBeGreaterThan(0);
      expect(result.macronutrients.proteins).toBeGreaterThan(0);
      expect(result.macronutrients.carbohydrates).toBeGreaterThan(0);
      expect(result.macronutrients.fats).toBeGreaterThan(0);
      expect(result.detectedFoods).toHaveLength(3);
    });

    test('should handle empty food list', () => {
      const result = calculateTotalNutrition([]);

      expect(result.totalCalories).toBe(0);
      expect(result.macronutrients.proteins).toBe(0);
      expect(result.macronutrients.carbohydrates).toBe(0);
      expect(result.macronutrients.fats).toBe(0);
      expect(result.detectedFoods).toHaveLength(0);
      expect(result.summary.averageConfidence).toBe(0);
    });

    test('should handle mix of known and unknown foods', () => {
      const foodItems = [
        { name: 'apple', confidence: 0.8 },
        { name: 'unknownfood', confidence: 0.7 },
        { name: 'banana', confidence: 0.9 },
      ];

      const result = calculateTotalNutrition(foodItems);

      expect(result.detectedFoods).toHaveLength(2); // Only known foods
      expect(result.summary.totalFoodsDetected).toBe(3);
      expect(result.summary.foodsProcessed).toBe(2);
      expect(result.summary.foodsNotFound).toBe(1);
    });

    test('should calculate macro distribution percentages', () => {
      const foodItems = [
        { name: 'chicken', confidence: 0.9 }, // High protein
      ];

      const result = calculateTotalNutrition(foodItems);

      expect(result.macroDistribution.proteins).toBeGreaterThan(0);
      expect(result.macroDistribution.carbohydrates).toBeGreaterThanOrEqual(0);
      expect(result.macroDistribution.fats).toBeGreaterThan(0);

      // Percentages should add up to 100 (with rounding)
      const total = result.macroDistribution.proteins + 
                   result.macroDistribution.carbohydrates + 
                   result.macroDistribution.fats;
      expect(total).toBeCloseTo(100, 0);
    });

    test('should calculate average confidence', () => {
      const foodItems = [
        { name: 'apple', confidence: 0.8 },
        { name: 'banana', confidence: 0.6 },
      ];

      const result = calculateTotalNutrition(foodItems);
      expect(result.summary.averageConfidence).toBe(0.7);
    });

    test('should include estimation note', () => {
      const foodItems = [{ name: 'apple', confidence: 0.8 }];
      const result = calculateTotalNutrition(foodItems);

      expect(result.estimationNote).toBeDefined();
      expect(typeof result.estimationNote).toBe('string');
      expect(result.estimationNote).toContain('estimaciones');
    });

    test('should round total values appropriately', () => {
      const foodItems = [{ name: 'apple', confidence: 0.8 }];
      const result = calculateTotalNutrition(foodItems);

      expect(Number.isInteger(result.totalCalories)).toBe(true);
      
      Object.values(result.macronutrients).forEach(value => {
        expect(value).toBe(Math.round(value * 10) / 10);
      });
    });
  });

  describe('getFoodNutritionInfo', () => {
    test('should return detailed nutrition info for known food', () => {
      const result = getFoodNutritionInfo('apple');

      expect(result).toBeDefined();
      expect(result.name).toBe('Manzana');
      expect(result.category).toBe('fruit');
      expect(result.commonPortionSize).toBe(150);
      expect(result.nutritionPer100g).toBeDefined();
      expect(result.nutritionPerPortion).toBeDefined();
      expect(result.aliases).toBeDefined();
      expect(Array.isArray(result.aliases)).toBe(true);
    });

    test('should return null for unknown food', () => {
      const result = getFoodNutritionInfo('unknownfood');
      expect(result).toBeNull();
    });

    test('should calculate portion nutrition correctly', () => {
      const result = getFoodNutritionInfo('apple');
      const expectedCalories = Math.round((52 * 150) / 100); // 52 cal/100g * 150g portion

      expect(result.nutritionPerPortion.calories).toBe(expectedCalories);
    });

    test('should include both per-100g and per-portion values', () => {
      const result = getFoodNutritionInfo('chicken');

      expect(result.nutritionPer100g.calories).toBe(165);
      expect(result.nutritionPer100g.macronutrients.proteins).toBe(31);

      expect(result.nutritionPerPortion.calories).toBe(165); // 100g portion
      expect(result.nutritionPerPortion.macronutrients.proteins).toBe(31);
    });

    test('should handle case insensitive search', () => {
      const result1 = getFoodNutritionInfo('APPLE');
      const result2 = getFoodNutritionInfo('Apple');
      const result3 = getFoodNutritionInfo('apple');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();

      expect(result1.name).toBe(result2.name);
      expect(result2.name).toBe(result3.name);
    });

    test('should round portion nutrition values', () => {
      const result = getFoodNutritionInfo('banana');

      expect(Number.isInteger(result.nutritionPerPortion.calories)).toBe(true);
      
      Object.values(result.nutritionPerPortion.macronutrients).forEach(value => {
        expect(value).toBe(Math.round(value * 10) / 10);
      });
    });
  });

  describe('Integration tests', () => {
    test('should handle complete workflow from detection to nutrition', () => {
      // Simular detección de alimentos
      const detectedFoods = [
        { name: 'apple', confidence: 0.85 },
        { name: 'chicken breast', confidence: 0.9 },
        { name: 'rice', confidence: 0.8 },
      ];

      // Calcular nutrición total
      const totalNutrition = calculateTotalNutrition(detectedFoods);

      expect(totalNutrition.success).not.toBe(false);
      expect(totalNutrition.totalCalories).toBeGreaterThan(200); // Reasonable total
      expect(totalNutrition.detectedFoods.length).toBeGreaterThan(0);
      expect(totalNutrition.summary.foodsProcessed).toBeGreaterThan(0);

      // Verificar que se pueden obtener detalles individuales
      detectedFoods.forEach(food => {
        const individualInfo = getFoodNutritionInfo(food.name);
        if (individualInfo) {
          expect(individualInfo.name).toBeDefined();
          expect(individualInfo.nutritionPer100g).toBeDefined();
        }
      });
    });

    test('should maintain data consistency across functions', () => {
      const foodName = 'chicken';
      
      // Obtener info individual
      const individualInfo = getFoodNutritionInfo(foodName);
      
      // Calcular para item detectado
      const detectedItem = { name: foodName, confidence: 0.9 };
      const calculatedInfo = calculateNutritionForFood(detectedItem);

      expect(individualInfo).toBeDefined();
      expect(calculatedInfo).toBeDefined();

      // Los valores per-100g deberían coincidir
      expect(calculatedInfo.nutritionPer100g.calories).toBe(individualInfo.nutritionPer100g.calories);
      expect(calculatedInfo.nutritionPer100g.macronutrients.proteins)
        .toBe(individualInfo.nutritionPer100g.macronutrients.proteins);
    });
  });
});