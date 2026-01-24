import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaUsers, FaUserPlus, FaUserEdit, FaUserTimes, FaBuilding,
    FaChartLine, FaSignOutAlt, FaSync, FaSearch, FaFilter,
    FaCheckCircle, FaExclamationTriangle, FaPhone,
    FaEnvelope, FaCalendarAlt, FaEdit, FaTrash, FaUserCheck,
    FaCreditCard, FaCog, FaHistory,
    FaShieldAlt, FaDatabase, FaUserLock,
    FaTachometerAlt, FaUserFriends,
    FaBars, FaTimes, FaChevronRight,
    FaCrown, FaExclamation, FaChartBar,
    FaCheck
} from 'react-icons/fa';
const API_URL = import.meta.env.VITE_API_URL;

const CompanyAdminDashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [companyUsers, setCompanyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserData, setNewUserData] = useState({
        email: '', password: '', full_name: '', phone: '', role: 'pharmacist'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        total_users: 0, active_users: 0, pending_users: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [isAddingUser, setIsAddingUser] = useState(false);

    useEffect(() => { 
        checkCompanyAdminAccess(); 
    }, []);

    const checkCompanyAdminAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (!token || !userData) { 
                navigate('/login'); 
                return; 
            }
            
            const user = JSON.parse(userData);
            if (user.role !== 'company_admin') {
                setError(`Access denied. Your role is ${user.role}`);
                setTimeout(() => navigate('/'), 3000);
                return;
            }
            
            if (!user.company_id) {
                setError('You are not associated with any company.');
                setTimeout(() => navigate('/'), 3000);
                return;
            }
            
            setCurrentUser(user);
            await loadDashboardData(user.company_id);
        } catch (error) {
            console.error('Auth check error:', error);
            setError('Authentication error: ' + error.message);
            navigate('/login');
        }
    };

    const loadDashboardData = async (companyId) => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            if (!token) { 
                setError('Authentication token missing'); 
                return; 
            }

            // Load company info
            const companyResponse = await fetch(`${API_URL}/company/info`, {
                method: 'GET', 
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                }
            });
            
            if (companyResponse.ok) {
                const companyData = await companyResponse.json();
                if (companyData.success && companyData.company) {
                    setCompanyInfo(companyData.company);
                }
            }
            
            // Load company users
            await loadCompanyUsers(companyId);
            
            // Load recent activities
            await loadRecentActivities(companyId);
            
        } catch (error) {
            console.error('Error loading company data:', error);
            setError('Failed to load company data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadCompanyUsers = async (companyId) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Loading users for company:', companyId);
            
            // Try different endpoints
            const endpoints = [
                `${API_URL}/users?company_id=${companyId}`,
                `${API_URL}/company/${companyId}/users`,
                `${API_URL}/company/users`
            ];
            
            let users = [];
            let lastError = null;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'GET', 
                        headers: { 
                            'Authorization': `Bearer ${token}`, 
                            'Content-Type': 'application/json' 
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('API Response from', endpoint, ':', data);
                        
                        // Handle different response formats
                        if (Array.isArray(data)) {
                            users = data.filter(user => user.company_id === companyId);
                            break;
                        } else if (data.users && Array.isArray(data.users)) {
                            users = data.users.filter(user => user.company_id === companyId);
                            break;
                        } else if (data.success && data.users && Array.isArray(data.users)) {
                            users = data.users.filter(user => user.company_id === companyId);
                            break;
                        } else if (data && data.length > 0) {
                            users = data.filter(user => user.company_id === companyId);
                            break;
                        }
                    }
                } catch (err) {
                    lastError = err;
                    console.log(`Endpoint ${endpoint} failed:`, err.message);
                }
            }
            
            console.log('Final users list:', users);
            setCompanyUsers(users);
            updateStats(users);
            
        } catch (userError) {
            console.error('Error loading company users:', userError);
            setCompanyUsers([]);
        }
    };

    const loadRecentActivities = async (companyId) => {
        try {
            // Mock recent activities
            setRecentActivities([
                { 
                    id: 1, 
                    action: 'dashboard_access', 
                    user_name: currentUser?.full_name || 'Admin', 
                    details: 'Accessed company dashboard', 
                    created_at: new Date().toISOString() 
                },
                { 
                    id: 2, 
                    action: 'user_management', 
                    user_name: currentUser?.full_name || 'Admin', 
                    details: 'Viewed user management section', 
                    created_at: new Date(Date.now() - 3600000).toISOString() 
                }
            ]);
        } catch (error) {
            console.error('Error loading activities:', error);
            setRecentActivities([]);
        }
    };

    const updateStats = (users) => {
        const total_users = users.length;
        const active_users = users.filter(user => user.approved).length;
        const pending_users = users.filter(user => !user.approved).length;
        
        console.log('Stats updated:', { total_users, active_users, pending_users });
        
        setStats({
            total_users, 
            active_users, 
            pending_users
        });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (isAddingUser) { 
            console.log('Already adding user, please wait...'); 
            return; 
        }
        
        try {
            setIsAddingUser(true);
            setError('');
            setSuccess('');
            
            const token = localStorage.getItem('token');
            const user = currentUser || JSON.parse(localStorage.getItem('user'));
            
            if (!user?.company_id) { 
                setError('Cannot add user: No company associated'); 
                return; 
            }
            
            if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
                setError('Email, password, and full name are required'); 
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newUserData.email)) { 
                setError('Please enter a valid email'); 
                return; 
            }
            
            if (newUserData.password.length < 6) { 
                setError('Password must be at least 6 characters'); 
                return; 
            }
            
            console.log('Adding user with data:', {
                email: newUserData.email,
                full_name: newUserData.full_name,
                role: newUserData.role,
                company_id: user.company_id
            });
            
            const response = await fetch(`${API_URL}/company/users`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    email: newUserData.email, 
                    password: newUserData.password,
                    full_name: newUserData.full_name, 
                    phone: newUserData.phone || '+251900000000', 
                    role: newUserData.role,
                    company_id: user.company_id
                })
            });
            
            const data = await response.json();
            console.log('Add user response:', data);
            
            if (response.ok) {
                setSuccess(`User ${newUserData.email} added successfully! They will be pending approval.`);
                setShowAddUserModal(false);
                setNewUserData({ 
                    email: '', 
                    password: '', 
                    full_name: '', 
                    phone: '', 
                    role: 'pharmacist' 
                });
                
                // Reload users after a short delay
                setTimeout(() => {
                    loadCompanyUsers(user.company_id);
                }, 1000);
                
            } else {
                setError(data.error || data.message || 'Failed to add user');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            setError(`Failed to add user: ${error.message}`);
        } finally {
            setIsAddingUser(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        
        try {
            const token = localStorage.getItem('token');
            const user = currentUser || JSON.parse(localStorage.getItem('user'));
            
            const response = await fetch(`${API_URL}/company/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    full_name: editingUser.full_name, 
                    phone: editingUser.phone, 
                    role: editingUser.role
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccess(`User ${editingUser.email} updated successfully!`);
                setEditingUser(null);
                setTimeout(() => {
                    loadCompanyUsers(user.company_id);
                }, 1000);
            } else {
                setError(data.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete user ${userEmail}?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const user = currentUser || JSON.parse(localStorage.getItem('user'));
            
            const response = await fetch(`${API_URL}/company/users/${userId}`, {
                method: 'DELETE', 
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                }
            });
            
            if (response.ok) {
                setSuccess(`User ${userEmail} deleted successfully!`);
                setTimeout(() => {
                    loadCompanyUsers(user.company_id);
                }, 1000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user');
        }
    };

    const handleApproveUser = async (userId, userEmail) => {
        try {
            const token = localStorage.getItem('token');
            const user = currentUser || JSON.parse(localStorage.getItem('user'));
            
            const response = await fetch(`${API_URL}/company/users/${userId}/approve`, {
                method: 'POST', 
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccess(`User ${userEmail} approved successfully!`);
                setTimeout(() => {
                    loadCompanyUsers(user.company_id);
                }, 1000);
            } else {
                setError(data.error || 'Failed to approve user');
            }
        } catch (error) {
            console.error('Error approving user:', error);
            setError('Failed to approve user');
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHours < 1) return 'Just now';
            else if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            else if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            else return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        } catch { 
            return 'Invalid date'; 
        }
    };

    const getRoleBadge = (role) => {
        const roleStyles = {
            pharmacist: 'bg-blue-100 text-blue-800',
            doctor: 'bg-green-100 text-green-800',
            nurse: 'bg-purple-100 text-purple-800',
            staff: 'bg-gray-100 text-gray-800',
            company_admin: 'bg-red-100 text-red-800'
        };
        
        const style = roleStyles[role] || 'bg-gray-100 text-gray-800';
        
        return (
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${style}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (approved) => {
        return approved ? 
            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Active</span> :
            <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">Pending</span>;
    };

    const filteredUsers = companyUsers.filter(user => {
        const matchesSearch = searchTerm === '' || 
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && user.approved) ||
            (filterStatus === 'pending' && !user.approved);
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-4 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-800">Loading Company Dashboard</h2>
                    <p className="text-gray-600 mt-2">Preparing your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Top Navigation */}
            <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button 
                                onClick={() => setShowSidebar(!showSidebar)} 
                                className="p-2 rounded-lg hover:bg-gray-100 mr-2"
                            >
                                {showSidebar ? <FaTimes className="text-gray-600" /> : <FaBars className="text-gray-600" />}
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                                    <FaBuilding className="text-white text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Company Dashboard</h1>
                                    <p className="text-sm text-gray-600">{companyInfo?.company_name || 'Company Portal'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => loadDashboardData(currentUser?.company_id)} 
                                className="p-2 text-gray-600 hover:text-blue-600" 
                                title="Refresh"
                            >
                                <FaSync />
                            </button>
                            <div className="relative">
                                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            {currentUser?.full_name?.charAt(0) || 'C'}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-800">{currentUser?.full_name}</p>
                                        <p className="text-xs text-gray-600">Company Admin</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transform transition-transform duration-300 z-30 ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="w-64 h-full overflow-y-auto">
                    <nav className="p-4 space-y-1">
                        <button 
                            onClick={() => setActiveTab('dashboard')} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'dashboard' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaTachometerAlt className="text-lg" />
                            <span className="font-medium">Dashboard</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'users' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaUserFriends className="text-lg" />
                            <span className="font-medium">User Management</span>
                            {stats.pending_users > 0 && (
                                <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                    {stats.pending_users}
                                </span>
                            )}
                        </button>
                        <div className="pt-8 mt-8 border-t">
                            <button 
                                onClick={handleLogout} 
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                            >
                                <FaSignOutAlt className="text-lg" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className={`pt-16 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
                <div className="p-4 sm:p-6 lg:p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-fade-in">
                            <div className="flex items-center gap-3">
                                <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-red-800">Error</p>
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg animate-fade-in">
                            <div className="flex items-center gap-3">
                                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-green-800">Success</p>
                                    <p className="text-sm text-green-600 mt-1">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Company Info */}
                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="p-6 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaBuilding /> Company Information
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {companyInfo ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Company Name</p>
                                                <p className="font-medium text-gray-800">{companyInfo.company_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Registration Number</p>
                                                <p className="font-medium text-gray-800">{companyInfo.company_registration_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Company Type</p>
                                                <p className="font-medium text-gray-800 capitalize">{companyInfo.company_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Subscription Status</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                        <FaCheck className="inline mr-1" /> Active
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        (Access Granted)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600">Loading company information...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User Stats Card - Only show if there are users */}
                            {stats.total_users > 0 && (
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm opacity-90">Company Users</p>
                                            <p className="text-3xl font-bold mt-2">{stats.total_users}</p>
                                            <p className="text-sm opacity-90 mt-1">
                                                {stats.active_users} active • {stats.pending_users} pending approval
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <FaUsers className="text-xl" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="p-6 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaShieldAlt /> Quick Actions
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setActiveTab('users')}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-lg flex items-center justify-between transition-all transform hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FaUsers className="text-xl" />
                                                <div className="text-left">
                                                    <p className="font-bold">Manage Users</p>
                                                    <p className="text-sm opacity-90">View and manage all users</p>
                                                </div>
                                            </div>
                                            <FaChevronRight />
                                        </button>
                                        
                                        <button
                                            onClick={() => setShowAddUserModal(true)}
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg flex items-center justify-between transition-all transform hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FaUserPlus className="text-xl" />
                                                <div className="text-left">
                                                    <p className="font-bold">Add New User</p>
                                                    <p className="text-sm opacity-90">Add staff to your company</p>
                                                </div>
                                            </div>
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="p-6 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaHistory /> Recent Activities
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {recentActivities.length > 0 ? (
                                            recentActivities.slice(0, 5).map((activity, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <FaShieldAlt className="text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{activity.details}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {activity.user_name} • {formatDate(activity.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600">No recent activities</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                                        <p className="text-gray-600">
                                            Manage users in {companyInfo?.company_name || 'your company'}
                                        </p>
                                        {stats.total_users > 0 && (
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-sm text-gray-500">
                                                    Total Users: {stats.total_users}
                                                </span>
                                                <span className="text-sm text-green-600">
                                                    Active: {stats.active_users}
                                                </span>
                                                {stats.pending_users > 0 && (
                                                    <span className="text-sm text-yellow-600">
                                                        Pending: {stats.pending_users}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowAddUserModal(true)}
                                        className="px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all transform hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                                    >
                                        <FaUserPlus className="text-lg" /> 
                                        Add User
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search users by name or email..."
                                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="nurse">Nurse</option>
                                            <option value="staff">Staff</option>
                                            <option value="company_admin">Company Admin</option>
                                        </select>
                                        <select
                                            className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="p-6">
                                    {filteredUsers.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-700">
                                                        <th className="border p-4 text-left">User</th>
                                                        <th className="border p-4 text-left">Role</th>
                                                        <th className="border p-4 text-left">Status</th>
                                                        <th className="border p-4 text-left">Registered</th>
                                                        <th className="border p-4 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map((user) => (
                                                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="border p-4">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{user.full_name}</p>
                                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                                    {user.phone && (
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                            <FaPhone className="text-xs" /> {user.phone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="border p-4">
                                                                {getRoleBadge(user.role)}
                                                            </td>
                                                            <td className="border p-4">
                                                                {getStatusBadge(user.approved)}
                                                            </td>
                                                            <td className="border p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-gray-400" />
                                                                    <span className="text-sm">{formatDate(user.created_at)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="border p-4">
                                                                <div className="flex gap-2">
                                                                    {!user.approved && (
                                                                        <button
                                                                            onClick={() => handleApproveUser(user.id, user.email)}
                                                                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                                                                            title="Approve User"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setEditingUser(user)}
                                                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                                                        title="Edit User"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                                                        title="Delete User"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FaUserFriends className="text-6xl text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Users Found</h3>
                                            <p className="text-gray-600 mb-4">
                                                {companyUsers.length === 0 
                                                    ? "You haven't added any users yet. Click 'Add User' to get started."
                                                    : "No users match your search criteria."
                                                }
                                            </p>
                                            <button
                                                onClick={() => setShowAddUserModal(true)}
                                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                                            >
                                                Add Your First User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Add user to {companyInfo?.company_name || 'your company'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddUserModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isAddingUser}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserData.full_name}
                                        onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="John Doe"
                                        required
                                        disabled={isAddingUser}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={newUserData.email}
                                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="user@company.com"
                                        required
                                        disabled={isAddingUser}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={newUserData.password}
                                        onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength="6"
                                        disabled={isAddingUser}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={newUserData.phone}
                                        onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="+251 912 345678"
                                        disabled={isAddingUser}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={newUserData.role}
                                        onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        required
                                        disabled={isAddingUser}
                                    >
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddUserModal(false)}
                                        disabled={isAddingUser}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingUser}
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAddingUser ? (
                                            <>
                                                <FaSync className="animate-spin" />
                                                Adding User...
                                            </>
                                        ) : (
                                            'Add User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
                                    <p className="text-gray-600 text-sm mt-1">Update user information</p>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.full_name}
                                        onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingUser.phone}
                                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        required
                                    >
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                                    >
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyAdminDashboard;