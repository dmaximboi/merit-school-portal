import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, Home, RotateCcw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

const CbtResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        score = 0,
        correctCount = 0,
        totalQuestions = 0,
        answers = {},
        questions = [],
        subjects = []
    } = location.state || {};

    const [showSolutions, setShowSolutions] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const getGrade = (score) => {
        if (score >= 80) return { grade: 'A', color: 'text-green-700', bgColor: 'bg-green-100', message: 'Excellent!' };
        if (score >= 70) return { grade: 'B', color: 'text-blue-700', bgColor: 'bg-blue-100', message: 'Very Good!' };
        if (score >= 60) return { grade: 'C', color: 'text-yellow-700', bgColor: 'bg-yellow-100', message: 'Good!' };
        if (score >= 50) return { grade: 'D', color: 'text-orange-700', bgColor: 'bg-orange-100', message: 'Fair' };
        return { grade: 'F', color: 'text-red-700', bgColor: 'bg-red-100', message: 'Keep Practicing' };
    };

    const gradeInfo = getGrade(score);

    const subjectBreakdown = subjects.map(subject => {
        const subjectQuestions = questions.filter(q => q.subjectName === subject);
        const subjectCorrect = subjectQuestions.filter((q) => {
            const globalIdx = questions.indexOf(q);
            return answers[globalIdx] === q.correct_option;
        }).length;

        return {
            name: subject,
            correct: subjectCorrect,
            total: subjectQuestions.length,
            percentage: Math.round((subjectCorrect / subjectQuestions.length) * 100)
        };
    });

    const getOptionText = (option, index) => {
        if (!option) return String.fromCharCode(65 + index);
        if (typeof option === 'string') return option;
        if (typeof option === 'object' && option.text) return option.text;
        return String(option);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className={`inline-block ${gradeInfo.bgColor} p-4 rounded-full mb-3`}>
                        <Trophy size={48} className={gradeInfo.color} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Exam Complete!</h1>
                    <p className="text-lg text-gray-600">{gradeInfo.message}</p>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded border border-gray-200 p-6 mb-6">
                    <div className="text-center mb-6">
                        <div className={`text-6xl font-bold ${gradeInfo.color} mb-2`}>
                            {score}%
                        </div>
                        <div className={`text-2xl font-bold ${gradeInfo.color}`}>
                            Grade: {gradeInfo.grade}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                            <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-green-700">{correctCount}</p>
                            <p className="text-xs text-green-600">Correct</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded border border-red-200">
                            <XCircle size={24} className="text-red-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-red-700">{totalQuestions - correctCount}</p>
                            <p className="text-xs text-red-600">Incorrect</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
                            <Trophy size={24} className="text-blue-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-blue-700">{totalQuestions}</p>
                            <p className="text-xs text-blue-600">Total</p>
                        </div>
                    </div>

                    {/* Subject Breakdown */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Subject Performance</h3>
                        <div className="space-y-3">
                            {subjectBreakdown.map(subject => (
                                <div key={subject.name} className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-700">{subject.name}</span>
                                        <span className="text-sm font-bold text-gray-600">
                                            {subject.correct}/{subject.total} ({subject.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded h-2">
                                        <div
                                            className={`h-2 rounded ${subject.percentage >= 70 ? 'bg-green-600' :
                                                    subject.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${subject.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Solutions Section */}
                <div className="bg-white rounded border border-gray-200 p-4 mb-6">
                    <button
                        onClick={() => setShowSolutions(!showSolutions)}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="text-blue-700" size={20} />
                            <span className="font-bold text-gray-800">View Solutions & Explanations</span>
                        </div>
                        {showSolutions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showSolutions && (
                        <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {questions.map((q, idx) => {
                                const userAnswer = answers[idx];
                                const isCorrect = userAnswer === q.correct_option;
                                const isExpanded = expandedQuestion === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <div
                                            className="flex items-start justify-between cursor-pointer"
                                            onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-gray-500">Q{idx + 1}</span>
                                                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{q.subjectName}</span>
                                                    {isCorrect ? (
                                                        <CheckCircle size={16} className="text-green-600" />
                                                    ) : (
                                                        <XCircle size={16} className="text-red-600" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2">{q.question_text}</p>
                                            </div>
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                {/* Options */}
                                                <div className="space-y-1 mb-3">
                                                    {q.options?.map((option, optIdx) => {
                                                        const isCorrectOption = optIdx === q.correct_option;
                                                        const isUserChoice = optIdx === userAnswer;

                                                        return (
                                                            <div
                                                                key={optIdx}
                                                                className={`p-2 rounded text-sm ${isCorrectOption
                                                                        ? 'bg-green-100 border border-green-300 font-medium'
                                                                        : isUserChoice && !isCorrectOption
                                                                            ? 'bg-red-100 border border-red-300'
                                                                            : 'bg-white border border-gray-200'
                                                                    }`}
                                                            >
                                                                <span className="font-bold mr-2">
                                                                    {String.fromCharCode(65 + optIdx)}.
                                                                </span>
                                                                {getOptionText(option, optIdx)}
                                                                {isCorrectOption && (
                                                                    <span className="ml-2 text-green-700 text-xs font-bold">✓ Correct</span>
                                                                )}
                                                                {isUserChoice && !isCorrectOption && (
                                                                    <span className="ml-2 text-red-700 text-xs font-bold">✗ Your answer</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation/Solution */}
                                                {q.explanation || q.solution ? (
                                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                        <p className="text-xs font-bold text-blue-800 mb-1">EXPLANATION:</p>
                                                        <p className="text-sm text-gray-700">
                                                            {q.explanation || q.solution}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                        <p className="text-xs text-gray-500">
                                                            The correct answer is <strong>{String.fromCharCode(65 + q.correct_option)}</strong>: {getOptionText(q.options?.[q.correct_option], q.correct_option)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/student/cbt')}
                        className="flex-1 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={18} /> Take Another Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CbtResult;
