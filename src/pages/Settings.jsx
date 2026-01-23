import React from 'react';
import { FaCog, FaUser, FaBell, FaShieldAlt, FaSave } from 'react-icons/fa';

const Settings = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                    <FaCog className="text-blue-600 text-xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-600">Manage your account and preferences</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="text-center py-12">
                    <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Settings Dashboard</h3>
                    <p className="text-gray-600">Settings functionality coming soon</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;