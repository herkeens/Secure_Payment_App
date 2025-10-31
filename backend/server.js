import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import hpp from 'hpp'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'

import sanitize from 'mongo-sanitize'
import staffAuthRouter from './routes/staffAuth.js'
import staffPortalRouter from './routes/staffPortal.js'
import { FilterXSS } from 'xss'

// Routes
import csrfRouter, { requireCsrf } from './routes/csrf.js'
import authRouter from './routes/auth.js'
import paymentsRouter from './routes/payments.js'

// ----- paths -----
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ----- app -----
const app = express()
app.disable('x-powered-by')

// ----- parsers (MUST be first) -----
app.use(cookieParser())
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false }))

// ----- security headers -----
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https://localhost:8443", "https://localhost:5173", "wss://localhost:5173"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  // HSTS off in dev (self-signed); on in prod
  hsts: process.env.NODE_ENV === 'production' ? undefined : false,
}))

app.use(hpp())
app.use(compression())
app.use(morgan('dev'))


function deepSanitize(obj) {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    obj[key] = sanitize(val) 
    if (obj[key] && typeof obj[key] === 'object') deepSanitize(obj[key])
  }
}

const xssFilter = new FilterXSS({
  whiteList: {},                 
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe'],
})
function deepStripXss(obj) {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string') {
      obj[key] = xssFilter.process(val)
    } else if (val && typeof val === 'object') {
      deepStripXss(val)
    }
  }
}

// run these BEFORE routes
app.use((req, _res, next) => {
  if (req.body)   deepSanitize(req.body)
  if (req.params) deepSanitize(req.params)
  if (req.query)  deepSanitize(req.query)  
  next()
})
app.use((req, _res, next) => {
  if (req.body)   deepStripXss(req.body)
  if (req.params) deepStripXss(req.params)
  if (req.query)  deepStripXss(req.query)  
  next()
})

// ----- CORS -----
app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-csrf-token', 'authorization', 'x-requested-with'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ----- health + rate limit -----
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// express-rate-limit
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300 }))

// ----- DB -----
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env')
  process.exit(1)
}
await mongoose.connect(process.env.MONGO_URI)

// ----- routes -----
app.use('/api', csrfRouter)
app.use('/api/auth', requireCsrf, authRouter)
app.use('/api/payments', requireCsrf, paymentsRouter)
app.use('/api/staff/auth', requireCsrf, staffAuthRouter)
app.use('/api/staff', requireCsrf, staffPortalRouter)

// ----- 404 then error handler (error handler LAST) -----
app.use((req, res) => res.status(404).json({ message: 'Not found' }))

app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err)
  res.status(500).json({ message: 'Internal Server Error' })
})

// ----- HTTPS server -----
const keyPath  = path.resolve(__dirname, '../ssl/localhost-key.pem')
const certPath = path.resolve(__dirname, '../ssl/localhost.pem')
const key  = fs.readFileSync(keyPath)
const cert = fs.readFileSync(certPath)

const mustContainPem = (buf, label) => {
  if (!buf.toString('utf8', 0, 64).includes('-----BEGIN')) {
    throw new Error(`${label} does not look like a PEM. Check the path/content.`)
  }
}
mustContainPem(key,  `key @ ${keyPath}`)
mustContainPem(cert, `cert @ ${certPath}`)

const PORT = Number(process.env.PORT) || 8443
const server = https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`API over HTTPS on https://localhost:${PORT}`)
})

process.on('SIGINT',  () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
