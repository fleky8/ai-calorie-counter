const { 
  nutritionDatabase, 
  findFoodByName, 
  getCategories, 
  getFoodsByCategory 
} = require('../data/nutritionDatabase');

describe('Nutrition Database', () => {
  describe('nutritionDatabase', () => {
    test('should contain basic food items', () => {
      expect(nutritionDatabase).toBeDefined();
      expect(typeof nutritionDatabase).toBe('object');
      
      // Verificar que contiene alimentos básicos
      expect(nutritionDatabase.apple).toBeDefined();
      expect(nutritionDatabase.chicken).toBeDefined();
      expect(nutritionDatabase.rice).toBeDefined();
    });

    test('should have consistent structure for all foods', () => {
      Object.entries(nutritionDatabase).forEach(([key, food]) => {
        expect(food).toHaveProperty('name');
        expect(food).toHaveProperty('category');
        expect(food).toHaveProperty('caloriesPer100g');
        expect(food).toHaveProperty('macrosPer100g');
        expect(food).toHaveProperty('commonPortionSize');
        expect(food).toHaveProperty('aliases');
        
        // Verificar tipos
        expect(typeof food.name).toBe('string');
        expect(typeof food.category).toBe('string');
        expect(typeof food.caloriesPer100g).toBe('number');
        expect(typeof food.commonPortionSize).toBe('number');
        expect(Array.isArray(food.aliases)).toBe(true);
        
        // Verificar macronutrientes
        expect(food.macrosPer100g).toHaveProperty('proteins');
        expect(food.macrosPer100g).toHaveProperty('carbohydrates');
        expect(food.macrosPer100g).toHaveProperty('fats');
        expect(food.macrosPer100g).toHaveProperty('fiber');
        
        expect(typeof food.macrosPer100g.proteins).toBe('number');
        expect(typeof food.macrosPer100g.carbohydrates).toBe('number');
        expect(typeof food.macrosPer100g.fats).toBe('number');
        expect(typeof food.macrosPer100g.fiber).toBe('number');
      });
    });

    test('should have positive nutritional values', () => {
      Object.entries(nutritionDatabase).forEach(([key, food]) => {
        expect(food.caloriesPer100g).toBeGreaterThan(0);
        expect(food.commonPortionSize).toBeGreaterThan(0);
        expect(food.macrosPer100g.proteins).toBeGreaterThanOrEqual(0);
        expect(food.macrosPer100g.carbohydrates).toBeGreaterThanOrEqual(0);
        expect(food.macrosPer100g.fats).toBeGreaterThanOrEqual(0);
        expect(food.macrosPer100g.fiber).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('findFoodByName', () => {
    test('should find food by exact key match', () => {
      const result = findFoodByName('apple');
      expect(result).toBeDefined();
      expect(result.key).toBe('apple');
      expect(result.name).toBe('Manzana');
    });

    test('should find food by alias match', () => {
      const result = findFoodByName('manzana');
      expect(result).toBeDefined();
      expect(result.key).toBe('apple');
      expect(result.name).toBe('Manzana');
    });

    test('should be case insensitive', () => {
      const result1 = findFoodByName('APPLE');
      const result2 = findFoodByName('Apple');
      const result3 = findFoodByName('aPpLe');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      
      expect(result1.key).toBe('apple');
      expect(result2.key).toBe('apple');
      expect(result3.key).toBe('apple');
    });

    test('should handle partial matches', () => {
      const result = findFoodByName('chick');
      expect(result).toBeDefined();
      expect(result.key).toBe('chicken');
    });

    test('should return null for non-existent food', () => {
      const result = findFoodByName('nonexistentfood');
      expect(result).toBeNull();
    });

    test('should handle empty or whitespace input', () => {
      expect(findFoodByName('')).toBeNull();
      expect(findFoodByName('   ')).toBeNull();
    });

    test('should trim input', () => {
      const result = findFoodByName('  apple  ');
      expect(result).toBeDefined();
      expect(result.key).toBe('apple');
    });
  });

  describe('getCategories', () => {
    test('should return array of unique categories', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Verificar que no hay duplicados
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });

    test('should include expected categories', () => {
      const categories = getCategories();
      expect(categories).toContain('fruit');
      expect(categories).toContain('vegetable');
      expect(categories).toContain('protein');
      expect(categories).toContain('carbohydrate');
      expect(categories).toContain('dairy');
    });
  });

  describe('getFoodsByCategory', () => {
    test('should return foods for valid category', () => {
      const fruits = getFoodsByCategory('fruit');
      expect(Array.isArray(fruits)).toBe(true);
      expect(fruits.length).toBeGreaterThan(0);
      
      fruits.forEach(food => {
        expect(food.category).toBe('fruit');
        expect(food).toHaveProperty('key');
        expect(food).toHaveProperty('name');
      });
    });

    test('should return empty array for invalid category', () => {
      const result = getFoodsByCategory('invalidcategory');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should include all expected properties', () => {
      const proteins = getFoodsByCategory('protein');
      expect(proteins.length).toBeGreaterThan(0);
      
      proteins.forEach(food => {
        expect(food).toHaveProperty('key');
        expect(food).toHaveProperty('name');
        expect(food).toHaveProperty('category');
        expect(food).toHaveProperty('caloriesPer100g');
        expect(food).toHaveProperty('macrosPer100g');
        expect(food).toHaveProperty('commonPortionSize');
        expect(food).toHaveProperty('aliases');
      });
    });
  });

  describe('Data integrity', () => {
    test('should have consistent aliases', () => {
      Object.entries(nutritionDatabase).forEach(([key, food]) => {
        // Verificar que el key está incluido en los aliases o es similar al nombre
        const keyInAliases = food.aliases.some(alias => 
          alias.toLowerCase() === key.toLowerCase()
        );
        const keyMatchesName = food.name.toLowerCase().includes(key.toLowerCase()) ||
                              key.toLowerCase().includes(food.name.toLowerCase());
        
        expect(keyInAliases || keyMatchesName).toBe(true);
      });
    });

    test('should have reasonable calorie ranges by category', () => {
      const fruits = getFoodsByCategory('fruit');
      const proteins = getFoodsByCategory('protein');
      
      // Las frutas generalmente tienen menos calorías que las proteínas
      fruits.forEach(fruit => {
        expect(fruit.caloriesPer100g).toBeLessThan(200);
      });
      
      proteins.forEach(protein => {
        expect(protein.caloriesPer100g).toBeGreaterThan(100);
      });
    });

    test('should have reasonable portion sizes', () => {
      Object.values(nutritionDatabase).forEach(food => {
        // Las porciones deberían estar entre 10g y 500g
        expect(food.commonPortionSize).toBeGreaterThanOrEqual(10);
        expect(food.commonPortionSize).toBeLessThanOrEqual(500);
      });
    });
  });
});