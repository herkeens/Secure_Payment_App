import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Transfer from './pages/Transfer.jsx'
import StaffLogin from './pages/StaffLogin.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import StaffProvider from './staff/StaffProvider.jsx'
import RequireStaff from './staff/RequireStaff.jsx'
import { RequireAuth } from './auth'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <NavLink to="/register">Register</NavLink>
        <NavLink to="/login">Login</NavLink>
        {/* <NavLink to="/transfer">New Transfer</NavLink> */}
        <NavLink to="/staff/login">Staff</NavLink>
      </nav>

      <div className="wrap">
      <StaffProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/transfer"
            element={<RequireAuth><Transfer /></RequireAuth>}
          />
          <Route path="*" element={<Navigate to="/register" replace />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/dashboard" element={<RequireStaff><StaffDashboard /></RequireStaff>} />
        </Routes>
        </StaffProvider>
      </div>
    </BrowserRouter>
  )
}
