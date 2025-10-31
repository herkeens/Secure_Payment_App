import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context'

export default function RequireAuth({ children }) {
  const { authed, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="card"><p>Checking session…</p></div>
  if (!authed) {
    // send them to login and remember where they tried to go
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
