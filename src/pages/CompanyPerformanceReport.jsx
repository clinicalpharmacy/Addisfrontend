import React, { useState, useEffect } from 'react';
import {
    FaUsers, FaChartLine, FaPills, FaStethoscope,
    FaClipboardCheck, FaAward, FaTrophy, FaCalendar,
    FaDownload, FaPrint, FaSync, FaUserMd, FaDollarSign
} from 'react-icons/fa';
import api from '../utils/api';

const CompanyPerformanceReport = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('total_patients');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/performance/company-performance');
            if (response.success) {
                setReport(response.report);
            } else {
                setError(response.error || 'Failed to load report');
            }
        } catch (err) {
            console.error('Error fetching performance report:', err);
            const errorMessage = err.error || err.message || 'Failed to load performance report';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const sortUsers = (users) => {
        if (!users) return [];

        return [...users].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle nested values
            if (sortBy === 'recent_patients') {
                aVal = a.recent_activity?.patients || 0;
                bVal = b.recent_activity?.patients || 0;
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!report) return;

        // Create CSV content
        const headers = [
            'User Name', 'Email', 'Role', 'Days Active', 'Total Patients',
            'Total Medications', 'Total Assessments', 'Total Plans', 'Total Outcomes',
            'Patients/Day', 'Meds/Patient', 'Recent Patients (30d)', 'Recent Medications (30d)',
            'Recent Assessments (30d)', 'Cost Managed'
        ];

        const rows = report.user_performance.map(user => [
            user.full_name,
            user.email,
            user.role,
            user.days_active,
            user.total_patients,
            user.total_medications,
            user.total_assessments,
            user.total_plans,
            user.total_outcomes,
            user.patients_per_day,
            user.avg_medications_per_patient,
            user.recent_activity.patients,
            user.recent_activity.medications,
            user.recent_activity.assessments,
            user.total_cost_managed
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `company-performance-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg">Loading performance report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="text-red-500 text-2xl">⚠️</div>
                            <div>
                                <h3 className="text-red-800 font-semibold text-lg">Error Loading Report</h3>
                                <p className="text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={fetchReport}
                                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <FaSync /> Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const sortedUsers = sortUsers(report.user_performance);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <FaChartLine className="text-blue-600" />
                                Company Performance Report
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Generated on {formatDate(report.generated_at)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchReport}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <FaSync className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <FaPrint />
                                Print
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <FaDownload />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                <p className="text-4xl font-bold mt-2">{report.summary.total_users}</p>
                            </div>
                            <FaUsers className="text-5xl text-blue-200 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Patients</p>
                                <p className="text-4xl font-bold mt-2">{report.summary.total_patients}</p>
                            </div>
                            <FaUserMd className="text-5xl text-green-200 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Medications</p>
                                <p className="text-4xl font-bold mt-2">{report.summary.total_medications}</p>
                            </div>
                            <FaPills className="text-5xl text-purple-200 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Total Assessments</p>
                                <p className="text-4xl font-bold mt-2">{report.summary.total_assessments}</p>
                            </div>
                            <FaStethoscope className="text-5xl text-orange-200 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <FaTrophy className="text-yellow-600 text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Top Patient Creator</h3>
                        </div>
                        {report.summary.top_patient_creator && (
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <p className="font-semibold text-gray-800">{report.summary.top_patient_creator.full_name}</p>
                                <p className="text-sm text-gray-600">{report.summary.top_patient_creator.email}</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-2">
                                    {report.summary.top_patient_creator.total_patients} patients
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FaPills className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Top Medication Recorder</h3>
                        </div>
                        {report.summary.top_medication_recorder && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="font-semibold text-gray-800">{report.summary.top_medication_recorder.full_name}</p>
                                <p className="text-sm text-gray-600">{report.summary.top_medication_recorder.email}</p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    {report.summary.top_medication_recorder.total_medications} medications
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <FaAward className="text-green-600 text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Most Active (30 Days)</h3>
                        </div>
                        {report.summary.most_active_last_30_days && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="font-semibold text-gray-800">{report.summary.most_active_last_30_days.full_name}</p>
                                <p className="text-sm text-gray-600">{report.summary.most_active_last_30_days.email}</p>
                                <p className="text-sm text-gray-700 mt-2">
                                    {report.summary.most_active_last_30_days.recent_activity.patients} patients, {' '}
                                    {report.summary.most_active_last_30_days.recent_activity.medications} meds
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Performance Table */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FaUsers className="text-blue-600" />
                        User Performance Details
                    </h2>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {sortedUsers.map((user) => (
                            <div key={user.user_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{user.full_name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded capitalize">
                                        {user.role}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Patients</p>
                                        <p className="text-xl font-bold text-gray-800">{user.total_patients}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Meds</p>
                                        <p className="text-xl font-bold text-gray-800">{user.total_medications}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Assessments</p>
                                        <p className="text-xl font-bold text-gray-800">{user.total_assessments}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Cost</p>
                                        <p className="text-xl font-bold text-green-600">{formatCurrency(user.total_cost_managed)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-500">Recent Activity (30d):</span>
                                        <span>{user.recent_activity.patients} pts, {user.recent_activity.medications} meds</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-500">Rate:</span>
                                        <span>{user.patients_per_day} pts/day</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-500">Active For:</span>
                                        <span>{user.days_active} days</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">User</th>
                                    <th
                                        className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('total_patients')}
                                    >
                                        Patients {sortBy === 'total_patients' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('total_medications')}
                                    >
                                        Medications {sortBy === 'total_medications' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('total_assessments')}
                                    >
                                        Assessments {sortBy === 'total_assessments' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Recent (30d)</th>
                                    <th
                                        className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('patients_per_day')}
                                    >
                                        Rate {sortBy === 'patients_per_day' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Cost Managed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map((user, index) => (
                                    <tr key={user.user_id} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.full_name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-gray-800">{user.total_patients}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-gray-800">{user.total_medications}</span>
                                            <p className="text-xs text-gray-500">{user.avg_medications_per_patient} avg/patient</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-gray-800">{user.total_assessments}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">
                                                <p className="text-gray-700">
                                                    <span className="font-semibold">{user.recent_activity.patients}</span> patients
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-semibold">{user.recent_activity.medications}</span> meds
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-semibold">{user.recent_activity.assessments}</span> assessments
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-semibold">{user.patients_per_day}</span> patients/day
                                            </p>
                                            <p className="text-xs text-gray-500">{user.days_active} days active</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(user.total_cost_managed)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Report generated for Company ID: {report.company_id}</p>
                    <p className="mt-1">Total Cost Managed: <span className="font-semibold text-green-600">{formatCurrency(report.summary.total_cost_managed)}</span></p>
                </div>
            </div>
        </div>
    );
};

export default CompanyPerformanceReport;
