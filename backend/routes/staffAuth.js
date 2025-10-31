import express from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'
import sanitize from 'mongo-sanitize'
import Staff from '../models/Staff.js'

const router = express.Router()

// Whitelist regex
const usernameRe = /^[a-zA-Z0-9_.-]{3,32}$/
const passwordRe = /^[A-Za-z0-9!@#$%^&*]{6,72}$/

router.post('/login',
  body('username').trim().matches(usernameRe),
  body('password').trim().matches(passwordRe),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const username = sanitize(req.body.username)
    const password = req.body.password

    const staff = await Staff.findOne({ username }).lean(false)
    if (!staff) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const ok = await argonVerify(staff.password, password)
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const token = jwt.sign({ sid: staff._id.toString(), role: 'staff', name: staff.name }, process.env.JWT_SECRET, { expiresIn: '2h' })
    res.cookie('staff_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    })
    return res.json({ ok: true })
  }
)

router.post('/logout', (_req, res) => {
  res.clearCookie('staff_session', { path: '/' })
  res.json({ ok: true })
})

export default router
