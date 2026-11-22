import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaBookmark,
    FaShieldAlt
} from 'react-icons/fa';

// Shared classes to prevent iOS/Safari tap-highlight flicker & shadow repaint.
// - WebkitTapHighlightColor: transparent  -> kills the gray flash on tap
// - transition-shadow (not transition)    -> only animate the shadow, not all props
// - transform-gpu + backface-visibility   -> promotes card to its own GPU layer
//                                            so Safari doesn't re-rasterize on tap
const cardBase =
    'bg-white rounded-xl shadow p-4 transition-shadow duration-200 transform-gpu backface-hidden ' +
    '[-webkit-tap-highlight-color:transparent] hover:shadow-md';

const Home = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role;

    const isAdmin = user?.role === 'admin';
    const isCompanyAdmin = user?.role === 'company_admin';
    const isCompanyUser = !!user?.company_id || user?.account_type === 'company' || ['company_admin', 'company_user'].includes(user?.role);
    const isIndividual = !isAdmin && !isCompanyUser;

    const isSubscribed = (() => {
        if (!user) return false;
        if (isAdmin) return true;
        const status = user.subscription_status || localStorage.getItem('subscription_status');
        const endDate = user.subscription_end_date || localStorage.getItem('subscription_end_date');
        if (status !== 'active') return false;
        if (endDate && !isNaN(new Date(endDate).getTime()) && new Date(endDate) < new Date()) {
            return false;
        }
        return true;
    })();

    const isIndividualPharmacist =
        isIndividual && role === 'pharmacist';

    const isCompanyPharmacy =
        isCompanyUser &&
        (user?.facility_type === 'pharmacy' || user?.company_type === 'pharmacy');

    const isIndividualPharmacyStudent =
        isIndividual && role === 'pharmacy_student';

    const isCompanyPharmacySchool =
        isCompanyUser &&
        (user?.facility_type === 'pharmacy_school' ||
            user?.company_type === 'pharmacy_school' ||
            user?.company_type === 'pharmaceutical');

    const showPharmacyTools =
        isAdmin || role === 'pharmacist' || isCompanyPharmacy;

    const showEducation =
        isAdmin || role === 'pharmacist' || role === 'pharmacy_student' || isCompanyPharmacy || isCompanyPharmacySchool;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const onClose = () => {
        console.log('Close menu');
    };

    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-2 sm:px-4 md:px-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg w-full mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {getGreeting()}.
                        </h1>
                        <p className="text-blue-100 mt-1">
                            Addis Med Digital Health
                        </p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs md:text-sm text-blue-200 uppercase tracking-wider">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                        <p className="text-xl md:text-2xl font-bold mt-1">
                            {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 1. Medication Availability */}
                <Link to="/medication-availability" className={cardBase}>
                    <div className="flex items-center gap-3 mb-2">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">መድሃኒት ማፈላለጊያ</h2>
                            <p className="text-xs text-gray-500">Medication availability</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-yellow-600 text-sm flex items-center gap-1">
                            Search <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>

                {/* 2. Medication Information — the card that was blinking on Apple */}
                <Link to="/knowledge/medications" className={cardBase}>
                    <div className="flex items-center gap-3 mb-2">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">የመድሃኒት መረጃ</h2>
                            <p className="text-xs text-gray-500">Medicines database</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-purple-600 text-sm flex items-center gap-1">
                            Search <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>

                {/* 3. Quick Check */}
                <Link
                    to="/quick-safety"
                    className={`${cardBase} border-2 border-transparent hover:border-blue-100`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">Quick Check</h2>
                            <p className="text-xs text-gray-500">Pregnancy, elderly, organs</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-indigo-600 text-sm flex items-center gap-1">
                            Check <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 4. Clinical Pharmacy Tool */}
                {user?.role !== 'healthcare_client' && (
                    <NavLink
                        to={isSubscribed ? "/clinical-pharmacy-tool" : "/subscription/plans"}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `${cardBase} border-2 ${
                                isActive && isSubscribed
                                    ? 'border-blue-500'
                                    : 'border-transparent hover:border-blue-100'
                            } ${!isSubscribed ? 'opacity-60 cursor-not-allowed' : ''}`
                        }
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Clinical Pharmacy Tool</h2>
                                <p className="text-xs text-gray-500">Review medication use</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-blue-600 text-sm flex items-center gap-1">
                                Open <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </NavLink>
                )}

                {/* 5. Useful Links */}
                {(user?.role !== 'healthcare_client' || !isIndividual) && (
                    <Link to="/useful-links" className={cardBase}>
                        <div className="flex items-center gap-3 mb-2">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Useful Links</h2>
                                <p className="text-xs text-gray-500">External resources & references</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-green-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 6. Home Remedies */}
                <Link
                    to="/knowledge/remedies"
                    className={`${cardBase} relative group cursor-pointer`}
                >
                    {!isAdmin && <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Under Development</div>}
                    <div className="flex items-center gap-3 mb-2">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">የቤት ውስጥ ጤና ክብካቤ</h2>
                            <p className="text-xs text-gray-500">Home remedies</p>
                        </div>
                    </div>
                    <div className="flex justify-end mt-2">
                        <span className="text-green-600 text-sm flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
                            {isAdmin ? "Browse" : "Coming Soon"} <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Grid - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 7. Minor Illnesses */}
                {showPharmacyTools && (
                    <Link to="/knowledge/illnesses" className={cardBase}>
                        <div className="flex items-center gap-3 mb-2">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Minor Illnesses</h2>
                                <p className="text-xs text-gray-500">OTC Treatment guides</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-orange-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 8. Compounding */}
                {showPharmacyTools && (
                    <Link
                        to="/knowledge/compounding"
                        className={`${cardBase} relative group cursor-pointer`}
                    >
                        {!isAdmin && <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Under Development</div>}
                        <div className="flex items-center gap-3 mb-2 mt-1">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Compounding</h2>
                                <p className="text-xs text-gray-500">Compounding SOPs</p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <span className="text-orange-600 text-sm flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
                                {isAdmin ? "View" : "Coming Soon"} <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 9. Education */}
                {showEducation && (
                    <Link to="/knowledge/education" className={cardBase}>
                        <div className="flex items-center gap-3 mb-2">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Education</h2>
                                <p className="text-xs text-gray-500">Educational reviews</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-purple-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-xs sm:text-sm mt-4">
                <p>Addis Med - Enhancing patient safety and rational medicines use</p>
            </div>
        </div>
    );
};

export default Home;
