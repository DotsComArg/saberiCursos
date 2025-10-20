const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

// Configuración de procesadores
const PROCESSORS = {
  DIRECT: 'direct',      // Procesamiento directo
  N8N: 'n8n',          // Procesamiento vía n8n
  HYBRID: 'hybrid'     // Ambos (fallback)
};

class LeadProcessor {
  constructor() {
    this.processedLeads = new Set();
    this.config = {
      processor: process.env.LEAD_PROCESSOR || PROCESSORS.DIRECT,
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
      fallbackEnabled: process.env.FALLBACK_ENABLED === 'true'
    };
  }

  // Procesar lead con el método configurado
  async processLead(leadData) {
    try {
      // Evitar duplicados
      if (this.processedLeads.has(leadData.id)) {
        return { processed: false, reason: 'already_processed' };
      }

      let result;
      
      switch (this.config.processor) {
        case PROCESSORS.DIRECT:
          result = await this.processDirect(leadData);
          break;
        case PROCESSORS.N8N:
          result = await this.processViaN8N(leadData);
          break;
        case PROCESSORS.HYBRID:
          result = await this.processHybrid(leadData);
          break;
        default:
          result = await this.processDirect(leadData);
      }

      // Marcar como procesado
      this.processedLeads.add(leadData.id);
      
      // Registrar en logs
      await this.logProcessing(leadData, result);
      
      return result;
    } catch (error) {
      logger.error(`Error procesando lead ${leadData.id}:`, error);
      await this.logProcessing(leadData, { processed: false, reason: 'error', error: error.message });
      return { processed: false, reason: 'error', error: error.message };
    }
  }

  // Procesamiento directo (método actual)
  async processDirect(leadData) {
    const matchingPhrase = await this.findMatchingPhrase(leadData);
    
    if (!matchingPhrase) {
      return { processed: false, reason: 'no_match' };
    }

    const result = await this.sendToFunnel(leadData, matchingPhrase);
    
    return {
      processed: result.success,
      phrase: matchingPhrase.phrase,
      funnel: matchingPhrase.funnel_name,
      method: 'direct',
      result
    };
  }

  // Procesamiento vía n8n
  async processViaN8N(leadData) {
    if (!this.config.n8nWebhookUrl) {
      throw new Error('URL de webhook de n8n no configurada');
    }

    try {
      const response = await axios.post(this.config.n8nWebhookUrl, {
        lead: leadData,
        timestamp: new Date().toISOString(),
        source: 'kommo'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Saberi-Lead-Manager/1.0'
        }
      });

      logger.info(`Lead ${leadData.id} enviado a n8n exitosamente`);
      
      return {
        processed: true,
        method: 'n8n',
        n8nResponse: response.data,
        status: response.status
      };
    } catch (error) {
      logger.error(`Error enviando lead ${leadData.id} a n8n:`, error.message);
      throw error;
    }
  }

  // Procesamiento híbrido (directo + n8n como fallback)
  async processHybrid(leadData) {
    try {
      // Intentar procesamiento directo primero
      const directResult = await this.processDirect(leadData);
      
      if (directResult.processed) {
        // Si el procesamiento directo funciona, también enviar a n8n para análisis adicional
        try {
          await this.processViaN8N(leadData);
          logger.info(`Lead ${leadData.id} procesado híbridamente (directo + n8n)`);
        } catch (n8nError) {
          logger.warn(`Lead ${leadData.id} procesado directamente, pero falló envío a n8n:`, n8nError.message);
        }
        
        return {
          ...directResult,
          method: 'hybrid',
          n8nFallback: 'attempted'
        };
      } else {
        // Si no hay coincidencia directa, enviar a n8n para procesamiento avanzado
        return await this.processViaN8N(leadData);
      }
    } catch (error) {
      // Si falla el procesamiento directo, intentar solo n8n
      if (this.config.fallbackEnabled) {
        logger.warn(`Procesamiento directo falló para lead ${leadData.id}, intentando n8n`);
        return await this.processViaN8N(leadData);
      }
      throw error;
    }
  }

  // Buscar frase coincidente (método actual)
  async findMatchingPhrase(leadData) {
    try {
      const searchText = this.extractTextFromLead(leadData);
      
      if (!searchText) return null;

      const phrases = await database.all(`
        SELECT lp.*, f.name as funnel_name, f.webhook_url
        FROM lead_phrases lp 
        LEFT JOIN funnels f ON lp.funnel_id = f.id 
        WHERE lp.is_active = 1 AND f.is_active = 1
        ORDER BY lp.created_at DESC
      `);

      const lowerSearchText = searchText.toLowerCase();
      
      for (const phrase of phrases) {
        if (lowerSearchText.includes(phrase.phrase.toLowerCase())) {
          return phrase;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error buscando frase coincidente:', error);
      return null;
    }
  }

  // Enviar a embudo (método actual)
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

      return {
        success: true,
        status: response.status,
        response: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // Extraer texto del lead (método actual)
  extractTextFromLead(leadData) {
    const textParts = [];
    
    if (leadData.name) textParts.push(leadData.name);
    if (leadData.price) textParts.push(leadData.price.toString());
    
    if (leadData.contacts && leadData.contacts.length > 0) {
      leadData.contacts.forEach(contact => {
        if (contact.name) textParts.push(contact.name);
        if (contact.first_name) textParts.push(contact.first_name);
        if (contact.last_name) textParts.push(contact.last_name);
      });
    }

    if (leadData.custom_fields_values && leadData.custom_fields_values.length > 0) {
      leadData.custom_fields_values.forEach(field => {
        if (field.values && field.values.length > 0) {
          field.values.forEach(value => {
            if (value.value) textParts.push(value.value);
          });
        }
      });
    }

    if (leadData.notes && leadData.notes.length > 0) {
      leadData.notes.forEach(note => {
        if (note.text) textParts.push(note.text);
      });
    }

    return textParts.join(' ').trim();
  }

  // Registrar procesamiento en logs
  async logProcessing(leadData, result) {
    try {
      await database.run(`
        INSERT INTO lead_logs 
        (kommo_lead_id, phrase_matched, funnel_id, status, processed_at, response_data, processing_method)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `, [
        leadData.id,
        result.phrase || null,
        result.funnel_id || null,
        result.processed ? 'success' : (result.reason || 'error'),
        JSON.stringify(result),
        result.method || 'unknown'
      ]);
    } catch (error) {
      logger.error('Error registrando log:', error);
    }
  }

  // Cambiar método de procesamiento dinámicamente
  setProcessor(processor) {
    if (Object.values(PROCESSORS).includes(processor)) {
      this.config.processor = processor;
      logger.info(`Método de procesamiento cambiado a: ${processor}`);
    } else {
      throw new Error(`Método de procesamiento inválido: ${processor}`);
    }
  }

  // Obtener configuración actual
  getConfig() {
    return {
      ...this.config,
      availableProcessors: Object.values(PROCESSORS)
    };
  }
}

const leadProcessor = new LeadProcessor();

// Middleware para verificar firma del webhook
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-kommo-signature'];
  const webhookSecret = process.env.KOMMO_WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    logger.warn('Webhook sin firma o sin secret configurado');
    return next();
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

// Webhook principal de Kommo
router.post('/kommo', verifyWebhookSignature, async (req, res) => {
  try {
    const webhookData = req.body;
    
    logger.info('Webhook recibido de Kommo:', {
      type: webhookData.type,
      lead_id: webhookData.lead?.id,
      processor: leadProcessor.getConfig().processor,
      timestamp: new Date().toISOString()
    });

    if (webhookData.type !== 'lead_add' && webhookData.type !== 'lead_update') {
      return res.json({ received: true, message: 'Evento no relevante' });
    }

    const leadData = webhookData.lead;
    if (!leadData) {
      return res.status(400).json({ error: 'Datos de lead no encontrados' });
    }

    const result = await leadProcessor.processLead(leadData);
    
    logger.info(`Lead ${leadData.id} procesado:`, result);

    res.json({
      received: true,
      processed: result.processed,
      method: result.method,
      message: result.processed ? 
        `Lead procesado con método ${result.method}` : 
        `Lead no procesado: ${result.reason}`
    });
  } catch (error) {
    logger.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Endpoint para cambiar método de procesamiento
router.post('/config/processor', async (req, res) => {
  try {
    const { processor } = req.body;
    
    if (!processor) {
      return res.status(400).json({ error: 'Método de procesamiento requerido' });
    }

    leadProcessor.setProcessor(processor);
    
    res.json({
      success: true,
      message: `Método de procesamiento cambiado a: ${processor}`,
      config: leadProcessor.getConfig()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener configuración actual
router.get('/config', (req, res) => {
  res.json(leadProcessor.getConfig());
});

// Procesar lead manualmente
router.post('/process-lead', async (req, res) => {
  try {
    const { lead_id } = req.body;
    
    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id es requerido' });
    }

    const kommoService = require('../services/kommoService');
    const leadData = await kommoService.getLead(lead_id);
    
    const result = await leadProcessor.processLead(leadData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error procesando lead manualmente:', error);
    res.status(500).json({ error: 'Error procesando lead' });
  }
});

// Obtener logs de procesamiento
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, page = 1, status, method } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT ll.*, f.name as funnel_name
      FROM lead_logs ll
      LEFT JOIN funnels f ON ll.funnel_id = f.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('ll.status = ?');
      params.push(status);
    }
    
    if (method) {
      conditions.push('ll.processing_method = ?');
      params.push(method);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ll.processed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const logs = await database.all(query, params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM lead_logs';
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2)); // Excluir limit y offset
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
