import { Navigate, useLocation } from 'react-router-dom'
import { useStaff } from './context'

export default function RequireStaff({ children }) {
  const { authed, loading } = useStaff()
  const location = useLocation()

  if (loading) return <div className="card"><p>Checking staff session…</p></div>
  if (!authed) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />
  }
  return children
}