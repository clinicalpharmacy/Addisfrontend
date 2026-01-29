import React from 'react';
import {
    FaUsers, FaHospital, FaPills, FaUserInjured, FaClock,
    FaHistory, FaCog, FaUserCheck, FaDownload
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const AdminOverview = ({
    stats,
    usersCount,
    medicationsCount,
    patientsCount,
    companiesCount,
    recentActivities,
    pendingApprovalsCount,
    onTabChange,
    getActivityIcon,
    formatDate,
    downloadReport
}) => {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.total_users || usersCount || 0}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUsers className="text-blue-600 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Approvals</p>
                            <p className="text-3xl font-bold text-gray-800">{pendingApprovalsCount || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Waiting for approval</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <FaClock className="text-yellow-600 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Medications in KB</p>
                            <p className="text-3xl font-bold text-green-600">{medicationsCount || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Knowledge Base Entries</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <FaPills className="text-green-600 text-xl" />
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
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Patients</p>
                            <p className="text-3xl font-bold text-blue-600">{patientsCount || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">All system patients</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUserInjured className="text-blue-600 text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaHistory /> Recent Activities
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="mt-1">
                                            {getActivityIcon(activity.action_type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-medium text-gray-800">
                                                    {activity.user_name}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(activity.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No recent activities</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaCog /> Quick Actions
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => onTabChange('approvals')}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg flex items-center justify-between transition"
                            >
                                <div className="flex items-center gap-2">
                                    <FaUserCheck /> Review Pending Approvals
                                </div>
                                {pendingApprovalsCount > 0 && (
                                    <span className="bg-white text-yellow-600 text-xs px-2 py-1 rounded-full">
                                        {pendingApprovalsCount} pending
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => onTabChange('medications')}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-between transition"
                            >
                                <div className="flex items-center gap-2">
                                    <FaPills /> Medication Knowledge Base
                                </div>
                                <span className="text-sm">{medicationsCount} meds</span>
                            </button>

                            <button
                                onClick={() => onTabChange('patients')}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-between transition"
                            >
                                <div className="flex items-center gap-2">
                                    <FaUserInjured /> Patient Management
                                </div>
                                <span className="text-sm">{patientsCount} patients</span>
                            </button>

                            <button
                                onClick={downloadReport}
                                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition"
                            >
                                <FaDownload /> Export System Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
