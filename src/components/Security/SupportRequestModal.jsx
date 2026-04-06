import React, { useState, useEffect } from 'react';
import { FaUserShield, FaLock, FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import api from '../../utils/api';
import { deriveKey, encryptForRecipient } from '../../utils/encryptionUtils';

/**
 * 🛡️ SupportRequestModal
 * Allows a user to proactively share their encrypted data with a verified admin.
 */
const SupportRequestModal = ({ isOpen, onClose, patientId, ownerSalt, onSuccess }) => {
    const [admins, setAdmins] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Admin & Password, 2: Success
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('💎 [SupportModal] Active with Props:', { isOpen, patientId, ownerSalt: !!ownerSalt });
        if (isOpen) {
            fetchSecurityAdmins();
        }
    }, [isOpen, patientId, ownerSalt]);

    const fetchSecurityAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/security-users');
            if (res.success) {
                setAdmins(res.users || []);
            }
        } catch (err) {
            setError('Failed to load support team members.');
        } finally {
            setLoading(false);
        }
    };

    const handleActivateSupport = async (e) => {
        if (e) e.preventDefault();
        
        if (!selectedAdminId || !password) {
            setError('Please select an admin and enter your password.');
            return;
        }

        if (!ownerSalt) {
            console.error('❌ [SupportModal] Critical Error: Salt is missing.', { patientId, ownerSalt });
            setError('Security anchor (salt) is missing for this patient. Please reload the page.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        console.log('🚀 [SupportModal] Beginning activation for patient:', patientId);

        try {
            // 1. Find selected admin's public key
            const admin = admins.find(a => a.id === selectedAdminId);
            if (!admin || !admin.public_key) {
                throw new Error('Selected admin does not have active security keys.');
            }

            // 2. Derive User's Master AES Key from password + salt
            console.log('🔑 [SupportModal] Deriving master key...');
            const masterKey = await deriveKey(password, ownerSalt);
            
            // 3. Export the Master Key to a format we can encrypt (hex string)
            const rawKey = await crypto.subtle.exportKey('raw', masterKey);
            const masterKeyHex = Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2, '0')).join('');

            // 4. Encrypt the Master Key with the Admin's Public RSA Key
            console.log('📦 [SupportModal] Wrapping key for admin...');
            const encryptedKeyForAdmin = await encryptForRecipient(masterKeyHex, admin.public_key);

            // 5. Submit the support activation to the backend
            console.log('📡 [SupportModal] Submitting to backend...');
            const res = await api.post('/access/support-activate', {
                patient_id: patientId,
                admin_id: selectedAdminId,
                encrypted_key: encryptedKeyForAdmin
            });

            if (res.success) {
                console.log('✅ [SupportModal] Activation successful!');
                setStep(2);
                if (onSuccess) onSuccess(); // Notify parent component (PatientDetails)
            } else {
                throw new Error(res.error || 'Failed to activate support.');
            }
        } catch (err) {
            console.error('❌ [SupportModal] Activation Error:', err);
            setError(err.message || 'System error during activation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100 transition-all scale-100">
                
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 p-8 text-white relative">
                    <div className="absolute top-4 right-4 text-white/40">
                        <FaShieldAlt size={80} className="rotate-12 opacity-10" />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/30">
                            <FaShieldAlt className="text-2xl text-blue-200" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Support Activation</h2>
                    </div>
                    <p className="text-blue-100/80 text-sm font-medium">Secure, Zero-Knowledge Data Sharing</p>
                </div>

                {step === 1 ? (
                    <div className="p-8 space-y-6">
                        {/* 🛡️ SECURITY STATUS (Togglable for advanced users) */}
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Security Protocol</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setLoading(!loading)} // Reusing loading for toggle
                                    className="text-[9px] font-bold text-blue-600 hover:underline px-2"
                                >
                                    {loading ? 'Hide Details' : 'View Diagnostics'}
                                </button>
                            </div>
                            
                            {loading && (
                                <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-[9px] font-mono leading-relaxed border border-gray-700 shadow-inner mb-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between uppercase">
                                            <span>[01] ID:</span>
                                            <span className={patientId ? 'text-green-400' : 'text-red-500 font-black'}>{patientId ? 'VERIFIED' : 'ERR'}</span>
                                        </div>
                                        <div className="flex justify-between uppercase">
                                            <span>[02] ANCHOR:</span>
                                            <span className={ownerSalt ? 'text-green-400' : 'text-red-500 font-black'}>{ownerSalt ? 'READY' : 'ERR'}</span>
                                        </div>
                                        <div className="flex justify-between uppercase">
                                            <span>[03] TARGET:</span>
                                            <span className={selectedAdminId ? 'text-green-400' : 'text-red-500 font-black'}>{selectedAdminId ? 'LOCKED' : 'WAIT'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                                    <FaLock size={14} />
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-500 font-medium">
                                    You are about to share a <span className="font-bold text-gray-700">temporary, encrypted copy</span> of this record's access key. The specialist can only view data while this session is active.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleActivateSupport} className="space-y-5">
                            {/* Admin Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                                    <FaUserShield className="text-blue-500" /> Assigned Specialist
                                </label>
                                {loading && !selectedAdminId ? (
                                    <div className="h-14 bg-gray-50 animate-pulse rounded-xl" />
                                ) : (
                                    <div className="relative group">
                                        <select
                                            value={selectedAdminId}
                                            onChange={(e) => setSelectedAdminId(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none font-medium text-gray-800"
                                            required
                                        >
                                            <option value="">Choose a support member...</option>
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>
                                                    {admin.full_name} ({admin.email})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <FaSearch size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Password Verification */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                                    <FaLock className="text-indigo-500" /> Authorization Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your login password..."
                                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-800"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                                    Used to derive decryption key locally
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-14 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedAdminId || !password || !ownerSalt}
                                    className={`flex-1 h-16 bg-blue-600 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                                        (isSubmitting || !selectedAdminId || !password || !ownerSalt) ? 'opacity-50 grayscale' : 'hover:bg-blue-700 hover:shadow-blue-500/30'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="text-[10px] uppercase tracking-tighter animate-pulse">🔒 SECURING DATA...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <FaShieldAlt /> ACTIVATE SUPPORT
                                            </div>
                                            <span className="text-[8px] opacity-70 uppercase font-black">Starts Encrypted Tunnel</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-4xl text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">Support Activated!</h3>
                            <p className="text-gray-500 font-medium">The assigned specialist can now securely view the patient data you've shared.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl"
                        >
                            Back to Patient
                        </button>
                    </div>
                )}

                {/* Footer status */}
                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <FaLock /> End-to-End Encrypted Tunnel Active
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportRequestModal;
