import React from 'react';
import {
    FaUserCircle, FaSpinner, FaUserCheck, FaUserTimes, FaCheckCircle, FaSync, FaExclamationTriangle
} from 'react-icons/fa';

export const AdminApprovals = ({
    pendingUsers = [],
    loading = false,
    error = '',
    processingApproval,
    handleApproveUser,
    handleRejectUser,
    onRefresh,
    formatDate
}) => {
    if (loading && pendingUsers.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-12 text-center">
                <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading pending approvals...</p>
            </div>
        );
    }

    if (error && pendingUsers.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-12 text-center border-l-4 border-red-500">
                <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to load</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={onRefresh}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        Pending Approvals
                    </h2>
                    <p className="text-gray-600">Review and grant access to new registrations.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-bold">
                        {pendingUsers?.length || 0} Waiting
                    </span>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {pendingUsers && pendingUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingUsers.map((user) => (
                        <div key={user.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                        <FaUserCircle className="text-blue-500 text-2xl" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-800 truncate">{user.full_name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 italic">Institution:</span>
                                        <span className="font-medium text-gray-700 truncate ml-2">
                                            {user.institution || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 italic">Type:</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.account_type === 'company' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.account_type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 italic">Role:</span>
                                        <span className="text-gray-700 font-medium capitalize">{user.role}</span>
                                    </div>
                                    {user.license_number && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 italic">License:</span>
                                            <span className="text-green-600 font-mono font-bold text-xs">{user.license_number}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-dashed flex justify-between items-center text-[10px] text-gray-400">
                                        <span>Applied On</span>
                                        <span>{formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 bg-gray-50 border-t flex gap-2">
                                <button
                                    onClick={() => handleApproveUser(user.id, user.email)}
                                    disabled={processingApproval === user.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-bold disabled:opacity-50"
                                >
                                    {processingApproval === user.id ? <FaSpinner className="animate-spin" /> : <FaUserCheck />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleRejectUser(user.id, user.email)}
                                    className="px-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 py-2 rounded-lg flex items-center justify-center transition text-sm"
                                    title="Reject User"
                                >
                                    <FaUserTimes />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-16 text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="text-4xl text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Queue is Clear!</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8">
                        There are currently no users waiting for approval. Everything is up to date.
                    </p>
                    <button
                        onClick={onRefresh}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold transition"
                    >
                        <FaSync /> Check Again
                    </button>
                </div>
            )}
        </div>
    );
};
