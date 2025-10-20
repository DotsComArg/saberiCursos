const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DATABASE_URL || './database.sqlite';
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Error conectando a la base de datos:', err);
          reject(err);
        } else {
          logger.info('Conectado a la base de datos SQLite');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Tabla para frases de leads
      `CREATE TABLE IF NOT EXISTS lead_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phrase TEXT NOT NULL,
        funnel_id INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla para embudos de destino
      `CREATE TABLE IF NOT EXISTS funnels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        webhook_url TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla para configuración de Kommo
      `CREATE TABLE IF NOT EXISTS kommo_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at DATETIME,
        webhook_secret TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla para logs de leads procesados
      `CREATE TABLE IF NOT EXISTS lead_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kommo_lead_id INTEGER,
        phrase_matched TEXT,
        funnel_id INTEGER,
        status TEXT DEFAULT 'pending',
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        response_data TEXT,
        processing_method TEXT DEFAULT 'direct'
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }
    
    logger.info('Tablas de base de datos creadas correctamente');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Error ejecutando query:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Error obteniendo datos:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Error obteniendo todos los datos:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          logger.error('Error cerrando base de datos:', err);
          reject(err);
        } else {
          logger.info('Base de datos cerrada correctamente');
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
