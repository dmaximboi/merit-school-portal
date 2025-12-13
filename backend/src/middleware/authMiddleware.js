const supabase = require('../config/supabaseClient');

// 1. Verify Admin (Strict)
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // Check Allowlist
    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      return res.status(403).json({ error: 'Access Denied: Not an Administrator.' });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(500).json({ error: 'Auth Error' });
  }
};

// 2. Verify Staff OR Admin (Flexible)
const verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // --- STEP A: CHECK IF ADMIN (Admins can do everything Staff can) ---
    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (adminEntry) {
      req.user = user;
      req.role = 'admin'; // Mark as admin
      return next(); // <--- ADMINS PASS HERE
    }

    // --- STEP B: IF NOT ADMIN, CHECK STAFF TABLE ---
    const { data: staffProfile, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', user.id)
      .single();

    if (staffError || !staffProfile) {
      return res.status(403).json({ error: 'Access Denied: You are not Staff or Admin.' });
    }

    req.user = user;
    req.role = 'staff';
    next(); // <--- STAFF PASS HERE

  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ error: 'Server Authentication Error' });
  }
};

module.exports = { verifyAdmin, verifyStaff };
