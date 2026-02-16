import React from 'react';
import {
    FaUsers, FaHospital, FaClock,
    FaHistory, FaCog, FaUserCheck, FaUserMd, FaBuilding
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const AdminOverview = ({
    stats,
    usersCount,
    companiesCount,
    recentActivities,
    pendingApprovalsCount,
    onTabChange,
    getActivityIcon,
    formatDate
}) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-tight truncate">Total Users</p>
                            <p className="text-xl md:text-3xl font-black text-gray-800 leading-tight">{stats.total_users || usersCount || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                            <FaUsers className="text-blue-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-amber-500 font-bold uppercase tracking-tight truncate">Pending</p>
                            <p className="text-xl md:text-3xl font-black text-gray-800 leading-tight">{pendingApprovalsCount || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-amber-50 rounded-lg flex-shrink-0">
                            <FaClock className="text-amber-500 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-green-500 font-bold uppercase tracking-tight truncate">Doctors</p>
                            <p className="text-xl md:text-3xl font-black text-green-600 leading-tight">{stats.doctor_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-green-50 rounded-lg flex-shrink-0">
                            <FaUserMd className="text-green-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-indigo-500 font-bold uppercase tracking-tight truncate">Pharmacists</p>
                            <p className="text-xl md:text-3xl font-black text-indigo-600 leading-tight">{stats.pharmacist_count || 0}</p>
                        </div>
                        <div className="p-2 md:p-3 bg-indigo-50 rounded-lg flex-shrink-0">
                            <FaHospital className="text-indigo-600 text-sm md:text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md col-span-1 xs:col-span-2 md:col-span-1 xl:col-span-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-sm text-purple-500 font-bold uppercase tracking-tight truncate">Companies</p>
                            <p className="text-xl md:text-3xl font-black text-purple-600 leading-tight">{companiesCount || 0}</p>
                        </div>
<<<<<<< HEAD
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <FaHospital className="text-indigo-600 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Students</p>
                            <p className="text-3xl font-bold text-blue-500">{stats.student_count || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Medical Students</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUsers className="text-blue-500 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Laboratory</p>
                            <p className="text-3xl font-bold text-red-600">{stats.laboratory_count || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Lab Professionals</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <FaFlask className="text-red-600 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Other Pros</p>
                            <p className="text-3xl font-bold text-gray-600">{stats.others_count || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Health Officers/Other</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-full">
                            <FaBriefcase className="text-gray-600 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500 cursor-pointer hover:bg-gray-50 transition" onClick={() => onTabChange('users')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Blocked Users</p>
                            <p className="text-3xl font-bold text-red-600">{stats.blocked_users || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Accounts suspended</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <FaUsers className="text-red-500 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Companies</p>
                            <p className="text-3xl font-bold text-purple-600">{companiesCount || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Registered Institutions</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <FaHospital className="text-purple-600 text-xl" />
=======
                        <div className="p-2 md:p-3 bg-purple-50 rounded-lg flex-shrink-0">
                            <FaBuilding className="text-purple-600 text-sm md:text-xl" />
>>>>>>> ceb1624 (email verification)
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
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => onTabChange('approvals')}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-4 rounded-xl flex items-center justify-between transition-all shadow-md active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <FaUserCheck />
                                    <div className="text-left font-bold">
                                        <p className="text-sm">Review Approvals</p>
                                        <p className="text-[10px] opacity-80">Process pending nodes</p>
                                    </div>
                                </div>
                                {pendingApprovalsCount > 0 && (
                                    <span className="bg-white text-amber-600 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                        {pendingApprovalsCount} New
                                    </span>
                                )}
                            </button>

<<<<<<< HEAD
                            <button
                                onClick={() => onTabChange('users')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-between transition shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <FaUsers /> Manage Blocked Users
                                </div>
                                {stats.blocked_users > 0 && (
                                    <span className="bg-white text-red-600 text-xs px-2 py-1 rounded-full font-bold">
                                        {stats.blocked_users} blocked
                                    </span>
                                )}
                            </button>
=======
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onTabChange('users')}
                                    className="bg-white hover:bg-gray-50 border border-gray-100 p-4 rounded-xl transition-all flex flex-col items-center gap-2 font-bold"
                                >
                                    <FaUsers className="text-blue-500" />
                                    <span className="text-[10px] uppercase text-gray-400">Users</span>
                                </button>
                                <button
                                    onClick={() => onTabChange('companies')}
                                    className="bg-white hover:bg-gray-50 border border-gray-100 p-4 rounded-xl transition-all flex flex-col items-center gap-2 font-bold"
                                >
                                    <FaBuilding className="text-purple-500" />
                                    <span className="text-[10px] uppercase text-gray-400">Companies</span>
                                </button>
                            </div>
>>>>>>> ceb1624 (email verification)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
