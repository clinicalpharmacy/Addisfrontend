import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';

const ExamModule = ({ examId, examTitle, examSubject, onBack }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // API State
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (examId) {
            fetchQuestions();
        }
    }, [examId]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/exams/${examId}/take`);
            if (response.success) {
                setQuestions(response.questions || []);
            }
        } catch (err) {
            console.error('Failed to fetch exam questions:', err);
            setError('Failed to load exam questions. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionId) => {
        if (isSubmitted || selectedAnswers[questionId]) return; // Prevent changing answer once selected
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: optionId
        });
    };

    const handleSubmit = () => {
        if (Object.keys(selectedAnswers).length < questions.length) {
            if (!window.confirm("You have unanswered questions. Are you sure you want to submit?")) {
                return;
            }
        }
        setIsSubmitted(true);
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach(q => {
            const selectedOptionId = selectedAnswers[q.id];
            const correctOption = q.options.find(o => o.isCorrect);
            if (selectedOptionId === correctOption.id) {
                score += 1;
            }
        });
        return score;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center animate-fadeIn flex flex-col items-center justify-center min-h-[400px]">
                <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Loading Exam...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-fadeIn">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back to Exams
                </button>
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-6 font-medium">
                    {error}
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-fadeIn">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back to Exams
                </button>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{examTitle || `${examSubject} Exam`}</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-600">No questions available for this exam yet. Please check back later.</p>
                </div>
            </div>
        );
    }

    const score = isSubmitted ? calculateScore() : 0;
    const percentage = ((score / questions.length) * 100).toFixed(1);

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fadeIn max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back
                </button>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">{examTitle || examSubject}</h3>
                <div className="text-sm font-bold text-gray-500">
                    {isSubmitted ? 'Completed' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                </div>
            </div>

            {isSubmitted ? (
                <div className="text-center py-8 animate-fadeIn">
                    <div className="mb-8">
                        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-8 mb-4 ${
                            percentage >= 70 ? 'border-green-500 text-green-500' : 'border-amber-500 text-amber-500'
                        }`}>
                            <span className="text-4xl font-black">{percentage}%</span>
                        </div>
                        <h4 className="text-2xl font-bold text-gray-800 mb-2">
                            {percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}
                        </h4>
                        <p className="text-gray-600">You scored {score} out of {questions.length} questions correctly.</p>
                    </div>

                    <div className="space-y-6 text-left">
                        <h5 className="text-xl font-bold text-gray-800 border-b pb-2">Review Answers</h5>
                        {questions.map((q, index) => {
                            const selectedOptionId = selectedAnswers[q.id];
                            const correctOption = q.options.find(o => o.isCorrect);
                            const isCorrect = selectedOptionId === correctOption.id;

                            return (
                                <div key={q.id} className={`p-5 rounded-xl border ${
                                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                    <div className="flex gap-3 mb-3">
                                        <div className="mt-1">
                                            {isCorrect ? 
                                                <FaCheckCircle className="text-green-500 text-xl" /> : 
                                                <FaTimesCircle className="text-red-500 text-xl" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{index + 1}. {q.questionText}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="ml-8 space-y-2 mb-4">
                                        {q.options.map(opt => (
                                            <div key={opt.id} className={`p-3 rounded-lg text-sm flex justify-between items-center ${
                                                opt.isCorrect 
                                                    ? 'bg-green-100 text-green-800 font-bold border border-green-300' 
                                                    : selectedOptionId === opt.id 
                                                        ? 'bg-red-100 text-red-800 font-bold border border-red-300' 
                                                        : 'bg-white border border-gray-200 text-gray-600'
                                            }`}>
                                                <span>{opt.text}</span>
                                                {opt.isCorrect && <span className="text-xs uppercase tracking-wider text-green-700 bg-green-200 px-2 py-1 rounded">Correct</span>}
                                                {selectedOptionId === opt.id && !opt.isCorrect && <span className="text-xs uppercase tracking-wider text-red-700 bg-red-200 px-2 py-1 rounded">Your Answer</span>}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="ml-8 p-3 bg-white/60 rounded-lg border border-gray-200 text-sm">
                                        <span className="font-bold text-gray-700 mr-2">Explanation:</span>
                                        <span className="text-gray-600">{q.explanation}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="mb-6">
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 leading-relaxed">
                            {currentQuestionIndex + 1}. {questions[currentQuestionIndex].questionText}
                        </h4>
                    </div>

                    <div className="space-y-2">
                        {questions[currentQuestionIndex].options.map(option => {
                            const hasAnswered = !!selectedAnswers[questions[currentQuestionIndex].id];
                            const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === option.id;
                            
                            let buttonStyle = 'border-gray-200 hover:border-blue-300 hover:bg-gray-50';
                            let dotStyle = 'border-gray-300';
                            let textStyle = 'text-gray-700 font-medium';
                            
                            if (hasAnswered) {
                                if (option.isCorrect) {
                                    buttonStyle = 'border-green-500 bg-green-50 shadow-sm';
                                    dotStyle = 'border-green-500 bg-green-500';
                                    textStyle = 'font-bold text-green-900';
                                } else if (isSelected) {
                                    buttonStyle = 'border-red-500 bg-red-50 shadow-sm';
                                    dotStyle = 'border-red-500 bg-red-500';
                                    textStyle = 'font-bold text-red-900';
                                } else {
                                    buttonStyle = 'border-gray-200 opacity-60';
                                    dotStyle = 'border-gray-200';
                                    textStyle = 'text-gray-500';
                                }
                            }

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(questions[currentQuestionIndex].id, option.id)}
                                    disabled={hasAnswered}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${buttonStyle}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${dotStyle}`}>
                                                {hasAnswered && (option.isCorrect || isSelected) && (
                                                    <div className="text-white text-xs">
                                                        {option.isCorrect ? '✓' : '✗'}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-base ${textStyle}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                        {hasAnswered && option.isCorrect && (
                                            <span className="text-xs uppercase tracking-wider text-green-700 bg-green-200 px-2 py-1 rounded font-bold">
                                                Correct Answer
                                            </span>
                                        )}
                                        {hasAnswered && isSelected && !option.isCorrect && (
                                            <span className="text-xs uppercase tracking-wider text-red-700 bg-red-200 px-2 py-1 rounded font-bold">
                                                Your Answer
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Immediate Explanation Feedback */}
                    {selectedAnswers[questions[currentQuestionIndex].id] && (
                        <div className={`mt-6 p-4 rounded-xl border-2 animate-fadeIn ${
                            questions[currentQuestionIndex].options.find(o => o.isCorrect)?.id === selectedAnswers[questions[currentQuestionIndex].id]
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {questions[currentQuestionIndex].options.find(o => o.isCorrect)?.id === selectedAnswers[questions[currentQuestionIndex].id] ? (
                                    <><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-green-800">Correct!</span></>
                                ) : (
                                    <><FaTimesCircle className="text-red-500 text-xl" /> <span className="font-bold text-red-800">Incorrect</span></>
                                )}
                            </div>
                            {questions[currentQuestionIndex].explanation && (
                                <div className="mt-2 text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-gray-100">
                                    <span className="font-bold mr-2">Explanation:</span> 
                                    {questions[currentQuestionIndex].explanation}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`px-6 py-1.5 rounded-lg font-bold transition-all ${
                                currentQuestionIndex === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                            }`}
                        >
                            Previous
                        </button>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-1.5 rounded-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5"
                            >
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                className="px-8 py-1.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamModule;
