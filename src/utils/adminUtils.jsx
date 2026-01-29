import React from 'react';
import {
    FaUserLock, FaFileAlt, FaEdit, FaTrash, FaCogs,
    FaUserCheck, FaUserTimes, FaChartLine, FaFileInvoice,
    FaUserInjured, FaHistory
} from 'react-icons/fa';

// Format date helper
export const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
    } catch {
        return 'Invalid date';
    }
};

// Activity Icon Helper
export const getActivityIcon = (actionType) => {
    switch (actionType) {
        case 'login': return <FaUserLock className="text-green-500 text-lg" />;
        case 'create': return <FaFileAlt className="text-blue-500 text-lg" />;
        case 'update': return <FaEdit className="text-yellow-500 text-lg" />;
        case 'delete': return <FaTrash className="text-red-500 text-lg" />;
        case 'system': return <FaCogs className="text-purple-500 text-lg" />;
        case 'approval': return <FaUserCheck className="text-green-500 text-lg" />;
        case 'approve_user': return <FaUserCheck className="text-green-500 text-lg" />;
        case 'reject_user': return <FaUserTimes className="text-red-500 text-lg" />;
        case 'view_dashboard': return <FaChartLine className="text-blue-500 text-lg" />;
        case 'payment': return <FaFileInvoice className="text-green-500 text-lg" />;
        case 'subscription': return <FaFileInvoice className="text-blue-500 text-lg" />;
        case 'patient_create': return <FaUserInjured className="text-blue-500 text-lg" />;
        case 'patient_update': return <FaUserInjured className="text-yellow-500 text-lg" />;
        default: return <FaHistory className="text-gray-500 text-lg" />;
    }
};

// Status Badge Helper
export const getStatusBadge = (approved, role) => {
    if (role === 'admin') {
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Admin</span>;
    }
    return approved ?
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Approved</span> :
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pending</span>;
};

// Role Badge Helper
export const getRoleBadge = (role) => {
    switch (role) {
        case 'admin': return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Admin</span>;
        case 'pharmacist': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Pharmacist</span>;
        case 'company_admin': return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Company Admin</span>;
        default: return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{role}</span>;
    }
};

// Patient Status Badge Helper
export const getPatientStatusBadge = (is_active) => {
    return is_active ?
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span> :
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Inactive</span>;
};

// Gender Badge Helper
export const getGenderBadge = (gender) => {
    switch (gender) {
        case 'male': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Male</span>;
        case 'female': return <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded">Female</span>;
        case 'other': return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Other</span>;
        default: return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Unknown</span>;
    }
};

// Medication Class Color Helper
export const getMedicationClassColor = (medClass) => {
    const classColors = {
        'Antibiotic': 'bg-blue-100 text-blue-800',
        'Antidiabetic': 'bg-green-100 text-green-800',
        'Antihyperlipidemic': 'bg-purple-100 text-purple-800',
        'Antihypertensive': 'bg-red-100 text-red-800',
        'Bronchodilator': 'bg-yellow-100 text-yellow-800',
        'Analgesic': 'bg-orange-100 text-orange-800',
        'Antidepressant': 'bg-indigo-100 text-indigo-800',
        'Anticoagulant': 'bg-pink-100 text-pink-800'
    };

    for (const [key, value] of Object.entries(classColors)) {
        if (medClass && medClass.includes(key)) {
            return value;
        }
    }
    return 'bg-gray-100 text-gray-800';
};

// Pregnancy Category Color Helper
export const getPregnancyCategoryColor = (category) => {
    switch (category) {
        case 'A': return 'bg-green-100 text-green-800';
        case 'B': return 'bg-blue-100 text-blue-800';
        case 'C': return 'bg-yellow-100 text-yellow-800';
        case 'D': return 'bg-orange-100 text-orange-800';
        case 'X': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
