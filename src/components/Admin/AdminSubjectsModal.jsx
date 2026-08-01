import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';

export const AdminSubjectsModal = ({ isOpen, onClose }) => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
        }
    }, [isOpen]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/admin/exams/subjects');
            if (res.success) setSubjects(res.subjects || []);
        } catch (err) {
            setError(err.error || 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newSubject.trim()) return;

        try {
            setAdding(true);
            setError(null);
            const res = await api.post('/admin/exams/subjects', { name: newSubject });
            if (res.success) {
                setNewSubject('');
                fetchSubjects();
            }
        } catch (err) {
            setError(err.error || 'Failed to add subject');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            setError(null);
            await api.delete(`/admin/exams/subjects/${id}`);
            fetchSubjects();
        } catch (err) {
            setError(err.error || 'Failed to delete subject');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-purple-600 flex justify-between items-center text-white shrink-0">
                    <h2 className="font-bold text-lg">Manage Exam Subjects</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Enter new subject..."
                            className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        />
                        <button
                            type="submit"
                            disabled={adding || !newSubject.trim()}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {adding ? <FaSpinner className="animate-spin" /> : <><FaPlus /> Add</>}
                        </button>
                    </form>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <FaSpinner className="animate-spin text-purple-600 text-2xl" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {subjects.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No subjects found.</p>
                            ) : (
                                subjects.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                        <span className="font-medium text-gray-700">{sub.name}</span>
                                        <button
                                            onClick={() => handleDelete(sub.id, sub.name)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Delete Subject"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
