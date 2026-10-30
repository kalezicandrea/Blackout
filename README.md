# Blackout: Cocktail Maker

A full-stack web application for browsing, searching and rating cocktail recipes, with user accounts and an admin panel.

Individual project for a university course.

## Features

- Browse and search cocktails by name
- Advanced filtering by ingredients, alcohol content, difficulty, number of ingredients and rating
- Rate cocktails (1-5) and leave comments
- Save favorite recipes
- User registration and login with hashed passwords
- Role-based access (user / admin)
- Admin panel for managing cocktails, images and users
- Random cocktail button
- Cocktail suggestions based on the ingredients the user has
- User-submitted and edited recipes

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Database:** PostgreSQL

## Project Structure

```
Blackout/
├── backend/
├── database/              # database schema and scripts
├── frontend/              # user interface
└── blackout-info.docx     # project specification
```

## Database Design

Relational schema with the main tables: `User`, `Role`, `Cocktail`, `Ingredient`, `Difficulty`, `AlcoholType`, `Favorite`, `Review`, `RecipeVersion`, `RecipeIngredient` and `Step`.

`RecipeVersion` supports three cases: original recipes, user-edited versions of originals, and recipes created by users.
