import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserCircle, FaSignOutAlt, FaHome, FaBookMedical, FaDownload,
    FaSync, FaSpinner, FaCheckCircle, FaExclamationTriangle,
    FaUserCheck, FaUsers, FaHospital, FaPills, FaUserInjured, FaFlask, FaComments
} from 'react-icons/fa';

// Hooks
import {
    useAdminDashboardData, useAdminUsers, useAdminCompanies,
    useAdminMedications, useAdminPatients
} from '../hooks/adminHooks';

// Utilities
import {
    formatDate, getActivityIcon, getStatusBadge, getRoleBadge,
    getPatientStatusBadge, getGenderBadge, getMedicationClassColor,
    getPregnancyCategoryColor
} from '../utils/adminUtils';

// Components
import { AdminOverview } from '../components/Admin/AdminOverview';
import { AdminApprovals } from '../components/Admin/AdminApprovals';
import { AdminCompanies } from '../components/Admin/AdminCompanies';
import { AdminUsers } from '../components/Admin/AdminUsers';
import { AdminMedications } from '../components/Admin/AdminMedications';
import { AdminPatients } from '../components/Admin/AdminPatients';
import { AdminChats } from '../components/Admin/AdminChats';
import LabSettings from '../components/LabManagement/LabSettings';
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
    const medicationsManager = useAdminMedications(currentUser);
    const patientsManager = useAdminPatients(currentUser);

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
                // Both might use user data
                await usersManager.loadUsers();
            } else if (selectedTab === 'companies') {
                await companiesManager.loadCompanies();
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
                companiesManager.loadCompanies()
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    // Logout
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    // Report Download
    const downloadReport = async () => {
        try {
            setRefreshing(true);
            // Ensure we have latest data
            await handleRefresh();

            const report = {
                generated: new Date().toISOString(),
                generated_by: currentUser?.email,
                stats: dashboardData.stats,
                pending_users: usersManager.pendingUsers,
                all_users: usersManager.users,
                companies: companiesManager.companies,
                medications: medicationsManager.medications,
                patients: patientsManager.patients,
                activities: dashboardData.recentActivities
            };

            const content = JSON.stringify(report, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Admin_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccessMessage('Report downloaded successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setGeneralError('Failed to generate report');
        } finally {
            setRefreshing(false);
        }
    };

    if (!currentUser) return null; // Or loading spinner

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Global Success/Error Messages */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg flex items-center gap-2 animate-slideIn">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-green-700">{successMessage}</span>
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
                            <button onClick={downloadReport} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                <FaDownload /> Report
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
                        {[
                            { id: 'overview', label: 'Overview', icon: FaChartLine },
                            { id: 'approvals', label: 'Approvals', icon: FaUserCheck, count: usersManager.pendingUsers.length, color: 'bg-red-500' },
                            { id: 'users', label: 'Users', icon: FaUsers },
                            { id: 'companies', label: 'Companies', icon: FaHospital, count: companiesManager.companies.length, color: 'bg-purple-500' },
                            { id: 'chats', label: 'Chats', icon: FaComments },
                            { id: 'labs', label: 'Global Labs', icon: FaFlask }
                        ].map(tab => (
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
                        medicationsCount={medicationsManager.medications.length}
                        patientsCount={patientsManager.patients.length}
                        companiesCount={companiesManager.companies.length}
                        pendingApprovalsCount={usersManager.pendingUsers.length}
                        recentActivities={dashboardData.recentActivities}
                        onTabChange={setSelectedTab}
                        getActivityIcon={getActivityIcon}
                        formatDate={formatDate}
                        downloadReport={downloadReport}
                    />
                )}

                {selectedTab === 'approvals' && (
                    <AdminApprovals
                        pendingUsers={usersManager.pendingUsers}
                        processingApproval={usersManager.processingId}
                        handleApproveUser={async (id, email) => {
                            const success = await usersManager.approveUser(id, email);
                            if (success) {
                                setSuccessMessage(`User approved: ${email}`);
                                setTimeout(() => setSuccessMessage(''), 3000);
                                // Refresh stats in background
                                dashboardData.loadDashboardData();
                            }
                        }}
                        handleRejectUser={async (id, email) => {
                            if (window.confirm(`Reject access for ${email}?`)) {
                                const success = await usersManager.rejectUser(id, email);
                                if (success) {
                                    setSuccessMessage(`User rejected: ${email}`);
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                }
                            }
                        }}
                        onRefresh={usersManager.loadUsers}
                        formatDate={formatDate}
                    />
                )}

                {selectedTab === 'users' && (
                    <AdminUsers
                        users={usersManager.users}
                        loading={usersManager.loading}
                        onRefresh={usersManager.loadUsers}
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
                        onRefresh={companiesManager.loadCompanies}
                        formatDate={formatDate}
                    />
                )}

                {selectedTab === 'chats' && (
                    <AdminChats />
                )}

                {selectedTab === 'labs' && (
                    <LabSettings />
                )}
            </main>
        </div>
    );
};

// Start icon need to be imported manually as it was used in map variable
import { FaChartLine } from 'react-icons/fa';

export default AdminDashboard;