import { verifyToken } from '../auth/jwt.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/** Attaches req.authUser if a valid bearer token is present; leaves it undefined otherwise (guest). Never rejects. */
export function optionalAuthenticate(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.authUser = { id: payload.sub, role: payload.role };
    } catch {
      // invalid/expired token — treat as guest rather than erroring, per SRS guest-mode logic
    }
  }
  next();
}

/** Requires a valid bearer token; 401s otherwise. */
export function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = verifyToken(token);
    req.authUser = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
