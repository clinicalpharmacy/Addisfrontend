import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
<<<<<<< HEAD
    FaMortarPestle,
=======
    FaVial,
    FaPlus,
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
    FaSearch,
    FaPlus,
    FaEdit,
<<<<<<< HEAD
    FaTrash,
    FaVial,
    FaPrescriptionBottle,
    FaClock,
    FaTemperatureLow,
    FaExclamationTriangle,
=======
    FaSpinner,
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
    FaCheckCircle,
    FaTimes,
    FaSync,
    FaLock,
<<<<<<< HEAD
    FaSpinner,
    FaBookOpen,
    FaShieldAlt,
    FaTag
=======
    FaBan,
    FaEyeSlash,
    FaShieldAlt,
    FaChevronDown,
    FaChevronUp
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';

const ExtemporaneousPrep = () => {
    const context = useOutletContext();
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });
    const protectionMsg = useScreenshotProtection(protectionEnabled);

    const [preparations, setPreparations] = useState([]);
    const [filteredPreparations, setFilteredPreparations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editPrep, setEditPrep] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
<<<<<<< HEAD
=======
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [expandedCards, setExpandedCards] = useState({});
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342

    const [formData, setFormData] = useState({
        formula_name: '',
        materials: '',
        preparation_steps: '',
        label_instructions: '',
        storage_info: '',
        stability_info: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAdmin(parsedUser.role === 'admin' || parsedUser.role === 'company_admin');
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, []);

    useEffect(() => {
        fetchPreparations();
    }, []);

    const fetchPreparations = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .select('*')
                .order('formula_name');

            if (error) throw error;

            if (data) {
                setPreparations(data);
                setFilteredPreparations(data);
            }
        } catch (err) {
            console.error('❌ Error fetching preparations (Full Detail):', JSON.stringify(err, null, 2));
            if (err.code === '42P01') {
                setError('Table not found. Please run the SQL migration script.');
            } else {
                setError(err.message || 'Failed to load preparations.');
            }
            setPreparations([]);
            setFilteredPreparations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setFilteredPreparations(preparations);
            return;
        }

        const filtered = preparations.filter(prep =>
            prep.formula_name?.toLowerCase().includes(term.toLowerCase()) ||
            prep.materials?.toLowerCase().includes(term.toLowerCase()) ||
            prep.preparation_steps?.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredPreparations(filtered);
    };

<<<<<<< HEAD
=======
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Toggle card expansion when clicking on name
    const toggleCard = (prepId) => {
        setExpandedCards(prev => ({
            ...prev,
            [prepId]: !prev[prepId]
        }));
    };

    // SAVE PREPARATION - ADMIN ONLY
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!formData.formula_name.trim() || !formData.materials.trim() || !formData.preparation_steps.trim()) {
            setError('Formula, Materials and Preparation are required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const prepData = {
                formula_name: formData.formula_name.trim(),
                materials: formData.materials.trim(),
                preparation_steps: formData.preparation_steps.trim(),
                label_instructions: formData.label_instructions.trim(),
                storage_info: formData.storage_info.trim(),
                stability_info: formData.stability_info.trim()
            };

            if (editPrep) {
                const { error } = await supabase
                    .from('extemporaneous_preparations')
                    .update(prepData)
                    .eq('id', editPrep.id);
                if (error) throw error;
                setSuccess('Preparation updated successfully');
            } else {
                const { error } = await supabase
                    .from('extemporaneous_preparations')
                    .insert([prepData]);
                if (error) throw error;
                setSuccess('Preparation added successfully');
            }

            fetchPreparations();
            resetForm();
        } catch (err) {
            console.error('❌ Error saving preparation (Full Detail):', JSON.stringify(err, null, 2));
            setError(err.message || 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

<<<<<<< HEAD
    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('Are you sure you want to delete this formula?')) return;

        try {
            const { error } = await supabase
                .from('extemporaneous_preparations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSuccess('Formula deleted.');
            fetchPreparations();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (prep) => {
        setEditPrep(prep);
        setFormData({
            formula_name: prep.formula_name || prep.name || '',
            materials: prep.materials || prep.ingredients || '',
            preparation_steps: prep.preparation_steps || prep.instructions || '',
            label_instructions: prep.label_instructions || '',
            storage_info: prep.storage_info || prep.storage || '',
            stability_info: prep.stability_info || prep.stability || ''
        });
        setShowForm(true);
=======
    // EDIT PREPARATION - ADMIN ONLY
    const handleEdit = (prep) => {
        if (!isAdmin) {
            alert('Only administrators can edit preparations');
            return;
        }

        setEditPrep(prep);
        setFormData({
            name: prep.name || '',
            use: prep.use || '',
            formula: prep.formula || '',
            materials: prep.materials || '',
            preparation: prep.preparation || '',
            label: prep.label || ''
        });
        setShowForm(true);
    };

    // ADD SAMPLE DATA - ADMIN ONLY
    const initializeSampleData = async () => {
        if (!isAdmin) {
            alert('Only administrators can initialize sample data');
            return;
        }

        if (!window.confirm('Add sample extemporaneous preparations?')) return;

        setLoading(true);
        try {
            const samplePreparations = [
                {
                    name: 'Amoxicillin Oral Suspension 250mg/5mL',
                    use: 'Pediatric bacterial infections',
                    formula: 'Amoxicillin trihydrate: 5g\nPurified water: qs to 100mL\nPreservative: 0.1%\nFlavor: Raspberry',
                    materials: 'Scale, mortar, bottle, water',
                    preparation: '1. Weigh ingredients\n2. Mix in mortar\n3. Transfer to bottle\n4. Add water to volume\n5. Shake well',
                    label: 'Shake before use\nRefrigerate\nUse within 14 days'
                },
                {
                    name: 'Calamine Lotion',
                    use: 'Skin irritations and itching',
                    formula: 'Calamine: 8g\nZinc oxide: 8g\nGlycerin: 2mL\nBase: qs to 100mL',
                    materials: 'Powders, glycerin, mixing equipment',
                    preparation: '1. Mix dry powders\n2. Add glycerin to make paste\n3. Gradually add base\n4. Mix until smooth',
                    label: 'For external use only\nApply to affected area\nStore at room temp'
                }
            ];

            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .insert(samplePreparations)
                .select();

            if (error) throw error;

            setSuccess('Sample preparations added!');
            fetchPreparations();

        } catch (err) {
            console.error('Error adding sample data:', err);
            setError(`Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
    };

    const resetForm = () => {
        setFormData({
            formula_name: '',
            materials: '',
            preparation_steps: '',
            label_instructions: '',
            storage_info: '',
            stability_info: ''
        });
        setEditPrep(null);
        setShowForm(false);
        setError('');
    };

    const renderBullets = (text) => {
        if (!text) return null;
        return text.split('\n').filter(line => line.trim()).map((line, idx) => (
            <li key={idx} className="mb-1">{line}</li>
        ));
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <FaSpinner className="animate-spin text-4xl text-purple-600" />
        </div>
    );

    return (
<<<<<<< HEAD
        <div className="bg-gray-50 min-h-full pb-8">
            {protectionMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                        <FaShieldAlt className="text-xl" />
                        <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
=======
        <div
            className="bg-gray-50 min-h-full pb-8"
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                <FaVial className="text-indigo-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">Compounding</h1>
                                <p className="text-gray-600 text-sm md:text-base mt-1">
                                    {preparations.length} formulas • Last updated: {new Date().toLocaleDateString()}
                                    {isAdmin && (
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
                                            Admin
                                        </span>
                                    )}
                                    {user?.role === 'company_admin' && (
                                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
                                            <FaLock className="mr-1" /> Admin View
                                        </span>
                                    )}
                                    {!isAdmin && user?.role !== 'company_admin' && (
                                        <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
                                            <FaLock className="mr-1" /> View Only
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Protection Toggle - Admin only */}

                            <button
                                onClick={fetchPreparations}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={initializeSampleData}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Samples</span>
                                    </button>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">New Prep</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                        </div>
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <FaMortarPestle className="text-purple-600 text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Extemporaneous Preparations</h1>
                                <p className="text-gray-600 text-sm">Compounding formulas for clinical use</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchPreparations} className="p-2 text-gray-400 hover:text-purple-600 transition"><FaSync /></button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-md"
                                >
                                    <FaPlus /> Add New Formula
                                </button>
                            )}
                        </div>
                    </div>
                </div>

<<<<<<< HEAD
                {/* Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2"><FaCheckCircle /> {success}</div>
                        <button onClick={() => setSuccess('')}><FaTimes /></button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2"><FaExclamationTriangle /> {error}</div>
                        <button onClick={() => setError('')}><FaTimes /></button>
=======
                {/* Preparations Grid - ALL CONTENT VISIBLE but protected from copying */}
                {filteredPreparations.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPreparations.map((prep) => (
                                <div
                                    key={prep.id}
                                    className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-shadow duration-200 prep-content"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Clickable name section */}
                                        <div
                                            className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                            onClick={() => toggleCard(prep.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-gray-800 mb-1">
                                                    {prep.name || 'Unnamed'}
                                                </h3>
                                                {expandedCards[prep.id] ?
                                                    <FaChevronUp className="text-gray-500 text-sm" /> :
                                                    <FaChevronDown className="text-gray-500 text-sm" />
                                                }
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isAdmin ? (
                                                <button
                                                    onClick={() => handleEdit(prep)}
                                                    className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-500">
                                                    <FaLock className="inline mr-1" /> View Only
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* All content sections - only shown when card is expanded */}
                                    {expandedCards[prep.id] && (
                                        <>
                                            {prep.use && (
                                                <>
                                                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Use:</h4>
                                                    <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">{renderBullets(prep.use)}</ul>
                                                </>
                                            )}

                                            <div className="space-y-3 mb-4">
                                                {prep.formula && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1 text-sm">Formula:</h4>
                                                        <div className="p-2 bg-gray-50 rounded">
                                                            <ul className="list-disc pl-5 text-sm text-gray-700">{renderBullets(prep.formula)}</ul>
                                                        </div>
                                                    </div>
                                                )}

                                                {prep.materials && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1 text-sm">Materials:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-700">{renderBullets(prep.materials)}</ul>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Method:</h4>
                                                    <div className="p-2 bg-gray-50 rounded">
                                                        <ul className="list-disc pl-5 text-sm text-gray-700">{renderBullets(prep.preparation)}</ul>
                                                    </div>
                                                </div>

                                                {prep.label && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1 text-sm">Label:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-700">{renderBullets(prep.label)}</ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="text-xs text-gray-500">
                                                    {prep.created_at && (
                                                        <span>Added: {new Date(prep.created_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{preparations.length}</div>
                                    <div className="text-sm text-gray-600">Total Preparations</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {preparations.filter(p => p.formula).length}
                                    </div>
                                    <div className="text-sm text-gray-600">With Formulas</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {preparations.filter(p => p.materials).length}
                                    </div>
                                    <div className="text-sm text-gray-600">With Materials</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{filteredPreparations.length}</div>
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
                    </>
                ) : (
                    <div className="text-center py-12">
                        <FaVial className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Preparations Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {searchTerm
                                ? 'No matches found. Try a different search.'
                                : 'Start by adding your first preparation or loading sample data.'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add First Preparation
                                    </button>
                                    <button
                                        onClick={initializeSampleData}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Load Samples
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    handleSearchAndFilter();
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg"
                            >
                                Clear Search
                            </button>
                        </div>
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by formula name, materials or steps..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPreparations.length > 0 ? (
                        filteredPreparations.map((prep) => (
                            <div key={prep.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                <FaPrescriptionBottle className="text-purple-600 text-sm" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{prep.formula_name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => handleEdit(prep)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(prep.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><FaTrash /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Materials */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaVial /> Materials
                                            </h4>
                                            <ul className="text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {renderBullets(prep.materials)}
                                            </ul>
                                        </div>

                                        {/* Preparation */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaBookOpen /> Preparation
                                            </h4>
                                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {prep.preparation_steps}
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaTag /> Label Instructions
                                            </h4>
                                            <div className="text-sm text-purple-700 font-medium bg-purple-50 p-3 rounded-lg flex items-start gap-2 italic">
                                                <span>{prep.label_instructions || 'Standard compounding label'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Stats */}
                                <div className="bg-gray-50 px-5 py-3 flex items-center gap-4 text-[10px] font-bold text-gray-500 border-t border-gray-100 uppercase tracking-widest">
                                    <div className="flex items-center gap-1"><FaTemperatureLow /> {prep.storage_info || 'Cool Place'}</div>
                                    <div className="flex items-center gap-1"><FaClock /> {prep.stability_info || '14 Days'}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <FaMortarPestle className="text-5xl text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400">No formulas found matching your search.</p>
                        </div>
                    )}
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-600 text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaMortarPestle /> {editPrep ? 'Edit Formula' : 'Add New Compounding Formula'}
                                </h2>
                                <button onClick={resetForm} className="hover:bg-white/20 p-1 rounded transition"><FaTimes size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Formula Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.formula_name}
                                        onChange={(e) => setFormData({ ...formData, formula_name: e.target.value })}
                                        placeholder="e.g. Zinc Oxide Paste 20%"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Materials <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.materials}
                                        onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                                        placeholder="List active ingredients and excipients (one per line)..."
                                        rows="4"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Preparation Steps <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.preparation_steps}
                                        onChange={(e) => setFormData({ ...formData, preparation_steps: e.target.value })}
                                        placeholder="Step-by-step compounding procedure..."
                                        rows="6"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Label Instructions
                                    </label>
                                    <textarea
                                        value={formData.label_instructions}
                                        onChange={(e) => setFormData({ ...formData, label_instructions: e.target.value })}
                                        placeholder="Specific labels (e.g. For External Use Only, Shake Well)..."
                                        rows="2"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Storage</label>
                                        <input
                                            type="text"
                                            value={formData.storage_info}
                                            onChange={(e) => setFormData({ ...formData, storage_info: e.target.value })}
                                            placeholder="e.g. 2-8°C"
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Stability</label>
                                        <input
                                            type="text"
                                            value={formData.stability_info}
                                            onChange={(e) => setFormData({ ...formData, stability_info: e.target.value })}
                                            placeholder="e.g. 14 Days"
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2"
                                    >
<<<<<<< HEAD
                                        {saving ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                        {editPrep ? 'Update Formula' : 'Save Compounding Formula'}
=======
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaVial />
                                                {editPrep ? 'Update Preparation' : 'Save Preparation'}
                                            </>
                                        )}
>>>>>>> 415f9b105bed49b3b7c510ce2944e4e48dec2342
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtemporaneousPrep;
