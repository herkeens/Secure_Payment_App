import jwt from 'jsonwebtoken'

export function requireStaff(req, res, next) {
  const token = req.cookies?.staff_session
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload?.sid || payload.role !== 'staff') {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    req.staffId = payload.sid
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}