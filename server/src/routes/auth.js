import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { createToken } from '../lib/auth.js';
import { requireEmail, requireString, ValidationError } from '../lib/validation.js';

const router = Router();
const userFields = { id: true, email: true, role: true, createdAt: true };

function sendAuth(response, user) {
  response.status(201).json({ user, token: createToken(user) });
}

router.post('/register', async (request, response, next) => {
  try {
    const email = requireEmail(request.body.email);
    const password = requireString(request.body.password, 'Password', { min: 8, max: 100 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return response.status(409).json({ message: 'An account with this email already exists.' });
    const user = await prisma.user.create({ data: { email, password: await bcrypt.hash(password, 12) }, select: userFields });
    return sendAuth(response, user);
  } catch (error) { return next(error); }
});

router.post('/login', async (request, response, next) => {
  try {
    const email = requireEmail(request.body.email);
    const password = requireString(request.body.password, 'Password', { min: 1, max: 100 });
    const record = await prisma.user.findUnique({ where: { email } });
    if (!record || !(await bcrypt.compare(password, record.password))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return response.json({ user: { id: record.id, email: record.email, role: record.role, createdAt: record.createdAt }, token: createToken(record) });
  } catch (error) { return next(error); }
});

router.use((error, _request, response, next) => {
  if (error instanceof ValidationError) return response.status(400).json({ message: error.message });
  return next(error);
});

export default router;
