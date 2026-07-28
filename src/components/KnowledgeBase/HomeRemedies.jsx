import React, { useState, useEffect, useMemo } from 'react';
import supabase from '../../utils/supabase';
import {
    FaLeaf,
    FaPlus,
    FaSearch,
    FaExclamationTriangle,
    FaEdit,
    FaTrash,
    FaBookMedical,
    FaTimes,
    FaSync,
    FaLock,
    FaCheckCircle,
    FaSpinner,
    FaMortarPestle,
    FaPrescriptionBottleAlt,
    FaInfoCircle,
    FaDatabase,
    FaListUl,
    FaIndent,
    FaOutdent,
    FaHashtag,
    FaUserShield,
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
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedRemedy, setSelectedRemedy] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [activeFormatField, setActiveFormatField] = useState(null);
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);

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

    // FETCH REMEDIES FROM DATABASE
    const fetchRemedies = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching home remedies from database...');

            const { data, error } = await supabase
                .from('home_remedies')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Fetched remedies:', data);

            if (data && data.length > 0) {
                setRemedies(data);
                setFilteredRemedies(data);
            } else {
                console.log('No remedies found in database');
                setRemedies([]);
                setFilteredRemedies([]);
            }
        } catch (err) {
            console.error('Error fetching remedies:', err);
            setError('Failed to load home remedies. Please try again.');
            setRemedies([]);
            setFilteredRemedies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRemedies();
    }, []);

    // Use useMemo for filtered remedies
    const filteredRems = useMemo(() => {
        if (!searchTerm.trim()) return remedies;
        
        return remedies.filter(rem =>
            (rem.name && rem.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (rem.uses && rem.uses.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (rem.home_remedy && rem.home_remedy.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (rem.administration && rem.administration.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [remedies, searchTerm]);

    // Update filtered remedies when search changes
    useEffect(() => {
        setFilteredRemedies(filteredRems);
    }, [filteredRems]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Formatting helper functions
    const insertFormatting = (field, type) => {
        const textarea = document.getElementById(field);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const Text = formData[field].substring(start, end);
        const beforeText = formData[field].substring(0, start);
        const afterText = formData[field].substring(end);

        let formattedText = '';
        
        switch(type) {
            case 'bullet':
                if (Text.includes('\n')) {
                    formattedText = Text.split('\n')
                        .map(line => line.trim() ? `• ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = Text ? `• ${Text}` : '• ';
                }
                break;
                
            case 'subbullet':
                if (Text.includes('\n')) {
                    formattedText = Text.split('\n')
                        .map(line => line.trim() ? `  ◦ ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = Text ? `  ◦ ${Text}` : '  ◦ ';
                }
                break;
                
            case 'number':
                if (Text.includes('\n')) {
                    const lines = Text.split('\n').filter(line => line.trim());
                    formattedText = lines
                        .map((line, index) => `${index + 1}. ${line}`)
                        .join('\n');
                } else {
                    formattedText = Text ? `1. ${Text}` : '1. ';
                }
                break;
                
            case 'indent':
                if (Text.includes('\n')) {
                    formattedText = Text.split('\n')
                        .map(line => line ? `    ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = `    ${Text}`;
                }
                break;
                
            case 'outdent':
                if (Text.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line.replace(/^ {4}/, ''))
                        .join('\n');
                } else {
                    formattedText = selectedText.replace(/^ {4}/, '');
                }
                break;
                
            default:
                return;
        }

        setFormData({
            ...formData,
            [field]: beforeText + formattedText + afterText
        });

        setTimeout(() => {
            textarea.focus();
            const newPosition = start + formattedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    // ADD REMEDY TO DATABASE - ADMIN ONLY
    const handleAddRemedy = async () => {
        if (!isAdmin) {
            setError('Only administrators can add home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter a remedy name');
            return;
        }

        if (!formData.home_remedy.trim()) {
            setError('Please enter home remedy preparation instructions');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Saving remedy:', formData);

            const { data, error } = await supabase
                .from('home_remedies')
                .insert([{
                    name: formData.name,
                    uses: formData.uses,
                    home_remedy: formData.home_remedy,
                    administration: formData.administration,
                    medical_advise: formData.medical_advise,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Remedy saved:', data);

            setSuccessMessage('Home remedy added successfully!');

            setFormData({
                name: '',
                uses: '',
                home_remedy: '',
                administration: '',
                medical_advise: ''
            });

            setShowForm(false);

            setTimeout(() => {
                fetchRemedies();
            }, 1000);

        } catch (err) {
            console.error('Error saving remedy:', err);
            setError(`Failed to save remedy: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // EDIT REMEDY - ADMIN ONLY
    const handleEditRemedy = (remedy) => {
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

    // UPDATE REMEDY IN DATABASE - ADMIN ONLY
    const handleUpdateRemedy = async () => {
        if (!isAdmin) {
            setError('Only administrators can update home remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter a remedy name');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Updating remedy:', editRemedy.id, formData);

            const { data, error } = await supabase
                .from('home_remedies')
                .update({
                    name: formData.name,
                    uses: formData.uses,
                    home_remedy: formData.home_remedy,
                    administration: formData.administration,
                    medical_advise: formData.medical_advise,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editRemedy.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Remedy updated:', data);

            setSuccessMessage('Home remedy updated successfully!');

            setFormData({
                name: '',
                uses: '',
                home_remedy: '',
                administration: '',
                medical_advise: ''
            });

            setShowForm(false);
            setEditRemedy(null);

            setTimeout(() => {
                fetchRemedies();
            }, 1000);

        } catch (err) {
            console.error('Error updating remedy:', err);
            setError(`Failed to update remedy: ${err.message}`);
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

        if (!window.confirm('Are you sure you want to delete this home remedy? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError('');
        
        try {
            const { error } = await supabase
                .from('home_remedies')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccessMessage('Home remedy deleted successfully');
            
            if (selectedRemedy?.id === id) {
                setSelectedRemedy(null);
            }
            
            fetchRemedies();
            
        } catch (err) {
            console.error('Error deleting remedy:', err);
            setError('Failed to delete home remedy');
        } finally {
            setSaving(false);
        }
    };

    // Initialize database if empty - ADMIN ONLY
    const initializeDatabase = async () => {
        if (!isAdmin) {
            setError('Only administrators can initialize the database');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('This will insert sample home remedies into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const sampleRemedies = [
                {
                    name: 'Honey and Lemon',
                    uses: 'Sore throat, Cough',
                    home_remedy: '• Mix 1 tablespoon of raw honey with fresh juice of half a lemon\n• Add to a cup of warm water\n• Stir well until honey dissolves\n• Drink while warm',
                    administration: '• Take 2-3 times daily\n• Best taken before bed for nighttime cough\n• Can be consumed throughout the day as needed\n• Not for children under 1 year',
                    medical_advise: '• Avoid in infants under 12 months (botulism risk)\n• Diabetics should monitor blood sugar\n• Consult doctor if symptoms persist > 7 days\n• Discontinue if allergic reaction occurs'
                },
                {
                    name: 'Turmeric Milk',
                    uses: 'Cold, Inflammation, Immunity',
                    home_remedy: '• Heat 1 cup of milk (dairy or plant-based)\n• Add 1/2 teaspoon of turmeric powder\n• Add a pinch of black pepper (enhances absorption)\n• Add honey or jaggery to taste\n• Stir well and drink warm',
                    administration: '• Drink once daily, preferably before bed\n• Can be taken in the morning on empty stomach\n• Use consistently for best results\n• For acute conditions, can take twice daily',
                    medical_advise: '• May interact with blood thinners\n• Consult doctor before use during pregnancy\n• Stop use before surgery (blood thinning effect)\n• May cause stomach upset in sensitive individuals'
                },
                {
                    name: 'Ginger Tea',
                    uses: 'Nausea, Indigestion, Inflammation',
                    home_remedy: '• Grate 1-inch fresh ginger root\n• Boil in 2 cups of water for 10 minutes\n• Strain into a cup\n• Add honey and lemon to taste\n• Optional: add mint leaves for flavor',
                    administration: '• Sip slowly, especially for nausea\n• Drink 30 minutes before meals for digestion\n• Can be consumed 2-3 times daily\n• Best when freshly prepared',
                    medical_advise: '• May interact with blood thinners and diabetes medications\n• Avoid excessive amounts during pregnancy\n• May cause heartburn in some people\n• Consult doctor if taking anticoagulants'
                }
            ];

            const { data, error } = await supabase
                .from('home_remedies')
                .insert(sampleRemedies)
                .select();

            if (error) throw error;

            setSuccessMessage('Sample home remedies added successfully!');
            fetchRemedies();

        } catch (err) {
            console.error('Error initializing database:', err);
            setError('Failed to initialize database');
        } finally {
            setLoading(false);
        }
    };

    // Convert textarea text to bullet list with support for nested bullets
    const renderFormattedText = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        
        return lines.map((line, index) => {
            if (line.trim().startsWith('•')) {
                return (
                    <li key={index} className="ml-4 list-disc text-sm text-gray-700">
                        {line.replace('•', '').trim()}
                    </li>
                );
            }
            else if (line.trim().startsWith('◦') || line.trim().startsWith('○')) {
                return (
                    <li key={index} className="ml-8 list-circle text-sm text-gray-600">
                        {line.replace(/[◦○]/, '').trim()}
                    </li>
                );
            }
            else if (/^\d+\./.test(line.trim())) {
                return (
                    <li key={index} className="ml-4 list-decimal text-sm text-gray-700">
                        {line.replace(/^\d+\./, '').trim()}
                    </li>
                );
            }
            else if (line.trim()) {
                return (
                    <p key={index} className="text-sm text-gray-700 mb-1">
                        {line}
                    </p>
                );
            }
            return null;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading home remedies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            {protectionMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                        <FaUserShield className="text-xl" />
                        <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                                <FaLeaf className="text-green-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">የቤት ውስጥ ጤና ክብካቤ መፍትሔዎች</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    {isAdmin ? (
                                        `Traditional and natural remedies for ${remedies.length} common conditions`
                                    ) : (
                                        "Home Remedy database"
                                    )}
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
                                        onClick={() => setShowForm(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Add Remedy</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={fetchRemedies}
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
                            <FaCheckCircle className="flex-shrink-0" />
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

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search remedies by name, uses, or preparation..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Admin-only add button */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add New Remedy
                            </button>
                        )}
                    </div>
                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        {searchTerm.length >= 2 && (
                            <span>Found {filteredRemedies.length} remedy{filteredRemedies.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
                        )}
                    </div>
                </div>

                {/* Add/Edit Remedy Form Modal - ADMIN ONLY with Bullet Point Formatting */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editRemedy ? 'Edit Home Remedy' : 'Add New Home Remedy'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                                            className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                                            title="Formatting Help"
                                        >
                                            <FaInfoCircle />
                                            <span className="hidden sm:inline">Formatting Help</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditRemedy(null);
                                                setFormData({
                                                    name: '',
                                                    uses: '',
                                                    home_remedy: '',
                                                    administration: '',
                                                    medical_advise: ''
                                                });
                                            }}
                                            className="text-gray-500 hover:text-gray-700 text-2xl"
                                            disabled={saving}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>

                                {/* Formatting Help Panel */}
                                {showFormattingHelp && (
                                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                            <FaInfoCircle />
                                            Formatting Tips
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-green-700 mb-2">Bullet Points:</p>
                                                <ul className="space-y-1 text-green-600">
                                                    <li className="flex items-center gap-2">
                                                        <FaListUl className="text-xs" /> 
                                                        <span>Click • for main bullets</span>
                                                    </li>
                                                    <li className="flex items-center gap-2 ml-4">
                                                        <span className="text-lg">◦</span> 
                                                        <span>Click for sub-bullets (indented)</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FaHashtag className="text-xs" /> 
                                                        <span>Use for numbered lists</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-700 mb-2">Keyboard Shortcuts:</p>
                                                <ul className="space-y-1 text-green-600">
                                                    <li><span className="font-mono bg-green-100 px-1">•</span> - Main bullet</li>
                                                    <li><span className="font-mono bg-green-100 px-1">  ◦</span> - Sub-bullet (2 spaces)</li>
                                                    <li><span className="font-mono bg-green-100 px-1">1.</span> - Numbered item</li>
                                                    <li>Use Tab/Shift+Tab for indentation</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-500 mt-2">
                                            Tip: Select text first, then click formatting buttons, or place cursor and start typing.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Basic Info Fields */}
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
                                                Uses
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.uses}
                                                onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                                                placeholder="e.g., Sore throat, Cough"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    {/* Home Remedy Preparation Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አዘገጃጀት (Preparation) *
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('home_remedy', 'bullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('home_remedy', 'subbullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('home_remedy', 'number')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('home_remedy', 'indent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('home_remedy', 'outdent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="home_remedy"
                                            value={formData.home_remedy}
                                            onChange={(e) => setFormData({ ...formData, home_remedy: e.target.value })}
                                            onFocus={() => setActiveFormatField('home_remedy')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                            placeholder="• First preparation step&#10;  ◦ Sub-step or variation&#10;• Another step&#10;1. Numbered instruction"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Administration Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አወሳሰድ (Administration)
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration', 'bullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration', 'subbullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration', 'number')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration', 'indent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration', 'outdent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="administration"
                                            value={formData.administration}
                                            onChange={(e) => setFormData({ ...formData, administration: e.target.value })}
                                            onFocus={() => setActiveFormatField('administration')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                            placeholder="• How to take/use the remedy&#10;  ◦ Special instructions"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Medical Advice Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            የጤና ባለሙያ ምክር/ጥንቃቄዎች (Medical Advice/Precautions)
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('medical_advise', 'bullet')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('medical_advise', 'subbullet')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('medical_advise', 'number')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('medical_advise', 'indent')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('medical_advise', 'outdent')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="medical_advise"
                                            value={formData.medical_advise}
                                            onChange={(e) => setFormData({ ...formData, medical_advise: e.target.value })}
                                            onFocus={() => setActiveFormatField('medical_advise')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                            placeholder="• Important precautions&#10;  ◦ Who should avoid&#10;• When to consult a doctor"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={editRemedy ? handleUpdateRemedy : handleAddRemedy}
                                        disabled={saving}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                {editRemedy ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                {editRemedy ? <FaEdit /> : <FaPlus />}
                                                {editRemedy ? 'Update Remedy' : 'Add Remedy'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditRemedy(null);
                                            setFormData({
                                                name: '',
                                                uses: '',
                                                home_remedy: '',
                                                administration: '',
                                                medical_advise: ''
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

                {/* Remedies Grid - Four Columns as Bold Lines */}
                {filteredRemedies.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                            {filteredRemedies.map((remedy) => (
                                <div key={remedy.id} className="group py-2 border-b border-gray-100 lg:border-0">
                                    <div className="flex items-start gap-2">
                                        <FaLeaf className="text-xs text-green-400 mt-1.5 flex-shrink-0 group-hover:text-green-600 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => setSelectedRemedy(remedy)}
                                                className="text-left w-full flex items-center gap-1 group/button"
                                            >
                                                <span className="font-bold text-gray-800 hover:text-green-600 transition-colors text-sm md:text-base">
                                                    {remedy.name}
                                                </span>
                                                <span className="text-gray-300 group-hover/button:text-green-400 text-xs transition-colors">
                                                    ▶
                                                </span>
                                            </button>
                                            {remedy.uses && (
                                                <div className="text-sm text-black-500 mt-0.5 flex items-center gap-1">
                                                    <FaLanguage className="text-sm" /> {remedy.uses}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditRemedy(remedy)}
                                                    className="text-green-400 hover:text-green-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRemedy(remedy.id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <FaLeaf className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Remedies Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {searchTerm
                                ? 'No home remedies match your search criteria. Try a different search.'
                                : 'No home remedies found in the database.'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                            >
                                Clear Search
                            </button>
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Remedy
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

                {/* Remedy Details Modal - Narrower Width with Enhanced Formatting */}
                {selectedRemedy && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-[60%] max-w-[60%] min-w-[300px] max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-800 text-white p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold truncate">{selectedRemedy.name}</h2>
                                        {selectedRemedy.uses && (
                                            <p className="text-sm font-extrabold text-white mt-1 truncate flex items-center gap-1 bg-green-700/30 p-1.5 rounded-md">
                                                <FaLanguage className="text-white text-xs flex-shrink-0" />
                                                <span className="font-extrabold">{selectedRemedy.uses}</span>
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedRemedy(null)}
                                        className="text-white hover:text-gray-200 text-lg ml-2 flex-shrink-0"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(160vh - 120px)' }}>
                               <div className="p-3 space-y-2">
                                    {/* Home Remedy Preparation Section */}
                                    {selectedRemedy.home_remedy && (
                                        <div className="bg-green-50 rounded-lg overflow-hidden border border-green-100">
                                            <button
                                                onClick={() => toggleSection('home_remedy')}
                                                className="w-full bg-green-100 hover:bg-green-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-green-800 flex items-center gap-1 text-xs">
                                                    <FaMortarPestle className="text-green-600 text-xs" />
                                                    አዘገጃጀት (Preparation):
                                                </h3>
                                                <span className="text-green-600 text-base font-bold">
                                                    {expandedSections.home_remedy ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.home_remedy && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedRemedy.home_remedy)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Administration Section */}
                                    {selectedRemedy.administration && (
                                        <div className="bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                                            <button
                                                onClick={() => toggleSection('administration')}
                                                className="w-full bg-blue-100 hover:bg-blue-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-blue-800 flex items-center gap-1 text-xs">
                                                    <FaPrescriptionBottleAlt className="text-blue-600 text-xs" />
                                                    አወሳሰድ (Administration):
                                                </h3>
                                                <span className="text-blue-600 text-base font-bold">
                                                    {expandedSections.administration ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.administration && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedRemedy.administration)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Medical Advice Section */}
                                    {selectedRemedy.medical_advise && (
                                        <div className="bg-yellow-50 rounded-lg overflow-hidden border border-yellow-100">
                                            <button
                                                onClick={() => toggleSection('medical_advise')}
                                                className="w-full bg-yellow-100 hover:bg-yellow-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-yellow-800 flex items-center gap-1 text-xs">
                                                    <FaInfoCircle className="text-yellow-600 text-xs" />
                                                    የጤና ባለሙያ ምክር/ጥንቃቄዎች:
                                                </h3>
                                                <span className="text-yellow-600 text-base font-bold">
                                                    {expandedSections.medical_advise ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.medical_advise && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedRemedy.medical_advise)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 flex justify-end gap-1">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleEditRemedy(selectedRemedy);
                                                setSelectedRemedy(null);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaEdit className="text-xs" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRemedy(selectedRemedy.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaTrash className="text-xs" /> Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedRemedy(null)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-lg text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeRemedies;
