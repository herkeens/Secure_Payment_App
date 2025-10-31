import { createContext, useContext } from 'react'

export const AuthCtx = createContext({
  authed: false,
  loading: true,
  user: null,
  refresh: async () => {}
})

export function useAuth() {
  return useContext(AuthCtx)
}