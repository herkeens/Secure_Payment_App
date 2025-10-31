import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/context'

const amountRe   = /^(?:\d+(?:\.\d{1,2})?)$/
const currencyRe = /^(ZAR|USD|EUR|GBP)$/
const swiftRe    = /^[A-Za-z0-9]{8,11}$/
const accountRe  = /^[A-Za-z0-9\-]{6,34}$/
const routingRe  = /^[A-Za-z0-9\-]{3,12}$/
const phoneRe    = /^[0-9+\-\s().]{6,40}$/

export default function Transfer() {
  const [form, setForm] = useState({
    beneficiaryId: '',
    beneficiaryName: '',
    beneficiaryAddress: '',
    beneficiaryAccount: '',
    beneficiarySwift: '',
    bankName: '',
    bankAddress: '',
    routingCode: '',
    recipientContact: '',
    amount: '',
    currency: 'ZAR',
    reference: ''
  })
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [last, setLast] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const { user, refresh } = useAuth()
  const navigate = useNavigate()

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMsg(''); setOk(false)

    if (!form.beneficiaryId || form.beneficiaryId.length < 6) return setMsg('Beneficiary ID must be at least 6 characters.')
    if (!form.beneficiaryName || form.beneficiaryName.length < 2) return setMsg('Provide beneficiary name.')
    if (!form.beneficiaryAddress || form.beneficiaryAddress.length < 5) return setMsg('Provide beneficiary address.')
    if (!accountRe.test(form.beneficiaryAccount)) return setMsg('Invalid beneficiary account.')
    if (form.beneficiarySwift && !swiftRe.test(form.beneficiarySwift)) return setMsg('Invalid SWIFT/BIC code.')
    if (!form.bankName || form.bankName.length < 2) return setMsg('Provide bank name.')
    if (form.routingCode && !routingRe.test(form.routingCode)) return setMsg('Invalid routing code.')
    if (form.recipientContact && !phoneRe.test(form.recipientContact)) return setMsg('Invalid recipient contact.')
    if (!amountRe.test(form.amount)) return setMsg('Enter a valid amount (max 2 decimals).')
    if (!currencyRe.test(form.currency)) return setMsg('Choose a valid currency.')

    try {
      setLoading(true)
      const { data } = await api.post('/payments/transfer', {
        beneficiaryId: form.beneficiaryId,
        beneficiaryName: form.beneficiaryName,
        beneficiaryAddress: form.beneficiaryAddress,
        beneficiaryAccount: form.beneficiaryAccount,
        beneficiarySwift: form.beneficiarySwift || undefined,
        bankName: form.bankName,
        bankAddress: form.bankAddress || undefined,
        routingCode: form.routingCode || undefined,
        recipientContact: form.recipientContact || undefined,
        amount: form.amount,
        currency: form.currency,
        reference: form.reference || undefined
      })
      setOk(true)
      setLast(data)
      setMsg('Transfer submitted.')
      setTimeout(() => setMsg(''), 1500)
      setForm({
        beneficiaryId: '',
        beneficiaryName: '',
        beneficiaryAddress: '',
        beneficiaryAccount: '',
        beneficiarySwift: '',
        bankName: '',
        bankAddress: '',
        routingCode: '',
        recipientContact: '',
        amount: '',
        currency: 'ZAR',
        reference: ''
      })
    } catch (err) {
      const resp = err?.response?.data
      if (Array.isArray(resp?.errors) && resp.errors.length) {
        setMsg(resp.errors.map(e => `${e.param || e.path || e.field || 'field'}: ${e.msg || 'invalid'}`).join(' • '))
      } else {
        setMsg(resp?.message || 'Transfer failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try { setLoggingOut(true); await api.post('/auth/logout') } catch {}
    finally { await refresh(); navigate('/login', { replace: true }); setLoggingOut(false) }
  }

  return (
    <div className="card" role="region" aria-label="New transfer form">
      <div className="toolbar">
        <div>
          <h1 className="h1">New transfer</h1>
          <p className="sub">Send money to a saved beneficiary.</p>
          {user?.email && <p className="sub">Signed in as <strong>{user.email}</strong></p>}
        </div>

        <button
          type="button"
          className="btn ghost sm icon"
          onClick={logout}
          disabled={loggingOut}
          aria-label="Log out"
          title="Log out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
      <div className="rule" />

      <form className="form" onSubmit={submit} noValidate>
        <div className="field">
          <label className="label" htmlFor="beneficiaryId">Beneficiary ID</label>
          <input id="beneficiaryId" name="beneficiaryId" className="input"
                 placeholder="e.g. ben_1234abcd" value={form.beneficiaryId} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="beneficiaryName">Beneficiary name</label>
          <input id="beneficiaryName" name="beneficiaryName" className="input"
                 placeholder="Full name" value={form.beneficiaryName} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="beneficiaryAddress">Beneficiary address</label>
          <input id="beneficiaryAddress" name="beneficiaryAddress" className="input"
                 placeholder="Street, City, Country" value={form.beneficiaryAddress} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="beneficiaryAccount">Beneficiary account</label>
          <input id="beneficiaryAccount" name="beneficiaryAccount" className="input"
                 placeholder="Account number or IBAN" value={form.beneficiaryAccount} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="beneficiarySwift">SWIFT / BIC (optional)</label>
          <input id="beneficiarySwift" name="beneficiarySwift" className="input"
                 placeholder="8 or 11 char SWIFT/BIC" value={form.beneficiarySwift} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="bankName">Bank name</label>
          <input id="bankName" name="bankName" className="input"
                 placeholder="Bank name" value={form.bankName} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="bankAddress">Bank address (optional)</label>
          <input id="bankAddress" name="bankAddress" className="input"
                 placeholder="Bank branch address" value={form.bankAddress} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="routingCode">Routing code (optional)</label>
          <input id="routingCode" name="routingCode" className="input"
                 placeholder="Routing / Sort / ABA code" value={form.routingCode} onChange={onChange} />
        </div>

        <div className="field">
          <label className="label" htmlFor="recipientContact">Recipient contact (optional)</label>
          <input id="recipientContact" name="recipientContact" className="input"
                 placeholder="+27 82 555 0123" value={form.recipientContact} onChange={onChange} />
        </div>

        <div className="row">
          <div className="field" style={{ flex: 2 }}>
            <label className="label" htmlFor="amount">Amount</label>
            <input id="amount" name="amount" className="input" inputMode="decimal"
                   placeholder="1000.00" value={form.amount} onChange={onChange} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label" htmlFor="currency">Currency</label>
            <select id="currency" name="currency" className="input" value={form.currency} onChange={onChange}>
              <option>ZAR</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="reference">Reference (optional)</label>
          <input id="reference" name="reference" className="input"
                 placeholder="Invoice 8473" value={form.reference} onChange={onChange} />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit transfer'}
        </button>

        {msg && <p className={ok ? 'ok' : 'err'}>{msg}</p>}
      </form>

      {last && (
        <table className="table" aria-label="Last transfer">
          <tbody>
            <tr><th>Status</th><td><span className="badge">{last.status}</span></td></tr>
            <tr><th>Transfer ID</th><td>{last.transferId}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
