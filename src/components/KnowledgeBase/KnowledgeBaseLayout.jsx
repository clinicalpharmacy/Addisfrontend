import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
    FaPills, 
    FaFlask, 
    FaStethoscope, 
    FaMortarPestle,
    FaBookMedical,
    FaHome
} from 'react-icons/fa';

const KnowledgeBaseLayout = () => {
    const tabs = [
        { path: 'medications', label: 'Medications', icon: <FaPills /> },
        { path: 'remedies', label: 'Home Remedies', icon: <FaFlask /> },
        { path: 'illnesses', label: 'Minor Illnesses', icon: <FaStethoscope /> },
        { path: 'compounding', label: 'Compounding', icon: <FaMortarPestle /> },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Knowledge Base</h1>
                    <p className="text-gray-600">Access comprehensive information about medications, treatments, and patient care.</p>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.path === 'medications'}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                {tab.icon}
                                {tab.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="mt-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseLayout;