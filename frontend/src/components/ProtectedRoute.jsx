import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === "customer" ? "/home" : user.role === "provider" ? "/provider/bookings" : "/admin";
    return <Navigate to={fallback} replace />;
  }
  return children;
}