import { Link, useNavigate } from 'react-router-dom';
import { getRandomCocktail, getSavedUser, logoutUser } from '../services/api';

function Navbar() {
  const user = getSavedUser();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    window.location.href = '/';
  }

  async function handleRandomCocktail() {
    try {
      const cocktail = await getRandomCocktail();
      navigate(`/cocktails/${cocktail.id}`);
    } catch (error) {
      alert('Could not load random cocktail');
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <h2 className="brand">
          <Link to="/" onClick={scrollToTop}>
            Black<span>out</span>
          </Link>
        </h2>

        <div className="nav-links">
          <Link to="/" onClick={scrollToTop}>Home</Link>
          <Link to="/cocktails" onClick={scrollToTop}>Cocktails</Link>
          <Link to="/original-recipes" onClick={scrollToTop}>Original cocktails</Link>

          <button
            type="button"
            className="logout-button"
            onClick={handleRandomCocktail}
          >
            Random
          </button>

          {user ? (
            <>
              <Link to="/favorites" onClick={scrollToTop}>Favorites</Link>
              <Link to="/my-recipes" onClick={scrollToTop}>My recipes</Link>
              <Link to="/add-recipe" onClick={scrollToTop}>Add recipe</Link>

              {user.role === 'admin' && (
                <Link to="/admin" onClick={scrollToTop}>Admin panel</Link>
              )}

              <span className="logged-user">
                {user.username}
              </span>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;