import { Router } from 'express'
import { randomBytes } from 'crypto'

const router = Router()
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || '__Host-csrf'

// Validate header vs cookie on protected routes
export function requireCsrf(req, res, next) {
  const header = req.get('x-csrf-token')
  const cookie = req.cookies?.[CSRF_COOKIE_NAME]
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ message: 'Invalid CSRF token' })
  }
  next()
}

// Issue CSRF token cookie for the frontend to read
router.get('/csrf-token', (req, res, next) => {
  try {
    const token = randomBytes(32).toString('hex')
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,   // frontend reads it to set x-csrf-token
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000 // 1 hour
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[csrf] error generating token:', err)
    return next(err)
  }
})

export default router