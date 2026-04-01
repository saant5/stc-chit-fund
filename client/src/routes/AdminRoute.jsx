import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("stc_token");
  const raw   = localStorage.getItem("stc_user");

  if (!token || !raw) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(raw);
    if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
}