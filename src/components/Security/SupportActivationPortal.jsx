import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaShieldAlt, FaUserShield, FaCheckCircle, 
    FaSpinner, FaPowerOff, FaHandshake, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../utils/api';
import { getEncryptionKey, encryptForRecipient } from '../../utils/encryptionUtils';

/**
 * 🛡️ SupportActivationPortal (Patient-Specific)
 * Upgraded with the ON/OFF Master Toggle.
 */
const SupportActivationPortal = ({ recipient, patientId, ownerSalt }) => {
    const [loading, setLoading] = useState(true);
    const [isGranting, setIsGranting] = useState(false);
    const [activeAccess, setActiveAccess] = useState(null);

    const checkCurrentAccess = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            // Check if this specific patient already has an active grant for this specialist
            const res = await api.get(`/access/granted?patient_id=${patientId}`);
            if (res.success && res.request) {
                setActiveAccess(res.request);
            } else {
                setActiveAccess(null);
            }
        } catch (err) {
            console.error("Failed to check patient access status", err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        checkCurrentAccess();
    }, [checkCurrentAccess]);

    const handleToggleOn = async () => {
        if (!recipient?.id || !patientId || !ownerSalt) {
            alert("❌ Missing security anchor (salt). Please reload.");
            return;
        }

        setIsGranting(true);
        try {
            const masterKey = await getEncryptionKey();
            if (!masterKey) throw new Error("Verification required. Please re-login.");

            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            const rawKeyHex = Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Encrypt for the specific recipient (admin)
            const encryptedKey = await encryptForRecipient(rawKeyHex, recipient.public_key);

            const res = await api.post('/access/support-activate', {
                patient_id: patientId,
                admin_id: recipient.id,
                encrypted_key: encryptedKey
            });

            if (res.success) {
                checkCurrentAccess();
            }
        } catch (err) {
            alert("❌ Activation Failed: " + err.message);
        } finally {
            setIsGranting(false);
        }
    };

    const handleToggleOff = async () => {
        if (!activeAccess) return;
        
        setIsGranting(true);
        try {
            // Using the global reject/revoke logic
            await api.post('/access/reject', { request_id: activeAccess.id });
            setActiveAccess(null);
            checkCurrentAccess();
        } catch (err) {
            alert("❌ Revoking Access Failed: " + err.message);
        } finally {
            setIsGranting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl animate-pulse">
                <FaSpinner className="text-2xl text-blue-500 animate-spin mb-3" />
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[8px]">Verifying Vault Integrity...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden transition-all hover:border-blue-100">
            {/* Background design elements */}
            <div className="absolute -right-10 -top-10 text-blue-50 opacity-50 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <FaShieldAlt size={160} />
            </div>

            <div className="relative z-10">
                {/* Header Context */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 rounded-2xl shadow-xl transition-all ${activeAccess ? 'bg-green-600 shadow-green-100 text-white' : 'bg-blue-600 shadow-blue-100 text-white'}`}>
                        <FaUserShield size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Troubleshooting Access</h3>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            Assigned to: <span className="text-blue-600">{recipient?.full_name || 'System Administrator'}</span>
                        </p>
                    </div>
                </div>

                <p className="text-gray-500 font-medium text-xs leading-relaxed mb-8 max-w-md">
                    Authorizing a specialist creates a secure, temporary decryption session for this patient record.
                    Flip the toggle to <span className="text-gray-900 font-black">ON</span> to grant access now.
                </p>

                {/* THE MASTER TOGGLE CARD */}
                <div className={`p-6 rounded-[2rem] flex items-center justify-between transition-all duration-500 border-2 ${activeAccess ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeAccess ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-300 shadow-inner'}`}>
                            <FaPowerOff size={20} className={activeAccess ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <p className={`text-lg font-black leading-none ${activeAccess ? 'text-green-800' : 'text-gray-400'}`}>
                                {activeAccess ? 'Access Authorized' : 'Access Revoked'}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1">
                                {activeAccess ? <><FaCheckCircle className="text-green-500" /> Active Session Ready</> : 'Secure Encryption Priority'}
                            </p>
                        </div>
                    </div>

                    {/* TOGGLE SWITCH */}
                    <button
                        onClick={activeAccess ? handleToggleOff : handleToggleOn}
                        disabled={isGranting || !recipient?.public_key}
                        className={`relative w-20 h-10 rounded-full transition-all duration-300 p-1 flex items-center shadow-inner ${activeAccess ? 'bg-green-500 shadow-green-200' : 'bg-gray-300'} ${isGranting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${activeAccess ? 'translate-x-10' : 'translate-x-0'}`}>
                            {isGranting ? <FaSpinner className="animate-spin text-blue-500 text-xs" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />}
                        </div>
                    </button>
                </div>

                {/* Warning Footer */}
                <div className="mt-8 flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
                        Encryption Warning: Only authorized System Personnel with certified keys can access the decryption matrix while the toggle is active.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportActivationPortal;
