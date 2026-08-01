import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaGraduationCap, FaFileAlt, FaEdit, FaTrash, FaSpinner, FaSync, FaCheckCircle, FaTimesCircle, FaSearch, FaEye } from 'react-icons/fa';
import { ExamCreator } from './ExamCreator';
import { AdminSubjectsModal } from './AdminSubjectsModal';
import api from '../../utils/api';

export const AdminExams = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);

    // Fetch exams from backend
    const loadExams = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/admin/exams');
            setExams(res.exams || []);
        } catch (err) {
            console.error('Failed to load exams:', err);
            setError(err?.error || 'Failed to load exams');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExams();
    }, [loadExams]);

    // Delete an exam
    const handleDelete = async (examId, subject) => {
        if (!window.confirm(`Are you sure you want to delete the "${subject}" exam? This will remove all its questions permanently.`)) {
            return;
        }
        try {
            setDeletingId(examId);
            await api.delete(`/admin/exams/${examId}`);
            setSuccessMsg(`"${subject}" exam deleted successfully`);
            setTimeout(() => setSuccessMsg(''), 3000);
            await loadExams();
        } catch (err) {
            setError(err?.error || 'Failed to delete exam');
            setTimeout(() => setError(''), 4000);
        } finally {
            setDeletingId(null);
        }
    };

    // Edit an exam — fetch it with questions
    const handleEdit = async (examId) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/exams/${examId}`);
            setEditingExam({ exam: res.exam, questions: res.questions });
            setIsCreating(true);
        } catch (err) {
            setError(err?.error || 'Failed to load exam for editing');
            setTimeout(() => setError(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    // Filter exams by search
    const filteredExams = exams.filter(e =>
        e.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // When coming back from create/edit
    const handleBack = () => {
        setIsCreating(false);
        setEditingExam(null);
        loadExams();
    };

    if (isCreating) {
        return <ExamCreator onBack={handleBack} editData={editingExam} />;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-50/80 to-indigo-50/80">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaGraduationCap className="text-purple-600" /> Exam Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload and manage exams from PDF/Excel • {exams.length} exam{exams.length !== 1 ? 's' : ''} total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        />
                    </div>
                    <button
                        onClick={loadExams}
                        disabled={loading}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 p-2 rounded-lg transition-colors border border-gray-200"
                        title="Refresh"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsSubjectsModalOpen(true)}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border border-indigo-200"
                    >
                        Manage Subjects
                    </button>
                    <button
                        onClick={() => { setEditingExam(null); setIsCreating(true); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm shadow-purple-200 hover:shadow-md"
                    >
                        <FaPlus /> Create Exam
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {successMsg && (
                <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <FaCheckCircle className="text-green-500 shrink-0" /> {successMsg}
                </div>
            )}
            {error && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <FaTimesCircle className="text-red-500 shrink-0" /> {error}
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {loading && exams.length === 0 ? (
                    <div className="text-center py-16">
                        <FaSpinner className="text-4xl text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Loading exams...</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaGraduationCap className="text-3xl text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">
                            {searchTerm ? 'No exams match your search' : 'No exams yet'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {searchTerm ? 'Try a different search term' : 'Upload a PDF or Excel file to create your first exam'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => { setEditingExam(null); setIsCreating(true); }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors inline-flex items-center gap-2"
                            >
                                <FaPlus /> Create First Exam
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredExams.map(exam => (
                            <div
                                key={exam.id}
                                className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all group bg-white relative"
                            >
                                {/* Status badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        exam.status === 'published'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {exam.status || 'draft'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FaFileAlt className="text-xl" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg mb-1 pr-16">{exam.subject}</h3>
                                {exam.title && exam.title !== `${exam.subject} Exam` && (
                                    <p className="text-xs text-gray-500 mb-1">{exam.title}</p>
                                )}
                                {exam.source_file_name && (
                                    <p className="text-xs text-gray-400 truncate" title={exam.source_file_name}>
                                        📄 {exam.source_file_name}
                                    </p>
                                )}

                                <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                    <span className="font-medium">{exam.question_count || 0} Questions</span>
                                    <span className="text-xs">
                                        {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(exam.id)}
                                        className="flex-1 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exam.id, exam.subject)}
                                        disabled={deletingId === exam.id}
                                        className="flex-1 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {deletingId === exam.id ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaTrash />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AdminSubjectsModal 
                isOpen={isSubjectsModalOpen} 
                onClose={() => setIsSubjectsModalOpen(false)} 
            />
        </div>
    );
};
