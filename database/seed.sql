-- seed.sql
-- PostgreSQL seed data for Cocktail Maker / Blackout project
-- Run this AFTER schema.sql.

BEGIN;

-- Basic lookup data
INSERT INTO roles (name) VALUES
('user'),
('admin')
ON CONFLICT (name) DO NOTHING;

INSERT INTO difficulties (name) VALUES
('easy'),
('medium'),
('hard')
ON CONFLICT (name) DO NOTHING;

INSERT INTO alcohol_types (name) VALUES
('alcoholic'),
('non-alcoholic')
ON CONFLICT (name) DO NOTHING;

-- Ingredients
INSERT INTO ingredients (name) VALUES
('white rum'),
('tequila'),
('whiskey'),
('gin'),
('vodka'),
('campari'),
('sweet vermouth'),
('coffee liqueur'),
('lime juice'),
('lemon juice'),
('pineapple juice'),
('orange juice'),
('grenadine'),
('sugar'),
('simple syrup'),
('mint leaves'),
('soda water'),
('tonic water'),
('lemon-lime soda'),
('coconut cream'),
('espresso'),
('orange bitters'),
('salt'),
('ice'),
('orange peel'),
('lime wedge'),
('maraschino cherry')
ON CONFLICT (name) DO NOTHING;

-- Cocktails
INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Mojito',
  '/uploads/cocktails/mojito.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'easy'
  AND a.name = 'alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Mojito');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Margarita',
  '/uploads/cocktails/margarita.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'medium'
  AND a.name = 'alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Margarita');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Old Fashioned',
  '/uploads/cocktails/old-fashioned.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'medium'
  AND a.name = 'alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Old Fashioned');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Negroni',
  '/uploads/cocktails/negroni.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'medium'
  AND a.name = 'alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Negroni');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Espresso Martini',
  '/uploads/cocktails/espresso-martini.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'hard'
  AND a.name = 'alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Espresso Martini');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Virgin Mojito',
  '/uploads/cocktails/virgin-mojito.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'easy'
  AND a.name = 'non-alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Virgin Mojito');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Shirley Temple',
  '/uploads/cocktails/shirley-temple.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'easy'
  AND a.name = 'non-alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Shirley Temple');

INSERT INTO cocktails (name, image_url, difficulty_id, alcohol_type_id, avg_rating, review_count)
SELECT
  'Virgin Pina Colada',
  '/uploads/cocktails/virgin-pina-colada.jpg',
  d.id,
  a.id,
  0,
  0
FROM difficulties d, alcohol_types a
WHERE d.name = 'medium'
  AND a.name = 'non-alcoholic'
  AND NOT EXISTS (SELECT 1 FROM cocktails WHERE name = 'Virgin Pina Colada');

-- Recipe versions
INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Classic Mojito',
  'Refreshing cocktail with rum, mint, lime, sugar and soda water.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Mojito'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Classic Mojito'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Classic Margarita',
  'Tequila-based cocktail with lime juice and salt rim.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Margarita'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Classic Margarita'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Classic Old Fashioned',
  'Whiskey cocktail with bitters, simple syrup and orange peel.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Old Fashioned'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Classic Old Fashioned'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Classic Negroni',
  'Equal parts gin, campari and sweet vermouth.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Negroni'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Classic Negroni'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Espresso Martini',
  'Cold coffee cocktail with vodka, coffee liqueur and espresso.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Espresso Martini'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Espresso Martini'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Virgin Mojito',
  'Non-alcoholic mojito with mint, lime, sugar and soda water.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Virgin Mojito'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Virgin Mojito'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Shirley Temple',
  'Sweet non-alcoholic drink with grenadine and lemon-lime soda.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Shirley Temple'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Shirley Temple'
  );

INSERT INTO recipe_versions (cocktail_id, user_id, name, description, image_url)
SELECT
  c.id,
  NULL,
  'Virgin Pina Colada',
  'Creamy non-alcoholic tropical drink with pineapple juice and coconut cream.',
  c.image_url
FROM cocktails c
WHERE c.name = 'Virgin Pina Colada'
  AND NOT EXISTS (
    SELECT 1
    FROM recipe_versions rv
    WHERE rv.cocktail_id = c.id
      AND rv.name = 'Virgin Pina Colada'
  );

-- Recipe ingredients
INSERT INTO recipe_ingredients (recipe_version_id, ingredient_id, quantity, unit)
SELECT rv.id, i.id, v.quantity, v.unit
FROM recipe_versions rv
JOIN cocktails c ON c.id = rv.cocktail_id
JOIN (
  VALUES
    ('Mojito', 'white rum', '50', 'ml'),
    ('Mojito', 'lime juice', '25', 'ml'),
    ('Mojito', 'sugar', '2', 'tsp'),
    ('Mojito', 'mint leaves', '8', 'leaves'),
    ('Mojito', 'soda water', '100', 'ml'),
    ('Mojito', 'ice', NULL, NULL),

    ('Margarita', 'tequila', '50', 'ml'),
    ('Margarita', 'lime juice', '25', 'ml'),
    ('Margarita', 'simple syrup', '15', 'ml'),
    ('Margarita', 'salt', NULL, NULL),
    ('Margarita', 'ice', NULL, NULL),
    ('Margarita', 'lime wedge', '1', 'piece'),

    ('Old Fashioned', 'whiskey', '60', 'ml'),
    ('Old Fashioned', 'simple syrup', '10', 'ml'),
    ('Old Fashioned', 'orange bitters', '2', 'dashes'),
    ('Old Fashioned', 'ice', NULL, NULL),
    ('Old Fashioned', 'orange peel', '1', 'piece'),

    ('Negroni', 'gin', '30', 'ml'),
    ('Negroni', 'campari', '30', 'ml'),
    ('Negroni', 'sweet vermouth', '30', 'ml'),
    ('Negroni', 'ice', NULL, NULL),
    ('Negroni', 'orange peel', '1', 'piece'),

    ('Espresso Martini', 'vodka', '50', 'ml'),
    ('Espresso Martini', 'coffee liqueur', '25', 'ml'),
    ('Espresso Martini', 'espresso', '30', 'ml'),
    ('Espresso Martini', 'simple syrup', '10', 'ml'),
    ('Espresso Martini', 'ice', NULL, NULL),

    ('Virgin Mojito', 'lime juice', '25', 'ml'),
    ('Virgin Mojito', 'sugar', '2', 'tsp'),
    ('Virgin Mojito', 'mint leaves', '8', 'leaves'),
    ('Virgin Mojito', 'soda water', '150', 'ml'),
    ('Virgin Mojito', 'ice', NULL, NULL),

    ('Shirley Temple', 'grenadine', '20', 'ml'),
    ('Shirley Temple', 'lemon-lime soda', '150', 'ml'),
    ('Shirley Temple', 'ice', NULL, NULL),
    ('Shirley Temple', 'maraschino cherry', '1', 'piece'),

    ('Virgin Pina Colada', 'pineapple juice', '120', 'ml'),
    ('Virgin Pina Colada', 'coconut cream', '60', 'ml'),
    ('Virgin Pina Colada', 'ice', NULL, NULL)
) AS v(cocktail_name, ingredient_name, quantity, unit)
  ON v.cocktail_name = c.name
JOIN ingredients i ON i.name = v.ingredient_name
ON CONFLICT (recipe_version_id, ingredient_id) DO NOTHING;

-- Steps
INSERT INTO steps (recipe_version_id, step_number, text)
SELECT rv.id, v.step_number, v.text
FROM recipe_versions rv
JOIN cocktails c ON c.id = rv.cocktail_id
JOIN (
  VALUES
    ('Mojito', 1, 'Add mint leaves, sugar and lime juice into a glass.'),
    ('Mojito', 2, 'Gently muddle the ingredients.'),
    ('Mojito', 3, 'Add rum and ice.'),
    ('Mojito', 4, 'Top with soda water and stir.'),

    ('Margarita', 1, 'Rub the rim of the glass with a lime wedge and dip it in salt.'),
    ('Margarita', 2, 'Add tequila, lime juice, simple syrup and ice into a shaker.'),
    ('Margarita', 3, 'Shake well and strain into the glass.'),

    ('Old Fashioned', 1, 'Add simple syrup and bitters into a glass.'),
    ('Old Fashioned', 2, 'Add whiskey and ice.'),
    ('Old Fashioned', 3, 'Stir gently and garnish with orange peel.'),

    ('Negroni', 1, 'Add gin, campari and sweet vermouth into a mixing glass with ice.'),
    ('Negroni', 2, 'Stir until chilled.'),
    ('Negroni', 3, 'Strain into a glass and garnish with orange peel.'),

    ('Espresso Martini', 1, 'Add vodka, coffee liqueur, espresso, simple syrup and ice into a shaker.'),
    ('Espresso Martini', 2, 'Shake strongly until cold and foamy.'),
    ('Espresso Martini', 3, 'Strain into a chilled glass.'),

    ('Virgin Mojito', 1, 'Add mint leaves, sugar and lime juice into a glass.'),
    ('Virgin Mojito', 2, 'Gently muddle the ingredients.'),
    ('Virgin Mojito', 3, 'Add ice and top with soda water.'),

    ('Shirley Temple', 1, 'Fill a glass with ice.'),
    ('Shirley Temple', 2, 'Add grenadine and lemon-lime soda.'),
    ('Shirley Temple', 3, 'Stir gently and garnish with a cherry.'),

    ('Virgin Pina Colada', 1, 'Add pineapple juice, coconut cream and ice into a blender.'),
    ('Virgin Pina Colada', 2, 'Blend until smooth.'),
    ('Virgin Pina Colada', 3, 'Pour into a glass and serve cold.')
) AS v(cocktail_name, step_number, text)
  ON v.cocktail_name = c.name
ON CONFLICT (recipe_version_id, step_number) DO NOTHING;

-- Demo users
INSERT INTO users (username, email, password_hash, role_id)
VALUES
(
  'admin',
  'admin@blackout.com',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiRZV9nvV7Gt3ny2PwH/86JPUQT1OAS',
  (SELECT id FROM roles WHERE name = 'admin')
),
(
  'user',
  'user@blackout.com',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiRZV9nvV7Gt3ny2PwH/86JPUQT1OAS',
  (SELECT id FROM roles WHERE name = 'user')
)
ON CONFLICT DO NOTHING;

COMMIT;
