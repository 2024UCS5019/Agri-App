const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const path = require('node:path');

const dbPath = path.join(__dirname, 'agri_users.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and reliability
db.exec('PRAGMA journal_mode = WAL;');

// ═══════════════════════════════════════════════════════════
//  STEP 1: DATABASE SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Owner',
    phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
`);

// Prepared statement helpers
const stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtFindById = db.prepare('SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?');
const stmtInsertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, name, role, phone, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const stmtCountUsers = db.prepare('SELECT COUNT(*) as count FROM users');

// No demo accounts seeded - only real signups
async function seedDefaultAccounts() {
  // Empty - no demo accounts created
}

module.exports = {
  db,
  findUserByEmail: (email) => stmtFindByEmail.get(email.toLowerCase().trim()),
  findUserById: (id) => stmtFindById.get(id),
  createUser: ({ id, email, passwordHash, name, role, phone }) => {
    const now = new Date().toISOString();
    return stmtInsertUser.run(
      id || crypto.randomUUID(),
      email.toLowerCase().trim(),
      passwordHash,
      name,
      role || 'Owner',
      phone || '',
      now,
      now
    );
  },
  seedDefaultAccounts
};
