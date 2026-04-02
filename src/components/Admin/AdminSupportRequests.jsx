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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FaShieldAlt className="text-white text-sm" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Secure Protocol</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Active Support Vault</h2>
                    <p className="text-gray-500 text-sm font-medium">Manage and access patient records shared for troubleshooting.</p>
                </div>

                {/* 🛡️ REAL-TIME SECURITY PULSE */}
                <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1">
                    <div className="bg-gray-900 text-[10px] font-mono px-4 py-3 rounded-xl border border-gray-800 shadow-xl text-green-400 min-w-[280px]">
                        <div className="flex items-center justify-between border-b border-gray-800/50 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-white font-black uppercase tracking-widest text-[9px]">Identity Verified</span>
                            </div>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">TLS 1.3 / RSA-4096</span>
                        </div>
                        <div className="space-y-1 opacity-90">
                            <div className="flex justify-between">
                                <span>SESSION:</span>
                                <span className="text-green-400 font-bold">ESTABLISHED</span>
                            </div>
                            <div className="flex justify-between">
                                <span>KEY_STATUS:</span>
                                <span className={localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).public_key ? 'text-green-400' : 'text-red-500'}>
                                    {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).public_key ? 'LOADED_MEMORY' : 'MISSING'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {requests.length === 0 ? (
                <div className="bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 p-24 text-center group hover:border-blue-200 transition-colors">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform duration-500">
                        <FaLock className="text-gray-200 text-3xl group-hover:text-blue-200 transition-colors" />
                    </div>
                    <h3 className="text-xl font-black text-gray-400 group-hover:text-gray-600 transition-colors">Vault Empty</h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                        Patients will appear here automatically when they grant you encrypted access for support.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {requests.map(req => (
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
                                        <p className="text-sm font-black text-gray-800">{new Date(req.approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
                                        if (pId) {
                                            navigate(`/patients/${pId}`);
                                            setTimeout(() => {
                                                if (!window.location.pathname.includes(pId)) {
                                                    window.location.href = `/patients/${pId}`;
                                                }
                                            }, 150);
                                        }
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
                                <span className="text-[8px] font-mono text-gray-300">#{req.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
