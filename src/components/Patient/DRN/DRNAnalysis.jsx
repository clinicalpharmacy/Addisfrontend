import React, { useState } from 'react';
import { FaDatabase, FaSpinner, FaChevronDown, FaChevronUp, FaExclamationCircle } from 'react-icons/fa';
import { drnCategories } from '../../../constants/drnConstants';

export const DRNAnalysis = ({ results, isAnalyzing, onRunAnalysis, onReviewFinding }) => {
    const [showAnalysis, setShowAnalysis] = useState(true);

    if (isAnalyzing) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-3" />
                <p className="text-blue-800 font-medium">Running Clinical Decision Support System analysis...</p>
                <p className="text-blue-600 text-sm mt-1">Evaluating drug-related problems against clinical rules</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 flex flex-col items-center justify-center text-center">
                <FaDatabase className="text-4xl text-blue-300 mb-3" />
                <h3 className="text-lg font-medium text-blue-900">Clinical Analysis Ready</h3>
                <p className="text-blue-700 mb-4 max-w-md">Run CDSS to identify potential drug-related problems based on the patient's data.</p>
                <button
                    onClick={onRunAnalysis}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                >
                    <FaDatabase /> Run Analysis
                </button>
            </div>
        );
    }

    // Results Display
    return (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div
                className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => setShowAnalysis(!showAnalysis)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full"><FaDatabase className="text-blue-600" /></div>
                    <div>
                        <h3 className="font-semibold text-gray-800">CDSS Analysis Results</h3>
                        <p className="text-sm text-gray-500">{results.totalFindings} potential problems identified</p>
                    </div>
                </div>
                {showAnalysis ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </div>

            {showAnalysis && (
                <div className="p-4 space-y-4">
                    {/* Summary Bar */}
                    <div className="flex flex-wrap gap-2 text-sm justify-center mb-4">
                        {Object.entries(results.findingsByCategory || {}).map(([cat, findings]) => {
                            if (!findings || findings.length === 0) return null;
                            const catData = drnCategories[cat] || {};
                            return (
                                <span key={cat} className={`px-3 py-1 rounded-full border flex items-center gap-2 ${catData.color ? `bg-${catData.color}-50 text-${catData.color}-700 border-${catData.color}-200` : 'bg-gray-100'}`}>
                                    {catData.icon && <catData.icon />} {cat}: <strong>{findings.length}</strong>
                                </span>
                            );
                        })}
                    </div>

                    {/* Findings List */}
                    {results.findings?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.findings.map((finding, idx) => (
                                <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition border-l-4" style={{ borderLeftColor: getSeverityColor(finding.severity) }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-gray-800">{finding.cause}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded text-white uppercase ${getSeverityClass(finding.severity)}`}>
                                            {finding.severity || 'Moderate'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{finding.message}</p>
                                    {finding.recommendation && (
                                        <div className="bg-green-50 p-2 rounded text-xs text-green-800 mb-3 block">
                                            <strong>Recommendation:</strong> {finding.recommendation}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => onReviewFinding(finding)}
                                        className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
                                    >
                                        Review & Add to Assessment
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                            <FaExclamationCircle className="text-2xl mb-2 text-green-500" />
                            <p>No evident drug-related problems detected by the rule engine.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helpers for color mapping (need to use standard Tailwind classes or style objects if dynamic)
const getSeverityColor = (sev) => {
    if (sev === 'critical') return '#ef4444';
    if (sev === 'high') return '#f97316';
    return '#eab308'; // moderate
};

const getSeverityClass = (sev) => {
    if (sev === 'critical') return 'bg-red-500';
    if (sev === 'high') return 'bg-orange-500';
    if (sev === 'low') return 'bg-blue-500';
    return 'bg-yellow-500';
};
