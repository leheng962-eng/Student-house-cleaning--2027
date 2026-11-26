require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// REST API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/reports', require('./routes/reports'));

// Serve the frontend folder so one command runs everything
app.use(express.static(path.join(__dirname, '../frontend')));

// Error handler: any crash in a route returns clean JSON
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Server running: http://localhost:' + (process.env.PORT || 5000))))
  .catch((e) => console.error('MongoDB connection failed:', e.message));
