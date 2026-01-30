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
import './KnowledgeBase.css';

const KnowledgeBaseLayout = () => {
    const tabs = [
        { path: 'medications', label: 'Medications', icon: <FaPills /> },
        { path: 'remedies', label: 'Home Remedies', icon: <FaFlask /> },
        { path: 'illnesses', label: 'Minor Illnesses', icon: <FaStethoscope /> },
        { path: 'compounding', label: 'Compounding', icon: <FaMortarPestle /> },
    ];

    return (
        <div className="space-y-6 knowledge-base-container overflow-x-hidden max-w-full">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Knowledge Base</h1>
                    <p className="text-gray-600 text-sm md:text-base">Access comprehensive information about medications, treatments, and patient care.</p>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.path === 'medications'}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area - Rendered outside to avoid nested card padding constraints */}
            <div className="min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};

export default KnowledgeBaseLayout;