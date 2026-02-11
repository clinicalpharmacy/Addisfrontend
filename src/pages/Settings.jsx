import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaCog, FaUser, FaLock, FaShieldAlt, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaBell, FaInfoCircle } from 'react-icons/fa';
import api from '../utils/api';

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

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        if (location.hash === '#security') {
            setActiveTab('security');
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

        if (passwords.new.length < 6) {
            setStatus({ type: 'error', message: 'New password must be at least 6 characters' });
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
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <FaUser className={activeTab === 'profile' ? 'text-white' : 'text-blue-500'} />
                        <span className="font-semibold">Profile Info</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${activeTab === 'security'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <FaShieldAlt className={activeTab === 'security' ? 'text-white' : 'text-purple-500'} />
                        <span className="font-semibold">Security</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-gray-400 cursor-not-allowed group"
                        title="Coming Soon"
                    >
                        <FaBell className="group-hover:text-gray-500" />
                        <span className="font-semibold">Notifications</span>
                        <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">Soon</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                        {activeTab === 'profile' ? (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
                                        <FaUser className="text-blue-600 text-3xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Your Profile'}</h2>
                                        <p className="text-gray-500">{user?.email}</p>
                                        <span className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                            {user?.role?.replace('_', ' ') || 'User'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Full Name</p>
                                            <p className="font-semibold text-gray-800">{user?.full_name || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email Address</p>
                                            <p className="font-semibold text-gray-800">{user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Account Type</p>
                                            <p className="font-semibold text-gray-800 capitalize">{user?.account_type || 'Individual'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Member Since</p>
                                            <p className="font-semibold text-gray-800">
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Subscription</p>
                                            <div className="flex flex-col">
                                                <p className="font-semibold text-gray-800 capitalize">
                                                    {user?.role === 'admin' ? 'Unlimited (Admin)' : (user?.subscription_status || 'Inactive')}
                                                </p>
                                                {user?.role !== 'admin' && user?.subscription_end_date && (
                                                    <p className={`text-xs font-medium mt-1 ${new Date(user.subscription_end_date) > new Date() ? 'text-green-600' : 'text-red-500'}`}>
                                                        {(() => {
                                                            const diff = new Date(user.subscription_end_date) - new Date();
                                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                            return days > 0 ? `${days} days remaining` : 'Expired';
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                                    <div className="bg-blue-600 p-2 rounded-xl mt-1">
                                        <FaInfoCircle className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900">Profile Updates</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Profile editing is being enhanced. Soon you will be able to update your clinical credentials and contact information directly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                                            <FaLock />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Security & Password</h2>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Secure</span>
                                </div>

                                {status.message && (
                                    <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 transform animate-bounce-subtle ${status.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-100 shadow-sm shadow-green-100'
                                        : 'bg-red-50 text-red-700 border border-red-100 shadow-sm shadow-red-100'
                                        }`}>
                                        {status.type === 'success' ? <FaCheckCircle className="text-xl" /> : <FaExclamationTriangle className="text-xl" />}
                                        <p className="text-sm font-semibold">{status.message}</p>
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChange} className="space-y-6">
                                    <div className="group">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300"
                                                placeholder="Min. 6 chars"
                                                required
                                                minLength="6"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300"
                                                placeholder="Re-type password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <FaShieldAlt className="text-blue-400" />
                                            <span>Your data is encrypted end-to-end</span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 ${loading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                                }`}
                                        >
                                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;