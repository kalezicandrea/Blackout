import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecipeDetails } from '../services/api';

function RecipeDetails() {
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecipeDetails() {
      try {
        const data = await getRecipeDetails(id);

        setRecipe(data.recipe);
        setIngredients(data.ingredients);
        setSteps(data.steps);
      } catch (err) {
        console.error(err);
        setError('Could not load recipe details');
      } finally {
        setLoading(false);
      }
    }

    loadRecipeDetails();
  }, [id]);

  if (loading) {
    return <p>Loading recipe details...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!recipe) {
    return <p>Recipe not found.</p>;
  }

  return (
    <div>
      <Link to={recipe.cocktail_id ? `/cocktails/${recipe.cocktail_id}` : '/cocktails'}>
        Back
      </Link>

      <h1>{recipe.name}</h1>

      {recipe.image_url && (
        <img
          src={`http://localhost:5000${recipe.image_url}`}
          alt={recipe.name}
          width="250"
        />
      )}

      {recipe.cocktail_name && (
        <p>Cocktail: {recipe.cocktail_name}</p>
      )}

      <p>
        Created by:{' '}
        {recipe.created_by ? recipe.created_by : 'Original recipe'}
      </p>

      {recipe.description && (
        <p>{recipe.description}</p>
      )}

      <hr />

      <h2>Ingredients</h2>

      {ingredients.length === 0 ? (
        <p>No ingredients added.</p>
      ) : (
        <ul>
          {ingredients.map((ingredient) => (
            <li key={ingredient.id}>
              {ingredient.quantity && ingredient.quantity}{' '}
              {ingredient.unit && ingredient.unit}{' '}
              {ingredient.name}
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Steps</h2>

      {steps.length === 0 ? (
        <p>No steps added.</p>
      ) : (
        <ol>
          {steps.map((step) => (
            <li key={step.id}>
              {step.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default RecipeDetails;