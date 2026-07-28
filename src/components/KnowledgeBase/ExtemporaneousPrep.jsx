import React, { useState, useEffect, useMemo } from 'react';
import supabase from '../../utils/supabase';
import {
    FaMortarPestle,
    FaVial,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaPrescriptionBottle,
    FaClock,
    FaTemperatureLow,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimes,
    FaSync,
    FaLock,
    FaSpinner,
    FaBookOpen,
    FaUserShield,
    FaTag,
    FaInfoCircle,
    FaDatabase,
    FaListUl,
    FaIndent,
    FaOutdent,
    FaHashtag,
    FaFlask,
    FaWeight,
    FaRuler,
    FaTemperatureHigh,
    FaCalendarAlt
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
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedPrep, setSelectedPrep] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [activeFormatField, setActiveFormatField] = useState(null);
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);

    const [formData, setFormData] = useState({
        formula_name: '',
        materials: '',
        preparation_steps: '',
        label_instructions: '',
        storage_info: '',
        stability_info: '',
        use_indication: ''
    });

    // Check user role on component mount
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // STRICT CHECK: Only 'admin' role gets full access
                setIsAdmin(parsedUser.role === 'admin');
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, []);

    // FETCH PREPARATIONS FROM DATABASE
    const fetchPreparations = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching preparations from database...');

            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .select('*')
                .order('formula_name', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Fetched preparations:', data);

            if (data && data.length > 0) {
                setPreparations(data);
                setFilteredPreparations(data);
            } else {
                console.log('No preparations found in database');
                setPreparations([]);
                setFilteredPreparations([]);
            }
        } catch (err) {
            console.error('❌ Error fetching preparations:', err);
            setError(err.message || 'Failed to load preparations.');
            setPreparations([]);
            setFilteredPreparations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreparations();
    }, []);

    // Use useMemo for filtered preparations
    const filteredPreps = useMemo(() => {
        if (!searchTerm.trim()) return preparations;
        
        return preparations.filter(prep =>
            (prep.formula_name && prep.formula_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (prep.materials && prep.materials.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (prep.preparation_steps && prep.preparation_steps.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (prep.use_indication && prep.use_indication.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [preparations, searchTerm]);

    // Update filtered preparations when search changes
    useEffect(() => {
        setFilteredPreparations(filteredPreps);
    }, [filteredPreps]);

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

    // ADD PREPARATION TO DATABASE - ADMIN ONLY
    const handleAddPrep = async () => {
        if (!isAdmin) {
            setError('Only administrators can add preparations');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.formula_name.trim()) {
            setError('Please enter a formula name');
            return;
        }

        if (!formData.materials.trim()) {
            setError('Please enter materials information');
            return;
        }

        if (!formData.preparation_steps.trim()) {
            setError('Please enter preparation steps');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Saving preparation:', formData);

            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .insert([{
                    formula_name: formData.formula_name,
                    use_indication: formData.use_indication,
                    materials: formData.materials,
                    preparation_steps: formData.preparation_steps,
                    label_instructions: formData.label_instructions,
                    storage_info: formData.storage_info,
                    stability_info: formData.stability_info,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Preparation saved:', data);

            setSuccessMessage('Preparation added successfully!');

            setFormData({
                formula_name: '',
                materials: '',
                preparation_steps: '',
                label_instructions: '',
                storage_info: '',
                stability_info: '',
                use_indication: ''
            });

            setShowForm(false);

            setTimeout(() => {
                fetchPreparations();
            }, 1000);

        } catch (err) {
            console.error('Error saving preparation:', err);
            setError(`Failed to save preparation: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // EDIT PREPARATION - ADMIN ONLY
    const handleEditPrep = (prep) => {
        if (!isAdmin) {
            setError('Only administrators can edit preparations');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditPrep(prep);
        setFormData({
            formula_name: prep.formula_name || '',
            use_indication: prep.use_indication || '',
            materials: prep.materials || '',
            preparation_steps: prep.preparation_steps || '',
            label_instructions: prep.label_instructions || '',
            storage_info: prep.storage_info || '',
            stability_info: prep.stability_info || ''
        });
        setShowForm(true);
    };

    // UPDATE PREPARATION IN DATABASE - ADMIN ONLY
    const handleUpdatePrep = async () => {
        if (!isAdmin) {
            setError('Only administrators can update preparations');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.formula_name.trim()) {
            setError('Please enter a formula name');
            return;
        }

        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log('Updating preparation:', editPrep.id, formData);

            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .update({
                    formula_name: formData.formula_name,
                    use_indication: formData.use_indication,
                    materials: formData.materials,
                    preparation_steps: formData.preparation_steps,
                    label_instructions: formData.label_instructions,
                    storage_info: formData.storage_info,
                    stability_info: formData.stability_info,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editPrep.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Preparation updated:', data);

            setSuccessMessage('Preparation updated successfully!');

            setFormData({
                formula_name: '',
                materials: '',
                preparation_steps: '',
                label_instructions: '',
                storage_info: '',
                stability_info: '',
                use_indication: ''
            });

            setShowForm(false);
            setEditPrep(null);

            setTimeout(() => {
                fetchPreparations();
            }, 1000);

        } catch (err) {
            console.error('Error updating preparation:', err);
            setError(`Failed to update preparation: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // DELETE PREPARATION - ADMIN ONLY
    const handleDeletePrep = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete preparations');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this preparation? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError('');
        
        try {
            const { error } = await supabase
                .from('extemporaneous_preparations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccessMessage('Preparation deleted successfully');
            
            if (selectedPrep?.id === id) {
                setSelectedPrep(null);
            }
            
            fetchPreparations();
            
        } catch (err) {
            console.error('Error deleting preparation:', err);
            setError('Failed to delete preparation');
        } finally {
            setSaving(false);
        }
    };

    // Initialize database if empty - ADMIN ONLY
    const initializeSampleData = async () => {
        if (!isAdmin) {
            setError('Only administrators can initialize the database');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('This will insert sample compounding formulas into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const samplePreparations = [
                {
                    formula_name: 'Amoxicillin Oral Suspension 250mg/5mL',
                    use_indication: '• Pediatric bacterial infections\n• Otitis media\n• Streptococcal pharyngitis',
                    materials: '• Amoxicillin trihydrate: 5g\n• Purified water: qs to 100mL\n• Preservative: 0.1% methylparaben\n• Flavor: Raspberry syrup 10mL\n  ◦ Sugar-free option available',
                    preparation_steps: '1. Weigh all ingredients accurately using calibrated scale\n2. Place amoxicillin powder in a mortar\n   ◦ Triturate to fine powder if clumps present\n3. Add preservative and mix geometrically\n4. Gradually add flavor while mixing\n5. Transfer to calibrated bottle\n6. Add purified water to final volume (100mL)\n7. Shake vigorously until uniform suspension',
                    label_instructions: '• SHAKE WELL BEFORE EACH USE\n• Refrigerate at 2-8°C\n• Discard unused portion after 14 days\n• For oral use only',
                    storage_info: 'Refrigerate (2-8°C)',
                    stability_info: '14 Days'
                },
                {
                    formula_name: 'Zinc Oxide Paste 20%',
                    use_indication: '• Diaper rash\n• Skin protection\n• Minor skin irritations\n• Moisture barrier',
                    materials: '• Zinc Oxide: 20g\n  ◦ Fine powder grade\n• Corn Starch: 20g\n• White Petrolatum: 60g\n• Optional: Calamine 5g for soothing effect',
                    preparation_steps: '1. Sift zinc oxide and starch together through fine mesh sieve\n   ◦ Removes lumps and ensures uniform particle size\n2. Place white petrolatum in a mixing bowl\n3. Gradually incorporate the powder mixture into petrolatum\n   ◦ Use geometric dilution method\n4. Mix with spatula on ointment slab until smooth and uniform\n5. Transfer to ointment jars',
                    label_instructions: '• FOR EXTERNAL USE ONLY\n• Apply thin layer to affected area\n• Avoid contact with eyes\n• Not for use on broken skin',
                    storage_info: 'Room Temperature (15-25°C)',
                    stability_info: '6 Months'
                },
                {
                    formula_name: 'Hydrocortisone Lotion 1%',
                    use_indication: '• Eczema\n• Contact dermatitis\n• Insect bites\n• Mild inflammatory skin conditions',
                    materials: '• Hydrocortisone powder: 1g\n• Propylene glycol: 10mL\n• Purified water: 40mL\n• Ethanol (95%): 25mL\n• Glycerin: 5mL\n• Preserved water qs to 100mL',
                    preparation_steps: '1. Dissolve hydrocortisone in ethanol and propylene glycol mixture\n2. Add glycerin and mix well\n3. Gradually add purified water while stirring\n4. Add preserved water to volume\n5. Mix until homogenous solution\n6. Package in amber glass bottle',
                    label_instructions: '• SHAKE WELL BEFORE USE\n• Apply sparingly to affected areas\n• For external use only\n• Avoid prolonged use on face',
                    storage_info: 'Cool place, protect from light',
                    stability_info: '30 Days'
                }
            ];

            const { error } = await supabase
                .from('extemporaneous_preparations')
                .insert(samplePreparations);

            if (error) throw error;

            setSuccessMessage('Sample formulas added successfully!');
            fetchPreparations();

        } catch (err) {
            console.error('Error adding sample data:', err);
            setError(`Failed: ${err.message}`);
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
                    <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading compounding formulas...</p>
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
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                <FaMortarPestle className="text-indigo-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Compounding Formulas</h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    {isAdmin ? (
                                        `Extemporaneous preparation database with ${preparations.length} formulas`
                                    ) : (
                                        "Extemporaneous preparation database"
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
                                        onClick={initializeSampleData}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                        title="Add sample data"
                                    >
                                        <FaDatabase /> <span className="hidden sm:inline">Initialize DB</span>
                                    </button>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Add Formula</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={fetchPreparations}
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
                                placeholder="Search by formula name, materials, or indication..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Admin-only add button */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add New Formula
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}
                    </div>
                </div>

                {/* Add/Edit Preparation Form Modal - ADMIN ONLY with Bullet Point Formatting */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editPrep ? 'Edit Formula' : 'Add New Formula'}
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
                                                setShowForm(false);
                                                setEditPrep(null);
                                                setFormData({
                                                    formula_name: '',
                                                    materials: '',
                                                    preparation_steps: '',
                                                    label_instructions: '',
                                                    storage_info: '',
                                                    stability_info: '',
                                                    use_indication: ''
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
                                                        <span>Use for numbered lists (preparation steps)</span>
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
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Formula Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.formula_name}
                                                onChange={(e) => setFormData({ ...formData, formula_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g., Amoxicillin Oral Suspension 250mg/5mL"
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Clinical Indication / Use
                                            </label>
                                            <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => insertFormatting('use_indication', 'bullet')}
                                                    className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                    title="Add bullet point"
                                                    disabled={saving}
                                                >
                                                    <FaListUl />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => insertFormatting('use_indication', 'subbullet')}
                                                    className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                    title="Add sub-bullet"
                                                    disabled={saving}
                                                >
                                                    <span className="text-lg font-bold">◦</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => insertFormatting('use_indication', 'number')}
                                                    className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                    title="Add numbered list"
                                                    disabled={saving}
                                                >
                                                    <FaHashtag />
                                                </button>
                                                <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => insertFormatting('use_indication', 'indent')}
                                                    className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                    title="Indent"
                                                    disabled={saving}
                                                >
                                                    <FaIndent />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => insertFormatting('use_indication', 'outdent')}
                                                    className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                    title="Outdent"
                                                    disabled={saving}
                                                >
                                                    <FaOutdent />
                                                </button>
                                            </div>
                                            <textarea
                                                id="use_indication"
                                                value={formData.use_indication}
                                                onChange={(e) => setFormData({ ...formData, use_indication: e.target.value })}
                                                onFocus={() => setActiveFormatField('use_indication')}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                                placeholder="• Indication 1&#10;• Indication 2&#10;  ◦ Sub-indication"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    {/* Materials Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Materials & Composition *
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('materials', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('materials', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('materials', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('materials', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('materials', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="materials"
                                            value={formData.materials}
                                            onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                                            onFocus={() => setActiveFormatField('materials')}
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• Ingredient 1: quantity&#10;  ◦ Specific grade or note&#10;• Ingredient 2: quantity"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Preparation Steps Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Preparation Steps *
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('preparation_steps', 'bullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('preparation_steps', 'subbullet')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('preparation_steps', 'number')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Add numbered list (recommended for steps)"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('preparation_steps', 'indent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('preparation_steps', 'outdent')}
                                                className="p-2 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="preparation_steps"
                                            value={formData.preparation_steps}
                                            onChange={(e) => setFormData({ ...formData, preparation_steps: e.target.value })}
                                            onFocus={() => setActiveFormatField('preparation_steps')}
                                            rows="6"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="1. First step&#10;   ◦ Sub-step or note&#10;2. Second step&#10;3. Third step"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Label Instructions Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Auxiliary Labeling
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('label_instructions', 'bullet')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('label_instructions', 'subbullet')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('label_instructions', 'number')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('label_instructions', 'indent')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('label_instructions', 'outdent')}
                                                className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="Outdent"
                                                disabled={saving}
                                            >
                                                <FaOutdent />
                                            </button>
                                        </div>
                                        <textarea
                                            id="label_instructions"
                                            value={formData.label_instructions}
                                            onChange={(e) => setFormData({ ...formData, label_instructions: e.target.value })}
                                            onFocus={() => setActiveFormatField('label_instructions')}
                                            rows="3"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="• SHAKE WELL BEFORE USE&#10;• Refrigerate&#10;  ◦ Do not freeze"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Storage and Stability Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Storage Conditions
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.storage_info}
                                                onChange={(e) => setFormData({ ...formData, storage_info: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g., Refrigerate (2-8°C)"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Beyond Use Date (BUD)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.stability_info}
                                                onChange={(e) => setFormData({ ...formData, stability_info: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g., 14 days, 6 months"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        onClick={editPrep ? handleUpdatePrep : handleAddPrep}
                                        disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                {editPrep ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                {editPrep ? <FaEdit /> : <FaPlus />}
                                                {editPrep ? 'Update Formula' : 'Add Formula'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditPrep(null);
                                            setFormData({
                                                formula_name: '',
                                                materials: '',
                                                preparation_steps: '',
                                                label_instructions: '',
                                                storage_info: '',
                                                stability_info: '',
                                                use_indication: ''
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

                {/* Preparations Grid - Four Columns as Bold Lines */}
                {searchTerm && searchTerm.trim() !== '' && filteredPreparations.length > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                        Found {filteredPreparations.length} formula{filteredPreparations.length !== 1 ? 's' : ''}
                    </div>
                )}
                {searchTerm.length >= 2 && filteredPreparations.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                            {filteredPreparations.map((prep) => (
                                <div key={prep.id} className="group py-2 border-b border-gray-100 lg:border-0">
                                    <div className="flex items-start gap-2">
                                        <FaPrescriptionBottle className="text-xs text-indigo-400 mt-1.5 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => setSelectedPrep(prep)}
                                                className="text-left w-full flex items-center gap-1 group/button"
                                            >
                                                <span className="font-bold text-gray-800 hover:text-indigo-600 transition-colors text-sm md:text-base">
                                                    {prep.formula_name}
                                                </span>
                                                <span className="text-gray-300 group-hover/button:text-indigo-400 text-xs transition-colors">
                                                    ▶
                                                </span>
                                            </button>
                                            {prep.use_indication && (
                                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {prep.use_indication.split('\n')[0].replace('•', '').trim()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditPrep(prep)}
                                                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrep(prep.id)}
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
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
                                        <FaPlus /> Add Formula
                                    </button>
                                    <button
                                        onClick={initializeSampleData}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaDatabase /> Add Sample Data
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                {/* Initial state - no search entered */}
                {searchTerm.length < 2 && (
                    <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                        <h3 className="text-xl font-medium text-gray-800 mb-2">Search for Formulas</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Type at least 2 characters of formula name, materials, or indication to search the compounding formula database.
                        </p>
                    </div>
                )}
                {/* Preparation Details Modal - Narrower Width with Enhanced Formatting */}
                {selectedPrep && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-[60%] max-w-[60%] min-w-[300px] max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold truncate">{selectedPrep.formula_name}</h2>
                                        {selectedPrep.use_indication && (
                                            <p className="text-xs font-bold text-indigo-100 mt-0.5 truncate">
                                                {selectedPrep.use_indication.split('\n')[0].replace('•', '').trim()}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedPrep(null)}
                                        className="text-white hover:text-gray-200 text-lg ml-2 flex-shrink-0"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(160vh - 120px)' }}>
                               <div className="p-3 space-y-2">
                                    {/* Indication Section */}
                                    {selectedPrep.use_indication && (
                                        <div className="bg-purple-50 rounded-lg overflow-hidden border border-purple-100">
                                            <button
                                                onClick={() => toggleSection('indication')}
                                                className="w-full bg-purple-100 hover:bg-purple-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-purple-800 flex items-center gap-1 text-xs">
                                                    <FaInfoCircle className="text-purple-600 text-xs" />
                                                    Clinical Indication:
                                                </h3>
                                                <span className="text-purple-600 text-base font-bold">
                                                    {expandedSections.indication ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.indication && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedPrep.use_indication)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Materials Section */}
                                    {selectedPrep.materials && (
                                        <div className="bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100">
                                            <button
                                                onClick={() => toggleSection('materials')}
                                                className="w-full bg-indigo-100 hover:bg-indigo-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-indigo-800 flex items-center gap-1 text-xs">
                                                    <FaFlask className="text-indigo-600 text-xs" />
                                                    Materials & Composition:
                                                </h3>
                                                <span className="text-indigo-600 text-base font-bold">
                                                    {expandedSections.materials ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.materials && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedPrep.materials)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Preparation Steps Section */}
                                    {selectedPrep.preparation_steps && (
                                        <div className="bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                                            <button
                                                onClick={() => toggleSection('steps')}
                                                className="w-full bg-blue-100 hover:bg-blue-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-blue-800 flex items-center gap-1 text-xs">
                                                    <FaBookOpen className="text-blue-600 text-xs" />
                                                    Preparation Steps:
                                                </h3>
                                                <span className="text-blue-600 text-base font-bold">
                                                    {expandedSections.steps ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.steps && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedPrep.preparation_steps)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Label Instructions Section */}
                                    {selectedPrep.label_instructions && (
                                        <div className="bg-yellow-50 rounded-lg overflow-hidden border border-yellow-100">
                                            <button
                                                onClick={() => toggleSection('label')}
                                                className="w-full bg-yellow-100 hover:bg-yellow-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-yellow-800 flex items-center gap-1 text-xs">
                                                    <FaTag className="text-yellow-600 text-xs" />
                                                    Auxiliary Labeling:
                                                </h3>
                                                <span className="text-yellow-600 text-base font-bold">
                                                    {expandedSections.label ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.label && (
                                                <div className="p-2">
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(selectedPrep.label_instructions)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Storage & Stability - Combined Section */}
                                    {(selectedPrep.storage_info || selectedPrep.stability_info) && (
                                        <div className="bg-green-50 rounded-lg overflow-hidden border border-green-100">
                                            <button
                                                onClick={() => toggleSection('storage')}
                                                className="w-full bg-green-100 hover:bg-green-200 p-2 text-left flex justify-between items-center transition-colors"
                                            >
                                                <h3 className="font-semibold text-green-800 flex items-center gap-1 text-xs">
                                                    <FaTemperatureLow className="text-green-600 text-xs" />
                                                    Storage & Stability:
                                                </h3>
                                                <span className="text-green-600 text-base font-bold">
                                                    {expandedSections.storage ? '−' : '+'}
                                                </span>
                                            </button>
                                            {expandedSections.storage && (
                                                <div className="p-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {selectedPrep.storage_info && (
                                                            <div className="bg-white p-2 rounded border border-green-100">
                                                                <p className="text-xs text-green-600 font-medium mb-1">Storage</p>
                                                                <p className="text-sm">{selectedPrep.storage_info}</p>
                                                            </div>
                                                        )}
                                                        {selectedPrep.stability_info && (
                                                            <div className="bg-white p-2 rounded border border-green-100">
                                                                <p className="text-xs text-green-600 font-medium mb-1">BUD</p>
                                                                <p className="text-sm">{selectedPrep.stability_info}</p>
                                                            </div>
                                                        )}
                                                    </div>
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
                                                handleEditPrep(selectedPrep);
                                                setSelectedPrep(null);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaEdit className="text-xs" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeletePrep(selectedPrep.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs"
                                        >
                                            <FaTrash className="text-xs" /> Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedPrep(null)}
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

export default ExtemporaneousPrep;
