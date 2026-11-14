const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ownerEmail: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
    maxlength: [80, 'Driver name cannot exceed 80 characters']
  },
  phone: {
    type: String,
    required: [true, 'Driver contact number is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Driver license number is required'],
    trim: true
  },
  assignedTractor: {
    type: String,
    default: 'Mahindra 575 DI (45 HP)',
    trim: true
  },
  experienceYears: {
    type: Number,
    default: 3,
    min: 0
  },
  hourlyWage: {
    type: Number,
    default: 150,
    min: 0
  },
  dailyWage: {
    type: Number,
    default: 1000,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'On Duty', 'Available', 'Inactive'],
    default: 'Available'
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  specialty: {
    type: [String],
    default: ['Rotavator', 'Cultivator']
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  joinedDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true
});

const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);

module.exports = Driver;
