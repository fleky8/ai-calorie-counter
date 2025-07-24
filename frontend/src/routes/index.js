import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingState from '../components/LoadingState';

// Importar componentes con lazy loading
const CameraCapture = lazy(() => import('../components/CameraCapture'));
const ImageAnalysis = lazy(() => import('../components/ImageAnalysis'));
const NutritionDisplay = lazy(() => import('../components/NutritionDisplay'));
const HistoryView = lazy(() => import('../components/HistoryView'));

/**
 * Componente de rutas principal de la aplicación
 * Implementa code splitting para optimizar el rendimiento
 */
const AppRoutes = ({ 
  currentImage, 
  analysisResult, 
  isAnalyzing,
  handleImageCapture,
  handleAnalysisStart,
  handleAnalysisComplete,
  handleReset
}) => {
  return (
    <Suspense fallback={<LoadingState message="Cargando..." />}>
      <Routes>
        {/* Ruta principal - Captura de imagen */}
        <Route 
          path="/" 
          element={
            <CameraCapture 
              onImageCapture={handleImageCapture}
              currentImage={currentImage}
            />
          } 
        />
        
        {/* Ruta de análisis - Procesamiento de imagen */}
        <Route 
          path="/analyze" 
          element={
            currentImage ? (
              <ImageAnalysis 
                imageFile={currentImage}
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                isAnalyzing={isAnalyzing}
                analysisResult={analysisResult}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Ruta de resultados - Visualización nutricional */}
        <Route 
          path="/results" 
          element={
            analysisResult ? (
              <NutritionDisplay 
                nutritionData={analysisResult}
                onNewAnalysis={handleReset}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Ruta de historial */}
        <Route 
          path="/history" 
          element={<HistoryView />} 
        />
        
        {/* Ruta por defecto - redirigir a inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;