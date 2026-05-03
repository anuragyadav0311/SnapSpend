const AUTH_STORAGE_KEY = 'expense-tracker-auth'

function getStoredToken() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

function setStoredToken(token) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, token)
}

function clearStoredToken() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

function decodeTokenPayload(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = window.atob(normalized)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getUserFromToken(token) {
  const payload = decodeTokenPayload(token)
  if (!payload?.sub) {
    return null
  }

  return {
    email: payload.sub,
  }
}

export {
  AUTH_STORAGE_KEY,
  clearStoredToken,
  getStoredToken,
  getUserFromToken,
  setStoredToken,
}
