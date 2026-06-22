import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import BookingPage from "./pages/booking/BookingPage";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/bookinghistory" element={<BookingHistoryPage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />
        <Route path="*" element={<Navigate to="/booking" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/landing-dashboard" element={<LandingPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;