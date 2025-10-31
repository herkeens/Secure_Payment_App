import express from 'express'
import { param, body, validationResult } from 'express-validator'
import sanitize from 'mongo-sanitize'
import Transfer from '../models/Transfer.js'
import { requireStaff } from '../middleware/requireStaff.js'

const router = express.Router()

// SWIFT: 8 or 11 chars
const swiftRe = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/
const idRe = /^[a-f0-9]{24}$/

// List pending (not yet submitted to SWIFT)
router.get('/transactions/pending', requireStaff, async (_req, res) => {
  const items = await Transfer.find({ status: 'submitted', swiftSubmitted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
  res.json({ ok: true, items })
})

// Verify a transaction (sets approved + staff flags)
router.post('/transactions/:id/verify',
  requireStaff,
  param('id').matches(idRe),
  body('swift').trim().matches(swiftRe),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const id = sanitize(req.params.id)
    const swift = sanitize(req.body.swift.toUpperCase())

    const doc = await Transfer.findById(id)
    if (!doc) return res.status(404).json({ ok: false, error: 'Not found' })

    doc.beneficiarySwift = swift
    doc.status = 'approved'
    doc.staffVerified = true
    doc.verifiedAt = new Date()
    doc.verifiedBy = req.staffId
    await doc.save()

    res.json({ ok: true })
  }
)

// Submit verified transaction to SWIFT (marks as forwarded; no external call here)
router.post('/transactions/:id/submit-swift',
  requireStaff,
  param('id').matches(idRe),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const id = sanitize(req.params.id)
    const doc = await Transfer.findById(id)
    if (!doc) return res.status(404).json({ ok: false, error: 'Not found' })
    if (!doc.staffVerified) return res.status(400).json({ ok: false, error: 'Verify first' })

    doc.swiftSubmitted = true
    doc.swiftSubmittedAt = new Date()
    await doc.save()

    res.json({ ok: true })
  }
)

export default router
