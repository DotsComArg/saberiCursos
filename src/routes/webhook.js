const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

// Middleware para verificar la firma del webhook de Kommo
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-kommo-signature'];
  const webhookSecret = process.env.KOMMO_WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    logger.warn('Webhook sin firma o sin secret configurado');
    return next(); // Continuar sin verificación en desarrollo
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Firma de webhook inválida');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  next();
};

// Servicio para procesar leads
class LeadProcessor {
  constructor() {
    this.processedLeads = new Set(); // Para evitar procesar duplicados
  }

  // Buscar frase que coincida con el contenido del lead
  async findMatchingPhrase(leadData) {
    try {
      // Extraer texto del lead (nombre, comentarios, etc.)
      const searchText = this.extractTextFromLead(leadData);
      
      if (!searchText) {
        return null;
      }

      // Buscar frases activas que coincidan
      const phrases = await database.all(`
        SELECT lp.*, f.name as funnel_name, f.webhook_url
        FROM lead_phrases lp 
        LEFT JOIN funnels f ON lp.funnel_id = f.id 
        WHERE lp.is_active = 1 AND f.is_active = 1
        ORDER BY lp.created_at DESC
      `);

      // Buscar coincidencias (case insensitive)
      const lowerSearchText = searchText.toLowerCase();
      
      for (const phrase of phrases) {
        if (lowerSearchText.includes(phrase.phrase.toLowerCase())) {
          logger.info(`Frase encontrada: "${phrase.phrase}" para lead ${leadData.id}`);
          return phrase;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error buscando frase coincidente:', error);
      return null;
    }
  }

  // Extraer texto relevante del lead
  extractTextFromLead(leadData) {
    const textParts = [];
    
    // Información básica del lead
    if (leadData.name) textParts.push(leadData.name);
    if (leadData.price) textParts.push(leadData.price.toString());
    
    // Información de contacto
    if (leadData.contacts && leadData.contacts.length > 0) {
      leadData.contacts.forEach(contact => {
        if (contact.name) textParts.push(contact.name);
        if (contact.first_name) textParts.push(contact.first_name);
        if (contact.last_name) textParts.push(contact.last_name);
      });
    }

    // Campos personalizados
    if (leadData.custom_fields_values && leadData.custom_fields_values.length > 0) {
      leadData.custom_fields_values.forEach(field => {
        if (field.values && field.values.length > 0) {
          field.values.forEach(value => {
            if (value.value) textParts.push(value.value);
          });
        }
      });
    }

    // Notas
    if (leadData.notes && leadData.notes.length > 0) {
      leadData.notes.forEach(note => {
        if (note.text) textParts.push(note.text);
      });
    }

    return textParts.join(' ').trim();
  }

  // Enviar lead al embudo de destino
  async sendToFunnel(leadData, phrase) {
    try {
      const payload = {
        lead_id: leadData.id,
        lead_name: leadData.name,
        lead_price: leadData.price,
        matched_phrase: phrase.phrase,
        funnel_name: phrase.funnel_name,
        timestamp: new Date().toISOString(),
        source: 'kommo',
        lead_data: leadData
      };

      const response = await axios.post(phrase.webhook_url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Saberi-Lead-Manager/1.0'
        }
      });

      logger.info(`Lead ${leadData.id} enviado exitosamente al embudo ${phrase.funnel_name}`);
      
      return {
        success: true,
        status: response.status,
        response: response.data
      };
    } catch (error) {
      logger.error(`Error enviando lead ${leadData.id} al embudo:`, error.message);
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // Procesar un lead completo
  async processLead(leadData) {
    try {
      // Evitar procesar duplicados
      if (this.processedLeads.has(leadData.id)) {
        logger.info(`Lead ${leadData.id} ya fue procesado, saltando`);
        return { processed: false, reason: 'already_processed' };
      }

      // Buscar frase coincidente
      const matchingPhrase = await this.findMatchingPhrase(leadData);
      
      if (!matchingPhrase) {
        logger.info(`No se encontró frase coincidente para lead ${leadData.id}`);
        
        // Registrar en logs
        await database.run(`
          INSERT INTO lead_logs (kommo_lead_id, status, processed_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [leadData.id, 'no_match']);
        
        return { processed: false, reason: 'no_match' };
      }

      // Enviar al embudo
      const result = await this.sendToFunnel(leadData, matchingPhrase);
      
      // Registrar en logs
      await database.run(`
        INSERT INTO lead_logs 
        (kommo_lead_id, phrase_matched, funnel_id, status, processed_at, response_data)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `, [
        leadData.id,
        matchingPhrase.phrase,
        matchingPhrase.funnel_id,
        result.success ? 'success' : 'error',
        JSON.stringify(result)
      ]);

      // Marcar como procesado
      this.processedLeads.add(leadData.id);

      return {
        processed: true,
        phrase: matchingPhrase.phrase,
        funnel: matchingPhrase.funnel_name,
        result
      };
    } catch (error) {
      logger.error(`Error procesando lead ${leadData.id}:`, error);
      
      // Registrar error en logs
      await database.run(`
        INSERT INTO lead_logs 
        (kommo_lead_id, status, processed_at, error_message)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      `, [leadData.id, 'error', error.message]);

      return { processed: false, reason: 'error', error: error.message };
    }
  }
}

const leadProcessor = new LeadProcessor();

// Webhook principal de Kommo
router.post('/kommo', verifyWebhookSignature, async (req, res) => {
  try {
    const webhookData = req.body;
    
    logger.info('Webhook recibido de Kommo:', {
      type: webhookData.type,
      lead_id: webhookData.lead?.id,
      timestamp: new Date().toISOString()
    });

    // Verificar que es un evento de lead
    if (webhookData.type !== 'lead_add' && webhookData.type !== 'lead_update') {
      logger.info(`Evento no relevante: ${webhookData.type}`);
      return res.json({ received: true, message: 'Evento no relevante' });
    }

    const leadData = webhookData.lead;
    if (!leadData) {
      logger.warn('Webhook sin datos de lead');
      return res.status(400).json({ error: 'Datos de lead no encontrados' });
    }

    // Procesar el lead
    const result = await leadProcessor.processLead(leadData);
    
    logger.info(`Lead ${leadData.id} procesado:`, result);

    res.json({
      received: true,
      processed: result.processed,
      message: result.processed ? 
        `Lead enviado al embudo ${result.funnel}` : 
        `Lead no procesado: ${result.reason}`
    });
  } catch (error) {
    logger.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Endpoint para procesar leads manualmente
router.post('/process-lead', async (req, res) => {
  try {
    const { lead_id } = req.body;
    
    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id es requerido' });
    }

    // Obtener datos del lead desde Kommo
    const kommoService = require('../services/kommoService');
    const leadData = await kommoService.getLead(lead_id);
    
    // Procesar el lead
    const result = await leadProcessor.processLead(leadData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error procesando lead manualmente:', error);
    res.status(500).json({ error: 'Error procesando lead' });
  }
});

// Obtener logs de leads procesados
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, page = 1, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT ll.*, f.name as funnel_name
      FROM lead_logs ll
      LEFT JOIN funnels f ON ll.funnel_id = f.id
    `;
    
    const params = [];
    
    if (status) {
      query += ' WHERE ll.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ll.processed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const logs = await database.all(query, params);
    
    // Obtener total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM lead_logs';
    const countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const countResult = await database.get(countQuery, countParams);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    logger.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
});

module.exports = router;
