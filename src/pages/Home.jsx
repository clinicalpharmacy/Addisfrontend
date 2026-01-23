import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaUserInjured, 
    FaPills, 
    FaFlask,
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

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {getGreeting()}, Pharmacist!
                        </h1>
                        <p className="text-blue-100 mt-1">
                            Addismed Clinical Decision Support
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <p className="text-sm text-blue-200">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                            {new Date().toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patients */}
                <Link to="/patients" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUserInjured className="text-blue-600 text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Patients</h2>
                            <p className="text-sm text-gray-500">Manage records & treatments</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-blue-600 flex items-center gap-1">
                            Open <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* Home Remedies */}
                <Link to="/knowledge/remedies" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <FaFlask className="text-green-600 text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Home Remedies</h2>
                            <p className="text-sm text-gray-500">Traditional treatments</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-green-600 flex items-center gap-1">
                            Browse <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* Medication Info */}
                <Link to="/knowledge/medications" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <FaPills className="text-purple-600 text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Medication Info</h2>
                            <p className="text-sm text-gray-500">Drug database & interactions</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-purple-600 flex items-center gap-1">
                            Search <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* Minor Illnesses */}
                <Link to="/knowledge/illnesses" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <FaUserMd className="text-orange-600 text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Minor Illnesses</h2>
                            <p className="text-sm text-gray-500">Treatment guides</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-orange-600 flex items-center gap-1">
                            View <FaArrowRight />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Simple Footer */}
            <div className="text-center text-gray-500 text-sm">
                <p>Addismed CDSS - Supporting pharmaceutical care decisions</p>
            </div>
        </div>
    );
};

export default Home;