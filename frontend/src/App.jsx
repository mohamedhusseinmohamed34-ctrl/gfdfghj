import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import BookingPage from "./pages/BookingPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import ProviderBookingsPage from "./pages/ProviderBookingsPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AboutPage from "./pages/AboutPage";

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Opening Khidma…</div>;
  if (!user) return <AuthPage initialMode="login" />;
  return <Navigate to={user.role==="customer"?"/home":user.role==="provider"?"/provider/bookings":"/admin"} replace />;
}

function AppRoutes() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />
      <Route path="/home" element={<ProtectedRoute roles={["customer"]}><HomePage /></ProtectedRoute>} />
      <Route path="/services/:id" element={<ProtectedRoute roles={["customer"]}><ServiceDetailsPage /></ProtectedRoute>} />
      <Route path="/book/:serviceId" element={<ProtectedRoute roles={["customer"]}><BookingPage /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute roles={["customer"]}><MyAppointmentsPage /></ProtectedRoute>} />
      <Route path="/booking/:id" element={<ProtectedRoute roles={["customer","provider","admin"]}><BookingConfirmationPage /></ProtectedRoute>} />
      <Route path="/provider/bookings" element={<ProtectedRoute roles={["provider"]}><ProviderBookingsPage /></ProtectedRoute>} />
      <Route path="/provider/profile" element={<ProtectedRoute roles={["provider"]}><ProviderProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/receptionist" element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage receptionist /></ProtectedRoute>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<div className="container empty-state"><h1>Page not found</h1><a className="text-link" href="/">Return to Khidma</a></div>} />
    </Route>
  </Routes>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}