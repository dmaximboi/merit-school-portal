import React, { forwardRef } from 'react';

const ReportCard = forwardRef(({ student, results }, ref) => {
  if (!student || !results || results.length === 0) {
    return <div ref={ref} className="hidden">No Data</div>;
  }

  const currentDate = new Date().toLocaleDateString();
  
  // Calculate Average
  const totalScore = results.reduce((acc, curr) => acc + curr.total_score, 0);
  const average = (totalScore / results.length).toFixed(1);

  return (
    <div ref={ref} className="p-10 font-serif text-black bg-white" style={{ minHeight: '297mm', width: '210mm' }}>
      {/* HEADER */}
      <div className="flex items-center gap-6 mb-6 border-b-4 border-double border-slate-900 pb-4">
        <img src="/meritlogo.jpg" alt="Logo" className="w-24 h-24 object-contain" />
        <div className="text-center flex-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-widest uppercase">Merit College</h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Of Advanced Studies</p>
          <p className="text-xs text-slate-500 mt-1">Knowledge • Integrity • Excellence</p>
        </div>
        <div className="text-right">
            <div className="text-sm font-bold">Student Report Sheet</div>
            <div className="text-xs text-slate-500">Session: 2025/2026</div>
        </div>
      </div>

      {/* STUDENT INFO */}
      <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded border border-slate-200 text-sm">
        <div>
            <p><span className="font-bold">Name:</span> {student.surname} {student.first_name}</p>
            <p><span className="font-bold">Student ID:</span> {student.student_id_text}</p>
        </div>
        <div className="text-right">
            <p><span className="font-bold">Department:</span> {student.department}</p>
            <p><span className="font-bold">Programme:</span> {student.program_type}</p>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <table className="w-full border-collapse border border-slate-900 text-sm mb-6">
        <thead className="bg-slate-200">
            <tr>
                <th className="border border-slate-900 p-2 text-left">Subject</th>
                <th className="border border-slate-900 p-2 text-center w-16">CA (40)</th>
                <th className="border border-slate-900 p-2 text-center w-16">Exam (60)</th>
                <th className="border border-slate-900 p-2 text-center w-16">Total</th>
                <th className="border border-slate-900 p-2 text-center w-16">Grade</th>
                <th className="border border-slate-900 p-2 text-left">Remark</th>
            </tr>
        </thead>
        <tbody>
            {results.map((res) => (
                <tr key={res.id}>
                    <td className="border border-slate-900 p-2 font-bold">{res.subject}</td>
                    <td className="border border-slate-900 p-2 text-center">{res.ca_score}</td>
                    <td className="border border-slate-900 p-2 text-center">{res.exam_score}</td>
                    <td className="border border-slate-900 p-2 text-center font-bold">{res.total_score}</td>
                    <td className={`border border-slate-900 p-2 text-center font-bold ${res.grade === 'F' ? 'text-red-600' : 'text-black'}`}>{res.grade}</td>
                    <td className="border border-slate-900 p-2 italic text-xs">
                        {res.grade === 'A' ? 'Excellent' : res.grade === 'B' ? 'Very Good' : res.grade === 'C' ? 'Good' : res.grade === 'F' ? 'Fail' : 'Pass'}
                    </td>
                </tr>
            ))}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div className="flex justify-end mb-12">
        <div className="bg-slate-900 text-white p-4 rounded-lg w-48">
            <div className="flex justify-between mb-2">
                <span>Average:</span>
                <span className="font-bold">{average}%</span>
            </div>
            <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${average >= 40 ? 'text-green-400' : 'text-red-400'}`}>
                    {average >= 40 ? 'PROMOTED' : 'REPEATING'}
                </span>
            </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="grid grid-cols-2 gap-20 mt-auto">
        <div className="text-center">
            <div className="border-b border-black mb-2"></div>
            <p className="font-bold text-xs uppercase">Academic Officer</p>
        </div>
        <div className="text-center">
            <div className="border-b border-black mb-2"></div>
            <p className="font-bold text-xs uppercase">Registrar</p>
        </div>
      </div>
      
      <div className="text-center text-[10px] text-slate-400 mt-8">
        Generated electronically from MCAS Portal on {currentDate}. Valid without seal.
      </div>
    </div>
  );
});

export default ReportCard;