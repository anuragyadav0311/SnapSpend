import axios from "axios";
import { clearTokens, getAccessToken, getRefreshToken, updateAccessToken } from "./tokenStorage";

function normalizeApiBaseUrl(rawUrl) {
  const trimmedUrl = rawUrl?.trim();

  if (!trimmedUrl) {
    return "";
  }

  const normalizedUrl = trimmedUrl.replace(/\/+$/, "");
  return normalizedUrl.endsWith("/api") ? normalizedUrl : `${normalizedUrl}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
});

let refreshRequest = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_BASE_URL}/auth/refresh/`, { refresh })
      .then((response) => {
        updateAccessToken(response.data.access);
        return response.data.access;
      })
      .catch((error) => {
        clearTokens();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const nextAccessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error, fallbackMessage) {
  if (error?.message === "Network Error" || !error?.response) {
    return "Cannot reach the server. Make sure the backend is running and the API URL is correct.";
  }

  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data === "object" && data) {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue[0]) {
      return firstValue[0];
    }
    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return fallbackMessage;
}
