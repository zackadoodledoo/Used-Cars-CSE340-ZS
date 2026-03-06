import 'dotenv/config';
import express from 'express';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PgSession = connectPgSimple(session);

let db;
try {
  const mod = await import('./db/index.js');
  db = mod.default || mod;
} catch (err) {
  db = null;
  console.warn('Warning: ./db/index.js not found or failed to load. DB features disabled.');
}

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
};

if (db && db.pool) {
  app.use(session({ store: new PgSession({ pool: db.pool }), ...sessionOptions }));
} else {
  app.use(session(sessionOptions));
}

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user ?? null;
  res.locals.flash = {
    error: req.flash('error') ?? [],
    success: req.flash('success') ?? []
  };
  next();
});

app.get('/', (req, res) => {
  res.render('index', { featured: [] });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));