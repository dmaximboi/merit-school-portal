const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Enforce strong JWT secret
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters in production');
  }
  console.warn('⚠️  WARNING: JWT_SECRET is weak or missing. Generate a strong secret for production.');
  console.warn('   Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

// --- 4. VERIFY PARENT (CUSTOM JWT) ---
const verifyParent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    // Verify Custom Token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if role is parent
    if (decoded.role !== 'parent') {
      return res.status(403).json({ error: 'Access Denied: Parent Access Only' });
    }

    // Attach user (student info) to request
    req.user = { id: decoded.studentId };
    req.role = 'parent';
    next();

  } catch (err) {
    console.error("Parent Auth Error:", err.message);
    res.status(401).json({ error: 'Invalid or Expired Token' });
  }
};

// --- 1. VERIFY ADMIN ---
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      return res.status(403).json({ error: 'Access Denied: Not an Administrator.' });
    }

    req.user = user;
    req.role = 'admin';
    next();

  } catch (err) {
    console.error("Admin Auth Error:", err);
    res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// --- 2. VERIFY STAFF ---
const verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // Check Admin (Admins can act as Staff)
    const { data: adminEntry } = await supabase.from('admin_allowlist').select('email').ilike('email', email).maybeSingle();

    // Check Staff Profile
    const { data: staffProfile } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle();

    if (adminEntry) {
      req.user = user;
      req.role = 'admin';
      if (staffProfile) req.staff = staffProfile;
      return next();
    }

    if (staffProfile) {
      req.user = user;
      req.role = 'staff';
      req.staff = staffProfile;
      return next();
    }

    return res.status(403).json({ error: 'Access Denied: You are not Staff.' });

  } catch (err) {
    console.error('Staff Auth Error:', err);
    return res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// --- 3. VERIFY STUDENT (MISSING PIECE) ---
const verifyStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Attach user to request so Controller can read 'req.user.id'
    req.user = user;
    req.role = 'student';
    next();

  } catch (err) {
    console.error("Student Auth Error:", err);
    res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// --- 5. VERIFY ANY (Admin/Staff/Student) ---
const verifyAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // 1. Check Admin
    const { data: admin } = await supabase.from('admin_allowlist').select('email').ilike('email', email).maybeSingle();
    if (admin) { req.user = user; req.role = 'admin'; return next(); }

    // 2. Check Staff
    const { data: staff } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle();
    if (staff) { req.user = user; req.role = 'staff'; return next(); }

    // 3. Fallback to Student
    req.user = user;
    req.role = 'student';
    next();

  } catch (err) {
    console.error("Auth Error:", err);
    res.status(500).json({ error: 'Server Authentication Error' });
  }
};

module.exports = { verifyAdmin, verifyStaff, verifyStudent, verifyParent, verifyAny };
