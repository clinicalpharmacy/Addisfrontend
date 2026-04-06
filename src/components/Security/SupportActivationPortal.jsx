import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaShieldAlt, FaUserShield, FaCheckCircle, 
    FaSpinner, FaPowerOff, FaHandshake, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../utils/api';
import { getEncryptionKey, encryptForRecipient, bytesToHex } from '../../utils/encryptionUtils';

/**
 * 🛡️ SupportActivationPortal (Patient-Specific)
 * Refined implementation with unified Hex format and no loops.
 */
const SupportActivationPortal = ({ recipient, patientId }) => {
    const [loading, setLoading] = useState(true);
    const [granting, setGranting] = useState(false);
    const [activeAccess, setActiveAccess] = useState(null);

    const checkAccess = useCallback(async () => {
        if (!patientId) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/access/granted?patient_id=${patientId}`);
            if (res.success && res.request) {
                setActiveAccess(res.request);
            } else {
                setActiveAccess(null);
            }
        } catch (err) {
            console.error("Patient access sync error", err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        setLoading(true);
        checkAccess();
    }, [checkAccess]);

    const handleToggleOn = async () => {
        if (!recipient?.id) {
            alert("❌ Specialist Identity Missing: The system hasn't found an authorized specialist to link with yet. Please wait or refresh.");
            return;
        }
        if (!patientId) {
            alert("❌ Patient Context Lost: Cannot activate troubleshooting without a valid patient record identification.");
            return;
        }

        console.log("🚀 [Support] Activating tunnel for patient:", patientId, "with specialist:", recipient.id);
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
            
            if (!recipient.public_key) {
                alert("⚠️ Specialist Security Offline: The selected specialist has not initialized their security keys. They cannot receive encrypted data yet.");
                setGranting(false);
                return;
            }

            const encryptedKey = await encryptForRecipient(rawKeyHex, recipient.public_key);
            console.log("🛰️ [Support] Requesting backend sync...");

            const res = await api.post('/access/support-activate', {
                patient_id: patientId,
                admin_id: recipient.id,
                encrypted_key: encryptedKey
            });

            if (res.success) {
                console.log("✅ [Support] Tunnel established.");
                if (onRefresh) onRefresh();
            } else {
                alert("❌ Remote Sync Failed: " + (res.error || "The server rejected the security tunnel request. Please try again."));
            }
        } catch (err) {
            console.error("❌ [Support] Activation error:", err);
            alert("🚨 Security Handshake Failed: " + (err.message || "An unexpected error occurred while establishing the encrypted tunnel. Check your internet connection."));
        } finally {
            setGranting(false);
        }
    };

    const handleToggleOff = async () => {
        if (!activeAccess) return;
        
        setGranting(true);
        try {
            await api.post('/access/reject', { request_id: activeAccess.id });
            await checkAccess();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setGranting(false);
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
                <FaShieldAlt size={160} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 rounded-2xl shadow-xl transition-all ${activeAccess ? 'bg-green-600 shadow-green-100 text-white' : 'bg-blue-600 shadow-blue-100 text-white'}`}>
                        <FaUserShield size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Troubleshooting Access</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            Specialist: <span className="text-blue-600">{recipient?.full_name || 'Authorized Admin'}</span>
                        </p>
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] flex items-center justify-between transition-all duration-500 border-2 ${activeAccess ? 'bg-green-50/50 border-green-200' : (recipient ? 'bg-gray-50 border-gray-100' : 'bg-gray-50/50 border-gray-100 italic opacity-60')}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeAccess ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-300 shadow-inner'}`}>
                            {recipient ? <FaPowerOff size={20} className={activeAccess ? 'animate-pulse' : ''} /> : <FaSpinner className="animate-spin" />}
                        </div>
                        <div>
                            <p className={`text-lg font-black leading-none ${activeAccess ? 'text-green-800' : (recipient ? 'text-gray-400' : 'text-gray-300')}`}>
                                {!recipient ? 'Seeking Specialist...' : (activeAccess ? 'Tunnel Active' : 'Tunnel Closed')}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1">
                                {activeAccess ? <><FaCheckCircle className="text-green-500" /> Specialist Authorised</> : (recipient ? (recipient.public_key ? 'Secure Encryption Ready' : 'Security Setup Required') : 'Authenticating Route...')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (!recipient) {
                                alert("❌ No specialists found. Please ensure a system admin has activated their security credentials in the Support Vault.");
                                return;
                            }
                            if (!recipient.public_key) {
                                alert("⚠️ Specialist Security Offline: This administrator has not yet initialized their end-to-end security keys. They must go to the Admin Dashboard > Support Vault and click 'Activate Specialist Credentials' before they can receive encrypted troubleshooting access.");
                                return;
                            }
                            activeAccess ? handleToggleOff() : handleToggleOn();
                        }}
                        disabled={granting}
                        className={`relative w-20 h-10 rounded-full transition-all duration-300 p-1 flex items-center shadow-inner ${activeAccess ? 'bg-green-500' : (recipient?.public_key ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-300')} ${granting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${activeAccess ? 'translate-x-10' : 'translate-x-0'}`}>
                            {granting ? <FaSpinner className="animate-spin text-blue-500 text-[10px]" /> : (recipient?.public_key ? <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />)}
                        </div>
                    </button>
                </div>

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
