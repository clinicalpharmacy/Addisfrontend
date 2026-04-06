import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaUserShield, FaCheckCircle, FaLock,
    FaSpinner, FaPowerOff, FaHandshake, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../utils/api';
import { getEncryptionKey, encryptForRecipient, bytesToHex } from '../../utils/encryptionUtils';

/**
 * 🛡️ SupportActivationPortal (Patient-Specific)
 * Hierarchical implementation with Global Gateway detection.
 */
const SupportActivationPortal = ({ recipient, patientId, onRefresh }) => {
    const [loading, setLoading] = useState(true);
    const [granting, setGranting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [manualEmail, setManualEmail] = useState('');
    const [manualRecipient, setManualRecipient] = useState(null);
    const [activeAccess, setActiveAccess] = useState(null);
    const [globalActive, setGlobalActive] = useState(false);

    const checkAccess = useCallback(async () => {
        if (!patientId) {
            setLoading(false);
            return;
        }
        try {
            // 1. Check patient-specific access
            const res = await api.get(`/access/granted?patient_id=${patientId}`);
            if (res.success && res.request) {
                setActiveAccess(res.request);
                if (res.request.requester) {
                    setManualRecipient(res.request.requester);
                }
            } else {
                setActiveAccess(null);
            }

            // 2. Check GLOBAL access for the recipient (Gateway Status)
            const target = manualRecipient || recipient;
            if (target?.id) {
                const globalRes = await api.get(`/access/granted?admin_id=${target.id}`);
                setGlobalActive(!!(globalRes.success && globalRes.request));
            }
        } catch (err) {
            console.error("Patient access sync error", err);
        } finally {
            setLoading(false);
        }
    }, [patientId, manualRecipient, recipient]);

    useEffect(() => {
        setLoading(true);
        checkAccess();
        
        // 🧪 RESCUE FALLBACK: Check for manually injected specialist
        const forceSpecialist = localStorage.getItem('support_fallback_specialist');
        if (forceSpecialist && !manualRecipient && !recipient) {
            try {
                const parsed = JSON.parse(forceSpecialist);
                setManualRecipient(parsed);
            } catch (e) { }
        }
    }, [checkAccess, manualRecipient, recipient]);

    const handleToggleOn = async () => {
        const target = manualRecipient || recipient;
        if (!target?.id) return;
        if (!patientId) return;

        console.log("🚀 [Support] Activating tunnel for patient:", patientId, "with specialist:", target.id);
        setGranting(true);
        try {
            const masterKey = await getEncryptionKey();
            if (!masterKey) {
                alert("🔐 Authentication Timeout: Your local session key has expired. Please log out and log back in to verify your identity.");
                setGranting(false);
                return;
            }

            console.log("🔑 [Support] Master Key derived. Wrapping for recipient...");
            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            const rawKeyHex = bytesToHex(new Uint8Array(rawKey));
            
            if (!target.public_key) {
                alert("🛡️ Specialist Handshake Required: Handshake found but security vault needs initialization.");
                setGranting(false);
                return;
            }

            const encryptedKey = await encryptForRecipient(rawKeyHex, target.public_key);
            console.log("🛰️ [Support] Requesting backend sync...");

            const res = await api.post('/access/support-activate', {
                patient_id: patientId,
                admin_id: target.id,
                encrypted_key: encryptedKey
            });

            if (res.success) {
                console.log("✅ [Support] Tunnel established.");
                if (onRefresh) onRefresh();
                await checkAccess();
            } else {
                alert("❌ Remote Sync Failed: " + (res.error || "The server rejected the security tunnel request. Please try again."));
            }
        } catch (err) {
            console.error("❌ [Support] Activation error:", err);
            alert("🚨 Security Handshake Failed: " + (err.message || "An unexpected error occurred while establishing the encrypted tunnel."));
        } finally {
            setGranting(false);
        }
    };

    const handleToggleOff = async () => {
        if (!activeAccess) return;
        setGranting(true);
        try {
            await api.post('/access/reject', { request_id: activeAccess.id });
            if (onRefresh) onRefresh();
            setManualRecipient(null);
            await checkAccess();
        } catch (err) {
            alert("Revoke Failed: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    const handleManualSearch = async (e) => {
        if (e) e.preventDefault();
        setSearching(true);
        try {
            const res = await api.get(`/auth/search?email=${manualEmail}`);
            if (res.success && res.user) {
                setManualRecipient(res.user);
            } else {
                alert("❌ Specialist not found in registry.");
            }
        } catch (err) {
            alert("❌ Search failed: " + (err.error || err.message));
        } finally {
            setSearching(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center animate-pulse bg-blue-50/30 rounded-[2rem]">
                <FaSpinner className="animate-spin mx-auto text-blue-500 mb-2" size={24} />
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">Syncing Matrix Access...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden transition-all group">
            <div className="absolute -right-10 -top-10 text-blue-50 opacity-40 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                <FaUserShield size={160} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 rounded-2xl shadow-xl transition-all ${activeAccess ? 'bg-green-600 shadow-green-100 text-white' : 'bg-blue-600 shadow-blue-100 text-white'}`}>
                        <FaUserShield size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Troubleshooting Access</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            Specialist: <span className="text-blue-600">{(manualRecipient || recipient)?.full_name || 'Authorized Admin'}</span>
                        </p>
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] flex items-center justify-between transition-all duration-500 border-2 ${activeAccess ? 'bg-green-50/50 border-green-200' : (!globalActive ? 'bg-rose-50 border-rose-100' : ((manualRecipient || recipient) ? 'bg-gray-50 border-gray-100' : 'bg-gray-50/50 border-gray-100 italic opacity-60'))}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeAccess ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-300 shadow-inner'}`}>
                            {(manualRecipient || recipient) ? <FaPowerOff size={20} className={activeAccess ? 'animate-pulse' : ''} /> : <FaSpinner className="animate-spin" />}
                        </div>
                        <div>
                            <p className={`text-lg font-black leading-none ${activeAccess ? 'text-green-800' : (!globalActive ? 'text-rose-600' : ((manualRecipient || recipient) ? 'text-gray-400' : 'text-gray-300'))}`}>
                                {!globalActive ? 'Gateway Locked' : (!(manualRecipient || recipient) ? 'Gateway Ready' : (activeAccess ? 'Tunnel Active' : 'Tunnel Ready'))}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1">
                                {activeAccess ? <><FaCheckCircle className="text-green-500" /> Specialist Authorised</> : (!globalActive ? <><FaLock className="text-rose-500" /> Master Connection Closed</> : ((manualRecipient || recipient) ? ((manualRecipient || recipient).public_key ? 'Encrypted Link Ready' : 'Security Setup Required') : 'Waiting for Specialist...'))}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (!globalActive) {
                                alert("🔒 Master Gateway Locked: The troubleshoot specialist must first activate their global connection before you can grant them access to this record.");
                                return;
                            }
                            const target = manualRecipient || recipient;
                            if (!target) return;
                            if (!target.public_key) {
                                alert("🛡️ Setup Required: The specialist must initialize their vault first.");
                                return;
                            }
                            activeAccess ? handleToggleOff() : handleToggleOn();
                        }}
                        disabled={granting || (!activeAccess && !globalActive)}
                        className={`relative w-20 h-10 rounded-full transition-all duration-300 p-1 flex items-center shadow-inner ${activeAccess ? 'bg-green-500' : (!globalActive ? 'bg-gray-300' : ((manualRecipient || recipient)?.public_key ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-300'))} ${granting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${activeAccess ? 'translate-x-10' : 'translate-x-0'}`}>
                            {granting ? <FaSpinner className="animate-spin text-blue-500 text-[10px]" /> : (!globalActive ? <FaLock className="text-gray-300 text-[10px]" /> : ((manualRecipient || recipient)?.public_key ? <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />))}
                        </div>
                    </button>
                </div>

                {!activeAccess && (
                    <div className="mt-8 animate-in slide-in-from-top-4 duration-500 bg-gray-50/50 rounded-3xl p-6 border border-dashed border-gray-200">
                        <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                             <FaHandshake className="text-blue-500" /> Alternative Specialist Selection
                        </h4>
                        <form onSubmit={handleManualSearch} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-2 pl-5 focus-within:ring-2 focus-within:ring-blue-500 shadow-sm transition-all">
                            <input
                                type="email"
                                placeholder="Link specialist via email..."
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-gray-700"
                                required
                            />
                            <button
                                type="submit"
                                disabled={searching || !manualEmail}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                {searching ? <FaSpinner className="animate-spin" /> : 'Override'}
                            </button>
                        </form>
                    </div>
                )}

                {!globalActive && (
                    <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                        <FaExclamationTriangle className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-rose-900 leading-none mb-1">Master Connection Required</p>
                            <p className="text-[10px] text-rose-800/60 font-medium leading-relaxed">
                                This specialist is currently non-addressable. They must open their global troubleshoot connection in settings before you can establish an encrypted tunnel.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex items-start gap-4">
                    <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5 opacity-50" />
                    <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed max-w-xs">
                        This toggle provides one-way decryption access for this record only. Flip to OFF any time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportActivationPortal;
