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
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Institution Control Center */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 sm:p-6 rounded-[24px] shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-purple-50 rounded-2xl shadow-inner">
                        <FaHospital className="text-purple-600 text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 leading-tight">Institutional Registry</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enterprise node governance.</p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 bg-gray-50/50 p-2 sm:p-0 rounded-2xl sm:bg-transparent">
                    <button
                        onClick={onRefresh}
                        className="bg-white sm:bg-purple-100 text-purple-600 p-3 rounded-xl hover:bg-purple-200 transition-all shadow-sm active:scale-95 border border-purple-100 sm:border-transparent"
                        title="Synchronize Records"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="text-right pr-2 sm:pr-0">
                        <p className="text-2xl sm:text-4xl font-black text-purple-600 leading-none">{companies.length}</p>
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mt-1">Total Active</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-100/50 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <FaExclamationTriangle className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-red-800 font-black text-xs uppercase tracking-tight">System Outage Detected</p>
                        <p className="text-red-600 text-[11px] font-medium">{error}</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="ml-auto bg-white text-xs font-black text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                    >
                        Retry Load
                    </button>
                </div>
            )}

            {loading && companies.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="relative inline-block mb-4">
                        <FaSpinner className="animate-spin text-5xl text-purple-500/20" />
                        <FaHospital className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-purple-500" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Network Nodes...</p>
                </div>
            ) : companies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {companies.map((company) => (
                        <div key={company.id} className="group bg-white rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col hover:-translate-y-1">
                            <div className="p-5 sm:p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl text-purple-600 shadow-inner transition-transform group-hover:scale-110">
                                            <FaHospital className="text-2xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-gray-900 truncate leading-tight mb-1" title={company.company_name}>
                                                {company.company_name}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{company.company_type || 'Institution'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${company.subscription_status === 'active'
                                        ? 'bg-green-100 text-green-700 shadow-sm border border-green-200'
                                        : 'bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200'
                                        }`}>
                                        {company.subscription_status?.toUpperCase() || 'INACTIVE'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-50 group-hover:bg-white transition-colors">
                                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">Connectivity</p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-700 font-bold">
                                                <FaPhone className="text-purple-300 text-[10px]" /> {company.users?.phone || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                                <FaCalendarAlt className="text-purple-300" /> {formatDate(company.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-50 group-hover:bg-white transition-colors">
                                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">Resource Index</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Scale:</span>
                                                <span className="text-gray-900 font-black">{company.company_size || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Quota:</span>
                                                <span className="text-purple-600 font-black">{company.user_capacity || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-dashed border-gray-100">
                                    <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg shadow-purple-200">
                                                {company.users?.full_name?.charAt(0) || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-900 truncate">{company.users?.full_name || 'System Admin'}</p>
                                                <p className="text-[10px] text-gray-400 font-medium truncate">{company.users?.email || 'No email registered'}</p>
                                            </div>
                                        </div>
                                        <button className="text-purple-600 hover:text-purple-800 text-[9px] font-black uppercase tracking-widest transition-all hover:pr-1">
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] shadow-sm p-16 sm:p-24 text-center border-2 border-dashed border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <FaHospital className="text-5xl text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Registry Vacant</h3>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                        Institutional entities will appear here upon network registration. Currently tracking zero enterprise nodes.
                    </p>
                </div>
            )}
        </div>
    );
};
