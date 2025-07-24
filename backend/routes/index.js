const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload');
const { validateImageFile } = require('../middleware');
const { processImageForFood, getFoodNutritionInfo } = require('../services');
const { getCategories, getFoodsByCategory } = require('../data/nutritionDatabase');

// Ruta de bienvenida para la API
router.get('/', (req, res) => {
  res.json({
    message: '🍎 AI Calorie Counter API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      analyzeImage: 'POST /api/analyze-image',
      nutrition: 'GET /api/nutrition/:foodItem',
      foods: 'GET /api/foods',
      foodsByCategory: 'GET /api/foods/category/:category',
    },
    documentation: 'https://github.com/tu-usuario/ai-calorie-counter',
  });
});

// Ruta para análisis de imágenes de alimentos
router.post('/analyze-image', 
  upload,
  handleMulterError,
  validateImageFile,
  async (req, res) => {
    try {
      console.log('📸 Procesando imagen para análisis de alimentos...');
      
      // Procesar imagen con Google Vision API
      const result = await processImageForFood(req.file.buffer);
      
      if (!result.success) {
        return res.status(400).json({
          error: {
            message: result.message,
            status: 400,
          },
          details: result.error,
        });
      }
      
      console.log(`✅ Análisis completado: ${result.foodItems.length} alimentos detectados`);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          foodItems: result.foodItems,
          nutritionData: result.nutritionData,
          imageInfo: {
            size: req.file.size,
            mimetype: req.file.mimetype,
            processedAt: result.processedAt,
          },
          // Incluir datos raw solo en desarrollo
          ...(process.env.NODE_ENV === 'development' && { 
            rawVisionData: result.rawData 
          }),
        },
      });
      
    } catch (error) {
      console.error('❌ Error en análisis de imagen:', error);
      
      res.status(500).json({
        error: {
          message: 'Error interno del servidor al procesar la imagen',
          status: 500,
        },
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        }),
      });
    }
  }
);

// Ruta para obtener información nutricional de un alimento específico
router.get('/nutrition/:foodItem', (req, res) => {
  try {
    const { foodItem } = req.params;
    
    if (!foodItem || typeof foodItem !== 'string' || foodItem.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Nombre del alimento es requerido',
          status: 400,
        },
      });
    }
    
    console.log(`🔍 Buscando información nutricional para: ${foodItem}`);
    
    const nutritionInfo = getFoodNutritionInfo(foodItem);
    
    if (!nutritionInfo) {
      return res.status(404).json({
        error: {
          message: `No se encontró información nutricional para "${foodItem}"`,
          status: 404,
        },
        suggestions: [
          'Verifica la ortografía del alimento',
          'Intenta con un nombre más genérico (ej: "pollo" en lugar de "pollo asado")',
          'Consulta la lista de alimentos disponibles en /api/foods',
        ],
      });
    }
    
    console.log(`✅ Información nutricional encontrada para: ${nutritionInfo.name}`);
    
    res.json({
      success: true,
      data: nutritionInfo,
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo información nutricional:', error);
    
    res.status(500).json({
      error: {
        message: 'Error interno del servidor al obtener información nutricional',
        status: 500,
      },
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      }),
    });
  }
});

// Ruta para listar todos los alimentos disponibles en la base de datos
router.get('/foods', (req, res) => {
  try {
    const categories = getCategories();
    const foodsByCategory = {};
    
    categories.forEach(category => {
      foodsByCategory[category] = getFoodsByCategory(category).map(food => ({
        key: food.key,
        name: food.name,
        aliases: food.aliases,
        commonPortionSize: food.commonPortionSize,
      }));
    });
    
    res.json({
      success: true,
      data: {
        categories,
        totalFoods: Object.values(foodsByCategory).reduce((sum, foods) => sum + foods.length, 0),
        foodsByCategory,
      },
    });
    
  } catch (error) {
    console.error('❌ Error listando alimentos:', error);
    
    res.status(500).json({
      error: {
        message: 'Error interno del servidor al listar alimentos',
        status: 500,
      },
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      }),
    });
  }
});

// Ruta para listar alimentos por categoría
router.get('/foods/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const foods = getFoodsByCategory(category);
    
    if (foods.length === 0) {
      return res.status(404).json({
        error: {
          message: `No se encontraron alimentos en la categoría "${category}"`,
          status: 404,
        },
        availableCategories: getCategories(),
      });
    }
    
    res.json({
      success: true,
      data: {
        category,
        foods: foods.map(food => ({
          key: food.key,
          name: food.name,
          aliases: food.aliases,
          nutritionPer100g: {
            calories: food.caloriesPer100g,
            macronutrients: food.macrosPer100g,
          },
          commonPortionSize: food.commonPortionSize,
        })),
      },
    });
    
  } catch (error) {
    console.error('❌ Error listando alimentos por categoría:', error);
    
    res.status(500).json({
      error: {
        message: 'Error interno del servidor al listar alimentos por categoría',
        status: 500,
      },
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      }),
    });
  }
});

module.exports = router;