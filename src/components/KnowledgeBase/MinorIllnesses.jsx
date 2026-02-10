import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaThermometerHalf,
    FaPlus,
    FaSearch,
    FaStethoscope,
    FaCapsules,
    FaExclamationTriangle,
    FaUserMd,
    FaEdit,
    FaTrash,
    FaBookMedical,
    FaTimes,
    FaSync,
    FaLock,
    FaBan,
    FaEyeSlash,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaSpinner
} from 'react-icons/fa';

const MinorIllnesses = () => {
    const [illnesses, setIllnesses] = useState([]);
    const [filteredIllnesses, setFilteredIllnesses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editIllness, setEditIllness] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [protectionEnabled, setProtectionEnabled] = useState(true); // Protection ON by default
    const [formData, setFormData] = useState({
        name: '',
        amharic_name: '',
        assessment: '',
        referral: '',
        otc_drug: '',
        for_pharmacists: ''
    });


    // Check user role on component mount
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAdmin(parsedUser.role === 'admin');
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, []);

    useEffect(() => {
        fetchIllnesses();
    }, []);

    const fetchIllnesses = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('minor_illnesses')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                setIllnesses(data);
                setFilteredIllnesses(data);
            }
        } catch (err) {
            console.error('Error fetching illnesses:', err);
            setError('Failed to load illnesses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        let filtered = illnesses;

        if (term) {
            filtered = filtered.filter(illness =>
                illness.name.toLowerCase().includes(term.toLowerCase()) ||
                (illness.amharic_name && illness.amharic_name.toLowerCase().includes(term.toLowerCase())) ||
                (illness.assessment && illness.assessment.toLowerCase().includes(term.toLowerCase()))
            );
        }

        setFilteredIllnesses(filtered);
    };

    // Toggle protection (Admin only)
    const toggleProtection = () => {
        if (!isAdmin) {
            setError('Only administrators can modify protection settings.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setProtectionEnabled(!protectionEnabled);
        setSuccess(`Copy/Print Protection ${!protectionEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
    };

    // ADD/EDIT ILLNESS - ADMIN ONLY
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            setError('Only administrators can add or edit illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Basic validation
        if (!formData.name.trim()) {
            setError('Illness name is required');
            return;
        }

        if (!formData.assessment.trim()) {
            setError('How to assess the illness is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const illnessData = {
                name: formData.name.trim(),
                amharic_name: formData.amharic_name.trim() || '',
                assessment: formData.assessment.trim(),
                referral: formData.referral.trim() || '',
                otc_drug: formData.otc_drug.trim() || '',
                for_pharmacists: formData.for_pharmacists.trim() || '',
                updated_at: new Date().toISOString()
            };

            if (editIllness) {
                const { error } = await supabase
                    .from('minor_illnesses')
                    .update(illnessData)
                    .eq('id', editIllness.id);

                if (error) throw error;
                setSuccess('Illness updated successfully!');
            } else {
                const { error } = await supabase
                    .from('minor_illnesses')
                    .insert([{
                        ...illnessData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                setSuccess('Illness added successfully!');
            }

            fetchIllnesses();
            resetForm();

        } catch (err) {
            console.error('Error saving illness:', err);
            setError('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (illness) => {
        if (!isAdmin) {
            setError('Only administrators can edit illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditIllness(illness);
        setFormData({
            name: illness.name || '',
            amharic_name: illness.amharic_name || '',
            assessment: illness.assessment || '',
            referral: illness.referral || '',
            otc_drug: illness.otc_drug || '',
            for_pharmacists: illness.for_pharmacists || ''
        });
        setShowForm(true);
    };

    // DELETE ILLNESS - ADMIN ONLY
    const handleDelete = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this illness entry?')) return;

        try {
            const { error } = await supabase
                .from('minor_illnesses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccess('Illness deleted successfully!');
            fetchIllnesses();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting illness:', err);
            setError('Error: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amharic_name: '',
            assessment: '',
            referral: '',
            otc_drug: '',
            for_pharmacists: ''
        });
        setEditIllness(null);
        setShowForm(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
                    <p className="mt-3 text-gray-600">Loading illnesses...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-gray-50 min-h-full pb-8"
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                                <FaThermometerHalf className="text-red-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Minor Illnesses</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    Management guide for {illnesses.length} common illnesses
                                    {user?.role === 'company_admin' ? (
                                        <span className="ml-2 text-xs md:text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded inline-flex items-center">
                                            <FaLock className="mr-1" /> Admin View
                                        </span>
                                    ) : !isAdmin && (
                                        <span className="ml-2 text-xs md:text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded inline-flex items-center">
                                            <FaLock className="mr-1" /> View Only
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Protection Toggle - Admin only */}
                            {isAdmin && (
                                <button
                                    onClick={toggleProtection}
                                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${protectionEnabled
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    title={protectionEnabled ? 'Disable Copy/Print Protection' : 'Enable Copy/Print Protection'}
                                >
                                    {protectionEnabled ? <FaBan /> : <FaShieldAlt />}
                                    <span className="hidden sm:inline">{protectionEnabled ? 'Allow Copy' : 'No Copy'}</span>
                                </button>
                            )}
                            <button
                                onClick={fetchIllnesses}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
                            {/* Only show add button for admins */}
                            {isAdmin && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaPlus /> <span className="hidden sm:inline">Add Illness</span><span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle className="flex-shrink-0" />
                            <span className="font-medium">{success}</span>
                        </div>
                        <button onClick={() => setSuccess('')} className="text-green-800 hover:text-green-900">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
                            <FaTimes />
                        </button>
                    </div>
                )}


                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search illnesses..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm md:text-base"
                            />
                        </div>


                        {/* Only show add button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add Illness
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        <span>Showing {filteredIllnesses.length} of {illnesses.length} illnesses</span>
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}
                        {protectionEnabled && !isAdmin && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><FaLock size={10} /> Protected</span>}
                    </div>
                </div>


                {/* Illnesses Grid - ALL CONTENT VISIBLE but protected from copying */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {filteredIllnesses.length > 0 ? (
                        filteredIllnesses.map((illness) => (
                            <div
                                key={illness.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 illness-content"
                            >
                                <div className="p-3 md:p-6">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{illness.name}</h3>
                                            {illness.amharic_name && (
                                                <p className="text-xs md:text-sm text-gray-600 mb-2">{illness.amharic_name}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Only show edit/delete buttons for admins */}
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(illness)}
                                                        className="text-blue-500 hover:text-blue-700 p-1"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(illness.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Delete"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {illness.assessment && (
                                        <div className="mb-3 md:mb-4">
                                            <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                <FaStethoscope className="text-xs md:text-sm" /> How to Assess Minor Illnes:
                                            </h4>
                                            <p className="text-xs md:text-sm text-gray-600 whitespace-pre-line leading-relaxed">{illness.assessment}</p>
                                        </div>
                                    )}

                                    {illness.referral && (
                                        <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-50 border border-yellow-100 rounded">
                                            <h4 className="font-semibold text-yellow-700 mb-1 text-sm md:text-base">When to Refer:</h4>
                                            <p className="text-xs md:text-sm text-yellow-800 whitespace-pre-line leading-relaxed">{illness.referral}</p>
                                        </div>
                                    )}

                                    {illness.otc_drug && (
                                        <div className="mb-3 md:mb-4">
                                            <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                <FaCapsules className="text-xs md:text-sm" /> OTC Drug Recommendations:
                                            </h4>
                                            <p className="text-xs md:text-sm text-gray-600 whitespace-pre-line leading-relaxed">{illness.otc_drug}</p>
                                        </div>
                                    )}

                                    {illness.for_pharmacists && (
                                        <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 border border-blue-100 rounded">
                                            <h4 className="font-semibold text-blue-700 mb-1 flex items-center gap-1 text-sm md:text-base">
                                                <FaUserMd className="text-xs md:text-sm" /> Additional tips for the Pharmacist:
                                            </h4>
                                            <p className="text-xs md:text-sm text-blue-800 whitespace-pre-line leading-relaxed">{illness.for_pharmacists}</p>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                                        Last updated: {new Date(illness.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaBookMedical className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Illnesses Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm
                                    ? 'No illnesses match your search. Try a different term.'
                                    : 'No minor illnesses added yet.'}
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        handleSearch('');
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Clear Search
                                </button>
                                {/* Only show add button for admins */}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Illness
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                {filteredIllnesses.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{illnesses.length}</div>
                                <div className="text-sm text-gray-600">Total Illnesses</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {illnesses.filter(i => i.amharic_name).length}
                                </div>
                                <div className="text-sm text-gray-600">With Amharic Names</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {illnesses.filter(i => i.referral).length}
                                </div>
                                <div className="text-sm text-gray-600">With Folk Medicine</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{filteredIllnesses.length}</div>
                                <div className="text-sm text-gray-600">Currently Filtered</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            {isAdmin
                                ? 'Administrator Mode - Full access'
                                : `User Mode - View only (${protectionEnabled ? 'Copy/Print disabled' : 'Copy allowed'})`}
                            {isAdmin && (
                                <button
                                    onClick={toggleProtection}
                                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                    ({protectionEnabled ? 'No Copy Mode' : 'Copy Allowed'})
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Add/Edit Form Modal - ADMIN ONLY */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editIllness ? 'Edit Illness' : 'Add Illness'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                        disabled={saving}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Illness Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                                placeholder="e.g., Common Cold"
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Amharic Name (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.amharic_name}
                                                onChange={(e) => setFormData({ ...formData, amharic_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                                placeholder="እምቢልታ"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How to Assess  Minor Illness *
                                        </label>
                                        <textarea
                                            value={formData.assessment}
                                            onChange={(e) => {
                                            const value = e.target.value;
                                            // Add bullet at start if empty
                                            let newValue = value;
                                            if (!value.startsWith('• ')) newValue = '• ' + value;
                                            // Replace newlines with new bullet
                                            newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                            setFormData({ ...formData, assessment: newValue });
                                          }}
                                          rows="4"
                                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                          placeholder="Describe symptoms, signs, duration..."
                                          required
                                          disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            When to Refer
                                        </label>
                                        <textarea
                                            value={formData.referral}
                                            onChange={(e) => {
                                            const value = e.target.value;
                                            // Add bullet at start if empty
                                            let newValue = value;
                                            if (!value.startsWith('• ')) newValue = '• ' + value;
                                            // Replace newlines with new bullet
                                            newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                            setFormData({ ...formData, referral: newValue });
                                          }}
                                          rows="4"
                                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                          placeholder="Referral criterion to see a physician..."
                                          required
                                          disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            OTC Drug Recommendations
                                        </label>
                                        <textarea
                                            value={formData.otc_drug}
                                            onChange={(e) => {
                                            const value = e.target.value;
                                            // Add bullet at start if empty
                                            let newValue = value;
                                            if (!value.startsWith('• ')) newValue = '• ' + value;
                                            // Replace newlines with new bullet
                                            newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                            setFormData({ ...formData, otc_drug: newValue });
                                          }}
                                          rows="4"
                                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                          placeholder="Over-the-counter medications..."
                                          required
                                          disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional tips to the Pharmacist
                                        </label>
                                        <textarea
                                            value={formData.for_pharmacists}
                                            onChange={(e) => {
                                            const value = e.target.value;
                                            // Add bullet at start if empty
                                            let newValue = value;
                                            if (!value.startsWith('• ')) newValue = '• ' + value;
                                            // Replace newlines with new bullet
                                            newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                            setFormData({ ...formData, for_pharmacists: newValue });
                                          }}
                                          rows="4"
                                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                          placeholder="Professional advice for pharmacists..."
                                          required
                                          disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                {editIllness ? 'Update Illness' : 'Add Illness'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={saving}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default MinorIllnesses;
