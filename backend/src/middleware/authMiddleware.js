const supabase = require('../config/supabaseClient');

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

const verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // A. Check if Admin (Admins are automatically allowed)
    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    // B. Check if Staff (Fetch profile even if Admin, to get department/name)
    const { data: staffProfile } = await supabase
      .from('staff')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

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

module.exports = { verifyAdmin, verifyStaff };
