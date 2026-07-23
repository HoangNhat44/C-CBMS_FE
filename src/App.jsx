import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";
import BookingPage from "./pages/booking/BookingPage";
import WalkinBookingPage from "./pages/booking/WalkinBookingPage";
import BookingHistoryPage from "./pages/booking/BookingHistoryPage";
import BookingDetailPage from "./pages/booking/BookingDetailPage";
import LoginPage from "./pages/authentication/LoginPage";
import RegisterPage from "./pages/authentication/RegisterPage";
import ForgotPasswordPage from "./pages/authentication/ForgotPasswordPage";
import ResetPasswordPage from "./pages/authentication/ResetPasswordPage";
import UserList from "./pages/account/UserList";
import OwnerDashboard from "./pages/dashboard/Owner";
import StaffDashboard from "./pages/dashboard/Staff";
import AdminDashboard from "./pages/dashboard/Admin";
import LandingPage from "./pages/dashboard/Landingpage";
import ApplyPromotion from "./pages/promotion/ApplyPromotion";
import RoomPage from "./pages/room/RoomPage";
import NewsPage from "./pages/news/NewsPage";
import RoomTypePage from "./pages/roomType/RoomTypePage";
import ProductsPage from "./pages/product/ProductsPage";
import CategoriesPage from "./pages/category/CategoriesPage";
import FeedbacksPage from "./pages/feedback/FeedbacksPage";
import BranchesPage from "./pages/branch/BranchesPage";
import SlotsPage from "./pages/slot/SlotsPage";
import RoomPricePage from "./pages/roomPrice/RoomPricePage";
import MyProfilePage from "./pages/profile/MyProfilePage";
import PublicNewsPage from "./pages/news/PublicNewsPage";

import ProtectedRoute from "./components/ProtectedRoute";
import RolePermission from "./pages/account/RolePermission";
import AccessDeniedPage from "./pages/error/AccessDeniedPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Semi-public routes */}
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/walkin" element={<WalkinBookingPage />} />
          <Route path="*" element={<Navigate to="/booking" replace />} />
          <Route path="/" element={<Navigate to="/landing-dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/landing-dashboard" element={<LandingPage />} />
          <Route path="/apply-promotion" element={<ApplyPromotion />} />
          <Route path="/public-news" element={<PublicNewsPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes - all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/bookinghistory" element={<BookingHistoryPage />} />
            <Route path="/booking/:id" element={<BookingDetailPage />} />
          </Route>

          {/* Owner dashboard - chỉ owner mới được vào */}
          <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          </Route>

          {/* Staff dashboard - chỉ staff mới được vào */}
          <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} requiredPermissions={["VIEW_ROLE", "VIEW_ACCOUNT"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/role-permission" element={<RolePermission />} />
          </Route>

          {/* Management routes (Requires specific permissions) */}
          <Route element={<ProtectedRoute requiredPermissions={["CREATE_ROOM", "UPDATE_ROOM", "UPDATE_ROOM_STATUS", "CREATE_FACILITY"]} />}>
            <Route path="/room" element={<RoomPage />} />
            <Route path="/roomtype" element={<RoomTypePage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/slots" element={<SlotsPage />} />
            <Route path="/room-prices" element={<RoomPricePage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermissions={["CREATE_NEWS", "UPDATE_NEWS", "DELETE_NEWS"]} />}>
            <Route path="/news" element={<NewsPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermissions={["VIEW_PRODUCT", "CREATE_PRODUCT"]} />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermissions={["VIEW_REVENUE", "UPDATE_ROOM_STATUS", "VIEW_PRODUCT"]} />}>
            <Route path="/feedbacks" element={<FeedbacksPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

