import { api } from './api'

export const staffApi = {
  async login({ username, password }) {
    return api.post('/staff/auth/login', { username, password })
  },
  async logout() {
    return api.post('/staff/auth/logout')
  },
  async listPending() {
    const { data } = await api.get('/staff/transactions/pending')
    return data?.items || []
  },
  async verify(id, swift) {
    return api.post(`/staff/transactions/${id}/verify`, { swift })
  },
  async submitSwift(id) {
    return api.post(`/staff/transactions/${id}/submit-swift`)
  }
}