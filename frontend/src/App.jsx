import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Cocktails from './pages/Cocktails';
import CocktailDetails from './pages/CocktailDetails';
import RecipeDetails from './pages/RecipeDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Favorites from './pages/Favorites';
import MyRecipes from './pages/MyRecipes';
import AddRecipe from './pages/AddRecipe';
import EditRecipe from './pages/EditRecipe';
import AdminPanel from './pages/AdminPanel';
import OriginalRecipes from './pages/OriginalRecipes';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/cocktails" element={<Cocktails />} />
            <Route path="/cocktails/:id" element={<CocktailDetails />} />
            <Route path="/recipes/:id" element={<RecipeDetails />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/add-recipe" element={<AddRecipe />} />
            <Route path="/edit-recipe/:id" element={<EditRecipe />} />

            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/original-recipes" element={<OriginalRecipes />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Blackout · Cocktail recipe app</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;