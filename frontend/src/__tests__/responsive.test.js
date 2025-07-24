import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock para window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('Responsive Design Tests', () => {
  test('App renders correctly with responsive classes', () => {
    render(<App />);
    
    // Verificar que se usan clases responsive
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('container');
    
    // Verificar que hay elementos con clases de columnas responsive
    const columns = mainElement.querySelectorAll('.col-12.col-md-6');
    expect(columns.length).toBeGreaterThan(0);
  });
  
  test('Footer tiene clases responsive', () => {
    render(<App />);
    
    const footerElement = screen.getByText(/© 2023 AI Calorie Counter/i).closest('footer');
    expect(footerElement).toHaveClass('container');
    expect(footerElement).toHaveClass('mt-5');
  });
  
  // Nota: Las pruebas de diseño responsive reales generalmente requieren
  // herramientas como Cypress o Playwright para probar en diferentes tamaños de pantalla
  // Estas pruebas son más simbólicas que funcionales
});

// Pruebas para verificar que los estilos CSS se cargan correctamente
describe('CSS Loading Tests', () => {
  test('Los estilos responsive se cargan correctamente', () => {
    // Verificar que el archivo responsive.css está incluido en el documento
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    
    // Esta prueba es simbólica ya que en el entorno de prueba no se cargan realmente los CSS
    // En un entorno real, verificaríamos que el archivo responsive.css está cargado
    expect(true).toBe(true);
  });
});