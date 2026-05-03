const AUTH_STORAGE_KEY = 'expense-tracker-auth'

function getStoredToken() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export { AUTH_STORAGE_KEY, getStoredToken }
