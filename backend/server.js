const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Blackout backend is running');
});

const cocktailsUploadDir = path.join(__dirname, 'uploads', 'cocktails');

if (!fs.existsSync(cocktailsUploadDir)) {
  fs.mkdirSync(cocktailsUploadDir, { recursive: true });
}

const cocktailImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cocktailsUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const uploadCocktailImage = multer({
  storage: cocktailImageStorage
});

const recipesUploadDir = path.join(__dirname, 'uploads', 'recipes');

if (!fs.existsSync(recipesUploadDir)) {
  fs.mkdirSync(recipesUploadDir, { recursive: true });
}

const recipeImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recipesUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const uploadRecipeImage = multer({
  storage: recipeImageStorage
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

    query += `
      GROUP BY
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name,
        a.name
    `;

    if (sort === 'popular') {
      query += `
        ORDER BY
          COALESCE(c.review_count, 0) DESC,
          COALESCE(c.avg_rating, 0) DESC,
          c.name ASC
      `;
    } else if (sort === 'rating') {
      query += `
        ORDER BY
          CASE WHEN COALESCE(c.review_count, 0) = 0 THEN 1 ELSE 0 END ASC,
          COALESCE(c.avg_rating, 0) DESC,
          COALESCE(c.review_count, 0) DESC,
          c.name ASC
      `;
    } else if (sort === 'rating_low') {
      query += `
        ORDER BY
          COALESCE(c.avg_rating, 0) ASC,
          COALESCE(c.review_count, 0) ASC,
          c.name ASC
      `;
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

// app.get('/api/cocktails', async (req, res) => {
//   try {
//     const {
//       search,
//       difficulty,
//       alcohol_type,
//       ingredient,
//       min_rating,
//       sort
//     } = req.query;

//     console.log('SORT:', sort);

//     let query = `
//       SELECT DISTINCT
//         c.id,
//         c.name,
//         c.image_url,
//         c.avg_rating,
//         c.review_count,
//         CASE WHEN c.review_count = 0 THEN 1 ELSE 0 END AS no_reviews_sort,
//         d.name AS difficulty,
//         a.name AS alcohol_type
//       FROM cocktails c
//       JOIN difficulties d ON c.difficulty_id = d.id
//       JOIN alcohol_types a ON c.alcohol_type_id = a.id
//       LEFT JOIN recipe_versions rv ON rv.cocktail_id = c.id
//       LEFT JOIN recipe_ingredients ri ON ri.recipe_version_id = rv.id
//       LEFT JOIN ingredients i ON i.id = ri.ingredient_id
//       WHERE 1 = 1
//     `;

//     const values = [];

//     if (search) {
//       values.push(`%${search}%`);
//       query += ` AND c.name ILIKE $${values.length}`;
//     }

//     if (difficulty) {
//       values.push(difficulty);
//       query += ` AND d.name = $${values.length}`;
//     }

//     if (alcohol_type) {
//       values.push(alcohol_type);
//       query += ` AND a.name = $${values.length}`;
//     }

//     if (ingredient) {
//       values.push(`%${ingredient}%`);
//       query += ` AND i.name ILIKE $${values.length}`;
//     }

//     if (min_rating) {
//       values.push(min_rating);
//       query += ` AND c.avg_rating >= $${values.length}`;
//     }

//     if (sort === 'popular') {
//       query += ` ORDER BY c.review_count DESC, c.avg_rating DESC`;
//     } else if (sort === 'rating') {
//       query += ` ORDER BY c.avg_rating DESC, c.review_count DESC`;
//     } else if (sort === 'rating_low') {
//        query += `
//           ORDER BY
//             CASE WHEN COALESCE(c.review_count, 0) = 0 THEN 1 ELSE 0 END ASC,
//             COALESCE(NULLIF(c.avg_rating::text, '')::numeric, 0) ASC,
//             COALESCE(c.review_count, 0) DESC,
//             c.name ASC
//         `;
//     } else {
//       query += ` ORDER BY c.name ASC`;
//     }

//     const result = await pool.query(query, values);

//     res.json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Cocktail search/filter error' });
//   }
// });

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

app.get('/api/cocktails/by-ingredients/search', async (req, res) => {
  try {
    const ingredientsText = req.query.ingredients;

    if (!ingredientsText) {
      return res.status(400).json({
        message: 'Ingredients are required'
      });
    }

    const userIngredients = ingredientsText
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0);

    if (userIngredients.length === 0) {
      return res.status(400).json({
        message: 'At least one ingredient is required'
      });
    }

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type,
        COUNT(DISTINCT i.id) AS matched_ingredients
      FROM cocktails c
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      JOIN recipe_versions rv ON rv.cocktail_id = c.id
      JOIN recipe_ingredients ri ON ri.recipe_version_id = rv.id
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE LOWER(i.name) = ANY($1)
      GROUP BY
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name,
        a.name
      ORDER BY matched_ingredients DESC, c.avg_rating DESC, c.name ASC
      `,
      [userIngredients]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Cocktails by ingredients error' });
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
        r.user_id,
        r.text,
        r.rate,
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
    const { text, rate } = req.body;

    if (!rate || rate < 1 || rate > 5) {
      return res.status(400).json({
        message: 'Rate must be between 1 and 5'
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
      INSERT INTO reviews (text, rate, user_id, cocktail_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, cocktail_id)
      DO UPDATE SET
        text = EXCLUDED.text,
        rate = EXCLUDED.rate,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [text, rate, user.id, cocktailId]
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

app.delete('/api/reviews/:reviewId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const reviewId = req.params.reviewId;

    const reviewResult = await pool.query(
      `
      SELECT id, user_id, cocktail_id
      FROM reviews
      WHERE id = $1
      `,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    const isAdmin = user.role === 'admin';
    const isOwner = Number(review.user_id) === Number(user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: 'You can delete only your own review'
      });
    }

    await pool.query(
      `
      DELETE FROM reviews
      WHERE id = $1
      `,
      [reviewId]
    );

    await updateCocktailRating(review.cocktail_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete review error' });
  }
});

// =======================
// RECIPE HELPERS
// =======================

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function getOrCreateIngredient(name) {
  const cleanName = name.trim().toLowerCase();

  const existingIngredient = await pool.query(
    'SELECT id FROM ingredients WHERE name = $1',
    [cleanName]
  );

  if (existingIngredient.rows.length > 0) {
    return existingIngredient.rows[0].id;
  }

  const newIngredient = await pool.query(
    `
    INSERT INTO ingredients (name)
    VALUES ($1)
    RETURNING id
    `,
    [cleanName]
  );

  return newIngredient.rows[0].id;
}

// =======================
// RECIPE ROUTES
// =======================

app.get('/api/recipes/my', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const result = await pool.query(
      `
      SELECT
        rv.id,
        rv.cocktail_id,
        rv.name,
        rv.description,
        rv.image_url,
        rv.created_at,
        c.name AS cocktail_name
      FROM recipe_versions rv
      LEFT JOIN cocktails c ON rv.cocktail_id = c.id
      WHERE rv.user_id = $1
      ORDER BY rv.created_at DESC
      `,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'My recipes error' });
  }
});

app.get('/api/recipes/original', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.image_url,
        c.avg_rating,
        c.review_count,
        d.name AS difficulty,
        a.name AS alcohol_type,
        u.username AS created_by,
        rv.id AS recipe_id,
        rv.description
      FROM cocktails c
      JOIN difficulties d ON c.difficulty_id = d.id
      JOIN alcohol_types a ON c.alcohol_type_id = a.id
      JOIN users u ON c.created_by_user_id = u.id
      LEFT JOIN recipe_versions rv
        ON rv.cocktail_id = c.id
        AND rv.user_id = c.created_by_user_id
      WHERE c.created_by_user_id IS NOT NULL
      ORDER BY c.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Original user cocktails error' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    const recipeResult = await pool.query(
      `
      SELECT
        rv.id,
        rv.cocktail_id,
        rv.user_id,
        rv.name,
        rv.description,
        rv.image_url,
        rv.created_at,
        c.name AS cocktail_name,
        u.username AS created_by
      FROM recipe_versions rv
      LEFT JOIN cocktails c ON rv.cocktail_id = c.id
      LEFT JOIN users u ON rv.user_id = u.id
      WHERE rv.id = $1
      `,
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const ingredientsResult = await pool.query(
      `
      SELECT
        i.id,
        i.name,
        ri.quantity,
        ri.unit
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_version_id = $1
      ORDER BY i.name ASC
      `,
      [recipeId]
    );

    const stepsResult = await pool.query(
      `
      SELECT
        id,
        step_number,
        text
      FROM steps
      WHERE recipe_version_id = $1
      ORDER BY step_number ASC
      `,
      [recipeId]
    );

    res.json({
      recipe: recipeResult.rows[0],
      ingredients: ingredientsResult.rows,
      steps: stepsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Recipe details error' });
  }
});

app.post('/api/recipes', uploadRecipeImage.single('image'), async (req, res) => {
  const client = await pool.connect();

  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const {
      cocktail_id,
      name,
      description,
      difficulty_id,
      alcohol_type_id
    } = req.body;

    const ingredients = parseJsonArray(req.body.ingredients);
    const steps = parseJsonArray(req.body.steps);

    if (!name) {
      return res.status(400).json({ message: 'Recipe name is required' });
    }

    const imageUrl = req.file ? `/uploads/recipes/${req.file.filename}` : null;

    await client.query('BEGIN');

    let finalCocktailId = cocktail_id || null;

    if (!finalCocktailId) {
      if (!difficulty_id || !alcohol_type_id) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          message: 'Difficulty and alcohol type are required for a new cocktail'
        });
      }

      const newCocktail = await client.query(
        `
        INSERT INTO cocktails (
          name,
          image_url,
          difficulty_id,
          alcohol_type_id,
          created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [
          name,
          imageUrl,
          difficulty_id,
          alcohol_type_id,
          user.id
        ]
      );

      finalCocktailId = newCocktail.rows[0].id;
    }

    const newRecipe = await client.query(
      `
      INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        finalCocktailId,
        user.id,
        name,
        description || null,
        imageUrl
      ]
    );

    const recipeId = newRecipe.rows[0].id;

    for (const item of ingredients) {
      if (!item.name) {
        continue;
      }

      const cleanName = item.name.trim().toLowerCase();

      let ingredientResult = await client.query(
        'SELECT id FROM ingredients WHERE name = $1',
        [cleanName]
      );

      let ingredientId;

      if (ingredientResult.rows.length > 0) {
        ingredientId = ingredientResult.rows[0].id;
      } else {
        ingredientResult = await client.query(
          `
          INSERT INTO ingredients (name)
          VALUES ($1)
          RETURNING id
          `,
          [cleanName]
        );

        ingredientId = ingredientResult.rows[0].id;
      }

      await client.query(
        `
        INSERT INTO recipe_ingredients (recipe_version_id, ingredient_id, quantity, unit)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (recipe_version_id, ingredient_id) DO NOTHING
        `,
        [
          recipeId,
          ingredientId,
          item.quantity || null,
          item.unit || null
        ]
      );
    }

    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].text) {
        continue;
      }

      await client.query(
        `
        INSERT INTO steps (recipe_version_id, step_number, text)
        VALUES ($1, $2, $3)
        `,
        [
          recipeId,
          i + 1,
          steps[i].text
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: newRecipe.rows[0],
      cocktail_id: finalCocktailId
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(error);
    res.status(500).json({ message: 'Create recipe error' });
  } finally {
    client.release();
  }
});

app.put('/api/recipes/:id', uploadRecipeImage.single('image'), async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const recipeId = req.params.id;
    const { cocktail_id, name, description } = req.body;

    const ingredients = parseJsonArray(req.body.ingredients);
    const steps = parseJsonArray(req.body.steps);

    const recipeResult = await pool.query(
      'SELECT * FROM recipe_versions WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];

    if (user.role !== 'admin' && recipe.user_id !== user.id) {
      return res.status(403).json({
        message: 'You can edit only your own recipes'
      });
    }

    const imageUrl = req.file
      ? `/uploads/recipes/${req.file.filename}`
      : recipe.image_url;

    const newCocktailId = Object.prototype.hasOwnProperty.call(req.body, 'cocktail_id')
    ? (cocktail_id ? Number(cocktail_id) : null)
    : recipe.cocktail_id;

    await pool.query(
      `
      UPDATE recipe_versions
      SET cocktail_id = $1,
          name = $2,
          description = $3,
          image_url = $4
      WHERE id = $5
      `,
      [
        newCocktailId,
        name || recipe.name,
        description !== undefined ? description : recipe.description,
        imageUrl,
        recipeId
      ]
    );

    await pool.query(
      'DELETE FROM recipe_ingredients WHERE recipe_version_id = $1',
      [recipeId]
    );

    await pool.query(
      'DELETE FROM steps WHERE recipe_version_id = $1',
      [recipeId]
    );

    for (const item of ingredients) {
      if (!item.name) {
        continue;
      }

      const ingredientId = await getOrCreateIngredient(item.name);

      await pool.query(
        `
        INSERT INTO recipe_ingredients (recipe_version_id, ingredient_id, quantity, unit)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (recipe_version_id, ingredient_id) DO NOTHING
        `,
        [
          recipeId,
          ingredientId,
          item.quantity || null,
          item.unit || null
        ]
      );
    }

    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].text) {
        continue;
      }

      await pool.query(
        `
        INSERT INTO steps (recipe_version_id, step_number, text)
        VALUES ($1, $2, $3)
        `,
        [
          recipeId,
          i + 1,
          steps[i].text
        ]
      );
    }

    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update recipe error' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const recipeId = req.params.id;

    const recipeResult = await pool.query(
      'SELECT * FROM recipe_versions WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];

    if (user.role !== 'admin' && recipe.user_id !== user.id) {
      return res.status(403).json({
        message: 'You can delete only your own recipes'
      });
    }

    await pool.query(
      'DELETE FROM recipe_versions WHERE id = $1',
      [recipeId]
    );

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete recipe error' });
  }
});

app.get('/api/recipe-comments/:recipeId', async (req, res) => {
  try {
    const recipeId = req.params.recipeId;

    const result = await pool.query(
      `
      SELECT
        rc.id,
        rc.text,
        rc.user_id,
        rc.created_at,
        u.username
      FROM recipe_comments rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.recipe_version_id = $1
      ORDER BY rc.created_at DESC
      `,
      [recipeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Recipe comments fetch error' });
  }
});

app.post('/api/recipe-comments/:recipeId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const recipeId = req.params.recipeId;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: 'Comment cannot be empty'
      });
    }

    const recipeResult = await pool.query(
      'SELECT id FROM recipe_versions WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const commentResult = await pool.query(
      `
      INSERT INTO recipe_comments (text, user_id, recipe_version_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [text, user.id, recipeId]
    );

    res.json({
      message: 'Comment saved successfully',
      comment: commentResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Save recipe comment error' });
  }
});

app.delete('/api/recipe-comments/:commentId', async (req, res) => {
  try {
    const user = await getLoggedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'You must be logged in' });
    }

    const commentId = req.params.commentId;

    const commentResult = await pool.query(
      `
      SELECT id, user_id
      FROM recipe_comments
      WHERE id = $1
      `,
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = commentResult.rows[0];

    const isAdmin = user.role === 'admin';
    const isOwner = Number(comment.user_id) === Number(user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: 'You can delete only your own comment'
      });
    }

    await pool.query(
      'DELETE FROM recipe_comments WHERE id = $1',
      [commentId]
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete recipe comment error' });
  }
});

// =======================
// ADMIN HELPERS
// =======================

async function getAdminUser(req, res) {
  const user = await getLoggedUser(req);

  if (!user) {
    res.status(401).json({ message: 'You must be logged in' });
    return null;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return null;
  }

  return user;
}

// =======================
// ADMIN ROUTES
// =======================

app.get('/api/admin/users', async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Admin users error' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const userId = Number(req.params.id);

    if (admin.id === userId) {
      return res.status(400).json({
        message: 'You cannot delete your own admin account'
      });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete user error' });
  }
});

app.get('/api/admin/recipes', async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const result = await pool.query(
      `
      SELECT
        rv.id,
        rv.name,
        rv.description,
        rv.image_url,
        rv.created_at,
        c.name AS cocktail_name,
        u.username AS created_by,
        u.email AS user_email
      FROM recipe_versions rv
      LEFT JOIN cocktails c ON rv.cocktail_id = c.id
      LEFT JOIN users u ON rv.user_id = u.id
      ORDER BY rv.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Admin recipes error' });
  }
});

// =======================
// ADMIN COCKTAIL ROUTES
// =======================

app.post('/api/admin/cocktails', uploadCocktailImage.single('image'), async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const { name, difficulty_id, alcohol_type_id } = req.body;

    if (!name || !difficulty_id || !alcohol_type_id) {
      return res.status(400).json({
        message: 'Name, difficulty and alcohol type are required'
      });
    }

    const imageUrl = req.file ? `/uploads/cocktails/${req.file.filename}` : null;

    const result = await pool.query(
      `
      INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, imageUrl, difficulty_id, alcohol_type_id]
    );

    res.status(201).json({
      message: 'Cocktail created successfully',
      cocktail: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Create cocktail error' });
  }
});

app.put('/api/admin/cocktails/:id', uploadCocktailImage.single('image'), async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const cocktailId = req.params.id;
    const { name, difficulty_id, alcohol_type_id } = req.body;

    const cocktailResult = await pool.query(
      'SELECT * FROM cocktails WHERE id = $1',
      [cocktailId]
    );

    if (cocktailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cocktail not found' });
    }

    const oldCocktail = cocktailResult.rows[0];

    const imageUrl = req.file
      ? `/uploads/cocktails/${req.file.filename}`
      : oldCocktail.image_url;

    const result = await pool.query(
      `
      UPDATE cocktails
      SET name = $1,
          image_url = $2,
          difficulty_id = $3,
          alcohol_type_id = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        name || oldCocktail.name,
        imageUrl,
        difficulty_id || oldCocktail.difficulty_id,
        alcohol_type_id || oldCocktail.alcohol_type_id,
        cocktailId
      ]
    );

    res.json({
      message: 'Cocktail updated successfully',
      cocktail: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update cocktail error' });
  }
});

app.delete('/api/admin/cocktails/:id', async (req, res) => {
  try {
    const admin = await getAdminUser(req, res);

    if (!admin) {
      return;
    }

    const cocktailId = req.params.id;

    const cocktailResult = await pool.query(
      'SELECT * FROM cocktails WHERE id = $1',
      [cocktailId]
    );

    if (cocktailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cocktail not found' });
    }

    await pool.query(
      'DELETE FROM cocktails WHERE id = $1',
      [cocktailId]
    );

    res.json({ message: 'Cocktail deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete cocktail error' });
  }
});

// =======================
// LOOKUP ROUTES
// =======================

app.get('/api/lookups/difficulties', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM difficulties ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Difficulties error' });
  }
});

app.get('/api/lookups/alcohol-types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alcohol_types ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Alcohol types error' });
  }
});

app.get('/api/lookups/ingredients', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ingredients ORDER BY name ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ingredients error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Blackout backend running on port ${PORT}`);
});