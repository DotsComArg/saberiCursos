const axios = require('axios');
const logger = require('../utils/logger');

class KommoService {
  constructor() {
    this.baseURL = 'https://tu-dominio.kommo.com/api/v4';
    this.clientId = process.env.KOMMO_CLIENT_ID;
    this.clientSecret = process.env.KOMMO_CLIENT_SECRET;
    this.redirectUri = process.env.KOMMO_REDIRECT_URI;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Obtener URL de autorización
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'crm'
    });
    
    return `https://tu-dominio.kommo.com/oauth/authorize?${params.toString()}`;
  }

  // Intercambiar código por token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://tu-dominio.kommo.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      logger.info('Token de acceso obtenido correctamente');
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Refrescar token
  async refreshAccessToken() {
    try {
      const response = await axios.post('https://tu-dominio.kommo.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      logger.info('Token refrescado correctamente');
      return response.data;
    } catch (error) {
      logger.error('Error refrescando token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Hacer request autenticado a la API
  async makeRequest(method, endpoint, data = null) {
    if (!this.accessToken) {
      throw new Error('No hay token de acceso disponible');
    }

    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expirado, intentar refrescar
        await this.refreshAccessToken();
        return this.makeRequest(method, endpoint, data);
      }
      
      logger.error('Error en request a Kommo:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener información de un lead
  async getLead(leadId) {
    return this.makeRequest('GET', `/leads/${leadId}`);
  }

  // Obtener todos los leads
  async getLeads(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest('GET', `/leads?${queryParams.toString()}`);
  }

  // Crear un nuevo lead
  async createLead(leadData) {
    return this.makeRequest('POST', '/leads', leadData);
  }

  // Actualizar un lead
  async updateLead(leadId, leadData) {
    return this.makeRequest('PATCH', `/leads/${leadId}`, leadData);
  }

  // Obtener contactos
  async getContacts(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest('GET', `/contacts?${queryParams.toString()}`);
  }

  // Obtener información de la cuenta
  async getAccount() {
    return this.makeRequest('GET', '/account');
  }

  // Configurar webhook
  async setWebhook(webhookUrl, events = ['lead_add', 'lead_update']) {
    const webhookData = {
      destination: webhookUrl,
      settings: {
        active: true,
        events: events
      }
    };

    return this.makeRequest('POST', '/webhooks', webhookData);
  }

  // Obtener webhooks configurados
  async getWebhooks() {
    return this.makeRequest('GET', '/webhooks');
  }

  // Eliminar webhook
  async deleteWebhook(webhookId) {
    return this.makeRequest('DELETE', `/webhooks/${webhookId}`);
  }
}

module.exports = new KommoService();
