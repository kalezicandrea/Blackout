import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOriginalRecipes } from '../services/api';

function OriginalRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOriginalRecipes() {
      try {
        const data = await getOriginalRecipes();
        setRecipes(data);
      } catch (err) {
        console.error(err);
        setError('Could not load original recipes');
      } finally {
        setLoading(false);
      }
    }

    loadOriginalRecipes();
  }, []);

  if (loading) {
    return <p>Loading original recipes...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Original user recipes</h1>

      <p>
        These are original recipes created by users, not connected to an existing cocktail.
      </p>

      {recipes.length === 0 ? (
        <p>No original user recipes found.</p>
      ) : (
        <div className="cocktail-grid">
          {recipes.map((recipe) => (
            <div className="cocktail-card" key={recipe.id}>
              {recipe.image_url && (
                <img
                  src={`http://localhost:5000${recipe.image_url}`}
                  alt={recipe.name}
                />
              )}

              <h3>{recipe.name}</h3>

              <p className="card-meta">
                Created by: {recipe.created_by}
              </p>

              {recipe.description && <p>{recipe.description}</p>}

              <Link className="card-link" to={`/recipes/${recipe.id}`}>
                View recipe
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OriginalRecipes;