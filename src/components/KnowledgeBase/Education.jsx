import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';

const ExamModule = ({
    examId,
    examTitle,
    examSubject,
    session,
    onSessionUpdate,
    onComplete,
    onExit,
    onBack
}) => {
    const [questions, setQuestions] = useState(session?.questions || []);
    const [selectedAnswers, setSelectedAnswers] = useState(session?.answers || {});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session?.currentIndex || 0);
    const [isSubmitted, setIsSubmitted] = useState(session?.completed || false);

    const [loading, setLoading] = useState(!session?.questions || session.questions.length === 0);
    const [error, setError] = useState(null);

    // Sync state when the parent provides a new session
    useEffect(() => {
        if (session) {
            setQuestions(session.questions || []);
            setSelectedAnswers(session.answers || {});
            setCurrentQuestionIndex(session.currentIndex || 0);
            setIsSubmitted(session.completed || false);
            setLoading(false);
            setError(null);
        }
    }, [session?.examId, session?.lastUpdated]);

    // Fallback fetch only when no session is provided
    useEffect(() => {
        if (session) return;
        if (examId) {
            fetchQuestions();
        }
    }, [examId, session]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/exams/${examId}/questions`);

            if (response && response.success && Array.isArray(response.questions)) {
                setQuestions(response.questions);
            } else if (Array.isArray(response)) {
                setQuestions(response);
            } else if (response && Array.isArray(response.data)) {
                setQuestions(response.data);
            } else {
                setQuestions([]);
            }
        } catch (err) {
            console.error('Failed to fetch exam questions:', err);
            setError('Failed to load exam questions. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const notifyUpdate = (updates) => {
        if (typeof onSessionUpdate === 'function') {
            onSessionUpdate(updates);
        }
    };

    const handleOptionSelect = (questionId, optionId) => {
        if (isSubmitted) return;

        const updatedAnswers = {
            ...selectedAnswers,
            [questionId]: optionId
        };

        setSelectedAnswers(updatedAnswers);
        notifyUpdate({ answers: updatedAnswers });
    };

    const goToIndex = (newIndex) => {
        const safeIndex = Math.max(0, Math.min(newIndex, questions.length - 1));
        setCurrentQuestionIndex(safeIndex);
        notifyUpdate({ currentIndex: safeIndex });
    };

    const handleShowScore = () => {
        const answeredCount = Object.keys(selectedAnswers).length;

        if (answeredCount < questions.length) {
            const remaining = questions.length - answeredCount;
            const confirmed = window.confirm(
                `You have ${remaining} unanswered question${remaining > 1 ? 's' : ''}. ` +
                `Unanswered questions will be marked incorrect. Show your total score anyway?`
            );

            if (!confirmed) return;
        }

        setIsSubmitted(true);
        notifyUpdate({ completed: true, answers: selectedAnswers });

        if (typeof onComplete === 'function') {
            onComplete();
        }
    };

    const handleBack = () => {
        if (typeof onExit === 'function') {
            onExit();
        } else if (typeof onBack === 'function') {
            onBack();
        }
    };

    const calculateScore = () => {
        let score = 0;

        questions.forEach((question) => {
            const selectedOptionId = selectedAnswers[question.id];
            const correctOption = question.options?.find((option) => option.isCorrect);

            if (correctOption && selectedOptionId === correctOption.id) {
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
                    onClick={handleBack}
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
                    onClick={handleBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back to Exams
                </button>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {examTitle || `${examSubject} Exam`}
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-600">
                        No questions available for this exam yet. Please check back later.
                    </p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-fadeIn">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back to Exams
                </button>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-600">This question is unavailable.</p>
                </div>
            </div>
        );
    }

    const score = isSubmitted ? calculateScore() : 0;
    const percentage = questions.length ? ((score / questions.length) * 100).toFixed(1) : '0.0';

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fadeIn max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                    <FaArrowLeft /> Back
                </button>

                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                    {examTitle || examSubject || 'Exam'}
                </h3>

                <div className="text-sm font-bold text-gray-500">
                    {isSubmitted
                        ? 'Completed'
                        : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                </div>
            </div>

            {isSubmitted ? (
                <div className="text-center py-12 animate-fadeIn">
                    <div
                        className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-8 mb-6 ${
                            Number(percentage) >= 70
                                ? 'border-green-500 text-green-500'
                                : 'border-amber-500 text-amber-500'
                        }`}
                    >
                        <span className="text-5xl font-black">{percentage}%</span>
                    </div>

                    <h4 className="text-3xl font-bold text-gray-800 mb-3">
                        {Number(percentage) >= 70 ? 'Great Job!' : 'Keep Practicing!'}
                    </h4>

                    <p className="text-gray-600 text-lg">
                        You scored {score} out of {questions.length} questions correctly.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="mb-6">
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                                }}
                            ></div>
                        </div>

                        <h4 className="text-xl font-bold text-gray-800 leading-relaxed">
                            {currentQuestionIndex + 1}. {currentQuestion.questionText || currentQuestion.text || 'Question'}
                        </h4>
                    </div>

                    <div className="space-y-2">
                        {(currentQuestion.options || []).map((option) => {
                            const hasAnswered = !!selectedAnswers[currentQuestion.id];
                            const isSelected = selectedAnswers[currentQuestion.id] === option.id;

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
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                    disabled={hasAnswered}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${buttonStyle}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${dotStyle}`}
                                            >
                                                {hasAnswered && (option.isCorrect || isSelected) && (
                                                    <div className="text-white text-xs">
                                                        {option.isCorrect ? '✓' : '✗'}
                                                    </div>
                                                )}
                                            </div>

                                            <span className={`text-base ${textStyle}`}>
                                                {option.text || option.label || 'Option'}
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

                    {selectedAnswers[currentQuestion.id] && (
                        <div
                            className={`mt-6 p-4 rounded-xl border-2 animate-fadeIn ${
                                currentQuestion.options?.find((option) => option.isCorrect)?.id ===
                                selectedAnswers[currentQuestion.id]
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {currentQuestion.options?.find((option) => option.isCorrect)?.id ===
                                selectedAnswers[currentQuestion.id] ? (
                                    <>
                                        <FaCheckCircle className="text-green-500 text-xl" />
                                        <span className="font-bold text-green-800">Correct!</span>
                                    </>
                                ) : (
                                    <>
                                        <FaTimesCircle className="text-red-500 text-xl" />
                                        <span className="font-bold text-red-800">Incorrect</span>
                                    </>
                                )}
                            </div>

                            {currentQuestion.explanation && (
                                <div className="mt-2 text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-gray-100">
                                    <span className="font-bold mr-2">Explanation:</span>
                                    {currentQuestion.explanation}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                        <button
                            onClick={() => goToIndex(currentQuestionIndex - 1)}
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
                                onClick={handleShowScore}
                                className="px-8 py-1.5 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 transition-all"
                            >
                                Show Total Score
                            </button>
                        ) : (
                            <button
                                onClick={() => goToIndex(currentQuestionIndex + 1)}
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
