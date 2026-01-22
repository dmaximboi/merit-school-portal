import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Clock, ChevronLeft, ChevronRight, Flag, CheckCircle,
    Calculator as CalcIcon, Edit3
} from 'lucide-react';
import Calculator from './components/Calculator';
import Whiteboard from './components/Whiteboard';

const CbtExam = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { questions = [], studentName = '', totalTime = 60, subjects = [] } = location.state || {};

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(totalTime * 60);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const timerRef = useRef(null);

    useEffect(() => {
        if (questions.length === 0) {
            navigate('/student/cbt');
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (optionIndex) => {
        setAnswers({ ...answers, [currentIndex]: optionIndex });
    };

    const toggleFlag = () => {
        const newFlagged = new Set(flagged);
        if (newFlagged.has(currentIndex)) {
            newFlagged.delete(currentIndex);
        } else {
            newFlagged.add(currentIndex);
        }
        setFlagged(newFlagged);
    };

    const getQuestionStatus = (index) => {
        if (index === currentIndex) return 'current';
        if (flagged.has(index)) return 'flagged';
        if (answers[index] !== undefined) return 'answered';
        return 'unanswered';
    };

    const handleSubmit = () => {
        clearInterval(timerRef.current);

        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_option) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / questions.length) * 100);

        navigate('/student/cbt/result', {
            state: {
                score,
                correctCount,
                totalQuestions: questions.length,
                answers,
                questions,
                subjects
            }
        });
    };

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    // Parse question text - handles latex, html, etc.
    const renderQuestionText = (text) => {
        if (!text) return '';
        // Clean up common formatting issues
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
            .replace(/<br\s*\/?>/gi, '\n');
    };

    // Parse option text
    const getOptionText = (option, index) => {
        if (!option) return String.fromCharCode(65 + index); // Fallback to A, B, C, D
        if (typeof option === 'string') return option;
        if (typeof option === 'object' && option.text) return option.text;
        return String(option);
    };

    if (showReview) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-3xl mx-auto bg-white rounded border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your Answers</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded border border-green-200">
                            <p className="text-sm text-green-700 mb-1">Answered</p>
                            <p className="text-3xl font-bold text-green-700">{answeredCount}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded border border-red-200">
                            <p className="text-sm text-red-700 mb-1">Unanswered</p>
                            <p className="text-3xl font-bold text-red-700">{unansweredCount}</p>
                        </div>
                    </div>

                    {subjects.map(subject => {
                        const subjectQuestions = questions.filter(q => q.subjectName === subject);
                        const subjectAnswered = subjectQuestions.filter((q) =>
                            answers[questions.indexOf(q)] !== undefined
                        ).length;

                        return (
                            <div key={subject} className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                                <h3 className="font-bold text-gray-800">{subject}</h3>
                                <p className="text-sm text-gray-600">
                                    Answered: {subjectAnswered}/{subjectQuestions.length}
                                </p>
                            </div>
                        );
                    })}

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowReview(false)}
                            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300"
                        >
                            Continue Exam
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
                        >
                            Submit Answers
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Top Bar - Simple */}
            <div className="bg-blue-800 text-white p-3 shadow">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Merit College CBT</h1>
                        <p className="text-xs text-blue-200">{studentName}</p>
                    </div>

                    <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : ''}`}>
                        <Clock className="inline mr-1" size={22} />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={() => setShowReview(true)}
                        className="px-4 py-2 bg-white text-blue-800 rounded font-bold text-sm hover:bg-gray-100"
                    >
                        Review & Submit
                    </button>
                </div>
            </div>

            {/* Subject Tabs */}
            <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
                <div className="max-w-7xl mx-auto flex gap-2 py-2">
                    {subjects.map(subject => {
                        const subjectQuestions = questions.filter(q => q.subjectName === subject);
                        const subjectAnswered = subjectQuestions.filter((q) =>
                            answers[questions.indexOf(q)] !== undefined
                        ).length;

                        return (
                            <button
                                key={subject}
                                onClick={() => {
                                    const firstIndex = questions.findIndex(q => q.subjectName === subject);
                                    setCurrentIndex(firstIndex);
                                }}
                                className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap ${currentQuestion?.subjectName === subject
                                        ? 'bg-blue-700 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {subject} ({subjectAnswered}/{subjectQuestions.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-gray-600">
                                    Question {currentIndex + 1} of {questions.length}
                                </h2>
                                <button
                                    onClick={toggleFlag}
                                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${flagged.has(currentIndex)
                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}
                                >
                                    <Flag size={14} />
                                    {flagged.has(currentIndex) ? 'Flagged' : 'Flag'}
                                </button>
                            </div>

                            {/* Question Text */}
                            <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {renderQuestionText(currentQuestion?.question_text)}
                                </p>
                            </div>

                            {/* Options - Fixed to show actual text */}
                            <div className="space-y-2">
                                {currentQuestion?.options?.map((option, idx) => {
                                    const optionText = getOptionText(option, idx);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={`w-full p-3 text-left rounded border transition ${answers[currentIndex] === idx
                                                    ? 'bg-blue-50 border-blue-500'
                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <span className="font-bold text-blue-700 mr-2">
                                                {String.fromCharCode(65 + idx)}.
                                            </span>
                                            <span className="text-gray-700">{optionText}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setAnswers({ ...answers, [currentIndex]: undefined })}
                                className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium hover:bg-gray-200"
                            >
                                Clear Answer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tools Sidebar */}
                <div className="w-12 bg-gray-800 flex flex-col items-center py-4 gap-3">
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className={`p-2 rounded ${showCalculator ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        title="Calculator"
                    >
                        <CalcIcon size={20} className="text-white" />
                    </button>
                    <button
                        onClick={() => setShowWhiteboard(!showWhiteboard)}
                        className={`p-2 rounded ${showWhiteboard ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        title="Whiteboard"
                    >
                        <Edit3 size={20} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-white border-t border-gray-200 p-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                        <ChevronLeft size={18} /> Prev
                    </button>

                    <div className="flex-1 flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
                        {questions.map((_, idx) => {
                            const status = getQuestionStatus(idx);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-8 h-8 rounded text-xs font-bold ${status === 'current' ? 'bg-blue-700 text-white ring-2 ring-blue-300' :
                                            status === 'answered' ? 'bg-green-600 text-white' :
                                                status === 'flagged' ? 'bg-yellow-400 text-gray-900' :
                                                    'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Calculator Modal */}
            {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}

            {/* Whiteboard Modal */}
            {showWhiteboard && <Whiteboard onClose={() => setShowWhiteboard(false)} />}
        </div>
    );
};

export default CbtExam;
