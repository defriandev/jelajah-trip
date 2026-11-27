import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './features/home/HomePage';
import TripCatalogPage from './features/trip/TripCatalogPage';
import TripDetailPage from './features/trip/TripDetailPage';
import BookingPage from './features/booking/BookingPage';
import TrackingPage from './features/booking/TrackingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProfilePage from './features/auth/ProfilePage';
import AdminDashboard from './features/admin/AdminDashboard';
import FAQPage from './features/support/FAQPage';
import ContactPage from './features/support/ContactPage';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="flex flex-col min-h-screen bg-[#FCFCFA] text-[#08261E] selection:bg-[#C5A059] selection:text-[#08261E]">
      {!isAdminRoute && !isAuthRoute && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips" element={<TripCatalogPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/booking/:tripId" element={<BookingPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/track" element={<Navigate to="/tracking" replace />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && !isAuthRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}