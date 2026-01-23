import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaUserMd, 
    FaHome, 
    FaPills, 
    FaBookMedical, 
    FaFlask, 
    FaCogs,
    FaBell,
    FaUserCircle,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaShieldAlt,
    FaSearch,
    FaPlus
} from 'react-icons/fa';

const Navbar = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        checkUser();
    }, []);

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

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navItems = [
        // All navigation items have been removed as requested
    ];

    return (
        <nav className="bg-white shadow-md border-b border-gray-200">
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
                                    <h1 className="text-lg font-bold text-gray-800">AddisMed</h1>
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
                        
                        {/* Notifications */}
                        <div className="relative">
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                <FaBell className="text-xl" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                        </div>

                        {/* Admin Dashboard Link */}
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin/dashboard"
                                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                                <FaShieldAlt />
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
                                                {user?.institution || 'PharmaCare System'}
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
                                                <FaShieldAlt /> Admin Dashboard
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