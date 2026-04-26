const express = require('express');
const ServiceBooking = require('../models/ServiceBooking');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await ServiceBooking.find()
      .populate('car')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch all bookings.' });
  }
});

router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status, mechanic, estimatedCompletionAt } = req.body;

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (status) booking.status = status;
    if (mechanic !== undefined) booking.mechanic = mechanic;
    if (estimatedCompletionAt !== undefined) {
      booking.estimatedCompletionAt = estimatedCompletionAt ? new Date(estimatedCompletionAt) : null;
    }
    if (status === 'Completed') booking.completedAt = new Date();

    await booking.save();

    const populated = await ServiceBooking.findById(booking._id)
      .populate('car')
      .populate('customer', 'name email');

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update status.' });
  }
});

router.patch('/bookings/:id/details', async (req, res) => {
  try {
    const { issues = [], partsChanged = [], laborCost = 0, notes = '' } = req.body;

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const normalizedParts = partsChanged
      .filter((part) => part && part.name)
      .map((part) => ({
        name: String(part.name).trim(),
        cost: Number(part.cost || 0),
      }));

    const partsTotal = normalizedParts.reduce((sum, part) => sum + part.cost, 0);
    const totalBill = Number(laborCost || 0) + partsTotal;

    booking.issues = issues.filter(Boolean).map((issue) => String(issue).trim());
    booking.partsChanged = normalizedParts;
    booking.laborCost = Number(laborCost || 0);
    booking.totalBill = totalBill;
    booking.notes = notes;

    await booking.save();

    const populated = await ServiceBooking.findById(booking._id)
      .populate('car')
      .populate('customer', 'name email');

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update details.' });
  }
});

module.exports = router;
