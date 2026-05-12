import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GateShell({ message }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--app-bg)",
        color: "var(--app-fg)",
        fontFamily: "Figtree, system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ fontSize: "14px", opacity: 0.82 }}>{message}</div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <GateShell message="Loading your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <GateShell message="Loading your workspace..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
