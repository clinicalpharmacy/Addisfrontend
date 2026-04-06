import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaShieldAlt, FaUserMd, FaCalendarAlt, 
    FaSpinner, FaUnlock, FaLock, FaCheck, FaTimes,
    FaEnvelope, FaSync, FaUserShield, FaSignal
} from 'react-icons/fa';
import api from '../../utils/api';

/**
 * 🔐 SupportVault Component
 * High-security, compact UI for active troubleshooting sessions.
 */
export const SupportVault = () => {
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
        if (!window.confirm(`Terminate session with ${req.owner?.full_name || 'this user'}?`)) return;
        try {
            await api.post('/access/reject', { request_id: req.id });
            setSuccessMsg(`🚫 Session terminated.`);
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchActivePatients();
        } catch (err) {
            alert('❌ Revoke failed: ' + (err.error || err.message));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Compact Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FaShieldAlt className="text-blue-500 text-xs" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Security Sector</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
                        Support <span className="text-blue-600">Vault</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                     <button
                        onClick={fetchActivePatients}
                        className="bg-white border border-gray-100 p-3 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                    >
                        <FaSync className={activeLoading ? 'animate-spin' : ''} size={14} />
                    </button>
                    <div className="flex items-center gap-4 bg-gray-900 px-5 py-2.5 rounded-2xl border border-gray-800 shadow-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">TLS 1.3</span>
                        </div>
                        <div className="w-[1px] h-3 bg-gray-700" />
                        <div className="text-center">
                            <span className="text-[8px] font-black text-gray-500 uppercase block leading-none mb-0.5">Active Keys</span>
                            <span className="text-sm font-black text-blue-400 leading-none">{activePatients.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs border border-white/10 animate-in slide-in-from-top-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full" /> {successMsg}
                </div>
            )}

            {activeLoading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white/50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <FaSpinner className="text-2xl text-blue-500 animate-spin mb-3" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Decrypting Access Matrix...</p>
                </div>
            ) : activeError ? (
                <div className="p-8 bg-red-50/50 rounded-[2rem] border border-red-100 text-center">
                    <p className="text-red-500 font-bold text-xs">{activeError}</p>
                </div>
            ) : activePatients.length === 0 ? (
                <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[3rem] p-24 text-center group hover:border-blue-100 transition-all duration-500">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 group-hover:scale-110 group-hover:text-blue-200 group-hover:shadow-xl transition-all">
                        <FaLock size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-1">Vault Offline</h3>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed text-xs">
                        Awaiting troubleshooting authorization from users.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activePatients.map((req) => (
                        <div key={req.id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 overflow-hidden active:scale-[0.98]">
                            
                            {/* Status Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:rotate-12 transition-all">
                                        <FaUserShield size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-base font-black text-gray-900 truncate tracking-tight">
                                            {req.patient?.full_name || 'Global Account'}
                                        </h4>
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                            {req.patient ? 'Patient-Bound' : 'Full Specialist Access'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-green-50 text-green-600 px-2.5 py-1.5 rounded-xl border border-green-100 flex items-center gap-1.5 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                    <FaSignal size={10} className="animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Active</span>
                                </div>
                            </div>

                            {/* User Context */}
                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-6 group-hover:bg-blue-50/30 group-hover:border-blue-100/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 group-hover:border-blue-200">
                                        <FaUserMd className="text-blue-500 text-xs" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Owner Identity</p>
                                        <p className="text-[11px] font-black text-gray-700 truncate leading-none">{req.owner?.full_name || 'Authorized User'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Granted On</p>
                                        <p className="text-[11px] font-black text-gray-700 leading-none">
                                            {req.approved_at ? new Date(req.approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-inner shadow-gray-50/50">
                                    <div className="flex items-center gap-1.5 mb-1 opacity-40">
                                        <FaLock size={8} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Vault ID</span>
                                    </div>
                                    <p className="text-[11px] font-black text-gray-800 tracking-tight">
                                        {req.patient?.patient_code || 'Account Global'}
                                    </p>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-inner shadow-gray-50/50">
                                    <div className="flex items-center gap-1.5 mb-1 opacity-40">
                                        <FaCalendarAlt size={8} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Last Access</span>
                                    </div>
                                    <p className="text-[11px] font-black text-gray-800">
                                        {req.updated_at ? new Date(req.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just Now'}
                                    </p>
                                </div>
                            </div>

                            {/* Compact Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const pId = req.patient?.patient_code || req.patient_id || req.patient?.id;
                                        if (pId) navigate(`/patients/${pId}`);
                                        else navigate('/patients');
                                    }}
                                    className="flex-[3] h-12 bg-gray-950 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95 shadow-lg shadow-gray-200 hover:scale-[1.02]"
                                >
                                    <FaUnlock size={10} className="text-blue-400 group-hover:text-white" /> Access Stream
                                </button>
                                <button
                                    onClick={() => handleRevoke(req)}
                                    className="flex-1 h-12 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-90"
                                    title="Close Vault"
                                >
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SupportVault;
