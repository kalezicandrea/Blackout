import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteRecipe,
  getMyRecipes,
  getSavedUser,
  getMyCocktails,
  updateMyCocktail,
  deleteMyCocktail,
  getDifficulties,
  getAlcoholTypes
} from '../services/api';

function MyRecipes() {
  const user = getSavedUser();

  const [cocktails, setCocktails] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [difficulties, setDifficulties] = useState([]);
  const [alcoholTypes, setAlcoholTypes] = useState([]);

  const [editingCocktailId, setEditingCocktailId] = useState(null);

  const [cocktailForm, setCocktailForm] = useState({
    name: '',
    difficulty_id: '',
    alcohol_type_id: ''
  });

  const [cocktailImage, setCocktailImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadMyData() {
    try {
      setError('');

      const cocktailsData = await getMyCocktails();
      const recipesData = await getMyRecipes();
      const difficultiesData = await getDifficulties();
      const alcoholTypesData = await getAlcoholTypes();

      setCocktails(cocktailsData);
      setRecipes(recipesData);
      setDifficulties(difficultiesData);
      setAlcoholTypes(alcoholTypesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyData();
  }, []);

  function handleCocktailChange(event) {
    setCocktailForm({
      ...cocktailForm,
      [event.target.name]: event.target.value
    });
  }

  function handleCocktailImageChange(event) {
    setCocktailImage(event.target.files[0]);
  }

  function handleEditCocktail(cocktail) {
    setEditingCocktailId(cocktail.id);

    setCocktailForm({
      name: cocktail.name,
      difficulty_id: String(cocktail.difficulty_id),
      alcohol_type_id: String(cocktail.alcohol_type_id)
    });

    setMessage(`Editing cocktail: ${cocktail.name}`);
    setError('');
  }

  function resetCocktailForm() {
    setEditingCocktailId(null);
    setCocktailForm({
      name: '',
      difficulty_id: '',
      alcohol_type_id: ''
    });
    setCocktailImage(null);
  }

  async function handleCocktailSubmit(event) {
    event.preventDefault();

    try {
      setMessage('');
      setError('');

      const dataToSend = new FormData();

      dataToSend.append('name', cocktailForm.name);
      dataToSend.append('difficulty_id', cocktailForm.difficulty_id);
      dataToSend.append('alcohol_type_id', cocktailForm.alcohol_type_id);

      if (cocktailImage) {
        dataToSend.append('image', cocktailImage);
      }

      await updateMyCocktail(editingCocktailId, dataToSend);

      setMessage('Cocktail updated successfully.');
      resetCocktailForm();
      await loadMyData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCocktail(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this cocktail? All recipes connected to this cocktail will also be deleted.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMyCocktail(id);
      setMessage('Cocktail deleted successfully.');
      await loadMyData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteRecipe(id) {
    const confirmed = window.confirm('Are you sure you want to delete this recipe?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteRecipe(id);
      await loadMyData();
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

  return (
    <div>
      <h1>My recipes</h1>

      <Link to="/add-recipe">Add new recipe</Link>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      {editingCocktailId && (
        <>
          <hr />

          <h2>Edit cocktail</h2>

          <form onSubmit={handleCocktailSubmit}>
            <div>
              <label>Name</label>
              <br />
              <input
                type="text"
                name="name"
                value={cocktailForm.name}
                onChange={handleCocktailChange}
                required
              />
            </div>

            <div>
              <label>Difficulty</label>
              <br />
              <select
                name="difficulty_id"
                value={cocktailForm.difficulty_id}
                onChange={handleCocktailChange}
                required
              >
                <option value="">Choose difficulty</option>

                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Alcohol type</label>
              <br />
              <select
                name="alcohol_type_id"
                value={cocktailForm.alcohol_type_id}
                onChange={handleCocktailChange}
                required
              >
                <option value="">Choose alcohol type</option>

                {alcoholTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>New image</label>
              <br />
              <input
                type="file"
                accept="image/*"
                onChange={handleCocktailImageChange}
              />
            </div>

            <br />

            <button type="submit">Save changes</button>

            {' '}

            <button type="button" onClick={resetCocktailForm}>
              Cancel edit
            </button>
          </form>
        </>
      )}

      <hr />

      <h2>My cocktails</h2>

      {cocktails.length === 0 ? (
        <p>You do not have cocktails yet.</p>
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
                  <span>Difficulty</span>
                  <strong>{cocktail.difficulty}</strong>
                </p>

                <p>
                  <span>Type</span>
                  <strong>{cocktail.alcohol_type}</strong>
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
                  <strong>{cocktail.review_count}</strong>
                </div>
              </div>

              <div className="ticket-admin-actions">
                <Link className="view-edit-button" to={`/cocktails/${cocktail.id}`}>View</Link>

                <button
                  type="button"
                  onClick={() => handleEditCocktail(cocktail)}
                >
                  Edit
                </button>

                <button
                  className="admin-delete-button"
                  type="button"
                  onClick={() => handleDeleteCocktail(cocktail.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr />

      <h2>My recipes</h2>

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
                className="delete-button"
                type="button"
                onClick={() => handleDeleteRecipe(recipe.id)}
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