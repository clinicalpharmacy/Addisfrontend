import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEnvelope, FaTag, FaCheckCircle, FaTrash, FaSpinner, FaReply, FaChartLine, FaExclamationTriangle, FaComments } from 'react-icons/fa';
import api from '../../utils/api';

export const AdminFeedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, resolved

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const response = await api.get('/feedback/admin/all');
            if (response.success) {
                setFeedback(response.feedback || []);
            } else {
                setError(response.error || 'Failed to fetch feedback');
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setProcessingId(id);
            const response = await api.put(`/feedback/${id}/status`, { status: newStatus });

            if (response.success) {
                // Update local state
                setFeedback(prev => prev.map(item =>
                    item.id === id ? { ...item, status: newStatus } : item
                ));
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;

        try {
            setProcessingId(id);
            const response = await api.delete(`/feedback/${id}`);

            if (response.success) {
                setFeedback(prev => prev.filter(item => item.id !== id));
            }
        } catch (err) {
            console.error('Error deleting feedback:', err);
            alert('Failed to delete feedback');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'new':
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">New</span>;
            case 'read':
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">Read</span>;
            case 'resolved':
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Resolved</span>;
            default:
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'bug':
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><FaExclamationTriangle size={10} /> Bug</span>;
            case 'suggestion':
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1"><FaChartLine size={10} /> Idea</span>;
            default:
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 flex items-center gap-1"><FaComments size={10} /> General</span>;
        }
    };

    const filteredFeedback = feedback.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'pending') return item.status !== 'resolved';
        if (filter === 'resolved') return item.status === 'resolved';
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaComments className="text-blue-600" /> User Feedback
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {feedback.length}
                    </span>
                </h2>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'resolved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Resolved
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-center text-sm font-bold">
                    {error}
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {filteredFeedback.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <FaComments className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p>No feedback found matching your criteria</p>
                    </div>
                ) : (
                    filteredFeedback.map(item => (
                        <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                        <FaUserCircle className="text-blue-500 text-xl" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">
                                            {item.user_name || 'Anonymous User'}
                                        </h4>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <FaEnvelope size={10} /> {item.user_email || 'No Email'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2 mb-1">
                                        {getCategoryBadge(item.category)}
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="ml-13 pl-13">
                                {item.subject && (
                                    <h5 className="font-bold text-gray-700 mb-1">{item.subject}</h5>
                                )}
                                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 whitespace-pre-wrap">
                                    {item.message}
                                </p>

                                <div className="flex items-center gap-3">
                                    {item.status !== 'resolved' ? (
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                            disabled={processingId === item.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            {processingId === item.id ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, 'new')}
                                            disabled={processingId === item.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            {processingId === item.id ? <FaSpinner className="animate-spin" /> : <FaReply />}
                                            Re-open
                                        </button>
                                    )}

                                    <a
                                        href={`mailto:${item.user_email}?subject=Re: ${item.subject || 'Your Feedback to AddisMed'}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <FaReply /> Reply via Email
                                    </a>

                                    <div className="flex-1"></div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={processingId === item.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors ml-auto"
                                    >
                                        {processingId === item.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
