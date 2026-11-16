import React from 'react';
import {
    FaUsers, FaHospital, FaClock,
    FaHistory, FaCog, FaUserCheck, FaUserMd, FaBuilding, FaVial, FaBriefcase, FaUserShield
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const AdminOverview = ({
    stats,
    usersCount,
    companiesCount,
    recentActivities,
    pendingApprovalsCount,
    onTabChange,
    onFilterRoleChange,
    getActivityIcon,
    formatDate
}) => {
    const handleRoleCardClick = (role) => {
        if (onFilterRoleChange) {
            onFilterRoleChange(role);
        } else if (onTabChange) {
            onTabChange('users');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                <div
                    onClick={() => handleRoleCardClick('all')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View all users"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">Total Users</p>
                            <p className="text-xl md:text-3xl font-black text-gray-800 leading-tight">{stats.total_users || usersCount || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <FaUsers className="text-blue-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('physician')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Physicians"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-green-500 font-bold uppercase tracking-tight truncate group-hover:text-green-600 transition-colors">Physicians</p>
                            <p className="text-xl md:text-3xl font-black text-green-600 leading-tight">{stats.physician_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-green-50 rounded-lg flex-shrink-0 group-hover:bg-green-100 transition-colors">
                            <FaUserMd className="text-green-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('pharmacist')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Pharmacists"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-indigo-500 font-bold uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">Pharmacists</p>
                            <p className="text-xl md:text-3xl font-black text-indigo-600 leading-tight">{stats.pharmacist_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-indigo-50 rounded-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <FaHospital className="text-indigo-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                 <div
                    onClick={() => handleRoleCardClick('nurse')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Nurses"
                 >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-indigo-500 font-bold uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">Nurses</p>
                            <p className="text-xl md:text-3xl font-black text-indigo-600 leading-tight">{stats.nurse_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-indigo-50 rounded-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <FaHospital className="text-indigo-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => onTabChange('companies')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group col-span-1 xs:col-span-2 md:col-span-1 xl:col-span-1"
                    title="View Companies"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-purple-500 font-bold uppercase tracking-tight truncate group-hover:text-purple-600 transition-colors">Companies</p>
                            <p className="text-xl md:text-3xl font-black text-purple-600 leading-tight">{companiesCount || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-purple-50 rounded-lg flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                            <FaBuilding className="text-purple-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('other_health_professional')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Other Health Professionals"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-red-500 font-bold uppercase tracking-tight truncate group-hover:text-red-600 transition-colors">Other Health Professionals</p>
                            <p className="text-xl md:text-3xl font-black text-red-600 leading-tight">{stats.other_health_professionals_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-red-50 rounded-lg flex-shrink-0 group-hover:bg-red-100 transition-colors">
                            <FaVial className="text-red-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('pharmacy_student')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Pharmacy Students"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-blue-500 font-bold uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">Pharmacy Students</p>
                            <p className="text-xl md:text-3xl font-black text-blue-600 leading-tight">{stats.pharmacy_student_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <FaUsers className="text-blue-500 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('other_health_science_student')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Other Health Science Students"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-blue-500 font-bold uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">Other Health Science Students</p>
                            <p className="text-xl md:text-3xl font-black text-blue-600 leading-tight">{stats.other_health_science_student_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <FaUsers className="text-blue-500 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('healthcare_client')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Healthcare Clients"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-blue-500 font-bold uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">Healthcare Clients</p>
                            <p className="text-xl md:text-3xl font-black text-blue-600 leading-tight">{stats.healthcare_client_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <FaUsers className="text-blue-500 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('company_admin')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Organization Admins"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-indigo-500 font-bold uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">Organization Admins</p>
                            <p className="text-xl md:text-3xl font-black text-indigo-600 leading-tight">{stats.company_admin_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-indigo-50 rounded-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <FaBriefcase className="text-indigo-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleCardClick('admin')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                    title="View Administrators"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-tight truncate group-hover:text-gray-700 transition-colors">Administrators</p>
                            <p className="text-xl md:text-3xl font-black text-gray-700 leading-tight">{stats.admin_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-gray-100 rounded-lg flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                            <FaUserShield className="text-gray-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl shadow-lg border border-blue-800/10 p-4 md:p-6 transition-all hover:scale-[1.02] cursor-pointer" onClick={() => onTabChange('support_access')}>
                    <div className="flex items-center justify-between gap-2 text-white">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-blue-200/60 font-black uppercase tracking-widest truncate">Active Vaults</p>
                            <p className="text-xl md:text-3xl font-black leading-tight animate-pulse text-blue-400">
                                {stats.active_support_count || 0} ACTIVE
                            </p>
                        </div>
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl flex-shrink-0 border border-white/10">
                            <FaUserShield className="text-blue-400 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md border-l-4 border-red-500 cursor-pointer" onClick={() => onTabChange('users')}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-red-600 font-bold uppercase tracking-tight truncate">Blocked Users</p>
                            <p className="text-xl md:text-3xl font-black text-red-600 leading-tight">{stats.blocked_users || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-red-50 rounded-lg flex-shrink-0">
                            <FaUsers className="text-red-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaHistory /> Recent Activities
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-50">
                                        <div className="mt-1">
                                            {getActivityIcon(activity.action_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-medium text-gray-800 truncate">
                                                    {activity.user_name}
                                                </p>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {formatDate(activity.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">No recent activities</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaCog /> Quick Actions
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => onTabChange('approvals')}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-4 rounded-xl flex items-center justify-between transition-all shadow-md active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <FaUserCheck />
                                    <div className="text-left font-bold">
                                        <p className="text-sm">Account Signups</p>
                                        <p className="text-[10px] opacity-80">Verify new applications</p>
                                    </div>
                                </div>
                                {pendingApprovalsCount > 0 && (
                                    <span className="bg-white text-amber-600 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                        {pendingApprovalsCount} New
                                    </span>
                                )}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onTabChange('users')}
                                    className="bg-white hover:bg-gray-50 border border-gray-100 p-4 rounded-xl transition-all flex flex-col items-center gap-2 font-bold group shadow-sm"
                                >
                                    <FaUsers className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] uppercase text-gray-400">Users</span>
                                    {stats.blocked_users > 0 && (
                                        <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-full mt-1">
                                            {stats.blocked_users} blocked
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => onTabChange('companies')}
                                    className="bg-white hover:bg-gray-50 border border-gray-100 p-4 rounded-xl transition-all flex flex-col items-center gap-2 font-bold group shadow-sm"
                                >
                                    <FaBuilding className="text-purple-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] uppercase text-gray-400">Companies</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
