describe('AI Calorie Counter - Rendimiento', () => {
  it('debe cargar la página principal en tiempo razonable', () => {
    const start = Date.now();
    
    cy.visit('/');
    
    // Verificar que la página carga en menos de 3 segundos
    cy.contains('AI Calorie Counter').should('be.visible').then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3000);
    });
  });

  it('debe tener métricas de Web Vitals aceptables', () => {
    cy.visit('/');
    
    // Verificar Core Web Vitals usando Performance API
    cy.window().then((win) => {
      // Verificar que Performance API está disponible
      expect(win.performance).to.exist;
      
      // Obtener métricas de navegación
      const navigation = win.performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        // Verificar tiempo de carga DOM
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        expect(domContentLoaded).to.be.lessThan(1500);
        
        // Verificar tiempo total de carga
        const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
        expect(loadComplete).to.be.lessThan(2000);
      }
    });
  });

  it('debe manejar lazy loading correctamente', () => {
    cy.visit('/');
    
    // Verificar que los componentes lazy se cargan solo cuando son necesarios
    cy.contains('📊 Historial').click();
    
    // Verificar que el componente se carga rápidamente
    cy.contains('Historial de Análisis', { timeout: 2000 }).should('be.visible');
  });

  it('debe optimizar el tamaño de las imágenes', () => {
    cy.visit('/');
    
    // Verificar que las imágenes no son excesivamente grandes
    cy.get('img').each(($img) => {
      cy.request($img.attr('src')).then((response) => {
        // Verificar que las imágenes son menores a 1MB
        expect(response.headers['content-length']).to.be.lessThan(1024 * 1024);
      });
    });
  });

  it('debe tener un bundle size razonable', () => {
    cy.visit('/');
    
    // Verificar recursos cargados
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource');
      
      // Verificar que no hay demasiados recursos JS
      const jsResources = resources.filter(r => r.name.includes('.js'));
      expect(jsResources.length).to.be.lessThan(10);
      
      // Verificar tamaño total de JS
      const totalJsSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
      
      // Verificar que el JS total es menor a 2MB
      expect(totalJsSize).to.be.lessThan(2 * 1024 * 1024);
    });
  });
});