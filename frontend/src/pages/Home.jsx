import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CocktailCard from '../components/CocktailCard';
import { getCocktails, getRandomCocktail, getSavedUser } from '../services/api';

function Home() {
  const user = getSavedUser();
  const navigate = useNavigate();

  const [topCocktails, setTopCocktails] = useState([]);

  useEffect(() => {
    async function loadTopCocktails() {
      try {
        const data = await getCocktails({ sort: 'rating' });
        setTopCocktails(data.slice(0, 4));
      } catch (error) {
        console.error(error);
      }
    }

    loadTopCocktails();
  }, []);

  async function handleRandomCocktail() {
    try {
      const cocktail = await getRandomCocktail();
      navigate(`/cocktails/${cocktail.id}`);
    } catch (error) {
      alert('Could not load random cocktail');
    }
  }

  return (
    <div>
      <section className="hero">
        <span className="hero-label">Cocktail recipe platform</span>

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

      <h2>Top rated cocktails</h2>

      {topCocktails.length === 0 ? (
        <p>No cocktails found.</p>
      ) : (
        <div className="cocktail-grid">
          {topCocktails.map((cocktail) => (
            <CocktailCard key={cocktail.id} cocktail={cocktail} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;