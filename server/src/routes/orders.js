import { Router } from 'express';
import { OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requireId, requireNumber, ValidationError } from '../lib/validation.js';

const router = Router();
const orderInclude = { items: { include: { menuItem: true } }, restaurant: true, user: { select: { id: true, email: true } } };

router.post('/', requireAuth, async (request, response, next) => {
  try {
    const restaurantId = requireId(request.body.restaurantId, 'Restaurant');
    if (!Array.isArray(request.body.items) || request.body.items.length === 0 || request.body.items.length > 50) throw new ValidationError('Add between 1 and 50 menu items.');
    const requestedItems = request.body.items.map((item) => ({ menuItemId: requireId(item.menuItemId, 'Menu item'), quantity: requireNumber(item.quantity, 'Quantity', { min: 1, max: 20 }) }));
    const ids = [...new Set(requestedItems.map((item) => item.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, restaurantId, isAvailable: true } });
    if (menuItems.length !== ids.length) return response.status(400).json({ message: 'One or more menu items are unavailable.' });
    const prices = new Map(menuItems.map((item) => [item.id, item.price]));
    const total = requestedItems.reduce((sum, item) => sum + Number(prices.get(item.menuItemId)) * item.quantity, 0);
    const order = await prisma.order.create({
      data: { userId: request.user.id, restaurantId, total, items: { create: requestedItems.map((item) => ({ ...item, unitPrice: prices.get(item.menuItemId) })) } },
      include: orderInclude,
    });
    return response.status(201).json({ order });
  } catch (error) { return next(error); }
});

router.get('/my', requireAuth, async (request, response, next) => {
  try { response.json({ orders: await prisma.order.findMany({ where: { userId: request.user.id }, include: orderInclude, orderBy: { createdAt: 'desc' } }) }); } catch (error) { next(error); }
});

router.get('/', requireAuth, requireAdmin, async (_request, response, next) => {
  try { response.json({ orders: await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' } }) }); } catch (error) { next(error); }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (request, response, next) => {
  try {
    if (!Object.values(OrderStatus).includes(request.body.status)) throw new ValidationError('Choose a valid order status.');
    const order = await prisma.order.update({ where: { id: request.params.id }, data: { status: request.body.status }, include: orderInclude });
    return response.json({ order });
  } catch (error) { return next(error); }
});

router.use((error, _request, response, next) => {
  if (error instanceof ValidationError) return response.status(400).json({ message: error.message });
  if (error.code === 'P2025') return response.status(404).json({ message: 'Order not found.' });
  return next(error);
});

export default router;
