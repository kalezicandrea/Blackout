import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCocktails,
  getRecipeDetails,
  getSavedUser,
  updateRecipe
} from '../services/api';

function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getSavedUser();

  const [cocktails, setCocktails] = useState([]);

  const [formData, setFormData] = useState({
    cocktail_id: '',
    name: '',
    description: '',
    ingredientsText: '',
    stepsText: ''
  });

  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setError('');

        const recipeData = await getRecipeDetails(id);
        const cocktailsData = await getCocktails();

        const ingredientsText = recipeData.ingredients
          .map((ingredient) => {
            return `${ingredient.name}, ${ingredient.quantity || ''}, ${ingredient.unit || ''}`;
          })
          .join('\n');

        const stepsText = recipeData.steps
          .map((step) => step.text)
          .join('\n');

        setFormData({
          cocktail_id: recipeData.recipe.cocktail_id || '',
          name: recipeData.recipe.name || '',
          description: recipeData.recipe.description || '',
          ingredientsText,
          stepsText
        });

        setCocktails(cocktailsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  }

  function handleImageChange(event) {
    setImage(event.target.files[0]);
  }

  function parseIngredients(text) {
    return text
      .split('\n')
      .map((line) => {
        const parts = line.split(',').map((part) => part.trim());

        return {
          name: parts[0] || '',
          quantity: parts[1] || '',
          unit: parts[2] || ''
        };
      })
      .filter((item) => item.name !== '');
  }

  function parseSteps(text) {
    return text
      .split('\n')
      .map((line) => ({
        text: line.trim()
      }))
      .filter((step) => step.text !== '');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError('');

      const ingredients = parseIngredients(formData.ingredientsText);
      const steps = parseSteps(formData.stepsText);

      const dataToSend = new FormData();

      dataToSend.append('name', formData.name);
      dataToSend.append('description', formData.description);
      dataToSend.append('ingredients', JSON.stringify(ingredients));
      dataToSend.append('steps', JSON.stringify(steps));

      dataToSend.append('cocktail_id', formData.cocktail_id);

      if (image) {
        dataToSend.append('image', image);
      }

      await updateRecipe(id, dataToSend);

      navigate('/my-recipes');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p>You must be logged in to edit a recipe.</p>;
  }

  if (loading) {
    return <p>Loading recipe...</p>;
  }

  return (
    <div>
      <h1>Edit recipe</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Connect to cocktail</label>
          <br />
          <select
            name="cocktail_id"
            value={formData.cocktail_id}
            onChange={handleChange}
          >
            <option value="">My original recipe</option>

            {cocktails.map((cocktail) => (
              <option key={cocktail.id} value={cocktail.id}>
                {cocktail.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Recipe name</label>
          <br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Description</label>
          <br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Ingredients</label>
          <br />
          <small>Write one ingredient per line: name, quantity, unit</small>
          <br />
          <textarea
            name="ingredientsText"
            value={formData.ingredientsText}
            onChange={handleChange}
            rows="6"
          />
        </div>

        <div>
          <label>Steps</label>
          <br />
          <small>Write one step per line</small>
          <br />
          <textarea
            name="stepsText"
            value={formData.stepsText}
            onChange={handleChange}
            rows="6"
          />
        </div>

        <div>
          <label>New image</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <br />

        <button type="submit">Save changes</button>
      </form>
    </div>
  );
}

export default EditRecipe;