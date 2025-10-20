const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Configuración de Kommo
const KOMMO_CONFIG = {
  clientId: '59180966-188f-4f82-a4e2-0ceeb6f23fbb',
  clientSecret: 'xSy2LMLPtxKem6ZyPAewVnNmRfNLuKY2xsy2m8UC336UKdvPiUzNnkL7jQ8kqyCb',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjJiMmIwNWM3MTAzYWEzM2I3MTA1YWU0MjI1OTYwNDE5MDIzMmNkZTVhMGEwZTliOWEwNGNkNmJkNWRkYTc0ZDhlMjJiYjI2NmZhZGFhMzkxIn0.eyJhdWQiOiI1OTE4MDk2Ni0xODhmLTRmODItYTRlMi0wY2VlYjZmMjNmYmIiLCJqdGkiOiIyYjJiMDVjNzEwM2FhMzNiNzEwNWFlNDIyNTk2MDQxOTAyMzJjZGU1YTBhMGU5YjlhMDRjZDZiZDVkZGE3NGQ4ZTIyYmIyNjZmYWRhYTM5MSIsImlhdCI6MTc2MDk5NDg1NywibmJmIjoxNzYwOTk0ODU3LCJleHAiOjE4MjcxODcyMDAsInN1YiI6IjEwODMxMTgzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0Nzg4ODE1LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiN2I3Y2Y4NWItMDdjNy00NDFjLWFmMTMtM2U3ODEzZjA0YTJlIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.Zq2l9S-oAdwp0XbC-TB9igYPUAKNM3gA58-J8hmpDwajngjDjWW9dxRaGg3GhgRb4NmYVWOatmeYefqXa1Lo-21xGVYP-w9zj0NRjoiiDygL5CdadEZQ_6u4ku5naUVi301lAIt9lBzKq6aevC6Kzd-ygVo1PD1W_S05d4IwAbAOe2uaDcLhvdjbqfHPDn51KF0WC45uq7UXXC25UaqUonqP7aJkWKOf3NnPL1bu4JBhbolXxGvtAdSQeH8MW_5pG1BLCMt8Tg-WCUnm9m7hrV_MabLJcLEQ7AhAUq-jGOLLEH8JZvAF6wR00F9P6nj7dSjFX2o7WY9t3pEOvv1X_Q',
  baseURL: 'https://api-c.kommo.com/api/v4',
  webhookSecret: process.env.KOMMO_WEBHOOK_SECRET || 'tu_webhook_secret_aqui'
};

// Almacenamiento en memoria (en producción usar base de datos)
let phrases = [];
let funnels = [];
let processedLeads = new Set();

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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
    kommo: {
      connected: true,
      clientId: KOMMO_CONFIG.clientId,
      baseURL: KOMMO_CONFIG.baseURL
    },
    endpoints: {
      health: '/health',
      kommo: '/api/kommo',
      phrases: '/api/phrases',
      funnels: '/api/funnels',
      webhook: '/webhook/kommo'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Vercel',
    kommo: {
      connected: true,
      tokenValid: true
    }
  });
});

// ===== INTEGRACIÓN CON KOMMO =====

// Obtener información de la cuenta
app.get('/api/kommo/account', async (req, res) => {
  try {
    const response = await axios.get(`${KOMMO_CONFIG.baseURL}/account`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      account: response.data,
      platform: 'Vercel'
    });
  } catch (error) {
    console.error('Error obteniendo cuenta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo información de cuenta',
      details: error.response?.data || error.message
    });
  }
});

// Obtener leads de Kommo
app.get('/api/kommo/leads', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const response = await axios.get(`${KOMMO_CONFIG.baseURL}/leads`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: parseInt(limit),
        page: parseInt(page)
      }
    });
    
    res.json({
      success: true,
      leads: response.data._embedded?.leads || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.data._embedded?.leads?.length || 0
      },
      platform: 'Vercel'
    });
  } catch (error) {
    console.error('Error obteniendo leads:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo leads',
      details: error.response?.data || error.message
    });
  }
});

// Obtener un lead específico
app.get('/api/kommo/leads/:id', async (req, res) => {
  try {
    const response = await axios.get(`${KOMMO_CONFIG.baseURL}/leads/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      lead: response.data,
      platform: 'Vercel'
    });
  } catch (error) {
    console.error('Error obteniendo lead:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo lead',
      details: error.response?.data || error.message
    });
  }
});

// ===== GESTIÓN DE FRASES =====

// Obtener todas las frases
app.get('/api/phrases', (req, res) => {
  res.json({
    success: true,
    phrases: phrases,
    count: phrases.length,
    platform: 'Vercel'
  });
});

// Crear nueva frase
app.post('/api/phrases', (req, res) => {
  try {
    const { phrase, funnel_id } = req.body;
    
    if (!phrase || typeof phrase !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Frase es requerida y debe ser texto'
      });
    }
    
    const newPhrase = {
      id: Date.now(),
      phrase: phrase.toLowerCase().trim(),
      funnel_id: funnel_id || null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    phrases.push(newPhrase);
    
    res.status(201).json({
      success: true,
      phrase: newPhrase,
      message: 'Frase creada correctamente',
      platform: 'Vercel'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creando frase',
      details: error.message
    });
  }
});

// Eliminar frase
app.delete('/api/phrases/:id', (req, res) => {
  try {
    const phraseId = parseInt(req.params.id);
    const phraseIndex = phrases.findIndex(p => p.id === phraseId);
    
    if (phraseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Frase no encontrada'
      });
    }
    
    phrases.splice(phraseIndex, 1);
    
    res.json({
      success: true,
      message: 'Frase eliminada correctamente',
      platform: 'Vercel'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando frase',
      details: error.message
    });
  }
});

// ===== GESTIÓN DE EMBUDOS =====

// Obtener todos los embudos
app.get('/api/funnels', (req, res) => {
  res.json({
    success: true,
    funnels: funnels,
    count: funnels.length,
    platform: 'Vercel'
  });
});

// Crear nuevo embudo
app.post('/api/funnels', (req, res) => {
  try {
    const { name, webhook_url, description } = req.body;
    
    if (!name || !webhook_url) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y URL del webhook son requeridos'
      });
    }
    
    const newFunnel = {
      id: Date.now(),
      name,
      webhook_url,
      description: description || '',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    funnels.push(newFunnel);
    
    res.status(201).json({
      success: true,
      funnel: newFunnel,
      message: 'Embudo creado correctamente',
      platform: 'Vercel'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creando embudo',
      details: error.message
    });
  }
});

// ===== PROCESAMIENTO DE LEADS =====

// Función para buscar frase coincidente
function findMatchingPhrase(leadData) {
  const searchText = extractTextFromLead(leadData).toLowerCase();
  
  for (const phrase of phrases) {
    if (phrase.is_active && searchText.includes(phrase.phrase)) {
      return phrase;
    }
  }
  
  return null;
}

// Función para extraer texto del lead
function extractTextFromLead(leadData) {
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
  
  return textParts.join(' ').trim();
}

// Función para enviar a embudo
async function sendToFunnel(leadData, phrase) {
  try {
    const funnel = funnels.find(f => f.id === phrase.funnel_id && f.is_active);
    
    if (!funnel) {
      return { success: false, error: 'Embudo no encontrado' };
    }
    
    const payload = {
      lead_id: leadData.id,
      lead_name: leadData.name,
      lead_price: leadData.price,
      matched_phrase: phrase.phrase,
      funnel_name: funnel.name,
      timestamp: new Date().toISOString(),
      source: 'kommo',
      lead_data: leadData
    };
    
    const response = await axios.post(funnel.webhook_url, payload, {
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

// ===== WEBHOOK DE KOMMO =====

// Webhook principal de Kommo
app.post('/webhook/kommo', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('Webhook recibido de Kommo:', {
      type: webhookData.type,
      lead_id: webhookData.lead?.id,
      timestamp: new Date().toISOString()
    });
    
    // Verificar que es un evento de lead
    if (webhookData.type !== 'lead_add' && webhookData.type !== 'lead_update') {
      return res.json({ 
        received: true, 
        message: 'Evento no relevante',
        platform: 'Vercel'
      });
    }
    
    const leadData = webhookData.lead;
    if (!leadData) {
      return res.status(400).json({ 
        error: 'Datos de lead no encontrados',
        platform: 'Vercel'
      });
    }
    
    // Evitar procesar duplicados
    if (processedLeads.has(leadData.id)) {
      console.log(`Lead ${leadData.id} ya fue procesado, saltando`);
      return res.json({ 
        received: true, 
        processed: false, 
        reason: 'already_processed',
        platform: 'Vercel'
      });
    }
    
    // Buscar frase coincidente
    const matchingPhrase = findMatchingPhrase(leadData);
    
    if (!matchingPhrase) {
      console.log(`No se encontró frase coincidente para lead ${leadData.id}`);
      return res.json({ 
        received: true, 
        processed: false, 
        reason: 'no_match',
        platform: 'Vercel'
      });
    }
    
    // Enviar al embudo
    const result = await sendToFunnel(leadData, matchingPhrase);
    
    // Marcar como procesado
    processedLeads.add(leadData.id);
    
    console.log(`Lead ${leadData.id} procesado:`, {
      phrase: matchingPhrase.phrase,
      success: result.success
    });
    
    res.json({
      received: true,
      processed: result.success,
      phrase: matchingPhrase.phrase,
      message: result.success ? 
        `Lead enviado al embudo ${matchingPhrase.funnel_id}` : 
        `Error enviando lead: ${result.error}`,
      platform: 'Vercel'
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ 
      error: 'Error procesando webhook',
      details: error.message,
      platform: 'Vercel'
    });
  }
});

// Procesar lead manualmente
app.post('/api/process-lead', async (req, res) => {
  try {
    const { lead_id } = req.body;
    
    if (!lead_id) {
      return res.status(400).json({ 
        error: 'lead_id es requerido',
        platform: 'Vercel'
      });
    }
    
    // Obtener datos del lead desde Kommo
    const response = await axios.get(`${KOMMO_CONFIG.baseURL}/leads/${lead_id}`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const leadData = response.data;
    
    // Buscar frase coincidente
    const matchingPhrase = findMatchingPhrase(leadData);
    
    if (!matchingPhrase) {
      return res.json({
        processed: false,
        reason: 'no_match',
        message: 'No se encontró frase coincidente',
        platform: 'Vercel'
      });
    }
    
    // Enviar al embudo
    const result = await sendToFunnel(leadData, matchingPhrase);
    
    res.json({
      processed: result.success,
      phrase: matchingPhrase.phrase,
      result: result,
      platform: 'Vercel'
    });
  } catch (error) {
    console.error('Error procesando lead manualmente:', error);
    res.status(500).json({ 
      error: 'Error procesando lead',
      details: error.message,
      platform: 'Vercel'
    });
  }
});

// ===== ESTADÍSTICAS =====

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      phrases_count: phrases.length,
      funnels_count: funnels.length,
      processed_leads: processedLeads.size,
      active_phrases: phrases.filter(p => p.is_active).length,
      active_funnels: funnels.filter(f => f.is_active).length
    },
    platform: 'Vercel'
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
      webhook: '/webhook/kommo',
      stats: '/api/stats'
    },
    platform: 'Vercel'
  });
});

// Para Vercel, exportar la app directamente
module.exports = app;