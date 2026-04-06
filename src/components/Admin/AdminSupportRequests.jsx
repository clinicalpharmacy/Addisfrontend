import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaCalendarAlt, 
    FaSpinner, FaUnlock, FaLock, FaCheck, FaTimes,
    FaEnvelope, FaSync, FaUserShield
} from 'react-icons/fa';
import api from '../../utils/api';

/**
 * 🔐 Admin Vault Dashboard
 * This component focuses exclusively on active, authorized support sessions.
 * Approval is handled automatically by the user's grant, so no queue is shown here.
 */
export const AdminSupportRequests = () => {
    const navigate = useNavigate();

    // Vault state
    const [activePatients, setActivePatients] = useState([]);
    const [activeLoading, setActiveLoading] = useState(true);
    const [activeError, setActiveError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchActivePatients = useCallback(async () => {
        setActiveLoading(true);
        setActiveError('');
        try {
            // Updated to fetch all authorized sessions (both existing and new)
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
        fetchActivePatients();
    }, [fetchActivePatients]);

    const handleRevoke = async (req) => {
        if (!window.confirm(`Terminate secure session with ${req.owner?.full_name || 'this user'}?`)) return;
        try {
            await api.post('/access/reject', { request_id: req.id });
            setSuccessMsg(`🚫 Session with ${req.owner?.full_name || 'user'} terminated.`);
            setTimeout(() => setSuccessMsg(''), 4000);
            fetchActivePatients();
        } catch (err) {
            alert('❌ Revoke failed: ' + (err.error || err.message));
        }
    };

    const handleRefresh = () => {
        fetchActivePatients();
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border border-gray-800">
                    <FaCheck className="text-green-400" /> {successMsg}
                </div>
            )}

            {/* ─── ACTIVE SUPPORT VAULT ─── */}
            <section className="min-h-[600px]">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-[2px] w-12 bg-blue-600 rounded-full" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500">Security Sector</span>
                        </div>
                        <h2 className="text-5xl font-black text-gray-900 leading-none">
                            Support <span className="text-blue-600">Vault</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRefresh}
                            className="bg-white border border-gray-100 p-4 rounded-2xl text-gray-400 hover:text-blue-600 transition-all hover:shadow-lg active:scale-90"
                            title="Refresh Data"
                        >
                            <FaSync className={activeLoading ? 'animate-spin' : ''} />
                        </button>
                        <div className="bg-blue-50/50 backdrop-blur-md border border-blue-100 rounded-2xl px-6 py-4 flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute inset-0" />
                                    <div className="w-3 h-3 bg-green-500 rounded-full relative" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">TLS 1.3 Active</span>
                            </div>
                            <div className="h-6 w-[1px] bg-blue-100" />
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Keys</p>
                                <p className="text-lg font-black text-blue-600 leading-none">{activePatients.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {activeLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100 mt-10">
                        <FaSpinner className="text-3xl text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Filtering Vault Access...</p>
                    </div>
                ) : activeError ? (
                    <div className="p-12 bg-red-50 rounded-3xl border-2 border-red-100 text-center mt-10">
                        <p className="text-red-500 font-black text-lg">{activeError}</p>
                    </div>
                ) : activePatients.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-32 text-center group hover:border-blue-100 transition-colors mt-10">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300 group-hover:scale-110 group-hover:text-blue-200 transition-all duration-500">
                            <FaLock size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Vault Empty</h3>
                        <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed text-lg">
                            Any authorized troubleshooting sessions will appear here automatically when users grant access.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activePatients.map((req) => (
                            <div key={req.id} className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] hover:-translate-y-2 overflow-hidden border-2 hover:border-blue-100">
                                {/* Session Status Overlay */}
                                <div className="absolute top-0 right-0 p-6">
                                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 scale-90 group-hover:scale-100 transition-all">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Live Session</span>
                                    </div>
                                </div>

                                {/* Identity Section */}
                                <div className="flex items-center gap-6 mb-8 mt-4">
                                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 group-hover:rotate-6 transition-all duration-500">
                                        <FaUserShield size={28} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-2xl font-black text-gray-900 truncate">
                                            {req.patient?.full_name || 'Global Account'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">
                                                {req.owner?.full_name || 'Authorized User'}
                                            </span>
                                            <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                            <span className="text-[10px] font-bold text-blue-500">
                                                {req.patient ? 'Patient-Link' : 'Full Support'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Details */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/20">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <FaUserShield size={8} className="text-blue-500" /> Secure ID
                                        </p>
                                        <p className="text-xs font-black text-gray-700 tracking-tight">
                                            {req.patient?.patient_code || 'Account Global'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/20">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <FaCalendarAlt size={8} className="text-indigo-500" /> Access Log
                                        </p>
                                        <p className="text-xs font-black text-gray-700">
                                            {req.approved_at ? new Date(req.approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Tunnel */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const pId = req.patient?.patient_code || req.patient_id || req.patient?.id;
                                            if (pId) {
                                                navigate(`/patients/${pId}`);
                                            } else {
                                                navigate('/patients');
                                            }
                                        }}
                                        className="flex-[2] h-14 bg-gray-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 shadow-lg shadow-gray-200 hover:shadow-blue-200"
                                    >
                                        <FaUserShield className="text-blue-400 text-sm md:text-xl" /> Access Data Stream
                                    </button>
                                    <button
                                        onClick={() => handleRevoke(req)}
                                        className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-90"
                                        title="Revoke and close session"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminSupportRequests;
