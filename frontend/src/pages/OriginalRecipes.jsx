import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOriginalRecipes } from '../services/api';

function formatOptionLabel(text) {
  if (!text) {
    return '';
  }

  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

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
              <div className="ticket-title">
                {cocktail.name}
              </div>

              <div className="ticket-dashed-line"></div>

              <div className="ticket-image">
                {cocktail.image_url && (
                  <img
                    src={`http://localhost:5000${cocktail.image_url}`}
                    alt={cocktail.name}
                  />
                )}
              </div>

              <div className="ticket-details">
                <p>
                  <span>Created by</span>
                  <strong>{cocktail.created_by}</strong>
                </p>

                <p>
                  <span>Difficulty</span>
                  <strong>{formatOptionLabel(cocktail.difficulty)}</strong>
                </p>

                <p>
                  <span>Type</span>
                  <strong>{formatOptionLabel(cocktail.alcohol_type)}</strong>
                </p>
              </div>

              <div className="ticket-dashed-line"></div>

              <div className="ticket-stats">
                <div>
                  <span>Rating</span>
                  <strong>★ {cocktail.avg_rating}</strong>
                </div>

                <div>
                  <span>Reviews</span>
                  <strong>{cocktail.review_count || 0}</strong>
                </div>
              </div>

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