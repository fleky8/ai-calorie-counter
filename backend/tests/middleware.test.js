const { notFound, errorHandler, validateImageFile } = require('../middleware');

describe('Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/test-url',
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200,
    };
    next = jest.fn();
  });

  describe('notFound middleware', () => {
    it('debería crear error 404 y llamar next', () => {
      notFound(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('errorHandler middleware', () => {
    it('debería manejar errores con status code personalizado', () => {
      const error = new Error('Test error');
      res.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error',
          status: 400,
        },
      });
    });

    it('debería usar status 500 por defecto', () => {
      const error = new Error('Test error');
      res.statusCode = 200; // Status OK, debería cambiar a 500

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateImageFile middleware', () => {
    it('debería fallar si no hay archivo', () => {
      validateImageFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'No se proporcionó ningún archivo de imagen',
          status: 400,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería fallar con tipo MIME inválido', () => {
      req.file = {
        mimetype: 'text/plain',
        size: 1000,
      };

      validateImageFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Formato de archivo no válido. Solo se permiten JPEG, PNG y WebP',
          status: 400,
        },
      });
    });

    it('debería fallar con archivo muy grande', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
      };

      validateImageFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
          status: 400,
        },
      });
    });

    it('debería pasar validación con archivo válido', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
      };

      validateImageFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});