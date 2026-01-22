import React from 'react';

// Print-optimized Form Preview - Designed to fit on a single A4 page
const FormPreview = ({ formData }) => (
  <div
    className="text-xs leading-tight text-black bg-white"
    style={{
      fontFamily: 'Times New Roman, serif',
      width: '210mm',
      minHeight: '270mm',
      maxHeight: '297mm',
      padding: '10mm',
      boxSizing: 'border-box'
    }}
  >
    {/* Header - Matching AdmissionLetter format */}
    <div className="flex items-center gap-3 border-b-2 border-blue-900 pb-3 mb-4">
      <img src="/meritlogo.jpg" alt="Merit College" className="w-16 h-16 object-contain" />
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Merit College</h1>
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-widest">Of Advanced Studies</h2>
        <p className="text-[9px] font-bold mt-1 text-slate-500">KNOWLEDGE FOR ADVANCEMENT</p>
        <p className="text-[8px] text-slate-500">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State. | Tel: +234 816 698 5866</p>
      </div>
    </div>

    <h2 className="text-center font-bold text-sm underline mb-3 uppercase">
      Student Registration Form ({new Date().getFullYear()}/{new Date().getFullYear() + 1})
    </h2>

    {/* Section A: Personal Bio-Data */}
    <div className="mb-3 border border-slate-600">
      <h3 className="font-bold text-[10px] bg-slate-200 px-2 py-1 border-b border-slate-600 uppercase">A. Personal Bio-Data</h3>
      <div className="p-2 flex gap-3">
        {/* Photo */}
        <div className="w-24 h-28 bg-slate-100 border border-slate-400 flex-shrink-0">
          {formData.photoPreview ? (
            <img
              src={formData.photoPreview}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100?text=Photo'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500">NO PHOTO</div>
          )}
        </div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div className="col-span-2 border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Full Name: </span>
            <span className="uppercase">{formData.surname} {formData.middleName} {formData.lastName}</span>
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Gender: </span>{formData.gender}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">DOB: </span>{formData.dateOfBirth}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">State: </span>{formData.stateOfOrigin}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">LGA: </span>{formData.lga}
          </div>
          <div className="col-span-2 border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Address: </span>{formData.permanentAddress}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Phone: </span>{formData.studentPhone}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Parent Ph: </span>{formData.parentsPhone}
          </div>
          <div className="col-span-2 border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Email: </span>{formData.email}
          </div>
        </div>
      </div>
    </div>

    {/* Section B: Academic Information */}
    <div className="mb-3 border border-slate-600">
      <h3 className="font-bold text-[10px] bg-slate-200 px-2 py-1 border-b border-slate-600 uppercase">B. Academic Information</h3>
      <div className="p-2 text-[10px]">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Programme: </span>{formData.programme}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-0.5">
            <span className="font-bold">Department: </span>{formData.department}
          </div>
          {formData.programme === 'A-Level' && (
            <>
              <div className="border-b border-dotted border-slate-400 pb-0.5">
                <span className="font-bold">University: </span>{formData.university}
              </div>
              <div className="border-b border-dotted border-slate-400 pb-0.5">
                <span className="font-bold">Course: </span>{formData.course}
              </div>
            </>
          )}
        </div>

        <div>
          <span className="font-bold underline">Registered Subjects:</span>
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 mt-1">
            {formData.subjects && formData.subjects.map((sub, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px]">
                <span className="font-bold">[✓]</span>
                <span className="uppercase">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Section C: Declaration */}
    <div className="border border-slate-600">
      <h3 className="font-bold text-[10px] bg-slate-200 px-2 py-1 border-b border-slate-600 uppercase">C. Declaration & Attestation</h3>
      <div className="p-2 text-[10px]">
        <p className="text-justify leading-snug mb-4">
          I, <strong>{formData.surname} {formData.middleName} {formData.lastName}</strong>, hereby solemnly declare that all the information provided in this form is true, correct, and complete. I understand that any false information may lead to the cancellation of my admission. I agree to abide by all the rules, regulations, and code of conduct of Merit College of Advanced Studies.
        </p>

        <div className="flex justify-between items-end px-4 mt-6">
          <div className="text-center">
            <div className="text-lg text-blue-900 border-b border-black min-w-[150px] pb-0.5" style={{ fontFamily: 'Brush Script MT, cursive' }}>
              {formData.signature || '_______________'}
            </div>
            <p className="text-[8px] font-bold uppercase tracking-wide mt-1">Applicant Signature</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 border-2 border-double border-slate-300 rounded-full flex items-center justify-center">
              <span className="text-[6px] font-bold text-slate-300 text-center">OFFICIAL<br />STAMP</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg text-blue-900 border-b border-black min-w-[150px] pb-0.5" style={{ fontFamily: 'Brush Script MT, cursive' }}>
              Dr. Alaaya
            </div>
            <p className="text-[8px] font-bold uppercase tracking-wide mt-1">Registrar</p>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="text-center text-[7px] mt-3 text-slate-400 border-t border-slate-200 pt-1">
      Printed on {new Date().toLocaleString()} • Merit College Portal • Ref: MCAS/REG/{new Date().getFullYear()}/{Math.random().toString(36).substr(2, 6).toUpperCase()}
    </div>
  </div>
);

export default FormPreview;
