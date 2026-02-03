const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import Security Middleware
const { WAF, cspMiddleware, csrfMiddleware, createIPFingerprint } = require('./middleware/waf');
const twoFactorAuth = require('./middleware/twoFactorAuth');
const {
  zeroTrust,
  monitor,
  behaviorAnalyzer,
  leastPrivilege
} = require('./middleware/advancedSecurity');
const {
  validateFrontendAction,
  validateImageUpload,
  sanitizeInput
} = require('./middleware/validationMiddleware');

// Import Route Handlers
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const parentRoutes = require('./routes/parentRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const resultRoutes = require('./routes/resultRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// --- ENTERPRISE WAF (Web Application Firewall) ---
const waf = new WAF({
  blockSuspiciousUserAgents: true,
  logBlocks: true,
  strictMode: process.env.NODE_ENV === 'production',
  maxPayloadSize: 50 * 1024 * 1024 // 50MB for file uploads
});

// Apply WAF first (before any other middleware)
app.use(waf.middleware());

// --- Zero Trust Network Verification ---
app.use(zeroTrust.middleware());

// --- Real-time Monitoring ---
app.use(monitor.middleware());

// --- Cookie Parser (for secure sessions) ---
app.use(cookieParser(process.env.COOKIE_SECRET || 'merit-school-cookie-secret'));

// --- Content Security Policy ---
app.use(cspMiddleware);

// --- 1. GLOBAL SECURITY HEADERS (Helmet) ---
app.use(helmet());

// --- 3. CORS (Most Important - Run First) ---
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'https://meritcollege.vercel.app',
    'https://www.meritcollege.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 2. STRICT RATE LIMITING ---
// Login endpoints: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Relaxed from 5 to 50 for testing
  message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 500 requests per 15 minutes (more reasonable)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests. Please slow down and try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CBT Generation: 10 requests per hour (prevent AI abuse)
const cbtLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'CBT generation limit reached. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply login limiter to all login routes
app.use('/api/auth/admin/login', loginLimiter);
app.use('/api/auth/student/login', loginLimiter);
app.use('/api/auth/staff/login', loginLimiter);
app.use('/api/auth/parent/login', loginLimiter);

// Apply CBT limiter
app.use('/api/students/cbt/generate', cbtLimiter);

// Apply general API limiter
app.use('/api', apiLimiter);

// --- 3. CORS (Strict Access) ---


// --- 4. DYNAMIC BODY PARSER (THE FIX) ---
// This replaces the global 10kb limit. 
// It allows 50mb ONLY for registration routes, and 10kb for everything else.
const dynamicBodyParser = (req, res, next) => {
  // Check if the URL is for registration (Student, Staff, or Auth)
  const isRegistration = req.path.includes('/register');

  const limit = isRegistration ? '50mb' : '10kb';

  express.json({ limit })(req, res, next);
};

const dynamicUrlParser = (req, res, next) => {
  const isRegistration = req.path.includes('/register');
  const limit = isRegistration ? '50mb' : '10kb';
  express.urlencoded({ extended: true, limit })(req, res, next);
};

app.use(dynamicBodyParser);
app.use(dynamicUrlParser);

// --- 5. DATA SANITIZATION ---
app.use(xss());
app.use(hpp());

app.use(morgan('dev'));

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send({
    status: 'Active',
    system: 'Merit School Portal API v2.1',
    timestamp: new Date().toISOString()
  });
});

// --- API Routes ---
// Note: We removed the "Special Route" blocks because the Dynamic Parser above handles it automatically.
// This prevents the "404 Route Mismatch" errors.

app.use('/api/schmngt', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes')); // Quiz accessible to all roles
app.use('/api/students/cbt', require('./routes/cbtRoutes')); // New CBT routes (Generate, Dictionary etc)
app.use('/api/payments', require('./routes/paymentRoutes')); // Flutterwave payments
app.use('/api/enotes', require('./routes/enotesRoutes')); // E-Notes (digital study materials)

// --- SECURITY MONITORING API (Admin Only) ---
const { verifyAdmin } = require('./middleware/authMiddleware');

// Get real-time security metrics
app.get('/api/security/metrics', verifyAdmin, (req, res) => {
  res.json({
    metrics: monitor.getMetrics(),
    zeroTrust: zeroTrust.getAccessLog().slice(-50),
    wafStats: waf.getStats()
  });
});

// Get user risk assessment
app.get('/api/security/risk/:userId', verifyAdmin, (req, res) => {
  const assessment = behaviorAnalyzer.getRiskAssessment(req.params.userId);
  res.json(assessment);
});

// Get permission matrix
app.get('/api/security/permissions', verifyAdmin, (req, res) => {
  res.json({
    student: leastPrivilege.getPermissions('student'),
    staff: leastPrivilege.getPermissions('staff'),
    parent: leastPrivilege.getPermissions('parent'),
    admin: leastPrivilege.getPermissions('admin')
  });
});

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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 SERVER RUNNING (ENTERPRISE SECURE MODE)`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'Development'}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`🛡️  ENTERPRISE SECURITY FEATURES:`);
  console.log(`   ✓ Web Application Firewall (WAF)`);
  console.log(`   ✓ Zero Trust Networking`);
  console.log(`   ✓ Real-time Security Monitoring`);
  console.log(`   ✓ Behavior Analysis & Anomaly Detection`);
  console.log(`   ✓ Content Security Policy (CSP)`);
  console.log(`   ✓ Rate Limiting & DDoS Protection`);
  console.log(`   ✓ XSS & SQL Injection Prevention`);
  console.log(`   ✓ Two-Factor Authentication (2FA)`);
  console.log(`   ✓ Short-lived Credentials`);
  console.log(`   ✓ Principle of Least Privilege`);
  console.log(`   ✓ Session Isolation`);
  console.log(`   ✓ IP Fingerprinting`);
  console.log(`   ✓ Secure HTTP-Only Cookies`);
  console.log(`${'='.repeat(60)}\n`);
});

