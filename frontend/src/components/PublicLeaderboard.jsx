import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, ChevronDown, ChevronUp, User, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const PublicLeaderboard = ({ filterStudentId = null }) => {
    const { token } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        fetchLeaderboard();
        fetchQuizzes();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/students/quiz/leaderboard', token);
            let data = res || [];

            // If parent view, filter to only show their student
            if (filterStudentId) {
                data = data.filter(entry => entry.student_id === filterStudentId);
            }

            setLeaderboard(data);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const res = await api.get('/students/quiz/public', token);
            setQuizzes(res || []);
        } catch (err) {
            console.error('Failed to fetch quizzes:', err);
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Trophy className="text-yellow-500" size={24} />;
            case 2: return <Medal className="text-slate-400" size={24} />;
            case 3: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="font-bold text-slate-500">#{rank}</span>;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
            case 2: return 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300';
            case 3: return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
            default: return 'bg-white border-slate-200';
        }
    };

    const displayData = expanded ? leaderboard : leaderboard.slice(0, 10);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <p className="text-center text-slate-500">Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trophy size={32} />
                        <div>
                            <h3 className="text-2xl font-black">Quiz Leaderboard</h3>
                            <p className="text-blue-200 text-sm">
                                {filterStudentId ? 'Your Performance' : 'Top Performers'}
                            </p>
                        </div>
                    </div>
                    <select
                        value={selectedQuiz || ''}
                        onChange={(e) => setSelectedQuiz(e.target.value || null)}
                        className="bg-white/20 text-white border-0 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">All Quizzes</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="divide-y divide-slate-100">
                {displayData.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No quiz results yet. Be the first to take a quiz!
                    </div>
                ) : (
                    displayData.map((entry, idx) => (
                        <div
                            key={entry.id || idx}
                            className={`flex items-center gap-4 p-4 ${getRankColor(idx + 1)} border-l-4`}
                        >
                            <div className="w-10 flex justify-center">
                                {getRankIcon(idx + 1)}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800">{entry.student_name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>{entry.quiz_title}</span>
                                    <span>•</span>
                                    <Calendar size={12} />
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-2xl font-black ${entry.score >= 80 ? 'text-green-600' :
                                    entry.score >= 60 ? 'text-blue-600' :
                                        entry.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {entry.score}%
                                </p>
                                <p className="text-xs text-slate-500">
                                    {entry.correct}/{entry.total}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Show More/Less */}
            {leaderboard.length > 10 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-3 text-center text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={18} />
                            Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown size={18} />
                            Show All ({leaderboard.length})
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default PublicLeaderboard;
