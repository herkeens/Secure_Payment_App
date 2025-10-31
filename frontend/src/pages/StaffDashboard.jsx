import { useEffect, useState } from 'react'
import { staffApi } from '../api.staff'
import '../staff/staff.css'   // <— new stylesheet

const swiftRe = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/

export default function StaffDashboard() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState('')
  const [submitting, setSubmitting] = useState('')

  async function logout() {
    try { await staffApi.logout() } catch {}
    // ensure cookie is cleared and guard redirects
    window.location.assign('/staff/login')
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await staffApi.listPending()
      setItems(list)
    } catch {
      setError('Could not load transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function verify(id) {
    const swift = prompt('Enter/confirm SWIFT code (8 or 11 chars, uppercase):')
    if (!swift || !swiftRe.test(swift.trim().toUpperCase())) {
      alert('Invalid SWIFT format. Example: ABSAZAJJ or ABSAZAJJXXX')
      return
    }
    setVerifying(id)
    try {
      await staffApi.verify(id, swift.trim().toUpperCase())
      await load()
    } catch {
      alert('Verification failed.')
    } finally {
      setVerifying('')
    }
  }

  async function submitSwift(id) {
    setSubmitting(id)
    try {
      await staffApi.submitSwift(id)
      await load()
      alert('Submitted to SWIFT.')
    } catch {
      alert('Submit failed.')
    } finally {
      setSubmitting('')
    }
  }

  return (
    <div className="staff-container">
      <div className="staff-toolbar">
        <div className="staff-title">Staff Verification</div>
        <div className="staff-actions">
          <button className="btn ghost" onClick={load}>Refresh</button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div className="banner danger">{error}</div>}

      {loading ? (
        <div className="staff-card"><p>Loading…</p></div>
      ) : (
        <div className="table staff-table staff-card">
          <div className="thead row">
            <div>Created</div>
            <div>Beneficiary</div>
            <div>Account</div>
            <div>Amount</div>
            <div>Currency</div>
            <div>SWIFT</div>
            <div>Actions</div>
          </div>

          {items.map(t => (
            <div key={t._id} className="row">
              <div>{new Date(t.createdAt).toLocaleString()}</div>
              <div>{t.beneficiaryName}</div>
              <div>{t.beneficiaryAccount}</div>
              <div>{t.amount}</div>
              <div>{t.currency}</div>
              <div>{t.beneficiarySwift || <em>Missing</em>}</div>
              <div className="staff-actions">
                <button className="btn" disabled={verifying===t._id} onClick={()=>verify(t._id)}>
                  {verifying===t._id ? 'Verifying…' : 'Verify'}
                </button>
                <button className="btn primary" disabled={submitting===t._id || !t.staffVerified} onClick={()=>submitSwift(t._id)}>
                  {submitting===t._id ? 'Submitting…' : 'Submit to SWIFT'}
                </button>
              </div>
            </div>
          ))}

          {!items.length && <div className="row"><em>No pending transfers.</em></div>}
        </div>
      )}
    </div>
  )
}
