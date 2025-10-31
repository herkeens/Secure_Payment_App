import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { AuthCtx } from './context'

export default function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data?.ok) {
        setAuthed(true)
        setUser({ id: data.sub, email: data.email })
      } else {
        setAuthed(false)
        setUser(null)
      }
    } catch {
      setAuthed(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <AuthCtx.Provider value={{ authed, loading, user, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}
