import React from 'react';
import {
    FaUserCircle, FaSpinner, FaUserCheck, FaUserTimes, FaCheckCircle, FaSync
} from 'react-icons/fa';

export const AdminApprovals = ({
    pendingUsers,
    processingApproval,
    handleApproveUser,
    handleRejectUser,
    onRefresh,
    formatDate
}) => {
    return (
        <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Pending Approvals ({pendingUsers.length})
                    </h2>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <FaSync /> Refresh Data
                    </button>
                </div>
            </div>

            <div className="p-6">
                {pendingUsers.length > 0 ? (
                    <div className="space-y-4">
                        {pendingUsers.map((user) => (
                            <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <FaUserCircle className="text-yellow-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">{user.full_name}</h4>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(user.created_at)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        {user.institution}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${user.account_type === 'company'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {user.account_type === 'company' ? 'Company Admin' : 'Individual'}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${user.role === 'company_admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'pharmacist'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveUser(user.id, user.email)}
                                                        disabled={processingApproval === user.id}
                                                        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition ${processingApproval === user.id ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                    >
                                                        {processingApproval === user.id ? (
                                                            <FaSpinner className="animate-spin" />
                                                        ) : (
                                                            <FaUserCheck />
                                                        )}
                                                        {processingApproval === user.id ? 'Approving...' : 'Approve User'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectUser(user.id, user.email)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                                    >
                                                        <FaUserTimes /> Reject User
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FaCheckCircle className="text-6xl text-green-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Pending Approvals</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            All users are approved. New registrations will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
