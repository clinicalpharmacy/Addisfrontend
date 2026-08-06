import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaBookmark,
    FaShieldAlt
} from 'react-icons/fa';

const Home = () => {
    const [showSecuritySetup, setShowSecuritySetup] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role;
    const isSecurityActive = !!user?.public_key;

    // Check user roles
    const isAdmin = user?.role === 'admin';
    const isCompanyAdmin = user?.role === 'company_admin';
    const isCompanyUser = !!user?.company_id || user?.account_type === 'company' || ['company_admin', 'company_user'].includes(user?.role);
    const isIndividual = !isAdmin && !isCompanyUser;
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
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
                <Link to="/medication-availability" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <FaPills className="text-yellow-600 text-lg" />
                        </div>
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
                
                {/* 2. Medication Information */}
                <Link to="/knowledge/medications" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FaPills className="text-purple-600 text-lg" />
                        </div>
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

                {/* 3. Quick Safety Check */}
                <Link to="/quick-safety" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition border-2 border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FaShieldAlt className="text-indigo-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">Quick Safety Check</h2>
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
                {!isAdmin && user?.role !== 'healthcare_client' && (
                    <Link to="/patients" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaUserInjured className="text-blue-600 text-lg" />
                            </div>
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
                    </Link>
                )}

                {/* 5. Useful Links */}
                {(user?.role !== 'healthcare_client' || !isIndividual) && (
                    <Link to="/useful-links" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FaBookmark className="text-green-600 text-lg" />
                            </div>
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
                <Link to="/knowledge/remedies" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FaVial className="text-green-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">የቤት ውስጥ ጤና ክብካቤ</h2>
                            <p className="text-xs text-gray-500">Home remedies</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-green-600 text-sm flex items-center gap-1">
                            Browse <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Grid - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 7. Minor Illnesses */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/illnesses" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FaUserMd className="text-orange-600 text-lg" />
                            </div>
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
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/compounding" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FaUserMd className="text-orange-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Compounding</h2>
                                <p className="text-xs text-gray-500">Compounding SOPs</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-orange-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 9. Education */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/Education" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FaUserMd className="text-purple-600 text-lg" />
                            </div>
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
