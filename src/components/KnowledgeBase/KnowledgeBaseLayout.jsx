import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    FaPills,
    FaFlask,
    FaStethoscope,
    FaMortarPestle,
    FaBookMedical,
    FaHome,
    FaShieldAlt
} from 'react-icons/fa';
import './KnowledgeBase.css';

const KnowledgeBaseLayout = () => {
    const tabs = [
        { path: 'medications', label: 'Medications', icon: <FaPills /> },
        { path: 'remedies', label: 'Home Remedies', icon: <FaFlask /> },
        { path: 'illnesses', label: 'Minor Illnesses', icon: <FaStethoscope /> },
        { path: 'compounding', label: 'Compounding & Reconstitution', icon: <FaMortarPestle /> },
    ];

    const [protectionMessage, setProtectionMessage] = React.useState('');

    // Screenshot Protection Logic
    React.useEffect(() => {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const isAdmin = user?.role === 'admin';

        if (isAdmin) return; // Admins are not restricted

        const showMessage = (msg) => {
            setProtectionMessage(msg);
            setTimeout(() => setProtectionMessage(''), 3000);
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
            showMessage('Right-click is disabled to protect proprietary information.');
            return false;
        };

        const handleKeyDown = (e) => {
            // Disable PrintScreen, F12, and Copy/Paste shortcuts
            const forbiddenKeys = ['PrintScreen', 'F12'];
            const copyKeys = ['c', 'v', 'x', 'a', 'p'];

            if (forbiddenKeys.includes(e.key)) {
                e.preventDefault();
                showMessage('Screenshots are disabled to protect medical data.');
                return false;
            }

            if ((e.ctrlKey || e.metaKey) && copyKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
                const action = e.key.toLowerCase() === 'p' ? 'Printing' : 'Copying';
                showMessage(`${action} is disabled on Knowledge Base pages.`);
                return false;
            }
        };

        const handleBlur = () => {
            const content = document.getElementById('kb-protected-content');
            if (content) {
                content.style.filter = 'blur(15px) grayscale(1)';
                content.style.opacity = '0.5';
                content.style.transition = 'all 0.3s ease';
            }
        };

        const handleFocus = () => {
            const content = document.getElementById('kb-protected-content');
            if (content) {
                content.style.filter = 'none';
                content.style.opacity = '1';
            }
        };

        const handleCopy = (e) => { e.preventDefault(); showMessage('Copying is disabled.'); };
        const handleCut = (e) => { e.preventDefault(); showMessage('Cutting is disabled.'); };
        const handleBeforePrint = (e) => { e.preventDefault(); showMessage('Printing is disabled.'); };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') handleBlur();
            else handleFocus();
        };

        // Add listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeprint', handleBeforePrint);

        // Print protection CSS
        const style = document.createElement('style');
        style.id = 'kb-protection-styles';
        style.innerHTML = `
            @media print {
                body { display: none !important; }
            }
            .select-none {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }
            #kb-protected-content {
                transition: filter 0.3s ease, opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeprint', handleBeforePrint);
            const styleEl = document.getElementById('kb-protection-styles');
            if (styleEl) styleEl.remove();
        };
    }, []);

    return (
        <div className="space-y-6 knowledge-base-container overflow-x-hidden max-w-full relative">
            {/* Protection Toast */}
            {protectionMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white">
                        <FaShieldAlt className="text-xl" />
                        <span className="font-bold text-sm md:text-base whitespace-nowrap">{protectionMessage}</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Knowledge Base</h1>
                            <p className="text-gray-600 text-sm md:text-base">Access comprehensive information about medications, treatments, and patient care.</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 uppercase tracking-wider">
                            <FaShieldAlt className="animate-pulse" />
                            Screenshot Protected
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.path === 'medications'}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area - Protected with ID and blur logic */}
            <div id="kb-protected-content" className="min-h-[500px] select-none">
                <Outlet />
            </div>
        </div>
    );
};

export default KnowledgeBaseLayout;
