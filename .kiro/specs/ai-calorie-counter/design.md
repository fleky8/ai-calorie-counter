# Documento de Diseño

## Visión General

La aplicación será una Progressive Web App (PWA) desarrollada con tecnologías web modernas que permita a los usuarios analizar fotografías de alimentos para obtener información nutricional. La arquitectura será cliente-servidor con procesamiento de imágenes mediante APIs de Google y almacenamiento local para el historial del usuario.

## Arquitectura

### Arquitectura General
```
[Cliente Web (PWA)] ↔ [Servidor Backend] ↔ [Google Vision API]
        ↓                                      ↓
[Local Storage]                        [Base de Datos Nutricional]
```

### Componentes Principales
- **Frontend**: React.js con PWA capabilities
- **Backend**: Node.js con Express
- **APIs Externas**: Google Vision API para reconocimiento de imágenes
- **Base de Datos**: Base de datos nutricional local/API nutricional
- **Almacenamiento**: LocalStorage para historial del usuario

## Componentes e Interfaces

### Frontend Components

#### 1. CameraCapture Component
- **Propósito**: Capturar fotografías o permitir subida de archivos
- **Props**: `onImageCapture(imageFile)`
- **Estado**: `isCapturing`, `imagePreview`
- **Funcionalidades**:
  - Acceso a cámara del dispositivo
  - Subida de archivos desde galería
  - Preview de imagen antes del análisis

#### 2. ImageAnalysis Component
- **Propósito**: Mostrar el proceso de análisis y resultados
- **Props**: `imageFile`, `analysisResult`
- **Estado**: `isAnalyzing`, `error`, `nutritionData`
- **Funcionalidades**:
  - Indicador de progreso durante análisis
  - Manejo de errores de API
  - Visualización de resultados

#### 3. NutritionDisplay Component
- **Propósito**: Visualizar información nutricional de forma atractiva
- **Props**: `nutritionData`
- **Funcionalidades**:
  - Gráfico circular para macronutrientes
  - Tarjetas informativas para calorías
  - Indicadores visuales claros

#### 4. HistoryView Component
- **Propósito**: Mostrar historial de análisis anteriores
- **Estado**: `historyItems`, `selectedItem`
- **Funcionalidades**:
  - Lista de análisis previos
  - Filtrado por fecha
  - Eliminación de entradas

### Backend APIs

#### 1. POST /api/analyze-image
- **Entrada**: FormData con imagen
- **Proceso**:
  1. Validar formato de imagen
  2. Enviar a Google Vision API para detección de objetos
  3. Identificar alimentos en la respuesta
  4. Consultar base de datos nutricional
  5. Calcular estimaciones nutricionales
- **Salida**: JSON con información nutricional

#### 2. GET /api/nutrition/:foodItem
- **Entrada**: Nombre del alimento
- **Salida**: Información nutricional detallada

### Interfaces de Datos

```typescript
interface NutritionData {
  totalCalories: number;
  macronutrients: {
    proteins: number;    // gramos
    carbohydrates: number; // gramos
    fats: number;        // gramos
  };
  confidence: number;    // 0-1
  detectedFoods: FoodItem[];
}

interface FoodItem {
  name: string;
  confidence: number;
  estimatedWeight: number; // gramos
  calories: number;
  macros: Macronutrients;
}

interface AnalysisHistory {
  id: string;
  timestamp: Date;
  imageUrl: string; // blob URL local
  nutritionData: NutritionData;
}
```

## Modelos de Datos

### Almacenamiento Local (LocalStorage)
```json
{
  "analysisHistory": [
    {
      "id": "uuid",
      "timestamp": "2025-01-21T10:30:00Z",
      "imageBlob": "base64_encoded_image",
      "nutritionData": { /* NutritionData object */ }
    }
  ],
  "userPreferences": {
    "units": "metric",
    "dailyCalorieGoal": 2000
  }
}
```

### Base de Datos Nutricional
```json
{
  "foodDatabase": {
    "apple": {
      "caloriesPer100g": 52,
      "macrosPer100g": {
        "proteins": 0.3,
        "carbohydrates": 14,
        "fats": 0.2
      }
    }
  }
}
```

## Manejo de Errores

### Errores de API
- **Google Vision API no disponible**: Mostrar mensaje de error y sugerir reintentar
- **Imagen no válida**: Validar formato antes del envío
- **No se detectan alimentos**: Mensaje informativo pidiendo mejor imagen
- **Límite de API excedido**: Notificar al usuario sobre límites diarios

### Errores de Red
- **Sin conexión**: Modo offline con funcionalidades limitadas
- **Timeout**: Reintentos automáticos con backoff exponencial

### Validaciones
- **Tamaño de imagen**: Máximo 5MB
- **Formatos soportados**: JPEG, PNG, WebP
- **Resolución mínima**: 300x300 píxeles

## Estrategia de Testing

### Tests Unitarios
- **Componentes React**: Testing Library para interacciones de usuario
- **Utilidades**: Jest para funciones de procesamiento de datos
- **APIs**: Mocking de llamadas a Google Vision API

### Tests de Integración
- **Flujo completo**: Captura → Análisis → Visualización
- **Almacenamiento local**: Persistencia y recuperación de datos
- **Responsive design**: Tests en diferentes tamaños de pantalla

### Tests E2E
- **Cypress**: Flujos críticos de usuario
- **PWA functionality**: Instalación y uso offline
- **Cross-browser**: Chrome, Firefox, Safari

### Tests de Performance
- **Lighthouse**: PWA score, performance, accessibility
- **Bundle size**: Optimización de JavaScript
- **Image processing**: Tiempo de respuesta de APIs

## Consideraciones Técnicas

### PWA Features
- **Service Worker**: Cache de recursos estáticos
- **Manifest**: Instalación como app nativa
- **Offline support**: Funcionalidades básicas sin conexión

### Optimizaciones
- **Lazy loading**: Componentes y rutas
- **Image compression**: Reducir tamaño antes del envío
- **API caching**: Cache de resultados comunes

### Seguridad
- **HTTPS obligatorio**: Para acceso a cámara
- **Validación de entrada**: Sanitización de datos
- **Rate limiting**: Prevenir abuso de APIs
- **No almacenamiento de imágenes**: Solo procesamiento temporal