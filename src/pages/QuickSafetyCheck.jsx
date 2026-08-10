import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, FaArrowLeft, FaShieldAlt, FaBaby, FaBabyCarriage, 
    FaUserEdit, FaProcedures, FaHeartbeat, FaPills, FaExclamationTriangle,
    FaCheckCircle, FaExclamationCircle, FaSpinner, FaInfoCircle, FaSyringe
} from 'react-icons/fa';
import api from '../utils/api';

const CategoryTitle = ({ type }) => {
    switch (type) {
        case 'pregnancy': return 'Pregnancy';
        case 'lactation': return 'Breastfeeding';
        case 'elderly': return 'Elderly (≥ 65 years old)';
        case 'neonate': return 'Neonates (≤ 28 days old)';
        case 'kidney_failure': return 'Kidney Failure';
        case 'liver_failure': return 'Liver Failure';
        case 'drug_interactions': return 'Drug Interactions';
        case 'iv_incompatibility': return 'IV Drug Incompatibility';
        default: return type;
    }
};

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('contraindicate') || s.includes('avoid') || s.includes('unsafe')) {
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><FaExclamationCircle /> UNSAFE</span>;
    }
    return null;
};

const QuickSafetyCheck = () => {
    const navigate = useNavigate();
    const [drugName, setDrugName] = useState('');
    const [medList, setMedList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user is healthcare_client
    const isHealthcareClient = user?.role === 'healthcare_client' || user?.account_type === 'healthcare_client';

    // Filter out IV incompatibility for healthcare_client
    const filterIVIncompatibility = (safetyProfile) => {
        if (isHealthcareClient && safetyProfile) {
            const { iv_incompatibility, ...filteredProfile } = safetyProfile;
            return filteredProfile;
        }
        return safetyProfile;
    };

    const handleAddMedication = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (drugName.trim()) {
                const newMeds = drugName.split(',').map(m => m.trim()).filter(Boolean);
                setMedList(prev => [...new Set([...prev, ...newMeds])]);
                setDrugName('');
            }
        }
    };

    const removeMedication = (medToRemove) => {
        setMedList(prev => prev.filter(m => m !== medToRemove));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        let currentMeds = [...medList];
        if (drugName.trim()) {
            const newMeds = drugName.split(',').map(m => m.trim()).filter(Boolean);
            currentMeds = [...new Set([...currentMeds, ...newMeds])];
            setMedList(currentMeds);
            setDrugName('');
        }

        if (currentMeds.length === 0) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await api.post('/quick-safety', { 
                medications: currentMeds,
                category: selectedCategory === 'all' ? null : selectedCategory
            });
            
            console.log('Full API Response:', response);
            
            if (response.success && response.safetyProfile) {
                if (!response.safetyProfile.iv_incompatibility && !isHealthcareClient) {
                    response.safetyProfile.iv_incompatibility = [];
                }
                
                const filteredProfile = filterIVIncompatibility(response.safetyProfile);
                
                console.log('Safety Profile:', filteredProfile);
                console.log('Major Interactions:', filteredProfile.major_interactions);
                console.log('IV Incompatibility:', filteredProfile.iv_incompatibility);
                
                setResult(filteredProfile);
            } else {
                setError('Failed to retrieve safety data. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.error || 'Failed to check medication. It might not be recognized.');
        } finally {
            setLoading(false);
        }
    };

    // Check if we're searching for a single medication
    const isSingleMedication = () => {
        return medList.length === 1;
    };

    // Get unsafe categories only with filtering
    const getFilteredUnsafeCategories = () => {
        if (!result || !result.categories) return [];
        
        const unsafe = Object.entries(result.categories)
            .filter(([key, data]) => {
                const status = data.status?.toLowerCase() || '';
                return status.includes('contraindicate') || 
                       status.includes('avoid') || 
                       status.includes('unsafe');
            });
        
        if (selectedCategory === 'all') {
            return unsafe;
        }
        return unsafe.filter(([key]) => key === selectedCategory);
    };

    const hasUnsafeInFiltered = () => {
        return getFilteredUnsafeCategories().length > 0;
    };

    // Helper function to check if interaction contains drug names
    const containsSearchedDrugs = (text) => {
        return medList.some(med => 
            text.toLowerCase().includes(med.toLowerCase())
        );
    };

    // Helper function to check if text is a generic message or specific interaction
    const isGenericMessage = (text) => {
        const genericPhrases = [
            'አንድ ላይ ለመውሰድ የማይመከሩ',
            'IV Drug Incompatibility',
            'Major Drug Interactions'
        ];
        return genericPhrases.some(phrase => text.includes(phrase));
    };

    // Get filtered interactions - shows all for single drug, filtered for multiple
    const getFilteredInteractions = () => {
        if (!result || !result.major_interactions) return [];
        
        // If only one drug is searched, show ALL interactions but filter out generic messages
        if (isSingleMedication()) {
            return result.major_interactions.filter(interaction => 
                !isGenericMessage(interaction)
            );
        }
        
        // For multiple drugs, filter to show only interactions that contain the searched drugs
        const filtered = result.major_interactions.filter(interaction => {
            // Skip generic messages
            if (isGenericMessage(interaction)) return false;
            // Check if the interaction contains any of the searched drugs
            return containsSearchedDrugs(interaction);
        });
        
        return filtered;
    };

    // Get filtered IV incompatibilities - shows all for single drug, filtered for multiple
    const getFilteredIVIncompatibilities = () => {
        if (!result || !result.iv_incompatibility) return [];
        
        // If only one drug is searched, show ALL incompatibilities but filter out generic messages
        if (isSingleMedication()) {
            return result.iv_incompatibility.filter(incompatibility => 
                !isGenericMessage(incompatibility)
            );
        }
        
        // For multiple drugs, filter to show only incompatibilities that contain the searched drugs
        const filtered = result.iv_incompatibility.filter(incompatibility => {
            // Skip generic messages
            if (isGenericMessage(incompatibility)) return false;
            // Check if the incompatibility contains any of the searched drugs
            return containsSearchedDrugs(incompatibility);
        });
        
        return filtered;
    };

    // Check if there are any interactions to show
    const hasInteractionsToShow = () => {
        if (!result || !result.major_interactions) return false;
        if (selectedCategory !== 'all' && selectedCategory !== 'drug_interactions') return false;
        
        const filtered = getFilteredInteractions();
        
        if (isSingleMedication()) {
            // For single medication, show if there are any specific interactions
            return filtered && filtered.length > 0;
        } else {
            // For multiple medications, filter to show only interactions with drug combinations
            const withDrugCombinations = filtered.filter(item => 
                item.includes(' + ') || item.toLowerCase().includes('with')
            );
            return withDrugCombinations && withDrugCombinations.length > 0;
        }
    };

    // Check if there are any IV incompatibilities to show
    const hasIVIncompatibilityToShow = () => {
        if (isHealthcareClient) return false;
        if (!result || !result.iv_incompatibility) return false;
        if (selectedCategory !== 'all' && selectedCategory !== 'iv_incompatibility') return false;
        
        const filtered = getFilteredIVIncompatibilities();
        
        if (isSingleMedication()) {
            // For single medication, show if there are any specific incompatibilities
            return filtered && filtered.length > 0;
        } else {
            // For multiple medications, filter to show only incompatibilities with drug combinations
            const withDrugCombinations = filtered.filter(item => 
                item.includes(' + ') || item.toLowerCase().includes('with')
            );
            return withDrugCombinations && withDrugCombinations.length > 0;
        }
    };

    // Check if there's any data to show
    const hasAnyDataToShow = () => {
        if (!result) return false;
        
        const hasUnsafe = hasUnsafeInFiltered();
        const hasInteractions = hasInteractionsToShow();
        const hasIVIncompatibility = hasIVIncompatibilityToShow();
        
        console.log('hasUnsafe:', hasUnsafe);
        console.log('hasInteractions:', hasInteractions);
        console.log('hasIVIncompatibility:', hasIVIncompatibility);
        
        return hasUnsafe || hasInteractions || hasIVIncompatibility;
    };

    const shouldShowIVCategory = () => {
        return !isHealthcareClient;
    };

    // Helper function to format interaction display
    const formatInteractionDisplay = (interaction) => {
        // If it already has a warning emoji, return as is
        if (interaction.includes('⚠️')) {
            return interaction;
        }
        // Add warning emoji
        return `⚠️ ${interaction}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
                    >
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <FaShieldAlt className="text-blue-600" /> Quick Safety Check
                    </h1>
                    <div className="w-20"></div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
                {/* Search Hero */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl text-center mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Check Medication Safety</h2>
                        <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90 font-medium">
                            Enter one or more generic drug names to check safety and interactions.
                        </p>
                        
                        <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group flex flex-col md:flex-row gap-3 items-start">
                            <div className="relative flex-1 flex flex-col w-full">
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="e.g., Ibuprofen (Press Enter to add)"
                                        value={drugName}
                                        onChange={(e) => setDrugName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMedication(e)}
                                        className="w-full bg-white text-gray-800 px-6 py-4 pl-12 rounded-xl text-lg font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-400"
                                    />
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                    <button 
                                        type="button"
                                        onClick={handleAddMedication}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                {medList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 p-2 bg-white/10 rounded-xl">
                                        {medList.map((med, idx) => (
                                            <span key={idx} className="bg-white text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                                {med}
                                                <button type="button" onClick={() => removeMedication(med)} className="text-blue-400 hover:text-red-500">
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-white text-gray-800 px-4 py-4 rounded-xl text-base font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-400/50 appearance-none cursor-pointer border-r-8 border-transparent"
                            >
                                <option value="all">All Conditions</option>
                                <option value="pregnancy">Pregnancy</option>
                                <option value="lactation">Breastfeeding</option>
                                <option value="elderly">Elderly (≥ 65 years old)</option>
                                <option value="neonate">Neonates</option>
                                <option value="kidney_failure">Kidney Failure</option>
                                <option value="liver_failure">Liver Failure</option>
                                <option value="drug_interactions">Drug Interactions</option>
                                {shouldShowIVCategory() && (
                                    <option value="iv_incompatibility">IV Drug Incompatibility</option>
                                )}
                            </select>

                            <button 
                                type="submit"
                                disabled={loading || (medList.length === 0 && !drugName.trim())}
                                className="bg-blue-900 hover:bg-gray-900 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : 'Check Safety'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-fadeIn mb-8">
                        <FaExclamationTriangle className="text-red-500 text-xl" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <FaShieldAlt className="text-4xl text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing...</h3>
                        <p className="text-gray-500">Checking clinical safety guidelines across special populations.</p>
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div className="animate-fadeIn space-y-6">
                        {hasAnyDataToShow() ? (
                            <>
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                                    <h3 className="text-3xl font-black text-gray-900 capitalize mb-2">
                                        {isSingleMedication() ? result.medication : medList.join(', ')}
                                    </h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">{result.general_overview}</p>
                                </div>

                                {/* Show unsafe categories with proper filtering */}
                                {hasUnsafeInFiltered() && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredUnsafeCategories().map(([key, data]) => (
                                            <div key={key} className="bg-red-50 rounded-2xl p-6 shadow-sm border-2 border-red-400 hover:border-red-600 transition-colors group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-gray-800 text-lg"><CategoryTitle type={key} /></h4>
                                                    </div>
                                                    <StatusBadge status={data.status} />
                                                </div>
                                                <p className="text-gray-700 leading-relaxed text-base font-bold">{data.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Major Drug Interactions - Conditional display based on single/multiple medications */}
                                {hasInteractionsToShow() && (
                                    <div className="bg-amber-50 rounded-2xl p-6 md:p-8 shadow-sm border border-amber-200 mt-6">
                                        <h4 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-4">
                                            <FaPills className="text-amber-600" /> Major Drug Interactions (Avoid With)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 text-amber-800 font-medium ml-2">
                                            {isSingleMedication() ? (
                                                // For single medication - show ALL specific interactions
                                                getFilteredInteractions().map((interaction, i) => (
                                                    <li key={i}>{formatInteractionDisplay(interaction)}</li>
                                                ))
                                            ) : (
                                                // For multiple medications - filter to show only interactions with drug combinations
                                                getFilteredInteractions()
                                                    .filter(interaction => 
                                                        interaction.includes(' + ') || 
                                                        interaction.toLowerCase().includes('with')
                                                    )
                                                    .map((interaction, i) => (
                                                        <li key={i}>{formatInteractionDisplay(interaction)}</li>
                                                    ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* IV Drug Incompatibility - Conditional display based on single/multiple medications */}
                                {hasIVIncompatibilityToShow() && (
                                    <div className="bg-red-50 rounded-2xl p-6 md:p-8 shadow-sm border border-red-200 mt-6">
                                        <h4 className="text-xl font-bold text-red-900 flex items-center gap-2 mb-4">
                                            <FaSyringe className="text-red-600" /> IV Drug Incompatibility (Do Not Mix)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 text-red-800 font-medium ml-2">
                                            {isSingleMedication() ? (
                                                // For single medication - show ALL specific incompatibilities
                                                getFilteredIVIncompatibilities().map((incompatibility, i) => (
                                                    <li key={i}>{formatInteractionDisplay(incompatibility)}</li>
                                                ))
                                            ) : (
                                                // For multiple medications - filter to show only incompatibilities with drug combinations
                                                getFilteredIVIncompatibilities()
                                                    .filter(incompatibility => 
                                                        incompatibility.includes(' + ') || 
                                                        incompatibility.toLowerCase().includes('with')
                                                    )
                                                    .map((incompatibility, i) => (
                                                        <li key={i}>{formatInteractionDisplay(incompatibility)}</li>
                                                    ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Show when NO data is detected in the filtered results */
                            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 md:p-12 shadow-lg text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div>
                                        <p className="text-green-600 text-lg font-black max-w-2xl mx-auto">
                                            በተመረጡት የጤና ሁኔታዎች {selectedCategory !== 'all' && ` [${CategoryTitle({ type: selectedCategory })}]`} {isSingleMedication() ? result.medication : medList.join(', ')}ን 
                                            ለደህንነት ሲባል እንዳንጠቀም የሚያስጠነቅቅ መረጃ በአዲስ ሜድ (Addis Med) ውስጥ አልተገኘም። ሁልጊዜም የጤና ባለሙያ ያማክሩ።
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
                            <FaInfoCircle /> Disclaimer: This information is for educational purposes only and does not replace consultation with a qualified healthcare professional. Medication information may change with emerging evidence, manufacturers' current prescribing information, and evolving medical practice. Users are responsible for verifying all information and exercising health professional's judgment. 
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuickSafetyCheck;
