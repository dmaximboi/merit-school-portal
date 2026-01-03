import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Plus, Play, User, Award } from 'lucide-react';
// ... import api ...

const QuizCard = ({ result, studentName }) => {
  // This is the downloadable card component
  return (
    <div id="quiz-result-card" className="bg-gradient-to-br from-blue-900 to-slate-900 p-8 text-white w-[400px] text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
      
      <img src="/meritlogo.jpg" className="w-16 h-16 mx-auto rounded-full border-4 border-white mb-4 bg-white object-contain"/>
      <h2 className="font-bold text-xl tracking-widest uppercase mb-1">Merit College</h2>
      <p className="text-xs text-blue-200 tracking-[0.3em] mb-6">QUIZ CERTIFICATE</p>
      
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 mb-6">
        <p className="text-slate-300 text-sm mb-2">Presented to</p>
        <h1 className="text-2xl font-black text-yellow-400 font-serif mb-4">{studentName}</h1>
        <div className="flex justify-center gap-8 border-t border-white/10 pt-4">
           <div>
             <span className="block text-3xl font-bold">{result.score}</span>
             <span className="text-[10px] uppercase text-slate-400">Score</span>
           </div>
           <div>
             <span className="block text-3xl font-bold">{result.total}</span>
             <span className="text-[10px] uppercase text-slate-400">Total</span>
           </div>
           <div>
             <span className="block text-3xl font-bold">{Math.round((result.score/result.total)*100)}%</span>
             <span className="text-[10px] uppercase text-slate-400">Grade</span>
           </div>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-500">Verified by Merit Portal System • {new Date().toLocaleDateString()}</p>
    </div>
  );
};
