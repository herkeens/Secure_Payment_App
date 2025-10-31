import mongoose from 'mongoose'

const transferSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  beneficiaryId:    { type: String, required: true },
  beneficiaryName:  { type: String, required: true },
  beneficiaryAddress:{ type: String, required: true },
  beneficiaryAccount:{ type: String, required: true },
  beneficiarySwift: { type: String },
  bankName:         { type: String, required: true },
  bankAddress:      { type: String },
  routingCode:      { type: String },
  recipientContact: { type: String },
  amount:           { type: String, required: true },
  currency:         { type: String, enum: ['ZAR','USD','EUR','GBP'], required: true },
  reference:        { type: String },
  status:           { type: String, enum: ['submitted','approved','declined'], default: 'submitted' },
  createdAt:        { type: Date, default: Date.now },
  // Staff verification & SWIFT forwarding
  staffVerified:   { type: Boolean, default: false },
  verifiedAt:      { type: Date },
  verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  swiftSubmitted:  { type: Boolean, default: false },
  swiftSubmittedAt:{ type: Date },
  swiftRef:        { type: String }
})

export default mongoose.model('Transfer', transferSchema)
