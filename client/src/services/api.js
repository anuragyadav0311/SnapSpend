import axios from 'axios'

import { clearStoredToken, getStoredToken } from '../utils/auth.js'

let unauthorizedHandler = null

function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken()
      unauthorizedHandler?.()
    }

    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'Something went wrong.'

    return Promise.reject({
      ...error,
      message,
    })
  },
)

export { api, registerUnauthorizedHandler }
