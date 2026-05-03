import { Navigate, Outlet } from 'react-router-dom'

import useAuth from '../hooks/useAuth.js'

function PublicRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicRoute
