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
    FaBookMedical,
    FaTimes,
    FaSync,
    FaLock,
    FaBan,
    FaEyeSlash,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaSpinner,
    FaChevronDown,
    FaChevronUp,
    FaListUl,
    FaIndent,
    FaOutdent,
    FaHashtag,
    FaInfoCircle,
    FaTrash,
    FaDatabase
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';

const MinorIllnesses = () => {
    const context = useOutletContext();
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });
    const protectionMsg = useScreenshotProtection(protectionEnabled);
    
    const [illnesses, setIllnesses] = useState([]);
    const [filteredIllnesses, setFilteredIllnesses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editIllness, setEditIllness] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedCards, setExpandedCards] = useState({});
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);
    const [activeFormatField, setActiveFormatField] = useState(null);
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

    useEffect(() => {
        fetchIllnesses();
    }, []);

    const fetchIllnesses = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('minor_illnesses')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                setIllnesses(data);
                setFilteredIllnesses(data);
            }
        } catch (err) {
            console.error('Error fetching illnesses:', err);
            setError('Failed to load illnesses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Use useMemo for filtered illnesses
    const filteredIlls = useMemo(() => {
        if (!searchTerm.trim()) return illnesses;
        
        return illnesses.filter(illness =>
            (illness.name && illness.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (illness.amharic_name && illness.amharic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (illness.assessment && illness.assessment.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [illnesses, searchTerm]);

    // Update filtered illnesses when search changes
    useEffect(() => {
        setFilteredIllnesses(filteredIlls);
    }, [filteredIlls]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Toggle card expansion when clicking on name/amharic name
    const toggleCard = (illnessId) => {
        setExpandedCards(prev => ({
            ...prev,
            [illnessId]: !prev[illnessId]
        }));
    };

    // Helper function to convert text to bullet points with hierarchy
    const textToBullets = (text) => {
        if (!text) return [];
        
        const lines = text.split('\n');
        return lines.map(line => line.trim()).filter(line => line.length > 0);
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
                // Add sub-bullet (indented with two spaces)
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

    // Initialize database with sample data - ADMIN ONLY
    const initializeDatabase = async () => {
        if (!isAdmin) {
            setError('Only administrators can initialize the database');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('This will insert sample minor illnesses into the database. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const sampleIllnesses = [
                {
                    name: 'Common Cold',
                    amharic_name: 'እምቢልታ',
                    assessment: '• Runny or stuffy nose\n• Sneezing\n• Sore throat\n• Mild cough\n• Low-grade fever\n  ◦ Usually below 38.5°C\n• Symptoms develop gradually',
                    referral: '• High fever (>38.5°C for more than 3 days)\n• Severe headache\n• Chest pain or difficulty breathing\n• Symptoms lasting more than 10 days\n  ◦ Especially in elderly or immunocompromised',
                    otc_drug: '• Paracetamol for fever/pain\n• Decongestants (pseudoephedrine)\n  ◦ Use with caution in hypertension\n• Antihistamines for runny nose\n• Cough suppressants for dry cough\n  ◦ Dextromethorphan based',
                    for_pharmacists: '• Check for medication interactions\n• Advise on proper hydration\n• Warn about drowsiness with first-gen antihistamines\n• Recommend rest and vitamin C\n  ◦ Evidence limited but safe'
                },
                {
                    name: 'Gastroenteritis',
                    amharic_name: 'የሆድ እብጠት',
                    assessment: '• Diarrhea (watery, 3+ times/day)\n• Nausea and vomiting\n• Abdominal cramps\n• Mild fever possible\n• Assess hydration status\n  ◦ Check skin turgor\n  ◦ Monitor urine output\n  ◦ Look for dry mucous membranes',
                    referral: '• Signs of severe dehydration\n  ◦ No urine for 8+ hours\n  ◦ Dizziness on standing\n  ◦ Sunken eyes\n• Blood in stool\n• High fever (>39°C)\n• Severe abdominal pain',
                    otc_drug: '• Oral rehydration salts (ORS)\n  ◦ Most important intervention\n• Loperamide for diarrhea\n  ◦ Not if bloody diarrhea or fever\n• Antiemetics for vomiting\n  ◦ Ondansetron if severe',
                    for_pharmacists: '• Emphasize ORS importance\n• Discuss BRAT diet\n  ◦ Bananas\n  ◦ Rice\n  ◦ Applesauce\n  ◦ Toast\n• Warn about dairy products\n• Review medication interactions'
                },
                {
                    name: 'Headache (Tension Type)',
                    amharic_name: 'ራስ ምታት',
                    assessment: '• Bilateral, pressing/tightening quality\n• Mild to moderate intensity\n• Not aggravated by routine activity\n• No nausea or vomiting\n• May have photophobia or phonophobia\n  ◦ But not both',
                    referral: '• Sudden, severe thunderclap headache\n• Headache with fever and neck stiffness\n• Headache after head injury\n• New headache in patient >50\n• Headache with neurological symptoms\n  ◦ Vision changes\n  ◦ Weakness\n  ◦ Speech difficulties',
                    otc_drug: '• Paracetamol (first-line)\n  ◦ 500-1000mg every 4-6 hours\n• Ibuprofen\n  ◦ 200-400mg with food\n  ◦ Avoid if history of ulcers\n• Combination products\n  ◦ Use with caution due to caffeine',
                    for_pharmacists: '• Assess for medication overuse headache\n  ◦ If using painkillers >15 days/month\n• Discuss trigger identification\n  ◦ Stress\n  ◦ Dehydration\n  ◦ Poor sleep\n  ◦ Caffeine withdrawal\n• Recommend lifestyle modifications'
                }
            ];

            const { data, error } = await supabase
                .from('minor_illnesses')
                .insert(sampleIllnesses)
                .select();

            if (error) throw error;

            setSuccess('Sample illnesses added successfully!');
            fetchIllnesses();

        } catch (err) {
            console.error('Error initializing database:', err);
            setError('Failed to initialize database');
        } finally {
            setLoading(false);
        }
    };

    // ADD/EDIT ILLNESS - ADMIN ONLY
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            setError('Only administrators can add or edit illnesses');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Basic validation
        if (!formData.name.trim()) {
            setError('Illness name is required');
            return;
        }

        if (!formData.assessment.trim()) {
            setError('How to assess the illness is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const illnessData = {
                name: formData.name.trim(),
                amharic_name: formData.amharic_name.trim() || '',
                assessment: formData.assessment.trim(),
                referral: formData.referral.trim() || '',
                otc_drug: formData.otc_drug.trim() || '',
                for_pharmacists: formData.for_pharmacists.trim() || '',
                updated_at: new Date().toISOString()
            };

            if (editIllness) {
                const { error } = await supabase
                    .from('minor_illnesses')
                    .update(illnessData)
                    .eq('id', editIllness.id);

                if (error) throw error;
                setSuccess('Illness updated successfully!');
            } else {
                const { error } = await supabase
                    .from('minor_illnesses')
                    .insert([{
                        ...illnessData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                setSuccess('Illness added successfully!');
            }

            fetchIllnesses();
            resetForm();

        } catch (err) {
            console.error('Error saving illness:', err);
            setError('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (illness) => {
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

            setSuccess('Illness deleted successfully');
            
            // Refresh illnesses list
            fetchIllnesses();
            
        } catch (err) {
            console.error('Error deleting illness:', err);
            setError('Failed to delete illness');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amharic_name: '',
            assessment: '',
            referral: '',
            otc_drug: '',
            for_pharmacists: ''
        });
        setEditIllness(null);
        setShowForm(false);
        setError('');
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
                    <p className="mt-3 text-gray-600">Loading illnesses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            {protectionMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                        <FaShieldAlt className="text-xl" />
                        <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
                    </div>
                </div>
            )}
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
                                    Management guide for {illnesses.length} common illnesses
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
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
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
                                onChange={handleSearchChange}
                                placeholder="Search illnesses..."
                                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Only show add button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg items-center justify-center gap-2 font-medium"
                            >
                                <FaPlus /> Add Illness
                            </button>
                        )}
                    </div>

                    <div className="mt-4 text-xs md:text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                        <span>Showing {filteredIllnesses.length} of {illnesses.length} illnesses</span>
                        {!isAdmin && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Read-only</span>}
                        {protectionEnabled && !isAdmin && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><FaLock size={10} /> Protected</span>}
                    </div>
                </div>

                {/* Illnesses Grid - with enhanced bullet point formatting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {filteredIllnesses.length > 0 ? (
                        filteredIllnesses.map((illness) => (
                            <div
                                key={illness.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 illness-content"
                            >
                                <div className="p-3 md:p-6">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        {/* Clickable name/amharic name section */}
                                        <div 
                                            className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                            onClick={() => toggleCard(illness.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{illness.name}</h3>
                                                {expandedCards[illness.id] ? 
                                                    <FaChevronUp className="text-gray-500 text-sm" /> : 
                                                    <FaChevronDown className="text-gray-500 text-sm" />
                                                }
                                            </div>
                                            {illness.amharic_name && (
                                                <p className="text-xs md:text-sm text-gray-600 mb-2">{illness.amharic_name}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Only show edit/delete buttons for admins */}
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(illness)}
                                                        className="text-blue-500 hover:text-blue-700 p-1"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIllness(illness.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Delete"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* All content sections - only shown when card is expanded */}
                                    {expandedCards[illness.id] && (
                                        <>
                                            {illness.assessment && (
                                                <div className="mb-3 md:mb-4">
                                                    <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                        <FaStethoscope className="text-xs md:text-sm" /> Minor Illness Assessment:
                                                    </h4>
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(illness.assessment)}
                                                    </ul>
                                                </div>
                                            )}

                                            {illness.referral && (
                                                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-50 border border-yellow-100 rounded">
                                                    <h4 className="font-semibold text-yellow-700 mb-1 text-sm md:text-base">When to Refer:</h4>
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(illness.referral)}
                                                    </ul>
                                                </div>
                                            )}

                                            {illness.otc_drug && (
                                                <div className="mb-3 md:mb-4">
                                                    <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 flex items-center gap-1 text-sm md:text-base">
                                                        <FaCapsules className="text-xs md:text-sm" /> OTC Drug Recommendations:
                                                    </h4>
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(illness.otc_drug)}
                                                    </ul>
                                                </div>
                                            )}

                                            {illness.for_pharmacists && (
                                                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 border border-blue-100 rounded">
                                                    <h4 className="font-semibold text-blue-700 mb-1 flex items-center gap-1 text-sm md:text-base">
                                                        <FaUserMd className="text-xs md:text-sm" /> Additional information:
                                                    </h4>
                                                    <ul className="space-y-0.5">
                                                        {renderFormattedText(illness.for_pharmacists)}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                                                Last updated: {new Date(illness.created_at).toLocaleDateString()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaBookMedical className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Illnesses Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm
                                    ? 'No illnesses match your search. Try a different term.'
                                    : 'No minor illnesses added yet.'}
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        handleSearchChange({ target: { value: '' } });
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Clear Search
                                </button>
                                {/* Only show add button for admins */}
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                        >
                                            <FaPlus /> Add Illness
                                        </button>
                                        <button
                                            onClick={initializeDatabase}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                        >
                                            <FaDatabase /> Add Sample Data
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit Form Modal - ADMIN ONLY with Bullet Point Formatting */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editIllness ? 'Edit Illness' : 'Add Illness'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                                            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                            title="Formatting Help"
                                        >
                                            <FaInfoCircle />
                                            <span className="hidden sm:inline">Formatting Help</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetForm}
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
                                                Amharic Name (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.amharic_name}
                                                onChange={(e) => setFormData({ ...formData, amharic_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
                                                placeholder="እምቢልታ"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    {/* Assessment Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How to Assess Minor Illness *
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
                                            rows="6"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• Runny or stuffy nose&#10;• Sneezing&#10;  ◦ Usually mild to moderate&#10;• Sore throat&#10;1. First symptom appears"
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
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'subbullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'number')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'indent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('referral', 'outdent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
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
                                            rows="5"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• High fever (>38.5°C for more than 3 days)&#10;• Severe headache&#10;  ◦ Especially if sudden onset&#10;• Chest pain or difficulty breathing"
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
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'subbullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'number')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'indent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('otc_drug', 'outdent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
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
                                            rows="5"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• Paracetamol for fever/pain&#10;• Decongestants (pseudoephedrine)&#10;  ◦ Use with caution in hypertension&#10;• Antihistamines for runny nose"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* For Pharmacists Field with Formatting Toolbar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional tips to the Pharmacist
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'bullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add bullet point"
                                                disabled={saving}
                                            >
                                                <FaListUl />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'subbullet')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add sub-bullet"
                                                disabled={saving}
                                            >
                                                <span className="text-lg font-bold">◦</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'number')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Add numbered list"
                                                disabled={saving}
                                            >
                                                <FaHashtag />
                                            </button>
                                            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'indent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                title="Indent"
                                                disabled={saving}
                                            >
                                                <FaIndent />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormatting('for_pharmacists', 'outdent')}
                                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
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
                                            rows="5"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                                            placeholder="• Check for medication interactions&#10;• Advise on proper hydration&#10;  ◦ Emphasize importance of fluids&#10;• Warn about drowsiness"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                {editIllness ? 'Update Illness' : 'Add Illness'}
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

                {/* Summary Footer */}
                {filteredIllnesses.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{illnesses.length}</div>
                                <div className="text-sm text-gray-600">Total Illnesses</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {illnesses.filter(i => i.amharic_name).length}
                                </div>
                                <div className="text-sm text-gray-600">With Amharic Names</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {illnesses.filter(i => i.referral).length}
                                </div>
                                <div className="text-sm text-gray-600">With Referral Info</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{filteredIllnesses.length}</div>
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

export default MinorIllnesses;
