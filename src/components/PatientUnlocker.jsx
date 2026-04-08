import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    FaLock, FaUnlock, FaShieldAlt, FaSpinner, 
    FaUserShield, FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';
import {
    getEncryptionKey, decryptPatient, persistKeyToSession,
    loadPrivateKey, decryptWithPrivateKey, hexToBytes, deriveKey
} from '../utils/encryptionUtils';
import api from '../utils/api';

/**
 * 🔒 PatientUnlocker — Smart Security Gateway
 * 
 * Flow:
 *  1. On mount: fetch grant info + session key IN PARALLEL
 *  2. If session key exists: auto-attempt decryption (owner first, then shared via grant)
 *  3. If auto-decrypt succeeds: silently call onUnlocked, no UI shown
 *  4. If auto-decrypt fails but grant exists: show unlock UI overlay
 *  5. If no key and no grant: render children as-is (owner's own patients)
 */
const PatientUnlocker = ({ patientData, userSalt, onUnlocked, children }) => {
    const [isGrantAuthorized, setIsGrantAuthorized] = useState(false);
    const [grantInfo, setGrantInfo] = useState(null);
    const [showUnlockFlow, setShowUnlockFlow] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [autoDecryptAttempted, setAutoDecryptAttempted] = useState(false);

    // Ref to prevent double-initialization
    const initRef = useRef(false);

    /**
     * Core decryption engine.
     * Accepts an explicit freshGrant to avoid relying on stale state.
     */
    const performDecryption = useCallback(async (masterKey, freshGrant = null) => {
        if (!patientData) return false;
        setIsDecrypting(true);
        setError('');

        try {
            // 1. Try direct owner decryption (works for the patient owner)
            const ownerDecrypted = await decryptPatient(patientData, masterKey);
            const isDecryptedOk = ownerDecrypted?.full_name && !String(ownerDecrypted.full_name).includes(':');
            if (isDecryptedOk) {
                setIsDecrypted(true);
                onUnlocked(ownerDecrypted, masterKey);
                return true;
            }

            // 2. Try shared specialist / admin decryption
            // Use freshGrant (passed directly) or grantInfo state, or fetch from API
            let grantData = freshGrant || grantInfo;
            if (!grantData && patientData.id) {
                try {
                    const res = await api.get(`/access/granted?patient_id=${patientData.id}`);
                    if (res?.success && res?.request) {
                        grantData = res.request;
                        setGrantInfo(res.request);
                        setIsGrantAuthorized(true);
                    }
                } catch (_) {}
            }

            if (grantData?.encrypted_key) {
                const privKey = await loadPrivateKey(masterKey);
                if (privKey) {
                    try {
                        const patientKeyHex = await decryptWithPrivateKey(grantData.encrypted_key, privKey);
                        const rawKeyBytes = hexToBytes(patientKeyHex);
                        const sharedKey = await crypto.subtle.importKey(
                            'raw', rawKeyBytes, { name: 'AES-GCM' }, true, ['decrypt']
                        );

                        const specDecrypted = await decryptPatient(patientData, sharedKey);
                        const isSharedOk = specDecrypted?.full_name && !String(specDecrypted.full_name).includes(':');
                        if (isSharedOk) {
                            setIsDecrypted(true);
                            onUnlocked(specDecrypted, sharedKey);
                            return true;
                        }
                    } catch (sharedErr) {
                        console.warn('🔐 [Unlocker] Shared key decryption failed:', sharedErr.message);
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

    /**
     * Initial unlock attempt on mount.
     * Always fetches grant info AND session key in parallel.
     */
    const handleInitialUnlock = useCallback(async () => {
        if (!patientData?.id || initRef.current) return;
        initRef.current = true;

        try {
            // Fetch both simultaneously — no sequential blocking
            const [sessionKey, grantRes] = await Promise.all([
                getEncryptionKey(),
                api.get(`/access/granted?patient_id=${patientData.id}`).catch(() => null)
            ]);

            const freshGrant = grantRes?.success && grantRes?.request ? grantRes.request : null;

            // Update grant state for UI
            if (freshGrant) {
                setGrantInfo(freshGrant);
                setIsGrantAuthorized(true);
            }

            if (sessionKey) {
                // Attempt auto-decryption with fresh grant data (avoids stale state)
                const success = await performDecryption(sessionKey, freshGrant);
                if (!success && freshGrant) {
                    // Has grant but auto-decrypt failed (e.g. wrong key, uninitialized PKI)
                    // The grant banner will be shown via isGrantAuthorized
                    console.warn('🔐 [Unlocker] Auto-decrypt failed despite session key + grant. Manual unlock required.');
                }
            }
            // If no session key: grant banner shows via isGrantAuthorized state
        } catch (err) {
            console.error('🔐 [Unlocker] Init error:', err);
        } finally {
            setAutoDecryptAttempted(true);
        }
    }, [patientData?.id, performDecryption]);

    // Run on mount and when patient changes
    useEffect(() => {
        initRef.current = false;
        setIsDecrypted(false);
        setAutoDecryptAttempted(false);
        setIsGrantAuthorized(false);
        setGrantInfo(null);
        setError('');
        setShowUnlockFlow(false);
        if (patientData?.id) {
            handleInitialUnlock();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientData?.id]);

    /**
     * Manual unlock via password entry (when auto-decrypt can't find a session key).
     */
    const handleManualUnlock = async (e) => {
        if (e) e.preventDefault();
        setIsDecrypting(true);
        setError('');

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const salt = userData?.encryption_salt || localStorage.getItem('enc_salt');
            if (!salt) throw new Error('Security seed missing. Re-login required.');

            const masterKey = await deriveKey(password, salt);
            await persistKeyToSession(masterKey);

            const success = await performDecryption(masterKey, grantInfo);
            if (success) {
                setShowUnlockFlow(false);
                setPassword('');
            } else {
                setError('Authorized decryption failed. Verify your password or grant status.');
            }
        } catch (err) {
            setError('Authorization denied. Invalid password or missing security keys.');
        } finally {
            setIsDecrypting(false);
        }
    };

    // --- UI CONDITIONS ---
    const isActuallyEncrypted = patientData?.full_name && String(patientData.full_name).includes(':');
    const showGrantBanner = isActuallyEncrypted && isGrantAuthorized && !isDecrypted && autoDecryptAttempted;

    return (
        <div className="relative">
            {/* 🔑 SECURITY STATUS OVERLAY */}
            {showGrantBanner && (
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
                                    <h4 className="text-base font-black text-white tracking-tight leading-tight mb-1">
                                        Authorization Active
                                    </h4>
                                    <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-[0.2em]">
                                        Enter password to decrypt patient records
                                    </p>
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

            {/* Auto-decrypt spinner (only shows briefly on first load) */}
            {isDecrypting && !showUnlockFlow && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[4999] bg-gray-900/70 backdrop-blur-xl text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-2xl">
                    <FaSpinner className="animate-spin text-blue-400" />
                    Decrypting clinical stream...
                </div>
            )}

            {/* Success toast */}
            {isDecrypted && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest animate-in fade-in duration-300 slide-out-to-top-4 fill-mode-forwards delay-2000">
                    <FaCheckCircle className="text-emerald-200" /> Clinical Data Stream Decrypted
                </div>
            )}

            {children}
        </div>
    );
};

export default PatientUnlocker;
