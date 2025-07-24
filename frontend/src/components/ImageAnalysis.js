import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';
import { uploadFile } from '../services/apiService';
import { ErrorTypes, AppError } from '../services/errorService';
import ErrorDisplay from './ErrorDisplay';
import ProgressFeedback from './ProgressFeedback';
import useAsync from '../hooks/useAsync';

const AnalysisContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['primary', 'disabled'].includes(prop)
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.primary ? '#0056b3' : '#545b62'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
  }
`;

// Definimos los pasos del proceso de análisis
const ANALYSIS_STEPS = [
  'Preparación',
  'Envío',
  'Análisis',
  'Resultados'
];

// const ErrorDetails = styled.div`
//   font-size: 0.9rem;
//   color: #721c24;
//   margin-top: 0.5rem;
//   padding: 0.5rem;
//   background: #f8d7da;
//   border-radius: 4px;
//   width: 100%;
//   max-width: 350px;
// `;

const ImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ImageAnalysis = ({ imageFile, onAnalysisStart, onAnalysisComplete, isAnalyzing, analysisResult }) => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  
  // Estado para mostrar mensajes de progreso
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Usar el hook useAsync para manejar la operación asíncrona
  const { 
    execute: analyzeImageAsync, 
    status, 
    error, 
    // data,
    isLoading,
    isError,
    isSuccess,
    retry 
  } = useAsync(async () => {
    if (!imageFile || !(imageFile instanceof File)) {
      throw new AppError(
        'No se ha seleccionado ninguna imagen para analizar.',
        ErrorTypes.VALIDATION
      );
    }

    // Notificar al componente padre que el análisis ha comenzado
    if (onAnalysisStart) {
      onAnalysisStart();
    }

    // Paso 1: Preparación
    setCurrentStep(0);
    setProgressPercent(10);
    setProgressMessage('Preparando imagen para análisis...');
    
    // Simular un pequeño retraso para mostrar el mensaje
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Comprimir imagen si es necesario (más de 5MB)
    const fileToUpload = imageFile;
    if (imageFile.size > 5 * 1024 * 1024) {
      setProgressMessage('Optimizando imagen para análisis...');
      setProgressPercent(20);
      // Aquí se podría implementar compresión de imagen
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Paso 2: Envío
    setCurrentStep(1);
    setProgressPercent(30);
    setProgressMessage('Enviando imagen al servidor...');
    
    // Simular un pequeño retraso para mostrar el mensaje
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Enviar la imagen al servidor para análisis
    const result = await uploadFile('/api/analyze-image', fileToUpload, {
      enableRetry: true,
      maxRetries: 2,
      timeout: 45000, // 45 segundos para análisis de imágenes
      fields: {
        // Campos adicionales que se podrían enviar con la imagen
        clientTimestamp: new Date().toISOString(),
        deviceInfo: navigator.userAgent
      }
    });
    
    // Paso 3: Análisis
    setCurrentStep(2);
    setProgressPercent(70);
    setProgressMessage('Procesando resultados del análisis...');
    
    // Simular un pequeño retraso para mostrar el mensaje
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar si el resultado es exitoso
    if (!result.success) {
      throw new AppError(
        result.message || 'Error al analizar la imagen',
        ErrorTypes.API,
        result.error
      );
    }
    
    // Paso 4: Resultados
    setCurrentStep(3);
    setProgressPercent(100);
    setProgressMessage('¡Análisis completado con éxito!');
    
    // Pasar los resultados al componente padre
    if (onAnalysisComplete && result) {
      onAnalysisComplete(result);
    }
    
    return result;
  }, {
    onError: (error) => {
      console.error('Error durante el análisis de imagen:', error);
      setProgressMessage('');
    },
    onSuccess: () => {
      setProgressMessage('¡Análisis completado con éxito!');
    }
  });
  
  useEffect(() => {
    // Crear URL para la vista previa de la imagen si se proporciona
    if (imageFile && imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      
      // Limpiar URL cuando el componente se desmonta o la imagen cambia
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Auto-navegar a resultados cuando el análisis se complete exitosamente
  useEffect(() => {
    if (analysisResult && isSuccess) {
      navigate('/results');
    }
  }, [analysisResult, isSuccess, navigate]);

  // Función para iniciar el análisis
  const analyzeImage = () => {
    analyzeImageAsync();
  };

  // Función para volver a la captura
  const goBack = () => {
    navigate('/');
  };

  const renderStatusContent = () => {
    if (isAnalyzing || isLoading) {
      return (
        <ProgressFeedback
          status="loading"
          message={progressMessage || 'Analizando imagen...'}
          subMessage="Por favor espera mientras procesamos tu imagen"
          progress={progressPercent}
          steps={ANALYSIS_STEPS}
          currentStep={currentStep}
          animate={true}
        />
      );
    }
    
    if (isError) {
      return (
        <ErrorDisplay 
          error={error}
          onRetry={retry}
          onClose={() => {}}
          showClose={false}
        />
      );
    }
    
    if (isSuccess && analysisResult) {
      return (
        <ProgressFeedback
          status="success"
          message="Análisis completado con éxito"
          subMessage="Redirigiendo a resultados..."
          progress={100}
          steps={ANALYSIS_STEPS}
          currentStep={3}
          animate={false}
        />
      );
    }
    
    return null;
  };

  return (
    <AnalysisContainer>
      <div className="text-center mb-4">
        <h2 className="text-lg mb-3">Análisis de imagen</h2>
        <p className="text-md mb-4">
          Confirma que la imagen es correcta y procede con el análisis nutricional.
        </p>
      </div>

      {imageUrl && <ImagePreview src={imageUrl} alt="Imagen para analizar" />}
      
      <div className="d-flex gap-2 flex-wrap justify-content-center">
        <Button onClick={goBack} disabled={isAnalyzing || isLoading}>
          <FaArrowLeft />
          Volver
        </Button>
        
        {!isAnalyzing && !isLoading && !isSuccess && (
          <Button 
            primary 
            onClick={analyzeImage} 
            disabled={isLoading || !imageFile}
          >
            {isError ? 'Reintentar análisis' : 'Analizar imagen'}
          </Button>
        )}
      </div>
      
      {(status !== 'idle' || isAnalyzing) && renderStatusContent()}
    </AnalysisContainer>
  );
};

export default ImageAnalysis;