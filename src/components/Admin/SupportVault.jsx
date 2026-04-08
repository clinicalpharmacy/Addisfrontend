import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaCalendarAlt, FaSpinner, FaUnlock, FaLock, FaCheck, FaTimes,
    FaEnvelope, FaSync, FaUserShield, FaSignal, FaSearch, FaShieldAlt
} from 'react-icons/fa';
import api from '../../utils/api';
import { 
    deriveKey, generateUserKeyPair, exportPublicKey, 
    wrapPrivateKey, persistKeyToSession, getEncryptionKey 
} from '../../utils/encryptionUtils';

/**
 * 🔐 SupportVault Component
 * High-security UI for active troubleshooting sessions.
 * Now includes a mandatory Unlock step for specialist privacy preservation.
 */
export const SupportVault = () => {
    const navigate = useNavigate();

    // Vault state
    const [activePatients, setActivePatients] = useState([]);
    const [activeLoading, setActiveLoading] = useState(true);
    const [activeError, setActiveError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Security / Unlock state
    const [currentUser, setCurrentUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [showInitModal, setShowInitModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [password, setPassword] = useState('');
    const [initError, setInitError] = useState('');
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false); // Will check in useEffect

    const fetchActivePatients = useCallback(async () => {
        setActiveLoading(true);
        setActiveError('');
        try {
            const res = await api.get('/access/active-support');
            if (res.success) {
                setActivePatients(res.support_patients || []);
            } else {
                setActiveError(res.error || 'Failed to sync vault.');
            }
        } catch (err) {
            setActiveError(err.error || err.message || 'Vault connection lost.');
        } finally {
            setActiveLoading(false);
        }
    }, []);

    useEffect(() => {
        const checkVaultStatus = async () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);
            }
            const key = await getEncryptionKey();
            setIsVaultUnlocked(!!key);
        };
        checkVaultStatus();
        fetchActivePatients();
    }, [fetchActivePatients]);

    const handleInitializeSecurity = async (e) => {
        if (e) e.preventDefault();
        setIsInitializing(true);
        setInitError('');
        
        try {
            const salt = currentUser?.encryption_salt || localStorage.getItem('enc_salt');
            if (!salt) throw new Error("Security seed (salt) is missing. Please re-login.");
            
            const masterKey = await deriveKey(password, salt);
            const keyPair = await generateUserKeyPair();
            const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
            const wrappedPrivKey = await wrapPrivateKey(keyPair.privateKey, masterKey);
            
            const res = await api.post('/auth/update-encryption-keys', {
                public_key: pubKeyBase64,
                private_key_encrypted: wrappedPrivKey
            });
            
            if (res.success) {
                const updatedUser = { 
                    ...currentUser, 
                    public_key: pubKeyBase64, 
                    private_key_encrypted: wrappedPrivKey 
                };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                await persistKeyToSession(masterKey);
                setIsVaultUnlocked(true);
                setSuccessMsg("🛡️ Security Initialized! Vault is now open.");
                setShowInitModal(false);
                setPassword('');
            } else {
                throw new Error(res.error || "Remote sync failed.");
            }
        } catch (err) {
            setInitError(err.message || "Key generation failed.");
        } finally {
            setIsInitializing(false);
        }
    };

    const handleUnlockVault = async (e) => {
        if (e) e.preventDefault();
        setIsInitializing(true);
        setInitError('');

        try {
            const salt = currentUser?.encryption_salt || localStorage.getItem('enc_salt');
            if (!salt) throw new Error("Security salt missing. Please re-login.");

            // 1. Derive Master AES Key from password
            const masterKey = await deriveKey(password, salt);
            
            // 2. Cache it in session memory
            await persistKeyToSession(masterKey);
            setIsVaultUnlocked(true);
            setSuccessMsg("🔓 Specialist Vault Unlocked.");
            setShowUnlockModal(false);
            setPassword('');
        } catch (err) {
            setInitError("Authentication failed. Invalid master password.");
        } finally {
            setIsInitializing(false);
        }
    };

    const handleRevoke = async (req) => {
        if (!window.confirm(`End troubleshooting session with ${req.owner?.full_name || 'this user'}?`)) return;
        try {
            await api.post('/access/reject', { request_id: req.id });
            setSuccessMsg(`🚫 Session terminated.`);
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchActivePatients();
        } catch (err) {
            alert('❌ Revoke failed: ' + (err.error || err.message));
        }
    };

    const handleAccessData = (req) => {
        if (!isVaultUnlocked) {
            setShowUnlockModal(true);
            return;
        }
        const pId = req.patient?.patient_code || req.patient_id || req.patient?.id;
        if (pId) navigate(`/patients/${pId}`);
        else navigate('/patients');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FaUserShield className="text-blue-500 text-xs" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Secure Operation Vault</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
                        Support <span className="text-blue-600">Sessions</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    {!isVaultUnlocked && currentUser?.public_key && (
                        <button 
                            onClick={() => setShowUnlockModal(true)}
                            className="bg-amber-100/50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-2 text-xs font-bold hover:bg-amber-200 transition-all shadow-sm"
                        >
                            <FaUnlock /> Unlock Vault
                        </button>
                    )}
                    {isVaultUnlocked && (
                         <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-bold shadow-sm">
                            <FaCheck /> Vault Active
                        </div>
                    )}
                    <button
                        onClick={fetchActivePatients}
                        className="bg-white border border-gray-100 p-3 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                    >
                        <FaSync className={activeLoading ? 'animate-spin' : ''} size={14} />
                    </button>
                </div>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs border border-white/10 animate-in slide-in-from-top-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full" /> {successMsg}
                </div>
            )}

            {activeLoading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white/50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <FaSpinner className="text-2xl text-blue-500 animate-spin mb-3" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Syncing Authorization Matrix...</p>
                </div>
            ) : activeError ? (
                <div className="p-8 bg-red-50/50 rounded-[2rem] border border-red-100 text-center">
                    <p className="text-red-500 font-bold text-xs">{activeError}</p>
                </div>
            ) : !currentUser?.public_key ? (
                /* 🛡️ SECURITY INITIALIZATION PROMPT */
                <div className="bg-gradient-to-br from-blue-700 to-indigo-950 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 scale-150 rotate-12">
                        <FaShieldAlt size={200} className="text-blue-200" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <FaUserShield className="text-white text-3xl" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Setup Specialist Keys</h3>
                        <p className="text-blue-100/70 font-medium max-w-sm mx-auto leading-relaxed text-sm mb-10">
                            You must generate your unique end-to-end encryption keys before you can accept support requests.
                        </p>
                        <button
                            onClick={() => setShowInitModal(true)}
                            className="bg-white text-blue-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Initialize Credentials
                        </button>
                    </div>
                </div>
            ) : activePatients.length === 0 ? (
                <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[3rem] p-24 text-center group hover:border-blue-100 transition-all duration-500">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 group-hover:scale-110 group-hover:text-blue-200 group-hover:shadow-xl transition-all">
                        <FaLock size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-1">Vault Offline</h3>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed text-xs">
                        No active support sessions found.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activePatients.map((req) => (
                        <div key={req.id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 overflow-hidden active:scale-[0.98]">
                            
                            {/* Card Content (Previously implemented) */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:rotate-12 transition-all">
                                        <FaUserShield size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-base font-black text-gray-900 truncate tracking-tight">
                                            {req.patient?.full_name || 'Global Account'}
                                        </h4>
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                            {req.patient ? 'Encrypted Stream' : 'Limited Access'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-900 text-blue-400 px-2.5 py-1.5 rounded-xl border border-gray-800 flex items-center gap-1.5 shadow-sm">
                                    <FaSignal size={10} className="animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
                                </div>
                            </div>

                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-6 group-hover:bg-blue-50/30 group-hover:border-blue-100/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 group-hover:border-blue-200">
                                        <FaUserMd className="text-blue-500 text-xs" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Owned By</p>
                                        <p className="text-[11px] font-black text-gray-700 truncate leading-none">{req.owner?.full_name || 'Authorized User'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Status</p>
                                        <p className="text-[11px] font-black text-emerald-600 leading-none">Authorized</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-8">
                                <button
                                    onClick={() => handleAccessData(req)}
                                    className={`flex-[3] h-12 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 ${
                                        isVaultUnlocked 
                                        ? 'bg-gray-950 text-white hover:bg-blue-600 hover:shadow-blue-200' 
                                        : 'bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200'
                                    }`}
                                >
                                    {isVaultUnlocked ? <FaUserShield className="text-blue-400" /> : <FaLock className="text-amber-500" />}
                                    {isVaultUnlocked ? 'Access Data Stream' : 'Unlock to Access'}
                                </button>
                                <button
                                    onClick={() => handleRevoke(req)}
                                    className="flex-1 h-12 bg-white border border-red-100 rounded-[1.2rem] flex items-center justify-center gap-2 text-red-300 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all active:scale-90 font-bold text-[10px] uppercase tracking-widest shadow-sm"
                                    title="End troubleshooting session"
                                >
                                    <FaTimes size={12} />
                                    <span>End</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🔑 UNLOCK MODAL */}
            {showUnlockModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-amber-100 scale-100">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 text-white text-center relative overflow-hidden">
                             <FaLock size={120} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
                             <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FaShieldAlt size={30} className="text-amber-100" />
                             </div>
                             <h3 className="text-xl font-black tracking-tight">Vault Locked</h3>
                             <p className="text-amber-100/80 text-xs font-bold uppercase tracking-widest">Authorization Required</p>
                        </div>
                        <form onSubmit={handleUnlockVault} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Master Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Verify credentials..."
                                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none font-bold text-gray-800"
                                    required
                                    autoFocus
                                />
                                <p className="text-[9px] text-gray-400 font-medium px-1">This derives your session decryption key locally.</p>
                            </div>

                            {initError && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">⚠️ {initError}</p>}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowUnlockModal(false)} className="flex-1 h-14 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={isInitializing}
                                    className="flex-1 h-14 bg-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl hover:bg-amber-700 flex items-center justify-center gap-2"
                                >
                                    {isInitializing ? <FaSpinner className="animate-spin" /> : <FaUnlock />}
                                    Unlock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🛡️ INITIALIZATION MODAL (Similar to Unlock but for first-time) */}
            {showInitModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-blue-100 scale-100">
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 text-white text-center relative overflow-hidden">
                             <FaShieldAlt size={120} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
                             <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FaUserShield size={30} className="text-blue-100" />
                             </div>
                             <h3 className="text-xl font-black tracking-tight">Security Setup</h3>
                             <p className="text-blue-100/80 text-xs font-bold uppercase tracking-widest">Key Generation Sequence</p>
                        </div>
                        <form onSubmit={handleInitializeSecurity} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Create Access Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Use your login password..."
                                        className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-bold text-gray-800"
                                        required
                                    />
                                    <p className="text-[9px] text-gray-400 font-medium px-1">Used to wrap your new asymmetric keypair.</p>
                                </div>
                            </div>

                            {initError && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">⚠️ {initError}</p>}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowInitModal(false)} className="flex-1 h-14 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={isInitializing}
                                    className="flex-1 h-14 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    {isInitializing ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                    Initialize
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
