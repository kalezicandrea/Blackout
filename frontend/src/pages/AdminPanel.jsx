import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSavedUser,
  getAdminUsers,
  deleteAdminUser,
  getAdminRecipes,
  deleteRecipe,
  getCocktails,
  getDifficulties,
  getAlcoholTypes,
  createAdminCocktail,
  updateAdminCocktail,
  deleteAdminCocktail
} from '../services/api';

function formatOptionLabel(text) {
  if (!text) {
    return '';
  }

  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

function AdminPanel() {
  const user = getSavedUser();
  const cocktailFormRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [cocktails, setCocktails] = useState([]);

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadAdminData() {
    try {
      setError('');

      const usersData = await getAdminUsers();
      const recipesData = await getAdminRecipes();
      const cocktailsData = await getCocktails();
      const difficultiesData = await getDifficulties();
      const alcoholTypesData = await getAlcoholTypes();

      setUsers(usersData);
      setRecipes(recipesData);
      setCocktails(cocktailsData);
      setDifficulties(difficultiesData);
      setAlcoholTypes(alcoholTypesData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
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

  function resetCocktailForm() {
    setEditingCocktailId(null);
    setCocktailForm({
      name: '',
      difficulty_id: '',
      alcohol_type_id: ''
    });
    setCocktailImage(null);
  }

  function handleEditCocktail(cocktail) {
    const difficulty = difficulties.find(
      (item) => item.name === cocktail.difficulty
    );

    const alcoholType = alcoholTypes.find(
      (item) => item.name === cocktail.alcohol_type
    );

    setEditingCocktailId(cocktail.id);

    setCocktailForm({
      name: cocktail.name,
      difficulty_id: difficulty ? String(difficulty.id) : '',
      alcohol_type_id: alcoholType ? String(alcoholType.id) : ''
    });

    setMessage(`Editing cocktail: ${cocktail.name}`);
    setError('');

    setTimeout(() => {
      cocktailFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 0);
  }

  async function handleCocktailSubmit(event) {
    event.preventDefault();

    try {
      setMessage('');
      setError('');

      if (!cocktailForm.name || !cocktailForm.difficulty_id || !cocktailForm.alcohol_type_id) {
        setError('Name, difficulty and alcohol type are required.');
        return;
      }

      const dataToSend = new FormData();

      dataToSend.append('name', cocktailForm.name);
      dataToSend.append('difficulty_id', cocktailForm.difficulty_id);
      dataToSend.append('alcohol_type_id', cocktailForm.alcohol_type_id);

      if (cocktailImage) {
        dataToSend.append('image', cocktailImage);
      }

      if (editingCocktailId) {
        await updateAdminCocktail(editingCocktailId, dataToSend);
        setMessage('Cocktail updated successfully.');
      } else {
        await createAdminCocktail(dataToSend);
        setMessage('Cocktail created successfully.');
      }

      resetCocktailForm();
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCocktail(id) {
    const confirmed = window.confirm('Are you sure you want to delete this cocktail?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminCocktail(id);
      setMessage('Cocktail deleted successfully.');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteUser(id) {
    const confirmed = window.confirm('Are you sure you want to delete this user?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminUser(id);
      await loadAdminData();
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
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p>You must be logged in.</p>;
  }

  if (user.role !== 'admin') {
    return <p>Admin access required.</p>;
  }

  if (loading) {
    return <p>Loading admin panel...</p>;
  }

  return (
    <div>
      <h1>Admin panel</h1>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      <hr />

      <section ref={cocktailFormRef}>
        <h2>{editingCocktailId ? 'Edit cocktail' : 'Add cocktail'}</h2>

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
            <label>Image</label>
            <br />
            <input
              type="file"
              accept="image/*"
              onChange={handleCocktailImageChange}
            />
          </div>

          <br />

          <button type="submit">
            {editingCocktailId ? 'Save changes' : 'Add cocktail'}
          </button>

          {editingCocktailId && (
            <>
              {' '}
              <button type="button" onClick={resetCocktailForm}>
                Cancel edit
              </button>
            </>
          )}
        </form>
      </section>

      <hr />

      <h2>Cocktails</h2>

      {cocktails.length === 0 ? (
        <p>No cocktails found.</p>
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
                  className='admin-delete-button'
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

      <h2>Users</h2>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        users.map((item) => (
          <div className="feature-card" key={item.id}>
            <h3>{item.username}</h3>

            <p>Email: {item.email}</p>
            <p>Role: {item.role}</p>

            <button
              className='delete-button'
              type="button"
              onClick={() => handleDeleteUser(item.id)}
            >
              Delete user
            </button>
          </div>
        ))
      )}

      <hr />

      <h2>Recipes</h2>

      {recipes.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        recipes.map((recipe) => (
          <div className="feature-card image-right-card" key={recipe.id}>
            <div className="image-right-text">
              <h3>{recipe.name}</h3>

              {recipe.cocktail_name && (
                <p>Cocktail: {recipe.cocktail_name}</p>
              )}

              {recipe.created_by ? (
                <p>Created by: {recipe.created_by}</p>
              ) : (
                <p>Created by: Blackout</p>
              )}

              {recipe.user_email && (
                <p>User email: {recipe.user_email}</p>
              )}

              {recipe.description && <p>{recipe.description}</p>}

              <Link to={`/recipes/${recipe.id}`}>View recipe</Link>

              {' | '}

              <button
                className='delete-button'
                type="button"
                onClick={() => handleDeleteRecipe(recipe.id)}
              >
                Delete recipe
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

export default AdminPanel;