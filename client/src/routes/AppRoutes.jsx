// client/src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute  from "./ProtectedRoute";
import AdminRoute      from "./AdminRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import Profile from "../pages/Profile";


// Pages
import Login           from "../pages/Login";
import Register        from "../pages/Register";
import Dashboard       from "../pages/Dashboard";
import ChitPlans       from "../pages/ChitPlans";
import Payments        from "../pages/Payments";
import Auctions        from "../pages/Auctions";
import Notifications   from "../pages/Notifications";
import AdminDashboard  from "../pages/AdminDashboard";
import NotFound        from "../pages/NotFound";

// Wrap a page inside DashboardLayout + ProtectedRoute
function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Admin page wrapper
function AdminPage({ children }) {
  return (
    <AdminRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AdminRoute>
  );
}

export default function AppRoutes() {
  return (
    
    <Routes>
      {/* Public routes — no sidebar */}
      
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<PrivatePage><Profile /></PrivatePage>} />


      {/* Protected routes — wrapped in sidebar layout */}
      <Route path="/dashboard"     element={<PrivatePage><Dashboard /></PrivatePage>} />
      <Route path="/chit-plans"    element={<PrivatePage><ChitPlans /></PrivatePage>} />
      <Route path="/payments"      element={<PrivatePage><Payments /></PrivatePage>} />
      <Route path="/auctions"      element={<PrivatePage><Auctions /></PrivatePage>} />
      <Route path="/notifications" element={<PrivatePage><Notifications /></PrivatePage>} />

      {/* Admin only */}
      <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />

      {/* Redirects */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<NotFound />} />
    </Routes>
  );
}