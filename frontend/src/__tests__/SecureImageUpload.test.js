import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecureImageUpload from '../components/SecureImageUpload';
import * as useValidationHook from '../hooks/useValidation';

// Mock del hook useImageValidation
const mockUseImageValidation = {
  isValidating: false,
  validationError: null,
  validationHistory: [],
  validateImage: jest.fn(),
  clearValidationError: jest.fn(),
  getValidationStats: jest.fn(() => ({
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0
  })),
  getRateLimitStatus: jest.fn(() => ({
    canValidate: true,
    remainingTime: 0
  }))
};

jest.mock('../hooks/useValidation', () => ({
  useImageValidation: jest.fn()
}));

describe('SecureImageUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the mock to return our mock object
    useValidationHook.useImageValidation.mockReturnValue(mockUseImageValidation);
    
    // Reset mock values
    mockUseImageValidation.isValidating = false;
    mockUseImageValidation.validationError = null;
    mockUseImageValidation.validationHistory = [];
    
    mockUseImageValidation.getValidationStats.mockReturnValue({
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    });
    
    mockUseImageValidation.getRateLimitStatus.mockReturnValue({
      canValidate: true,
      remainingTime: 0
    });
  });

  test('renderiza correctamente el estado inicial', () => {
    render(<SecureImageUpload />);
    
    expect(screen.getByText('Arrastra una imagen aquí o haz clic para seleccionar')).toBeInTheDocument();
    expect(screen.getByText('Formatos soportados: JPEG, PNG, WebP (máx. 8MB)')).toBeInTheDocument();
  });

  test('muestra estado de carga durante validación', () => {
    mockUseImageValidation.isValidating = true;
    
    render(<SecureImageUpload />);
    
    expect(screen.getByText('Validando archivo...')).toBeInTheDocument();
  });

  test('maneja selección de archivo correctamente', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const onImageUpload = jest.fn();
    
    render(<SecureImageUpload onImageUpload={onImageUpload} />);
    
    const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(mockUseImageValidation.validateImage).toHaveBeenCalledWith(mockFile, {});
    });
  });

  test('muestra error de validación', () => {
    const mockError = {
      getUserMessage: () => 'Archivo demasiado grande',
      getRecommendedAction: () => 'Reduce el tamaño del archivo',
      type: 'VALIDATION'
    };
    
    mockUseImageValidation.validationError = mockError;
    
    render(<SecureImageUpload />);
    
    expect(screen.getByText('Archivo demasiado grande')).toBeInTheDocument();
  });

  test('muestra información de rate limiting', () => {
    mockUseImageValidation.getRateLimitStatus.mockReturnValue({
      canValidate: false,
      remainingTime: 30
    });
    
    render(<SecureImageUpload />);
    
    expect(screen.getByText('Espera 30 segundos antes de subir otra imagen')).toBeInTheDocument();
  });

  test('muestra estadísticas de validación', () => {
    mockUseImageValidation.getValidationStats.mockReturnValue({
      total: 10,
      successful: 8,
      failed: 2,
      successRate: 80
    });
    
    render(<SecureImageUpload />);
    
    expect(screen.getByText('8')).toBeInTheDocument(); // Exitosas
    expect(screen.getByText('2')).toBeInTheDocument(); // Fallidas
    expect(screen.getByText('80%')).toBeInTheDocument(); // Tasa de éxito
    expect(screen.getByText('10')).toBeInTheDocument(); // Total
  });

  test('permite configurar opciones de validación personalizadas', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png'];
    
    render(
      <SecureImageUpload 
        maxFileSize={maxFileSize}
        allowedTypes={allowedTypes}
      />
    );
    
    const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(mockUseImageValidation.validateImage).toHaveBeenCalledWith(mockFile, {
        maxSize: maxFileSize,
        allowedTypes: allowedTypes
      });
    });
  });

  test('maneja drag and drop correctamente', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<SecureImageUpload />);
    
    const dropZone = screen.getByRole('button');
    
    // Simular drag over
    fireEvent.dragOver(dropZone);
    
    // Simular drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile]
      }
    });
    
    await waitFor(() => {
      expect(mockUseImageValidation.validateImage).toHaveBeenCalledWith(mockFile, {});
    });
  });

  test('limpia error de validación al hacer clic en cerrar', () => {
    const mockError = {
      getUserMessage: () => 'Archivo demasiado grande',
      getRecommendedAction: () => 'Reduce el tamaño del archivo',
      type: 'VALIDATION'
    };
    
    mockUseImageValidation.validationError = mockError;
    
    render(<SecureImageUpload />);
    
    // Buscar el botón de cerrar en el error display
    const closeButton = screen.getByTitle('Cerrar');
    fireEvent.click(closeButton);
    
    expect(mockUseImageValidation.clearValidationError).toHaveBeenCalled();
  });

  test('muestra archivo cargado exitosamente', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simular que se ha cargado un archivo exitosamente
    const { rerender } = render(<SecureImageUpload />);
    
    // Simular el callback de éxito
    const onValidationSuccess = useValidationHook.useImageValidation.mock.calls[0][0].onValidationSuccess;
    onValidationSuccess(mockFile);
    
    rerender(<SecureImageUpload />);
    
    // Verificar que se muestra el nombre del archivo
    expect(screen.getByText(`Archivo cargado: ${mockFile.name}`)).toBeInTheDocument();
  });
});