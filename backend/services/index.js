const vision = require('@google-cloud/vision');
const config = require('../config');
const { calculateTotalNutrition, getFoodNutritionInfo } = require('./nutritionService');

// Inicializar cliente de Google Vision
const visionClient = new vision.ImageAnnotatorClient({
  projectId: config.googleCloud.projectId,
  keyFilename: config.googleCloud.keyFilename,
});

/**
 * Analiza una imagen para detectar objetos/alimentos usando Google Vision API
 * @param {Buffer} imageBuffer - Buffer de la imagen a analizar
 * @returns {Promise<Object>} - Resultado del análisis con objetos detectados
 */
async function analyzeImageWithVision(imageBuffer) {
  try {
    // Detectar objetos en la imagen
    const [objectResult] = await visionClient.objectLocalization({
      image: { content: imageBuffer },
    });

    // Detectar etiquetas generales
    const [labelResult] = await visionClient.labelDetection({
      image: { content: imageBuffer },
      maxResults: 20,
    });

    // Detectar texto (útil para etiquetas nutricionales)
    const [textResult] = await visionClient.textDetection({
      image: { content: imageBuffer },
    });

    const objects = objectResult.localizedObjectAnnotations || [];
    const labels = labelResult.labelAnnotations || [];
    const textAnnotations = textResult.textAnnotations || [];

    return {
      objects: objects.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: obj.boundingPoly,
      })),
      labels: labels.map(label => ({
        description: label.description,
        confidence: label.score,
        topicality: label.topicality,
      })),
      text: textAnnotations.length > 0 ? textAnnotations[0].description : null,
      detectedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error en Google Vision API:', error);
    throw new Error(`Error al analizar imagen: ${error.message}`);
  }
}

/**
 * Filtra y clasifica objetos detectados para identificar alimentos
 * @param {Array} objects - Objetos detectados por Vision API
 * @param {Array} labels - Etiquetas detectadas por Vision API
 * @returns {Array} - Lista de alimentos identificados
 */
function identifyFoodItems(objects, labels) {
  // Palabras clave relacionadas con alimentos
  const foodKeywords = [
    'food', 'fruit', 'vegetable', 'meat', 'bread', 'pasta', 'rice', 'chicken',
    'beef', 'fish', 'apple', 'banana', 'orange', 'tomato', 'potato', 'carrot',
    'salad', 'sandwich', 'pizza', 'burger', 'cake', 'cookie', 'cheese',
    'milk', 'egg', 'yogurt', 'cereal', 'soup', 'noodle', 'taco', 'burrito',
    'comida', 'fruta', 'verdura', 'carne', 'pan', 'pollo', 'pescado',
    'manzana', 'plátano', 'naranja', 'tomate', 'papa', 'zanahoria',
    'ensalada', 'sándwich', 'hamburguesa', 'pastel', 'queso', 'leche',
    'huevo', 'yogur', 'cereal', 'sopa', 'fideos'
  ];

  const identifiedFoods = [];

  // Procesar objetos detectados
  objects.forEach(obj => {
    const isFood = foodKeywords.some(keyword => 
      obj.name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isFood && obj.confidence > 0.5) {
      identifiedFoods.push({
        name: obj.name,
        confidence: obj.confidence,
        type: 'object',
        boundingBox: obj.boundingBox,
      });
    }
  });

  // Procesar etiquetas detectadas
  labels.forEach(label => {
    const isFood = foodKeywords.some(keyword => 
      label.description.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isFood && label.confidence > 0.7) {
      // Evitar duplicados
      const exists = identifiedFoods.some(food => 
        food.name.toLowerCase() === label.description.toLowerCase()
      );
      
      if (!exists) {
        identifiedFoods.push({
          name: label.description,
          confidence: label.confidence,
          type: 'label',
          topicality: label.topicality,
        });
      }
    }
  });

  // Ordenar por confianza descendente
  return identifiedFoods.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Procesa una imagen completa: análisis + identificación de alimentos + cálculo nutricional
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @returns {Promise<Object>} - Resultado completo del procesamiento con información nutricional
 */
async function processImageForFood(imageBuffer) {
  try {
    // Analizar imagen con Google Vision
    const visionResult = await analyzeImageWithVision(imageBuffer);
    
    // Identificar alimentos en los resultados
    const foodItems = identifyFoodItems(visionResult.objects, visionResult.labels);
    
    if (foodItems.length === 0) {
      return {
        success: false,
        message: 'No se detectaron alimentos en la imagen. Intenta con una imagen más clara.',
        foodItems: [],
        nutritionData: null,
        rawData: visionResult,
      };
    }

    // Calcular información nutricional total
    const nutritionData = calculateTotalNutrition(foodItems);

    return {
      success: true,
      message: `Se detectaron ${foodItems.length} alimento(s) en la imagen`,
      foodItems,
      nutritionData,
      rawData: visionResult,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    return {
      success: false,
      message: error.message,
      foodItems: [],
      nutritionData: null,
      error: error.message,
    };
  }
}

module.exports = {
  analyzeImageWithVision,
  identifyFoodItems,
  processImageForFood,
  getFoodNutritionInfo,
};