const multer = require('multer');
const config = require('../config');

// Configuración de almacenamiento en memoria (temporal)
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1, // Solo un archivo por request
  },
});

// Middleware para manejar errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Error al procesar el archivo';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'El archivo es demasiado grande. Tamaño máximo: 5MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Solo se permite un archivo por vez';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de archivo inesperado';
        break;
      default:
        message = `Error de archivo: ${error.message}`;
    }
    
    return res.status(400).json({
      error: {
        message,
        status: 400,
        code: error.code,
      },
    });
  }
  
  if (error.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({
      error: {
        message: 'Formato de archivo no válido. Solo se permiten JPEG, PNG y WebP',
        status: 400,
      },
    });
  }
  
  next(error);
};

module.exports = {
  upload: upload.single('image'),
  handleMulterError,
};