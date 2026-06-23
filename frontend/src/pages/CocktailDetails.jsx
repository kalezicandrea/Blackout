import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCocktailDetails,
  getCocktailReviews,
  addFavorite,
  removeFavorite,
  getFavorites,
  getSavedUser,
  saveReview
} from '../services/api';

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
    sweet_rate: '',
    bitter_rate: '',
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
      sweet_rate: reviewForm.sweet_rate ? Number(reviewForm.sweet_rate) : null,
      bitter_rate: reviewForm.bitter_rate ? Number(reviewForm.bitter_rate) : null,
      text: reviewForm.text
    });

    const updatedReviews = await getCocktailReviews(id);
    const updatedDetails = await getCocktailDetails(id);

    setReviews(updatedReviews);
    setCocktail(updatedDetails.cocktail);

    setReviewMessage('Review saved successfully.');

    setReviewForm({
      rate: '',
      sweet_rate: '',
      bitter_rate: '',
      text: ''
    });
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

        <h1>{cocktail.name}</h1>

        {cocktail.image_url && (
        <img
            src={`http://localhost:5000${cocktail.image_url}`}
            alt={cocktail.name}
            width="250"
        />
        )}

        <p>Difficulty: {cocktail.difficulty}</p>
        <p>Type: {cocktail.alcohol_type}</p>
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

        <hr />

        <h2>Recipes</h2>

        {recipes.length === 0 ? (
        <p>No recipes found for this cocktail.</p>
        ) : (
        recipes.map((recipe) => (
            <div key={recipe.id}>
            <h3>{recipe.name}</h3>

            {recipe.image_url && (
                <img
                src={`http://localhost:5000${recipe.image_url}`}
                alt={recipe.name}
                width="200"
                />
            )}

            <p>{recipe.description}</p>

            <p>
                Created by:{' '}
                {recipe.created_by ? recipe.created_by : 'Original recipe'}
            </p>

            <Link to={`/recipes/${recipe.id}`}>View recipe</Link>

            <hr />
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
            <label>Sweetness</label>
            <br />
            <select
                name="sweet_rate"
                value={reviewForm.sweet_rate}
                onChange={handleReviewChange}
            >
                <option value="">Choose sweetness</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
            </div>

            <div>
            <label>Bitterness</label>
            <br />
            <select
                name="bitter_rate"
                value={reviewForm.bitter_rate}
                onChange={handleReviewChange}
            >
                <option value="">Choose bitterness</option>
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
            <div key={review.id}>
            <p>
                <strong>{review.username}</strong>
            </p>

            <p>Rating: {review.rate}/5</p>

            {review.sweet_rate && (
                <p>Sweetness: {review.sweet_rate}/5</p>
            )}

            {review.bitter_rate && (
                <p>Bitterness: {review.bitter_rate}/5</p>
            )}

            {review.text && <p>{review.text}</p>}

            <hr />
            </div>
        ))
        )}
    </div>
    );
}

export default CocktailDetails;