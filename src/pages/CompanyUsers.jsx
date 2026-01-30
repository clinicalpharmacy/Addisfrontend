import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars, FaBuilding, FaSync, FaTimes, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';

import { useCompanyAdminLogic } from '../hooks/useCompanyAdminLogic';
import { CompanyUserManagement } from '../components/CompanyAdmin/CompanyUserManagement';


// --- Simple User Modal Component ---
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

const CompanyUsers = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

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

    if (logic.loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
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

            {/* Company User Management */}
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

export default CompanyUsers;
