import React, { useState, useEffect } from 'react';
import {
    FaCreditCard, FaTimes, FaCheck, FaBuilding, FaUser, FaClock,
    FaCalendarAlt, FaShieldAlt, FaSpinner, FaExchangeAlt, FaCrown
} from 'react-icons/fa';

export const ManageSubscriptionModal = ({
    show,
    target, // user or company or subscription object
    companies = [],
    onClose,
    onSave
}) => {
    if (!show || !target) return null;

    const isCompany = target.type === 'Company' || target.company_name || target.is_company;
    const initialStatus = target.subscription_status || target.status || 'active';
    const initialPlan = target.subscription_plan || target.plan_id || target.plan || 'individual_yearly';
    
    // Parse initial date
    const getInitialDate = () => {
        const raw = target.subscription_end_date || target.expiry || target.end_date;
        if (!raw) return '';
        try {
            return new Date(raw).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const [status, setStatus] = useState(initialStatus);
    const [plan, setPlan] = useState(initialPlan);
    const [customPlan, setCustomPlan] = useState('');
    const [endDate, setEndDate] = useState(getInitialDate());
    const [accountType, setAccountType] = useState(target.account_type || (isCompany ? 'company' : 'individual'));
    const [companyId, setCompanyId] = useState(target.company_id || '');
    const [applyToCompany, setApplyToCompany] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setStatus(target.subscription_status || target.status || 'active');
        const currentPlan = target.subscription_plan || target.plan_id || target.plan || 'individual_yearly';
        setPlan(currentPlan);
        setEndDate(getInitialDate());
        setAccountType(target.account_type || (isCompany ? 'company' : 'individual'));
        setCompanyId(target.company_id || '');
        setError('');
    }, [target]);

    // Quick Date Extension Helper
    const extendDuration = (months) => {
        const base = new Date();
        if (months >= 120) {
            base.setFullYear(base.getFullYear() + 10);
        } else {
            base.setMonth(base.getMonth() + months);
        }
        setEndDate(base.toISOString().split('T')[0]);
        if (status !== 'active') {
            setStatus('active');
        }
    };

    const handlePlanChange = (newPlan) => {
        setPlan(newPlan);
        if (!isCompany) {
            if (newPlan.startsWith('individual')) {
                setAccountType('individual');
                setCompanyId('');
            } else if (newPlan !== 'custom') {
                setAccountType('company');
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        const chosenPlan = plan === 'custom' ? customPlan.trim() : plan;
        if (!chosenPlan) {
            setError('Please choose or enter a subscription plan');
            setSaving(false);
            return;
        }

        const payload = {
            subscription_status: status,
            subscription_plan: chosenPlan,
            subscription_end_date: endDate ? new Date(endDate).toISOString() : null,
            account_type: accountType,
            company_id: companyId ? companyId : null,
            apply_to_company: applyToCompany
        };

        if (!isCompany) {
            if (accountType === 'company') {
                if (!companyId) {
                    setError('Please select a Company / Facility to attach this Company Admin to, or switch Account Type to Individual.');
                    setSaving(false);
                    return;
                }
                payload.role = 'company_admin';
            } else if (accountType === 'company_user') {
                if (!companyId) {
                    setError('Please select a Company / Facility for this Company Staff member.');
                    setSaving(false);
                    return;
                }
                payload.role = 'user';
            } else {
                // Individual
                payload.account_type = 'individual';
                payload.company_id = null;
                payload.role = 'user';
            }
        }

        try {
            const success = await onSave(target.id || target.entityId, payload, isCompany);
            if (success) {
                onClose();
            }
        } catch (err) {
            setError(err.message || 'Failed to update subscription');
        } finally {
            setSaving(false);
        }
    };

    const PLAN_OPTIONS = [
        {
            group: 'Individual Plans',
            options: [
                { id: 'individual_monthly', label: 'Individual Monthly (345 ETB/mo)' },
                { id: 'individual_yearly', label: 'Individual Yearly (3,450 ETB/yr)' },
                { id: 'individual_trial', label: 'Individual Free Trial' }
            ]
        },
        {
            group: 'Pharmacy & Drug Store',
            options: [
                { id: 'pharmacy_monthly', label: 'Pharmacy Monthly (1,035 ETB/mo)' },
                { id: 'pharmacy_yearly', label: 'Pharmacy Yearly (10,350 ETB/yr)' }
            ]
        },
        {
            group: 'Clinic & Specialty Center',
            options: [
                { id: 'clinic_monthly', label: 'Clinic Monthly (1,035 ETB/mo)' },
                { id: 'clinic_yearly', label: 'Clinic Yearly (10,350 ETB/yr)' }
            ]
        },
        {
            group: 'Health Center',
            options: [
                { id: 'health_center_monthly', label: 'Health Center Monthly (1,035 ETB/mo)' },
                { id: 'health_center_yearly', label: 'Health Center Yearly (10,350 ETB/yr)' }
            ]
        },
        {
            group: 'Hospital & Academic',
            options: [
                { id: 'hospital_monthly', label: 'Hospital Monthly (3,450 ETB/mo)' },
                { id: 'hospital_yearly', label: 'Hospital Yearly (28,750 ETB/yr)' },
                { id: 'pharmacy_school_monthly', label: 'Pharmacy School Monthly (3,450 ETB/mo)' },
                { id: 'pharmacy_school_yearly', label: 'Pharmacy School Yearly (28,750 ETB/yr)' }
            ]
        },
        {
            group: 'Enterprise / Tiered',
            options: [
                { id: 'company_starter', label: 'Company Starter' },
                { id: 'company_pro', label: 'Company Pro' },
                { id: 'company_enterprise', label: 'Company Enterprise' }
            ]
        }
    ];

    const targetName = target.full_name || target.name || target.company_name || 'Account';
    const targetEmail = target.email || target.admin_email || 'No email specified';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-[28px] shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 sm:p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
                    >
                        <FaTimes size={16} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
                            <FaCrown className="text-amber-300 text-xl" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                                SuperAdmin Override
                            </span>
                            <h3 className="text-xl font-black leading-tight">Manage Subscription & Plan</h3>
                            <p className="text-xs text-indigo-100 mt-0.5 font-medium">
                                Upgrade, extend, or migrate account between Individual and Company.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    {/* Target Identity Summary */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                                {isCompany ? <FaBuilding /> : <FaUser />}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-gray-900 text-sm truncate">{targetName}</h4>
                                <p className="text-xs text-gray-500 truncate">{targetEmail}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {status}
                            </span>
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                            Subscription Status *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'active', label: 'Active', color: 'border-green-500 bg-green-50 text-green-700' },
                                { id: 'trial', label: 'Free Trial', color: 'border-blue-500 bg-blue-50 text-blue-700' },
                                { id: 'inactive', label: 'Inactive', color: 'border-gray-400 bg-gray-50 text-gray-700' },
                                { id: 'expired', label: 'Expired', color: 'border-red-500 bg-red-50 text-red-700' }
                            ].map((opt) => (
                                <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => setStatus(opt.id)}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                        status === opt.id
                                            ? `${opt.color} ring-2 ring-indigo-500/30 shadow-sm`
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {status === opt.id && <FaCheck className="text-[10px]" />}
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Plan Selection */}
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                            Subscription Plan / Tier *
                        </label>
                        <select
                            value={plan}
                            onChange={(e) => handlePlanChange(e.target.value)}
                            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            {PLAN_OPTIONS.map((group) => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.options.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                            <option value="custom">-- Custom Plan Name --</option>
                        </select>

                        {plan === 'custom' && (
                            <input
                                type="text"
                                placeholder="Enter custom plan identifier (e.g. enterprise_special)"
                                value={customPlan}
                                onChange={(e) => setCustomPlan(e.target.value)}
                                className="mt-2 w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        )}
                    </div>

                    {/* Expiration Date & Fast Extenders */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                Subscription Expiration Date
                            </label>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quick Extensions</span>
                        </div>

                        {/* Fast Extension Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {[
                                { label: '+1 Mo', months: 1 },
                                { label: '+3 Mos', months: 3 },
                                { label: '+6 Mos', months: 6 },
                                { label: '+1 Yr', months: 12 },
                                { label: '+2 Yrs', months: 24 },
                                { label: '10 Yrs (Lifetime)', months: 120 }
                            ].map((btn) => (
                                <button
                                    type="button"
                                    key={btn.label}
                                    onClick={() => extendDuration(btn.months)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg transition-colors border border-indigo-100"
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Account Type & Company Migration (Only if targeting a user) */}
                    {!isCompany && (
                        <div className="pt-3 border-t border-gray-100 space-y-3">
                            <div className="flex items-center gap-2">
                                <FaExchangeAlt className="text-indigo-600 text-xs" />
                                <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                                    Account Type & Company Transition
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'individual', label: 'Individual' },
                                    { id: 'company_user', label: 'Company Staff' },
                                    { id: 'company', label: 'Company Admin' }
                                ].map((type) => (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => {
                                            setAccountType(type.id);
                                            if (type.id === 'individual') setCompanyId('');
                                        }}
                                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all border text-center ${
                                            accountType === type.id
                                                ? 'bg-purple-50 text-purple-700 border-purple-400 ring-2 ring-purple-500/20 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {(accountType === 'company_user' || accountType === 'company') && (
                                <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5">
                                    <label className="block text-[11px] font-black text-purple-900 uppercase tracking-wider">
                                        Attach to Registered Company
                                    </label>
                                    <select
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="">-- Select Company / Facility --</option>
                                        {companies.map((comp) => (
                                            <option key={comp.id} value={comp.id}>
                                                {comp.company_name} ({comp.company_type || 'Organization'})
                                            </option>
                                        ))}
                                    </select>

                                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                                        <input
                                            type="checkbox"
                                            checked={applyToCompany}
                                            onChange={(e) => setApplyToCompany(e.target.checked)}
                                            className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                                        />
                                        <span className="text-[11px] font-bold text-purple-950">
                                            Cascade active subscription & plan to all users in this company
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <FaSpinner className="animate-spin text-sm" />
                                    <span>Applying Overrides...</span>
                                </>
                            ) : (
                                <>
                                    <FaShieldAlt className="text-sm" />
                                    <span>Apply Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
