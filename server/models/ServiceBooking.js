const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const serviceBookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    serviceType: {
      type: String,
      enum: [
        'General Service',
        'Oil Change',
        'Battery Service',
        'Alignment & balancing',
        'Engine Repair',
        'Brake Service',
        'AC Service',
        'Electrical Service',
        'Full Inspection',
      ],
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Inspection', 'Under Repair', 'Completed'],
      default: 'Pending',
    },
    mechanic: {
      type: String,
      default: 'Unassigned',
    },
    estimatedCompletionAt: {
      type: Date,
      default: null,
    },
    issues: {
      type: [String],
      default: [],
    },
    partsChanged: {
      type: [partSchema],
      default: [],
    },
    laborCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBill: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
