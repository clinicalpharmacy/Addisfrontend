import React from 'react';
import {
    FaSync, FaHospital, FaExclamationTriangle, FaSpinner,
    FaPhone, FaCalendarAlt
} from 'react-icons/fa';

export const AdminCompanies = ({
    companies,
    loading,
    error,
    onRefresh,
    formatDate
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Company Management</h2>
                    <p className="text-gray-600">Overview of all registered medical institutions and pharmacies.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onRefresh}
                        className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200 transition"
                        title="Refresh Companies"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">{companies.length}</p>
                        <p className="text-sm text-gray-500">Total Registered</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-500" />
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={onRefresh}
                        className="ml-auto text-sm font-bold text-red-600 hover:underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <FaSpinner className="text-4xl text-purple-500 animate-spin" />
                </div>
            ) : companies.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {companies.map((company) => (
                        <div key={company.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                                            <FaHospital className="text-2xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{company.company_name}</h3>
                                            <p className="text-sm text-gray-500">{company.company_type || 'Institution'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.subscription_status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {company.subscription_status?.toUpperCase() || 'INACTIVE'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Contact Details</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <FaPhone className="text-gray-400" /> {company.admin_phone || 'N/A'}
                                        </div>
                                        <p className="text-sm text-gray-700 flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" /> Reg: {formatDate(company.created_at)}
                                        </p>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Capacity & Size</p>
                                        <p className="text-sm text-gray-700">Size: {company.company_size || 'N/A'}</p>
                                        <p className="text-sm text-gray-700">Users: {company.user_capacity || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Admin User</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                                {company.users?.full_name?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{company.users?.full_name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{company.users?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">View Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <FaHospital className="text-6xl text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No Companies Registered</h3>
                    <p className="text-gray-500">Registration requests from medical institutions will appear here.</p>
                </div>
            )}
        </div>
    );
};
