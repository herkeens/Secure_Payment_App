import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email:    { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  username:      { type: String, required: true, unique: true, index: true },
  idNumber:      { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, unique: true, index: true },
  name:     { type: String, required: true },
  password: { type: String, required: true }, // stores Argon2id hash
  createdAt:{ type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)
