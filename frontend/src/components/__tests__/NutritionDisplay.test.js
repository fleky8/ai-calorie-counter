import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NutritionDisplay from '../NutritionDisplay';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart">Mocked Chart</div>
}));

describe('NutritionDisplay Component', () => {
  const mockNutritionData = {
    foodName: 'Manzana',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4,
    sugar: 19,
    sodium: 2,
    portion: '1 manzana mediana (182g)'
  };

  test('renders nutrition data correctly', () => {
    render(<NutritionDisplay nutritionData={mockNutritionData} />);
    
    expect(screen.getByText('Manzana')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Calorías totales')).toBeInTheDocument();
    expect(screen.getByText('1 manzana mediana (182g)')).toBeInTheDocument();
  });

  test('displays macronutrients with percentages', () => {
    render(<NutritionDisplay nutritionData={mockNutritionData} />);
    
    expect(screen.getByText('Proteínas')).toBeInTheDocument();
    expect(screen.getByText('Carbohidratos')).toBeInTheDocument();
    expect(screen.getByText('Grasas')).toBeInTheDocument();
    
    // Check for macronutrient values
    expect(screen.getByText(/0\.5g/)).toBeInTheDocument(); // Protein
    expect(screen.getByText(/25g/)).toBeInTheDocument(); // Carbs
    expect(screen.getByText(/0\.3g/)).toBeInTheDocument(); // Fat
  });

  test('displays additional nutrition details when available', () => {
    render(<NutritionDisplay nutritionData={mockNutritionData} />);
    
    expect(screen.getByText('4g')).toBeInTheDocument(); // Fiber
    expect(screen.getByText('Fibra')).toBeInTheDocument();
    
    expect(screen.getByText('19g')).toBeInTheDocument(); // Sugar
    expect(screen.getByText('Azúcares')).toBeInTheDocument();
    
    expect(screen.getByText('2mg')).toBeInTheDocument(); // Sodium
    expect(screen.getByText('Sodio')).toBeInTheDocument();
  });

  test('renders chart component', () => {
    render(<NutritionDisplay nutritionData={mockNutritionData} />);
    
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  test('handles missing optional nutrition data', () => {
    const minimalData = {
      foodName: 'Alimento simple',
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 2
    };

    render(<NutritionDisplay nutritionData={minimalData} />);
    
    expect(screen.getByText('Alimento simple')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/5.*g.*\(23%\)/)).toBeInTheDocument();
    expect(screen.getByText(/15.*g.*\(68%\)/)).toBeInTheDocument();
    expect(screen.getByText(/2.*g.*\(9%\)/)).toBeInTheDocument();
    
    // Should not display additional details section when values are 0 or missing
    expect(screen.queryByText('Fibra')).not.toBeInTheDocument();
    expect(screen.queryByText('Azúcares')).not.toBeInTheDocument();
    expect(screen.queryByText('Sodio')).not.toBeInTheDocument();
  });

  test('uses default values when nutrition data is incomplete', () => {
    const incompleteData = {
      foodName: 'Alimento incompleto'
    };

    render(<NutritionDisplay nutritionData={incompleteData} />);
    
    expect(screen.getByText('Alimento incompleto')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Default calories
    expect(screen.getByText('Calorías totales')).toBeInTheDocument();
  });

  test('renders default food name when not provided', () => {
    const dataWithoutName = {
      calories: 150,
      protein: 10,
      carbs: 20,
      fat: 5
    };

    render(<NutritionDisplay nutritionData={dataWithoutName} />);
    
    expect(screen.getByText('Alimento detectado')).toBeInTheDocument();
  });

  test('returns null when no nutrition data provided', () => {
    const { container } = render(<NutritionDisplay nutritionData={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('returns null when nutrition data is undefined', () => {
    const { container } = render(<NutritionDisplay />);
    
    expect(container.firstChild).toBeNull();
  });

  test('rounds calories to nearest integer', () => {
    const dataWithDecimalCalories = {
      foodName: 'Test Food',
      calories: 95.7,
      protein: 1,
      carbs: 20,
      fat: 1
    };

    render(<NutritionDisplay nutritionData={dataWithDecimalCalories} />);
    
    expect(screen.getByText('96')).toBeInTheDocument(); // Should be rounded
  });

  test('calculates and displays macronutrient percentages correctly', () => {
    const testData = {
      foodName: 'Test Food',
      calories: 200,
      protein: 10, // 10g
      carbs: 20,   // 20g  
      fat: 5       // 5g (changed to avoid duplicate percentages)
      // Total: 35g, so percentages should be 29%, 57%, 14%
    };

    render(<NutritionDisplay nutritionData={testData} />);
    
    expect(screen.getByText(/10.*g.*\(29%\)/)).toBeInTheDocument(); // Protein
    expect(screen.getByText(/20.*g.*\(57%\)/)).toBeInTheDocument(); // Carbs
    expect(screen.getByText(/5.*g.*\(14%\)/)).toBeInTheDocument(); // Fat
  });
});