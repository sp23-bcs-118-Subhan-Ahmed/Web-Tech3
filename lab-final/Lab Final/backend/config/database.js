import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    console.error('MongoDB Connection Error: ' + error.message);
    console.log('Server will continue running but database operations may fail.');
  }
};

export default connectDB;
