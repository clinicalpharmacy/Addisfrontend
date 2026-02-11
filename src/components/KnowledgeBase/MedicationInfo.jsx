import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaPills,
    FaSearch,
    FaPlus,
    FaExclamationTriangle,
    FaEdit,
    FaTrash,
    FaFileExport,
    FaSortAlphaDown,
    FaFilter,
    FaSpinner,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaNotesMedical,
    FaInfoCircle,
    FaBookMedical,
    FaSync,
    FaDatabase,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaBan,
    FaShieldAlt
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';


const MedicationInfo = () => {
    const context = useOutletContext();
    const { protectionEnabled, toggleProtection } = context || { protectionEnabled: true, toggleProtection: () => { } };
    const [medications, setMedications] = useState([]);
    const [filteredMedications, setFilteredMedications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editMedication, setEditMedication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [expandedMedication, setExpandedMedication] = useState(null);


    const [formData, setFormData] = useState({
        name: '',
        amharic_name: '',
        usage: '',
        administration_and_cautions: '',
        side_effects: '',
        storage: ''
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

    // FETCH MEDICATIONS FROM DATABASE
    const fetchMedications = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching medications from database...');

            const { data, error } = await supabase
                .from('medication_information')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Fetched medications:', data);

            if (data && data.length > 0) {
                setMedications(data);
                setFilteredMedications(data);
            } else {
                console.log('No medications found in database');
                setMedications([]);
                setFilteredMedications([]);
            }
        } catch (err) {
            console.error('Error fetching medications:', err);
            setError('Failed to load medications. Please try again.');
            setMedications([]);
            setFilteredMedications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedications();
    }, []);

    useEffect(() => {
        handleSearchAndFilter();
    }, [medications, searchTerm]);

    const handleSearchAndFilter = () => {
        let filtered = medications;

        // Apply search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(med =>
                (med.name && med.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (med.amharic_name && med.amharic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (med.usage && med.usage.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (med.side_effects && med.side_effects.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredMedications(filtered);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };




    // ADD MEDICATION TO DATABASE - ADMIN ONLY
    const handleAddMedication = async () => {
        if (!isAdmin) {
            setError('Only administrators can add medications');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter a medication name');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Saving medication:', formData);

            const { data, error } = await supabase
                .from('medication_information')
                .insert([{
                    name: formData.name,
                    amharic_name: formData.amharic_name,
                    usage: formData.usage,
                    administration_and_cautions: formData.administration_and_cautions,
                    side_effects: formData.side_effects,
                    storage: formData.storage,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Medication saved:', data);

            setSuccessMessage('Medication added successfully!');

            // Reset form
            setFormData({
                name: '',
                amharic_name: '',
                usage: '',
                administration_and_cautions: '',
                side_effects: '',
                storage: ''
            });

            setShowAddForm(false);

            // Refresh medication list
            setTimeout(() => {
                fetchMedications();
            }, 1000);

        } catch (err) {
            console.error('Error saving medication:', err);
            setError(`Failed to save medication: ${err.message} `);
        } finally {
            setSaving(false);
        }
    };

    // EDIT MEDICATION - ADMIN ONLY
    const handleEditMedication = (medication) => {
        if (!isAdmin) {
            setError('Only administrators can edit medications');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditingMedication(medication);
        setFormData({
            name: medication.name || '',
            amharic_name: medication.amharic_name || '',
            usage: medication.usage || '',
            administration_and_cautions: medication.administration_and_cautions || '',
            side_effects: medication.side_effects || '',
            storage: medication.storage || ''
        });
        setShowAddForm(true);
    };

    // UPDATE MEDICATION IN DATABASE - ADMIN ONLY
    const handleUpdateMedication = async () => {
        if (!isAdmin) {
            setError('Only administrators can update medications');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter a medication name');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Updating medication:', editingMedication.id, formData);

            const { data, error } = await supabase
                .from('medication_information')
                .update({
                    name: formData.name,
                    amharic_name: formData.amharic_name,
                    usage: formData.usage,
                    administration_and_cautions: formData.administration_and_cautions,
                    side_effects: formData.side_effects,
                    storage: formData.storage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingMedication.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Medication updated:', data);

            setSuccessMessage('Medication updated successfully!');

            // Reset form
            setFormData({
                name: '',
                amharic_name: '',
                usage: '',
                administration_and_cautions: '',
                side_effects: '',
                storage: ''
            });

            setShowAddForm(false);
            setEditingMedication(null);

            // Refresh medication list
            setTimeout(() => {
                fetchMedications();
            }, 1000);

        } catch (err) {
            console.error('Error updating medication:', err);
            setError(`Failed to update medication: ${err.message} `);
        } finally {
            setSaving(false);
        }
    };

    // REMOVED: handleExportData function - No export functionality

    // Initialize database if empty - ADMIN ONLY
    const initializeDatabase = async () => {
        if (!isAdmin) {
            setError('Only administrators can initialize the database');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('This will insert sample medications into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const sampleMedications = [
                {
                    name: 'Amoxicillin',
                    amharic_name: 'አሞክሲሲሊን',
                    usage: 'Bacterial infections: otitis media, pneumonia, UTIs',
                    administration_and_cautions: 'Taken orally',
                    side_effects: 'Diarrhea, nausea, rash',
                    storage: 'Store at room temperature'
                }
            ];

            const { data, error } = await supabase
                .from('medication_information')
                .insert(sampleMedications)
                .select();

            if (error) throw error;

            setSuccessMessage('Sample medications added successfully!');
            fetchMedications();

        } catch (err) {
            console.error('Error initializing database:', err);
            setError('Failed to initialize database');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading medications...</p>
                </div>
            </div>
        );
    }

    // Convert textarea text to bullet list
    const renderBullets = (text) => {
        if (!text) return null;

        return text
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line, index) => (
                <li key={index}>{line}</li>
            ));
    };

    return (
        <div
            className="bg-gray-50 min-h-full pb-8"
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                <FaBookMedical className="text-indigo-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Medications</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    Drug information database with {medications.length} medications
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


                            {/* REMOVED: Export button */}
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={initializeDatabase}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        title="Add sample data"
                                    >
                                        <FaDatabase /> <span className="hidden sm:inline">Initialize DB</span>
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Add Med</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={fetchMedications}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                title="Refresh data"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaExclamationCircle className="flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage('')} className="text-green-800">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-800">
                            <FaTimes />
                        </button>
                    </div>
                )}



                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search medications..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                            />
                        </div>


                        {/* Admin-only add button */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add New Medication
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        <span>Showing {filteredMedications.length} of {medications.length} medications</span>
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}

                    </div>
                </div>

                {/* Add Medication Form Modal - ADMIN ONLY */}
                {showAddForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingMedication(null);
                                            setFormData({
                                                name: '',
                                                amharic_name: '',
                                                usage: '',
                                                administration_and_cautions: '',
                                                side_effects: '',
                                                storage: ''
                                            });
                                        }}
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
                                                Medication Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g., Paracetamol"
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Amharic Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.amharic_name}
                                                onChange={(e) => setFormData({ ...formData, amharic_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g., ፓራሲታሞል"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Usage / Indications *
                                        </label>
                                        <textarea
                                            value={formData.usage}
                                            onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                                            rows="3"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="What is this medication used for?"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Administration and Cautions
                                            </label>
                                            <textarea
                                                value={formData.administration_and_cautions}
                                                onChange={(e) => setFormData({ ...formData, administration_and_cautions: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Administration and precautions..."
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Side Effects
                                            </label>
                                            <textarea
                                                value={formData.side_effects}
                                                onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="side effects..."
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Storage Instructions
                                        </label>
                                        <textarea
                                            value={formData.storage}
                                            onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="How to store the medication..."
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={editingMedication ? handleUpdateMedication : handleAddMedication}
                                        disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                {editingMedication ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingMedication ? <FaEdit /> : <FaPlus />}
                                                {editingMedication ? 'Update Medication' : 'Add Medication'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingMedication(null);
                                            setFormData({
                                                name: '',
                                                amharic_name: '',
                                                usage: '',
                                                administration_and_cautions: '',
                                                side_effects: '',
                                                storage: ''
                                            });
                                        }}
                                        disabled={saving}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Medications Grid - ALL CONTENT VISIBLE but protected from copying */}
                {filteredMedications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMedications.map((med) => (
                            <div
                                key={med.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200 medication-content"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">{med.name}</h3>
                                            {med.amharic_name && (
                                                <p className="text-sm text-gray-600 mb-1">{med.amharic_name}</p>
                                            )}
                                        </div>
                                        {/* Only show edit button for admins */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditMedication(med)}
                                                    className="text-indigo-600 hover:text-indigo-800 p-1"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expandable Details */}
                                    <div className="border-t pt-4">
                                        <button
                                            onClick={() => setExpandedMedication(expandedMedication === med.id ? null : med.id)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-2"
                                        >
                                            {expandedMedication === med.id ? (
                                                <>
                                                    <FaEyeSlash /> Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <FaEye /> Show Details
                                                </>
                                            )}
                                        </button>

                                        {expandedMedication === med.id && (
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">የመድሃኒቱ ጥቅም:</h4>
                                                    <ul className="list-disc pl-5 text-sm text-gray-600">{renderBullets(med.usage)}</ul>
                                                </div>

                                                {med.administration_and_cautions && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">አወሳሰድ እና ጥንቃቄዎች:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-600">{renderBullets(med.administration_and_cautions)}</ul>
                                                    </div>
                                                )}

                                                {med.side_effects && (
                                                    <div>
                                                        <h4 className="font-semibold text-orange-700 mb-2 text-sm">የጎንዮሽ ጉዳቶች:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-600">{renderBullets(med.side_effects)}</ul>
                                                    </div>
                                                )}

                                                {med.storage && (
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 mb-2 text-sm">አቀማመጥ:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-600">{renderBullets(med.storage)}</ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                        <FaPills className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Medications Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {searchTerm
                                ? 'No medications match your search criteria. Try a different search or filter.'
                                : 'No medications found in the database.'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                            >
                                Clear Filters
                            </button>
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Medication
                                    </button>
                                    <button
                                        onClick={initializeDatabase}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaDatabase /> Add Sample Data
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Summary Footer */}
                {filteredMedications.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{medications.length}</div>
                                <div className="text-sm text-gray-600">Total Medications</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {medications.filter(m => m.side_effects).length}
                                </div>
                                <div className="text-sm text-gray-600">With Side Effects Info</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {medications.filter(m => m.amharic_name).length}
                                </div>
                                <div className="text-sm text-gray-600">With Amharic Name</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{filteredMedications.length}</div>
                                <div className="text-sm text-gray-600">Currently Filtered</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            {isAdmin
                                ? 'Administrator Mode - Full access'
                                : `User Mode - View only(${protectionEnabled ? 'Copy/Print disabled' : 'Copy allowed'})`}
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
            </div>
        </div>
    );
};

export default MedicationInfo;
