import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Read directly from localStorage — no React state dependency
  const token = localStorage.getItem("stc_token");
  const user  = localStorage.getItem("stc_user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}