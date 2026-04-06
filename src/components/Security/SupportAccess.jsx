import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaLifeRing, FaShieldAlt, FaKey, FaHandshake, FaCheckCircle, 
    FaExclamationTriangle, FaLock, FaUserShield, FaSpinner, FaPowerOff 
} from 'react-icons/fa';
import api from '../../utils/api';
import { 
    getEncryptionKey, encryptForRecipient, bytesToHex,
    generateUserKeyPair, exportPublicKey, wrapPrivateKey
} from '../../utils/encryptionUtils';

/**
 * 🛠️ SupportAccess Component (User Side)
 * Cleaned up implementation with NO infinite loops.
 */
const SupportAccess = () => {
    const [loading, setLoading] = useState(true);
    const [granting, setGranting] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [activeAccess, setActiveAccess] = useState(null);
    const [selectedAdminId, setSelectedAdminId] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [manualRecipient, setManualRecipient] = useState(null);

    const fetchData = useCallback(async () => {
        // Only set loading on mount, use granting state for toggles
        try {
            const [adminRes, accessRes] = await Promise.all([
                api.get('/admin/security-users'),
                api.get('/access/my-active-grants')
            ]);

            if (adminRes.success) {
                const fetchedAdmins = adminRes.users || [];
                setAdmins(fetchedAdmins);
                if (fetchedAdmins.length > 0) {
                    setSelectedAdminId(fetchedAdmins[0].id);
                }
            }
            
            if (accessRes.success && accessRes.grants?.length > 0) {
                const globalGrant = accessRes.grants.find(g => !g.patient_id);
                setActiveAccess(globalGrant || null);
            } else {
                setActiveAccess(null);
            }
        } catch (err) {
            console.error("Troubleshooting sync error", err);
            setActiveAccess(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleOn = async () => {
        const admin = manualRecipient || admins.find(a => a.id === selectedAdminId);
        if (!admin) return alert("Please select or search for a specialist.");

        setGranting(true);
        try {
            if (!admin.public_key) {
                alert("⚠️ Specialist Security Offline: This administrator has not yet initialized their end-to-end security keys. They must go to the Support Vault and click 'Activate Specialist Credentials' before they can receive troubleshooting access.");
                setGranting(false);
                return;
            }

            const masterKey = await getEncryptionKey();
            if (!masterKey) throw new Error("Identity verification failed. Please re-login.");

            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            // UNIFIED: Use HEX for the raw key string before wrapping
            const rawKeyHex = bytesToHex(new Uint8Array(rawKey));
            const encryptedKey = await encryptForRecipient(rawKeyHex, admin.public_key);

            await api.post('/access/support-activate', {
                patient_id: null,
                admin_id: selectedAdminId,
                encrypted_key: encryptedKey
            });
            await fetchData();
        } catch (err) {
            alert("Activation Error: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    const handleManualSearch = async (e) => {
        if (e) e.preventDefault();
        setSearching(true);
        try {
            const res = await api.get(`/auth/search?email=${manualEmail}`);
            if (res.success && res.user) {
                setManualRecipient(res.user);
                setSelectedAdminId(res.user.id);
            } else {
                alert("❌ Specialist not found in registry.");
            }
        } catch (err) {
            alert("❌ Search failed: " + (err.error || err.message));
        } finally {
            setSearching(false);
        }
    };

    const handleToggleOff = async () => {
        if (!activeAccess) return;
        setGranting(true);
        try {
            await api.post('/access/reject', { request_id: activeAccess.id });
            await fetchData();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center animate-pulse bg-gray-50 rounded-[3rem]">
                <FaSpinner className="animate-spin mx-auto text-blue-500 mb-4" size={30} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mastering Tunnels...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             {/* Header */}
             <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 text-blue-50 opacity-40 group-hover:rotate-12 transition-transform duration-1000">
                    <FaShieldAlt size={220} />
                </div>
                
                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100 text-white">
                            <FaUserShield size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 leading-none">Troubleshooting</h2>
                            <p className="text-blue-500 font-bold text-xs mt-1 uppercase tracking-widest">Master Privacy Control</p>
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl flex items-center justify-between transition-all duration-500 border-2 ${activeAccess ? 'bg-green-50 border-green-200 shadow-lg shadow-green-50' : 'bg-gray-100 border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeAccess ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-300'}`}>
                                <FaPowerOff size={24} className={activeAccess ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <p className={`text-xl font-black leading-none ${activeAccess ? 'text-green-800' : 'text-gray-400'}`}>
                                    {activeAccess ? 'System Active' : 'System Locked'}
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1.5 flex items-center gap-1">
                                    {activeAccess ? <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> Linked to Specialist</span> : 'Privacy Protocol Active'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={activeAccess ? handleToggleOff : handleToggleOn}
                            disabled={granting || (!activeAccess && !selectedAdminId && !manualRecipient)}
                            className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1 flex items-center shadow-inner ${activeAccess ? 'bg-green-500' : ((manualRecipient || admins.find(a => a.id === selectedAdminId))?.public_key ? 'bg-blue-500' : 'bg-gray-300')} ${granting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${activeAccess ? 'translate-x-10' : 'translate-x-0'}`}>
                                {granting ? <FaSpinner className="animate-spin text-blue-500 text-[10px]" /> : ((manualRecipient || admins.find(a => a.id === selectedAdminId))?.public_key ? <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />)}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* 🛠️ SECURITY REPAIR PROTOCOL */}
            {!activeAccess && !admins.length && !manualRecipient && (
                <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <FaExclamationTriangle className="text-amber-500" size={20} />
                        <h4 className="font-black text-amber-900">Security Handshake Required</h4>
                    </div>
                    <p className="text-xs font-medium text-amber-800/70 leading-relaxed">
                        The troubleshooting registry is currently offline. To enable the privacy toggle, you must first initialize your own security credentials to act as your own support specialist.
                    </p>
                    <button
                        onClick={async () => {
                            setSearching(true);
                            try {
                                const password = window.prompt("🛡️ Secure Authorization: Please enter your login password to initialize your RSA keys:");
                                if (!password) { setSearching(false); return; }

                                const salt = localStorage.getItem('user_salt') || 'default-salt';
                                const { publicKey, privateKey } = await generateUserKeyPair(password, salt);
                                const publicKeyBase64 = await exportPublicKey(publicKey);
                                const privateKeyWrapped = await wrapPrivateKey(privateKey, password, salt);

                                await api.post('/auth/update-encryption-keys', {
                                    public_key: publicKeyBase64,
                                    private_key_encrypted: privateKeyWrapped
                                });

                                // Update local user
                                const userData = localStorage.getItem('user');
                                if (userData) {
                                    const user = JSON.parse(userData);
                                    user.public_key = publicKeyBase64;
                                    localStorage.setItem('user', JSON.stringify(user));
                                }

                                alert("✅ Security Initialized! Your master gateway is now ready.");
                                window.location.reload();
                            } catch (err) {
                                alert("Initialization failed: " + err.message);
                            } finally {
                                setSearching(false);
                            }
                        }}
                        disabled={searching}
                        className="bg-amber-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-700 active:scale-95 transition-all"
                    >
                        {searching ? <FaSpinner className="animate-spin" /> : <><FaKey /> Initialize System Access</>}
                    </button>
                </div>
            )}

            {!activeAccess && (
                <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 shadow-xl space-y-8 animate-in slide-in-from-bottom-10 duration-700">
                    {/* Manual Search (PROMINENT FALLBACK) */}
                    <div className="bg-blue-50/50 rounded-3xl p-8 border-2 border-dashed border-blue-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <FaHandshake size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 leading-tight">Can't see your specialist?</h4>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">Link anyone by their email address</p>
                            </div>
                        </div>
                        <form onSubmit={handleManualSearch} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-2 pl-6 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm transition-all focus-within:scale-[1.02] transform duration-300">
                            <input
                                type="email"
                                placeholder="Enter specialist email address (e.g. admin@pharmacare.com)..."
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                                required
                            />
                            <button
                                type="submit"
                                disabled={searching || !manualEmail}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                            >
                                {searching ? <FaSpinner className="animate-spin" /> : 'Link Official'}
                            </button>
                        </form>
                    </div>

                    {admins.length > 0 && (
                        <div>
                            <h4 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <FaHandshake className="text-blue-500" /> Registry Verified Personnel
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {admins.map(admin => (
                                    <div 
                                        key={admin.id} 
                                        onClick={() => {
                                            setSelectedAdminId(admin.id);
                                            setManualRecipient(null);
                                        }}
                                        className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedAdminId === admin.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${selectedAdminId === admin.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-300'}`}>
                                                {admin.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-800 text-sm">{admin.full_name}</p>
                                                <p className={`text-[9px] font-black uppercase tracking-tight ${admin.public_key ? 'text-green-600' : 'text-amber-600 animate-pulse'}`}>
                                                    {admin.public_key ? 'Verified Official' : 'Security Setup Required'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAdminId === admin.id ? 'border-blue-600 bg-white' : 'border-gray-200'}`}>
                                            {selectedAdminId === admin.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 bg-red-50/40 rounded-3xl border border-red-100 flex items-start gap-4">
                <FaExclamationTriangle className="text-red-400 mt-1 shrink-0" />
                <p className="text-[11px] text-red-800/70 leading-relaxed font-medium">
                    Flipping the toggle to <span className="font-black">ON</span> creates a secure RSA-encrypted tunnel between your browser and the specialist's vault. No one else, including Addis Med servers, can see your data.
                </p>
            </div>
        </div>
    );
};

export default SupportAccess;
