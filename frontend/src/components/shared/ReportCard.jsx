import React from 'react';

const ReportCard = React.forwardRef(({ student, results }, ref) => {
  if (!student || !results || results.length === 0) return null;

  // Group results by Session -> Term
  const groupedResults = results.reduce((acc, r) => {
    const key = `${r.session} - ${r.term}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div ref={ref} className="bg-white text-black font-serif p-8" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Loop through each Term to create separate sections (or pages if needed) */}
      {Object.entries(groupedResults).map(([sessionTitle, termResults], index) => (
        <div key={sessionTitle} className={`mb-12 ${index > 0 ? 'break-before-page mt-8 pt-8 border-t-4 border-dashed border-slate-300' : ''}`}>
          
          {/* HEADER */}
          <div className="flex items-center gap-4 border-b-4 border-blue-900 pb-4 mb-6">
            <img src="/meritlogo.jpg" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-widest">Merit College</h1>
              <h2 className="text-sm font-bold text-slate-600 uppercase">Of Advanced Studies</h2>
              <p className="text-xs mt-1">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
              <div className="flex justify-center gap-4 text-[10px] font-bold mt-1">
                 <span>Term: {sessionTitle.split(' - ')[1]}</span>
                 <span>Session: {sessionTitle.split(' - ')[0]}</span>
              </div>
            </div>
            <div className="w-20 text-center">
               <div className="w-20 h-20 border border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                  {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover"/> : 'PASSPORT'}
               </div>
            </div>
          </div>

          {/* STUDENT INFO GRID */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-6 border border-slate-900 p-2">
             <div className="flex"><span className="font-bold w-24">FULL NAME:</span> {student.surname} {student.first_name} {student.middle_name}</div>
             <div className="flex"><span className="font-bold w-24">MATRIC NO:</span> {student.student_id_text}</div>
             <div className="flex"><span className="font-bold w-24">PROGRAMME:</span> {student.program_type}</div>
             <div className="flex"><span className="font-bold w-24">DEPARTMENT:</span> {student.department}</div>
          </div>

          {/* SCORES TABLE */}
          <table className="w-full text-xs border-collapse border border-slate-900 mb-6">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border border-slate-900 p-2 text-left w-1/3">SUBJECT</th>
                <th className="border border-slate-900 p-2 text-center w-16">CA (40)</th>
                <th className="border border-slate-900 p-2 text-center w-16">EXAM (60)</th>
                <th className="border border-slate-900 p-2 text-center w-16">TOTAL</th>
                <th className="border border-slate-900 p-2 text-center w-16">GRADE</th>
                <th className="border border-slate-900 p-2 text-left">REMARK</th>
              </tr>
            </thead>
            <tbody>
              {termResults.map((r, i) => (
                <tr key={i} className="text-center">
                  <td className="border border-slate-900 p-2 text-left font-bold">{r.subject}</td>
                  <td className="border border-slate-900 p-2">{r.ca_score}</td>
                  <td className="border border-slate-900 p-2">{r.exam_score}</td>
                  <td className="border border-slate-900 p-2 font-bold">{r.total_score}</td>
                  <td className={`border border-slate-900 p-2 font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-black'}`}>{r.grade}</td>
                  <td className="border border-slate-900 p-2 text-left italic">
                    {r.grade === 'A' ? 'Excellent' : r.grade === 'B' ? 'Very Good' : r.grade === 'C' ? 'Good' : r.grade === 'D' ? 'Pass' : r.grade === 'E' ? 'Fair' : 'Fail'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SUMMARY */}
          <div className="flex gap-4 text-xs mb-8">
             <div className="border border-slate-900 p-2 flex-1">
                <span className="font-bold block border-b border-slate-400 mb-1 pb-1">PERFORMANCE SUMMARY</span>
                <div className="grid grid-cols-2">
                   <span>No. of Subjects: {termResults.length}</span>
                   <span>Average Score: {(termResults.reduce((a,b) => a + (Number(b.total_score)||0), 0) / termResults.length).toFixed(1)}%</span>
                </div>
             </div>
             <div className="border border-slate-900 p-2 flex-1">
                <span className="font-bold block border-b border-slate-400 mb-1 pb-1">GRADING SCALE</span>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                   <span>A: 70-100</span><span>C: 50-59</span><span>E: 40-44</span>
                   <span>B: 60-69</span><span>D: 45-49</span><span>F: 0-39</span>
                </div>
             </div>
          </div>

          {/* SIGNATURES */}
          <div className="flex justify-between items-end mt-12 px-4">
             <div className="text-center">
                <div className="border-b border-slate-900 w-40 mb-1"></div>
                <p className="text-[10px] font-bold uppercase">Class Coordinator</p>
             </div>
             <div className="text-center">
                <div className="border-b border-slate-900 w-40 mb-1"></div>
                <p className="text-[10px] font-bold uppercase">Registrar</p>
             </div>
          </div>
          
          <div className="text-center text-[10px] text-slate-400 mt-8">
             Generated on {new Date().toLocaleDateString()} via Merit College Portal. Any alteration renders this document invalid.
          </div>
        </div>
      ))}
    </div>
  );
});

ReportCard.displayName = 'ReportCard';
export default ReportCard;
