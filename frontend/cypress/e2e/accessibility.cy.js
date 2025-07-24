describe('AI Calorie Counter - Accesibilidad', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('debe cumplir con estándares de accesibilidad en la página principal', () => {
    cy.checkA11y();
  });

  it('debe tener navegación accesible por teclado', () => {
    // Verificar que se puede navegar con Tab
    cy.get('body').tab();
    cy.focused().should('contain', 'Analizar');
    
    cy.focused().tab();
    cy.focused().should('contain', 'Historial');
    
    // Verificar que se puede activar con Enter
    cy.focused().type('{enter}');
    cy.url().should('include', '/history');
  });

  it('debe tener etiquetas ARIA apropiadas', () => {
    // Verificar botones principales
    cy.contains('Tomar Foto').should('have.attr', 'role', 'button');
    cy.contains('Subir Imagen').should('have.attr', 'role', 'button');
    
    // Verificar input de archivo
    cy.get('input[type="file"]').should('have.attr', 'accept', 'image/*');
  });

  it('debe tener contraste de colores adecuado', () => {
    // Verificar contraste en elementos principales
    cy.get('h1').should('have.css', 'color');
    cy.get('.btn-primary').should('have.css', 'background-color');
    
    // Ejecutar verificación de contraste
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  it('debe ser accesible con lectores de pantalla', () => {
    // Verificar que los elementos tienen texto alternativo apropiado
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
    
    // Verificar que los botones tienen texto descriptivo
    cy.get('button').each(($button) => {
      cy.wrap($button).should('not.be.empty');
    });
  });

  it('debe manejar focus correctamente', () => {
    // Verificar que el focus es visible
    cy.get('button').first().focus();
    cy.focused().should('have.css', 'outline');
    
    // Verificar que el focus se mantiene durante la navegación
    cy.contains('📊 Historial').click();
    cy.focused().should('exist');
  });
});