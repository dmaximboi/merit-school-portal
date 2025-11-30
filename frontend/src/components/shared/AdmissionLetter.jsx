import React, { forwardRef } from 'react';

const AdmissionLetter = forwardRef(({ student }, ref) => {
  // FIX: ERROR HAPPENS HERE. 
  // Old code returned 'null', which breaks the printer.
  // New code returns a hidden div so the ref is always attached.
  if (!student) {
    return <div ref={ref} style={{ display: 'none' }}></div>;
  }

  const fee = student.program_type === 'O-Level' ? '10,000' : '27,500';
  const currentDate = new Date().toLocaleDateString();

  // Helper to ensure we don't break if a field is missing
  const s = student || {};

  return (
    <div ref={ref} className="p-10 font-serif text-black bg-white" style={{ minHeight: '297mm', width: '210mm' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b-2 border-blue-900 pb-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
           {/* Ensure logo exists in public folder or use placeholder */}
           <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
        </div>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
          <p className="text-xs font-bold text-gray-600">Affiliated to ABUZARIA, UNILORIN, KWASU & Crown Hill University</p>
        </div>
      </div>

      <h2 className="text-center text-xl font-bold underline mb-6 uppercase">Provisional Admission Letter</h2>

      <div className="text-sm leading-relaxed space-y-4">
        <p>
          Dear <strong>{s.surname} {s.first_name}</strong>,
        </p>
        <p>
          We are pleased to inform you that you have been offered provisional admission into the 
          <strong> {s.program_type || 'Academic'}</strong> programme at Merit College of Advanced Studies 
          for the <strong>2025/2026 Academic Session</strong>.
        </p>
        <p>
          Your Student ID is: <strong className="text-blue-900">{s.student_id_text || 'PENDING'}</strong>
        </p>

        <div className="my-6">
          <p className="font-bold underline mb-2">Admission Conditions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Submission of valid O-Level results (WAEC/NECO).</li>
            <li>Payment of Acceptance/Form Fee of <strong>₦{fee}</strong>.</li>
            <li>Strict adherence to the college code of conduct.</li>
          </ul>
        </div>

        <div className="bg-gray-50 border-l-4 border-blue-900 p-4 my-6">
          <p className="font-bold">Payment Details:</p>
          <p>Bank: MoniePoint MFB</p>
          <p>Account Name: Merit College of Advanced Studies</p>
          <p>Account Number: 8166985866</p>
        </div>

        <p className="text-center font-bold mt-8">Congratulations!</p>

        <div className="mt-16 flex justify-between items-end">
          <div>{currentDate}</div>
          <div className="text-center">
            <div className="border-b border-black w-40 mb-2"></div>
            <p className="font-bold">Registrar</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdmissionLetter;