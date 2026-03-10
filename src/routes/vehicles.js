import express from 'express';
import pg from 'pg';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /vehicles
 * Query params:
 *  - category (string)
 *  - sort (price_asc | price_desc)
 *  - page (integer, 1-based)
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, sort, page = '1' } = req.query;
    const pageSize = 10;
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * pageSize;

    // Fetch categories for filter dropdown
    const categoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY name');
    const categories = categoriesResult.rows;

    // Build vehicle query with parameterized values
    const params = [];
    let where = '';
    if (category) {
      params.push(category);
      where = `WHERE c.name = $${params.length}`;
    }

    let order = 'ORDER BY v.created_at DESC';
    if (sort === 'price_asc') order = 'ORDER BY v.price ASC';
    if (sort === 'price_desc') order = 'ORDER BY v.price DESC';

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM vehicles v
      LEFT JOIN categories c ON v.category_id = c.id
      ${where}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10) || 0;

    // Add pagination params
    params.push(pageSize, offset);
    const vehiclesQuery = `
      SELECT v.id, v.title, v.make, v.model, v.year, v.miles, v.price, v.description, v.available,
             (SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = v.id LIMIT 1) AS image_url,
             c.name AS category
      FROM vehicles v
      LEFT JOIN categories c ON v.category_id = c.id
      ${where}
      ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const vehiclesRes = await pool.query(vehiclesQuery, params);
    const vehicles = vehiclesRes.rows;

    res.render('vehicles/list', {
      vehicles,
      categories,
      query: { category, sort, page },
      pagination: { total, page: parseInt(page, 10) || 1, pageSize }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vehicles/:id
 * Show vehicle detail with images, reviews, and a review form if logged in
 */
router.get('/:id', async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    if (Number.isNaN(vehicleId)) return res.status(400).render('errors/400');

    // Vehicle
    const vehicleQ = `
      SELECT v.*, c.name AS category
      FROM vehicles v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE v.id = $1
    `;
    const vehicleRes = await pool.query(vehicleQ, [vehicleId]);
    const vehicle = vehicleRes.rows[0];
    if (!vehicle) return res.status(404).render('errors/404');

    // Images
    const imagesRes = await pool.query('SELECT id, url, alt_text FROM vehicle_images WHERE vehicle_id = $1 ORDER BY id', [vehicleId]);
    const images = imagesRes.rows;

    // Reviews (include reviewer name)
    const reviewsQ = `
      SELECT r.id, r.rating, r.body, r.user_id, u.name AS user_name, r.created_at
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.vehicle_id = $1
      ORDER BY r.created_at DESC
    `;
    const reviewsRes = await pool.query(reviewsQ, [vehicleId]);
    const reviews = reviewsRes.rows;

    res.render('vehicles/detail', {
      vehicle,
      images,
      reviews,
      user: req.session.user || null
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /vehicles/:id/reviews
 * Create a review for a vehicle (must be logged in)
 */
router.post(
  '/:id/reviews',
  requireAuth,
  body('rating').isInt({ min: 1, max: 5 }),
  body('body').trim().isLength({ min: 1, max: 2000 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const vehicleId = parseInt(req.params.id, 10);
      if (!errors.isEmpty()) {
        // Re-render detail with validation errors
        const errArray = errors.array();
        req.flash = req.flash || ((k, v) => {}); // safe if flash not configured
        return res.redirect(`/vehicles/${vehicleId}`);
      }

      const { rating, body: reviewBody } = req.body;
      const userId = req.session.user.id;

      await pool.query(
        `INSERT INTO reviews (vehicle_id, user_id, rating, body) VALUES ($1, $2, $3, $4)`,
        [vehicleId, userId, rating, reviewBody]
      );

      res.redirect(`/vehicles/${vehicleId}`);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /service-requests
 * Submit a service request for a vehicle (must be logged in)
 */
router.post(
  '/:id/service-requests',
  requireAuth,
  body('description').trim().isLength({ min: 1, max: 2000 }),
  async (req, res, next) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.redirect(`/vehicles/${vehicleId}`);

      const { description } = req.body;
      const userId = req.session.user.id;

      await pool.query(
        `INSERT INTO service_requests (user_id, vehicle_id, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'Submitted', now(), now())`,
        [userId, vehicleId, description]
      );

      res.redirect(`/vehicles/${vehicleId}`);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
