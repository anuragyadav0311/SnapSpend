import { api, getApiErrorMessage } from "./api";
import { clearTokens, getRefreshToken, setTokens } from "./tokenStorage";

export async function registerUser(payload) {
  const response = await api.post("/auth/register/", payload);
  return response.data;
}

export async function startOAuth(provider) {
  try {
    const response = await api.post(`/auth/oauth/${provider}/start/`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Unable to start ${provider} sign-in right now.`));
  }
}

export async function completeOAuthLogin({ token, remember = true }) {
  try {
    const response = await api.post("/auth/oauth/complete/", { token });
    setTokens(response.data, remember);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to complete sign-in right now."));
  }
}

export async function loginUser({ email, password, remember }) {
  try {
    const response = await api.post("/auth/login/", { email, password });
    setTokens(response.data, remember);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to sign in right now."));
  }
}

export async function fetchCurrentUser() {
  try {
    const response = await api.get("/auth/me/");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load your profile."));
  }
}

export async function updateCurrentUser(payload) {
  try {
    const response = await api.put("/auth/me/", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update your profile."));
  }
}

export async function changeCurrentPassword(payload) {
  try {
    const response = await api.put("/auth/change-password/", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update your password."));
  }
}

export async function logoutUser() {
  const refresh = getRefreshToken();

  if (!refresh) {
    clearTokens();
    return;
  }

  try {
    await api.post("/auth/logout/", { refresh });
  } finally {
    clearTokens();
  }
}
