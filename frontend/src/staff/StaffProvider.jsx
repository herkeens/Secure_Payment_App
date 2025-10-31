import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { StaffCtx } from './context'

export default function StaffProvider({ children }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    setLoading(true)
    try {
      // Call any staff-only endpoint to check cookie validity
      await api.get('/staff/transactions/pending')
      setAuthed(true)
    } catch {
      setAuthed(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { check() }, [check])

  return (
    <StaffCtx.Provider value={{ authed, loading, refresh: check }}>
      {children}
    </StaffCtx.Provider>
  )
}
