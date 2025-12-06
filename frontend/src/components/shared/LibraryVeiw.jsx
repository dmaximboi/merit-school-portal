import React, { useState, useEffect } from 'react';
import { Book, ExternalLink, Lock, Trash2, Search, Filter, Plus, X, DollarSign, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const LibraryView = ({ user, role, isAdmin, token }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '', author: '', description: '', link: '', 
    cover: '', price: '0', target: 'all', department: 'All'
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/library?userId=${user?.id || ''}&role=${role}&department=${user?.department || ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch library');
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      console.error('Library fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!isAdmin) return;
    if (!newBook.title || !newBook.link) {
      alert('Please fill in required fields (Title and Drive Link)');
      return;
    }
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/library/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBook)
      });

      if (!response.ok) throw new Error('Failed to add book');
      
      alert('📚 Book Added Successfully!');
      setShowAddForm(false);
      setNewBook({
        title: '', author: '', description: '', link: '', 
        cover: '', price: '0', target: 'all', department: 'All'
      });
      fetchBooks();
    } catch (err) {
      alert('Failed to add book: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this book from the library?")) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/library/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete');
      fetchBooks();
    } catch (err) {
      alert("Failed to delete book");
    }
  };

  const handleBuy = async (book) => {
    const { useFlutterwave, closePaymentModal } = await import('flutterwave-react-v3');
    
    const config = {
      public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `LIB-${Date.now()}-${user.id}`,
      amount: parseFloat(book.price),
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: { 
        email: user.email, 
        name: `${user.surname || user.full_name || 'Student'} ${user.first_name || ''}` 
      },
      customizations: { 
        title: book.title, 
        description: "Library Book Purchase",
        logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg'
      },
    };

    const handlePayment = useFlutterwave(config);

    handlePayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === "successful") {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${API_URL}/library/buy`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                transaction_id: response.transaction_id,
                book_id: book.id,
                user_id: user.id
              })
            });
            
            alert("✅ Purchase Successful! You can now access this book.");
            fetchBooks();
          } catch (err) {
            alert("Payment succeeded but failed to unlock book. Contact admin with transaction ID: " + response.transaction_id);
          }
        }
      },
      onClose: () => console.log('Payment closed'),
    });
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           book.restricted_dept === categoryFilter ||
                           (categoryFilter === 'General' && !book.restricted_dept);
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'owned' && book.isOwned) ||
                         (filter === 'free' && book.price == 0) ||
                         (filter === 'paid' && book.price > 0);
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-700 mb-4"/>
        <p className="text-slate-600 font-medium">Loading Digital Library...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-amber-50 to-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-amber-900 flex items-center gap-3">
            <Book className="text-amber-700" size={32}/> 
            Digital Library
          </h2>
          <p className="text-slate-600 mt-1">Browse and access educational resources</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
              showAddForm 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-amber-700 text-white hover:bg-amber-800'
            }`}
          >
            {showAddForm ? <X size={20}/> : <Plus size={20}/>}
            {showAddForm ? 'Close Form' : 'Add New Book'}
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 border-4 border-amber-200">
          <h3 className="text-xl font-bold mb-6 text-amber-900 flex items-center gap-2">
            <Plus/> Upload New Material
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Book Title *</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="e.g. Mathematics Textbook" 
                value={newBook.title}
                onChange={e => setNewBook({...newBook, title: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Author</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="e.g. Dr. Smith" 
                value={newBook.author}
                onChange={e => setNewBook({...newBook, author: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image URL</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="https://example.com/cover.jpg" 
                value={newBook.cover}
                onChange={e => setNewBook({...newBook, cover: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Google Drive Link *</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="https://drive.google.com/..." 
                value={newBook.link}
                onChange={e => setNewBook({...newBook, link: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Price (₦)</label>
              <input 
                type="number" 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="0 for Free" 
                value={newBook.price}
                onChange={e => setNewBook({...newBook, price: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
              <select 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                value={newBook.target}
                onChange={e => setNewBook({...newBook, target: e.target.value})}
              >
                <option value="all">Everyone (Students & Staff)</option>
                <option value="student">Students Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Department Restriction</label>
              <select 
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                value={newBook.department}
                onChange={e => setNewBook({...newBook, department: e.target.value})}
              >
                <option value="All">All Departments</option>
                <option value="JAMB">JAMB Only</option>
                <option value="A-Level">A-Level Only</option>
                <option value="O-Level">O-Level Only</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea 
                className="w-full border-2 border-slate-200 rounded-lg p-3 h-24 resize-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition" 
                placeholder="Brief description of the book..."
                value={newBook.description}
                onChange={e => setNewBook({...newBook, description: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <button 
                onClick={handleAddBook}
                className="w-full bg-amber-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-800 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                📚 Upload Book to Library
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border-2 border-amber-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20}/>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
              />
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
          >
            <option value="all">All Categories</option>
            <option value="JAMB">JAMB Resources</option>
            <option value="A-Level">A-Level Resources</option>
            <option value="O-Level">O-Level Resources</option>
            <option value="General">General Books</option>
          </select>
          
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
          >
            <option value="all">All Books</option>
            <option value="owned">My Books</option>
            <option value="free">Free Books</option>
            <option value="paid">Paid Books</option>
          </select>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-lg border-4 border-dashed border-amber-200">
          <Book size={64} className="mx-auto text-amber-300 mb-4"/>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Books Found</h3>
          <p className="text-slate-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <div 
              key={book.id} 
              className="bg-gradient-to-b from-amber-100 to-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-4 border-amber-200 flex flex-col transform hover:-translate-y-2"
            >
              <div className="h-64 bg-gradient-to-br from-amber-200 to-amber-50 relative overflow-hidden">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book size={80} className="text-amber-300"/>
                  </div>
                )}
                
                <div className="absolute top-3 right-3">
                  {book.price == 0 ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                      <CheckCircle size={12}/> FREE
                    </span>
                  ) : (
                    <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                      <DollarSign size={12}/> ₦{parseFloat(book.price).toLocaleString()}
                    </span>
                  )}
                </div>
                
                {book.isOwned && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                      <CheckCircle size={12}/> OWNED
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-amber-50 to-white">
                <h3 className="font-black text-slate-900 text-lg line-clamp-2 mb-1">{book.title}</h3>
                {book.author && (
                  <p className="text-xs text-amber-700 font-medium mb-2">by {book.author}</p>
                )}
                <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{book.description || 'No description available'}</p>
                
                {book.restricted_dept && (
                  <div className="mb-3">
                    <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                      {book.restricted_dept}
                    </span>
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t-2 border-amber-100">
                  {isAdmin ? (
                    <button 
                      onClick={() => handleDelete(book.id)} 
                      className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Trash2 size={16}/> Delete Book
                    </button>
                  ) : book.isOwned ? (
                    <a 
                      href={book.drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
                    >
                      <ExternalLink size={16}/> Open Book
                    </a>
                  ) : book.price == 0 ? (
                    <a 
                      href={book.drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-700 hover:to-green-800 transition shadow-lg"
                    >
                      <ExternalLink size={16}/> Read Free
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleBuy(book)} 
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-amber-700 hover:to-amber-800 transition shadow-lg"
                    >
                      <DollarSign size={16}/> Buy for ₦{parseFloat(book.price).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;