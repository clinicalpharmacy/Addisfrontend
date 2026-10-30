import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaCommentDots, FaPaperPlane, FaSearch, FaTrash, FaTimes,
    FaUserCircle, FaUserMd, FaSpinner, FaClock, FaCheckDouble,
    FaInbox, FaChevronLeft
} from 'react-icons/fa';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

// How often the session list refreshes when nothing is selected
const LIST_POLL_MS = 15000;
// How often the open conversation refreshes
const THREAD_POLL_MS = 5000;

const AdminChat = () => {
    const [sessions, setSessions]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [listError, setListError]       = useState(null);
    const [search, setSearch]             = useState('');

    const [activeId, setActiveId]         = useState(null);
    const [messages, setMessages]         = useState([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadError, setThreadError]   = useState(null);
    const [reply, setReply]               = useState('');
    const [sending, setSending]           = useState(false);

    const messagesEndRef = useRef(null);
    const replyRef       = useRef(null);

    const activeSession = sessions.find((s) => s.id === activeId);

    // ---------------------------------------------------------------
    // Session list
    // ---------------------------------------------------------------
    const fetchSessions = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setListError(null);
            const data = await api.get('/chat/admin/sessions');
            if (data?.success) setSessions(data.sessions || []);
        } catch (err) {
            if (!silent) setListError('Failed to load conversations.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
        const id = setInterval(() => fetchSessions(true), LIST_POLL_MS);
        return () => clearInterval(id);
    }, [fetchSessions]);

    // ---------------------------------------------------------------
    // Messages of the active session
    // ---------------------------------------------------------------
    const fetchThread = useCallback(async (id, silent = false) => {
        if (!id) return;
        try {
            if (!silent) setThreadLoading(true);
            setThreadError(null);
            const data = await api.get(`/chat/admin/sessions/${id}/messages`);
            if (data?.success) {
                setMessages(data.messages || []);

                // Mark as read on the server (best effort)
                api.patch(`/chat/admin/sessions/${id}/read`, {}).catch(() => {});

                // Locally reset the unread badge
                setSessions((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, unread_count: 0 } : s))
                );
            }
        } catch (err) {
            const status = err?.response?.status ?? err?.status;
            if (status === 404) {
                // Session was auto-purged (>7 days)
                setSessions((prev) => prev.filter((s) => s.id !== id));
                setActiveId(null);
                setMessages([]);
            } else if (!silent) {
                setThreadError('Failed to load messages.');
            }
        } finally {
            if (!silent) setThreadLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeId) return;
        fetchThread(activeId);
        const id = setInterval(() => fetchThread(activeId, true), THREAD_POLL_MS);
        return () => clearInterval(id);
    }, [activeId, fetchThread]);

    // Scroll to the newest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus the reply box when a session opens
    useEffect(() => {
        if (activeId) setTimeout(() => replyRef.current?.focus(), 150);
    }, [activeId]);

    // ---------------------------------------------------------------
    // Reply
    // ---------------------------------------------------------------
    const handleSend = async (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (!text || !activeId || sending) return;

        setSending(true);
        setThreadError(null);

        // Optimistic bubble
        const tempId = 'temp_' + Date.now();
        const optimistic = {
            id: tempId,
            sender: 'admin',
            content: text,
            created_at: new Date().toISOString(),
            _pending: true
        };
        setMessages((prev) => [...prev, optimistic]);
        setReply('');

        try {
            const data = await api.post(`/chat/admin/sessions/${activeId}/messages`, { content: text });
            if (data?.success && data.message) {
                setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
                // Update last-message preview on the list
                setSessions((prev) =>
                    prev.map((s) =>
                        s.id === activeId
                            ? { ...s, last_message: text, last_sender: 'admin', last_at: new Date().toISOString() }
                            : s
                    )
                );
            } else {
                fetchThread(activeId, true);
            }
        } catch (err) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setReply(text);
            setThreadError('Could not send reply. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // ---------------------------------------------------------------
    // Delete
    // ---------------------------------------------------------------
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this whole conversation? The visitor will lose the history.')) return;
        try {
            await api.delete(`/chat/admin/sessions/${id}`);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            if (activeId === id) {
                setActiveId(null);
                setMessages([]);
            }
        } catch (err) {
            alert('Error deleting conversation');
        }
    };

    // ---------------------------------------------------------------
    // Derived
    // ---------------------------------------------------------------
    const filtered = sessions.filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (s.guest_id || '').toLowerCase().includes(q) ||
            (s.user_name || '').toLowerCase().includes(q) ||
            (s.user_email || '').toLowerCase().includes(q) ||
            (s.last_message || '').toLowerCase().includes(q)
        );
    });

    const totalUnread = sessions.reduce((n, s) => n + (s.unread_count || 0), 0);

    // ---------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <FaCommentDots className="text-green-600 text-lg" /> Support Chat
                            {totalUnread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {totalUnread}
                                </span>
                            )}
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Reply to visitor messages · Auto-deleted after 7 days
                        </p>
                    </div>
                    <button
                        onClick={() => fetchSessions()}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm font-black text-xs active:scale-95 flex items-center justify-center gap-2"
                    >
                        <FaClock /> Refresh
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-[65vh]">
                {/* ── Session list ────────────────────────────────── */}
                <div
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-col
                        ${activeId ? 'hidden lg:flex' : 'flex'}`}
                >
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search visitor or message…"
                                className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10 text-gray-400 text-xs gap-2">
                                <FaSpinner className="animate-spin" /> Loading…
                            </div>
                        ) : listError ? (
                            <p className="text-center py-10 text-xs text-red-500 font-bold">{listError}</p>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <FaInbox className="text-3xl text-gray-200 mb-3" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {sessions.length === 0 ? 'No conversations yet' : 'No matches'}
                                </p>
                            </div>
                        ) : (
                            filtered.map((s) => {
                                const unread = s.unread_count || 0;
                                const isActive = s.id === activeId;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveId(s.id)}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors flex gap-3 ${
                                            isActive ? 'bg-green-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                                s.user_id
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                            }`}
                                        >
                                            {s.user_id ? <FaUserCircle /> : <FaUserMd className="text-xs" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-black text-gray-900 truncate">
                                                    {s.user_name || s.user_email || s.guest_id || `Guest #${s.id}`}
                                                </p>
                                                {s.last_at && (
                                                    <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(s.last_at), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-[11px] truncate ${
                                                unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'
                                            }`}>
                                                {s.last_sender === 'admin' && (
                                                    <span className="text-green-600 font-black">You: </span>
                                                )}
                                                {s.last_message || 'No messages yet'}
                                            </p>
                                            {unread > 0 && (
                                                <span className="inline-block mt-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                    {unread} new
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Conversation pane ───────────────────────────── */}
                <div
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-col
                        ${activeId ? 'flex' : 'hidden lg:flex'}`}
                >
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                                <FaCommentDots className="text-3xl text-green-500" />
                            </div>
                            <p className="text-sm font-black text-gray-900 mb-1">Select a conversation</p>
                            <p className="text-xs text-gray-500 max-w-xs">
                                Pick a visitor from the left to read and reply. Chats older than 7 days are automatically deleted.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => setActiveId(null)}
                                    className="lg:hidden text-gray-500 hover:text-gray-900"
                                    aria-label="Back"
                                >
                                    <FaChevronLeft />
                                </button>
                                <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                    {activeSession.user_id ? <FaUserCircle /> : <FaUserMd className="text-xs" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate">
                                        {activeSession.user_name || activeSession.user_email || activeSession.guest_id || `Guest #${activeSession.id}`}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <FaClock className="text-[8px]" />
                                        Auto-deletes after 7 days
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(activeSession.id)}
                                    className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors text-xs"
                                    title="Delete conversation"
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                                {threadLoading && (
                                    <div className="flex items-center justify-center py-6 text-gray-400 text-xs gap-2">
                                        <FaSpinner className="animate-spin" /> Loading messages…
                                    </div>
                                )}
                                {threadError && (
                                    <p className="text-xs text-red-500 font-bold text-center">{threadError}</p>
                                )}
                                {!threadLoading && messages.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-8">No messages yet.</p>
                                )}
                                {messages.map((m) => {
                                    const mine = m.sender === 'admin';
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!mine && (
                                                <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                    <FaUserMd className="text-gray-500 text-[10px]" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                                    mine
                                                        ? 'bg-green-600 text-white rounded-br-sm'
                                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                                }`}
                                            >
                                                {m.content}
                                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                                                    mine ? 'text-green-100/80' : 'text-gray-400'
                                                }`}>
                                                    {m.created_at ? format(new Date(m.created_at), 'MMM dd · HH:mm') : ''}
                                                    {mine && <FaCheckDouble className="text-[8px]" />}
                                                    {m._pending && ' · sending…'}
                                                </div>
                                            </div>
                                            {mine && (
                                                <div className="w-7 h-7 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                                                    <FaUserMd className="text-green-600 text-[10px]" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply box */}
                            <form
                                onSubmit={handleSend}
                                className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
                            >
                                <input
                                    ref={replyRef}
                                    type="text"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type your reply…"
                                    maxLength={2000}
                                    disabled={sending}
                                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white disabled:bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!reply.trim() || sending}
                                    className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors"
                                    aria-label="Send"
                                >
                                    {sending ? <FaSpinner className="animate-spin text-sm" /> : <FaPaperPlane className="text-sm" />}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
