import { createContext, useEffect, useEffectEvent, useState } from 'react'

import { registerUnauthorizedHandler } from '../services/api.js'
import {
  clearStoredToken,
  getStoredToken,
  getUserFromToken,
  setStoredToken,
} from '../utils/auth.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedToken = getStoredToken()
    if (storedToken) {
      setToken(storedToken)
      setUser(getUserFromToken(storedToken))
    }
    setIsReady(true)
  }, [])

  function login(nextToken) {
    setStoredToken(nextToken)
    setToken(nextToken)
    setUser(getUserFromToken(nextToken))
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  const handleUnauthorized = useEffectEvent(() => {
    logout()
  })

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized)

    return () => {
      registerUnauthorizedHandler(null)
    }
  }, [])

  const value = {
    isAuthenticated: Boolean(token),
    isReady,
    token,
    user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
