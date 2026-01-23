import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { 
    FaFlask, 
    FaPlus, 
    FaSearch,
    FaExclamationTriangle,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaCheckCircle,
    FaTimes,
    FaSync,
    FaLock,
    FaBan,
    FaEyeSlash,
    FaShieldAlt
} from 'react-icons/fa';

const ExtemporaneousPrep = () => {
    const [preparations, setPreparations] = useState([]);
    const [filteredPreparations, setFilteredPreparations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editPrep, setEditPrep] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [protectionEnabled, setProtectionEnabled] = useState(true); // Protection ON by default

    // Form data structure
    const [formData, setFormData] = useState({
        name: '',
        use: '',
        formula: '',
        materials: '',
        preparation: '',
        label: ''
    });

    // Protection functions - users CAN SEE but CANNOT COPY
    const disableCopyPaste = (e) => {
        if (protectionEnabled && !isAdmin) {
            e.preventDefault();
            alert('Copying content is disabled. You can view but not copy this information.');
            return false;
        }
    };

    const disableRightClick = (e) => {
        if (protectionEnabled && !isAdmin) {
            e.preventDefault();
            alert('Right-click is disabled to prevent copying of proprietary information.');
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
                alert('Copying is disabled. You can view but not copy this information.');
                return false;
            }
            
            // Disable print shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                alert('Printing is disabled. You can view but not print this information.');
                return false;
            }
            
            if (e.key === 'PrintScreen' || e.key === 'F12') {
                e.preventDefault();
                alert('Screenshots are disabled to protect proprietary information.');
                return false;
            }
        }
    };

    // Add CSS to prevent text selection while allowing visibility
    useEffect(() => {
        if (protectionEnabled && !isAdmin) {
            const style = document.createElement('style');
            style.id = 'prevent-copy';
            style.innerHTML = `
                .prep-content {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                .prep-content::selection {
                    background: transparent !important;
                }
                .prep-content::-moz-selection {
                    background: transparent !important;
                }
            `;
            document.head.appendChild(style);
            
            return () => {
                const styleEl = document.getElementById('prevent-copy');
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
                alert('Printing of this content is disabled. You can view but not print the information.');
                return false;
            };

            // Add beforeprint event listener
            const handleBeforePrint = (e) => {
                alert('Printing of this content is disabled. You can view but not print the information.');
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

    useEffect(() => {
        fetchPreparations();
    }, []);

    // FETCH PREPARATIONS
    const fetchPreparations = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data) {
                setPreparations(data);
                setFilteredPreparations(data);
            }
        } catch (err) {
            console.error('Error fetching preparations:', err);
            setError('Failed to load preparations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearchAndFilter();
    }, [preparations, searchTerm]);

    const handleSearchAndFilter = () => {
        let filtered = preparations;

        if (searchTerm.trim()) {
            filtered = filtered.filter(prep => 
                (prep.name && prep.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (prep.use && prep.use.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (prep.materials && prep.materials.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredPreparations(filtered);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // SAVE PREPARATION - ADMIN ONLY
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAdmin) {
            alert('Only administrators can add or edit preparations');
            return;
        }

        if (!formData.name.trim()) {
            setError('Preparation name is required');
            return;
        }

        if (!formData.preparation.trim()) {
            setError('Preparation method is required');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const prepData = {
                name: formData.name.trim(),
                use: formData.use.trim() || '',
                formula: formData.formula.trim() || '',
                materials: formData.materials.trim() || '',
                preparation: formData.preparation.trim(),
                label: formData.label.trim() || '',
                updated_at: new Date().toISOString()
            };

            let result;
            
            if (editPrep) {
                const { data, error } = await supabase
                    .from('extemporaneous_preparations')
                    .update(prepData)
                    .eq('id', editPrep.id)
                    .select();

                if (error) throw error;
                result = data;
            } else {
                const { data, error } = await supabase
                    .from('extemporaneous_preparations')
                    .insert([{
                        ...prepData,
                        created_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;
                result = data;
            }

            const message = editPrep ? 'Preparation updated successfully!' : 'Preparation added successfully!';
            setSuccess(message);

            await fetchPreparations();
            
            setTimeout(() => {
                resetForm();
            }, 1500);

        } catch (err) {
            console.error('Error saving preparation:', err);
            setError(`Save failed: ${err.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

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

    // DELETE PREPARATION - ADMIN ONLY
    const handleDelete = async (id) => {
        if (!isAdmin) {
            alert('Only administrators can delete preparations');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this preparation?')) return;

        try {
            const { error } = await supabase
                .from('extemporaneous_preparations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccess('Preparation deleted successfully!');
            
            const updatedPreparations = preparations.filter(prep => prep.id !== id);
            setPreparations(updatedPreparations);
            
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error deleting preparation:', err);
            setError(`Delete failed: ${err.message}`);
        }
    };

    // Toggle protection (Admin only)
    const toggleProtection = () => {
        if (!isAdmin) {
            alert('Only administrators can modify protection settings.');
            return;
        }
        setProtectionEnabled(!protectionEnabled);
        setSuccess(`Copy/Print Protection ${!protectionEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
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
    };

    const resetForm = () => {
        setFormData({
            name: '',
            use: '',
            formula: '',
            materials: '',
            preparation: '',
            label: ''
        });
        setEditPrep(null);
        setShowForm(false);
        setError('');
    };

    if (loading && !saving) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading preparations...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen bg-gray-50 p-4"
            onCopy={disableCopyPaste}
            onCut={disableCopyPaste}
            onPaste={disableCopyPaste}
        >
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <FaFlask className="text-indigo-600 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Extemporaneous Preparations</h1>
                                <p className="text-gray-600 text-sm">
                                    {preparations.length} formulas • Last updated: {new Date().toLocaleDateString()}
                                    <span className={`ml-2 text-sm px-2 py-1 rounded ${
                                        isAdmin 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        
                                       
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Protection Toggle - Admin only */}
                            {isAdmin && (
                                <button
                                    onClick={toggleProtection}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                                        protectionEnabled 
                                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                    title={protectionEnabled ? 'Disable Copy/Print Protection' : 'Enable Copy/Print Protection'}
                                >
                                    {protectionEnabled ? <FaBan /> : <FaShieldAlt />}
                                    {protectionEnabled ? 'Allow Copy' : 'No Copy'}
                                </button>
                            )}
                            <button
                                onClick={fetchPreparations}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaSync /> Refresh
                            </button>
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={initializeSampleData}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> Add Samples
                                    </button>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> New Prep
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Protection Warning */}
                   

                    {/* Messages */}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FaCheckCircle />
                                <span className="font-medium">{success}</span>
                            </div>
                            <button onClick={() => setSuccess('')} className="text-green-800 hover:text-green-900">
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FaExclamationTriangle />
                                <span className="font-medium">{error}</span>
                            </div>
                            <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search preparations by name, use, or materials..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                onCopy={disableCopyPaste}
                                onCut={disableCopyPaste}
                                onPaste={disableCopyPaste}
                            />
                        </div>
                    </div>

                    {/* Preparations Grid - ALL CONTENT VISIBLE but protected from copying */}
                    {filteredPreparations.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPreparations.map((prep) => (
                                    <div 
                                        key={prep.id} 
                                        className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-shadow duration-200 prep-content"
                                        onCopy={disableCopyPaste}
                                        onCut={disableCopyPaste}
                                        onPaste={disableCopyPaste}
                                        onContextMenu={disableRightClick}
                                        style={disableTextSelection()}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-800 mb-1">
                                                    {prep.name || 'Unnamed'}
                                                </h3>
                                                {prep.use && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {prep.use}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(prep)}
                                                            className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(prep.id)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-500">
                                                        <FaLock className="inline mr-1" /> View Only
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {prep.formula && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Formula:</h4>
                                                    <div className="p-2 bg-gray-50 rounded">
                                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                            {prep.formula}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {prep.materials && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Materials:</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-3">
                                                        {prep.materials}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="font-semibold text-gray-700 mb-1 text-sm">Method:</h4>
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                        {prep.preparation}
                                                    </p>
                                                </div>
                                            </div>

                                            {prep.label && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Label:</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {prep.label}
                                                    </p>
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
                            <FaFlask className="text-5xl text-gray-300 mx-auto mb-4" />
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
                        </div>
                    )}

                    {/* Form Modal - ADMIN ONLY */}
                    {showForm && isAdmin && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                                <form onSubmit={handleSubmit} className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {editPrep ? 'Edit Preparation' : 'Create New Preparation'}
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

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Preparation Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="e.g., Amoxicillin Oral Suspension"
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Use / Indication
                                            </label>
                                            <textarea
                                                value={formData.use}
                                                onChange={(e) => setFormData({...formData, use: e.target.value})}
                                                rows="2"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="What is this preparation used for?"
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Formula / Ingredients
                                            </label>
                                            <textarea
                                                value={formData.formula}
                                                onChange={(e) => setFormData({...formData, formula: e.target.value})}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="List ingredients with quantities..."
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Materials Required
                                            </label>
                                            <textarea
                                                value={formData.materials}
                                                onChange={(e) => setFormData({...formData, materials: e.target.value})}
                                                rows="2"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Equipment and materials needed..."
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Preparation Method *
                                            </label>
                                            <textarea
                                                value={formData.preparation}
                                                onChange={(e) => setFormData({...formData, preparation: e.target.value})}
                                                rows="4"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Step-by-step instructions..."
                                                required
                                                disabled={saving}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Use numbered steps for clarity</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Labeling Instructions
                                            </label>
                                            <textarea
                                                value={formData.label}
                                                onChange={(e) => setFormData({...formData, label: e.target.value})}
                                                rows="2"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="What should be on the label?"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8 pt-6 border-t">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaFlask />
                                                    {editPrep ? 'Update Preparation' : 'Save Preparation'}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExtemporaneousPrep;