const express = require('express');
const router = express.Router();
const kommoService = require('../services/kommoService');
const database = require('../config/database');
const logger = require('../utils/logger');

// Obtener URL de autorización
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = kommoService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    logger.error('Error obteniendo URL de autorización:', error);
    res.status(500).json({ error: 'Error obteniendo URL de autorización' });
  }
});

// Callback de autorización
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      logger.error('Error en autorización:', error);
      return res.status(400).json({ error: 'Error en autorización' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Código de autorización no proporcionado' });
    }

    const tokenData = await kommoService.exchangeCodeForToken(code);
    
    // Guardar tokens en la base de datos
    await database.run(`
      INSERT OR REPLACE INTO kommo_config 
      (id, client_id, client_secret, access_token, refresh_token, expires_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      process.env.KOMMO_CLIENT_ID,
      process.env.KOMMO_CLIENT_SECRET,
      tokenData.access_token,
      tokenData.refresh_token,
      new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    ]);

    logger.info('Configuración de Kommo guardada correctamente');
    res.json({ 
      success: true, 
      message: 'Autorización completada correctamente',
      expiresIn: tokenData.expires_in
    });
  } catch (error) {
    logger.error('Error en callback de autorización:', error);
    res.status(500).json({ error: 'Error procesando autorización' });
  }
});

// Obtener estado de la conexión
router.get('/status', async (req, res) => {
  try {
    const config = await database.get('SELECT * FROM kommo_config WHERE id = 1');
    
    if (!config || !config.access_token) {
      return res.json({ 
        connected: false, 
        message: 'No hay conexión activa con Kommo' 
      });
    }

    // Verificar si el token está expirado
    const isExpired = new Date(config.expires_at) < new Date();
    
    res.json({
      connected: !isExpired,
      expiresAt: config.expires_at,
      message: isExpired ? 'Token expirado' : 'Conexión activa'
    });
  } catch (error) {
    logger.error('Error verificando estado:', error);
    res.status(500).json({ error: 'Error verificando estado de conexión' });
  }
});

// Obtener información de la cuenta
router.get('/account', async (req, res) => {
  try {
    const accountInfo = await kommoService.getAccount();
    res.json(accountInfo);
  } catch (error) {
    logger.error('Error obteniendo información de cuenta:', error);
    res.status(500).json({ error: 'Error obteniendo información de cuenta' });
  }
});

// Obtener leads
router.get('/leads', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const leads = await kommoService.getLeads({ limit, page });
    res.json(leads);
  } catch (error) {
    logger.error('Error obteniendo leads:', error);
    res.status(500).json({ error: 'Error obteniendo leads' });
  }
});

// Obtener un lead específico
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await kommoService.getLead(req.params.id);
    res.json(lead);
  } catch (error) {
    logger.error('Error obteniendo lead:', error);
    res.status(500).json({ error: 'Error obteniendo lead' });
  }
});

// Configurar webhook
router.post('/webhook', async (req, res) => {
  try {
    const { webhookUrl, events } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'URL del webhook es requerida' });
    }

    const webhook = await kommoService.setWebhook(webhookUrl, events);
    
    // Guardar configuración del webhook
    await database.run(`
      UPDATE kommo_config 
      SET webhook_secret = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `, [process.env.KOMMO_WEBHOOK_SECRET]);

    logger.info('Webhook configurado correctamente');
    res.json({ 
      success: true, 
      webhook,
      message: 'Webhook configurado correctamente' 
    });
  } catch (error) {
    logger.error('Error configurando webhook:', error);
    res.status(500).json({ error: 'Error configurando webhook' });
  }
});

// Obtener webhooks configurados
router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await kommoService.getWebhooks();
    res.json(webhooks);
  } catch (error) {
    logger.error('Error obteniendo webhooks:', error);
    res.status(500).json({ error: 'Error obteniendo webhooks' });
  }
});

module.exports = router;
