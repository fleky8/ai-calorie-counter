const { findFoodByName } = require('../data/nutritionDatabase');

/**
 * Estima el peso de una porción basado en el nivel de confianza y tamaño relativo
 * @param {Object} foodItem - Item de comida detectado
 * @param {Object} nutritionInfo - Información nutricional del alimento
 * @returns {number} - Peso estimado en gramos
 */
function estimatePortionWeight(foodItem, nutritionInfo) {
  const baseWeight = nutritionInfo.commonPortionSize;
  const confidence = foodItem.confidence;
  
  // Factor de ajuste basado en confianza (más confianza = estimación más precisa)
  let confidenceFactor = 1;
  if (confidence > 0.9) {
    confidenceFactor = 1.0; // Alta confianza, usar peso estándar
  } else if (confidence > 0.7) {
    confidenceFactor = 0.9; // Confianza media-alta, reducir ligeramente
  } else if (confidence > 0.5) {
    confidenceFactor = 0.8; // Confianza media, reducir más
  } else {
    confidenceFactor = 0.7; // Baja confianza, estimación conservadora
  }
  
  // Si hay información de bounding box, usar para estimar tamaño relativo
  let sizeFactor = 1;
  if (foodItem.boundingBox && foodItem.boundingBox.normalizedVertices) {
    const vertices = foodItem.boundingBox.normalizedVertices;
    if (vertices.length >= 2) {
      // Calcular área aproximada del bounding box
      const width = Math.abs(vertices[1].x - vertices[0].x);
      const height = Math.abs(vertices[2].y - vertices[0].y);
      const area = width * height;
      
      // Ajustar peso basado en área (área mayor = porción mayor)
      if (area > 0.3) {
        sizeFactor = 1.3; // Porción grande
      } else if (area > 0.15) {
        sizeFactor = 1.0; // Porción normal
      } else if (area > 0.05) {
        sizeFactor = 0.7; // Porción pequeña
      } else {
        sizeFactor = 0.5; // Porción muy pequeña
      }
    }
  }
  
  // Calcular peso final con factores de ajuste
  const estimatedWeight = Math.round(baseWeight * confidenceFactor * sizeFactor);
  
  // Asegurar que el peso esté en un rango razonable
  const minWeight = Math.round(baseWeight * 0.3);
  const maxWeight = Math.round(baseWeight * 2.5);
  
  return Math.max(minWeight, Math.min(maxWeight, estimatedWeight));
}

/**
 * Calcula información nutricional para un alimento específico
 * @param {Object} foodItem - Item de comida detectado por Vision API
 * @returns {Object|null} - Información nutricional calculada o null si no se encuentra
 */
function calculateNutritionForFood(foodItem) {
  // Buscar información nutricional en la base de datos
  const nutritionInfo = findFoodByName(foodItem.name);
  
  if (!nutritionInfo) {
    console.warn(`⚠️ No se encontró información nutricional para: ${foodItem.name}`);
    return null;
  }
  
  // Estimar peso de la porción
  const estimatedWeight = estimatePortionWeight(foodItem, nutritionInfo);
  const weightFactor = estimatedWeight / 100; // Factor para convertir de 100g a peso estimado
  
  // Calcular valores nutricionales para la porción estimada
  const calories = Math.round(nutritionInfo.caloriesPer100g * weightFactor);
  const macros = {
    proteins: Math.round(nutritionInfo.macrosPer100g.proteins * weightFactor * 10) / 10,
    carbohydrates: Math.round(nutritionInfo.macrosPer100g.carbohydrates * weightFactor * 10) / 10,
    fats: Math.round(nutritionInfo.macrosPer100g.fats * weightFactor * 10) / 10,
    fiber: Math.round(nutritionInfo.macrosPer100g.fiber * weightFactor * 10) / 10,
  };
  
  return {
    name: nutritionInfo.name,
    originalName: foodItem.name,
    category: nutritionInfo.category,
    confidence: foodItem.confidence,
    estimatedWeight,
    calories,
    macronutrients: macros,
    nutritionPer100g: {
      calories: nutritionInfo.caloriesPer100g,
      macronutrients: nutritionInfo.macrosPer100g,
    },
  };
}

/**
 * Calcula información nutricional total para una lista de alimentos detectados
 * @param {Array} foodItems - Lista de alimentos detectados por Vision API
 * @returns {Object} - Información nutricional total y detallada
 */
function calculateTotalNutrition(foodItems) {
  const detectedFoods = [];
  let totalCalories = 0;
  let totalMacros = {
    proteins: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
  };
  
  let processedCount = 0;
  let notFoundCount = 0;
  
  // Procesar cada alimento detectado
  foodItems.forEach(foodItem => {
    const nutritionData = calculateNutritionForFood(foodItem);
    
    if (nutritionData) {
      detectedFoods.push(nutritionData);
      totalCalories += nutritionData.calories;
      
      // Sumar macronutrientes
      Object.keys(totalMacros).forEach(macro => {
        totalMacros[macro] += nutritionData.macronutrients[macro];
      });
      
      processedCount++;
    } else {
      notFoundCount++;
    }
  });
  
  // Redondear totales
  totalCalories = Math.round(totalCalories);
  Object.keys(totalMacros).forEach(macro => {
    totalMacros[macro] = Math.round(totalMacros[macro] * 10) / 10;
  });
  
  // Calcular nivel de confianza promedio
  const avgConfidence = detectedFoods.length > 0 
    ? detectedFoods.reduce((sum, food) => sum + food.confidence, 0) / detectedFoods.length
    : 0;
  
  // Calcular distribución de macronutrientes en porcentajes
  const totalMacroWeight = totalMacros.proteins + totalMacros.carbohydrates + totalMacros.fats;
  const macroDistribution = totalMacroWeight > 0 ? {
    proteins: Math.round((totalMacros.proteins / totalMacroWeight) * 100),
    carbohydrates: Math.round((totalMacros.carbohydrates / totalMacroWeight) * 100),
    fats: Math.round((totalMacros.fats / totalMacroWeight) * 100),
  } : { proteins: 0, carbohydrates: 0, fats: 0 };
  
  return {
    totalCalories,
    macronutrients: totalMacros,
    macroDistribution,
    detectedFoods,
    summary: {
      totalFoodsDetected: foodItems.length,
      foodsProcessed: processedCount,
      foodsNotFound: notFoundCount,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
    },
    estimationNote: 'Los valores nutricionales son estimaciones basadas en análisis de IA y pueden variar según el tamaño real de las porciones.',
  };
}

/**
 * Obtiene información nutricional detallada de un alimento específico
 * @param {string} foodName - Nombre del alimento
 * @returns {Object|null} - Información nutricional detallada o null si no se encuentra
 */
function getFoodNutritionInfo(foodName) {
  const nutritionInfo = findFoodByName(foodName);
  
  if (!nutritionInfo) {
    return null;
  }
  
  return {
    name: nutritionInfo.name,
    category: nutritionInfo.category,
    commonPortionSize: nutritionInfo.commonPortionSize,
    nutritionPer100g: {
      calories: nutritionInfo.caloriesPer100g,
      macronutrients: nutritionInfo.macrosPer100g,
    },
    nutritionPerPortion: {
      calories: Math.round((nutritionInfo.caloriesPer100g * nutritionInfo.commonPortionSize) / 100),
      macronutrients: {
        proteins: Math.round((nutritionInfo.macrosPer100g.proteins * nutritionInfo.commonPortionSize) / 100 * 10) / 10,
        carbohydrates: Math.round((nutritionInfo.macrosPer100g.carbohydrates * nutritionInfo.commonPortionSize) / 100 * 10) / 10,
        fats: Math.round((nutritionInfo.macrosPer100g.fats * nutritionInfo.commonPortionSize) / 100 * 10) / 10,
        fiber: Math.round((nutritionInfo.macrosPer100g.fiber * nutritionInfo.commonPortionSize) / 100 * 10) / 10,
      },
    },
    aliases: nutritionInfo.aliases,
  };
}

module.exports = {
  estimatePortionWeight,
  calculateNutritionForFood,
  calculateTotalNutrition,
  getFoodNutritionInfo,
};