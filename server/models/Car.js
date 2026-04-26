const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1990,
      max: 2100,
    },
    mileage: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

carSchema.index({ owner: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Car', carSchema);
