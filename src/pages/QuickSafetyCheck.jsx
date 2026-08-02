import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, FaArrowLeft, FaShieldAlt, FaBaby, FaBabyCarriage, 
    FaUserEdit, FaProcedures, FaHeartbeat, FaPills, FaExclamationTriangle,
    FaCheckCircle, FaExclamationCircle, FaSpinner, FaInfoCircle
} from 'react-icons/fa';
import api from '../utils/api';

const CategoryTitle = ({ type }) => {
    switch (type) {
        case 'pregnancy': return 'Pregnancy';
        case 'lactation': return 'Breastfeeding';
        case 'elderly': return 'Elderly (≥ 65 years old)';
        case 'neonate': return 'Neonates';
        case 'kidney_failure': return 'Kidney Failure';
        case 'liver_failure': return 'Liver Failure';
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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!drugName.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await api.post('/quick-safety', { 
                medication: drugName.trim(),
                category: selectedCategory === 'all' ? null : selectedCategory
            });
            if (response.success && response.safetyProfile) {
                setResult(response.safetyProfile);
            } else {
                setError('Failed to retrieve safety data. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError(err.error || 'Failed to check medication. It might not be recognized.');
        } finally {
            setLoading(false);
        }
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
        
        // Apply category filter
        if (selectedCategory === 'all') {
            return unsafe;
        }
        return unsafe.filter(([key]) => key === selectedCategory);
    };

    // Check if there are any unsafe categories
    const hasUnsafeInFiltered = () => {
        return getFilteredUnsafeCategories().length > 0;
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
                            Enter generic drug name to see if it's unsafe for pregnancy, breastfeeding, neonate, the elderly, or those with organ failure.
                        </p>
                        
                        <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text"
                                    placeholder="e.g., Ibuprofen, Amoxicillin..."
                                    value={drugName}
                                    onChange={(e) => setDrugName(e.target.value)}
                                    className="w-full bg-white text-gray-800 px-6 py-4 pl-12 rounded-xl text-lg font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-400"
                                />
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
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
                            </select>

                            <button 
                                type="submit"
                                disabled={loading || !drugName.trim()}
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
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing {drugName}...</h3>
                        <p className="text-gray-500">Checking clinical safety guidelines across special populations.</p>
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div className="animate-fadeIn space-y-6">
                        {hasUnsafeInFiltered() ? (
                            <>

                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                                    <h3 className="text-3xl font-black text-gray-900 capitalize mb-2">{result.medication}</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">{result.general_overview}</p>
                                </div>

                                {/* Show ONLY unsafe categories with proper filtering */}
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

                                {/* Major Interactions */}
                                {result.major_interactions && result.major_interactions.length > 0 && (
                                    <div className="bg-amber-50 rounded-2xl p-6 md:p-8 shadow-sm border border-amber-200 mt-6">
                                        <h4 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-4">
                                            <FaPills className="text-amber-600" /> Major Drug Interactions (Avoid With)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 text-amber-800 font-medium ml-2">
                                            {result.major_interactions.map((interaction, i) => (
                                                <li key={i}>{interaction}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Show when NO unsafe is detected in the filtered results */
                            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 md:p-12 shadow-lg text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div>
                                        <p className="text-green-600 text-xl font-black max-w-2xl mx-auto">
                                            No contraindication data about {result.medication} in Addis Med for its safe use in the selected condition(s)
                                            {selectedCategory !== 'all' && ` [${CategoryTitle({ type: selectedCategory })}]`}.
                                            Always consult with your healthcare provider.
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
