import React, { useState } from 'react';
import { FaShieldAlt, FaKey, FaLock, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { generateUserKeyPair, wrapPrivateKey, deriveKey, exportPublicKey } from '../../utils/encryptionUtils';
import api from '../../utils/api';

/**
 * 🗝️ SecurityActivator Component
 * Allows users who haven't generated RSA keys to do so by entering their password.
 */
const SecurityActivator = ({ onActivated }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleActivate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            let user = JSON.parse(localStorage.getItem('user'));
            if (!user) throw new Error("Please log in again.");

            // 🛠️ SELF-HEAL: Fetch latest profile if salt is missing
            if (!user.encryption_salt) {
                const profileRes = await api.get('/auth/me');
                if (profileRes.success && profileRes.user.encryption_salt) {
                    user = { ...user, ...profileRes.user };
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    throw new Error("Encryption salt not configured for your account. Please log out and log in again.");
                }
            }

            // 1. Derive Master Key from password
            const masterKey = await deriveKey(password, user.encryption_salt);
            
            // 2. Generate RSA Keypair
            const { publicKey, privateKey } = await generateUserKeyPair();
            
            // 3. Wrap Private Key with Master Key
            const privateKeyEncrypted = await wrapPrivateKey(privateKey, masterKey);
            
            // 4. Export Public Key to Base64 String
            const publicKeyBase64 = await exportPublicKey(publicKey);
            
            // 5. Sync to DB
            const res = await api.post('/auth/update-encryption-keys', {
                public_key: publicKeyBase64,
                private_key_encrypted: privateKeyEncrypted
            });

            if (res.success) {
                // Update local storage user info
                const updatedUser = { ...user, public_key: publicKeyBase64, private_key_encrypted: privateKeyEncrypted };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                setStatus({ type: 'success', message: 'Security keys successfully activated!' });
                if (onActivated) onActivated(updatedUser);
            } else {
                setStatus({ type: 'error', message: res.error || 'Failed to update security keys from DB' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.error || err.message || 'Key generation failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 -translate-y-10 translate-x-10">
                <FaShieldAlt size={280} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl border border-white/20">
                        <FaLock className="text-pink-400" size={32} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight">Activate Secure Identity</h3>
                        <p className="text-indigo-200 font-medium">One-time setup required for secure support access</p>
                    </div>
                </div>

                <p className="text-indigo-100 text-lg leading-relaxed mb-10 max-w-xl">
                    To enable troubleshooting and zero-knowledge data sharing, we need to generate your unique **Digital Signature.** Enter your password below to finalize your secure identity setup.
                </p>

                {status.message && (
                    <div className={`mb-8 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
                        status.type === 'success' ? 'bg-green-500/20 border border-green-400/40 text-green-200' : 'bg-red-500/20 border border-red-400/40 text-red-200'
                    }`}>
                        {status.type === 'success' ? <FaCheckCircle size={24} /> : <FaExclamationTriangle size={24} />}
                        <p className="font-bold">{status.message}</p>
                    </div>
                )}

                <form onSubmit={handleActivate} className="space-y-6 max-w-md">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">Confirm Your Account Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-4 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-white/20 text-white font-bold"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-lg font-black rounded-2xl hover:brightness-110 shadow-xl shadow-pink-900/50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:grayscale"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Synchronizing Keys...
                            </>
                        ) : (
                            <>
                                <FaKey />
                                Activate My Keys
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] opacity-50">
                        Zero-Knowledge Protocol: We never store your password or raw keys
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SecurityActivator;
