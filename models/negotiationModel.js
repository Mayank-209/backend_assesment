const mongoose = require('mongoose');

const NegotiationSchema = new mongoose.Schema({
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Offered', 'Accepted', 'Rejected'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Negotiation', NegotiationSchema);