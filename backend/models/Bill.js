const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer contact number is required'],
    trim: true
  },
  driverName: {
    type: String,
    default: 'Muthu'
  },
  workType: {
    type: String,
    required: [true, 'Work type / Implement is required'],
    trim: true
  },
  variant: {
    type: String,
    default: ''
  },
  durationSecs: {
    type: Number,
    required: true,
    min: 0
  },
  durationFormatted: {
    type: String,
    required: true
  },
  ratePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: () => {
      const d = new Date();
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
}, {
  timestamps: true
});

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

module.exports = Bill;
