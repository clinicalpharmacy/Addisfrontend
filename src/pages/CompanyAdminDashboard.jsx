import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars, FaBuilding, FaSync, FaTimes, FaTachometerAlt,
    FaUserFriends, FaSignOutAlt, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';

import { useCompanyAdminLogic } from '../hooks/useCompanyAdminLogic';
import { CompanyDashboardOverview } from '../components/CompanyAdmin/CompanyDashboardOverview';
import { CompanyUserManagement } from '../components/CompanyAdmin/CompanyUserManagement';


// --- Simple User Modal Component (can be extracted if preferred but small enough here) ---
const UserModalInternal = ({ show, isEdit, isSubmitting, data, onClose, onSubmit, onChange }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input type="text" value={data.full_name || ''} onChange={e => onChange({ ...data, full_name: e.target.value })} className="w-full px-4 py-3 border rounded-lg" required />
                    </div>
                    {!isEdit && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <input type="email" value={data.email || ''} onChange={e => onChange({ ...data, email: e.target.value })} className="w-full px-4 py-3 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                <input type="password" value={data.password || ''} onChange={e => onChange({ ...data, password: e.target.value })} className="w-full px-4 py-3 border rounded-lg" required minLength="6" />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input type="tel" value={data.phone || ''} onChange={e => onChange({ ...data, phone: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                        <select value={data.role || 'pharmacist'} onChange={e => onChange({ ...data, role: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
                            <option value="pharmacist">Pharmacist</option>
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CompanyAdminDashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showSidebar, setShowSidebar] = useState(true);

    // Use Custom Hook
    const logic = useCompanyAdminLogic(currentUser);

    // Auth Check
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/login'); return; }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'company_admin') {
                navigate('/');
                return;
            }
            if (!user.company_id) {
                alert('No company associated with this account.');
                navigate('/');
                return;
            }
            setCurrentUser(user);
            logic.loadDashboardData(user.company_id);
        } catch (e) { navigate('/login'); }
    }, []);

    const handleLogout = () => {
        if (window.confirm('Logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    if (logic.loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 bg-white shadow z-40 h-16 px-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded">
                        {showSidebar ? <FaTimes /> : <FaBars />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded text-white"><FaBuilding /></div>
                        <div>
                            <h1 className="font-bold text-gray-800 hidden sm:block">Company Portal</h1>
                            <p className="text-xs text-gray-500">{logic.companyInfo?.company_name}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => logic.loadDashboardData(currentUser?.company_id)} className="p-2 hover:bg-gray-100 rounded text-gray-600"><FaSync /></button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {currentUser?.full_name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium hidden sm:block">{currentUser?.full_name}</span>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform z-30 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                <nav className="p-4 space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        <FaTachometerAlt /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        <FaUserFriends /> Users
                        {logic.stats.pending_users > 0 && <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{logic.stats.pending_users}</span>}
                    </button>
                    <div className="pt-8 mt-8 border-t">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"><FaSignOutAlt /> Logout</button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`pt-20 pb-8 px-4 sm:px-6 transition-all ${showSidebar ? 'ml-64' : 'ml-0'}`}>
                {/* Alerts */}
                {logic.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center gap-3 text-red-700">
                        <FaExclamationTriangle /> <p>{logic.error}</p>
                    </div>
                )}
                {logic.success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-3 text-green-700">
                        <FaCheckCircle /> <p>{logic.success}</p>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <CompanyDashboardOverview
                        companyInfo={logic.companyInfo}
                        currentUser={currentUser}
                        stats={logic.stats}
                        recentActivities={logic.recentActivities}
                        onNavigateUsers={() => setActiveTab('users')}
                        onOpenAddUser={() => logic.setShowAddUserModal(true)}
                    />
                )}

                {activeTab === 'users' && (
                    <CompanyUserManagement
                        users={logic.companyUsers}
                        stats={logic.stats}
                        companyName={logic.companyInfo?.company_name}
                        onAddUser={() => logic.setShowAddUserModal(true)}
                        onEditUser={logic.setEditingUser}
                        onDeleteUser={logic.handleDeleteUser}
                        onApproveUser={logic.handleApproveUser}
                        onRefresh={() => logic.loadDashboardData(currentUser?.company_id)}
                    />
                )}
            </main>

            {/* Modals */}
            <UserModalInternal
                show={logic.showAddUserModal}
                isEdit={false}
                isSubmitting={logic.isAddingUser}
                data={logic.newUserData}
                onClose={() => logic.setShowAddUserModal(false)}
                onSubmit={logic.handleAddUser}
                onChange={logic.setNewUserData}
            />

            <UserModalInternal
                show={!!logic.editingUser}
                isEdit={true}
                isSubmitting={false}
                data={logic.editingUser || {}}
                onClose={() => logic.setEditingUser(null)}
                onSubmit={logic.handleUpdateUser}
                onChange={logic.setEditingUser}
            />
        </div>
    );
};

export default CompanyAdminDashboard;