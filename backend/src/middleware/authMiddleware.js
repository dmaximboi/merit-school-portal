const supabase = require('../config/supabaseClient');

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const email = user.email.trim().toLowerCase();

    // 2. Check Database Allowlist (Case Insensitive)
    const { data: adminEntry, error: dbError } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .single();

    if (dbError || !adminEntry) {
      console.warn(`⛔ Blocked Admin Access: ${email}`);
      return res.status(403).json({ error: 'Access Denied: You are not an Administrator.' });
    }

    console.log(`✅ Admin Authorized: ${email}`);
    req.user = user;
    next();

  } catch (err) {
    console.error('Middleware Error:', err);
    return res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// NEW: Verify Staff Middleware
const verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user has staff profile
    const { data: staffProfile, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', user.id)
      .single();

    if (staffError || !staffProfile) {
      return res.status(403).json({ error: 'Access Denied: Staff profile not found.' });
    }

    console.log(`✅ Staff Authorized: ${staffProfile.full_name}`);
    req.user = user;
    req.staff = staffProfile;
    next();

  } catch (err) {
    console.error('Staff Middleware Error:', err);
    return res.status(500).json({ error: 'Server Authentication Error' });
  }
};

module.exports = { verifyAdmin, verifyStaff };