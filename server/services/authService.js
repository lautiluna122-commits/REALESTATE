import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { TENANT_ROLE } from '../../src/platform/tenantModel.js';

const db = getDb();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const PASSWORD_KEYLEN = 64;

export function ensureAuthSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_credentials (
      userId TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      revokedAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(tokenHash);
  `);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

function verifyPassword(password, encoded) {
  const [, salt, digest] = String(encoded).split(':');
  if (!salt || !digest) return false;
  const derived = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  const expected = Buffer.from(digest, 'hex');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export function createUser({ companyId = null, name, email, password, role = TENANT_ROLE.VIEWER, status = 'ACTIVE' }) {
  ensureAuthSchema();
  if (!name || !email || !password || !role) throw new Error('name, email, password and role are required');
  if (!Object.values(TENANT_ROLE).includes(role)) throw new Error(`Unsupported role: ${role}`);
  if (role !== TENANT_ROLE.SUPER_ADMIN && role !== TENANT_ROLE.PUBLIC && !companyId) throw new Error('companyId is required for tenant users');
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO users (id, companyId, name, email, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, companyId, name, email.toLowerCase(), role, status, createdAt);
  db.prepare('INSERT INTO auth_credentials (userId, passwordHash) VALUES (?, ?)').run(id, hashPassword(password));
  return { id, companyId, name, email: email.toLowerCase(), role, status, createdAt };
}

export function authenticateUser(email, password) {
  ensureAuthSchema();
  const user = db.prepare('SELECT id, companyId, name, email, role, status, createdAt FROM users WHERE email = ? LIMIT 1').get(String(email || '').trim().toLowerCase());
  if (!user || user.status !== 'ACTIVE') return null;
  const credentials = db.prepare('SELECT passwordHash FROM auth_credentials WHERE userId = ?').get(user.id);
  if (!credentials || !verifyPassword(password || '', credentials.passwordHash)) return null;
  return user;
}

export function createSession(userId) {
  ensureAuthSchema();
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO auth_sessions (id, userId, tokenHash, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), userId, hashToken(token), expiresAt, now.toISOString());
  return { token, expiresAt };
}

export function getSessionUser(token) {
  ensureAuthSchema();
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.companyId, u.name, u.email, u.role, u.status, u.createdAt, s.expiresAt
    FROM auth_sessions s INNER JOIN users u ON u.id = s.userId
    WHERE s.tokenHash = ? AND s.revokedAt IS NULL AND s.expiresAt > ? AND u.status = 'ACTIVE'
    LIMIT 1
  `).get(hashToken(token), new Date().toISOString());
  return row ? { ...row } : null;
}

export function revokeSession(token) {
  ensureAuthSchema();
  if (!token) return;
  db.prepare('UPDATE auth_sessions SET revokedAt = ? WHERE tokenHash = ?').run(new Date().toISOString(), hashToken(token));
}

export function ensureBootstrapAdmin() {
  ensureAuthSchema();
  const email = process.env.REALESTATE_ADMIN_EMAIL;
  const password = process.env.REALESTATE_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const existing = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(email.toLowerCase());
  if (existing) return existing.id;
  return createUser({ name: 'REALESTATE Owner', email, password, role: TENANT_ROLE.SUPER_ADMIN });
}

ensureAuthSchema();
ensureBootstrapAdmin();
