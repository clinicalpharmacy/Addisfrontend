import React, { useState, useEffect } from 'react';
import { FaLock, FaKey, FaShieldAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import {
    getEncryptionKey, deriveKey, decryptPatient,
    hexToBytes, loadPrivateKey, decryptWithPrivateKey
} from '../utils/encryptionUtils';
import api from '../utils/api';
import SecurityActivator from './Security/SecurityActivator';

/**
 * PatientUnlocker — gates all patient content until decrypted.
 * Handles both standard owner decryption and administrative support decryption.
 */
const PatientUnlocker = ({ patientData, userSalt, onUnlocked, children }) => {
    const [passphrase, setPassphrase] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('loading'); // loading, prompt, decrypted, missing_keys
    const [grantedKey, setGrantedKey] = useState(null);

    useEffect(() => {
        init();
    }, [patientData?.id]);

    const init = async () => {
        try {
            // 0. QUICK CHECK: Is it already decrypted? (e.g. by parent)
            if (patientData?.full_name && !String(patientData.full_name).includes(':')) {
                setStatus('decrypted');
                return;
            }

            setStatus('loading');
            setError('');

            // 1. MASTER KEY check (for Owner or anyone with session-cached Master Key)
            const masterKey = await getEncryptionKey();
            if (masterKey) {
                const decrypted = await decryptPatient(patientData, masterKey);
                if (decrypted && decrypted.full_name && !String(decrypted.full_name).includes(':')) {
                    onUnlocked(decrypted);
                    setStatus('decrypted');
                    return;
                }
            }

            // 2. SUPPORT SESSION check (for Admins)
            try {
                const res = await api.get(`/access/granted?patient_id=${patientData.id}`);
                if (res.success && res.request) {
                    const encryptedKey = res.request.encrypted_key;
                    
                    // AUTO-RESTORE: Try silent decryption if identity (Private Key) was already verified this session
                    const privKey = await loadPrivateKey(); 
                    if (privKey) {
                        try {
                            const pKey = await decryptWithPrivateKey(res.request.encrypted_key, privKey);
                            const decrypted = await decryptPatient(patientData, pKey);
                            if (decrypted && !String(decrypted.full_name).includes(':')) {
                                onUnlocked(decrypted);
                                setStatus('decrypted');
                                return;
                            }
                        } catch (decErr) {
                            console.warn("Silent unlock failed:", decErr);
                        }
                    }

                    setGrantedKey(encryptedKey);
                    setStatus('prompt');
                    return;
                }
            } catch (err) {
                console.warn('Granted check failed:', err);
            }

            // 3. SECURE IDENTITY check (RSA Key availability)
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.private_key_encrypted) {
                setStatus('prompt');
            } else {
                setStatus('missing_keys');
            }

        } catch (err) {
            console.error('Unlocker Init Error:', err);
            setStatus('prompt');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUnlocking(true);
        setError('');

        try {
            const salt = userSalt;
            if (!salt) throw new Error("Security salt not found for this patient owner.");

            // A. Derive Master Key from password
            const masterKey = await deriveKey(passphrase.trim(), salt);

            // B. If it's a support session, decrypt the granted administrative key
            if (grantedKey) {
                await decryptAndShow(masterKey, grantedKey);
            } else {
                // C. Standard Owner Unlock: Load private key using master key
                const privateKey = await loadPrivateKey(masterKey); 
                if (!privateKey) throw new Error("Security key not found. Go to Settings → activate security keys.");

                // For the owner, we find the request record where they are the requester (or owner) 
                // but usually, owners decrypt via their own key stored in the patient record.
                // Assuming patient record has the key:
                const decrypted = await decryptPatient(patientData, null, masterKey);
                if (decrypted) {
                    onUnlocked(decrypted);
                    setStatus('decrypted');
                } else {
                    throw new Error("Decryption failed. Check your password.");
                }
            }
        } catch (err) {
            setError(err.message || "Failed to unlock record.");
        } finally {
            setIsUnlocking(false);
        }
    };

    const decryptAndShow = async (masterKey, encryptedAdminKey) => {
        try {
            // 1. Unwrap the user's private key using the Master Key (derived from password)
            const privateKey = await loadPrivateKey(masterKey);
            if (!privateKey) throw new Error("Could not restore your secure identity.");

            // 2. Decrypt the patient's AES key using the user's private key
            const patientKey = await decryptWithPrivateKey(privateKey, encryptedAdminKey);
            if (!patientKey) throw new Error("This support session has expired or is invalid.");

            // 3. Decrypt the patient data using the AES key
            const decrypted = await decryptPatient(patientData, patientKey);
            if (decrypted) {
                onUnlocked(decrypted);
                setStatus('decrypted');
            } else {
                throw new Error("Failed to decrypt record.");
            }
        } catch (err) {
            throw err;
        }
    };

    // If already decrypted or just unlocked, render the patient content
    if (status === 'decrypted') return <>{children}</>;

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
                <FaSpinner className="text-3xl text-blue-500 animate-spin" />
                <p className="text-sm font-medium">Loading record...</p>
            </div>
        );
    }

    // Prompt for missing security keys (Inline Fix)
    if (status === 'missing_keys') {
        return (
            <div className="flex items-center justify-center min-h-[40vh] p-4 text-center">
                <div className="max-w-md w-full">
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
                            <FaShieldAlt className="text-orange-600 text-2xl animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Security Activation Required</h3>
                        <p className="text-sm text-gray-500 mt-2">To view this patient's private details, you must first activate your secure digital identity.</p>
                    </div>
                    <SecurityActivator onActivated={() => init()} />
                    <button 
                        onClick={() => setStatus('prompt')}
                        className="mt-6 text-blue-600 hover:underline text-sm font-bold block mx-auto"
                    >
                        Already have keys? Try standard unlock
                    </button>
                </div>
            </div>
        );
    }

    // Password prompt (admin or session expired)
    if (status === 'prompt') {
        return (
            <div className="flex items-center justify-center min-h-[40vh] p-2 sm:p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden transform transition-all">
                    <div className={`p-6 sm:p-8 text-white text-center ${grantedKey ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                            {grantedKey ? <FaKey className="text-xl sm:text-2xl" /> : <FaShieldAlt className="text-xl sm:text-2xl" />}
                        </div>
                        <h2 className="text-lg sm:text-xl font-black tracking-tight">
                            {grantedKey ? 'Support Access' : 'Secure Unlock'}
                        </h2>
                        <p className="text-white/80 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-[220px] mx-auto">
                            {grantedKey
                                ? 'Confirm your identity to proceed with troubleshooting.'
                                : 'Enter your password to safely decrypt this clinical record.'}
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Login Password</label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={e => setPassphrase(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 text-sm font-bold"
                                autoFocus
                            />
                        </div>
                        
                        {error && (
                            <div className="space-y-3">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in shake duration-500">
                                    <FaExclamationTriangle className="shrink-0" />
                                    <p className="text-xs font-bold leading-tight">{error}</p>
                                </div>
                                {error.includes('Security key not found') && (
                                    <button 
                                        type="button"
                                        onClick={() => setStatus('missing_keys')}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all"
                                    >
                                        Setup Identity Now
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isUnlocking || !passphrase.trim()}
                            className={`w-full py-4 text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-blue-200 active:scale-95 ${
                                isUnlocking || !passphrase.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    : grantedKey ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                            }`}
                        >
                            {isUnlocking
                                ? <><FaSpinner className="animate-spin" /> Unlocking...</>
                                : <><FaLock /> Decrypt & View</>
                            }
                        </button>
                        
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none"> Private decryption in browser </p>
                            </div>
                            <p className="text-[8px] text-gray-400 font-medium">AddisMed Zero-Knowledge Infrastructure v2.1</p>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Decrypted — render all patient content
    return <>{children}</>;
};

export default PatientUnlocker;
