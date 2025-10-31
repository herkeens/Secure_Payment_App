import mongoose from 'mongoose'

const staffSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true, index: true },
  email:      { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  name:       { type: String, required: true },
  employeeId: { type: String, required: true, unique: true, index: true },
  password:   { type: String, required: true }, // Argon2id hash
  role:       { type: String, enum: ['staff','admin'], default: 'staff', index: true },
  createdAt:  { type: Date, default: Date.now }
})

export default mongoose.model('Staff', staffSchema)
