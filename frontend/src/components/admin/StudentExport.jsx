/**
 * Student Export Component
 * Export students list as Excel or PDF
 */

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, Search, Filter, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const StudentExport = ({ onClose }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        program: ''
    });
    const [filterOptions, setFilterOptions] = useState({ departments: [], programs: [] });
    const [preview, setPreview] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchFilterOptions();
        fetchStats();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const res = await api.get('/schmngt/export/filters', token);
            if (res) setFilterOptions(res);
        } catch (err) {
            console.error('Failed to fetch filters:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/schmngt/export/stats', token);
            if (res) setStats(res);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.department) params.append('department', filters.department);
            if (filters.program) params.append('program', filters.program);

            const res = await api.get(`/schmngt/export/students?${params.toString()}`, token);
            if (res.success) {
                setPreview(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch preview:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!preview || preview.length === 0) return;

        const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Gender', 'Department', 'Program', 'Registration Date', 'Payment Status'];
        const rows = preview.map(row =>
            headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`)
        );

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        downloadFile(csv, 'students_export.csv', 'text/csv');
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            // For Excel, we'll generate an HTML table that Excel can open
            if (!preview || preview.length === 0) return;

            const headers = ['Photo', 'Student ID', 'Full Name', 'Email', 'Phone', 'Gender', 'Department', 'Program', 'Registration Date', 'Payment Status'];

            let html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                <head><meta charset="utf-8"></head>
                <body>
                <table border="1">
                    <tr>${headers.map(h => `<th style="background:#4F46E5;color:white;font-weight:bold;padding:10px;">${h}</th>`).join('')}</tr>
                    ${preview.map(row => `
                        <tr>
                            <td><img src="${row['Photo URL'] || ''}" width="50" height="50" /></td>
                            <td>${row['Student ID'] || ''}</td>
                            <td style="font-weight:bold;">${row['Full Name'] || ''}</td>
                            <td>${row['Email'] || ''}</td>
                            <td>${row['Phone'] || ''}</td>
                            <td>${row['Gender'] || ''}</td>
                            <td>${row['Department'] || ''}</td>
                            <td>${row['Program'] || ''}</td>
                            <td>${row['Registration Date'] || ''}</td>
                            <td style="color:${row['Payment Status'] === 'paid' ? 'green' : 'red'};">${row['Payment Status'] || ''}</td>
                        </tr>
                    `).join('')}
                </table>
                </body></html>
            `;

            downloadFile(html, 'students_export.xls', 'application/vnd.ms-excel');
        } finally {
            setExporting(false);
        }
    };

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <Download size={24} />
                            Export Students
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">
                            Export student list as Excel or CSV
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border-b">
                        <div className="text-center">
                            <p className="text-2xl font-black text-indigo-600">{stats.total}</p>
                            <p className="text-xs text-slate-500">Total Students</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-green-600">{stats.paid}</p>
                            <p className="text-xs text-slate-500">Paid</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-blue-600">{stats.validated}</p>
                            <p className="text-xs text-slate-500">Validated</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-purple-600">{stats.thisMonth}</p>
                            <p className="text-xs text-slate-500">This Month</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="p-4 border-b bg-white">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, ID..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="px-4 py-2 border-2 rounded-lg focus:border-indigo-500 outline-none"
                        >
                            <option value="">All Departments</option>
                            {filterOptions.departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <select
                            value={filters.program}
                            onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                            className="px-4 py-2 border-2 rounded-lg focus:border-indigo-500 outline-none"
                        >
                            <option value="">All Programs</option>
                            {filterOptions.programs.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <button
                            onClick={fetchPreview}
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />}
                            Preview
                        </button>
                    </div>
                </div>

                {/* Preview Table */}
                <div className="flex-1 overflow-auto p-4">
                    {preview ? (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left">Photo</th>
                                    <th className="p-3 text-left">Full Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Department</th>
                                    <th className="p-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {preview.slice(0, 10).map((student, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            {student['Photo URL'] ? (
                                                <img src={student['Photo URL']} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                                            )}
                                        </td>
                                        <td className="p-3 font-bold">{student['Full Name']}</td>
                                        <td className="p-3 text-slate-500">{student['Email']}</td>
                                        <td className="p-3">{student['Department']}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${student['Payment Status'] === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {student['Payment Status']}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Click "Preview" to see students matching your filters
                        </div>
                    )}
                    {preview && preview.length > 10 && (
                        <p className="text-center text-slate-500 text-sm mt-4">
                            Showing 10 of {preview.length} students. Export to see all.
                        </p>
                    )}
                </div>

                {/* Export Buttons */}
                <div className="p-4 border-t bg-slate-50 flex gap-3">
                    <button
                        onClick={exportToCSV}
                        disabled={!preview || preview.length === 0}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FileText size={20} />
                        Export CSV
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={!preview || preview.length === 0 || exporting}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentExport;
