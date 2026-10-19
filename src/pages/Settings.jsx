import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaCog, FaUser, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
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
        } else {
            setActiveTab('profile');
        }
    }, [location]);

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
