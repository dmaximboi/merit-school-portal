import React from 'react';

// Print-optimized Admission Letter - Single A4 page
const AdmissionLetter = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  return (
    <div
      ref={ref}
      className="bg-white font-serif text-black relative"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '12mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
        <img src="/meritlogo.jpg" className="w-[400px] grayscale" alt="" />
      </div>

      <div className="relative z-10 border-4 border-double border-blue-900 h-full p-6 flex flex-col">
        {/* Header - Matching FormPreview format */}
        <div className="flex items-center gap-4 border-b-2 border-blue-900 pb-4 mb-6">
          <img src="/meritlogo.jpg" alt="Merit College" className="w-20 h-20 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Merit College</h1>
            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">Of Advanced Studies</h2>
            <p className="text-[10px] font-bold mt-1 text-slate-500">KNOWLEDGE FOR ADVANCEMENT</p>
            <p className="text-[9px] text-slate-500">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State. | Tel: +234 816 698 5866</p>
          </div>
        </div>

        {/* Ref & Date */}
        <div className="flex justify-between items-end mb-6 text-sm">
          <div>
            <p><span className="font-bold">Ref:</span> <span className="text-blue-900">MCAS/ADM/{new Date().getFullYear()}/{student.student_id_text?.split('/').pop() || '000'}</span></p>
          </div>
          <div>
            <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold underline decoration-blue-900 decoration-2 underline-offset-4">PROVISIONAL ADMISSION LETTER</h2>
          <p className="text-sm font-bold mt-1 text-slate-600">{new Date().getFullYear()}/{new Date().getFullYear() + 1} ACADEMIC SESSION</p>
        </div>

        {/* Content */}
        <div className="text-justify leading-relaxed text-sm space-y-4 flex-1">
          <p>Dear <strong>{student.surname} {student.first_name}</strong>,</p>

          <p>
            Following your successful application, the Management of Merit College of Advanced Studies is pleased to offer you
            <strong> Provisional Admission</strong> into the <strong>{student.department || 'N/A'} Department</strong> for the
            <strong> {student.program_type || 'N/A'}</strong> programme.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-900 p-3 my-4">
            <p className="font-bold text-sm">Your Matriculation Number: <span className="text-lg ml-2 text-blue-900">{student.student_id_text}</span></p>
          </div>

          <p>This offer is subject to the ratification of your credentials and payment of all prescribed fees.</p>

          <div>
            <p className="font-bold underline mb-2">Conditions of Admission:</p>
            <ul className="list-disc ml-6 space-y-0.5 text-sm">
              <li>Acceptance of this offer implies readiness to abide by the school rules.</li>
              <li>All fees paid are non-refundable.</li>
              <li>You must maintain 75% class attendance.</li>
              <li>Original credentials must be submitted within 2 weeks of resumption.</li>
            </ul>
          </div>

          <p className="mt-4">
            Congratulations on your admission. We look forward to your academic success.
          </p>
        </div>

        {/* Signatures - Fixed at bottom */}
        <div className="mt-auto pt-6 flex justify-between items-end">
          <div className="text-center">
            <div className="border-b-2 border-slate-900 mb-1 w-40 mx-auto"></div>
            <p className="font-bold text-sm">Dr. Alaaya Opeyemi</p>
            <p className="text-[10px] uppercase font-bold text-slate-500">Registrar</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 border-4 border-double border-slate-300 rounded-full flex items-center justify-center mb-1 mx-auto rotate-[-12deg]">
              <span className="text-[8px] font-bold text-slate-300 text-center">OFFICIAL<br />STAMP</span>
            </div>
          </div>

          <div className="text-center">
            <div className="border-b-2 border-slate-900 mb-1 w-40 mx-auto"></div>
            <p className="font-bold text-sm">Management</p>
            <p className="text-[10px] uppercase font-bold text-slate-500">Merit College</p>
          </div>
        </div>
      </div>
    </div>
  );
});

AdmissionLetter.displayName = 'AdmissionLetter';
export default AdmissionLetter;
