import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserCircle, FaSignOutAlt, FaHome, FaBookMedical,
    FaSync, FaSpinner, FaCheckCircle, FaExclamationTriangle,
    FaUserCheck, FaUsers, FaHospital, FaPills, FaComments, FaCreditCard,
    FaChartLine, FaBuilding
} from 'react-icons/fa';

// Hooks
import {
    useAdminDashboardData, useAdminUsers, useAdminCompanies,
    useAdminMedications, useAdminPatients, useAdminSubscriptions
} from '../hooks/adminHooks';

// Utilities
import {
    formatDate, getActivityIcon, getStatusBadge, getRoleBadge
} from '../utils/adminUtils';

// Components
import { AdminOverview } from '../components/Admin/AdminOverview';
import { AdminApprovals } from '../components/Admin/AdminApprovals';
import { AdminCompanies } from '../components/Admin/AdminCompanies';
import { AdminUsers } from '../components/Admin/AdminUsers';
import { AdminChats } from '../components/Admin/AdminChats';
import { AdminSubscriptions } from '../components/Admin/AdminSubscriptions';
import api from '../utils/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [successMessage, setSuccessMessage] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Initialize Hooks
    const dashboardData = useAdminDashboardData(currentUser);
    const usersManager = useAdminUsers(currentUser);
    const companiesManager = useAdminCompanies();
    const subscriptionsManager = useAdminSubscriptions();

    // Initial Auth Check
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        try {
            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                navigate(user.role === 'company_admin' ? '/company/dashboard' : '/dashboard');
                return;
            }
            setCurrentUser(user);
        } catch (e) { navigate('/login'); }
    }, [navigate]);

    // Data Loading Logic based on Tab
    useEffect(() => {
        if (!currentUser) return;

        const loadTabData = async () => {
            if (selectedTab === 'overview') {
                await dashboardData.loadDashboardData();
            } else if (selectedTab === 'approvals' || selectedTab === 'users') {
                await usersManager.loadUsers();
            } else if (selectedTab === 'companies') {
                await companiesManager.loadCompanies();
            } else if (selectedTab === 'subscriptions') {
                await Promise.all([
                    subscriptionsManager.loadSubscriptions(),
                    usersManager.loadUsers(),
                    companiesManager.loadCompanies()
                ]);
            }
        };

        loadTabData();
    }, [selectedTab, currentUser]);

    // Force Refresh Handler
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                dashboardData.loadDashboardData(),
                usersManager.loadUsers(),
                companiesManager.loadCompanies(),
                subscriptionsManager.loadSubscriptions()
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const navigationTabs = [
        { id: 'overview', label: 'Overview', icon: FaChartLine },
        { id: 'approvals', label: 'Approvals', icon: FaUserCheck, count: dashboardData.stats.pending_approvals, color: 'bg-red-500' },
        { id: 'users', label: 'Users', icon: FaUsers },
        { id: 'companies', label: 'Companies', icon: FaBuilding },
        { id: 'subscriptions', label: 'Subscriptions', icon: FaCreditCard },
        { id: 'chats', label: 'Support Chats', icon: FaComments }
    ];

    // Logout
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };



    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <FaSpinner className="text-4xl text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Success/Error Alerts */}
            {successMessage && (
                <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce">
                    <div className="flex items-center gap-2">
                        <FaCheckCircle /> {successMessage}
                    </div>
                </div>
            )}
            {generalError && (
                <div className="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg flex items-center gap-2 animate-slideIn">
                    <FaExclamationTriangle className="text-red-500" />
                    <span className="text-red-700">{generalError}</span>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-lg mb-6 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <FaUserCircle className="text-blue-600 text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                                <p className="text-xs text-gray-500">
                                    {currentUser.full_name} <span className="text-blue-600">({currentUser.role})</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <button onClick={() => navigate('/home')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                <FaHome /> Main
                            </button>

                            <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                <FaSync className={refreshing ? 'animate-spin' : ''} /> Refresh
                            </button>
                            <button onClick={handleLogout} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
                    <nav className="flex space-x-1 min-w-max">
                        {navigationTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${selectedTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.icon && <tab.icon />}
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${tab.color || 'bg-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                {selectedTab === 'overview' && (
                    <AdminOverview
                        stats={dashboardData.stats}
                        usersCount={usersManager.users.length}
                        companiesCount={companiesManager.companies.length}
                        pendingApprovalsCount={dashboardData.stats.pending_approvals}
                        recentActivities={dashboardData.recentActivities}
                        onTabChange={setSelectedTab}
                        getActivityIcon={getActivityIcon}
                        formatDate={formatDate}
                    />
                )}

                {selectedTab === 'approvals' && (
                    <AdminApprovals
                        pendingUsers={usersManager.pendingUsers}
                        loading={usersManager.loading}
                        error={usersManager.error}
                        processingApproval={usersManager.processingId}
                        handleApproveUser={async (id, email) => {
                            const success = await usersManager.approveUser(id, email);
                            if (success) {
                                setSuccessMessage(`User approved: ${email}`);
                                setTimeout(() => setSuccessMessage(''), 3000);
                                dashboardData.loadDashboardData();
                            }
                        }}
                        handleRejectUser={async (id, email) => {
                            if (window.confirm(`Reject ${email}?`)) {
                                await usersManager.rejectUser(id, email);
                                dashboardData.loadDashboardData();
                            }
                        }}
                        onRefresh={handleRefresh}
                        formatDate={formatDate}
                    />
                )}

                {selectedTab === 'users' && (
                    <AdminUsers
                        users={usersManager.users}
                        loading={usersManager.loading}
                        onRefresh={handleRefresh}
                        formatDate={formatDate}
                        getStatusBadge={getStatusBadge}
                        getRoleBadge={getRoleBadge}
                    />
                )}

                {selectedTab === 'companies' && (
                    <AdminCompanies
                        companies={companiesManager.companies}
                        loading={companiesManager.loading}
                        error={companiesManager.error}
                        onRefresh={handleRefresh}
                        formatDate={formatDate}
                    />
                )}


                {selectedTab === 'subscriptions' && (
                    <AdminSubscriptions
                        subscriptions={subscriptionsManager.subscriptions}
                        users={usersManager.users}
                        companies={companiesManager.companies}
                        loading={subscriptionsManager.loading || usersManager.loading || companiesManager.loading}
                        onRefresh={handleRefresh}
                    />
                )}

                {selectedTab === 'chats' && (
                    <AdminChats />
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;