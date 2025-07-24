// Middleware para manejo de errores 404
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware para manejo de errores generales
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`❌ Error ${statusCode}:`, err.message);
  
  res.status(statusCode).json({
    error: {
      message: err.message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Middleware para validar archivos de imagen
const validateImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: 'No se proporcionó ningún archivo de imagen',
        status: 400,
      },
    });
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: {
        message: 'Formato de archivo no válido. Solo se permiten JPEG, PNG y WebP',
        status: 400,
      },
    });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      error: {
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
        status: 400,
      },
    });
  }

  next();
};

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };
    
    if (res.statusCode >= 400) {
      console.error('📝 Request Error:', logData);
    } else {
      console.log('📝 Request:', logData);
    }
  });
  
  next();
};

module.exports = {
  notFound,
  errorHandler,
  validateImageFile,
  requestLogger,
};