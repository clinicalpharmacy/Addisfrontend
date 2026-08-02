import React, { useState, useEffect, useMemo } from 'react';
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
    FaUserShield,
    FaArrowLeft,
    FaListUl,
    FaIndent,
    FaOutdent,
    FaBold,
    FaItalic,
    FaHashtag
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';


const MedicationInfo = () => {
    const context = useOutletContext();
    // Default to true (protected) if used outside of layout context
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });

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
    const [selectedMedication, setSelectedMedication] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [activeFormatField, setActiveFormatField] = useState(null);
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);


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

    // Use useMemo for filtered medications
    const filteredMeds = useMemo(() => {
        if (!searchTerm.trim()) return medications;
        
        return medications.filter(med =>
            (med.name && med.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (med.amharic_name && med.amharic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (med.usage && med.usage.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (med.side_effects && med.side_effects.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [medications, searchTerm]);

    // Update filtered medications when search changes
    useEffect(() => {
        setFilteredMedications(filteredMeds);
    }, [filteredMeds]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Helper function to convert text to bullet points
    const textToBullets = (text) => {
        if (!text) return [];
        
        // Split by common delimiters: periods, newlines, or semicolons
        const sentences = text
            .replace(/([.!?])\s+/g, '$1|')
            .replace(/;\s+/g, ';|')
            .split('|')
            .filter(sentence => sentence.trim().length > 0)
            .map(sentence => sentence.trim());
        
        return sentences;
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
                // Add bullet point at cursor or wrap selected lines
                if (selectedText.includes('\n')) {
                    // Multiple lines selected - add bullet to each line
                    formattedText = selectedText.split('\n')
                        .map(line => line.trim() ? `• ${line}` : line)
                        .join('\n');
                } else {
                    // Single line or cursor
                    formattedText = selectedText ? `• ${selectedText}` : '• ';
                }
                break;
                
            case 'subbullet':
                // Add sub-bullet (indented)
                if (selectedText.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line.trim() ? `  ◦ ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = selectedText ? `  ◦ ${selectedText}` : '  ◦ ';
                }
                break;
                
            case 'number':
                // Add numbered list
                if (selectedText.includes('\n')) {
                    const lines = selectedText.split('\n').filter(line => line.trim());
                    formattedText = lines
                        .map((line, index) => `${index + 1}. ${line}`)
                        .join('\n');
                } else {
                    formattedText = selectedText ? `1. ${selectedText}` : '1. ';
                }
                break;
                
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
                
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
                
            case 'indent':
                // Add tab/indent to selected lines
                if (selectedText.includes('\n')) {
                    formattedText = selectedText.split('\n')
                        .map(line => line ? `    ${line}` : line)
                        .join('\n');
                } else {
                    formattedText = `    ${selectedText}`;
                }
                break;
                
            case 'outdent':
                // Remove one level of indentation
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

        // Restore cursor position after update
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + formattedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
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

    // DELETE MEDICATION - ADMIN ONLY
    const handleDeleteMedication = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete medications');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this medication? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError('');
        
        try {
            const { error } = await supabase
                .from('medication_information')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccessMessage('Medication deleted successfully');
            
            // Close modal if the deleted medication was selected
            if (selectedMedication?.id === id) {
                setSelectedMedication(null);
            }
            
            // Refresh medication list
            fetchMedications();
            
        } catch (err) {
            console.error('Error deleting medication:', err);
            setError('Failed to delete medication');
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

        if (!window.confirm('This will insert sample medications into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const sampleMedications = [
                {
                    name: 'Amoxicillin',
                    amharic_name: 'አሞክሲሲሊን',
                    usage: '• Bacterial infections: otitis media\n• Pneumonia\n• Urinary tract infections (UTIs)',
                    administration_and_cautions: '• Take orally with or without food\n• Complete full course of treatment\n• Take at evenly spaced intervals',
                    side_effects: '• Diarrhea\n• Nausea\n• Skin rash\n• Allergic reactions in sensitive individuals',
                    storage: '• Store at room temperature\n• Keep away from moisture\n• Protect from light'
                },
                {
                    name: 'Paracetamol',
                    amharic_name: 'ፓራሲታሞል',
                    usage: '• Fever reduction\n• Mild to moderate pain relief\n• Headache\n• Muscle aches',
                    administration_and_cautions: '• Do not exceed recommended dose\n• Maximum 4g per day for adults\n• Avoid with severe liver disease',
                    side_effects: '• Usually well tolerated\n• Rare skin rash\n• Liver damage with overdose',
                    storage: '• Store below 25°C\n• Keep in original container\n• Protect from light'
                },
                {
                    name: 'Ibuprofen',
                    amharic_name: 'አይቡፕሮፌን',
                    usage: '• Inflammation reduction\n• Pain relief\n• Fever reduction\n• Arthritis symptoms',
                    administration_and_cautions: '• Take with food or milk\n• Avoid with stomach ulcers\n• Not for long-term use without supervision',
                    side_effects: '• Stomach upset\n• Heartburn\n• Dizziness\n• Fluid retention',
                    storage: '• Store at room temperature\n• Keep container tightly closed\n• Protect from light'
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

    // Convert textarea text to bullet list with support for nested bullets
    const renderFormattedText = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        
        return lines.map((line, index) => {
            // Check for bullet points (•)
            if (line.trim().startsWith('•')) {
                return (
                    <li key={index} className="ml-4 list-disc text-sm text-gray-700">
                        {line.replace('•', '').trim()}
                    </li>
                );
            }
            // Check for sub-bullets (◦)
            else if (line.trim().startsWith('◦') || line.trim().startsWith('○')) {
                return (
                    <li key={index} className="ml-8 list-circle text-sm text-gray-600">
                        {line.replace(/[◦○]/, '').trim()}
                    </li>
                );
            }
            // Check for numbered items
            else if (/^\d+\./.test(line.trim())) {
                return (
                    <li key={index} className="ml-4 list-decimal text-sm text-gray-700">
                        {line.replace(/^\d+\./, '').trim()}
                    </li>
                );
            }
            // Regular text
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

    return (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                <FaBookMedical className="text-indigo-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">የመድሃኒት መረጃ</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    {isAdmin ? (
                                        // Admin view - shows medication count
                                        <>
                                            Drug information database with {medications.length} medications
                                            <span className="ml-2 text-xs md:text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded inline-flex items-center">
                                                <FaLock className="mr-1" /> Admin View
                                            </span>
                                        </>
                                    ) : (
                                        // User view - no medication count
                                        <>
                                            Drug Information Database
                                            <span className="ml-2 text-xs md:text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded inline-flex items-center">
                                                <FaLock className="mr-1" /> View Only
                                            </span>
                                        </>
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

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="የሚፈልጉትን መድሃኒት ስም ይጻፉ..."
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
                        {searchTerm.length >= 2 && (
                            <span>Found {filteredMedications.length} medication{filteredMedications.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
                        )}
                    </div>
                </div>

                {/* Add/Edit Medication Form Modal - ADMIN ONLY with Bullet Point Formatting */}
                {showAddForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                                            title="Formatting Help"
                                        >
                                            <FaInfoCircle />
                                            <span className="hidden sm:inline">Formatting Help</span>
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
                                            className="text-gray-500 hover:text-gray-700 text-2xl"
                                            disabled={saving}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>

                                {/* Formatting Help Panel */}
                                {showFormattingHelp && (
                                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                        <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                            <FaInfoCircle />
                                            Formatting Tips
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-indigo-700 mb-2">Bullet Points:</p>
                                                <ul className="space-y-1 text-indigo-600">
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
                                                <p className="font-medium text-indigo-700 mb-2">Keyboard Shortcuts:</p>
                                                <ul className="space-y-1 text-indigo-600">
                                                    <li><span className="font-mono bg-indigo-100 px-1">•</span> - Main bullet</li>
                                                    <li><span className="font-mono bg-indigo-100 px-1">  ◦</span> - Sub-bullet (2 spaces)</li>
                                                    <li><span className="font-mono bg-indigo-100 px-1">1.</span> - Numbered item</li>
                                                    <li>Use Tab/Shift+Tab for indentation</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <p className="text-xs text-indigo-500 mt-2">
                                            Tip: Select text first, then click formatting buttons, or place cursor and start typing.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Basic Info Fields */}
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

                                    {/* Usage Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            የመድሃኒቱ ጥቅም: *
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('usage', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('usage', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('usage', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('usage', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('usage', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="usage"
                                            value={formData.usage}
                                            onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                                            onFocus={() => setActiveFormatField('usage')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• First bullet point&#10;  ◦ Sub-bullet point&#10;• Another main point&#10;1. Numbered item"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Administration Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አወሳሰድ እና ጥንቃቄዎች:
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration_and_cautions', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration_and_cautions', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration_and_cautions', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration_and_cautions', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('administration_and_cautions', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="administration_and_cautions"
                                            value={formData.administration_and_cautions}
                                            onChange={(e) => setFormData({ ...formData, administration_and_cautions: e.target.value })}
                                            onFocus={() => setActiveFormatField('administration_and_cautions')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• Take with food&#10;• Avoid alcohol&#10;  ◦ Special caution for elderly"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Side Effects Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            የጎንዮሽ ጉዳቶች:
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('side_effects', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('side_effects', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('side_effects', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('side_effects', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('side_effects', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="side_effects"
                                            value={formData.side_effects}
                                            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                                            onFocus={() => setActiveFormatField('side_effects')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• Nausea&#10;• Headache&#10;  ◦ Mild or severe"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Storage Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            አቀማመጥ:
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('storage', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('storage', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('storage', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('storage', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('storage', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="storage"
                                            value={formData.storage}
                                            onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                            onFocus={() => setActiveFormatField('storage')}
                                            rows="3"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• Store at room temperature&#10;• Keep away from moisture&#10;  ◦ Below 25°C"
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

                {/* Search Results - Show only when search has at least 2 characters */}
                {searchTerm.length >= 2 && (
                    filteredMedications.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">
                                Search Results {filteredMedications.length === 1 ? '(1 medication found)' : `(${filteredMedications.length} medications found)`}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                                {filteredMedications.map((med) => (
                                    <div key={med.id} className="group py-2 border-b border-gray-100 lg:border-0">
                                        <div className="flex items-start gap-2">
                                            <FaPills className="text-xs text-indigo-400 mt-1.5 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => setSelectedMedication(med)}
                                                    className="text-left w-full flex items-center gap-1 group/button"
                                                >
                                                    <span className="font-bold text-gray-800 hover:text-indigo-600 transition-colors text-sm md:text-base">
                                                        {med.name}
                                                    </span>
                                                    <span className="text-gray-300 group-hover/button:text-indigo-400 text-xs transition-colors">
                                                        ▶
                                                    </span>
                                                </button>
                                                {med.amharic_name && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {med.amharic_name}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Admin Actions */}
                                            {isAdmin && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditMedication(med)}
                                                        className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMedication(med.id)}
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
                            
                            {/* Quick tip */}
                            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <span className="font-medium">Tip:</span> Click on a medication name to view full details.
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaPills className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Medications Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                "{searchTerm}" - No medications match your search criteria. Try a different search term.
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                            >
                                Clear Search
                            </button>
                        </div>
                     )
                )}

                {/* Medication Details Modal - With Improved Scrolling */}
                {selectedMedication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-[60%] max-w-[60%] min-w-[300px] max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header - Fixed */}
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex-shrink-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold truncate pr-4">{selectedMedication.name}</h2>
                                        {selectedMedication.amharic_name && (
                                            <p className="text-sm text-indigo-200 mt-1 truncate">
                                                {selectedMedication.amharic_name}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedMedication(null)}
                                        className="text-white hover:text-gray-200 text-xl flex-shrink-0"
                                        aria-label="Close"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Scrollable Content Area - With improved scrolling */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {/* Usage Section */}
                                {selectedMedication.usage && (
                                    <div className="bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                                        <button
                                            onClick={() => toggleSection('usage')}
                                            className="w-full bg-blue-100 hover:bg-blue-200 p-3 text-left flex justify-between items-center transition-colors"
                                        >
                                            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                                <FaInfoCircle className="text-blue-600" />
                                                የመድሃኒቱ ጥቅም:
                                            </h3>
                                            <span className="text-blue-600 text-xl font-bold">
                                                {expandedSections.usage ? '−' : '+'}
                                            </span>
                                        </button>
                                        {expandedSections.usage && (
                                            <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                                                <div className="space-y-1">
                                                    {renderFormattedText(selectedMedication.usage)}
                                                </div>
                                                {/* Show content size indicator for large content */}
                                                {selectedMedication.usage.length > 500 && (
                                                    <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Administration Section */}
                                {selectedMedication.administration_and_cautions && (
                                    <div className="bg-yellow-50 rounded-lg overflow-hidden border border-yellow-100">
                                        <button
                                            onClick={() => toggleSection('administration')}
                                            className="w-full bg-yellow-100 hover:bg-yellow-200 p-3 text-left flex justify-between items-center transition-colors"
                                        >
                                            <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
                                                <FaExclamationTriangle className="text-yellow-600" />
                                                አወሳሰድ እና ጥንቃቄዎች:
                                            </h3>
                                            <span className="text-yellow-600 text-xl font-bold">
                                                {expandedSections.administration ? '−' : '+'}
                                            </span>
                                        </button>
                                        {expandedSections.administration && (
                                            <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-yellow-100">
                                                <div className="space-y-1">
                                                    {renderFormattedText(selectedMedication.administration_and_cautions)}
                                                </div>
                                                {selectedMedication.administration_and_cautions.length > 500 && (
                                                    <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Side Effects Section */}
                                {selectedMedication.side_effects && (
                                    <div className="bg-red-50 rounded-lg overflow-hidden border border-red-100">
                                        <button
                                            onClick={() => toggleSection('sideEffects')}
                                            className="w-full bg-red-100 hover:bg-red-200 p-3 text-left flex justify-between items-center transition-colors"
                                        >
                                            <h3 className="font-semibold text-red-800 flex items-center gap-2">
                                                <FaExclamationCircle className="text-red-600" />
                                                የጎንዮሽ ጉዳቶች:
                                            </h3>
                                            <span className="text-red-600 text-xl font-bold">
                                                {expandedSections.sideEffects ? '−' : '+'}
                                            </span>
                                        </button>
                                        {expandedSections.sideEffects && (
                                            <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100">
                                                <div className="space-y-1">
                                                    {renderFormattedText(selectedMedication.side_effects)}
                                                </div>
                                                {selectedMedication.side_effects.length > 500 && (
                                                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Storage Section */}
                                {selectedMedication.storage && (
                                    <div className="bg-green-50 rounded-lg overflow-hidden border border-green-100">
                                        <button
                                            onClick={() => toggleSection('storage')}
                                            className="w-full bg-green-100 hover:bg-green-200 p-3 text-left flex justify-between items-center transition-colors"
                                        >
                                            <h3 className="font-semibold text-green-800 flex items-center gap-2">
                                                <FaCheckCircle className="text-green-600" />
                                                አቀማመጥ:
                                            </h3>
                                            <span className="text-green-600 text-xl font-bold">
                                                {expandedSections.storage ? '−' : '+'}
                                            </span>
                                        </button>
                                        {expandedSections.storage && (
                                            <div className="p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100">
                                                <div className="space-y-1">
                                                    {renderFormattedText(selectedMedication.storage)}
                                                </div>
                                                {selectedMedication.storage.length > 300 && (
                                                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions - Fixed */}
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 flex justify-end gap-2 flex-shrink-0">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleEditMedication(selectedMedication);
                                                setSelectedMedication(null);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMedication(selectedMedication.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedMedication(null)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm"
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

export default MedicationInfo;
