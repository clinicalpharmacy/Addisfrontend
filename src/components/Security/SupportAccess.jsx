import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaLifeRing, FaShieldAlt, FaKey, FaHandshake, FaCheckCircle, 
    FaExclamationTriangle, FaLock, FaUserShield, FaSpinner, FaPowerOff 
} from 'react-icons/fa';
import api from '../../utils/api';
import { getEncryptionKey, encryptForRecipient } from '../../utils/encryptionUtils';

/**
 * 🛠️ SupportAccess Component (User Side)
 * Implements the ON/OFF Master Toggle for troubleshooting.
 */
const SupportAccess = () => {
    const [loading, setLoading] = useState(true);
    const [granting, setGranting] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [activeAccess, setActiveAccess] = useState(null);
    const [selectedAdminId, setSelectedAdminId] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch admins
            const adminRes = await api.get('/admin/security-users');
            if (adminRes.success) setAdmins(adminRes.users || []);

            // 2. Check for active account-wide (global) support grants
            const accessRes = await api.get('/access/my-active-grants');
            if (accessRes.success && accessRes.grants?.length > 0) {
                // Find a grant that is for account-wide (patient_id: null)
                const globalGrant = accessRes.grants.find(g => g.patient_id === null);
                setActiveAccess(globalGrant || null);
            } else {
                setActiveAccess(null);
            }
        } catch (err) {
            console.error("Failed to fetch support data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleOn = async () => {
        if (!selectedAdminId) {
            alert("❌ Please select a specialist first.");
            return;
        }

        const admin = admins.find(a => a.id === selectedAdminId);
        if (!admin) return;

        setGranting(true);
        try {
            const masterKey = await getEncryptionKey();
            if (!masterKey) throw new Error("Please log in again to verify your identity.");

            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            const rawKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
            const encryptedKey = await encryptForRecipient(rawKeyBase64, admin.public_key);

            const res = await api.post('/access/support-activate', {
                patient_id: null, // Account-wide
                admin_id: selectedAdminId,
                encrypted_key: encryptedKey
            });

            if (res.success) {
                fetchData();
            }
        } catch (err) {
            alert("❌ Activation Failed: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    const handleToggleOff = async () => {
        if (!activeAccess) return;
        if (!window.confirm("⚠️ This will instantly lock your data and remove support access. Continue?")) return;

        setGranting(true);
        try {
            // Using the revoke/reject endpoint
            await api.post('/access/reject', { request_id: activeAccess.id });
            setActiveAccess(null);
            fetchData();
        } catch (err) {
            alert("❌ Revoke Failed: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-50 rounded-3xl animate-pulse">
                <FaSpinner className="text-3xl text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing Security Status...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative group">
                <div className="absolute -right-12 -top-12 text-blue-50 opacity-50 group-hover:rotate-12 transition-transform duration-700">
                    <FaShieldAlt size={220} />
                </div>
                
                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100 text-white">
                            <FaUserShield size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 leading-none">Troubleshooting</h2>
                            <p className="text-blue-500 font-bold text-xs mt-1 uppercase tracking-widest">Master Privacy Control</p>
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Need help with your records? Toggle troubleshooting "ON" to securely authorize a specialist. 
                        You can kill the connection at any time by switching it "OFF".
                    </p>

                    {/* THE MASTER TOGGLE CARD */}
                    <div className={`p-6 rounded-3xl flex items-center justify-between transition-all duration-500 border-2 ${activeAccess ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeAccess ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-white text-gray-300'}`}>
                                <FaPowerOff size={24} className={activeAccess ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <p className={`text-xl font-black leading-none ${activeAccess ? 'text-green-800' : 'text-gray-400'}`}>
                                    {activeAccess ? 'System Active' : 'System Locked'}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                                    {activeAccess ? `Support session with ${activeAccess.requester?.full_name || 'Specialist'}` : 'Privacy protocol prioritized'}
                                </p>
                            </div>
                        </div>

                        {/* TOGGLE SWITCH */}
                        <button
                            onClick={activeAccess ? handleToggleOff : handleToggleOn}
                            disabled={granting || (!activeAccess && !selectedAdminId)}
                            className={`relative w-20 h-10 rounded-full transition-all duration-300 p-1 flex items-center shadow-inner ${activeAccess ? 'bg-green-500' : 'bg-gray-300'} ${granting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${activeAccess ? 'translate-x-10' : 'translate-x-0'}`}>
                                {granting ? <FaSpinner className="animate-spin text-blue-500 text-xs" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Selection (Visible when OFF) */}
            {!activeAccess && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm animate-in slide-in-from-top-6 duration-500">
                    <h4 className="font-black text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 border border-gray-100">
                            <FaHandshake size={14} />
                        </div>
                        Target Specialist
                    </h4>
                    
                    <div className="space-y-4">
                        {admins.map(admin => (
                            <div 
                                key={admin.id} 
                                onClick={() => setSelectedAdminId(admin.id)}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedAdminId === admin.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 bg-gray-50 hover:bg-gray-100/50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${selectedAdminId === admin.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                                        {admin.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-800 text-sm">{admin.full_name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                            <FaCheckCircle className="text-green-500" /> Verified Support Official
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAdminId === admin.id ? 'border-blue-600' : 'border-gray-200'}`}>
                                    {selectedAdminId === admin.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Specialist Card (Visible when ON) */}
            {activeAccess && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm animate-in zoom-in-95 duration-500">
                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                                <FaCheckCircle size={28} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900">Support Authorized</h4>
                                <p className="text-sm text-gray-400 font-medium">Session linked to {activeAccess.requester?.full_name || 'an administrator'}.</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            Live Tunnel
                        </div>
                    </div>
                </div>
            )}

            {/* Security Notice */}
            <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 flex items-start gap-4">
                <FaExclamationTriangle className="text-red-500 mt-1 shrink-0" />
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                    <span className="font-black uppercase tracking-widest text-[9px] block mb-1">Caution</span>
                    Flipping the troubleshooting toggle to <span className="font-black">ON</span> provides a specialist with temporary, local-only decryption access to your records. Always verify the specialist's identity before activation.
                </p>
            </div>
        </div>
    );
};

export default SupportAccess;
