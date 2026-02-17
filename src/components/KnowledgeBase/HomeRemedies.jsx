import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaLeaf,
    FaPlus,
    FaSearch,
    FaExclamationTriangle,
    FaEdit,
    FaBookMedical,
    FaTimes,
    FaSync,
    FaLock,
    FaCheckCircle,
    FaSpinner,
    FaChevronDown,
    FaChevronUp,
    FaMortarPestle,
    FaPrescriptionBottleAlt,
    FaInfoCircle,
    FaLanguage
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';

const HomeRemedies = () => {
    const context = useOutletContext();
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });
    const protectionMsg = useScreenshotProtection(protectionEnabled);
    const [remedies, setRemedies] = useState([]);
    const [filteredRemedies, setFilteredRemedies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editRemedy, setEditRemedy] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedCards, setExpandedCards] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        uses: '',
        home_remedy: '',
        administration: '',
        medical_advise: ''
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

            if (error) throw error;

            if (data) {
                setRemedies(data);
                setFilteredRemedies(data);
            }
        } catch (err) {
            console.error('Error fetching remedies:', err);
            setError('Failed to load home remedies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        let filtered = remedies;

        if (term) {
            filtered = filtered.filter(remedy =>
                remedy.name.toLowerCase().includes(term.toLowerCase()) ||
                (remedy.uses && remedy.uses.toLowerCase().includes(term.toLowerCase())) ||
                (remedy.administration && remedy.administration.toLowerCase().includes(term.toLowerCase()))
            );
        }

        setFilteredRemedies(filtered);
    };

    // Toggle card expansion when clicking on name/uses
    const toggleCard = (remedyId) => {
        setExpandedCards(prev => ({
            ...prev,
            [remedyId]: !prev[remedyId]
        }));
    };

    // ADD/EDIT REMEDY - ADMIN ONLY
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            setError('Only administrators can add or edit home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Basic validation
        if (!formData.name.trim()) {
            setError('Remedy name is required');
            return;
        }

        // Basic validation
        if (!formData.uses.trim()) {
            setError('Uses is required');
            return;
        }

        if (!formData.home_remedy.trim()) {
            setError('Home remedy description is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const remedyData = {
                name: formData.name.trim(),
                uses: formData.uses.trim() || '',
                home_remedy: formData.home_remedy.trim(),
                administration: formData.administration.trim() || '',
                medical_advise: formData.medical_advise.trim() || '',
                updated_at: new Date().toISOString()
            };

            if (editRemedy) {
                const { error } = await supabase
                    .from('home_remedies')
                    .update(remedyData)
                    .eq('id', editRemedy.id);

                if (error) throw error;
                setSuccess('Home remedy updated successfully!');
            } else {
                const { error } = await supabase
                    .from('home_remedies')
                    .insert([{
                        ...remedyData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                setSuccess('Home remedy added successfully!');
            }

            fetchRemedies();
            resetForm();

        } catch (err) {
            console.error('❌ Error saving remedy (Full Detail):', JSON.stringify(err, null, 2));
            setError('Error saving remedy: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (remedy) => {
        if (!isAdmin) {
            setError('Only administrators can edit home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditRemedy(remedy);
        setFormData({
            name: remedy.name || '',
            uses: remedy.uses || '',
            home_remedy: remedy.home_remedy || '',
            administration: remedy.administration || '',
            medical_advise: remedy.medical_advise || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            uses: '',
            home_remedy: '',
            administration: '',
            medical_advise: ''
        });
        setEditRemedy(null);
        setShowForm(false);
        setError('');
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

    // Render bullet list from textarea text
    const renderBullets = (text) => {
        if (!text) return null;

        return text
            .replace(/^•\s?/gm, '')   // remove stored bullet symbols
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line, index) => (
                <li key={index}>{line}</li>
            ));
    };

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {protectionMsg && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
                        <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                            <FaLock className="text-xl" />
                            <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                                <FaLeaf className="text-green-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Home Remedies</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    Traditional and natural remedies for {remedies.length} common conditions
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
                            <button
                                onClick={fetchRemedies}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
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
                                placeholder="Search remedies by name, Uses, or administration..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Only show add button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add Remedy
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        <span>Showing {filteredRemedies.length} of {remedies.length} remedies</span>
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}
                        {protectionEnabled && !isAdmin && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded flex items-center gap-1"><FaLock size={10} /> Protected</span>}
                    </div>
                </div>

                {/* Remedies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {filteredRemedies.length > 0 ? (
                        filteredRemedies.map((remedy) => (
                            <div
                                key={remedy.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 remedy-content"
                            >
                                <div className="p-3 md:p-6">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        {/* Clickable name/uses section */}
                                        <div
                                            className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                            onClick={() => toggleCard(remedy.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{remedy.name}</h3>
                                                {expandedCards[remedy.id] ?
                                                    <FaChevronUp className="text-gray-500 text-sm" /> :
                                                    <FaChevronDown className="text-gray-500 text-sm" />
                                                }
                                            </div>
                                            {remedy.uses && (
                                                <p className="text-xs md:text-sm text-gray-600 mb-2 flex items-center gap-1">
                                                    <FaLanguage className="text-xs" /> {remedy.uses}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Only show edit button for admins */}
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(remedy)}
                                                        className="text-blue-500 hover:text-blue-700 p-1"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* All content sections - only shown when card is expanded */}
                                    {expandedCards[remedy.id] && (
                                        <>
                                            {remedy.home_remedy && (
                                                <div className="mb-3 md:mb-4 p-3 bg-green-50 border border-green-100 rounded">
                                                    <h4 className="font-semibold text-green-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                        <FaMortarPestle className="text-xs md:text-sm" /> አዘገጃጀት:
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600 leading-relaxed">{renderBullets(remedy.home_remedy)}</ul>
                                                </div>
                                            )}

                                            {remedy.administration && (
                                                <div className="mb-3 md:mb-4">
                                                    <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                        <FaPrescriptionBottleAlt className="text-xs md:text-sm" /> አወሳሰድ:
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600 leading-relaxed">{renderBullets(remedy.administration)}</ul>
                                                </div>
                                            )}

                                            {remedy.medical_advise && (
                                                <div className="mb-3 md:mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded">
                                                    <h4 className="font-semibold text-yellow-700 mb-1 flex items-center gap-1 text-sm md:text-base">
                                                        <FaInfoCircle className="text-xs md:text-sm" /> የጤና ባለሙያ ምክር/ጥንቃቄዎች:
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600 leading-relaxed">{renderBullets(remedy.medical_advise)}</ul>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                                                Last updated: {new Date(remedy.updated_at || remedy.created_at).toLocaleDateString()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaBookMedical className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Remedies Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm
                                    ? 'No home remedies match your search. Try a different term.'
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
                                    {remedies.filter(r => r.uses).length}
                                </div>
                                <div className="text-sm text-gray-600">With Uses</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {remedies.filter(r => r.medical_advise).length}
                                </div>
                                <div className="text-sm text-gray-600">With Medical advise</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{filteredRemedies.length}</div>
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
                                        {editRemedy ? 'Edit Home Remedy' : 'Add Home Remedy'}
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
                                                Remedy Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                                placeholder="e.g., Honey and Lemon"
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ጥቅሙ *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.uses}
                                                onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                                placeholder="ማር እና ሎሚ"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አዘገጃጀት *
                                        </label>
                                        <textarea
                                            value={formData.home_remedy}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Add bullet at start if empty
                                                let newValue = value;
                                                if (!value.startsWith('• ')) newValue = '• ' + value;
                                                // Replace newlines with new bullet
                                                newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                                setFormData({ ...formData, home_remedy: newValue });
                                            }}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="• Mix 1 tablespoon of honey with fresh lemon juice&#10;• Take warm water with this mixture&#10;• Repeat 2-3 times daily"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አወሳሰድ
                                        </label>
                                        <textarea
                                            value={formData.administration}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Add bullet at start if empty
                                                let newValue = value;
                                                if (!value.startsWith('• ')) newValue = '• ' + value;
                                                // Replace newlines with new bullet
                                                newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                                setFormData({ ...formData, administration: newValue });
                                            }}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="• Sore throat relief&#10;• Cough suppression&#10;• Boost immune system"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            የጤና ባለሙያ ምክር/ጥንቃቄዎች
                                        </label>
                                        <textarea
                                            value={formData.medical_advise}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Add bullet at start if empty
                                                let newValue = value;
                                                if (!value.startsWith('• ')) newValue = '• ' + value;
                                                // Replace newlines with new bullet
                                                newValue = newValue.replace(/\n(?!• )/g, '\n• ');
                                                setFormData({ ...formData, medical_advise: newValue });
                                            }}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="• Not suitable for infants under 1 year&#10;• Consult doctor if symptoms persist&#10;• Discontinue if allergic reaction occurs"
                                            required
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                {editRemedy ? 'Update Remedy' : 'Add Remedy'}
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

                {/* Sample Data Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Home Remedies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Honey & Ginger</h4>
                            <p className="text-sm text-green-700">
                                Natural remedy for cough and sore throat. Anti-inflammatory properties.
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Turmeric Milk</h4>
                            <p className="text-sm text-blue-700">
                                Golden milk for immunity, cold, and inflammation relief.
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2">Garlic</h4>
                            <p className="text-sm text-purple-700">
                                Natural antibiotic for infections and immune support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeRemedies;
