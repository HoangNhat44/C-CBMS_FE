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
import PublicFeedbacksPage from "./pages/feedback/PublicFeedbacksPage";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import RolePermission from "./pages/account/RolePermission";
import AccessDeniedPage from "./pages/error/AccessDeniedPage";
function GlobalAlert() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      const msgLower = typeof message === 'string' ? message.toLowerCase() : String(message).toLowerCase();
      const isError = msgLower.includes("không có quyền") || msgLower.includes("lỗi") || msgLower.includes("thất bại") || msgLower.includes("từ chối");
      const isSuccess = msgLower.includes("thành công");
      const isWarning = msgLower.includes("không thể") || msgLower.includes("vui lòng") || msgLower.includes("không tải được") || msgLower.includes("quá lớn");
      const type = isError ? "error" : isSuccess ? "success" : isWarning ? "warning" : "info";

      const id = Date.now() + Math.random();
      setAlerts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 4000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="global-toast-container">
      {alerts.map((alert) => (
        <div key={alert.id} className={`global-toast-message ${alert.type}`}>
          {alert.type === "error" ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="8" x2="12" y2="12"></line>
               <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>
          ) : alert.type === "warning" ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
               <line x1="12" y1="9" x2="12" y2="13"></line>
               <line x1="12" y1="17" x2="12.01" y2="17"></line>
             </svg>
          ) : alert.type === "success" ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
               <polyline points="22 4 12 14.01 9 11.01"></polyline>
             </svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="16" x2="12" y2="12"></line>
               <line x1="12" y1="8" x2="12.01" y2="8"></line>
             </svg>
          )}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <GlobalAlert />
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
          <Route path="/public-feedbacks" element={<PublicFeedbacksPage />} />
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

