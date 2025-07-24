import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import CameraCapture from '../components/CameraCapture';
import ImageAnalysis from '../components/ImageAnalysis';
import NutritionDisplay from '../components/NutritionDisplay';
import HistoryView from '../components/HistoryView';
import ProgressFeedback from '../components/ProgressFeedback';

// Extender expect con toHaveNoViolations
expect.extend(toHaveNoViolations);

// Mock de los servicios
jest.mock('../services/apiService');
jest.mock('../services/storageService');

// Mock de react-router-dom para controlar la navegación en tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

describe('Accessibility Tests', () => {
  it('App should not have accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('CameraCapture should not have accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <CameraCapture onImageCapture={() => {}} />
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('ImageAnalysis should not have accessibility violations', async () => {
    const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    const { container } = render(
      <BrowserRouter>
        <ImageAnalysis 
          imageFile={mockFile}
          onAnalysisStart={() => {}}
          onAnalysisComplete={() => {}}
        />
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('NutritionDisplay should not have accessibility violations', async () => {
    const mockData = {
      foodName: 'Manzana',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4.4,
      confidence: 0.9
    };
    
    const { container } = render(
      <BrowserRouter>
        <NutritionDisplay nutritionData={mockData} onNewAnalysis={() => {}} />
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('ProgressFeedback should not have accessibility violations', async () => {
    const { container } = render(
      <ProgressFeedback 
        status="loading"
        message="Procesando datos"
        progress={50}
        steps={['Paso 1', 'Paso 2', 'Paso 3']}
        currentStep={1}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});