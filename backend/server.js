const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Blackout backend is running');
});

// =======================
// AUTH HELPERS
// =======================

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

async function getLoggedUser(req) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    return null;
  }
}

// =======================
// AUTH ROUTES
// =======================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email and password are required'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['user']
    );

    const userRoleId = roleResult.rows[0].id;

    const newUser = await pool.query(
      `
      INSERT INTO users (username, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email
      `,
      [username, email, hashedPassword, userRoleId]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Register error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsValid) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const token = createToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({
        message: 'Not logged in'
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Auth error' });
  }
});

// =======================
// COCKTAIL ROUTES
// =======================

app.get('/api/cocktails', async (req, res) => {
  try {
    const {
      search,
      difficulty,
      alcohol_type,
      ingredient,
      min_rating,
      sort
    } = req.query;

    let query = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type
      FROM cocktails c
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      LEFT JOIN recipe_versions rv ON rv.cocktail_id = c.id
      LEFT JOIN recipe_ingredients ri ON ri.recipe_version_id = rv.id
      LEFT JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE 1 = 1
    `;

    const values = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` AND c.name ILIKE $${values.length}`;
    }

    if (difficulty) {
      values.push(difficulty);
      query += ` AND d.name = $${values.length}`;
    }

    if (alcohol_type) {
      values.push(alcohol_type);
      query += ` AND a.name = $${values.length}`;
    }

    if (ingredient) {
      values.push(`%${ingredient}%`);
      query += ` AND i.name ILIKE $${values.length}`;
    }

    if (min_rating) {
      values.push(min_rating);
      query += ` AND c.avg_rating >= $${values.length}`;
    }

    if (sort === 'popular') {
      query += ` ORDER BY c.review_count DESC, c.avg_rating DESC`;
    } else if (sort === 'rating') {
      query += ` ORDER BY c.avg_rating DESC`;
    } else {
      query += ` ORDER BY c.name ASC`;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Cocktail search/filter error' });
  }
});

app.get('/api/cocktails/random', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type
      FROM cocktails c
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No cocktails found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Random cocktail error' });
  }
});

app.get('/api/cocktails/:id', async (req, res) => {
  try {
    const cocktailId = req.params.id;

    const cocktailResult = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type
      FROM cocktails c
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      WHERE c.id = $1
      `,
      [cocktailId]
    );

    if (cocktailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cocktail not found' });
    }

    const recipesResult = await pool.query(
      `
      SELECT 
        rv.id,
        rv.name,
        rv.description,
        rv.image_url,
        rv.created_at,
        u.username AS created_by
      FROM recipe_versions rv
      LEFT JOIN users u ON rv.user_id = u.id
      WHERE rv.cocktail_id = $1
      ORDER BY rv.created_at ASC
      `,
      [cocktailId]
    );

    res.json({
      cocktail: cocktailResult.rows[0],
      recipes: recipesResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Cocktail details error' });
  }
});

// =======================
// FAVORITE ROUTES
// =======================

app.get('/api/favorites', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const result = await pool.query(
      `
      SELECT 
        f.id AS favorite_id,
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type
      FROM favorites f
      JOIN cocktails c ON f.cocktail_id = c.id
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      `,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Favorites error' });
  }
});

app.post('/api/favorites/:cocktailId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const cocktailId = req.params.cocktailId;

    const cocktailResult = await pool.query(
      'SELECT id FROM cocktails WHERE id = $1',
      [cocktailId]
    );

    if (cocktailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cocktail not found' });
    }

    await pool.query(
      `
      INSERT INTO favorites (user_id, cocktail_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, cocktail_id) DO NOTHING
      `,
      [user.id, cocktailId]
    );

    res.json({ message: 'Cocktail added to favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Add favorite error' });
  }
});

app.delete('/api/favorites/:cocktailId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const cocktailId = req.params.cocktailId;

    await pool.query(
      `
      DELETE FROM favorites
      WHERE user_id = $1 AND cocktail_id = $2
      `,
      [user.id, cocktailId]
    );

    res.json({ message: 'Cocktail removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Remove favorite error' });
  }
});

// =======================
// REVIEW ROUTES
// =======================

async function updateCocktailRating(cocktailId) {
  const ratingResult = await pool.query(
    `
    SELECT 
      COALESCE(AVG(rate), 0) AS avg_rating,
      COUNT(*) AS review_count
    FROM reviews
    WHERE cocktail_id = $1
    `,
    [cocktailId]
  );

  const avgRating = ratingResult.rows[0].avg_rating;
  const reviewCount = ratingResult.rows[0].review_count;

  await pool.query(
    `
    UPDATE cocktails
    SET avg_rating = $1,
        review_count = $2
    WHERE id = $3
    `,
    [avgRating, reviewCount, cocktailId]
  );
}

app.get('/api/reviews/:cocktailId', async (req, res) => {
  try {
    const cocktailId = req.params.cocktailId;

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.text,
        r.rate,
        r.sweet_rate,
        r.bitter_rate,
        r.created_at,
        u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.cocktail_id = $1
      ORDER BY r.created_at DESC
      `,
      [cocktailId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Reviews error' });
  }
});

app.post('/api/reviews/:cocktailId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const cocktailId = req.params.cocktailId;
    const { text, rate, sweet_rate, bitter_rate } = req.body;

    if (!rate || rate < 1 || rate > 5) {
      return res.status(400).json({
        message: 'Rate must be between 1 and 5'
      });
    }

    if (sweet_rate && (sweet_rate < 1 || sweet_rate > 5)) {
      return res.status(400).json({
        message: 'Sweet rate must be between 1 and 5'
      });
    }

    if (bitter_rate && (bitter_rate < 1 || bitter_rate > 5)) {
      return res.status(400).json({
        message: 'Bitter rate must be between 1 and 5'
      });
    }

    const cocktailResult = await pool.query(
      'SELECT id FROM cocktails WHERE id = $1',
      [cocktailId]
    );

    if (cocktailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cocktail not found' });
    }

    const reviewResult = await pool.query(
      `
      INSERT INTO reviews (text, rate, sweet_rate, bitter_rate, user_id, cocktail_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, cocktail_id)
      DO UPDATE SET
        text = EXCLUDED.text,
        rate = EXCLUDED.rate,
        sweet_rate = EXCLUDED.sweet_rate,
        bitter_rate = EXCLUDED.bitter_rate,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [text, rate, sweet_rate, bitter_rate, user.id, cocktailId]
    );

    await updateCocktailRating(cocktailId);

    res.json({
      message: 'Review saved successfully',
      review: reviewResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Save review error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Blackout backend running on port ${PORT}`);
});