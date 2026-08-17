import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const restaurants = [
  { name: 'Pizza House', cuisine: 'Italian', rating: 4.8, deliveryMins: 25, items: [{ name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 299, category: 'Pizzas' }, { name: 'Farmhouse', description: 'Onion, capsicum, mushrooms', price: 399, category: 'Pizzas' }] },
  { name: 'Burger Point', cuisine: 'Burgers', rating: 4.2, deliveryMins: 20, items: [{ name: 'Classic Burger', description: 'Grilled patty, lettuce, tomato', price: 249, category: 'Burgers' }, { name: 'Crispy Fries', description: 'Salted potato fries', price: 119, category: 'Sides' }] },
  { name: 'Spice Garden', cuisine: 'Indian', rating: 4.7, deliveryMins: 30, items: [{ name: 'Paneer Tikka Masala', description: 'Paneer in a creamy spiced sauce', price: 329, category: 'Mains' }, { name: 'Garlic Naan', description: 'Tandoor-baked flatbread', price: 69, category: 'Breads' }] },
];

async function main() {
  const password = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({ where: { email: 'admin@foodflow.test' }, update: {}, create: { email: 'admin@foodflow.test', password, role: 'ADMIN' } });
  for (const entry of restaurants) {
    const id = `seed-${entry.name.toLowerCase().replace(/[^a-z]/g, '-')}`;
    const restaurant = await prisma.restaurant.upsert({ where: { id }, update: { name: entry.name, cuisine: entry.cuisine, rating: entry.rating, deliveryMins: entry.deliveryMins }, create: { id, name: entry.name, cuisine: entry.cuisine, rating: entry.rating, deliveryMins: entry.deliveryMins } });
    for (const item of entry.items) {
      const itemId = `seed-${restaurant.id}-${item.name.toLowerCase().replace(/[^a-z]/g, '-')}`;
      await prisma.menuItem.upsert({ where: { id: itemId }, update: item, create: { id: itemId, restaurantId: restaurant.id, ...item } });
    }
  }
}

main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
