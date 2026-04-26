const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing in environment variables.');
  }

  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
};

module.exports = connectDB;
