import React from 'react';
import {
    FaBuilding, FaCreditCard, FaCheckCircle, FaExclamationTriangle,
    FaUsers, FaShieldAlt, FaHistory, FaChevronRight, FaUserPlus
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/adminUtils';

export const CompanyDashboardOverview = ({
    companyInfo,
    currentUser,
    stats,
    recentActivities,
    onNavigateUsers,
    onOpenAddUser
}) => {
    const navigate = useNavigate();

    return (
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
                            <div><p className="text-sm text-gray-600">Company Name</p><p className="font-medium text-gray-800">{companyInfo.company_name}</p></div>
                            <div><p className="text-sm text-gray-600">Company Email</p><p className="font-medium text-gray-800">{companyInfo.email}</p></div>
                            <div><p className="text-sm text-gray-600">Admin Email</p><p className="font-medium text-gray-800">{companyInfo.admin_email || currentUser?.email}</p></div>
                            <div><p className="text-sm text-gray-600">Type</p><p className="font-medium text-gray-800 capitalize">{companyInfo.company_type}</p></div>
                            <div>
                                <p className="text-sm text-gray-600">Subscription Status</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${currentUser?.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {currentUser?.subscription_status === 'active' ? <><FaCheckCircle /> Active</> : <><FaExclamationTriangle /> Inactive</>}
                                    </span>
                                    <button onClick={() => navigate('/subscription')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"><FaCreditCard className="text-xs" /> Manage Subscription</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600">Loading company information...</div>
                    )}
                </div>
            </div>

            {/* Stats */}
            {stats.total_users > 0 && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm opacity-90">Company Users</p>
                            <p className="text-3xl font-bold mt-2">{stats.total_users}</p>
                            <p className="text-sm opacity-90 mt-1">{stats.active_users} active • {stats.pending_users} pending</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg"><FaUsers className="text-xl" /></div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg">
                <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FaShieldAlt /> Quick Actions</h2></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={onNavigateUsers} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-lg flex items-center justify-between transition transform hover:scale-[1.02]">
                        <div className="flex items-center gap-3"><FaUsers className="text-xl" /><div className="text-left"><p className="font-bold">Manage Users</p><p className="text-sm opacity-90">View and manage staff</p></div></div><FaChevronRight />
                    </button>
                    <button onClick={onOpenAddUser} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg flex items-center justify-between transition transform hover:scale-[1.02]">
                        <div className="flex items-center gap-3"><FaUserPlus className="text-xl" /><div className="text-left"><p className="font-bold">Add New User</p><p className="text-sm opacity-90">Invite staff members</p></div></div><FaChevronRight />
                    </button>
                </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-xl shadow-lg">
                <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FaHistory /> Recent Activities</h2></div>
                <div className="p-6 space-y-4">
                    {recentActivities.length > 0 ? recentActivities.slice(0, 5).map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><FaShieldAlt className="text-blue-600" /></div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">{activity.details}</p>
                                <p className="text-sm text-gray-600">{formatDate(activity.created_at)}</p>
                            </div>
                        </div>
                    )) : <div className="text-center py-8 text-gray-600">No recent activities</div>}
                </div>
            </div>
        </div>
    );
};
