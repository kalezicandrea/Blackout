DROP TABLE IF EXISTS step_ingredients CASCADE;
DROP TABLE IF EXISTS steps CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_versions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS cocktails CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS alcohol_types CASCADE;
DROP TABLE IF EXISTS difficulties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS recipe_comments CASCADE;

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INT NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE difficulties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE alcohol_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE cocktails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  difficulty_id INT NOT NULL REFERENCES difficulties(id),
  alcohol_type_id INT NOT NULL REFERENCES alcohol_types(id),
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cocktail_id INT NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, cocktail_id)
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  text TEXT,
  rate INT NOT NULL CHECK (rate BETWEEN 1 AND 5),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cocktail_id INT NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, cocktail_id)
);

CREATE TABLE recipe_versions (
  id SERIAL PRIMARY KEY,
  cocktail_id INT REFERENCES cocktails(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT recipe_version_owner_check
  CHECK (
    cocktail_id IS NOT NULL OR user_id IS NOT NULL
  )
);

CREATE TABLE recipe_ingredients (
  recipe_version_id INT NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity VARCHAR(50),
  unit VARCHAR(30),
  PRIMARY KEY (recipe_version_id, ingredient_id)
);

CREATE TABLE recipe_comments (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_version_id INTEGER NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE steps (
  id SERIAL PRIMARY KEY,
  recipe_version_id INT NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  text TEXT NOT NULL,
  UNIQUE (recipe_version_id, step_number)
);

CREATE TABLE step_ingredients (
  step_id INT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, ingredient_id)
);

CREATE INDEX idx_cocktails_name ON cocktails(name);
CREATE INDEX idx_cocktails_difficulty ON cocktails(difficulty_id);
CREATE INDEX idx_cocktails_alcohol_type ON cocktails(alcohol_type_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_reviews_cocktail ON reviews(cocktail_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_recipe_versions_user ON recipe_versions(user_id);
CREATE INDEX idx_recipe_versions_cocktail ON recipe_versions(cocktail_id);