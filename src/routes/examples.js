const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Ruta para datos de ejemplo (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  
  // Crear datos de ejemplo
  router.post('/seed', async (req, res) => {
    try {
      // Crear embudos de ejemplo
      const funnel1 = await database.run(`
        INSERT INTO funnels (name, webhook_url, description, is_active)
        VALUES (?, ?, ?, ?)
      `, [
        'Embudo Marketing Digital',
        'https://webhook.site/unique-id-1',
        'Embudo para leads de marketing digital',
        1
      ]);

      const funnel2 = await database.run(`
        INSERT INTO funnels (name, webhook_url, description, is_active)
        VALUES (?, ?, ?, ?)
      `, [
        'Embudo Ventas',
        'https://webhook.site/unique-id-2',
        'Embudo para leads de ventas',
        1
      ]);

      // Crear frases de ejemplo
      const phrases = [
        ['curso de marketing digital', funnel1.id],
        ['marketing digital', funnel1.id],
        ['capacitación en marketing', funnel1.id],
        ['quiero aprender marketing', funnel1.id],
        ['curso de ventas', funnel2.id],
        ['técnicas de venta', funnel2.id],
        ['capacitación en ventas', funnel2.id],
        ['quiero mejorar mis ventas', funnel2.id]
      ];

      for (const [phrase, funnelId] of phrases) {
        await database.run(`
          INSERT INTO lead_phrases (phrase, funnel_id, is_active)
          VALUES (?, ?, ?)
        `, [phrase, funnelId, 1]);
      }

      res.json({
        success: true,
        message: 'Datos de ejemplo creados correctamente',
        funnels: 2,
        phrases: phrases.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error creando datos de ejemplo',
        details: error.message
      });
    }
  });

  // Limpiar datos de ejemplo
  router.delete('/seed', async (req, res) => {
    try {
      await database.run('DELETE FROM lead_phrases');
      await database.run('DELETE FROM funnels');
      await database.run('DELETE FROM lead_logs');
      
      res.json({
        success: true,
        message: 'Datos de ejemplo eliminados correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error eliminando datos de ejemplo',
        details: error.message
      });
    }
  });
}

module.exports = router;
