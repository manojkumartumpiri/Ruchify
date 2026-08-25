import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requireNumber, requireString, ValidationError } from '../lib/validation.js';

const router = Router();

function restaurantData(body) {
  return {
    name: requireString(body.name, 'Name', { min: 2, max: 100 }),
    cuisine: requireString(body.cuisine, 'Cuisine', { min: 2, max: 60 }),
    rating: requireNumber(body.rating ?? 0, 'Rating', { min: 0, max: 5 }),
    deliveryMins: requireNumber(body.deliveryMins, 'Delivery time', { min: 5, max: 180 }),
    imageUrl: body.imageUrl ? requireString(body.imageUrl, 'Image URL', { min: 5, max: 500 }) : null,
  };
}

router.get('/', async (request, response, next) => {
  try {
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    const cuisine = typeof request.query.cuisine === 'string' ? request.query.cuisine.trim() : '';
    const sort = request.query.sort === 'delivery' ? 'delivery' : request.query.sort === 'name' ? 'name' : 'rating';
    const where = {
      ...(cuisine ? { cuisine: { equals: cuisine, mode: 'insensitive' } } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { cuisine: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const orderBy = sort === 'delivery' ? { deliveryMins: 'asc' } : sort === 'name' ? { name: 'asc' } : { rating: 'desc' };
    const restaurants = await prisma.restaurant.findMany({ where, orderBy });
    response.json({ restaurants });
  } catch (error) { next(error); }
});

router.get('/meta/cuisines', async (_request, response, next) => {
  try {
    const rows = await prisma.restaurant.findMany({ select: { cuisine: true }, distinct: ['cuisine'], orderBy: { cuisine: 'asc' } });
    response.json({ cuisines: rows.map((row) => row.cuisine) });
  } catch (error) { next(error); }
});

router.get('/:id', async (request, response, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: request.params.id },
      include: { menuItems: { where: { isAvailable: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
    });
    if (!restaurant) return response.status(404).json({ message: 'Restaurant not found.' });
    return response.json({ restaurant });
  } catch (error) { return next(error); }
});

router.post('/', requireAuth, requireAdmin, async (request, response, next) => {
  try { response.status(201).json({ restaurant: await prisma.restaurant.create({ data: restaurantData(request.body) }) }); } catch (error) { next(error); }
});

router.patch('/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try { response.json({ restaurant: await prisma.restaurant.update({ where: { id: request.params.id }, data: restaurantData(request.body) }) }); } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try { await prisma.restaurant.delete({ where: { id: request.params.id } }); response.status(204).end(); } catch (error) { next(error); }
});

router.use((error, _request, response, next) => {
  if (error instanceof ValidationError) return response.status(400).json({ message: error.message });
  if (error.code === 'P2025') return response.status(404).json({ message: 'Restaurant not found.' });
  return next(error);
});

export default router;
