import { Link } from 'react-router-dom';

function CocktailCard({ cocktail }) {
  return (
    <div className="cocktail-card">
      {cocktail.image_url && (
        <img
          src={`http://localhost:5000${cocktail.image_url}`}
          alt={cocktail.name}
        />
      )}

      <h3>{cocktail.name}</h3>

      <p className="card-meta">Difficulty: {cocktail.difficulty}</p>
      <p className="card-meta">Type: {cocktail.alcohol_type}</p>
      <p className="card-meta">Rating: {cocktail.avg_rating}</p>
      <p className="card-meta">Reviews: {cocktail.review_count}</p>

      <Link className="card-link" to={`/cocktails/${cocktail.id}`}>
        View details
      </Link>
    </div>
  );
}

export default CocktailCard;