import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaPills,
    FaSearch,
    FaBookMedical,
    FaExclamationTriangle,
    FaCapsules,
    FaPlus,
    FaTimes,
    FaTrash,
    FaEye,
    FaEyeSlash,
    FaDatabase,
    FaSpinner,
    FaExclamationCircle,
    FaSync,
    FaLock,
    FaShieldAlt,
    FaBan
} from 'react-icons/fa';

const MedicationInfo = () => {
    const [medications, setMedications] = useState([]);
    const [filteredMedications, setFilteredMedications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDrugClass, setSelectedDrugClass] = useState('all');
    const [expandedMedication, setExpandedMedication] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [protectionEnabled, setProtectionEnabled] = useState(true); // Protection ON by default

    const [formData, setFormData] = useState({
        name: '',
        amharic_name: '',
        usage: '',
        before_taking: '',
        while_taking: '',
        side_effects: '',
        serious_side_effects: '',
        how_to_take: '',
        missed_dose: '',
        storage: ''
    });

    // Protection functions - users CAN SEE but CANNOT COPY
    const disableCopyPaste = (e) => {
        if (protectionEnabled && !isAdmin) {
            e.preventDefault();
            setError('Copying content is disabled. You can view but not copy this information.');
            setTimeout(() => setError(''), 3000);
            return false;
        }
    };

    const disableRightClick = (e) => {
        if (protectionEnabled && !isAdmin) {
            e.preventDefault();
            setError('Right-click is disabled to prevent copying of proprietary information.');
            setTimeout(() => setError(''), 3000);
            return false;
        }
    };

    const disableTextSelection = () => {
        if (protectionEnabled && !isAdmin) {
            return {
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                cursor: 'default'
            };
        }
        return {};
    };

    const disableKeyboardShortcuts = (e) => {
        if (protectionEnabled && !isAdmin) {
            // Disable copy shortcuts only
            const copyKeys = ['c', 'C', 'a', 'A', 'x', 'X'];
            if ((e.ctrlKey || e.metaKey) && copyKeys.includes(e.key)) {
                e.preventDefault();
                setError('Copying is disabled. You can view but not copy this information.');
                setTimeout(() => setError(''), 3000);
                return false;
            }

            // Disable print shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                setError('Printing is disabled. You can view but not print this information.');
                setTimeout(() => setError(''), 3000);
                return false;
            }

            if (e.key === 'PrintScreen' || e.key === 'F12') {
                e.preventDefault();
                setError('Screenshots are disabled to protect proprietary information.');
                setTimeout(() => setError(''), 3000);
                return false;
            }
        }
    };

    // Add CSS to prevent text selection while allowing visibility
    useEffect(() => {
        if (protectionEnabled && !isAdmin) {
            const style = document.createElement('style');
            style.id = 'prevent-copy-medications';
            style.innerHTML = `
                .medication-content {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                .medication-content::selection {
                    background: transparent !important;
                }
                .medication-content::-moz-selection {
                    background: transparent !important;
                }
            `;
            document.head.appendChild(style);

            return () => {
                const styleEl = document.getElementById('prevent-copy-medications');
                if (styleEl) {
                    document.head.removeChild(styleEl);
                }
            };
        }
    }, [protectionEnabled, isAdmin]);

    // Prevent printing
    useEffect(() => {
        if (protectionEnabled && !isAdmin) {
            // Override window.print
            const originalPrint = window.print;
            window.print = () => {
                setError('Printing of this content is disabled. You can view but not print the information.');
                setTimeout(() => setError(''), 3000);
                return false;
            };

            // Add beforeprint event listener
            const handleBeforePrint = (e) => {
                setError('Printing of this content is disabled. You can view but not print the information.');
                setTimeout(() => setError(''), 3000);
                e.preventDefault();
                return false;
            };

            window.addEventListener('beforeprint', handleBeforePrint);

            return () => {
                window.removeEventListener('beforeprint', handleBeforePrint);
                window.print = originalPrint;
            };
        }
    }, [protectionEnabled, isAdmin]);

    // Add global event listeners for protection
    useEffect(() => {
        if (protectionEnabled && !isAdmin) {
            const handleContextMenu = (e) => disableRightClick(e);
            const handleKeyDown = (e) => disableKeyboardShortcuts(e);
            const handleCopy = (e) => {
                if (!isAdmin) {
                    e.preventDefault();
                    return false;
                }
            };
            const handleCut = (e) => {
                if (!isAdmin) {
                    e.preventDefault();
                    return false;
                }
            };

            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('copy', handleCopy);
            document.addEventListener('cut', handleCut);

            return () => {
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('copy', handleCopy);
                document.removeEventListener('cut', handleCut);
            };
        }
    }, [protectionEnabled, isAdmin]);

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
    }, [medications, searchTerm, selectedDrugClass]);

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

        // Apply drug class filter
        if (selectedDrugClass !== 'all') {
            filtered = filtered.filter(med => med.category === selectedDrugClass);
        }

        setFilteredMedications(filtered);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDrugClassChange = (e) => {
        setSelectedDrugClass(e.target.value);
    };

    // Toggle protection (Admin only)
    const toggleProtection = () => {
        if (!isAdmin) {
            setError('Only administrators can modify protection settings.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setProtectionEnabled(!protectionEnabled);
        setSuccessMessage(`Copy/Print Protection ${!protectionEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
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
                    before_taking: formData.before_taking,
                    while_taking: formData.while_taking,
                    side_effects: formData.side_effects,
                    serious_side_effects: formData.serious_side_effects,
                    how_to_take: formData.how_to_take,
                    missed_dose: formData.missed_dose,
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
                before_taking: '',
                while_taking: '',
                side_effects: '',
                serious_side_effects: '',
                how_to_take: '',
                missed_dose: '',
                storage: ''
            });

            setShowAddForm(false);

            // Refresh medication list
            setTimeout(() => {
                fetchMedications();
            }, 1000);

        } catch (err) {
            console.error('Error saving medication:', err);
            setError(`Failed to save medication: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // DELETE MEDICATION FROM DATABASE - ADMIN ONLY
    const handleDeleteMedication = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete medications');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this medication?')) {
            return;
        }

        try {
            console.log('Deleting medication with ID:', id);

            const { error } = await supabase
                .from('medication_information')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            console.log('Medication deleted');

            setSuccessMessage('Medication deleted successfully!');

            // Remove from local state
            const updatedMedications = medications.filter(med => med.id !== id);
            setMedications(updatedMedications);

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);

        } catch (err) {
            console.error('Error deleting medication:', err);
            setError(`Failed to delete medication: ${err.message}`);
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
                    name: 'Paracetamol',
                    amharic_name: 'ፓራሲታሞል',
                    usage: 'For pain and fever relief',
                    before_taking: 'Tell your doctor if you have liver problems',
                    while_taking: 'Do not exceed recommended dose',
                    side_effects: 'Nausea, stomach pain',
                    serious_side_effects: 'Liver damage with overdose',
                    how_to_take: 'Take with water',
                    missed_dose: 'Take as soon as you remember',
                    storage: 'Store at room temperature'
                },
                {
                    name: 'Metformin',
                    amharic_name: 'ሜትፎርሚን',
                    usage: 'For type 2 diabetes',
                    before_taking: 'Check kidney function before starting',
                    while_taking: 'Monitor blood sugar levels',
                    side_effects: 'Nausea, diarrhea',
                    serious_side_effects: 'Lactic acidosis',
                    how_to_take: 'Take with meals',
                    missed_dose: 'Take as soon as remembered',
                    storage: 'Store at room temperature'
                },
                {
                    name: 'Amoxicillin',
                    amharic_name: 'አሞክሲሲሊን',
                    usage: 'Bacterial infections: otitis media, pneumonia, UTIs',
                    before_taking: 'Hypersensitivity to penicillins',
                    while_taking: 'Complete full course',
                    side_effects: 'Diarrhea, nausea, rash',
                    serious_side_effects: 'Allergic reactions',
                    how_to_take: 'Take with food',
                    missed_dose: 'Take as soon as you remember',
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

    return (
        <div
            className="min-h-screen bg-gray-50"
            onCopy={disableCopyPaste}
            onCut={disableCopyPaste}
            onPaste={disableCopyPaste}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <FaBookMedical className="text-indigo-600 text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Medication Knowledge Base</h1>
                                <p className="text-gray-600 mt-1">
                                    Drug information database with {medications.length} medications
                                    {user?.role === 'company_admin' ? (
                                        <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            <FaLock className="inline mr-1" /> Company Admin - View Only
                                        </span>
                                    ) : !isAdmin && (
                                        <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                            <FaLock className="inline mr-1" /> View Only
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Protection Toggle - Admin only */}
                            {isAdmin && (
                                <button
                                    onClick={toggleProtection}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${protectionEnabled
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    title={protectionEnabled ? 'Disable Copy/Print Protection' : 'Enable Copy/Print Protection'}
                                >
                                    {protectionEnabled ? <FaBan /> : <FaShieldAlt />}
                                    {protectionEnabled ? 'Allow Copy' : 'No Copy'}
                                </button>
                            )}
                            {/* REMOVED: Export button */}
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={initializeDatabase}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        title="Add sample data"
                                    >
                                        <FaDatabase /> Initialize DB
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> Add Medication
                                    </button>
                                </>
                            )}
                            <button
                                onClick={fetchMedications}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                title="Refresh data"
                            >
                                <FaSync /> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaExclamationCircle />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage('')} className="text-green-800">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-800">
                            <FaTimes />
                        </button>
                    </div>
                )}



                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search medications..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                onCopy={disableCopyPaste}
                                onCut={disableCopyPaste}
                                onPaste={disableCopyPaste}
                            />
                        </div>


                        {/* Admin-only add button */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add New Medication
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredMedications.length} of {medications.length} medications
                        {!isAdmin && ' (Read-only mode)'}
                        {protectionEnabled && !isAdmin && ' • Copy/Print disabled'}
                    </div>
                </div>

                {/* Add Medication Form Modal - ADMIN ONLY */}
                {showAddForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Add New Medication</h2>
                                    <button
                                        onClick={() => setShowAddForm(false)}
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
                                                Before Taking
                                            </label>
                                            <textarea
                                                value={formData.before_taking}
                                                onChange={(e) => setFormData({ ...formData, before_taking: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Precautions before taking..."
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                While Taking
                                            </label>
                                            <textarea
                                                value={formData.while_taking}
                                                onChange={(e) => setFormData({ ...formData, while_taking: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Precautions during treatment..."
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Common Side Effects
                                            </label>
                                            <textarea
                                                value={formData.side_effects}
                                                onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Common side effects..."
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Serious Side Effects
                                            </label>
                                            <textarea
                                                value={formData.serious_side_effects}
                                                onChange={(e) => setFormData({ ...formData, serious_side_effects: e.target.value })}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Serious side effects requiring medical attention..."
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How to Take
                                        </label>
                                        <textarea
                                            value={formData.how_to_take}
                                            onChange={(e) => setFormData({ ...formData, how_to_take: e.target.value })}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Instructions for taking the medication..."
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Missed Dose Instructions
                                            </label>
                                            <textarea
                                                value={formData.missed_dose}
                                                onChange={(e) => setFormData({ ...formData, missed_dose: e.target.value })}
                                                rows="2"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="What to do if a dose is missed..."
                                                disabled={saving}
                                            />
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
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={handleAddMedication}
                                        disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaPlus /> Add Medication
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
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
                                onCopy={disableCopyPaste}
                                onCut={disableCopyPaste}
                                onPaste={disableCopyPaste}
                                onContextMenu={disableRightClick}
                                style={disableTextSelection()}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">{med.name}</h3>
                                            {med.amharic_name && (
                                                <p className="text-sm text-gray-600 mb-1">በአማርኛ: {med.amharic_name}</p>
                                            )}
                                        </div>
                                        {/* Only show delete button for admins */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDeleteMedication(med.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-700 text-sm line-clamp-2">
                                            <span className="font-medium">Usage:</span> {med.usage || 'No usage information'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-sm text-gray-500">
                                            {med.storage && (
                                                <span className="flex items-center gap-1">
                                                    Storage: {med.storage}
                                                </span>
                                            )}
                                        </div>
                                        <FaCapsules className="text-gray-400" />
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
                                                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">ይህ መድሃኒት ለምን ጥቅም ላይ ይውላል?:</h4>
                                                    <p className="text-sm text-gray-600">{med.usage}</p>
                                                </div>

                                                {med.before_taking && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">ይህንን መድሃኒት ከመውሰዴ በፊት ለዶክተሬ ምን መንገር አለብኝ?:</h4>
                                                        <p className="text-sm text-gray-600">{med.before_taking}</p>
                                                    </div>
                                                )}

                                                {med.while_taking && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">ይህን መድሃኒት በምወስድበት ጊዜ ማወቅ ወይም ማድረግ ያለብኝ አንዳንድ ነገሮች ምንድን ናቸው?:</h4>
                                                        <p className="text-sm text-gray-600">{med.while_taking}</p>
                                                    </div>
                                                )}

                                                {med.side_effects && (
                                                    <div>
                                                        <h4 className="font-semibold text-orange-700 mb-2 text-sm">የዚህ መድሃኒት አንዳንድ የጎንዮሽ ጉዳቶች ምንድናቸው?:</h4>
                                                        <p className="text-sm text-gray-600">{med.side_effects}</p>
                                                    </div>
                                                )}

                                                {med.serious_side_effects && (
                                                    <div>
                                                        <h4 className="font-semibold text-red-700 mb-2 text-sm">ወዲያውኑ ለሐኪሜ ማሳወቅ ያለብኝ አንዳንድ የጎንዮሽ ጉዳቶች ምንድን ናቸው?:</h4>
                                                        <p className="text-sm text-gray-600">{med.serious_side_effects}</p>
                                                    </div>
                                                )}

                                                {med.how_to_take && (
                                                    <div>
                                                        <h4 className="font-semibold text-blue-700 mb-2 text-sm">ይህ መድሃኒት እንዴት ይወሰዳል?:</h4>
                                                        <p className="text-sm text-gray-600">{med.how_to_take}</p>
                                                    </div>
                                                )}

                                                {med.missed_dose && (
                                                    <div>
                                                        <h4 className="font-semibold text-purple-700 mb-2 text-sm">መድሃኒቱን ሳልወሰድ ሰዓቱ ካለፈ ምን ማድረግ አለብኝ?:</h4>
                                                        <p className="text-sm text-gray-600">{med.missed_dose}</p>
                                                    </div>
                                                )}

                                                {med.storage && (
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 mb-2 text-sm">ይህንን መድሃኒት እንዴት ማስቀመጥ እችላለሁ?:</h4>
                                                        <p className="text-sm text-gray-600">{med.storage}</p>
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
                            {searchTerm || selectedDrugClass !== 'all'
                                ? 'No medications match your search criteria. Try a different search or filter.'
                                : 'No medications found in the database.'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedDrugClass('all');
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
            </div>
        </div>
    );
};

export default MedicationInfo;
