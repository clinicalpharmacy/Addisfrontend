import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserCircle, FaSignOutAlt, FaHome, FaBookMedical,
    FaSync, FaSpinner, FaCheckCircle, FaExclamationTriangle,
    FaUserCheck, FaUsers, FaHospital, FaPills, FaComments, FaCreditCard,
    FaChartLine, FaBuilding, FaShieldAlt
} from 'react-icons/fa';

// Hooks
import {
    useAdminDashboardData, useAdminUsers, useAdminCompanies,
    useAdminSubscriptions
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
import { AdminFeedback } from '../components/Admin/AdminFeedback';
import { SupportVault } from '../components/Admin/SupportVault';
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
        { id: 'support_access', label: 'Support Access', icon: FaShieldAlt }, // New Tab
        { id: 'feedback', label: 'User Feedback', icon: FaComments },
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
        <div className="min-h-screen bg-gray-50/50 font-sans overflow-x-hidden relative w-full">
            {/* Alerts */}
            {(successMessage || generalError) && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[100] space-y-2 pointer-events-none">
                    {successMessage && (
                        <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 pointer-events-auto">
                            <FaCheckCircle className="shrink-0" />
                            <span className="text-xs font-bold">{successMessage}</span>
                        </div>
                    )}
                    {generalError && (
                        <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 pointer-events-auto">
                            <FaExclamationTriangle className="shrink-0" />
                            <span className="text-xs font-bold">{generalError}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-100 mb-4 sticky top-0 z-40 w-full overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <div className="bg-blue-600/10 p-2 rounded-xl">
                                <FaUserCircle className="text-blue-600 text-xl" />
                            </div>
                            <div className="min-w-0 font-sans">
                                <h1 className="text-base font-black text-gray-900 leading-tight">Admin Dashboard</h1>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    {currentUser.full_name.split(' ')[0]} <span className="text-blue-600">({currentUser.role})</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-0.5 sm:pb-0 touch-pan-x no-scrollbar">
                            <button onClick={() => navigate('/home')} className="flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 font-bold text-[11px] whitespace-nowrap shadow-sm border border-gray-200/50">
                                <FaHome /> Home
                            </button>
                            <button onClick={handleRefresh} disabled={refreshing} className="flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 font-bold text-[11px] whitespace-nowrap shadow-sm border border-gray-200/50">
                                <FaSync className={refreshing ? 'animate-spin' : ''} /> Refresh
                            </button>
                            <button onClick={handleLogout} className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 font-bold text-[11px] whitespace-nowrap shadow-sm border border-red-100/50">
                                <FaSignOutAlt /> Exit
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 mb-4 md:mb-6">
                <div className="bg-white rounded-xl shadow-sm p-1 overflow-x-auto scrollbar-hide no-scrollbar">
                    <nav className="flex space-x-1 min-w-max">
                        {navigationTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${selectedTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className={selectedTab === tab.id ? 'scale-110' : 'opacity-70'} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-black ${tab.color || 'bg-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10">
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
                        onToggleBlock={async (id) => {
                            const res = await usersManager.toggleBlockUser(id);
                            if (res.success) {
                                setSuccessMessage(res.message);
                                setTimeout(() => setSuccessMessage(''), 3000);
                            }
                        }}
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

                {selectedTab === 'support_access' && (
                    <SupportVault />
                )}

                {selectedTab === 'feedback' && (
                    <AdminFeedback />
                )}

                {selectedTab === 'chats' && (
                    <AdminChats />
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;