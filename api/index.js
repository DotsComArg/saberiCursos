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
  clientId: '5203501f-da3b-4c70-a69f-a60779c0827c',
  clientSecret: 'K86nIF41dosVBSGxJLoMtO0RiRcm6lW6Nu9BckZemtghG6oXuJEAqDlsBcnl7y5B',
  accessToken: '5203501f-da3b-4c70-a69f-a60779c0827c',
  baseURL: 'https://api-g.kommo.com/api/v4',
  webhookSecret: process.env.KOMMO_WEBHOOK_SECRET || 'K86nIF41dosVBSGxJLoMtO0RiRcm6lW6Nu9BckZemtghG6oXuJEAqDlsBcnl7y5B'
};

// Almacenamiento  en memoria (en producción usar base de datos)
let phrases = [];
let funnels = [];
let processedLeads = new Set();

// Configuración de frases específicas con etapas
const COURSE_PHRASES = {
  // PRIMERAS 3 FRASES - MOVIMIENTO SECUENCIAL
  'higienista dental': {
    keyword: 'higienista dental',
    stageId: 94705068, // Primera etapa
    message: '¡Hola! Quiero más información sobre el curso de higienista dental'
  },
  'farmacia': {
    keyword: 'farmacia',
    stageId: 94705072, // Segunda etapa
    message: '¡Hola! Quiero más información sobre el curso de farmacia'
  },
  'inyectologia': {
    keyword: 'inyectologia',
    stageId: 94705076, // Tercera etapa
    message: '¡Hola! Quiero más información sobre el curso de inyectologia'
  },
  'electricidad': {
    keyword: 'electricidad',
    message: '¡Hola! Quiero más información sobre el curso de electricidad'
  },
  'camaras': {
    keyword: 'camaras',
    message: '¡Hola! Quiero más información sobre el curso de camaras'
  },
  'celulares': {
    keyword: 'celulares',
    message: '¡Hola! Quiero más información sobre el curso de celulares'
  },
  'impresion 3d': {
    keyword: 'impresion 3d',
    message: '¡Hola! Quiero más información sobre el curso de impresion 3d adultos'
  },
  'drones': {
    keyword: 'drones',
    message: '¡Hola! Quiero más información sobre el curso de drones'
  },
  'robotica para adultos': {
    keyword: 'robotica para adultos',
    message: '¡Hola! Quiero más información sobre el curso de robotica adultos'
  },
  'paneles solares': {
    keyword: 'paneles solares',
    message: '¡Hola! Quiero más información sobre el curso de paneles solares'
  },
  'aires acondicionado': {
    keyword: 'aires acondicionado',
    message: '¡Hola! Quiero más información sobre el curso de aires acondicionados'
  },
  'electronica': {
    keyword: 'electronica',
    message: '¡Hola! Quiero más información sobre el curso de electronica'
  },
  'drones fpv': {
    keyword: 'drones fpv',
    message: '¡Hola! Quiero más información sobre el curso de drones fpv'
  },
  'cnc router': {
    keyword: 'cnc router',
    message: '¡Hola! Quiero más información sobre el curso de cnc router'
  },
  'pasteleria': {
    keyword: 'pasteleria',
    message: '¡Hola! Quiero más información sobre el curso de pasteleria'
  },
  'cocteleria': {
    keyword: 'cocteleria',
    message: '¡Hola! Quiero más información sobre el curso de cocteleria'
  },
  'cocina': {
    keyword: 'cocina',
    message: '¡Hola! Quiero más información sobre el curso de cocina'
  },
  'panaderia': {
    keyword: 'panaderia',
    message: '¡Hola! Quiero más información sobre el curso de panaderia'
  },
  'uñas': {
    keyword: 'uñas',
    message: '¡Hola! Quiero más información sobre el curso de uñas'
  },
  'peluqueria': {
    keyword: 'peluqueria',
    message: '¡Hola! Quiero más información sobre el curso de peluqueria'
  },
  'colorimetria': {
    keyword: 'colorimetria',
    message: '¡Hola! Quiero más información sobre el curso de fundamentos de colorimetria'
  },
  'maquillaje': {
    keyword: 'maquillaje',
    message: '¡Hola! Quiero más información sobre el curso de maquillaje'
  },
  'barberia': {
    keyword: 'barberia',
    message: '¡Hola! Quiero más información sobre el curso de barberia'
  },
  'lashista': {
    keyword: 'lashista',
    message: '¡Hola! Quiero más información sobre el curso de lashista'
  },
  'micropigmentacion': {
    keyword: 'micropigmentacion',
    message: '¡Hola! Quiero más información sobre el curso de micropigmentacion'
  },
  'marketing digital': {
    keyword: 'marketing digital',
    message: '¡Hola! Quiero más información sobre el curso de marketing digital'
  },
  'globos': {
    keyword: 'globos',
    message: '¡Hola! Quiero más información sobre el curso de globos'
  },
  'parvulos': {
    keyword: 'parvulos',
    message: '¡Hola! Quiero más información sobre el curso de parvulos'
  },
  'colorimetria nivel 2': {
    keyword: 'colorimetria nivel 2',
    message: '¡Hola! Quiero más información sobre el curso de colorimetria nivel 2'
  },
  'pasteleria nivel 2': {
    keyword: 'pasteleria nivel 2',
    message: '¡Hola! Quiero más información sobre el curso de pasteleria nivel 2'
  },
  'cocina latina': {
    keyword: 'cocina latina',
    message: '¡Hola! Quiero más información sobre el curso de cocina latina'
  },
  'robotica con lego': {
    keyword: 'robotica con lego',
    message: '¡Hola! Quiero más información sobre el curso de robotica con lego'
  },
  'robotica con arduino': {
    keyword: 'robotica con arduino',
    message: '¡Hola! Quiero más información sobre el curso de robotica con arduino'
  },
  'impresion 3d niños': {
    keyword: 'impresion 3d niños',
    message: '¡Hola! Quiero más información sobre el curso de impresion 3d niños'
  },
  'videojuegos': {
    keyword: 'videojuegos',
    message: '¡Hola! Quiero más información sobre el curso de videojuegos'
  },
  'cocinarte': {
    keyword: 'cocinarte',
    message: '¡Hola! Quiero más información sobre el curso de cocinarte'
  }
};

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
  
  // Buscar en las frases específicas de cursos
  for (const [key, courseData] of Object.entries(COURSE_PHRASES)) {
    if (searchText.includes(courseData.keyword.toLowerCase())) {
      return {
        phrase: courseData.keyword,
        message: courseData.message,
        course: key
      };
    }
  }
  
  // Buscar en frases configuradas dinámicamente (fallback)
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

// Función para mover lead a etapa específica
async function moveLeadToStage(leadId, stageId) {
  try {
    const response = await axios.patch(`${KOMMO_CONFIG.baseURL}/leads/${leadId}`, {
      pipeline_id: 10826340, // ID del embudo
      status_id: stageId
    }, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      status: response.status,
      stageId: stageId,
      response: response.data
    };
  } catch (error) {
    console.error('Error moviendo lead a etapa:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Función para enviar a embudo (mantener compatibilidad)
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
    
    // Mover lead a etapa específica
    let result;
    if (matchingPhrase.stageId) {
      result = await moveLeadToStage(leadData.id, matchingPhrase.stageId);
    } else {
      // Para frases sin etapa específica, usar etapa por defecto
      result = await moveLeadToStage(leadData.id, 94705068); // Etapa por defecto
    }
    
    // Marcar como procesado
    processedLeads.add(leadData.id);
    
    console.log(`Lead ${leadData.id} procesado:`, {
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94705068,
      success: result.success
    });
    
    res.json({
      received: true,
      processed: result.success,
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94705068,
      message: result.success ? 
        `Lead movido a etapa ${matchingPhrase.stageId || 94705068}` : 
        `Error moviendo lead: ${result.error}`,
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
      active_funnels: funnels.filter(f => f.is_active).length,
      course_phrases_count: Object.keys(COURSE_PHRASES).length
    },
    platform: 'Vercel'
  });
});

// Obtener frases de cursos configuradas
app.get('/api/course-phrases', (req, res) => {
  res.json({
    success: true,
    course_phrases: COURSE_PHRASES,
    count: Object.keys(COURSE_PHRASES).length,
    platform: 'Vercel'
  });
});

// Probar detección de frase
app.post('/api/test-phrase', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texto es requerido'
      });
    }
    
    // Simular datos de lead
    const mockLeadData = {
      id: 'test-123',
      name: 'Lead de Prueba',
      contacts: [{
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User'
      }],
      custom_fields_values: [{
        values: [{ value: text }]
      }]
    };
    
    const matchingPhrase = findMatchingPhrase(mockLeadData);
    
    res.json({
      success: true,
      text: text,
      matched: !!matchingPhrase,
      phrase: matchingPhrase,
      platform: 'Vercel'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error probando frase',
      details: error.message
    });
  }
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