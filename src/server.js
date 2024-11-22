const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./api/v1');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the API'
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route Not Found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    errors: err.errors || null
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
