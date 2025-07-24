import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import AppRoutes from './routes';

function App() {
  // Estados globales para manejo de datos entre componentes
  const [currentImage, setCurrentImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Función para manejar nueva imagen capturada
  const handleImageCapture = (imageFile) => {
    setCurrentImage(imageFile);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  // Función para manejar resultado de análisis
  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Función para manejar inicio de análisis
  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  // Función para resetear estado y volver al inicio
  const handleReset = () => {
    setCurrentImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <header className="App-header">
            <div className="container">
              <h1 className="mb-2">AI Calorie Counter</h1>
              <p className="mb-0">Contador de calorías con inteligencia artificial</p>
            </div>
          </header>
          
          <Navigation onReset={handleReset} />
          
          <main className="container mt-4">
            <AppRoutes 
              currentImage={currentImage}
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
              handleImageCapture={handleImageCapture}
              handleAnalysisStart={handleAnalysisStart}
              handleAnalysisComplete={handleAnalysisComplete}
              handleReset={handleReset}
            />
          </main>
          
          <footer className="container mt-5 pt-4 pb-4 text-center">
            <p className="text-sm">© 2025 AI Calorie Counter - Todos los derechos reservados</p>
          </footer>
          
          {/* Componente para notificar actualizaciones de la PWA */}
          <PWAUpdateNotification />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;