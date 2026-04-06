import React, { useState, useEffect } from 'react';
import { FaShield, FaKey, FaLock, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import { 
    generateUserKeyPair, 
    wrapPrivateKey, 
    deriveKey, 
    exportPublicKey, 
    persistKeyToSession,
    loadPrivateKey
} from '../../utils/encryptionUtils';
import api from '../../utils/api';

/**
 * 🗝️ SecurityActivator Component
 * Simplifies identity setup: 
 * 1. If keys exist in DB -> RESTORES them (Restore Mode)
 * 2. If keys missing -> GENERATES them (Activation Mode)
 */
const SecurityActivator = ({ onActivated }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [hasExistingKeys, setHasExistingKeys] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setHasExistingKeys(!!user.public_key);
        }
    }, []);

    const handleAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            let userStr = localStorage.getItem('user');
            let user = JSON.parse(userStr);
            if (!user) throw new Error("Please log in again.");

            // 🛠️ Profile Check: Ensure salt exists
            if (!user.encryption_salt) {
                const profileRes = await api.get('/auth/me');
                if (profileRes.success && profileRes.user.encryption_salt) {
                    user = { ...user, ...profileRes.user };
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    throw new Error("Security salt missing. Logout and log in again.");
                }
            }

            // [1] Derive Master Key from password
            const masterKey = await deriveKey(password, user.encryption_salt);
            
            // [2] Cache master key for the current session
            await persistKeyToSession(masterKey);

            let updatedUser = { ...user };

            if (!hasExistingKeys) {
                // [3a] ACTIVATION MODE: Generate New RSA Keypair
                console.log("🗝️ Generating new secure identity...");
                const { publicKey, privateKey } = await generateUserKeyPair();
                const privateKeyEncrypted = await wrapPrivateKey(privateKey, masterKey);
                const publicKeyBase64 = await exportPublicKey(publicKey);
                
                // Sync to DB
                const res = await api.post('/auth/update-encryption-keys', {
                    public_key: publicKeyBase64,
                    private_key_encrypted: privateKeyEncrypted
                });

                if (!res.success) throw new Error(res.error || 'Failed to sync keys');
                
                updatedUser = { ...updatedUser, public_key: publicKeyBase64, private_key_encrypted: privateKeyEncrypted };
                setStatus({ type: 'success', message: 'Identity successfully activated!' });
            } else {
                // [3b] RESTORE MODE: Load existing private key
                console.log("📂 Restoring existing secure identity...");
                const privKey = await loadPrivateKey(masterKey);
                if (!privKey) throw new Error("Could not decrypt security key. Check your password.");
                
                setStatus({ type: 'success', message: 'Identity successfully restored!' });
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onActivated) onActivated(updatedUser);
            
        } catch (err) {
            setStatus({ type: 'error', message: err.error || err.message || 'Security setup failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-2 border-blue-50 rounded-3xl p-8 shadow-sm relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute -right-10 -top-10 text-gray-50 opacity-50 pointer-events-none">
                <FaShieldAlt size={180} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        {hasExistingKeys ? <FaSyncAlt className="text-white" /> : <FaLock className="text-white" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            {hasExistingKeys ? 'Restore Secure Identity' : 'Activate Secure Identity'}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                            {hasExistingKeys ? 'Resume secure access on this device' : 'One-time setup for secure support'}
                        </p>
                    </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {hasExistingKeys 
                        ? 'Your secure keys were found in the database. Enter your password to re-activate them for this browser session.'
                        : 'To enable zero-knowledge patient data sharing, we need to generate your unique Digital Signature. This happens locally in your browser.'}
                </p>

                {status.message && (status.type !== 'success') && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 text-red-700 border border-red-100 animate-in slide-in-from-top-2 duration-300">
                        <FaExclamationTriangle size={16} />
                        <p className="text-sm font-bold">{status.message}</p>
                    </div>
                )}

                {status.type === 'success' ? (
                    <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center animate-in zoom-in-95 duration-500">
                        <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                        <p className="text-green-800 font-black text-lg mb-1">Setup Complete!</p>
                        <p className="text-green-600/80 text-sm font-medium">Your digital identity is now active.</p>
                    </div>
                ) : (
                    <form onSubmit={handleAction} className="space-y-4 max-w-sm">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 mb-2">Confirms Your Account Password</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 text-sm font-bold text-gray-800"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 active:scale-95 ${
                                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    {hasExistingKeys ? 'Restoring...' : 'Synchronizing...'}
                                </>
                            ) : (
                                <>
                                    {hasExistingKeys ? <FaSyncAlt /> : <FaKey />}
                                    {hasExistingKeys ? 'Restore My Keys' : 'Activate My Keys'}
                                </>
                            )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.1em]">
                                Zero-Knowledge Protected
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SecurityActivator;
