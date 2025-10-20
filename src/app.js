const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./config/database');
const kommoRoutes = require('./routes/kommo');
const phrasesRoutes = require('./routes/phrases');
const funnelsRoutes = require('./routes/funnels');
const webhookRoutes = require('./routes/webhook');
const configRoutes = require('./routes/config');
const examplesRoutes = require('./routes/examples');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas
app.use('/api/kommo', kommoRoutes);
app.use('/api/phrases', phrasesRoutes);
app.use('/api/funnels', funnelsRoutes);
app.use('/webhook', webhookRoutes);
app.use('/', configRoutes);
app.use('/api/examples', examplesRoutes);

// Ruta principal con mensaje de confirmación
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Saberi funcionando',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    platform: 'Vercel'
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar base de datos y servidor
async function startServer() {
  try {
    await database.init();
    logger.info('Base de datos inicializada correctamente');
    
    app.listen(PORT, () => {
      logger.info(`Servidor ejecutándose en puerto ${PORT}`);
      logger.info(`Panel de configuración: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
