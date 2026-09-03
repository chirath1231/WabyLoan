import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { newId } from '../lib/id.js';
import { signToken } from '../auth/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

export function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, authProvider: user.authProvider };
}

export async function registerWithEmail(email, password, name) {
  const { rows: existingRows } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingRows[0]) throw new HttpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (id, email, "passwordHash", name, role, "authProvider")
     VALUES ($1, $2, $3, $4, 'user', 'email')
     RETURNING *`,
    [newId(), email, passwordHash, name],
  );
  const user = rows[0];
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function loginWithEmail(email, password) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid email or password.');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid email or password.');
  if (!user.active) throw new HttpError(403, 'This account has been deactivated.');
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function upsertOAuthUser(provider, oauthId, email, name) {
  const { rows } = await query(
    `INSERT INTO users (id, "authProvider", "oauthId", email, name, role)
     VALUES ($1, $2, $3, $4, $5, 'user')
     ON CONFLICT ("authProvider", "oauthId") DO UPDATE SET
       email = COALESCE(EXCLUDED.email, users.email),
       name = COALESCE(EXCLUDED.name, users.name),
       "updatedAt" = now()
     RETURNING *`,
    [newId(), provider, oauthId, email ?? null, name ?? null],
  );
  const user = rows[0];
  if (!user.active) throw new HttpError(403, 'This account has been deactivated.');
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function getUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  const user = rows[0];
  if (!user) throw new HttpError(404, 'User not found.');
  return toPublicUser(user);
}
