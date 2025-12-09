import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'results.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Promisify database methods
db.run = promisify(db.run.bind(db));
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));

// Initialize database schema
async function initializeDatabase() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rollno TEXT NOT NULL UNIQUE,
        dob TEXT NOT NULL,
        whatsapp TEXT,
        email TEXT,
        status TEXT DEFAULT 'IN_PROGRESS',
        result_html TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        result_released_at DATETIME
      )
    `);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// User operations
export const userDb = {
  async create(userData) {
    const { name, rollno, dob, whatsapp, email } = userData;
    const result = await db.run(
      `INSERT INTO users (name, rollno, dob, whatsapp, email, status) 
       VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS')`,
      [name, rollno, dob, whatsapp || null, email || null]
    );
    return { id: result.lastID, ...userData, status: 'IN_PROGRESS' };
  },

  async findByRollno(rollno) {
    return await db.get('SELECT * FROM users WHERE rollno = ?', [rollno]);
  },

  async findById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  },

  async getAll() {
    return await db.all('SELECT * FROM users ORDER BY created_at DESC');
  },

  async updateStatus(id, status, resultHtml = null) {
    const updatedAt = new Date().toISOString();
    if (status === 'RESULT_RELEASED' && resultHtml) {
      await db.run(
        `UPDATE users SET status = ?, result_html = ?, updated_at = ?, result_released_at = ? WHERE id = ?`,
        [status, resultHtml, updatedAt, updatedAt, id]
      );
    } else {
      await db.run(
        `UPDATE users SET status = ?, updated_at = ? WHERE id = ?`,
        [status, updatedAt, id]
      );
    }
  },

  async getAllActive() {
    return await db.all("SELECT * FROM users WHERE status = 'IN_PROGRESS'");
  }
};

export default db;

