import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import UsersPage from "./pages/account/UsersPage";
import ProductsPage from "./pages/product/ProductsPage";
import CategoriesPage from "./pages/category/CategoriesPage";
import FeedbacksPage from "./pages/feedback/FeedbacksPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="dashboard-layout">
        {/* Main Workspace Area */}
        <main className="dashboard-main">
          <Routes>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/feedbacks" element={<FeedbacksPage />} />
            <Route path="/users" element={<UsersPage />} />
            {/*<Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} /> */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
