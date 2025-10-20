const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');
const Joi = require('joi');

// Esquema de validación para embudos
const funnelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  webhook_url: Joi.string().uri().required(),
  description: Joi.string().max(500).optional(),
  is_active: Joi.boolean().optional()
});

// Obtener todos los embudos
router.get('/', async (req, res) => {
  try {
    const funnels = await database.all(`
      SELECT f.*, COUNT(lp.id) as phrase_count
      FROM funnels f 
      LEFT JOIN lead_phrases lp ON f.id = lp.funnel_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);
    
    res.json(funnels);
  } catch (error) {
    logger.error('Error obteniendo embudos:', error);
    res.status(500).json({ error: 'Error obteniendo embudos' });
  }
});

// Obtener un embudo específico
router.get('/:id', async (req, res) => {
  try {
    const funnel = await database.get('SELECT * FROM funnels WHERE id = ?', [req.params.id]);
    
    if (!funnel) {
      return res.status(404).json({ error: 'Embudo no encontrado' });
    }
    
    // Obtener frases asociadas
    const phrases = await database.all(`
      SELECT * FROM lead_phrases 
      WHERE funnel_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `, [req.params.id]);
    
    res.json({ ...funnel, phrases });
  } catch (error) {
    logger.error('Error obteniendo embudo:', error);
    res.status(500).json({ error: 'Error obteniendo embudo' });
  }
});

// Crear nuevo embudo
router.post('/', async (req, res) => {
  try {
    const { error, value } = funnelSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.details 
      });
    }

    const result = await database.run(`
      INSERT INTO funnels (name, webhook_url, description, is_active)
      VALUES (?, ?, ?, ?)
    `, [
      value.name, 
      value.webhook_url, 
      value.description || null, 
      value.is_active !== false ? 1 : 0
    ]);

    logger.info(`Nuevo embudo creado con ID: ${result.id}`);
    
    const newFunnel = await database.get('SELECT * FROM funnels WHERE id = ?', [result.id]);
    res.status(201).json(newFunnel);
  } catch (error) {
    logger.error('Error creando embudo:', error);
    res.status(500).json({ error: 'Error creando embudo' });
  }
});

// Actualizar embudo
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = funnelSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.details 
      });
    }

    // Verificar que el embudo existe
    const existingFunnel = await database.get('SELECT id FROM funnels WHERE id = ?', [req.params.id]);
    if (!existingFunnel) {
      return res.status(404).json({ error: 'Embudo no encontrado' });
    }

    await database.run(`
      UPDATE funnels 
      SET name = ?, webhook_url = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      value.name, 
      value.webhook_url, 
      value.description || null, 
      value.is_active !== false ? 1 : 0, 
      req.params.id
    ]);

    logger.info(`Embudo actualizado con ID: ${req.params.id}`);
    
    const updatedFunnel = await database.get('SELECT * FROM funnels WHERE id = ?', [req.params.id]);
    res.json(updatedFunnel);
  } catch (error) {
    logger.error('Error actualizando embudo:', error);
    res.status(500).json({ error: 'Error actualizando embudo' });
  }
});

// Eliminar embudo
router.delete('/:id', async (req, res) => {
  try {
    // Verificar que no hay frases asociadas
    const phrasesCount = await database.get(`
      SELECT COUNT(*) as count FROM lead_phrases WHERE funnel_id = ?
    `, [req.params.id]);
    
    if (phrasesCount.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el embudo porque tiene frases asociadas',
        phrases_count: phrasesCount.count
      });
    }

    const result = await database.run('DELETE FROM funnels WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Embudo no encontrado' });
    }

    logger.info(`Embudo eliminado con ID: ${req.params.id}`);
    res.json({ message: 'Embudo eliminado correctamente' });
  } catch (error) {
    logger.error('Error eliminando embudo:', error);
    res.status(500).json({ error: 'Error eliminando embudo' });
  }
});

// Activar/desactivar embudo
router.patch('/:id/toggle', async (req, res) => {
  try {
    const funnel = await database.get('SELECT id, is_active FROM funnels WHERE id = ?', [req.params.id]);
    
    if (!funnel) {
      return res.status(404).json({ error: 'Embudo no encontrado' });
    }

    const newStatus = funnel.is_active ? 0 : 1;
    
    await database.run(`
      UPDATE funnels 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, req.params.id]);

    logger.info(`Embudo ${newStatus ? 'activado' : 'desactivado'} con ID: ${req.params.id}`);
    
    res.json({ 
      message: `Embudo ${newStatus ? 'activado' : 'desactivado'} correctamente`,
      is_active: newStatus
    });
  } catch (error) {
    logger.error('Error cambiando estado de embudo:', error);
    res.status(500).json({ error: 'Error cambiando estado de embudo' });
  }
});

// Probar webhook del embudo
router.post('/:id/test', async (req, res) => {
  try {
    const funnel = await database.get('SELECT * FROM funnels WHERE id = ?', [req.params.id]);
    
    if (!funnel) {
      return res.status(404).json({ error: 'Embudo no encontrado' });
    }

    const axios = require('axios');
    
    // Datos de prueba
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      funnel_id: funnel.id,
      funnel_name: funnel.name,
      message: 'Esta es una prueba del webhook'
    };

    try {
      const response = await axios.post(funnel.webhook_url, testData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Saberi-Lead-Manager/1.0'
        }
      });

      logger.info(`Webhook del embudo ${funnel.id} probado exitosamente`);
      
      res.json({
        success: true,
        message: 'Webhook probado exitosamente',
        status: response.status,
        response_data: response.data
      });
    } catch (webhookError) {
      logger.error(`Error probando webhook del embudo ${funnel.id}:`, webhookError.message);
      
      res.status(400).json({
        success: false,
        message: 'Error probando webhook',
        error: webhookError.message,
        status: webhookError.response?.status
      });
    }
  } catch (error) {
    logger.error('Error probando webhook:', error);
    res.status(500).json({ error: 'Error probando webhook' });
  }
});

module.exports = router;
