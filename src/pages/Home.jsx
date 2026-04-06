import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaExclamationTriangle,
    FaShield,
    FaLockOpen,
    FaCheckCircle
} from 'react-icons/fa';
import SecurityActivator from '../components/Security/SecurityActivator';

const Home = () => {
    const [showSecuritySetup, setShowSecuritySetup] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role;
    const isSecurityActive = !!user?.public_key;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };
    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-2 sm:px-4 md:px-6">
            {/* 🛡️ Security Identity Banner (New) */}
            {!isSecurityActive && (
                <div className="mb-6 bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shadow-inner border border-amber-200">
                                <FaShield className="text-amber-600 text-3xl animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-amber-900 tracking-tight">Security Identity Required</h3>
                                <p className="text-amber-700 text-sm font-medium max-w-md">
                                    Your secure troubleshooting identity is not yet active. Activate it now to enable secure support access and patient data restoration.
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowSecuritySetup(!showSecuritySetup)}
                            className="w-full md:w-auto px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaLockOpen />
                            {showSecuritySetup ? 'Close Setup' : 'Activate Identity Now'}
                        </button>
                    </div>

                    {showSecuritySetup && (
                        <div className="mt-8 pt-8 border-t-2 border-amber-100 animate-in zoom-in-95 duration-300">
                            <SecurityActivator onActivated={() => window.location.reload()} />
                        </div>
                    )}
                </div>
            )}
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {getGreeting()}.
                        </h1>
                        <p className="text-blue-100 mt-1">
                            AddisMed Digital Health
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

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
            
              {/* Medication Review */}
              {role !== 'admin' && (
                <Link to="/patients" className="bg-white rounded-xl shadow p-4 sm:p-6 hover:shadow-md transition w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaUserInjured className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Medication Review</h2>
                      <p className="text-sm text-gray-500">Review medication use</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-blue-600 flex items-center gap-1">
                      Open <FaArrowRight />
                    </span>
                  </div>
                </Link>
              )}
            
              {/* የመድሃኒት መረጃ */}
              <Link to="/knowledge/medications" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <FaPills className="text-purple-600 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">የመድሃኒት መረጃ</h2>
                    <p className="text-sm text-gray-500">Database for Medicines information</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <span className="text-purple-600 flex items-center gap-1">
                    Search <FaArrowRight />
                  </span>
                </div>
              </Link>
            
              {/* Home Remedies */}
              <Link to="/knowledge/remedies" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <FaVial className="text-green-600 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">የቤት ውስጥ ጤና ክብካቤ</h2>
                    <p className="text-sm text-gray-500">Home made remedies</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <span className="text-green-600 flex items-center gap-1">
                    Browse <FaArrowRight />
                  </span>
                </div>
              </Link>
            
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
                {/* Minor Illnesses - Only for Company, Pharmacists & Pharmacy students */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(
                  JSON.parse(localStorage.getItem('user'))?.role
                ) && (
                  <Link to="/knowledge/illnesses" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <FaUserMd className="text-orange-600 text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Minor Illnesses</h2>
                        <p className="text-sm text-gray-500">OTC-based Treatment guides</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-orange-600 flex items-center gap-1">
                        View <FaArrowRight />
                      </span>
                    </div>
                  </Link>
                )}

                {/* Compounding - Only for Company, Pharmacists & Pharmacy students */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(
                  JSON.parse(localStorage.getItem('user'))?.role
                ) && (
                  <Link to="/knowledge/compounding" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <FaUserMd className="text-orange-600 text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Compounding</h2>
                        <p className="text-sm text-gray-500">Compounding SOPs</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-orange-600 flex items-center gap-1">
                        View <FaArrowRight />
                      </span>
                    </div>
                  </Link>
                )}

                {/* Educational review - Only for Company, Pharmacists & Pharmacy students */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(
                  JSON.parse(localStorage.getItem('user'))?.role
                ) && (
                  <Link to="/knowledge/Education" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <FaUserMd className="text-orange-600 text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Education</h2>
                        <p className="text-sm text-gray-500">Educational reviews</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-orange-600 flex items-center gap-1">
                        View <FaArrowRight />
                      </span>
                    </div>
                  </Link>
                )}
            </div>

            {/* Simple Footer */}
            <div className="text-center text-gray-500 text-xs sm:text-sm">
                <p>AddisMed - Enhacing patient safety and rational medicines use</p>
            </div>
        </div>
    );
};

export default Home;
