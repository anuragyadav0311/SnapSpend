const ACCESS_TOKEN_KEY = "ledger-access-token";
const REFRESH_TOKEN_KEY = "ledger-refresh-token";

function getStorageEntries() {
  if (typeof window === "undefined") {
    return [];
  }

  return [window.localStorage, window.sessionStorage];
}

function readToken(key) {
  for (const storage of getStorageEntries()) {
    const value = storage.getItem(key);
    if (value) {
      return value;
    }
  }

  return "";
}

function getPreferredStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.localStorage.getItem(REFRESH_TOKEN_KEY)) {
    return window.localStorage;
  }

  if (window.sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
    return window.sessionStorage;
  }

  return window.localStorage;
}

export function getAccessToken() {
  return readToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return readToken(REFRESH_TOKEN_KEY);
}

export function hasStoredSession() {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function setTokens({ access, refresh }, remember = true) {
  clearTokens();

  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  targetStorage.setItem(ACCESS_TOKEN_KEY, access);
  targetStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function updateAccessToken(access) {
  const storage = getPreferredStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, access);
}

export function clearTokens() {
  for (const storage of getStorageEntries()) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  }
}
