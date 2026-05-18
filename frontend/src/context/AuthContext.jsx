import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FRONTEND_ONLY_MODE } from "../services/frontendMode";
import {
  changeCurrentPassword,
  completeOAuthLogin,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  startOAuth,
  updateCurrentUser,
} from "../services/auth";
import { clearTokens, hasStoredSession } from "../services/tokenStorage";

const AuthContext = createContext(null);
const MOCK_USER_KEY = "ledger-mock-user";

function buildMockUser({ name, email }) {
  const trimmedEmail = email.trim();
  const fallbackName = trimmedEmail.split("@")[0]?.replace(/[._-]+/g, " ") || "Ledger User";
  const normalizedName = name?.trim() || fallbackName.replace(/\b\w/g, (match) => match.toUpperCase());

  return {
    id: "mock-user",
    name: normalizedName,
    email: trimmedEmail,
  };
}

function readMockUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(MOCK_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(MOCK_USER_KEY);
    return null;
  }
}

function writeMockUser(user) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

function clearMockUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MOCK_USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      if (FRONTEND_ONLY_MODE) {
        const mockUser = readMockUser() || buildMockUser({ name: "Demo User", email: "demo@ledger.local" });
        writeMockUser(mockUser);
        if (mounted) {
          setUser(mockUser);
          setIsInitializing(false);
        }
        return;
      }

      if (!hasStoredSession()) {
        if (mounted) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        clearTokens();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      async login({ email, password, remember }) {
        if (FRONTEND_ONLY_MODE) {
          const mockUser = buildMockUser({ email, name: "" });
          writeMockUser(mockUser);
          setUser(mockUser);
          return mockUser;
        }

        await loginUser({ email, password, remember });
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        return currentUser;
      },
      async register({ name, email, password, remember }) {
        if (FRONTEND_ONLY_MODE) {
          const mockUser = buildMockUser({ name, email });
          writeMockUser(mockUser);
          setUser(mockUser);
          return mockUser;
        }

        await registerUser({ name, email, password });
        await loginUser({ email, password, remember });
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        return currentUser;
      },
      async beginOAuth(provider) {
        if (FRONTEND_ONLY_MODE) {
          const mockUser = buildMockUser({
            name: provider === "apple" ? "Apple Demo User" : "Google Demo User",
            email: `${provider}.demo@ledger.local`,
          });
          writeMockUser(mockUser);
          setUser(mockUser);
          return { authorization_url: "/auth/callback?token=frontend-only" };
        }

        return startOAuth(provider);
      },
      async completeOAuth({ token, remember = true }) {
        if (FRONTEND_ONLY_MODE) {
          const mockUser = buildMockUser({ name: "Demo User", email: "demo@ledger.local" });
          writeMockUser(mockUser);
          setUser(mockUser);
          return mockUser;
        }

        const response = await completeOAuthLogin({ token, remember });
        setUser(response.user);
        return response.user;
      },
      async logout() {
        if (FRONTEND_ONLY_MODE) {
          clearMockUser();
          setUser(null);
          return;
        }

        await logoutUser();
        setUser(null);
      },
      async refreshProfile() {
        if (FRONTEND_ONLY_MODE) {
          const mockUser = readMockUser();
          setUser(mockUser);
          return mockUser;
        }

        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        return currentUser;
      },
      async updateProfile(payload) {
        if (FRONTEND_ONLY_MODE) {
          const currentUser = readMockUser() || user || buildMockUser({ name: "", email: "demo@ledger.local" });
          const updatedUser = {
            ...currentUser,
            name: payload.name?.trim() || currentUser.name,
            email: payload.email?.trim() || currentUser.email,
          };
          writeMockUser(updatedUser);
          setUser(updatedUser);
          return updatedUser;
        }

        const updatedUser = await updateCurrentUser(payload);
        setUser(updatedUser);
        return updatedUser;
      },
      async changePassword(payload) {
        if (FRONTEND_ONLY_MODE) {
          if (!payload.new_password?.trim()) {
            throw new Error("Please enter a new password.");
          }
          return { success: true };
        }

        return changeCurrentPassword(payload);
      },
    }),
    [isInitializing, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
