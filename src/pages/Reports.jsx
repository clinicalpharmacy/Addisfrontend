import React from 'react';
import { FaChartBar, FaDownload, FaFilter, FaCalendar } from 'react-icons/fa';

const Reports = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-600">Generate and view system reports</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <FaFilter /> Filter
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <FaDownload /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="text-center py-12">
                    <FaChartBar className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Reports Dashboard</h3>
                    <p className="text-gray-600">Reports functionality coming soon</p>
                </div>
            </div>
        </div>
    );
};

export default Reports;