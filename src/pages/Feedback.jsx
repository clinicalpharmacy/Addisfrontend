import React, { useState, useEffect } from 'react';
import { FaComments, FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../utils/api';

const Feedback = () => {
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        category: 'general' // general, bug, suggestion, other
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [status]); // Add status to dependencies to clear it only on new submissions or mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (!formData.message.trim()) {
            setStatus({ type: 'error', message: 'Please enter a message' });
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/feedback', {
                ...formData,
                user_email: user?.email,
                user_name: user?.full_name || user?.email
            });

            if (response.success) {
                setStatus({ type: 'success', message: 'Thank you for your feedback! We appreciate your input.' });
                setFormData({ subject: '', message: '', category: 'general' });

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setStatus({ type: '', message: '' });
                }, 5000);
            } else {
                setStatus({ type: 'error', message: response.error || 'Failed to send feedback' });
            }
        } catch (error) {
            console.error('Feedback error:', error);
            setStatus({ type: 'error', message: error.message || 'An error occurred while sending feedback' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-10 -translate-y-10">
                    <FaComments size={150} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <FaComments /> Feedback & Suggestions
                    </h1>
                    <p className="text-blue-100 max-w-xl">
                        We value your input! Share your thoughts, report issues, or suggest improvements to help us make AddisMed better for everyone.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Why send feedback?</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                                Report technical issues or bugs
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                Suggest new features
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                                Provide general comments
                            </li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <p className="text-blue-800 text-sm font-medium italic">
                            "Your feedback directly influences our development roadmap. We read every message!"
                        </p>
                        <p className="text-blue-600 text-xs mt-2 font-bold">- The AddisMed Team</p>
                    </div>
                </div>

                {/* Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                        {status.message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${status.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {status.type === 'success' ? (
                                    <FaCheckCircle className="mt-1 flex-shrink-0" />
                                ) : (
                                    <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                                )}
                                <p className="font-medium">{status.message}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="general">General Feedback</option>
                                        <option value="suggestion">Feature Suggestion</option>
                                        <option value="bug">Report a Bug</option>
                                        <option value="content fa-comments">Content Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Brief summary..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Type your feedback here..."
                                    rows="6"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform active:scale-95 ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane /> Send Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
