import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

async function api(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload.message || 'Something went wrong.');
  return payload;
}

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('browse');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('foodflow-session') || 'null'));
  const token = session?.token;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cart]);

  async function loadRestaurants() {
    setLoading(true);
    try { setRestaurants((await api('/restaurants')).restaurants); } catch (error) { setNotice(error.message); } finally { setLoading(false); }
  }
  async function loadOrders() {
    if (!session) return;
    try { setOrders((await api(session.user.role === 'ADMIN' ? '/orders' : '/orders/my', {}, token)).orders); } catch (error) { setNotice(error.message); }
  }
  useEffect(() => { loadRestaurants(); }, []);
  useEffect(() => { if (view === 'orders') loadOrders(); }, [view]);

  function openRestaurant(restaurant) {
    setCart([]);
    api(`/restaurants/${restaurant.id}`).then(({ restaurant: details }) => { setSelected(details); setView('restaurant'); }).catch((error) => setNotice(error.message));
  }
  function updateCart(item, amount) {
    setCart((items) => {
      const current = items.find((entry) => entry.id === item.id);
      if (!current && amount > 0) return [...items, { ...item, quantity: 1 }];
      return items.flatMap((entry) => entry.id !== item.id ? [entry] : entry.quantity + amount > 0 ? [{ ...entry, quantity: entry.quantity + amount }] : []);
    });
  }
  async function submitAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const nextSession = { user: data.user, token: data.token };
      localStorage.setItem('foodflow-session', JSON.stringify(nextSession));
      setSession(nextSession); setView('browse'); setNotice(`Welcome, ${data.user.email}.`);
    } catch (error) { setNotice(error.message); }
  }
  async function checkout() {
    if (!session) return setView('account');
    if (!selected || !cart.length) return;
    try {
      await api('/orders', { method: 'POST', body: JSON.stringify({ restaurantId: selected.id, items: cart.map(({ id, quantity }) => ({ menuItemId: id, quantity })) }) }, token);
      setCart([]); setView('orders'); setNotice('Your order has been placed.');
    } catch (error) { setNotice(error.message); }
  }
  function signOut() { localStorage.removeItem('foodflow-session'); setSession(null); setView('browse'); }

  return <div className="app">
    <header><button className="brand" onClick={() => setView('browse')}>FoodFlow</button><nav><button onClick={() => setView('browse')}>Restaurants</button>{session && <button onClick={() => setView('orders')}>Orders</button>}{session?.user.role === 'ADMIN' && <button onClick={() => setView('admin')}>Admin</button>}<button onClick={() => setView('cart')}>Cart ({itemCount})</button>{session ? <button onClick={signOut}>Sign out</button> : <button onClick={() => setView('account')}>Sign in</button>}</nav></header>
    {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}>x</button></div>}
    <main>
      {view === 'browse' && <Browse loading={loading} restaurants={restaurants} open={openRestaurant} />}
      {view === 'restaurant' && selected && <Restaurant restaurant={selected} cart={cart} updateCart={updateCart} />}
      {view === 'cart' && <Cart cart={cart} total={total} updateCart={updateCart} checkout={checkout} />}
      {view === 'account' && <Auth mode={authMode} setMode={setAuthMode} submit={submitAuth} />}
      {view === 'orders' && <Orders orders={orders} isAdmin={session?.user.role === 'ADMIN'} token={token} reload={loadOrders} report={setNotice} />}
      {view === 'admin' && <Admin restaurants={restaurants} token={token} refreshRestaurants={loadRestaurants} report={setNotice} />}
    </main>
  </div>;
}

function Title({ eyebrow, title }) { return <div className="title"><p>{eyebrow}</p><h1>{title}</h1></div>; }
function Browse({ loading, restaurants, open }) { return <section><Title eyebrow="Delivery made easy" title="Choose a restaurant" />{loading ? <p className="empty">Loading restaurants...</p> : <div className="grid">{restaurants.map((restaurant) => <button className="card" key={restaurant.id} onClick={() => open(restaurant)}><b>{restaurant.name}</b><span>{restaurant.cuisine}</span><small>Rating {restaurant.rating} - {restaurant.deliveryMins} min</small></button>)}</div>}</section>; }
function Restaurant({ restaurant, cart, updateCart }) { const categories = restaurant.menuItems.reduce((groups, item) => ({ ...groups, [item.category]: [...(groups[item.category] || []), item] }), {}); return <section><Title eyebrow={`${restaurant.cuisine} - ${restaurant.deliveryMins} min - Rating ${restaurant.rating}/5`} title={restaurant.name} />{Object.entries(categories).map(([category, items]) => <div className="menu" key={category}><h2>{category}</h2>{items.map((item) => { const quantity = cart.find((entry) => entry.id === item.id)?.quantity || 0; return <article key={item.id}><div><b>{item.name}</b><p>{item.description}</p><strong>{money(item.price)}</strong></div>{quantity ? <Quantity item={item} quantity={quantity} update={updateCart} /> : <button className="primary" onClick={() => updateCart(item, 1)}>Add</button>}</article>; })}</div>)}</section>; }
function Quantity({ item, quantity, update }) { return <div className="quantity"><button aria-label={`Remove one ${item.name}`} onClick={() => update(item, -1)}>-</button><b>{quantity}</b><button aria-label={`Add one ${item.name}`} onClick={() => update(item, 1)}>+</button></div>; }
function Cart({ cart, total, updateCart, checkout }) { return <section className="narrow"><Title eyebrow="Your selection" title="Cart" />{!cart.length ? <p className="empty">Your cart is empty.</p> : <><div className="list">{cart.map((item) => <div key={item.id}><span>{item.name}</span><div className="cart-actions"><Quantity item={item} quantity={item.quantity} update={updateCart} /><strong>{money(Number(item.price) * item.quantity)}</strong></div></div>)}</div><div className="total"><b>Total</b><b>{money(total)}</b></div><button className="primary wide" onClick={checkout}>Place order</button></>}</section>; }
function Auth({ mode, setMode, submit }) { return <section className="narrow"><Title eyebrow="Account" title={mode === 'login' ? 'Sign in' : 'Create account'} /><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label><button className="primary">{mode === 'login' ? 'Sign in' : 'Register'}</button></form><button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account?' : 'Already have an account?'}</button></section>; }
function Orders({ orders, isAdmin, token, reload, report }) { async function updateStatus(id, status) { try { await api(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token); reload(); } catch (error) { report(error.message); } } return <section><Title eyebrow={isAdmin ? 'All customer orders' : 'Your purchases'} title="Orders" />{!orders.length ? <p className="empty">No orders yet.</p> : <div className="list orders">{orders.map((order) => <article key={order.id}><div><b>{order.restaurant.name}</b><p>{order.items.map((item) => `${item.quantity} x ${item.menuItem.name}`).join(', ')}</p>{isAdmin && <small>{order.user.email}</small>}</div><div><b>{money(order.total)}</b>{isAdmin ? <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select> : <small>{order.status.replaceAll('_', ' ')}</small>}</div></article>)}</div>}</section>; }
function Admin({ restaurants, token, refreshRestaurants, report }) { const [items, setItems] = useState([]); const [editing, setEditing] = useState(null); const loadItems = () => api('/menu-items', {}, token).then(({ menuItems }) => setItems(menuItems)).catch((error) => report(error.message)); useEffect(() => { loadItems(); }, []); async function submit(event) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); body.isAvailable = body.isAvailable === 'on'; try { await api(editing ? `/menu-items/${editing.id}` : '/menu-items', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) }, token); event.currentTarget.reset(); setEditing(null); loadItems(); refreshRestaurants(); report(editing ? 'Menu item updated.' : 'Menu item added.'); } catch (error) { report(error.message); } } async function remove(id) { try { await api(`/menu-items/${id}`, { method: 'DELETE' }, token); loadItems(); report('Menu item deleted.'); } catch (error) { report(error.message); } } return <section className="narrow"><Title eyebrow="Operations" title="Admin dashboard" /><form onSubmit={submit}><label>Restaurant<select name="restaurantId" defaultValue={editing?.restaurantId || ''} key={`restaurant-${editing?.id || 'new'}`} required><option value="">Choose a restaurant</option>{restaurants.map((restaurant) => <option value={restaurant.id} key={restaurant.id}>{restaurant.name}</option>)}</select></label><label>Name<input name="name" defaultValue={editing?.name || ''} key={`name-${editing?.id || 'new'}`} required /></label><label>Description<textarea name="description" defaultValue={editing?.description || ''} key={`description-${editing?.id || 'new'}`} required /></label><label>Category<input name="category" defaultValue={editing?.category || ''} key={`category-${editing?.id || 'new'}`} required /></label><label>Price<input name="price" type="number" min="1" defaultValue={editing?.price || ''} key={`price-${editing?.id || 'new'}`} required /></label><label className="check"><input name="isAvailable" type="checkbox" defaultChecked={editing ? editing.isAvailable : true} key={`available-${editing?.id || 'new'}`} /> Available</label><button className="primary">{editing ? 'Save menu item' : 'Add menu item'}</button>{editing && <button type="button" className="link" onClick={() => setEditing(null)}>Cancel editing</button>}</form><div className="admin-items">{items.map((item) => <article key={item.id}><div><b>{item.name}</b><small>{item.restaurant.name} - {money(item.price)} - {item.isAvailable ? 'Available' : 'Unavailable'}</small></div><div><button className="link" onClick={() => setEditing(item)}>Edit</button><button className="danger" onClick={() => remove(item.id)}>Delete</button></div></article>)}</div></section>; }

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
