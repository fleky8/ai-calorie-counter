import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageAnalysis from '../ImageAnalysis';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { calories: 250 }, status: 200 }))
}));

const axios = require('axios');

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-image-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageAnalysis Component', () => {
  const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with image preview', () => {
    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockImage);
    expect(screen.getByAltText('Imagen para analizar')).toBeInTheDocument();
    expect(screen.getByText('Analizar imagen')).toBeInTheDocument();
  });

  test('shows loading state during analysis', async () => {
    // Mock axios to delay response
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => {
      resolve({ data: { calories: 250 }, status: 200 });
    }, 100)));

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    expect(screen.getByText('Analizando imagen...')).toBeInTheDocument();
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Análisis completado con éxito')).toBeInTheDocument();
    });
  });

  test('handles successful analysis', async () => {
    const mockResponse = { data: { calories: 250, protein: 10 }, status: 200 };
    axios.post.mockResolvedValue(mockResponse);

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Análisis completado con éxito')).toBeInTheDocument();
    });

    expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockResponse.data);
  });

  test('handles server error response', async () => {
    const errorMessage = 'No se pudo identificar comida en la imagen';
    axios.post.mockRejectedValue({
      response: {
        data: { message: errorMessage },
        status: 400
      }
    });

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByText('Reintentar análisis')).toBeInTheDocument();
  });

  test('handles network error', async () => {
    axios.post.mockRejectedValue({
      request: {},
      message: 'Network Error'
    });

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.getByText('No se pudo conectar con el servidor. Verifica tu conexión a internet.')).toBeInTheDocument();
    });
  });

  test('handles other errors', async () => {
    const errorMessage = 'Something went wrong';
    axios.post.mockRejectedValue(new Error(errorMessage));

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  test('handles retry after error', async () => {
    // First request fails
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Error' },
        status: 500
      }
    });

    // Second request succeeds
    const mockResponse = { data: { calories: 250 }, status: 200 };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(<ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    // First attempt
    const analyzeButton = screen.getByText('Analizar imagen');
    
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
    });

    // Retry
    const retryButton = screen.getByText('Reintentar análisis');
    
    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Análisis completado con éxito')).toBeInTheDocument();
    });

    expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockResponse.data);
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  test('cleans up image URL on unmount', () => {
    const { unmount } = render(
      <ImageAnalysis image={mockImage} onAnalysisComplete={mockOnAnalysisComplete} />
    );
    
    unmount();
    
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-image-url');
  });

  test('handles missing image prop', () => {
    render(<ImageAnalysis onAnalysisComplete={mockOnAnalysisComplete} />);
    
    expect(screen.queryByAltText('Imagen para analizar')).not.toBeInTheDocument();
    
    const analyzeButton = screen.getByText('Analizar imagen');
    expect(analyzeButton).toBeDisabled();
  });
});