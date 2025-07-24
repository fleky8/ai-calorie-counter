import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUpload, FaCheck, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { useImageValidation } from '../hooks/useValidation';
import ValidationErrorDisplay from './ValidationErrorDisplay';

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const DropZone = styled.div.attrs(props => ({
  isDragOver: props.isDragOver ? 'true' : undefined,
  hasError: props.hasError ? 'true' : undefined
}))`
  border: 2px dashed ${props => 
    props.hasError === 'true' ? '#dc3545' : 
    props.isDragOver === 'true' ? '#007bff' : '#dee2e6'
  };
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: ${props => 
    props.hasError === 'true' ? '#f8d7da' : 
    props.isDragOver === 'true' ? '#e3f2fd' : '#f8f9fa'
  };
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007bff;
    background: #e3f2fd;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: #6c757d;
  margin-bottom: 1rem;
`;

const UploadText = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
`;

const UploadSubtext = styled.p`
  margin: 0.5rem 0 0 0;
  color: #adb5bd;
  font-size: 0.875rem;
`;

const FileInput = styled.input`
  display: none;
`;

const ValidationStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
  border-left: 3px solid ${props => props.color || '#6c757d'};
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const RateLimitInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  color: #856404;
  font-size: 0.875rem;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #6c757d;
`;

/**
 * Componente de carga de imágenes con validaciones de seguridad completas
 */
const SecureImageUpload = ({ onImageUpload, maxFileSize, allowedTypes }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const {
    isValidating,
    validationError,
    // validationHistory,
    validateImage,
    clearValidationError,
    getValidationStats,
    getRateLimitStatus
  } = useImageValidation({
    onValidationStart: (file) => {
      console.log('Iniciando validación de:', file.name);
    },
    onValidationSuccess: (file) => {
      console.log('Validación exitosa:', file.name);
      setUploadedFile(file);
      if (onImageUpload) {
        onImageUpload(file);
      }
    },
    onValidationError: (error) => {
      console.error('Error de validación:', error.message);
    }
  });

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    try {
      clearValidationError();
      
      const validationOptions = {};
      if (maxFileSize) validationOptions.maxSize = maxFileSize;
      if (allowedTypes) validationOptions.allowedTypes = allowedTypes;
      
      await validateImage(file, validationOptions);
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
    event.target.value = ''; // Reset input
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const stats = getValidationStats();
  const rateLimitStatus = getRateLimitStatus();

  return (
    <UploadContainer>
      <div style={{ position: 'relative' }}>
        <DropZone
          isDragOver={isDragOver}
          hasError={!!validationError}
          onClick={() => document.getElementById('file-input').click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <UploadIcon>
            {isValidating ? <FaClock /> : 
             uploadedFile ? <FaCheck /> : 
             validationError ? <FaExclamationTriangle /> : 
             <FaUpload />}
          </UploadIcon>
          
          <UploadText>
            {isValidating ? 'Validando archivo...' :
             uploadedFile ? `Archivo cargado: ${uploadedFile.name}` :
             'Arrastra una imagen aquí o haz clic para seleccionar'}
          </UploadText>
          
          <UploadSubtext>
            Formatos soportados: JPEG, PNG, WebP (máx. 8MB)
          </UploadSubtext>
          
          {isValidating && (
            <LoadingOverlay>
              Validando archivo...
            </LoadingOverlay>
          )}
        </DropZone>
        
        <FileInput
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Mostrar error de validación */}
      {validationError && (
        <ValidationErrorDisplay
          error={validationError}
          onDismiss={clearValidationError}
          showDetails={process?.env?.NODE_ENV === 'development'}
        />
      )}

      {/* Mostrar información de rate limiting */}
      {!rateLimitStatus.canValidate && (
        <RateLimitInfo>
          <FaClock />
          Espera {rateLimitStatus.remainingTime} segundos antes de subir otra imagen
        </RateLimitInfo>
      )}

      {/* Estadísticas de validación */}
      {stats.total > 0 && (
        <ValidationStats>
          <StatCard color="#28a745">
            <StatValue>{stats.successful}</StatValue>
            <StatLabel>Exitosas</StatLabel>
          </StatCard>
          
          <StatCard color="#dc3545">
            <StatValue>{stats.failed}</StatValue>
            <StatLabel>Fallidas</StatLabel>
          </StatCard>
          
          <StatCard color="#007bff">
            <StatValue>{stats.successRate.toFixed(0)}%</StatValue>
            <StatLabel>Tasa de éxito</StatLabel>
          </StatCard>
          
          <StatCard color="#6c757d">
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total</StatLabel>
          </StatCard>
        </ValidationStats>
      )}
    </UploadContainer>
  );
};

export default SecureImageUpload;