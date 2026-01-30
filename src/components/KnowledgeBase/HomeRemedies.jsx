import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaHome,
    FaLeaf,
    FaSearch,
    FaPlus,
    FaExclamationTriangle,
    FaLemon,
    FaTimes,
    FaHeart,
    FaBook,
    FaTrash,
    FaLock,
    FaSpinner,
    FaCheckCircle,
    FaShieldAlt,
    FaBan,
    FaExclamationCircle
} from 'react-icons/fa';

const HomeRemedies = () => {
    const [remedies, setRemedies] = useState([]);
    const [filteredRemedies, setFilteredRemedies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
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
        home_remedies: '',
        medical_advise: ''
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
            style.id = 'prevent-copy-remedies';
            style.innerHTML = `
                .remedy-content {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                .remedy-content::selection {
                    background: transparent !important;
                }
                .remedy-content::-moz-selection {
                    background: transparent !important;
                }
            `;
            document.head.appendChild(style);

            return () => {
                const styleEl = document.getElementById('prevent-copy-remedies');
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

    useEffect(() => {
        fetchRemedies();
    }, []);

    const fetchRemedies = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('home_remedies')
                .select('*')
                .order('name');

            if (!error && data) {
                setRemedies(data);
                setFilteredRemedies(data);
            } else {
                console.error('Error fetching remedies:', error);
                setError('Failed to load home remedies');
            }
        } catch (error) {
            console.error('Error fetching remedies:', error);
            setError('Error loading home remedies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        const filtered = remedies.filter(remedy =>
            remedy.name.toLowerCase().includes(term.toLowerCase()) ||
            remedy.amharic_name?.toLowerCase().includes(term.toLowerCase()) ||
            remedy.home_remedies.toLowerCase().includes(term.toLowerCase()) ||
            remedy.medical_advise?.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredRemedies(filtered);
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

    // ADD REMEDY - ADMIN ONLY
    const handleSaveRemedy = async () => {
        if (!isAdmin) {
            setError('Only administrators can add home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name || !formData.home_remedies) {
            setError('Name and home remedies description are required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const { error } = await supabase
                .from('home_remedies')
                .insert([{
                    ...formData,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            setSuccess('Home remedy saved successfully!');
            fetchRemedies();
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error('Error saving remedy:', error);
            setError('Error saving home remedy: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // DELETE REMEDY - ADMIN ONLY
    const handleDeleteRemedy = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this home remedy?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('home_remedies')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccess('Home remedy deleted successfully!');
            fetchRemedies();
        } catch (error) {
            console.error('Error deleting remedy:', error);
            setError('Error deleting home remedy: ' + error.message);
        }
    };

    // REMOVED: handleExportData function - No export functionality

    const resetForm = () => {
        setFormData({
            name: '',
            amharic_name: '',
            home_remedies: '',
            medical_advise: ''
        });
        setShowForm(false);
    };

    const getRemedyColor = (index) => {
        const colors = [
            'bg-green-50 border-green-200',
            'bg-blue-50 border-blue-200',
            'bg-yellow-50 border-yellow-200',
            'bg-purple-50 border-purple-200',
            'bg-pink-50 border-pink-200',
            'bg-indigo-50 border-indigo-200'
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
                    <p className="mt-3 text-gray-600">Loading home remedies...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-gray-50 min-h-full pb-8"
            onCopy={disableCopyPaste}
            onCut={disableCopyPaste}
            onPaste={disableCopyPaste}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                                <FaHome className="text-green-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Home Remedies</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    Traditional and natural treatments ({remedies.length} items)
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
                            {/* REMOVED: Export button */}
                            {/* Only show add button for admins */}
                            {isAdmin && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaPlus /> <span className="hidden sm:inline">Add Remedy</span><span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
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

                {/* Protection Warning */}


                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search remedies..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                                onCopy={disableCopyPaste}
                                onCut={disableCopyPaste}
                                onPaste={disableCopyPaste}
                            />
                        </div>

                        {/* Only show add button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                            >
                                <FaPlus /> Add New Remedy
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        <span>Showing {filteredRemedies.length} remedies</span>
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}
                        {protectionEnabled && !isAdmin && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><FaLock size={10} /> Protected</span>}
                    </div>
                </div>

                {/* Add Remedy Form Modal - ADMIN ONLY */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Add Home Remedy</h2>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                        disabled={saving}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Remedy Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="e.g., Ginger Tea for Cold"
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
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="እምቢልታ"
                                            disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Home Remedies Description *
                                        </label>
                                        <textarea
                                            value={formData.home_remedies}
                                            onChange={(e) => setFormData({ ...formData, home_remedies: e.target.value })}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="Describe the remedy, ingredients, and preparation..."
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Medical Advice (Optional)
                                        </label>
                                        <textarea
                                            value={formData.medical_advise}
                                            onChange={(e) => setFormData({ ...formData, medical_advise: e.target.value })}
                                            rows="3"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="Any medical advice, precautions, or when to see a doctor..."
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={handleSaveRemedy}
                                        disabled={saving}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaLeaf /> Save Remedy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowForm(false)}
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

                {/* Remedies Grid - ALL CONTENT VISIBLE but protected from copying */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {filteredRemedies.length > 0 ? (
                        filteredRemedies.map((remedy, index) => (
                            <div
                                key={remedy.id}
                                className={`border rounded-xl shadow-lg overflow-hidden ${getRemedyColor(index)} remedy-content`}
                                onCopy={disableCopyPaste}
                                onCut={disableCopyPaste}
                                onPaste={disableCopyPaste}
                                onContextMenu={disableRightClick}
                                style={disableTextSelection()}
                            >
                                <div className="p-3 md:p-6">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{remedy.name}</h3>
                                            {remedy.amharic_name && (
                                                <p className="text-xs md:text-sm text-gray-600 mb-2">{remedy.amharic_name}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 md:p-2 bg-green-100 rounded-full">
                                                <FaLeaf className="text-green-600 text-sm md:text-base" />
                                            </div>
                                            {/* Only show delete button for admins */}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteRemedy(remedy.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Delete remedy"
                                                >
                                                    <FaTrash className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3 md:mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 text-sm md:text-base">Home Remedy:</h4>
                                        <p className="text-gray-700 whitespace-pre-line text-sm md:text-base leading-relaxed">{remedy.home_remedies}</p>
                                    </div>

                                    {remedy.medical_advise && (
                                        <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-50 border border-yellow-100 rounded">
                                            <h4 className="font-semibold text-yellow-700 mb-1 flex items-center gap-2 text-sm md:text-base">
                                                <FaExclamationTriangle className="text-xs md:text-sm" /> Medical Advice:
                                            </h4>
                                            <p className="text-xs md:text-sm text-yellow-800 whitespace-pre-line leading-relaxed">{remedy.medical_advise}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
                                        <div className="text-xs text-gray-500">
                                            Added {new Date(remedy.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <FaHeart className="text-red-400 text-xs" />
                                            <span className="text-xs text-gray-500">Traditional</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaLemon className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Home Remedies Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm
                                    ? 'No remedies match your search. Try a different term.'
                                    : 'No home remedies added yet.'}
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        handleSearch('');
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Clear Search
                                </button>
                                {/* Only show add button for admins */}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Remedy
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                {filteredRemedies.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{remedies.length}</div>
                                <div className="text-sm text-gray-600">Total Remedies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {remedies.filter(r => r.amharic_name).length}
                                </div>
                                <div className="text-sm text-gray-600">With Amharic Names</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {remedies.filter(r => r.medical_advise).length}
                                </div>
                                <div className="text-sm text-gray-600">With Medical Advice</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{filteredRemedies.length}</div>
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

                {/* Quick Tips Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaBook className="text-green-600" /> Traditional Remedies Quick Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Ginger Tea</h4>
                            <p className="text-sm text-green-700">
                                For colds and sore throat. Boil ginger slices, add honey and lemon.
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Turmeric Milk</h4>
                            <p className="text-sm text-blue-700">
                                Anti-inflammatory. Mix turmeric in warm milk with honey.
                            </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 mb-2">Honey & Cinnamon</h4>
                            <p className="text-sm text-yellow-700">
                                For cough and immunity. Mix honey with cinnamon powder.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeRemedies;
