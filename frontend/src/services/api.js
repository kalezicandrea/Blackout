const API_URL = import.meta.env.VITE_API_URL;

export async function getCocktails(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.difficulty) {
    params.append('difficulty', filters.difficulty);
  }

  if (filters.alcohol_type) {
    params.append('alcohol_type', filters.alcohol_type);
  }

  if (filters.ingredient) {
    params.append('ingredient', filters.ingredient);
  }

  if (filters.min_rating) {
    params.append('min_rating', filters.min_rating);
  }

  if (filters.sort) {
    params.append('sort', filters.sort);
  }

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/cocktails?${queryString}`
    : `${API_URL}/cocktails`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch cocktails');
  }

  return response.json();
}

export async function getCocktailDetails(id) {
  const response = await fetch(`${API_URL}/cocktails/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch cocktail details');
  }

  return response.json();
}

export async function getCocktailReviews(cocktailId) {
  const response = await fetch(`${API_URL}/reviews/${cocktailId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
}

export async function getRecipeDetails(id) {
  const response = await fetch(`${API_URL}/recipes/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch recipe details');
  }

  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

export async function loginUser(userData) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

export function getSavedUser() {
  const user = localStorage.getItem('user');

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export async function getFavorites() {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch favorites');
  }

  return data;
}

export async function addFavorite(cocktailId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites/${cocktailId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to add favorite');
  }

  return data;
}

export async function removeFavorite(cocktailId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/favorites/${cocktailId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove favorite');
  }

  return data;
}

export async function saveReview(cocktailId, reviewData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/reviews/${cocktailId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to save review');
  }

  return data;
}

export async function deleteReview(reviewId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete review');
  }

  return data;
}

export async function getRecipeComments(recipeId) {
  const response = await fetch(`${API_URL}/recipe-comments/${recipeId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch recipe comments');
  }

  return response.json();
}

export async function saveRecipeComment(recipeId, commentData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipe-comments/${recipeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(commentData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to save recipe comment');
  }

  return data;
}

export async function deleteRecipeComment(commentId) {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipe-comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete recipe comment');
  }

  return data;
}

export async function getMyRecipes() {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipes/my`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch my recipes');
  }

  return data;
}

export async function createRecipe(formData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create recipe');
  }

  return data;
}

export async function deleteRecipe(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete recipe');
  }

  return data;
}

export async function getAdminUsers() {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }

  return data;
}

export async function deleteAdminUser(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user');
  }

  return data;
}

export async function getAdminRecipes() {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/recipes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch recipes');
  }

  return data;
}

export async function getDifficulties() {
  const response = await fetch(`${API_URL}/lookups/difficulties`);

  if (!response.ok) {
    throw new Error('Failed to fetch difficulties');
  }

  return response.json();
}

export async function getAlcoholTypes() {
  const response = await fetch(`${API_URL}/lookups/alcohol-types`);

  if (!response.ok) {
    throw new Error('Failed to fetch alcohol types');
  }

  return response.json();
}

export async function createAdminCocktail(formData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/cocktails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create cocktail');
  }

  return data;
}

export async function updateAdminCocktail(id, formData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/cocktails/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update cocktail');
  }

  return data;
}

export async function deleteAdminCocktail(id) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/cocktails/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete cocktail');
  }

  return data;
}

export async function getRandomCocktail() {
  const response = await fetch(`${API_URL}/cocktails/random`);

  if (!response.ok) {
    throw new Error('Failed to fetch random cocktail');
  }

  return response.json();
}

export async function getCocktailsByIngredients(ingredientsText) {
  const response = await fetch(
    `${API_URL}/cocktails/by-ingredients/search?ingredients=${encodeURIComponent(ingredientsText)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch cocktails by ingredients');
  }

  return response.json();
}

export async function updateRecipe(id, formData) {
  const token = getToken();

  const response = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update recipe');
  }

  return data;
}

export async function getOriginalRecipes() {
  const response = await fetch(`${API_URL}/recipes/original`);

  if (!response.ok) {
    throw new Error('Failed to fetch original recipes');
  }

  return response.json();
}