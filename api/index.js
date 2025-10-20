const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting más permisivo para Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

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

// Ruta de prueba para Kommo
app.get('/api/kommo/status', (req, res) => {
  res.json({
    connected: false,
    message: 'Configuración pendiente',
    platform: 'Vercel'
  });
});

// Ruta de prueba para frases
app.get('/api/phrases', (req, res) => {
  res.json({
    phrases: [],
    message: 'Sistema funcionando - Configuración pendiente',
    platform: 'Vercel'
  });
});

// Ruta de prueba para embudos
app.get('/api/funnels', (req, res) => {
  res.json({
    funnels: [],
    message: 'Sistema funcionando - Configuración pendiente',
    platform: 'Vercel'
  });
});

// Webhook de prueba
app.post('/webhook/kommo', (req, res) => {
  res.json({
    received: true,
    message: 'Webhook recibido correctamente',
    platform: 'Vercel',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Algo salió mal',
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

// Para Vercel, exportar la app directamente
module.exports = app;