import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export async function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) return response.status(401).json({ message: 'Please sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true } });
    if (!user) return response.status(401).json({ message: 'Your session is no longer valid.' });
    request.user = user;
    next();
  } catch {
    return response.status(401).json({ message: 'Your session is invalid or expired.' });
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'ADMIN') return response.status(403).json({ message: 'Administrator access is required.' });
  return next();
}
