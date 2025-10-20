const express = require('express');
const router = express.Router();
const database = require('../config/database');
const logger = require('../utils/logger');
const Joi = require('joi');

// Esquema de validación para frases
const phraseSchema = Joi.object({
  phrase: Joi.string().min(1).max(500).required(),
  funnel_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional()
});

// Obtener todas las frases
router.get('/', async (req, res) => {
  try {
    const phrases = await database.all(`
      SELECT lp.*, f.name as funnel_name 
      FROM lead_phrases lp 
      LEFT JOIN funnels f ON lp.funnel_id = f.id 
      ORDER BY lp.created_at DESC
    `);
    
    res.json(phrases);
  } catch (error) {
    logger.error('Error obteniendo frases:', error);
    res.status(500).json({ error: 'Error obteniendo frases' });
  }
});

// Obtener una frase específica
router.get('/:id', async (req, res) => {
  try {
    const phrase = await database.get(`
      SELECT lp.*, f.name as funnel_name 
      FROM lead_phrases lp 
      LEFT JOIN funnels f ON lp.funnel_id = f.id 
      WHERE lp.id = ?
    `, [req.params.id]);
    
    if (!phrase) {
      return res.status(404).json({ error: 'Frase no encontrada' });
    }
    
    res.json(phrase);
  } catch (error) {
    logger.error('Error obteniendo frase:', error);
    res.status(500).json({ error: 'Error obteniendo frase' });
  }
});

// Crear nueva frase
router.post('/', async (req, res) => {
  try {
    const { error, value } = phraseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.details 
      });
    }

    // Verificar que el embudo existe si se proporciona
    if (value.funnel_id) {
      const funnel = await database.get('SELECT id FROM funnels WHERE id = ? AND is_active = 1', [value.funnel_id]);
      if (!funnel) {
        return res.status(400).json({ error: 'El embudo especificado no existe o está inactivo' });
      }
    }

    const result = await database.run(`
      INSERT INTO lead_phrases (phrase, funnel_id, is_active)
      VALUES (?, ?, ?)
    `, [value.phrase, value.funnel_id || null, value.is_active !== false ? 1 : 0]);

    logger.info(`Nueva frase creada con ID: ${result.id}`);
    
    // Obtener la frase creada con información del embudo
    const newPhrase = await database.get(`
      SELECT lp.*, f.name as funnel_name 
      FROM lead_phrases lp 
      LEFT JOIN funnels f ON lp.funnel_id = f.id 
      WHERE lp.id = ?
    `, [result.id]);

    res.status(201).json(newPhrase);
  } catch (error) {
    logger.error('Error creando frase:', error);
    res.status(500).json({ error: 'Error creando frase' });
  }
});

// Actualizar frase
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = phraseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.details 
      });
    }

    // Verificar que la frase existe
    const existingPhrase = await database.get('SELECT id FROM lead_phrases WHERE id = ?', [req.params.id]);
    if (!existingPhrase) {
      return res.status(404).json({ error: 'Frase no encontrada' });
    }

    // Verificar que el embudo existe si se proporciona
    if (value.funnel_id) {
      const funnel = await database.get('SELECT id FROM funnels WHERE id = ? AND is_active = 1', [value.funnel_id]);
      if (!funnel) {
        return res.status(400).json({ error: 'El embudo especificado no existe o está inactivo' });
      }
    }

    await database.run(`
      UPDATE lead_phrases 
      SET phrase = ?, funnel_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [value.phrase, value.funnel_id || null, value.is_active !== false ? 1 : 0, req.params.id]);

    logger.info(`Frase actualizada con ID: ${req.params.id}`);
    
    // Obtener la frase actualizada
    const updatedPhrase = await database.get(`
      SELECT lp.*, f.name as funnel_name 
      FROM lead_phrases lp 
      LEFT JOIN funnels f ON lp.funnel_id = f.id 
      WHERE lp.id = ?
    `, [req.params.id]);

    res.json(updatedPhrase);
  } catch (error) {
    logger.error('Error actualizando frase:', error);
    res.status(500).json({ error: 'Error actualizando frase' });
  }
});

// Eliminar frase
router.delete('/:id', async (req, res) => {
  try {
    const result = await database.run('DELETE FROM lead_phrases WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Frase no encontrada' });
    }

    logger.info(`Frase eliminada con ID: ${req.params.id}`);
    res.json({ message: 'Frase eliminada correctamente' });
  } catch (error) {
    logger.error('Error eliminando frase:', error);
    res.status(500).json({ error: 'Error eliminando frase' });
  }
});

// Activar/desactivar frase
router.patch('/:id/toggle', async (req, res) => {
  try {
    const phrase = await database.get('SELECT id, is_active FROM lead_phrases WHERE id = ?', [req.params.id]);
    
    if (!phrase) {
      return res.status(404).json({ error: 'Frase no encontrada' });
    }

    const newStatus = phrase.is_active ? 0 : 1;
    
    await database.run(`
      UPDATE lead_phrases 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, req.params.id]);

    logger.info(`Frase ${newStatus ? 'activada' : 'desactivada'} con ID: ${req.params.id}`);
    
    res.json({ 
      message: `Frase ${newStatus ? 'activada' : 'desactivada'} correctamente`,
      is_active: newStatus
    });
  } catch (error) {
    logger.error('Error cambiando estado de frase:', error);
    res.status(500).json({ error: 'Error cambiando estado de frase' });
  }
});

// Buscar frases que coincidan con un texto
router.post('/search', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto de búsqueda es requerido' });
    }

    const phrases = await database.all(`
      SELECT lp.*, f.name as funnel_name 
      FROM lead_phrases lp 
      LEFT JOIN funnels f ON lp.funnel_id = f.id 
      WHERE lp.is_active = 1 AND lp.phrase LIKE ?
      ORDER BY lp.created_at DESC
    `, [`%${text.toLowerCase()}%`]);

    res.json(phrases);
  } catch (error) {
    logger.error('Error buscando frases:', error);
    res.status(500).json({ error: 'Error buscando frases' });
  }
});

module.exports = router;
