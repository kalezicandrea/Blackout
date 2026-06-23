import { useEffect, useState } from 'react';
import CocktailCard from '../components/CocktailCard';
import { getFavorites, removeFavorite, getSavedUser } from '../services/api';

function Favorites() {
  const user = getSavedUser();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadFavorites() {
    try {
      setError('');

      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function handleRemoveFavorite(cocktailId) {
    try {
      await removeFavorite(cocktailId);
      await loadFavorites();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p>You must be logged in to see favorites.</p>;
  }

  if (loading) {
    return <p>Loading favorites...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>My favorites</h1>

      {favorites.length === 0 ? (
        <p>You do not have favorite cocktails yet.</p>
        ) : (
        <div className="cocktail-grid">
            {favorites.map((cocktail) => (
            <div key={cocktail.id}>
                <CocktailCard cocktail={cocktail} />

                <br />

                <button
                type="button"
                onClick={() => handleRemoveFavorite(cocktail.id)}
                >
                Remove from favorites
                </button>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;