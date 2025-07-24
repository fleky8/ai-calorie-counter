/**
 * Base de datos nutricional local con información básica de alimentos
 * Valores nutricionales por 100g de alimento
 */

const nutritionDatabase = {
  // Frutas
  'apple': {
    name: 'Manzana',
    category: 'fruit',
    caloriesPer100g: 52,
    macrosPer100g: {
      proteins: 0.3,
      carbohydrates: 14,
      fats: 0.2,
      fiber: 2.4,
    },
    commonPortionSize: 150, // gramos promedio de una manzana
    aliases: ['manzana', 'apple', 'red apple', 'green apple'],
  },
  'banana': {
    name: 'Plátano',
    category: 'fruit',
    caloriesPer100g: 89,
    macrosPer100g: {
      proteins: 1.1,
      carbohydrates: 23,
      fats: 0.3,
      fiber: 2.6,
    },
    commonPortionSize: 120,
    aliases: ['plátano', 'banana', 'banano'],
  },
  'orange': {
    name: 'Naranja',
    category: 'fruit',
    caloriesPer100g: 47,
    macrosPer100g: {
      proteins: 0.9,
      carbohydrates: 12,
      fats: 0.1,
      fiber: 2.4,
    },
    commonPortionSize: 130,
    aliases: ['naranja', 'orange'],
  },

  // Verduras
  'tomato': {
    name: 'Tomate',
    category: 'vegetable',
    caloriesPer100g: 18,
    macrosPer100g: {
      proteins: 0.9,
      carbohydrates: 3.9,
      fats: 0.2,
      fiber: 1.2,
    },
    commonPortionSize: 80,
    aliases: ['tomate', 'tomato'],
  },
  'potato': {
    name: 'Papa',
    category: 'vegetable',
    caloriesPer100g: 77,
    macrosPer100g: {
      proteins: 2,
      carbohydrates: 17,
      fats: 0.1,
      fiber: 2.2,
    },
    commonPortionSize: 150,
    aliases: ['papa', 'potato', 'patata'],
  },
  'carrot': {
    name: 'Zanahoria',
    category: 'vegetable',
    caloriesPer100g: 41,
    macrosPer100g: {
      proteins: 0.9,
      carbohydrates: 10,
      fats: 0.2,
      fiber: 2.8,
    },
    commonPortionSize: 60,
    aliases: ['zanahoria', 'carrot'],
  },

  // Proteínas
  'chicken': {
    name: 'Pollo',
    category: 'protein',
    caloriesPer100g: 165,
    macrosPer100g: {
      proteins: 31,
      carbohydrates: 0,
      fats: 3.6,
      fiber: 0,
    },
    commonPortionSize: 100,
    aliases: ['pollo', 'chicken', 'chicken breast', 'pechuga de pollo'],
  },
  'beef': {
    name: 'Carne de res',
    category: 'protein',
    caloriesPer100g: 250,
    macrosPer100g: {
      proteins: 26,
      carbohydrates: 0,
      fats: 15,
      fiber: 0,
    },
    commonPortionSize: 100,
    aliases: ['carne', 'beef', 'carne de res', 'res'],
  },
  'fish': {
    name: 'Pescado',
    category: 'protein',
    caloriesPer100g: 206,
    macrosPer100g: {
      proteins: 22,
      carbohydrates: 0,
      fats: 12,
      fiber: 0,
    },
    commonPortionSize: 100,
    aliases: ['pescado', 'fish', 'salmon', 'salmón'],
  },
  'egg': {
    name: 'Huevo',
    category: 'protein',
    caloriesPer100g: 155,
    macrosPer100g: {
      proteins: 13,
      carbohydrates: 1.1,
      fats: 11,
      fiber: 0,
    },
    commonPortionSize: 50, // un huevo promedio
    aliases: ['huevo', 'egg', 'eggs'],
  },

  // Carbohidratos
  'bread': {
    name: 'Pan',
    category: 'carbohydrate',
    caloriesPer100g: 265,
    macrosPer100g: {
      proteins: 9,
      carbohydrates: 49,
      fats: 3.2,
      fiber: 2.7,
    },
    commonPortionSize: 30, // una rebanada
    aliases: ['pan', 'bread', 'slice of bread'],
  },
  'rice': {
    name: 'Arroz',
    category: 'carbohydrate',
    caloriesPer100g: 130,
    macrosPer100g: {
      proteins: 2.7,
      carbohydrates: 28,
      fats: 0.3,
      fiber: 0.4,
    },
    commonPortionSize: 80,
    aliases: ['arroz', 'rice', 'white rice'],
  },
  'pasta': {
    name: 'Pasta',
    category: 'carbohydrate',
    caloriesPer100g: 131,
    macrosPer100g: {
      proteins: 5,
      carbohydrates: 25,
      fats: 1.1,
      fiber: 1.8,
    },
    commonPortionSize: 80,
    aliases: ['pasta', 'noodles', 'fideos', 'espagueti'],
  },

  // Lácteos
  'milk': {
    name: 'Leche',
    category: 'dairy',
    caloriesPer100g: 42,
    macrosPer100g: {
      proteins: 3.4,
      carbohydrates: 5,
      fats: 1,
      fiber: 0,
    },
    commonPortionSize: 250, // un vaso
    aliases: ['leche', 'milk'],
  },
  'cheese': {
    name: 'Queso',
    category: 'dairy',
    caloriesPer100g: 113,
    macrosPer100g: {
      proteins: 25,
      carbohydrates: 1,
      fats: 9,
      fiber: 0,
    },
    commonPortionSize: 30,
    aliases: ['queso', 'cheese'],
  },
  'yogurt': {
    name: 'Yogur',
    category: 'dairy',
    caloriesPer100g: 59,
    macrosPer100g: {
      proteins: 10,
      carbohydrates: 3.6,
      fats: 0.4,
      fiber: 0,
    },
    commonPortionSize: 125,
    aliases: ['yogur', 'yogurt', 'yoghurt'],
  },


};

/**
 * Busca información nutricional de un alimento por nombre o alias
 * @param {string} foodName - Nombre del alimento a buscar
 * @returns {Object|null} - Información nutricional o null si no se encuentra
 */
function findFoodByName(foodName) {
  if (!foodName || typeof foodName !== 'string') {
    return null;
  }
  
  const searchName = foodName.toLowerCase().trim();
  
  if (searchName.length === 0) {
    return null;
  }
  
  // Buscar coincidencia exacta en claves
  if (nutritionDatabase[searchName]) {
    return { key: searchName, ...nutritionDatabase[searchName] };
  }
  
  // Buscar en aliases
  for (const [key, food] of Object.entries(nutritionDatabase)) {
    if (food.aliases.some(alias => alias.toLowerCase() === searchName)) {
      return { key, ...food };
    }
  }
  
  // Buscar coincidencias parciales en aliases
  for (const [key, food] of Object.entries(nutritionDatabase)) {
    if (food.aliases.some(alias => 
      alias.toLowerCase().includes(searchName) || 
      searchName.includes(alias.toLowerCase())
    )) {
      return { key, ...food };
    }
  }
  
  return null;
}

/**
 * Obtiene todas las categorías disponibles
 * @returns {Array} - Lista de categorías únicas
 */
function getCategories() {
  const categories = new Set();
  Object.values(nutritionDatabase).forEach(food => {
    categories.add(food.category);
  });
  return Array.from(categories);
}

/**
 * Obtiene alimentos por categoría
 * @param {string} category - Categoría a filtrar
 * @returns {Array} - Lista de alimentos en la categoría
 */
function getFoodsByCategory(category) {
  return Object.entries(nutritionDatabase)
    .filter(([key, food]) => food.category === category)
    .map(([key, food]) => ({ key, ...food }));
}

module.exports = {
  nutritionDatabase,
  findFoodByName,
  getCategories,
  getFoodsByCategory,
};