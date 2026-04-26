const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Service Track API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

const ensureDefaultAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@service-track.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) return;

  const hashed = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: 'Service Admin',
    email: adminEmail.toLowerCase(),
    password: hashed,
    role: 'admin',
  });

  // eslint-disable-next-line no-console
  console.log(`Default admin created: ${adminEmail}`);
};

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
