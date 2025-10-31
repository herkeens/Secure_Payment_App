import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

export default function Login() {
  const [form, setForm] = useState({
    username: '',
    accountNumber: '',
    password: '',
    showPassword: false
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { refresh } = useAuth() 

  const onChange = e => {
    const { name, type, checked, value } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async e => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        username: form.username.trim(),
        accountNumber: form.accountNumber.trim(),
        password: form.password
      })
      if (!data?.ok) throw new Error(data?.error || 'Login failed')

      // Update auth context
      try { await refresh() } catch {}

      nav('/transfer', { replace: true })
      // Fallback:
      return
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="h1">Sign in</h2>
      <p className="sub">Use your username, account number, and password.</p>

      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label className="label">Username*</label>
          <input className="input" name="username" required value={form.username} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label">Account Number*</label>
          <input className="input" name="accountNumber" required value={form.accountNumber} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label">Password*</label>
          <div className="input-wrap">
            <input
              className="input"
              name="password"
              type={form.showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setForm(f => ({ ...f, showPassword: !f.showPassword }))}
              aria-label={form.showPassword ? 'Hide password' : 'Show password'}
            >
              {form.showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {msg && <p className="err">{msg}</p>}
        <p className="note">No account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  )
}
