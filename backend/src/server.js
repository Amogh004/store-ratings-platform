import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Op, fn, col } from 'sequelize';
import { initDb, User, Store, Rating, sequelize } from './models.js';
import {
  authMiddleware,
  requireRole,
  handleSignup,
  handleLogin,
  handleChangePassword,
  getStoreOwnerAverageRating,
} from './auth.js';
import {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
  collectValidationErrors,
} from './validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/change-password', authMiddleware, handleChangePassword);

// Admin: create user (normal / admin / store owner)
app.post('/api/admin/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, email, address, password, role } = req.body;

  const errors = collectValidationErrors({
    name: () => validateName(name),
    email: () => validateEmail(email),
    address: () => validateAddress(address),
    password: () => validatePassword(password),
  });

  if (errors) {
    return res.status(400).json({ errors });
  }

  if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      address,
      passwordHash,
      role,
    });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: create store
app.post('/api/admin/stores', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, email, address, ownerId } = req.body;

  const errors = collectValidationErrors({
    name: () => (!name ? 'Name is required' : null),
    email: () => validateEmail(email),
    address: () => validateAddress(address),
  });

  if (errors) {
    return res.status(400).json({ errors });
  }

  try {
    let owner = null;
    if (ownerId) {
      owner = await User.findByPk(ownerId);
      if (!owner || owner.role !== 'STORE_OWNER') {
        return res.status(400).json({ message: 'Invalid store owner' });
      }
    }
    const store = await Store.create({
      name,
      email,
      address,
      ownerId: owner ? owner.id : null,
    });
    res.status(201).json(store);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: dashboard stats
app.get('/api/admin/dashboard-stats', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const [userCount, storeCount, ratingCount] = await Promise.all([
      User.count(),
      Store.count(),
      Rating.count(),
    ]);
    res.json({
      totalUsers: userCount,
      totalStores: storeCount,
      totalRatings: ratingCount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helpers for filtering/sorting
function buildUserWhere({ name, email, address, role }) {
  const where = {};
  if (name) where.name = { [Op.iLike]: `%${name}%` };
  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (address) where.address = { [Op.iLike]: `%${address}%` };
  if (role) where.role = role;
  return where;
}

function buildStoreWhere({ name, email, address }) {
  const where = {};
  if (name) where.name = { [Op.iLike]: `%${name}%` };
  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (address) where.address = { [Op.iLike]: `%${address}%` };
  return where;
}

function buildOrder(sortBy, sortOrder, allowedFields) {
  if (!sortBy || !allowedFields.includes(sortBy)) return [];
  const order = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return [[sortBy, order]];
}

// Admin: list users with filters and sorting
app.get('/api/admin/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, email, address, role, sortBy, sortOrder } = req.query;
  try {
    const users = await User.findAll({
      where: buildUserWhere({ name, email, address, role }),
      order: buildOrder(sortBy, sortOrder, ['name', 'email', 'address', 'role', 'createdAt']),
    });
    res.json(
      await Promise.all(
        users.map(async (u) => {
          let ownerAverageRating = null;
          if (u.role === 'STORE_OWNER') {
            ownerAverageRating = await getStoreOwnerAverageRating(u.id);
          }
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            address: u.address,
            role: u.role,
            ownerAverageRating,
          };
        })
      )
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: get single user details (including rating if store owner)
app.get('/api/admin/users/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let ownerAverageRating = null;
    if (user.role === 'STORE_OWNER') {
      ownerAverageRating = await getStoreOwnerAverageRating(user.id);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      ownerAverageRating,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: list stores with ratings summary
app.get('/api/admin/stores', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, email, address, sortBy, sortOrder } = req.query;
  try {
    const stores = await Store.findAll({
      where: buildStoreWhere({ name, email, address }),
      include: [{ model: Rating }],
      order: buildOrder(sortBy, sortOrder, ['name', 'email', 'address', 'createdAt']),
    });

    const result = stores.map((store) => {
      const ratings = store.Ratings || [];
      const count = ratings.length;
      const avg = count
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
        : null;
      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: avg,
        ratingCount: count,
      };
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Normal user & store listings: list stores with overall and user-specific rating
app.get('/api/stores', authMiddleware, async (req, res) => {
  const { name, address, sortBy, sortOrder } = req.query;
  const userId = req.user.id;
  try {
    const stores = await Store.findAll({
      where: buildStoreWhere({ name, address }),
      include: [{ model: Rating }],
      order: buildOrder(sortBy, sortOrder, ['name', 'address', 'createdAt']),
    });

    const result = stores.map((store) => {
      const ratings = store.Ratings || [];
      const count = ratings.length;
      const avg = count
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
        : null;
      const userRating = ratings.find((r) => r.UserId === userId)?.rating || null;
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating: avg,
        ratingCount: count,
        userRating,
      };
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Normal user: submit rating for a store
async function upsertRating(req, res, method) {
  const userId = req.user.id;
  const storeId = Number(req.params.id);
  const { rating } = req.body;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const existing = await Rating.findOne({ where: { UserId: userId, StoreId: storeId } });

    if (method === 'POST' && existing) {
      return res.status(400).json({ message: 'Rating already exists. Use PUT to update.' });
    }
    if (method === 'PUT' && !existing) {
      return res.status(404).json({ message: 'Rating does not exist. Use POST to create.' });
    }

    let ratingRecord;
    if (existing) {
      existing.rating = rating;
      ratingRecord = await existing.save();
    } else {
      ratingRecord = await Rating.create({ rating, UserId: userId, StoreId: storeId });
    }

    res.status(method === 'POST' ? 201 : 200).json(ratingRecord);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
}

app.post('/api/stores/:id/ratings', authMiddleware, requireRole('USER'), (req, res) =>
  upsertRating(req, res, 'POST')
);
app.put('/api/stores/:id/ratings', authMiddleware, requireRole('USER'), (req, res) =>
  upsertRating(req, res, 'PUT')
);

// Store owner dashboard: list users who rated their stores and average rating
app.get(
  '/api/owner/dashboard',
  authMiddleware,
  requireRole('STORE_OWNER'),
  async (req, res) => {
    const ownerId = req.user.id;
    try {
      const stores = await Store.findAll({
        where: { ownerId },
        include: [
          {
            model: Rating,
            include: [{ model: User }],
          },
        ],
      });

      const payload = stores.map((store) => {
        const ratings = store.Ratings || [];
        const count = ratings.length;
        const avg = count
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
          : null;
        return {
          id: store.id,
          name: store.name,
          address: store.address,
          averageRating: avg,
          ratingCount: count,
          ratings: ratings.map((r) => ({
            id: r.id,
            rating: r.rating,
            user: r.User
              ? {
                  id: r.User.id,
                  name: r.User.name,
                  email: r.User.email,
                  address: r.User.address,
                }
              : null,
          })),
        };
      });

      res.json(payload);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Current user details
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
}

start();

