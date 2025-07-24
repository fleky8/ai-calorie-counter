import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCamera, FaImage, FaTimes, FaCheck } from 'react-icons/fa';
import { validateImageFile } from '../services/validationService';
import { AppError, ErrorTypes } from '../services/errorService';
import ErrorDisplay from './ErrorDisplay';

const CameraCaptureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  
  @media (min-width: 576px) {
    gap: 1rem;
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    gap: 1.25rem;
    padding: 1.25rem;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  
  @media (min-width: 576px) {
    max-width: 400px;
  }
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const Canvas = styled.canvas`
  display: none;
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  
  @media (max-width: 400px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['primary', 'danger'].includes(prop)
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.primary ? '#007bff' : props.danger ? '#dc3545' : '#6c757d'};
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.primary ? '#0056b3' : props.danger ? '#c82333' : '#545b62'};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const FileInput = styled.input`
  display: none;
`;

// const ErrorMessage = styled.div`
//   color: #dc3545;
//   background: #f8d7da;
//   border: 1px solid #f5c6cb;
//   border-radius: 4px;
//   padding: 0.75rem;
//   margin: 0.5rem 0;
//   text-align: center;
// `;

const StatusMessage = styled.div`
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.5rem 0;
  text-align: center;
`;

const CameraCapture = ({ onImageCapture, currentImage }) => {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [imagePreview, setImagePreview] = useState(currentImage ? URL.createObjectURL(currentImage) : null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  // const [isValidating, setIsValidating] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera on mobile
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos o usa la opción de subir archivo.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        
        setImagePreview(previewUrl);
        stopCamera();
        
        if (onImageCapture) {
          onImageCapture(file);
        }
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera, onImageCapture]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsValidating(true);
      setError(null);
      
      // Validar el archivo usando el servicio de validación
      await validateImageFile(file, {
        // Opciones personalizadas de validación
        maxSize: 8 * 1024 * 1024, // 8MB para permitir imágenes de alta calidad
        minDimensions: { width: 100, height: 100 } // Dimensiones mínimas para análisis
      });
      
      // Si la validación es exitosa, mostrar la vista previa
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Pasar el archivo al componente padre
      if (onImageCapture) {
        onImageCapture(file);
      }
    } catch (error) {
      // Manejar errores de validación
      if (error instanceof AppError) {
        setError(error);
      } else {
        setError(new AppError(
          'Error al procesar la imagen. Por favor, intenta con otra.',
          ErrorTypes.FILE,
          error
        ));
      }
    } finally {
      setIsValidating(false);
      // Resetear el input de archivo
      event.target.value = '';
    }
  }, [onImageCapture]);

  const clearPreview = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setError(null);
  }, [imagePreview]);

  const confirmImage = useCallback(() => {
    // Navigate to analysis page
    navigate('/analyze');
  }, [navigate]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [stopCamera, imagePreview]);

  return (
    <CameraCaptureContainer>
      {error && <ErrorDisplay error={error} />}
      
      {!imagePreview && !isCapturing && (
        <>
          <div className="text-center mb-4">
            <h2 className="text-lg mb-3">Analiza tus alimentos</h2>
            <p className="text-md mb-4">
              Toma una foto de tu comida o sube una imagen para obtener información nutricional al instante.
            </p>
          </div>
          <ButtonGroup>
            <Button primary onClick={startCamera}>
              <FaCamera />
              Tomar Foto
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <FaImage />
              Subir Imagen
            </Button>
          </ButtonGroup>
        </>
      )}

      {isCapturing && (
        <>
          <VideoContainer>
            <Video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
          </VideoContainer>
          <ButtonGroup>
            <Button primary onClick={capturePhoto}>
              <FaCamera />
              Capturar
            </Button>
            <Button danger onClick={stopCamera}>
              <FaTimes />
              Cancelar
            </Button>
          </ButtonGroup>
        </>
      )}

      {imagePreview && (
        <>
          <PreviewContainer>
            <PreviewImage src={imagePreview} alt="Vista previa" />
          </PreviewContainer>
          <StatusMessage>
            Imagen capturada correctamente. Puedes proceder con el análisis.
          </StatusMessage>
          <ButtonGroup>
            <Button primary onClick={confirmImage}>
              <FaCheck />
              Confirmar
            </Button>
            <Button onClick={clearPreview}>
              <FaTimes />
              Nueva Imagen
            </Button>
          </ButtonGroup>
        </>
      )}

      <Canvas ref={canvasRef} />
      <FileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
      />
    </CameraCaptureContainer>
  );
};

export default CameraCapture;