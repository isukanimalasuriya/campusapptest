import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />; // Not logged in
  if (adminOnly && role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}