import { useState } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { staffApi } from '../api.staff'
import '../staff/staff.css'

const usernameRe = /^[a-zA-Z0-9_.-]{3,32}$/
const passwordRe = /^[A-Za-z0-9!@#$%^&*]{6,72}$/

export default function StaffLogin() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    showPassword: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/staff/dashboard'

  async function submit(e) {
    e.preventDefault()
    setError('')
    const { username, password } = form
    if (!usernameRe.test(username) || !passwordRe.test(password)) {
      setError('Please enter a valid username/password.')
      return
    }
    setLoading(true)
    try {
      await staffApi.login({ username, password })
      navigate(from, { replace: true })
    } catch {
      setError('Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  return (
    <div className="card staff-login-card">
      <h2 className="h1">Staff Login</h2>
      {error && <div className="banner danger" role="alert">{error}</div>}

      <form onSubmit={submit} className="form" noValidate>
        <div className="field">
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            name="username"
            value={form.username}
            onChange={onChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              className="input"
              name="password"
              type={form.showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setForm(f => ({ ...f, showPassword: !f.showPassword }))}
              aria-label={form.showPassword ? 'Hide password' : 'Show password'}
              title={form.showPassword ? 'Hide password' : 'Show password'}
            >
              {form.showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn" disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="note" style={{ marginTop: 12 }}>
        Employees are pre-registered by HR. No self-registration.
      </p>
      <nav style={{ marginTop: 8 }}>
        <NavLink to="/login">Customer Login</NavLink>
      </nav>
    </div>
  )
}
