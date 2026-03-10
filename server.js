import 'dotenv/config';
import express from 'express';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';

import vehiclesRouter from './src/routes/vehicles.js';
import authRouter from './src/routes/auth.js';
import { requireAuth } from './src/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PgSession = connectPgSimple(session);

// Try to load DB module (optional). Expect default export with { pool }.
let db;
try {
  const mod = await import('./db/index.js');
  db = mod.default || mod;
} catch (err) {
  db = null;
  console.warn('Warning: ./db/index.js not found or failed to load. DB features disabled.');
}

const app = express();

/**
 * View engine and middleware (order matters)
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Parse urlencoded bodies (forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files from public (single call)
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
};

if (db && db.pool) {
  app.use(session({ store: new PgSession({ pool: db.pool }), ...sessionOptions }));
} else {
  app.use(session(sessionOptions));
}

// Flash (requires sessions)
app.use(flash());

// Expose current user and flash messages to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user ?? null;
  res.locals.flash = {
    error: req.flash('error') ?? [],
    success: req.flash('success') ?? []
  };
  next();
});

/**
 * Mount routers (after session and body parsing)
 */
app.use('/', authRouter);
app.use('/vehicles', vehiclesRouter);

/**
 * Root route: render home with featured vehicles and categories if DB available
 */
app.get('/', async (req, res, next) => {
  try {
    if (db && db.pool) {
      const featuredQ = `
        SELECT v.id, v.title, v.make, v.model, v.year, v.price,
               (SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image_url
        FROM vehicles v
        WHERE v.available = true
        ORDER BY v.created_at DESC
        LIMIT 6
      `;
      const [featuredRes, categoriesRes] = await Promise.all([
        db.pool.query(featuredQ),
        db.pool.query('SELECT id, name FROM categories ORDER BY name')
      ]);
      return res.render('home', {
        user: req.session.user || null,
        featuredVehicles: featuredRes.rows,
        categories: categoriesRes.rows
      });
    }

    // Fallback when DB not available
    return res.render('home', { user: req.session.user || null, featuredVehicles: [], categories: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * Example protected dashboard route
 */
app.get('/dashboard', requireAuth, (req, res) => {
  const role = req.session.user?.role;
  if (role === 'owner') return res.redirect('/owner');
  if (role === 'employee') return res.redirect('/employee');
  return res.redirect('/my');
});

/**
 * Global error handler (simple)
 */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('errors/500', { error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
