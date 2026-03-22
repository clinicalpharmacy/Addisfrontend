import React from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight
} from 'react-icons/fa';

const Home = () => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

const user = JSON.parse(localStorage.getItem('user'));
const role = user?.role;
    
    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-2 sm:px-4 md:px-6">
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
            
              {/* Medication Info */}
              <Link to="/knowledge/medications" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <FaPills className="text-purple-600 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Medication Info</h2>
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
                    <h2 className="text-xl font-bold text-gray-800">Home Remedies</h2>
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
                {/* Minor Illnesses - Only for Pharmacists & Pharmacy students */}
                {['pharmacist', 'pharmacy_student'].includes(
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

                {/* Compounding - Only for Pharmacists & Pharmacy students */}
                {['pharmacist', 'pharmacy_student'].includes(
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

                {/* Educational review - Only for Pharmacists & Pharmacy students */}
                {['pharmacist', 'pharmacy_student'].includes(
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
