import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecipeDetails, getSavedUser, getRecipeComments, saveRecipeComment, deleteRecipeComment } from '../services/api';

function RecipeDetails() {
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);

  const user = getSavedUser();

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentMessage, setCommentMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecipeDetails() {
      try {
        const data = await getRecipeDetails(id);

        const commentsData = await getRecipeComments(id);
        setComments(commentsData);

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

  async function handleCommentSubmit(event) {
    event.preventDefault();

    try {
      setCommentMessage('');

      await saveRecipeComment(id, {
        text: commentText
      });

      const updatedComments = await getRecipeComments(id);
      setComments(updatedComments);

      setCommentText('');
      setCommentMessage('Comment saved successfully.');
    } catch (err) {
      setCommentMessage(err.message);
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');

    if (!confirmed) {
      return;
    }

    try {
      setCommentMessage('');

      await deleteRecipeComment(commentId);

      const updatedComments = await getRecipeComments(id);
      setComments(updatedComments);

      setCommentMessage('Comment deleted successfully.');
    } catch (err) {
      setCommentMessage(err.message);
    }
  }

  return (
    <div>
      <Link to={recipe.cocktail_id ? `/cocktails/${recipe.cocktail_id}` : '/cocktails'}>
        Back
      </Link>

      <div className="feature-card image-right-card recipe-detail-main">
        <div className="image-right-text">
          <h1>{recipe.name}</h1>

          {recipe.cocktail_name && (
            <p>Cocktail: {recipe.cocktail_name}</p>
          )}

          {recipe.created_by && (
            <p>Created by: {recipe.created_by}</p>
          )}

          {recipe.description && (
            <p>{recipe.description}</p>
          )}
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

      <hr />

      <Link
        className="primary-link"
        to={`/add-recipe?twistFrom=${recipe.id}`}
      >
        Add your twist
      </Link>

      <hr />

      <h2>Recipe comments</h2>

      {user ? (
        <form onSubmit={handleCommentSubmit}>
          <h3>Leave a comment</h3>

          <div>
            <label>Comment</label>
            <br />
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Share what you think about this recipe version..."
              required
            />
          </div>

          <br />

          <button type="submit">Save comment</button>

          {commentMessage && <p>{commentMessage}</p>}
        </form>
      ) : (
        <p>You must be logged in to comment on this recipe.</p>
      )}

      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div className="review-card" key={comment.id}>
            <div className="review-card-header">
              <strong>{comment.username}</strong>
            </div>

            <p className="review-text">
              {comment.text}
            </p>

            {user && (
              user.role === 'admin' || Number(user.id) === Number(comment.user_id)
            ) && (
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDeleteComment(comment.id)}
              >
                Delete comment
              </button>
            )}
          </div>
        ))
      )}

    </div>
  );
}

export default RecipeDetails;