const {
  validateImageBuffer,
  formatFileSize,
  sanitizeFilename,
  generateAnalysisId,
  validateGoogleCloudConfig,
  createErrorResponse,
  createSuccessResponse,
} = require('../utils');

describe('Utils', () => {
  describe('validateImageBuffer', () => {
    it('debería validar buffer PNG válido', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = validateImageBuffer(pngBuffer);
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('png');
    });

    it('debería validar buffer JPEG válido', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const result = validateImageBuffer(jpegBuffer);
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('debería rechazar buffer vacío', () => {
      const result = validateImageBuffer(Buffer.alloc(0));
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vacío');
    });

    it('debería rechazar formato no reconocido', () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = validateImageBuffer(invalidBuffer);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no reconocido');
    });
  });

  describe('formatFileSize', () => {
    it('debería formatear bytes correctamente', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('debería manejar tamaños decimales', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('sanitizeFilename', () => {
    it('debería sanitizar caracteres especiales', () => {
      expect(sanitizeFilename('file@#$%name.jpg')).toBe('file____name.jpg');
      expect(sanitizeFilename('my file (1).png')).toBe('my_file__1_.png');
    });

    it('debería manejar filename vacío', () => {
      expect(sanitizeFilename('')).toBe('unknown');
      expect(sanitizeFilename(null)).toBe('unknown');
    });

    it('debería convertir a minúsculas', () => {
      expect(sanitizeFilename('MyFile.JPG')).toBe('myfile.jpg');
    });
  });

  describe('generateAnalysisId', () => {
    it('debería generar IDs únicos', () => {
      const id1 = generateAnalysisId();
      const id2 = generateAnalysisId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^analysis_\d+_[a-z0-9]+$/);
    });
  });

  describe('validateGoogleCloudConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('debería validar configuración completa', () => {
      process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project-123';
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      
      const result = validateGoogleCloudConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config.projectId).toBe('***-123');
    });

    it('debería detectar configuración faltante', () => {
      delete process.env.GOOGLE_CLOUD_PROJECT_ID;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      const result = validateGoogleCloudConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('createErrorResponse', () => {
    it('debería crear respuesta de error estándar', () => {
      const response = createErrorResponse('Test error', 400, 'Additional details');
      
      expect(response.error.message).toBe('Test error');
      expect(response.error.status).toBe(400);
      expect(response.error.details).toBe('Additional details');
      expect(response.error.timestamp).toBeDefined();
    });

    it('debería usar valores por defecto', () => {
      const response = createErrorResponse('Test error');
      
      expect(response.error.status).toBe(500);
      expect(response.error.details).toBeUndefined();
    });
  });

  describe('createSuccessResponse', () => {
    it('debería crear respuesta de éxito estándar', () => {
      const data = { test: 'data' };
      const response = createSuccessResponse(data, 'Custom message');
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Custom message');
      expect(response.data).toBe(data);
      expect(response.timestamp).toBeDefined();
    });

    it('debería usar mensaje por defecto', () => {
      const response = createSuccessResponse({ test: 'data' });
      
      expect(response.message).toBe('Operación exitosa');
    });
  });
});