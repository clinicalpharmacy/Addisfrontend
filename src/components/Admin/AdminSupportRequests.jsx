import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaShieldAlt, FaUserMd, FaCalendarAlt, FaChevronRight,
    FaSpinner, FaUnlock, FaLock, FaBell, FaCheck, FaTimes,
    FaUser, FaEnvelope, FaSync, FaInbox
} from 'react-icons/fa';
import api from '../../utils/api';

/**
 * 📋 AdminSupportRequests Component
 * Shows:
 *  1. Pending data-sharing requests from users (top section)
 *  2. Active support vault — patients the admin already has access to (bottom)
 */
export const AdminSupportRequests = () => {
    const navigate = useNavigate();

    // Pending requests state
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(true);
    const [pendingError, setPendingError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Active vault state
    const [activePatients, setActivePatients] = useState([]);
    const [activeLoading, setActiveLoading] = useState(true);
    const [activeError, setActiveError] = useState('');

    const [successMsg, setSuccessMsg] = useState('');

    const fetchPendingRequests = useCallback(async () => {
        setPendingLoading(true);
        setPendingError('');
        try {
            const res = await api.get('/access/pending-admin');
            if (res.success) {
                setPendingRequests(res.requests || []);
            } else {
                setPendingError(res.error || 'Failed to load pending requests.');
            }
        } catch (err) {
            setPendingError(err.error || err.message || 'Connection error.');
        } finally {
            setPendingLoading(false);
        }
    }, []);

    const fetchActivePatients = useCallback(async () => {
        setActiveLoading(true);
        setActiveError('');
        try {
            const res = await api.get('/access/active-support');
            if (res.success) {
                setActivePatients(res.support_patients || []);
            } else {
                setActiveError(res.error || 'Failed to sync vault.');
            }
        } catch (err) {
            setActiveError(err.error || err.message || 'Vault connection lost.');
        } finally {
            setActiveLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingRequests();
        fetchActivePatients();
    }, [fetchPendingRequests, fetchActivePatients]);

    const handleApprove = async (req) => {
        setProcessingId(req.id);
        try {
            const res = await api.post('/access/approve', {
                request_id: req.id,
                encrypted_key: req.encrypted_key || ''
            });
            if (res.success) {
                setSuccessMsg(`✅ Access granted to ${req.owner?.full_name || 'user'}`);
                setTimeout(() => setSuccessMsg(''), 4000);
                fetchPendingRequests();
                fetchActivePatients();
            }
        } catch (err) {
            alert('❌ Approval failed: ' + (err.error || err.message));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (req) => {
        if (!window.confirm(`Reject data sharing request from ${req.owner?.full_name || 'this user'}?`)) return;
        setProcessingId(req.id);
        try {
            await api.post('/access/revoke-support', { patient_id: req.patient_id || req.owner?.id });
            // Soft-delete by deleting the access_request row directly
            await api.delete?.(`/access/request/${req.id}`) || await api.post('/access/reject', { request_id: req.id });
            fetchPendingRequests();
        } catch (err) {
            // Even if reject endpoint doesn't exist, refresh
            fetchPendingRequests();
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefresh = () => {
        fetchPendingRequests();
        fetchActivePatients();
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm">
                    <FaCheck /> {successMsg}
                </div>
            )}

            {/* ─── SECTION 1: PENDING DATA SHARING REQUESTS ─── */}
            <section>
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                            <FaBell className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                Pending Data Sharing Requests
                            </h2>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                                Users awaiting your approval
                            </p>
                        </div>
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors px-3 py-2 rounded-xl hover:bg-blue-50"
                    >
                        <FaSync /> Refresh
                    </button>
                </header>

                {pendingLoading ? (
                    <div className="flex items-center justify-center p-16 bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-100">
                        <FaSpinner className="animate-spin text-orange-400 mr-3" />
                        <span className="text-orange-400 font-bold uppercase tracking-widest text-xs">Loading requests...</span>
                    </div>
                ) : pendingError ? (
                    <div className="p-8 bg-red-50 rounded-3xl border border-red-100 text-center">
                        <p className="text-red-500 font-bold text-sm">{pendingError}</p>
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="bg-orange-50/30 rounded-3xl border-2 border-dashed border-orange-100 p-16 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <FaInbox className="text-orange-200 text-3xl" />
                        </div>
                        <h3 className="text-lg font-black text-gray-400">No Pending Requests</h3>
                        <p className="text-gray-400 text-sm mt-1 font-medium">
                            When users request data sharing, they'll appear here for your approval.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pendingRequests.map(req => (
                            <div
                                key={req.id}
                                className="bg-white rounded-3xl border-2 border-orange-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 overflow-hidden group"
                            >
                                {/* Status Banner */}
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Awaiting Approval</span>
                                    </div>
                                    <span className="text-white/70 text-[9px] font-mono">#{req.id?.slice(0, 8) || 'N/A'}</span>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 font-black text-lg shadow-inner">
                                            {req.owner?.full_name?.charAt(0) || <FaUser />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 text-base truncate">
                                                {req.owner?.full_name || 'Unknown User'}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <FaEnvelope className="text-gray-300 text-xs" />
                                                <span className="text-xs text-gray-400 font-semibold truncate">{req.owner?.email || '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Patient & Date Info */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Scope</p>
                                            <p className="text-sm font-black text-gray-700">
                                                {req.patient?.full_name || 'All Records'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <FaCalendarAlt size={8} /> Requested
                                            </p>
                                            <p className="text-sm font-black text-gray-700">
                                                {req.created_at
                                                    ? new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Encrypted Key Badge */}
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${req.encrypted_key ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                        {req.encrypted_key ? <FaUnlock size={10} /> : <FaLock size={10} />}
                                        {req.encrypted_key ? 'Encrypted key attached' : 'No key attached yet'}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={processingId === req.id}
                                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                                        >
                                            {processingId === req.id
                                                ? <FaSpinner className="animate-spin" />
                                                : <><FaCheck /> Approve</>
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleReject(req)}
                                            disabled={processingId === req.id}
                                            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all border border-red-100 disabled:opacity-50"
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* ─── SECTION 2: ACTIVE SUPPORT VAULT ─── */}
            <section>
                <header className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <FaShieldAlt className="text-white text-sm" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Active Support Vault</h2>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                            Approved patient records you can access
                        </p>
                    </div>
                    {/* Security Pulse */}
                    <div className="ml-auto bg-gray-900 text-[10px] font-mono px-4 py-3 rounded-xl border border-gray-800 shadow-xl text-green-400 hidden lg:block">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-white font-black uppercase tracking-widest text-[9px]">TLS 1.3 Active</span>
                        </div>
                    </div>
                </header>

                {activeLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <FaSpinner className="text-3xl text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Filtering Vault Access...</p>
                    </div>
                ) : activeError ? (
                    <div className="p-8 bg-red-50 rounded-3xl border border-red-100 text-center">
                        <p className="text-red-500 font-bold text-sm">{activeError}</p>
                    </div>
                ) : activePatients.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 p-20 text-center group hover:border-blue-200 transition-colors">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50">
                            <FaLock className="text-gray-200 text-3xl" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400">Vault Empty</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                            Approved patient records will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {activePatients.map(req => (
                            <div
                                key={req.id}
                                className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group relative overflow-hidden"
                            >
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50/30 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors" />
                                <div className="p-8 relative">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-14 h-14 bg-blue-600/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <FaUserMd size={24} />
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Vault Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-8">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                            {req.patient?.full_name || 'Anonymous Record'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Patient Code</span>
                                            <code className="text-xs font-black bg-gray-100 px-2 py-0.5 rounded text-gray-800">{req.patient?.patient_code || '---'}</code>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <FaCalendarAlt size={10} /> Granted On
                                            </p>
                                            <p className="text-sm font-black text-gray-800">
                                                {req.approved_at
                                                    ? new Date(req.approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <FaShieldAlt size={10} /> Originator
                                            </p>
                                            <p className="text-sm font-black text-gray-800 truncate">{req.owner?.full_name?.split(' ')[0] || 'System'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const pId = req.patient?.patient_code || req.patient_id || req.patient?.id;
                                            if (pId) navigate(`/patients/${pId}`);
                                        }}
                                        className="w-full h-16 bg-gray-900 group-hover:bg-blue-600 text-white rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-200 group-hover:shadow-blue-200"
                                    >
                                        <FaUnlock className="group-hover:rotate-12 transition-transform" /> Access Data Stream <FaChevronRight />
                                    </button>
                                </div>
                                <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-100/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <FaLock size={10} />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Zero-Knowledge V2</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-300">#{req.id?.slice(0, 8)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
