require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Enable CORS and parsing middleware
app.use(cors());
app.use(express.json());

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const reviewRoutes = require('./routes/review.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);


// Heartbeat route
app.get('/api/health', (req, res) => {

  res.status(200).json({
    status: 'success',
    message: 'AI Code Reviewer API is online and responding.',
    timestamp: new Date()
  });
});

// Centralized error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

