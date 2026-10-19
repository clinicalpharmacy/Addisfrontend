import React from 'react';
import {
    FaBuilding, FaCreditCard, FaCheckCircle, FaExclamationTriangle,
    FaUsers, FaUserShield, FaHistory, FaChevronRight, FaUserPlus
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
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    {(() => {
                                        const endDate = currentUser?.subscription_end_date;
                                        const diffDays = endDate ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                                        const isExp = diffDays !== null && diffDays <= 0;
                                        const isAct = currentUser?.subscription_status === 'active' && !isExp;

                                        return (
                                            <>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                                    isAct ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    {isAct ? <><FaCheckCircle /> Active</> : <><FaExclamationTriangle /> {isExp ? 'Expired' : 'Inactive'}</>}
                                                </span>
                                                {diffDays !== null && (
                                                    <span className={`text-xs font-bold ${isAct ? 'text-gray-700' : 'text-red-600'}`}>
                                                        {diffDays > 0 ? `${diffDays} days remaining` : 'Expired'}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => navigate('/subscription/plans')}
                                                    className="text-xs md:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline transition"
                                                >
                                                    <FaCreditCard className="text-xs" />
                                                    {isAct ? 'Manage Subscription' : 'Renew Subscription'}
                                                </button>
                                            </>
                                        );
                                    })()}
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
                <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FaUserShield /> Quick Actions</h2></div>
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
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><FaUserShield className="text-blue-600" /></div>
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
