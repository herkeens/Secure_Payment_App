import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const nameRe     = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,80}$/
const usernameRe = /^[a-zA-Z0-9_.-]{3,32}$/
const idNumberRe = /^[0-9A-Za-z\-]{6,32}$/
const accountRe  = /^[0-9]{6,20}$/
const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    idNumber: '',
    accountNumber: '',
    password: '',
    confirmPassword: '',
    showPassword: false
  })
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const onChange = e => {
    const { name, type, checked, value } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async e => {
    e.preventDefault()
    setMsg(''); setOk(false)

    if (!nameRe.test(form.name)) return setMsg('Please enter your name (letters, spaces, - or \').')
    if (!usernameRe.test(form.username)) return setMsg('Invalid username.')
    if (!idNumberRe.test(form.idNumber)) return setMsg('Invalid ID number.')
    if (!accountRe.test(form.accountNumber)) return setMsg('Invalid account number.')
    if (!passwordRe.test(form.password)) return setMsg('Password must include upper, lower, and a number.')
    if (form.password !== form.confirmPassword) return setMsg('Passwords do not match.')

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email || undefined,
        username: form.username.trim(),
        idNumber: form.idNumber.trim(),
        accountNumber: form.accountNumber.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      })
      if (!data?.ok) throw new Error(data?.error || 'Registration failed.')

      setOk(true)
      setMsg('Account created. Redirecting to sign in…')
      // Clear sensitive fields before leaving
      setForm(f => ({ ...f, password:'', confirmPassword:'' }))

      // Redirect to login (replace so back button won't return to form)
      nav('/login', { replace: true })
      return
    } catch (err) {
      setOk(false)
      setMsg(err?.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="h1">Create Account</h2>
      <p className="sub">Tell us who you are and set your credentials.</p>

      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label className="label">Full Name*</label>
          <input className="input" name="name" required value={form.name} onChange={onChange} placeholder="e.g. Thabo Nkosi" />
        </div>

        <div className="field">
          <label className="label">Email (optional)</label>
          <input className="input" name="email" type="email" value={form.email} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label">Username*</label>
          <input className="input" name="username" required value={form.username} onChange={onChange} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">ID Number*</label>
            <input className="input" name="idNumber" required value={form.idNumber} onChange={onChange} />
          </div>
          <div className="field">
            <label className="label">Account Number*</label>
            <input className="input" name="accountNumber" required value={form.accountNumber} onChange={onChange} />
          </div>
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
              autoComplete="new-password"
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

        <div className="field">
          <label className="label">Confirm Password*</label>
          <div className="input-wrap">
            <input
              className="input"
              name="confirmPassword"
              type={form.showPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
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
          {loading ? 'Creating…' : 'Register'}
        </button>

        {msg && <p className={ok ? 'ok' : 'err'}>{msg}</p>}
        <p className="note">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
