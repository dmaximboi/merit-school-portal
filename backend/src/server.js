const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Route Handlers
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const parentRoutes = require('./routes/parentRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const resultRoutes = require('./routes/resultRoutes'); 

const app = express();

// --- Security & Middleware Layer ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase body limit for photo uploads
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan('dev'));

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send({ 
    status: 'Active', 
    system: 'Merit School Portal API v2.0', 
    timestamp: new Date().toISOString() 
  });
});

// --- API Routes ---
app.use('/api/schmngt', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/results', resultRoutes); // NEW: Added results routes

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({ 
    error: true, 
    message: errorMessage 
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'Development'}`);
  console.log(`🛡️  Admin Access Locked to Super Admins`);
  console.log(`==================================================\n`);
});