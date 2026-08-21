import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { signToken } from '../auth/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

export function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, authProvider: user.authProvider };
}

export async function registerWithEmail(email, password, name) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: 'user', authProvider: 'email' },
  });
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function loginWithEmail(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid email or password.');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid email or password.');
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function upsertOAuthUser(provider, oauthId, email, name) {
  const user = await prisma.user.upsert({
    where: { authProvider_oauthId: { authProvider: provider, oauthId } },
    update: { email: email ?? undefined, name: name ?? undefined },
    create: { authProvider: provider, oauthId, email, name, role: 'user' },
  });
  return { user: toPublicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'User not found.');
  return toPublicUser(user);
}
