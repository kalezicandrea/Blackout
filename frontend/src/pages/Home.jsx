import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CocktailCard from '../components/CocktailCard';
import { getCocktails, getRandomCocktail, getSavedUser } from '../services/api';

function Home() {
  const user = getSavedUser();
  const navigate = useNavigate();

  const [cocktails, setCocktails] = useState([]);

  useEffect(() => {
    async function loadCocktails() {
      try {
        const data = await getCocktails({ sort: 'rating' });
        setCocktails(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadCocktails();
  }, []);

  async function handleRandomCocktail() {
    try {
      const cocktail = await getRandomCocktail();
      navigate(`/cocktails/${cocktail.id}`);
    } catch (error) {
      alert('Could not load random cocktail');
    }
  }

  const bestCocktail = cocktails.length > 0
    ? [...cocktails].sort((a, b) => {
        const scoreA = Number(a.avg_rating || 0) * Number(a.review_count || 0);
        const scoreB = Number(b.avg_rating || 0) * Number(b.review_count || 0);

        return scoreB - scoreA;
      })[0]
    : null;

  const topRatedCocktails = [...cocktails]
    .filter((cocktail) => cocktail.id !== bestCocktail?.id)
    .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0))
    .slice(0, 4);

  return (
    <div>
      <section className="hero">

        <h1 className="hero-title">
          Discover your next <span>favorite drink</span>
        </h1>

        <p className="hero-text">
          Explore cocktails, view original recipes, find drinks by ingredients,
          save favorites and create your own cocktail versions.
        </p>

        <div className="hero-actions">
          <Link className="primary-link" to="/cocktails">
            Explore cocktails
          </Link>

          <button type="button" onClick={handleRandomCocktail}>
            Random cocktail
          </button>

          {user ? (
            <Link className="secondary-link" to="/add-recipe">
              Add your recipe
            </Link>
          ) : (
            <Link className="secondary-link" to="/register">
              Create account
            </Link>
          )}
        </div>
      </section>

      <section className="best-cocktail-section">
        {bestCocktail ? (
          <div className="best-cocktail-content">
            <div className="best-cocktail-text">
              <p className="best-cocktail-label">
                Best cocktail of all time
              </p>

              <h2 className="best-cocktail-name">
                {bestCocktail.name}
              </h2>

              <div className="best-cocktail-stats">
                <p>
                  Rating: <strong>★ {bestCocktail.avg_rating}</strong>
                </p>

                <p>
                  Reviews: <strong>{bestCocktail.review_count}</strong>
                </p>
              </div>

              <Link
                className="primary-link"
                to={`/cocktails/${bestCocktail.id}`}
              >
                View cocktail
              </Link>
            </div>

            {bestCocktail.image_url && (
              <div className="best-cocktail-image">
                <img
                  src={`http://localhost:5000${bestCocktail.image_url}`}
                  alt={bestCocktail.name}
                />
              </div>
            )}
          </div>
        ) : (
          <p>No cocktails found.</p>
        )}
      </section>

      <h2>Top rated cocktails</h2>

      {topRatedCocktails.length === 0 ? (
        <p>No cocktails found.</p>
      ) : (
        <div className="cocktail-grid">
          {topRatedCocktails.map((cocktail) => (
            <CocktailCard key={cocktail.id} cocktail={cocktail} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;