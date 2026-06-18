import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { FaFilm, FaUtensils, FaFolderOpen } from "react-icons/fa";
import UsersPage from "./pages/account/UsersPage";
import ProductsPage from "./pages/product/ProductsPage";
import CategoriesPage from "./pages/category/CategoriesPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="brand-icon">
              <FaFilm />
            </span>
            <span className="brand-name">C-CBMS Portal</span>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="link-icon">
                <FaUtensils />
              </span>
              <span className="link-text">Quản lý Sản phẩm</span>
            </NavLink>

            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="link-icon">
                <FaFolderOpen />
              </span>
              <span className="link-text">Quản lý Danh Mục</span>
            </NavLink>

            {/* 
            <NavLink 
              to="/users" 
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="link-icon"><FaUsers /></span>
              <span className="link-text">Quản lý Người dùng</span>
            </NavLink>
          </nav> */}
          </nav>
        </aside>

        {/* Main Workspace Area */}
        <main className="dashboard-main">
          <Routes>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
