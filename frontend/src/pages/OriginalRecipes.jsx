import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOriginalRecipes } from '../services/api';

function OriginalRecipes() {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOriginalRecipes() {
      try {
        const data = await getOriginalRecipes();
        setCocktails(data);
      } catch (err) {
        console.error(err);
        setError('Could not load original cocktails');
      } finally {
        setLoading(false);
      }
    }

    loadOriginalRecipes();
  }, []);

  if (loading) {
    return <p>Loading original cocktails...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Original user cocktails</h1>

      <p>
        These are new cocktails created by users together with their first recipe.
      </p>

      {cocktails.length === 0 ? (
        <p>No original user cocktails found.</p>
      ) : (
        <div className="cocktail-grid">
          {cocktails.map((cocktail) => (
            <div className="cocktail-card" key={cocktail.id}>
              {cocktail.image_url && (
                <img
                  src={`http://localhost:5000${cocktail.image_url}`}
                  alt={cocktail.name}
                />
              )}

              <h3>{cocktail.name}</h3>

              <p className="card-meta">Created by: {cocktail.created_by}</p>
              <p className="card-meta">Difficulty: {cocktail.difficulty}</p>
              <p className="card-meta">Type: {cocktail.alcohol_type}</p>
              <p className="card-meta">Rating: {cocktail.avg_rating}</p>

              {cocktail.description && <p>{cocktail.description}</p>}

              <Link className="card-link" to={`/cocktails/${cocktail.id}`}>
                View cocktail
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OriginalRecipes;