import React, { useState, useEffect, useCallback } from 'react';
import {
    FaBullhorn, FaPaperPlane, FaTrash, FaSpinner, FaClock,
    FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
    FaCheckCircle, FaTimes, FaRedo
} from 'react-icons/fa';
import api from '../../utils/api';

const PRIORITY_CONFIG = {
    normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FaInfoCircle, dotColor: 'bg-blue-500' },
    important: { label: 'Important', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: FaExclamationCircle, dotColor: 'bg-amber-500' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200', icon: FaExclamationTriangle, dotColor: 'bg-red-500' }
};

export const AdminBroadcasts = ({ onRefresh }) => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Compose form
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');
    const [showCompose, setShowCompose] = useState(false);

    const loadBroadcasts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/broadcasts');
            if (data.success) {
                setBroadcasts(data.broadcasts || []);
            }
        } catch (err) {
            setError('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBroadcasts();
    }, [loadBroadcasts]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setSending(true);
        setError('');
        try {
            const data = await api.post('/admin/broadcasts', { title: title.trim(), message: message.trim(), priority });
            if (data.success) {
                setSuccess('📢 Broadcast sent to all users!');
                setTitle('');
                setMessage('');
                setPriority('normal');
                setShowCompose(false);
                setTimeout(() => setSuccess(''), 4000);
                loadBroadcasts();
            }
        } catch (err) {
            setError(err?.error || 'Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this broadcast? Users will no longer see it.')) return;
        setDeleting(id);
        try {
            const data = await api.delete(`/admin/broadcasts/${id}`);
            if (data.success) {
                setBroadcasts(prev => prev.filter(b => b.id !== id));
                setSuccess('Broadcast deleted');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete broadcast');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-5">
            {/* Alerts */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-sm">
                    <FaCheckCircle className="text-green-500 shrink-0" /> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-sm">
                    <FaExclamationCircle className="text-red-500 shrink-0" /> {error}
                    <button onClick={() => setError('')} className="ml-auto"><FaTimes /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-2.5 rounded-xl shadow-lg">
                        <FaBullhorn className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Broadcast Center</h2>
                        <p className="text-xs text-gray-400 font-medium">{broadcasts.length} total broadcast{broadcasts.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadBroadcasts}
                        disabled={loading}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                        <FaRedo className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={() => setShowCompose(!showCompose)}
                        className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                        <FaBullhorn /> {showCompose ? 'Cancel' : 'New Broadcast'}
                    </button>
                </div>
            </div>

            {/* Compose Form */}
            {showCompose && (
                <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-pink-600 px-5 py-3">
                        <h3 className="text-white font-black text-sm flex items-center gap-2">
                            <FaPaperPlane /> Compose Broadcast
                        </h3>
                        <p className="text-white/70 text-[10px] font-medium">This message will appear as a notification for all users</p>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Priority selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-2">Priority Level</label>
                            <div className="flex gap-2">
                                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setPriority(key)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
                                            priority === key
                                                ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current/20 scale-[1.02]`
                                                : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <cfg.icon className="text-sm" /> {cfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. System Maintenance Notice"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition-all"
                                required
                                maxLength={150}
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your broadcast message here..."
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition-all resize-none"
                                required
                                maxLength={2000}
                            />
                            <p className="text-right text-[10px] text-gray-400 mt-1">{message.length}/2000</p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowCompose(false); setTitle(''); setMessage(''); setPriority('normal'); }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={sending || !title.trim() || !message.trim()}
                                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                {sending ? 'Sending...' : 'Send to All Users'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Broadcasts List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <FaSpinner className="text-3xl text-orange-500 animate-spin" />
                </div>
            ) : broadcasts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <FaBullhorn className="text-4xl text-gray-200 mx-auto mb-3" />
                    <h3 className="text-gray-500 font-bold text-sm">No Broadcasts Yet</h3>
                    <p className="text-gray-400 text-xs mt-1">Create your first broadcast to notify all users</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {broadcasts.map(broadcast => {
                        const cfg = PRIORITY_CONFIG[broadcast.priority] || PRIORITY_CONFIG.normal;
                        const PriorityIcon = cfg.icon;

                        return (
                            <div
                                key={broadcast.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                            >
                                <div className="flex items-stretch">
                                    {/* Priority indicator */}
                                    <div className={`w-1.5 ${cfg.dotColor} shrink-0`} />

                                    <div className="flex-1 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                                                        <PriorityIcon className="text-[9px]" /> {cfg.label}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                        <FaClock className="text-[8px]" /> {formatDate(broadcast.created_at)}
                                                    </span>
                                                </div>

                                                <h4 className="font-bold text-sm text-gray-900 mb-1">{broadcast.title}</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{broadcast.message}</p>

                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                    Sent by <span className="text-gray-600 font-bold">{broadcast.created_by_name || 'Admin'}</span>
                                                </p>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(broadcast.id)}
                                                disabled={deleting === broadcast.id}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                                title="Delete broadcast"
                                            >
                                                {deleting === broadcast.id
                                                    ? <FaSpinner className="animate-spin text-sm" />
                                                    : <FaTrash className="text-sm" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
