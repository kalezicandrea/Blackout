import { Link } from 'react-router-dom';

function formatOptionLabel(text) {
  if (!text) {
    return '';
  }

  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

function CocktailCard({ cocktail }) {
  return (
    <div className="cocktail-card">
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

      <Link className="card-link" to={`/cocktails/${cocktail.id}`}>
        View details
      </Link>
    </div>
  );
}

export default CocktailCard;