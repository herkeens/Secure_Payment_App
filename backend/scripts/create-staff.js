import 'dotenv/config'
import mongoose from 'mongoose'
import { hash as argonHash } from '@node-rs/argon2'
import Staff from '../models/Staff.js'

async function main() {
  const [,, username, password, name, employeeId, email] = process.argv
  if (!username || !password || !name || !employeeId) {
    console.error('Usage: node scripts/create-staff.js <username> <password> "<Full Name>" <EMP-ID> [email]')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const hashed = await argonHash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  const doc = await Staff.create({
    username,
    name,
    employeeId,
    email: email || undefined,
    password: hashed,
    role: 'staff'
  })
  console.log('Created staff:', { id: doc._id.toString(), username: doc.username, employeeId: doc.employeeId })
  await mongoose.disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
