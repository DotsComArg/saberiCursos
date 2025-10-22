const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Configurar trust proxy para Vercel
app.set('trust proxy', 1);

// Configuración de Kommo
const KOMMO_CONFIG = {
  clientId: '5203501f-da3b-4c70-a69f-a60779c0827c',
  clientSecret: 'K86nIF41dosVBSGxJLoMtO0RiRcm6lW6Nu9BckZemtghG6oXuJEAqDlsBcnl7y5B',
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImVjMWJmMmYxZDMwNmM1MjEwN2NkMWQ0ZTA1MDgxN2U3NGM0MzBjYTk2ZjZkZmI1MDhjYTZjNjI4YTIzMTBjM2I0NDMxMjNmMTMzMDM2ZmFmIn0.eyJhdWQiOiI1MjAzNTAxZi1kYTNiLTRjNzAtYTY5Zi1hNjA3NzljMDgyN2MiLCJqdGkiOiJlYzFiZjJmMWQzMDZjNTIxMDdjZDFkNGUwNTA4MTdlNzRjNDMwY2E5NmY2ZGZiNTA4Y2E2YzYyOGEyMzEwYzNiNDQzMTIzZjEzMzAzNmZhZiIsImlhdCI6MTc2MTE2MzAzNiwibmJmIjoxNzYxMTYzMDM2LCJleHAiOjE3ODEzOTUyMDAsInN1YiI6IjEwODMxMTgzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNDIzNjY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMDBhNjM0OWMtODIwMC00ZDdlLWIzMDEtZGIxYjQzNzlmMjk4IiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1nLmtvbW1vLmNvbSJ9.IineFkGcK0mldYI6nnEYgxX63-bAjTQiwEIFZGqUepYgin5OlqQbhNEJ5-pf9FS3o-2Hb0t1cgqSVik3KVnciSxNAxwEaYyrMfW_T45METqW7aMeJtWF0AnY2sWwltpbXcVtsohU5nw7HO1QTcTytkz9epQmgSg85Ab2BGgpqyR-2xSQyb-4yvqamGMwcaSYLQIVHywIzNdfzZ68rapxSwWMgOWcYoZyHE9klMD8-WmaOa1IZ7oDJLbnId1RFI6DPi-cLj_WqMv3q8yYrnggZT-st3Rej-zx1jUj9m8S1a_aN_o9JvnXilBjLzFgGP3z8eZ6zgTPfSy8VLwIi4PP9g',
  // Token alternativo para obtener mensajes (como en n8n)
  messagesToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjI4ZjY0MzMxMDljZGFiYzdjZjE0M2RiMzJhZmEwZmExYzI4MjdkNDcxYTU1ZGJmZTNjNDgyOWIwMmMzN2E2N2U3ZGU4YzllNmRkMTM0ZDlhIn0.eyJhdWQiOiJlMjc0NzQwZC0wZGRmLTQ1ODQtYTNhYy01ZmMxZmM1ZjIxMGUiLCJqdGkiOiIyOGY2NDMzMTA5Y2RhYmM3Y2YxNDNkYjMyYWZhMGZhMWMyODI3ZDQ3MWE1NWRiZmUzYzQ4MjliMDJjMzdhNjdlN2RlOGM5ZTZkZDEzNGQ5YSIsImlhdCI6MTc1NzYxNzk1NywibmJmIjoxNzU3NjE3OTU3LCJleHAiOjE3NjY2MjA4MDAsInN1YiI6IjEwODMxMTgzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNDIzNjY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwidXNlcl9mbGFncyI6MCwiaGFzaF91dWlkIjoiNjk5YzhhMWEtOWUxZC00MDYyLTg3NGMtNGNlYmNkYzM2MjIwIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.YOHgrWknGctBUz9OK9hG7MGlcQGv2piRS6dD23VfBI4J4vvBMof59LelcrYuk10KVpvq6L_r8kwyK9N44oHNmOQXcC5VU8vTowL2wl_ihyiLbk_ZGm32plLePDbLdTZtzmjO_F5P_uiv-ghxZlKuyaLaUCEzaAfQXSmzxAWkk4n_EEMXDAGGISX81UdLQSu4LtbG34NCffwYhB5HoSg9hZpRoPiORwWCpflZB8qPV1Plhp1maz7NDAd6_9ryRUg87L0x9GvD9WKm0uuMMEhGIgwqIuJK5DxjbiIwowjJfkfyhpgbGif_lkNERvFkzc4h_Hc2CCiOUK6hz3waJ9PsBw',
  baseURL: 'https://api-g.kommo.com/api/v4',
  // URL específica para mensajes (como en n8n)
  messagesURL: 'https://dotscomagency.kommo.com/api/v4',
  webhookSecret: process.env.KOMMO_WEBHOOK_SECRET || 'K86nIF41dosVBSGxJLoMtO0RiRcm6lW6Nu9BckZemtghG6oXuJEAqDlsBcnl7y5B'
};

// Almacenamiento  en memoria (en producción usar base de datos)
let phrases = [];
let funnels = [];
let processedLeads = new Set();

// Mapeo centralizado de frases → status_id para mensajes entrantes
const MESSAGE_PHRASE_MAPPING = {
  // Reglas de avance a compra
  'confirmo que quiero avanzar a pago': 86115943,
  'quiero avanzar a pago': 86115943,
  'confirmo pago': 86115943,
  'quiero pagar': 86115943,
  'proceder con pago': 86115943,
  
  // Reglas de asesor/humano
  'quiero hablar con un asesor': 87384179,
  'necesito hablar con un asesor': 87384179,
  'quiero asesor': 87384179,
  'hablar con asesor': 87384179,
  'contacto humano': 87384179,
  'quiero hablar con alguien': 87384179,
  
  // Reglas adicionales que puedes agregar aquí
  'cancelar': 12345678, // Ejemplo de status_id para cancelación
  'no estoy interesado': 12345679, // Ejemplo de status_id para no interesado
};

// Configuración de frases específicas con etapas (mantener para compatibilidad)
const COURSE_PHRASES = {
  // PRIMERAS 3 FRASES - MOVIMIENTO SECUENCIAL
  'higienista dental': {
    keyword: 'higienista dental',
    stageId: 94374380, // Primera etapa
    message: '¡Hola! Quiero más información sobre el curso de higienista dental'
  },
  'farmacia': {
    keyword: 'farmacia',
    stageId: 94374748, // Segunda etapa
    message: '¡Hola! Quiero más información sobre el curso de farmacia'
  },
  'inyectologia': {
    keyword: 'inyectologia',
    stageId: 94374748, // Tercera etapa
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
      webhook: '/webhook/kommo',
      messagePhrases: '/api/message-phrases',
      testMessagePhrase: '/api/test-message-phrase',
      simulateMessageWebhook: '/api/simulate-message-webhook'
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
  
  // Buscar en notas y comentarios
  if (leadData.notes && leadData.notes.length > 0) {
    leadData.notes.forEach(note => {
      if (note.text) textParts.push(note.text);
    });
  }
  
  // Buscar en mensajes de chat
  if (leadData.messages && leadData.messages.length > 0) {
    leadData.messages.forEach(message => {
      if (message.text) textParts.push(message.text);
    });
  }
  
  // Buscar en cualquier campo de texto
  if (leadData.text) textParts.push(leadData.text);
  if (leadData.description) textParts.push(leadData.description);
  if (leadData.comment) textParts.push(leadData.comment);
  
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

// ===== FUNCIONES PARA MENSAJES ENTRANTES =====

// Función para parsear datos URL-encoded y extraer campos del webhook
function parseWebhookData(rawBody) {
  try {
    // Parsear application/x-www-form-urlencoded
    const parsed = new URLSearchParams(rawBody);
    const data = {};
    
    // Convertir URLSearchParams a objeto, preservando claves con corchetes
    for (const [key, value] of parsed.entries()) {
      data[key] = value;
    }
    
    return data;
  } catch (error) {
    console.error('Error parseando webhook data:', error);
    return null;
  }
}

// Función para extraer campos relevantes del webhook de mensaje entrante
function extractMessageFields(webhookData) {
  const fields = {
    subdomain: webhookData['account[subdomain]'] || process.env.KOMMO_DEFAULT_SUBDOMAIN || 'dotscomagency',
    message_id: webhookData['message[add][0][id]'],
    chat_id: webhookData['message[add][0][chat_id]'],
    lead_id: webhookData['message[add][0][element_id]'] || webhookData['message[add][0][entity_id]'],
    text: webhookData['message[add][0][text]'],
    attachment_type: webhookData['message[add][0][attachment][type]'],
    attachment_link: webhookData['message[add][0][attachment][link]']
  };
  
  return fields;
}

// Función para buscar frase coincidente en el texto del mensaje usando las reglas existentes
function findMatchingMessagePhrase(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  // Buscar en las frases específicas de cursos (usar las reglas existentes)
  for (const [key, courseData] of Object.entries(COURSE_PHRASES)) {
    if (lowerText.includes(courseData.keyword.toLowerCase())) {
      return {
        phrase: courseData.keyword,
        stageId: courseData.stageId,
        course: key,
        message: courseData.message,
        matched: true
      };
    }
  }
  
  // Buscar en el mapeo de mensajes entrantes como fallback
  for (const [phrase, statusId] of Object.entries(MESSAGE_PHRASE_MAPPING)) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return {
        phrase: phrase,
        stageId: statusId,
        matched: true
      };
    }
  }
  
  return null;
}

// Función para mover lead a status_id específico vía API de Kommo (usar lógica existente)
async function moveLeadToStatus(leadId, stageId) {
  try {
    // Usar la función existente moveLeadToStage que ya tiene la lógica correcta
    const result = await moveLeadToStage(leadId, stageId);
    return result;
  } catch (error) {
    console.error('Error moviendo lead a status:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// ===== WEBHOOK DE KOMMO =====

// Función para procesar un lead individual
async function processLead(leadData, eventType) {
  console.log(`Procesando lead ${leadData.id}:`, {
    id: leadData.id,
    name: leadData.name,
    eventType,
    full_lead_data: leadData
  });
  
  // Evitar procesar duplicados
  if (processedLeads.has(leadData.id)) {
    console.log(`Lead ${leadData.id} ya fue procesado, saltando`);
    return { processed: false, reason: 'already_processed' };
  }
  
  // Implementar flujo de n8n: obtener datos completos del lead
  let fullLeadData = leadData;
  try {
    console.log(`Paso 1: Obteniendo información básica del lead ${leadData.id}...`);
    
    // Paso 1: Obtener información básica del lead (como en n8n)
    const basicResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadData.id}?with=contacts`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    console.log(`Información básica obtenida para lead ${leadData.id}:`, basicResponse.data);
    
    // Paso 2: Obtener mensajes del lead (como en n8n)
    console.log(`Paso 2: Obteniendo mensajes del lead ${leadData.id}...`);
    const messagesResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadData.id}`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    fullLeadData = messagesResponse.data;
    console.log(`Mensajes obtenidos para lead ${leadData.id}:`, fullLeadData);
    
    // Paso 3: Obtener mensajes específicos del lead (como en n8n)
    console.log(`Paso 3: Obteniendo mensajes específicos del lead ${leadData.id}...`);
    try {
      const specificMessagesResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadData.id}?with=messages`, {
        headers: {
          'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });
      
      console.log(`Mensajes específicos obtenidos para lead ${leadData.id}:`, specificMessagesResponse.data);
      
      // Combinar datos del lead con mensajes
      if (specificMessagesResponse.data._embedded && specificMessagesResponse.data._embedded.messages) {
        fullLeadData.messages = specificMessagesResponse.data._embedded.messages;
        console.log(`Mensajes encontrados:`, fullLeadData.messages);
      }
      
    } catch (error) {
      console.error(`Error obteniendo mensajes específicos del lead ${leadData.id}:`, error.message);
    }
    
  } catch (error) {
    console.error(`Error obteniendo datos completos del lead ${leadData.id}:`, error.message);
    console.log(`Continuando con datos básicos del webhook...`);
    // Continuar con los datos básicos si falla la API
  }
  
  // Extraer texto del lead para debugging
  const extractedText = extractTextFromLead(fullLeadData);
  console.log(`Texto extraído del lead ${leadData.id}:`, extractedText);
  
  // Buscar frase coincidente
  const matchingPhrase = findMatchingPhrase(fullLeadData);
  
  if (!matchingPhrase) {
    console.log(`No se encontró frase coincidente para lead ${leadData.id}`);
    console.log(`Texto extraído: "${extractedText}"`);
    console.log(`Frases disponibles:`, Object.keys(COURSE_PHRASES));
    return { processed: false, reason: 'no_match' };
  }
  
  // Mover lead a etapa específica
  let result;
  if (matchingPhrase.stageId) {
    result = await moveLeadToStage(leadData.id, matchingPhrase.stageId);
  } else {
    // Para frases sin etapa específica, usar etapa por defecto
    result = await moveLeadToStage(leadData.id, 94843344);
  }
  
  // Marcar como procesado
  processedLeads.add(leadData.id);
  
  console.log(`Lead ${leadData.id} procesado:`, {
    phrase: matchingPhrase.phrase,
    course: matchingPhrase.course,
    stageId: matchingPhrase.stageId || 94843344,
    success: result.success
  });
  
  return {
    processed: result.success,
    phrase: matchingPhrase.phrase,
    course: matchingPhrase.course,
    stageId: matchingPhrase.stageId || 94843344,
    result: result
  };
}

// Webhook principal de Kommo
app.post('/webhook/kommo', async (req, res) => {
  try {
    // Verificar Content-Type para determinar el tipo de parsing
    const contentType = req.headers['content-type'] || '';
    
    let webhookData;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parsear como URL-encoded (para mensajes entrantes)
      const rawBody = req.body;
      webhookData = parseWebhookData(rawBody);
      
      if (!webhookData) {
        return res.status(400).json({
          error: 'Error parseando datos del webhook',
          type: 'parse_error'
        });
      }
      
      // DEBUG: Mostrar todos los campos del webhook
      console.log('DEBUG - Webhook data completo:', webhookData);
      console.log('DEBUG - Claves disponibles:', Object.keys(webhookData));
    } else {
      // Parsear como JSON (webhook estándar de Kommo)
      webhookData = req.body;
      
      // DEBUG: Mostrar todos los campos del webhook JSON
      console.log('DEBUG - Webhook JSON completo:', webhookData);
      console.log('DEBUG - Claves disponibles:', Object.keys(webhookData));
      
      // Verificar si es un webhook de mensaje entrante en formato JSON
      if (webhookData.account && webhookData.leads) {
        console.log('DEBUG - Webhook JSON con account y leads detectado');
        
        // Intentar extraer datos del formato JSON de Kommo
        const accountData = webhookData.account;
        const leadsData = webhookData.leads;
        
        console.log('DEBUG - Account data:', accountData);
        console.log('DEBUG - Leads data:', leadsData);
        
        // Buscar lead_id en diferentes formatos
        let leadId = null;
        let messageText = null;
        
        // Verificar si hay leads.add (nuevos leads)
        if (leadsData.add && Array.isArray(leadsData.add) && leadsData.add.length > 0) {
          const lead = leadsData.add[0];
          leadId = lead.id;
          console.log(`DEBUG - Lead ID encontrado en leads.add: ${leadId}`);
        }
        
        // Verificar si hay leads.update (leads actualizados)
        if (leadsData.update && Array.isArray(leadsData.update) && leadsData.update.length > 0) {
          const lead = leadsData.update[0];
          leadId = lead.id;
          console.log(`DEBUG - Lead ID encontrado en leads.update: ${leadId}`);
        }
        
        // Verificar si hay message.add (mensajes nuevos)
        if (webhookData.message && webhookData.message.add && Array.isArray(webhookData.message.add) && webhookData.message.add.length > 0) {
          const message = webhookData.message.add[0];
          leadId = message.element_id || message.entity_id;
          messageText = message.text;
          console.log(`DEBUG - Mensaje encontrado: leadId=${leadId}, text="${messageText}"`);
        }
        
        if (leadId) {
          console.log(`DEBUG - Procesando lead ${leadId}...`);
          
          // Si no tenemos el texto del mensaje, obtenerlo de la API
          if (!messageText) {
            try {
              console.log(`DEBUG - Obteniendo mensaje del lead ${leadId} desde API...`);
              
              const leadResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadId}?with=messages`, {
                headers: {
                  'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
                  'Content-Type': 'application/json',
                  'accept': 'application/json'
                }
              });
              
              // Extraer el último mensaje del lead
              if (leadResponse.data._embedded && leadResponse.data._embedded.messages) {
                const messages = leadResponse.data._embedded.messages;
                if (messages.length > 0) {
                  // Ordenar por fecha y tomar el más reciente
                  const sortedMessages = messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                  messageText = sortedMessages[0].text;
                  console.log(`DEBUG - Texto obtenido de API: "${messageText}"`);
                }
              }
            } catch (error) {
              console.error(`DEBUG - Error obteniendo mensaje del lead ${leadId}:`, error.message);
            }
          }
          
          if (!messageText) {
            return res.json({
              type: 'incoming_message_without_text',
              message: 'No se pudo obtener texto del mensaje',
              processed: false,
              leadId: leadId
            });
          }
          
          // Buscar frase coincidente usando las reglas existentes
          const matchingPhrase = findMatchingMessagePhrase(messageText);
          
          if (!matchingPhrase) {
            return res.json({
              type: 'no_stage_change',
              message: 'No coincide con ninguna regla',
              processed: false,
              leadId: leadId,
              text: messageText
            });
          }
          
          // Mover lead al stage_id correspondiente usando la lógica existente
          const moveResult = await moveLeadToStatus(leadId, matchingPhrase.stageId);
          
          // Logging sobrio
          console.log(`Lead ${leadId}: texto="${messageText}", movido=${moveResult.success}, stage_id=${matchingPhrase.stageId}`);
          
          return res.json({
            type: 'incoming_message',
            hasText: true,
            moved: moveResult.success,
            movedTo: moveResult.success ? matchingPhrase.stageId : null,
            phrase: matchingPhrase.phrase,
            course: matchingPhrase.course,
            leadId: leadId,
            error: moveResult.success ? null : moveResult.error
          });
        }
      }
      
      // Continuar con el procesamiento JSON existente (comportamiento original)
      // Verificar diferentes formatos de webhook de Kommo
      let leadData = null;
      let eventType = null;
        
        // Intentar extraer lead_id de otros campos posibles
        let leadId = messageFields.lead_id;
        if (!leadId) {
          // Buscar lead_id en otros formatos
          leadId = webhookData['lead_id'] || 
                   webhookData['lead[id]'] || 
                   webhookData['entity_id'] || 
                   webhookData['element_id'] ||
                   webhookData['id'];
        }
        
        if (leadId) {
          console.log(`DEBUG - Lead ID encontrado: ${leadId}, procesando como mensaje entrante...`);
          
          // Procesar como mensaje entrante usando el lead_id
          try {
            // Obtener el lead completo desde Kommo para extraer el mensaje
            const leadResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadId}?with=messages`, {
              headers: {
                'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
              }
            });
            
            // Extraer el último mensaje del lead
            let lastMessage = null;
            if (leadResponse.data._embedded && leadResponse.data._embedded.messages) {
              const messages = leadResponse.data._embedded.messages;
              if (messages.length > 0) {
                // Ordenar por fecha y tomar el más reciente
                const sortedMessages = messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                lastMessage = sortedMessages[0];
              }
            }
            
            if (!lastMessage || !lastMessage.text) {
              return res.json({
                type: 'incoming_message_without_text',
                message: 'No se pudo obtener texto del mensaje',
                processed: false,
                leadId: leadId
              });
            }
            
            // Usar el texto del mensaje obtenido de la API
            const messageText = lastMessage.text;
            console.log(`DEBUG - Texto obtenido de API: "${messageText}"`);
            
            // Buscar frase coincidente usando las reglas existentes
            const matchingPhrase = findMatchingMessagePhrase(messageText);
            
            if (!matchingPhrase) {
              return res.json({
                type: 'no_stage_change',
                message: 'No coincide con ninguna regla',
                processed: false,
                leadId: leadId,
                text: messageText
              });
            }
            
            // Mover lead al stage_id correspondiente usando la lógica existente
            const moveResult = await moveLeadToStatus(leadId, matchingPhrase.stageId);
            
            // Logging sobrio
            console.log(`Lead ${leadId}: texto="${messageText}", movido=${moveResult.success}, stage_id=${matchingPhrase.stageId}`);
            
            return res.json({
              type: 'incoming_message',
              hasText: true,
              moved: moveResult.success,
              movedTo: moveResult.success ? matchingPhrase.stageId : null,
              phrase: matchingPhrase.phrase,
              course: matchingPhrase.course,
              leadId: leadId,
              error: moveResult.success ? null : moveResult.error
            });
            
          } catch (error) {
            console.error(`Error procesando lead ${leadId}:`, error.message);
            return res.json({
              type: 'error',
              message: 'Error procesando lead',
              processed: false,
              leadId: leadId,
              error: error.message
            });
          }
        }
        
        // Si no hay message_id y chat_id, tratar como lead agregado/editado
        return res.json({
          type: 'lead_event',
          message: 'Evento de lead (no mensaje entrante)',
          processed: false
        });
      }
      
      // Si no hay texto, intentar obtener el mensaje del lead desde la API
      if (!messageFields.text) {
        console.log(`No hay texto en webhook, obteniendo mensaje del lead ${messageFields.lead_id} desde API...`);
        
        try {
          // Obtener el lead completo desde Kommo para extraer el mensaje
          const leadResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${messageFields.lead_id}?with=messages`, {
            headers: {
              'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            }
          });
          
          // Extraer el último mensaje del lead
          let lastMessage = null;
          if (leadResponse.data._embedded && leadResponse.data._embedded.messages) {
            const messages = leadResponse.data._embedded.messages;
            if (messages.length > 0) {
              // Ordenar por fecha y tomar el más reciente
              const sortedMessages = messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              lastMessage = sortedMessages[0];
            }
          }
          
          if (!lastMessage || !lastMessage.text) {
            return res.json({
              type: 'incoming_message_without_text',
              message: 'No se pudo obtener texto del mensaje',
              processed: false,
              leadId: messageFields.lead_id
            });
          }
          
          // Usar el texto del mensaje obtenido de la API
          messageFields.text = lastMessage.text;
          console.log(`Texto obtenido de API: "${messageFields.text}"`);
          
        } catch (error) {
          console.error(`Error obteniendo mensaje del lead ${messageFields.lead_id}:`, error.message);
          return res.json({
            type: 'incoming_message_without_text',
            message: 'Error obteniendo mensaje del lead',
            processed: false,
            leadId: messageFields.lead_id,
            error: error.message
          });
        }
      }
      
      // Buscar frase coincidente usando las reglas existentes
      const matchingPhrase = findMatchingMessagePhrase(messageFields.text);
      
      if (!matchingPhrase) {
        return res.json({
          type: 'no_stage_change',
          message: 'No coincide con ninguna regla',
          processed: false,
          leadId: messageFields.lead_id,
          text: messageFields.text
        });
      }
      
      // Mover lead al stage_id correspondiente usando la lógica existente
      const moveResult = await moveLeadToStatus(
        messageFields.lead_id, 
        matchingPhrase.stageId
      );
      
      // Logging sobrio
      console.log(`Lead ${messageFields.lead_id}: texto="${messageFields.text}", movido=${moveResult.success}, stage_id=${matchingPhrase.stageId}`);
      
      return res.json({
        type: 'incoming_message',
        hasText: true,
        moved: moveResult.success,
        movedTo: moveResult.success ? matchingPhrase.stageId : null,
        phrase: matchingPhrase.phrase,
        course: matchingPhrase.course,
        leadId: messageFields.lead_id,
        error: moveResult.success ? null : moveResult.error
      });
    } else {
      // Parsear como JSON (comportamiento existente)
      webhookData = req.body;
      
      console.log('Webhook JSON recibido de Kommo:', {
        type: webhookData.type,
        lead_id: webhookData.lead?.id,
        timestamp: new Date().toISOString(),
        full_data: webhookData
      });
      
      // Continuar con el procesamiento JSON existente
      // Verificar diferentes formatos de webhook de Kommo
      let leadData = null;
      let eventType = null;
    
    // Formato 1: webhookData.lead (formato estándar)
    if (webhookData.lead) {
      leadData = webhookData.lead;
      eventType = webhookData.type;
    }
    // Formato 2: webhookData directamente
    else if (webhookData.id) {
      leadData = webhookData;
      eventType = 'lead_add'; // Asumir que es un lead nuevo
    }
    // Formato 3: webhookData.data
    else if (webhookData.data) {
      leadData = webhookData.data;
      eventType = webhookData.type || 'lead_add';
    }
    // Formato 4: webhookData.leads.update (formato de Kommo)
    else if (webhookData.leads && webhookData.leads.update && webhookData.leads.update.length > 0) {
      // Procesar cada lead en la lista de actualizaciones
      const leadsToProcess = webhookData.leads.update;
      console.log(`Procesando ${leadsToProcess.length} leads actualizados`);
      
      // Procesar cada lead individualmente
      for (const lead of leadsToProcess) {
        try {
          await processLead(lead, 'lead_update');
        } catch (error) {
          console.error(`Error procesando lead ${lead.id}:`, error);
        }
      }
      
      return res.json({
        received: true,
        processed: true,
        leads_processed: leadsToProcess.length,
        message: `Procesados ${leadsToProcess.length} leads`,
        platform: 'Vercel'
      });
    }
    // Formato 5: webhookData.leads.add (nuevos leads)
    else if (webhookData.leads && webhookData.leads.add && webhookData.leads.add.length > 0) {
      const leadsToProcess = webhookData.leads.add;
      console.log(`Procesando ${leadsToProcess.length} leads nuevos`);
      
      for (const lead of leadsToProcess) {
        try {
          await processLead(lead, 'lead_add');
        } catch (error) {
          console.error(`Error procesando lead ${lead.id}:`, error);
        }
      }
      
      return res.json({
        received: true,
        processed: true,
        leads_processed: leadsToProcess.length,
        message: `Procesados ${leadsToProcess.length} leads nuevos`,
        platform: 'Vercel'
      });
    }
    // Formato 6: webhookData.notes (eventos de notas)
    else if (webhookData.notes && webhookData.notes.add && webhookData.notes.add.length > 0) {
      const notesToProcess = webhookData.notes.add;
      console.log(`Procesando ${notesToProcess.length} notas nuevas`);
      
      for (const note of notesToProcess) {
        try {
          // Obtener el lead asociado a la nota
          const leadId = note.entity_id;
          if (leadId) {
            await processLead({ id: leadId }, 'note_add');
          }
        } catch (error) {
          console.error(`Error procesando nota ${note.id}:`, error);
        }
      }
      
      return res.json({
        received: true,
        processed: true,
        notes_processed: notesToProcess.length,
        message: `Procesadas ${notesToProcess.length} notas`,
        platform: 'Vercel'
      });
    }
    // Formato 7: webhookData.message.add (MENSAJES NUEVOS)
    else if (webhookData.message && webhookData.message.add && webhookData.message.add.length > 0) {
      const messagesToProcess = webhookData.message.add;
      console.log(`Procesando ${messagesToProcess.length} mensajes nuevos`);
      
      for (const message of messagesToProcess) {
        try {
          // Extraer el ID del lead del mensaje
          const leadId = message.element_id;
          if (leadId) {
            console.log(`Procesando mensaje para lead ${leadId}:`, message);
            await processLead({ id: leadId }, 'message_add');
          }
        } catch (error) {
          console.error(`Error procesando mensaje ${message.id}:`, error);
        }
      }
      
      return res.json({
        received: true,
        processed: true,
        messages_processed: messagesToProcess.length,
        message: `Procesados ${messagesToProcess.length} mensajes`,
        platform: 'Vercel'
      });
    }
    
    console.log('Datos procesados:', {
      eventType,
      leadData,
      hasLead: !!leadData
    });
    
    if (!leadData) {
      return res.json({ 
        received: true, 
        message: 'No se encontraron datos de lead',
        webhook_data: webhookData,
        platform: 'Vercel'
      });
    }
    
    // Verificar que es un evento de lead (más flexible)
    if (eventType && eventType !== 'lead_add' && eventType !== 'lead_update') {
      return res.json({ 
        received: true, 
        message: 'Evento no relevante',
        event_type: eventType,
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
      result = await moveLeadToStage(leadData.id, 94843344); // Etapa por defecto
    }
    
    // Marcar como procesado
    processedLeads.add(leadData.id);
    
    console.log(`Lead ${leadData.id} procesado:`, {
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94843344,
      success: result.success
    });
    
    res.json({
      received: true,
      processed: result.success,
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94843344,
      message: result.success ? 
        `Lead movido a etapa ${matchingPhrase.stageId || 94843344}` : 
        `Error moviendo lead: ${result.error}`,
      platform: 'Vercel'
    });
    } // Cierre del else para JSON parsing
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

// Obtener mapeo de frases para mensajes entrantes
app.get('/api/message-phrases', (req, res) => {
  res.json({
    success: true,
    message_phrases: MESSAGE_PHRASE_MAPPING,
    count: Object.keys(MESSAGE_PHRASE_MAPPING).length,
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

// Probar detección de frase para mensajes entrantes
app.post('/api/test-message-phrase', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texto es requerido'
      });
    }
    
    const matchingPhrase = findMatchingMessagePhrase(text);
    
    res.json({
      success: true,
      text: text,
      matched: !!matchingPhrase,
      phrase: matchingPhrase,
      available_phrases: Object.keys(MESSAGE_PHRASE_MAPPING),
      platform: 'Vercel'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error probando frase de mensaje',
      details: error.message
    });
  }
});

// Endpoint para probar webhook manualmente
app.post('/api/test-webhook', async (req, res) => {
  try {
    const { lead_id } = req.body;
    
    if (!lead_id) {
      return res.status(400).json({
        success: false,
        error: 'lead_id es requerido'
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
        success: false,
        message: 'No se encontró frase coincidente',
        lead_data: leadData,
        extracted_text: extractTextFromLead(leadData)
      });
    }
    
    // Mover lead a etapa específica
    let result;
    if (matchingPhrase.stageId) {
      result = await moveLeadToStage(leadData.id, matchingPhrase.stageId);
    } else {
      result = await moveLeadToStage(leadData.id, 94843344);
    }
    
    res.json({
      success: true,
      lead_id: leadData.id,
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94843344,
      move_result: result,
      extracted_text: extractTextFromLead(leadData)
    });
  } catch (error) {
    console.error('Error probando webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Error probando webhook',
      details: error.message
    });
  }
});

// Endpoint para probar conexión con Kommo
app.get('/api/test-kommo-connection', async (req, res) => {
  try {
    console.log('Probando conexión con Kommo...');
    
    // Probar endpoint de cuenta
    const accountResponse = await axios.get(`${KOMMO_CONFIG.baseURL}/account`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Probar endpoint de leads
    const leadsResponse = await axios.get(`${KOMMO_CONFIG.baseURL}/leads?limit=1`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      account: accountResponse.data,
      leads: leadsResponse.data,
      message: 'Conexión con Kommo exitosa'
    });
  } catch (error) {
    console.error('Error probando conexión con Kommo:', error);
    res.status(500).json({
      success: false,
      error: 'Error conectando con Kommo',
      details: error.message,
      status: error.response?.status
    });
  }
});

// Endpoint para simular webhook de Kommo
app.post('/api/simulate-webhook', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texto es requerido'
      });
    }
    
    // Simular datos de webhook de Kommo
    const webhookData = {
      type: 'lead_add',
      lead: {
        id: 'sim-' + Date.now(),
        name: `Lead de prueba: ${text}`,
        contacts: [{
          name: 'Test User',
          first_name: 'Test',
          last_name: 'User'
        }],
        custom_fields_values: [{
          values: [{ value: text }]
        }]
      }
    };
    
    // Procesar como si fuera un webhook real
    const leadData = webhookData.lead;
    const matchingPhrase = findMatchingPhrase(leadData);
    
    if (!matchingPhrase) {
      return res.json({
        success: false,
        message: 'No se encontró frase coincidente',
        webhook_data: webhookData,
        extracted_text: extractTextFromLead(leadData)
      });
    }
    
    res.json({
      success: true,
      webhook_data: webhookData,
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      stageId: matchingPhrase.stageId || 94843344,
      extracted_text: extractTextFromLead(leadData),
      message: `El lead se movería a la etapa ${matchingPhrase.stageId || 94843344}`
    });
  } catch (error) {
    console.error('Error simulando webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Error simulando webhook',
      details: error.message
    });
  }
});

// Endpoint para probar obtención de mensajes de un lead
app.get('/api/test-lead-messages/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    
    console.log(`Obteniendo mensajes del lead ${leadId}...`);
    
    // Obtener el lead completo desde Kommo
    const leadResponse = await axios.get(`${KOMMO_CONFIG.messagesURL}/leads/${leadId}?with=messages`, {
      headers: {
        'Authorization': `Bearer ${KOMMO_CONFIG.messagesToken}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    // Extraer mensajes
    let messages = [];
    if (leadResponse.data._embedded && leadResponse.data._embedded.messages) {
      messages = leadResponse.data._embedded.messages;
      // Ordenar por fecha
      messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    res.json({
      success: true,
      leadId: leadId,
      messages: messages,
      lastMessage: messages.length > 0 ? messages[0] : null,
      count: messages.length
    });
  } catch (error) {
    console.error('Error obteniendo mensajes del lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo mensajes del lead',
      details: error.message
    });
  }
});

// Endpoint para simular webhook de mensaje entrante (URL-encoded)
app.post('/api/simulate-message-webhook', (req, res) => {
  try {
    const { text, lead_id = 'test-lead-123', subdomain = 'dotscomagency' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texto es requerido'
      });
    }
    
    // Simular datos de webhook URL-encoded de mensaje entrante
    const webhookData = {
      'account[subdomain]': subdomain,
      'message[add][0][id]': 'msg-' + Date.now(),
      'message[add][0][chat_id]': 'chat-' + Date.now(),
      'message[add][0][element_id]': lead_id,
      'message[add][0][text]': text
    };
    
    // Simular el procesamiento como si fuera un webhook real
    const messageFields = extractMessageFields(webhookData);
    const matchingPhrase = findMatchingMessagePhrase(messageFields.text);
    
    if (!matchingPhrase) {
      return res.json({
        success: true,
        type: 'no_stage_change',
        message: 'No coincide con ninguna regla',
        processed: false,
        leadId: messageFields.lead_id,
        text: messageFields.text,
        available_phrases: Object.keys(MESSAGE_PHRASE_MAPPING)
      });
    }
    
    res.json({
      success: true,
      type: 'incoming_message',
      hasText: true,
      moved: true, // Simulado
      movedTo: matchingPhrase.stageId,
      phrase: matchingPhrase.phrase,
      course: matchingPhrase.course,
      leadId: messageFields.lead_id,
      text: messageFields.text,
      message: `El lead se movería al stage_id ${matchingPhrase.stageId}`
    });
  } catch (error) {
    console.error('Error simulando webhook de mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error simulando webhook de mensaje',
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