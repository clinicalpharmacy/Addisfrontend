import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaCog, FaUser, FaLock, FaUserShield, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaBell, FaInfoCircle, FaUnlock, FaLifeRing } from 'react-icons/fa';
import api from '../utils/api';
import SupportActivationPortal from '../components/Security/SupportActivationPortal';
import SupportAccess from '../components/Security/SupportAccess';
import SecurityActivator from '../components/Security/SecurityActivator';

const Settings = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('profile');
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [user, setUser] = useState(null);
    const isAdmin =
        user?.role?.toLowerCase() === 'admin' ||
        user?.role?.toLowerCase() === 'administrator';
    const [commissionData, setCommissionData] = useState({ total_earned: 0, referrals_count: 0, promotion_code: 'N/A' });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        api.get('/auth/commissions')
            .then(res => {
                if (res.success) {
                    setCommissionData({
                        total_earned: res.total_earned,
                        referrals_count: res.referrals_count,
                        promotion_code: res.promotion_code
                    });
                }
            })
            .catch(err => console.error("Failed to load commissions:", err));

        if (location.hash === '#security') {
            setActiveTab('security');
        } else if (location.hash === '#access') {
            setActiveTab('access');
        } else if (location.hash === '#support') {
            setActiveTab('support');
        } else {
            setActiveTab('profile');
        }
    }, [location]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (passwords.new !== passwords.confirm) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            const result = await api.post('/auth/change-password', {
                current_password: passwords.current,
                new_password: passwords.new
            });

            if (result.success) {
                setStatus({ type: 'success', message: 'Password changed successfully!' });
                setPasswords({ current: '', new: '', confirm: '' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.error || error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                    <FaCog className="text-white text-2xl animate-spin-slow" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Account Settings
                    </h1>
                    <p className="text-gray-500 font-medium">Personalize your experience and secure your account</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FaUser /> <span className="font-semibold">Profile Info</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FaUserShield /> <span className="font-semibold">Security</span>
                    </button>
                    {!isAdmin && (
                        <button
                            onClick={() => setActiveTab('promotions')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${activeTab === 'promotions' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <FaInfoCircle /> <span className="font-semibold">Promotions</span>
                        </button>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {activeTab === 'profile' ? (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
                                        <FaUser className="text-blue-600 text-3xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Your Profile'}</h2>
                                        <p className="text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Account Type</p>
                                        <p className="font-semibold text-gray-800 capitalize">{user?.role || 'Individual'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Status</p>
                                        <p className="font-semibold text-gray-800 capitalize">{user?.subscription_status || 'Active'}</p>
                                    </div>
                                </div>
                                <div className="mt-8 p-6 bg-blue-50 rounded-3xl flex items-start gap-4">
                                    <FaInfoCircle className="text-blue-600 mt-1" />
                                    <p className="text-sm text-blue-800">Your profile is currently protected by Zero-Knowledge encryption.</p>
                                </div>
                            </div>
                        ) : activeTab === 'promotions' && !isAdmin ? (
                            <div className="p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Promotions & Referrals
                                </h2>
                        
                                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-3xl">
                                    <p className="text-sm text-gray-600 font-bold uppercase mb-2">
                                        Your Promotion Code
                                    </p>
                        
                                    <div className="flex items-center gap-4">
                                        <div className="px-6 py-3 bg-white text-blue-700 text-2xl font-mono font-bold rounded-xl shadow-inner border-2 border-blue-300 tracking-widest">
                                            {commissionData.promotion_code}
                                        </div>
                        
                                        <button
                                            onClick={() => navigator.clipboard.writeText(commissionData.promotion_code)}
                                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                                        >
                                            Copy
                                        </button>
                                    </div>
                        
                                    <p className="text-sm text-gray-500 mt-4">
                                        Share this code with others. When they register and pay for a subscription using your code, you earn a 2% commission!
                                    </p>
                                </div>
                        
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                                        <p className="text-sm font-bold text-green-700 uppercase mb-1">
                                            Total Earned
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {commissionData.total_earned} ETB
                                        </p>
                                    </div>
                        
                                    <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                                        <p className="text-sm font-bold text-purple-700 uppercase mb-1">
                                            Total Referrals
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {commissionData.referrals_count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'security' ? (
                            <div className="p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Security & Password</h2>
                                
                                {user && !user.public_key && (
                                    <div className="mb-8 p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl animate-in zoom-in-95 duration-500">
                                        <SecurityActivator onActivated={(updatedUser) => setUser(updatedUser)} />
                                    </div>
                                )}

                                {status.message && (
                                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                        <p className="text-sm font-semibold">{status.message}</p>
                                    </div>
                                )}
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password (min. 6 characters)</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            minLength="6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password (min. 6 characters)</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            minLength="6"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                                    >
                                        {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
