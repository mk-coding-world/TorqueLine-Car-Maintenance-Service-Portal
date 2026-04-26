const express = require('express');
const Car = require('../models/Car');
const ServiceBooking = require('../models/ServiceBooking');
const { auth } = require('../middleware/auth');
const { calculateHealthScore, getHealthBand } = require('../utils/healthScore');

const router = express.Router();

router.use(auth);

router.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.json(cars);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch cars.' });
  }
});

router.post('/cars', async (req, res) => {
  try {
    const { model, number, year, mileage = 0 } = req.body;

    if (!model || !number || !year) {
      return res.status(400).json({ message: 'Model, number and year are required.' });
    }

    const car = await Car.create({
      owner: req.user._id,
      model,
      number,
      year,
      mileage,
    });

    return res.status(201).json(car);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Car number already added for this user.' });
    }
    return res.status(500).json({ message: 'Failed to add car.' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const { carId, serviceType, appointmentDate, issues = [] } = req.body;

    if (!carId || !serviceType || !appointmentDate) {
      return res.status(400).json({ message: 'Car, service type and date are required.' });
    }

    const car = await Car.findOne({ _id: carId, owner: req.user._id });
    if (!car) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    const booking = await ServiceBooking.create({
      customer: req.user._id,
      car: car._id,
      serviceType,
      appointmentDate,
      issues: Array.isArray(issues)
        ? issues.map((issue) => String(issue).trim()).filter(Boolean)
        : [],
    });

    const populated = await booking.populate('car');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create booking.' });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({ customer: req.user._id })
      .populate('car')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
});

router.get('/history/:carId', async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.carId, owner: req.user._id });
    if (!car) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    const completed = await ServiceBooking.find({
      customer: req.user._id,
      car: car._id,
      status: 'Completed',
    }).sort({ completedAt: -1, updatedAt: -1 });

    const latestServiceDate = completed.length ? completed[0].completedAt || completed[0].updatedAt : null;
    const unresolvedIssues = completed.reduce((sum, b) => sum + (b.issues?.length || 0), 0);
    const healthScore = calculateHealthScore({
      lastServiceDate: latestServiceDate,
      issuesCount: unresolvedIssues,
      mileage: car.mileage,
    });

    return res.json({
      car,
      health: {
        score: healthScore,
        ...getHealthBand(healthScore),
      },
      history: completed,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch history.' });
  }
});

module.exports = router;
