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

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting más permisivo para Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por ventana (más permisivo para Vercel)
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Ruta principal con mensaje de confirmación
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Saberi funcionando',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    platform: 'Vercel',
    endpoints: {
      health: '/health',
      kommo: '/api/kommo',
      phrases: '/api/phrases',
      funnels: '/api/funnels',
      webhook: '/webhook',
      config: '/config'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Vercel'
  });
});

// Rutas API
app.use('/api/kommo', kommoRoutes);
app.use('/api/phrases', phrasesRoutes);
app.use('/api/funnels', funnelsRoutes);
app.use('/webhook', webhookRoutes);
app.use('/config', configRoutes);
app.use('/api/examples', examplesRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    platform: 'Vercel'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: 'Backend Saberi funcionando - Revisa la documentación de la API',
    availableEndpoints: {
      health: '/health',
      kommo: '/api/kommo',
      phrases: '/api/phrases',
      funnels: '/api/funnels',
      webhook: '/webhook',
      config: '/config'
    },
    platform: 'Vercel'
  });
});

// Inicializar base de datos (solo si no está en Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  async function startServer() {
    try {
      await database.init();
      logger.info('Base de datos inicializada correctamente');
      
      const PORT = process.env.PORT || 3000;
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
}

// Para Vercel, exportar la app directamente
module.exports = app;
