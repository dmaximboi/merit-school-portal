import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Trash2, Loader2, Download, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

const AdminENotesView = ({ token, user }) => {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all'
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, [activeTab]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            let endpoint = activeTab === 'pending' ? '/enotes/pending' : '/enotes?class_level='; // simplified query for all
            if (activeTab === 'all') endpoint = '/enotes'; // Public route gets all active

            const data = await api.get(endpoint, token);
            setNotes(data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm("Approve this study material? It will become visible to all students.")) return;
        try {
            await api.put(`/enotes/${id}/approve`, {}, token);
            alert("✅ Approved Successfully");
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            alert("Approval Failed: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("PERMANENTLY DELETE this note?")) return;
        try {
            await api.delete(`/enotes/${id}`, token);
            alert("Deleted Successfully");
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            alert("Delete Failed: " + err.message);
        }
    };

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '', subject: '', class_level: 'SS1', description: '', file_url: ''
    });
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            await api.post('/enotes', uploadForm, token);
            alert("✅ Note Posted Successfully!");
            setShowUploadModal(false);
            setUploadForm({ title: '', subject: '', class_level: 'SS1', description: '', file_url: '' });
            if (activeTab === 'all') fetchNotes();
            setActiveTab('all');
        } catch (err) {
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-blue-600" /> E-Notes Management
                    </h2>
                    <p className="text-slate-500 text-sm">Review, Approve, or Reject study materials uploaded by Staff.</p>
                </div>
                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Pending Approval
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Active Library
                    </button>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2 text-sm"
                >
                    + Post New Note
                </button>
            </div>

            {/* UPLOAD MODAL */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800">Upload Study Material</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-red-500"><XCircle /></button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                                <input required className="input-field w-full" placeholder="e.g. Physics Mechanics Logic" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                                    <input required className="input-field w-full" placeholder="e.g. Physics" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Class Level</label>
                                    <select className="input-field w-full" value={uploadForm.class_level} onChange={e => setUploadForm({ ...uploadForm, class_level: e.target.value })}>
                                        {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">File Link (Google Drive/PDF URL)</label>
                                <input required className="input-field w-full" placeholder="https://..." value={uploadForm.file_url} onChange={e => setUploadForm({ ...uploadForm, file_url: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                <textarea className="input-field w-full h-20 resize-none p-2" placeholder="Brief summary..." value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                                    {uploading ? <Loader2 className="animate-spin" size={18} /> : null} Post Material
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500 mb-2" />
                        <span className="text-slate-400">Loading records...</span>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                        <p>{activeTab === 'pending' ? "No pending notes to approve! Good job." : "No active notes found."}</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                            <tr>
                                <th className="p-4">Title</th>
                                <th className="p-4">Resource Info</th>
                                <th className="p-4">Uploaded By</th>
                                <th className="p-4">Link</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {notes.map(note => (
                                <tr key={note.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{note.title}</div>
                                        <div className="text-xs text-slate-400 mt-1">{new Date(note.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-700 font-medium">{note.subject}</div>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{note.class_level}</span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">
                                        {note.uploaded_by || 'System/Admin'}
                                    </td>
                                    <td className="p-4">
                                        <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                            <Download size={14} /> View File
                                        </a>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {activeTab === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(note.id)}
                                                    className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition flex items-center gap-1"
                                                >
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center gap-1"
                                            >
                                                <Trash2 size={14} /> {activeTab === 'pending' ? 'Reject' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminENotesView;
