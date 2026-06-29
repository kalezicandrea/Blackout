import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createRecipe,
  getAlcoholTypes,
  getCocktails,
  getDifficulties,
  getSavedUser,
  getRecipeDetails
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

function ingredientsToText(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) {
    return '';
  }

  return ingredients
    .map((ingredient) => {
      return [
        ingredient.name,
        ingredient.quantity,
        ingredient.unit
      ]
        .filter(Boolean)
        .join(', ');
    })
    .join('\n');
}

function stepsToText(steps) {
  if (!steps || !Array.isArray(steps)) {
    return '';
  }

  return steps
    .map((step) => step.text || step.description || '')
    .filter((text) => text !== '')
    .join('\n');
}

const emptyFormData = {
  cocktail_id: '',
  name: '',
  description: '',
  difficulty_id: '',
  alcohol_type_id: '',
  ingredientsText: '',
  stepsText: ''
};

function AddRecipe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const twistFrom = searchParams.get('twistFrom');
  const user = getSavedUser();

  const [cocktails, setCocktails] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [alcoholTypes, setAlcoholTypes] = useState([]);

  const [formData, setFormData] = useState(emptyFormData);

  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const cocktailsData = await getCocktails();
        const difficultiesData = await getDifficulties();
        const alcoholTypesData = await getAlcoholTypes();

        setCocktails(cocktailsData);
        setDifficulties(difficultiesData);
        setAlcoholTypes(alcoholTypesData);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadTwistRecipe() {
      if (!twistFrom) {
        setFormData(emptyFormData);
        setImage(null);
        setError('');
        return;
      }

      try {
        const data = await getRecipeDetails(twistFrom);

        const recipe = data.recipe ? data.recipe : data;
        const ingredients = data.ingredients || recipe.ingredients || [];
        const steps = data.steps || recipe.steps || [];

        setFormData({
          cocktail_id: recipe.cocktail_id ? String(recipe.cocktail_id) : '',
          name: '',
          description: recipe.description || '',
          difficulty_id: '',
          alcohol_type_id: '',
          ingredientsText: ingredientsToText(ingredients),
          stepsText: stepsToText(steps)
        });

        setImage(null);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Could not load recipe for twist.');
      }
    }

    loadTwistRecipe();
  }, [twistFrom]);

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

      if (!formData.cocktail_id && (!formData.difficulty_id || !formData.alcohol_type_id)) {
        setError('Difficulty and alcohol type are required for a new cocktail.');
        return;
      }

      const ingredients = parseIngredients(formData.ingredientsText);
      const steps = parseSteps(formData.stepsText);

      const dataToSend = new FormData();

      dataToSend.append('name', formData.name);
      dataToSend.append('description', formData.description);
      dataToSend.append('ingredients', JSON.stringify(ingredients));
      dataToSend.append('steps', JSON.stringify(steps));

      if (formData.cocktail_id) {
        dataToSend.append('cocktail_id', formData.cocktail_id);
      } else {
        dataToSend.append('difficulty_id', formData.difficulty_id);
        dataToSend.append('alcohol_type_id', formData.alcohol_type_id);
      }

      if (image) {
        dataToSend.append('image', image);
      }

      await createRecipe(dataToSend);

      navigate('/my-recipes');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p>You must be logged in to add a recipe.</p>;
  }

  return (
    <div>
      <h1>{twistFrom ? 'Add your twist' : 'Add recipe'}</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Recipe type</label>
          <br />
          <select
            name="cocktail_id"
            value={formData.cocktail_id}
            onChange={handleChange}
          >
            <option value="">Create a New Cocktail</option>

            {cocktails.map((cocktail) => (
              <option key={cocktail.id} value={cocktail.id}>
                Add recipe version for: {cocktail.name}
              </option>
            ))}
          </select>
        </div>

        {!formData.cocktail_id && (
          <>
            <div>
              <label>Difficulty for new cocktail</label>
              <br />
              <select
                name="difficulty_id"
                value={formData.difficulty_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose Difficulty</option>

                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {formatOptionLabel(difficulty.name)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Alcohol type for new cocktail</label>
              <br />
              <select
                name="alcohol_type_id"
                value={formData.alcohol_type_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose Alcohol Type</option>

                {alcoholTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {formatOptionLabel(type.name)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label>{formData.cocktail_id ? 'Recipe name' : 'New cocktail name'}</label>
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
            placeholder={'lime juice, 30, ml\nmint leaves, 6, pieces\nsugar, 2, tsp'}
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
            placeholder={'Add lime juice and sugar.\nAdd mint leaves.\nShake and serve.'}
          />
        </div>

        <div>
          <label>Image</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <br />

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default AddRecipe;