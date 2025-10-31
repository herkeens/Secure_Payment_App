import express from 'express'
import { body, validationResult } from 'express-validator'
import sanitize from 'mongo-sanitize'
import jwt from 'jsonwebtoken'
import Transfer from '../models/Transfer.js'

const router = express.Router()

// Reads JWT from HttpOnly cookie "session", verifies, and sets req.userId
function requireAuth(req, res, next) {
  const token = req.cookies?.session
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.sub || payload.id 
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

// ---- validators aligned to your schema ----
const amountRe   = /^(?:\d+(?:\.\d{1,2})?)$/
const currencyRe = /^(ZAR|USD|EUR|GBP)$/
const swiftRe    = /^[A-Za-z0-9]{8,11}$/
const accountRe  = /^[A-Za-z0-9\-]{6,34}$/ 
const phoneRe    = /^[0-9+\-\s().]{6,40}$/

// POST /api/payments/transfer
router.post(
  '/transfer',
  requireAuth,
  [
    body('beneficiaryId').trim().notEmpty(),
    body('beneficiaryName').trim().notEmpty(),
    body('beneficiaryAddress').trim().notEmpty(),
    body('beneficiaryAccount').trim().matches(accountRe),
    body('beneficiarySwift').optional({ nullable: true }).matches(swiftRe),
    body('bankName').trim().notEmpty(),
    body('bankAddress').optional({ nullable: true }).trim().isLength({ max: 200 }),
    body('routingCode').optional({ nullable: true }).trim().isLength({ max: 40 }),
    body('recipientContact').optional({ nullable: true }).trim().matches(phoneRe),
    body('amount').matches(amountRe),
    body('currency').matches(currencyRe),
    body('reference').optional({ nullable: true }).trim().isLength({ max: 140 }).matches(/^[A-Za-z0-9 .,'-]*$/),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const payload = {
        userId:             req.userId, 
        beneficiaryId:      sanitize(req.body.beneficiaryId),
        beneficiaryName:    sanitize(req.body.beneficiaryName),
        beneficiaryAddress: sanitize(req.body.beneficiaryAddress),
        beneficiaryAccount: sanitize(req.body.beneficiaryAccount),
        beneficiarySwift:   req.body.beneficiarySwift ? sanitize(req.body.beneficiarySwift) : undefined,
        bankName:           sanitize(req.body.bankName),
        bankAddress:        req.body.bankAddress ? sanitize(req.body.bankAddress) : undefined,
        routingCode:        req.body.routingCode ? sanitize(req.body.routingCode) : undefined,
        recipientContact:   req.body.recipientContact ? sanitize(req.body.recipientContact) : undefined,
        amount:             sanitize(req.body.amount), 
        currency:           sanitize(req.body.currency),
        reference:          req.body.reference ? sanitize(req.body.reference) : undefined,
        status:             'submitted',
      }

      const saved = await Transfer.create(payload)

      return res.status(201).json({
        ok: true,
        status: saved.status,
        transferId: saved._id,
        transfer: saved,
      })
    } catch (e) {
      console.error('transfer persist error:', e)
      const code = e?.name === 'ValidationError' ? 400 : 500
      return res.status(code).json({ ok: false, message: 'Unable to save transfer' })
    }
  }
)

export default router
