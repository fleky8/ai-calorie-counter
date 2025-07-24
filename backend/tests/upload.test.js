const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');

describe('Upload Middleware', () => {
  // Crear imagen de prueba simple (1x1 pixel PNG)
  const createTestImage = () => {
    // PNG de 1x1 pixel transparente
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
  };

  describe('POST /api/analyze-image', () => {
    it('debería rechazar request sin archivo', async () => {
      const response = await request(app)
        .post('/api/analyze-image')
        .expect(400);

      expect(response.body.error.message).toContain('No se proporcionó ningún archivo');
    });

    it('debería rechazar archivo con tipo MIME inválido', async () => {
      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', Buffer.from('fake text'), 'test.txt')
        .expect(400);

      expect(response.body.error.message).toContain('Formato de archivo no válido');
    });

    it('debería aceptar imagen PNG válida', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', testImage, 'test.png')
        .expect(400); // 400 porque Google Vision API no está configurada en tests

      // Debería pasar la validación de archivo pero fallar en el procesamiento
      expect(response.body.error.message).not.toContain('Formato de archivo no válido');
    });

    it('debería rechazar archivo muy grande', async () => {
      // Crear buffer de 6MB (mayor al límite de 5MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
      
      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', largeBuffer, 'large.png')
        .expect(400);

      expect(response.body.error.message).toContain('demasiado grande');
    });

    it('debería rechazar múltiples archivos', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', testImage, 'test1.png')
        .attach('image', testImage, 'test2.png')
        .expect(400);

      expect(response.body.error.message).toContain('Solo se permite un archivo');
    });

    it('debería manejar campo de archivo incorrecto', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/analyze-image')
        .attach('wrongField', testImage, 'test.png')
        .expect(400);

      expect(response.body.error.message).toContain('Campo de archivo inesperado');
    });
  });

  describe('Validación de tipos MIME', () => {
    const testCases = [
      { mimetype: 'image/jpeg', filename: 'test.jpg', shouldPass: true },
      { mimetype: 'image/png', filename: 'test.png', shouldPass: true },
      { mimetype: 'image/webp', filename: 'test.webp', shouldPass: true },
      { mimetype: 'image/gif', filename: 'test.gif', shouldPass: false },
      { mimetype: 'text/plain', filename: 'test.txt', shouldPass: false },
      { mimetype: 'application/pdf', filename: 'test.pdf', shouldPass: false },
    ];

    testCases.forEach(({ mimetype, filename, shouldPass }) => {
      it(`debería ${shouldPass ? 'aceptar' : 'rechazar'} ${mimetype}`, async () => {
        const testImage = createTestImage();
        
        const response = await request(app)
          .post('/api/analyze-image')
          .attach('image', testImage, filename);

        if (shouldPass) {
          // Debería pasar validación pero fallar en procesamiento (sin Google Vision configurada)
          expect(response.status).not.toBe(400);
        } else {
          expect(response.status).toBe(400);
          expect(response.body.error.message).toContain('Formato de archivo no válido');
        }
      });
    });
  });
});