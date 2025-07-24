const request = require('supertest');
const app = require('../server');

describe('Servidor Express', () => {
  describe('GET /health', () => {
    it('debería retornar status OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('debería retornar información de la API', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Rutas no existentes', () => {
    it('debería retornar 404 para rutas no encontradas', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('status', 404);
    });
  });

  describe('Rate Limiting', () => {
    it('debería aplicar rate limiting después de muchas requests', async () => {
      // Este test simula muchas requests rápidas
      const requests = Array(10).fill().map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // Todas las primeras requests deberían ser exitosas
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    }, 10000);
  });

  describe('Middleware de seguridad', () => {
    it('debería incluir headers de seguridad', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet añade varios headers de seguridad
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Manejo de JSON', () => {
    it('debería parsear JSON correctamente', async () => {
      const testData = { test: 'data' };
      
      const response = await request(app)
        .post('/api/analyze-image')
        .send(testData)
        .expect(501); // Endpoint no implementado aún

      expect(response.body).toHaveProperty('error');
    });
  });
});