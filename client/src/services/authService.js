import { api } from './api.js'

async function loginUser(payload) {
  const response = await api.post('/auth/login', payload)
  return response.data
}

async function registerUser(payload) {
  const response = await api.post('/auth/register', payload)
  return response.data
}

export { loginUser, registerUser }
