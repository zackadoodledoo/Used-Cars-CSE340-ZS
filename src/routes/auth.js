import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pg from 'pg';

const router = express.Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

router.get('/register', (req, res) => res.render('auth/register'));
router.get('/login', (req, res) => res.render('auth/login'));

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('name').trim().notEmpty(),
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.render('auth/register', { errors: errors.array(), data: req.body });

    try {
      const { email, name, password } = req.body;
      const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10', 10));
      await pool.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4)', [email, hash, name, 'user']);
      res.redirect('/login');
    } catch (err) {
      next(err);
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.render('auth/login', { errors: errors.array() });

    try {
      const { email, password } = req.body;
      const { rows } = await pool.query('SELECT id, email, password_hash, name, role FROM users WHERE email=$1', [email]);
      const user = rows[0];
      if (!user) return res.render('auth/login', { error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.render('auth/login', { error: 'Invalid credentials' });

      req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

export default router;
