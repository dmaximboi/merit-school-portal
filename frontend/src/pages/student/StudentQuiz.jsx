import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  Play, Plus, History, Trophy, Clock, User, CheckCircle,
  X, HelpCircle, Loader2, Award, FileText, Download, AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import QuizCard, { TemplateSelector } from '../../components/quiz/QuizCard';
import QuizLimitBanner from '../../components/QuizLimitBanner';
import PublicLeaderboard from '../../components/PublicLeaderboard';

const StudentQuiz = () => {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('public'); // public, host, history
  const [loading, setLoading] = useState(false);

  // DATA
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);

  // HOSTING FORM
  const [hostForm, setHostForm] = useState({
    title: '', subject: '', description: '', questions: []
  });

  // QUIZ TAKING
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // QUIZ LIMITS & TEMPLATE
  const [quizLimits, setQuizLimits] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  useEffect(() => {
    if (activeTab === 'public') fetchPublicQuizzes();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchPublicQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/quiz/public', token);
      setQuizzes(res || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/quiz/history', token);
      setHistory(res || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleHostSubmit = async () => {
    // Validate
    if (!hostForm.title || hostForm.questions.length < 5) return alert("Title required & Min 5 questions.");

    try {
      await api.post('/students/quiz/create', hostForm, token);
      alert("Quiz Created Successfully! It's now live.");
      setHostForm({ title: '', subject: '', description: '', questions: [] });
      setActiveTab('history');
    } catch (err) { alert("Failed to create quiz"); }
  };

  const addQuestionToHost = () => {
    if (hostForm.questions.length >= 20) return alert("Max 20 questions allowed.");
    setHostForm({
      ...hostForm,
      questions: [
        ...hostForm.questions,
        { question_text: '', options: ['', '', '', ''], correct_option: 0, explanation: '' }
      ]
    });
  };

  const updateQuestion = (idx, field, val) => {
    const qs = [...hostForm.questions];
    qs[idx] = { ...qs[idx], [field]: val };
    setHostForm({ ...hostForm, questions: qs });
  };

  const updateOption = (qIdx, oIdx, val) => {
    const qs = [...hostForm.questions];
    const opts = [...qs[qIdx].options];
    opts[oIdx] = val;
    qs[qIdx].options = opts;
    setHostForm({ ...hostForm, questions: qs });
  };

  // --- TAKING QUIZ ---
  const startQuiz = (q) => {
    setActiveQuiz(q);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    // Defensive check: ensure questions exists and is an array
    if (!activeQuiz.questions || !Array.isArray(activeQuiz.questions)) {
      alert("Quiz data is invalid. Please try again.");
      setActiveQuiz(null);
      return;
    }

    // Calculate local score
    let score = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_option) score++;
    });

    try {
      await api.post('/students/quiz/attempt', {
        quiz_id: activeQuiz.id,
        score: score,
        total: activeQuiz.questions.length,
        answers: quizAnswers
      }, token);
      setQuizResult({ score, total: activeQuiz.questions.length });
    } catch (err) { alert("Failed to submit result"); }
  };

  // --- QUIZ CARD COMPONENT ---
  const QuizCard = ({ quiz, compact }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
        <Trophy size={64} className="text-yellow-500" />
      </div>
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded-md">{quiz.subject || 'General'}</span>
      </div>
      <h3 className="font-bold text-xl text-slate-900 mb-2">{quiz.title}</h3>
      <p className="text-sm text-slate-500 mb-6 line-clamp-2">{quiz.description}</p>

      {!compact && (
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <User size={14} /> {quiz.creator_name || 'Admin'}
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <HelpCircle size={14} /> {quiz.question_count || quiz.questions?.length} Qs
          </div>
          <button onClick={() => startQuiz(quiz)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-900 transition flex items-center gap-2">
            Start <Play size={12} fill="white" />
          </button>
        </div>
      )}
    </div>
  );

  // --- RENDER ---
  if (activeQuiz) {
    if (quizResult) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center">
          <Award size={64} className="mx-auto text-yellow-500 mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 mb-8">You scored <span className="text-blue-600 font-bold text-2xl">{quizResult.score}</span> / {quizResult.total}</p>
          <button onClick={() => setActiveQuiz(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Return to Hub</button>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setActiveQuiz(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold text-sm"><X size={16} /> Quit Quiz</button>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">{activeQuiz.title}</h1>
            <div className="space-y-8">
              {activeQuiz.questions && Array.isArray(activeQuiz.questions) ? activeQuiz.questions.map((q, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-lg text-slate-800 mb-4">{idx + 1}. {q.question_text}</p>
                  <div className="grid gap-3">
                    {q.options && q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: oIdx })}
                        className={`w-full text-left p-4 rounded-xl text-sm font-medium transition flex items-center gap-3 ${quizAnswers[idx] === oIdx
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                      >
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${quizAnswers[idx] === oIdx ? 'border-white text-white' : 'border-slate-300'}`}>{String.fromCharCode(65 + oIdx)}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-red-500">
                  <p className="font-bold">Error: Quiz questions are not available.</p>
                  <button onClick={() => setActiveQuiz(null)} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">
                    Return to Quiz Hub
                  </button>
                </div>
              )}
            </div>
            <button onClick={submitQuiz} className="w-full mt-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg transition">Submit Answers</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3"><Play fill="white" /> Quiz Hub</h1>
            <p className="text-indigo-100 font-medium max-w-lg">Competitions, Practice Tests, and Hosted Challenges. Join a game or host your own.</p>
          </div>
          <Trophy className="absolute right-0 bottom-0 text-white/10 w-64 h-64 -mr-10 -mb-10" />
        </div>

        {/* TABS */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {['public', 'host', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-bold text-sm capitalize whitespace-nowrap transition ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
            >
              {tab === 'public' ? 'Public Quizzes' : tab === 'host' ? 'Host New Quiz' : 'My History'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === 'public' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quiz Limit Banner */}
            <QuizLimitBanner onUpdate={() => fetchPublicQuizzes()} />

            {/* Quizzes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? <p className="col-span-3 text-center py-10 text-slate-400">Loading Quizzes...</p> :
                quizzes.length === 0 ? <div className="col-span-3 text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">No active quizzes found. Be the first to host one!</div> :
                  quizzes.map(q => <QuizCard key={q.id} quiz={q} />)
              }
            </div>

            {/* Public Leaderboard */}
            <PublicLeaderboard />
          </div>
        )}

        {activeTab === 'host' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-fadeIn max-w-4xl mx-auto">
            <h2 className="font-bold text-xl mb-6 border-b pb-4">Create New Quiz</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input className="input-field" placeholder="Quiz Title" value={hostForm.title} onChange={e => setHostForm({ ...hostForm, title: e.target.value })} />
              <input className="input-field" placeholder="Subject / Category" value={hostForm.subject} onChange={e => setHostForm({ ...hostForm, subject: e.target.value })} />
            </div>
            <textarea className="input-field w-full h-24 mb-6" placeholder="Description..." value={hostForm.description} onChange={e => setHostForm({ ...hostForm, description: e.target.value })}></textarea>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Questions ({hostForm.questions.length}/20)</h3>
                <button onClick={addQuestionToHost} className="text-blue-600 text-sm font-bold hover:underline">+ Add Question</button>
              </div>
              {hostForm.questions.map((q, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
                  <span className="absolute top-4 left-4 bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded text-xs">Q{idx + 1}</span>
                  <input className="input-field w-full mb-4 pl-12" placeholder="Question Text" value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {q.options.map((opt, oIdx) => (
                      <input key={oIdx} className="input-field text-sm" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} />
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <select className="input-field w-40 text-sm" value={q.correct_option} onChange={e => updateQuestion(idx, 'correct_option', parseInt(e.target.value))}>
                      <option value={0}>Correct: A</option><option value={1}>Correct: B</option><option value={2}>Correct: C</option><option value={3}>Correct: D</option>
                    </select>
                    <input className="input-field flex-1 text-sm" placeholder="Explanation (Optional)" value={q.explanation} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleHostSubmit} className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold hover:shadow-lg transition">Publish Quiz</button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            {history.length === 0 ? <div className="p-10 text-center text-slate-400">No history available.</div> :
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr><th className="p-5">Quiz</th><th className="p-5">Score</th><th className="p-5">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="p-5 font-bold">{h.quiz_title || 'Unknown Quiz'}</td>
                      <td className="p-5 font-mono"><span className="text-blue-600 font-bold">{h.score}</span> / {h.total_questions}</td>
                      <td className="p-5 text-slate-400">{new Date(h.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuiz;
