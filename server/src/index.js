import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import menuItemRoutes from './routes/menu-items.js';
import orderRoutes from './routes/orders.js';
import prisma from './lib/prisma.js';

export const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This browser origin is not allowed.'));
  },
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again shortly.' },
}));

app.get('/api/health', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found.' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Request body must be valid JSON.' });
  }
  response.status(500).json({ message: 'Something went wrong. Please try again.' });
});

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    console.log(`FoodFlow API listening on http://localhost:${port}`);
  });

  const stop = async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
