import React, { useState, useEffect } from 'react';
import { FaLifeRing, FaShieldAlt, FaKey, FaHandshake, FaCheckCircle, FaExclamationTriangle, FaLock, FaUserShield } from 'react-icons/fa';
import api from '../../utils/api';
import { getEncryptionKey, encryptForRecipient } from '../../utils/encryptionUtils';

/**
 * 🛠️ SupportAccess Component
 * Allows users to safely share their "Master Key" with a specific Support Admin
 * without revealing it to the backend database.
 */
const SupportAccess = () => {
    const [loading, setLoading] = useState(false);
    const [granting, setGranting] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const [admins, setAdmins] = useState([]);

    const fetchAdmins = async () => {
        try {
            // Find administrators with a public key
            const res = await api.get('/admin/security-users');
            if (res.success) setAdmins(res.users || []);
        } catch (err) {
            console.error("Failed to fetch support admins", err);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleGrantAccess = async (adminId, adminPubKey) => {
        setGranting(true);
        try {
            // 1. Get the current User's Master AES Key from memory
            const masterKey = await getEncryptionKey();
            if (!masterKey) throw new Error("Please log in again to verify your identity.");

            // 2. Export the Master Key to hex string
            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            const rawKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

            // 3. Encrypt the Master Key for the ADMIN'S RSA Public Key
            const encryptedKey = await encryptForRecipient(rawKeyBase64, adminPubKey);

            // 4. Create a Support Ticket/Session
            const res = await api.post('/access/request', {
                patient_id: null, // null means account-wide profile access
                owner_id: JSON.parse(localStorage.getItem('user')).id,
                requester_id: adminId,
                encrypted_key: encryptedKey,
                status: 'granted' // Instant grant
            });

            if (res.success) {
                alert("✅ Troubleshooting access granted! The admin can now help you.");
            }
        } catch (err) {
            alert("❌ Grant Failed: " + err.message);
        } finally {
            setGranting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <FaLifeRing size={200} />
                </div>
                
                <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <FaUserShield /> Help & Troubleshooting
                </h3>
                <p className="text-indigo-100 font-medium max-w-lg">
                    Need help with your data? You can securely authorize an official Addis Med Administrator to view your records for support.
                </p>
                
                <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <div className="flex items-center gap-3">
                        <FaLock className="text-green-300" />
                        <p className="text-sm font-bold">Zero-Knowledge Support: Your password is NEVER shared.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaHandshake className="text-blue-600" /> Available Support Admins
                </h4>
                
                <div className="space-y-4">
                    {admins.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl">
                            <FaSpinner className="animate-spin text-gray-300 mx-auto mb-4" size={30} />
                            <p className="text-gray-500 font-medium">Looking for active support representatives...</p>
                        </div>
                    ) : (
                        admins.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-bold border border-gray-100 group-hover:scale-110 transition-transform">
                                        {admin.full_name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{admin.full_name}</p>
                                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                            <FaCheckCircle /> Verified Support Official
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleGrantAccess(admin.id, admin.public_key)}
                                    disabled={granting}
                                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                                >
                                    {granting ? 'Granting...' : 'Grant Access'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                <FaExclamationTriangle className="text-red-500 mt-1" />
                <div>
                    <h5 className="font-bold text-red-800">Security Notice</h5>
                    <p className="text-sm text-red-600 leading-relaxed">
                        Only grant access to verified Support Officials. Access allows the administrator to view all your patient data for troubleshooting. You can revoke this permission at any time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportAccess;
