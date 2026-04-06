import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes, FaUnlock, FaUserShield, FaExclamationCircle } from 'react-icons/fa';
import api from '../utils/api';
import { getEncryptionKey, encryptValue, hexToBytes, bytesToHex, encryptForRecipient } from '../utils/encryptionUtils';

/**
 * 🔔 AccessNotification Component
 * Shows pending data requests and allows the owner to approve 
 * by re-encrypting the patient's key for the requester.
 */
const AccessNotification = () => {
    const [requests, setRequests] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/access/pending');
            if (res.success) setRequests(res.requests);
        } catch (err) {
            console.error('Failed to fetch access requests', err);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (request) => {
        setProcessingId(request.id);
        try {
            console.log("🛡️ [Access] Approving request for:", request.requester.full_name);
            // 1. Get the current active encryption key (must be logged in)
            const masterKey = await getEncryptionKey();
            if (!masterKey) throw new Error("Key not in memory. Please log in again.");

            // 2. Export the Master Key to hex string format
            const rawKey = await crypto.subtle.exportKey("raw", masterKey);
            const masterKeyHex = Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2, '0')).join('');

            // 3. Obtain admin's public key from the request record
            if (!request.requester?.public_key) {
               throw new Error("Cannot share securely: Requester has no public security key.");
            }

            // 4. Encrypt the Master Key with the Admin's RSA Public Key
            const encryptedKeyForAdmin = await encryptForRecipient(masterKeyHex, request.requester.public_key);

            // 5. Submit approved ticket to the backend
            const res = await api.post('/access/approve', {
                request_id: request.id,
                encrypted_key: encryptedKeyForAdmin 
            });

            if (res.success) {
                setRequests(prev => prev.filter(r => r.id !== request.id));
                alert(`✅ Access granted to ${request.requester.full_name}`);
            }
        } catch (err) {
            alert("❌ Approval failed: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all animate-pulse"
                title="Pending Access Requests"
            >
                <FaBell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {requests.length}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] animate-in slide-in-from-top-2">
                    <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <FaUserShield /> Access Requests
                        </h3>
                        <button onClick={() => setIsOpen(false)}><FaTimes /></button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <FaUnlock />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">
                                            {req.requester?.full_name || 'Administrator'}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mb-2">
                                            Requests access to: <span className="font-bold text-blue-600">{req.patient?.full_name}</span>
                                        </p>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleApprove(req)}
                                                disabled={processingId === req.id}
                                                className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
                                            >
                                                {processingId === req.id ? '...' : <><FaCheck /> Approve</>}
                                            </button>
                                            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition">
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-3 bg-gray-50 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                            <FaExclamationCircle /> High Security Action
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessNotification;
