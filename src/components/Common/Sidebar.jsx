import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import {
    FaHome,
    FaUserInjured,
    FaPills,
    FaBookMedical,
    FaCogs,
    FaFlask,
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
    FaBookmark
} from 'react-icons/fa';

const Sidebar = ({ onClose }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        patients: false,
        knowledge: false,
        cdss: false,
        links: false
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

    return (
        <aside className="w-64 bg-white h-full flex flex-col border-r border-gray-200 shadow-lg">
            {/* Close button for mobile */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center md:hidden">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <FaHospital className="text-white text-lg" />
                    </div>
                    <span className="font-bold text-gray-800">PharmaCare</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Logo for desktop */}
            <div className="p-4 border-b border-gray-200 hidden md:block">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <FaHospital className="text-white text-lg" />
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block">AddisMed</span>
                        <span className="text-xs text-gray-500">AddisMed System</span>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 overflow-y-auto">
                {/* Main Menu */}
                <div className="mb-6">
                    <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">Main Menu</h3>
                    <ul className="space-y-1">
                        <li>
                            <NavLink
                                to="/home"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'
                                    }`
                                }
                            >
                                <FaHome className="text-lg" />
                                <span className="font-medium">Dashboard</span>
                            </NavLink>
                        </li>
                        {!isAdmin && (
                            <li>
                                <NavLink
                                    to={isSubscribed ? "/cdss-analysis" : "/subscription/plans"}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm'
                                        } transition-all duration-200 ${!isSubscribed ? 'opacity-70' : ''}`
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <FaBrain className="text-lg" />
                                        <span className="font-medium">Clinical Analysis</span>
                                    </div>
                                    {!isSubscribed && <FaLock className="text-xs text-gray-400" />}
                                </NavLink>
                            </li>
                        )}
                        <li>
                            <NavLink
                                to={isSubscribed ? "/reports" : "/subscription/plans"}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'
                                    } ${!isSubscribed && !isAdmin ? 'opacity-70' : ''}`
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <FaChartLine className="text-lg" />
                                    <span className="font-medium">Reports</span>
                                </div>
                                {!isSubscribed && !isAdmin && <FaLock className="text-xs text-gray-400" />}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/settings"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'
                                    }`
                                }
                            >
                                <FaCogs className="text-lg" />
                                <span className="font-medium">Settings</span>
                            </NavLink>
                        </li>
                        {isCompanyAdmin && (
                            <li className="mt-2 border-t pt-2">
                                <NavLink
                                    to="/company-performance"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaChartBar className="text-lg text-purple-600" />
                                    <span className="font-medium">Company Performance</span>
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Quick Actions - REMOVED DUPLICATES */}
                <div className="mb-6">
                    <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">Quick Actions</h3>
                    <ul className="space-y-2">
                        {!isAdmin && (
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
                                    className={`flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 w-full text-left transition-all duration-200 hover:shadow-sm ${!isSubscribed ? 'opacity-70' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FaUserInjured className="text-lg" />
                                        <span className="font-medium">New Patient</span>
                                    </div>
                                    {!isSubscribed && <FaLock className="text-xs text-gray-400" />}
                                </button>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Advanced Navigation */}
                <div className="mb-6">
                    <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">Navigation</h3>

                    {/* Patients Section */}
                    {!isAdmin && (
                        <div className="mb-2">
                            <button
                                onClick={() => isSubscribed ? toggleSection('patients') : navigate('/subscription/plans')}
                                className={`flex items-center justify-between w-full p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 hover:shadow-sm ${!isSubscribed ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <FaUserInjured className="text-lg" />
                                    <span className="font-medium">Patients</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isSubscribed && <FaLock className="text-xs text-gray-400" />}
                                    {expandedSections.patients ? <FaChevronDown className="text-gray-400" /> : <FaChevronRight className="text-gray-400" />}
                                </div>
                            </button>

                            {expandedSections.patients && (
                                <div className="ml-6 mt-1 space-y-1">
                                    <NavLink
                                        to="/patients"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                                ? 'text-blue-600 bg-blue-50 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                            }`
                                        }
                                    >
                                        <FaUserInjured className="text-sm" />
                                        Patient List
                                    </NavLink>
                                    <NavLink
                                        to="/patients/new"
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                                ? 'text-blue-600 bg-blue-50 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                            }`
                                        }
                                    >
                                        <FaUserInjured className="text-sm" />
                                        New Patient
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Knowledge Base Section */}
                    <div className="mb-2">
                        <button
                            onClick={() => (isSubscribed || isAdmin) ? toggleSection('knowledge') : navigate('/subscription/plans')}
                            className={`flex items-center justify-between w-full p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 hover:shadow-sm ${!isSubscribed && !isAdmin ? 'opacity-70' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <FaBookMedical className="text-lg" />
                                <span className="font-medium">Knowledge Base</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isSubscribed && !isAdmin && <FaLock className="text-xs text-gray-400" />}
                                {expandedSections.knowledge ? <FaChevronDown className="text-gray-400" /> : <FaChevronRight className="text-gray-400" />}
                            </div>
                        </button>

                        {expandedSections.knowledge && (
                            <div className="ml-6 mt-1 space-y-1">
                                <NavLink
                                    to="/knowledge"
                                    onClick={onClose}
                                    end
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                            ? 'text-blue-600 bg-blue-50 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <FaCapsules className="text-sm" />
                                    Medication Info
                                </NavLink>
                                <NavLink
                                    to="/knowledge/remedies"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                            ? 'text-blue-600 bg-blue-50 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <FaFlask className="text-sm" />
                                    Home Remedies
                                </NavLink>
                                <NavLink
                                    to="/knowledge/illnesses"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                            ? 'text-blue-600 bg-blue-50 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <FaStethoscope className="text-sm" />
                                    Minor Illnesses
                                </NavLink>
                                <NavLink
                                    to="/knowledge/compounding"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                            ? 'text-blue-600 bg-blue-50 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <FaFlask className="text-sm" />
                                    Compounding
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Admin Navigation */}
                    {isAdmin && (
                        <>
                            {/* CDSS Section */}
                            <div className="mb-2">
                                <button
                                    onClick={() => toggleSection('cdss')}
                                    className="flex items-center justify-between w-full p-3 rounded-lg text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:shadow-sm border-l-4 border-purple-500"
                                >
                                    <div className="flex items-center gap-3">
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
                                                `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                                    ? 'text-purple-600 bg-purple-50 font-medium'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                                }`
                                            }
                                        >
                                            <FaCogs className="text-sm" />
                                            Clinical Rules Admin
                                        </NavLink>
                                        <NavLink
                                            to="/admin/cdss/builder"
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive
                                                    ? 'text-purple-600 bg-purple-50 font-medium'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                                }`
                                            }
                                        >

                                        </NavLink>
                                    </div>
                                )}
                            </div>

                            {/* System Setup Section */}
                            <div className="mb-2">
                                <NavLink
                                    to="/admin/labs"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-red-50 hover:text-red-800 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaFlask className="text-lg" />
                                    <span className="font-medium">Lab Definitions</span>
                                </NavLink>
                            </div>

                            {/* Admin Dashboard */}
                            <div className="mb-2">
                                <NavLink
                                    to="/admin/dashboard"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaCogs className="text-lg" />
                                    <span className="font-medium">Admin Dashboard</span>
                                </NavLink>
                            </div>
                        </>
                    )}

                    {/* Company Admin Dashboard Link (Only for company admin users) */}
                    {isCompanyAdmin && (
                        <>
                            <div className="mb-2">
                                <NavLink
                                    to="/company/dashboard"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaChartBar className="text-lg" />
                                    <span className="font-medium">Company Dashboard</span>
                                </NavLink>
                            </div>

                            <div className="mb-2">
                                <NavLink
                                    to="/company-performance"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-green-50 text-green-600 border-l-4 border-green-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaChartLine className="text-lg" />
                                    <span className="font-medium">Performance Report</span>
                                </NavLink>
                            </div>
                        </>
                    )}

                    {/* Useful Resources Section - ALL USERS */}
                    <div className="mt-6">
                        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">Useful Resources</h3>

                        {/* Public Useful Links Page */}
                        <div className="mb-2">
                            <NavLink
                                to="/useful-links"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm'
                                    }`
                                }
                            >
                                <FaBookmark className="text-lg" />
                                <span className="font-medium">Useful Links</span>
                            </NavLink>
                        </div>

                        {/* Medication Availability Link */}
                        <div className="mb-2">
                            <NavLink
                                to="/medication-availability"
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-green-50 text-green-600 border-l-4 border-green-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'
                                    }`
                                }
                            >
                                <FaPills className="text-lg" />
                                <span className="font-medium">Med Availability</span>
                            </NavLink>
                        </div>

                        {/* Admin Link Management Link (Admin only) */}
                        {isAdmin && (
                            <div className="mb-2">
                                <NavLink
                                    to="/admin/useful-links"
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-red-500 hover:shadow-sm'
                                        }`
                                    }
                                >
                                    <FaLink className="text-lg" />
                                    <span className="font-medium">Manage Links</span>
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
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
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200 hover:shadow-sm"
                >
                    <FaSignOutAlt />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;