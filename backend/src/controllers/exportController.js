/**
 * Student Export Controller
 * Export students list as Excel or PDF with all details
 */

const supabase = require('../config/supabaseClient');

/**
 * Get students data for export
 * Returns formatted data for Excel/PDF generation
 */
exports.getExportData = async (req, res) => {
    try {
        const { format = 'json', search, department, program } = req.query;

        let query = supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (search) {
            query = query.or(`first_name.ilike.%${search}%,surname.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
        }
        if (department) {
            query = query.eq('department', department);
        }
        if (program) {
            query = query.eq('program_type', program);
        }

        const { data: students, error } = await query;

        if (error) throw error;

        // Format data for export
        const exportData = students.map(s => ({
            'Student ID': s.student_id || s.id?.substring(0, 8),
            'Full Name': `${s.surname || ''} ${s.first_name || ''} ${s.other_names || ''}`.trim(),
            'Email': s.email || '',
            'Phone': s.phone_number || '',
            'Gender': s.sex || '',
            'Department': s.department || '',
            'Program': s.program_type || '',
            'Registration Date': s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
            'Payment Status': s.payment_status || 'pending',
            'Photo URL': s.passport_photo || '',
            // Internal IDs for PDF generation
            _id: s.id,
            _photo: s.passport_photo
        }));

        // Return based on format
        if (format === 'csv') {
            // Generate CSV
            const headers = Object.keys(exportData[0] || {}).filter(k => !k.startsWith('_'));
            const csv = [
                headers.join(','),
                ...exportData.map(row =>
                    headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=students_export_${Date.now()}.csv`);
            return res.send(csv);
        }

        // Return JSON (for frontend to generate Excel/PDF)
        res.json({
            success: true,
            count: exportData.length,
            data: exportData,
            filters: { search, department, program }
        });
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get filter options for student export
 */
exports.getFilterOptions = async (req, res) => {
    try {
        // Get unique departments
        const { data: depts } = await supabase
            .from('students')
            .select('department')
            .not('department', 'is', null);

        const departments = [...new Set(depts?.map(d => d.department).filter(Boolean))];

        // Get unique programs
        const { data: progs } = await supabase
            .from('students')
            .select('program_type')
            .not('program_type', 'is', null);

        const programs = [...new Set(progs?.map(p => p.program_type).filter(Boolean))];

        res.json({
            departments,
            programs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get student count stats
 */
exports.getStats = async (req, res) => {
    try {
        const { count: total } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        const { count: paid } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'paid');

        const { count: validated } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('is_validated', true);

        const { count: thisMonth } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        res.json({
            total: total || 0,
            paid: paid || 0,
            validated: validated || 0,
            thisMonth: thisMonth || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = exports;
