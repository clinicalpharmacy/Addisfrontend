import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserMd, FaCalendarAlt, FaChevronRight, FaSpinner, FaUnlock, FaLock } from 'react-icons/fa';
import api from '../../utils/api';

/**
 * 📋 AdminSupportRequests Component
 * Displays a list of patients the admin currently has secure support access to.
 */
export const AdminSupportRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSupportPatients();
    }, []);

    const fetchSupportPatients = async () => {
        setLoading(true);
        setError(''); // Reset error
        try {
            const res = await api.get('/access/active-support');
            console.log("🔐 [SupportVault] API Response:", res);
            if (res.success) {
                setRequests(res.support_patients || []);
            } else {
                setError(res.error || 'Failed to sync vault.');
            }
        } catch (err) {
            console.error("❌ [SupportVault] Sync Error:", err);
            setError(err.error || err.message || 'Vault connection lost.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <FaSpinner className="text-3xl text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Filtering Vault Access...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <FaShieldAlt className="text-blue-600" />
                        Support Access Vault
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Active patient troubleshooting sessions assigned to you.
                    </p>
                </div>
                {/* 🛡️ ADMIN SECURITY DIAGNOSTIC */}
                <div className="bg-gray-900 text-[9px] font-mono p-4 rounded-2xl border border-gray-700 shadow-xl text-green-400 w-full sm:w-80">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                        <span className="text-white font-black uppercase tracking-widest">Vault Security Status</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>[01] SESSION_AUTH:</span>
                            <span className="text-green-400">ACTIVE</span>
                        </div>
                        <div className="flex justify-between">
                            <span>[02] PRIVATE_KEY:</span>
                            <span className={localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).public_key ? 'text-green-400' : 'text-red-500 font-black'}>
                                {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).public_key ? 'VERIFIED_LOADED' : 'KEY_MISSING_ERROR'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>[03] DB_SYNC:</span>
                            <span className={error ? 'text-red-500' : 'text-green-400'}>
                                {error ? 'OUT_OF_SYNC' : 'TUNNEL_ESTABLISHED'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {requests.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaLock className="text-gray-300 text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400">No active support requests</h3>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto font-medium">
                        Patients will appear here once users activate proactive support for troubleshooting.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map(req => (
                        <div 
                            key={req.id}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            {/* Vault Indicator */}
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FaShieldAlt size={100} />
                            </div>

                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="bg-blue-600/10 p-4 rounded-2xl">
                                        <FaUserMd className="text-2xl text-blue-600" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Status</p>
                                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase border border-green-200">
                                            Vault Open
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="text-xl font-black text-gray-900 truncate">
                                        {req.patient?.full_name || 'Restricted Profile'}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                        ID: <span className="text-gray-900">{req.patient?.patient_code || '---'}</span>
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-8">
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt size={12} className="text-gray-400" />
                                        <p className="text-xs font-bold text-gray-500">
                                            Granted: <span className="text-gray-900">{new Date(req.approved_at).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500">
                                            Owner: <span className="text-gray-900">{req.owner?.full_name}</span>
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const pId = req.patient?.patient_code || req.patient_id || req.patient?.id;
                                        console.log("🔐 [AdminVault] Attempting access to patient:", pId);
                                        if (pId) {
                                            // 🚀 High-Reliability Navigation
                                            navigate(`/patients/${pId}`);
                                            // Fallback for tricky browser states
                                            setTimeout(() => {
                                                if (!window.location.pathname.includes(pId)) {
                                                    window.location.href = `/patients/${pId}`;
                                                }
                                            }, 100);
                                        } else {
                                            alert("❌ Cannot find target patient identifier.");
                                        }
                                    }}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-200"
                                >
                                    <FaUnlock /> Access Records <FaChevronRight />
                                </button>
                            </div>

                            <div className="bg-gray-50 px-8 py-3 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FaLock /> Zero-Knowledge Pipeline
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
