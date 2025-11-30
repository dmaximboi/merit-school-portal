const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Route Handlers
// Ensure these files exist in your backend/src/routes folder
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const parentRoutes = require('./routes/parentRoutes');

const app = express();

// --- Security & Middleware Layer ---
app.use(helmet()); // Adds security headers (prevents XSS, etc.)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allows sessions/cookies if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase body limit for photo uploads (Passport photos)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan('dev')); // Logs requests to console for debugging

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send({ 
    status: 'Active', 
    system: 'Merit School Portal API v2.0', 
    timestamp: new Date().toISOString() 
  });
});

// --- API Routes ---

// 1. Admin Management (Protected by verifyAdmin middleware inside the route)
app.use('/api/schmngt', adminRoutes);

// 2. Student Authentication (Login)
app.use('/api/auth', authRoutes);

// 3. Student Registration & Profile Management
app.use('/api/students', studentRoutes);

// 4. Staff Management (Registration & Login)
app.use('/api/staff', staffRoutes);

// 5. Parent Portal (Secure Read-Only Access)
app.use('/api/parents', parentRoutes);

// --- Global Error Handling ---
// This catches any crash errors and sends a clean JSON response instead of hanging the server
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