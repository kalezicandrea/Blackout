import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteRecipe, getMyRecipes, getSavedUser } from '../services/api';

function MyRecipes() {
  const user = getSavedUser();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMyRecipes() {
    try {
      setError('');

      const data = await getMyRecipes();
      setRecipes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyRecipes();
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm('Are you sure you want to delete this recipe?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteRecipe(id);
      await loadMyRecipes();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p>You must be logged in to see your recipes.</p>;
  }

  if (loading) {
    return <p>Loading my recipes...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>My recipes</h1>

      <Link to="/add-recipe">Add new recipe</Link>

      <hr />

      {recipes.length === 0 ? (
        <p>You do not have recipes yet.</p>
      ) : (
        recipes.map((recipe) => (
          <div className="feature-card image-right-card" key={recipe.id}>
            <div className="image-right-text">
              <h3>{recipe.name}</h3>

              {recipe.cocktail_name && (
                <p>Connected cocktail: {recipe.cocktail_name}</p>
              )}

              {recipe.description && <p>{recipe.description}</p>}

              <Link to={`/recipes/${recipe.id}`}>View recipe</Link>

              {' | '}

              <Link to={`/edit-recipe/${recipe.id}`}>Edit</Link>

              {' | '}

              <button
                className='delete-button'
                type="button"
                onClick={() => handleDelete(recipe.id)}
              >
                Delete
              </button>
            </div>

            {recipe.image_url && (
              <div className="image-right-img">
                <img
                  src={`http://localhost:5000${recipe.image_url}`}
                  alt={recipe.name}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyRecipes;