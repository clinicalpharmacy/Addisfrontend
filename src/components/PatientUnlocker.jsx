import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaLock, FaUnlock, FaShieldAlt, FaSpinner, FaFileMedical, 
    FaUserShield, FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';
import {
    getEncryptionKey, decryptPatient, persistKeyToSession,
    loadPrivateKey, decryptWithPrivateKey, hexToBytes, deriveKey
} from '../utils/encryptionUtils';
import api from '../utils/api';

/**
 * 🔒 PatientUnlocker — Smart Security Gateway
 * Synchronizes Authorized Support sessions with real-time decryption.
 * If a session is authorized but the vault is locked, it provides a one-click unlock flow.
 */
const PatientUnlocker = ({ patientData, userSalt, onUnlocked, children }) => {
    const [isGrantAuthorized, setIsGrantAuthorized] = useState(false);
    const [grantInfo, setGrantInfo] = useState(null);
    const [showUnlockFlow, setShowUnlockFlow] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);

    const checkGrantStatus = useCallback(async () => {
        if (!patientData?.id) return;
        try {
            const res = await api.get(`/access/granted?patient_id=${patientData.id}`);
            if (res?.success && res?.request) {
                setIsGrantAuthorized(true);
                setGrantInfo(res.request);
            }
        } catch (_) {}
    }, [patientData?.id]);

    const performDecryption = useCallback(async (masterKey) => {
        if (!patientData) return;
        setIsDecrypting(true);
        setError('');

        try {
            // 1. Try direct owner decryption
            const ownerDecrypted = await decryptPatient(patientData, masterKey);
            if (ownerDecrypted?.full_name && !String(ownerDecrypted.full_name).includes(':')) {
                setIsDecrypted(true);
                onUnlocked(ownerDecrypted);
                return true;
            }

            // 2. Try shared specialist decryption (if authorized)
            const res = grantInfo || (await api.get(`/access/granted?patient_id=${patientData.id}`))?.request;
            if (res?.encrypted_key) {
                const privKey = await loadPrivateKey(masterKey);
                if (privKey) {
                    const patientKeyHex = await decryptWithPrivateKey(res.encrypted_key, privKey);
                    const rawKeyBytes = hexToBytes(patientKeyHex);
                    const sharedKey = await crypto.subtle.importKey(
                        'raw', rawKeyBytes, { name: 'AES-GCM' }, true, ['decrypt']
                    );

                    const specDecrypted = await decryptPatient(patientData, sharedKey);
                    if (specDecrypted?.full_name && !String(specDecrypted.full_name).includes(':')) {
                        setIsDecrypted(true);
                        onUnlocked(specDecrypted);
                        return true;
                    }
                }
            }
            return false;
        } catch (err) {
            console.error('🛡️ [Unlocker] Decryption Critical Failure:', err);
            return false;
        } finally {
            setIsDecrypting(false);
        }
    }, [patientData, onUnlocked, grantInfo]);

    const handleInitialUnlock = useCallback(async () => {
        const key = await getEncryptionKey();
        if (key) {
            await performDecryption(key);
        } else {
            await checkGrantStatus();
        }
    }, [performDecryption, checkGrantStatus]);

    useEffect(() => {
        if (patientData?.id) {
            handleInitialUnlock();
        }
    }, [patientData?.id, handleInitialUnlock]);

    const handleManualUnlock = async (e) => {
        if (e) e.preventDefault();
        setIsDecrypting(true);
        setError('');

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const salt = userData?.encryption_salt || localStorage.getItem('enc_salt');
            if (!salt) throw new Error("Security seed missing. Re-login required.");

            const masterKey = await deriveKey(password, salt);
            await persistKeyToSession(masterKey);
            
            const success = await performDecryption(masterKey);
            if (success) {
                setShowUnlockFlow(false);
                setPassword('');
            } else {
                setError("Authorized decryption failed. Key mismatch.");
            }
        } catch (err) {
            setError("Authorization denied. Invalid password.");
        } finally {
            setIsDecrypting(false);
        }
    };

    // UI RENDERER
    const isActuallyEncrypted = patientData?.full_name && String(patientData.full_name).includes(':');

    return (
        <div className="relative">
            {/* 🔑 SECURITY STATUS OVERLAY (For Authorized Specialists whose vault is locked) */}
            {isActuallyEncrypted && isGrantAuthorized && !isDecrypted && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-xl px-4 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-gray-900/90 backdrop-blur-2xl border border-blue-500/30 rounded-[2.5rem] p-6 shadow-[0_30px_100px_-12px_rgba(37,99,235,0.4)] overflow-hidden group">
                        
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                            <FaShieldAlt size={80} className="text-blue-400" />
                        </div>

                        {!showUnlockFlow ? (
                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                    <FaLock className="text-2xl" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-base font-black text-white tracking-tight leading-tight mb-1">Authorization Active</h4>
                                    <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-[0.2em]">Unlock Vault to Decrypt Records</p>
                                </div>
                                <button
                                    onClick={() => setShowUnlockFlow(true)}
                                    className="bg-white text-blue-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    Activate Clinical Stream
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleManualUnlock} className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <FaUserShield className="text-blue-500" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Verify specialist access</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowUnlockFlow(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FaExclamationTriangle size={14} />
                                    </button>
                                </div>
                                
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your security password..."
                                        className="w-full h-14 px-6 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold transition-all"
                                        required
                                        autoFocus
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isDecrypting}
                                        className="absolute right-2 top-2 h-10 px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2"
                                    >
                                        {isDecrypting ? <FaSpinner className="animate-spin" /> : <FaUnlock />}
                                        Unlock Stream
                                    </button>
                                </div>
                                {error && <p className="text-red-400 text-[10px] font-black text-center animate-pulse">{error}</p>}
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Notification for successful stream activation */}
            {isDecrypted && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest animate-in fade-out duration-1000 slide-out-to-top-4 fill-mode-forwards delay-2000">
                    <FaCheckCircle className="text-emerald-200" /> Clinical Data Stream Decrypted
                </div>
            )}

            {children}
        </div>
    );
};

export default PatientUnlocker;
