import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { uploadFile } from '../services/apiService';
import { saveAnalysis, getHistory } from '../services/storageService';

// Mock de los servicios
jest.mock('../services/apiService');
jest.mock('../services/storageService');

// Mock de react-router-dom para controlar la navegación en tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock de getUserMedia para tests de cámara
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }]
    }))
  }
});

// Datos de prueba para el análisis
const mockAnalysisResult = {
  success: true,
  data: {
    foodItems: [
      { name: 'Manzana', confidence: 0.95 }
    ],
    nutritionData: {
      totalCalories: 95,
      macronutrients: {
        proteins: 0.5,
        carbohydrates: 25,
        fats: 0.3
      },
      confidence: 0.9
    }
  }
};

// Helper para renderizar App con Router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Flujo completo de análisis de imagen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks para el flujo completo
    uploadFile.mockResolvedValue(mockAnalysisResult);
    saveAnalysis.mockReturnValue({ ...mockAnalysisResult, id: '123', date: new Date().toISOString() });
    getHistory.mockReturnValue([
      { ...mockAnalysisResult, id: '123', date: new Date().toISOString() }
    ]);
  });

  test('flujo completo: captura de imagen → análisis → visualización → historial', async () => {
    renderApp();
    
    // 1. Verificar que estamos en la pantalla de captura
    expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    
    // 2. Simular la captura de una imagen
    // Crear un archivo de imagen simulado
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Crear un objeto URL.createObjectURL simulado
    URL.createObjectURL = jest.fn(() => 'blob:test-url');
    URL.revokeObjectURL = jest.fn();
    
    // Simular la subida de archivo
    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);
    
    // 3. Verificar que se muestra la vista previa
    await waitFor(() => {
      expect(screen.getByText('Imagen capturada correctamente')).toBeInTheDocument();
    });
    
    // 4. Confirmar la imagen
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    // 5. Verificar que navegamos a la pantalla de análisis
    await waitFor(() => {
      expect(screen.getByText('Análisis de imagen')).toBeInTheDocument();
    });
    
    // 6. Iniciar el análisis
    const analyzeButton = screen.getByText('Analizar imagen');
    fireEvent.click(analyzeButton);
    
    // 7. Verificar que se muestra el estado de carga
    await waitFor(() => {
      expect(screen.getByText('Analizando imagen...')).toBeInTheDocument();
    });
    
    // 8. Verificar que se completa el análisis y se navega a resultados
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalled();
    });
    
    // 9. Verificar que se guarda en el historial
    await waitFor(() => {
      expect(saveAnalysis).toHaveBeenCalled();
    });
    
    // 10. Navegar al historial
    const historyLink = screen.getByText('📊 Historial');
    fireEvent.click(historyLink);
    
    // 11. Verificar que se muestra el historial
    await waitFor(() => {
      expect(screen.getByText('Historial de Análisis')).toBeInTheDocument();
    });
    
    // 12. Verificar que se muestra el análisis guardado
    await waitFor(() => {
      expect(getHistory).toHaveBeenCalled();
    });
  });
});