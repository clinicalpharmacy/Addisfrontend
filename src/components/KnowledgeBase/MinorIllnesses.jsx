import React, { useState, useEffect, useMemo } from 'react';
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
    FaUserShield,
    FaCheckCircle,
    FaExclamationCircle,
    FaSpinner,
    FaChevronDown,
    FaChevronUp,
    FaInfoCircle,
    FaDatabase,
    FaListUl,
    FaIndent,
    FaOutdent,
    FaHashtag
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';

const MinorIllnesses = () => {
    const context = useOutletContext();
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });
    const protectionMsg = useScreenshotProtection(protectionEnabled);

    const [illnesses, setIllnesses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editIllness, setEditIllness] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedIllness, setSelectedIllness] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [activeFormatField, setActiveFormatField] = useState(null);
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);

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

    // FETCH ILLNESSES FROM DATABASE
    const fetchIllnesses = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching illnesses from database...');

            const { data, error } = await supabase
                .from('minor_illnesses')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Fetched illnesses:', data);

            setIllnesses(data || []);
        } catch (err) {
            console.error('Error fetching illnesses:', err);
            setError('Failed to load illnesses. Please try again.');
            setIllnesses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIllnesses();
    }, []);

    // Use useMemo for filtered illnesses - FIXED: This directly computes filtered results
    const filteredIllnesses = useMemo(() => {
        if (!searchTerm.trim()) return illnesses;
        
        return illnesses.filter(ill =>
            (ill.name && ill.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ill.amharic_name && ill.amharic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ill.assessment && ill.assessment.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ill.otc_drug && ill.otc_drug.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [illnesses, searchTerm]);

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
        const selectedText = formData[field].substring(start, end);
        const beforeText = formData[field].substring(0, start);
        const afterText = formData[field].substring(end);

        let formattedText = '';
        
        switch(type) {
            case 'bullet':
                if (selectedText.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line.trim() ? `• ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = selectedText ? `• ${selectedText}` : '• ';
                }
                break;
                
            case 'subbullet':
                if (selectedText.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line.trim() ? `  ◦ ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = selectedText ? `  ◦ ${selectedText}` : '  ◦ ';
                }
                break;
                
            case 'number':
                if (selectedText.includes('\n')) {
                    const lines = selectedText.split('\n').filter(line => line.trim());
                    formattedText = lines
                        .map((line, index) => `${index + 1}. ${line}`)
                        .join('\n');
                } else {
                    formattedText = selectedText ? `1. ${selectedText}` : '1. ';
                }
                break;
                
            case 'indent':
                if (selectedText.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line ? `    ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = `    ${selectedText}`;
                }
                break;
                
            case 'outdent':
                if (selectedText.includes('\n')) {
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

    // ADD ILLNESS TO DATABASE - ADMIN ONLY
    const handleAddIllness = async () => {
        if (!isAdmin) {
            setError('Only administrators can add illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter an illness name');
            return;
        }

        if (!formData.assessment.trim()) {
            setError('Please enter assessment information');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Saving illness:', formData);

            const { data, error } = await supabase
                .from('minor_illnesses')
                .insert([{
                    name: formData.name,
                    amharic_name: formData.amharic_name,
                    assessment: formData.assessment,
                    referral: formData.referral,
                    otc_drug: formData.otc_drug,
                    for_pharmacists: formData.for_pharmacists,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Illness saved:', data);

            setSuccessMessage('Illness added successfully!');

            setFormData({
                name: '',
                amharic_name: '',
                assessment: '',
                referral: '',
                otc_drug: '',
                for_pharmacists: ''
            });

            setShowForm(false);

            setTimeout(() => {
                fetchIllnesses();
            }, 1000);

        } catch (err) {
            console.error('Error saving illness:', err);
            setError(`Failed to save illness: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // EDIT ILLNESS - ADMIN ONLY
    const handleEditIllness = (illness) => {
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

    // UPDATE ILLNESS IN DATABASE - ADMIN ONLY
    const handleUpdateIllness = async () => {
        if (!isAdmin) {
            setError('Only administrators can update illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Please enter an illness name');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Updating illness:', editIllness.id, formData);

            const { data, error } = await supabase
                .from('minor_illnesses')
                .update({
                    name: formData.name,
                    amharic_name: formData.amharic_name,
                    assessment: formData.assessment,
                    referral: formData.referral,
                    otc_drug: formData.otc_drug,
                    for_pharmacists: formData.for_pharmacists,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editIllness.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Illness updated:', data);

            setSuccessMessage('Illness updated successfully!');

            setFormData({
                name: '',
                amharic_name: '',
                assessment: '',
                referral: '',
                otc_drug: '',
                for_pharmacists: ''
            });

            setShowForm(false);
            setEditIllness(null);

            setTimeout(() => {
                fetchIllnesses();
            }, 1000);

        } catch (err) {
            console.error('Error updating illness:', err);
            setError(`Failed to update illness: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // DELETE ILLNESS - ADMIN ONLY
    const handleDeleteIllness = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this illness? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError('');
        
        try {
            const { error } = await supabase
                .from('minor_illnesses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccessMessage('Illness deleted successfully');
            
            if (selectedIllness?.id === id) {
                setSelectedIllness(null);
            }
            
            fetchIllnesses();
            
        } catch (err) {
            console.error('Error deleting illness:', err);
            setError('Failed to delete illness');
        } finally {
            setSaving(false);
        }
    };

    // Initialize database with sample illnesses - ADMIN ONLY
    const initializeDatabase = async () => {
        if (!isAdmin) {
            setError('Only administrators can initialize the database');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('This will insert sample illnesses into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const sampleIllnesses = [
                {
                    name: 'Common Cold',
                    amharic_name: 'ቀዝቃዛ በሽታ',
                    assessment: '• Runny or stuffy nose\n• Sore throat\n• Cough\n• Mild headache\n• Low-grade fever (rare)\n  ◦ Usually self-limiting\n  ◦ Lasts 7-10 days',
                    referral: '• Fever > 38°C for more than 3 days\n• Difficulty breathing\n• Severe headache\n• Symptoms lasting > 10 days\n• Children under 3 months with fever',
                    otc_drug: '• Paracetamol for pain/fever\n• Ibuprofen for pain/fever\n• Decongestants for stuffy nose\n• Antihistamines for runny nose\n  ◦ Use non-drowsy during day\n• Throat lozenges for sore throat',
                    for_pharmacists: '• Counsel on hydration\n• Rest is important\n• Avoid aspirin in children\n• Warn about overuse of decongestants\n• Consider underlying conditions'
                },
                {
                    name: 'Acute Gastroenteritis',
                    amharic_name: 'አጣዳፊ የሆድ እና አንጀት በሽታ',
                    assessment: '• Diarrhea (watery)\n• Nausea and vomiting\n• Abdominal cramps\n• Mild fever\n• Dehydration risk\n  ◦ Especially in children\n  ◦ Monitor urine output',
                    referral: '• Signs of severe dehydration\n• Blood in stool\n• Fever > 39°C\n• Unable to keep fluids down\n• Infants and elderly at high risk',
                    otc_drug: '• Oral rehydration salts (ORS)\n• Loperamide for adults only\n• Bismuth subsalicylate\n  ◦ Not for children\n• Zinc supplements for children',
                    for_pharmacists: '• Emphasize ORS use\n• Continue breastfeeding\n• Avoid anti-diarrheals in children\n• Hand hygiene education\n• Monitor for dehydration signs'
                },
                {
                    name: 'Mild Allergic Rhinitis',
                    amharic_name: 'ቀላል አለርጂክ የአፍንጫ መታወክ',
                    assessment: '• Sneezing\n• Runny nose (clear)\n• Itchy eyes/nose\n• Nasal congestion\n• Post-nasal drip\n  ◦ Seasonal or perennial\n  ◦ Trigger identification',
                    referral: '• Severe symptoms\n• Asthma symptoms\n• Eye swelling\n• Difficulty breathing\n• Poor response to OTC meds',
                    otc_drug: '• Oral antihistamines (cetirizine, loratadine)\n  ◦ Non-sedating preferred\n• Nasal corticosteroid sprays\n• Antihistamine eye drops\n• Decongestants (limited use)',
                    for_pharmacists: '• Avoid sedating antihistamines for drivers\n• Proper nasal spray technique\n• Environmental control advice\n• Consider allergen avoidance\n• Regular cleaning of AC filters'
                }
            ];

            const { error } = await supabase
                .from('minor_illnesses')
                .insert(sampleIllnesses);

            if (error) throw error;

            setSuccessMessage('Sample illnesses added successfully!');
            fetchIllnesses();

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
                    <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading illnesses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-full pb-8">
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
                                    {isAdmin ? (
                                        `Management guide for ${illnesses.length} common illnesses`
                                    ) : (
                                        "Minor Illnesses database"
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
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Add Illness</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={fetchIllnesses}
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
                                placeholder="Search illnesses..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Admin-only add button */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add New Illness
                            </button>
                        )}
                    </div>
                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        {searchTerm.length >= 2 && (
                            <span>Found {filteredIllnesses.length} illnesses{filteredIllnesses.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
                        )}
                    </div>
                </div>

                {/* Add/Edit Illness Form Modal - ADMIN ONLY with Bullet Point Formatting */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editIllness ? 'Edit Illness' : 'Add New Illness'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                                            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                            title="Formatting Help"
                                        >
                                            <FaInfoCircle />
                                            <span className="hidden sm:inline">Formatting Help</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditIllness(null);
                                                setFormData({
                                                    name: '',
                                                    amharic_name: '',
                                                    assessment: '',
                                                    referral: '',
                                                    otc_drug: '',
                                                    for_pharmacists: ''
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
                                    <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                        <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                            <FaInfoCircle />
                                            Formatting Tips
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-red-700 mb-2">Bullet Points:</p>
                                                <ul className="space-y-1 text-red-600">
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
                                                <p className="font-medium text-red-700 mb-2">Keyboard Shortcuts:</p>
                                                <ul className="space-y-1 text-red-600">
                                                    <li><span className="font-mono bg-red-100 px-1">•</span> - Main bullet</li>
                                                    <li><span className="font-mono bg-red-100 px-1">  ◦</span> - Sub-bullet (2 spaces)</li>
                                                    <li><span className="font-mono bg-red-100 px-1">1.</span> - Numbered item</li>
                                                    <li>Use Tab/Shift+Tab for indentation</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <p className="text-xs text-red-500 mt-2">
                                            Tip: Select text first, then click formatting buttons, or place cursor and start typing.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Basic Info Fields */}
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
                                                Amharic Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.amharic_name}
                                                onChange={(e) => setFormData({ ...formData, amharic_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                                placeholder="e.g., እምቢልታ"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    {/* Assessment Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minor Illness Assessment *
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('assessment', 'bullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('assessment', 'subbullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('assessment', 'number')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('assessment', 'indent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('assessment', 'outdent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="assessment"
                                            value={formData.assessment}
                                            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                                            onFocus={() => setActiveFormatField('assessment')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• First assessment point&#10;  ◦ Sub-bullet point&#10;• Another main point"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Referral Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            When to Refer
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'bullet')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'subbullet')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'number')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'indent')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'outdent')}
                                                className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="referral"
                                            value={formData.referral}
                                            onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                                            onFocus={() => setActiveFormatField('referral')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• When to refer to physician&#10;  ◦ Specific criteria"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* OTC Drug Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            OTC Drug Recommendations
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'bullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'subbullet')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'number')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'indent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'outdent')}
                                                className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="otc_drug"
                                            value={formData.otc_drug}
                                            onChange={(e) => setFormData({ ...formData, otc_drug: e.target.value })}
                                            onFocus={() => setActiveFormatField('otc_drug')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• First medication recommendation&#10;  ◦ Specific dosage or instruction"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* For Pharmacists Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Tips for Pharmacists
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'bullet')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'subbullet')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'number')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'indent')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'outdent')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="for_pharmacists"
                                            value={formData.for_pharmacists}
                                            onChange={(e) => setFormData({ ...formData, for_pharmacists: e.target.value })}
                                            onFocus={() => setActiveFormatField('for_pharmacists')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• Professional advice&#10;  ◦ Specific counseling points"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={editIllness ? handleUpdateIllness : handleAddIllness}
                                        disabled={saving}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                {editIllness ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                {editIllness ? <FaEdit /> : <FaPlus />}
                                                {editIllness ? 'Update Illness' : 'Add Illness'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditIllness(null);
                                            setFormData({
                                                name: '',
                                                amharic_name: '',
                                                assessment: '',
                                                referral: '',
                                                otc_drug: '',
                                                for_pharmacists: ''
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
  
                {/* Display filtered results or empty state */}
                {searchTerm.length >= 2 && filteredIllnesses.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                            {filteredIllnesses.map((illness) => (
                                <div key={illness.id} className="group py-2 border-b border-gray-100 lg:border-0">
                                    <div className="flex items-start gap-2">
                                        <FaThermometerHalf className="text-xs text-red-400 mt-1.5 flex-shrink-0 group-hover:text-red-600 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => setSelectedIllness(illness)}
                                                className="text-left w-full flex items-center gap-1 group/button"
                                            >
                                                <span className="font-bold text-gray-800 hover:text-red-600 transition-colors text-sm md:text-base">
                                                    {illness.name}
                                                </span>
                                                <span className="text-gray-300 group-hover/button:text-red-400 text-xs transition-colors">
                                                    ▶
                                                </span>
                                            </button>
                                            {illness.amharic_name && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {illness.amharic_name}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditIllness(illness)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteIllness(illness.id)}
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
                        <div className="flex flex-wrap gap-3 justify-center">
                            {searchTerm && searchTerm.trim() !== '' && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Clear Search
                                </button>
                            )}
                            {/* Only show admin buttons to admins */}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add Illness
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

                {/* Illness Details Modal - Narrower Width with Enhanced Formatting */}
                {selectedIllness && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-[60%] max-w-[60%] min-w-[300px] max-h-[90vh] overflow-hidden flex flex-col mr-8">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 text-white p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold truncate">{selectedIllness.name}</h2>
                                        {selectedIllness.amharic_name && (
                                            <p className="text-xs font-bold text-red-100 mt-0.5 truncate">
                                                {selectedIllness.amharic_name}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedIllness(null)}
                                        className="text-white hover:text-gray-200 text-lg ml-2 flex-shrink-0"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(160vh - 120px)' }}>
                                <div className="p-3 space-y-2">
                                    {/* Assessment Section */}
                                    {selectedIllness.assessment && (
                                        <div className="bg-red-50 rounded-lg overflow-hidden border border-red-100">
                                            <button
                                                onClick={() => toggleSection('assessment')}
                                                className="w-full bg-red-100 hover:bg-red-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-red-800 flex items-center gap-1 text-xs">
                                                    <FaStethoscope className="text-red-600 text-xs" />
                                                    Minor Illness Assessment:
                                                </h3>
                                                <span className="text-red-600 text-base font-bold">
                                                    {expandedSections.assessment ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.assessment && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedIllness.assessment)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Referral Section */}
                                    {selectedIllness.referral && (
                                        <div className="bg-yellow-50 rounded-lg overflow-hidden border border-yellow-100">
                                            <button
                                                onClick={() => toggleSection('referral')}
                                                className="w-full bg-yellow-100 hover:bg-yellow-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-yellow-800 flex items-center gap-1 text-xs">
                                                    <FaExclamationTriangle className="text-yellow-600 text-xs" />
                                                    When to Refer:
                                                </h3>
                                                <span className="text-yellow-600 text-base font-bold">
                                                    {expandedSections.referral ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.referral && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedIllness.referral)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* OTC Drug Section */}
                                    {selectedIllness.otc_drug && (
                                        <div className="bg-green-50 rounded-lg overflow-hidden border border-green-100">
                                            <button
                                                onClick={() => toggleSection('otc_drug')}
                                                className="w-full bg-green-100 hover:bg-green-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-green-800 flex items-center gap-1 text-xs">
                                                    <FaCapsules className="text-green-600 text-xs" />
                                                    OTC Drug Recommendations:
                                                </h3>
                                                <span className="text-green-600 text-base font-bold">
                                                    {expandedSections.otc_drug ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.otc_drug && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedIllness.otc_drug)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* For Pharmacists Section */}
                                    {selectedIllness.for_pharmacists && (
                                        <div className="bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                                            <button
                                                onClick={() => toggleSection('for_pharmacists')}
                                                className="w-full bg-blue-100 hover:bg-blue-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-blue-800 flex items-center gap-1 text-xs">
                                                    <FaUserMd className="text-blue-600 text-xs" />
                                                    Additional Information:
                                                </h3>
                                                <span className="text-blue-600 text-base font-bold">
                                                    {expandedSections.for_pharmacists ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.for_pharmacists && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedIllness.for_pharmacists)}
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
                                                handleEditIllness(selectedIllness);
                                                setSelectedIllness(null);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaEdit className="text-xs" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteIllness(selectedIllness.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaTrash className="text-xs" /> Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedIllness(null)}
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

export default MinorIllnesses;
