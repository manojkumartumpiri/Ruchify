import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requireId, requireNumber, requireString, ValidationError } from '../lib/validation.js';

const router = Router();

function menuItemData(body) {
  if (typeof body.isAvailable !== 'undefined' && typeof body.isAvailable !== 'boolean') throw new ValidationError('Availability must be true or false.');
  return {
    name: requireString(body.name, 'Name', { min: 2, max: 100 }),
    description: requireString(body.description, 'Description', { min: 2, max: 500 }),
    price: requireNumber(body.price, 'Price', { min: 1, max: 100000 }),
    category: requireString(body.category, 'Category', { min: 2, max: 60 }),
    imageUrl: body.imageUrl ? requireString(body.imageUrl, 'Image URL', { min: 5, max: 500 }) : null,
    isAvailable: body.isAvailable ?? true,
    restaurantId: requireId(body.restaurantId, 'Restaurant'),
  };
}

router.get('/', async (request, response, next) => {
  try {
    const where = request.query.restaurantId ? { restaurantId: requireId(request.query.restaurantId, 'Restaurant') } : {};
    const menuItems = await prisma.menuItem.findMany({ where, include: { restaurant: true }, orderBy: { name: 'asc' } });
    response.json({ menuItems });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, async (request, response, next) => {
  try { response.status(201).json({ menuItem: await prisma.menuItem.create({ data: menuItemData(request.body) }) }); } catch (error) { next(error); }
});

router.patch('/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try { response.json({ menuItem: await prisma.menuItem.update({ where: { id: request.params.id }, data: menuItemData(request.body) }) }); } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try { await prisma.menuItem.delete({ where: { id: request.params.id } }); response.status(204).end(); } catch (error) { next(error); }
});

router.use((error, _request, response, next) => {
  if (error instanceof ValidationError) return response.status(400).json({ message: error.message });
  if (error.code === 'P2003') return response.status(400).json({ message: 'Restaurant not found.' });
  if (error.code === 'P2025') return response.status(404).json({ message: 'Menu item not found.' });
  return next(error);
});

export default router;
