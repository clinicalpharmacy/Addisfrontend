import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    FaCog, FaUser, FaInfoCircle, FaCheckCircle, 
    FaLock, FaShieldAlt, FaEye, FaEyeSlash, FaSpinner, FaKey 
} from 'react-icons/fa';
import api from '../utils/api';

const Settings = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);
    const isAdmin =
        user?.role?.toLowerCase() === 'admin' ||
        user?.role?.toLowerCase() === 'administrator';
    const [commissionData, setCommissionData] = useState({ total_earned: 0, referrals_count: 0, promotion_code: 'N/A' });
    const [copied, setCopied] = useState(false);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' });

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

        if (location.hash === '#promotions') {
            setActiveTab('promotions');
        } else if (location.hash === '#security') {
            setActiveTab('security');
        } else {
            setActiveTab('profile');
        }
    }, [location]);

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        setPasswordStatus({ loading: true, error: '', success: '' });

        if (!passwordData.current_password) {
            setPasswordStatus({ loading: false, error: 'Please enter your current password.', success: '' });
            return;
        }
        if (!passwordData.new_password || passwordData.new_password.length < 6) {
            setPasswordStatus({ loading: false, error: 'New password must be at least 6 characters.', success: '' });
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordStatus({ loading: false, error: 'New password and confirmation do not match.', success: '' });
            return;
        }

        try {
            const res = await api.post('/auth/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            if (res.success) {
                setPasswordStatus({
                    loading: false,
                    error: '',
                    success: 'Your password has been updated successfully!'
                });
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
            } else {
                setPasswordStatus({
                    loading: false,
                    error: res.error || 'Failed to update password.',
                    success: ''
                });
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.error || err.message || 'An error occurred while updating password.';
            setPasswordStatus({ loading: false, error: msg, success: '' });
        }
    };

    const handleCopy = () => {
        const text = commissionData.promotion_code;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(err => console.error('Failed to copy', err));
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error("Fallback copy failed", error);
            }
            textArea.remove();
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
                    <p className="text-gray-500 font-medium">Personalize your experience and view your account profile</p>
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
                        <FaShieldAlt /> <span className="font-semibold">Security & Password</span>
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
                            </div>
                        ) : activeTab === 'security' ? (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-100 shadow-inner">
                                        <FaLock className="text-blue-600 text-2xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Security & Credentials</h2>
                                        <p className="text-sm text-gray-500">Update your account password to keep your clinical account secure</p>
                                    </div>
                                </div>

                                {passwordStatus.error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-2">
                                        <FaShieldAlt className="shrink-0 text-base" />
                                        <span>{passwordStatus.error}</span>
                                    </div>
                                )}

                                {passwordStatus.success && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm flex items-center gap-2 font-medium">
                                        <FaCheckCircle className="shrink-0 text-base text-green-600" />
                                        <span>{passwordStatus.success}</span>
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChangeSubmit} className="space-y-5 max-w-lg">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Current Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-11 text-sm bg-white"
                                                placeholder="Enter your current password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                tabIndex={-1}
                                            >
                                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            New Password (Min 6 characters) *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-11 text-sm bg-white"
                                                placeholder="Enter your new password"
                                                minLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                tabIndex={-1}
                                            >
                                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Confirm New Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirm_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-11 text-sm bg-white"
                                                placeholder="Re-enter your new password"
                                                minLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passwordStatus.loading}
                                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {passwordStatus.loading ? (
                                            <>
                                                <FaSpinner className="animate-spin text-base" />
                                                <span>Updating Password...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaKey className="text-sm" />
                                                <span>Update Password</span>
                                            </>
                                        )}
                                    </button>
                                </form>
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
                                            onClick={handleCopy}
                                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            {copied ? <><FaCheckCircle /> Copied!</> : 'Copy'}
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-4">
                                        Share this code with a new customer. When a new customer register and pay for a subscription using your code, you will earn a 2% commission!
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
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
