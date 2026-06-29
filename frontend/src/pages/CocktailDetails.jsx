import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCocktailDetails,
  getCocktailReviews,
  addFavorite,
  removeFavorite,
  getFavorites,
  getSavedUser,
  saveReview,
  deleteReview
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

function CocktailDetails() {
  const { id } = useParams();

  const [cocktail, setCocktail] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = getSavedUser();
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rate: '',
    text: ''
  });

  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    async function loadCocktailDetails() {
      try {
        const detailsData = await getCocktailDetails(id);
        const reviewsData = await getCocktailReviews(id);

        setCocktail(detailsData.cocktail);
        setRecipes(detailsData.recipes);
        setReviews(reviewsData);

        const savedUser = getSavedUser();

        if (savedUser) {
        const favoritesData = await getFavorites();

        const alreadyFavorite = favoritesData.some(
            (favorite) => favorite.id === Number(id)
        );

        setIsFavorite(alreadyFavorite);
        }   
      } catch (err) {
        console.error(err);
        setError('Could not load cocktail details');
      } finally {
        setLoading(false);
      }
    }

    loadCocktailDetails();
  }, [id]);

async function handleAddFavorite() {
    try {
        setFavoriteMessage('');

        await addFavorite(id);

        setIsFavorite(true);
        setFavoriteMessage('Added to favorites.');
    } catch (err) {
        setFavoriteMessage(err.message);
    }
}

async function handleRemoveFavorite() {
    try {
        setFavoriteMessage('');

        await removeFavorite(id);

        setIsFavorite(false);
        setFavoriteMessage('Removed from favorites.');
    } catch (err) {
        setFavoriteMessage(err.message);
    }
}

function handleReviewChange(event) {
  setReviewForm({
    ...reviewForm,
    [event.target.name]: event.target.value
  });
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  try {
    setReviewMessage('');

    await saveReview(id, {
      rate: Number(reviewForm.rate),
      text: reviewForm.text
    });

    const updatedReviews = await getCocktailReviews(id);
    const updatedDetails = await getCocktailDetails(id);

    setReviews(updatedReviews);
    setCocktail(updatedDetails.cocktail);

    setReviewMessage('Review saved successfully.');

    setReviewForm({
      rate: '',
      text: ''
    });
  } catch (err) {
    setReviewMessage(err.message);
  }
}

async function handleDeleteReview(reviewId) {
  const confirmed = window.confirm('Are you sure you want to delete this review?');

  if (!confirmed) {
    return;
  }

  try {
    setReviewMessage('');

    await deleteReview(reviewId);

    const updatedReviews = await getCocktailReviews(id);
    const updatedDetails = await getCocktailDetails(id);

    setReviews(updatedReviews);
    setCocktail(updatedDetails.cocktail);

    setReviewMessage('Review deleted successfully.');
  } catch (err) {
    setReviewMessage(err.message);
  }
}

if (loading) {
    return <p>Loading cocktail details...</p>;
}

if (error) {
    return <p>{error}</p>;
}

if (!cocktail) {
    return <p>Cocktail not found.</p>;  
}

return (
    <div>
        <Link to="/cocktails">Back to cocktails</Link>

        <div className="cocktail-detail-highlight image-right-card">
        <div className="image-right-text">
            <h1>{cocktail.name}</h1>

            <p>Difficulty: {formatOptionLabel(cocktail.difficulty)}</p>
            <p>Type: {formatOptionLabel(cocktail.alcohol_type)}</p>
            <p>Average rating: {cocktail.avg_rating}</p>
            <p>Number of reviews: {cocktail.review_count}</p>

            {user && (
            <>
                {isFavorite ? (
                <button type="button" onClick={handleRemoveFavorite}>
                    Remove from favorites
                </button>
                ) : (
                <button type="button" onClick={handleAddFavorite}>
                    Add to favorites
                </button>
                )}
            </>
            )}

            {favoriteMessage && <p>{favoriteMessage}</p>}
        </div>

        {cocktail.image_url && (
            <div className="image-right-img">
            <img
                src={`http://localhost:5000${cocktail.image_url}`}
                alt={cocktail.name}
            />
            </div>
        )}
        </div>

        <hr />

        <h2>Recipes</h2>

        {recipes.length === 0 ? (
        <p>No recipes found for this cocktail.</p>
        ) : (
        recipes.map((recipe) => (
            <div className="feature-card image-right-card" key={recipe.id}>
                <div className="image-right-text">
                <h3>{recipe.name}</h3>

                <p>{recipe.description}</p>

                <p>
                    Created by:{' '}
                    {recipe.created_by ? recipe.created_by : 'Blackout'}
                </p>

                <Link to={`/recipes/${recipe.id}`}>View recipe</Link>
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

        <h2>Reviews</h2>
        {user ? (
            <form onSubmit={handleReviewSubmit}>
            <h3>Add your review</h3>

            <div>
            <label>Rating</label>
            <br />
            <select
                name="rate"
                value={reviewForm.rate}
                onChange={handleReviewChange}
                required
            >
                <option value="">Choose rating</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
            </div>

            <div>
            <label>Comment</label>
            <br />
            <textarea
                name="text"
                value={reviewForm.text}
                onChange={handleReviewChange}
            />
            </div>

            <br />

            <button type="submit">Save review</button>

            {reviewMessage && <p>{reviewMessage}</p>}
            </form>
            ) : (
            <p>You must be logged in to add a review.</p>
        )}

        <hr />

        {reviews.length === 0 ? (
        <p>No reviews yet.</p>
        ) : (
        reviews.map((review) => (
            <div className="review-card" key={review.id}>
                <div className="review-card-header">
                <strong>{review.username}</strong>
                <span>★ {review.rate}/5</span>
                </div>

                {review.text && (
                <p className="review-text">
                    {review.text}
                </p>
                )}

                {user && (
                user.role === 'admin' || Number(user.id) === Number(review.user_id)
                ) && (
                <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDeleteReview(review.id)}
                >
                    Delete review
                </button>
                )}
            </div>
            ))
        )}
    </div>
    );
}

export default CocktailDetails;