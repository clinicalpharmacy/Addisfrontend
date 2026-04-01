import React, { useState, useEffect } from 'react';
import { FaLock, FaKey, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import {
    getEncryptionKey, deriveKey, decryptPatient,
    hexToBytes, loadPrivateKey, decryptWithPrivateKey
} from '../utils/encryptionUtils';
import api from '../utils/api';

/**
 * PatientUnlocker — gates all patient content until decrypted.
 *
 * For OWNERS: auto-decrypts using the key cached at login (no password prompt).
 * For ADMINS with granted access: shows one password prompt to unwrap the shared key.
 * After first manual unlock the key is cached — all subsequent patients auto-decrypt.
 */

// Admin session cache (cleared on tab close)
let _adminKey = null;

const PatientUnlocker = ({ patientData, userSalt, onUnlocked, children }) => {
    const [passphrase, setPassphrase] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [grantedKey, setGrantedKey] = useState(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('checking'); // checking | prompt | done

    useEffect(() => {
        if (!patientData?.id) { setStatus('done'); setIsDecrypted(true); return; }
        init();
    }, [patientData?.id]);

    const init = async () => {
        setStatus('checking');

        // Step 1: Check if admin has a granted (shared) key for this patient
        let resolvedGrantedKey = null;
        try {
            const res = await api.get(`/access/granted?patient_id=${patientData.id}`);
            if (res.success && res.request?.encrypted_key) {
                resolvedGrantedKey = res.request.encrypted_key;
                setGrantedKey(resolvedGrantedKey);
            }
        } catch (e) { /* not admin or not granted */ }

        if (resolvedGrantedKey) {
            // Admin flow: need password to unwrap the shared key (unless already cached)
            if (_adminKey) {
                // Admin already unlocked once this session — use cached key
                try {
                    await decryptAndShow(_adminKey, resolvedGrantedKey);
                    return;
                } catch { _adminKey = null; }
            }
            // Need admin to enter their password
            setStatus('prompt');
            return;
        }

        // Step 2: Owner flow — get key from session (set at login)
        const sessionKey = await getEncryptionKey();
        if (sessionKey) {
            try {
                await decryptAndShow(sessionKey, null);
                return;
            } catch (e) {
                console.warn('[Unlocker] Session key failed, showing prompt:', e.message);
            }
        }

        // Step 3: No cached key — show password prompt
        setStatus('prompt');
    };

    const decryptAndShow = async (masterKey, encryptedAdminKey) => {
        let finalKey = masterKey;

        if (encryptedAdminKey) {
            // RSA-unwrap the patient key using the admin's private key
            const privateKey = await loadPrivateKey(masterKey);
            if (!privateKey) throw new Error('Security key not found. Go to Settings → activate security keys.');
            const rawHex = await decryptWithPrivateKey(encryptedAdminKey, privateKey);
            finalKey = await crypto.subtle.importKey(
                'raw', hexToBytes(rawHex),
                { name: 'AES-GCM' }, true, ['decrypt']
            );
        }

        const decrypted = await decryptPatient(patientData, finalKey);
        onUnlocked(decrypted);
        setIsDecrypted(true);
        setStatus('done');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passphrase.trim()) return;
        setError('');
        setIsUnlocking(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const salt = userSalt || user?.encryption_salt;
            if (!salt) throw new Error('Encryption salt missing. Please re-login.');
            const masterKey = await deriveKey(passphrase.trim(), salt);

            if (grantedKey) _adminKey = masterKey; // cache for admin

            await decryptAndShow(masterKey, grantedKey);
        } catch (err) {
            setError(err.message || 'Wrong password. Please try again.');
        } finally {
            setIsUnlocking(false);
        }
    };

    // Auto-checking — show spinner
    if (status === 'checking') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
                <FaSpinner className="text-3xl text-blue-500 animate-spin" />
                <p className="text-sm font-medium">Loading record...</p>
            </div>
        );
    }

    // Password prompt (admin or session expired)
    if (status === 'prompt') {
        return (
            <div className="flex items-center justify-center min-h-[40vh] p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
                    <div className={`p-8 text-white text-center ${grantedKey ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            {grantedKey ? <FaKey className="text-xl" /> : <FaShieldAlt className="text-xl" />}
                        </div>
                        <h2 className="text-lg font-bold">
                            {grantedKey ? 'Admin Support Access' : 'Enter Your Password'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {grantedKey
                                ? 'Enter your own login password to view this patient.'
                                : 'Enter your password to decrypt this patient record.'}
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <input
                            type="password"
                            value={passphrase}
                            onChange={e => setPassphrase(e.target.value)}
                            placeholder="Your password..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                        <button
                            type="submit"
                            disabled={isUnlocking || !passphrase.trim()}
                            className={`w-full py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                isUnlocking || !passphrase.trim()
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : grantedKey ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isUnlocking
                                ? <><FaSpinner className="animate-spin" /> Decrypting...</>
                                : <><FaLock /> View Patient Record</>
                            }
                        </button>
                        <p className="text-center text-[11px] text-gray-400">
                            🔒 Decrypted only in your browser. Never sent to server.
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    // Decrypted — render all patient content
    return <>{children}</>;
};

export default PatientUnlocker;
