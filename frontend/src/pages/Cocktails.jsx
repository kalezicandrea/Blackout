import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CocktailCard from '../components/CocktailCard';
import {
  getCocktails,
  getDifficulties,
  getAlcoholTypes,
  getRandomCocktail,
  getCocktailsByIngredients
} from '../services/api';

function Cocktails() {
  const navigate = useNavigate();

  const [cocktails, setCocktails] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [alcoholTypes, setAlcoholTypes] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    alcohol_type: '',
    ingredient: '',
    min_rating: '',
    sort: ''
  });

  const [ingredientsText, setIngredientsText] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCocktails(customFilters = filters) {
    try {
      setError('');
      setLoading(true);

      const data = await getCocktails(customFilters);
      setCocktails(data);
    } catch (err) {
      console.error(err);
      setError('Could not load cocktails');
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const difficultiesData = await getDifficulties();
      const alcoholTypesData = await getAlcoholTypes();

      setDifficulties(difficultiesData);
      setAlcoholTypes(alcoholTypesData);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadCocktails();
    loadLookups();
  }, []);

  function handleChange(event) {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await loadCocktails(filters);
  }

  async function handleReset() {
    const emptyFilters = {
      search: '',
      difficulty: '',
      alcohol_type: '',
      ingredient: '',
      min_rating: '',
      sort: ''
    };

    setFilters(emptyFilters);
    setIngredientsText('');
    await loadCocktails(emptyFilters);
  }

  async function handleRandomCocktail() {
    try {
      setError('');

      const randomCocktail = await getRandomCocktail();

      navigate(`/cocktails/${randomCocktail.id}`);
    } catch (err) {
      console.error(err);
      setError('Could not load random cocktail');
    }
  }

  async function handleIngredientsSearch(event) {
    event.preventDefault();

    try {
      setError('');
      setLoading(true);

      const data = await getCocktailsByIngredients(ingredientsText);
      setCocktails(data);
    } catch (err) {
      console.error(err);
      setError('Could not search by ingredients');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Cocktails</h1>

      <button type="button" onClick={handleRandomCocktail}>
        Random cocktail
      </button>

      <hr />

      <h2>Search and filters</h2>

      <form onSubmit={handleSearchSubmit}>
        <div>
          <label>Search by name</label>
          <br />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="mojito"
          />
        </div>

        <div>
          <label>Difficulty</label>
          <br />
          <select
            name="difficulty"
            value={filters.difficulty}
            onChange={handleChange}
          >
            <option value="">All difficulties</option>

            {difficulties.map((difficulty) => (
              <option key={difficulty.id} value={difficulty.name}>
                {difficulty.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Alcohol type</label>
          <br />
          <select
            name="alcohol_type"
            value={filters.alcohol_type}
            onChange={handleChange}
          >
            <option value="">All types</option>

            {alcoholTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Ingredient</label>
          <br />
          <input
            type="text"
            name="ingredient"
            value={filters.ingredient}
            onChange={handleChange}
            placeholder="lime juice"
          />
        </div>

        <div>
          <label>Minimum rating</label>
          <br />
          <select
            name="min_rating"
            value={filters.min_rating}
            onChange={handleChange}
          >
            <option value="">Any rating</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </div>

        <div>
          <label>Sort</label>
          <br />
          <select
            name="sort"
            value={filters.sort}
            onChange={handleChange}
          >
            <option value="">Name A-Z</option>
            <option value="popular">Most popular</option>
            <option value="rating">Best rated</option>
          </select>
        </div>

        <br />

        <button type="submit">Apply filters</button>
        {' '}
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </form>

      <hr />

      <h2>Find cocktails by ingredients you have</h2>

      <form onSubmit={handleIngredientsSearch}>
        <div>
          <label>Ingredients</label>
          <br />
          <input
            type="text"
            value={ingredientsText}
            onChange={(event) => setIngredientsText(event.target.value)}
            placeholder="vodka, lime juice, mint leaves"
          />
        </div>

        <br />

        <button type="submit">Find cocktails</button>
      </form>

      <hr />

      {loading && <p>Loading cocktails...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <>
          <h2>Results</h2>

          {cocktails.length === 0 ? (
            <p>No cocktails found.</p>
          ) : (
            <div className="cocktail-grid">
                {cocktails.map((cocktail) => (
                    <CocktailCard key={cocktail.id} cocktail={cocktail} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Cocktails;