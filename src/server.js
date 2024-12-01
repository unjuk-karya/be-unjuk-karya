const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./api/v1');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public')); 

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the API'
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route Not Found'
  });
});

app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    errors: err.errors || null
  });
});

const PORT = process.env.PORT || 5042;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
