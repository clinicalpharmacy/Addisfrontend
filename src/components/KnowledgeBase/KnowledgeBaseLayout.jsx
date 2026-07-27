import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    FaPills,
    FaVial,
    FaStethoscope,
    FaMortarPestle,
    FaBookMedical,
    FaHome,
    FaUserShield,
    FaLock,
    FaBan,
    FaTimes,
    FaCheckCircle,
    FaBookOpen
} from 'react-icons/fa';
import './KnowledgeBase.css';

const KnowledgeBaseLayout = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [protectionEnabled, setProtectionEnabled] = useState(true);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAdmin(parsedUser.role === 'admin' || parsedUser.role === 'company_admin');
                setIsSuperAdmin(parsedUser.role === 'admin');
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, []);

    const toggleProtection = () => {
        if (!isSuperAdmin) return;
        setProtectionEnabled(!protectionEnabled);
        setSuccess(`Protection ${!protectionEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
    };

    const hasFullAccess =
        user?.role === 'admin' ||
        user?.role === 'company_admin' ||
        user?.account_type === 'company_user' ||
        user?.role === 'pharmacist' ||
        user?.role === 'pharmacy_student';

    const tabs = [
        { path: 'medications', icon: <FaPills /> },
        { path: 'remedies', icon: <FaVial /> },
        ...(hasFullAccess ? [
            { path: 'illnesses', icon: <FaStethoscope /> },
            { path: 'compounding', icon: <FaMortarPestle /> },
            { path: 'education', icon: <FaBookOpen /> }
        ] : []),
    ];

    return (
        <div className="space-y-6 px-6 max-w-7xl mx-auto knowledge-base-container overflow-x-hidden relative">

            {success && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-fadeIn">
                    <div className="bg-green-600 text-white p-3 rounded-lg shadow-xl flex items-center justify-between gap-3 border border-green-400">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle />
                            <span className="font-medium">{success}</span>
                        </div>
                        <button onClick={() => setSuccess('')}><FaTimes /></button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center justify-between gap-4">
                        {isSuperAdmin && (
                            <button
                                onClick={toggleProtection}
                                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all shadow-sm flex-shrink-0 ${protectionEnabled
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                    }`}
                                title={protectionEnabled ? "Disable Protection" : "Enable Protection"}
                            >
                                {protectionEnabled ? <FaLock /> : <FaUserShield />}
                                <span className="hidden sm:inline font-bold">
                                    {protectionEnabled ? 'Strict Mode' : 'Allow Copy'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation - Icons Only */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.path === 'medications'}
                                className={({ isActive }) =>
                                    `flex items-center justify-center py-3 md:py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                <span className="text-xl">{tab.icon}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px] transition-all duration-300">
                <Outlet context={{ protectionEnabled, toggleProtection, isAdmin, isSuperAdmin, user }} />
            </div>
        </div>
    );
};

export default KnowledgeBaseLayout;
