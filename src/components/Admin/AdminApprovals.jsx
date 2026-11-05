import React, { useState } from 'react';
import {
    FaUserCircle, FaSpinner, FaUserCheck, FaUserTimes, FaCheckCircle, FaSync,
    FaExclamationTriangle, FaMoneyBillWave, FaCopy, FaCheck, FaTimes, FaBuilding, FaClock
} from 'react-icons/fa';

export const AdminApprovals = ({
    pendingUsers = [],
    pendingPayments = [],
    loading = false,
    error = '',
    processingApproval,
    processingPaymentId,
    handleApproveUser,
    handleRejectUser,
    handleApprovePayment,
    handleRejectPayment,
    onRefresh,
    formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A'
}) => {
    const [copiedRef, setCopiedRef] = useState('');

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(''), 2000);
    };

    const totalPending = (pendingPayments?.length || 0) + (pendingUsers?.length || 0);

    if (loading && totalPending === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-12 text-center">
                <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading pending approvals...</p>
            </div>
        );
    }

    if (error && totalPending === 0) {
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
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                        <FaUserCheck className="text-amber-600 text-xl" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                            Approvals Command Center
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
                            Bank transfers & account clearance.
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                    <div className="px-3.5 py-1.5 bg-amber-100/60 text-amber-800 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-200/60">
                        {totalPending} Total Pending
                    </div>
                    <button
                        onClick={onRefresh}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 text-xs font-black active:scale-95"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* SECTION 1: PENDING CBE BANK PAYMENTS */}
            {pendingPayments && pendingPayments.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                                <FaMoneyBillWave className="text-base" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900 leading-tight">
                                    Pending Bank & Mobile Transfers
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Transferred to Addis Med (CBE / Telebirr)
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-black border border-green-200">
                            {pendingPayments.length} awaiting verification
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pendingPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="group bg-white rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-300 overflow-hidden flex flex-col hover:-translate-y-1"
                            >
                                <div className="p-5 flex-1">
                                    {/* Top badge row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
                                            {(payment.payment_method || 'CBE').toUpperCase()} TRANSFER
                                        </span>
                                        <span className="text-[11px] font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                                            {payment.amount} ETB
                                        </span>
                                    </div>

                                    {/* User Details */}
                                    <div className="mb-4">
                                        <h4 className="font-black text-gray-900 text-base leading-snug truncate" title={payment.user_name}>
                                            {payment.user_name || 'Healthcare User'}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium truncate" title={payment.user_email}>
                                            {payment.user_email}
                                        </p>
                                    </div>

                                    {/* CBE Transaction Reference Callout */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">
                                                CBE Transaction Ref
                                            </span>
                                            <button
                                                onClick={() => handleCopy(payment.tx_ref)}
                                                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 hover:underline"
                                            >
                                                {copiedRef === payment.tx_ref ? (
                                                    <>
                                                        <FaCheck className="text-green-600" /> Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCopy /> Copy Ref
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="font-mono font-black text-base text-gray-900 break-all select-all">
                                            {payment.tx_ref}
                                        </p>
                                    </div>

                                    {/* Plan & Date meta */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Plan</span>
                                            <span className="font-black text-gray-800">{payment.plan_name || payment.plan_id}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Submitted</span>
                                            <span className="font-semibold text-gray-600 flex items-center gap-1">
                                                <FaClock className="text-[10px] text-gray-400" />
                                                {formatDate(payment.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex gap-2">
                                    <button
                                        onClick={() => handleApprovePayment(payment.id)}
                                        disabled={processingPaymentId === payment.id}
                                        className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-green-100 text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-95"
                                    >
                                        {processingPaymentId === payment.id ? (
                                            <FaSpinner className="animate-spin text-sm" />
                                        ) : (
                                            <FaCheck className="text-sm" />
                                        )}
                                        Approve & Activate
                                    </button>
                                    <button
                                        onClick={() => handleRejectPayment(payment.id)}
                                        disabled={processingPaymentId === payment.id}
                                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl flex items-center justify-center gap-1 transition-all text-xs font-black uppercase tracking-wider active:scale-95 disabled:opacity-50"
                                        title="Reject Payment"
                                    >
                                        <FaTimes />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 2: PENDING USER IDENTITY APPROVALS */}
            {pendingUsers && pendingUsers.length > 0 && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                                <FaBuilding className="text-base" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900 leading-tight">
                                    Pending Account Registrations
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Institutional & company clearance
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black border border-indigo-200">
                            {pendingUsers.length} awaiting approval
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {pendingUsers.map((user) => (
                            <div
                                key={user.id}
                                className="group bg-white rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col hover:-translate-y-1"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[18px] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                            <FaUserCircle className="text-indigo-400 text-3xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-gray-900 truncate text-base leading-tight">{user.full_name}</h4>
                                            <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 mb-2">
                                        <div className="flex items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-50 group-hover:bg-white transition-colors">
                                            <div className="w-20 text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">Institution</div>
                                            <div className="font-bold text-gray-700 text-xs truncate ml-2 flex-1">
                                                {user.institution || 'Independent'}
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-50 group-hover:bg-white transition-colors">
                                            <div className="w-20 text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">Classification</div>
                                            <div className="ml-2 flex-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${user.account_type === 'company' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm'}`}>
                                                    {user.account_type || 'User'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-50 group-hover:bg-white transition-colors">
                                            <div className="w-20 text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">Designation</div>
                                            <div className="text-gray-900 font-extrabold text-xs capitalize ml-2">{user.role}</div>
                                        </div>

                                        {user.license_number && (
                                            <div className="flex items-center bg-green-50/30 p-2.5 rounded-xl border border-green-50/50 group-hover:bg-white transition-colors">
                                                <div className="w-20 text-[9px] font-black text-green-600/60 uppercase tracking-widest shrink-0">Credential</div>
                                                <div className="text-green-700 font-mono font-black text-[10px] ml-2 tracking-wider">{user.license_number}</div>
                                            </div>
                                        )}

                                        <div className="pt-2 mt-2 flex justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-widest border-t border-dashed border-gray-100">
                                            <span>Submission Date</span>
                                            <span className="text-gray-500">{formatDate(user.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-2.5">
                                    <button
                                        onClick={() => handleApproveUser(user.id, user.email)}
                                        disabled={processingApproval === user.id}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-[16px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 text-xs font-black disabled:opacity-50 active:scale-95"
                                    >
                                        {processingApproval === user.id ? <FaSpinner className="animate-spin" /> : <FaUserCheck />}
                                        Approve Access
                                    </button>
                                    <button
                                        onClick={() => handleRejectUser(user.id, user.email)}
                                        className="flex-1 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 py-3 rounded-[16px] flex items-center justify-center transition-all text-xs font-black active:scale-95"
                                        title="Reject User"
                                    >
                                        <FaUserTimes />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EMPTY STATE: Only when both are zero */}
            {totalPending === 0 && (
                <div className="bg-white rounded-[32px] shadow-sm p-12 sm:p-20 text-center border-2 border-dashed border-gray-100 animate-fadeIn">
                    <div className="w-24 h-24 bg-green-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-500">
                        <FaCheckCircle className="text-4xl text-green-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">System Cleared!</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium text-sm leading-relaxed">
                        There are currently no pending CBE bank payments or user registrations awaiting approval.
                    </p>
                    <button
                        onClick={onRefresh}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-widest transition-all hover:gap-3"
                    >
                        <FaSync /> Continuous Security Check
                    </button>
                </div>
            )}
        </div>
    );
};
