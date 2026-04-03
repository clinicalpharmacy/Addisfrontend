import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import {
    FaHome,
    FaUserInjured,
    FaPills,
    FaBookMedical,
    FaCogs,
    FaVial,
    FaChartBar,
    FaChevronDown,
    FaChevronRight,
    FaCapsules,
    FaStethoscope,
    FaUserCircle,
    FaHospital,
    FaPrescriptionBottleAlt,
    FaSignOutAlt,
    FaTimes,
    FaFileAlt,
    FaChartLine,
    FaBrain,
    FaUserMd,
    FaExclamationTriangle,
    FaLock,
    FaLink,
    FaExternalLinkAlt,
    FaBookmark,
    FaCreditCard,
    FaComments,
    FaCheckCircle
} from 'react-icons/fa';

// Force rebuild - ensuring all icons are properly bundled

const Sidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        patients: false,
        knowledge: false,
        cdss: false,
        links: false,
        settings: false
    });
    const [usefulLinks, setUsefulLinks] = useState([]);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        }
        fetchUsefulLinks();
    }, [location]);

    const fetchUsefulLinks = async () => {
        try {
            setLoadingLinks(true);
            const data = await api.get('/useful-links');
            if (data.success) {
                setUsefulLinks(data.links || []);
            }
        } catch (error) {
            console.error('Error fetching sidebar links:', error);
        } finally {
            setLoadingLinks(false);
        }
    };

    const hasValidSubscription = () => {
        if (!user) return false;
        if (user.role === 'admin') return true;

        // Prioritize user object data over localStorage
        const subscriptionStatus = user.subscription_status || localStorage.getItem('subscription_status');
        const hasSubscription = user.has_subscription !== undefined ? String(user.has_subscription) : localStorage.getItem('has_subscription');
        const subscriptionEndDate = user.subscription_end_date || localStorage.getItem('subscription_end_date');

        const isActive = subscriptionStatus === 'active' || hasSubscription === 'true';
        if (!isActive) return false;

        if (subscriptionEndDate) {
            const expiryDate = new Date(subscriptionEndDate);
            const now = new Date();
            if (now > expiryDate) return false;
        }
        return true;
    };

    const isSubscribed = hasValidSubscription();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Check user roles
    const isAdmin = user?.role === 'admin';
    const isCompanyAdmin = user?.role === 'company_admin';
    const isCompanyUser = !!user?.company_id || user?.account_type === 'company' || ['company_admin', 'company_user'].includes(user?.role);
    const isIndividual = !isAdmin && !isCompanyUser;

    // Check near expiry for subscription (within 7 days)
    const diff = user?.subscription_end_date ? new Date(user.subscription_end_date) - new Date() : null;
    const daysLeft = diff !== null ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : null;
    const isNearExpiry = daysLeft !== null && daysLeft <= 7;

    return (
        <aside className="w-72 bg-white h-full flex flex-col border-r border-gray-100 shadow-xl z-[60] relative overflow-hidden">
            {/* Design Element: Subtle Gradient Overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none" />

            {/* Close button for mobile */}
            <div className="p-5 border-b border-gray-50 flex justify-between items-center md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                        <FaHospital className="text-white text-base" />
                    </div>
                    <span className="font-black text-gray-900 tracking-tight">AddisMed</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-90"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 sm:p-5 overflow-y-auto no-scrollbar relative z-10">
                {/* Main Menu */}
                <div className="mb-8">
                    <h3 className="text-xs uppercase text-gray-400 font-black mb-4 tracking-[0.2em] px-3">Main Menu</h3>
                    <ul className="space-y-1.5">
                        <li>
                            <NavLink
                                to={isSubscribed ? "/home" : "/subscription/plans"}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 group ${isActive && isSubscribed
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-black'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold'
                                    } ${!isSubscribed ? 'opacity-60' : ''}`
                                }
                            >
                                <div className="flex items-center gap-2.5 w-full">
                                    <FaHome className="text-xl group-hover:scale-110 transition-transform" />
                                    <span className="text-base">Dashboard</span>
                                    {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                </div>
                            </NavLink>
                        </li>

                        {/* Patients Section */}
                        {!isAdmin && ( // Show for non-admins, including healthcare_client
                            <li className="mb-2">
                                <button
                                    onClick={() => isSubscribed ? toggleSection('patients') : navigate('/subscription/plans')}
                                    className={`flex items-center justify-between w-full p-2.5 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 font-bold group ${!isSubscribed ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <FaUserInjured className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="text-lg">Medication Review</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {!isSubscribed && <FaLock className="opacity-50" />}
                                        {expandedSections.patients ? <FaChevronDown /> : <FaChevronRight />}
                                    </div>
                                </button>

                                {expandedSections.patients && (
                                    <div className="ml-8 mt-2 space-y-1 animate-fadeIn">
                                        <NavLink
                                            to="/patients"
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-4 py-2 text-base rounded-lg transition-all ${isActive
                                                    ? 'text-blue-600 font-black'
                                                    : 'text-gray-400 hover:text-gray-700'
                                                }`
                                            }
                                        >
                                            <span className="w-2 h-2 rounded-full bg-current opacity-40" />
                                            MR List
                                        </NavLink>
                                        {!isAdmin && ( // Show for non-admins, including healthcare_client
                                        <NavLink
                                            to="/patients/new"
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-4 py-2 text-base rounded-lg transition-all ${isActive
                                                    ? 'text-blue-600 font-black'
                                                    : 'text-gray-400 hover:text-gray-700'
                                                }`
                                            }
                                        >
                                            <span className="w-2 h-2 rounded-full bg-current opacity-40" />
                                            New MR
                                        </NavLink>
                                        )}
                                    </div>
                                )}
                            </li>
                        )}

                        {!isAdmin && (
                            <li>
                                <NavLink
                                    to={isSubscribed ? "/cdss-analysis" : "/subscription/plans"}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group ${isActive
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 font-black'
                                            : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700 font-bold'
                                        } ${!isSubscribed ? 'opacity-60 cursor-not-allowed' : ''}`
                                    }
                                >
                                    <div className="flex items-center gap-2.5">
                                        <FaBrain className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="text-base">Clinical Analysis</span>
                                    </div>
                                    {!isSubscribed && <FaLock className="text-xs opacity-50" />}
                                </NavLink>
                            </li>
                        )}

                        {/* Medication Availability Link */}
                        <li className="mb-2">
                            <NavLink
                                to={isSubscribed ? "/medication-availability" : "/subscription/plans"}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive && isSubscribed
                                        ? 'bg-green-50 text-green-600 border-l-4 border-green-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'
                                    } ${!isSubscribed ? 'opacity-60' : ''}`
                                }
                            >
                                <div className="flex items-center gap-2.5 w-full">
                                    <FaPills className="text-xl" />
                                    <span className="font-bold text-base">መድሃኒት ማፈላለጊያ</span>
                                    {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                </div>
                            </NavLink>
                        </li>

                        {/* Knowledge Base Section */}
                        <li className="mb-2">
                            <button
                                onClick={() => isSubscribed ? toggleSection('knowledge') : navigate('/subscription/plans')}
                                className={`flex items-center justify-between w-full p-2.5 rounded-xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300 font-bold group ${!isSubscribed ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FaBookMedical className="text-xl group-hover:scale-110 transition-transform" />
                                    <span className="text-lg">Resources</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {!isSubscribed && <FaLock className="opacity-50" />}
                                    {expandedSections.knowledge ? <FaChevronDown /> : <FaChevronRight />}
                                </div>
                            </button>

                            {expandedSections.knowledge && (
                                <div className="ml-8 mt-2 space-y-1 animate-fadeIn">
                                    <NavLink
                                        to="/knowledge"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-4 py-2 text-lg rounded-lg transition-all ${isActive
                                                ? 'text-indigo-600 font-black'
                                                : 'text-gray-400 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        <FaCapsules className="text-base opacity-40" /> የመድሃኒት መረጃ
                                    </NavLink>
                                    <NavLink
                                        to="/knowledge/remedies"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-4 py-2 text-lg rounded-lg transition-all ${isActive
                                                ? 'text-indigo-600 font-black'
                                                : 'text-gray-400 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        <FaVial className="text-base opacity-40" /> የቤት ውስጥ ጤና ክብካቤ መፍትሔዎች 
                                    </NavLink>
                                    {(!isIndividual || ['pharmacist', 'pharmacy_student'].includes(user?.role)) && (
                                        <>
                                            <NavLink
                                                to="/knowledge/illnesses"
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2.5 px-4 py-2 text-lg rounded-lg transition-all ${isActive
                                                        ? 'text-indigo-600 font-black'
                                                        : 'text-gray-400 hover:text-gray-700'
                                                    }`
                                                }
                                            >
                                                <FaStethoscope className="text-base opacity-40" /> Minor Illnesses
                                            </NavLink>
                                            <NavLink
                                                to="/knowledge/compounding"
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2.5 px-4 py-2 text-lg rounded-lg transition-all ${isActive
                                                        ? 'text-indigo-600 font-black'
                                                        : 'text-gray-400 hover:text-gray-700'
                                                    }`
                                                }
                                            >
                                                <FaVial className="text-base opacity-40" /> Compounding
                                            </NavLink>
                                            <NavLink
                                                to="/knowledge/education"
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2.5 px-4 py-2 text-lg rounded-lg transition-all ${isActive
                                                        ? 'text-indigo-600 font-black'
                                                        : 'text-gray-400 hover:text-gray-700'
                                                    }`
                                                }
                                            >
                                                <FaVial className="text-base opacity-40" /> Education
                                            </NavLink>
                                        </>
                                    )}
                                </div>
                            )}
                        </li>

                        {/* Public Useful Links Page - Hidden only for healthcare clients */}
                        {(user?.role !== 'healthcare_client' || !isIndividual) && (
                            <li className="mb-2">
                                <NavLink
                                    to={isSubscribed ? "/useful-links" : "/subscription/plans"}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive && isSubscribed
                                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm'
                                        } ${!isSubscribed ? 'opacity-60' : ''}`
                                    }
                                >
                                    <div className="flex items-center gap-2.5 w-full">
                                        <FaBookmark className="text-xl" />
                                        <span className="font-medium text-base">Useful Links</span>
                                        {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                    </div>
                                </NavLink>
                            </li>
                        )}

                        <li>
                            <button
                                onClick={() => toggleSection('settings')}
                                className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all duration-300 group ${location.pathname.startsWith('/settings')
                                    ? 'bg-blue-50 text-blue-600 font-black'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FaCogs className="text-xl group-hover:rotate-45 transition-transform" />
                                    <span className="text-base">Settings</span>
                                </div>
                                {expandedSections.settings ? <FaChevronDown className="text-current text-xs" /> : <FaChevronRight className="text-current text-xs" />}
                            </button>

                            {expandedSections.settings && (
                                <div className="ml-8 mt-2 space-y-1 animate-fadeIn">
                                    <NavLink
                                        to="/settings"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg transition-all ${isActive && !location.hash
                                                ? 'text-blue-600 font-black'
                                                : 'text-gray-400 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        <FaUserCircle className="text-xs" /> Profile info
                                    </NavLink>
                                    <NavLink
                                        to="/settings#security"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg transition-all ${location.hash === '#security'
                                                ? 'text-blue-600 font-black'
                                                : 'text-gray-400 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        <FaLock className="text-xs" /> Security Access
                                    </NavLink>
                                </div>
                            )}
                        </li>
                        {isIndividual && (!isSubscribed || isNearExpiry) && (
                            <li className="mt-2 border-t pt-2">
                                <NavLink
                                    to="/subscription/plans"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaCreditCard className="text-xl text-blue-600" />
                                    <span className="font-medium text-base">My Subscription</span>
                                </NavLink>
                            </li>
                        )}

                        {isCompanyAdmin && (
                            <li>
                                <NavLink
                                    to="/subscription/plans"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaCreditCard className="text-xl text-blue-600" />
                                    <span className="font-medium text-base">Manage Subscription</span>
                                </NavLink>
                            </li>
                        )}
                        <li>
                            <NavLink
                                to={isSubscribed ? "/feedback" : "/subscription/plans"}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 group ${isActive && isSubscribed
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-black'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold'
                                    } ${!isSubscribed ? 'opacity-60' : ''}`
                                }
                            >
                                <div className="flex items-center gap-2.5 w-full">
                                    <FaComments className="text-xl group-hover:scale-110 transition-transform" />
                                    <span className="text-base">Feedback/አስተያየት</span>
                                    {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                </div>
                            </NavLink>
                        </li>
                    </ul>
                </div>

                {/* Quick Actions */}
                {!isAdmin && user?.role !== 'healthcare_client' && (
                    <div className="mb-8">
                        <h3 className="text-xs uppercase text-gray-400 font-black mb-4 tracking-[0.2em] px-3">
                            Quick Actions
                        </h3>
                
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => {
                                        if (isSubscribed) {
                                            navigate('/patients/new');
                                        } else {
                                            navigate('/subscription/plans');
                                        }
                                        onClose?.();
                                    }}
                                    className={`flex items-center justify-between p-2.5 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 w-full text-left transition-all duration-300 font-bold group ${
                                        !isSubscribed ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-lg transition-colors">
                                            <FaUserInjured className="text-base" />
                                        </div>
                                        <span className="text-base">New MR</span>
                                    </div>
                
                                    {!isSubscribed && <FaLock className="text-xs opacity-50" />}
                                </button>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Admin Navigation */}
                {isAdmin && (
                    <div className="mb-8">
                        <h3 className="text-xs uppercase text-gray-400 font-black mb-4 tracking-[0.2em] px-3">Admin</h3>
                        <ul className="space-y-1.5">
                            {/* CDSS Section */}
                            <li className="mb-2">
                                <button
                                    onClick={() => toggleSection('cdss')}
                                    className="flex items-center justify-between w-full p-2.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:shadow-sm border-l-4 border-purple-500"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <FaBrain className="text-lg" />
                                        <span className="font-medium">CDSS Admin Tools</span>
                                    </div>
                                    {expandedSections.cdss ? <FaChevronDown className="text-purple-400" /> : <FaChevronRight className="text-purple-400" />}
                                </button>

                                {expandedSections.cdss && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        <NavLink
                                            to="/admin/cdss/rules"
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                                    ? 'text-purple-600 bg-purple-50 font-medium'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                                }`
                                            }
                                        >
                                            <FaCogs className="text-sm" />
                                            Clinical Rules Admin
                                        </NavLink>
                                    </div>
                                )}
                            </li>

                            {/* System Setup Section */}
                            <li className="mb-2">
                                <NavLink
                                    to="/admin/labs"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-red-50 hover:text-red-800 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaVial className="text-lg" />
                                    <span className="font-medium">Lab Definitions</span>
                                </NavLink>
                            </li>

                            {/* Admin Dashboard */}
                            <li className="mb-2">
                                <NavLink
                                    to="/admin/dashboard"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaCogs className="text-lg" />
                                    <span className="font-medium">Admin Dashboard</span>
                                </NavLink>
                            </li>

                            {/* Admin Link Management Link */}
                            <li className="mb-2">
                                <NavLink
                                    to="/admin/useful-links"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaLink className="text-xl" />
                                    <span className="font-medium text-base">Manage Links</span>
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Company Admin Dashboard Link (Only for company admin users) */}
                {isCompanyAdmin && (
                    <div className="mb-8">
                        <h3 className="text-xs uppercase text-gray-400 font-black mb-4 tracking-[0.2em] px-3">Company</h3>
                        <ul className="space-y-1.5">
                            <li className="mb-2">
                                <NavLink
                                    to={isSubscribed ? "/company/dashboard" : "/subscription/plans"}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive && isSubscribed
                                            ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:shadow-sm'
                                        } ${!isSubscribed ? 'opacity-60' : ''}`
                                    }
                                >
                                    <div className="flex items-center gap-2.5 w-full">
                                        <FaChartBar className="text-lg" />
                                        <span className="font-medium">Company Dashboard</span>
                                        {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                    </div>
                                </NavLink>
                            </li>

                            <li className="mb-2">
                                <NavLink
                                    to={isSubscribed ? "/company-performance" : "/subscription/plans"}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${isActive && isSubscribed
                                            ? 'bg-green-50 text-green-600 border-l-4 border-green-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'
                                        } ${!isSubscribed ? 'opacity-60' : ''}`
                                    }
                                >
                                    <div className="flex items-center gap-2.5 w-full">
                                        <FaChartLine className="text-lg" />
                                        <span className="font-medium">Performance Report</span>
                                        {!isSubscribed && <FaLock className="ml-auto text-xs opacity-50" />}
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUserCircle className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                            {user?.full_name || user?.email || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {user?.role?.replace('_', ' ') || 'Pharmacist'}
                            {isAdmin && (
                                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                    Admin
                                </span>
                            )}
                            {isCompanyAdmin && (
                                <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                    Company Admin
                                </span>
                            )}
                        </p>
                        {!isAdmin && user?.subscription_end_date && (
                            <p className={`text-[10px] font-medium mt-0.5 ${new Date(user.subscription_end_date) > new Date() ? 'text-green-600' : 'text-red-500'
                                }`}>
                                {(() => {
                                    const diff = new Date(user.subscription_end_date) - new Date();
                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                    return days > 0 ? `${days} Days Left` : 'Expired';
                                })()}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200 hover:shadow-sm"
                >
                    <FaSignOutAlt />
                    <span className="font-medium">Logout</span>
                </button>
            </div>

            {/* 🛡️ Modern Security Status Badge (Sidebar Footer Addition) */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
                <div className={`p-4 rounded-2xl border-2 transition-all duration-500 shadow-sm flex items-center justify-between group cursor-pointer ${user?.public_key ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100 animate-pulse'}`}
                    onClick={() => navigate('/settings#security')}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-xs transition-colors ${user?.public_key ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-red-500 text-white shadow-lg shadow-red-100'}`}>
                            {user?.public_key ? <FaLock /> : <FaExclamationTriangle className="animate-bounce" />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${user?.public_key ? 'text-green-700' : 'text-red-700'}`}>
                                Identity: {user?.public_key ? 'Secured' : 'Missing'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight group-hover:underline">
                                {user?.public_key ? 'Zero-Knowledge Active' : 'Setup Required Now'}
                            </span>
                        </div>
                    </div>
                    {user?.public_key ? (
                        <FaCheckCircle className="text-green-500 text-sm opacity-50" />
                    ) : (
                        <FaChevronRight className="text-red-500 text-sm animate-bounce" />
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
