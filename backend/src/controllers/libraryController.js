const supabase = require('../config/supabaseClient');

// --- ADMIN: ADD BOOK ---
exports.addBook = async (req, res) => {
  const { title, author, description, link, cover, price, target, department } = req.body;
  try {
    const { error } = await supabase.from('library_books').insert([{
      title, author, description,
      drive_link: link,
      cover_url: cover,
      price: price || 0,
      target_audience: target || 'all',
      restricted_dept: department === 'All' ? null : department
    }]);

    if (error) throw error;
    res.json({ message: 'Book added to library successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ADMIN: DELETE BOOK ---
exports.deleteBook = async (req, res) => {
  try {
    const { error } = await supabase.from('library_books').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PUBLIC: GET BOOKS (With Access Logic) ---
exports.getLibrary = async (req, res) => {
  const { userId, role, department } = req.query; // Passed from frontend
  
  try {
    // 1. Get all books
    const { data: books, error } = await supabase.from('library_books').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    // 2. Get User's Purchases
    const { data: purchases } = await supabase.from('library_purchases').select('book_id').eq('user_id', userId);
    const purchasedBookIds = purchases?.map(p => p.book_id) || [];

    // 3. Filter Books based on Role & Department
    const accessibleBooks = books.filter(book => {
      // Role Check
      if (book.target_audience !== 'all' && book.target_audience !== role) return false;
      
      // Department Check (Only applied if book has a restriction)
      if (book.restricted_dept && book.restricted_dept !== department) return false;
      
      return true;
    }).map(book => ({
      ...book,
      // Flag if user owns it (True if free OR purchased)
      isOwned: book.price == 0 || purchasedBookIds.includes(book.id)
    }));

    res.json(accessibleBooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PAYMENT: VERIFY PURCHASE ---
exports.verifyBookPurchase = async (req, res) => {
  const { transaction_id, book_id, user_id } = req.body;
  
  try {
    // Verify with Flutterwave
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
    });
    const flwData = await response.json();

    if (flwData.status === 'success') {
       // Record Purchase
       await supabase.from('library_purchases').insert([{
         user_id, book_id, 
         amount: flwData.data.amount,
         reference: flwData.data.tx_ref
       }]);
       res.json({ message: 'Book Purchased Successfully' });
    } else {
       res.status(400).json({ error: 'Payment Failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};