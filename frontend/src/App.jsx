import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import ThemeToggle from "./components/ThemeToggle";
import Budgets from "./pages/Budgets";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import MainLayout from "./pages/MainLayout";
import OAuthCallback from "./pages/OAuthCallback";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Transactions from "./pages/Transactions";
import { ThemeProvider } from "./context/ThemeContext";

function AppRoutes() {
  const { pathname } = useLocation();
  const showAuthThemeToggle =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/auth/callback";

  return (
    <>
      {showAuthThemeToggle && <ThemeToggle />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
