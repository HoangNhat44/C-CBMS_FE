import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import BookingPage from "./pages/booking/BookingPage";
import BookingHistoryPage from "./pages/booking/BookingHistoryPage";
import BookingDetailPage from "./pages/booking/BookingDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/booking" replace />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/bookinghistory" element={<BookingHistoryPage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />
        <Route path="*" element={<Navigate to="/booking" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
