import axios from 'axios'

const CSRF_COOKIE_NAME = '__Host-csrf'

// read cookie value (works on https://localhost:5173)
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

// Axios instance used across the app
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,                 // send/receive cookies through Vite proxy
})

// Attach x-csrf-token automatically if cookie exists
api.interceptors.request.use((config) => {
  const token = getCookie(CSRF_COOKIE_NAME)
  if (token) config.headers['x-csrf-token'] = token
  return config
})

// Call this once on app startup to mint the CSRF cookie
export async function initCsrf() {
  await api.get('/csrf-token')
}
