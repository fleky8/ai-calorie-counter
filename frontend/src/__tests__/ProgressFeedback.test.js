import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressFeedback from '../components/ProgressFeedback';

describe('ProgressFeedback Component', () => {
  test('renders loading state correctly', () => {
    render(<ProgressFeedback status="loading" message="Procesando datos" />);
    
    expect(screen.getByText('Procesando datos')).toBeInTheDocument();
  });
  
  test('renders success state correctly', () => {
    render(<ProgressFeedback status="success" message="Operación exitosa" />);
    
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });
  
  test('renders error state correctly', () => {
    render(<ProgressFeedback status="error" message="Ha ocurrido un error" />);
    
    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument();
  });
  
  test('renders progress bar when progress is provided', () => {
    render(<ProgressFeedback status="loading" progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
  
  test('renders steps when provided', () => {
    const steps = ['Step 1', 'Step 2', 'Step 3'];
    render(
      <ProgressFeedback 
        status="loading" 
        steps={steps} 
        currentStep={1} 
      />
    );
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });
  
  test('renders subMessage when provided', () => {
    render(
      <ProgressFeedback 
        status="loading" 
        message="Processing" 
        subMessage="Please wait..." 
      />
    );
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });
  
  test('uses default message when no message is provided', () => {
    render(<ProgressFeedback status="loading" />);
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
    
    render(<ProgressFeedback status="success" />);
    expect(screen.getByText('¡Operación completada con éxito!')).toBeInTheDocument();
    
    render(<ProgressFeedback status="error" />);
    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument();
  });
});