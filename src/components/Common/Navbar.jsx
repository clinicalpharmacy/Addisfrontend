import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaUserMd,
    FaHome,
    FaPills,
    FaBookMedical,
    FaCogs,
    FaBell,
    FaUserCircle,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaUserShield,
    FaSearch,
    FaPlus,
    FaCheckDouble,
    FaBullhorn,
    FaClock,
    FaExclamationCircle,
    FaExclamationTriangle,
    FaInfoCircle
} from 'react-icons/fa';
import api from '../../utils/api';

const PRIORITY_STYLES = {
    urgent: { icon: FaExclamationTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-100', dot: 'bg-red-500' },
    important: { icon: FaExclamationCircle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
    normal: { icon: FaInfoCircle, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' }
};

const Navbar = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        checkUser();
    }, [location]);

    const checkUser = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error getting user:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoadingNotifs(true);
            const data = await api.get('/admin/notifications');
            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            // Silently fail — notifications are non-critical
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoadingNotifs(false);
        }
    }, []);

    // Load notifications on mount + poll every 60 seconds
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
            // Implement search functionality here
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.post(`/admin/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/admin/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navItems = [
        // All navigation items have been removed as requested
    ];

    return (
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Menu button and Brand */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className="md:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 mr-2"
                        >
                            <FaBars className="text-xl" />
                        </button>

                        {/* Logo and Brand */}
                        <div>
                            <Link to="/home" className="flex items-center gap-2">
                                <div className="bg-blue-600 p-2 rounded-lg">
                                    <FaUserMd className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-800">Addis Med</h1>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Navigation - Empty since all items were removed */}
                    <div className="hidden md:flex items-center space-x-2">
                        {/* Navigation items removed */}
                    </div>

                    {/* Right side - User Menu and Notifications */}
                    <div className="flex items-center gap-4">
                        {/* Quick Add Button - Removed */}

                        {/* Notifications Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    if (!showNotifications) fetchNotifications();
                                }}
                                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                            >
                                <FaBell className="text-xl" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse shadow-sm">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    {/* Backdrop on mobile */}
                                    <div
                                        className="fixed inset-0 z-10 md:hidden bg-black/20"
                                        onClick={() => setShowNotifications(false)}
                                    />

                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
                                         style={{ maxHeight: '80vh' }}>
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FaBell className="text-white text-sm" />
                                                <h3 className="text-white font-bold text-sm">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {unreadCount} new
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-white/80 hover:text-white text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                                                        title="Mark all as read"
                                                    >
                                                        <FaCheckDouble className="text-[10px]" /> Read all
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Notification List */}
                                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
                                            {loadingNotifs && notifications.length === 0 ? (
                                                <div className="flex justify-center py-10">
                                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="py-12 text-center">
                                                    <FaBell className="text-3xl text-gray-200 mx-auto mb-2" />
                                                    <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                                                    <p className="text-gray-300 text-xs mt-0.5">You're all caught up!</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map(notif => {
                                                        const style = PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES.normal;
                                                        const PIcon = style.icon;

                                                        return (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                                                className={`px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 ${
                                                                    !notif.is_read ? 'bg-blue-50/40' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    {/* Icon */}
                                                                    <div className={`mt-0.5 p-1.5 rounded-lg ${style.bg} border shrink-0`}>
                                                                        <PIcon className={`text-xs ${style.color}`} />
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            {!notif.is_read && (
                                                                                <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                                                                            )}
                                                                            <h4 className={`text-xs font-bold truncate ${
                                                                                !notif.is_read ? 'text-gray-900' : 'text-gray-600'
                                                                            }`}>
                                                                                {notif.title}
                                                                            </h4>
                                                                        </div>
                                                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                                                            {notif.message}
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                                            <FaClock className="text-[8px]" />
                                                                            {formatTimeAgo(notif.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Admin Dashboard Link */}
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin/dashboard"
                                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                                <FaUserShield />
                                Admin
                            </Link>
                        )}

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaUserCircle className="text-blue-600 text-xl" />
                                </div>
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-gray-800">
                                        {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user?.role || 'Pharmacist'}
                                    </p>
                                </div>
                            </button>

                            {showUserMenu && (
                                <>
                                    {/* Overlay */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />

                                    {/* User Menu Dropdown */}
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-20">
                                        <div className="px-4 py-3 border-b">
                                            <p className="text-sm font-medium text-gray-800">
                                                {user?.full_name || user?.email || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                {user?.role || 'Pharmacist'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user?.institution || 'AddisMed'}
                                            </p>
                                        </div>

                                        <Link
                                            to="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            Settings
                                        </Link>

                                        {user?.role === 'admin' && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <FaUserShield /> Admin Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 mt-2"
                                        >
                                            <FaSignOutAlt /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar - Removed */}
            </div>
        </nav>
    );
};

export default Navbar;
