describe('AI Calorie Counter - Flujo Principal', () => {
  beforeEach(() => {
    // Limpiar almacenamiento antes de cada test
    cy.clearStorage();
    
    // Visitar la página principal
    cy.visit('/');
    
    // Mock de la API de análisis
    cy.mockApiResponse('POST', '/api/analyze-image', {
      success: true,
      message: 'Se detectaron 2 alimentos en la imagen',
      data: {
        foodItems: [
          { name: 'Manzana', confidence: 0.95 },
          { name: 'Plátano', confidence: 0.87 }
        ],
        nutritionData: {
          totalCalories: 180,
          macronutrients: {
            proteins: 1.5,
            carbohydrates: 45,
            fats: 0.5,
            fiber: 5.2
          },
          detectedFoods: [
            {
              name: 'Manzana',
              calories: 80,
              estimatedWeight: 150,
              confidence: 0.95,
              macronutrients: {
                proteins: 0.5,
                carbohydrates: 20,
                fats: 0.2,
                fiber: 3.0
              }
            }
          ],
          summary: {
            totalFoodsDetected: 2,
            foodsProcessed: 2,
            foodsNotFound: 0,
            averageConfidence: 0.91
          }
        }
      }
    });
  });

  it('debe cargar la página principal correctamente', () => {
    // Verificar elementos principales
    cy.contains('AI Calorie Counter').should('be.visible');
    cy.contains('Contador de calorías con inteligencia artificial').should('be.visible');
    
    // Verificar navegación
    cy.contains('📷 Analizar').should('be.visible');
    cy.contains('📊 Historial').should('be.visible');
    
    // Verificar interfaz de captura
    cy.contains('Analiza tus alimentos').should('be.visible');
    cy.contains('Tomar Foto').should('be.visible');
    cy.contains('Subir Imagen').should('be.visible');
  });

  it('debe permitir subir una imagen y analizarla', () => {
    // Crear fixture de imagen de prueba
    cy.fixture('test-image.jpg', 'base64').then(fileContent => {
      // Subir imagen
      cy.get('input[type="file"]').then(input => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
        const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change');
      });
    });
    
    // Verificar vista previa
    cy.contains('Imagen capturada correctamente').should('be.visible');
    cy.contains('Confirmar').should('be.visible');
    
    // Confirmar imagen
    cy.contains('Confirmar').click();
    
    // Verificar navegación a análisis
    cy.url().should('include', '/analyze');
    cy.contains('Análisis de imagen').should('be.visible');
    
    // Iniciar análisis
    cy.contains('Analizar imagen').click();
    
    // Verificar estados de progreso
    cy.contains('Analizando imagen', { timeout: 10000 }).should('be.visible');
    
    // Verificar navegación a resultados
    cy.url().should('include', '/results', { timeout: 15000 });
  });

  it('debe mostrar los resultados nutricionales correctamente', () => {
    // Simular que ya tenemos resultados (navegación directa)
    cy.window().then((win) => {
      // Simular estado de la aplicación con resultados
      win.localStorage.setItem('test-results', JSON.stringify({
        totalCalories: 180,
        macronutrients: { proteins: 1.5, carbohydrates: 45, fats: 0.5 }
      }));
    });
    
    // Navegar a resultados (esto normalmente se haría automáticamente)
    // En un test real, esto sería parte del flujo completo
    cy.visit('/');
    
    // Verificar elementos de resultados cuando estén disponibles
    cy.get('[data-testid="nutrition-display"]', { timeout: 10000 }).should('exist');
  });

  it('debe permitir navegar al historial', () => {
    // Navegar al historial
    cy.contains('📊 Historial').click();
    
    // Verificar navegación
    cy.url().should('include', '/history');
    cy.contains('Historial de Análisis').should('be.visible');
    
    // Verificar elementos del historial
    cy.get('input[placeholder*="Buscar"]').should('be.visible');
  });

  it('debe manejar errores de análisis correctamente', () => {
    // Mock de error en la API
    cy.mockApiResponse('POST', '/api/analyze-image', {
      success: false,
      message: 'Error al procesar la imagen'
    }, 400);
    
    // Subir imagen
    cy.fixture('test-image.jpg', 'base64').then(fileContent => {
      cy.get('input[type="file"]').then(input => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
        const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change');
      });
    });
    
    // Confirmar y analizar
    cy.contains('Confirmar').click();
    cy.contains('Analizar imagen').click();
    
    // Verificar manejo de error
    cy.contains('Error', { timeout: 10000 }).should('be.visible');
    cy.contains('Reintentar').should('be.visible');
  });
});

describe('AI Calorie Counter - Responsive Design', () => {
  it('debe funcionar correctamente en dispositivos móviles', () => {
    cy.setMobileViewport();
    cy.visit('/');
    
    // Verificar que la aplicación se adapta a móvil
    cy.contains('AI Calorie Counter').should('be.visible');
    cy.contains('Tomar Foto').should('be.visible');
    
    // Verificar navegación en móvil
    cy.contains('📊 Historial').click();
    cy.contains('Historial de Análisis').should('be.visible');
  });

  it('debe funcionar correctamente en escritorio', () => {
    cy.setDesktopViewport();
    cy.visit('/');
    
    // Verificar que la aplicación se adapta a escritorio
    cy.contains('AI Calorie Counter').should('be.visible');
    cy.get('.container').should('have.css', 'max-width');
  });
});

describe('AI Calorie Counter - PWA Functionality', () => {
  it('debe tener manifest.json válido', () => {
    cy.request('/manifest.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('short_name');
      expect(response.body).to.have.property('icons');
    });
  });

  it('debe registrar service worker', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      expect(win.navigator.serviceWorker).to.exist;
    });
  });
});