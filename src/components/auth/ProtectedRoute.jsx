import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div role="status" className="tg-auth-loading">Checking your session...</div>;
  if (!user) {
    const next = location.pathname + location.search + location.hash;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  // OTP verification creates a Supabase session before account setup. Do not
  // treat such accounts as finished, even after refresh or navigation.
  if (user.user_metadata?.takegrid_onboarding_required === true) {
    return <Navigate to="/signup" replace />;
  }
  return children;
}
