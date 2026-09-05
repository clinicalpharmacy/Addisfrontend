import React, { useState, useEffect } from 'react';
import {
    FaGraduationCap,
    FaBookOpen,
    FaClipboardList,
    FaSearch,
    FaSpinner
} from 'react-icons/fa';
import api from '../../utils/api';
import ExamModule from './ExamModule';
import ClinicalPharmacySkill from './ClinicalPharmacySkill';

const Education = () => {
    const [activeTab, setActiveTab] = useState('exam');
    const [selectedExam, setSelectedExam] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // API State
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);

            const response = await api.get('/exams/published');

            if (response.success) {
                setExams(response.exams || []);
            }
        } catch (err) {
            console.error('Failed to fetch exams:', err);
            setError('Failed to load exams. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(
        (exam) =>
            (exam.title &&
                exam.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
            (exam.subject &&
                exam.subject
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))
    );

    // Open selected exam
    if (selectedExam) {
        return (
            <ExamModule
                examId={selectedExam.id}
                examTitle={selectedExam.title}
                examSubject={selectedExam.subject}
                onBack={() => setSelectedExam(null)}
            />
        );
    }

    return (
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden relative animate-fadeIn">

            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 pointer-events-none" />

            <div className="p-6 md:p-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="bg-purple-100 p-2.5 rounded-xl">
                                <FaGraduationCap className="text-purple-600 text-2xl" />
                            </div>

                            Education Center
                        </h2>

                        <p className="text-gray-500 mt-2 font-medium ml-1">
                            Test your knowledge, develop clinical pharmacy skills,
                            and review clinical guidelines
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    TABS
                ====================================================== */}
                <div className="flex flex-col sm:flex-row bg-gray-100/80 p-1.5 rounded-xl mb-8 max-w-4xl gap-1">

                    {/* Exams Tab */}
                    <button
                        onClick={() => setActiveTab('exam')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'exam'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaClipboardList
                            className={
                                activeTab === 'exam'
                                    ? 'text-purple-500'
                                    : 'opacity-60'
                            }
                        />

                        Exams
                    </button>

                    {/* Clinical Pharmacy Skill Tab */}
                    <button
                        onClick={() =>
                            setActiveTab('clinicalpharmacyskill')
                        }
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'clinicalpharmacyskill'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaBookOpen
                            className={
                                activeTab === 'clinicalpharmacyskill'
                                    ? 'text-indigo-500'
                                    : 'opacity-60'
                            }
                        />

                        Clinical Pharmacy Skill
                    </button>

                    {/* Guidelines Tab */}
                    <button
                        onClick={() => setActiveTab('guideline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'guideline'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaBookOpen
                            className={
                                activeTab === 'guideline'
                                    ? 'text-indigo-500'
                                    : 'opacity-60'
                            }
                        />

                        Guidelines
                    </button>
                </div>

                {/* =====================================================
                    EXAMS TAB CONTENT
                ====================================================== */}
                {activeTab === 'exam' && (
                    <div className="animate-fadeIn">

                        {/* Search Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

                            <h3 className="text-xl font-bold text-gray-800">
                                Select Subject
                            </h3>

                            <div className="relative w-full sm:w-64">

                                <input
                                    type="text"
                                    placeholder="Search subjects..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-purple-300 focus:ring-4 focus:ring-purple-50 bg-gray-50/50 transition-all outline-none"
                                />

                                <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />

                            </div>
                        </div>

                        {/* Loading / Error / Exams */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <FaSpinner className="animate-spin text-purple-600 text-3xl" />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
                                {error}
                            </div>
                        ) : (
                            <>
                                {/* Exam Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                    {filteredExams.map((exam) => (
                                        <button
                                            key={exam.id}
                                            onClick={() =>
                                                setSelectedExam(exam)
                                            }
                                            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-left"
                                        >

                                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-600 transition-colors duration-300 flex-shrink-0">

                                                <FaClipboardList className="text-purple-600 group-hover:text-white text-lg transition-colors" />

                                            </div>

                                            <div>

                                                <h4 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-1">
                                                    {exam.title ||
                                                        `${exam.subject} Exam`}
                                                </h4>

                                                <p className="text-xs text-gray-500 mt-1">
                                                    {exam.subject} •{' '}
                                                    {exam.question_count || 0}{' '}
                                                    Questions
                                                </p>

                                            </div>

                                        </button>
                                    ))}

                                </div>

                                {/* No Exams */}
                                {filteredExams.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">

                                        <p className="text-gray-500 font-medium">
                                            {exams.length === 0
                                                ? 'No exams available at the moment.'
                                                : `No exams found matching "${searchTerm}"`}
                                        </p>

                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* =====================================================
                    CLINICAL PHARMACY SKILL TAB CONTENT
                ====================================================== */}
                {activeTab === 'clinicalpharmacyskill' && (
                    <div className="animate-fadeIn">
                        <ClinicalPharmacySkill />
                    </div>
                )}

                {/* =====================================================
                    GUIDELINES TAB CONTENT
                ====================================================== */}
                {activeTab === 'guideline' && (
                    <div className="animate-fadeIn">

                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">

                            {/* Icon */}
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">

                                <FaBookOpen className="text-indigo-600 text-2xl" />

                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-indigo-900 mb-2">
                                Clinical Guidelines
                            </h3>

                            {/* Description */}
                            <p className="text-indigo-700 max-w-md mx-auto">
                                The guidelines section is currently under
                                development. Please check back later for
                                comprehensive medical guidelines across all
                                specialties.
                            </p>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default Education;
